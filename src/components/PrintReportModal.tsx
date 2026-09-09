import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Printer,
  FileText,
  Download,
  X,
  Building2,
  Calendar,
  UserCheck,
  Percent,
  Calculator,
  Dices,
  Users,
  CheckCircle2,
  Share2,
  Copy,
  Info,
} from 'lucide-react';
import { Lead, SimulationResult } from '../types';

export type ReportType =
  | 'proposta_simulador'
  | 'relatorio_roleta'
  | 'extrato_comissoes'
  | 'tabela_vgv'
  | 'relatorio_leads'
  | 'livro_visitas';

interface PrintReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultReportType?: ReportType;
  simulationData?: {
    lead?: Lead | null;
    input: any;
    result: SimulationResult;
  };
}

export const PrintReportModal: React.FC<PrintReportModalProps> = ({
  isOpen,
  onClose,
  defaultReportType = 'proposta_simulador',
  simulationData,
}) => {
  const {
    currentUser,
    leads,
    units,
    commissions,
    rouletteHistory,
    attendances,
    visits,
    teams,
    settings,
  } = useApp();

  const [reportType, setReportType] = useState<ReportType>(defaultReportType);
  const [copied, setCopied] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

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

  const handlePrint = () => {
    window.print();
  };

  const currentDate = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val || 0);
  };

  // Render specific printable content based on reportType
  const renderPrintableContent = () => {
    switch (reportType) {
      case 'proposta_simulador': {
        const sim = simulationData;
        const lead = sim?.lead;
        const input = sim?.input || {};
        const res = sim?.result;

        return (
          <div className="space-y-6 text-slate-800">
            {/* Header Box */}
            <div className="border-b-2 border-emerald-600 pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight">
                    Proposta de Compra & Simulação de Pagamento
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Loteamento Jardim Vivência • Programa {settings.nomeSubsidioEstadual || 'Estadual'} & Caixa Econômica Federal
                  </p>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <p className="font-semibold text-slate-800">OTS Master CRM</p>
                  <p>Emissão: {currentDate}</p>
                </div>
              </div>
            </div>

            {/* Proponent Info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 block font-medium">Cliente / Proponente:</span>
                <strong className="text-slate-900 text-sm">{lead?.nome || input.clienteNome || 'Cliente Interessado'}</strong>
                {lead?.nacionalidade && <span className="text-slate-500 block text-[11px]">{lead.nacionalidade}</span>}
              </div>
              <div>
                <span className="text-slate-500 block font-medium">Contato:</span>
                <span className="text-slate-800 font-semibold block">{lead?.telefone || '(41) 99999-0000'}</span>
                {lead?.email && <span className="text-slate-600 block text-[11px]">{lead.email}</span>}
              </div>
              <div>
                <span className="text-slate-500 block font-medium">Renda Familiar Bruta:</span>
                <span className="text-emerald-700 font-bold text-sm">{formatCurrency(input.rendaFamiliar || 2600)}</span>
              </div>
              <div>
                <span className="text-slate-500 block font-medium">Corretor Responsável:</span>
                <span className="text-slate-800 font-semibold">{lead?.corretorNome || currentUser.name} (CRECI: {currentUser.creci})</span>
              </div>
              {lead?.endereco && (
                <div className="col-span-2 sm:col-span-4 border-t border-slate-200/60 pt-2 mt-1">
                  <span className="text-slate-500 font-medium">Endereço do Proponente: </span>
                  <span className="text-slate-800 font-medium">{lead.endereco}</span>
                </div>
              )}
            </div>

            {/* Property details */}
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <div className="bg-slate-100 px-3 py-2 font-bold text-slate-800 border-b border-slate-200">
                1. DADOS DO IMÓVEL & COMPOSIÇÃO DE CRÉDITO
              </div>
              <div className="p-3.5 grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-slate-500">Valor de Venda do Imóvel:</span>
                  <p className="text-base font-bold text-slate-900">{formatCurrency(input.valorImovel || 215000)}</p>
                </div>
                <div>
                  <span className="text-slate-500">Financiamento CEF (SBPE / MCMV):</span>
                  <p className="text-base font-bold text-emerald-700">{formatCurrency(input.financiamentoCef || 155000)}</p>
                </div>
                <div>
                  <span className="text-slate-500">Saldo FGTS Utilizado:</span>
                  <p className="text-base font-bold text-slate-800">{formatCurrency(input.fgts || 0)}</p>
                </div>
                <div>
                  <span className="text-slate-500">Subsídio Federal (MCMV):</span>
                  <p className="text-base font-bold text-teal-700">{formatCurrency(input.subsidioFederal || 20000)}</p>
                </div>
                <div>
                  <span className="text-slate-500">Subsídio {settings.nomeSubsidioEstadual || 'Estadual'}:</span>
                  <p className="text-base font-bold text-emerald-800">{formatCurrency(input.subsidioEstadual || settings.subsidioEstadualPadrao || 20000)}</p>
                </div>
                <div>
                  <span className="text-slate-500">Taxa de Gestão & Assessoria CEF:</span>
                  <p className="text-base font-bold text-slate-700">{formatCurrency(input.taxaGestaoCef || 3500)}</p>
                </div>
              </div>
            </div>

            {/* Entry breakdown */}
            {res && (
              <div className="border border-emerald-200 rounded-xl overflow-hidden text-xs bg-emerald-50/30">
                <div className="bg-emerald-600 text-white px-3 py-2 font-bold flex justify-between items-center">
                  <span>2. PLANO DE PAGAMENTO DA ENTRADA PARCELADA</span>
                  <span>Total Entrada Líquida: {formatCurrency(res.totalEntradaNecessaria)}</span>
                </div>
                <div className="p-3.5 space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2.5 bg-white rounded-lg border border-emerald-100">
                      <span className="text-slate-500 block text-[11px]">1º Ato (Assinatura):</span>
                      <strong className="text-emerald-700 text-sm">{formatCurrency(input.ato1 || 0)}</strong>
                      <p className="text-[10px] text-slate-400 mt-0.5">{input.dataAto1 || 'No Contrato'}</p>
                    </div>
                    <div className="p-2.5 bg-white rounded-lg border border-emerald-100">
                      <span className="text-slate-500 block text-[11px]">2º Ato (30 dias):</span>
                      <strong className="text-emerald-700 text-sm">{formatCurrency(input.ato2 || 0)}</strong>
                      <p className="text-[10px] text-slate-400 mt-0.5">30 dias</p>
                    </div>
                    <div className="p-2.5 bg-white rounded-lg border border-emerald-100">
                      <span className="text-slate-500 block text-[11px]">3º Ato (60 dias):</span>
                      <strong className="text-emerald-700 text-sm">{formatCurrency(input.ato3 || 0)}</strong>
                      <p className="text-[10px] text-slate-400 mt-0.5">60 dias</p>
                    </div>
                  </div>

                  {/* Mensais breakdown */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-emerald-200">
                    {input.mensais1Qtd > 0 && (
                      <div className="p-2 bg-white rounded-lg border border-slate-200">
                        <span className="text-slate-600 font-semibold block text-[11px]">Mensais 1:</span>
                        <p className="text-sm font-bold text-emerald-800 mt-0.5">
                          {input.mensais1Qtd}x de {formatCurrency(input.mensais1Valor || res.valorParcelaMensal)}
                        </p>
                      </div>
                    )}
                    {input.mensais2Qtd > 0 && (
                      <div className="p-2 bg-white rounded-lg border border-slate-200">
                        <span className="text-slate-600 font-semibold block text-[11px]">Mensais 2:</span>
                        <p className="text-sm font-bold text-emerald-800 mt-0.5">
                          {input.mensais2Qtd}x de {formatCurrency(input.mensais2Valor)}
                        </p>
                      </div>
                    )}
                    {input.mensais3Qtd > 0 && (
                      <div className="p-2 bg-white rounded-lg border border-slate-200">
                        <span className="text-slate-600 font-semibold block text-[11px]">Mensais 3:</span>
                        <p className="text-sm font-bold text-emerald-800 mt-0.5">
                          {input.mensais3Qtd}x de {formatCurrency(input.mensais3Valor)}
                        </p>
                      </div>
                    )}
                    {input.mensais4Qtd > 0 && (
                      <div className="p-2 bg-white rounded-lg border border-slate-200">
                        <span className="text-slate-600 font-semibold block text-[11px]">Mensais 4:</span>
                        <p className="text-sm font-bold text-emerald-800 mt-0.5">
                          {input.mensais4Qtd}x de {formatCurrency(input.mensais4Valor)}
                        </p>
                      </div>
                    )}
                    {(!input.mensais1Qtd && !input.mensais2Qtd && !input.mensais3Qtd && !input.mensais4Qtd && res.qtdMensais) && (
                      <div className="p-2 bg-white rounded-lg border border-slate-200 col-span-2">
                        <span className="text-slate-600 font-semibold block text-[11px]">Mensais Construtora:</span>
                        <p className="text-sm font-bold text-emerald-800 mt-0.5">
                          {res.qtdMensais}x de {formatCurrency(res.valorParcelaMensal)}
                        </p>
                      </div>
                    )}
                    {res.parcelaComplementar > 0 && (
                      <div className="p-2 bg-white rounded-lg border border-indigo-200">
                        <span className="text-indigo-700 font-semibold block text-[11px]">Complementar / Chaves:</span>
                        <p className="text-sm font-bold text-indigo-950 mt-0.5">{formatCurrency(res.parcelaComplementar)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Schedule of Installments Table */}
            {res?.cronograma && res.cronograma.length > 0 && (
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <div className="bg-slate-100 px-3 py-2 font-bold text-slate-800 border-b border-slate-200 flex justify-between items-center">
                  <span>3. CRONOGRAMA DETALHADO DE TODAS AS PARCELAS</span>
                  <span className="text-slate-500 font-normal">{res.cronograma.length} parcelas programadas</span>
                </div>
                <div className="p-2 max-h-64 overflow-y-auto">
                  <table className="w-full text-left text-[11px]">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500">
                        <th className="pb-1 font-semibold">#</th>
                        <th className="pb-1 font-semibold">Etapa / Bloco</th>
                        <th className="pb-1 font-semibold">Vencimento</th>
                        <th className="pb-1 font-semibold text-right">Valor (R$)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {res.cronograma.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-1 text-slate-400 font-mono">{idx + 1}</td>
                          <td className="py-1 font-medium text-slate-800">{item.bloco} {item.numero ? `#${item.numero}` : ''}</td>
                          <td className="py-1 text-slate-600">{item.data}</td>
                          <td className="py-1 font-bold text-slate-900 text-right">{formatCurrency(item.valor)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Validation & Disclaimers */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
              <p className="font-semibold text-slate-800">Observações Legais e Validade:</p>
              <p>• Esta simulação é válida por 7 (sete) dias e está sujeita à aprovação cadastral e de crédito junto à Caixa Econômica Federal e ao respectivo órgão estadual (Programa {settings.nomeSubsidioEstadual || 'Estadual'}).</p>
              <p>• Os valores de subsídio estadual e federal dependem da confirmação de dados e documentação comprobatória de renda e dependentes do proponente.</p>
            </div>

            {/* Signatures */}
            <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs page-break-inside-avoid">
              <div className="border-t border-slate-400 pt-2">
                <p className="font-bold text-slate-800">{lead?.nome || input.clienteNome || 'Proponente Comprador'}</p>
                <p className="text-slate-500">CPF: {lead?.cpf || '___.___.___-__'}</p>
              </div>
              <div className="border-t border-slate-400 pt-2">
                <p className="font-bold text-slate-800">{currentUser.name}</p>
                <p className="text-slate-500">Corretor / CRECI: {currentUser.creci}</p>
              </div>
            </div>
          </div>
        );
      }

      case 'relatorio_roleta': {
        const totalGiradas = rouletteHistory.length;
        const totalAtendidos = rouletteHistory.filter((r) => r.resultado === 'atendido').length;
        const totalPassadas = rouletteHistory.filter((r) => r.resultado === 'passou_vez').length;

        return (
          <div className="space-y-6 text-slate-800">
            <div className="border-b-2 border-slate-800 pb-3 flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-slate-900 uppercase">
                  Relatório Oficial de Plantão & Roleta
                </h2>
                <p className="text-xs text-slate-600">Histórico de Atendimentos, Fila e Métricas do Plantão</p>
              </div>
              <div className="text-right text-xs text-slate-500">
                <p className="font-semibold text-slate-800">OTS Master CRM</p>
                <p>{currentDate}</p>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <span className="text-xs text-slate-500">Total de Giros:</span>
                <p className="text-xl font-bold text-slate-900">{totalGiradas}</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
                <span className="text-xs text-emerald-600">Atendimentos Concluídos:</span>
                <p className="text-xl font-bold text-emerald-800">{totalAtendidos}</p>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-center">
                <span className="text-xs text-amber-600">Passadas de Vez:</span>
                <p className="text-xl font-bold text-amber-800">{totalPassadas}</p>
              </div>
            </div>

            {/* History Table */}
            <div>
              <h3 className="font-bold text-sm text-slate-800 mb-2">Histórico Cronológico dos Giros da Roleta</h3>
              <table className="w-full text-xs text-left border border-slate-200">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="p-2 border border-slate-200">Data / Hora</th>
                    <th className="p-2 border border-slate-200">Corretor</th>
                    <th className="p-2 border border-slate-200">Cliente</th>
                    <th className="p-2 border border-slate-200">Origem</th>
                    <th className="p-2 border border-slate-200">Resultado</th>
                    <th className="p-2 border border-slate-200">Observação</th>
                  </tr>
                </thead>
                <tbody>
                  {rouletteHistory.map((item) => (
                    <tr key={item.id} className="border-b border-slate-200">
                      <td className="p-2 border border-slate-200 font-mono text-[11px]">{item.dataHora}</td>
                      <td className="p-2 border border-slate-200 font-semibold">{item.corretorNome}</td>
                      <td className="p-2 border border-slate-200">{item.leadNome}</td>
                      <td className="p-2 border border-slate-200">{item.origem}</td>
                      <td className="p-2 border border-slate-200">
                        <span className={`px-2 py-0.5 rounded font-semibold ${
                          item.resultado === 'atendido'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {item.resultado === 'atendido' ? 'Atendido' : 'Passou a Vez'}
                        </span>
                      </td>
                      <td className="p-2 border border-slate-200 text-slate-500">{item.observacao || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      }

      case 'extrato_comissoes': {
        const totalComissoes = commissions.reduce((acc, c) => acc + c.valorComissaoCorretor, 0);
        const totalVgv = commissions.reduce((acc, c) => acc + c.valorVenda, 0);

        return (
          <div className="space-y-6 text-slate-800">
            <div className="border-b-2 border-slate-800 pb-3 flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-slate-900 uppercase">
                  Extrato Financeiro de Comissões & VGV
                </h2>
                <p className="text-xs text-slate-600">Demonstrativo de Vendas Faturadas e Honorários de Corretagem</p>
              </div>
              <div className="text-right text-xs text-slate-500">
                <p className="font-semibold text-slate-800">OTS Master CRM</p>
                <p>{currentDate}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <span className="text-xs text-slate-500">VGV Total Faturado:</span>
                <p className="text-lg font-bold text-slate-900">{formatCurrency(totalVgv)}</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
                <span className="text-xs text-emerald-600">Total em Comissões:</span>
                <p className="text-lg font-bold text-emerald-800">{formatCurrency(totalComissoes)}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-center">
                <span className="text-xs text-blue-600">Contratos Gerados:</span>
                <p className="text-lg font-bold text-blue-900">{commissions.length} unidades</p>
              </div>
            </div>

            <div>
              <table className="w-full text-xs text-left border border-slate-200">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="p-2 border border-slate-200">Unidade</th>
                    <th className="p-2 border border-slate-200">Cliente</th>
                    <th className="p-2 border border-slate-200">Corretor (Corretor)</th>
                    <th className="p-2 border border-slate-200">Valor Venda</th>
                    <th className="p-2 border border-slate-200">%</th>
                    <th className="p-2 border border-slate-200">Comissão (R$)</th>
                    <th className="p-2 border border-slate-200">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {commissions.map((c) => (
                    <tr key={c.id} className="border-b border-slate-200">
                      <td className="p-2 border border-slate-200 font-bold">{c.unidadeIdentificacao}</td>
                      <td className="p-2 border border-slate-200">{c.leadNome}</td>
                      <td className="p-2 border border-slate-200 font-medium">{c.corretorNome}</td>
                      <td className="p-2 border border-slate-200 font-mono">{formatCurrency(c.valorVenda)}</td>
                      <td className="p-2 border border-slate-200 text-center">{c.percentualCorretor}%</td>
                      <td className="p-2 border border-slate-200 font-bold text-emerald-700">{formatCurrency(c.valorComissaoCorretor)}</td>
                      <td className="p-2 border border-slate-200 capitalize font-medium">{c.status.replace('_', ' ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      }

      case 'tabela_vgv': {
        const total = units.length;
        const vendidas = units.filter((u) => u.status === 'vendido').length;
        const reservadas = units.filter((u) => u.status === 'reservado').length;
        const disponiveis = units.filter((u) => u.status === 'disponivel').length;
        const vgvRealizado = units.filter((u) => u.status === 'vendido').reduce((acc, u) => acc + u.valorFinal, 0);

        return (
          <div className="space-y-6 text-slate-800">
            <div className="border-b-2 border-slate-800 pb-3 flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-slate-900 uppercase">
                  Relatório de Disponibilidade & VGV — 877 Unidades
                </h2>
                <p className="text-xs text-slate-600">Loteamento Jardim Vivência • Balanço Geral de Vendas</p>
              </div>
              <div className="text-right text-xs text-slate-500">
                <p className="font-semibold text-slate-800">OTS Master CRM</p>
                <p>{currentDate}</p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
                <span className="text-xs text-emerald-600">Unidades Vendidas:</span>
                <p className="text-xl font-bold text-emerald-800">{vendidas}</p>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-center">
                <span className="text-xs text-amber-600">Reservadas / Análise:</span>
                <p className="text-xl font-bold text-amber-800">{reservadas}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-center">
                <span className="text-xs text-blue-600">Disponíveis:</span>
                <p className="text-xl font-bold text-blue-800">{disponiveis}</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-center">
                <span className="text-xs text-purple-600">VGV Realizado:</span>
                <p className="text-lg font-bold text-purple-900">{formatCurrency(vgvRealizado)}</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <p className="font-bold text-slate-800 mb-1">Resumo das Quadras & Tipologias:</p>
              <p>• Total Geral do Empreendimento: 877 Lotes residenciais aprovados com registro de incorporação.</p>
              <p>• Faixas de Enquadramento: Grupo A (rendas até R$ 2.640,00 com subsídio estadual máximo), Grupo B (rendas até R$ 4.400,00) e Grupo C.</p>
            </div>
          </div>
        );
      }

      default:
        return (
          <div className="text-center py-8 text-slate-500">
            Selecione o tipo de relatório desejado acima.
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        {/* Modal Controls Header (Hidden in Print) */}
        <div className="no-print p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900 dark:text-white">
                Impressão & Exportação de PDF
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Gere PDFs oficiais com alta resolução e layout limpo
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              id="btn-confirm-print-pdf"
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Salvar PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Report Selector Tabs (Hidden in Print) */}
        <div className="no-print px-4 sm:px-5 py-2.5 bg-slate-100/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setReportType('proposta_simulador')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 ${
              reportType === 'proposta_simulador'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Proposta Simulador CEF</span>
          </button>

          <button
            onClick={() => setReportType('relatorio_roleta')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 ${
              reportType === 'relatorio_roleta'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            <Dices className="w-3.5 h-3.5" />
            <span>Relatório da Roleta</span>
          </button>

          <button
            onClick={() => setReportType('extrato_comissoes')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 ${
              reportType === 'extrato_comissoes'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            <Percent className="w-3.5 h-3.5" />
            <span>Extrato de Comissões</span>
          </button>

          <button
            onClick={() => setReportType('tabela_vgv')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 ${
              reportType === 'tabela_vgv'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>VGV & Disponibilidade</span>
          </button>
        </div>

        {/* Printable Canvas */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-white text-slate-900">
          <div ref={printRef} className="print-container max-w-3xl mx-auto">
            {renderPrintableContent()}
          </div>
        </div>

        {/* Footer info (Hidden in Print) */}
        <div className="no-print p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <Info className="w-4 h-4 text-emerald-600" />
            <span>Dica: Na janela de impressão, selecione <strong>"Salvar como PDF"</strong> para gerar o arquivo digital.</span>
          </div>
          <button
            onClick={handlePrint}
            className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Baixar em PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
