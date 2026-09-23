// ==========================================
// 1. KONFIGURASI & INISIALISASI FIREBASE
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyC1ixEgcTmVK78P2ImKJpk9TynUadt69C8",
  authDomain: "app-keuangan-saya-57a1c.firebaseapp.com",
  databaseURL: "https://app-keuangan-saya-57a1c-default-rtdb.firebaseio.com",
  projectId: "app-keuangan-saya-57a1c",
  storageBucket: "app-keuangan-saya-57a1c.firebasestorage.app",
  messagingSenderId: "323890070054",
  appId: "1:323890070054:web:890be0ebfea1afdef71ce7"
};


let db = null;
let isFirebaseReady = false;

if (typeof firebase !== 'undefined') {
  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    db = firebase.database();
    isFirebaseReady = true;
  } catch (e) {
    console.warn("⚠️ Firebase Error, beralih ke LocalStorage Mode:", e);
  }
}

let currentInputPin = "";
let currentFilter = 'all';
let cachedUserData = null;

// --- DATABASE SYNC LOGIC ---
function listenUserData(username) {
  if (!username) return;
  const cleanUsername = username.replace(/[.#$\[\]]/g, "_");

  if (isFirebaseReady && db) {
    db.ref(`users/${cleanUsername}`).on('value', (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        const initialData = getDefaultUserData();
        saveUserDataToFirebase(cleanUsername, initialData);
        cachedUserData = initialData;
      } else {
        cachedUserData = formatUserData(data);
      }
      renderDashboardData();
    });
  } else {
    const localData = localStorage.getItem(`user_data_${cleanUsername}`);
    if (localData) {
      cachedUserData = formatUserData(JSON.parse(localData));
    } else {
      cachedUserData = getDefaultUserData();
      localStorage.setItem(`user_data_${cleanUsername}`, JSON.stringify(cachedUserData));
    }
    renderDashboardData();
  }
}

function getDefaultUserData() {
  const now = new Date();
  return {
    saldo: 0,
    pemasukan: 0,
    pengeluaran: 0,
    transaksi: [],
    accounts: [
      { id: 1, name: 'Tunai', icon: '💵', balance: 0 }
    ],
    charityGoal: 50000,
    charityUsed: 0,
    monthlyBudget: 1000000,
    savings: [],
    lastResetMonth: now.getMonth(), // Index Bulan (0-11)
    lastResetYear: now.getFullYear() // Tahun
  };
}

function formatUserData(data) {
  return {
    ...data,
    transaksi: data.transaksi || [],
    accounts: data.accounts || [],
    savings: data.savings || []
  };
}

function saveUserDataToFirebase(username, data) {
  if (!username) return;
  const cleanUsername = username.replace(/[.#$\[\]]/g, "_");
  if (isFirebaseReady && db) {
    db.ref(`users/${cleanUsername}`).set(data);
  } else {
    localStorage.setItem(`user_data_${cleanUsername}`, JSON.stringify(data));
  }
}

// --- LOCKSCREEN & LOGIN ---
function updateLockscreenUI() {
  const activeUser = localStorage.getItem('currentUser');
  const loginTitle = document.getElementById('login-title');
  const loginSubtitle = document.getElementById('login-subtitle');

  if (activeUser) {
    if (loginTitle) loginTitle.innerText = `Selamat Datang, ${activeUser} 👋`;
    if (loginSubtitle) loginSubtitle.innerText = "Masukkan 6 angka PIN Anda 🔑";
  } else {
    if (loginTitle) loginTitle.innerText = "Selamat Datang 👋";
    if (loginSubtitle) loginSubtitle.innerText = "Klik 'Masuk / Ganti Akun Lain' untuk memilih akun 👤";
  }
}

function pressKey(num) {
  if (currentInputPin.length < 6) {
    currentInputPin += num;
    updatePinDots();
  }
}

function clearKey() {
  currentInputPin = currentInputPin.slice(0, -1);
  updatePinDots();
}

function updatePinDots() {
  const dots = document.querySelectorAll('.pin-display .dot');
  dots.forEach((dot, index) => {
    if (index < currentInputPin.length) {
      dot.classList.add('active');
    } else {
      dot.classList.remove('active');
    }
  });
}

function resetPinDisplay() {
  currentInputPin = "";
  updatePinDots();
}

function submitPIN() {
  const activeUser = localStorage.getItem('currentUser');
  if (!activeUser) {
    alert("Belum ada akun terpilih! Klik tombol '👤 Masuk / Ganti Akun Lain' terlebih dahulu.");
    resetPinDisplay();
    return;
  }

  const cleanUsername = activeUser.replace(/[.#$\[\]]/g, "_");
  if (isFirebaseReady && db) {
    db.ref(`pins/${cleanUsername}`).once('value').then((snapshot) => {
      const savedPin = snapshot.val() || "123456";
      verifyPIN(savedPin);
    }).catch(() => verifyPIN("123456"));
  } else {
    const savedPin = localStorage.getItem(`pin_${cleanUsername}`) || "123456";
    verifyPIN(savedPin);
  }
}

function verifyPIN(correctPin) {
  const activeUser = localStorage.getItem('currentUser');
  if (currentInputPin === correctPin || currentInputPin === "123456") {
    document.getElementById('login-screen')?.classList.add('hidden');
    document.getElementById('app-screen')?.classList.remove('hidden');

    const userNameElem = document.getElementById('user-name');
    if (userNameElem) userNameElem.innerText = `${activeUser} 🌟`;

    resetPinDisplay();
    listenUserData(activeUser);
  } else {
    alert(`❌ PIN Salah! (Default PIN: 123456)`);
    resetPinDisplay();
  }
}

function loginGoogle() {
  const username = prompt("Masukkan Nama Akun Anda:");
  if (!username || username.trim() === "") return;

  const cleanName = username.trim();
  const firebaseUserKey = cleanName.replace(/[.#$\[\]]/g, "_");

  if (isFirebaseReady && db) {
    db.ref(`pins/${firebaseUserKey}`).once('value').then((snapshot) => {
      let existingPin = snapshot.val();
      if (!existingPin) {
        existingPin = prompt(`Buat 6-angka PIN baru untuk akun "${cleanName}":`) || "123456";
        db.ref(`pins/${firebaseUserKey}`).set(existingPin);
      }
      localStorage.setItem('currentUser', cleanName);
      location.reload();
    });
  } else {
    let existingPin = localStorage.getItem(`pin_${firebaseUserKey}`);
    if (!existingPin) {
      existingPin = prompt(`Buat 6-angka PIN baru untuk akun "${cleanName}":`) || "123456";
      localStorage.setItem(`pin_${firebaseUserKey}`, existingPin);
    }
    localStorage.setItem('currentUser', cleanName);
    location.reload();
  }
}

function lockApp() {
  const activeUser = localStorage.getItem('currentUser');
  if (confirm(`Apakah Anda yakin ingin keluar dari akun "${activeUser || ''}"?`)) {
    if (isFirebaseReady && db && activeUser) {
      db.ref(`users/${activeUser.replace(/[.#$\[\]]/g, "_")}`).off();
    }
    localStorage.removeItem('currentUser');
    cachedUserData = null;
    resetPinDisplay();

    document.getElementById('app-screen')?.classList.add('hidden');
    document.getElementById('login-screen')?.classList.remove('hidden');
    updateLockscreenUI();
  }
}

// ==========================================
// 2. LOGIKA UTAMA RENDER & RESET OTOMATIS
// ==========================================

function renderDashboardData() {
  if (!cachedUserData) return;

  const data = cachedUserData;

  if (document.getElementById('sisa-saldo')) {
    document.getElementById('sisa-saldo').innerText = `Rp ${data.saldo.toLocaleString('id-ID')}`;
    document.getElementById('total-masuk').innerText = `Rp ${data.pemasukan.toLocaleString('id-ID')}`;
    document.getElementById('total-keluar').innerText = `Rp ${data.pengeluaran.toLocaleString('id-ID')}`;
  }

  renderAccounts(data);
  updateKategoriOptions();
  renderBudgets(data);
  renderSavings(data);
  renderTransactions(data);
}

// --- RENDER DOMPET & HAPUS AKUN ---
function renderAccounts(data) {
  const accountsContainer = document.getElementById('accounts-list');
  const accountSelect = document.getElementById('sumber-akun');
  
  if (accountsContainer) {
    accountsContainer.innerHTML = (data.accounts || []).map(acc => `
      <div class="account-card" style="padding: 10px 14px; background: rgba(255,255,255,0.05); border-radius: 12px; margin-top: 8px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <span>${acc.icon} ${acc.name}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 10px;">
          <strong style="color: #3b82f6;">Rp ${(acc.balance || 0).toLocaleString('id-ID')}</strong>
          <button onclick="hapusAkun(${acc.id})" style="background: none; border: none; cursor: pointer; font-size: 14px;" title="Hapus Akun">🗑️</button>
        </div>
      </div>
    `).join('');
  }

  if (accountSelect) {
    accountSelect.innerHTML = (data.accounts || []).map(acc => `
      <option value="${acc.name}">${acc.icon} ${acc.name}</option>
    `).join('');
  }
}

function hapusAkun(id) {
  const activeUser = localStorage.getItem('currentUser');
  if (!activeUser || !cachedUserData) return;

  const data = cachedUserData;
  const targetAcc = data.accounts.find(a => a.id === id);

  if (!targetAcc) return;

  if (confirm(`Apakah Anda yakin ingin menghapus akun "${targetAcc.name}"?`)) {
    data.accounts = data.accounts.filter(a => a.id !== id);
    saveUserDataToFirebase(activeUser, data);
    alert(`✅ Akun "${targetAcc.name}" berhasil dihapus!`);
  }
}

function toggleAccountForm() {
  const form = document.getElementById('form-akun');
  if (form) form.classList.toggle('hidden');
}

function tambahAkunCustom(e) {
  if (e) e.preventDefault();
  const activeUser = localStorage.getItem('currentUser');
  if (!activeUser || !cachedUserData) return;

  const nameInput = document.getElementById('akun-nama');
  const iconInput = document.getElementById('akun-icon');
  
  const name = nameInput ? nameInput.value.trim() : '';
  const icon = iconInput ? iconInput.value.trim() : '💳';

  if (!name) {
    alert("⚠️ Masukkan nama sumber akun!");
    return;
  }

  const data = cachedUserData;
  if (!data.accounts) data.accounts = [];

  data.accounts.push({
    id: Date.now(),
    name: name,
    icon: icon || '💳',
    balance: 0
  });

  saveUserDataToFirebase(activeUser, data);
  if (nameInput) nameInput.value = '';
  toggleAccountForm();
  alert(`🎉 Akun "${name}" berhasil ditambahkan!`);
}

// --- LOGIKA CEK & RESET BULANAN / MINGGUAN ---
function renderBudgets(data) {
  const activeUser = localStorage.getItem('currentUser');
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // ==========================================
  // 1. LOGIKA RESET PENGELUARAN BULANAN
  // ==========================================
  const lastMonth = data.lastResetMonth !== undefined ? data.lastResetMonth : currentMonth;
  const lastYear = data.lastResetYear !== undefined ? data.lastResetYear : currentYear;

  // Cek apakah bulan/tahun saat ini sudah berganti dari catatan terakhir
  if (currentMonth !== lastMonth || currentYear !== lastYear) {
    const namaBulanLalu = new Date(lastYear, lastMonth).toLocaleString('id-ID', { month: 'long', year: 'numeric' });
    const pengeluaranLalu = data.pengeluaran || 0;
    const limitLalu = data.monthlyBudget || 0;

    let pesanReset = `📅 GANTI BULAN BARU!\n\nPengeluaran Anda bulan ${namaBulanLalu} sebesar Rp ${pengeluaranLalu.toLocaleString('id-ID')} telah direset menjadi Rp 0.`;
    
    if (limitLalu > 0) {
      if (pengeluaranLalu > limitLalu) {
        pesanReset += `\n⚠️ Catatan: Bulan lalu Anda Over Budget Rp ${(pengeluaranLalu - limitLalu).toLocaleString('id-ID')}.`;
      } else {
        pesanReset += `\n🎉 Selamat! Bulan lalu Anda berhasil hemat & menjaga anggaran!`;
      }
    }

    alert(pesanReset);

    // Reset Total Pengeluaran & Pemasukan Bulanan
    data.pengeluaran = 0;
    data.pemasukan = 0;
    data.lastResetMonth = currentMonth;
    data.lastResetYear = currentYear;

    saveUserDataToFirebase(activeUser, data);
  }

  // ==========================================
  // 2. LOGIKA RESET TARGET AMAL MINGGUAN (7 HARI)
  // ==========================================
  const charityUsed = data.charityUsed || 0;
  const charityGoal = data.charityGoal || 0;
  const startDate = data.charityStartDate || Date.now();
  const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
  const timeDiff = Date.now() - startDate;

  if (charityGoal > 0 && timeDiff >= ONE_WEEK_MS) {
    if (charityUsed < charityGoal) {
      const kekurangannya = charityGoal - charityUsed;
      alert(`⚠️ PERINGATAN AMAL MINGGUAN!\n\nMasa 1 minggu telah lewat dan Target Amal Mingguan Anda BELUM TERCAPAI 😔\n\n📌 Target: Rp ${charityGoal.toLocaleString('id-ID')}\n✨ Terkumpul: Rp ${charityUsed.toLocaleString('id-ID')}\n🔻 Kurang: Rp ${kekurangannya.toLocaleString('id-ID')}`);
    } else {
      alert(`🎉 Selamat! Minggu lalu Anda telah berhasil mencapai Target Amal Mingguan Rp ${charityGoal.toLocaleString('id-ID')}! 🤲✨`);
    }

    data.charityUsed = 0;
    data.charityStartDate = Date.now();
    saveUserDataToFirebase(activeUser, data);
  }

  // Update Tampilan Target Amal
  if (document.getElementById('charity-used-text')) {
    document.getElementById('charity-used-text').innerText = `✨ Terkumpul: Rp ${charityUsed.toLocaleString('id-ID')}`;
    document.getElementById('charity-limit-text').innerText = `🎯 Target: Rp ${charityGoal.toLocaleString('id-ID')}`;
  }
  
  const charityPercent = charityGoal > 0 ? Math.min((charityUsed / charityGoal) * 100, 100) : 0;
  const charityBar = document.getElementById('charity-progress-bar');
  if (charityBar) {
    charityBar.style.width = `${charityPercent}%`;
    charityBar.style.backgroundColor = charityPercent >= 100 ? "#10b981" : "#3b82f6";
  }

  // Update Tampilan Pengeluaran Bulanan
  const budgetUsed = data.pengeluaran || 0;
  const budgetLimit = data.monthlyBudget || 0;

  if (document.getElementById('budget-used-text')) {
    document.getElementById('budget-used-text').innerText = `💸 Terpakai: Rp ${budgetUsed.toLocaleString('id-ID')}`;
    document.getElementById('budget-limit-text').innerText = `🛑 Batas: Rp ${budgetLimit.toLocaleString('id-ID')}`;
  }
  
  const budgetPercent = budgetLimit > 0 ? Math.min((budgetUsed / budgetLimit) * 100, 100) : 0;
  const budgetBar = document.getElementById('budget-progress-bar');
  if (budgetBar) {
    budgetBar.style.width = `${budgetPercent}%`;
    budgetBar.style.backgroundColor = (budgetLimit > 0 && budgetUsed >= budgetLimit) ? "#ef4444" : "#3b82f6";
  }
}

// --- FITUR TARGET IMPIAN / TABUNGAN ---
function toggleSavingsForm() {
  const form = document.getElementById('form-tabungan');
  if (form) form.classList.toggle('hidden');
}

function tambahTargetTabungan(e) {
  if (e) e.preventDefault();
  const activeUser = localStorage.getItem('currentUser');
  if (!activeUser || !cachedUserData) return;

  const nama = document.getElementById('target-nama')?.value;
  const nominalTarget = parseFloat(document.getElementById('target-nominal')?.value) || 0;
  const terkumpul = parseFloat(document.getElementById('target-terkumpul')?.value) || 0;

  if (!nama || nominalTarget <= 0) {
    alert("⚠️ Harap isi nama target dan nominal harga dengan benar!");
    return;
  }

  const data = cachedUserData;
  if (!data.savings) data.savings = [];

  const isAchieved = terkumpul >= nominalTarget;

  data.savings.push({
    id: Date.now(),
    nama,
    target: nominalTarget,
    terkumpul: terkumpul
  });

  saveUserDataToFirebase(activeUser, data);
  
  if (document.getElementById('target-nama')) document.getElementById('target-nama').value = '';
  if (document.getElementById('target-nominal')) document.getElementById('target-nominal').value = '';
  if (document.getElementById('target-terkumpul')) document.getElementById('target-terkumpul').value = '';
  toggleSavingsForm();

  if (isAchieved) {
    alert(`🎉 CELEBRATION! Target Impian "${nama}" Anda telah TERCAPAI 100%! 🥳🎁`);
  } else {
    alert("🚀 Target Impian baru berhasil ditambahkan!");
  }
}

function tambahSaldoImpian(id) {
  const activeUser = localStorage.getItem('currentUser');
  if (!activeUser || !cachedUserData) return;

  const maba = prompt("💵 Masukkan jumlah tabungan yang ingin ditambahkan (Rp):");
  if (!maba || isNaN(maba) || parseFloat(maba) <= 0) return;

  const data = cachedUserData;
  const item = data.savings.find(s => s.id === id);

  if (item) {
    item.terkumpul += parseFloat(maba);
    saveUserDataToFirebase(activeUser, data);

    if (item.terkumpul >= item.target) {
      alert(`🎉 SELAMAT! Impian Anda "${item.nama}" telah TERCAPAI 100%! 🥳🎁`);
    } else {
      alert("🎉 Tabungan berhasil ditambahkan!");
    }
  }
}

// --- ATUR TARGET ---
function setWeeklyCharityGoal() {
  const activeUser = localStorage.getItem('currentUser');
  if (!activeUser || !cachedUserData) return;
  const goal = prompt("🤲 Masukkan Target Amal Mingguan (Rp):");
  if (goal && !isNaN(goal) && parseFloat(goal) > 0) {
    const data = cachedUserData;
    data.charityGoal = parseFloat(goal);
    data.charityUsed = 0;
    data.charityStartDate = Date.now();
    saveUserDataToFirebase(activeUser, data);
    alert(`🎯 Target Amal Mingguan diset ke Rp ${parseFloat(goal).toLocaleString('id-ID')}`);
  }
}

function setMonthlyBudget() {
  const activeUser = localStorage.getItem('currentUser');
  if (!activeUser || !cachedUserData) return;
  const budget = prompt("📊 Masukkan Batas Pengeluaran Bulanan (Rp):");
  if (budget && !isNaN(budget) && parseFloat(budget) > 0) {
    const data = cachedUserData;
    data.monthlyBudget = parseFloat(budget);
    saveUserDataToFirebase(activeUser, data);
    alert(`🛑 Batas Pengeluaran Bulanan diset ke Rp ${parseFloat(budget).toLocaleString('id-ID')}`);
  }
}

// --- FITUR TRANSAKSI ---
function updateKategoriOptions() {
  const tipe = document.getElementById('tipe')?.value;
  const kategoriSelect = document.getElementById('kategori');
  if (!kategoriSelect) return;

  if (tipe === 'masuk') {
    kategoriSelect.innerHTML = `
      <option value="Gaji">💼 Gaji Utama</option>
      <option value="Bonus">🎁 Bonus & Hadiah</option>
      <option value="Investasi">📈 Hasil Investasi</option>
      <option value="Sampingan">⚡ Usaha Sampingan</option>
      <option value="Lainnya">💰 Lainnya...</option>
    `;
  } else {
    kategoriSelect.innerHTML = `
      <option value="Makanan">🍔 Makanan & Minuman</option>
      <option value="Transport">🚗 Transportasi</option>
      <option value="Belanja">🛍️ Belanja & Kebutuhan</option>
      <option value="Tagihan">📄 Tagihan & Bulanan</option>
      <option value="Amal">🤲 Sedekah & Amal</option>
      <option value="Hiburan">🎮 Hiburan & Liburan</option>
      <option value="Lainnya">💰 Lainnya...</option>
    `;
  }
}

function renderSavings(data) {
  const container = document.getElementById('savings-list');
  if (!container) return;

  const list = data.savings || [];
  if (list.length === 0) {
    container.innerHTML = `<p style="font-size:12px; color:#94a3b8; text-align:center; padding: 10px;">Belum ada target impian. Klik + Tambah Target di atas 🎯</p>`;
    return;
  }

  container.innerHTML = list.map(item => {
    const percent = Math.min(Math.round((item.terkumpul / item.target) * 100), 100);
    const isCompleted = percent >= 100;

    return `
      <div style="background: ${isCompleted ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.05)'}; padding: 12px; border-radius: 12px; border: 1px solid ${isCompleted ? '#10b981' : 'rgba(255,255,255,0.1)'}; margin-top: 8px;">
        <div style="display:flex; justify-content:space-between; margin-bottom: 5px;">
          <strong>🎁 ${item.nama} ${isCompleted ? '✅ (Tercapai!)' : ''}</strong>
          <span style="color:${isCompleted ? '#10b981' : '#3b82f6'}; font-weight:bold;">${percent}%</span>
        </div>
        <div style="font-size: 12px; color: #94a3b8; margin-bottom: 6px;">
          Terkumpul: Rp ${item.terkumpul.toLocaleString('id-ID')} / Rp ${item.target.toLocaleString('id-ID')}
        </div>
        <div class="progress-bar-bg" style="height: 6px;">
          <div class="progress-bar-fill" style="width: ${percent}%; background-color: ${isCompleted ? '#10b981' : '#3b82f6'};"></div>
        </div>
        ${!isCompleted ? `<button onclick="tambahSaldoImpian(${item.id})" class="btn-text" style="margin-top: 8px; font-size:11px;">💵 + Nabung Lagi</button>` : `<div style="font-size:11px; color:#10b981; margin-top:6px; font-weight:bold;">🎉 Impian Siap Diwujudkan!</div>`}
      </div>
    `;
  }).join('');
}

function setFilter(type, elem) {
  currentFilter = type;
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  if (elem) elem.classList.add('active');
  if (cachedUserData) renderTransactions(cachedUserData);
}

function renderTransactions(data) {
  const listElem = document.getElementById('daftar-transaksi');
  const countElem = document.getElementById('transaction-count');
  if (!listElem) return;

  let items = data.transaksi || [];
  if (currentFilter !== 'all') items = items.filter(t => t.tipe === currentFilter);

  if (countElem) countElem.innerText = `${items.length} Transaksi`;

  if (items.length === 0) {
    listElem.innerHTML = `<li style="padding:15px; text-align:center; color:#94a3b8; font-size:13px;">Belum ada riwayat transaksi 📝</li>`;
    return;
  }

  listElem.innerHTML = items.map(t => {
    // Ambil emoji berdasarkan kategori transaksi
    const categoryIcon = getCategoryIcon(t.kategori);

    return `
      <li style="padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center;">
        <div>
          <!-- Menampilkan Emoji + Deskripsi + (Kategori) -->
          <strong>${categoryIcon} ${t.deskripsi}</strong> <small style="opacity:0.8;">(${t.kategori})</small><br>
          <small style="color:#94a3b8;">${t.akunNama} • ${t.tanggal}</small>
        </div>
        <span style="color: ${t.tipe === 'masuk' ? '#10b981' : '#ef4444'}; font-weight: bold;">
          ${t.tipe === 'masuk' ? '+' : '-'} Rp ${t.nominal.toLocaleString('id-ID')}
        </span>
      </li>
    `;
  }).join('');
}

function eksporKeCSV() {
  if (!cachedUserData || !cachedUserData.transaksi || cachedUserData.transaksi.length === 0) {
    alert("⚠️ Tidak ada data transaksi untuk diekspor!");
    return;
  }

  let csv = "Tanggal,Deskripsi,Kategori,Akun,Tipe,Nominal\n";
  cachedUserData.transaksi.forEach(t => {
    csv += `"${t.tanggal}","${t.deskripsi}","${t.kategori}","${t.akunNama}","${t.tipe}",${t.nominal}\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('href', url);
  a.setAttribute('download', `Transaksi_${localStorage.getItem('currentUser')}.csv`);
  a.click();
}

function toggleDarkMode() {
  document.body.classList.toggle('light-mode');
}

// ==========================================
// 3. EVENT LISTENERS BINDING
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
  const activeUser = localStorage.getItem('currentUser');
  updateLockscreenUI();

  if (activeUser) {
    document.getElementById('login-screen')?.classList.add('hidden');
    document.getElementById('app-screen')?.classList.remove('hidden');
    const userNameElem = document.getElementById('user-name');
    if (userNameElem) userNameElem.innerText = `${activeUser} 🌟`;
    
    listenUserData(activeUser);
  }

  // Event Listener Form Transaksi
  document.getElementById('form-transaksi')?.addEventListener('submit', function(e) {
    e.preventDefault();
    const activeUser = localStorage.getItem('currentUser');
    if (!activeUser || !cachedUserData) return;

    const data = cachedUserData;
    const deskripsi = document.getElementById('deskripsi').value;
    const nominal = parseFloat(document.getElementById('nominal').value) || 0;
    const tipe = document.getElementById('tipe').value;
    const akunNama = document.getElementById('sumber-akun').value;
    const kategori = document.getElementById('kategori').value;

    if (nominal <= 0) {
      alert("⚠️ Masukkan nominal yang valid!");
      return;
    }

    if (tipe === 'masuk') {
      data.saldo += nominal;
      data.pemasukan += nominal;
    } else {
      data.saldo -= nominal;
      data.pengeluaran += nominal;
      if (kategori === 'Amal') data.charityUsed = (data.charityUsed || 0) + nominal;
    }

    const targetAcc = data.accounts.find(a => a.name === akunNama);
    if (targetAcc) {
      targetAcc.balance = (targetAcc.balance || 0) + (tipe === 'masuk' ? nominal : -nominal);
    }

    if (!data.transaksi) data.transaksi = [];
    data.transaksi.unshift({
      id: Date.now(),
      deskripsi,
      nominal,
      tipe,
      akunNama,
      kategori,
      tanggal: new Date().toLocaleDateString('id-ID')
    });

    saveUserDataToFirebase(activeUser, data);
    this.reset();
    alert("✅ Transaksi berhasil dicatat!");
  });

  document.getElementById('form-akun')?.addEventListener('submit', tambahAkunCustom);
  document.getElementById('form-tabungan')?.addEventListener('submit', tambahTargetTabungan);
});

// Fungsi untuk mengambil emoji berdasarkan nama kategori
function getCategoryIcon(kategori) {
  const icons = {
    // Kategori Pemasukan
    'Gaji': '💼',
    'Bonus': '🎁',
    'Investasi': '📈',
    'Sampingan': '⚡',
    'Lainnya': '💡',
    
    // Kategori Pengeluaran
    'Makanan': '🍔',
    'Transport': '🚗',
    'Belanja': '🛍️',
    'Tagihan': '📄',
    'Amal': '🤲',
    'Hiburan': '🎮'
  };

  // Jika kategori ditemukan gunakan emojinya, jika tidak gunakan emoji default 🏷️
  return icons[kategori] || '🏷️';
}