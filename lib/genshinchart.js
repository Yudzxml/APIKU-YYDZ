import genshin from "genshin-api";

async function genshinchart(text) {
  try {
    const result = await genshin.Characters(text);
    return result;
  } catch {
    return null;
  }
}

export default genshinchart