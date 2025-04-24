import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
	getFirestore, 
    collection, 
    getDocs, 
    addDoc, 
    doc, 
    deleteDoc, 
    updateDoc,
    getDoc
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import {
	getAuth, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

//Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyC7UQTcpoKETfZZT2LZ0AT7mh_jaSZthGA",
    authDomain: "moviebooking-20705.firebaseapp.com",
    projectId: "moviebooking-20705",
    storageBucket: "moviebooking-20705.firebasestorage.app",
    messagingSenderId: "230927628782",
    appId: "1:230927628782:web:5460063cce3d8d55e8f6ff"
  };
  
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Auth check
document.addEventListener("DOMContentLoaded", () => {
	onAuthStateChanged(auth, async user => {
		if (!user) return (window.location.href = "login.html");

		const userDoc = await getDocs(collection(db, "users"));
		const userData = userDoc.docs.find(doc => doc.id === user.uid)?.data();
		if (!userData || userData.role !== "admin") {
			alert("Access denied");
			return (window.location.href = "index.html");
		}

		console.log("Admin access granted");
		loadMovies();
        
        //adds a movie
        document.getElementById("openAddMovieModalBtn").addEventListener("click", () => {
			clearModalFields();
			document.getElementById("editModal").style.display = "block";
			document.getElementById("modalOverlay").style.display = "block";
			document.body.style.overflow = "hidden";
			document.getElementById("saveEditBtn").dataset.movieId = "";
            document.getElementById("modalTitle").textContent = "Add Movie";

		});

        //edits a movie
        document.getElementById("saveEditBtn").addEventListener("click", async () => {
			const id = document.getElementById("saveEditBtn").dataset.movieId;
			const updated = {
				title: document.getElementById("editTitle").value,
				price: parseFloat(document.getElementById("editPrice").value),
				genre: document.getElementById("editGenres").value.split(",").map(s => s.trim()),
                cast: document.getElementById("editCast").value.split(",").map(s => s.trim()),
				rating: document.getElementById("editRating").value,
				releaseDate: document.getElementById("editReleaseDate").value,
				runtime: parseInt(document.getElementById("editRuntime").value),
				status: document.getElementById("editStatus").value,
				posterUrl: document.getElementById("editPosterUrl").value,
				backdropUrl: document.getElementById("editBackdropUrl").value,
				synopsis: document.getElementById("editSynopsis").value
			};
			if (id) {
				await updateDoc(doc(db, "movies", id), updated);
			} else {
				await addDoc(collection(db, "movies"), updated);
			}

			document.getElementById("editModal").style.display = "none";
			document.getElementById("modalOverlay").style.display = "none";
			document.body.style.overflow = "auto";
			loadMovies();
		});

        document.getElementById("cancelEditBtn").addEventListener("click", () => {
			document.getElementById("editModal").style.display = "none";
			document.getElementById("modalOverlay").style.display = "none";
			document.body.style.overflow = "auto";
		});

	});//end onAuthStateChanged
});

function openEditModal(id, movie) {
    //console testing
    console.log("%c Opening modal for", "color: lightgreen", movie.title);

	document.getElementById("editTitle").value = movie.title || "";
	document.getElementById("editPrice").value = movie.price || "";
	document.getElementById("editGenres").value = (movie.genre || []).join(", ");
    document.getElementById("editCast").value = (movie.cast || []).join(", ");
	document.getElementById("editRating").value = movie.rating || "";
	document.getElementById("editReleaseDate").value = movie.releaseDate || "";
	document.getElementById("editRuntime").value = movie.runtime || "";
	document.getElementById("editStatus").value = movie.status || "";
	document.getElementById("editPosterUrl").value = movie.posterUrl || "";
	document.getElementById("editBackdropUrl").value = movie.backdropUrl || "";
	document.getElementById("editSynopsis").value = movie.synopsis || "";

    //saves movie ID for save button
	document.getElementById("saveEditBtn").dataset.movieId = id;
    //shows modal
	document.getElementById("editModal").style.display = "block";
    document.getElementById("modalOverlay").style.display = "block";
    //adjusts modal's title depending on whether adding or editing a film
    document.getElementById("modalTitle").textContent = "Edit Movie";
    // Freeze scroll
	document.body.style.overflow = "hidden";
}

function clearModalFields() {
	const ids = [
		"editTitle", "editPrice", "editGenres", "editCast", "editRating",
		"editReleaseDate", "editRuntime", "editStatus",
		"editPosterUrl", "editBackdropUrl", "editSynopsis"
	];
	ids.forEach(id => {
		const el = document.getElementById(id);
		if (el) el.value = "";
	});
}

function closeModal() {
	document.getElementById("editModal").style.display = "none";
	document.getElementById("modalOverlay").style.display = "none";
	document.body.style.overflow = "auto";
}
window.closeModal = closeModal;


async function loadMovies() {
	const list = document.getElementById("movieList");
    if (!list) {
        console.error("❌ movieList element not found in DOM.");
        return;
    }

	list.innerHTML = "";
	const moviesSnap = await getDocs(collection(db, "movies"));

	moviesSnap.forEach(docSnap => {
		const movie = docSnap.data();
		const movieId = docSnap.id;

		const card = document.createElement("div");
		card.className = "movie-card";

		const title = document.createElement("h3");
		title.textContent = movie.title;
		title.className = "movie-title";

		const price = document.createElement("p");
		price.textContent = `Price: $${movie.price || "N/A"}`;
		price.className = "movie-price";
        card.appendChild(price);

		const editBtn = document.createElement("button");
		editBtn.textContent = "Edit";
		editBtn.className = "btn btn-yellow";
		editBtn.onclick = () => {
            console.log("🛠 Opening modal for", movie.title);
            openEditModal(movieId, movie);
        };


		const deleteBtn = document.createElement("button");
		deleteBtn.textContent = "Delete";
		deleteBtn.className = "btn btn-red";
		deleteBtn.onclick = async () => {
			if (confirm(`Delete movie: ${movie.title}?`)) {
				await deleteDoc(doc(db, "movies", movieId));
				loadMovies();
			}
		};

		card.appendChild(title);
		card.appendChild(price);
		card.appendChild(editBtn);
		card.appendChild(deleteBtn);
		list.appendChild(card);
	});
}//end loadMovies

window.deleteMovie = async function (id) {
	if (confirm("Delete this movie?")) {
		await deleteDoc(doc(db, "movies", id));
		loadMovies();
	}
};//end deleteMovie


