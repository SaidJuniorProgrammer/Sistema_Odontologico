import React, { useEffect, useState } from 'react';
import { ShieldCheck, Search, Filter, Lock, Terminal } from 'lucide-react';
import { api } from '../services/api';
import { AuditLog } from '../types';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState<string>('');

  const loadLogs = async () => {
    try {
      setLoading(true);
      const res = await api.getAuditLogs({ action: filterAction || undefined });
      setLogs(res.logs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [filterAction]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
            Bitácora de Auditoría Inmutable (RNF-06)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Registro criptográfico de trazabilidad para cada acción CRUD, acceso clínico y cobro financiero
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 text-xs font-semibold">
        <span className="text-slate-500 flex items-center gap-1.5">
          <Filter className="w-4 h-4" /> Filtrar por Acción:
        </span>
        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="p-2 bg-slate-50 border border-slate-200 rounded-xl"
        >
          <option value="">Todas las Acciones</option>
          <option value="LOGIN">LOGIN</option>
          <option value="READ">READ (Consulta de Expediente)</option>
          <option value="CREATE">CREATE (Alta de Registro)</option>
          <option value="UPDATE">UPDATE (Modificación / Adenda)</option>
        </select>
      </div>

      {/* Tabla de Logs */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm">Cargando logs de auditoría...</div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">No hay registros de auditoría.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase bg-slate-50/50">
                  <th className="p-4">Timestamp (ISO-8601)</th>
                  <th className="p-4">Usuario Responsable</th>
                  <th className="p-4">Rol</th>
                  <th className="p-4">Acción</th>
                  <th className="p-4">Entidad Afectada</th>
                  <th className="p-4">IP Origen</th>
                  <th className="p-4">Detalles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition text-[11px]">
                    <td className="p-4 text-slate-500 font-medium whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-4 font-bold text-slate-800">
                      {log.user ? `${log.user.firstName} ${log.user.lastName}` : 'Sistema / Anónimo'}
                    </td>
                    <td className="p-4">
                      <span className="font-sans px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {log.user?.role || 'SYSTEM'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`font-sans px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.action === 'CREATE'
                            ? 'bg-emerald-50 text-emerald-700'
                            : log.action === 'UPDATE'
                            ? 'bg-blue-50 text-blue-700'
                            : log.action === 'LOGIN'
                            ? 'bg-purple-50 text-purple-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 text-slate-700 font-semibold">{log.entityName}</td>
                    <td className="p-4 text-slate-400">{log.ipAddress || '127.0.0.1'}</td>
                    <td className="p-4 text-slate-500 max-w-xs truncate">
                      {JSON.stringify(log.details)}
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
