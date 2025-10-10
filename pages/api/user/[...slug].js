import {
  updateSyteam,
  getSyteam,
  minLimit,
  checkApiKey,
  getUserInfo,
  editAnyUser,
  editUser,
  loginUser,
  registerUser,
  ADMIN_APIKEY
} from "../../../lib/apikeys.js";
import runSpeedTest from "../../../lib/system.js";

export default async function handler(req, res) {
  const { slug = [] } = req.query;
  const xapikey = req.headers["x-apikey"];
  const body = req.body || {};
  const query = req.query || {};

  // === Headers ===
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-apikey");

  if (req.method === "OPTIONS") return res.status(204).end();

  const action = slug[0];

  // === Admin actions ===
  const adminActions = ["addapikey", "editapikey", "delapikey", "updatecollection", "editanyuser"];
  if (adminActions.includes(action)) {
    if (!xapikey || xapikey !== ADMIN_APIKEY) {
      return res.status(403).json({ status: 403, error: "API key admin tidak valid" });
    }
  }

  try {
    let result;

    switch (action) {
      // --- Maintenance ---
      case "maintenance":
        result = await getSyteam();
        break;

      case "editmaintenance": {
        const active = body.active ?? query.active;
        if (active === undefined) throw { status: 400, message: "Parameter 'active' wajib diisi" };
        const isActive = active === 'true' || active === true;
        result = await updateSyteam(isActive);
        break;
      }

      // --- System ---
      case "status":
        result = await runSpeedTest();
        break;

      // --- User ---
      case "register": {
        const { email, password, deviceId } = body;
        result = await registerUser({ email, password, deviceId });
        break;
      }

      case "login": {
        const { email, password, deviceId } = body;
        result = await loginUser({ email, password, deviceId });
        break;
      }

      case "edituser": {
        const { email, updates } = body;
        result = await editUser({ email, updates });
        break;
      }

      case "editanyuser": {
        const { targetEmail, updates } = body;
        result = await editAnyUser({ adminKey: xapikey, targetEmail, updates });
        break;
      }

      case "getuserinfo": {
        const { email, deviceId } = query;
        result = await getUserInfo({ email, deviceId });
        break;
      }

      // --- API Key ---
      case "cekapikey": {
        const { apikey } = query;
        result = await checkApiKey(apikey);
        break;
      }

      case "minlimit": {
        const { apikey } = query;
        result = await minLimit(apikey);
        break;
      }

      default:
        return res.status(400).json({
          status: 400,
          author: "Yudzxml",
          error: "Action tidak valid",
        });
    }

    return res.status(200).json({
      status: 200,
      author: "Yudzxml",
      data: result,
    });

  } catch (err) {
    return res.status(err.status || 500).json({
      status: err.status || 500,
      author: "Yudzxml",
      error: err.message || "Terjadi kesalahan",
    });
  }
}