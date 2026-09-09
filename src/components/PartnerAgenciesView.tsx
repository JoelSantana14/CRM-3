import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PartnerAgency, PartnerBroker, PartnerVisitAttendance } from '../types';
import {
  Building2,
  UserPlus,
  Users,
  CalendarDays,
  Plus,
  Phone,
  Mail,
  Award,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  Clock,
  Sparkles,
  Shield,
  FileText,
  Search,
  Check,
  X,
  Upload,
} from 'lucide-react';

export const PartnerAgenciesView: React.FC = () => {
  const {
    partnerAgencies,
    addPartnerAgency,
    updatePartnerAgency,
    deletePartnerAgency,
    partnerVisits,
    addPartnerVisit,
    updatePartnerVisit,
    deletePartnerVisit,
    currentUser,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'agencias' | 'visitas' | 'relatorio'>('agencias');
  const [searchQuery, setSearchQuery] = useState('');

  // Agency Modal State
  const [isAgencyModalOpen, setIsAgencyModalOpen] = useState(false);
  const [editingAgency, setEditingAgency] = useState<PartnerAgency | null>(null);
  const [agencyForm, setAgencyForm] = useState({
    nomeImobiliaria: '',
    responsavel: '',
    telefone: '',
    email: '',
    logoUrl: '',
  });

  // Broker Modal State
  const [isBrokerModalOpen, setIsBrokerModalOpen] = useState(false);
  const [selectedAgencyForBroker, setSelectedAgencyForBroker] = useState<PartnerAgency | null>(null);
  const [editingBroker, setEditingBroker] = useState<PartnerBroker | null>(null);
  const [brokerForm, setBrokerForm] = useState({
    nome: '',
    email: '',
    telefone: '',
    creci: '',
    podeFazerPlantao: true,
    avatar: '',
  });

  // Visit / Attendance Modal State
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
  const [editingVisit, setEditingVisit] = useState<PartnerVisitAttendance | null>(null);
  const [visitForm, setVisitForm] = useState<{
    agencyId: string;
    brokerId: string;
    clientName: string;
    clientPhone: string;
    visitDate: string;
    visitTime: string;
    status: 'agendada' | 'realizada' | 'proposta' | 'cancelada';
    observations: string;
  }>({
    agencyId: '',
    brokerId: '',
    clientName: '',
    clientPhone: '',
    visitDate: new Date().toISOString().split('T')[0],
    visitTime: '14:00',
    status: 'agendada',
    observations: '',
  });

  // Handle Logo / Avatar Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (base64: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          callback(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveAgency = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agencyForm.nomeImobiliaria.trim()) return;

    if (editingAgency) {
      updatePartnerAgency(editingAgency.id, agencyForm);
    } else {
      addPartnerAgency({
        ...agencyForm,
        logoUrl: agencyForm.logoUrl || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=150&auto=format&fit=crop&q=80',
        corretores: [],
        dataCadastro: new Date().toISOString().split('T')[0],
      });
    }
    setIsAgencyModalOpen(false);
    setEditingAgency(null);
  };

  const handleSaveBroker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgencyForBroker || !brokerForm.nome.trim()) return;

    const updatedCorretores = [...selectedAgencyForBroker.corretores];
    if (editingBroker) {
      const idx = updatedCorretores.findIndex(b => b.id === editingBroker.id);
      if (idx >= 0) {
        updatedCorretores[idx] = { ...editingBroker, ...brokerForm };
      }
    } else {
      const newBroker: PartnerBroker = {
        id: `pb-${Date.now()}`,
        ...brokerForm,
        avatar: brokerForm.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      };
      updatedCorretores.push(newBroker);
    }

    updatePartnerAgency(selectedAgencyForBroker.id, { corretores: updatedCorretores });
    setIsBrokerModalOpen(false);
    setEditingBroker(null);
  };

  const handleDeleteBroker = (agency: PartnerAgency, brokerId: string) => {
    if (confirm('Deseja realmente remover este corretor parceiro?')) {
      const updatedCorretores = agency.corretores.filter(b => b.id !== brokerId);
      updatePartnerAgency(agency.id, { corretores: updatedCorretores });
    }
  };

  const handleSaveVisit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitForm.agencyId || !visitForm.brokerId || !visitForm.clientName.trim()) {
      alert('Preencha a imobiliária, o corretor responsável e o nome do cliente.');
      return;
    }

    const agency = partnerAgencies.find(a => a.id === visitForm.agencyId);
    const broker = agency?.corretores.find(b => b.id === visitForm.brokerId);

    if (!agency || !broker) return;

    const visitPayload = {
      agencyId: agency.id,
      agencyName: agency.nomeImobiliaria,
      brokerId: broker.id,
      brokerName: broker.nome,
      clientName: visitForm.clientName,
      clientPhone: visitForm.clientPhone,
      visitDate: visitForm.visitDate,
      visitTime: visitForm.visitTime,
      status: visitForm.status,
      observations: visitForm.observations,
    };

    if (editingVisit) {
      updatePartnerVisit(editingVisit.id, visitPayload);
    } else {
      addPartnerVisit({
        ...visitPayload,
        registeredAt: new Date().toISOString(),
      });
    }

    setIsVisitModalOpen(false);
    setEditingVisit(null);
  };

  const filteredAgencies = partnerAgencies.filter(
    a =>
      a.nomeImobiliaria.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.responsavel.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredVisits = partnerVisits.filter(
    v =>
      v.agencyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.brokerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.clientName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-2xl">
              <Building2 className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Imobiliárias Parceiras & Atendimentos
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Gerenciamento de imobiliárias parceiras, corretores autorizados, agendamentos e horários de visitas diárias (Separado do plantão House).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEditingAgency(null);
              setAgencyForm({ nomeImobiliaria: '', responsavel: '', telefone: '', email: '', logoUrl: '' });
              setIsAgencyModalOpen(true);
            }}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Imobiliária</span>
          </button>
          <button
            onClick={() => {
              setEditingVisit(null);
              setVisitForm({
                agencyId: partnerAgencies[0]?.id || '',
                brokerId: partnerAgencies[0]?.corretores[0]?.id || '',
                clientName: '',
                clientPhone: '',
                visitDate: new Date().toISOString().split('T')[0],
                visitTime: '14:00',
                status: 'agendada',
                observations: '',
              });
              setIsVisitModalOpen(true);
            }}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm flex items-center gap-2"
          >
            <CalendarDays className="w-4 h-4" />
            <span>Novo Agendamento Visita</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('agencias')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'agencias'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Imobiliárias & Corretores ({partnerAgencies.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('visitas')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'visitas'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          <span>Atendimento Diário de Imobiliárias ({partnerVisits.length})</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar imobiliária, corretor ou cliente..."
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none"
        />
      </div>

      {/* Tab 1: Agencies & Brokers */}
      {activeTab === 'agencias' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredAgencies.map((agency) => (
            <div
              key={agency.id}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={agency.logoUrl}
                      alt={agency.nomeImobiliaria}
                      className="w-12 h-12 rounded-2xl object-cover border border-slate-200 dark:border-slate-800 shadow-xs"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=150&auto=format&fit=crop&q=80';
                      }}
                    />
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {agency.nomeImobiliaria}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Responsável: <strong className="text-slate-700 dark:text-slate-300">{agency.responsavel}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setEditingAgency(agency);
                        setAgencyForm({
                          nomeImobiliaria: agency.nomeImobiliaria,
                          responsavel: agency.responsavel,
                          telefone: agency.telefone,
                          email: agency.email,
                          logoUrl: agency.logoUrl,
                        });
                        setIsAgencyModalOpen(true);
                      }}
                      className="p-2 text-slate-400 hover:text-indigo-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Editar Imobiliária"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {currentUser.role === 'admin' && (
                      <button
                        onClick={() => {
                          if (confirm(`Deseja excluir a imobiliária ${agency.nomeImobiliaria}?`)) {
                            deletePartnerAgency(agency.id);
                          }
                        }}
                        className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Excluir Imobiliária (Apenas Administrador)"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{agency.telefone || 'Não informado'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <Mail className="w-3.5 h-3.5 text-indigo-500" />
                    <span className="truncate">{agency.email || 'Não informado'}</span>
                  </div>
                </div>

                {/* Brokers List */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      <span>Corretores Parceiros ({agency.corretores.length})</span>
                    </h4>
                    <button
                      onClick={() => {
                        setSelectedAgencyForBroker(agency);
                        setEditingBroker(null);
                        setBrokerForm({
                          nome: '',
                          email: '',
                          telefone: '',
                          creci: '',
                          podeFazerPlantao: true,
                          avatar: '',
                        });
                        setIsBrokerModalOpen(true);
                      }}
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Adicionar Corretor</span>
                    </button>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {agency.corretores.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-2 text-center bg-slate-50 dark:bg-slate-800/30 rounded-xl">
                        Nenhum corretor cadastrado nesta imobiliária.
                      </p>
                    ) : (
                      agency.corretores.map((broker) => (
                        <div
                          key={broker.id}
                          className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <img
                              src={broker.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                              alt={broker.nome}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white">{broker.nome}</p>
                              <p className="text-[11px] text-slate-500">CRECI: {broker.creci || 'N/I'} • {broker.telefone}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                broker.podeFazerPlantao
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              }`}
                            >
                              {broker.podeFazerPlantao ? 'Plantão OK' : 'Sem Plantão'}
                            </span>
                            <button
                              onClick={() => {
                                setSelectedAgencyForBroker(agency);
                                setEditingBroker(broker);
                                setBrokerForm({
                                  nome: broker.nome,
                                  email: broker.email,
                                  telefone: broker.telefone,
                                  creci: broker.creci,
                                  podeFazerPlantao: broker.podeFazerPlantao,
                                  avatar: broker.avatar || '',
                                });
                                setIsBrokerModalOpen(true);
                              }}
                              className="p-1 text-slate-400 hover:text-indigo-600 rounded"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {currentUser.role === 'admin' && (
                              <button
                                onClick={() => handleDeleteBroker(agency, broker.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded"
                                title="Excluir Corretor Parceiro"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>Cadastrada em: {agency.dataCadastro}</span>
                <button
                  onClick={() => {
                    setSelectedAgencyForBroker(agency);
                    setEditingVisit(null);
                    setVisitForm({
                      agencyId: agency.id,
                      brokerId: agency.corretores[0]?.id || '',
                      clientName: '',
                      clientPhone: '',
                      visitDate: new Date().toISOString().split('T')[0],
                      visitTime: '14:00',
                      status: 'agendada',
                      observations: '',
                    });
                    setIsVisitModalOpen(true);
                  }}
                  className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  + Agendar Visita para esta Imobiliária
                </button>
              </div>
            </div>
          ))}

          {filteredAgencies.length === 0 && (
            <div className="col-span-full py-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Nenhuma imobiliária parceira encontrada</p>
              <p className="text-xs text-slate-500 mt-1">Clique em "Cadastrar Imobiliária" para começar.</p>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Partner Visits / Atendimento Diário de Imobiliárias */}
      {activeTab === 'visitas' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Atendimento Diário de Imobiliárias Parceiras
              </h3>
              <p className="text-xs text-slate-500">
                Registro de visitas e agendamentos de clientes por imobiliárias parceiras (Separado do plantão house).
              </p>
            </div>
            <button
              onClick={() => {
                setEditingVisit(null);
                setVisitForm({
                  agencyId: partnerAgencies[0]?.id || '',
                  brokerId: partnerAgencies[0]?.corretores[0]?.id || '',
                  clientName: '',
                  clientPhone: '',
                  visitDate: new Date().toISOString().split('T')[0],
                  visitTime: '14:00',
                  status: 'agendada',
                  observations: '',
                });
                setIsVisitModalOpen(true);
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2 shadow-xs"
            >
              <Clock className="w-4 h-4" />
              <span>Registrar Novo Horário de Visita</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3.5 px-4">Imobiliária</th>
                  <th className="py-3.5 px-4">Corretor Parceiro</th>
                  <th className="py-3.5 px-4">Cliente Agendado</th>
                  <th className="py-3.5 px-4">Data & Horário</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Observações</th>
                  <th className="py-3.5 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {filteredVisits.map((visit) => (
                  <tr key={visit.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      {visit.agencyName}
                    </td>
                    <td className="py-3.5 px-4">
                      {visit.brokerName}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900 dark:text-white">{visit.clientName}</p>
                      <p className="text-[11px] text-slate-500">{visit.clientPhone}</p>
                    </td>
                    <td className="py-3.5 px-4 font-medium">
                      <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg w-fit font-mono">
                        <Clock className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{visit.visitDate} às {visit.visitTime}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          visit.status === 'agendada'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            : visit.status === 'realizada'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : visit.status === 'proposta'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        {visit.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate text-slate-500">
                      {visit.observations || 'Nenhuma'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditingVisit(visit);
                            setVisitForm({
                              agencyId: visit.agencyId,
                              brokerId: visit.brokerId,
                              clientName: visit.clientName,
                              clientPhone: visit.clientPhone,
                              visitDate: visit.visitDate,
                              visitTime: visit.visitTime,
                              status: visit.status as 'agendada' | 'realizada' | 'proposta' | 'cancelada',
                              observations: visit.observations || '',
                            });
                            setIsVisitModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 rounded"
                          title="Editar Visita"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <span
                          className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200"
                          title="Registro Permanente de Atendimento: Conforme auditoria e regras de plantão, este atendimento é perpétuo e protegido contra exclusão."
                        >
                          <Shield className="w-3 h-3 text-emerald-600" />
                          Permanente
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredVisits.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 italic">
                      Nenhum atendimento ou visita de imobiliária parceira registrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Agency Modal */}
      {isAgencyModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingAgency ? 'Editar Imobiliária Parceira' : 'Cadastrar Nova Imobiliária Parceira'}
              </h3>
              <button
                onClick={() => setIsAgencyModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAgency} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nome da Imobiliária *
                </label>
                <input
                  type="text"
                  required
                  value={agencyForm.nomeImobiliaria}
                  onChange={(e) => setAgencyForm({ ...agencyForm, nomeImobiliaria: e.target.value })}
                  placeholder="Ex: Imobiliária Castro & Associados"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Responsável / Gerente
                  </label>
                  <input
                    type="text"
                    value={agencyForm.responsavel}
                    onChange={(e) => setAgencyForm({ ...agencyForm, responsavel: e.target.value })}
                    placeholder="Ex: Carlos Castro"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={agencyForm.telefone}
                    onChange={(e) => setAgencyForm({ ...agencyForm, telefone: e.target.value })}
                    placeholder="(42) 99999-9999"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  E-mail de Contato
                </label>
                <input
                  type="email"
                  value={agencyForm.email}
                  onChange={(e) => setAgencyForm({ ...agencyForm, email: e.target.value })}
                  placeholder="contato@imobiliaria.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Logo da Imobiliária (URL ou Upload de Imagem)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={agencyForm.logoUrl}
                    onChange={(e) => setAgencyForm({ ...agencyForm, logoUrl: e.target.value })}
                    placeholder="https://exemplo.com/logo.png ou faça upload"
                    className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <label className="cursor-pointer px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Subir Logo</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, (base64) => setAgencyForm({ ...agencyForm, logoUrl: base64 }))}
                    />
                  </label>
                </div>
                {agencyForm.logoUrl && (
                  <div className="mt-2 flex items-center gap-2">
                    <img src={agencyForm.logoUrl} alt="Preview" className="w-10 h-10 rounded-xl object-cover border" />
                    <span className="text-[11px] text-slate-400">Pré-visualização da Logo</span>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAgencyModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
                >
                  Salvar Imobiliária
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Broker Modal */}
      {isBrokerModalOpen && selectedAgencyForBroker && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingBroker ? 'Editar Corretor Parceiro' : `Adicionar Corretor a ${selectedAgencyForBroker.nomeImobiliaria}`}
              </h3>
              <button
                onClick={() => setIsBrokerModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBroker} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nome do Corretor *
                </label>
                <input
                  type="text"
                  required
                  value={brokerForm.nome}
                  onChange={(e) => setBrokerForm({ ...brokerForm, nome: e.target.value })}
                  placeholder="Ex: João da Silva"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    CRECI
                  </label>
                  <input
                    type="text"
                    value={brokerForm.creci}
                    onChange={(e) => setBrokerForm({ ...brokerForm, creci: e.target.value })}
                    placeholder="CRECI 12345"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={brokerForm.telefone}
                    onChange={(e) => setBrokerForm({ ...brokerForm, telefone: e.target.value })}
                    placeholder="(42) 99999-9999"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  E-mail
                </label>
                <input
                  type="email"
                  value={brokerForm.email}
                  onChange={(e) => setBrokerForm({ ...brokerForm, email: e.target.value })}
                  placeholder="corretor@imobiliaria.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Foto do Corretor (Upload de Imagem ou URL)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={brokerForm.avatar}
                    onChange={(e) => setBrokerForm({ ...brokerForm, avatar: e.target.value })}
                    placeholder="URL ou upload de imagem"
                    className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <label className="cursor-pointer px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Subir Foto</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, (base64) => setBrokerForm({ ...brokerForm, avatar: base64 }))}
                    />
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="podeFazerPlantao"
                  checked={brokerForm.podeFazerPlantao}
                  onChange={(e) => setBrokerForm({ ...brokerForm, podeFazerPlantao: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <label htmlFor="podeFazerPlantao" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Permitir que este corretor participe do plantão e escalas? (Configurável)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsBrokerModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
                >
                  Salvar Corretor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Visit / Attendance Modal */}
      {isVisitModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingVisit ? 'Editar Atendimento / Visita' : 'Novo Agendamento de Visita (Imobiliária Parceira)'}
              </h3>
              <button
                onClick={() => setIsVisitModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVisit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Imobiliária Parceira *
                  </label>
                  <select
                    required
                    value={visitForm.agencyId}
                    onChange={(e) => {
                      const agId = e.target.value;
                      const ag = partnerAgencies.find(a => a.id === agId);
                      setVisitForm({
                        ...visitForm,
                        agencyId: agId,
                        brokerId: ag?.corretores[0]?.id || '',
                      });
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Selecione a Imobiliária</option>
                    {partnerAgencies.map((ag) => (
                      <option key={ag.id} value={ag.id}>{ag.nomeImobiliaria}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Corretor Responsável *
                  </label>
                  <select
                    required
                    value={visitForm.brokerId}
                    onChange={(e) => setVisitForm({ ...visitForm, brokerId: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Selecione o Corretor</option>
                    {partnerAgencies
                      .find(a => a.id === visitForm.agencyId)
                      ?.corretores.map((b) => (
                        <option key={b.id} value={b.id}>{b.nome}</option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nome do Cliente *
                  </label>
                  <input
                    type="text"
                    required
                    value={visitForm.clientName}
                    onChange={(e) => setVisitForm({ ...visitForm, clientName: e.target.value })}
                    placeholder="Nome completo do cliente"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Telefone do Cliente
                  </label>
                  <input
                    type="text"
                    value={visitForm.clientPhone}
                    onChange={(e) => setVisitForm({ ...visitForm, clientPhone: e.target.value })}
                    placeholder="(42) 99999-9999"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Data da Visita *
                  </label>
                  <input
                    type="date"
                    required
                    value={visitForm.visitDate}
                    onChange={(e) => setVisitForm({ ...visitForm, visitDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Horário da Visita *
                  </label>
                  <input
                    type="time"
                    required
                    value={visitForm.visitTime}
                    onChange={(e) => setVisitForm({ ...visitForm, visitTime: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Status
                  </label>
                  <select
                    value={visitForm.status}
                    onChange={(e) => setVisitForm({ ...visitForm, status: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="agendada">Agendada</option>
                    <option value="realizada">Realizada</option>
                    <option value="proposta">Proposta</option>
                    <option value="cancelada">Cancelada</option>
                  </select>
                </div>
              </div>

              {/* Quick Time Buttons */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-500 uppercase">
                  Atalhos Rápidos de Horários do Dia (Atendimento Diário):
                </label>
                <div className="flex flex-wrap gap-2">
                  {['09:00', '10:30', '13:30', '15:00', '16:30', '18:00'].map((timeStr) => (
                    <button
                      key={timeStr}
                      type="button"
                      onClick={() => setVisitForm({ ...visitForm, visitTime: timeStr })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                        visitForm.visitTime === timeStr
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {timeStr}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Observações / Detalhes do Atendimento
                </label>
                <textarea
                  rows={2}
                  value={visitForm.observations}
                  onChange={(e) => setVisitForm({ ...visitForm, observations: e.target.value })}
                  placeholder="Informações sobre o perfil do cliente, lote de interesse..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsVisitModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
                >
                  Salvar Agendamento Visita
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
