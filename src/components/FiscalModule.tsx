'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { FiscalDocument, FiscalDocStatus, FiscalDocType } from '@/types/domain';
import { FileCode, Send, Plus, CheckCircle, CheckCircle2, AlertTriangle, XCircle, Clock, ShieldCheck, Download, Ban, Eye, FileText, ArrowUpRight, Cpu, MessageCircle, Check, Loader2, Sparkles, Bot, Trash2, Table, Mail, Play, RotateCw } from 'lucide-react';

export default function FiscalModule() {
  const {
    activeCompany,
    documents,
    entities,
    catalog,
    issueNFe,
    issueNFSe,
    cancelFiscalDoc,
    updateFiscalSettings,
  } = useApp();

  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [docTypeToIssue, setDocTypeToIssue] = useState<FiscalDocType>('NFe');
  const [selectedEntityId, setSelectedEntityId] = useState('');
  
  // Multi-item invoice state
  interface InvoiceLineItem {
    id: string;
    itemId: string;
    quantity: number;
    unitPrice: number;
  }
  const [invoiceItems, setInvoiceItems] = useState<InvoiceLineItem[]>([]);
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [justificationModal, setJustificationModal] = useState<{ open: boolean; docId: string }>({
    open: false,
    docId: '',
  });
  const [cancelJustification, setCancelJustification] = useState('');
  const [previewDoc, setPreviewDoc] = useState<FiscalDocument | null>(null);

  // WhatsApp Evolution Modal State
  const [whatsAppModal, setWhatsAppModal] = useState<{
    open: boolean;
    doc: FiscalDocument | null;
    phone: string;
    recipientName: string;
  }>({
    open: false,
    doc: null,
    phone: '',
    recipientName: '',
  });
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  const [whatsAppFeedback, setWhatsAppFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Email Send Modal State
  const [emailModal, setEmailModal] = useState<{
    open: boolean;
    doc: FiscalDocument | null;
    email: string;
    recipientName: string;
  }>({
    open: false,
    doc: null,
    email: '',
    recipientName: '',
  });
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailFeedback, setEmailFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // AI Copilot State
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<any | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Settings form
  const [provider, setProvider] = useState<'focus_nfe' | 'fiscal_contora' | 'contora'>(
    activeCompany?.fiscalSettings.provider || 'focus_nfe'
  );
  const [focusToken, setFocusToken] = useState(
    activeCompany?.fiscalSettings.focusNfeToken || ''
  );
  const [contoraApiKey, setContoraApiKey] = useState(
    activeCompany?.fiscalSettings.fiscalContoraApiKey || ''
  );
  const [contoraSecret, setContoraSecret] = useState(
    activeCompany?.fiscalSettings.fiscalContoraSecret || ''
  );
  const [env, setEnv] = useState<'homologacao' | 'producao'>(
    activeCompany?.fiscalSettings.environment || 'homologacao'
  );
  const [a1Status, setA1Status] = useState<boolean>(
    activeCompany?.fiscalSettings.certificateA1Installed || false
  );
  const [nfeSeries, setNfeSeries] = useState(activeCompany?.fiscalSettings.nfeSeries || 1);
  const [nfeCurrentNumber, setNfeCurrentNumber] = useState(activeCompany?.fiscalSettings.nfeCurrentNumber || 1);
  const [nfseSeries, setNfseSeries] = useState(activeCompany?.fiscalSettings.nfseSeries || 1);
  const [nfseCurrentNumber, setNfseCurrentNumber] = useState(activeCompany?.fiscalSettings.nfseCurrentNumber || 1);

  // Simulated Test Emission State
  const [isTestingEmission, setIsTestingEmission] = useState(false);
  const [testEmissionResult, setTestEmissionResult] = useState<any>(null);
  const [isTestEmissionModalOpen, setIsTestEmissionModalOpen] = useState(false);

  const handleRunTestEmission = async () => {
    setIsTestingEmission(true);
    setTestEmissionResult(null);
    setIsTestEmissionModalOpen(true);

    try {
      const activeProvider = activeCompany?.fiscalSettings.provider || 'focus_nfe';
      const isContora = activeProvider === 'fiscal_contora' || activeProvider === 'contora';
      const res = await fetch('/api/fiscal/test-emission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: isContora ? 'contora' : 'focus_nfe',
          company: {
            id: activeCompany?.id,
            cnpj: activeCompany?.cnpj,
            series: activeCompany?.fiscalSettings.nfeSeries || 1,
            number: (activeCompany?.fiscalSettings.nfeCurrentNumber || 1) + 1,
          },
          credentials: {
            focusToken: activeCompany?.fiscalSettings.focusNfeToken || undefined,
            contoraApiKey: activeCompany?.fiscalSettings.fiscalContoraApiKey || undefined,
            contoraSecret: activeCompany?.fiscalSettings.fiscalContoraSecret || undefined,
            environment: activeCompany?.fiscalSettings.environment || 'homologacao',
          },
        }),
      });

      const data = await res.json();
      setTestEmissionResult(data);
    } catch (err: any) {
      setTestEmissionResult({
        success: false,
        error: err.message || 'Falha na conexão com o motor fiscal',
      });
    } finally {
      setIsTestingEmission(false);
    }
  };

  const availableCatalog = catalog.filter((c) =>
    docTypeToIssue === 'NFe' ? c.type === 'product' : c.type === 'service'
  );

  const handleOpenIssue = (type: FiscalDocType) => {
    setDocTypeToIssue(type);
    setSelectedEntityId(entities[0]?.id || '');
    const firstMatchingItem = catalog.find((c) => (type === 'NFe' ? c.type === 'product' : c.type === 'service'));
    if (firstMatchingItem) {
      setInvoiceItems([
        {
          id: Math.random().toString(36).substr(2, 9),
          itemId: firstMatchingItem.id,
          quantity: 1,
          unitPrice: firstMatchingItem.unitPrice,
        },
      ]);
    } else {
      setInvoiceItems([]);
    }
    setIsIssueModalOpen(true);
  };

  const handleAddItemLine = () => {
    const firstMatchingItem = catalog.find((c) => (docTypeToIssue === 'NFe' ? c.type === 'product' : c.type === 'service'));
    if (!firstMatchingItem) return;
    setInvoiceItems((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substr(2, 9),
        itemId: firstMatchingItem.id,
        quantity: 1,
        unitPrice: firstMatchingItem.unitPrice,
      },
    ]);
  };

  const handleRemoveItemLine = (id: string) => {
    setInvoiceItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleUpdateItemLine = (id: string, field: 'itemId' | 'quantity' | 'unitPrice', val: any) => {
    setInvoiceItems((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;
        if (field === 'itemId') {
          const catItem = catalog.find((c) => c.id === val);
          return {
            ...i,
            itemId: val,
            unitPrice: catItem ? catItem.unitPrice : i.unitPrice,
          };
        }
        return { ...i, [field]: val };
      })
    );
  };

  const handleConsultAi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;

    setIsAiProcessing(true);
    setAiError(null);
    setAiSuggestion(null);

    try {
      const res = await fetch('/api/ai/fiscal-copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userPrompt: aiPrompt,
          company: {
            name: activeCompany?.name || 'GADAP Hub',
            cnpj: activeCompany?.cnpj || '45.182.903/0001-44',
            state: activeCompany?.address.state || 'SP',
            taxRegime: activeCompany?.taxRegime || 'Simples Nacional',
          },
          entities: entities.map((e) => ({
            id: e.id,
            name: e.name,
            document: e.document,
            state: e.address.state,
            indicadorIE: e.fiscalProfile?.indicadorIE || '1',
          })),
          catalog: catalog.map((c) => ({
            id: c.id,
            code: c.code,
            description: c.description,
            type: c.type,
            unitPrice: c.unitPrice,
            ncm: c.ncm,
            cfop: c.cfop,
          })),
        }),
      });

      const data = await res.json();
      if (data.success && data.suggestion) {
        setAiSuggestion(data.suggestion);
      } else {
        setAiError(data.error || 'Não foi possível interpretar a solicitação fiscal.');
      }
    } catch (err: any) {
      setAiError(err.message || 'Falha de comunicação com o Copiloto de IA.');
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleApplyAiSuggestion = () => {
    if (!aiSuggestion) return;
    setDocTypeToIssue(aiSuggestion.docType);
    setSelectedEntityId(aiSuggestion.selectedEntityId);

    if (aiSuggestion.items && aiSuggestion.items.length > 0) {
      setInvoiceItems(
        aiSuggestion.items.map((it: any) => ({
          id: Math.random().toString(36).substr(2, 9),
          itemId: it.itemId,
          quantity: it.quantity || 1,
          unitPrice: it.unitPrice || 0,
        }))
      );
    }
    setIsAiModalOpen(false);
    setIsIssueModalOpen(true);
  };

  const handleExecuteTransmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntityId || invoiceItems.length === 0) {
      alert('Selecione o destinatário e inclua ao menos um item a emitir.');
      return;
    }

    const payloadItems = invoiceItems.map((item) => ({
      itemId: item.itemId,
      quantity: item.quantity,
    }));

    setIsTransmitting(true);
    try {
      if (docTypeToIssue === 'NFe') {
        await issueNFe(selectedEntityId, payloadItems);
      } else {
        await issueNFSe(selectedEntityId, payloadItems);
      }
      setIsIssueModalOpen(false);
    } catch (err: any) {
      alert(`Falha na transmissão fiscal: ${err.message}`);
    } finally {
      setIsTransmitting(false);
    }
  };

  const handleExecuteCancel = async () => {
    if (cancelJustification.trim().length < 15) {
      alert('A justificativa de cancelamento pela SEFAZ exige no mínimo 15 caracteres.');
      return;
    }
    try {
      await cancelFiscalDoc(justificationModal.docId, cancelJustification);
      setJustificationModal({ open: false, docId: '' });
      setCancelJustification('');
    } catch (err: any) {
      alert(`Erro ao cancelar documento: ${err.message}`);
    }
  };

  const handleOpenWhatsApp = (doc: FiscalDocument) => {
    const entity = entities.find((e) => e.id === doc.entityId);
    setWhatsAppModal({
      open: true,
      doc,
      phone: entity?.phone || '',
      recipientName: doc.entityName,
    });
    setWhatsAppFeedback(null);
  };

  const handleSendWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!whatsAppModal.doc || !whatsAppModal.phone) return;

    setIsSendingWhatsApp(true);
    setWhatsAppFeedback(null);

    try {
      const res = await fetch('/api/whatsapp/send-fiscal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientPhone: whatsAppModal.phone,
          recipientName: whatsAppModal.recipientName,
          documentType: whatsAppModal.doc.type === 'NFe' ? 'NF-e' : 'NFS-e',
          documentNumber: whatsAppModal.doc.number,
          documentSeries: whatsAppModal.doc.series,
          companyName: activeCompany?.tradeName || activeCompany?.name || 'GADAP Hub',
          totalAmount: whatsAppModal.doc.totalAmount,
          accessKey: whatsAppModal.doc.accessKey,
          pdfUrl: whatsAppModal.doc.pdfDanfeUrl,
          xmlUrl: whatsAppModal.doc.xmlUrl,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setWhatsAppFeedback({
          type: 'success',
          message: 'Documento fiscal enviado com sucesso via WhatsApp (Evolution API)!',
        });
        setTimeout(() => {
          setWhatsAppModal({ open: false, doc: null, phone: '', recipientName: '' });
          setWhatsAppFeedback(null);
        }, 2200);
      } else {
        setWhatsAppFeedback({
          type: 'error',
          message: data.error || 'Erro ao enviar mensagem pelo WhatsApp.',
        });
      }
    } catch (err: any) {
      setWhatsAppFeedback({
        type: 'error',
        message: err.message || 'Falha de comunicação com a Evolution API.',
      });
    } finally {
      setIsSendingWhatsApp(false);
    }
  };

  const handleOpenEmail = (doc: FiscalDocument) => {
    const entity = entities.find((e) => e.id === doc.entityId);
    setEmailModal({
      open: true,
      doc,
      email: entity?.email || '',
      recipientName: doc.entityName,
    });
    setEmailFeedback(null);
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailModal.doc || !emailModal.email) return;

    setIsSendingEmail(true);
    setEmailFeedback(null);

    // Simulate reliable mail dispatch with official DANFE and XML attachments
    await new Promise((r) => setTimeout(r, 900));

    setIsSendingEmail(false);
    setEmailFeedback({
      type: 'success',
      message: `XML e DANFE oficial enviados com sucesso para ${emailModal.email}!`,
    });

    setTimeout(() => {
      setEmailModal({ open: false, doc: null, email: '', recipientName: '' });
      setEmailFeedback(null);
    }, 2400);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateFiscalSettings({
      provider,
      environment: env,
      certificateA1Installed: a1Status,
      certificateExpiresAt: '2027-10-20',
      nfeSeries,
      nfeCurrentNumber,
      nfseSeries,
      nfseCurrentNumber,
      focusNfeToken: focusToken,
      fiscalContoraApiKey: contoraApiKey,
      fiscalContoraSecret: contoraSecret,
    });
    setIsSettingsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Status Panel */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs uppercase tracking-wider font-bold text-cyan-400">
              Gateway Fiscal Contora (Principal) & Focus NFe (Secundário / Redundância)
            </span>
          </div>
          <h2 className="text-xl font-black text-white mt-1">
            Módulo Emissor Fiscal (NF-e Mercadorias & NFS-e Serviços)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Empresa emissora: <strong className="text-white">{activeCompany?.name}</strong> • CNPJ: {activeCompany?.cnpj}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              setAiSuggestion(null);
              setAiError(null);
              setIsAiModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all cursor-pointer border border-purple-400/30"
          >
            <Sparkles className="w-4 h-4 text-purple-200 animate-pulse" />
            <span>Copiloto Fiscal IA (Gemini)</span>
          </button>
          <button
            onClick={handleRunTestEmission}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-cyan-600/20 flex items-center gap-2 transition-all cursor-pointer border border-cyan-400/30"
            title="Disparar teste de emissão simulado na SEFAZ pelo provedor ativo"
          >
            <Play className="w-3.5 h-3.5 fill-current text-cyan-200" />
            <span>Testar Provedor</span>
          </button>
          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>Configurações & Certificado A1</span>
          </button>
          <button
            onClick={() => handleOpenIssue('NFe')}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Emitir NF-e (Produto)</span>
          </button>
          <button
            onClick={() => handleOpenIssue('NFSe')}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-600/30 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Emitir NFS-e (Serviço)</span>
          </button>
        </div>
      </div>

      {/* Fiscal Diagnostics Widget */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Provedor Ativo</span>
          <div className="text-sm font-bold text-white mt-1 flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${activeCompany?.fiscalSettings.provider === 'focus_nfe' ? 'bg-indigo-400' : 'bg-cyan-400'}`} />
            {activeCompany?.fiscalSettings.provider === 'focus_nfe'
              ? 'Focus NFe (Secundário)'
              : 'Fiscal Contora (Principal)'}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Ambiente SEFAZ</span>
          <div className="text-sm font-bold text-white mt-1 flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                activeCompany?.fiscalSettings.environment === 'producao' ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
            {activeCompany?.fiscalSettings.environment === 'producao' ? 'Produção Nacional' : 'Homologação'}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Certificado Digital A1</span>
          <div className="text-base font-bold text-white mt-1 flex items-center gap-2">
            {activeCompany?.fiscalSettings.certificateA1Installed ? (
              <span className="text-emerald-400 flex items-center gap-1 text-sm font-semibold">
                <CheckCircle className="w-4 h-4" /> Instalado & Válido
              </span>
            ) : (
              <span className="text-amber-400 flex items-center gap-1 text-sm font-semibold">
                <AlertTriangle className="w-4 h-4" /> Pendente de Upload
              </span>
            )}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Numeração Atual NF-e</span>
          <div className="text-base font-mono font-bold text-indigo-300 mt-1">
            Série {activeCompany?.fiscalSettings.nfeSeries} • Nº {activeCompany?.fiscalSettings.nfeCurrentNumber}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Numeração Atual NFS-e</span>
          <div className="text-base font-mono font-bold text-cyan-300 mt-1">
            Série {activeCompany?.fiscalSettings.nfseSeries} • Nº {activeCompany?.fiscalSettings.nfseCurrentNumber}
          </div>
        </div>
      </div>

      {/* Fiscal Documents Data Grid */}
      <div className="bg-slate-900/40 rounded-2xl border border-slate-800/90 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex flex-wrap justify-between items-center gap-3 bg-slate-900/80">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <FileCode className="w-4 h-4 text-indigo-400" />
            <span>Documentos Fiscais Transmitidos & Protocolos SEFAZ</span>
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-mono">{documents.length} registros</span>
            <button
              type="button"
              onClick={() => {
                const headers = ['Tipo', 'Serie', 'Numero', 'Status', 'Destinatario', 'CNPJ_CPF', 'Valor_Total', 'Chave_Acesso', 'Protocolo', 'Data_Emissao'];
                const rows = documents.map((d) => [
                  d.type,
                  d.series,
                  d.number,
                  d.status,
                  `"${d.entityName.replace(/"/g, '""')}"`,
                  d.entityDocument,
                  d.totalAmount.toFixed(2),
                  d.accessKey || '',
                  d.protocol || '',
                  new Date(d.issueDate).toLocaleDateString('pt-BR'),
                ]);
                const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Relatorio_Fiscal_${activeCompany?.cnpj.replace(/\D/g, '') || 'GADAP'}_${new Date().toISOString().slice(0, 10)}.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title="Exportar para Excel / Contabilidade"
            >
              <Table className="w-3.5 h-3.5 text-emerald-400" />
              <span>Exportar Excel (CSV)</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Documento / Modelo</th>
                <th className="py-3 px-4">Destinatário / Tomador</th>
                <th className="py-3 px-4">Status SEFAZ</th>
                <th className="py-3 px-4">Chave de Acesso / Protocolo</th>
                <th className="py-3 px-4">Valor Total</th>
                <th className="py-3 px-4 text-right">Ações Fiscais</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {documents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    Nenhum documento fiscal emitido para esta empresa ainda. Clique em "Emitir NF-e" ou "Emitir NFS-e".
                  </td>
                </tr>
              ) : (
                documents.map((doc) => {
                  return (
                    <tr key={doc.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded font-black text-[10px] tracking-wider ${
                              doc.type === 'NFe'
                                ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                                : 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/40'
                            }`}
                          >
                            {doc.type}
                          </span>
                          <span className="font-bold text-white text-sm font-mono">
                            № {doc.number} <span className="text-slate-400 text-xs">(Série {doc.series})</span>
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(doc.issueDate).toLocaleString('pt-BR')}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-200">{doc.entityName}</div>
                        <div className="text-[11px] font-mono text-slate-400">{doc.entityDocument}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        {doc.status === 'Authorized' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                            Autorizado
                          </span>
                        )}
                        {doc.status === 'Draft' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-500/10 text-slate-300 border border-slate-500/30">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            Rascunho
                          </span>
                        )}
                        {doc.status === 'Transmitting' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30 animate-pulse">
                            <Clock className="w-3.5 h-3.5 text-amber-400" />
                            Transmitindo...
                          </span>
                        )}
                        {doc.status === 'Canceled' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                            <XCircle className="w-3.5 h-3.5 text-rose-400" />
                            Cancelado
                          </span>
                        )}
                        {doc.status === 'Rejected' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/30">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                            Rejeitado
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        {doc.accessKey ? (
                          <div>
                            <span className="text-slate-300 block truncate max-w-xs">{doc.accessKey}</span>
                            <span className="text-[10px] text-slate-500">Prot: {doc.protocol}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">Sem chave autorizada</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-white text-sm">
                        {doc.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => setPreviewDoc(doc)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            title="Visualizar Detalhes"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {doc.pdfDanfeUrl && (
                            <a
                              href={doc.pdfDanfeUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-lg text-indigo-400 hover:text-indigo-300 hover:bg-indigo-600/10 transition-colors"
                              title="Baixar DANFE / PDF"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          )}

                          {doc.status === 'Authorized' && (
                            <>
                              <button
                                onClick={() => handleOpenWhatsApp(doc)}
                                className="p-1.5 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition-colors"
                                title="Enviar NF via WhatsApp (Evolution API)"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleOpenEmail(doc)}
                                className="p-1.5 rounded-lg text-sky-400 hover:text-sky-300 hover:bg-sky-500/10 transition-colors"
                                title="Enviar XML & DANFE por E-mail"
                              >
                                <Mail className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setJustificationModal({ open: true, docId: doc.id })}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                title="Cancelar na SEFAZ"
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Emitir Documento Fiscal */}
      {isIssueModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Send className="w-5 h-5 text-indigo-400" />
                <span>
                  Transmissão Imediata: {docTypeToIssue === 'NFe' ? 'NF-e Modelo 55' : 'NFS-e Municipal'}
                </span>
              </h3>
              <button
                disabled={isTransmitting}
                onClick={() => setIsIssueModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕ Fechar
              </button>
            </div>

            <form onSubmit={handleExecuteTransmission} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Destinatário / Tomador (Entidades Cadastradas)
                </label>
                <select
                  required
                  value={selectedEntityId}
                  onChange={(e) => setSelectedEntityId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs outline-none focus:border-indigo-500"
                >
                  <option value="">Selecione o Cliente / Destinatário...</option>
                  {entities.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.document})
                    </option>
                  ))}
                </select>
                {entities.length === 0 && (
                  <span className="text-[11px] text-amber-400 mt-1 block">
                    Nenhum cliente cadastrado. Cadastre no módulo de Entidades primeiro.
                  </span>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-semibold text-slate-300 uppercase">
                    Itens a Faturar ({docTypeToIssue === 'NFe' ? 'Produtos' : 'Serviços'})
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItemLine}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 text-xs font-semibold transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Outro Item</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {invoiceItems.map((line, index) => {
                    const itemData = catalog.find((c) => c.id === line.itemId);
                    const lineTotal = line.quantity * line.unitPrice;

                    return (
                      <div
                        key={line.id}
                        className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60 flex items-center gap-2.5"
                      >
                        <span className="text-[11px] font-mono text-slate-400 w-4 text-center">{index + 1}</span>

                        <div className="flex-1 min-w-0">
                          <select
                            required
                            value={line.itemId}
                            onChange={(e) => handleUpdateItemLine(line.id, 'itemId', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs outline-none focus:border-indigo-500 truncate"
                          >
                            {availableCatalog.map((c) => (
                              <option key={c.id} value={c.id}>
                                [{c.code}] {c.description} - R$ {c.unitPrice.toFixed(2)}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="w-20">
                          <input
                            type="number"
                            min="1"
                            required
                            placeholder="Qtd"
                            value={line.quantity}
                            onChange={(e) => handleUpdateItemLine(line.id, 'quantity', parseInt(e.target.value) || 1)}
                            className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs font-mono text-center outline-none focus:border-indigo-500"
                          />
                        </div>

                        <div className="w-24 text-right font-mono text-xs font-bold text-emerald-400">
                          {lineTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </div>

                        {invoiceItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItemLine(line.id)}
                            className="p-1 rounded-lg text-slate-500 hover:text-rose-400 transition-colors"
                            title="Remover Item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {availableCatalog.length === 0 && (
                  <span className="text-[11px] text-amber-400 mt-1 block">
                    Nenhum item do tipo {docTypeToIssue === 'NFe' ? 'produto' : 'serviço'} no catálogo desta empresa.
                  </span>
                )}
              </div>

              <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/50 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-300">Total Faturado ({invoiceItems.length} itens):</span>
                <span className="text-base font-black font-mono text-emerald-400">
                  {invoiceItems
                    .reduce((acc, curr) => acc + curr.quantity * curr.unitPrice, 0)
                    .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Destino Fiscal</label>
                  <div className="px-3 py-2 bg-slate-800/60 border border-slate-700/60 rounded-xl text-slate-300 text-xs">
                    {(() => {
                      const selectedEntity = entities.find((e) => e.id === selectedEntityId);
                      const isInterstate = selectedEntity && selectedEntity.address.state !== activeCompany?.address.state;
                      return isInterstate ? (
                        <span className="text-amber-300 font-semibold">Interestadual ({selectedEntity?.address.state}) • CFOP 6102</span>
                      ) : (
                        <span className="text-emerald-300 font-semibold">Interna ({activeCompany?.address.state}) • CFOP 5102</span>
                      );
                    })()}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Série & Próximo Nº</label>
                  <div className="px-3 py-2 bg-slate-800/60 border border-slate-700/60 rounded-xl text-slate-300 text-xs font-mono">
                    {docTypeToIssue === 'NFe'
                      ? `Série ${activeCompany?.fiscalSettings.nfeSeries} • Nº ${(activeCompany?.fiscalSettings.nfeCurrentNumber || 0) + 1}`
                      : `Série ${activeCompany?.fiscalSettings.nfseSeries} • Nº ${(activeCompany?.fiscalSettings.nfseCurrentNumber || 0) + 1}`}
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-300">
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  <span>Adapter Fiscal Low-Cost</span>
                </div>
                O payload será validado e assinado via certificado A1 e transmitido para os Web Services SEFAZ.
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  disabled={isTransmitting}
                  onClick={() => setIsIssueModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isTransmitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isTransmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Transmitindo SEFAZ...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Transmitir para SEFAZ</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Justificativa de Cancelamento */}
      {justificationModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-2 text-rose-400">
              <Ban className="w-5 h-5 text-rose-400" />
              <span>Cancelamento de Documento Fiscal na SEFAZ</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              A SEFAZ exige que o cancelamento possua uma justificativa formal com no mínimo 15 caracteres.
            </p>

            <textarea
              rows={3}
              required
              value={cancelJustification}
              onChange={(e) => setCancelJustification(e.target.value)}
              placeholder="Ex: Cancelamento solicitado pelo cliente devido a divergência no pedido comercial."
              className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs outline-none focus:border-rose-500"
            />
            <span className="text-[10px] text-slate-500 block mt-1">
              Caracteres: {cancelJustification.length} / mín. 15
            </span>

            <div className="flex justify-end gap-3 pt-4 mt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setJustificationModal({ open: false, docId: '' })}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-medium cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleExecuteCancel}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-lg shadow-rose-600/30 cursor-pointer"
              >
                Confirmar Cancelamento SEFAZ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Configurações Fiscais da Empresa */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                <span>Configurações Fiscais & Certificado Digital A1</span>
              </h3>
              <button onClick={() => setIsSettingsModalOpen(false)} className="text-slate-400 hover:text-white text-sm">
                ✕ Fechar
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Provedor Fiscal por Empresa / Tenant
                </label>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  {/* Fiscal Contora - Provedor Principal */}
                  <button
                    type="button"
                    onClick={() => setProvider('fiscal_contora')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      provider === 'fiscal_contora' || provider === 'contora'
                        ? 'border-cyan-500 bg-cyan-600/20 text-cyan-300 font-bold shadow-md shadow-cyan-950/50 ring-1 ring-cyan-500/50'
                        : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-bold text-white">Fiscal Contora</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-semibold uppercase">
                        Principal
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-normal">API v1 • Gateway SEFAZ Rápido</div>
                  </button>

                  {/* Focus NFe - Opção Secundária */}
                  <button
                    type="button"
                    onClick={() => setProvider('focus_nfe')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      provider === 'focus_nfe'
                        ? 'border-indigo-500 bg-indigo-600/20 text-indigo-300 font-bold shadow-md shadow-indigo-950/50 ring-1 ring-indigo-500/50'
                        : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-bold text-white">Focus NFe</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-semibold uppercase">
                        Secundário
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-normal">API REST v2 • Backup SEFAZ</div>
                  </button>
                </div>

                {provider === 'focus_nfe' ? (
                  <div className="p-3 bg-indigo-950/20 border border-indigo-500/30 rounded-xl">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-semibold text-indigo-300">
                        Token de Acesso (Focus NFe API v2)
                      </label>
                      <span className="text-[10px] text-slate-400">Provedor Principal Ativo</span>
                    </div>
                    <input
                      type="password"
                      value={focusToken}
                      onChange={(e) => setFocusToken(e.target.value)}
                      placeholder="Ex: seu_token_focus_nfe_homologacao"
                      className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs font-mono outline-none focus:border-indigo-500"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Token exclusivo vinculado à conta da empresa na Focus NFe.
                    </span>
                  </div>
                ) : (
                  <div className="p-3 bg-cyan-950/20 border border-cyan-500/30 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-cyan-300">
                        Credenciais Fiscal Contora
                      </span>
                      <span className="text-[10px] text-cyan-400">Opção Alternativa</span>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5">API Key (Fiscal Contora)</label>
                      <input
                        type="text"
                        value={contoraApiKey}
                        onChange={(e) => setContoraApiKey(e.target.value)}
                        placeholder="Ex: fc_live_apikey_xxx ou fc_test_xxx"
                        className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs font-mono outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5">Secret Token</label>
                      <input
                        type="password"
                        value={contoraSecret}
                        onChange={(e) => setContoraSecret(e.target.value)}
                        placeholder="••••••••••••••••"
                        className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs font-mono outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Ambiente de Transmissão SEFAZ
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setEnv('homologacao')}
                    className={`p-3 rounded-xl border text-left transition-colors ${
                      env === 'homologacao'
                        ? 'border-indigo-500 bg-indigo-600/20 text-indigo-300 font-bold'
                        : 'border-slate-800 bg-slate-800/40 text-slate-400'
                    }`}
                  >
                    <div className="text-xs">Homologação</div>
                    <div className="text-[10px] text-slate-500 font-normal">Ambiente de Testes / Validação</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEnv('producao')}
                    className={`p-3 rounded-xl border text-left transition-colors ${
                      env === 'producao'
                        ? 'border-emerald-500 bg-emerald-600/20 text-emerald-300 font-bold'
                        : 'border-slate-800 bg-slate-800/40 text-slate-400'
                    }`}
                  >
                    <div className="text-xs">Produção</div>
                    <div className="text-[10px] text-slate-500 font-normal">Valor Fiscal Real e Jurídico</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Certificado Digital A1 (.pfx / .p12)
                </label>
                <div className="p-3 bg-slate-800/70 border border-slate-700 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className={`w-5 h-5 ${a1Status ? 'text-emerald-400' : 'text-slate-500'}`} />
                    <div>
                      <div className="text-xs font-bold text-white">
                        {a1Status ? 'Certificado A1 Carregado' : 'Nenhum certificado instalado'}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {a1Status ? 'Válido até 20/10/2027 (PKCS#12)' : 'Carregue o arquivo .pfx para assinar XMLs'}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setA1Status(!a1Status)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors"
                  >
                    {a1Status ? 'Substituir' : 'Instalar Demo'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Série NF-e</label>
                  <input
                    type="number"
                    value={nfeSeries}
                    onChange={(e) => setNfeSeries(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Último Nº NF-e</label>
                  <input
                    type="number"
                    value={nfeCurrentNumber}
                    onChange={(e) => setNfeCurrentNumber(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Série NFS-e</label>
                  <input
                    type="number"
                    value={nfseSeries}
                    onChange={(e) => setNfseSeries(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Último Nº NFS-e</label>
                  <input
                    type="number"
                    value={nfseCurrentNumber}
                    onChange={(e) => setNfseCurrentNumber(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <a
                  href="/settings/fiscal"
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1.5"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  Abrir Página Completa de Configurações
                </a>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsSettingsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-medium cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 cursor-pointer"
                  >
                    Salvar Parâmetros
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Visualizar Detalhes do Documento */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-black text-indigo-400">
                  {previewDoc.type} № {previewDoc.number} (Série {previewDoc.series})
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {previewDoc.status}
                </span>
              </div>
              <button onClick={() => setPreviewDoc(null)} className="text-slate-400 hover:text-white text-sm">
                ✕ Fechar
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-800/40 rounded-xl">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Destinatário</span>
                  <span className="font-bold text-white block">{previewDoc.entityName}</span>
                  <span className="font-mono text-slate-400 text-[11px]">{previewDoc.entityDocument}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Data de Emissão</span>
                  <span className="text-white block font-medium">
                    {new Date(previewDoc.issueDate).toLocaleString('pt-BR')}
                  </span>
                  <span className="text-emerald-400 font-mono text-[11px]">
                    Prot: {previewDoc.protocol || 'N/A'}
                  </span>
                </div>
              </div>

              {previewDoc.accessKey && (
                <div className="p-3 bg-slate-800/40 rounded-xl">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold mb-1">
                    Chave de Acesso SEFAZ (44 dígitos)
                  </span>
                  <div className="font-mono text-white text-[11px] break-all bg-slate-900 p-2 rounded-lg border border-slate-700">
                    {previewDoc.accessKey}
                  </div>
                </div>
              )}

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold mb-2">
                  Itens Faturados
                </span>
                <div className="border border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-800 text-slate-400">
                      <tr>
                        <th className="p-2">Item</th>
                        <th className="p-2">Qtd</th>
                        <th className="p-2">Unitário</th>
                        <th className="p-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {previewDoc.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-2 text-white">{item.description}</td>
                          <td className="p-2 font-mono">{item.quantity}</td>
                          <td className="p-2 font-mono">
                            {item.unitPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </td>
                          <td className="p-2 font-mono text-right text-emerald-400 font-semibold">
                            {item.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-sm font-bold text-slate-300">Valor Total do Documento</span>
                <span className="text-lg font-black font-mono text-emerald-400">
                  {previewDoc.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Envio via WhatsApp (Evolution API) */}
      {whatsAppModal.open && whatsAppModal.doc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-emerald-400" />
                <span>Enviar NF via WhatsApp</span>
              </h3>
              <button
                disabled={isSendingWhatsApp}
                onClick={() => setWhatsAppModal({ open: false, doc: null, phone: '', recipientName: '' })}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕ Fechar
              </button>
            </div>

            <form onSubmit={handleSendWhatsApp} className="space-y-4">
              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/50 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Documento:</span>
                  <span className="font-bold text-white">
                    {whatsAppModal.doc.type === 'NFe' ? 'NF-e' : 'NFS-e'} Nº {whatsAppModal.doc.number} (Série {whatsAppModal.doc.series})
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Destinatário:</span>
                  <span className="font-semibold text-slate-200 truncate max-w-[200px]">
                    {whatsAppModal.recipientName}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Valor Total:</span>
                  <span className="font-bold font-mono text-emerald-400">
                    {whatsAppModal.doc.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Anexo DANFE (PDF):</span>
                  <span className="text-[11px] font-mono text-indigo-300">
                    {whatsAppModal.doc.pdfDanfeUrl ? 'Disponível (envio como documento)' : 'Link SEFAZ / Focus'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Número do WhatsApp do Destinatário
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: (11) 99999-9999 ou 5511999999999"
                  value={whatsAppModal.phone}
                  onChange={(e) => setWhatsAppModal({ ...whatsAppModal, phone: e.target.value })}
                  disabled={isSendingWhatsApp}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Pode informar com DDD e máscara ou somente dígitos. Será enviado através da instância <span className="font-mono text-emerald-400 font-semibold">ecostone</span> da Evolution API.
                </p>
              </div>

              {whatsAppFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs font-medium border flex items-center gap-2 ${
                    whatsAppFeedback.type === 'success'
                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                  }`}
                >
                  {whatsAppFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  )}
                  <span>{whatsAppFeedback.message}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={isSendingWhatsApp}
                  onClick={() => setWhatsAppModal({ open: false, doc: null, phone: '', recipientName: '' })}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSendingWhatsApp || !whatsAppModal.phone}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  {isSendingWhatsApp ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Enviando WhatsApp...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Enviar Agora</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Copiloto Fiscal Inteligente (Gemini IA) */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-purple-500/30 rounded-2xl w-full max-w-xl p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-500" />

            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Bot className="w-5 h-5 text-purple-400" />
                <span>Copiloto Fiscal Inteligente • Google Gemini AI</span>
              </h3>
              <button
                disabled={isAiProcessing}
                onClick={() => setIsAiModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕ Fechar
              </button>
            </div>

            <p className="text-xs text-slate-300 mb-3">
              Descreva em linguagem natural o que deseja faturar. O Gemini analisará o destinatário, o produto/serviço, se a operação é interestadual, o CFOP correto (ex: 5102 vs 6102) e o modelo fiscal (NF-e vs NFS-e).
            </p>

            <form onSubmit={handleConsultAi} className="space-y-4">
              <div>
                <textarea
                  rows={3}
                  required
                  placeholder="Ex: Emitir venda de 25 paletes PBR para a Carioca Bebidas no Rio de Janeiro"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  disabled={isAiProcessing}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none font-sans"
                />
              </div>

              <div className="flex flex-wrap gap-2 text-[11px]">
                <span className="text-slate-400">Sugestões rápidas:</span>
                <button
                  type="button"
                  onClick={() => setAiPrompt('Emitir venda de 20 paletes PBR para a Distribuidora Carioca no Rio de Janeiro')}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/20"
                >
                  🌴 Venda Interestadual RJ (Paletes)
                </button>
                <button
                  type="button"
                  onClick={() => setAiPrompt('Emitir nota de 10 paletes de madeira para a Rede Alvorada em SP')}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/20"
                >
                  🏢 Venda Interna SP (Alvorada)
                </button>
                <button
                  type="button"
                  onClick={() => setAiPrompt('Emitir serviço de Licença de Integração Fiscal para o Horizonte Bank')}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/20"
                >
                  ⚡ NFS-e Municipal (Serviço)
                </button>
              </div>

              {aiError && (
                <div className="p-3 rounded-xl text-xs font-medium bg-rose-500/10 text-rose-300 border border-rose-500/30 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{aiError}</span>
                </div>
              )}

              {aiSuggestion && (
                <div className="p-4 bg-purple-950/20 border border-purple-500/40 rounded-xl space-y-3 animate-in fade-in">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      Análise Tributária Realizada pelo Gemini
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {aiSuggestion.confidenceScore}% de Precisão Fiscal
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 bg-slate-800/60 rounded-lg">
                      <span className="text-slate-400 block text-[10px]">Modelo / Tipo:</span>
                      <span className="font-bold text-white">{aiSuggestion.docType === 'NFe' ? 'NF-e (Mercadorias - Mod 55)' : 'NFS-e (Serviços)'}</span>
                    </div>
                    <div className="p-2 bg-slate-800/60 rounded-lg">
                      <span className="text-slate-400 block text-[10px]">CFOP Sugerido:</span>
                      <span className="font-mono font-bold text-indigo-300">{aiSuggestion.suggestedCfop} {aiSuggestion.isInterstate ? '(Interestadual)' : '(Interno)'}</span>
                    </div>
                    <div className="p-2 bg-slate-800/60 rounded-lg col-span-2">
                      <span className="text-slate-400 block text-[10px]">Destinatário Identificado:</span>
                      <span className="font-semibold text-slate-200 truncate block">{aiSuggestion.selectedEntityName}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                      Itens Faturados Sugeridos ({aiSuggestion.items?.length || 1}):
                    </span>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {(aiSuggestion.items || []).map((it: any, idx: number) => (
                        <div key={idx} className="p-2 bg-slate-800/80 rounded-lg border border-slate-700/60 flex justify-between items-center text-xs">
                          <div className="truncate mr-2">
                            <span className="font-bold text-white block truncate">{it.description}</span>
                            <span className="text-[10px] text-slate-400 font-mono">Qtd: {it.quantity} • Unit: R$ {it.unitPrice?.toFixed(2)} • CFOP {it.cfop}</span>
                          </div>
                          <span className="font-mono font-bold text-emerald-400 shrink-0">
                            {(it.total || it.quantity * it.unitPrice).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-2.5 bg-slate-800/60 rounded-lg border border-slate-700/40">
                    <span className="text-xs font-bold text-slate-300">Valor Total Calculado:</span>
                    <span className="text-sm font-black font-mono text-emerald-400">
                      {(aiSuggestion.totalAmount || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800 text-[11px] text-slate-300 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-purple-300 block">Diagnóstico Fiscal:</span>
                    <p>{aiSuggestion.rationale}</p>
                    <p className="text-amber-300/90 text-[10px] italic">{aiSuggestion.taxNotes}</p>
                  </div>

                  <button
                    type="button"
                    onClick={handleApplyAiSuggestion}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-600 hover:from-purple-500 hover:to-emerald-500 text-white font-bold text-xs transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Aplicar Parâmetros da IA no Emissor Fiscal</span>
                  </button>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={isAiProcessing}
                  onClick={() => setIsAiModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Fechar
                </button>
                <button
                  type="submit"
                  disabled={isAiProcessing || !aiPrompt.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-all shadow-lg shadow-purple-600/30 disabled:opacity-50 cursor-pointer"
                >
                  {isAiProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Consultando Gemini AI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Analisar com IA</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal: Envio por E-mail (XML + DANFE) */}
      {emailModal.open && emailModal.doc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Mail className="w-5 h-5 text-sky-400" />
                <span>Enviar XML & DANFE por E-mail</span>
              </h3>
              <button
                disabled={isSendingEmail}
                onClick={() => setEmailModal({ open: false, doc: null, email: '', recipientName: '' })}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕ Fechar
              </button>
            </div>

            <form onSubmit={handleSendEmail} className="space-y-4">
              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/50 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Documento:</span>
                  <span className="font-bold text-white">
                    {emailModal.doc.type === 'NFe' ? 'NF-e' : 'NFS-e'} Nº {emailModal.doc.number} (Série {emailModal.doc.series})
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Destinatário:</span>
                  <span className="font-semibold text-slate-200 truncate max-w-[200px]">
                    {emailModal.recipientName}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Anexos Inclusos:</span>
                  <span className="text-emerald-400 font-mono text-[11px]">
                    DANFE (PDF) + Arquivo XML SEFAZ
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  E-mail do Destinatário ou Contabilidade
                </label>
                <input
                  type="email"
                  required
                  placeholder="Ex: fiscal@empresa.com.br, compras@cliente.com"
                  value={emailModal.email}
                  onChange={(e) => setEmailModal({ ...emailModal, email: e.target.value })}
                  disabled={isSendingEmail}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  O e-mail será enviado com o assunto contendo o número da nota fiscal e os arquivos anexados.
                </p>
              </div>

              {emailFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs font-medium border flex items-center gap-2 ${
                    emailFeedback.type === 'success'
                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                  }`}
                >
                  {emailFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  )}
                  <span>{emailFeedback.message}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={isSendingEmail}
                  onClick={() => setEmailModal({ open: false, doc: null, email: '', recipientName: '' })}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSendingEmail || !emailModal.email}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-semibold text-xs transition-all shadow-lg shadow-sky-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {isSendingEmail ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Enviando Anexos...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Enviar E-mail Agora</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal de Simulação e Diagnóstico de Emissão Fiscal */}
      {isTestEmissionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Play className="w-4 h-4 fill-current" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    Diagnóstico de Emissão Fiscal (Simulação SEFAZ)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Provedor testado:{' '}
                    <strong className="text-indigo-300">
                      {activeCompany?.fiscalSettings.provider === 'fiscal_contora' ||
                      activeCompany?.fiscalSettings.provider === 'contora'
                        ? 'Fiscal Contora (Secundário)'
                        : 'Focus NFe (Principal)'}
                    </strong>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsTestEmissionModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700"
              >
                Fechar
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              {isTestingEmission ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-3">
                  <RotateCw className="w-8 h-8 text-indigo-400 animate-spin" />
                  <p className="text-xs text-slate-300 font-medium">Transmitindo NF-e de teste para a SEFAZ...</p>
                  <p className="text-[11px] text-slate-500">Mapeando payload tributário e autenticando via Provedor</p>
                </div>
              ) : testEmissionResult ? (
                <div className="space-y-4">
                  <div
                    className={`p-4 rounded-xl border flex items-center justify-between ${
                      testEmissionResult.success
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {testEmissionResult.success ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-rose-400" />
                      )}
                      <div>
                        <div className="text-xs font-bold">
                          {testEmissionResult.success ? 'Emissão Autorizada com Sucesso!' : 'Falha na Emissão Fiscal'}
                        </div>
                        <div className="text-[11px] opacity-80">
                          {testEmissionResult.result?.message || testEmissionResult.error}
                        </div>
                      </div>
                    </div>

                    {testEmissionResult.durationMs && (
                      <span className="text-[10px] font-mono px-2 py-1 rounded bg-slate-900/60 text-slate-300">
                        Latência: {testEmissionResult.durationMs}ms
                      </span>
                    )}
                  </div>

                  {testEmissionResult.success && testEmissionResult.result && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                        <span className="text-[10px] text-slate-500 block">Status SEFAZ</span>
                        <span className="text-xs font-bold text-emerald-400">{testEmissionResult.result.status}</span>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                        <span className="text-[10px] text-slate-500 block">Protocolo</span>
                        <span className="text-xs font-mono font-bold text-white">
                          {testEmissionResult.result.protocol || 'N/A'}
                        </span>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 col-span-2 sm:col-span-1">
                        <span className="text-[10px] text-slate-500 block">Provedor Executado</span>
                        <span className="text-xs font-bold text-indigo-400">{testEmissionResult.providerUsed}</span>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 col-span-2 sm:col-span-3">
                        <span className="text-[10px] text-slate-500 block">Chave de Acesso (44 Dígitos)</span>
                        <span className="text-xs font-mono text-cyan-300 break-all">
                          {testEmissionResult.result.accessKey}
                        </span>
                      </div>
                    </div>
                  )}

                  <div>
                    <span className="text-[11px] font-bold text-slate-400 block mb-1.5 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      Logs de Transmissão e Resposta do Provedor:
                    </span>
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1 max-h-48 overflow-y-auto">
                      {testEmissionResult.logs ? (
                        testEmissionResult.logs.map((log: string, idx: number) => (
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

            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Homologação sem efeitos fiscais ou jurídicos reais.
              </span>
              <button
                onClick={handleRunTestEmission}
                disabled={isTestingEmission}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
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
