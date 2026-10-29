import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Users,
  AlertTriangle,
  Clock,
  ArrowRight,
  ShieldAlert,
  Smile,
  Receipt,
  CheckCircle2,
  Stethoscope,
} from 'lucide-react';
import { api } from '../services/api';
import { Appointment, Patient } from '../types';
import { useAuth } from '../context/AuthContext';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [appRes, patRes] = await Promise.all([
          api.getAppointments(),
          api.getPatients(),
        ]);
        setAppointments(appRes.appointments || []);
        setPatients(patRes.patients || []);
      } catch (err) {
        console.error('Error cargando métricas:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const criticalAlertsCount = patients.reduce(
    (acc, p) => acc + (p.medicalAlerts?.filter((a) => a.severity === 'CRITICAL').length || 0),
    0
  );

  return (
    <div className="space-y-8">
      {/* Banner de Bienvenida */}
      <div className="bg-gradient-to-r from-teal-700 via-teal-600 to-cyan-600 rounded-3xl p-8 text-white shadow-xl shadow-teal-700/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="text-xs uppercase font-bold tracking-wider bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
            Panel de Control Clínico
          </span>
          <h2 className="text-2xl lg:text-3xl font-extrabold mt-3 tracking-tight">
            Bienvenido, {user?.firstName} {user?.lastName}
          </h2>
          <p className="text-teal-100 text-sm mt-1 max-w-xl">
            Sistema SIGO-Dental activo con control de sillones físicos (RN-03), inmutabilidad clínica (RN-01) y cierre de caja ciego (RN-02).
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/appointments"
            className="px-4 py-2.5 bg-white text-teal-800 font-bold rounded-xl text-xs hover:bg-teal-50 transition shadow-sm flex items-center gap-1.5"
          >
            <Calendar className="w-4 h-4" /> Agendar Cita
          </Link>
          <Link
            to="/patients"
            className="px-4 py-2.5 bg-teal-800/80 hover:bg-teal-900 text-white font-semibold rounded-xl text-xs transition border border-teal-500/30 flex items-center gap-1.5"
          >
            <Users className="w-4 h-4" /> Fichas Médicas
          </Link>
        </div>
      </div>

      {/* Tarjetas de Métricas (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Citas Programadas</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-0.5">{appointments.length}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Pacientes Activos</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-0.5">{patients.length}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Alertas Críticas</p>
            <h3 className="text-2xl font-bold text-rose-600 mt-0.5">{criticalAlertsCount}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Sillones Operativos</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-0.5">3 / 3</h3>
          </div>
        </div>
      </div>

      {/* Reglas de Negocio Implementadas */}
      <div className="bg-slate-900 text-slate-100 p-6 rounded-3xl border border-slate-800 shadow-sm">
        <h3 className="text-sm font-bold uppercase tracking-wider text-teal-400 mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> Conformidad de Especificación (SRS v1.0)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/60">
            <span className="font-bold text-teal-300 block mb-1">RN-01: Inmutabilidad Clínica</span>
            <p className="text-slate-400 leading-relaxed">
              Notas SOEP protegidas contra borrado tras 24h. Cada corrección se firma mediante adenda criptográfica SHA-256.
            </p>
          </div>
          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/60">
            <span className="font-bold text-teal-300 block mb-1">RN-02: Cierre de Caja Ciego</span>
            <p className="text-slate-400 leading-relaxed">
              El recepcionista introduce el arqueo físico de billetes y monedas antes de ver el saldo calculado por el sistema.
            </p>
          </div>
          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/60">
            <span className="font-bold text-teal-300 block mb-1">RN-03: Exclusión de Sillón Dental</span>
            <p className="text-slate-400 leading-relaxed">
              El motor de agenda bloquea automáticamente sobreposiciones de horario sobre el mismo sillón físico o doctor.
            </p>
          </div>
        </div>
      </div>

      {/* Próximas Citas Clínicas */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Citas en Agenda</h3>
            <p className="text-xs text-slate-500">Supervisión en tiempo real de pacientes y sillones asignados</p>
          </div>
          <Link
            to="/appointments"
            className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
          >
            Ver toda la agenda <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="py-8 text-center text-slate-400 text-sm">Cargando citas...</div>
        ) : appointments.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-sm">No hay citas registradas</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="pb-3">Hora / Paciente</th>
                  <th className="pb-3">Sillón Dental (RN-03)</th>
                  <th className="pb-3">Profesional</th>
                  <th className="pb-3">Procedimiento / Motivo</th>
                  <th className="pb-3">Estado</th>
                  <th className="pb-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointments.slice(0, 5).map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5">
                      <div className="font-semibold text-slate-800">
                        {app.patient?.firstName} {app.patient?.lastName}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {new Date(app.startDateTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>
                    <td className="py-3.5">
                      <span className="font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                        {app.dentalChair?.name || 'Sillón general'}
                      </span>
                    </td>
                    <td className="py-3.5 text-slate-700">
                      Dr/Dra. {app.dentist?.lastName}
                    </td>
                    <td className="py-3.5 text-slate-600 max-w-xs truncate">{app.reason}</td>
                    <td className="py-3.5">
                      <span className="px-2.5 py-1 rounded-full font-semibold text-[11px] bg-teal-50 text-teal-700 border border-teal-200">
                        {app.status}
                      </span>
                    </td>
                    <td className="py-3.5 text-right">
                      <Link
                        to={`/patients/${app.patientId}`}
                        className="text-teal-600 hover:text-teal-800 font-semibold text-xs"
                      >
                        Expediente
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
