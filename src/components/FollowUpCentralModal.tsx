import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Calendar, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  User, 
  Phone, 
  Search, 
  X, 
  ArrowUpRight, 
  Flame,
  BellRing,
  Smartphone
} from 'lucide-react';
import { FCMNotificationWidget } from './FCMNotificationWidget';

interface FollowUpCentralModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLeadModal: (leadId: string) => void;
}

export const FollowUpCentralModal: React.FC<FollowUpCentralModalProps> = ({ isOpen, onClose, onOpenLeadModal }) => {
  const { currentUser, leads, updateLead, addLeadActivity } = useApp();
  const [filterType, setFilterType] = useState<'todos' | 'vencidos' | 'hoje' | 'futuros'>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [rescheduleLeadId, setRescheduleLeadId] = useState<string | null>(null);
  const [newDate, setNewDate] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [showPushSettings, setShowPushSettings] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const todayStr = new Date().toISOString().split('T')[0];

  // Filter leads that have proximaAcaoData set
  const leadsWithAction = leads.filter(l => {
    if (l.naCaixaDeLeads) return false;
    // If broker, only show their leads; if admin/coordenador/gestor, can see all or filter
    const isOwner = currentUser.role === 'admin' || currentUser.role === 'coordenador' || currentUser.role === 'gestor' || l.corretorId === currentUser.id;
    if (!isOwner) return false;
    return Boolean(l.proximaAcaoData);
  });

  const categorizedLeads = leadsWithAction.map(l => {
    const actionDate = l.proximaAcaoData || '';
    let category: 'vencido' | 'hoje' | 'futuro' = 'futuro';
    if (actionDate < todayStr) {
      category = 'vencido';
    } else if (actionDate === todayStr) {
      category = 'hoje';
    } else {
      category = 'futuro';
    }
    return { ...l, actionCategory: category };
  });

  const filteredLeads = categorizedLeads.filter(l => {
    if (filterType === 'vencidos' && l.actionCategory !== 'vencido') return false;
    if (filterType === 'hoje' && l.actionCategory !== 'hoje') return false;
    if (filterType === 'futuros' && l.actionCategory !== 'futuro') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = l.nome.toLowerCase().includes(q);
      const matchPhone = l.telefone.includes(q);
      const matchBroker = l.corretorNome.toLowerCase().includes(q);
      const matchDesc = (l.proximaAcaoDescricao || '').toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchBroker && !matchDesc) return false;
    }
    return true;
  }).sort((a, b) => (a.proximaAcaoData || '').localeCompare(b.proximaAcaoData || ''));

  const countVencidos = categorizedLeads.filter(l => l.actionCategory === 'vencido').length;
  const countHoje = categorizedLeads.filter(l => l.actionCategory === 'hoje').length;
  const countFuturos = categorizedLeads.filter(l => l.actionCategory === 'futuro').length;

  const handleCompleteAction = (leadId: string, leadName: string) => {
    updateLead(leadId, {
      proximaAcaoData: undefined,
      proximaAcaoDescricao: undefined,
    });
    addLeadActivity(
      leadId,
      'outro',
      currentUser.role === 'corretor' ? 'corretor' : 'corretor',
      `✅ Follow-up concluído e limpo pelo usuário ${currentUser.name}`
    );
  };

  const handleSaveReschedule = (leadId: string) => {
    if (!newDate) {
      alert('Selecione uma nova data para o follow-up.');
      return;
    }
    updateLead(leadId, {
      proximaAcaoData: newDate,
      proximaAcaoDescricao: newDesc || 'Follow-up reagendado',
    });
    addLeadActivity(
      leadId,
      'outro',
      'corretor',
      `📅 Follow-up reagendado para ${newDate}: "${newDesc || 'Contato'}"`
    );
    setRescheduleLeadId(null);
    setNewDate('');
    setNewDesc('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 overflow-hidden my-auto">
        
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 sm:p-3 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-2xl shrink-0">
              <BellRing className="w-5 h-5 sm:w-6 sm:h-6 animate-bounce" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>Central de Follow-Ups e Prazos do Funil</span>
                {countVencidos > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold">
                    {countVencidos} atrasados
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Monitore prazos de retorno, evite leads estagnados e mantenha seu funil de vendas ativo.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPushSettings(!showPushSettings)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs ${
                showPushSettings
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'
              }`}
              title="Configurar Notificações Push FCM"
            >
              <Smartphone className="w-4 h-4" />
              <span className="hidden sm:inline">Push FCM</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Fechar (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {showPushSettings && (
          <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
            <FCMNotificationWidget />
          </div>
        )}

        {/* Filters & Search */}
        <div className="p-4 sm:p-6 pb-2 border-b border-slate-100 dark:border-slate-800 space-y-4 shrink-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => setFilterType('todos')}
              className={`p-3 rounded-2xl border text-center transition-all ${
                filterType === 'todos'
                  ? 'bg-slate-900 text-white border-slate-900 dark:bg-emerald-600 dark:border-emerald-600 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
              }`}
            >
              <div className="text-sm font-black">{leadsWithAction.length}</div>
              <div className="text-[11px] opacity-80">Total Agendados</div>
            </button>

            <button
              onClick={() => setFilterType('vencidos')}
              className={`p-3 rounded-2xl border text-center transition-all ${
                filterType === 'vencidos'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 hover:bg-rose-100'
              }`}
            >
              <div className="text-sm font-black">{countVencidos}</div>
              <div className="text-[11px] font-semibold">Vencidos (Atrasados)</div>
            </button>

            <button
              onClick={() => setFilterType('hoje')}
              className={`p-3 rounded-2xl border text-center transition-all ${
                filterType === 'hoje'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                  : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 hover:bg-amber-100'
              }`}
            >
              <div className="text-sm font-black">{countHoje}</div>
              <div className="text-[11px] font-semibold">Vencem Hoje</div>
            </button>

            <button
              onClick={() => setFilterType('futuros')}
              className={`p-3 rounded-2xl border text-center transition-all ${
                filterType === 'futuros'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
              }`}
            >
              <div className="text-sm font-black">{countFuturos}</div>
              <div className="text-[11px] opacity-80">Próximos Dias</div>
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nome do cliente, telefone, corretor ou descrição..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Lead List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {filteredLeads.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-2xl mx-auto flex items-center justify-center">
                <Calendar className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Nenhum follow-up pendente nesta categoria</h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Utilize o modal de detalhes de cada lead para agendar datas de próxima ação e manter seu funil em dia.
              </p>
            </div>
          ) : (
            filteredLeads.map((lead) => {
              const isRescheduling = rescheduleLeadId === lead.id;
              const isVencido = lead.actionCategory === 'vencido';
              const isHoje = lead.actionCategory === 'hoje';

              return (
                <div
                  key={lead.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${
                    isVencido
                      ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60'
                      : isHoje
                      ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60'
                      : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-sm text-slate-900 dark:text-white">{lead.nome}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {lead.status.toUpperCase()}
                      </span>
                      {isVencido && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-600 text-white animate-pulse">
                          ATRASADO
                        </span>
                      )}
                      {isHoje && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-600 text-white">
                          VENCE HOJE
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{lead.telefone}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>Corretor: <b className="text-slate-700 dark:text-slate-200">{lead.corretorNome}</b></span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className={`w-3.5 h-3.5 ${isVencido ? 'text-rose-600' : isHoje ? 'text-amber-600' : 'text-emerald-600'}`} />
                        <span>Data Alvo: <b className={isVencido ? 'text-rose-700 dark:text-rose-300 font-bold' : 'text-slate-800 dark:text-slate-100'}>{lead.proximaAcaoData}</b></span>
                      </span>
                    </div>

                    {lead.proximaAcaoDescricao && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 bg-white/70 dark:bg-slate-900/40 p-2 rounded-xl border border-slate-200/50 dark:border-slate-800">
                        <b>Ação planejada:</b> {lead.proximaAcaoDescricao}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {isRescheduling ? (
                      <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                        <input
                          type="date"
                          value={newDate}
                          onChange={(e) => setNewDate(e.target.value)}
                          className="px-2 py-1 text-xs border rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white"
                        />
                        <button
                          onClick={() => handleSaveReschedule(lead.id)}
                          className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700"
                        >
                          Salvar
                        </button>
                        <button
                          onClick={() => setRescheduleLeadId(null)}
                          className="text-slate-400 hover:text-slate-600 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setRescheduleLeadId(lead.id);
                            setNewDate(lead.proximaAcaoData || todayStr);
                            setNewDesc(lead.proximaAcaoDescricao || '');
                          }}
                          className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                        >
                          Reagendar
                        </button>

                        <button
                          onClick={() => handleCompleteAction(lead.id, lead.nome)}
                          className="px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-200 transition-colors flex items-center gap-1.5"
                          title="Concluir e limpar follow-up"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Concluir</span>
                        </button>

                        <button
                          onClick={() => {
                            onClose();
                            onOpenLeadModal(lead.id);
                          }}
                          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition-colors"
                          title="Abrir detalhes do lead"
                        >
                          <ArrowUpRight className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 text-xs text-slate-500">
          <span>💡 Dica: Mantenha as datas de follow-up atualizadas para receber alertas automáticos no sininho de notificações.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-semibold transition-colors"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
