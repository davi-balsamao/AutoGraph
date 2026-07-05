import fs from 'fs';
import path from 'path';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';
import webhookRoutes from './routes/webhook.routes';
import osRoutes from './routes/os.routes';
import authRoutes from './routes/auth.routes';
import produtoRoutes from './routes/produto.routes';
import notificationRoutes from './routes/notification.routes';
import propostasRoutes from './routes/propostas.routes';
import conversasRoutes from './routes/conversas.routes';
import { prisma } from './config/prisma';
import { cronService } from './services/cron.service';
import { whatsappService } from './services/whatsapp.service';
import { requireAuth, verifyToken, AuthUser } from './middleware/auth.middleware';

// Carregamento Físico do .env
try {
  const envPath = path.resolve(process.cwd(), '.env');
  const envFile = fs.readFileSync(envPath);
  const envConfig = dotenv.parse(envFile);

  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
  console.log(`✅ SUCESSO: Lemos fisicamente ${Object.keys(envConfig).length} variáveis do arquivo .env!`);
} catch (error) {
  console.error("❌ ERRO FATAL: O Node não encontrou o arquivo .env");
}

const app = express();
const port = process.env.PORT || 3000;

if (!process.env.JWT_SECRET) {
  throw new Error('❌ JWT_SECRET não definido no .env — o servidor não pode subir sem ele.');
}

// CORS: origens de browser permitidas via ALLOWED_ORIGINS (separadas por vírgula).
// Requisições sem header Origin (apps mobile, curl, webhooks da Meta) são sempre aceitas.
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const corsOrigin = (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
  if (!origin) return callback(null, true);
  if (allowedOrigins.includes(origin)) return callback(null, true);
  // Sem ALLOWED_ORIGINS configurado, liberamos localhost para desenvolvimento.
  if (allowedOrigins.length === 0 && /^https?:\/\/(localhost|127\.0\.0\.1|10\.0\.2\.2)(:\d+)?$/.test(origin)) {
    return callback(null, true);
  }
  return callback(new Error(`Origem não permitida pelo CORS: ${origin}`));
};

// Configuração do Servidor HTTP e Socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: corsOrigin,
    methods: ["GET", "POST"]
  }
});

export { io };

// Autenticação do Socket.io: o app envia o JWT no handshake (auth.token).
io.use((socket, next) => {
  const token = socket.handshake.auth?.token as string | undefined;
  const user = token ? verifyToken(token) : null;

  if (!user) {
    console.warn(`🔒 Conexão de socket recusada (token ausente ou inválido)`);
    return next(new Error('Autenticação necessária.'));
  }

  socket.data.user = user;
  return next();
});

app.use(cors({ origin: corsOrigin }));
app.use(
  express.json({
    verify: (req: any, res, buf) => {
      req.rawBody = buf;
    },
  })
);

// Monitoramento de conexão socket
io.on('connection', (socket) => {
  const socketUser = socket.data.user as AuthUser;
  console.log(`🔌 Novo dispositivo conectado ao Socket: ${socket.id} (${socketUser.nome} - ${socketUser.role})`);

  // INTERCEPTADOR DE MENSAGENS DO ADMIN
  socket.on('message', async (data) => {
    // Só o GERENTE autenticado pode responder como admin — a role vem do JWT
    // validado no handshake, nunca do payload enviado pelo cliente.
    if (data.senderId === 'admin' && socketUser.role !== 'GERENTE') {
      console.warn(`🚫 Socket ${socket.id} (${socketUser.nome}) tentou enviar como admin sem ser GERENTE.`);
      return;
    }
    if (data.senderId === 'admin') {
      try {
        console.log(`📤 [SOCKET -> WPP] Admin respondendo para o telefone: ${data.receiverId}`);
        // 1. Atira a mensagem para a API oficial do WhatsApp da Meta
        await whatsappService.sendMessage(data.receiverId, data.text);

        // 2. SILENCIADOR DA IA: Atualiza o banco de dados para avisar que o humano assumiu!
        const cliente = await prisma.usuario.findFirst({ where: { telefone: data.receiverId } });
        if (cliente) {
          await prisma.usuario.update({
            where: { id: cliente.id },
            data: { atendimentoHumano: true }
          });

          // Salva o estado atual na sessão para restaurar corretamente depois!
          const sessao = await prisma.sessaoAtendimento.findFirst({
            where: { clienteId: cliente.id, ativa: true },
            orderBy: { criadoEm: 'desc' },
          });

          if (sessao) {
            const ctx = sessao.contexto as Record<string, any> || {};
            if (!ctx.estadoSalvoTakeover) {
              ctx.estadoSalvoTakeover = sessao.estadoAtual;
              await prisma.sessaoAtendimento.update({
                where: { id: sessao.id },
                data: { contexto: ctx },
              });
            }
          }
        }
        console.log(`🤫 IA desativada para o cliente ${data.receiverId} (Humano assumiu a conversa)`);

        console.log(`✅ [WPP] Mensagem do Admin entregue com sucesso!`);
      } catch (error) {
        console.error(`❌ [WPP] Erro ao enviar mensagem do Admin:`, error);
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('🔌 Dispositivo desconectado');
  });
});

app.get('/', (req, res) => {
  res.json({ message: 'Hello World from AutoGraph API!' });
});

app.use('/uploads', requireAuth, express.static(path.resolve(__dirname, '../data/uploads')));
app.use(webhookRoutes);
app.use('/api/os', osRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/propostas', propostasRoutes);
app.use('/api/conversas', conversasRoutes);

// Rotas de Produtos
app.use('/api/produtos', produtoRoutes);

app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'ok', database: 'connected' });
  } catch (error) {
    console.error('❌ ERRO NO HEALTH CHECK (Banco de Dados Inacessível):', error);
    res.status(503).json({ status: 'error', database: 'disconnected', message: 'Serviço indisponível' });
  }
});

server.listen(port, () => {
  console.log(`🚀 Servidor e Socket.io rodando na porta ${port}`);
  cronService.start();
});
