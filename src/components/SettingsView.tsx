import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Building, Settings, Mail, ShieldCheck, Layers, Check, Plus, Trash2, Building2, LayoutList, ArrowUp, ArrowDown, Edit2, RotateCcw, Palette, X } from 'lucide-react';
import { DevelopmentItem } from '../types';
import { DEFAULT_KANBAN_COLUMNS, KanbanColumn } from './KanbanFunnel';
import { FirebaseConnectionStatus } from './FirebaseConnectionStatus';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, currentUser } = useApp();

  const [developments, setDevelopments] = useState<DevelopmentItem[]>(
    settings.developments || [
      {
        id: settings.activeDevelopmentId || 'dev_1',
        name: settings.nomeEmpreendimento,
        subtitle: settings.subtituloEmpreendimento,
        developerName: settings.developerName || 'Construtora e Incorporadora Oficial Ltda',
        cnpj: settings.developerCnpj || '00.000.000/0001-00',
        address: settings.enderecoEmpreendimento || 'Av. Principal, 1000 - Centro',
        cityUf: settings.cidadeUf,
        type: settings.tipoEmpreendimento,
        logoUrl: settings.developerLogoUrl || '',
      },
    ]
  );
  const [activeDevelopmentId, setActiveDevelopmentId] = useState<string>(settings.activeDevelopmentId || developments[0]?.id || 'dev_1');

  // Modal new development
  const [showNewDevModal, setShowNewDevModal] = useState(false);
  const [newDevName, setNewDevName] = useState('');
  const [newDevSubtitle, setNewDevSubtitle] = useState('');
  const [newDevDeveloper, setNewDevDeveloper] = useState('');
  const [newDevCnpj, setNewDevCnpj] = useState('');
  const [newDevAddress, setNewDevAddress] = useState('');
  const [newDevCity, setNewDevCity] = useState('Curitiba - PR');
  const [newDevType, setNewDevType] = useState<'horizontal' | 'vertical'>('horizontal');
  const [newDevLogo, setNewDevLogo] = useState('');

  const [nomeEmpreendimento, setNomeEmpreendimento] = useState(settings.nomeEmpreendimento);
  const [subtituloEmpreendimento, setSubtituloEmpreendimento] = useState(settings.subtituloEmpreendimento);
  const [tipoEmpreendimento, setTipoEmpreendimento] = useState(settings.tipoEmpreendimento);
  const [cidadeUf, setCidadeUf] = useState(settings.cidadeUf);
  const [developerLogoUrl, setDeveloperLogoUrl] = useState(settings.developerLogoUrl || '');
  const [maxParcelasConstrutora, setMaxParcelasConstrutora] = useState(settings.maxParcelasConstrutora);
  const [parcelaMinimaConstrutora, setParcelaMinimaConstrutora] = useState(settings.parcelaMinimaConstrutora);
  const [descontoMaximoSemAprovacao, setDescontoMaximoSemAprovacao] = useState(settings.descontoMaximoSemAprovacao);
  const [comissaoPadraoCorretor, setComissaoPadraoCorretor] = useState(settings.comissaoPadraoCorretor ?? 2.0);
  const [comissaoPadraoGestor, setComissaoPadraoGestor] = useState(settings.comissaoPadraoGestor ?? 0.5);
  const [nomeSubsidioEstadual, setNomeSubsidioEstadual] = useState(settings.nomeSubsidioEstadual || 'Casa Fácil Paraná');
  const [subsidioEstadualPadrao, setSubsidioEstadualPadrao] = useState(settings.subsidioEstadualPadrao ?? 20000);
  const [newEmail, setNewEmail] = useState('');
  const [emails, setEmails] = useState<string[]>(settings.emailsAprovacaoDiretoria || ['diretoria@imobiliaria.com']);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Kanban Columns Management
  const [kanbanCols, setKanbanCols] = useState<KanbanColumn[]>(
    settings.kanbanColumns && settings.kanbanColumns.length > 0
      ? settings.kanbanColumns
      : DEFAULT_KANBAN_COLUMNS
  );
  const [showAddKanbanModal, setShowAddKanbanModal] = useState(false);
  const [newKanbanTitle, setNewKanbanTitle] = useState('');
  const [newKanbanColor, setNewKanbanColor] = useState('border-violet-300 bg-violet-50/50');

  const [editingColId, setEditingColId] = useState<string | null>(null);
  const [editColTitle, setEditColTitle] = useState('');
  const [editColColor, setEditColColor] = useState('');

  const colorPresets = [
    { label: 'Slate (Cinza)', value: 'border-slate-300 bg-slate-50/70' },
    { label: 'Sky (Azul)', value: 'border-sky-300 bg-sky-50/50' },
    { label: 'Amber (Âmbar)', value: 'border-amber-300 bg-amber-50/50' },
    { label: 'Orange (Laranja)', value: 'border-orange-300 bg-orange-50/50' },
    { label: 'Blue (Azul Escuro)', value: 'border-blue-300 bg-blue-50/50' },
    { label: 'Indigo (Índigo)', value: 'border-indigo-300 bg-indigo-50/50' },
    { label: 'Teal (Verde Água / Aprovado)', value: 'border-teal-300 bg-teal-50/50' },
    { label: 'Yellow (Amarelo / Condicionado)', value: 'border-yellow-300 bg-yellow-50/50' },
    { label: 'Rose (Rosa / Reprovado)', value: 'border-rose-300 bg-rose-50/50' },
    { label: 'Emerald (Verde / Venda)', value: 'border-emerald-400 bg-emerald-50/70' },
    { label: 'Violet (Violeta)', value: 'border-violet-300 bg-violet-50/50' },
    { label: 'Purple (Roxo)', value: 'border-purple-300 bg-purple-50/50' },
  ];

  const handleMoveColUp = (index: number) => {
    if (index <= 0) return;
    const newCols = [...kanbanCols];
    const temp = newCols[index];
    newCols[index] = newCols[index - 1];
    newCols[index - 1] = temp;
    setKanbanCols(newCols);
  };

  const handleMoveColDown = (index: number) => {
    if (index >= kanbanCols.length - 1) return;
    const newCols = [...kanbanCols];
    const temp = newCols[index];
    newCols[index] = newCols[index + 1];
    newCols[index + 1] = temp;
    setKanbanCols(newCols);
  };

  const handleRemoveCol = (colId: string) => {
    if (kanbanCols.length <= 1) {
      alert('O Kanban deve possuir pelo menos 1 coluna.');
      return;
    }
    if (confirm('Tem certeza que deseja remover esta coluna do Kanban?')) {
      setKanbanCols(kanbanCols.filter((c) => c.id !== colId));
    }
  };

  const handleAddKanbanColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKanbanTitle.trim()) return;
    const slug = newKanbanTitle
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    const newId = `${slug}_${Date.now().toString().slice(-4)}`;
    setKanbanCols([...kanbanCols, { id: newId, title: newKanbanTitle.trim(), color: newKanbanColor }]);
    setNewKanbanTitle('');
    setShowAddKanbanModal(false);
  };

  const handleStartEditCol = (col: KanbanColumn) => {
    setEditingColId(col.id);
    setEditColTitle(col.title);
    setEditColColor(col.color);
  };

  const handleSaveEditCol = () => {
    if (!editingColId || !editColTitle.trim()) return;
    setKanbanCols(
      kanbanCols.map((c) => (c.id === editingColId ? { ...c, title: editColTitle.trim(), color: editColColor } : c))
    );
    setEditingColId(null);
  };

  const handleRestoreDefaultCols = () => {
    if (confirm('Deseja restaurar as colunas padrão do Kanban (incluindo Condicionado Caixa e Reprovado Caixa)?')) {
      setKanbanCols(DEFAULT_KANBAN_COLUMNS);
    }
  };

  const handleAddEmail = () => {
    if (newEmail && !emails.includes(newEmail)) {
      setEmails([...emails, newEmail]);
      setNewEmail('');
    }
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    setEmails(emails.filter(e => e !== emailToRemove));
  };

  const handleCreateDevelopment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDevName.trim()) return;
    const newDev: DevelopmentItem = {
      id: `dev_${Date.now()}`,
      name: newDevName.trim(),
      subtitle: newDevSubtitle.trim() || 'Loteamento & Casas',
      developerName: newDevDeveloper.trim() || 'Loteadora Oficial Ltda',
      cnpj: newDevCnpj.trim() || '00.000.000/0001-00',
      address: newDevAddress.trim() || 'Av. Principal, 100',
      cityUf: newDevCity.trim(),
      type: newDevType,
      logoUrl: newDevLogo.trim(),
    };

    const updated = [...developments, newDev];
    setDevelopments(updated);
    setActiveDevelopmentId(newDev.id);
    setNomeEmpreendimento(newDev.name);
    setSubtituloEmpreendimento(newDev.subtitle);
    setCidadeUf(newDev.cityUf);
    setTipoEmpreendimento(newDev.type);

    updateSettings({
      developments: updated,
      activeDevelopmentId: newDev.id,
      nomeEmpreendimento: newDev.name,
      subtituloEmpreendimento: newDev.subtitle,
      cidadeUf: newDev.cityUf,
      tipoEmpreendimento: newDev.type,
      developerName: newDev.developerName,
      developerCnpj: newDev.cnpj,
      developerLogoUrl: newDev.logoUrl,
    });

    setNewDevName('');
    setNewDevSubtitle('');
    setNewDevDeveloper('');
    setNewDevCnpj('');
    setNewDevAddress('');
    setNewDevLogo('');
    setShowNewDevModal(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  const handleDeleteDevelopment = (devId: string) => {
    if (currentUser.role !== 'admin') {
      alert('Ação restrita ao Administrador.');
      return;
    }
    if (developments.length <= 1) {
      alert('O sistema deve manter pelo menos um empreendimento cadastrado.');
      return;
    }
    if (confirm('Tem certeza que deseja excluir este empreendimento?')) {
      const filtered = developments.filter(d => d.id !== devId);
      setDevelopments(filtered);
      const nextActive = filtered[0];
      setActiveDevelopmentId(nextActive.id);
      setNomeEmpreendimento(nextActive.name);
      setSubtituloEmpreendimento(nextActive.subtitle);
      setCidadeUf(nextActive.cityUf);
      setTipoEmpreendimento(nextActive.type);

      updateSettings({
        developments: filtered,
        activeDevelopmentId: nextActive.id,
        nomeEmpreendimento: nextActive.name,
        subtituloEmpreendimento: nextActive.subtitle,
        cidadeUf: nextActive.cityUf,
        tipoEmpreendimento: nextActive.type,
        developerName: nextActive.developerName,
        developerCnpj: nextActive.cnpj,
        developerLogoUrl: nextActive.logoUrl,
      });

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
    }
  };

  const handleSelectActiveDevelopment = (devId: string) => {
    const dev = developments.find(d => d.id === devId);
    if (!dev) return;
    setActiveDevelopmentId(dev.id);
    setNomeEmpreendimento(dev.name);
    setSubtituloEmpreendimento(dev.subtitle);
    setCidadeUf(dev.cityUf);
    setTipoEmpreendimento(dev.type);

    updateSettings({
      activeDevelopmentId: dev.id,
      nomeEmpreendimento: dev.name,
      subtituloEmpreendimento: dev.subtitle,
      cidadeUf: dev.cityUf,
      tipoEmpreendimento: dev.type,
      developerName: dev.developerName,
      developerCnpj: dev.cnpj,
      developerLogoUrl: dev.logoUrl,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      developments,
      activeDevelopmentId,
      nomeEmpreendimento,
      subtituloEmpreendimento,
      tipoEmpreendimento,
      cidadeUf,
      developerLogoUrl,
      maxParcelasConstrutora: Number(maxParcelasConstrutora),
      parcelaMinimaConstrutora: Number(parcelaMinimaConstrutora),
      descontoMaximoSemAprovacao: Number(descontoMaximoSemAprovacao),
      comissaoPadraoCorretor: Number(comissaoPadraoCorretor),
      comissaoPadraoGestor: Number(comissaoPadraoGestor),
      nomeSubsidioEstadual,
      subsidioEstadualPadrao: Number(subsidioEstadualPadrao),
      emailsAprovacaoDiretoria: emails,
      kanbanColumns: kanbanCols,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  if (currentUser.role !== 'admin' && currentUser.role !== 'coordenador') {
    return (
      <div className="p-8 max-w-2xl mx-auto my-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <ShieldCheck className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Acesso Restrito</h2>
        <p className="text-xs text-slate-600 dark:text-slate-300">
          As configurações do sistema e parâmetros de empreendimento são restritas a Coordenadores e Administradores.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-5xl mx-auto">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Configurações Gerais & Múltiplos Empreendimentos
            </h1>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Gerencie múltiplos empreendimentos/loteamentos, logotipos da incorporadora, regras comerciais e parâmetros de aprovação.
          </p>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Configurações atualizadas com sucesso em todo o sistema!</span>
        </div>
      )}

      {/* Diagnóstico em Tempo Real do Banco de Dados Firestore e .env */}
      <FirebaseConnectionStatus variant="card" />

      {/* Múltiplos Empreendimentos Section */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Gestão de Múltiplos Empreendimentos & Loteadoras
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setShowNewDevModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Empreendimento</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {developments.map((dev) => {
            const isActive = dev.id === activeDevelopmentId;
            return (
              <div
                key={dev.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isActive
                    ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{dev.name}</span>
                      {isActive && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                          Ativo
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{dev.subtitle}</p>
                    <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                      Incorporadora: <span className="font-bold">{dev.developerName}</span> ({dev.cnpj})
                    </p>
                    <p className="text-[11px] text-slate-500">{dev.cityUf}</p>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    {!isActive && (
                      <button
                        type="button"
                        onClick={() => handleSelectActiveDevelopment(dev.id)}
                        className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold"
                      >
                        Selecionar Ativo
                      </button>
                    )}
                    {currentUser.role === 'admin' && (
                      <button
                        type="button"
                        onClick={() => handleDeleteDevelopment(dev.id)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950/50 transition-colors"
                        title="Excluir Empreendimento (Exclusivo Administrador)"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Identificação do Empreendimento */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Building className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              1. Identificação do Empreendimento Ativo
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Nome do Empreendimento:</label>
              <input
                type="text"
                value={nomeEmpreendimento}
                onChange={(e) => setNomeEmpreendimento(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Subtítulo / Descrição:</label>
              <input
                type="text"
                value={subtituloEmpreendimento}
                onChange={(e) => setSubtituloEmpreendimento(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Tipo de Incorporação:</label>
              <select
                value={tipoEmpreendimento}
                onChange={(e) => setTipoEmpreendimento(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="horizontal">Horizontal (Loteamento / Casas)</option>
                <option value="vertical">Vertical (Edifício / Apartamentos)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Cidade / UF:</label>
              <input
                type="text"
                value={cidadeUf}
                onChange={(e) => setCidadeUf(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            
            <div className="space-y-1.5 md:col-span-2">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Logotipo do Empreendimento (Envio de Imagem):</label>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        const img = new Image();
                        img.onload = () => {
                          const canvas = document.createElement('canvas');
                          const MAX_WIDTH = 300;
                          const MAX_HEIGHT = 300;
                          let width = img.width;
                          let height = img.height;

                          if (width > height) {
                            if (width > MAX_WIDTH) {
                              height *= MAX_WIDTH / width;
                              width = MAX_WIDTH;
                            }
                          } else {
                            if (height > MAX_HEIGHT) {
                              width *= MAX_HEIGHT / height;
                              height = MAX_HEIGHT;
                            }
                          }
                          
                          canvas.width = width;
                          canvas.height = height;
                          const ctx = canvas.getContext('2d');
                          if (ctx) {
                            ctx.drawImage(img, 0, 0, width, height);
                            const resizedBase64 = canvas.toDataURL('image/png', 0.8);
                            setDeveloperLogoUrl(resizedBase64);
                          }
                        };
                        img.src = reader.result as string;
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                />
                {developerLogoUrl && (
                  <div className="shrink-0 h-16 w-16 p-2 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center bg-slate-50 dark:bg-slate-800">
                    <img src={developerLogoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Regras Comerciais e Construtora */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Layers className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              2. Regras de Parcelamento & Construtora
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Limite Máximo de Parcelas (Meses):</label>
              <input
                type="number"
                min="1"
                max="360"
                value={maxParcelasConstrutora}
                onChange={(e) => setMaxParcelasConstrutora(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Parcela Mínima Permitida (R$):</label>
              <input
                type="number"
                min="100"
                step="50"
                value={parcelaMinimaConstrutora}
                onChange={(e) => setParcelaMinimaConstrutora(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Desconto Máximo Sem Aprovação (R$):</label>
              <input
                type="number"
                min="0"
                step="500"
                value={descontoMaximoSemAprovacao}
                onChange={(e) => setDescontoMaximoSemAprovacao(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Programa Habitacional Estadual:</label>
              <input
                type="text"
                placeholder="Ex: Casa Fácil PR"
                value={nomeSubsidioEstadual}
                onChange={(e) => setNomeSubsidioEstadual(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Subsídio Estadual (R$):</label>
              <input
                type="number"
                min="0"
                step="1000"
                value={subsidioEstadualPadrao}
                onChange={(e) => setSubsidioEstadualPadrao(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Comissão Padrão Corretor (%):</label>
              <input
                type="number"
                step="any"
                min="0"
                max="100"
                value={comissaoPadraoCorretor}
                onChange={(e) => setComissaoPadraoCorretor(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Over Padrão Gestor (%):</label>
              <input
                type="number"
                step="any"
                min="0"
                max="100"
                value={comissaoPadraoGestor}
                onChange={(e) => setComissaoPadraoGestor(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* E-mails de Aprovação da Diretoria */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Mail className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              3. E-mails para Aprovação da Diretoria
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="diretor@imobiliaria.com"
              className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
            />
            <button
              type="button"
              onClick={handleAddEmail}
              className="flex items-center gap-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar E-mail</span>
            </button>
          </div>

          <div className="space-y-2 pt-2">
            {emails.map((email) => (
              <div key={email} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                <span className="font-mono text-slate-800 dark:text-slate-200">{email}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveEmail(email)}
                  className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Gestão de Colunas do Funil Kanban */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <LayoutList className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  4. Colunas & Etapas do Funil Kanban
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Adicione, ordene ou edite as etapas do pipeline de atendimento comercial.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRestoreDefaultCols}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors"
                title="Restaurar colunas padrão do sistema"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restaurar Padrão</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAddKanbanModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Coluna</span>
              </button>
            </div>
          </div>

          <div className="space-y-2.5">
            {kanbanCols.map((col, idx) => {
              const isEditing = editingColId === col.id;
              return (
                <div
                  key={col.id}
                  className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                    isEditing
                      ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40'
                  }`}
                >
                  {isEditing ? (
                    <div className="flex-1 flex flex-col sm:flex-row items-center gap-2 text-xs">
                      <input
                        type="text"
                        value={editColTitle}
                        onChange={(e) => setEditColTitle(e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                        placeholder="Título da Coluna"
                      />
                      <select
                        value={editColColor}
                        onChange={(e) => setEditColColor(e.target.value)}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
                      >
                        {colorPresets.map((cp) => (
                          <option key={cp.value} value={cp.value}>
                            {cp.label}
                          </option>
                        ))}
                      </select>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={handleSaveEditCol}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs"
                        >
                          Salvar
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingColId(null)}
                          className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-black flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div className={`px-3 py-1 rounded-lg border ${col.color} font-bold text-xs shadow-2xs`}>
                          {col.title}
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">ID: {col.id}</span>
                      </div>

                      <div className="flex items-center gap-1.5 self-end sm:self-center">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveColUp(idx)}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none"
                          title="Mover para cima"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === kanbanCols.length - 1}
                          onClick={() => handleMoveColDown(idx)}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none"
                          title="Mover para baixo"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStartEditCol(col)}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/50"
                          title="Editar Nome/Cor"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveCol(col.id)}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                          title="Excluir Coluna"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-sm transition-all"
          >
            <Check className="w-4 h-4" />
            <span>Salvar Todas as Configurações</span>
          </button>
        </div>
      </form>

      {/* Modal Novo Empreendimento */}
      {showNewDevModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Cadastrar Novo Empreendimento / Loteamento</h3>
              <button onClick={() => setShowNewDevModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleCreateDevelopment} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Nome do Empreendimento:</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Reserva das Flores"
                  value={newDevName}
                  onChange={(e) => setNewDevName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Subtítulo / Descrição:</label>
                  <input
                    type="text"
                    placeholder="Ex: Condomínio Fechado"
                    value={newDevSubtitle}
                    onChange={(e) => setNewDevSubtitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Tipo:</label>
                  <select
                    value={newDevType}
                    onChange={(e) => setNewDevType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="horizontal">Horizontal (Loteamento/Casas)</option>
                    <option value="vertical">Vertical (Edifício/Aptos)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Nome da Loteadora / Incorporadora:</label>
                  <input
                    type="text"
                    placeholder="Ex: Incorporadora Alfa S/A"
                    value={newDevDeveloper}
                    onChange={(e) => setNewDevDeveloper(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">CNPJ da Incorporadora:</label>
                  <input
                    type="text"
                    placeholder="00.000.000/0001-00"
                    value={newDevCnpj}
                    onChange={(e) => setNewDevCnpj(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Cidade / UF:</label>
                  <input
                    type="text"
                    placeholder="Curitiba - PR"
                    value={newDevCity}
                    onChange={(e) => setNewDevCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Logotipo (Opcional - Envio de Imagem):</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          const img = new Image();
                          img.onload = () => {
                            const canvas = document.createElement('canvas');
                            const MAX_WIDTH = 300;
                            const MAX_HEIGHT = 300;
                            let width = img.width;
                            let height = img.height;
  
                            if (width > height) {
                              if (width > MAX_WIDTH) {
                                height *= MAX_WIDTH / width;
                                width = MAX_WIDTH;
                              }
                            } else {
                              if (height > MAX_HEIGHT) {
                                width *= MAX_HEIGHT / height;
                                height = MAX_HEIGHT;
                              }
                            }
                            
                            canvas.width = width;
                            canvas.height = height;
                            const ctx = canvas.getContext('2d');
                            if (ctx) {
                              ctx.drawImage(img, 0, 0, width, height);
                              const resizedBase64 = canvas.toDataURL('image/png', 0.8);
                              setNewDevLogo(resizedBase64);
                            }
                          };
                          img.src = reader.result as string;
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white file:mr-2 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewDevModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Salvar Empreendimento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal Nova Coluna do Kanban */}
      {showAddKanbanModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <LayoutList className="w-5 h-5 text-emerald-600" />
                Adicionar Nova Coluna ao Kanban
              </h3>
              <button
                type="button"
                onClick={() => setShowAddKanbanModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddKanbanColumn} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Título da Etapa / Coluna:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Em Análise Documental, Condicionado Caixa..."
                  value={newKanbanTitle}
                  onChange={(e) => setNewKanbanTitle(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Estilo de Cor da Coluna:
                </label>
                <select
                  value={newKanbanColor}
                  onChange={(e) => setNewKanbanColor(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {colorPresets.map((cp) => (
                    <option key={cp.value} value={cp.value}>
                      {cp.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1 font-medium">Pré-visualização do Card de Coluna:</span>
                <div className={`px-3 py-1.5 rounded-lg border ${newKanbanColor} font-bold text-xs inline-block shadow-2xs`}>
                  {newKanbanTitle || 'Nome da Coluna'}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddKanbanModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm"
                >
                  Adicionar Coluna
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
