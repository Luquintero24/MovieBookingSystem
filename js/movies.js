import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

import Swiper from "https://cdn.jsdelivr.net/npm/swiper@8/swiper-bundle.esm.browser.min.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDdFyRh-V58ONSP6EKWza9M-tr0yhs7l3s",
  authDomain: "moviebookingswe.firebaseapp.com",
  projectId: "moviebookingswe",
  storageBucket: "moviebookingswe.appspot.com", // <-- Correct!
  messagingSenderId: "1096382048367",
  appId: "1:1096382048367:web:6bccbccd1b901e0e24c59a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const FEATURED_TITLES = [
  "A Minecraft Movie",
  "Avengers: Infinity War",
  "Moana 2",
  "Captain America: Brave New World",
  "Iron Man",
];

// LOAD FEATURED MOVIES
async function loadFeaturedMovies() {
  try {
    const featuredEl = document.getElementById("featuredSlides");
    if (!featuredEl) {
      console.warn("No #featuredSlides element found for home slider");
      return;
    }

    featuredEl.innerHTML = ""; // Clear any placeholder

    // Firestore supports up to 10 items in an 'in' query
    const q = query(
      collection(db, "movies"),
      where("title", "in", FEATURED_TITLES)
    );
    const snapshot = await getDocs(q);

    // Build a slide (.swiper-slide) for each doc
    snapshot.forEach((docSnap) => {
      const movie = docSnap.data(); // e.g. { title, backdropUrl, synopsis, status, etc. }

      // We'll replicate the structure: .swiper-slide.container
      const slide = document.createElement("div");
      slide.classList.add("swiper-slide", "container");

      // Line-break for long title
      function formatTitle(title) {
        const parts = title.split(/[:]/);
        if (parts.length > 1) {
          // first part + <br> + the rest (trim to remove leading space)
          return `${parts[0]}:<br>${parts.slice(1).join(":").trim()}`;
        }
        return title;
      }

      slide.innerHTML = `
        <img src="${movie.backdropUrl}" alt="${movie.title}">
        <div class="home-text">
          <span>Featured Movie</span>
          <h1>${formatTitle(movie.title)}</h1>
          <a href="#" class="btn">Book Now</a>
          <a href="#" class="play"><i class='bx bx-play'></i></a>
        </div>
      `;

      featuredEl.appendChild(slide);
    });

    // After adding all slides, re-init the Swiper
    initHomeSwiper();
  } catch (err) {
    console.error("Error loading featured movies:", err);
  }
}

//“Home” Swiper
function initHomeSwiper() {
  new Swiper(".home", {
    spaceBetween: 30,
    centeredSlides: true,
    autoplay: {
      delay: 4000,
      disableOnInteraction: false,
    },
    pagination: {
      el: ".swiper-pagination",
      clickable: true,
    },
  });
}

// LOAD CURRENTLY SHOWING MOVIES
async function loadNowShowing() {
  try {
    // Reference the container div in your HTML
    const moviesContainer = document.querySelector(".movies-container");
    // Clear any placeholder HTML
    moviesContainer.innerHTML = "";

    // Build query for “now_showing” movies
    const q = query(
      collection(db, "movies"),
      where("status", "==", "now_showing")
    );
    const snapshot = await getDocs(q);

    // Loop through each doc and create a .box element
    snapshot.forEach((doc) => {
      const movie = doc.data();
      // e.g. { title, runtime, genre, posterUrl, ... }

      // Create the box div
      const boxDiv = document.createElement("div");
      boxDiv.classList.add("box");

      // Take the first movie genre in the genre array
      const firstGenre = movie.genre[0];

      // Compose inner HTML for .box
      boxDiv.innerHTML = `
        <div class="box-img">
          <img src="${movie.posterUrl}" alt="${movie.title}" />
        </div>
        <h3>${movie.title}</h3>
        <span>${movie.runtime} min | ${firstGenre}</span>
      `;

      // Append to container
      moviesContainer.appendChild(boxDiv);

      boxDiv.dataset.id = doc.id; // store Firestore doc‑id
      boxDiv.addEventListener("click", () => {
        window.location.href = `movie-details.html?id=${doc.id}`;
      });
    });
  } catch (err) {
    console.error("Error loading now_showing movies:", err);
  }
}

// LOAD UPCOMING MOVIES
async function loadUpcoming() {
  try {
    // Assume .coming-container .swiper-wrapper is where upcoming slides go
    const upcomingContainer = document.querySelector(
      ".coming-container .swiper-wrapper"
    );
    if (!upcomingContainer) {
      console.warn("No .coming-container .swiper-wrapper found in DOM");
      return;
    }
    // Clear existing placeholders
    upcomingContainer.innerHTML = "";

    // Query movies where status == "upcoming"
    const q = query(
      collection(db, "movies"),
      where("status", "==", "upcoming")
    );
    const snapshot = await getDocs(q);

    snapshot.forEach((doc) => {
      const movie = doc.data();

      const slideDiv = document.createElement("div");
      slideDiv.classList.add("swiper-slide", "box");

      // Only first genre
      const firstGenre = movie.genre[0];

      slideDiv.innerHTML = `
        <div class="box-img">
          <img src="${movie.posterUrl}" alt="${movie.title}" />
        </div>
        <h3>${movie.title}</h3>
        <span>${movie.runtime} min | ${firstGenre}</span>
      `;

      upcomingContainer.appendChild(slideDiv);

      slideDiv.dataset.id = doc.id; // store Firestore doc‑id
      slideDiv.addEventListener("click", () => {
        window.location.href = `movie-details.html?id=${doc.id}`;
      });
    });

    // Re-initialize Swiper if needed
    // e.g.: new Swiper('.coming-container.swiper', { ... });
    initUpcomingSwiper();
  } catch (err) {
    console.error("Error loading upcoming movies:", err);
  }
}

// Initialize the upcoming Swiper with loop, autoplay, etc.
function initUpcomingSwiper() {
  new Swiper(".coming-container.swiper", {
    // display multiple slides (adjust as needed)
    slidesPerView: 5,
    spaceBetween: 20,
    loop: true,
    autoplay: {
      delay: 2000, // 2s between slides
      disableOnInteraction: false, // keep auto sliding even if user swipes
    },
    // optional speed or other settings
    speed: 500,
    // add navigation or pagination if you want
    // pagination: { el: '.swiper-pagination', clickable: true },
    // navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
  });
}

loadFeaturedMovies();
loadNowShowing();
loadUpcoming();
