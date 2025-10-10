import { fetch } from "undici";

function getIdFromUrl(url) {
  const cleanUrl = url.split("?")[0]; 
  const parts = cleanUrl.split("/");
  return parts[parts.length - 1] || null;
}

async function threads(url) {
  try {
    if (!url) throw new Error("URL tidak boleh kosong");

    const id = getIdFromUrl(url);
    if (!id) throw new Error("ID postingan tidak ditemukan di URL");

    const response = await fetch(`https://www.dolphinradar.com/api/threads/post_detail/${id}`, {
      method: "GET",
      headers: {
        "accept": "application/json, text/plain, */*",
        "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
        "sec-ch-ua": "\"Chromium\";v=\"139\", \"Not;A=Brand\";v=\"99\"",
        "sec-ch-ua-mobile": "?1",
        "sec-ch-ua-platform": "\"Android\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "tenantid": "6",
        "time-zone": "Asia/Jakarta",
        "Referer": "https://www.dolphinradar.com/threads-downloader",
        "Referrer-Policy": "strict-origin-when-cross-origin"
      }
    });

    if (!response.ok) {
      throw new Error(`Request gagal: ${response.status} ${response.statusText}`);
    }

    const body = await response.json();
    return body?.data || null;

  } catch (err) {
    console.error("Error fetching post detail:", err.message);
    return null;
  }
}

export default threads;