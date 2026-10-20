'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Company, TaxRegime } from '@/types/domain';
import { Building2, Plus, Edit2, Shield, KeyRound, MapPin, CheckCircle, FileText } from 'lucide-react';

export default function CompaniesManager() {
  const { companies, addCompany, updateCompany, activeCompany } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [tradeName, setTradeName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [ie, setIe] = useState('');
  const [im, setIm] = useState('');
  const [taxRegime, setTaxRegime] = useState<TaxRegime>('Simples Nacional');
  const [accessCode, setAccessCode] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('SP');
  const [zipCode, setZipCode] = useState('');

  const openNewModal = () => {
    setEditingCompany(null);
    setName('');
    setTradeName('');
    setCnpj('');
    setIe('');
    setIm('');
    setTaxRegime('Simples Nacional');
    setAccessCode(`GADAP-UN-${Math.floor(1000 + Math.random() * 9000)}`);
    setStreet('');
    setNumber('');
    setDistrict('');
    setCity('');
    setState('SP');
    setZipCode('');
    setIsModalOpen(true);
  };

  const openEditModal = (comp: Company) => {
    setEditingCompany(comp);
    setName(comp.name);
    setTradeName(comp.tradeName);
    setCnpj(comp.cnpj);
    setIe(comp.ie);
    setIm(comp.im || '');
    setTaxRegime(comp.taxRegime);
    setAccessCode(comp.accessCode);
    setStreet(comp.address.street);
    setNumber(comp.address.number);
    setDistrict(comp.address.district);
    setCity(comp.address.city);
    setState(comp.address.state);
    setZipCode(comp.address.zipCode);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      name,
      tradeName,
      cnpj,
      ie,
      im,
      taxRegime,
      accessCode,
      status: 'active' as const,
      address: {
        street,
        number,
        district,
        city,
        state,
        zipCode,
      },
      fiscalSettings: editingCompany?.fiscalSettings || {
        environment: 'homologacao' as const,
        certificateA1Installed: false,
        nfeSeries: 1,
        nfeCurrentNumber: 1,
        nfseSeries: 1,
        nfseCurrentNumber: 1,
      },
    };

    if (editingCompany) {
      updateCompany(editingCompany.id, payload);
    } else {
      addCompany(payload);
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-400" />
            <span>Gestão de Unidades & Empresas (Tenants)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Controle de filiais corporativas, CNPJs, Inscrições e Chaves de Acesso exclusivas.
          </p>
        </div>
        <button
          onClick={openNewModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Empresa / Unidade</span>
        </button>
      </div>

      {/* Grid of Companies */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {companies.map((comp) => {
          const isActive = comp.id === activeCompany?.id;
          return (
            <div
              key={comp.id}
              className={`rounded-2xl border p-5 flex flex-col justify-between transition-all relative overflow-hidden ${
                isActive
                  ? 'bg-slate-900/90 border-indigo-500/80 shadow-xl shadow-indigo-950/40 ring-1 ring-indigo-500/50'
                  : 'bg-slate-900/40 border-slate-800 hover:border-slate-700/80'
              }`}
            >
              {isActive && (
                <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-bold px-3 py-0.5 rounded-bl-lg tracking-wider uppercase">
                  Empresa Ativa
                </div>
              )}

              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <button
                    onClick={() => openEditModal(comp)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title="Editar unidade"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <h3 className="font-bold text-white text-base leading-snug">{comp.tradeName}</h3>
                <p className="text-xs text-slate-400 font-medium mb-3">{comp.name}</p>

                <div className="space-y-1.5 py-3 border-y border-slate-800/80 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">CNPJ:</span>
                    <span className="font-mono text-slate-200">{comp.cnpj}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Inscrição Est.:</span>
                    <span className="font-mono text-slate-200">{comp.ie}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Regime:</span>
                    <span className="text-indigo-400 font-medium">{comp.taxRegime}</span>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="truncate">
                    {comp.address.city} - {comp.address.state}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
                  <KeyRound className="w-3 h-3 text-indigo-400" />
                  <span>{comp.accessCode}</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                  NF-e: #{comp.fiscalSettings.nfeCurrentNumber}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal CRUD */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-400" />
                <span>{editingCompany ? 'Editar Empresa / Unidade' : 'Cadastrar Nova Unidade'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕ Fechar
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Razão Social</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: GADAP LOGISTICA LTDA"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Nome Fantasia</label>
                  <input
                    type="text"
                    required
                    value={tradeName}
                    onChange={(e) => setTradeName(e.target.value)}
                    placeholder="Ex: GADAP Log Filial Campinas"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">CNPJ</label>
                  <input
                    type="text"
                    required
                    value={cnpj}
                    onChange={(e) => setCnpj(e.target.value)}
                    placeholder="00.000.000/0001-00"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-mono outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Inscrição Estadual</label>
                  <input
                    type="text"
                    required
                    value={ie}
                    onChange={(e) => setIe(e.target.value)}
                    placeholder="110.220.330.440"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-mono outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Inscrição Municipal</label>
                  <input
                    type="text"
                    value={im}
                    onChange={(e) => setIm(e.target.value)}
                    placeholder="999888"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-mono outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Regime Tributário</label>
                  <select
                    value={taxRegime}
                    onChange={(e) => setTaxRegime(e.target.value as TaxRegime)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs outline-none focus:border-indigo-500"
                  >
                    <option value="Simples Nacional">Simples Nacional</option>
                    <option value="Lucro Presumido">Lucro Presumido</option>
                    <option value="Lucro Real">Lucro Real</option>
                    <option value="MEI">MEI (Microempreendedor)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Chave de Acesso (Login Code)</label>
                  <input
                    type="text"
                    required
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value)}
                    placeholder="GADAP-UN-1234"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-mono tracking-wider outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Endereço */}
              <div className="pt-2 border-t border-slate-800">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Endereço da Unidade</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <input
                      type="text"
                      placeholder="CEP (00000-000)"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs font-mono"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      placeholder="Logradouro / Rua"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Número"
                      value={number}
                      onChange={(e) => setNumber(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Bairro"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs"
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Cidade"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-2/3 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs"
                    />
                    <input
                      type="text"
                      placeholder="UF"
                      maxLength={2}
                      value={state}
                      onChange={(e) => setState(e.target.value.toUpperCase())}
                      className="w-1/3 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs font-mono"
                    />
                  </div>
                </div>
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
                  Salvar Empresa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
