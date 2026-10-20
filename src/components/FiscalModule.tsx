'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { FiscalDocument, FiscalDocStatus, FiscalDocType } from '@/types/domain';
import { FileCode, Send, Plus, CheckCircle, AlertTriangle, XCircle, Clock, ShieldCheck, Download, Ban, Eye, FileText, ArrowUpRight, Cpu } from 'lucide-react';

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
  const [selectedItemId, setSelectedItemId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [justificationModal, setJustificationModal] = useState<{ open: boolean; docId: string }>({
    open: false,
    docId: '',
  });
  const [cancelJustification, setCancelJustification] = useState('');
  const [previewDoc, setPreviewDoc] = useState<FiscalDocument | null>(null);

  // Settings form
  const [provider, setProvider] = useState<'nuvem_fiscal' | 'focus_nfe' | 'mock'>(
    activeCompany?.fiscalSettings.provider || 'nuvem_fiscal'
  );
  const [nuvemClientId, setNuvemClientId] = useState(
    activeCompany?.fiscalSettings.nuvemFiscalClientId || ''
  );
  const [nuvemClientSecret, setNuvemClientSecret] = useState(
    activeCompany?.fiscalSettings.nuvemFiscalClientSecret || ''
  );
  const [focusToken, setFocusToken] = useState(
    activeCompany?.fiscalSettings.focusNfeToken || ''
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

  const availableCatalog = catalog.filter((c) =>
    docTypeToIssue === 'NFe' ? c.type === 'product' : c.type === 'service'
  );

  const handleOpenIssue = (type: FiscalDocType) => {
    setDocTypeToIssue(type);
    setSelectedEntityId(entities[0]?.id || '');
    const firstMatchingItem = catalog.find((c) => (type === 'NFe' ? c.type === 'product' : c.type === 'service'));
    setSelectedItemId(firstMatchingItem?.id || '');
    setQuantity(1);
    setIsIssueModalOpen(true);
  };

  const handleExecuteTransmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntityId || !selectedItemId) {
      alert('Selecione o destinatário e o item a emitir.');
      return;
    }

    setIsTransmitting(true);
    try {
      if (docTypeToIssue === 'NFe') {
        await issueNFe(selectedEntityId, [{ itemId: selectedItemId, quantity }]);
      } else {
        await issueNFSe(selectedEntityId, [{ itemId: selectedItemId, quantity }]);
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
      nuvemFiscalClientId: nuvemClientId,
      nuvemFiscalClientSecret: nuvemClientSecret,
      focusNfeToken: focusToken,
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
            <span className="text-xs uppercase tracking-wider font-bold text-indigo-400">
              Gateway Fiscal NuvemFiscal / FocusNFe Integrado
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
            <span className="w-2 h-2 rounded-full bg-indigo-400" />
            {activeCompany?.fiscalSettings.provider === 'focus_nfe' ? 'Focus NFe v2' : 'Nuvem Fiscal v2'}
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
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/80">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <FileCode className="w-4 h-4 text-indigo-400" />
            <span>Documentos Fiscais Transmitidos & Protocolos SEFAZ</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">{documents.length} registros no tenant</span>
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
                            <button
                              onClick={() => setJustificationModal({ open: true, docId: doc.id })}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                              title="Cancelar na SEFAZ"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
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
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Item a Faturar ({docTypeToIssue === 'NFe' ? 'Produto' : 'Serviço'})
                </label>
                <select
                  required
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs outline-none focus:border-indigo-500"
                >
                  <option value="">Selecione o item do catálogo...</option>
                  {availableCatalog.map((c) => (
                    <option key={c.id} value={c.id}>
                      [{c.code}] {c.description} - R$ {c.unitPrice.toFixed(2)}
                    </option>
                  ))}
                </select>
                {availableCatalog.length === 0 && (
                  <span className="text-[11px] text-amber-400 mt-1 block">
                    Nenhum item do tipo {docTypeToIssue === 'NFe' ? 'produto' : 'serviço'} no catálogo desta empresa.
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Quantidade</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-mono outline-none focus:border-indigo-500"
                  />
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
                  Provedor Fiscal Ativo (Adapter)
                </label>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <button
                    type="button"
                    onClick={() => setProvider('nuvem_fiscal')}
                    className={`p-3 rounded-xl border text-left transition-colors ${
                      provider === 'nuvem_fiscal'
                        ? 'border-indigo-500 bg-indigo-600/20 text-indigo-300 font-bold'
                        : 'border-slate-800 bg-slate-800/40 text-slate-400'
                    }`}
                  >
                    <div className="text-xs font-bold">Nuvem Fiscal</div>
                    <div className="text-[10px] text-slate-500 font-normal">OAuth2 • NF-e & NFS-e v2</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setProvider('focus_nfe')}
                    className={`p-3 rounded-xl border text-left transition-colors ${
                      provider === 'focus_nfe'
                        ? 'border-cyan-500 bg-cyan-600/20 text-cyan-300 font-bold'
                        : 'border-slate-800 bg-slate-800/40 text-slate-400'
                    }`}
                  >
                    <div className="text-xs font-bold">Focus NFe</div>
                    <div className="text-[10px] text-slate-500 font-normal">API Token • SEFAZ Multi-cidades</div>
                  </button>
                </div>

                {provider === 'nuvem_fiscal' ? (
                  <div className="p-3 bg-indigo-950/20 border border-indigo-500/20 rounded-xl space-y-2">
                    <div>
                      <label className="block text-[11px] text-slate-300 mb-1">Client ID (Nuvem Fiscal)</label>
                      <input
                        type="text"
                        value={nuvemClientId}
                        onChange={(e) => setNuvemClientId(e.target.value)}
                        placeholder="Ex: client_id_sandbox_xxx"
                        className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs font-mono outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-300 mb-1">Client Secret</label>
                      <input
                        type="password"
                        value={nuvemClientSecret}
                        onChange={(e) => setNuvemClientSecret(e.target.value)}
                        placeholder="••••••••••••••••"
                        className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs font-mono outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-cyan-950/20 border border-cyan-500/20 rounded-xl">
                    <label className="block text-[11px] text-slate-300 mb-1">Token de Acesso (Focus NFe API v2)</label>
                    <input
                      type="password"
                      value={focusToken}
                      onChange={(e) => setFocusToken(e.target.value)}
                      placeholder="Ex: seu_token_focus_nfe_homologacao"
                      className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs font-mono outline-none focus:border-cyan-500"
                    />
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

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
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
    </div>
  );
}
