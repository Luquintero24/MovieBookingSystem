import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  addDoc
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyC7UQTcpoKETfZZT2LZ0AT7mh_jaSZthGA",
  authDomain: "moviebooking-20705.firebaseapp.com",
  projectId: "moviebooking-20705",
  storageBucket: "moviebooking-20705.appspot.com",
  messagingSenderId: "230927628782",
  appId: "1:230927628782:web:5460063cce3d8d55e8f6ff"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let currentUser = null;
onAuthStateChanged(auth, (user) => {
  currentUser = user;
});

// Payment toggle fields setup
const venmoRadio = document.getElementById('venmo');
const paypalRadio = document.getElementById('paypal');
const mastercardRadio = document.getElementById('mastercard');

const venmoDetails = document.getElementById('venmo-details');
const paypalDetails = document.getElementById('paypal-details');
const mastercardDetails = document.getElementById('mastercard-details');

function togglePaymentFields() {
  const expiryMonth = document.getElementById("expiry-month");
  const expiryYear = document.getElementById("expiry-year");
  const cvv = document.getElementById("cvv");
  const cardName = document.getElementById("cardholdername");
  const cardNumber = document.getElementById("cardnumber");

  const paypalEmail = document.getElementById("paypal-email");
  const venmoUsername = document.getElementById("venmo-username");

  if (venmoRadio.checked) {
    venmoDetails.style.display = 'block';
    paypalDetails.style.display = 'none';
    mastercardDetails.style.display = 'none';
    venmoUsername.setAttribute("required", true);
    [paypalEmail, expiryMonth, expiryYear, cardName, cardNumber, cvv].forEach(el => el.removeAttribute("required"));
  } else if (paypalRadio.checked) {
    venmoDetails.style.display = 'none';
    paypalDetails.style.display = 'block';
    mastercardDetails.style.display = 'none';
    paypalEmail.setAttribute("required", true);
    [venmoUsername, expiryMonth, expiryYear, cardName, cardNumber, cvv].forEach(el => el.removeAttribute("required"));
  } else if (mastercardRadio.checked) {
    venmoDetails.style.display = 'none';
    paypalDetails.style.display = 'none';
    mastercardDetails.style.display = 'block';
    [expiryMonth, expiryYear, cardName, cardNumber, cvv].forEach(el => el.setAttribute("required", true));
    [paypalEmail, venmoUsername].forEach(el => el.removeAttribute("required"));
  } else {
    [venmoDetails, paypalDetails, mastercardDetails].forEach(el => el.style.display = 'none');
    [expiryMonth, expiryYear, cardName, cardNumber, cvv, paypalEmail, venmoUsername].forEach(el => el.removeAttribute("required"));
  }
}

// Totals
const ticketTotalCell = document.querySelector("#ticket-total");
const taxesCell = document.querySelector("#ticket-tax");
const totalFooterCell = document.querySelector("tfoot tr td:nth-child(2)");

document.addEventListener("DOMContentLoaded", async () => {
  togglePaymentFields();
  venmoRadio.addEventListener("change", togglePaymentFields);
  paypalRadio.addEventListener("change", togglePaymentFields);
  mastercardRadio.addEventListener("change", togglePaymentFields);

  try {
    const ticketSubtotalsRef = collection(db, "ticketSubtotals");
    const q = query(ticketSubtotalsRef, orderBy("timestamp", "desc"), limit(1));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const data = snapshot.docs[0].data();
      const subtotal = data.subtotal;
      const taxes = subtotal * 0.0625;
      const total = subtotal + taxes;

      ticketTotalCell.textContent = `$${subtotal.toFixed(2)}`;
      taxesCell.textContent = `$${taxes.toFixed(2)}`;
      totalFooterCell.textContent = `$${total.toFixed(2)}`;

      document.getElementById("movieName").textContent = data.movie;
      document.getElementById("theaterName").textContent = data.theater;
      document.getElementById("showtimeText").textContent = `${data.date} at ${data.time}`;
      document.getElementById("ticketCount").textContent = data.ticketCount;
    }
  } catch (error) {
    console.error("Error fetching subtotal from Firestore:", error);
  }

  const form = document.querySelector("form");
  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    const uniqueTicketId = "TIX-" + Math.floor(100000000 + Math.random() * 900000000);

    try {
      const ticketSubtotalsRef = collection(db, "ticketSubtotals");
      const q = query(ticketSubtotalsRef, orderBy("timestamp", "desc"), limit(1));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();

        await addDoc(collection(db, "purchaseConfirmation"), {
          ticketId: uniqueTicketId,
          userId: currentUser?.uid || "guest",
          movie: data.movie,
          theater: data.theater,
          date: data.date,
          time: data.time,
          ticketCount: data.ticketCount,
          subtotal: data.subtotal,
          timestamp: new Date()
        });

        const modal = document.createElement("div");
        modal.innerHTML = `
          <div style="position:fixed; top:0; left:0; width:100vw; height:100vh; background:#000000cc; display:flex; justify-content:center; align-items:center; z-index:9999;">
            <div style="background:#18181b; color:white; padding:2rem; border-radius:1rem; text-align:center; max-width:90%; width:400px;">
              <h2 style="color:#FFBF00;">Purchase Successful!</h2>
              <p>Your electronic ticket number is:</p>
              <p style="font-size:1.5rem; font-weight:bold; margin:1rem 0;">${uniqueTicketId}</p>
              <button onclick="window.print()" style="margin:0.5rem; padding:0.5rem 1rem; background:#FFBF00; border:none; border-radius:0.5rem; cursor:pointer;">Print Ticket</button>
              <button id="downloadTicketBtn" style="margin:0.5rem; padding:0.5rem 1rem; background:#FFBF00; border:none; border-radius:0.5rem; cursor:pointer;">Download Ticket</button>
              <br><br>
              <button onclick="window.location.href='index.html'" style="color:white; background:none; border:none; margin-top:1rem; cursor:pointer;">Close</button>
            </div>
          </div>
        `;
        document.body.appendChild(modal);

        document.getElementById("downloadTicketBtn").addEventListener("click", async () => {
          const { jsPDF } = window.jspdf;
          const doc = new jsPDF();
          doc.setFont("helvetica", "bold");
          doc.setFontSize(20);
          doc.text("RaiderTix Electronic Ticket", 20, 30);

          doc.setFont("helvetica", "normal");
          doc.setFontSize(14);
          doc.text(`Ticket ID: ${uniqueTicketId}`, 20, 50);
          doc.text("Thank you for your purchase!", 20, 70);
          doc.text("Present this ticket at the entrance.", 20, 80);

          doc.save(`${uniqueTicketId}.pdf`);
        });
      }
    } catch (error) {
      console.error("Error during checkout:", error);
    }
  });
});
