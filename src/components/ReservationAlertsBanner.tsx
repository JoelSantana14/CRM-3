import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Unit } from '../types';
import { formatCurrency } from '../utils/simulatorEngine';
import {
  Clock,
  AlertTriangle,
  Flame,
  CheckCircle,
  ExternalLink,
  MessageCircle,
  RefreshCw,
  Unlock,
  ChevronDown,
  ChevronUp,
  Building,
  User,
  Phone,
} from 'lucide-react';

export const ReservationAlertsBanner: React.FC = () => {
  const { units, leads, users, updateUnit, setSelectedLeadForModal, currentUser, setActiveTab } = useApp();
  const [isExpanded, setIsExpanded] = useState(false);
  const [ticker, setTicker] = useState(0);

  // Live second-by-second ticker for accurate countdowns
  useEffect(() => {
    const interval = setInterval(() => {
      setTicker((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Filter all reserved units
  const reservedUnits = units.filter((u) => u.status === 'reservado');

  if (reservedUnits.length === 0) {
    return null;
  }

  // Calculate detailed time left for a unit
  const getReservationTimeInfo = (unit: Unit) => {
    if (!unit.dataExpiracaoReserva) {
      return { expired: false, hours: 72, minutes: 0, seconds: 0, totalHours: 72, label: '72h restantes', severity: 'normal' as const };
    }

    const expTime = new Date(unit.dataExpiracaoReserva).getTime();
    const nowTime = Date.now();
    const diffMs = expTime - nowTime;

    if (diffMs <= 0) {
      return { expired: true, hours: 0, minutes: 0, seconds: 0, totalHours: 0, label: 'Expirado', severity: 'expired' as const };
    }

    const totalSecs = Math.floor(diffMs / 1000);
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;

    let severity: 'critical' | 'warning' | 'normal' = 'normal';
    if (hours < 12) {
      severity = 'critical';
    } else if (hours < 24) {
      severity = 'warning';
    }

    const label = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    return { expired: false, hours, minutes, seconds, totalHours: hours, label, severity };
  };

  const processedUnits = reservedUnits.map((u) => ({
    unit: u,
    timeInfo: getReservationTimeInfo(u),
    lead: leads.find((l) => l.id === u.reservaLeadId),
    corretor: users.find((usr) => usr.id === u.reservadoPorCorretorId || usr.name === u.reservadoPorCorretorNome),
  }));

  // Sort by urgency: expired first, then critical, warning, normal
  processedUnits.sort((a, b) => {
    if (a.timeInfo.expired && !b.timeInfo.expired) return -1;
    if (!a.timeInfo.expired && b.timeInfo.expired) return 1;
    return a.timeInfo.totalHours - b.timeInfo.totalHours;
  });

  const criticalCount = processedUnits.filter((p) => p.timeInfo.severity === 'critical' || p.timeInfo.expired).length;
  const warningCount = processedUnits.filter((p) => p.timeInfo.severity === 'warning').length;

  const handleExtendReservation = (unit: Unit) => {
    const currentExp = unit.dataExpiracaoReserva ? new Date(unit.dataExpiracaoReserva).getTime() : Date.now();
    const newExp = new Date(Math.max(currentExp, Date.now()) + 24 * 60 * 60 * 1000).toISOString();
    updateUnit(unit.id, { dataExpiracaoReserva: newExp });
    alert(`Prazo da unidade ${unit.quadra} ${unit.lote} estendido com sucesso em +24 horas!`);
  };

  const handleReleaseUnit = (unit: Unit) => {
    if (window.confirm(`Tem certeza que deseja cancelar a reserva e liberar a unidade ${unit.quadra} ${unit.lote} de volta para o espelho?`)) {
      updateUnit(unit.id, {
        status: 'disponivel',
        reservaLeadId: undefined,
        reservaLeadNome: undefined,
        dataExpiracaoReserva: undefined,
        reservadoPorCorretorId: undefined,
        reservadoPorCorretorNome: undefined,
        comprovanteAtoAnexado: false,
      });
      alert(`Unidade ${unit.quadra} ${unit.lote} liberada com sucesso.`);
    }
  };

  const handleSendWhatsAppAlert = (unit: Unit, corretorTel?: string, corretorNome?: string, leadNome?: string, timeLeft?: string) => {
    const text = encodeURIComponent(
      `Olá ${corretorNome || 'Corretor'}!\n\n` +
      `⚠️ *Alerta de Reserva (72h) - OTS Master CRM*\n` +
      `Unidade: *${unit.quadra} - ${unit.lote}* (Empreendimento Jardim Vivência)\n` +
      `Cliente: *${leadNome || 'Cliente'}*\n` +
      `Tempo Restante: *${timeLeft || 'Prazo Crítico'}*\n\n` +
      `Por favor, providencie o envio do comprovante do ato e documentos para garantir a unidade antes da liberação automática no espelho de vendas!`
    );

    if (corretorTel) {
      const cleanPhone = corretorTel.replace(/\D/g, '');
      window.open(`https://wa.me/55${cleanPhone}?text=${text}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${text}`, '_blank');
    }
  };

  return (
    <div className={`rounded-3xl border transition-all duration-300 shadow-sm overflow-hidden ${
      criticalCount > 0
        ? 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60'
        : warningCount > 0
        ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60'
        : 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-900/40'
    }`}>
      {/* Header Bar */}
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center gap-3.5">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
            criticalCount > 0
              ? 'bg-rose-500 text-white animate-pulse'
              : warningCount > 0
              ? 'bg-amber-500 text-white'
              : 'bg-emerald-600 text-white'
          }`}>
            <Clock className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Gestão de Reservas Ativas (Janela de 72 Horas)
              </h4>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                criticalCount > 0
                  ? 'bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-100'
                  : 'bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100'
              }`}>
                {reservedUnits.length} {reservedUnits.length === 1 ? 'Lote Reservado' : 'Lotes Reservados'}
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
              {criticalCount > 0 ? (
                <span className="text-rose-700 dark:text-rose-400 font-bold">
                  🚨 {criticalCount} reserva(s) em prazo crítico (&lt; 12h ou vencidas)! Ação imediata recomendada.
                </span>
              ) : warningCount > 0 ? (
                <span className="text-amber-700 dark:text-amber-400 font-semibold">
                  ⚠️ {warningCount} reserva(s) com menos de 24 horas restantes.
                </span>
              ) : (
                <span>Todas as reservas ativas estão dentro do prazo regular de coleta de documentos.</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setActiveTab('espelho_vendas');
            }}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-all shrink-0"
          >
            Ver no Espelho
          </button>

          <button
            type="button"
            className="p-1.5 rounded-xl bg-white/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-all border border-slate-200/60 dark:border-slate-700"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Table & Cards List */}
      {isExpanded && (
        <div className="border-t border-slate-200/60 dark:border-slate-800 p-4 sm:p-5 bg-white/40 dark:bg-slate-900/40 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {processedUnits.map(({ unit, timeInfo, lead, corretor }) => {
              const isUrgent = timeInfo.severity === 'critical' || timeInfo.expired;
              return (
                <div
                  key={unit.id}
                  className={`p-4 rounded-2xl border transition-all duration-200 bg-white dark:bg-slate-900 space-y-3 shadow-2xs ${
                    isUrgent
                      ? 'border-rose-300 dark:border-rose-800 ring-1 ring-rose-400/30'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                          {unit.quadra} • {unit.lote}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {unit.areaTerreno || unit.areaLote || unit.areaConstruida || 250}m²
                        </span>
                      </div>
                      <p className="text-xs font-black text-emerald-700 dark:text-emerald-400 mt-0.5">
                        {formatCurrency(unit.valorFinal)}
                      </p>
                    </div>

                    {/* Timer Badge */}
                    <div className={`px-2.5 py-1 rounded-xl font-mono text-xs font-black flex items-center gap-1.5 ${
                      timeInfo.expired
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        : timeInfo.severity === 'critical'
                        ? 'bg-rose-500 text-white animate-pulse shadow-xs'
                        : timeInfo.severity === 'warning'
                        ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}>
                      <Clock className="w-3.5 h-3.5" />
                      <span>{timeInfo.label}</span>
                    </div>
                  </div>

                  {/* Lead & Corretor Details */}
                  <div className="text-xs space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>Cliente:</span>
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[140px]">
                        {unit.reservaLeadNome || lead?.nome || 'Não informado'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>Corretor:</span>
                      </span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[140px]">
                        {unit.reservadoPorCorretorNome || corretor?.name || 'Corretor'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span>Comprovante:</span>
                      {unit.comprovanteAtoAnexado ? (
                        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
                          ✓ Anexado
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.5 rounded">
                          ⚠ Pendente
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => handleSendWhatsAppAlert(unit, corretor?.phone, corretor?.name, unit.reservaLeadNome, timeInfo.label)}
                      title="Enviar alerta para o WhatsApp do Corretor"
                      className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold flex items-center justify-center gap-1 transition-all"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Zap</span>
                    </button>

                    {(currentUser.role === 'admin' || currentUser.role === 'gestor') && (
                      <button
                        type="button"
                        onClick={() => handleExtendReservation(unit)}
                        title="Prorrogar prazo de reserva por mais 24 horas"
                        className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 text-sky-800 dark:text-sky-300 text-[11px] font-bold flex items-center justify-center gap-1 transition-all"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>+24h</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        if (lead) {
                          setSelectedLeadForModal(lead);
                        } else {
                          handleReleaseUnit(unit);
                        }
                      }}
                      title={lead ? "Abrir Pasta do Lead" : "Liberar Lote"}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold flex items-center justify-center gap-1 transition-all"
                    >
                      {lead ? (
                        <>
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Lead</span>
                        </>
                      ) : (
                        <>
                          <Unlock className="w-3.5 h-3.5 text-rose-500" />
                          <span>Liberar</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
