import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/simulatorEngine';
import {
  BarChart3,
  Dices,
  Users,
  CheckCircle2,
  TrendingUp,
  Clock,
  Award,
  Calendar,
  ShieldCheck,
  Printer,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export const RouletteReport: React.FC = () => {
  const {
    rouletteHistory,
    users,
    leads,
    commissions,
    currentUser,
  } = useApp();

  // Metrics per Corretor
  const corretorStats = useMemo(() => {
    const stats: Record<
      string,
      {
        corretorId: string;
        corretorNome: string;
        atendimentosTotal: number;
        vendasFechadas: number;
        tempoMedioMinutos: number;
      }
    > = {};

    users.forEach((u) => {
      stats[u.id] = {
        corretorId: u.id,
        corretorNome: u.name,
        atendimentosTotal: 0,
        vendasFechadas: 0,
        tempoMedioMinutos: 30,
      };
    });

    rouletteHistory.forEach((r) => {
      if (stats[r.corretorId]) {
        stats[r.corretorId].atendimentosTotal += 1;
        stats[r.corretorId].tempoMedioMinutos = (stats[r.corretorId].tempoMedioMinutos + r.duracaoMinutos) / 2;
      }
    });

    // Count closed sales for these leads
    commissions.forEach((c) => {
      if (stats[c.corretorId]) {
        stats[c.corretorId].vendasFechadas += 1;
      }
    });

    return Object.values(stats).filter((s) => s.atendimentosTotal > 0 || s.vendasFechadas > 0);
  }, [rouletteHistory, users, commissions]);

  const totalAtendimentos = rouletteHistory.length;
  const totalVendasRoleta = commissions.length;
  const taxaConversaoMedia = totalAtendimentos > 0 ? Math.round((totalVendasRoleta / totalAtendimentos) * 100) : 38;

  const chartData = corretorStats.map((s) => ({
    name: s.corretorNome.split(' ')[0],
    atendimentos: s.atendimentosTotal,
    vendas: s.vendasFechadas,
  }));

  const COLORS = ['#10b981', '#0284c7', '#8b5cf6', '#f59e0b', '#ec4899'];

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Relatório da Roleta de Plantão
            </h1>
            <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
              Exclusivo Administrador
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
            Auditoria da distribuição de leads por corretor, taxa de conversão e assertividade dos atendimentos presenciais.
          </p>
        </div>

        <button
          id="btn-print-roulette-report"
          onClick={() => window.print()}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors shrink-0"
        >
          <Printer className="w-4 h-4" />
          <span>Imprimir / PDF</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Total de Giros / Atendimentos</span>
            <Dices className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalAtendimentos}</p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Leads porta e centrais distribuídos</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Taxa de Conversão da Roleta</span>
            <TrendingUp className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          </div>
          <p className="text-2xl font-bold text-sky-600 dark:text-sky-400">{taxaConversaoMedia}%</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Atendimentos que viraram proposta/venda</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Tempo Médio na Maquete</span>
            <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">32 min</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Tempo médio de apresentação do loteamento</p>
        </div>
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Comparativo de Atendimentos vs Vendas por Corretor
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" fontSize={11} stroke="#94a3b8" />
                <YAxis fontSize={11} stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="atendimentos" name="Atendimentos na Roleta" fill="#0284c7" radius={[6, 6, 0, 0]} />
                <Bar dataKey="vendas" name="Vendas Concluídas" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Desempenho por Corretor
          </h3>
          <div className="space-y-3 max-h-64 overflow-y-auto pr-1 text-xs">
            {corretorStats.map((stat, i) => (
              <div key={stat.corretorId} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700 space-y-1">
                <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                  <span>{stat.corretorNome}</span>
                  <span className="text-emerald-600 dark:text-emerald-400">{stat.vendasFechadas} vendas</span>
                </div>
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                  <span>Atendimentos: {stat.atendimentosTotal}</span>
                  <span>Tempo Médio: {Math.round(stat.tempoMedioMinutos)}m</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed History Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 font-bold text-xs text-slate-900 dark:text-white">
          Histórico Completo de Giros da Roleta
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 font-semibold">
              <tr>
                <th className="p-3">Data/Hora</th>
                <th className="p-3">Corretor</th>
                <th className="p-3">Lead / Cliente</th>
                <th className="p-3">Origem</th>
                <th className="p-3">Resultado</th>
                <th className="p-3">Observações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {rouletteHistory.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="p-3 font-mono text-[11px] text-slate-500 dark:text-slate-400">{item.dataHora}</td>
                  <td className="p-3 font-semibold text-slate-900 dark:text-white">{item.corretorNome}</td>
                  <td className="p-3 text-slate-700 dark:text-slate-300">{item.leadNome}</td>
                  <td className="p-3 text-slate-500 dark:text-slate-400">{item.origem}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded-md font-semibold text-[10px] ${
                        item.resultado === 'atendido'
                          ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                          : 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300'
                      }`}
                    >
                      {item.resultado === 'atendido' ? 'Atendido' : 'Passou Vez'}
                    </span>
                  </td>
                  <td className="p-3 text-slate-500 dark:text-slate-400">{item.observacao || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
