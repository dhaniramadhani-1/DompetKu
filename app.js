// --- SISTEM LOCKSCREEN & KEYPAD & LOGIN PROFIL ---
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
    if (currentPINInput.length === 6) setTimeout(submitPIN, 100);
  }
}

function clearKey() {
  currentPINInput = currentPINInput.slice(0, -1);
  updateDots();
}

function updateDots() {
  dots.forEach((dot, idx) => {
    if (idx < currentPINInput.length) dot.classList.add('active');
    else dot.classList.remove('active');
  });
}

function submitPIN() {
  if (currentPINInput.length < 6) return alert("PIN harus berisi 6 angka!");

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

function loginGoogle() {
  const inputNama = prompt("Masukkan nama Anda untuk profil:", localStorage.getItem('user_profile_name') || "Pengguna");
  
  if (inputNama && inputNama.trim() !== "") {
    const userName = inputNama.trim();
    localStorage.setItem('app_google_user', 'true');
    localStorage.setItem('user_profile_name', userName);
    
    if (!localStorage.getItem('app_pin_code')) {
      localStorage.setItem('app_pin_code', '123456');
    }

    alert(`Selamat datang, ${userName}!`);
    unlockApp();
  }
}

function unlockApp() {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('app-screen').classList.remove('hidden');
  currentPINInput = "";
  updateDots();
  loadUserProfile();
}

function lockApp() {
  document.getElementById('app-screen').classList.add('hidden');
  document.getElementById('login-screen').classList.remove('hidden');
}

function loadUserProfile() {
  const userName = localStorage.getItem('user_profile_name') || 'Pengguna';
  document.getElementById('user-name').textContent = userName;
}

// --- FITUR DARK MODE ---
function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
  const isDark = document.body.classList.contains('dark-mode');
  localStorage.setItem('app_dark_mode', isDark);
}

if (localStorage.getItem('app_dark_mode') === 'true') {
  document.body.classList.add('dark-mode');
}

// --- FITUR MULTI-CURRENCY (MATA UANG) ---
const currencyFormats = {
  IDR: { locale: 'id-ID', currency: 'IDR' },
  USD: { locale: 'en-US', currency: 'USD' },
  EUR: { locale: 'de-DE', currency: 'EUR' },
  JPY: { locale: 'ja-JP', currency: 'JPY' },
  MYR: { locale: 'ms-MY', currency: 'MYR' },
  SGD: { locale: 'en-SG', currency: 'SGD' }
};

let currentCurrency = localStorage.getItem('app_currency') || 'IDR';
document.getElementById('currency-selector').value = currentCurrency;

function changeCurrency(val) {
  currentCurrency = val;
  localStorage.setItem('app_currency', val);
  updateUI();
}

function formatMataUang(angka) {
  const config = currencyFormats[currentCurrency] || currencyFormats.IDR;
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.currency,
    maximumFractionDigits: currentCurrency === 'IDR' || currentCurrency === 'JPY' ? 0 : 2
  }).format(angka);
}

// --- AKUN SAMA & CUSTOM AKUN ---
const defaultAkun = [
  { id: 'cash', nama: 'Cash', icon: '💵' },
];

let daftarAkun = JSON.parse(localStorage.getItem('keuangan_app_accounts')) || defaultAkun;

function toggleAccountForm() {
  document.getElementById('form-akun').classList.toggle('hidden');
}

function tambahAkunCustom(e) {
  e.preventDefault();
  const nama = document.getElementById('akun-nama').value.trim();
  const icon = document.getElementById('akun-icon').value;
  const id = 'custom_' + Date.now();

  if (nama) {
    daftarAkun.push({ id, nama, icon, isCustom: true });
    localStorage.setItem('keuangan_app_accounts', JSON.stringify(daftarAkun));
    document.getElementById('form-akun').reset();
    toggleAccountForm();
    updateUI();
  }
}

function hapusAkunCustom(id) {
  if (confirm("Hapus sumber akun ini? Transaksi lamanya akan dialihkan ke Cash.")) {
    daftarAkun = daftarAkun.filter(a => a.id !== id);
    localStorage.setItem('keuangan_app_accounts', JSON.stringify(daftarAkun));
    updateUI();
  }
}

// --- LOGIKA UTAMA KEUANGAN ---
const opsiKategori = {
  keluar: [
    { nama: 'Amal & Sedekah', emoji: '🤲' },
    { nama: 'Makanan & Minuman', emoji: '🍕' },
    { nama: 'Tagihan & Belanja', emoji: '🛒' },
    { nama: 'Transportasi', emoji: '🚗' },
    { nama: 'Hiburan & Hobi', emoji: '🎮' },
    { nama: 'Tabungan Impian', emoji: '🎯' },
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
let targetTabungan = JSON.parse(localStorage.getItem('keuangan_app_savings')) || [];
let batasPengeluaran = parseFloat(localStorage.getItem('keuangan_app_budget')) || 0;
let targetAmalMingguan = parseFloat(localStorage.getItem('keuangan_app_charity_goal')) || 0;
let activeFilter = 'all';

const form = document.getElementById('form-transaksi');
const inputDeskripsi = document.getElementById('deskripsi');
const inputNominal = document.getElementById('nominal');
const selectTipe = document.getElementById('tipe');
const selectAkun = document.getElementById('sumber-akun');
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

function updateSelectAkunOptions() {
  selectAkun.innerHTML = '';
  daftarAkun.forEach(ak => {
    const option = document.createElement('option');
    option.value = ak.id;
    option.textContent = `${ak.icon} ${ak.nama}`;
    selectAkun.appendChild(option);
  });
}

function isWithinCurrentWeek(timestamp) {
  const now = new Date();
  const date = new Date(timestamp || Date.now());
  
  // Hitung awal minggu (Hari Senin)
  const day = now.getDay();
  const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diffToMonday));
  monday.setHours(0, 0, 0, 0);

  return date >= monday;
}

function updateUI() {
  updateSelectAkunOptions();
  daftarTransaksiEl.innerHTML = '';
  let totalMasuk = 0;
  let totalKeluar = 0;
  let totalAmalMingguIni = 0;

  let saldoPerAkun = {};
  daftarAkun.forEach(a => saldoPerAkun[a.id] = 0);

  // Hitung Saldo, Akun, dan Amal Mingguan
  transaksi.forEach(item => {
    const ak = item.akun || 'cash';
    if (saldoPerAkun[ak] === undefined) saldoPerAkun[ak] = 0;

    if (item.tipe === 'masuk') {
      totalMasuk += item.nominal;
      saldoPerAkun[ak] += item.nominal;
    } else {
      totalKeluar += item.nominal;
      saldoPerAkun[ak] -= item.nominal;

      // Hitung Amal jika termasuk dalam kategori 'Amal & Sedekah' di minggu ini
      if (item.kategori.includes('Amal') || item.kategori.includes('Sedekah')) {
        if (isWithinCurrentWeek(item.timestamp)) {
          totalAmalMingguIni += item.nominal;
        }
      }
    }
  });

  // Render Kartu Akun
  const accountsListEl = document.getElementById('accounts-list');
  accountsListEl.innerHTML = '';
  daftarAkun.forEach(ak => {
    const div = document.createElement('div');
    div.className = 'account-card';
    div.innerHTML = `
      ${ak.isCustom ? `<button onclick="hapusAkunCustom('${ak.id}')" class="btn-del-account">✕</button>` : ''}
      <div class="icon">${ak.icon}</div>
      <div class="name">${ak.nama}</div>
      <div class="bal">${formatMataUang(saldoPerAkun[ak.id] || 0)}</div>
    `;
    accountsListEl.appendChild(div);
  });

  // Render Transaksi Ter-filter
  const searchKeyword = document.getElementById('search-input').value.toLowerCase();
  const filteredData = transaksi.filter(item => {
    const matchFilter = activeFilter === 'all' || item.tipe === activeFilter;
    const matchSearch = item.deskripsi.toLowerCase().includes(searchKeyword) || item.kategori.toLowerCase().includes(searchKeyword);
    return matchFilter && matchSearch;
  });

  if (filteredData.length === 0) {
    daftarTransaksiEl.innerHTML = '<li style="text-align: center; color: #94a3b8; padding: 16px; font-size: 0.8rem;">Tidak ada catatan transaksi.</li>';
  } else {
    filteredData.forEach((item) => {
      const originalIndex = transaksi.indexOf(item);
      const li = document.createElement('li');
      li.className = 'history-item';
      const isMasuk = item.tipe === 'masuk';
      const akObj = daftarAkun.find(a => a.id === (item.akun || 'cash')) || { nama: 'Cash' };

      li.innerHTML = `
        <div class="item-info">
          <div class="item-icon">${item.kategori.split(' ')[0]}</div>
          <div class="item-details">
            <h4>${item.deskripsi}</h4>
            <p>${item.kategori.substring(2)} • ${akObj.nama} • ${item.tanggal}</p>
          </div>
        </div>
        <div class="item-right">
          <span class="amount ${isMasuk ? 'in' : 'out'}">
            ${isMasuk ? '+' : '-'} ${formatMataUang(item.nominal)}
          </span>
          <button onclick="hapusTransaksi(${originalIndex})" class="btn-delete-item">✕</button>
        </div>
      `;
      daftarTransaksiEl.appendChild(li);
    });
  }

  totalMasukEl.textContent = formatMataUang(totalMasuk);
  totalKeluarEl.textContent = formatMataUang(totalKeluar);
  sisaSaldoEl.textContent = formatMataUang(totalMasuk - totalKeluar);
  transactionCountEl.textContent = `${transaksi.length} Transaksi`;

  updateBudgetUI(totalKeluar);
  updateCharityUI(totalAmalMingguIni);
  renderSavings();

  localStorage.setItem('keuangan_app_db', JSON.stringify(transaksi));
}

// --- FITUR TARGET AMAL MINGGUAN ---
function setWeeklyCharityGoal() {
  const input = prompt(`Masukkan target minimal amal untuk seminggu (${currentCurrency}):`, targetAmalMingguan);
  if (input !== null) {
    targetAmalMingguan = parseFloat(input) || 0;
    localStorage.setItem('keuangan_app_charity_goal', targetAmalMingguan);
    updateUI();
  }
}

function updateCharityUI(totalAmalMingguIni) {
  const charityUsedEl = document.getElementById('charity-used-text');
  const charityLimitEl = document.getElementById('charity-limit-text');
  const progressBar = document.getElementById('charity-progress-bar');
  const statusEl = document.getElementById('charity-status');

  charityUsedEl.textContent = `Terkumpul: ${formatMataUang(totalAmalMingguIni)}`;
  charityLimitEl.textContent = `Target: ${formatMataUang(targetAmalMingguan)}`;

  if (targetAmalMingguan > 0) {
    let persen = (totalAmalMingguIni / targetAmalMingguan) * 100;
    progressBar.style.width = `${Math.min(persen, 100)}%`;

    if (persen >= 100) {
      statusEl.textContent = '🎉 Alhamdulillah! Target amal minggu ini telah tercapai.';
      statusEl.style.color = 'var(--success)';
    } else {
      const kurang = targetAmalMingguan - totalAmalMingguIni;
      statusEl.textContent = `💪 Kurang ${formatMataUang(kurang)} lagi untuk memenuhi target minggu ini.`;
      statusEl.style.color = 'var(--charity)';
    }
  } else {
    progressBar.style.width = '0%';
    statusEl.textContent = 'Target amal mingguan belum diatur.';
    statusEl.style.color = 'var(--text-muted)';
  }
}

// --- BATAS MAKSIMAL PENGELUARAN ---
function setMonthlyBudget() {
  const input = prompt(`Masukkan batas pengeluaran bulan ini (${currentCurrency}):`, batasPengeluaran);
  if (input !== null) {
    batasPengeluaran = parseFloat(input) || 0;
    localStorage.setItem('keuangan_app_budget', batasPengeluaran);
    updateUI();
  }
}

function updateBudgetUI(totalPengeluaran) {
  const budgetUsedEl = document.getElementById('budget-used-text');
  const budgetLimitEl = document.getElementById('budget-limit-text');
  const progressBar = document.getElementById('budget-progress-bar');
  const warningEl = document.getElementById('budget-warning');

  budgetUsedEl.textContent = `Terpakai: ${formatMataUang(totalPengeluaran)}`;
  budgetLimitEl.textContent = `Batas: ${formatMataUang(batasPengeluaran)}`;

  if (batasPengeluaran > 0) {
    let persen = (totalPengeluaran / batasPengeluaran) * 100;
    progressBar.style.width = `${Math.min(persen, 100)}%`;

    if (persen >= 100) {
      progressBar.style.backgroundColor = 'var(--danger)';
      warningEl.textContent = '⚠️ Pengeluaran Anda telah MELEBIHI batas anggaran!';
    } else if (persen >= 80) {
      progressBar.style.backgroundColor = 'var(--warning)';
      warningEl.textContent = '⚠️ Hati-hati, pengeluaran mendekati batas anggaran!';
    } else {
      progressBar.style.backgroundColor = 'var(--success)';
      warningEl.textContent = '';
    }
  } else {
    progressBar.style.width = '0%';
    warningEl.textContent = 'Batas anggaran belum diatur.';
  }
}

// --- TABUNGAN & TARGET IMPAN ---
function toggleSavingsForm() {
  document.getElementById('form-tabungan').classList.toggle('hidden');
}

function tambahTargetTabungan(e) {
  e.preventDefault();
  const nama = document.getElementById('target-nama').value;
  const target = parseFloat(document.getElementById('target-nominal').value);
  const terkumpul = parseFloat(document.getElementById('target-terkumpul').value) || 0;

  targetTabungan.push({ nama, target, terkumpul });
  localStorage.setItem('keuangan_app_savings', JSON.stringify(targetTabungan));

  document.getElementById('form-tabungan').reset();
  toggleSavingsForm();
  renderSavings();
}

function nambahSaldoTabungan(idx) {
  const input = prompt(`Tambah tabungan untuk "${targetTabungan[idx].nama}" (${currentCurrency}):`);
  if (input) {
    const nominal = parseFloat(input);
    if (nominal > 0) {
      targetTabungan[idx].terkumpul += nominal;

      transaksi.unshift({
        deskripsi: `Tabungan: ${targetTabungan[idx].nama}`,
        nominal: nominal,
        tipe: 'keluar',
        akun: 'cash',
        kategori: '🎯 Tabungan Impian',
        tanggal: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
        timestamp: Date.now()
      });

      localStorage.setItem('keuangan_app_savings', JSON.stringify(targetTabungan));
      updateUI();
    }
  }
}

function hapusTabungan(idx) {
  if (confirm("Hapus target tabungan ini?")) {
    targetTabungan.splice(idx, 1);
    localStorage.setItem('keuangan_app_savings', JSON.stringify(targetTabungan));
    renderSavings();
  }
}

function renderSavings() {
  const listEl = document.getElementById('savings-list');
  listEl.innerHTML = '';

  if (targetTabungan.length === 0) {
    listEl.innerHTML = '<p style="text-align: center; color: #94a3b8; font-size: 0.78rem;">Belum ada target barang impian.</p>';
    return;
  }

  targetTabungan.forEach((item, idx) => {
    const persen = Math.min((item.terkumpul / item.target) * 100, 100).toFixed(0);
    const div = document.createElement('div');
    div.className = 'saving-item';
    div.innerHTML = `
      <div class="saving-header">
        <span class="saving-title">🎯 ${item.nama}</span>
        <div>
          <button onclick="nambahSaldoTabungan(${idx})" class="btn-text">+ Tabung</button>
          <button onclick="hapusTabungan(${idx})" class="btn-delete-item" style="margin-left:8px;">✕</button>
        </div>
      </div>
      <div class="saving-amounts">
        <span>${formatMataUang(item.terkumpul)} dari ${formatMataUang(item.target)} (${persen}%)</span>
      </div>
      <div class="progress-bar-bg">
        <div class="progress-bar-fill" style="width: ${persen}%; background-color: var(--primary);"></div>
      </div>
    `;
    listEl.appendChild(div);
  });
}

// --- FORM TRANSAKSI HANDLER ---
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
    deskripsi: inputDeskripsi.value,
    nominal: parseFloat(inputNominal.value),
    tipe: selectTipe.value,
    akun: selectAkun.value,
    kategori: selectKategori.value,
    tanggal: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
    timestamp: Date.now()
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
  let csv = 'Tanggal,Jenis,Akun,Kategori,Deskripsi,Nominal,MataUang\n';
  transaksi.forEach(t => {
    csv += `"${t.tanggal}","${t.tipe}","${t.akun}","${t.kategori}","${t.deskripsi}",${t.nominal},"${currentCurrency}"\n`;
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

// Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(err => console.log('SW Error', err));
  });
}