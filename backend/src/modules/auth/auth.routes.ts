import { Router } from 'express';
import { login, getMe, listDentists, listUsers } from './auth.controller.js';
import { authenticateToken, authorizeRoles } from '../../middleware/auth.js';
import { Role } from '@prisma/client';

const router = Router();

router.post('/login', login);
router.get('/me', authenticateToken, getMe);
router.get('/dentists', authenticateToken, listDentists);
router.get('/users', authenticateToken, authorizeRoles(Role.ADMIN), listUsers);

export default router;
