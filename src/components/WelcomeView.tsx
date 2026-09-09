import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Sparkles,
  ArrowRight,
  Kanban,
  Calculator,
  Building,
  MapPin,
  DollarSign,
  Bot,
  Users,
  CheckCircle2,
  TrendingUp,
  Award,
  Zap,
  ChevronRight,
  ShieldCheck,
  Flame,
  FileSpreadsheet
} from 'lucide-react';

export const WelcomeView: React.FC = () => {
  const { currentUser, leads, units, commissions, setActiveTab, settings } = useApp();

  const totalLeads = leads.length;
  const leadsEmNegociacao = leads.filter(
    (l) => l.status === 'agendado_plantao' || l.status === 'em_atendimento' || l.status === 'analise_credito_cef' || l.status === 'proposta_enviada'
  ).length;
  const contratosAssinados = leads.filter((l) => l.status === 'contrato_assinado').length;
  
  const vgvTotal = leads
    .filter((l) => l.status === 'contrato_assinado' || l.status === 'proposta_enviada')
    .reduce((acc, l) => acc + (l.valorSimulacao || 210000), 0);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="p-4 lg:p-8 space-y-8 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-emerald-950 to-teal-900 text-white p-6 sm:p-10 shadow-2xl border border-emerald-500/20">
        {/* Background Decorative Glow Elements */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6 max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>CRM Imobiliário de Alta Performance & Alta Conversão</span>
          </div>

          <div className="space-y-3">
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-white">
              Bem-vindo ao <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 bg-clip-text text-transparent">OTS Master CRM</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal max-w-3xl">
              O melhor e mais completo CRM imobiliário do Mercado! Projetado para acelerar seu ciclo de vendas, centralizando a esteira de atração de leads, simulação de crédito CEF, espelho de vendas 3D, mapa de bairros e inteligência comercial da Vivi IA.
            </p>
          </div>

          {/* Main Prominent Call-to-Action Button */}
          <div className="pt-2 flex flex-wrap items-center gap-4">
            <button
              id="btn-welcome-start-selling"
              onClick={() => setActiveTab('kanban')}
              className="px-6 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm sm:text-base flex items-center gap-3 shadow-xl shadow-emerald-500/30 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer group"
            >
              <Zap className="w-5 h-5 text-slate-950 fill-slate-950 group-hover:animate-bounce" />
              <span>🚀 CLIQUE AQUI PARA COMEÇAR A VENDER!</span>
              <ArrowRight className="w-5 h-5 text-slate-950 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => setActiveTab('simulador')}
              className="px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold text-xs sm:text-sm flex items-center gap-2 backdrop-blur-md transition-all cursor-pointer"
            >
              <Calculator className="w-4 h-4 text-emerald-300" />
              <span>Simulador Caixa & Subsídios</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-800">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Total de Leads</span>
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{totalLeads}</span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block mt-0.5">Em carteira ativa</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 border border-teal-200 dark:border-teal-800">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Em Atendimento</span>
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{leadsEmNegociacao}</span>
            <span className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold block mt-0.5">Pipeline aquecido</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-200 dark:border-cyan-800">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Contratos Assinados</span>
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{contratosAssinados}</span>
            <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-semibold block mt-0.5">Vendas fechadas</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-200 dark:border-indigo-800">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">VGV em Carteira</span>
            <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white truncate block max-w-[140px]">
              {formatCurrency(vgvTotal)}
            </span>
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold block mt-0.5">Empreendimento Vivo</span>
          </div>
        </div>
      </div>

      {/* Presentation of Core Modules */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Recursos do Melhor CRM Imobiliário</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Navegue pelos módulos estratégicos desenvolvidos para alta conversão comercial.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Module 1: Kanban Funnel */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-500 dark:hover:border-emerald-500 transition-all group flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
                <Kanban className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Funil de Vendas Kanban</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Visualização clara do fluxo comercial: desde a atração inicial de leads, agendamento de visita no plantão, até análise CEF e assinatura de contrato.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('kanban')}
              className="mt-5 w-full py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center justify-between transition-colors"
            >
              <span>Acessar Kanban</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Module 2: CEF Simulator */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-500 dark:hover:border-emerald-500 transition-all group flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-200 dark:border-teal-800">
                <Calculator className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Simulador Caixa & Subsídios</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Cálculo de financiamento Caixa com abatimento instantâneo de R$ 20.000 do Subsídio Estadual, MCMV e parcelamento de entrada em Atos.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('simulador')}
              className="mt-5 w-full py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-teal-600 hover:text-white dark:hover:bg-teal-600 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center justify-between transition-colors"
            >
              <span>Acessar Simulador</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Module 3: Sales Mirror */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-500 dark:hover:border-emerald-500 transition-all group flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-950/80 text-cyan-600 dark:text-cyan-400 flex items-center justify-center border border-cyan-200 dark:border-cyan-800">
                <Building className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Espelho de Vendas 3D</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Mapa e lista de disponibilidade de unidades em tempo real. Reserve lotes ou casas e monte propostas diretamente no plantão.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('espelho_vendas')}
              className="mt-5 w-full py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-cyan-600 hover:text-white dark:hover:bg-cyan-600 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center justify-between transition-colors"
            >
              <span>Acessar Espelho 3D</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Module 4: Geographic Map */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-500 dark:hover:border-emerald-500 transition-all group flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Origem por Bairro</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Análise de inteligência comercial mostrando de onde vêm os clientes compradores e a distribuição de VGV por bairro e região.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('mapa_bairros')}
              className="mt-5 w-full py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center justify-between transition-colors"
            >
              <span>Ver Mapa de Origem</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Module 5: Commissions & Fifty */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-500 dark:hover:border-emerald-500 transition-all group flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-800">
                <DollarSign className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Comissões & Regras de Fifty</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Gestão transparente de comissões com divisão 50/50 entre captadores e fechadores, controle de prazo de 15 dias de inatividade e extratos.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('comissoes')}
              className="mt-5 w-full py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-600 hover:text-white dark:hover:bg-amber-600 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center justify-between transition-colors"
            >
              <span>Ver Comissões</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Module 6: Vivi AI */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-purple-500 dark:hover:border-purple-500 transition-all group flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-200 dark:border-purple-800">
                <Bot className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Vivi — IA de Vendas</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Sua copiloto de inteligência de vendas com treinamento completo do Jardim Vivência, geradora de scripts de WhatsApp e especialista em Fifty.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('vivi')}
              className="mt-5 w-full py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-purple-600 hover:text-white dark:hover:bg-purple-600 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center justify-between transition-colors"
            >
              <span>Falar com Vivi IA</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
