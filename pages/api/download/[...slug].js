import { minLimit } from '../../../lib/apikeys.js';
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
import ddownr from "../../../lib/ddowner.js";
import terabox from "../../../lib/terabox.js";
import snackvideo from "../../../lib/snackvideo.js";

export default async function handler(req, res) {
  const { slug = [] } = req.query;
  const { url, quality, id, format, apikey } = req.query;

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
      case "mediafire": {
  if (!url) {
    return res.status(400).json({
      status: 400,
      author: "Yudzxml",
      error: "Parameter url wajib untuk mediafire",
    });
  }
  const api = await (await fetch(`https://api.siputzx.my.id/api/d/mediafire?url=${url}`)).json();
  result = api.data;
  break;
}
      case "snackvideo": {
        if (!url) {
          return res.status(400).json({
            status: 400,
            author: "Yudzxml",
            error: "Parameter url wajib untuk snackvideo",
          });
        }
        result = await snackvideo(url);
        break;
      } 
      case "terabox": {
        if (!url) {
          return res.status(400).json({
            status: 400,
            author: "Yudzxml",
            error: "Parameter url wajib untuk terabox",
          });
        }
        result = await terabox(url);
        break;
      } 
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

  try {
    const buffer = await githubdl(url);
    const fileName = `${Date.now()}-github.zip`;
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    return res.end(buffer);
  } catch (err) {
    return res.status(500).json({
      status: 500,
      author: "Yudzxml",
      error: err.message,
    });
  }
  break
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
      error: "Parameter 'url' wajib untuk Spotify",
    });
  }

  try {
    const data = await spodl(url);
    if (!data) {
      throw new Error("Data Spotify tidak ditemukan");
    }

    return res.status(200).json({
      status: 200,
      author: "Yudzxml",
      data: data.data,
    });
  } catch (e) {
    return res.status(500).json({
      status: 500,
      author: "Yudzxml",
      error: e.message || "Gagal mengambil data Spotify",
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

    result = await ddownr.download(url, format);
    break;
}
      case "youtubev3": {
  const formatAudio = [320, 256, 192, 128];
  const formatVideo = [1080, 720, 480, 360];
  const validFormats = ["audio", "video"];

  // --- Validasi dasar ---
  if (!url || !format || !quality) {
    return res.status(400).json({
      status: 400,
      author: "Yudzxml",
      error: "Parameter 'url', 'format', dan 'quality' wajib diisi untuk YouTube."
    });
  }

  // --- Validasi format ---
  if (!validFormats.includes(format.toLowerCase())) {
    return res.status(400).json({
      status: 400,
      author: "Yudzxml",
      error: `Format tidak valid. Pilih salah satu: ${validFormats.join(", ")}`
    });
  }

  // --- Validasi kualitas sesuai format ---
  const isAudio = format.toLowerCase() === "audio" && formatAudio.includes(Number(quality));
  const isVideo = format.toLowerCase() === "video" && formatVideo.includes(Number(quality));

  if (!isAudio && !isVideo) {
    return res.status(400).json({
      status: 400,
      author: "Yudzxml",
      error: "Kualitas tidak sesuai dengan format yang dipilih."
    });
  }

  try {
    // --- Fetch langsung ke API kamu ---
    const response = await fetch(
      `https://api-yudzxml.koyeb.app/api/ytdl?url=${encodeURIComponent(url)}&format=${format}&quality=${quality}`
    );

    if (!response.ok) {
      throw new Error(`Gagal memanggil API YTDL (status: ${response.status})`);
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    console.error("[YouTubeV3] Error:", error.message);
    return res.status(500).json({
      status: 500,
      author: "Yudzxml",
      error: error.message || "Terjadi kesalahan internal saat mengambil data YouTube."
    });
  }
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