import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc
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
    card.style.marginBottom = "30px"

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
saveEditBtn.addEventListener("click", async () => {
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

// ---- Edit/Delete Buttons ----
movieList.addEventListener("click", async (e) => {
  const target = e.target;
  const movieId = target.dataset.id;
  if (!movieId) return;

  // Get movie data if needed
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
});

// ---- Auth check: Only admin users ----
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  // You can add your admin role check here if needed
  // (as you did before)
  loadMovies();
});

// ---- Modal Overlay click closes modal ----
modalOverlay.addEventListener("click", () => closeModal());
