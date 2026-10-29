import { Response } from 'express';
import { z } from 'zod';
import { PaymentMethod, ShiftStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { AuthRequest } from '../../middleware/auth.js';
import { logAudit } from '../../middleware/audit.js';

const openShiftSchema = z.object({
  initialCash: z.number().nonnegative(),
  notes: z.string().optional().nullable(),
});

// RN-02: Cierre ciego: el cajero envía obligatoriamente countedCash
const closeShiftSchema = z.object({
  countedCash: z.number().nonnegative(),
  notes: z.string().optional().nullable(),
});

const createInvoiceSchema = z.object({
  patientId: z.string().uuid(),
  subtotal: z.number().positive(),
  taxRate: z.number().nonnegative().default(0),
  payments: z.array(
    z.object({
      paymentMethod: z.nativeEnum(PaymentMethod),
      amount: z.number().positive(),
      referenceCode: z.string().optional().nullable(),
    })
  ),
  notes: z.string().optional().nullable(),
});

export const getCurrentShift = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const shift = await prisma.cashShift.findFirst({
      where: {
        cashierId: req.user!.id,
        status: ShiftStatus.OPEN,
      },
      orderBy: { openedAt: 'desc' },
    });

    res.json({ shift });
  } catch (error: any) {
    res.status(500).json({ error: 'Error al consultar turno de caja.' });
  }
};

export const openShift = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = openShiftSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message });
      return;
    }

    // Verificar si ya tiene un turno abierto
    const existing = await prisma.cashShift.findFirst({
      where: {
        cashierId: req.user!.id,
        status: ShiftStatus.OPEN,
      },
    });

    if (existing) {
      res.status(400).json({ error: 'Ya tiene un turno de caja abierto actualmente.' });
      return;
    }

    const shift = await prisma.cashShift.create({
      data: {
        cashierId: req.user!.id,
        initialCash: parsed.data.initialCash,
        notes: parsed.data.notes || null,
        status: ShiftStatus.OPEN,
      },
    });

    await logAudit(req, 'CREATE', 'CashShiftOpen', shift.id, {
      cashierId: req.user!.id,
      initialCash: parsed.data.initialCash,
    });

    res.status(201).json({ message: 'Turno de caja abierto exitosamente', shift });
  } catch (error: any) {
    res.status(500).json({ error: 'Error al abrir turno de caja.' });
  }
};

export const closeBlindShift = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = closeShiftSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message });
      return;
    }

    const { countedCash, notes } = parsed.data;

    // Buscar turno abierto
    const shift = await prisma.cashShift.findFirst({
      where: {
        cashierId: req.user!.id,
        status: ShiftStatus.OPEN,
      },
      orderBy: { openedAt: 'desc' },
    });

    if (!shift) {
      res.status(400).json({ error: 'No se encontró un turno de caja abierto para cerrar.' });
      return;
    }

    // Calcular cobros en efectivo realizados durante el turno
    const cashPayments = await prisma.payment.findMany({
      where: {
        paymentMethod: PaymentMethod.CASH,
        receivedAt: {
          gte: shift.openedAt,
        },
      },
    });

    const totalCashCollected = cashPayments.reduce(
      (acc, p) => acc + Number(p.amount),
      0
    );

    const systemCalculatedCash = Number(shift.initialCash) + totalCashCollected;
    const difference = countedCash - systemCalculatedCash;

    const closedShift = await prisma.cashShift.update({
      where: { id: shift.id },
      data: {
        status: ShiftStatus.CLOSED,
        closedAt: new Date(),
        countedCash,
        systemCalculatedCash,
        difference,
        notes: notes || shift.notes,
      },
    });

    await logAudit(req, 'UPDATE', 'CashShiftBlindClose', closedShift.id, {
      countedCash,
      systemCalculatedCash,
      difference,
    });

    res.json({
      message: 'Cierre de caja ciego procesado exitosamente (RN-02 Cumplida)',
      shift: closedShift,
      summary: {
        initialCash: Number(shift.initialCash),
        totalCashCollected,
        systemCalculatedCash,
        countedCash,
        difference,
      },
    });
  } catch (error: any) {
    console.error('Error al cerrar caja:', error);
    res.status(500).json({ error: 'Error al procesar cierre de caja.' });
  }
};

export const createInvoice = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = createInvoiceSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message });
      return;
    }

    const { patientId, subtotal, taxRate, payments, notes } = parsed.data;

    const taxAmount = subtotal * (taxRate / 100);
    const totalAmount = subtotal + taxAmount;

    // Generar consecutivo de factura único
    const count = await prisma.invoice.count();
    const invoiceNumber = `FAC-${String(count + 1).padStart(6, '0')}`;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        patientId,
        cashierId: req.user!.id,
        subtotal,
        taxRate,
        taxAmount,
        totalAmount,
        notes: notes || null,
        payments: {
          create: payments.map((p) => ({
            paymentMethod: p.paymentMethod,
            amount: p.amount,
            referenceCode: p.referenceCode || null,
          })),
        },
      },
      include: {
        payments: true,
        patient: { select: { id: true, firstName: true, lastName: true, identification: true } },
      },
    });

    await logAudit(req, 'CREATE', 'Invoice', invoice.id, {
      invoiceNumber,
      totalAmount,
      patientId,
    });

    res.status(201).json({ message: 'Comprobante emitido con éxito', invoice });
  } catch (error: any) {
    console.error('Error al emitir factura:', error);
    res.status(500).json({ error: 'Error al registrar comprobante de pago.' });
  }
};

export const getInvoices = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const invoices = await prisma.invoice.findMany({
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, identification: true } },
        payments: true,
      },
      orderBy: { issueDate: 'desc' },
      take: 50,
    });

    res.json({ invoices });
  } catch (error: any) {
    res.status(500).json({ error: 'Error al consultar comprobantes.' });
  }
};

// RF-13: Liquidación de Honorarios y Comisiones a Profesionales
export const getCommissionsReport = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const dentists = await prisma.user.findMany({
      where: { role: 'DENTIST', active: true },
      include: {
        commissions: {
          include: { invoice: true, treatmentItem: true },
        },
        dentistAppointments: {
          where: { status: 'ATENDIDO' },
        },
      },
    });

    const report = dentists.map((dentist) => {
      const completedAppointments = dentist.dentistAppointments.length;
      // Estimación estándar de honorarios: 40% de facturación por procedimiento
      const estimatedHonoraries = completedAppointments * 35.0; // Tarifa base por consulta realizada

      return {
        dentistId: dentist.id,
        dentistName: `Dr/Dra. ${dentist.firstName} ${dentist.lastName}`,
        specialty: dentist.specialty || 'Odontología General',
        licenseNumber: dentist.licenseNumber || 'OD-REG',
        completedAppointments,
        commissionRatePercent: 40.0,
        estimatedHonoraries,
        commissionsList: dentist.commissions,
      };
    });

    res.json({ commissions: report });
  } catch (error: any) {
    res.status(500).json({ error: 'Error al liquidar honorarios a profesionales.' });
  }
};
