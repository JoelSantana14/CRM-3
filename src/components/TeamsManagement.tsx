import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Team, User } from '../types';
import { formatCurrency } from '../utils/simulatorEngine';
import {
  Users,
  Target,
  TrendingUp,
  Award,
  Plus,
  ShieldCheck,
  UserCheck,
  Building,
  Crown,
  Trash2,
  Edit2,
  UserPlus,
  UserMinus,
  Search,
  X,
  Sparkles,
  Phone,
  ArrowRight,
  Info,
  CheckCircle2,
} from 'lucide-react';

export const TeamsManagement: React.FC = () => {
  const {
    teams,
    users,
    currentUser,
    addTeam,
    updateTeam,
    deleteTeam,
    addMemberToTeam,
    removeMemberFromTeam,
    removeLeaderFromTeam,
    deleteUser,
    setActiveTab,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [showNewTeamModal, setShowNewTeamModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [managingMembersTeam, setManagingMembersTeam] = useState<Team | null>(null);

  // States for robust Leader Deletion Modal & Confirmation
  const [deleteLeaderModalData, setDeleteLeaderModalData] = useState<{ team: Team; leader: User } | null>(null);
  const [deletionReason, setDeletionReason] = useState('');
  const [isDeletingLeader, setIsDeletingLeader] = useState(false);
  const [deleteSuccessMessage, setDeleteSuccessMessage] = useState<string | null>(null);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showNewTeamModal) setShowNewTeamModal(false);
        if (managingMembersTeam) setManagingMembersTeam(null);
        if (deleteLeaderModalData) setDeleteLeaderModalData(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showNewTeamModal, managingMembersTeam, deleteLeaderModalData]);

  // Form states for New / Edit Team
  const [teamName, setTeamName] = useState('');
  const [teamLeaderId, setTeamLeaderId] = useState('');
  const [teamMetaVgv, setTeamMetaVgv] = useState(1500000);
  const [teamMetaUnidades, setTeamMetaUnidades] = useState(8);
  const [teamColor, setTeamColor] = useState('#10b981');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  // Member search for batch assignment modal
  const [memberSearchQuery, setMemberSearchQuery] = useState('');

  // Color options
  const colorOptions = [
    { label: 'Esmeralda', value: '#10b981' },
    { label: 'Azul Real', value: '#3b82f6' },
    { label: 'Índigo', value: '#6366f1' },
    { label: 'Roxo Nobre', value: '#8b5cf6' },
    { label: 'Âmbar Ouro', value: '#f59e0b' },
    { label: 'Rose Rubro', value: '#f43f5e' },
    { label: 'Teal Moderno', value: '#14b8a6' },
    { label: 'Grafite Escuro', value: '#475569' },
  ];

  // Open modal to create new team
  const handleOpenCreateModal = () => {
    setEditingTeam(null);
    setTeamName('');
    const defaultLeader = users.find((u) => u.role === 'gestor');
    setTeamLeaderId(defaultLeader ? defaultLeader.id : '');
    setTeamMetaVgv(1500000);
    setTeamMetaUnidades(8);
    setTeamColor('#10b981');
    setSelectedMemberIds([]);
    setShowNewTeamModal(true);
  };

  // Open modal to edit existing team
  const handleOpenEditModal = (team: Team) => {
    setEditingTeam(team);
    setTeamName(team.name);
    setTeamLeaderId(team.leaderId || '');
    setTeamMetaVgv(team.monthlyTargetVgv || 1500000);
    setTeamMetaUnidades(team.metaUnidades || Math.round((team.monthlyTargetVgv || 1500000) / 220000));
    setTeamColor(team.color || '#10b981');
    setSelectedMemberIds(team.memberIds || []);
    setShowNewTeamModal(true);
  };

  // Save Team (Create or Update)
  const handleSaveTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) {
      alert('Por favor, informe o nome da equipe.');
      return;
    }

    const leader = users.find((u) => u.id === teamLeaderId);
    const leaderId = leader ? leader.id : '';
    const leaderName = leader ? leader.name : 'Líder Não Definido';

    // Ensure leader is in memberIds only if leader is valid
    const finalMemberIds = leaderId
      ? Array.from(new Set([leaderId, ...selectedMemberIds]))
      : selectedMemberIds;

    if (editingTeam) {
      updateTeam(editingTeam.id, {
        name: teamName.trim(),
        leaderId,
        leaderName,
        monthlyTargetVgv: Number(teamMetaVgv) || 1500000,
        metaUnidades: Number(teamMetaUnidades) || 8,
        color: teamColor,
        memberIds: finalMemberIds,
      });
    } else {
      addTeam({
        name: teamName.trim(),
        leaderId,
        leaderName,
        memberIds: finalMemberIds,
        monthlyTargetVgv: Number(teamMetaVgv) || 1500000,
        currentVgv: 0,
        metaUnidades: Number(teamMetaUnidades) || 8,
        unidadesVendidas: 0,
        color: teamColor,
        icon: 'Users',
      });
    }

    setShowNewTeamModal(false);
    setEditingTeam(null);
  };

  // Unassign leader from team (Sets team leadership to Vago)
  const handleUnassignLeader = (team: Team, leader: User) => {
    if (
      window.confirm(
        `Deseja desvincular ${leader.name} da liderança da equipe "${team.name}"?\n\n` +
          `A liderança da equipe passará a ficar com status "VAGO" e o corretor permanecerá no sistema para ser alocado livremente.`
      )
    ) {
      removeLeaderFromTeam(team.id, false, `Desvinculação de liderança da equipe "${team.name}" pelo Administrador.`);
      setDeleteSuccessMessage(`Liderança da equipe "${team.name}" desvinculada com sucesso e sincronizada com a nuvem.`);
      setTimeout(() => setDeleteSuccessMessage(null), 3500);
    }
  };

  // Confirm permanent deletion of leader
  const handleConfirmLeaderPermanentDeletion = () => {
    if (!deleteLeaderModalData) return;
    const { team, leader } = deleteLeaderModalData;
    setIsDeletingLeader(true);

    try {
      deleteUser(
        leader.id,
        deletionReason.trim() || `Exclusão definitiva de corretor/líder da equipe ${team.name} via Gestão de Equipes`
      );
      setDeleteSuccessMessage(
        `Líder ${leader.name} foi removido definitivamente do sistema com limpeza em cascata e persistência confirmada no Firestore!`
      );
      setTimeout(() => setDeleteSuccessMessage(null), 4500);
      setDeleteLeaderModalData(null);
      setDeletionReason('');
    } catch (err) {
      alert('Erro ao excluir líder: ' + String(err));
    } finally {
      setIsDeletingLeader(false);
    }
  };

  // Delete team
  const handleDeleteTeam = (team: Team) => {
    const memberCount = (team.memberIds || []).length;
    const confirmMessage = `Tem certeza que deseja excluir a equipe "${team.name}"?\n\nOs ${memberCount} corretor(es) vinculados serão liberados no sistema (ficarão sem equipe) para serem remanejados.`;
    if (window.confirm(confirmMessage)) {
      deleteTeam(team.id);
    }
  };

  // Toggle member in create/edit modal
  const handleToggleMember = (userId: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  // Filter teams by search
  const filteredTeams = useMemo(() => {
    return teams.filter((t) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const matchName = t.name.toLowerCase().includes(q);
      const matchLeader = (t.leaderName || '').toLowerCase().includes(q);
      return matchName || matchLeader;
    });
  }, [teams, searchQuery]);

  // Overall statistics
  const stats = useMemo(() => {
    const totalTeams = teams.length;
    const totalLinkedBrokers = users.filter((u) => !!u.teamId).length;
    const totalVgvRealizado = teams.reduce((acc, t) => acc + (t.currentVgv || 0), 0);
    const totalMetaVgv = teams.reduce((acc, t) => acc + (t.monthlyTargetVgv || 0), 0);
    const totalUnidadesVendidas = teams.reduce((acc, t) => acc + (t.unidadesVendidas || 0), 0);

    return {
      totalTeams,
      totalLinkedBrokers,
      totalVgvRealizado,
      totalMetaVgv,
      totalUnidadesVendidas,
    };
  }, [teams, users]);

  // Get unassigned brokers for quick linking
  const unassignedBrokers = useMemo(() => {
    return users.filter((u) => !u.teamId && u.role !== 'admin');
  }, [users]);

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Gestão de Equipes & Corretores</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              {teams.length} {teams.length === 1 ? 'Equipe' : 'Equipes'}
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Cadastre equipes, nomeie gestores/líderes, vincule corretores corretors e defina metas de VGV e unidades.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setActiveTab('usuarios')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
          >
            <Users className="w-4 h-4 text-slate-600" />
            <span>Cadastrar Corretores & Usuários</span>
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nova Equipe</span>
          </button>
        </div>
      </div>

      {/* Workflow Step Guide Banner */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 border border-emerald-200/80 p-5 rounded-2xl shadow-xs">
        <div className="flex items-center gap-2 text-emerald-950 font-bold text-sm mb-3">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span>Passo a Passo para Montagem e Gestão de Equipes</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="bg-white/80 backdrop-blur-xs p-3.5 rounded-xl border border-emerald-100 flex items-start gap-2.5">
            <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
              1
            </span>
            <div>
              <p className="font-bold text-slate-900">1º Criar a Equipe e Gestor</p>
              <p className="text-slate-600 mt-0.5">
                Defina o nome da equipe, selecione o Gestor/Líder responsável e estabeleça as metas mensais de VGV.
              </p>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xs p-3.5 rounded-xl border border-emerald-100 flex items-start gap-2.5">
            <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
              2
            </span>
            <div>
              <p className="font-bold text-slate-900">2º Cadastrar os Corretores</p>
              <p className="text-slate-600 mt-0.5">
                Na aba Usuários, confira os corretores Corretors cadastrados com CRECI, telefone e dados de comissão.
              </p>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xs p-3.5 rounded-xl border border-emerald-100 flex items-start gap-2.5">
            <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
              3
            </span>
            <div>
              <p className="font-bold text-slate-900">3º Vincular à Equipe</p>
              <p className="text-slate-600 mt-0.5">
                Vincule os corretores à equipe escolhida. Você pode adicionar ou desvincular membros a qualquer momento.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Equipes Ativas</p>
            <p className="text-xl font-bold text-slate-900">{stats.totalTeams}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Corretores Vinculados</p>
            <p className="text-xl font-bold text-slate-900">
              {stats.totalLinkedBrokers} <span className="text-xs text-slate-400 font-normal">/ {users.length}</span>
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">VGV Total Realizado</p>
            <p className="text-xl font-bold text-slate-900">{formatCurrency(stats.totalVgvRealizado)}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Meta Global de VGV</p>
            <p className="text-xl font-bold text-slate-900">{formatCurrency(stats.totalMetaVgv)}</p>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          type="text"
          placeholder="Buscar equipe por nome ou gestor/líder..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 text-xs text-slate-800 placeholder-slate-400 outline-hidden bg-transparent"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-xs text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Teams Grid */}
      {filteredTeams.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
          <Building className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Nenhuma equipe encontrada</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            {searchQuery
              ? 'Nenhum resultado corresponde à sua pesquisa. Tente outro termo.'
              : 'Você ainda não possui equipes cadastradas. Clique no botão "+ Nova Equipe" para criar a primeira!'}
          </p>
          {!searchQuery && (
            <button
              onClick={handleOpenCreateModal}
              className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
            >
              + Criar Primeira Equipe
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredTeams.map((team, idx) => {
            const members = users.filter((u) => (team.memberIds || []).includes(u.id) || u.teamId === team.id);
            const leader = users.find((u) => u.id === team.leaderId);

            const pct = team.monthlyTargetVgv > 0
              ? Math.min(100, Math.round(((team.currentVgv || 0) / team.monthlyTargetVgv) * 100))
              : 0;

            return (
              <div
                key={team.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between space-y-4 hover:border-emerald-300 transition-colors"
              >
                {/* Team Card Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-xs"
                      style={{ backgroundColor: team.color || '#10b981' }}
                    >
                      {team.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-base">{team.name}</h3>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                          #{idx + 1}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <span
                          className="w-2 h-2 rounded-full inline-block"
                          style={{ backgroundColor: team.color || '#10b981' }}
                        />
                        {members.length} {members.length === 1 ? 'membro ativo' : 'membros ativos'}
                      </p>
                    </div>
                  </div>

                  {/* Actions for Team */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(team)}
                      className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                      title="Editar dados da equipe"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {currentUser.role === 'admin' && (
                      <button
                        onClick={() => handleDeleteTeam(team)}
                        className="p-2 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                        title="Excluir equipe inteira (Exclusivo Administrador)"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Gestor / Leader Info Card */}
                {leader ? (
                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <img
                          src={leader.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                          alt={leader.name}
                          className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-xs"
                        />
                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-xs">
                          <Crown className="w-2.5 h-2.5" />
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-slate-900 truncate">{leader.name}</span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-200 shrink-0">
                            GESTOR
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5 truncate">
                          <span>CRECI: {leader.creci || 'S/N'}</span>
                          <span>•</span>
                          <span className="flex items-center gap-0.5 truncate">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            {leader.phone || 'N/A'}
                          </span>
                        </p>
                      </div>
                    </div>

                    {currentUser.role === 'admin' && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleUnassignLeader(team, leader)}
                          className="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-semibold transition-colors flex items-center gap-1"
                          title={`Desvincular liderança da equipe "${team.name}" (liderança ficará vaga)`}
                        >
                          <UserMinus className="w-3 h-3" />
                          <span>Desvincular</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteLeaderModalData({ team, leader })}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-[10px] font-semibold transition-colors"
                          title={`Excluir ${leader.name} definitivamente do sistema (com limpeza em cascata)`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-sm">
                        <UserCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-amber-900">Líder Não Atribuído</span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-200 text-amber-900">
                            VAGO
                          </span>
                        </div>
                        <p className="text-[11px] text-amber-700 mt-0.5">
                          Nenhum gestor ativo vinculado a esta equipe.
                        </p>
                      </div>
                    </div>
                    {currentUser.role === 'admin' && (
                      <button
                        onClick={() => handleOpenEditModal(team)}
                        className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 px-2.5 py-1 rounded-lg shadow-2xs transition-colors"
                      >
                        + Definir
                      </button>
                    )}
                  </div>
                )}

                {/* Progress & Target Section */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-medium">VGV Realizado / Meta:</span>
                    <span className="font-bold text-slate-900">
                      {formatCurrency(team.currentVgv || 0)}{' '}
                      <span className="font-normal text-slate-400">/ {formatCurrency(team.monthlyTargetVgv || 1500000)}</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: team.color || '#10b981',
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>
                      Unidades: <strong>{team.unidadesVendidas || 0}</strong> de {team.metaUnidades || 8}
                    </span>
                    <span className="font-bold text-emerald-700">{pct}% atingido</span>
                  </div>
                </div>

                {/* Members Section */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Corretores Vinculados ({members.length})
                    </span>
                    <button
                      onClick={() => setManagingMembersTeam(team)}
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 hover:underline"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Vincular Corretor</span>
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {members.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-2 text-center bg-slate-50 rounded-lg">
                        Nenhum corretor vinculado além do gestor.
                      </p>
                    ) : (
                      members.map((m) => {
                        const isLeader = m.id === team.leaderId;
                        return (
                          <div
                            key={m.id}
                            className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50/80 hover:bg-slate-100/80 transition-colors"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img
                                src={m.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                                alt={m.name}
                                className="w-7 h-7 rounded-full object-cover shrink-0"
                              />
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 truncate">
                                  <span className="text-slate-900 font-semibold truncate">{m.name}</span>
                                  {isLeader && (
                                    <span className="text-[9px] px-1 py-0.2 rounded bg-amber-100 text-amber-800 font-bold shrink-0">
                                      LÍDER
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-slate-500 font-mono">
                                  CRECI: {m.creci || 'S/N'} • Comis: {m.commissionRate || 2.0}%
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              {!isLeader && (
                                <button
                                  onClick={() => removeMemberFromTeam(team.id, m.id)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                  title={`Desvincular ${m.name} desta equipe`}
                                >
                                  <UserMinus className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: New / Edit Team */}
      {showNewTeamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95">
            {/* Header Fixo com Botão X */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900 z-10">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white truncate">
                    {editingTeam ? `Editar Equipe: ${editingTeam.name}` : 'Cadastrar Nova Equipe'}
                  </h2>
                  <p className="text-xs text-slate-500 truncate">
                    Defina o nome, gestor responsável e vincule os corretores membros.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNewTeamModal(false)}
                className="p-2 -mr-1 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
                title="Fechar (Esc)"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTeam} className="flex flex-col flex-1 overflow-hidden">
              {/* Corpo rolável com scrollbar visível */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              {/* Nome da Equipe */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  1º Nome da Equipe <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Equipe Alfa - Corretors, Equipe Águia Real..."
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-slate-900 bg-white"
                />
              </div>

              {/* Gestor / Líder da Equipe */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  2º Gestor / Líder Responsável (Opcional)
                </label>
                <select
                  value={teamLeaderId}
                  onChange={(e) => setTeamLeaderId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Sem Líder Definido (Deixar Vago) --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role.toUpperCase()}) - CRECI: {u.creci || 'S/N'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Metas: VGV e Unidades */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Meta Mensal VGV (R$)</label>
                  <input
                    type="number"
                    step="50000"
                    min="100000"
                    value={teamMetaVgv}
                    onChange={(e) => setTeamMetaVgv(Number(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Meta de Unidades</label>
                  <input
                    type="number"
                    min="1"
                    value={teamMetaUnidades}
                    onChange={(e) => setTeamMetaUnidades(Number(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-slate-900"
                  />
                </div>
              </div>

              {/* Cor de Identificação */}
              <div>
                <label className="block font-bold text-slate-800 mb-1.5">Cor da Equipe</label>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map((c) => (
                    <button
                      type="button"
                      key={c.value}
                      onClick={() => setTeamColor(c.value)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                        teamColor === c.value
                          ? 'border-slate-900 ring-2 ring-slate-900/20 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: c.value }} />
                      <span className="text-slate-700 text-[11px]">{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 3º Seleção dos Corretores Membros */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="block font-bold text-slate-800">
                  3º Vincular Corretores à Equipe ({selectedMemberIds.length} selecionados)
                </label>
                <p className="text-[11px] text-slate-500">
                  Selecione quais corretores farão parte desta equipe:
                </p>

                <div className="max-h-44 overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-1.5 bg-slate-50/50">
                  {users
                    .filter((u) => u.id !== teamLeaderId)
                    .map((u) => {
                      const isSelected = selectedMemberIds.includes(u.id);
                      const currentTeamName = teams.find((t) => t.id === u.teamId)?.name;

                      return (
                        <label
                          key={u.id}
                          onClick={() => handleToggleMember(u.id)}
                          className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-emerald-50 border border-emerald-300'
                              : 'bg-white border border-slate-200/80 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}} // Handled by label click
                              className="rounded-sm text-emerald-600 focus:ring-emerald-500"
                            />
                            <img
                              src={u.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                              alt={u.name}
                              className="w-6 h-6 rounded-full object-cover"
                            />
                            <div>
                              <p className="font-semibold text-slate-900">{u.name}</p>
                              <p className="text-[10px] text-slate-500 font-mono">
                                {u.role.toUpperCase()} • CRECI: {u.creci}
                              </p>
                            </div>
                          </div>

                          {currentTeamName && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                              Atual: {currentTeamName}
                            </span>
                          )}
                        </label>
                      );
                    })}
                </div>
              </div>
              </div>

              {/* Botões do Modal Fixos no Rodapé */}
              <div className="flex items-center justify-end gap-2.5 px-5 py-4 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50 dark:bg-slate-900/90 z-10">
                <button
                  type="button"
                  onClick={() => setShowNewTeamModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs transition-colors"
                >
                  {editingTeam ? 'Salvar Alterações' : 'Criar Equipe'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Quick Link Brokers to Team */}
      {managingMembersTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full max-h-[92vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95">
            {/* Header Fixo */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900 z-10">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-xs shrink-0"
                  style={{ backgroundColor: managingMembersTeam.color || '#10b981' }}
                >
                  <UserPlus className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    Vincular Corretores — {managingMembersTeam.name}
                  </h2>
                  <p className="text-[11px] text-slate-500 truncate">
                    Clique em "+ Vincular" no corretor desejado para adicioná-lo.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setManagingMembersTeam(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0"
                title="Fechar (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Corpo Rolável */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Search */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar corretor por nome ou CRECI..."
                  value={memberSearchQuery}
                  onChange={(e) => setMemberSearchQuery(e.target.value)}
                  className="bg-transparent outline-hidden w-full text-xs text-slate-800 dark:text-white"
                />
              </div>

              {/* List of brokers */}
              <div className="space-y-1.5">
                {users
                  .filter((u) => {
                    if (u.id === managingMembersTeam.leaderId) return false;
                    if (!memberSearchQuery.trim()) return true;
                    const q = memberSearchQuery.toLowerCase();
                    return u.name.toLowerCase().includes(q) || u.creci.toLowerCase().includes(q);
                  })
                  .map((u) => {
                    const isAlreadyMember = (managingMembersTeam.memberIds || []).includes(u.id);
                    const currentTeam = teams.find((t) => t.id === u.teamId);

                    return (
                      <div
                        key={u.id}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={u.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                            alt={u.name}
                            className="w-7 h-7 rounded-full object-cover shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 dark:text-white truncate">{u.name}</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                              CRECI: {u.creci} {currentTeam ? `(Equipe: ${currentTeam.name})` : '(Sem Equipe)'}
                            </p>
                          </div>
                        </div>

                        {isAlreadyMember ? (
                          <button
                            type="button"
                            onClick={() => removeMemberFromTeam(managingMembersTeam.id, u.id)}
                            className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-[11px] font-semibold transition-colors shrink-0 ml-2"
                          >
                            Desvincular
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => addMemberToTeam(managingMembersTeam.id, u.id)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold transition-colors flex items-center gap-1 shadow-xs shrink-0 ml-2"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Vincular</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Footer Fixo */}
            <div className="flex justify-end px-5 py-3 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50 dark:bg-slate-900/90 z-10">
              <button
                type="button"
                onClick={() => setManagingMembersTeam(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Robust Leader / Broker Deletion Confirmation Modal */}
      {deleteLeaderModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-rose-200 dark:border-rose-900/50 max-w-lg w-full overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 bg-rose-50/80 dark:bg-rose-950/40 border-b border-rose-100 dark:border-rose-900/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-rose-700 dark:text-rose-400">
                <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-900/60 flex items-center justify-center shrink-0">
                  <Trash2 className="w-4 h-4 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold leading-tight">Exclusão Definitiva de Corretor / Líder</h3>
                  <p className="text-[11px] text-rose-600/80 dark:text-rose-400/80">
                    Limpeza em cascata e persistência imediata no banco de dados Firestore
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeleteLeaderModalData(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-rose-100/50 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* User details card */}
              <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 rounded-xl p-3.5 flex items-center gap-3">
                <img
                  src={deleteLeaderModalData.leader.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                  alt={deleteLeaderModalData.leader.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-xs shrink-0"
                />
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {deleteLeaderModalData.leader.name}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {deleteLeaderModalData.leader.email} • CRECI: {deleteLeaderModalData.leader.creci || 'S/N'}
                  </p>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold mt-0.5">
                    Líder atual da equipe: "{deleteLeaderModalData.team.name}"
                  </p>
                </div>
              </div>

              {/* Cascade warning box */}
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl p-3.5 text-xs text-amber-900 dark:text-amber-300 space-y-1.5">
                <p className="font-bold flex items-center gap-1.5 text-amber-800 dark:text-amber-200">
                  <Info className="w-4 h-4 shrink-0" />
                  Operações de exclusão executadas atomicamente:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-[11px] text-amber-800 dark:text-amber-300">
                  <li>Remoção permanente da lista de usuários e corretores ativos.</li>
                  <li>Desvinculação automática da equipe (a equipe passará a ter status "Líder Vago").</li>
                  <li>Remoção de todas as escalas de plantão, registros de presença e histórico de roleta.</li>
                  <li>Gravação síncrona definitiva no Firestore para evitar que o corretor retorne.</li>
                  <li>Registro no livro permanente de auditoria de exclusões (<code className="font-mono bg-amber-100 dark:bg-amber-900/50 px-1 py-0.5 rounded">deletion_audit_logs</code>).</li>
                </ul>
              </div>

              {/* Justification input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Motivo da Exclusão (Gravado no Log Fiscal de Auditoria)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Desligamento da imobiliária, solicitação de encerramento..."
                  value={deletionReason}
                  onChange={(e) => setDeletionReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteLeaderModalData(null)}
                disabled={isDeletingLeader}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmLeaderPermanentDeletion}
                disabled={isDeletingLeader}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-98 transition-all shadow-md shadow-rose-600/20 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeletingLeader ? 'Excluindo e Persistindo...' : 'Confirmar Exclusão Definitiva'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Success Toast Alert */}
      {deleteSuccessMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-emerald-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-emerald-700 flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-300">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <p className="text-xs font-medium leading-relaxed">{deleteSuccessMessage}</p>
        </div>
      )}
    </div>
  );
};
