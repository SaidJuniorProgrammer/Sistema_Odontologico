import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { AuthRequest } from '../../middleware/auth.js';
import { logAudit } from '../../middleware/audit.js';

const movementSchema = z.object({
  inventoryItemId: z.string().uuid(),
  movementType: z.enum(['ENTRADA', 'SALIDA_CLINICA', 'AJUSTE']),
  quantity: z.number().positive(),
  reference: z.string().optional().nullable(),
});

export const getInventory = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const items = await prisma.inventoryItem.findMany({
      orderBy: { name: 'asc' },
    });

    const itemsWithStatus = items.map((item) => ({
      ...item,
      isLowStock: Number(item.stockQuantity) <= Number(item.minStockThreshold),
    }));

    res.json({ inventory: itemsWithStatus });
  } catch (error: any) {
    res.status(500).json({ error: 'Error al consultar inventario.' });
  }
};

export const registerMovement = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = movementSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message });
      return;
    }

    const { inventoryItemId, movementType, quantity, reference } = parsed.data;

    const item = await prisma.inventoryItem.findUnique({
      where: { id: inventoryItemId },
    });

    if (!item) {
      res.status(404).json({ error: 'Insumo no encontrado' });
      return;
    }

    const currentStock = Number(item.stockQuantity);
    let newStock = currentStock;

    if (movementType === 'ENTRADA') {
      newStock = currentStock + quantity;
    } else if (movementType === 'SALIDA_CLINICA' || movementType === 'AJUSTE') {
      if (currentStock < quantity) {
        res.status(400).json({ error: `Stock insuficiente. Disponible: ${currentStock}` });
        return;
      }
      newStock = currentStock - quantity;
    }

    // Actualizar stock y registrar movimiento atómicamente
    const [movement, updatedItem] = await prisma.$transaction([
      prisma.stockMovement.create({
        data: {
          inventoryItemId,
          movementType,
          quantity,
          reference: reference || null,
          createdById: req.user!.id,
        },
      }),
      prisma.inventoryItem.update({
        where: { id: inventoryItemId },
        data: { stockQuantity: newStock },
      }),
    ]);

    await logAudit(req, 'UPDATE', 'InventoryStock', inventoryItemId, {
      movementType,
      quantity,
      previousStock: currentStock,
      newStock,
    });

    res.status(201).json({
      message: 'Movimiento de inventario registrado con éxito',
      movement,
      item: updatedItem,
    });
  } catch (error: any) {
    console.error('Error al registrar movimiento:', error);
    res.status(500).json({ error: 'Error al actualizar stock de inventario.' });
  }
};
