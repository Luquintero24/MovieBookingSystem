const searchInput = document.getElementById('searchInput');
const movieBoxes = document.querySelectorAll('.movies-container .box');

searchInput.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase();

    movieBoxes.forEach(box => {
        const title = box.querySelector('h3').textContent.toLowerCase();
        if (title.includes(query)) {
            box.style.display = 'block';
        } else {
            box.style.display = 'none';
        }
    });
});
