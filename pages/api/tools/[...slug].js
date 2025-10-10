import { minLimit } from '../../../lib/apikeys.js';
import spechtotext from "../../../lib/spechtotext.js";
import checkHost from "../../../lib/checkhost.js";
import get2FAToken from "../../../lib/2fa.js";
import generateQuote from "../../../lib/quote.js";
import ssweb from "../../../lib/ssweb.js";
import imgedit from "../../../lib/imgedit.js";
import textToSpeech from "../../../lib/texttospeech.js";
import styletext from "../../../lib/styletext.js";
import pxpic from "../../../lib/pxpic.js";
import cuaca from "../../../lib/cuaca.js";
import cekkouta from "../../../lib/cekkouta.js";
import sidompul from "../../../lib/sidompul.js";
import subdomainfinder from "../../../lib/subdomainfinder.js";
import kodepos from "../../../lib/kodepos.js";
import sendemail from "../../../lib/sendemail.js";
import convert from "../../../lib/convert.js";

export default async function handler(req, res) {
  const { slug = [] } = req.query;
  const { q, name, avatar, color, url, host, number, type, device, fullpage, tools, prompt, apikey, ...paramek } = req.query;

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
    case "converter": {
    if (!url && !type) {
    return res.status(400).json({
      status: 400,
      author: "Yudzxml",
      error: "Parameter url & type wajib untuk converter",
    });
  }
    result = await convert(url, type)
    break
}
    case "unban": {
  if (!number) {
    return res.status(400).json({
      status: 400,
      author: "Yudzxml",
      error: "Parameter number wajib untuk unban",
    });
  }

   result = await sendemail(number);
  break;
}
    case "deobfuscate": {
    if (!url) {
    return res.status(400).json({
      status: 400,
      author: "Yudzxml",
      error: "Parameter url wajib untuk deobfuscate",
    });
  }
    const response = await fetch(`http://212.132.120.102:13217/deobfuscate?url=${encodeURIComponent(url)}`);
    const data = await response.json();
    result = data.result;
    break
}
    case "obfuscate": {
    const incomingUrl = url; 
    const incomingType = type || "low";
  if (!incomingUrl || !incomingType) {
    return res.status(400).json({
      status: 400,
      author: "Yudzxml",
      error: "Parameter `url` dan `type` wajib.",
    });
  }

  const allowed = new Set(["low", "medium", "hard", "extreme", "extrem"]);
  if (!allowed.has(incomingType)) {
    return res.status(400).json({
      status: 400,
      author: "Yudzxml",
      error: "Parameter `type` tidak valid. Gunakan salah satu: low, medium, hard, extreme.",
    });
  }

  const level = incomingType === "extrem" ? "extreme" : incomingType;
  const serviceUrl = `http://212.132.120.102:13217/obfuscate?url=${encodeURIComponent(incomingUrl)}&level=${encodeURIComponent(level)}`;

  try {
    const r = await fetch(serviceUrl, { method: "GET" });
    if (!r.ok) {
      const text = await r.text().catch(() => "");
      return res.status(502).json({
        status: 502,
        author: "Yudzxml",
        error: "Gagal memanggil service obfuscate.",
        serviceStatus: r.status,
        serviceBody: text,
      });
    }

    let result;
    const contentType = r.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      result = await r.json();
    } else {
      result = await r.text();
    }

    return res.status(200).json({
      status: 200,
      author: "Yudzxml",
      data: result
    });
  } catch (err) {
    return res.status(500).json({
      status: 500,
      author: "Yudzxml",
      error: "Terjadi kesalahan saat memproses permintaan obfuscate.",
      message: err?.message || String(err),
    });
  }
  break;
}
    case "kodepos": {
  if (!q) {
    return res.status(400).json({
      status: 400,
      author: "Yudzxml",
      error: "Parameter 'q' wajib untuk kodepos",
    });
  }

  try {
    const result = await kodepos(q);
    return res.json({
      status: 200,
      author: "Yudzxml",
      data: result,
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
    case "subdomainfinder": {
  if (!host) {
    return res.status(400).json({
      status: 400,
      author: "Yudzxml",
      error: "Parameter 'host' wajib untuk subdomainfinder",
    });
  }

  try {
    const result = await subdomainfinder(host);
    return res.json({
      status: 200,
      author: "Yudzxml",
      data: result,
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
      case "cekkouta": {
  if (!number) {
    return res.status(400).json({
      status: 400,
      author: "Yudzxml",
      error: "Parameter 'number' wajib untuk cekkouta",
    });
  }

  try {
    const result = await cekkouta(number);
    return res.json({
      status: 200,
      author: "Yudzxml",
      data: result,
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
      case "sidompul": {
  if (!number) {
    return res.status(400).json({
      status: 400,
      author: "Yudzxml",
      error: "Parameter 'number' wajib untuk sidompul",
    });
  }

  try {
    const result = await sidompul(number);
    return res.json({
      status: 200,
      author: "Yudzxml",
      data: result,
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
      case "weather": {
  if (!q) {
    return res.status(400).json({
      status: 400,
      author: "Yudzxml",
      error: "Parameter 'q' wajib untuk cuaca",
    });
  }

  try {
    const result = await cuaca(q);
    return res.json({
      status: 200,
      author: "Yudzxml",
      data: result,
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
      case "pxpic": {
  if (!url || !tools) {
    return res.status(400).json({
      status: 400,
      author: "Yudzxml",
      error: "Parameter url dan tools wajib untuk pxpic",
    });
  }
  try {
    const result = await pxpic.create(url, tools);
    return res.json({
      status: 200,
      author: "Yudzxml",
      data: result,
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
      case "styletext": {
  if (!q) {
    return res.status(400).json({
      status: 400,
      author: "Yudzxml",
      error: "Parameter q wajib untuk styletext",
    });
  }
  try {
    const result = await styletext(q);
    return res.json({
      status: 200,
      author: "Yudzxml",
      data: result,
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
      case "imgedit": {
  if (!url) {
    return res.status(400).json({
      status: 400,
      author: "Yudzxml",
      error: "Parameter url wajib untuk imgedit",
    });
  }
  try {
     result = await imgedit.create(url, prompt);
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
