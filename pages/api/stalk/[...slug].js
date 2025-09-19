import { getApiKey } from '../../../lib/apikeys.js';
import genshinstalk from "../../../lib/genshinstalk.js";
import igstalk from "../../../lib/igstalk.js";
import ttstalk from "../../../lib/ttstalk.js";
import twitterstalk from "../../../lib/twitstalk.js";
import pinterest from "../../../lib/pinterest.js";

export default async function handler(req, res) {
  const { slug = [] } = req.query;
  const { username, id, apikey } = req.query;

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method Not Allowed" });

  let result;
  try {
        if (!apikey) {
  return res.status(400).json({
    status: 400,
    author: "Yudzxml",
    error: "invalid or missing parameter apikey"
  });
}

const ipRaw = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || '0.0.0.0';
const ip = (ipRaw === '::1') ? '127.0.0.1' : ipRaw;

let keyData;
try {
  keyData = await getApiKey(apikey, ip);
} catch (err) {
  console.error("getApiKey error:", err);
  return res.status(500).json({
    status: 500,
    author: "Yudzxml",
    error: "internal Server error"
  });
}

if (!keyData || keyData.status !== 200) {
  return res.status(keyData?.status || 403).json({
    status: keyData?.status || 403,
    author: "Yudzxml",
    error: keyData?.message || "API key invalid or expired"
  });
}
    
    switch (slug[0]) {
      case "genshin": {
        if (!id) {
          return res.status(400).json({
            status: 400,
            author: "Yudzxml",
            error: "Parameter id wajib untuk genshinstalk",
          });
        }
        result = await genshinstalk(id);
        break;
      }
      case "instagram": {
        if (!username) {
          return res.status(400).json({
            status: 400,
            author: "Yudzxml",
            error: "Parameter username wajib untuk igstalk",
          });
        }
        result = await igstalk(username);
        break;
      }
      case "tiktok": {
        if (!username) {
          return res.status(400).json({
            status: 400,
            author: "Yudzxml",
            error: "Parameter username wajib untuk ttstalk",
          });
        }
        result = await ttstalk(username);
        break;
      }   
      case "twitter": {
        if (!username) {
          return res.status(400).json({
            status: 400,
            author: "Yudzxml",
            error: "Parameter username wajib untuk twitterstalk",
          });
        }
        result = await twitterstalk(username);
        break;
      }    
      case "pinterest": {
        if (!username) {
          return res.status(400).json({
            status: 400,
            author: "Yudzxml",
            error: "Parameter username wajib untuk pinstalk",
          });
        }
        result = await pinterest.profile(username);
        break;
      }      
      default:
        return res.status(400).json({
          status: 400,
          author: "Yudzxml",
          error: "Endpoint tidak ditemukan",
        });
    }
  } catch (err) {
    return res.status(500).json({
      status: 500,
      author: "Yudzxml",
      error: err.message || "Terjadi kesalahan",
    });
  }

  return res.status(200).json({
    status: 200,
    author: "Yudzxml",
    data: result,
  });
}