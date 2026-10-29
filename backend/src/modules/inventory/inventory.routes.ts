import { Router } from 'express';
import { getInventory, registerMovement } from './inventory.controller.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getInventory);
router.post('/movement', registerMovement);

export default router;
