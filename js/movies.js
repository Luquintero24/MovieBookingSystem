// Import from Firebase CDN (ES module style):
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";
import Swiper from "https://cdn.jsdelivr.net/npm/swiper@8/swiper-bundle.esm.browser.min.js";

// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyC7UQTcpoKETfZZT2LZ0AT7mh_jaSZthGA",
    authDomain: "moviebooking-20705.firebaseapp.com",
    projectId: "moviebooking-20705",
    storageBucket: "moviebooking-20705.appspot.com",
    messagingSenderId: "230927628782",
    appId: "1:230927628782:web:5460063cce3d8d55e8f6ff"
  };

// Initialize Firebase & Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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
    });

  } catch (err) {
    console.error("Error loading now_showing movies:", err);
  }
}

// LOAD UPCOMING MOVIES
async function loadUpcoming() {
  try {
    // Assume .coming-container .swiper-wrapper is where upcoming slides go
    const upcomingContainer = document.querySelector(".coming-container .swiper-wrapper");
    if (!upcomingContainer) {
      console.warn("No .coming-container .swiper-wrapper found in DOM");
      return;
    }
    // Clear existing placeholders
    upcomingContainer.innerHTML = "";

    // Query movies where status == "upcoming"
    const q = query(collection(db, "movies"), where("status", "==", "upcoming"));
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

// Call both
loadNowShowing();
loadUpcoming();