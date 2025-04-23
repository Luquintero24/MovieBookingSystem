import fetch from 'node-fetch';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC7UQTcpoKETfZZT2LZ0AT7mh_jaSZthGA",
  authDomain: "moviebooking-20705.firebaseapp.com",
  projectId: "moviebooking-20705",
  storageBucket: "moviebooking-20705.firebasestorage.app",
  messagingSenderId: "230927628782",
  appId: "1:230927628782:web:5460063cce3d8d55e8f6ff"
};

// TMDb API Key
const TMDB_API_KEY = '71da2394c518a1fbd957183f2c8b8fab';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Fetch and store movies
async function fetchAndStoreMovies() {
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&language=en-US&page=1`
    );
    const data = await response.json();

    for (let i = 0; i < 20 && i < data.results.length; i++) {
      const movie = data.results[i];

      const detailsResponse = await fetch(
        `https://api.themoviedb.org/3/movie/${movie.id}?api_key=${TMDB_API_KEY}&language=en-US&append_to_response=credits,releases`
      );
      const details = await detailsResponse.json();

      const title = details.title || '';
      const releaseDate = details.release_date || '';
      const synopsis = details.overview || '';
      const runtime = details.runtime || 0;
      const posterUrl = details.poster_path
        ? `https://image.tmdb.org/t/p/w1280${details.poster_path}`
        : '';
      const backdropUrl = details.backdrop_path
        ? `https://image.tmdb.org/t/p/original${details.backdrop_path}`
        : '';
      const cast = details.credits?.cast
        ? details.credits.cast.slice(0, 3).map((actor) => actor.name)
        : [];
      const genre = details.genres ? details.genres.map((g) => g.name) : [];
      const status = details.status === 'Released' ? 'now_showing' : 'upcoming';

      let rating = '';
      if (details.releases?.countries) {
        const usRelease = details.releases.countries.find(
          (country) => country.iso_3166_1 === 'US'
        );
        rating = usRelease?.certification || '';
      }

      const movieData = {
        title,
        releaseDate,
        synopsis,
        runtime,
        posterUrl,
        backdropUrl,
        cast,
        genre,
        rating,
        status,
      };

      await addDoc(collection(db, 'movies'), movieData);
      console.log(`✅ Stored: ${title}`);
    }
  } catch (error) {
    console.error('❌ Error fetching or storing movies:', error);
  }
}

fetchAndStoreMovies();

/*
npm init -y
npm install firebase node-fetch

Add this to package.json:
"type": "module",

Then run to get all the movie info
node tool/fetchAndUploadMovies.js
*/
