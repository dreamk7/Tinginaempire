// FILE: liked-songs.js
// Logic for the liked-songs.html page.

document.addEventListener('DOMContentLoaded', async function() {
    // --- Authentication Check ---
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    if (!currentUser) {
        // Protect the page: if no user is logged in, redirect them to the login page.
        alert('You must be logged in to view your liked songs.');
        window.location.href = './login.html';
        return;
    }

    // --- DOM Elements ---
    const likedListContainer = document.getElementById('liked-songs-list');
    const songCountEl = document.getElementById('liked-songs-count');
    let allSongs = [], allArtists = [];

    try {
        // Fetch all song and artist data from the live API
        [allArtists, allSongs] = await Promise.all([
            LiveAPI.getArtists(),
            LiveAPI.getSongs()
        ]);
        
        // Get the liked song IDs from browser storage (managed by player.js)
        const likedSongIds = JSON.parse(localStorage.getItem('tingina_user_likes') || '[]');
        
        // Filter the main song list to get only the songs the user has liked
        const likedSongs = allSongs.filter(song => likedSongIds.includes(song.id));
        
        // Update the count in the header
        songCountEl.textContent = `${likedSongs.length} songs`;
        
        if (likedSongs.length === 0) {
            likedListContainer.innerHTML = `<p style="text-align:center; color: var(--text-muted); padding: 2rem;">You haven't liked any songs yet. Go to the music page and click the heart icon to add songs here!</p>`;
            return;
        }

        // Render the liked songs using the same track row format
        const listHtml = likedSongs.map((song, index) => {
            const artist = allArtists.find(a => a.id === song.artist_id) || { name: 'Unknown' };
            const duration = `${Math.floor(song.duration_seconds / 60)}:${(song.duration_seconds % 60).toString().padStart(2, '0')}`;
            return `
                <div class="track-row">
                    <span class="track-rank">${index + 1}</span>
                    <div class="track-artwork">
                        <img src="${LiveAPI.API_URL}${song.artwork_url}" alt="${song.title}">
                        <div class="track-play-btn" data-song-id="${song.id}"><i class="fas fa-play"></i></div>
                    </div>
                    <div class="track-info">
                        <p class="title">${song.title}</p>
                        <p class="artist">${artist.name}</p>
                    </div>
                    <p class="track-album">${song.genre || 'Single'}</p>
                    <div class="track-meta">
                        <span class="plays">${(song.play_count || 0).toLocaleString()} plays</span>
                    </div>
                </div>`;
        }).join('');
        
        likedListContainer.innerHTML = `<div class="track-list">${listHtml}</div>`;
        
        // Add event listener to play songs from this list
        likedListContainer.addEventListener('click', (e) => {
            const playButton = e.target.closest('.track-play-btn');
            if (playButton) {
                const songId = parseInt(playButton.dataset.songId, 10);
                // Dispatch event for the global player to play from the "liked" playlist
                document.dispatchEvent(new CustomEvent('playSongRequest', {
                    detail: { songId: songId, playlist: likedSongs }
                }));
            }
        });

    } catch (error) {
        likedListContainer.innerHTML = `<p style="color: var(--red); text-align: center;">Error loading your liked songs. Please try again later.</p>`;
        console.error("Error on liked-songs page:", error);
    }
});