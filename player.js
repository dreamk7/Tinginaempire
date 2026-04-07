// FILE: player.js (Final Version with Persistent Playback & Custom Notifications)

document.addEventListener('DOMContentLoaded', function() {
    // This script initializes and controls the global music player.
    // It is self-contained and runs automatically on every page it's included on.
    
    // --- State Management ---
    let allSongs = [], allArtists = [], userLikes = JSON.parse(localStorage.getItem('tingina_user_likes') || '[]');
    let currentPlaylist = [], currentSongIndex = -1;
    let isInitialized = false;

    // --- DOM Elements ---
    const playerEl = document.getElementById('music-player');
    if (!playerEl) return;

    const audio = document.getElementById('audio-source');
    const artworkEl = document.getElementById('player-artwork');
    const titleEl = document.getElementById('player-title');
    const artistEl = document.getElementById('player-artist');
    const playPauseBtn = document.getElementById('play-pause-btn');
    const nextBtn = document.getElementById('next-btn');
    const prevBtn = document.getElementById('prev-btn');
    const progressBar = document.getElementById('progress-bar');
    const progressWrapper = document.getElementById('progress-bar-wrapper');
    const currentTimeEl = document.getElementById('current-time');
    const durationEl = document.getElementById('duration');
    const volumeSlider = document.getElementById('volume-slider');
    const volumeIcon = document.getElementById('volume-icon');
    const downloadBtn = document.getElementById('player-download-btn');
    const likeBtn = document.getElementById('player-like-btn');
    
    // --- State Saving & Loading for Persistence ---
    const savePlayerState = () => {
        if (!audio.paused && currentPlaylist.length > 0) {
            const state = { playlist: currentPlaylist, songIndex: currentSongIndex, currentTime: audio.currentTime };
            sessionStorage.setItem('tinginaPlayerState', JSON.stringify(state));
        } else {
            sessionStorage.removeItem('tinginaPlayerState');
        }
    };

    const loadPlayerState = () => {
        const state = JSON.parse(sessionStorage.getItem('tinginaPlayerState'));
        if (state && state.playlist?.length > 0 && state.songIndex !== -1) {
            playSong(state.playlist[state.songIndex], state.playlist, state.currentTime);
        }
    };
    
    // --- Core Player Functions ---
    const playSong = (song, playlist, startTime = 0) => {
        if (!song) return;
        currentPlaylist = playlist;
        currentSongIndex = playlist.findIndex(s => s.id === song.id);
        const artist = allArtists.find(a => a.id === song.artist_id) || { name: 'Unknown' };
        
        artworkEl.src = LiveAPI.API_URL + song.artwork_url;
        titleEl.textContent = song.title;
        artistEl.textContent = artist.name;
        if(downloadBtn) {
            downloadBtn.href = LiveAPI.API_URL + song.audio_url;
            downloadBtn.download = `${song.title} - ${artist.name}.mp3`;
        }
        
        if (audio.src !== (LiveAPI.API_URL + song.audio_url)) {
            audio.src = LiveAPI.API_URL + song.audio_url;
        }
        
        audio.currentTime = startTime;
        audio.play().catch(error => console.error("Audio Playback Error:", error));
        playerEl.classList.add('visible');
    };

    const togglePlay = () => { if (audio.src) audio.paused ? audio.play() : audio.pause(); };
    const playNext = () => { if (currentPlaylist.length > 0) playSong(currentPlaylist[(currentSongIndex + 1) % currentPlaylist.length], currentPlaylist); };
    const playPrev = () => { if (currentPlaylist.length > 0) playSong(currentPlaylist[(currentSongIndex - 1 + currentPlaylist.length) % currentPlaylist.length], currentPlaylist); };
    const formatTime = (s) => { if(isNaN(s)) return '0:00'; const m=Math.floor(s/60); const sec=Math.floor(s%60); return `${m}:${sec<10?'0':''}${sec}`; };
    const updateProgress = () => { if(audio.duration) { progressBar.style.width=`${(audio.currentTime/audio.duration)*100}%`; currentTimeEl.textContent=formatTime(audio.currentTime); } };

    // --- INITIALIZATION ---
    async function init() {
        if (isInitialized) return;
        isInitialized = true;
        
        try {
            [allArtists, allSongs] = await Promise.all([LiveAPI.getArtists(), LiveAPI.getSongs()]);
            loadPlayerState();
        } catch (error) {
            console.error("Global Player: Failed to preload song/artist data.", error);
            return;
        }
        
        // UPDATED: Use custom confirmation dialog for login-required actions
        document.addEventListener('playSongRequest', async (e) => {
            const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
            if (!currentUser) {
                // Use custom dialog instead of browser confirm
                const userConfirmed = await showConfirmation("Login Required", "You need to be logged in to play music. Go to the login page?");
                if (userConfirmed) {
                    savePlayerState(); // Save their intent
                    window.location.href = './login.html';
                }
                return;
            }
            const { songId, playlist } = e.detail;
            const songToPlay = allSongs.find(s => s.id === songId);
            playSong(songToPlay, playlist);
        });

        // Wire up player controls
        playPauseBtn.onclick = togglePlay;
        audio.onplay = () => playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        audio.onpause = () => playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        nextBtn.onclick = playNext;
        prevBtn.onclick = playPrev;
        audio.onended = playNext;
        audio.ontimeupdate = updateProgress;
        audio.onloadedmetadata = () => durationEl.textContent = formatTime(audio.duration);

        progressWrapper.onclick = (e) => { if (audio.duration) audio.currentTime = (e.offsetX / e.currentTarget.clientWidth) * audio.duration; };
        if(volumeSlider) volumeSlider.oninput = () => { audio.volume=volumeSlider.value; volumeIcon.className = audio.volume>0.5?'fas fa-volume-up':audio.volume>0?'fas fa-volume-down':'fas fa-volume-mute'; };

        // Save state before leaving the page
        window.addEventListener('beforeunload', savePlayerState);
        document.querySelectorAll('a').forEach(link => {
            if (link.hostname === window.location.hostname || link.hostname === '') {
                link.addEventListener('click', savePlayerState);
            }
        });
        
        console.log("Global Player Initialized Successfully.");
    }
    
    init();
});