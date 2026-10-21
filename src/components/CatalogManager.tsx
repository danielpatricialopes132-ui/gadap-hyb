'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { CatalogItem, ItemType } from '@/types/domain';
import { Package, Plus, Search, Filter, Trash2, Edit3, Tag, DollarSign, Layers, Wrench, Sparkles, ShieldAlert, RotateCw, CheckCircle2, ChevronRight, AlertTriangle, Calendar, Check } from 'lucide-react';
import { TaxChangeAlert } from '@/app/api/fiscal/weekly-tax-audit/route';

export default function CatalogManager() {
  const { catalog, addCatalogItem, updateCatalogItem, deleteCatalogItem, activeCompany } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'product' | 'service'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Weekly Tax Audit Scanner State
  const [isTaxAuditModalOpen, setIsTaxAuditModalOpen] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditAlerts, setAuditAlerts] = useState<TaxChangeAlert[]>([]);
  const [lastAuditDate, setLastAuditDate] = useState<string | null>(null);
  const [auditError, setAuditError] = useState<string | null>(null);

  // Form State
  const [type, setType] = useState<ItemType>('product');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState('UN');
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [costPrice, setCostPrice] = useState<number>(0);
  const [barcode, setBarcode] = useState('');
  
  // Product fiscal fields
  const [ncm, setNcm] = useState('');
  const [cest, setCest] = useState('');
  const [cfop, setCfop] = useState('5102');
  const [origin, setOrigin] = useState<'0' | '1' | '2'>('0');

  // Service fiscal fields
  const [lc116Item, setLc116Item] = useState('');
  const [issRate, setIssRate] = useState<number>(2.0);
  const [taxCodeMunicipal, setTaxCodeMunicipal] = useState('');

  const filteredItems = catalog.filter((item) => {
    const matchesSearch =
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.ncm && item.ncm.includes(searchTerm));
    const matchesType = filterType === 'all' || item.type === filterType;
    return matchesSearch && matchesType;
  });

  const openNewModal = () => {
    setEditingId(null);
    setType('product');
    setCode(`ITM-${Math.floor(100 + Math.random() * 900)}`);
    setDescription('');
    setUnit('UN');
    setUnitPrice(0);
    setCostPrice(0);
    setBarcode('');
    setNcm('4415.20.00');
    setCest('10.001.00');
    setCfop('5102');
    setOrigin('0');
    setLc116Item('01.07');
    setIssRate(2.0);
    setTaxCodeMunicipal('');
    setIsModalOpen(true);
  };

  const handleEdit = (item: CatalogItem) => {
    setEditingId(item.id);
    setType(item.type);
    setCode(item.code);
    setDescription(item.description);
    setUnit(item.unit);
    setUnitPrice(item.unitPrice);
    setCostPrice(item.costPrice || 0);
    setBarcode(item.barcode || '');
    setNcm(item.ncm || '');
    setCest(item.cest || '');
    setCfop(item.cfop || '5102');
    setOrigin(item.origin || '0');
    setLc116Item(item.lc116Item || '');
    setIssRate(item.issRate || 2.0);
    setTaxCodeMunicipal(item.taxCodeMunicipal || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      type,
      code,
      description,
      unit,
      unitPrice,
      costPrice,
      barcode,
      ncm: type === 'product' ? ncm : undefined,
      cest: type === 'product' ? cest : undefined,
      cfop: type === 'product' ? cfop : undefined,
      origin: type === 'product' ? origin : undefined,
      lc116Item: type === 'service' ? lc116Item : undefined,
      issRate: type === 'service' ? issRate : undefined,
      taxCodeMunicipal: type === 'service' ? taxCodeMunicipal : undefined,
      status: 'active' as const,
    };

    if (editingId) {
      updateCatalogItem(editingId, payload);
    } else {
      addCatalogItem(payload);
    }

    setIsModalOpen(false);
  };

  const handleRunTaxAudit = async () => {
    setIsAuditing(true);
    setAuditError(null);
    try {
      const res = await fetch('/api/fiscal/weekly-tax-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: catalog.map((c) => ({
            id: c.id,
            code: c.code,
            description: c.description,
            type: c.type,
            ncm: c.ncm,
            cest: c.cest,
            cfop: c.cfop,
            currentIssRate: c.issRate,
          })),
          companyState: activeCompany?.address.state || 'SP',
          companyTaxRegime: activeCompany?.taxRegime || 'Simples Nacional',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setAuditAlerts(data.alerts || []);
        setLastAuditDate(new Date().toLocaleDateString('pt-BR'));
        setIsTaxAuditModalOpen(true);
      } else {
        setAuditError(data.error || 'Falha ao executar auditoria semanal.');
        setIsTaxAuditModalOpen(true);
      }
    } catch (err: any) {
      setAuditError(err.message || 'Erro ao conectar ao auditor fiscal.');
      setIsTaxAuditModalOpen(true);
    } finally {
      setIsAuditing(false);
    }
  };

  const handleApplySuggestion = (alert: TaxChangeAlert) => {
    if (!alert.suggestedUpdate) return;
    const item = catalog.find((c) => c.id === alert.itemId);
    if (!item) return;

    updateCatalogItem(alert.itemId, {
      cfop: alert.suggestedUpdate.cfop || item.cfop,
      cest: alert.suggestedUpdate.cest || item.cest,
      issRate: alert.suggestedUpdate.issRate || item.issRate,
    });

    setAuditAlerts((prev) => prev.filter((a) => a.itemId !== alert.itemId));
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-400" />
            <span>Catálogo Unificado de Produtos & Serviços</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Empresa ativa: <strong className="text-indigo-300">{activeCompany?.tradeName}</strong>. Suporte completo para NCM, CEST, CFOP, Origem e LC 116 para NFS-e.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleRunTaxAudit}
            disabled={isAuditing}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-purple-600/25 transition-all cursor-pointer border border-purple-400/30 disabled:opacity-50"
            title="Escanear semanalmente o catálogo contra mudanças de tributos, ICMS-ST, alíquotas e reforma tributária"
          >
            {isAuditing ? <RotateCw className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4 text-purple-200" />}
            <span>Auditoria Semanal de Impostos</span>
          </button>
          <button
            onClick={openNewModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Item no Catálogo</span>
          </button>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="p-3 bg-slate-900/60 rounded-2xl border border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por descrição, código ou NCM..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-400 outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
          <div className="flex rounded-xl bg-slate-800/80 p-1 border border-slate-700/80 text-xs">
            {(['all', 'product', 'service'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1 rounded-lg capitalize transition-colors ${
                  filterType === t
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t === 'all' ? 'Todos' : t === 'product' ? 'Produtos' : 'Serviços'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid Table */}
      <div className="bg-slate-900/40 rounded-2xl border border-slate-800/90 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Código & Descrição</th>
                <th className="py-3 px-4">Tipo & Unidade</th>
                <th className="py-3 px-4">Estoque Atual</th>
                <th className="py-3 px-4">Preço Unitário</th>
                <th className="py-3 px-4">Atributos Fiscais</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Nenhum item cadastrado no catálogo desta unidade.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        {item.type === 'product' ? (
                          <Package className="w-4 h-4 text-indigo-400 shrink-0" />
                        ) : (
                          <Wrench className="w-4 h-4 text-cyan-400 shrink-0" />
                        )}
                        <span className="font-bold text-white text-sm">{item.description}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        Cód: {item.code} {item.barcode && `• EAN: ${item.barcode}`}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                          item.type === 'product'
                            ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/30'
                            : 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                        }`}
                      >
                        {item.type === 'product' ? 'Produto' : 'Serviço'}
                      </span>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        Unidade: <strong className="text-slate-300">{item.unit}</strong>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {item.type === 'product' ? (
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className={`font-mono font-bold text-sm ${
                              (item.stockBalance ?? 0) <= (item.minStock ?? 10)
                                ? 'text-amber-400'
                                : 'text-slate-100'
                            }`}>
                              {item.stockBalance ?? 0} {item.unit}
                            </span>
                            {(item.stockBalance ?? 0) <= (item.minStock ?? 10) && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                Baixo
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            Mín: {item.minStock ?? 10} {item.unit}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-[11px] italic">Inesgotável</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-emerald-400 font-mono text-sm">
                        {item.unitPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </div>
                      {item.costPrice ? (
                        <div className="text-[10px] text-slate-400 font-mono">
                          Custo: {item.costPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </div>
                      ) : null}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      {item.type === 'product' ? (
                        <div className="space-y-0.5 text-slate-300">
                          <div>NCM: <span className="text-white font-semibold">{item.ncm}</span></div>
                          <div className="text-[10px] text-slate-400">CFOP: {item.cfop} • Origem: {item.origin}</div>
                        </div>
                      ) : (
                        <div className="space-y-0.5 text-slate-300">
                          <div>Item LC 116: <span className="text-cyan-300 font-semibold">{item.lc116Item}</span></div>
                          <div className="text-[10px] text-slate-400">Alíquota ISS: {item.issRate}%</div>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Ativo
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          title="Editar Item"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteCatalogItem(item.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CRUD Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-400" />
                <span>{editingId ? 'Editar Item do Catálogo' : 'Novo Item no Catálogo'}</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white text-sm">
                ✕ Fechar
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Tipo de Item</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setType('product')}
                      className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                        type === 'product'
                          ? 'border-indigo-500 bg-indigo-600/20 text-indigo-300'
                          : 'border-slate-800 bg-slate-800/60 text-slate-400'
                      }`}
                    >
                      Produto (NF-e)
                    </button>
                    <button
                      type="button"
                      onClick={() => setType('service')}
                      className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                        type === 'service'
                          ? 'border-cyan-500 bg-cyan-600/20 text-cyan-300'
                          : 'border-slate-800 bg-slate-800/60 text-slate-400'
                      }`}
                    >
                      Serviço (NFS-e)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Código Interno</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="PRD-001"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-mono outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Descrição Comercial</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Palete Padrão PBR de Madeira Tratada"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Unidade</label>
                  <input
                    type="text"
                    required
                    value={unit}
                    onChange={(e) => setUnit(e.target.value.toUpperCase())}
                    placeholder="UN, KG, HR, M2"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-mono outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Preço de Venda (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-mono outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Preço de Custo (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={costPrice}
                    onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-mono outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Fiscal Block - Conditional */}
              <div className="pt-3 border-t border-slate-800">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">
                  {type === 'product' ? 'Parâmetros Fiscais de Produto (ICMS / IPI)' : 'Parâmetros Fiscais de Serviço (ISS / LC 116)'}
                </span>

                {type === 'product' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">NCM (8 dígitos)</label>
                      <input
                        type="text"
                        required
                        value={ncm}
                        onChange={(e) => setNcm(e.target.value)}
                        placeholder="4415.20.00"
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">CEST (Opcional)</label>
                      <input
                        type="text"
                        value={cest}
                        onChange={(e) => setCest(e.target.value)}
                        placeholder="10.001.00"
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">CFOP Padrão</label>
                      <input
                        type="text"
                        required
                        value={cfop}
                        onChange={(e) => setCfop(e.target.value)}
                        placeholder="5102"
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Origem Mercadoria</label>
                      <select
                        value={origin}
                        onChange={(e) => setOrigin(e.target.value as any)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs"
                      >
                        <option value="0">0 - Nacional</option>
                        <option value="1">1 - Importação Direta</option>
                        <option value="2">2 - Estrangeira Interna</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Item LC 116/03</label>
                      <input
                        type="text"
                        required
                        value={lc116Item}
                        onChange={(e) => setLc116Item(e.target.value)}
                        placeholder="Ex: 01.07 Suporte téc."
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Alíquota ISS (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        required
                        value={issRate}
                        onChange={(e) => setIssRate(parseFloat(e.target.value) || 0)}
                        placeholder="2.0"
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Cód. Tributação Municipal</label>
                      <input
                        type="text"
                        value={taxCodeMunicipal}
                        onChange={(e) => setTaxCodeMunicipal(e.target.value)}
                        placeholder="02891"
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 cursor-pointer"
                >
                  Salvar Item no Catálogo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Auditoria Tributária Semanal de Mudanças de Impostos */}
      {isTaxAuditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-purple-500/30 rounded-2xl w-full max-w-2xl p-6 shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh]">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-500" />

            {/* Modal Header */}
            <div className="flex justify-between items-center pb-3 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center border border-purple-500/30">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Auditoria Semanal de Tributos & Alíquotas</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono">
                      SEFAZ • Receita • Reforma
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Monitoramento contínuo de NCM, CEST, ICMS-ST e alíquotas para {activeCompany?.name} ({activeCompany?.address.state}).
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsTaxAuditModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕ Fechar
              </button>
            </div>

            {/* Modal Body */}
            <div className="py-4 overflow-y-auto space-y-3.5 pr-1 flex-1">
              {auditError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{auditError}</span>
                </div>
              )}

              {lastAuditDate && (
                <div className="flex items-center justify-between text-xs px-3 py-2 bg-slate-950/60 rounded-xl border border-slate-800 text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Último Varredura Semanal: <strong className="text-white">{lastAuditDate}</strong></span>
                  </div>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {auditAlerts.length} itens analisados
                  </span>
                </div>
              )}

              {auditAlerts.length === 0 && !auditError && (
                <div className="text-center py-8 space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                  <p className="text-sm font-bold text-white">Nenhuma inconformidade fiscal detectada!</p>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Todos os NCMs, CFOPs e alíquotas de ISS do seu catálogo estão em conformidade com as tabelas vigentes da SEFAZ e Receita Federal.
                  </p>
                </div>
              )}

              {auditAlerts.map((alert, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border transition-all ${
                    alert.severity === 'alta'
                      ? 'bg-rose-950/20 border-rose-500/40 text-slate-200'
                      : alert.severity === 'media'
                      ? 'bg-amber-950/20 border-amber-500/40 text-slate-200'
                      : 'bg-slate-800/40 border-slate-700/60 text-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-bold font-mono ${
                            alert.severity === 'alta'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : alert.severity === 'media'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                          }`}
                        >
                          {alert.severity}
                        </span>
                        <span className="text-xs font-bold text-white">{alert.title}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-medium">
                        Item: <strong className="text-indigo-300">{alert.itemDescription}</strong> ({alert.code}) • Identificador: <span className="font-mono text-white">{alert.ncmOrLc116}</span>
                      </div>
                    </div>

                    {alert.suggestedUpdate && (
                      <button
                        onClick={() => handleApplySuggestion(alert)}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] flex items-center gap-1 shrink-0 cursor-pointer shadow-sm transition-all"
                        title="Aplicar ajuste fiscal sugerido automaticamente"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Corrigir</span>
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                    {alert.description}
                  </p>

                  <div className="mt-3 pt-2 border-t border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] text-slate-400">
                    <div>
                      Base Legal: <span className="font-mono text-slate-300">{alert.legalReference}</span>
                    </div>
                    <div className="text-indigo-300 font-medium">
                      Ação: {alert.recommendedAction}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-between items-center pt-3 border-t border-slate-800 shrink-0">
              <span className="text-[11px] text-slate-400">
                Rotina sugerida: Executar semanalmente ou a cada virada de mês contábil.
              </span>
              <button
                onClick={() => setIsTaxAuditModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium cursor-pointer"
              >
                Concluir Visualização
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
