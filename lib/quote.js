const colorMap = {
  black: "#000000",
  white: "#FFFFFF",
  blue: "#0000FF",
  red: "#FF0000",
  green: "#00FF00",
  yellow: "#FFFF00",
  purple: "#800080",
  pink: "#FFC0CB",
  gray: "#808080",
};

const generateQuote = async (text, name, avatar, color = "white") => {
  const backgroundColor = colorMap[color.toLowerCase()] || "#FFFFFF";

  const json = {
    type: "quote",
    format: "png",
    backgroundColor,
    width: 512,
    height: 768,
    scale: 2,
    messages: [
      {
        entities: [],
        avatar: true,
        from: {
          id: 1,
          name,
          photo: { url: avatar },
        },
        text,
        replyMessage: {},
      },
    ],
  };

  const res = await fetch("https://bot.lyo.su/quote/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(json),
  });

  if (!res.ok) {
    throw new Error(`Failed to generate quote: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();

  return Buffer.from(data.result.image, "base64");
};

export default generateQuote;