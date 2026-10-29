import React, { useRef, useState, useEffect } from 'react';
import { PenTool, CheckCircle2, RotateCcw, FileCheck, X, ShieldCheck } from 'lucide-react';
import { api } from '../../services/api';

interface DigitalConsentPadProps {
  patientId: string;
  patientName: string;
  onConsentCreated: () => void;
  onClose: () => void;
}

const standardProcedures = [
  {
    name: 'Exodoncia Simple y Quirúrgica (Terceros Molares)',
    terms:
      'Declaro haber sido informado detalladamente sobre el procedimiento de extracción dental, sus riesgos inherentes (inflamación, hematoma, parestesia temporal o trismo) y los cuidados postoperatorios obligatorios. Autorizo expresamente al profesional odontólogo a realizar la intervención.',
  },
  {
    name: 'Tratamiento de Endodoncia (Conductos Radiculares)',
    terms:
      'Comprendo que la terapia endodóntica busca conservar la pieza dental afectada por patología pulpar o periapical. Conozco los riesgos de anatomía compleja, necesidad de medicación intermedia o restauración coronaria posterior. Otorgo mi consentimiento informado.',
  },
  {
    name: 'Implantes Dentales Osteointegrados',
    terms:
      'He sido evaluado clínica y radiográficamente para la colocación de fijaciones de titanio en el hueso maxilar/mandibular. Conozco el periodo de osteointegración de 3 a 6 meses y la importancia del control de higiene bucal. Doy mi conformidad para la cirugía.',
  },
  {
    name: 'Tratamiento Ortodóncico Correctivo',
    terms:
      'Acepto el plan de tratamiento ortodóncico propuesto, comprendiendo la duración estimada, la necesidad de citas periódicas de ajuste y el uso de retenedores al finalizar para evitar recidivas.',
  },
];

export const DigitalConsentPad: React.FC<DigitalConsentPadProps> = ({
  patientId,
  patientName,
  onConsentCreated,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [selectedProcedure, setSelectedProcedure] = useState(standardProcedures[0].name);
  const [terms, setTerms] = useState(standardProcedures[0].terms);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const proc = standardProcedures.find((p) => p.name === selectedProcedure);
    if (proc) setTerms(proc.terms);
  }, [selectedProcedure]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasSignature(true);
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0f172a';
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasSignature) {
      alert('Por favor dibuje la firma biométrica en el recuadro antes de continuar.');
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const signatureData = canvas.toDataURL('image/png');

    try {
      setSubmitting(true);
      await api.createInformedConsent({
        patientId,
        procedureName: selectedProcedure,
        termsText: terms,
        signatureData,
        signatureType: 'BIOMETRIC',
      });
      onConsentCreated();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Error al guardar consentimiento informado');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-600" />
            <h3 className="text-base font-bold text-slate-800">
              Consentimiento Informado Digital (RF-06)
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Paciente / Titular:</label>
            <input
              type="text"
              disabled
              value={patientName}
              className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-700"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Procedimiento Odontológico *</label>
            <select
              value={selectedProcedure}
              onChange={(e) => setSelectedProcedure(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
            >
              {standardProcedures.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Términos y Declaración Legal *</label>
            <textarea
              rows={4}
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl leading-relaxed text-slate-600"
            />
          </div>

          {/* Área de Firma Táctil / Stylus */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-800 flex items-center gap-1.5">
                <PenTool className="w-3.5 h-3.5 text-teal-600" />
                Firma Biométrica en Pantalla (Tablet / Mouse / Stylus) *
              </label>
              <button
                type="button"
                onClick={clearCanvas}
                className="text-xs text-rose-600 font-semibold hover:underline flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Limpiar trazo
              </button>
            </div>

            <div className="border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 p-1 flex justify-center">
              <canvas
                ref={canvasRef}
                width={500}
                height={160}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="bg-white rounded-xl shadow-inner w-full touch-none cursor-crosshair"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1 text-center">
              Firma válida con estampado cronológico y valor legal probatorio según la norma de expediente digital.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 text-slate-600 font-semibold rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || !hasSignature}
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md shadow-teal-600/20 disabled:opacity-50 transition"
            >
              {submitting ? 'Sellando...' : 'Firmar y Registrar Consentimiento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
