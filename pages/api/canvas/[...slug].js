import { minLimit } from '../../../lib/apikeys.js';
import ttp from '../../../lib/ttp.js';

export default async function handler(req, res) {
  const { slug = [] } = req.query;
  const { name, id, status, limit, role, money, level, level_cache, text, text2, pp, filename, apikey } = req.query;

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-apikey");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ status: 405, author: "Yudzxml", error: "Method Not Allowed" });

  const sendError = (status, error) => res.status(status).json({ status, author: "Yudzxml", error });
  const fetchImageBuffer = async (url) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const buffer = await response.arrayBuffer();
    return Buffer.from(buffer);
  };

  try {
    switch (slug[0]) {
      case "ttp": {
        if (!apikey) return sendError(400, "Invalid or missing parameter apikey");
        try { await minLimit(apikey); } catch (err) { return sendError(403, err.message || "API key invalid or expired"); }
        if (!text) return sendError(400, "Parameter 'text' wajib untuk ttp");
        try {
          const ttpResult = await ttp(text);
          if (!ttpResult?.length) return sendError(500, "Failed to generate TTP image");
          return res.status(200).json({ status: 200, author: "Yudzxml", data: ttpResult[0].url });
        } catch (err) {
          return sendError(500, err.message);
        }
      }

      case "profil": {
        if (!pp) return sendError(400, "Parameter pp wajib diisi untuk profil");
        const data = { nama: name, id, status, limit, role, money, level, level_cache };
        const queryParams = new URLSearchParams({ ...data, profilePicUrl: pp }).toString();
        const url = `http://212.132.120.102:13217/profile?${queryParams}`;
        try {
          const imageBuffer = await fetchImageBuffer(url);
          res.setHeader("Content-Type", "image/png");
          return res.send(imageBuffer);
        } catch (err) {
          return sendError(500, err.message);
        }
      }

      case "smeme": {
        if (!apikey) return sendError(400, "Invalid or missing parameter apikey");
        try { await minLimit(apikey); } catch (err) { return sendError(403, err.message || "API key invalid or expired"); }
        if (!pp) return sendError(400, "Parameter pp wajib untuk smeme");
        if (!text && !text2) return sendError(400, "Minimal salah satu parameter 'text' atau 'text2' harus diisi");
        const params = new URLSearchParams({ pp });
        if (text) params.append("text", text);
        if (text2) params.append("text2", text2);
        try {
          const response = await fetch(`http://212.132.120.102:13217/smeme?${params.toString()}`);
          const resultJson = await response.json();
          return res.status(200).json({ status: 200, author: "Yudzxml", data: resultJson.url });
        } catch (err) {
          return sendError(500, err.message);
        }
      }

      case "welcome": {
        if (!pp) return sendError(400, "Parameter pp wajib untuk welcome");
        if (!filename || !["welcome1.png", "welcome2.png"].includes(filename)) return sendError(400, "Parameter filename wajib dan hanya boleh 'welcome1.png' atau 'welcome2.png'");
        if (!name) return sendError(400, "Parameter name wajib untuk welcome");
        const url = `http://212.132.120.102:13217/welcome?name=${encodeURIComponent(name)}&pp=${encodeURIComponent(pp)}&iwelcome=${encodeURIComponent(filename)}`;
        try {
          const imageBuffer = await fetchImageBuffer(url);
          res.setHeader("Content-Type", "image/png");
          return res.send(imageBuffer);
        } catch (err) {
          return sendError(500, `Gagal memanggil API welcome: ${err.message}`);
        }
      }

      default:
        return sendError(400, "Endpoint tidak ditemukan");
    }
  } catch (err) {
    return sendError(500, err.message || "Terjadi kesalahan server");
  }
}