(function() {

const state = {
    user: { name: 'O\'quvchi', id: 'guest' },
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
    dashboard:   renderDashboard,
    topics:      renderTopics,
    videos:      renderVideos,
    leaderboard: renderLeaderboard,
    profile:     renderProfile,
    quiz:        renderQuiz
};

let currentQuizState = {
    topic: null,
    currentQuestionIndex: 0,
    score: 0,
    answers: []
};

// ─── Init ──────────────────────────────────────────────────────────────────

async function initStudentPanel() {
    try {
        // Sync user info from auth
        if (authState.user) {
            state.user.name = authState.user.name || authState.user.email?.split('@')[0] || 'O\'quvchi';
            state.user.id   = authState.user.uid;
        }

        window.appNavigate          = navigate;
        window.startQuiz            = (id) => navigate('quiz', id);
        window.submitAnswer         = submitAnswer;
        window.rewardVideo          = rewardVideo;
        window.renderCurrentQuestion = renderCurrentQuestion;

        renderStudentLayout();
        showLoading();
        await loadData();
        setupNavigation();
        setupThemeToggle();
        updateHeaderStats();
        hideLoading();
        navigate('dashboard');
    } catch (e) {
        console.error("Student init error:", e);
        hideLoading();
        navigate('dashboard');
    }
}
window.initStudentPanel = initStudentPanel;

// ─── Data ──────────────────────────────────────────────────────────────────

async function loadData() {
    try {
        // 1. Load topics from Supabase
        const { data: topicsData, error: topicsError } = await supabaseClient
            .from('topics')
            .select('*')
            .order('sort_order', { ascending: true });

        if (!topicsError && topicsData) {
            state.topics = topicsData.map(t => ({
                id:      t.id,
                title:   t.title,
                icon:    t.icon    || '📚',
                theory:  t.theory  || '',
                quizzes: t.quizzes || [],
                videos:  t.videos  || []
            }));
            state.materials = {};
            topicsData.forEach(t => { state.materials[t.id] = t.materials || []; });
        } else {
            const cached = localStorage.getItem('mq_admin_v2');
            if (cached) {
                const d = JSON.parse(cached);
                state.topics    = d.topics    || [];
                state.materials = d.materials || {};
            }
        }

        // 2. Load student progress from Supabase
        const studentId = authState.user.uid;
        const { data: progress, error: progressError } = await supabaseClient
            .from('student_progress')
            .select('*')
            .eq('student_id', studentId)
            .single();

        if (!progressError && progress) {
            state.xp             = progress.xp             || 0;
            state.level          = progress.level          || 1;
            state.streak         = progress.streak         || 0;
            state.progress       = progress.progress       || {};
            state.unlockedTopics = progress.unlocked_topics || [];
            if (progress.name && progress.name !== authState.user.name) {
                state.user.name = progress.name;
            }
        } else {
            // New student: unlock only first topic
            state.unlockedTopics = state.topics.length > 0 ? [state.topics[0].id] : [];
            await saveData();
        }
    } catch (e) {
        console.error("Load error:", e);
        // Offline fallback
        _loadFromCache();
    }
}

function _loadFromCache() {
    const adminCache = localStorage.getItem('mq_admin_v2');
    if (adminCache) {
        const d = JSON.parse(adminCache);
        state.topics    = d.topics    || [];
        state.materials = d.materials || {};
    }
    const studentCache = localStorage.getItem(`mq_student_v2_${authState.user.uid}`);
    if (studentCache) {
        const d          = JSON.parse(studentCache);
        state.xp             = d.xp             || 0;
        state.level          = d.level          || 1;
        state.streak         = d.streak         || 0;
        state.progress       = d.progress       || {};
        state.unlockedTopics = d.unlockedTopics  || [];
    }
}

async function saveData() {
    const studentId   = authState.user.uid;
    const studentName = authState.user.name || state.user.name;

    // Local cache
    localStorage.setItem(`mq_student_v2_${studentId}`, JSON.stringify({
        xp: state.xp, level: state.level, streak: state.streak,
        progress: state.progress, unlockedTopics: state.unlockedTopics,
        name: studentName
    }));

    // Supabase
    try {
        const { error } = await supabaseClient.from('student_progress').upsert({
            student_id:      studentId,
            xp:              state.xp,
            level:           state.level,
            streak:          state.streak,
            progress:        state.progress,
            unlocked_topics: state.unlockedTopics,
            name:            studentName,
            updated_at:      new Date().toISOString()
        });
        if (error) console.error("Progress save error:", error);
    } catch (e) {
        console.error("Cloud save error:", e);
    }
}

// ─── Layout ────────────────────────────────────────────────────────────────

function renderStudentLayout() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <nav class="sidebar">
            <div class="logo">
                <span class="logo-icon">📏</span>
                <span class="logo-text">MQ Student</span>
            </div>
            <ul class="nav-links">
                <li class="active" data-page="dashboard"><span class="icon">🏠</span> <span>Asosiy</span></li>
                <li data-page="topics"><span class="icon">📚</span> <span>Mavzular</span></li>
                <li data-page="videos"><span class="icon">🎥</span> <span>Videolar</span></li>
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
                <div class="user-stats-bar">
                    <div class="stat-badge xp-badge">✨ <span id="xp-value">0</span> XP</div>
                    <div class="stat-badge level-badge">🏆 <span id="level-value">1</span> Lvl</div>
                    <div class="stat-badge streak-badge">🔥 <span id="streak-value">0</span> kun</div>
                </div>
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
    const xpEl     = document.getElementById('xp-value');
    const levelEl  = document.getElementById('level-value');
    const streakEl = document.getElementById('streak-value');
    const nameEl   = document.getElementById('header-username');
    if (xpEl)     xpEl.textContent     = state.xp;
    if (levelEl)  levelEl.textContent  = state.level;
    if (streakEl) streakEl.textContent = state.streak;
    if (nameEl)   nameEl.textContent   = state.user.name;
}

function addXP(amount) {
    state.xp += amount;
    const newLevel = Math.floor(state.xp / 100) + 1;
    if (newLevel > state.level) {
        state.level = newLevel;
        _showLevelUpBanner(newLevel);
    }
    updateHeaderStats();
    saveData();
}

function _showLevelUpBanner(level) {
    const banner = document.createElement('div');
    banner.style = `
        position:fixed; top:20px; left:50%; transform:translateX(-50%);
        background:var(--primary); color:white; padding:1rem 2rem;
        border-radius:var(--radius-full); font-size:1.1rem; font-weight:700;
        box-shadow:0 8px 24px rgba(0,0,0,0.2); z-index:9999;
        animation: fadeIn 0.3s ease;
    `;
    banner.textContent = `🎊 Tabriklaymiz! ${level}-darajaga chiqdingiz!`;
    document.body.appendChild(banner);
    setTimeout(() => banner.remove(), 3000);
}

// ─── Dashboard ─────────────────────────────────────────────────────────────

function renderDashboard() {
    const container    = document.getElementById('view-container');
    const totalTopics  = state.topics.length;
    const doneTopics   = Object.values(state.progress).filter(p => p >= 70).length;
    const nextXP       = 100 - (state.xp % 100);
    const progressPct  = state.xp % 100;

    container.innerHTML = `
        <div class="fade-in dashboard-view">
            <h1 class="view-title">Xush kelibsiz, ${state.user.name}! 👋</h1>
            <p class="view-subtitle">Bugungi matematik sarguzashtingizni boshlang.</p>

            <div class="dashboard-grid grid">
                <div class="card daily-challenge">
                    <h3>📅 Kunlik Topshiriq</h3>
                    <p>Mavzulardan birini yakunlang va +50 XP oling!</p>
                    <button class="primary-btn btn-sm" style="margin-top:1rem;" onclick="appNavigate('topics')">Boshlash</button>
                </div>

                <div class="card progress-overview" style="color:var(--text-main)">
                    <h3>📊 Umumiy Progress</h3>
                    <div class="level-indicator">
                        <div class="level-ring">${state.level}</div>
                        <div style="flex:1;">
                            <div class="xp-progress-bar">
                                <div class="fill" style="width: ${progressPct}%"></div>
                            </div>
                            <p style="font-size:0.8rem; margin-top:0.3rem; color:var(--text-muted)">
                                Keyingi darajagacha <strong>${nextXP} XP</strong>
                            </p>
                        </div>
                    </div>
                    <p style="margin-top:0.5rem;">Yakunlangan mavzular: <strong>${doneTopics} / ${totalTopics}</strong></p>
                </div>
            </div>

            <h2 style="margin-top:3rem; margin-bottom:1.5rem;">Tezkor Kirish</h2>
            <div class="grid">
                <div class="card access-card" onclick="appNavigate('topics')" style="cursor:pointer;">
                    <div class="icon">📚</div>
                    <h4>Mavzular</h4>
                    <p>${state.unlockedTopics.length} / ${totalTopics} ochilgan</p>
                </div>
                <div class="card access-card" onclick="appNavigate('videos')" style="cursor:pointer;">
                    <div class="icon">🎥</div>
                    <h4>Videolar</h4>
                    <p>${state.topics.reduce((a,t) => a + (t.videos?.length||0), 0)} ta video</p>
                </div>
                <div class="card access-card" onclick="appNavigate('leaderboard')" style="cursor:pointer;">
                    <div class="icon">🏆</div>
                    <h4>Reyting</h4>
                    <p>Top o'quvchilar</p>
                </div>
            </div>
        </div>
    `;
}

// ─── Topics ────────────────────────────────────────────────────────────────

function renderTopics() {
    const container = document.getElementById('view-container');

    if (state.topics.length === 0) {
        container.innerHTML = `<div class="fade-in card" style="text-align:center; padding:3rem;">
            <p style="font-size:2rem;">📚</p>
            <p style="color:var(--text-muted)">Hozircha mavzular qo'shilmagan.<br>O'qituvchingizni kuting.</p>
        </div>`;
        return;
    }

    container.innerHTML = `
        <div class="fade-in">
            <h1 class="view-title">Matematika Mavzulari 📚</h1>
            <div class="topics-grid grid">
                ${state.topics.map((topic, idx) => {
                    const isUnlocked = state.unlockedTopics.includes(topic.id);
                    const progress   = state.progress[topic.id] || 0;
                    const materials  = state.materials[topic.id] || [];
                    const isPassed   = progress >= 70;

                    return `
                        <div class="card topic-card ${isUnlocked ? '' : 'locked'}">
                            <div class="topic-icon">${isUnlocked ? topic.icon : '🔒'}</div>
                            <h3>${topic.title}</h3>
                            ${isPassed ? '<span style="font-size:0.8rem; background:var(--success,#22c55e); color:white; padding:2px 8px; border-radius:99px;">✅ O\'tildi</span>' : ''}

                            <div class="progress-info" style="margin-top:0.8rem;">
                                <div class="progress-bar"><div class="fill" style="width:${progress}%"></div></div>
                                <span>${progress}%</span>
                            </div>

                            ${materials.length > 0 ? `
                            <div class="materials-section" style="margin-top:1rem;">
                                <h4 style="font-size:0.85rem; margin-bottom:0.5rem;">📖 O'quv materiallari</h4>
                                <div class="file-list">
                                    ${materials.map(f => `
                                        <div class="file-item">
                                            <div class="file-info">
                                                <span class="file-icon">${f.type === 'pdf' ? '📄' : f.type === 'ppt' ? '📊' : '📝'}</span>
                                                <span class="file-name">${f.name}</span>
                                            </div>
                                            ${f.url && f.url !== '#' ? `<a href="${f.url}" target="_blank" class="btn-icon">⬇️</a>` : ''}
                                        </div>
                                    `).join('')}
                                </div>
                            </div>` : ''}

                            <button class="primary-btn"
                                style="width:100%; margin-top:1rem;"
                                ${isUnlocked && topic.quizzes?.length > 0 ? `onclick="window.startQuiz('${topic.id}')"` : 'disabled'}>
                                ${!isUnlocked ? '🔒 Qulflangan' : topic.quizzes?.length > 0 ? 'Mashqni boshlash →' : 'Savollar yo\'q'}
                            </button>

                            ${!isUnlocked && idx > 0 ? `<p style="font-size:0.75rem; color:var(--text-muted); text-align:center; margin-top:0.5rem;">
                                Oldingi mavzudan 70% olsangiz ochiladi
                            </p>` : ''}
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

// ─── Quiz ──────────────────────────────────────────────────────────────────

function renderQuiz(topicId) {
    const topic = state.topics.find(t => t.id === topicId);
    if (!topic) return;
    if (!topic.quizzes?.length) {
        alert("Bu mavzuda hali savollar yo'q.");
        return navigate('topics');
    }

    currentQuizState = { topic, currentQuestionIndex: 0, score: 0, answers: [] };

    const materials  = state.materials[topicId] || [];
    const container  = document.getElementById('view-container');
    container.innerHTML = `
        <div class="theory-view fade-in card">
            <h2 class="view-title">${topic.title}: Nazariya 📖</h2>
            <div class="theory-content" style="font-size:1.1rem; margin:2rem 0; line-height:1.8;">
                ${topic.theory
                    ? `<div>${topic.theory}</div>`
                    : '<p style="color:var(--text-muted)">Bu mavzu uchun nazariya hali qo\'shilmagan.</p>'}
            </div>

            ${materials.length > 0 ? `
            <div class="student-materials" style="margin:2rem 0; padding:1.5rem; background:rgba(var(--primary-rgb),0.05); border-radius:var(--radius-md);">
                <h3 style="margin-bottom:1rem;"><span class="icon">📁</span> O'quv Materiallari</h3>
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:1rem;">
                    ${materials.map(f => `
                        <a href="${f.url || '#'}" target="_blank" class="card"
                            style="text-decoration:none; display:flex; align-items:center; gap:0.8rem; padding:1rem; border:1px solid var(--border);">
                            <span style="font-size:2rem;">${f.type === 'pdf' ? '📄' : f.type === 'doc' ? '📝' : '📊'}</span>
                            <span style="font-weight:600; color:var(--text-main); word-break:break-all; font-size:0.9rem;">${f.name}</span>
                        </a>
                    `).join('')}
                </div>
            </div>` : ''}

            <div class="theory-actions">
                <button class="primary-btn" onclick="window.renderCurrentQuestion()">Mashqni boshlash 🚀</button>
                <button class="primary-btn" style="background:var(--border); color:var(--text-main);" onclick="appNavigate('topics')">Orqaga</button>
            </div>
        </div>
    `;
}

function renderCurrentQuestion() {
    const { topic, currentQuestionIndex } = currentQuizState;
    const question  = topic.quizzes[currentQuestionIndex];
    const container = document.getElementById('view-container');
    const pct       = Math.round((currentQuestionIndex / topic.quizzes.length) * 100);

    container.innerHTML = `
        <div class="quiz-view fade-in">
            <div class="quiz-header">
                <h2>${topic.title}</h2>
                <span>Savol ${currentQuestionIndex + 1} / ${topic.quizzes.length}</span>
            </div>
            <div style="height:4px; background:var(--border); border-radius:2px; margin-bottom:1.5rem;">
                <div style="height:100%; width:${pct}%; background:var(--primary); border-radius:2px; transition:width 0.3s;"></div>
            </div>
            <div class="card quiz-card">
                <p class="question-text">${question.q}</p>
                <div class="quiz-options">
                    ${question.type === 'mcq'
                        ? question.options.map((opt, i) =>
                            `<button class="option-btn" onclick="window.submitAnswer(${i})">${opt}</button>`
                          ).join('')
                        : `<input type="text" id="fib-answer" placeholder="Javobni yozing..." class="fib-input" autofocus>
                           <button class="primary-btn" style="margin-top:1rem; width:100%;"
                               onclick="window.submitAnswer(document.getElementById('fib-answer').value)">Yuborish ✓</button>`
                    }
                </div>
            </div>
        </div>
    `;

    // Allow Enter for FIB
    if (question.type === 'fib') {
        setTimeout(() => {
            document.getElementById('fib-answer')?.addEventListener('keydown', e => {
                if (e.key === 'Enter') window.submitAnswer(document.getElementById('fib-answer').value);
            });
        }, 50);
    }
}
window.renderCurrentQuestion = renderCurrentQuestion;

function submitAnswer(answer) {
    const { topic, currentQuestionIndex } = currentQuizState;
    const question = topic.quizzes[currentQuestionIndex];
    const isCorrect = question.type === 'mcq'
        ? answer === question.correct
        : String(answer).trim().toLowerCase() === String(question.correct).toLowerCase();

    // Brief visual feedback
    const container = document.getElementById('view-container');
    const flash = document.createElement('div');
    flash.style = `position:fixed; top:0; left:0; right:0; bottom:0; z-index:999; pointer-events:none;
        background:${isCorrect ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)'};
        animation: fadeIn 0.1s ease;`;
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 300);

    if (isCorrect) currentQuizState.score++;
    currentQuizState.answers.push({ question: question.q, correct: isCorrect });
    currentQuizState.currentQuestionIndex++;

    if (currentQuizState.currentQuestionIndex < topic.quizzes.length) {
        renderCurrentQuestion();
    } else {
        finishQuiz();
    }
}

function finishQuiz() {
    const { topic, score } = currentQuizState;
    const total        = topic.quizzes.length;
    const finalPercent = Math.round((score / total) * 100);
    const container    = document.getElementById('view-container');
    const earnedXP     = score * 10;

    if (finalPercent > (state.progress[topic.id] || 0)) {
        state.progress[topic.id] = finalPercent;
    }

    if (finalPercent >= 70) {
        const currentIndex = state.topics.findIndex(t => t.id === topic.id);
        if (currentIndex < state.topics.length - 1) {
            const nextTopic = state.topics[currentIndex + 1];
            if (!state.unlockedTopics.includes(nextTopic.id)) {
                state.unlockedTopics.push(nextTopic.id);
            }
        }
    }

    addXP(earnedXP);

    container.innerHTML = `
        <div class="quiz-result fade-in card text-center">
            <div style="font-size:4rem; margin-bottom:1rem;">${finalPercent >= 70 ? '🎉' : '💪'}</div>
            <h1 style="font-size:3rem; margin-bottom:0.5rem;">${finalPercent}%</h1>
            <p style="font-size:1.2rem; margin-bottom:2rem;">
                ${finalPercent >= 70 ? 'Ajoyib! Mavzuni muvaffaqiyatli topshirdingiz.' : 'Yana bir bor urinib ko\'ring!'}
            </p>
            <div class="result-stats" style="display:flex; justify-content:center; gap:2rem; margin-bottom:2rem; flex-wrap:wrap;">
                <div class="stat card" style="padding:1rem 2rem;">
                    <span style="display:block; font-size:0.85rem; color:var(--text-muted);">To'g'ri javoblar</span>
                    <strong style="font-size:1.5rem;">${score} / ${total}</strong>
                </div>
                <div class="stat card" style="padding:1rem 2rem;">
                    <span style="display:block; font-size:0.85rem; color:var(--text-muted);">XP to'pladingiz</span>
                    <strong style="font-size:1.5rem; color:var(--primary);">+${earnedXP}</strong>
                </div>
            </div>
            ${finalPercent >= 70 && state.topics.findIndex(t => t.id === topic.id) < state.topics.length - 1 ? `
                <p style="font-size:0.9rem; color:var(--success,#22c55e); margin-bottom:1rem;">
                    ✅ Keyingi mavzu ochildi!
                </p>` : ''}
            <div style="display:flex; gap:1rem; justify-content:center; flex-wrap:wrap;">
                ${finalPercent < 70 ? `<button class="primary-btn" onclick="window.startQuiz('${topic.id}')">Qayta urinish 🔄</button>` : ''}
                <button class="primary-btn" style="background:var(--border); color:var(--text-main);" onclick="appNavigate('topics')">Mavzularga qaytish</button>
            </div>
        </div>
    `;
}

// ─── Videos ────────────────────────────────────────────────────────────────

function renderVideos() {
    const container    = document.getElementById('view-container');
    const topicsWithVideos = state.topics.filter(t => t.videos?.length > 0);

    if (topicsWithVideos.length === 0) {
        container.innerHTML = `<div class="fade-in card" style="text-align:center; padding:3rem;">
            <p style="font-size:2rem;">🎥</p>
            <p style="color:var(--text-muted)">Hozircha videolar qo'shilmagan.</p>
        </div>`;
        return;
    }

    container.innerHTML = `
        <div class="fade-in">
            <h1 class="view-title">Video Darslar 🎥</h1>
            <div class="grid">
                ${topicsWithVideos.map(topic => `
                    <div class="card video-card">
                        <h3>${topic.icon} ${topic.title}</h3>
                        ${topic.videos.map(video => `
                            <div class="video-item" style="margin-top:1rem;">
                                <iframe width="100%" height="200"
                                    src="${video.url}"
                                    frameborder="0" allowfullscreen
                                    style="border-radius:var(--radius-md);">
                                </iframe>
                                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
                                    <span style="font-weight:500; font-size:0.9rem;">${video.title}</span>
                                    <button class="primary-btn btn-sm" onclick="window.rewardVideo('${video.xp}')">+${video.xp} XP</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function rewardVideo(xp) {
    addXP(parseInt(xp));
    const banner = document.createElement('div');
    banner.style = `position:fixed; top:20px; left:50%; transform:translateX(-50%);
        background:var(--primary); color:white; padding:0.8rem 1.5rem;
        border-radius:var(--radius-full); font-weight:700; z-index:9999;`;
    banner.textContent = `+${xp} XP to'plandi! ✨`;
    document.body.appendChild(banner);
    setTimeout(() => banner.remove(), 2000);
}

// ─── Leaderboard ───────────────────────────────────────────────────────────

async function renderLeaderboard() {
    const container = document.getElementById('view-container');
    container.innerHTML = `<div class="fade-in card"><h2>🏆 Top O'quvchilar</h2><p style="color:var(--text-muted)">Yuklanmoqda...</p></div>`;

    try {
        const { data, error } = await supabaseClient
            .from('student_progress')
            .select('student_id, name, xp, level')
            .order('xp', { ascending: false })
            .limit(20);

        if (error) throw error;

        const myId = authState.user.uid;
        const rows = (data || []).map((p, i) => {
            const isMe  = p.student_id === myId;
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`;
            return `<tr class="${isMe ? 'highlight' : ''}">
                <td style="font-size:1.1rem;">${medal}</td>
                <td>${isMe ? `<strong>${p.name || 'Siz'}</strong> 👈` : (p.name || 'O\'quvchi')}</td>
                <td><strong>${p.xp}</strong> XP</td>
                <td>${p.level}-daraja</td>
            </tr>`;
        }).join('');

        container.innerHTML = `
            <div class="fade-in card">
                <h2>🏆 Top O'quvchilar</h2>
                <p style="color:var(--text-muted); margin-bottom:1.5rem;">Umumiy ${data?.length || 0} ta o'quvchi</p>
                <table class="leaderboard-table">
                    <thead><tr><th>O'rin</th><th>Ism</th><th>XP</th><th>Daraja</th></tr></thead>
                    <tbody>${rows || '<tr><td colspan="4" style="text-align:center; padding:2rem; color:var(--text-muted)">Hali hech kim yo\'q</td></tr>'}</tbody>
                </table>
            </div>
        `;
    } catch (e) {
        container.innerHTML = `<div class="fade-in card">
            <h2>🏆 Top O'quvchilar</h2>
            <p style="color:var(--danger)">Yuklab bo'lmadi. Internet aloqasini tekshiring.</p>
        </div>`;
    }
}

// ─── Profile ───────────────────────────────────────────────────────────────

function renderProfile() {
    const container  = document.getElementById('view-container');
    const topicsDone = Object.values(state.progress).filter(p => p >= 70).length;

    container.innerHTML = `
        <div class="fade-in profile-view">
            <div class="card profile-header-card">
                <div class="large-avatar">👤</div>
                <h2>${state.user.name}</h2>
                <p>${authState.user?.email || ''}</p>
                <p style="margin-top:0.3rem; color:var(--text-muted);">${state.level}-daraja o'quvchi</p>
            </div>

            <div class="grid" style="margin-top:2rem;">
                <div class="card">
                    <h3>🎖 Yutuqlar</h3>
                    <div class="badges-container" style="display:flex; flex-wrap:wrap; gap:0.5rem; margin-top:1rem;">
                        ${state.xp > 0    ? '<span class="badge" title="Birinchi qadam">🎯 Birinchi qadam</span>' : ''}
                        ${state.level > 1 ? '<span class="badge" title="Bilimdon">🌟 Bilimdon</span>' : ''}
                        ${topicsDone >= 3 ? '<span class="badge" title="Matematik">🎓 Matematik</span>' : ''}
                        ${state.xp >= 500 ? '<span class="badge" title="XP Chempioni">🏅 XP Chempioni</span>' : ''}
                        ${state.xp === 0 && state.level === 1 ? '<p style="color:var(--text-muted); font-size:0.9rem;">Yutuqlarni qo\'lga kiriting!</p>' : ''}
                    </div>
                </div>
                <div class="card">
                    <h3>📈 Statistika</h3>
                    <div style="display:flex; flex-direction:column; gap:0.8rem; margin-top:1rem;">
                        <div style="display:flex; justify-content:space-between;">
                            <span>To'plangan XP</span><strong>${state.xp}</strong>
                        </div>
                        <div style="display:flex; justify-content:space-between;">
                            <span>Daraja</span><strong>${state.level}</strong>
                        </div>
                        <div style="display:flex; justify-content:space-between;">
                            <span>Yakunlangan mavzular</span><strong>${topicsDone} / ${state.topics.length}</strong>
                        </div>
                        <div style="display:flex; justify-content:space-between;">
                            <span>Faollik</span><strong>${state.streak} kun 🔥</strong>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

})(); // End of Student Namespace
