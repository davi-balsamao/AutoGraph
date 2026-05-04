import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import webhookRoutes from './routes/webhook.routes';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Rota principal
app.get('/', (req, res) => {
  res.json({ message: 'Hello World from AutoGraph API!' });
});

// Rotas do webhook (Cards 5 e 6)
app.use(webhookRoutes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
