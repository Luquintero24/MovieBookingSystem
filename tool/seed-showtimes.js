import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  addDoc,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC7UQTcpoKETfZZT2LZ0AT7mh_jaSZthGA",
  authDomain: "moviebooking-20705.firebaseapp.com",
  projectId: "moviebooking-20705",
  storageBucket: "moviebooking-20705.firebasestorage.app",
  messagingSenderId: "230927628782",
  appId: "1:230927628782:web:5460063cce3d8d55e8f6ff",
};

initializeApp(firebaseConfig);
const db = getFirestore();

// Helper to format a Date to YYYY-MM-DD
function fmt(date) {
  return date.toISOString().slice(0, 10);
}

// Build an array of the next 7 dates
const today = new Date();
const dates = Array.from({ length: 7 }, (_, i) => {
  const d = new Date(today);
  d.setDate(d.getDate() + i);
  return fmt(d);
});

// Your full list of possible slots
const allSlots = [
  "10:30 AM",
  "12:45 PM",
  "2:45 PM",
  "4:30 PM",
  "6:15 PM",
  "8:00 PM",
  "9:45 PM",
];

// Pick a random integer in [min, max]
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Shuffle an array and return a new one
function shuffle(arr) {
  return arr
    .map((v) => ({ v, r: Math.random() }))
    .sort((a, b) => a.r - b.r)
    .map(({ v }) => v);
}

async function seedShowtimes() {
  // Fetch all now_showing movies
  const moviesQ = query(
    collection(db, "movies"),
    where("status", "==", "now_showing")
  );
  const moviesSnap = await getDocs(moviesQ);

  // Fetch all theaters
  const theatersSnap = await getDocs(collection(db, "theaters"));
  const theaters = theatersSnap.docs.map((d) => d.id);

  let total = 0;

  for (let mdoc of moviesSnap.docs) {
    const movieId = mdoc.id;

    // 1) pick 1-2 random theaters
    const nTheaters = randInt(1, 2);
    const chosenTheaters = shuffle(theaters).slice(0, nTheaters);

    for (let theaterId of chosenTheaters) {
      // 2) pick 1-3 random dates
      const nDates = randInt(1, 3);
      const chosenDates = shuffle(dates).slice(0, nDates);

      for (let date of chosenDates) {
        // 3) pick 2–4 random time‑slots
        const nSlots = randInt(2, 4);
        const chosenSlots = shuffle(allSlots).slice(0, nSlots);

        await addDoc(collection(db, "showtimes"), {
          movieId,
          theaterId,
          date,
          times: chosenSlots,
        });
        total++;
        console.log(
          `⏰ [${movieId}] @ ${theaterId} on ${date}: ${chosenSlots.join(", ")}`
        );
      }
    }
  }

  console.log(`✅ Seeded ${total} random showtime documents!`);
}

seedShowtimes().catch(console.error);
