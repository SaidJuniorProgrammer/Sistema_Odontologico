import { Router } from 'express';
import {
  getPatientOdontogram,
  updateSurface,
  updateGeneralToothCondition,
} from './odontogram.controller.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.get('/patient/:patientId', getPatientOdontogram);
router.post('/patient/:patientId/surface', updateSurface);
router.post('/patient/:patientId/tooth', updateGeneralToothCondition);

export default router;
