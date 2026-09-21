// --- CONFIGURASI GOOGLE FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyC5pL1W406iTsI3zlffPmAQ1hGWINvoaIM",
  authDomain: "dompetku-e36ee.firebaseapp.com",
  projectId: "dompetku-e36ee",
  storageBucket: "dompetku-e36ee.firebasestorage.app",
  messagingSenderId: "348124080627",
  appId: "1:348124080627:web:bdc4045f1c0a2ba4028a86",
  measurementId: "G-FTJTRDYKH9"
};

// Inisialisasi Firebase & Firestore Database
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const googleProvider = new firebase.auth.GoogleAuthProvider();

let currentUser = null;

// --- GOOGLE AUTHENTICATION SYSTEM ---
function loginWithGoogle() {
  auth.signInWithPopup(googleProvider).catch((error) => {
    alert("Gagal masuk dengan Google: " + error.message);
  });
}

function logoutGoogle() {
  if (confirm("Apakah Anda yakin ingin keluar dari akun Google ini?")) {
    auth.signOut().then(() => {
      location.reload();
    });
  }
}

// Deteksi status Login Pengguna secara Otomatis
auth.onAuthStateChanged((user) => {
  if (user) {
    currentUser = user;
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('app-screen').classList.remove('hidden');

    // Set Foto Profil & Nama Pengguna dari Google
    document.getElementById('user-avatar').src = user.photoURL || 'https://via.placeholder.com/40';
    document.getElementById('user-name').textContent = user.displayName || 'Pengguna Google';

    // Unduh Data dari Cloud Firebase
    loadDataFromCloud();
  } else {
    currentUser = null;
    document.getElementById('app-screen').classList.add('hidden');
    document.getElementById('login-screen').classList.remove('hidden');
  }
});


// --- SINKRONISASI CLOUD (FIRESTORE) ---
let currency = 'IDR';
let budgetLimit = 0;
let wallets = [
  { id: 'cash', nama: '💵 Tunai', saldo: 0 },
  { id: 'bank', nama: '🏦 Bank/BCA', saldo: 0 },
  { id: 'e-wallet', nama: '📱 GoPay/OVO', saldo: 0 }
];
let goals = [];
let transaksi = [];
let activeFilter = 'all';

const currencySymbols = { IDR: 'Rp ', USD: '$', SGD: 'S$ ', MYR: 'RM ' };

// Simpan Data ke Google Firestore
function saveDataToCloud() {
  if (!currentUser) return;
  document.getElementById('sync-status').textContent = '⏳ Menyimpan...';

  db.collection('users').doc(currentUser.uid).set({
    transaksi: transaksi,
    wallets: wallets,
    goals: goals,
    budgetLimit: budgetLimit,
    currency: currency,
    lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
  }).then(() => {
    document.getElementById('sync-status').textContent = '☁️ Tersimpan di Google Cloud';
  }).catch((err) => {
    console.error("Gagal sinkron data:", err);
    document.getElementById('sync-status').textContent = '❌ Gagal Sinkron';
  });
}

// Memuat Data Pengguna dari Cloud Firebase
function loadDataFromCloud() {
  if (!currentUser) return;
  document.getElementById('sync-status').textContent = '⏳ Memuat data...';

  db.collection('users').doc(currentUser.uid).get().then((doc) => {
    if (doc.exists) {
      const data = doc.data();
      transaksi = data.transaksi || [];
      wallets = data.wallets || wallets;
      goals = data.goals || [];
      budgetLimit = data.budgetLimit || 0;
      currency = data.currency || 'IDR';
    }
    updateUI();
    document.getElementById('sync-status').textContent = '☁️ Tersimpan di Google Cloud';
  }).catch((err) => {
    console.error("Gagal memuat dari Cloud:", err);
  });
}


// --- LOGIKA UTAMA & TAMPILAN (UI) ---
function formatMataUang(nominal) {
  const symbol = currencySymbols[currency] || 'Rp ';
  return symbol + Number(nominal).toLocaleString(currency === 'IDR' ? 'id-ID' : 'en-US');
}

function changeCurrency(val) {
  currency = val;
  updateUI();
  saveDataToCloud();
}

function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
  const isDark = document.body.classList.contains('dark-mode');
  localStorage.setItem('theme_dark', isDark);
  document.getElementById('theme-btn').textContent = isDark ? '☀️' : '🌙';
}
if (localStorage.getItem('theme_dark') === 'true') {
  document.body.classList.add('dark-mode');
  document.getElementById('theme-btn').textContent = '☀️';
}

function renderWallets() {
  const walletListEl = document.getElementById('wallet-list');
  const dompetSelectEl = document.getElementById('dompet-select');
  walletListEl.innerHTML = '';
  dompetSelectEl.innerHTML = '';

  wallets.forEach(w => w.saldo = 0);
  transaksi.forEach(t => {
    const w = wallets.find(item => item.id === t.dompetId);
    if (w) {
      if (t.tipe === 'masuk') w.saldo += t.nominal;
      else w.saldo -= t.nominal;
    }
  });

  wallets.forEach(w => {
    const div = document.createElement('div');
    div.className = 'wallet-card';
    div.innerHTML = `<h4>${w.nama}</h4><p>${formatMataUang(w.saldo)}</p>`;
    walletListEl.appendChild(div);

    const opt = document.createElement('option');
    opt.value = w.id;
    opt.textContent = w.nama;
    dompetSelectEl.appendChild(opt);
  });
}

function tambahDompetBaru() {
  const nama = prompt("Nama dompet baru (contoh: 💳 Mandiri):");
  if (nama) {
    wallets.push({ id: 'w_' + Date.now(), nama: nama, saldo: 0 });
    updateUI();
    saveDataToCloud();
  }
}

function setBudgetLimit() {
  const input = prompt("Masukkan Batas Pengeluaran Bulanan (0 untuk reset):", budgetLimit);
  if (input !== null) {
    budgetLimit = parseFloat(input) || 0;
    updateUI();
    saveDataToCloud();
  }
}

function updateBudgetProgress(totalKeluarBulanan) {
  const budgetMaxEl = document.getElementById('budget-max');
  const budgetUsedEl = document.getElementById('budget-used');
  const progressFill = document.getElementById('budget-progress');
  const statusEl = document.getElementById('budget-status');

  budgetMaxEl.textContent = formatMataUang(budgetLimit);
  budgetUsedEl.textContent = formatMataUang(totalKeluarBulanan);

  if (budgetLimit <= 0) {
    progressFill.style.width = '0%';
    statusEl.textContent = "Batas pengeluaran belum diatur.";
    return;
  }

  const persen = Math.min((totalKeluarBulanan / budgetLimit) * 100, 100);
  progressFill.style.width = `${persen}%`;
  progressFill.className = 'progress-fill';

  if (persen >= 100) {
    progressFill.classList.add('danger');
    statusEl.textContent = "⚠️ PERINGATAN: Pengeluaran melampaui batas!";
  } else if (persen >= 80) {
    progressFill.classList.add('warning');
    statusEl.textContent = "⚡ Hati-hati! Pengeluaran mendekati batas 80%.";
  } else {
    statusEl.textContent = `Penggunaan budget: ${persen.toFixed(1)}%`;
  }
}

function renderGoals() {
  const goalsListEl = document.getElementById('goals-list');
  goalsListEl.innerHTML = '';

  if (goals.length === 0) {
    goalsListEl.innerHTML = '<p style="font-size:0.75rem; color: var(--text-muted);">Belum ada target impian.</p>';
    return;
  }

  goals.forEach((g, idx) => {
    const persen = Math.min((g.terkumpul / g.target) * 100, 100);
    const div = document.createElement('div');
    div.className = 'goal-card';
    div.innerHTML = `
      <div class="goal-header">
        <span>${g.nama}</span>
        <span>${formatMataUang(g.terkumpul)} / ${formatMataUang(g.target)}</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${persen}%"></div>
      </div>
      <div class="goal-header" style="font-size:0.7rem;">
        <span>${persen.toFixed(1)}% Terkumpul</span>
        <div>
          <button onclick="tabungImpian(${idx})" class="btn-text">+ Tabung</button> | 
          <button onclick="hapusImpian(${idx})" class="btn-text" style="color:var(--danger)">Hapus</button>
        </div>
      </div>
    `;
    goalsListEl.appendChild(div);
  });
}

function tambahImpianBaru() {
  const nama = prompt("Nama Impian:");
  const target = prompt("Target Nominal (Rp):");
  if (nama && target) {
    goals.push({ nama: nama, target: parseFloat(target), terkumpul: 0 });
    updateUI();
    saveDataToCloud();
  }
}

function tabungImpian(index) {
  const nominal = prompt(`Nabung untuk "${goals[index].nama}" (Rp):`);
  if (nominal) {
    goals[index].terkumpul += parseFloat(nominal);
    updateUI();
    saveDataToCloud();
  }
}

function hapusImpian(index) {
  if (confirm("Hapus impian ini?")) {
    goals.splice(index, 1);
    updateUI();
    saveDataToCloud();
  }
}

function cetakPDF() {
  const element = document.getElementById('app-screen');
  const opt = {
    margin: 0.2,
    filename: `Laporan_Keuangan_Dompetku.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
  };
  html2pdf().set(opt).from(element).save();
}

const opsiKategori = {
  keluar: [
    { nama: 'Makanan & Minuman', emoji: '🍕' },
    { nama: 'Tagihan & Belanja', emoji: '🛒' },
    { nama: 'Transportasi', emoji: '🚗' },
    { nama: 'Hiburan', emoji: '🎮' },
    { nama: 'Lainnya', emoji: '📦' }
  ],
  masuk: [
    { nama: 'Gaji Bulanan', emoji: '💵' },
    { nama: 'Side Job', emoji: '🎁' },
    { nama: 'Investasi', emoji: '📈' },
    { nama: 'Lainnya', emoji: '💰' }
  ]
};

const form = document.getElementById('form-transaksi');
const selectTipe = document.getElementById('tipe');
const selectKategori = document.getElementById('kategori');

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

function updateUI() {
  document.getElementById('currency-select').value = currency;
  renderWallets();
  renderGoals();

  const daftarTransaksiEl = document.getElementById('daftar-transaksi');
  daftarTransaksiEl.innerHTML = '';

  let totalMasuk = 0;
  let totalKeluar = 0;

  const searchKeyword = document.getElementById('search-input').value.toLowerCase();
  const filteredData = transaksi.filter(item => {
    const matchFilter = activeFilter === 'all' || item.tipe === activeFilter;
    const matchSearch = item.deskripsi.toLowerCase().includes(searchKeyword) || item.kategori.toLowerCase().includes(searchKeyword);
    return matchFilter && matchSearch;
  });

  transaksi.forEach(item => {
    if (item.tipe === 'masuk') totalMasuk += item.nominal;
    else totalKeluar += item.nominal;
  });

  if (filteredData.length === 0) {
    daftarTransaksiEl.innerHTML = '<li style="text-align: center; color: var(--text-muted); padding: 16px; font-size: 0.75rem;">Tidak ada catatan.</li>';
  } else {
    filteredData.forEach((item) => {
      const originalIndex = transaksi.indexOf(item);
      const li = document.createElement('li');
      li.className = 'history-item';
      const isMasuk = item.tipe === 'masuk';
      const walletObj = wallets.find(w => w.id === item.dompetId);

      li.innerHTML = `
        <div class="item-info">
          <div class="item-icon">${item.kategori.split(' ')[0]}</div>
          <div class="item-details">
            <h4>${item.deskripsi}</h4>
            <p>${item.kategori.substring(2)} • ${walletObj ? walletObj.nama : 'Umum'} • ${item.tanggal}</p>
          </div>
        </div>
        <div class="item-right">
          <span class="amount ${isMasuk ? 'in' : 'out'}">${isMasuk ? '+' : '-'} ${formatMataUang(item.nominal)}</span>
          <button onclick="hapusTransaksi(${originalIndex})" class="btn-delete-item">✕</button>
        </div>
      `;
      daftarTransaksiEl.appendChild(li);
    });
  }

  document.getElementById('total-masuk').textContent = formatMataUang(totalMasuk);
  document.getElementById('total-keluar').textContent = formatMataUang(totalKeluar);
  document.getElementById('sisa-saldo').textContent = formatMataUang(totalMasuk - totalKeluar);
  document.getElementById('transaction-count').textContent = `${transaksi.length} Transaksi`;

  updateBudgetProgress(totalKeluar);
}

function setFilter(type, btn) {
  activeFilter = type;
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  updateUI();
}

function filterTransactions() { updateUI(); }

form.addEventListener('submit', (e) => {
  e.preventDefault();
  transaksi.unshift({
    deskripsi: document.getElementById('deskripsi').value,
    nominal: parseFloat(document.getElementById('nominal').value),
    tipe: selectTipe.value,
    dompetId: document.getElementById('dompet-select').value,
    kategori: selectKategori.value,
    tanggal: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
  });

  updateUI();
  saveDataToCloud();
  document.getElementById('deskripsi').value = '';
  document.getElementById('nominal').value = '';
});

function hapusTransaksi(index) {
  transaksi.splice(index, 1);
  updateUI();
  saveDataToCloud();
}

selectTipe.addEventListener('change', updateKategoriOptions);
updateKategoriOptions();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(err => console.log(err));
  });
}
