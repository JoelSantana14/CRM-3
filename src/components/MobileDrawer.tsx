import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  Table,
  Calculator,
  Kanban,
  Users,
  CalendarDays,
  Dices,
  BarChart3,
  BookOpenCheck,
  CheckSquare,
  ShieldCheck,
  Percent,
  Sparkles,
  ScrollText,
  FileSearch,
  Database,
  HelpCircle,
  Lock,
  X,
  Sun,
  Moon,
  Printer,
  ChevronRight,
  LogOut,
  Building,
  Building2,
  Settings,
  FileText,
  Search,
  Inbox,
  ChevronLeft,
  RefreshCw,
} from 'lucide-react';

interface MobileDrawerProps {
  onOpenPrintModal?: () => void;
}

interface MobileDrawerItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  allowed: boolean;
  badge?: string;
  count?: number;
  highlight?: boolean;
}

interface MobileDrawerSection {
  title: string;
  items: MobileDrawerItem[];
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({ onOpenPrintModal }) => {
  const {
    activeTab,
    setActiveTab,
    isMobileDrawerOpen,
    setIsMobileDrawerOpen,
    currentUser,
    users,
    theme,
    toggleTheme,
    canAccessTable,
    canAccessSimulator,
    canAccessTeams,
    canAccessRouletteReport,
    canAccessAudit,
    canAccessBackup,
    leads,
    caixaLeads,
    tasks,
    attendances,
    settings,
    logout,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileCollapsed, setIsMobileCollapsed] = useState(false);

  const pendingTasksCount = tasks.filter((t) => !t.concluida).length;
  const activeInPlantaoCount = attendances.filter(
    (a) => a.emFilaRoleta && (a.status === 'presente' || a.status === 'atrasado')
  ).length;

  const menuSections: MobileDrawerSection[] = [
    {
      title: 'Principal & CRM',
      items: [
        {
          id: 'boas_vindas',
          label: 'Boas-Vindas & Apresentação',
          icon: Sparkles,
          badge: 'Destaque',
          allowed: true,
        },
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: LayoutDashboard,
          allowed: true,
        },
        {
          id: 'tabela_vendas',
          label: 'Tabela de Vendas',
          icon: Table,
          badge: '877 unid',
          allowed: canAccessTable,
        },
        {
          id: 'espelho_vendas',
          label: 'Espelho de Vendas',
          icon: Building,
          badge: 'Mapa Quadras',
          allowed: true,
        },
        {
          id: 'simulador',
          label: 'Simulador CEF',
          icon: Calculator,
          badge: 'Subsídios',
          allowed: canAccessSimulator,
        },
        {
          id: 'kanban',
          label: 'Funil (Kanban)',
          icon: Kanban,
          count: leads.length,
          allowed: true,
        },
        {
          id: 'clientes',
          label: 'Cadastros de Clientes',
          icon: Users,
          count: leads.length,
          allowed: true,
        },
        {
          id: 'caixa_leads',
          label: 'Caixa de Leads (Resgate)',
          icon: Inbox,
          count: caixaLeads.length,
          badge: 'Pool Livre',
          allowed: true,
        },
        {
          id: 'tags',
          label: 'Cadastro de Tags CRM',
          icon: ScrollText,
          badge: 'Qualificação',
          allowed: true,
        },
      ],
    },
    {
      title: 'Plantão & Vendas',
      items: [
        {
          id: 'plantao',
          label: 'Plantão & Roleta',
          icon: Dices,
          badge: `${activeInPlantaoCount} na fila`,
          allowed: true,
        },
        {
          id: 'distribuidor_leads',
          label: 'Distribuidor de Leads',
          icon: RefreshCw,
          badge: 'Fila/Lote',
          allowed: currentUser.role === 'admin' || currentUser.role === 'gestor' || currentUser.role === 'coordenador',
        },
        {
          id: 'relatorio_roleta',
          label: 'Relatório da Roleta',
          icon: BarChart3,
          badge: 'Admin',
          allowed: canAccessRouletteReport,
        },
        {
          id: 'visitas',
          label: 'Registro de Visitas',
          icon: BookOpenCheck,
          allowed: true,
        },
        {
          id: 'imobiliarias_parceiras',
          label: 'Imobiliárias Parceiras',
          icon: Building2,
          badge: 'Parceiros',
          allowed: true,
        },
        {
          id: 'tarefas',
          label: 'Tarefas & Follow-up',
          icon: CheckSquare,
          count: pendingTasksCount,
          allowed: true,
        },
        {
          id: 'usuarios',
          label: 'Usuários & Corretores',
          icon: Users,
          badge: 'Corretores/Líderes',
          allowed: true,
        },
        {
          id: 'equipes',
          label: 'Equipes & Metas',
          icon: ShieldCheck,
          allowed: canAccessTeams,
        },
        {
          id: 'comissoes',
          label: 'Comissões & Repasses',
          icon: Percent,
          badge: 'Honorários',
          allowed: true,
        },
        {
          id: 'gerador_contrato',
          label: 'Gerar Contrato',
          icon: FileText,
          badge: 'PDF A4',
          allowed: true,
        },
      ],
    },
    {
      title: 'Inteligência & Configurações',
      items: [
        {
          id: 'regras_simulador',
          label: 'Regras do Simulador',
          icon: Calculator,
          badge: 'Fórmulas',
          allowed: true,
        },
        {
          id: 'vivi',
          label: 'Vivi — Assistente IA',
          icon: Sparkles,
          highlight: true,
          badge: 'Gemini',
          allowed: true,
        },
        {
          id: 'regras_plantao',
          label: 'Regras do Plantão',
          icon: ScrollText,
          allowed: true,
        },
        {
          id: 'auditoria',
          label: 'Auditoria & Logs',
          icon: FileSearch,
          allowed: canAccessAudit,
        },
        {
          id: 'backup',
          label: 'Backup & Restauração',
          icon: Database,
          allowed: canAccessBackup,
        },
        {
          id: 'configuracoes',
          label: 'Configurações Gerais',
          icon: Settings,
          allowed: currentUser.role === 'admin' || currentUser.role === 'coordenador',
        },
        {
          id: 'manual',
          label: 'Manual do Usuário',
          icon: HelpCircle,
          allowed: true,
        },
      ],
    },
  ];

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return menuSections;
    const query = searchQuery.toLowerCase().trim();
    return menuSections
      .map((section) => ({
        ...section,
        items: section.items.filter(
          (item) =>
            item.label.toLowerCase().includes(query) ||
            item.badge?.toLowerCase().includes(query) ||
            section.title.toLowerCase().includes(query)
        ),
      }))
      .filter((section) => section.items.length > 0);
  }, [menuSections, searchQuery]);

  if (!isMobileDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden flex">
      {/* Backdrop */}
      <div
        className="mobile-drawer-overlay fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={() => setIsMobileDrawerOpen(false)}
      />

      {/* Drawer Panel */}
      <div className={`relative bg-slate-900 text-white h-full flex flex-col shadow-2xl z-10 transition-all duration-300 ${isMobileCollapsed ? 'w-20' : 'w-4/5 max-w-xs'}`}>
        {/* Drawer Header */}
        <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          {!isMobileCollapsed && (
            <div className="flex items-center gap-2 min-w-0">
              {settings.developerLogoUrl ? (
                <img
                  src={settings.developerLogoUrl}
                  alt="Logo"
                  className="w-7 h-7 rounded-lg object-cover shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-7 h-7 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <Building className="w-4 h-4 text-emerald-400" />
                </div>
              )}
              <div className="min-w-0">
                <span className="font-bold text-xs text-white tracking-tight block truncate">
                  {settings.nomeEmpreendimento || 'Jardim Vivência'}
                </span>
                <p className="text-[10px] text-emerald-400 font-medium">CRM Imobiliário</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMobileCollapsed(!isMobileCollapsed)}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
              title={isMobileCollapsed ? 'Expandir menu' : 'Recolher (Ícones)'}
            >
              {isMobileCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setIsMobileDrawerOpen(false)}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {!isMobileCollapsed && (
          <>
            {/* User Card & Theme Switch in Drawer */}
            <div className="p-3 bg-slate-800/60 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-9 h-9 rounded-xl object-cover ring-2 ring-emerald-500/40 shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">{currentUser.name}</p>
                  <p className="text-[10px] text-slate-400 capitalize truncate">
                    {currentUser.role} • {currentUser.creci || 'CRECI'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsMobileDrawerOpen(false);
                    logout();
                  }}
                  className="p-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors"
                  title="Sair"
                >
                  <LogOut className="w-4 h-4" />
                </button>
                <button
                  id="btn-mobile-toggle-theme"
                  onClick={toggleTheme}
                  className="p-2 rounded-xl bg-slate-700/80 text-amber-300 hover:bg-slate-700 transition-colors"
                  title="Alternar Tema Claro / Escuro"
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-sky-300" />}
                </button>
              </div>
            </div>

            {/* Search in Drawer */}
            <div className="p-3 pb-0">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar menu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-800/80 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Quick Report Print Button */}
            {onOpenPrintModal && (
              <div className="p-3 border-b border-slate-800">
                <button
                  onClick={() => {
                    setIsMobileDrawerOpen(false);
                    onOpenPrintModal();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir / Salvar PDF</span>
                </button>
              </div>
            )}
          </>
        )}

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-3 custom-scrollbar">
          {filteredSections.map((sec) => (
            <div key={sec.title} className="space-y-1">
              {!isMobileCollapsed && (
                <h3 className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>{sec.title}</span>
                  <span className="text-[9px] px-1 rounded bg-slate-800 text-slate-400">{sec.items.length}</span>
                </h3>
              )}
              <div className="space-y-0.5">
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  const isAllowed = item.allowed;

                  return (
                    <button
                      key={item.id}
                      disabled={!isAllowed}
                      title={isMobileCollapsed ? item.label : undefined}
                      onClick={() => {
                        if (isAllowed) {
                          setActiveTab(item.id);
                          setIsMobileDrawerOpen(false);
                        }
                      }}
                      className={`w-full flex items-center ${isMobileCollapsed ? 'justify-center p-3' : 'justify-between px-3 py-2.5'} rounded-xl text-xs transition-all ${
                        isActive
                          ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-950/40 border-l-4 border-emerald-300'
                          : isAllowed
                          ? item.highlight
                            ? 'bg-indigo-950/70 text-indigo-200 border border-indigo-700/50'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                          : 'opacity-40 cursor-not-allowed text-slate-500'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon className="w-5 h-5 shrink-0" />
                        {!isMobileCollapsed && <span className="truncate">{item.label}</span>}
                      </div>

                      {!isMobileCollapsed && (
                        <div className="flex items-center gap-1">
                          {!isAllowed && <Lock className="w-3 h-3 text-amber-500" />}
                          {item.badge && isAllowed && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                              {item.badge}
                            </span>
                          )}
                          {typeof item.count === 'number' && item.count > 0 && isAllowed && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                              {item.count}
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {filteredSections.length === 0 && (
            <div className="p-4 text-center text-xs text-slate-400">
              Nenhum menu encontrado para "{searchQuery}".
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 text-center text-[10px] text-slate-500">
          OTS Master CRM • {settings.nomeEmpreendimento || 'Jardim Vivência'}
        </div>
      </div>
    </div>
  );
};
