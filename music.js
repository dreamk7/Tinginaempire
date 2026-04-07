// FILE: music.js (Final, Complete Version with All Page Logic)

document.addEventListener('DOMContentLoaded', function() {
    const API_URL = 'http://localhost:3000';

    // --- Data (Fetched from backend) ---
    let artists = [];
    let songs = [];

    // --- DOM Elements ---
    const artistsContainer = document.getElementById('artists-filter-container');
    const songsContainer = document.getElementById('songs-grid');
    const videosContainer = document.getElementById('videos-grid');
    const searchInput = document.getElementById('music-search-input');
    const noResultsMsg = document.getElementById('no-results-message');

    // --- State ---
    let currentPlaylist = [];
    let currentSongIndex = 0;
    let activeArtistId = 0;
    let activeSearchTerm = '';
    
    // ===================================================================
    // GENERIC PAGE LOGIC (SLIDESHOW & HAMBURGER)
    // ===================================================================

    // --- Slideshow Logic ---
    const slides = document.querySelectorAll('.hero-slideshow-section .slide');
    const prevBtn = document.querySelector('.hero-slideshow-section .arrow-left');
    const nextBtn = document.querySelector('.hero-slideshow-section .arrow-right');
    if (slides.length > 0) {
        let currentSlide = 0;
        let slideInterval;

        function showSlide(index) {
            slides.forEach((slide, i) => slide.classList.toggle('active', i === index));
            currentSlide = index;
        }

        function nextSlide() { showSlide((currentSlide + 1) % slides.length); }
        function stopSlideshow() { clearInterval(slideInterval); }
        function startSlideshow() {
            stopSlideshow();
            slideInterval = setInterval(nextSlide, 5000);
        }

        if (nextBtn && prevBtn) {
            nextBtn.addEventListener('click', () => { nextSlide(); startSlideshow(); });
            prevBtn.addEventListener('click', () => { showSlide((currentSlide - 1 + slides.length) % slides.length); startSlideshow(); });
        }
        showSlide(0);
        startSlideshow();
    }
    
    // --- Hamburger Menu Logic ---
    const hamburger = document.querySelector('.hamburger-menu');
    const navLinks = document.querySelector('.nav-links');
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }


    // ===================================================================
    // RENDER FUNCTIONS
    // ===================================================================
    function renderArtists() {
        const artistsForFilter = [{ id: 0, name: "All Artists", image_url: "./Photos/crowd.jpg" }, ...artists];
        artistsContainer.innerHTML = artistsForFilter.map(artist => `
            <div class="artist-display ${artist.id == activeArtistId ? 'active' : ''}" data-artist-id="${artist.id}">
                <img src="${artist.id === 0 ? artist.image_url : API_URL + artist.image_url}" alt="${artist.name}">
                <h4>${artist.name}</h4>
            </div>
        `).join('');
    }

    function renderSongs() {
        let filteredSongs = songs.filter(song => {
            const artist = artists.find(a => a.id == song.artist_id);
            const artistName = artist ? artist.name.toLowerCase() : '';
            const artistMatch = activeArtistId == 0 || song.artist_id == activeArtistId;
            const searchMatch = activeSearchTerm === '' ||
                                song.title.toLowerCase().includes(activeSearchTerm) ||
                                artistName.includes(activeSearchTerm);
            return artistMatch && searchMatch;
        });

        currentPlaylist = filteredSongs;
        
        if (filteredSongs.length === 0) {
            songsContainer.innerHTML = '';
            noResultsMsg.style.display = 'block';
        } else {
            noResultsMsg.style.display = 'none';
            songsContainer.innerHTML = filteredSongs.map((song, index) => {
                const artist = artists.find(a => a.id == song.artist_id) || { name: 'Unknown' };
                return `
                <div class="song-card">
                    <div class="song-card-image" style="background-image: url('${API_URL + song.artwork_url}')"></div>
                    <div class="song-card-content">
                        <h4 class="song-card-title">${song.title}</h4>
                        <p class="song-card-artist">${artist.name}</p>
                        <div class="song-card-actions">
                            <button class="play-btn" data-song-index="${index}"><i class="fas fa-play"></i> Play</button>
                            <button class="download-btn" data-song-id="${song.id}"><i class="fas fa-download"></i> Download</button>
                        </div>
                    </div>
                </div>`;
            }).join('');
        }
    }
    
    function renderVideos() {
        const videos = [
            { title: "Official Video: Kampala Nights", youtubeId: "jfKfPfyJRdk" },
            { title: "Live Performance: Echoes of the Nile", youtubeId: "3tmd-ClpJxA" }
        ];
        videosContainer.innerHTML = videos.map(video => `
            <div class="video-card">
                <iframe src="https://www.youtube.com/embed/${video.youtubeId}" title="${video.title}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
            </div>
        `).join('');
    }

    // ===================================================================
    // MUSIC PLAYER LOGIC
    // ===================================================================
    const player = (function() {
        const audio = document.getElementById('audio-source');
        const playerEl = document.getElementById('music-player');
        const artwork = document.getElementById('player-artwork');
        const title = document.getElementById('player-title');
        const artist = document.getElementById('player-artist');
        const playPauseBtn = document.getElementById('play-pause-btn');
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        const progressBar = document.getElementById('progress-bar');
        const progressWrapper = document.getElementById('progress-bar-wrapper');
        const currentTimeEl = document.getElementById('current-time');
        const durationEl = document.getElementById('duration');
        const volumeSlider = document.getElementById('volume-slider');
        const volumeIcon = document.getElementById('volume-icon');

        function playSong(song) {
            if (!song) return;
            playerEl.classList.add('visible');
            artwork.src = API_URL + song.artwork_url;
            title.textContent = song.title;
            const songArtist = artists.find(a => a.id == song.artist_id);
            artist.textContent = songArtist ? songArtist.name : 'Unknown';
            audio.src = API_URL + song.audio_url;
            audio.play();
        }

        function playSongFromPlaylist(index) {
            currentSongIndex = index;
            playSong(currentPlaylist[currentSongIndex]);
        }

        function formatTime(seconds) {
            if (isNaN(seconds)) return '0:00';
            const min = Math.floor(seconds / 60);
            const sec = Math.floor(seconds % 60);
            return `${min}:${sec < 10 ? '0' : ''}${sec}`;
        }
        
        function updateProgress() {
            if (audio.duration) {
                const progressPercent = (audio.currentTime / audio.duration) * 100;
                progressBar.style.width = `${progressPercent}%`;
                currentTimeEl.textContent = formatTime(audio.currentTime);
            }
        }
        
        playPauseBtn.addEventListener('click', () => audio.paused ? audio.play() : audio.pause());
        prevBtn.addEventListener('click', () => playSongFromPlaylist((currentSongIndex - 1 + currentPlaylist.length) % currentPlaylist.length));
        nextBtn.addEventListener('click', () => playSongFromPlaylist((currentSongIndex + 1) % currentPlaylist.length));
        audio.addEventListener('play', () => playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>');
        audio.addEventListener('pause', () => playPauseBtn.innerHTML = '<i class="fas fa-play"></i>');
        audio.addEventListener('ended', () => nextBtn.click());
        audio.addEventListener('timeupdate', updateProgress);
        audio.addEventListener('loadedmetadata', () => durationEl.textContent = formatTime(audio.duration));
        progressWrapper.addEventListener('click', function(e) {
            if (audio.duration) {
                audio.currentTime = (e.offsetX / this.clientWidth) * audio.duration;
            }
        });
        volumeSlider.addEventListener('input', () => audio.volume = volumeSlider.value);
        
        return { playSongFromPlaylist };
    })();

    // ===================================================================
    // AUTHENTICATION & INITIALIZATION
    // ===================================================================
    async function initializePage() {
        try {
            [artists, songs] = await Promise.all([
                fetch(`${API_URL}/api/artists`).then(res => res.json()),
                fetch(`${API_URL}/api/songs`).then(res => res.json())
            ]);
            
            renderArtists();
            renderSongs();
            renderVideos();
            
            artistsContainer.addEventListener('click', e => {
                const artistDisplay = e.target.closest('.artist-display');
                if (artistDisplay) {
                    activeArtistId = parseInt(artistDisplay.dataset.artistId, 10);
                    renderArtists();
                    renderSongs();
                }
            });

            searchInput.addEventListener('input', e => {
                activeSearchTerm = e.target.value.toLowerCase();
                renderSongs();
            });

            songsContainer.addEventListener('click', e => {
                const playBtn = e.target.closest('.play-btn');
                const downloadBtn = e.target.closest('.download-btn');
                
                if (playBtn) {
                    const songIndex = parseInt(playBtn.dataset.songIndex, 10);
                    player.playSongFromPlaylist(songIndex);
                }
                
                if (downloadBtn) {
                    const songId = downloadBtn.dataset.songId;
                    const songToDownload = songs.find(s => s.id == songId);
                    if (songToDownload) {
                        const link = document.createElement('a');
                        link.href = API_URL + songToDownload.audio_url;
                        const artistName = artists.find(a => a.id == songToDownload.artist_id)?.name || 'TinginaEmpire';
                        link.download = `${songToDownload.title} - ${artistName}.mp3`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    }
                }
            });

        } catch (error) {
            console.error("Failed to load music data:", error);
            songsContainer.innerHTML = `<p style="color: var(--red); text-align: center; grid-column: 1 / -1;">Could not connect to the server to load music. Please ensure the backend is running and accessible.</p>`;
        }
    }

    initializePage();
});