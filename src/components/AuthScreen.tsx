'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { UserRole } from '@/types/domain';
import { ShieldCheck, ArrowRight, Building2, Lock, Mail, KeyRound, Sparkles, CheckCircle2, ChevronRight } from 'lucide-react';

export default function AuthScreen() {
  const { login, companies } = useApp();
  const [accessCode, setAccessCode] = useState('GADAP-SP-9031');
  const [email, setEmail] = useState('admin@gadap.com.br');
  const [password, setPassword] = useState('••••••••••••');
  const [role, setRole] = useState<UserRole>('Admin');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      const ok = login(accessCode, email, role);
      if (!ok) {
        setError('Chave de Acesso da Empresa inválida ou não encontrada. Verifique os dados.');
        setIsLoading(false);
      }
    }, 400);
  };

  const handleSelectQuickCompany = (code: string) => {
    setAccessCode(code);
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-slate-900 text-slate-100 font-sans">
      {/* Left Promotional & Architecture Banner */}
      <div className="relative lg:w-7/12 p-8 lg:p-16 flex flex-col justify-between overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 border-r border-indigo-900/30">
        {/* Ambient Glows */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 right-10 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Branding */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-[1px] shadow-lg shadow-indigo-500/25">
            <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
              <span className="font-black text-xl tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-300">
                G
              </span>
            </div>
          </div>
          <div>
            <h1 className="font-extrabold text-2xl tracking-tight text-white flex items-center gap-2">
              GADAP <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">HUB v2.6</span>
            </h1>
            <p className="text-xs text-slate-400 tracking-wider uppercase font-medium">Plataforma Central de Gestão Multiempresas</p>
          </div>
        </div>

        {/* Hero Narrative */}
        <div className="relative z-10 my-12 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 text-xs font-medium mb-6">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Isolamento Lógico Estrito por Tenant + Emissor Baixo Custo</span>
          </div>

          <h2 className="text-3xl lg:text-5xl font-black text-white tracking-tight leading-tight mb-6">
            Gestão Corporativa & Emissão Fiscal de{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-300 to-cyan-300">
              Alta Performance
            </span>
          </h2>

          <p className="text-slate-300 text-base leading-relaxed mb-8">
            Desenvolvido para gerenciar ecossistemas com múltiplas filiais e regimes tributários (Simples Nacional, Lucro Presumido e Real), garantindo governança de cadastros base e automação de NF-e e NFS-e.
          </p>

          {/* Pillars List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-cyan-300 font-semibold text-sm mb-1">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" /> Multi-Tenant Nativo
              </div>
              <p className="text-xs text-slate-400">Context Switching sem re-autenticação e blindagem total por `company_id`.</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-indigo-300 font-semibold text-sm mb-1">
                <CheckCircle2 className="w-4 h-4 text-indigo-400" /> Emissor Provider-Agnostic
              </div>
              <p className="text-xs text-slate-400">Integração descomplicada com Nuvem Fiscal, Focus NFe e SEFAZ Estadual.</p>
            </div>
          </div>
        </div>

        {/* Fast Company Switcher Preview */}
        <div className="relative z-10 p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
          <span className="text-slate-400 font-medium block mb-2">Chaves de Acesso Cadastradas para Demonstração:</span>
          <div className="flex flex-wrap gap-2">
            {companies.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => handleSelectQuickCompany(c.accessCode)}
                className={`px-3 py-1.5 rounded-lg border text-left transition-all flex items-center gap-1.5 ${
                  accessCode === c.accessCode
                    ? 'border-indigo-500 bg-indigo-500/20 text-white font-semibold'
                    : 'border-slate-800 bg-slate-800/40 text-slate-300 hover:border-slate-700'
                }`}
              >
                <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>{c.tradeName}</span>
                <span className="text-[10px] text-slate-400 font-mono">({c.accessCode})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Login Card */}
      <div className="lg:w-5/12 bg-slate-950 flex flex-col justify-center px-8 sm:px-14 py-12 relative">
        <div className="max-w-md w-full mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h3 className="text-2xl font-black text-white tracking-tight">Acesso ao Hub Corporativo</h3>
            <p className="text-slate-400 text-sm mt-1.5">
              Insira as credenciais de operador e a chave de acesso da sua unidade.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <span className="font-bold text-sm">✕</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Chave de Acesso (Company Code) */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Chave de Acesso da Empresa (Company Code)
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400" />
                <input
                  type="text"
                  required
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  placeholder="Ex: GADAP-SP-9031"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-white placeholder-slate-500 text-sm font-mono tracking-wider transition-colors outline-none"
                />
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">Chave única vinculada à sua unidade ou filial.</span>
            </div>

            {/* Email / Usuário */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                E-mail Corporativo
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@gadap.com.br"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-white placeholder-slate-500 text-sm transition-colors outline-none"
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Senha
                </label>
                <a href="#forgot" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                  Esqueci minha senha
                </a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-white placeholder-slate-500 text-sm transition-colors outline-none"
                />
              </div>
            </div>

            {/* Perfil de Acesso (RBAC) */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Perfil de Acesso (RBAC)
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['Admin', 'Financeiro', 'Fiscal', 'Operador'] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`py-2 text-xs font-medium rounded-lg border transition-all ${
                      role === r
                        ? 'border-indigo-500 bg-indigo-600/20 text-indigo-300 font-semibold shadow-sm'
                        : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-6 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-70 cursor-pointer"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Entrar no GADAP Hub</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer security tag */}
          <div className="mt-10 pt-6 border-t border-slate-900 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Conexão Criptografada TLS 1.3</span>
            </div>
            <span>app.gadap.com.br</span>
          </div>
        </div>
      </div>
    </div>
  );
}
