import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import Markdown from 'react-markdown';
import {
  FileText,
  ShieldCheck,
  Clock,
  Dices,
  CheckCircle2,
  AlertTriangle,
  Users,
  Award,
  Sparkles,
  Edit3,
  Save,
  RotateCcw,
  Copy,
  ClipboardPaste,
  Sliders,
  Inbox,
  Check,
} from 'lucide-react';

export const ShiftRulesView: React.FC = () => {
  const {
    settings,
    updateShiftRulesText,
    updateSettings,
    currentUser,
    logAction,
  } = useApp();

  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(settings.regrasPlantaoTexto || '');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'info'; message: string } | null>(null);

  // Policy form state
  const [diasLimite, setDiasLimite] = useState(settings.diasLimiteAtividadeLead || 15);
  const [regraDuplicidade, setRegraDuplicidade] = useState(settings.regraDuplicidadePlantao || 'fifty_obrigatorio');
  const [acaoInativo, setAcaoInativo] = useState(settings.acaoLeadInativo || 'caixa_de_leads');

  const canEdit = currentUser.role === 'admin' || currentUser.role === 'coordenador' || currentUser.role === 'gestor';

  const handleStartEdit = () => {
    setEditedText(settings.regrasPlantaoTexto || '');
    setIsEditing(true);
  };

  const handleSaveText = () => {
    updateShiftRulesText(editedText);
    setIsEditing(false);
    setFeedback({ type: 'success', message: 'Regras do plantão atualizadas com sucesso!' });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleSavePolicyParameters = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      diasLimiteAtividadeLead: Number(diasLimite),
      regraDuplicidadePlantao: regraDuplicidade,
      acaoLeadInativo: acaoInativo,
    });
    setFeedback({ type: 'success', message: 'Parâmetros de Duplicidade e Fifty salvos com sucesso!' });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(settings.regrasPlantaoTexto || '');
      setFeedback({ type: 'info', message: 'Texto das regras copiado para a área de transferência!' });
      setTimeout(() => setFeedback(null), 3000);
    } catch {
      // Fallback
    }
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setEditedText(text);
        setFeedback({ type: 'info', message: 'Conteúdo colado da área de transferência!' });
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch {
      alert('Permissão de colar bloqueada pelo navegador. Você pode colar manualmente com Ctrl+V na caixa de texto.');
    }
  };

  const handleResetDefault = () => {
    if (window.confirm('Deseja restaurar as regras padrão do Jardim Vivência?')) {
      const defaultText = `## 📌 REGRAS OFICIAIS DO PLANTÃO DE VENDAS

### 1. Horários, Check-in e Pontualidade
- **Turno Manhã:** Início às 08h00 com encerramento às 13h00. Tolerância máxima de 15 minutos (08h15).
- **Turno Tarde:** Início às 13h00 com encerramento às 18h00. Tolerância máxima de 15 minutos (13h15).
- **Turno Integral:** Finais de semana e feriados (08h00 às 18h00).
- O corretor que chegar após a tolerância terá status **"Atrasado"** e entrará automaticamente no **final da fila da Roleta**.

### 2. Funcionamento da Roleta da Vez
- **Sorteio Inicial:** Às 08h15 / 13h15 é executado o embaralhamento e sorteio inicial dos corretores presentes.
- **Atendimento:** O cliente espontâneo que entra na recepção ("Porta Plantão") pertence ao corretor na **Posição #1 (Vez)**.
- **Passar a Vez:** Ao ser chamado pela roleta e assumir o cliente na maquete, o corretor vai automaticamente para o **final da fila**.
- **Cliente Agendado:** Cliente agendado previamente com comprovação no CRM não consome a vez da roleta.

### 3. Regras de Atendimento em Duplicidade & Fifty (50% / 50%)
- **Atendimento Ativo (Prazo de até 15 dias):** Será considerado em atendimento ativo se o corretor registrou contato nos últimos 15 dias. Caso o cliente retorne ao plantão e seja atendido por outro corretor, haverá **Fifty obrigatório (50% da comissão para cada corretor)**.
- **Lead Inativo (Mais de 15 dias sem atividade):** Caso o corretor esteja há mais de 15 dias sem registrar qualquer atividade ou contato no CRM, **perderá o direito a Fifty**.
- **Destino do Lead Inativo:** O lead será retirado do corretor anterior e enviado para a **"Caixa de Leads"** para resgate livre por corretores online, ou transferido para o corretor que realizou o novo atendimento.
- **Alerta de Auditoria & Notificação Imediata:** Sempre que houver tentativa de cadastrar lead já existente no sistema, o CRM registrará o evento na auditoria e notificará imediatamente o Coordenador e o Gestor da equipe para ciência e validação de Fifty.

### 4. Caixa de Leads & Resgate
- Todo corretor online no plantão pode acessar a **Caixa de Leads** e resgatar clientes inativos.
- Ao assumir o lead, o corretor tem acesso a todo o histórico de interações anteriores para continuar a negociação e reativar o cliente.

### 5. Padrão de Apresentação e Simulação
- Todo corretor deve utilizar o **Simulador Oficial** para apresentar as parcelas e subsídios (${settings?.nomeSubsidioEstadual || "Estadual"} R$ 20.000 + MCMV).
- Uso obrigatório de crachá e traje profissional durante todo o período do plantão.`;
      setEditedText(defaultText);
      updateShiftRulesText(defaultText);
      setIsEditing(false);
      setFeedback({ type: 'success', message: 'Regras restauradas para o modelo padrão oficial.' });
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Regras Oficiais do Plantão
            </h1>
            <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              {settings.nomeEmpreendimento || 'Jardim Vivência'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Manual de conduta, roleta, pontualidade, atendimento em duplicidade, Fifty e Caixa de Leads.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCopyText}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
            title="Copiar texto das regras"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copiar Regras</span>
          </button>

          {canEdit && !isEditing && (
            <button
              id="btn-edit-shift-rules"
              onClick={handleStartEdit}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Digitar / Colar Regras</span>
            </button>
          )}
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2 border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
              : 'bg-sky-50 dark:bg-sky-950/60 text-sky-900 dark:text-sky-200 border-sky-200 dark:border-sky-800'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Interactive Duplicity & Fifty Parameter Config Card */}
      {canEdit && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 rounded-lg">
                <Sliders className="w-4 h-4" />
              </span>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Configurações do Sistema de Duplicidade, Fifty & Caixa de Leads
              </h2>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">Aplicado automaticamente no CRM</span>
          </div>

          <form onSubmit={handleSavePolicyParameters} className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Prazo de Atendimento Ativo (dias):
              </label>
              <input
                type="number"
                min="1"
                max="90"
                value={diasLimite}
                onChange={(e) => setDiasLimite(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-[11px] text-slate-500">
                Contato feito até este limite garante Fifty ao corretor anterior.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Política de Duplicidade no Plantão:
              </label>
              <select
                value={regraDuplicidade}
                onChange={(e) => setRegraDuplicidade(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
              >
                <option value="fifty_obrigatorio">Fifty Obrigatório (50% / 50%)</option>
                <option value="sem_fifty_novo_corretor">Sem Fifty (100% Corretor Atual)</option>
                <option value="manter_corretor_original">Manter 100% Corretor Original</option>
              </select>
              <p className="text-[11px] text-slate-500">Divisão de comissão em atendimento duplo.</p>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Ação quando Lead Exceder Prazo:
              </label>
              <div className="flex gap-2">
                <select
                  value={acaoInativo}
                  onChange={(e) => setAcaoInativo(e.target.value as any)}
                  className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="caixa_de_leads">Enviar p/ Caixa de Leads</option>
                  <option value="transferir_corretor">Transferência Direta</option>
                  <option value="notificar_apenas">Apenas Notificar Gestor</option>
                </select>
                <button
                  type="submit"
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-xs transition-colors shrink-0"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Salvar</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-500">Destino do lead estagnado sem contato.</p>
            </div>
          </form>
        </div>
      )}

      {/* Editor or View Mode */}
      {isEditing ? (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border-2 border-emerald-500 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-emerald-600" />
                <span>Editar Caixa de Texto das Regras do Plantão</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Digite livremente ou cole o regulamento interno da imobiliária/construtora (Markdown suportado).
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePasteClipboard}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs flex items-center gap-1 transition-colors"
                title="Colar texto da área de transferência"
              >
                <ClipboardPaste className="w-3.5 h-3.5" />
                <span>Colar da Área de Transferência</span>
              </button>

              <button
                type="button"
                onClick={handleResetDefault}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 font-semibold rounded-xl text-xs flex items-center gap-1 transition-colors"
                title="Restaurar padrão"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restaurar Padrão</span>
              </button>
            </div>
          </div>

          <textarea
            id="textarea-shift-rules"
            rows={18}
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            placeholder="Digite ou cole aqui as regras de plantão..."
            className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none leading-relaxed"
          />

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSaveText}
              className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Regras no Aplicativo</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="markdown-body prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 text-xs sm:text-sm leading-relaxed">
            <Markdown>{settings.regrasPlantaoTexto || 'Nenhuma regra cadastrada no momento.'}</Markdown>
          </div>
        </div>
      )}
    </div>
  );
};
