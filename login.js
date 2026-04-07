// FILE: login.js (Final Version Connected to Backend)

document.addEventListener('DOMContentLoaded', function () {
    const API_URL = 'http://localhost:3000';

    const showLoginBtn = document.getElementById('show-login-btn');
    const showSignupBtn = document.getElementById('show-signup-btn');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    
    const loginFeedback = document.getElementById('login-feedback');
    const signupFeedback = document.getElementById('signup-feedback');

    // --- Form Toggle Logic ---
    showLoginBtn.addEventListener('click', () => {
        loginForm.style.display = 'block';
        signupForm.style.display = 'none';
        showLoginBtn.classList.add('active');
        showSignupBtn.classList.remove('active');
    });

    showSignupBtn.addEventListener('click', () => {
        loginForm.style.display = 'none';
        signupForm.style.display = 'block';
        showLoginBtn.classList.remove('active');
        showSignupBtn.classList.add('active');
    });

    // --- Form Submission Logic ---
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        loginFeedback.style.display = 'none';

        const data = {
            email: document.getElementById('login-email').value,
            password: document.getElementById('login-password').value,
        };

        try {
            const response = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error);
            }

            loginFeedback.textContent = 'Login successful! Redirecting...';
            loginFeedback.style.color = 'var(--green)';
            loginFeedback.style.display = 'block';
            
            // Check if the user is an admin
            if (result.is_admin) {
                sessionStorage.setItem('isAdminLoggedIn', 'true');
                setTimeout(() => {
                    window.location.href = './admin_dashboard.html';
                }, 1000);
            } else {
                sessionStorage.setItem('currentUser', JSON.stringify(result));
                setTimeout(() => {
                    window.location.href = './music.html';
                }, 1000);
            }

        } catch (error) {
            loginFeedback.textContent = error.message;
            loginFeedback.style.color = 'var(--red)';
            loginFeedback.style.display = 'block';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Sign In';
        }
    });

    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        signupFeedback.style.display = 'none';

        const data = {
            username: document.getElementById('signup-username').value,
            email: document.getElementById('signup-email').value,
            password: document.getElementById('signup-password').value,
        };

        try {
            const response = await fetch(`${API_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error);
            }

            signupFeedback.textContent = 'Account created! Please sign in.';
            signupFeedback.style.color = 'var(--green)';
            signupFeedback.style.display = 'block';

            setTimeout(() => {
                showLoginBtn.click();
                signupFeedback.style.display = 'none';
                document.getElementById('login-email').value = data.email; // Pre-fill email
            }, 2000);

        } catch (error) {
            signupFeedback.textContent = error.message;
            signupFeedback.style.color = 'var(--red)';
            signupFeedback.style.display = 'block';
        }
    });
});