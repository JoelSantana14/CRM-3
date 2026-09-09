import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Lead, FunnelStage } from '../types';
import { formatCurrency } from '../utils/simulatorEngine';
import {
  Search,
  Users,
  Phone,
  MessageSquare,
  DollarSign,
  Plus,
  Download,
  Filter,
  Eye,
  Calendar,
  Layers,
  ChevronRight,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Trash2,
} from 'lucide-react';

export const ClientsList: React.FC = () => {
  const {
    leads,
    currentUser,
    users,
    teams,
    tags,
    setActiveTab,
    setSelectedLeadForModal,
    addLead,
    deleteMultipleLeads,
    checkDuplicate,
    stagnantLeads,
    settings,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStage, setSelectedStage] = useState<string>('todos');
  const [selectedCorretor, setSelectedCorretor] = useState<string>('todos');
  const [selectedTag, setSelectedTag] = useState<string>('todos');
  const [filterParados, setFilterParados] = useState<boolean>(false);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);

  // New Lead Modal State
  const [showNewLeadModal, setShowNewLeadModal] = useState(false);
  const [newNome, setNewNome] = useState('');
  const [newCpf, setNewCpf] = useState('');
  const [newTelefone, setNewTelefone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newObservacoes, setNewObservacoes] = useState('');
  const [newRendaFamiliar, setNewRendaFamiliar] = useState<number>(3500);
  const [newFgts, setNewFgts] = useState<number>(12000);
  const [newOrigem, setNewOrigem] = useState<Lead['origem']>('Plantão Presencial');
  const [newCorretorId, setNewCorretorId] = useState(currentUser.id);
  const [newEstadoCivil, setNewEstadoCivil] = useState<Lead['estadoCivil']>('casado');
  const [newTemDependentes, setNewTemDependentes] = useState(true);
  const [newSelectedTags, setNewSelectedTags] = useState<string[]>([settings?.nomeSubsidioEstadual || 'Estadual']);

  // Real-time duplicate check result
  const duplicateWarning = useMemo(() => {
    if (!newNome && !newTelefone && !newEmail) return null;
    const res = checkDuplicate(newNome, newTelefone, newEmail);
    return res.duplicado ? res : null;
  }, [newNome, newTelefone, newEmail, checkDuplicate]);

  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNome.trim()) return;

    const corretorObj = users.find((u) => u.id === newCorretorId) || currentUser;
    const teamId = corretorObj.teamId || teams[0]?.id || 'team-aguia';

    addLead({
      nome: newNome.trim(),
      cpf: newCpf.trim() || 'Não informado',
      telefone: newTelefone.trim() || '(41) 99999-0000',
      email: newEmail.trim() || `${newNome.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
      rendaFamiliar: Number(newRendaFamiliar) || 3000,
      fgts: Number(newFgts) || 0,
      temDependentes: newTemDependentes,
      temImovel: false,
      estadoCivil: newEstadoCivil,
      profissao: 'Não informada',
      corretorId: corretorObj.id,
      corretorNome: corretorObj.name,
      equipeId: teamId,
      origem: newOrigem,
      tags: newSelectedTags.length > 0 ? newSelectedTags : [settings?.nomeSubsidioEstadual || 'Estadual'],
      status: 'pre_cadastro',
      observacoesGerais: newObservacoes.trim(),
    });

    // Reset Form
    setNewNome('');
    setNewCpf('');
    setNewTelefone('');
    setNewEmail('');
    setNewObservacoes('');
    setNewSelectedTags([settings?.nomeSubsidioEstadual || 'Estadual']);
    setShowNewLeadModal(false);
  };

  const visibleLeads = useMemo(() => {
    return leads.filter((lead) => {
      if (currentUser.role === 'corretor' && lead.corretorId !== currentUser.id) {
        return false;
      }
      if (currentUser.role === 'gestor' && currentUser.teamId && lead.equipeId !== currentUser.teamId && currentUser.id !== lead.corretorId) {
        return false;
      }

      const matchesSearch =
        lead.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.telefone.includes(searchTerm) ||
        lead.cpf.includes(searchTerm) ||
        (lead.codigoExterno && lead.codigoExterno.toLowerCase().includes(searchTerm.toLowerCase())) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStage = selectedStage === 'todos' || lead.status === selectedStage;
      const matchesCorretor = selectedCorretor === 'todos' || lead.corretorId === selectedCorretor;
      const matchesTag = selectedTag === 'todos' || (lead.tags && lead.tags.includes(selectedTag));
      const matchesParados = !filterParados || stagnantLeads.some((sl) => sl.id === lead.id);

      return matchesSearch && matchesStage && matchesCorretor && matchesTag && matchesParados;
    });
  }, [leads, currentUser, searchTerm, selectedStage, selectedCorretor, selectedTag, filterParados, stagnantLeads]);

  const openWhatsApp = (lead: Lead) => {
    const cleanPhone = lead.telefone.replace(/\D/g, '');
    const url = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(
      `Olá ${lead.nome}! Aqui é o corretor ${currentUser.name} do Jardim Vivência. Como estão seus planos para conquistar a casa própria com o ${settings?.nomeSubsidioEstadual || "Estadual"}?`
    )}`;
    window.open(url, '_blank');
  };

  const exportCsv = () => {
    const headers = ['Código', 'Nome', 'CPF', 'Telefone', 'Email', 'Renda Familiar', 'FGTS', 'Status', 'Corretor', 'Origem', 'Data Cadastro'];
    const rows = visibleLeads.map((l) => [
      `"${l.codigoExterno || l.id}"`,
      `"${l.nome}"`,
      l.cpf,
      l.telefone,
      l.email,
      l.rendaFamiliar,
      l.fgts,
      l.status,
      `"${l.corretorNome}"`,
      `"${l.origem}"`,
      l.dataCadastro,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `clientes_jardim_vivencia_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStageBadge = (stage: FunnelStage) => {
    switch (stage) {
      case 'pre_cadastro':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">Pré-Cadastro</span>;
      case 'contato_feito':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800">Contato Realizado</span>;
      case 'visita_agendada':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">Visita Agendada</span>;
      case 'visita_realizada':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">Visita no Plantão</span>;
      case 'doc_coletada':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">Doc Coletada</span>;
      case 'analise_cef':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">Análise Caixa</span>;
      case 'aprovado_cef':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-800">Aprovado CEF</span>;
      case 'condicionado_cef':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">Condicionado CEF</span>;
      case 'reprovado_cef':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">Reprovado CEF</span>;
      case 'contrato_assinado':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300">Venda Fechada</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500">Arquivado</span>;
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Cadastros de Clientes (CRM)</h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Base unificada de pré-cadastros, dados financeiros, FGTS e histórico de atendimento.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setActiveTab('tags')}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            <span>Gerenciar Tags</span>
          </button>

          <button
            id="btn-novo-cliente-modal"
            onClick={() => setShowNewLeadModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Cadastro de Cliente</span>
          </button>

          <button
            id="btn-export-clients-csv"
            onClick={exportCsv}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV</span>
          </button>

          {selectedLeadIds.length > 0 && currentUser.role === 'admin' && (
            <button
              onClick={() => {
                if (window.confirm(`Deseja realmente excluir ${selectedLeadIds.length} clientes selecionados?`)) {
                  deleteMultipleLeads(selectedLeadIds);
                  setSelectedLeadIds([]);
                }
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md transition-all animate-fade-in"
            >
              <Trash2 className="w-4 h-4" />
              <span>Excluir Selecionados ({selectedLeadIds.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por código (JV-...), nome, telefone, CPF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-slate-800"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Stagnant Filter Toggle */}
          <button
            id="btn-filter-stagnant"
            onClick={() => setFilterParados(!filterParados)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
              filterParados
                ? 'bg-rose-50 text-rose-700 border-rose-300 ring-2 ring-rose-400/20'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-rose-500" />
            <span>Parados +7 dias ({stagnantLeads.length})</span>
          </button>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-medium">Etapa:</span>
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700"
            >
              <option value="todos">Todas as Etapas</option>
              <option value="pre_cadastro">Pré-Cadastro</option>
              <option value="contato_feito">Contato Feito</option>
              <option value="visita_agendada">Visita Agendada</option>
              <option value="visita_realizada">Visita no Plantão</option>
              <option value="doc_coletada">Doc Coletada</option>
              <option value="analise_cef">Análise Caixa</option>
              <option value="aprovado_cef">Aprovado CEF</option>
              <option value="condicionado_cef">Condicionado CEF</option>
              <option value="reprovado_cef">Reprovado CEF</option>
              <option value="contrato_assinado">Venda Fechada</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-medium">Tag:</span>
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700"
            >
              <option value="todos">Todas as Tags</option>
              {tags.map((t) => (
                <option key={t.id} value={t.nome}>
                  #{t.nome}
                </option>
              ))}
            </select>
          </div>

          {currentUser.role !== 'corretor' && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500 font-medium">Corretor:</span>
              <select
                value={selectedCorretor}
                onChange={(e) => setSelectedCorretor(e.target.value)}
                className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700"
              >
                <option value="todos">Todos</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                {currentUser.role === 'admin' && (
                  <th className="px-3 py-3.5 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={visibleLeads.length > 0 && selectedLeadIds.length === visibleLeads.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedLeadIds(visibleLeads.map((l) => l.id));
                        } else {
                          setSelectedLeadIds([]);
                        }
                      }}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                  </th>
                )}
                <th className="px-4 py-3.5">Código / Cliente</th>
                <th className="px-4 py-3.5">Contato / WhatsApp</th>
                <th className="px-4 py-3.5">Renda Familiar</th>
                <th className="px-4 py-3.5">FGTS</th>
                <th className="px-4 py-3.5">Etapa Funil</th>
                <th className="px-4 py-3.5">Corretor</th>
                <th className="px-4 py-3.5">Origem</th>
                <th className="px-4 py-3.5 text-right">Ações</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-slate-700">
              {visibleLeads.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-400 text-xs">
                    Nenhum cliente encontrado com os filtros atuais.
                  </td>
                </tr>
              ) : (
                visibleLeads.map((lead) => {
                  const isStagnant = stagnantLeads.some((sl) => sl.id === lead.id);
                  const isChecked = selectedLeadIds.includes(lead.id);
                  return (
                    <tr
                      key={lead.id}
                      id={`row-lead-${lead.id}`}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isChecked ? 'bg-emerald-50/60' : isStagnant ? 'bg-amber-50/40' : ''
                      }`}
                    >
                      {currentUser.role === 'admin' && (
                        <td className="px-3 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedLeadIds((prev) => [...prev, lead.id]);
                              } else {
                                setSelectedLeadIds((prev) => prev.filter((id) => id !== lead.id));
                              }
                            }}
                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                            {lead.codigoExterno || `JV-${lead.id}`}
                          </span>
                          <span className="font-bold text-slate-900">{lead.nome}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                          <span>CPF: {lead.cpf}</span>
                          {isStagnant && (
                            <span className="bg-rose-100 text-rose-700 font-bold px-1.5 py-0.2 rounded text-[9px] flex items-center gap-0.5">
                              <Sparkles className="w-2.5 h-2.5" />
                              Parado +7 dias
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-800">{lead.telefone}</span>
                          <button
                            onClick={() => openWhatsApp(lead)}
                            className="p-1 rounded-md bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-colors"
                            title="Abrir WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="text-[10px] text-slate-400">{lead.email}</div>
                      </td>

                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {formatCurrency(lead.rendaFamiliar)}
                      </td>

                      <td className="px-4 py-3 font-semibold text-blue-700">
                        {formatCurrency(lead.fgts)}
                      </td>

                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          {getStageBadge(lead.status)}
                          {lead.statusAnaliseCef === 'pendencia' && (
                            <span className="inline-block px-1.5 py-0.5 rounded bg-amber-500 text-white font-bold text-[9px] animate-pulse">
                              ⚠️ Pendência CEF
                            </span>
                          )}
                          {lead.statusAnaliseCef === 'condicionado' && (
                            <span className="inline-block px-1.5 py-0.5 rounded bg-purple-600 text-white font-bold text-[9px]">
                              🟣 Condicionado CEF
                            </span>
                          )}
                          {lead.statusAnaliseCef === 'aprovado' && (
                            <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-600 text-white font-bold text-[9px]">
                              🟢 Aprovado CEF
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-800">{lead.corretorNome}</span>
                      </td>

                      <td className="px-4 py-3 text-slate-500 text-[11px]">
                        {lead.origem}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <button
                          id={`btn-open-lead-${lead.id}`}
                          onClick={() => setSelectedLeadForModal(lead)}
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold rounded-lg border border-emerald-200 transition-colors inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Ver Ficha</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Lead Modal with Real-time Duplicate Check */}
      {showNewLeadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Novo Cadastro de Cliente (Corretor)</h3>
                <p className="text-xs text-slate-500">Validação instantânea contra duplicidade na base e regras de Fifty.</p>
              </div>
              <button onClick={() => setShowNewLeadModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            {/* Real-time Duplicate Warning Box */}
            {duplicateWarning && (
              <div className="bg-amber-50 border-2 border-amber-400 p-4 rounded-xl text-xs space-y-2.5 text-amber-950 animate-shake">
                <div className="flex items-start gap-2 font-bold text-amber-900 text-sm">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <span>Aviso de Duplicidade no Plantão / CRM</span>
                </div>
                <p className="text-xs leading-relaxed font-medium">{duplicateWarning.motivo}</p>

                <div className="p-2.5 bg-amber-100/70 rounded-lg space-y-1 text-[11px] text-amber-900">
                  <div className="font-bold flex items-center gap-1.5">
                    <span>📋 Regra de Fifty & Auditoria:</span>
                  </div>
                  <p>
                    • {duplicateWarning.temDireitoFifty
                      ? `Atendimento ativo nos últimos ${duplicateWarning.diasSemAtividade || 0} dias: O corretor anterior tem DIREITO ao Fifty (50% / 50%).`
                      : `Sem contato há ${duplicateWarning.diasSemAtividade || 0} dias (limite: 15d): Corretor anterior PERDE direito a Fifty.`}
                  </p>
                  <p className="text-amber-800 font-medium">
                    • O Coordenador e o Gestor da equipe serão imediatamente notificados no sistema e auditoria assim que o cadastro for confirmado.
                  </p>
                </div>

                <div className="pt-2 border-t border-amber-300 flex items-center justify-end">
                  <a
                    href={`https://wa.me/55${duplicateWarning.leadExistente?.telefone.replace(/\D/g, '')}?text=${encodeURIComponent(
                      `Olá ${duplicateWarning.leadExistente?.corretorNome}, estou no plantão com o cliente ${newNome} e identifiquei seu cadastro prévio no sistema para alinharmos o atendimento.`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white font-semibold rounded-lg flex items-center gap-1.5 text-xs shadow-xs"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Avisar Corretor no WhatsApp</span>
                  </a>
                </div>
              </div>
            )}

            <form onSubmit={handleCreateLead} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Nome Completo do Cliente:</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Amanda Beatriz de Souza"
                  value={newNome}
                  onChange={(e) => setNewNome(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Telefone / WhatsApp *:</label>
                  <input
                    type="text"
                    required
                    placeholder="(41) 99999-8888"
                    value={newTelefone}
                    onChange={(e) => setNewTelefone(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700">E-mail do Cliente:</label>
                  <input
                    type="email"
                    placeholder="exemplo@email.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Observações / Anotações Iniciais:</label>
                <textarea
                  rows={2}
                  placeholder="Informações adicionais sobre o cliente, preferências ou contexto do atendimento..."
                  value={newObservacoes}
                  onChange={(e) => setNewObservacoes(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Renda Familiar Bruta (R$):</label>
                  <input
                    type="number"
                    required
                    value={newRendaFamiliar}
                    onChange={(e) => setNewRendaFamiliar(Number(e.target.value))}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Saldo FGTS (R$):</label>
                  <input
                    type="number"
                    value={newFgts}
                    onChange={(e) => setNewFgts(Number(e.target.value))}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Origem da Captação:</label>
                  <select
                    value={newOrigem}
                    onChange={(e) => setNewOrigem(e.target.value as any)}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="Plantão Presencial">Plantão Presencial</option>
                    <option value="Instagram/Facebook">Instagram / Facebook</option>
                    <option value="Google Ads">Google Ads</option>
                    <option value="Indicação">Indicação</option>
                    <option value="Tenda/Panfletagem">Tenda / Panfletagem</option>
                    <option value="Portal Imobiliário">Portal Imobiliário</option>
                    <option value="WhatsApp Direto">WhatsApp Direto</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Corretor Responsável:</label>
                  <select
                    value={newCorretorId}
                    onChange={(e) => setNewCorretorId(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tags Selector */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Tags & Qualificações do Cliente:
                </label>
                <div className="flex flex-wrap gap-1.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200 max-h-32 overflow-y-auto">
                  {tags.map((t) => {
                    const isSelected = newSelectedTags.includes(t.nome);
                    return (
                      <button
                        type="button"
                        key={t.id}
                        onClick={() => {
                          if (isSelected) {
                            setNewSelectedTags(newSelectedTags.filter((tn) => tn !== t.nome));
                          } else {
                            setNewSelectedTags([...newSelectedTags, t.nome]);
                          }
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                        }`}
                      >
                        #{t.nome} {isSelected ? '✓' : ''}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewLeadModal(false)}
                  className="px-4 py-2 text-xs rounded-xl font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs rounded-xl font-semibold bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  Cadastrar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
