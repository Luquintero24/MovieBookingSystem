import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
    getFirestore,
    collection,
    getDocs,
    query,
    where
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

// --- Firebase Config ---
const firebaseConfig = {
    apiKey: "AIzaSyDdFyRh-V58ONSP6EKWza9M-tr0yhs7l3s",
    authDomain: "moviebookingswe.firebaseapp.com",
    projectId: "moviebookingswe",
    storageBucket: "moviebookingswe.firebasestorage.app",
    messagingSenderId: "1096382048367",
    appId: "1:1096382048367:web:6bccbccd1b901e0e24c59a"
};
let app;
if (!getApps().length) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApps()[0];
}
const db = getFirestore(app);
const ADMIN_UID = "TO71jY3gpSUcfCbWNvcugtwJjif2";

// --- Helper ---
let isDomLoaded = false;
let isAdminReady = false;
function tryLoadStats() {
    if (isDomLoaded && isAdminReady) loadSystemStats();
}

// --- Listen for DOM loaded ---
document.addEventListener("DOMContentLoaded", () => {
    isDomLoaded = true;
    tryLoadStats();
});

// --- Listen for Admin Auth ---
onAuthStateChanged(getAuth(), (user) => {
    if (!user || user.uid !== ADMIN_UID) {
        window.location.href = "index.html";
        return;
    }
    isAdminReady = true;
    tryLoadStats();
});

// --- Stats loader ---
async function loadSystemStats() {
    // DOM refs
    const totalTicketsEl = document.getElementById("totalTickets");
    const totalRevenueEl = document.getElementById("totalRevenue");
    const movieCountEl = document.getElementById("movieCount");
    const movieListEl = document.getElementById("movieList");
    let ticketsSold = 0;
    let totalRevenue = 0;

    try {
        const purchaseSnap = await getDocs(collection(db, "purchaseConfirmation"));
        purchaseSnap.forEach(doc => {
            const data = doc.data();
            ticketsSold += Number(data.ticketCount) || 0;
            totalRevenue += Number(data.subtotal) || 0;
        });
        totalTicketsEl.textContent = ticketsSold.toLocaleString();
        totalRevenueEl.textContent = totalRevenue.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2});
    } catch (err) {
        totalTicketsEl.textContent = "Error";
        totalRevenueEl.textContent = "Error";
        console.error("Failed to load purchases:", err);
    }

    try {
        const playingQ = query(collection(db, "movies"), where("status", "==", "now_showing"));
        const movieSnap = await getDocs(playingQ);
        movieCountEl.textContent = movieSnap.size;
        movieListEl.innerHTML = "";
        movieSnap.forEach(doc => {
            const m = doc.data();
            const div = document.createElement("div");
            div.style.marginBottom = "8px";
            div.textContent = "🎬 " + (m.title || "(Untitled)");
            movieListEl.appendChild(div);
        });
        if (movieSnap.empty) {
            movieListEl.innerHTML = "<em>No movies currently playing.</em>";
        }
    } catch (err) {
        movieCountEl.textContent = "Error";
        movieListEl.innerHTML = "<span style='color:red;'>Error loading movies</span>";
        console.error("Failed to load movies:", err);
    }
}
