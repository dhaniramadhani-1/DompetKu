
// ISI DENGAN KONFIGURASI ASLI DARI FIREBASE CONSOLE ANDA
const firebaseConfig = {
  apiKey: "AIzaSyC5pL1W406iTsI3zlffPmAQ1hGWINvoaIM",
  authDomain: "dompetku-e36ee.firebaseapp.com",
  projectId: "dompetku-e36ee",
  storageBucket: "dompetku-e36ee.firebasestorage.app",
  messagingSenderId: "348124080627",
  appId: "1:348124080627:web:bdc4045f1c0a2ba4028a86",
  measurementId: "G-FTJTRDYKH9"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

let currentSymbol = "Rp ";
let transactions = JSON.parse(localStorage.getItem("dompetku_tx")) || [];

const loginOverlay = document.getElementById("login-overlay");
const mainDashboard = document.getElementById("main-dashboard");
const localPasswordInput = document.getElementById("local-password");
const btnLocalLogin = document.getElementById("btn-local-login");
const btnGoogleLogin = document.getElementById("btn-google-login");

// LOGIN DENGAN PIN ANGKA LOKAL
btnLocalLogin.addEventListener("click", () => {
  const pin = localPasswordInput.value.trim();

  if (pin === "") {
    alert("Silakan masukkan PIN angka Anda!");
    return;
  }

  const savedPin = localStorage.getItem("dompetku_pin");

  if (!savedPin) {
    localStorage.setItem("dompetku_pin", pin);
    alert("PIN Keamanan berhasil dibuat!");
    bukaDashboard();
  } else if (savedPin === pin) {
    bukaDashboard();
  } else {
    alert("PIN yang Anda masukkan salah!");
    localPasswordInput.value = "";
  }
});

// LOGIN DENGAN GOOGLE (FITUR CLOUD SYNC)
btnGoogleLogin.addEventListener("click", () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  
  firebase.auth().signInWithPopup(provider)
    .then((result) => {
      const user = result.user;
      document.getElementById("user-name").innerText = user.displayName;
      document.getElementById("user-avatar").src = user.photoURL;
      document.getElementById("cloud-status-badge").innerText = "⚡ Terkoneksi: Google Cloud";
      
      bukaDashboard();
    })
    .catch((error) => {
      console.error("Error Google Login:", error);
      alert("Gagal Login Google: " + error.message);
    });
});

function bukaDashboard() {
  loginOverlay.classList.add("hidden");
  mainDashboard.classList.remove("hidden");
  updateDashboardUI();
}

// FORMAT MATA UANG & UI
function formatCurrency(amount) {
  const number = parseFloat(amount) || 0;
  return currentSymbol + number.toLocaleString("id-ID");
}

function updateDashboardUI() {
  let totalIncome = 0;
  let totalExpense = 0;
  const historyList = document.getElementById("history-list");
  historyList.innerHTML = "";

  transactions.forEach((tx) => {
    if (tx.type === "income") totalIncome += tx.amount;
    else totalExpense += tx.amount;

    const li = document.createElement("li");
    li.className = "history-item";
    li.innerHTML = `
      <div class="item-info">
        <div class="item-details">
          <h4>${tx.note}</h4>
          <p>${tx.category} • ${tx.wallet}</p>
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
}