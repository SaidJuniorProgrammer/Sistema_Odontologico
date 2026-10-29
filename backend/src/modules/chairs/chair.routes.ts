import { Router } from 'express';
import { getChairs, createChair } from './chair.controller.js';
import { authenticateToken, authorizeRoles } from '../../middleware/auth.js';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticateToken);
router.get('/', getChairs);
router.post('/', authorizeRoles(Role.ADMIN), createChair);

export default router;
