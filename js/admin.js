import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
	getFirestore,
	collection,
	getDocs,
	setDoc,
	doc,
	getDoc,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

import {
	getAuth,
	onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
	apiKey: "AIzaSyC7UQTcpoKETfZZT2LZ0AT7mh_jaSZthGA",
	authDomain: "moviebooking-20705.firebaseapp.com",
	projectId: "moviebooking-20705",
	storageBucket: "moviebooking-20705.firebasestorage.app",
	messagingSenderId: "230927628782",
	appId: "1:230927628782:web:5460063cce3d8d55e8f6ff"
  };

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const theaterMap = new Map();
const showtimeCache = new Map();

document.addEventListener("DOMContentLoaded", () => {
	onAuthStateChanged(auth, async (user) => {
		if (!user) {
			console.log("User not logged in");
			return window.location.href = "login.html";
		}

		const userDoc = await getDoc(doc(db, "users", user.uid));
		if (userDoc.exists() && userDoc.data().role !== "admin") {
			alert("Access denied.");
			window.location.href = "index.html";
		}

		// ✅ Ticket Subtotals Collection: Sum tickets and revenue
		const ticketSnap = await getDocs(collection(db, "ticketSubtotals"));
		let totalTickets = 0;
		let totalRevenue = 0;

		ticketSnap.forEach(doc => {
			const data = doc.data();
			totalTickets += data.ticketCount || 0;
			totalRevenue += data.subtotal || 0;
		});

		// ✅ Movies Collection: List all currently playing movies
		const movieSnap = await getDocs(collection(db, "movies"));

		const showtimeSnap = await getDocs(collection(db, "showtimes"));
		showtimeSnap.forEach(doc => {
			const data = doc.data();
			const key = `${data.movieId}_${data.theaterId}`;
			showtimeCache.set(key, {
				id: doc.id,
				times: data.times || []
			});
		});
		
		const theaterSnap = await getDocs(collection(db, "theaters"));
		const movieList = document.getElementById("movieList");

		const totalTicketsEl = document.getElementById("totalTickets");
		if (totalTicketsEl) {
			totalTicketsEl.textContent = totalTickets;
		}

		const totalRevenueEl = document.getElementById("totalRevenue");
		if (totalRevenueEl) {
			totalRevenueEl.textContent = totalRevenue.toLocaleString("en-US", {
				style: "currency",
				currency: "USD"
			});
		}

		const movieCountEl = document.getElementById("movieCount");
		if (movieCountEl) {
			movieCountEl.textContent = movieSnap.size;
		}

		// Step 1: Index all showtimes by movieId
		const showtimeMap = new Map();
		showtimeSnap.forEach(doc => {
			const data = doc.data();
			const { movieId, theaterId, times = [] } = data;

			if (!showtimeMap.has(movieId)) {
				showtimeMap.set(movieId, []);
			}
			showtimeMap.get(movieId).push({
				theaterId,
				times
			});
		});

		//Step 2: Maps Theater IDs to their names
		theaterSnap.forEach(doc => {
			const data = doc.data();
			theaterMap.set(doc.id, data.name || "Unknown Theater");
		});


		// Step 3: Build list of movies with their showtimes
		movieSnap.forEach(doc => {
			const movie = doc.data();
			const movieId = doc.id;

			//used to list the films
			const movieItem = document.createElement("div");
			movieItem.className = "movie-listing";
			movieItem.style.marginBottom = "24px";
			movieItem.style.borderBottom = "1px solid #333";
			movieItem.style.paddingBottom = "16px";
			
			// Movie title
			const movieTitle = document.createElement("p");
			movieTitle.textContent = `🎬 ${movie.title}`;
			movieTitle.className = "movie-title";
			movieItem.appendChild(movieTitle);

			//edit showtimes button
			const editShowtimesBtn = document.createElement("button");
			editShowtimesBtn.textContent = "Edit Showtimes";
			editShowtimesBtn.className = "btn btn-yellow";
			editShowtimesBtn.style.display = "inline-block"; // important!		
			editShowtimesBtn.onclick = () => openShowtimeModal(movieId, movie.title);

			movieItem.appendChild(editShowtimesBtn);

			// 📍 Showtimes grouped by theater
			const showtimes = showtimeMap.get(movieId);
			if (showtimes && showtimes.length > 0) {
				showtimes.forEach(entry => {

					const { theaterId, times } = entry;
					const theaterName = theaterMap.get(theaterId) || "Unknown Theater";

					const theaterList = document.createElement("p");
					theaterList.textContent = `\u00A0\u00A0📍 Theater: ${theaterName}`;
					theaterList.style.marginLeft = "20px";
					theaterList.style.color = "#f87171";
					movieItem.appendChild(theaterList);

					const timesList = document.createElement("p");
					timesList.textContent = `\u00A0\u00A0\u00A0\u00A0⏰ Showtimes: ${times.join(", ")}`;
					timesList.style.marginLeft = "40px";
					movieItem.appendChild(timesList);
				});
			} else {
				const noShowItem = document.createElement("p");
				noShowItem.textContent = "No showtimes available.";
				noShowItem.style.marginLeft = "40px";
				movieItem.appendChild(noShowItem);
			}


			movieList.appendChild(movieItem);
		});

		//save button
		const saveBtn = document.getElementById("saveShowtimesBtn");
		if (saveBtn) {
			saveBtn.addEventListener("click", async () => {
				const theaterEl = document.getElementById("newTheater");
				const timeEl = document.getElementById("showtimeInput");

				if (!theaterEl || !timeEl) {
					console.error("❌ Missing input fields.");
					return;
				}

				const theaterId = theaterEl.value;
				const times = timeEl.value.split(",").map(t => t.trim()).filter(Boolean);
				const movieId = saveBtn.dataset.movieId;//this one

				if (!movieId || !theaterId || times.length === 0) {
					alert("All fields are required.");
					return;
				}

				const docRef = doc(db, "showtimes", `${movieId}_${theaterId}`);
				await setDoc(docRef, {
					movieId,
					theaterId,
					times
				});

				alert("✅ Showtimes saved!");
				document.getElementById("showtimesModal").style.display = "none";
				document.getElementById("modalOverlay").style.display = "none";
				document.body.style.overflow = "auto";
			});
		} else {
			console.warn("⚠️ saveShowtimesBtn not found in DOM.");
		}


	});//end onAuthStateChanged
});

async function openShowtimeModal(movieId, movieTitle) {
	console.log("Opening modal for showtimes:", movieTitle);
	document.getElementById("showtimeModal").style.display = "block";
	document.getElementById("modalOverlay").style.display = "block";
	document.body.style.overflow = "hidden";
	// Store movieId in save button for later

	document.getElementById("saveShowtimesBtn").dataset.movieId = movieId;
	document.getElementById("showtimeModalTitle").textContent = `Edit Showtimes for ${movieTitle}`;
	const modal = document.getElementById("showtimeModal");

	const select = document.getElementById("theaterSelect");
	select.innerHTML = ""; // clear previous

	const snapshot = await getDocs(collection(db, "theaters"));
	snapshot.forEach(doc => {
		const option = document.createElement("option");
		option.value = doc.id;
		option.textContent = doc.data().name;
		select.appendChild(option);
	});

	// Preload any existing showtimes
	loadShowtimesForMovie(movieId);
}//end openShowtimeModal

function loadShowtimesForMovie(movieId) {
	const display = document.getElementById("currentShowtimes");
	console.log("currentShowtimes element:", display);
	if (!display) {
		console.error("⛔ currentShowtimes div not found.");
		return;
	}
	display.innerHTML = "<h4>Existing Showtimes</h4>";

	for (const [key, entry] of showtimeCache.entries()) {
		if (key.startsWith(movieId)) {
			const theaterId = key.split("_")[1];
			const times = entry.times.join(", ");
			const theaterName = theaterMap.get(theaterId) || theaterId;

			const p = document.createElement("p");
			p.textContent = `${theaterName}: ${times}`;
			display.appendChild(p);
		}
	}

	document.getElementById("saveShowtimesBtn").dataset.movieId = movieId;
}
//end loadShowtimesForMovie

// Close modal and overlay
window.closeShowtimeModal = function() {
	document.getElementById("showtimeModal").style.display = "none";
	document.getElementById("modalOverlay").style.display = "none";
	document.body.style.overflow = "auto";
};

// Cancel button
document.getElementById("closeShowtimesBtn").addEventListener("click", closeShowtimeModal);


