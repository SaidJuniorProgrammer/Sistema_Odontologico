import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { AuthRequest } from '../../middleware/auth.js';
import { logAudit } from '../../middleware/audit.js';

const periodontogramEntrySchema = z.object({
  patientId: z.string().uuid(),
  toothNumber: z.number().int(),
  site: z.enum(['MV', 'V', 'DV', 'ML', 'L', 'DL']), // 6 sitios por pieza dental
  pocketDepthMm: z.number().int().min(0).max(15),
  gingivalMarginMm: z.number().int().min(-10).max(10).default(0),
  furcationGrade: z.number().int().min(0).max(3).optional().nullable(),
  mobilityGrade: z.number().int().min(0).max(3).optional().nullable(),
  bleedingOnProbing: z.boolean().default(false),
  suppuration: z.boolean().default(false),
});

export const getPatientPeriodontogram = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { patientId } = req.params;

    const entries = await prisma.periodontogram.findMany({
      where: { patientId },
      include: {
        dentist: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: [{ toothNumber: 'asc' }, { site: 'asc' }],
    });

    res.json({ periodontogram: entries });
  } catch (error: any) {
    res.status(500).json({ error: 'Error al consultar periodontograma.' });
  }
};

export const savePeriodontalMeasurement = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = periodontogramEntrySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message });
      return;
    }

    const {
      patientId,
      toothNumber,
      site,
      pocketDepthMm,
      gingivalMarginMm,
      furcationGrade,
      mobilityGrade,
      bleedingOnProbing,
      suppuration,
    } = parsed.data;

    const dentistId = req.user!.id;
    // Cálculo automático del Nivel de Inserción Clínica (NIC / CAL)
    const clinicalAttachmentLevel = pocketDepthMm + gingivalMarginMm;

    // Buscar si ya existe medición previa en esa pieza y sitio
    const existing = await prisma.periodontogram.findFirst({
      where: { patientId, toothNumber, site },
    });

    let entry;
    if (existing) {
      entry = await prisma.periodontogram.update({
        where: { id: existing.id },
        data: {
          dentistId,
          pocketDepthMm,
          gingivalMarginMm,
          clinicalAttachmentLevel,
          furcationGrade: furcationGrade || null,
          mobilityGrade: mobilityGrade || null,
          bleedingOnProbing,
          suppuration,
          evaluationDate: new Date(),
        },
      });
    } else {
      entry = await prisma.periodontogram.create({
        data: {
          patientId,
          dentistId,
          toothNumber,
          site,
          pocketDepthMm,
          gingivalMarginMm,
          clinicalAttachmentLevel,
          furcationGrade: furcationGrade || null,
          mobilityGrade: mobilityGrade || null,
          bleedingOnProbing,
          suppuration,
        },
      });
    }

    await logAudit(req, 'UPDATE', 'Periodontogram', entry.id, {
      patientId,
      toothNumber,
      site,
      pocketDepthMm,
      clinicalAttachmentLevel,
    });

    res.status(201).json({
      message: 'Medición periodontal registrada (RF-04)',
      entry,
    });
  } catch (error: any) {
    console.error('Error al guardar periodontograma:', error);
    res.status(500).json({ error: 'Error al guardar medición periodontal.' });
  }
};
