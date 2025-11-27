const searchBtn = document.getElementById('search-btn');
const usernameInput = document.getElementById('username-input');
const gallery = document.getElementById('gallery');
const errorMsg = document.getElementById('error-msg');
const loadingMsg = document.getElementById('loading-msg');

// API URL from config.js
const API_ENDPOINT = window.API_URL;

// Load all profiles on startup
window.addEventListener('DOMContentLoaded', fetchAllProfiles);

searchBtn.addEventListener('click', async () => {
    const username = usernameInput.value.trim();
    if (!username) return;

    // Reset UI state
    errorMsg.style.display = 'none';
    searchBtn.disabled = true;
    searchBtn.textContent = 'Fetching...';

    try {
        const response = await fetch(`${API_ENDPOINT}?username=${username}`);

        if (!response.ok) {
            throw new Error(await response.text() || 'Failed to fetch profile');
        }

        const data = await response.json();

        // Add the new card to the top of the gallery
        addCardToGallery(data, true);

        // Clear input
        usernameInput.value = '';

    } catch (error) {
        console.error(error);
        errorMsg.textContent = "Error: " + (error.message || "Could not fetch profile");
        errorMsg.style.display = 'block';
    } finally {
        searchBtn.disabled = false;
        searchBtn.textContent = 'Fetch Profile';
    }
});

async function fetchAllProfiles() {
    try {
        const response = await fetch(API_ENDPOINT);
        if (!response.ok) throw new Error("Failed to load profiles");

        const profiles = await response.json();

        // Clear loading message
        loadingMsg.style.display = 'none';

        // Render all profiles
        gallery.innerHTML = ''; // Clear any existing content
        profiles.forEach(profile => addCardToGallery(profile));

    } catch (error) {
        console.error("Error loading gallery:", error);
        loadingMsg.textContent = "Failed to load gallery. Please try again.";
    }
}

function addCardToGallery(data, prepend = false) {
    // Check if card already exists to avoid duplicates (simple check by ID)
    const existingCard = document.getElementById(`card-${data.username}`);
    if (existingCard) {
        existingCard.remove(); // Remove old version to re-add at top/updated position
    }

    const card = document.createElement('div');
    card.className = 'card';
    card.id = `card-${data.username}`;

    card.innerHTML = `
        <img src="${data.avatar_url}" alt="${data.username}" class="avatar">
        <h2 class="name">${data.name || data.username}</h2>
        <p class="username">@${data.username}</p>
        <p class="bio">${data.bio || "No bio available"}</p>
        <div class="stats">
            <div class="stat-item">
                <span>📦</span>
                <span>${data.public_repos} Repos</span>
            </div>
            <div class="stat-item">
                <span>👥</span>
                <span>${data.followers} Followers</span>
            </div>
        </div>
    `;

    if (prepend) {
        gallery.prepend(card);
    } else {
        gallery.appendChild(card);
    }
}
