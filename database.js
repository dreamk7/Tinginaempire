// FILE: database.js 
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'TinginaEmpire', 
    password: 'ianmufasa9114',
    port: 5432,
});

const setupDatabase = async () => {
    const client = await pool.connect();
    try {
        await client.query(`CREATE TABLE IF NOT EXISTS artists (id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, bio TEXT, image_url VARCHAR(255) NOT NULL, twitter_url VARCHAR(255), instagram_url VARCHAR(255), facebook_url VARCHAR(255), created_at TIMESTAMPTZ DEFAULT NOW());`);
        await client.query(`CREATE TABLE IF NOT EXISTS songs (id SERIAL PRIMARY KEY, title VARCHAR(255) NOT NULL, artist_id INTEGER REFERENCES artists(id) ON DELETE CASCADE, genre VARCHAR(100), video_url VARCHAR(255), duration_seconds INTEGER NOT NULL, play_count INTEGER DEFAULT 0, download_count INTEGER DEFAULT 0, like_count INTEGER DEFAULT 0, artwork_url VARCHAR(255) NOT NULL, audio_url VARCHAR(255) NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW());`);
        await client.query(`CREATE TABLE IF NOT EXISTS submissions (id SERIAL PRIMARY KEY, form_type VARCHAR(50) NOT NULL, name VARCHAR(255) NOT NULL, email VARCHAR(255) NOT NULL, details JSONB, is_read BOOLEAN DEFAULT FALSE, created_at TIMESTAMPTZ DEFAULT NOW());`);
        await client.query(`CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, username VARCHAR(100) NOT NULL, email VARCHAR(255) UNIQUE NOT NULL, password_hash VARCHAR(255) NOT NULL, is_admin BOOLEAN DEFAULT FALSE, created_at TIMESTAMPTZ DEFAULT NOW());`);
        await client.query(`CREATE TABLE IF NOT EXISTS band_members (id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, role VARCHAR(100), bio TEXT, image_url VARCHAR(255) NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW());`);
        await client.query(`CREATE TABLE IF NOT EXISTS videos (id SERIAL PRIMARY KEY, title VARCHAR(255) NOT NULL, youtube_url TEXT, video_url VARCHAR(255), duration_seconds INTEGER DEFAULT 0, view_count INTEGER DEFAULT 0, featured_on_band_page BOOLEAN DEFAULT FALSE, created_at TIMESTAMPTZ DEFAULT NOW());`);
        
        const adminCheck = await client.query("SELECT * FROM users WHERE email = 'admin@tingina.com'");
        if (adminCheck.rowCount === 0) {
            const salt = await bcrypt.genSalt(10);
            const adminPasswordHash = await bcrypt.hash('password', salt);
            await client.query("INSERT INTO users (username, email, password_hash, is_admin) VALUES ($1, $2, $3, TRUE)",['Admin','admin@tingina.com',adminPasswordHash]);
        }
        console.log("Database tables are set up successfully.");
    } catch(error) {
        console.error("Error setting up database tables:", error);
        throw error;
    } finally {
        client.release();
    }
};

//--- ARTIST MANAGEMENT FUNCTIONS ---
const getArtists = async () => {
    const res = await pool.query('SELECT * FROM artists ORDER BY name ASC');
    return res.rows;
};
const addArtist = async (name, bio, imageUrl, urls) => {
    const res = await pool.query(
        'INSERT INTO artists (name, bio, image_url, twitter_url, instagram_url, facebook_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [name, bio, imageUrl, urls.twitter, urls.instagram, urls.facebook]
    );
    return res.rows[0];
};
const updateArtist = async (id, name, bio, newImageUrl, urls) => {
    let query, params;
    if (newImageUrl) {
        query = 'UPDATE artists SET name = $1, bio = $2, image_url = $3, twitter_url = $4, instagram_url = $5, facebook_url = $6 WHERE id = $7 RETURNING *';
        params = [name, bio, newImageUrl, urls.twitter, urls.instagram, urls.facebook, id];
    } else {
        query = 'UPDATE artists SET name = $1, bio = $2, twitter_url = $3, instagram_url = $4, facebook_url = $5 WHERE id = $6 RETURNING *';
        params = [name, bio, urls.twitter, urls.instagram, urls.facebook, id];
    }
    const res = await pool.query(query, params);
    return res.rows[0];
};
const deleteArtist = async (id) => {
    await pool.query('DELETE FROM artists WHERE id = $1', [id]);
};

//--- SONG MANAGEMENT FUNCTIONS ---
const getSongs = async () => {
    const res = await pool.query('SELECT * FROM songs ORDER BY created_at DESC');
    return res.rows;
};
const addSong = async (title, artistId, artworkUrl, audioUrl, duration, genre, videoUrl) => {
    const res = await pool.query('INSERT INTO songs (title, artist_id, artwork_url, audio_url, duration_seconds, genre, video_url) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *', [title, artistId, artworkUrl, audioUrl, duration, genre, videoUrl]);
    return res.rows[0];
};
const updateSong = async (id, { title, artistId, genre, videoUrl }) => {
    const res = await pool.query('UPDATE songs SET title = $1, artist_id = $2, genre = $3, video_url = $4 WHERE id = $5 RETURNING *', [title, artistId, genre, videoUrl, id]);
    return res.rows[0];
};
const deleteSong = async (id) => {
    await pool.query('DELETE FROM songs WHERE id = $1', [id]);
};
const toggleSongLike = async (songId, increment) => {
    const query = increment
        ? 'UPDATE songs SET like_count = like_count + 1 WHERE id = $1 RETURNING like_count'
        : 'UPDATE songs SET like_count = GREATEST(0, like_count - 1) WHERE id = $1 RETURNING like_count';
    const res = await pool.query(query, [songId]);
    return res.rows[0];
};

//--- STATISTICS AND CHART DATA FUNCTIONS ---
const getStats = async () => {
    const songsRes = await pool.query('SELECT COUNT(*) as song_count, SUM(play_count) as total_plays, SUM(download_count) as total_downloads FROM songs');
    const artistsRes = await pool.query('SELECT COUNT(*) as artist_count FROM artists');
    const submissionsRes = await pool.query('SELECT COUNT(*) as unread_count FROM submissions WHERE is_read = FALSE');
    const usersRes = await pool.query('SELECT COUNT(*) as user_count FROM users WHERE is_admin = FALSE');
    
    return {
        song_count: parseInt(songsRes.rows[0].song_count, 10) || 0,
        total_plays: parseInt(songsRes.rows[0].total_plays, 10) || 0,
        artist_count: parseInt(artistsRes.rows[0].artist_count, 10) || 0,
        user_count: parseInt(usersRes.rows[0].user_count, 10) || 0,
        unread_submissions: parseInt(submissionsRes.rows[0].unread_count, 10) || 0 
    };
};

const getChartData = async () => {
    const playsByArtistRes = await pool.query(`
        SELECT a.name, SUM(s.play_count) as total_plays
        FROM songs s
        JOIN artists a ON s.artist_id = a.id
        GROUP BY a.name
        ORDER BY total_plays DESC
        LIMIT 5;
    `);
    const registrationsRes = await pool.query(`
        SELECT date_trunc('day', created_at)::date AS day, COUNT(*) AS count
        FROM users
        WHERE created_at >= NOW() - interval '30 days' AND is_admin = FALSE
        GROUP BY day
        ORDER BY day;
    `);

    return {
        playsByArtist: playsByArtistRes.rows,
        registrations: registrationsRes.rows
    };
};

const getSubmissions = async () => {
    const res = await pool.query('SELECT * FROM submissions ORDER BY created_at DESC');
    return res.rows;
};
const addSubmission = async (formType, name, email, details) => {
    const res = await pool.query('INSERT INTO submissions (form_type, name, email, details) VALUES ($1, $2, $3, $4) RETURNING *', [formType, name, email, details]);
    return res.rows[0];
};
const markSubmissionAsRead = async (id) => {
    await pool.query('UPDATE submissions SET is_read = TRUE WHERE id = $1', [id]);
};

// --- USER MANAGEMENT FUNCTIONS (UPDATED) ---
const getUsers = async () => {
    const res = await pool.query("SELECT id, username, email, created_at FROM users WHERE is_admin = FALSE ORDER BY created_at DESC");
    return res.rows;
};
const findUserByEmail = async (email) => {
    const res = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return res.rows[0];
};
const findUserById = async (id) => {
    const res = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return res.rows[0];
};
const registerUser = async (username, email, password) => {
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
        throw new Error('An account with this email already exists.');
    }
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const res = await pool.query('INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, is_admin', [username, email, passwordHash]);
    return res.rows[0];
};
const updateUser = async (userId, { username, email, newPassword, isAdmin }) => {
    const fields = [username, email, isAdmin, userId];
    let query;
    if (newPassword) {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, salt);
        fields.splice(2, 0, passwordHash); // Insert password hash into params
        query = 'UPDATE users SET username = $1, email = $2, password_hash = $3, is_admin = $4 WHERE id = $5 RETURNING id, username, email, is_admin';
    } else {
        query = 'UPDATE users SET username = $1, email = $2, is_admin = $3 WHERE id = $4 RETURNING id, username, email, is_admin';
    }
    const res = await pool.query(query, fields);
    return res.rows[0];
};
const deleteUser = async (userId) => {
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);
};

const getBandMembers = async () => {
    const res = await pool.query('SELECT * FROM band_members ORDER BY id ASC');
    return res.rows;
};
const addBandMember = async (name, role, bio, imageUrl) => {
    const res = await pool.query(
        'INSERT INTO band_members (name, role, bio, image_url) VALUES ($1, $2, $3, $4) RETURNING *',
        [name, role, bio, imageUrl]
    );
    return res.rows[0];
};
const updateBandMember = async (id, name, role, bio, newImageUrl = null) => {
    let query, params;
    if (newImageUrl) {
        query = 'UPDATE band_members SET name = $1, role = $2, bio = $3, image_url = $4 WHERE id = $5 RETURNING *';
        params = [name, role, bio, newImageUrl, id];
    } else {
        query = 'UPDATE band_members SET name = $1, role = $2, bio = $3 WHERE id = $4 RETURNING *';
        params = [name, role, bio, id];
    }
    const res = await pool.query(query, params);
    return res.rows[0];
};
const deleteBandMember = async (id) => {
    await pool.query('DELETE FROM band_members WHERE id = $1', [id]);
};

const getVideos = async () => {
    const res = await pool.query('SELECT * FROM videos ORDER BY created_at DESC');
    return res.rows;
};
const addVideo = async (title, { youtubeUrl, localUrl, duration, featured }) => {
    const res = await pool.query(
        'INSERT INTO videos (title, youtube_url, video_url, duration_seconds, featured_on_band_page) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [title, youtubeUrl || null, localUrl || null, duration || 0, featured || false]
    );
    return res.rows[0];
};
const deleteVideo = async (id) => {
    await pool.query('DELETE FROM videos WHERE id = $1', [id]);
};
const incrementVideoViewCount = async (id) => {
    await pool.query('UPDATE videos SET view_count = view_count + 1 WHERE id = $1', [id]);
};

module.exports = {
    setupDatabase,
    getArtists, addArtist, updateArtist, deleteArtist,
    getSongs, addSong, updateSong, deleteSong, toggleSongLike,
    getStats, getChartData,
    getSubmissions, addSubmission, markSubmissionAsRead,
    getUsers, findUserByEmail, findUserById, registerUser, updateUser, deleteUser,
    getBandMembers, addBandMember, updateBandMember, deleteBandMember,
    getVideos, addVideo, deleteVideo, incrementVideoViewCount
};