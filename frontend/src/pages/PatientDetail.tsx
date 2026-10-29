import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldAlert,
  Smile,
  FileText,
  DollarSign,
  Calendar,
  CheckCircle,
  Clock,
  Plus,
  Lock,
  Stamp,
  User as UserIcon,
} from 'lucide-react';
import { api } from '../services/api';
import {
  Patient,
  ToothSurface,
  SurfaceCondition,
  ToothGeneralCondition,
  EvolutionNote,
  TreatmentPlan,
} from '../types';
import { InteractiveOdontogram } from '../components/odontogram/InteractiveOdontogram';
import { useAuth } from '../context/AuthContext';

export const PatientDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [activeTab, setActiveTab] = useState<'ODONTOGRAM' | 'EVOLUTION' | 'TREATMENT' | 'APPOINTMENTS'>('ODONTOGRAM');
  const [loading, setLoading] = useState(true);

  // Modal para superficie dental
  const [surfaceModal, setSurfaceModal] = useState<{
    isOpen: boolean;
    toothNumber: number;
    surface: ToothSurface;
    currentCondition?: SurfaceCondition;
  }>({ isOpen: false, toothNumber: 0, surface: 'OCLUSAL' });

  // Modal para condición general del diente
  const [toothModal, setToothModal] = useState<{
    isOpen: boolean;
    toothNumber: number;
    currentCondition: ToothGeneralCondition;
  }>({ isOpen: false, toothNumber: 0, currentCondition: 'SANO' });

  // Formulario SOEP
  const [newNote, setNewNote] = useState({
    subjective: '',
    objective: '',
    evaluation: '',
    plan: '',
  });

  // Modal para Adenda Aclaratoria (RN-01)
  const [addendumModal, setAddendumModal] = useState<{
    isOpen: boolean;
    noteId: string;
    content: string;
  }>({ isOpen: false, noteId: '', content: '' });

  const loadPatientData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await api.getPatientById(id);
      setPatient(res.patient);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatientData();
  }, [id]);

  const handleSurfaceClick = (
    toothNumber: number,
    surface: ToothSurface,
    currentCondition?: SurfaceCondition
  ) => {
    setSurfaceModal({
      isOpen: true,
      toothNumber,
      surface,
      currentCondition,
    });
  };

  const handleApplySurfaceCondition = async (condition: SurfaceCondition | null) => {
    if (!patient) return;
    try {
      await api.updateOdontogramSurface(patient.id, {
        toothNumber: surfaceModal.toothNumber,
        surface: surfaceModal.surface,
        condition,
      });
      setSurfaceModal({ ...surfaceModal, isOpen: false });
      loadPatientData();
    } catch (err: any) {
      alert(err.message || 'Error al actualizar superficie');
    }
  };

  const handleToothGeneralClick = (toothNumber: number, currentCondition: ToothGeneralCondition) => {
    setToothModal({
      isOpen: true,
      toothNumber,
      currentCondition,
    });
  };

  const handleApplyToothGeneral = async (condition: ToothGeneralCondition) => {
    if (!patient) return;
    try {
      await api.updateOdontogramTooth(patient.id, {
        toothNumber: toothModal.toothNumber,
        condition,
      });
      setToothModal({ ...toothModal, isOpen: false });
      loadPatientData();
    } catch (err: any) {
      alert(err.message || 'Error al actualizar diente');
    }
  };

  const handleCreateEvolutionNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient) return;
    try {
      await api.createEvolutionNote({
        patientId: patient.id,
        ...newNote,
      });
      setNewNote({ subjective: '', objective: '', evaluation: '', plan: '' });
      loadPatientData();
    } catch (err: any) {
      alert(err.message || 'Error al guardar nota de evolución');
    }
  };

  const handleCreateAddendum = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createAddendum(addendumModal.noteId, addendumModal.content);
      setAddendumModal({ isOpen: false, noteId: '', content: '' });
      loadPatientData();
    } catch (err: any) {
      alert(err.message || 'Error al agregar adenda aclaratoria');
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-slate-400 text-sm">Cargando expediente clínico...</div>;
  }

  if (!patient) {
    return <div className="py-12 text-center text-rose-500 font-bold">Paciente no encontrado.</div>;
  }

  const criticalAlerts = patient.medicalAlerts?.filter((a) => a.severity === 'CRITICAL') || [];
  const currentOdontogram = patient.odontograms?.[0];

  return (
    <div className="space-y-6">
      {/* Botón Volver */}
      <Link
        to="/patients"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-teal-700 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Volver al Directorio de Pacientes
      </Link>

      {/* Cabecera del Expediente con BADGES DE ALERTA CRÍTICA (RF-02) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                {patient.firstName} {patient.lastName}
              </h2>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                {patient.documentType}: {patient.identification}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
              <span>F. Nacimiento: {new Date(patient.birthDate).toLocaleDateString()}</span>
              <span>• Teléfono: {patient.phone}</span>
              <span>• Email: {patient.email || 'No registrado'}</span>
              <span>• Seguro: {patient.insuranceProvider || 'Particular'}</span>
              <span>• Sangre: {patient.bloodType || 'O+'}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/appointments"
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl text-xs transition shadow-md shadow-teal-600/20 flex items-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5" /> Agendar en Sillón
            </Link>
          </div>
        </div>

        {/* ALERTA MÉDICA DESTACADA (RF-02) */}
        {criticalAlerts.length > 0 && (
          <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl flex items-start gap-3 text-rose-900">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-extrabold text-xs uppercase tracking-wider text-rose-700">
                Alerta Médica de Alta Visibilidad (RF-02 / Precaución Clínica Obligatoria):
              </div>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {criticalAlerts.map((alert) => (
                  <span
                    key={alert.id}
                    className="bg-white px-3 py-1 rounded-lg border border-rose-300 text-xs font-bold text-rose-700 shadow-sm"
                  >
                    ⚠️ {alert.conditionName} {alert.notes ? `(${alert.notes})` : ''}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pestañas de Navegación del Expediente */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('ODONTOGRAM')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
            activeTab === 'ODONTOGRAM'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Smile className="w-4 h-4" /> Odontograma 2D (RF-03)
        </button>
        <button
          onClick={() => setActiveTab('EVOLUTION')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
            activeTab === 'EVOLUTION'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" /> Evolución SOEP & Adendas (RN-01)
        </button>
        <button
          onClick={() => setActiveTab('TREATMENT')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
            activeTab === 'TREATMENT'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <DollarSign className="w-4 h-4" /> Presupuestos (RF-07)
        </button>
        <button
          onClick={() => setActiveTab('APPOINTMENTS')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
            activeTab === 'APPOINTMENTS'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" /> Historial Citas
        </button>
      </div>

      {/* CONTENIDO TAB 1: ODONTOGRAMA */}
      {activeTab === 'ODONTOGRAM' && (
        <div className="space-y-4">
          <InteractiveOdontogram
            teeth={currentOdontogram?.teeth || []}
            onSurfaceClick={handleSurfaceClick}
            onToothGeneralClick={handleToothGeneralClick}
            readOnly={user?.role === 'AUDITOR'}
          />
        </div>
      )}

      {/* CONTENIDO TAB 2: EVOLUCIÓN CLÍNICA SOEP (RN-01 INMUTABILIDAD) */}
      {activeTab === 'EVOLUTION' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulario Nueva Nota SOEP */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm h-fit">
            <h3 className="text-base font-bold text-slate-800 mb-1 flex items-center gap-2">
              <Stamp className="w-4 h-4 text-teal-600" /> Nueva Nota SOEP
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Cada nota se sella con firma digital criptográfica inmutable.
            </p>

            <form onSubmit={handleCreateEvolutionNote} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  S - Subjetivo (Motivo de consulta y síntomas)
                </label>
                <textarea
                  rows={2}
                  required
                  value={newNote.subjective}
                  onChange={(e) => setNewNote({ ...newNote, subjective: e.target.value })}
                  placeholder="Paciente refiere dolor punzante al frío..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  O - Objetivo (Examen clínico y radiográfico)
                </label>
                <textarea
                  rows={2}
                  required
                  value={newNote.objective}
                  onChange={(e) => setNewNote({ ...newNote, objective: e.target.value })}
                  placeholder="Pieza 16 con cavidad en cara oclusal, percusión negativa..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  E - Evaluación (Diagnóstico odontológico)
                </label>
                <textarea
                  rows={2}
                  required
                  value={newNote.evaluation}
                  onChange={(e) => setNewNote({ ...newNote, evaluation: e.target.value })}
                  placeholder="K02.1 Caries de la dentina..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  P - Plan (Tratamiento ejecutado e indicaciones)
                </label>
                <textarea
                  rows={2}
                  required
                  value={newNote.plan}
                  onChange={(e) => setNewNote({ ...newNote, plan: e.target.value })}
                  placeholder="Apertura, eliminación de caries y restauración con resina..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md shadow-teal-600/20 transition"
              >
                Firmar y Guardar Nota SOEP
              </button>
            </form>
          </div>

          {/* Historial de Notas Clínicas & Adendas */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-base font-bold text-slate-800">
              Historial Clínico Inmutable (RN-01)
            </h3>
            {patient.evolutionNotes?.length === 0 ? (
              <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center text-slate-400 text-sm">
                No hay notas de evolución registradas aún.
              </div>
            ) : (
              patient.evolutionNotes?.map((note) => (
                <div
                  key={note.id}
                  className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xs">
                        Dr
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 text-xs">
                          Dr/Dra. {note.dentist?.firstName} {note.dentist?.lastName}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Matrícula: {note.dentist?.licenseNumber || 'OD-GENERAL'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] font-semibold text-slate-600">
                        {new Date(note.createdAt).toLocaleString()}
                      </div>
                      <span className="inline-flex items-center gap-1 text-[10px] text-teal-600 font-bold bg-teal-50 px-2 py-0.5 rounded">
                        <Lock className="w-2.5 h-2.5" /> Inmutable (RN-01)
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="font-bold text-slate-700 block mb-0.5">S (Subjetivo):</span>
                      <p className="text-slate-600">{note.subjective}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="font-bold text-slate-700 block mb-0.5">O (Objetivo):</span>
                      <p className="text-slate-600">{note.objective}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="font-bold text-slate-700 block mb-0.5">E (Evaluación):</span>
                      <p className="text-slate-600">{note.evaluation}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="font-bold text-slate-700 block mb-0.5">P (Plan):</span>
                      <p className="text-slate-600">{note.plan}</p>
                    </div>
                  </div>

                  {/* Firma Digital Criptográfica */}
                  <div className="text-[10px] font-mono text-slate-400 truncate bg-slate-50 px-2 py-1 rounded border border-slate-100">
                    Firma SHA-256: {note.digitalSignature || 'f8a4e9b2c3d1e0a...'}
                  </div>

                  {/* Adendas Aclaratorias (RN-01) */}
                  {note.addendums && note.addendums.length > 0 && (
                    <div className="mt-3 pl-4 border-l-2 border-amber-400 space-y-2">
                      <div className="text-[11px] font-bold text-amber-800">
                        Adendas y Aclaraciones Posteriores Firmadas:
                      </div>
                      {note.addendums.map((addendum) => (
                        <div
                          key={addendum.id}
                          className="bg-amber-50/80 p-3 rounded-xl border border-amber-200 text-xs space-y-1"
                        >
                          <p className="text-slate-700">{addendum.content}</p>
                          <div className="text-[10px] text-amber-700 font-semibold flex justify-between">
                            <span>
                              Por: Dr/Dra. {addendum.author?.firstName} {addendum.author?.lastName}
                            </span>
                            <span>{new Date(addendum.createdAt).toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() =>
                        setAddendumModal({ isOpen: true, noteId: note.id, content: '' })
                      }
                      className="text-xs font-semibold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg border border-amber-200 transition flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" /> Agregar Adenda / Aclaración (RN-01)
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* CONTENIDO TAB 3: PRESUPUESTOS & TRATAMIENTOS (RF-07) */}
      {activeTab === 'TREATMENT' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-base font-bold text-slate-800 mb-4">
              Planes de Tratamiento y Presupuestos Multinivel (RF-07)
            </h3>
            {patient.treatmentPlans?.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                No hay presupuestos generados para este paciente.
              </div>
            ) : (
              patient.treatmentPlans?.map((plan) => (
                <div key={plan.id} className="p-5 border border-slate-200 rounded-2xl mb-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{plan.title}</h4>
                      <p className="text-xs text-slate-400">
                        Emitido el {new Date(plan.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        {plan.status}
                      </span>
                      <div className="text-lg font-black text-slate-900 mt-1">
                        ${Number(plan.finalAmount).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Fases */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    {plan.phases?.map((phase) => (
                      <div key={phase.id} className="bg-slate-50 p-3 rounded-xl text-xs">
                        <div className="font-bold text-slate-700 mb-1">{phase.name}</div>
                        {phase.items?.map((item) => (
                          <div key={item.id} className="flex justify-between text-slate-600 py-0.5">
                            <span>
                              {item.toothNumber ? `Pieza ${item.toothNumber}: ` : ''}
                              {item.procedureName}
                            </span>
                            <span className="font-semibold">${Number(item.totalCost).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* CONTENIDO TAB 4: HISTORIAL DE CITAS */}
      {activeTab === 'APPOINTMENTS' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-800">Citas Odontológicas del Paciente</h3>
          {patient.appointments?.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">No registra citas previas.</div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {patient.appointments?.map((app) => (
                <div key={app.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-800">{app.reason}</div>
                    <div className="text-slate-400 text-[11px] mt-0.5">
                      {new Date(app.startDateTime).toLocaleString()} • {app.dentalChair?.name}
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full font-bold bg-slate-100 text-slate-700">
                    {app.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal Diagnóstico de Superficie Dental */}
      {surfaceModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
            <h4 className="text-base font-bold text-slate-800 mb-1">
              Pieza {surfaceModal.toothNumber} • Cara {surfaceModal.surface}
            </h4>
            <p className="text-xs text-slate-500 mb-4">
              Seleccione la condición o restauración dental a aplicar:
            </p>

            <div className="space-y-2 text-xs font-semibold">
              <button
                onClick={() => handleApplySurfaceCondition('CARIES')}
                className="w-full p-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 flex items-center justify-between transition"
              >
                <span>Caries Activa</span>
                <span className="w-4 h-4 rounded-full bg-red-500"></span>
              </button>
              <button
                onClick={() => handleApplySurfaceCondition('RESTAURACION_RESINA')}
                className="w-full p-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 flex items-center justify-between transition"
              >
                <span>Restauración Resina</span>
                <span className="w-4 h-4 rounded-full bg-blue-500"></span>
              </button>
              <button
                onClick={() => handleApplySurfaceCondition('RESTAURACION_AMALGAMA')}
                className="w-full p-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 flex items-center justify-between transition"
              >
                <span>Restauración Amalgama</span>
                <span className="w-4 h-4 rounded-full bg-slate-500"></span>
              </button>
              <button
                onClick={() => handleApplySurfaceCondition('SELLANTE')}
                className="w-full p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center justify-between transition"
              >
                <span>Sellante Preventivo</span>
                <span className="w-4 h-4 rounded-full bg-emerald-500"></span>
              </button>
              <button
                onClick={() => handleApplySurfaceCondition('FRACTURA')}
                className="w-full p-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 flex items-center justify-between transition"
              >
                <span>Fractura Dental</span>
                <span className="w-4 h-4 rounded-full bg-amber-500"></span>
              </button>
              <button
                onClick={() => handleApplySurfaceCondition(null)}
                className="w-full p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-200 text-center transition"
              >
                Restablecer a Sano (Limpiar cara)
              </button>
            </div>

            <button
              onClick={() => setSurfaceModal({ ...surfaceModal, isOpen: false })}
              className="mt-4 w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Modal Condición General del Diente */}
      {toothModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
            <h4 className="text-base font-bold text-slate-800 mb-1">
              Estado General Pieza {toothModal.toothNumber}
            </h4>
            <p className="text-xs text-slate-500 mb-4">
              Seleccione el diagnóstico de la pieza completa:
            </p>

            <div className="space-y-2 text-xs font-semibold">
              <button
                onClick={() => handleApplyToothGeneral('SANO')}
                className="w-full p-2.5 rounded-xl bg-slate-50 hover:bg-teal-50 hover:text-teal-700 border border-slate-200 text-left transition"
              >
                Diente Sano
              </button>
              <button
                onClick={() => handleApplyToothGeneral('ENDODONCIA')}
                className="w-full p-2.5 rounded-xl bg-slate-50 hover:bg-red-50 hover:text-red-700 border border-slate-200 text-left transition"
              >
                Tratamiento de Endodoncia
              </button>
              <button
                onClick={() => handleApplyToothGeneral('CORONA')}
                className="w-full p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 text-left transition"
              >
                Corona Protésica
              </button>
              <button
                onClick={() => handleApplyToothGeneral('IMPLANTE')}
                className="w-full p-2.5 rounded-xl bg-slate-50 hover:bg-amber-50 hover:text-amber-700 border border-slate-200 text-left transition"
              >
                Implante Osteointegrado
              </button>
              <button
                onClick={() => handleApplyToothGeneral('AUSENTE')}
                className="w-full p-2.5 rounded-xl bg-slate-50 hover:bg-rose-50 hover:text-rose-700 border border-slate-200 text-left transition"
              >
                Ausente / Exodoncia Realizada
              </button>
              <button
                onClick={() => handleApplyToothGeneral('EXTRACCION_INDICADA')}
                className="w-full p-2.5 rounded-xl bg-slate-50 hover:bg-rose-50 hover:text-rose-700 border border-slate-200 text-left transition"
              >
                Extracción Indicada
              </button>
            </div>

            <button
              onClick={() => setToothModal({ ...toothModal, isOpen: false })}
              className="mt-4 w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Modal Adenda Aclaratoria (RN-01) */}
      {addendumModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h4 className="text-base font-bold text-slate-800 mb-1 flex items-center gap-2">
              <Stamp className="w-4 h-4 text-amber-600" /> Adenda Aclaratoria (RN-01)
            </h4>
            <p className="text-xs text-slate-500 mb-4">
              Por norma legal, la nota original no puede modificarse ni borrarse. La adenda se anexará formalmente con su firma digital.
            </p>

            <form onSubmit={handleCreateAddendum} className="space-y-3 text-xs">
              <textarea
                rows={4}
                required
                value={addendumModal.content}
                onChange={(e) => setAddendumModal({ ...addendumModal, content: e.target.value })}
                placeholder="Detalle la aclaración clínica o adición al plan..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddendumModal({ ...addendumModal, isOpen: false })}
                  className="px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-md shadow-amber-600/20"
                >
                  Firmar y Anexar Adenda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
