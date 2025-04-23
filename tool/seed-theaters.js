import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC7UQTcpoKETfZZT2LZ0AT7mh_jaSZthGA",
  authDomain: "moviebooking-20705.firebaseapp.com",
  projectId: "moviebooking-20705",
  storageBucket: "moviebooking-20705.firebasestorage.app",
  messagingSenderId: "230927628782",
  appId: "1:230927628782:web:5460063cce3d8d55e8f6ff",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const theaters = [
  {
    name: "Lubbock Grand Cinema",
    city: "Lubbock",
    address: "200 Broadway St, Lubbock, TX 79401",
    features: ["IMAX", "Dolby Cinema", "Wheelchair Accessible"],
  },
  {
    name: "Amarillo Movieplex",
    city: "Amarillo",
    address: "500 S Polk St, Amarillo, TX 79101",
    features: ["RPX", "4DX", "Wheelchair Accessible"],
  },
  {
    name: "Levelland Film Center",
    city: "Levelland",
    address: "300 Austin St, Levelland, TX 79336",
    features: ["Dolby Cinema", "Wheelchair Accessible"],
  },
  {
    name: "Plainview Picture House",
    city: "Plainview",
    address: "1500 W 5th St, Plainview, TX 79072",
    features: ["IMAX", "Wheelchair Accessible"],
  },
  {
    name: "Snyder Cinema 8",
    city: "Snyder",
    address: "1200 Broadway St, Snyder, TX 79549",
    features: ["Dolby Cinema", "Wheelchair Accessible"],
  },
  {
    name: "Abilene Premiere Theater",
    city: "Abilene",
    address: "4002 S Treadaway Blvd, Abilene, TX 79602",
    features: ["4DX", "Wheelchair Accessible"],
  },
];

async function seedTheaters() {
  for (let t of theaters) {
    const docRef = await addDoc(collection(db, "theaters"), t);
    console.log(`🗺️  Created theater ${t.name} (id: ${docRef.id})`);
  }
  console.log("✅ All theaters seeded!");
}

seedTheaters().catch(console.error);
