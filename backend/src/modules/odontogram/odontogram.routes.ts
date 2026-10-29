import { Router } from 'express';
import {
  getPatientOdontogram,
  updateSurface,
  updateGeneralToothCondition,
} from './odontogram.controller.js';
import {
  getPatientPeriodontogram,
  savePeriodontalMeasurement,
} from './periodontogram.controller.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.get('/patient/:patientId', getPatientOdontogram);
router.post('/patient/:patientId/surface', updateSurface);
router.post('/patient/:patientId/tooth', updateGeneralToothCondition);

// RF-04: Periodontograma Digital
router.get('/periodontogram/patient/:patientId', getPatientPeriodontogram);
router.post('/periodontogram', savePeriodontalMeasurement);

export default router;
