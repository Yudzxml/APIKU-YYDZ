import crypto from "crypto";
import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";

const ADMIN_APIKEY = process.env.APIKEY;
const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = "apikeysDB";

let client;
let db;

// Connect ke MongoDB
async function connectDB() {
  if (!client) {
    client = new MongoClient(MONGO_URI);
    await client.connect();
    db = client.db(DB_NAME);
  }
  return db;
}

// Ambil semua keys dari MongoDB
async function getKeysFromMongo() {
  const db = await connectDB();
  const collection = db.collection("keys");
  const keys = await collection.find({}).toArray();
  return keys.map(doc => ({
    key: doc.key,
    limit: doc.limit,
    initlimit: doc.initlimit,
    lastreset: doc.lastreset,
    expire: doc.expire,
  }));
}

// Ambil data satu key
async function getApiKey(key, ip) {
  console.log("NEW REQUEST\nIP: " + ip + " KEY: " + key);
  const db = await connectDB();
  const keyCollection = db.collection("keys");
  const now = Date.now();

  const doc = await keyCollection.findOne({ key });
  if (!doc) return { status: 404, message: "Apikeys Tidak Valid" };

  if (doc.expire && doc.expire <= now) return { status: 403, message: "Masa aktif apikeys telah habis" };

  if (doc.reset && (!doc.lastreset || now - doc.lastreset >= 24 * 60 * 60 * 1000)) {
    await keyCollection.updateOne({ key }, { $set: { limit: doc.initlimit, lastreset: now } });
    doc.limit = doc.initlimit;
    doc.lastreset = now;
  }

  if (doc.limit <= 0) return { status: 403, message: "Limit apikeys telah habis" };

  await keyCollection.updateOne({ key }, { $inc: { limit: -1 } });
  doc.limit -= 1;

  return {
    status: 200,
    key: doc.key,
    limit: doc.limit,
    initlimit: doc.initlimit,
    lastreset: doc.lastreset,
    expire: doc.expire,
  };
}

// Simpan atau update key
async function saveKeyToMongo(key, data) {
  const db = await connectDB();
  const collection = db.collection("keys");
  await collection.updateOne({ key }, { $set: { key, ...data } }, { upsert: true });
  return true;
}

// Hapus key
async function deleteKeyFromMongo(key) {
  const db = await connectDB();
  const collection = db.collection("keys");
  const res = await collection.deleteOne({ key });
  return res.deletedCount > 0;
}

// Registrasi user baru
async function registerUser({ email, password, deviceId }) {
  const db = await connectDB();
  const users = db.collection("users");

  if (!email || !password) {
    throw new Error("Email dan password wajib diisi");
  }

  const exists = await users.findOne({ email });
  if (exists) throw new Error("Email sudah terdaftar");

  if (deviceId) {
    const deviceUsed = await users.countDocuments({ deviceId });
    if (deviceUsed >= 1) {
      throw new Error("Device ini sudah digunakan untuk mendaftar akun");
    }
  }

  const hashed = await bcrypt.hash(password, 10);

  const user = {
    email,
    password: hashed,
    deviceId: deviceId || null,
    profile: null,
    banner: null,
    role: "user",
    createdAt: Date.now(),
  };

  await users.insertOne(user);

  return { 
    email: user.email, 
    role: user.role, 
    createdAt: user.createdAt, 
    deviceId: user.deviceId 
  };
}

async function loginUser({ email, password }) {
  const db = await connectDB();
  const users = db.collection("users");

  // cek user
  const user = await users.findOne({ email });
  if (!user) throw new Error("User tidak ditemukan");

  // cek password
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new Error("Password salah");

  // generate API key baru
  const newKey = generateRandomKey(16);
  const now = Date.now();

  const keyData = {
    key: newKey,
    limit: 100,
    initlimit: 100,
    lastreset: now,
    reset: true,
    expire: null,
  };

  await saveKeyToMongo(newKey, keyData);
  
  return {
    email: user.email,
    profile: user.profile || null,
    banner: user.banner || null,
    role: user.role || "user",
    apikey: newKey,
    limit: keyData.limit,
    expiry: keyData.expire,
  };
}

// Edit user (profile/banner/dll)
async function editUser(email, update, role = "user") {
  const db = await connectDB();
  const users = db.collection("users");
  const allowedForUser = ["password", "profile", "banner"];
  let allowedFields = role === "admin" ? Object.keys(update) : allowedForUser;
  const safeUpdate = {};
  for (const field of allowedFields) {
    if (update[field] !== undefined) {
      if (field === "password") {
        safeUpdate.password = await bcrypt.hash(update.password, 10);
      } else {
        safeUpdate[field] = update[field];
      }
    }
  }

  if (Object.keys(safeUpdate).length === 0) {
    throw new Error("Tidak ada field yang boleh diubah");
  }

  await users.updateOne({ email }, { $set: safeUpdate });
  return { email, updated: Object.keys(safeUpdate) };
}

// Generate random key
function generateRandomKey(length = 16) {
  return crypto.randomBytes(length).toString("hex");
}

// Format tanggal
function formatDate(timestamp) {
  if (!timestamp) return null;
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

// Export semua fungsi
export {
  registerUser,
  loginUser,
  editUser,
  ADMIN_APIKEY,
  getApiKey,
  getKeysFromMongo,
  saveKeyToMongo,
  deleteKeyFromMongo,
  generateRandomKey,
  formatDate,
};