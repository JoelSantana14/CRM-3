import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Lead, FunnelStage, ContactType, LeadDocumentType, LeadDocument, SavedSimulation } from '../types';
import { formatCurrency } from '../utils/simulatorEngine';
import { useNumericInput } from '../hooks/useNumericInput';
import {
  User,
  Phone,
  Mail,
  Calendar,
  Tag,
  DollarSign,
  FileText,
  Clock,
  Send,
  Trash2,
  Edit3,
  CheckCircle,
  ExternalLink,
  MessageSquare,
  Building,
  UserCheck,
  Flame,
  ShieldAlert,
  ArrowRightLeft,
  Share2,
  AlertTriangle,
  Sparkles,
  Calculator,
  FolderCheck,
  Plus,
  Eye,
  Download,
  Paperclip,
  RotateCw,
  Building2,
  Check,
  XCircle,
  AlertOctagon,
  History,
  HelpCircle,
} from 'lucide-react';

interface LeadModalProps {
  lead: Lead | null;
  onClose: () => void;
}

const REQUIRED_DOC_TYPES: {
  key: LeadDocumentType;
  title: string;
  description: string;
  badgeTag: string;
}[] = [
  {
    key: 'rg_cnh',
    title: 'Documento de Identidade com Foto',
    description: 'RG com CPF ou CNH (foto do documento aberto)',
    badgeTag: 'Obrigatório',
  },
  {
    key: 'comprovante_residencia',
    title: 'Comprovante de Residência Atual',
    description: 'Conta de luz, água ou telefone de no máximo 2 meses atrás',
    badgeTag: 'Obrigatório',
  },
  {
    key: 'certidao_estado_civil',
    title: 'Comprovante de Estado Civil',
    description: 'Certidão de Nascimento (solteiros) ou Casamento/Averbação',
    badgeTag: 'Obrigatório',
  },
  {
    key: 'comprovante_renda',
    title: 'Comprovante de Renda (Formal / Informal)',
    description: 'Holerites (2 últimos), extratos bancários (3 últimos) ou Imposto de Renda',
    badgeTag: 'Obrigatório',
  },
  {
    key: 'extrato_fgts',
    title: 'Extrato do FGTS (Caixa Econômica)',
    description: 'Extrato atualizado do saldo e contas ativas/inativas do FGTS',
    badgeTag: 'Recomendado',
  },
  {
    key: 'carteira_trabalho',
    title: 'Carteira de Trabalho (CTPS)',
    description: 'Foto, identificação, todos os contratos registrados e número do PIS',
    badgeTag: 'MCMV',
  },
  {
    key: 'certidao_dependentes',
    title: 'Certidão de Dependentes',
    description: 'Certidão de nascimento dos filhos menores de 18 anos (para subsídio)',
    badgeTag: 'Subsídio',
  },
  {
    key: 'documentos_conjuge_socio',
    title: 'Documentos do Cônjuge ou Sócio',
    description: 'RG/CPF, Comprovante de Renda e Estado Civil do cônjuge/sócio',
    badgeTag: 'Co-comprador',
  },
];

export const LeadModal: React.FC<LeadModalProps> = ({ lead, onClose }) => {
  const {
    updateLead,
    updateLeadStatus,
    addLeadNote,
    addLeadActivity,
    transferLead,
    deleteLeadWithAudit,
    currentUser,
    users,
    teams,
    tags: allTags,
    setSelectedUnitForSimulator,
    setActiveTab,
    units,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'dados' | 'simulacoes' | 'documentos' | 'marketing' | 'atividades'>('dados');
  const [editing, setEditing] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [leadTags, setLeadTags] = useState<string[]>(lead?.tags || []);

  // Document & Simulation management state
  const [customDocTitle, setCustomDocTitle] = useState('');
  const [showAddCustomDocModal, setShowAddCustomDocModal] = useState(false);
  const [previewDocUrl, setPreviewDocUrl] = useState<{ url: string; title: string } | null>(null);

  // Atividades Form State
  const [activityText, setActivityText] = useState('');
  const [activityContactType, setActivityContactType] = useState<ContactType>('whatsapp');
  const [activityAuthor, setActivityAuthor] = useState<'corretor' | 'cliente'>('corretor');
  const [nextActionDate, setNextActionDate] = useState(lead?.proximaAcaoData || '');
  const [nextActionDesc, setNextActionDesc] = useState(lead?.proximaAcaoDescricao || '');
  const [brokerSubjectAlert, setBrokerSubjectAlert] = useState(false);

  // Transfer Modal State
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferCorretorId, setTransferCorretorId] = useState('');
  const [transferMotivo, setTransferMotivo] = useState('');

  // Delete Audit Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteMotivo, setDeleteMotivo] = useState('');
  const [deletedProtocol, setDeletedProtocol] = useState<string | null>(null);

  // Edit fields
  const [nome, setNome] = useState(lead?.nome || '');
  const [nacionalidade, setNacionalidade] = useState(lead?.nacionalidade || 'Brasileiro(a)');
  const [cpf, setCpf] = useState(lead?.cpf || '');
  const [telefone, setTelefone] = useState(lead?.telefone || '');
  const [email, setEmail] = useState(lead?.email || '');
  const [rendaFamiliar, setRendaFamiliar] = useState(lead?.rendaFamiliar || 0);
  const [fgts, setFgts] = useState(lead?.fgts || 0);
  const [valorFinanciadoAprovado, setValorFinanciadoAprovado] = useState(lead?.valorFinanciadoAprovado || 0);
  const [parcelaAprovada, setParcelaAprovada] = useState(lead?.parcelaAprovada || 0);
  const [valorEntrada, setValorEntrada] = useState(lead?.valorEntrada || 0);
  const [status, setStatus] = useState<FunnelStage>(lead?.status || 'pre_cadastro');

  // Marketing profile fields
  const [dataVisita, setDataVisita] = useState(lead?.dataVisita || '');
  const [filhos, setFilhos] = useState(lead?.filhos || 0);

  const rendaHook = useNumericInput({
    initialValue: lead?.rendaFamiliar || 0,
    onChange: setRendaFamiliar,
    isCurrency: true,
  });

  const fgtsHook = useNumericInput({
    initialValue: lead?.fgts || 0,
    onChange: setFgts,
    isCurrency: true,
  });

  const financHook = useNumericInput({
    initialValue: lead?.valorFinanciadoAprovado || 0,
    onChange: setValorFinanciadoAprovado,
    isCurrency: true,
  });

  const filhosHook = useNumericInput({
    initialValue: lead?.filhos || 0,
    onChange: setFilhos,
    isCurrency: false,
  });
  const [estadoCivil, setEstadoCivil] = useState(lead?.estadoCivil || 'solteiro');
  const [ocupacao, setOcupacao] = useState(lead?.ocupacao || 'clt');
  const [endereco, setEndereco] = useState(lead?.endereco || '');
  const [bairro, setBairro] = useState(lead?.bairro || '');
  const [cidade, setCidade] = useState(lead?.cidade || 'Curitiba');
  const [escolaridade, setEscolaridade] = useState(lead?.escolaridade || 'medio');
  const [flagPrePlantao, setFlagPrePlantao] = useState(lead?.flagPrePlantao || false);
  const [observacoesGerais, setObservacoesGerais] = useState(lead?.observacoesGerais || '');

  // CEF Analysis state
  const [cefParecer, setCefParecer] = useState(lead?.parecerAnaliseCef || '');
  const [cefAgenciaNome, setCefAgenciaNome] = useState(
    lead?.agenciaCorrespondenteNome || 'Agência Caixa Sertão (Correspondente CEF)'
  );
  const [cefAgenciaId, setCefAgenciaId] = useState(
    lead?.agenciaCorrespondenteId || 'agencia-sertao-1'
  );

  if (!lead) return null;

  const handleRecordCefAnalysis = (
    novoStatus: 'aprovado' | 'reprovado' | 'condicionado' | 'pendencia',
    alterarEtapaParaDocColetada: boolean = false
  ) => {
    if (!lead) return;

    const dataAtual = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const tagMap = {
      aprovado: '#AprovadoCEF',
      reprovado: '#ReprovadoCEF',
      condicionado: '#CondicionadoCEF',
      pendencia: '#PendenciaCEF',
    };

    const newTag = tagMap[novoStatus];

    const cleanTags = (lead.tags || []).filter(
      (t) => !['#AprovadoCEF', '#ReprovadoCEF', '#CondicionadoCEF', '#PendenciaCEF'].includes(t)
    );
    const updatedTags = [...cleanTags, newTag];

    let novoStatusFunil = lead.status;
    if (novoStatus === 'aprovado') {
      novoStatusFunil = 'aprovado_cef';
    } else if (alterarEtapaParaDocColetada || novoStatus === 'pendencia') {
      novoStatusFunil = 'doc_coletada';
    }

    const historicoItem = {
      id: `cef_${Date.now()}`,
      data: dataAtual,
      statusAnalise: novoStatus,
      parecer: cefParecer.trim() || 'Sem observações adicionais.',
      responsavelNome: currentUser.name || cefAgenciaNome,
      agenciaNome: cefAgenciaNome,
    };

    const novoHistorico = [historicoItem, ...(lead.historicoAnaliseCef || [])];

    updateLead(lead.id, {
      statusAnaliseCef: novoStatus,
      parecerAnaliseCef: cefParecer.trim(),
      dataAnaliseCef: dataAtual,
      analisadoPorNome: currentUser.name,
      agenciaCorrespondenteId: cefAgenciaId,
      agenciaCorrespondenteNome: cefAgenciaNome,
      status: novoStatusFunil,
      tags: updatedTags,
      historicoAnaliseCef: novoHistorico,
    });

    const statusLabels = {
      aprovado: 'APROVADO CEF',
      reprovado: 'REPROVADO CEF',
      condicionado: 'CRÉDITO CONDICIONADO CEF',
      pendencia: 'AVISO DE PENDÊNCIA CEF',
    };

    addLeadActivity(
      lead.id,
      'sistema',
      'corretor',
      `🏛️ [Análise CEF - ${cefAgenciaNome}] Status: ${statusLabels[novoStatus]}. Parecer: "${cefParecer.trim() || 'Registrado'}"${
        alterarEtapaParaDocColetada ? ' -> Retornado para Coleta de Documentos.' : ''
      }`
    );

    alert(`Parecer da Análise CEF registrado com sucesso! (${statusLabels[novoStatus]})`);
  };

  const handleReenviarParaAnalise = () => {
    if (!lead) return;

    updateLead(lead.id, {
      status: 'analise_cef',
      statusAnaliseCef: 'pendente',
    });

    addLeadActivity(
      lead.id,
      'sistema',
      'corretor',
      `🔄 Pendência/Condicionamento sanado pelo corretor ${currentUser.name}. Cliente reenviado para Análise CEF (${cefAgenciaNome}).`
    );

    alert('Cliente reenviado com sucesso para Análise CEF!');
  };

  const handleUploadDocument = (
    tipo: LeadDocumentType,
    file: File,
    pertenceA: 'titular' | 'conjuge_socio' | 'outros' = 'titular',
    tituloCustomizado?: string
  ) => {
    if (!file || !lead) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      let finalDataUrl = reader.result as string;

      if (file.type.startsWith('image/')) {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_DIM = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_DIM) {
              height *= MAX_DIM / width;
              width = MAX_DIM;
            }
          } else {
            if (height > MAX_DIM) {
              width *= MAX_DIM / height;
              height = MAX_DIM;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            finalDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          }

          saveDocRecord(finalDataUrl);
        };
        img.src = reader.result as string;
      } else {
        saveDocRecord(finalDataUrl);
      }

      function saveDocRecord(dataUrl: string) {
        const nowStr = new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const newDoc: LeadDocument = {
          id: 'doc-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
          tipo,
          tituloCustomizado: tituloCustomizado || undefined,
          nomeArquivo: file.name,
          arquivoUrl: dataUrl,
          dataEnvio: nowStr,
          tamanhoBytes: file.size,
          enviadoPorNome: currentUser.name,
          pertenceA,
        };

        const existingDocs = lead?.documentos || [];
        const updatedDocs = tipo === 'outros'
          ? [newDoc, ...existingDocs]
          : [newDoc, ...existingDocs.filter((d) => d.tipo !== tipo || d.pertenceA !== pertenceA)];

        updateLead(lead!.id, { documentos: updatedDocs });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteDocument = (docId: string) => {
    if (!lead) return;
    const updatedDocs = (lead.documentos || []).filter((d) => d.id !== docId);
    updateLead(lead.id, { documentos: updatedDocs });
  };

  const handleDeleteSimulation = (simId: string) => {
    if (!lead) return;
    const updatedSims = (lead.simulacoes || []).filter((s) => s.id !== simId);
    updateLead(lead.id, { simulacoes: updatedSims });
  };

  const handleSaveEdit = () => {
    updateLead(lead.id, {
      nome,
      nacionalidade,
      cpf,
      telefone,
      email,
      rendaFamiliar,
      fgts,
      valorFinanciadoAprovado,
      parcelaAprovada,
      valorEntrada,
      status,
      dataVisita,
      filhos,
      estadoCivil: estadoCivil as any,
      ocupacao: ocupacao as any,
      endereco,
      bairro,
      cidade,
      escolaridade: escolaridade as any,
      flagPrePlantao,
      observacoesGerais,
      tags: leadTags,
    });
    setEditing(false);
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (newNoteText.trim()) {
      addLeadNote(lead.id, newNoteText.trim());
      setNewNoteText('');
    }
  };

  const handleSendActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityText.trim()) return;

    const result = addLeadActivity(lead.id, activityContactType, activityAuthor, activityText.trim());
    if (result.isBrokerSubject) {
      setBrokerSubjectAlert(true);
      setTimeout(() => setBrokerSubjectAlert(false), 8000);
    }
    setActivityText('');
  };

  const handleConfirmTransfer = () => {
    if (!transferCorretorId || !transferMotivo.trim()) return;
    const targetUser = users.find((u) => u.id === transferCorretorId);
    const targetTeamId = targetUser?.teamId || lead.equipeId;

    const success = transferLead(lead.id, transferCorretorId, targetTeamId, transferMotivo);
    if (success) {
      setShowTransferModal(false);
      onClose();
    }
  };

  const handleConfirmDelete = () => {
    if (!deleteMotivo.trim()) return;
    const protocol = deleteLeadWithAudit(lead.id, deleteMotivo);
    setDeletedProtocol(protocol);
    setTimeout(() => {
      setShowDeleteModal(false);
      onClose();
    }, 2500);
  };

  const openWhatsApp = () => {
    const cleanPhone = lead.telefone.replace(/\D/g, '');
    const url = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(
      `Olá ${lead.nome}! Aqui é o corretor ${currentUser.name} do OTS Master CRM. Tudo bem?`
    )}`;
    window.open(url, '_blank');
  };

  const openLeaderWhatsApp = () => {
    const leader = users.find((u) => u.role === 'gestor' || u.role === 'admin');
    const leaderPhone = leader?.phone?.replace(/\D/g, '') || '41999990000';
    const url = `https://wa.me/55${leaderPhone}?text=${encodeURIComponent(
      `[Alerta OTS Master] Olá Líder, detectei assunto de negociação/proposta com o cliente ${lead.nome} (${lead.codigoExterno || lead.id}). Precisamos alinhar a proposta!`
    )}`;
    window.open(url, '_blank');
  };

  const stageLabels: Record<FunnelStage, string> = {
    pre_cadastro: 'Pré-Cadastro',
    contato_feito: 'Contato Realizado',
    visita_agendada: 'Visita Agendada',
    visita_realizada: 'Visita no Plantão',
    doc_coletada: 'Documentação Coletada',
    analise_cef: 'Análise de Crédito Caixa',
    aprovado_cef: 'Aprovado CEF',
    condicionado_cef: 'Condicionado Caixa',
    reprovado_cef: 'Reprovado Caixa',
    contrato_assinado: 'Contrato Assinado / Venda',
    perdido: 'Arquivado / Perdido',
  };

  const currentTeam = teams.find((t) => t.id === lead.equipeId);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showTransferModal) setShowTransferModal(false);
        else if (showDeleteModal) setShowDeleteModal(false);
        else if (showAddCustomDocModal) setShowAddCustomDocModal(false);
        else if (previewDocUrl) setPreviewDocUrl(null);
        else onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showTransferModal, showDeleteModal, showAddCustomDocModal, previewDocUrl, onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto animate-in fade-in zoom-in-95 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 flex items-start justify-between shrink-0">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {lead.codigoExterno || `JV-${lead.id}`}
              </span>
              <h2 className="text-xl font-bold tracking-tight">{lead.nome}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-600 text-white">
                {stageLabels[lead.status]}
              </span>
              {lead.statusAnaliseCef === 'pendencia' && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white animate-pulse">
                  ⚠️ Pendência CEF
                </span>
              )}
              {lead.statusAnaliseCef === 'condicionado' && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-600 text-white">
                  🟣 Crédito Condicionado
                </span>
              )}
              {lead.statusAnaliseCef === 'aprovado' && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500 text-white">
                  🟢 Aprovado CEF
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 flex items-center gap-2">
              <span>Cadastrado em {lead.dataCadastro}</span>
              <span>•</span>
              <span>Origem: {lead.origem}</span>
              <span>•</span>
              <span>Corretor: {lead.corretorNome} ({currentTeam?.name || 'Sem Equipe'})</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-lead-whatsapp"
              onClick={openWhatsApp}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-2xs"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-sm"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Banner de Pendência CEF / Observações do Correspondente */}
        {(lead.statusAnaliseCef === 'pendencia' || lead.statusAnaliseCef === 'condicionado') && (
          <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800 p-4 shrink-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide bg-amber-600 text-white">
                    {lead.statusAnaliseCef === 'pendencia' ? '⚠️ Pendência Identificada pela Caixa' : '🟣 Crédito Condicionado pela Caixa'}
                  </span>
                  <span className="font-bold text-amber-900 dark:text-amber-200">
                    {lead.agenciaCorrespondenteNome || 'Agência Caixa Sertão (Correspondente CEF)'}
                  </span>
                  {lead.dataAnaliseCef && (
                    <span className="text-amber-700 dark:text-amber-400 text-[10px]">({lead.dataAnaliseCef})</span>
                  )}
                </div>
                <p className="text-amber-950 dark:text-amber-100 font-medium text-xs pt-1">
                  <strong>Parecer Técnico / Exigência:</strong> "{lead.parecerAnaliseCef || 'Verifique as observações e documentos para regularização.'}"
                </p>
                <p className="text-[11px] text-amber-800 dark:text-amber-300">
                  O corretor ou gestor responsável deve sanar o problema indicado acima e reenviar o cadastro para nova análise da Agência/Correspondente.
                </p>
              </div>

              {(currentUser.role === 'corretor' || currentUser.role === 'gestor' || currentUser.role === 'admin') && (
                <button
                  type="button"
                  onClick={handleReenviarParaAnalise}
                  className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shrink-0 shadow-2xs flex items-center gap-1.5 transition-colors"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Sanar Pendência e Reenviar CEF</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* 5 Tabs Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-3 sm:px-6 shrink-0 overflow-x-auto scrollbar-none">
          <button
            id="tab-btn-dados"
            onClick={() => setActiveSubTab('dados')}
            className={`py-3 px-3 sm:px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
              activeSubTab === 'dados'
                ? 'border-emerald-600 text-emerald-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Dados Principais</span>
          </button>

          <button
            id="tab-btn-simulacoes"
            onClick={() => setActiveSubTab('simulacoes')}
            className={`py-3 px-3 sm:px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
              activeSubTab === 'simulacoes'
                ? 'border-emerald-600 text-emerald-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>Simulações & Propostas</span>
            {(lead.simulacoes?.length || 0) > 0 && (
              <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {lead.simulacoes?.length}
              </span>
            )}
          </button>

          <button
            id="tab-btn-documentos"
            onClick={() => setActiveSubTab('documentos')}
            className={`py-3 px-3 sm:px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
              activeSubTab === 'documentos'
                ? 'border-emerald-600 text-emerald-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FolderCheck className="w-4 h-4" />
            <span>Documentos CEF</span>
            {(lead.documentos?.length || 0) > 0 && (
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {lead.documentos?.length}
              </span>
            )}
          </button>

          <button
            id="tab-btn-marketing"
            onClick={() => setActiveSubTab('marketing')}
            className={`py-3 px-3 sm:px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
              activeSubTab === 'marketing'
                ? 'border-emerald-600 text-emerald-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Perfil & Marketing</span>
          </button>

          <button
            id="tab-btn-atividades"
            onClick={() => setActiveSubTab('atividades')}
            className={`py-3 px-3 sm:px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 shrink-0 relative ${
              activeSubTab === 'atividades'
                ? 'border-emerald-600 text-emerald-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Atividades (Chat)</span>
            {(lead.atividades?.length || 0) > 0 && (
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {lead.atividades?.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* TAB 1: DADOS PRINCIPAIS */}
          {activeSubTab === 'dados' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Informações Financeiras & Contato</span>
                <div className="flex items-center gap-2">
                  {!editing ? (
                    <button
                      onClick={() => setEditing(true)}
                      className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Editar Dados</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleSaveEdit}
                      className="flex items-center gap-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Salvar Alterações</span>
                    </button>
                  )}
                </div>
              </div>

              {!editing ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-xs">
                  <div>
                    <p className="text-slate-400 font-medium">Nacionalidade</p>
                    <p className="font-semibold text-slate-800 mt-0.5">{lead.nacionalidade || 'Brasileiro(a)'}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-medium">CPF do Cliente</p>
                    <p className="font-semibold text-slate-800 mt-0.5">{lead.cpf || 'Não informado'}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-medium">Telefone / WhatsApp</p>
                    <p className="font-semibold text-slate-800 mt-0.5">{lead.telefone}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-medium">E-mail</p>
                    <p className="font-semibold text-slate-800 mt-0.5">{lead.email || 'Não informado'}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-slate-400 font-medium">Endereço Residencial</p>
                    <p className="font-semibold text-slate-800 mt-0.5">{lead.endereco || 'Não informado'}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-medium">Bairro de Origem</p>
                    <p className="font-semibold text-slate-800 mt-0.5">{lead.bairro || 'Não informado'}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-medium">Cidade</p>
                    <p className="font-semibold text-slate-800 mt-0.5">{lead.cidade || 'Curitiba'}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-medium">Renda Familiar</p>
                    <p className="font-semibold text-emerald-700 mt-0.5">{formatCurrency(lead.rendaFamiliar)}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-medium">Saldo FGTS</p>
                    <p className="font-semibold text-slate-800 mt-0.5">{formatCurrency(lead.fgts)}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-medium">Financiamento Aprovado</p>
                    <p className="font-semibold text-slate-800 mt-0.5">{lead.valorFinanciadoAprovado ? formatCurrency(lead.valorFinanciadoAprovado) : '-'}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-medium">Parcela Estimada CEF</p>
                    <p className="font-semibold text-slate-800 mt-0.5">{lead.parcelaAprovada ? formatCurrency(lead.parcelaAprovada) : '-'}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-medium">Entrada Negociada</p>
                    <p className="font-semibold text-slate-800 mt-0.5">{lead.valorEntrada ? formatCurrency(lead.valorEntrada) : '-'}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-medium">Status do Funil</p>
                    <p className="font-semibold text-emerald-800 mt-0.5">{stageLabels[lead.status]}</p>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="font-medium text-slate-700">Nome:</label>
                      <input
                        type="text"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="font-medium text-slate-700">Nacionalidade:</label>
                      <input
                        type="text"
                        value={nacionalidade}
                        onChange={(e) => setNacionalidade(e.target.value)}
                        placeholder="Brasileiro(a)"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="font-medium text-slate-700">CPF:</label>
                      <input
                        type="text"
                        value={cpf}
                        onChange={(e) => setCpf(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="font-medium text-slate-700">Telefone:</label>
                      <input
                        type="text"
                        value={telefone}
                        onChange={(e) => setTelefone(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="font-medium text-slate-700">E-mail:</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="font-medium text-slate-700">Endereço Residencial:</label>
                      <input
                        type="text"
                        value={endereco}
                        onChange={(e) => setEndereco(e.target.value)}
                        placeholder="Rua, número, complemento..."
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="font-medium text-slate-700">Bairro de Origem:</label>
                      <input
                        type="text"
                        value={bairro}
                        onChange={(e) => setBairro(e.target.value)}
                        placeholder="Ex: Batel, Portão, Centro..."
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="font-medium text-slate-700">Cidade:</label>
                      <input
                        type="text"
                        value={cidade}
                        onChange={(e) => setCidade(e.target.value)}
                        placeholder="Ex: Curitiba, São José dos Pinhais..."
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="font-medium text-slate-700">Renda Familiar:</label>
                      <input
                        type="text"
                        value={rendaHook.displayValue}
                        onChange={rendaHook.onChange}
                        placeholder="R$ 0,00"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="font-medium text-slate-700">FGTS:</label>
                      <input
                        type="text"
                        value={fgtsHook.displayValue}
                        onChange={fgtsHook.onChange}
                        placeholder="R$ 0,00"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="font-medium text-slate-700">Financiamento Aprovado:</label>
                      <input
                        type="text"
                        value={financHook.displayValue}
                        onChange={financHook.onChange}
                        placeholder="R$ 0,00"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Unit of Interest */}
              {lead.unidadeInteresseInfo && (
                <div className="p-4 bg-emerald-50/80 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
                  <div>
                    <p className="text-emerald-700 font-bold">Unidade de Interesse Vinculada:</p>
                    <p className="text-emerald-950 font-semibold text-sm mt-0.5">{lead.unidadeInteresseInfo}</p>
                    {lead.valorSimulacao && (
                      <p className="text-emerald-700 mt-0.5">Valor da Proposta: {formatCurrency(lead.valorSimulacao)}</p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      if (lead.unidadeInteresseId) {
                        const u = units.find((x) => x.id === lead.unidadeInteresseId);
                        if (u) setSelectedUnitForSimulator(u);
                      }
                      setActiveTab('simulador');
                      onClose();
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    <span>Abrir no Simulador</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Tags */}
              <div>
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Tags do Lead:</p>
                <div className="flex flex-wrap gap-1.5">
                  {lead.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Notas Internas:</p>
                <form onSubmit={handleAddNote} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Adicionar nota rápida sobre o lead..."
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl text-xs border border-slate-300 focus:outline-emerald-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl flex items-center gap-1"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Salvar</span>
                  </button>
                </form>

                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {lead.notas.map((n) => (
                    <div key={n.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                      <div className="flex justify-between text-slate-400 font-medium mb-1">
                        <span>{n.autorNome}</span>
                        <span>{n.dataHora}</span>
                      </div>
                      <p className="text-slate-700 font-medium">{n.texto}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PASTA DE SIMULAÇÕES */}
          {activeSubTab === 'simulacoes' && (
            <div className="space-y-4 text-xs">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-indigo-50 dark:bg-slate-800 p-4 rounded-xl border border-indigo-200 dark:border-slate-700">
                <div>
                  <h3 className="font-bold text-indigo-950 dark:text-indigo-200 text-sm flex items-center gap-1.5">
                    <Calculator className="w-4 h-4 text-indigo-600" />
                    Pasta de Simulações & Propostas ({lead.simulacoes?.length || 0})
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                    Histórico de fluxos financeiros e propostas oficiais salvas para <strong>{lead.nome}</strong>.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedUnitForSimulator(units.find((u) => u.id === lead.unidadeInteresseId) || null);
                    setActiveTab('simulador');
                    onClose();
                  }}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Gerar Nova Simulação no Simulador CEF</span>
                </button>
              </div>

              {!lead.simulacoes || lead.simulacoes.length === 0 ? (
                <div className="text-center py-10 px-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 space-y-3">
                  <Calculator className="w-10 h-10 text-slate-400 mx-auto" />
                  <div className="space-y-1">
                    <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">Nenhuma simulação salva nesta pasta</p>
                    <p className="text-slate-500 text-xs max-w-md mx-auto">
                      Quando você realiza um cálculo no Simulador CEF e salva para este cliente, a proposta fica arquivada aqui automaticamente.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedUnitForSimulator(units.find((u) => u.id === lead.unidadeInteresseId) || null);
                      setActiveTab('simulador');
                      onClose();
                    }}
                    className="mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl inline-flex items-center gap-1.5"
                  >
                    <Calculator className="w-4 h-4" />
                    <span>Abrir Simulador CEF para este Cliente</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {lead.simulacoes.map((sim, idx) => (
                    <div
                      key={sim.id}
                      className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700/80 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 px-2 py-0.5 rounded">
                            Simulação #{lead.simulacoes!.length - idx}
                          </span>
                          <span className="font-semibold text-slate-800 dark:text-slate-100">
                            {sim.unidadeInfo || 'Proposta Geral'}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              sim.statusViabilidade === 'aprovado'
                                ? 'bg-emerald-100 text-emerald-800'
                                : sim.statusViabilidade === 'atencao'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {sim.statusViabilidade === 'aprovado' ? 'Viável / Aprovado' : 'Análise Especial'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{sim.data}</span>
                          <span>• Por: {sim.criadoPorNome}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-lg border border-slate-100 dark:border-slate-800 text-[11px]">
                        <div>
                          <span className="text-slate-400 block">Valor do Imóvel</span>
                          <strong className="text-slate-900 dark:text-white font-semibold">{formatCurrency(sim.valorImovel)}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Financiamento Caixa</span>
                          <strong className="text-emerald-700 dark:text-emerald-400 font-semibold">{formatCurrency(sim.financiamentoCef)}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Subsídios (Fed + Est)</span>
                          <strong className="text-indigo-700 dark:text-indigo-400 font-semibold">{formatCurrency(sim.subsidioFederal + sim.subsidioEstadual)}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Entrada Líquida Total</span>
                          <strong className="text-amber-700 dark:text-amber-400 font-semibold">{formatCurrency(sim.totalEntradaNecessaria)}</strong>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <div className="text-[11px] text-slate-600 dark:text-slate-400 flex flex-wrap gap-x-4">
                          <span>
                            <strong>Ato 1:</strong> {formatCurrency(sim.ato1)}
                          </span>
                          <span>
                            <strong>Ato 2:</strong> {formatCurrency(sim.ato2)}
                          </span>
                          <span>
                            <strong>Ato 3:</strong> {formatCurrency(sim.ato3)}
                          </span>
                          <span>
                            <strong>Mensais:</strong> {sim.qtdMensais}x de {formatCurrency(sim.valorParcelaMensal)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedUnitForSimulator(units.find((u) => u.id === sim.unidadeId) || null);
                              setActiveTab('simulador');
                              onClose();
                            }}
                            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-[11px] font-semibold flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Carregar no Simulador</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteSimulation(sim.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                            title="Excluir simulação"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DOCUMENTAÇÃO & PASTA DE ARQUIVOS CEF */}
          {activeSubTab === 'documentos' && (
            <div className="space-y-4 text-xs">
              <div className="bg-emerald-50 dark:bg-slate-800 p-4 rounded-xl border border-emerald-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-emerald-950 dark:text-emerald-200 text-sm flex items-center gap-1.5">
                    <FolderCheck className="w-4 h-4 text-emerald-600" />
                    Pasta de Documentos de Financiamento CEF
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 text-[11px] mt-0.5">
                    Anexos para análise de crédito, FGTS, certidões do cliente e documentos do cônjuge/sócio.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowAddCustomDocModal(true)}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl flex items-center gap-1 shadow-2xs transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Anexar Documento Customizado</span>
                  </button>
                </div>
              </div>

              {/* Grid de Checklist de Documentos Necessários */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {REQUIRED_DOC_TYPES.map((docDef) => {
                  const attachedDoc = (lead.documentos || []).find((d) => d.tipo === docDef.key);

                  return (
                    <div
                      key={docDef.key}
                      className={`p-3.5 rounded-xl border transition-all ${
                        attachedDoc
                          ? 'bg-emerald-50/50 dark:bg-slate-800 border-emerald-200 dark:border-emerald-800/60'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${attachedDoc ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                            <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs">{docDef.title}</h4>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{docDef.description}</p>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                            attachedDoc
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {attachedDoc ? 'ANEXADO ✓' : docDef.badgeTag}
                        </span>
                      </div>

                      {attachedDoc ? (
                        <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-emerald-200 dark:border-slate-700 flex items-center justify-between gap-2 mt-2">
                          <div className="flex items-center gap-2 overflow-hidden">
                            {attachedDoc.arquivoUrl.startsWith('data:image/') || attachedDoc.arquivoUrl.startsWith('http') ? (
                              <img src={attachedDoc.arquivoUrl} alt="Doc Preview" className="w-8 h-8 rounded object-cover shrink-0 border border-slate-200" />
                            ) : (
                              <FileText className="w-6 h-6 text-emerald-600 shrink-0" />
                            )}
                            <div className="truncate">
                              <p className="font-semibold text-slate-800 dark:text-slate-200 truncate text-[11px]">{attachedDoc.nomeArquivo}</p>
                              <p className="text-[10px] text-slate-400">{attachedDoc.dataEnvio}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => setPreviewDocUrl({ url: attachedDoc.arquivoUrl, title: docDef.title })}
                              className="p-1 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded"
                              title="Visualizar"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteDocument(attachedDoc.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                              title="Excluir"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2">
                          <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-[11px] font-semibold transition-colors">
                            <Paperclip className="w-3.5 h-3.5 text-slate-500" />
                            <span>Anexar Arquivo / Foto</span>
                            <input
                              type="file"
                              accept="image/*,application/pdf"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files?.[0]) {
                                  handleUploadDocument(
                                    docDef.key,
                                    e.target.files[0],
                                    docDef.key === 'documentos_conjuge_socio' ? 'conjuge_socio' : 'titular'
                                  );
                                }
                              }}
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Documentos Customizados Adicionais */}
              {(lead.documentos || []).filter((d) => d.tipo === 'outros').length > 0 && (
                <div className="space-y-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs">Outros Documentos Customizados Anexados:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {(lead.documentos || [])
                      .filter((d) => d.tipo === 'outros')
                      .map((customDoc) => (
                        <div
                          key={customDoc.id}
                          className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <FileText className="w-5 h-5 text-indigo-600 shrink-0" />
                            <div className="truncate">
                              <p className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate">
                                {customDoc.tituloCustomizado || customDoc.nomeArquivo}
                              </p>
                              <p className="text-[10px] text-slate-400">{customDoc.dataEnvio}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewDocUrl({
                                  url: customDoc.arquivoUrl,
                                  title: customDoc.tituloCustomizado || customDoc.nomeArquivo,
                                })
                              }
                              className="p-1 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteDocument(customDoc.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* PAINEL DE ANÁLISE DO CORRESPONDENTE BANCÁRIO / AGÊNCIA CAIXA */}
              <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-md border border-slate-800 space-y-4 mt-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-emerald-400" />
                      <h3 className="font-bold text-sm text-white">Análise e Parecer do Correspondente Caixa</h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Área Correspondente / Agência
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Os documentos anexados acima estão visíveis para a agência/correspondente cadastrado para registro de aprovações, condicionamentos ou aviso de pendências.
                    </p>
                  </div>

                  {/* Agência Selecionada */}
                  <div className="w-full sm:w-auto shrink-0">
                    <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">
                      Agência / Correspondente Responsável:
                    </label>
                    <select
                      value={cefAgenciaNome}
                      onChange={(e) => {
                        const selectedName = e.target.value;
                        setCefAgenciaNome(selectedName);
                        const found = users.find((u) => u.name === selectedName);
                        if (found) setCefAgenciaId(found.id);
                        updateLead(lead.id, {
                          agenciaCorrespondenteNome: selectedName,
                          agenciaCorrespondenteId: found?.id || 'agencia-sertao-1',
                        });
                      }}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-emerald-300 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Agência Caixa Sertão (Correspondente CEF)">🏛️ Agência Caixa Sertão (Correspondente CEF)</option>
                      <option value="Caixa Correspondente Central">🏛️ Caixa Correspondente Central</option>
                      <option value="Agência Caixa Centro">🏛️ Agência Caixa Centro</option>
                      {users
                        .filter((u) => u.role === 'correspondente')
                        .map((u) => (
                          <option key={u.id} value={u.name}>
                            🏛️ {u.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                {/* Status da Análise CEF Atual */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-300">
                      Mensagem do Correspondente / Observações da Análise CEF:
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Registre as observações do financiamento, aprovações, exigências, documentação pendente ou restrições apontadas na análise da Caixa..."
                      value={cefParecer}
                      onChange={(e) => setCefParecer(e.target.value)}
                      className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none placeholder:text-slate-500"
                    />
                    <p className="text-[10px] text-slate-400">
                      Esta observação e tag ficarão gravadas no histórico do cliente para o corretor ou gestor sanar a pendência.
                    </p>
                  </div>

                  <div className="space-y-3 flex flex-col justify-between">
                    <div>
                      <span className="block text-xs font-semibold text-slate-300 mb-2">
                        Selecione a Ação / Tag da Análise para Gravação:
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handleRecordCefAnalysis('aprovado')}
                          className="px-3 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1.5 transition-all shadow-2xs"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Aprovar CEF</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRecordCefAnalysis('condicionado')}
                          className="px-3 py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center gap-1.5 transition-all shadow-2xs"
                        >
                          <ShieldAlert className="w-4 h-4" />
                          <span>Condicionar CEF</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRecordCefAnalysis('pendencia')}
                          className="px-3 py-2.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white flex items-center justify-center gap-1.5 transition-all shadow-2xs"
                        >
                          <AlertTriangle className="w-4 h-4" />
                          <span>Registrar Pendência</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRecordCefAnalysis('reprovado')}
                          className="px-3 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center gap-1.5 transition-all shadow-2xs"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Reprovar CEF</span>
                        </button>
                      </div>
                    </div>

                    {/* Botão de Alteração de Etapa para Coleta de Documentos */}
                    <div className="pt-2 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => handleRecordCefAnalysis('pendencia', true)}
                        className="w-full py-2.5 px-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                      >
                        <RotateCw className="w-4 h-4 text-amber-400" />
                        <span>Retornar para Coleta de Documentos (Adequação)</span>
                      </button>
                      <p className="text-[10px] text-slate-400 text-center mt-1">
                        Retorna o cliente para a etapa de coleta no funil e notifica o corretor para sanar os problemas.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Histórico Registrado de Análises da Caixa */}
                {(lead.historicoAnaliseCef || []).length > 0 && (
                  <div className="pt-3 border-t border-slate-800 space-y-2">
                    <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5 text-emerald-400" />
                      Histórico Registrado de Pareceres e Análises CEF:
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {lead.historicoAnaliseCef?.map((h) => (
                        <div key={h.id} className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700/80 text-[11px] space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-200">{h.agenciaNome}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-slate-400 text-[10px]">{h.data}</span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                                  h.statusAnalise === 'aprovado'
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    : h.statusAnalise === 'condicionado'
                                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                    : h.statusAnalise === 'reprovado'
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                }`}
                              >
                                {h.statusAnalise}
                              </span>
                            </div>
                          </div>
                          <p className="text-slate-300 italic">"{h.parecer}"</p>
                          <p className="text-[10px] text-slate-500">Registrado por: {h.responsavelNome}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: PERFIL & MARKETING */}
          {activeSubTab === 'marketing' && (
            <div className="space-y-5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="font-semibold text-slate-700">Data da Visita:</label>
                  <input
                    type="date"
                    value={dataVisita}
                    onChange={(e) => setDataVisita(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Número de Dependentes / Filhos:</label>
                  <input
                    type="text"
                    value={filhosHook.displayValue}
                    onChange={filhosHook.onChange}
                    placeholder="0"
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Estado Civil:</label>
                  <select
                    value={estadoCivil}
                    onChange={(e) => setEstadoCivil(e.target.value as any)}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="solteiro">Solteiro(a)</option>
                    <option value="casado">Casado(a)</option>
                    <option value="uniao_estavel">União Estável</option>
                    <option value="divorciado">Divorciado(a)</option>
                    <option value="viuvo">Viúvo(a)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Tipo de Ocupação Profissional:</label>
                  <select
                    value={ocupacao}
                    onChange={(e) => setOcupacao(e.target.value as any)}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="clt">CLT (Carteira Assinada)</option>
                    <option value="servidor_publico">Servidor Público</option>
                    <option value="autonomo">Profissional Autônomo</option>
                    <option value="empresario">Empresário</option>
                    <option value="microempresario">Microempresário (MEI)</option>
                    <option value="liberal">Profissional Liberal</option>
                    <option value="aposentado">Aposentado / Pensionista</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="font-semibold text-slate-700">Endereço Residencial Atual:</label>
                  <input
                    type="text"
                    placeholder="Rua, número, bairro e cidade..."
                    value={endereco}
                    onChange={(e) => setEndereco(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Nível de Escolaridade:</label>
                  <select
                    value={escolaridade}
                    onChange={(e) => setEscolaridade(e.target.value as any)}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="fundamental">Ensino Fundamental</option>
                    <option value="medio">Ensino Médio</option>
                    <option value="superior">Ensino Superior Completo</option>
                    <option value="pos_graduacao">Pós-Graduação / Mestrado</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="chk-pre-plantao"
                    checked={flagPrePlantao}
                    onChange={(e) => setFlagPrePlantao(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="chk-pre-plantao" className="font-semibold text-slate-800">
                    Lead captado no Pré-Plantão (Aquecimento)
                  </label>
                </div>

                <div className="sm:col-span-2">
                  <label className="font-semibold text-slate-700 block mb-1">
                    Tags & Segmentações do Cliente:
                  </label>
                  <div className="flex flex-wrap gap-1.5 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    {allTags.map((t) => {
                      const isSelected = leadTags.includes(t.nome);
                      return (
                        <button
                          type="button"
                          key={t.id}
                          onClick={() => {
                            if (isSelected) {
                              setLeadTags(leadTags.filter((tn) => tn !== t.nome));
                            } else {
                              setLeadTags([...leadTags, t.nome]);
                            }
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                            isSelected
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                              : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                          }`}
                        >
                          #{t.nome} {isSelected ? '✓' : ''}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="font-semibold text-slate-700">Observações de Perfil & Família:</label>
                  <textarea
                    rows={3}
                    placeholder="Sonhos da família, motivos da compra, bairros de preferência, etc."
                    value={observacoesGerais}
                    onChange={(e) => setObservacoesGerais(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl"
                >
                  Salvar Perfil de Marketing
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: ATIVIDADES (CHAT WHATSAPP-STYLE & PRÓXIMA AÇÃO) */}
          {activeSubTab === 'atividades' && (
            <div className="space-y-4">
              {/* Flashing Broker Subject Alert */}
              {brokerSubjectAlert && (
                <div className="bg-rose-500 text-white p-3 rounded-xl shadow-lg animate-pulse flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-bold">
                    <Flame className="w-5 h-5 text-amber-300 animate-bounce" />
                    <span>ALERTA: Assunto de Corretor / Negociação Detectado!</span>
                  </div>
                  <button
                    onClick={openLeaderWhatsApp}
                    className="bg-white text-rose-900 font-bold px-3 py-1 rounded-lg text-xs hover:bg-rose-50 transition-colors flex items-center gap-1"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-rose-600" />
                    <span>Acionar Líder no WhatsApp</span>
                  </button>
                </div>
              )}

              {/* Chat Container (WhatsApp Theme Background) */}
              <div className="bg-[#efeae2] dark:bg-[#0b141a] rounded-2xl p-4 border border-slate-300 dark:border-slate-800 h-72 overflow-y-auto space-y-3 flex flex-col shadow-inner">
                {(lead.atividades?.length || 0) === 0 ? (
                  <div className="m-auto text-center text-slate-500 dark:text-slate-400 text-xs bg-white/80 dark:bg-slate-900/80 p-4 rounded-xl shadow-xs">
                    <MessageSquare className="w-8 h-8 text-emerald-600 mx-auto mb-1" />
                    <p className="font-bold">Nenhum registro de atendimento ainda.</p>
                    <p className="text-[10px] text-slate-400">Registros são permanentes e gravam autor, data e hora.</p>
                  </div>
                ) : (
                  lead.atividades?.map((act) => {
                    const isCorretor = act.autor === 'corretor';
                    const isSystem = act.autor === 'sistema';

                    if (isSystem) {
                      return (
                        <div key={act.id} className="text-center my-1">
                          <span className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] px-3 py-1 rounded-full font-medium">
                            {act.texto} • {act.dataHora}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={act.id}
                        className={`flex flex-col max-w-[85%] ${isCorretor ? 'self-end items-end' : 'self-start items-start'}`}
                      >
                        <div
                          className={`p-3 rounded-2xl text-xs relative shadow-xs ${
                            isCorretor
                              ? 'bg-[#d9fdd3] dark:bg-[#005c4b] text-slate-900 dark:text-slate-100 rounded-tr-xs'
                              : 'bg-white dark:bg-[#202c33] text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-tl-xs'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3 text-[10px] opacity-75 mb-1 font-semibold">
                            <span>{act.autorNome}</span>
                            <span className="uppercase tracking-wider">
                              [{act.tipoContato}]
                            </span>
                          </div>
                          <p className="leading-relaxed whitespace-pre-wrap">{act.texto}</p>

                          {act.assuntoCorretor && (
                            <div className="mt-1.5 pt-1.5 border-t border-rose-300/40 flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-300">
                              <Flame className="w-3 h-3 text-amber-500" />
                              <span>Assunto de Negociação</span>
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 px-1 font-medium">{act.dataHora}</span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Chat Input Controls */}
              <form onSubmit={handleSendActivity} className="space-y-2 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Novo Registro de Atendimento (Permanente)</span>
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <div className="flex items-center gap-1 bg-white dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-500 font-medium">Canal:</span>
                    <select
                      value={activityContactType}
                      onChange={(e) => setActivityContactType(e.target.value as any)}
                      className="bg-transparent font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
                    >
                      <option value="whatsapp">WhatsApp</option>
                      <option value="telefone">Ligação Telefônica</option>
                      <option value="pessoalmente">Presencial no Plantão</option>
                      <option value="redes_sociais">Redes Sociais</option>
                      <option value="email">E-mail</option>
                      <option value="outro">Outro</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1 bg-white dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-500 font-medium">Autor:</span>
                    <select
                      value={activityAuthor}
                      onChange={(e) => setActivityAuthor(e.target.value as any)}
                      className="bg-transparent font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
                    >
                      <option value="corretor">Corretor ({currentUser.name})</option>
                      <option value="cliente">Cliente ({lead.nome})</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Digite o registro detalhado do atendimento..."
                    value={activityText}
                    onChange={(e) => setActivityText(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Gravar Registro</span>
                  </button>
                </div>
              </form>

              {/* Agendamento da Próxima Ação */}
              <div className="bg-emerald-50/70 dark:bg-emerald-950/40 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-900 dark:text-emerald-300">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Agendamento da Próxima Ação</span>
                  </span>
                  {lead.proximaAcaoData && (
                    <span className="text-[10px] bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 px-2 py-0.5 rounded-full">
                      Agendado: {lead.proximaAcaoData}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="date"
                    value={nextActionDate}
                    onChange={(e) => setNextActionDate(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-emerald-300 dark:border-emerald-800 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100"
                  />
                  <input
                    type="text"
                    placeholder="Descrição da ação (ex: Ligar para confirmar visita)..."
                    value={nextActionDesc}
                    onChange={(e) => setNextActionDesc(e.target.value)}
                    className="sm:col-span-2 px-3 py-2 rounded-lg border border-emerald-300 dark:border-emerald-800 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      updateLead(lead.id, {
                        proximaAcaoData: nextActionDate,
                        proximaAcaoDescricao: nextActionDesc,
                      });
                      addLeadActivity(
                        lead.id,
                        'outro',
                        'corretor',
                        `📅 Próxima Ação Agendada: "${nextActionDesc || 'Contato'}" para ${nextActionDate || 'Data a definir'}`
                      );
                      alert('Próxima ação agendada com sucesso!');
                    }}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors"
                  >
                    Salvar Agendamento
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions: Transfer (Admin) & Delete (Admin/Gestor) */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0 text-xs">
          <div className="flex items-center gap-2">
            {/* Transfer Lead (Admin Only) */}
            {currentUser.role === 'admin' && (
              <button
                id="btn-transfer-lead"
                onClick={() => setShowTransferModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 transition-colors"
                title="Transferir atendimento para outro corretor (Exclusivo Administrador)"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 text-amber-700" />
                <span>Transferir Atendimento</span>
              </button>
            )}

            {/* Delete with Protocol (Admin only) */}
            {currentUser.role === 'admin' && (
              <button
                id="btn-delete-lead-audit"
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors"
                title="Excluir lead com protocolo de auditoria (Apenas Administrador)"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Excluir Lead</span>
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl font-semibold bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>

      {/* Transfer Modal (Admin Only) */}
      {showTransferModal && (
        <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2 text-amber-700 font-bold text-base">
              <ArrowRightLeft className="w-5 h-5" />
              <span>Transferência de Atendimento</span>
            </div>
            <p className="text-xs text-slate-600">
              Você está reatribuindo o cliente <strong>{lead.nome}</strong> para um novo Corretor.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Selecione o Novo Corretor:</label>
                <select
                  value={transferCorretorId}
                  onChange={(e) => setTransferCorretorId(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium"
                >
                  <option value="">Selecione um corretor...</option>
                  {users
                    .filter((u) => u.id !== lead.corretorId)
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role.toUpperCase()})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Justificativa da Transferência:</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Informe o motivo da troca de carteira (ex: ausência do corretor, solicitação do cliente, reestruturação de equipe)..."
                  value={transferMotivo}
                  onChange={(e) => setTransferMotivo(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowTransferModal(false)}
                className="px-4 py-2 text-xs rounded-xl font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!transferCorretorId || !transferMotivo.trim()}
                onClick={handleConfirmTransfer}
                className="px-4 py-2 text-xs rounded-xl font-semibold bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50"
              >
                Confirmar Transferência
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Audit Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2 text-rose-700 font-bold text-base">
              <ShieldAlert className="w-5 h-5" />
              <span>Exclusão com Auditoria</span>
            </div>

            {deletedProtocol ? (
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-center space-y-2">
                <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto" />
                <p className="text-xs font-bold text-emerald-950">Lead Excluído com Sucesso!</p>
                <p className="text-[11px] font-mono text-emerald-800 bg-emerald-100/70 p-1.5 rounded">
                  Protocolo: {deletedProtocol}
                </p>
                <p className="text-[10px] text-emerald-600">Registro gravado na auditoria do sistema.</p>
              </div>
            ) : (
              <>
                <p className="text-xs text-slate-600">
                  A exclusão removerá o cliente <strong>{lead.nome}</strong> e gerará um protocolo permanente de auditoria <code>DEL-YYYYMMDD-XXXXXX</code>.
                </p>

                <div className="space-y-2 text-xs">
                  <label className="font-semibold text-slate-700">Justificativa da Exclusão (Obrigatória):</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Ex: Duplicidade confirmada, lead inválido, desistência formal..."
                    value={deleteMotivo}
                    onChange={(e) => setDeleteMotivo(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(false)}
                    className="px-4 py-2 text-xs rounded-xl font-medium text-slate-600 hover:bg-slate-100"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={!deleteMotivo.trim()}
                    onClick={handleConfirmDelete}
                    className="px-4 py-2 text-xs rounded-xl font-semibold bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50"
                  >
                    Confirmar Exclusão
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal para Anexar Documento Customizado */}
      {showAddCustomDocModal && (
        <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in zoom-in-95">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <Paperclip className="w-5 h-5 text-emerald-600" />
              Anexar Outro Documento
            </h3>
            <p className="text-xs text-slate-500">
              Anexe documentos adicionais do cliente ou do cônjuge/sócio (ex: Extrato bancário, IR, Certidão de Quitação).
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Título / Descrição do Documento:</label>
                <input
                  type="text"
                  placeholder="Ex: Imposto de Renda 2026, Extrato Bradesco, etc."
                  value={customDocTitle}
                  onChange={(e) => setCustomDocTitle(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Selecione o Arquivo (Foto ou PDF):</label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleUploadDocument('outros', e.target.files[0], 'outros', customDocTitle || 'Documento Adicional');
                      setShowAddCustomDocModal(false);
                      setCustomDocTitle('');
                    }
                  }}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setShowAddCustomDocModal(false)}
                className="px-4 py-2 text-xs rounded-xl font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Visualização de Documento */}
      {previewDocUrl && (
        <div className="fixed inset-0 z-60 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in zoom-in-95">
          <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-5 space-y-3 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>{previewDocUrl.title}</span>
              </h3>
              <button onClick={() => setPreviewDocUrl(null)} className="text-slate-400 hover:text-slate-600 font-bold text-base px-2">
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-auto flex items-center justify-center bg-slate-100 dark:bg-slate-900 rounded-xl p-2 min-h-[300px]">
              {previewDocUrl.url.startsWith('data:image/') || previewDocUrl.url.startsWith('http') ? (
                <img src={previewDocUrl.url} alt="Documento" className="max-h-[65vh] object-contain rounded-lg shadow" />
              ) : (
                <iframe src={previewDocUrl.url} className="w-full h-[60vh] rounded-lg" title="Documento PDF" />
              )}
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-700">
              <a
                href={previewDocUrl.url}
                download={`${previewDocUrl.title.toLowerCase().replace(/\s+/g, '_')}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl inline-flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download / Baixar Arquivo</span>
              </a>

              <button
                onClick={() => setPreviewDocUrl(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
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
