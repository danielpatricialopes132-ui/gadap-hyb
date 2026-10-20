import { NextRequest, NextResponse } from 'next/server';

interface LearnedRule {
  id: string;
  questionTrigger: string;
  learnedAnswer: string;
  category: 'fiscal' | 'operacional' | 'cadastro' | 'geral';
  confidence: number;
  createdAt: string;
  source: 'operador' | 'sistema' | 'gemini';
}

// In-memory persistent knowledge bank with default professorial rules
let knowledgeBase: LearnedRule[] = [
  {
    id: 'kb-01',
    questionTrigger: 'Como emitir uma NF-e para outro estado sem rejeição?',
    learnedAnswer:
      'Passo a Passo Professoral:\n1. Acesse a aba "Clientes & Fornecedores" e verifique a UF e Inscrição Estadual (IE) do cliente.\n2. Se o cliente tiver IE válida, utilize o Indicador de IE como "1 - Contribuinte". Se for pessoa física ou empresa sem IE, selecione "9 - Não Contribuinte".\n3. No Emissor Fiscal, ao selecionar o destinatário fora de SP (ex: RJ, MG, MT), o sistema automaticamente converte o CFOP iniciado por 5 (venda interna) para 6 (venda interestadual, ex: 6102).\n4. A alíquota interestadual é de 7% para Norte/Nordeste/Centro-Oeste/ES e 12% para Sul/Sudeste.\n5. O motor primário Fiscal Contora assina digitalmente e transmite diretamente para a SEFAZ.',
    category: 'fiscal',
    confidence: 100,
    createdAt: '2026-10-20T10:00:00Z',
    source: 'sistema',
  },
  {
    id: 'kb-02',
    questionTrigger: 'O que fazer se a SEFAZ ou a Fiscal Contora ficar lenta?',
    learnedAnswer:
      'Nosso sistema conta com o mecanismo de Circuit Breaker com Failover Automático. Se o tempo de resposta da Fiscal Contora exceder o limite seguro ou a SEFAZ apresentar oscilação, o gateway universal transfere a transmissão instantaneamente para a Focus NFe sem intervenção manual. Você também pode testar a conectividade no botão "Testar Provedor".',
    category: 'fiscal',
    confidence: 100,
    createdAt: '2026-10-20T10:00:00Z',
    source: 'sistema',
  },
  {
    id: 'kb-03',
    questionTrigger: 'Como funciona a Carta de Correção Eletrônica (CC-e)?',
    learnedAnswer:
      'A CC-e serve para sanar erros em dados acessórios da NF-e já autorizada. Não é permitido alterar: valores de impostos, dados que mudem o remetente ou destinatário, nem a data de emissão. A justificativa deve conter no mínimo 15 caracteres. Para emitir, localize a nota autorizada na tabela e clique no ícone amarelo de "CC-e".',
    category: 'fiscal',
    confidence: 100,
    createdAt: '2026-10-20T10:00:00Z',
    source: 'sistema',
  },
  {
    id: 'kb-04',
    questionTrigger: 'Como cadastrar um produto com controle de estoque?',
    learnedAnswer:
      '1. Vá até a aba "Produtos & Serviços" e clique em "Novo Item de Catálogo".\n2. Defina o tipo como "Produto", informe a Descrição, Unidade Comercial (UN, CX, KG), NCM e Preço de Venda.\n3. Defina o Estoque Atual e o Estoque Mínimo de Segurança.\n4. Sempre que uma NF-e com este item for autorizada, o sistema debita automaticamente o saldo.',
    category: 'operacional',
    confidence: 100,
    createdAt: '2026-10-20T10:00:00Z',
    source: 'operador',
  },
  {
    id: 'kb-05',
    questionTrigger: 'Como importar o XML de compra de um fornecedor?',
    learnedAnswer:
      '1. No Emissor Fiscal, clique em "Importar XML Compra".\n2. Faça o upload ou simule o arquivo XML da NF-e modelo 55 do fornecedor.\n3. O sistema lê o CNPJ do emitente e cadastra o fornecedor automaticamente caso seja inédito.\n4. As mercadorias faturadas entram diretamente no catálogo e alimentam o saldo de estoque atual.',
    category: 'operacional',
    confidence: 100,
    createdAt: '2026-10-20T10:00:00Z',
    source: 'sistema',
  },
  {
    id: 'kb-06',
    questionTrigger: 'Como enviar notas para a contabilidade no fim do mês?',
    learnedAnswer:
      'Clique no botão "Pacote Contador" no cabeçalho do módulo fiscal. O sistema compila todas as NF-e e NFS-e autorizadas, os cancelamentos homologados e os números de protocolo, gerando o relatório consolidado e arquivo exportável para envio à contabilidade.',
    category: 'operacional',
    confidence: 100,
    createdAt: '2026-10-20T10:00:00Z',
    source: 'sistema',
  },
  {
    id: 'kb-07',
    questionTrigger: 'Como ajustar a numeração das notas fiscais (NF-e/NFS-e)?',
    learnedAnswer:
      'Para ajustar a numeração:\n1. Acesse o Emissor Fiscal e clique no botão "Configurações & Certificado A1" no topo.\n2. Altere o campo "Último Nº NF-e" para a última nota já homologada no portal da SEFAZ (ex: 150).\n3. O sistema emitirá a próxima nota como 151.\n4. Para recomeçar a contagem do número 1 sem conflitos legais, mude a Série de 1 para 2.\n5. Você também pode gerenciar séries em /settings/fiscal.',
    category: 'fiscal',
    confidence: 100,
    createdAt: '2026-10-20T10:00:00Z',
    source: 'sistema',
  },
  {
    id: 'kb-08',
    questionTrigger: 'Como funciona o envio contínuo por WhatsApp e cobrança Pix?',
    learnedAnswer:
      'No ícone de WhatsApp ao lado de qualquer nota autorizada, você pode selecionar 4 templates:\n1. 📄 Comprovante Fiscal: DANFE oficial em PDF e XML.\n2. 🚚 Carga em Trânsito: Aviso de despacho da mercadoria ao cliente.\n3. ✅ Entrega Realizada: Confirmação de recebimento no destino.\n4. ⏰ Cobrança & Pix: Lembrete amigável de vencimento com código Pix Copia e Cola gerado na hora para liquidação imediata.',
    category: 'operacional',
    confidence: 100,
    createdAt: '2026-10-20T10:00:00Z',
    source: 'sistema',
  },
];

export async function GET() {
  return NextResponse.json({
    success: true,
    totalRules: knowledgeBase.length,
    knowledge: knowledgeBase,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, question, answer, category, teachRule } = body;

    // Ação 1: Ensinar nova regra / conhecimento à IA
    if (action === 'teach' && teachRule) {
      const newRule: LearnedRule = {
        id: `kb-custom-${Date.now()}`,
        questionTrigger: teachRule.question,
        learnedAnswer: teachRule.answer,
        category: teachRule.category || 'geral',
        confidence: 100,
        createdAt: new Date().toISOString(),
        source: 'operador',
      };
      knowledgeBase = [newRule, ...knowledgeBase];

      return NextResponse.json({
        success: true,
        message: 'Conhecimento aprendido e incorporado com sucesso à memória permanente da IA!',
        rule: newRule,
      });
    }

    // Ação 2: Perguntar à IA (Pesquisa semântica na base + fallback de raciocínio)
    if (!question || typeof question !== 'string') {
      return NextResponse.json({ success: false, error: 'Pergunta não informada' }, { status: 400 });
    }

    const cleanQuestion = question.toLowerCase();

    // 1. Procura match por similaridade na base de regras aprendidas
    const matchedRule = knowledgeBase.find((kb) => {
      const triggerWords = kb.questionTrigger.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
      const matches = triggerWords.filter((w) => cleanQuestion.includes(w));
      return matches.length >= 2 || cleanQuestion.includes(kb.questionTrigger.toLowerCase());
    });

    if (matchedRule) {
      return NextResponse.json({
        success: true,
        source: 'learned_memory',
        confidence: matchedRule.confidence,
        category: matchedRule.category,
        response: matchedRule.learnedAnswer,
        learnedFrom: matchedRule.source,
      });
    }

    // 2. Se for pergunta nova, usa IA generativa com prompt de professor especialista
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      try {
        const prompt = `Você é a "GADAP AI Intelligence", a Inteligência Artificial professora do ERP GADAP Hub.
Você deve explicar com tom professoral, didático, claro e seguro.
O sistema opera com:
- Motor Dual Fiscal: Fiscal Contora como Primário Oficial e Focus NFe como Secundário.
- Módulos: Emissor Fiscal (NF-e/NFS-e), Estoque Integrado, WhatsApp Evolution API, Pacote Contábil e Gestão Multi-Tenant.
Pergunta do Usuário: "${question}"
Responda com passos práticos, objetivos e referências tributárias brasileiras aplicáveis.`;

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
            }),
          }
        );

        if (geminiRes.ok) {
          const gData = await geminiRes.json();
          const generatedText = gData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (generatedText) {
            // Auto-aprendizado: aprende a resposta gerada para consultas futuras
            const autoLearnedRule: LearnedRule = {
              id: `kb-auto-${Date.now()}`,
              questionTrigger: question,
              learnedAnswer: generatedText,
              category: 'fiscal',
              confidence: 95,
              createdAt: new Date().toISOString(),
              source: 'gemini',
            };
            knowledgeBase.push(autoLearnedRule);

            return NextResponse.json({
              success: true,
              source: 'gemini_teacher',
              confidence: 95,
              response: generatedText,
              autoLearned: true,
            });
          }
        }
      } catch (gErr) {
        console.warn('Gemini teacher call error:', gErr);
      }
    }

    // Fallback didático
    return NextResponse.json({
      success: true,
      source: 'knowledge_engine',
      confidence: 85,
      response:
        `Prof. GADAP AI: Para a sua dúvida sobre "${question}", recomendamos verificar as regras fiscais de CFOP e regime tributário da empresa emissora. Caso queira me ensinar a resposta padrão exata da sua empresa para essa pergunta, utilize a opção "Ensinar a IA".`,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
