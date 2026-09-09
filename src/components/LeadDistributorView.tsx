import React, { useState, useRef, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Lead, User, FunnelStage } from '../types';
import { useNumericInput } from '../hooks/useNumericInput';
import { playNotificationChime } from '../utils/soundService';
import {
  Dices,
  Users,
  Upload,
  Plus,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Trash2,
  HelpCircle,
  RefreshCw,
  Sliders,
  Download,
  Sparkles,
  Layers,
  Send,
  UserCheck,
  Building,
  Zap,
  Bot,
  Play,
  ShieldCheck,
  History,
  Radio,
  Filter,
  Clock,
  ArrowRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const LeadDistributorView: React.FC = () => {
  const {
    leads,
    users,
    teams,
    attendances,
    addLead,
    updateLead,
    markAttendanceAttended,
    checkDuplicate,
    logAction,
    currentUser,
    addNotification,
  } = useApp();

  // Sub-tabs
  const [activeSubTab, setActiveSubTab] = useState<'queue' | 'automation' | 'manual' | 'spreadsheet'>('queue');

  // Automation Flow Configuration & State
  const [automationConfig, setAutomationConfig] = useState({
    isEnabled: true,
    onlyShiftHours: false,
    fallbackPolicy: 'caixa' as 'caixa' | 'coordenador' | 'hold',
    notifyBrokerWhatsapp: true,
    activeOrigins: {
      'Google Ads': true,
      'Instagram/Facebook': true,
      'Portal Imobiliário': true,
      'Chatbot / Site': true,
      'WhatsApp Direto': true,
      'Tenda/Panfletagem': false,
      'Plantão Presencial': false,
    } as Record<string, boolean>,
  });

  // Simulated Lead Entry Form
  const [simulatedForm, setSimulatedForm] = useState({
    nome: '',
    telefone: '',
    email: '',
    origem: 'Google Ads' as Lead['origem'],
  });

  // Real-time Automation Logs
  const [automationLogs, setAutomationLogs] = useState<Array<{
    id: string;
    timestamp: string;
    leadNome: string;
    origem: string;
    corretorNome: string;
    status: 'sucesso' | 'duplicado' | 'fallback_caixa' | 'erro';
    detalhes: string;
  }>>([
    {
      id: 'log-1',
      timestamp: new Date(Date.now() - 15 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      leadNome: 'Mariana Castro',
      origem: 'Google Ads',
      corretorNome: 'Ana Paula (Equipe Alpha)',
      status: 'sucesso',
      detalhes: 'Lead de campanha atribuído automaticamente via giro de roleta (#1 da vez).',
    },
    {
      id: 'log-2',
      timestamp: new Date(Date.now() - 45 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      leadNome: 'Ricardo Fonseca',
      origem: 'Instagram/Facebook',
      corretorNome: 'Bruno Souza (Equipe Beta)',
      status: 'sucesso',
      detalhes: 'Lead de formulário atribuído ao corretor da vez.',
    },
  ]);

  const [automationFeedback, setAutomationFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string; details?: string[] } | null>(null);

  // Manual Form State
  const [manualForm, setManualForm] = useState({
    nome: '',
    telefone: '',
    email: '',
    cpf: '',
    origem: 'Plantão Presencial' as Lead['origem'],
    rendaFamiliar: 0,
    fgts: 0,
    profissao: '',
    observacoesGerais: '',
    assignmentMode: 'roulette' as 'roulette' | 'caixa' | 'manual',
    manualBrokerId: '',
  });

  const rendaInput = useNumericInput({
    initialValue: 0,
    onChange: (val) => setManualForm((prev) => ({ ...prev, rendaFamiliar: val })),
    isCurrency: true,
  });

  const fgtsInput = useNumericInput({
    initialValue: 0,
    onChange: (val) => setManualForm((prev) => ({ ...prev, fgts: val })),
    isCurrency: true,
  });

  const [manualFeedback, setManualFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Spreadsheet state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [autoInsertOnUpload, setAutoInsertOnUpload] = useState(false);
  const [autoInsertMode, setAutoInsertMode] = useState<'roulette' | 'caixa'>('roulette');
  const [parsedData, setParsedData] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, number>>({
    nome: -1,
    telefone: -1,
    email: -1,
    cpf: -1,
    rendaFamiliar: -1,
    fgts: -1,
    profissao: -1,
  });
  const [previewLeads, setPreviewLeads] = useState<Array<{
    nome: string;
    telefone: string;
    email: string;
    cpf: string;
    rendaFamiliar: number;
    fgts: number;
    profissao: string;
    isDuplicate: boolean;
    duplicateLeadName?: string;
    selected: boolean;
  }>>([]);

  const [spreadsheetFeedback, setSpreadsheetFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
    details?: string[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get active brokers in roulette sorted by queue order
  const activeQueue = useMemo(() => {
    return attendances
      .filter((a) => a.emFilaRoleta && (a.status === 'presente' || a.status === 'atrasado'))
      .sort((a, b) => a.ordemRoleta - b.ordemRoleta);
  }, [attendances]);

  // First broker in line
  const nextBroker = activeQueue.length > 0 ? activeQueue[0] : null;

  // Unassigned leads in the pool/Caixa de Leads
  const unassignedLeads = useMemo(() => {
    return leads.filter(
      (l) => l.naCaixaDeLeads || !l.corretorId || l.corretorNome === 'Não Atribuído' || l.corretorNome === ''
    );
  }, [leads]);

  // Execute automatic distribution on unassigned leads queue
  const handleProcessUnassignedQueue = () => {
    setAutomationFeedback(null);

    if (unassignedLeads.length === 0) {
      setAutomationFeedback({
        type: 'info',
        message: 'Nenhum lead não atribuído ou pendente na Caixa de Leads para distribuir no momento.',
      });
      return;
    }

    if (activeQueue.length === 0) {
      setAutomationFeedback({
        type: 'error',
        message: 'A fila do plantão está vazia. Não há corretores ativos na roleta para receber os leads. Por favor, adicione corretores no plantão.',
      });
      return;
    }

    let assignedCount = 0;
    const distributionDetails: string[] = [];
    let simulatedQueue = [...activeQueue];

    unassignedLeads.forEach((lead) => {
      if (simulatedQueue.length === 0) return;

      const currentBroker = simulatedQueue[0];
      const brokerUser = users.find((u) => u.id === currentBroker.corretorId);
      const teamId = brokerUser?.teamId || '';

      // Update lead
      updateLead(lead.id, {
        corretorId: currentBroker.corretorId,
        corretorNome: currentBroker.corretorNome,
        equipeId: teamId,
        naCaixaDeLeads: false,
        tags: Array.from(new Set([...(lead.tags || []), 'Automação Roleta'])),
      });

      // Update broker queue position
      markAttendanceAttended(currentBroker.id);

      // Rotate local simulated queue
      simulatedQueue.shift();
      simulatedQueue.push(currentBroker);

      assignedCount++;
      distributionDetails.push(`✓ Lead "${lead.nome}" (${lead.origem}) -> Corretor "${currentBroker.corretorNome}"`);

      // Notify Broker
      addNotification({
        tipo: 'novo_cadastro',
        titulo: '⚡ Lead Atribuído Automaticamente via Roleta!',
        mensagem: `O cliente ${lead.nome} (${lead.origem}) foi distribuído para você pelo motor de automação da roleta de plantão. Inicie o atendimento!`,
        destinatarioUserId: currentBroker.corretorId,
        leadId: lead.id,
        leadNome: lead.nome,
        whatsappUrl: `https://wa.me/55${lead.telefone.replace(/\D/g, '')}`,
        linkTab: 'clientes',
      });

      // Append live automation log
      setAutomationLogs((prev) => [
        {
          id: `autolog-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          leadNome: lead.nome,
          origem: lead.origem || 'Caixa de Leads',
          corretorNome: currentBroker.corretorNome,
          status: 'sucesso',
          detalhes: `Distribuído da Caixa de Leads via Automação de Plantão.`,
        },
        ...prev,
      ]);
    });

    playNotificationChime('approval');
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.7 } });

    setAutomationFeedback({
      type: 'success',
      message: `Automação Concluída! ${assignedCount} leads da Caixa de Leads foram atribuídos com sucesso aos corretores da vez.`,
      details: distributionDetails,
    });

    logAction(
      'Execução da Automação de Distribuição',
      'Roleta / Automação',
      `Processados automaticamente ${assignedCount} leads pendentes na Caixa de Leads para a roleta do plantão.`
    );
  };

  // Run Real-Time Webhook / Campaign Entry Simulation
  const handleSimulateIncomingLeads = (count: number, customLead?: { nome: string; telefone: string; email: string; origem: Lead['origem'] }) => {
    setAutomationFeedback(null);

    if (!automationConfig.isEnabled) {
      setAutomationFeedback({
        type: 'error',
        message: 'O Motor de Automação está pausado nas configurações. Ative a chave para permitir a atribuição automática.',
      });
      return;
    }

    const mockNames = [
      { nome: 'Fernanda Machado', tel: '(11) 99123-4567', email: 'fernanda.machado@email.com' },
      { nome: 'Gabriel Alencar', tel: '(11) 98765-1234', email: 'gabriel.alencar@email.com' },
      { nome: 'Juliana Paes', tel: '(11) 97654-3210', email: 'juliana.paes@email.com' },
      { nome: 'Marcelo Oliveira', tel: '(11) 96543-8901', email: 'marcelo.oliveira@email.com' },
      { nome: 'Camila Rodrigues', tel: '(11) 95432-7890', email: 'camila.rodrigues@email.com' },
      { nome: 'Eduardo Santos', tel: '(11) 94321-6789', email: 'eduardo.santos@email.com' },
    ];

    let successCount = 0;
    let fallbackCount = 0;
    const details: string[] = [];
    let simulatedQueue = [...activeQueue];

    for (let i = 0; i < count; i++) {
      const mockObj = mockNames[i % mockNames.length];
      const leadNome = customLead ? customLead.nome : count > 1 ? `${mockObj.nome} (${i + 1})` : mockObj.nome;
      const leadTel = customLead ? customLead.telefone : mockObj.tel;
      const leadEmail = customLead ? customLead.email : mockObj.email;
      const origem = customLead?.origem || (i % 2 === 0 ? 'Google Ads' : 'Instagram/Facebook');

      let assignedBrokerId = '';
      let assignedBrokerName = 'Não Atribuído';
      let assignedEquipeId = '';
      let isFallback = false;

      if (simulatedQueue.length > 0) {
        const topBroker = simulatedQueue[0];
        assignedBrokerId = topBroker.corretorId;
        assignedBrokerName = topBroker.corretorNome;
        const bUser = users.find((u) => u.id === topBroker.corretorId);
        assignedEquipeId = bUser?.teamId || '';

        // Rotate simulated queue and update attendance order
        markAttendanceAttended(topBroker.id);
        simulatedQueue.shift();
        simulatedQueue.push(topBroker);
      } else {
        isFallback = true;
        fallbackCount++;
        if (automationConfig.fallbackPolicy === 'coordenador') {
          const coord = users.find((u) => u.role === 'coordenador' || u.role === 'gestor');
          if (coord) {
            assignedBrokerId = coord.id;
            assignedBrokerName = `${coord.name} (Gestão)`;
            assignedEquipeId = coord.teamId || '';
          }
        }
      }

      // Add Lead to system
      const { lead, duplicidade } = addLead({
        nome: leadNome,
        telefone: leadTel,
        email: leadEmail,
        cpf: '',
        rendaFamiliar: 4500 + i * 800,
        fgts: 2000 + i * 500,
        profissao: 'Analista Pleno',
        estadoCivil: 'solteiro',
        temDependentes: false,
        temImovel: false,
        corretorId: assignedBrokerId,
        corretorNome: assignedBrokerName,
        equipeId: assignedEquipeId,
        origem,
        tags: ['Entrada Automática', 'Webhook Simulado'],
        status: 'pre_cadastro',
        naCaixaDeLeads: isFallback && automationConfig.fallbackPolicy === 'caixa',
      });

      if (!isFallback && assignedBrokerId) {
        successCount++;
        details.push(`⚡ Lead "${lead.nome}" (${origem}) -> Corretor "${assignedBrokerName}"`);

        setAutomationLogs((prev) => [
          {
            id: `autolog-${Date.now()}-${i}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            leadNome: lead.nome,
            origem,
            corretorNome: assignedBrokerName,
            status: 'sucesso',
            detalhes: 'Simulação Webhook / Campanha recebida e atribuída na roleta.',
          },
          ...prev,
        ]);
      } else {
        details.push(`📥 Lead "${lead.nome}" -> Direcionado para Caixa de Leads (Sem corretor no plantão).`);
        setAutomationLogs((prev) => [
          {
            id: `autolog-${Date.now()}-${i}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            leadNome: lead.nome,
            origem,
            corretorNome: 'Caixa de Leads (Fallback)',
            status: 'fallback_caixa',
            detalhes: 'Sem corretores ativos na roleta de plantão.',
          },
          ...prev,
        ]);
      }
    }

    playNotificationChime('lead');
    confetti({ particleCount: 90, spread: 65, origin: { y: 0.7 } });

    setAutomationFeedback({
      type: 'success',
      message: `Simulação de Entrada executada! ${count} lead(s) recebidos pelo webhook e processados pelo motor de automação.`,
      details,
    });

    // Reset simulated form if custom
    if (customLead) {
      setSimulatedForm({ nome: '', telefone: '', email: '', origem: 'Google Ads' });
    }
  };

  // CSV Template Downloader
  const downloadCsvTemplate = () => {
    const headersLine = 'Nome;Telefone;E-mail;CPF;RendaFamiliar;FGTS;Profissao\n';
    const sampleLine = 'Carlos de Souza;(11) 98765-4321;carlos@email.com;123.456.789-00;4500;1200;Analista Financeiro\n';
    const blob = new Blob([headersLine + sampleLine], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'modelo_leads_crm.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Robust Currency & Number cleaner
  const parseCleanNumber = (val: string): number => {
    if (!val) return 0;
    let clean = val.replace(/[R$\s]/g, '').trim();
    if (clean.includes(',') && clean.includes('.')) {
      if (clean.indexOf('.') < clean.indexOf(',')) {
        clean = clean.replace(/\./g, '').replace(',', '.');
      } else {
        clean = clean.replace(/,/g, '');
      }
    } else if (clean.includes(',')) {
      const parts = clean.split(',');
      if (parts[parts.length - 1].length <= 2) {
        clean = clean.replace(',', '.');
      } else {
        clean = clean.replace(',', '');
      }
    }
    return parseFloat(clean) || 0;
  };

  // Shared process CSV file logic
  const processFile = (file: File) => {
    setCsvFile(file);
    setSpreadsheetFeedback(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      // Split into lines
      const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
      if (lines.length === 0) {
        setSpreadsheetFeedback({ type: 'error', message: 'O arquivo CSV está vazio.' });
        return;
      }

      // Detect delimiter
      const firstLine = lines[0];
      const delimiter = firstLine.includes(';') ? ';' : firstLine.includes('\t') ? '\t' : ',';

      // Parse lines
      const parsedRows = lines.map((line) => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === delimiter && !inQuotes) {
            result.push(current.trim().replace(/^"|"$/g, ''));
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim().replace(/^"|"$/g, ''));
        return result;
      });

      const extractedHeaders = parsedRows[0];
      setHeaders(extractedHeaders);
      setParsedData(parsedRows.slice(1));

      // Attempt automatic mapping matching header strings
      const autoMapping: Record<string, number> = {
        nome: -1,
        telefone: -1,
        email: -1,
        cpf: -1,
        rendaFamiliar: -1,
        fgts: -1,
        profissao: -1,
      };

      extractedHeaders.forEach((header, index) => {
        const clean = header.toLowerCase().trim();
        if (clean.includes('nome') || clean.includes('client') || clean.includes('proponente')) autoMapping.nome = index;
        if (clean.includes('tel') || clean.includes('cel') || clean.includes('fone') || clean.includes('contato')) autoMapping.telefone = index;
        if (clean.includes('mail') || clean.includes('correio')) autoMapping.email = index;
        if (clean.includes('cpf') || clean.includes('documento')) autoMapping.cpf = index;
        if (clean.includes('renda') || clean.includes('ganho') || clean.includes('salario')) autoMapping.rendaFamiliar = index;
        if (clean.includes('fgts') || clean.includes('fundo')) autoMapping.fgts = index;
        if (clean.includes('prof') || clean.includes('cargo') || clean.includes('ocupac')) autoMapping.profissao = index;
      });

      setColumnMapping(autoMapping);
      generatePreview(parsedRows.slice(1), autoMapping);
    };

    reader.readAsText(file, 'UTF-8');
  };

  // CSV Parsing entrypoint
  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  // Drag-and-drop events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.name.toLowerCase().endsWith('.csv')) {
        processFile(file);
      } else {
        setSpreadsheetFeedback({ type: 'error', message: 'Tipo de arquivo inválido. Por favor, envie apenas arquivos .csv.' });
      }
    }
  };

  const handleMappingChange = (field: string, index: number) => {
    const updated = { ...columnMapping, [field]: index };
    setColumnMapping(updated);
    generatePreview(parsedData, updated);
  };

  // Automatic immediate parsing and insertion
  const performAutoInsert = (previews: Array<{
    nome: string;
    telefone: string;
    email: string;
    cpf: string;
    rendaFamiliar: number;
    fgts: number;
    profissao: string;
    isDuplicate: boolean;
    duplicateLeadName?: string;
    selected: boolean;
  }>, mode: 'roulette' | 'caixa') => {
    const selectedLeads = previews.filter((l) => l.selected && l.nome.trim() !== '' && l.telefone.trim() !== '');

    if (selectedLeads.length === 0) {
      setSpreadsheetFeedback({ type: 'error', message: 'Nenhum lead válido e não duplicado foi encontrado no arquivo para importação automática.' });
      return;
    }

    if (mode === 'roulette' && activeQueue.length === 0) {
      setSpreadsheetFeedback({
        type: 'error',
        message: 'A fila da roleta está vazia. Não é possível distribuir os leads automaticamente pela roleta de plantão. Altere o modo de atribuição automática ou adicione corretores na roleta.',
      });
      return;
    }

    let successCount = 0;
    let duplicateCount = 0;
    const distributionLog: string[] = [];

    let simulatedQueue = [...activeQueue];
    const brokerLeadsCount: Record<string, number> = {};

    selectedLeads.forEach((previewLead) => {
      let assignedBrokerId = '';
      let assignedBrokerName = 'Não Atribuído';
      let assignedEquipeId = '';

      if (mode === 'roulette' && simulatedQueue.length > 0) {
        const currentBroker = simulatedQueue[0];
        assignedBrokerId = currentBroker.corretorId;
        assignedBrokerName = currentBroker.corretorNome;
        const currentBrokerUser = users.find((u) => u.id === currentBroker.corretorId);
        assignedEquipeId = currentBrokerUser?.teamId || '';

        brokerLeadsCount[assignedBrokerName] = (brokerLeadsCount[assignedBrokerName] || 0) + 1;

        simulatedQueue.shift();
        simulatedQueue.push(currentBroker);

        markAttendanceAttended(currentBroker.id);
      }

      const { duplicidade } = addLead({
        nome: previewLead.nome.trim(),
        telefone: previewLead.telefone.trim(),
        email: previewLead.email.trim(),
        cpf: previewLead.cpf.trim(),
        rendaFamiliar: previewLead.rendaFamiliar,
        fgts: previewLead.fgts,
        profissao: previewLead.profissao.trim(),
        estadoCivil: 'solteiro',
        temDependentes: false,
        temImovel: false,
        corretorId: assignedBrokerId,
        corretorNome: assignedBrokerName,
        equipeId: assignedEquipeId,
        origem: 'Google Ads',
        tags: ['Importado Automaticamente', 'Importado Planilha'],
        status: 'pre_cadastro',
        naCaixaDeLeads: mode === 'caixa',
      });

      if (duplicidade.duplicado) {
        duplicateCount++;
      } else {
        successCount++;
        if (assignedBrokerId) {
          distributionLog.push(`✓ Lead "${previewLead.nome}" -> Corretor "${assignedBrokerName}"`);
        }
      }
    });

    playNotificationChime('approval');
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });

    let distributionSummary = `Importação Automática Concluída! ${successCount} leads inseridos com sucesso no banco de dados.`;
    if (duplicateCount > 0) {
      distributionSummary += ` (${duplicateCount} duplicados ignorados).`;
    }

    const details: string[] = [];
    if (mode === 'roulette') {
      details.push('📊 Distribuição Sequencial da Roleta Realizada:');
      Object.entries(brokerLeadsCount).forEach(([name, count]) => {
        details.push(`• ${name}: recebeu ${count} leads`);
      });
    } else {
      details.push(`• Todos os ${successCount} leads foram colocados na Caixa de Leads (Pool de Resgate).`);
    }

    setSpreadsheetFeedback({
      type: 'success',
      message: distributionSummary,
      details: [...details, '', ...distributionLog.slice(0, 15), distributionLog.length > 15 ? '...e outros' : ''],
    });

    logAction(
      'Importação de Leads em Massa (Automático)',
      'CRM / Leads',
      `Importados automaticamente ${successCount} leads via upload direto de planilha. Distribuição: ${mode}.`
    );

    // Reset CSV parsing states
    setCsvFile(null);
    setParsedData([]);
    setHeaders([]);
    setPreviewLeads([]);
  };

  const generatePreview = (rows: string[][], mapping: Record<string, number>) => {
    const previews = rows.map((row) => {
      const nome = mapping.nome !== -1 && row[mapping.nome] ? row[mapping.nome] : '';
      const telefone = mapping.telefone !== -1 && row[mapping.telefone] ? row[mapping.telefone] : '';
      const email = mapping.email !== -1 && row[mapping.email] ? row[mapping.email] : '';
      const cpf = mapping.cpf !== -1 && row[mapping.cpf] ? row[mapping.cpf] : '';
      const rendaRaw = mapping.rendaFamiliar !== -1 && row[mapping.rendaFamiliar] ? row[mapping.rendaFamiliar] : '0';
      const fgtsRaw = mapping.fgts !== -1 && row[mapping.fgts] ? row[mapping.fgts] : '0';
      const profissao = mapping.profissao !== -1 && row[mapping.profissao] ? row[mapping.profissao] : '';

      const rendaFamiliar = parseCleanNumber(rendaRaw);
      const fgts = parseCleanNumber(fgtsRaw);

      // Duplicate Check
      const dupCheck = checkDuplicate(nome, telefone, email);

      return {
        nome,
        telefone,
        email,
        cpf,
        rendaFamiliar,
        fgts,
        profissao,
        isDuplicate: dupCheck.duplicado,
        duplicateLeadName: dupCheck.leadExistente?.nome,
        selected: !dupCheck.duplicado && nome.trim() !== '' && telefone.trim() !== '', // select by default if not duplicate and valid
      };
    });

    if (autoInsertOnUpload) {
      performAutoInsert(previews, autoInsertMode);
    } else {
      setPreviewLeads(previews);
    }
  };

  const toggleSelectLead = (index: number) => {
    setPreviewLeads((prev) =>
      prev.map((lead, i) => (i === index ? { ...lead, selected: !lead.selected } : lead))
    );
  };

  const toggleSelectAll = () => {
    const allSelected = previewLeads.every((l) => l.selected);
    setPreviewLeads((prev) => prev.map((l) => ({ ...l, selected: !allSelected })));
  };

  // Manual Form Submission
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!manualForm.nome.trim() || !manualForm.telefone.trim()) {
      setManualFeedback({ type: 'error', message: 'Por favor, preencha pelo menos o Nome e o Telefone.' });
      return;
    }

    let assignedBrokerId = '';
    let assignedBrokerName = 'Não Atribuído';
    let assignedEquipeId = '';

    // Check Assignment Mode
    if (manualForm.assignmentMode === 'roulette') {
      if (activeQueue.length === 0) {
        setManualFeedback({
          type: 'error',
          message: 'Não há corretores ativos no plantão no momento para receber o lead da roleta. Escolha outra opção ou ative corretores no plantão.',
        });
        return;
      }
      const firstBroker = activeQueue[0];
      assignedBrokerId = firstBroker.corretorId;
      assignedBrokerName = firstBroker.corretorNome;
      const firstBrokerUser = users.find((u) => u.id === firstBroker.corretorId);
      assignedEquipeId = firstBrokerUser?.teamId || '';

      // Update Attendance order (spin roulette)
      markAttendanceAttended(firstBroker.id);
    } else if (manualForm.assignmentMode === 'manual') {
      if (!manualForm.manualBrokerId) {
        setManualFeedback({ type: 'error', message: 'Por favor, selecione o corretor para quem deseja atribuir.' });
        return;
      }
      const selectedBroker = users.find((u) => u.id === manualForm.manualBrokerId);
      if (selectedBroker) {
        assignedBrokerId = selectedBroker.id;
        assignedBrokerName = selectedBroker.name;
        assignedEquipeId = selectedBroker.teamId || '';
      }
    }

    const { lead, duplicidade } = addLead({
      nome: manualForm.nome.trim(),
      telefone: manualForm.telefone.trim(),
      email: manualForm.email.trim(),
      cpf: manualForm.cpf.trim(),
      rendaFamiliar: manualForm.rendaFamiliar,
      fgts: manualForm.fgts,
      profissao: manualForm.profissao.trim(),
      estadoCivil: 'solteiro',
      temDependentes: false,
      temImovel: false,
      corretorId: assignedBrokerId,
      corretorNome: assignedBrokerName,
      equipeId: assignedEquipeId,
      origem: manualForm.origem,
      tags: ['Novo Lead'],
      status: 'pre_cadastro',
      naCaixaDeLeads: manualForm.assignmentMode === 'caixa',
      observacoesGerais: manualForm.observacoesGerais.trim(),
    });

    if (duplicidade.duplicado) {
      setManualFeedback({
        type: 'success',
        message: `Lead registrado como DUPLICIDADE! O corretor atual foi alertado, e um log foi gerado.`,
      });
    } else {
      setManualFeedback({
        type: 'success',
        message: `Lead "${lead.nome}" inserido com sucesso e atribuído a: ${assignedBrokerName}!`,
      });
    }

    // Play chime and confetti if successful and roulette
    if (manualForm.assignmentMode === 'roulette') {
      playNotificationChime('lead');
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.8 } });
    } else {
      playNotificationChime('lead');
    }

    // Reset Form
    setManualForm({
      nome: '',
      telefone: '',
      email: '',
      cpf: '',
      origem: 'Plantão Presencial',
      rendaFamiliar: 0,
      fgts: 0,
      profissao: '',
      observacoesGerais: '',
      assignmentMode: 'roulette',
      manualBrokerId: '',
    });

    rendaInput.setDirectValue(0);
    fgtsInput.setDirectValue(0);

    setTimeout(() => setManualFeedback(null), 5000);
  };

  // Bulk Spreadsheet Submission
  const handleBulkSubmit = (assignmentMode: 'roulette' | 'caixa' | 'manual', targetBrokerId?: string) => {
    const selectedLeads = previewLeads.filter((l) => l.selected);

    if (selectedLeads.length === 0) {
      setSpreadsheetFeedback({ type: 'error', message: 'Nenhum lead válido e marcado foi selecionado para importação.' });
      return;
    }

    if (assignmentMode === 'roulette' && activeQueue.length === 0) {
      setSpreadsheetFeedback({
        type: 'error',
        message: 'A fila da roleta está vazia. Não é possível distribuir em lote pela roleta de plantão.',
      });
      return;
    }

    if (assignmentMode === 'manual' && !targetBrokerId) {
      setSpreadsheetFeedback({ type: 'error', message: 'Selecione um corretor para a atribuição em massa.' });
      return;
    }

    let successCount = 0;
    let duplicateCount = 0;
    const distributionLog: string[] = [];

    // Local copy of the queue to simulate sequential rotation
    let simulatedQueue = [...activeQueue];
    const brokerLeadsCount: Record<string, number> = {};

    selectedLeads.forEach((previewLead) => {
      let assignedBrokerId = '';
      let assignedBrokerName = 'Não Atribuído';
      let assignedEquipeId = '';

      if (assignmentMode === 'roulette' && simulatedQueue.length > 0) {
        // Get the first broker in the queue
        const currentBroker = simulatedQueue[0];
        assignedBrokerId = currentBroker.corretorId;
        assignedBrokerName = currentBroker.corretorNome;
        const currentBrokerUser = users.find((u) => u.id === currentBroker.corretorId);
        assignedEquipeId = currentBrokerUser?.teamId || '';

        // Increment counter
        brokerLeadsCount[assignedBrokerName] = (brokerLeadsCount[assignedBrokerName] || 0) + 1;

        // Shift local queue
        simulatedQueue.shift();
        simulatedQueue.push(currentBroker);

        // Commit queue rotation to global state
        markAttendanceAttended(currentBroker.id);
      } else if (assignmentMode === 'manual' && targetBrokerId) {
        const brokerObj = users.find((u) => u.id === targetBrokerId);
        if (brokerObj) {
          assignedBrokerId = brokerObj.id;
          assignedBrokerName = brokerObj.name;
          assignedEquipeId = brokerObj.teamId || '';
        }
      }

      // Add the Lead
      const { duplicidade } = addLead({
        nome: previewLead.nome.trim(),
        telefone: previewLead.telefone.trim(),
        email: previewLead.email.trim(),
        cpf: previewLead.cpf.trim(),
        rendaFamiliar: previewLead.rendaFamiliar,
        fgts: previewLead.fgts,
        profissao: previewLead.profissao.trim(),
        estadoCivil: 'solteiro',
        temDependentes: false,
        temImovel: false,
        corretorId: assignedBrokerId,
        corretorNome: assignedBrokerName,
        equipeId: assignedEquipeId,
        origem: 'Google Ads', // Default for spreadsheet import
        tags: ['Importado Planilha'],
        status: 'pre_cadastro',
        naCaixaDeLeads: assignmentMode === 'caixa',
      });

      if (duplicidade.duplicado) {
        duplicateCount++;
      } else {
        successCount++;
        if (assignedBrokerId) {
          distributionLog.push(`✓ Lead "${previewLead.nome}" -> Corretor "${assignedBrokerName}"`);
        }
      }
    });

    // Play sounds and alert
    playNotificationChime('approval');
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });

    // Build success message
    let distributionSummary = `Importação concluída! ${successCount} leads importados com sucesso.`;
    if (duplicateCount > 0) {
      distributionSummary += ` (${duplicateCount} duplicados ignorados ou marcados).`;
    }

    const details: string[] = [];
    if (assignmentMode === 'roulette') {
      details.push('📊 Distribuição Sequencial da Roleta Realizada:');
      Object.entries(brokerLeadsCount).forEach(([name, count]) => {
        details.push(`• ${name}: recebeu ${count} leads`);
      });
    } else if (assignmentMode === 'manual') {
      const bName = users.find((u) => u.id === targetBrokerId)?.name || 'Corretor';
      details.push(`• Todos os ${successCount} leads foram atribuídos a: ${bName}`);
    } else {
      details.push(`• Todos os ${successCount} leads foram colocados na Caixa de Leads (Pool de Resgate).`);
    }

    setSpreadsheetFeedback({
      type: 'success',
      message: distributionSummary,
      details: [...details, '', ...distributionLog.slice(0, 15), distributionLog.length > 15 ? '...e outros' : ''],
    });

    logAction(
      'Importação de Leads em Massa',
      'CRM / Leads',
      `Importados ${successCount} leads via planilha. Distribuição: ${assignmentMode}.`
    );

    // Clear state
    setCsvFile(null);
    setParsedData([]);
    setHeaders([]);
    setPreviewLeads([]);
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Title block */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2.5 bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-2xl">
              <Dices className="w-6 h-6 animate-spin-slow" />
            </span>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Distribuidor Inteligente de Leads
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Receba leads de campanhas ou plantão e distribua-os perfeitamente conforme a fila de vez (roleta), manual ou em massa.
          </p>
        </div>

        {/* Action subtabs buttons */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl gap-1 w-full md:w-auto overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('queue')}
            className={`flex-1 md:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 ${
              activeSubTab === 'queue'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Fila da Vez (Roleta)</span>
          </button>
          <button
            onClick={() => setActiveSubTab('automation')}
            className={`flex-1 md:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 relative ${
              activeSubTab === 'automation'
                ? 'bg-emerald-500 text-slate-950 shadow-xs'
                : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
            }`}
          >
            <Zap className="w-3.5 h-3.5 animate-pulse" />
            <span>⚡ Fluxo de Automação</span>
            {unassignedLeads.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping absolute -top-0.5 -right-0.5" />
            )}
          </button>
          <button
            onClick={() => setActiveSubTab('manual')}
            className={`flex-1 md:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 ${
              activeSubTab === 'manual'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Inserir Manual</span>
          </button>
          <button
            onClick={() => setActiveSubTab('spreadsheet')}
            className={`flex-1 md:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 ${
              activeSubTab === 'spreadsheet'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Importar Planilha</span>
          </button>
        </div>
      </div>

      {/* AUTOMATION FLOW SUBTAB */}
      {activeSubTab === 'automation' && (
        <div className="space-y-6">
          {/* Top Banner Control & Status */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white p-6 sm:p-8 rounded-3xl shadow-lg relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border border-emerald-500/20">
            <div className="space-y-2 max-w-2xl relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-extrabold tracking-wide uppercase">
                <Zap className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
                <span>Fluxo de Distribuição Automática Ativo</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Motor de Atribuição Automática por Roleta
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Leads vindos de formulários, anúncios (Google/Meta), landing pages ou webhooks são capturados e atribuídos <strong>em menos de 1 segundo</strong> ao corretor da vez no plantão.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto shrink-0 relative z-10">
              <button
                type="button"
                onClick={() => setAutomationConfig((prev) => ({ ...prev, isEnabled: !prev.isEnabled }))}
                className={`px-5 py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                  automationConfig.isEnabled
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-slate-950'
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                }`}
              >
                <Bot className="w-4 h-4" />
                <span>{automationConfig.isEnabled ? '⚡ Automação: LIGADA' : '⏸️ Automação: PAUSADA'}</span>
              </button>

              {unassignedLeads.length > 0 && (
                <button
                  type="button"
                  onClick={handleProcessUnassignedQueue}
                  className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-transform hover:scale-[1.02]"
                >
                  <RefreshCw className="w-4 h-4 animate-spin-slow" />
                  <span>Distribuir Caixa ({unassignedLeads.length})</span>
                </button>
              )}
            </div>
          </div>

          {/* Metrics summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Autodistribuído</span>
              <p className="text-xl font-black text-slate-900 dark:text-white">
                {automationLogs.filter((l) => l.status === 'sucesso').length} <span className="text-xs text-emerald-500 font-bold">leads</span>
              </p>
              <p className="text-[10px] text-slate-400">Giro de roleta automático</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Fila Ativa do Plantão</span>
              <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                {activeQueue.length} <span className="text-xs text-slate-400 font-bold">corretores</span>
              </p>
              <p className="text-[10px] text-slate-400">Prontos para atendimento</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Aguardando na Caixa</span>
              <p className="text-xl font-black text-amber-600 dark:text-amber-400">
                {unassignedLeads.length} <span className="text-xs text-slate-400 font-bold">leads</span>
              </p>
              <p className="text-[10px] text-slate-400">Pendentes de atribuição</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Velocidade de Repasse</span>
              <p className="text-xl font-black text-teal-600 dark:text-teal-400">
                &lt; 1 seg <span className="text-xs text-slate-400 font-bold">real-time</span>
              </p>
              <p className="text-[10px] text-slate-400">Notificação instantânea</p>
            </div>
          </div>

          {/* Feedback message banner */}
          {automationFeedback && (
            <div
              className={`p-4 rounded-2xl border flex items-start gap-3 ${
                automationFeedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-200'
                  : automationFeedback.type === 'error'
                  ? 'bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-200'
                  : 'bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-950/40 dark:border-blue-900 dark:text-blue-200'
              }`}
            >
              {automationFeedback.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              ) : automationFeedback.type === 'error' ? (
                <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              ) : (
                <HelpCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1 text-xs">
                <p className="font-bold">{automationFeedback.message}</p>
                {automationFeedback.details && automationFeedback.details.length > 0 && (
                  <div className="pt-2 space-y-1 font-mono text-[11px] opacity-90 max-h-36 overflow-auto">
                    {automationFeedback.details.map((d, idx) => (
                      <p key={idx}>{d}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 columns: Simulation & Unassigned Sweep */}
            <div className="lg:col-span-2 space-y-6">
              {/* Webhook & Entry Simulator */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                    <Radio className="w-5 h-5 text-emerald-500 animate-pulse" />
                    <span>Testar Entrada de Leads em Tempo Real (Simulador Webhook)</span>
                  </h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-900">
                    Ambiente de Testes Real
                  </span>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed">
                  Dispare simulações de anúncios ou insira um cliente de teste para ver a automação selecionar o corretor da vez, atualizar o Kanban e emitir o sinal de notificação no WhatsApp em tempo real.
                </p>

                {/* Quick Batch Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => handleSimulateIncomingLeads(1)}
                    className="p-4 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs group"
                  >
                    <Zap className="w-5 h-5 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
                    <span className="font-extrabold text-xs text-slate-800 dark:text-white">Simular 1 Lead (Meta/Google)</span>
                    <span className="text-[10px] text-slate-400">Atribui ao #1 da roleta</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSimulateIncomingLeads(3)}
                    className="p-4 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/40 border border-teal-200 dark:border-teal-800 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs group"
                  >
                    <Play className="w-5 h-5 text-teal-600 dark:text-teal-400 group-hover:scale-110 transition-transform" />
                    <span className="font-extrabold text-xs text-slate-800 dark:text-white">Disparar Lote de 3 Leads</span>
                    <span className="text-[10px] text-slate-400">Gira a roleta 3 vezes</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSimulateIncomingLeads(5)}
                    className="p-4 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/40 border border-purple-200 dark:border-purple-800 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs group"
                  >
                    <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform" />
                    <span className="font-extrabold text-xs text-slate-800 dark:text-white">Disparar Lote de 5 Leads</span>
                    <span className="text-[10px] text-slate-400">Distribui em sequência total</span>
                  </button>
                </div>

                {/* Custom simulated lead form */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-emerald-500" />
                    <span>Simular Lead com Dados Específicos</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Nome do Cliente (Ex: Lucas Souza)"
                      value={simulatedForm.nome}
                      onChange={(e) => setSimulatedForm({ ...simulatedForm, nome: e.target.value })}
                      className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Telefone (Ex: 11 99999-8888)"
                      value={simulatedForm.telefone}
                      onChange={(e) => setSimulatedForm({ ...simulatedForm, telefone: e.target.value })}
                      className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                    />
                    <input
                      type="email"
                      placeholder="E-mail (Ex: lucas@email.com)"
                      value={simulatedForm.email}
                      onChange={(e) => setSimulatedForm({ ...simulatedForm, email: e.target.value })}
                      className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                    />
                    <select
                      value={simulatedForm.origem}
                      onChange={(e) => setSimulatedForm({ ...simulatedForm, origem: e.target.value as Lead['origem'] })}
                      className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                    >
                      <option value="Google Ads">Google Ads</option>
                      <option value="Instagram/Facebook">Instagram / Facebook</option>
                      <option value="Portal Imobiliário">Portal Imobiliário</option>
                      <option value="WhatsApp Direto">WhatsApp Direto</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (!simulatedForm.nome || !simulatedForm.telefone) {
                        alert('Preencha pelo menos Nome e Telefone para testar.');
                        return;
                      }
                      handleSimulateIncomingLeads(1, simulatedForm);
                    }}
                    className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Injetar Lead Personalizado na Automação</span>
                  </button>
                </div>
              </div>

              {/* Unassigned Leads Sweep Box */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-2 bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 rounded-xl">
                      <Layers className="w-5 h-5" />
                    </span>
                    <div>
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                        Processador Automático da Caixa de Leads
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Existem <strong>{unassignedLeads.length} leads</strong> sem corretor na Caixa de Leads (Pool Geral).
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={unassignedLeads.length === 0}
                    onClick={handleProcessUnassignedQueue}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-transform hover:scale-[1.01]"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Processar Caixa Agora</span>
                  </button>
                </div>

                {unassignedLeads.length > 0 && (
                  <div className="p-3 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl text-xs text-amber-900 dark:text-amber-300 flex items-center justify-between">
                    <span>Clique para distribuir todos os leads pendentes da Caixa sequencialmente para a fila ativa do plantão.</span>
                  </div>
                )}
              </div>

              {/* Channel Rules & Fallback Policy */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <Filter className="w-4 h-4 text-emerald-500" />
                  <span>Canais & Regras de Filtro da Automação</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Channels active checkboxes */}
                  <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">Canais Autorizados na Roleta</h4>
                    <div className="space-y-2">
                      {Object.keys(automationConfig.activeOrigins).map((channel) => (
                        <label key={channel} className="flex items-center justify-between text-xs cursor-pointer">
                          <span className="text-slate-600 dark:text-slate-400">{channel}</span>
                          <input
                            type="checkbox"
                            checked={automationConfig.activeOrigins[channel]}
                            onChange={(e) =>
                              setAutomationConfig((prev) => ({
                                ...prev,
                                activeOrigins: { ...prev.activeOrigins, [channel]: e.target.checked },
                              }))
                            }
                            className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                          />
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Fallback policy radio selection */}
                  <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">Política de Fallback (Sem plantão ativo)</h4>
                    <div className="space-y-2.5 text-xs">
                      <label className="flex items-start gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="fallbackPolicy"
                          value="caixa"
                          checked={automationConfig.fallbackPolicy === 'caixa'}
                          onChange={() => setAutomationConfig((prev) => ({ ...prev, fallbackPolicy: 'caixa' }))}
                          className="mt-0.5 text-emerald-600"
                        />
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-200">Caixa de Leads (Recomendado)</p>
                          <p className="text-[10px] text-slate-400">Guarda no pool de resgate geral até corretores entrarem na fila.</p>
                        </div>
                      </label>

                      <label className="flex items-start gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="fallbackPolicy"
                          value="coordenador"
                          checked={automationConfig.fallbackPolicy === 'coordenador'}
                          onChange={() => setAutomationConfig((prev) => ({ ...prev, fallbackPolicy: 'coordenador' }))}
                          className="mt-0.5 text-emerald-600"
                        />
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-200">Direcionar ao Coordenador</p>
                          <p className="text-[10px] text-slate-400">Atribui temporariamente ao gestor da equipe de plantão.</p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right column: Live Audit Log feed */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                    <History className="w-4 h-4 text-emerald-500" />
                    <span>Histórico da Automação</span>
                  </h3>
                  <span className="text-[10px] text-slate-400 font-bold">{automationLogs.length} eventos</span>
                </div>

                {/* Audit logs timeline list */}
                <div className="space-y-3 max-h-[520px] overflow-auto pr-1">
                  {automationLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-slate-800 dark:text-slate-200">{log.leadNome}</span>
                        <span className="text-[10px] font-mono text-slate-400">{log.timestamp}</span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>Origem: <strong>{log.origem}</strong></span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            log.status === 'sucesso'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {log.status === 'sucesso' ? 'Atribuído (Roleta)' : 'Fallback'}
                        </span>
                      </div>

                      <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold pt-0.5">
                        👉 {log.corretorNome}
                      </p>
                      <p className="text-[10px] text-slate-400 leading-tight">{log.detalhes}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 text-center">
                Log sincronizado com as regras de auditoria do CRM.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ROULETTE QUEUE SUBTAB */}
      {activeSubTab === 'queue' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main queue display */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <h2 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-500" />
                <span>Ordem de Vez Ativa (Fila do Plantão)</span>
              </h2>
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-xs font-bold">
                {activeQueue.length} corretores logados
              </span>
            </div>

            {/* Next in line prominence */}
            {nextBroker ? (
              <div className="relative overflow-hidden p-6 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-900 rounded-2xl flex flex-col sm:flex-row items-center gap-4">
                <div className="absolute top-2 right-2 flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded-md">
                  <Sparkles className="w-3 h-3 animate-pulse" />
                  <span>Próximo da Vez</span>
                </div>

                <div className="w-14 h-14 rounded-full border-2 border-emerald-400 bg-emerald-100 flex items-center justify-center font-bold text-slate-800 text-lg shadow-sm">
                  {nextBroker.corretorNome.slice(0, 2).toUpperCase()}
                </div>

                <div className="text-center sm:text-left space-y-1">
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                    {nextBroker.corretorNome}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Atendimentos realizados hoje: <span className="font-bold text-slate-800 dark:text-white">{nextBroker.atendimentosHoje}</span>
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Equipe de vendas:{' '}
                    <span className="font-semibold">
                      {(() => {
                        const bUser = users.find((u) => u.id === nextBroker.corretorId);
                        const team = bUser?.teamId ? teams.find((t) => t.id === bUser.teamId) : null;
                        return team?.name || 'Geral';
                      })()}
                    </span>
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 space-y-2 text-slate-500">
                <AlertCircle className="w-10 h-10 mx-auto text-slate-400" />
                <h4 className="font-bold text-slate-700 dark:text-slate-300">Nenhum Corretor na Fila</h4>
                <p className="text-xs max-w-sm mx-auto">
                  Por favor, vá para a aba de "Plantão & Roleta" e adicione ou faça check-in de corretores no plantão de hoje para ativar a roleta.
                </p>
              </div>
            )}

            {/* Complete active list */}
            {activeQueue.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400">Restante da Fila</h4>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
                  {activeQueue.map((broker, idx) => (
                    <div key={broker.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="w-5 h-5 flex items-center justify-center font-bold text-[11px] text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-md">
                          {idx + 1}º
                        </span>
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs">
                          {broker.corretorNome.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-200 text-xs sm:text-sm">
                            {broker.corretorNome}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {(() => {
                              const bUser = users.find((u) => u.id === broker.corretorId);
                              const team = bUser?.teamId ? teams.find((t) => t.id === bUser.teamId) : null;
                              return team?.name || 'Geral';
                            })()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            {broker.atendimentosHoje} atend.
                          </p>
                          <p className="text-[10px] text-slate-400">hoje</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Guidelines / How it works side card */}
          <div className="bg-slate-900 text-white p-6 rounded-3xl space-y-6 flex flex-col justify-between shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="space-y-4">
              <div className="inline-flex p-2.5 bg-emerald-500/25 border border-emerald-400/30 text-emerald-300 rounded-2xl">
                <HelpCircle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-black tracking-tight text-white">Como Funciona a Roleta Dinâmica?</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                A roleta de distribuição de leads do CRM foi projetada sob o princípio de <strong>Fila Sequencial Justa</strong>:
              </p>
              <ul className="space-y-3 text-xs text-slate-300">
                <li className="flex gap-2">
                  <span className="text-emerald-400 font-bold">1.</span>
                  <span>O primeiro corretor do topo da fila sempre recebe o próximo lead cadastrado.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-400 font-bold">2.</span>
                  <span>Assim que o corretor recebe o lead (seja inserção manual ou por planilha), ele vai automaticamente para o <strong>final da fila</strong>.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-400 font-bold">3.</span>
                  <span>O corretor é imediatamente alertado via WhatsApp e notificações no CRM para iniciar o contato rápido.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-400 font-bold">4.</span>
                  <span>Caso o lead já conste como duplicidade em nossa inteligência de CPFs, o CRM dispara logs específicos e bloqueia desvios.</span>
                </li>
              </ul>
            </div>

            <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-400">
              Precisa alterar a ordem inicial dos corretores? Vá para a aba <strong>Plantão & Roleta</strong> para reordenar a fila arrastando os cartões.
            </div>
          </div>
        </div>
      )}

      {/* MANUAL SINGLE INSERTION */}
      {activeSubTab === 'manual' && (
        <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <h2 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
            <Plus className="w-5 h-5 text-emerald-500" />
            <span>Inserir e Distribuir Novo Lead Individual</span>
          </h2>

          {manualFeedback && (
            <div
              className={`p-4 rounded-2xl flex items-start gap-3 border ${
                manualFeedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-300'
                  : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300'
              }`}
            >
              {manualFeedback.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="text-xs font-medium leading-relaxed">{manualFeedback.message}</div>
            </div>
          )}

          <form onSubmit={handleManualSubmit} className="space-y-5">
            {/* Lead Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Nome do Cliente <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nome completo"
                  value={manualForm.nome}
                  onChange={(e) => setManualForm({ ...manualForm, nome: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Telefone / Celular <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="(00) 00000-0000"
                  value={manualForm.telefone}
                  onChange={(e) => setManualForm({ ...manualForm, telefone: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">E-mail (opcional)</label>
                <input
                  type="email"
                  placeholder="exemplo@email.com"
                  value={manualForm.email}
                  onChange={(e) => setManualForm({ ...manualForm, email: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">CPF do Cliente (opcional)</label>
                <input
                  type="text"
                  placeholder="000.000.000-00"
                  value={manualForm.cpf}
                  onChange={(e) => setManualForm({ ...manualForm, cpf: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Origem do Cadastro</label>
                <select
                  value={manualForm.origem}
                  onChange={(e) => setManualForm({ ...manualForm, origem: e.target.value as Lead['origem'] })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="Plantão Presencial">Plantão Presencial</option>
                  <option value="Instagram/Facebook">Instagram / Facebook</option>
                  <option value="Google Ads">Google Ads</option>
                  <option value="Indicação">Indicação de Cliente / Amigo</option>
                  <option value="Tenda/Panfletagem">Tenda / Panfletagem</option>
                  <option value="Portal Imobiliário">Portal Imobiliário (Ex: VivaReal)</option>
                  <option value="WhatsApp Direto">WhatsApp Direto Comercial</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Profissão (opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: Auxiliar Administrativo"
                  value={manualForm.profissao}
                  onChange={(e) => setManualForm({ ...manualForm, profissao: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Renda Familiar Mensal</label>
                <input
                  type="text"
                  placeholder="R$ 0,00"
                  value={rendaInput.displayValue}
                  onChange={rendaInput.onChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Saldo de FGTS</label>
                <input
                  type="text"
                  placeholder="R$ 0,00"
                  value={fgtsInput.displayValue}
                  onChange={fgtsInput.onChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Anotações / Observação do Cliente</label>
              <textarea
                rows={2}
                placeholder="Insira detalhes adicionais de contato ou interesses do cliente..."
                value={manualForm.observacoesGerais}
                onChange={(e) => setManualForm({ ...manualForm, observacoesGerais: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            {/* Distribution Method Cards */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Forma de Atribuição de Atendimento</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Option 1: Roulette */}
                <div
                  onClick={() => setManualForm({ ...manualForm, assignmentMode: 'roulette' })}
                  className={`p-4 rounded-2xl border cursor-pointer flex flex-col justify-between transition-all space-y-2 ${
                    manualForm.assignmentMode === 'roulette'
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 ring-1 ring-emerald-500'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-300">
                      <Dices className="w-4 h-4" />
                    </span>
                    <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      manualForm.assignmentMode === 'roulette' ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'
                    }`}>
                      {manualForm.assignmentMode === 'roulette' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white">Roleta de Vez</h4>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      Atribui ao corretor da vez ({nextBroker?.corretorNome || 'Nenhum'}).
                    </p>
                  </div>
                </div>

                {/* Option 2: Caixa de Leads (Pool) */}
                <div
                  onClick={() => setManualForm({ ...manualForm, assignmentMode: 'caixa' })}
                  className={`p-4 rounded-2xl border cursor-pointer flex flex-col justify-between transition-all space-y-2 ${
                    manualForm.assignmentMode === 'caixa'
                      ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 ring-1 ring-amber-500'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="p-1.5 rounded-lg bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-300">
                      <Layers className="w-4 h-4" />
                    </span>
                    <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      manualForm.assignmentMode === 'caixa' ? 'border-amber-500 bg-amber-500' : 'border-slate-300'
                    }`}>
                      {manualForm.assignmentMode === 'caixa' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white">Caixa de Leads</h4>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      Mantém no pool geral. Qualquer corretor poderá resgatar.
                    </p>
                  </div>
                </div>

                {/* Option 3: Manual Direct Selection */}
                <div
                  onClick={() => setManualForm({ ...manualForm, assignmentMode: 'manual' })}
                  className={`p-4 rounded-2xl border cursor-pointer flex flex-col justify-between transition-all space-y-2 ${
                    manualForm.assignmentMode === 'manual'
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 ring-1 ring-blue-500'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="p-1.5 rounded-lg bg-blue-100 text-blue-900 dark:bg-blue-900/60 dark:text-blue-300">
                      <UserCheck className="w-4 h-4" />
                    </span>
                    <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      manualForm.assignmentMode === 'manual' ? 'border-blue-500 bg-blue-500' : 'border-slate-300'
                    }`}>
                      {manualForm.assignmentMode === 'manual' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white">Corretor Específico</h4>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      Atribui diretamente ao profissional selecionado abaixo.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Direct selector dropdown */}
            {manualForm.assignmentMode === 'manual' && (
              <div className="space-y-1.5 bg-blue-50/20 dark:bg-blue-950/10 p-4 border border-blue-100 dark:border-blue-950 rounded-2xl animate-in slide-in-from-top duration-200">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Selecione o Corretor Responsável</label>
                <select
                  required
                  value={manualForm.manualBrokerId}
                  onChange={(e) => setManualForm({ ...manualForm, manualBrokerId: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm focus:outline-none"
                >
                  <option value="">-- Selecione o Profissional --</option>
                  {users
                    .filter((u) => u.role === 'corretor' || u.role === 'coordenador')
                    .map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.role})
                      </option>
                    ))}
                </select>
              </div>
            )}

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-extrabold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-transform hover:scale-[1.01]"
              >
                <Send className="w-4 h-4" />
                <span>Salvar e Realizar Distribuição</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SPREADSHEET BULK UPLOAD */}
      {activeSubTab === 'spreadsheet' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* CSV template instructions and drag box */}
            <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-emerald-500" />
                  <span>1. Envie sua Planilha</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Formatos aceitos: <strong>CSV</strong> (separados por ponto e vírgula <code>;</code> ou vírgula <code>,</code>) ou planilhas de texto exportadas do Excel.
                </p>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2.5">
                  <h4 className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Ordem recomendada de colunas:</h4>
                  <p className="text-[10px] text-slate-400">
                    Nome • Telefone • E-mail • CPF • Renda • FGTS • Profissão
                  </p>
                  <button
                    onClick={downloadCsvTemplate}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Baixar Modelo de Planilha CSV</span>
                  </button>
                </div>
              </div>

              {/* Upload area */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`p-8 text-center rounded-2xl border-2 border-dashed transition-all cursor-pointer space-y-2 ${
                    isDragging
                      ? 'bg-emerald-500/15 border-emerald-500 scale-[1.02] shadow-sm'
                      : 'bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/30'
                  }`}
                >
                  <Upload className={`w-8 h-8 mx-auto transition-transform ${isDragging ? 'scale-110 text-emerald-600 dark:text-emerald-400' : 'text-emerald-500'}`} />
                  <div>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {isDragging ? 'Solte a planilha aqui!' : 'Carregar arquivo .CSV'}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">Arrastar e soltar ou clique para buscar</p>
                  </div>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".csv"
                  onChange={handleCsvUpload}
                  className="hidden"
                />

                {csvFile && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2 truncate">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="text-[11px] text-slate-700 dark:text-slate-300 font-bold truncate">{csvFile.name}</span>
                    </div>
                    <button
                      onClick={() => {
                        setCsvFile(null);
                        setParsedData([]);
                        setHeaders([]);
                        setPreviewLeads([]);
                        setSpreadsheetFeedback(null);
                      }}
                      className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* AUTOMATIC DIRECT IMPORT CONFIGURATION */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Importação Automática</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Insere direto ao carregar o arquivo</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoInsertOnUpload}
                      onChange={(e) => setAutoInsertOnUpload(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>

                {autoInsertOnUpload && (
                  <div className="space-y-3 p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl animate-in fade-in duration-200">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Destino de Distribuição</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setAutoInsertMode('roulette')}
                        className={`py-2 px-3 rounded-xl text-xs font-extrabold flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer ${
                          autoInsertMode === 'roulette'
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                        }`}
                      >
                        <span>Fila da Roleta</span>
                        <span className="text-[9px] font-medium opacity-85">Giro da vez</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAutoInsertMode('caixa')}
                        className={`py-2 px-3 rounded-xl text-xs font-extrabold flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer ${
                          autoInsertMode === 'caixa'
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                        }`}
                      >
                        <span>Caixa de Leads</span>
                        <span className="text-[9px] font-medium opacity-85">Resgate livre</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Dynamic Column Mapping */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-emerald-500" />
                <span>2. Mapeamento Inteligente de Colunas</span>
              </h3>

              {headers.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-2xl">
                  {Object.keys(columnMapping).map((field) => (
                    <div key={field} className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        {field === 'nome' && 'Nome do Cliente'}
                        {field === 'telefone' && 'Telefone'}
                        {field === 'email' && 'E-mail'}
                        {field === 'cpf' && 'CPF'}
                        {field === 'rendaFamiliar' && 'Renda Mensal'}
                        {field === 'fgts' && 'Saldo de FGTS'}
                        {field === 'profissao' && 'Profissão'}
                      </label>
                      <select
                        value={columnMapping[field]}
                        onChange={(e) => handleMappingChange(field, parseInt(e.target.value))}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-white text-xs"
                      >
                        <option value="-1">-- Ignorar / Não possuo --</option>
                        {headers.map((hdr, idx) => (
                          <option key={hdr} value={idx}>
                            Coluna {idx + 1}: {hdr}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-800/20">
                  Aguardando envio do arquivo para carregar o mapeamento de colunas.
                </div>
              )}

              {/* Guidelines tip */}
              <div className="text-[11px] text-slate-400 bg-slate-50 dark:bg-slate-800/20 p-3.5 rounded-xl">
                💡 <strong>Dica:</strong> Se sua planilha possuir os cabeçalhos literais (Ex: "Nome", "Telefone", "E-mail"), o sistema fará o mapeamento automático para você!
              </div>
            </div>
          </div>

          {/* Feedback & Bulk Action Bar */}
          {spreadsheetFeedback && (
            <div
              className={`p-5 rounded-3xl border space-y-3 ${
                spreadsheetFeedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-950 dark:bg-emerald-950/30 dark:border-emerald-900 dark:text-emerald-200'
                  : 'bg-rose-50 border-rose-200 text-rose-950 dark:bg-rose-950/30 dark:border-rose-900 dark:text-rose-200'
              }`}
            >
              <div className="flex items-start gap-3">
                {spreadsheetFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="font-bold text-xs sm:text-sm">{spreadsheetFeedback.message}</h4>
                  {spreadsheetFeedback.details && spreadsheetFeedback.details.length > 0 && (
                    <div className="mt-3 text-[11px] text-slate-600 dark:text-slate-400 space-y-1 bg-white/50 dark:bg-slate-900/40 p-3 rounded-2xl border border-emerald-100/30 overflow-auto max-h-48">
                      {spreadsheetFeedback.details.map((detail, idx) => (
                        <p key={idx}>{detail}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Table Preview and distribution trigger */}
          {previewLeads.length > 0 && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                    3. Visualização e Seleção de Leads
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Marque os leads que deseja importar. Duplicados foram identificados e desmarcados por segurança.
                  </p>
                </div>

                <button
                  onClick={toggleSelectAll}
                  className="px-4 py-1.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer hover:bg-slate-100"
                >
                  {previewLeads.every((l) => l.selected) ? 'Desmarcar Todos' : 'Selecionar Todos'}
                </button>
              </div>

              {/* Grid/Table preview */}
              <div className="overflow-x-auto max-h-96 border border-slate-100 dark:border-slate-800 rounded-2xl divide-y divide-slate-100">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/40 text-[10px] uppercase font-bold text-slate-500">
                      <th className="p-3 w-12 text-center">Importar</th>
                      <th className="p-3">Nome</th>
                      <th className="p-3">Telefone</th>
                      <th className="p-3">E-mail / CPF</th>
                      <th className="p-3">Renda / FGTS</th>
                      <th className="p-3">Qualificação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {previewLeads.map((lead, index) => (
                      <tr
                        key={index}
                        className={`text-xs hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors ${
                          lead.isDuplicate ? 'bg-amber-50/20 dark:bg-amber-950/5' : ''
                        }`}
                      >
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={lead.selected}
                            onChange={() => toggleSelectLead(index)}
                            disabled={!lead.nome || !lead.telefone}
                            className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                          />
                        </td>
                        <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                          {lead.nome || <span className="text-rose-500 font-bold italic">[Nome ausente]</span>}
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-400">
                          {lead.telefone || <span className="text-rose-500 font-bold italic">[Contato ausente]</span>}
                        </td>
                        <td className="p-3 text-slate-500">
                          <p>{lead.email || '-'}</p>
                          <p className="text-[10px] font-mono text-slate-400">{lead.cpf || '-'}</p>
                        </td>
                        <td className="p-3">
                          <p className="text-slate-700 dark:text-slate-300 font-bold">R$ {lead.rendaFamiliar.toLocaleString('pt-BR')}</p>
                          <p className="text-[10px] text-slate-400">FGTS: R$ {lead.fgts.toLocaleString('pt-BR')}</p>
                        </td>
                        <td className="p-3">
                          {lead.isDuplicate ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[9px] font-bold">
                              <AlertCircle className="w-3 h-3" />
                              <span>Duplicidade ({lead.duplicateLeadName})</span>
                            </span>
                          ) : !lead.nome || !lead.telefone ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[9px] font-bold">
                              <AlertCircle className="w-3 h-3" />
                              <span>Campos Obrigatórios em Falta</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-bold">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Apto para Importar</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Distribute options trigger */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  🎯 Como deseja distribuir este lote de <strong>{previewLeads.filter((l) => l.selected).length}</strong> leads marcados?
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button
                    onClick={() => handleBulkSubmit('roulette')}
                    className="px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-transform hover:scale-[1.01]"
                  >
                    <Dices className="w-4 h-4" />
                    <span>Distribuir por Vez (Roleta 1 a 1)</span>
                  </button>

                  <button
                    onClick={() => handleBulkSubmit('caixa')}
                    className="px-4 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-transform hover:scale-[1.01]"
                  >
                    <Layers className="w-4 h-4" />
                    <span>Enviar para Caixa de Leads</span>
                  </button>

                  <button
                    onClick={() => {
                      const bId = prompt(
                        'Insira o ID do Corretor, ou cancele para selecionar no menu manual:\n' +
                          users
                            .filter((u) => u.role === 'corretor')
                            .map((u) => `- [ID: ${u.id}] ${u.name}`)
                            .join('\n')
                      );
                      if (bId) {
                        handleBulkSubmit('manual', bId);
                      }
                    }}
                    className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-transform hover:scale-[1.01]"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Atribuir Tudo a um Corretor</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
