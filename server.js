const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const musicMetadata = require('music-metadata');
const bcrypt = require('bcrypt');
const ffmpeg = require('fluent-ffmpeg'); // Required for video duration

// Correctly import all necessary database functions
const {
    setupDatabase,
    getArtists, addArtist, updateArtist, deleteArtist,
    getSongs, addSong, updateSong, deleteSong, toggleSongLike,
    getStats, getChartData,
    getSubmissions, addSubmission, markSubmissionAsRead,
    findUserByEmail, registerUser,
    getBandMembers, addBandMember, deleteBandMember, updateBandMember,
    getVideos, addVideo, deleteVideo,
    getVideoDuration, incrementVideoViewCount,
    getUsers, getUserDetails,
    findUserById, updateUser, deleteUser
} = require('./database.js');

const app = express();
const port = 3000;

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- File Upload Configuration ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => { cb(null, 'uploads/'); },
    filename: (req, file, cb) => { cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_')); }
});
const upload = multer({ storage: storage });

// API ENDPOINTS
// --- AUTH API ---
app.post('/api/auth/register', async (req, res) => { try { const { username, email, password } = req.body; if (!username || !email || !password) return res.status(400).json({ error: 'All fields are required.' }); res.status(201).json(await registerUser(username, email, password)); } catch (error) { res.status(400).json({ error: error.message }); } });
app.post('/api/auth/login', async (req, res) => { try { const { email, password } = req.body; const user = await findUserByEmail(email); if (!user) return res.status(401).json({ error: 'Invalid email or password.' }); const isMatch = await bcrypt.compare(password, user.password_hash); if (!isMatch) return res.status(401).json({ error: 'Invalid email or password.' }); const { password_hash, ...userWithoutPassword } = user; res.json(userWithoutPassword); } catch (error) { console.error("Login error:", error); res.status(500).json({ error: 'Server error during login.' }); } });

// --- ARTISTS API (Final Corrected Version) ---
app.get('/api/artists', async (req, res) => { try { res.json(await getArtists()); } catch (e) { res.status(500).json({error: e.message}); } });

app.post('/api/artists', upload.single('image'), async (req, res) => {
    try {
        const { name, bio, twitter_url, instagram_url, facebook_url } = req.body;
        if (!req.file) return res.status(400).json({ error: 'Image file is required.' });
        const imageUrl = `/uploads/${req.file.filename}`;
        const urls = { twitter: twitter_url, instagram: instagram_url, facebook: facebook_url };
        res.status(201).json(await addArtist(name, bio, imageUrl, urls));
    } catch (e) { res.status(500).json({error: e.message}); }
});

// This endpoint now correctly handles FormData for updates.
app.put('/api/artists/:id', upload.single('image'), async (req, res) => {
    try {
        const { name, bio, twitter_url, instagram_url, facebook_url } = req.body;
        const urls = { twitter: twitter_url, instagram: instagram_url, facebook: facebook_url };
        //check if a new image file was uploaded
        let newImageUrl = req.file ? `/uploads/${req.file.filename}` : null;
        const updatedArtist = await updateArtist(req.params.id, name, bio, newImageUrl, urls);
        //if sucessful, return updated artist
        res.json(updatedArtist);
    } catch (e) {
        //if any error occurs, log it and send a valid JSON error response
        console.error("CRITICAL ERROR in PUT /api/artists/:id :", e);
        res.status(500).json({ error: "An error occurred on the server while updating the artist." });
    }
});

app.delete('/api/artists/:id', async (req, res) => { try { await deleteArtist(req.params.id); res.status(204).send(); } catch (e) { res.status(500).json({error: e.message}); } });

// --- SONGS API ---
app.get('/api/songs', async (req, res) => { try { res.json(await getSongs()); } catch(e) { res.status(500).json({error: e.message}); } });
app.post('/api/songs', upload.fields([{ name: 'artwork', maxCount: 1 }, { name: 'audio', maxCount: 1 }]), async (req, res) => { try { const { title, artistId, genre, videoUrl } = req.body; const artworkUrl = `/uploads/${req.files.artwork[0].filename}`; const audioUrl = `/uploads/${req.files.audio[0].filename}`; const metadata = await musicMetadata.parseFile(path.join(__dirname, 'uploads', req.files.audio[0].filename)); const duration = Math.round(metadata.format.duration); res.status(201).json(await addSong(title, artistId, artworkUrl, audioUrl, duration, genre, videoUrl)); } catch(e) { res.status(500).json({error: e.message}); } });
app.put('/api/songs/:id', async (req, res) => { try { res.json(await updateSong(req.params.id, req.body)); } catch(e) { res.status(500).json({error: e.message}); } });
app.delete('/api/songs/:id', async (req, res) => { try { await deleteSong(req.params.id); res.status(204).send(); } catch(e) { res.status(500).json({error: e.message}); } });
app.post('/api/songs/:id/toggle-like', async (req, res) => { try { const { increment } = req.body; res.json(await toggleSongLike(req.params.id, increment)); } catch(e) { res.status(500).json({error: e.message}); } });

// --- BAND & VIDEOS API (UPDATED) ---
app.get('/api/band-members', async (req, res) => { 
    try { 
        res.json(await getBandMembers()); 
    } catch(e) { 
        res.status(500).json({error: e.message}); 
    } 
});
app.post('/api/band-members', upload.single('image'), async (req, res) => { 
    try { 
        const { name, role, bio } = req.body; 
        const imageUrl = `/uploads/${req.file.filename}`; 
        res.status(201).json(await addBandMember(name, role, bio, imageUrl)); 
    } catch(e) { 
        res.status(500).json({error: e.message}); 
    } 
});
app.put('/api/band-members/:id', upload.single('image'), async (req, res) => {
    try {
        const { name, role, bio } = req.body;
        let newImageUrl = req.file ? `/uploads/${req.file.filename}` : null;
        res.json(await updateBandMember(req.params.id, name, role, bio, newImageUrl));
    } catch(e) { 
        res.status(500).json({error: e.message}); 
    }
});
app.delete('/api/band-members/:id', async (req, res) => { 
    try { 
        await deleteBandMember(req.params.id); 
        res.status(204).send(); 
    } catch(e) { 
        res.status(500).json({error: e.message}); 
    } 
});
app.get('/api/videos', async (req, res) => {
    try {
        res.json(await getVideos());
    } catch(e) {
        res.status(500).json({error: e.message});
    }
});
app.delete('/api/videos/:id', async (req, res) => {
    try {
        await deleteVideo(req.params.id);
        res.status(204).send();
    } catch(e) {
        res.status(500).json({error: e.message});
    }
});

// --- Videos API (UPDATED AND FINAL) ---
app.post('/api/videos', upload.single('videoFile'), async (req, res) => {
    try {
        const { title, youtubeUrl, featured } = req.body;
        let localUrl = null;
        let duration = 0;

        // Validation
        if (!title || (!req.file && !youtubeUrl)) {
            return res.status(400).json({ error: 'Title and either a video file or YouTube URL is required.' });
        }

        if (req.file) {
            localUrl = `/uploads/${req.file.filename}`;
            try {
                // Asynchronously get video duration using ffprobe
                duration = await new Promise((resolve, reject) => {
                    ffmpeg.ffprobe(req.file.path, (err, metadata) => {
                        if (err) return reject(err);
                        resolve(Math.round(metadata.format.duration));
                    });
                });
            } catch (ffprobeError) {
                console.error("FFMpeg Error: Could not get video duration. FFMpeg might not be installed correctly.", ffprobeError);
                // Continue without duration if ffprobe fails
            }
        }
        
        const videoData = { youtubeUrl, localUrl, duration, featured: !!featured };
        const newVideo = await addVideo(title, videoData);
        res.status(201).json(newVideo);
    } catch (e) {
        console.error("Error in POST /api/videos:", e);
        res.status(500).json({error: "Failed to save video. " + e.message});
    }
});

app.post('/api/videos/:id/view', async (req, res) => {
    try {
        await incrementVideoViewCount(req.params.id);
        res.status(204).send();
    } catch(e) { res.status(500).json({error: e.message}); }
});

// --- FORMS & STATS API ---
app.post('/api/submit-form', async (req, res) => { try { const { formType, name, email, ...details } = req.body; res.status(201).json(await addSubmission(formType, name, email, details)); } catch(e) { res.status(500).json({error: e.message}); } });
app.get('/api/submissions', async (req, res) => { try { res.json(await getSubmissions()); } catch(e) { res.status(500).json({error: e.message}); } });
app.post('/api/submissions/:id/read', async (req, res) => { try { await markSubmissionAsRead(req.params.id); res.status(204).send(); } catch(e) { res.status(500).json({error: e.message}); } });
app.get('/api/stats', async (req, res) => { try { res.json(await getStats()); } catch(e) { res.status(500).json({error: e.message}); } });
app.get('/api/stats/chart-data', async (req, res) => { try { res.json(await getChartData()); } catch(e) { res.status(500).json({error: e.message}); } });

// --- NEW: USERS API ---
app.get('/api/users', async (req, res) => {
    try { res.json(await getUsers()); } catch (e) { res.status(500).json({error: e.message}); }
});

app.get('/api/users/:id/details', async (req, res) => {
    try {
        const details = await getUserDetails(req.params.id);
        if (!details) return res.status(404).json({error: "User not found"});
        res.json(details);
    } catch (e) { res.status(500).json({error: e.message}); }
});

// NEW: Endpoint to update a user
app.put('/api/users/:id', async (req, res) => {
    try { res.json(await updateUser(req.params.id, req.body)); } 
    catch (e) { res.status(500).json({error: e.message}); }
});

// NEW: Endpoint to delete a user
app.delete('/api/users/:id', async (req, res) => {
    try { await deleteUser(req.params.id); res.status(204).send(); } 
    catch (e) { res.status(500).json({error: e.message}); }
});

// NEW: Endpoint for the admin to verify their own password for sensitive actions
app.post('/api/auth/verify-admin', async (req, res) => {
    try {
        const { adminEmail, password } = req.body;
        const adminUser = await findUserByEmail(adminEmail);
        if (!adminUser || !adminUser.is_admin) {
            return res.status(403).json({ error: "Authentication failed." });
        }
        const isMatch = await bcrypt.compare(password, adminUser.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: "Incorrect admin password." });
        }
        res.json({ success: true });
    } catch (e) { res.status(500).json({error: e.message}); }
});

// --- START SERVER ---
const startServer = async () => {
    try {
        await setupDatabase();
        app.listen(port, () => console.log(`TinginaEmpire backend server running at http://localhost:${port}`));
    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
};

startServer();