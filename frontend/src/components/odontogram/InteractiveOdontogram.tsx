import React, { useState } from 'react';
import {
  ToothRecord,
  ToothSurface,
  SurfaceCondition,
  ToothGeneralCondition,
} from '../../types';

interface InteractiveOdontogramProps {
  teeth: ToothRecord[];
  onSurfaceClick: (toothNumber: number, surface: ToothSurface, currentCondition?: SurfaceCondition) => void;
  onToothGeneralClick: (toothNumber: number, currentCondition: ToothGeneralCondition) => void;
  readOnly?: boolean;
}

export const InteractiveOdontogram: React.FC<InteractiveOdontogramProps> = ({
  teeth,
  onSurfaceClick,
  onToothGeneralClick,
  readOnly = false,
}) => {
  const [dentitionType, setDentitionType] = useState<'PERMANENT' | 'TEMPORARY'>('PERMANENT');

  // Notación FDI permanente:
  // Cuadrante 1: 18 - 11 | Cuadrante 2: 21 - 28 (Superior)
  // Cuadrante 4: 48 - 41 | Cuadrante 3: 31 - 38 (Inferior)
  const upperRightPerm = [18, 17, 16, 15, 14, 13, 12, 11];
  const upperLeftPerm = [21, 22, 23, 24, 25, 26, 27, 28];
  const lowerRightPerm = [48, 47, 46, 45, 44, 43, 42, 41];
  const lowerLeftPerm = [31, 32, 33, 34, 35, 36, 37, 38];

  // Dentición Temporal (Decidua / Niños)
  const upperRightTemp = [55, 54, 53, 52, 51];
  const upperLeftTemp = [61, 62, 63, 64, 65];
  const lowerRightTemp = [85, 84, 83, 82, 81];
  const lowerLeftTemp = [71, 72, 73, 74, 75];

  const getToothRecord = (num: number) => teeth.find((t) => t.toothNumber === num);

  const getSurfaceColor = (toothRecord?: ToothRecord, surface?: ToothSurface) => {
    if (!toothRecord || !surface) return '#ffffff';
    const s = toothRecord.surfaces?.find((item) => item.surface === surface);
    return s?.colorCode || '#ffffff';
  };

  const renderSingleTooth = (num: number) => {
    const record = getToothRecord(num);
    const isAbsent = record?.generalCondition === 'AUSENTE';
    const isEndo = record?.generalCondition === 'ENDODONCIA';
    const isCrown = record?.generalCondition === 'CORONA';
    const isImplant = record?.generalCondition === 'IMPLANTE';

    return (
      <div key={num} className="flex flex-col items-center p-1.5 group select-none">
        <span className="text-xs font-bold text-slate-700 mb-1 group-hover:text-teal-600 transition">
          {num}
        </span>

        {/* Contenedor del Diente con SVG de 5 Caras */}
        <div className="relative w-12 h-12 bg-white rounded-lg shadow-sm border border-slate-300 flex items-center justify-center p-1 hover:border-teal-500 transition">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            {/* Cara Vestibular (Arriba) */}
            <polygon
              points="0,0 100,0 75,25 25,25"
              fill={getSurfaceColor(record, 'VESTIBULAR')}
              stroke="#64748b"
              strokeWidth="2"
              className="cursor-pointer hover:opacity-80 transition"
              onClick={() =>
                !readOnly &&
                onSurfaceClick(
                  num,
                  'VESTIBULAR',
                  record?.surfaces?.find((s) => s.surface === 'VESTIBULAR')?.condition
                )
              }
            />

            {/* Cara Lingual/Palatina (Abajo) */}
            <polygon
              points="0,100 100,100 75,75 25,75"
              fill={getSurfaceColor(record, 'LINGUAL')}
              stroke="#64748b"
              strokeWidth="2"
              className="cursor-pointer hover:opacity-80 transition"
              onClick={() =>
                !readOnly &&
                onSurfaceClick(
                  num,
                  'LINGUAL',
                  record?.surfaces?.find((s) => s.surface === 'LINGUAL')?.condition
                )
              }
            />

            {/* Cara Mesial (Izquierda) */}
            <polygon
              points="0,0 25,25 25,75 0,100"
              fill={getSurfaceColor(record, 'MESIAL')}
              stroke="#64748b"
              strokeWidth="2"
              className="cursor-pointer hover:opacity-80 transition"
              onClick={() =>
                !readOnly &&
                onSurfaceClick(
                  num,
                  'MESIAL',
                  record?.surfaces?.find((s) => s.surface === 'MESIAL')?.condition
                )
              }
            />

            {/* Cara Distal (Derecha) */}
            <polygon
              points="100,0 75,25 75,75 100,100"
              fill={getSurfaceColor(record, 'DISTAL')}
              stroke="#64748b"
              strokeWidth="2"
              className="cursor-pointer hover:opacity-80 transition"
              onClick={() =>
                !readOnly &&
                onSurfaceClick(
                  num,
                  'DISTAL',
                  record?.surfaces?.find((s) => s.surface === 'DISTAL')?.condition
                )
              }
            />

            {/* Cara Oclusal / Incisal (Centro) */}
            <polygon
              points="25,25 75,25 75,75 25,75"
              fill={getSurfaceColor(record, 'OCLUSAL')}
              stroke="#64748b"
              strokeWidth="2"
              className="cursor-pointer hover:opacity-80 transition"
              onClick={() =>
                !readOnly &&
                onSurfaceClick(
                  num,
                  'OCLUSAL',
                  record?.surfaces?.find((s) => s.surface === 'OCLUSAL')?.condition
                )
              }
            />

            {/* Capa de Estado General */}
            {isAbsent && (
              <line x1="10" y1="10" x2="90" y2="90" stroke="#ef4444" strokeWidth="6" strokeLinecap="round" />
            )}
            {isAbsent && (
              <line x1="90" y1="10" x2="10" y2="90" stroke="#ef4444" strokeWidth="6" strokeLinecap="round" />
            )}
            {isEndo && (
              <line x1="50" y1="15" x2="50" y2="85" stroke="#dc2626" strokeWidth="6" strokeDasharray="3 3" />
            )}
            {isCrown && (
              <circle cx="50" cy="50" r="42" fill="none" stroke="#2563eb" strokeWidth="4" />
            )}
            {isImplant && (
              <rect x="35" y="10" width="30" height="80" fill="none" stroke="#d97706" strokeWidth="3" rx="4" />
            )}
          </svg>
        </div>

        {/* Botón de condición general */}
        {!readOnly && (
          <button
            onClick={() => onToothGeneralClick(num, record?.generalCondition || 'SANO')}
            className={`mt-1 text-[10px] font-semibold px-1.5 py-0.5 rounded transition ${
              record?.generalCondition && record.generalCondition !== 'SANO'
                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            {record?.generalCondition && record.generalCondition !== 'SANO'
              ? record.generalCondition.slice(0, 4)
              : 'Estado'}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="bg-slate-50/70 p-6 rounded-3xl border border-slate-200">
      {/* Selector Dentición Permanente vs Temporal */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
        <div>
          <h4 className="text-sm font-bold text-slate-800">Odontograma Anatómico 2D (Notación FDI)</h4>
          <p className="text-xs text-slate-500">Selecciona una superficie para aplicar diagnóstico o tratamiento</p>
        </div>
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs">
          <button
            onClick={() => setDentitionType('PERMANENT')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              dentitionType === 'PERMANENT'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Permanente (32 dientes)
          </button>
          <button
            onClick={() => setDentitionType('TEMPORARY')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              dentitionType === 'TEMPORARY'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Temporal / Decidua (20 dientes)
          </button>
        </div>
      </div>

      {/* Renderizado de Arcadas Dentales */}
      {dentitionType === 'PERMANENT' ? (
        <div className="space-y-6">
          {/* Arcada Superior */}
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">
              Arcada Superior (Maxilar)
            </div>
            <div className="flex justify-center items-center gap-2 overflow-x-auto pb-2">
              <div className="flex items-center gap-1 border-r-2 border-slate-300 pr-2">
                {upperRightPerm.map(renderSingleTooth)}
              </div>
              <div className="flex items-center gap-1 pl-2">
                {upperLeftPerm.map(renderSingleTooth)}
              </div>
            </div>
          </div>

          <div className="border-t border-dashed border-slate-300 my-4" />

          {/* Arcada Inferior */}
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">
              Arcada Inferior (Mandíbula)
            </div>
            <div className="flex justify-center items-center gap-2 overflow-x-auto pb-2">
              <div className="flex items-center gap-1 border-r-2 border-slate-300 pr-2">
                {lowerRightPerm.map(renderSingleTooth)}
              </div>
              <div className="flex items-center gap-1 pl-2">
                {lowerLeftPerm.map(renderSingleTooth)}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Arcada Superior Temporal */}
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">
              Arcada Superior Temporal
            </div>
            <div className="flex justify-center items-center gap-2 overflow-x-auto pb-2">
              <div className="flex items-center gap-1 border-r-2 border-slate-300 pr-2">
                {upperRightTemp.map(renderSingleTooth)}
              </div>
              <div className="flex items-center gap-1 pl-2">
                {upperLeftTemp.map(renderSingleTooth)}
              </div>
            </div>
          </div>

          <div className="border-t border-dashed border-slate-300 my-4" />

          {/* Arcada Inferior Temporal */}
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">
              Arcada Inferior Temporal
            </div>
            <div className="flex justify-center items-center gap-2 overflow-x-auto pb-2">
              <div className="flex items-center gap-1 border-r-2 border-slate-300 pr-2">
                {lowerRightTemp.map(renderSingleTooth)}
              </div>
              <div className="flex items-center gap-1 pl-2">
                {lowerLeftTemp.map(renderSingleTooth)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Convenciones y Leyenda Estandarizada */}
      <div className="mt-8 pt-5 border-t border-slate-200 flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-slate-600">
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-full bg-red-500 inline-block"></span>
          <span>Caries (Rojo)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-full bg-blue-500 inline-block"></span>
          <span>Resina (Azul)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-full bg-slate-500 inline-block"></span>
          <span>Amalgama (Gris)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 inline-block"></span>
          <span>Sellante (Verde)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-full bg-amber-500 inline-block"></span>
          <span>Fractura (Ámbar)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-full border-2 border-red-500 flex items-center justify-center text-[10px] text-red-600 font-bold">
            X
          </span>
          <span>Ausente / Exodoncia</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-full border-2 border-blue-600"></span>
          <span>Corona</span>
        </div>
      </div>
    </div>
  );
};
