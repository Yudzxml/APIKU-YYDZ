import {
  ADMIN_APIKEY,
  getKeysFromMongo,
  getApiKey,
  saveKeyToMongo,
  deleteKeyFromMongo,
  formatDate
} from '../../../lib/apikeys.js';

export default async function handler(req, res) {
  const { slug = [] } = req.query;
  const { key, limit = 100, expireDays = null, reset = true } = req.query;
  const xapikey = req.headers["x-apikey"];

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-apikey");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method Not Allowed" });
  if (!key) return res.status(400).json({ status: 400, error: "Parameter 'key' wajib diisi" });

  const action = slug[0];
  const adminActions = ["addapikey", "editapikey", "delapikey"];

  if (adminActions.includes(action)) {
    if (!xapikey || xapikey !== ADMIN_APIKEY) {
      return res.status(403).json({ status: 403, error: "API key admin tidak valid" });
    }
  }

  const actionsMap = {
  addapikey: async () => {
    const keys = await getKeysFromMongo();
    const exists = keys.find(k => k.key === key);
    if (exists) throw { status: 400, message: "Key sudah ada di database" };

    const now = Date.now();
    const expireDate = expireDays
      ? now + parseInt(expireDays) * 24 * 60 * 60 * 1000
      : null;

    const keyData = {
      key,
      limit: parseInt(limit),
      initlimit: parseInt(limit),
      lastreset: now,
      reset: Boolean(reset),
      expire: expireDate
    };

    await saveKeyToMongo(key, keyData);
    return keyData;
  },

  delapikey: async () => {
    const success = await deleteKeyFromMongo(key);
    if (!success) throw { status: 404, message: "Key tidak ditemukan" };
    return { message: "API key berhasil dihapus" };
  },

  editapikey: async () => {
    const keys = await getKeysFromMongo();
    const found = keys.find(k => k.key === key);
    if (!found) throw { status: 404, message: "Key tidak ditemukan" };

    const newLimit = limit ? parseInt(limit) : found.limit;
    let newExpire = found.expire;

    if (expireDays) {
      const now = Date.now();
      const additionalMs = parseInt(expireDays) * 24 * 60 * 60 * 1000;
      newExpire = !newExpire || newExpire < now
        ? now + additionalMs
        : newExpire + additionalMs;
    }

    const updatedData = {
      ...found,
      limit: newLimit,
      expire: newExpire
    };

    await saveKeyToMongo(key, updatedData);
    return { key, limit: newLimit, expire: formatDate(newExpire) };
  },

  checkapikey: async () => {
    if (!key) throw { status: 400, message: "parameter 'key' wajib untuk cekapikey" };

    const keys = await getKeysFromMongo();
    const found = keys.find(k => k.key === key);
    if (!found) throw { status: 404, message: "invalid Apikeys" };

    return {
      key: found.key,
      limit: found.limit,
      expired: formatDate(found.expire)
    };
  }
};
  try {
    if (!actionsMap[action]) {
      return res.status(400).json({
        status: 400,
        author: "Yudzxml",
        error: "Action tidak valid. Gunakan addapikey, delapikey, checkapikey, editapikey"
      });
    }

    const result = await actionsMap[action]();
    return res.status(200).json({ status: 200, author: "Yudzxml", data: result });
  } catch (err) {
    return res.status(err.status || 500).json({
      status: err.status || 500,
      author: "Yudzxml",
      error: err.message || "Terjadi kesalahan"
    });
  }
}