// ==========================================
// 1. KONFIGURASI FIREBASE & STATE GLOBAL
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "dompetku-e36ee.firebaseapp.com",
  projectId: "dompetku-e36ee",
  storageBucket: "dompetku-e36ee.appspot.com",
  messagingSenderId: "...",
  appId: "..."
};

// Inisialisasi Firebase jika belum diinisialisasi
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

let currentSymbol = "Rp ";
let transactions = JSON.parse(localStorage.getItem("dompetku_tx")) || [];

// ==========================================
// 2. ELEMEN DOM UTAMA
// ==========================================
const currencySelect = document.getElementById("currency-select");
const btnGoogleHeader = document.getElementById("btn-google-header");
const btnLocalLogin = document.getElementById("btn-local-login");
const localPasswordInput = document.getElementById("local-password");
const loginSection = document.getElementById("login-section");
const mainDashboard = document.getElementById("main-dashboard");
const transactionForm = document.getElementById("transaction-form");
const historyList = document.getElementById("history-list");
const themeToggle = document.getElementById("theme-toggle");

// ==========================================
// 3. FITUR MATA UANG DINAMIS
// ==========================================
function formatCurrency(amount) {
  const number = parseFloat(amount) || 0;
  return currentSymbol + number.toLocaleString("id-ID");
}

function loadSavedCurrency() {
  const savedCurrency = localStorage.getItem("user_currency");
  if (savedCurrency && currencySelect) {
    currencySelect.value = savedCurrency;
    const [, symbol] = savedCurrency.split("|");
    currentSymbol = symbol;
  }
}

if (currencySelect) {
  currencySelect.addEventListener("change", (e) => {
    const selectedValue = e.target.value;
    const [, symbol] = selectedValue.split("|");
    currentSymbol = symbol;
    localStorage.setItem("user_currency", selectedValue);
    updateDashboardUI();
  });
}

// ==========================================
// 4. LOGIN LOKAL & GOOGLE CLOUD SYNC
// ==========================================
btnLocalLogin.addEventListener("click", () => {
  const password = localPasswordInput.value.trim();
  if (password === "") {
    alert("Silakan masukkan PIN/Password!");
    return;
  }
  
  // Buka Dashboard
  loginSection.classList.add("hidden");
  mainDashboard.classList.remove("hidden");
  updateDashboardUI();
});

btnGoogleHeader.addEventListener("click", () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  firebase.auth().signInWithPopup(provider)
    .then((result) => {
      const user = result.user;
      document.getElementById("user-name").innerText = user.displayName;
      document.getElementById("user-avatar").src = user.photoURL;
      document.getElementById("google-status-text").innerText = "Tersambung";
      document.getElementById("cloud-status-badge").innerText = "⚡ Terkoneksi: Google Cloud";
      alert("Berhasil terhubung ke Google Cloud!");
    })
    .catch((error) => {
      console.error(error);
      alert("Gagal koneksi Google Cloud: " + error.message);
    });
});

// ==========================================
// 5. MANAJEMEN TRANSAKSI & UI
// ==========================================
transactionForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const type = document.getElementById("tx-type").value;
  const category = document.getElementById("tx-category").value;
  const amount = parseFloat(document.getElementById("tx-amount").value) || 0;
  const wallet = document.getElementById("tx-wallet").value;
  const note = document.getElementById("tx-note").value || category;

  const newTx = {
    id: Date.now(),
    type,
    category,
    amount,
    wallet,
    note,
    date: new Date().toLocaleDateString("id-ID")
  };

  transactions.unshift(newTx);
  localStorage.setItem("dompetku_tx", JSON.stringify(transactions));

  transactionForm.reset();
  updateDashboardUI();
});

function updateDashboardUI() {
  let totalIncome = 0;
  let totalExpense = 0;

  historyList.innerHTML = "";

  transactions.forEach((tx) => {
    if (tx.type === "income") {
      totalIncome += tx.amount;
    } else {
      totalExpense += tx.amount;
    }

    const li = document.createElement("li");
    li.className = "history-item";
    li.innerHTML = `
      <div class="item-info">
        <div class="item-details">
          <h4>${tx.note}</h4>
          <p>${tx.category} • ${tx.wallet} • ${tx.date}</p>
        </div>
      </div>
      <div class="amount ${tx.type === "income" ? "in" : "out"}">
        ${tx.type === "income" ? "+" : "-"} ${formatCurrency(tx.amount)}
      </div>
    `;
    historyList.appendChild(li);
  });

  const totalBalance = totalIncome - totalExpense;

  document.getElementById("total-balance").innerText = formatCurrency(totalBalance);
  document.getElementById("total-income").innerText = formatCurrency(totalIncome);
  document.getElementById("total-expense").innerText = formatCurrency(totalExpense);

  // Render Wallet Grid Dummy
  const walletGrid = document.getElementById("wallet-grid");
  walletGrid.innerHTML = `
    <div class="wallet-card">
      <h4>Dompet Utama</h4>
      <p>${formatCurrency(totalBalance * 0.7)}</p>
    </div>
    <div class="wallet-card">
      <h4>Kantung Tabungan</h4>
      <p>${formatCurrency(totalBalance * 0.3)}</p>
    </div>
  `;
}

// Mode Gelap/Terang Toggle
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("light-mode");
  themeToggle.innerText = document.body.classList.contains("light-mode") ? "☀️" : "🌙";
});

// Inisialisasi Awal
loadSavedCurrency();