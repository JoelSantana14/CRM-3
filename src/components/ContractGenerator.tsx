import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/simulatorEngine';
import { useNumericInput } from '../hooks/useNumericInput';
import {
  FileText,
  Upload,
  Download,
  Printer,
  Copy,
  Check,
  Building,
  User,
  Send,
  Sparkles,
  RefreshCw,
  Edit3,
  Shield,
  Layers,
  Users,
} from 'lucide-react';

export const ContractGenerator: React.FC = () => {
  const { units, leads, currentUser, settings, logAction } = useApp();

  // Selection states
  const [selectedUnitId, setSelectedUnitId] = useState<string>(units[0]?.id || '');
  const [selectedLeadId, setSelectedLeadId] = useState<string>(leads[0]?.id || '');

  // Identification numbers
  const [proposalNumber] = useState<string>(`PROP-2026-${Math.floor(10000 + Math.random() * 90000)}`);
  const [contractNumber] = useState<string>(`CONT-2026-${Math.floor(10000 + Math.random() * 90000)}`);

  // Proponentes (Buyers)
  const [proponente1Nome, setProponente1Nome] = useState('');
  const [proponente1Nacionalidade, setProponente1Nacionalidade] = useState('Brasileiro(a)');
  const [proponente1Cpf, setProponente1Cpf] = useState('');
  const [proponente1Rg, setProponente1Rg] = useState('');
  const [proponente1EstadoCivil, setProponente1EstadoCivil] = useState('Solteiro(a)');
  const [proponente1Profissao, setProponente1Profissao] = useState('');
  const [proponente1Endereco, setProponente1Endereco] = useState('');
  const [proponente1Telefone, setProponente1Telefone] = useState('');
  const [proponente1Email, setProponente1Email] = useState('');

  // Proponente 2 (Co-comprador / Cônjuge)
  const [hasProponente2, setHasProponente2] = useState(false);
  const [proponente2Nome, setProponente2Nome] = useState('');
  const [proponente2Nacionalidade, setProponente2Nacionalidade] = useState('Brasileiro(a)');
  const [proponente2Cpf, setProponente2Cpf] = useState('');
  const [proponente2Rg, setProponente2Rg] = useState('');
  const [proponente2EstadoCivil, setProponente2EstadoCivil] = useState('Casado(a)');
  const [proponente2Profissao, setProponente2Profissao] = useState('');
  const [proponente2Endereco, setProponente2Endereco] = useState('');
  const [proponente2Telefone, setProponente2Telefone] = useState('');
  const [proponente2Email, setProponente2Email] = useState('');

  // Plano de Pagamento Personalizado (incluindo Semestrais, Anuais e Chaves)
  const [ato1, setAto1] = useState<number>(2000);
  const [ato2, setAto2] = useState<number>(2000);
  const [ato3, setAto3] = useState<number>(2000);
  const [qtdMensais, setQtdMensais] = useState<number>(72);
  const [valorMensal, setValorMensal] = useState<number>(450);

  // Novas opções solicitadas: Semestrais, Anuais e Chaves
  const [qtdSemestrais, setQtdSemestrais] = useState<number>(4);
  const [valorSemestral, setValorSemestral] = useState<number>(2500);

  const [qtdAnuais, setQtdAnuais] = useState<number>(3);
  const [valorAnual, setValorAnual] = useState<number>(5000);

  const [valorChaves, setValorChaves] = useState<number>(8000);

  // Financiamento & Subsídios
  const [valorFinanciamento, setValorFinanciamento] = useState<number>(145000);
  const [subsidioFederal, setSubsidioFederal] = useState<number>(35000);
  const [subsidioEstadual, setSubsidioEstadual] = useState<number>(20000);
  const [valorFgts, setValorFgts] = useState<number>(12000);

  // Custom hooks for ContractGenerator inputs
  const hookAto1 = useNumericInput({ initialValue: 2000, onChange: setAto1 });
  const hookAto2 = useNumericInput({ initialValue: 2000, onChange: setAto2 });
  const hookAto3 = useNumericInput({ initialValue: 2000, onChange: setAto3 });
  
  const hookQtdMensais = useNumericInput({ initialValue: 72, onChange: setQtdMensais, isCurrency: false });
  const hookValorMensal = useNumericInput({ initialValue: 450, onChange: setValorMensal });
  
  const hookQtdSemestrais = useNumericInput({ initialValue: 4, onChange: setQtdSemestrais, isCurrency: false });
  const hookValorSemestral = useNumericInput({ initialValue: 2500, onChange: setValorSemestral });
  
  const hookQtdAnuais = useNumericInput({ initialValue: 3, onChange: setQtdAnuais, isCurrency: false });
  const hookValorAnual = useNumericInput({ initialValue: 5000, onChange: setValorAnual });
  
  const hookValorChaves = useNumericInput({ initialValue: 8000, onChange: setValorChaves });
  const hookValorFinanciamento = useNumericInput({ initialValue: 145000, onChange: setValorFinanciamento });
  const hookSubsidioFederal = useNumericInput({ initialValue: 35000, onChange: setSubsidioFederal });
  const hookSubsidioEstadual = useNumericInput({ initialValue: 20000, onChange: setSubsidioEstadual });
  const hookValorFgts = useNumericInput({ initialValue: 12000, onChange: setValorFgts });

  // Testemunhas
  const [testemunha1Nome, setTestemunha1Nome] = useState('Ana Paula Silveira');
  const [testemunha1Cpf, setTestemunha1Cpf] = useState('111.222.333-44');
  const [testemunha2Nome, setTestemunha2Nome] = useState('Roberto Carlos Mendes');
  const [testemunha2Cpf, setTestemunha2Cpf] = useState('555.666.777-88');

  // Active development details
  const activeDev = settings.developments?.find(d => d.id === settings.activeDevelopmentId) || {
    name: settings.nomeEmpreendimento,
    subtitle: settings.subtituloEmpreendimento,
    developerName: settings.developerName || 'Construtora e Incorporadora Oficial Ltda',
    cnpj: settings.developerCnpj || '00.000.000/0001-00',
    address: settings.enderecoEmpreendimento || 'Av. Principal, 1000 - Centro',
    cityUf: settings.cidadeUf,
    type: settings.tipoEmpreendimento,
    logoUrl: settings.developerLogoUrl || '',
  };

  const activeUnit = units.find((u) => u.id === selectedUnitId);
  const activeLead = leads.find((l) => l.id === selectedLeadId);

  // Auto-fill from lead selection if changed
  React.useEffect(() => {
    if (activeLead) {
      setProponente1Nome(activeLead.nome || '');
      setProponente1Nacionalidade(activeLead.nacionalidade || 'Brasileiro(a)');
      setProponente1Cpf(activeLead.cpf || '');
      setProponente1Rg(activeLead.rg || '');
      setProponente1Endereco(activeLead.endereco || '');
      setProponente1Telefone(activeLead.telefone || '');
      setProponente1Email(activeLead.email || '');
    }
  }, [selectedLeadId]);

  const defaultTemplate = `INSTRUMENTO PARTICULAR DE PROPOSTA E CONTRATO DE COMPRA E VENDA DE UNIDADE IMOBILIÁRIA
Nº DA PROPOSTA: {{PROPOSTA_NUMERO}} | Nº DO CONTRATO: {{CONTRATO_NUMERO}}
EMPREENDIMENTO: {{NOME_EMPREENDIMENTO}} — Loteadora/Incorporadora: {{NOME_INCORPORADORA}} (CNPJ: {{CNPJ_INCORPORADORA}})

1. QUALIFICAÇÃO DAS PARTES:
VENDEDORA / INCORPORADORA: {{NOME_INCORPORADORA}}, inscrita no CNPJ sob nº {{CNPJ_INCORPORADORA}}, com sede na {{ENDERECO_EMPREENDIMENTO}}.
COMPRADOR(A) PRINCIPAL (PROPONENTE 1): {{NOME_CLIENTE}}, {{NACIONALIDADE_CLIENTE}}, portador(a) do CPF nº {{CPF_CLIENTE}}, RG nº {{RG_CLIENTE}}, estado civil {{ESTADO_CIVIL_CLIENTE}}, profissão {{PROFISSAO_CLIENTE}}, residente e domiciliado(a) na {{ENDERECO_CLIENTE}}, telefone {{TELEFONE_CLIENTE}}, e-mail {{EMAIL_CLIENTE}}.
{{BLOCO_PROPONENTE_2}}

2. OBJETO DO CONTRATO:
Constitui objeto do presente instrumento a promessa de venda da unidade autônoma designada como:
- Quadra / Torre: {{QUADRA}}
- Lote / Unidade: {{LOTE}}
- Logradouro / Rua: {{RUA}}
- Cidade / UF: {{CIDADE_UF}}

3. PREÇO E PLANO DE PAGAMENTO PERSONALIZADO:
O valor total de venda do imóvel é de R$ {{VALOR_IMOVEL}}, a ser pago nas seguintes condições pactuadas:
a) Sinal / Ato 1: R$ {{ATO_1}}
b) Sinal / Ato 2: R$ {{ATO_2}}
c) Sinal / Ato 3: R$ {{ATO_3}}
d) Parcelas Mensais: {{QTD_MENSAIS}}x de R$ {{VALOR_PARCELA_MENSAL}}
e) Parcelas Semestrais: {{QTD_SEMESTRAIS}}x de R$ {{VALOR_SEMESTRAL}}
f) Parcelas Anuais: {{QTD_ANUAIS}}x de R$ {{VALOR_ANUAL}}
g) Parcela de Chaves: R$ {{VALOR_CHAVES}}
h) Financiamento Bancário (CEF): R$ {{VALOR_FINANCIAMENTO}}
i) Subsídio Federal (MCMV): R$ {{SUBSIDIO_FEDERAL}}
j) Subsídio Estadual (${settings.nomeSubsidioEstadual || "Estadual"}): R$ {{SUBSIDIO_ESTADUAL}}
k) FGTS Utilizado: R$ {{VALOR_FGTS}}

4. CONDIÇÕES GERAIS E TERMOS:
O(A) COMPRADOR(A) declara estar ciente, de acordo e vinculado(a) aos termos de financiamento, regras de repasse junto à Caixa Econômica Federal e regulamento interno do empreendimento {{NOME_EMPREENDIMENTO}}.

{{CIDADE_UF}}, em {{DATA_ATUAL}}.

___________________________________________________
{{NOME_INCORPORADORA}}
VENDEDORA / CONSTRUTORA

___________________________________________________
PROPONENTE 1: {{NOME_CLIENTE}}
{{ASSINATURA_PROPONENTE_2}}

TESTEMUNHAS:
1. _______________________________________________
Nome: {{TESTEMUNHA_1_NOME}} | CPF: {{TESTEMUNHA_1_CPF}}

2. _______________________________________________
Nome: {{TESTEMUNHA_2_NOME}} | CPF: {{TESTEMUNHA_2_CPF}}`;

  const [contractText, setContractText] = useState<string>(defaultTemplate);
  const [copied, setCopied] = useState<boolean>(false);
  const [uploadSuccess, setUploadSuccess] = useState<string>('');

  const generatePopulatedText = () => {
    let text = contractText;
    const nomeCliente = proponente1Nome || activeLead?.nome || activeUnit?.clienteNome || 'Nome do Proponente';
    const nacionalidadeCliente = proponente1Nacionalidade || activeLead?.nacionalidade || 'Brasileiro(a)';
    const cpfCliente = proponente1Cpf || activeLead?.cpf || '000.000.000-00';
    const rgCliente = proponente1Rg || activeLead?.rg || '00.000.000-0';
    const enderecoCliente = proponente1Endereco || activeLead?.endereco || activeDev.address;
    const telefoneCliente = proponente1Telefone || activeLead?.telefone || '(00) 00000-0000';
    const emailCliente = proponente1Email || activeLead?.email || 'cliente@email.com';

    let blocoProp2 = '';
    let assinaturaProp2 = '';
    if (hasProponente2 && proponente2Nome) {
      const nac2 = proponente2Nacionalidade || 'Brasileiro(a)';
      const rg2Str = proponente2Rg ? `, RG nº ${proponente2Rg}` : '';
      const ec2 = proponente2EstadoCivil || 'Casado(a)';
      const prof2 = proponente2Profissao || 'Não informada';
      const end2 = proponente2Endereco || enderecoCliente;
      const tel2 = proponente2Telefone || telefoneCliente;
      const mail2 = proponente2Email || emailCliente;
      blocoProp2 = `COMPRADOR(A) 2 (CO-COMPRADOR / CÔNJUGE): ${proponente2Nome}, ${nac2}, portador(a) do CPF nº ${proponente2Cpf}${rg2Str}, estado civil ${ec2}, profissão ${prof2}, residente e domiciliado(a) na ${end2}, telefone ${tel2}, e-mail ${mail2}.`;
      assinaturaProp2 = `\n\n___________________________________________________\nPROPONENTE 2: ${proponente2Nome}`;
    }

    const quadra = activeUnit?.quadra || 'Quadra 01';
    const lote = activeUnit?.lote || 'Lote 01';
    const rua = activeUnit?.rua || 'Rua Principal';
    const valorImovel = activeUnit ? formatCurrency(activeUnit.valorFinal) : formatCurrency(215000);

    text = text
      .replace(/\{\{PROPOSTA_NUMERO\}\}/g, proposalNumber)
      .replace(/\{\{CONTRATO_NUMERO\}\}/g, contractNumber)
      .replace(/\{\{NOME_EMPREENDIMENTO\}\}/g, activeDev.name)
      .replace(/\{\{NOME_INCORPORADORA\}\}/g, activeDev.developerName)
      .replace(/\{\{CNPJ_INCORPORADORA\}\}/g, activeDev.cnpj)
      .replace(/\{\{ENDERECO_EMPREENDIMENTO\}\}/g, activeDev.address)
      .replace(/\{\{NOME_CLIENTE\}\}/g, nomeCliente)
      .replace(/\{\{NACIONALIDADE_CLIENTE\}\}/g, nacionalidadeCliente)
      .replace(/\{\{CPF_CLIENTE\}\}/g, cpfCliente)
      .replace(/\{\{RG_CLIENTE\}\}/g, rgCliente)
      .replace(/\{\{ESTADO_CIVIL_CLIENTE\}\}/g, proponente1EstadoCivil)
      .replace(/\{\{PROFISSAO_CLIENTE\}\}/g, proponente1Profissao || 'Não informada')
      .replace(/\{\{ENDERECO_CLIENTE\}\}/g, enderecoCliente)
      .replace(/\{\{TELEFONE_CLIENTE\}\}/g, telefoneCliente)
      .replace(/\{\{EMAIL_CLIENTE\}\}/g, emailCliente)
      .replace(/\{\{BLOCO_PROPONENTE_2\}\}/g, blocoProp2)
      .replace(/\{\{ASSINATURA_PROPONENTE_2\}\}/g, assinaturaProp2)
      .replace(/\{\{QUADRA\}\}/g, quadra)
      .replace(/\{\{LOTE\}\}/g, lote)
      .replace(/\{\{RUA\}\}/g, rua)
      .replace(/\{\{VALOR_IMOVEL\}\}/g, valorImovel)
      .replace(/\{\{ATO_1\}\}/g, formatCurrency(ato1))
      .replace(/\{\{ATO_2\}\}/g, formatCurrency(ato2))
      .replace(/\{\{ATO_3\}\}/g, formatCurrency(ato3))
      .replace(/\{\{QTD_MENSAIS\}\}/g, qtdMensais.toString())
      .replace(/\{\{VALOR_PARCELA_MENSAL\}\}/g, formatCurrency(valorMensal))
      .replace(/\{\{QTD_SEMESTRAIS\}\}/g, qtdSemestrais.toString())
      .replace(/\{\{VALOR_SEMESTRAL\}\}/g, formatCurrency(valorSemestral))
      .replace(/\{\{QTD_ANUAIS\}\}/g, qtdAnuais.toString())
      .replace(/\{\{VALOR_ANUAL\}\}/g, formatCurrency(valorAnual))
      .replace(/\{\{VALOR_CHAVES\}\}/g, formatCurrency(valorChaves))
      .replace(/\{\{VALOR_FINANCIAMENTO\}\}/g, formatCurrency(valorFinanciamento))
      .replace(/\{\{SUBSIDIO_FEDERAL\}\}/g, formatCurrency(subsidioFederal))
      .replace(/\{\{SUBSIDIO_ESTADUAL\}\}/g, formatCurrency(subsidioEstadual))
      .replace(/\{\{VALOR_FGTS\}\}/g, formatCurrency(valorFgts))
      .replace(/\{\{CIDADE_UF\}\}/g, activeDev.cityUf)
      .replace(/\{\{DATA_ATUAL\}\}/g, new Date().toLocaleDateString('pt-BR'))
      .replace(/\{\{TESTEMUNHA_1_NOME\}\}/g, testemunha1Nome)
      .replace(/\{\{TESTEMUNHA_1_CPF\}\}/g, testemunha1Cpf)
      .replace(/\{\{TESTEMUNHA_2_NOME\}\}/g, testemunha2Nome)
      .replace(/\{\{TESTEMUNHA_2_CPF\}\}/g, testemunha2Cpf);

    return text;
  };

  const populatedText = generatePopulatedText();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setContractText(content);
        setUploadSuccess(`Minuta "${file.name}" carregada com sucesso!`);
        setTimeout(() => setUploadSuccess(''), 4000);
        logAction('Upload Minuta Contrato', 'Gerador de Contrato', `Arquivo ${file.name} carregado.`);
      }
    };
    reader.readAsText(file);
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(populatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handlePrintPdf = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Proposta e Contrato — ${activeDev.name} (${proposalNumber})</title>
            <style>
              body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; line-height: 1.6; color: #111; }
              .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #059669; padding-bottom: 15px; margin-bottom: 25px; }
              .logo-area h2 { margin: 0; color: #059669; font-size: 20px; }
              .logo-area p { margin: 2px 0 0; font-size: 11px; color: #555; }
              .doc-badge { text-align: right; font-size: 12px; color: #333; }
              pre { white-space: pre-wrap; font-family: Arial, sans-serif; font-size: 13px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="logo-area">
                <h2>${activeDev.name}</h2>
                <p>${activeDev.developerName} — CNPJ: ${activeDev.cnpj}</p>
                <p>${activeDev.address} • ${activeDev.cityUf}</p>
              </div>
              <div class="doc-badge">
                <strong>Proposta:</strong> ${proposalNumber}<br/>
                <strong>Contrato:</strong> ${contractNumber}<br/>
                <strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}
              </div>
            </div>
            <pre>${populatedText}</pre>
            <script>window.print();</script>
          </body>
        </html>
      `);
      printWindow.document.close();
      logAction('Impressão / PDF Proposta e Contrato', 'Gerador de Contrato', `Documento ${proposalNumber} gerado para impressão.`);
    }
  };

  const handleSendWhatsApp = () => {
    const phone = proponente1Telefone || activeLead?.telefone || '5541999999999';
    const cleanPhone = phone.replace(/\D/g, '');
    const msg = encodeURIComponent(
      `Olá *${proponente1Nome || 'Cliente'}*! Segue a proposta oficial (${proposalNumber}) e minuta do contrato para o empreendimento *${activeDev.name}* (${activeUnit?.quadra || ''} - ${activeUnit?.lote || ''}). Por favor, confira os dados.`
    );
    window.open(`https://wa.me/55${cleanPhone}?text=${msg}`, '_blank');
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header & Actions */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Gerador de Propostas & Contratos ({proposalNumber})
            </h1>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Configure proponentes, plano de pagamento personalizado (com semestrais, anuais e chaves), dados da loteadora e imprima com logotipos e duas testemunhas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs">
            <Upload className="w-4 h-4" />
            <span>Subir Minuta (TXT/PDF)</span>
            <input type="file" accept=".txt,.md,.pdf" onChange={handleFileUpload} className="hidden" />
          </label>

          <button
            onClick={handleCopyText}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copiado!' : 'Copiar'}</span>
          </button>

          <button
            onClick={handlePrintPdf}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir / Salvar PDF</span>
          </button>

          <button
            onClick={handleSendWhatsApp}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs"
          >
            <Send className="w-4 h-4" />
            <span>Enviar WhatsApp</span>
          </button>
        </div>
      </div>

      {uploadSuccess && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300">
          {uploadSuccess}
        </div>
      )}

      {/* Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Proponents, Unit & Payment Plan Configuration */}
        <div className="lg:col-span-2 space-y-6">
          {/* Seção 1: Seleção de Unidade & Empreendimento */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Building className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                1. Empreendimento & Unidade Imobiliária
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Empreendimento Ativo:</label>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 mt-1">
                  <p className="font-bold text-slate-900 dark:text-white">{activeDev.name}</p>
                  <p className="text-[11px] text-slate-500">Incorporadora: {activeDev.developerName} (CNPJ: {activeDev.cnpj})</p>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Selecionar Unidade (Tabela):</label>
                <select
                  value={selectedUnitId}
                  onChange={(e) => setSelectedUnitId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white mt-1"
                >
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.quadra} - {u.lote} ({u.rua}) • {formatCurrency(u.valorFinal)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Seção 2: Proponentes (Compradores) */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  2. Qualificação dos Proponentes (Compradores)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setHasProponente2(!hasProponente2)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold"
              >
                {hasProponente2 ? 'Remover Co-comprador' : '+ Adicionar Co-comprador / Cônjuge'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Nome do Proponente 1 (Titular):</label>
                <input
                  type="text"
                  value={proponente1Nome}
                  onChange={(e) => setProponente1Nome(e.target.value)}
                  placeholder="Nome Completo"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white mt-1"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Nacionalidade:</label>
                <input
                  type="text"
                  value={proponente1Nacionalidade}
                  onChange={(e) => setProponente1Nacionalidade(e.target.value)}
                  placeholder="Ex: Brasileiro(a)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white mt-1"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">CPF do Proponente 1:</label>
                <input
                  type="text"
                  value={proponente1Cpf}
                  onChange={(e) => setProponente1Cpf(e.target.value)}
                  placeholder="000.000.000-00"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white mt-1"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">RG do Proponente 1:</label>
                <input
                  type="text"
                  value={proponente1Rg}
                  onChange={(e) => setProponente1Rg(e.target.value)}
                  placeholder="00.000.000-0"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white mt-1"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Estado Civil:</label>
                <select
                  value={proponente1EstadoCivil}
                  onChange={(e) => setProponente1EstadoCivil(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white mt-1"
                >
                  <option value="Solteiro(a)">Solteiro(a)</option>
                  <option value="Casado(a)">Casado(a)</option>
                  <option value="Divorciado(a)">Divorciado(a)</option>
                  <option value="União Estável">União Estável</option>
                  <option value="Viúvo(a)">Viúvo(a)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Profissão:</label>
                <input
                  type="text"
                  value={proponente1Profissao}
                  onChange={(e) => setProponente1Profissao(e.target.value)}
                  placeholder="Ex: Analista de Sistemas"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white mt-1"
                />
              </div>

              <div className="md:col-span-2">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Endereço Residencial Completo:</label>
                <input
                  type="text"
                  value={proponente1Endereco}
                  onChange={(e) => setProponente1Endereco(e.target.value)}
                  placeholder="Rua, Nº, Bairro, Cidade/UF, CEP"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white mt-1"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">WhatsApp / Telefone:</label>
                <input
                  type="text"
                  value={proponente1Telefone}
                  onChange={(e) => setProponente1Telefone(e.target.value)}
                  placeholder="(41) 99999-9999"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white mt-1"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">E-mail do Proponente 1:</label>
                <input
                  type="email"
                  value={proponente1Email}
                  onChange={(e) => setProponente1Email(e.target.value)}
                  placeholder="cliente@email.com"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white mt-1"
                />
              </div>
            </div>

            {hasProponente2 && (
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Dados do Co-comprador / Cônjuge (Proponente 2)</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Nome Completo:</label>
                    <input
                      type="text"
                      value={proponente2Nome}
                      onChange={(e) => setProponente2Nome(e.target.value)}
                      placeholder="Nome Completo Proponente 2"
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white mt-0.5"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Nacionalidade:</label>
                    <input
                      type="text"
                      value={proponente2Nacionalidade}
                      onChange={(e) => setProponente2Nacionalidade(e.target.value)}
                      placeholder="Ex: Brasileiro(a)"
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white mt-0.5"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">CPF:</label>
                    <input
                      type="text"
                      value={proponente2Cpf}
                      onChange={(e) => setProponente2Cpf(e.target.value)}
                      placeholder="CPF Proponente 2"
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white mt-0.5"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">RG:</label>
                    <input
                      type="text"
                      value={proponente2Rg}
                      onChange={(e) => setProponente2Rg(e.target.value)}
                      placeholder="RG Proponente 2"
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white mt-0.5"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Estado Civil:</label>
                    <select
                      value={proponente2EstadoCivil}
                      onChange={(e) => setProponente2EstadoCivil(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white mt-0.5"
                    >
                      <option value="Casado(a)">Casado(a)</option>
                      <option value="Solteiro(a)">Solteiro(a)</option>
                      <option value="União Estável">União Estável</option>
                      <option value="Divorciado(a)">Divorciado(a)</option>
                      <option value="Viúvo(a)">Viúvo(a)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Profissão:</label>
                    <input
                      type="text"
                      value={proponente2Profissao}
                      onChange={(e) => setProponente2Profissao(e.target.value)}
                      placeholder="Profissão Proponente 2"
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white mt-0.5"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Endereço Residencial:</label>
                    <input
                      type="text"
                      value={proponente2Endereco}
                      onChange={(e) => setProponente2Endereco(e.target.value)}
                      placeholder="Rua, Nº, Bairro, Cidade/UF (ou deixe em branco se igual)"
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white mt-0.5"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">E-mail Proponente 2:</label>
                    <input
                      type="email"
                      value={proponente2Email}
                      onChange={(e) => setProponente2Email(e.target.value)}
                      placeholder="email2@exemplo.com"
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white mt-0.5"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Seção 3: Plano de Pagamento Personalizado (Incluindo Semestrais, Anuais e Chaves) */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                3. Plano de Pagamento Personalizado (Atos, Mensais, Semestrais, Anuais, Chaves & Saldo)
              </h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Sinal / Ato 1:</label>
                <input
                  type="text"
                  value={hookAto1.displayValue}
                  onChange={hookAto1.onChange}
                  placeholder="R$ 0,00"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white mt-1"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Sinal / Ato 2:</label>
                <input
                  type="text"
                  value={hookAto2.displayValue}
                  onChange={hookAto2.onChange}
                  placeholder="R$ 0,00"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white mt-1"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Sinal / Ato 3:</label>
                <input
                  type="text"
                  value={hookAto3.displayValue}
                  onChange={hookAto3.onChange}
                  placeholder="R$ 0,00"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white mt-1"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Qtd Mensais:</label>
                <input
                  type="text"
                  value={hookQtdMensais.displayValue}
                  onChange={hookQtdMensais.onChange}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white mt-1"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Valor Parcela Mensal:</label>
                <input
                  type="text"
                  value={hookValorMensal.displayValue}
                  onChange={hookValorMensal.onChange}
                  placeholder="R$ 0,00"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white mt-1"
                />
              </div>

              {/* Parcelas Semestrais */}
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Qtd Semestrais:</label>
                <input
                  type="text"
                  value={hookQtdSemestrais.displayValue}
                  onChange={hookQtdSemestrais.onChange}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white mt-1"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Valor Semestral:</label>
                <input
                  type="text"
                  value={hookValorSemestral.displayValue}
                  onChange={hookValorSemestral.onChange}
                  placeholder="R$ 0,00"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white mt-1"
                />
              </div>

              {/* Parcelas Anuais */}
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Qtd Anuais:</label>
                <input
                  type="text"
                  value={hookQtdAnuais.displayValue}
                  onChange={hookQtdAnuais.onChange}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white mt-1"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Valor Anual:</label>
                <input
                  type="text"
                  value={hookValorAnual.displayValue}
                  onChange={hookValorAnual.onChange}
                  placeholder="R$ 0,00"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white mt-1"
                />
              </div>

              {/* Parcela de Chaves */}
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Parcela de Chaves:</label>
                <input
                  type="text"
                  value={hookValorChaves.displayValue}
                  onChange={hookValorChaves.onChange}
                  placeholder="R$ 0,00"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white mt-1"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Financiamento CEF:</label>
                <input
                  type="text"
                  value={hookValorFinanciamento.displayValue}
                  onChange={hookValorFinanciamento.onChange}
                  placeholder="R$ 0,00"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white mt-1"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Subsídio Federal:</label>
                <input
                  type="text"
                  value={hookSubsidioFederal.displayValue}
                  onChange={hookSubsidioFederal.onChange}
                  placeholder="R$ 0,00"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white mt-1"
                />
              </div>
            </div>
          </div>

          {/* Seção 4: Configuração de Testemunhas */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                4. Configuração das Duas Testemunhas Obrigatórias
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 dark:text-slate-200">Testemunha 1</h4>
                <input
                  type="text"
                  value={testemunha1Nome}
                  onChange={(e) => setTestemunha1Nome(e.target.value)}
                  placeholder="Nome Testemunha 1"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
                <input
                  type="text"
                  value={testemunha1Cpf}
                  onChange={(e) => setTestemunha1Cpf(e.target.value)}
                  placeholder="CPF Testemunha 1"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 dark:text-slate-200">Testemunha 2</h4>
                <input
                  type="text"
                  value={testemunha2Nome}
                  onChange={(e) => setTestemunha2Nome(e.target.value)}
                  placeholder="Nome Testemunha 2"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
                <input
                  type="text"
                  value={testemunha2Cpf}
                  onChange={(e) => setTestemunha2Cpf(e.target.value)}
                  placeholder="CPF Testemunha 2"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Editor & Preview */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Edit3 className="w-4 h-4 text-emerald-600" />
                <span>Editor de Minuta</span>
              </h2>
              <button
                onClick={() => setContractText(defaultTemplate)}
                className="text-[11px] text-emerald-600 hover:underline flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Restaurar Padrão</span>
              </button>
            </div>

            <textarea
              rows={16}
              value={contractText}
              onChange={(e) => setContractText(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-mono text-slate-900 dark:text-white leading-relaxed"
            />

            <div className="space-y-2 pt-2">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Pré-visualização do Documento ({proposalNumber})</span>
              </h3>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 overflow-y-auto max-h-[350px] text-[11px] font-mono text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                {populatedText}
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={handlePrintPdf}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold text-center shadow-xs"
              >
                Salvar PDF / Imprimir
              </button>
              <button
                onClick={handleSendWhatsApp}
                className="flex-1 py-2.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white rounded-xl text-xs font-bold text-center"
              >
                Enviar p/ WhatsApp
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
