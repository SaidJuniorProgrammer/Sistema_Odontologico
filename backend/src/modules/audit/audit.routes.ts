import { Router, Response } from 'express';
import { Role } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { authenticateToken, authorizeRoles, AuthRequest } from '../../middleware/auth.js';

const router = Router();

router.use(authenticateToken);
router.use(authorizeRoles(Role.ADMIN, Role.AUDITOR));

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { action, entityName, limit } = req.query;

    const where: any = {};
    if (action) where.action = action;
    if (entityName) where.entityName = String(entityName);

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
      take: limit ? Number(limit) : 100,
    });

    res.json({ logs });
  } catch (error: any) {
    res.status(500).json({ error: 'Error al consultar logs de auditoría inmutable.' });
  }
});

export default router;
