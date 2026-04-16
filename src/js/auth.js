// Authentication and Role Management Logic
const authState = {
    isLoggedIn: false,
    user: null, // { uid, email, role: 'student' | 'admin' }
};

const ADMIN_PASSWORD = "admin2026"; // Simple password for admin entry

function initAuth() {
    console.log("Auth system initializing...");
    
    // Check if there's a saved session
    const savedUser = localStorage.getItem('mq_session');
    if (savedUser) {
        authState.user = JSON.parse(savedUser);
        authState.isLoggedIn = true;
        renderPanelByRole();
    } else {
        renderLandingPage();
    }
}

function renderLandingPage() {
    const app = document.getElementById('app');
    // Hide standard layout if it exists
    app.className = 'auth-page';
    app.innerHTML = `
        <div class="landing-container fade-in">
            <div class="hero">
                <div class="hero-content">
                    <span class="badge-landing">✨ 6-sinf matematikasi sarguzashti</span>
                    <h1>Math<span class="accent-text">Quest</span></h1>
                    <p>Matematika olamiga xush kelibsiz! Bilimlaringizni oshiring, XP to'plang va eng yaxshilar safiga qo'shiling.</p>
                    
                    <div class="hero-actions">
                        <button class="primary-btn lg" onclick="showAuthModal('student')">O'quvchi bo'lib kirish 🎒</button>
                        <button class="secondary-btn lg" onclick="showAdminPrompt()">O'qituvchi paneli 👨‍🏫</button>
                    </div>
                </div>
                <div class="hero-image">
                    <img src="https://img.freepik.com/free-vector/math-concept-illustration_114360-3914.jpg" alt="Math" />
                </div>
            </div>
        </div>

        <!-- Auth Modal -->
        <div id="auth-modal" class="modal">
            <div class="modal-content card">
                <span class="close-btn" onclick="closeModal()">&times;</span>
                <div id="modal-body">
                    <!-- Dynamic content -->
                </div>
            </div>
        </div>
    `;
}

function showAuthModal(type) {
    const modal = document.getElementById('auth-modal');
    const body = document.getElementById('modal-body');
    modal.style.display = 'flex';
    
    body.innerHTML = `
        <h2 id="modal-title">O'quvchi bo'lib kirish</h2>
        <div class="auth-tabs">
            <button class="tab-btn active" onclick="switchTab('login')">Kirish</button>
            <button class="tab-btn" onclick="switchTab('register')">Ro'yxatdan o'tish</button>
        </div>
        <div id="auth-form-container">
            <input type="email" id="auth-email" placeholder="Email" class="form-input">
            <input type="password" id="auth-password" placeholder="Parol" class="form-input">
            <button class="primary-btn w-full mt-1" onclick="handleAuth()">Tasdiqlash</button>
        </div>
    `;
}

function switchTab(tab) {
    const btns = document.querySelectorAll('.tab-btn');
    btns.forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    
    // In a real app we would change the action of handleAuth
    window.currentTab = tab;
}

async function handleAuth() {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    
    if (!email || !password) return alert("Barcha maydonlarni to'ldiring!");
    
    try {
        showGlobalLoader();
        // Simple mock for now, but ready for real Firebase Auth
        // For real Firebase: await firebase.auth().signInWithEmailAndPassword(email, password);
        
        const user = { uid: Date.now(), email, role: 'student' };
        login(user);
    } catch (e) {
        alert("Xatolik: " + e.message);
    } finally {
        hideGlobalLoader();
    }
}

function showAdminPrompt() {
    const password = prompt("Admin panelga kirish uchun parolni kiriting:");
    if (password === ADMIN_PASSWORD) {
        const user = { uid: 'admin', email: 'admin@mathquest.uz', role: 'admin' };
        login(user);
    } else if (password !== null) {
        alert("Noto'g'ri parol! ❌");
    }
}

function login(user) {
    authState.user = user;
    authState.isLoggedIn = true;
    localStorage.setItem('mq_session', JSON.stringify(user));
    renderPanelByRole();
}

function logout() {
    localStorage.removeItem('mq_session');
    window.location.reload();
}

function renderPanelByRole() {
    const app = document.getElementById('app');
    app.className = ''; // Remove auth-page class
    
    if (authState.user.role === 'admin') {
        initAdminPanel();
    } else {
        initStudentPanel();
    }
}

function closeModal() {
    document.getElementById('auth-modal').style.display = 'none';
}

// Helper functions
function showLoading() {
    let loader = document.getElementById('cloud-loader');
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'cloud-loader';
        loader.innerHTML = '<div class="spinner"></div><p>Sinxronlanmoqda...</p>';
        document.body.appendChild(loader);
    }
    loader.classList.add('active');
}

function hideLoading() {
    const loader = document.getElementById('cloud-loader');
    if (loader) loader.classList.remove('active');
}

window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.showGlobalLoader = showLoading;
window.hideGlobalLoader = hideLoading;

window.showAuthModal = showAuthModal;
window.closeModal = closeModal;
window.handleAuth = handleAuth;
window.showAdminPrompt = showAdminPrompt;
window.logout = logout;
window.switchTab = switchTab;

document.addEventListener('DOMContentLoaded', initAuth);
