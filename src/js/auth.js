// Authentication and Role Management Logic
const authState = {
    isLoggedIn: false,
    user: null, // { uid, email, role: 'student' | 'admin', name }
};

// Restore theme before first render (prevents flash)
(function() {
    const saved = localStorage.getItem('mq_theme');
    if (saved === 'dark-theme') document.body.classList.add('dark-theme');
})();

// Show full-screen skeleton while checking session
function showInitLoader() {
    document.getElementById('app').innerHTML = `
        <div style="flex:1; display:flex; align-items:center; justify-content:center; flex-direction:column; gap:1rem; min-height:100vh; width:100%;">
            <div class="spinner" style="width:48px; height:48px; border-width:4px;"></div>
            <p style="color:var(--text-muted); font-size:1rem; font-weight:600;">Yuklanmoqda...</p>
        </div>`;
}

async function initAuth() {
    showInitLoader();

    supabaseClient.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_OUT') {
            window.location.reload();
        }
    });

    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        await _loadUserProfile(session.user);
    } else {
        renderLandingPage();
    }
}

async function _loadUserProfile(supabaseUser) {
    try {
        const { data: profile } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', supabaseUser.id)
            .single();

        authState.user = {
            uid: supabaseUser.id,
            email: supabaseUser.email,
            role: profile?.role || 'student',
            name: profile?.name || supabaseUser.email.split('@')[0]
        };
        authState.isLoggedIn = true;
        renderPanelByRole();
    } catch (e) {
        console.error("Profile load error:", e);
        renderLandingPage();
    }
}

function renderLandingPage() {
    const app = document.getElementById('app');
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
                        <button class="secondary-btn lg" onclick="showAuthModal('admin')">O'qituvchi paneli 👨‍🏫</button>
                    </div>
                </div>
                <div class="hero-image">
                    <img src="https://img.freepik.com/free-vector/math-concept-illustration_114360-3914.jpg" alt="Math" />
                </div>
            </div>
        </div>

        <div id="auth-modal" class="modal">
            <div class="modal-content card">
                <span class="close-btn" onclick="closeModal()">&times;</span>
                <div id="modal-body"></div>
            </div>
        </div>
    `;
}

function showAuthModal(type) {
    const modal = document.getElementById('auth-modal');
    const body = document.getElementById('modal-body');
    modal.style.display = 'flex';
    window.currentTab = 'login';
    window.loginAs = type;

    const isAdmin = type === 'admin';
    body.innerHTML = `
        <h2>${isAdmin ? "O'qituvchi kirishi 👨‍🏫" : "O'quvchi kirishi 🎒"}</h2>
        <div class="auth-tabs">
            <button class="tab-btn active" onclick="switchTab('login')">Kirish</button>
            ${!isAdmin ? `<button class="tab-btn" onclick="switchTab('register')">Ro'yxatdan o'tish</button>` : ''}
        </div>
        <div id="auth-form-container" style="margin-top:1rem;">
            <input type="email" id="auth-email" placeholder="Email" class="form-input" autocomplete="email" onkeydown="if(event.key==='Enter')handleAuth()">
            <input type="password" id="auth-password" placeholder="Parol" class="form-input" style="margin-top:0.8rem;" autocomplete="current-password" onkeydown="if(event.key==='Enter')handleAuth()">
            <p id="auth-error" style="color:var(--danger); font-size:0.85rem; margin-top:0.5rem; display:none;"></p>
            <button class="primary-btn w-full mt-1" id="auth-submit-btn" onclick="handleAuth()">Kirish</button>
        </div>
    `;

    // Focus email field
    setTimeout(() => document.getElementById('auth-email')?.focus(), 100);
}

// Kept for backwards compatibility
function showAdminPrompt() {
    showAuthModal('admin');
}

function switchTab(tab) {
    const btns = document.querySelectorAll('.tab-btn');
    btns.forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    window.currentTab = tab;

    const btn = document.getElementById('auth-submit-btn');
    if (btn) btn.textContent = tab === 'register' ? "Ro'yxatdan o'tish" : "Kirish";

    const err = document.getElementById('auth-error');
    if (err) { err.style.display = 'none'; err.textContent = ''; }
}

function _showAuthError(msg) {
    const err = document.getElementById('auth-error');
    if (err) { err.textContent = msg; err.style.display = 'block'; }
    else alert(msg);
}

async function handleAuth() {
    const email = document.getElementById('auth-email')?.value?.trim();
    const password = document.getElementById('auth-password')?.value;

    if (!email || !password) return _showAuthError("Barcha maydonlarni to'ldiring!");

    const btn = document.getElementById('auth-submit-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Yuklanmoqda...'; }

    try {
        let authResult;
        if (window.currentTab === 'register') {
            authResult = await supabaseClient.auth.signUp({ email, password });
            if (authResult.error) throw authResult.error;

            if (authResult.data.user && !authResult.data.session) {
                closeModal();
                alert("Ro'yxatdan o'tdingiz! ✅\nEmail manzilingizni tasdiqlang, so'ng kiring.");
                return;
            }
            // Create profile if trigger hasn't fired yet
            if (authResult.data.user) {
                await supabaseClient.from('profiles').upsert({
                    id: authResult.data.user.id,
                    name: email.split('@')[0],
                    role: 'student'
                });
            }
        } else {
            authResult = await supabaseClient.auth.signInWithPassword({ email, password });
            if (authResult.error) throw authResult.error;
        }

        const user = authResult.data.user;
        if (!user) return;

        const { data: profile } = await supabaseClient
            .from('profiles').select('*').eq('id', user.id).single();

        if (window.loginAs === 'admin' && profile?.role !== 'admin') {
            await supabaseClient.auth.signOut();
            throw new Error("Bu hisob admin emas! O'qituvchi hisob bilan kiring.");
        }

        authState.user = {
            uid: user.id,
            email: user.email,
            role: profile?.role || 'student',
            name: profile?.name || email.split('@')[0]
        };
        authState.isLoggedIn = true;
        closeModal();
        renderPanelByRole();
    } catch (e) {
        const msg = e.message === 'Invalid login credentials'
            ? "Email yoki parol noto'g'ri!"
            : e.message || "Noma'lum xatolik yuz berdi.";
        _showAuthError(msg);
        if (btn) { btn.disabled = false; btn.textContent = window.currentTab === 'register' ? "Ro'yxatdan o'tish" : "Kirish"; }
    }
}

async function logout() {
    await supabaseClient.auth.signOut();
    window.location.reload();
}

function renderPanelByRole() {
    const app = document.getElementById('app');
    app.className = '';
    if (authState.user.role === 'admin') {
        initAdminPanel();
    } else {
        initStudentPanel();
    }
}

function closeModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.style.display = 'none';
}

// Global loading helpers
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
window.showAdminPrompt = showAdminPrompt;
window.closeModal = closeModal;
window.handleAuth = handleAuth;
window.logout = logout;
window.switchTab = switchTab;

document.addEventListener('DOMContentLoaded', initAuth);
