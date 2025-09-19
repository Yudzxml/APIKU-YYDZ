import * as cheerio from "cheerio";

async function fdownloader(url) {
  try {
    const postData = new URLSearchParams({
      k_exp: "1754457436",
      k_token: "2ed0c13433c8b138a0cd3027c8be2dd4991dfbffa7da3cb0301ad3e90b048a02",
      q: url,
      lang: "en",
      web: "fdownloader.net",
      v: "v2",
      w: "",
      cftoken: "0.-ArK7vd_qe_ejgXxDTIpIC0JmEEGx6vaxLdg60brAHJPCwsdzmT0fItkD849ZdN5QGyfG9DcpM5OrkR2kWWtcu20xvxdEKZv89Alzqa_lH_1Kn6nvvy5WL5MQ7EqxSLJ-bcSYJPBgOP-WGr4shNTn4rJ0C-djLOOJOcyWRntqsPp6VMamfJBfxm00M8bJZYP3owMSx53OeC8hTvbqcUrLwu28CRGUzjTyCAZV7FiVJjjr89-a2eqgs-4lE57Qq_dgb-huFh5Wmi6WRlz9_V9yII5N1JyiU08OsAk1jtpsmd_Oe2Ru3JOX9GEJVWOA163-hQa8rGyRi8aVceWe8y1toAK3wZBSWi9PqBE4BRtj7yxhH_DgxB4fJy94hP4jsMzcBfBe_SJklksmX9jHWGxOcyXVuPqzAHFp6GjT0jg5lSPjGdM6NFXJrR8n3IQxWzOGcs1FB92YRSnVRYDw6AVLn9eTxkxXJFrPGY0FOOJZSTxyuCNIccWgYbXo89aKc7KdNHbQ-f2hgY36iU2iV7ks2NVB-2J5af5GHo4Q4Rvl6zdzn2qOb3gu22OSqLlCRgjCTxhL_kwqjyvLoXK651nOcfQsyTG-hfuBnUIRm0WJejW0173gmzV26gWU5eVxscY93EobF_T87z2qy3AJ0cGaxnA-PqVx17Ya4FVm7A3w1S4H8oCQsHJQlu1A2lC0mzy__05fYTR8HvKrEiyucvzUqHNhx5GgLDPNl8AFXqe-L0jMjpIJ1pIkkpUiLPkQ-zq9uLymhspOxOW9l_qWZLz_kus84T78CJjWKq8bbcY1DDONCpn9gXIPCzhJqqr5Fhm0QgX_Ld-EDhJp7uxtbuxG6j9ZE2EvE8DILHDzwfNamg.aNbJWG5bfciqQKFWA1sKFQ.ef303c193c5dd855e89d1de0d7c0019ccffb0db1be3efc5f9a391f5e28ec9631"
    });

    const res = await fetch("https://v3.fdownloader.net/api/ajaxSearch", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
      body: postData.toString()
    });

    const data = await res.json();
    if (data.status !== "ok") throw new Error("FDownloader gagal");

    const $ = cheerio.load(data.data);
    const videos = [];
    $("table tbody tr").each((i, el) => {
      const quality = $(el).find(".video-quality").text().trim();
      const link = $(el).find("a.download-link-fb").attr("href") || $(el).find("button").attr("data-videourl");
      if (link) videos.push({ quality, url: link });
    });

    return { videos };
  } catch (err) {
    return { error: err.message };
  }
}

async function fbdownloader(url) {
  try {
    const postData = new URLSearchParams({
      k_exp: "1755212077",
      k_token: "672822c9421709f09e1e0c2a8cfb8c39923952eaa79daac33680a0e66920aafb",
      p: "home",
      q: url,
      lang: "en",
      v: "v2",
      w: ""
    });

    const res = await fetch("https://fbdownloader.to/api/ajaxSearch", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "X-Requested-With": "XMLHttpRequest"
      },
      body: postData.toString()
    });

    const data = await res.json();
    if (data.status !== "ok") throw new Error("FBDownloader gagal");

    const $ = cheerio.load(data.data);
    const videos = [];
    $("table tbody tr").each((_, el) => {
      const quality = $(el).find(".video-quality").text().trim();
      const link = $(el).find("a.download-link-fb").attr("href") || $(el).find("button").attr("data-videourl");
      if (link) videos.push({ quality, url: link });
    });

    return { videos };
  } catch (err) {
    return { error: err.message };
  }
}

async function fvdownloader(url) {
  try {
    const postData = new URLSearchParams({ query: url, downloader: "video" });
    const res = await fetch("https://fvdownloader.net/req", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8", "X-Requested-With": "XMLHttpRequest" },
      body: postData.toString()
    });

    const data = await res.json();
    if (data.error) throw new Error("FvDownloader gagal");

    const $ = cheerio.load(data.html);
    const downloadLinks = [];
    $(".meta ul li a.btn-blue").each((i, el) => {
      const quality = $(el).text().match(/\((.*?)\)/)?.[1] || "Unknown";
      downloadLinks.push({ quality, url: $(el).attr("href") });
    });

    return { downloadLinks };
  } catch (err) {
    return { error: err.message };
  }
}

async function snapsave(url) {
  try {
    const postData = new URLSearchParams({ p: "home", q: url, lang: "en", w: "" });
    const res = await fetch("https://snapsave.io/api/ajaxSearch", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8", "X-Requested-With": "XMLHttpRequest" },
      body: postData.toString()
    });

    const data = await res.json();
    const $ = cheerio.load(data.data);
    const videos = [];
    $("table tbody tr").each((i, el) => {
      const quality = $(el).find(".video-quality").text().trim();
      const link = $(el).find("a.button").attr("href") || $(el).find("button.button").attr("data-videourl");
      if (link) videos.push({ quality, url: link });
    });

    return { videos };
  } catch (err) {
    return { error: err.message };
  }
}

async function fbdl(url) {
  const services = [fdownloader, fbdownloader, fvdownloader, snapsave];

  for (const service of services) {
    try {
      const result = await service(url);
      if (!result.error && ((result.videos && result.videos.length) || (result.downloadLinks && result.downloadLinks.length))) {
        return result;
      }
    } catch {}
  }

  return { error: "Semua layanan gagal" };
}

export default fbdl;