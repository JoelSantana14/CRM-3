import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Lead } from '../types';
import { formatCurrency } from '../utils/simulatorEngine';
import {
  Inbox,
  Search,
  Filter,
  Users,
  Clock,
  Sparkles,
  Phone,
  MessageSquare,
  ArrowRight,
  ShieldAlert,
  Calendar,
  Layers,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Eye,
  UserCheck,
} from 'lucide-react';

export const CaixaLeadsView: React.FC = () => {
  const {
    caixaLeads,
    currentUser,
    claimLeadFromCaixaLeads,
    sendLeadToCaixaLeads,
    leads,
    setSelectedLeadForModal,
    settings,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('todos');
  const [feedback, setFeedback] = useState<string | null>(null);

  // Stagnant leads that are candidates to be sent to Caixa de Leads
  const candidateLeads = useMemo(() => {
    const today = new Date();
    const limitDays = settings.diasLimiteAtividadeLead || 15;
    return leads.filter((l) => {
      if (l.naCaixaDeLeads || l.status === 'contrato_assinado' || l.status === 'perdido') return false;
      const dateStr = l.dataAtualizacao || l.dataCadastro;
      const leadDate = new Date(dateStr);
      const diffDays = Math.floor((today.getTime() - leadDate.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= limitDays;
    });
  }, [leads, settings.diasLimiteAtividadeLead]);

  const filteredCaixa = useMemo(() => {
    return caixaLeads.filter((l) => {
      const matchSearch =
        !searchTerm ||
        l.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.telefone.includes(searchTerm) ||
        l.cpf.includes(searchTerm) ||
        (l.codigoExterno && l.codigoExterno.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchTag = selectedTag === 'todos' || (l.tags && l.tags.includes(selectedTag));
      return matchSearch && matchTag;
    });
  }, [caixaLeads, searchTerm, selectedTag]);

  const handleClaim = (lead: Lead) => {
    const success = claimLeadFromCaixaLeads(lead.id, currentUser.id);
    if (success) {
      setFeedback(`Lead "${lead.nome}" resgatado com sucesso para a sua carteira!`);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const handleSendToCaixa = (lead: Lead) => {
    if (
      window.confirm(
        `Deseja enviar o lead "${lead.nome}" para a Caixa de Leads compartilhada? Ele ficará disponível para resgate por corretores do plantão.`
      )
    ) {
      sendLeadToCaixaLeads(lead.id, `Envio por inatividade superior a ${settings.diasLimiteAtividadeLead} dias`);
      setFeedback(`Lead "${lead.nome}" movido para a Caixa de Leads.`);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 rounded-xl">
              <Inbox className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Caixa de Leads (Pool de Resgate)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Leads inativos há mais de {settings.diasLimiteAtividadeLead} dias disponíveis para reativação imediata por
            qualquer corretor online no plantão.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-4 py-2 rounded-xl text-center">
            <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300 block">
              Disponíveis p/ Resgate
            </span>
            <span className="text-xl font-extrabold text-emerald-700 dark:text-emerald-400">
              {caixaLeads.length}
            </span>
          </div>
        </div>
      </div>

      {feedback && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs font-semibold rounded-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Main Caixa de Leads Pool */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-3 justify-between items-center bg-slate-50/50 dark:bg-slate-800/40">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar lead por nome, fone, CPF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white"
            />
          </div>

          <div className="text-xs text-slate-500">
            Regra ativa: <span className="font-bold text-slate-700 dark:text-slate-300">{settings.diasLimiteAtividadeLead} dias</span> sem contato = perda de exclusividade
          </div>
        </div>

        {filteredCaixa.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Inbox className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
            <p className="font-semibold text-sm text-slate-700 dark:text-slate-300">A Caixa de Leads está vazia no momento</p>
            <p className="text-xs text-slate-500">
              Todos os clientes estão com atendimento ativo dentro do prazo de {settings.diasLimiteAtividadeLead} dias.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredCaixa.map((lead) => (
              <div
                key={lead.id}
                className="p-4 sm:p-5 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white text-base">
                      {lead.nome}
                    </span>
                    {lead.codigoExterno && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {lead.codigoExterno}
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                      Pool de Resgate
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{lead.telefone}</span>
                    </span>
                    <span>•</span>
                    <span>Renda: <strong className="text-slate-800 dark:text-slate-200">{formatCurrency(lead.rendaFamiliar)}</strong></span>
                    <span>•</span>
                    <span>FGTS: <strong className="text-slate-800 dark:text-slate-200">{formatCurrency(lead.fgts)}</strong></span>
                    <span>•</span>
                    <span>Último Corretor: <span className="italic">{lead.corretorNome}</span></span>
                  </div>

                  {lead.motivoCaixaDeLeads && (
                    <p className="text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-lg inline-block">
                      Motivo: {lead.motivoCaixaDeLeads}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end">
                  <button
                    onClick={() => setSelectedLeadForModal(lead)}
                    className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-xs flex items-center gap-1 transition-colors"
                    title="Ver ficha completa do lead"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Detalhes</span>
                  </button>

                  <button
                    id={`btn-claim-${lead.id}`}
                    onClick={() => handleClaim(lead)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Resgatar Lead para Mim</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section: Candidate Stagnant Leads (Admin/Coordenador management) */}
      {(currentUser.role === 'admin' || currentUser.role === 'coordenador' || currentUser.role === 'gestor') &&
        candidateLeads.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span>Leads Parados / Inativos ({candidateLeads.length})</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Estes clientes estão sem atividade há mais de {settings.diasLimiteAtividadeLead} dias e podem ser
                  enviados para a Caixa de Leads ou redistribuídos.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {candidateLeads.slice(0, 6).map((lead) => (
                <div
                  key={lead.id}
                  className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between gap-2.5 text-xs"
                >
                  <div>
                    <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                      <span>{lead.nome}</span>
                      <span className="text-[10px] text-red-600 dark:text-red-400 font-semibold">
                        Sem contato recente
                      </span>
                    </div>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      Responsável: {lead.corretorNome}
                    </p>
                  </div>

                  <button
                    onClick={() => handleSendToCaixa(lead)}
                    className="w-full py-1.5 px-3 rounded-lg font-semibold text-[11px] bg-amber-600 hover:bg-amber-700 text-white flex items-center justify-center gap-1 transition-colors"
                  >
                    <Inbox className="w-3.5 h-3.5" />
                    <span>Mover p/ Caixa de Leads</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
    </div>
  );
};
