import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Unit, UnitStatus } from '../types';
import {
  Plus,
  Upload,
  Search,
  X,
  Check,
  Building,
  Calculator,
  BookmarkPlus,
  Clock,
  FileCheck,
  ArrowRight,
  Trash2,
  Edit3,
  AlertTriangle,
  User,
  ShieldAlert,
  Sparkles,
  ExternalLink,
  CheckCircle,
} from 'lucide-react';

export const EspelhoVendas: React.FC = () => {
  const {
    units,
    addUnit,
    updateUnit,
    deleteUnit,
    setSelectedUnitForSimulator,
    setActiveTab,
    leads,
    reserveUnitForLead,
    transformReservationToPreSale,
    setSelectedLeadForModal,
    currentUser,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQuadra, setSelectedQuadra] = useState<string>('Todas');

  // Selected unit for detail view action sheet
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);

  // Real-time reservation countdown ticker
  const [ticker, setTicker] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (selectedUnit && selectedUnit.status === 'reservado') {
      interval = setInterval(() => {
        setTicker((t) => t + 1);
      }, 1000);
    } else {
      setTicker(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [selectedUnit]);

  // Sub-flow state for Reservation
  const [isReserving, setIsReserving] = useState(false);
  const [selectedLeadIdForRes, setSelectedLeadIdForRes] = useState('');
  const [reservationNotes, setReservationNotes] = useState('');

  // Edit/Add unit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);

  const [formData, setFormData] = useState<Partial<Unit>>({
    quadra: '',
    lote: '',
    status: 'disponivel',
    valorFinal: 0,
    areaConstruida: 0,
    areaTerreno: 0,
    grupo: 'Grupo A',
    tipoIncorporacao: 'vertical',
  });

  const getStatusColor = (status: UnitStatus) => {
    switch (status) {
      case 'disponivel':
        return 'bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600';
      case 'reservado':
        return 'bg-amber-400 text-amber-950 border-amber-500 hover:bg-amber-500 font-bold';
      case 'em_processo':
      case 'analise':
        return 'bg-orange-500 text-white border-orange-600 hover:bg-orange-600';
      case 'vendido':
        return 'bg-rose-500 text-white border-rose-600 hover:bg-rose-600 opacity-90';
      case 'bloqueado':
        return 'bg-slate-400 text-slate-900 border-slate-500 hover:bg-slate-500';
      default:
        return 'bg-slate-200 text-slate-800 border-slate-300';
    }
  };

  const quadras = useMemo(() => {
    const q = new Set<string>();
    units.forEach((u) => {
      if (u.quadra) q.add(u.quadra);
    });
    return Array.from(q).sort();
  }, [units]);

  const filteredUnits = useMemo(() => {
    return units.filter((u) => {
      const matchSearch = (u.quadra + ' ' + u.lote + ' ' + (u.identificacao || '')).toLowerCase().includes(searchTerm.toLowerCase());
      const matchQuadra = selectedQuadra === 'Todas' || u.quadra === selectedQuadra;
      return matchSearch && matchQuadra;
    });
  }, [units, searchTerm, selectedQuadra]);

  const groupedUnits = useMemo(() => {
    const groups: { [key: string]: Unit[] } = {};
    filteredUnits.forEach((unit) => {
      const q = unit.quadra || 'Geral';
      if (!groups[q]) groups[q] = [];
      groups[q].push(unit);
    });
    return groups;
  }, [filteredUnits]);

  // Open Edit Form Modal
  const openAddModal = () => {
    setEditingUnit(null);
    setFormData({
      quadra: 'Quadra 01',
      lote: 'Lote 01',
      status: 'disponivel',
      valorFinal: 250000,
      areaConstruida: 52,
      areaTerreno: 120,
      grupo: 'Grupo A',
      tipoIncorporacao: 'horizontal',
      dormitorios: 2,
      vagas: 1,
    });
    setIsEditModalOpen(true);
  };

  const openEditModalForUnit = (unit: Unit) => {
    setEditingUnit(unit);
    setFormData({ ...unit });
    setIsEditModalOpen(true);
  };

  const handleSaveUnitForm = () => {
    if (!formData.quadra || !formData.lote) {
      alert('Quadra e Lote são obrigatórios.');
      return;
    }

    if (editingUnit) {
      updateUnit(editingUnit.id, formData);
    } else {
      addUnit(formData as Omit<Unit, 'id'>);
    }

    setIsEditModalOpen(false);
    setSelectedUnit(null);
  };

  const handleDeleteUnit = () => {
    if (editingUnit && confirm(`Tem certeza que deseja excluir a unidade ${editingUnit.quadra} ${editingUnit.lote}?`)) {
      deleteUnit(editingUnit.id);
      setIsEditModalOpen(false);
      setSelectedUnit(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const lines = content.split('\n');

      let addedCount = 0;
      lines.slice(1).forEach((line) => {
        const parts = line.split(',');
        if (parts.length >= 4) {
          const quadra = parts[0]?.trim();
          const lote = parts[1]?.trim();
          const statusRaw = parts[2]?.trim().toLowerCase();
          const valorFinal = parseFloat(parts[3]?.trim()) || 250000;

          let status: UnitStatus = 'disponivel';
          if (statusRaw?.includes('reser')) status = 'reservado';
          else if (statusRaw?.includes('proc')) status = 'em_processo';
          else if (statusRaw?.includes('vend')) status = 'vendido';
          else if (statusRaw?.includes('bloq')) status = 'bloqueado';

          if (quadra && lote) {
            addUnit({
              quadra,
              lote,
              rua: '',
              identificacao: `${quadra} ${lote}`,
              status,
              valorFinal,
              areaTerreno: 120,
              areaConstruida: 52,
              grupo: 'Grupo A',
              valorAvaliacaoCef: valorFinal,
              tipoIncorporacao: 'horizontal',
            });
            addedCount++;
          }
        }
      });

      alert(`Sucesso! ${addedCount} unidades importadas via arquivo CSV.`);
    };

    reader.readAsText(file);
  };

  // 72h Timer calculation helper
  const calculateTimer = (dataExpiracao?: string) => {
    if (!dataExpiracao) return { expired: false, label: '72 horas' };
    const diffMs = new Date(dataExpiracao).getTime() - Date.now();
    if (diffMs <= 0) {
      return { expired: true, label: 'Expirado (72h passadas)' };
    }
    const hoursLeft = Math.floor(diffMs / (1000 * 60 * 60));
    const minsLeft = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return { expired: false, label: `${hoursLeft}h ${minsLeft}m restantes` };
  };

  // High precision countdown with seconds and depletion percentage for premium visualization
  const calculateTimerWithSeconds = (dataExpiracao?: string) => {
    if (!dataExpiracao) {
      return { expired: false, label: '72 horas', hours: 72, minutes: 0, seconds: 0, percentage: 100 };
    }
    const expTime = new Date(dataExpiracao).getTime();
    const nowTime = Date.now();
    const diffMs = expTime - nowTime;
    
    if (diffMs <= 0) {
      return { expired: true, label: 'Expirado', hours: 0, minutes: 0, seconds: 0, percentage: 0 };
    }
    
    const totalSecs = Math.floor(diffMs / 1000);
    const hoursLeft = Math.floor(totalSecs / 3600);
    const minsLeft = Math.floor((totalSecs % 3600) / 60);
    const secsLeft = totalSecs % 60;
    
    // Total reservation window is 72h
    const totalWindowMs = 72 * 60 * 60 * 1000;
    const percentage = Math.min(100, Math.max(0, (diffMs / totalWindowMs) * 100));
    
    const label = `${hoursLeft}h ${minsLeft}m ${secsLeft}s restantes`;
    return { expired: false, label, hours: hoursLeft, minutes: minsLeft, seconds: secsLeft, percentage };
  };

  // Submit Reservation
  const handleConfirmReservation = () => {
    if (!selectedUnit) return;
    if (!selectedLeadIdForRes) {
      alert('Selecione um cliente para vincular a esta reserva.');
      return;
    }

    const lead = leads.find((l) => l.id === selectedLeadIdForRes);
    if (!lead) return;

    reserveUnitForLead(selectedUnit.id, lead.id, lead.nome);

    alert(`Sucesso! Unidade ${selectedUnit.quadra} ${selectedUnit.lote} reservada por 72 horas para ${lead.nome}.`);
    setIsReserving(false);
    setSelectedUnit(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-xl">
              <Building className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">Espelho de Vendas</h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Acompanhe a disponibilidade, simule no CEF e efetue reservas diretas com controle de 72h para o comprovante do ato.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <label className="cursor-pointer flex items-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors">
            <Upload className="w-4 h-4 text-emerald-600" />
            <span>Importar CSV</span>
            <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
          </label>

          {currentUser.role === 'admin' && (
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Unidade</span>
            </button>
          )}
        </div>
      </div>

      {/* Toolbar / Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col md:flex-row gap-4 justify-between items-center shadow-xs">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none md:min-w-[260px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar unidade, quadra, lote..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white"
            />
          </div>

          <select
            value={selectedQuadra}
            onChange={(e) => setSelectedQuadra(e.target.value)}
            className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white"
          >
            <option value="Todas">Todas as Quadras / Blocos</option>
            {quadras.map((q) => (
              <option key={q} value={q}>
                {q}
              </option>
            ))}
          </select>
        </div>

        {/* Status Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-medium">
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
            <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
            <span>Disponível</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
            <span className="w-3 h-3 rounded-full bg-amber-400"></span>
            <span>Reservada (72h)</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
            <span className="w-3 h-3 rounded-full bg-orange-500"></span>
            <span>Pré-Venda</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
            <span className="w-3 h-3 rounded-full bg-rose-500"></span>
            <span>Vendida</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
            <span className="w-3 h-3 rounded-full bg-slate-400"></span>
            <span>Bloqueada</span>
          </div>
        </div>
      </div>

      {/* Grid Display grouped by Quadra */}
      <div className="space-y-6">
        {Object.entries(groupedUnits).map(([quadra, unitsInQuadra]) => (
          <div
            key={quadra}
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs"
          >
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <span>Bloco / Quadra: {quadra}</span>
                <span className="text-xs font-normal text-slate-400">({unitsInQuadra.length} unidades)</span>
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
              {unitsInQuadra.map((unit) => {
                const timer = unit.status === 'reservado' ? calculateTimer(unit.dataExpiracaoReserva) : null;

                return (
                  <button
                    key={unit.id}
                    onClick={() => setSelectedUnit(unit)}
                    className={`
                      relative p-3 rounded-2xl border flex flex-col items-center justify-center text-center transition-all shadow-xs active:scale-95 cursor-pointer
                      ${getStatusColor(unit.status)}
                    `}
                  >
                    <span className="font-bold text-base leading-none mb-1">{unit.lote}</span>

                    <span className="text-[10px] uppercase font-bold tracking-wider opacity-90">
                      {unit.status.replace('_', ' ')}
                    </span>

                    {timer && (
                      <span className="mt-1 text-[9px] bg-black/20 text-white px-1.5 py-0.5 rounded-md font-semibold">
                        ⏱️ {timer.label}
                      </span>
                    )}

                    <span className="text-[11px] font-semibold mt-1.5 opacity-95">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(unit.valorFinal)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {filteredUnits.length === 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-500">
            Nenhuma unidade encontrada para os filtros selecionados.
          </div>
        )}
      </div>

      {/* Interactive Unit Detail & Action Sheet Modal */}
      {selectedUnit && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 relative">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${getStatusColor(selectedUnit.status)}`}>
                    {selectedUnit.status.replace('_', ' ')}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Unidade {selectedUnit.quadra} - {selectedUnit.lote}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Valor de Tabela: <strong className="text-emerald-600 dark:text-emerald-400">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedUnit.valorFinal)}</strong>
                </p>
              </div>

              <button
                onClick={() => {
                  setSelectedUnit(null);
                  setIsReserving(false);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Spec Cards */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-700">
                <p className="text-[10px] text-slate-400 font-medium uppercase">Área Privativa</p>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{selectedUnit.areaConstruida || 52} m²</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-700">
                <p className="text-[10px] text-slate-400 font-medium uppercase">Dormitórios</p>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{selectedUnit.dormitorios || 2} Quartos</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-700">
                <p className="text-[10px] text-slate-400 font-medium uppercase">Vagas</p>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{selectedUnit.vagas || 1} Vaga</p>
              </div>
            </div>

            {/* COMPONENTE: STATUS DE RESERVA & PROGRESSO */}
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 rounded-2xl p-4.5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${selectedUnit.status === 'disponivel' ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                    <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${selectedUnit.status === 'disponivel' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                  </span>
                  Status da Reserva
                </span>
                
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${selectedUnit.status === 'disponivel' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400'}`}>
                  {selectedUnit.status === 'disponivel' ? 'Unidade Disponível' : 'Reserva Ativa'}
                </span>
              </div>

              {/* Progress Stepper bar */}
              <div className="space-y-2">
                <div className="grid grid-cols-4 gap-2 h-2">
                  <div className="h-full rounded-full bg-emerald-500 transition-all duration-300" />
                  <div className={`h-full rounded-full transition-all duration-300 ${selectedUnit.status === 'reservado' || selectedUnit.status !== 'disponivel' ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
                  <div className={`h-full rounded-full transition-all duration-300 ${selectedUnit.status === 'em_processo' || selectedUnit.status === 'analise' || selectedUnit.status === 'vendido' ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
                  <div className={`h-full rounded-full transition-all duration-300 ${selectedUnit.status === 'vendido' ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
                </div>
                <div className="grid grid-cols-4 text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-tight text-center">
                  <span className={selectedUnit.status === 'disponivel' ? 'text-emerald-600 dark:text-emerald-400 font-black' : 'text-emerald-600'}>1. Livre</span>
                  <span className={selectedUnit.status === 'reservado' ? 'text-amber-600 dark:text-amber-400 font-black animate-pulse' : selectedUnit.status !== 'disponivel' ? 'text-emerald-600' : 'text-slate-400'}>2. Reservada</span>
                  <span className={selectedUnit.status === 'em_processo' || selectedUnit.status === 'analise' ? 'text-emerald-600 font-black' : 'text-slate-400'}>3. Simulação</span>
                  <span className={selectedUnit.status === 'vendido' ? 'text-emerald-600 font-black' : 'text-slate-400'}>4. Contrato</span>
                </div>
              </div>

              {/* Timer e Informações do Lead para Reserva Ativa */}
              {selectedUnit.status === 'reservado' && (() => {
                const timerData = calculateTimerWithSeconds(selectedUnit.dataExpiracaoReserva);
                return (
                  <div className="bg-amber-50/55 dark:bg-amber-950/25 border border-amber-200/60 dark:border-amber-900/60 rounded-xl p-3.5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-amber-950 dark:text-amber-300 font-bold text-xs">
                        <Clock className="w-4 h-4 text-amber-500 animate-pulse" />
                        <span>Expiração do Lead (72h):</span>
                      </div>
                      <span className={`font-mono text-[11px] font-black tracking-wider px-2 py-0.5 rounded-lg ${timerData.hours < 12 ? 'bg-rose-100 text-rose-700 animate-pulse dark:bg-rose-950/60 dark:text-rose-400' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'}`}>
                        {timerData.expired ? 'Expirado' : `${String(timerData.hours).padStart(2, '0')}:${String(timerData.minutes).padStart(2, '0')}:${String(timerData.seconds).padStart(2, '0')}`}
                      </span>
                    </div>

                    {/* Progress representation of remaining time */}
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ${timerData.hours < 12 ? 'bg-rose-500' : 'bg-amber-500'}`}
                        style={{ width: `${timerData.percentage}%` }}
                      />
                    </div>

                    <div className="text-xs space-y-1 text-slate-600 dark:text-slate-400 pt-1.5 border-t border-amber-200/50 dark:border-amber-900/40">
                      <p className="flex justify-between">
                        <span>Cliente / Lead:</span>
                        <strong className="text-slate-800 dark:text-slate-200">{selectedUnit.reservaLeadNome || selectedUnit.clienteNome || 'Cliente não informado'}</strong>
                      </p>
                      <p className="flex justify-between">
                        <span>Corretor responsável:</span>
                        <strong className="text-slate-800 dark:text-slate-200">{selectedUnit.reservadoPorCorretorNome || selectedUnit.corretorNome || 'Corretor'}</strong>
                      </p>
                    </div>

                    <div className="pt-2 border-t border-amber-200/50 dark:border-amber-900/40 flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-500">Comprovante do Ato:</span>
                      {selectedUnit.comprovanteAtoAnexado ? (
                        <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 px-2 py-0.5 rounded-md flex items-center gap-1 font-bold">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Anexado
                        </span>
                      ) : (
                        <span className="bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 px-2 py-0.5 rounded-md flex items-center gap-1 font-bold">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-500 animate-pulse" /> Pendente de Envio
                        </span>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Botão Principal de Iniciar Reserva */}
              {(selectedUnit.status === 'disponivel' || selectedUnit.status === 'reservado') && (
                <button
                  onClick={() => {
                    setSelectedUnitForSimulator(selectedUnit);
                    setActiveTab('simulador');
                  }}
                  className="w-full flex items-center justify-between p-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md transition-all active:scale-98 cursor-pointer ring-2 ring-emerald-400/20"
                >
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4.5 h-4.5" />
                    <span>Iniciar Reserva (Simulação, Proposta & Contrato)</span>
                  </div>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {/* Gatilho para Reserva Rápida se estiver disponível */}
              {selectedUnit.status === 'disponivel' && !isReserving && (
                <button
                  onClick={() => setIsReserving(true)}
                  className="w-full flex items-center justify-between p-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-650 text-slate-800 dark:text-slate-100 rounded-xl text-xs font-bold transition-all active:scale-98"
                >
                  <div className="flex items-center gap-2">
                    <BookmarkPlus className="w-4 h-4 text-emerald-600" />
                    <span>Reserva Rápida (Bloqueio Temporário 72h)</span>
                  </div>
                  <Clock className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quick Reservation Sub-flow Form */}
            {isReserving && selectedUnit.status === 'disponivel' && (
              <div className="bg-emerald-50 dark:bg-emerald-950/45 border border-emerald-300 dark:border-emerald-800 rounded-2xl p-4 space-y-3 animate-in fade-in">
                <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                  <BookmarkPlus className="w-4 h-4 text-emerald-600" />
                  <span>Selecione o Cliente para Efetuar a Reserva</span>
                </h4>

                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block">
                    Cliente / Lead Cadastrado *
                  </label>
                  <select
                    value={selectedLeadIdForRes}
                    onChange={(e) => setSelectedLeadIdForRes(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white"
                  >
                    <option value="">-- Selecione o Cliente --</option>
                    {leads.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.nome} ({l.telefone || l.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsReserving(false)}
                    className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmReservation}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1"
                  >
                    <Check className="w-4 h-4" />
                    <span>Confirmar Reserva (72h)</span>
                  </button>
                </div>
              </div>
            )}

            {/* Outros Botões Auxiliares de Reserva */}
            {selectedUnit.status === 'reservado' && (
              <div className="space-y-2 pt-1">
                {selectedUnit.reservaLeadId && (
                  <button
                    onClick={() => {
                      const targetLead = leads.find((l) => l.id === selectedUnit.reservaLeadId);
                      if (targetLead) {
                        setSelectedLeadForModal(targetLead);
                        setSelectedUnit(null);
                      } else {
                        alert('Cliente vinculado não encontrado na base.');
                      }
                    }}
                    className="w-full flex items-center justify-between p-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-4 h-4" />
                      <span>Ver / Anexar Comprovante na Pasta do Cliente</span>
                    </div>
                    <ExternalLink className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={() => {
                    transformReservationToPreSale(selectedUnit.id);
                    alert(`Reserva da unidade ${selectedUnit.quadra} ${selectedUnit.lote} convertida em Pré-Venda!`);
                    setSelectedUnit(null);
                  }}
                  className="w-full flex items-center justify-between p-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    <span>Transformar Reserva em Pré-Venda</span>
                  </div>
                  <Check className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    if (confirm('Tem certeza que deseja cancelar a reserva e liberar a unidade para o espelho?')) {
                      updateUnit(selectedUnit.id, { status: 'disponivel', reservaLeadId: undefined, reservaLeadNome: undefined });
                      alert('Unidade liberada com sucesso.');
                      setSelectedUnit(null);
                    }
                  }}
                  className="w-full flex items-center justify-center p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200 rounded-xl text-xs font-semibold"
                >
                  <span>Cancelar / Liberar Unidade</span>
                </button>
              </div>
            )}

              {(currentUser.role === 'admin' || currentUser.role === 'gestor') && (
                <button
                  onClick={() => {
                    openEditModalForUnit(selectedUnit);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl text-xs font-semibold transition-colors mt-2"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Editar Cadastro da Unidade (Admin/Gestor)</span>
                </button>
              )}
          </div>
        </div>
      )}

      {/* Edit / Add Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-800 dark:text-white">
                {editingUnit ? `Editar Unidade ${editingUnit.lote}` : 'Adicionar Nova Unidade'}
              </h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[70vh] space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Bloco / Quadra *</label>
                  <input
                    type="text"
                    required
                    value={formData.quadra || ''}
                    onChange={(e) => setFormData({ ...formData, quadra: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Unidade / Lote *</label>
                  <input
                    type="text"
                    required
                    value={formData.lote || ''}
                    onChange={(e) => setFormData({ ...formData, lote: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Status *</label>
                  <select
                    value={formData.status || 'disponivel'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as UnitStatus })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white font-medium"
                  >
                    <option value="disponivel">Disponível</option>
                    <option value="reservado">Reservada</option>
                    <option value="em_processo">Em Processo / Pré-Venda</option>
                    <option value="vendido">Vendida</option>
                    <option value="bloqueado">Bloqueada</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Valor Final (R$) *</label>
                  <input
                    type="number"
                    required
                    value={formData.valorFinal || 0}
                    onChange={(e) => setFormData({ ...formData, valorFinal: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Área Privativa (m²)</label>
                  <input
                    type="number"
                    value={formData.areaConstruida || 0}
                    onChange={(e) => setFormData({ ...formData, areaConstruida: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Dormitórios</label>
                  <input
                    type="number"
                    value={formData.dormitorios || 2}
                    onChange={(e) => setFormData({ ...formData, dormitorios: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              {editingUnit ? (
                <button
                  type="button"
                  onClick={handleDeleteUnit}
                  className="px-3 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl text-xs font-semibold flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir Unidade
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveUnitForm}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  Salvar Unidade
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
