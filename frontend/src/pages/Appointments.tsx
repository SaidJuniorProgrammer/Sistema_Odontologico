import React, { useEffect, useState } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  ShieldAlert,
  AlertCircle,
  CheckCircle,
  User,
  Stethoscope,
  Filter,
  X,
  Play,
  CheckCheck,
} from 'lucide-react';
import { api } from '../services/api';
import { Appointment, DentalChair, Patient, AppointmentStatus } from '../types';

export const Appointments: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [chairs, setChairs] = useState<DentalChair[]>([]);
  const [dentists, setDentists] = useState<any[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [selectedChair, setSelectedChair] = useState<string>('');
  const [selectedDentist, setSelectedDentist] = useState<string>('');

  // Modal Agendamiento
  const [showModal, setShowModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form New Appointment
  const [formData, setFormData] = useState({
    patientId: '',
    dentistId: '',
    dentalChairId: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '11:00',
    endTime: '12:00',
    reason: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [appRes, chairsRes, dentRes, patRes] = await Promise.all([
        api.getAppointments({
          dentalChairId: selectedChair || undefined,
          dentistId: selectedDentist || undefined,
        }),
        api.getChairs(),
        api.getDentists(),
        api.getPatients(),
      ]);

      setAppointments(appRes.appointments || []);
      setChairs(chairsRes.chairs || []);
      setDentists(dentRes.dentists || []);
      setPatients(patRes.patients || []);

      if (chairsRes.chairs?.length > 0 && !formData.dentalChairId) {
        setFormData((prev) => ({
          ...prev,
          dentalChairId: chairsRes.chairs[0].id,
          dentistId: dentRes.dentists?.[0]?.id || '',
          patientId: patRes.patients?.[0]?.id || '',
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedChair, selectedDentist]);

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const startDateTime = new Date(`${formData.date}T${formData.startTime}:00`).toISOString();
    const endDateTime = new Date(`${formData.date}T${formData.endTime}:00`).toISOString();

    try {
      await api.createAppointment({
        patientId: formData.patientId,
        dentistId: formData.dentistId,
        dentalChairId: formData.dentalChairId,
        startDateTime,
        endDateTime,
        reason: formData.reason,
      });

      setShowModal(false);
      setFormData({ ...formData, reason: '' });
      loadData();
    } catch (err: any) {
      // RN-03 Aviso de conflicto de sillón dental
      setErrorMessage(err.message || 'Error al agendar la cita');
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: AppointmentStatus) => {
    try {
      await api.updateAppointmentStatus(id, newStatus);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error al actualizar estado');
    }
  };

  const statusColor: Record<AppointmentStatus, string> = {
    PROGRAMADO: 'bg-blue-50 text-blue-700 border-blue-200',
    CONFIRMADO: 'bg-teal-50 text-teal-700 border-teal-200',
    EN_SALA: 'bg-amber-50 text-amber-700 border-amber-200',
    EN_ATENCION: 'bg-purple-50 text-purple-700 border-purple-200 animate-pulse',
    ATENDIDO: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    CANCELADO: 'bg-rose-50 text-rose-700 border-rose-200',
    NO_ASISTIO: 'bg-slate-100 text-slate-700 border-slate-300',
  };

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
            Agenda Médica Multirrecinto (RF-09 & RN-03)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Programación de turnos con exclusión estricta de sillón físico y doctor simultáneo
          </p>
        </div>
        <button
          onClick={() => {
            setErrorMessage(null);
            setShowModal(true);
          }}
          className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-teal-600/20 transition"
        >
          <Plus className="w-4 h-4" /> Agendar Turno en Sillón
        </button>
      </div>

      {/* Barra de Filtros por Recurso Físico & Profesional */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-4 text-xs font-semibold">
        <div className="flex items-center gap-2 text-slate-500">
          <Filter className="w-4 h-4" /> Filtrar por:
        </div>

        <select
          value={selectedChair}
          onChange={(e) => setSelectedChair(e.target.value)}
          className="p-2 bg-slate-50 border border-slate-200 rounded-xl"
        >
          <option value="">Todos los Sillones Físicos</option>
          {chairs.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.roomNumber})
            </option>
          ))}
        </select>

        <select
          value={selectedDentist}
          onChange={(e) => setSelectedDentist(e.target.value)}
          className="p-2 bg-slate-50 border border-slate-200 rounded-xl"
        >
          <option value="">Todos los Odontólogos</option>
          {dentists.map((d) => (
            <option key={d.id} value={d.id}>
              Dr/Dra. {d.lastName} ({d.specialty || 'General'})
            </option>
          ))}
        </select>

        {(selectedChair || selectedDentist) && (
          <button
            onClick={() => {
              setSelectedChair('');
              setSelectedDentist('');
            }}
            className="text-teal-600 hover:text-teal-800"
          >
            Limpiar Filtros
          </button>
        )}
      </div>

      {/* Lista de Citas en Agenda */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm">Cargando agenda...</div>
        ) : appointments.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            No hay citas programadas para los filtros seleccionados.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {appointments.map((app) => (
              <div
                key={app.id}
                className="p-5 hover:bg-slate-50/80 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-bold text-slate-800 text-sm">
                      {app.patient?.firstName} {app.patient?.lastName}
                    </span>
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                        statusColor[app.status]
                      }`}
                    >
                      {app.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1 font-semibold text-slate-700">
                      <Clock className="w-3.5 h-3.5 text-teal-600" />
                      {new Date(app.startDateTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      -{' '}
                      {new Date(app.endDateTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span className="flex items-center gap-1 text-teal-800 bg-teal-50 px-2 py-0.5 rounded font-medium">
                      <Stethoscope className="w-3 h-3" />
                      {app.dentalChair?.name}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      Dr/Dra. {app.dentist?.firstName} {app.dentist?.lastName}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mt-1">
                    <span className="font-semibold text-slate-700">Motivo:</span> {app.reason}
                  </p>
                </div>

                {/* Transición de Estados del Turno (RF-10) */}
                <div className="flex items-center gap-1.5 self-end md:self-center">
                  {app.status === 'PROGRAMADO' && (
                    <button
                      onClick={() => handleUpdateStatus(app.id, 'CONFIRMADO')}
                      className="px-2.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg text-xs font-semibold transition"
                    >
                      Confirmar
                    </button>
                  )}
                  {app.status === 'CONFIRMADO' && (
                    <button
                      onClick={() => handleUpdateStatus(app.id, 'EN_SALA')}
                      className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-xs font-semibold transition"
                    >
                      En Sala de Espera
                    </button>
                  )}
                  {app.status === 'EN_SALA' && (
                    <button
                      onClick={() => handleUpdateStatus(app.id, 'EN_ATENCION')}
                      className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-semibold transition flex items-center gap-1"
                    >
                      <Play className="w-3 h-3" /> Pasar a Sillón
                    </button>
                  )}
                  {app.status === 'EN_ATENCION' && (
                    <button
                      onClick={() => handleUpdateStatus(app.id, 'ATENDIDO')}
                      className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold transition flex items-center gap-1"
                    >
                      <CheckCheck className="w-3 h-3" /> Finalizar Consulta
                    </button>
                  )}
                  {app.status !== 'CANCELADO' && app.status !== 'ATENDIDO' && (
                    <button
                      onClick={() => handleUpdateStatus(app.id, 'CANCELADO')}
                      className="px-2 py-1.5 text-slate-400 hover:text-rose-600 text-xs font-semibold transition"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Agendar Cita */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">Agendar Turno Odontológico</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Aviso de error de conflicto RN-03 */}
            {errorMessage && (
              <div className="mt-4 p-4 bg-rose-50 border border-rose-300 rounded-2xl flex items-start gap-3 text-rose-800 text-xs">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block mb-0.5">Conflicto de Agendamiento:</span>
                  <span>{errorMessage}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleCreateAppointment} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Paciente *</label>
                <select
                  required
                  value={formData.patientId}
                  onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="">Seleccione Paciente</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName} ({p.identification})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Sillón Dental Físico (RN-03) *
                  </label>
                  <select
                    required
                    value={formData.dentalChairId}
                    onChange={(e) => setFormData({ ...formData, dentalChairId: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    {chairs.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.roomNumber})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Odontólogo *</label>
                  <select
                    required
                    value={formData.dentistId}
                    onChange={(e) => setFormData({ ...formData, dentistId: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    {dentists.map((d) => (
                      <option key={d.id} value={d.id}>
                        Dr/Dra. {d.lastName} ({d.specialty || 'General'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Fecha</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Hora Inicio</label>
                  <input
                    type="time"
                    required
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Hora Fin</label>
                  <input
                    type="time"
                    required
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Procedimiento o Motivo de Consulta *
                </label>
                <input
                  type="text"
                  required
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Limpieza dental, Obturación pieza 25, Consulta..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 font-semibold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl shadow-md shadow-teal-600/20"
                >
                  Reservar Sillón
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
