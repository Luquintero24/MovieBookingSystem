const searchInput = document.getElementById('searchInput');

document.addEventListener("DOMContentLoaded", () => {
	const searchInput = document.getElementById("searchInput");
	if (!searchInput) return; // Prevent error if search bar isn't present

  // Add event listener for input changes
  searchInput.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase();

    // Select all current movie boxes each time input changes
    const movieBoxes = document.querySelectorAll('.movies-container .box');
    const upcomingBoxes = document.querySelectorAll('.coming-container .box');

    movieBoxes.forEach(box => {
      const title = box.querySelector('h3').textContent.toLowerCase();
      box.style.display = title.includes(query) ? 'block' : 'none';
    });

    upcomingBoxes.forEach(box => {
      const title = box.querySelector('h3').textContent.toLowerCase();
      box.style.display = title.includes(query) ? 'block' : 'none';
    });
  });
});
  