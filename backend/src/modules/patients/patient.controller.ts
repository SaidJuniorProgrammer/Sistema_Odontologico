import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { AuthRequest } from '../../middleware/auth.js';
import { logAudit } from '../../middleware/audit.js';
import { AlertSeverity } from '@prisma/client';

const patientSchema = z.object({
  documentType: z.string().default('DNI'),
  identification: z.string().min(4, 'Identificación requerida'),
  firstName: z.string().min(2, 'Nombre requerido'),
  lastName: z.string().min(2, 'Apellido requerido'),
  birthDate: z.string(), // ISO string
  gender: z.string().min(1, 'Género requerido'),
  email: z.string().email().optional().nullable().or(z.literal('')),
  phone: z.string().min(6, 'Teléfono requerido'),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  emergencyContactName: z.string().optional().nullable(),
  emergencyContactPhone: z.string().optional().nullable(),
  legalGuardianName: z.string().optional().nullable(),
  legalGuardianPhone: z.string().optional().nullable(),
  insuranceProvider: z.string().optional().nullable(),
  insurancePolicyNumber: z.string().optional().nullable(),
  bloodType: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  initialAlerts: z
    .array(
      z.object({
        conditionName: z.string(),
        severity: z.nativeEnum(AlertSeverity).default(AlertSeverity.CRITICAL),
        requiresPremedication: z.boolean().default(false),
        notes: z.string().optional().nullable(),
      })
    )
    .optional(),
});

export const getPatients = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const search = req.query.search as string;

    const whereClause: any = { active: true };
    if (search) {
      whereClause.OR = [
        { identification: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const patients = await prisma.patient.findMany({
      where: whereClause,
      include: {
        medicalAlerts: {
          where: { active: true },
          select: {
            id: true,
            conditionName: true,
            severity: true,
            requiresPremedication: true,
          },
        },
      },
      orderBy: { lastName: 'asc' },
      take: 100,
    });

    res.json({ patients });
  } catch (error: any) {
    console.error('Error al listar pacientes:', error);
    res.status(500).json({ error: 'Error al consultar lista de pacientes.' });
  }
};

export const getPatientById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        medicalAlerts: { where: { active: true } },
        appointments: {
          include: {
            dentist: { select: { id: true, firstName: true, lastName: true, specialty: true } },
            dentalChair: { select: { id: true, name: true, roomNumber: true } },
          },
          orderBy: { startDateTime: 'desc' },
          take: 10,
        },
        odontograms: {
          include: {
            dentist: { select: { id: true, firstName: true, lastName: true } },
            teeth: {
              include: { surfaces: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        treatmentPlans: {
          include: {
            phases: {
              include: { items: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        evolutionNotes: {
          include: {
            dentist: { select: { id: true, firstName: true, lastName: true } },
            addendums: {
              include: { author: { select: { id: true, firstName: true, lastName: true } } },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!patient) {
      res.status(404).json({ error: 'Paciente no encontrado.' });
      return;
    }

    // Auditoría de lectura de expediente clínico (RNF-06)
    await logAudit(req, 'READ', 'PatientRecord', patient.id, {
      patientIdentification: patient.identification,
    });

    res.json({ patient });
  } catch (error: any) {
    console.error('Error al obtener paciente:', error);
    res.status(500).json({ error: 'Error al consultar expediente del paciente.' });
  }
};

export const createPatient = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = patientSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message });
      return;
    }

    const data = parsed.data;

    // Verificar si ya existe paciente con esa identificación
    const existing = await prisma.patient.findUnique({
      where: { identification: data.identification },
    });

    if (existing) {
      res.status(409).json({ error: `Ya existe un paciente con identificación ${data.identification}` });
      return;
    }

    const newPatient = await prisma.patient.create({
      data: {
        documentType: data.documentType,
        identification: data.identification,
        firstName: data.firstName,
        lastName: data.lastName,
        birthDate: new Date(data.birthDate),
        gender: data.gender,
        email: data.email || null,
        phone: data.phone,
        address: data.address || null,
        city: data.city || null,
        emergencyContactName: data.emergencyContactName || null,
        emergencyContactPhone: data.emergencyContactPhone || null,
        legalGuardianName: data.legalGuardianName || null,
        legalGuardianPhone: data.legalGuardianPhone || null,
        insuranceProvider: data.insuranceProvider || null,
        insurancePolicyNumber: data.insurancePolicyNumber || null,
        bloodType: data.bloodType || null,
        notes: data.notes || null,
        medicalAlerts: data.initialAlerts && data.initialAlerts.length > 0
          ? {
              create: data.initialAlerts.map((alert) => ({
                conditionName: alert.conditionName,
                severity: alert.severity,
                requiresPremedication: alert.requiresPremedication,
                notes: alert.notes || null,
              })),
            }
          : undefined,
      },
      include: {
        medicalAlerts: true,
      },
    });

    // Auditoría inmutable de creación
    await logAudit(req, 'CREATE', 'Patient', newPatient.id, {
      identification: newPatient.identification,
      name: `${newPatient.firstName} ${newPatient.lastName}`,
    });

    res.status(201).json({
      message: 'Paciente registrado exitosamente',
      patient: newPatient,
    });
  } catch (error: any) {
    console.error('Error al registrar paciente:', error);
    res.status(500).json({ error: 'Error al registrar el paciente.' });
  }
};

export const updatePatient = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const patient = await prisma.patient.update({
      where: { id },
      data: {
        firstName: updateData.firstName,
        lastName: updateData.lastName,
        phone: updateData.phone,
        email: updateData.email || null,
        address: updateData.address || null,
        city: updateData.city || null,
        emergencyContactName: updateData.emergencyContactName || null,
        emergencyContactPhone: updateData.emergencyContactPhone || null,
        legalGuardianName: updateData.legalGuardianName || null,
        legalGuardianPhone: updateData.legalGuardianPhone || null,
        insuranceProvider: updateData.insuranceProvider || null,
        insurancePolicyNumber: updateData.insurancePolicyNumber || null,
        bloodType: updateData.bloodType || null,
        notes: updateData.notes || null,
      },
    });

    await logAudit(req, 'UPDATE', 'Patient', patient.id, { changes: updateData });

    res.json({ message: 'Paciente actualizado correctamente', patient });
  } catch (error: any) {
    res.status(500).json({ error: 'Error al actualizar paciente.' });
  }
};

export const addMedicalAlert = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { conditionName, severity, requiresPremedication, notes } = req.body;

    if (!conditionName) {
      res.status(400).json({ error: 'El nombre de la alerta médica es requerido' });
      return;
    }

    const alert = await prisma.medicalAlert.create({
      data: {
        patientId: id,
        conditionName,
        severity: severity || AlertSeverity.CRITICAL,
        requiresPremedication: !!requiresPremedication,
        notes: notes || null,
      },
    });

    await logAudit(req, 'CREATE', 'MedicalAlert', alert.id, { patientId: id, conditionName, severity });

    res.status(201).json({ message: 'Alerta médica agregada', alert });
  } catch (error: any) {
    res.status(500).json({ error: 'Error al agregar alerta médica.' });
  }
};
