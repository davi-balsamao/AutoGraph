import { Router } from 'express';
import { FinanceController } from '../controllers/finance.controller';

const financeRoutes = Router();
const financeController = new FinanceController();

// GET /api/finance/summary
financeRoutes.get('/summary', financeController.getSummary);

export default financeRoutes;
