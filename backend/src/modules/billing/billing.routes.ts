import { Router } from 'express';
import {
  getCurrentShift,
  openShift,
  closeBlindShift,
  createInvoice,
  getInvoices,
  getCommissionsReport,
} from './billing.controller.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.get('/shifts/current', getCurrentShift);
router.post('/shifts/open', openShift);
router.post('/shifts/close', closeBlindShift);
router.post('/invoices', createInvoice);
router.get('/invoices', getInvoices);
router.get('/commissions', getCommissionsReport);

export default router;
