// Import the functions you need from the SDKs you need
import {
  initializeApp,
  getApps,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { firebaseConfig } from "../tool/firebaseConfig.js";

//Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const auth = getAuth(app);
const db = getFirestore(app);

// DOM elements
const signInBtn = document.getElementById("signInBtn");
const userInfo = document.querySelector(".user-info");
const usernameDisplay = document.getElementById("username");
const signOutBtn = document.getElementById("signOutBtn");

//Dropdown logic
const userToggle = document.getElementById("userToggle");
const userDropdown = document.getElementById("userDropdown");

const cartIcon = document.getElementById("cartIcon");
const cartBadge = document.getElementById("cartBadge");

userToggle?.addEventListener("click", () => {
  if (userDropdown.style.display === "block") {
    userDropdown.style.display = "none";
  } else {
    userDropdown.style.display = "block";
  }
});

document.addEventListener("click", (e) => {
  if (!userToggle?.contains(e.target) && !userDropdown?.contains(e.target)) {
    userDropdown.style.display = "none";
  }
});

// Auth state handler
onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.exists() ? userDoc.data() : {};

      if (signInBtn) signInBtn.style.display = "none";
      userInfo.style.display = "flex";
      cartIcon.style.display = "block";

      // ----------- Clean previous extra buttons to avoid duplicates -------------
      Array.from(userDropdown.querySelectorAll(".dropdown-action")).forEach(
        (btn) => btn.remove()
      );

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
        adminBtn.className = "dropdown-action";
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

      // ----------- Cart badge logic (Firestore) -------------
      const cartRef = collection(db, "users", user.uid, "cart");
      const cartSnap = await getDocs(cartRef);
      // sum up all `quantity` fields in cart docs to show on the cart icon
      const totalTickets = cartSnap.docs.reduce(
        (sum, d) => sum + (d.data().quantity || 0),
        0
      );

      if (totalTickets > 0) {
        cartBadge.textContent = totalTickets;
        cartBadge.style.display = "inline-block";
      } else {
        cartBadge.style.display = "none";
      }

      const name = userData.firstName || "User";
      usernameDisplay.textContent = `Hi, ${name.split(" ")[0]}!`;
    } catch (err) {
      console.error("Error fetching user info:", err);
    }
  } else {
    signInBtn.style.display = "block";
    userInfo.style.display = "none";
    cartIcon.style.display = "none";
  }
});

signOutBtn?.addEventListener("click", () => {
  signOut(auth)
    .then(() => {
      window.location.href = "index.html";
    })
    .catch((error) => {
      alert("Error signing out: " + error.message);
    });
});

// always go to the Firestore-backed cart page
cartIcon?.addEventListener("click", () => {
  window.location.href = "cart.html";
});
