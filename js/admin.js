import {
	getFirestore,
	collection,
	getDocs,
	doc,
	getDoc
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

import {
	getAuth,
	onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

const db = getFirestore();
const auth = getAuth();

/***********************************************
 * 
 * 
 * NOT FULLY FUNCTIONAL YET
 * 
 * ******************************************/


onAuthStateChanged(auth, async (user) => {
	if (!user) return window.location.href = "login.html";

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
		totalTickets += data.quantity || 1;
		totalRevenue += data.subtotal || 0;
	});

	document.getElementById("totalTickets").textContent = totalTickets;
	document.getElementById("totalRevenue").textContent = totalRevenue.toFixed(2);
	document.getElementById("movieCount").textContent = movieSnap.size;

	// ✅ Movies Collection: List all currently playing movies
	const movieSnap = await getDocs(collection(db, "movies"));
	const movieList = document.getElementById("movieList");

	movieSnap.forEach(doc => {
		const movie = doc.data();
		const li = document.createElement("li");
		li.textContent = `${movie.title} @ ${movie.time || "Time N/A"}`;
		movieList.appendChild(li);
	});
});
