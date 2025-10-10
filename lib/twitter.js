import { fetch } from "undici";

function parseTwitterDownloadLinks(html) {
  const links = [];
  const regex = /<a[^>]+href="([^"]+)"[^>]*class="[^"]*download_link[^"]*"[^>]*>\s*<span>([^<]+)<\/span>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    links.push({
      url: match[1],
      quality: match[2].trim().replace(/\s+/g, ' ')
    });
  }
  return links;
}

async function twitter(tweetUrl, { cookies = "", extraFields = {} } = {}) {
  try {
    if (!tweetUrl) throw new Error("URL kosong");

    const bodyObj = {
      id: tweetUrl,
      locale: "id",
      source: "form",
      ...extraFields
    };

    const formBody = new URLSearchParams(bodyObj).toString();

    const res = await fetch("https://ssstwitter.com/id", {
      method: "POST",
      headers: {
        "accept": "*/*",
        "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
        "hx-current-url": "https://ssstwitter.com/id",
        "hx-request": "true",
        "hx-target": "target",
        "sec-ch-ua": `"Chromium";v="139", "Not;A=Brand";v="99"`,
        "sec-ch-ua-mobile": "?1",
        "sec-ch-ua-platform": `"Android"`,
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "Referer": "https://ssstwitter.com/id",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        ...(cookies ? { cookie: cookies } : {})
      },
      body: formBody
    });

    if (!res.ok) throw new Error("HTTP " + res.status);

    const html = await res.text();
    return parseTwitterDownloadLinks(html);
  } catch (err) {
    return { ok: false, error: err.message || String(err) };
  }
}

export default twitter