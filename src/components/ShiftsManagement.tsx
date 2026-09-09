import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ShiftScale, ShiftAttendance, ShiftTurno } from '../types';
import {
  Calendar,
  Clock,
  Dices,
  CheckCircle2,
  AlertCircle,
  XCircle,
  UserCheck,
  Shuffle,
  ArrowRight,
  Plus,
  Flame,
  Users,
  Sparkles,
  Award,
  MessageSquare,
  FileCheck,
  LogOut,
  ChevronRight,
  ShieldAlert,
  X,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const ShiftsManagement: React.FC = () => {
  const {
    scales,
    attendances,
    rouletteHistory,
    addScale,
    updateAttendance,
    spinRoulette,
    advanceRouletteQueue,
    shuffleRouletteQueue,
    markAttendanceAttended,
    markAttendanceMountedFolder,
    markAttendanceExitedRoulette,
    currentUser,
    users,
    logAction,
    settings,
  } = useApp();

  // Escape key support to close any open modal
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setExitModalAttendanceId(null);
        setShowAddScaleModal(false);
        setShowPreDrawModal(false);
        setSpinWinner(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Roulette Spin Modal / Action
  const [leadNomePorta, setLeadNomePorta] = useState('');
  const [leadTelefonePorta, setLeadTelefonePorta] = useState('');
  const [origemRoleta, setOrigemRoleta] = useState<'Porta Plantão' | 'Ligação Externa' | 'Chatbot'>('Porta Plantão');
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinWinner, setSpinWinner] = useState<any>(null);

  // Exit roulette reason modal
  const [exitModalAttendanceId, setExitModalAttendanceId] = useState<string | null>(null);
  const [exitMotivo, setExitMotivo] = useState('');

  // New Scale form
  const [showAddScaleModal, setShowAddScaleModal] = useState(false);
  const [newDate, setNewDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newTurno, setNewTurno] = useState<ShiftTurno>('manha');
  const [selectedCorretores, setSelectedCorretores] = useState<string[]>([]);

  // Pre-draw states
  const [showPreDrawModal, setShowPreDrawModal] = useState(false);
  const [isPreDrawing, setIsPreDrawing] = useState(false);
  const [shuffleTickCount, setShuffleTickCount] = useState(0);

  // Queue of active corretores in plantão
  const activeQueue = attendances
    .filter((a) => a.emFilaRoleta && (a.status === 'presente' || a.status === 'atrasado'))
    .sort((a, b) => a.ordemRoleta - b.ordemRoleta);

  // Pre-draw handler with rolling animation
  const handlePreDrawShuffle = () => {
    setIsPreDrawing(true);
    setShuffleTickCount(0);

    // Simulate shuffling animation ticks
    let ticks = 0;
    const interval = setInterval(() => {
      shuffleRouletteQueue();
      ticks++;
      setShuffleTickCount(ticks);
      if (ticks >= 8) {
        clearInterval(interval);
        setIsPreDrawing(false);
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
        });
      }
    }, 150);
  };

  const handleSpinRoulette = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadNomePorta.trim()) return;

    setIsSpinning(true);
    setSpinWinner(null);

    setTimeout(() => {
      const winner = spinRoulette(leadNomePorta.trim(), leadTelefonePorta.trim() || '(41) 99999-0000', origemRoleta);
      setIsSpinning(false);
      if (winner) {
        setSpinWinner(winner);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
      setLeadNomePorta('');
      setLeadTelefonePorta('');
    }, 1200);
  };

  const handleCreateScale = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCorretores.length === 0) return;

    addScale({
      data: newDate,
      turno: newTurno,
      corretorIds: selectedCorretores,
      status: 'agendado',
      supervisorId: currentUser.id,
      supervisorNome: currentUser.name,
    });

    setShowAddScaleModal(false);
    setSelectedCorretores([]);
  };

  const handleConfirmExit = () => {
    if (exitModalAttendanceId && exitMotivo.trim()) {
      markAttendanceExitedRoulette(exitModalAttendanceId, exitMotivo.trim());
      setExitModalAttendanceId(null);
      setExitMotivo('');
    }
  };

  const sendWhatsAppNotification = (att: ShiftAttendance, position: number) => {
    const userObj = users.find((u) => u.id === att.corretorId);
    const cleanPhone = userObj?.phone?.replace(/\D/g, '') || '41999990000';
    const text = `Olá ${att.corretorNome}! Você está na posição #${position} da Roleta de Atendimento do Jardim Vivência  ${settings?.nomeSubsidioEstadual || "Estadual"} . Fique pronto para o próximo cliente na recepção!`;
    window.open(`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Plantão de Vendas & Roleta da Vez</h1>
            <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-100 text-emerald-900">
              Ao Vivo v1.10
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-0.5">
            Gestão de escalas, marcações de 'Atendeu', 'Montou pasta', 'Saiu da roleta' e avisos diretos no WhatsApp.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {(currentUser.role === 'admin' || currentUser.role === 'gestor') && (
            <button
              id="btn-add-scale-modal"
              onClick={() => setShowAddScaleModal(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Escala de Plantão</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Roleta ao Vivo (Left) & Frequência / Escalas (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Roleta da Vez: Live Standby Queue & Lead Dispatch */}
        <div className="lg:col-span-7 space-y-6">
          {/* Dispatch Lead Form & Wheel Box */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <Dices className="w-48 h-48 text-emerald-400" />
            </div>

            <div className="relative z-10 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                    <Dices className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Roleta de Atendimento (Cliente Chegou)</h2>
                    <p className="text-xs text-slate-400">Distribuição transparente de leads da porta, ligações e chat</p>
                  </div>
                </div>
                <button
                  id="btn-shuffle-queue"
                  onClick={shuffleRouletteQueue}
                  className="flex items-center gap-1 text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1.5 rounded-lg border border-slate-700 transition-colors"
                  title="Sorteio da ordem inicial de plantão"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  <span>Sorteio Inicial</span>
                </button>
              </div>

              {/* Form to Dispatch Lead */}
              <form onSubmit={handleSpinRoulette} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-1">
                    <label className="block text-xs font-medium text-slate-300 mb-1">Nome do Visitante / Lead:</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Roberto Alencar"
                      value={leadNomePorta}
                      onChange={(e) => setLeadNomePorta(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="sm:col-span-1">
                    <label className="block text-xs font-medium text-slate-300 mb-1">WhatsApp / Telefone:</label>
                    <input
                      type="text"
                      placeholder="(41) 98888-7777"
                      value={leadTelefonePorta}
                      onChange={(e) => setLeadTelefonePorta(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="sm:col-span-1">
                    <label className="block text-xs font-medium text-slate-300 mb-1">Canal de Chegada:</label>
                    <select
                      value={origemRoleta}
                      onChange={(e) => setOrigemRoleta(e.target.value as any)}
                      className="w-full text-xs px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Porta Plantão">Porta Plantão (Presencial)</option>
                      <option value="Ligação Externa">Ligação Telefônica</option>
                      <option value="Chatbot">Chat / WhatsApp Central</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="text-xs text-slate-400">
                    <span>Próximo da Vez: </span>
                    <span className="font-bold text-emerald-400">
                      {activeQueue.length > 0 ? activeQueue[0].corretorNome : 'Nenhum corretor disponível'}
                    </span>
                  </div>

                  <button
                    id="btn-spin-roulette"
                    type="submit"
                    disabled={isSpinning || activeQueue.length === 0}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 shadow-lg shadow-emerald-900/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all transform active:scale-95"
                  >
                    <Sparkles className={`w-4 h-4 ${isSpinning ? 'animate-spin' : ''}`} />
                    <span>{isSpinning ? 'Girando a Roleta...' : 'Chamar Próximo (Roleta)'}</span>
                  </button>
                </div>
              </form>

              {/* Winner Announcement Banner */}
              {spinWinner && (
                <div className="p-4 bg-emerald-500/15 rounded-2xl border border-emerald-500/30 flex items-center justify-between animate-in fade-in zoom-in-95">
                  <div className="flex items-center gap-3">
                    <img
                      src={spinWinner.avatar}
                      alt={spinWinner.name}
                      className="w-10 h-10 rounded-xl object-cover ring-2 ring-emerald-400"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                        Atendimento Sorteado!
                      </span>
                      <h4 className="text-sm font-bold text-white">{spinWinner.name}</h4>
                      <p className="text-xs text-slate-300">Assume o lead agora na recepção do plantão.</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-500 text-slate-950">
                      Na Maquete
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Standby Queue List with v1.10.0 Actions */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Fila de Atendimento do Plantão (Hoje)</h3>
                <p className="text-xs text-slate-500">Ordem dinâmica com marcações de Atendeu, Pasta e Saída</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  id="btn-open-predraw-modal"
                  onClick={() => setShowPreDrawModal(true)}
                  className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 shadow-xs transition-all flex items-center gap-1 shrink-0"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  <span>Sorteio Prévio da Ordem</span>
                </button>
                <button
                  onClick={advanceRouletteQueue}
                  className="text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg border border-slate-300 transition-colors shrink-0"
                  title="Passar a vez do primeiro corretor para o final"
                >
                  Passar a Vez
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {activeQueue.map((att, index) => {
                const userObj = users.find((u) => u.id === att.corretorId);
                const isFirst = index === 0;

                return (
                  <div
                    key={att.id}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      isFirst
                        ? 'bg-emerald-50/90 border-emerald-300 shadow-xs ring-2 ring-emerald-500/20'
                        : 'bg-slate-50/80 border-slate-200/80'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            isFirst
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          #{index + 1}
                        </div>

                        <img
                          src={userObj?.avatar}
                          alt={att.corretorNome}
                          className="w-9 h-9 rounded-xl object-cover shrink-0"
                          referrerPolicy="no-referrer"
                        />

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900">{att.corretorNome}</span>
                            {isFirst && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-600 text-white uppercase">
                                Vez Atual
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5 flex flex-wrap gap-2">
                            <span>Check-in: {att.dataHoraCheckin}</span>
                            <span>•</span>
                            <span>Atendimentos: <b>{att.atendimentosHoje}</b></span>
                            {att.ultimasMarcacoes?.atendeu && (
                              <span className="text-emerald-700 font-semibold">
                                • Atendeu às {att.ultimasMarcacoes.horaAtendimento}
                              </span>
                            )}
                            {att.ultimasMarcacoes?.montouPasta && (
                              <span className="text-indigo-700 font-semibold">
                                • Pasta às {att.ultimasMarcacoes.horaPasta}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* WhatsApp Notify Button */}
                      <button
                        onClick={() => sendWhatsAppNotification(att, index + 1)}
                        className="self-start sm:self-auto text-[11px] font-semibold text-emerald-700 bg-emerald-100/80 hover:bg-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1 border border-emerald-300/80 transition-colors"
                        title="Avisar corretor no WhatsApp"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Avisar no WhatsApp</span>
                      </button>
                    </div>

                    {/* v1.10.0 Action Buttons: Atendeu, Montou pasta, Saiu da roleta */}
                    <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex flex-wrap items-center gap-2 text-xs">
                      <button
                        onClick={() => {
                          markAttendanceAttended(att.id);
                          confetti({ particleCount: 40, spread: 50, origin: { y: 0.7 } });
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold rounded-lg flex items-center gap-1 transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Atendeu</span>
                      </button>

                      <button
                        onClick={() => {
                          markAttendanceMountedFolder(att.id);
                          confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-indigo-50 text-indigo-800 border border-indigo-300 font-semibold rounded-lg flex items-center gap-1 transition-colors"
                      >
                        <FileCheck className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Montou Pasta</span>
                      </button>

                      <button
                        onClick={() => {
                          setExitModalAttendanceId(att.id);
                          setExitMotivo('');
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-800 border border-rose-300 font-semibold rounded-lg flex items-center gap-1 transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5 text-rose-600" />
                        <span>Saiu da Roleta</span>
                      </button>
                    </div>
                  </div>
                );
              })}

              {activeQueue.length === 0 && (
                <div className="p-8 text-center text-slate-400 text-xs italic">
                  Nenhum corretor com check-in ativo na fila no momento.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Frequência & Escalas do Mês */}
        <div className="lg:col-span-5 space-y-6">
          {/* Frequência do Plantão Hoje */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>Controle de Presença & Frequência</span>
            </h3>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {attendances.map((att) => (
                <div
                  key={att.id}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-800">{att.corretorNome}</span>
                    <p className="text-[10px] text-slate-400">{att.dataHoraCheckin}</p>
                  </div>

                  <select
                    value={att.status}
                    onChange={(e) => updateAttendance(att.id, e.target.value as any)}
                    className="text-[11px] px-2.5 py-1 rounded-lg border border-slate-300 bg-white font-medium text-slate-700"
                  >
                    <option value="presente">Presente</option>
                    <option value="atrasado">Atrasado</option>
                    <option value="falta_justificada">Justificada</option>
                    <option value="falta">Falta</option>
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Escalas Agendadas */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-600" />
                <span>Escalas do Jardim Vivência</span>
              </h3>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {scales.map((scale) => (
                <div
                  key={scale.id}
                  className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{scale.data}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-200 text-slate-800">
                      Turno: {scale.turno}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-600">
                    <span>Supervisor: <b>{scale.supervisorNome}</b></span>
                  </div>

                  <div className="flex flex-wrap gap-1 pt-1">
                    {scale.corretorIds.map((cId) => {
                      const u = users.find((x) => x.id === cId);
                      return (
                        <span key={cId} className="px-2 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-medium text-slate-700">
                          {u?.name || cId}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Exit Reason Modal */}
      {exitModalAttendanceId && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[92vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900 z-10">
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-base min-w-0">
                <ShieldAlert className="w-5 h-5 shrink-0" />
                <span className="truncate">Saída da Roleta</span>
              </div>
              <button
                type="button"
                onClick={() => setExitModalAttendanceId(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0"
                title="Fechar (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              <p className="text-slate-600 dark:text-slate-400">
                Informe o motivo da saída temporária ou definitiva da roleta. O corretor será reordenado para o fim da fila ou retirado do plantão.
              </p>

              <div className="space-y-2">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Motivo da Saída (Obrigatório):</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Ex: Almoço, atendimento externo, visita a obra, compromisso pessoal..."
                  value={exitMotivo}
                  onChange={(e) => setExitMotivo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 px-5 py-3 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50 dark:bg-slate-900/90 z-10">
              <button
                type="button"
                onClick={() => setExitModalAttendanceId(null)}
                className="px-4 py-2 text-xs rounded-xl font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!exitMotivo.trim()}
                onClick={handleConfirmExit}
                className="px-4 py-2 text-xs rounded-xl font-semibold bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50 transition-colors shadow-xs"
              >
                Confirmar Saída
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Scale Modal */}
      {showAddScaleModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[92vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900 z-10">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Agendar Nova Escala de Plantão</h3>
              <button
                type="button"
                onClick={() => setShowAddScaleModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0"
                title="Fechar (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateScale} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300">Data do Plantão:</label>
                    <input
                      type="date"
                      required
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300">Turno:</label>
                    <select
                      value={newTurno}
                      onChange={(e) => setNewTurno(e.target.value as any)}
                      className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="manha">Manhã (08h às 13h)</option>
                      <option value="tarde">Tarde (13h às 18h)</option>
                      <option value="integral">Integral (08h às 18h)</option>
                      <option value="noite">Noite / Evento</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Corretores Escalados:</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                    {users.map((u) => (
                      <label key={u.id} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-750 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={selectedCorretores.includes(u.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCorretores([...selectedCorretores, u.id]);
                            } else {
                              setSelectedCorretores(selectedCorretores.filter((id) => id !== u.id));
                            }
                          }}
                          className="w-4 h-4 rounded text-emerald-600"
                        />
                        <span className="font-medium text-slate-800 dark:text-slate-200 truncate">{u.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 px-5 py-3 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50 dark:bg-slate-900/90 z-10">
                <button
                  type="button"
                  onClick={() => setShowAddScaleModal(false)}
                  className="px-4 py-2 text-xs rounded-xl font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={selectedCorretores.length === 0}
                  className="px-4 py-2 text-xs rounded-xl font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-xs"
                >
                  Salvar Escala
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pre-Draw / Sorteio Prévio de Ordem Modal */}
      {showPreDrawModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[92vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900 z-10">
              <div className="flex items-center gap-2">
                <Dices className="w-5 h-5 text-emerald-600 animate-bounce" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Sorteio Prévio de Ordem do Dia</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPreDrawModal(false)}
                disabled={isPreDrawing}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 disabled:opacity-30 shrink-0"
                title="Fechar (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              <div className="text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <p>
                  <strong>Como funciona?</strong> Este sorteio embaralha de forma 100% aleatória e transparente a ordem dos corretores que estão ativos (Presente ou Atrasado) no plantão neste momento.
                </p>
                <p>
                  A ordem definida servirá como a <strong>Fila de Vez</strong> inicial do dia.
                </p>
              </div>

              {/* List of Active brokers in queue before/during shuffle */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Fila Atual ({activeQueue.length} corretores ativos):
                </span>
                <div className="space-y-1.5 max-h-48 overflow-y-auto p-2 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700">
                  {activeQueue.map((att, index) => {
                    const userObj = users.find((u) => u.id === att.corretorId);
                    return (
                      <div
                        key={att.id}
                        className={`flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-750 border border-slate-200 dark:border-slate-700 text-xs transition-all ${
                          isPreDrawing ? 'animate-pulse border-emerald-400/50 bg-emerald-50/20' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold flex items-center justify-center text-[10px] shrink-0">
                            #{index + 1}
                          </span>
                          <img
                            src={userObj?.avatar}
                            alt={att.corretorNome}
                            className="w-5 h-5 rounded-md object-cover shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{att.corretorNome}</span>
                        </div>
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded font-medium shrink-0 ml-2">
                          {att.status === 'presente' ? 'Presente' : 'Atrasado'}
                        </span>
                      </div>
                    );
                  })}

                  {activeQueue.length === 0 && (
                    <div className="p-4 text-center text-slate-400 italic text-[11px]">
                      Nenhum corretor ativo no plantão hoje para sortear.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 px-5 py-3 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50 dark:bg-slate-900/90 z-10">
              <button
                type="button"
                onClick={() => setShowPreDrawModal(false)}
                disabled={isPreDrawing}
                className="px-4 py-2 text-xs rounded-xl font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handlePreDrawShuffle}
                disabled={isPreDrawing || activeQueue.length <= 1}
                className="px-5 py-2 text-xs rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 disabled:opacity-40 transition-colors shadow-xs"
              >
                <Shuffle className={`w-3.5 h-3.5 ${isPreDrawing ? 'animate-spin' : ''}`} />
                <span>{isPreDrawing ? 'Embaralhando Fila...' : 'Sortear Nova Ordem'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
