import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Lead, FunnelStage } from '../types';
import { formatCurrency } from '../utils/simulatorEngine';
import {
  Filter,
  Plus,
  Phone,
  MessageSquare,
  Building,
  DollarSign,
  User,
  Tag,
  Clock,
  ArrowRight,
  ArrowLeft,
  MoveRight,
  Sparkles,
} from 'lucide-react';

export interface KanbanColumn {
  id: FunnelStage;
  title: string;
  color: string;
}

export const DEFAULT_KANBAN_COLUMNS: KanbanColumn[] = [
  { id: 'pre_cadastro', title: 'Pré-Cadastro', color: 'border-slate-300 bg-slate-50/70' },
  { id: 'contato_feito', title: 'Contato Feito', color: 'border-sky-300 bg-sky-50/50' },
  { id: 'visita_agendada', title: 'Visita Agendada', color: 'border-amber-300 bg-amber-50/50' },
  { id: 'visita_realizada', title: 'Visita no Plantão', color: 'border-orange-300 bg-orange-50/50' },
  { id: 'doc_coletada', title: 'Doc Coletada', color: 'border-blue-300 bg-blue-50/50' },
  { id: 'analise_cef', title: 'Análise CEF', color: 'border-indigo-300 bg-indigo-50/50' },
  { id: 'aprovado_cef', title: 'Aprovado Caixa', color: 'border-teal-300 bg-teal-50/50' },
  { id: 'condicionado_cef', title: 'Condicionado Caixa', color: 'border-yellow-300 bg-yellow-50/50' },
  { id: 'reprovado_cef', title: 'Reprovado Caixa', color: 'border-rose-300 bg-rose-50/50' },
  { id: 'contrato_assinado', title: 'Venda Fechada', color: 'border-emerald-400 bg-emerald-50/70' },
];

const getHeaderColor = (colId: string) => {
  switch (colId) {
    case 'pre_cadastro':
      return 'bg-slate-100/95 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700';
    case 'contato_feito':
      return 'bg-sky-100/95 text-sky-800 border-sky-300 dark:bg-sky-950/60 dark:text-sky-200 dark:border-sky-850';
    case 'visita_agendada':
      return 'bg-amber-100/95 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-850';
    case 'visita_realizada':
      return 'bg-orange-100/95 text-orange-800 border-orange-300 dark:bg-orange-950/60 dark:text-orange-200 dark:border-orange-850';
    case 'doc_coletada':
      return 'bg-blue-100/95 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-200 dark:border-blue-850';
    case 'analise_cef':
      return 'bg-indigo-100/95 text-indigo-800 border-indigo-300 dark:bg-indigo-950/60 dark:text-indigo-200 dark:border-indigo-850';
    case 'aprovado_cef':
      return 'bg-teal-100/95 text-teal-800 border-teal-300 dark:bg-teal-950/60 dark:text-teal-200 dark:border-teal-850';
    case 'condicionado_cef':
      return 'bg-yellow-100/95 text-yellow-900 border-yellow-300 dark:bg-yellow-950/60 dark:text-yellow-200 dark:border-yellow-850';
    case 'reprovado_cef':
      return 'bg-rose-100/95 text-rose-900 border-rose-300 dark:bg-rose-950/60 dark:text-rose-200 dark:border-rose-850';
    case 'contrato_assinado':
      return 'bg-emerald-100/95 text-emerald-900 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-850';
    default:
      return 'bg-slate-100/95 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700';
  }
};

export const KanbanFunnel: React.FC = () => {
  const {
    leads,
    updateLeadStatus,
    currentUser,
    users,
    teams,
    setSelectedLeadForModal,
    addLead,
    settings,
    updateSettings,
  } = useApp();

  const [selectedCorretor, setSelectedCorretor] = useState<string>('todos');
  const [selectedTag, setSelectedTag] = useState<string>('todas');
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [showAddColumnModal, setShowAddColumnModal] = useState(false);

  // New Column state (Admin only)
  const [newColTitle, setNewColTitle] = useState('');
  const [newColColor, setNewColColor] = useState('border-violet-300 bg-violet-50/50');

  const columns: KanbanColumn[] = useMemo(() => {
    if (settings.kanbanColumns && settings.kanbanColumns.length > 0) {
      return settings.kanbanColumns;
    }
    return DEFAULT_KANBAN_COLUMNS;
  }, [settings.kanbanColumns]);

  // New Lead state
  const [newNome, setNewNome] = useState('');
  const [newTelefone, setNewTelefone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newObservacoes, setNewObservacoes] = useState('');
  const [newRenda, setNewRenda] = useState(3500);
  const [newFgts, setNewFgts] = useState(15000);
  const [newOrigem, setNewOrigem] = useState<Lead['origem']>('Plantão Presencial');
  const [newCorretorId, setNewCorretorId] = useState(currentUser.id);

  // Filter leads based on role & filters
  const visibleLeads = useMemo(() => {
    return leads.filter((lead) => {
      // Role scope: Corretor sees only their own unless Admin/Gestor
      if (currentUser.role === 'corretor' && lead.corretorId !== currentUser.id) {
        return false;
      }
      if (currentUser.role === 'gestor' && currentUser.teamId && lead.equipeId !== currentUser.teamId && currentUser.id !== lead.corretorId) {
        return false;
      }

      const matchesCorretor = selectedCorretor === 'todos' || lead.corretorId === selectedCorretor;
      const matchesTag = selectedTag === 'todas' || lead.tags.includes(selectedTag);

      return matchesCorretor && matchesTag;
    });
  }, [leads, currentUser, selectedCorretor, selectedTag]);

  // All unique tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    leads.forEach((l) => l.tags.forEach((t) => set.add(t)));
    return Array.from(set);
  }, [leads]);

  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNome.trim() || !newTelefone.trim()) return;

    const corretorObj = users.find((u) => u.id === newCorretorId) || currentUser;
    addLead({
      nome: newNome.trim(),
      cpf: '000.000.000-00',
      telefone: newTelefone.trim(),
      email: newEmail.trim() || 'cliente@vivencia.com.br',
      rendaFamiliar: newRenda,
      fgts: newFgts,
      temDependentes: true,
      temImovel: false,
      estadoCivil: 'casado',
      profissao: 'Não informada',
      corretorId: corretorObj.id,
      corretorNome: corretorObj.name,
      equipeId: corretorObj.teamId || 'team-aguia',
      origem: newOrigem,
      tags: ['Novo Lead', settings?.nomeSubsidioEstadual || "Estadual"],
      status: columns[0]?.id || 'pre_cadastro',
      observacoesGerais: newObservacoes.trim(),
    });

    setNewNome('');
    setNewTelefone('');
    setNewEmail('');
    setNewObservacoes('');
    setShowAddLeadModal(false);
  };

  const handleAddColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColTitle.trim()) return;
    const newId = `col_${Date.now()}`;
    const newCols = [...columns, { id: newId, title: newColTitle.trim(), color: newColColor }];
    updateSettings({ kanbanColumns: newCols });
    setNewColTitle('');
    setShowAddColumnModal(false);
  };

  const getNextStage = (current: FunnelStage): FunnelStage | null => {
    const index = columns.findIndex((c) => c.id === current);
    if (index !== -1 && index < columns.length - 1) {
      return columns[index + 1].id;
    }
    return null;
  };

  const getPreviousStage = (current: FunnelStage): FunnelStage | null => {
    const index = columns.findIndex((c) => c.id === current);
    if (index > 0) {
      return columns[index - 1].id;
    }
    return null;
  };

  const openWhatsApp = (e: React.MouseEvent, lead: Lead) => {
    e.stopPropagation();
    const cleanPhone = lead.telefone.replace(/\D/g, '');
    const url = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(
      `Olá ${lead.nome}! Aqui é o corretor ${currentUser.name} do Jardim Vivência.`
    )}`;
    window.open(url, '_blank');
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Funil de Vendas (Kanban)</h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Acompanhe a jornada do cliente do pré-cadastro à assinatura Caixa no Jardim Vivência.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Filter Corretor */}
          {currentUser.role !== 'corretor' && (
            <select
              value={selectedCorretor}
              onChange={(e) => setSelectedCorretor(e.target.value)}
              className="text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-700"
            >
              <option value="todos">Todos os Corretores</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          )}

          {/* Filter Tag */}
          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-700"
          >
            <option value="todas">Todas as Tags</option>
            {allTags.map((tag) => (
              <option key={tag} value={tag}>
                #{tag}
              </option>
            ))}
          </select>

          {currentUser.role === 'admin' && (
            <button
              onClick={() => setShowAddColumnModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors shrink-0"
              title="Criar nova etapa no Kanban (Exclusivo Administrador)"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Etapa (Admin)</span>
            </button>
          )}

          <button
            id="btn-add-lead-kanban"
            onClick={() => setShowAddLeadModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Pré-Cadastro</span>
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-6 pt-1">
        {columns.map((column) => {
          const colLeads = visibleLeads.filter((l) => l.status === column.id);
          const colVgv = colLeads.reduce((acc, curr) => acc + (curr.valorSimulacao || 205000), 0);

          return (
            <div
              key={column.id}
              className={`w-72 shrink-0 rounded-2xl border ${column.color} flex flex-col max-h-[75vh] shadow-2xs`}
            >
              {/* Column Header */}
              <div className={`p-3.5 border-b backdrop-blur-xs rounded-t-2xl transition-all ${getHeaderColor(column.id)}`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-xs tracking-tight uppercase">{column.title}</h3>
                  <span className="px-2 py-0.5 rounded-full bg-black/10 dark:bg-white/15 text-inherit text-[10px] font-black flex items-center justify-center">
                    {colLeads.length}
                  </span>
                </div>
                <div className="text-[10px] opacity-80 mt-1 font-semibold">
                  VGV Est.: <span className="font-extrabold">{formatCurrency(colVgv)}</span>
                </div>
              </div>

              {/* Card List & Drop Target */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const leadId = e.dataTransfer.getData('text/plain');
                  if (leadId) {
                    updateLeadStatus(leadId, column.id);
                  }
                }}
                className="p-2.5 space-y-2.5 overflow-y-auto flex-1 min-h-[120px]"
              >
                {colLeads.map((lead) => {
                  const next = getNextStage(lead.status);
                  const prev = getPreviousStage(lead.status);

                  return (
                    <div
                      key={lead.id}
                      id={`kanban-card-${lead.id}`}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', lead.id);
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                      onClick={() => setSelectedLeadForModal(lead)}
                      className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-xs hover:border-emerald-500/60 hover:shadow-md active:opacity-75 transition-all cursor-grab active:cursor-grabbing space-y-2.5 group"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-bold text-xs text-slate-900 group-hover:text-emerald-700 transition-colors">
                            {lead.nome}
                          </h4>
                          <p className="text-[11px] text-slate-500">{lead.telefone}</p>
                        </div>
                        <button
                          onClick={(e) => openWhatsApp(e, lead)}
                          className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white flex items-center justify-center transition-colors"
                          title="Conversar no WhatsApp"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Info Pills */}
                      <div className="flex flex-wrap gap-1 text-[10px]">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                          Renda: {formatCurrency(lead.rendaFamiliar)}
                        </span>
                        {lead.unidadeInteresseInfo && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 font-semibold truncate max-w-[150px]">
                            {lead.unidadeInteresseInfo}
                          </span>
                        )}
                        {lead.statusAnaliseCef === 'pendencia' && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-500 text-white font-bold animate-pulse">
                            ⚠️ Pendência CEF
                          </span>
                        )}
                        {lead.statusAnaliseCef === 'condicionado' && (
                          <span className="px-1.5 py-0.5 rounded bg-purple-600 text-white font-bold">
                            🟣 Condicionado CEF
                          </span>
                        )}
                        {lead.statusAnaliseCef === 'aprovado' && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white font-bold">
                            🟢 Aprovado CEF
                          </span>
                        )}
                      </div>

                      {/* Tags */}
                      {lead.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {lead.tags.slice(0, 2).map((t, i) => (
                            <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-medium">
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Footer & Stage Navigation (Back / Advance) */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                        <span className="truncate max-w-[90px]">{lead.corretorNome}</span>

                        <div className="flex items-center gap-1">
                          {prev && (
                            <button
                              id={`btn-back-lead-${lead.id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                updateLeadStatus(lead.id, prev);
                              }}
                              className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors"
                              title="Voltar para etapa anterior"
                            >
                              <ArrowLeft className="w-2.5 h-2.5" />
                              <span>Voltar</span>
                            </button>
                          )}

                          {next && (
                            <button
                              id={`btn-advance-lead-${lead.id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                updateLeadStatus(lead.id, next);
                              }}
                              className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-800 font-semibold transition-colors"
                              title="Avançar para próxima etapa"
                            >
                              <span>Avançar</span>
                              <ArrowRight className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {colLeads.length === 0 && (
                  <div className="h-24 border border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400 text-xs italic">
                    Sem leads nesta etapa
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Admin Modal: Create New Kanban Column */}
      {showAddColumnModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Criar Nova Etapa (Kanban / Esteira)</h3>
              <button onClick={() => setShowAddColumnModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddColumn} className="space-y-3 text-xs">
              <div>
                <label className="font-medium text-slate-700">Título da Nova Etapa:</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Assinatura Cartório"
                  value={newColTitle}
                  onChange={(e) => setNewColTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-medium text-slate-700">Estilo da Coluna (Cor):</label>
                <select
                  value={newColColor}
                  onChange={(e) => setNewColColor(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="border-violet-300 bg-violet-50/50">Violeta (Destaque)</option>
                  <option value="border-emerald-300 bg-emerald-50/50">Esmeralda (Sucesso)</option>
                  <option value="border-sky-300 bg-sky-50/50">Azul Céu (Atendimento)</option>
                  <option value="border-amber-300 bg-amber-50/50">Amarelo (Atenção)</option>
                  <option value="border-rose-300 bg-rose-50/50">Rosa / Vermelho (Urgente)</option>
                  <option value="border-slate-300 bg-slate-50/70">Cinza Neutro</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddColumnModal(false)}
                  className="px-4 py-2 text-xs rounded-xl font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs rounded-xl font-semibold bg-slate-900 text-white hover:bg-slate-800"
                >
                  Criar Etapa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Add Lead Modal */}
      {showAddLeadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Novo Pré-Cadastro de Cliente</h3>
              <button onClick={() => setShowAddLeadModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="space-y-3 text-xs">
              <div>
                <label className="font-medium text-slate-700">Nome Completo do Cliente:</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Eduardo Silveira"
                  value={newNome}
                  onChange={(e) => setNewNome(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-slate-700">Telefone / WhatsApp *:</label>
                  <input
                    type="text"
                    required
                    placeholder="(41) 99999-8888"
                    value={newTelefone}
                    onChange={(e) => setNewTelefone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-700">E-mail do Cliente:</label>
                  <input
                    type="email"
                    placeholder="cliente@email.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-medium text-slate-700">Observações Iniciais do Cliente:</label>
                <textarea
                  rows={2}
                  placeholder="Anotações sobre preferências, horários de contato, FGTS ou histórico do cliente..."
                  value={newObservacoes}
                  onChange={(e) => setNewObservacoes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-slate-700">Renda Familiar (R$):</label>
                  <input
                    type="number"
                    value={newRenda}
                    onChange={(e) => setNewRenda(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-medium text-slate-700">Saldo FGTS (R$):</label>
                  <input
                    type="number"
                    value={newFgts}
                    onChange={(e) => setNewFgts(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="font-medium text-slate-700">Origem do Lead:</label>
                <select
                  value={newOrigem}
                  onChange={(e) => setNewOrigem(e.target.value as any)}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 bg-white"
                >
                    <option value="Plantão Presencial">Plantão Presencial</option>
                    <option value="Instagram/Facebook">Instagram/Facebook</option>
                    <option value="Google Ads">Google Ads</option>
                    <option value="Indicação">Indicação</option>
                    <option value="Tenda/Panfletagem">Tenda/Panfletagem</option>
                    <option value="WhatsApp Direto">WhatsApp Direto</option>
                  </select>
                </div>

              {currentUser.role !== 'corretor' && (
                <div>
                  <label className="font-medium text-slate-700">Corretor / Corretor Responsável:</label>
                  <select
                    value={newCorretorId}
                    onChange={(e) => setNewCorretorId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddLeadModal(false)}
                  className="px-4 py-2 text-xs rounded-xl font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs rounded-xl font-semibold bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  Salvar Pré-Cadastro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
