import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
	getFirestore,
	collection,
	getDocs,
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
	const theaterSnap = await getDocs(collection(db, "theaters"));
	const movieList = document.getElementById("movieList");

	document.getElementById("totalTickets").textContent = totalTickets;
	document.getElementById("totalRevenue").textContent = totalRevenue.toLocaleString("en-US", {
		style: "currency",
		currency: "USD"
	});
	document.getElementById("movieCount").textContent = movieSnap.size;

	const showtimeMap = new Map();

	// Step 1: Index all showtimes by movieId
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
	const theaterMap = new Map();

	theaterSnap.forEach(doc => {
		const data = doc.data();
		theaterMap.set(doc.id, data.name || "Unknown Theater");
	});


	// Step 3: Build list of movies with their showtimes
	movieSnap.forEach(doc => {
		const movie = doc.data();
		const movieId = doc.id;

		//used to list the films
		const movieItem = document.createElement("li");

		// Movie title
		const movieTitle = document.createElement("p");
		movieTitle.textContent = `🎬 ${movie.title}`;
		movieTitle.className = "movie-title";
		movieItem.appendChild(movieTitle);


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


});//end onAuthStateChanged
