import { Response } from 'express';
import { z } from 'zod';
import {
  ToothSurface,
  SurfaceCondition,
  ToothGeneralCondition,
  NotationType,
  DentitionType,
} from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { AuthRequest } from '../../middleware/auth.js';
import { logAudit } from '../../middleware/audit.js';

const colorMapping: Record<SurfaceCondition, string> = {
  CARIES: '#EF4444', // Rojo
  RESTAURACION_RESINA: '#3B82F6', // Azul
  RESTAURACION_AMALGAMA: '#64748B', // Gris pizarra
  SELLANTE: '#10B981', // Verde esmeralda
  FRACTURA: '#F59E0B', // Ámbar
  INCRUSTACION: '#8B5CF6', // Púrpura
};

const updateSurfaceSchema = z.object({
  toothNumber: z.number().int(),
  surface: z.nativeEnum(ToothSurface),
  condition: z.nativeEnum(SurfaceCondition).nullable(), // null = limpiar superficie
  notes: z.string().optional().nullable(),
});

const updateGeneralToothSchema = z.object({
  toothNumber: z.number().int(),
  condition: z.nativeEnum(ToothGeneralCondition),
  notes: z.string().optional().nullable(),
});

export const getPatientOdontogram = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { patientId } = req.params;

    // Buscar el odontograma más reciente o crearlo si no existe
    let odontogram = await prisma.odontogram.findFirst({
      where: { patientId },
      include: {
        dentist: { select: { id: true, firstName: true, lastName: true } },
        teeth: {
          include: { surfaces: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!odontogram) {
      // Crear odontograma inicial asignado al usuario actual o primer dentista
      const defaultDentistId = req.user?.id || (await prisma.user.findFirst({ where: { role: 'DENTIST' } }))?.id;

      odontogram = await prisma.odontogram.create({
        data: {
          patientId,
          dentistId: defaultDentistId!,
          notationType: NotationType.FDI,
          dentitionType: DentitionType.PERMANENT,
        },
        include: {
          dentist: { select: { id: true, firstName: true, lastName: true } },
          teeth: {
            include: { surfaces: true },
          },
        },
      });
    }

    res.json({ odontogram });
  } catch (error: any) {
    console.error('Error al obtener odontograma:', error);
    res.status(500).json({ error: 'Error al consultar odontograma del paciente.' });
  }
};

export const updateSurface = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { patientId } = req.params;
    const parsed = updateSurfaceSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message });
      return;
    }

    const { toothNumber, surface, condition, notes } = parsed.data;

    // 1. Obtener odontograma activo
    let odontogram = await prisma.odontogram.findFirst({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
    });

    if (!odontogram) {
      odontogram = await prisma.odontogram.create({
        data: {
          patientId,
          dentistId: req.user!.id,
          notationType: NotationType.FDI,
        },
      });
    }

    // 2. Obtener o crear registro del diente
    let toothRecord = await prisma.toothRecord.findUnique({
      where: {
        odontogramId_toothNumber: {
          odontogramId: odontogram.id,
          toothNumber,
        },
      },
    });

    if (!toothRecord) {
      toothRecord = await prisma.toothRecord.create({
        data: {
          odontogramId: odontogram.id,
          toothNumber,
          generalCondition: ToothGeneralCondition.SANO,
        },
      });
    }

    // 3. Si condition es null, eliminar marca de superficie
    if (!condition) {
      await prisma.toothSurfaceRecord.deleteMany({
        where: {
          toothRecordId: toothRecord.id,
          surface,
        },
      });

      res.json({ message: 'Superficie restablecida a sano' });
      return;
    }

    // 4. Upsert de la superficie
    const colorCode = colorMapping[condition];
    const surfaceRecord = await prisma.toothSurfaceRecord.upsert({
      where: {
        toothRecordId_surface: {
          toothRecordId: toothRecord.id,
          surface,
        },
      },
      update: {
        condition,
        colorCode,
        notes: notes || null,
      },
      create: {
        toothRecordId: toothRecord.id,
        surface,
        condition,
        colorCode,
        notes: notes || null,
      },
    });

    await logAudit(req, 'UPDATE', 'OdontogramSurface', surfaceRecord.id, {
      patientId,
      toothNumber,
      surface,
      condition,
    });

    res.json({ message: 'Superficie actualizada correctamente', surfaceRecord });
  } catch (error: any) {
    console.error('Error al actualizar superficie:', error);
    res.status(500).json({ error: 'Error al actualizar superficie dental.' });
  }
};

export const updateGeneralToothCondition = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { patientId } = req.params;
    const parsed = updateGeneralToothSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message });
      return;
    }

    const { toothNumber, condition, notes } = parsed.data;

    let odontogram = await prisma.odontogram.findFirst({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
    });

    if (!odontogram) {
      odontogram = await prisma.odontogram.create({
        data: {
          patientId,
          dentistId: req.user!.id,
          notationType: NotationType.FDI,
        },
      });
    }

    const toothRecord = await prisma.toothRecord.upsert({
      where: {
        odontogramId_toothNumber: {
          odontogramId: odontogram.id,
          toothNumber,
        },
      },
      update: {
        generalCondition: condition,
        notes: notes || null,
      },
      create: {
        odontogramId: odontogram.id,
        toothNumber,
        generalCondition: condition,
        notes: notes || null,
      },
    });

    await logAudit(req, 'UPDATE', 'ToothGeneralCondition', toothRecord.id, {
      patientId,
      toothNumber,
      condition,
    });

    res.json({ message: 'Condición del diente actualizada', toothRecord });
  } catch (error: any) {
    res.status(500).json({ error: 'Error al actualizar condición dental general.' });
  }
};
