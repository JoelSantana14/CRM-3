import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ProposalApprovalRequest } from '../types';
import { 
  ShieldCheck, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  FileText, 
  AlertTriangle, 
  MessageSquare,
  User,
  Home,
  Tag,
  DollarSign
} from 'lucide-react';

export const BoardApprovalsView: React.FC = () => {
  const { 
    proposalApprovalRequests = [], 
    updateProposalApprovalRequestStatus, 
    currentUser,
    leads
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'pendente' | 'aprovado' | 'reprovado'>('todos');
  const [selectedRequest, setSelectedRequest] = useState<ProposalApprovalRequest | null>(null);
  const [parecerText, setParecerText] = useState('');

  // Access check: only admins, gestores, or coordenadores can make approval decisions
  const isDecisionMaker = currentUser.role === 'admin' || currentUser.role === 'gestor' || currentUser.role === 'coordenador';

  // Filter requests
  const filteredRequests = proposalApprovalRequests.filter((req) => {
    // If user is a broker, they only see their own requests
    if (currentUser.role === 'corretor' && req.corretorId !== currentUser.id) {
      return false;
    }
    
    // Filter by status
    if (statusFilter !== 'todos' && req.status !== statusFilter) {
      return false;
    }

    // Filter by search query (client name, broker name, or unit identification)
    const query = searchTerm.toLowerCase();
    return (
      req.clienteNome.toLowerCase().includes(query) ||
      req.corretorNome.toLowerCase().includes(query) ||
      req.unidadeIdentificacao.toLowerCase().includes(query)
    );
  });

  const handleDecision = (status: 'aprovado' | 'reprovado') => {
    if (!selectedRequest) return;
    updateProposalApprovalRequestStatus(selectedRequest.id, status, parecerText.trim());
    setParecerText('');
    setSelectedRequest(null);
  };

  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const getStatusBadge = (status: ProposalApprovalRequest['status']) => {
    switch (status) {
      case 'aprovado':
        return (
          <span id={`badge-approved-${status}`} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Aprovado</span>
          </span>
        );
      case 'reprovado':
        return (
          <span id={`badge-rejected-${status}`} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5" />
            <span>Reprovado</span>
          </span>
        );
      default:
        return (
          <span id={`badge-pending-${status}`} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5" />
            <span>Pendente</span>
          </span>
        );
    }
  };

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6" id="board-approvals-container">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Aprovações da Diretoria
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isDecisionMaker 
                  ? 'Analise e autorize solicitações de propostas comerciais enviadas por corretores.'
                  : 'Acompanhe em tempo real o status de aprovação de suas simulações enviadas à diretoria.'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Layout: Main List (Left) & Selection Detail (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Filter & List (Col Span 2) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Controls Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-3xs flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="search-approvals-input"
                type="text"
                placeholder="Buscar por cliente, corretor ou lote..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="flex gap-2">
              {(['todos', 'pendente', 'aprovado', 'reprovado'] as const).map((filter) => (
                <button
                  key={filter}
                  id={`btn-filter-${filter}`}
                  onClick={() => setStatusFilter(filter)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold capitalize transition-all border ${
                    statusFilter === filter
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  {filter === 'todos' ? 'Todos' : filter}
                </button>
              ))}
            </div>
          </div>

          {/* List of Requests */}
          <div className="space-y-3">
            {filteredRequests.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-12 rounded-3xl text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Nenhuma solicitação encontrada</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {statusFilter === 'todos' 
                    ? 'Ainda não existem solicitações de aprovação registradas no sistema.'
                    : `Não encontramos solicitações de aprovação com o status "${statusFilter}".`
                  }
                </p>
              </div>
            ) : (
              filteredRequests.map((req) => {
                const isSelected = selectedRequest?.id === req.id;
                return (
                  <div
                    key={req.id}
                    id={`approval-item-${req.id}`}
                    onClick={() => setSelectedRequest(req)}
                    className={`bg-white dark:bg-slate-900 p-4 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                      isSelected
                        ? 'border-indigo-600 shadow-md ring-1 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-3xs'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {req.unidadeIdentificacao}
                        </span>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                          {req.clienteNome}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        {getStatusBadge(req.status)}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                      <div>
                        <span className="block text-slate-400">Solicitante</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1 mt-0.5">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          {req.corretorNome}
                        </span>
                      </div>
                      <div>
                        <span className="block text-slate-400">Valor Final</span>
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5 block">
                          {formatCurrency(req.valorFinalProposta)}
                        </span>
                      </div>
                      <div>
                        <span className="block text-slate-400">Desconto Solicitado</span>
                        <span className="font-semibold text-rose-600 dark:text-rose-400 mt-0.5 block">
                          {formatCurrency(req.descontoRequisitado)} ({req.descontoPercentual.toFixed(1)}%)
                        </span>
                      </div>
                      <div>
                        <span className="block text-slate-400">Data Solicitação</span>
                        <span className="font-medium text-slate-600 dark:text-slate-300 block mt-0.5">
                          {new Date(req.dataSolicitacao.replace(' ', 'T')).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>
                    </div>

                    {req.justificativa && (
                      <p className="text-[11px] bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850 text-slate-600 dark:text-slate-300 italic leading-relaxed line-clamp-2">
                        &ldquo;{req.justificativa}&rdquo;
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Interactive Actions/Detail Panel (Col Span 1) */}
        <div className="space-y-4">
          {selectedRequest ? (
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md space-y-5" id="approval-details-panel">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Detalhes da Solicitação</h3>
                <span className="text-[10px] text-slate-400 font-mono">#{selectedRequest.id.substring(7, 13)}</span>
              </div>

              {/* Status Banner */}
              <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-150 dark:border-slate-850">
                <div className="p-2 rounded-lg bg-white dark:bg-slate-900 shadow-3xs">
                  <ShieldCheck className="w-5 h-5 text-indigo-500" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Status Atual</span>
                  <div className="mt-0.5">{getStatusBadge(selectedRequest.status)}</div>
                </div>
              </div>

              {/* Simulation metrics breakdown */}
              <div className="space-y-3.5">
                <h4 className="font-bold text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5 uppercase tracking-wide">
                  <DollarSign className="w-4 h-4 text-indigo-500" />
                  <span>Resumo Financeiro</span>
                </h4>

                <div className="grid grid-cols-2 gap-4 bg-slate-50/50 dark:bg-slate-950/40 p-3.5 rounded-xl border border-slate-100 dark:border-slate-850 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase">Preço de Tabela</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                      {formatCurrency(selectedRequest.valorTabela)}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase">Renda Familiar</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                      {formatCurrency(selectedRequest.rendaFamiliar)}
                    </p>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-slate-150 dark:border-slate-800/60" />
                  <div>
                    <span className="text-rose-500 text-[10px] uppercase font-bold">Desconto Solicitado</span>
                    <p className="font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                      {formatCurrency(selectedRequest.descontoRequisitado)}
                    </p>
                  </div>
                  <div>
                    <span className="text-emerald-500 text-[10px] uppercase font-bold">Valor Líquido Proposta</span>
                    <p className="font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {formatCurrency(selectedRequest.valorFinalProposta)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Justification */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5 uppercase tracking-wide">
                  <MessageSquare className="w-4 h-4 text-indigo-500" />
                  <span>Justificativa do Corretor</span>
                </h4>
                <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-100 dark:border-slate-850/80 text-xs text-slate-600 dark:text-slate-300 italic leading-relaxed">
                  &ldquo;{selectedRequest.justificativa || 'Nenhuma justificativa fornecida.'}&rdquo;
                </div>
              </div>

              {/* Response Decision block or History Response info */}
              {selectedRequest.status === 'pendente' ? (
                isDecisionMaker ? (
                  <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Parecer da Diretoria:
                      </label>
                      <textarea
                        id="parecer-textarea"
                        rows={3}
                        placeholder="Insira as observações sobre esta aprovação, descontos adicionais aceitos ou condicionantes..."
                        value={parecerText}
                        onChange={(e) => setParecerText(e.target.value)}
                        className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <button
                        id="btn-reject-approval"
                        onClick={() => handleDecision('reprovado')}
                        className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reprovar</span>
                      </button>
                      <button
                        id="btn-approve-approval"
                        onClick={() => handleDecision('aprovado')}
                        className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Aprovar</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2 p-3.5 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 rounded-xl border border-indigo-100 dark:border-indigo-950/60 text-[11px] leading-relaxed">
                    <AlertTriangle className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                    <p>Esta solicitação está aguardando a análise da diretoria. Você receberá uma notificação no CRM assim que houver um parecer oficial.</p>
                  </div>
                )
              ) : (
                <div className="space-y-3.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="font-bold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                    Parecer e Retorno Oficial
                  </h4>
                  <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-150 dark:border-slate-850 space-y-2 text-xs">
                    <div className="flex justify-between text-[11px] text-slate-400 border-b border-slate-200/50 dark:border-slate-800 pb-1.5">
                      <span>Analisado por:</span>
                      <span className="font-bold text-slate-600 dark:text-slate-300">{selectedRequest.respondidoPorNome || 'Diretor'}</span>
                    </div>
                    {selectedRequest.dataResposta && (
                      <div className="flex justify-between text-[11px] text-slate-400 pb-1.5">
                        <span>Data Parecer:</span>
                        <span className="font-medium text-slate-600 dark:text-slate-300">
                          {new Date(selectedRequest.dataResposta.replace(' ', 'T')).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>
                    )}
                    <div className="pt-1.5">
                      <span className="text-[11px] text-slate-400 block mb-1">Comentários:</span>
                      <p className="text-slate-700 dark:text-slate-300 italic bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 leading-relaxed">
                        {selectedRequest.parecerDiretoria || 'Aprovado sem observações adicionais.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden lg:block bg-slate-50 dark:bg-slate-950 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center text-slate-400 space-y-2">
              <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs">Selecione uma solicitação da lista para analisar os dados financeiros completos e parecer da diretoria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
