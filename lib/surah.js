const headers = {
  "Accept": "application/json, text/plain, */*",
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115 Safari/537.36",
  "Referer": "https://quran.kemenag.go.id/",
  "Origin": "https://quran.kemenag.go.id"
};

async function getListSurah() {
  try {
    const res = await fetch("https://web-api.qurankemenag.net/quran-surah", { headers });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    return data.data.map(surah => ({
      nomor: surah.id,
      latin: surah.latin.trim(),
      arti: surah.translation,
      jumlah_ayat: surah.num_ayah
    }));
  } catch (error) {
    console.error("Error fetching surah list:", error);
    throw new Error("Could not fetch surah list");
  }
}

async function surah(surahInput) {
  try {
    const list = await getListSurah();
    const found = list.find(surah => 
      surah.latin.toLowerCase() === surahInput.toLowerCase() || 
      surah.nomor === Number(surahInput)
    );
    
    if (!found) return { status: 404, error: "Surah tidak ditemukan" };

    const res = await fetch(
      `https://web-api.qurankemenag.net/quran-ayah?start=0&limit=${found.jumlah_ayat}&surah=${found.nomor}`,
      { headers }
    );
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();

    return {
      status: 200,
      surah: found.latin,
      arti_surah: found.arti,
      ayat: data.data.map(a => ({
        ayat: a.ayah,
        arab: a.arabic,
        latin: a.latin.trim(),
        terjemahan: a.translation
      }))
    };
  } catch (error) {
    console.error("Error fetching ayat:", error);
    return { status: 500, error: "Internal Server Error" };
  }
}

export default surah;