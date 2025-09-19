import * as cheerio from "cheerio";

async function tikdownloader(tiktokUrl) {
  try {
    const postData = new URLSearchParams({ q: tiktokUrl, lang: 'en' });
    const res = await fetch('https://tikdownloader.io/api/ajaxSearch', {
      method: 'POST',
      body: postData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Accept': '*/*',
        'X-Requested-With': 'XMLHttpRequest',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });
    const json = await res.json();
    const html = json.data;

    const $ = cheerio.load(html);
    const title = $(".thumbnail h3").text().trim() || $('.tik-left .content h3').text().trim();
    const thumbnail = $(".thumbnail img").attr("src") || null;

    const downloadLinks = [];
    $(".dl-action a").each((i, el) => {
      const link = $(el).attr("href");
      const label = $(el).text().trim();
      if (link) downloadLinks.push({ label, link });
    });

    const audioLink = $('#ConvertToVideo').attr('data-audiourl') || null;
    if (audioLink) downloadLinks.push({ label: 'Audio', link: audioLink });

    const images = [];
    $('.photo-list img').each((i, el) => {
      const imgSrc = $(el).attr('src');
      if (imgSrc) images.push(imgSrc);
    });

    const tiktokId = $("#TikTokId").val() || null;
    const videoLink = $('#ConvertToVideo').attr('href') || null;
    const videos = videoLink ? [{ quality: 'default', link: videoLink }] : [];

    return { title, thumbnail, tiktokId, videos, images, downloads: downloadLinks };
  } catch (error) {
    return { error: error.message, title: null, thumbnail: null, tiktokId: null, videos: [], images: [], downloads: [] };
  }
}

async function getTikTokInfo(url) {
  if (!url) return { success: false, message: 'URL TikTok tidak boleh kosong', raw: null };
  try {
    const res = await fetch('https://downloader.bot/api/tiktok/info', {
      method: 'POST',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/116.0.5845.97 Safari/537.36'
      },
      body: JSON.stringify({ url })
    });

    const data = await res.json();
    if (!data.status) return { success: false, message: data.error || 'Unknown error', raw: data };
    return { success: true, data: data.data };
  } catch (err) {
    return { success: false, message: 'Gagal mengambil info TikTok', raw: err.message };
  }
}

async function tiksave(url) {
  const data = new URLSearchParams({ q: url, lang: "id" });
  const headers = {
    "accept": "*/*",
    "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
    "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
    "sec-ch-ua": '"Chromium";v="139", "Not;A=Brand";v="99"',
    "sec-ch-ua-mobile": "?1",
    "sec-ch-ua-platform": '"Android"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "x-requested-with": "XMLHttpRequest",
    "Referer": "https://tiksave.io/id",
    "Referrer-Policy": "strict-origin-when-cross-origin"
  };

  const res = await fetch("https://tiksave.io/api/ajaxSearch", { method: "POST", headers, body: data });
  const json = await res.json();
  const html = json.data;

  const $ = cheerio.load(html);
  const thumbnail = $(".tik-left .thumbnail .image-tik img").attr("src") || $(".thumbnail .image-tik img").attr("src");
  const title = $(".tik-left .thumbnail h3").text().trim() || $(".thumbnail h3").text().trim();
  const audioUrl = $("#ConvertToVideo").attr("data-audioUrl") || null;
  const videoUrl = $("#ConvertToVideo").attr("href") || $("video#vid").attr("data-src") || null;

  const images = [];
  $(".photo-list .download-items__thumb img").each((i, el) => images.push($(el).attr("src")));

  const downloadLinks = [];
  $(".dl-action a.tik-button-dl").each((i, el) => downloadLinks.push({ label: $(el).text().trim(), url: $(el).attr("href") }));

  return { title, thumbnail, audioUrl, videoUrl, images, downloadLinks };
}

async function tiktoksearch(keywords) {
  try {
    const data = new URLSearchParams({ keywords, count: 50, cursor: 0, HD: 1 });
    const res = await fetch("https://tikwm.com/api/feed/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "Cookie": "current_language=en",
        "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36"
      },
      body: data
    });
    const json = await res.json();
    const videos = json.data.videos;
    if (!videos.length) throw new Error("Tidak ada video ditemukan.");
    const randomVideo = videos[Math.floor(Math.random() * videos.length)];
    return {
      title: randomVideo.title,
      cover: randomVideo.cover,
      origin_cover: randomVideo.origin_cover,
      no_watermark: randomVideo.play,
      watermark: randomVideo.wmplay,
      music: randomVideo.music
    };
  } catch (err) {
    console.error('Error fetching TikTok videos:', err);
    return { error: 'Gagal pencarian TikTok' };
  }
}

async function tiktok(input) {
  if (!input.startsWith('http')) {
    return await tiktoksearch(input);
  }
  try { return await tikdownloader(input); } catch { }
  try { return await tiksave(input); } catch { }
  try { return await getTikTokInfo(input); } catch { }
  return { error: 'Ketiga method gagal' };
}

export default tiktok;