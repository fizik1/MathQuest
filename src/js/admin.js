(function() {

const state = {
    user: { name: 'Admin', id: 'admin' },
    currentPage: 'dashboard',
    xp: 0,
    level: 1,
    streak: 0,
    progress: {},
    unlockedTopics: [],
    topics: [],
    materials: {}
};

const routes = {
    dashboard: renderDashboard,
    topics: renderTopics,
    videos: renderVideos,
    mustahkamlash: renderMustahkamlash,
    leaderboard: renderLeaderboard,
    profile: renderProfile,
    quiz: renderQuiz
};

let currentQuizState = {
    topic: null,
    currentQuestionIndex: 0,
    score: 0,
    answers: []
};

// ─── Init ──────────────────────────────────────────────────────────────────

async function initAdminPanel() {
    try {
        // Sync user info from auth
        if (authState.user) {
            state.user.name = authState.user.name || 'Admin';
            state.user.id   = authState.user.uid;
        }

        window.appNavigate         = navigate;
        window.startQuiz           = (id) => navigate('quiz', id);
        window.submitAnswer        = submitAnswer;
        window.rewardVideo         = rewardVideo;
        window.triggerUpload       = triggerUpload;
        window.openEditTopic       = openEditTopic;
        window.saveTopicEdit       = saveTopicEdit;
        window.removeMaterial      = removeMaterial;
        window.addQuestion         = addQuestion;
        window.toggleQuizOptions   = toggleQuizOptions;
        window.renderCurrentQuestion  = renderCurrentQuestion;
        window.openEditQuestion       = openEditQuestion;
        window.saveQuestionEdit       = saveQuestionEdit;
        window.removeQuestion         = removeQuestion;
        window.toggleEditQuizOptions  = toggleEditQuizOptions;
        window.openEditVideo          = openEditVideo;
        window.saveVideoEdit          = saveVideoEdit;

        renderAdminLayout();
        showLoading();
        await loadData();
        setupNavigation();
        setupThemeToggle();
        updateHeaderStats();
        hideLoading();
        navigate('dashboard');
    } catch (e) {
        console.error("Admin init error:", e);
        hideLoading();
        navigate('dashboard');
    }
}
window.initAdminPanel = initAdminPanel;

// ─── Data ──────────────────────────────────────────────────────────────────

async function loadData() {
    try {
        const { data, error } = await supabaseClient
            .from('topics')
            .select('*')
            .order('sort_order', { ascending: true });

        if (error) throw error;

        state.topics    = (data || []).map(t => ({
            id:      t.id,
            title:   t.title,
            icon:    t.icon    || '📚',
            theory:  t.theory  || '',
            quizzes: t.quizzes || [],
            videos:  t.videos  || []
        }));
        state.materials = {};
        (data || []).forEach(t => { state.materials[t.id] = t.materials || []; });
        state.unlockedTopics = state.topics.map(t => t.id);

        // Local cache for offline
        _cacheLocally();
    } catch (e) {
        console.warn("Supabase load failed, using local cache:", e);
        const cached = localStorage.getItem('mq_admin_v2');
        if (cached) {
            const d = JSON.parse(cached);
            state.topics         = d.topics         || [];
            state.materials      = d.materials      || {};
            state.unlockedTopics = d.unlockedTopics || state.topics.map(t => t.id);
        }
    }
}

async function saveData() {
    _cacheLocally();
    try {
        if (state.topics.length === 0) { updateSyncTime(); return; }

        const rows = state.topics.map((t, idx) => ({
            id:         t.id,
            title:      t.title,
            icon:       t.icon    || '📚',
            theory:     t.theory  || '',
            quizzes:    t.quizzes || [],
            videos:     t.videos  || [],
            materials:  state.materials[t.id] || [],
            sort_order: idx,
            updated_at: new Date().toISOString()
        }));

        const { error } = await supabaseClient.from('topics').upsert(rows);
        if (error) throw error;
        updateSyncTime();
    } catch (e) {
        console.error("Cloud save error:", e);
        updateSyncTime('⚠️ Faqat mahalliy saqlandi');
    }
}

function _cacheLocally() {
    localStorage.setItem('mq_admin_v2', JSON.stringify({
        topics:         state.topics,
        materials:      state.materials,
        unlockedTopics: state.unlockedTopics
    }));
}

// Kept for backward compat (called from many places)
const saveLocalData = saveData;

// ─── Layout ────────────────────────────────────────────────────────────────

function renderAdminLayout() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <nav class="sidebar">
            <div class="logo">
                <span class="logo-icon">📐</span>
                <span class="logo-text">MQ Admin <span style="font-size:0.7rem; background:var(--secondary); color:white; padding:2px 6px; border-radius:10px;">V2</span></span>
            </div>
            <ul class="nav-links">
                <li class="active" data-page="dashboard"><span class="icon">🏠</span> <span>Asosiy</span></li>
                <li data-page="topics"><span class="icon">📚</span> <span>Mavzular</span></li>
                <li data-page="videos"><span class="icon">🎥</span> <span>Videolar</span></li>
                <li data-page="mustahkamlash"><span class="icon">🧱</span> <span>Mustahkamlash</span></li>
                <li data-page="leaderboard"><span class="icon">🏆</span> <span>Reyting</span></li>
                <li data-page="profile"><span class="icon">👤</span> <span>Profil</span></li>
                <li onclick="window.logout()" style="color:var(--danger); margin-top:2rem;"><span class="icon">🚪</span> <span>Chiqish</span></li>
            </ul>
            <div class="theme-toggle" id="theme-toggle">
                <span class="icon">🌙</span>
            </div>
        </nav>
        <main class="content">
            <header class="top-bar">
                <div class="mobile-menu-btn" id="mobile-menu-btn">☰</div>
                <div class="user-profile-summary">
                    <span id="header-username">${state.user.name}</span>
                    <div class="header-avatar">👤</div>
                </div>
            </header>
            <div id="view-container"></div>
        </main>
    `;
}

// ─── Navigation & helpers ─────────────────────────────────────────────────

function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-links li[data-page]');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const page = item.getAttribute('data-page');
            if (!page) return;
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            navigate(page);
        });
    });
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const sidebar   = document.querySelector('.sidebar');
    if (mobileBtn) mobileBtn.addEventListener('click', () => sidebar.classList.toggle('active'));
}

function navigate(page, params = null) {
    if (routes[page]) {
        state.currentPage = page;
        routes[page](params);
        document.querySelector('.sidebar')?.classList.remove('active');
        window.scrollTo(0, 0);
    }
}

function setupThemeToggle() {
    const toggle = document.getElementById('theme-toggle');
    if (!toggle) return;

    // Restore saved theme
    const saved = localStorage.getItem('mq_theme');
    if (saved === 'dark-theme') {
        document.body.classList.add('dark-theme');
        toggle.querySelector('.icon').textContent = '☀️';
    }

    toggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        const isDark = document.body.classList.contains('dark-theme');
        toggle.querySelector('.icon').textContent = isDark ? '☀️' : '🌙';
        localStorage.setItem('mq_theme', isDark ? 'dark-theme' : '');
    });
}

function updateHeaderStats() {
    const el = document.getElementById('header-username');
    if (el) el.textContent = state.user.name;
}

function updateSyncTime(customText) {
    const el = document.getElementById('sync-time');
    if (el) {
        if (customText) { el.textContent = customText; return; }
        const now = new Date();
        el.textContent = `✅ Saqlandi: ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
    }
}

async function addXP(amount) {
    state.xp += amount;
    const newLevel = Math.floor(state.xp / 100) + 1;
    if (newLevel > state.level) {
        state.level = newLevel;
        alert(`Tabriklaymiz! Siz ${newLevel}-darajaga chiqdingiz! 🎊`);
    }
    await saveData();
}

// ─── Dashboard ─────────────────────────────────────────────────────────────

function renderDashboard() {
    const container     = document.getElementById('view-container');
    const topicCount    = state.topics.length;
    const materialCount = Object.values(state.materials).reduce((a, c) => a + c.length, 0);
    const videoCount    = state.topics.reduce((a, t) => a + (t.videos?.length || 0), 0);
    const quizCount     = state.topics.reduce((a, t) => a + (t.quizzes?.length || 0), 0);

    container.innerHTML = `
        <div class="fade-in dashboard-view">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem; margin-bottom:1rem;">
                <h1 class="view-title" style="margin:0;">Xush kelibsiz, ${state.user.name}! 👋</h1>
                <span id="sync-time" style="font-size:0.8rem; color:rgba(255,255,255,0.8); background:rgba(255,255,255,0.15); padding:0.4rem 0.8rem; border-radius:var(--radius-full);">Mahalliy saqlash 📱</span>
            </div>
            <p class="view-subtitle">MathQuest tizimiga umumiy ko'rinish:</p>

            <div class="dashboard-grid grid">
                <div class="card stat-card">
                    <div class="stat-icon">📚</div>
                    <div class="stat-info"><h3>${topicCount}</h3><p>Mavzular</p></div>
                </div>
                <div class="card stat-card">
                    <div class="stat-icon">📝</div>
                    <div class="stat-info"><h3>${quizCount}</h3><p>Test savollari</p></div>
                </div>
                <div class="card stat-card">
                    <div class="stat-icon">🎥</div>
                    <div class="stat-info"><h3>${videoCount}</h3><p>Videolar</p></div>
                </div>
                <div class="card stat-card">
                    <div class="stat-icon">📄</div>
                    <div class="stat-info"><h3>${materialCount}</h3><p>Materiallar</p></div>
                </div>
            </div>

            <div class="recent-activity mt-3">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
                    <h2>Mavzular</h2>
                    <button class="primary-btn btn-sm" onclick="appNavigate('topics')">Barchasini ko'rish</button>
                </div>
                <div class="grid">
                    ${state.topics.slice(0, 4).map(topic => `
                        <div class="card topic-summary-card" onclick="appNavigate('topics')" style="cursor:pointer;">
                            <span class="topic-icon-sm">${topic.icon || '📘'}</span>
                            <h4>${topic.title}</h4>
                            <p>${topic.quizzes?.length || 0} ta mashq</p>
                        </div>
                    `).join('')}
                    ${topicCount === 0 ? `<p style="grid-column:1/-1; text-align:center; padding:2rem; color:var(--text-muted)">
                        Hozircha mavzular yo'q. "Mavzular" bo'limidan qo'shing.
                    </p>` : ''}
                </div>
            </div>
        </div>
    `;
}

// ─── Topics ────────────────────────────────────────────────────────────────

function renderTopics() {
    const container = document.getElementById('view-container');
    container.innerHTML = `
        <div class="fade-in">
            <h1 class="view-title">Mavzularni boshqarish 🛠️</h1>

            <div class="card admin-topic-form">
                <h3><span class="icon">🆕</span> Yangi mavzu qo'shish</h3>
                <div class="form-group" style="margin-top:1.5rem;">
                    <label>Mavzu nomi</label>
                    <input type="text" id="new-topic-title" class="form-input" placeholder="Masalan: Foizlar">
                </div>
                <div class="form-group" style="margin-top:1rem;">
                    <label>📁 O'quv materiallari (PDF/Word/PPT) — ixtiyoriy</label>
                    <input type="file" id="new-topic-materials" class="form-input" accept=".pdf,.doc,.docx,.ppt,.pptx" multiple>
                </div>
                <div class="admin-form-actions">
                    <button class="primary-btn" onclick="window.addTopic()" style="padding:0.8rem 2.5rem;">Saqlash</button>
                </div>
            </div>

            <div style="display:flex; flex-direction:column; gap:1rem; margin-top:2rem;">
                ${state.topics.length === 0 ? `<p style="text-align:center; color:var(--text-muted); padding:2rem;">Hali mavzular qo'shilmagan.</p>` : ''}
                ${state.topics.map(topic => {
                    const materials = state.materials[topic.id] || [];
                    return `
                        <div class="card topic-list-item">
                            <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:1rem;">
                                <div>
                                    <h3 style="margin:0; font-weight:700;">${topic.icon} ${topic.title}</h3>
                                    <p style="font-size:0.85rem; color:var(--text-muted); margin-top:0.3rem;">
                                        ${topic.quizzes?.length || 0} savol · ${topic.videos?.length || 0} video · ${materials.length} material
                                    </p>
                                </div>
                                <div style="display:flex; gap:0.5rem; flex-shrink:0;">
                                    <button class="btn-icon" onclick="window.openEditTopic('${_esc(topic.id)}')" title="Tahrirlash" style="font-size:1.2rem; background:rgba(var(--primary-rgb),0.1); border-radius:8px; padding:0.5rem;">✏️</button>
                                    <button class="btn-icon" onclick="window.removeTopic('${_esc(topic.id)}')" title="O'chirish" style="font-size:1.2rem; background:rgba(239,68,68,0.1); color:var(--danger); border-radius:8px; padding:0.5rem;">🗑️</button>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

async function addTopic() {
    const titleInput = document.getElementById('new-topic-title');
    const title = titleInput.value.trim();
    if (!title) return alert("Mavzu nomini kiriting!");

    // Generate unique ID: slug + timestamp
    const slug = title.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '').slice(0, 20);
    const id   = `${slug}_${Date.now().toString(36)}`;

    if (state.topics.find(t => t.id === id)) {
        return alert("Bu ID allaqachon mavjud. Qayta urining.");
    }

    showLoading();
    const newTopic = { id, title, icon: '📚', theory: '', quizzes: [], videos: [] };
    state.topics.push(newTopic);
    state.unlockedTopics.push(id);

    const files = document.getElementById('new-topic-materials').files;
    state.materials[id] = [];
    for (const file of files) {
        const type = _fileType(file.name);
        const { url, storagePath } = await uploadMaterial(file, id);
        state.materials[id].push({ name: file.name, type, url, storagePath });
    }

    try {
        await saveData();
        titleInput.value = '';
        document.getElementById('new-topic-materials').value = '';
        hideLoading();
        renderTopics();
        alert("Mavzu muvaffaqiyatli saqlandi! ✅");
    } catch (e) {
        hideLoading();
    }
}
window.addTopic = addTopic;

async function removeTopic(topicId) {
    if (!confirm("Ushbu mavzuni o'chirib tashlamoqchimisiz? Barcha nazariya va testlar o'chib ketadi!")) return;

    showLoading();
    state.topics         = state.topics.filter(t => t.id !== topicId);
    state.unlockedTopics = state.unlockedTopics.filter(id => id !== topicId);
    delete state.materials[topicId];
    delete state.progress[topicId];

    try {
        await saveData();
        await supabaseClient.from('topics').delete().eq('id', topicId);
        hideLoading();
        renderTopics();
        alert("Mavzu o'chirildi! 🗑️");
    } catch (e) {
        hideLoading();
        console.error(e);
    }
}
window.removeTopic = removeTopic;

function openEditTopic(topicId) {
    const topic     = state.topics.find(t => t.id === topicId);
    if (!topic) return;
    const materials = state.materials[topicId] || [];
    const container = document.getElementById('view-container');

    container.innerHTML = `
        <div class="fade-in">
            <h1 class="view-title">Mavzuni tahrirlash: ${topic.title} ✏️</h1>

            <div class="card admin-topic-form">
                <div class="form-group">
                    <label>Mavzu nomi</label>
                    <input type="text" id="edit-topic-title" class="form-input" value="${_escAttr(topic.title)}">
                </div>

                <div class="form-group" style="margin-top:1.5rem;">
                    <label>Emoji belgisi</label>
                    <input type="text" id="edit-topic-icon" class="form-input" value="${topic.icon || '📚'}" style="max-width:120px;">
                </div>

                <div class="form-group" style="margin-top:1.5rem;">
                    <label>Nazariya matni (HTML qo'shish mumkin)</label>
                    <textarea id="edit-topic-theory" class="form-input" rows="6"
                        style="resize:vertical; font-family:inherit;">${_escHtml(topic.theory || '')}</textarea>
                </div>

                <div class="form-group" style="margin-top:1.5rem;">
                    <label>📁 Yangi materiallar qo'shish (PDF/Word/PPT)</label>
                    <input type="file" id="edit-topic-materials" class="form-input" accept=".pdf,.doc,.docx,.ppt,.pptx" multiple>
                </div>

                <div class="materials-preview" style="margin-top:1.5rem; padding:1.5rem; background:rgba(var(--primary-rgb),0.05); border-radius:var(--radius-md);">
                    <h4 style="margin-bottom:1rem;">📁 Joriy materiallar (${materials.length} ta):</h4>
                    <div class="file-list">
                        ${materials.length > 0 ? materials.map((f, i) => `
                            <div class="file-item" style="background:var(--bg-card); border:1px solid var(--border); display:flex; justify-content:space-between; align-items:center; padding:0.8rem; border-radius:8px; margin-bottom:0.5rem;">
                                <div style="display:flex; align-items:center; gap:0.8rem;">
                                    <span style="font-size:1.2rem;">${f.type === 'pdf' ? '📄' : f.type === 'doc' ? '📝' : '📊'}</span>
                                    <span style="font-weight:500;">${f.name}</span>
                                </div>
                                <button class="btn-icon" onclick="window.removeMaterial('${_esc(topicId)}',${i})" style="color:var(--danger); padding:5px;">🗑️</button>
                            </div>
                        `).join('') : '<p style="font-size:0.9rem; color:var(--text-muted)">Hali material qo\'shilmagan.</p>'}
                    </div>
                </div>

                <div style="display:flex; gap:1rem; justify-content:flex-end; margin-top:2rem;">
                    <button class="primary-btn" style="background:var(--border); color:var(--text-main);" onclick="appNavigate('topics')">Bekor qilish</button>
                    <button class="primary-btn" onclick="window.saveTopicEdit('${_esc(topicId)}')" style="padding:0.8rem 3rem; font-weight:700;">Saqlash ✅</button>
                </div>
            </div>
        </div>
    `;
}
window.openEditTopic = openEditTopic;

async function saveTopicEdit(id) {
    const topic = state.topics.find(t => t.id === id);
    if (!topic) return;

    const newTitle  = document.getElementById('edit-topic-title').value.trim();
    const newIcon   = document.getElementById('edit-topic-icon').value.trim();
    const newTheory = document.getElementById('edit-topic-theory').value;
    const newFiles  = document.getElementById('edit-topic-materials').files;

    if (!newTitle) return alert("Mavzu nomini kiriting!");

    showLoading();
    topic.title  = newTitle;
    topic.icon   = newIcon || '📚';
    topic.theory = newTheory;

    if (!state.materials[id]) state.materials[id] = [];
    for (const file of newFiles) {
        const { url, storagePath } = await uploadMaterial(file, id);
        state.materials[id].push({ name: file.name, type: _fileType(file.name), url, storagePath });
    }

    try {
        await saveData();
        hideLoading();
        renderTopics();
        alert("Mavzu yangilandi! ✅");
    } catch (e) {
        hideLoading();
    }
}
window.saveTopicEdit = saveTopicEdit;

async function removeMaterial(topicId, index) {
    if (!confirm("Ushbu materialni o'chirmoqchimisiz?")) return;
    showLoading();
    const material = (state.materials[topicId] || [])[index];
    state.materials[topicId].splice(index, 1);
    try {
        await deleteMaterial(material?.storagePath);
        await saveData();
        hideLoading();
        openEditTopic(topicId);
    } catch (e) {
        hideLoading();
    }
}
window.removeMaterial = removeMaterial;

async function triggerUpload(topicId, type) {
    const input  = document.createElement('input');
    input.type   = 'file';
    input.accept = type === 'pdf' ? '.pdf' : type === 'doc' ? '.doc,.docx' : '.ppt,.pptx';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        showLoading();
        if (!state.materials[topicId]) state.materials[topicId] = [];
        const { url, storagePath } = await uploadMaterial(file, topicId);
        state.materials[topicId].push({ name: file.name, type, url, storagePath });
        await saveData();
        hideLoading();
        renderTopics();
        alert(`${file.name} biriktirildi! ✅`);
    };
    input.click();
}
window.triggerUpload = triggerUpload;

// ─── Videos ────────────────────────────────────────────────────────────────

function renderVideos() {
    const container = document.getElementById('view-container');
    container.innerHTML = `
        <div class="fade-in">
            <h1 class="view-title">Video darslarni boshqarish 🎥</h1>

            <div class="card admin-video-form" style="margin-bottom:2rem;">
                <h3><span class="icon">➕</span> Yangi video qo'shish</h3>
                <div class="form-grid" style="margin-top:1.5rem;">
                    <div class="form-group">
                        <label>Mavzu</label>
                        <select id="video-topic-id" class="form-input">
                            ${state.topics.map(t => `<option value="${t.id}">${t.title}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>YouTube URL</label>
                        <input type="text" id="video-url" class="form-input" placeholder="https://www.youtube.com/watch?v=...">
                    </div>
                    <div class="form-group">
                        <label>Video nomi</label>
                        <input type="text" id="video-title" class="form-input" placeholder="Video dars nomi">
                    </div>
                </div>
                <div class="admin-form-actions">
                    <button class="primary-btn" onclick="window.addVideo()">Joylash</button>
                </div>
            </div>

            <div class="grid">
                ${state.topics.map(topic => `
                    <div class="card video-card">
                        <h3>${topic.title}</h3>
                        <div style="margin-top:1rem;">
                            ${topic.videos?.length > 0 ? topic.videos.map((video, vi) => `
                                <div class="video-item" style="margin-bottom:1.5rem; border-bottom:1px solid var(--border); padding-bottom:1rem;">
                                    <iframe width="100%" height="200" src="${_embedUrl(video.url)}" frameborder="0" allowfullscreen style="border-radius:var(--radius-md);"></iframe>
                                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
                                        <span style="font-weight:600; font-size:0.9rem;">${video.title}</span>
                                        <div style="display:flex; gap:0.4rem;">
                                            <button class="btn-icon" onclick="window.openEditVideo('${_esc(topic.id)}',${vi})" title="Tahrirlash" style="background:rgba(var(--primary-rgb),0.1); border-radius:6px; padding:0.4rem; font-size:1rem;">✏️</button>
                                            <button class="btn-icon" onclick="window.removeVideo('${_esc(topic.id)}',${vi})" title="O'chirish" style="color:var(--danger); font-size:1rem; background:rgba(239,68,68,0.1); border-radius:6px; padding:0.4rem;">🗑️</button>
                                        </div>
                                    </div>
                                </div>
                            `).join('') : '<p style="color:var(--text-muted); font-size:0.9rem;">Videolar yo\'q.</p>'}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

async function addVideo() {
    const topicId = document.getElementById('video-topic-id').value;
    const rawUrl  = document.getElementById('video-url').value.trim();
    const title   = document.getElementById('video-title').value.trim() || 'Video dars';

    if (!topicId || !rawUrl) return alert("Barcha maydonlarni to'ldiring!");

    showLoading();
    const topic = state.topics.find(t => t.id === topicId);
    if (!topic) { hideLoading(); return; }
    if (!topic.videos) topic.videos = [];
    topic.videos.push({ title, url: _embedUrl(rawUrl), xp: 20 });

    try {
        await saveData();
        document.getElementById('video-url').value   = '';
        document.getElementById('video-title').value = '';
        hideLoading();
        renderVideos();
        alert("Video qo'shildi! 🎥✅");
    } catch (e) {
        hideLoading();
    }
}
window.addVideo = addVideo;

function openEditVideo(topicId, vi) {
    const topic = state.topics.find(t => t.id === topicId);
    if (!topic) return;
    const video = topic.videos[vi];
    if (!video) return;
    const container = document.getElementById('view-container');

    container.innerHTML = `
        <div class="fade-in">
            <h1 class="view-title">Videoni tahrirlash ✏️</h1>
            <div class="card admin-video-form">
                <div class="form-group" style="margin-bottom:1rem;">
                    <label>Mavzu</label>
                    <input type="text" class="form-input" value="${_escAttr(topic.title)}" disabled style="opacity:0.6;">
                </div>
                <div class="form-group" style="margin-bottom:1rem;">
                    <label>Video nomi</label>
                    <input type="text" id="ev-title" class="form-input" value="${_escAttr(video.title)}">
                </div>
                <div class="form-group" style="margin-bottom:1rem;">
                    <label>YouTube URL</label>
                    <input type="text" id="ev-url" class="form-input" value="${_escAttr(video.url)}">
                </div>
                <div style="margin-bottom:1.5rem;">
                    <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:0.5rem;">Joriy preview:</p>
                    <iframe width="100%" height="200" src="${_embedUrl(video.url)}" frameborder="0" allowfullscreen style="border-radius:var(--radius-md);"></iframe>
                </div>
                <div style="display:flex; gap:1rem; justify-content:flex-end;">
                    <button class="primary-btn" style="background:var(--border); color:var(--text-main);" onclick="appNavigate('videos')">Bekor qilish</button>
                    <button class="primary-btn" onclick="window.saveVideoEdit('${_esc(topicId)}',${vi})" style="padding:0.8rem 3rem; font-weight:700;">Saqlash ✅</button>
                </div>
            </div>
        </div>
    `;
}
window.openEditVideo = openEditVideo;

async function saveVideoEdit(topicId, vi) {
    const topic = state.topics.find(t => t.id === topicId);
    if (!topic) return;
    const newTitle = document.getElementById('ev-title').value.trim();
    const newUrl   = document.getElementById('ev-url').value.trim();
    if (!newTitle || !newUrl) return alert("Barcha maydonlarni to'ldiring!");
    topic.videos[vi] = { ...topic.videos[vi], title: newTitle, url: _embedUrl(newUrl) };
    showLoading();
    await saveData();
    hideLoading();
    renderVideos();
    alert("Video yangilandi! ✅");
}
window.saveVideoEdit = saveVideoEdit;

async function removeVideo(topicId, index) {
    if (!confirm("Videoni o'chirmoqchimisiz?")) return;
    const topic = state.topics.find(t => t.id === topicId);
    if (!topic?.videos) return;
    topic.videos.splice(index, 1);
    showLoading();
    await saveData();
    hideLoading();
    renderVideos();
}
window.removeVideo = removeVideo;

function rewardVideo(xp) {
    addXP(parseInt(xp));
    alert(`${xp} XP sovg'a qilindi!`);
}

// ─── Quiz (Mustahkamlash) ──────────────────────────────────────────────────

function renderMustahkamlash() {
    const container = document.getElementById('view-container');
    container.innerHTML = `
        <div class="fade-in">
            <h1 class="view-title">Mavzularni mustahkamlash 🧱</h1>

            <div class="card admin-quiz-form" style="margin-bottom:2rem;">
                <h3><span class="icon">📝</span> Yangi test savoli qo'shish</h3>
                <div class="form-grid" style="margin-top:1.5rem;">
                    <div class="form-group">
                        <label>Mavzu</label>
                        <select id="quiz-topic-id" class="form-input">
                            ${state.topics.map(t => `<option value="${t.id}">${t.title}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Savol turi</label>
                        <select id="quiz-type" class="form-input" onchange="window.toggleQuizOptions(this.value)">
                            <option value="mcq">Varianli (MCQ)</option>
                            <option value="fib">Yozma (FIB)</option>
                        </select>
                    </div>
                </div>
                <div class="form-group" style="margin-top:1rem;">
                    <label>Savol matni</label>
                    <input type="text" id="quiz-question" class="form-input" placeholder="Masalan: 5 × 5 nechaga teng?">
                </div>
                <div id="mcq-options-area" style="margin-top:1rem;">
                    <label>Variantlar (vergul bilan ajrating)</label>
                    <input type="text" id="quiz-options" class="form-input" placeholder="20, 25, 30, 35">
                    <p style="font-size:0.8rem; color:var(--text-muted); margin-top:0.5rem;">
                        To'g'ri javob raqami (0 dan): <input type="number" id="quiz-correct-index" style="width:60px; padding:4px 8px;" value="0" min="0">
                    </p>
                </div>
                <div id="fib-answer-area" style="margin-top:1rem; display:none;">
                    <label>To'g'ri javob</label>
                    <input type="text" id="quiz-fib-answer" class="form-input" placeholder="25">
                </div>
                <div class="admin-form-actions">
                    <button class="primary-btn" onclick="window.addQuestion()">Savolni saqlash</button>
                </div>
            </div>

            <div style="display:flex; flex-direction:column; gap:1.5rem; margin-top:1rem;">
                ${state.topics.map(topic => `
                    <div class="card">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.8rem;">
                            <h3 style="margin:0;">${topic.icon} ${topic.title}</h3>
                            <span style="font-size:0.85rem; color:var(--text-muted);">${topic.quizzes?.length || 0} ta savol</span>
                        </div>
                        ${topic.quizzes?.length > 0 ? `
                        <div style="display:flex; flex-direction:column; gap:0.5rem;">
                            ${topic.quizzes.map((q, qi) => `
                                <div style="background:rgba(var(--primary-rgb),0.05); border:1px solid var(--border); border-radius:8px; padding:0.75rem 1rem; display:flex; justify-content:space-between; align-items:center; gap:0.5rem;">
                                    <div style="flex:1; min-width:0;">
                                        <span style="font-size:0.75rem; background:var(--primary); color:#fff; padding:2px 6px; border-radius:10px; margin-right:6px;">${q.type === 'mcq' ? 'MCQ' : 'FIB'}</span>
                                        <span style="font-size:0.9rem;">${_escHtml(q.q)}</span>
                                    </div>
                                    <div style="display:flex; gap:0.4rem; flex-shrink:0;">
                                        <button class="btn-icon" onclick="window.openEditQuestion('${_esc(topic.id)}',${qi})" title="Tahrirlash" style="background:rgba(var(--primary-rgb),0.1); border-radius:6px; padding:0.4rem; font-size:1rem;">✏️</button>
                                        <button class="btn-icon" onclick="window.removeQuestion('${_esc(topic.id)}',${qi})" title="O'chirish" style="background:rgba(239,68,68,0.1); color:var(--danger); border-radius:6px; padding:0.4rem; font-size:1rem;">🗑️</button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        <div style="margin-top:0.8rem;">
                            <button class="primary-btn btn-sm" onclick="window.startQuiz('${_esc(topic.id)}')">Sinab ko'rish ▶️</button>
                        </div>
                        ` : '<p style="color:var(--text-muted); font-size:0.9rem;">Hali savollar qo\'shilmagan.</p>'}
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function toggleQuizOptions(type) {
    document.getElementById('mcq-options-area').style.display = type === 'mcq' ? 'block' : 'none';
    document.getElementById('fib-answer-area').style.display  = type === 'fib'  ? 'block' : 'none';
}
window.toggleQuizOptions = toggleQuizOptions;

async function addQuestion() {
    const topicId = document.getElementById('quiz-topic-id').value;
    const type    = document.getElementById('quiz-type').value;
    const qText   = document.getElementById('quiz-question').value.trim();

    if (!topicId || !qText) return alert("Barcha maydonlarni to'ldiring!");

    showLoading();
    const topic = state.topics.find(t => t.id === topicId);
    if (!topic) { hideLoading(); return; }
    if (!topic.quizzes) topic.quizzes = [];

    if (type === 'mcq') {
        const optionsText  = document.getElementById('quiz-options').value;
        const correctIndex = parseInt(document.getElementById('quiz-correct-index').value);
        if (!optionsText) { hideLoading(); return alert("Variantlarni kiriting!"); }
        topic.quizzes.push({
            type: 'mcq', q: qText,
            options: optionsText.split(',').map(s => s.trim()),
            correct: correctIndex, difficulty: 'medium'
        });
    } else {
        const correct = document.getElementById('quiz-fib-answer').value.trim();
        if (!correct) { hideLoading(); return alert("To'g'ri javobni kiriting!"); }
        topic.quizzes.push({ type: 'fib', q: qText, correct, difficulty: 'medium' });
    }

    try {
        await saveData();
        // Clear fields
        document.getElementById('quiz-question').value = '';
        document.getElementById('quiz-options').value  = '';
        document.getElementById('quiz-fib-answer').value = '';
        hideLoading();
        renderMustahkamlash();
        alert("Savol qo'shildi! 📝✅");
    } catch (e) {
        hideLoading();
    }
}
window.addQuestion = addQuestion;

async function removeQuestion(topicId, qi) {
    if (!confirm("Bu savolni o'chirmoqchimisiz?")) return;
    const topic = state.topics.find(t => t.id === topicId);
    if (!topic?.quizzes) return;
    topic.quizzes.splice(qi, 1);
    showLoading();
    await saveData();
    hideLoading();
    renderMustahkamlash();
}
window.removeQuestion = removeQuestion;

function openEditQuestion(topicId, qi) {
    const topic = state.topics.find(t => t.id === topicId);
    if (!topic) return;
    const q = topic.quizzes[qi];
    if (!q) return;
    const container = document.getElementById('view-container');

    const mcqOptions = q.type === 'mcq' ? (q.options || []).join(', ') : '';
    const mcqCorrect = q.type === 'mcq' ? (q.correct ?? 0) : 0;
    const fibAnswer  = q.type === 'fib'  ? (q.correct || '') : '';

    container.innerHTML = `
        <div class="fade-in">
            <h1 class="view-title">Savolni tahrirlash ✏️</h1>
            <div class="card admin-quiz-form">
                <div class="form-grid" style="margin-bottom:1rem;">
                    <div class="form-group">
                        <label>Mavzu</label>
                        <input type="text" class="form-input" value="${_escAttr(topic.title)}" disabled style="opacity:0.6;">
                    </div>
                    <div class="form-group">
                        <label>Savol turi</label>
                        <select id="eq-type" class="form-input" onchange="window.toggleEditQuizOptions(this.value)">
                            <option value="mcq" ${q.type === 'mcq' ? 'selected' : ''}>Varianli (MCQ)</option>
                            <option value="fib" ${q.type === 'fib' ? 'selected' : ''}>Yozma (FIB)</option>
                        </select>
                    </div>
                </div>
                <div class="form-group" style="margin-bottom:1rem;">
                    <label>Savol matni</label>
                    <input type="text" id="eq-question" class="form-input" value="${_escAttr(q.q)}">
                </div>
                <div id="eq-mcq-area" style="${q.type === 'mcq' ? '' : 'display:none;'}">
                    <div class="form-group" style="margin-bottom:0.5rem;">
                        <label>Variantlar (vergul bilan ajrating)</label>
                        <input type="text" id="eq-options" class="form-input" value="${_escAttr(mcqOptions)}">
                    </div>
                    <p style="font-size:0.85rem; color:var(--text-muted);">
                        To'g'ri javob raqami (0 dan): <input type="number" id="eq-correct-index" style="width:60px; padding:4px 8px;" value="${mcqCorrect}" min="0">
                    </p>
                </div>
                <div id="eq-fib-area" style="${q.type === 'fib' ? 'margin-top:1rem;' : 'display:none;'}">
                    <div class="form-group">
                        <label>To'g'ri javob</label>
                        <input type="text" id="eq-fib-answer" class="form-input" value="${_escAttr(fibAnswer)}">
                    </div>
                </div>
                <div style="display:flex; gap:1rem; justify-content:flex-end; margin-top:2rem;">
                    <button class="primary-btn" style="background:var(--border); color:var(--text-main);" onclick="appNavigate('mustahkamlash')">Bekor qilish</button>
                    <button class="primary-btn" onclick="window.saveQuestionEdit('${_esc(topicId)}',${qi})" style="padding:0.8rem 3rem; font-weight:700;">Saqlash ✅</button>
                </div>
            </div>
        </div>
    `;
}
window.openEditQuestion = openEditQuestion;

function toggleEditQuizOptions(type) {
    document.getElementById('eq-mcq-area').style.display = type === 'mcq' ? 'block' : 'none';
    document.getElementById('eq-fib-area').style.display  = type === 'fib'  ? 'block' : 'none';
}
window.toggleEditQuizOptions = toggleEditQuizOptions;

async function saveQuestionEdit(topicId, qi) {
    const topic = state.topics.find(t => t.id === topicId);
    if (!topic) return;
    const type  = document.getElementById('eq-type').value;
    const qText = document.getElementById('eq-question').value.trim();
    if (!qText) return alert("Savol matnini kiriting!");

    let updated;
    if (type === 'mcq') {
        const optionsText  = document.getElementById('eq-options').value;
        const correctIndex = parseInt(document.getElementById('eq-correct-index').value);
        if (!optionsText) return alert("Variantlarni kiriting!");
        updated = { type: 'mcq', q: qText, options: optionsText.split(',').map(s => s.trim()), correct: correctIndex, difficulty: 'medium' };
    } else {
        const correct = document.getElementById('eq-fib-answer').value.trim();
        if (!correct) return alert("To'g'ri javobni kiriting!");
        updated = { type: 'fib', q: qText, correct, difficulty: 'medium' };
    }

    topic.quizzes[qi] = updated;
    showLoading();
    await saveData();
    hideLoading();
    renderMustahkamlash();
    alert("Savol yangilandi! ✅");
}
window.saveQuestionEdit = saveQuestionEdit;

// ─── Quiz preview (admin can test their own questions) ────────────────────

function renderQuiz(topicId) {
    const topic = state.topics.find(t => t.id === topicId);
    if (!topic) return;
    if (!topic.quizzes || topic.quizzes.length === 0) {
        return alert("Bu mavzuda hali savollar yo'q.");
    }

    currentQuizState = { topic, currentQuestionIndex: 0, score: 0, answers: [] };
    const container  = document.getElementById('view-container');
    container.innerHTML = `
        <div class="theory-view fade-in card">
            <h2 class="view-title">${topic.title}: Nazariya 📖</h2>
            <div class="theory-content" style="font-size:1.1rem; margin:2rem 0; line-height:1.8;">
                ${topic.theory ? `<p>${topic.theory}</p>` : '<p style="color:var(--text-muted)">Nazariya qo\'shilmagan.</p>'}
            </div>
            <div class="theory-actions">
                <button class="primary-btn" onclick="window.renderCurrentQuestion()">Sinab ko'rish 🚀</button>
                <button class="primary-btn" style="background:var(--border); color:var(--text-main)" onclick="appNavigate('mustahkamlash')">Orqaga</button>
            </div>
        </div>
    `;
}

function renderCurrentQuestion() {
    const { topic, currentQuestionIndex } = currentQuizState;
    const question  = topic.quizzes[currentQuestionIndex];
    const container = document.getElementById('view-container');

    container.innerHTML = `
        <div class="quiz-view fade-in">
            <div class="quiz-header">
                <h2>${topic.title}</h2>
                <span>Savol ${currentQuestionIndex + 1} / ${topic.quizzes.length}</span>
            </div>
            <div class="card quiz-card">
                <p class="question-text">${question.q}</p>
                <div class="quiz-options">
                    ${question.type === 'mcq'
                        ? question.options.map((opt, i) => `<button class="option-btn" onclick="window.submitAnswer(${i})">${opt}</button>`).join('')
                        : `<input type="text" id="fib-answer" placeholder="Javobni yozing..." class="fib-input">
                           <button class="primary-btn" onclick="window.submitAnswer(document.getElementById('fib-answer').value)">Yuborish</button>`
                    }
                </div>
            </div>
        </div>
    `;
}
window.renderCurrentQuestion = renderCurrentQuestion;

function submitAnswer(answer) {
    const { topic, currentQuestionIndex } = currentQuizState;
    const question = topic.quizzes[currentQuestionIndex];
    const isCorrect = question.type === 'mcq'
        ? answer === question.correct
        : String(answer).trim().toLowerCase() === String(question.correct).toLowerCase();

    if (isCorrect) currentQuizState.score++;
    currentQuizState.currentQuestionIndex++;

    if (currentQuizState.currentQuestionIndex < topic.quizzes.length) {
        renderCurrentQuestion();
    } else {
        finishQuiz();
    }
}

async function finishQuiz() {
    const { topic, score }  = currentQuizState;
    const finalPercent      = Math.round((score / topic.quizzes.length) * 100);
    const container         = document.getElementById('view-container');

    container.innerHTML = `
        <div class="fade-in card text-center">
            <h1>Natija: ${finalPercent}%</h1>
            <p>${finalPercent >= 70 ? 'Savollar to\'g\'ri tuzilgan! 🎉' : 'Savollarni qayta ko\'rib chiqing. 💪'}</p>
            <div class="result-stats">
                <div class="stat"><span>To'g'ri:</span> <strong>${score} / ${topic.quizzes.length}</strong></div>
            </div>
            <button class="primary-btn" onclick="appNavigate('mustahkamlash')">Orqaga</button>
        </div>
    `;
}

// ─── Leaderboard ───────────────────────────────────────────────────────────

async function renderLeaderboard() {
    const container = document.getElementById('view-container');
    container.innerHTML = `<div class="fade-in card"><h2>🏆 O'quvchilar reytingi</h2><p style="color:var(--text-muted)">Yuklanmoqda...</p></div>`;

    try {
        const { data, error } = await supabaseClient
            .from('student_progress')
            .select('student_id, name, xp, level')
            .order('xp', { ascending: false })
            .limit(50);

        if (error) throw error;

        const rows = (data || []).map((p, i) => `
            <tr>
                <td><strong>${i + 1}</strong></td>
                <td>${p.name || 'O\'quvchi'}</td>
                <td><strong>${p.xp}</strong> XP</td>
                <td>${p.level}-daraja</td>
            </tr>
        `).join('');

        container.innerHTML = `
            <div class="fade-in card">
                <h2>🏆 O'quvchilar reytingi</h2>
                <p style="color:var(--text-muted); margin-bottom:1.5rem;">Jami ${data?.length || 0} ta o'quvchi ro'yxatdan o'tgan</p>
                <table class="leaderboard-table">
                    <thead><tr><th>O'rin</th><th>Ism</th><th>XP</th><th>Daraja</th></tr></thead>
                    <tbody>${rows || '<tr><td colspan="4" style="text-align:center; padding:2rem; color:var(--text-muted)">Hali o\'quvchilar yo\'q</td></tr>'}</tbody>
                </table>
            </div>
        `;
    } catch (e) {
        container.innerHTML = `<div class="fade-in card"><h2>🏆 O'quvchilar reytingi</h2><p style="color:var(--danger)">Xatolik: ${e.message}</p></div>`;
    }
}

// ─── Profile ───────────────────────────────────────────────────────────────

function renderProfile() {
    const container = document.getElementById('view-container');
    container.innerHTML = `
        <div class="fade-in profile-view">
            <div class="card profile-header-card">
                <div class="large-avatar">👤</div>
                <h2>${state.user.name}</h2>
                <p>O'qituvchi | ${authState.user?.email || ''}</p>
            </div>
            <div class="grid" style="margin-top:2rem;">
                <div class="card">
                    <h3>⚙️ Hisob</h3>
                    <p>Email: <strong>${authState.user?.email || ''}</strong></p>
                    <p>Role: <strong>Admin</strong></p>
                    <button class="primary-btn btn-sm" style="margin-top:1rem; background:var(--danger);" onclick="window.logout()">Chiqish 🚪</button>
                </div>
                <div class="card">
                    <h3>📊 Tizim statistikasi</h3>
                    <p>Mavzular: <strong>${state.topics.length}</strong></p>
                    <p>Umumiy savollar: <strong>${state.topics.reduce((a,t) => a + (t.quizzes?.length||0), 0)}</strong></p>
                    <p>Videolar: <strong>${state.topics.reduce((a,t) => a + (t.videos?.length||0), 0)}</strong></p>
                </div>
            </div>
        </div>
    `;
}

// ─── restoreFromClipboard (legacy) ─────────────────────────────────────────

async function restoreFromClipboard() {
    const dataRaw = prompt("Avvaldan nusxalangan JSON ma'lumotni qo'ying:");
    if (!dataRaw) return;
    try {
        const parsed = JSON.parse(dataRaw);
        const topicsToMigrate = parsed.topics || (Array.isArray(parsed) ? parsed : null);
        if (!topicsToMigrate?.length) return alert("Format noto'g'ri.");
        state.topics         = topicsToMigrate;
        state.materials      = parsed.materials || {};
        state.unlockedTopics = parsed.unlockedTopics || state.topics.map(t => t.id);
        await saveData();
        alert("Ma'lumotlar saqlandi! ✅");
        renderTopics();
    } catch (e) {
        alert("JSON o'qib bo'lmadi: " + e.message);
    }
}
window.restoreFromClipboard = restoreFromClipboard;

// ─── Utilities ─────────────────────────────────────────────────────────────

function _fileType(name) {
    if (name.endsWith('.pdf')) return 'pdf';
    if (name.endsWith('.ppt') || name.endsWith('.pptx')) return 'ppt';
    return 'doc';
}

function _embedUrl(url) {
    if (!url) return '';
    if (url.includes('/embed/')) return url;
    if (url.includes('watch?v=')) return url.replace('watch?v=', 'embed/').split('&')[0];
    if (url.includes('youtu.be/')) return 'https://www.youtube.com/embed/' + url.split('youtu.be/')[1].split('?')[0];
    return url;
}

// Escape for use inside onclick="..." attributes
function _esc(str) { return String(str).replace(/'/g, "\\'"); }

// Escape for HTML attribute values (value="...")
function _escAttr(str) { return String(str).replace(/"/g, '&quot;').replace(/</g, '&lt;'); }

// Escape for innerHTML text content
function _escHtml(str) { return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

})(); // End of Admin Namespace
