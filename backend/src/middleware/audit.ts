import { Request } from 'express';
import { AuditAction } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { AuthRequest } from './auth.js';

export async function logAudit(
  req: AuthRequest | Request,
  action: AuditAction,
  entityName: string,
  entityId?: string | null,
  details?: Record<string, any>
) {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id || null;
    const ipAddress =
      (req.headers['x-forwarded-for'] as string) ||
      req.socket.remoteAddress ||
      '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Desconocido';

    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entityName,
        entityId: entityId || null,
        ipAddress,
        userAgent,
        details: details || {},
      },
    });
  } catch (error) {
    // Si falla el log de auditoría, se registra en consola pero no se interrumpe la transacción del paciente
    console.error('Error al registrar auditoría inmutable:', error);
  }
}
