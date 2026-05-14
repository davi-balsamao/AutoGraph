import fs from 'fs';
import path from 'path';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import webhookRoutes from './routes/webhook.routes';
import osRoutes from './routes/os.routes';
import authRoutes from './routes/auth.routes';
import produtoRoutes from './routes/produto.routes';

try {
  const envPath = path.resolve(process.cwd(), '.env');
  const envFile = fs.readFileSync(envPath);
  const envConfig = dotenv.parse(envFile);
  
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
  console.log(`✅ SUCESSO: Lemos fisicamente ${Object.keys(envConfig).length} variáveis do arquivo .env!`);
  console.log(`🔍 DATABASE_URL carregada?`, !!process.env.DATABASE_URL);
  console.log(`🔍 WA_ACCESS_TOKEN carregada?`, !!process.env.WA_ACCESS_TOKEN);
} catch (error) {
  console.error("❌ ERRO FATAL: O Node não encontrou o arquivo .env no caminho:", path.resolve(process.cwd(), '.env'));
}

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(
  express.json({
    verify: (req: any, res, buf) => {
      req.rawBody = buf;
    },
  })
);

// Rota principal
app.get('/', (req, res) => {
  res.json({ message: 'Hello World from AutoGraph API!' });
});

// Rotas do webhook
app.use(webhookRoutes);

// Rotas da OS
app.use('/api/os', osRoutes); 

// Rotas de autenticação
app.use('/api/auth', authRoutes);

// Rotas de Produtos
app.use('/api/produtos', produtoRoutes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});