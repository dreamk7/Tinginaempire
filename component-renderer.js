// FILE: component-renderer.js
// This central file contains functions to render reusable HTML components like song rows.

function renderTrackRow(song, rank, artists, userLikes) {
    if (!song) return '';
    const artist = artists.find(a => a.id === song.artist_id) || { name: 'Unknown' };
    const duration = `${Math.floor(song.duration_seconds / 60)}:${(song.duration_seconds % 60).toString().padStart(2, '0')}`;
    const isLiked = userLikes.includes(song.id);

    // This is the single, updated HTML structure for a song row.
    return `
        <div class="track-row" data-song-id="${song.id}">
            <span class="track-rank">${rank}</span>
            <div class="track-artwork">
                <img src="${LiveAPI.API_URL}${song.artwork_url}" alt="${song.title}">
                <div class="track-play-btn"><i class="fas fa-play"></i></div>
            </div>
            <div class="track-info">
                <p class="title">${song.title}</p>
                <p class="artist">${artist.name}</p>
            </div>
            <div class="track-actions">
                <button class="icon-btn like-btn ${isLiked ? 'active' : ''}" title="Like Song">
                    <i class="${isLiked ? 'fas' : 'far'} fa-heart"></i>
                </button>
                <a href="${LiveAPI.API_URL}${song.audio_url}" download="${song.title} - ${artist.name}.mp3" class="icon-btn download-btn" title="Download">
                    <i class="fas fa-download"></i>
                </a>
            </div>
            <div class="track-meta">
                <span class="duration">${duration}</span>
            </div>
        </div>
    `;
}

// A simple notification toast system
function showToast(message) {
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    const toast = document.createElement('div');
    toast.className = 'toast show';
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => { toastContainer.removeChild(toast); }, 500);
    }, 2500);
}