import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore }        from "firebase-admin/firestore";
// import JSON with an import assertion:
import serviceAccount from "./serviceAccountKey.json" assert { type: "json" };

// Initialize the Admin SDK
initializeApp({
  credential: cert(serviceAccount),
  projectId: "moviebookingswe",
});

const db = getFirestore();

// Generate a random price between `min` and `max`
function randomPrice(min = 10, max = 17) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}

async function seedPrices() {
  const moviesSnap = await db.collection("movies").get();
  console.log(`Found ${moviesSnap.size} movies…`);

  for (const doc of moviesSnap.docs) {
    const { title = doc.id } = doc.data();
    const price = randomPrice();

    await doc.ref.update({ price });
    console.log(` • ${title} → $${price}`);
  }

  console.log("✅ Done seeding prices!");
  process.exit(0);
}

seedPrices().catch(err => {
  console.error("❌", err);
  process.exit(1);
});
