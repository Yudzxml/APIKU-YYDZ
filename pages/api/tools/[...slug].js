import { getApiKey } from '../../../lib/apikeys.js';
import spechtotext from "../../../lib/spechtotext.js";
import checkHost from "../../../lib/checkhost.js";
import get2FAToken from "../../../lib/2fa.js";
import generateQuote from "../../../lib/quote.js";
import ssweb from "../../../lib/ssweb.js";
import imgedit from "../../../lib/imgedit.js";
import textToSpeech from "../../../lib/texttospeech.js";


export default async function handler(req, res) {
  const { slug = [] } = req.query;
  const { q, name, avatar, color, url, host, type, device, fullpage, prompt, apikey, ...paramek } = req.query;

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
      case "imgedit": {
  if (!url) {
    return res.status(400).json({
      status: 400,
      author: "Yudzxml",
      error: "Parameter url wajib untuk imgedit",
    });
  }
  try {
    const result = await imgedit(url, prompt);
    res.setHeader("Content-Type", "image/jpeg");
    res.setHeader("Content-Length", result.buffer.length);
    return res.end(result.buffer);
  } catch (err) {
    return res.status(500).json({
      status: 500,
      author: "Yudzxml",
      error: err?.message || err,
    });
  }
  break
}
      case "screenshot": {
  if (!url) {
    return res.status(400).json({
      status: 400,
      author: "Yudzxml",
      error: "Parameter url wajib untuk screenshot",
    });
  }

  try {
    const result = await ssweb(url, device || "desktop", fullpage === "true");
    res.setHeader("Content-Type", result.mime);
    res.setHeader("Content-Length", result.buffer.length);
    return res.end(result.buffer);
  } catch (err) {
    return res.status(500).json({
      status: 500,
      author: "Yudzxml",
      error: err?.message || err,
    });
  }
  break
}
      case "quote": {
     if (!q || !name || !avatar) {
       return res.status(400).json({
         status: 400,
         author: "Yudzxml",
         error: "Parameter q, name, dan avatar wajib untuk generate quote",
         });
       }
       try {
         
         const imageBuffer = await generateQuote(q, name, avatar, color);
         res.setHeader("Content-Type", "image/png");
         res.setHeader("Content-Length", imageBuffer.length);
         return res.end(imageBuffer);
       } catch (err) {
         return res.status(500).json({
           status: 500,
           author: "Yudzxml",
           error: err?.message || err,
        });
      }
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
      case "spechtotext": {
        if (!url) {
          return res.status(400).json({
            status: 400,
            author: "Yudzxml",
            error: "Parameter url wajib untuk spechtotext",
          });
        }
        result = await spechtotext(url);
        break;
      }
      case "texttospech": {
        if (!q) {
          return res.status(400).json({
            status: 400,
            author: "Yudzxml",
            error: "Parameter q wajib untuk texttospech",
          });
        }
        result = await textToSpeech(q);
        break
      }
      case "checkhost": {
  try {
    const hostInput = host || "";
    const checkType = type || "ping";
    const params = paramek || {};

    if (!hostInput.trim()) {
      return res.status(400).json({
        status: false,
        author: "Yudzxml",
        error: "Host wajib diisi"
      });
    }

    if (!checkHost.types.includes(checkType)) {
      return res.status(400).json({
        status: false,
        author: "Yudzxml",
        error: `Tipe check tidak valid. Pilih salah satu: ${checkHost.types.join(", ")}`
      });
    }

    const hostx = checkHost.domain(hostInput);
    if (!checkHost.hostname(hostx)) {
      return res.status(400).json({
        status: false,
        author: "Yudzxml",
        error: "Format host tidak valid"
      });
    }

    const result = await checkHost.check(hostx, checkType, params);

    if (result?.status === 200) {
      return res.status(200).json({
        status: 200,
        author: "Yudzxml",
        data: result.data || {},
        message: result.message || null
      });
    } else {
      return res.status(400).json({
        status: false,
        author: "Yudzxml",
        error: result.message || "Check gagal"
      });
    }

  } catch (err) {
    return res.status(500).json({
      status: 500,
      author: "Yudzxml",
      error: err?.message || err
    });
  }
}
      default:
        return res.status(404).json({
          status: 404,
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
