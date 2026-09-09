import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  BookOpen,
  Building,
  Calculator,
  Dices,
  Layers,
  DollarSign,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Users,
  Search,
  ArrowRight,
  HelpCircle,
  FileText,
  Clock,
  Sliders,
  Award,
  ChevronDown,
  ChevronUp,
  MapPin,
  Flame,
  CheckSquare,
  ShieldAlert,
  UserCheck,
  Send,
  Zap,
  Printer,
  Copy,
  ExternalLink,
  KeyRound,
  Lock,
} from 'lucide-react';

interface ManualSection {
  id: string;
  title: string;
  category: 'core' | 'simulador' | 'equipes' | 'plantao' | 'crm' | 'ia' | 'admin';
  icon: any;
  targetTab?: string;
  badge?: string;
  summary: string;
  roles: ('admin' | 'gestor' | 'corretor')[];
  content: {
    overview: string;
    steps: { title: string; description: string }[];
    tips?: string[];
    rules?: string[];
  };
}

export const UserManualView: React.FC = () => {
  const { setActiveTab, currentUser, teams, units, users, settings } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<'all' | 'admin' | 'gestor' | 'corretor'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedSectionId, setExpandedSectionId] = useState<string | null>('simulador');

  // Manual modules database
  const manualSections: ManualSection[] = [
    {
      id: 'acesso_senhas',
      title: 'Acesso ao Sistema, Perfis de Usuário & Senhas Iniciais',
      category: 'admin',
      icon: KeyRound,
      targetTab: 'usuarios',
      badge: 'Segurança & Credenciais',
      summary: 'Credenciais de primeiro acesso por perfil (Admin, Gestor, Corretor, Correspondente CEF), regras de sigilo e instruções de troca de senha no menu superior.',
      roles: ['admin', 'gestor', 'corretor'],
      content: {
        overview:
          'Por rigorosas diretrizes de segurança da informação, conformidade LGPD e sigilo comercial, as senhas de acesso NUNCA são informadas na tela de login público. Todos os novos perfis homologados recebem a senha inicial padrão abaixo e devem alterá-la após o primeiro acesso.',
        steps: [
          {
            title: '1. Senha Inicial Padrão de Primeiro Acesso',
            description:
              'A senha padrão inicial para TODOS os perfis cadastrados no sistema é "admin" (todas as letras minúsculas). Esta credencial provisória serve exclusivamente para desbloquear a conta no primeiro login.',
          },
          {
            title: '2. Perfil Administrador / Diretoria Geral',
            description:
              'E-mail cadastrado padrão: joelsantanaimoveis@gmail.com | Senha Inicial: admin. Nível de acesso irrestrito: gestão de todas as 877 unidades, aprovação MESA, liberação de comissões, regras do simulador, log de auditoria e cadastro de equipes.',
          },
          {
            title: '3. Perfil Gestor / Líder de Equipe',
            description:
              'E-mail do Gestor cadastrado na aba "Equipes" | Senha Inicial: admin. Permissões de acompanhamento da equipe de vendas, metas mensais de VGV, escala e roleta do plantão e apoio aos corretores da sua célula.',
          },
          {
            title: '4. Perfil Corretor de Imóveis',
            description:
              'E-mail pessoal cadastrado (ex: lucas.corretor@vivencia.com.br) | Senha Inicial: admin. Permissão para usar o Simulador Financeiro Caixa, visualizar unidades no Espelho de Vendas, gerenciar clientes no funil Kanban e participar da Roleta do Plantão.',
          },
          {
            title: '5. Perfil Correspondente Bancário Caixa (CEF)',
            description:
              'E-mail da agência/correspondente (ex: correspondente.sertao@caixa.com.br) | Senha Inicial: admin. Acesso à Caixa de Leads bancária, esteira de aprovação de crédito CEF e conferência de pastas de documentação habitacional.',
          },
          {
            title: '6. Procedimento de Troca de Senha (Recomendado no 1º Acesso)',
            description:
              'Após entrar no sistema com a senha inicial "admin", clique no seu nome ou avatar no canto superior direito da tela e acesse "Meu Perfil" para definir uma senha pessoal definitiva. Em caso de esquecimento, a função "Esqueci minha senha" na tela de login permite a restauração direta via e-mail cadastrado.',
          },
        ],
        tips: [
          'Crie uma senha pessoal forte com letras, números e no mínimo 6 caracteres.',
          'Nunca compartilhe sua senha individual com outros colegas de plantão. Cada atendimento e simulação é registrado com a assinatura digital do usuário logado.',
          'O Administrador Geral pode redefinir o acesso ou cadastrar novos corretores a qualquer instante no módulo "Usuários & Corretores".',
        ],
        rules: [
          'Sigilo de Acesso: A tela de login é mantida limpa sem exposição de senhas para evitar que terceiros ou clientes vejam credenciais operacionais.',
          'Responsabilidade de Credenciais: Cada usuário é responsável pelas ações realizadas sob sua autenticação no sistema.',
        ],
      },
    },
    {
      id: 'equipes',
      title: 'Gestão de Equipes & Corretores Corretors',
      category: 'equipes',
      icon: Users,
      targetTab: 'equipes',
      badge: 'Atualizado v2.6',
      summary: 'Fluxo estruturado para montagem de equipes, nomeação de gestores, metas de VGV e vinculação de corretores.',
      roles: ['admin', 'gestor'],
      content: {
        overview:
          'O módulo de Equipes organiza a força de vendas do empreendimento Jardim Vivência em células de alta performance, permitindo que cada Gestor/Líder acompanhe as metas de VGV e o desempenho de seus corretores corretors.',
        steps: [
          {
            title: '1º Passo: Criar a Equipe e Nomear o Gestor',
            description:
              'Na aba "Gestão de Equipes", clique em "+ Nova Equipe". Defina o nome da equipe (Ex: Equipe Alfa - Corretors), selecione o Gestor/Líder responsável, a meta mensal de VGV (ex: R$ 1.500.000) e a meta de unidades.',
          },
          {
            title: '2º Passo: Cadastrar os Corretores (Corretors)',
            description:
              'Na aba "Usuários", cadastre os corretores com CRECI, telefone de contato, taxa de comissão (%) e credenciais de login. O sistema já pré-configura o perfil comercial para acesso ao Simulador e ao Funil.',
          },
          {
            title: '3º Passo: Vincular os Corretores à Equipe',
            description:
              'No card da equipe criada, clique em "+ Vincular Corretor" para adicionar membros com 1 clique ou selecione múltiplos corretores na janela de edição. A sincronização de dados é bidirecional e instantânea.',
          },
          {
            title: 'Remanejamento e Exclusão Segura',
            description:
              'Ao desvincular um corretor ou excluir uma equipe, os corretores são liberados no sistema sem perda de clientes ou histórico comercial, prontos para serem alocados em nova equipe.',
          },
        ],
        tips: [
          'Cada equipe possui uma cor de identificação que agiliza a visualização em relatórios e no ranking de vendas.',
          'O Gestor da equipe pode acompanhar o atingimento percentual da meta de VGV em tempo real na barra de progresso do card.',
        ],
      },
    },
    {
      id: 'simulador',
      title: `Simulador & Engenharia Financeira CEF (${settings.nomeSubsidioEstadual || "Estadual"})`,
      category: 'simulador',
      icon: Calculator,
      targetTab: 'simulador',
      badge: 'Multi-Séries & Atos',
      summary: 'Cálculo exato de entrada, 3 Atos, séries mensais (1 a 4), parcela complementar, subsídios e viabilidade de renda.',
      roles: ['admin', 'gestor', 'corretor'],
      content: {
        overview:
          `O Simulador oficial reproduz a engenharia financeira do loteamento Jardim Vivência com as diretrizes da Caixa Econômica Federal e o subsídio estadual do Programa ${settings.nomeSubsidioEstadual || "Estadual"} (R$ 20.000,00 para proponentes elegíveis).`,
        steps: [
          {
            title: '1. Seleção da Unidade e Valor do Imóvel',
            description:
              'Escolha uma das 877 unidades cadastradas pelo menu de busca rápida ou preencha o valor do imóvel manualmente. A unidade carrega a metragem, quadra e lote automaticamente.',
          },
          {
            title: '2. Créditos, FGTS e Subsídios Governamentais',
            description:
              `Informe o valor aprovado no Financiamento Caixa, o saldo de FGTS disponível, o Subsídio Federal (MCMV) e o Subsídio Estadual ${settings.nomeSubsidioEstadual || "Estadual"} (R$ 20.000,00 para famílias com renda até 3 salários mínimos).`,
          },
          {
            title: '3. Taxa de Gestão CEF e Entrada Líquida',
            description:
              'O sistema soma a Taxa de Gestão CEF (assessoria/despachante) ao valor do imóvel e deduz todos os créditos para apurar a Entrada Líquida Necessária.',
          },
          {
            title: '4. Distribuição do Fluxo de Entrada (Atos 1, 2 e 3)',
            description:
              'Distribua os pagamentos iniciais no Ato 1 (data inicial da proposta), Ato 2 (+30 dias) e Ato 3 (+60 dias). O saldo restante é automaticamente encaminhado para as parcelas mensais.',
          },
          {
            title: '5. Séries de Mensais (Mensais 1, 2, 3 e 4) e Complementar',
            description:
              'Configure séries independentes de parcelas mensais com quantidade e valor personalizados. Caso reste saldo residual ao final do cronograma, utilize a Parcela Complementar (chaves).',
          },
          {
            title: '6. Validação de Renda e Exportação',
            description:
              'O motor calcula o comprometimento de renda (máximo de 30% da renda familiar). Com 1 clique, gere o texto formatado para envio direto via WhatsApp ou abra o Relatório Oficial de Proposta para Impressão em PDF.',
          },
        ],
        tips: [
          'Você pode clicar em "Simular" diretamente em qualquer linha da Tabela de Vendas para importar a unidade com todos os dados preenchidos.',
          'O botão "Copiar Texto p/ WhatsApp" cria uma mensagem limpa com quebras de linha e emojis comerciais perfeitos.',
        ],
        rules: [
          'Comprometimento de Renda Máximo: 30% da renda familiar bruta comprovada.',
          `Teto Renda Grupo A: R$ 2.640,00 (direito ao subsídio estadual integral ${settings.nomeSubsidioEstadual || "Estadual"}).`,
          'Teto Renda Grupo B: R$ 4.400,00.',
        ],
      },
    },
    {
      id: 'regras_simulador',
      title: 'Políticas & Parâmetros do Simulador (Administração)',
      category: 'simulador',
      icon: Sliders,
      targetTab: 'regras_simulador',
      badge: 'Painel do Gestor/Admin',
      summary: 'Configuração dos parâmetros globais de subsídios, taxas CEF, tetos de renda e políticas de aprovação.',
      roles: ['admin'],
      content: {
        overview:
          'Painel exclusivo para a Diretoria e Administradores definirem as regras de negócio que alimentam o motor de cálculo do Simulador.',
        steps: [
          {
            title: 'Edição de Parâmetros Globais',
            description:
              'Ajuste o valor padrão da Taxa de Gestão CEF, o percentual máximo de comprometimento de renda (padrão 30%) e os valores tetos dos Grupos A, B e C.',
          },
          {
            title: 'Aplicação Instantânea',
            description:
              'Qualquer alteração feita nesta tela passa a vigorar imediatamente em todas as novas simulações de todos os corretores da imobiliária.',
          },
          {
            title: 'Restauração de Padrões Oficiais',
            description:
              'O botão "Restaurar Padrões Oficiais" recupera a configuração original homologada da construtora com 1 clique.',
          },
        ],
      },
    },
    {
      id: 'tabela_vendas',
      title: 'Tabela de Vendas (877 Unidades Jardim Vivência)',
      category: 'core',
      icon: Building,
      targetTab: 'tabela_vendas',
      summary: 'Consulta de todas as 877 unidades com filtros por Quadra, Lote, Rua, Metragem, Grupo e Status.',
      roles: ['admin', 'gestor', 'corretor'],
      content: {
        overview:
          'Inventário completo das 877 unidades residenciais do empreendimento Jardim Vivência.',
        steps: [
          {
            title: 'Filtros Dinâmicos e Busca Rápida',
            description:
              'Pesquise por número de quadra, lote, nome do logradouro (Rua) ou selecione os grupos de renda (Grupo A, B ou C).',
          },
          {
            title: 'Botão de Simulação Integrada',
            description:
              'Cada unidade possui o botão "Simular", que transfere os valores diretamente para o Simulador CEF sem necessidade de digitação.',
          },
          {
            title: 'Controle de Visibilidade do Simulador',
            description:
              'O Administrador pode restringir ou liberar a visibilidade do Simulador para os corretores através do botão "Ativar/Desativar para líderes" no topo da tela.',
          },
        ],
      },
    },
    {
      id: 'espelho_vendas',
      title: 'Espelho de Lotes & Mapa de Disponibilidade',
      category: 'core',
      icon: MapPin,
      targetTab: 'espelho_vendas',
      summary: 'Visualização gráfica e status das quadras em tempo real (Disponível, Reservado, Vendido, Bloqueado).',
      roles: ['admin', 'gestor', 'corretor'],
      content: {
        overview:
          'Mapa interativo de ocupação do loteamento para consulta visual ágil durante o atendimento presencial no plantão.',
        steps: [
          {
            title: 'Leitura de Cores dos Lotes',
            description:
              'Verde (Disponível para Venda), Amarelo (Reservado / Em Análise), Azul (Vendido / Contrato Assinado) e Vermelho (Bloqueado pela Construtora).',
          },
          {
            title: 'Reserva Rápida de Unidade',
            description:
              'Ao clicar sobre um lote disponível, o corretor pode vincular o proponente e iniciar a proposta comercial imediatamente.',
          },
        ],
      },
    },
    {
      id: 'kanban',
      title: 'CRM, Leads & Funil de Vendas (Kanban)',
      category: 'crm',
      icon: Layers,
      targetTab: 'kanban',
      summary: 'Acompanhamento da esteira de aprovação Caixa, desde o Pré-Cadastro até a Venda Fechada.',
      roles: ['admin', 'gestor', 'corretor'],
      content: {
        overview:
          'Pipeline comercial completo estruturado nas etapas oficiais de venda de loteamentos financiados pela Caixa Econômica Federal.',
        steps: [
          {
            title: 'Etapas do Funil de Vendas',
            description:
              '1. Pré-Cadastro ➔ 2. Contato Realizado ➔ 3. Visita no Plantão ➔ 4. Documentação Coletada ➔ 5. Análise de Crédito CEF ➔ 6. Aprovado Caixa ➔ 7. Venda Concluída.',
          },
          {
            title: 'Arrastar e Soltar (Drag & Drop)',
            description:
              'Mova os cards dos clientes entre as colunas conforme o avanço do atendimento. As métricas do funil e VGV projetado são recalculadas automaticamente.',
          },
          {
            title: 'Agendamento de Visitas e Tarefas',
            description:
              'Dentro do card do cliente, agende visitas ao plantão de vendas, registre notas de atendimento e anexe pendências de documentos.',
          },
        ],
      },
    },
    {
      id: 'plantao',
      title: 'Plantão de Vendas, Escalas & Roleta da Vez',
      category: 'plantao',
      icon: Dices,
      targetTab: 'plantao',
      badge: 'Equidade no Plantão',
      summary: 'Check-in de corretores, fila da vez, sorteio diário transparente e histórico de atendimentos.',
      roles: ['admin', 'gestor', 'corretor'],
      content: {
        overview:
          'Sistema inteligente de distribuição de leads espontâneos que chegam presencialmente ao plantão de vendas do loteamento.',
        steps: [
          {
            title: '1. Check-in Diário de Presença',
            description:
              'O Gestor ou o próprio corretor realiza o check-in na chegada ao plantão, registrando o horário e confirmando a prontidão para atendimento.',
          },
          {
            title: '2. Fila da Roleta da Vez',
            description:
              'O corretor no topo da fila (Posição #1 - VEZ) recebe o próximo cliente que entra no plantão. Ao iniciar o atendimento, seu card é movido para o fim da fila.',
          },
          {
            title: '3. Sorteio Inicial e Embaralhamento',
            description:
              'No início do turno, o Gestor pode realizar o sorteio eletrônico para definir a ordem inicial justa do dia.',
          },
        ],
      },
    },
    {
      id: 'vivi',
      title: 'Vivi — Assistente de Inteligência Artificial (Gemini 2.5)',
      category: 'ia',
      icon: Sparkles,
      targetTab: 'vivi',
      badge: 'Gemini 2.5 Flash',
      summary: 'Geração de scripts de vendas, contorno de objeções de entrada e consultoria sobre regras CEF.',
      roles: ['admin', 'gestor', 'corretor'],
      content: {
        overview:
          `A Vivi é a consultora de inteligência artificial treinada especificamente no modelo de negócio do Jardim Vivência, regras da Caixa Econômica Federal e benefícios do ${settings.nomeSubsidioEstadual || "Estadual"}.`,
        steps: [
          {
            title: 'Categorias Rápidas de Prompt',
            description:
              `Utilize os botões de atalho: "Scripts de Vendas", "Contorno de Objeções", "Dúvidas Financiamento CEF" ou "Regras ${settings.nomeSubsidioEstadual || "Estadual"}".`,
          },
          {
            title: 'Nova Conversa',
            description:
              'Clique no botão "+ Nova Conversa" para limpar o histórico e iniciar uma nova consultoria sobre outro cliente ou caso específico.',
          },
          {
            title: 'Cópia de Respostas',
            description:
              'Todas as mensagens e scripts gerados pela Vivi possuem botão de cópia instantânea para colar diretamente no WhatsApp do cliente.',
          },
        ],
      },
    },
    {
      id: 'comissoes',
      title: 'Gestão de Comissões & Repasses Financeiros',
      category: 'core',
      icon: DollarSign,
      targetTab: 'comissoes',
      summary: 'Acompanhamento de honorários gerados, comissões pendentes, datas de repasse e extrato do corretor.',
      roles: ['admin', 'gestor', 'corretor'],
      content: {
        overview:
          'Módulo de controle e transparência dos honorários de corretagem devidos a cada corretor e equipe após a assinatura do contrato e emissão do espelho.',
        steps: [
          {
            title: 'Apuração Automática',
            description:
              'Com base no percentual de comissão cadastrado no usuário (ex: 2.0%), o sistema calcula a comissão líquida de cada venda fechada.',
          },
          {
            title: 'Extrato e Comprovantes',
            description:
              'O corretor pode acompanhar o status de liquidação (Pendente, Aprovado, Pago) e imprimir seu extrato mensal de produção.',
          },
        ],
      },
    },
    {
      id: 'contratos',
      title: 'Gerador de Propostas & Contratos',
      category: 'core',
      icon: FileText,
      targetTab: 'contrato',
      summary: 'Emissão automatizada de contratos de compra e venda e minutas com preenchimento de proponente e lote.',
      roles: ['admin', 'gestor'],
      content: {
        overview:
          'Emissor oficial de documentos contratuais integrado aos dados da Tabela de Vendas e da simulação financeira.',
        steps: [
          {
            title: 'Preenchimento Automático',
            description:
              'O gerador puxa os dados do comprador, estado civil, CPF, endereço, quadra, lote, metragens, confrontações e fluxo de pagamento homologado.',
          },
          {
            title: 'Impressão e Download',
            description:
              'Documento gerado em formato padrão A4 pronto para assinatura física ou envio para plataforma de assinatura eletrônica (DocuSign/Clicksign).',
          },
        ],
      },
    },
  ];

  // Filtered sections based on search and filters
  const filteredSections = useMemo(() => {
    return manualSections.filter((section) => {
      // Role filter
      if (selectedRole !== 'all' && !section.roles.includes(selectedRole)) {
        return false;
      }
      // Category filter
      if (selectedCategory !== 'all' && section.category !== selectedCategory) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = section.title.toLowerCase().includes(q);
        const matchSummary = section.summary.toLowerCase().includes(q);
        const matchOverview = section.content.overview.toLowerCase().includes(q);
        const matchSteps = section.content.steps.some(
          (s) => s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
        );
        return matchTitle || matchSummary || matchOverview || matchSteps;
      }
      return true;
    });
  }, [manualSections, selectedRole, selectedCategory, searchQuery]);

  const toggleSection = (id: string) => {
    setExpandedSectionId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Manual Operacional & Guia do Sistema
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                  v2.6.0 Oficial
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Atualizado automaticamente com todas as regras de negócio, fluxos de equipes, simulador e CRM.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-[11px] text-slate-400 font-medium">Usuário Conectado</p>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {currentUser.name} ({currentUser.role.toUpperCase()})
            </p>
          </div>
        </div>
      </div>

      {/* Highlights / What's New in this Version */}
      <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-sky-500/10 border border-emerald-200 dark:border-emerald-900/60 p-5 rounded-2xl shadow-xs">
        <div className="flex items-center gap-2 text-emerald-950 dark:text-emerald-200 font-bold text-sm mb-3">
          <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Últimas Implementações & Destaques da Versão 2.6.0</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs p-3.5 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
            <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-emerald-600" />
              Acesso & Senhas Iniciais
            </p>
            <p className="text-slate-600 dark:text-slate-300 mt-1 text-[11px] leading-relaxed">
              Senha padrão inicial <strong>admin</strong> para todos os perfis, com diretrizes de alteração pessoal segura.
            </p>
          </div>

          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs p-3.5 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
            <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-600" />
              Gestão de Equipes & Corretors
            </p>
            <p className="text-slate-600 dark:text-slate-300 mt-1 text-[11px] leading-relaxed">
              Crie equipes, atribua gestores, defina metas de VGV e vincule corretores com sincronização em tempo real.
            </p>
          </div>

          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs p-3.5 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
            <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Calculator className="w-4 h-4 text-emerald-600" />
              Simulador Multi-Séries CEF
            </p>
            <p className="text-slate-600 dark:text-slate-300 mt-1 text-[11px] leading-relaxed">
              3 Atos, 4 Séries de Mensais independentes, Parcela Complementar (chaves) e exportação pronta para WhatsApp.
            </p>
          </div>

          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs p-3.5 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
            <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              Vivi AI (Gemini 2.5 Flash)
            </p>
            <p className="text-slate-600 dark:text-slate-300 mt-1 text-[11px] leading-relaxed">
              Inteligência Artificial ultra rápida para criação de scripts persuasivos, objeções e regras Caixa / {settings.nomeSubsidioEstadual || "Estadual"}.
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={`Buscar por módulo, termo ou instrução (ex: Atos, Equipes, ${settings.nomeSubsidioEstadual || "Estadual"}, Roleta, Comissões)...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9.5 pr-4 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Role Filter */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">Perfil:</span>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as any)}
              className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl px-3 py-2 outline-hidden focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Todos os Perfis</option>
              <option value="admin">Administrador</option>
              <option value="gestor">Gestor de Equipe</option>
              <option value="corretor">Corretor Corretor</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sections Accordion List */}
      <div className="space-y-4">
        {filteredSections.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-12 text-center rounded-2xl border border-slate-200 dark:border-slate-800">
            <HelpCircle className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Nenhum tópico encontrado</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Tente buscar por outras palavras-chave ou limpe os filtros de busca.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedRole('all');
                setSelectedCategory('all');
              }}
              className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Restaurar Filtros
            </button>
          </div>
        ) : (
          filteredSections.map((section, index) => {
            const isExpanded = expandedSectionId === section.id;
            const Icon = section.icon;

            return (
              <div
                key={section.id}
                className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all shadow-xs overflow-hidden ${
                  isExpanded
                    ? 'border-emerald-500/50 ring-1 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Section Header */}
                <div
                  onClick={() => toggleSection(section.id)}
                  className="p-5 flex items-start justify-between gap-4 cursor-pointer select-none bg-slate-50/40 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-400 font-mono">
                          MÓDULO {String(index + 1).padStart(2, '0')}
                        </span>
                        <h2 className="text-base font-bold text-slate-900 dark:text-white">
                          {section.title}
                        </h2>
                        {section.badge && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            {section.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                        {section.summary}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {section.targetTab && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveTab(section.targetTab as any);
                        }}
                        className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition-colors"
                        title="Ir para esta tela no CRM"
                      >
                        <span>Acessar Tela</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Section Expanded Details */}
                {isExpanded && (
                  <div className="p-6 border-t border-slate-100 dark:border-slate-800/80 space-y-6 text-xs text-slate-700 dark:text-slate-300 leading-relaxed animate-in fade-in duration-200">
                    {/* Overview */}
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
                      <h4 className="font-bold text-slate-900 dark:text-white text-xs mb-1 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Visão Geral e Objetivo
                      </h4>
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                        {section.content.overview}
                      </p>
                    </div>

                    {/* Step by Step */}
                    <div className="space-y-3">
                      <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                        Instruções Passo a Passo
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {section.content.steps.map((step, idx) => (
                          <div
                            key={idx}
                            className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-start gap-3"
                          >
                            <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                              {idx + 1}
                            </span>
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white text-xs">{step.title}</p>
                              <p className="text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                                {step.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Tips & Pro Rules */}
                    {section.content.tips && (
                      <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 p-4 rounded-xl space-y-2">
                        <h4 className="font-bold text-amber-950 dark:text-amber-300 text-xs flex items-center gap-1.5">
                          <Flame className="w-4 h-4 text-amber-600" />
                          Dicas de Alta Performance
                        </h4>
                        <ul className="list-disc list-inside space-y-1 text-amber-900/90 dark:text-amber-200/90 text-[11px]">
                          {section.content.tips.map((tip, idx) => (
                            <li key={idx}>{tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Rules if present */}
                    {section.content.rules && (
                      <div className="bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900/60 p-4 rounded-xl space-y-2">
                        <h4 className="font-bold text-sky-950 dark:text-sky-300 text-xs flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-sky-600" />
                          Regras de Enquadramento Regulatório
                        </h4>
                        <ul className="list-disc list-inside space-y-1 text-sky-900/90 dark:text-sky-200/90 text-[11px]">
                          {section.content.rules.map((rule, idx) => (
                            <li key={idx}>{rule}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Mobile Access Button */}
                    {section.targetTab && (
                      <div className="pt-2 flex sm:hidden">
                        <button
                          onClick={() => setActiveTab(section.targetTab as any)}
                          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-xs"
                        >
                          <span>Abrir Tela {section.title}</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* RBAC Matrix */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Matriz de Permissões & Níveis de Acesso (RBAC)</span>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          O OTS Master CRM possui controle rigoroso de permissões baseado na hierarquia de vendas:
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
                <th className="py-2.5 px-3">Funcionalidade / Módulo</th>
                <th className="py-2.5 px-3 text-center">Corretor Corretor</th>
                <th className="py-2.5 px-3 text-center">Gestor de Equipe</th>
                <th className="py-2.5 px-3 text-center">Administrador Geral</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              <tr>
                <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">Simulador Financeiro CEF</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">✓ Total</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">✓ Total</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">✓ Total</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">CRM e Funil de Vendas</td>
                <td className="py-2.5 px-3 text-center text-slate-600 dark:text-slate-400">Seus Leads</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">Leads da Equipe</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">✓ Todos os Leads</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">Gestão e Montagem de Equipes</td>
                <td className="py-2.5 px-3 text-center text-slate-400">Visualização</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">✓ Sua Equipe</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">✓ Total (Criar/Excluir)</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">Políticas e Regras do Simulador</td>
                <td className="py-2.5 px-3 text-center text-slate-400">Restrito</td>
                <td className="py-2.5 px-3 text-center text-slate-400">Restrito</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">✓ Edição Total</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">Auditoria, Logs & Backup</td>
                <td className="py-2.5 px-3 text-center text-slate-400">Restrito</td>
                <td className="py-2.5 px-3 text-center text-slate-400">Restrito</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">✓ Exclusivo Admin</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
