import { SimulationInput, SimulationResult, SimulatorPolicyRule, UnitGroup } from '../types';

export function calculateSimulation(
  input: SimulationInput,
  rules?: SimulatorPolicyRule[]
): SimulationResult {
  const valorImovel = Math.max(0, Number(input.valorImovel) || 0);
  const financiamentoCef = Math.max(0, Number(input.financiamentoCef) || 0);
  const fgts = Math.max(0, Number(input.fgts) || 0);
  const subsidioFederal = Math.max(0, Number(input.subsidioFederal) || 0);
  const subsidioEstadual = Math.max(0, Number(input.subsidioEstadual) || 0);
  const ato1 = Math.max(0, Number(input.ato1) || 0);
  const dataAto1 = input.dataAto1 || '';
  const ato2 = Math.max(0, Number(input.ato2) || 0);
  const ato3 = Math.max(0, Number(input.ato3) || 0);
  const diaMensais = Math.max(1, Math.min(31, Number(input.diaMensais) || 10));
  const parcelaMaximaCliente = Math.max(0, Number(input.parcelaMaximaCliente) || 0);
  const rendaFamiliar = Math.max(0, Number(input.rendaFamiliar) || 0);
  const inputTaxaGestaoCef = input.taxaGestaoCef;
  const grupoFaixa = input.grupoFaixa;
  const inputComplementar = Math.max(0, Number(input.parcelaComplementar) || 0);

  // Helper to extract dynamic rule values
  const getRuleNum = (paramKey: string, fallback: number): number => {
    if (!rules || rules.length === 0) return fallback;
    const r = rules.find((item) => item.parametro === paramKey);
    if (!r) return fallback;
    const num = Number(r.valorAtual);
    return isNaN(num) ? fallback : num;
  };

  const taxaGestaoCef = inputTaxaGestaoCef !== undefined && inputTaxaGestaoCef >= 0
    ? Number(inputTaxaGestaoCef) || 0
    : getRuleNum('taxa_gestao_cef_padrao', 2500);

  const maxComprometimentoPct = getRuleNum('comprometimento_renda_max_pct', 30);
  const tetoRendaGrupoA = getRuleNum('teto_renda_grupo_a', 2640);
  const tetoRendaGrupoB = getRuleNum('teto_renda_grupo_b', 4400);

  const totalSubsidios = subsidioFederal + subsidioEstadual;
  const totalCreditos = financiamentoCef + fgts + totalSubsidios;

  // Entrada líquida total a ser quitada junto à construtora/loteadora + Gestão CEF
  const totalEntradaNecessaria = Math.max(0, (valorImovel + taxaGestaoCef) - totalCreditos);

  const totalAtos = ato1 + ato2 + ato3;
  const saldoAposAtos = Math.max(0, totalEntradaNecessaria - totalAtos);

  // Multi-tier Mensais Logic
  const m1q = Math.max(0, Math.floor(Number(input.mensais1Qtd) || 0));
  const m1vInput = Math.max(0, Number(input.mensais1Valor) || 0);
  const m2q = Math.max(0, Math.floor(Number(input.mensais2Qtd) || 0));
  const m2v = Math.max(0, Number(input.mensais2Valor) || 0);
  const m3q = Math.max(0, Math.floor(Number(input.mensais3Qtd) || 0));
  const m3v = Math.max(0, Number(input.mensais3Valor) || 0);
  const m4q = Math.max(0, Math.floor(Number(input.mensais4Qtd) || 0));
  const m4v = Math.max(0, Number(input.mensais4Valor) || 0);

  const parcelaComplementar = inputComplementar;

  // Fixed amounts for tiers 2, 3, 4
  const fixedM2Total = m2q > 0 ? (m2q * m2v) : 0;
  const fixedM3Total = m3q > 0 ? (m3q * m3v) : 0;
  const fixedM4Total = m4q > 0 ? (m4q * m4v) : 0;
  const otherFixedTotal = fixedM2Total + fixedM3Total + fixedM4Total;

  // Determine effective m1v
  let m1vEffective = 0;
  if (m1vInput > 0) {
    m1vEffective = m1vInput;
  } else if (m1q > 0) {
    const saldoRestanteParaM1 = Math.max(0, saldoAposAtos - parcelaComplementar - otherFixedTotal);
    m1vEffective = Math.round((saldoRestanteParaM1 / m1q) * 100) / 100;
  }

  const totalM1 = m1q > 0 ? (m1q * m1vEffective) : 0;
  const totalMensais = totalM1 + fixedM2Total + fixedM3Total + fixedM4Total;
  const totalQtdMensais = (m1q > 0 ? m1q : 0) + (m2q > 0 ? m2q : 0) + (m3q > 0 ? m3q : 0) + (m4q > 0 ? m4q : 0);

  // Representative monthly installment
  let valorParcelaMensal = m1vEffective > 0 ? m1vEffective : (m2v > 0 ? m2v : (m3v > 0 ? m3v : (m4v > 0 ? m4v : 0)));
  if (valorParcelaMensal === 0 && totalQtdMensais > 0) {
    valorParcelaMensal = Math.round((totalMensais / totalQtdMensais) * 100) / 100;
  }

  const saldoRestante = Math.max(0, totalEntradaNecessaria - (totalAtos + totalMensais + parcelaComplementar));

  // Build Cronograma de Datas
  const cronograma: SimulationResult['cronograma'] = [];
  
  let baseDate = new Date();
  if (dataAto1) {
    const parsed = new Date(dataAto1 + 'T12:00:00');
    if (!isNaN(parsed.getTime())) {
      baseDate = parsed;
    }
  }

  // Ato 1
  if (ato1 > 0) {
    cronograma.push({
      bloco: 'Ato 1',
      data: formatDateIso(baseDate),
      valor: ato1,
    });
  }
  // Ato 2 (+30 dias)
  if (ato2 > 0) {
    const d2 = new Date(baseDate);
    d2.setDate(d2.getDate() + 30);
    cronograma.push({
      bloco: 'Ato 2',
      data: formatDateIso(d2),
      valor: ato2,
    });
  }
  // Ato 3 (+60 dias)
  if (ato3 > 0) {
    const d3 = new Date(baseDate);
    d3.setDate(d3.getDate() + 60);
    cronograma.push({
      bloco: 'Ato 3',
      data: formatDateIso(d3),
      valor: ato3,
    });
  }

  // Mensais: Start on selected day, 90 days / 3 months after Ato 1
  const startMensaisDate = new Date(baseDate);
  startMensaisDate.setMonth(startMensaisDate.getMonth() + 3);
  startMensaisDate.setDate(Math.min(diaMensais || 10, 28));

  let globalMensalIndex = 1;

  const pushMensais = (qtd: number, valor: number, label: string) => {
    const safeQtd = Math.max(0, Math.floor(qtd));
    const safeVal = Math.max(0, valor || 0);
    for (let i = 0; i < safeQtd; i++) {
      const mDate = new Date(startMensaisDate);
      mDate.setMonth(startMensaisDate.getMonth() + (globalMensalIndex - 1));
      cronograma.push({
        bloco: label,
        numero: globalMensalIndex,
        data: formatDateIso(mDate),
        valor: safeVal,
        subGrupo: label,
      });
      globalMensalIndex++;
    }
  };

  if (m1q > 0) pushMensais(m1q, m1vEffective, 'Mensais 1');
  if (m2q > 0 && m2v > 0) pushMensais(m2q, m2v, 'Mensais 2');
  if (m3q > 0 && m3v > 0) pushMensais(m3q, m3v, 'Mensais 3');
  if (m4q > 0 && m4v > 0) pushMensais(m4q, m4v, 'Mensais 4');

  // Parcela Complementar (ao término das mensais ou nas chaves)
  if (parcelaComplementar > 0) {
    const compDate = new Date(startMensaisDate);
    compDate.setMonth(startMensaisDate.getMonth() + (globalMensalIndex - 1));
    cronograma.push({
      bloco: 'Complementar',
      data: formatDateIso(compDate),
      valor: parcelaComplementar,
      subGrupo: 'Complementar',
    });
  }

  // Validation logic
  const mensagens: string[] = [];
  let limitadorMinimoOk = true;
  let parcelaCompativel = true;
  let statusViabilidade: 'aprovado' | 'alerta' | 'reprovado' = 'aprovado';

  // Group limits check using dynamic rules
  if (grupoFaixa === 'Grupo A' && rendaFamiliar > tetoRendaGrupoA) {
    mensagens.push(
      `Atenção: Renda familiar informada (${formatCurrency(rendaFamiliar)}) está acima do teto do Grupo A (${formatCurrency(tetoRendaGrupoA)}). Reclassificação para Grupo B.`
    );
    limitadorMinimoOk = false;
  } else if (grupoFaixa === 'Grupo B' && (rendaFamiliar < tetoRendaGrupoA || rendaFamiliar > tetoRendaGrupoB)) {
    if (rendaFamiliar < tetoRendaGrupoA) {
      mensagens.push(
        `Renda familiar abaixo do piso do Grupo B. Cliente se enquadra no Grupo A com direito ao subsídio estadual máximo.`
      );
    } else {
      mensagens.push(
        `Renda familiar acima do teto do Grupo B (${formatCurrency(tetoRendaGrupoB)}). Enquadramento no Grupo C.`
      );
    }
  }

  // Dynamic Rule % for comprometimento de renda
  const tetoParcelaPermitida = rendaFamiliar * (maxComprometimentoPct / 100);
  const comprometimentoRendaPct = rendaFamiliar > 0 ? Math.round((valorParcelaMensal / rendaFamiliar) * 100) : 0;

  if (parcelaMaximaCliente > 0 && valorParcelaMensal > parcelaMaximaCliente) {
    parcelaCompativel = false;
    statusViabilidade = 'alerta';
    mensagens.push(
      `Alerta: A parcela mensal (${formatCurrency(valorParcelaMensal)}) ultrapassa o limite orçamentário informado pelo cliente (${formatCurrency(parcelaMaximaCliente)}). Recomenda-se estender o número de mensais ou complementar no Ato.`
    );
  }

  if (rendaFamiliar > 0 && valorParcelaMensal > tetoParcelaPermitida) {
    statusViabilidade = 'reprovado';
    mensagens.push(
      `Reprovação de Risco: A parcela calculada compromete ${comprometimentoRendaPct}% da renda familiar, excedendo o teto regulatório de ${maxComprometimentoPct}% (${formatCurrency(tetoParcelaPermitida)}).`
    );
  } else if (statusViabilidade === 'aprovado') {
    mensagens.push(
      `Simulação 100% Viável! Fluxo dentro de todos os parâmetros oficiais da Caixa Econômica Federal e ${input.nomeSubsidioEstadual || 'Programa Estadual'}.`
    );
  }

  return {
    valorImovel,
    descontoValor: input.descontoValor || 0,
    valorFinalComDesconto: input.valorFinalComDesconto || valorImovel,
    requerAprovacaoDiretoria: input.requerAprovacaoDiretoria || false,
    taxaGestaoCef,
    totalSubsidios,
    totalEntradaNecessaria,
    totalAtos,
    saldoAposAtos,
    qtdMensais: totalQtdMensais,
    valorParcelaMensal,
    totalMensais,
    parcelaComplementar,
    saldoRestante,
    cronograma,
    viabilidade: {
      limitadorMinimoOk,
      parcelaCompativel,
      comprometimentoRendaPct,
      mensagens,
      statusViabilidade,
    },
  };
}

function formatDateIso(date: Date): string {
  if (!date || isNaN(date.getTime())) {
    const now = new Date();
    return `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
  }
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${d}/${m}/${y}`;
}

export function formatCurrency(val: number): string {
  const safeVal = typeof val === 'number' && !isNaN(val) ? val : 0;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(safeVal);
}
