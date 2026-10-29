import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Patient, ToothSurface, SurfaceCondition, ToothGeneralCondition } from '../types';
import { InteractiveOdontogram } from '../components/odontogram/InteractiveOdontogram';

export const OdontogramView: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [patientData, setPatientData] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(false);

  // Modales
  const [surfaceModal, setSurfaceModal] = useState<{
    isOpen: boolean;
    toothNumber: number;
    surface: ToothSurface;
    currentCondition?: SurfaceCondition;
  }>({ isOpen: false, toothNumber: 0, surface: 'OCLUSAL' });

  const [toothModal, setToothModal] = useState<{
    isOpen: boolean;
    toothNumber: number;
    currentCondition: ToothGeneralCondition;
  }>({ isOpen: false, toothNumber: 0, currentCondition: 'SANO' });

  useEffect(() => {
    const fetchPatients = async () => {
      const res = await api.getPatients();
      setPatients(res.patients || []);
      if (res.patients?.length > 0) {
        setSelectedPatientId(res.patients[0].id);
      }
    };
    fetchPatients();
  }, []);

  const loadPatientOdontogram = async (patientId: string) => {
    if (!patientId) return;
    try {
      setLoading(true);
      const res = await api.getPatientById(patientId);
      setPatientData(res.patient);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPatientId) {
      loadPatientOdontogram(selectedPatientId);
    }
  }, [selectedPatientId]);

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
    if (!selectedPatientId) return;
    try {
      await api.updateOdontogramSurface(selectedPatientId, {
        toothNumber: surfaceModal.toothNumber,
        surface: surfaceModal.surface,
        condition,
      });
      setSurfaceModal({ ...surfaceModal, isOpen: false });
      loadPatientOdontogram(selectedPatientId);
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
    if (!selectedPatientId) return;
    try {
      await api.updateOdontogramTooth(selectedPatientId, {
        toothNumber: toothModal.toothNumber,
        condition,
      });
      setToothModal({ ...toothModal, isOpen: false });
      loadPatientOdontogram(selectedPatientId);
    } catch (err: any) {
      alert(err.message || 'Error al actualizar diente');
    }
  };

  const currentOdontogram = patientData?.odontograms?.[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
            Odontograma Gráfico Interactivo 2D (RF-03)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Registro visual anatómico con soporte FDI y Universal para dentición permanente y temporal
          </p>
        </div>

        {/* Selector de Paciente */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-600">Paciente:</label>
          <select
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold shadow-sm"
          >
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.firstName} {p.lastName} ({p.identification})
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400 text-sm">Cargando odontograma...</div>
      ) : (
        <InteractiveOdontogram
          teeth={currentOdontogram?.teeth || []}
          onSurfaceClick={handleSurfaceClick}
          onToothGeneralClick={handleToothGeneralClick}
        />
      )}

      {/* Modales */}
      {surfaceModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
            <h4 className="text-base font-bold text-slate-800 mb-1">
              Pieza {surfaceModal.toothNumber} • Superficie {surfaceModal.surface}
            </h4>
            <div className="space-y-2 mt-4 text-xs font-semibold">
              <button
                onClick={() => handleApplySurfaceCondition('CARIES')}
                className="w-full p-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 flex items-center justify-between"
              >
                <span>Caries Activa</span>
                <span className="w-4 h-4 rounded-full bg-red-500"></span>
              </button>
              <button
                onClick={() => handleApplySurfaceCondition('RESTAURACION_RESINA')}
                className="w-full p-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 flex items-center justify-between"
              >
                <span>Restauración Resina</span>
                <span className="w-4 h-4 rounded-full bg-blue-500"></span>
              </button>
              <button
                onClick={() => handleApplySurfaceCondition('RESTAURACION_AMALGAMA')}
                className="w-full p-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 flex items-center justify-between"
              >
                <span>Restauración Amalgama</span>
                <span className="w-4 h-4 rounded-full bg-slate-500"></span>
              </button>
              <button
                onClick={() => handleApplySurfaceCondition('SELLANTE')}
                className="w-full p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center justify-between"
              >
                <span>Sellante Preventivo</span>
                <span className="w-4 h-4 rounded-full bg-emerald-500"></span>
              </button>
              <button
                onClick={() => handleApplySurfaceCondition('FRACTURA')}
                className="w-full p-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 flex items-center justify-between"
              >
                <span>Fractura Dental</span>
                <span className="w-4 h-4 rounded-full bg-amber-500"></span>
              </button>
              <button
                onClick={() => handleApplySurfaceCondition(null)}
                className="w-full p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-200 text-center"
              >
                Limpiar Superficie
              </button>
            </div>
            <button
              onClick={() => setSurfaceModal({ ...surfaceModal, isOpen: false })}
              className="mt-4 w-full py-2 bg-slate-100 text-slate-600 font-bold rounded-xl text-xs"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {toothModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
            <h4 className="text-base font-bold text-slate-800 mb-1">
              Pieza {toothModal.toothNumber} • Estado General
            </h4>
            <div className="space-y-2 mt-4 text-xs font-semibold">
              <button
                onClick={() => handleApplyToothGeneral('SANO')}
                className="w-full p-2.5 rounded-xl bg-slate-50 hover:bg-teal-50 text-left border border-slate-200"
              >
                Sano
              </button>
              <button
                onClick={() => handleApplyToothGeneral('ENDODONCIA')}
                className="w-full p-2.5 rounded-xl bg-slate-50 hover:bg-red-50 text-left border border-slate-200"
              >
                Endodoncia Realizada
              </button>
              <button
                onClick={() => handleApplyToothGeneral('CORONA')}
                className="w-full p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 text-left border border-slate-200"
              >
                Corona Protésica
              </button>
              <button
                onClick={() => handleApplyToothGeneral('IMPLANTE')}
                className="w-full p-2.5 rounded-xl bg-slate-50 hover:bg-amber-50 text-left border border-slate-200"
              >
                Implante Dental
              </button>
              <button
                onClick={() => handleApplyToothGeneral('AUSENTE')}
                className="w-full p-2.5 rounded-xl bg-slate-50 hover:bg-rose-50 text-left border border-slate-200"
              >
                Ausente / Exodoncia
              </button>
            </div>
            <button
              onClick={() => setToothModal({ ...toothModal, isOpen: false })}
              className="mt-4 w-full py-2 bg-slate-100 text-slate-600 font-bold rounded-xl text-xs"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
