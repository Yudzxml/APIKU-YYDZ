import got from "got";
import * as cheerio from "cheerio";

const HEADERS = {
    "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
    "sec-ch-ua": "\"Chromium\";v=\"139\", \"Not;A=Brand\";v=\"99\"",
    "sec-ch-ua-mobile": "?1",
    "sec-ch-ua-platform": "\"Android\"",
    "sec-fetch-dest": "document",
    "sec-fetch-mode": "navigate",
    "sec-fetch-site": "same-origin",
    "sec-fetch-user": "?1",
    "upgrade-insecure-requests": "1",
    "cookie": "__gads=ID=c13701664825dc6f:T=1759762870:RT=1759762870:S=ALNI_MYcSrEgofrPfjJACzJH1kHocecuLA; __gpi=UID=000011a0c7be14a5:T=1759762870:RT=1759762870:S=ALNI_MZgYruJAEJe4Mmkq7yQjpLbH1w02g; __eoi=ID=9f6669fef824c4d5:T=1759762870:RT=1759762870:S=AA-AfjaB6EsXrgFZRDNaKun_aP9m; AMP_TOKEN=%24NOT_FOUND; _ga=GA1.2.1817655126.1759762869; _gid=GA1.2.323915377.1759762870; _ga_NT1VQC8HKJ=GS2.1.s1759762868$o1$g0$t1759762871$j57$l0$h0; FCNEC=%5B%5B%22AKsRol-uz8JJam9EljYJwqtkhXrYHi2Pdpas0hIopmoMyvwgVf77NDhdFaNLv0M7gdyfpMuiGA27CyL0j16MSwdNi-2IdeQ2t6ilcJBIXUENmM-XmUBIOGRZj-KAqrI-CBY8t4khiINfEwIb6otAE0p2IN6kZFc-1w%3D%3D%22%5D%5D; _qimei=atta0cD5phTPwb3wPHQTJMH35A58R6YS; _user_tag=j%3A%7B%22language%22%3A%22en%22%2C%22source_language%22%3A%22id-ID%22%2C%22country%22%3A%22ID%22%7D",
    "Referer": "https://apkpure.net/",
    "Referrer-Policy": "no-referrer-when-downgrade"
  };

const apkpure = {
  async search(query) {
    const url = `https://apkpure.net/search?q=${encodeURIComponent(query)}`;
    try {
      const response = await got(url, { headers: HEADERS });
      console.log("✅ CEKHRESPON", response);
      
      const html = response.body;
      console.log("✅ CEKHTML:", html);
      const $ = cheerio.load(html);
      const results = [];

      $(".search-brand-container").each((_, el) => {
        const title = $(el).find(".title-wrap a.top").attr("title")?.trim() || null;
        const linkPath = $(el).find(".title-wrap a.top").attr("href") || "";
        const link = linkPath.startsWith("http") ? linkPath : `https://apkpure.net${linkPath}`;
        const icon = $(el).find("img.app-icon-img").attr("data-original") || null;
        const developer = $(el).find(".developer").text().trim() || null;
        const updated = $(el).find(".time").text().trim() || null;
        const rating = $(el).find(".stars").first().text().trim() || null;
        const size = $(el).find('li[data-dt-desc="FileSize"] .head').text().trim() || null;
        const android = $(el).find('li[data-dt-desc="AndroidOS"] .head').text().trim() || null;
        const downloadPath = $(el).find(".brand-bottom a").attr("href");
        const download = downloadPath ? `https://apkpure.net${downloadPath}` : null;

        results.push({ title, developer, icon, link, rating, size, android, updated, download });
      });

      const terkait = [];
      $(".apk-list .apk-item").each((_, el) => {
        const title = $(el).attr("title") || null;
        const pkg = $(el).attr("data-dt-pkg") || null;
        const linkPath = $(el).attr("href") || "";
        const link = linkPath.startsWith("http") ? linkPath : `https://apkpure.net${linkPath}`;
        const icon = $(el).find("img").attr("data-original") || null;
        const developer = $(el).find(".dev").text().trim() || null;
        const rating = $(el).find(".stars").text().trim() || null;
        terkait.push({ title, package: pkg, icon, developer, rating, link });
      });

      return { results, terkait };
    } catch (error) {
      return {
        status: 500,
        error: error.message || "Terjadi kesalahan tak terduga saat memuat data dari ApkPure."
      };
    }
  },

  async detail(url) {
    try {
      const response = await got(url, { headers: HEADERS });
      const html = response.body;
      const $ = cheerio.load(html);

      const download = $("a.download_apk");
      const downloadTitle = download.attr("title")?.trim() || null;
      const downloadUrl = download.attr("href")?.trim() || null;
      const shortDesc = $(".description-short").text().trim() || null;
      const lastUpdated = $(".whats-new-timer").text().trim() || null;
      const whatsNew = $(".whats-new-content").text().trim() || null;

      const screenshots = [];
      $(".screen-swiper-list .swiper-item a.screen-pswp img").each((_, el) => {
        const img = $(el).attr("data-original");
        if (img) screenshots.push(img);
      });

      return {
        title: downloadTitle,
        download_url: downloadUrl,
        description: shortDesc,
        last_updated: lastUpdated,
        whats_new: whatsNew,
        screenshots,
      };
    } catch (error) {
      return {
        status: 500,
        error: error.message || "Terjadi kesalahan tak terduga saat memuat detail aplikasi."
      };
    }
  },

  async detailapk(url) {
    try {
      const response = await got(url, { headers: HEADERS });
      const html = response.body;
      const $ = cheerio.load(html);
      const result = {};

      const title = $("a.btn.download-start-btn").attr("title") || $(".title").first().text().trim();
      const versionText = $(".version-tips").text().trim();
      const latestVersion = versionText.match(/([\d.]+)/)?.[1] || null;
      const mainDownload = $("a.btn.download-start-btn").attr("href");
      const packageName = mainDownload?.match(/b\/APK\/([^?]+)/)?.[1]?.split("?")[0] || null;

      const versions = [];
      $(".version-item").each((_, el) => {
        const version = $(el).find(".version-info a").text().trim();
        const href = $(el).find(".version-info a").attr("href");
        const size = $(el).find(".size").text().trim();
        const date = $(el).find(".update").text().trim();
        if (href) versions.push({ version, size, date, href });
      });

      const allVersionsLink = $("a.more-version").attr("href");

      result.name = title || null;
      result.package = packageName || null;
      result.latest_version = latestVersion;
      result.download_url = mainDownload
        ? mainDownload.startsWith("http")
          ? mainDownload
          : `https://d.apkpure.net${mainDownload}`
        : null;
      result.all_versions = versions;
      result.all_versions_link = allVersionsLink
        ? `https://apkpure.net${allVersionsLink}`
        : null;

      return result;
    } catch (error) {
      return {
        status: 500,
        error: error.message || "Terjadi kesalahan tak terduga saat memuat detail aplikasi."
      };
    }
  },

  async download(url) {
    try {
      const res = await got(url, {
        method: "GET",
        headers: HEADERS,
        followRedirect: false
      });
      const location = res.headers.location;
      return { downloadUrl: location };
    } catch (error) {
      return {
        status: 500,
        error: error.message || "Gagal mendapatkan link unduhan dari ApkPure."
      };
    }
  }
};

export default apkpure;