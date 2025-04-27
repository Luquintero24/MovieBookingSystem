import { getApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  orderBy
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

// jsPDF UMD version
import "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js";
import { firebaseConfig } from "../tool/firebaseConfig.js";

  
  // Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const container = document.getElementById("ordersContainer");
const loadingMessage = document.getElementById("loadingMessage");

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    loadingMessage.textContent = "Please sign in to view your order history.";
    return;
  }

  try {
    const q = query(
      collection(db, "purchaseConfirmation"),
      where("userId", "==", user.uid),
      orderBy("timestamp", "desc")
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      loadingMessage.textContent = "No orders found.";
      return;
    }

    loadingMessage.style.display = "none";

    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const card = document.createElement("div");
      card.className = "order-card";

      const dateStr = data.timestamp?.toDate?.().toLocaleString?.() || "N/A";

      card.innerHTML = `
        <h3>🎟️ Ticket ID: ${data.ticketId}</h3>
        <p><strong>Movie:</strong> ${data.movie}</p>
        <p><strong>Theater:</strong> ${data.theater}</p>
        <p><strong>Showtime:</strong> ${data.date} at ${data.time}</p>
        <p><strong>Tickets:</strong> ${data.ticketCount}</p>
        <p><strong>Subtotal:</strong> $${data.subtotal.toFixed(2)}</p>
        <p><strong>Purchased on:</strong> ${dateStr}</p>
        <div class="ticket-actions" style="margin-top: 10px;">
          <button class="download-btn" style="font-weight: bold; margin:0.5rem; padding:0.5rem 1rem; background:#FFBF00; border:none; border-radius:0.5rem; cursor:pointer;" data-ticket='${JSON.stringify(data)}'>Download</button>
          <button class="print-btn" style="font-weight: bold; margin:0.5rem; padding:0.5rem 1rem; background:#FFBF00; border:none; border-radius:0.5rem; cursor:pointer;" data-ticket='${JSON.stringify(data)}'>Print</button>
        </div>
      `;

      container.appendChild(card);
    });

    setupTicketActions();

  } catch (err) {
    console.error("Error fetching orders:", err);
    loadingMessage.textContent = "Something went wrong. Please try again later.";
  }
});

function setupTicketActions() {
  document.querySelectorAll(".download-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const data = JSON.parse(btn.dataset.ticket);
      const doc = new window.jspdf.jsPDF();  // 👈 Use jsPDF from UMD

      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.text("RaiderTix Electronic Ticket", 20, 30);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(14);
      doc.text(`Ticket ID: ${data.ticketId}`, 20, 50);
      doc.text(`Movie: ${data.movie}`, 20, 60);
      doc.text(`Theater: ${data.theater}`, 20, 70);
      doc.text(`Showtime: ${data.date} at ${data.time}`, 20, 80);
      doc.text(`Tickets: ${data.ticketCount}`, 20, 90);
      doc.text(`Subtotal: $${data.subtotal.toFixed(2)}`, 20, 100);
      doc.text(`Purchased on: ${new Date(data.timestamp?.seconds * 1000).toLocaleString()}`, 20, 110);

      doc.save(`${data.ticketId}.pdf`);
    });
  });

  document.querySelectorAll(".print-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const data = JSON.parse(btn.dataset.ticket);
      const printWindow = window.open('', '', 'width=600,height=600');
      printWindow.document.write(`<html><head><title>Print Ticket</title></head><body style="font-family:sans-serif;">`);
      printWindow.document.write(`<h2>RaiderTix Electronic Ticket</h2>`);
      printWindow.document.write(`<p><strong>Ticket ID:</strong> ${data.ticketId}</p>`);
      printWindow.document.write(`<p><strong>Movie:</strong> ${data.movie}</p>`);
      printWindow.document.write(`<p><strong>Theater:</strong> ${data.theater}</p>`);
      printWindow.document.write(`<p><strong>Showtime:</strong> ${data.date} at ${data.time}</p>`);
      printWindow.document.write(`<p><strong>Tickets:</strong> ${data.ticketCount}</p>`);
      printWindow.document.write(`<p><strong>Subtotal:</strong> $${data.subtotal.toFixed(2)}</p>`);
      printWindow.document.write(`<p><strong>Purchased on:</strong> ${new Date(data.timestamp?.seconds * 1000).toLocaleString()}</p>`);
      printWindow.document.write(`</body></html>`);
      printWindow.document.close();
      printWindow.print();
    });
  });
}
