import React, { useEffect, useState } from 'react';
import { Boxes, AlertTriangle, Plus, ArrowUpRight, ArrowDownLeft, X } from 'lucide-react';
import { api } from '../services/api';
import { InventoryItem } from '../types';

export const Inventory: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [movementForm, setMovementForm] = useState({
    inventoryItemId: '',
    movementType: 'SALIDA_CLINICA' as 'ENTRADA' | 'SALIDA_CLINICA' | 'AJUSTE',
    quantity: 1,
    reference: 'Descargo por procedimiento clínico',
  });

  const loadInventory = async () => {
    try {
      setLoading(true);
      const res = await api.getInventory();
      setItems(res.inventory || []);
      if (res.inventory?.length > 0 && !movementForm.inventoryItemId) {
        setMovementForm((prev) => ({ ...prev, inventoryItemId: res.inventory[0].id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const handleRegisterMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.registerStockMovement({
        inventoryItemId: movementForm.inventoryItemId,
        movementType: movementForm.movementType,
        quantity: Number(movementForm.quantity),
        reference: movementForm.reference,
      });

      setShowModal(false);
      loadInventory();
    } catch (err: any) {
      alert(err.message || 'Error al registrar movimiento');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
            Control de Insumos & Stock Clínico (RF-14)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Gestión de materiales dentales por consultorio y descargo por procedimiento
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-teal-600/20 transition"
        >
          <Plus className="w-4 h-4" /> Registrar Movimiento de Stock
        </button>
      </div>

      {/* Grid de Insumos */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm">Cargando inventario...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider bg-slate-50/50">
                  <th className="p-4">Código / Insumo</th>
                  <th className="p-4">Categoría</th>
                  <th className="p-4">Unidad</th>
                  <th className="p-4">Stock Actual</th>
                  <th className="p-4">Stock Mínimo</th>
                  <th className="p-4">Costo Unitario</th>
                  <th className="p-4">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-4">
                      <div className="font-bold text-slate-800">{item.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{item.code}</div>
                    </td>
                    <td className="p-4 text-slate-600">{item.category}</td>
                    <td className="p-4 text-slate-500">{item.unitOfMeasure}</td>
                    <td className="p-4 font-black text-slate-800 text-sm">
                      {Number(item.stockQuantity).toFixed(1)}
                    </td>
                    <td className="p-4 text-slate-400">
                      {Number(item.minStockThreshold).toFixed(1)}
                    </td>
                    <td className="p-4 font-semibold text-slate-700">
                      ${Number(item.costPerUnit).toFixed(2)}
                    </td>
                    <td className="p-4">
                      {item.isLowStock ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                          <AlertTriangle className="w-3 h-3 text-rose-500" /> Stock Crítico
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[11px] font-bold px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                          Óptimo
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Registrar Movimiento */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">Registrar Movimiento de Stock</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterMovement} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Insumo Dental *</label>
                <select
                  required
                  value={movementForm.inventoryItemId}
                  onChange={(e) =>
                    setMovementForm({ ...movementForm, inventoryItemId: e.target.value })
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  {items.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} (Disp: {Number(i.stockQuantity).toFixed(1)} {i.unitOfMeasure})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Tipo de Movimiento *</label>
                <select
                  value={movementForm.movementType}
                  onChange={(e) =>
                    setMovementForm({
                      ...movementForm,
                      movementType: e.target.value as any,
                    })
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                >
                  <option value="SALIDA_CLINICA">Salida Clínica (Descargo por atención)</option>
                  <option value="ENTRADA">Entrada (Compra o reposición)</option>
                  <option value="AJUSTE">Ajuste de Inventario</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Cantidad *</label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  required
                  value={movementForm.quantity}
                  onChange={(e) =>
                    setMovementForm({ ...movementForm, quantity: Number(e.target.value) })
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Motivo / Referencia</label>
                <input
                  type="text"
                  value={movementForm.reference}
                  onChange={(e) => setMovementForm({ ...movementForm, reference: e.target.value })}
                  placeholder="No. Tratamiento o factura..."
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
                  Guardar Movimiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
