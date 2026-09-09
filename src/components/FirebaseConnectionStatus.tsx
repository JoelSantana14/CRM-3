import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Database,
  Key,
  Server,
  HardDrive,
  Copy,
  Check,
  ShieldCheck,
  Zap,
  Info,
  ExternalLink,
  ChevronRight,
  Terminal,
} from 'lucide-react';
import {
  getFirebaseConfigDiagnostics,
  testFirestoreConnection,
  saveStateToCloud,
  resetQuotaExceededFlag,
} from '../services/firestoreService';
import { useApp } from '../context/AppContext';

interface FirebaseConnectionStatusProps {
  variant?: 'pill' | 'button' | 'card' | 'full';
  className?: string;
  showModalInitially?: boolean;
}

export const FirebaseConnectionStatus: React.FC<FirebaseConnectionStatusProps> = ({
  variant = 'pill',
  className = '',
  showModalInitially = false,
}) => {
  const { leads, users, visits, tasks, units } = useApp();

  const [isOpen, setIsOpen] = useState(showModalInitially);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [syncSuccessMessage, setSyncSuccessMessage] = useState<string | null>(null);

  // Diagnostic State
  const [diagInfo, setDiagInfo] = useState(() => getFirebaseConfigDiagnostics());
  const [testResult, setTestResult] = useState<{
    success: boolean;
    latencyMs: number;
    readSuccess: boolean;
    writeSuccess: boolean;
    docExists: boolean;
    error?: string;
    errorCode?: string;
    testedAt?: string;
  } | null>(null);

  const [logs, setLogs] = useState<Array<{ timestamp: string; type: 'info' | 'success' | 'error' | 'warn'; text: string }>>([
    {
      timestamp: new Date().toLocaleTimeString(),
      type: 'info',
      text: 'Módulo de diagnóstico Firebase inicializado.',
    },
  ]);

  const addLog = useCallback((type: 'info' | 'success' | 'error' | 'warn', text: string) => {
    setLogs((prev) => [
      { timestamp: new Date().toLocaleTimeString(), type, text },
      ...prev.slice(0, 40),
    ]);
  }, []);

  const runDiagnostics = useCallback(async () => {
    setIsTesting(true);
    addLog('info', 'Iniciando teste de conectividade com o Firestore...');

    const configDiag = getFirebaseConfigDiagnostics();
    setDiagInfo(configDiag);

    try {
      const result = await testFirestoreConnection();
      const testedAt = new Date().toLocaleTimeString();
      setTestResult({ ...result, testedAt });

      if (result.success) {
        addLog('success', `Conexão bem-sucedida! Leitura: OK, Gravação: OK. Latência: ${result.latencyMs}ms`);
      } else {
        addLog('error', `Falha na conexão: [${result.errorCode}] ${result.error || 'Erro desconhecido'}`);
      }
    } catch (err: any) {
      addLog('error', `Exceção crítica durante teste: ${err?.message || String(err)}`);
    } finally {
      setIsTesting(false);
    }
  }, [addLog]);

  // Initial connection test on mount
  useEffect(() => {
    runDiagnostics();
  }, [runDiagnostics]);

  // Handle force sync
  const handleForceSync = async () => {
    setIsSyncing(true);
    setSyncSuccessMessage(null);
    addLog('info', 'Disparando gravação manual completa do estado local para o Firestore Cloud...');

    try {
      const storageKey = 'ots_master_crm_state_v1';
      const localRaw = localStorage.getItem(storageKey);
      let payloadToSync: any = null;

      if (localRaw) {
        try {
          payloadToSync = JSON.parse(localRaw);
        } catch {}
      }

      if (!payloadToSync) {
        payloadToSync = {
          leadsCount: leads.length,
          usersCount: users.length,
          visitsCount: visits.length,
          tasksCount: tasks.length,
          unitsCount: units.length,
          updatedAt: new Date().toISOString(),
        };
      }

      const ok = await saveStateToCloud(payloadToSync, true);
      if (ok) {
        setSyncSuccessMessage('Dados sincronizados e salvos com sucesso na nuvem Firestore!');
        addLog('success', 'Gravação do estado local para o Firestore confirmada com sucesso.');
        runDiagnostics();
      } else {
        addLog('error', 'Falha ao gravar estado no Firestore. Verifique conexão e permissões.');
      }
    } catch (e: any) {
      addLog('error', `Erro na sincronização manual: ${e?.message || String(e)}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleResetQuota = () => {
    resetQuotaExceededFlag();
    addLog('info', 'Flag de cota reiniciada. Re-testando conexão...');
    runDiagnostics();
  };

  const getLocalStorageSize = () => {
    try {
      let total = 0;
      for (const x in localStorage) {
        if (Object.prototype.hasOwnProperty.call(localStorage, x)) {
          total += (localStorage[x].length + x.length) * 2;
        }
      }
      return (total / 1024).toFixed(1) + ' KB';
    } catch {
      return 'N/A';
    }
  };

  const copyDiagnosticReport = () => {
    const report = `=== RELATÓRIO DE DIAGNÓSTICO FIREBASE / VERCEL ===
Data/Hora: ${new Date().toISOString()}
Status Geral: ${testResult?.success ? 'CONECTADO E OPERACIONAL' : 'FALHA OU OFFLINE'}
Latência: ${testResult?.latencyMs ? `${testResult.latencyMs}ms` : 'N/A'}
Leitura (Get): ${testResult?.readSuccess ? 'OK' : 'FALHA'}
Gravação (Write): ${testResult?.writeSuccess ? 'OK' : 'FALHA'}
Documento Principal Existe: ${testResult?.docExists ? 'SIM' : 'NÃO'}
Erro Detectado: ${testResult?.error || 'Nenhum'}
Código do Erro: ${testResult?.errorCode || 'Nenhum'}

--- VARIÁVEIS DE AMBIENTE & CONFIGURAÇÃO ---
Projeto (Project ID): ${diagInfo.projectId.value} [Fonte: ${diagInfo.projectId.source}]
Database ID: ${diagInfo.firestoreDatabaseId.value} [Fonte: ${diagInfo.firestoreDatabaseId.source}]
Auth Domain: ${diagInfo.authDomain.value} [Fonte: ${diagInfo.authDomain.source}]
Storage Bucket: ${diagInfo.storageBucket.value} [Fonte: ${diagInfo.storageBucket.source}]
App ID: ${diagInfo.appId.value} [Fonte: ${diagInfo.appId.source}]
API Key Presente: ${diagInfo.apiKey.value ? 'SIM (Mascarada: ' + String(diagInfo.apiKey.value).substring(0, 8) + '...)' : 'NÃO'} [Fonte: ${diagInfo.apiKey.source}]

--- DADOS LOCAIS ---
Estado Local: ${leads.length > 0 ? 'CARREGADO' : 'INICIALIZANDO'}
Leads em Memória: ${leads.length}
Usuários em Memória: ${users.length}
Visitas em Memória: ${visits.length}
Tamanho do LocalStorage: ${getLocalStorageSize()}
=================================================`;

    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const maskSecret = (str?: string) => {
    if (!str) return 'Não configurado';
    if (str.length <= 10) return '••••••••';
    return `${str.substring(0, 6)}••••••••${str.substring(str.length - 4)}`;
  };

  // Visual status indicators
  const isOnline = Boolean(testResult?.success);
  const isQuota = diagInfo.isQuotaExceeded;

  return (
    <>
      {/* 1. Pill Variant (Ideal for Navbar / Top Header) */}
      {variant === 'pill' && (
        <button
          id="btn-firebase-status-pill"
          onClick={() => {
            setIsOpen(true);
            runDiagnostics();
          }}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all duration-200 shadow-2xs hover:scale-102 ${
            isTesting
              ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
              : isQuota
              ? 'bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-800'
              : isOnline
              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800'
          } ${className}`}
          title="Clique para abrir o Diagnóstico em Tempo Real do Firebase e Variáveis de Ambiente"
        >
          <span className="relative flex h-2 w-2">
            {isOnline && !isTesting && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            )}
            {isTesting && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            )}
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isTesting
                  ? 'bg-amber-500'
                  : isQuota
                  ? 'bg-orange-500'
                  : isOnline
                  ? 'bg-emerald-500'
                  : 'bg-rose-500'
              }`}
            ></span>
          </span>

          <span className="hidden sm:inline font-mono text-[11px]">
            {isTesting
              ? 'Testando Nuvem...'
              : isQuota
              ? 'Cota Nuvem'
              : isOnline
              ? `Firestore Nuvem: Ativa (${testResult?.latencyMs || 0}ms)`
              : 'Firestore: Desconectado'}
          </span>

          <span className="sm:hidden font-mono text-[10px]">
            {isTesting ? 'Nuvem...' : isOnline ? 'Nuvem OK' : 'Offline'}
          </span>
        </button>
      )}

      {/* 2. Button Variant */}
      {variant === 'button' && (
        <button
          id="btn-firebase-status-action"
          onClick={() => {
            setIsOpen(true);
            runDiagnostics();
          }}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition-colors ${className}`}
        >
          <Activity className="w-4 h-4 text-emerald-600" />
          <span>Diagnóstico Firebase & .env</span>
        </button>
      )}

      {/* 3. Card Variant (For embedding in SettingsView) */}
      {variant === 'card' && (
        <div className={`p-4 rounded-2xl border bg-white dark:bg-slate-900 shadow-xs ${className}`}>
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div
                className={`p-2 rounded-xl ${
                  isOnline
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                    : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                }`}
              >
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Conexão com Firestore Cloud</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      isOnline
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    }`}
                  >
                    {isOnline ? 'Online & Conectado' : 'Offline / Erro'}
                  </span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Banco de dados: <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">{diagInfo.firestoreDatabaseId.value}</span>
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setIsOpen(true);
                runDiagnostics();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-2xs"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Abrir Diagnóstico</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
              <span className="text-[10px] text-slate-400 block font-medium">Status de Leitura</span>
              <span className={`font-bold flex items-center gap-1 ${testResult?.readSuccess ? 'text-emerald-600' : 'text-rose-600'}`}>
                {testResult?.readSuccess ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                {testResult?.readSuccess ? 'Operacional' : 'Falha'}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
              <span className="text-[10px] text-slate-400 block font-medium">Status de Gravação</span>
              <span className={`font-bold flex items-center gap-1 ${testResult?.writeSuccess ? 'text-emerald-600' : 'text-rose-600'}`}>
                {testResult?.writeSuccess ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                {testResult?.writeSuccess ? 'Operacional' : 'Falha'}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
              <span className="text-[10px] text-slate-400 block font-medium">Latência de Resposta</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                {testResult?.latencyMs ? `${testResult.latencyMs} ms` : 'N/A'}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
              <span className="text-[10px] text-slate-400 block font-medium">Armazenamento Local</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                {getLocalStorageSize()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 4. Full Diagnostic Modal */}
      {isOpen && (
        <div
          id="modal-firebase-diagnostics"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/70">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2.5 rounded-2xl ${
                    isOnline
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                      : 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                  }`}
                >
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Diagnóstico de Conexão Firestore & .env</span>
                    <span
                      className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                        isOnline
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}
                    >
                      {isOnline ? 'Conectado (Nuvem Ativa)' : 'Desconectado / Verificando'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Inspeção em tempo real de credenciais, permissões de gravação e sincronização
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="btn-retest-firebase"
                  onClick={runDiagnostics}
                  disabled={isTesting}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                  title="Re-testar conexão agora"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  <span>{isTesting ? 'Testando...' : 'Re-testar Agora'}</span>
                </button>

                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Fechar"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-5 flex-1 text-slate-800 dark:text-slate-200">
              {/* Sync Success Alert if triggered */}
              {syncSuccessMessage && (
                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{syncSuccessMessage}</span>
                  </div>
                  <button
                    onClick={() => setSyncSuccessMessage(null)}
                    className="text-emerald-600 hover:text-emerald-800 font-bold ml-2"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Error Alert if test failed */}
              {testResult && !testResult.success && (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 space-y-2">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-rose-900 dark:text-rose-200 uppercase tracking-wide">
                        Falha na Conexão com a Nuvem
                      </h4>
                      <p className="text-xs text-rose-700 dark:text-rose-300 mt-1 font-mono">
                        Código: <strong>{testResult.errorCode}</strong>
                      </p>
                      <p className="text-xs text-rose-600 dark:text-rose-400 mt-0.5">
                        {testResult.error || 'Não foi possível se comunicar com o banco de dados Firestore.'}
                      </p>
                    </div>
                  </div>

                  {testResult.errorCode === 'permission-denied' && (
                    <div className="text-[11px] bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-xl border border-rose-200 dark:border-rose-800 mt-2 text-rose-900 dark:text-rose-200">
                      💡 <strong>Dica para Permission-Denied:</strong> O Firestore está rejeitando a gravação devido às regras de segurança (`firestore.rules`). Verifique se as regras permitem leitura e escrita na coleção `crm_state`.
                    </div>
                  )}

                  {testResult.errorCode === 'resource-exhausted' && (
                    <div className="text-[11px] bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-xl border border-rose-200 dark:border-rose-800 mt-2 text-rose-900 dark:text-rose-200 flex items-center justify-between">
                      <div>
                        💡 <strong>Dica para Cota Excedida:</strong> A cota diária gratuita do Firestore foi atingida. O sistema está usando armazenamento seguro no navegador (`LocalStorage`).
                      </div>
                      <button
                        onClick={handleResetQuota}
                        className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-semibold text-xs hover:bg-rose-700 shrink-0 ml-2"
                      >
                        Resetar Flag
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* 1. Quick Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                  <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                    <span>Leitura (Get)</span>
                    <Server className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex items-center gap-1.5 font-bold text-sm">
                    {testResult?.readSuccess ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span className="text-emerald-700 dark:text-emerald-400">Ativa</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-rose-500" />
                        <span className="text-rose-700 dark:text-rose-400">Falhou</span>
                      </>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Doc principal: {testResult?.docExists ? 'Encontrado' : 'Vazio/Novo'}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                  <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                    <span>Gravação (Write)</span>
                    <Zap className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex items-center gap-1.5 font-bold text-sm">
                    {testResult?.writeSuccess ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span className="text-emerald-700 dark:text-emerald-400">Confirmada</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-rose-500" />
                        <span className="text-rose-700 dark:text-rose-400">Falhou</span>
                      </>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Ping write heartbeat
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                  <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                    <span>Latência Nuvem</span>
                    <Activity className="w-3.5 h-3.5" />
                  </div>
                  <div className="font-bold text-sm text-slate-800 dark:text-slate-100 font-mono">
                    {testResult?.latencyMs ? `${testResult.latencyMs} ms` : '—'}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Tempo de resposta
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                  <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                    <span>LocalStorage</span>
                    <HardDrive className="w-3.5 h-3.5" />
                  </div>
                  <div className="font-bold text-sm text-slate-800 dark:text-slate-100 font-mono">
                    {getLocalStorageSize()}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    {leads.length} leads em cache
                  </span>
                </div>
              </div>

              {/* 2. Environment Variables & Keys Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-50/50 dark:bg-slate-900/50">
                <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-100/70 dark:bg-slate-800/50">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                      Chaves de Configuração e .env
                    </h4>
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Fallback automático ativo
                  </span>
                </div>

                <div className="divide-y divide-slate-200 dark:divide-slate-800 text-xs font-mono">
                  {/* Project ID */}
                  <div className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 hover:bg-slate-100/50 dark:hover:bg-slate-800/30 transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 font-sans font-semibold text-[11px] w-36 shrink-0">
                        PROJECT_ID:
                      </span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {diagInfo.projectId.value || 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-sans">
                        {diagInfo.projectId.source}
                      </span>
                      <span className="text-emerald-500">
                        <CheckCircle2 className="w-4 h-4" />
                      </span>
                    </div>
                  </div>

                  {/* Database ID */}
                  <div className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 hover:bg-slate-100/50 dark:hover:bg-slate-800/30 transition-colors bg-emerald-50/30 dark:bg-emerald-950/20">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 font-sans font-semibold text-[11px] w-36 shrink-0">
                        DATABASE_ID:
                      </span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-300 truncate max-w-sm sm:max-w-md">
                        {diagInfo.firestoreDatabaseId.value || '(default)'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 font-sans">
                        {diagInfo.firestoreDatabaseId.source}
                      </span>
                      <span className="text-emerald-500">
                        <CheckCircle2 className="w-4 h-4" />
                      </span>
                    </div>
                  </div>

                  {/* API Key */}
                  <div className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 hover:bg-slate-100/50 dark:hover:bg-slate-800/30 transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 font-sans font-semibold text-[11px] w-36 shrink-0">
                        API_KEY:
                      </span>
                      <span className="text-slate-700 dark:text-slate-300">
                        {maskSecret(diagInfo.apiKey.value)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-sans">
                        {diagInfo.apiKey.source}
                      </span>
                      <span className="text-emerald-500">
                        <CheckCircle2 className="w-4 h-4" />
                      </span>
                    </div>
                  </div>

                  {/* Auth Domain */}
                  <div className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 hover:bg-slate-100/50 dark:hover:bg-slate-800/30 transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 font-sans font-semibold text-[11px] w-36 shrink-0">
                        AUTH_DOMAIN:
                      </span>
                      <span className="text-slate-700 dark:text-slate-300">
                        {diagInfo.authDomain.value || 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-sans">
                        {diagInfo.authDomain.source}
                      </span>
                      <span className="text-emerald-500">
                        <CheckCircle2 className="w-4 h-4" />
                      </span>
                    </div>
                  </div>

                  {/* App ID */}
                  <div className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 hover:bg-slate-100/50 dark:hover:bg-slate-800/30 transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 font-sans font-semibold text-[11px] w-36 shrink-0">
                        APP_ID:
                      </span>
                      <span className="text-slate-700 dark:text-slate-300 truncate max-w-xs">
                        {diagInfo.appId.value || 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-sans">
                        {diagInfo.appId.source}
                      </span>
                      <span className="text-emerald-500">
                        <CheckCircle2 className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    id="btn-force-sync-cloud"
                    onClick={handleForceSync}
                    disabled={isSyncing}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Gravando na Nuvem...' : 'Forçar Gravação na Nuvem Agora'}</span>
                  </button>

                  <button
                    id="btn-copy-diagnostic-report"
                    onClick={copyDiagnosticReport}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600 font-bold">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>Copiar Relatório Técnico</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Última mutação ID: <span className="font-mono text-slate-700 dark:text-slate-300">{diagInfo.lastSavedMutationId || 'Inicial'}</span>
                </div>
              </div>

              {/* 4. Real-time Diagnostic Event Log */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-900 text-slate-200">
                <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-slate-300 font-bold">Log de Eventos e Transmissão</span>
                  </div>
                  <span className="text-[10px] text-slate-500">Tempo real</span>
                </div>

                <div className="p-3 max-h-40 overflow-y-auto font-mono text-[11px] space-y-1">
                  {logs.map((log, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-slate-500 shrink-0">[{log.timestamp}]</span>
                      <span
                        className={
                          log.type === 'success'
                            ? 'text-emerald-400'
                            : log.type === 'error'
                            ? 'text-rose-400'
                            : log.type === 'warn'
                            ? 'text-amber-400'
                            : 'text-slate-300'
                        }
                      >
                        {log.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 5. Helpful Guide & FAQs */}
              <div className="p-4 rounded-2xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/60 text-xs space-y-2 text-sky-900 dark:text-sky-200">
                <div className="flex items-center gap-2 font-bold text-sky-800 dark:text-sky-300">
                  <Info className="w-4 h-4 text-sky-600" />
                  <span>Como garantir que os dados salvem no Vercel:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300 pl-1 leading-relaxed">
                  <li>
                    <strong>Sincronização Automática:</strong> Qualquer lead, visita, escala ou alteração é gravada imediatamente no <code>LocalStorage</code> do navegador e sincronizada em segundo plano no Firestore.
                  </li>
                  <li>
                    <strong>Fallback Duplo:</strong> Se as variáveis de ambiente do Vercel não estiverem carregadas, o aplicativo usará automaticamente os parâmetros do arquivo interno <code>firebase-applet-config.json</code>.
                  </li>
                  <li>
                    <strong>Novo Deployment no Vercel:</strong> Quando você fizer commit no GitHub, o Vercel recompilará o projeto incluindo o arquivo de configuração atualizado e as novas rotinas de sincronização.
                  </li>
                </ul>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
              <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>OTS Master CRM • Monitor de Persistência Cloud</span>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors shadow-xs"
              >
                Concluir e Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
