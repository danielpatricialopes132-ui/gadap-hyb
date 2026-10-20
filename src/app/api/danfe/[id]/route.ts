import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const searchParams = request.nextUrl.searchParams;
  const docType = searchParams.get('type') || 'NFe';
  const number = searchParams.get('num') || id.slice(-4) || '1043';
  const series = searchParams.get('series') || '1';
  const entity = searchParams.get('entity') || 'SUPERMERCADOS ALVORADA DE ALIMENTOS LTDA';
  const total = searchParams.get('total') || '1.700,00';
  const key = searchParams.get('key') || id;

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>DANFE - Documento Auxiliar da Nota Fiscal Eletrônica - Nº ${number}</title>
  <style>
    @page { size: A4; margin: 8mm; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 10px;
      color: #000;
      background: #fff;
      margin: 0;
      padding: 10px;
    }
    .border { border: 1px solid #000; }
    .border-b { border-bottom: 1px solid #000; }
    .border-r { border-right: 1px solid #000; }
    .table { width: 100%; border-collapse: collapse; }
    .table td, .table th { border: 1px solid #000; padding: 3px 5px; vertical-align: top; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .bold { font-weight: bold; }
    .title { font-size: 13px; font-weight: bold; }
    .subtitle { font-size: 8px; text-transform: uppercase; color: #333; margin-bottom: 2px; }
    .barcode-box {
      background: #eee;
      border: 1px dashed #666;
      height: 38px;
      line-height: 38px;
      letter-spacing: 5px;
      font-family: monospace;
      font-size: 13px;
      text-align: center;
      margin-bottom: 4px;
    }
    .print-btn {
      position: fixed;
      top: 15px;
      right: 15px;
      background: #4f46e5;
      color: #fff;
      border: none;
      padding: 10px 18px;
      font-weight: bold;
      border-radius: 8px;
      cursor: pointer;
      font-size: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }
    .print-btn:hover { background: #4338ca; }
    @media print {
      .print-btn { display: none; }
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">🖨️ Imprimir DANFE / Salvar PDF</button>

  <table class="table" style="margin-bottom: 5px;">
    <tr>
      <td style="width: 45%;">
        <div class="bold title">GADAP HUB SISTEMAS & LOGÍSTICA S.A.</div>
        <div style="font-size: 9px; margin-top: 3px;">
          Av. Paulista, 1000 - Bela Vista - São Paulo / SP<br>
          CEP: 01310-100 - Tel: (11) 3322-4455<br>
          CNPJ: 45.182.903/0001-44 &nbsp;&nbsp; IE: 110.223.445.119
        </div>
      </td>
      <td style="width: 20%;" class="text-center">
        <div class="bold" style="font-size: 14px;">DANFE</div>
        <div style="font-size: 8px;">Documento Auxiliar da<br>Nota Fiscal Eletrônica</div>
        <div style="margin-top: 4px; font-size: 9px;">
          0 - Entrada<br>
          <b>1 - Saída: [ 1 ]</b>
        </div>
        <div class="bold" style="font-size: 11px; margin-top: 4px;">Nº ${number}</div>
        <div style="font-size: 9px;">SÉRIE ${series}</div>
      </td>
      <td style="width: 35%;">
        <div class="subtitle">CHAVE DE ACESSO DA NF-E</div>
        <div class="barcode-box">|||| | ||||| |||| ||||| |||| ||||| ||||</div>
        <div style="font-family: monospace; font-size: 9px; text-align: center; word-break: break-all;">
          ${key}
        </div>
        <div style="font-size: 8px; text-align: center; margin-top: 4px;">
          Consulta de autenticidade no portal nacional da NF-e<br>www.nfe.fazenda.gov.br/portal ou no site da Sefaz Autorizadora
        </div>
      </td>
    </tr>
  </table>

  <table class="table" style="margin-bottom: 5px;">
    <tr>
      <td style="width: 50%;">
        <div class="subtitle">NATUREZA DA OPERAÇÃO</div>
        <div class="bold">VENDA DE MERCADORIAS DENTRO DO ESTADO</div>
      </td>
      <td style="width: 50%;">
        <div class="subtitle">PROTOCOLO DE AUTORIZAÇÃO DE USO</div>
        <div class="bold">135260089201940 - 20/10/2026 12:00:00 (SEFAZ-SP)</div>
      </td>
    </tr>
  </table>

  <div class="bold" style="font-size: 9px; background: #eee; padding: 2px 5px; border: 1px solid #000; border-bottom: none;">
    DESTINATÁRIO / REMETENTE
  </div>
  <table class="table" style="margin-bottom: 5px;">
    <tr>
      <td style="width: 60%;">
        <div class="subtitle">NOME / RAZÃO SOCIAL</div>
        <div class="bold">${entity}</div>
      </td>
      <td style="width: 25%;">
        <div class="subtitle">CNPJ / CPF</div>
        <div class="bold">12.345.678/0001-95</div>
      </td>
      <td style="width: 15%;">
        <div class="subtitle">DATA DA EMISSÃO</div>
        <div>20/10/2026</div>
      </td>
    </tr>
    <tr>
      <td>
        <div class="subtitle">ENDEREÇO</div>
        <div>RUA DAS FLORES, 1500 - DISTRITO INDUSTRIAL</div>
      </td>
      <td>
        <div class="subtitle">MUNICÍPIO / UF</div>
        <div>CAMPINAS / SP</div>
      </td>
      <td>
        <div class="subtitle">DATA SAÍDA/ENTRADA</div>
        <div>20/10/2026</div>
      </td>
    </tr>
  </table>

  <div class="bold" style="font-size: 9px; background: #eee; padding: 2px 5px; border: 1px solid #000; border-bottom: none;">
    CÁLCULO DO IMPOSTO
  </div>
  <table class="table text-right" style="margin-bottom: 5px;">
    <tr>
      <td><div class="subtitle text-center">BASE DE CÁLCULO DO ICMS</div>R$ ${total}</td>
      <td><div class="subtitle text-center">VALOR DO ICMS</div>R$ 306,00</td>
      <td><div class="subtitle text-center">BASE CÁLCULO ICMS S.T.</div>R$ 0,00</td>
      <td><div class="subtitle text-center">VALOR DO ICMS S.T.</div>R$ 0,00</td>
      <td><div class="subtitle text-center">VALOR TOTAL DOS PRODUTOS</div><b>R$ ${total}</b></td>
    </tr>
    <tr>
      <td><div class="subtitle text-center">VALOR DO FRETE</div>R$ 0,00</td>
      <td><div class="subtitle text-center">VALOR DO SEGURO</div>R$ 0,00</td>
      <td><div class="subtitle text-center">DESCONTO</div>R$ 0,00</td>
      <td><div class="subtitle text-center">OUTRAS DESPESAS</div>R$ 0,00</td>
      <td><div class="subtitle text-center">VALOR TOTAL DA NOTA</div><b style="font-size: 12px;">R$ ${total}</b></td>
    </tr>
  </table>

  <div class="bold" style="font-size: 9px; background: #eee; padding: 2px 5px; border: 1px solid #000; border-bottom: none;">
    DADOS DOS PRODUTOS / SERVIÇOS
  </div>
  <table class="table" style="margin-bottom: 5px;">
    <thead>
      <tr style="background: #f4f4f4;">
        <th style="width: 10%;">CÓDIGO</th>
        <th style="width: 40%;">DESCRIÇÃO DO PRODUTO / SERVIÇO</th>
        <th style="width: 8%;">NCM</th>
        <th style="width: 6%;">CFOP</th>
        <th style="width: 6%;">UN</th>
        <th style="width: 8%;" class="text-right">QTD</th>
        <th style="width: 11%;" class="text-right">V. UNIT</th>
        <th style="width: 11%;" class="text-right">V. TOTAL</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>ITM-4415</td>
        <td>PALETE DE MADEIRA PADRÃO PBR 1,00 X 1,20M TRATADO</td>
        <td>4415.20.00</td>
        <td>5102</td>
        <td>UN</td>
        <td class="text-right">20</td>
        <td class="text-right">85,00</td>
        <td class="text-right bold">1.700,00</td>
      </tr>
    </tbody>
  </table>

  <div class="bold" style="font-size: 9px; background: #eee; padding: 2px 5px; border: 1px solid #000; border-bottom: none;">
    DADOS ADICIONAIS
  </div>
  <table class="table">
    <tr>
      <td style="height: 60px;">
        <div class="subtitle">INFORMAÇÕES COMPLEMENTARES</div>
        <div>
          Documento emitido por ME ou EPP optante pelo Simples Nacional.<br>
          Não gera direito a crédito fiscal de IPI.<br>
          Trib aprox R$ 228,65 Federal e R$ 204,00 Estadual (Fonte: IBPT).<br>
          Emissão realizada via GADAP Hub conectado ao Focus NFe.
        </div>
      </td>
      <td style="width: 30%;">
        <div class="subtitle">RESERVADO AO FISCO</div>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}
