import got from 'got';
import { URLSearchParams } from 'url';

async function gdrivedl(link) {
  const regex = /\/d\/([a-zA-Z0-9_-]+)/;
  const match = link.match(regex);
  let fileId = match ? match[1] : null;
  if (!fileId) {
    const queryRegex = /[?&]id=([a-zA-Z0-9_-]+)/;
    const qMatch = link.match(queryRegex);
    if (qMatch) fileId = qMatch[1];
  }
  if (!fileId) {
    return { status: "error", message: "❌ Invalid Google Drive link" };
  }

  const baseUrl = `https://docs.google.com/uc?export=download&id=${fileId}`;
  const res = await got(baseUrl, { responseType: 'text' });
  const html = res.body;

  const actionMatch = html.match(/<form[^>]+action="([^"]+)"/);
  const actionUrl = actionMatch ? actionMatch[1] : null;

  const inputs = {};
  const inputRegex = /<input[^>]+type="hidden"[^>]+>/g;
  let m;
  while ((m = inputRegex.exec(html)) !== null) {
    const name = m[0].match(/name="([^"]+)"/);
    const value = m[0].match(/value="([^"]*)"/);
    if (name && value) inputs[name[1]] = value[1];
  }

  const nameSizeMatch = html.match(/<span class="uc-name-size">([\s\S]*?)<\/span>/);
  let fileName = null;
  let fileSize = null;
  if (nameSizeMatch) {
    const spanContent = nameSizeMatch[1];
    const nameMatch = spanContent.match(/<a[^>]*>([^<]+)<\/a>/);
    const sizeMatch = spanContent.match(/\)\s*([^<]+)\s*\)?$/) || spanContent.match(/\(([^)]+)\)/);
    fileName = nameMatch ? nameMatch[1].trim() : null;
    fileSize = sizeMatch ? sizeMatch[1].trim() : null;
  }

  if (!actionUrl) {
    return { status: "error", message: "❌ No download form found", values: { fileId, fileName, fileSize } };
  }

  const query = new URLSearchParams(inputs).toString();
  const finalUrl = `${actionUrl}?${query}`;

  if (!finalUrl.startsWith("https://")) {
    return { status: "error", message: "🚫 File tidak memiliki akses publik atau link tidak valid", values: { fileId, fileName, fileSize } };
  }

  return {
    fileId,
    fileName,
    fileSize,
    downloadUrl: finalUrl
  };
}

export default gdrivedl