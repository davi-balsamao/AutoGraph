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
import { prisma } from './config/prisma';
import { cronService } from './services/cron.service';
import { whatsappService } from './services/whatsapp.service'; 

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

// Configuração do Servidor HTTP e Socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Em produção, restringir para o domínio do app
    methods: ["GET", "POST"]
  }
});

export { io };

app.use(cors());
app.use(
  express.json({
    verify: (req: any, res, buf) => {
      req.rawBody = buf;
    },
  })
);

// Monitoramento de conexão socket
io.on('connection', (socket) => {
  console.log(`🔌 Novo dispositivo conectado ao Socket: ${socket.id}`);
  
  // INTERCEPTADOR DE MENSAGENS DO ADMIN
  socket.on('message', async (data) => {
    // Se a mensagem que chegou no Socket veio do Painel Admin do Flutter...
    if (data.senderId === 'admin') {
      try {
        console.log(`📤 [SOCKET -> WPP] Admin respondendo para o telefone: ${data.receiverId}`);
        // 1. Atira a mensagem para a API oficial do WhatsApp da Meta
        await whatsappService.sendMessage(data.receiverId, data.text);
        
        // 2. SILENCIADOR DA IA: Atualiza o banco de dados para avisar que o humano assumiu!
        await prisma.usuario.updateMany({
          where: { telefone: data.receiverId },
          data: { atendimentoHumano: true }
        });
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

app.use('/uploads', express.static(path.resolve(__dirname, '../data/uploads')));
app.use(webhookRoutes);
app.use('/api/os', osRoutes); 
app.use('/api/auth', authRoutes);
app.use('/api/notifications', notificationRoutes);

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