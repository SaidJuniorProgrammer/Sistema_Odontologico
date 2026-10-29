# SIGO-Dental | Sistema Integral de Gestión Odontológica y Expediente Clínico Digital

Sistema clínico-administrativo moderno desarrollado para digitalización integral de clínicas odontológicas según la especificación de requerimientos (SRS v1.0).

---

## 🏛️ Arquitectura & Stack Tecnológico

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS + Lucide Icons + React Router DOM
- **Backend:** Node.js + Express + TypeScript + Prisma ORM + Zod + JWT
- **Persistencia & Caching:** PostgreSQL 16 (puerto 5435) + Redis 7 (puerto 6380) vía Docker Compose
- **Odontograma Interactivo:** Renderizado vectorial reactivo en **SVG** (< 1.5s de tiempo de respuesta conforme a RNF-01) con soporte para notación FDI y Universal.

---

## 🔒 Reglas de Negocio Implementadas

1. **RN-01 (Inmutabilidad del Historial Clínico):**
   - Las notas de evolución SOEP (Subjetivo, Objetivo, Evaluación, Plan) se firman digitalmente mediante hash criptográfico SHA-256.
   - No pueden eliminarse ni sobreescribirse; cualquier corrección posterior se anexa formalmente mediante **Adendas Aclaratorias** con firma del profesional responsable.

2. **RN-02 (Cierre de Caja Ciego):**
   - En el arqueo diario, el cajero o recepcionista debe ingresar el recuento físico real de billetes y monedas sin conocer el total calculado por el sistema.
   - Al procesar el cierre, el sistema revela automáticamente el saldo esperado, el conteo físico y la diferencia (cuadrado, sobrante o faltante).

3. **RN-03 (Exclusión de Recurso Físico - Sillón Dental):**
   - El motor de agendamiento valida en tiempo real y prohíbe citas sobrepuestas en el mismo sillón dental físico o con el mismo profesional odontólogo en el mismo intervalo de tiempo.

4. **RNF-06 (Trazabilidad & Auditoría Inmutable):**
   - Bitácora inmutable que almacena timestamp ISO-8601, usuario responsable, rol, IP de origen, entidad afectada y detalles de los cambios.

---

## 👥 Usuarios de Demostración y Credenciales (Matriz RACI)

| Rol | Correo Electrónico | Contraseña | Permisos Principales |
| :--- | :--- | :--- | :--- |
| **Administrador TI** | `admin@sigo.com` | `Admin123!` | Configuración global, catálogo, auditoría RNF-06, usuarios. |
| **Odontólogo General** | `dr.perez@sigo.com` | `Doctor123!` | Odontograma 2D, notas SOEP, adendas, planes de tratamiento. |
| **Especialista (Ortodoncia)** | `dra.gomez@sigo.com` | `Doctor123!` | Odontograma 2D, evolución clínica, ortodoncia. |
| **Recepción / Caja** | `recepcion@sigo.com` | `Staff123!` | Fichas de pacientes, agenda de sillones, POS, cierre ciego RN-02. |
| **Asistente Dental** | `asistente@sigo.com` | `Staff123!` | Asistencia en consulta, insumos y apoyo en sillón. |
| **Auditor Financiero** | `auditor@sigo.com` | `Staff123!` | Conciliación de caja, movimientos de inventario y logs de auditoría. |

*Nota: La interfaz web incluye botones de acceso rápido para alternar entre roles con un solo clic.*

---

## 🚀 Puesta en Marcha Local

### 1. Base de datos & Redis (Docker Compose)
```bash
docker compose up -d
```

### 2. Backend (Puerto 4000)
```bash
cd backend
npm install
npx prisma db push
npm run seed
npm run dev
```

### 3. Frontend (Puerto 5173)
```bash
cd frontend
npm install
npm run dev
```

Abra su navegador en: **`http://localhost:5173`**
