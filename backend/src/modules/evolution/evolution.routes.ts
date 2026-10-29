import { Router } from 'express';
import {
  getPatientEvolutions,
  createEvolutionNote,
  createAddendum,
} from './evolution.controller.js';
import {
  getPatientConsents,
  createInformedConsent,
} from './consent.controller.js';
import { authenticateToken, authorizeRoles } from '../../middleware/auth.js';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticateToken);

router.get('/patient/:patientId', getPatientEvolutions);
router.post('/', authorizeRoles(Role.DENTIST, Role.ADMIN), createEvolutionNote);
router.post('/:id/addendum', authorizeRoles(Role.DENTIST, Role.ADMIN), createAddendum);

// RF-06: Consentimientos Informados Digitales con Firma Biométrica
router.get('/consents/patient/:patientId', getPatientConsents);
router.post('/consents', authorizeRoles(Role.DENTIST, Role.ADMIN, Role.RECEPTIONIST), createInformedConsent);

export default router;
