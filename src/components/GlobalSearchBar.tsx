import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  Search,
  X,
  User as UserIcon,
  Building2,
  DollarSign,
  FileText,
  Users,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

interface SearchResultItem {
  id: string;
  category: 'lead' | 'unit' | 'commission' | 'proposal' | 'user';
  categoryLabel: string;
  title: string;
  subtitle?: string;
  badge?: {
    text: string;
    bgClass: string;
    textClass: string;
  };
  extraInfo?: string;
  onClick: () => void;
}

// Utility to normalize string for flexible accent and case-insensitive searching
function normalizeStr(str?: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, ' ');
}

function matchQuery(targetStr: string | undefined, queryTerms: string[]): boolean {
  if (!targetStr) return false;
  const normTarget = normalizeStr(targetStr);
  return queryTerms.every((term) => normTarget.includes(term));
}

export const GlobalSearchBar: React.FC = () => {
  const {
    leads,
    units,
    commissions,
    proposalApprovalRequests,
    users,
    setSelectedLeadForModal,
    setSelectedUnitForSimulator,
    setActiveTab,
  } = useApp();

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen(true);
        if (window.innerWidth < 768) {
          setIsMobileModalOpen(true);
          setTimeout(() => mobileInputRef.current?.focus(), 100);
        } else {
          inputRef.current?.focus();
        }
      } else if (e.key === 'Escape') {
        setIsOpen(false);
        setIsMobileModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Process search results across CRM datasets
  const results = useMemo<SearchResultItem[]>(() => {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const terms = normalizeStr(trimmed).split(' ').filter(Boolean);
    if (terms.length === 0) return [];

    const items: SearchResultItem[] = [];

    // 1. Search Leads & Clients
    const matchedLeads = leads.filter((lead) => {
      const combined = `${lead.nome} ${lead.telefone || ''} ${lead.email || ''} ${lead.cpf || ''} ${lead.codigoExterno || ''} ${lead.unidadeInteresseInfo || ''} ${lead.corretorNome || ''} ${lead.origem || ''} ${lead.status || ''}`;
      return matchQuery(combined, terms);
    });

    matchedLeads.slice(0, 5).forEach((lead) => {
      let stageText = 'Pré-cadastro';
      let bgClass = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';

      switch (lead.status) {
        case 'contrato_assinado':
          stageText = 'Contrato Assinado';
          bgClass = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300';
          break;
        case 'aprovado_cef':
          stageText = 'Aprovado CEF';
          bgClass = 'bg-teal-100 text-teal-800 dark:bg-teal-950/80 dark:text-teal-300';
          break;
        case 'analise_cef':
          stageText = 'Análise CEF';
          bgClass = 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300';
          break;
        case 'visita_realizada':
        case 'visita_agendada':
          stageText = 'Visita';
          bgClass = 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300';
          break;
        case 'contato_feito':
          stageText = 'Em Atendimento';
          bgClass = 'bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300';
          break;
        case 'perdido':
          stageText = 'Arquivado / Perdido';
          bgClass = 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300';
          break;
      }

      items.push({
        id: `lead-${lead.id}`,
        category: 'lead',
        categoryLabel: 'Leads & Clientes',
        title: lead.nome,
        subtitle: `${lead.telefone || 'Sem tel'} ${lead.email ? '• ' + lead.email : ''} • Corretor: ${lead.corretorNome || '—'}`,
        badge: { text: stageText, bgClass: bgClass.split(' ')[0], textClass: bgClass.split(' ')[1] },
        extraInfo: lead.unidadeInteresseInfo ? `Lote: ${lead.unidadeInteresseInfo}` : lead.codigoExterno ? `Cód: ${lead.codigoExterno}` : undefined,
        onClick: () => {
          setSelectedLeadForModal(lead);
          setActiveTab('clientes');
          setIsOpen(false);
          setIsMobileModalOpen(false);
        },
      });
    });

    // 2. Search Units / Sales Records
    const matchedUnits = units.filter((unit) => {
      const quadraLoteAlt = `Q${unit.quadra} L${unit.lote} Quadra ${unit.quadra} Lote ${unit.lote}`;
      const combined = `${unit.identificacao || ''} ${quadraLoteAlt} ${unit.clienteNome || ''} ${unit.reservaLeadNome || ''} ${unit.corretorNome || ''} ${unit.reservadoPorCorretorNome || ''} ${unit.rua || ''} ${unit.status}`;
      return matchQuery(combined, terms);
    });

    matchedUnits.slice(0, 5).forEach((unit) => {
      let statusText = 'Disponível';
      let bgClass = 'bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300';

      switch (unit.status) {
        case 'vendido':
          statusText = 'Vendido';
          bgClass = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300';
          break;
        case 'reservado':
          statusText = 'Reservado';
          bgClass = 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300';
          break;
        case 'analise':
          statusText = 'Em Análise';
          bgClass = 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300';
          break;
        case 'em_processo':
          statusText = 'Pré-Venda';
          bgClass = 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300';
          break;
        case 'bloqueado':
          statusText = 'Bloqueado';
          bgClass = 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300';
          break;
      }

      const titleText = unit.identificacao || `Quadra ${unit.quadra} - Lote ${unit.lote}`;
      const subtitleText = unit.clienteNome
        ? `Cliente: ${unit.clienteNome} • Vendedor: ${unit.corretorNome || '—'}`
        : `Área: ${unit.areaTerreno || unit.areaLote || '—'}m² • R$ ${unit.valorFinal.toLocaleString('pt-BR')}`;

      items.push({
        id: `unit-${unit.id}`,
        category: 'unit',
        categoryLabel: 'Lotes & Espelho de Vendas',
        title: titleText,
        subtitle: subtitleText,
        badge: { text: statusText, bgClass: bgClass.split(' ')[0], textClass: bgClass.split(' ')[1] },
        extraInfo: `R$ ${unit.valorFinal.toLocaleString('pt-BR')}`,
        onClick: () => {
          setSelectedUnitForSimulator(unit);
          setActiveTab('espelho_vendas');
          setIsOpen(false);
          setIsMobileModalOpen(false);
        },
      });
    });

    // 3. Search Commissions
    const matchedCommissions = commissions.filter((comm) => {
      const combined = `${comm.leadNome} ${comm.unidadeIdentificacao} ${comm.corretorNome} ${comm.status}`;
      return matchQuery(combined, terms);
    });

    matchedCommissions.slice(0, 3).forEach((comm) => {
      items.push({
        id: `comm-${comm.id}`,
        category: 'commission',
        categoryLabel: 'Comissões & Fechamentos',
        title: comm.leadNome,
        subtitle: `Unidade: ${comm.unidadeIdentificacao} • Corretor: ${comm.corretorNome}`,
        badge: {
          text: comm.status === 'pago' ? 'Paga' : comm.status === 'faturado' ? 'Faturada' : 'Pendente',
          bgClass: comm.status === 'pago' ? 'bg-emerald-100' : 'bg-amber-100',
          textClass: comm.status === 'pago' ? 'text-emerald-800' : 'text-amber-800',
        },
        extraInfo: `Comissão: R$ ${comm.valorComissaoCorretor.toLocaleString('pt-BR')}`,
        onClick: () => {
          setActiveTab('comissoes');
          setIsOpen(false);
          setIsMobileModalOpen(false);
        },
      });
    });

    // 4. Search Proposals & MESA
    const matchedProposals = proposalApprovalRequests.filter((req) => {
      const combined = `${req.clienteNome} ${req.unidadeIdentificacao} ${req.corretorNome} ${req.status}`;
      return matchQuery(combined, terms);
    });

    matchedProposals.slice(0, 3).forEach((prop) => {
      items.push({
        id: `prop-${prop.id}`,
        category: 'proposal',
        categoryLabel: 'Propostas & MESA',
        title: prop.clienteNome,
        subtitle: `Lote: ${prop.unidadeIdentificacao} • Corretor: ${prop.corretorNome}`,
        badge: {
          text: prop.status === 'aprovado' ? 'Aprovada' : prop.status === 'reprovado' ? 'Reprovada' : 'Em Análise MESA',
          bgClass: prop.status === 'aprovado' ? 'bg-emerald-100' : prop.status === 'reprovado' ? 'bg-rose-100' : 'bg-purple-100',
          textClass: prop.status === 'aprovado' ? 'text-emerald-800' : prop.status === 'reprovado' ? 'text-rose-800' : 'text-purple-800',
        },
        extraInfo: `Proposta: R$ ${prop.valorFinalProposta.toLocaleString('pt-BR')}`,
        onClick: () => {
          setActiveTab('aprovacoes_mesa');
          setIsOpen(false);
          setIsMobileModalOpen(false);
        },
      });
    });

    // 5. Search Users / Team Members
    const matchedUsers = users.filter((u) => {
      const combined = `${u.name} ${u.email} ${u.creci || ''} ${u.role} ${u.phone || ''}`;
      return matchQuery(combined, terms);
    });

    matchedUsers.slice(0, 3).forEach((u) => {
      items.push({
        id: `user-${u.id}`,
        category: 'user',
        categoryLabel: 'Equipe & Corretores',
        title: u.name,
        subtitle: `${u.role.toUpperCase()} • CRECI: ${u.creci || '—'} • ${u.email}`,
        badge: {
          text: u.active ? 'Ativo' : 'Inativo',
          bgClass: u.active ? 'bg-emerald-100' : 'bg-slate-100',
          textClass: u.active ? 'text-emerald-800' : 'text-slate-700',
        },
        onClick: () => {
          setActiveTab('usuarios');
          setIsOpen(false);
          setIsMobileModalOpen(false);
        },
      });
    });

    return items;
  }, [query, leads, units, commissions, proposalApprovalRequests, users, setSelectedLeadForModal, setSelectedUnitForSimulator, setActiveTab]);

  // Handle arrow key navigation in search list
  const handleKeyDownInput = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        results[selectedIndex].onClick();
      }
    }
  };

  const getCategoryIcon = (category: SearchResultItem['category']) => {
    switch (category) {
      case 'lead':
        return <UserIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'unit':
        return <Building2 className="w-4 h-4 text-sky-600 dark:text-sky-400" />;
      case 'commission':
        return <DollarSign className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'proposal':
        return <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case 'user':
        return <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
    }
  };

  return (
    <>
      {/* DESKTOP / TABLET SEARCH INPUT */}
      <div ref={containerRef} className="relative hidden md:block w-52 lg:w-72 xl:w-80 transition-all">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 absolute left-3 text-slate-400 dark:text-slate-500 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
              setSelectedIndex(0);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDownInput}
            placeholder="Buscar cliente, lote, corretor..."
            className="w-full pl-9 pr-16 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-white border border-slate-200/80 dark:border-slate-700/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:bg-white dark:focus:bg-slate-900 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />

          {query ? (
            <button
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="absolute right-2.5 p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              title="Limpar busca"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="absolute right-2.5 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-slate-200/70 dark:bg-slate-700/70 dark:text-slate-400 rounded border border-slate-300/60 dark:border-slate-600 pointer-events-none">
              Ctrl K
            </kbd>
          )}
        </div>

        {/* DROPDOWN RESULTS OVERLAY (Desktop) */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150 max-h-[75vh] flex flex-col">
            {query.trim() === '' ? (
              <div className="p-4 text-xs text-slate-500 dark:text-slate-400 space-y-2">
                <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Busca Global no CRM</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Digite o nome do cliente, telefone, CPF, quadra e lote (ex: <i>Q04 L18</i>), ou nome do corretor para localizar registros instantaneamente.
                </p>
                <div className="pt-2 flex flex-wrap gap-1.5">
                  <button
                    onClick={() => { setQuery('Q04'); setIsOpen(true); }}
                    className="px-2 py-1 text-[10px] font-medium rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    Ex: Quadra 04
                  </button>
                  <button
                    onClick={() => { setQuery('Análise'); setIsOpen(true); }}
                    className="px-2 py-1 text-[10px] font-medium rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    Ex: Análise CEF
                  </button>
                </div>
              </div>
            ) : results.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                <p className="font-semibold text-slate-700 dark:text-slate-300">Nenhum resultado encontrado</p>
                <p className="mt-1 text-[11px]">Nenhum cliente, lote ou registro coincide com "<strong>{query}</strong>".</p>
              </div>
            ) : (
              <div className="overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
                {results.map((item, idx) => {
                  const isSelected = idx === selectedIndex;
                  return (
                    <button
                      key={item.id}
                      onClick={item.onClick}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full text-left p-3 flex items-start gap-3 transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-l-2 border-emerald-500'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0 mt-0.5">
                        {getCategoryIcon(item.category)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                            {item.categoryLabel}
                          </span>
                          {item.badge && (
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${item.badge.bgClass} ${item.badge.textClass}`}>
                              {item.badge.text}
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate mt-0.5">
                          {item.title}
                        </h4>
                        {item.subtitle && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {item.subtitle}
                          </p>
                        )}
                        {item.extraInfo && (
                          <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                            {item.extraInfo}
                          </p>
                        )}
                      </div>
                      <ChevronRight className={`w-4 h-4 shrink-0 self-center text-slate-400 transition-transform ${isSelected ? 'translate-x-0.5 text-emerald-600' : ''}`} />
                    </button>
                  );
                })}
              </div>
            )}

            {results.length > 0 && (
              <div className="p-2 bg-slate-50 dark:bg-slate-950 text-[10px] text-slate-400 dark:text-slate-500 flex items-center justify-between border-t border-slate-200 dark:border-slate-800 px-3">
                <span>Use <kbd className="font-sans px-1 bg-slate-200 dark:bg-slate-800 rounded">↑</kbd> <kbd className="font-sans px-1 bg-slate-200 dark:bg-slate-800 rounded">↓</kbd> para navegar e <kbd className="font-sans px-1 bg-slate-200 dark:bg-slate-800 rounded">Enter</kbd> para abrir</span>
                <span>{results.length} resultados</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MOBILE SEARCH TRIGGER BUTTON */}
      <button
        onClick={() => {
          setIsMobileModalOpen(true);
          setTimeout(() => mobileInputRef.current?.focus(), 150);
        }}
        className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 transition-colors"
        title="Buscar no CRM"
      >
        <Search className="w-4 h-4" />
      </button>

      {/* MOBILE FULL-SCREEN SEARCH MODAL OVERLAY */}
      {isMobileModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex flex-col p-3 md:hidden animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85vh] overflow-hidden">
            {/* Header / Input */}
            <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                ref={mobileInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar cliente, lote, corretor..."
                className="w-full py-1 text-sm bg-transparent text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-400"
              />
              <button
                onClick={() => {
                  setIsMobileModalOpen(false);
                  setQuery('');
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Results List */}
            <div className="overflow-y-auto flex-1 divide-y divide-slate-100 dark:divide-slate-800">
              {query.trim() === '' ? (
                <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                  <p className="font-semibold text-slate-700 dark:text-slate-300">Busca Global no CRM</p>
                  <p className="mt-1 text-[11px]">Digite o nome do cliente, telefone, CPF, quadra/lote ou corretor.</p>
                </div>
              ) : results.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                  Nenhum resultado encontrado para "<strong>{query}</strong>".
                </div>
              ) : (
                results.map((item) => (
                  <button
                    key={item.id}
                    onClick={item.onClick}
                    className="w-full text-left p-3 flex items-start gap-3 active:bg-emerald-50 dark:active:bg-emerald-950/40"
                  >
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0 mt-0.5">
                      {getCategoryIcon(item.category)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {item.categoryLabel}
                        </span>
                        {item.badge && (
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${item.badge.bgClass} ${item.badge.textClass}`}>
                            {item.badge.text}
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate mt-0.5">
                        {item.title}
                      </h4>
                      {item.subtitle && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
