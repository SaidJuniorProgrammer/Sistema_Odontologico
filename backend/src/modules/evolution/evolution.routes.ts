import { Router } from 'express';
import {
  getPatientEvolutions,
  createEvolutionNote,
  createAddendum,
} from './evolution.controller.js';
import { authenticateToken, authorizeRoles } from '../../middleware/auth.js';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticateToken);

router.get('/patient/:patientId', getPatientEvolutions);
router.post('/', authorizeRoles(Role.DENTIST, Role.ADMIN), createEvolutionNote);
router.post('/:id/addendum', authorizeRoles(Role.DENTIST, Role.ADMIN), createAddendum);

export default router;
