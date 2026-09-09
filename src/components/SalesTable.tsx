import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Unit, UnitGroup, UnitStatus, IncorporationType, UnitType } from '../types';
import { formatCurrency } from '../utils/simulatorEngine';
import { useNumericInput } from '../hooks/useNumericInput';
import {
  Search,
  Filter,
  Calculator,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Unlock,
  Lock,
  Building,
  CheckCircle2,
  Clock,
  Home,
  Layers,
  ArrowUpDown,
  Download,
  Info,
  MapPin,
  FileText,
  Plus,
  LayoutGrid,
  List,
  Check,
  FileUp,
  Car,
  BedDouble,
  Trash2,
  X,
} from 'lucide-react';

export const SalesTable: React.FC = () => {
  const [activeMainTab, setActiveMainTab] = useState<'espelho' | 'tabela_pdf' | 'implantacao'>('espelho');
  const {
    units,
    updateUnitStatus,
    addUnit,
    updateUnit,
    deleteUnit,
    currentUser,
    settings,
    updateSettings,
    toggleTabelaParaLideres,
    setSelectedUnitForSimulator,
    setActiveTab,
  } = useApp();

  // Escape key support to close any open modal
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedUnit(null);
        setIsPdfImportModalOpen(false);
        setIsManualAddModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleTabelaPdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      if (result) {
        updateSettings({ tabelaPdfUrl: result });
        alert('Tabela em PDF atualizada com sucesso!');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleImplantacaoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      if (result) {
        updateSettings({ implantacaoUrl: result });
        alert('Implantação (Masterplan) atualizada com sucesso!');
      }
    };
    reader.readAsDataURL(file);
  };

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('todos');
  const [selectedStatus, setSelectedStatus] = useState<string>('todos');
  const [sortField, setSortField] = useState<'quadra' | 'lote' | 'valorFinal' | 'areaLote'>('quadra');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [viewMode, setViewMode] = useState<'lista' | 'grade'>('lista');

  // Modals
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [newStatus, setNewStatus] = useState<UnitStatus>('disponivel');
  const [clientNameInput, setClientNameInput] = useState('');
  const [isPdfImportModalOpen, setIsPdfImportModalOpen] = useState(false);
  const [isManualAddModalOpen, setIsManualAddModalOpen] = useState(false);

  // PDF Import Raw Text State
  const [pdfRawText, setPdfRawText] = useState('');
  const [importSuccessMsg, setImportSuccessMsg] = useState('');

  // Manual Unit Form State
  const [formQuadra, setFormQuadra] = useState('Quadra 01');
  const [formLote, setFormLote] = useState('Lote 01');
  const [formRua, setFormRua] = useState('Rua Principal');
  const [formAreaTerreno, setFormAreaTerreno] = useState<number>(180);
  const [formAreaConstruida, setFormAreaConstruida] = useState<number>(58);
  const [formValor, setFormValor] = useState<number>(215000);
  const [formGrupo, setFormGrupo] = useState<UnitGroup>('Grupo B');
  const [formTipoUnidade, setFormTipoUnidade] = useState<UnitType>('padrao');
  const [formIncorporacao, setFormIncorporacao] = useState<IncorporationType>(settings.tipoEmpreendimento || 'horizontal');
  const [formDormitorios, setFormDormitorios] = useState<number>(2);
  const [formVagas, setFormVagas] = useState<number>(2);
  const [formBox, setFormBox] = useState<string>('');

  // Custom hooks for manual add form
  const hookAreaTerreno = useNumericInput({ initialValue: 180, onChange: setFormAreaTerreno, isCurrency: false });
  const hookAreaConstruida = useNumericInput({ initialValue: 58, onChange: setFormAreaConstruida, isCurrency: false });
  const hookFormValor = useNumericInput({ initialValue: 215000, onChange: setFormFormValor => setFormValor(setFormFormValor) });
  const hookDormitorios = useNumericInput({ initialValue: 2, onChange: setFormDormitorios, isCurrency: false });
  const hookVagas = useNumericInput({ initialValue: 2, onChange: setFormVagas, isCurrency: false });

  // Filtered and sorted units
  const filteredUnits = useMemo(() => {
    return units.filter((unit) => {
      const matchesSearch =
        unit.quadra.toLowerCase().includes(searchTerm.toLowerCase()) ||
        unit.lote.toLowerCase().includes(searchTerm.toLowerCase()) ||
        unit.rua.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (unit.clienteNome && unit.clienteNome.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesGroup = selectedGroup === 'todos' || unit.grupo === selectedGroup;
      const matchesStatus = selectedStatus === 'todos' || unit.status === selectedStatus;

      return matchesSearch && matchesGroup && matchesStatus;
    });
  }, [units, searchTerm, selectedGroup, selectedStatus]);

  const sortedUnits = useMemo(() => {
    return [...filteredUnits].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'quadra') {
        comparison = a.quadra.localeCompare(b.quadra, undefined, { numeric: true });
        if (comparison === 0) {
          comparison = a.lote.localeCompare(b.lote, undefined, { numeric: true });
        }
      } else if (sortField === 'lote') {
        comparison = a.lote.localeCompare(b.lote, undefined, { numeric: true });
      } else if (sortField === 'valorFinal') {
        comparison = a.valorFinal - b.valorFinal;
      } else if (sortField === 'areaLote') {
        comparison = (a.areaTerreno || a.areaLote || 0) - (b.areaTerreno || b.areaLote || 0);
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredUnits, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedUnits.length / itemsPerPage) || 1;
  const paginatedUnits = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedUnits.slice(start, start + itemsPerPage);
  }, [sortedUnits, currentPage, itemsPerPage]);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSimulateUnit = (unit: Unit) => {
    setSelectedUnitForSimulator(unit);
    setActiveTab('simulador');
  };

  const handleSaveUnitStatus = () => {
    if (selectedUnit) {
      updateUnitStatus(
        selectedUnit.id,
        newStatus,
        clientNameInput || undefined,
        currentUser.name
      );
      setSelectedUnit(null);
    }
  };

  const handleManualAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addUnit({
      quadra: formQuadra,
      lote: formLote,
      rua: formRua,
      areaTerreno: Number(formAreaTerreno),
      areaLote: Number(formAreaTerreno),
      areaConstruida: Number(formAreaConstruida),
      valorFinal: Number(formValor),
      grupo: formGrupo,
      status: 'disponivel',
      tipoUnidade: formTipoUnidade,
      tipoIncorporacao: formIncorporacao,
      dormitorios: Number(formDormitorios),
      vagas: Number(formVagas),
      box: formBox || undefined,
      valorAvaliacaoCef: Number(formValor) * 0.95,
    });
    setIsManualAddModalOpen(false);
    setImportSuccessMsg('Unidade cadastrada com sucesso!');
    setTimeout(() => setImportSuccessMsg(''), 3000);
  };

  const handleImportPdfText = () => {
    if (!pdfRawText.trim()) return;
    // Simple parser for lines pasted from PDF table: Quadra | Lote | Rua | Área | Valor
    const lines = pdfRawText.split('\n');
    let addedCount = 0;
    lines.forEach((line) => {
      const parts = line.split(/[\t,|;]+/).map((p) => p.trim());
      if (parts.length >= 4) {
        const quadra = parts[0] || 'Quadra Nova';
        const lote = parts[1] || `Lote ${addedCount + 1}`;
        const rua = parts[2] || 'Rua Principal';
        const area = parseFloat(parts[3].replace(/[^\d.,]/g, '').replace(',', '.')) || 180;
        const valor = parseFloat(parts[4]?.replace(/[^\d.,]/g, '').replace(',', '.')) || 215000;

        addUnit({
          quadra,
          lote,
          rua,
          areaTerreno: area,
          areaLote: area,
          areaConstruida: 58,
          valorFinal: valor,
          grupo: valor < 210000 ? 'Grupo A' : valor < 240000 ? 'Grupo B' : 'Grupo C',
          status: 'disponivel',
          tipoUnidade: 'padrao',
          tipoIncorporacao: settings.tipoEmpreendimento || 'horizontal',
          dormitorios: 2,
          vagas: 2,
          valorAvaliacaoCef: valor * 0.95,
        });
        addedCount++;
      }
    });

    setIsPdfImportModalOpen(false);
    setPdfRawText('');
    setImportSuccessMsg(`Importação concluída! ${addedCount} unidades adicionadas com sucesso.`);
    setTimeout(() => setImportSuccessMsg(''), 4000);
  };

  const exportCsv = () => {
    const headers = ['Quadra', 'Lote', 'Rua', 'Area Terreno (m2)', 'Area Constr (m2)', 'Tipo', 'Dorm', 'Vagas', 'Box', 'Valor Final (R$)', 'Grupo Faixa', 'Status', 'Cliente', 'Corretor'];
    const rows = sortedUnits.map((u) => [
      u.quadra,
      u.lote,
      `"${u.rua}"`,
      u.areaTerreno || u.areaLote,
      u.areaConstruida,
      u.tipoUnidade || 'padrao',
      u.dormitorios || 2,
      u.vagas || 2,
      `"${u.box || ''}"`,
      u.valorFinal,
      u.grupo,
      u.status,
      `"${u.clienteNome || ''}"`,
      `"${u.corretorNome || ''}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `tabela_vendas_${settings.nomeEmpreendimento.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: UnitStatus) => {
    switch (status) {
      case 'disponivel':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">Disponível</span>;
      case 'em_processo':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-300">Em Processo</span>;
      case 'reservado':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">Reservado</span>;
      case 'bloqueado':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-200 text-slate-800 border border-slate-300">Bloqueado</span>;
      case 'analise':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">Análise CEF</span>;
      case 'vendido':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-300">Vendido</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  const getGroupBadge = (grupo: UnitGroup) => {
    switch (grupo) {
      case 'Grupo A':
        return <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">Grupo A</span>;
      case 'Grupo B':
        return <span className="px-2 py-0.5 rounded text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200">Grupo B</span>;
      case 'Grupo C':
        return <span className="px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">Grupo C</span>;
    }
  };

  // Group summary metrics
  const totalAvailable = units.filter((u) => u.status === 'disponivel').length;
  const totalReserved = units.filter((u) => u.status === 'reservado' || u.status === 'em_processo').length;
  const totalSold = units.filter((u) => u.status === 'vendido').length;

  // Access Control
  if (currentUser.role !== 'admin' && !settings.liberarTabelaParaLideres) {
    return (
      <div className="p-4 lg:p-12 max-w-3xl mx-auto text-center space-y-6">
        <div className="bg-white dark:bg-slate-900 p-8 sm:p-12 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 mx-auto flex items-center justify-center">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Acesso Restrito: Tabela de Vendas</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
              Por padrão, a tabela de vendas do empreendimento <strong>{settings.nomeEmpreendimento}</strong> fica visível somente para o Administrador, que pode liberar o acesso aos líderes.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('dashboard')}
            className="px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white text-xs font-semibold"
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner & Actions */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Building className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Espelho de Vendas — {settings.nomeEmpreendimento}
            </h1>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            {units.length} unidades cadastradas • {totalAvailable} disponíveis • {totalReserved} reservas/processo • {totalSold} vendidas
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {currentUser.role === 'admin' && (
            <>
              <button
                onClick={() => setIsPdfImportModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs"
              >
                <FileUp className="w-4 h-4" />
                <span>Copiar Tabela do PDF</span>
              </button>
              <button
                onClick={() => setIsManualAddModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Nova Unidade</span>
              </button>
            </>
          )}

          <button
            onClick={exportCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold"
          >
            <Download className="w-4 h-4" />
            <span>Exportar CSV</span>
          </button>

          {currentUser.role === 'admin' && (
            <button
              onClick={toggleTabelaParaLideres}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                settings.liberarTabelaParaLideres
                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
              }`}
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>{settings.liberarTabelaParaLideres ? 'Liberado para Líderes' : 'Bloqueado para Líderes'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub-Tabs: Espelho de Vendas | Tabela em PDF | Implantação */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2">
        <button
          onClick={() => setActiveMainTab('espelho')}
          className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
            activeMainTab === 'espelho'
              ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Espelho de Vendas</span>
        </button>

        <button
          onClick={() => setActiveMainTab('tabela_pdf')}
          className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
            activeMainTab === 'tabela_pdf'
              ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Tabela em PDF</span>
          {settings.tabelaPdfUrl && (
            <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] px-1.5 py-0.2 rounded-full">
              Ativo
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveMainTab('implantacao')}
          className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
            activeMainTab === 'implantacao'
              ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Implantação (Masterplan)</span>
          {settings.implantacaoUrl && (
            <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] px-1.5 py-0.2 rounded-full">
              Ativo
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: ESPELHO DE VENDAS */}
      {activeMainTab === 'espelho' && (
        <div className="space-y-6">
          {importSuccessMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{importSuccessMsg}</span>
            </div>
          )}

      {/* Filter & View Switcher Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por Quadra, Lote, Rua ou Cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
          >
            <option value="todos">Todos os Grupos</option>
            <option value="Grupo A">Grupo A (Faixa 1)</option>
            <option value="Grupo B">Grupo B (Faixa 2)</option>
            <option value="Grupo C">Grupo C (Faixa 3)</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
          >
            <option value="todos">Todos os Status</option>
            <option value="disponivel">Disponível</option>
            <option value="em_processo">Em Processo</option>
            <option value="reservado">Reservado</option>
            <option value="bloqueado">Bloqueado</option>
            <option value="analise">Análise CEF</option>
            <option value="vendido">Vendido</option>
          </select>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('lista')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'lista'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Lista</span>
            </button>
            <button
              onClick={() => setViewMode('grade')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'grade'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Grade (Cards)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content View: Lista vs Grade */}
      {viewMode === 'lista' ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                  <th className="p-3.5 cursor-pointer hover:text-emerald-600" onClick={() => handleSort('quadra')}>
                    <div className="flex items-center gap-1">
                      <span>Quadra / Unidade</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="p-3.5">Logradouro / Rua</th>
                  <th className="p-3.5 cursor-pointer hover:text-emerald-600" onClick={() => handleSort('areaLote')}>
                    <div className="flex items-center gap-1">
                      <span>Área (m²)</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="p-3.5">Tipologia & Vagas</th>
                  <th className="p-3.5 cursor-pointer hover:text-emerald-600" onClick={() => handleSort('valorFinal')}>
                    <div className="flex items-center gap-1">
                      <span>Valor Tabela</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="p-3.5">Faixa Renda</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Cliente / Corretor</th>
                  <th className="p-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedUnits.map((unit) => (
                  <tr key={unit.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                      <div>{unit.quadra}</div>
                      <div className="text-[11px] font-normal text-slate-500">{unit.lote}</div>
                    </td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-300">{unit.rua}</td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-300">
                      <div>{unit.areaTerreno || unit.areaLote} m² (Terr)</div>
                      <div className="text-[10px] text-slate-400">{unit.areaConstruida} m² (Constr)</div>
                    </td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-300">
                      <div className="capitalize">{unit.tipoUnidade || 'Padrão'} {unit.tipoIncorporacao === 'vertical' ? '(Vertical)' : ''}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1">
                        <span>{unit.dormitorios || 2}q</span> • <span>{unit.vagas || 2}v</span>
                        {unit.box && ` • ${unit.box}`}
                      </div>
                    </td>
                    <td className="p-3.5 font-bold text-emerald-700 dark:text-emerald-400">
                      {formatCurrency(unit.valorFinal)}
                    </td>
                    <td className="p-3.5">{getGroupBadge(unit.grupo)}</td>
                    <td className="p-3.5">{getStatusBadge(unit.status)}</td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-300">
                      {unit.clienteNome ? (
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">{unit.clienteNome}</div>
                          <div className="text-[10px] text-slate-400">Corretor: {unit.corretorNome || 'N/A'}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Disponível</span>
                      )}
                    </td>
                    <td className="p-3.5 text-right space-x-1">
                      <button
                        onClick={() => handleSimulateUnit(unit)}
                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold inline-flex items-center gap-1 shadow-xs"
                        title="Simular Financiamento CEF"
                      >
                        <Calculator className="w-3.5 h-3.5" />
                        <span>Simular</span>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedUnit(unit);
                          setNewStatus(unit.status);
                          setClientNameInput(unit.clienteNome || '');
                        }}
                        className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium"
                      >
                        Status
                      </button>
                      {currentUser.role === 'admin' && (
                        <button
                          onClick={() => {
                            if (confirm(`Deseja realmente excluir a unidade ${unit.quadra} - ${unit.lote}?`)) {
                              deleteUnit(unit.id);
                            }
                          }}
                          className="px-2 py-1.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 hover:bg-rose-100 rounded-lg font-medium inline-flex items-center gap-1 transition-colors"
                          title="Excluir Unidade (Apenas Admin)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-40"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Anterior</span>
            </button>
            <div className="text-xs text-slate-600 dark:text-slate-400">
              Página <span className="font-bold text-slate-900 dark:text-white">{currentPage}</span> de <span className="font-bold text-slate-900 dark:text-white">{totalPages}</span>
            </div>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-40"
            >
              <span>Próxima</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        /* Grid View (Cards de Lotes/Unidades) */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {paginatedUnits.map((unit) => {
            const isAvail = unit.status === 'disponivel';
            return (
              <div
                key={unit.id}
                className={`p-4 rounded-2xl border transition-all space-y-3 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md ${
                  isAvail ? 'border-emerald-200 dark:border-emerald-900/50' : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{unit.quadra} — {unit.lote}</h3>
                    <p className="text-[11px] text-slate-500 truncate max-w-[180px]">{unit.rua}</p>
                  </div>
                  {getStatusBadge(unit.status)}
                </div>

                <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between">
                    <span>Área Terreno:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{unit.areaTerreno || unit.areaLote} m²</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Área Construída:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{unit.areaConstruida} m²</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Valor de Tabela:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(unit.valorFinal)}</span>
                  </div>
                  {unit.clienteNome && (
                    <div className="pt-1 text-[11px] text-indigo-600 dark:text-indigo-400 font-medium truncate">
                      Cliente: {unit.clienteNome}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => handleSimulateUnit(unit)}
                    className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold text-center shadow-xs"
                  >
                    Simular
                  </button>
                  <button
                    onClick={() => {
                      setSelectedUnit(unit);
                      setNewStatus(unit.status);
                      setClientNameInput(unit.clienteNome || '');
                    }}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-medium"
                  >
                    Status
                  </button>
                  {currentUser.role === 'admin' && (
                    <button
                      onClick={() => {
                        if (confirm(`Deseja realmente excluir a unidade ${unit.quadra} - ${unit.lote}?`)) {
                          deleteUnit(unit.id);
                        }
                      }}
                      className="p-1.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 hover:bg-rose-100 rounded-xl transition-colors"
                      title="Excluir Unidade (Apenas Admin)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
        </div>
      )}

      {/* TAB 2: TABELA EM PDF */}
      {activeMainTab === 'tabela_pdf' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                <span>Gerenciador da Tabela Oficial em PDF</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Substitua ou visualize o documento oficial da tabela de preços e lotes em PDF a qualquer momento.
              </p>
            </div>

            {currentUser.role === 'admin' && (
              <label className="cursor-pointer px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors">
                <FileUp className="w-4 h-4" />
                <span>Substituir Arquivo PDF</span>
                <input type="file" accept="application/pdf" onChange={handleTabelaPdfUpload} className="hidden" />
              </label>
            )}
          </div>

          {settings.tabelaPdfUrl ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">📄 Tabela Oficial Carregada no Sistema</span>
                <a
                  href={settings.tabelaPdfUrl}
                  download="tabela_vendas_oficial.pdf"
                  className="px-3 py-1.5 bg-slate-900 dark:bg-slate-700 text-white rounded-lg font-semibold hover:bg-slate-800 transition-colors"
                >
                  Baixar PDF
                </a>
              </div>
              <iframe
                src={settings.tabelaPdfUrl}
                className="w-full h-[650px] rounded-2xl border border-slate-300 dark:border-slate-700 shadow-inner bg-white"
                title="Tabela de Vendas em PDF"
              />
            </div>
          ) : (
            <div className="text-center py-16 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 space-y-3">
              <FileText className="w-12 h-12 text-slate-400 mx-auto" />
              <div className="space-y-1">
                <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">Nenhuma tabela em PDF enviada ainda</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {currentUser.role === 'admin' ? 'Clique no botão acima para enviar o arquivo PDF oficial da tabela.' : 'Aguardando o Administrador carregar a tabela em PDF.'}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: IMPLANTAÇÃO (MASTERPLAN) */}
      {activeMainTab === 'implantacao' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-600" />
                <span>Implantação / Masterplan do Empreendimento</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Visualize e envie a planta de implantação em PDF ou imagem (JPG/PNG) para consulta rápida no plantão.
              </p>
            </div>

            {currentUser.role === 'admin' && (
              <label className="cursor-pointer px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors">
                <FileUp className="w-4 h-4" />
                <span>Enviar Nova Implantação</span>
                <input type="file" accept="application/pdf,image/*" onChange={handleImplantacaoUpload} className="hidden" />
              </label>
            )}
          </div>

          {settings.implantacaoUrl ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">🗺️ Planta de Implantação Disponível</span>
                <a
                  href={settings.implantacaoUrl}
                  download="implantacao_masterplan"
                  className="px-3 py-1.5 bg-slate-900 dark:bg-slate-700 text-white rounded-lg font-semibold hover:bg-slate-800 transition-colors"
                >
                  Baixar Arquivo
                </a>
              </div>
              {settings.implantacaoUrl.startsWith('data:image') ? (
                <div className="p-4 bg-slate-900 rounded-2xl flex items-center justify-center overflow-auto max-h-[700px]">
                  <img src={settings.implantacaoUrl} alt="Implantação Masterplan" className="max-w-full rounded-xl shadow-lg object-contain" />
                </div>
              ) : (
                <iframe
                  src={settings.implantacaoUrl}
                  className="w-full h-[650px] rounded-2xl border border-slate-300 dark:border-slate-700 shadow-inner bg-white"
                  title="Implantação em PDF"
                />
              )}
            </div>
          ) : (
            <div className="text-center py-16 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 space-y-3">
              <MapPin className="w-12 h-12 text-slate-400 mx-auto" />
              <div className="space-y-1">
                <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">Nenhuma implantação cadastrada ainda</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {currentUser.role === 'admin' ? 'Clique no botão acima para carregar a planta em PDF ou imagem.' : 'Aguardando o Administrador carregar a planta de implantação.'}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PDF Import Modal */}
      {isPdfImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[92vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900 z-10">
              <div className="min-w-0">
                <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">Copiar / Importar Tabela do PDF</h3>
                <p className="text-xs text-slate-500 truncate">Cole abaixo as linhas copiadas do PDF ou tabela de preços</p>
              </div>
              <button
                type="button"
                onClick={() => setIsPdfImportModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0"
                title="Fechar (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              <textarea
                rows={7}
                value={pdfRawText}
                onChange={(e) => setPdfRawText(e.target.value)}
                placeholder="Exemplo de formato por linha:\nQuadra 01 | Lote 15 | Rua das Flores | 180.00 | 215000\nQuadra 01 | Lote 16 | Rua das Flores | 180.00 | 215000"
                className="w-full p-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50 dark:bg-slate-900/90 z-10">
              <button
                type="button"
                onClick={() => setIsPdfImportModalOpen(false)}
                className="px-4 py-2 text-xs rounded-xl font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleImportPdfText}
                className="px-4 py-2 text-xs rounded-xl font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
              >
                Processar e Adicionar Unidades
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Unit Add Modal */}
      {isManualAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[92vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900 z-10">
              <div className="min-w-0">
                <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">Cadastrar Nova Unidade Manualmente</h3>
                <p className="text-xs text-slate-500 truncate">Informe os dados da unidade do empreendimento {settings.nomeEmpreendimento}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsManualAddModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0"
                title="Fechar (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleManualAddSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-medium text-slate-700 dark:text-slate-300">Quadra / Torre:</label>
                    <input
                      type="text"
                      value={formQuadra}
                      onChange={(e) => setFormQuadra(e.target.value)}
                      required
                      className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="font-medium text-slate-700 dark:text-slate-300">Lote / Apto:</label>
                    <input
                      type="text"
                      value={formLote}
                      onChange={(e) => setFormLote(e.target.value)}
                      required
                      className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-medium text-slate-700 dark:text-slate-300">Logradouro / Rua:</label>
                  <input
                    type="text"
                    value={formRua}
                    onChange={(e) => setFormRua(e.target.value)}
                    required
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-medium text-slate-700 dark:text-slate-300">Área do Terreno (m²):</label>
                    <input
                      type="text"
                      value={hookAreaTerreno.displayValue}
                      onChange={hookAreaTerreno.onChange}
                      required
                      placeholder="0"
                      className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="font-medium text-slate-700 dark:text-slate-300">Área Construída (m²):</label>
                    <input
                      type="text"
                      value={hookAreaConstruida.displayValue}
                      onChange={hookAreaConstruida.onChange}
                      required
                      placeholder="0"
                      className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="font-medium text-slate-700 dark:text-slate-300">Tipo de Unidade:</label>
                    <select
                      value={formTipoUnidade}
                      onChange={(e) => setFormTipoUnidade(e.target.value as UnitType)}
                      className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="padrao">Padrão</option>
                      <option value="esquina">Esquina</option>
                      <option value="meio_quadra">Meio de Quadra</option>
                      <option value="cobertura">Cobertura</option>
                      <option value="garden">Garden</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-medium text-slate-700 dark:text-slate-300">Dormitórios:</label>
                    <input
                      type="text"
                      value={hookDormitorios.displayValue}
                      onChange={hookDormitorios.onChange}
                      placeholder="0"
                      className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="font-medium text-slate-700 dark:text-slate-300">Vagas:</label>
                    <input
                      type="text"
                      value={hookVagas.displayValue}
                      onChange={hookVagas.onChange}
                      placeholder="0"
                      className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-medium text-slate-700 dark:text-slate-300">Box / Depósito (Opcional):</label>
                    <input
                      type="text"
                      value={formBox}
                      onChange={(e) => setFormBox(e.target.value)}
                      placeholder="Ex: Box B-12"
                      className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="font-medium text-slate-700 dark:text-slate-300">Faixa de Renda (Grupo):</label>
                    <select
                      value={formGrupo}
                      onChange={(e) => setFormGrupo(e.target.value as UnitGroup)}
                      className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="Grupo A">Grupo A</option>
                      <option value="Grupo B">Grupo B</option>
                      <option value="Grupo C">Grupo C</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-medium text-slate-700 dark:text-slate-300">Valor de Tabela Final:</label>
                  <input
                    type="text"
                    value={hookFormValor.displayValue}
                    onChange={hookFormValor.onChange}
                    required
                    placeholder="R$ 0,00"
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-emerald-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50 dark:bg-slate-900/90 z-10">
                <button
                  type="button"
                  onClick={() => setIsManualAddModalOpen(false)}
                  className="px-4 py-2 text-xs rounded-xl font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs rounded-xl font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
                >
                  Cadastrar Unidade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Unit Status / Reservation Modal */}
      {selectedUnit && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[92vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900 z-10">
              <div className="min-w-0">
                <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                  Gerenciar {selectedUnit.quadra} - {selectedUnit.lote}
                </h3>
                <p className="text-xs text-slate-500 truncate">{selectedUnit.rua} • {selectedUnit.areaTerreno || selectedUnit.areaLote}m²</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUnit(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0"
                title="Fechar (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Status da Unidade:</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as UnitStatus)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="disponivel">Disponível</option>
                  <option value="em_processo">Em Processo (Proposta)</option>
                  <option value="reservado">Reservado</option>
                  <option value="bloqueado">Bloqueado</option>
                  <option value="analise">Em Análise Caixa (CEF)</option>
                  <option value="vendido">Vendido / Contrato Fechado</option>
                </select>
              </div>

              {newStatus !== 'disponivel' && (
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Nome do Cliente Vinculado:</label>
                  <input
                    type="text"
                    placeholder="Nome completo do proponente"
                    value={clientNameInput}
                    onChange={(e) => setClientNameInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              )}

              <div className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-xl space-y-1 text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-700">
                <div className="flex justify-between">
                  <span>Valor de Tabela:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{formatCurrency(selectedUnit.valorFinal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Grupo / Faixa:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{selectedUnit.grupo}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50 dark:bg-slate-900/90 z-10">
              <button
                type="button"
                onClick={() => setSelectedUnit(null)}
                className="px-4 py-2 text-xs rounded-xl font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveUnitStatus}
                className="px-4 py-2 text-xs rounded-xl font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
              >
                Salvar Status
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
