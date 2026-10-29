import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Building2, Lock, Mail, AlertCircle, Sparkles } from 'lucide-react';
import { Role } from '../types';

export const Login: React.FC = () => {
  const { login, switchDemoUser } = useAuth();
  const [email, setEmail] = useState('admin@sigo.com');
  const [password, setPassword] = useState('Admin123!');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoClick = async (role: Role) => {
    setError(null);
    setIsSubmitting(true);
    try {
      await switchDemoUser(role);
    } catch (err: any) {
      setError(err.message || 'Error con usuario de demostración');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 border border-slate-100">
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-tr from-teal-600 to-cyan-500 items-center justify-center text-white shadow-lg shadow-teal-500/30 mb-4">
            <Building2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">SIGO-Dental</h2>
          <p className="text-sm text-slate-500 mt-1">
            Sistema Integral de Gestión Odontológica y Expediente Clínico Digital
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-700 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition"
                placeholder="usuario@sigo.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Contraseña</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl shadow-lg shadow-teal-600/25 transition disabled:opacity-50 text-sm mt-2"
          >
            {isSubmitting ? 'Iniciando sesión...' : 'Ingresar al Sistema'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Acceso Rápido por Rol RACI:
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => handleDemoClick('ADMIN')}
              className="p-2 rounded-lg bg-slate-50 hover:bg-purple-50 hover:text-purple-700 border border-slate-200 text-slate-700 font-medium transition text-left"
            >
              👑 Administrador TI
            </button>
            <button
              onClick={() => handleDemoClick('DENTIST')}
              className="p-2 rounded-lg bg-slate-50 hover:bg-teal-50 hover:text-teal-700 border border-slate-200 text-slate-700 font-medium transition text-left"
            >
              🩺 Dr. Odontólogo
            </button>
            <button
              onClick={() => handleDemoClick('RECEPTIONIST')}
              className="p-2 rounded-lg bg-slate-50 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 text-slate-700 font-medium transition text-left"
            >
              💼 Recepción / POS
            </button>
            <button
              onClick={() => handleDemoClick('AUDITOR')}
              className="p-2 rounded-lg bg-slate-50 hover:bg-amber-50 hover:text-amber-700 border border-slate-200 text-slate-700 font-medium transition text-left"
            >
              📊 Auditor Financiero
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
