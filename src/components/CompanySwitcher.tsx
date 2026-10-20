'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Building2, ChevronDown, Check, Plus, Shield, ExternalLink } from 'lucide-react';

export default function CompanySwitcher() {
  const { companies, activeCompany, switchCompany, session } = useApp();
  const [isOpen, setIsOpen] = useState(false);

  if (!activeCompany) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-700/60 transition-all text-left group"
      >
        <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
          <Building2 className="w-4 h-4" />
        </div>
        <div className="hidden md:block">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-white tracking-tight">{activeCompany.tradeName}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono">
              {activeCompany.taxRegime.split(' ')[0]}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
            <span>CNPJ: {activeCompany.cnpj}</span>
          </div>
        </div>
        <ChevronDown className="w-4 h-4 text-slate-400 ml-1 group-hover:text-white transition-colors" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 mt-2 w-80 rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl z-50 p-2 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="px-3 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800 flex justify-between items-center">
              <span>Alternar Unidade / Empresa</span>
              <span className="text-[10px] text-indigo-400 font-mono">Multi-Tenant</span>
            </div>

            <div className="max-h-64 overflow-y-auto py-1 space-y-1">
              {companies.map((comp) => {
                const isSelected = comp.id === activeCompany.id;
                return (
                  <button
                    key={comp.id}
                    onClick={() => {
                      switchCompany(comp.id);
                      setIsOpen(false);
                    }}
                    className={`w-full p-2.5 rounded-xl flex items-start justify-between text-left transition-all ${
                      isSelected
                        ? 'bg-indigo-600/20 border border-indigo-500/40 text-white'
                        : 'hover:bg-slate-800/60 text-slate-300 border border-transparent'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold flex items-center gap-1.5">
                        <span>{comp.tradeName}</span>
                        {isSelected && <span className="text-[9px] px-1 rounded bg-indigo-500 text-white">Ativa</span>}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">{comp.cnpj}</div>
                      <div className="text-[10px] text-indigo-400 font-medium mt-0.5">
                        {comp.taxRegime} • Série {comp.fiscalSettings.nfeSeries} (NF {comp.fiscalSettings.nfeCurrentNumber})
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />}
                  </button>
                );
              })}
            </div>

            <div className="pt-2 mt-1 border-t border-slate-800 px-2 py-1 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-emerald-400" /> Isolamento lógico garantido
              </span>
              <span className="font-mono text-slate-500">ID: {activeCompany.id}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
