import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Smile,
  Receipt,
  Boxes,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();

  const navItems = [
    {
      to: '/',
      label: 'Panel Principal',
      icon: LayoutDashboard,
      roles: ['ADMIN', 'DENTIST', 'RECEPTIONIST', 'ASSISTANT', 'AUDITOR'],
    },
    {
      to: '/patients',
      label: 'Pacientes & Fichas',
      icon: Users,
      roles: ['ADMIN', 'DENTIST', 'RECEPTIONIST', 'ASSISTANT'],
    },
    {
      to: '/appointments',
      label: 'Agenda Médica',
      icon: Calendar,
      roles: ['ADMIN', 'DENTIST', 'RECEPTIONIST', 'ASSISTANT'],
    },
    {
      to: '/odontogram',
      label: 'Odontograma 2D',
      icon: Smile,
      roles: ['ADMIN', 'DENTIST', 'ASSISTANT'],
    },
    {
      to: '/billing',
      label: 'Facturación & Caja',
      icon: Receipt,
      roles: ['ADMIN', 'RECEPTIONIST', 'AUDITOR'],
    },
    {
      to: '/inventory',
      label: 'Insumos & Stock',
      icon: Boxes,
      roles: ['ADMIN', 'DENTIST', 'ASSISTANT', 'AUDITOR'],
    },
    {
      to: '/audit',
      label: 'Auditoría (RNF-06)',
      icon: ShieldCheck,
      roles: ['ADMIN', 'AUDITOR'],
    },
  ];

  const filteredItems = navItems.filter(
    (item) => !user || item.roles.includes(user.role)
  );

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4 space-y-1">
        <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Navegación Clínica
        </div>
        {filteredItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                  isActive
                    ? 'bg-teal-600 text-white font-semibold shadow-md shadow-teal-700/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50">
          <div className="flex items-center gap-2 text-teal-400 text-xs font-semibold">
            <Stethoscope className="w-4 h-4" />
            <span>Sillones Activos</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            3 Sillones operativos con validación de recurso físico (RN-03).
          </p>
        </div>
      </div>
    </aside>
  );
};
