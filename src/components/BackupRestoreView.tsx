import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Database,
  Download,
  Upload,
  RotateCcw,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  FileJson,
  Trash2,
  Users,
  Building,
  Check,
  Flame,
  RefreshCw,
} from 'lucide-react';
import { FirebaseConnectionStatus } from './FirebaseConnectionStatus';

export const BackupRestoreView: React.FC = () => {
  const {
    units,
    leads,
    attendances,
    scales,
    visits,
    commissions,
    tasks,
    teams,
    users,
    settings,
    resetToInitialData,
    resetCategoryData,
    logAction,
  } = useApp();

  const [restoreSuccess, setRestoreSuccess] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  const handleDownloadBackup = () => {
    const fullBackup = {
      backupDate: new Date().toISOString(),
      version: '1.0.0',
      empreendimento: 'Jardim Vivência',
      data: {
        units,
        leads,
        attendances,
        scales,
        visits,
        commissions,
        tasks,
        teams,
        settings,
      },
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(fullBackup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `backup_jardim_vivencia_${new Date().toISOString().split('T')[0]}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    logAction('Backup Exportado', 'Sistema', 'Download do snapshot completo do banco de dados.');
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed.data && parsed.data.units) {
            localStorage.setItem('jv_units', JSON.stringify(parsed.data.units));
            localStorage.setItem('jv_leads', JSON.stringify(parsed.data.leads || []));
            localStorage.setItem('jv_commissions', JSON.stringify(parsed.data.commissions || []));
            localStorage.setItem('jv_settings', JSON.stringify(parsed.data.settings || {}));

            setRestoreSuccess(true);
            logAction('Backup Restaurado', 'Sistema', 'Dados restaurados com sucesso a partir de arquivo JSON.');
            setTimeout(() => {
              window.location.reload();
            }, 1500);
          } else {
            setRestoreError('Arquivo de backup inválido ou incompatível.');
          }
        } catch (err) {
          setRestoreError('Erro ao decodificar JSON do arquivo de backup.');
        }
      };
    }
  };

  const handleFactoryReset = () => {
    if (
      window.confirm(
        'ATENÇÃO: Deseja redefinir todo o sistema para o estado original de fábrica com as 877 unidades geradas do Jardim Vivência?'
      )
    ) {
      resetToInitialData();
      logAction('Restauração de Fábrica', 'Sistema', 'Reset completo do banco para dados padrão.');
      window.location.reload();
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Backup e Restauração de Dados</h1>
            <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
              Exclusivo Administrador
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-0.5">
            Segurança, snapshots completos das 877 unidades, leads, vendas e logs do Jardim Vivência.
          </p>
        </div>
      </div>

      {restoreSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs text-emerald-900 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Backup restaurado com sucesso! O aplicativo será recarregado em instantes...</span>
        </div>
      )}

      {restoreError && (
        <div className="p-4 bg-red-50 border border-red-300 rounded-2xl text-xs text-red-900 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{restoreError}</span>
        </div>
      )}

      {/* Diagnóstico em Tempo Real do Firebase Cloud */}
      <FirebaseConnectionStatus variant="card" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900">Exportar Backup Completo (JSON)</h3>
            <p className="text-xs text-slate-500 mt-1">
              Baixa um arquivo JSON seguro com o estado atual de todas as 877 unidades, cadastros do CRM, comissões e histórico da roleta.
            </p>
          </div>
          <button
            onClick={handleDownloadBackup}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Baixar Arquivo de Backup</span>
          </button>
        </div>

        {/* Import Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900">Restaurar a Partir de Arquivo</h3>
            <p className="text-xs text-slate-500 mt-1">
              Faça upload de um arquivo de backup exportado anteriormente para restabelecer os dados no sistema.
            </p>
          </div>
          <label className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors cursor-pointer">
            <FileJson className="w-4 h-4" />
            <span>Selecionar Arquivo .JSON</span>
            <input type="file" accept=".json" onChange={handleRestoreFile} className="hidden" />
          </label>
        </div>
      </div>

      {/* Factory Reset Box */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-rose-200 dark:border-rose-900/60 shadow-xs space-y-4">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-rose-950 dark:text-rose-200">Redefinir Dados de Fábrica (Dados Padrão do Loteamento)</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Esta ação restaura as <b>877 unidades completas do Jardim Vivência</b> com seus valores padrão e recalcula os grupos de lançamento.
            </p>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={handleFactoryReset}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restaurar Base Padrão de 877 Unidades</span>
          </button>
        </div>
      </div>

      {/* Modular Category Wipe & Clean Slate Reset (User Requested) */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Central de Zeramento e Recomeço de Cadastros</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Escolha limpar categorias específicas isoladamente ou zerar a aplicação por completo para configurá-la do seu jeito.
              </p>
            </div>
          </div>
        </div>

        {/* Individual Category Wipe Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Wipe Leads */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-sky-400" /> Clientes & Leads
                </span>
                <span className="text-[10px] bg-slate-700 text-slate-300 font-extrabold px-2 py-0.5 rounded-md">
                  {leads.length} cadastros
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Remove todos os clientes do CRM, histórico de contatos e movimentações do funil.
              </p>
            </div>
            <button
              onClick={() => {
                if (window.confirm('Deseja realmente zerar TODOS os cadastros de clientes/leads? Esta ação é irreversível.')) {
                  resetCategoryData('leads');
                  alert('Cadastros de clientes zerados com sucesso!');
                }
              }}
              className="w-full flex items-center justify-center gap-1.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Zerar Apenas Clientes</span>
            </button>
          </div>

          {/* Wipe Mirror Lots */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-emerald-400" /> Lotes / Espelho
                </span>
                <span className="text-[10px] bg-slate-700 text-slate-300 font-extrabold px-2 py-0.5 rounded-md">
                  {units.length} unidades
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Remove todos os lotes e unidades do espelho para que você possa cadastrar ou importar o seu empreendimento do zero.
              </p>
            </div>
            <button
              onClick={() => {
                if (window.confirm('Deseja realmente zerar TODAS as unidades do Espelho de Vendas? Você poderá importar ou cadastrar suas próprias unidades.')) {
                  resetCategoryData('units');
                  alert('Espelho de vendas zerado! Agora você pode cadastrar suas unidades.');
                }
              }}
              className="w-full flex items-center justify-center gap-1.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Zerar Apenas Lotes</span>
            </button>
          </div>

          {/* Wipe Users / Team */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-purple-400" /> Equipe & Corretores
                </span>
                <span className="text-[10px] bg-slate-700 text-slate-300 font-extrabold px-2 py-0.5 rounded-md">
                  {users.length} usuários
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Remove a lista de corretores e equipes de vendas, mantendo seu usuário administrador ativo.
              </p>
            </div>
            <button
              onClick={() => {
                if (window.confirm('Deseja zerar a equipe de corretores? Seu usuário administrador será preservado.')) {
                  resetCategoryData('users');
                  alert('Lista de corretores zerada! Preservado usuário admin.');
                }
              }}
              className="w-full flex items-center justify-center gap-1.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Zerar Apenas Corretores</span>
            </button>
          </div>
        </div>

        {/* Complete Clean Slate Reset (Total Wipe) */}
        <div className="border-t border-slate-800 pt-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-0.5">
            <h4 className="text-sm font-extrabold text-rose-400 flex items-center gap-2">
              <Flame className="w-4 h-4" /> RECOMEÇAR TUDO DO ZERO (RESET TOTAL)
            </h4>
            <p className="text-xs text-slate-400">
              Esvazia a base de dados inteira (clientes, lotes, tarefas, histórico e corretores). Deixa o app totalmente limpo para você estruturar seu próprio projeto.
            </p>
          </div>

          <button
            onClick={() => {
              const confirmInput = window.prompt(
                '⚠️ ATENÇÃO MÁXIMA: Esta ação irá ZERAR COMPLETAMENTE todos os clientes, unidades, comissões e histórico para que você comece 100% do zero.\n\nDigite CONFIRMAR para prosseguir:'
              );
              if (confirmInput === 'CONFIRMAR') {
                resetCategoryData('all');
                alert('🚀 Aplicação zerada com sucesso! Você agora pode cadastrar tudo do seu jeito.');
              } else if (confirmInput !== null) {
                alert('Ação cancelada. A palavra de confirmação não foi digitada corretamente.');
              }
            }}
            className="w-full md:w-auto shrink-0 flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-xs font-black bg-rose-600 hover:bg-rose-500 text-white shadow-lg transition-all active:scale-95 cursor-pointer"
          >
            <Flame className="w-4 h-4" />
            <span>Zerar Aplicação e Recomeçar do Zero</span>
          </button>
        </div>
      </div>
    </div>
  );
};
