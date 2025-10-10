import { minLimit } from '../../../lib/apikeys.js';
import genshinstalk from "../../../lib/genshinstalk.js";
import igstalk from "../../../lib/igstalk.js";
import ttstalk from "../../../lib/ttstalk.js";
import twitterstalk from "../../../lib/twitstalk.js";
import pinterest from "../../../lib/pinterest.js";
import githubstalk from "../../../lib/githubstalk.js";
import minecraft from "../../../lib/minecraft.js";

export default async function handler(req, res) {
  const { slug = [] } = req.query;
  const { username, id, server, apikey } = req.query;

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method Not Allowed" });

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
      case "mlbb": {
        if (!id && !server) {
          return res.status(400).json({
            status: 400,
            author: "Yudzxml",
            error: "Parameter id & server wajib untuk mlbb",
          });
        }
        result = await mlbb(id, server);
        break;
      }
      case "minecraft": {
        if (!username) {
          return res.status(400).json({
            status: 400,
            author: "Yudzxml",
            error: "Parameter username wajib untuk minecraft",
          });
        }
        result = await minecraft(username);
        break;
      }      
      case "roblox": {
  if (!username) {
    return res.status(400).json({
      status: 400,
      author: "Yudzxml",
      error: "Parameter username wajib untuk robloxstalk",
    });
  }

  try {
    const response = await fetch(`https://api.siputzx.my.id/api/stalk/roblox?user=${username}`);
    const result = await response.json();

    return res.json({
      status: 200,
      author: "Yudzxml",
      data: result.data,
    });
  } catch (err) {
    return res.status(500).json({
      status: 500,
      author: "Yudzxml",
      error: err?.message || err,
    });
  }
}
      case "github": {
  if (!username) {
    return res.status(400).json({
      status: 400,
      author: "Yudzxml",
      error: "Parameter username wajib untuk githubstalk",
    });
  }
  try {
    const result = await githubstalk(username);
    return res.json({
      status: 200,
      author: "Yudzxml",
      data: result
    });
  } catch (err) {
    return res.status(500).json({
      status: 500,
      author: "Yudzxml",
      error: err?.message || err,
    });
  }
  break;
}
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