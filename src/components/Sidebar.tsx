import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { isFullAdmin } from '../types';
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
  FileText,
  Database,
  HelpCircle,
  Lock,
  Settings,
  Building,
  Building2,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  ChevronDown,
  UserCheck,
  Inbox,
  Sun,
  Moon,
  MapPin,
  RefreshCw,
} from 'lucide-react';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  allowed: boolean;
  badge?: string;
  count?: number;
  highlight?: boolean;
  lockedMsg?: string;
}

interface SidebarSection {
  title: string;
  items: SidebarItem[];
}

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    currentUser,
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
    theme,
    toggleTheme,
    proposalApprovalRequests = [],
  } = useApp();

  // Collapsed state with persistence
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      localStorage.setItem('sidebar_collapsed', isCollapsed ? 'true' : 'false');
    } catch {}
  }, [isCollapsed]);

  const toggleSection = (sectionTitle: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionTitle]: !prev[sectionTitle],
    }));
  };

  const pendingTasksCount = tasks.filter((t) => !t.concluida).length;
  const activeInPlantaoCount = attendances.filter(
    (a) => a.emFilaRoleta && (a.status === 'presente' || a.status === 'atrasado')
  ).length;
  const pendingApprovalsCount = proposalApprovalRequests.filter((r) => r.status === 'pendente').length;

  const menuSections: SidebarSection[] = [
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
          label: 'Dashboard Gerencial',
          icon: LayoutDashboard,
          allowed: true,
        },
        {
          id: 'tabela_vendas',
          label: 'Tabela de Vendas',
          icon: Table,
          badge: '877 unid',
          allowed: canAccessTable,
          lockedMsg: 'Acesso restrito. Liberação necessária do Administrador.',
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
          lockedMsg: 'Acesso restrito. Liberação necessária do Administrador.',
        },
        {
          id: 'aprovações',
          label: 'Aprovações Diretoria',
          icon: ShieldCheck,
          count: pendingApprovalsCount,
          allowed: true,
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
          lockedMsg: 'Disponível apenas para Administrador, Gestor e Coordenador.',
        },
        {
          id: 'relatorio_roleta',
          label: 'Relatório da Roleta',
          icon: BarChart3,
          badge: 'Admin',
          allowed: canAccessRouletteReport,
          lockedMsg: 'Disponível apenas para Administrador e Coordenador.',
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
          allowed: currentUser.role === 'admin' || currentUser.role === 'gestor' || currentUser.role === 'coordenador',
          lockedMsg: 'Corretores realizam cadastros de Leads. Gestão de usuários restrita a Gestores e Administrador.',
        },
        {
          id: 'equipes',
          label: 'Equipes & Metas',
          icon: ShieldCheck,
          allowed: canAccessTeams,
          lockedMsg: 'Disponível apenas para Gestores e Administrador.',
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
          id: 'mapa_bairros',
          label: 'Mapa de Origem por Bairro',
          icon: MapPin,
          badge: 'Geográfico',
          allowed: isFullAdmin(currentUser.role) || currentUser.role === 'coordenador',
          lockedMsg: 'Disponível para Administradores, Diretores, Supervisores e Coordenadores.',
        },
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
          lockedMsg: 'Disponível apenas para Administrador e Diretoria.',
        },
        {
          id: 'backup',
          label: 'Backup & Restauração',
          icon: Database,
          allowed: canAccessBackup,
          lockedMsg: 'Disponível apenas para Administrador e Diretoria.',
        },
        {
          id: 'configuracoes',
          label: 'Configurações Gerais',
          icon: Settings,
          allowed: isFullAdmin(currentUser.role),
          lockedMsg: 'Todas as configurações são exclusivas do Administrador.',
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

  // Filter sections by search query
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

  return (
    <aside
      className={`hidden md:flex flex-col bg-slate-900 dark:bg-slate-950 text-slate-300 shrink-0 border-r border-slate-800 transition-all duration-300 ease-in-out relative ${
        isCollapsed ? 'w-20' : 'w-64'
      } min-h-[calc(100vh-61px)]`}
    >
      {/* Top Sidebar Header & Toggle */}
      <div className="p-3 border-b border-slate-800/80 flex items-center justify-between gap-2">
        {!isCollapsed && (
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
              <h2 className="text-xs font-bold text-white tracking-wide truncate">
                {settings.nomeEmpreendimento || 'Jardim Vivência'}
              </h2>
              <p className="text-[10px] text-emerald-400 font-medium truncate">
                CRM & Inteligência Imobiliária
              </p>
            </div>
          </div>
        )}

        <button
          id="btn-toggle-sidebar"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors ${
            isCollapsed ? 'mx-auto' : ''
          }`}
          title={isCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Quick Search Bar (Full Mode Only) */}
      {!isCollapsed && (
        <div className="p-3 pb-1">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-800/70 hover:bg-slate-800 focus:bg-slate-800 border border-slate-700/60 focus:border-emerald-500 rounded-xl text-slate-200 placeholder-slate-400 focus:outline-none transition-colors"
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
      )}

      {/* Navigation Links */}
      <div className="p-3 space-y-5 flex-1 overflow-y-auto custom-scrollbar">
        {filteredSections.map((section) => {
          const isSectionCollapsed = collapsedSections[section.title] && !searchQuery;

          return (
            <div key={section.title} className="space-y-1">
              {!isCollapsed ? (
                <button
                  type="button"
                  onClick={() => toggleSection(section.title)}
                  className="w-full px-2.5 py-1 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-200 transition-colors rounded-lg group"
                >
                  <span className="truncate">{section.title}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] px-1 py-0.2 rounded bg-slate-800/60 text-slate-400 font-mono">
                      {section.items.length}
                    </span>
                    <ChevronDown
                      className={`w-3 h-3 text-slate-500 transition-transform ${
                        isSectionCollapsed ? '-rotate-90' : 'rotate-0'
                      }`}
                    />
                  </div>
                </button>
              ) : (
                <div className="h-px bg-slate-800 my-2 mx-1" />
              )}

              {!isSectionCollapsed && (
                <nav className="space-y-0.5">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    const isAllowed = item.allowed;

                    return (
                      <div key={item.id} className="relative group">
                        <button
                          id={`sidebar-tab-${item.id}`}
                          disabled={!isAllowed}
                          onClick={() => {
                            if (isAllowed) {
                              setActiveTab(item.id);
                            }
                          }}
                          title={isCollapsed ? `${item.label} ${item.badge ? `(${item.badge})` : ''}` : !isAllowed ? item.lockedMsg : undefined}
                          className={`w-full flex items-center ${
                            isCollapsed ? 'justify-center px-2' : 'justify-between px-3'
                          } py-2 rounded-xl text-xs font-medium transition-all ${
                            isActive
                              ? 'bg-emerald-600 text-white font-semibold shadow-md shadow-emerald-950/40 border-l-4 border-emerald-300'
                              : isAllowed
                              ? item.highlight
                                ? 'bg-indigo-950/70 text-indigo-300 hover:bg-indigo-900/90 border border-indigo-700/50'
                                : 'text-slate-300 hover:bg-slate-800/90 hover:text-white'
                              : 'opacity-40 cursor-not-allowed text-slate-400'
                          }`}
                        >
                          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2.5'} min-w-0`}>
                            <Icon
                              className={`w-4 h-4 shrink-0 ${
                                isActive
                                  ? 'text-white'
                                  : item.highlight
                                  ? 'text-indigo-400'
                                  : isAllowed
                                  ? 'text-slate-300 group-hover:text-emerald-400'
                                  : 'text-slate-500'
                              }`}
                            />
                            {!isCollapsed && <span className="truncate">{item.label}</span>}
                          </div>

                          {!isCollapsed && (
                            <div className="flex items-center gap-1.5 shrink-0 ml-1">
                              {!isAllowed && <Lock className="w-3 h-3 text-amber-500" />}

                              {item.badge && isAllowed && (
                                <span
                                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                                    isActive
                                      ? 'bg-white/20 text-white'
                                      : item.highlight
                                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                      : 'bg-slate-800 text-slate-300'
                                  }`}
                                >
                                  {item.badge}
                                </span>
                              )}

                              {typeof item.count === 'number' && item.count > 0 && isAllowed && (
                                <span
                                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                    isActive
                                      ? 'bg-white text-emerald-950'
                                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  }`}
                                >
                                  {item.count}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Mini Indicator dot if collapsed with counts */}
                          {isCollapsed && (typeof item.count === 'number' && item.count > 0 || item.badge) && (
                            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
                          )}
                        </button>

                        {/* Floating Tooltip in Collapsed Mode */}
                        {isCollapsed && (
                          <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-slate-800 text-white text-xs rounded-lg shadow-xl border border-slate-700 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                            <span className="font-semibold">{item.label}</span>
                            {item.badge && (
                              <span className="ml-1.5 px-1 py-0.5 text-[10px] bg-emerald-500/20 text-emerald-300 rounded">
                                {item.badge}
                              </span>
                            )}
                            {typeof item.count === 'number' && (
                              <span className="ml-1 px-1 py-0.5 text-[10px] bg-slate-700 text-slate-300 rounded-full">
                                {item.count}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </nav>
              )}
            </div>
          );
        })}

        {filteredSections.length === 0 && (
          <div className="p-4 text-center text-xs text-slate-400">
            Nenhum item correspondente a "{searchQuery}".
          </div>
        )}
      </div>

      {/* User Status & Enterprise Footer */}
      <div className="p-3 bg-slate-950/80 border-t border-slate-800/80 text-xs">
        {!isCollapsed ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 text-emerald-400 font-bold flex items-center justify-center text-xs shrink-0">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-white truncate text-xs">{currentUser.name}</p>
                  <p className="text-[10px] text-slate-400 capitalize truncate">
                    {currentUser.role === 'admin'
                      ? 'Administrador'
                      : currentUser.role === 'coordenador'
                      ? 'Coordenador'
                      : currentUser.role === 'gestor'
                      ? 'Líder de Equipe'
                      : 'Corretor Corretor'}
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase shrink-0">
                {currentUser.role}
              </span>
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-900">
              <span className="truncate max-w-[140px]">{settings.cidadeUf || 'Ponta Grossa - PR'}</span>
              <span className="font-semibold text-emerald-400">v1.10.0</span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-900">
              <span className="text-[10px] text-slate-400">Tema do Sistema</span>
              <button
                id="btn-sidebar-theme-toggle"
                onClick={toggleTheme}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors text-[10px]"
                title="Alternar Tema Claro / Escuro"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    <span>Escuro</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-sky-400" />
                    <span>Claro</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 py-1">
            <div
              className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 text-emerald-400 font-bold flex items-center justify-center text-xs"
              title={`${currentUser.name} (${currentUser.role.toUpperCase()})`}
            >
              {currentUser.name.charAt(0)}
            </div>
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
              title={theme === 'dark' ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-sky-400" />}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
