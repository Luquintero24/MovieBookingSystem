import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

// ---- Firebase Initialization ----
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
const auth = getAuth(app);

// ---- DOM Elements ----
const movieList = document.getElementById("movieList");
const modal = document.getElementById("editModal");
const modalOverlay = document.getElementById("modalOverlay");
const openAddMovieModalBtn = document.getElementById("openAddMovieModalBtn");

// Form fields in the modal
const editTitle = document.getElementById("editTitle");
const editPrice = document.getElementById("editPrice");
const editGenres = document.getElementById("editGenres");
const editCast = document.getElementById("editCast");
const editRating = document.getElementById("editRating");
const editReleaseDate = document.getElementById("editReleaseDate");
const editRuntime = document.getElementById("editRuntime");
const editStatus = document.getElementById("editStatus");
const editPosterUrl = document.getElementById("editPosterUrl");
const editBackdropUrl = document.getElementById("editBackdropUrl");
const editSynopsis = document.getElementById("editSynopsis");
const modalTitle = document.getElementById("modalTitle");
const saveEditBtn = document.getElementById("saveEditBtn");

let editingMovieId = null;

// Showtimes modal elements
const showtimeModal      = document.getElementById("showtimeModal");
const showtimeMovieTitle = document.getElementById("showtimeMovieTitle");
const showtimeList       = document.getElementById("showtimeList");
const showtimeTheater    = document.getElementById("showtimeTheater");
const showtimeDate       = document.getElementById("showtimeDate");
const showtimeTimes      = document.getElementById("showtimeTimes");
const showtimeSaveBtn    = document.getElementById("showtimeSaveBtn");
const showtimeCancelBtn  = document.getElementById("showtimeCancelBtn");
const showtimeForm       = document.getElementById("showtimeForm");
let currentShowtimeMovieId = null;
let theatersListCache = [];
let editingShowtimeId = null;

// ---- Functions ----

// Fetch and display all movies
async function loadMovies() {
  movieList.innerHTML = "<div style='text-align:center; color:#fcd34d;'>Loading...</div>";
  const moviesSnap = await getDocs(collection(db, "movies"));
  movieList.innerHTML = ""; // Clear

  moviesSnap.forEach(docSnap => {
    const data = docSnap.data();
    const card = document.createElement("div");
    card.className = "order-card";
    card.style.background = "#18181b";
    card.style.padding = "24px";
    card.style.borderRadius = "16px";
    card.style.marginBottom = "30px";

    card.innerHTML = `
      <h3 style="color:#fcd34d;">${data.title || "(Untitled Movie)"}</h3>
      <img src="${data.posterUrl || ""}" alt="Poster" style="height:140px; margin-bottom:8px; border-radius:8px;" />
      <p><strong>Price:</strong> $${typeof data.price === 'number' ? data.price.toFixed(2) : "0.00"}</p>
      <p><strong>Genres:</strong> ${Array.isArray(data.genre) ? data.genre.join(", ") : (data.genre || "")}</p>
      <p><strong>Cast:</strong> ${Array.isArray(data.cast) ? data.cast.join(", ") : (data.cast || "")}</p>
      <p><strong>Rating:</strong> ${data.rating || "N/A"}</p>
      <p><strong>Release Date:</strong> ${data.releaseDate || "N/A"}</p>
      <p><strong>Runtime:</strong> ${data.runtime ? data.runtime + " min" : "N/A"}</p>
      <p><strong>Status:</strong> ${data.status || "N/A"}</p>
      <p><strong>Synopsis:</strong> ${data.synopsis || ""}</p>
      <div style="margin-top:12px;">
        <button class="btn btn-yellow" data-action="edit" data-id="${docSnap.id}">Edit</button>
        <button class="btn" style="background:#d64545; color:white; margin-left:10px;" data-action="delete" data-id="${docSnap.id}">Delete</button>
        <button class="btn" style="background:#3b82f6; color:white; margin-left:10px;" data-action="showtimes" data-id="${docSnap.id}" data-title="${data.title || ""}">Edit Showtimes</button>
      </div>
    `;
    movieList.appendChild(card);
  });
}

// Open modal for editing/adding
function openModal(isEdit, movie = {}) {
  modal.style.display = "block";
  modalOverlay.style.display = "block";
  document.body.style.overflow = "hidden";
  editingMovieId = isEdit ? movie.id : null;
  editPrice.value = movie.price !== undefined ? movie.price : "";
  modalTitle.textContent = isEdit ? "Edit Movie" : "Add Movie";
  editTitle.value = movie.title || "";
  editGenres.value = (movie.genre || []).join(", ");
  editCast.value = (movie.cast || []).join(", ");
  editRating.value = movie.rating || "";
  editReleaseDate.value = movie.releaseDate || "";
  editRuntime.value = movie.runtime || "";
  editStatus.value = movie.status || "";
  editPosterUrl.value = movie.posterUrl || "";
  editBackdropUrl.value = movie.backdropUrl || "";
  editSynopsis.value = movie.synopsis || "";
}

// Close modal
window.closeModal = function () {
  modal.style.display = "none";
  modalOverlay.style.display = "none";
  document.body.style.overflow = "auto";
  editingMovieId = null;
};

// ---- Handle Save/Edit ----
saveEditBtn.addEventListener("click", async (e) => {
  e.preventDefault();
  const movieData = {
    title: editTitle.value.trim(),
    price: Number(editPrice.value) || 0,
    genre: editGenres.value.split(",").map(g => g.trim()).filter(Boolean),
    cast: editCast.value.split(",").map(c => c.trim()).filter(Boolean),
    rating: editRating.value.trim(),
    releaseDate: editReleaseDate.value,
    runtime: Number(editRuntime.value) || null,
    status: editStatus.value.trim(),
    posterUrl: editPosterUrl.value.trim(),
    backdropUrl: editBackdropUrl.value.trim(),
    synopsis: editSynopsis.value.trim()
  };

  if (!movieData.title) {
    alert("Title is required.");
    return;
  }

  // Add or update
  if (editingMovieId) {
    // Edit
    await updateDoc(doc(db, "movies", editingMovieId), movieData);
    alert("Movie updated!");
  } else {
    // Add new
    await addDoc(collection(db, "movies"), movieData);
    alert("Movie added!");
  }

  closeModal();
  await loadMovies();
});

// ---- Open Add Movie Modal ----
openAddMovieModalBtn.addEventListener("click", () => {
  openModal(false); // Not editing, so it's for add
});

// ---- Edit/Delete/Showtimes Buttons ----
movieList.addEventListener("click", async (e) => {
  const target = e.target;
  const movieId = target.dataset.id;
  if (!movieId) return;

  if (target.dataset.action === "edit") {
    // Fetch the movie doc for the modal
    const docSnap = await getDocs(collection(db, "movies"));
    let movieDoc;
    docSnap.forEach(d => {
      if (d.id === movieId) movieDoc = { id: d.id, ...d.data() };
    });
    openModal(true, movieDoc);
  }

  if (target.dataset.action === "delete") {
    if (confirm("Are you sure you want to delete this movie?")) {
      await deleteDoc(doc(db, "movies", movieId));
      await loadMovies();
      alert("Movie deleted.");
    }
  }

  if (target.dataset.action === "showtimes") {
    const movieTitle = target.dataset.title;
    openShowtimeModal(movieId, movieTitle);
  }
});

// ---- Auth check: Only admin users ----
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  loadMovies();
});

// ---- Modal Overlay click closes modal ----
modalOverlay.addEventListener("click", () => closeModal());

// ===============================
// Showtimes Modal Logic Below
// ===============================

// Open showtimes modal
async function openShowtimeModal(movieId, movieTitle) {
  showtimeModal.style.display = "block";
  document.body.style.overflow = "hidden";
  showtimeMovieTitle.textContent = movieTitle;
  currentShowtimeMovieId = movieId;
  editingShowtimeId = null;

  // Load theaters for dropdown
  if (theatersListCache.length === 0) {
    const theatersSnap = await getDocs(collection(db, "theaters"));
    theatersListCache = theatersSnap.docs.map(d => ({id:d.id, ...d.data()}));
  }
  showtimeTheater.innerHTML = theatersListCache.map(th => 
    `<option value="${th.id}">${th.name}</option>`
  ).join("");

  await loadShowtimeList();
}

// Load and show all showtimes for this movie
async function loadShowtimeList() {
  showtimeList.innerHTML = "<em>Loading…</em>";
  const q = query(collection(db, "showtimes"), where("movieId", "==", currentShowtimeMovieId));
  const snap = await getDocs(q);
  if (snap.empty) {
    showtimeList.innerHTML = "<em>No showtimes.</em>";
    return;
  }
  // Group by theaterId, then date
  const shows = {};
  snap.forEach(d => {
    const {theaterId, date, times = []} = d.data();
    if (!shows[theaterId]) shows[theaterId] = {};
    shows[theaterId][date] = {times, id: d.id};
  });
  // Render
  showtimeList.innerHTML = Object.entries(shows).map(([tid, dates]) => {
    const tName = theatersListCache.find(t => t.id === tid)?.name || tid;
    return `
      <div style="margin-bottom:8px;"><b>${tName}</b><ul style="margin:0 0 0 15px;">
        ${
          Object.entries(dates).map(([date, {times, id}]) => `
            <li>
              <b>${date}:</b> ${times.join(", ")}
              <button style="margin-left:10px; font-size:12px;" data-stid="${id}" data-action="editrow">Edit</button>
              <button style="font-size:12px;" data-stid="${id}" data-action="deleterow">Delete</button>
            </li>
          `).join("")
        }
      </ul></div>
    `;
  }).join("");
}

// Modal open/close
showtimeCancelBtn.onclick = () => {
  showtimeModal.style.display = "none";
  document.body.style.overflow = "auto";
  showtimeForm.reset();
};
showtimeModal.addEventListener("click", (e) => {
  if (e.target === showtimeModal) {
    showtimeModal.style.display = "none";
    document.body.style.overflow = "auto";
  }
});

// Add/edit showtime form submit
showtimeForm.onsubmit = async (e) => {
  e.preventDefault();
  const movieId   = currentShowtimeMovieId;
  const theaterId = showtimeTheater.value;
  const date      = showtimeDate.value;
  const times     = showtimeTimes.value.split(",").map(t=>t.trim()).filter(Boolean);

  if (!movieId || !theaterId || !date || !times.length) {
    alert("All fields required");
    return;
  }

  if (editingShowtimeId) {
    // Update
    await setDoc(doc(db, "showtimes", editingShowtimeId), {
      movieId, theaterId, date, times
    });
  } else {
    // Add new (ID: movieId_theaterId_date is unique)
    await setDoc(doc(db, "showtimes", `${movieId}_${theaterId}_${date}`), {
      movieId, theaterId, date, times
    });
  }

  await loadShowtimeList();
  showtimeForm.reset();
  editingShowtimeId = null;
};

// Edit or delete row buttons (inside showtimeList)
showtimeList.onclick = async (e) => {
  const stid = e.target.dataset.stid;
  if (!stid) return;
  if (e.target.dataset.action === "editrow") {
    // Fetch and fill form for editing
    const snap = await getDocs(collection(db, "showtimes"));
    let found = null;
    snap.forEach(d => {
      if (d.id === stid) found = d.data();
    });
    if (found) {
      editingShowtimeId = stid;
      showtimeTheater.value = found.theaterId;
      showtimeDate.value = found.date;
      showtimeTimes.value = (found.times || []).join(", ");
    }
  } else if (e.target.dataset.action === "deleterow") {
    if (confirm("Delete this showtime?")) {
      await deleteDoc(doc(db, "showtimes", stid));
      await loadShowtimeList();
    }
  }
};
