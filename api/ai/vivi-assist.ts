import { GoogleGenAI } from '@google/genai';

let aiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
  }
  return aiClient;
}

export default async function handler(req: any, res: any) {
  // Support CORS if needed
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(200).json({ status: 'ok', service: 'Vivi AI Serverless' });
  }

  const userMessage = (req.body?.message || req.body?.prompt || req.body?.query || '').trim();
  const userCtx = req.body?.context || req.body?.userContext || {};
  const userMode = req.body?.mode || 'geral';

  try {
    if (!userMessage) {
      return res.status(200).json({
        reply: 'Olá! Como posso te ajudar hoje com suas vendas, simulações, scripts ou dúvidas sobre o mercado imobiliário?',
        source: 'greeting',
      });
    }

    const ai = getAIClient();

    if (ai) {
      const prompt = `Você é a "Vivi", a mais experiente e inteligente copiloto de vendas e inteligência comercial do mercado imobiliário brasileiro, atuando no empreendimento Jardim Vivência e lançamentos imobiliários.
Seu objetivo é ajudar corretores de vendas (Hunters), líderes de equipe, gestores e coordenadores a converterem mais clientes, fecharem propostas, quebrarem objeções, elaborarem roteiros de WhatsApp magnéticos e tirarem dúvidas sobre crédito imobiliário (Caixa Econômica Federal - CEF, SBPE, Minha Casa Minha Vida - MCMV, Programa ${userCtx.nomeSubsidioEstadual || 'Estadual'}, uso do FGTS, regras de Fifty/divisão de comissão e especificações técnicas do Jardim Vivência).

Conhecimento Específico Obrigatório:
1. REGRAS DE DIVISÃO DE COMISSÃO (FIFTY):
- Fifty de Plantão / Captação x Fechamento: Quando um corretor (Hunter/Captador) atrai e cadastra o lead, e outro corretor realiza o atendimento ou fechamento presencial no plantão de vendas, a comissão de intermediação é dividida em 50% para o Captador e 50% para o Fechador (Fifty).
- Prazo de Atividade de 15 Dias: O direito ao Fifty do corretor captador é válido por até 15 dias sem inatividade. Caso o lead fique mais de 15 dias sem nenhuma atualização, historico ou atendimento registrado no CRM, o lead vai para a Caixa de Resgate (Caixa de Leads) e o corretor que resgatar e fechar fica com 100% da comissão sem obrigação de Fifty.
- Parcerias com Imobiliárias Externas: Nas vendas realizadas em parceria com Imobiliárias Parceiras, a comissão destinada à imobiliária parceira obedece à regra de Fifty contratual da tabela do empreendimento.
- Sobreremuneração de Liderança: Comissões e over-riding de Gestores de Equipe e Coordenadores são pagos pela Loteadora/Incorporadora e NÃO reduzem a fatia de 50% do corretor no Fifty.
- Duplicidade e Conflito: Em caso de divergência de atendimento no mesmo CPF, o sistema gera alerta automático para validação do Coordenador com base nas datas e registros de interação.

2. FICHA TÉCNICA E DETALHES DO EMPREENDIMENTO "JARDIM VIVÊNCIA":
- Total de Unidades: 877 casas isoladas (sem geminação), garantindo total privacidade e independência.
- Casas Térreas: 48,55m² totais (36,17m² interna útil + 7,50m² garagem coberta + 4,88m² lavanderia coberta).
- Lotes: 675 unidades padrão 10x20m (200m²) e 202 unidades irregulares (>200m²).
- Ampliação Garantida: Espaço nos fundos e previsão estrutural para 3º dormitório e área gourmet.
- Sistema Construtivo: Paredes de concreto moldadas no local com isolamento acústico e térmico superior.

Contexto do usuário:
- Nome: ${userCtx.userName || 'Corretor'}
- Cargo: ${userCtx.userRole || 'Corretor de Vendas'}
- CRECI: ${userCtx.creci || 'Não informado'}
- Modo: ${userMode}

Mensagem do usuário:
"${userMessage}"`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      if (response.text) {
        return res.status(200).json({
          reply: response.text,
          source: 'gemini-2.5-flash',
        });
      }
    }

    // High quality contextual fallback engine
    const lower = userMessage.toLowerCase();
    let reply = '';

    if (lower.includes('script') || lower.includes('whatsapp') || lower.includes('mensagem') || lower.includes('abordar')) {
      reply = `📋 *Script de Alto Impacto para WhatsApp*:\n\n"Olá, tudo bem? Aqui é ${userCtx.userName || 'do time de vendas'} do **Jardim Vivência**! 🏡✨\n\nEstava revisando as condições liberadas para o seu perfil e temos excelentes novidades com subsídio federal Minha Casa Minha Vida e estadual ${userCtx.nomeSubsidioEstadual || 'Estadual'} de até R$ 20.000,00 a fundo perdido!\n\nVocê prefere vir ao plantão hoje às 15h ou amanhã pela manhã para tomarmos um café e eu te entregar a simulação detalhada?"`;
    } else if (lower.includes('objeção') || lower.includes('entrada') || lower.includes('caro')) {
      reply = `💡 *Técnicas de Quebra de Objeção para Entrada*:\n\n1. **Desmembramento do Fluxo**: No Jardim Vivência, a entrada é facilitada em pequenos atos (+30 e +60 dias) e mensais suaves.\n2. **Alavancagem de Subsídios & FGTS**: A soma do subsídio estadual + MCMV + FGTS pode abater a maior parte da sua entrada!\n3. **Pergunta de Fechamento**: *"Se a parcela mensal couber com folga no seu orçamento, você garante sua unidade hoje?"*`;
    } else {
      reply = `👋 Olá, **${userCtx.userName || 'Corretor'}**! Como sua copiloto de vendas do **Jardim Vivência**, recomendo focar na demonstração dos lotes privativos de 200m² e na facilidade de financiamento com subsídios acumulados. Como posso te auxiliar com este cliente?`;
    }

    return res.status(200).json({
      reply,
      source: 'expert_real_estate_engine',
    });
  } catch (error: any) {
    console.error('Vivi AI Serverless Error:', error);
    return res.status(200).json({
      reply: '💡 *Dica da Vivi*: Apresente sempre as opções de parcelamento de entrada em pequenos Atos e o uso integral do FGTS para viabilizar a aprovação na Caixa Econômica Federal.',
      source: 'fallback',
    });
  }
}
