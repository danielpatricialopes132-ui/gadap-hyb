'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Entity, EntityRole, EntityType } from '@/types/domain';
import { Users, Plus, Search, Filter, Trash2, Edit3, MapPin, Mail, Phone, Building, User, CheckCircle2, Sparkles, Loader2 } from 'lucide-react';

export default function EntitiesManager() {
  const { entities, addEntity, updateEntity, deleteEntity, activeCompany } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'cliente' | 'fornecedor'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [type, setType] = useState<EntityType>('PJ');
  const [role, setRole] = useState<EntityRole>('cliente');
  const [name, setName] = useState('');
  const [tradeName, setTradeName] = useState('');
  const [document, setDocument] = useState('');
  const [stateRegistration, setStateRegistration] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('SP');
  const [indicadorIE, setIndicadorIE] = useState<'1' | '2' | '9'>('1');
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [isLoadingCnpj, setIsLoadingCnpj] = useState(false);
  const [cnpjFeedback, setCnpjFeedback] = useState<string | null>(null);

  const filteredEntities = entities.filter((ent) => {
    const matchesSearch =
      ent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ent.document.includes(searchTerm) ||
      ent.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || ent.role === filterRole || ent.role === 'ambos';
    return matchesSearch && matchesRole;
  });

  // Automatic CNPJ Fetching (Receita Federal)
  const handleCnpjLookup = async () => {
    const cleanCnpj = document.replace(/\D/g, '');
    if (cleanCnpj.length !== 14) {
      alert('Digite os 14 dígitos do CNPJ para consultar na Receita Federal.');
      return;
    }

    setIsLoadingCnpj(true);
    setCnpjFeedback(null);

    try {
      const res = await fetch(`/api/cnpj?cnpj=${cleanCnpj}`);
      const data = await res.json();

      if (data.success) {
        setName(data.razaoSocial || '');
        setTradeName(data.nomeFantasia || '');
        setEmail(data.email || email);
        setPhone(data.telefone || phone);
        if (data.endereco) {
          setZipCode(data.endereco.cep || '');
          setStreet(data.endereco.logradouro || '');
          setNumber(data.endereco.numero || '');
          setDistrict(data.endereco.bairro || '');
          setCity(data.endereco.municipio || '');
          setState(data.endereco.uf || 'SP');
        }
        setCnpjFeedback(`Dados importados da Receita Federal: ${data.situacao}`);
      } else {
        alert(data.error || 'CNPJ não encontrado na Receita Federal.');
      }
    } catch (err: any) {
      alert(`Falha ao consultar CNPJ: ${err.message}`);
    } finally {
      setIsLoadingCnpj(false);
    }
  };

  // Automatic CEP Fetching simulation (ViaCEP pattern)
  const handleCepLookup = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    setZipCode(cep);
    if (cleanCep.length === 8) {
      setIsLoadingCep(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setStreet(data.logradouro || '');
          setDistrict(data.bairro || '');
          setCity(data.localidade || '');
          setState(data.uf || 'SP');
        }
      } catch (err) {
        console.error('ViaCep error:', err);
      } finally {
        setIsLoadingCep(false);
      }
    }
  };

  const openNewModal = () => {
    setEditingId(null);
    setType('PJ');
    setRole('cliente');
    setName('');
    setTradeName('');
    setDocument('');
    setStateRegistration('');
    setEmail('');
    setPhone('');
    setZipCode('');
    setStreet('');
    setNumber('');
    setDistrict('');
    setCity('');
    setState('SP');
    setIndicadorIE('1');
    setIsModalOpen(true);
  };

  const handleEdit = (ent: Entity) => {
    setEditingId(ent.id);
    setType(ent.type);
    setRole(ent.role);
    setName(ent.name);
    setTradeName(ent.tradeName || '');
    setDocument(ent.document);
    setStateRegistration(ent.stateRegistration || '');
    setEmail(ent.email);
    setPhone(ent.phone);
    setZipCode(ent.address.zipCode);
    setStreet(ent.address.street);
    setNumber(ent.address.number);
    setDistrict(ent.address.district);
    setCity(ent.address.city);
    setState(ent.address.state);
    setIndicadorIE(ent.fiscalProfile?.indicadorIE || '1');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      type,
      role,
      name,
      tradeName,
      document,
      stateRegistration,
      email,
      phone,
      address: {
        zipCode,
        street,
        number,
        district,
        city,
        state,
      },
      fiscalProfile: {
        indicadorIE,
      },
    };

    if (editingId) {
      updateEntity(editingId, payload);
    } else {
      addEntity(payload);
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            <span>Cadastro Unificado de Entidades (Clientes & Fornecedores)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Isolamento ativo na unidade: <strong className="text-indigo-300">{activeCompany?.tradeName}</strong>. Busca por CPF/CNPJ, CEP automático e metadados fiscais.
          </p>
        </div>
        <button
          onClick={openNewModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Cliente / Fornecedor</span>
        </button>
      </div>

      {/* Filters and Search Bar */}
      <div className="p-3 bg-slate-900/60 rounded-2xl border border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por razão social, CNPJ ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-400 outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
          <div className="flex rounded-xl bg-slate-800/80 p-1 border border-slate-700/80 text-xs">
            {(['all', 'cliente', 'fornecedor'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setFilterRole(r)}
                className={`px-3 py-1 rounded-lg capitalize transition-colors ${
                  filterRole === r
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {r === 'all' ? 'Todos' : r + 's'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Fast Data Grid */}
      <div className="bg-slate-900/40 rounded-2xl border border-slate-800/90 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Entidade / Razão Social</th>
                <th className="py-3 px-4">Documento (CPF/CNPJ)</th>
                <th className="py-3 px-4">Papel & Tipo</th>
                <th className="py-3 px-4">Localização</th>
                <th className="py-3 px-4">Fiscal / IE</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredEntities.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Nenhuma entidade encontrada para esta empresa ativa.
                  </td>
                </tr>
              ) : (
                filteredEntities.map((ent) => (
                  <tr key={ent.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white flex items-center gap-2">
                        {ent.type === 'PJ' ? (
                          <Building className="w-3.5 h-3.5 text-indigo-400" />
                        ) : (
                          <User className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                        <span>{ent.name}</span>
                      </div>
                      {ent.tradeName && <div className="text-[11px] text-slate-400">{ent.tradeName}</div>}
                      <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {ent.email}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {ent.phone}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-200">{ent.document}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex gap-1.5 items-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                            ent.role === 'cliente'
                              ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
                              : ent.role === 'fornecedor'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                              : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30'
                          }`}
                        >
                          {ent.role}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">({ent.type})</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>
                          {ent.address.city} - {ent.address.state}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        CEP: {ent.address.zipCode}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-mono text-slate-300">
                        IE: {ent.stateRegistration || 'Isento'}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {ent.fiscalProfile?.indicadorIE === '1'
                          ? 'Contribuinte ICMS'
                          : ent.fiscalProfile?.indicadorIE === '2'
                          ? 'Isento de ICMS'
                          : 'Não Contribuinte'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(ent)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          title="Editar Entidade"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteEntity(ent.id)}
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
                <Users className="w-5 h-5 text-indigo-400" />
                <span>{editingId ? 'Editar Entidade' : 'Cadastrar Nova Entidade'}</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white text-sm">
                ✕ Fechar
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Tipo de Pessoa</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setType('PJ')}
                      className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                        type === 'PJ'
                          ? 'border-indigo-500 bg-indigo-600/20 text-indigo-300'
                          : 'border-slate-800 bg-slate-800/60 text-slate-400'
                      }`}
                    >
                      Jurídica (PJ)
                    </button>
                    <button
                      type="button"
                      onClick={() => setType('PF')}
                      className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                        type === 'PF'
                          ? 'border-indigo-500 bg-indigo-600/20 text-indigo-300'
                          : 'border-slate-800 bg-slate-800/60 text-slate-400'
                      }`}
                    >
                      Física (PF)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Classificação / Papel</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as EntityRole)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs outline-none focus:border-indigo-500"
                  >
                    <option value="cliente">Cliente</option>
                    <option value="fornecedor">Fornecedor</option>
                    <option value="ambos">Ambos (Cliente & Fornecedor)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    {type === 'PJ' ? 'Razão Social' : 'Nome Completo'}
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Comercial Brasileira de Bebidas S.A."
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Nome Fantasia (Opcional)</label>
                  <input
                    type="text"
                    value={tradeName}
                    onChange={(e) => setTradeName(e.target.value)}
                    placeholder="Ex: Bebidas Brasil"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-semibold text-slate-300 uppercase">
                      {type === 'PJ' ? 'CNPJ' : 'CPF'}
                    </label>
                    {type === 'PJ' && (
                      <button
                        type="button"
                        disabled={isLoadingCnpj}
                        onClick={handleCnpjLookup}
                        className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                      >
                        {isLoadingCnpj ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Buscando...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3 h-3 text-indigo-400" />
                            <span>Buscar na Receita Federal</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    value={document}
                    onChange={(e) => setDocument(e.target.value)}
                    placeholder={type === 'PJ' ? '00.000.000/0001-00' : '000.000.000-00'}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-mono outline-none focus:border-indigo-500"
                  />
                  {cnpjFeedback && (
                    <span className="text-[10px] text-emerald-400 font-medium mt-1 block">
                      ✓ {cnpjFeedback}
                    </span>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Inscrição Estadual (IE)</label>
                  <input
                    type="text"
                    value={stateRegistration}
                    onChange={(e) => setStateRegistration(e.target.value)}
                    placeholder="Ex: 110.220.330 ou Isento"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-mono outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Indicador da IE (Fiscal)</label>
                  <select
                    value={indicadorIE}
                    onChange={(e) => setIndicadorIE(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs outline-none focus:border-indigo-500"
                  >
                    <option value="1">1 - Contribuinte ICMS</option>
                    <option value="2">2 - Isento de Inscrição</option>
                    <option value="9">9 - Não Contribuinte</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">E-mail para XML / DANFE</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="fiscal@cliente.com.br"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(11) 98765-4321"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Endereço com Busca Automática de CEP */}
              <div className="pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Endereço & Localização (ViaCEP Autocompletion)
                  </span>
                  {isLoadingCep && <span className="text-xs text-indigo-400 animate-pulse">Buscando CEP...</span>}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <input
                      type="text"
                      placeholder="CEP (ex: 01310-100)"
                      value={zipCode}
                      onChange={(e) => handleCepLookup(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-mono outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      placeholder="Logradouro / Avenida / Rua"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Número"
                      value={number}
                      onChange={(e) => setNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Bairro"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Cidade"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-2/3 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs outline-none focus:border-indigo-500"
                    />
                    <input
                      type="text"
                      placeholder="UF"
                      maxLength={2}
                      value={state}
                      onChange={(e) => setState(e.target.value.toUpperCase())}
                      className="w-1/3 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-mono outline-none focus:border-indigo-500"
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
                  Salvar Entidade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
