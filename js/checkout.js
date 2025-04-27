import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  deleteDoc,
  addDoc
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { firebaseConfig } from "../tool/firebaseConfig.js";

// ─── Initialize Firebase ─────────────────────────────────────────────
if (!getApps().length) initializeApp(firebaseConfig);
const db   = getFirestore();
const auth = getAuth();

// ─── DOM Refs ─────────────────────────────────────────────────────────
const cartItemsEl   = document.getElementById("cartItems");
const subtotalEl    = document.getElementById("ticket-total");
const taxEl         = document.getElementById("ticket-tax");
const totalEl       = document.getElementById("totalFooterCell");
const form          = document.getElementById("checkoutForm");

// Payment radios & detail panels
const venmoRadio    = document.getElementById('venmo');
const paypalRadio   = document.getElementById('paypal');
const mcRadio       = document.getElementById('mastercard');
const venmoDetails  = document.getElementById('venmo-details');
const paypalDetails = document.getElementById('paypal-details');
const mcDetails     = document.getElementById('mastercard-details');

let currentUser = null;

// ─── Auth & Cart Load ─────────────────────────────────────────────────
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  currentUser = user;
  await loadCart();
});

// ─── Load cart items + compute totals ──────────────────────────────────
async function loadCart() {
  cartItemsEl.innerHTML = "<p>Loading your cart…</p>";
  let subtotal = 0;

  const snap = await getDocs(collection(db, `users/${currentUser.uid}/cart`));
  if (snap.empty) {
    cartItemsEl.innerHTML = "<p>Your cart is empty.</p>";
    subtotalEl.textContent = "$0.00";
    taxEl.textContent      = "$0.00";
    totalEl.textContent    = "$0.00";
    return;
  }

  cartItemsEl.innerHTML = "";
  for (let docSnap of snap.docs) {
    const data = docSnap.data();
    // read title + theaterName straight from cart doc:
    const title       = data.movieTitle;   
    const theaterName = data.theaterName; 

    const lineTotal = data.quantity * data.price;
    subtotal += lineTotal;

    const row = document.createElement("div");
    row.className = "checkout-item";
    row.innerHTML = `
      <p>
        <strong>${title}</strong><br>
        <em>(${theaterName})</em><br>
        ${data.date} at ${data.time}<br>
        Qty: ${data.quantity} × $${data.price.toFixed(2)} = $${lineTotal.toFixed(2)}
      </p>
    `;
    cartItemsEl.append(row);
  }

  const tax = subtotal * 0.0625;
  subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
  taxEl.textContent      = `$${tax.toFixed(2)}`;
  totalEl.textContent    = `$${(subtotal + tax).toFixed(2)}`;
}

// ─── Payment-fields toggle ───────────────────────────
function togglePaymentFields() {
  if (venmoRadio.checked) {
    venmoDetails.style.display = 'block';
    paypalDetails.style.display = mcDetails.style.display = 'none';
  } else if (paypalRadio.checked) {
    paypalDetails.style.display = 'block';
    venmoDetails.style.display = mcDetails.style.display = 'none';
  } else {
    mcDetails.style.display = 'block';
    venmoDetails.style.display = paypalDetails.style.display = 'none';
  }
}
venmoRadio.addEventListener("change", togglePaymentFields);
paypalRadio.addEventListener("change", togglePaymentFields);
mcRadio.addEventListener("change", togglePaymentFields);
togglePaymentFields();

// ─── Handle “Buy Now” ─────────────────────────────────────────────────
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // generate a single order ID for this batch, or per–item
  const orderId = "TIX-" + Math.floor(1e8 + Math.random() * 9e8);

  // re‐query the cart
  const snap = await getDocs(collection(db, `users/${currentUser.uid}/cart`));
  for (let docSnap of snap.docs) {
    const data = docSnap.data();

    await addDoc(collection(db, "purchaseConfirmation"), {
      ticketId:    orderId,
      userId:      currentUser.uid,
      movie:       data.movieTitle,   // ← human title
      theater:     data.theaterName,  // ← human name
      date:        data.date,
      time:        data.time,
      ticketCount: data.quantity,
      subtotal:    data.quantity * data.price,
      timestamp:   new Date()
    });

    // remove from cart
    await deleteDoc(doc(db, `users/${currentUser.uid}/cart/${docSnap.id}`));
  }

  // show a simple success modal
  showPurchaseModal(orderId);
});

// ─── Successful Purchase Modal ─────────────────────────────────────────────────
function showPurchaseModal(ticketId) {
  const modal = document.createElement("div");
  modal.innerHTML = `
    <div style="
      position:fixed;
      top:0; left:0;
      width:100vw; height:100vh;
      background:rgba(0,0,0,0.8);
      display:flex;
      justify-content:center;
      align-items:center;
      z-index:9999;
    ">
      <div style="
        background:#18181b;
        color:white;
        padding:2rem;
        border-radius:1rem;
        text-align:center;
        max-width:90%;
        width:360px;
      ">
        <h2 style="color:#FFBF00; margin-bottom:1rem;">Purchase Successful!</h2>
        <p>Your electronic ticket number is:</p>
        <p style="
          font-size:1.25rem;
          font-weight:bold;
          margin:1rem 0;
        ">${ticketId}</p>
        <div style="margin-bottom:1rem;">
          <button id="printTicketBtn" style="
            margin:0.25rem;
            padding:0.5rem 1rem;
            background:#FFBF00;
            border:none;
            border-radius:0.5rem;
            cursor:pointer;
          ">Print Ticket</button>
          <button id="downloadTicketBtn" style="
            margin:0.25rem;
            padding:0.5rem 1rem;
            background:#FFBF00;
            border:none;
            border-radius:0.5rem;
            cursor:pointer;
          ">Download PDF</button>
        </div>
        <button id="closeModalBtn" style="
          background:none;
          border:none;
          color:#fcd34d;
          font-size:0.9rem;
          cursor:pointer;
        ">Close</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // print
  modal.querySelector("#printTicketBtn").addEventListener("click", () => window.print());

  // download as PDF via jsPDF (UMD build)
  modal.querySelector("#downloadTicketBtn").addEventListener("click", () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("RaiderTix Electronic Ticket", 20, 30);
    doc.setFontSize(14);
    doc.text(`Ticket ID: ${ticketId}`, 20, 50);
    // TODO: add more details if you like…
    doc.save(`${ticketId}.pdf`);
  });

  // close
  modal.querySelector("#closeModalBtn").addEventListener("click", () => {
    document.body.removeChild(modal);
    window.location.href = "order-history.html";
  });
}