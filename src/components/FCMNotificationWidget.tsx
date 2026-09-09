import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { initFCM, setupForegroundListener } from '../services/fcmService';
import { playNotificationChime, unlockAudioContext } from '../utils/soundService';
import { BellRing, ShieldCheck, CheckCircle2, AlertTriangle, Send, Smartphone, Volume2, Info, Lock } from 'lucide-react';

export const FCMNotificationWidget: React.FC = () => {
  const { currentUser, leads } = useApp();
  const [fcmToken, setFcmToken] = useState<string | null>(localStorage.getItem('fcm_device_token'));
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );
  const [isEnabling, setIsEnabling] = useState(false);
  const [testSent, setTestSent] = useState(false);
  const [soundTested, setSoundTested] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionStatus(Notification.permission);
    }

    if (fcmToken) {
      setupForegroundListener((payload) => {
        console.log('FCM Foreground push payload:', payload);
        playNotificationChime('lead');
      });
    }

    // Check overdue/today follow-ups periodically to send background/out-of-focus browser notifications if permission is granted
    const interval = setInterval(() => {
      if (Notification.permission === 'granted') {
        const todayStr = new Date().toISOString().split('T')[0];
        const pending = leads.filter((l) => {
          if (l.naCaixaDeLeads) return false;
          const isOwner =
            currentUser.role === 'admin' ||
            currentUser.role === 'coordenador' ||
            currentUser.role === 'gestor' ||
            l.corretorId === currentUser.id;
          if (!isOwner) return false;
          return l.proximaAcaoData && l.proximaAcaoData <= todayStr;
        });

        // If there are overdue leads and we haven't notified recently in this session
        const lastNotified = sessionStorage.getItem('last_fcm_check');
        if (pending.length > 0 && !lastNotified) {
          sessionStorage.setItem('last_fcm_check', 'notified');
          const title = `⚠️ Jardim Vivência CRM: ${pending.length} Follow-up(s) Pendente(s)!`;
          const body = `Lead ${pending[0].nome} (${pending[0].telefone}) requer atenção urgente. Mantenha seu funil ativo!`;

          playNotificationChime('lead');
          if (document.hidden) {
            new Notification(title, { body, icon: '/icon.png' });
          }
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [currentUser, leads, fcmToken]);

  const handleTestSound = () => {
    unlockAudioContext();
    playNotificationChime('test');
    setSoundTested(true);
    setTimeout(() => setSoundTested(false), 3500);
  };

  const handleEnablePush = async () => {
    unlockAudioContext();
    setIsEnabling(true);
    try {
      const token = await initFCM();
      if (token) {
        setFcmToken(token);
        setPermissionStatus(Notification.permission);
        playNotificationChime('lead');
        alert('Notificações Push FCM ativadas com sucesso! Você receberá alertas sonoros e popups mesmo com o navegador em segundo plano.');
      } else {
        setPermissionStatus(Notification.permission);
        if (Notification.permission === 'denied') {
          alert('As notificações foram bloqueadas no seu navegador. Para ativar, clique no ícone de cadeado 🔒 na barra de endereços e escolha "Permitir" para Notificações.');
        } else {
          alert('Não foi possível ativar as notificações push. Verifique se o navegador permite popups de notificação.');
        }
      }
    } catch (err) {
      console.error('Error enabling push:', err);
      alert('Erro ao ativar notificações push.');
    } finally {
      setIsEnabling(false);
    }
  };

  const handleTestNotification = () => {
    unlockAudioContext();
    playNotificationChime('lead');

    if (Notification.permission !== 'granted') {
      alert('Sinal sonoro disparado! Para ver a notificação em popup na tela, ative as permissões de Notificação Push FCM acima.');
      return;
    }

    const title = '🔔 Alerta de Teste - OTS Master CRM';
    const body = 'Notificação Push em segundo plano funcionando perfeitamente! Você receberá avisos sobre novos clientes e tarefas.';

    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, {
          body,
          icon: '/icon.png',
          badge: '/icon.png',
          tag: 'followup-test',
          data: { url: window.location.href },
        });
      });
    } else {
      new Notification(title, { body, icon: '/icon.png' });
    }

    setTestSent(true);
    setTimeout(() => setTestSent(false), 4000);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5 text-xs">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-2xl">
            <BellRing className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-900 dark:text-white">
              Sinal Sonoro & Notificações Push FCM (Firebase)
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Alertas sonoros e popups em tempo real para novos leads e follow-ups.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {permissionStatus === 'granted' ? (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Push Ativo</span>
            </span>
          ) : permissionStatus === 'denied' ? (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Bloqueado no Navegador</span>
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
              Pendente
            </span>
          )}
        </div>
      </div>

      {/* Explanatory Info Card: Para que serve o Push FCM */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 space-y-2">
        <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100 text-xs">
          <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>O que é Push FCM e para que serve este botão?</span>
        </div>
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
          O <strong>Push FCM (Firebase Cloud Messaging)</strong> é o serviço oficial do Google que permite enviar notificações instantâneas diretamente para a tela do seu computador ou celular.
        </p>
        <ul className="list-disc list-inside text-[11px] text-slate-600 dark:text-slate-300 space-y-1 pl-1">
          <li>
            <strong>Alerta Sonoro de Leads:</strong> Toca um sinal sonoro especial no seu alto-falante assim que um cliente entra ou é atribuído a você.
          </li>
          <li>
            <strong>Avisos com Navegador Minimizado:</strong> Você recebe o popup de aviso mesmo com a aba do CRM minimizada, fechada ou enquanto estiver em outros sites.
          </li>
          <li>
            <strong>Como usar:</strong> Clique em <em>"Ativar Notificações Push FCM"</em> para dar a permissão ao seu navegador. Em seguida, utilize os botões abaixo para testar o som e o popup na tela.
          </li>
        </ul>
      </div>

      {/* Blocked Instruction Warning if Denied */}
      {permissionStatus === 'denied' && (
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 rounded-2xl border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-xs">
            <Lock className="w-4 h-4 text-rose-600" />
            <span>Notificações bloqueadas pelo seu navegador</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            Seu navegador impediu o envio de popups. Para permitir:
          </p>
          <ol className="list-decimal list-inside text-[11px] space-y-0.5 font-medium">
            <li>Clique no ícone de <strong>cadeado 🔒</strong> no lado esquerdo da barra de endereço deste site.</li>
            <li>Localize <strong>"Notificações"</strong> e mude para <strong>"Permitir"</strong>.</li>
            <li>Atualize a página (F5) e clique no botão de ativar novamente.</li>
          </ol>
        </div>
      )}

      {/* Action Controls */}
      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
        {permissionStatus !== 'granted' && (
          <button
            onClick={handleEnablePush}
            disabled={isEnabling}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-2"
          >
            <Smartphone className="w-4 h-4" />
            <span>{isEnabling ? 'Solicitando Permissão...' : 'Ativar Notificações Push FCM'}</span>
          </button>
        )}

        {/* Test Audio Chime Button */}
        <button
          onClick={handleTestSound}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2 shadow-xs"
        >
          <Volume2 className="w-4 h-4" />
          <span>Testar Sinal Sonoro (Áudio)</span>
        </button>

        {/* Test Push Popup Button */}
        <button
          onClick={handleTestNotification}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2 shadow-xs"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Testar Popup de Notificação</span>
        </button>

        {soundTested && (
          <span className="text-xs text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1 animate-pulse">
            <Volume2 className="w-4 h-4" />
            <span>🔊 Sinal sonoro emitido!</span>
          </span>
        )}

        {testSent && (
          <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Popup disparado!</span>
          </span>
        )}
      </div>

      {fcmToken && (
        <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
          FCM Token Registrado: <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">{fcmToken.substring(0, 24)}...</code>
        </div>
      )}
    </div>
  );
};

