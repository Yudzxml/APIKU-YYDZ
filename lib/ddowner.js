import got from "got";

const formatAudio = ["mp3", "m4a", "webm", "aac", "flac", "opus", "ogg", "wav"];
const formatVideo = ["360", "480", "720", "1080", "1440", "4k"];

const headers = {
  "accept": "*/*",
  "accept-encoding": "gzip, deflate, br, zstd",
  "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
  "cache-control": "no-cache",
  "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
  "pragma": "no-cache",
  "priority": "u=1, i",
  "sec-ch-ua": '"Chromium";v="139", "Not;A=Brand";v="99"',
  "sec-ch-ua-mobile": "?1",
  "sec-ch-ua-platform": '"Android"',
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "cross-site",
  "user-agent":
    "Mozilla/5.0 (Linux; Android 11; CPH2209) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36",
  "Referer": "https://ddownr.com/",
  "Referrer-Policy": "strict-origin-when-cross-origin"
};

const ddownr = {
  download: async (videoUrl, format = "144") => {
    if (!videoUrl || typeof videoUrl !== "string") {
      throw new Error("URL video tidak valid");
    }
    if (![...formatAudio, ...formatVideo].includes(format)) {
      throw new Error(`Format "${format}" tidak didukung`);
    }

    try {
      const res = await got(
        `https://p.savenow.to/ajax/download.php?copyright=0&format=${format}&url=${encodeURIComponent(videoUrl)}&api=dfcb6d76f2f6a9894gjkege8a4ab232222`,
        { headers, responseType: "json" }
      );

      const data = res.body;
      if (!data.id) throw new Error("Gagal mendapatkan ID download");

      const downloadId = data.id;
      let downloadUrl = null;
      const maxAttempts = 20;
      let attempts = 0;

      while (!downloadUrl) {
        await new Promise((r) => setTimeout(r, 1500));
        const progressRes = await got(
          `https://p.savenow.to/api/progress?id=${downloadId}`,
          { headers, responseType: "json" }
        );
        const progressData = progressRes.body;

        if (progressData.success === 1 && progressData.download_url) {
          downloadUrl = progressData.download_url;
        } else if (progressData.success === 0) {
          throw new Error("Terjadi error saat proses download");
        }

        attempts++;
        if (attempts >= maxAttempts) {
          throw new Error("Timeout menunggu download URL");
        }
      }

      return {
        title: data.info.title,
        thumbnail: data.info.image,
        downloadUrl
      };
    } catch (err) {
      throw new Error(`Download gagal: ${err.message}`);
    }
  }
};

export default ddownr;