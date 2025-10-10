async function cariDoa(kataKunci) {
  try {
    const url = 'https://raw.githubusercontent.com/Yudzxml/UploaderV2/main/tmp/32683f5b.json';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Gagal fetch data doa');
    const data = await res.json();

    const hasil = data.filter(item =>
      item.title.toLowerCase().includes(kataKunci.toLowerCase())
    ).map(item => ({
      title: item.title,
      arab: item.arab,
      latin: item.latin,
      artinya: item.artinya
    }));

    return hasil;
  } catch (err) {
    return {
      error: 'Doa Tidak Tersedia'
    }
  }
}

 export default cariDoa