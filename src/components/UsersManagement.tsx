import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { User, UserRole, isFullAdmin } from '../types';
import { compressImageFile } from '../utils/imageUtils';
import { ProfilePhotoUpload } from './ProfilePhotoUpload';
import {
  Users,
  UserPlus,
  Shield,
  Crown,
  Briefcase,
  Target,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  Phone,
  Mail,
  Award,
  LogIn,
  Layers,
  Sparkles,
  DollarSign,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  UserCheck,
  Check,
  Camera,
  Upload,
  Clock,
  ThumbsUp,
  ThumbsDown,
  X,
} from 'lucide-react';

export const UsersManagement: React.FC = () => {
  const {
    users,
    teams,
    currentUser,
    switchUserById,
    addUser,
    approveUser,
    rejectUser,
    updateUser,
    deleteUser,
    addMemberToTeam,
    setActiveTab,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [teamFilter, setTeamFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  // Form State
  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    password?: string;
    role: UserRole;
    teamId: string;
    phone: string;
    creci: string;
    active: boolean;
    commissionRate: number;
    avatar: string;
  }>({
    name: '',
    email: '',
    password: '',
    role: 'corretor',
    teamId: '',
    phone: '',
    creci: '',
    active: true,
    commissionRate: 2.0,
    avatar: '',
  });

  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'corretor',
      teamId: teams[0]?.id || '',
      phone: '(41) 9',
      creci: '',
      active: true,
      commissionRate: 2.0,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: user.password || '',
      role: user.role,
      teamId: user.teamId || '',
      phone: user.phone,
      creci: user.creci,
      active: user.active,
      commissionRate: user.commissionRate,
      avatar: user.avatar,
    });
    setIsModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim()) {
      setFeedbackMessage({ type: 'error', text: 'Nome e E-mail são obrigatórios.' });
      return;
    }

    if (editingUser) {
      updateUser(editingUser.id, {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password?.trim() || editingUser.password,
        role: formData.role,
        teamId: formData.teamId || undefined,
        phone: formData.phone.trim(),
        creci: formData.creci.trim(),
        active: formData.active,
        commissionRate: Number(formData.commissionRate),
        avatar: formData.avatar || editingUser.avatar,
      });
      if (formData.teamId) {
        addMemberToTeam(formData.teamId, editingUser.id);
      }
      setFeedbackMessage({ type: 'success', text: `Usuário "${formData.name}" atualizado com sucesso!` });
    } else {
      const newUser = addUser({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password?.trim(),
        role: formData.role,
        teamId: formData.teamId || undefined,
        phone: formData.phone.trim(),
        creci: formData.creci.trim(),
        active: formData.active,
        salesCount: 0,
        totalVgv: 0,
        commissionRate: Number(formData.commissionRate),
        avatar:
          formData.avatar ||
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      });
      if (formData.teamId && newUser) {
        addMemberToTeam(formData.teamId, newUser.id);
      }
      setFeedbackMessage({ type: 'success', text: `Novo usuário "${formData.name}" cadastrado com sucesso!` });
    }

    setIsModalOpen(false);
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const handleDeleteUser = (user: User) => {
    if (user.id === currentUser.id) {
      alert('Você não pode excluir o usuário que está atualmente logado.');
      return;
    }
    if (confirm(`Tem certeza que deseja excluir o cadastro de "${user.name}" (${user.role.toUpperCase()})?`)) {
      deleteUser(user.id);
      setFeedbackMessage({ type: 'success', text: `Usuário ${user.name} removido do sistema.` });
      setTimeout(() => setFeedbackMessage(null), 4000);
    }
  };

  // Pending Brokers for Admin Approval
  const pendingBrokers = useMemo(() => {
    return users.filter((u) => u.statusAprovacao === 'pendente' || (!u.active && u.criadoPorId));
  }, [users]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Role Filter
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      // Team Filter
      if (teamFilter !== 'all' && u.teamId !== teamFilter) return false;
      // Status Filter
      if (statusFilter === 'active' && !u.active) return false;
      if (statusFilter === 'inactive' && u.active) return false;
      // Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchName = u.name.toLowerCase().includes(q);
        const matchEmail = u.email.toLowerCase().includes(q);
        const matchCreci = u.creci.toLowerCase().includes(q);
        const matchPhone = u.phone.toLowerCase().includes(q);
        return matchName || matchEmail || matchCreci || matchPhone;
      }
      return true;
    });
  }, [users, roleFilter, teamFilter, statusFilter, searchQuery]);

  // Counts by Role
  const counts = useMemo(() => {
    return {
      total: users.length,
      corretors: users.filter((u) => u.role === 'corretor' || (u.role as string) === 'corretor').length,
      gestores: users.filter((u) => u.role === 'gestor').length,
      coordenadores: users.filter((u) => u.role === 'coordenador').length,
      admins: users.filter((u) => u.role === 'admin').length,
      active: users.filter((u) => u.active).length,
    };
  }, [users]);

  const getRoleConfig = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return {
          label: 'Administrador Geral',
          shortLabel: 'Admin',
          badge: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300',
          icon: Crown,
          iconColor: 'text-amber-600',
          description: 'Acesso irrestrito a todas as configurações, auditoria, liberação de tabelas e simulador.',
        };
      case 'diretor':
        return {
          label: 'Diretor de Vendas (Diretoria)',
          shortLabel: 'Diretor',
          badge: 'bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300',
          icon: Crown,
          iconColor: 'text-rose-600',
          description: 'Acesso total ao sistema, visão estratégica de VGV, mapa de bairros e relatórios executivos.',
        };
      case 'supervisor':
        return {
          label: 'Supervisor Geral',
          shortLabel: 'Supervisor',
          badge: 'bg-indigo-100 text-indigo-900 border-indigo-300 dark:bg-indigo-950/40 dark:text-indigo-300',
          icon: Shield,
          iconColor: 'text-indigo-600',
          description: 'Acesso total ao sistema, supervisão operacional de corretores, esteiras CEF e relatórios.',
        };
      case 'coordenador':
        return {
          label: 'Coordenador de Vendas',
          shortLabel: 'Coordenador',
          badge: 'bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950/40 dark:text-purple-300',
          icon: Shield,
          iconColor: 'text-purple-600',
          description: 'Supervisão geral dos plantões, esteira CEF, validação documental e aprovação de propostas.',
        };
      case 'gestor':
        return {
          label: 'Líder de Equipe / Gestor',
          shortLabel: 'Líder / Gestor',
          badge: 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300',
          icon: Briefcase,
          iconColor: 'text-emerald-600',
          description: 'Gestão direta dos corretores corretors, metas de equipe e suporte em negociações.',
        };
      case 'corretor':
      default:
        return {
          label: 'Corretor de Vendas',
          shortLabel: 'Corretor',
          badge: 'bg-sky-100 text-sky-900 border-sky-300 dark:bg-sky-950/40 dark:text-sky-300',
          icon: Target,
          iconColor: 'text-sky-600',
          description: 'Atendimento presencial no plantão, roleta de vendas, captação e montagem de pastas.',
        };
    }
  };

  const getTeamName = (teamId?: string) => {
    if (!teamId) return 'Sem Equipe';
    const found = teams.find((t) => t.id === teamId);
    return found ? found.name : 'Equipe Desconhecida';
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 bg-emerald-50 text-emerald-700 rounded-xl dark:bg-emerald-950/50 dark:text-emerald-300">
              <Users className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Gestão de Usuários & Equipes</h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Cadastros completos de Corretores de Plantão, Líderes de Equipe, Coordenador de Vendas e Perfil Administrador.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            id="btn-cadastrar-novo-usuario"
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            <span>Cadastrar Novo Usuário</span>
          </button>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center gap-3 border ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-900 border-rose-200 dark:bg-rose-950/50 dark:text-rose-200 dark:border-rose-800'
          }`}
        >
          {feedbackMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* Admin Pending Approvals Banner */}
      {currentUser.role === 'admin' && pendingBrokers.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-800 rounded-2xl p-4 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 rounded-xl">
                <Clock className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-950 dark:text-amber-100">
                  Aprovações de Corretores Pendentes ({pendingBrokers.length})
                </h3>
                <p className="text-xs text-amber-800/80 dark:text-amber-300">
                  Os cadastros abaixo foram efetuados por Gestores de Equipe e aguardam sua aprovação para liberação de acesso ao sistema.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {pendingBrokers.map((pendingUser) => (
              <div
                key={pendingUser.id}
                className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/60 p-3 rounded-xl flex items-center justify-between shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={pendingUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                    alt={pendingUser.name}
                    className="w-10 h-10 rounded-xl object-cover ring-2 ring-amber-400"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{pendingUser.name}</h4>
                    <p className="text-[11px] text-slate-500">{pendingUser.email} • {pendingUser.phone}</p>
                    <p className="text-[10px] text-amber-700 dark:text-amber-400 font-medium mt-0.5">
                      Cadastrado por: <span className="font-semibold">{pendingUser.criadoPorNome || 'Gestor'}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      approveUser(pendingUser.id);
                      setFeedbackMessage({ type: 'success', text: `Acesso do corretor "${pendingUser.name}" APROVADO com sucesso!` });
                      setTimeout(() => setFeedbackMessage(null), 4000);
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>Aprovar</span>
                  </button>
                  <button
                    onClick={() => {
                      rejectUser(pendingUser.id);
                      setFeedbackMessage({ type: 'error', text: `Cadastro do corretor "${pendingUser.name}" REJEITADO.` });
                      setTimeout(() => setFeedbackMessage(null), 4000);
                    }}
                    className="px-2 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 dark:bg-rose-950 dark:text-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                    <span>Rejeitar</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Role Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <button
          onClick={() => setRoleFilter('all')}
          className={`p-4 rounded-xl border text-left transition-all ${
            roleFilter === 'all'
              ? 'bg-slate-900 text-white border-slate-900 shadow-sm dark:bg-emerald-600 dark:border-emerald-600'
              : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider opacity-80">Total Usuários</span>
            <Users className="w-4 h-4 opacity-80" />
          </div>
          <div className="text-2xl font-bold">{counts.total}</div>
          <p className="text-xs opacity-75 mt-0.5">{counts.active} ativos no sistema</p>
        </button>

        <button
          onClick={() => setRoleFilter('corretor')}
          className={`p-4 rounded-xl border text-left transition-all ${
            roleFilter === 'corretor'
              ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-800 hover:border-sky-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider opacity-80">Corretores</span>
            <Target className="w-4 h-4 opacity-80 text-sky-400" />
          </div>
          <div className="text-2xl font-bold">{counts.corretors}</div>
          <p className="text-xs opacity-75 mt-0.5">Roleta & Plantão</p>
        </button>

        <button
          onClick={() => setRoleFilter('gestor')}
          className={`p-4 rounded-xl border text-left transition-all ${
            roleFilter === 'gestor'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-800 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider opacity-80">Líderes de Equipe</span>
            <Briefcase className="w-4 h-4 opacity-80 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold">{counts.gestores}</div>
          <p className="text-xs opacity-75 mt-0.5">Gestão & Metas VGV</p>
        </button>

        <button
          onClick={() => setRoleFilter('coordenador')}
          className={`p-4 rounded-xl border text-left transition-all ${
            roleFilter === 'coordenador'
              ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-800 hover:border-purple-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider opacity-80">Coordenador</span>
            <Shield className="w-4 h-4 opacity-80 text-purple-400" />
          </div>
          <div className="text-2xl font-bold">{counts.coordenadores}</div>
          <p className="text-xs opacity-75 mt-0.5">Supervisão & Caixa</p>
        </button>

        <button
          onClick={() => setRoleFilter('admin')}
          className={`p-4 rounded-xl border text-left transition-all ${
            roleFilter === 'admin'
              ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-800 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider opacity-80">Administrador</span>
            <Crown className="w-4 h-4 opacity-80 text-amber-400" />
          </div>
          <div className="text-2xl font-bold">{counts.admins}</div>
          <p className="text-xs opacity-75 mt-0.5">Diretoria & Controle Total</p>
        </button>
      </div>

      {/* Role Explanations Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-5 rounded-2xl shadow-sm border border-slate-700">
        <div className="flex items-center gap-2 mb-3 text-emerald-400 font-semibold text-sm">
          <HelpCircle className="w-4 h-4" />
          <span>Estrutura de Perfis e Responsabilidades do Jardim Vivência</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs text-slate-300">
          <div className="bg-white/5 p-3 rounded-xl border border-white/10">
            <div className="flex items-center gap-1.5 font-bold text-sky-400 mb-1">
              <Target className="w-3.5 h-3.5" />
              <span>Corretor de Plantão</span>
            </div>
            <p>Atende clientes da roleta de plantão, cadastra novos leads, realiza visitas aos lotes e monta pastas para análise Caixa.</p>
          </div>
          <div className="bg-white/5 p-3 rounded-xl border border-white/10">
            <div className="flex items-center gap-1.5 font-bold text-emerald-400 mb-1">
              <Briefcase className="w-3.5 h-3.5" />
              <span>Líder de Equipe / Gestor</span>
            </div>
            <p>Gerencia sua equipe de corretores, acompanha o atingimento das metas de VGV, recebe alertas de "Assunto de Corretor" e auxilia no fechamento.</p>
          </div>
          <div className="bg-white/5 p-3 rounded-xl border border-white/10">
            <div className="flex items-center gap-1.5 font-bold text-purple-400 mb-1">
              <Shield className="w-3.5 h-3.5" />
              <span>Coordenador de Vendas</span>
            </div>
            <p>Supervisiona a roleta de plantões, valida o crédito habitacional junto aos correspondentes Caixa e coordena a esteira documental.</p>
          </div>
          <div className="bg-white/5 p-3 rounded-xl border border-white/10">
            <div className="flex items-center gap-1.5 font-bold text-amber-400 mb-1">
              <Crown className="w-3.5 h-3.5" />
              <span>Administrador / Diretoria</span>
            </div>
            <p>Controle geral do sistema, ativa/desativa visualização da tabela e simulador para líderes, gerencia regras e parâmetros comerciais.</p>
          </div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome, email, CRECI ou fone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="all">Todos os Cargos</option>
            <option value="corretor">Corretores</option>
            <option value="gestor">Líderes de Equipe</option>
            <option value="coordenador">Coordenadores</option>
            <option value="supervisor">Supervisores</option>
            <option value="diretor">Diretores</option>
            <option value="admin">Administradores</option>
          </select>

          {/* Team Filter */}
          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="all">Todas as Equipes</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="all">Status: Todos</option>
            <option value="active">Somente Ativos</option>
            <option value="inactive">Inativos</option>
          </select>

          {(searchQuery || roleFilter !== 'all' || teamFilter !== 'all' || statusFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setRoleFilter('all');
                setTeamFilter('all');
                setStatusFilter('all');
              }}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold px-2 py-1"
            >
              Limpar Filtros
            </button>
          )}
        </div>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredUsers.map((user) => {
          const roleConfig = getRoleConfig(user.role);
          const RoleIcon = roleConfig.icon;
          const isCurrent = user.id === currentUser.id;

          return (
            <div
              key={user.id}
              className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all p-5 flex flex-col justify-between shadow-2xs relative ${
                isCurrent
                  ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/10'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
              } ${!user.active ? 'opacity-60 bg-slate-50 dark:bg-slate-950' : ''}`}
            >
              {/* Header card */}
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-slate-800 shadow-xs"
                      />
                      <span
                        className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-800 ${
                          user.active ? 'bg-emerald-500' : 'bg-slate-400'
                        }`}
                        title={user.active ? 'Usuário Ativo' : 'Usuário Inativo'}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 dark:text-white text-base leading-tight">
                          {user.name}
                        </h3>
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            VOCÊ
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3" />
                        <span className="truncate max-w-[180px]">{user.email}</span>
                      </p>
                    </div>
                  </div>

                  {/* Actions Dropdown / Edit */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(user)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Editar cadastro do usuário"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {currentUser.role === 'admin' && (
                      <button
                        onClick={() => handleDeleteUser(user)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Excluir usuário (Apenas Administrador)"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Role Badge & Team */}
                <div className="flex flex-wrap items-center gap-1.5 mb-3">
                  <span
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold border flex items-center gap-1.5 ${roleConfig.badge}`}
                  >
                    <RoleIcon className={`w-3.5 h-3.5 ${roleConfig.iconColor}`} />
                    <span>{roleConfig.label}</span>
                  </span>

                  {user.teamId && (
                    <span className="px-2 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 flex items-center gap-1">
                      <Layers className="w-3 h-3 text-slate-400" />
                      <span>{getTeamName(user.teamId)}</span>
                    </span>
                  )}
                </div>

                {/* Details list */}
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl mb-4">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-medium">CRECI</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{user.creci || 'Não informado'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-medium">Comissão</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">{user.commissionRate}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-medium">Telefone / Whats</span>
                    <a
                      href={`https://wa.me/55${user.phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-emerald-600 hover:underline flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3" />
                      <span>{user.phone || 'Sem fone'}</span>
                    </a>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-medium">Vendas / VGV</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {user.salesCount} unid. | R$ {(user.totalVgv / 1000000).toFixed(1)}M
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer: Quick switch */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => updateUser(user.id, { active: !user.active })}
                  className={`text-xs font-medium flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
                    user.active
                      ? 'text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400'
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {user.active ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  <span>{user.active ? 'Ativo' : 'Inativo'}</span>
                </button>

                {!isCurrent ? (
                  <button
                    onClick={() => switchUserById(user.id)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-emerald-600 bg-slate-100 hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-emerald-950/50"
                    title={`Entrar como ${user.name} para testar a visão do usuário`}
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Conectar como este Usuário</span>
                  </button>
                ) : (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>Sessão Ativa</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-700 dark:text-slate-300">Nenhum usuário encontrado</h3>
          <p className="text-xs text-slate-500 mt-1">Tente ajustar os filtros de busca ou cargo acima.</p>
        </div>
      )}

      {/* Modal: Create / Edit User */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto animate-in fade-in zoom-in-95">
            {/* Header Fixo com Botão X Sempre Visível */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900 z-10">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="p-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-xl shrink-0">
                  {editingUser ? <Edit2 className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                </span>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                    {editingUser ? 'Editar Cadastro de Usuário' : 'Novo Cadastro de Usuário'}
                  </h2>
                  <p className="text-xs text-slate-500 truncate">Corretor de Vendas, Líder de Equipe, Coordenador ou Admin</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 -mr-1 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
                title="Fechar (Esc)"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="flex flex-col flex-1 overflow-hidden">
              {/* Corpo Rolável com scrollbar visível */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
                {/* Nome Completo */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Carlos Eduardo de Oliveira"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white"
                  />
                </div>

              {/* Email, Senha & Telefone */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    E-mail *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="usuario@..."
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Senha de Acesso
                  </label>
                  <input
                    type="password"
                    placeholder="Deixe vazio p/ não alterar"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Telefone
                  </label>
                  <input
                    type="text"
                    placeholder="(41) 9..."
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white"
                  />
                </div>
              </div>

              {/* Perfil / Role & Equipe */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Função / Cargo no Empreendimento *
                  </label>
                  {isFullAdmin(currentUser.role) ? (
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium dark:text-white"
                    >
                      <option value="corretor">🎯 Corretor de Vendas / Plantão</option>
                      <option value="gestor">🛡️ Líder de Equipe / Gestor</option>
                      <option value="coordenador">📋 Coordenador de Vendas</option>
                      <option value="supervisor">🔍 Supervisor Geral (Acesso Total)</option>
                      <option value="diretor">🎖️ Diretor de Vendas (Acesso Total)</option>
                      <option value="correspondente">🏛️ Correspondente Bancário / Agência CEF</option>
                      <option value="admin">👑 Administrador Geral</option>
                    </select>
                  ) : (
                    <div className="bg-slate-100 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      🎯 Corretor de Vendas / Plantão
                      <p className="text-[10px] font-normal text-amber-700 dark:text-amber-400 mt-1">
                        Como Gestor, você pode cadastrar Corretores. O cadastro será enviado com o status 'Pendente' para liberação do Administrador.
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Equipe de Vendas
                  </label>
                  <select
                    value={formData.teamId}
                    onChange={(e) => setFormData({ ...formData, teamId: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white"
                  >
                    <option value="">Sem Equipe (Geral / Coordenação)</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} (Líder: {t.leaderName})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* CRECI e Comissão */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Número do CRECI
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 34.567-F PR"
                    value={formData.creci}
                    onChange={(e) => setFormData({ ...formData, creci: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Comissão Padrão (%)
                    </label>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                      Ex: 0.05%, 0.5%, 2%
                    </span>
                  </div>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    max="100"
                    placeholder="Ex: 0.05, 1.5, 2.0"
                    value={formData.commissionRate}
                    onChange={(e) => setFormData({ ...formData, commissionRate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white"
                  />
                  <div className="flex flex-wrap items-center gap-1 mt-1.5">
                    {[0.05, 0.1, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0].map((rate) => (
                      <button
                        key={rate}
                        type="button"
                        onClick={() => setFormData({ ...formData, commissionRate: rate })}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                          formData.commissionRate === rate
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        {rate.toString().replace('.', ',')}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Foto de Perfil via Firebase Storage / Câmera / Galeria */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 text-center">
                  Foto de Perfil (Firebase Storage)
                </label>
                <ProfilePhotoUpload
                  userId={editingUser?.id || `user_new_${Date.now()}`}
                  userName={formData.name || 'Novo Usuário'}
                  currentAvatarUrl={formData.avatar}
                  onPhotoUploaded={(uploadedUrl) => {
                    setFormData((prev) => ({ ...prev, avatar: uploadedUrl }));
                  }}
                  size="md"
                  showControls={true}
                  editable={true}
                />
              </div>


              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="user-active-checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <label htmlFor="user-active-checkbox" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                  Usuário Ativo (pode participar da roleta e acessar o sistema)
                </label>
              </div>
            </div>

            {/* Footer Fixo com Ações Sempre Visíveis */}
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50 dark:bg-slate-900/90 z-10">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-sm transition-colors"
              >
                {editingUser ? 'Salvar Alterações' : 'Cadastrar Usuário'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
    </div>
  );
};
