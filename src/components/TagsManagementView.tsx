import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { TagItem } from '../types';
import {
  Tag,
  Plus,
  Edit2,
  Trash2,
  Search,
  CheckCircle2,
  Layers,
  Sparkles,
  Users,
  AlertCircle,
  HelpCircle,
  FolderCheck,
  Check,
} from 'lucide-react';

export const TagsManagementView: React.FC = () => {
  const { tags, addTag, updateTag, deleteTag, leads, setActiveTab, settings } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<TagItem | null>(null);

  const [formData, setFormData] = useState<{
    nome: string;
    cor: string;
    categoria: TagItem['categoria'];
    descricao: string;
  }>({
    nome: '',
    cor: 'emerald',
    categoria: 'programa',
    descricao: '',
  });

  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const COLOR_OPTIONS = [
    { id: 'emerald', label: 'Verde Esmeralda', bgClass: 'bg-emerald-100 text-emerald-800 border-emerald-300', dot: 'bg-emerald-500' },
    { id: 'teal', label: 'Verde Petróleo / Teal', bgClass: 'bg-teal-100 text-teal-800 border-teal-300', dot: 'bg-teal-500' },
    { id: 'blue', label: 'Azul Caixa', bgClass: 'bg-blue-100 text-blue-800 border-blue-300', dot: 'bg-blue-500' },
    { id: 'cyan', label: 'Ciano Claro', bgClass: 'bg-cyan-100 text-cyan-800 border-cyan-300', dot: 'bg-cyan-500' },
    { id: 'purple', label: 'Roxo Investidor', bgClass: 'bg-purple-100 text-purple-800 border-purple-300', dot: 'bg-purple-500' },
    { id: 'amber', label: 'Âmbar / Amarelo', bgClass: 'bg-amber-100 text-amber-900 border-amber-300', dot: 'bg-amber-500' },
    { id: 'orange', label: 'Laranja Pendência', bgClass: 'bg-orange-100 text-orange-900 border-orange-300', dot: 'bg-orange-500' },
    { id: 'rose', label: 'Vermelho Urgente', bgClass: 'bg-rose-100 text-rose-800 border-rose-300', dot: 'bg-rose-500' },
    { id: 'indigo', label: 'Índigo Plantão', bgClass: 'bg-indigo-100 text-indigo-800 border-indigo-300', dot: 'bg-indigo-500' },
    { id: 'slate', label: 'Cinza Neutro', bgClass: 'bg-slate-100 text-slate-800 border-slate-300', dot: 'bg-slate-500' },
  ];

  // Lead count per tag
  const tagLeadCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    tags.forEach((t) => (counts[t.nome] = 0));
    leads.forEach((l) => {
      l.tags?.forEach((tagString) => {
        counts[tagString] = (counts[tagString] || 0) + 1;
      });
    });
    return counts;
  }, [tags, leads]);

  const openCreateModal = () => {
    setEditingTag(null);
    setFormData({
      nome: '',
      cor: 'emerald',
      categoria: 'programa',
      descricao: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (tag: TagItem) => {
    setEditingTag(tag);
    setFormData({
      nome: tag.nome,
      cor: tag.cor,
      categoria: tag.categoria,
      descricao: tag.descricao || '',
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome.trim()) {
      setFeedbackMessage({ type: 'error', text: 'O nome da tag é obrigatório.' });
      return;
    }

    const selectedColor = COLOR_OPTIONS.find((c) => c.id === formData.cor) || COLOR_OPTIONS[0];

    if (editingTag) {
      updateTag(editingTag.id, {
        nome: formData.nome.trim(),
        cor: formData.cor,
        categoria: formData.categoria,
        descricao: formData.descricao.trim(),
        bgClass: selectedColor.bgClass,
      });
      setFeedbackMessage({ type: 'success', text: `Tag "${formData.nome}" atualizada com sucesso!` });
    } else {
      addTag({
        nome: formData.nome.trim(),
        cor: formData.cor,
        categoria: formData.categoria,
        descricao: formData.descricao.trim(),
        bgClass: selectedColor.bgClass,
        textClass: selectedColor.bgClass.split(' ')[1] || 'text-slate-800',
        borderClass: selectedColor.bgClass.split(' ')[2] || 'border-slate-300',
      });
      setFeedbackMessage({ type: 'success', text: `Tag "${formData.nome}" cadastrada com sucesso!` });
    }

    setIsModalOpen(false);
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const handleDelete = (tag: TagItem) => {
    if (confirm(`Deseja excluir a tag "${tag.nome}"? Ela deixará de aparecer nas opções de marcação.`)) {
      deleteTag(tag.id);
      setFeedbackMessage({ type: 'success', text: `Tag "${tag.nome}" excluída com sucesso.` });
      setTimeout(() => setFeedbackMessage(null), 4000);
    }
  };

  const filteredTags = useMemo(() => {
    return tags.filter((t) => {
      if (categoryFilter !== 'all' && t.categoria !== categoryFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return t.nome.toLowerCase().includes(q) || (t.descricao && t.descricao.toLowerCase().includes(q));
      }
      return true;
    });
  }, [tags, categoryFilter, searchQuery]);

  const getCategoryLabel = (cat: TagItem['categoria']) => {
    switch (cat) {
      case 'programa':
        return `Programas Habitacionais (${settings?.nomeSubsidioEstadual || "Estadual"} / MCMV)`;
      case 'credito':
        return 'Crédito & Caixa Econômica';
      case 'prioridade':
        return 'Prioridade de Atendimento';
      case 'perfil':
        return 'Perfil do Cliente / Família';
      case 'status':
        return 'Status Operacional / Documentos';
      default:
        return 'Geral';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 bg-emerald-50 text-emerald-700 rounded-xl dark:bg-emerald-950/50 dark:text-emerald-300">
              <Tag className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Cadastro de Tags do CRM</h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Crie e personalize as etiquetas de qualificação para os clientes do Jardim Vivência {settings?.nomeSubsidioEstadual || "Estadual"}.
          </p>
        </div>

        <button
          id="btn-cadastrar-nova-tag"
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-sm self-start lg:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Nova Tag</span>
        </button>
      </div>

      {/* Feedback Alert */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center gap-3 border ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* Search & Filter */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar tag por nome ou descrição..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none w-full md:w-auto"
          >
            <option value="all">Todas as Categorias</option>
            <option value="programa">Programas ({settings?.nomeSubsidioEstadual || "Estadual"} / MCMV)</option>
            <option value="credito">Crédito & Caixa</option>
            <option value="prioridade">Prioridade / Urgência</option>
            <option value="perfil">Perfil do Cliente</option>
            <option value="status">Status & Documentação</option>
          </select>
        </div>
      </div>

      {/* Tags Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTags.map((t) => {
          const leadCount = tagLeadCounts[t.nome] || 0;
          return (
            <div
              key={t.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between shadow-2xs hover:border-slate-300 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold border shadow-2xs ${t.bgClass}`}>
                    #{t.nome}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(t)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Editar tag"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(t)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Excluir tag"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                  {getCategoryLabel(t.categoria)}
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                  {t.descricao || 'Sem descrição cadastrada.'}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    <strong>{leadCount}</strong> {leadCount === 1 ? 'cliente associado' : 'clientes associados'}
                  </span>
                </span>

                <button
                  onClick={() => setActiveTab('clientes')}
                  className="text-emerald-600 hover:text-emerald-700 font-semibold hover:underline"
                >
                  Ver no CRM
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Create / Edit Tag */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {editingTag ? 'Editar Tag do CRM' : 'Cadastrar Nova Tag'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Nome */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nome da Tag *
                </label>
                <input
                  type="text"
                  required
                  placeholder={`Ex: Aprovado Caixa, ${settings?.nomeSubsidioEstadual || "Estadual"}...`}
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white"
                />
              </div>

              {/* Categoria */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Categoria da Tag
                </label>
                <select
                  value={formData.categoria}
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value as TagItem['categoria'] })}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white"
                >
                  <option value="programa">Programas ({settings?.nomeSubsidioEstadual || "Estadual"} / MCMV)</option>
                  <option value="credito">Crédito & Caixa Econômica</option>
                  <option value="prioridade">Prioridade / Urgência</option>
                  <option value="perfil">Perfil do Cliente / Família</option>
                  <option value="status">Status & Documentação</option>
                </select>
              </div>

              {/* Paleta de Cores */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Cor da Etiqueta
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => setFormData({ ...formData, cor: c.id })}
                      className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-medium transition-all text-left ${
                        formData.cor === c.id
                          ? 'border-slate-900 bg-slate-50 dark:border-emerald-500 dark:bg-slate-800 shadow-2xs'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <span className={`w-3.5 h-3.5 rounded-full ${c.dot} shrink-0`} />
                      <span className="truncate">{c.label}</span>
                      {formData.cor === c.id && <Check className="w-3.5 h-3.5 ml-auto text-emerald-600" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Descrição Explicativa
                </label>
                <textarea
                  rows={2}
                  placeholder="Explique o critério para aplicar esta tag ao cliente..."
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white resize-none"
                />
              </div>

              {/* Preview */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <span className="text-xs text-slate-500">Prévia visual:</span>
                <span
                  className={`px-3 py-1 rounded-lg text-xs font-bold border ${
                    COLOR_OPTIONS.find((c) => c.id === formData.cor)?.bgClass || 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  #{formData.nome || 'Nome da Tag'}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-sm transition-colors"
                >
                  Salvar Tag
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
