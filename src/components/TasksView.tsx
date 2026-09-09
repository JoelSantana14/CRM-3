import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Task } from '../types';
import {
  CheckSquare,
  Plus,
  Clock,
  AlertCircle,
  Phone,
  MessageSquare,
  FileText,
  Trash2,
  Calendar,
  Layers,
} from 'lucide-react';

export const TasksView: React.FC = () => {
  const { tasks, addTask, toggleTask, deleteTask, currentUser, users, leads } = useApp();

  const [showModal, setShowModal] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [leadId, setLeadId] = useState('');
  const [dataVencimento, setDataVencimento] = useState(() => new Date().toISOString().split('T')[0]);
  const [prioridade, setPrioridade] = useState<Task['prioridade']>('alta');
  const [tipo, setTipo] = useState<Task['tipo']>('ligar');

  const visibleTasks = tasks.filter((t) => {
    if (currentUser.role === 'corretor') {
      return t.corretorId === currentUser.id;
    }
    return true;
  });

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;

    const leadObj = leads.find((l) => l.id === leadId);

    addTask({
      titulo: titulo.trim(),
      descricao: descricao.trim(),
      leadId: leadId || undefined,
      leadNome: leadObj?.nome,
      corretorId: currentUser.id,
      corretorNome: currentUser.name,
      dataVencimento,
      prioridade,
      tipo,
    });

    setTitulo('');
    setDescricao('');
    setShowModal(false);
  };

  const getPriorityBadge = (p: Task['prioridade']) => {
    switch (p) {
      case 'urgente':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">Urgente</span>;
      case 'alta':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">Alta</span>;
      case 'media':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">Média</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">Baixa</span>;
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tarefas & Compromissos</h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Organização de ligações de retorno, coleta de documentos, propostas e assinaturas.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Tarefa</span>
        </button>
      </div>

      {/* Task List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-3">
        <div className="space-y-2.5">
          {visibleTasks.map((task) => (
            <div
              key={task.id}
              className={`p-4 rounded-xl border flex items-start justify-between gap-4 transition-all ${
                task.concluida
                  ? 'bg-slate-50 border-slate-200/80 opacity-60'
                  : 'bg-white border-slate-200 hover:border-emerald-500/50 shadow-2xs'
              }`}
            >
              <div className="flex items-start gap-3 flex-1">
                <input
                  type="checkbox"
                  checked={task.concluida}
                  onChange={() => toggleTask(task.id)}
                  className="mt-1 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4
                      className={`text-xs font-bold text-slate-900 ${
                        task.concluida ? 'line-through text-slate-400' : ''
                      }`}
                    >
                      {task.titulo}
                    </h4>
                    {getPriorityBadge(task.prioridade)}
                  </div>

                  {task.descricao && (
                    <p className="text-xs text-slate-600">{task.descricao}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-1">
                    {task.leadNome && (
                      <span className="font-semibold text-slate-700">Cliente: {task.leadNome}</span>
                    )}
                    <span>Vencimento: <b>{task.dataVencimento}</b></span>
                    <span>Responsável: {task.corretorNome}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => deleteTask(task.id)}
                className="text-slate-400 hover:text-red-600 p-1 transition-colors"
                title="Excluir tarefa"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          {visibleTasks.length === 0 && (
            <div className="p-8 text-center text-slate-400 text-xs italic">
              Nenhuma tarefa pendente no momento.
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Criar Nova Tarefa</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3.5 text-xs">
              <div>
                <label className="font-medium text-slate-700">Título da Tarefa:</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Ligar para confirmar aprovação Caixa"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-medium text-slate-700">Descrição / Observações:</label>
                <textarea
                  rows={2}
                  placeholder="Instruções ou documentos a solicitar..."
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-slate-700">Data de Vencimento:</label>
                  <input
                    type="date"
                    value={dataVencimento}
                    onChange={(e) => setDataVencimento(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="font-medium text-slate-700">Prioridade:</label>
                  <select
                    value={prioridade}
                    onChange={(e) => setPrioridade(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="baixa">Baixa</option>
                    <option value="media">Média</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-medium text-slate-700">Vincular a um Cliente (Opcional):</label>
                <select
                  value={leadId}
                  onChange={(e) => setLeadId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="">Nenhum cliente selecionado</option>
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.nome} ({l.telefone})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs rounded-xl font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs rounded-xl font-semibold bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  Salvar Tarefa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
