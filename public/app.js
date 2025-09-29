/* app.js - EduChain demo (static, mocked) */

// --- State
let connectedAccount = null;
let pendingClaim = null; // { courseId, courseTitle, score }

// Try load stored credentials
let credentials = JSON.parse(localStorage.getItem("educhain_credentials") || "[]");

// --- Helpers: Toasts
function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  if (!container) return;
  const t = document.createElement("div");
  t.className = `toast ${type}`;
  t.textContent = message;
  container.appendChild(t);
  setTimeout(() => { t.classList.add("fade"); }, 4000);
  setTimeout(() => t.remove(), 4800);
}

// --- Wallet modal controls
function openWalletModal() {
  document.getElementById("walletModal").classList.remove("hidden");
}
function closeWalletModal() {
  document.getElementById("walletModal").classList.add("hidden");
}
function selectWallet(accountId) {
  connectedAccount = accountId;
  // update connect button(s)
  const btns = document.querySelectorAll("#connectBtn, #connectBtnDash");
  btns.forEach(b => { if (b) b.textContent = `Connected: ${shorten(accountId)}`; });
  closeWalletModal();
  showToast("🔗 Wallet connected: " + accountId, "success");
}

// --- shorten address helper
function shorten(addr) {
  if (!addr) return "";
  return addr.slice(0,6) + "…" + addr.slice(-4);
}

// --- Claim flow: open tx modal
function openTxModal(courseId, courseTitle, score) {
  if (!connectedAccount) { showToast("⚠️ Connect wallet first", "error"); return; }
  pendingClaim = { courseId, courseTitle, score };
  document.getElementById("txFrom").textContent = connectedAccount;
  document.getElementById("txModal").classList.remove("hidden");
}
function closeTxModal() { document.getElementById("txModal").classList.add("hidden"); }

// confirm tx (mock)
function confirmTx() {
  closeTxModal();
  if (!pendingClaim) return;
  showToast("⏳ Submitting transaction...", "info");
  // mimic network latency
  setTimeout(() => {
    const ok = Math.random() > 0.05; // 95% success for demo
    if (!ok) {
      showToast("❌ Transaction failed (mock). Try again.", "error");
      pendingClaim = null;
      return;
    }
    const txHash = "0x" + Math.random().toString(16).slice(2,12);
    const ipfs = "ipfs://QmFake" + Math.random().toString(16).slice(2,8);
    const record = {
      course: pendingClaim.courseTitle,
      date: new Date().toLocaleString(),
      tx: txHash,
      ipfs
    };
    credentials.push(record);
    localStorage.setItem("educhain_credentials", JSON.stringify(credentials));
    showToast("✅ Certificate claimed! Tx: " + txHash, "success");
    pendingClaim = null;
    // if on dashboard, refresh table
    populateDashboard();
  }, 1200);
}

// reject tx
function rejectTx() {
  closeTxModal();
  showToast("❌ Transaction rejected", "error");
  pendingClaim = null;
}

// --- Claim button handler (reads quiz input, validates)
function handleClaimClick(btn) {
  const courseCard = btn.closest(".course");
  const courseId = courseCard.getAttribute("data-course-id");
  const courseTitle = courseCard.getAttribute("data-course-title") || "Course";
  const select = courseCard.querySelector(".quiz-input");
  const val = select ? select.value.trim().toLowerCase() : "";
  // Basic scoring rules: correct answers:
  const correctMap = {
    "intro-web3": "hedera",
    "hedera-nft": "yes",
    "learn2earn": "tokens"
  };
  const required = correctMap[courseId];
  let score = 0;
  if (!val || val === "") { score = 0; }
  else if (val === required) score = 100;
  else score = 60; // near-miss

  if (score < 70) {
    showToast("❗ Score too low to claim (min 70). Study and retry.", "error");
    return;
  }
  // open tx modal with pendingClaim data
  openTxModal(courseId, courseTitle, score);
}

// --- Quick hero claim (claim a default fake cred)
function heroClaim() {
  if (!connectedAccount) { showToast("⚠️ Connect wallet first", "error"); return; }
  pendingClaim = { courseId: "hero-quick", courseTitle: "Quick Demo Credential", score: 100 };
  document.getElementById("txFrom").textContent = connectedAccount;
  document.getElementById("txModal").classList.remove("hidden");
}

// --- Dashboard functions
function populateDashboard() {
  const tableBody = document.querySelector("#credTable tbody");
  if (!tableBody) return;
  tableBody.innerHTML = "";
  if (!credentials || credentials.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="3" style="text-align:center;color:#98a1ad">No credentials yet</td></tr>`;
    return;
  }
  credentials.slice().reverse().forEach(c => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${escapeHtml(c.course)}</td><td>${escapeHtml(c.date)}</td><td><code>${escapeHtml(c.tx)}</code> • <small>${escapeHtml(c.ipfs)}</small></td>`;
    tableBody.appendChild(tr);
  });
}
function clearCredentials() {
  credentials = [];
  localStorage.setItem("educhain_credentials", JSON.stringify(credentials));
  populateDashboard();
  showToast("🧹 Credentials cleared (local)", "info");
}

// --- small util
function escapeHtml(s){ return String(s || "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

// --- Init DOM events on page load
document.addEventListener("DOMContentLoaded", () => {
  // connect buttons (header)
  const connectBtns = document.querySelectorAll("#connectBtn, #connectBtnDash");
  connectBtns.forEach(b => {
    if (!b) return;
    b.addEventListener("click", openWalletModal);
  });

  // wallet modal clicks handled via onClick in HTML -> selectWallet()

  // claim buttons
  const claimButtons = document.querySelectorAll(".claim-btn");
  claimButtons.forEach(b => b.addEventListener("click", () => handleClaimClick(b)));

  // hero quick
  const heroQuick = document.getElementById("heroClaimAll");
  if (heroQuick) heroQuick.addEventListener("click", heroClaim);

  // modal tx buttons
  const confirmBtn = document.getElementById("confirmTxBtn");
  if (confirmBtn) confirmBtn.addEventListener("click", confirmTx);

  // dashboard controls
  const clearBtn = document.getElementById("clearCreds");
  if (clearBtn) clearBtn.addEventListener("click", clearCredentials);

  // populate dashboard if present
  populateDashboard();

  // if wallet buttons should show connected state (if set)
  if (connectedAccount) {
    const headerBtns = document.querySelectorAll("#connectBtn, #connectBtnDash");
    headerBtns.forEach(b => { if (b) b.textContent = `Connected: ${shorten(connectedAccount)}`; });
  }
});

// expose some functions for inline events
window.selectWallet = selectWallet;
window.closeWalletModal = closeWalletModal;
window.openWalletModal = openWalletModal;
window.confirmTx = confirmTx;
window.rejectTx = rejectTx;
window.openTxModal = openTxModal;
