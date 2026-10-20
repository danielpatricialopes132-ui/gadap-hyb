import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const cnpj = (searchParams.get('cnpj') || '').replace(/\D/g, '');

  if (!cnpj || cnpj.length !== 14) {
    return NextResponse.json({ error: 'CNPJ inválido. Forneça 14 dígitos numéricos.' }, { status: 400 });
  }

  try {
    const res = await fetch(`https://receitaws.com.br/v1/cnpj/${cnpj}`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 86400 }, // Cache por 24 horas
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Receita Federal retornou status ${res.status}` }, { status: res.status });
    }

    const data = await res.json();

    if (data.status === 'ERROR') {
      return NextResponse.json({ error: data.message || 'CNPJ não encontrado na base da Receita Federal.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      cnpj: data.cnpj,
      razaoSocial: data.nome,
      nomeFantasia: data.fantasia || data.nome,
      situacao: data.situacao,
      abertura: data.abertura,
      naturezaJuridica: data.natureza_juridica,
      email: data.email || '',
      telefone: data.telefone ? data.telefone.split('/')[0].trim() : '',
      endereco: {
        cep: (data.cep || '').replace(/\D/g, ''),
        logradouro: data.logradouro || '',
        numero: data.numero || '',
        complemento: data.complemento || '',
        bairro: data.bairro || '',
        municipio: data.municipio || '',
        uf: data.uf || 'SP',
      },
      cnaePrincipal: data.atividade_principal?.[0]?.text || '',
    });
  } catch (err: any) {
    console.error('ReceitaWS API error:', err);
    return NextResponse.json({ error: err.message || 'Erro ao conectar à Receita Federal.' }, { status: 500 });
  }
}
