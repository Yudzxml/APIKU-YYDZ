import { fetch, FormData, File } from "undici";

const API_KEY = "sk_df333e857d8dc9ca783e3e6dfc4dd7a1f0023ac81e649716";

async function spechtotext(fileUrl) {
  try {
    const audioRes = await fetch(fileUrl);
    if (!audioRes.ok) throw new Error(`Gagal download file: ${audioRes.statusText}`);
    const audioBuffer = Buffer.from(await audioRes.arrayBuffer());

    const form = new FormData();
    form.append("file", new File([audioBuffer], "audio.mp3", { type: "audio/mpeg" }));
    form.append("model_id", "scribe_v1");

    const response = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST",
      headers: { "xi-api-key": API_KEY },
      body: form
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(JSON.stringify(errorData));
    }

    const data = await response.json();
    return data.text
  } catch (err) {
    return { error: err.message }
  }
}

export default spechtotext
