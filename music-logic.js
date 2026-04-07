// FILE: music-logic.js (Final Version with All Advanced Features)

document.addEventListener('DOMContentLoaded', function() {
    // Auth and Player are globally available and self-initializing
    
    // --- State Management ---
    let allArtists = [], allSongs = [], allGenres = [];
    let userLikes = [];
    let artistState = { currentPage: 1, itemsPerPage: 8 };
    let songState = { currentPage: 1, itemsPerPage: 10 };

    // --- DOM Elements ---
    const mainContent = document.querySelector('main');
    const trendingListContainer = document.getElementById('trending-tracks-list');
    const artistGrid = document.getElementById('featured-artists-grid');
    const songListContainer = document.getElementById('all-songs-list');
    const artistPaginationContainer = document.getElementById('artist-pagination');
    const songPaginationContainer = document.getElementById('song-pagination');
    const artistFilterBar = document.getElementById('artist-filter-bar');
    const songFilterBar = document.getElementById('song-filter-bar');
    const noArtistsMessage = document.getElementById('no-artists-message');
    const noSongsMessage = document.getElementById('no-songs-message');
    const allSongsSection = document.getElementById('all-songs-section');
    
    // --- Slideshow & Hamburger Logic ---
    const hamburger = document.querySelector('.hamburger-menu');
    const navLinks = document.querySelector('.nav-links');
    const slides = document.querySelectorAll('.hero-slideshow-section .slide');
    if (hamburger && navLinks) hamburger.addEventListener('click', () => navLinks.classList.toggle('active'));
    if (slides.length > 0) {
        let currentSlide = 0;
        setInterval(() => {
            currentSlide = (currentSlide + 1) % slides.length;
            slides.forEach((s, i) => s.classList.toggle('active', i === currentSlide));
        }, 5000);
    }

    // --- RENDER FUNCTIONS ---
    function renderTrendingTracks() {
        const trendingSongs = [...allSongs].sort((a, b) => (b.play_count || 0) - (a.play_count || 0)).slice(0, 5);
        trendingListContainer.innerHTML = `<div class="track-list">${trendingSongs.map((song, index) => renderTrackRow(song, index + 1, allArtists, userLikes)).join('')}</div>`;
    }

    function renderArtists(filteredArtists = getFilteredArtists()) {
        noArtistsMessage.style.display = filteredArtists.length === 0 ? 'block' : 'none';
        const totalPages = Math.ceil(filteredArtists.length / artistState.itemsPerPage);
        artistState.currentPage = Math.min(artistState.currentPage, totalPages || 1);
        const start = (artistState.currentPage - 1) * artistState.itemsPerPage;
        const artistsToDisplay = filteredArtists.slice(start, start + artistState.itemsPerPage);
        
        artistGrid.innerHTML = artistsToDisplay.map(artist => {
            const artistSongs = allSongs.filter(s => s.artist_id === artist.id);
            const totalPlays = artistSongs.reduce((sum, song) => sum + (song.play_count || 0), 0);
            return `<div class="artist-profile-card" data-artist-id="${artist.id}">
                        <div class="artist-image-container"><img src="${LiveAPI.API_URL}${artist.image_url}" alt="${artist.name}"></div>
                        <div class="artist-compact-info"><h3>${artist.name}</h3><p>${artistSongs[0]?.genre || 'Diverse Artist'}</p></div>
                        <div class="artist-expanded-details">
                            <p class="bio">${artist.bio || 'One of TinginaEmpire\'s finest artists.'}</p>
                            <div class="artist-card-stats"><span><i class="fas fa-play"></i> ${totalPlays.toLocaleString()} plays</span><span><i class="fas fa-music"></i> ${artistSongs.length} tracks</span></div>
                            <div class="actions"><button class="btn btn-primary play-artist-btn" data-artist-id="${artist.id}"><i class="fas fa-play"></i> Play All</button></div>
                        </div>
                    </div>`;
        }).join('');
        renderPagination(artistPaginationContainer, artistState, totalPages, () => renderArtists(getFilteredArtists()));
    }

    function renderSongs(songsToRender = getFilteredSongs()) {
        noSongsMessage.style.display = songsToRender.length === 0 ? 'block' : 'none';
        const totalPages = Math.ceil(songsToRender.length / songState.itemsPerPage);
        songState.currentPage = Math.min(songState.currentPage, totalPages || 1);
        const start = (songState.currentPage - 1) * songState.itemsPerPage;
        const songsToDisplay = songsToRender.slice(start, start + songState.itemsPerPage);
        songListContainer.innerHTML = `<div class="track-list">${songsToDisplay.map((song, i) => renderTrackRow(song, start + i + 1, allArtists, userLikes)).join('')}</div>`;
        renderPagination(songPaginationContainer, songState, totalPages, () => renderSongs(getFilteredSongs()));
    }

    function renderPagination(container, state, totalPages, renderFn) {
        if (totalPages <= 1) { container.innerHTML = ''; return; }
        container.innerHTML = `
            <button class="pagination-btn prev-btn" ${state.currentPage === 1 ? 'disabled' : ''}><i class="fas fa-chevron-left"></i></button>
            <span class="page-info">Page ${state.currentPage} of ${totalPages}</span>
            <button class="pagination-btn next-btn" ${state.currentPage === totalPages ? 'disabled' : ''}><i class="fas fa-chevron-right"></i></button>`;
        container.querySelector('.prev-btn').onclick = () => { if (state.currentPage > 1) { state.currentPage--; renderFn(); } };
        container.querySelector('.next-btn').onclick = () => { if (state.currentPage < totalPages) { state.currentPage++; renderFn(); } };
    }

    // --- FILTERING LOGIC ---
    function getFilteredArtists() {
        const searchTerm = artistFilterBar.querySelector('#artist-search-input').value.toLowerCase();
        const selectedGenre = artistFilterBar.querySelector('#genre-filter-select').value;
        return allArtists.filter(artist => {
            const nameMatch = artist.name.toLowerCase().includes(searchTerm);
            if (selectedGenre === 'all') return nameMatch;
            const artistHasGenre = allSongs.some(s => s.artist_id === artist.id && s.genre === selectedGenre);
            return nameMatch && artistHasGenre;
        });
    }

    function getFilteredSongs() {
        const searchTerm = songFilterBar.querySelector('#song-search-input').value.toLowerCase();
        const artistFilter = songFilterBar.querySelector('#song-artist-filter').value;
        const genreFilter = songFilterBar.querySelector('#song-genre-filter').value;
        return allSongs.filter(song => {
            const artist = allArtists.find(a => a.id === song.artist_id);
            const titleMatch = song.title.toLowerCase().includes(searchTerm);
            const artistNameMatch = artist ? artist.name.toLowerCase().includes(searchTerm) : false;
            const artistMatch = artistFilter === 'all' || song.artist_id == artistFilter;
            const genreMatch = genreFilter === 'all' || song.genre === genreFilter;
            return (titleMatch || artistNameMatch) && artistMatch && genreMatch;
        });
    }

    // --- INITIALIZATION ---
    async function initializePage() {
        try {
            userLikes = JSON.parse(localStorage.getItem('tingina_user_likes') || '[]');
            [allArtists, allSongs] = await Promise.all([LiveAPI.getArtists(), LiveAPI.getSongs()]);
            allGenres = [...new Set(allSongs.map(s => s.genre).filter(Boolean).sort())];
            
            artistFilterBar.innerHTML = `<div class="filter-group"><label><i class="fas fa-search"></i></label><input type="text" id="artist-search-input" placeholder="Search artists..."></div><div class="filter-group"><label>Genre:</label><select id="genre-filter-select"><option value="all">All Genres</option>${allGenres.map(g => `<option value="${g}">${g}</option>`).join('')}</select></div>`;
            songFilterBar.innerHTML = `<div class="filter-group"><label><i class="fas fa-search"></i></label><input type="text" id="song-search-input" placeholder="Search by title or artist..."></div><div class="filter-group"><label>Artist:</label><select id="song-artist-filter"><option value="all">All Artists</option>${allArtists.map(a => `<option value="${a.id}">${a.name}</option>`).join('')}</select></div><div class="filter-group"><label>Genre:</label><select id="song-genre-filter"><option value="all">All Genres</option>${allGenres.map(g => `<option value="${g}">${g}</option>`).join('')}</select></div>`;
            
            renderTrendingTracks();
            renderArtists();
            renderSongs();
        } catch (error) {
            mainContent.innerHTML = `<div class="container section-padding" style="text-align: center;"><p style="color: var(--red);">Could not connect to the server. Please ensure the backend is running and the database is populated.</p></div>`;
        }
        
        artistFilterBar.addEventListener('input', () => { artistState.currentPage = 1; renderArtists(); });
        songFilterBar.addEventListener('input', () => { songState.currentPage = 1; renderSongs(); });

        mainContent.addEventListener('click', async (e) => {
            const playBtn = e.target.closest('.track-play-btn, .play-artist-btn');
            const artistCard = e.target.closest('.artist-profile-card');
            const likeBtn = e.target.closest('.like-btn');
            const downloadBtn = e.target.closest('.download-btn');
            const row = e.target.closest('.track-row');
            
            // Centralized login check
            const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
            if (!currentUser && (playBtn || likeBtn || downloadBtn)) {
                if(confirm("You need to be logged in for this action. Go to login page?")) {
                    window.location.href = './login.html';
                }
                return;
            }
            
            if (playBtn) {
                e.preventDefault();
                let songId, playlist;
                if (playBtn.classList.contains('play-artist-btn')) {
                    const artistId = parseInt(playBtn.dataset.artistId, 10);
                    playlist = allSongs.filter(s => s.artist_id === artistId);
                    if (playlist.length > 0) songId = playlist[0].id;
                    else { showToast('This artist has no songs to play yet.', 'fa-info-circle'); return; }
                } else {
                    songId = parseInt(playBtn.closest('.track-row').dataset.songId, 10);
                    if (e.target.closest('#trending-tracks-list')) {
                        playlist = [...allSongs].sort((a,b)=>(b.play_count||0)-(a.play_count||0)).slice(0,5);
                    } else {
                        playlist = getFilteredSongs();
                    }
                }
                document.dispatchEvent(new CustomEvent('playSongRequest', { detail: { songId, playlist } }));
            }
            
            if (downloadBtn && row) {
                const songId = parseInt(row.dataset.songId, 10);
                const song = allSongs.find(s => s.id === songId);
                if (song) showToast(`Downloading: ${song.title}`, 'fa-download');
            }
            
            if (likeBtn && row) {
                const songId = parseInt(row.dataset.songId, 10);
                const isNowLiked = !userLikes.includes(songId);
                
                likeBtn.classList.toggle('active', isNowLiked);
                likeBtn.querySelector('i').className = `fa-heart ${isNowLiked ? 'fas' : 'far'}`;
                
                if (isNowLiked) { userLikes.push(songId); showToast('Added to Liked Songs'); } 
                else { userLikes.splice(userLikes.indexOf(songId), 1); showToast('Removed from Liked Songs', 'fa-minus-circle'); }
                localStorage.setItem('tingina_user_likes', JSON.stringify(userLikes));
                
                try {
                    await LiveAPI.toggleSongLike(songId, isNowLiked);
                } catch(err) { console.error("Failed to sync like with server:", err); }
            }

            if (artistCard && !e.target.closest('.actions') && !e.target.closest('.artist-social-links a')) {
                e.preventDefault();
                songFilterBar.querySelector('#song-artist-filter').value = artistCard.dataset.artistId;
                songState.currentPage = 1;
                renderSongs();
                allSongsSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    initializePage();
});