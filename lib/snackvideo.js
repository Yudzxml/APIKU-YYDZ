import fetch from "undici";
import * as cheerio from "cheerio";

async function snackvideo(url) {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      timeout: 30000,
    });

    if (!response.ok) {
      throw new Error(`Gagal mengambil halaman: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const videoDataScript = $("#VideoObject").html();

    if (!videoDataScript) {
      throw new Error("Video data tidak ditemukan di halaman.");
    }

    const videoData = JSON.parse(videoDataScript);

    const result = {
      url: videoData.url || "",
      title: videoData.name || "",
      description: videoData.description || "",
      thumbnail: Array.isArray(videoData.thumbnailUrl)
        ? videoData.thumbnailUrl[0]
        : videoData.thumbnailUrl || "",
      uploadDate: videoData.uploadDate
        ? new Date(videoData.uploadDate).toISOString().split("T")[0]
        : "",
      videoUrl: videoData.contentUrl || "",
      duration: formatDuration(videoData.duration),
      interaction: {
        views:
          videoData.interactionStatistic?.find(
            (stat) =>
              stat.interactionType["@type"] ===
              "https://schema.org/WatchAction"
          )?.userInteractionCount || 0,
        likes:
          videoData.interactionStatistic?.find(
            (stat) =>
              stat.interactionType["@type"] ===
              "https://schema.org/LikeAction"
          )?.userInteractionCount || 0,
        shares:
          videoData.interactionStatistic?.find(
            (stat) =>
              stat.interactionType["@type"] ===
              "https://schema.org/ShareAction"
          )?.userInteractionCount || 0,
      },
      creator: {
        name: videoData.creator?.mainEntity?.name || "",
        profileUrl: videoData.creator?.mainEntity?.url || "",
        bio: videoData.creator?.mainEntity?.description || "",
      },
    };

    return result;
  } catch (error) {
    console.error("API Error:", error.message);
    throw new Error("Gagal mengambil data dari API SnackVideo.");
  }
}

function formatDuration(duration) {
  if (!duration) return "";
  const match = duration.match(/^PT(\d+)M(\d+)S$/);
  if (match) {
    return `${match[1]} minutes ${match[2]} seconds`;
  }
  return duration;
}

export default snackvideo;