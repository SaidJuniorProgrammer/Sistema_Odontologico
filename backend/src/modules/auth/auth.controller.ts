import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { Role } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { AuthRequest } from '../../middleware/auth.js';
import { logAudit } from '../../middleware/audit.js';

const JWT_SECRET = process.env.JWT_SECRET || 'sigo_dental_jwt_super_secret_key_2026_clinic_secure';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

const loginSchema = z.object({
  email: z.string().email('Correo electrónico no válido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.errors[0].message });
      return;
    }

    const { email, password } = parseResult.data;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.active) {
      res.status(401).json({ error: 'Credenciales inválidas o cuenta deshabilitada.' });
      return;
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      res.status(401).json({ error: 'Credenciales inválidas.' });
      return;
    }

    // Actualizar último inicio de sesión
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '8h' });

    await logAudit(req, 'LOGIN', 'User', user.id, { email: user.email, role: user.role });

    res.json({
      message: 'Inicio de sesión exitoso',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        specialty: user.specialty,
        licenseNumber: user.licenseNumber,
      },
    });
  } catch (error: any) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor al autenticar.' });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        specialty: true,
        licenseNumber: true,
        isMfaEnabled: true,
        lastLogin: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado.' });
      return;
    }

    res.json({ user });
  } catch (error: any) {
    res.status(500).json({ error: 'Error al obtener información de usuario.' });
  }
};

export const listDentists = async (_req: Request, res: Response): Promise<void> => {
  try {
    const dentists = await prisma.user.findMany({
      where: { role: Role.DENTIST, active: true },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        specialty: true,
        licenseNumber: true,
        email: true,
      },
      orderBy: { lastName: 'asc' },
    });

    res.json({ dentists });
  } catch (error: any) {
    res.status(500).json({ error: 'Error al listar profesionales odontólogos.' });
  }
};

export const listUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        specialty: true,
        licenseNumber: true,
        active: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ users });
  } catch (error: any) {
    res.status(500).json({ error: 'Error al obtener usuarios del sistema.' });
  }
};
