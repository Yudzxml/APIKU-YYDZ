import { fetch } from "undici"

async function getNonce() {
  try {
    const response = await fetch("https://teradownloadr.com/", {
      headers: {
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
        "user-agent": "Mozilla/5.0 (Linux; Android 11) Chrome/139.0.0.0 Mobile Safari/537.36"
      }
    });

    const html = await response.text();
    const nonceMatch = html.match(/"nonce":"([a-zA-Z0-9]+)"/);
    if (!nonceMatch) throw new Error("Nonce tidak ditemukan di halaman utama!");

    return nonceMatch[1];
  } catch (err) {
    console.error("❌ Gagal ambil nonce:", err.message);
    return null;
  }
}

async function terabox(fileUrl) {
  try {
    const nonce = await getNonce();
    if (!nonce) throw new Error("Nonce tidak valid!");

    const url = "https://teradownloadr.com/wp-admin/admin-ajax.php";
    const headers = {
      "accept": "*/*",
      "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      "x-requested-with": "XMLHttpRequest",
      "user-agent": "Mozilla/5.0 (Linux; Android 11) Chrome/139.0.0.0 Mobile Safari/537.36",
      "Referer": "https://teradownloadr.com/"
    };

    const body = new URLSearchParams({
      action: "terabox_fetch",
      url: fileUrl,
      nonce
    });

    const response = await fetch(url, { method: "POST", headers, body });
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);

    const result = await response.json();
    const data = result?.data || {};

    const folderKey = Object.keys(data).find(k => /folder/i.test(k)) || "folders";
    const fileKey = Object.keys(data).find(k => /file/i.test(k)) || "files";

    const folders = Array.isArray(data[folderKey]) ? data[folderKey] : [];
    const files = Array.isArray(data[fileKey]) ? data[fileKey] : [];

    const safeFiles = files.map(f => ({
      name: f?.["📂 Name"] || f?.name || f?.title || "",
      size: f?.["📏 Size"] || f?.size || "",
      type: f?.["📋 Type"] || f?.type || "",
      path: f?.["📍 Full Path"] || f?.path || "",
      download: f?.["🔽 Direct Download Link"] || f?.download || f?.url || "",
      thumbnail: f?.["🖼️ Thumbnails"]?.["360x270"] || f?.thumbnail || null
    }));

    return {
      shortlink: data["🔗 ShortLink"] || "",
      summary: data["📊 Summary"] || {},
      files: safeFiles
    };

  } catch (err) {
    console.error("❌ Terjadi kesalahan:", err.message);
    return { success: false, error: err.message };
  }
}

export default terabox
  