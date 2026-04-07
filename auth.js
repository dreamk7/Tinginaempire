// FILE: auth.js (Final, Simplified Version)

function setupAuthentication() {
    const authHeaderSection = document.getElementById('auth-header-section');
    if (!authHeaderSection) return;

    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));

    const logout = () => {
        sessionStorage.removeItem('currentUser');
        window.location.href = './index.html';
    };

    if (currentUser && currentUser.username) {
        authHeaderSection.innerHTML = `
            <div class="user-profile-container">
                <div class="user-avatar" title="Logged in as ${currentUser.username}">${currentUser.username.charAt(0).toUpperCase()}</div>
                <div class="profile-dropdown">
                    <div class="dropdown-header">
                        <p class="username">${currentUser.username}</p>
                        <p class="email">${currentUser.email}</p>
                    </div>
                    <ul class="dropdown-links">
                        <li><a href="./profile.html"><i class="fas fa-user-circle"></i> My Profile</a></li>
                        <li><a href="./liked-songs.html"><i class="fas fa-heart"></i> Liked Songs</a></li>
                        <li><a href="#" id="logout-link" class="logout-link"><i class="fas fa-sign-out-alt"></i> Logout</a></li>
                    </ul>
                </div>
            </div>
        `;
        const logoutLink = document.getElementById('logout-link');
        if (logoutLink) {
            logoutLink.addEventListener('click', (e) => {
                e.preventDefault();
                logout();
            });
        }
    } else {
        authHeaderSection.innerHTML = `
            <a href="./login.html" class="user-profile-container" title="Login / Sign Up">
                <div class="user-avatar">
                    <i class="fas fa-user"></i>
                </div>
            </a>
        `;
    }
}

// Immediately call the setup function when the script is loaded.
// It needs to run after the DOM is parsed, so we wrap it.
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupAuthentication);
} else {
    setupAuthentication();
}