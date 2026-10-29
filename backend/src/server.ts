import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import authRoutes from './modules/auth/auth.routes.js';
import patientRoutes from './modules/patients/patient.routes.js';
import chairRoutes from './modules/chairs/chair.routes.js';
import appointmentRoutes from './modules/appointments/appointment.routes.js';
import odontogramRoutes from './modules/odontogram/odontogram.routes.js';
import evolutionRoutes from './modules/evolution/evolution.routes.js';
import treatmentRoutes from './modules/treatments/treatment.routes.js';
import billingRoutes from './modules/billing/billing.routes.js';
import inventoryRoutes from './modules/inventory/inventory.routes.js';
import auditRoutes from './modules/audit/audit.routes.js';
import { prisma } from './lib/prisma.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Seguridad y Middlewares Globales
app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(morgan('dev'));
app.use(express.json());

// Verificación de Estado (Health Check)
app.get('/api/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'UP',
      service: 'SIGO-Dental API',
      timestamp: new Date().toISOString(),
      database: 'Connected (PostgreSQL)',
    });
  } catch (error) {
    res.status(500).json({
      status: 'DOWN',
      database: 'Disconnected',
      error: String(error),
    });
  }
});

// Enrutamiento Modular
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/chairs', chairRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/odontogram', odontogramRoutes);
app.use('/api/evolution', evolutionRoutes);
app.use('/api/treatments', treatmentRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/audit', auditRoutes);

// Manejador 404
app.use((_req, res) => {
  res.status(404).json({ error: 'Endpoint no encontrado en SIGO-Dental API' });
});

// Inicialización de Servidor
app.listen(PORT, () => {
  console.log(`🚀 SIGO-Dental API corriendo en: http://localhost:${PORT}`);
  console.log(`📋 Health check disponible en: http://localhost:${PORT}/api/health`);
});

export default app;
