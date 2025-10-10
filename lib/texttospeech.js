import { request, fetch } from "undici";
import FormData from "form-data";

async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}

async function YudzCdnV2(buffer, fileName) {
  const form = new FormData();
  form.append("file", buffer, { filename: fileName });

  const { body } = await request("https://apiku.x-server.my.id/api/v2/upload", {
    method: "POST",
    body: form,
    headers: form.getHeaders()
  });

  const res = await body.json();
  if (res && res.success) return res;
  throw new Error(res?.message || "Upload gagal");
}

async function textToSpeech(text) {
  const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
    text
  )}&tl=id&total=1&idx=0&textlen=${text.length}&client=tw-ob&prev=input&ttsspeed=1`;

  const response = await fetch(ttsUrl, {
    headers: { "User-Agent": "Mozilla/5.0" }
  });

  if (!response.ok) throw new Error(`TTS request gagal: ${response.status}`);
  const buffer = Buffer.from(await response.arrayBuffer());

  const fileName = `tts_${Date.now()}.mp3`;
  const data = await YudzCdnV2(buffer, fileName);
  return data.result?.url || null;
}

export default textToSpeech;
