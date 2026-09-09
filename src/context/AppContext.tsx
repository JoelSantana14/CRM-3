import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import { loadStateFromCloud, saveStateToCloud, subscribeToCloudState, logDeletionToFirestore, subscribeToDeletionLogs } from '../services/firestoreService';
import { playNotificationChime } from '../utils/soundService';
import {
  User,
  Team,
  Unit,
  Lead,
  LeadActivity,
  DeletedLeadRecord,
  AppNotification,
  ShiftRule,
  Visit,
  Task,
  ShiftScale,
  ShiftAttendance,
  RouletteRecord,
  Commission,
  AuditLog,
  AppSettings,
  FunnelStage,
  UserRole,
  isFullAdmin,
  ContactType,
  TagItem,
  SimulatorPolicyRule,
  PartnerAgency,
  PartnerVisitAttendance,
  ProposalApprovalRequest,
  DeletionAuditRecord,
} from '../types';
import {
  initialSettings,
  initialUsers,
  initialTeams,
  generate877Units,
  initialLeads,
  initialVisits,
  initialTasks,
  initialScales,
  initialAttendances,
  initialRouletteHistory,
  initialCommissions,
  initialAuditLogs,
  initialNotifications,
  initialShiftRules,
  initialDeletedLeads,
  initialTags,
  initialSimulatorPolicyRules,
  initialPartnerAgencies,
  initialPartnerVisits,
} from '../data/mockData';

// Keywords that indicate "Assunto de Corretor" in lead interactions
const BROKER_SUBJECT_KEYWORDS = [
  'valor',
  'valores',
  'preço',
  'entrada',
  'proposta',
  'contrato',
  'reserva',
  'desconto',
  'sinal',
  'ato',
  'comissão',
  'assinatura',
  'caixa',
  'financiamento',
  'renda',
  'fgts',
  'parcela',
];

export interface DuplicateCheckResult {
  duplicado: boolean;
  motivo?: string;
  leadExistente?: Lead;
  diasSemAtividade?: number;
  isAtendimentoAtivo?: boolean;
  temDireitoFifty?: boolean;
  acaoRecomendada?: 'fifty' | 'caixa_de_leads' | 'transferencia' | 'manter';
}

interface AppContextType {
  // Theme & Appearance
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;

  // Mobile Navigation Drawer
  isMobileDrawerOpen: boolean;
  setIsMobileDrawerOpen: (open: boolean) => void;
  toggleMobileDrawer: () => void;

  // Current session & auth
  isAuthenticated: boolean;
  login: (email: string, password?: string) => boolean;
  loginDetailed: (email: string, password?: string) => { success: boolean; reason: 'not_found' | 'invalid_password' | 'inactive' | 'success'; message: string };
  logout: () => void;
  currentUser: User;
  setCurrentUser: (user: User) => void;
  switchUserById: (userId: string) => void;
  users: User[];
  addUser: (user: Omit<User, 'id'>) => User;
  updateUser: (userId: string, updates: Partial<User>) => void;
  deleteUser: (userId: string, motivo?: string) => void;
  changeUserPassword: (userId: string, currentPass: string, newPass: string, isAdminOverride?: boolean) => { success: boolean; message: string };
  resetUserPasswordToDefault: (userId: string) => { success: boolean; newPassword: string; message: string };
  teams: Team[];
  
  // Settings & Toggles
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  toggleTabelaParaLideres: () => void;
  toggleSimuladorParaLideres: () => void;

  // Access Control Helpers
  canAccessTable: boolean;
  canAccessSimulator: boolean;
  canAccessTabelaVendas: boolean;
  canAccessSimulador: boolean;
  canAccessTeams: boolean;
  canAccessUsersAndTeams: boolean;
  canAccessTags: boolean;
  canAccessSimulatorRules: boolean;
  canAccessRouletteReport: boolean;
  canAccessAudit: boolean;
  canAccessBackup: boolean;

  // Tags Management
  tags: TagItem[];
  addTag: (tag: Omit<TagItem, 'id'>) => TagItem;
  updateTag: (tagId: string, updates: Partial<TagItem>) => void;
  deleteTag: (tagId: string) => void;

  // Simulator Policy Rules
  simulatorPolicyRules: SimulatorPolicyRule[];
  updateSimulatorPolicyRule: (ruleId: string, updates: Partial<SimulatorPolicyRule>) => void;
  resetSimulatorPolicyRules: () => void;

  // Teams
  addTeam: (team: Omit<Team, 'id'>) => Team;
  updateTeam: (teamId: string, updates: Partial<Team>) => void;
  deleteTeam: (teamId: string) => void;
  addMemberToTeam: (teamId: string, userId: string) => void;
  removeMemberFromTeam: (teamId: string, userId: string) => void;
  removeLeaderFromTeam: (teamId: string, deletePermanently?: boolean, motivo?: string) => void;

  // User Approvals
  approveUser: (userId: string) => void;
  rejectUser: (userId: string) => void;

  // Units
  units: Unit[];
  updateUnitStatus: (unitId: string, status: Unit['status'], clienteNome?: string, corretorNome?: string) => void;
  reserveUnitForLead: (unitId: string, leadId: string, leadNome: string) => void;
  transformReservationToPreSale: (unitId: string) => void;
  addUnit: (unit: Omit<Unit, 'id'>) => Unit;
  updateUnit: (unitId: string, updates: Partial<Unit>) => void;
  deleteUnit: (unitId: string) => void;
  getUnitById: (unitId: string) => Unit | undefined;

  // Leads & CRM
  leads: Lead[];
  caixaLeads: Lead[];
  addLead: (lead: Omit<Lead, 'id' | 'dataCadastro' | 'dataAtualizacao' | 'notas' | 'atividades'>) => { lead: Lead; duplicidade: DuplicateCheckResult };
  updateLead: (leadId: string, updates: Partial<Lead>) => void;
  updateLeadStatus: (leadId: string, newStatus: FunnelStage) => void;
  addLeadNote: (leadId: string, texto: string) => void;
  addLeadActivity: (leadId: string, tipoContato: ContactType, autor: 'corretor' | 'corretor' | 'cliente', texto: string) => { isBrokerSubject: boolean };
  checkDuplicate: (nome: string, telefone: string, email: string, excludeLeadId?: string) => DuplicateCheckResult;
  notifyDuplicateAttempt: (leadNome: string, telefone: string, email: string, leadExistente: Lead, corretorTentativa?: User) => void;
  transferLead: (leadId: string, newCorretorId: string, newTeamId: string, motivo: string) => boolean;
  sendLeadToCaixaLeads: (leadId: string, motivo: string) => void;
  claimLeadFromCaixaLeads: (leadId: string, corretorId: string) => boolean;
  aplicarFifty: (leadId: string, segundoCorretorId: string, percentual?: number) => void;
  deleteLead: (leadId: string) => void;
  deleteLeadWithAudit: (leadId: string, motivo: string) => string;
  deletedLeads: DeletedLeadRecord[];
  stagnantLeads: Lead[];

  // Notifications
  notifications: AppNotification[];
  addNotification: (notif: Omit<AppNotification, 'id' | 'dataHora' | 'lida'>) => void;
  markNotificationAsRead: (notifId: string) => void;
  markAllNotificationsAsRead: () => void;
  deleteNotification: (notifId: string) => void;
  unreadNotificationsCount: number;

  // Shift Rules
  shiftRules: ShiftRule[];
  addShiftRule: (rule: Omit<ShiftRule, 'id'>) => void;
  updateShiftRule: (ruleId: string, updates: Partial<ShiftRule>) => void;
  toggleShiftRule: (ruleId: string) => void;
  updateShiftRulesText: (novoTexto: string) => void;

  // Visits
  visits: Visit[];
  addVisit: (visit: Omit<Visit, 'id' | 'dataHora'>) => void;

  // Tasks
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'concluida'>) => void;
  toggleTask: (taskId: string) => void;
  deleteTask: (taskId: string) => void;

  // Shifts, Scales & Roulette
  scales: ShiftScale[];
  attendances: ShiftAttendance[];
  rouletteHistory: RouletteRecord[];
  addScale: (scale: Omit<ShiftScale, 'id'>) => void;
  updateAttendance: (attId: string, status: ShiftAttendance['status'], observacao?: string) => void;
  spinRoulette: (leadNome: string, leadTelefone: string, origem: 'Porta Plantão' | 'Ligação Externa' | 'Chatbot') => User | null;
  advanceRouletteQueue: () => void;
  shuffleRouletteQueue: () => void;
  markAttendanceAttended: (attId: string) => void;
  markAttendanceMountedFolder: (attId: string) => void;
  markAttendanceLeftRoulette: (attId: string, motivo: string) => void;
  markAttendanceExitedRoulette: (attId: string, motivo: string) => void;
  removeAttendanceFromOrder: (attId: string) => void;
  unmarkAbsentWithoutExit: () => number;

  // Commissions
  commissions: Commission[];
  addCommission: (commission: Omit<Commission, 'id'>) => void;
  updateCommission: (commissionId: string, data: Partial<Commission>) => void;
  deleteCommission: (commissionId: string) => void;
  updateCommissionStatus: (commissionId: string, status: Commission['status']) => void;

  // Audit Logs & Deletions
  auditLogs: AuditLog[];
  logAction: (acao: string, entidade: string, detalhes: string) => void;
  deletionLogs: DeletionAuditRecord[];
  recordDeletionAudit: (
    entityType: DeletionAuditRecord['entityType'],
    recordId: string,
    recordIdentifier: string,
    detalhes: string,
    snapshot?: any,
    motivo?: string
  ) => Promise<DeletionAuditRecord | null>;

  // Backup & Reset
  exportDatabaseJson: () => string;
  importDatabaseJson: (jsonStr: string) => boolean;
  resetToDefaults: () => void;
  resetToInitialData: () => void;
  deleteMultipleLeads: (leadIds: string[]) => void;
  deleteMultipleUnits: (unitIds: string[]) => void;
  deleteMultipleUsers: (userIds: string[]) => void;
  resetCategoryData: (category: 'leads' | 'units' | 'users' | 'tasks' | 'approvals' | 'commissions' | 'all') => void;

  // Navigation
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedUnitForSimulator: Unit | null;
  setSelectedUnitForSimulator: (unit: Unit | null) => void;
  selectedLeadForModal: Lead | null;
  setSelectedLeadForModal: (lead: Lead | null) => void;

  // Partner Agencies & Visits
  partnerAgencies: PartnerAgency[];
  addPartnerAgency: (agency: Omit<PartnerAgency, 'id'>) => void;
  updatePartnerAgency: (agencyId: string, data: Partial<PartnerAgency>) => void;
  deletePartnerAgency: (agencyId: string) => void;
  partnerVisits: PartnerVisitAttendance[];
  addPartnerVisit: (visit: Omit<PartnerVisitAttendance, 'id'>) => void;
  updatePartnerVisit: (visitId: string, data: Partial<PartnerVisitAttendance>) => void;
  deletePartnerVisit: (visitId: string) => void;

  // Password Recovery
  resetPassword: (email: string, newPass: string) => { success: boolean; message: string };

  // Proposal Approvals
  proposalApprovalRequests: ProposalApprovalRequest[];
  addProposalApprovalRequest: (req: Omit<ProposalApprovalRequest, 'id' | 'status' | 'dataSolicitacao'>) => void;
  updateProposalApprovalRequestStatus: (reqId: string, status: 'aprovado' | 'reprovado', comment?: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'jardim_vivencia_app_db_v1_10';

// Helper to guarantee admin is present without resurrecting deleted brokers
const mergeUsersWithInitial = (loadedUsers?: User[]): User[] => {
  if (!loadedUsers) {
    return initialUsers;
  }
  if (loadedUsers.length === 0) {
    const adminUser = initialUsers.find((u) => u.role === 'admin') || initialUsers[0];
    return [adminUser];
  }

  // Ensure at least one administrator account exists so access is never lost
  const adminUser = initialUsers.find((u) => u.role === 'admin') || initialUsers[0];
  const hasAdmin = loadedUsers.some((u) => u.role === 'admin');

  const baseList = hasAdmin ? [...loadedUsers] : [adminUser, ...loadedUsers];

  // Ensure strict uniqueness on both ID and Email
  const result: User[] = [];
  const seenIds = new Set<string>();
  const seenEmails = new Set<string>();

  for (const u of baseList) {
    if (!u || !u.id) continue;
    const emailKey = u.email ? u.email.trim().toLowerCase() : '';

    if (seenIds.has(u.id)) continue;
    if (emailKey && seenEmails.has(emailKey)) continue;

    seenIds.add(u.id);
    if (emailKey) seenEmails.add(emailKey);
    result.push(u);
  }

  return result;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load from local storage or defaults
  const loadInitialData = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          settings: parsed.settings || initialSettings,
          users: mergeUsersWithInitial(parsed.users || []),
          teams: parsed.teams || initialTeams,
          units: parsed.units || generate877Units(),
          leads: parsed.leads || initialLeads,
          visits: parsed.visits || initialVisits,
          tasks: parsed.tasks || initialTasks,
          scales: parsed.scales || initialScales,
          attendances: parsed.attendances || initialAttendances,
          rouletteHistory: parsed.rouletteHistory || initialRouletteHistory,
          commissions: parsed.commissions || initialCommissions,
          auditLogs: parsed.auditLogs || initialAuditLogs,
          notifications: parsed.notifications || initialNotifications,
          shiftRules: parsed.shiftRules || initialShiftRules,
          deletedLeads: parsed.deletedLeads || initialDeletedLeads,
          tags: parsed.tags || initialTags,
          simulatorPolicyRules: parsed.simulatorPolicyRules || initialSimulatorPolicyRules,
          partnerAgencies: parsed.partnerAgencies || initialPartnerAgencies,
          partnerVisits: parsed.partnerVisits || initialPartnerVisits,
          proposalApprovalRequests: parsed.proposalApprovalRequests || [],
          currentUserId: parsed.currentUserId || 'user-admin',
          isAuthenticated: parsed.isAuthenticated !== undefined ? parsed.isAuthenticated : false,
          initialUpdatedAt: parsed.updatedAt ? new Date(parsed.updatedAt).getTime() : 0,
        };
      }
    } catch (e) {
      console.warn('Error loading stored state, using defaults:', e);
    }
    return {
      settings: initialSettings,
      users: initialUsers,
      teams: initialTeams,
      units: generate877Units(),
      leads: initialLeads,
      visits: initialVisits,
      tasks: initialTasks,
      scales: initialScales,
      attendances: initialAttendances,
      rouletteHistory: initialRouletteHistory,
      commissions: initialCommissions,
      auditLogs: initialAuditLogs,
      notifications: initialNotifications,
      shiftRules: initialShiftRules,
      deletedLeads: initialDeletedLeads,
      tags: initialTags,
      simulatorPolicyRules: initialSimulatorPolicyRules,
      partnerAgencies: initialPartnerAgencies,
      partnerVisits: initialPartnerVisits,
      proposalApprovalRequests: [],
      currentUserId: 'user-admin',
      isAuthenticated: false,
      initialUpdatedAt: 0,
    };
  };

  const initialData = loadInitialData();
  const lastLocalSaveTimeRef = useRef<number>(initialData.initialUpdatedAt || 0);
  const hasUserEditedRef = useRef<boolean>(false);

  const loadDeletedUserIds = (): Set<string> => {
    try {
      const stored = localStorage.getItem('jv_deleted_user_ids');
      if (stored) {
        return new Set(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
    return new Set();
  };

  const deletedUserIdsRef = useRef<Set<string>>(loadDeletedUserIds());

  const [settings, setSettings] = useState<AppSettings>(initialData.settings);
  const [users, setUsers] = useState<User[]>(initialData.users);
  const [teams, setTeams] = useState<Team[]>(initialData.teams);
  const [units, setUnits] = useState<Unit[]>(initialData.units);
  const [leads, setLeads] = useState<Lead[]>(initialData.leads);
  const [visits, setVisits] = useState<Visit[]>(initialData.visits);
  const [tasks, setTasks] = useState<Task[]>(initialData.tasks);
  const [scales, setScales] = useState<ShiftScale[]>(initialData.scales);
  const [attendances, setAttendances] = useState<ShiftAttendance[]>(initialData.attendances);
  const [rouletteHistory, setRouletteHistory] = useState<RouletteRecord[]>(initialData.rouletteHistory);
  const [commissions, setCommissions] = useState<Commission[]>(initialData.commissions);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(initialData.auditLogs);
  const [deletionLogs, setDeletionLogs] = useState<DeletionAuditRecord[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>(initialData.notifications);
  const [shiftRules, setShiftRules] = useState<ShiftRule[]>(initialData.shiftRules);
  const [deletedLeads, setDeletedLeads] = useState<DeletedLeadRecord[]>(initialData.deletedLeads);
  const [tags, setTags] = useState<TagItem[]>(initialData.tags);
  const [simulatorPolicyRules, setSimulatorPolicyRules] = useState<SimulatorPolicyRule[]>(initialData.simulatorPolicyRules);
  const [partnerAgencies, setPartnerAgencies] = useState<PartnerAgency[]>(initialData.partnerAgencies);
  const [partnerVisits, setPartnerVisits] = useState<PartnerVisitAttendance[]>(initialData.partnerVisits);
  const [proposalApprovalRequests, setProposalApprovalRequests] = useState<ProposalApprovalRequest[]>(initialData.proposalApprovalRequests || []);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(initialData.isAuthenticated);
  
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const found = initialData.users.find((u: User) => u.id === initialData.currentUserId);
    return found || initialData.users[0];
  });

  const currentUserRef = useRef<User>(currentUser);
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  // Master State Reference - ALWAYS kept 100% up-to-date synchronously
  const stateRef = useRef({
    settings: initialData.settings,
    users: initialData.users,
    teams: initialData.teams,
    units: initialData.units,
    leads: initialData.leads,
    visits: initialData.visits,
    tasks: initialData.tasks,
    scales: initialData.scales,
    attendances: initialData.attendances,
    rouletteHistory: initialData.rouletteHistory,
    commissions: initialData.commissions,
    auditLogs: initialData.auditLogs,
    notifications: initialData.notifications,
    shiftRules: initialData.shiftRules,
    deletedLeads: initialData.deletedLeads,
    tags: initialData.tags,
    simulatorPolicyRules: initialData.simulatorPolicyRules,
    partnerAgencies: initialData.partnerAgencies,
    partnerVisits: initialData.partnerVisits,
    proposalApprovalRequests: initialData.proposalApprovalRequests || [],
    currentUserId: initialData.currentUserId,
    isAuthenticated: initialData.isAuthenticated,
    updatedAt: new Date().toISOString(),
  });

  // Master State Updater & Cloud Sync Engine
  const updateAndPersist = (updates: Record<string, any>) => {
    hasUserEditedRef.current = true;
    const nowIso = new Date().toISOString();
    lastLocalSaveTimeRef.current = new Date(nowIso).getTime();

    const newState = {
      ...stateRef.current,
      ...updates,
      currentUserId: currentUserRef.current?.id || stateRef.current.currentUserId || 'user-admin',
      updatedAt: nowIso,
    };
    stateRef.current = newState;

    if (updates.settings !== undefined) setSettings(updates.settings);
    if (updates.users !== undefined) setUsers(updates.users);
    if (updates.teams !== undefined) setTeams(updates.teams);
    if (updates.units !== undefined) setUnits(updates.units);
    if (updates.leads !== undefined) setLeads(updates.leads);
    if (updates.visits !== undefined) setVisits(updates.visits);
    if (updates.tasks !== undefined) setTasks(updates.tasks);
    if (updates.scales !== undefined) setScales(updates.scales);
    if (updates.attendances !== undefined) setAttendances(updates.attendances);
    if (updates.rouletteHistory !== undefined) setRouletteHistory(updates.rouletteHistory);
    if (updates.commissions !== undefined) setCommissions(updates.commissions);
    if (updates.auditLogs !== undefined) setAuditLogs(updates.auditLogs);
    if (updates.notifications !== undefined) setNotifications(updates.notifications);
    if (updates.shiftRules !== undefined) setShiftRules(updates.shiftRules);
    if (updates.deletedLeads !== undefined) setDeletedLeads(updates.deletedLeads);
    if (updates.tags !== undefined) setTags(updates.tags);
    if (updates.simulatorPolicyRules !== undefined) setSimulatorPolicyRules(updates.simulatorPolicyRules);
    if (updates.partnerAgencies !== undefined) setPartnerAgencies(updates.partnerAgencies);
    if (updates.partnerVisits !== undefined) setPartnerVisits(updates.partnerVisits);
    if (updates.proposalApprovalRequests !== undefined) setProposalApprovalRequests(updates.proposalApprovalRequests);
    if (updates.isAuthenticated !== undefined) setIsAuthenticated(updates.isAuthenticated);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    } catch (e) {
      console.error('LocalStorage write error:', e);
    }

    saveStateToCloud(newState, true);
  };

  const persistFullStateDirectly = (partialUpdates: Record<string, any> = {}) => {
    updateAndPersist(partialUpdates);
  };

  const [activeTab, setActiveTab] = useState<string>('boas_vindas');
  const [selectedUnitForSimulator, setSelectedUnitForSimulator] = useState<Unit | null>(null);
  const [selectedLeadForModal, setSelectedLeadForModal] = useState<Lead | null>(null);

  // Theme & Mobile Drawer States
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    return initialData.settings.theme || 'light';
  });
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);

  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
    updateAndPersist({ settings: { ...stateRef.current.settings, theme: newTheme } });
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
  };

  const toggleMobileDrawer = () => {
    setIsMobileDrawerOpen((prev) => !prev);
  };

  // Sync theme with DOM html class
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Keep selectedLeadForModal in sync with leads updates
  useEffect(() => {
    if (selectedLeadForModal) {
      const updated = leads.find((l) => l.id === selectedLeadForModal.id);
      if (updated) {
        setSelectedLeadForModal(updated);
      }
    }
  }, [leads]);

  const [isCloudHydrated, setIsCloudHydrated] = useState(false);

  // Real-time synchronization with Firestore cloud
  useEffect(() => {
    const unsubscribe = subscribeToCloudState((cloudData, exists) => {
      if (!exists) {
        console.log('No cloud database document found. App will initialize with local or default states.');
        setIsCloudHydrated(true);
        return;
      }

      if (!cloudData) {
        setIsCloudHydrated(true);
        return;
      }

      // Conflict Resolution: Compare timestamps
      if (cloudData.updatedAt) {
        const cloudTime = new Date(cloudData.updatedAt).getTime();
        const localTime = lastLocalSaveTimeRef.current || 0;

        // If local state (from LocalStorage or current session) is newer than Firestore cloud data, preserve local state & sync up
        if (localTime > 0 && localTime > cloudTime) {
          console.log('Local state is newer than cloud snapshot. Preserving local state and pushing to cloud...', { localTime, cloudTime });
          setIsCloudHydrated(true);
          if (stateRef.current) {
            saveStateToCloud(stateRef.current, true);
          }
          return;
        }

        if (cloudTime) {
          lastLocalSaveTimeRef.current = cloudTime;
        }
      }

      if (cloudData.settings) {
        stateRef.current.settings = cloudData.settings;
        setSettings((prev) => (JSON.stringify(prev) === JSON.stringify(cloudData.settings) ? prev : cloudData.settings));
      }

      if (cloudData.users) {
        // Strict Deletion Protection: Filter out any users known to be deleted
        const activeUsers = (cloudData.users as User[]).filter((u) => !deletedUserIdsRef.current.has(u.id));
        const merged = mergeUsersWithInitial(activeUsers);
        stateRef.current.users = merged;
        setUsers((prev) => (JSON.stringify(prev) === JSON.stringify(merged) ? prev : merged));

        // Sync currentUser if updated in users array
        setCurrentUser((prev) => {
          const updated = merged.find((u: User) => u.id === prev.id);
          if (updated && JSON.stringify(prev) !== JSON.stringify(updated)) {
            return updated;
          }
          return prev;
        });
      }

      if (cloudData.teams) {
        const sanitizedTeams = (cloudData.teams as Team[]).map((t) => {
          const isLeaderDeleted = t.leaderId && deletedUserIdsRef.current.has(t.leaderId);
          const sanitizedMembers = (t.memberIds || []).filter((id) => !deletedUserIdsRef.current.has(id));
          if (isLeaderDeleted) {
            return {
              ...t,
              leaderId: '',
              leaderName: 'Líder Não Definido',
              memberIds: sanitizedMembers,
            };
          }
          return {
            ...t,
            memberIds: sanitizedMembers,
          };
        });
        stateRef.current.teams = sanitizedTeams;
        setTeams((prev) => (JSON.stringify(prev) === JSON.stringify(sanitizedTeams) ? prev : sanitizedTeams));
      }
      if (cloudData.units) {
        stateRef.current.units = cloudData.units;
        setUnits((prev) => (JSON.stringify(prev) === JSON.stringify(cloudData.units) ? prev : cloudData.units));
      }
      if (cloudData.leads) {
        stateRef.current.leads = cloudData.leads;
        setLeads((prev) => (JSON.stringify(prev) === JSON.stringify(cloudData.leads) ? prev : cloudData.leads));
      }
      if (cloudData.visits) {
        stateRef.current.visits = cloudData.visits;
        setVisits((prev) => (JSON.stringify(prev) === JSON.stringify(cloudData.visits) ? prev : cloudData.visits));
      }
      if (cloudData.tasks) {
        stateRef.current.tasks = cloudData.tasks;
        setTasks((prev) => (JSON.stringify(prev) === JSON.stringify(cloudData.tasks) ? prev : cloudData.tasks));
      }
      if (cloudData.scales) {
        stateRef.current.scales = cloudData.scales;
        setScales((prev) => (JSON.stringify(prev) === JSON.stringify(cloudData.scales) ? prev : cloudData.scales));
      }
      if (cloudData.attendances) {
        stateRef.current.attendances = cloudData.attendances;
        setAttendances((prev) => (JSON.stringify(prev) === JSON.stringify(cloudData.attendances) ? prev : cloudData.attendances));
      }
      if (cloudData.rouletteHistory) {
        stateRef.current.rouletteHistory = cloudData.rouletteHistory;
        setRouletteHistory((prev) => (JSON.stringify(prev) === JSON.stringify(cloudData.rouletteHistory) ? prev : cloudData.rouletteHistory));
      }
      if (cloudData.commissions) {
        stateRef.current.commissions = cloudData.commissions;
        setCommissions((prev) => (JSON.stringify(prev) === JSON.stringify(cloudData.commissions) ? prev : cloudData.commissions));
      }
      if (cloudData.auditLogs) {
        stateRef.current.auditLogs = cloudData.auditLogs;
        setAuditLogs((prev) => (JSON.stringify(prev) === JSON.stringify(cloudData.auditLogs) ? prev : cloudData.auditLogs));
      }
      if (cloudData.notifications) {
        stateRef.current.notifications = cloudData.notifications;
        setNotifications((prev) => (JSON.stringify(prev) === JSON.stringify(cloudData.notifications) ? prev : cloudData.notifications));
      }
      if (cloudData.shiftRules) {
        stateRef.current.shiftRules = cloudData.shiftRules;
        setShiftRules((prev) => (JSON.stringify(prev) === JSON.stringify(cloudData.shiftRules) ? prev : cloudData.shiftRules));
      }
      if (cloudData.deletedLeads) {
        stateRef.current.deletedLeads = cloudData.deletedLeads;
        setDeletedLeads((prev) => (JSON.stringify(prev) === JSON.stringify(cloudData.deletedLeads) ? prev : cloudData.deletedLeads));
      }
      if (cloudData.tags) {
        stateRef.current.tags = cloudData.tags;
        setTags((prev) => (JSON.stringify(prev) === JSON.stringify(cloudData.tags) ? prev : cloudData.tags));
      }
      if (cloudData.simulatorPolicyRules) {
        stateRef.current.simulatorPolicyRules = cloudData.simulatorPolicyRules;
        setSimulatorPolicyRules((prev) => (JSON.stringify(prev) === JSON.stringify(cloudData.simulatorPolicyRules) ? prev : cloudData.simulatorPolicyRules));
      }
      if (cloudData.partnerAgencies) {
        stateRef.current.partnerAgencies = cloudData.partnerAgencies;
        setPartnerAgencies((prev) => (JSON.stringify(prev) === JSON.stringify(cloudData.partnerAgencies) ? prev : cloudData.partnerAgencies));
      }
      if (cloudData.partnerVisits) {
        stateRef.current.partnerVisits = cloudData.partnerVisits;
        setPartnerVisits((prev) => (JSON.stringify(prev) === JSON.stringify(cloudData.partnerVisits) ? prev : cloudData.partnerVisits));
      }
      if (cloudData.proposalApprovalRequests) {
        stateRef.current.proposalApprovalRequests = cloudData.proposalApprovalRequests;
        setProposalApprovalRequests((prev) => (JSON.stringify(prev) === JSON.stringify(cloudData.proposalApprovalRequests) ? prev : cloudData.proposalApprovalRequests));
      }
      if (cloudData.isAuthenticated !== undefined) {
        stateRef.current.isAuthenticated = cloudData.isAuthenticated;
        setIsAuthenticated((prev) => (prev === cloudData.isAuthenticated ? prev : cloudData.isAuthenticated));
      }
      console.log('Successfully synchronized state from Firestore cloud in real time.');
      setIsCloudHydrated(true);
    });

    return () => unsubscribe();
  }, []);

  // Universal Auto-Sync Effect: Whenever ANY React state changes, persist immediately to LocalStorage and debounce push to Firestore
  useEffect(() => {
    if (!isCloudHydrated) return;

    const nowIso = new Date().toISOString();
    lastLocalSaveTimeRef.current = new Date(nowIso).getTime();

    const dbState = {
      settings,
      users,
      teams,
      units,
      leads,
      visits,
      tasks,
      scales,
      attendances,
      rouletteHistory,
      commissions,
      auditLogs,
      notifications,
      shiftRules,
      deletedLeads,
      tags,
      simulatorPolicyRules,
      partnerAgencies,
      partnerVisits,
      proposalApprovalRequests,
      currentUserId: currentUser?.id || 'user-admin',
      isAuthenticated,
      updatedAt: nowIso,
    };

    stateRef.current = dbState;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dbState));
    } catch (e) {
      console.error('LocalStorage save error:', e);
    }

    const timer = setTimeout(() => {
      saveStateToCloud(dbState);
    }, 1000);

    return () => clearTimeout(timer);
  }, [
    isCloudHydrated,
    settings,
    users,
    teams,
    units,
    leads,
    visits,
    tasks,
    scales,
    attendances,
    rouletteHistory,
    commissions,
    auditLogs,
    notifications,
    shiftRules,
    deletedLeads,
    tags,
    simulatorPolicyRules,
    partnerAgencies,
    partnerVisits,
    proposalApprovalRequests,
    currentUser,
    isAuthenticated,
  ]);

  // Real-time synchronization for Deletion Audit Logs
  useEffect(() => {
    const unsubDeletion = subscribeToDeletionLogs((logs) => {
      if (logs) {
        setDeletionLogs(logs);
        logs.forEach((l) => {
          if (l.entityType === 'usuario_corretor' && l.recordId) {
            deletedUserIdsRef.current.add(l.recordId);
          }
        });
        try {
          localStorage.setItem('jv_deleted_user_ids', JSON.stringify(Array.from(deletedUserIdsRef.current)));
        } catch {
          // ignore
        }
      }
    });
    return () => {
      unsubDeletion();
    };
  }, []);

  // Immediate cloud save helper function for critical edits
  const forceSaveToCloudImmediate = () => {
    updateAndPersist({});
  };

  // Immediate Save on page switch or window close/minimize/refresh
  useEffect(() => {
    const handleSave = () => {
      if (isCloudHydrated) {
        console.log('Window closing or page hidden. Saving state immediately to LocalStorage and Firestore...');
        forceSaveToCloudImmediate();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleSave();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleSave);
    window.addEventListener('pagehide', handleSave);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleSave);
      window.removeEventListener('pagehide', handleSave);
    };
  }, [isCloudHydrated]);

  const loginDetailed = (
    email: string,
    password?: string
  ): { success: boolean; reason: 'not_found' | 'invalid_password' | 'inactive' | 'success'; message: string } => {
    const cleanEmail = email.trim().toLowerCase();
    let user = users.find((u) => u.email.trim().toLowerCase() === cleanEmail);

    // Fallback if admin is somehow not currently in state array
    if (!user) {
      const initialMatch = initialUsers.find((iu) => iu.email.trim().toLowerCase() === cleanEmail);
      if (initialMatch && initialMatch.role === 'admin') {
        user = initialMatch;
        setUsers((prev) => {
          const exists = prev.some((u) => u.email.trim().toLowerCase() === cleanEmail);
          return exists ? prev : [...prev, initialMatch];
        });
      }
    }

    if (!user) {
      return {
        success: false,
        reason: 'not_found',
        message: 'E-mail não cadastrado no sistema. Apenas usuários previamente autorizados pelo Administrador possuem permissão de acesso.',
      };
    }

    if (user.active === false) {
      return {
        success: false,
        reason: 'inactive',
        message: 'Este usuário está inativo no sistema. Entre em contato com a Diretoria/Administração para reativação do acesso.',
      };
    }

    const effectiveUserPassword = user.password || 'admin';
    const cleanPassword = (password || '').trim();

    if (cleanPassword !== effectiveUserPassword) {
      return {
        success: false,
        reason: 'invalid_password',
        message: 'Senha incorreta. Verifique os caracteres digitados ou solicite ao Administrador a redefinição de sua senha.',
      };
    }

    setCurrentUser(user);
    setIsAuthenticated(true);
    logAction(
      'Login no Sistema',
      'Autenticação',
      `Usuário ${user.name} (${user.email} - ${user.role.toUpperCase()}) efetuou login com sucesso.`
    );
    return {
      success: true,
      reason: 'success',
      message: 'Login realizado com sucesso!',
    };
  };

  const login = (email: string, password?: string): boolean => {
    const result = loginDetailed(email, password);
    return result.success;
  };

  const logout = () => {
    logAction(
      'Logout do Sistema',
      'Autenticação',
      `Usuário ${currentUser.name} encerrou a sessão.`
    );
    setIsAuthenticated(false);
  };

  const logAction = (acao: string, entidade: string, detalhes: string) => {
    const now = new Date();
    const formatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    
    const newLog: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: formatted,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      acao,
      entidade,
      detalhes,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const recordDeletionAudit = async (
    entityType: DeletionAuditRecord['entityType'],
    recordId: string,
    recordIdentifier: string,
    detalhes: string,
    snapshot?: any,
    motivo?: string
  ): Promise<DeletionAuditRecord | null> => {
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    const protocol = `DEL-${dateStr}-${randomHex}`;

    const record: DeletionAuditRecord = {
      id: protocol,
      timestamp: now.toISOString(),
      dataHoraFormatada: now.toLocaleString('pt-BR'),
      deletedBy: {
        userId: currentUser.id,
        userName: currentUser.name,
        userEmail: currentUser.email,
        userRole: currentUser.role,
      },
      entityType,
      recordId,
      recordIdentifier,
      detalhes,
      motivo: motivo || 'Exclusão autorizada pelo Administrador.',
      snapshot: snapshot ? JSON.parse(JSON.stringify(snapshot)) : undefined,
    };

    // Update local deletion logs
    setDeletionLogs((prev) => [record, ...prev]);

    // Persist directly to Firestore collection deletion_audit_logs
    try {
      await logDeletionToFirestore(record);
    } catch (err) {
      console.warn('Erro ao registrar log de exclusão no Firestore:', err);
    }

    // Mirror to general auditLogs
    const formatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    const newLog: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: formatted,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      acao: `Exclusão: ${entityType.toUpperCase()}`,
      entidade: 'Auditoria de Exclusões',
      detalhes: `[${protocol}] "${recordIdentifier}" excluído por ${currentUser.name} (${currentUser.role}). ${detalhes}`,
      recordId,
      snapshot: record.snapshot,
    };
    setAuditLogs((prev) => [newLog, ...prev]);

    return record;
  };

  // Change Password by User or Admin
  const changeUserPassword = (
    userId: string,
    currentPass: string,
    newPass: string,
    isAdminOverride = false
  ): { success: boolean; message: string } => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) {
      return { success: false, message: 'Usuário não encontrado.' };
    }

    if (!isAdminOverride && currentUser.role !== 'admin') {
      const effectiveCurrent = targetUser.password || 'admin';
      if (currentPass.trim() !== effectiveCurrent) {
        return { success: false, message: 'A senha atual informada está incorreta.' };
      }
    }

    if (!newPass || newPass.trim().length < 4) {
      return { success: false, message: 'A nova senha deve ter no mínimo 4 caracteres.' };
    }

    const trimmedNewPass = newPass.trim();

    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const updated = { ...u, password: trimmedNewPass };
          if (currentUser.id === userId) {
            setCurrentUser(updated);
          }
          return updated;
        }
        return u;
      })
    );

    logAction(
      'Alteração de Senha',
      'Segurança e Acesso',
      `Senha do usuário ${targetUser.name} (${targetUser.email}) foi alterada ${isAdminOverride ? 'pelo Administrador' : 'pelo próprio usuário'}.`
    );

    return { success: true, message: 'Senha atualizada com sucesso!' };
  };

  // Reset User Password to standard default '123456'
  const resetUserPasswordToDefault = (userId: string): { success: boolean; newPassword: string; message: string } => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) {
      return { success: false, newPassword: '', message: 'Usuário não encontrado.' };
    }

    const defaultPass = 'admin';
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const updated = { ...u, password: defaultPass };
          if (currentUser.id === userId) {
            setCurrentUser(updated);
          }
          return updated;
        }
        return u;
      })
    );

    logAction(
      'Redefinição de Senha',
      'Segurança e Acesso',
      `Senha do usuário ${targetUser.name} (${targetUser.email}) foi resetada para a senha padrão ("${defaultPass}") pelo Administrador.`
    );

    return {
      success: true,
      newPassword: defaultPass,
      message: `Senha de ${targetUser.name} redefinida para a senha padrão inicial "${defaultPass}".`,
    };
  };

  // User Management CRUD
  const addUser = (userData: Omit<User, 'id'>): User => {
    const cleanEmail = userData.email.trim();
    const initialPassword = userData.password && userData.password.trim().length > 0 ? userData.password.trim() : 'admin';

    // Check if created by gestor or if role is corretor registered by gestor
    const needsAdminApproval = currentUser.role === 'gestor' || currentUser.role === 'coordenador' || (userData.role === 'corretor' && currentUser.role !== 'admin');
    const isPending = needsAdminApproval;

    const newUser: User = {
      ...userData,
      email: cleanEmail,
      password: initialPassword,
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      salesCount: userData.salesCount || 0,
      totalVgv: userData.totalVgv || 0,
      commissionRate: userData.commissionRate || (userData.role === 'gestor' ? 2.2 : userData.role === 'admin' ? 2.5 : 2.0),
      active: isPending ? false : (userData.active !== undefined ? userData.active : true),
      statusAprovacao: isPending ? 'pendente' : 'aprovado',
      criadoPorId: currentUser.id,
      criadoPorNome: currentUser.name,
      dataCriacao: new Date().toLocaleDateString('pt-BR'),
    };

    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);

    if (isPending) {
      logAction(
        'Solicitação de Cadastro de Corretor',
        'Gestão de Usuários',
        `O gestor ${currentUser.name} cadastrou o corretor ${newUser.name} (${newUser.email}). Cadastro enviado para aprovação do Administrador.`
      );
      addNotification({
        tipo: 'aprovacao_corretor' as any,
        titulo: '🔔 Novo Corretor Pendente de Aprovação',
        mensagem: `O gestor ${currentUser.name} cadastrou o corretor ${newUser.name}. Clique para aprovar o acesso dele ao sistema.`,
        destinatarioRole: 'admin',
        linkTab: 'usuarios',
      });
    } else {
      logAction(
        'Cadastro de Usuário',
        'Gestão de Usuários',
        `Novo usuário cadastrado: ${newUser.name} (${newUser.email}) - Cargo: ${newUser.role.toUpperCase()} - Senha inicial definida.`
      );
    }

    persistFullStateDirectly({ users: updatedUsers });

    return newUser;
  };

  const approveUser = (userId: string) => {
    const targetUser = users.find((u) => u.id === userId);
    const updatedUsers = users.map((u) => (u.id === userId ? { ...u, statusAprovacao: 'aprovado' as const, active: true } : u));
    setUsers(updatedUsers);
    logAction(
      'Aprovação de Corretor',
      'Gestão de Usuários',
      `O Administrador aprovou o cadastro do corretor "${targetUser?.name || userId}" e liberou o acesso ao sistema.`
    );
    addNotification({
      tipo: 'sistema',
      titulo: '✅ Cadastro Aprovado pelo Administrador',
      mensagem: `Seu acesso ao sistema foi liberado pelo Administrador. Você já pode acessar todas as ferramentas do CRM.`,
      destinatarioUserId: userId,
      linkTab: 'dashboard',
    });
    persistFullStateDirectly({ users: updatedUsers });
  };

  const rejectUser = (userId: string) => {
    const targetUser = users.find((u) => u.id === userId);
    const updatedUsers = users.map((u) => (u.id === userId ? { ...u, statusAprovacao: 'rejeitado' as const, active: false } : u));
    setUsers(updatedUsers);
    logAction(
      'Rejeição de Corretor',
      'Gestão de Usuários',
      `O Administrador rejeitou a solicitação de cadastro do corretor "${targetUser?.name || userId}".`
    );
    persistFullStateDirectly({ users: updatedUsers });
  };

  const updateUser = (userId: string, updates: Partial<User>) => {
    const updatedUsers = users.map((u) => {
      if (u.id === userId) {
        const updated = { ...u, ...updates };
        logAction(
          'Atualização de Usuário',
          'Gestão de Usuários',
          `Dados do usuário ${u.name} atualizados.`
        );
        if (currentUser.id === userId) {
          setCurrentUser(updated);
        }
        return updated;
      }
      return u;
    });
    setUsers(updatedUsers);
    persistFullStateDirectly({ users: updatedUsers });
  };

  const deleteUser = (userId: string, motivo?: string) => {
    if (currentUser.role !== 'admin') {
      alert('Acesso negado: Apenas usuários com perfil Administrador podem excluir corretores e usuários do sistema.');
      logAction('Tentativa de Exclusão Bloqueada', 'Segurança', `Usuário ${currentUser.name} (${currentUser.role}) tentou excluir usuário ID ${userId} sem autorização.`);
      return;
    }
    const target = users.find((u) => u.id === userId);
    if (!target) return;
    if (target.id === currentUser.id) {
      alert('Não é possível excluir o usuário que está conectado no momento!');
      return;
    }

    // Register into persistent deletedUserIds set
    deletedUserIdsRef.current.add(userId);
    try {
      localStorage.setItem('jv_deleted_user_ids', JSON.stringify(Array.from(deletedUserIdsRef.current)));
    } catch {
      // ignore
    }

    // 1. Remove user from users list
    const updatedUsers = users.filter((u) => u.id !== userId);

    // 2. Cascade cleanup from all teams (both as leader and as member)
    const updatedTeams = teams.map((team) => {
      const isLeader = team.leaderId === userId;
      const isMember = (team.memberIds || []).includes(userId);
      if (!isLeader && !isMember) return team;
      return {
        ...team,
        leaderId: isLeader ? '' : team.leaderId,
        leaderName: isLeader ? 'Líder Não Definido' : team.leaderName,
        memberIds: (team.memberIds || []).filter((id) => id !== userId),
      };
    });

    // 3. Cascade cleanup from shift scales
    const updatedScales = scales.map((s) => ({
      ...s,
      corretorIds: (s.corretorIds || []).filter((id) => id !== userId),
    }));

    // 4. Cascade cleanup from shift attendances
    const updatedAttendances = attendances.filter((a) => a.corretorId !== userId);

    // 5. Cascade cleanup from roulette history
    const updatedRouletteHistory = rouletteHistory.filter((r) => r.corretorId !== userId);

    // Update React states immediately
    setUsers(updatedUsers);
    setTeams(updatedTeams);
    setScales(updatedScales);
    setAttendances(updatedAttendances);
    setRouletteHistory(updatedRouletteHistory);

    recordDeletionAudit(
      'usuario_corretor',
      target.id,
      `${target.name} (${target.role.toUpperCase()} - CRECI: ${target.creci || 'S/N'})`,
      `Usuário/corretor ${target.name} (${target.email}) removido definitivamente pelo Administrador.`,
      target,
      motivo || 'Exclusão definitiva de usuário pelo Administrador'
    );

    // Synchronously and permanently persist to LocalStorage and Firestore Cloud immediately
    persistFullStateDirectly({
      users: updatedUsers,
      teams: updatedTeams,
      scales: updatedScales,
      attendances: updatedAttendances,
      rouletteHistory: updatedRouletteHistory,
    });
  };

  // Tags Management CRUD
  const addTag = (tagData: Omit<TagItem, 'id'>): TagItem => {
    const colorClasses: Record<string, { bg: string; text: string; border: string }> = {
      emerald: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-300' },
      teal: { bg: 'bg-teal-50', text: 'text-teal-800', border: 'border-teal-300' },
      blue: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-300' },
      cyan: { bg: 'bg-cyan-50', text: 'text-cyan-800', border: 'border-cyan-300' },
      purple: { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-300' },
      amber: { bg: 'bg-amber-50', text: 'text-amber-900', border: 'border-amber-300' },
      rose: { bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-300' },
      orange: { bg: 'bg-orange-50', text: 'text-orange-900', border: 'border-orange-300' },
      indigo: { bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-300' },
      slate: { bg: 'bg-slate-50', text: 'text-slate-800', border: 'border-slate-300' },
    };

    const c = colorClasses[tagData.cor] || colorClasses.emerald;
    const newTag: TagItem = {
      ...tagData,
      id: `tag-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      bgClass: tagData.bgClass || `${c.bg} ${c.text} ${c.border}`,
      textClass: tagData.textClass || c.text,
      borderClass: tagData.borderClass || c.border,
    };

    const currentTags = stateRef.current.tags || [];
    const updatedTags = [...currentTags, newTag];
    logAction('Nova Tag Cadastrada', 'Cadastro de Tags', `Tag "${newTag.nome}" criada na categoria ${newTag.categoria}.`);
    updateAndPersist({ tags: updatedTags });
    return newTag;
  };

  const updateTag = (tagId: string, updates: Partial<TagItem>) => {
    const currentTags = stateRef.current.tags || [];
    const updatedTags = currentTags.map((t) => {
      if (t.id === tagId) {
        const updated = { ...t, ...updates };
        logAction('Tag Atualizada', 'Cadastro de Tags', `Tag "${t.nome}" atualizada.`);
        return updated;
      }
      return t;
    });
    updateAndPersist({ tags: updatedTags });
  };

  const deleteTag = (tagId: string) => {
    const currentTags = stateRef.current.tags || [];
    const target = currentTags.find((t) => t.id === tagId);
    if (!target) return;
    const updatedTags = currentTags.filter((t) => t.id !== tagId);
    logAction('Tag Excluída', 'Cadastro de Tags', `Tag "${target.nome}" foi removida do sistema.`);
    updateAndPersist({ tags: updatedTags });
  };

  // Simulator Policy Rules CRUD
  const updateSimulatorPolicyRule = (ruleId: string, updates: Partial<SimulatorPolicyRule>) => {
    setSimulatorPolicyRules((prev) =>
      prev.map((r) => {
        if (r.id === ruleId) {
          const updated = { ...r, ...updates };
          logAction(
            'Regra do Simulador Atualizada',
            'Regras do Simulador',
            `Regra "${r.titulo}" alterada para valor: ${updates.valorAtual ?? r.valorAtual}.`
          );
          return updated;
        }
        return r;
      })
    );
  };

  const resetSimulatorPolicyRules = () => {
    setSimulatorPolicyRules(initialSimulatorPolicyRules);
    logAction('Reset de Regras do Simulador', 'Regras do Simulador', 'Regras do simulador restauradas aos parâmetros padrão.');
  };

  // Proposal Approvals Helpers
  const addProposalApprovalRequest = (
    reqData: Omit<ProposalApprovalRequest, 'id' | 'status' | 'dataSolicitacao'>
  ) => {
    const now = new Date();
    const formatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    
    const newReq: ProposalApprovalRequest = {
      ...reqData,
      id: `apprv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      status: 'pendente',
      dataSolicitacao: formatted,
    };
    
    setProposalApprovalRequests((prev) => [newReq, ...prev]);

    logAction(
      'Nova Solicitação de Aprovação',
      'Aprovações da Diretoria',
      `Solicitada aprovação para o cliente ${newReq.clienteNome} (Unidade ${newReq.unidadeIdentificacao}) por ${newReq.corretorNome}. Justificativa: ${newReq.justificativa}`
    );

    // Call simulated Cloud Function API endpoint
    fetch('/api/cloud-functions/on-approval-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newReq)
    }).catch(err => {
      console.warn('Could not contact Cloud Function API endpoint, operating in offline/decoupled mode:', err);
    });
  };

  const updateProposalApprovalRequestStatus = (
    reqId: string,
    status: 'aprovado' | 'reprovado',
    comment = ''
  ) => {
    const now = new Date();
    const formatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    setProposalApprovalRequests((prev) =>
      prev.map((req): ProposalApprovalRequest => {
        if (req.id === reqId) {
          const updatedReq: ProposalApprovalRequest = {
            ...req,
            status,
            dataResposta: formatted,
            respondidoPorId: currentUser.id,
            respondidoPorNome: currentUser.name,
            parecerDiretoria: comment,
          };

          // Trigger system notification to the requesting broker
          addNotification({
            tipo: 'sistema',
            titulo: status === 'aprovado' ? '✅ Solicitação Aprovada' : '❌ Solicitação Reprovada',
            mensagem: `Sua solicitação de aprovação para o cliente ${req.clienteNome} (Unidade ${req.unidadeIdentificacao}) foi ${status} por ${currentUser.name}. Parecer: ${comment || 'Sem observações.'}`,
            destinatarioUserId: req.corretorId,
            linkTab: 'aprovações',
          });

          logAction(
            status === 'aprovado' ? 'Aprovação Concedida' : 'Aprovação Recusada',
            'Aprovações da Diretoria',
            `Solicitação de ${req.corretorNome} para ${req.clienteNome} foi ${status} por ${currentUser.name}. Parecer: ${comment || 'Sem observações.'}`
          );

          // Update active unit status if approved
          if (status === 'aprovado' && req.unitId) {
            updateUnitStatus(req.unitId, 'analise', req.clienteNome, req.corretorNome);
          }

          return updatedReq;
        }
        return req;
      })
    );
  };

  // Notifications Helpers
  const addNotification = (notifData: Omit<AppNotification, 'id' | 'dataHora' | 'lida'>) => {
    const now = new Date();
    const formatted = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newNotif: AppNotification = {
      ...notifData,
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      dataHora: formatted,
      lida: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);

    // Check if the current user is a recipient of this notification
    let isRecipientOfNotification = false;
    if (!newNotif.destinatarioUserId && !newNotif.destinatarioRole && !newNotif.equipeId) {
      isRecipientOfNotification = true;
    } else {
      if (newNotif.destinatarioUserId === currentUser?.id) {
        isRecipientOfNotification = true;
      } else if (newNotif.destinatarioRole === 'todos') {
        isRecipientOfNotification = true;
      } else if (newNotif.destinatarioRole === 'admin' && currentUser?.role === 'admin') {
        isRecipientOfNotification = true;
      } else if (newNotif.destinatarioRole === 'gestor' && (currentUser?.role === 'gestor' || currentUser?.role === 'admin' || currentUser?.role === 'coordenador')) {
        isRecipientOfNotification = true;
      } else if (newNotif.equipeId && currentUser?.teamId && newNotif.equipeId === currentUser?.teamId) {
        isRecipientOfNotification = true;
      }
    }

    // Trigger sound chime & FCM/Native Browser Push Notification
    if (isRecipientOfNotification) {
      playNotificationChime(newNotif.tipo === 'aprovacao_diretoria' ? 'approval' : 'lead');

      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        const title = newNotif.titulo || 'OTS Master CRM';
        const body = newNotif.mensagem || 'Você tem um novo alerta!';
        
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.ready.then((registration) => {
            registration.showNotification(title, {
              body,
              icon: '/icon.png',
              badge: '/icon.png',
              tag: `crm-notif-${newNotif.id}`,
              data: { url: window.location.href }
            });
          });
        } else {
          new Notification(title, { body, icon: '/icon.png' });
        }
      }
    }
  };

  const markNotificationAsRead = (notifId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, lida: true } : n))
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, lida: true })));
  };

  const deleteNotification = (notifId: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notifId));
  };

  const unreadNotificationsCount = useMemo(() => {
    return notifications.filter((n) => {
      if (n.lida) return false;
      if (n.destinatarioUserId && n.destinatarioUserId !== currentUser.id) return false;
      if (n.destinatarioRole === 'admin' && currentUser.role !== 'admin') return false;
      if (n.destinatarioRole === 'gestor' && currentUser.role !== 'gestor' && currentUser.role !== 'admin' && currentUser.role !== 'coordenador') return false;
      if (n.equipeId && currentUser.teamId && n.equipeId !== currentUser.teamId && currentUser.role !== 'admin' && currentUser.role !== 'coordenador') return false;
      return true;
    }).length;
  }, [notifications, currentUser]);

  // Stagnant Leads Calculation (Pre-registrations > 7 days without update)
  const stagnantLeads = useMemo(() => {
    const today = new Date();
    return leads.filter((lead) => {
      if (lead.naCaixaDeLeads) return false;
      if (lead.status !== 'pre_cadastro') return false;
      const updatedDate = new Date(lead.dataAtualizacao || lead.dataCadastro);
      const diffTime = Math.abs(today.getTime() - updatedDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 7;
    });
  }, [leads]);

  // Leads na Caixa de Leads (Pool de Resgate)
  const caixaLeads = useMemo(() => {
    return leads.filter((lead) => lead.naCaixaDeLeads);
  }, [leads]);

  const switchUserById = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (target) {
      setCurrentUser(target);
      logAction('Troca de Perfil de Acesso', 'Autenticação', `Usuário ativo alterado para ${target.name} (${target.role.toUpperCase()}).`);
    }
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      logAction('Atualização de Configurações', 'Configurações do Sistema', `Configurações atualizadas por ${currentUser.name}.`);
      return updated;
    });
  };

  const toggleTabelaParaLideres = () => {
    setSettings((prev) => {
      const nextVal = !prev.liberarTabelaParaLideres;
      logAction(
        nextVal ? 'Liberação de Ferramenta' : 'Bloqueio de Ferramenta',
        'Tabela de Vendas',
        `Tabela de Vendas ${nextVal ? 'liberada' : 'bloqueada'} para líderes/gestores por ${currentUser.name}.`
      );
      return { ...prev, liberarTabelaParaLideres: nextVal };
    });
  };

  const toggleSimuladorParaLideres = () => {
    setSettings((prev) => {
      const nextVal = !prev.liberarSimuladorParaLideres;
      logAction(
        nextVal ? 'Liberação de Ferramenta' : 'Bloqueio de Ferramenta',
        'Simulador CEF',
        `Simulador de Financiamento ${nextVal ? 'liberado' : 'bloqueado'} para líderes/gestores por ${currentUser.name}.`
      );
      return { ...prev, liberarSimuladorParaLideres: nextVal };
    });
  };

  // Permission Logic
  const canAccessTable = isFullAdmin(currentUser.role) || currentUser.role === 'coordenador' || (settings.liberarTabelaParaLideres && currentUser.role === 'gestor');
  const canAccessSimulator = isFullAdmin(currentUser.role) || currentUser.role === 'coordenador' || (settings.liberarSimuladorParaLideres && currentUser.role === 'gestor');
  const canAccessTeams = isFullAdmin(currentUser.role) || currentUser.role === 'coordenador' || currentUser.role === 'gestor';
  const canAccessUsersAndTeams = isFullAdmin(currentUser.role) || currentUser.role === 'coordenador' || currentUser.role === 'gestor';
  const canAccessTags = true;
  const canAccessSimulatorRules = true;
  const canAccessRouletteReport = isFullAdmin(currentUser.role) || currentUser.role === 'coordenador';
  const canAccessAudit = isFullAdmin(currentUser.role);
  const canAccessBackup = isFullAdmin(currentUser.role);

  // Unit Operations
  const updateUnitStatus = (
    unitId: string,
    status: Unit['status'],
    clienteNome?: string,
    corretorNome?: string
  ) => {
    let updatedUnits: Unit[] = [];
    setUnits((prev) => {
      updatedUnits = prev.map((u) => {
        if (u.id === unitId) {
          const updated = {
            ...u,
            status,
            clienteNome: clienteNome || (status === 'disponivel' ? undefined : u.clienteNome),
            corretorNome: corretorNome || (status === 'disponivel' ? undefined : u.corretorNome),
            dataReserva: status === 'reservado' ? new Date().toISOString().split('T')[0] : u.dataReserva,
          };
          logAction(
            `Alteração de Status de Unidade (${status.toUpperCase()})`,
            'Tabela de Vendas',
            `Unidade ${u.quadra} ${u.lote} atualizada para ${status}.`
          );
          return updated;
        }
        return u;
      });
      return updatedUnits;
    });
    persistFullStateDirectly({ units: updatedUnits });
  };

  const reserveUnitForLead = (unitId: string, leadId: string, leadNome: string) => {
    const now = new Date();
    const expiracao = new Date(now.getTime() + 72 * 3600 * 1000).toISOString();
    let updatedUnits: Unit[] = [];

    setUnits((prev) => {
      updatedUnits = prev.map((u) => {
        if (u.id === unitId) {
          return {
            ...u,
            status: 'reservado',
            reservaLeadId: leadId,
            reservaLeadNome: leadNome,
            clienteId: leadId,
            clienteNome: leadNome,
            reservadoPorCorretorId: currentUser.id,
            reservadoPorCorretorNome: currentUser.name,
            dataReserva: now.toISOString(),
            dataExpiracaoReserva: expiracao,
            comprovanteAtoAnexado: false,
          };
        }
        return u;
      });
      return updatedUnits;
    });

    const lead = leads.find((l) => l.id === leadId);
    if (lead) {
      addLeadActivity(
        leadId,
        'outro',
        'corretor',
        `📌 Reserva da Unidade ${unitId} efetuada por ${currentUser.name} para o cliente ${leadNome}. Validade do ato de 72 horas (até ${new Date(expiracao).toLocaleString('pt-BR')}).`
      );
    }

    logAction(
      'Reserva de Unidade (72h)',
      'Espelho de Vendas',
      `Unidade ${unitId} reservada por ${currentUser.name} para ${leadNome}. Prazo de 72h para comprovante do ato.`
    );

    persistFullStateDirectly({ units: updatedUnits });
  };

  const transformReservationToPreSale = (unitId: string) => {
    const targetUnit = units.find((u) => u.id === unitId);
    if (!targetUnit) return;
    let updatedUnits: Unit[] = [];

    setUnits((prev) => {
      updatedUnits = prev.map((u) => {
        if (u.id === unitId) {
          return {
            ...u,
            status: 'em_processo',
          };
        }
        return u;
      });
      return updatedUnits;
    });

    if (targetUnit.reservaLeadId) {
      updateLeadStatus(targetUnit.reservaLeadId, 'doc_coletada');
      addLeadActivity(
        targetUnit.reservaLeadId,
        'outro',
        'corretor',
        `🚀 Reserva da Unidade ${targetUnit.identificacao || targetUnit.lote} transformada em PRE-VENDA após confirmação de comprovante do ato.`
      );
    }

    logAction(
      'Conversão de Reserva em Pré-Venda',
      'Espelho de Vendas',
      `Unidade ${targetUnit.identificacao || targetUnit.lote} convertida de Reserva para Pré-Venda.`
    );

    persistFullStateDirectly({ units: updatedUnits });
  };

  const addUnit = (unitData: Omit<Unit, 'id'>): Unit => {
    const newUnit: Unit = {
      ...unitData,
      id: `unit-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    };
    const updatedUnits = [newUnit, ...units];
    setUnits(updatedUnits);
    logAction('Adição de Nova Unidade', 'Tabela de Vendas', `Unidade ${newUnit.quadra} - ${newUnit.lote} adicionada.`);
    persistFullStateDirectly({ units: updatedUnits });
    return newUnit;
  };

  const updateUnit = (unitId: string, updates: Partial<Unit>) => {
    let updatedUnits: Unit[] = [];
    setUnits((prev) => {
      updatedUnits = prev.map((u) => (u.id === unitId ? { ...u, ...updates } : u));
      return updatedUnits;
    });
    logAction('Edição de Unidade', 'Tabela de Vendas', `Unidade ${unitId} atualizada.`);
    persistFullStateDirectly({ units: updatedUnits });
  };

  const deleteUnit = (unitId: string) => {
    if (currentUser.role !== 'admin') {
      alert('Acesso negado: Apenas usuários com perfil Administrador podem excluir unidades do espelho de vendas.');
      logAction('Tentativa de Exclusão Bloqueada', 'Segurança', `Usuário ${currentUser.name} (${currentUser.role}) tentou excluir unidade ${unitId} sem permissão.`);
      return;
    }
    const target = units.find((u) => u.id === unitId);
    if (!target) return;
    const updatedUnits = units.filter((u) => u.id !== unitId);
    setUnits(updatedUnits);
    recordDeletionAudit(
      'imovel_unidade',
      target.id,
      `Unidade ${target.quadra} - ${target.lote} (${target.tipoUnidade || 'Lote Padrão'})`,
      `Unidade ${target.quadra} - ${target.lote} (Valor R$ ${target.valorFinal?.toLocaleString('pt-BR') || 0}) excluída do espelho de vendas.`,
      target
    );
    persistFullStateDirectly({ units: updatedUnits });
  };

  const getUnitById = (unitId: string) => units.find((u) => u.id === unitId);

  // Duplicate Lead Verification with Activity Age & Fifty Check
  const checkDuplicate = (nome: string, telefone: string, email: string, excludeLeadId?: string): DuplicateCheckResult => {
    const cleanPhone = telefone.replace(/\D/g, '');
    const cleanEmail = email.trim().toLowerCase();
    const cleanNome = nome.trim().toLowerCase();
    const limitDays = settings.diasLimiteAtividadeLead || 15;

    for (const l of leads) {
      if (excludeLeadId && l.id === excludeLeadId) continue;
      
      const lPhone = l.telefone.replace(/\D/g, '');
      const lEmail = l.email.trim().toLowerCase();
      const lNome = l.nome.trim().toLowerCase();

      const isMatch = (cleanPhone && lPhone && cleanPhone === lPhone) ||
                      (cleanEmail && lEmail && cleanEmail === lEmail) ||
                      (cleanNome && lNome && cleanNome === lNome && cleanNome.length > 5);

      if (isMatch) {
        // Calculate days since last update / activity
        const refDate = l.dataAtualizacao ? new Date(l.dataAtualizacao) : new Date(l.dataCadastro);
        const now = new Date();
        const diffMs = Math.abs(now.getTime() - refDate.getTime());
        const daysPassed = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const isAtendimentoAtivo = daysPassed <= limitDays;
        const temDireitoFifty = isAtendimentoAtivo && settings.regraDuplicidadePlantao !== 'sem_fifty_repassa';

        let motivo = '';
        if (cleanPhone && lPhone && cleanPhone === lPhone) {
          motivo = `Telefone (${telefone}) já cadastrado para o cliente ${l.nome} com o corretor ${l.corretorNome}.`;
        } else if (cleanEmail && lEmail && cleanEmail === lEmail) {
          motivo = `E-mail (${email}) já cadastrado para o cliente ${l.nome} com o corretor ${l.corretorNome}.`;
        } else {
          motivo = `Nome idêntico já cadastrado (${l.nome}) sob responsabilidade do corretor ${l.corretorNome}.`;
        }

        return {
          duplicado: true,
          motivo,
          leadExistente: l,
          diasSemAtividade: daysPassed,
          isAtendimentoAtivo,
          temDireitoFifty,
          acaoRecomendada: isAtendimentoAtivo ? 'fifty' : 'caixa_de_leads',
        };
      }
    }

    return { duplicado: false };
  };

  const notifyDuplicateAttempt = (
    leadNome: string,
    telefone: string,
    email: string,
    leadExistente: Lead,
    corretorTentativa?: User
  ) => {
    const corretorNome = corretorTentativa?.name || currentUser.name;
    const limitDays = settings.diasLimiteAtividadeLead || 15;
    const refDate = leadExistente.dataAtualizacao ? new Date(leadExistente.dataAtualizacao) : new Date(leadExistente.dataCadastro);
    const diffMs = Math.abs(new Date().getTime() - refDate.getTime());
    const daysPassed = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const isAtendimentoAtivo = daysPassed <= limitDays;

    // 1. Audit Log
    logAction(
      'Alerta de Tentativa de Duplicidade',
      'CRM / Leads',
      `O corretor "${corretorNome}" tentou cadastrar o lead "${leadNome}" (${telefone}), que já pertence a "${leadExistente.corretorNome}" (Equipe: ${leadExistente.equipeId || 'Geral'}). Última atividade há ${daysPassed} dias. ${isAtendimentoAtivo ? `Atendimento ativo (<= ${limitDays} dias): cabe avaliação de Fifty (50/50).` : `Inativo há mais de ${limitDays} dias: perde direito a Fifty e lead pode ser transferido ou enviado para Caixa de Leads.`}`
    );

    // 2. Notification to Coordenador / Admin
    addNotification({
      tipo: 'duplicidade',
      titulo: `⚠️ Alerta de Duplicidade: ${leadNome}`,
      mensagem: `O corretor ${corretorNome} tentou cadastrar o cliente ${leadNome}, já sob atendimento de ${leadExistente.corretorNome}. Último contato registrado há ${daysPassed} dias (${isAtendimentoAtivo ? `Ativo no prazo de ${limitDays} dias: Fifty aplicável` : `Sem atividade há mais de ${limitDays} dias: Perde direito a Fifty`}).`,
      destinatarioRole: 'admin',
      leadId: leadExistente.id,
      leadNome: leadExistente.nome,
      linkTab: 'clientes',
    });

    // 3. Notification to Gestor da Equipe do lead existente
    if (leadExistente.equipeId) {
      addNotification({
        tipo: 'duplicidade',
        titulo: `⚠️ Duplicidade de Lead: ${leadNome}`,
        mensagem: `O corretor ${corretorNome} tentou cadastrar seu cliente ${leadNome} (atendido por ${leadExistente.corretorNome}). Analise se cabe Fifty (50/50) ou transferência.`,
        destinatarioRole: 'gestor',
        equipeId: leadExistente.equipeId,
        leadId: leadExistente.id,
        leadNome: leadExistente.nome,
        linkTab: 'clientes',
      });
    }

    // 4. Record Activity in existing lead
    const now = new Date();
    const formatted = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newAct: LeadActivity = {
      id: `act-${Date.now()}`,
      dataHora: formatted,
      tipoContato: 'outro',
      autor: 'sistema',
      autorNome: 'Auditoria de Duplicidade',
      texto: `⚠️ Tentativa de novo cadastro por outro corretor: "${corretorNome}" tentou cadastrar este lead em ${formatted}. Coordenador e Gestor foram notificados para avaliação de Fifty.`,
    };

    setLeads((prev) =>
      prev.map((l) => (l.id === leadExistente.id ? { ...l, atividades: [...(l.atividades || []), newAct] } : l))
    );
  };

  // Leads & CRM
  const addLead = (leadData: Omit<Lead, 'id' | 'dataCadastro' | 'dataAtualizacao' | 'notas' | 'atividades'>) => {
    // Tocar sinal sonoro de chegada de novo lead
    playNotificationChime('lead');

    const dup = checkDuplicate(leadData.nome, leadData.telefone, leadData.email);
    const today = new Date().toISOString().split('T')[0];
    const generatedExternalCode = `JV-${1000 + leads.length + 1}`;

    const newLead: Lead = {
      ...leadData,
      id: `lead-${Date.now()}`,
      codigoExterno: leadData.codigoExterno || generatedExternalCode,
      dataCadastro: today,
      dataAtualizacao: today,
      notas: [],
      atividades: [
        {
          id: `act-${Date.now()}`,
          dataHora: `${today} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          tipoContato: 'outro',
          autor: 'sistema',
          autorNome: 'Sistema Jardim Vivência',
          texto: `Pré-cadastro criado pelo corretor ${leadData.corretorNome} via ${leadData.origem}.`,
        },
      ],
    };

    // If duplicate attempt detected, trigger immediate audit & notifications
    if (dup.duplicado && dup.leadExistente) {
      notifyDuplicateAttempt(leadData.nome, leadData.telefone, leadData.email, dup.leadExistente, currentUser);
    } else {
      logAction('Novo Cadastro de Cliente', 'CRM / Leads', `Cliente ${newLead.nome} (${newLead.codigoExterno}) cadastrado por ${newLead.corretorNome}.`);
    }

    const updatedLeads = [newLead, ...leads];
    setLeads(updatedLeads);
    persistFullStateDirectly({ leads: updatedLeads });

    // Send a targeted notification to the assigned broker if it's assigned to someone else
    if (leadData.corretorId && leadData.corretorId !== currentUser.id) {
      addNotification({
        tipo: 'novo_cadastro',
        titulo: '🎯 Novo Lead Atribuído para Você!',
        mensagem: `Olá! O cliente ${leadData.nome} (${leadData.origem}) foi atribuído sob sua responsabilidade. Inicie o atendimento agora mesmo!`,
        destinatarioUserId: leadData.corretorId,
        leadId: newLead.id,
        leadNome: newLead.nome,
        linkTab: 'clientes',
      });
    }

    // Automatic notification for Admin and Team Leader when a Corretor registers a client
    if (currentUser.role === 'corretor' || leadData.corretorId !== currentUser.id) {
      addNotification({
        tipo: 'novo_cadastro',
        titulo: 'Aviso de Novo Cadastro de Cliente',
        mensagem: `O corretor ${leadData.corretorNome} cadastrou o cliente ${leadData.nome} (${leadData.origem}).`,
        destinatarioRole: 'todos',
        equipeId: leadData.equipeId,
        leadId: newLead.id,
        leadNome: newLead.nome,
        linkTab: 'clientes',
      });
    }

    return { lead: newLead, duplicidade: dup };
  };

  const updateLead = (leadId: string, updates: Partial<Lead>) => {
    const updatedLeads = leads.map((lead) => {
      if (lead.id === leadId) {
        const updated = {
          ...lead,
          ...updates,
          dataAtualizacao: new Date().toISOString().split('T')[0],
        };
        logAction('Atualização de Lead', 'CRM / Leads', `Dados de ${lead.nome} atualizados por ${currentUser.name}.`);
        return updated;
      }
      return lead;
    });
    setLeads(updatedLeads);
    persistFullStateDirectly({ leads: updatedLeads });
  };

  const updateLeadStatus = (leadId: string, newStatus: FunnelStage) => {
    const updatedLeads = leads.map((lead) => {
      if (lead.id === leadId) {
        const updated = {
          ...lead,
          status: newStatus,
          dataAtualizacao: new Date().toISOString().split('T')[0],
        };
        logAction(
          'Movimentação no Funil (Kanban)',
          'CRM / Funil',
          `Lead ${lead.nome} movido para a etapa: ${newStatus.replace('_', ' ').toUpperCase()}.`
        );
        return updated;
      }
      return lead;
    });
    setLeads(updatedLeads);
    persistFullStateDirectly({ leads: updatedLeads });
  };

  const addLeadNote = (leadId: string, texto: string) => {
    const now = new Date();
    const formatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    const newNote = {
      id: `note-${Date.now()}`,
      autorId: currentUser.id,
      autorNome: currentUser.name,
      dataHora: formatted,
      texto,
    };

    const updatedLeads = leads.map((lead) => {
      if (lead.id === leadId) {
        return {
          ...lead,
          notas: [newNote, ...lead.notas],
          dataAtualizacao: new Date().toISOString().split('T')[0],
        };
      }
      return lead;
    });
    setLeads(updatedLeads);
    persistFullStateDirectly({ leads: updatedLeads });
    logAction('Nova Nota / Interação', 'CRM / Leads', `Nota adicionada ao lead ${leadId}.`);
  };

  // Add Chat Activity with Broker Subject Detection
  const addLeadActivity = (
    leadId: string,
    tipoContato: ContactType,
    autor: 'corretor' | 'corretor' | 'cliente',
    texto: string
  ): { isBrokerSubject: boolean } => {
    const now = new Date();
    const formatted = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    // Check for broker subject keywords
    const lowerText = texto.toLowerCase();
    const isBrokerSubject = BROKER_SUBJECT_KEYWORDS.some((kw) => lowerText.includes(kw));

    const targetLead = leads.find((l) => l.id === leadId);
    const autorNome = autor === 'corretor' ? currentUser.name : (targetLead?.nome || 'Cliente');

    const newActivity: LeadActivity = {
      id: `act-${Date.now()}`,
      dataHora: formatted,
      tipoContato,
      autor,
      autorNome,
      texto,
      assuntoCorretor: isBrokerSubject,
    };

    const updatedLeads = leads.map((lead) => {
      if (lead.id === leadId) {
        const currentActivities = lead.atividades || [];
        return {
          ...lead,
          atividades: [...currentActivities, newActivity],
          dataAtualizacao: new Date().toISOString().split('T')[0],
        };
      }
      return lead;
    });
    setLeads(updatedLeads);
    persistFullStateDirectly({ leads: updatedLeads });

    // If broker subject detected, trigger flashing alert and notification to Leader and Admin
    if (isBrokerSubject && targetLead) {
      addNotification({
        tipo: 'assunto_corretor',
        titulo: 'Alerta de Assunto de Corretor!',
        mensagem: `${currentUser.name} registrou negociação/valores no atendimento de ${targetLead.nome}. Acione o Líder da Equipe ou Coordenador.`,
        destinatarioRole: 'gestor',
        equipeId: targetLead.equipeId,
        leadId: targetLead.id,
        leadNome: targetLead.nome,
        linkTab: 'clientes',
      });
      logAction('Alerta: Assunto de Corretor', 'CRM / Atividades', `Termo de negociação detectado na conversa com ${targetLead.nome}.`);
    }

    return { isBrokerSubject };
  };

  // Transfer Lead (Admin Only)
  const transferLead = (leadId: string, newCorretorId: string, newTeamId: string, motivo: string): boolean => {
    if (currentUser.role !== 'admin') return false;

    const newCorretor = users.find((u) => u.id === newCorretorId);
    const newTeam = teams.find((t) => t.id === newTeamId);
    if (!newCorretor || !newTeam) return false;

    setLeads((prev) =>
      prev.map((lead) => {
        if (lead.id === leadId) {
          const updated = {
            ...lead,
            corretorId: newCorretor.id,
            corretorNome: newCorretor.name,
            equipeId: newTeam.id,
            dataAtualizacao: new Date().toISOString().split('T')[0],
          };
          logAction(
            'Transferência de Atendimento (Admin)',
            'CRM / Leads',
            `Lead ${lead.nome} transferido de ${lead.corretorNome} para ${newCorretor.name} (${newTeam.name}). Motivo: ${motivo}`
          );
          return updated;
        }
        return lead;
      })
    );

    addNotification({
      tipo: 'novo_cadastro',
      titulo: 'Atendimento Transferido para Você',
      mensagem: `O Administrador transferiu a carteira do cliente para você. Motivo: ${motivo}`,
      destinatarioUserId: newCorretor.id,
      leadId,
      linkTab: 'clientes',
    });

    return true;
  };

  // Enviar Lead para a Caixa de Leads (Pool de Resgate)
  const sendLeadToCaixaLeads = (leadId: string, motivo: string) => {
    const today = new Date().toISOString().split('T')[0];
    const targetLead = leads.find((l) => l.id === leadId);
    if (!targetLead) return;

    const formerCorretor = targetLead.corretorNome || 'Não atribuído';

    const newAct: LeadActivity = {
      id: `act-${Date.now()}`,
      dataHora: `${today} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      tipoContato: 'outro',
      autor: 'sistema',
      autorNome: 'Sistema Jardim Vivência',
      texto: `Lead transferido para a Caixa de Leads (Pool de Resgate). Motivo: ${motivo}. Corretor anterior: ${formerCorretor}.`,
    };

    setLeads((prev) =>
      prev.map((l) => {
        if (l.id === leadId) {
          return {
            ...l,
            naCaixaDeLeads: true,
            motivoCaixaDeLeads: motivo,
            dataEnvioCaixaDeLeads: today,
            direitoFifty: false,
            corretorId: '',
            corretorNome: 'Sem Corretor (Caixa de Leads)',
            equipeId: '',
            dataAtualizacao: today,
            atividades: [...(l.atividades || []), newAct],
            historicoTransferencias: [
              ...(l.historicoTransferencias || []),
              {
                data: today,
                deCorretorNome: formerCorretor,
                paraCorretorNome: 'Caixa de Leads (Disponível para Resgate)',
                motivo,
              },
            ],
          };
        }
        return l;
      })
    );

    logAction('Envio para Caixa de Leads', 'CRM / Caixa de Leads', `Lead ${targetLead.nome} enviado para a Caixa de Leads. Motivo: ${motivo}.`);

    addNotification({
      tipo: 'caixa_leads',
      titulo: 'Novo Lead Disponível na Caixa de Leads',
      mensagem: `O cliente ${targetLead.nome} (${targetLead.origem || 'CRM'}) foi disponibilizado na Caixa de Leads para resgate por corretores online!`,
      destinatarioRole: 'todos',
      leadId,
      leadNome: targetLead.nome,
      linkTab: 'caixa_leads',
    });
  };

  // Resgatar Lead da Caixa de Leads por Corretor Online
  const claimLeadFromCaixaLeads = (leadId: string, corretorId: string): boolean => {
    const corretor = users.find((u) => u.id === corretorId) || currentUser;
    const targetLead = leads.find((l) => l.id === leadId);
    if (!targetLead) return false;

    const today = new Date().toISOString().split('T')[0];

    const newAct: LeadActivity = {
      id: `act-${Date.now()}`,
      dataHora: `${today} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      tipoContato: 'outro',
      autor: 'sistema',
      autorNome: 'Caixa de Leads',
      texto: `🎯 Lead resgatado com sucesso da Caixa de Leads pelo corretor ${corretor.name}. Novo responsável pelo atendimento.`,
    };

    setLeads((prev) =>
      prev.map((l) => {
        if (l.id === leadId) {
          return {
            ...l,
            naCaixaDeLeads: false,
            motivoCaixaDeLeads: undefined,
            corretorId: corretor.id,
            corretorNome: corretor.name,
            equipeId: corretor.teamId || '',
            dataAtualizacao: today,
            atividades: [...(l.atividades || []), newAct],
            historicoTransferencias: [
              ...(l.historicoTransferencias || []),
              {
                data: today,
                deCorretorNome: 'Caixa de Leads',
                paraCorretorNome: corretor.name,
                motivo: 'Resgate direto pelo corretor online',
              },
            ],
          };
        }
        return l;
      })
    );

    logAction('Resgate de Lead da Caixa', 'CRM / Caixa de Leads', `Corretor ${corretor.name} resgatou o lead ${targetLead.nome} da Caixa de Leads.`);

    addNotification({
      tipo: 'novo_cadastro',
      titulo: 'Lead Resgatado com Sucesso!',
      mensagem: `Você assumiu o cliente ${targetLead.nome}. Acesse o histórico anterior e inicie o contato agora mesmo!`,
      destinatarioUserId: corretor.id,
      leadId,
      leadNome: targetLead.nome,
      linkTab: 'clientes',
    });

    return true;
  };

  // Formalização de Fifty (50% / 50%)
  const aplicarFifty = (leadId: string, segundoCorretorId: string, percentual: number = 50) => {
    const segundoCorretor = users.find((u) => u.id === segundoCorretorId);
    const targetLead = leads.find((l) => l.id === leadId);
    if (!targetLead || !segundoCorretor) return;

    const today = new Date().toISOString().split('T')[0];

    const newAct: LeadActivity = {
      id: `act-${Date.now()}`,
      dataHora: `${today} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      tipoContato: 'outro',
      autor: 'sistema',
      autorNome: 'Regras de Plantão (Fifty)',
      texto: `🤝 Acordo de Fifty homologado: Parceria entre ${targetLead.corretorNome} e ${segundoCorretor.name} (${percentual}% / ${100 - percentual}%).`,
    };

    setLeads((prev) =>
      prev.map((l) => {
        if (l.id === leadId) {
          return {
            ...l,
            direitoFifty: true,
            corretorFiftyId: segundoCorretor.id,
            corretorFiftyNome: segundoCorretor.name,
            percentualFifty: percentual,
            dataAtualizacao: today,
            atividades: [...(l.atividades || []), newAct],
          };
        }
        return l;
      })
    );

    logAction('Homologação de Fifty', 'CRM / Fifty', `Fifty de ${percentual}% configurado para ${targetLead.nome} entre ${targetLead.corretorNome} e ${segundoCorretor.name}.`);

    addNotification({
      tipo: 'fifty',
      titulo: 'Fifty (50/50) Homologado no Atendimento',
      mensagem: `Acordo de Fifty formalizado para o cliente ${targetLead.nome} entre ${targetLead.corretorNome} e ${segundoCorretor.name}.`,
      destinatarioRole: 'todos',
      leadId,
      leadNome: targetLead.nome,
      linkTab: 'clientes',
    });
  };

  const deleteLead = (leadId: string) => {
    deleteLeadWithAudit(leadId, 'Exclusão direta via sistema');
  };

  // Deletion with Audit Protocol (Admin only)
  const deleteLeadWithAudit = (leadId: string, motivo: string): string => {
    if (currentUser.role !== 'admin') {
      alert('Acesso negado: Apenas o Administrador pode excluir cadastros de clientes/leads do sistema.');
      logAction('Tentativa de Exclusão Bloqueada', 'Segurança', `Usuário ${currentUser.name} (${currentUser.role}) tentou excluir o cliente ID ${leadId} sem autorização.`);
      return '';
    }
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return '';

    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    const protocol = `DEL-${dateStr}-${randomHex}`;

    const team = teams.find((t) => t.id === lead.equipeId);

    const deletedRecord: DeletedLeadRecord = {
      id: `del-${Date.now()}`,
      codigoExclusao: protocol,
      leadIdOriginal: lead.id,
      nomeCliente: lead.nome,
      cpfCliente: lead.cpf,
      telefoneCliente: lead.telefone,
      corretorNome: lead.corretorNome,
      equipeNome: team?.name || 'Sem Equipe',
      dataExclusao: `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString()}`,
      excluidoPorId: currentUser.id,
      excluidoPorNome: currentUser.name,
      excluidoPorRole: currentUser.role,
      motivoExclusao: motivo || 'Exclusão solicitada pela administração',
      dadosSnapshot: lead,
    };

    const updatedDeletedLeads = [deletedRecord, ...deletedLeads];
    const updatedLeads = leads.filter((l) => l.id !== leadId);

    setDeletedLeads(updatedDeletedLeads);
    setLeads(updatedLeads);

    recordDeletionAudit(
      'cliente_lead',
      lead.id,
      `${lead.nome} (CPF: ${lead.cpf || 'Não informado'} | Tel: ${lead.telefone})`,
      `Cliente ${lead.nome} (Corretor: ${lead.corretorNome || 'Sem corretor'}, Equipe: ${team?.name || 'Sem equipe'}) excluído do CRM. Motivo: ${motivo}`,
      lead,
      motivo
    );

    persistFullStateDirectly({
      leads: updatedLeads,
      deletedLeads: updatedDeletedLeads,
    });

    return protocol;
  };

  // Shift Rules
  const addShiftRule = (ruleData: Omit<ShiftRule, 'id'>) => {
    const newRule: ShiftRule = {
      ...ruleData,
      id: `rule-${Date.now()}`,
    };
    const updatedRules = [...shiftRules, newRule];
    setShiftRules(updatedRules);
    persistFullStateDirectly({ shiftRules: updatedRules });
    logAction('Nova Regra de Plantão', 'Regras do Plantão', `Regra #${newRule.numero} (${newRule.titulo}) criada.`);
  };

  const updateShiftRule = (ruleId: string, updates: Partial<ShiftRule>) => {
    const updatedRules = shiftRules.map((r) => (r.id === ruleId ? { ...r, ...updates } : r));
    setShiftRules(updatedRules);
    persistFullStateDirectly({ shiftRules: updatedRules });
    logAction('Edição de Regra de Plantão', 'Regras do Plantão', `Regra ${ruleId} atualizada.`);
  };

  const toggleShiftRule = (ruleId: string) => {
    const updatedRules = shiftRules.map((r) => (r.id === ruleId ? { ...r, ativo: !r.ativo } : r));
    setShiftRules(updatedRules);
    persistFullStateDirectly({ shiftRules: updatedRules });
  };

  const updateShiftRulesText = (novoTexto: string) => {
    updateSettings({ regrasPlantaoTexto: novoTexto });
    logAction('Edição de Texto das Regras de Plantão', 'Regras do Plantão', `Regras Oficiais do Plantão atualizadas por ${currentUser.name}.`);
  };

  // Visits
  const addVisit = (visitData: Omit<Visit, 'id' | 'dataHora'>) => {
    const now = new Date();
    const formatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    const newVisit: Visit = {
      ...visitData,
      id: `visit-${Date.now()}`,
      dataHora: formatted,
    };
    const updatedVisits = [newVisit, ...visits];
    setVisits(updatedVisits);
    persistFullStateDirectly({ visits: updatedVisits });
    logAction(
      'Registro de Visita no Plantão',
      'Recepção / Visitas',
      `Check-in de ${newVisit.leadNome} (${newVisit.tipoAtendimento}) atendido por ${newVisit.corretorNome}.`
    );
  };

  // Tasks
  const addTask = (taskData: Omit<Task, 'id' | 'concluida'>) => {
    const newTask: Task = {
      ...taskData,
      id: `task-${Date.now()}`,
      concluida: false,
    };
    const updatedTasks = [newTask, ...tasks];
    setTasks(updatedTasks);
    persistFullStateDirectly({ tasks: updatedTasks });
    logAction('Nova Tarefa Criada', 'Tarefas', `Tarefa "${newTask.titulo}" atribuída para ${newTask.corretorNome}.`);
  };

  const toggleTask = (taskId: string) => {
    const updatedTasks = tasks.map((task) => {
      if (task.id === taskId) {
        const nextState = !task.concluida;
        return {
          ...task,
          concluida: nextState,
          dataConclusao: nextState ? new Date().toISOString().split('T')[0] : undefined,
        };
      }
      return task;
    });
    setTasks(updatedTasks);
    persistFullStateDirectly({ tasks: updatedTasks });
  };

  const deleteTask = (taskId: string) => {
    const updatedTasks = tasks.filter((t) => t.id !== taskId);
    setTasks(updatedTasks);
    persistFullStateDirectly({ tasks: updatedTasks });
  };

  // Scales & Shifts
  const addScale = (scaleData: Omit<ShiftScale, 'id'>) => {
    const newScale: ShiftScale = {
      ...scaleData,
      id: `scale-${Date.now()}`,
    };
    const updatedScales = [...scales, newScale];
    setScales(updatedScales);
    persistFullStateDirectly({ scales: updatedScales });
    logAction('Nova Escala de Plantão', 'Plantão / Escalas', `Escala do dia ${newScale.data} (${newScale.turno}) criada.`);

    // Send notifications to each assigned broker
    newScale.corretorIds.forEach((cId) => {
      const brokerUser = users.find((u) => u.id === cId);
      addNotification({
        tipo: 'roleta',
        titulo: '📅 Nova Escala de Plantão Atribuída!',
        mensagem: `Olá ${brokerUser?.name || 'Corretor'}! Você foi escalado para o plantão do dia ${newScale.data} no turno da ${newScale.turno === 'manha' ? 'Manhã' : newScale.turno === 'tarde' ? 'Tarde' : 'Noite'}. Fique atento ao horário!`,
        destinatarioUserId: cId,
        linkTab: 'plantao',
      });
    });
  };

  const updateAttendance = (attId: string, status: ShiftAttendance['status'], observacao?: string) => {
    setAttendances((prev) =>
      prev.map((att) => {
        if (att.id === attId) {
          return {
            ...att,
            status,
            observacao: observacao ?? att.observacao,
          };
        }
        return att;
      })
    );
    logAction('Atualização de Frequência', 'Plantão / Frequência', `Presença de ${attId} atualizada para ${status}.`);
  };

  // Roulette Actions: Atendeu, Montou Pasta, Saiu da Roleta, Remover da Ordem, Sem Saída
  const markAttendanceAttended = (attId: string) => {
    setAttendances((prev) => {
      const maxOrder = Math.max(...prev.map((p) => p.ordemRoleta), 1);
      return prev.map((att) => {
        if (att.id === attId) {
          return {
            ...att,
            atendimentosHoje: att.atendimentosHoje + 1,
            ordemRoleta: maxOrder + 1,
          };
        }
        return att;
      });
    });
    logAction('Marcação da Roleta: Atendeu', 'Plantão / Roleta', `Corretor atendeu cliente e foi para o fim da fila.`);
  };

  const markAttendanceMountedFolder = (attId: string) => {
    const target = attendances.find((a) => a.id === attId);
    if (target) {
      logAction('Marcação da Roleta: Montou Pasta', 'Plantão / Roleta', `${target.corretorNome} montou pasta de documentação CEF com sucesso.`);
      addNotification({
        tipo: 'novo_cadastro',
        titulo: 'Nova Pasta Montada no Plantão!',
        mensagem: `${target.corretorNome} montou uma nova pasta completa para análise Caixa.`,
        destinatarioRole: 'todos',
      });
    }
  };

  const markAttendanceLeftRoulette = (attId: string, motivo: string) => {
    setAttendances((prev) =>
      prev.map((att) => {
        if (att.id === attId) {
          return {
            ...att,
            emFilaRoleta: false,
            observacao: `Saiu da roleta: ${motivo}`,
          };
        }
        return att;
      })
    );
    logAction('Marcação da Roleta: Saiu da Roleta', 'Plantão / Roleta', `Corretor saiu da roleta. Motivo: ${motivo}`);
  };

  const removeAttendanceFromOrder = (attId: string) => {
    setAttendances((prev) =>
      prev.map((att) => {
        if (att.id === attId) {
          return {
            ...att,
            emFilaRoleta: false,
          };
        }
        return att;
      })
    );
    logAction('Remoção da Ordem Sorteada', 'Plantão / Roleta', `Corretor removido da ordem ativa do plantão.`);
  };

  const unmarkAbsentWithoutExit = (): number => {
    let unmarshalledCount = 0;
    setAttendances((prev) =>
      prev.map((att) => {
        if (att.emFilaRoleta && att.status === 'falta') {
          unmarshalledCount++;
          return { ...att, emFilaRoleta: false, observacao: '• sem saída registrada' };
        }
        return att;
      })
    );
    logAction('Desmarcação Automática de Faltas', 'Plantão / Roleta', `${unmarshalledCount} corretores sem registro de saída foram retirados da roleta.`);
    return unmarshalledCount;
  };

  // Roulette Dispatch
  const spinRoulette = (
    leadNome: string,
    leadTelefone: string,
    origem: 'Porta Plantão' | 'Ligação Externa' | 'Chatbot'
  ): User | null => {
    const activeInQueue = attendances
      .filter((a) => a.emFilaRoleta && (a.status === 'presente' || a.status === 'atrasado'))
      .sort((a, b) => a.ordemRoleta - b.ordemRoleta);

    if (activeInQueue.length === 0) return null;

    const winnerAtt = activeInQueue[0];
    const winnerUser = users.find((u) => u.id === winnerAtt.corretorId) || null;

    if (winnerUser) {
      const now = new Date();
      const formatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      const newRecord: RouletteRecord = {
        id: `roul-${Date.now()}`,
        dataHora: formatted,
        corretorId: winnerUser.id,
        corretorNome: winnerUser.name,
        leadNome,
        leadTelefone,
        origem,
        resultado: 'atendido',
        duracaoMinutos: 30,
        observacao: `Atendimento gerado pela roleta de plantão.`,
      };
      setRouletteHistory((prev) => [newRecord, ...prev]);

      setAttendances((prev) => {
        const maxOrder = Math.max(...prev.map((p) => p.ordemRoleta), 1);
        return prev.map((att) => {
          if (att.id === winnerAtt.id) {
            return {
              ...att,
              ordemRoleta: maxOrder + 1,
              atendimentosHoje: att.atendimentosHoje + 1,
            };
          }
          return att;
        });
      });

      // Send immediate targeted notification to the winning broker
      addNotification({
        tipo: 'roleta',
        titulo: '🎰 Você foi Sorteado na Roleta!',
        mensagem: `A roleta girou! Você foi sorteado para atender o cliente ${leadNome} (${origem}). Prepare-se na recepção!`,
        destinatarioUserId: winnerUser.id,
        whatsappUrl: `https://wa.me/55${leadTelefone.replace(/\D/g, '')}`,
        linkTab: 'plantao',
      });

      logAction(
        'Roleta do Plantão Acionada',
        'Roleta de Atendimento',
        `Corretor sorteado: ${winnerUser.name} para o lead ${leadNome} (${origem}).`
      );
    }

    return winnerUser;
  };

  const advanceRouletteQueue = () => {
    const sorted = [...attendances]
      .filter((a) => a.emFilaRoleta)
      .sort((a, b) => a.ordemRoleta - b.ordemRoleta);

    if (sorted.length > 1) {
      const first = sorted[0];
      const maxOrder = Math.max(...attendances.map((a) => a.ordemRoleta), 1);
      setAttendances((prev) =>
        prev.map((att) => {
          if (att.id === first.id) {
            return { ...att, ordemRoleta: maxOrder + 1 };
          }
          return att;
        })
      );
      logAction('Avanço de Fila na Roleta', 'Roleta de Atendimento', `${first.corretorNome} passou a vez.`);
    }
  };

  const shuffleRouletteQueue = () => {
    // Before shuffle: desmarcar quem saiu sem registrar saída ('• sem saída')
    unmarkAbsentWithoutExit();

    setAttendances((prev) => {
      const active = prev.filter((a) => a.emFilaRoleta);
      const shuffled = [...active].sort(() => Math.random() - 0.5);
      const updated = prev.map((att) => {
        const index = shuffled.findIndex((s) => s.id === att.id);
        if (index !== -1) {
          return { ...att, ordemRoleta: index + 1 };
        }
        return att;
      });
      logAction('Sorteio da Ordem da Roleta', 'Roleta de Atendimento', 'Nova ordem aleatória de plantão definida por sorteio.');
      return updated;
    });
  };

  // Commissions
  const addCommission = (commData: Omit<Commission, 'id'>) => {
    const newCommission: Commission = {
      ...commData,
      id: `comm-${Date.now()}`,
    };
    setCommissions((prev) => [newCommission, ...prev]);
    logAction(
      'Nova Comissão Registrada',
      'Financeiro / Comissões',
      `Comissão de R$ ${newCommission.valorComissaoCorretor.toLocaleString('pt-BR')} para ${newCommission.corretorNome}.`
    );
  };

  const updateCommission = (commissionId: string, data: Partial<Commission>) => {
    setCommissions((prev) =>
      prev.map((comm) => {
        if (comm.id === commissionId) {
          const updated = { ...comm, ...data };
          logAction(
            'Comissão Atualizada',
            'Financeiro / Comissões',
            `Comissão ${comm.unidadeIdentificacao} atualizada (Corretor: ${updated.percentualCorretor}% - R$ ${updated.valorComissaoCorretor.toLocaleString('pt-BR')}).`
          );
          return updated;
        }
        return comm;
      })
    );
  };

  const deleteCommission = (commissionId: string) => {
    if (currentUser.role !== 'admin') {
      alert('Acesso negado: Apenas administradores podem excluir registros de comissões.');
      logAction('Tentativa de Exclusão Bloqueada', 'Segurança', `Usuário ${currentUser.name} tentou excluir comissão ID ${commissionId} sem permissão.`);
      return;
    }
    const target = commissions.find((c) => c.id === commissionId);
    if (!target) return;
    setCommissions((prev) => prev.filter((comm) => comm.id !== commissionId));
    recordDeletionAudit(
      'comissao',
      target.id,
      `Comissão Unidade ${target.unidadeIdentificacao} (Corretor: ${target.corretorNome})`,
      `Comissão de R$ ${target.valorComissaoCorretor?.toLocaleString('pt-BR') || 0} removida do financeiro pelo Administrador.`,
      target
    );
  };

  const updateCommissionStatus = (commissionId: string, status: Commission['status']) => {
    setCommissions((prev) =>
      prev.map((comm) => {
        if (comm.id === commissionId) {
          const updated = {
            ...comm,
            status,
            dataPagamento: status === 'pago' ? new Date().toISOString().split('T')[0] : comm.dataPagamento,
          };
          logAction(
            'Atualização de Status de Comissão',
            'Financeiro / Comissões',
            `Comissão ${comm.unidadeIdentificacao} alterada para ${status.toUpperCase()}.`
          );
          return updated;
        }
        return comm;
      })
    );
  };

  // Backup and Restore
  const exportDatabaseJson = () => {
    const dbState = {
      version: '1.10.0',
      exportedAt: new Date().toISOString(),
      exportedBy: currentUser.name,
      settings,
      users,
      teams,
      units,
      leads,
      visits,
      tasks,
      scales,
      attendances,
      rouletteHistory,
      commissions,
      auditLogs,
      notifications,
      shiftRules,
      deletedLeads,
      tags,
      simulatorPolicyRules,
    };
    return JSON.stringify(dbState, null, 2);
  };

  const importDatabaseJson = (jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.units && parsed.leads) {
        if (parsed.settings) setSettings(parsed.settings);
        if (parsed.users) setUsers(mergeUsersWithInitial(parsed.users));
        if (parsed.teams) setTeams(parsed.teams);
        if (parsed.units) setUnits(parsed.units);
        if (parsed.leads) setLeads(parsed.leads);
        if (parsed.visits) setVisits(parsed.visits);
        if (parsed.tasks) setTasks(parsed.tasks);
        if (parsed.scales) setScales(parsed.scales);
        if (parsed.attendances) setAttendances(parsed.attendances);
        if (parsed.rouletteHistory) setRouletteHistory(parsed.rouletteHistory);
        if (parsed.commissions) setCommissions(parsed.commissions);
        if (parsed.auditLogs) setAuditLogs(parsed.auditLogs);
        if (parsed.notifications) setNotifications(parsed.notifications);
        if (parsed.shiftRules) setShiftRules(parsed.shiftRules);
        if (parsed.deletedLeads) setDeletedLeads(parsed.deletedLeads);
        if (parsed.tags) setTags(parsed.tags);
        if (parsed.simulatorPolicyRules) setSimulatorPolicyRules(parsed.simulatorPolicyRules);
        logAction('Restauração de Backup', 'Sistema / Backup', 'Banco de dados restaurado a partir de arquivo JSON.');
        return true;
      }
    } catch (e) {
      console.error('Import database JSON error:', e);
    }
    return false;
  };

  const addTeam = (teamData: Omit<Team, 'id'>): Team => {
    const newTeamId = `team-${Date.now()}`;
    const newTeam: Team = {
      ...teamData,
      id: newTeamId,
      color: teamData.color || '#10b981',
      icon: teamData.icon || 'Users',
      memberIds: teamData.memberIds || [],
      currentVgv: teamData.currentVgv || 0,
      unidadesVendidas: teamData.unidadesVendidas || 0,
      metaUnidades: teamData.metaUnidades || 10,
    };
    const updatedTeams = [...teams, newTeam];

    // Synchronize leader and members teamId
    const updatedUsers = users.map((u) => {
      if (newTeam.leaderId && u.id === newTeam.leaderId) {
        return { ...u, teamId: newTeamId };
      }
      if (newTeam.memberIds.includes(u.id)) {
        return { ...u, teamId: newTeamId };
      }
      return u;
    });

    setTeams(updatedTeams);
    setUsers(updatedUsers);

    logAction('Nova Equipe Criada', 'Gestão de Equipes', `Equipe "${newTeam.name}" cadastrada com Gestor: ${newTeam.leaderName || 'N/A'}.`);

    persistFullStateDirectly({
      teams: updatedTeams,
      users: updatedUsers,
    });

    return newTeam;
  };

  const updateTeam = (teamId: string, updates: Partial<Team>) => {
    const updatedTeams = teams.map((t) => {
      if (t.id === teamId) {
        const updated = { ...t, ...updates };
        logAction(
          'Atualização de Equipe',
          'Gestão de Equipes',
          `Equipe "${updated.name}" atualizada (Gestor: ${updated.leaderName || 'N/A'}).`
        );
        return updated;
      }
      return t;
    });

    let updatedUsers = users;
    if (updates.leaderId !== undefined || updates.memberIds !== undefined) {
      const currentTeam = teams.find((t) => t.id === teamId);
      const prevLeaderId = currentTeam?.leaderId;
      const newLeaderId = updates.leaderId;

      updatedUsers = users.map((u) => {
        // If leader changed or cleared
        if (prevLeaderId && u.id === prevLeaderId && newLeaderId !== prevLeaderId) {
          const stillInMembers = updates.memberIds ? updates.memberIds.includes(u.id) : (currentTeam?.memberIds || []).includes(u.id);
          if (!stillInMembers && u.teamId === teamId) {
            return { ...u, teamId: '' };
          }
        }
        if (newLeaderId && u.id === newLeaderId) {
          return { ...u, teamId };
        }
        if (updates.memberIds && updates.memberIds.includes(u.id)) {
          return { ...u, teamId };
        }
        return u;
      });
    }

    setTeams(updatedTeams);
    setUsers(updatedUsers);

    persistFullStateDirectly({
      teams: updatedTeams,
      users: updatedUsers,
    });
  };

  const deleteTeam = (teamId: string) => {
    if (currentUser.role !== 'admin') {
      alert('Acesso negado: Apenas administradores podem excluir equipes.');
      logAction('Tentativa de Exclusão Bloqueada', 'Segurança', `Usuário ${currentUser.name} tentou excluir a equipe ID ${teamId} sem permissão.`);
      return;
    }
    const target = teams.find((t) => t.id === teamId);
    if (!target) return;

    // Remove team
    const updatedTeams = teams.filter((t) => t.id !== teamId);

    // Release all members and leader from this team
    const updatedUsers = users.map((u) => {
      if (u.teamId === teamId) {
        return { ...u, teamId: '' };
      }
      return u;
    });

    setTeams(updatedTeams);
    setUsers(updatedUsers);

    recordDeletionAudit(
      'equipe',
      target.id,
      `Equipe: ${target.name} (Líder: ${target.leaderName})`,
      `Equipe "${target.name}" foi excluída e seus membros foram desvinculados pelo Administrador.`,
      target
    );

    persistFullStateDirectly({
      teams: updatedTeams,
      users: updatedUsers,
    });
  };

  const addMemberToTeam = (teamId: string, userId: string) => {
    const targetUser = users.find((u) => u.id === userId);
    const targetTeam = teams.find((t) => t.id === teamId);
    if (!targetTeam || !targetUser) return;

    const updatedTeams = teams.map((t) => {
      if (t.id === teamId) {
        const currentMembers = t.memberIds || [];
        if (!currentMembers.includes(userId)) {
          return { ...t, memberIds: [...currentMembers, userId] };
        }
      }
      return {
        ...t,
        memberIds: (t.memberIds || []).filter((mId) => (t.id === teamId ? true : mId !== userId)),
      };
    });

    const updatedUsers = users.map((u) => (u.id === userId ? { ...u, teamId } : u));

    setTeams(updatedTeams);
    setUsers(updatedUsers);

    logAction(
      'Vínculo de Corretor',
      'Gestão de Equipes',
      `Corretor "${targetUser.name}" vinculado à equipe "${targetTeam.name}".`
    );

    persistFullStateDirectly({
      teams: updatedTeams,
      users: updatedUsers,
    });
  };

  const removeMemberFromTeam = (teamId: string, userId: string) => {
    const targetUser = users.find((u) => u.id === userId);
    const targetTeam = teams.find((t) => t.id === teamId);

    const updatedTeams = teams.map((t) => {
      if (t.id === teamId) {
        const isLeader = t.leaderId === userId;
        return {
          ...t,
          leaderId: isLeader ? '' : t.leaderId,
          leaderName: isLeader ? 'Líder Não Definido' : t.leaderName,
          memberIds: (t.memberIds || []).filter((id) => id !== userId),
        };
      }
      return t;
    });

    const updatedUsers = users.map((u) => (u.id === userId ? { ...u, teamId: '' } : u));

    setTeams(updatedTeams);
    setUsers(updatedUsers);

    logAction(
      'Desvinculação de Membro',
      'Gestão de Equipes',
      `Corretor "${targetUser?.name || userId}" desvinculado da equipe "${targetTeam?.name || teamId}".`
    );

    persistFullStateDirectly({
      teams: updatedTeams,
      users: updatedUsers,
    });
  };

  const removeLeaderFromTeam = (teamId: string, deletePermanently: boolean = false, motivo?: string) => {
    const targetTeam = teams.find((t) => t.id === teamId);
    if (!targetTeam) return;

    const leaderId = targetTeam.leaderId;
    const leaderUser = users.find((u) => u.id === leaderId);

    if (deletePermanently && leaderId) {
      deleteUser(leaderId, motivo || `Líder removido e excluído definitivamente da equipe ${targetTeam.name}.`);
      return;
    }

    const updatedTeams = teams.map((t) => {
      if (t.id === teamId) {
        return {
          ...t,
          leaderId: '',
          leaderName: 'Líder Não Definido',
          memberIds: (t.memberIds || []).filter((id) => id !== leaderId),
        };
      }
      return t;
    });

    const updatedUsers = users.map((u) => {
      if (u.id === leaderId && u.teamId === teamId) {
        return { ...u, teamId: '' };
      }
      return u;
    });

    setTeams(updatedTeams);
    setUsers(updatedUsers);

    if (leaderId) {
      recordDeletionAudit(
        'usuario_corretor',
        leaderId,
        `Liderança da Equipe: ${targetTeam.name}`,
        `Líder ${targetTeam.leaderName} foi desvinculado da liderança da equipe "${targetTeam.name}".`,
        { team: targetTeam, leaderUser },
        motivo || 'Desvinculação de liderança pelo Administrador'
      );
    }

    logAction(
      'Desvinculação de Liderança',
      'Gestão de Equipes',
      `Liderança da equipe "${targetTeam.name}" desvinculada (Líder anterior: ${targetTeam.leaderName || 'N/A'}).`
    );

    persistFullStateDirectly({
      teams: updatedTeams,
      users: updatedUsers,
    });
  };

  const addPartnerAgency = (agency: Omit<PartnerAgency, 'id'>) => {
    const newAg: PartnerAgency = {
      id: `pagency-${Date.now()}`,
      ...agency,
    };
    const updatedAgencies = [newAg, ...partnerAgencies];
    setPartnerAgencies(updatedAgencies);
    persistFullStateDirectly({ partnerAgencies: updatedAgencies });
    logAction('Cadastro', 'Imobiliária Parceira', `Cadastrou imobiliária ${newAg.nomeImobiliaria}`);
  };

  const updatePartnerAgency = (agencyId: string, data: Partial<PartnerAgency>) => {
    const updatedAgencies = partnerAgencies.map(a => a.id === agencyId ? { ...a, ...data } : a);
    setPartnerAgencies(updatedAgencies);
    persistFullStateDirectly({ partnerAgencies: updatedAgencies });
    logAction('Atualização', 'Imobiliária Parceira', `Atualizou imobiliária ID ${agencyId}`);
  };

  const deletePartnerAgency = (agencyId: string) => {
    if (currentUser.role !== 'admin') {
      alert('Acesso negado: Apenas administradores podem excluir imobiliárias parceiras.');
      logAction('Tentativa de Exclusão Bloqueada', 'Segurança', `Usuário ${currentUser.name} tentou excluir imobiliária ID ${agencyId} sem autorização.`);
      return;
    }
    const target = partnerAgencies.find(a => a.id === agencyId);
    if (!target) return;
    const updatedAgencies = partnerAgencies.filter(a => a.id !== agencyId);
    setPartnerAgencies(updatedAgencies);
    persistFullStateDirectly({ partnerAgencies: updatedAgencies });
    recordDeletionAudit(
      'outros',
      target.id,
      `Imobiliária Parceira: ${target.nomeImobiliaria}`,
      `Imobiliária parceira ${target.nomeImobiliaria} excluída pelo Administrador.`,
      target
    );
  };

  const addPartnerVisit = (visit: Omit<PartnerVisitAttendance, 'id'>) => {
    const newV: PartnerVisitAttendance = {
      id: `pvisit-${Date.now()}`,
      ...visit,
    };
    const updatedPartnerVisits = [newV, ...partnerVisits];
    setPartnerVisits(updatedPartnerVisits);
    persistFullStateDirectly({ partnerVisits: updatedPartnerVisits });
    logAction('Cadastro', 'Visita Imobiliária Parceira', `Agendou visita para cliente ${newV.clientName} (${newV.agencyName})`);
  };

  const updatePartnerVisit = (visitId: string, data: Partial<PartnerVisitAttendance>) => {
    const updatedPartnerVisits = partnerVisits.map(v => v.id === visitId ? { ...v, ...data } : v);
    setPartnerVisits(updatedPartnerVisits);
    persistFullStateDirectly({ partnerVisits: updatedPartnerVisits });
    logAction('Atualização', 'Visita Imobiliária Parceira', `Atualizou visita ID ${visitId}`);
  };

  const deletePartnerVisit = (visitId: string) => {
    // REGRA DE AUDITORIA E COMPLIANCE: Registros de atendimentos e visitas NÃO DEVEM ser apagados.
    console.warn(`Tentativa de exclusão do atendimento/visita ${visitId} bloqueada: registros de atendimentos são permanentes.`);
    alert('Aviso de Conformidade: Os registros de atendimentos realizados são protegidos por auditoria e NÃO podem ser apagados do sistema.');
  };

  const resetPassword = (email: string, newPass: string) => {
    const cleanEmail = email.trim().toLowerCase();
    let targetUser = users.find(u => u.email.trim().toLowerCase() === cleanEmail);
    if (!targetUser) {
      const initialMatch = initialUsers.find(iu => iu.email.trim().toLowerCase() === cleanEmail);
      if (initialMatch) {
        targetUser = initialMatch;
      }
    }
    if (!targetUser) {
      return { success: false, message: 'E-mail não encontrado na base de usuários cadastrados.' };
    }
    let updatedUsers: User[] = [];
    setUsers(prev => {
      const exists = prev.some(u => u.email.trim().toLowerCase() === cleanEmail);
      if (exists) {
        updatedUsers = prev.map(u => u.email.trim().toLowerCase() === cleanEmail ? { ...u, password: newPass } : u);
        return updatedUsers;
      } else if (targetUser) {
        updatedUsers = [...prev, { ...targetUser, password: newPass }];
        return updatedUsers;
      }
      return prev;
    });
    if (updatedUsers.length > 0) {
      persistFullStateDirectly({ users: updatedUsers });
    }
    logAction('Redefinição de Senha', 'Usuário', `Senha redefinida para ${targetUser.email}`);
    return { success: true, message: 'Senha redefinida com sucesso! Você já pode entrar com sua nova senha.' };
  };

  const deleteMultipleLeads = (leadIds: string[]) => {
    if (currentUser.role !== 'admin') {
      alert('Acesso negado: Apenas administradores podem excluir clientes em lote.');
      logAction('Tentativa de Exclusão Bloqueada', 'Segurança', `Usuário ${currentUser.name} tentou excluir clientes em lote sem autorização.`);
      return;
    }
    const idSet = new Set(leadIds);
    const targets = leads.filter((l) => idSet.has(l.id));
    const updatedLeads = leads.filter((l) => !idSet.has(l.id));
    setLeads(updatedLeads);
    targets.forEach((lead) => {
      recordDeletionAudit(
        'cliente_lead',
        lead.id,
        `${lead.nome} (CPF: ${lead.cpf || 'S/N'} | Tel: ${lead.telefone})`,
        `Exclusão em lote de clientes da base ativa.`,
        lead,
        'Exclusão em lote por Administrador'
      );
    });
    persistFullStateDirectly({ leads: updatedLeads });
  };

  const deleteMultipleUnits = (unitIds: string[]) => {
    if (currentUser.role !== 'admin') {
      alert('Acesso negado: Apenas administradores podem excluir unidades em lote.');
      logAction('Tentativa de Exclusão Bloqueada', 'Segurança', `Usuário ${currentUser.name} tentou excluir unidades em lote sem autorização.`);
      return;
    }
    const idSet = new Set(unitIds);
    const targets = units.filter((u) => idSet.has(u.id));
    const updatedUnits = units.filter((u) => !idSet.has(u.id));
    setUnits(updatedUnits);
    targets.forEach((u) => {
      recordDeletionAudit(
        'imovel_unidade',
        u.id,
        `Unidade ${u.quadra} - ${u.lote}`,
        `Exclusão em lote de unidades do espelho de vendas.`,
        u,
        'Exclusão em lote por Administrador'
      );
    });
    persistFullStateDirectly({ units: updatedUnits });
  };

  const deleteMultipleUsers = (userIds: string[]) => {
    if (currentUser.role !== 'admin') {
      alert('Acesso negado: Apenas administradores podem remover usuários em lote.');
      logAction('Tentativa de Exclusão Bloqueada', 'Segurança', `Usuário ${currentUser.name} tentou excluir usuários em lote sem autorização.`);
      return;
    }
    // Safeguard current connected user
    const safeUserIds = userIds.filter((id) => id !== currentUser.id);
    const idSet = new Set(safeUserIds);
    const targets = users.filter((u) => idSet.has(u.id));
    if (targets.length === 0) return;

    const updatedUsers = users.filter((u) => !idSet.has(u.id));
    const updatedTeams = teams.map((team) => {
      const isLeader = idSet.has(team.leaderId);
      const isMember = (team.memberIds || []).some((id) => idSet.has(id));
      if (!isLeader && !isMember) return team;
      return {
        ...team,
        leaderId: isLeader ? '' : team.leaderId,
        leaderName: isLeader ? 'Líder Não Definido' : team.leaderName,
        memberIds: (team.memberIds || []).filter((id) => !idSet.has(id)),
      };
    });
    const updatedScales = scales.map((s) => ({
      ...s,
      corretorIds: (s.corretorIds || []).filter((id) => !idSet.has(id)),
    }));
    const updatedAttendances = attendances.filter((a) => !idSet.has(a.corretorId));
    const updatedRouletteHistory = rouletteHistory.filter((r) => !idSet.has(r.corretorId));

    setUsers(updatedUsers);
    setTeams(updatedTeams);
    setScales(updatedScales);
    setAttendances(updatedAttendances);
    setRouletteHistory(updatedRouletteHistory);

    targets.forEach((u) => {
      recordDeletionAudit(
        'usuario_corretor',
        u.id,
        `${u.name} (${u.role.toUpperCase()} - ${u.email})`,
        `Exclusão em lote de usuários/corretores.`,
        u,
        'Exclusão em lote por Administrador'
      );
    });

    persistFullStateDirectly({
      users: updatedUsers,
      teams: updatedTeams,
      scales: updatedScales,
      attendances: updatedAttendances,
      rouletteHistory: updatedRouletteHistory,
    });
  };

  const resetCategoryData = (category: 'leads' | 'units' | 'users' | 'tasks' | 'approvals' | 'commissions' | 'all') => {
    if (currentUser.role !== 'admin') {
      alert('Apenas administradores podem realizar limpezas gerais do sistema.');
      return;
    }

    if (category === 'leads' || category === 'all') {
      setLeads([]);
      localStorage.setItem('jv_leads', JSON.stringify([]));
      logAction('Zeramento de Clientes', 'Base de Dados', 'Todos os cadastros de clientes foram removidos.');
    }
    if (category === 'units' || category === 'all') {
      setUnits([]);
      localStorage.setItem('jv_units', JSON.stringify([]));
      logAction('Zeramento de Lotes/Espelho', 'Base de Dados', 'Todas as unidades do espelho de vendas foram removidas.');
    }
    if (category === 'users' || category === 'all') {
      const activeAdmin = users.find((u) => u.id === currentUser.id) || currentUser;
      setUsers([activeAdmin]);
      logAction('Zeramento de Equipe', 'Base de Dados', 'Lista de corretores zerada, preservando apenas o usuário administrador.');
    }
    if (category === 'tasks' || category === 'all') {
      setTasks([]);
      logAction('Zeramento de Tarefas', 'Base de Dados', 'Histórico de tarefas foi zerado.');
    }
    if (category === 'approvals' || category === 'all') {
      setProposalApprovalRequests([]);
      logAction('Zeramento de Solicitacoes de Aprovacao', 'Base de Dados', 'Solicitações de aprovação zeradas.');
    }
    if (category === 'commissions' || category === 'all') {
      setCommissions([]);
      localStorage.setItem('jv_commissions', JSON.stringify([]));
      logAction('Zeramento de Comissoes', 'Base de Dados', 'Registro de comissões zerado.');
    }
    if (category === 'all') {
      setVisits([]);
      setAttendances([]);
      setRouletteHistory([]);
      setDeletedLeads([]);
      setPartnerVisits([]);
      logAction('RESET TOTAL DO SISTEMA', 'Base de Dados', 'A aplicação foi totalmente zerada para configuração do zero.');
    }

    persistFullStateDirectly();
  };

  const resetToDefaults = () => {
    setSettings(initialSettings);
    setUsers(initialUsers);
    setTeams(initialTeams);
    setUnits(generate877Units());
    setLeads(initialLeads);
    setVisits(initialVisits);
    setTasks(initialTasks);
    setScales(initialScales);
    setAttendances(initialAttendances);
    setRouletteHistory(initialRouletteHistory);
    setCommissions(initialCommissions);
    setAuditLogs(initialAuditLogs);
    setNotifications(initialNotifications);
    setShiftRules(initialShiftRules);
    setDeletedLeads(initialDeletedLeads);
    setTags(initialTags);
    setSimulatorPolicyRules(initialSimulatorPolicyRules);
    setPartnerAgencies(initialPartnerAgencies);
    setPartnerVisits(initialPartnerVisits);
    setCurrentUser(initialUsers[0]);
    localStorage.removeItem(STORAGE_KEY);
    logAction('Reset de Fábrica', 'Sistema', 'Todas as configurações e 877 unidades foram redefinidas para o padrão.');

    persistFullStateDirectly({
      settings: initialSettings,
      users: initialUsers,
      teams: initialTeams,
      units: generate877Units(),
      leads: initialLeads,
      visits: initialVisits,
      tasks: initialTasks,
      scales: initialScales,
      attendances: initialAttendances,
      rouletteHistory: initialRouletteHistory,
      commissions: initialCommissions,
      auditLogs: initialAuditLogs,
      notifications: initialNotifications,
      shiftRules: initialShiftRules,
      deletedLeads: initialDeletedLeads,
      tags: initialTags,
      simulatorPolicyRules: initialSimulatorPolicyRules,
      partnerAgencies: initialPartnerAgencies,
      partnerVisits: initialPartnerVisits,
    });
  };

  return (
    <AppContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
        isMobileDrawerOpen,
        setIsMobileDrawerOpen,
        toggleMobileDrawer,
        isAuthenticated,
        login,
        loginDetailed,
        logout,
        currentUser,
        setCurrentUser,
        switchUserById,
        users,
        addUser,
        approveUser,
        rejectUser,
        updateUser,
        deleteUser,
        changeUserPassword,
        resetUserPasswordToDefault,
        teams,
        settings,
        updateSettings,
        toggleTabelaParaLideres,
        toggleSimuladorParaLideres,
        canAccessTable,
        canAccessSimulator,
        canAccessTabelaVendas: canAccessTable,
        canAccessSimulador: canAccessSimulator,
        canAccessTeams,
        canAccessUsersAndTeams,
        canAccessTags,
        canAccessSimulatorRules,
        canAccessRouletteReport,
        canAccessAudit,
        canAccessBackup,
        tags,
        addTag,
        updateTag,
        deleteTag,
        simulatorPolicyRules,
        updateSimulatorPolicyRule,
        resetSimulatorPolicyRules,
        addTeam,
        updateTeam,
        deleteTeam,
        addMemberToTeam,
        removeMemberFromTeam,
        removeLeaderFromTeam,
        units,
        updateUnitStatus,
        reserveUnitForLead,
        transformReservationToPreSale,
        addUnit,
        updateUnit,
        deleteUnit,
        getUnitById,
        leads,
        caixaLeads,
        addLead,
        updateLead,
        updateLeadStatus,
        addLeadNote,
        addLeadActivity,
        checkDuplicate,
        notifyDuplicateAttempt,
        transferLead,
        sendLeadToCaixaLeads,
        claimLeadFromCaixaLeads,
        aplicarFifty,
        deleteLead,
        deleteLeadWithAudit,
        deletedLeads,
        stagnantLeads,
        notifications,
        addNotification,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        deleteNotification,
        unreadNotificationsCount,
        shiftRules,
        addShiftRule,
        updateShiftRule,
        toggleShiftRule,
        updateShiftRulesText,
        visits,
        addVisit,
        tasks,
        addTask,
        toggleTask,
        deleteTask,
        scales,
        attendances,
        rouletteHistory,
        addScale,
        updateAttendance,
        spinRoulette,
        advanceRouletteQueue,
        shuffleRouletteQueue,
        markAttendanceAttended,
        markAttendanceMountedFolder,
        markAttendanceLeftRoulette,
        markAttendanceExitedRoulette: markAttendanceLeftRoulette,
        removeAttendanceFromOrder,
        unmarkAbsentWithoutExit,
        commissions,
        addCommission,
        updateCommission,
        deleteCommission,
        updateCommissionStatus,
        auditLogs,
        logAction,
        deletionLogs,
        recordDeletionAudit,
        exportDatabaseJson,
        importDatabaseJson,
        resetToDefaults,
        resetToInitialData: resetToDefaults,
        deleteMultipleLeads,
        deleteMultipleUnits,
        deleteMultipleUsers,
        resetCategoryData,
        activeTab,
        setActiveTab,
        selectedUnitForSimulator,
        setSelectedUnitForSimulator,
        selectedLeadForModal,
        setSelectedLeadForModal,
        partnerAgencies,
        addPartnerAgency,
        updatePartnerAgency,
        deletePartnerAgency,
        partnerVisits,
        addPartnerVisit,
        updatePartnerVisit,
        deletePartnerVisit,
        resetPassword,
        proposalApprovalRequests,
        addProposalApprovalRequest,
        updateProposalApprovalRequestStatus,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
