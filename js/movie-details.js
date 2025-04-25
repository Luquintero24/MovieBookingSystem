import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { getFirestore, doc, getDoc, collection, query, 
        where, getDocs, addDoc, orderBy, serverTimestamp, updateDoc, deleteDoc }
from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged} 
from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";

// ─── Firebase setup ──────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyDdFyRh-V58ONSP6EKWza9M-tr0yhs7l3s",
  authDomain: "moviebookingswe.firebaseapp.com",
  projectId: "moviebookingswe",
  storageBucket: "moviebookingswe.appspot.com", // <-- Correct!
  messagingSenderId: "1096382048367",
  appId: "1:1096382048367:web:6bccbccd1b901e0e24c59a"
};
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
            ${th.features.map((f) => `<span>${f}</span>`).join("")}
          </div>
        </div>
        <a href="#" class="theater-info-link">View Theater Info</a>
      </div>
      <div class="showtime-buttons">
        ${slot.times
          .map((t) => `<button class="btn-time">${t}</button>`)
          .join("")}
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

    // Show modal to select ticket count
    const modal = document.createElement("div");
    modal.innerHTML = `
      <div style="position:fixed; top:0; left:0; width:100vw; height:100vh; background:#000000cc; display:flex; justify-content:center; align-items:center; z-index:9999;">
        <div style="background:white; color:black; padding:2rem; border-radius:1rem; text-align:center; max-width:90%; width:300px;">
          <h3 style="font-size: 19px;">Select number of tickets</h3>
          <br>
          <input type="number" id="ticketCountInput" min="1" max="10" value="1" style="padding:5px; width:60px; text-align:center;" />
          <br><br>
          <button id="addToCartBtn" style="color: #3f3f46; background:#FFBF00; padding:10px 18px; border:none; border-radius:8px; font-size:15px; font-weight:bold;">Add to Cart</button>
          <br><br>
          <button id="cancelBtn" style="background:none; border:none; color:gray;">Cancel</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById("cancelBtn").addEventListener("click", () => {
      modal.remove();
    });

    document.getElementById("addToCartBtn").addEventListener("click", () => {
      const count = parseInt(document.getElementById("ticketCountInput").value);
      if (isNaN(count) || count < 1 || count > 10) {
        alert("Please select between 1 and 10 tickets.");
        return;
      }

      // Save all data to localStorage
      localStorage.setItem(
        "cartDetails",
        JSON.stringify({
          movie: m.title,
          theater: theaterName,
          date,
          time,
          tickets: count,
          price: m.price
        })
      );

      // Update badge
      const badge = document.getElementById("cartBadge");
      if (badge) {
        badge.textContent = count;
        badge.style.display = "inline-block";
      }

      // Remove popup
      modal.remove();
    });
  }
});
