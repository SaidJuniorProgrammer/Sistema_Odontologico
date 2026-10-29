import { Response } from 'express';
import { z } from 'zod';
import { AppointmentStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { AuthRequest } from '../../middleware/auth.js';
import { logAudit } from '../../middleware/audit.js';

const appointmentSchema = z.object({
  patientId: z.string().uuid('ID de paciente inválido'),
  dentistId: z.string().uuid('ID de odontólogo inválido'),
  dentalChairId: z.string().uuid('ID de sillón inválido'),
  startDateTime: z.string().datetime(),
  endDateTime: z.string().datetime(),
  reason: z.string().min(3, 'Motivo de la cita requerido'),
  notes: z.string().optional().nullable(),
});

export const getAppointments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { date, dentistId, dentalChairId, status, from, to } = req.query;

    const where: any = {};

    if (dentistId) where.dentistId = String(dentistId);
    if (dentalChairId) where.dentalChairId = String(dentalChairId);
    if (status) where.status = status as AppointmentStatus;

    if (from && to) {
      where.startDateTime = {
        gte: new Date(String(from)),
        lte: new Date(String(to)),
      };
    } else if (date) {
      const selectedDate = new Date(String(date));
      const startOfDay = new Date(selectedDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(selectedDate.setHours(23, 59, 59, 999));
      where.startDateTime = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            identification: true,
            phone: true,
            medicalAlerts: { where: { active: true } },
          },
        },
        dentist: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            specialty: true,
          },
        },
        dentalChair: {
          select: {
            id: true,
            name: true,
            roomNumber: true,
          },
        },
      },
      orderBy: { startDateTime: 'asc' },
    });

    res.json({ appointments });
  } catch (error: any) {
    console.error('Error al listar citas:', error);
    res.status(500).json({ error: 'Error al consultar citas de la agenda.' });
  }
};

export const createAppointment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = appointmentSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message });
      return;
    }

    const { patientId, dentistId, dentalChairId, startDateTime, endDateTime, reason, notes } =
      parsed.data;

    const start = new Date(startDateTime);
    const end = new Date(endDateTime);

    if (end <= start) {
      res.status(400).json({ error: 'La hora de fin debe ser posterior a la hora de inicio.' });
      return;
    }

    // -------------------------------------------------------------
    // REGLA DE NEGOCIO RN-03: Validación de Sobreposición de Sillones
    // El sistema no debe permitir agendar dos citas simultáneas en
    // el mismo sillón físico, independientemente de los odontólogos.
    // -------------------------------------------------------------
    const chairConflict = await prisma.appointment.findFirst({
      where: {
        dentalChairId,
        status: { notIn: [AppointmentStatus.CANCELADO, AppointmentStatus.NO_ASISTIO] },
        OR: [
          {
            startDateTime: { lt: end },
            endDateTime: { gt: start },
          },
        ],
      },
      include: {
        dentalChair: true,
      },
    });

    if (chairConflict) {
      res.status(409).json({
        error: `RN-03: Conflicto de recursos. El sillón físico '${chairConflict.dentalChair.name}' ya tiene una cita reservada entre ${chairConflict.startDateTime.toLocaleTimeString()} y ${chairConflict.endDateTime.toLocaleTimeString()}.`,
      });
      return;
    }

    // Validación de disponibilidad del profesional odontólogo
    const dentistConflict = await prisma.appointment.findFirst({
      where: {
        dentistId,
        status: { notIn: [AppointmentStatus.CANCELADO, AppointmentStatus.NO_ASISTIO] },
        OR: [
          {
            startDateTime: { lt: end },
            endDateTime: { gt: start },
          },
        ],
      },
      include: {
        dentist: true,
      },
    });

    if (dentistConflict) {
      res.status(409).json({
        error: `El odontólogo Dr/Dra. ${dentistConflict.dentist.lastName} ya tiene otra cita en ese horario.`,
      });
      return;
    }

    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        dentistId,
        dentalChairId,
        startDateTime: start,
        endDateTime: end,
        reason,
        notes: notes || null,
        status: AppointmentStatus.PROGRAMADO,
      },
      include: {
        patient: true,
        dentist: true,
        dentalChair: true,
      },
    });

    await logAudit(req, 'CREATE', 'Appointment', appointment.id, {
      patientId,
      dentistId,
      dentalChairId,
      startDateTime: start,
    });

    res.status(201).json({
      message: 'Cita agendada exitosamente',
      appointment,
    });
  } catch (error: any) {
    console.error('Error al agendar cita:', error);
    res.status(500).json({ error: 'Error al agendar cita odontológica.' });
  }
};

export const updateAppointmentStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, cancellationReason } = req.body;

    if (!Object.values(AppointmentStatus).includes(status)) {
      res.status(400).json({ error: 'Estado de cita no válido' });
      return;
    }

    const updatePayload: any = { status };
    const now = new Date();

    if (status === AppointmentStatus.CONFIRMADO) updatePayload.confirmedAt = now;
    if (status === AppointmentStatus.EN_SALA) updatePayload.arrivedAt = now;
    if (status === AppointmentStatus.EN_ATENCION) updatePayload.startedAt = now;
    if (status === AppointmentStatus.ATENDIDO) updatePayload.completedAt = now;
    if (status === AppointmentStatus.CANCELADO && cancellationReason) {
      updatePayload.cancellationReason = cancellationReason;
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data: updatePayload,
      include: {
        patient: true,
        dentist: true,
        dentalChair: true,
      },
    });

    await logAudit(req, 'UPDATE', 'AppointmentStatus', appointment.id, { newStatus: status });

    res.json({ message: `Estado actualizado a ${status}`, appointment });
  } catch (error: any) {
    res.status(500).json({ error: 'Error al actualizar estado de la cita.' });
  }
};
