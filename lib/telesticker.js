const AZX = "5p3D5PMV4e8B1u6kl70";
const BOT_TOKEN = "7980044117:AAHX7k0gBH9HC445" + AZX;

// Ambil nama pack dari URL
function extractPackName(url) {
  const match = url.match(/addstickers\/([^/?]+)/);
  return match ? match[1] : null;
}

// Ambil data stiker dari Telegram
async function telesticker(url) {
  const packName = extractPackName(url);
  if (!packName) throw new Error("URL pack tidak valid");

  // Ambil info sticker set
  const res = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/getStickerSet?name=${packName}`
  );
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  const data = await res.json();

  const stickerSet = data.result;
  const stickers = stickerSet.stickers;

  const result = {
    pack_name: stickerSet.name,
    title: stickerSet.title,
    is_animated: stickerSet.is_animated,
    is_video: stickerSet.is_video,
    count: stickers.length,
    stickers: []
  };

  // Ambil full URL tiap stiker
  for (const s of stickers) {
    const fileRes = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${s.file_id}`
    );
    if (!fileRes.ok) throw new Error(`HTTP error! status: ${fileRes.status}`);
    const fileData = await fileRes.json();
    const filePath = fileData.result.file_path;
    const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`;
    result.stickers.push(fileUrl);
  }

  return result;
}

export default telesticker;