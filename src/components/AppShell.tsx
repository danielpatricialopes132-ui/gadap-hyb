'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import AuthScreen from '@/components/AuthScreen';
import CompanySwitcher from '@/components/CompanySwitcher';
import DashboardOverview from '@/components/DashboardOverview';
import CompaniesManager from '@/components/CompaniesManager';
import EntitiesManager from '@/components/EntitiesManager';
import CatalogManager from '@/components/CatalogManager';
import FiscalModule from '@/components/FiscalModule';
import {
  LayoutDashboard,
  Building2,
  Users,
  Package,
  FileCode,
  LogOut,
  Bell,
  Search,
  Shield,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';

type Tab = 'dashboard' | 'companies' | 'entities' | 'catalog' | 'fiscal';

export default function AppShell() {
  const { session, logout, activeCompany } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!session) {
    return <AuthScreen />;
  }

  const navItems = [
    { id: 'dashboard' as Tab, label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'fiscal' as Tab, label: 'Emissor Fiscal (NF-e/NFS-e)', icon: FileCode, badge: 'Low-Cost' },
    { id: 'entities' as Tab, label: 'Clientes & Fornecedores', icon: Users },
    { id: 'catalog' as Tab, label: 'Produtos & Serviços', icon: Package },
    { id: 'companies' as Tab, label: 'Unidades & Empresas', icon: Building2 },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header Navbar */}
      <header className="sticky top-0 z-30 h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-4 sm:gap-6">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-xl text-slate-400 hover:text-white md:hidden"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-[1px] shadow-md shadow-indigo-600/30">
              <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
                <span className="font-black text-lg tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-300">
                  G
                </span>
              </div>
            </div>
            <div>
              <div className="font-extrabold text-base tracking-tight text-white flex items-center gap-2">
                GADAP <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono">HUB</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Supabase Live
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-medium hidden sm:block">app.gadap.com.br</div>
            </div>
          </div>

          <div className="h-6 w-[1px] bg-slate-800 hidden md:block" />

          {/* Context-level Multi-Tenant Switcher */}
          <CompanySwitcher />
        </div>

        {/* Right Session & Operator profile */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-bold text-slate-200">{session.name}</span>
            <div className="flex items-center gap-1.5 justify-end">
              <span className="text-[10px] px-2 py-0.2 rounded-full bg-indigo-500/10 text-indigo-400 font-semibold border border-indigo-500/20">
                {session.role}
              </span>
            </div>
          </div>

          <button
            onClick={logout}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            title="Sair do Hub"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar Navigation */}
        <aside
          className={`fixed inset-y-0 left-0 z-20 w-64 pt-16 bg-slate-950/95 border-r border-slate-800 flex flex-col justify-between transition-transform duration-200 md:static md:translate-x-0 ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="p-4 space-y-1">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-2">
              Navegação Central
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                    isActive
                      ? 'bg-indigo-600/15 text-white border border-indigo-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? 'text-indigo-400' : 'text-slate-400'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 font-mono border border-cyan-500/30">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer Sidebar Info */}
          <div className="p-4 border-t border-slate-800/80">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <div className="flex items-center gap-1.5 text-indigo-400 font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>GADAP Core Architecture</span>
              </div>
              <div>Tenant ID: <span className="font-mono text-slate-300">{activeCompany?.id}</span></div>
              <div className="text-[10px] text-slate-500">PostgreSQL + Drizzle Isolation Schema</div>
            </div>
          </div>
        </aside>

        {/* Dynamic Main Workspace Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-950">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && <DashboardOverview onNavigate={setActiveTab} />}
            {activeTab === 'fiscal' && <FiscalModule />}
            {activeTab === 'entities' && <EntitiesManager />}
            {activeTab === 'catalog' && <CatalogManager />}
            {activeTab === 'companies' && <CompaniesManager />}
          </div>
        </main>
      </div>
    </div>
  );
}
