import FormData from "form-data";
import crypto from "crypto";

const Keyyy = "05120a7d-66b6-4973-b8c4-d3604f7087e7:baef4baa908c8010604ade6d3076274b";
const BASE_URL = "https://ai-apps.codergautam.dev";

function acakName(len = 10) {
  const chars = "abcdefghijklmnopqrstuvwxyz";
  return Array.from({ length: len }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function BananaEdit(imageUrl, prompt = "Using the nano-banana model, a commercial 1/7 scale figurine of the character in the picture was created, depicting a realistic style and a realistic environment. The figurine is placed on a computer desk with a round transparent acrylic base. There is no text on the base. The computer screen shows the Zbrush modeling process of the figurine. Next to the computer screen is a BANDAI-style toy box with the original painting printed on it.") {
  const create = await fetch("https://queue.fal.run/fal-ai/gemini-25-flash-image/edit", {
    method: "POST",
    headers: {
      Authorization: `Key ${Keyyy}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": "@fal-ai/client/1.6.2"
    },
    body: JSON.stringify({ prompt, num_images: 1, output_format: "jpeg", image_urls: [imageUrl] })
  });
  const { status_url: statusUrl, response_url: responseUrl } = await create.json();
  let status = "WAIT";
  while (status !== "COMPLETED") {
    const res = await fetch(statusUrl, { headers: { Authorization: `Key ${Keyyy}` } });
    const data = await res.json();
    status = data.status;
    if (status === "FAILED") throw new Error("❌ Proses gagal dijalankan oleh Fal-AI server.");
    if (status !== "COMPLETED") await delay(2000);
  }
  const result = await fetch(responseUrl, { headers: { Authorization: `Key ${Keyyy}` } });
  const resultData = await result.json();
  if (!resultData?.images?.length) throw new Error("Tidak ada hasil gambar dari API Fal-AI.");
  const imageUrlOut = resultData.images[0].url;
  const imgRes = await fetch(imageUrlOut);
  const arrayBuffer = await imgRes.arrayBuffer();
  return { buffer: Buffer.from(arrayBuffer), mime: "image/jpeg" };
}

async function autoregist() {
  const uid = crypto.randomBytes(12).toString("hex");
  const email = `gienetic${Date.now()}@nyahoo.com`;
  const payload = { uid, email, displayName: acakName(), photoURL: "https://i.pravatar.cc/150", appId: "photogpt" };
  const res = await fetch(`${BASE_URL}/photogpt/create-user`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json", "user-agent": "okhttp/4.9.2" },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (data.success) return uid;
  throw new Error("Register gagal: " + JSON.stringify(data));
}

async function img2img(imageBuffer, prompt = "Using the nano-banana model, a commercial 1/7 scale figurine of the character in the picture was created, depicting a realistic style and a realistic environment. The figurine is placed on a computer desk with a round transparent acrylic base. There is no text on the base. The computer screen shows the Zbrush modeling process of the figurine. Next to the computer screen is a BANDAI-style toy box with the original painting printed on it.") {
  const uid = await autoregist();
  const form = new FormData();
  form.append("image", imageBuffer, { filename: "input.jpg", contentType: "image/jpeg" });
  form.append("prompt", prompt);
  form.append("userId", uid);
  const uploadRes = await fetch(`${BASE_URL}/photogpt/generate-image`, {
    method: "POST",
    headers: { ...form.getHeaders(), accept: "application/json", "user-agent": "okhttp/4.9.2" },
    body: form
  });
  const uploadData = await uploadRes.json();
  if (!uploadData.success) throw new Error(JSON.stringify(uploadData));
  const { pollingUrl } = uploadData;
  let status = "pending";
  let resultUrl = null;
  while (status !== "Ready") {
    const pollRes = await fetch(pollingUrl, { headers: { accept: "application/json", "user-agent": "okhttp/4.9.2" } });
    const pollData = await pollRes.json();
    status = pollData.status;
    if (status === "Ready") {
      resultUrl = pollData.result.url;
      break;
    }
    await delay(3000);
  }
  if (!resultUrl) throw new Error("Gagal mendapatkan hasil gambar (fallback).");
  const resultImg = await fetch(resultUrl);
  const arrayBuffer = await resultImg.arrayBuffer();
  return { buffer: Buffer.from(arrayBuffer), mime: "image/jpeg" };
}

async function imgedit(imageUrl, prompt) {
  try {
    return await BananaEdit(imageUrl, prompt);
  } catch (primaryErr) {
    try {
      const imgRes = await fetch(imageUrl);
      const arrayBuffer = await imgRes.arrayBuffer();
      return await img2img(Buffer.from(arrayBuffer), prompt);
    } catch (fallbackErr) {
      throw new Error(`Kedua layanan gagal: ${primaryErr.message} | ${fallbackErr.message}`);
    }
  }
}

export default imgedit;