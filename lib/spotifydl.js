import { fetch, FormData, Headers } from "undici";
import spotify from './spotify.js';

function encodeBase64(obj) {
  const json = JSON.stringify(obj);
  const urlEncoded = encodeURIComponent(json);
  return Buffer.from(urlEncoded).toString("base64");
}

function generateFileId() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function getLinkDownload(trackUrl) {
  const token = generateFileId();
  const form = new FormData();
  form.append("post_id", "25");
  form.append("form_id", "45dddc7");
  form.append("referer_title", "Free Spotify Music Downloads - SpotiDownloads");
  form.append("queried_id", "25");
  form.append("form_fields[music_url]", trackUrl);
  form.append("action", "elementor_pro_forms_send_form");
  form.append("referrer", `https://spotidownloads.com/downloads/?file=${token}`);

  const res = await fetch("https://spotidownloads.com/wp-admin/admin-ajax.php", {
    method: "POST",
    body: form,
    headers: new Headers({
      "accept": "application/json, text/javascript, */*; q=0.01",
      "x-requested-with": "XMLHttpRequest",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36",
      "referer": `https://spotidownloads.com/downloads/?file=${token}`,
    }),
  });

  const setCookie = res.headers.get("set-cookie");
  const cookie = setCookie ? setCookie.split(";")[0] : "";

  const resJson = await res.json();
  const redirectUrl = resJson?.data?.data?.["1"]?.redirect_url;
  if (!redirectUrl) throw new Error("Redirect URL not found");

  const afterEqual = redirectUrl.split("=").pop();

  return { uuid: afterEqual, cookie };
}

async function spodl(spoUrl) {
  try {
    const { uuid, cookie } = await getLinkDownload(spoUrl);

    const apiResult = await spotify.search(spoUrl);
    if (!apiResult || apiResult.length === 0) throw new Error("Spotify data not found");

    const resultSearch = apiResult[0];
    const buffer = encodeBase64(resultSearch);

    const downloadUrl = `https://spotidownloads.com/wp-admin/admin-ajax.php?action=process_music_download&data=${buffer}`;
    const headers = new Headers({
      "accept": "*/*",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36",
      "referer": `https://spotidownloads.com/download/?file=${uuid}`,
      "cookie": cookie
    });

    const res = await fetch(downloadUrl, { method: "GET", headers });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);

    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (err) {
    console.error("❌ Download failed:", err.message);
    throw err;
  }
}

export default spodl;