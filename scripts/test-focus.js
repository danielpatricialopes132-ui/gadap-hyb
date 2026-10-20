import dotenv from 'dotenv';
dotenv.config();

const token = process.env.FOCUS_NFE_TOKEN;
const env = process.env.FOCUS_NFE_ENVIRONMENT || 'homologacao';

async function testFocusNFe() {
  console.log(`Testing Focus NFe token in [${env.toUpperCase()}]:`, token ? `${token.slice(0, 6)}...` : 'MISSING');
  
  const baseUrl = env === 'producao' ? 'https://api.focusnfe.com.br/v2' : 'https://homologacao.focusnfe.com.br/v2';
  const url = `${baseUrl}/empresas`;
  
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
