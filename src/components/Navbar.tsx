import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Building2,
  Bell,
  CheckCircle2,
  Lock,
  Unlock,
  ChevronDown,
  Sparkles,
  AlertTriangle,
  Flame,
  MessageSquare,
  ArrowRight,
  ExternalLink,
  Trash2,
  CheckCheck,
  Sun,
  Moon,
  Printer,
  Menu,
  LogOut,
  KeyRound,
  FileSpreadsheet,
  BellRing,
} from 'lucide-react';
import { ChangePasswordModal } from './ChangePasswordModal';
import { ExportReportsModal } from './ExportReportsModal';
import { FollowUpCentralModal } from './FollowUpCentralModal';
import { UserProfileModal } from './UserProfileModal';
import { GlobalSearchBar } from './GlobalSearchBar';
import { FirebaseConnectionStatus } from './FirebaseConnectionStatus';
import { User, Camera } from 'lucide-react';

interface NavbarProps {
  onOpenPrintModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenPrintModal }) => {
  const {
    currentUser,
    users,
    switchUserById,
    settings,
    toggleTabelaParaLideres,
    toggleSimuladorParaLideres,
    setActiveTab,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    unreadNotificationsCount,
    stagnantLeads,
    setSelectedLeadForModal,
    leads,
    theme,
    toggleTheme,
    toggleMobileDrawer,
    logout,
  } = useApp();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [dismissStagnantBanner, setDismissStagnantBanner] = useState(false);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return (
          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            Administrador
          </span>
        );
      case 'gestor':
        return (
          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            Gestor / Líder
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
            Corretor / Corretor
          </span>
        );
    }
  };

  const getNotifIcon = (tipo: string) => {
    switch (tipo) {
      case 'assunto_corretor':
        return <Flame className="w-4 h-4 text-rose-500 animate-bounce" />;
      case 'duplicidade':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'lead_estagnado':
        return <Sparkles className="w-4 h-4 text-purple-500" />;
      default:
        return <Bell className="w-4 h-4 text-emerald-600" />;
    }
  };

  return (
    <>
      {/* Vivi Alert Banner for Stagnant Pre-registrations (> 7 days) */}
      {!dismissStagnantBanner && stagnantLeads.length > 0 && (
        <div
          id="banner-vivi-stagnant"
          className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white px-3 sm:px-4 py-2 text-xs flex flex-wrap items-center justify-between shadow-sm relative z-40 gap-2"
        >
          <div className="flex items-center gap-2 max-w-4xl">
            <span className="bg-white/20 p-1 rounded-md shrink-0">
              <Sparkles className="w-4 h-4 text-white animate-pulse" />
            </span>
            <span className="text-[11px] sm:text-xs leading-tight">
              <strong>Alerta da Vivi:</strong> Existem <strong>{stagnantLeads.length} pré-cadastros parados</strong> há mais de 7 dias sem atualização!
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              id="btn-banner-ver-parados"
              onClick={() => {
                setActiveTab('clientes');
                if (stagnantLeads[0]) {
                  setSelectedLeadForModal(stagnantLeads[0]);
                }
              }}
              className="bg-white text-orange-900 font-semibold px-2.5 py-1 rounded-md text-[11px] hover:bg-orange-50 transition-colors shadow-2xs flex items-center gap-1"
            >
              <span>Resolver</span>
              <ArrowRight className="w-3 h-3" />
            </button>
            <button
              onClick={() => setDismissStagnantBanner(true)}
              className="text-white/80 hover:text-white text-xs px-1.5 py-0.5 rounded hover:bg-white/10 transition-colors"
              title="Dispensar aviso provisoriamente"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-3 sm:px-4 lg:px-6 py-2.5 flex items-center justify-between shadow-xs transition-colors">
        {/* Left side: Hamburger on mobile + Logo */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            id="btn-navbar-mobile-drawer"
            onClick={toggleMobileDrawer}
            className="p-2 -ml-1 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden transition-colors"
            title="Abrir Menu Lateral"
          >
            <Menu className="w-5 h-5" />
          </button>

          <button
            id="btn-brand-logo"
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2 sm:gap-2.5 text-left group transition-all"
          >
            {settings.developerLogoUrl ? (
              <img
                src={settings.developerLogoUrl}
                alt="Logo"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-cover shadow-md shadow-emerald-700/20 group-hover:scale-105 transition-transform shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center text-white shadow-md shadow-emerald-700/20 group-hover:scale-105 transition-transform shrink-0">
                <Building2 className="w-5 h-5 text-white" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900 dark:text-white tracking-tight text-sm sm:text-base">
                  OTS Master CRM
                </span>
                <span className="hidden sm:inline-block text-[10px] font-semibold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                  Plantão & Vendas
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                {settings.nomeEmpreendimento} • {settings.cidadeUf}
              </p>
            </div>
          </button>
        </div>

        {/* Global Search Bar */}
        <GlobalSearchBar />

        {/* Right side: Actions, Theme toggle, Print, Notifications & User Switcher */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Quick Print Button */}
          {onOpenPrintModal && (
            <button
              id="btn-navbar-print-report"
              onClick={onOpenPrintModal}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors shadow-2xs"
              title="Imprimir Relatório ou Salvar PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Imprimir / PDF</span>
            </button>
          )}

          {/* Export CSV/Excel Button (Only for admin, coordenador, gestor) */}
          {(currentUser.role === 'admin' || currentUser.role === 'coordenador' || currentUser.role === 'gestor') && (
            <button
              id="btn-navbar-export-reports"
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-2xs"
              title="Exportar Dados (Leads, Comissões, Vendas) para CSV/Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Exportar Excel</span>
            </button>
          )}

          {/* Follow-Up Central Button */}
          <button
            id="btn-navbar-followup-central"
            onClick={() => setShowFollowUpModal(true)}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-2xs"
            title="Central de Follow-Ups e Prazos do Funil"
          >
            <BellRing className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Follow-Ups</span>
          </button>

          {/* Theme Toggle Button */}
          <button
            id="btn-theme-toggle"
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-600 dark:text-amber-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 transition-colors"
            title={theme === 'dark' ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 animate-in spin-in-180 duration-200" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700 animate-in spin-in-180 duration-200" />
            )}
          </button>

          {/* Quick AI Callout */}
          <button
            id="btn-quick-vivi"
            onClick={() => setActiveTab('vivi')}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/40 dark:to-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800/70 hover:bg-indigo-100/70 dark:hover:bg-indigo-900/60 transition-colors shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 animate-pulse" />
            <span>Vivi IA</span>
          </button>

          {/* Real-time Firebase & .env Connection Status Diagnostic Pill */}
          <FirebaseConnectionStatus variant="pill" />

          {/* Admin Release Toggles Summary in Navbar if Admin */}
          {currentUser.role === 'admin' && (
            <div className="hidden 2xl:flex items-center gap-2 border-r border-slate-200 dark:border-slate-800 pr-3">
              <button
                id="nav-toggle-tabela"
                onClick={toggleTabelaParaLideres}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                  settings.liberarTabelaParaLideres
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                }`}
                title="Liberação da Tabela de Vendas para Gestores"
              >
                {settings.liberarTabelaParaLideres ? <Unlock className="w-3 h-3 text-emerald-600" /> : <Lock className="w-3 h-3 text-slate-500" />}
                <span>Tabela: {settings.liberarTabelaParaLideres ? 'Ativa' : 'Privada'}</span>
              </button>

              <button
                id="nav-toggle-simulador"
                onClick={toggleSimuladorParaLideres}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                  settings.liberarSimuladorParaLideres
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                }`}
                title="Liberação do Simulador CEF para Gestores"
              >
                {settings.liberarSimuladorParaLideres ? <Unlock className="w-3 h-3 text-emerald-600" /> : <Lock className="w-3 h-3 text-slate-500" />}
                <span>Simulador: {settings.liberarSimuladorParaLideres ? 'Ativo' : 'Privado'}</span>
              </button>
            </div>
          )}

          {/* Bell Notifications Dropdown */}
          <div className="relative">
            <button
              id="btn-notification-bell"
              onClick={() => {
                setShowNotificationMenu(!showNotificationMenu);
                setShowUserMenu(false);
              }}
              className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200/80 dark:border-slate-800"
              title="Notificações e Avisos Automáticos"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700 dark:text-slate-300" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[10px] font-bold text-white bg-rose-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            {showNotificationMenu && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-3 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">Notificações</span>
                    {unreadNotificationsCount > 0 && (
                      <span className="bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 text-xs font-semibold px-2 py-0.5 rounded-full">
                        {unreadNotificationsCount} novas
                      </span>
                    )}
                  </div>
                  {unreadNotificationsCount > 0 && (
                    <button
                      id="btn-mark-all-read"
                      onClick={markAllNotificationsAsRead}
                      className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium flex items-center gap-1"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Marcar lidas</span>
                    </button>
                  )}
                </div>

                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {notifications.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs">
                      Nenhuma notificação no momento.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          n.lida
                            ? 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800 opacity-80'
                            : 'bg-white dark:bg-slate-800 border-emerald-200 dark:border-emerald-800 shadow-2xs ring-1 ring-emerald-500/10'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2">
                            <div className="mt-0.5 p-1 rounded-lg bg-slate-100 dark:bg-slate-700">{getNotifIcon(n.tipo)}</div>
                            <div>
                              <p className="text-xs font-semibold text-slate-900 dark:text-white leading-snug">{n.titulo}</p>
                              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">{n.mensagem}</p>
                              <span className="text-[10px] text-slate-400 mt-1 block">{n.dataHora}</span>
                            </div>
                          </div>

                          <div className="flex flex-col gap-1 items-end">
                            {!n.lida && (
                              <button
                                onClick={() => markNotificationAsRead(n.id)}
                                className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline"
                                title="Marcar como lida"
                              >
                                Lida
                              </button>
                            )}
                            <button
                              onClick={() => deleteNotification(n.id)}
                              className="text-slate-400 hover:text-rose-500 p-0.5"
                              title="Excluir notificação"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Action buttons inside notification */}
                        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-end gap-2">
                          {n.whatsappUrl && (
                            <a
                              href={n.whatsappUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 px-2 py-1 rounded-md flex items-center gap-1 border border-emerald-200 dark:border-emerald-800"
                            >
                              <MessageSquare className="w-3 h-3 text-emerald-600" />
                              <span>Avisar no WhatsApp</span>
                            </a>
                          )}

                          {n.linkTab && (
                            <button
                              onClick={() => {
                                setActiveTab(n.linkTab!);
                                setShowNotificationMenu(false);
                                markNotificationAsRead(n.id);
                              }}
                              className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 px-2 py-1 rounded-md flex items-center gap-1"
                            >
                              <span>Acessar</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Role Switcher Dropdown */}
          <div className="relative">
            <button
              id="btn-user-profile-menu"
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowNotificationMenu(false);
              }}
              className="flex items-center gap-2 p-1 sm:p-1.5 pl-1.5 sm:pl-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left"
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-cover ring-2 ring-emerald-500/20"
                referrerPolicy="no-referrer"
              />
              <div className="hidden md:block">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-none truncate max-w-[120px]">
                    {currentUser.name}
                  </span>
                </div>
                <div className="mt-0.5 flex items-center gap-1">
                  {getRoleBadge(currentUser.role)}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="p-2.5 border-b border-slate-100 dark:border-slate-800 mb-1">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Simular Perfil de Acesso</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Alterne para testar permissões:</p>
                </div>

                <div className="space-y-1 max-h-72 overflow-y-auto">
                  {users.map((u) => (
                    <button
                      key={u.id}
                      id={`btn-switch-user-${u.id}`}
                      onClick={() => {
                        switchUserById(u.id);
                        setShowUserMenu(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors ${
                        u.id === currentUser.id
                          ? 'bg-emerald-50/80 dark:bg-emerald-950/60 text-emerald-950 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={u.avatar}
                          alt={u.name}
                          className="w-7 h-7 rounded-lg object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <p className="text-xs font-medium leading-snug">{u.name}</p>
                          <p className="text-[10px] text-slate-400">{u.email}</p>
                        </div>
                      </div>
                      <div>{getRoleBadge(u.role)}</div>
                    </button>
                  ))}
                </div>

                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between px-2 text-[11px] text-slate-500 dark:text-slate-400">
                  <span>CRECI Ativo:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{currentUser.creci}</span>
                </div>
                
                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      setShowProfileModal(true);
                    }}
                    className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <span className="p-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                      <Camera className="w-3.5 h-3.5" />
                    </span>
                    <span>Editar Meu Perfil / Foto</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      setShowPasswordModal(true);
                    }}
                    className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <span className="p-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                      <KeyRound className="w-3.5 h-3.5" />
                    </span>
                    <span>Alterar Minha Senha</span>
                  </button>

                  <button
                    onClick={() => {
                      logout();
                    }}
                    className="w-full flex items-center justify-center gap-2 p-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sair do Sistema
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {showProfileModal && (
        <UserProfileModal onClose={() => setShowProfileModal(false)} />
      )}

      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />

      <ExportReportsModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
      />

      <FollowUpCentralModal
        isOpen={showFollowUpModal}
        onClose={() => setShowFollowUpModal(false)}
        onOpenLeadModal={(leadId) => {
          const found = leads.find((l) => l.id === leadId);
          if (found) setSelectedLeadForModal(found);
        }}
      />
    </>
  );
};

