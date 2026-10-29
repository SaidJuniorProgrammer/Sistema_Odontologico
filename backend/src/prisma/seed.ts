import { PrismaClient, Role, AlertSeverity, SurfaceCondition, ToothSurface, ToothGeneralCondition } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando carga de datos iniciales (Seed)...');

  // 1. Limpieza controlada si existen registros
  await prisma.auditLog.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.procedureInventoryConsumption.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.dentistCommission.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.cashShift.deleteMany();
  await prisma.treatmentItem.deleteMany();
  await prisma.treatmentPlanPhase.deleteMany();
  await prisma.treatmentPlan.deleteMany();
  await prisma.informedConsent.deleteMany();
  await prisma.evolutionAddendum.deleteMany();
  await prisma.evolutionNote.deleteMany();
  await prisma.periodontogram.deleteMany();
  await prisma.toothSurfaceRecord.deleteMany();
  await prisma.toothRecord.deleteMany();
  await prisma.odontogram.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.dentalChair.deleteMany();
  await prisma.medicalAlert.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.user.deleteMany();

  // 2. Hash de contraseña base
  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash('Admin123!', salt);
  const doctorPassword = await bcrypt.hash('Doctor123!', salt);
  const staffPassword = await bcrypt.hash('Staff123!', salt);

  // 3. Usuarios de demostración (Todos los roles RACI)
  const admin = await prisma.user.create({
    data: {
      email: 'admin@sigo.com',
      passwordHash: adminPassword,
      firstName: 'Carlos',
      lastName: 'Montenegro',
      role: Role.ADMIN,
      phone: '+593 99 111 2222',
      licenseNumber: 'TI-ADM-001',
    },
  });

  const drPerez = await prisma.user.create({
    data: {
      email: 'dr.perez@sigo.com',
      passwordHash: doctorPassword,
      firstName: 'Alejandro',
      lastName: 'Pérez Silva',
      role: Role.DENTIST,
      specialty: 'Odontología General y Rehabilitación',
      licenseNumber: 'OD-2015-8842',
      phone: '+593 98 333 4444',
    },
  });

  const draGomez = await prisma.user.create({
    data: {
      email: 'dra.gomez@sigo.com',
      passwordHash: doctorPassword,
      firstName: 'Mariana',
      lastName: 'Gómez Rivas',
      role: Role.DENTIST,
      specialty: 'Ortodoncia y Endodoncia',
      licenseNumber: 'OD-2018-4419',
      phone: '+593 97 555 6666',
    },
  });

  const recepcionista = await prisma.user.create({
    data: {
      email: 'recepcion@sigo.com',
      passwordHash: staffPassword,
      firstName: 'Valeria',
      lastName: 'Santillán',
      role: Role.RECEPTIONIST,
      phone: '+593 96 777 8888',
    },
  });

  const asistente = await prisma.user.create({
    data: {
      email: 'asistente@sigo.com',
      passwordHash: staffPassword,
      firstName: 'Lucía',
      lastName: 'Morales',
      role: Role.ASSISTANT,
      phone: '+593 95 999 0000',
    },
  });

  const auditor = await prisma.user.create({
    data: {
      email: 'auditor@sigo.com',
      passwordHash: staffPassword,
      firstName: 'Fernando',
      lastName: 'Alvarado',
      role: Role.AUDITOR,
      phone: '+593 94 123 4567',
    },
  });

  console.log('✅ Usuarios creados para todos los roles (Admin, Dentistas, Recepción, Asistente, Auditor)');

  // 4. Sillones Dentales Físicos (Recurso para control de colisiones RN-03)
  const chair1 = await prisma.dentalChair.create({
    data: {
      name: 'Sillón 1 - Box Principal',
      roomNumber: 'Box 101',
      description: 'Equipado con unidad ultrasónica y lámpara LED de fotocurado.',
    },
  });

  const chair2 = await prisma.dentalChair.create({
    data: {
      name: 'Sillón 2 - Box Ortodoncia',
      roomNumber: 'Box 102',
      description: 'Optimizado para procedimientos ortodóncicos y estética dental.',
    },
  });

  const chair3 = await prisma.dentalChair.create({
    data: {
      name: 'Sillón 3 - Box Quirúrgico',
      roomNumber: 'Box 103',
      description: 'Sillón de cirugía menor y endodoncia mecanizada.',
    },
  });

  console.log('✅ Sillones dentales físicos creados');

  // 5. Pacientes & Alertas Médicas Críticas (RF-01, RF-02)
  const patient1 = await prisma.patient.create({
    data: {
      documentType: 'DNI',
      identification: '0928374651',
      firstName: 'Mateo',
      lastName: 'Carvajal Peña',
      birthDate: new Date('1988-06-14'),
      gender: 'M',
      email: 'mateo.carvajal@gmail.com',
      phone: '+593 99 876 5432',
      address: 'Av. Amazonas 1234 y Naciones Unidas',
      city: 'Quito',
      emergencyContactName: 'Carolina Peña (Madre)',
      emergencyContactPhone: '+593 99 123 7890',
      insuranceProvider: 'Humana Dental Plus',
      insurancePolicyNumber: 'HDP-88741-B',
      bloodType: 'O+',
      medicalAlerts: {
        create: [
          {
            conditionName: 'Alergia severa a Penicilina y derivados Beta-lactámicos',
            severity: AlertSeverity.CRITICAL,
            requiresPremedication: false,
            notes: 'Usar Clindamicina o Azitromicina como alternativa.',
          },
          {
            conditionName: 'Paciente Anticoagulado (Tratamiento con Warfarina)',
            severity: AlertSeverity.CRITICAL,
            requiresPremedication: true,
            notes: 'Solicitar INR previo a exodoncias o cirugías.',
          },
        ],
      },
    },
  });

  const patient2 = await prisma.patient.create({
    data: {
      documentType: 'DNI',
      identification: '1726354890',
      firstName: 'Sofía',
      lastName: 'Andrade Velasteguí',
      birthDate: new Date('2001-11-22'),
      gender: 'F',
      email: 'sofia.andrade@outlook.com',
      phone: '+593 98 444 5555',
      address: 'Calle Los Álamos 450 y Eloy Alfaro',
      city: 'Quito',
      emergencyContactName: 'Jorge Andrade (Padre)',
      emergencyContactPhone: '+593 98 111 9999',
      insuranceProvider: 'Particular',
      bloodType: 'A+',
      medicalAlerts: {
        create: [
          {
            conditionName: 'Asma bronquial estacional',
            severity: AlertSeverity.MODERATE,
            requiresPremedication: false,
            notes: 'Debe portar inhalador de Salbutamol en consulta.',
          },
        ],
      },
    },
  });

  console.log('✅ Pacientes y alertas médicas críticas cargados');

  // 6. Odontograma base para Mateo (RF-03)
  const odontogram1 = await prisma.odontogram.create({
    data: {
      patientId: patient1.id,
      dentistId: drPerez.id,
      notationType: 'FDI',
      dentitionType: 'PERMANENT',
      notes: 'Evaluación inicial completa. Presenta caries activa en Oclusal pieza 16 y 26.',
    },
  });

  // Pieza 16 con caries en cara Oclusal
  const tooth16 = await prisma.toothRecord.create({
    data: {
      odontogramId: odontogram1.id,
      toothNumber: 16,
      generalCondition: ToothGeneralCondition.SANO,
      notes: 'Caries de esmalte y dentina superficial.',
    },
  });

  await prisma.toothSurfaceRecord.create({
    data: {
      toothRecordId: tooth16.id,
      surface: ToothSurface.OCLUSAL,
      condition: SurfaceCondition.CARIES,
      colorCode: '#EF4444', // Rojo caries
      notes: 'Lesión oclusal activa',
    },
  });

  // Pieza 36 con Restauración de Resina existente
  const tooth36 = await prisma.toothRecord.create({
    data: {
      odontogramId: odontogram1.id,
      toothNumber: 36,
      generalCondition: ToothGeneralCondition.SANO,
      notes: 'Restauración en buen estado.',
    },
  });

  await prisma.toothSurfaceRecord.create({
    data: {
      toothRecordId: tooth36.id,
      surface: ToothSurface.OCLUSAL,
      condition: SurfaceCondition.RESTAURACION_RESINA,
      colorCode: '#3B82F6', // Azul restauración
      notes: 'Resina compuesta oclusal adaptada',
    },
  });

  // Pieza 46 con tratamiento de endodoncia
  await prisma.toothRecord.create({
    data: {
      odontogramId: odontogram1.id,
      toothNumber: 46,
      generalCondition: ToothGeneralCondition.ENDODONCIA,
      notes: 'Tratamiento conductos radiculares satisfactorio.',
    },
  });

  console.log('✅ Odontograma de prueba inicial creado');

  // 7. Citas de demostración
  const now = new Date();
  const appointment1 = await prisma.appointment.create({
    data: {
      patientId: patient1.id,
      dentistId: drPerez.id,
      dentalChairId: chair1.id,
      startDateTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0),
      endDateTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0),
      status: 'CONFIRMADO',
      reason: 'Restauración con resina fotocurable pieza 16',
      notes: 'Paciente acude puntual. Alerta médica verificada.',
    },
  });

  const appointment2 = await prisma.appointment.create({
    data: {
      patientId: patient2.id,
      dentistId: draGomez.id,
      dentalChairId: chair2.id,
      startDateTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 30),
      endDateTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11, 30),
      status: 'PROGRAMADO',
      reason: 'Control y ajuste de brackets de ortodoncia',
    },
  });

  console.log('✅ Citas iniciales agendadas');

  // 8. Catálogo de Insumos Clínicos (RF-14)
  await prisma.inventoryItem.createMany({
    data: [
      {
        code: 'INS-RES-01',
        name: 'Resina Fotocurable Filtek Z350 XT A2',
        category: 'Operatoria',
        unitOfMeasure: 'Jeringa 4g',
        stockQuantity: 15.0,
        minStockThreshold: 5.0,
        costPerUnit: 38.5,
      },
      {
        code: 'INS-ANES-01',
        name: 'Lidocaína 2% con Epinefrina 1:100.000',
        category: 'Anestesia',
        unitOfMeasure: 'Caja 50 Cárpules',
        stockQuantity: 8.0,
        minStockThreshold: 3.0,
        costPerUnit: 25.0,
      },
      {
        code: 'INS-GUANT-01',
        name: 'Guantes de Nitrilo Quirúrgico Talla M',
        category: 'Bioseguridad',
        unitOfMeasure: 'Caja 100 Uds',
        stockQuantity: 24.0,
        minStockThreshold: 10.0,
        costPerUnit: 9.5,
      },
    ],
  });

  console.log('✅ Insumos de inventario iniciales creados');

  // 9. Registro de auditoría inicial (RNF-06)
  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: 'CREATE',
      entityName: 'SystemBootstrap',
      entityId: 'InitSeed',
      ipAddress: '127.0.0.1',
      userAgent: 'SIGO-Cli-Seed/1.0',
      details: {
        message: 'Base de datos SIGO-Dental inicializada con datos de prueba.',
        timestamp: new Date().toISOString(),
      },
    },
  });

  console.log('🎉 Seed finalizado exitosamente!');
}

main()
  .catch((e) => {
    console.error('❌ Error ejecutando seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
