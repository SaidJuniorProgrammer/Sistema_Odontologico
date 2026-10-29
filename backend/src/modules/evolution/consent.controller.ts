import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { AuthRequest } from '../../middleware/auth.js';
import { logAudit } from '../../middleware/audit.js';

const consentSchema = z.object({
  patientId: z.string().uuid(),
  procedureName: z.string().min(3, 'Nombre de procedimiento requerido'),
  termsText: z.string().min(10, 'Términos y condiciones legales requeridos'),
  signatureData: z.string().min(10, 'Trazo de firma biométrica requerido (Base64)'),
  signatureType: z.enum(['BIOMETRIC', 'OTP']).default('BIOMETRIC'),
});

export const getPatientConsents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { patientId } = req.params;

    const consents = await prisma.informedConsent.findMany({
      where: { patientId },
      include: {
        dentist: { select: { id: true, firstName: true, lastName: true, licenseNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ consents });
  } catch (error: any) {
    res.status(500).json({ error: 'Error al consultar consentimientos informados.' });
  }
};

export const createInformedConsent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = consentSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message });
      return;
    }

    const { patientId, procedureName, termsText, signatureData, signatureType } = parsed.data;
    const dentistId = req.user!.id;

    const consent = await prisma.informedConsent.create({
      data: {
        patientId,
        dentistId,
        procedureName,
        termsText,
        signatureData,
        signatureType,
        signedAt: new Date(),
        status: 'SIGNED',
      },
      include: {
        dentist: { select: { id: true, firstName: true, lastName: true, licenseNumber: true } },
      },
    });

    await logAudit(req, 'CREATE', 'InformedConsent', consent.id, {
      patientId,
      procedureName,
      status: 'SIGNED',
    });

    res.status(201).json({
      message: 'Consentimiento informado firmado digitalmente (RF-06 Cumplido)',
      consent,
    });
  } catch (error: any) {
    console.error('Error al registrar consentimiento:', error);
    res.status(500).json({ error: 'Error al procesar consentimiento informado.' });
  }
};
