'use client';

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Sparkles,
  Bot,
  HelpCircle,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  GraduationCap,
  Plus,
  Send,
  RotateCw,
  Search,
  ChevronRight,
  ShieldCheck,
  Server,
  Package,
  Users,
  Building2,
  Copy,
  Check,
  ArrowRight,
} from 'lucide-react';

interface KnowledgeRule {
  id: string;
  questionTrigger: string;
  learnedAnswer: string;
  category: 'fiscal' | 'operacional' | 'cadastro' | 'geral';
  source?: string;
}

export default function HelpAndManualView() {
  const [activeSubTab, setActiveSubTab] = useState<'manual' | 'ai_assistant' | 'faq'>('manual');
  const [searchQuery, setSearchQuery] = useState('');

  // AI Assistant State
  const [userQuery, setUserQuery] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'user' | 'ai'; text: string; source?: string }>>([
    {
      sender: 'ai',
      text: 'Olá! Sou a **GADAP AI Intelligence**, sua tutora e inteligência artificial personalizada do sistema. Posso tirar dúvidas fiscais, orientar o preenchimento de NF-e, ensinar sobre o motor **Fiscal Contora** e até aprender novas regras operacionais da sua empresa. Como posso te orientar agora?',
      source: 'sistema',
    },
  ]);

  // Teach AI State
  const [isTeachingOpen, setIsTeachingOpen] = useState(false);
  const [teachQuestion, setTeachQuestion] = useState('');
  const [teachAnswer, setTeachAnswer] = useState('');
  const [teachCategory, setTeachCategory] = useState<'fiscal' | 'operacional' | 'cadastro'>('fiscal');
  const [teachStatus, setTeachStatus] = useState<string | null>(null);

  // Pre-programmed questions for rapid learning
  const quickQuestions = [
    'Como emitir uma NF-e para outro estado sem rejeição?',
    'Como ajustar a numeração das notas fiscais (NF-e/NFS-e)?',
    'Como funciona o envio contínuo por WhatsApp e cobrança Pix?',
    'O que fazer se a SEFAZ ou a Fiscal Contora ficar lenta?',
    'Como funciona a Carta de Correção Eletrônica (CC-e)?',
    'Como cadastrar um produto com controle de estoque?',
    'Como importar o XML de compra de um fornecedor?',
    'Como enviar notas para a contabilidade no fim do mês?',
  ];

  const handleAsk = async (questionToAsk?: string) => {
    const q = questionToAsk || userQuery;
    if (!q.trim()) return;

    setChatHistory((prev) => [...prev, { sender: 'user', text: q }]);
    if (!questionToAsk) setUserQuery('');
    setIsAiLoading(true);

    try {
      const res = await fetch('/api/ai/system-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      });
      const data = await res.json();

      if (data.success && data.response) {
        setChatHistory((prev) => [
          ...prev,
          {
            sender: 'ai',
            text: data.response,
            source: data.source === 'learned_memory' ? 'Base Aprendida' : 'GADAP Teacher AI',
          },
        ]);
      } else {
        setChatHistory((prev) => [
          ...prev,
          { sender: 'ai', text: 'Não foi possível processar a consulta no momento.' },
        ]);
      }
    } catch (err: any) {
      setChatHistory((prev) => [
        ...prev,
        { sender: 'ai', text: `Erro na comunicação: ${err.message}` },
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleTeachAi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teachQuestion.trim() || !teachAnswer.trim()) return;

    try {
      const res = await fetch('/api/ai/system-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'teach',
          teachRule: {
            question: teachQuestion,
            answer: teachAnswer,
            category: teachCategory,
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        setTeachStatus('Novo conhecimento gravado com sucesso! A IA agora responderá essa regra.');
        setTimeout(() => {
          setIsTeachingOpen(false);
          setTeachQuestion('');
          setTeachAnswer('');
          setTeachStatus(null);
        }, 2000);
      }
    } catch (err: any) {
      alert('Falha ao ensinar a IA: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn font-sans">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
              <GraduationCap className="w-5 h-5" />
            </span>
            <span className="text-xs uppercase font-extrabold tracking-wider text-indigo-400">
              Centro de Conhecimento, Manual Professoral & IA Tutora
            </span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1">
            Manual do Sistema GADAP Hub & IA Personalizada
          </h1>
          <p className="text-xs text-slate-400 max-w-2xl mt-1">
            Guia completo, professoral e autoexplicativo sobre regras tributárias, emissão de NF-e/NFS-e, motor Fiscal Contora e assistência inteligente interativa com aprendizado contínuo.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 bg-slate-950/80 rounded-2xl border border-slate-800 shrink-0">
          <button
            onClick={() => setActiveSubTab('manual')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'manual'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Manual do Usuário</span>
          </button>
          <button
            onClick={() => setActiveSubTab('ai_assistant')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'ai_assistant'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-300 animate-pulse" />
            <span>IA Personalizada (Auto-Aprendizado)</span>
          </button>
        </div>
      </div>

      {/* SUBTAB 1: MANUAL DO SISTEMA PROFESSORAL */}
      {activeSubTab === 'manual' && (
        <div className="space-y-6">
          {/* Guia Rápido de 4 Passos para Emissão Fiscal */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-400" />
              Guia Didático: O Ciclo Completo de Emissão de uma Nota Fiscal (NF-e mod. 55)
            </h2>
            <p className="text-xs text-slate-400">
              Siga estas quatro etapas para garantir que suas operações de venda ocorram com 100% de conformidade com a SEFAZ:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 relative overflow-hidden">
                <span className="absolute -right-2 -bottom-2 text-4xl font-black text-slate-900 select-none">1</span>
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">Passo 1</span>
                <h3 className="text-sm font-bold text-white">Cadastre o Cliente</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Informe CNPJ/CPF, Inscrição Estadual e endereço com CEP. O sistema consulta automaticamente a Receita Federal e valida se o cliente é Contribuinte ou Não Contribuinte.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 relative overflow-hidden">
                <span className="absolute -right-2 -bottom-2 text-4xl font-black text-slate-900 select-none">2</span>
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">Passo 2</span>
                <h3 className="text-sm font-bold text-white">Configure o Produto</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Defina o NCM correto de 8 dígitos (ex: 4415.20.00 para Paletes) e a Unidade Comercial. O saldo em estoque é controlado automaticamente por filial.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 relative overflow-hidden">
                <span className="absolute -right-2 -bottom-2 text-4xl font-black text-slate-900 select-none">3</span>
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">Passo 3</span>
                <h3 className="text-sm font-bold text-white">Selecione os Itens</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  No módulo fiscal, clique em "Emitir NF-e", selecione o cliente e adicione múltiplos itens. Você pode consultar o <strong>Copiloto Fiscal IA</strong> para sugerir o CFOP ideal.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 relative overflow-hidden">
                <span className="absolute -right-2 -bottom-2 text-4xl font-black text-slate-900 select-none">4</span>
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">Passo 4</span>
                <h3 className="text-sm font-bold text-white">Transmissão & Envio</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  O motor <strong>Fiscal Contora</strong> valida e autoriza na SEFAZ. Em seguida, envie a DANFE e o XML com 1 clique pelo <strong>WhatsApp (Evolution API)</strong> ou E-mail.
                </p>
              </div>
            </div>
          </div>

          {/* Dicionário Professoral de CFOPs e Regras Tributárias */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FileCode className="w-5 h-5 text-indigo-400" />
              Tabela Didática: Regras de CFOP & Diferencial Interestadual
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase font-semibold">
                    <th className="py-3 px-4">CFOP</th>
                    <th className="py-3 px-4">Operação</th>
                    <th className="py-3 px-4">Âmbito</th>
                    <th className="py-3 px-4">Quando Utilizar (Regra de Ouro)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  <tr className="hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-300">5.102</td>
                    <td className="py-3 px-4 font-semibold text-white">Venda de mercadoria adquirida de terceiros</td>
                    <td className="py-3 px-4"><span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold text-[10px]">Interna (Mesmo Estado)</span></td>
                    <td className="py-3 px-4 text-slate-300">Quando a empresa emitente (ex: SP) vende para um cliente localizado no mesmo estado de SP.</td>
                  </tr>
                  <tr className="hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-mono font-bold text-cyan-300">6.102</td>
                    <td className="py-3 px-4 font-semibold text-white">Venda de mercadoria adquirida de terceiros</td>
                    <td className="py-3 px-4"><span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-semibold text-[10px]">Interestadual (Outro Estado)</span></td>
                    <td className="py-3 px-4 text-slate-300">Quando a empresa (SP) vende para outro estado (ex: RJ, MG, MT). O sistema converte automaticamente o CFOP 5102 para 6102.</td>
                  </tr>
                  <tr className="hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-mono font-bold text-amber-300">5.405 / 6.404</td>
                    <td className="py-3 px-4 font-semibold text-white">Venda com Substituição Tributária (ICMS-ST)</td>
                    <td className="py-3 px-4"><span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 font-semibold text-[10px]">ICMS Retido Anteriormente</span></td>
                    <td className="py-3 px-4 text-slate-300">Produtos cujo imposto já foi recolhido antecipadamente na cadeia pelo fabricante ou distribuidor.</td>
                  </tr>
                  <tr className="hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-mono font-bold text-purple-300">1.102 / 2.102</td>
                    <td className="py-3 px-4 font-semibold text-white">Entrada / Compra de Mercadoria</td>
                    <td className="py-3 px-4"><span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/30 font-semibold text-[10px]">Entrada de Estoque</span></td>
                    <td className="py-3 px-4 text-slate-300">Lançamento de compras de fornecedores através do botão "Importar XML Compra". Alimenta o estoque automaticamente.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Seção Professoral: Como Ajustar a Sequência e Numeração das Notas Fiscais */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              Manual Didático: Como Ajustar Séries e Sequência de Numeração de NF-e e NFS-e
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              O GADAP gerencia os números sequenciais de cada documento de forma isolada por empresa/filial. Caso sua empresa esteja migrando de outro emissor ou precise sincronizar a sequência com o portal da SEFAZ, siga o procedimento abaixo:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">Método 1: Ajuste Rápido no Emissor</span>
                <h3 className="text-sm font-bold text-white">Botão "Configurações & Certificado A1"</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  1. No menu lateral, abra <strong>Emissor Fiscal (NF-e/NFS-e)</strong>.<br />
                  2. Clique em <strong>"Configurações & Certificado A1"</strong> no topo da página.<br />
                  3. Altere o campo <strong>"Último Nº NF-e"</strong> para o último número já homologado pela SEFAZ (ex: se parou na nota 150, digite 150).<br />
                  4. A próxima nota autorizada pelo GADAP será automaticamente a <strong>151</strong>.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">Regra de Ouro SEFAZ</span>
                <h3 className="text-sm font-bold text-white">Salto de Numeração ou Nova Série</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  • <strong>Atenção aos Saltos</strong>: A SEFAZ exige que a sequência seja contínua. Caso você pule números, a contabilidade precisará fazer a <em>inutilização da numeração pulada</em>.<br />
                  • <strong>Troca de Série Segura</strong>: Para evitar qualquer conflito com o software anterior, você pode alterar a <strong>Série para 2</strong> e iniciar novamente a numeração da nota 1.
                </p>
              </div>
            </div>
          </div>

          {/* Seção Professoral: Notificações Contínuas via WhatsApp (Evolution API) */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Send className="w-5 h-5 text-emerald-400" />
              Manual Didático: Ciclo de Notificações Contínuas via WhatsApp & Cobrança Pix
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              O GADAP integra diretamente com a <strong>Evolution API</strong> (instância <code>ecostone</code>), permitindo enviar 4 templates especializados de comunicação com o cliente:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="text-emerald-400 font-bold text-xs flex items-center gap-1.5">
                  <span>📄 Comprovante Fiscal</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Dispara a DANFE oficial em PDF e o link do XML autorizado na SEFAZ assim que a nota for emitida.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="text-cyan-400 font-bold text-xs flex items-center gap-1.5">
                  <span>🚚 Carga em Trânsito</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Informa ao comprador que os itens foram conferidos, a mercadoria foi embarcada e está a caminho.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="text-indigo-400 font-bold text-xs flex items-center gap-1.5">
                  <span>✅ Entrega Realizada</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Confirmação digital de entrega e encerramento da rota de frete para registro no histórico.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="text-amber-400 font-bold text-xs flex items-center gap-1.5">
                  <span>⏰ Cobrança & Pix</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Lembrete amigável de vencimento acompanhado do código <strong>Pix Copia e Cola</strong> para quitação instantânea.
                </p>
              </div>
            </div>
          </div>

          {/* Dúvidas Frequentes da Operação */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Como funciona o cancelamento de uma NF-e?
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Pela legislação nacional da SEFAZ, o cancelamento extemporâneo padrão deve ocorrer em até 24 horas após a autorização, desde que a mercadoria ainda não tenha saído para circulação física. A justificativa informada pelo operador exige no mínimo 15 caracteres.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                Qual a diferença entre NF-e e NFS-e?
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                A <strong>NF-e (modelo 55)</strong> é de competência Estadual (SEFAZ) e documenta a venda de produtos físicos e mercadorias. A <strong>NFS-e</strong> é de competência Municipal (Prefeitura) e documenta a prestação de serviços sujeitos ao ISSQN (com o código de serviço LC 116).
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                Como funciona a redundância Fiscal Contora + Focus NFe?
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                O gateway universal do GADAP opera prioritariamente com a <strong>Fiscal Contora</strong>. Caso a SEFAZ ou o endpoint apresente latência anormal ou falha, o sistema executa o failover automático para a <strong>Focus NFe</strong> sem necessidade de reprocessar a nota manualmente.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
                Como exportar o pacote contábil mensal?
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Na barra superior de ações do módulo fiscal, clique no botão <strong>"Pacote Contador"</strong>. O sistema compila automaticamente uma planilha auditada com todas as notas autorizadas, canceladas, valores, impostos e chaves de acesso do mês para envio à contabilidade.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-400" />
                Como funciona a Auditoria Semanal de Impostos?
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Na aba <strong>"Produtos & Serviços"</strong>, o botão <strong>"Auditoria Semanal de Impostos"</strong> varre todos os itens cadastrados contra as regras vigentes da SEFAZ, CONFAZ e Reforma Tributária (IBS/CBS). Caso seja detectada exigência de ICMS-ST ou mudança de alíquota, o sistema alerta e permite corrigir o CFOP/CEST com 1 clique.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: NOSSA IA PERSONALIZADA COM APRENDIZADO */}
      {activeSubTab === 'ai_assistant' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Chat Interativo */}
          <div className="lg:col-span-2 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col h-[650px] overflow-hidden shadow-2xl">
            {/* Header do Chat */}
            <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-600/30">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    GADAP AI Intelligence (Tutora do Sistema)
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                      Memória Ativa
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Aprende regras personalizadas de faturamento e responde dúvidas fiscais em segundos.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsTeachingOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ensinar Nova Regra</span>
              </button>
            </div>

            {/* Mensagens */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4">
              {chatHistory.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed space-y-1.5 shadow-md ${
                      msg.sender === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-none'
                        : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-bl-none'
                    }`}
                  >
                    {msg.source && (
                      <span className="text-[10px] uppercase font-bold tracking-wider text-purple-300 block mb-1">
                        Origem: {msg.source}
                      </span>
                    )}
                    <div className="whitespace-pre-line font-sans">{msg.text}</div>
                  </div>
                </div>
              ))}

              {isAiLoading && (
                <div className="flex justify-start">
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                    <RotateCw className="w-4 h-4 animate-spin text-purple-400" />
                    <span>Consultando base de conhecimento e formulando resposta professoral...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAsk();
              }}
              className="p-3 border-t border-slate-800 bg-slate-950/80 flex items-center gap-2"
            >
              <input
                type="text"
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                placeholder="Pergunte qualquer dúvida sobre o sistema, SEFAZ, CFOP, estoques..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-sans"
              />
              <button
                type="submit"
                disabled={isAiLoading || !userQuery.trim()}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-purple-600/20 disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Enviar</span>
              </button>
            </form>
          </div>

          {/* Right Column: Perguntas Pré-programadas e Banco de Regras */}
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                Perguntas Frequentes Pré-Programadas
              </h3>
              <p className="text-[11px] text-slate-400">
                Clique em qualquer pergunta rápida para obter a resposta imediata da IA:
              </p>

              <div className="space-y-2">
                {quickQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAsk(q)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-purple-500/40 text-left text-xs text-slate-300 hover:text-white transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <span className="truncate pr-2">{q}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-purple-400 shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            {/* Banner de Aprendizado */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-950/30 to-indigo-950/30 border border-purple-500/30 space-y-2">
              <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider block">
                🧠 Sistema com Auto-Aprendizado
              </span>
              <h4 className="text-sm font-bold text-white">Ensine sua equipe e o sistema</h4>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Você pode cadastrar regras específicas do seu negócio (ex: <i>"Qual tabela de frete usamos para a filial MT?"</i> ou <i>"Qual CFOP usamos para transferência entre filiais?"</i>). A IA memoriza e responde para qualquer operador do sistema.
              </p>
              <button
                onClick={() => setIsTeachingOpen(true)}
                className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md mt-2 cursor-pointer"
              >
                Adicionar Conhecimento Agora
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ENSINAR A IA (AUTO-APRENDIZADO) */}
      {isTeachingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl p-6">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <span>Ensinar Novo Conhecimento à IA</span>
              </h3>
              <button
                onClick={() => setIsTeachingOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕ Fechar
              </button>
            </div>

            <form onSubmit={handleTeachAi} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Pergunta ou Palavra-Chave Gatilho
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Como funciona a devolução de mercadoria na filial SP?"
                  value={teachQuestion}
                  onChange={(e) => setTeachQuestion(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-sans focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Categoria
                </label>
                <select
                  value={teachCategory}
                  onChange={(e: any) => setTeachCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-sans focus:outline-none focus:border-purple-500"
                >
                  <option value="fiscal">Fiscal & Tributário</option>
                  <option value="operacional">Operacional & Estoque</option>
                  <option value="cadastro">Cadastros & Clientes</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Resposta Exata que a IA deve Ensinar
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Explique o procedimento passo a passo..."
                  value={teachAnswer}
                  onChange={(e) => setTeachAnswer(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-purple-500 resize-none font-sans"
                />
              </div>

              {teachStatus && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{teachStatus}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsTeachingOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-lg shadow-purple-600/30 flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Gravar na Memória da IA</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
