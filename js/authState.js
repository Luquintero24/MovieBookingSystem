// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

// Firebase configuration
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
const db = getFirestore(app);

// DOM elements
const signInBtn = document.getElementById('signInBtn');
const userInfo = document.querySelector('.user-info');
const usernameDisplay = document.getElementById('username');
const signOutBtn = document.getElementById('signOutBtn');

//Dropdown logic
const userToggle = document.getElementById('userToggle');
const userDropdown = document.getElementById('userDropdown');

userToggle?.addEventListener('click', () => {
  if (userDropdown.style.display === 'block') {
    userDropdown.style.display = 'none';
  } else {
    userDropdown.style.display = 'block';
  }
});

document.addEventListener('click', (e) => {
  if (!userToggle?.contains(e.target) && !userDropdown?.contains(e.target)) {
    userDropdown.style.display = 'none';
  }
});

// Auth state handler
onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.exists() ? userDoc.data() : {};
      /*
      Stuff commented out in this section is the initial bits for admin 
      account functionality, not fully working and wanted to check with group before
      adding in full
      */
      const role = userDoc?.data()?.role;
      signInBtn.style.display = 'none';
      userInfo.style.display = 'flex';
      
      if (role === "admin") {
        const dropdown = document.getElementById("userDropdown");

        const adminLink = document.createElement("a");
        adminLink.href = "admin.html";
        adminLink.textContent = "Admin Panel";
        adminLink.style = `
          display: block;
          background: transparent;
          color: #fcd34d;
          text-decoration: none;
          width: 100%;
          padding: 10px;
          text-align: left;
          cursor: pointer;
          font-weight: 500;
        `;

        dropdown.insertBefore(adminLink, dropdown.firstChild);
      }
      

      const name = userData.firstName || 'User';
      usernameDisplay.textContent = `Hi, ${name.split(' ')[0]}!`;
    } catch (err) {
      console.error("Error fetching user info:", err);
    }
  } else {
    signInBtn.style.display = 'block';
    userInfo.style.display = 'none';
  }
});

// Sign out logic
signOutBtn?.addEventListener('click', () => {
  signOut(auth)
    .then(() => {
      window.location.href = "index.html";
    })
    .catch((error) => {
      alert("Error signing out: " + error.message);
    });
});
