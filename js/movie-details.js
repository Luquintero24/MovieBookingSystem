import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { getFirestore, doc, getDoc, collection, query, 
        where, getDocs, addDoc, orderBy, serverTimestamp}
from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged} 
from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";

// ─── Firebase setup ──────────────────────────────────────────────────────
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

// keep track of signed‑in user
let currentUser = null;
onAuthStateChanged(auth, (user) => {
  currentUser = user;
});

// ─── Showtimes ────────────────────────────────────
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
            ${th.features.map(f => `<span>${f}</span>`).join("")}
          </div>
        </div>
        <a href="#" class="theater-info-link">View Theater Info</a>
      </div>
      <div class="showtime-buttons">
        ${slot.times.map(t => `<button class="btn-time">${t}</button>`).join("")}
      </div>
    </div>`;
}

function renderAll(dates, datesMap, theaters) {
  const container = document.querySelector(".theater-list");
  container.innerHTML = "";
  dates.forEach(date => {
    container.insertAdjacentHTML("beforeend", `<h3 class="date-heading">${date}</h3>`);
    (datesMap[date] || []).forEach(slot => {
      container.insertAdjacentHTML("beforeend", makeTheaterHTML(slot, theaters));
    });
  });
}

function renderOne(date, datesMap, theaters) {
  const container = document.querySelector(".theater-list");
  container.innerHTML = "";
  (datesMap[date] || []).forEach(slot => {
    container.insertAdjacentHTML("beforeend", makeTheaterHTML(slot, theaters));
  });
}

// ─── Review UI ──────────────────────────────────────────────────
function reviewHTML({ userName, rating, comment, createdAt }) {
  const time = createdAt?.toDate().toLocaleString() || "";
  return `
    <div class="review">
      <div class="review-header">
        <div class="avatar">${userName[0] || ""}</div>
        <div class="reviewer-info">
          <h4 class="reviewer-name">${userName}</h4>
          <div class="review-meta">
            <div class="stars">${"★".repeat(rating)}</div>
            <span class="review-time">${time}</span>
          </div>
        </div>
      </div>
      <p class="review-text">${comment}</p>
    </div>`;
}

async function loadReviews(movieId) {
  const reviewsContainer = document.getElementById("reviewsList");
  reviewsContainer.innerHTML = "Loading reviews…";

  const reviewsQ = query(
    collection(db, "movies", movieId, "reviews"),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(reviewsQ);

  if (snap.empty) {
    reviewsContainer.innerHTML = "<p>No reviews yet. Be the first!</p>";
    return;
  }

  reviewsContainer.innerHTML = snap.docs
    .map(d => reviewHTML(d.data()))
    .join("");
}

function setupReviewForm(movieId) {
  const form = document.getElementById("reviewForm");
  form.addEventListener("submit", async e => {
    e.preventDefault();
    
    if (!currentUser) {
      alert("You need to be signed in to leave a review.");
      return;
    }

    const rating = Number(form.rating.value);
    const comment = document.getElementById("reviewComment").value.trim();
    if (!rating || !comment) {
      return alert("Please select a star rating and write a comment.");
    }

    // write to Firestore
    await addDoc(
      collection(db, "movies", movieId, "reviews"),
      {
        userId: currentUser.uid,
        userName:
          currentUser.displayName ||
          currentUser.email.split("@")[0],
        rating,
        comment,
        createdAt: serverTimestamp()
      }
    );

    // clear & reload
    form.reset();
    await loadReviews(movieId);
  });
}

// ─── Main: load everything ────────────────────────────────────────────────
async function loadMovieDetails() {
  const id = getDocId();
  if (!id) return console.error("No movie id in URL");

  // load movie doc
  const snap = await getDoc(doc(db, "movies", id));
  if (!snap.exists()) return console.error("Movie not found");
  const m = snap.data();

  // banner/poster/title
  document.getElementById("banner").style.backgroundImage =
    `url('${m.backdropUrl}')`;
  document.getElementById("poster").src = m.posterUrl;
  document.getElementById("title").textContent = m.title;

  // meta line
  const year = m.releaseDate?.split("-")[0] || "";
  const rating = m.rating || "";
  const runtime = m.runtime ? `${m.runtime} min` : "";
  const genres = (m.genre || []).slice(0, 3).join(", ");
  document.getElementById("meta").textContent = 
    [year, rating, runtime, genres].filter(Boolean).join(" • ");

  // synopsis & cast
  document.getElementById("synopsis").textContent = m.synopsis;
  const castBox = document.getElementById("castList");
  castBox.innerHTML = "";
  (m.cast || []).slice(0, 3).forEach(name => {
    castBox.insertAdjacentHTML(
      "beforeend",
      `<div class="text-center">
         <div class="cast-photo-placeholder mb-2"></div>
         <p class="cast-name">${name}</p>
       </div>`
    );
  });

  // theaters map
  const thSnap = await getDocs(collection(db, "theaters"));
  const theaters = new Map(thSnap.docs.map(d => [d.id, d.data()]));

  // showtimes grouped by date
  const showQ = query(
    collection(db, "showtimes"),
    where("movieId", "==", id)
  );
  const showSnap = await getDocs(showQ);
  const datesMap = {};
  showSnap.docs.forEach(d => {
    const r = d.data();
    (datesMap[r.date] = datesMap[r.date] || []).push(r);
  });
  const dates = Object.keys(datesMap).sort();

  // populate date select
  const sel = document.getElementById("dateSelect");
  sel.innerHTML =
    `<option value="">All Dates</option>` +
    dates.map(d => `<option value="${d}">${d}</option>`).join("");
  sel.addEventListener("change", e => {
    if (!e.target.value) renderAll(dates, datesMap, theaters);
    else renderOne(e.target.value, datesMap, theaters);
  });

  // initial showtimes render
  renderAll(dates, datesMap, theaters);

  // reviews: always load them
  await loadReviews(id);

  // reviews form: only if signed in
  setupReviewForm(id);
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
