import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Lock, Mail, AlertCircle, LogIn, Eye, EyeOff, ShieldCheck, KeyRound, Building2, X } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { loginDetailed, settings, resetPassword } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorType, setErrorType] = useState<'not_found' | 'invalid_password' | 'inactive' | 'success' | ''>('');

  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [recoveryMessage, setRecoveryMessage] = useState('');
  const [recoverySuccess, setRecoverySuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setErrorType('');

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail) {
      setErrorMessage('Por favor, informe seu e-mail de login cadastrado.');
      return;
    }

    if (!cleanPassword) {
      setErrorMessage('Por favor, digite sua senha de acesso.');
      return;
    }

    const result = loginDetailed(cleanEmail, cleanPassword);
    if (!result.success) {
      setErrorType(result.reason);
      setErrorMessage(result.message);
    }
  };

  const fillEmailOnly = (userEmail: string) => {
    setEmail(userEmail);
    setErrorMessage('');
    setErrorType('');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800/90 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl">
        <div className="p-7 sm:p-9">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 mx-auto mb-3.5 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-lg shadow-emerald-900/40">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              {settings.nomeEmpreendimento || 'OTS Master CRM'}
            </h1>
            <p className="text-emerald-400 text-xs font-semibold uppercase tracking-wider mt-0.5">
              Portal de Acesso Restrito ao Plantão & Vendas
            </p>
          </div>

          {/* Security Banner */}
          <div className="mb-6 p-3 bg-emerald-950/40 border border-emerald-800/50 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="text-emerald-200">Acesso Restrito:</strong> Somente usuários cadastrados pelo Administrador têm permissão de entrada. O login é o <strong>e-mail cadastrado</strong>.
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-5 p-4 bg-rose-950/60 border border-rose-800/70 rounded-2xl flex items-start gap-3 animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-bold text-rose-200">
                  {errorType === 'not_found'
                    ? 'Usuário Não Cadastrado'
                    : errorType === 'invalid_password'
                    ? 'Senha Incorreta'
                    : errorType === 'inactive'
                    ? 'Acesso Bloqueado'
                    : 'Aviso de Autenticação'}
                </p>
                <p className="text-rose-300/90 mt-0.5 leading-relaxed">{errorMessage}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                E-mail de Login
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                  placeholder="exemplo: usuario@vivencia.com.br"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Senha de Acesso
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-11 py-3 bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                  placeholder="Digite sua senha"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                  title={showPassword ? 'Ocultar senha' : 'Ver senha'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex justify-end mt-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setShowRecoveryModal(true);
                    setRecoveryMessage('');
                    setRecoverySuccess(false);
                    setRecoveryEmail(email);
                    setNewPassword('');
                  }}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
                >
                  Esqueci minha senha?
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full mt-2 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-emerald-950/50 hover:shadow-emerald-900/70"
            >
              <LogIn className="w-4 h-4" />
              <span>Entrar no Sistema</span>
            </button>
          </form>

          {/* Informação sobre primeiro acesso e seleção rápida de e-mails */}
          <div className="mt-6 pt-5 border-t border-slate-700/60">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-2.5">
              <KeyRound className="w-3.5 h-3.5 text-slate-400" />
              <span>Contas Cadastradas (Preenchimento Rápido de E-mail):</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => fillEmailOnly('joelsantanaimoveis@gmail.com')}
                className="p-2.5 bg-slate-900/60 hover:bg-slate-900 border border-slate-700 rounded-xl text-left transition-colors cursor-pointer"
              >
                <div className="font-bold text-amber-400 flex items-center justify-between">
                  <span>Administrador</span>
                  <span className="text-[10px] bg-amber-950/80 text-amber-300 px-1 rounded">Joel</span>
                </div>
                <div className="text-[11px] text-slate-300 truncate mt-0.5">joelsantanaimoveis@gmail.com</div>
              </button>

              <button
                type="button"
                onClick={() => fillEmailOnly('correspondente.sertao@caixa.com.br')}
                className="p-2.5 bg-slate-900/60 hover:bg-slate-900 border border-slate-700 rounded-xl text-left transition-colors cursor-pointer"
              >
                <div className="font-bold text-indigo-400 flex items-center justify-between">
                  <span>Correspondente CEF</span>
                  <span className="text-[10px] bg-indigo-950/80 text-indigo-300 px-1 rounded">Agência</span>
                </div>
                <div className="text-[11px] text-slate-300 truncate mt-0.5">correspondente.sertao@caixa.com.br</div>
              </button>

              <button
                type="button"
                onClick={() => fillEmailOnly('lucas.corretor@vivencia.com.br')}
                className="p-2.5 bg-slate-900/60 hover:bg-slate-900 border border-slate-700 rounded-xl text-left transition-colors cursor-pointer"
              >
                <div className="font-bold text-sky-400 flex items-center justify-between">
                  <span>Corretor</span>
                  <span className="text-[10px] bg-sky-950/80 text-sky-300 px-1 rounded">Lucas</span>
                </div>
                <div className="text-[11px] text-slate-300 truncate mt-0.5">lucas.corretor@vivencia.com.br</div>
              </button>
            </div>
            
            <p className="text-[11px] text-slate-400 text-center mt-3 leading-relaxed">
              Por motivos de segurança e sigilo, a senha inicial de acesso para cada perfil está descrita exclusivamente no <strong>Manual Interno do Usuário</strong> e poderá ser alterada pelo usuário após o login.
            </p>
          </div>
        </div>
      </div>

      {showRecoveryModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-emerald-400" />
                <span>Recuperação de Senha</span>
              </h3>
              <button
                onClick={() => setShowRecoveryModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {recoveryMessage ? (
              <div className={`p-4 rounded-2xl mb-4 text-xs ${recoverySuccess ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-200' : 'bg-rose-950/80 border border-rose-800 text-rose-200'}`}>
                <p className="font-bold">{recoverySuccess ? 'Sucesso!' : 'Atenção'}</p>
                <p className="mt-1">{recoveryMessage}</p>
              </div>
            ) : (
              <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                Informe o seu e-mail cadastrado e defina uma nova senha para restaurar o seu acesso ao sistema.
              </p>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const res = resetPassword(recoveryEmail, newPassword);
                setRecoverySuccess(res.success);
                setRecoveryMessage(res.message);
                if (res.success) {
                  setEmail(recoveryEmail);
                }
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">E-mail Cadastrado</label>
                <input
                  type="email"
                  required
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  placeholder="seu.email@vivencia.com.br"
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Nova Senha (mín. 4 caracteres)</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nova senha de acesso"
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRecoveryModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors"
                >
                  Fechar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-colors shadow-lg shadow-emerald-950/40"
                >
                  Redefinir Senha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

