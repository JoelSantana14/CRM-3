import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Task } from '../types';
import {
  AlertTriangle,
  CalendarX,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  ArrowRight,
  User,
  Phone,
  MessageSquare,
  FileText,
  Building,
} from 'lucide-react';

export const TaskAlertBanner: React.FC = () => {
  const { tasks, toggleTask, currentUser, setActiveTab } = useApp();
  const [isExpanded, setIsExpanded] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  // Filter tasks visible to current user
  const visibleTasks = tasks.filter((t) => {
    if (currentUser.role === 'corretor') {
      return t.corretorId === currentUser.id;
    }
    return true;
  });

  // Filter only overdue tasks (not completed and due date before today)
  const overdueTasks = visibleTasks.filter(
    (t) => !t.concluida && t.dataVencimento && t.dataVencimento < todayStr
  );

  // If no overdue tasks, do NOT render the banner
  if (overdueTasks.length === 0) {
    return null;
  }

  // Calculate days overdue
  const getDaysOverdue = (dateStr: string) => {
    try {
      const dueDate = new Date(dateStr + 'T00:00:00');
      const todayDate = new Date(todayStr + 'T00:00:00');
      const diffTime = todayDate.getTime() - dueDate.getTime();
      const diffDays = Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
      return diffDays;
    } catch {
      return 1;
    }
  };

  const getPriorityBadge = (prioridade: Task['prioridade']) => {
    switch (prioridade) {
      case 'urgente':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-500 text-white shadow-2xs">
            Urgente
          </span>
        );
      case 'alta':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-100">
            Alta
          </span>
        );
      case 'media':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200">
            Média
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            Baixa
          </span>
        );
    }
  };

  const getTypeIcon = (tipo: Task['tipo']) => {
    switch (tipo) {
      case 'ligar':
        return <Phone className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />;
      case 'whatsapp':
        return <MessageSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />;
      case 'visita':
        return <Building className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />;
      case 'documentos':
      case 'simulacao':
      case 'assinatura':
        return <FileText className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />;
    }
  };

  const urgentCount = overdueTasks.filter((t) => t.prioridade === 'urgente' || t.prioridade === 'alta').length;

  return (
    <div className="bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-200 dark:border-rose-800/80 rounded-3xl p-4 sm:p-5 shadow-xs transition-all animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Left info */}
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="p-3 bg-rose-600 text-white rounded-2xl shrink-0 shadow-sm flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-xs sm:text-sm font-black text-rose-950 dark:text-rose-100 flex items-center gap-1.5">
                <CalendarX className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <span>Task Alert • Alerta de Tarefas Vencidas</span>
              </h4>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-200 dark:bg-rose-900 text-rose-950 dark:text-rose-100 border border-rose-300/60 dark:border-rose-700">
                {overdueTasks.length} {overdueTasks.length === 1 ? 'tarefa atrasada' : 'tarefas atrasadas'}
              </span>
              {urgentCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-600 text-white animate-pulse">
                  {urgentCount} urgente{urgentCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <p className="text-xs text-rose-800/90 dark:text-rose-300/90 mt-1 leading-relaxed">
              Existem pendências com prazo de vencimento expirado que precisam de tratativa imediata para não comprometer o atendimento aos clientes.
            </p>
          </div>
        </div>

        {/* Right buttons */}
        <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 text-rose-900 dark:text-rose-200 border border-rose-200 dark:border-rose-800 hover:bg-rose-100/60 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span>{isExpanded ? 'Ocultar Lista' : 'Ver Lista Rápida'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tarefas')}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 active:scale-98 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Gerenciar Tarefas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Expanded Quick List */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-rose-200/80 dark:border-rose-800/70 space-y-2.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-rose-900/80 dark:text-rose-300 px-1">
            <span>Tarefas pendentes que ultrapassaram a data limite:</span>
            <span>Clique no checkbox para marcar como concluída</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
            {overdueTasks.map((task) => {
              const days = getDaysOverdue(task.dataVencimento);
              return (
                <div
                  key={task.id}
                  className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-rose-200/70 dark:border-rose-900/60 shadow-2xs flex items-start gap-3 hover:border-rose-400 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={task.concluida}
                    onChange={() => toggleTask(task.id)}
                    className="mt-1 w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer accent-rose-600 shrink-0"
                    title="Marcar como concluída"
                  />

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {getTypeIcon(task.tipo)}
                        <h5 className="text-xs font-black text-slate-900 dark:text-white truncate">
                          {task.titulo}
                        </h5>
                      </div>
                      {getPriorityBadge(task.prioridade)}
                    </div>

                    {task.descricao && (
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-1">
                        {task.descricao}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-500 dark:text-slate-400 pt-0.5">
                      <span className="font-bold text-rose-600 dark:text-rose-400">
                        Atrasada há {days} {days === 1 ? 'dia' : 'dias'} (venceu {task.dataVencimento})
                      </span>
                      {task.leadNome && (
                        <span className="truncate flex items-center gap-0.5 text-slate-700 dark:text-slate-300 font-semibold">
                          <User className="w-3 h-3" />
                          {task.leadNome}
                        </span>
                      )}
                      <span>Resp: {task.corretorNome}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
