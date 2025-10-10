import { minLimit } from '../../../lib/apikeys.js';
import textToSpeech from '../../../lib/texttospeech.js';

// Helper universal fetch JSON
async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch gagal: ${res.status}`);
  return res.json();
}

async function cekkodam(name) {
  const s = await (await fetch(`https://raw.githubusercontent.com/Yudzxml/WebClientV1/refs/heads/main/game/kodam.json`)).json();
  const data = s[Math.floor(Math.random() * s.length)];;
  const prompt = `Nama: ${name}, Kodam: ${data}`;
  const yuda = await textToSpeech(prompt);
  return {
    nama: name,
    kodam: data,
    url: yuda,
  };
}

async function tebakheroml() {
  const anu = await fetchJson(
    `https://raw.githubusercontent.com/Yudzxml/WebClientV1/refs/heads/main/game/tebakheroml.json`
  );
  return anu[Math.floor(Math.random() * anu.length)];
}

async function tebakepep() {
  const anu = await fetchJson(
    `https://raw.githubusercontent.com/Yudzxml/WebClientV1/refs/heads/main/game/tebakepep.json`
  );
  return anu[Math.floor(Math.random() * anu.length)];
}

async function math() {
  const anu = await fetchJson(
    `https://raw.githubusercontent.com/Yudzxml/WebClientV1/refs/heads/main/game/math.json`
  );
  return anu[Math.floor(Math.random() * anu.length)];
}

async function tebakmakanan() {
  const anu = await fetchJson(
    `https://raw.githubusercontent.com/Yudzxml/WebClientV1/refs/heads/main/game/tebakmakanan.json`
  );
  return anu[Math.floor(Math.random() * anu.length)];
}

// Generalized
async function getRandomFromJson(url) {
  const data = await fetchJson(url);
  return data[Math.floor(Math.random() * data.length)];
}

export default async function handler(req, res) {
  const { slug = [] } = req.query;
  const { nama, apikey } = req.query;

  // --- CORS ---
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-apikey');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET')
    return res.status(405).json({
      status: 405,
      author: 'Yudzxml',
      error: 'Method Not Allowed',
    });

    if (!apikey) {
      return res.status(400).json({ status: 400, author: "Yudzxml", error: "invalid or missing parameter apikey" });
    }
    let limitData;
  try {
    limitData = await minLimit(apikey);
  } catch (err) {
    console.error("minLimit error:", err);
    return res.status(403).json({ status: 403, author: "Yudzxml", error: err.message || "API key invalid or expired" });
  }

    let result;
    try {
    switch (slug[0]) {
      case 'cekkodam':
        if (!nama)
          return res.status(400).json({
            status: 400,
            author: 'Yudzxml',
            error: 'Parameter nama wajib untuk cekkodam',
          });
        result = await cekkodam(nama);
        break;

      case 'tebakheroml':
        result = await tebakheroml();
        break;

      case 'tebakepep':
        result = await tebakepep();
        break;

      case 'math':
        result = await math();
        break;

      case 'tebakmakanan':
        result = await tebakmakanan();
        break;

      case 'tebakemoji':
        result = await getRandomFromJson(
          'https://raw.githubusercontent.com/Yudzxml/WebClientV1/refs/heads/main/game/tebakemoji.json'
        );
        break;

      case 'tebakkode': // ✅ konsisten dengan nama file
        result = await getRandomFromJson(
          'https://raw.githubusercontent.com/Yudzxml/WebClientV1/refs/heads/main/game/tebakkode.json'
        );
        break;

      case 'tebaktempat':
        result = await getRandomFromJson(
          'https://raw.githubusercontent.com/Yudzxml/WebClientV1/refs/heads/main/game/tebaktempat.json'
        );
        break;

      case 'tebakgambar':
        result = await getRandomFromJson(
          'https://raw.githubusercontent.com/BochilTeam/database/master/games/tebakgambar.json'
        );
        break;

      case 'tebaklirik':
        result = await getRandomFromJson(
          'https://raw.githubusercontent.com/BochilTeam/database/master/games/tebaklirik.json'
        );
        break;

      case 'tebakbendera':
        result = await getRandomFromJson(
          'https://raw.githubusercontent.com/BochilTeam/database/master/games/tebakbendera.json'
        );
        break;

      case 'tebaktebakan':
        result = await getRandomFromJson(
          'https://raw.githubusercontent.com/BochilTeam/database/master/games/tebaktebakan.json'
        );
        break;

      case 'tekateki':
        result = await getRandomFromJson(
          'https://raw.githubusercontent.com/BochilTeam/database/master/games/tekateki.json'
        );
        break;

      case 'asahotak': // ✅ ganti duplikat tekateki
        result = await getRandomFromJson(
          'https://raw.githubusercontent.com/BochilTeam/database/master/games/asahotak.json'
        );
        break;

      case 'caklontong':
        result = await getRandomFromJson(
          'https://raw.githubusercontent.com/BochilTeam/database/master/games/caklontong.json'
        );
        break;

      case 'susunkata':
        result = await getRandomFromJson(
          'https://raw.githubusercontent.com/BochilTeam/database/master/games/susunkata.json'
        );
        break;

      case 'siapakahaku':
        result = await getRandomFromJson(
          'https://raw.githubusercontent.com/BochilTeam/database/master/games/siapakahaku.json'
        );
        break;

      case 'tebakkalimat':
        result = await getRandomFromJson(
          'https://raw.githubusercontent.com/BochilTeam/database/master/games/tebakkalimat.json'
        );
        break;

      case 'family100':
        result = await getRandomFromJson(
          'https://raw.githubusercontent.com/BochilTeam/database/master/games/family100.json'
        );
        break;

      case 'tebakhewan':
        result = await getRandomFromJson(
          'https://raw.githubusercontent.com/Yudzxml/WebClientV1/refs/heads/main/game/tebakhewannyeleneh.json'
        );
        break;

      default:
        return res.status(400).json({
          status: 400,
          author: 'Yudzxml',
          error: 'Endpoint tidak ditemukan',
        });
    }

    return res.status(200).json({
      status: 200,
      author: 'Yudzxml',
      data: result,
    });
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({
      status: 500,
      author: 'Yudzxml',
      error: err.message || 'Terjadi kesalahan server',
    });
  }
}
