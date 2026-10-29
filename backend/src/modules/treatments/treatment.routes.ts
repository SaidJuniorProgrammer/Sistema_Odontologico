import { Router } from 'express';
import {
  getPatientTreatments,
  createTreatmentPlan,
  updateTreatmentStatus,
} from './treatment.controller.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.get('/patient/:patientId', getPatientTreatments);
router.post('/', createTreatmentPlan);
router.patch('/:id/status', updateTreatmentStatus);

export default router;
