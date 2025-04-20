import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc
} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyC7UQTcpoKETfZZT2LZ0AT7mh_jaSZthGA",
  authDomain: "moviebooking-20705.firebaseapp.com",
  projectId: "moviebooking-20705",
  storageBucket: "moviebooking-20705.appspot.com",
  messagingSenderId: "230927628782",
  appId: "1:230927628782:web:5460063cce3d8d55e8f6ff",
};
initializeApp(firebaseConfig);
const db = getFirestore();
const auth = getAuth();

let currentUser = null;
let m = null; 

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";
onAuthStateChanged(auth, (user) => {
  currentUser = user;
});


// ─── Helpers ────────────────────────────────────────────────────────────────
function getDocId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

function makeTheaterHTML(slot, theaters) {
  const th = theaters.get(slot.theaterId);
  return `
    <div class="theater">
      <div class="theater-header">
        <div>
          <h3 class="theater-name">${th.name}</h3>
          <p class="theater-address">${th.address}</p>
          <div class="theater-features">
            ${th.features.map(f=>`<span>${f}</span>`).join("")}
          </div>
        </div>
        <a href="#" class="theater-info-link">View Theater Info</a>
      </div>
      <div class="showtime-buttons">
        ${slot.times.map(t=>`<button class="btn-time">${t}</button>`).join("")}
      </div>
    </div>`;
}

// Render all dates when no date is picked
function renderAll(dates, datesMap, theaters) {
  const container = document.querySelector(".theater-list");
  container.innerHTML = "";
  dates.forEach(date=>{
    container.insertAdjacentHTML("beforeend", `<h3 class="date-heading">${date}</h3>`);
    (datesMap[date]||[]).forEach(slot=>{
      container.insertAdjacentHTML("beforeend", makeTheaterHTML(slot, theaters));
    });
  });
}

// Render just one date
function renderOne(date, datesMap, theaters) {
  const container = document.querySelector(".theater-list");
  container.innerHTML = "";
  (datesMap[date]||[]).forEach(slot=>{
    container.insertAdjacentHTML("beforeend", makeTheaterHTML(slot, theaters));
  });
}

// ─── Main ───────────────────────────────────────────────────────────────────
async function loadMovieDetails(){
  const id = getDocId();
  if (!id) return console.error("No movie id in URL");

  // load movie data…
  const snap = await getDoc(doc(db,"movies",id));
  if (!snap.exists()) return console.error("Movie not found");
  m = snap.data();

  // banner & poster & title
  document.getElementById("banner").style.backgroundImage = `url('${m.backdropUrl}')`;
  document.getElementById("poster").src = m.posterUrl;
  document.getElementById("title").textContent = m.title;

  // meta line  (year • rating • runtime • first 3 genres)
  const year    = m.releaseDate?.split("-")[0] || "";
  const rating  = m.rating||"";
  const runtime = m.runtime?`${m.runtime} min`:"";
  const genres  = (m.genre||[]).slice(0,3).join(", ");
  document.getElementById("meta").textContent = [year,rating,runtime,genres].filter(Boolean).join(" • ");

  // synopsis & casts
  document.getElementById("synopsis").textContent = m.synopsis;
  const castBox = document.getElementById("castList");
  castBox.innerHTML = "";
  (m.cast||[]).slice(0,3).forEach(name=>{
    castBox.insertAdjacentHTML("beforeend", `
      <div class="text-center">
        <div class="cast-photo-placeholder mb-2"></div>
        <p class="cast-name">${name}</p>
      </div>`);
  });

  // load theaters
  const thSnap = await getDocs(collection(db,"theaters"));
  const theaters = new Map(thSnap.docs.map(d=>[d.id,d.data()]));

  // load showtimes for this movie
  const showQ = query(collection(db,"showtimes"), where("movieId","==",id));
  const showSnap = await getDocs(showQ);

  // group by date
  const datesMap = {};
  showSnap.docs.forEach(d=>{
    const r = d.data();
    (datesMap[r.date] = datesMap[r.date]||[]).push(r);
  });
  const dates = Object.keys(datesMap).sort();

  // populate the select
  const sel = document.getElementById("dateSelect");
  sel.innerHTML = `<option value="">All Dates</option>` +
    dates.map(d=>`<option value="${d}">${d}</option>`).join("");
  sel.addEventListener("change", e=>{
    if(!e.target.value) renderAll(dates,datesMap,theaters);
    else renderOne(e.target.value,datesMap,theaters);
  });

  // initial render → ALL
  renderAll(dates,datesMap,theaters);
}

loadMovieDetails().catch(console.error);

document.addEventListener("click", (e) => {
  if (e.target.classList.contains("btn-time")) {
    if (!currentUser) {
      window.location.href = "login.html";
      return;
    }

    const time = e.target.textContent;
    const theaterEl = e.target.closest(".theater");
    const theaterName = theaterEl.querySelector(".theater-name").textContent;

    let current = theaterEl;
    let date = "";
    while (current && current.previousElementSibling) {
      current = current.previousElementSibling;
      if (current.classList.contains("date-heading")) {
        date = current.textContent;
        break;
      }
    }

    const params = new URLSearchParams({
      movie: m.title,
      theater: theaterName,
      date,
      time
    });
    window.location.href = `cart.html?${params.toString()}`;
  }
});
