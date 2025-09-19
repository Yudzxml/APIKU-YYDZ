import * as cheerio from "cheerio";

async function getListKota() {
  try {
    const res = await fetch('https://raw.githubusercontent.com/Yudzxml/UploaderV2/main/tmp/kota.json');
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error("Data kota tidak valid.");
    return data;
  } catch {
    throw new Error("Tidak dapat mengambil daftar kota.");
  }
}

async function jadwalsholat(namaKota) {
  const daftarKota = await getListKota();
  const kotaObj = daftarKota.find(k => k.kota.toLowerCase() === namaKota.toLowerCase());
  if (!kotaObj) throw new Error(`Kota "${namaKota}" tidak ditemukan.`);

  let html;
  try {
    const res = await fetch(`https://jadwalsholat.org/jadwal-sholat/monthly.php?id=${kotaObj.id}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    html = await res.text();
  } catch {
    throw new Error("Gagal mengambil halaman jadwal.");
  }

  const $ = cheerio.load(html);
  const periode = $('h2.h2_edit').first().text().trim() || "Periode tidak ditemukan";
  const headers = [];
  $('tr.table_header td').each((_, el) => {
    const header = $(el).text().replace(/\n/g, '').trim();
    if (header) headers.push(header);
  });

  const row = $('tr.table_highlight');
  const jadwal = {};
  row.find('td').each((i, el) => {
    const value = $(el).text().trim();
    const label = headers[i];
    if (label) jadwal[label] = value;
  });

  if (!Object.keys(jadwal).length) throw new Error("Struktur jadwal tidak ditemukan atau berubah.");

  return {
    status: 200,
    author: "Yudzxml",
    kota: kotaObj.kota,
    periode,
    jadwal
  };
}

export default jadwalsholat;