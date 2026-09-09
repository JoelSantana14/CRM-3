import React from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  Kanban,
  Users,
  Calculator,
  Dices,
  Menu,
} from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    toggleMobileDrawer,
    leads,
    canAccessSimulator,
  } = useApp();

  const navItems = [
    {
      id: 'dashboard',
      label: 'Início',
      icon: LayoutDashboard,
      allowed: true,
    },
    {
      id: 'kanban',
      label: 'Funil',
      icon: Kanban,
      badge: leads.length,
      allowed: true,
    },
    {
      id: 'clientes',
      label: 'Clientes',
      icon: Users,
      allowed: true,
    },
    {
      id: 'simulador',
      label: 'Simulador',
      icon: Calculator,
      allowed: canAccessSimulator,
    },
    {
      id: 'plantao',
      label: 'Plantão',
      icon: Dices,
      allowed: true,
    },
  ];

  return (
    <div className="mobile-bottom-nav fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 md:hidden px-2 py-1.5 flex items-center justify-around shadow-lg">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;

        return (
          <button
            key={item.id}
            id={`mobile-nav-${item.id}`}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all relative min-w-[56px] ${
              isActive
                ? 'text-emerald-600 dark:text-emerald-400 font-bold scale-105'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <div className="relative">
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              {item.badge && item.badge > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-emerald-500 text-white text-[9px] font-bold px-1 rounded-full min-w-[14px] h-[14px] flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
          </button>
        );
      })}

      {/* Menu Drawer Toggle Button */}
      <button
        id="btn-mobile-open-menu-drawer"
        onClick={toggleMobileDrawer}
        className="flex flex-col items-center justify-center py-1 px-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-all min-w-[56px]"
      >
        <Menu className="w-5 h-5 stroke-2" />
        <span className="text-[10px] mt-0.5 tracking-tight">Mais</span>
      </button>
    </div>
  );
};
