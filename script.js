document.getElementById('search-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const query = document.getElementById('search-query').value;
    let imageCount = document.getElementById('image-count').value;

    if (imageCount < 1 || imageCount > 10) {
        alert('Please enter a number between 1 and 10.');
        return;
    }

    try {
        const response = await axios.get(`http://localhost:3000/search-images`, {
            params: { query, imageCount }
        });

        const images = response.data;
        const resultsContainer = document.getElementById('search-results');
        resultsContainer.innerHTML = '';

        images.slice(0, imageCount).forEach(url => {
            const img = document.createElement('img');
            img.src = url;
            resultsContainer.appendChild(img);
        });
    } catch (error) {
        console.error('Error searching for images:', error);
        alert(`Failed to search images. Error: ${error.response ? error.response.data : error.message}`);
    }
});


