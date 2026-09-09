import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SimulatorPolicyRule } from '../types';
import {
  Calculator,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Edit2,
  RotateCcw,
  Sparkles,
  Layers,
  ArrowRight,
  Landmark,
  Percent,
  Calendar,
  Check,
  Building2,
} from 'lucide-react';

export const SimulatorRulesView: React.FC = () => {
  const {
    simulatorPolicyRules,
    updateSimulatorPolicyRule,
    resetSimulatorPolicyRules,
    currentUser,
    setActiveTab,
    settings,
  } = useApp();

  const [editingRule, setEditingRule] = useState<SimulatorPolicyRule | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const openEditModal = (rule: SimulatorPolicyRule) => {
    setEditingRule(rule);
    setEditValue(String(rule.valorAtual));
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRule) return;

    const numVal = Number(editValue);
    const finalVal = !isNaN(numVal) && editValue.trim() !== '' ? numVal : editValue;

    updateSimulatorPolicyRule(editingRule.id, {
      valorAtual: finalVal,
    });

    setFeedback(`Parâmetro "${editingRule.titulo}" atualizado com sucesso!`);
    setEditingRule(null);
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleReset = () => {
    if (confirm('Deseja restaurar todas as regras do simulador para os valores oficiais da Caixa e ' + (settings?.nomeSubsidioEstadual || "Estadual") + '?')) {
      resetSimulatorPolicyRules();
      setFeedback('Regras restauradas para os padrões oficiais.');
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const getCategoryBadge = (cat: SimulatorPolicyRule['categoria']) => {
    switch (cat) {
      case 'subsidio':
        return { label: 'Subsídios & Programas', color: 'bg-emerald-50 text-emerald-800 border-emerald-300' };
      case 'cef':
        return { label: 'Caixa Econômica (CEF)', color: 'bg-blue-50 text-blue-800 border-blue-300' };
      case 'atos':
        return { label: 'Estrutura de Atos', color: 'bg-amber-50 text-amber-900 border-amber-300' };
      case 'mensais':
        return { label: 'Mensais & Balões', color: 'bg-purple-50 text-purple-800 border-purple-300' };
      case 'limites':
      default:
        return { label: 'Limitadores de Renda & Grupos', color: 'bg-slate-50 text-slate-800 border-slate-300' };
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 bg-emerald-50 text-emerald-700 rounded-xl dark:bg-emerald-950/50 dark:text-emerald-300">
              <Calculator className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Regras Oficiais do Simulador</h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Parâmetros de cálculo de financiamento, subsídios {settings?.nomeSubsidioEstadual || "Estadual"}, gestão CEF, fluxo de atos e mensais idênticos à planilha oficial.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {currentUser.role === 'admin' && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar Padrões Oficiais</span>
            </button>
          )}

          <button
            id="btn-ir-para-simulador"
            onClick={() => setActiveTab('simulador')}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-sm"
          >
            <span>Abrir Simulador de Vendas</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-4 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Official Guidelines Callout */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white p-6 rounded-2xl border border-slate-700 shadow-md">
        <div className="flex items-center gap-2 text-emerald-400 font-bold text-base mb-3">
          <FileSpreadsheet className="w-5 h-5" />
          <span>Fórmulas e Validações Idênticas à Planilha Oficial do Jardim Vivência</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
          <div className="bg-white/5 p-4 rounded-xl border border-white/10">
            <h4 className="font-bold text-white text-sm mb-1 flex items-center gap-1.5">
              <Landmark className="w-4 h-4 text-emerald-400" />
              <span>1. Gestão CEF & Crédito</span>
            </h4>
            <p className="leading-relaxed">
              O total da entrada necessária é calculado por: <br />
              <code className="text-emerald-300 font-mono text-[11px]">
                (Valor do Lote + R$ 3.500 Taxa CEF) - (Financiamento + FGTS + Subsídios)
              </code>
            </p>
          </div>

          <div className="bg-white/5 p-4 rounded-xl border border-white/10">
            <h4 className="font-bold text-white text-sm mb-1 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-sky-400" />
              <span>2. Cronograma dos 3 Atos</span>
            </h4>
            <p className="leading-relaxed">
              • <strong>Ato 1</strong>: No fechamento da proposta <br />
              • <strong>Ato 2</strong>: +30 dias após Ato 1 <br />
              • <strong>Ato 3</strong>: +60 dias após Ato 1 <br />
              • <strong>Mensais</strong>: Iniciam 90 dias após Ato 1 no dia de corte
            </p>
          </div>

          <div className="bg-white/5 p-4 rounded-xl border border-white/10">
            <h4 className="font-bold text-white text-sm mb-1 flex items-center gap-1.5">
              <Percent className="w-4 h-4 text-amber-400" />
              <span>3. Limitadores e Grupos</span>
            </h4>
            <p className="leading-relaxed">
              • <strong>Grupo A</strong>: Renda até R$ 2.640,00 <br />
              • <strong>Grupo B</strong>: Renda de R$ 2.640 a R$ 4.400,00 <br />
              • <strong>Comprometimento Máximo</strong>: Parcela ≤ 30% da renda comprovada
            </p>
          </div>
        </div>
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {simulatorPolicyRules.map((rule) => {
          const badge = getCategoryBadge(rule.categoria);
          return (
            <div
              key={rule.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between shadow-2xs hover:border-slate-300 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold border ${badge.color}`}>
                    {badge.label}
                  </span>

                  {currentUser.role === 'admin' && (
                    <button
                      onClick={() => openEditModal(rule)}
                      className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Editar</span>
                    </button>
                  )}
                </div>

                <h3 className="font-bold text-slate-900 dark:text-white text-base mb-1.5">
                  {rule.titulo}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                  {rule.descricao}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">Valor em Vigor no Sistema:</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg">
                  {rule.unidade === 'R$'
                    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(rule.valorAtual))
                    : `${rule.valorAtual} ${rule.unidade || ''}`}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Rule Modal */}
      {editingRule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Editar Parâmetro do Simulador
              </h2>
              <button
                onClick={() => setEditingRule(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                  Regra Selecionada
                </label>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm font-bold text-slate-900 dark:text-white">
                  {editingRule.titulo}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Novo Valor {editingRule.unidade ? `(${editingRule.unidade})` : ''} *
                </label>
                <input
                  type="text"
                  required
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingRule(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-sm transition-colors"
                >
                  Confirmar Alteração
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
