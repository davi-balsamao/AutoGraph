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
    origin: "*", // Em produção, restringir para o domínio do seu app
    methods: ["GET", "POST"]
  }
});

// Exportamos o 'io' para ser usado nos Services e Controllers
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
  
  socket.on('disconnect', () => {
    console.log('🔌 Dispositivo desconectado');
  });
});

// Rota principal
app.get('/', (req, res) => {
  res.json({ message: 'Hello World from AutoGraph API!' });
});

app.use(webhookRoutes);
app.use('/api/os', osRoutes); 
app.use('/api/auth', authRoutes);

// IMPORTANTE: Usamos 'server.listen' em vez de 'app.listen'
server.listen(port, () => {
  console.log(`🚀 Servidor e Socket.io rodando na porta ${port}`);
});