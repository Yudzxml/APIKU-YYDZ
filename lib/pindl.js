import * as cheerio from "cheerio";

async function pindl(pinUrl) {
  try {
    const initRes = await fetch("https://www.expertstool.com/download-pinterest-video/");
    const setCookie = initRes.headers.get("set-cookie");
    if (!setCookie) throw new Error("Cookie tidak ditemukan.");

    const response = await fetch("https://www.expertstool.com/download-pinterest-video/", {
      method: "POST",
      headers: {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Content-Type": "application/x-www-form-urlencoded",
        "Cookie": setCookie,
        "Referer": "https://www.expertstool.com/download-pinterest-video/",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "sec-ch-ua": '"Chromium";v="139", "Not;A=Brand";v="99"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Linux"',
      },
      body: new URLSearchParams({ url: pinUrl })
    });

    if (!response.ok) throw new Error("Gagal mendapatkan respon dari API.");

    const html = await response.text();
    const $ = cheerio.load(html);
    const downloadLink = $("a[download]").attr("href") || "";

    return downloadLink
  } catch (error) {
    console.error("Gagal fetch.", error.message);
    return null;
  }
}

export default pindl