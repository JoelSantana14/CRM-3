import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  FileSpreadsheet, 
  Download, 
  Copy, 
  CheckCircle2, 
  ShieldCheck, 
  X, 
  Users, 
  DollarSign, 
  Building, 
  ClipboardList, 
  History,
  MapPin
} from 'lucide-react';

interface ExportReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportReportsModal: React.FC<ExportReportsModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, leads, commissions, units, attendances, auditLogs } = useApp();
  const [selectedReport, setSelectedReport] = useState<'leads' | 'commissions' | 'vendas' | 'atendimentos' | 'auditoria' | 'bairros'>('leads');
  const [copied, setCopied] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

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

  // Verify permission: only admin, coordenador, gestor
  const isAuthorized = currentUser.role === 'admin' || currentUser.role === 'coordenador' || currentUser.role === 'gestor';

  if (!isAuthorized) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
        <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-center my-auto">
          <div className="w-12 h-12 bg-rose-100 dark:bg-rose-950 text-rose-600 rounded-2xl mx-auto flex items-center justify-center mb-4">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Acesso Restrito</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
            A funcionalidade de exportação avançada de relatórios externos é restrita a Coordenadores e Gestores de Vendas.
          </p>
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    );
  }

  // Helper to download CSV with UTF-8 BOM for Excel compatibility
  const downloadCsv = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setSuccessMsg(`Relatório "${filename}" exportado com sucesso para CSV/Excel!`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleExport = () => {
    switch (selectedReport) {
      case 'leads': {
        const headers = ['Código', 'Nome do Cliente', 'CPF', 'Telefone', 'E-mail', 'Renda Familiar (R$)', 'FGTS (R$)', 'Estágio do Funil', 'Corretor Responsável', 'Origem', 'Data de Cadastro'];
        const rows = leads.map(l => [
          l.codigoExterno || l.id,
          l.nome,
          l.cpf,
          l.telefone,
          l.email,
          l.rendaFamiliar,
          l.fgts,
          l.status,
          l.corretorNome,
          l.origem,
          l.dataCadastro
        ]);
        downloadCsv('leads_jardim_vivencia', headers, rows);
        break;
      }
      case 'commissions': {
        const headers = ['ID Comissão', 'Corretor', 'Valor da Venda (R$)', 'Comissão Corretor (%)', 'Valor Comissão (R$)', 'Status', 'Data Pagamento', 'Identificação Unidade'];
        const rows = commissions.map(c => [
          c.id,
          c.corretorNome,
          c.valorVenda,
          c.percentualCorretor,
          c.valorComissaoCorretor,
          c.status,
          c.dataPagamento || 'Pendente',
          c.unidadeIdentificacao
        ]);
        downloadCsv('comissoes_jardim_vivencia', headers, rows);
        break;
      }
      case 'vendas': {
        const soldUnits = units.filter(u => u.status === 'vendido');
        const headers = ['Quadra / Torre', 'Lote / Unidade', 'Tipo', 'Grupo', 'Valor de Venda (R$)', 'Comprador', 'Corretor Vendedor', 'Data da Venda'];
        const rows = soldUnits.map(u => [
          u.quadra,
          u.lote,
          u.tipoUnidade || 'Padrão',
          u.grupo,
          u.valorFinal,
          u.clienteNome || 'Não informado',
          u.corretorNome || 'Não informado',
          u.dataReserva || 'Não informada'
        ]);
        downloadCsv('vendas_espelho_jardim_vivencia', headers, rows);
        break;
      }
      case 'atendimentos': {
        const headers = ['ID Atendimento', 'Data / Hora Checkin', 'Corretor', 'Status', 'Fila Roleta', 'Observações'];
        const rows = attendances.map(a => [
          a.id,
          a.dataHoraCheckin,
          a.corretorNome,
          a.status,
          a.emFilaRoleta ? 'Sim' : 'Não',
          a.observacao || ''
        ]);
        downloadCsv('atendimentos_plantao_vivencia', headers, rows);
        break;
      }
      case 'auditoria': {
        const headers = ['Data / Hora', 'Ação', 'Entidade', 'Usuário Responsável', 'Detalhes'];
        const rows = auditLogs.map(log => [
          log.timestamp,
          log.acao,
          log.entidade,
          log.userName,
          log.detalhes
        ]);
        downloadCsv('logs_auditoria_vivencia', headers, rows);
        break;
      }
      case 'bairros': {
        const bairroMap = new Map<string, {
          bairro: string;
          cidade: string;
          totalLeads: number;
          ativos: number;
          aprovadosCef: number;
          contratosAssinados: number;
          vgvTotal: number;
          canais: Record<string, number>;
        }>();

        leads.forEach((l) => {
          let b = l.bairro?.trim();
          let c = l.cidade?.trim() || 'Curitiba';

          if (!b && l.endereco) {
            const parts = l.endereco.split('-').map((p) => p.trim());
            if (parts.length >= 2) {
              const subParts = parts[1].split(',');
              b = subParts[0].trim();
            } else {
              b = 'Não Informado / Outros';
            }
          }
          if (!b) b = 'Outros / Não Declarado';

          if (!bairroMap.has(b)) {
            bairroMap.set(b, {
              bairro: b,
              cidade: c,
              totalLeads: 0,
              ativos: 0,
              aprovadosCef: 0,
              contratosAssinados: 0,
              vgvTotal: 0,
              canais: {},
            });
          }

          const item = bairroMap.get(b)!;
          item.totalLeads += 1;
          if (l.status !== 'distratado' && l.status !== 'descartado') item.ativos += 1;
          if (l.status === 'aprovado_cef' || l.status === 'contrato_assinado') item.aprovadosCef += 1;
          if (l.status === 'contrato_assinado') {
            item.contratosAssinados += 1;
            item.vgvTotal += l.valorSimulacao || 210000;
          } else if (l.status === 'aprovado_cef') {
            item.vgvTotal += (l.valorSimulacao || 210000) * 0.5;
          }

          const canal = l.origem || 'Plantão Presencial';
          item.canais[canal] = (item.canais[canal] || 0) + 1;
        });

        const totalLeadsCount = leads.length;
        const headers = [
          'Bairro',
          'Cidade / Região',
          'Total de Leads',
          'Leads Ativos',
          'Aprovados CEF',
          'Contratos Assinados',
          'VGV Estimado / Assinado (R$)',
          'Principal Canal de Origem',
          '% Participação Total',
          'Taxa de Conversão (%)',
        ];

        const rows = Array.from(bairroMap.values()).map((n) => {
          let topCanal = 'Plantão Presencial';
          let maxCount = 0;
          Object.entries(n.canais).forEach(([canalName, count]) => {
            if (count > maxCount) {
              maxCount = count;
              topCanal = canalName;
            }
          });

          const pct = totalLeadsCount > 0 ? (n.totalLeads / totalLeadsCount) * 100 : 0;
          const conv = n.totalLeads > 0 ? (n.contratosAssinados / n.totalLeads) * 100 : 0;

          return [
            n.bairro,
            n.cidade,
            n.totalLeads,
            n.ativos,
            n.aprovadosCef,
            n.contratosAssinados,
            n.vgvTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
            topCanal,
            `${pct.toFixed(1)}%`,
            `${conv.toFixed(1)}%`,
          ];
        });

        downloadCsv('relatorio_bairros_procedencia_clientes', headers, rows);
        break;
      }
    }
  };

  const handleCopyToClipboard = () => {
    let text = '';
    if (selectedReport === 'leads') {
      const headers = ['Código', 'Nome', 'CPF', 'Telefone', 'E-mail', 'Renda', 'Status', 'Corretor'];
      const rows = leads.map(l => [l.codigoExterno || l.id, l.nome, l.cpf, l.telefone, l.email, l.rendaFamiliar, l.status, l.corretorNome].join('\t'));
      text = [headers.join('\t'), ...rows].join('\n');
    } else if (selectedReport === 'commissions') {
      const headers = ['ID', 'Corretor', 'Valor Venda', 'Comissão', 'Status'];
      const rows = commissions.map(c => [c.id, c.corretorNome, c.valorVenda, c.valorComissaoCorretor, c.status].join('\t'));
      text = [headers.join('\t'), ...rows].join('\n');
    } else if (selectedReport === 'vendas') {
      const headers = ['Quadra', 'Lote', 'Tipo', 'Preço', 'Comprador', 'Corretor'];
      const rows = units.filter(u => u.status === 'vendido').map(u => [u.quadra, u.lote, u.tipoUnidade || '', u.valorFinal, u.clienteNome || '', u.corretorNome || ''].join('\t'));
      text = [headers.join('\t'), ...rows].join('\n');
    } else if (selectedReport === 'atendimentos') {
      const headers = ['ID', 'Data Checkin', 'Corretor', 'Status'];
      const rows = attendances.map(a => [a.id, a.dataHoraCheckin, a.corretorNome, a.status].join('\t'));
      text = [headers.join('\t'), ...rows].join('\n');
    } else {
      const headers = ['Data', 'Ação', 'Entidade', 'Usuário', 'Detalhes'];
      const rows = auditLogs.map(l => [l.timestamp, l.acao, l.entidade, l.userName, l.detalhes].join('\t'));
      text = [headers.join('\t'), ...rows].join('\n');
    }

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 overflow-hidden my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 rounded-2xl">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                Exportação de Relatórios para Excel / CSV
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Acesso Exclusivo para Coordenadores e Gestores • Jardim Vivência
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Fechar (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1">
          {successMsg && (
            <div className="mb-5 p-3.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Dataset Selection */}
          <div className="space-y-4 mb-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Selecione o Conjunto de Dados para Exportar:
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedReport('leads')}
                className={`p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                  selectedReport === 'leads'
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-900 dark:text-emerald-200 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                <div className={`p-2 rounded-xl ${selectedReport === 'leads' ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs">Leads & Clientes ({leads.length})</div>
                  <div className="text-[11px] opacity-75">Cadastros, Renda, FGTS e Fases</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedReport('commissions')}
                className={`p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                  selectedReport === 'commissions'
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-900 dark:text-emerald-200 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                <div className={`p-2 rounded-xl ${selectedReport === 'commissions' ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs">Comissões ({commissions.length})</div>
                  <div className="text-[11px] opacity-75">VGV, % Corretor e Status</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedReport('vendas')}
                className={`p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                  selectedReport === 'vendas'
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-900 dark:text-emerald-200 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                <div className={`p-2 rounded-xl ${selectedReport === 'vendas' ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                  <Building className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs">Unidades Vendidas</div>
                  <div className="text-[11px] opacity-75">Espelho de Vendas e Compradores</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedReport('atendimentos')}
                className={`p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                  selectedReport === 'atendimentos'
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-900 dark:text-emerald-200 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                <div className={`p-2 rounded-xl ${selectedReport === 'atendimentos' ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                  <ClipboardList className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs">Atendimentos de Plantão</div>
                  <div className="text-[11px] opacity-75">Escala e Fila Roleta</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedReport('bairros')}
                className={`p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                  selectedReport === 'bairros'
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-900 dark:text-emerald-200 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                <div className={`p-2 rounded-xl ${selectedReport === 'bairros' ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs">Origem por Bairro / Localidade</div>
                  <div className="text-[11px] opacity-75">Geografia e VGV por Região</div>
                </div>
              </button>
            </div>

            <div className="pt-1">
              <button
                type="button"
                onClick={() => setSelectedReport('auditoria')}
                className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                  selectedReport === 'auditoria'
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-900 dark:text-emerald-200 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                <div className={`p-2 rounded-xl ${selectedReport === 'auditoria' ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs">Logs de Auditoria do Sistema ({auditLogs.length} registros)</div>
                  <div className="text-[11px] opacity-75">Rastreabilidade completa de ações e alterações</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleExport}
              className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors shadow-lg shadow-emerald-950/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Baixar em Arquivo CSV (.csv) compatível com Excel</span>
            </button>

            <button
              type="button"
              onClick={handleCopyToClipboard}
              className="py-3 px-4 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copiado!' : 'Copiar para Excel'}</span>
            </button>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center mt-3">
            O arquivo gerado é codificado em UTF-8 com separador de ponto e vírgula (;), abrindo diretamente no Microsoft Excel, Google Sheets ou LibreOffice.
          </p>
        </div>
      </div>
    </div>
  );
};
