import crypto from "crypto";
import { MongoClient } from "mongodb";

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
  ADMIN_APIKEY,
  getApiKey,
  getKeysFromMongo,
  saveKeyToMongo,
  deleteKeyFromMongo,
  generateRandomKey,
  formatDate,
};