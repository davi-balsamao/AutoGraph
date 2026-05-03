import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { WebhookController } from './controllers/webhook.controller'; 

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Rota principal
app.get('/', (req, res) => {
  res.json({ message: 'Hello World from AutoGraph API!' });
});

// Rota do webhook
app.get('/webhook', WebhookController.validate);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
