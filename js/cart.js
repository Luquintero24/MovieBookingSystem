import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {
  // DOM references
  const ticketInput = document.getElementById("ticketCount");
  const subtotalDisplay = document.getElementById("subtotal");
  const checkoutBtn = document.getElementById("checkoutBtn");
  const ticketPriceDisplay = document.getElementById("ticketPrice");

  const movieNameSpan = document.getElementById("movieName");
  const theaterNameSpan = document.getElementById("theaterName");
  const showtimeTextSpan = document.getElementById("showtimeText");


  const cartDetails = JSON.parse(localStorage.getItem("cartDetails") || "{}");
  const params = new URLSearchParams(window.location.search);

  // Prefer localStorage first (for full workflow support)
  const movie = cartDetails.movie || params.get("movie") || "N/A";
  const theater = cartDetails.theater || params.get("theater") || "N/A";
  const date = cartDetails.date || params.get("date") || "";
  const time = cartDetails.time || params.get("time") || "";
  const ticketCount = parseInt(cartDetails.tickets || params.get("tickets")) || 1;
  const pricePerTicket = parseFloat(cartDetails.price || params.get("price")) || 10;

  // Populate fields
  movieNameSpan.textContent = movie;
  theaterNameSpan.textContent = theater;
  showtimeTextSpan.textContent = date && time ? `${date} at ${time}` : "N/A";
  ticketInput.value = ticketCount;
  ticketInput.readOnly = true; // As in your HTML; set to false if you want to allow changes
  ticketPriceDisplay.textContent = pricePerTicket.toFixed(2);
  subtotalDisplay.textContent = `$${(ticketCount * pricePerTicket).toFixed(2)}`;

  // Firebase init
  const firebaseConfig = {
    apiKey: "AIzaSyDdFyRh-V58ONSP6EKWza9M-tr0yhs7l3s",
    authDomain: "moviebookingswe.firebaseapp.com",
    projectId: "moviebookingswe",
    storageBucket: "moviebookingswe.appspot.com",
    messagingSenderId: "1096382048367",
    appId: "1:1096382048367:web:6bccbccd1b901e0e24c59a"
  };
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const auth = getAuth(app);

  // Track current user
  let currentUser = null;
  onAuthStateChanged(auth, (user) => {
    currentUser = user;
  });

 
  // Checkout button logic
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
        price: pricePerTicket, 
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
