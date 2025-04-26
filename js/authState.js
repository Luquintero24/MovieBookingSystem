// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";



// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDdFyRh-V58ONSP6EKWza9M-tr0yhs7l3s",
  authDomain: "moviebookingswe.firebaseapp.com",
  projectId: "moviebookingswe",
  storageBucket: "moviebookingswe.firebasestorage.app",
  messagingSenderId: "1096382048367",
  appId: "1:1096382048367:web:6bccbccd1b901e0e24c59a"
};



let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

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

const cartIcon = document.getElementById("cartIcon");
const cartBadge = document.getElementById("cartBadge");

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
// Auth state handler
onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.exists() ? userDoc.data() : {};

      if (signInBtn) signInBtn.style.display = 'none';
      userInfo.style.display = 'flex';
      cartIcon.style.display = 'block';

      // ----------- Clean previous extra buttons to avoid duplicates -------------
      Array.from(userDropdown.querySelectorAll(".dropdown-action"))
        .forEach(btn => btn.remove());

      // ----------- ORDER HISTORY BUTTON -----------
      const orderBtn = document.createElement("button");
      orderBtn.textContent = "Order History";
      orderBtn.className = "dropdown-action";
      orderBtn.style.cssText = `
        background: transparent;
        color: #fcd34d;
        border: none;
        width: 100%;
        padding: 10px;
        text-align: left;
        cursor: pointer;
        font-weight: 500;
      `;
      orderBtn.addEventListener("click", () => {
        window.location.href = "order-history.html";
      });

      // ----------- USER SETTINGS/PROFILE BUTTON -----------
      const settingsBtn = document.createElement("button");
      settingsBtn.textContent = "User Settings";
      settingsBtn.className = "dropdown-action";
      settingsBtn.style.cssText = `
        background: transparent;
        color: #fcd34d;
        border: none;
        width: 100%;
        padding: 10px;
        text-align: left;
        cursor: pointer;
        font-weight: 500;
      `;
      settingsBtn.addEventListener("click", () => {
        window.location.href = "user-profile.html";
      });
      
      // — Admin Page button —
      if (userData.role === "admin") {
        const adminBtn = document.createElement("button");
        adminBtn.textContent = "Admin Page";
        adminBtn.className   = "dropdown-action";
        adminBtn.style.cssText = `
          background: transparent;
          color: #fcd34d;
          border: none;
          width: 100%;
          padding: 10px;
          text-align: left;
          cursor: pointer;
          font-weight: 500;
        `;
        adminBtn.addEventListener("click", () => {
          window.location.href = "admin.html";
        });
        userDropdown.insertBefore(adminBtn, signOutBtn);
      }

      // ----------- Insert both above Sign Out -----------
      userDropdown.insertBefore(settingsBtn, signOutBtn);
      userDropdown.insertBefore(orderBtn, signOutBtn);

      // ----------- Cart badge logic -----------
      const cartData = JSON.parse(localStorage.getItem("cartDetails") || "{}");
      if (cartData.tickets) {
        cartBadge.textContent = cartData.tickets;
        cartBadge.style.display = "inline-block";
      } else {
        cartBadge.textContent = "0";
        cartBadge.style.display = "none"; // or "inline-block" if you want it visible
      }

      const name = userData.firstName || 'User';
      usernameDisplay.textContent = `Hi, ${name.split(' ')[0]}!`;
    } catch (err) {
      console.error("Error fetching user info:", err);
    }
  } else {
    signInBtn.style.display = 'block';
    userInfo.style.display = 'none';
    cartIcon.style.display = 'none';
  }
});



signOutBtn?.addEventListener('click', () => {
  signOut(auth)
    .then(() => {
      localStorage.removeItem("cartDetails");  
      const badge = document.getElementById("cartBadge");
      if (badge) {
        badge.textContent = "0";
        badge.style.display = "none"; 
      }
      window.location.href = "index.html";
    })
    .catch((error) => {
      alert("Error signing out: " + error.message);
    });
});


cartIcon?.addEventListener("click", () => {
  const details = JSON.parse(localStorage.getItem("cartDetails") || "{}");
  if (!details.tickets) {
    alert("Please add tickets to your cart first.");
    return;
  }

  const params = new URLSearchParams(details);
  window.location.href = `cart.html?${params.toString()}`;
});


