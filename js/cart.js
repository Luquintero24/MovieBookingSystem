import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {
  const ticketInput = document.getElementById("ticketCount");
  const subtotalDisplay = document.getElementById("subtotal");
  const checkoutBtn = document.getElementById("checkoutBtn");

  const movieNameSpan = document.getElementById("movieName");
  const theaterNameSpan = document.getElementById("theaterName");
  const showtimeTextSpan = document.getElementById("showtimeText");

  const params = new URLSearchParams(window.location.search);
  const movie = params.get("movie");
  const theater = params.get("theater");
  const date = params.get("date");
  const time = params.get("time");
  const ticketCountFromURL = parseInt(params.get("tickets")) || 1;

  movieNameSpan.textContent = movie || "N/A";
  theaterNameSpan.textContent = theater || "N/A";
  showtimeTextSpan.textContent = date && time ? `${date} at ${time}` : "N/A";

  const pricePerTicket = 10;

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

  // Set initial ticket count and subtotal
  ticketInput.value = ticketCountFromURL;
  subtotalDisplay.textContent = `$${(ticketCountFromURL * pricePerTicket).toFixed(2)}`;

  // Update subtotal on input
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

  // Save booking on checkout
  checkoutBtn.addEventListener("click", async () => {
    const count = parseInt(ticketInput.value);
    if (!count || count < 1 || count > 10) {
      alert("Please enter a valid ticket count (1-10)");
      return;
    }

    const subtotal = count * pricePerTicket;

    if (!currentUser) {
      window.location.href = "login.html";
      return;
    }

    try {
      await addDoc(collection(db, "ticketSubtotals"), {
        userId: currentUser.uid,
        movie,
        theater,
        date,
        time,
        ticketCount: count,
        subtotal,
        timestamp: new Date()
      });

      alert("🎉 Booking successful!");
      window.location.href = "checkout.html";
    } catch (error) {
      console.error("Error saving to Firestore:", error);
      alert("There was an error saving your data. Try again.");
    }
  });
});
