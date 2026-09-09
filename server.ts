import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

let aiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // API Routes
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", service: "Jardim Vivência Backend", timestamp: new Date().toISOString() });
  });

  // Vivi - AI Assistant for Real Estate Sales, Marketing & Strategy
  app.post("/api/ai/vivi-assist", async (req, res) => {
    const userMessage = (req.body.message || req.body.prompt || req.body.query || "").trim();
    const userCtx = req.body.context || req.body.userContext || {};
    const userMode = req.body.mode || "geral";

    try {
      if (!userMessage) {
        return res.json({
          reply: "Olá! Como posso te ajudar hoje com suas vendas, simulações, scripts ou dúvidas sobre o mercado imobiliário?",
          source: "greeting"
        });
      }

      const ai = getAIClient();

      if (ai) {
        const prompt = `Você é a "Vivi", a mais experiente e inteligente copiloto de vendas e inteligência comercial do mercado imobiliário brasileiro, atuando no empreendimento Jardim Vivência e lançamentos imobiliários.
Seu objetivo é ajudar corretores de vendas (Hunters), líderes de equipe, gestores e coordenadores a converterem mais clientes, fecharem propostas, quebrarem objeções, elaborarem roteiros de WhatsApp magnéticos e tirarem dúvidas sobre crédito imobiliário (Caixa Econômica Federal - CEF, SBPE, Minha Casa Minha Vida - MCMV, Programa ${userCtx.nomeSubsidioEstadual || "Estadual"}, uso do FGTS, regras de Fifty/divisão de comissão e especificações técnicas do Jardim Vivência).

Conhecimento Específico Obrigatório:

1. REGRAS DE DIVISÃO DE COMISSÃO (FIFTY):
- Fifty de Plantão / Captação x Fechamento: Quando um corretor (Hunter/Captador) atrai e cadastra o lead, e outro corretor realiza o atendimento ou fechamento presencial no plantão de vendas, a comissão de intermediação é dividida em 50% para o Captador e 50% para o Fechador (Fifty).
- Prazo de Atividade de 15 Dias: O direito ao Fifty do corretor captador é válido por até 15 dias sem inatividade. Caso o lead fique mais de 15 dias sem nenhuma atualização, historico ou atendimento registrado no CRM, o lead vai para a Caixa de Resgate (Caixa de Leads) e o corretor que resgatar e fechar fica com 100% da comissão sem obrigação de Fifty.
- Parcerias com Imobiliárias Externas: Nas vendas realizadas em parceria com Imobiliárias Parceiras, a comissão destinada à imobiliária parceira obedece à regra de Fifty contratual da tabela do empreendimento.
- Sobreremuneração de Liderança: Comissões e over-riding de Gestores de Equipe e Coordenadores são pagos pela Loteadora/Incorporadora e NÃO reduzem a fatia de 50% do corretor no Fifty.
- Duplicidade e Conflito: Em caso de divergência de atendimento no mesmo CPF, o sistema gera alerta automático para validação do Coordenador com base nas datas e registros de interação.

2. FICHA TÉCNICA E DETALHES COMPLETOS DO EMPREENDIMENTO "JARDIM VIVÊNCIA":
- Total de Unidades: 877 casas isoladas (sem geminação), garantindo total privacidade e independência.
- Casas Térreas (Área Construída): 48,55m² totais (sendo 36,17m² de área interna útil da casa + 7,50m² de garagem coberta + 4,88m² de lavanderia coberta e com piso estendido).
- Acessibilidade PCD: 26 unidades passíveis de adaptação PCD, oferecidas em lotes específicos e tamanho padrão.
- Lotes: 675 unidades em Lotes Padrão de 10m x 20m (200m²) e 202 unidades em Lotes Irregulares (maiores que 200m²).
- Implantação e Possibilidade de Ampliação: Todos os lotes possuem espaço para ampliação futura permitindo a execução de um 3º Dormitório e/ou Área de Lazer/Churrasqueira. O projeto possui previsão de vão com abertura para até 1,40m e vão para porta do 3º quarto sem comprometer a estrutura.
- Projeto Arquitetônico e Conforto: Cozinha estrategicamente recuada em relação à sala (proporcionando privacidade sem perder a integração), área de convívio integrada, entrada principal recuada e coberta, fachada valorizada e amplo espaço nos fundos para quintal/lazer.
- Sistema Construtivo: Paredes de concreto moldadas no local. Vantagens: excelente conforto térmico/acústico, alto desempenho estrutural, padronização, agilidade na entrega e sustentabilidade (redução de desperdício). Sem pilares aparentes nos cômodos. Paredes internas secundárias em Drywall facilitando modificações. Pé-direito de 2,70m, paredes externas 10cm, internas 8cm, laje de 10cm e caixa d'água de 500L.
- Louças e Metais: Bacia sanitária com caixa acoplada e acionamento duplo (conservação de água), tanque em mármore sintético, lavatório suspenso no banheiro, cuba em bancada inox na cozinha. Torneiras bica alta na cozinha e banheiro, e torneira cromada na lavanderia.
- Acabamentos: Cerâmico 45x45 Ceral nos cômodos internos, revestimento cerâmico 10x20 Ceral acima da bancada da cozinha, soleiras e baguetes em granito ocre. Faixa de brita externa ao radier.
- Elétrica e Hidráulica: Previsão de infraestrutura para ar-condicionado nos dormitórios (carga no quadro, duto seco e furo para dreno), duto seco para campainha, depurador de ar, arejadores nas torneiras. Chuveiro com alta pressão.
- Infraestrutura do Loteamento: Bairro aberto planejado dividido em 6 Fases. Infraestrutura 100% pronta: água, esgoto sanitário, drenagem urbana, pavimentação asfáltica e calçamento.

Contexto do usuário:
- Nome: ${userCtx.userName || 'Corretor'}
- Cargo: ${userCtx.userRole || 'Corretor de Vendas'}
- CRECI: ${userCtx.creci || 'Não informado'}
- Modo: ${userMode}

Mensagem/Pergunta do usuário:
"${userMessage}"

Diretrizes de Resposta:
1. Responda em Português do Brasil de forma altamente prática, assertiva, motivadora e estruturada com tópicos, negritos e emojis adequados.
2. Se o usuário perguntar sobre a divisão de comissão ou Fifty, explique com clareza as regras dos 50/50, o prazo de 15 dias de atividade no CRM e a regra de resgate.
3. Se o usuário perguntar sobre o Jardim Vivência (ficha técnica, metragens, paredes de concreto, ampliação para 3º quarto, lotes 10x20, subsídios), forneça os dados exatos e argumentos matadores de venda.
4. Se o usuário pedir um roteiro/script de WhatsApp, forneça um texto pronto para copiar e colar com gatilhos mentais.`;

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
        });

        if (response.text) {
          return res.json({
            reply: response.text,
            source: "gemini-2.5-flash"
          });
        }
      }

      // High quality contextual fallback engine if Gemini API is offline/unconfigured
      const lower = userMessage.toLowerCase();
      let reply = "";

      if (lower.includes("script") || lower.includes("whatsapp") || lower.includes("mensagem") || lower.includes("abordar") || lower.includes("sumiu") || lower.includes("sumido")) {
        reply = `📋 *Script de Alto Impacto para WhatsApp*:

"Olá, tudo bem? Aqui é ${userCtx.userName || 'do time de vendas'} do **Jardim Vivência**! 🏡✨

Estava revisando as condições liberadas para o seu perfil e temos uma excelente notícia:
• **Subsídio do Governo do Paraná (${userCtx.nomeSubsidioEstadual || "Estadual"})**: Até **R$ 20.000,00** a fundo perdido
• **Subsídio Federal Minha Casa Minha Vida**: Até **R$ 55.000,00**
• **Entrada Facilitada**: Parcelamento flexível de atos e mensais direto com a loteadora
• **Utilização do FGTS**: 100% aplicável na entrada

Separei 2 lotes com topografia e localização privilegiada no condomínio. 
Você prefere vir ao plantão hoje às 15h ou amanhã pela manhã para tomarmos um café e eu te entregar a simulação impressa?"`;
      } else if (lower.includes("objeção") || lower.includes("entrada") || lower.includes("alta") || lower.includes("caro") || lower.includes("pensar")) {
        reply = `💡 *Técnicas de Quebra de Objeção para Entrada / Valor*:

1. **Validação & Empatia**:
   *"Entendo perfeitamente, o planejamento financeiro inicial é a parte mais importante para sua segurança."*

2. **Desmembramento do Fluxo (Atos + Mensais)**:
   *"No Jardim Vivência, nós não cobramos a entrada à vista! Você divide em pequenos Atos (+30 e +60 dias) e o saldo em mensais suaves que cabem com folga no seu orçamento."*

3. **Alavancagem de Subsídios & FGTS**:
   *"Você sabia que somando o ${userCtx.nomeSubsidioEstadual || "Estadual"} (R$ 20 mil) + MCMV (até R$ 55 mil) + seu FGTS, seu desembolso de entrada pode cair para quase zero?"*

4. **Pergunta de Fechamento**:
   *"Se eu encaixar a parcela mensal exatamente no valor que você já paga de aluguel, você assina a proposta hoje?"*`;
      } else if (lower.includes("casa fácil") || lower.includes("paraná") || lower.includes("subsidio") || lower.includes("subsídio") || lower.includes("mcmv") || lower.includes("fgts") || lower.includes("financiamento") || lower.includes("cef") || lower.includes("caixa")) {
        reply = `📊 *Guia Prático de Financiamento & Subsídios*:

• **${userCtx.nomeSubsidioEstadual || "Estadual"} (Cohapar)**:
  - Subsídio de **R$ 20.000,00** para famílias com renda bruta de até 3 salários mínimos (ou conforme regras vigentes).
  - Valor abatido diretamente do valor de entrada.

• **Minha Casa Minha Vida (Federal)**:
  - Subsídio de até **R$ 55.000,00** dependendo da faixa de renda familiar e município.
  - Taxas de juros reduzidas (a partir de 4,25% a.a. + TR).

• **Comprometimento de Renda CEF**:
  - A parcela máxima do financiamento não pode ultrapassar **30% da renda bruta familiar comprovada**.
  - É permitida a composição de renda entre familiares/cônjuges.

• **Uso do Saldo de FGTS**:
  - Mínimo de 3 anos de trabalho sob regime do FGTS (consecutivos ou não).
  - Pode ser utilizado integralmente para compor a entrada ou amortizar saldo devedor.`;
      } else if (lower.includes("duplicidade") || lower.includes("fifty") || lower.includes("plantão") || lower.includes("regra") || lower.includes("equipe") || lower.includes("divisão") || lower.includes("comissão")) {
        reply = `⚖️ *Regras Oficiais de Divisão de Comissão (Fifty) e Plantão*:

• **Fifty de Plantão / Captação (50% / 50%)**:
  - Quando um corretor (Hunter/Captador) atrai e cadastra o cliente, e outro corretor realiza o atendimento presencial no plantão ou fecha a venda, a comissão é dividida igualmente em **50% para o Captador e 50% para o Fechador**.

• **Prazo de Atividade de 15 Dias**:
  - O direito ao Fifty do captador é garantido por **até 15 dias** com atividade/registro recente no CRM.
  - Caso o lead permaneça inativo por mais de 15 dias (sem histórico ou retorno), ele é enviado para a **Caixa de Leads (Resgate)**. O corretor que resgatar e fechar a proposta fica com **100% da comissão** (sem obrigação de Fifty ao antigo corretor).

• **Parcerias com Imobiliárias Externas**:
  - Nas vendas em parceria com imobiliárias parceiras cadastradas, os honorários obedecem à tabela de divisão contratual do loteamento.

• **Sobreremuneração de Liderança (Líder / Coordenador)**:
  - As comissões de gestão e coordenação são pagas diretamente pela incorporadora e **não são descontadas** da fatia do corretor no Fifty.`;
      } else if (lower.includes("vivência") || lower.includes("vivencia") || lower.includes("ficha") || lower.includes("concreto") || lower.includes("ampliação") || lower.includes("ampliacao") || lower.includes("3º quarto") || lower.includes("terreno") || lower.includes("m2") || lower.includes("planta") || lower.includes("pdf")) {
        reply = `🏡 *Ficha Técnica & Treinamento Comercial — Jardim Vivência*:

• **Visão Geral das Casas**:
  - **877 casas isoladas (sem geminação)**, garantindo total privacidade e independência.
  - **Casas Térreas de 48,55m²**: sendo 36,17m² de área interna útil + 7,50m² de garagem coberta + 4,88m² de lavanderia coberta com piso estendido.
  - **Adaptação PCD**: 26 unidades preparadas para acessibilidade em lotes padrão.

• **Lotes & Possibilidade de Ampliação**:
  - **675 Lotes Padrão (10m x 20m = 200m²)** e 202 Lotes Irregulares (> 200m²).
  - **Ampliação Garantida**: Todos os lotes possuem espaço nos fundos e previsão de estrutura para execução de um **3º Dormitório** e/ou **Área de Lazer / Churrasqueira**. Vão com abertura prevista de até 1,40m e vão para porta do 3º quarto!

• **Diferenciais Construtivos & Acabamentos**:
  - **Paredes de Concreto Armado (Moldadas no Local)**: Maior conforto térmico e acústico, alta durabilidade, padronização e agilidade na entrega. Sem pilares aparentes nos cômodos!
  - **Cozinha Recuada da Sala**: Privacidade para cozinhar sem perder a integração dos ambientes.
  - **Metais & Louças**: Bacia com caixa acoplada e acionamento duplo, tanque em mármore sintético, lavatório suspenso, cuba inox na cozinha e torneiras bica alta.
  - **Elétrica & Hidráulica**: Previsão de carga no quadro, duto seco e furo para dreno para instalação de **ar-condicionado nos dormitórios**, duto seco para campainha e depurador na cozinha.

• **Infraestrutura do Bairro**:
  - Loteamento aberto planejado em 6 fases com 100% de asfalto, calçamento, rede de água, esgoto e iluminação.`;
      } else {
        reply = `👋 Olá, **${userCtx.userName || 'Corretor'}**! Como sua copiloto de vendas do **Jardim Vivência**, aqui estão as principais orientações estratégicas:

1. **Abordagem Rápida**: Responda aos novos leads em menos de 5 minutos para multiplicar a taxa de agendamento de visitas em até 7x.
2. **Utilize o Simulador Oficial**: Apresente a proposta desmembrada em Atos e Mensais, destacando os **R$ 20.000 de subsídio ${userCtx.nomeSubsidioEstadual || "Estadual"}** + MCMV.
3. **Agendamento no Plantão**: Nunca tente vender o imóvel por mensagem; venda a **visita ao plantão** com café e visualização dos lotes no mapa.

Precisa de um script específico para algum cliente ou ajuda para calcular um fluxo? Me diga qual é a situação do cliente!`;
      }

      res.json({
        reply,
        source: "expert_real_estate_engine"
      });
    } catch (error: any) {
      console.error("Vivi AI Error:", error);
      res.json({
        reply: `💡 *Dica da Vivi*: Ao negociar com o cliente, foque em apresentar a entrada facilitada em Atos (+30 e +60 dias) e o aproveitamento dos subsídios estaduais (${userCtx.nomeSubsidioEstadual || "Estadual"} R$ 20 mil) e federais (MCMV). Agende a visita ao plantão para fechar a reserva!`,
        source: "offline_fallback"
      });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Jardim Vivência Server running on http://localhost:${PORT}`);
  });
}

startServer();
