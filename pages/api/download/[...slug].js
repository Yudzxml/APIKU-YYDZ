import { getApiKey } from '../../../lib/apikeys.js';
import aptoide from "../../../lib/aptoide.js";
import pinterest from "../../../lib/pinterest.js";
import soundcloud from "../../../lib/soundcloud.js";
import tiktok from "../../../lib/tiktok.js";
import savetube from "../../../lib/savetube.js";
import capcut from "../../../lib/capcut.js";
import fbdl from "../../../lib/fb.js";
import spotify from "../../../lib/spotify.js";
import xnxx from "../../../lib/xnxx.js";
import telesticker from "../../../lib/telesticker.js";
import downloadInstagram from "../../../lib/igdl.js";
import pindl from "../../../lib/pindl.js";
import videy from "../../../lib/videy.js";
import android1 from "../../../lib/an1.js";
import gdrivedl from "../../../lib/gdrive.js";
import spodl from "../../../lib/spotifydl.js";
import githubdl from "../../../lib/githubdl.js";
import threads from "../../../lib/threads.js";
import twitter from "../../../lib/twitter.js";

export default async function handler(req, res) {
  const { slug = [] } = req.query;
  const { url, quality, id, format, apikey } = req.query;

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
      case "twitter": {
        if (!url) {
          return res.status(400).json({
            status: 400,
            author: "Yudzxml",
            error: "Parameter url wajib untuk twitter",
          });
        }
        result = await twitter(url);
        break;
      } 
      case "threads": {
        if (!url) {
          return res.status(400).json({
            status: 400,
            author: "Yudzxml",
            error: "Parameter url wajib untuk threads",
          });
        }
        result = await threads(url);
        break;
      } 
      case "github": {
        if (!url) {
          return res.status(400).json({
            status: 400,
            author: "Yudzxml",
            error: "Parameter url wajib untuk github",
          });
        }
        result = await githubdl(url);
        break;
      } 
      case "gdrive": {
        if (!url) {
          return res.status(400).json({
            status: 400,
            author: "Yudzxml",
            error: "Parameter url wajib untuk gdrive",
          });
        }
        result = await gdrive(url);
        break;
      } 
      case "an1": {
        if (!url) {
          return res.status(400).json({
            status: 400,
            author: "Yudzxml",
            error: "Parameter url wajib untuk an1",
          });
        }
        result = await android1.download(url);
        break;
      }
      case "videy": {
        if (!url) {
          return res.status(400).json({
            status: 400,
            author: "Yudzxml",
            error: "Parameter url wajib untuk videy",
          });
        }
        result = await videy.convert(url);
        break;
      }
      case "pinterestv2": {
        if (!url) {
          return res.status(400).json({
            status: 400,
            author: "Yudzxml",
            error: "Parameter url wajib untuk pinterest",
          });
        }
        result = await pindl(url);
        break;
      }
      case "instagram": {
        if (!url) {
          return res.status(400).json({
            status: 400,
            author: "Yudzxml",
            error: "Parameter url wajib untuk instagram",
          });
        }
        result = await downloadInstagram(url);
        break;
      }
      case "telesticker": {
        if (!url) {
          return res.status(400).json({
            status: 400,
            author: "Yudzxml",
            error: "Parameter url wajib untuk telesticker",
          });
        }
        result = await telesticker(url);
        break;
      }
      case "spotifyv2": {
  if (!url) {
    return res.status(400).json({
      status: 400,
      author: "Yudzxml",
      error: "Parameter url wajib untuk spotify",
    });
  }

  try {
    const buffer = await spodl(url);
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Disposition", 'attachment; filename="spotify.mp3"');
    return res.send(buffer);
  } catch (e) {
    return res.status(500).json({
      status: 500,
      author: "Yudzxml",
      error: e.message || "Gagal download Spotify",
    });
  }
}
      case "spotify": {
        if (!url) {
          return res.status(400).json({
            status: 400,
            author: "Yudzxml",
            error: "Parameter url wajib untuk spotify",
          });
        }
        result = await spotify.download(url);
        break;
      }
      case "xnxx": {
        if (!url) {
          return res.status(400).json({
            status: 400,
            author: "Yudzxml",
            error: "Parameter url wajib untuk xnxx",
          });
        }
        result = await xnxx.download(url);
        break;
      }
      case "aptoide": {
        if (!id) {
          return res.status(400).json({
            status: 400,
            author: "Yudzxml",
            error: "Parameter id wajib untuk aptoide",
          });
        }
        result = await aptoide.download(id);
        break;
      }
      case "pinterest": {
        if (!url) {
          return res.status(400).json({
            status: 400,
            author: "Yudzxml",
            error: "Parameter url wajib untuk pinterest",
          });
        }
        result = await pinterest.download(url);
        break;
      }
      case "soundcloud": {
        if (!url) {
          return res.status(400).json({
            status: 400,
            author: "Yudzxml",
            error: "Parameter url wajib untuk soundcloud",
          });
        }
        result = await soundcloud("download", url);
        break;
      }
      case "tiktok": {
        if (!url) {
          return res.status(400).json({
            status: 400,
            author: "Yudzxml",
            error: "Parameter url wajib untuk tiktok",
          });
        }
        result = await tiktok(url);
        break;
      }
      case "youtube": {
        const validFormats = [
          "144",
          "240",
          "360",
          "480",
          "720",
          "1080",
          "mp3",
        ];
        if (!url || !format) {
          return res.status(400).json({
            status: 400,
            author: "Yudzxml",
            error: "Parameter url dan format wajib untuk youtube",
          });
        }
        if (!validFormats.includes(format)) {
          return res.status(400).json({
            status: 400,
            author: "Yudzxml",
            error: `Format tidak valid. Pilih salah satu: ${validFormats.join(
              ", "
            )}`,
          });
        }
        result = await savetube.download(url, format);
        break;
      }
      case "youtubev2": {
    const validFormats = ['mp3', 'm4a', 'webm', 'aac', 'flac', 'opus', 'ogg', 'wav', '360', '480', '720', '1080', '1440', '4k'];

    if (!url || !format) {
        return res.status(400).json({
            status: 400,
            author: "Yudzxml",
            error: "Parameter url dan format wajib untuk youtube",
        });
    }

    if (!validFormats.includes(format)) {
        return res.status(400).json({
            status: 400,
            author: "Yudzxml",
            error: `Format tidak valid. Pilih salah satu: ${validFormats.join(", ")}`,
        });
    }

    result = await ddownr(url, format);
    break;
}
      case "capcut": {
        if (!url) {
          return res.status(400).json({
            status: 400,
            author: "Yudzxml",
            error: "Parameter url wajib untuk capcut",
          });
        }
        result = await capcut(url);
        break;
      }
      case "facebook": {
        if (!url) {
          return res.status(400).json({
            status: 400,
            author: "Yudzxml",
            error: "Parameter url wajib untuk facebook",
          });
        }
        result = await fbdl(url);
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