import crypto from "crypto";
import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";

const ADMIN_APIKEY = process.env.APIKEY;
const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = process.env.DB_NAME || "apikeysDB";
const KEY_SECRET = process.env.KEY_SECRET || null;

let client;
let db;

// ================ DB HANDLER ==================
async function connectDB() {
  if (!MONGO_URI) throw new Error("MONGO_URI environment variable is required");

  if (!client) {
    client = new MongoClient(MONGO_URI);
    await client.connect();
    db = client.db(DB_NAME);
    console.log("✅ MongoDB connected to:", DB_NAME);
  }
  return db;
}

async function closeDB() {
  if (client) {
    try {
      await client.close();
      console.log("🛑 MongoDB connection closed");
    } catch (e) {
      console.error("Error closing MongoDB client:", e);
    } finally {
      client = null;
      db = null;
    }
  }
}

// Tutup koneksi saat proses dihentikan
if (typeof process !== "undefined") {
  process.on("SIGINT", async () => {
    await closeDB();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    await closeDB();
    process.exit(0);
  });
}

async function initDB() {
  const _db = await connectDB();
  await _db.collection("users").createIndex({ email: 1 }, { unique: true });
  await _db.collection("keys").createIndex({ key: 1 }, { unique: true });
  await _db.collection("users").createIndex({ apikey: 1 });
}

// ================ HELPER ==================
function generateRandomKey(bytes = 16) {
  return crypto.randomBytes(bytes).toString("hex");
}

function formatDate(timestamp, timeZone = "Asia/Jakarta") {
  if (!timestamp) return null;
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  }).format(new Date(timestamp));
}

function hashApiKey(apikey) {
  if (!KEY_SECRET) return null;
  return crypto.createHmac("sha256", KEY_SECRET).update(apikey).digest("hex");
}

// ================ KEYS MANAGEMENT ==================
async function getKeysFromMongo() {
  const _db = await connectDB();
  const keys = await _db.collection("keys").find({}).toArray();
  return keys.map(doc => ({
    key: doc.key,
    limit: doc.limit,
    initlimit: doc.initlimit,
    lastreset: doc.lastreset,
    expire: doc.expire,
  }));
}

async function saveKeyToMongo(key, data) {
  const _db = await connectDB();
  const collection = _db.collection("keys");
  await collection.updateOne({ key }, { $set: { key, ...data } }, { upsert: true });
  return true;
}

async function deleteKeyFromMongo(key) {
  const _db = await connectDB();
  const keys = _db.collection("keys");
  const users = _db.collection("users");
  const res = await keys.deleteOne({ key });
  if (res.deletedCount > 0) {
    const userRes = await users.deleteOne({ apikey: key });
    return { keyDeleted: true, userDeleted: userRes.deletedCount > 0 };
  }
  return { keyDeleted: false, userDeleted: false };
}

// downgrade Premium → User biasa
async function downgradePremiumToUser(apikey, keyCollection, usersCollection, now) {
  // Update role & reset fields di users
  await usersCollection.updateOne(
    { apikey },
    {
      $set: {
        role: "user",
        reset: true,
        initlimit: 100,
        limit: 100,
        lastreset: now,
      },
      $unset: { expire: "" },
    }
  );

  // Update key agar selaras
  const resetFields = {
    $set: { reset: true, initlimit: 100, limit: 100, lastreset: now },
    $unset: { expire: "" },
  };

  return await keyCollection.findOneAndUpdate(
    { key: apikey },
    resetFields,
    { returnDocument: "after" }
  );
}

// ----------------------------- //

async function getApiKey(key, ip) {
  const _db = await connectDB();
  const keyCollection = _db.collection("keys");
  const usersCollection = _db.collection("users");
  const now = Date.now();
  console.log(`\n✨ REQUEST INFO
🌐 IP  : ${ip}
🔑 KEY : ${key}
`);
  const doc = await keyCollection.findOne({ key });
  if (!doc) return { success: false, status: 404, message: "Apikey tidak valid" };

  const user = await usersCollection.findOne({ apikey: key });
  if (!user) return { success: false, status: 404, message: "User tidak ditemukan" };

  const getDoc = (res) => (res && res.value ? res.value : res);

  // ----------------------------- //
  // 🔸 1. HANDLE PREMIUM EXPIRE
  // ----------------------------- //
  if (user.role === "Premium" && doc.expire && doc.expire <= now) {
    await downgradePremiumToUser(key, keyCollection, usersCollection, now);

    const newUser = await usersCollection.findOne({ apikey: key });
    const decrementedRes = await keyCollection.findOneAndUpdate(
      { key, limit: { $gt: 0 } },
      { $inc: { limit: -1 } },
      { returnDocument: "after" }
    );

    const decremented = getDoc(decrementedRes);
    if (!decremented) {
      return { success: false, status: 403, message: "Limit apikey telah habis" };
    }

    // Sinkronisasi ke user juga
    await usersCollection.updateOne(
      { apikey: key },
      { $set: { limit: decremented.limit } }
    );

    return {
      success: true,
      key: decremented.key,
      limit: decremented.limit,
      initlimit: decremented.initlimit,
      lastreset: decremented.lastreset,
      expire: decremented.expire || null,
      role: newUser.role,
      message: "Premium habis — diturunkan ke user. Akses dilanjutkan sebagai user.",
    };
  }

  // ----------------------------- //
  // 🔸 2. AUTO RESET HARIAN
  // ----------------------------- //
  if (doc.reset) {
    const shouldReset = !doc.lastreset || now - doc.lastreset >= 24 * 60 * 60 * 1000;
    if (shouldReset) {
      const resetRes = await keyCollection.findOneAndUpdate(
        { key },
        { $set: { limit: doc.initlimit, lastreset: now } },
        { returnDocument: "after" }
      );
      const resetDoc = getDoc(resetRes);

      // sinkronisasi ke user juga
      await usersCollection.updateOne(
        { apikey: key },
        { $set: { limit: resetDoc.limit, lastreset: now } }
      );
    }
  }

  // ----------------------------- //
  // 🔸 3. DECREMENT LIMIT
  // ----------------------------- //
  const updatedRes = await keyCollection.findOneAndUpdate(
    { key, limit: { $gt: 0 } },
    { $inc: { limit: -1 } },
    { returnDocument: "after" }
  );
  const updated = getDoc(updatedRes);

  if (!updated) {
    return { success: false, status: 403, message: "Limit apikey telah habis" };
  }

  // sinkronisasi perubahan limit ke user juga
  await usersCollection.updateOne(
    { apikey: key },
    { $set: { limit: updated.limit } }
  );

  // ----------------------------- //
  // 🔸 4. RETURN HASIL AKHIR
  // ----------------------------- //
  const freshUser = await usersCollection.findOne({ apikey: key });

  return {
    success: true,
    key: updated.key,
    limit: updated.limit,
    initlimit: updated.initlimit,
    lastreset: updated.lastreset,
    expire: updated.expire || null,
    role: freshUser?.role || "user",
  };
}

// ================ USER MANAGEMENT ==================
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

async function cekemail(email) {
  const _db = await connectDB();
  const users = _db.collection("users");

  if (!email) {
    return {
      status: "400",
      message: "Email wajib diisi",
      exists: false
    };
  }

  const user = await users.findOne({ email });

  if (user) {
    return {
      status: "200",
      message: "Email sudah terdaftar",
      exists: true
    };
  }

  return {
    status: "200",
    message: "Email belum terdaftar",
    exists: false
  };
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
  const apikey = generateRandomKey(16);
  const now = Date.now();

  const threeMonths = 90 * 24 * 60 * 60 * 1000;
  const expireAt = now + threeMonths;

  const user = {
    email, password: hashed, deviceId: deviceId || null,
    profile: null, banner: null, role: "user", apikey, createdAt: now,
  };
  await users.insertOne(user);

  await saveKeyToMongo(apikey, { limit: 100, initlimit: 100, lastreset: now, reset: true, expire: expireAt });

  return { email, role: "user", apikey, createdAt: now, deviceId, expire: expireAt };
}

async function loginUser({ email, password }) {
  const _db = await connectDB();
  const users = _db.collection("users");
  const user = await users.findOne({ email });
  if (!user) throw new Error("User tidak ditemukan");

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new Error("Password salah");

  return await getUserInfo(user.apikey);
}

async function editUser(email, update, role = "user") {
  try {
    const _db = await connectDB();
    const users = _db.collection("users");
    const keysCol = _db.collection("keys");

    const allowedForUser = ["password", "profile", "banner", "apikey"];
    const allowedForPremium = ["password", "profile", "banner", "deviceId", "apikey"];
    const allowedFields = role === "Premium" ? allowedForPremium : allowedForUser;

    const oldUser = await users.findOne({ email });
    if (!oldUser) throw new Error("User tidak ditemukan");

    // 🔒 Field yang boleh diupdate
    const safeUpdate = {};
    for (const field of allowedFields) {
      if (update[field] !== undefined) {
        safeUpdate[field] =
          field === "password"
            ? await bcrypt.hash(update.password, 10)
            : update[field];
      }
    }

    if (!Object.keys(safeUpdate).length)
      throw new Error("Tidak ada field yang boleh diubah");

    // 🔍 Cek apikey duplikat
    if (safeUpdate.apikey && safeUpdate.apikey !== oldUser.apikey) {
      const existingKey = await keysCol.findOne({ key: safeUpdate.apikey.trim() });
      if (existingKey) throw new Error("Apikey sudah digunakan user lain");
    }

    // 🔄 Update data user
    await users.updateOne({ email }, { $set: safeUpdate });
    const updatedUser = await users.findOne({ email });
    if (!updatedUser) throw new Error("Update gagal");

    // 🗝️ Ambil key lama dan baru
    const oldKey = oldUser.apikey?.trim();
    const newKey = (safeUpdate.apikey || oldKey)?.trim();
    if (!newKey) throw new Error("Apikey tidak valid");

    // 🔎 Ambil data lama di keys
    const oldKeyDoc = await keysCol.findOne({ key: oldKey });
    const newKeyDoc = await keysCol.findOne({ key: newKey });
    const baseKeyDoc = newKeyDoc || oldKeyDoc;

    const currentLimit = baseKeyDoc?.limit ?? 100;
    const currentExpire = baseKeyDoc?.expire ?? null;

    // 🧩 Data sinkronisasi (ambil dari keys lama)
    const syncData = {
      key: newKey,
      email,
      role: updatedUser.role || role,
      expire: currentExpire, // 🔥 pakai data lama
      limit: update.limit !== undefined ? update.limit : currentLimit,
    };

    // 🔀 Kalau apikey berubah
    if (safeUpdate.apikey && safeUpdate.apikey !== oldKey) {
      if (oldKeyDoc) {
        // Salin semua data lama, ubah key & email
        const mergedData = {
          ...oldKeyDoc,
          ...Object.fromEntries(
            Object.entries(syncData).filter(([_, v]) => v !== null && v !== undefined)
          ),
          key: newKey,
          email,
        };

        await keysCol.updateOne(
          { _id: oldKeyDoc._id },
          { $set: mergedData }
        );
      } else {
        await keysCol.insertOne(syncData);
      }
    } else {
      // 🔧 Update aman tanpa hapus field lain
      const cleanSync = Object.fromEntries(
        Object.entries(syncData).filter(([_, v]) => v !== null && v !== undefined)
      );
      await keysCol.updateOne({ key: newKey }, { $set: cleanSync });
    }

    return { status: true };
  } catch (err) {
    return {
      status: false,
      message: err.message || "Terjadi kesalahan saat update user",
    };
  }
}

// ================ INFO ==================
async function getUserInfo(apikey) {
  const _db = await connectDB();
  const users = _db.collection("users");
  const keys = _db.collection("keys");
  const user = await users.findOne({ apikey });
  if (!user) throw new Error("User tidak ditemukan");

  const keyData = await keys.findOne({ key: apikey });
  if (!keyData) throw new Error("API Key tidak ditemukan");

  const now = Date.now();

  if (user.role === "Premium" && keyData.expire && keyData.expire <= now) {
    await downgradePremiumToUser(apikey, keys, users, now);
    const refreshedUser = await users.findOne({ apikey });
    const refreshedKey = await keys.findOne({ key: apikey });
    return filterUserData(refreshedUser, refreshedKey);
  }

  return filterUserData(user, keyData);
}


function filterUserData(user, keyData) {
  return {
    email: user.email,
    profile: user.profile || null,
    banner: user.banner || null,
    role: user.role,
    apikey: keyData.key,
    limit: keyData.limit,
    expire: keyData.expire || null
  };
}

// ================ AUTO SYNC UPDATE ==================
async function updateCollectionDocs(filter = {}, updateData = {}, options = {}) {
  const _db = await connectDB();
  const usersCol = _db.collection("users");
  const keysCol = _db.collection("keys");

  if (!updateData || !Object.keys(updateData).length) {
    throw new Error("Data update tidak boleh kosong");
  }

  const updateOptions = { upsert: false, ...options };

  // 🔹 Normalisasi tipe data + konversi expire hari → timestamp
  const normalize = (data) => {
    const normalized = { ...data };
    const now = Date.now();

    for (const key in normalized) {
      let value = normalized[key];

      // Auto-konversi string angka jadi Number
      if (typeof value === "string" && !isNaN(value) && value.trim() !== "") {
        value = Number(value);
      }

      // Konversi expire (dalam hari) jadi timestamp (ms)
      if (key === "expire" && typeof value === "number" && value < 10_000_000_000_000) {
        // Angka kecil dianggap jumlah hari (contoh: 30 → 30 hari ke depan)
        value = now + value * 24 * 60 * 60 * 1000;
      }

      normalized[key] = value;
    }

    return normalized;
  };

  updateData = normalize(updateData);

  // ================== Cek ke users ==================
  const users = await usersCol.find(filter).toArray();
  if (users.length) {
    for (const user of users) {
      await usersCol.updateOne(
        { _id: user._id },
        { $set: updateData },
        updateOptions
      );

      // 🔹 Sinkronisasi ke keys
      const sync = {};
      if (updateData.role !== undefined) sync.role = updateData.role;
      if (updateData.apikey !== undefined) sync.key = updateData.apikey;
      if (updateData.expire !== undefined) sync.expire = updateData.expire;
      if (updateData.limit !== undefined) sync.limit = updateData.limit;
      if (updateData.initlimit !== undefined) sync.initlimit = updateData.initlimit;

      if (Object.keys(sync).length) {
        await keysCol.updateOne({ key: user.apikey }, { $set: normalize(sync) });
      }
    }

    return { collection: "users", matched: users.length, modified: users.length, synced: true };
  }

  // ================== Cek ke keys ==================
  const keys = await keysCol.find(filter).toArray();
  if (keys.length) {
    for (const keyDoc of keys) {
      await keysCol.updateOne(
        { _id: keyDoc._id },
        { $set: updateData },
        updateOptions
      );

      // 🔹 Sinkronisasi ke users
      const sync = {};
      if (updateData.key !== undefined) sync.apikey = updateData.key;
      if (updateData.expire !== undefined) sync.expire = updateData.expire;
      if (updateData.limit !== undefined) sync.limit = updateData.limit;
      if (updateData.initlimit !== undefined) sync.initlimit = updateData.initlimit;

      if (Object.keys(sync).length) {
        await usersCol.updateOne({ apikey: keyDoc.key }, { $set: normalize(sync) });
      }
    }

    return { collection: "keys", matched: keys.length, modified: keys.length, synced: true };
  }

  throw new Error("Dokumen tidak ditemukan di users maupun keys");
}

export {
  getSyteam, updateSyteam, cekemail,
  getUserInfo, registerUser, loginUser, editUser,
  ADMIN_APIKEY, getApiKey, getKeysFromMongo,
  saveKeyToMongo, deleteKeyFromMongo,
  generateRandomKey, formatDate, hashApiKey,
  initDB, closeDB, updateCollectionDocs,
};