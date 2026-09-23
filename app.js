// ==========================================
// KODE UTUH APP.JS (DENGAN NOTIFIKASI LIMIT & TARGET)
// ==========================================

let currentInputPin = "";
let currentFilter = 'all';

// --- DATA STORAGE PER-AKUN ---
function getUserData(username) {
  if (!username) return null;
  const data = localStorage.getItem(`appData_${username}`);
  return data ? JSON.parse(data) : {
    saldo: 0,
    pemasukan: 0,
    pengeluaran: 0,
    transaksi: [],
    accounts: [
      { id: 1, name: 'Tunai', icon: '💵', balance: 0 },
      { id: 2, name: 'Bank BCA', icon: '💳', balance: 0 }
    ],
    charityGoal: 50000,
    charityUsed: 0,
    monthlyBudget: 1000000,
    savings: []
  };
}

function saveUserData(username, data) {
  if (username) {
    localStorage.setItem(`appData_${username}`, JSON.stringify(data));
  }
}

// --- LOCKSCREEN & UI MANAGEMENT ---
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

// --- KEYPAD & PIN LOGIC ---
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

  const savedPin = localStorage.getItem(`pin_${activeUser}`);

  if (currentInputPin === savedPin) {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('app-screen').classList.remove('hidden');

    const userNameElem = document.getElementById('user-name');
    if (userNameElem) userNameElem.innerText = `${activeUser} 🌟`;

    resetPinDisplay();
    renderDashboardData();
  } else {
    alert(`❌ PIN Salah untuk akun "${activeUser}"!`);
    resetPinDisplay();
  }
}

// --- LOGOUT & LOGIN SYSTEM ---
function lockApp() {
  const activeUser = localStorage.getItem('currentUser');
  const confirmLogout = confirm(`Apakah Anda yakin ingin keluar dari akun "${activeUser || ''}"?`);
  if (!confirmLogout) return;

  localStorage.removeItem('currentUser');
  resetPinDisplay();

  document.getElementById('app-screen').classList.add('hidden');
  document.getElementById('login-screen').classList.remove('hidden');

  updateLockscreenUI();
}

function loginGoogle() {
  const username = prompt("Masukkan Nama Akun Anda / Teman Anda (misal: Budi):");
  if (!username || username.trim() === "") return;

  const cleanName = username.trim();
  localStorage.setItem('currentUser', cleanName);

  if (!localStorage.getItem(`pin_${cleanName}`)) {
    const newPin = prompt(`Buat 6-angka PIN baru untuk akun "${cleanName}":`);
    if (newPin && newPin.length === 6 && !isNaN(newPin)) {
      localStorage.setItem(`pin_${cleanName}`, newPin);
      alert(`🎉 PIN untuk akun "${cleanName}" berhasil dibuat!`);
    } else {
      alert("⚠️ PIN diset ke default: 123456");
      localStorage.setItem(`pin_${cleanName}`, "123456");
    }
  }

  location.reload();
}

// --- RENDER DASHBOARD & UTILS ---
function renderDashboardData() {
  const activeUser = localStorage.getItem('currentUser');
  if (!activeUser) return;

  const data = getUserData(activeUser);

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

function renderAccounts(data) {
  const accountsContainer = document.getElementById('accounts-list');
  const accountSelect = document.getElementById('sumber-akun');
  
  if (accountsContainer) {
    accountsContainer.innerHTML = (data.accounts || []).map(acc => `
      <div class="account-card" style="padding: 10px 14px; background: rgba(255,255,255,0.05); border-radius: 12px; margin-top: 8px; display: flex; justify-content: space-between; align-items: center;">
        <span>${acc.icon} ${acc.name}</span>
        <strong style="color: #3b82f6;">Rp ${(acc.balance || 0).toLocaleString('id-ID')}</strong>
      </div>
    `).join('');
  }

  if (accountSelect) {
    accountSelect.innerHTML = (data.accounts || []).map(acc => `
      <option value="${acc.name}">${acc.icon} ${acc.name}</option>
    `).join('');
  }
}

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
    `;
  } else {
    kategoriSelect.innerHTML = `
      <option value="Makanan">🍔 Makanan & Minuman</option>
      <option value="Transport">🚗 Transportasi</option>
      <option value="Belanja">🛍️ Belanja & Kebutuhan</option>
      <option value="Tagihan">📄 Tagihan & Bulanan</option>
      <optio  n value="Amal">🤲 Sedekah & Amal</option>
      <option value="Hiburan">🎮 Hiburan & Liburan</option>
      <option value="Amal">💲 Amal Mingguan</option>
    `;
  }
}

// --- RENDER BUDGETS & PERINGATAN (NOTIFIKASI) ---
// --- RENDER BUDGETS & PERINGATAN OTOMATIS (AMAL & PENGELUARAN) ---
// --- RENDER BUDGETS & PERINGATAN OTOMATIS (AMAL & PENGELUARAN) ---
function renderBudgets(data) {
  const activeUser = localStorage.getItem('currentUser');
  if (!activeUser) return;

  // ==========================================
  // 1. LOGIKA CEK TARGET AMAL MINGGUAN (7 HARI)
  // ==========================================
  const charityUsed = data.charityUsed || 0;
  const charityGoal = data.charityGoal || 0;
  const startDate = data.charityStartDate || Date.now();
  const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000; // 7 hari
  const timeDiff = Date.now() - startDate;

  // Cek apakah sudah lewat 7 hari
  if (charityGoal > 0 && timeDiff >= ONE_WEEK_MS) {
    if (charityUsed < charityGoal) {
      const kekurangannya = charityGoal - charityUsed;
      alert(`⚠️ PERINGATAN AMAL MINGGUAN!\n\nMasa 1 minggu telah lewat dan Target Amal Mingguan Anda BELUM TERCAPAI 😔\n\n📌 Target: Rp ${charityGoal.toLocaleString('id-ID')}\n✨ Terkumpul: Rp ${charityUsed.toLocaleString('id-ID')}\n🔻 Kurang: Rp ${kekurangannya.toLocaleString('id-ID')}\n\nTarget amal akan direset untuk minggu yang baru.`);
    } else {
      alert(`🎉 Selamat! Minggu lalu Anda telah berhasil mencapai Target Amal Mingguan Rp ${charityGoal.toLocaleString('id-ID')}! 🤲✨ Target direset untuk minggu baru.`);
    }

    // Reset progres amal untuk minggu berikutnya
    data.charityUsed = 0;
    data.charityStartDate = Date.now();
    saveUserData(activeUser, data);
  }

  // Update Tampilan Target Amal
  document.getElementById('charity-used-text').innerText = `✨ Terkumpul: Rp ${(data.charityUsed || 0).toLocaleString('id-ID')}`;
  document.getElementById('charity-limit-text').innerText = `🎯 Target: Rp ${charityGoal.toLocaleString('id-ID')}`;
  
  const charityPercent = charityGoal > 0 ? Math.min(((data.charityUsed || 0) / charityGoal) * 100, 100) : 0;
  const charityBar = document.getElementById('charity-progress-bar');
  if (charityBar) {
    charityBar.style.width = `${charityPercent}%`;
    charityBar.style.backgroundColor = charityPercent >= 100 ? "#10b981" : "#3b82f6";
  }

  // ==========================================
  // 2. LOGIKA CEK BATAS PENGELUARAN BULANAN
  // ==========================================
  const budgetUsed = data.pengeluaran || 0;
  const budgetLimit = data.monthlyBudget || 0;

  // Update Tampilan Teks
  document.getElementById('budget-used-text').innerText = `💸 Terpakai: Rp ${budgetUsed.toLocaleString('id-ID')}`;
  document.getElementById('budget-limit-text').innerText = `🛑 Batas: Rp ${budgetLimit.toLocaleString('id-ID')}`;
  
  const budgetPercent = budgetLimit > 0 ? Math.min((budgetUsed / budgetLimit) * 100, 100) : 0;
  const budgetBar = document.getElementById('budget-progress-bar');
  
  if (budgetBar) {
    budgetBar.style.width = `${budgetPercent}%`;
    
    // Perubahan Warna Bar & Peringatan Otomatis
    if (budgetLimit > 0 && budgetUsed >= budgetLimit) {
      budgetBar.style.backgroundColor = "#ef4444"; // Warna Merah Peringatan
      
      // Kirim Notifikasi Peringatan jika belum diberi tahu di sesi ini
      if (!sessionStorage.getItem(`warned_budget_${activeUser}`)) {
        const kelebihan = budgetUsed - budgetLimit;
        if (kelebihan > 0) {
          alert(`🚨 PERINGATAN OVER BUDGET!\n\nPengeluaran Anda telah MELEBIHI batas bulanan!\n🛑 Batas: Rp ${budgetLimit.toLocaleString('id-ID')}\n💸 Pengeluaran: Rp ${budgetUsed.toLocaleString('id-ID')}\n🔥 Kelebihan: Rp ${kelebihan.toLocaleString('id-ID')}\n\nHarap kurangi pengeluaran Anda!`);
        } else {
          alert(`⚠️ PERINGATAN BATAS PENGELUARAN!\n\nPengeluaran Anda pas telah MENCAPAI BATAS MAX (Rp ${budgetLimit.toLocaleString('id-ID')})!`);
        }
        // Tanda agar tidak terus-menerus muncul pop-up saat klik menu lain
        sessionStorage.setItem(`warned_budget_${activeUser}`, 'true');
      }
    } else {
      budgetBar.style.backgroundColor = "#3b82f6"; // Warna Biru Normal
      sessionStorage.removeItem(`warned_budget_${activeUser}`);
    }
  }
}

// --- LOGIKA TARGET IMPIAN & TABUNGAN ---
function toggleSavingsForm() {
  document.getElementById('form-tabungan')?.classList.toggle('hidden');
}

function tambahTargetTabungan(e) {
  e.preventDefault();
  const activeUser = localStorage.getItem('currentUser');
  if (!activeUser) return;

  const data = getUserData(activeUser);
  const nama = document.getElementById('target-nama').value;
  const nominalTarget = parseFloat(document.getElementById('target-nominal').value) || 0;
  const terkumpul = parseFloat(document.getElementById('target-terkumpul').value) || 0;

  if (!nama || nominalTarget <= 0) {
    alert("⚠️ Harap isi nama target dan nominal harga dengan benar!");
    return;
  }

  if (!data.savings) data.savings = [];

  const isAchieved = terkumpul >= nominalTarget;

  data.savings.push({
    id: Date.now(),
    nama,
    target: nominalTarget,
    terkumpul: terkumpul,
    notified: isAchieved // Tanda jika sudah pernah diberi notif
  });

  saveUserData(activeUser, data);
  
  document.getElementById('target-nama').value = '';
  document.getElementById('target-nominal').value = '';
  document.getElementById('target-terkumpul').value = '';
  toggleSavingsForm();

  renderDashboardData();

  if (isAchieved) {
    alert(`🎉 CELEBRATION! Target Impian "${nama}" Anda sudah TERCAPAI 100%! Selamat! 🥳🎁`);
  } else {
    alert("🚀 Target Impian baru berhasil ditambahkan!");
  }
}

function tambahSaldoImpian(id) {
  const activeUser = localStorage.getItem('currentUser');
  if (!activeUser) return;

  const maba = prompt("💵 Masukkan jumlah tabungan yang ingin ditambahkan (Rp):");
  if (!maba || isNaN(maba) || parseFloat(maba) <= 0) return;

  const data = getUserData(activeUser);
  const item = data.savings.find(s => s.id === id);

  if (item) {
    item.terkumpul += parseFloat(maba);
    saveUserData(activeUser, data);
    renderDashboardData();

    // Notifikasi jika Target Impian Tercapai
    if (item.terkumpul >= item.target) {
      alert(`🎉 SELAMAT! Impian Anda "${item.nama}" telah TERCAPAI 100%! Silakan wujudkan impian Anda! 🥳🎁`);
    } else {
      alert("🎉 Tabungan berhasil ditambahkan!");
    }
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
      <div style="background: ${isCompleted ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.05)'}; padding: 12px; border-radius: 12px; border: 1px solid ${isCompleted ? '#10b981' : 'rgba(255,255,255,0.1)'};">
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

// --- FORM TRANSAKSI HANDLER & NOTIFIKASI OTOMATIS ---
document.getElementById('form-transaksi')?.addEventListener('submit', function(e) {
  e.preventDefault();
  const activeUser = localStorage.getItem('currentUser');
  if (!activeUser) return;

  const data = getUserData(activeUser);
  const deskripsi = document.getElementById('deskripsi').value;
  const nominal = parseFloat(document.getElementById('nominal').value) || 0;
  const tipe = document.getElementById('tipe').value;
  const akunNama = document.getElementById('sumber-akun').value;
  const kategori = document.getElementById('kategori').value;

  if (nominal <= 0) {
    alert("⚠️ Masukkan nominal yang valid!");
    return;
  }

  // Simpan Status Sebelum Transaksi untuk pengecekan Notifikasi
  const prevCharity = data.charityUsed || 0;
  const prevExpense = data.pengeluaran || 0;

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

  data.transaksi.unshift({
    id: Date.now(),
    deskripsi,
    nominal,
    tipe,
    akunNama,
    kategori,
    tanggal: new Date().toLocaleDateString('id-ID')
  });

  saveUserData(activeUser, data);
  this.reset();
  renderDashboardData();

  // === AMBIL PERINGATAN / NOTIFIKASI SETELAH TRANSAKSI ===

  // Notifikasi 1: Target Amal Mingguan
  if (kategori === 'Amal' && data.charityGoal > 0) {
    if (prevCharity < data.charityGoal && data.charityUsed >= data.charityGoal) {
      alert(`🤲 ALHAMDULILLAH! Target Amal Mingguan Anda sebesar Rp ${data.charityGoal.toLocaleString('id-ID')} telah TERCAPAI 100%! ✨`);
    }
  }

  // Notifikasi 2: Batas Pengeluaran Bulanan
  if (tipe === 'keluar' && data.monthlyBudget > 0) {
    if (data.pengeluaran >= data.monthlyBudget && prevExpense < data.monthlyBudget) {
      alert(`⚠️ PERINGATAN LERENG BUDGET! Pengeluaran Anda sudah MENCAPAI BATAS MAX (Rp ${data.monthlyBudget.toLocaleString('id-ID')})! Harap hemat pengeluaran! 🛑`);
    } else if (data.pengeluaran > data.monthlyBudget) {
      alert(`🚨 OVER BUDGET! Pengeluaran Anda telah MELEBIHI batas bulanan sebesar Rp ${(data.pengeluaran - data.monthlyBudget).toLocaleString('id-ID')}!`);
    }
  }

  alert("✅ Transaksi berhasil dicatat!");
});

// --- RENDER RIWAYAT TRANSAKSI ---
function renderTransactions(data) {
  const listElem = document.getElementById('daftar-transaksi');
  const countElem = document.getElementById('transaction-count');
  if (!listElem) return;

  let items = data.transaksi || [];
  if (currentFilter !== 'all') {
    items = items.filter(t => t.tipe === currentFilter);
  }

  if (countElem) countElem.innerText = `${items.length} Transaksi`;

  if (items.length === 0) {
    listElem.innerHTML = `<li style="padding:15px; text-align:center; color:#94a3b8; font-size:13px;">Belum ada riwayat transaksi 📝</li>`;
    return;
  }

  listElem.innerHTML = items.map(t => `
    <li style="padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center;">
      <div>
        <strong>${t.deskripsi}</strong> <small style="opacity:0.8;">(${t.kategori})</small><br>
        <small style="color:#94a3b8;">${t.akunNama} • ${t.tanggal}</small>
      </div>
      <span style="color: ${t.tipe === 'masuk' ? '#10b981' : '#ef4444'}; font-weight: bold;">
        ${t.tipe === 'masuk' ? '+' : '-'} Rp ${t.nominal.toLocaleString('id-ID')}
      </span>
    </li>
  `).join('');
}

// --- HELPER LAINNYA ---
function toggleAccountForm() {
  document.getElementById('form-akun')?.classList.toggle('hidden');
}

function tambahAkunCustom(e) {
  e.preventDefault();
  const activeUser = localStorage.getItem('currentUser');
  if (!activeUser) return;

  const data = getUserData(activeUser);
  const name = document.getElementById('akun-nama').value;
  const icon = document.getElementById('akun-icon').value;

  if (name) {
    data.accounts.push({ id: Date.now(), name, icon, balance: 0 });
    saveUserData(activeUser, data);
    document.getElementById('akun-nama').value = '';
    toggleAccountForm();
    renderDashboardData();
    alert("🎉 Akun baru berhasil ditambahkan!");
  }
}

function setFilter(type, elem) {
  currentFilter = type;
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  elem.classList.add('active');
  const activeUser = localStorage.getItem('currentUser');
  if (activeUser) renderTransactions(getUserData(activeUser));
}

function setWeeklyCharityGoal() {
  const activeUser = localStorage.getItem('currentUser');
  if (!activeUser) return;
  const goal = prompt("🤲 Masukkan Target Amal Mingguan (Rp):");
  if (goal && !isNaN(goal) && parseFloat(goal) > 0) {
    const data = getUserData(activeUser);
    data.charityGoal = parseFloat(goal);
    data.charityUsed = 0; // Reset progres amal
    data.charityStartDate = Date.now(); // Simpan waktu mulai minggu ini
    
    saveUserData(activeUser, data);
    renderDashboardData();
    alert(`🎯 Target Amal Mingguan sebesar Rp ${parseFloat(goal).toLocaleString('id-ID')} berhasil diatur!`);
  }
}

function setMonthlyBudget() {
  const activeUser = localStorage.getItem('currentUser');
  if (!activeUser) return;
  const budget = prompt("📊 Masukkan Batas Pengeluaran Bulanan (Rp):");
  if (budget && !isNaN(budget)) {
    const data = getUserData(activeUser);
    data.monthlyBudget = parseFloat(budget);
    saveUserData(activeUser, data);
    renderDashboardData();
  }
}

function eksporKeCSV() {
  const activeUser = localStorage.getItem('currentUser');
  if (!activeUser) return;
  const data = getUserData(activeUser);
  if (!data.transaksi || data.transaksi.length === 0) {
    alert("⚠️ Tidak ada data transaksi untuk diekspor!");
    return;
  }

  let csv = "Tanggal,Deskripsi,Kategori,Akun,Tipe,Nominal\n";
  data.transaksi.forEach(t => {
    csv += `"${t.tanggal}","${t.deskripsi}","${t.kategori}","${t.akunNama}","${t.tipe}",${t.nominal}\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('href', url);
  a.setAttribute('download', `Transaksi_${activeUser}.csv`);
  a.click();
}

function toggleDarkMode() {
  document.body.classList.toggle('light-mode');
}

// --- INIT APP ---
document.addEventListener('DOMContentLoaded', function() {
  const activeUser = localStorage.getItem('currentUser');
  updateLockscreenUI();

  if (activeUser) {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('app-screen').classList.remove('hidden');
    const userNameElem = document.getElementById('user-name');
    if (userNameElem) userNameElem.innerText = `${activeUser} 🌟`;
    renderDashboardData();
  }
});