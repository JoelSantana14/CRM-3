import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Commission } from '../types';
import { formatCurrency } from '../utils/simulatorEngine';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  CheckCircle2,
  Clock,
  Download,
  Filter,
  Users,
  Building,
  Calendar,
  Printer,
  Plus,
  Search,
  Edit2,
  Trash2,
  Percent,
  X,
  Check,
  ShieldCheck,
  Award,
} from 'lucide-react';

export const CommissionsView: React.FC = () => {
  const {
    commissions,
    addCommission,
    updateCommission,
    deleteCommission,
    updateCommissionStatus,
    currentUser,
    users,
    teams,
    units,
    leads,
    settings,
  } = useApp();

  const [selectedCorretor, setSelectedCorretor] = useState<string>('todos');
  const [selectedStatus, setSelectedStatus] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCommissionId, setEditingCommissionId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    unidadeIdentificacao: '',
    leadNome: '',
    corretorId: currentUser.id,
    valorVenda: 180000,
    percentualCorretor: settings.comissaoPadraoCorretor ?? 2.0,
    percentualGestor: settings.comissaoPadraoGestor ?? 0.5,
    status: 'pendente_analise' as Commission['status'],
    dataVenda: new Date().toISOString().split('T')[0],
  });

  const formatPercent = (val: number) => {
    if (val === undefined || val === null || isNaN(val)) return '0%';
    // Avoid trailing zeros if integer, otherwise show clean decimals
    const str = Number(val).toLocaleString('pt-BR', {
      minimumFractionDigits: val % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 4,
    });
    return `${str}%`;
  };

  const visibleCommissions = useMemo(() => {
    return commissions.filter((c) => {
      if (currentUser.role === 'corretor' && c.corretorId !== currentUser.id) {
        return false;
      }

      const matchesCorretor = selectedCorretor === 'todos' || c.corretorId === selectedCorretor;
      const matchesStatus = selectedStatus === 'todos' || c.status === selectedStatus;
      
      const search = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !search ||
        c.unidadeIdentificacao.toLowerCase().includes(search) ||
        c.leadNome.toLowerCase().includes(search) ||
        c.corretorNome.toLowerCase().includes(search);

      return matchesCorretor && matchesStatus && matchesSearch;
    });
  }, [commissions, currentUser, selectedCorretor, selectedStatus, searchTerm]);

  // Totals
  const totalComissoes = visibleCommissions.reduce((acc, c) => acc + c.valorComissaoCorretor, 0);
  const totalOverGestor = visibleCommissions.reduce((acc, c) => acc + (c.valorComissaoGestor || 0), 0);
  const totalPago = visibleCommissions
    .filter((c) => c.status === 'pago')
    .reduce((acc, c) => acc + c.valorComissaoCorretor, 0);
  const totalPendente = visibleCommissions
    .filter((c) => c.status === 'pendente_analise' || c.status === 'aprovado_cef' || c.status === 'faturado')
    .reduce((acc, c) => acc + c.valorComissaoCorretor, 0);

  const openNewModal = () => {
    setEditingCommissionId(null);
    const defaultBroker = users.find((u) => u.id === currentUser.id) || users[0];
    const brokerRate = defaultBroker?.commissionRate ?? settings.comissaoPadraoCorretor ?? 2.0;

    setFormData({
      unidadeIdentificacao: '',
      leadNome: '',
      corretorId: defaultBroker?.id || '',
      valorVenda: 180000,
      percentualCorretor: brokerRate,
      percentualGestor: settings.comissaoPadraoGestor ?? 0.5,
      status: 'pendente_analise',
      dataVenda: new Date().toISOString().split('T')[0],
    });
    setIsModalOpen(true);
  };

  const openEditModal = (comm: Commission) => {
    setEditingCommissionId(comm.id);
    setFormData({
      unidadeIdentificacao: comm.unidadeIdentificacao,
      leadNome: comm.leadNome,
      corretorId: comm.corretorId,
      valorVenda: comm.valorVenda,
      percentualCorretor: comm.percentualCorretor,
      percentualGestor: comm.percentualGestor,
      status: comm.status,
      dataVenda: comm.dataVenda,
    });
    setIsModalOpen(true);
  };

  const handleSaveCommission = (e: React.FormEvent) => {
    e.preventDefault();
    const broker = users.find((u) => u.id === formData.corretorId);
    const corretorNome = broker ? broker.name : 'Corretor Geral';
    
    // Find team and leader
    let gestorNome = 'Coordenação Geral';
    let gestorId = 'gestor-geral';
    if (broker?.teamId) {
      const team = teams.find((t) => t.id === broker.teamId);
      if (team) {
        gestorNome = team.leaderName;
        gestorId = team.leaderId;
      }
    }

    const valorVenda = Number(formData.valorVenda) || 0;
    const percentualCorretor = Number(formData.percentualCorretor) || 0;
    const percentualGestor = Number(formData.percentualGestor) || 0;

    const valorComissaoCorretor = Math.round(((valorVenda * percentualCorretor) / 100) * 100) / 100;
    const valorComissaoGestor = Math.round(((valorVenda * percentualGestor) / 100) * 100) / 100;

    if (editingCommissionId) {
      updateCommission(editingCommissionId, {
        unidadeIdentificacao: formData.unidadeIdentificacao || 'Unidade Padrão',
        leadNome: formData.leadNome || 'Cliente Não Identificado',
        corretorId: formData.corretorId,
        corretorNome,
        gestorId,
        gestorNome,
        valorVenda,
        percentualCorretor,
        valorComissaoCorretor,
        percentualGestor,
        valorComissaoGestor,
        status: formData.status,
        dataVenda: formData.dataVenda,
      });
    } else {
      addCommission({
        unidadeId: `unit-${Date.now()}`,
        unidadeIdentificacao: formData.unidadeIdentificacao || 'Unidade Padrão',
        leadId: `lead-${Date.now()}`,
        leadNome: formData.leadNome || 'Cliente Não Identificado',
        corretorId: formData.corretorId,
        corretorNome,
        gestorId,
        gestorNome,
        valorVenda,
        percentualCorretor,
        valorComissaoCorretor,
        percentualGestor,
        valorComissaoGestor,
        status: formData.status,
        dataVenda: formData.dataVenda,
      });
    }

    setIsModalOpen(false);
  };

  const getStatusBadge = (status: Commission['status']) => {
    switch (status) {
      case 'pago':
        return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">Pago / Liquidado</span>;
      case 'faturado':
        return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300">Faturado</span>;
      case 'aprovado_cef':
        return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300">Aprovado CEF</span>;
      case 'pendente_analise':
        return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300">Pendente Análise</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">Pendente</span>;
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Percent className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Controle de Comissões & Repasses
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Gestão transparente de honorários de corretagem, over de liderança e premiações com suporte a qualquer taxa percentual (ex: 0,05%, 0,5%, 2%).
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {(currentUser.role === 'admin' || currentUser.role === 'coordenador') && (
            <button
              id="btn-add-commission"
              onClick={openNewModal}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Lançar Comissão</span>
            </button>
          )}

          <button
            id="btn-print-commissions"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir / PDF</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Comissões de Corretores</span>
            <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(totalComissoes)}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{visibleCommissions.length} contratos contabilizados</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Over de Liderança / Gestão</span>
            <Award className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          </div>
          <p className="text-2xl font-bold text-sky-600 dark:text-sky-400">{formatCurrency(totalOverGestor)}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Repasses aos líderes de equipe</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Comissões Pagas</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalPago)}</p>
          <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">Repasses liquidados em conta</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>A Liberar / Em Processamento</span>
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{formatCurrency(totalPendente)}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Aguardando assinatura CEF/Ato</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar unidade, cliente ou corretor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {currentUser.role !== 'corretor' && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Corretor:</span>
              <select
                value={selectedCorretor}
                onChange={(e) => setSelectedCorretor(e.target.value)}
                className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
              >
                <option value="todos">Todos os Corretores</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({formatPercent(u.commissionRate ?? 2)})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
            >
              <option value="todos">Todos os Status</option>
              <option value="pago">Pago</option>
              <option value="faturado">Faturado</option>
              <option value="aprovado_cef">Aprovado CEF</option>
              <option value="pendente_analise">Pendente Análise</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Exibindo <span className="font-bold text-slate-800 dark:text-slate-200">{visibleCommissions.length}</span> lançamentos
        </div>
      </div>

      {/* Table & Mobile Cards */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Mobile View */}
        <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
          {visibleCommissions.map((c) => (
            <div key={c.id} className="p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900 dark:text-white">{c.unidadeIdentificacao}</span>
                {getStatusBadge(c.status)}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-300 flex justify-between">
                <span>Cliente: {c.leadNome}</span>
                <span className="text-slate-400">{c.dataVenda}</span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-500 dark:text-slate-400">Corretor: {c.corretorNome} ({formatPercent(c.percentualCorretor)})</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                  {formatCurrency(c.valorComissaoCorretor)}
                </span>
              </div>
              {c.valorComissaoGestor ? (
                <div className="flex items-center justify-between text-[11px] text-sky-600 dark:text-sky-400">
                  <span>Over Líder ({c.gestorNome}):</span>
                  <span className="font-semibold">{formatCurrency(c.valorComissaoGestor)} ({formatPercent(c.percentualGestor)})</span>
                </div>
              ) : null}

              {(currentUser.role === 'admin' || currentUser.role === 'coordenador') && (
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  {c.status !== 'pago' && (
                    <button
                      onClick={() => updateCommissionStatus(c.id, 'pago')}
                      className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white"
                    >
                      Marcar Pago
                    </button>
                  )}
                  <button
                    onClick={() => openEditModal(c)}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                    title="Editar"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {currentUser.role === 'admin' && (
                    <button
                      onClick={() => {
                        if (window.confirm(`Deseja excluir o lançamento da unidade ${c.unidadeIdentificacao}?`)) {
                          deleteCommission(c.id);
                        }
                      }}
                      className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400"
                      title="Excluir (Exclusivo Administrador)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}

          {visibleCommissions.length === 0 && (
            <div className="p-8 text-center text-slate-400 text-xs">
              Nenhuma comissão encontrada para os filtros selecionados.
            </div>
          )}
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3.5">Data Venda</th>
                <th className="px-4 py-3.5">Unidade / Lote</th>
                <th className="px-4 py-3.5">Cliente</th>
                <th className="px-4 py-3.5">Corretor</th>
                <th className="px-4 py-3.5">Valor Venda</th>
                <th className="px-4 py-3.5">Comissão Corretor</th>
                <th className="px-4 py-3.5">Over Líder</th>
                <th className="px-4 py-3.5">Status</th>
                {(currentUser.role === 'admin' || currentUser.role === 'coordenador') && (
                  <th className="px-4 py-3.5 text-right">Ações</th>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {visibleCommissions.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{c.dataVenda}</td>
                  <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{c.unidadeIdentificacao}</td>
                  <td className="px-4 py-3 font-medium">{c.leadNome}</td>
                  <td className="px-4 py-3 text-slate-800 dark:text-slate-200">
                    <span className="font-semibold">{c.corretorNome}</span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(c.valorVenda)}</td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(c.valorComissaoCorretor)}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                      Taxa: {formatPercent(c.percentualCorretor)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-sky-600 dark:text-sky-400">
                      {formatCurrency(c.valorComissaoGestor || 0)}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                      {c.gestorNome?.split(' ')[0]} ({formatPercent(c.percentualGestor || 0)})
                    </div>
                  </td>
                  <td className="px-4 py-3">{getStatusBadge(c.status)}</td>
                  {(currentUser.role === 'admin' || currentUser.role === 'coordenador') && (
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {c.status !== 'pago' ? (
                          <button
                            onClick={() => updateCommissionStatus(c.id, 'pago')}
                            className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                            title="Marcar como Pago"
                          >
                            Marcar Pago
                          </button>
                        ) : (
                          <span className="text-[11px] text-emerald-600 font-semibold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50">Liquidado</span>
                        )}
                        <button
                          onClick={() => openEditModal(c)}
                          className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Editar Comissão"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {currentUser.role === 'admin' && (
                          <button
                            onClick={() => {
                              if (window.confirm(`Deseja excluir o lançamento da unidade ${c.unidadeIdentificacao}?`)) {
                                deleteCommission(c.id);
                              }
                            }}
                            className="p-1 rounded-md text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                            title="Excluir Lançamento (Exclusivo Administrador)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}

              {visibleCommissions.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                    Nenhuma comissão registrada correspondente aos critérios.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Lançar / Editar Comissão */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Percent className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {editingCommissionId ? 'Editar Lançamento de Comissão' : 'Novo Lançamento de Comissão'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCommission} className="space-y-4 text-xs">
              {/* Unidade e Cliente */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Identificação da Unidade / Lote:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Quadra 12 - Lote 05"
                    value={formData.unidadeIdentificacao}
                    onChange={(e) => setFormData({ ...formData, unidadeIdentificacao: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Nome do Proponente / Cliente:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Carlos Eduardo Silva"
                    value={formData.leadNome}
                    onChange={(e) => setFormData({ ...formData, leadNome: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Corretor e Valor de Venda */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Corretor:</label>
                  <select
                    value={formData.corretorId}
                    onChange={(e) => {
                      const user = users.find((u) => u.id === e.target.value);
                      setFormData({
                        ...formData,
                        corretorId: e.target.value,
                        percentualCorretor: user?.commissionRate ?? formData.percentualCorretor,
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({formatPercent(u.commissionRate ?? 2)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Valor Total da Venda (R$):</label>
                  <input
                    type="number"
                    min="1000"
                    step="500"
                    required
                    value={formData.valorVenda}
                    onChange={(e) => setFormData({ ...formData, valorVenda: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                  />
                </div>
              </div>

              {/* Taxa de Comissão do Corretor (%) */}
              <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-emerald-900 dark:text-emerald-200">
                    Comissão do Corretor (%):
                  </label>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                    {formatCurrency(((formData.valorVenda || 0) * (formData.percentualCorretor || 0)) / 100)}
                  </span>
                </div>
                
                <input
                  type="number"
                  step="any"
                  min="0"
                  max="100"
                  required
                  placeholder="Ex: 0.05, 0.5, 2.0"
                  value={formData.percentualCorretor}
                  onChange={(e) => setFormData({ ...formData, percentualCorretor: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />

                <div className="flex flex-wrap items-center gap-1 pt-1">
                  <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-medium mr-1">Atalhos:</span>
                  {[0.05, 0.1, 0.25, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setFormData({ ...formData, percentualCorretor: rate })}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-colors ${
                        formData.percentualCorretor === rate
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white dark:bg-slate-800 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800'
                      }`}
                    >
                      {rate.toString().replace('.', ',')}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Over da Liderança / Gestor (%) */}
              <div className="p-3.5 bg-sky-50/70 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-sky-900 dark:text-sky-200">
                    Over da Liderança / Gestão (%):
                  </label>
                  <span className="font-bold text-sky-700 dark:text-sky-400 text-sm">
                    {formatCurrency(((formData.valorVenda || 0) * (formData.percentualGestor || 0)) / 100)}
                  </span>
                </div>

                <input
                  type="number"
                  step="any"
                  min="0"
                  max="100"
                  required
                  placeholder="Ex: 0.01, 0.05, 0.5"
                  value={formData.percentualGestor}
                  onChange={(e) => setFormData({ ...formData, percentualGestor: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-xl border border-sky-300 dark:border-sky-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />

                <div className="flex flex-wrap items-center gap-1 pt-1">
                  <span className="text-[10px] text-sky-800 dark:text-sky-300 font-medium mr-1">Atalhos Over:</span>
                  {[0.01, 0.05, 0.1, 0.25, 0.5, 0.75, 1.0].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setFormData({ ...formData, percentualGestor: rate })}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-colors ${
                        formData.percentualGestor === rate
                          ? 'bg-sky-600 text-white'
                          : 'bg-white dark:bg-slate-800 text-sky-800 dark:text-sky-300 hover:bg-sky-100 border border-sky-200 dark:border-sky-800'
                      }`}
                    >
                      {rate.toString().replace('.', ',')}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Status e Data */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Status do Honorário:</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="pendente_analise">Pendente Análise</option>
                    <option value="aprovado_cef">Aprovado CEF</option>
                    <option value="faturado">Faturado</option>
                    <option value="pago">Pago / Liquidado</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Data da Venda:</label>
                  <input
                    type="date"
                    required
                    value={formData.dataVenda}
                    onChange={(e) => setFormData({ ...formData, dataVenda: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingCommissionId ? 'Salvar Alterações' : 'Lançar no Financeiro'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
