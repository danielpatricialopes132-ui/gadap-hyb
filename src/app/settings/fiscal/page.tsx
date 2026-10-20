'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import {
  ShieldCheck,
  Zap,
  Building2,
  Key,
  Server,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCw,
  ExternalLink,
  ChevronLeft,
  FileText,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';

export default function FiscalSettingsPage() {
  const { activeCompany, updateFiscalSettings } = useApp();

  const currentSettings = activeCompany?.fiscalSettings || {
    provider: 'fiscal_contora',
    environment: 'homologacao',
    certificateA1Installed: true,
    nfeSeries: 1,
    nfeCurrentNumber: 1,
    nfseSeries: 1,
    nfseCurrentNumber: 1,
    focusNfeToken: '',
    fiscalContoraApiKey: '',
    fiscalContoraSecret: '',
  };

  const [provider, setProvider] = useState<'focus_nfe' | 'contora' | 'fiscal_contora'>(
    (currentSettings.provider as any) || 'contora'
  );
  const [environment, setEnvironment] = useState<'homologacao' | 'producao'>(
    currentSettings.environment || 'homologacao'
  );

  // Specific credentials per company
  const [focusNfeToken, setFocusNfeToken] = useState(currentSettings.focusNfeToken || '');
  const [contoraApiKey, setContoraApiKey] = useState(currentSettings.fiscalContoraApiKey || '');
  const [contoraSecret, setContoraSecret] = useState(currentSettings.fiscalContoraSecret || '');

  const [nfeSeries, setNfeSeries] = useState(currentSettings.nfeSeries || 1);
  const [nfeCurrentNumber, setNfeCurrentNumber] = useState(currentSettings.nfeCurrentNumber || 1);
  const [nfseSeries, setNfseSeries] = useState(currentSettings.nfseSeries || 1);
  const [nfseCurrentNumber, setNfseCurrentNumber] = useState(currentSettings.nfseCurrentNumber || 1);

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Test Invoice Preview state
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [showTestModal, setShowTestModal] = useState(false);

  const handleSave = () => {
    updateFiscalSettings({
      ...currentSettings,
      provider: provider === 'contora' ? 'fiscal_contora' : provider,
      environment,
      nfeSeries: Number(nfeSeries),
      nfeCurrentNumber: Number(nfeCurrentNumber),
      nfseSeries: Number(nfseSeries),
      nfseCurrentNumber: Number(nfseCurrentNumber),
      focusNfeToken: focusNfeToken.trim(),
      fiscalContoraApiKey: contoraApiKey.trim(),
      fiscalContoraSecret: contoraSecret.trim(),
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleRunTestEmission = async () => {
    setIsTesting(true);
    setTestResult(null);
    setShowTestModal(true);

    try {
      const res = await fetch('/api/fiscal/test-emission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: provider === 'contora' ? 'contora' : 'focus_nfe',
          company: {
            id: activeCompany?.id,
            cnpj: activeCompany?.cnpj,
            series: nfeSeries,
            number: nfeCurrentNumber + 1,
          },
          credentials: {
            focusToken: focusNfeToken || undefined,
            contoraApiKey: contoraApiKey || undefined,
            contoraSecret: contoraSecret || undefined,
            environment,
          },
        }),
      });

      const data = await res.json();
      setTestResult(data);
    } catch (err: any) {
      setTestResult({
        success: false,
        error: err.message || 'Falha na conexão com o servidor',
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Top Breadcrumb & Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="space-y-1">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold mb-1 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Voltar ao Painel Principal
            </Link>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <Zap className="w-6 h-6 text-indigo-400" />
              Configurações Fiscais da Empresa
            </h1>
            <p className="text-xs text-slate-400">
              Gerencie a estratégia dual de emissão fiscal (Focus NFe + Fiscal Contora) e credenciais por unidade.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRunTestEmission}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Simular Emissão de Teste
            </button>

            <button
              onClick={handleSave}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              Salvar Alterações
            </button>
          </div>
        </div>

        {savedSuccess && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Configurações fiscais da unidade <strong>{activeCompany?.tradeName}</strong> atualizadas com sucesso!</span>
          </div>
        )}

        {/* Active Company Info Card */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Unidade Emitente Ativa:</div>
              <div className="text-sm font-bold text-white">{activeCompany?.name}</div>
              <div className="text-[11px] text-slate-400 font-mono">CNPJ: {activeCompany?.cnpj} • IE: {activeCompany?.ie}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 font-mono">
              Regime: {activeCompany?.taxRegime}
            </span>
            <span className={`text-[11px] px-2.5 py-1 rounded-lg font-semibold border flex items-center gap-1.5 ${
              environment === 'producao'
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${environment === 'producao' ? 'bg-rose-400' : 'bg-amber-400'}`} />
              {environment === 'producao' ? 'Ambiente: Produção (Real)' : 'Ambiente: Homologação (SEFAZ)'}
            </span>
          </div>
        </div>

        {/* 1. SELEÇÃO DO PROVEDOR FISCAL PRINCIPAL */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Server className="w-4 h-4 text-indigo-400" />
                Motor Fiscal Ativo (Dual Engine Strategy)
              </h2>
              <p className="text-xs text-slate-400">
                Selecione qual provedor processará as notas fiscais (NF-e mod. 55 e NFS-e mod. 00) para esta empresa.
              </p>
            </div>

            <div className="text-[11px] px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
              Engine Redundancy Ready
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card Fiscal Contora - Provedor Principal */}
            <div
              onClick={() => setProvider('contora')}
              className={`p-5 rounded-xl border cursor-pointer transition-all ${
                provider === 'contora' || provider === 'fiscal_contora'
                  ? 'bg-cyan-600/15 border-cyan-500 ring-2 ring-cyan-500/20'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 opacity-75'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                    provider === 'contora' || provider === 'fiscal_contora'
                      ? 'bg-cyan-500 text-white'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    C
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      Fiscal Contora
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                        Provedor Principal
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">API v1 • Gateway SEFAZ de Alta Performance</div>
                  </div>
                </div>

                <input
                  type="radio"
                  name="fiscal_provider"
                  checked={provider === 'contora' || provider === 'fiscal_contora'}
                  onChange={() => setProvider('contora')}
                  className="mt-1 text-cyan-600 focus:ring-cyan-500"
                />
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                <div>• Base URL: <code className="text-slate-300">https://api.fiscal.contora.com.br/v1</code></div>
                <div>• Autenticação: Bearer Token / X-Contora-Api-Key</div>
                <div>• Motor de alta disponibilidade e emissão instantânea</div>
              </div>
            </div>

            {/* Card Focus NFe - Opção Secundária */}
            <div
              onClick={() => setProvider('focus_nfe')}
              className={`p-5 rounded-xl border cursor-pointer transition-all ${
                provider === 'focus_nfe'
                  ? 'bg-indigo-600/15 border-indigo-500 ring-2 ring-indigo-500/20'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 opacity-75'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                    provider === 'focus_nfe' ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    F
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      Focus NFe
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                        Opção Secundária
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">API REST v2 • Backup e Redundância</div>
                  </div>
                </div>

                <input
                  type="radio"
                  name="fiscal_provider"
                  checked={provider === 'focus_nfe'}
                  onChange={() => setProvider('focus_nfe')}
                  className="mt-1 text-indigo-600 focus:ring-indigo-500"
                />
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                <div>• Homologação: <code className="text-slate-300">homologacao.focusnfe.com.br</code></div>
                <div>• Produção: <code className="text-slate-300">api.focusnfe.com.br</code></div>
                <div>• Autenticação: Basic Auth via Token</div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. CREDENCIAIS ESPECÍFICAS DA EMPRESA */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-indigo-400" />
                Credenciais e Chaves de Acesso
              </h2>
              <p className="text-xs text-slate-400">
                Configure chaves específicas para esta unidade. Se deixado em branco, o sistema usará as variáveis de ambiente globais (.env).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Focus NFe Credentials */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  Focus NFe Token
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {focusNfeToken ? 'Chave personalizada' : 'Usando .env global'}
                </span>
              </div>

              <div>
                <input
                  type="password"
                  value={focusNfeToken}
                  onChange={(e) => setFocusNfeToken(e.target.value)}
                  placeholder="Deixe em branco para usar FOCUS_NFE_TOKEN global"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Global configurado: <code className="text-slate-400">FOCUS_NFE_TOKEN (Ativo)</code>
                </p>
              </div>
            </div>

            {/* Fiscal Contora Credentials */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  Fiscal Contora API Key
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {contoraApiKey ? 'Chave personalizada' : 'Usando .env global'}
                </span>
              </div>

              <div className="space-y-2">
                <input
                  type="password"
                  value={contoraApiKey}
                  onChange={(e) => setContoraApiKey(e.target.value)}
                  placeholder="Deixe em branco para usar CONTORA_API_KEY global"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                />
                <input
                  type="password"
                  value={contoraSecret}
                  onChange={(e) => setContoraSecret(e.target.value)}
                  placeholder="Contora Secret (Opcional)"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                />
                <p className="text-[10px] text-slate-500">
                  Global configurado: <code className="text-slate-400">CONTORA_API_KEY (fct_kZb1i...Ur9cqtGP)</code>
                </p>
              </div>
            </div>
          </div>

          {/* Numeração e Séries */}
          <div className="pt-4 border-t border-slate-800">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
              Séries e Numeração Sequencial
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Série NF-e</label>
                <input
                  type="number"
                  value={nfeSeries}
                  onChange={(e) => setNfeSeries(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Último Nº NF-e</label>
                <input
                  type="number"
                  value={nfeCurrentNumber}
                  onChange={(e) => setNfeCurrentNumber(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Série NFS-e</label>
                <input
                  type="number"
                  value={nfseSeries}
                  onChange={(e) => setNfseSeries(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Último Nº NFS-e</label>
                <input
                  type="number"
                  value={nfseCurrentNumber}
                  onChange={(e) => setNfseCurrentNumber(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 3. SIMULAÇÃO FISCAL E DIAGNÓSTICO */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950/40 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Diagnóstico e Simulação do Provedor Selecionado
            </h3>
            <p className="text-xs text-slate-400">
              Dispare um teste fiscal sem valor jurídico para validar a conectividade, schema JSON e resposta da SEFAZ pelo provedor ativo (<strong>{provider === 'contora' || provider === 'fiscal_contora' ? 'Fiscal Contora' : 'Focus NFe'}</strong>).
            </p>
          </div>

          <button
            onClick={handleRunTestEmission}
            disabled={isTesting}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all whitespace-nowrap"
          >
            {isTesting ? (
              <RotateCw className="w-4 h-4 animate-spin text-indigo-400" />
            ) : (
              <Play className="w-4 h-4 fill-current text-cyan-400" />
            )}
            {isTesting ? 'Transmitindo...' : 'Disparar Teste de Emissão'}
          </button>
        </div>
      </div>

      {/* MODAL PREVIEW DE EMISSÃO DE TESTE & LOGS */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    Diagnóstico de Emissão Fiscal (Simulação SEFAZ)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Provedor testado: <strong className="text-indigo-300">{provider === 'contora' || provider === 'fiscal_contora' ? 'Fiscal Contora' : 'Focus NFe'}</strong>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowTestModal(false)}
                className="text-slate-400 hover:text-white text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700"
              >
                Fechar
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              {isTesting ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-3">
                  <RotateCw className="w-8 h-8 text-indigo-400 animate-spin" />
                  <p className="text-xs text-slate-300 font-medium">Transmitindo NF-e de teste para a SEFAZ...</p>
                  <p className="text-[11px] text-slate-500">Mapeando schema e autenticando via {provider === 'contora' || provider === 'fiscal_contora' ? 'Contora API v1' : 'Focus NFe API v2'}</p>
                </div>
              ) : testResult ? (
                <div className="space-y-4">
                  {/* Status Banner */}
                  <div className={`p-4 rounded-xl border flex items-center justify-between ${
                    testResult.success
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  }`}>
                    <div className="flex items-center gap-3">
                      {testResult.success ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-rose-400" />
                      )}
                      <div>
                        <div className="text-xs font-bold">
                          {testResult.success ? 'Emissão Autorizada com Sucesso!' : 'Falha na Emissão Fiscal'}
                        </div>
                        <div className="text-[11px] opacity-80">
                          {testResult.result?.message || testResult.error}
                        </div>
                      </div>
                    </div>

                    {testResult.durationMs && (
                      <span className="text-[10px] font-mono px-2 py-1 rounded bg-slate-900/60 text-slate-300">
                        Latência: {testResult.durationMs}ms
                      </span>
                    )}
                  </div>

                  {/* Summary Grid */}
                  {testResult.success && testResult.result && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                        <span className="text-[10px] text-slate-500 block">Status SEFAZ</span>
                        <span className="text-xs font-bold text-emerald-400">{testResult.result.status}</span>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                        <span className="text-[10px] text-slate-500 block">Protocolo</span>
                        <span className="text-xs font-mono font-bold text-white">{testResult.result.protocol || 'N/A'}</span>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 col-span-2 sm:col-span-1">
                        <span className="text-[10px] text-slate-500 block">Provedor Executado</span>
                        <span className="text-xs font-bold text-indigo-400">{testResult.providerUsed}</span>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 col-span-2 sm:col-span-3">
                        <span className="text-[10px] text-slate-500 block">Chave de Acesso (44 Dígitos)</span>
                        <span className="text-xs font-mono text-cyan-300 break-all">{testResult.result.accessKey}</span>
                      </div>
                    </div>
                  )}

                  {/* Execution Logs Terminal */}
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 block mb-1.5 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      Logs de Transmissão e Resposta do Provedor:
                    </span>
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1 max-h-48 overflow-y-auto">
                      {testResult.logs ? (
                        testResult.logs.map((log: string, idx: number) => (
                          <div key={idx} className="leading-relaxed">
                            {log}
                          </div>
                        ))
                      ) : (
                        <div>Sem logs registrados.</div>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Homologação sem efeitos fiscais ou jurídicos reais.
              </span>
              <button
                onClick={handleRunTestEmission}
                disabled={isTesting}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5"
              >
                <RotateCw className="w-3.5 h-3.5" />
                Repetir Teste
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
