import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Lead, isFullAdmin } from '../types';
import {
  MapPin,
  Building,
  TrendingUp,
  Download,
  Printer,
  Search,
  Filter,
  Users,
  DollarSign,
  PieChart as PieChartIcon,
  BarChart3,
  Award,
  ChevronRight,
  ShieldAlert,
  Sparkles,
  ArrowUpRight,
  CheckCircle2,
  FileSpreadsheet,
  X,
  Phone,
  Mail,
  Calendar,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts';

export const NeighborhoodsMapView: React.FC = () => {
  const { leads, teams, currentUser } = useApp();

  // Filters & Export State
  const [searchQuery, setSearchQuery] = useState('');
  const [periodFilter, setPeriodFilter] = useState<'all' | 'month' | '30days' | 'year'>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [teamFilter, setTeamFilter] = useState<string>('all');
  const [selectedNeighborhoodModal, setSelectedNeighborhoodModal] = useState<string | null>(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);

  const canAccess = isFullAdmin(currentUser.role) || currentUser.role === 'coordenador';

  if (!canAccess) {
    return (
      <div className="p-8 max-w-2xl mx-auto my-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Acesso Restrito</h2>
        <p className="text-xs text-slate-600 dark:text-slate-300">
          O relatório e mapa de procedência de clientes por bairro é exclusivo para Administradores, Diretores, Supervisores e Coordenadores.
        </p>
      </div>
    );
  }

  // Filter leads based on selected criteria
  const filteredLeads = useMemo(() => {
    const now = new Date();

    return leads.filter((lead) => {
      // Channel Filter
      if (channelFilter !== 'all' && lead.origem !== channelFilter) {
        return false;
      }

      // Team Filter
      if (teamFilter !== 'all' && lead.equipeId !== teamFilter) {
        return false;
      }

      // Date Filter
      if (periodFilter !== 'all' && lead.dataCadastro) {
        const leadDate = new Date(lead.dataCadastro);
        if (periodFilter === 'month') {
          if (leadDate.getMonth() !== now.getMonth() || leadDate.getFullYear() !== now.getFullYear()) {
            return false;
          }
        } else if (periodFilter === '30days') {
          const diffDays = (now.getTime() - leadDate.getTime()) / (1000 * 3600 * 24);
          if (diffDays > 30) return false;
        } else if (periodFilter === 'year') {
          if (leadDate.getFullYear() !== now.getFullYear()) return false;
        }
      }

      return true;
    });
  }, [leads, periodFilter, channelFilter, teamFilter]);

  // Aggregate stats by neighborhood
  const neighborhoodStats = useMemo(() => {
    const map = new Map<
      string,
      {
        bairro: string;
        cidade: string;
        totalLeads: number;
        ativos: number;
        aprovadosCef: number;
        contratosAssinados: number;
        vgvTotal: number;
        canais: Record<string, number>;
        leadsList: Lead[];
      }
    >();

    filteredLeads.forEach((lead) => {
      // Parse neighborhood if not explicit
      let bairro = lead.bairro?.trim();
      let cidade = lead.cidade?.trim() || 'Curitiba';

      if (!bairro && lead.endereco) {
        const parts = lead.endereco.split('-').map((p) => p.trim());
        if (parts.length >= 2) {
          const subParts = parts[1].split(',');
          bairro = subParts[0].trim();
        } else {
          bairro = 'Não Informado / Outros';
        }
      }

      if (!bairro) {
        bairro = 'Outros / Não Declarado';
      }

      if (!map.has(bairro)) {
        map.set(bairro, {
          bairro,
          cidade,
          totalLeads: 0,
          ativos: 0,
          aprovadosCef: 0,
          contratosAssinados: 0,
          vgvTotal: 0,
          canais: {},
          leadsList: [],
        });
      }

      const item = map.get(bairro)!;
      item.totalLeads += 1;
      item.leadsList.push(lead);

      if (lead.status !== 'distratado' && lead.status !== 'descartado') {
        item.ativos += 1;
      }

      if (lead.status === 'aprovado_cef' || lead.status === 'contrato_assinado') {
        item.aprovadosCef += 1;
      }

      if (lead.status === 'contrato_assinado') {
        item.contratosAssinados += 1;
        item.vgvTotal += lead.valorSimulacao || 210000;
      } else if (lead.status === 'aprovado_cef') {
        item.vgvTotal += (lead.valorSimulacao || 210000) * 0.5; // Estimated pipeline weight
      }

      // Track channels
      const canal = lead.origem || 'Plantão Presencial';
      item.canais[canal] = (item.canais[canal] || 0) + 1;
    });

    // Convert map to array and compute rankings
    const list = Array.from(map.values()).map((item) => {
      let topCanal = 'Plantão Presencial';
      let maxCount = 0;
      Object.entries(item.canais).forEach(([c, count]) => {
        if (count > maxCount) {
          maxCount = count;
          topCanal = c;
        }
      });

      return {
        ...item,
        topCanal,
        percentual: filteredLeads.length > 0 ? (item.totalLeads / filteredLeads.length) * 100 : 0,
        taxaConversao: item.totalLeads > 0 ? (item.contratosAssinados / item.totalLeads) * 100 : 0,
      };
    });

    // Sort by total leads descending
    return list.sort((a, b) => b.totalLeads - a.totalLeads);
  }, [filteredLeads]);

  // Search filter applied to neighborhoodStats
  const displayedNeighborhoods = useMemo(() => {
    if (!searchQuery.trim()) return neighborhoodStats;
    const q = searchQuery.toLowerCase();
    return neighborhoodStats.filter(
      (n) => n.bairro.toLowerCase().includes(q) || n.cidade.toLowerCase().includes(q)
    );
  }, [neighborhoodStats, searchQuery]);

  // Overall metrics
  const totalLeadsCount = filteredLeads.length;
  const totalBairrosCount = neighborhoodStats.length;
  const topBairro = neighborhoodStats[0];

  const totalVgvBairros = useMemo(() => {
    return neighborhoodStats.reduce((acc, curr) => acc + curr.vgvTotal, 0);
  }, [neighborhoodStats]);

  // Recharts Chart Data (Top 10)
  const chartDataTop10 = useMemo(() => {
    return neighborhoodStats.slice(0, 10).map((n) => ({
      name: n.bairro,
      Leads: n.totalLeads,
      'Contratos Assinados': n.contratosAssinados,
      'VGV (R$)': Math.round(n.vgvTotal / 1000), // in thousands
    }));
  }, [neighborhoodStats]);

  // Channel Distribution Chart Data
  const channelDataPie = useMemo(() => {
    const channelCounts: Record<string, number> = {};
    filteredLeads.forEach((l) => {
      const orig = l.origem || 'Plantão Presencial';
      channelCounts[orig] = (channelCounts[orig] || 0) + 1;
    });
    return Object.entries(channelCounts).map(([name, value]) => ({ name, value }));
  }, [filteredLeads]);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'];

  // Export CSV (Grouped Neighborhood Summary)
  const handleExportSummaryCSV = () => {
    const headers = [
      'Bairro',
      'Cidade / Região',
      'Total de Leads',
      'Leads Ativos',
      'Aprovados CEF',
      'Contratos Assinados',
      'VGV Estimado / Assinado (R$)',
      'Principal Canal de Origem',
      '% do Total de Leads',
      'Taxa de Conversão (%)',
    ];

    const rows = neighborhoodStats.map((n) => [
      n.bairro,
      n.cidade,
      n.totalLeads,
      n.ativos,
      n.aprovadosCef,
      n.contratosAssinados,
      n.vgvTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      n.topCanal,
      `${n.percentual.toFixed(1)}%`,
      `${n.taxaConversao.toFixed(1)}%`,
    ]);

    const csvContent =
      '\uFEFF' +
      [headers.join(';'), ...rows.map((r) => r.map((cell) => `"${String(cell || '').replace(/"/g, '""')}"`).join(';'))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_bairros_resumo_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setExportDropdownOpen(false);
  };

  // Export CSV (Detailed Client List by Origin)
  const handleExportDetailedLeadsCSV = () => {
    const headers = [
      'ID Lead',
      'Nome do Cliente',
      'Telefone',
      'E-mail',
      'Bairro de Origem',
      'Cidade',
      'Endereço Completo',
      'Canal de Origem',
      'Estágio / Status',
      'Renda Familiar (R$)',
      'FGTS (R$)',
      'Corretor Responsável',
      'Data de Cadastro',
    ];

    const rows = filteredLeads.map((l) => [
      l.codigoExterno || l.id,
      l.nome,
      l.telefone,
      l.email || 'Não Informado',
      l.bairro || 'Não Informado',
      l.cidade || 'Curitiba',
      l.endereco || 'Não Informado',
      l.origem || 'Plantão Presencial',
      (l.status || '').replace('_', ' '),
      (l.rendaFamiliar || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      (l.fgts || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      l.corretorNome || 'Não Atribuído',
      l.dataCadastro ? new Date(l.dataCadastro).toLocaleDateString('pt-BR') : 'N/A',
    ]);

    const csvContent =
      '\uFEFF' +
      [headers.join(';'), ...rows.map((r) => r.map((cell) => `"${String(cell || '').replace(/"/g, '""')}"`).join(';'))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_clientes_origem_bairros_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setExportDropdownOpen(false);
  };

  // Export CSV for a Single Neighborhood
  const handleExportNeighborhoodCSV = (nData: typeof neighborhoodStats[0]) => {
    const headers = [
      'Bairro',
      'Nome do Cliente',
      'Telefone',
      'E-mail',
      'Canal de Origem',
      'Status do Lead',
      'Renda Familiar (R$)',
      'Corretor Responsável',
    ];

    const rows = nData.leadsList.map((l) => [
      nData.bairro,
      l.nome,
      l.telefone,
      l.email || 'Não Informado',
      l.origem || 'Plantão Presencial',
      (l.status || '').replace('_', ' '),
      (l.rendaFamiliar || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      l.corretorNome || 'Não Atribuído',
    ]);

    const csvContent =
      '\uFEFF' +
      [headers.join(';'), ...rows.map((r) => r.map((cell) => `"${String(cell || '').replace(/"/g, '""')}"`).join(';'))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `clientes_bairro_${nData.bairro.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  // Selected Neighborhood Modal Data
  const selectedNeighborhoodData = useMemo(() => {
    if (!selectedNeighborhoodModal) return null;
    return neighborhoodStats.find((n) => n.bairro === selectedNeighborhoodModal) || null;
  }, [selectedNeighborhoodModal, neighborhoodStats]);

  return (
    <div className="space-y-6 pb-12 print:p-0 print:space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm print:border-none print:shadow-none print:p-0">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 rounded-xl">
              <MapPin className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Mapa & Origem de Clientes por Bairro
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              Gestão Geográfica
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Inteligência de mercado: identifique de quais regiões e bairros estão vindo os clientes do plantão e campanhas ativas.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          {/* CSV Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Exportar CSV / Excel</span>
            </button>

            {exportDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 py-2 z-30 text-xs animate-in fade-in zoom-in-95">
                <button
                  onClick={handleExportSummaryCSV}
                  className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium flex items-center gap-2"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Resumo por Bairro (Agrupado)</span>
                </button>
                <button
                  onClick={handleExportDetailedLeadsCSV}
                  className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium flex items-center gap-2 border-t border-slate-100 dark:border-slate-700/50"
                >
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span>Lista Detalhada de Clientes</span>
                </button>
              </div>
            )}
          </div>

          {/* PDF Report Modal Button */}
          <button
            onClick={() => setIsPdfModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Gerar PDF Executivo</span>
          </button>

          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir</span>
          </button>
        </div>
      </div>

      {/* Top Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4">
        {/* Metric 1 */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Bairro Principal</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-bold text-slate-900 dark:text-white truncate">
            {topBairro ? topBairro.bairro : 'Sem Dados'}
          </p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>
              {topBairro ? `${topBairro.totalLeads} clientes (${topBairro.percentual.toFixed(1)}%)` : '0%'}
            </span>
          </p>
        </div>

        {/* Metric 2 */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Localidades Mapeadas</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {totalBairrosCount}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Total de bairros / cidades registradas
          </p>
        </div>

        {/* Metric 3 */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">VGV Origem Geográfica</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {totalVgvBairros.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Volume de vendas fechadas e qualificadas
          </p>
        </div>

        {/* Metric 4 */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total de Leads Analisados</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {totalLeadsCount}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            No período e filtros selecionados
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 print:hidden">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
          <Filter className="w-4 h-4 text-emerald-600" />
          <span>Filtros de Pesquisa & Período:</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar bairro ou cidade..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white"
            />
          </div>

          {/* Period Select */}
          <div>
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white"
            >
              <option value="all">📅 Todo o Histórico</option>
              <option value="month">📅 Este Mês</option>
              <option value="30days">📅 Últimos 30 Dias</option>
              <option value="year">📅 Este Ano</option>
            </select>
          </div>

          {/* Channel Select */}
          <div>
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white"
            >
              <option value="all">📢 Todos os Canais</option>
              <option value="Plantão Presencial">🏪 Plantão Presencial</option>
              <option value="Instagram/Facebook">📱 Instagram / Facebook</option>
              <option value="Google Ads">🔍 Google Ads</option>
              <option value="Portal Imobiliário">🏢 Portal Imobiliário</option>
              <option value="WhatsApp Direto">💬 WhatsApp Direto</option>
              <option value="Indicação">👥 Indicação de Cliente</option>
            </select>
          </div>

          {/* Team Select */}
          <div>
            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white"
            >
              <option value="all">🛡️ Todas as Equipes</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Top 10 Bairros */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-600" />
                <span>Ranking dos Top 10 Bairros com Mais Demanda</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Quantidade de clientes cadastrados no plantão e campanhas por localidade.
              </p>
            </div>
          </div>

          <div className="h-72 w-full pt-4">
            {chartDataTop10.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartDataTop10} margin={{ top: 10, right: 20, left: -10, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="name"
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                  />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                      border: 'none',
                    }}
                  />
                  <Bar dataKey="Leads" fill="#10b981" radius={[6, 6, 0, 0]}>
                    {chartDataTop10.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Nenhum dado encontrado com os filtros selecionados.
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: Channel Origin Distribution */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-emerald-600" />
              <span>Canais de Atração Geral</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Proporção dos canais de captação que originaram clientes.
            </p>
          </div>

          <div className="h-72 w-full pt-2">
            {channelDataPie.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={channelDataPie}
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {channelDataPie.map((_, index) => (
                      <Cell key={`pie-cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '11px',
                    }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Sem dados de canais
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Neighborhood Cards / Hotspot Map */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Mapa de Calor por Bairros & Cidades ({displayedNeighborhoods.length})</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Clique em qualquer bairro para expandir a lista detalhada de clientes e contatos.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {displayedNeighborhoods.map((n, idx) => {
            const isHigh = n.totalLeads >= 3;
            const isMedium = n.totalLeads === 2;

            return (
              <div
                key={n.bairro}
                onClick={() => setSelectedNeighborhoodModal(n.bairro)}
                className={`group cursor-pointer p-5 rounded-2xl border transition-all duration-200 hover:shadow-md relative overflow-hidden bg-white dark:bg-slate-900 ${
                  isHigh
                    ? 'border-emerald-200 dark:border-emerald-900/50 hover:border-emerald-400'
                    : isMedium
                    ? 'border-blue-200 dark:border-blue-900/50 hover:border-blue-400'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-400'
                }`}
              >
                {/* Ranking Tag */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center ${
                        idx === 0
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : idx === 1
                          ? 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200'
                          : idx === 2
                          ? 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      #{idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                      {n.cidade}
                    </span>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isHigh
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : isMedium
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {n.percentual.toFixed(1)}% do Total
                  </span>
                </div>

                {/* Bairro Name */}
                <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                  {n.bairro}
                </h3>

                {/* Main Stats */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Clientes</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {n.totalLeads} lead{n.totalLeads > 1 ? 's' : ''}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Assinados</span>
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      {n.contratosAssinados} contrato{n.contratosAssinados !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {/* Footer details */}
                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                  <span className="truncate max-w-[140px]">Canal: {n.topCanal}</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                    Ver Leads <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Tabela Analítica Completa por Localidade
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Detalhamento de volume de atendimento, aprovações e conversão financeira por bairro.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Posição / Bairro</th>
                <th className="py-3 px-4">Cidade</th>
                <th className="py-3 px-4 text-center">Total Leads</th>
                <th className="py-3 px-4 text-center">Ativos</th>
                <th className="py-3 px-4 text-center">Aprovados CEF</th>
                <th className="py-3 px-4 text-center">Contratos</th>
                <th className="py-3 px-4 text-right">VGV Potencial / Fechado</th>
                <th className="py-3 px-4">Canal Predominante</th>
                <th className="py-3 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {displayedNeighborhoods.map((n, idx) => (
                <tr
                  key={n.bairro}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="text-slate-400 font-mono text-[11px]">#{idx + 1}</span>
                    <span>{n.bairro}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{n.cidade}</td>
                  <td className="py-3 px-4 text-center font-bold text-slate-900 dark:text-white">
                    {n.totalLeads}
                  </td>
                  <td className="py-3 px-4 text-center font-semibold text-blue-600 dark:text-blue-400">
                    {n.ativos}
                  </td>
                  <td className="py-3 px-4 text-center font-semibold text-purple-600 dark:text-purple-400">
                    {n.aprovadosCef}
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400">
                    {n.contratosAssinados}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900 dark:text-white">
                    {n.vgvTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {n.topCanal}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setSelectedNeighborhoodModal(n.bairro)}
                      className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 rounded-lg text-[11px] font-semibold transition-colors"
                    >
                      Detalhes
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Neighborhood Leads Detail Modal */}
      {selectedNeighborhoodData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-xl">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Leads do Bairro: {selectedNeighborhoodData.bairro}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedNeighborhoodData.totalLeads} cliente(s) registrados nesta localidade.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedNeighborhoodModal(null)}
                className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto space-y-4">
              <div className="grid grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-center">
                <div>
                  <span className="text-slate-400 block">Total de Leads</span>
                  <span className="font-bold text-slate-900 dark:text-white text-base">
                    {selectedNeighborhoodData.totalLeads}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Contratos Assinados</span>
                  <span className="font-bold text-emerald-600 text-base">
                    {selectedNeighborhoodData.contratosAssinados}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">VGV Estimado</span>
                  <span className="font-bold text-slate-900 dark:text-white text-base">
                    {selectedNeighborhoodData.vgvTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Lista de Clientes Cadastrados:
                </h4>

                <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                  {selectedNeighborhoodData.leadsList.map((lead) => (
                    <div
                      key={lead.id}
                      className="p-3.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white text-sm">
                            {lead.nome}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            {lead.origem}
                          </span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 flex items-center gap-3 text-[11px]">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {lead.telefone}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3 text-slate-400" />
                            Corretor: {lead.corretorNome}
                          </span>
                        </p>
                      </div>

                      <div className="text-right flex items-center justify-between sm:justify-end gap-3">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Renda</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {(lead.rendaFamiliar || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                        </div>

                        <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold capitalize bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {(lead.status || '').replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExportNeighborhoodCSV(selectedNeighborhoodData)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Exportar CSV do Bairro</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir / PDF</span>
                </button>
              </div>

              <button
                onClick={() => setSelectedNeighborhoodModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Executive PDF Report Modal */}
      {isPdfModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs p-4 sm:p-6 flex justify-center items-start print:p-0 print:bg-white print:static print:inset-auto">
          <div className="bg-white text-slate-900 rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl space-y-6 print:shadow-none print:p-0 print:rounded-none">
            {/* Modal Controls Bar (Hidden on Print) */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 print:hidden">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-blue-100 text-blue-700 rounded-2xl">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Relatório Executivo para PDF / Impressão</h3>
                  <p className="text-xs text-slate-500">
                    Módulo de Inteligência Geográfica de Leads & Bairros de Origem
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Baixar PDF / Imprimir</span>
                </button>
                <button
                  onClick={() => setIsPdfModalOpen(false)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Document Header */}
            <div className="border-b-2 border-emerald-600 pb-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-black tracking-widest uppercase text-emerald-700">
                    OTS MASTER CRM • GESTÃO COMERCIAL
                  </p>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight">
                    RELATÓRIO DE PROCEDÊNCIA & ORIGEM DE CLIENTES
                  </h1>
                  <p className="text-xs text-slate-600 font-medium">
                    Mapeamento analítico da localização dos leads e eficácia de canais por bairro
                  </p>
                </div>

                <div className="text-right text-[11px] text-slate-500 space-y-0.5">
                  <p>
                    <strong className="text-slate-800">Emissão:</strong>{' '}
                    {new Date().toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  <p>
                    <strong className="text-slate-800">Solicitante:</strong> {currentUser.name} ({currentUser.role.toUpperCase()})
                  </p>
                  <p>
                    <strong className="text-slate-800">Empreendimento:</strong> Jardim Vivência
                  </p>
                </div>
              </div>

              {/* Applied Filters Tags */}
              <div className="flex flex-wrap items-center gap-2 pt-2 text-[11px] font-semibold text-slate-700">
                <span className="text-slate-500">Filtros do Recorte:</span>
                <span className="px-2.5 py-0.5 rounded-md bg-slate-100 border border-slate-200">
                  Período: {periodFilter === 'all' ? 'Todo o Histórico' : periodFilter === 'month' ? 'Este Mês' : periodFilter === '30days' ? 'Últimos 30 Dias' : 'Este Ano'}
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-slate-100 border border-slate-200">
                  Canal: {channelFilter === 'all' ? 'Todos os Canais' : channelFilter}
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-slate-100 border border-slate-200">
                  Equipe: {teamFilter === 'all' ? 'Todas as Equipes' : teamFilter}
                </span>
              </div>
            </div>

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-4 gap-3 text-slate-800 text-xs">
              <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-2xl">
                <p className="text-[10px] uppercase font-bold text-emerald-800">Bairro Principal</p>
                <p className="text-sm font-black text-slate-900 truncate">{topBairro ? topBairro.bairro : 'N/A'}</p>
                <p className="text-[10px] text-emerald-700 font-semibold">
                  {topBairro ? `${topBairro.totalLeads} leads (${topBairro.percentual.toFixed(1)}%)` : ''}
                </p>
              </div>

              <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-2xl">
                <p className="text-[10px] uppercase font-bold text-blue-800">Localidades</p>
                <p className="text-lg font-black text-slate-900">{totalBairrosCount}</p>
                <p className="text-[10px] text-slate-500">Regiões mapeadas</p>
              </div>

              <div className="p-3 bg-purple-50/80 border border-purple-200 rounded-2xl">
                <p className="text-[10px] uppercase font-bold text-purple-800">VGV Geográfico</p>
                <p className="text-sm font-black text-slate-900">
                  {totalVgvBairros.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                </p>
                <p className="text-[10px] text-slate-500">Vendas + Carteira CEF</p>
              </div>

              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-2xl">
                <p className="text-[10px] uppercase font-bold text-amber-800">Total de Leads</p>
                <p className="text-lg font-black text-slate-900">{totalLeadsCount}</p>
                <p className="text-[10px] text-slate-500">Analisados no relatório</p>
              </div>
            </div>

            {/* Main Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide border-b border-slate-200 pb-1">
                Detalhamento dos Bairros de Origem dos Clientes
              </h4>

              <table className="w-full text-[11px] border-collapse text-slate-800">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 border-y border-slate-200 font-bold text-left">
                    <th className="p-2 text-center">#</th>
                    <th className="p-2">Bairro / Região</th>
                    <th className="p-2">Cidade</th>
                    <th className="p-2 text-center">Total</th>
                    <th className="p-2 text-center">Ativos</th>
                    <th className="p-2 text-center">Aprov. CEF</th>
                    <th className="p-2 text-center">Vendas</th>
                    <th className="p-2 text-right">VGV Estimado</th>
                    <th className="p-2">Canal Principal</th>
                    <th className="p-2 text-center">% Total</th>
                    <th className="p-2 text-center">Conversão</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {neighborhoodStats.map((item, idx) => (
                    <tr key={item.bairro} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                      <td className="p-2 text-center font-bold text-slate-500">{idx + 1}º</td>
                      <td className="p-2 font-bold text-slate-900">{item.bairro}</td>
                      <td className="p-2 text-slate-600">{item.cidade}</td>
                      <td className="p-2 text-center font-bold">{item.totalLeads}</td>
                      <td className="p-2 text-center text-slate-600">{item.ativos}</td>
                      <td className="p-2 text-center text-blue-700 font-semibold">{item.aprovadosCef}</td>
                      <td className="p-2 text-center text-emerald-700 font-bold">{item.contratosAssinados}</td>
                      <td className="p-2 text-right font-semibold">
                        {item.vgvTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                      </td>
                      <td className="p-2 text-slate-600">{item.topCanal}</td>
                      <td className="p-2 text-center font-semibold">{item.percentual.toFixed(1)}%</td>
                      <td className="p-2 text-center font-bold text-emerald-700">{item.taxaConversao.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Channels Breakdown */}
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide border-b border-slate-200 pb-1">
                Participação dos Canais de Origem no Período
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                {channelDataPie.map((c) => {
                  const pct = totalLeadsCount > 0 ? (c.value / totalLeadsCount) * 100 : 0;
                  return (
                    <div key={c.name} className="p-2 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center">
                      <span className="font-semibold text-slate-800">{c.name}</span>
                      <span className="font-bold text-slate-900">
                        {c.value} ({pct.toFixed(1)}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Signatures & Footer */}
            <div className="pt-8 border-t border-slate-300 mt-8 space-y-8 print:mt-12">
              <div className="grid grid-cols-2 gap-8 text-center text-[11px] text-slate-600">
                <div>
                  <div className="border-t border-slate-400 w-48 mx-auto mb-1"></div>
                  <p className="font-bold text-slate-800">{currentUser.name}</p>
                  <p className="text-[10px] text-slate-500 uppercase">{currentUser.role} • Solicitante</p>
                </div>
                <div>
                  <div className="border-t border-slate-400 w-48 mx-auto mb-1"></div>
                  <p className="font-bold text-slate-800">Direitoria / Gestão Comercial</p>
                  <p className="text-[10px] text-slate-500 uppercase">Jardim Vivência</p>
                </div>
              </div>

              <div className="text-center text-[10px] text-slate-400 border-t border-slate-100 pt-3">
                Relatório gerado via OTS Master CRM • Módulo de Inteligência Geográfica
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
