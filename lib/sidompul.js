import crypto from "crypto";
import { fetch } from "undici";

function generateSignature(...args) {
  const secret = "zhYqHrObvu62ZJOJeWADvp2a";
  if (!secret) throw new Error("Secret Missing!");

  const joined = args.join(".");
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(joined);
  const signature = hmac.digest("hex");

  return { signature };
}

async function sidompul(msisdn) {
  const timestamp = Date.now() + 10000;
  const { signature } = generateSignature(msisdn, timestamp);
  try {
    const res = await fetch("https://sidompul.violetvpn.biz.id/api/sidompul", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${signature}`,
      },
      body: JSON.stringify({ msisdn, timestamp })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to fetch data");
    }

    return data
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export default sidompul