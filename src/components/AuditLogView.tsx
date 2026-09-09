import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { DeletionAuditRecord } from '../types';
import {
  ShieldCheck,
  Search,
  Download,
  Filter,
  Clock,
  User,
  Layers,
  FileSpreadsheet,
  Trash2,
  Cloud,
  Eye,
  X,
  Lock,
  AlertCircle,
  FileText,
} from 'lucide-react';

export const AuditLogView: React.FC = () => {
  const { auditLogs, deletionLogs } = useApp();

  const [activeTab, setActiveTab] = useState<'geral' | 'exclusoes_firestore'>('geral');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntidade, setSelectedEntidade] = useState('todas');
  const [selectedDeletionType, setSelectedDeletionType] = useState<string>('todas');
  const [inspectRecord, setInspectRecord] = useState<DeletionAuditRecord | null>(null);

  // General audit logs filtering
  const visibleAuditLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const matchesSearch =
        log.acao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.detalhes.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesEntidade = selectedEntidade === 'todas' || log.entidade === selectedEntidade;

      return matchesSearch && matchesEntidade;
    });
  }, [auditLogs, searchTerm, selectedEntidade]);

  // Firestore deletion logs filtering
  const visibleDeletionLogs = useMemo(() => {
    return (deletionLogs || []).filter((rec) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        rec.recordIdentifier.toLowerCase().includes(q) ||
        rec.deletedBy.userName.toLowerCase().includes(q) ||
        (rec.deletedBy.userEmail && rec.deletedBy.userEmail.toLowerCase().includes(q)) ||
        rec.detalhes.toLowerCase().includes(q) ||
        (rec.motivo && rec.motivo.toLowerCase().includes(q));

      const matchesType = selectedDeletionType === 'todas' || rec.entityType === selectedDeletionType;

      return matchesSearch && matchesType;
    });
  }, [deletionLogs, searchTerm, selectedDeletionType]);

  const entidades = useMemo(() => {
    const set = new Set<string>();
    auditLogs.forEach((l) => set.add(l.entidade));
    return Array.from(set);
  }, [auditLogs]);

  const exportAuditCsv = () => {
    const headers = ['Data/Hora', 'Usuário', 'Ação', 'Módulo/Entidade', 'Detalhes'];
    const rows = visibleAuditLogs.map((l) => [
      l.timestamp,
      `"${l.userName}"`,
      `"${l.acao}"`,
      `"${l.entidade}"`,
      `"${l.detalhes.replace(/"/g, '""')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `auditoria_geral_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportDeletionsCsv = () => {
    const headers = ['Data/Hora', 'Excluído Por', 'Perfil', 'Tipo', 'Identificador', 'Motivo', 'Detalhes'];
    const rows = visibleDeletionLogs.map((d) => [
      d.dataHoraFormatada || d.timestamp,
      `"${d.deletedBy.userName}"`,
      `"${d.deletedBy.userRole}"`,
      `"${d.entityType}"`,
      `"${d.recordIdentifier.replace(/"/g, '""')}"`,
      `"${(d.motivo || '').replace(/"/g, '""')}"`,
      `"${d.detalhes.replace(/"/g, '""')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `auditoria_exclusoes_firestore_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getEntityBadge = (type: DeletionAuditRecord['entityType']) => {
    switch (type) {
      case 'cliente_lead':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-cyan-100 text-cyan-800 border border-cyan-200">Cliente / Lead</span>;
      case 'imovel_unidade':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">Imóvel / Unidade</span>;
      case 'usuario_corretor':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-100 text-purple-800 border border-purple-200">Usuário / Corretor</span>;
      case 'comissao':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">Comissão</span>;
      case 'equipe':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">Equipe</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-200">Outros</span>;
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Auditoria & Rastreabilidade de Dados</h1>
            <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
              Exclusivo Administrador
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-0.5">
            Logs de auditoria e registro em tempo real no Firestore de todas as exclusões de cadastros para controle de sincronização multiusuário.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'geral' ? (
            <button
              onClick={exportAuditCsv}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Exportar Auditoria Geral</span>
            </button>
          ) : (
            <button
              onClick={exportDeletionsCsv}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Exportar Exclusões Firestore</span>
            </button>
          )}
        </div>
      </div>

      {/* Compliance / Permanent Attendances Banner */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start sm:items-center gap-3">
        <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700 shrink-0">
          <Lock className="w-4 h-4" />
        </div>
        <div className="text-xs text-emerald-900 flex-1">
          <span className="font-bold">Política de Conformidade & Integridade de Atendimentos:</span>{' '}
          Os registros de atendimentos realizados no plantão e na roleta são estritamente <strong>permanentes e perpétuos</strong>. Não podem ser excluídos pelo sistema para preservar a precedência de corretores, comissões futuras e histórico das tratativas.
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-2xl px-4 pt-2">
        <button
          onClick={() => setActiveTab('geral')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'geral'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Auditoria Geral ({auditLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('exclusoes_firestore')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'exclusoes_firestore'
              ? 'border-rose-600 text-rose-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Cloud className="w-4 h-4 text-rose-600" />
          <span>Exclusões Gravadas no Firestore</span>
          <span className="ml-1 px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-rose-100 text-rose-700">
            {deletionLogs?.length || 0}
          </span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-b-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={
              activeTab === 'geral'
                ? 'Buscar por usuário, ação ou detalhe...'
                : 'Buscar por responsável, identificador do registro, motivo...'
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-slate-800"
          />
        </div>

        {activeTab === 'geral' ? (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-500 font-medium">Módulo:</span>
            <select
              value={selectedEntidade}
              onChange={(e) => setSelectedEntidade(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700"
            >
              <option value="todas">Todos os Módulos</option>
              {entidades.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-500 font-medium">Tipo de Cadastro:</span>
            <select
              value={selectedDeletionType}
              onChange={(e) => setSelectedDeletionType(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700"
            >
              <option value="todas">Todos os Tipos</option>
              <option value="cliente_lead">Clientes / Leads</option>
              <option value="imovel_unidade">Imóveis / Unidades</option>
              <option value="usuario_corretor">Usuários / Corretores</option>
              <option value="comissao">Comissões</option>
              <option value="equipe">Equipes</option>
              <option value="outros">Outros</option>
            </select>
          </div>
        )}
      </div>

      {/* Tab 1: General Logs Table */}
      {activeTab === 'geral' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3.5">Data/Horário</th>
                  <th className="px-4 py-3.5">Usuário Responsável</th>
                  <th className="px-4 py-3.5">Ação Realizada</th>
                  <th className="px-4 py-3.5">Módulo / Entidade</th>
                  <th className="px-4 py-3.5">Detalhes da Operação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {visibleAuditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">{log.timestamp}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{log.userName}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{log.acao}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                        {log.entidade}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-md break-words">{log.detalhes}</td>
                  </tr>
                ))}

                {visibleAuditLogs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                      Nenhum registro de auditoria encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Firestore Deletion Logs Table */}
      {activeTab === 'exclusoes_firestore' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Cloud className="w-4 h-4 text-indigo-600" />
              <span>Coleção Firestore: <code className="font-mono text-indigo-700 bg-indigo-50 px-1 py-0.5 rounded">deletion_audit_logs</code></span>
            </div>
            <span className="text-xs text-slate-500">
              {visibleDeletionLogs.length} registro(s) de exclusão sincronizado(s)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3.5">Data/Horário</th>
                  <th className="px-4 py-3.5">Quem Excluiu</th>
                  <th className="px-4 py-3.5">Tipo de Dado</th>
                  <th className="px-4 py-3.5">Identificador do Registro</th>
                  <th className="px-4 py-3.5">Motivo Informado</th>
                  <th className="px-4 py-3.5">Detalhes da Ação</th>
                  <th className="px-4 py-3.5 text-center">Snapshot</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {visibleDeletionLogs.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {rec.dataHoraFormatada || rec.timestamp}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{rec.deletedBy.userName}</div>
                      <div className="text-[10px] text-slate-500">
                        {rec.deletedBy.userRole.toUpperCase()} {rec.deletedBy.userEmail ? `• ${rec.deletedBy.userEmail}` : ''}
                      </div>
                    </td>
                    <td className="px-4 py-3">{getEntityBadge(rec.entityType)}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800 max-w-xs break-words">
                      {rec.recordIdentifier}
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-xs break-words italic">
                      {rec.motivo || 'Não especificado'}
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-md break-words">
                      {rec.detalhes}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      {rec.snapshot ? (
                        <button
                          onClick={() => setInspectRecord(rec)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors"
                          title="Visualizar snapshot completo dos dados antes da exclusão"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver Dados</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px] italic">Sem snapshot</span>
                      )}
                    </td>
                  </tr>
                ))}

                {visibleDeletionLogs.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                      Nenhum registro de exclusão encontrado no Firestore.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Snapshot Modal */}
      {inspectRecord && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-rose-100 text-rose-700 rounded-lg">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Snapshot de Dados Excluídos
                  </h3>
                  <p className="text-xs text-slate-500">
                    ID original: <code className="font-mono">{inspectRecord.recordId}</code> • Excluído por {inspectRecord.deletedBy.userName}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setInspectRecord(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                <div><strong>Identificador:</strong> {inspectRecord.recordIdentifier}</div>
                <div><strong>Data e Hora:</strong> {inspectRecord.dataHoraFormatada || inspectRecord.timestamp}</div>
                <div><strong>Motivo:</strong> {inspectRecord.motivo || 'Não informado'}</div>
                <div><strong>Detalhes:</strong> {inspectRecord.detalhes}</div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Payload Integral do Registro (JSON):</span>
                </h4>
                <pre className="p-3.5 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono overflow-x-auto max-h-72">
                  {JSON.stringify(inspectRecord.snapshot, null, 2)}
                </pre>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setInspectRecord(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

