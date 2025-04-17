
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  const ticketInput = document.getElementById("ticketCount");
  const subtotalDisplay = document.getElementById("subtotal");
  const checkoutBtn = document.getElementById("checkoutBtn");

  const pricePerTicket = 10;

  // Firebase config
  const firebaseConfig = {
    apiKey: "AIzaSyC7UQTcpoKETfZZT2LZ0AT7mh_jaSZthGA",
    authDomain: "moviebooking-20705.firebaseapp.com",
    projectId: "moviebooking-20705",
    storageBucket: "moviebooking-20705.appspot.com",
    messagingSenderId: "230927628782",
    appId: "1:230927628782:web:5460063cce3d8d55e8f6ff"
  };

  // Initialize Firebase and Firestore
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  ticketInput.addEventListener("input", () => {
    let count = parseInt(ticketInput.value);
    if (isNaN(count) || count < 1) count = 1;
    if (count > 10) {
      ticketInput.value = 10;
      count = 10;
    }

    const subtotal = count * pricePerTicket;
    subtotalDisplay.textContent = `$${subtotal.toFixed(2)}`;
  });

  checkoutBtn.addEventListener("click", async () => {
    const count = parseInt(ticketInput.value);
    if (!count || count < 1 || count > 10) {
      alert("Please enter a valid ticket count (1-10)");
      return;
    }

    const subtotal = count * pricePerTicket;

    try {
      await addDoc(collection(db, "ticketSubtotals"), {
        ticketCount: count,
        subtotal: subtotal,
        timestamp: new Date()
      });
      localStorage.setItem("tickets", count);
      localStorage.setItem("subtotal", subtotal.toFixed(2));
      window.location.href = "checkout.html";
    } catch (error) {
      console.error("Error saving to Firestore:", error);
      alert("There was an error saving your data. Try again.");
    }
  });
});
