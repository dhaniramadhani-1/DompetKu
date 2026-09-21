// --- SISTEM LOGIN LOCKSCREEN & KEYPAD (6 DIGIT) ---
let currentPINInput = "";
const savedPIN = localStorage.getItem('app_pin_code');

const loginTitle = document.getElementById('login-title');
const loginSubtitle = document.getElementById('login-subtitle');
const lockCard = document.querySelector('.lockscreen-card');
const dots = document.querySelectorAll('.dot');

if (!savedPIN) {
  loginTitle.textContent = "Buat PIN Baru";
  loginSubtitle.textContent = "Masukkan 6 angka untuk keamanan";
} else {
  loginTitle.textContent = "Selamat Datang";
  loginSubtitle.textContent = "Masukkan 6 angka PIN Anda";
}

function pressKey(num) {
  if (currentPINInput.length < 6) {
    currentPINInput += num;
    updateDots();
    if (currentPINInput.length === 6) {
      setTimeout(submitPIN, 100);
    }
  }
}

function clearKey() {
  currentPINInput = currentPINInput.slice(0, -1);
  updateDots();
}

function updateDots() {
  dots.forEach((dot, idx) => {
    if (idx < currentPINInput.length) {
      dot.classList.add('active');
    } else {
      dot.classList.remove('active');
    }
  });
}

function submitPIN() {
  if (currentPINInput.length < 6) {
    alert("PIN harus berisi 6 angka!");
    return;
  }

  if (!savedPIN) {
    localStorage.setItem('app_pin_code', currentPINInput);
    alert("PIN 6 Digit Berhasil dibuat!");
    unlockApp();
  } else {
    if (currentPINInput === savedPIN) {
      unlockApp();
    } else {
      lockCard.classList.add('shake');
      setTimeout(() => lockCard.classList.remove('shake'), 400);
      currentPINInput = "";
      updateDots();
    }
  }
}

function unlockApp() {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('app-screen').classList.remove('hidden');
  currentPINInput = "";
  updateDots();
}

function lockApp() {
  document.getElementById('app-screen').classList.add('hidden');
  document.getElementById('login-screen').classList.remove('hidden');
}


// --- LOGIKA UTAMA KEUANGAN & FILTER ---
const opsiKategori = {
  keluar: [
    { nama: 'Makanan & Minuman', emoji: '🍕' },
    { nama: 'Tagihan & Belanja', emoji: '🛒' },
    { nama: 'Transportasi', emoji: '🚗' },
    { nama: 'Hiburan & Hobi', emoji: '🎮' },
    { nama: 'Lainnya', emoji: '📦' }
  ],
  masuk: [
    { nama: 'Gaji Bulanan', emoji: '💵' },
    { nama: 'Bonus / Side Job', emoji: '🎁' },
    { nama: 'Investasi', emoji: '📈' },
    { nama: 'Lainnya', emoji: '💰' }
  ]
};

let transaksi = JSON.parse(localStorage.getItem('keuangan_app_db')) || [];
let activeFilter = 'all';

const form = document.getElementById('form-transaksi');
const inputDeskripsi = document.getElementById('deskripsi');
const inputNominal = document.getElementById('nominal');
const selectTipe = document.getElementById('tipe');
const selectKategori = document.getElementById('kategori');

const totalMasukEl = document.getElementById('total-masuk');
const totalKeluarEl = document.getElementById('total-keluar');
const sisaSaldoEl = document.getElementById('sisa-saldo');
const daftarTransaksiEl = document.getElementById('daftar-transaksi');
const transactionCountEl = document.getElementById('transaction-count');

function updateKategoriOptions() {
  const tipe = selectTipe.value;
  selectKategori.innerHTML = '';
  opsiKategori[tipe].forEach(item => {
    const option = document.createElement('option');
    option.value = `${item.emoji} ${item.nama}`;
    option.textContent = `${item.emoji} ${item.nama}`;
    selectKategori.appendChild(option);
  });
}

function formatRupiah(angka) {
  return 'Rp ' + Number(angka).toLocaleString('id-ID');
}

function updateUI() {
  daftarTransaksiEl.innerHTML = '';
  let totalMasuk = 0;
  let totalKeluar = 0;

  // Filter Data
  const searchKeyword = document.getElementById('search-input').value.toLowerCase();
  
  const filteredData = transaksi.filter(item => {
    const matchFilter = activeFilter === 'all' || item.tipe === activeFilter;
    const matchSearch = item.deskripsi.toLowerCase().includes(searchKeyword) || 
                        item.kategori.toLowerCase().includes(searchKeyword);
    return matchFilter && matchSearch;
  });

  // Hitung Totalkeseluruhan (bukan cuma yg ter-filter)
  transaksi.forEach(item => {
    if (item.tipe === 'masuk') totalMasuk += item.nominal;
    else totalKeluar += item.nominal;
  });

  if (filteredData.length === 0) {
    daftarTransaksiEl.innerHTML = '<li style="text-align: center; color: #94a3b8; padding: 20px; font-size: 0.8rem;">Tidak ada catatan transaksi.</li>';
  } else {
    filteredData.forEach((item, index) => {
      const originalIndex = transaksi.indexOf(item);
      const li = document.createElement('li');
      li.className = 'history-item';
      const isMasuk = item.tipe === 'masuk';

      li.innerHTML = `
        <div class="item-info">
          <div class="item-icon">${item.kategori.split(' ')[0]}</div>
          <div class="item-details">
            <h4>${item.deskripsi}</h4>
            <p>${item.kategori.substring(2)} • ${item.tanggal}</p>
          </div>
        </div>
        <div class="item-right">
          <span class="amount ${isMasuk ? 'in' : 'out'}">
            ${isMasuk ? '+' : '-'} ${formatRupiah(item.nominal)}
          </span>
          <button onclick="hapusTransaksi(${originalIndex})" class="btn-delete-item">✕</button>
        </div>
      `;
      daftarTransaksiEl.appendChild(li);
    });
  }

  totalMasukEl.textContent = formatRupiah(totalMasuk);
  totalKeluarEl.textContent = formatRupiah(totalKeluar);
  sisaSaldoEl.textContent = formatRupiah(totalMasuk - totalKeluar);
  transactionCountEl.textContent = `${transaksi.length} Transaksi`;

  localStorage.setItem('keuangan_app_db', JSON.stringify(transaksi));
}

function setFilter(type, btn) {
  activeFilter = type;
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  updateUI();
}

function filterTransactions() {
  updateUI();
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  transaksi.unshift({
    deskripsi: inputDeskripsi.value,
    nominal: parseFloat(inputNominal.value),
    tipe: selectTipe.value,
    kategori: selectKategori.value,
    tanggal: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
  });

  updateUI();
  inputDeskripsi.value = '';
  inputNominal.value = '';
});

function hapusTransaksi(index) {
  transaksi.splice(index, 1);
  updateUI();
}

function eksporKeCSV() {
  if (transaksi.length === 0) return alert('Belum ada data.');
  let csv = 'Tanggal,Jenis,Kategori,Deskripsi,Nominal\n';
  transaksi.forEach(t => {
    csv += `"${t.tanggal}","${t.tipe}","${t.kategori}","${t.deskripsi}",${t.nominal}\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('href', url);
  a.setAttribute('download', 'Laporan_Keuangan.csv');
  a.click();
}

selectTipe.addEventListener('change', updateKategoriOptions);
updateKategoriOptions();
updateUI();

// --- REGISTRASI SERVICE WORKER UNTUK AKSES OFFLINE ---
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('Service Worker terdaftar untuk offline mode:', reg))
      .catch(err => console.error('Gagal mendaftarkan Service Worker:', err));
  });
}