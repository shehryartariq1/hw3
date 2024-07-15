const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

/* POST REQUESTS */
app.all('/download-image', async (req, res) => {
    const method = req.method;
    const imageUrl = req.query.imageUrl || (method === 'POST' ? req.body.imageUrl : null);
    const basePath = req.query.basePath || (method === 'POST' ? req.body.basePath : null) || process.env.BASE_PATH;
    const filename = req.query.filename || (method === 'POST' ? req.body.filename : null);

    if (!imageUrl || !filename) {
        return res.status(400).send('Missing imageUrl or filename.');
    }

    try {
        await downloadImage(imageUrl, basePath, filename);
        res.status(200).send(`Image downloaded successfully at ${path.join(basePath, filename)}`);
    } catch (error) {
        res.status(500).send(`Failed to download the image. Error: ${error.message}`);
    }
});

app.all('/search-images', async (req, res) => {
    const method = req.method;
    const query = (method === 'POST' ? req.body.query : req.query.query);
    let imageCount = (method === 'POST' ? req.body.imageCount : req.query.imageCount);

    if (!query) {
        return res.status(400).send('Search query is required.');
    }

    imageCount = parseInt(imageCount, 10) || 10; // Default to 10 if not specified

    try {
        const imageUrls = await searchImageOnUnsplash(query, imageCount);
        if (imageUrls && imageUrls.length) {
            res.status(200).json(imageUrls);
        } else {
            res.status(404).send('No images found.');
        }
    } catch (error) {
        res.status(500).send(`Error searching for images: ${error.message}`);
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

/**
 * Downloads an image from a given URL and saves it to the specified location.
 * @param {string} imageUrl - The URL of the image to download.
 * @param {string} basePath - The base directory where the image will be saved.
 * @param {string} filename - The filename under which the image will be saved.
 * @returns {Promise<void>} A promise that resolves when the image has been downloaded and saved.
*/
async function downloadImage(imageUrl, basePath = process.env.BASE_PATH, filename) {
    const fullPath = path.join(basePath, filename);

    try {
        const response = await axios({
            url: imageUrl,
            method: 'GET',
            responseType: 'stream'
        });

        fs.mkdirSync(path.dirname(fullPath), { recursive: true });

        const writer = fs.createWriteStream(fullPath);

        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
    } catch (error) {
        console.error('Error downloading the image:', error);
    }
}

/**
 * Searches Unsplash for images related to the given query and returns a random image URL.
 * @param {string} query - The search query to find relevant images.
 * @param {number} imageCount - The number of images to search for. Defaults to 3.
 * @returns {Promise<string|null>} The URL of a randomly selected image, or null if no images were found.
*/
async function searchImageOnUnsplash(query, imageCount = 3) {
    const accessKey = 'qeOflDXCjE0Lerg6wW8adBdhfSVv7zRCTrWq1ksLd1M';


    const url = `https://api.unsplash.com/search/photos?page=1&query=${encodeURIComponent(query)}&per_page=${imageCount}`;
    try {
        const response = await axios.get(url, {
            headers: {
                Authorization: `Client-ID ${accessKey}`
            }
        });

        const results = response.data.results;

        if (results.length === 0) {
            return null;
        }

        const imageUrls = results.map(result => result.urls.regular);
        return imageUrls;
    } catch (error) {
        console.error('Error searching for image:', error);
        return null;
    }
}
