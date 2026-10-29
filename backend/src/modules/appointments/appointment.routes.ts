import { Router } from 'express';
import {
  getAppointments,
  createAppointment,
  updateAppointmentStatus,
} from './appointment.controller.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getAppointments);
router.post('/', createAppointment);
router.patch('/:id/status', updateAppointmentStatus);

export default router;
