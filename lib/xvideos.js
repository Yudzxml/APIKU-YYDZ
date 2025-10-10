import * as cheerio from "cheerio";

const xvideos = {
  search: async function (query) {
    try {
      const url = `https://www.xvideos.com/?k=${encodeURIComponent(query)}&premium=`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
          "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
          "cache-control": "no-cache",
          "device-memory": "8",
          "pragma": "no-cache",
          "sec-ch-ua": "\"Chromium\";v=\"139\", \"Not;A=Brand\";v=\"99\"",
          "sec-ch-ua-arch": "\"\"",
          "sec-ch-ua-bitness": "\"\"",
          "sec-ch-ua-full-version": "\"139.0.7339.0\"",
          "sec-ch-ua-full-version-list": "\"Chromium\";v=\"139.0.7339.0\", \"Not;A=Brand\";v=\"99.0.0.0\"",
          "sec-ch-ua-mobile": "?1",
          "sec-ch-ua-model": "\"CPH2209\"",
          "sec-ch-ua-platform": "\"Android\"",
          "sec-ch-ua-platform-version": "\"11.0.0\"",
          "sec-fetch-dest": "document",
          "sec-fetch-mode": "navigate",
          "sec-fetch-site": "same-origin",
          "sec-fetch-user": "?1",
          "upgrade-insecure-requests": "1",
          "viewport-width": "980",
          "Referer": "https://www.xvideos.com/",
          "Referrer-Policy": "no-referrer-when-downgrade"
        }
      });

      if (!response.ok) throw new Error(`Failed to fetch page: ${response.statusText}`);

      const html = await response.text();
      const $ = cheerio.load(html);
      const videoData = [];

      $(".frame-block.thumb-block").each((_, element) => {
        const titleTag = $(element).find(".title a");
        const imgTag = $(element).find("img");
        const durationTag = $(element).find(".duration");
        const authorTag = $(element).find(".name");

        videoData.push({
          title: titleTag.attr("title"),
          url: "https://www.xvideos.com" + titleTag.attr("href"),
          thumbnail: imgTag.attr("data-src"),
          duration: durationTag.text().trim(),
          author: authorTag.text().trim()
        });
      });

      return videoData;
    } catch (error) {
      console.error("Error:", error);
      return { error: error.message };
    }
  },

  detail: async function (videoUrl) {
    try {
      const response = await fetch(videoUrl, {
        method: "GET",
        headers: {
          "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
          "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
          "cache-control": "no-cache",
          "device-memory": "8",
          "pragma": "no-cache",
          "sec-ch-ua": "\"Chromium\";v=\"139\", \"Not;A=Brand\";v=\"99\"",
          "sec-ch-ua-arch": "\"\"",
          "sec-ch-ua-bitness": "\"\"",
          "sec-ch-ua-full-version": "\"139.0.7339.0\"",
          "sec-ch-ua-full-version-list": "\"Chromium\";v=\"139.0.7339.0\", \"Not;A=Brand\";v=\"99.0.0.0\"",
          "sec-ch-ua-mobile": "?1",
          "sec-ch-ua-model": "\"CPH2209\"",
          "sec-ch-ua-platform": "\"Android\"",
          "sec-ch-ua-platform-version": "\"11.0.0\"",
          "sec-fetch-dest": "document",
          "sec-fetch-mode": "navigate",
          "sec-fetch-site": "same-origin",
          "sec-fetch-user": "?1",
          "upgrade-insecure-requests": "1",
          "viewport-width": "980",
          "Referer": videoUrl,
          "Referrer-Policy": "no-referrer-when-downgrade"
        }
      });

      if (!response.ok) throw new Error(`Failed to fetch page: ${response.statusText}`);

      const html = await response.text();
      const $ = cheerio.load(html);
      const jsonData = $('script[type="application/ld+json"]').html();
      return JSON.parse(jsonData);
    } catch (error) {
      console.error("Error:", error);
      return { error: error.message };
    }
  }
};

export default xvideos;