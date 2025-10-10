import jadwalshalat from "../../../lib/jadwalshalat.js";
import surah from "../../../lib/surah.js";
import { minLimit } from '../../../lib/apikeys.js';
import cariDoa from '../../../lib/doa.js';

export default async function handler(req, res) {
  const { slug = [] } = req.query;
  const { kota, q, apikey } = req.query;

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-apikey");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ status: 405, author: "Yudzxml", error: "Method Not Allowed" });

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
      case "doa": {
        if (!q) return res.status(400).json({ status: 400, author: "Yudzxml", error: "Parameter q wajib untuk doa" });
        result = await cariDoa(q);
        break;
      }      
      case "jadwalshalat": {
        if (!kota) return res.status(400).json({ status: 400, author: "Yudzxml", error: "Parameter kota wajib untuk jadwalshalat" });
        result = await jadwalshalat(kota);
        break;
      }
      case "surah": {
        if (!q) return res.status(400).json({ status: 400, author: "Yudzxml", error: "Parameter q wajib untuk surah" });
        result = await surah(q);
        break;
      }
      default:
        return res.status(400).json({ status: 400, author: "Yudzxml", error: "Endpoint tidak ditemukan" });
    }

    return res.status(200).json({ status: 200, author: "Yudzxml", data: result });

  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ status: 500, author: "Yudzxml", error: err.message || "Terjadi kesalahan server" });
  }
}