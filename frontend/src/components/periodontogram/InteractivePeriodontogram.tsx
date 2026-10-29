import React, { useState } from 'react';
import { ShieldAlert, Plus, Activity, Check, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';

interface PeriodontalEntry {
  id?: string;
  toothNumber: number;
  site: 'MV' | 'V' | 'DV' | 'ML' | 'L' | 'DL';
  pocketDepthMm: number;
  gingivalMarginMm: number;
  clinicalAttachmentLevel: number;
  bleedingOnProbing: boolean;
  furcationGrade?: number | null;
  mobilityGrade?: number | null;
}

interface PeriodontogramProps {
  patientId: string;
  initialEntries: PeriodontalEntry[];
  onRefresh: () => void;
  readOnly?: boolean;
}

export const InteractivePeriodontogram: React.FC<PeriodontogramProps> = ({
  patientId,
  initialEntries,
  onRefresh,
  readOnly = false,
}) => {
  const [selectedTooth, setSelectedTooth] = useState<number>(16);
  const [site, setSite] = useState<'MV' | 'V' | 'DV' | 'ML' | 'L' | 'DL'>('V');
  const [pocketDepth, setPocketDepth] = useState<number>(3);
  const [gingivalMargin, setGingivalMargin] = useState<number>(0);
  const [bleeding, setBleeding] = useState<boolean>(false);
  const [furcation, setFurcation] = useState<number>(0);
  const [mobility, setMobility] = useState<number>(0);
  const [saving, setSaving] = useState<boolean>(false);

  const teethUpper = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
  const teethLower = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

  const handleSaveMeasurement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.savePeriodontalMeasurement({
        patientId,
        toothNumber: selectedTooth,
        site,
        pocketDepthMm: Number(pocketDepth),
        gingivalMarginMm: Number(gingivalMargin),
        bleedingOnProbing: bleeding,
        furcationGrade: Number(furcation),
        mobilityGrade: Number(mobility),
      });
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Error al guardar medición periodontal');
    } finally {
      setSaving(false);
    }
  };

  const getMeasurement = (tooth: number, s: string) => {
    return initialEntries.find((e) => e.toothNumber === tooth && e.site === s);
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Activity className="w-5 h-5 text-teal-600" />
            Periodontograma Digital Clínico (RF-04)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Mapeo de 6 puntos por pieza dental: Profundidad de Sondaje (PS), Margen Gingival (MG) y Nivel de Inserción Clínica (NIC)
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs font-semibold">
          <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> PS ≤ 3mm (Sano)
          </span>
          <span className="flex items-center gap-1.5 text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> PS ≥ 4mm (Bolsa Periodontal)
          </span>
        </div>
      </div>

      {/* Formulario de Captura Rápida de Medición (6 Puntos) */}
      {!readOnly && (
        <form
          onSubmit={handleSaveMeasurement}
          className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-3"
        >
          <div className="font-bold text-slate-700 flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-teal-600" /> Captura de Medición por Sitio Dental
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            <div>
              <label className="font-semibold text-slate-600 block mb-1">Pieza Dental *</label>
              <select
                value={selectedTooth}
                onChange={(e) => setSelectedTooth(Number(e.target.value))}
                className="w-full p-2 bg-white border border-slate-300 rounded-xl font-bold"
              >
                <optgroup label="Arcada Superior">
                  {teethUpper.map((t) => (
                    <option key={t} value={t}>
                      Pieza {t}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Arcada Inferior">
                  {teethLower.map((t) => (
                    <option key={t} value={t}>
                      Pieza {t}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-600 block mb-1">Sitio (6 Puntos) *</label>
              <select
                value={site}
                onChange={(e) => setSite(e.target.value as any)}
                className="w-full p-2 bg-white border border-slate-300 rounded-xl font-bold text-teal-800"
              >
                <option value="DV">Disto-Vestibular (DV)</option>
                <option value="V">Vestibular Centro (V)</option>
                <option value="MV">Mesio-Vestibular (MV)</option>
                <option value="DL">Disto-Lingual/Palatino (DL)</option>
                <option value="L">Lingual/Palatino Centro (L)</option>
                <option value="ML">Mesio-Lingual/Palatino (ML)</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-600 block mb-1">
                Profundidad Sondaje (mm) *
              </label>
              <input
                type="number"
                min="0"
                max="15"
                required
                value={pocketDepth}
                onChange={(e) => setPocketDepth(Number(e.target.value))}
                className={`w-full p-2 bg-white border rounded-xl font-black ${
                  pocketDepth >= 4 ? 'border-rose-400 text-rose-700 bg-rose-50' : 'border-slate-300 text-emerald-700'
                }`}
              />
            </div>

            <div>
              <label className="font-semibold text-slate-600 block mb-1">Margen Gingival (mm)</label>
              <input
                type="number"
                min="-10"
                max="10"
                value={gingivalMargin}
                onChange={(e) => setGingivalMargin(Number(e.target.value))}
                className="w-full p-2 bg-white border border-slate-300 rounded-xl font-bold"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-600 block mb-1">NIC Calculado</label>
              <div className="w-full p-2 bg-slate-200/60 rounded-xl font-black text-slate-800 text-center">
                {Number(pocketDepth) + Number(gingivalMargin)} mm
              </div>
            </div>

            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-1.5 p-2 bg-white border border-slate-200 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={bleeding}
                  onChange={(e) => setBleeding(e.target.checked)}
                  className="rounded text-rose-600 w-4 h-4"
                />
                <span className="font-bold text-rose-700 text-[11px]">Sangrado (BOP)</span>
              </label>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={saving}
                className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md shadow-teal-600/20 transition"
              >
                {saving ? '...' : 'Registrar'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Grilla Periodontal de Visualización (Arcada Superior e Inferior) */}
      <div className="space-y-6 overflow-x-auto text-xs">
        <div>
          <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-2 text-center">
            Arcada Superior (18 a 28)
          </h4>
          <div className="grid grid-cols-16 gap-1 min-w-[750px]">
            {teethUpper.map((tooth) => {
              const dv = getMeasurement(tooth, 'DV');
              const v = getMeasurement(tooth, 'V');
              const mv = getMeasurement(tooth, 'MV');
              const maxDepth = Math.max(
                dv?.pocketDepthMm || 0,
                v?.pocketDepthMm || 0,
                mv?.pocketDepthMm || 0
              );

              return (
                <div
                  key={tooth}
                  onClick={() => setSelectedTooth(tooth)}
                  className={`p-1.5 rounded-xl border text-center cursor-pointer transition ${
                    selectedTooth === tooth
                      ? 'border-teal-500 bg-teal-50 ring-2 ring-teal-500/20'
                      : maxDepth >= 4
                      ? 'border-rose-300 bg-rose-50/50'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-black text-slate-800 text-[11px] mb-1">{tooth}</div>
                  <div className="flex justify-between gap-0.5 text-[9px] font-mono">
                    <span className={dv && dv.pocketDepthMm >= 4 ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                      {dv ? dv.pocketDepthMm : '-'}
                    </span>
                    <span className={v && v.pocketDepthMm >= 4 ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                      {v ? v.pocketDepthMm : '-'}
                    </span>
                    <span className={mv && mv.pocketDepthMm >= 4 ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                      {mv ? mv.pocketDepthMm : '-'}
                    </span>
                  </div>
                  {/* Indicador de sangrado */}
                  {(dv?.bleedingOnProbing || v?.bleedingOnProbing || mv?.bleedingOnProbing) && (
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mx-auto mt-1" title="Sangrado al sondaje"></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-2 text-center">
            Arcada Inferior (48 a 38)
          </h4>
          <div className="grid grid-cols-16 gap-1 min-w-[750px]">
            {teethLower.map((tooth) => {
              const dv = getMeasurement(tooth, 'DV');
              const v = getMeasurement(tooth, 'V');
              const mv = getMeasurement(tooth, 'MV');
              const maxDepth = Math.max(
                dv?.pocketDepthMm || 0,
                v?.pocketDepthMm || 0,
                mv?.pocketDepthMm || 0
              );

              return (
                <div
                  key={tooth}
                  onClick={() => setSelectedTooth(tooth)}
                  className={`p-1.5 rounded-xl border text-center cursor-pointer transition ${
                    selectedTooth === tooth
                      ? 'border-teal-500 bg-teal-50 ring-2 ring-teal-500/20'
                      : maxDepth >= 4
                      ? 'border-rose-300 bg-rose-50/50'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-black text-slate-800 text-[11px] mb-1">{tooth}</div>
                  <div className="flex justify-between gap-0.5 text-[9px] font-mono">
                    <span className={dv && dv.pocketDepthMm >= 4 ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                      {dv ? dv.pocketDepthMm : '-'}
                    </span>
                    <span className={v && v.pocketDepthMm >= 4 ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                      {v ? v.pocketDepthMm : '-'}
                    </span>
                    <span className={mv && mv.pocketDepthMm >= 4 ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                      {mv ? mv.pocketDepthMm : '-'}
                    </span>
                  </div>
                  {(dv?.bleedingOnProbing || v?.bleedingOnProbing || mv?.bleedingOnProbing) && (
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mx-auto mt-1" title="Sangrado al sondaje"></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
