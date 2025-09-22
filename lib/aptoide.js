const APIs = {
  1: "https://apkcombo.com",
  2: "https://apk-dl.com",
  3: "https://apk.support",
  4: "https://apps.evozi.com/apk-downloader",
  5: "http://ws75.aptoide.com/api/7",
  6: "https://cafebazaar.ir",
};

const Proxy = (url) =>
  url
    ? `https://translate.google.com/translate?sl=en&tl=fr&hl=en&u=${encodeURIComponent(
        url
      )}&client=webapp`
    : "";

const api = (ID, path = "/", query = {}) =>
  (ID in APIs ? APIs[ID] : ID) +
  path +
  (query && Object.keys(query).length
    ? "?" + new URLSearchParams(query).toString()
    : "");

const tools = {
  APIs,
  Proxy,
  api,
};

const aptoide = {
  search: async function (args) {
    try {
      const res = await fetch(
        tools.api(5, "/apps/search", {
          query: args,
          limit: 1000,
        })
      );
      if (!res.ok) throw new Error(`Request gagal: ${res.status}`);
      const data = await res.json();
      return data.datalist.list.map((v) => ({
        name: v.name,
        id: v.package,
      }));
    } catch (err) {
      console.error("Gagal mencari aplikasi:", err.message);
      return [];
    }
  },

  download: async function (id) {
    try {
      const res = await fetch(
        tools.api(5, "/apps/search", {
          query: id,
          limit: 1,
        })
      );
      if (!res.ok) throw new Error(`Request gagal: ${res.status}`);
      const data = await res.json();
      const app = data.datalist.list[0];
      return {
        img: app.icon,
        developer: app.store.name,
        appname: app.name,
        link: app.file.path,
      };
    } catch (err) {
      console.error("Gagal mengambil info download:", err.message);
      return null;
    }
  },
};

export default aptoide;