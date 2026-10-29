import { Response } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { prisma } from '../../lib/prisma.js';
import { AuthRequest } from '../../middleware/auth.js';
import { logAudit } from '../../middleware/audit.js';

const noteSchema = z.object({
  patientId: z.string().uuid(),
  appointmentId: z.string().uuid().optional().nullable(),
  subjective: z.string().min(5, 'Sección Subjetivo requerida (síntomas referidos)'),
  objective: z.string().min(5, 'Sección Objetivo requerida (hallazgos clínicos)'),
  evaluation: z.string().min(5, 'Sección Evaluación requerida (diagnóstico)'),
  plan: z.string().min(5, 'Sección Plan requerida (tratamiento y recetas)'),
});

const addendumSchema = z.object({
  content: z.string().min(10, 'El contenido de la adenda aclaratoria es requerido'),
});

export const getPatientEvolutions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { patientId } = req.params;

    const notes = await prisma.evolutionNote.findMany({
      where: { patientId },
      include: {
        dentist: {
          select: { id: true, firstName: true, lastName: true, specialty: true, licenseNumber: true },
        },
        addendums: {
          include: {
            author: { select: { id: true, firstName: true, lastName: true, specialty: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ notes });
  } catch (error: any) {
    res.status(500).json({ error: 'Error al consultar notas de evolución.' });
  }
};

export const createEvolutionNote = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = noteSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message });
      return;
    }

    const { patientId, appointmentId, subjective, objective, evaluation, plan } = parsed.data;
    const dentistId = req.user!.id;

    // Generar firma digital criptográfica con timestamp e ID del profesional
    const signaturePayload = `${patientId}|${dentistId}|${new Date().toISOString()}|${subjective}|${evaluation}`;
    const digitalSignature = crypto.createHash('sha256').update(signaturePayload).digest('hex');

    const note = await prisma.evolutionNote.create({
      data: {
        patientId,
        dentistId,
        appointmentId: appointmentId || null,
        subjective,
        objective,
        evaluation,
        plan,
        digitalSignature,
        isLocked: false,
      },
      include: {
        dentist: { select: { id: true, firstName: true, lastName: true, licenseNumber: true } },
      },
    });

    await logAudit(req, 'CREATE', 'EvolutionNote', note.id, {
      patientId,
      digitalSignature,
    });

    res.status(201).json({
      message: 'Nota de evolución clínica registrada y firmada digitalmente',
      note,
    });
  } catch (error: any) {
    console.error('Error al registrar nota de evolución:', error);
    res.status(500).json({ error: 'Error al registrar nota de evolución.' });
  }
};

export const createAddendum = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params; // evolutionNoteId
    const parsed = addendumSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message });
      return;
    }

    const { content } = parsed.data;

    // Verificar existencia de la nota clínica
    const baseNote = await prisma.evolutionNote.findUnique({
      where: { id },
    });

    if (!baseNote) {
      res.status(404).json({ error: 'Nota de evolución no encontrada' });
      return;
    }

    // Regla de Negocio RN-01: Inmutabilidad clínica: Firma de adenda
    const signaturePayload = `${id}|${req.user!.id}|${new Date().toISOString()}|${content}`;
    const digitalSignature = crypto.createHash('sha256').update(signaturePayload).digest('hex');

    const addendum = await prisma.evolutionAddendum.create({
      data: {
        evolutionNoteId: id,
        authorId: req.user!.id,
        content,
        digitalSignature,
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, licenseNumber: true } },
      },
    });

    await logAudit(req, 'CREATE', 'EvolutionAddendum', addendum.id, {
      evolutionNoteId: id,
      authorId: req.user!.id,
      digitalSignature,
    });

    res.status(201).json({
      message: 'Adenda clínica registrada formalmente (RN-01 Cumplida)',
      addendum,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Error al registrar adenda clínica.' });
  }
};
