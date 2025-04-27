// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { firebaseConfig } from "../tool/firebaseConfig.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Handle form submission
const submit = document.getElementById('submit');
submit.addEventListener("click", async function(event) {
  event.preventDefault();

  // Grab form values
  const firstName = document.getElementById('firstName').value;
  const lastName = document.getElementById('lastName').value;
  const address = document.getElementById('address').value;
  const city = document.getElementById('city').value;
  const state = document.getElementById('state').value;
  const zipCode = document.getElementById('zipCode').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const termsChecked = document.getElementById('terms').checked;

  // Basic validation
  if (password !== confirmPassword) {
    alert("Passwords do not match.");
    return;
  }

  if (!termsChecked) {
    alert("You must agree to the terms and privacy policy.");
    return;
  }

  try {
    // Create user with email and password
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Save additional user info to Firestore
    await setDoc(doc(db, "users", user.uid), {
      firstName,
      lastName,
      address,
      city,
      state,
      zipCode,
      email
    });

    // Redirect after success
    window.location.href = "login.html";

  } catch (error) {
    alert(error.message);
  }
});
