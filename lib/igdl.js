import * as cheerio from "cheerio";
import axios from "axios";
import btch from "btch-downloader";
const { igdl } = btch;

// fallback 1
async function instaSave(instaUrl) {
  try {
    const encodedUrl = encodeURIComponent(instaUrl);
    const requestUrl = `https://insta-save.net/content.php?url=${encodedUrl}`;

    const res = await fetch(requestUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept":
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
        "Referer": "https://insta-save.net/",
        "Origin": "https://insta-save.net/"
      },
    });

    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);

    const data = await res.json();

    if (data.status !== "ok") throw new Error("insta-save API status not ok");

    const { html, username } = data;
    const $ = cheerio.load(html);

    const profileThumbnail = $("#download-box-profile img").attr("src");
    const caption = $("#download_content p.text-sm").first().text().trim();

    const videos = [];
    $("video source").each((i, el) => {
      const videoUrl = $(el).attr("src");
      if (videoUrl) videos.push(videoUrl);
    });

    const images = [];
    $("#download_content .col-md-4 .load img").each((i, el) => {
      const imgUrl = $(el).attr("src");
      if (imgUrl) images.push(imgUrl);
    });

    return {
      success: true,
      username,
      caption,
      profileThumbnail,
      videos,
      images
    };
  } catch (err) {
    return { success: false, error: err.message, provider: "instaSave" };
  }
}

// fallback 2
async function btchigdl(link) {
  try {
    const result = await igdl(link);
    if (!result || !result[0] || !result[0].url) {
      throw new Error("Media URL tidak ditemukan");
    }

    const url_media = result[0].url;
    const res = await fetch(url_media, { method: "HEAD" });
    if (!res.ok) throw new Error(`HEAD request failed with status ${res.status}`);

    const contentType = res.headers.get("content-type");

    return {
      success: true,
      type: contentType,
      result
    };
  } catch (err) {
    return { success: false, error: err.message, provider: "btchigdl" };
  }
}

// fungsi utama dengan fallback
async function downloadInstagram(url) {
  let primary = await btchigdl(url);
  if (primary.success) return primary;
  let fallback = await instaSave(url);
  if (fallback.success) return fallback;
  return {
    success: false,
    error: "Kedua provider gagal",
    detail: {
      btchigdl: primary.error,
      instaSave: fallback.error,
    },
  };
}

export default downloadInstagram