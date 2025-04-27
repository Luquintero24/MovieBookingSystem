import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, collection, query, 
        where, getDocs, addDoc, orderBy, serverTimestamp, updateDoc, deleteDoc }
from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged} 
from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { firebaseConfig } from "../tool/firebaseConfig.js";

// ─── Firebase setup ──────────────────────────────────────────────────────
initializeApp(firebaseConfig);
const db = getFirestore();
const auth = getAuth();

// keep track of signed‑in user
let currentUser = null;
let m = null;
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
      </div>
      <div class="showtime-buttons">
        ${slot.times.map(t => `
          <button 
            class="btn-time" 
            data-theater-id="${slot.theaterId}"
          >${t}</button>
        `).join("")}
      </div>
    </div>`;
}


function renderAll(dates, datesMap, theaters) {
  const container = document.querySelector(".theater-list");
  container.innerHTML = "";
  dates.forEach((date) => {
    container.insertAdjacentHTML(
      "beforeend",
      `<h3 class="date-heading">${date}</h3>`
    );
    (datesMap[date] || []).forEach((slot) => {
      container.insertAdjacentHTML(
        "beforeend",
        makeTheaterHTML(slot, theaters)
      );
    });
  });
}

function renderOne(date, datesMap, theaters) {
  const container = document.querySelector(".theater-list");
  container.innerHTML = "";
  (datesMap[date] || []).forEach((slot) => {
    container.insertAdjacentHTML("beforeend", makeTheaterHTML(slot, theaters));
  });
}

// ─── Review UI ──────────────────────────────────────────────────
// display rating stars
function renderStars(rating) {
  let out = "";
  for (let i = 1; i <= 5; i++) {
    out += `<span class="star ${i <= rating ? "filled" : "empty"}">★</span>`;
  }
  return out;
}

function reviewHTML(review, reviewId) {
  const { userId, userName, rating, comment, createdAt } = review;
  const time = createdAt?.toDate().toLocaleString() || "";

  // only show edit/delete for your own reviews
  let actions = "";
  if (currentUser?.uid === userId) {
    actions = `
      <div class="review-actions">
        <button class="btn-edit" data-id="${reviewId}">Edit</button>
        <button class="btn-delete" data-id="${reviewId}">Delete</button>
      </div>`;
  }

  return `
    <div class="review">
      <div class="review-header">
        <div class="avatar">${userName[0] || ""}</div>
        <div class="reviewer-info">
          <h4 class="reviewer-name">${userName}</h4>
          <div class="review-meta">
            <div class="stars">${renderStars(rating)}</div>
            <span class="review-time">${time}</span>
          </div>
        </div>
      </div>
      ${actions}
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
    .map((d) => reviewHTML(d.data(), d.id))
    .join("");

  // after injecting, wire up edit/delete:
  attachReviewButtons(movieId);
}

function setupReviewForm(movieId) {
  const form = document.getElementById("reviewForm");
  form.addEventListener("submit", async (e) => {
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
    await addDoc(collection(db, "movies", movieId, "reviews"), {
      userId: currentUser.uid,
      userName: currentUser.displayName || currentUser.email.split("@")[0],
      rating,
      comment,
      createdAt: serverTimestamp(),
    });

    // clear & reload
    form.reset();
    await loadReviews(movieId);
  });
}

function attachReviewButtons(movieId) {
  const container = document.getElementById("reviewsList");

  container.querySelectorAll(".btn-delete").forEach(btn => {
    btn.onclick = async () => {
      const rid = btn.dataset.id;
      if (!confirm("Delete your review?")) return;
      await deleteDoc(doc(db, "movies", movieId, "reviews", rid));
      await loadReviews(movieId);
    };
  });

  container.querySelectorAll(".btn-edit").forEach(btn => {
    btn.onclick = async () => {
      const rid = btn.dataset.id;
      // pull the existing comment + rating
      const reviewRef = doc(db, "movies", movieId, "reviews", rid);
      const snap = await getDoc(reviewRef);
      const old = snap.data();
      // ask user for new text & rating (simple prompt)
      const newComment = prompt("Edit your review:", old.comment);
      if (newComment === null) return;   // cancelled
      let newRating = parseInt(prompt("Rating 1-5:", old.rating));
      if (!(newRating >=1 && newRating <=5)) newRating = old.rating;

      await updateDoc(reviewRef, {
        comment: newComment,
        rating: newRating,
        // optionally update timestamp
        createdAt: serverTimestamp()
      });
      await loadReviews(movieId);
    };
  });
}

// ─── Main: load everything ────────────────────────────────────────────────
async function loadMovieDetails() {
  const id = getDocId();
  if (!id) return console.error("No movie id in URL");

  // load movie doc
  const snap = await getDoc(doc(db, "movies", id));
  if (!snap.exists()) return console.error("Movie not found");
  m = snap.data();

  // banner/poster/title
  document.getElementById(
    "banner"
  ).style.backgroundImage = `url('${m.backdropUrl}')`;
  document.getElementById("poster").src = m.posterUrl;
  document.getElementById("title").textContent = m.title;

  // meta line
  const year = m.releaseDate?.split("-")[0] || "";
  const rating = m.rating || "";
  const runtime = m.runtime ? `${m.runtime} min` : "";
  const genres = (m.genre || []).slice(0, 3).join(", ");
  document.getElementById("meta").textContent = [year, rating, runtime, genres]
    .filter(Boolean)
    .join(" • ");

  // synopsis & cast
  document.getElementById("synopsis").textContent = m.synopsis;
  const castBox = document.getElementById("castList");
  castBox.innerHTML = "";
  (m.cast || []).slice(0, 3).forEach((name) => {
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
  const theaters = new Map(thSnap.docs.map((d) => [d.id, d.data()]));

  // showtimes grouped by date
  const showQ = query(collection(db, "showtimes"), where("movieId", "==", id));
  const showSnap = await getDocs(showQ);
  const datesMap = {};
  showSnap.docs.forEach((d) => {
    const r = d.data();
    (datesMap[r.date] = datesMap[r.date] || []).push(r);
  });
  const dates = Object.keys(datesMap).sort();

  // populate date select
  const sel = document.getElementById("dateSelect");
  sel.innerHTML =
    `<option value="">All Dates</option>` +
    dates.map((d) => `<option value="${d}">${d}</option>`).join("");
  sel.addEventListener("change", (e) => {
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

// Helper to upsert the cart item under /users/{uid}/cart/{itemId}
async function addToCartFirestore({ movieId, movieTitle, theaterId, 
  theaterName, date, time, quantity, price }) {
  if (!currentUser) throw new Error("NOT_AUTHENTICATED");
  const uid    = currentUser.uid;
  const itemId = `${movieId}_${theaterId}_${date}_${time}`;
  const ref    = doc(db, "users", uid, "cart", itemId);
  const snap   = await getDoc(ref);

  if (snap.exists()) {
    await updateDoc(ref, { quantity: snap.data().quantity + quantity });
  } else {
    await setDoc(ref, {
      movieId,
      movieTitle,     // store it too
      theaterId,
      theaterName,    // store name
      date,
      time,
      quantity,
      price
    });
  }
}

// Intercept showtime buttons and pop up the ticket-count modal
document.addEventListener("click", e => {
  if (!e.target.classList.contains("btn-time")) return;
  if (!currentUser) {
    window.location.href = "login.html";
    return;
  }

  const time      = e.target.textContent;
  const theaterId = e.target.dataset.theaterId;  
  const theaterEl = e.target.closest(".theater");
  const theaterName = theaterEl.querySelector(".theater-name").textContent;

  // find the date-heading above this slot
  let dateEl = theaterEl.previousElementSibling;
  while (dateEl && !dateEl.classList.contains("date-heading")) {
    dateEl = dateEl.previousElementSibling;
  }
  const date = dateEl?.textContent || "";

  // ticket-count modal
  const modal = document.createElement("div");
  modal.innerHTML = `
    <div style="
      position:fixed; top:0; left:0; width:100vw; height:100vh;
      background:#0008; display:flex; justify-content:center; align-items:center; z-index:9999;
    ">
      <div style="
        background:#fff; color:#000; padding:2rem; border-radius:1rem;
        text-align:center; max-width:90%; width:300px;
      ">
        <h3>Select number of tickets</h3>
        <input type="number" id="ticketCountInput" min="1" max="10" value="1"
          style="padding:5px; width:60px; text-align:center; margin:1rem 0;"
        />
        <br>
        <button id="addToCartBtn" style="
          background:#FFBF00; color:#333; padding:0.5rem 1rem;
          border:none; border-radius:0.5rem; font-weight:bold;
        ">
          Add to Cart
        </button>
        <button id="cancelBtn" style="
          background:none; border:none; color:#666; margin-left:1rem;
        ">Cancel</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  modal.querySelector("#cancelBtn").onclick = () => modal.remove();

  modal.querySelector("#addToCartBtn").onclick = async () => {
    const count = parseInt(document.getElementById("ticketCountInput").value, 10);
    if (!(count >= 1 && count <= 10)) {
      return alert("Please select between 1 and 10 tickets.");
    }

    try {
      await addToCartFirestore({
        movieId: getDocId(),     // helper to read ?id=…
        movieTitle: m.title,        // from loaded movie doc
        theaterId,                   // from data-theater-id
        theaterName,                // from DOM text
        date,
        time,
        quantity: count,
        price: m.price
      });

      // update badge
      const badge = document.getElementById("cartBadge");
      badge.textContent = count;
      badge.style.display = "inline-block";
      modal.remove();
    } catch (err) {
      console.error(err);
      if (err.message === "NOT_AUTHENTICATED")
        alert("Please sign in to add tickets to your cart.");
      else
        alert("Failed to add to cart. Try again.");
    }
  };
});
