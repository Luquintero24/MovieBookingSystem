import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { getFirestore,doc,getDoc } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyC7UQTcpoKETfZZT2LZ0AT7mh_jaSZthGA",
  authDomain: "moviebooking-20705.firebaseapp.com",
  projectId: "moviebooking-20705",
  storageBucket: "moviebooking-20705.appspot.com",
  messagingSenderId: "230927628782",
  appId: "1:230927628782:web:5460063cce3d8d55e8f6ff",
};

// Initialize Firebase & Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Parse the doc‑id from the URL  ?id=xxxxx
function getDocId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

async function loadMovie() {
  const id = getDocId();
  if (!id) return console.error("No movie id in URL");

  const snap = await getDoc(doc(db, "movies", id));
  if (!snap.exists()) return console.error("Movie not found!");

  const m = snap.data();

  // banner & poster
  document.getElementById(
    "banner"
  ).style.backgroundImage = `url('${m.backdropUrl}')`;
  document.getElementById("poster").src = m.posterUrl;

  // title
  document.getElementById("title").textContent = m.title;

  // meta line  (year • rating • runtime • first 3 genres)
  const year = m.releaseDate?.split("-")[0] || "";
  const rating = m.rating || "";
  const genres = (m.genre || []).slice(0, 3).join(", ");
  const runtime = m.runtime ? `${m.runtime} min` : "";
  document.getElementById("meta").textContent = [year, rating, runtime, genres]
    .filter(Boolean)
    .join(" • ");

  // synopsis
  document.getElementById("synopsis").textContent = m.synopsis;

  // cast (first 3 names)
  const castBox = document.getElementById("castList");
  castBox.innerHTML = "";
  (m.cast || []).slice(0, 3).forEach((name) => {
    castBox.insertAdjacentHTML(
      "beforeend",
      `
      <div class="text-center">
        <div class="w-20 h-20 rounded-full bg-zinc-700 mb-2"></div>
        <p class="font-medium">${name}</p>
      </div>`
    );
  });

  /*  —— later:
      • fetch showtimes from your own collection / API
      • fetch reviews sub‑collection and render
  */
}

loadMovie();
