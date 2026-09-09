import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Visit, VisitTipoAtendimento } from '../types';
import {
  BookOpenCheck,
  Plus,
  Flame,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building,
  Calendar,
  Search,
  Filter,
  Sparkles,
} from 'lucide-react';

export const VisitsLog: React.FC = () => {
  const { visits, addVisit, users, currentUser } = useApp();

  const [showModal, setShowModal] = useState(false);
  const [leadNome, setLeadNome] = useState('');
  const [leadTelefone, setLeadTelefone] = useState('');
  const [temperatura, setTemperatura] = useState<Visit['temperatura']>('quente');
  const [tipoAtendimento, setTipoAtendimento] = useState<VisitTipoAtendimento>('espontanea');
  const [unidadeInteresse, setUnidadeInteresse] = useState('Quadra 04 - Lote 12');
  const [observacoes, setObservacoes] = useState('');
  const [desfecho, setDesfecho] = useState<Visit['desfecho']>('em_negociacao');
  const [corretorId, setCorretorId] = useState(currentUser.id);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('todos');

  const handleCreateVisit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadNome.trim()) return;

    const corretorObj = users.find((u) => u.id === corretorId) || currentUser;

    addVisit({
      leadNome: leadNome.trim(),
      leadTelefone: leadTelefone.trim() || '(41) 99999-0000',
      corretorId: corretorObj.id,
      corretorNome: corretorObj.name,
      temperatura,
      tipoAtendimento,
      unidadeInteresse,
      observacoes,
      desfecho,
    });

    setLeadNome('');
    setLeadTelefone('');
    setObservacoes('');
    setShowModal(false);
  };

  const getTipoBadge = (tipo: VisitTipoAtendimento) => {
    switch (tipo) {
      case 'espontanea':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
            <Sparkles className="w-3 h-3 text-purple-600" />
            Visita Espontânea
          </span>
        );
      case 'roleta_porta':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            Roleta / Porta
          </span>
        );
      case 'agendada':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800">
            Visita Agendada
          </span>
        );
      case 'retorno':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
            Retorno de Cliente
          </span>
        );
      case 'indicacao':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
            Indicação
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            {tipo}
          </span>
        );
    }
  };

  const getTempBadge = (temp: Visit['temperatura']) => {
    switch (temp) {
      case 'quente':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700">🔥 Quente</span>;
      case 'morno':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">⚡ Morno</span>;
      case 'frio':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">❄️ Frio</span>;
    }
  };

  const getDesfechoBadge = (d: Visit['desfecho']) => {
    switch (d) {
      case 'venda_fechada':
        return <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800">Venda Fechada</span>;
      case 'proposta_enviada':
        return <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-blue-100 text-blue-800">Proposta Enviada</span>;
      case 'em_negociacao':
        return <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-700">Em Negociação</span>;
      case 'remarcou':
        return <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-purple-100 text-purple-800">Visita Remarcada</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-500">Desistiu</span>;
    }
  };

  const filteredVisits = useMemo(() => {
    return visits.filter((v) => {
      const matchSearch =
        v.leadNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.corretorNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (v.unidadeInteresse && v.unidadeInteresse.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchTipo = filterTipo === 'todos' || v.tipoAtendimento === filterTipo;

      return matchSearch && matchTipo;
    });
  }, [visits, searchTerm, filterTipo]);

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Registro de Visitas (Plantão)</h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Livro digital de recepção de clientes que compareceram fisicamente ao plantão Jardim Vivência.
          </p>
        </div>

        <button
          id="btn-novo-checkin-visita"
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Check-in de Visita</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por cliente, corretor ou lote..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-600 font-medium whitespace-nowrap">Tipo:</span>
          <select
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-emerald-500"
          >
            <option value="todos">Todos os Tipos</option>
            <option value="espontanea">✨ Visita Espontânea</option>
            <option value="roleta_porta">Roleta / Porta</option>
            <option value="agendada">Visita Agendada</option>
            <option value="retorno">Retorno</option>
            <option value="indicacao">Indicação</option>
          </select>
        </div>
      </div>

      {/* Visits Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3.5">Data/Horário</th>
                <th className="px-4 py-3.5">Cliente</th>
                <th className="px-4 py-3.5">Corretor Responsável</th>
                <th className="px-4 py-3.5">Temperatura</th>
                <th className="px-4 py-3.5">Tipo de Atendimento</th>
                <th className="px-4 py-3.5">Unidade de Interesse</th>
                <th className="px-4 py-3.5">Desfecho</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredVisits.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400 text-xs">
                    Nenhuma visita encontrada com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredVisits.map((visit) => (
                  <tr key={visit.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-500 font-medium">{visit.dataHora}</td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{visit.leadNome}</div>
                      <div className="text-[10px] text-slate-400">{visit.leadTelefone}</div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{visit.corretorNome}</td>
                    <td className="px-4 py-3">{getTempBadge(visit.temperatura)}</td>
                    <td className="px-4 py-3">{getTipoBadge(visit.tipoAtendimento)}</td>
                    <td className="px-4 py-3 font-medium text-emerald-800">
                      {visit.unidadeInteresse || 'Não especificada'}
                    </td>
                    <td className="px-4 py-3">{getDesfechoBadge(visit.desfecho)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Check-in Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Novo Registro de Visita</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateVisit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-medium text-slate-700">Nome do Visitante:</label>
                <input
                  type="text"
                  required
                  placeholder="Nome completo do cliente"
                  value={leadNome}
                  onChange={(e) => setLeadNome(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-slate-700">Telefone / WhatsApp:</label>
                  <input
                    type="text"
                    placeholder="(41) 99999-8888"
                    value={leadTelefone}
                    onChange={(e) => setLeadTelefone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-700">Temperatura do Lead:</label>
                  <select
                    value={temperatura}
                    onChange={(e) => setTemperatura(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="quente">🔥 Quente (Decisão Imediata)</option>
                    <option value="morno">⚡ Morno (Em Avaliação)</option>
                    <option value="frio">❄️ Frio (Curioso)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-slate-700">Tipo de Atendimento:</label>
                  <select
                    id="select-tipo-atendimento"
                    value={tipoAtendimento}
                    onChange={(e) => setTipoAtendimento(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium"
                  >
                    <option value="espontanea">✨ Visita Espontânea</option>
                    <option value="roleta_porta">Roleta / Porta</option>
                    <option value="agendada">Visita Agendada</option>
                    <option value="retorno">Retorno de Cliente</option>
                    <option value="indicacao">Indicação</option>
                  </select>
                </div>

                <div>
                  <label className="font-medium text-slate-700">Desfecho da Visita:</label>
                  <select
                    value={desfecho}
                    onChange={(e) => setDesfecho(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="em_negociacao">Em Negociação</option>
                    <option value="proposta_enviada">Proposta Enviada</option>
                    <option value="venda_fechada">Venda Fechada</option>
                    <option value="remarcou">Remarcou Retorno</option>
                    <option value="desistiu">Desistiu</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-medium text-slate-700">Corretor que Atendeu:</label>
                <select
                  value={corretorId}
                  onChange={(e) => setCorretorId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-medium text-slate-700">Unidade de Interesse (Quadra/Lote):</label>
                <input
                  type="text"
                  placeholder="Ex: Quadra 08 - Lote 14"
                  value={unidadeInteresse}
                  onChange={(e) => setUnidadeInteresse(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="font-medium text-slate-700">Observações do Atendimento:</label>
                <textarea
                  rows={2}
                  placeholder="Detalhes sobre a conversa, renda, FGTS ou expectativas..."
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs rounded-xl font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs rounded-xl font-semibold bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  Salvar Visita
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
