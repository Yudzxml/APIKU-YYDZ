import crypto from "crypto";
import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";

const ADMIN_APIKEY = process.env.APIKEY;
const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = "apikeysDB";
const KEY_SECRET = process.env.KEY_SECRET || null;

let client;
let db;

async function connectDB() {
  if (!MONGO_URI) throw new Error("MONGO_URI environment variable is required");

  if (!client) {
    client = new MongoClient(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();
    db = client.db(DB_NAME);
    console.log("✅ MongoDB connected to:", DB_NAME);
  }
  return db;
}

function generateRandomKey(length = 7) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = crypto.randomBytes(length);
  let key = "";
  for (let i = 0; i < length; i++) {
    key += chars[bytes[i] % chars.length];
  }
  return key;
}

async function registerUser({ email, password, deviceId }) {
  const _db = await connectDB();
  const users = _db.collection("users");

  if (!email || !password) throw new Error("Email dan password wajib diisi");

  const exists = await users.findOne({ email });
  if (exists) throw new Error("Email sudah terdaftar");

  if (deviceId) {
    const deviceUsed = await users.countDocuments({ deviceId });
    if (deviceUsed >= 1) throw new Error("Device ini sudah digunakan untuk mendaftar akun");
  }

  const hashed = await bcrypt.hash(password, 10);
  const apikey = generateRandomKey(7);
  const now = Date.now();

  const user = {
    email,
    password: hashed,
    deviceId: deviceId || null,
    profile: null,
    banner: null,
    role: "user",
    apikey,
    limit: 100,
    initLimit: 100,
    expired: null,
    lastreset: now,
    createdAt: now
  };

  const result = await users.insertOne(user);

  return {
    email,
    role: user.role,
    apikey: user.apikey,
    createdAt: user.createdAt,
    deviceId: user.deviceId,
    limit: user.limit,
    initLimit: user.initLimit,
    expired: user.expired
  };
}

async function loginUser({ email, password, deviceId }) {
  if (!email || !password) throw new Error("Email dan password wajib diisi");

  const _db = await connectDB();
  const users = _db.collection("users");

  const user = await users.findOne({ email });
  if (!user) throw new Error("Email tidak ditemukan");

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new Error("Password salah");

  if (deviceId && user.deviceId && user.deviceId !== deviceId) {
    throw new Error("Device tidak cocok dengan akun ini");
  }

  return {
    email: user.email,
    role: user.role,
    apikey: user.apikey,
    createdAt: user.createdAt,
    limit: user.limit,
    expired: user.expired,
    profile: user.profile,
    banner: user.banner
  };
}

async function editUser({ email, updates }) {
  if (!email) throw new Error("Email wajib diisi");
  if (!updates || typeof updates !== "object") throw new Error("Data update wajib diberikan");

  const _db = await connectDB();
  const users = _db.collection("users");

  const user = await users.findOne({ email });
  if (!user) throw new Error("User tidak ditemukan");

  const allowedFields = ["profile", "banner"];
  if (user.role === "premium" || user.role === "admin") {
    allowedFields.push("apikey");
  }

  const updateData = {};
  for (const key of allowedFields) {
    if (updates[key] !== undefined) updateData[key] = updates[key];
  }

  if (Object.keys(updateData).length === 0) throw new Error("Tidak ada field yang boleh diupdate untuk role ini");

  const result = await users.updateOne(
    { email },
    { $set: updateData }
  );

  return {
    email: user.email,
    role: user.role,
    ...updateData
  };
}

async function editAnyUser({ adminKey, targetEmail, updates = {} }) {
  if (!adminKey) throw new Error("adminKey wajib disertakan");
  if (adminKey !== ADMIN_APIKEY) throw new Error("adminKey tidak valid");
  if (!targetEmail) throw new Error("targetEmail wajib diisi");
  if (!updates || typeof updates !== "object") throw new Error("updates harus object");

  const _db = await connectDB();
  const users = _db.collection("users");

  const user = await users.findOne({ email: targetEmail });
  if (!user) throw new Error("User target tidak ditemukan");

  const updateDoc = {};
  const now = Date.now();

  // --- EMAIL ---
  if (updates.email && updates.email !== user.email) {
    const exist = await users.findOne({ email: updates.email });
    if (exist) throw new Error("Email baru sudah terdaftar oleh user lain");
    updateDoc.email = updates.email;
  }

  // --- PASSWORD ---
  if (updates.password !== undefined && updates.password !== null && updates.password !== "") {
    const hashed = await bcrypt.hash(String(updates.password), 10);
    updateDoc.password = hashed;
  }

  // --- PROFILE, BANNER, ROLE, APIKEY, ---
  const simpleFields = ["profile", "banner", "role", "apikey", "deviceId", "name", "phone"];
  for (const f of simpleFields) {
    if (Object.prototype.hasOwnProperty.call(updates, f)) {
      updateDoc[f] = updates[f];
    }
  }

  // --- LIMIT & INITLIMIT ---
  if (Object.prototype.hasOwnProperty.call(updates, "limit")) {
    const val = Number(updates.limit);
    if (Number.isNaN(val)) throw new Error("limit harus number");
    if (val < 0) {
      const base = typeof user.limit === "number" ? user.limit : 0;
      updateDoc.limit = Math.max(0, base + val);
    } else {
      updateDoc.limit = val;
    }
  }

  if (Object.prototype.hasOwnProperty.call(updates, "initLimit")) {
    const val = Number(updates.initLimit);
    if (Number.isNaN(val)) throw new Error("initLimit harus number");
    if (val < 0) {
      const base = typeof user.initLimit === "number" ? user.initLimit : 0;
      updateDoc.initLimit = Math.max(0, base + val);
    } else {
      updateDoc.initLimit = val;
    }
  }

  // --- EXPIRED ---
  if (Object.prototype.hasOwnProperty.call(updates, "expired")) {
    const e = updates.expired;
    if (e === null) {
      updateDoc.expired = null;
    } else if (typeof e === "number") {
      const baseTs = user.expired ? Number(user.expired) : now;
      const newTs = baseTs + Math.round(e) * 24 * 60 * 60 * 1000;
      updateDoc.expired = newTs;
    } else if (typeof e === "string") {
      const parsed = Date.parse(e);
      if (Number.isNaN(parsed)) throw new Error("expired string tidak bisa di-parse");
      updateDoc.expired = parsed;
    } else {
      throw new Error("updates.expired harus null | number(hari) | ISO date string");
    }
  }

  // --- _raw untuk field custom ---
  if (updates._raw && typeof updates._raw === "object") {
    for (const [k, v] of Object.entries(updates._raw)) {
      if (k === "password") continue;
      updateDoc[k] = v;
    }
  }

  if (Object.keys(updateDoc).length === 0) throw new Error("Tidak ada perubahan yang diberikan");

  updateDoc.updatedAt = now;

  const res = await users.findOneAndUpdate(
    { email: targetEmail },
    { $set: updateDoc },
    { returnDocument: "after" }
  );

  const updated = res.value;
  if (!updated) throw new Error("Gagal melakukan update");

  const sanitized = { ...updated };
  if (sanitized.password) delete sanitized.password;

  return sanitized;
}

async function getUserInfo({ email, deviceId }) {
  if (!email && !deviceId) throw new Error("Email atau deviceId wajib diisi");

  const _db = await connectDB();
  const users = _db.collection("users");

  const query = {};
  if (email) query.email = email;
  if (deviceId) query.deviceId = deviceId;

  const user = await users.findOne(query);
  if (!user) throw new Error("User tidak ditemukan");

  return {
    email: user.email,
    profile: user.profile || null,
    banner: user.banner || null,
    expired: user.expired || null,
    limit: user.limit || 0,
    createdAt: user.createdAt || null,
    role: user.role || "user",
    apikey: user.apikey || null
  };
}

async function checkApiKey(apikey) {
  if (!apikey) throw new Error("API key wajib diisi");

  const _db = await connectDB();
  const users = _db.collection("users");

  const user = await users.findOne({ apikey });
  if (!user) throw new Error("API key tidak valid");

  return {
    apikey: user.apikey,
    limit: user.limit || 0,
    expired: user.expired || null
  };
}

async function minLimit(apikey) {
  if (!apikey) throw new Error("API key wajib diisi");

  const _db = await connectDB();
  const users = _db.collection("users");

  const user = await users.findOne({ apikey });
  if (!user) throw new Error("API key tidak valid");

  const now = Date.now();
  const today = new Date();
  const currentDay = today.toDateString();
  let updateDoc = {};

  // --- CEK PREMIUM EXPIRED ---
  if (user.role === "premium" && user.expired && now > user.expired) {
    updateDoc = {
      role: "user",
      limit: 100,
      initLimit: 100,
      expired: null,
      lastreset: now
    };
  }

  // --- CEK RESET HARIAN ---
  if (["user", "premium"].includes(user.role)) {
    const lastResetDay = user.lastreset ? new Date(user.lastreset).toDateString() : null;
    if (lastResetDay !== currentDay) {
      updateDoc.limit = user.initLimit || 100;
      updateDoc.lastreset = now;
    }
  }

  // --- BUILD UPDATE QUERY ---
  let updateQuery = {};
  if (Object.keys(updateDoc).length) updateQuery.$set = updateDoc;

  // --- DECREMENT LIMIT UNTUK USER & PREMIUM ---
  if (["user", "premium"].includes(user.role)) {
    if (!updateQuery.$set) updateQuery.$set = {};
    if (user.limit <= 0) {
      // Limit habis, tetap return data
      return {
        email: user.email,
        role: user.role,
        limit: 0,
        initLimit: user.initLimit,
        expired: user.expired
      };
    }
    updateQuery.$inc = { limit: -3 };
  }

  // --- EXECUTE UPDATE ---
  let resultUser;
  if (Object.keys(updateQuery).length) {
    const res = await users.findOneAndUpdate(
      { apikey },
      updateQuery,
      { returnDocument: "after" }
    );
    resultUser = res.value;
  } else {
    resultUser = user;
  }

  // Pastikan limit tidak negatif
  const finalLimit = Math.max(resultUser.limit, 0);

  return {
    email: resultUser.email,
    role: resultUser.role,
    limit: finalLimit,
    initLimit: resultUser.initLimit,
    expired: resultUser.expired
  };
}

async function getSyteam() {
  const db = await connectDB();
  const syteam = db.collection('syteam');
  await syteam.updateOne(
    { _id: 'status' },
    {
      $setOnInsert: {
        maintenance: false,
        date: new Date()
      }
    },
    { upsert: true }
  );

  const data = await syteam.findOne({ _id: 'status' });
  return data;
}

async function updateSyteam(isActive) {
  const db = await connectDB();
  const syteam = db.collection('syteam');

  const result = await syteam.updateOne(
    { _id: 'status' },
    {
      $set: {
        maintenance: isActive,
        date: new Date()
      }
    },
    { upsert: true }
  );

  return result.modifiedCount > 0
    ? { success: true, message: 'Maintenance status updated' }
    : { success: false, message: 'No changes made' };
}

export {
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
};