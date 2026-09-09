import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/simulatorEngine';
import {
  TrendingUp,
  Building,
  Users,
  DollarSign,
  Award,
  CheckCircle2,
  Clock,
  Dices,
  Sparkles,
  ArrowRight,
  Flame,
  BellRing,
  PieChart as PieChartIcon,
  BarChart3,
  Target,
  Trophy,
  Medal,
  Calendar,
  Percent,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Building2,
  FileCheck,
  Zap,
  Briefcase,
  UserCheck,
  HelpCircle,
} from 'lucide-react';
import { FollowUpCentralModal } from './FollowUpCentralModal';
import { ReservationAlertsBanner } from './ReservationAlertsBanner';
import { TaskAlertBanner } from './TaskAlertBanner';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';
import { FunnelStage } from '../types';

export const DashboardView: React.FC = () => {
  const {
    units,
    leads,
    commissions,
    attendances,
    teams,
    users,
    currentUser,
    setActiveTab,
    settings,
    setSelectedLeadForModal,
  } = useApp();

  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'total' | 'mes' | 'ano'>('total');

  const todayStr = new Date().toISOString().split('T')[0];
  const myPendingFollowUps = leads.filter(l => {
    if (l.naCaixaDeLeads) return false;
    const isOwner = currentUser.role === 'admin' || currentUser.role === 'coordenador' || currentUser.role === 'gestor' || l.corretorId === currentUser.id;
    if (!isOwner) return false;
    return Boolean(l.proximaAcaoData);
  });
  const vencidosCount = myPendingFollowUps.filter(l => (l.proximaAcaoData || '') < todayStr).length;
  const hojeCount = myPendingFollowUps.filter(l => (l.proximaAcaoData || '') === todayStr).length;

  // Metric computations
  const totalUnits = units.length;
  const disponiveis = units.filter((u) => u.status === 'disponivel').length;
  const reservadas = units.filter((u) => u.status === 'reservado').length;
  const emAnalise = units.filter((u) => u.status === 'analise').length;
  const vendidas = units.filter((u) => u.status === 'vendido').length;

  const pctVendida = totalUnits > 0 ? Math.round((vendidas / totalUnits) * 100) : 0;
  const pctReservada = totalUnits > 0 ? Math.round(((reservadas + emAnalise) / totalUnits) * 100) : 0;
  const pctDisponivel = totalUnits > 0 ? Math.round((disponiveis / totalUnits) * 100) : 0;

  const vgvTotalProjetado = useMemo(() => {
    return units.reduce((acc, u) => acc + u.valorFinal, 0);
  }, [units]);

  const vgvRealizado = useMemo(() => {
    return units
      .filter((u) => u.status === 'vendido')
      .reduce((acc, u) => acc + u.valorFinal, 0);
  }, [units]);

  const vgvReservado = useMemo(() => {
    return units
      .filter((u) => u.status === 'reservado' || u.status === 'analise')
      .reduce((acc, u) => acc + u.valorFinal, 0);
  }, [units]);

  const vgvDisponivel = useMemo(() => {
    return units
      .filter((u) => u.status === 'disponivel')
      .reduce((acc, u) => acc + u.valorFinal, 0);
  }, [units]);

  const ticketMedioVendido = vendidas > 0 ? vgvRealizado / vendidas : (totalUnits > 0 ? vgvTotalProjetado / totalUnits : 0);
  const percentMetaGeral = settings.metaMensalGeral > 0 ? Math.min(100, Math.round((vgvRealizado / settings.metaMensalGeral) * 100)) : 0;

  // Top Brokers Leaderboard
  const brokerLeaderboard = useMemo(() => {
    const brokerSales: Record<string, { id: string; name: string; vendas: number; vgv: number; team?: string }> = {};

    // Initialize from users
    users.filter(u => u.role === 'corretor' || u.role === 'coordenador').forEach(u => {
      brokerSales[u.id] = { id: u.id, name: u.name, vendas: 0, vgv: 0, team: u.teamId };
    });

    // Populate from commissions & units
    commissions.forEach(c => {
      if (c.corretorId && brokerSales[c.corretorId]) {
        brokerSales[c.corretorId].vendas += 1;
        brokerSales[c.corretorId].vgv += c.valorVenda || 0;
      }
    });

    // Also look into units sold with corretorNome
    units.filter(u => u.status === 'vendido').forEach(u => {
      if (u.reservadoPorCorretorId && brokerSales[u.reservadoPorCorretorId]) {
        // If not already counted in commissions
        if (brokerSales[u.reservadoPorCorretorId].vgv === 0) {
          brokerSales[u.reservadoPorCorretorId].vendas += 1;
          brokerSales[u.reservadoPorCorretorId].vgv += u.valorFinal;
        }
      }
    });

    return Object.values(brokerSales)
      .sort((a, b) => b.vgv - a.vgv || b.vendas - a.vendas)
      .slice(0, 5);
  }, [users, commissions, units]);

  // Group Distribution
  const grupoA = units.filter((u) => u.grupo === 'Grupo A').length;
  const grupoB = units.filter((u) => u.grupo === 'Grupo B').length;
  const grupoC = units.filter((u) => u.grupo === 'Grupo C').length;

  const pieData = [
    { name: 'Grupo A (MCMV 1)', value: grupoA, color: '#10b981' },
    { name: 'Grupo B (MCMV 2)', value: grupoB, color: '#3b82f6' },
    { name: 'Grupo C (MCMV 3/SBPE)', value: grupoC, color: '#8b5cf6' },
  ];

  const statusPieData = [
    { name: 'Disponíveis', value: disponiveis, color: '#10b981' },
    { name: 'Reservadas (72h)', value: reservadas, color: '#f59e0b' },
    { name: 'Em Análise CEF', value: emAnalise, color: '#6366f1' },
    { name: 'Vendidas', value: vendidas, color: '#0f172a' },
  ];

  // Active in Roulette
  const corretoresPresentes = attendances.filter((a) => a.emFilaRoleta).length;

  // Lead Funnel stats
  const leadsQuentes = leads.filter(
    (l) => l.status === 'analise_cef' || l.status === 'aprovado_cef'
  ).length;

  const leadsAprovados = leads.filter(l => l.status === 'aprovado_cef' || l.status === 'contrato_assinado').length;
  const leadsContratos = leads.filter(l => l.status === 'contrato_assinado').length;
  const taxaConversaoGeral = leads.length > 0 ? Math.round((leadsContratos / leads.length) * 100) : 0;
  const taxaAprovacaoCEF = leads.length > 0 ? Math.round((leadsAprovados / leads.length) * 100) : 0;

  // Monthly Sales Volume calculation
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthNum = now.getMonth() + 1; // 1-12
  const currentMonthKey = `${currentYear}-${String(currentMonthNum).padStart(2, '0')}`;
  const currentMonthName = monthNames[currentMonthNum - 1];

  // Specific current month metrics
  const monthlySalesMap: Record<string, { month: string; vgv: number; vendas: number }> = {};
  
  for (let m = 1; m <= 12; m++) {
    const monthKey = `${currentYear}-${String(m).padStart(2, '0')}`;
    monthlySalesMap[monthKey] = { month: monthNames[m - 1], vgv: 0, vendas: 0 };
  }

  commissions.forEach((c) => {
    if (c.dataVenda) {
      const parts = c.dataVenda.split('-');
      if (parts.length >= 2) {
        const mKey = `${parts[0]}-${parts[1]}`;
        if (monthlySalesMap[mKey]) {
          monthlySalesMap[mKey].vgv += c.valorVenda || 0;
          monthlySalesMap[mKey].vendas += 1;
        } else {
          const mNum = parseInt(parts[1], 10);
          if (mNum >= 1 && mNum <= 12) {
            monthlySalesMap[mKey] = { month: monthNames[mNum - 1], vgv: c.valorVenda || 0, vendas: 1 };
          }
        }
      }
    }
  });

  const totalVendasMes = monthlySalesMap[currentMonthKey]?.vendas || 0;
  const vgvMes = monthlySalesMap[currentMonthKey]?.vgv || 0;

  // Leads em atendimento ativo (excluindo os que foram perdidos ou já finalizaram contrato)
  const leadsEmAtendimento = leads.filter(
    (l) => !l.naCaixaDeLeads && l.status !== 'perdido' && l.status !== 'contrato_assinado'
  ).length;

  // Conversão de Reservas (relação entre contratos assinados e total de propostas que chegaram a reservar ou fechar)
  const totalReservadosHistorico = units.filter(
    (u) => u.status === 'vendido' || u.status === 'reservado' || u.status === 'analise'
  ).length;
  const taxaConversaoReservas = totalReservadosHistorico > 0 
    ? Math.round((vendidas / totalReservadosHistorico) * 100) 
    : 0;

  const monthlySalesData = Object.keys(monthlySalesMap).sort().map(k => monthlySalesMap[k]);

  // Lead Funnel Data
  const funnelStagesOrder: { key: FunnelStage; label: string; color: string }[] = [
    { key: 'pre_cadastro', label: 'Pré-Cad.', color: '#94a3b8' },
    { key: 'contato_feito', label: 'Contato', color: '#3b82f6' },
    { key: 'visita_agendada', label: 'Visita Ag.', color: '#6366f1' },
    { key: 'visita_realizada', label: 'Plantão', color: '#8b5cf6' },
    { key: 'doc_coletada', label: 'Docs', color: '#ec4899' },
    { key: 'analise_cef', label: 'Análise CEF', color: '#f59e0b' },
    { key: 'aprovado_cef', label: 'Aprov. CEF', color: '#10b981' },
    { key: 'contrato_assinado', label: 'Contrato', color: '#059669' },
  ];

  const funnelData = funnelStagesOrder.map(stage => {
    const count = leads.filter(l => l.status === stage.key).length;
    return {
      name: stage.label,
      leads: count,
      color: stage.color,
    };
  });

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Welcome & Command Header */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-6 lg:p-8 rounded-3xl shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-6 border border-emerald-800/30">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <Flame className="w-3.5 h-3.5 text-emerald-400" />
            <span>Painel Executivo & Business Intelligence</span>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
            <div className="space-y-1">
              <h1 className="text-2xl lg:text-3xl font-black tracking-tight font-sans">
                Olá, {currentUser.name}! 👋
              </h1>
              <p className="text-xs text-slate-300 font-medium opacity-90">
                {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} • {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute:'2-digit' })}
              </p>
            </div>
            
            {settings.developerLogoUrl && (
              <div className="shrink-0 h-16 w-auto bg-white/10 rounded-2xl p-2 border border-white/10 backdrop-blur-sm hidden md:flex items-center justify-center">
                <img src={settings.developerLogoUrl} alt="Logo" className="max-h-full w-auto object-contain" />
              </div>
            )}
          </div>

          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            Painel comercial em tempo real das <b>{totalUnits} unidades</b> do empreendimento Jardim Vivência. Acompanhe metas de VGV, pipeline Caixa e fila da Roleta da Vez.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => setActiveTab('simulador')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all shadow-sm active:scale-98 cursor-pointer"
          >
            <span>Novo Simulador CEF</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveTab('espelho_vendas')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition-all border border-white/15 active:scale-98 cursor-pointer"
          >
            <Building2 className="w-4 h-4 text-emerald-400" />
            <span>Espelho de Vendas</span>
          </button>
          <button
            onClick={() => setActiveTab('plantao')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition-all border border-white/15 active:scale-98 cursor-pointer"
          >
            <Dices className="w-4 h-4 text-purple-400" />
            <span>Roleta ({corretoresPresentes})</span>
          </button>
        </div>
      </div>

      {/* Central de Alertas de Expiração de Reservas (72h) */}
      <ReservationAlertsBanner />

      {/* Task Alert: Banner de Notificação de Tarefas Atrasadas (Overdue) */}
      <TaskAlertBanner />

      {/* TOP KPI CARDS: INDICADORES CHAVE EM TEMPO REAL */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total de Vendas no Mês */}
        <div 
          onClick={() => setActiveTab('tabela_vendas')}
          className="group relative overflow-hidden p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md transition-all hover:border-emerald-400/60 dark:hover:border-emerald-500/40 cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Vendas em {currentMonthName}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shadow-xs group-hover:scale-110 transition-transform">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 dark:text-white font-tabular tracking-tight">
                {totalVendasMes}
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {totalVendasMes === 1 ? 'contrato' : 'contratos'}
              </span>
            </div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>VGV Mês: {formatCurrency(vgvMes)}</span>
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>Acumulado total: {vendidas} un.</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
              Ver Vendas <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* KPI 2: Leads em Atendimento */}
        <div 
          onClick={() => setActiveTab('kanban')}
          className="group relative overflow-hidden p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md transition-all hover:border-blue-400/60 dark:hover:border-blue-500/40 cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Leads em Atendimento
            </span>
            <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shadow-xs group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 dark:text-white font-tabular tracking-tight">
                {leadsEmAtendimento}
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                ativos no pipeline
              </span>
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400 font-bold mt-1 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" />
              <span>{leadsQuentes} em análise/aprovados CEF</span>
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>{leads.length} leads cadastrados</span>
            <span className="font-bold text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
              Abrir Funil <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* KPI 3: Conversão de Reservas */}
        <div 
          onClick={() => setActiveTab('espelho_vendas')}
          className="group relative overflow-hidden p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md transition-all hover:border-amber-400/60 dark:hover:border-amber-500/40 cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Conversão de Reservas
            </span>
            <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shadow-xs group-hover:scale-110 transition-transform">
              <Percent className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 dark:text-white font-tabular tracking-tight">
                {taxaConversaoReservas}%
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                reservas assinadas
              </span>
            </div>
            <p className="text-xs text-amber-600 dark:text-amber-400 font-bold mt-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{reservadas + emAnalise} lotes em negociação ativa</span>
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>{vendidas} fechadas / {totalReservadosHistorico} reservadas</span>
            <span className="font-bold text-amber-600 dark:text-amber-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
              Ver Lotes <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* KPI 4: VGV Total Realizado / Meta */}
        <div 
          onClick={() => setActiveTab('simulador')}
          className="group relative overflow-hidden p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md transition-all hover:border-purple-400/60 dark:hover:border-purple-500/40 cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              VGV Realizado
            </span>
            <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold shadow-xs group-hover:scale-110 transition-transform">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 dark:text-white font-tabular tracking-tight">
                {formatCurrency(vgvRealizado)}
              </span>
            </div>
            <p className="text-xs text-purple-600 dark:text-purple-400 font-bold mt-1 flex items-center gap-1">
              <Target className="w-3.5 h-3.5" />
              <span>{pctVendida}% do VGV Total Projetado</span>
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>Meta: {formatCurrency(settings.metaMensalGeral || vgvTotalProjetado)}</span>
            <span className="font-bold text-purple-600 dark:text-purple-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
              Simular <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>

      {/* Follow-Up Alert Banner */}
      {(vencidosCount > 0 || hojeCount > 0) && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 p-4 lg:p-5 rounded-3xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-amber-500 text-white rounded-2xl shrink-0 shadow-xs">
              <BellRing className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-black text-amber-900 dark:text-amber-200 flex items-center gap-2">
                <span>Central de Follow-Up Comercial</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 font-black">
                  {vencidosCount} atrasados • {hojeCount} hoje
                </span>
              </h4>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                Existem leads com follow-up agendado pendente. Mantenha o contato frequente para aumentar a conversão.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowFollowUpModal(true)}
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors shrink-0 shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <BellRing className="w-4 h-4" />
            <span>Abrir Central de Follow-Ups</span>
          </button>
        </div>
      )}

      {/* PAINEL EXECUTIVO DE VGV (BUSINESS INTELLIGENCE) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 lg:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              <Target className="w-4 h-4" />
              <span>Visão Estratégica Financeira</span>
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Command Center de VGV & Desempenho
            </h2>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700">
            <button
              onClick={() => setSelectedPeriod('total')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedPeriod === 'total'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Geral ({totalUnits} Lotes)
            </button>
            <button
              onClick={() => setSelectedPeriod('ano')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedPeriod === 'ano'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Ano {currentYear}
            </button>
          </div>
        </div>

        {/* 4 Big VGV Metric Blocks */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* VGV Total Projetado */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">VGV Total Projetado</span>
              <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span className="text-2xl font-black text-slate-900 dark:text-white font-tabular tracking-tight">
                {formatCurrency(vgvTotalProjetado)}
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Ticket Médio: <b className="text-slate-700 dark:text-slate-300 font-tabular">{formatCurrency(ticketMedioVendido)}</b>
              </p>
            </div>
            <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-200/60 dark:border-slate-700 flex justify-between">
              <span>Estoque total:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{totalUnits} unidades</span>
            </div>
          </div>

          {/* VGV Realizado (Vendido) */}
          <div className="p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">VGV Realizado (Vendido)</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span className="text-2xl font-black text-emerald-900 dark:text-emerald-300 font-tabular tracking-tight">
                {formatCurrency(vgvRealizado)}
              </span>
              <div className="w-full bg-emerald-200/80 dark:bg-emerald-900/60 h-2 rounded-full overflow-hidden mt-2">
                <div className="bg-emerald-600 dark:bg-emerald-400 h-full rounded-full transition-all duration-500" style={{ width: `${pctVendida}%` }} />
              </div>
            </div>
            <div className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 pt-1 flex justify-between">
              <span>{vendidas} contratos assinados</span>
              <span className="font-black">{pctVendida}% do VGV</span>
            </div>
          </div>

          {/* VGV em Negociação (Reservado + CEF) */}
          <div className="p-5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-800 dark:text-amber-300">Pipeline (Reservas & CEF)</span>
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span className="text-2xl font-black text-amber-900 dark:text-amber-300 font-tabular tracking-tight">
                {formatCurrency(vgvReservado)}
              </span>
              <div className="w-full bg-amber-200/80 dark:bg-amber-900/60 h-2 rounded-full overflow-hidden mt-2">
                <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${pctReservada}%` }} />
              </div>
            </div>
            <div className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 pt-1 flex justify-between">
              <span>{reservadas + emAnalise} lotes em processo</span>
              <span className="font-black">{pctReservada}% do VGV</span>
            </div>
          </div>

          {/* VGV Disponível em Estoque */}
          <div className="p-5 rounded-2xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-sky-800 dark:text-sky-300">Estoque Disponível</span>
              <div className="w-8 h-8 rounded-xl bg-sky-500 text-white flex items-center justify-center shadow-xs">
                <Building className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span className="text-2xl font-black text-sky-900 dark:text-sky-300 font-tabular tracking-tight">
                {formatCurrency(vgvDisponivel)}
              </span>
              <div className="w-full bg-sky-200/80 dark:bg-sky-900/60 h-2 rounded-full overflow-hidden mt-2">
                <div className="bg-sky-500 h-full rounded-full transition-all duration-500" style={{ width: `${pctDisponivel}%` }} />
              </div>
            </div>
            <div className="text-[11px] font-semibold text-sky-800 dark:text-sky-300 pt-1 flex justify-between">
              <span>{disponiveis} lotes livres no espelho</span>
              <span className="font-black">{pctDisponivel}% restante</span>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Analytics & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Breakdown Chart */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-sm text-slate-900 dark:text-white">Status das 877 Unidades</h3>
            <span className="text-[11px] font-bold text-slate-500">{totalUnits} total</span>
          </div>

          <div className="h-48 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any) => [`${value} unidades`, 'Quantidade']}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', borderColor: '#e2e8f0', color: '#0f172a', fontWeight: 'bold' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {statusPieData.map((s) => (
              <div key={s.name} className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                <span className="truncate">{s.name}: <b className="text-slate-900 dark:text-slate-100">{s.value}</b></span>
              </div>
            ))}
          </div>
        </div>

        {/* Group Breakdown (MCMV 1, 2, 3/SBPE) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-sm text-slate-900 dark:text-white">Distribuição por Faixa (Grupos)</h3>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">Enquadramento MCMV</span>
          </div>

          <div className="h-48 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any) => [`${value} unidades`, 'Total']}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', borderColor: '#e2e8f0', color: '#0f172a', fontWeight: 'bold' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
            {pieData.map((g) => (
              <div key={g.name} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: g.color }} />
                  <span>{g.name}</span>
                </div>
                <span className="font-bold text-slate-800 dark:text-slate-200 font-tabular">{g.value} unidades</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Brokers Leaderboard */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              <h3 className="font-black text-sm text-slate-900 dark:text-white">Top Corretores (Ranking)</h3>
            </div>
            <button
              onClick={() => setActiveTab('equipes')}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-bold"
            >
              Ver Equipes
            </button>
          </div>

          <div className="space-y-2.5">
            {brokerLeaderboard.length > 0 ? (
              brokerLeaderboard.map((broker, idx) => {
                const medalColors = [
                  'bg-amber-400 text-slate-950 font-black',
                  'bg-slate-300 text-slate-900 font-black',
                  'bg-amber-700 text-white font-black',
                ];
                return (
                  <div
                    key={broker.id}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] shrink-0 ${
                        idx < 3 ? medalColors[idx] : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                      }`}>
                        {idx + 1}
                      </span>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white truncate max-w-[120px] sm:max-w-[150px]">
                          {broker.name}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          {broker.vendas} {broker.vendas === 1 ? 'venda' : 'vendas'}
                        </p>
                      </div>
                    </div>

                    <span className="font-black text-emerald-700 dark:text-emerald-400 font-tabular">
                      {formatCurrency(broker.vgv)}
                    </span>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-500 text-center py-6">
                Nenhuma venda registrada no ranking ainda.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Advanced Charts: Monthly Sales Volume & Lead Pipeline Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Sales Volume Chart */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-black text-sm text-slate-900 dark:text-white">Volume de Vendas Mensal (VGV)</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Evolução do VGV realizado por mês em {currentYear}</p>
            </div>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlySalesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#64748b" />
                <YAxis 
                  tick={{ fontSize: 10 }} 
                  stroke="#64748b"
                  tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  formatter={(value: any) => [formatCurrency(Number(value) || 0), 'VGV Realizado']}
                  labelStyle={{ fontWeight: 'bold', color: '#0f172a' }}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', borderColor: '#e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="vgv" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>Total Ano: <b className="text-slate-800 dark:text-slate-200 font-tabular">{formatCurrency(monthlySalesData.reduce((acc, curr) => acc + curr.vgv, 0))}</b></span>
            <span>Total Vendas: <b className="text-emerald-700 dark:text-emerald-400 font-tabular">{monthlySalesData.reduce((acc, curr) => acc + curr.vendas, 0)} unidades</b></span>
          </div>
        </div>

        {/* Lead Funnel Chart */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-black text-sm text-slate-900 dark:text-white">Funil Comercial & Conversão</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Distribuição de proponentes por etapa do pipeline</p>
            </div>
            <div className="p-2 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-2xl">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} layout="vertical" margin={{ top: 10, right: 10, left: 30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="#64748b" />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} stroke="#64748b" width={90} />
                <Tooltip 
                  formatter={(value: any) => [`${value} Leads`, 'Quantidade']}
                  labelStyle={{ fontWeight: 'bold', color: '#0f172a' }}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', borderColor: '#e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="leads" fill="#3b82f6" radius={[0, 6, 6, 0]}>
                  {funnelData.map((entry, index) => (
                    <Cell key={`funnel-cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>Total Leads: <b className="text-slate-800 dark:text-slate-200 font-tabular">{leads.length}</b></span>
            <span>Aprovados Caixa: <b className="text-emerald-700 dark:text-emerald-400 font-tabular">{leadsAprovados} ({taxaAprovacaoCEF}%)</b></span>
            <span>Contratos: <b className="text-blue-700 dark:text-blue-400 font-tabular">{leadsContratos} ({taxaConversaoGeral}%)</b></span>
          </div>
        </div>
      </div>

      <FollowUpCentralModal
        isOpen={showFollowUpModal}
        onClose={() => setShowFollowUpModal(false)}
        onOpenLeadModal={(leadId) => {
          const found = leads.find((l) => l.id === leadId);
          if (found) setSelectedLeadForModal(found);
        }}
      />
    </div>
  );
};
