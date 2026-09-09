import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { MobileDrawer } from './components/MobileDrawer';
import { PrintReportModal } from './components/PrintReportModal';
import { SalesTable } from './components/SalesTable';
import { Simulator } from './components/Simulator';
import { KanbanFunnel } from './components/KanbanFunnel';
import { ClientsList } from './components/ClientsList';
import { ShiftsManagement } from './components/ShiftsManagement';
import { RouletteReport } from './components/RouletteReport';
import { VisitsLog } from './components/VisitsLog';
import { TasksView } from './components/TasksView';
import { TeamsManagement } from './components/TeamsManagement';
import { CommissionsView } from './components/CommissionsView';
import { DashboardView } from './components/DashboardView';
import { ViviAssistant } from './components/ViviAssistant';
import { ShiftRulesView } from './components/ShiftRulesView';
import { AuditLogView } from './components/AuditLogView';
import { BackupRestoreView } from './components/BackupRestoreView';
import { UserManualView } from './components/UserManualView';
import { UsersManagement } from './components/UsersManagement';
import { TagsManagementView } from './components/TagsManagementView';
import { SimulatorRulesView } from './components/SimulatorRulesView';
import { SettingsView } from './components/SettingsView';
import { CaixaLeadsView } from './components/CaixaLeadsView';
import { ContractGenerator } from './components/ContractGenerator';
import { LeadModal } from './components/LeadModal';
import { LoginScreen } from './components/LoginScreen';
import { EspelhoVendas } from './components/EspelhoVendas';
import { PartnerAgenciesView } from './components/PartnerAgenciesView';
import { NeighborhoodsMapView } from './components/NeighborhoodsMapView';
import { WelcomeView } from './components/WelcomeView';
import { BoardApprovalsView } from './components/BoardApprovalsView';
import { LeadDistributorView } from './components/LeadDistributorView';
import { isFullAdmin } from './types';
import { Lock, ShieldAlert, ArrowLeft, Building, Sparkles } from 'lucide-react';

const MainLayout: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    selectedLeadForModal,
    setSelectedLeadForModal,
    canAccessTabelaVendas,
    canAccessSimulador,
    currentUser,
    isAuthenticated,
  } = useApp();

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/firebase-messaging-sw.js')
        .then((reg) => {
          console.log('PWA Service Worker registered on app load:', reg.scope);
        })
        .catch((err) => {
          console.warn('PWA Service Worker registration failed on app load:', err);
        });
    }
  }, []);

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  const renderContent = () => {
    // Permission checks
    if (activeTab === 'tabela_vendas' && !canAccessTabelaVendas) {
      return (
        <div className="p-8 max-w-2xl mx-auto my-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Tabela de Vendas Restrita</h2>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            A visualização da Tabela de Vendas de 877 unidades está configurada para acesso exclusivo do Administrador.
            O Administrador pode liberar o acesso clicando no botão <i>'Ativar para líderes'</i>.
          </p>
          <button
            onClick={() => setActiveTab('dashboard')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800 dark:hover:bg-slate-700"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar ao Dashboard</span>
          </button>
        </div>
      );
    }

    if (activeTab === 'simulador' && !canAccessSimulador) {
      return (
        <div className="p-8 max-w-2xl mx-auto my-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Simulador CEF Restrito</h2>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            O Simulador oficial está configurado para acesso exclusivo do Administrador.
            O Administrador pode liberar o acesso clicando no botão <i>'Ativar para líderes'</i>.
          </p>
          <button
            onClick={() => setActiveTab('dashboard')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800 dark:hover:bg-slate-700"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar ao Dashboard</span>
          </button>
        </div>
      );
    }

    if (
      (activeTab === 'relatorio_roleta' || activeTab === 'auditoria' || activeTab === 'backup') &&
      !isFullAdmin(currentUser.role)
    ) {
      return (
        <div className="p-8 max-w-2xl mx-auto my-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Acesso Restrito ao Administrador</h2>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Este recurso possui informações gerenciais estratégicas e requer privilégios de Administrador Geral.
          </p>
          <button
            onClick={() => setActiveTab('dashboard')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800 dark:hover:bg-slate-700"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar ao Dashboard</span>
          </button>
        </div>
      );
    }

    // View Mapping
    switch (activeTab) {
      case 'boas_vindas':
      case 'welcome':
        return <WelcomeView />;
      case 'dashboard':
        return <DashboardView />;
      case 'tabela_vendas':
        return <SalesTable />;
      case 'simulador':
        return <Simulator onOpenPrintReport={() => setIsPrintModalOpen(true)} />;
      case 'aprovações':
        return <BoardApprovalsView />;
      case 'kanban':
        return <KanbanFunnel />;
      case 'clientes':
        return <ClientsList />;
      case 'caixa_leads':
        return <CaixaLeadsView />;
      case 'distribuidor_leads':
        return <LeadDistributorView />;
      case 'plantao':
        return <ShiftsManagement />;
      case 'relatorio_roleta':
        return <RouletteReport />;
      case 'visitas':
        return <VisitsLog />;
      case 'tarefas':
        return <TasksView />;
      case 'usuarios':
        return <UsersManagement />;
      case 'tags':
        return <TagsManagementView />;
      case 'regras_simulador':
        return <SimulatorRulesView />;
      case 'equipes':
        return <TeamsManagement />;
      case 'comissoes':
        return <CommissionsView />;
      case 'vivi':
      case 'vivi_ia':
        return <ViviAssistant />;
      case 'regras_plantao':
        return <ShiftRulesView />;
      case 'auditoria':
        return <AuditLogView />;
      case 'backup':
        return <BackupRestoreView />;
      case 'manual':
        return <UserManualView />;
      case 'configuracoes':
        return <SettingsView />;
      case 'contrato':
      case 'gerador_contrato':
        return <ContractGenerator />;
      case 'espelho_vendas':
        return <EspelhoVendas />;
      case 'mapa_bairros':
        return <NeighborhoodsMapView />;
      case 'imobiliarias_parceiras':
        return <PartnerAgenciesView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col font-sans text-slate-900 dark:text-slate-100 antialiased selection:bg-emerald-500 selection:text-white transition-colors">
      {/* Top Navbar */}
      <Navbar onOpenPrintModal={() => setIsPrintModalOpen(true)} />

      {/* Main Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <Sidebar />

        {/* Dynamic Content View */}
        <main className="flex-1 overflow-y-auto bg-slate-100/90 dark:bg-slate-950 pb-20 md:pb-8">
          {renderContent()}
        </main>
      </div>

      {/* Mobile Bottom Navigation (Hidden on Desktop) */}
      <MobileBottomNav />

      {/* Mobile Drawer (Hidden on Desktop) */}
      <MobileDrawer onOpenPrintModal={() => setIsPrintModalOpen(true)} />

      {/* Global Print & PDF Report Modal */}
      <PrintReportModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
      />

      {/* Modal for Lead Details */}
      {selectedLeadForModal && (
        <LeadModal
          lead={selectedLeadForModal}
          onClose={() => setSelectedLeadForModal(null)}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
