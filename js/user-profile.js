import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {	getAuth,
			onAuthStateChanged,
			updateEmail,
			updatePassword }  from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { getFirestore,
		 doc, 
		 getDoc, 
		 setDoc, 
		 updateDoc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

console.log("user-profile.js loaded");

const firebaseConfig = {
    apiKey: "AIzaSyC7UQTcpoKETfZZT2LZ0AT7mh_jaSZthGA",
    authDomain: "moviebooking-20705.firebaseapp.com",
    projectId: "moviebooking-20705",
    storageBucket: "moviebooking-20705.appspot.com",
    messagingSenderId: "230927628782",
    appId: "1:230927628782:web:5460063cce3d8d55e8f6ff"
  };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Check if user is logged in
onAuthStateChanged(auth, async (user) => {
	if (!user) {
		window.location.href = "login.html";
		return;
	}

    console.log("User detected: ", user);    

	const uid = user.uid;
	const userDocRef = doc(db, "users", uid);
	const userDoc = await getDoc(userDocRef);

	if (userDoc.exists()) {
		const data = userDoc.data();
		document.getElementById("firstName").value = data.firstName || "";
		document.getElementById("lastName").value = data.lastName || "";
		document.getElementById("phone").value = data.phone || "";
		document.getElementById("address").value = data.address || "";
		document.getElementById("city").value = data.city || "";
		document.getElementById("state").value = data.state || "";
		document.getElementById("zip").value = data.zipCode || "";
		document.getElementById("email").value = user.email || "";
	}

	document.getElementById("profile-form").addEventListener("submit", async (e) => {
		e.preventDefault();

		const updatedData = {
			firstName: document.getElementById("firstName").value,
			lastName: document.getElementById("lastName").value,
			phone: document.getElementById("phone").value,
			address: document.getElementById("address").value,
			city: document.getElementById("city").value,
			state: document.getElementById("state").value,
			zipCode: document.getElementById("zip").value
		};

		await setDoc(userDocRef, updatedData, { merge: true });
		const newEmail = document.getElementById("email")?.value;
		const newPassword = document.getElementById("password")?.value;

		try {
			// Update email only if it changed
			if (newEmail && newEmail !== user.email) {
				await updateEmail(user, newEmail);
				console.log("Email updated");
			}

			// Update password only if a new one was entered
			if (newPassword) {
				if (newPassword.length < 6) throw new Error("Password must be at least 6 characters");
				await updatePassword(user, newPassword);
				console.log("Password updated");
			}

			// Optionally show success and redirect
			document.getElementById("status").textContent = "Profile updated!";
			setTimeout(() => {
				window.location.href = "index.html";
			}, 1500);

		} catch (err) {
			console.error("Error updating auth info:", err);
			document.getElementById("status").textContent = "Error: " + err.message;
		}

		const status = document.getElementById("status");
		status.textContent = "✅ Profile updated successfully!";
		status.style.backgroundColor = "#22c55e"; // lime green
		status.style.color = "black";
		status.style.padding = "12px";
		status.style.borderRadius = "8px";
		status.style.textAlign = "center";
		status.style.fontWeight = "bold";
		status.style.transition = "opacity 0.5s ease";
		status.style.opacity = 1;

		//FOR TESTING PURPOSES ONLY
		const TESTING = true;
		if (TESTING) {
			setTimeout(() => {
				window.location.href = "index.html";
			}, 5000); // longer delay while testing
		} else {
			setTimeout(() => {
				window.location.href = "index.html";
			}, 2000); // normal delay for production
		}


	});
});




