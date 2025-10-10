import { minLimit } from '../../../lib/apikeys.js';
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
import lk21 from "../../../lib/lk21.js";
import komikindo from "../../../lib/komikindo.js";
import livechart from "../../../lib/livechart.js";
import wattpad from "../../../lib/wattpad.js";
import wallpaper from "../../../lib/wallpaper.js";
import wikimedia from "../../../lib/wikimedia.js";
import ringtone from "../../../lib/ringtone.js";
import otakudesu from "../../../lib/otakudesu.js";
import GSMDetail from "../../../lib/GSMArena.js";
import npmdetail from "../../../lib/npm.js";
import noveltoon from "../../../lib/noveltoon.js";
import genshinchart from "../../../lib/genshinchart.js";
import resep from "../../../lib/resep.js";
import brave from "../../../lib/brave.js";
import lirik from "../../../lib/lirik.js";
import animeindo from "../../../lib/animeindo.js";
import fdroid from "../../../lib/fdroid.js";

export default async function handler(req, res) {
  const { slug = [] } = req.query;
  const { 
  q, 
  page = 1, 
  genre, 
  url, 
  tipe = "manga", 
  type, 
  action, 
  popular, 
  ongoing, 
  chapter, 
  download, 
  order,
  id,
  apikey 
} = req.query;

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
      case "fdroid": {
  if (!q && !url) {
    return res.status(400).json({
      status: 400,
      author: "Yudzxml",
      error: "Parameter 'q' (untuk search) atau 'url' (untuk detail) wajib diisi.",
    });
  }

  try {
    if (url) {
      result = await fdroid.detail(url);
    } else if (q) {
      result = await fdroid.search(q);
    }
  } catch (err) {
    return res.status(500).json({
      status: 500,
      author: "Yudzxml",
      error: err.message,
    });
  }
  break
}
      case "apkpure": {
  try {
    if (!action) {
      return res.status(400).json({
        status: 400,
        author: "Yudzxml",
        error: "Parameter 'action' wajib diisi (search | detail | detailapk | download).",
      });
    }

    if (!q && !url) {
      return res.status(400).json({
        status: 400,
        author: "Yudzxml",
        error: "Parameter 'q' atau 'url' wajib diisi.",
      });
    }

    const validActions = ["search", "detail", "detailapk", "download"];
    if (!validActions.includes(action)) {
      return res.status(400).json({
        status: 400,
        author: "Yudzxml",
        error: `Action tidak dikenal. Gunakan salah satu dari: ${validActions.join(" | ")}.`,
      });
    }

    const base = "https://api-yudzxml.koyeb.app/api/apkpure";
    const handlers = {
      search: async () => `${base}/search?q=${encodeURIComponent(q)}`,
      detail: async () => `${base}/detail?url=${encodeURIComponent(url)}`,
      detailapk: async () => `${base}/detailapk?url=${encodeURIComponent(url)}`,
      download: async () => `${base}/download?url=${encodeURIComponent(url)}`,
    };

    const endpoint = await handlers[action]();
    const response = await fetch(endpoint);
    if (!response.ok) throw new Error("Gagal mengambil data dari API.");
    const data = await response.json();

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({
      status: 500,
      author: "Yudzxml",
      error: error?.message || "Terjadi kesalahan internal saat memproses permintaan.",
    });
  }
  break
}
      case "animeindo": {
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
        result = await animeindo.search(q);
        break;

      case "home":
        result = await animeindo.home(pageNum);
        break;

      case "detail":
        if (!url) {
          return res.status(400).json({ status: 400, author: "Yudzxml", error: "Parameter url wajib untuk detail" });
        }
        result = await animeindo.detail(url);
        break;

      case "genre":
        if (!type) {
          return res.status(400).json({ status: 400, author: "Yudzxml", error: "Parameter type wajib untuk search genre" });
        }
        result = await animeindo.genre(type, pageNum);
        break;

      case "stream":
        if (!url) {
          return res.status(400).json({ status: 400, author: "Yudzxml", error: "Parameter url wajib untuk stream" });
        }
        result = await animeindo.stream(url);
        break;

      default:
        return res.status(400).json({ status: 400, author: "Yudzxml", error: "Action tidak valid" });
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
      error: err?.message || err,
    });
  }
  break;
}
      case "lirik": {
        if (!q) {
          return res.status(400).json({
            status: 400,
            author: "Yudzxml",
            error: "Parameter q wajib untuk lirik",
          });
        }
        result = await lirik(q);
        break;
      }
      case "brave": {
        if (!q) {
          return res.status(400).json({
            status: 400,
            author: "Yudzxml",
            error: "Parameter q wajib untuk brave",
          });
        }
        result = await brave(q);
        break;
      }
      case "resep": {
        if (!q) {
          return res.status(400).json({
            status: 400,
            author: "Yudzxml",
            error: "Parameter q wajib untuk resep",
          });
        }
        result = await resep(q);
        break;
      }
      case "genshinchart": {
        if (!q) {
          return res.status(400).json({
            status: 400,
            author: "Yudzxml",
            error: "Parameter q wajib untuk genshinchart",
          });
        }
        result = await genshinchart(q);
        break;
      }
      case "noveltoon": {
        if (!q && !url) {
  return res.status(400).json({
    status: 400,
    author: "Yudzxml",
    error: "Parameter q atau url wajib untuk noveltoon",
  });
}
        const query = url || q;
        result = await noveltoon(query);
        break;
      }
      case "npm": {
        if (!q) {
          return res.status(400).json({
            status: 400,
            author: "Yudzxml",
            error: "Parameter q wajib untuk npm",
          });
        }
        result = await npmdetail(q);
        break;
      }
      case "gsmarena": {
        if (!q) {
          return res.status(400).json({
            status: 400,
            author: "Yudzxml",
            error: "Parameter q wajib untuk gsmarena",
          });
        }
        result = await GSMDetail(q);
        break;
      }
      case "otakudesu": {
  if (ongoing) {
    result = await otakudesu.ongoing();
  } else if (url && download) {
    const fullUrl = url.startsWith("http") ? url : `https://otakudesu.cloud${url}`;
    result = await otakudesu.download(fullUrl);
  } else if (url) {
    const fullUrl = url.startsWith("http") ? url : `https://otakudesu.cloud${url}`;
    result = await otakudesu.detail(fullUrl);
  } else if (q) {
    result = await otakudesu.search(q);
  } else {
    return res.status(400).json({
      status: 400,
      author: "Yudzxml",
      error: "Parameter q, url, download, atau ongoing wajib untuk otakudesu",
    });
  }
  break;
}
      case "ringtone": {
    try {
        if (!q) {
            return res.status(400).json({
                status: 400,
                author: "Yudzxml",
                error: "Parameter 'q' wajib untuk ringtone"
            });
        }

        const result = await ringtone(q);

        if (!result || !result.length) {
            return res.status(404).json({
                status: 404,
                author: "Yudzxml",
                error: "Ringtone tidak ditemukan"
            });
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
            error: err.message
        });
    }
    break;
}
      case "wikimedia": {
    try {
        if (!q) {
            return res.status(400).json({
                status: 400,
                author: "Yudzxml",
                error: "Parameter 'q' wajib untuk wikimedia"
            });
        }

        const result = await wikimedia(q);

        if (!result || !result.length) {
            return res.status(404).json({
                status: 404,
                author: "Yudzxml",
                error: "Gambar tidak ditemukan di Wikimedia"
            });
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
            error: err.message
        });
    }
    break;
}
      case "wallpaper": {
    try {
        if (!q) {
            return res.status(400).json({
                status: 400,
                author: "Yudzxml",
                error: "Parameter 'q' wajib untuk wallpaper"
            });
        }

        const pageNumber = page || '1'; 
        const result = await wallpaper(q, pageNumber);

        if (!result || !result.length) {
            return res.status(404).json({
                status: 404,
                author: "Yudzxml",
                error: "Wallpaper tidak ditemukan"
            });
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
            error: err.message
        });
    }
    break;
}
      case "wattpad": {
    try {
        if (url && chapter) {
            const fullUrl = url.startsWith("http") ? url : `https://www.wattpad.com${url}`;
            result = await wattpad.read(fullUrl);
        } else if (url) {
            const fullUrl = url.startsWith("http") ? url : `https://www.wattpad.com${url}`;
            result = await wattpad.getList(fullUrl);
        } else if (q) {
            result = await wattpad.search(q);
        } else {
            return res.status(400).json({
                status: 400,
                author: "Yudzxml",
                error: "Parameter q, url, atau chapter wajib untuk wattpad",
            });
        }
    } catch (err) {
        return res.status(500).json({
            status: 500,
            author: "Yudzxml",
            error: err.message,
        });
    }
    break;
}
      case "livechart": {
      if (url) {
        const fullUrl = url.startsWith("http") ? url : `https://www.livechart.me${url}`;
        result = await livechart.detail(fullUrl);
    } else if (q) {
        result = await livechart.search(q);
    } else {
        return res.status(400).json({
            status: 400,
            author: "Yudzxml",
            error: "Parameter q, url wajib untuk livechart",
        });
    }
    break;
}
      case "komikindo": {
     if (popular) {
    result = await komikindo.populer();
    } else if (url) {
    const fullUrl = url.startsWith("http") ? url : `https://komikindo.dev${url}`;
    result = await komikindo.detail(fullUrl);
  } else if (q) {
    result = await komikindo.search(q);
  } else {
    return res.status(400).json({
      status: 400,
      author: "Yudzxml",
      error: "Parameter q, url, atau popular wajib untuk komikindo",
    });
  }
  break;
}
      case "lk21": {
      if (url) {
        const fullUrl = url.startsWith("http") ? url : `https://tv6.lk21official.cc${url}`;
      result = await lk21.detail(fullUrl);
     } else if (q) {
      const pg = parseInt(page) || 1;
     result = await lk21.search(q, page);
     } else {
      const pag = parseInt(page) || 1;
    result = await lk21.latest(pg);
    }
  break;
}
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
    if (!action) {
      return res.status(400).json({
        status: 400,
        author: "Yudzxml",
        error: "Parameter 'action' wajib diisi",
      });
    }

    let result;

    switch (action) {
      case "home":
        result = await samehadaku.home();
        break;

      case "latest":
        result = await samehadaku.latest(pageNum);
        break;

      case "search":
        if (!q)
          return res.status(400).json({
            status: 400,
            author: "Yudzxml",
            error: "Parameter 'q' wajib diisi untuk pencarian",
          });
        result = await samehadaku.search(q, pageNum);
        break;

      case "ongoing":
        result = await samehadaku.ongoing(pageNum, order);
        break;

      case "completed":
        result = await samehadaku.completed(pageNum, order);
        break;

      case "popular":
        result = await samehadaku.popular(pageNum);
        break;

      case "movie":
        result = await samehadaku.movie(pageNum, order);
        break;

      case "list":
        result = await samehadaku.list(pageNum, order);
        break;

      case "schedule":
        result = await samehadaku.schedule();
        break;

      case "genre":
        result = await samehadaku.genre();
        break;

      case "genres":
        if (!genre)
          return res.status(400).json({
            status: 400,
            author: "Yudzxml",
            error: "Parameter 'genre' wajib diisi untuk filter genre",
          });
        result = await samehadaku.genres(genre, pageNum);
        break;

      case "batch":
        result = await samehadaku.batch(pageNum);
        break;

      case "batchdetail":
        if (!id)
          return res.status(400).json({
            status: 400,
            author: "Yudzxml",
            error: "Parameter 'id' wajib diisi untuk detail batch",
          });
        result = await samehadaku.batchdetail(id);
        break;

      case "detail":
        if (!id)
          return res.status(400).json({
            status: 400,
            author: "Yudzxml",
            error: "Parameter 'id' wajib diisi untuk detail anime",
          });
        result = await samehadaku.detail(id);
        break;

      case "episode":
        if (!id)
          return res.status(400).json({
            status: 400,
            author: "Yudzxml",
            error: "Parameter 'id' wajib diisi untuk detail episode",
          });
        result = await samehadaku.episode(id);
        break;

      case "stream":
        if (!id)
          return res.status(400).json({
            status: 400,
            author: "Yudzxml",
            error: "Parameter 'id' wajib diisi untuk link streaming",
          });
        result = await samehadaku.stream(id);
        break;

      default:
        return res.status(400).json({
          status: 400,
          author: "Yudzxml",
          error: `Action '${action}' tidak valid. Gunakan salah satu: home, latest, search, ongoing, completed, popular, movie, list, schedule, genre, genres, batch, batchdetail, detail, episode, stream.`,
        });
    }

    return res.status(200).json({
      status: 200,
      author: "Yudzxml",
      source: "samehadaku",
      endpoint: action,
      data: result,
    });

  } catch (err) {
    return res.status(500).json({
      status: 500,
      author: "Yudzxml",
      source: "samehadaku",
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