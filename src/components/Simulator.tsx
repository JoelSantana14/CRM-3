import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Unit, SimulationInput, UnitGroup, SavedSimulation } from '../types';
import { calculateSimulation, formatCurrency } from '../utils/simulatorEngine';
import { playNotificationChime } from '../utils/soundService';
import { useNumericInput } from '../hooks/useNumericInput';
import {
  Calculator,
  Building,
  DollarSign,
  Calendar,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Share2,
  Printer,
  Copy,
  Check,
  Unlock,
  Lock,
  ArrowRight,
  FileSpreadsheet,
  FileText,
  Layers,
  Sparkles,
  Send,
  Percent,
  Search,
  Download,
  FileDown,
  Wand2,
  Eye,
  BookmarkCheck,
  Save,
  Clock,
  Mail,
  MessageSquare,
  ExternalLink,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface SimulatorProps {
  onOpenPrintReport?: () => void;
}

export const Simulator: React.FC<SimulatorProps> = ({ onOpenPrintReport }) => {
  const {
    units,
    selectedUnitForSimulator,
    setSelectedUnitForSimulator,
    currentUser,
    settings,
    toggleSimuladorParaLideres,
    leads,
    updateLead,
    updateUnitStatus,
    logAction,
    setActiveTab,
    simulatorPolicyRules,
    addNotification,
    addProposalApprovalRequest,
  } = useApp();

  // Unit Selection
  const [selectedUnitId, setSelectedUnitId] = useState<string>(
    selectedUnitForSimulator?.id || (units.length > 0 ? units[0].id : '')
  );

  const activeUnit = units.find((u) => u.id === selectedUnitId);

  // Form Inputs
  const baseValor = activeUnit?.valorFinal || 205000;
  const [descontoValor, setDescontoValor] = useState<number>(0);
  const valorImovel = Math.max(0, baseValor - descontoValor);

  const [financiamentoCef, setFinanciamentoCef] = useState<number>(145000);
  const [fgts, setFgts] = useState<number>(12000);
  const [subsidioFederal, setSubsidioFederal] = useState<number>(35000);
  const [subsidioEstadual, setSubsidioEstadual] = useState<number>(settings.subsidioEstadualPadrao || 20000);
  const [taxaGestaoCef, setTaxaGestaoCef] = useState<number>(settings.taxaGestaoCefPadrao || 3500);
  const [rendaFamiliar, setRendaFamiliar] = useState<number>(3200);
  const [parcelaMaximaCliente, setParcelaMaximaCliente] = useState<number>(850);
  const [grupoFaixa, setGrupoFaixa] = useState<UnitGroup>(activeUnit?.grupo || 'Grupo B');

  // Acts and monthly installments
  const [ato1, setAto1] = useState<number>(2000);
  const [dataAto1, setDataAto1] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [ato2, setAto2] = useState<number>(2000);
  const [ato3, setAto3] = useState<number>(2000);
  const [diaMensais, setDiaMensais] = useState<number>(15);
  const [mensais1Qtd, setMensais1Qtd] = useState<number>(settings.maxParcelasConstrutora || 72);
  const [mensais1Valor, setMensais1Valor] = useState<number>(0);
  const [mensais2Qtd, setMensais2Qtd] = useState<number>(0);
  const [mensais2Valor, setMensais2Valor] = useState<number>(0);
  const [mensais3Qtd, setMensais3Qtd] = useState<number>(0);
  const [mensais3Valor, setMensais3Valor] = useState<number>(0);
  const [mensais4Qtd, setMensais4Qtd] = useState<number>(0);
  const [mensais4Valor, setMensais4Valor] = useState<number>(0);
  const [parcelaComplementar, setParcelaComplementar] = useState<number>(0);

  // Custom hooks for inputs in Simulator
  const hookDesconto = useNumericInput({ initialValue: 0, onChange: setDescontoValor });
  const hookFinancCef = useNumericInput({ initialValue: 145000, onChange: setFinanciamentoCef });
  const hookFgts = useNumericInput({ initialValue: 12000, onChange: setFgts });
  const hookSubsFederal = useNumericInput({ initialValue: 35000, onChange: setSubsidioFederal });
  const hookSubsEstadual = useNumericInput({ initialValue: settings.subsidioEstadualPadrao || 20000, onChange: setSubsidioEstadual });
  const hookTaxaGestao = useNumericInput({ initialValue: settings.taxaGestaoCefPadrao || 3500, onChange: setTaxaGestaoCef });
  const hookRenda = useNumericInput({ initialValue: 3200, onChange: setRendaFamiliar });
  const hookParcelaMax = useNumericInput({ initialValue: 850, onChange: setParcelaMaximaCliente });
  const hookAto1 = useNumericInput({ initialValue: 2000, onChange: setAto1 });
  const hookAto2 = useNumericInput({ initialValue: 2000, onChange: setAto2 });
  const hookAto3 = useNumericInput({ initialValue: 2000, onChange: setAto3 });
  
  const hookMensais1Qtd = useNumericInput({ initialValue: settings.maxParcelasConstrutora || 72, onChange: setMensais1Qtd, isCurrency: false });
  const hookMensais2Qtd = useNumericInput({ initialValue: 0, onChange: setMensais2Qtd, isCurrency: false });
  const hookMensais3Qtd = useNumericInput({ initialValue: 0, onChange: setMensais3Qtd, isCurrency: false });
  const hookMensais4Qtd = useNumericInput({ initialValue: 0, onChange: setMensais4Qtd, isCurrency: false });

  const hookMensais1Valor = useNumericInput({ initialValue: 0, onChange: setMensais1Valor });
  const hookMensais2Valor = useNumericInput({ 
    initialValue: 0, 
    onChange: (val) => {
      setMensais2Valor(val);
      if (val > 0 && mensais2Qtd === 0) {
        setMensais2Qtd(12);
        hookMensais2Qtd.setDirectValue(12);
      }
    } 
  });
  const hookMensais3Valor = useNumericInput({ 
    initialValue: 0, 
    onChange: (val) => {
      setMensais3Valor(val);
      if (val > 0 && mensais3Qtd === 0) {
        setMensais3Qtd(12);
        hookMensais3Qtd.setDirectValue(12);
      }
    } 
  });
  const hookMensais4Valor = useNumericInput({ 
    initialValue: 0, 
    onChange: (val) => {
      setMensais4Valor(val);
      if (val > 0 && mensais4Qtd === 0) {
        setMensais4Qtd(12);
        hookMensais4Qtd.setDirectValue(12);
      }
    } 
  });
  const hookComplementar = useNumericInput({ initialValue: 0, onChange: setParcelaComplementar });

  // Link to lead
  const [targetLeadId, setTargetLeadId] = useState<string>('');
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);
  const [savedToLead, setSavedToLead] = useState(false);
  const [saveSuccessNotification, setSaveSuccessNotification] = useState<string | null>(null);

  // Filter & Search for Schedule Preview
  const [parcelaFilter, setParcelaFilter] = useState<'todas' | 'atos' | 'mensais' | 'complementar'>('todas');
  const [parcelaSearch, setParcelaSearch] = useState<string>('');

  // Print Preview Modal State
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Approval Modal State
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [approvalJustification, setApprovalJustification] = useState('');
  const [approvalSubmitted, setApprovalSubmitted] = useState(false);

  // Update when activeUnit changes
  useEffect(() => {
    if (activeUnit) {
      setGrupoFaixa(activeUnit.grupo);
    }
  }, [activeUnit]);

  // If selectedUnitForSimulator exists on load
  useEffect(() => {
    if (selectedUnitForSimulator) {
      setSelectedUnitId(selectedUnitForSimulator.id);
      setGrupoFaixa(selectedUnitForSimulator.grupo);
    }
  }, [selectedUnitForSimulator]);

  // Real-time calculation
  const simulationInput: SimulationInput = {
    unitId: selectedUnitId,
    valorImovel,
    nomeSubsidioEstadual: settings.nomeSubsidioEstadual || 'Estadual',
    financiamentoCef,
    fgts,
    subsidioFederal,
    subsidioEstadual,
    ato1,
    dataAto1,
    ato2,
    ato3,
    diaMensais,
    mensais1Qtd,
    mensais1Valor,
    mensais2Qtd,
    mensais2Valor,
    mensais3Qtd,
    mensais3Valor,
    mensais4Qtd,
    mensais4Valor,
    parcelaMaximaCliente,
    rendaFamiliar,
    taxaGestaoCef,
    grupoFaixa,
    parcelaComplementar,
  };

  const result = calculateSimulation(simulationInput, simulatorPolicyRules);

  const parcelaMinimaConfig = settings.parcelaMinimaConstrutora || 350;
  const isParcelaBaixa = result.valorParcelaMensal < parcelaMinimaConfig;

  // Copy WhatsApp Proposal
  const handleCopyWhatsApp = () => {
    const mensaisMsg = [
      mensais1Qtd > 0 ? `- *Mensais 1:* ${mensais1Qtd}x de ${formatCurrency(mensais1Valor || result.valorParcelaMensal)}` : '',
      mensais2Qtd > 0 ? `- *Mensais 2:* ${mensais2Qtd}x de ${formatCurrency(mensais2Valor)}` : '',
      mensais3Qtd > 0 ? `- *Mensais 3:* ${mensais3Qtd}x de ${formatCurrency(mensais3Valor)}` : '',
      mensais4Qtd > 0 ? `- *Mensais 4:* ${mensais4Qtd}x de ${formatCurrency(mensais4Valor)}` : '',
      (mensais1Qtd === 0 && mensais2Qtd === 0 && mensais3Qtd === 0 && mensais4Qtd === 0 && result.qtdMensais) ? `- *Mensais:* ${result.qtdMensais}x de ${formatCurrency(result.valorParcelaMensal)}` : ''
    ].filter(Boolean).join('\n');

    const unitText = activeUnit ? `${activeUnit.quadra} - ${activeUnit.lote} (${activeUnit.rua})` : settings.nomeEmpreendimento;
    const text = `🏡 *PROPOSTA OFICIAL DE FINANCIAMENTO - ${settings.nomeEmpreendimento.toUpperCase()}*
📍 *Empreendimento:* ${settings.nomeEmpreendimento}
📋 *Unidade Escolhida:* ${unitText}
💰 *Valor do Imóvel:* ${formatCurrency(valorImovel)} ${descontoValor > 0 ? `(Com Desconto de ${formatCurrency(descontoValor)})` : ''}
🏛️ *Financiamento Caixa (CEF):* ${formatCurrency(financiamentoCef)}

🎁 *SUBSÍDIOS CONQUISTADOS:*
- Subsídio Federal MCMV: ${formatCurrency(subsidioFederal)}
- Subsídio Estadual: ${formatCurrency(subsidioEstadual)}
- Uso do FGTS: ${formatCurrency(fgts)}

🔑 *FLUXO FLEXÍVEL DE ENTRADA:*
- Taxa Gestão CEF: ${formatCurrency(taxaGestaoCef)}
- *Entrada Líquida Total:* ${formatCurrency(result.totalEntradaNecessaria)}
- *Ato 1 (no contrato):* ${formatCurrency(ato1)} em ${result.cronograma[0]?.data || dataAto1}
- *Ato 2 (30 dias):* ${formatCurrency(ato2)}
- *Ato 3 (60 dias):* ${formatCurrency(ato3)}
${mensaisMsg} (Vencimento todo dia ${diaMensais})
${parcelaComplementar > 0 ? `- *Parcela Complementar:* ${formatCurrency(parcelaComplementar)}\n` : ''}
✅ *Status de Viabilidade:* ${result.viabilidade.statusViabilidade === 'aprovado' ? '100% Aprovado e Compatível!' : 'Análise Especial Disponível'}

*Vamos garantir a sua unidade hoje mesmo no plantão?*
Corretor Responsável: ${currentUser.name} (CRECI: ${currentUser.creci})`;

    navigator.clipboard.writeText(text);
    setCopiedWhatsApp(true);
    setTimeout(() => setCopiedWhatsApp(false), 3000);
    logAction('Proposta Compartilhada via WhatsApp', 'Simulador CEF', `Proposta gerada para a unidade ${unitText}.`);
  };

  // Auto adjust remaining balance to complementary
  const handleAutoAdjustComplementar = () => {
    if (result.saldoRestante > 0) {
      setParcelaComplementar((prev) => Math.round((prev + result.saldoRestante) * 100) / 100);
    }
  };

  // Filtered Cronograma for Preview
  const filteredCronograma = useMemo(() => {
    if (!result || !result.cronograma) return [];
    return result.cronograma.filter((item) => {
      const blocoLower = (item.bloco || '').toLowerCase();
      // Category filter
      if (parcelaFilter === 'atos' && !blocoLower.includes('ato')) return false;
      if (parcelaFilter === 'mensais' && !blocoLower.includes('mensa')) return false;
      if (parcelaFilter === 'complementar' && !blocoLower.includes('complem')) return false;

      // Search filter
      if (parcelaSearch.trim()) {
        const query = parcelaSearch.toLowerCase();
        const matchesBloco = blocoLower.includes(query);
        const matchesData = (item.data || '').toLowerCase().includes(query);
        const matchesValor = (item.valor ?? 0).toString().includes(query);
        const matchesNum = item.numero !== undefined && item.numero !== null ? item.numero.toString().includes(query) : false;
        if (!matchesBloco && !matchesData && !matchesValor && !matchesNum) return false;
      }

      return true;
    });
  }, [result?.cronograma, parcelaFilter, parcelaSearch]);

  // Save Flow / Proposal
  const handleSaveProposal = () => {
    const unitText = activeUnit ? `${activeUnit.quadra} - ${activeUnit.lote}` : 'Unidade Simulada';
    const targetLead = leads.find((l) => l.id === targetLeadId);

    const nowStr = new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
    const newSimulation: SavedSimulation = {
      id: 'sim-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      data: nowStr,
      unidadeId: selectedUnitId,
      unidadeInfo: unitText,
      valorImovel,
      financiamentoCef,
      fgts,
      subsidioFederal,
      subsidioEstadual,
      totalEntradaNecessaria: result.totalEntradaNecessaria,
      ato1,
      ato2,
      ato3,
      qtdMensais: result.qtdMensais,
      valorParcelaMensal: result.valorParcelaMensal,
      parcelaComplementar,
      rendaFamiliar,
      statusViabilidade: result.viabilidade.statusViabilidade === 'alerta' ? 'atencao' : result.viabilidade.statusViabilidade,
      mensagemViabilidade: result.viabilidade.mensagens.join('; '),
      criadoPorNome: currentUser.name,
      inputSnapshot: simulationInput,
    };

    if (targetLeadId && targetLead) {
      const existingSims = targetLead.simulacoes || [];
      updateLead(targetLeadId, {
        unidadeInteresseId: selectedUnitId,
        unidadeInteresseInfo: unitText,
        valorSimulacao: valorImovel,
        rendaFamiliar: rendaFamiliar,
        fgts: fgts,
        simulacoes: [newSimulation, ...existingSims],
      });
      setSavedToLead(true);
      setTimeout(() => setSavedToLead(false), 3000);
    }

    logAction(
      'Fluxo de Pagamento Salvo',
      'Simulador CEF',
      `Fluxo validado e salvo para ${targetLead ? targetLead.nome : unitText}. Total Entrada: ${formatCurrency(result.totalEntradaNecessaria)}, ${result.cronograma.length} parcelas programadas.`
    );

    setSaveSuccessNotification(
      `✓ Simulação salva com sucesso${targetLead ? ` na pasta de ${targetLead.nome}` : ''}! (${result.cronograma.length} parcelas programadas)`
    );
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    setTimeout(() => setSaveSuccessNotification(null), 4000);
  };

  // Direct Print & PDF
  const handleDirectPrint = () => {
    window.print();
  };

  const [submittedApprovalData, setSubmittedApprovalData] = useState<{
    mailtoUrl: string;
    whatsappUrl: string;
    recipients: string;
  } | null>(null);

  const handleSendApprovalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const leadObj = targetLeadId ? leads.find((l) => l.id === targetLeadId) : null;
    const proponenteNome = leadObj ? leadObj.nome : 'Proponente Comercial';
    const unitText = activeUnit ? `Quadra ${activeUnit.quadra} - Lote ${activeUnit.lote}` : 'Unidade Padrão';
    const recipientsList =
      Array.isArray(settings.emailsAprovacaoDiretoria) && settings.emailsAprovacaoDiretoria.length > 0
        ? settings.emailsAprovacaoDiretoria.join(', ')
        : 'joelsantanaimoveis@gmail.com, diretoria@otsmaster.com.br';

    if (activeUnit) {
      updateUnitStatus(activeUnit.id, 'analise', proponenteNome, currentUser.name);
    }

    const valorTabela = activeUnit ? activeUnit.valorFinal : valorImovel;
    const descReq = descontoValor || 0;
    const finalProp = valorImovel - descReq;
    const descPerc = valorTabela > 0 ? (descReq / valorTabela) * 100 : 0;

    addProposalApprovalRequest({
      propostaId: `prop-${Date.now()}`,
      unitId: activeUnit ? activeUnit.id : 'unidade-generica',
      unidadeIdentificacao: unitText,
      clienteId: targetLeadId || 'cliente-generico',
      clienteNome: proponenteNome,
      clienteTelefone: leadObj ? leadObj.telefone : '',
      corretorId: currentUser.id,
      corretorNome: currentUser.name,
      equipeNome: currentUser.teamId || 'Vendas Geral',
      valorTabela,
      descontoRequisitado: descReq,
      descontoPercentual: descPerc,
      valorFinalProposta: finalProp,
      qtdParcelasConstrutora: mensais1Qtd || 12,
      valorParcelaMensal: mensais1Valor || 0,
      parcelaMinimaViolada: false,
      rendaFamiliar: rendaFamiliar || 0,
      justificativa: approvalJustification || 'Condições diferenciadas solicitadas no simulador.',
      emailsNotificados: recipientsList.split(',').map((e) => e.trim()),
    });

    // Play chime audio
    playNotificationChime('approval');

    // Create system notification for admins/board
    const notifMsg = `Proposta enviada por ${currentUser.name} para ${proponenteNome} (${unitText}). Justificativa: ${approvalJustification || 'Condições especiais.'}`;
    addNotification({
      tipo: 'aprovacao_diretoria',
      titulo: '🚨 Solicitação de Aprovação da Diretoria',
      mensagem: notifMsg,
      destinatarioRole: 'admin',
      leadId: targetLeadId || undefined,
      leadNome: proponenteNome,
      linkTab: 'simulator',
    });

    logAction(
      'Envio de Proposta para Aprovação da Diretoria',
      'Simulador',
      `Proposta enviada para ${recipientsList}. Justificativa: ${approvalJustification || 'Condições especiais.'}`
    );

    // Build Mailto URL
    const subject = encodeURIComponent(`[SOLICITAÇÃO DE APROVAÇÃO] Proposta Comercial - ${settings.nomeEmpreendimento} (${unitText})`);
    const emailBody = encodeURIComponent(
      `Olá Diretoria,\n\n` +
        `Solicito a aprovação de proposta comercial para o empreendimento ${settings.nomeEmpreendimento}.\n\n` +
        `👤 Corretor Solicitante: ${currentUser.name} (${currentUser.role})\n` +
        `📋 Proponente: ${proponenteNome}\n` +
        `🏡 Unidade: ${unitText}\n` +
        `💰 Valor do Imóvel: R$ ${valorImovel.toLocaleString('pt-BR')}\n` +
        `📝 Justificativa/Condição Especial: ${approvalJustification || 'Condições diferenciadas solicitadas.'}\n\n` +
        `Data/Hora: ${new Date().toLocaleString('pt-BR')}\n\n` +
        `Por favor, acesse o CRM ou responda este e-mail para autorizar.`
    );
    const mailtoUrl = `mailto:${recipientsList}?subject=${subject}&body=${emailBody}`;

    // Build WhatsApp URL
    const whatsappText = encodeURIComponent(
      `🚨 *SOLICITAÇÃO DE APROVAÇÃO DA DIRETORIA*\n\n` +
        `🏡 *Empreendimento:* ${settings.nomeEmpreendimento}\n` +
        `👤 *Corretor Solicitante:* ${currentUser.name}\n` +
        `📋 *Proponente:* ${proponenteNome}\n` +
        `📍 *Unidade:* ${unitText}\n` +
        `💰 *Valor Imóvel:* R$ ${valorImovel.toLocaleString('pt-BR')}\n` +
        `📝 *Justificativa:* ${approvalJustification || 'Condições especiais.'}\n\n` +
        `Por favor, acesse o CRM para autorizar.`
    );
    const whatsappUrl = `https://wa.me/?text=${whatsappText}`;

    setSubmittedApprovalData({
      mailtoUrl,
      whatsappUrl,
      recipients: recipientsList,
    });
    setApprovalSubmitted(true);
  };

  // Access Control
  if (currentUser.role !== 'admin' && !settings.liberarSimuladorParaLideres) {
    return (
      <div className="p-4 lg:p-12 max-w-3xl mx-auto text-center space-y-6">
        <div className="bg-white dark:bg-slate-900 p-8 sm:p-12 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 mx-auto flex items-center justify-center">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Acesso Restrito: Simulador CEF</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
              O Simulador de Propostas do empreendimento <strong>{settings.nomeEmpreendimento}</strong> fica visível somente para o Administrador por padrão, que pode liberar aos líderes.
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
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Simulador de Financiamento CEF</h1>
            <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
              {settings.nomeEmpreendimento}
            </span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Cálculo oficial de Gestão CEF, Entrada Líquida, Fluxo de Atos e Mensais customizáveis até {settings.maxParcelasConstrutora || 72}x.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setActiveTab('regras_simulador')}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700"
          >
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            <span>Regras ({simulatorPolicyRules.length})</span>
          </button>

          {onOpenPrintReport && (
            <button
              id="btn-print-simulator-proposal"
              onClick={onOpenPrintReport}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / PDF</span>
            </button>
          )}

          <button
            id="btn-copy-proposal-whatsapp"
            onClick={handleCopyWhatsApp}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
          >
            {copiedWhatsApp ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copiedWhatsApp ? 'Copiado!' : 'WhatsApp'}</span>
          </button>

          <button
            onClick={() => setActiveTab('gerador_contrato')}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
          >
            <FileText className="w-4 h-4" />
            <span>Gerar Contrato</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Inputs */}
        <div className="lg:col-span-7 space-y-6">
          {/* Unit Selector & Discount */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Building className="w-4 h-4 text-emerald-600" />
              <span>1. Escolha da Unidade & Desconto Comercial</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Unidade do Empreendimento:</label>
                <select
                  value={selectedUnitId}
                  onChange={(e) => setSelectedUnitId(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.quadra} - {u.lote} • {formatCurrency(u.valorFinal)} ({u.grupo})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Desconto Concedido:</label>
                <input
                  type="text"
                  value={hookDesconto.displayValue}
                  onChange={hookDesconto.onChange}
                  placeholder="R$ 0,00"
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-amber-600"
                />
              </div>
            </div>

            {activeUnit && (
              <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-900 dark:text-emerald-300 flex items-center justify-between">
                <div>
                  <span className="font-bold">{activeUnit.rua}</span>
                  <span className="text-emerald-700 dark:text-emerald-400 ml-2">({activeUnit.areaTerreno || activeUnit.areaLote}m² lote)</span>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-500 line-through">{formatCurrency(activeUnit.valorFinal)}</div>
                  <div className="font-bold text-emerald-800 dark:text-emerald-200 text-sm">{formatCurrency(valorImovel)} (Valor Líquido)</div>
                </div>
              </div>
            )}
          </div>

          {/* Financial Inputs */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>2. Financiamento, FGTS e Subsídios</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Financiamento Caixa (CEF):</label>
                <input
                  type="text"
                  value={hookFinancCef.displayValue}
                  onChange={hookFinancCef.onChange}
                  placeholder="R$ 0,00"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-emerald-700"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Saldo FGTS Proponente:</label>
                <input
                  type="text"
                  value={hookFgts.displayValue}
                  onChange={hookFgts.onChange}
                  placeholder="R$ 0,00"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Subsídio Federal (MCMV):</label>
                <input
                  type="text"
                  value={hookSubsFederal.displayValue}
                  onChange={hookSubsFederal.onChange}
                  placeholder="R$ 0,00"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-blue-700"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Subsídio Estadual / Programa:</label>
                <input
                  type="text"
                  value={hookSubsEstadual.displayValue}
                  onChange={hookSubsEstadual.onChange}
                  placeholder="R$ 0,00"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-emerald-700"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Taxa Gestão CEF / Despachante:</label>
                <input
                  type="text"
                  value={hookTaxaGestao.displayValue}
                  onChange={hookTaxaGestao.onChange}
                  placeholder="R$ 0,00"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Renda Familiar Bruta Comprovada:</label>
                <input
                  type="text"
                  value={hookRenda.displayValue}
                  onChange={hookRenda.onChange}
                  placeholder="R$ 0,00"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Parcela Máxima p/ Cliente:</label>
                <input
                  type="text"
                  value={hookParcelaMax.displayValue}
                  onChange={hookParcelaMax.onChange}
                  placeholder="R$ 0,00"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Payment Flow: Atos & Uncapped Monthly Installments */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 text-xs">
            <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>3. Fluxo de Entrada: Atos e Parcelas Mensais (Até {settings.maxParcelasConstrutora || 72}x)</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Ato 1:</label>
                <input
                  type="text"
                  value={hookAto1.displayValue}
                  onChange={hookAto1.onChange}
                  placeholder="R$ 0,00"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Data do Ato 1:</label>
                <input
                  type="date"
                  value={dataAto1}
                  onChange={(e) => setDataAto1(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Ato 2 (+30 dias):</label>
                <input
                  type="text"
                  value={hookAto2.displayValue}
                  onChange={hookAto2.onChange}
                  placeholder="R$ 0,00"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Ato 3 (+60 dias):</label>
                <input
                  type="text"
                  value={hookAto3.displayValue}
                  onChange={hookAto3.onChange}
                  placeholder="R$ 0,00"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Dia Vencimento Mensais:</label>
                <select
                  value={diaMensais}
                  onChange={(e) => setDiaMensais(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value={5}>Dia 05</option>
                  <option value={10}>Dia 10</option>
                  <option value={15}>Dia 15</option>
                  <option value={20}>Dia 20</option>
                  <option value={25}>Dia 25</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-3 border-t border-slate-100 dark:border-slate-800 pt-3">
              <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Mensais 1</label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] text-slate-400">Qtd</label>
                    <input
                      type="text"
                      value={hookMensais1Qtd.displayValue}
                      onChange={hookMensais1Qtd.onChange}
                      className="w-full px-2 py-1 text-sm rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 focus:ring-1 focus:ring-emerald-500"
                      placeholder="0"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] text-slate-400">Valor</label>
                    <input
                      type="text"
                      value={hookMensais1Valor.displayValue}
                      onChange={hookMensais1Valor.onChange}
                      className="w-full px-2 py-1 text-sm rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 focus:ring-1 focus:ring-emerald-500"
                      placeholder="Automático"
                    />
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Mensais 2</label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] text-slate-400">Qtd</label>
                    <input
                      type="text"
                      value={hookMensais2Qtd.displayValue}
                      onChange={hookMensais2Qtd.onChange}
                      className="w-full px-2 py-1 text-sm rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 focus:ring-1 focus:ring-emerald-500"
                      placeholder="0"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] text-slate-400">Valor</label>
                    <input
                      type="text"
                      value={hookMensais2Valor.displayValue}
                      onChange={hookMensais2Valor.onChange}
                      className="w-full px-2 py-1 text-sm rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 focus:ring-1 focus:ring-emerald-500"
                      placeholder="R$ 0,00"
                    />
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Mensais 3</label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] text-slate-400">Qtd</label>
                    <input
                      type="text"
                      value={hookMensais3Qtd.displayValue}
                      onChange={hookMensais3Qtd.onChange}
                      className="w-full px-2 py-1 text-sm rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 focus:ring-1 focus:ring-emerald-500"
                      placeholder="0"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] text-slate-400">Valor</label>
                    <input
                      type="text"
                      value={hookMensais3Valor.displayValue}
                      onChange={hookMensais3Valor.onChange}
                      className="w-full px-2 py-1 text-sm rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 focus:ring-1 focus:ring-emerald-500"
                      placeholder="R$ 0,00"
                    />
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Mensais 4</label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] text-slate-400">Qtd</label>
                    <input
                      type="text"
                      value={hookMensais4Qtd.displayValue}
                      onChange={hookMensais4Qtd.onChange}
                      className="w-full px-2 py-1 text-sm rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 focus:ring-1 focus:ring-emerald-500"
                      placeholder="0"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] text-slate-400">Valor</label>
                    <input
                      type="text"
                      value={hookMensais4Valor.displayValue}
                      onChange={hookMensais4Valor.onChange}
                      className="w-full px-2 py-1 text-sm rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 focus:ring-1 focus:ring-emerald-500"
                      placeholder="R$ 0,00"
                    />
                  </div>
                </div>
              </div>
              
              <div className="sm:col-span-2 bg-indigo-50 dark:bg-indigo-950/40 p-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800 flex items-center justify-between gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-indigo-700 dark:text-indigo-400 uppercase mb-1">Parcela Complementar</label>
                  <span className="text-xs text-indigo-600/70 dark:text-indigo-400/70 leading-tight">Valor para fechamento do saldo (geralmente cobrado nas chaves).</span>
                </div>
                <div className="w-1/3">
                  <input
                    type="text"
                    value={hookComplementar.displayValue}
                    onChange={hookComplementar.onChange}
                    placeholder="R$ 0,00"
                    className="w-full px-2 py-1 text-sm rounded bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-700 focus:ring-1 focus:ring-indigo-500 font-semibold"
                  />
                </div>
              </div>
            </div>

            {isParcelaBaixa && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>Atenção: A parcela mensal ({formatCurrency(result.valorParcelaMensal)}) está abaixo da parcela mínima configurada pela construtora ({formatCurrency(parcelaMinimaConfig)}).</span>
              </div>
            )}
          </div>

          {/* Real-time Installments Preview & Validation Section */}
          <div id="secao-preview-fluxo" className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Visualização Prévia de Todas as Parcelas</h3>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    {result.cronograma.length} parcelas
                  </span>
                </div>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Acompanhe a relação completa de parcelas geradas antes de salvar ou imprimir.
                </p>
              </div>

              {/* Action Buttons in Preview Header */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveProposal}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Salvar Fluxo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir / PDF</span>
                </button>
              </div>
            </div>

            {/* Notification Banner when saved */}
            {saveSuccessNotification && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-700 rounded-xl text-emerald-800 dark:text-emerald-200 flex items-center justify-between animate-fadeIn">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span className="font-semibold">{saveSuccessNotification}</span>
                </div>
                <button onClick={() => setSaveSuccessNotification(null)} className="text-emerald-700 hover:text-emerald-900 text-xs">✕</button>
              </div>
            )}

            {/* Validation Status Card */}
            {result.saldoRestante === 0 ? (
              <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/50 border border-emerald-300 dark:border-emerald-700 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-emerald-900 dark:text-emerald-200 text-sm">Fluxo 100% Validado e Fechado!</h4>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200">
                        Tudo OK
                      </span>
                    </div>
                    <p className="text-emerald-800/90 dark:text-emerald-300/90 text-xs mt-0.5">
                      A soma dos Atos, Mensais e Complementar fecha com exatidão a entrada de <strong>{formatCurrency(result.totalEntradaNecessaria)}</strong>.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsPrintModalOpen(true)}
                    className="w-full sm:w-auto px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Imprimir Proposta</span>
                  </button>
                </div>
              </div>
            ) : result.saldoRestante > 0 ? (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-amber-900 dark:text-amber-200 text-sm">
                      Atenção: Saldo a Descoberto de {formatCurrency(result.saldoRestante)}
                    </h4>
                    <p className="text-amber-800 dark:text-amber-300 text-xs mt-0.5">
                      Falta alocar <strong>{formatCurrency(result.saldoRestante)}</strong> no fluxo para cobrir a entrada de {formatCurrency(result.totalEntradaNecessaria)}.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAutoAdjustComplementar}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white flex items-center justify-center gap-1.5 shadow-xs transition-colors whitespace-nowrap"
                  title="Alocar a diferença na parcela complementar automaticamente"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Completar na Complementar (+{formatCurrency(result.saldoRestante)})</span>
                </button>
              </div>
            ) : (
              <div className="p-4 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-300 dark:border-indigo-700 rounded-2xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-indigo-900 dark:text-indigo-200 text-sm">
                    Total Programado Excede a Entrada em {formatCurrency(Math.abs(result.saldoRestante))}
                  </h4>
                  <p className="text-indigo-800 dark:text-indigo-300 text-xs mt-0.5">
                    O total montado ({formatCurrency(result.totalAtos + result.totalMensais + result.parcelaComplementar)}) ultrapassa a entrada necessária de {formatCurrency(result.totalEntradaNecessaria)}.
                  </p>
                </div>
              </div>
            )}

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-500 font-semibold uppercase block">Entrada Necessária</span>
                <strong className="text-xs sm:text-sm text-slate-900 dark:text-white font-bold">{formatCurrency(result.totalEntradaNecessaria)}</strong>
              </div>
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-500 font-semibold uppercase block">Total Atos (1, 2 e 3)</span>
                <strong className="text-xs sm:text-sm text-emerald-700 dark:text-emerald-400 font-bold">{formatCurrency(result.totalAtos)}</strong>
              </div>
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-500 font-semibold uppercase block">Total Mensais</span>
                <strong className="text-xs sm:text-sm text-blue-700 dark:text-blue-400 font-bold">{formatCurrency(result.totalMensais)} ({result.qtdMensais}x)</strong>
              </div>
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-500 font-semibold uppercase block">Total Programado</span>
                <strong className="text-xs sm:text-sm text-indigo-700 dark:text-indigo-400 font-bold">
                  {formatCurrency(result.totalAtos + result.totalMensais + result.parcelaComplementar)}
                </strong>
              </div>
            </div>

            {/* Filters and Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-1">
              <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                <button
                  type="button"
                  onClick={() => setParcelaFilter('todas')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    parcelaFilter === 'todas'
                      ? 'bg-slate-900 text-white dark:bg-emerald-600'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  Todas ({result.cronograma.length})
                </button>
                <button
                  type="button"
                  onClick={() => setParcelaFilter('atos')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    parcelaFilter === 'atos'
                      ? 'bg-slate-900 text-white dark:bg-emerald-600'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  Atos
                </button>
                <button
                  type="button"
                  onClick={() => setParcelaFilter('mensais')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    parcelaFilter === 'mensais'
                      ? 'bg-slate-900 text-white dark:bg-emerald-600'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  Mensais ({result.qtdMensais}x)
                </button>
                {result.parcelaComplementar > 0 && (
                  <button
                    type="button"
                    onClick={() => setParcelaFilter('complementar')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                      parcelaFilter === 'complementar'
                        ? 'bg-slate-900 text-white dark:bg-emerald-600'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    Complementar
                  </button>
                )}
              </div>

              <div className="relative w-full sm:w-56">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={parcelaSearch}
                  onChange={(e) => setParcelaSearch(e.target.value)}
                  placeholder="Buscar por data, valor..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Installments Table */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
              <div className="max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Etapa / Bloco</th>
                      <th className="py-2.5 px-3">Data de Vencimento</th>
                      <th className="py-2.5 px-3 text-right">Valor da Parcela</th>
                      <th className="py-2.5 px-3 text-right">% Entrada</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                    {filteredCronograma.length > 0 ? (
                      filteredCronograma.map((item, index) => {
                        const itemValor = typeof item.valor === 'number' && !isNaN(item.valor) ? item.valor : 0;
                        const pctEntrada = (result.totalEntradaNecessaria > 0 && itemValor > 0)
                          ? ((itemValor / result.totalEntradaNecessaria) * 100).toFixed(1)
                          : '0.0';

                        const blocoLower = (item.bloco || '').toLowerCase();
                        const isAto = blocoLower.includes('ato');
                        const isComplementar = blocoLower.includes('complem');
                        const isM1 = blocoLower.includes('1');
                        const isM2 = blocoLower.includes('2');
                        const isM3 = blocoLower.includes('3');
                        const isM4 = blocoLower.includes('4');

                        return (
                          <tr key={index} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="py-2 px-3 font-mono text-slate-400 text-[11px]">{index + 1}</td>
                            <td className="py-2 px-3">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-bold text-[10px] ${
                                  isAto
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                    : isComplementar
                                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                                    : isM2
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                    : isM3
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                    : isM4
                                    ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                                    : 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
                                }`}
                              >
                                {item.bloco} {item.numero ? `#${item.numero}` : ''}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-slate-700 dark:text-slate-300 font-medium">
                              {item.data}
                            </td>
                            <td className="py-2 px-3 text-right font-bold text-slate-900 dark:text-white">
                              {formatCurrency(item.valor)}
                            </td>
                            <td className="py-2 px-3 text-right text-slate-500 font-mono text-[11px]">
                              {pctEntrada}%
                            </td>
                            <td className="py-2 px-3 text-center">
                              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full">
                                <Check className="w-3 h-3" />
                                <span>Programada</span>
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                          Nenhuma parcela encontrada para o filtro selecionado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white">
                    <tr>
                      <td colSpan={3} className="py-2.5 px-3">
                        Total das Parcelas ({filteredCronograma.length} itens)
                      </td>
                      <td className="py-2.5 px-3 text-right text-emerald-700 dark:text-emerald-400">
                        {formatCurrency(filteredCronograma.reduce((acc, item) => acc + item.valor, 0))}
                      </td>
                      <td colSpan={2} className="py-2.5 px-3 text-right text-slate-500 text-[11px]">
                        {result.saldoRestante === 0 ? '✓ 100% Quitado' : `Saldo: ${formatCurrency(result.saldoRestante)}`}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Bottom Action Ribbon */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="btn-save-flow-main"
                  onClick={handleSaveProposal}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar Fluxo de Pagamento</span>
                </button>

                <button
                  type="button"
                  id="btn-print-flow-main"
                  onClick={() => setIsPrintModalOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir / Salvar em PDF</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyWhatsApp}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition-colors"
                >
                  {copiedWhatsApp ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedWhatsApp ? 'Copiado WhatsApp!' : 'Copiar WhatsApp'}</span>
                </button>

                {currentUser.role === 'admin' && (
                  <button
                    type="button"
                    onClick={() => setIsApprovalModalOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl font-bold bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Aprovação Diretoria</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Link to Lead / CRM Action */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="w-full sm:w-auto flex-1">
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Vincular a um Lead do CRM:</label>
              <select
                value={targetLeadId}
                onChange={(e) => setTargetLeadId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="">Selecione um cliente do CRM...</option>
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.nome} ({l.telefone})
                  </option>
                ))}
              </select>
            </div>

            <button
              disabled={!targetLeadId}
              onClick={handleSaveProposal}
              className="w-full sm:w-auto mt-4 sm:mt-0 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 shadow-xs"
            >
              {savedToLead ? <Check className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
              <span>{savedToLead ? 'Salvo no CRM!' : 'Salvar no CRM'}</span>
            </button>
          </div>
        </div>

        {/* Right Output: Calculations & Schedule */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Resultado Oficial do Fluxo</h2>
              <span className="font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800">
                {settings.nomeEmpreendimento}
              </span>
            </div>

            <div className="space-y-2.5">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Valor Imóvel (Líquido):</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{formatCurrency(result.valorImovel)}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800 text-emerald-700">
                <span>Total de Subsídios:</span>
                <span className="font-bold">- {formatCurrency(result.totalSubsidios)}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800 text-blue-700">
                <span>Financiamento CEF + FGTS:</span>
                <span className="font-bold">- {formatCurrency(financiamentoCef + fgts)}</span>
              </div>

              <div className="flex justify-between py-2.5 bg-emerald-50 dark:bg-emerald-950/60 px-3 rounded-xl border border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-300 font-bold">
                <span>Entrada Líquida Necessária:</span>
                <span className="text-sm">{formatCurrency(result.totalEntradaNecessaria)}</span>
              </div>

              <div className="flex justify-between py-2 bg-slate-900 dark:bg-slate-800 text-white px-3 rounded-xl font-bold">
                <span>{result.qtdMensais}x Parcelas Mensais:</span>
                <span className="text-sm text-emerald-400">Total {formatCurrency(result.totalMensais)}</span>
              </div>
              {result.parcelaComplementar > 0 && (
                <div className="flex justify-between py-2 bg-indigo-900 text-white px-3 rounded-xl font-bold">
                  <span>Parcela Complementar:</span>
                  <span className="text-sm text-indigo-300">{formatCurrency(result.parcelaComplementar)}</span>
                </div>
              )}
              {result.saldoRestante > 0 && (
                <div className="flex justify-between py-2 bg-rose-900 text-white px-3 rounded-xl font-bold">
                  <span>Saldo a Descoberto (Falta pagar):</span>
                  <span className="text-sm text-rose-300">{formatCurrency(result.saldoRestante)}</span>
                </div>
              )}
            </div>

            {/* Schedule Dates Breakdown */}
            <div className="space-y-3 pt-2">
              <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider">Cronograma de Vencimento</h3>
              <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                {result.cronograma.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                        {item.bloco} {item.numero ? `#${item.numero}` : ''}
                      </span>
                      <span className="text-slate-600 dark:text-slate-300">{item.data}</span>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(item.valor)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Approval Modal */}
      {isApprovalModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 text-xs">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Enviar Proposta para Aprovação</h3>
                <p className="text-xs text-slate-500">Diretoria será notificada nos e-mails configurados</p>
              </div>
              <button onClick={() => setIsApprovalModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            {approvalSubmitted ? (
              <div className="p-4 space-y-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                    Solicitação de Aprovação Registrada no CRM!
                  </h4>
                  <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 leading-relaxed">
                    Sinal sonoro emitido e notificação interna enviada para os diretores.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-left space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200 text-xs">
                    <Mail className="w-4 h-4 text-blue-600" />
                    <span>Disparo Imediato para a Diretoria</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Navegadores web bloqueiam o envio automático de e-mails em segundo plano sem confirmação do usuário. Utilizar os botões abaixo para abrir seu leitor de e-mail ou WhatsApp com a mensagem pronta:
                  </p>

                  <div className="pt-2 flex flex-col gap-2">
                    {submittedApprovalData?.mailtoUrl && (
                      <a
                        href={submittedApprovalData.mailtoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-xs"
                      >
                        <Mail className="w-4 h-4" />
                        <span>Abrir E-mail e Enviar para a Diretoria</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}

                    {submittedApprovalData?.whatsappUrl && (
                      <a
                        href={submittedApprovalData.whatsappUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-xs"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Enviar Alerta por WhatsApp da Diretoria</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      setIsApprovalModalOpen(false);
                      setApprovalSubmitted(false);
                      setApprovalJustification('');
                      setSubmittedApprovalData(null);
                    }}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-semibold text-xs"
                  >
                    Concluir e Voltar ao Simulador
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSendApprovalSubmit} className="space-y-4">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Destinatários (Configurados):</label>
                  <input
                    type="text"
                    disabled
                    value={settings.emailsAprovacaoDiretoria || 'diretoria@jardimvivencia.com.br'}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Justificativa para a Diretoria:</label>
                  <textarea
                    rows={4}
                    value={approvalJustification}
                    onChange={(e) => setApprovalJustification(e.target.value)}
                    placeholder="Explique o motivo do desconto especial, flexibilização de parcelas ou condições diferenciadas..."
                    required
                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsApprovalModalOpen(false)}
                    className="px-4 py-2 rounded-xl font-medium text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                  >
                    Enviar Proposta
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Official Printable & PDF Modal */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 my-8 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header Bar */}
            <div className="p-4 sm:px-6 bg-slate-900 text-white flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center font-bold">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base">Proposta Oficial de Financiamento & Fluxo de Pagamento</h3>
                  <p className="text-[11px] text-slate-400">Empreendimento {settings.nomeEmpreendimento} - Caixa Econômica Federal</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDirectPrint}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-slate-950 transition-colors shadow-xs"
                  title="Imprimir ou Salvar em PDF"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir / Salvar PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-sm"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Printable Document Content */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-slate-900 dark:text-slate-100 font-sans text-xs bg-white dark:bg-slate-900">
              {/* Document Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-slate-800 dark:border-slate-700">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Proposta Comercial Formal</span>
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                    {settings.nomeEmpreendimento.toUpperCase()}
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Loteamento Residencial Fechado | Financiamento Imobiliário Caixa
                  </p>
                </div>
                <div className="text-left sm:text-right text-[11px] text-slate-500 space-y-0.5">
                  <p><strong>Data da Simulação:</strong> {new Date().toLocaleDateString('pt-BR')}</p>
                  <p><strong>Validade da Proposta:</strong> 7 dias corridos</p>
                  <p><strong>Corretor Responsável:</strong> {currentUser.name} (CRECI: {currentUser.creci})</p>
                </div>
              </div>

              {/* Proponent & Unit Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    Dados do Proponente
                  </h4>
                  <p><strong>Nome:</strong> {targetLeadId ? leads.find(l => l.id === targetLeadId)?.nome : 'Proponente Interessado'}</p>
                  <p><strong>Telefone / WhatsApp:</strong> {targetLeadId ? leads.find(l => l.id === targetLeadId)?.telefone : 'A confirmar'}</p>
                  <p><strong>Renda Familiar Bruta:</strong> {formatCurrency(rendaFamiliar)}</p>
                  <p><strong>Recursos FGTS Declarados:</strong> {formatCurrency(fgts)}</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    Dados da Unidade
                  </h4>
                  <p><strong>Identificação:</strong> {activeUnit ? `${activeUnit.quadra} - ${activeUnit.lote}` : 'Unidade Padrão'}</p>
                  <p><strong>Localização:</strong> {activeUnit ? activeUnit.rua : 'Residencial Jardim Vivência'}</p>
                  <p><strong>Área Privativa / Lote:</strong> {activeUnit ? `${activeUnit.areaTerreno || activeUnit.areaConstruida || 250} m²` : 'Conforme memorial'}</p>
                  <p><strong>Faixa / Grupo:</strong> {grupoFaixa} ({activeUnit ? activeUnit.status.toUpperCase() : 'DISPONÍVEL'})</p>
                </div>
              </div>

              {/* Financial Composition Breakdown */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                  Composição do Financiamento Caixa & Subsídios
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-500 block">Valor de Venda</span>
                    <strong className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(valorImovel)}</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
                    <span className="text-[10px] text-blue-700 dark:text-blue-400 block">Financiamento Caixa</span>
                    <strong className="text-sm font-bold text-blue-900 dark:text-blue-300">{formatCurrency(financiamentoCef)}</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 block">Subsídios Conquistados</span>
                    <strong className="text-sm font-bold text-emerald-900 dark:text-emerald-300">{formatCurrency(result.totalSubsidios)}</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 text-white">
                    <span className="text-[10px] text-slate-400 block">Entrada Líquida Total</span>
                    <strong className="text-sm font-bold text-emerald-400">{formatCurrency(result.totalEntradaNecessaria)}</strong>
                  </div>
                </div>
              </div>

              {/* Payment Flow Summary */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                  Resumo das Etapas da Entrada
                </h4>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Atos Iniciais (1, 2 e 3)</span>
                    <p className="text-xs text-slate-700 dark:text-slate-300 mt-1">
                      Ato 1: <strong>{formatCurrency(ato1)}</strong> ({result.cronograma[0]?.data || dataAto1})<br />
                      Ato 2: <strong>{formatCurrency(ato2)}</strong><br />
                      Ato 3: <strong>{formatCurrency(ato3)}</strong>
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Parcelamento Mensal</span>
                    <p className="text-xs text-slate-700 dark:text-slate-300 mt-1">
                      {mensais1Qtd > 0 && <span>• Mensais 1: {mensais1Qtd}x {formatCurrency(mensais1Valor || result.valorParcelaMensal)}<br /></span>}
                      {mensais2Qtd > 0 && <span>• Mensais 2: {mensais2Qtd}x {formatCurrency(mensais2Valor)}<br /></span>}
                      {mensais3Qtd > 0 && <span>• Mensais 3: {mensais3Qtd}x {formatCurrency(mensais3Valor)}<br /></span>}
                      {mensais4Qtd > 0 && <span>• Mensais 4: {mensais4Qtd}x {formatCurrency(mensais4Valor)}<br /></span>}
                      <span className="text-[11px] text-slate-500">Vencimento todo dia {diaMensais}</span>
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Parcela Complementar</span>
                    <p className="text-xs text-slate-700 dark:text-slate-300 mt-1">
                      Valor: <strong>{formatCurrency(parcelaComplementar)}</strong><br />
                      <span className="text-[11px] text-slate-500">Total Programado: {formatCurrency(result.totalAtos + result.totalMensais + result.parcelaComplementar)}</span><br />
                      <span className="text-[11px] font-bold text-emerald-600">
                        {result.saldoRestante === 0 ? '✓ Saldo 100% Coberto' : `Saldo Restante: ${formatCurrency(result.saldoRestante)}`}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Full Schedule Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                    Cronograma Detalhado de Todas as Parcelas ({result.cronograma.length} parcelas)
                  </h4>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Total: {formatCurrency(result.cronograma.reduce((acc, p) => acc + p.valor, 0))}
                  </span>
                </div>
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                      <tr>
                        <th className="py-2 px-3">#</th>
                        <th className="py-2 px-3">Etapa / Bloco</th>
                        <th className="py-2 px-3">Vencimento</th>
                        <th className="py-2 px-3 text-right">Valor da Parcela</th>
                        <th className="py-2 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {result.cronograma.map((parcela, i) => (
                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="py-1.5 px-3 text-slate-400 font-mono text-[11px]">{i + 1}</td>
                          <td className="py-1.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                            {parcela.bloco} {parcela.numero ? `#${parcela.numero}` : ''}
                          </td>
                          <td className="py-1.5 px-3 text-slate-600 dark:text-slate-400">{parcela.data}</td>
                          <td className="py-1.5 px-3 text-right font-bold text-slate-900 dark:text-white">
                            {formatCurrency(parcela.valor)}
                          </td>
                          <td className="py-1.5 px-3 text-center text-[10px] text-emerald-600 font-semibold">
                            Programada
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Signatures & Notes */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-8">
                <div className="text-[10px] text-slate-500 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl">
                  * Proposta comercial sujeita à aprovação final de crédito junto à Caixa Econômica Federal e análise cadastral pela construtora. Os valores de subsídios e financiamento poderão sofrer alterações de acordo com os parâmetros do agente financeiro na data da contratação.
                </div>

                <div className="grid grid-cols-2 gap-8 pt-4">
                  <div className="text-center space-y-1">
                    <div className="border-t border-slate-400 dark:border-slate-600 w-3/4 mx-auto pt-2" />
                    <p className="font-bold text-xs">{targetLeadId ? leads.find(l => l.id === targetLeadId)?.nome : 'Assinatura do Proponente'}</p>
                    <p className="text-[10px] text-slate-500">Comprador / Proponente</p>
                  </div>
                  <div className="text-center space-y-1">
                    <div className="border-t border-slate-400 dark:border-slate-600 w-3/4 mx-auto pt-2" />
                    <p className="font-bold text-xs">{currentUser.name}</p>
                    <p className="text-[10px] text-slate-500">Corretor de Imóveis (CRECI {currentUser.creci})</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="p-4 bg-slate-100 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-slate-500">
                Pressione <strong>Ctrl+P</strong> para imprimir ou selecione 'Salvar como PDF' na impressora.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyWhatsApp}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 text-slate-700 dark:text-slate-200 flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedWhatsApp ? 'Copiado!' : 'Copiar Texto WhatsApp'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDirectPrint}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Agora</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
