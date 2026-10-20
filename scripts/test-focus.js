import dotenv from 'dotenv';
dotenv.config();

const token = process.env.FOCUS_NFE_TOKEN;

async function testFocusNFe() {
  console.log('Testing Focus NFe token:', token ? `${token.slice(0, 6)}...` : 'MISSING');
  
  // Endpoint de empresas cadastradas no ambiente de produção
  const url = 'https://api.focusnfe.com.br/v2/empresas';
  
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${Buffer.from(`${token}:`).toString('base64')}`,
      },
    });

    console.log('HTTP Status:', res.status, res.statusText);
    const data = await res.json();
    console.log('Focus NFe Response:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Focus NFe fetch error:', err);
  }
}

testFocusNFe();
