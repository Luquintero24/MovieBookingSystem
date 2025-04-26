// tools/admin-stats.js

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

// ─── Firebase Config ───────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyDdFyRh-V58ONSP6EKWza9M-tr0yhs7l3s",
  authDomain: "moviebookingswe.firebaseapp.com",
  projectId: "moviebookingswe",
  storageBucket: "moviebookingswe.firebasestorage.app",
  messagingSenderId: "1096382048367",
  appId: "1:1096382048367:web:6bccbccd1b901e0e24c59a"
};
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db  = getFirestore(app);
const auth = getAuth(app);

// ─── Admin guard & DOM readiness ───────────────────────────────────────────
let isDomLoaded   = false;
let isAdminReady  = false;

function tryLoadStats() {
  if (isDomLoaded && isAdminReady) loadSystemStats();
}

document.addEventListener("DOMContentLoaded", () => {
  isDomLoaded = true;
  tryLoadStats();
});

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    // not signed in at all
    return window.location.href = "index.html";
  }
  try {
    // fetch their user doc
    const uSnap = await getDoc(doc(db, "users", user.uid));
    const role  = uSnap.exists() ? uSnap.data().role : null;
    if (role !== "admin") {
      // not an admin
      return window.location.href = "index.html";
    }
    // admin! allow stats to load
    isAdminReady = true;
    tryLoadStats();
  } catch (err) {
    console.error("Admin check failed:", err);
    window.location.href = "index.html";
  }
});

// ─── Stats loader ─────────────────────────────────────────────────────────
async function loadSystemStats() {
  // grab your DOM elements
  const totalTicketsEl = document.getElementById("totalTickets");
  const totalRevenueEl = document.getElementById("totalRevenue");
  const movieCountEl   = document.getElementById("movieCount");
  const movieListEl    = document.getElementById("movieList");

  // 1) purchases → tickets sold & revenue
  try {
    let ticketsSold = 0, totalRevenue = 0;
    const purchaseSnap = await getDocs(collection(db, "purchaseConfirmation"));
    purchaseSnap.forEach(d => {
      const data = d.data();
      ticketsSold  += Number(data.ticketCount) || 0;
      totalRevenue += Number(data.subtotal)    || 0;
    });
    totalTicketsEl.textContent = ticketsSold.toLocaleString();
    totalRevenueEl.textContent = totalRevenue.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  } catch (err) {
    console.error("Failed to load purchases:", err);
    totalTicketsEl.textContent = "Error";
    totalRevenueEl.textContent = "Error";
  }

  // 2) now_showing movies → count & list
  try {
    const playingQ = query(
      collection(db, "movies"),
      where("status", "==", "now_showing")
    );
    const movieSnap = await getDocs(playingQ);

    movieCountEl.textContent = movieSnap.size;
    movieListEl.innerHTML    = "";

    if (movieSnap.empty) {
      movieListEl.innerHTML = "<em>No movies currently playing.</em>";
    } else {
      movieSnap.forEach(d => {
        const m = d.data();
        const div = document.createElement("div");
        div.style.marginBottom = "8px";
        div.textContent = "🎬 " + (m.title || "(Untitled)");
        movieListEl.appendChild(div);
      });
    }
  } catch (err) {
    console.error("Failed to load movies:", err);
    movieCountEl.textContent = "Error";
    movieListEl.innerHTML    = "<span style='color:red;'>Error loading movies</span>";
  }
}
