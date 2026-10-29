import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma.js';

export const getChairs = async (_req: Request, res: Response): Promise<void> => {
  try {
    const chairs = await prisma.dentalChair.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });
    res.json({ chairs });
  } catch (error: any) {
    res.status(500).json({ error: 'Error al consultar sillones dentales.' });
  }
};

export const createChair = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, roomNumber, description } = req.body;
    if (!name || !roomNumber) {
      res.status(400).json({ error: 'Nombre y consultorio/box son requeridos.' });
      return;
    }

    const chair = await prisma.dentalChair.create({
      data: { name, roomNumber, description },
    });

    res.status(201).json({ message: 'Sillón dental registrado', chair });
  } catch (error: any) {
    res.status(500).json({ error: 'Error al registrar sillón dental.' });
  }
};
