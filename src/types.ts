export type UserRole = 'admin' | 'diretor' | 'supervisor' | 'coordenador' | 'gestor' | 'corretor' | 'correspondente';

export function isFullAdmin(role?: UserRole): boolean {
  if (!role) return false;
  return role === 'admin' || role === 'diretor' || role === 'supervisor';
}

export interface TagItem {
  id: string;
  nome: string;
  cor: string; // e.g. "emerald", "blue", "amber", "rose", "purple", "cyan", "indigo"
  bgClass: string;
  textClass: string;
  borderClass: string;
  categoria: 'programa' | 'credito' | 'prioridade' | 'perfil' | 'status' | 'geral';
  descricao?: string;
}

export interface SimulatorPolicyRule {
  id: string;
  titulo: string;
  descricao: string;
  parametro: string;
  valorAtual: string | number;
  unidade?: string;
  categoria: 'subsidio' | 'atos' | 'mensais' | 'cef' | 'limites';
  obrigatorio: boolean;
}

export type ApprovalStatus = 'aprovado' | 'pendente' | 'rejeitado';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  teamId?: string;
  avatar: string;
  phone: string;
  creci: string;
  active: boolean;
  salesCount: number;
  totalVgv: number;
  commissionRate: number; // percentage, e.g. 1.8%
  statusAprovacao?: ApprovalStatus;
  criadoPorId?: string;
  criadoPorNome?: string;
  dataCriacao?: string;
}

export interface Team {
  id: string;
  name: string;
  leaderId: string;
  leaderName: string;
  memberIds: string[];
  monthlyTargetVgv: number;
  currentVgv: number;
  metaUnidades?: number;
  unidadesVendidas?: number;
  color: string;
  icon: string;
}

export type UnitGroup = 'Grupo A' | 'Grupo B' | 'Grupo C';
export type UnitStatus = 'disponivel' | 'em_processo' | 'reservado' | 'bloqueado' | 'vendido' | 'analise';
export type UnitType = 'padrao' | 'esquina' | 'meio_quadra' | 'cobertura' | 'garden' | 'duplex' | 'diferenciada';
export type IncorporationType = 'horizontal' | 'vertical';

export interface Unit {
  id: string;
  identificacao?: string; // e.g. "Q04 L18" or "Torre 1 - Apto 402"
  tipoIncorporacao?: IncorporationType; // 'horizontal' (loteamento/casas) or 'vertical' (edifício/apto)
  quadra: string; // e.g. "Quadra 04" or "Torre A"
  lote: string;   // e.g. "Lote 18" or "Apto 402"
  rua: string;
  areaTerreno: number; // m² área do lote/terreno ou fração ideal
  areaLote?: number; // legacy fallback compat
  areaConstruida: number; // m² metragem privativa/construída da unidade
  tipoUnidade?: UnitType; // 'padrao' | 'esquina' | 'meio_quadra' | 'cobertura' | 'garden' | 'duplex'
  dormitorios?: number; // e.g. 1, 2, 3, 4
  suites?: number;
  vagas?: number; // e.g. 0, 1, 2
  box?: string; // e.g. "Box B-12", "Depósito D-04", "Vaga Coberta 02" (opcional)
  valorFinal: number; // R$ valor de tabela/venda
  grupo: UnitGroup; // Faixa de renda correspondente
  status: UnitStatus;
  valorAvaliacaoCef: number;
  clienteId?: string;
  clienteNome?: string;
  clienteTelefone?: string;
  corretorId?: string;
  corretorNome?: string;
  dataReserva?: string;
  dataExpiracaoReserva?: string;
  comprovanteAtoAnexado?: boolean;
  comprovanteAtoUrl?: string;
  reservadoPorCorretorId?: string;
  reservadoPorCorretorNome?: string;
  reservaLeadId?: string;
  reservaLeadNome?: string;
  propostaId?: string;
  descontoAplicado?: number;
  condicaoEspecial?: string;
  requerAprovacaoDiretoria?: boolean;
  aprovadoDiretoria?: boolean;
}

export type FunnelStage =
  | 'pre_cadastro'
  | 'contato_feito'
  | 'visita_agendada'
  | 'visita_realizada'
  | 'doc_coletada'
  | 'analise_cef'
  | 'aprovado_cef'
  | 'contrato_assinado'
  | 'perdido'
  | string;

export interface LeadNote {
  id: string;
  autorId: string;
  autorNome: string;
  dataHora: string;
  texto: string;
}

export type ContactType = 'whatsapp' | 'telefone' | 'pessoalmente' | 'redes_sociais' | 'email' | 'outro' | 'sistema';

export interface LeadActivity {
  id: string;
  dataHora: string;
  tipoContato: ContactType;
  autor: 'corretor' | 'cliente' | 'sistema';
  autorNome: string;
  texto: string;
  assuntoCorretor?: boolean;
}

export interface SavedSimulation {
  id: string;
  data: string; // e.g. "2026-08-23 14:30"
  unidadeId?: string;
  unidadeInfo?: string; // Quadra/Lote info
  valorImovel: number;
  financiamentoCef: number;
  fgts: number;
  subsidioFederal: number;
  subsidioEstadual: number;
  totalEntradaNecessaria: number;
  ato1: number;
  ato2: number;
  ato3: number;
  qtdMensais: number;
  valorParcelaMensal: number;
  parcelaComplementar?: number;
  rendaFamiliar: number;
  statusViabilidade: 'aprovado' | 'atencao' | 'reprovado';
  mensagemViabilidade?: string;
  criadoPorNome: string;
  inputSnapshot?: SimulationInput;
}

export type LeadDocumentType =
  | 'rg_cnh'
  | 'comprovante_residencia'
  | 'certidao_estado_civil'
  | 'certidao_dependentes'
  | 'comprovante_renda'
  | 'carteira_trabalho'
  | 'extrato_fgts'
  | 'documentos_conjuge_socio'
  | 'comprovante_ato'
  | 'outros';

export interface LeadDocument {
  id: string;
  tipo: LeadDocumentType;
  tituloCustomizado?: string;
  nomeArquivo: string;
  arquivoUrl: string; // Data URL or Base64
  dataEnvio: string;
  tamanhoBytes?: number;
  enviadoPorNome?: string;
  pertenceA?: 'titular' | 'conjuge_socio' | 'outros';
  observacoes?: string;
}

export interface Lead {
  id: string;
  codigoExterno?: string; // e.g. "JV-1049"
  nome: string;
  nacionalidade?: string;
  cpf: string;
  rg?: string;
  telefone: string;
  email: string;
  rendaFamiliar: number;
  fgts: number;
  temDependentes: boolean;
  temImovel: boolean;
  estadoCivil: 'solteiro' | 'casado' | 'uniao_estavel' | 'divorciado' | 'viuvo';
  profissao: string;
  corretorId: string;
  corretorNome: string;
  equipeId: string;
  origem: 'Plantão Presencial' | 'Instagram/Facebook' | 'Google Ads' | 'Indicação' | 'Tenda/Panfletagem' | 'Portal Imobiliário' | 'WhatsApp Direto';
  tags: string[];
  status: FunnelStage;
  dataCadastro: string; // YYYY-MM-DD
  dataAtualizacao: string; // YYYY-MM-DD
  unidadeInteresseId?: string;
  unidadeInteresseInfo?: string;
  valorSimulacao?: number;
  valorFinanciadoAprovado?: number;
  parcelaAprovada?: number;
  valorEntrada?: number;
  notas: LeadNote[];
  atividades?: LeadActivity[];
  simulacoes?: SavedSimulation[];
  documentos?: LeadDocument[];
  ultimaVisita?: string;
  // Perfil & Marketing
  dataVisita?: string;
  filhos?: number;
  ocupacao?: 'clt' | 'autonomo' | 'empresario' | 'microempresario' | 'liberal' | 'aposentado' | 'servidor_publico';
  endereco?: string;
  bairro?: string;
  cidade?: string;
  escolaridade?: 'fundamental' | 'medio' | 'superior' | 'pos_graduacao';
  indicacoes?: string[];
  flagPrePlantao?: boolean;
  observacoesGerais?: string;
  proximaAcaoData?: string;
  proximaAcaoDescricao?: string;
  // Análise CEF & Correspondente / Agência
  agenciaCorrespondenteId?: string;
  agenciaCorrespondenteNome?: string;
  statusAnaliseCef?: 'pendente' | 'aprovado' | 'reprovado' | 'condicionado' | 'pendencia';
  parecerAnaliseCef?: string;
  dataAnaliseCef?: string;
  analisadoPorNome?: string;
  historicoAnaliseCef?: {
    id: string;
    data: string;
    statusAnalise: 'aprovado' | 'reprovado' | 'condicionado' | 'pendencia';
    parecer: string;
    responsavelNome: string;
    agenciaNome: string;
  }[];
  // Caixa de Leads & Fifty
  naCaixaDeLeads?: boolean;
  motivoCaixaDeLeads?: string;
  dataEnvioCaixaDeLeads?: string;
  direitoFifty?: boolean;
  corretorFiftyId?: string;
  corretorFiftyNome?: string;
  percentualFifty?: number;
  historicoTransferencias?: {
    data: string;
    deCorretorNome: string;
    paraCorretorNome: string;
    motivo: string;
  }[];
}

export interface DeletedLeadRecord {
  id: string;
  codigoExclusao: string; // DEL-YYYYMMDD-XXXXXX
  leadIdOriginal: string;
  nomeCliente: string;
  cpfCliente: string;
  telefoneCliente: string;
  corretorNome: string;
  equipeNome: string;
  dataExclusao: string;
  excluidoPorId: string;
  excluidoPorNome: string;
  excluidoPorRole: UserRole;
  motivoExclusao: string;
  dadosSnapshot: Partial<Lead>;
}

export interface AppNotification {
  id: string;
  tipo: 'novo_cadastro' | 'assunto_corretor' | 'duplicidade' | 'lead_estagnado' | 'tarefa_vencida' | 'roleta' | 'caixa_leads' | 'fifty' | 'sistema' | 'aprovacao_diretoria';
  titulo: string;
  mensagem: string;
  dataHora: string;
  lida: boolean;
  destinatarioRole?: 'admin' | 'gestor' | 'corretor' | 'todos';
  destinatarioUserId?: string;
  equipeId?: string;
  leadId?: string;
  leadNome?: string;
  whatsappUrl?: string;
  linkTab?: string;
}

export interface ShiftRule {
  id: string;
  numero: number;
  titulo: string;
  descricao: string;
  categoria: 'geral' | 'roleta' | 'atendimento' | 'comissao' | 'postura';
  ativo: boolean;
}

export interface SimulationInput {
  unitId?: string;
  valorImovel: number;
  descontoValor?: number; // Desconto em R$
  descontoPercentual?: number; // Desconto em %
  valorFinalComDesconto?: number;
  nomeSubsidioEstadual?: string;
  financiamentoCef: number;
  fgts: number;
  subsidioFederal: number;
  subsidioEstadual: number; // Casa Fácil Paraná (ex: 20000)
  ato1: number;
  dataAto1: string; // YYYY-MM-DD
  ato2: number;
  ato3: number;
  diaMensais: number; // 1 a 31
  qtdMensais?: number; // Sem limite fixo, livre (ex: 12, 36, 48, 60, 72, 84, 120, etc.)
  valorMensalInformado?: number;
  mensais1Qtd?: number;
  mensais1Valor?: number;
  mensais2Qtd?: number;
  mensais2Valor?: number;
  mensais3Qtd?: number;
  mensais3Valor?: number;
  mensais4Qtd?: number;
  mensais4Valor?: number;
  parcelaMaximaCliente: number;
  rendaFamiliar: number;
  taxaGestaoCef: number; // e.g. 3500
  grupoFaixa: UnitGroup;
  parcelaComplementar: number; // Balão ou pós chaves
  observacoesProposta?: string;
  requerAprovacaoDiretoria?: boolean;
  justificativaAprovacao?: string;
}

export interface ProposalApprovalRequest {
  id: string;
  propostaId: string;
  unitId: string;
  unidadeIdentificacao: string;
  clienteId: string;
  clienteNome: string;
  clienteTelefone: string;
  corretorId: string;
  corretorNome: string;
  equipeNome: string;
  valorTabela: number;
  descontoRequisitado: number;
  descontoPercentual: number;
  valorFinalProposta: number;
  qtdParcelasConstrutora: number;
  valorParcelaMensal: number;
  parcelaMinimaViolada: boolean;
  rendaFamiliar: number;
  justificativa: string;
  emailsNotificados: string[];
  status: 'pendente' | 'aprovado' | 'reprovado';
  dataSolicitacao: string;
  dataResposta?: string;
  respondidoPorId?: string;
  respondidoPorNome?: string;
  parecerDiretoria?: string;
}

export interface SimulationResult {
  valorImovel: number;
  descontoValor: number;
  valorFinalComDesconto: number;
  taxaGestaoCef: number;
  totalSubsidios: number;
  totalEntradaNecessaria: number; // (Valor Imóvel Com Desconto + Gestão CEF) - Financiamento - FGTS - Subsídios
  totalAtos: number;
  saldoAposAtos: number;
  qtdMensais?: number;
  valorParcelaMensal: number;
  totalMensais: number;
  parcelaComplementar: number;
  saldoRestante: number;
  requerAprovacaoDiretoria: boolean;
  motivoAprovacaoDiretoria?: string[];
  cronograma: {
    bloco: string;
    numero?: number;
    data: string;
    valor: number;
    subGrupo?: string;
  }[];
  viabilidade: {
    limitadorMinimoOk: boolean;
    parcelaCompativel: boolean;
    comprometimentoRendaPct: number;
    mensagens: string[];
    statusViabilidade: 'aprovado' | 'alerta' | 'reprovado';
  };
}

export type VisitTipoAtendimento = 'roleta_porta' | 'espontanea' | 'agendada' | 'retorno' | 'indicacao' | 'ativo_listas';

export interface Visit {
  id: string;
  leadId?: string;
  leadNome: string;
  leadTelefone: string;
  corretorId: string;
  corretorNome: string;
  dataHora: string;
  temperatura: 'quente' | 'morno' | 'frio';
  tipoAtendimento: VisitTipoAtendimento;
  unidadeInteresse?: string;
  observacoes: string;
  desfecho: 'em_negociacao' | 'proposta_enviada' | 'venda_fechada' | 'desistiu' | 'remarcou';
}

export interface Task {
  id: string;
  titulo: string;
  descricao: string;
  leadId?: string;
  leadNome?: string;
  corretorId: string;
  corretorNome: string;
  dataVencimento: string;
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
  tipo: 'ligar' | 'whatsapp' | 'visita' | 'documentos' | 'simulacao' | 'assinatura';
  concluida: boolean;
  dataConclusao?: string;
}

export type ShiftTurno = 'manha' | 'tarde' | 'integral';

export interface ShiftScale {
  id: string;
  data: string; // YYYY-MM-DD
  turno: ShiftTurno;
  corretorIds: string[];
  status: 'agendado' | 'em_andamento' | 'encerrado';
  supervisorId: string;
  supervisorNome: string;
}

export interface ShiftAttendance {
  id: string;
  scaleId: string;
  corretorId: string;
  corretorNome: string;
  dataHoraCheckin: string;
  status: 'presente' | 'atrasado' | 'falta_justificada' | 'falta';
  emFilaRoleta: boolean;
  ordemRoleta: number;
  atendimentosHoje: number;
  observacao?: string;
  ultimasMarcacoes?: {
    atendeu?: boolean;
    horaAtendimento?: string;
    montouPasta?: boolean;
    horaPasta?: string;
    saiuRoleta?: boolean;
    horaSaida?: string;
    motivoSaida?: string;
  };
}

export interface RouletteRecord {
  id: string;
  dataHora: string;
  corretorId: string;
  corretorNome: string;
  leadNome: string;
  leadTelefone: string;
  origem: 'Porta Plantão' | 'Ligação Externa' | 'Chatbot';
  resultado: 'atendido' | 'passou_vez' | 'ausente';
  duracaoMinutos: number;
  observacao?: string;
}

export interface Commission {
  id: string;
  leadId: string;
  leadNome: string;
  unidadeId: string;
  unidadeIdentificacao: string; // e.g. "Q04 L18"
  valorVenda: number;
  corretorId: string;
  corretorNome: string;
  percentualCorretor: number; // e.g. 2.0%
  valorComissaoCorretor: number;
  gestorId?: string;
  gestorNome?: string;
  percentualGestor: number; // e.g. 0.5%
  valorComissaoGestor: number;
  status: 'pendente_analise' | 'aprovado_cef' | 'faturado' | 'pago';
  dataVenda: string;
  dataPrevisaoPagamento?: string;
  dataPagamento?: string;
  numeroContrato?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  acao: string;
  entidade: string;
  detalhes: string;
  recordId?: string;
  snapshot?: any;
}

export interface DeletionAuditRecord {
  id: string;
  timestamp: string;
  dataHoraFormatada: string;
  deletedBy: {
    userId: string;
    userName: string;
    userEmail?: string;
    userRole: UserRole;
  };
  entityType: 'usuario_corretor' | 'cliente_lead' | 'imovel_unidade' | 'equipe' | 'comissao' | 'outros';
  recordId: string;
  recordIdentifier: string;
  detalhes: string;
  motivo?: string;
  snapshot?: any;
}

export interface PartnerBroker {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  creci: string;
  podeFazerPlantao: boolean;
  avatar?: string;
}

export interface PartnerAgency {
  id: string;
  nomeImobiliaria: string;
  responsavel: string;
  telefone: string;
  email: string;
  logoUrl: string;
  corretores: PartnerBroker[];
  dataCadastro: string;
}

export interface PartnerVisitAttendance {
  id: string;
  agencyId: string;
  agencyName: string;
  brokerId: string;
  brokerName: string;
  clientName: string;
  clientPhone: string;
  visitDate: string; // YYYY-MM-DD
  visitTime: string; // HH:MM
  status: 'agendada' | 'realizada' | 'cancelada' | 'proposta';
  observations?: string;
  registeredAt: string;
}

export interface DevelopmentItem {
  id: string;
  name: string;
  subtitle: string;
  developerName: string; // Nome da Loteadora ou Incorporadora
  cnpj: string;
  address: string;
  cityUf: string;
  type: IncorporationType;
  logoUrl?: string;
}

export interface AppSettings {
  theme?: 'light' | 'dark';
  // Multiple Developments configuration
  developments?: DevelopmentItem[];
  activeDevelopmentId?: string;

  // Enterprise Information (Configurable Name & Details)
  nomeEmpreendimento: string; // e.g. "Reserva das Palmeiras" or user configurable
  subtituloEmpreendimento: string; // e.g. "Loteamento & Casas Financiadas"
  tipoEmpreendimento: IncorporationType; // 'horizontal' | 'vertical'
  cidadeUf: string; // e.g. "Ponta Grossa - PR"
  enderecoEmpreendimento?: string;
  vgvEstimadoTotal?: number;
  developerName?: string;
  developerCnpj?: string;
  developerLogoUrl?: string;

  // Commercial Rules & Installments Limits
  maxParcelasConstrutora: number; // e.g. 72 (configurable without hard limit)
  parcelaMinimaConstrutora: number; // e.g. 450 (mínima permitida sem aprovação)
  descontoMaximoSemAprovacao: number; // e.g. 3000 (desconto máximo do corretor em R$)
  descontoMaximoPercentual?: number; // e.g. 3.0%

  // Board Approval Notification Emails
  emailsAprovacaoDiretoria: string[]; // e.g. ["diretoria@imobiliaria.com", "coordenacao@imobiliaria.com"]

  // Access Permissions
  liberarTabelaParaLideres: boolean;
  liberarSimuladorParaLideres: boolean;
  metaMensalGeral: number;
  comissaoPadraoCorretor: number; // 2.0 (Comissão padrão do Corretor)
  comissaoPadraoGestor: number; // 0.5
  taxaGestaoCefPadrao: number; // 3500
  subsidioEstadualPadrao: number; // 20000 (Casa Fácil)
  nomeSubsidioEstadual: string; // e.g. "Casa Fácil Paraná", "Morar Bem", etc.
  limitadorRendaGrupoA: number; // 2640
  limitadorRendaGrupoB: number; // 4400
  limitadorRendaGrupoC: number; // 8000
  tabelaPdfUrl?: string;
  implantacaoUrl?: string;

  // Regras de Duplicidade, Fifty & Plantão
  diasLimiteAtividadeLead: number; // Ex: 15 dias para manter direito a Fifty / atendimento válido
  regraDuplicidadePlantao: 'fifty_obrigatorio' | 'fifty_negociavel' | 'sem_fifty_repassa';
  acaoLeadInativo: 'caixa_de_leads' | 'transferencia_direta' | 'manual_gestor';
  permitirResgateCaixaLeads: boolean;
  kanbanColumns?: { id: string; title: string; color: string }[];
  regrasPlantaoTexto?: string;
}
