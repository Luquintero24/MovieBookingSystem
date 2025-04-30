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
let cartItems   = [];

async function fetchCartItems() {
  if (!currentUser) throw new Error("not signed in");
  // only hit Firestore the first time
  if (cartItems.length === 0) {
    const snap = await getDocs(
      collection(db, `users/${currentUser.uid}/cart`)
    );
    cartItems = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }
  return cartItems;
}

// ─── Auth & Cart Load ─────────────────────────────────────────────────
onAuthStateChanged(auth, async user => {
  if (!user) return window.location.href = "login.html";
  currentUser = user;
  await loadCart();       // will use fetchCartItems()
});

// ─── Load cart items + compute totals ──────────────────────────────────
async function loadCart() {
  cartItemsEl.innerHTML = "<p>Loading your cart…</p>";
  let subtotal = 0;

  const items = await fetchCartItems();    // now returns Array<{…}>
  if (items.length === 0) {
    cartItemsEl.innerHTML = "<p>Your cart is empty.</p>";
    subtotalEl.textContent = "$0.00";
    taxEl.textContent      = "$0.00";
    totalEl.textContent    = "$0.00";
    return;
  }

  cartItemsEl.innerHTML = "";
  for (let data of items) {
    const lineTotal = data.quantity * data.price;
    subtotal += lineTotal;

    const row = document.createElement("div");
    row.className = "checkout-item";
    row.innerHTML = `
      <p>
        <strong>${data.movieTitle}</strong><br>
        <em>(${data.theaterName})</em><br>
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
  const randomBase = Math.floor(1e6 + Math.random() * 9e6).toString(); 
  const orderId =  `ORD-${randomBase}`;
  let ticketCounter = 1;
  
  const items = await fetchCartItems();
  const ticketIds = []; 
  for (let data of items) {
    for (let i = 0; i < data.quantity; i++) {
      const ticketId = `TIX-${randomBase}-${ticketCounter}`;
      ticketCounter++; 
      ticketIds.push(ticketId);
      await addDoc(collection(db, "purchaseConfirmation"),{
          orderId,
          ticketId,
          userId:      currentUser.uid,
          movie:       data.movieTitle,
          theater:     data.theaterName,
          date:        data.date,
          time:        data.time,
          ticketCount: 1,                  // each doc is one ticket
          subtotal:    data.price,         // price per ticket
          timestamp:   new Date()
        }
      );
    }
    // remove from cart
    await deleteDoc(doc(db, `users/${currentUser.uid}/cart/${data.id}`));
  }

  // show a simple success modal
  showPurchaseModal(orderId, ticketIds);
});

// ─── Successful Purchase Modal ─────────────────────────────────────────────────
function showPurchaseModal(orderId, ticketIds=[]) {
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
        ">${orderId}</p>
        ${ ticketIds.length ? `<p>Your tickets:</p>
          <ul style="list-style:none; padding:0; margin:0;">
          ${ticketIds.map(id => `<li>${id}</li>`).join("")}</ul>`: ``
        }
        <div style="margin-bottom:1rem; margin-top: 1rem;">
          <button id="printTicketBtn" style="
            margin:0.25rem;
            padding:0.5rem 1rem;
            background:#FFBF00;
            border:none;
            border-radius:0.5rem;
            cursor:pointer;
            color: black;
            font-weight: 500;
          ">Print Ticket</button>
          <button id="downloadTicketBtn" style="
            margin:0.25rem;
            padding:0.5rem 1rem;
            background:#FFBF00;
            border:none;
            border-radius:0.5rem;
            cursor:pointer;
            color: black;
            font-weight: 500;
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
  modal.querySelector("#downloadTicketBtn").addEventListener("click", () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let y = 30;
  
    // Header
    doc.setFontSize(18);
    doc.text("RaiderTix Electronic Ticket", 20, y);
    y += 10;
  
    // Order ID
    doc.setFontSize(14);
    doc.text(`Order ID: ${orderId}`, 20, y);
    y += 10;
  
    // Each individual ticket
    ticketIds.forEach((tid, idx) => {
      // if we get too low on the page, add a new page
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(`Ticket ${idx + 1}: ${tid}`, 20, y);
      y += 8;
    });
  
    doc.save(`${orderId}.pdf`);
  });

  // download as PDF via jsPDF (UMD build)
  modal.querySelector("#printTicketBtn").addEventListener("click", () => {
    // grab just the inner HTML of modal content
    const content = modal.querySelector("div > div").innerHTML;
    
    // open a new, blank window
    const printWin = window.open("", "_blank", "width=600,height=600");
    printWin.document.write(`
      <html>
        <head>
          <title>Print Tickets</title>
          <style>
            body { font-family: sans-serif; padding: 20px; }
            h2 { color: #FFBF00; margin-bottom: 0.5em; }
            ul { list-style: none; padding: 0; }
            li { margin: 0.25em 0; }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `);
    printWin.document.close();
    printWin.focus();
  
    // when the print dialog is closed, then close the window
    printWin.onafterprint = () => printWin.close();
  
    // show the system print dialog
    printWin.print();
  });

  // close
  modal.querySelector("#closeModalBtn").addEventListener("click", () => {
    document.body.removeChild(modal);
    window.location.href = "order-history.html";
  });
}