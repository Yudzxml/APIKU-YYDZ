import { fetch } from "undici";
import * as cheerio from "cheerio";

const fdroid = {
  search: async function (q) {
    try {
      if (!q) throw new Error("Parameter 'q' wajib diisi.");

      const response = await fetch(
        `https://search.f-droid.org/?q=${encodeURIComponent(q)}&lang=id`,
        {
          method: "GET",
          headers: {
            "accept":
              "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
            "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
            "cache-control": "no-cache",
            "pragma": "no-cache",
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "referer": "https://f-droid.org/",
          },
        }
      );

      const html = await response.text();
      const $ = cheerio.load(html);

      const hasil = [];

      $("a.package-header").each((_, el) => {
        const name = $(el).find(".package-name").text().trim();
        const link = $(el).attr("href");
        const icon = $(el).find(".package-icon").attr("src");
        const summary = $(el).find(".package-summary").text().trim();
        const license = $(el).find(".package-license").text().trim();

        hasil.push({
          name,
          link: link?.startsWith("http")
            ? link
            : `https://f-droid.org${link}`,
          icon: icon?.startsWith("http")
            ? icon
            : `https://f-droid.org${icon}`,
          summary,
          license,
        });
      });

      return hasil.length
        ? hasil
        : { status: false, message: "Tidak ada hasil ditemukan." };
    } catch (err) {
      return {
        status: false,
        message: `Terjadi kesalahan: ${err.message}`,
      };
    }
  },
  detail: async function (packageName) {
    try {
      if (!packageName) throw new Error("Parameter 'packageName' wajib diisi.");

      const url = packageName.startsWith("http")
        ? packageName
        : `https://f-droid.org/id/packages/${packageName}/`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "accept":
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
          "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });

      if (!response.ok)
        throw new Error(`Gagal mengambil data (${response.status})`);
      const html = await response.text();
      const $ = cheerio.load(html);

      // --- Info dasar ---
      const title = $(".package-name").text().trim();
      const summary = $(".package-summary").text().trim();
      const icon = $(".package-icon").attr("src");
      const description = $(".package-description")
        .text()
        .replace(/\s+/g, " ")
        .trim();

      // --- Link eksternal ---
      const links = {};
      $("#links .package-link").each((_, el) => {
        const id = $(el).attr("id");
        const a = $(el).find("a").attr("href");
        if (id && a)
          links[id] = a.startsWith("http") ? a : `https://f-droid.org${a}`;
      });

      // --- Screenshot list ---
      const screenshots = [];
      $("#screenshots img").each((_, el) => {
        const src = $(el).attr("src");
        if (src)
          screenshots.push(src.startsWith("http") ? src : `https://f-droid.org${src}`);
      });

      // --- Versi terbaru ---
      const latest = $(".package-version#latest");
      const versionName = latest.find(".package-version-header b").text().trim();
      const versionAdded = latest
        .find(".package-version-header")
        .text()
        .split("Ditambahkan pada")[1]
        ?.trim();
      const versionCodes = latest
        .find(".package-version-nativecode code")
        .map((_, c) => $(c).text().trim())
        .get();
      const versionRequirement = latest
        .find(".package-version-requirement")
        .text()
        .trim();
      const source = latest.find(".package-version-source a").attr("href");
      const download = latest.find(".package-version-download a[href$='.apk']").attr("href");
      const size =
        latest.find(".package-version-download").text().match(/(\d+)\s*MiB/i)?.[0] ||
        null;

      // --- Izin aplikasi ---
      const permissions = [];
      latest.find(".permission").each((_, el) => {
        const label = $(el).find(".permission-label").text().trim();
        const desc = $(el).find(".permission-description").text().trim();
        permissions.push({ label, description: desc || null });
      });

      // --- Versi lain ---
      const versions = [];
      $(".package-version").each((i, el) => {
        const name = $(el).find(".package-version-header b").text().trim();
        const date = $(el)
          .find(".package-version-header")
          .text()
          .split("Ditambahkan pada")[1]
          ?.trim();
        const apk = $(el).find(".package-version-download a[href$='.apk']").attr("href");
        if (name && apk) {
          versions.push({
            version: name,
            date: date || null,
            apk: apk.startsWith("http") ? apk : `https://f-droid.org${apk}`,
          });
        }
      });

      return {
        title,
        summary,
        icon: icon?.startsWith("http") ? icon : `https://f-droid.org${icon}`,
        description,
        links,
        screenshots,
        latest: {
          version: versionName,
          added: versionAdded,
          architectures: versionCodes,
          requirement: versionRequirement,
          size,
          download: download?.startsWith("http") ? download : `https://f-droid.org${download}`,
          source,
          permissions,
        },
        allVersions: versions,
      };
    } catch (e) {
      return {
        status: 500,
        author: "Yudzxml",
        error: e.message,
      };
    }
  },
};

// CONTOH PENGGUNAAN
// fdroid.search("termux")
// fdroid.detail("https://f-droid.org/id/packages/com.termux")

export default fdroid
