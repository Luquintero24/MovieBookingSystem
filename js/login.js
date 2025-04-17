// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {  getAuth, 
          setPersistence, 
          browseLocalPersistence, 
          signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
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
const auth = getAuth(app);



const submit = document.getElementById('submit');
submit.addEventListener("click", function(event) {
  event.preventDefault();

  //inputs
  const email= document.getElementById('email').value;
  const password = document.getElementById('password').value


  setPersistence(auth, browserLocalPersistence)
    .then(() => {
      signInWithEmailAndPassword(auth, email, password); // ← NOT returned
    })
    .then((userCredential) => {
      // Login successful
      const user = userCredential.user;

      //OPTIONAL: it saves the user to local storage
      localStorage.setItem("user", JSON.stringify(user));

      window.location.href = "user-profile.html";
    })
    .catch((error) => {
      const errorMessage = error.message;
      alert(errorMessage);
    });
});