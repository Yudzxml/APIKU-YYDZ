import { getApiKey } from '../../../lib/apikeys.js';
import aptoide from "../../../lib/aptoide.js";
import pinterest from "../../../lib/pinterest.js";
import soundcloud from "../../../lib/soundcloud.js";
import tiktok from "../../../lib/tiktok.js";
import Komiku from "../../../lib/komiku.js";
import nekopoi from "../../../lib/nekopoi.js";
import xvideos from "../../../lib/xvideos.js";
import chord from "../../../lib/chord.js";
import google from "../../../lib/google.js";
import spotify from "../../../lib/spotify.js";
import samehadaku from "../../../lib/samehadaku.js";
import xnxx from "../../../lib/xnxx.js";
import get2FAToken from "../../../lib/2fa.js";
import anichin from "../../../lib/anichin.js";
import android1 from "../../../lib/an1.js";

export default async function handler(req, res) {
  const { slug = [] } = req.query;
  const { q, page = 1, genre, url, tipe = "manga", action, apikey } = req.query;

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
      case "an1": {
     if (!url && !q) {
      return res.status(400).json({
      status: 400,
      author: "Yudzxml",
      error: "Parameter q atau url wajib untuk android1",
    });
  }

  if (url) {
    result = await android1.detail(url);
  } else if (q) {
    result = await android1.search(q);
  }

  break;
}
      case "aptoide": {
        if (!q) {
          return res.status(400).json({
            status: 400,
            author: "Yudzxml",
            error: "Parameter q wajib untuk aptoide",
          });
        }
        result = await aptoide.search(q);
        break;
      }
      case "xnxx": {
        if (!q) {
          return res.status(400).json({
            status: 400,
            author: "Yudzxml",
            error: "Parameter q wajib untuk xnxx",
          });
        }
        result = await xnxx.search(q);
        break;
      }
      case "pinterest": {
        if (!q) {
          return res.status(400).json({
            status: 400,
            author: "Yudzxml",
            error: "Parameter q wajib untuk pinterest",
          });
        }
        result = await pinterest.search(q);
        break;
      }
      case "2fa": {
        if (!q) {
          return res.status(400).json({
            status: 400,
            author: "Yudzxml",
            error: "Parameter q wajib untuk 2fa",
          });
        }
        result = await get2FAToken(q);
        break;
      }
      case "soundcloud": {
        if (!q) {
          return res.status(400).json({
            status: 400,
            author: "Yudzxml",
            error: "Parameter q wajib untuk soundcloud",
          });
        }
        result = await soundcloud("search", q);
        break;
      }
      case "tiktok": {
        if (!q) {
          return res.status(400).json({
            status: 400,
            author: "Yudzxml",
            error: "Parameter q wajib untuk tiktok",
          });
        }
        result = await tiktok(q);
        break;
      }
      case "youtube": {
      if (!q) {
        return res.status(400).json({
      status: 400,
      author: "Yudzxml",
      error: "Parameter q wajib untuk youtube",
       });
     }
     const api = await (await fetch(`https://api-yudzxml.koyeb.app/api/ytsearch?query=${encodeURIComponent(q)}`)).json();
      return res.status(api.status).json(api);
       break;
     }
      case "komiku": {
  try {
    const pageNum = parseInt(page) || 1;
    const type = tipe || "manga";

    switch (action) {
      case "search":
        if (!q) return res.status(400).json({ status: 400, author: "Yudzxml", error: "Parameter q wajib untuk search komiku" });
        result = await Komiku.search(q);
        break;

      case "latest":
        result = await Komiku.latest();
        break;

      case "populer":
        result = await Komiku.populer(pageNum);
        break;

      case "detail":
        if (!url) return res.status(400).json({ status: 400, author: "Yudzxml", error: "Parameter url wajib untuk detail Komiku" });
        result = await Komiku.detail(url);
        break;

      case "chapter":
        if (!url) return res.status(400).json({ status: 400, author: "Yudzxml", error: "Parameter url wajib untuk chapter Komiku" });
        result = await Komiku.chapter(url);
        break;

      case "genre":
        if (!genre) return res.status(400).json({ status: 400, author: "Yudzxml", error: "Parameter genre wajib untuk searchByGenre" });
        result = await Komiku.searchByGenre(genre, pageNum);
        break;

      case "listkomik":
        result = await Komiku.getKomikuList(type, pageNum);
        break;

      case "daftarList":
        result = await Komiku.daftarList(type);
        break;

      case "topkomik":
        result = await Komiku.topRank();
        break;

      case "rekomendasi":
        result = await Komiku.rekomendasi();
        break;

      default:
        return res.status(400).json({ status: 400, author: "Yudzxml", error: "Action komiku tidak valid" });
    }

    const enhancedResult = Array.isArray(result)
      ? result.map(item => ({ ...item, url: item.url || item.link || null }))
      : result;

    return res.status(200).json({
      status: 200,
      author: "Yudzxml",
      data: enhancedResult,
    });

  } catch (err) {
    return res.status(500).json({ status: 500, author: "Yudzxml", error: err.message || err });
  }
  break;
}
      case "anichin": {
  try {
    const pageNum = parseInt(page) || 1;
    const type = tipe || "anime";

    let result;

    switch (action) {
      case "rekomendasi":
        result = await anichin.rekomendasi();
        break;

      case "popular":
        result = await anichin.popularToday();
        break;

      case "search":
        if (!q) return res.status(400).json({ status: 400, author: "Yudzxml", error: "Parameter q wajib untuk search" });
        result = await anichin.search(q);
        break;

      case "latest":
        result = await anichin.latestRelease();
        break;

      case "detail":
        if (!url) return res.status(400).json({ status: 400, author: "Yudzxml", error: "Parameter url wajib untuk detail" });
        result = await anichin.detail(url);
        break;

      case "genres":
        if (!genre) return res.status(400).json({ status: 400, author: "Yudzxml", error: "Parameter genre wajib" });
        result = await anichin.genres(genre, pageNum);
        break;

      case "populerdonghua":
        result = await anichin.populerDonghua();
        break;

      case "info":
        if (!url) return res.status(400).json({ status: 400, author: "Yudzxml", error: "Parameter url wajib untuk info" });
        result = await anichin.info(url);
        break;

      default:
        return res.status(400).json({ status: 400, author: "Yudzxml", error: "Action Anichin tidak valid" });
    }

    const enhancedResult = Array.isArray(result)
      ? result.map(item => ({ ...item, url: item.url || item.link || null }))
      : result;

    return res.status(200).json({
      status: 200,
      author: "Yudzxml",
      data: enhancedResult,
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
      case "samehadaku": {
  try {
    const pageNum = parseInt(page) || 1;
    const contentType = tipe || "manga";

    if (!action) {
      return res.status(400).json({ status: 400, author: "Yudzxml", error: "Action wajib diisi" });
    }

    let result;

    switch (action) {
      case "search":
        if (!q) {
          return res.status(400).json({ status: 400, author: "Yudzxml", error: "Parameter q wajib untuk search" });
        }
        result = await samehadaku.search(pageNum, q);
        break;

      case "latest":
        result = await samehadaku.latest(pageNum);
        break;

      case "jadwalupdate":
        result = await samehadaku.jadwalUpdate();
        break;

      case "detail":
        if (!url) {
          return res.status(400).json({ status: 400, author: "Yudzxml", error: "Parameter url wajib untuk detail" });
        }
        result = await samehadaku.detail(url);
        break;

      case "genre":
        if (!genre) {
          return res.status(400).json({ status: 400, author: "Yudzxml", error: "Parameter genre wajib untuk search genre" });
        }
        result = await samehadaku.genre(genre, pageNum);
        break;

      case "topanime":
        result = await Komiku.getTopAnime();
        break;

      case "getstream":
        if (!url) {
          return res.status(400).json({ status: 400, author: "Yudzxml", error: "Parameter url wajib untuk getstream" });
        }
        result = await samehadaku.getLinkVideo(url);
        break;

      default:
        return res.status(400).json({ status: 400, author: "Yudzxml", error: "Action tidak valid" });
    }

    // Tambahkan url jika tersedia, agar uniform
    const enhancedResult = Array.isArray(result)
      ? result.map(item => ({ ...item, url: item.url || item.link || null }))
      : { ...result, url: result.url || result.link || null };

    return res.status(200).json({
      status: 200,
      author: "Yudzxml",
      data: enhancedResult,
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
      case "nekopoi": {
  if (!q && !url) {
    return res.status(400).json({
      status: 400,
      author: "Yudzxml",
      error: "Parameter q atau url wajib untuk nekopoi",
    });
  }
  if (q) {
    result = await nekopoi.search(q);
  } else if (url) {
    result = await nekopoi.detail(url);
  }
  break;
}
      case "xvideos": {
  if (!q && !url) {
    return res.status(400).json({
      status: 400,
      author: "Yudzxml",
      error: "Parameter q atau url wajib untuk xvideos",
    });
  }
  if (q) {
    result = await xvideos.search(q);
  } else if (url) {
    result = await xvideos.detail(url);
  }
  break;
}
      case "chord": {
        if (!q) {
          return res.status(400).json({
            status: 400,
            author: "Yudzxml",
            error: "Parameter q wajib untuk chord",
          });
        }
        result = await chord(q);
        break;
      }
      case "google": {
        if (!q) {
          return res.status(400).json({
            status: 400,
            author: "Yudzxml",
            error: "Parameter q wajib untuk google",
          });
        }
        result = await google(q);
        break;
      }
      case "spotify": {
        if (!q) {
          return res.status(400).json({
            status: 400,
            author: "Yudzxml",
            error: "Parameter q wajib untuk spotify",
          });
        }
        result = await spotify.search(q);
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
