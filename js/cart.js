import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

import { firebaseConfig } from "../tool/firebaseConfig.js";

// ─── Initialize Firebase ─────────────────────────────────────────────
if (!getApps().length) {
  initializeApp(firebaseConfig);
}
const db   = getFirestore();
const auth = getAuth();

// ─── DOM Refs ─────────────────────────────────────────────────────────
const cartContainer = document.getElementById("cartItems");     // where items go
const subtotalEl    = document.getElementById("cartSubtotal");  // e.g. “$91.34”
const checkoutBtn   = document.getElementById("checkoutBtn");   // your checkout button

let currentUser = null;

// ─── Auth listener ───────────────────────────────────────────────────
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    // not signed in → back to login
    window.location.href = "login.html";
    return;
  }
  currentUser = user;
  await renderCart();
});

// ─── Render the cart ─────────────────────────────────────────────────
async function renderCart() {
  cartContainer.innerHTML = "<p>Loading your cart…</p>";
  let subtotal = 0;

  // fetch all items in /users/{uid}/cart
  const snap = await getDocs(collection(db, `users/${currentUser.uid}/cart`));
  if (snap.empty) {
    cartContainer.innerHTML = "<p>Your cart is empty.</p>";
    subtotalEl.textContent = "$0.00";
    checkoutBtn.disabled = true;
    return;
  }

  // build a list of items
  const items = [];
  for (let docSnap of snap.docs) {
    const data = docSnap.data();
    items.push({
      id           : docSnap.id,
      movieTitle   : data.movieTitle,
      theaterName  : data.theaterName,
      date         : data.date,
      time         : data.time,
      quantity     : data.quantity,
      price        : data.price
    });
    subtotal += data.quantity * data.price;
  }

  // clear and render
  cartContainer.innerHTML = "";
  for (let item of items) {
    const row = document.createElement("div");
    row.classList.add("cart-item");
    row.dataset.id = item.id;
    row.innerHTML = `
      <div class="item-info">
        <h3>${item.movieTitle}</h3>
        <p>${item.date} at ${item.time}<br>
           (${item.theaterName})</p>
      </div>
      <div class="item-controls">
        <button class="decrease">−</button>
        <span class="qty">${item.quantity}</span>
        <button class="increase">+</button>
      </div>
      <div class="item-price">
        $${(item.quantity * item.price).toFixed(2)}
      </div>
      <button class="remove-item">Remove</button>
    `;
    cartContainer.appendChild(row);

    // increase quantity
    row.querySelector(".increase").onclick = async () => {
      await updateDoc(
        doc(db, `users/${currentUser.uid}/cart/${item.id}`),
        { quantity: item.quantity + 1 }
      );
      await renderCart();
    };

    // decrease quantity
    row.querySelector(".decrease").onclick = async () => {
      if (item.quantity > 1) {
        await updateDoc(
          doc(db, `users/${currentUser.uid}/cart/${item.id}`),
          { quantity: item.quantity - 1 }
        );
        await renderCart();
      }
    };

    // remove item
    row.querySelector(".remove-item").onclick = async () => {
      await deleteDoc(
        doc(db, `users/${currentUser.uid}/cart/${item.id}`)
      );
      await renderCart();
    };
  }

  // update order summary & button state
  subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
  checkoutBtn.disabled  = subtotal === 0;
}

// ─── “Continue to Checkout” ─────────────────────────────────────────────
checkoutBtn.addEventListener("click", () => {
  // if the button is enabled we'll just take them to the checkout page
  if (!checkoutBtn.disabled) {
    window.location.href = "checkout.html";
  }
});