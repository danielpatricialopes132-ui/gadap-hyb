'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { TrendingUp, FileText, Package, Users, Building2, CheckCircle2, ShieldCheck, ArrowUpRight, DollarSign } from 'lucide-react';

export default function DashboardOverview({
  onNavigate,
}: {
  onNavigate: (tab: 'dashboard' | 'companies' | 'entities' | 'catalog' | 'fiscal') => void;
}) {
  const { activeCompany, entities, catalog, documents } = useApp();

  const totalIssued = documents
    .filter((d) => d.status === 'Authorized')
    .reduce((acc, curr) => acc + curr.totalAmount, 0);

  const nfeCount = documents.filter((d) => d.type === 'NFe' && d.status === 'Authorized').length;
  const nfseCount = documents.filter((d) => d.type === 'NFSe' && d.status === 'Authorized').length;

  return (
    <div className="space-y-6">
      {/* Welcome & Unit Context */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl glass-panel relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-500/10 via-cyan-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            Empresa Ativa no Contexto Multi-Tenant
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">{activeCompany?.name}</h2>
          <p className="text-xs text-slate-400 mt-1">
            CNPJ: <span className="font-mono text-slate-200">{activeCompany?.cnpj}</span> • IE: <span className="font-mono text-slate-200">{activeCompany?.ie}</span> • Regime: <span className="text-indigo-400 font-semibold">{activeCompany?.taxRegime}</span>
          </p>
        </div>

        <div className="flex gap-2.5 relative z-10">
          <button
            onClick={() => onNavigate('fiscal')}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Emitir Documento</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Faturado */}
        <div className="p-5 rounded-2xl glass-panel glass-panel-hover relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Volume Faturado</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono mt-3 tracking-tight">
            {totalIssued.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Total de documentos autorizados SEFAZ
          </div>
        </div>

        {/* NF-e Emitidas */}
        <div className="p-5 rounded-2xl glass-panel glass-panel-hover relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">NF-e (Mercadorias)</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500/20 transition-colors">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono mt-3 tracking-tight">{nfeCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            Série {activeCompany?.fiscalSettings.nfeSeries} • Próx: #{ (activeCompany?.fiscalSettings.nfeCurrentNumber || 0) + 1 }
          </div>
        </div>

        {/* NFS-e Emitidas */}
        <div className="p-5 rounded-2xl glass-panel glass-panel-hover relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">NFS-e (Serviços)</span>
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500/20 transition-colors">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono mt-3 tracking-tight">{nfseCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            Série {activeCompany?.fiscalSettings.nfseSeries} • Próx: #{ (activeCompany?.fiscalSettings.nfseCurrentNumber || 0) + 1 }
          </div>
        </div>

        {/* Entidades Isoladas */}
        <div className="p-5 rounded-2xl glass-panel glass-panel-hover relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Entidades Ativas</span>
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 group-hover:bg-sky-500/20 transition-colors">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono mt-3 tracking-tight">{entities.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Clientes e Fornecedores cadastrados</div>
        </div>
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Fiscal Transmissions */}
        <div className="lg:col-span-2 bg-slate-900/40 rounded-2xl border border-slate-800 p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>Últimos Documentos Fiscais Desta Empresa</span>
            </h3>
            <button
              onClick={() => onNavigate('fiscal')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
            >
              Ver todos →
            </button>
          </div>

          <div className="space-y-2.5">
            {documents.slice(0, 4).map((doc) => (
              <div
                key={doc.id}
                className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-black tracking-wider ${
                      doc.type === 'NFe'
                        ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                        : 'bg-cyan-600/20 text-cyan-300 border border-cyan-500/30'
                    }`}
                  >
                    {doc.type}
                  </span>
                  <div>
                    <div className="font-bold text-white text-xs">
                      № {doc.number} <span className="text-slate-400 font-normal">• {doc.entityName}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {new Date(doc.issueDate).toLocaleDateString('pt-BR')} • {doc.entityDocument}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-mono font-bold text-emerald-400 text-xs">
                    {doc.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </div>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1 justify-end">
                    <CheckCircle2 className="w-3 h-3" /> {doc.status}
                  </span>
                </div>
              </div>
            ))}

            {documents.length === 0 && (
              <div className="text-center py-8 text-xs text-slate-500">
                Nenhum documento emitido nesta filial.
              </div>
            )}
          </div>
        </div>

        {/* Quick Hub Navigation & Tenant Info */}
        <div className="space-y-4">
          <div className="bg-slate-900/40 rounded-2xl border border-slate-800 p-5">
            <h3 className="text-sm font-bold text-white mb-3">Atalhos Operacionais</h3>
            <div className="space-y-2">
              <button
                onClick={() => onNavigate('entities')}
                className="w-full p-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800 text-left border border-slate-800 text-xs text-slate-300 flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-400" />
                  <span>Gerenciar Clientes & Fornecedores</span>
                </div>
                <span className="font-mono text-slate-500">({entities.length})</span>
              </button>

              <button
                onClick={() => onNavigate('catalog')}
                className="w-full p-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800 text-left border border-slate-800 text-xs text-slate-300 flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-cyan-400" />
                  <span>Catálogo de Produtos e Serviços</span>
                </div>
                <span className="font-mono text-slate-500">({catalog.length})</span>
              </button>

              <button
                onClick={() => onNavigate('companies')}
                className="w-full p-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800 text-left border border-slate-800 text-xs text-slate-300 flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-400" />
                  <span>Filiais & Configuração Multi-Tenant</span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
              </button>
            </div>
          </div>

          <div className="bg-indigo-950/30 rounded-2xl border border-indigo-500/20 p-4 text-xs">
            <div className="flex items-center gap-2 text-indigo-300 font-bold mb-1">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Multi-Tenant Logical Isolation</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Todos os registros de faturamento, catálogo e entidades estão isolados pela chave lógica{' '}
              <code className="text-indigo-300 font-mono bg-indigo-900/50 px-1 py-0.5 rounded">
                company_id: {activeCompany?.id}
              </code>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
