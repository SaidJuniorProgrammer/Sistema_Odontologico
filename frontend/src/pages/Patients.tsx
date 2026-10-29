import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Search,
  Plus,
  ShieldAlert,
  ChevronRight,
  Phone,
  Calendar,
  X,
  HeartPulse,
} from 'lucide-react';
import { api } from '../services/api';
import { Patient, AlertSeverity } from '../types';

export const Patients: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State
  const [newPatient, setNewPatient] = useState({
    identification: '',
    firstName: '',
    lastName: '',
    birthDate: '1995-05-15',
    gender: 'M',
    phone: '',
    email: '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    insuranceProvider: 'Particular',
    bloodType: 'O+',
    hasAllergy: false,
    allergyName: 'Alergia a Penicilina',
  });

  const loadPatients = async (query?: string) => {
    try {
      setLoading(true);
      const res = await api.getPatients(query);
      setPatients(res.patients || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients(search);
  }, [search]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const initialAlerts = [];
      if (newPatient.hasAllergy && newPatient.allergyName) {
        initialAlerts.push({
          conditionName: newPatient.allergyName,
          severity: 'CRITICAL' as AlertSeverity,
          requiresPremedication: false,
          notes: 'Registrada durante el alta inicial',
        });
      }

      await api.createPatient({
        ...newPatient,
        initialAlerts,
      });

      setShowCreateModal(false);
      loadPatients();
    } catch (err: any) {
      alert(err.message || 'Error al registrar paciente');
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
            Fichero de Pacientes (RF-01)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Gestión única de expedientes clínicos y detección de alertas médicas de alta prioridad
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-teal-600/20 transition"
        >
          <Plus className="w-4 h-4" /> Nuevo Paciente
        </button>
      </div>

      {/* Barra de Búsqueda */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por cédula / DNI, nombres, apellidos o teléfono..."
          className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm transition"
        />
      </div>

      {/* Lista de Pacientes */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm">Buscando pacientes...</div>
        ) : patients.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            No se encontraron pacientes que coincidan con la búsqueda.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {patients.map((patient) => {
              const criticalAlerts = patient.medicalAlerts?.filter((a) => a.severity === 'CRITICAL') || [];

              return (
                <div
                  key={patient.id}
                  className="p-5 hover:bg-slate-50/80 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h4 className="text-base font-bold text-slate-800">
                        {patient.firstName} {patient.lastName}
                      </h4>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                        {patient.documentType}: {patient.identification}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        • Sangre: {patient.bloodType || 'O+'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {patient.phone}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Nacimiento:{' '}
                        {new Date(patient.birthDate).toLocaleDateString([], {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      {patient.insuranceProvider && (
                        <span className="text-teal-700 bg-teal-50 px-2 py-0.5 rounded font-medium">
                          Seguro: {patient.insuranceProvider}
                        </span>
                      )}
                    </div>

                    {/* RF-02 Badges de Alerta Médica de Alta Visibilidad */}
                    {criticalAlerts.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {criticalAlerts.map((alert) => (
                          <div
                            key={alert.id}
                            className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 border border-rose-300 animate-pulse"
                          >
                            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                            <span>ALERTA MÉDICA: {alert.conditionName}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 self-end md:self-center">
                    <Link
                      to={`/patients/${patient.id}`}
                      className="px-4 py-2 bg-slate-100 hover:bg-teal-600 hover:text-white text-slate-700 font-semibold rounded-xl text-xs transition flex items-center gap-1.5"
                    >
                      <span>Abrir Expediente</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Alta de Paciente */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">Registrar Ficha de Paciente</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Cédula / DNI *</label>
                  <input
                    type="text"
                    required
                    value={newPatient.identification}
                    onChange={(e) => setNewPatient({ ...newPatient, identification: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500"
                    placeholder="1728394850"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Teléfono Móvil *</label>
                  <input
                    type="text"
                    required
                    value={newPatient.phone}
                    onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500"
                    placeholder="+593 99..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Nombres *</label>
                  <input
                    type="text"
                    required
                    value={newPatient.firstName}
                    onChange={(e) => setNewPatient({ ...newPatient, firstName: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500"
                    placeholder="Juan Carlos"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Apellidos *</label>
                  <input
                    type="text"
                    required
                    value={newPatient.lastName}
                    onChange={(e) => setNewPatient({ ...newPatient, lastName: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500"
                    placeholder="Mendoza"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">F. Nacimiento</label>
                  <input
                    type="date"
                    required
                    value={newPatient.birthDate}
                    onChange={(e) => setNewPatient({ ...newPatient, birthDate: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Género</label>
                  <select
                    value={newPatient.gender}
                    onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                    <option value="OTRO">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Grupo Sangre</label>
                  <input
                    type="text"
                    value={newPatient.bloodType}
                    onChange={(e) => setNewPatient({ ...newPatient, bloodType: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                    placeholder="O+"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  value={newPatient.email}
                  onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  placeholder="juan.mendoza@email.com"
                />
              </div>

              {/* Sección Alertas Médicas (RF-02) */}
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-rose-800 flex items-center gap-1.5">
                    <HeartPulse className="w-4 h-4 text-rose-600" />
                    Condición Médica Crítica / Alergia
                  </span>
                  <input
                    type="checkbox"
                    checked={newPatient.hasAllergy}
                    onChange={(e) => setNewPatient({ ...newPatient, hasAllergy: e.target.checked })}
                    className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                  />
                </div>
                {newPatient.hasAllergy && (
                  <div>
                    <label className="text-slate-600 block mb-1 font-medium">
                      Especifique Condición (ej. Alergia a Penicilina, Anticoagulado, Diabetes):
                    </label>
                    <input
                      type="text"
                      value={newPatient.allergyName}
                      onChange={(e) => setNewPatient({ ...newPatient, allergyName: e.target.value })}
                      className="w-full p-2 bg-white border border-rose-300 rounded-xl focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 font-semibold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl shadow-md shadow-teal-600/20"
                >
                  Guardar Paciente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
