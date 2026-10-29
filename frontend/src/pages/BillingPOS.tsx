import React, { useEffect, useState } from 'react';
import {
  Receipt,
  DollarSign,
  Lock,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Plus,
  CreditCard,
  Building2,
  Clock,
} from 'lucide-react';
import { api } from '../services/api';
import { CashShift, Invoice, Patient, PaymentMethod } from '../types';

export const BillingPOS: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'POS' | 'COMMISSIONS'>('POS');
  const [currentShift, setCurrentShift] = useState<CashShift | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados Formularios
  const [initialCashInput, setInitialCashInput] = useState<number>(50);
  const [countedCashInput, setCountedCashInput] = useState<number>(0);
  const [blindCloseResult, setBlindCloseResult] = useState<any>(null);

  // Formulario Factura POS
  const [invoiceForm, setInvoiceForm] = useState({
    patientId: '',
    subtotal: 75.0,
    paymentMethod: 'CASH' as PaymentMethod,
    referenceCode: '',
    notes: 'Tratamiento odontológico',
  });

  const loadBillingData = async () => {
    try {
      setLoading(true);
      const [shiftRes, invRes, patRes, comRes] = await Promise.all([
        api.getCurrentShift(),
        api.getInvoices(),
        api.getPatients(),
        api.getCommissions().catch(() => ({ commissions: [] })),
      ]);

      setCurrentShift(shiftRes.shift);
      setInvoices(invRes.invoices || []);
      setPatients(patRes.patients || []);
      setCommissions(comRes.commissions || []);
      if (patRes.patients?.length > 0 && !invoiceForm.patientId) {
        setInvoiceForm((prev) => ({ ...prev, patientId: patRes.patients[0].id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBillingData();
  }, []);

  const handleOpenShift = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.openShift({ initialCash: Number(initialCashInput) });
      setBlindCloseResult(null);
      loadBillingData();
    } catch (err: any) {
      alert(err.message || 'Error al abrir caja');
    }
  };

  const handleCloseBlindShift = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.closeBlindShift({ countedCash: Number(countedCashInput) });
      setBlindCloseResult(res.summary);
      loadBillingData();
    } catch (err: any) {
      alert(err.message || 'Error al procesar cierre de caja');
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createInvoice({
        patientId: invoiceForm.patientId,
        subtotal: Number(invoiceForm.subtotal),
        taxRate: 0,
        payments: [
          {
            paymentMethod: invoiceForm.paymentMethod,
            amount: Number(invoiceForm.subtotal),
            referenceCode: invoiceForm.referenceCode || null,
          },
        ],
        notes: invoiceForm.notes,
      });

      setInvoiceForm({ ...invoiceForm, referenceCode: '', subtotal: 50 });
      loadBillingData();
    } catch (err: any) {
      alert(err.message || 'Error al generar factura');
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
            Punto de Venta & Cierre de Caja Ciego (RF-12 & RN-02)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Cobros multicanal y arqueo a ciegas para prevención de fraude y descuadres
          </p>
        </div>
      </div>

      {/* Selector de Pestaña: POS / Caja vs Liquidación de Honorarios (RF-13) */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('POS')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
            activeTab === 'POS'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Receipt className="w-4 h-4" /> Punto de Venta & Caja Ciega (RN-02)
        </button>
        <button
          onClick={() => setActiveTab('COMMISSIONS')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
            activeTab === 'COMMISSIONS'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <DollarSign className="w-4 h-4" /> Liquidación de Honorarios & Comisiones (RF-13)
        </button>
      </div>

      {activeTab === 'POS' ? (
        /* Panel de Caja Diaria (RN-02) */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Estado y Arqueo Ciego */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-teal-600" /> Control de Turno de Caja
            </h3>
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                currentShift?.status === 'OPEN'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {currentShift?.status === 'OPEN' ? '🟢 Caja Abierta' : '🔴 Caja Cerrada'}
            </span>
          </div>

          {!currentShift ? (
            /* Formulario Abrir Caja */
            <form onSubmit={handleOpenShift} className="space-y-3 text-xs pt-2">
              <p className="text-slate-500">
                Inicie su jornada laboral ingresando el fondo de caja inicial:
              </p>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Fondo Inicial ($USD):</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={initialCashInput}
                  onChange={(e) => setInitialCashInput(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md shadow-teal-600/20"
              >
                Abrir Turno de Caja
              </button>
            </form>
          ) : (
            /* Formulario RN-02 Cierre Ciego */
            <div className="space-y-4 text-xs pt-2">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Apertura:</span>
                  <span className="font-semibold">
                    {new Date(currentShift.openedAt).toLocaleTimeString()}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Fondo Inicial:</span>
                  <span className="font-bold text-slate-800">
                    ${Number(currentShift.initialCash).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* RN-02 Explicación del Cierre Ciego */}
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-800 text-[11px] leading-relaxed flex items-start gap-2">
                <EyeOff className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <span>
                  <strong>RN-02 (Cierre Ciego):</strong> Por seguridad, el sistema no muestra el saldo teórico acumulado. Ingrese el recuento físico de efectivo para verificar el cuadre exacto.
                </span>
              </div>

              <form onSubmit={handleCloseBlindShift} className="space-y-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Recuento Físico Total de Efectivo ($USD) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={countedCashInput}
                    onChange={(e) => setCountedCashInput(Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-black text-sm text-teal-800"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition"
                >
                  Procesar Cierre de Caja Ciego (RN-02)
                </button>
              </form>
            </div>
          )}

          {/* Resultado del Cierre Ciego (Se revela solo tras procesar) */}
          {blindCloseResult && (
            <div className="mt-4 p-4 bg-teal-50 border border-teal-200 rounded-2xl space-y-2 text-xs">
              <div className="font-bold text-teal-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                Resultado de Cuadre Revelado:
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Fondo Inicial:</span>
                <span>${blindCloseResult.initialCash.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Cobrado en Efectivo:</span>
                <span>${blindCloseResult.totalCashCollected.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-700 border-t border-teal-200 pt-1">
                <span>Teórico Esperado:</span>
                <span>${blindCloseResult.systemCalculatedCash.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-800">
                <span>Conteo Físico Ingresado:</span>
                <span>${blindCloseResult.countedCash.toFixed(2)}</span>
              </div>
              <div
                className={`flex justify-between font-black text-sm pt-1 border-t border-teal-200 ${
                  blindCloseResult.difference === 0
                    ? 'text-emerald-700'
                    : blindCloseResult.difference > 0
                    ? 'text-blue-700'
                    : 'text-rose-700'
                }`}
              >
                <span>Diferencia:</span>
                <span>
                  {blindCloseResult.difference === 0
                    ? '✅ Cuadre Exacto ($0.00)'
                    : blindCloseResult.difference > 0
                    ? `Sobrante: +$${blindCloseResult.difference.toFixed(2)}`
                    : `Faltante: -$${Math.abs(blindCloseResult.difference).toFixed(2)}`}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Emisión de Comprobantes POS */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Receipt className="w-4 h-4 text-teal-600" /> Emisión Rápida de Comprobante / Cobro POS
          </h3>

          <form onSubmit={handleCreateInvoice} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Paciente *</label>
              <select
                required
                value={invoiceForm.patientId}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, patientId: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.firstName} {p.lastName} ({p.identification})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Método de Pago (RF-12) *</label>
              <select
                value={invoiceForm.paymentMethod}
                onChange={(e) =>
                  setInvoiceForm({ ...invoiceForm, paymentMethod: e.target.value as PaymentMethod })
                }
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
              >
                <option value="CASH">Efectivo ($USD)</option>
                <option value="CREDIT_CARD">Tarjeta de Crédito</option>
                <option value="DEBIT_CARD">Tarjeta de Débito</option>
                <option value="TRANSFER">Transferencia Bancaria</option>
                <option value="INSURANCE">Seguro Dental / Convenio</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Importe a Cobrar ($USD) *</label>
              <input
                type="number"
                min="1"
                step="0.01"
                required
                value={invoiceForm.subtotal}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, subtotal: Number(e.target.value) })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-teal-800"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Referencia / Lote Voucher</label>
              <input
                type="text"
                value={invoiceForm.referenceCode}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, referenceCode: e.target.value })}
                placeholder="No. Transacción / Autorización"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div className="md:col-span-2">
              <label className="font-bold text-slate-700 block mb-1">Detalle / Concepto</label>
              <input
                type="text"
                value={invoiceForm.notes}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md shadow-teal-600/20 text-xs transition"
              >
                Emitir Comprobante & Registrar Pago
              </button>
            </div>
          </form>

          {/* Tabla de Facturas Recientes */}
          <div className="pt-4 border-t border-slate-100">
            <h4 className="font-bold text-slate-800 text-xs mb-3">Comprobantes Emitidos Hoy</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase">
                    <th className="pb-2">No. Factura</th>
                    <th className="pb-2">Paciente</th>
                    <th className="pb-2">Método</th>
                    <th className="pb-2">Monto</th>
                    <th className="pb-2">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.slice(0, 5).map((inv) => (
                    <tr key={inv.id}>
                      <td className="py-2.5 font-bold text-slate-800">{inv.invoiceNumber}</td>
                      <td className="py-2.5 text-slate-700">
                        {inv.patient?.firstName} {inv.patient?.lastName}
                      </td>
                      <td className="py-2.5">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-semibold text-slate-600">
                          {inv.payments?.[0]?.paymentMethod || 'MIXTO'}
                        </span>
                      </td>
                      <td className="py-2.5 font-black text-slate-900">
                        ${Number(inv.totalAmount).toFixed(2)}
                      </td>
                      <td className="py-2.5 text-slate-400 text-[11px]">
                        {new Date(inv.issueDate).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      ) : (
        /* Vista de Liquidación de Honorarios & Comisiones Médicas (RF-13) */
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-teal-600" />
              Liquidación y Cálculo de Honorarios Profesionales (RF-13)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Liquidación configurable de comisiones a odontólogos según procedimientos atendidos y reglas de porcentaje
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase bg-slate-50/50">
                  <th className="p-3">Profesional Odontólogo</th>
                  <th className="p-3">Especialidad</th>
                  <th className="p-3">Cédula / Registro</th>
                  <th className="p-3">Citas / Procedimientos</th>
                  <th className="p-3">% Comisión Pactado</th>
                  <th className="p-3 font-bold text-slate-800">Total Liquidación ($USD)</th>
                  <th className="p-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {commissions.map((c) => (
                  <tr key={c.dentistId} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-bold text-slate-800">{c.dentistName}</td>
                    <td className="p-3 text-slate-600">{c.specialty}</td>
                    <td className="p-3 text-slate-400 font-mono">{c.licenseNumber}</td>
                    <td className="p-3 font-bold text-teal-700">{c.completedAppointments} realizadas</td>
                    <td className="p-3 font-semibold text-slate-700">{c.commissionRatePercent}%</td>
                    <td className="p-3 font-black text-slate-900 text-sm">
                      ${c.estimatedHonoraries.toFixed(2)}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => alert(`Liquidación de $${c.estimatedHonoraries.toFixed(2)} procesada para ${c.dentistName}`)}
                        className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold rounded-lg text-xs transition border border-teal-200"
                      >
                        Generar Pago
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
