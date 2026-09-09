import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Copy,
  Check,
  MessageSquare,
  Flame,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export const ViviAssistant: React.FC = () => {
  const { currentUser, settings } = useApp();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: `👋 Olá, **${currentUser.name}**! Eu sou a **Vivi**, sua assistente especialista em vendas, estratégias comerciais, financiamentos e negociação do **mercado imobiliário**.

Como posso te ajudar hoje a fechar mais negócios?
- Gerar scripts magnéticos para WhatsApp e redes sociais
- Quebrar objeções de entrada, valor ou financiamento
- Estratégias de captação, follow-up e fechamento
- Esclarecer dúvidas sobre crédito imobiliário, SBPE, FGTS e mercado`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<'todos' | 'scripts' | 'objecoes' | 'financiamento' | 'regras'>('todos');

  const categoryPrompts = {
    scripts: [
      'Criar script de WhatsApp para lead que sumiu após a visita',
      'Script de reativação para cliente indeciso com simulação pronta',
      'Mensagem magnética de convite para café no plantão de vendas',
      'Texto de follow-up pós-simulação destacando R$ 20.000 de subsídio',
    ],
    objecoes: [
      'Como quebrar a objeção: "Achei a entrada inicial um pouco alta"',
      'Como responder: "Vou esperar os juros caírem para comprar"',
      'Como contornar: "Preciso falar com meu cônjuge antes de decidir"',
      'Técnicas para fechar na hora o cliente que quer "pensar mais"',
    ],
    financiamento: [
      'Como funciona o subsídio ' + (settings?.nomeSubsidioEstadual || "Estadual") + ' de R$ 20.000?',
      'Como calcular o comprometimento de 30% de renda para a Caixa (CEF)?',
      'Regras para utilização do saldo de FGTS na entrada e parcelas',
      'Diferença entre composição de renda familiar e renda individual',
    ],
    regras: [
      'Quais são as regras de Fifty e prazo de 15 dias de inatividade?',
      'Qual a Ficha Técnica das Casas do Jardim Vivência (877 unidades, 48.55m²)?',
      'Como funciona a ampliação para 3º quarto e área de lazer?',
      'Quais as vantagens das paredes de concreto moldadas no local?',
    ],
  };

  const currentPrompts = selectedCategory === 'todos'
    ? [
        'Quais são as regras de Fifty e divisão de comissão (50/50)?',
        'Qual a Ficha Técnica das Casas do Jardim Vivência (877 unidades, 48.55m²)?',
        'Como funciona o subsídio ' + (settings?.nomeSubsidioEstadual || "Estadual") + ' de R$ 20.000?',
        'Criar script de WhatsApp para agendar visita no plantão',
      ]
    : categoryPrompts[selectedCategory] || [];

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputMessage;
    if (!query.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      role: 'user',
      content: query.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const response = await fetch('/api/ai/vivi-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query.trim(),
          prompt: query.trim(),
          query: query.trim(),
          userContext: {
            userName: currentUser.name,
            userRole: currentUser.role,
            creci: currentUser.creci,
            nomeSubsidioEstadual: settings?.nomeSubsidioEstadual || 'Estadual',
          },
          context: {
            userName: currentUser.name,
            userRole: currentUser.role,
            creci: currentUser.creci,
          },
        }),
      });

      const data = await response.json();

      const botMsg: ChatMessage = {
        id: String(Date.now() + 1),
        role: 'assistant',
        content: data.reply || 'Desculpe, tive um imprevisto ao processar a resposta. Tente novamente!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
      const errorMsg: ChatMessage = {
        id: String(Date.now() + 1),
        role: 'assistant',
        content:
          '💡 *Dica da Vivi*: Ao abordar o cliente, lembre-se de enfatizar que o **Jardim Vivência** conta com **R$ 20.000 de subsídio do ' + (settings?.nomeSubsidioEstadual || "Estadual") + '** somado ao **subsídio federal do Minha Casa Minha Vida (até R$ 55.000)**, reduzindo drasticamente a entrada!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: `👋 Olá, **${currentUser.name}**! Eu sou a **Vivi**, sua assistente especialista em vendas, estratégias comerciais, financiamentos e negociação do **mercado imobiliário**.

Como posso te ajudar hoje a fechar mais negócios?
- Gerar scripts magnéticos para WhatsApp e redes sociais
- Quebrar objeções de entrada, valor ou financiamento
- Estratégias de captação, follow-up e fechamento
- Esclarecer dúvidas sobre crédito imobiliário, SBPE, FGTS e mercado`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-5xl mx-auto flex flex-col h-[calc(100vh-5rem)]">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-4 lg:p-5 rounded-2xl border border-slate-200 shadow-xs shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900">Vivi — Inteligência de Vendas</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                Online
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Copiloto de captação, quebra de objeções, subsídios e propostas para o Jardim Vivência.
            </p>
          </div>
        </div>

        <button
          onClick={handleResetChat}
          className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          title="Reiniciar conversa"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Nova Conversa</span>
        </button>
      </div>

      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 shrink-0">
        {[
          { id: 'todos', label: '⭐ Principais Dúvidas' },
          { id: 'scripts', label: '💬 Scripts WhatsApp' },
          { id: 'objecoes', label: '🛡️ Quebra de Objeções' },
          { id: 'financiamento', label: '💰 Financiamento & Subsídios' },
          { id: 'regras', label: '⚖️ Regras & Fifty' },
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id as any)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap ${
              selectedCategory === cat.id
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Chat Messages */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 overflow-y-auto space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  isUser ? 'bg-slate-900 text-white' : 'bg-emerald-600 text-white'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[80%] rounded-2xl p-4 text-xs leading-relaxed space-y-2 relative group ${
                  isUser
                    ? 'bg-slate-900 text-white rounded-tr-none'
                    : 'bg-slate-50 border border-slate-200/80 text-slate-800 rounded-tl-none'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] opacity-60 mb-1">
                  <span>{isUser ? currentUser.name : 'Vivi AI'}</span>
                  <span>{msg.timestamp}</span>
                </div>

                <div className="markdown-body">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>

                {!isUser && (
                  <button
                    onClick={() => handleCopy(msg.id, msg.content)}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/80 hover:bg-white text-slate-600 shadow-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Copiar mensagem"
                  >
                    {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
              <Bot className="w-4 h-4 animate-bounce" />
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-100 border border-slate-200 text-xs text-slate-500 rounded-tl-none flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
              <span>Vivi está formulando o script ideal...</span>
            </div>
          </div>
        )}
      </div>

      {/* Quick Prompts */}
      <div className="flex gap-2 overflow-x-auto pb-1 shrink-0">
        {currentPrompts.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(prompt)}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-900 border border-slate-200 text-[11px] font-medium text-slate-700 whitespace-nowrap transition-colors"
          >
            💡 {prompt}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder={`Pergunte à Vivi sobre cálculos, scripts de WhatsApp, ${settings?.nomeSubsidioEstadual || "Estadual"} ou quebra de objeções...`}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            disabled={loading}
            className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-slate-800 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || loading}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Enviar</span>
          </button>
        </form>
      </div>
    </div>
  );
};
