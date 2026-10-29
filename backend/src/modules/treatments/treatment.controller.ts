import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { AuthRequest } from '../../middleware/auth.js';
import { logAudit } from '../../middleware/audit.js';
import { TreatmentStatus } from '@prisma/client';

const treatmentItemSchema = z.object({
  toothNumber: z.number().int().optional().nullable(),
  procedureCode: z.string().optional().nullable(),
  procedureName: z.string().min(2, 'Nombre de procedimiento requerido'),
  category: z.string().default('General'),
  unitCost: z.number().positive(),
  quantity: z.number().int().positive().default(1),
  discount: z.number().nonnegative().default(0),
});

const treatmentPhaseSchema = z.object({
  phaseNumber: z.number().int().positive(),
  name: z.string().min(2, 'Nombre de fase requerido'),
  items: z.array(treatmentItemSchema),
});

const createTreatmentSchema = z.object({
  patientId: z.string().uuid(),
  dentistId: z.string().uuid(),
  title: z.string().min(3, 'Título del plan requerido'),
  discountRate: z.number().min(0).max(100).default(0),
  notes: z.string().optional().nullable(),
  phases: z.array(treatmentPhaseSchema),
});

export const getPatientTreatments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { patientId } = req.params;

    const treatments = await prisma.treatmentPlan.findMany({
      where: { patientId },
      include: {
        dentist: { select: { id: true, firstName: true, lastName: true, specialty: true } },
        phases: {
          include: { items: true },
          orderBy: { phaseNumber: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ treatments });
  } catch (error: any) {
    res.status(500).json({ error: 'Error al consultar planes de tratamiento.' });
  }
};

export const createTreatmentPlan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = createTreatmentSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message });
      return;
    }

    const { patientId, dentistId, title, discountRate, notes, phases } = parsed.data;

    // Calcular costos
    let totalGross = 0;
    phases.forEach((phase) => {
      phase.items.forEach((item) => {
        const itemTotal = item.unitCost * item.quantity - item.discount;
        totalGross += Math.max(0, itemTotal);
      });
    });

    const discountAmount = totalGross * (discountRate / 100);
    const finalAmount = totalGross - discountAmount;

    const treatmentPlan = await prisma.treatmentPlan.create({
      data: {
        patientId,
        dentistId,
        title,
        status: TreatmentStatus.PROPOSED,
        totalCost: totalGross,
        discountRate: discountRate,
        finalAmount: finalAmount,
        notes: notes || null,
        phases: {
          create: phases.map((phase) => ({
            phaseNumber: phase.phaseNumber,
            name: phase.name,
            items: {
              create: phase.items.map((item) => ({
                toothNumber: item.toothNumber || null,
                procedureCode: item.procedureCode || null,
                procedureName: item.procedureName,
                category: item.category,
                unitCost: item.unitCost,
                quantity: item.quantity,
                discount: item.discount,
                totalCost: Math.max(0, item.unitCost * item.quantity - item.discount),
              })),
            },
          })),
        },
      },
      include: {
        phases: {
          include: { items: true },
        },
      },
    });

    await logAudit(req, 'CREATE', 'TreatmentPlan', treatmentPlan.id, {
      patientId,
      finalAmount,
    });

    res.status(201).json({
      message: 'Plan de tratamiento y presupuesto generado exitosamente',
      treatmentPlan,
    });
  } catch (error: any) {
    console.error('Error al crear plan de tratamiento:', error);
    res.status(500).json({ error: 'Error al generar plan de tratamiento.' });
  }
};

export const updateTreatmentStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!Object.values(TreatmentStatus).includes(status)) {
      res.status(400).json({ error: 'Estado de tratamiento no válido' });
      return;
    }

    const plan = await prisma.treatmentPlan.update({
      where: { id },
      data: {
        status,
        approvedAt: status === TreatmentStatus.ACCEPTED ? new Date() : undefined,
      },
    });

    await logAudit(req, 'UPDATE', 'TreatmentPlanStatus', plan.id, { status });

    res.json({ message: `Plan de tratamiento actualizado a ${status}`, plan });
  } catch (error: any) {
    res.status(500).json({ error: 'Error al actualizar estado del plan de tratamiento.' });
  }
};
