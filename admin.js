// FILE: admin.js (Final Version with Correct Artist Update Logic)

document.addEventListener('DOMContentLoaded', () => {
    // --- AUTHENTICATION CHECK ---
    const isAdminLoggedIn = sessionStorage.getItem('isAdminLoggedIn');
    const loginScreen = document.getElementById('admin-login-screen');
    const mainLayout = document.getElementById('admin-main-layout');

    if (!isAdminLoggedIn) {
        if (loginScreen) loginScreen.style.display = 'flex';
        if (mainLayout) mainLayout.style.display = 'none';

        const loginForm = document.getElementById('admin-login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                if (
                    document.getElementById('admin-user').value === 'admin@tingina.com' &&
                    document.getElementById('admin-pass').value === 'password'
                ) {
                    sessionStorage.setItem('isAdminLoggedIn', 'true');
                    window.location.reload();
                } else {
                    const loginError = document.getElementById('login-error');
                    if (loginError) {
                        loginError.textContent = 'Invalid credentials. Use main login page.';
                        loginError.style.display = 'block';
                    }
                }
            });
        }
        return;
    }

    if (loginScreen) loginScreen.style.display = 'none';
    if (mainLayout) mainLayout.style.display = 'flex';
    initializeApp();

    function initializeApp() {
        const API_URL = 'http://localhost:3000';

        const imageCropper = new ImageCropper('image-cropper-modal', 'image-to-crop', 'confirm-crop-btn');
        let croppedImageBlob = null;
        let activeCropperType = null;

        const api = {
            get: (endpoint) => fetch(`${API_URL}${endpoint}`).then(res => res.json()),
            delete: (endpoint) => fetch(`${API_URL}${endpoint}`, { method: 'DELETE' }),
            put: (endpoint, data) => fetch(`${API_URL}${endpoint}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(res => res.json()),
            putForm: (endpoint, formData) => fetch(`${API_URL}${endpoint}`, { method: 'PUT', body: formData }),
            post: (endpoint, data) => fetch(`${API_URL}${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(res => res.json()),
            postForm: (endpoint, formData) => fetch(`${API_URL}${endpoint}`, { method: 'POST', body: formData }),
        };

        const customAlert = {
            modal: document.getElementById('custom-alert-modal'),
            title: document.getElementById('custom-alert-title'),
            message: document.getElementById('custom-alert-message'),
            okBtn: document.getElementById('custom-alert-ok'),
            cancelBtn: document.getElementById('custom-alert-cancel'),
            show: function (title, message, okText = 'OK', cancelText = null) {
                return new Promise(resolve => {
                    this.title.textContent = title;
                    this.message.textContent = message;
                    this.okBtn.textContent = okText;
                    this.cancelBtn.style.display = cancelText ? 'inline-flex' : 'none';
                    if (cancelText) this.cancelBtn.textContent = cancelText;
                    this.modal.classList.add('visible');
                    this.okBtn.onclick = () => { this.modal.classList.remove('visible'); resolve(true); };
                    this.cancelBtn.onclick = () => { this.modal.classList.remove('visible'); resolve(false); };
                });
            }
        };

        const ui = {
            showSection: (sectionId) => {
                document.querySelectorAll('.admin-section').forEach(sec => sec.style.display = 'none');
                document.getElementById(`${sectionId}-section`).style.display = 'block';
                document.querySelectorAll('.admin-nav-link').forEach(link => {
                    link.classList.toggle('active', link.dataset.section === sectionId);
                });
            },
            renderArtistsTable: async (searchTerm = '') => {
                const artists = await api.get('/api/artists');
                const filtered = artists.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase()));
                const tbody = document.querySelector('#artists-section tbody');
                tbody.innerHTML = filtered.map(artist => `<tr><td><img src="${API_URL}${artist.image_url}" class="table-thumb"></td><td>${artist.name}</td><td>${artist.bio ? artist.bio.substring(0, 50) + '...' : 'N/A'}</td><td class="actions"><button class="admin-btn-icon edit" data-id="${artist.id}"><i class="fas fa-edit"></i></button><button class="admin-btn-icon delete" data-id="${artist.id}"><i class="fas fa-trash"></i></button></td></tr>`).join('') || `<tr><td colspan="4">No artists found.</td></tr>`;
                app.initScrollAnimations(tbody);
            },
            renderSongsTable: async (searchTerm = '') => {
                const [songs, artists] = await Promise.all([api.get('/api/songs'), api.get('/api/artists')]);
                const filtered = songs.filter(s => s.title.toLowerCase().includes(searchTerm.toLowerCase()));
                const tbody = document.querySelector('#songs-section tbody');
                tbody.innerHTML = filtered.map(song => {
                    const artist = artists.find(a => a.id == song.artist_id) || { name: 'Unknown' };
                    const duration = `${Math.floor(song.duration_seconds / 60)}:${(song.duration_seconds % 60).toString().padStart(2, '0')}`;
                    return `<tr><td><img src="${API_URL}${song.artwork_url}" class="table-thumb"></td><td>${song.title}</td><td>${artist.name}</td><td>${song.genre || 'N/A'}</td><td>${duration}</td><td class="actions"><button class="admin-btn-icon edit" data-id="${song.id}"><i class="fas fa-edit"></i></button><button class="admin-btn-icon delete" data-id="${song.id}"><i class="fas fa-trash"></i></button></td></tr>`;
                }).join('') || `<tr><td colspan="6">No songs found.</td></tr>`;
                app.initScrollAnimations(tbody);
            },
            renderUsersTable: async (searchTerm = '') => {
                const users = await api.get('/api/users');
                const filtered = users.filter(u => u.username.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase()));
                const tbody = document.querySelector('#users-section tbody');
                tbody.innerHTML = filtered.map(user => `<tr>
                    <td>${user.username} ${user.is_admin ? '<i class="fas fa-user-shield" title="Administrator"></i>' : ''}</td>
                    <td>${user.email}</td>
                    <td>Hashed</td>
                    <td class="actions">
                        <button class="admin-btn-icon edit" data-id="${user.id}"><i class="fas fa-edit"></i></button>
                        <button class="admin-btn-icon delete" data-id="${user.id}" data-username="${user.username}"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>`).join('') || `<tr><td colspan="4">No users found.</td></tr>`;
                app.initScrollAnimations(tbody);
            },
            renderBandMembersTable: async () => {
                const members = await api.get('/api/band-members');
                const tbody = document.querySelector('#band-members-section tbody');
                tbody.innerHTML = members.map(member => `<tr><td><img src="${API_URL}${member.image_url}" class="table-thumb"></td><td>${member.name}</td><td>${member.role}</td><td class="actions"><button class="admin-btn-icon edit" data-id="${member.id}"><i class="fas fa-edit"></i></button><button class="admin-btn-icon delete" data-id="${member.id}"><i class="fas fa-trash"></i></button></td></tr>`).join('') || `<tr><td colspan="4">No band members found.</td></tr>`;
                app.initScrollAnimations(tbody);
            },
            renderVideosTable: async () => {
                const videos = await api.get('/api/videos');
                const tbody = document.querySelector('#videos-section tbody');
                tbody.innerHTML = videos.map(video => {
                    const duration = video.duration_seconds ? `${Math.floor(video.duration_seconds / 60)}:${(video.duration_seconds % 60).toString().padStart(2, '0')}` : 'N/A';
                    return `<tr><td>${video.title}</td><td>${video.youtube_url || video.video_url}</td><td>${duration}</td><td>${video.view_count || 0}</td><td>${video.featured_on_band_page}</td><td class="actions"><button class="admin-btn-icon delete" data-id="${video.id}"><i class="fas fa-trash"></i></button></td></tr>`;
                }).join('') || `<tr><td colspan="6">No videos found.</td></tr>`;
                app.initScrollAnimations(tbody);
            },
            renderSubmissionsTable: async () => {
                const submissions = await api.get('/api/submissions');
                const tbody = document.querySelector('#submissions-section tbody');
                tbody.innerHTML = submissions.map(sub => {
                    const detailsHtml = Object.entries(sub.details).map(([key, value]) => `<strong>${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</strong> ${value}`).join('<br>');
                    return `<tr class="${!sub.is_read ? 'unread' : ''}"><td>${new Date(sub.created_at).toLocaleString()}</td><td>${sub.form_type}</td><td>${sub.name}</td><td><a href="mailto:${sub.email}">${sub.email}</a></td><td>${detailsHtml}</td><td><button class="admin-btn-secondary mark-as-read" data-id="${sub.id}" ${sub.is_read ? 'disabled' : ''}>${sub.is_read ? 'Read' : 'Mark as Read'}</button></td></tr>`;
                }).join('') || `<tr><td colspan="6">No submissions yet.</td></tr>`;
                app.initScrollAnimations(tbody);
            },
            updateDashboard: async () => {
                const stats = await api.get('/api/stats');
                document.querySelector('#dashboard-section .stats-grid').innerHTML = `
                    <div class="stat-card"><i class="fas fa-music"></i><div><span class="stat-value">${stats.song_count}</span><span class="stat-label">Total Songs</span></div></div>
                    <div class="stat-card"><i class="fas fa-user-tie"></i><div><span class="stat-value">${stats.artist_count}</span><span class="stat-label">Total Artists</span></div></div>
                    <div class="stat-card"><i class="fas fa-play-circle"></i><div><span class="stat-value">${(stats.total_plays || 0).toLocaleString()}</span><span class="stat-label">Total Plays</span></div></div>
                    <div class="stat-card"><i class="fas fa-users"></i><div><span class="stat-value">${stats.user_count}</span><span class="stat-label">Registered Users</span></div></div>`;
                const submissionsBadge = document.getElementById('submissions-badge');
                if (submissionsBadge) {
                    submissionsBadge.textContent = stats.unread_submissions > 0 ? stats.unread_submissions : '';
                    submissionsBadge.style.display = stats.unread_submissions > 0 ? 'inline-block' : 'none';
                }
                ui.renderCharts();
            },
            renderCharts: async () => {
                const chartData = await api.get('/api/stats/chart-data');
                const pieCtx = document.getElementById('playsByArtistChart').getContext('2d');
                new Chart(pieCtx, {
                    type: 'pie',
                    data: {
                        labels: chartData.playsByArtist.map(item => item.name),
                        datasets: [{
                            label: 'Plays',
                            data: chartData.playsByArtist.map(item => item.total_plays),
                            backgroundColor: ['#FFD700', '#FFC300', '#FFBF00', '#F9A602', '#E1A200'],
                            borderColor: '#222',
                            borderWidth: 3
                        }]
                    },
                    options: { plugins: { legend: { position: 'right' } } }
                });
                const lineCtx = document.getElementById('registrationsChart').getContext('2d');
                new Chart(lineCtx, {
                    type: 'line',
                    data: {
                        labels: chartData.registrations.map(item => new Date(item.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
                        datasets: [{
                            label: 'New Users',
                            data: chartData.registrations.map(item => item.count),
                            borderColor: 'rgba(255, 215, 0, 1)',
                            backgroundColor: 'rgba(255, 215, 0, 0.2)',
                            fill: true,
                            tension: 0.3
                        }]
                    },
                    options: { scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
                });
            },
            openModal: async (modalId, data = null) => {
                const modal = document.getElementById(modalId);
                modal.querySelector('form')?.reset();

                if (modalId === 'artist-modal') {
                    document.getElementById('artist-modal-title').textContent = data ? 'Edit Artist' : 'Add New Artist';
                    document.getElementById('artist-image-file').required = !data;
                    document.getElementById('artist-id').value = data ? data.id : '';
                    document.getElementById('artist-name').value = data ? data.name : '';
                    document.getElementById('artist-bio').value = data ? data.bio : '';
                    document.getElementById('artist-twitter').value = data ? data.twitter_url : '';
                    document.getElementById('artist-instagram').value = data ? data.instagram_url : '';
                    document.getElementById('artist-facebook').value = data ? data.facebook_url : '';
                }
                if (modalId === 'song-modal') {
                    document.getElementById('song-modal-title').textContent = data ? 'Edit Song' : 'Add New Song';
                    document.getElementById('song-artwork-file').required = !data;
                    document.getElementById('song-audio-file').required = !data;
                    document.getElementById('artwork-upload-group').style.display = data ? 'none' : 'block';
                    document.getElementById('audio-upload-group').style.display = data ? 'none' : 'block';
                    const artists = await api.get('/api/artists');
                    document.getElementById('song-artist').innerHTML = artists.map(a => `<option value="${a.id}">${a.name}</option>`).join('');
                    if (data) {
                        document.getElementById('song-id').value = data.id;
                        document.getElementById('song-title').value = data.title;
                        document.getElementById('song-artist').value = data.artist_id;
                        document.getElementById('song-genre').value = data.genre || '';
                        document.getElementById('song-video-url').value = data.video_url || '';
                    } else {
                        document.getElementById('song-id').value = '';
                    }
                }
                if (modalId === 'user-modal' && data) {
                    const form = document.getElementById('user-form');
                    form.querySelector('#user-id').value = data.id;
                    form.querySelector('#user-username').value = data.username;
                    form.querySelector('#user-email').value = data.email;
                    form.querySelector('#user-password').value = '';
                    const isAdminCheckbox = form.querySelector('#user-is-admin');
                    isAdminCheckbox.checked = data.is_admin;
                    isAdminCheckbox.dataset.initialAdminState = data.is_admin; // Store initial state
                    document.getElementById('demotion-password-group').style.display = 'none';
                }
                document.getElementById(modalId).classList.add('visible');
            },
            showUserDetails: async (userId) => {
                const modal = document.getElementById('user-details-modal');
                const content = document.getElementById('user-details-content');
                content.innerHTML = '<div class="loader-container"><div class="loader"></div></div>';
                modal.classList.add('visible');

                const details = await api.get(`/api/users/${userId}/details`);
                const userInitial = details.username.charAt(0).toUpperCase();

                content.innerHTML = `
                    <div class="user-details-header">
                        <div class="user-details-avatar">${userInitial}</div>
                        <div>
                            <h3>${details.username}</h3>
                            <p>${details.email}</p>
                        </div>
                    </div>
                    <div class="user-details-body">
                        <h4>Activity Summary</h4>
                        <ul>
                            <li><strong>Downloads:</strong> ${details.downloadCount}</li>
                            <li><strong>Liked Songs:</strong> ${details.likedSongs.length}</li>
                            <li><strong>Joined On:</strong> ${new Date(details.created_at).toLocaleString()}</li>
                        </ul>
                    </div>`;
            }
        };

        const app = {
            init: () => {
                document.getElementById('admin-logout-btn').addEventListener('click', () => { sessionStorage.removeItem('isAdminLoggedIn'); window.location.href = './login.html'; });
                document.querySelectorAll('.admin-nav-link[data-section]').forEach(link => link.addEventListener('click', (e) => ui.showSection(e.currentTarget.dataset.section)));
                document.querySelectorAll('.modal-close-btn').forEach(btn => btn.addEventListener('click', () => btn.closest('.modal-bg').classList.remove('visible')));                
                document.getElementById('add-artist-btn').addEventListener('click', () => ui.openModal('artist-modal'));
                document.getElementById('add-song-btn').addEventListener('click', () => ui.openModal('song-modal'));
                document.getElementById('add-band-member-btn').addEventListener('click', () => ui.openModal('band-member-modal'));
                document.getElementById('add-video-btn').addEventListener('click', () => ui.openModal('video-modal'));

                document.getElementById('artist-form').addEventListener('submit', app.handleArtistFormSubmit);
                document.getElementById('song-form').addEventListener('submit', app.handleSongFormSubmit);
                document.getElementById('user-form').addEventListener('submit', app.handleUserFormSubmit);
                document.getElementById('band-member-form').addEventListener('submit', app.handleBandMemberFormSubmit);
                document.getElementById('video-form').addEventListener('submit', app.handleVideoFormSubmit);

                document.getElementById('artist-image-file').addEventListener('change', (e) => app.handleImageFileSelect(e, 'artist'));
                document.getElementById('song-artwork-file').addEventListener('change', (e) => app.handleImageFileSelect(e, 'song'));

                document.getElementById('artist-search').addEventListener('input', e => ui.renderArtistsTable(e.target.value));
                document.getElementById('song-search').addEventListener('input', e => ui.renderSongsTable(e.target.value));
                document.getElementById('user-search').addEventListener('input', e => ui.renderUsersTable(e.target.value));

                document.getElementById('artists-section').addEventListener('click', app.handleArtistTableClick);
                document.getElementById('songs-section').addEventListener('click', app.handleSongTableClick);
                document.getElementById('users-section').addEventListener('click', app.handleUserTableClick);
                document.getElementById('band-members-section').addEventListener('click', app.handleBandMemberTableClick);
                document.getElementById('videos-section').addEventListener('click', app.handleVideoTableClick);
                document.getElementById('submissions-section').addEventListener('click', app.handleSubmissionsTableClick);

                document.getElementById('user-form').addEventListener('submit', app.handleUserFormSubmit);
                document.getElementById('user-is-admin').addEventListener('change', app.handleAdminCheckboxChange);

                // CRITICAL FIX: Refresh all data on initial load
                app.refreshAllData();
            },

            initScrollAnimations: (tbodyElement) => {
                if (!tbodyElement) return;
                const rows = tbodyElement.querySelectorAll('tr');
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach((entry, index) => {
                        if (entry.isIntersecting) {
                            entry.target.style.animationDelay = `${index * 50}ms`;
                            entry.target.classList.add('in-view');
                            observer.unobserve(entry.target);
                        }
                    });
                }, { threshold: 0.1 });
                rows.forEach(row => { row.classList.remove('in-view'); observer.observe(row); });
            },

            handleImageFileSelect: async (event, type) => {
                if (event.target.files && event.target.files[0]) {
                    activeCropperType = type;
                    const blob = await imageCropper.open(event.target.files[0]);
                    if (blob) {
                        croppedImageBlob = blob;
                        customAlert.show('Success', `Image cropped and ready for ${type}.`);
                    } else {
                        croppedImageBlob = null;
                    }
                }
            },

            handleArtistFormSubmit: async (e) => {
                e.preventDefault();
                const form = e.target;
                const id = form.querySelector('#artist-id').value;
                const formData = new FormData(form); // Use FormData to handle both text and files

                // If a new image was cropped for this form type, append it to the data.
                if (croppedImageBlob && activeCropperType === 'artist') {
                    formData.append('image', croppedImageBlob, 'artist-image.png');
                }
                
                try {
                    let response;
                    if (id) { // This is an UPDATE
                        response = await fetch(`${API_URL}/api/artists/${id}`, {
                            method: 'PUT',
                            body: formData // Send as FormData, not JSON
                        });
                    } else { // This is a NEW artist
                        response = await fetch(`${API_URL}/api/artists`, {
                            method: 'POST',
                            body: formData
                        });
                    }

                    if (!response.ok) {
                        const errData = await response.json();
                        throw new Error(errData.error || 'A server error occurred.');
                    }
                    
                    form.closest('.modal-bg').classList.remove('visible');
                    croppedImageBlob = null;
                    activeCropperType = null;
                    app.refreshAllData();
                    customAlert.show('Success', 'Artist saved successfully!');
                } catch (error) {
                    await customAlert.show('Error', `Failed to save artist: ${error.message}`);
                }
            },

            handleSongFormSubmit: async (e) => {
                e.preventDefault();
                const form = e.target;
                const id = form.querySelector('#song-id').value;
                const formData = new FormData(form);

                if (croppedImageBlob && activeCropperType === 'song') {
                    formData.set('artwork', croppedImageBlob, 'artwork.png');
                }

                try {
                    let response;
                    if (id) {
                        response = await fetch(`${API_URL}/api/songs/${id}`, { method: 'PUT', body: formData });
                    } else {
                        response = await fetch(`${API_URL}/api/songs`, { method: 'POST', body: formData });
                    }
                    if (!response.ok) {
                        const err = await response.json(); throw new Error(err.error);
                    }
                    form.closest('.modal-bg').classList.remove('visible');
                    croppedImageBlob = null; activeCropperType = null;
                    app.refreshAllData();
                } catch (error) { await customAlert.show('Error', `Failed to save song: ${error.message || 'Check server connection'}`); }
            },

            handleUserFormSubmit: async (e) => {
                e.preventDefault();
                const form = e.target;
                const id = form.querySelector('#user-id').value;
                const isAdmin = form.querySelector('#user-is-admin').checked;
                const initialAdminState = form.querySelector('#user-is-admin').dataset.initialAdminState === 'true';

                // Check for demotion confirmation
                if (initialAdminState && !isAdmin) {
                    const userPassword = form.querySelector('#user-demotion-password').value;
                    if (!userPassword) {
                        return await customAlert.show('Action Required', "To remove admin rights, you must enter the user's current password for confirmation.", "OK");
                    }
                    // In a real scenario, we'd verify this password on the backend. Here, we mock it.
                    // This logic would need a new endpoint in a live app.
                    console.log("Mock verification for demotion with password:", userPassword);
                }

                const data = {
                    username: form.querySelector('#user-username').value,
                    email: form.querySelector('#user-email').value,
                    newPassword: form.querySelector('#user-password').value || null,
                    isAdmin: isAdmin
                };
                
                try {
                    await api.put(`/api/users/${id}`, data);
                    form.closest('.modal-bg').classList.remove('visible');
                    app.refreshAllData();
                    showToast('User updated successfully!', 'fa-check-circle');
                } catch (error) { await customAlert.show('Error', `Failed to save user: ${error.message}`); }
            },

            handleUserTableClick: async (e) => {
                const editBtn = e.target.closest('.edit');
                const deleteBtn = e.target.closest('.delete');
                if (editBtn) {
                    const users = await api.get('/api/users');
                    const user = users.find(u => u.id == editBtn.dataset.id);
                    // Fetch full user details to check admin status
                    const fullUser = await api.get(`/api/users/${user.id}/details`);
                    ui.openModal('user-modal', fullUser);
                }
                if (deleteBtn) {
                    const username = deleteBtn.dataset.username;
                    const password = prompt(`To delete the user "${username}", please enter YOUR admin password:`);
                    if (password) {
                        try {
                            const adminEmail = 'admin@tingina.com'; // This should be dynamic in a real app
                            const verification = await api.post('/api/auth/verify-admin', { adminEmail, password });
                            if (verification.success) {
                                await api.delete(`/api/users/${deleteBtn.dataset.id}`);
                                showToast('User deleted successfully.', 'fa-check-circle');
                                app.refreshAllData();
                            }
                        } catch (error) { await customAlert.show('Error', 'Incorrect admin password or server error.'); }
                    }
                }
            },

            handleAdminCheckboxChange: (e) => {
                const isChecked = e.target.checked;
                const wasAdmin = e.target.dataset.initialAdminState === 'true';
                const passwordGroup = document.getElementById('demotion-password-group');
                // Show password field only if demoting an existing admin
                passwordGroup.style.display = (wasAdmin && !isChecked) ? 'block' : 'none';
            },

            handleBandMemberFormSubmit: async (e) => {
                e.preventDefault();
                try {
                    await api.postForm('/api/band-members', new FormData(e.target));
                    e.target.closest('.modal-bg').classList.remove('visible');
                    app.refreshAllData();
                } catch (error) {
                    await customAlert.show('Error', `Failed to save band member: ${error.message}`);
                }
            },

            handleVideoFormSubmit: async (e) => {
                e.preventDefault();
                try {
                    const formData = new FormData(e.target);
                    await api.postForm('/api/videos', formData);
                    e.target.closest('.modal-bg').classList.remove('visible');
                    app.refreshAllData();
                } catch (error) {
                    await customAlert.show('Error', `Failed to save video: ${error.message}`);
                }
            },

            handleArtistTableClick: async (e) => {
                const editBtn = e.target.closest('.edit');
                const deleteBtn = e.target.closest('.delete');
                if (editBtn) {
                    const artists = await api.get('/api/artists');
                    const artist = artists.find(a => a.id == editBtn.dataset.id);
                    ui.openModal('artist-modal', artist);
                }
                if (deleteBtn) {
                    if (await customAlert.show('Confirm Deletion', 'Delete this artist and ALL their songs? This is irreversible.', 'Delete', 'Cancel')) {
                        await api.delete(`/api/artists/${deleteBtn.dataset.id}`);
                        app.refreshAllData();
                    }
                }
            },
            handleSongTableClick: async (e) => {
                const editBtn = e.target.closest('.edit');
                const deleteBtn = e.target.closest('.delete');
                if (editBtn) {
                    const songs = await api.get('/api/songs');
                    const song = songs.find(s => s.id == editBtn.dataset.id);
                    ui.openModal('song-modal', song);
                }
                if (deleteBtn) {
                    if (await customAlert.show('Confirm Deletion', 'Are you sure you want to delete this song?', 'Delete', 'Cancel')) {
                        await api.delete(`/api/songs/${deleteBtn.dataset.id}`);
                        app.refreshAllData();
                    }
                }
            },
            handleBandMemberTableClick: async (e) => {
                const deleteBtn = e.target.closest('.delete');
                if (deleteBtn) {
                    if (await customAlert.show('Confirm Deletion', 'Are you sure you want to delete this band member?', 'Delete', 'Cancel')) {
                        await api.delete(`/api/band-members/${deleteBtn.dataset.id}`);
                        app.refreshAllData();
                    }
                }
            },
            handleVideoTableClick: async (e) => {
                const deleteBtn = e.target.closest('.delete');
                if (deleteBtn) {
                    if (await customAlert.show('Confirm Deletion', 'Are you sure you want to delete this video?', 'Delete', 'Cancel')) {
                        await api.delete(`/api/videos/${deleteBtn.dataset.id}`);
                        app.refreshAllData();
                    }
                }
            },
            handleSubmissionsTableClick: async (e) => {
                const markReadBtn = e.target.closest('.mark-as-read');
                if (markReadBtn && !markReadBtn.disabled) {
                    markReadBtn.disabled = true; markReadBtn.textContent = 'Read';
                    await api.post(`/api/submissions/${markReadBtn.dataset.id}/read`, {});
                    app.refreshAllData();
                }
            },
            refreshAllData: () => {
                ui.updateDashboard();
                ui.renderArtistsTable();
                ui.renderSongsTable();
                ui.renderUsersTable();
                ui.renderSubmissionsTable();
                ui.renderBandMembersTable();
                ui.renderVideosTable();
            },
        };
        app.init();
    }
});