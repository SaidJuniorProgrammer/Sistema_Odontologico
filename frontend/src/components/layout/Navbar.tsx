import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User as UserIcon, ShieldAlert, Sparkles, Building2 } from 'lucide-react';
import { Role } from '../../types';

export const Navbar: React.FC = () => {
  const { user, logout, switchDemoUser } = useAuth();

  const roleBadgeColor: Record<Role, string> = {
    ADMIN: 'bg-purple-100 text-purple-700 border-purple-300',
    DENTIST: 'bg-teal-100 text-teal-800 border-teal-300',
    RECEPTIONIST: 'bg-blue-100 text-blue-800 border-blue-300',
    ASSISTANT: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    AUDITOR: 'bg-amber-100 text-amber-800 border-amber-300',
  };

  const roleNames: Record<Role, string> = {
    ADMIN: 'Administrador TI',
    DENTIST: 'Odontólogo',
    RECEPTIONIST: 'Recepción / Caja',
    ASSISTANT: 'Asistente Dental',
    AUDITOR: 'Auditor Financiero',
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
          <Building2 className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-800 tracking-tight">SIGO-Dental</h1>
            <span className="text-[10px] uppercase font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
              v1.0
            </span>
          </div>
          <p className="text-xs text-slate-500">Expediente Clínico & Gestión Odontológica</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Selector rápido de roles para pruebas interactivas */}
        <div className="hidden lg:flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
          <span className="text-slate-500 px-2 font-medium flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Rol Demo:
          </span>
          {(['ADMIN', 'DENTIST', 'RECEPTIONIST', 'AUDITOR'] as Role[]).map((r) => (
            <button
              key={r}
              onClick={() => switchDemoUser(r)}
              className={`px-2 py-1 rounded text-xs font-medium transition ${
                user?.role === r
                  ? 'bg-white shadow-sm text-teal-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {r === 'DENTIST' ? 'Dentista' : r === 'RECEPTIONIST' ? 'Recepción' : r}
            </button>
          ))}
        </div>

        {/* Info de usuario logueado */}
        {user && (
          <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
            <div className="text-right">
              <p className="text-xs font-semibold text-slate-800">
                {user.firstName} {user.lastName}
              </p>
              <div className="flex items-center justify-end gap-1.5 mt-0.5">
                <span
                  className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                    roleBadgeColor[user.role]
                  }`}
                >
                  {roleNames[user.role]}
                </span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 font-bold text-xs">
              {user.firstName[0]}
              {user.lastName[0]}
            </div>
            <button
              onClick={logout}
              title="Cerrar sesión"
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
