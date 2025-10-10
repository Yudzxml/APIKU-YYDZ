import got from "got";
import * as cheerio from "cheerio";

const BASE_URL = "https://otakudesu.cloud";

const otakudesu = {
  // 🔹 List ongoing anime
  ongoing: async () => {
    try {
      const response = await got(BASE_URL);
      const $ = cheerio.load(response.body);
      const results = [];

      $(".venz ul li").each((_, element) => {
        const episode = $(element).find(".epz").text().trim();
        const type = $(element).find(".epztipe").text().trim();
        const date = $(element).find(".newnime").text().trim();
        const title = $(element).find(".jdlflm").text().trim();
        const link = $(element).find("a").attr("href");
        const image = $(element).find("img").attr("src");

        results.push({ episode, type, date, title, link, image });
      });

      return results;
    } catch (error) {
      console.error("❌ Error fetching ongoing:", error.message);
      return { error: "Failed to fetch ongoing anime" };
    }
  },

  // 🔹 Search anime
  search: async (query) => {
    const url = `${BASE_URL}/?s=${encodeURIComponent(query)}&post_type=anime`;
    try {
      const response = await got(url);
      const $ = cheerio.load(response.body);
      const animeList = [];

      $(".chivsrc li").each((_, element) => {
        const title = $(element).find("h2 a").text().trim();
        const link = $(element).find("h2 a").attr("href");
        const imageUrl = $(element).find("img").attr("src");
        const genres = $(element)
          .find(".set")
          .first()
          .text()
          .replace("Genres : ", "")
          .trim();
        const status = $(element)
          .find(".set")
          .eq(1)
          .text()
          .replace("Status : ", "")
          .trim();
        const rating =
          $(element)
            .find(".set")
            .eq(2)
            .text()
            .replace("Rating : ", "")
            .trim() || "N/A";

        animeList.push({ title, link, imageUrl, genres, status, rating });
      });

      return animeList;
    } catch (error) {
      console.error("❌ Error fetching search:", error.message);
      return { error: "Failed to search anime" };
    }
  },

  // 🔹 Detail anime
  detail: async (url) => {
    try {
      const response = await got(url);
      const $ = cheerio.load(response.body);

      const animeInfo = {
        title: $('.fotoanime .infozingle p:contains("Judul")')
          .text()
          .replace("Judul: ", "")
          .trim(),
        japaneseTitle: $('.fotoanime .infozingle p:contains("Japanese")')
          .text()
          .replace("Japanese: ", "")
          .trim(),
        score: $('.fotoanime .infozingle p:contains("Skor")')
          .text()
          .replace("Skor: ", "")
          .trim(),
        producer: $('.fotoanime .infozingle p:contains("Produser")')
          .text()
          .replace("Produser: ", "")
          .trim(),
        type: $('.fotoanime .infozingle p:contains("Tipe")')
          .text()
          .replace("Tipe: ", "")
          .trim(),
        status: $('.fotoanime .infozingle p:contains("Status")')
          .text()
          .replace("Status: ", "")
          .trim(),
        totalEpisodes: $('.fotoanime .infozingle p:contains("Total Episode")')
          .text()
          .replace("Total Episode: ", "")
          .trim(),
        duration: $('.fotoanime .infozingle p:contains("Durasi")')
          .text()
          .replace("Durasi: ", "")
          .trim(),
        releaseDate: $('.fotoanime .infozingle p:contains("Tanggal Rilis")')
          .text()
          .replace("Tanggal Rilis: ", "")
          .trim(),
        studio: $('.fotoanime .infozingle p:contains("Studio")')
          .text()
          .replace("Studio: ", "")
          .trim(),
        genres: $('.fotoanime .infozingle p:contains("Genre")')
          .text()
          .replace("Genre: ", "")
          .trim(),
        imageUrl: $(".fotoanime img").attr("src"),
      };

      const episodes = [];
      $(".episodelist ul li").each((_, element) => {
        const episodeTitle = $(element).find("span a").text().trim();
        const episodeLink = $(element).find("span a").attr("href");
        const episodeDate = $(element).find(".zeebr").text().trim();
        episodes.push({ title: episodeTitle, link: episodeLink, date: episodeDate });
      });

      return { animeInfo, episodes };
    } catch (error) {
      console.error("❌ Error fetching detail:", error.message);
      return { error: "Failed to fetch anime detail" };
    }
  },

  // 🔹 Download links
  download: async (url) => {
    try {
      const response = await got(url);
      const $ = cheerio.load(response.body);

      const episodeInfo = {
        title: $(".download h4").text().trim(),
        downloads: [],
      };

      $(".download ul li").each((_, element) => {
        const quality = $(element).find("strong").text().trim();
        const links = $(element)
          .find("a")
          .map((i, el) => ({
            quality,
            link: $(el).attr("href"),
            host: $(el).text().trim(),
          }))
          .get();
        episodeInfo.downloads.push(...links);
      });

      return episodeInfo;
    } catch (error) {
      console.error("❌ Error fetching download:", error.message);
      return { error: "Failed to fetch download links" };
    }
  },
};

export default otakudesu;