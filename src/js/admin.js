(function() {
// 1. Configuration (Uses centralized firebase-config.js)
// firebase.initializeApp(firebaseConfig); // Handled by auth.js or index.html
const db = firebase.firestore();

// 2. App State
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

// 3. App Logic
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

async function initAdminPanel() {
    try {
        console.log("Admin Panel initializing...");
        window.appNavigate = navigate;
        window.startQuiz = (id) => navigate('quiz', id);
        window.submitAnswer = submitAnswer;
        window.rewardVideo = rewardVideo;
        window.triggerUpload = triggerUpload;
        window.openEditTopic = openEditTopic;
        window.saveTopicEdit = saveTopicEdit;
        window.removeMaterial = removeMaterial;
        window.addQuestion = addQuestion;
        window.toggleQuizOptions = toggleQuizOptions;
        
        renderAdminLayout();
        showLoading();
        await loadCloudData();
        setupNavigation();
        setupThemeToggle();
        updateHeaderStats();
        hideLoading();
        console.log("Admin ready. Navigating to dashboard.");
        navigate('dashboard');
    } catch (e) {
        console.error("Initialization error:", e);
        hideLoading();
        navigate('dashboard');
    }
}

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
                    <span id="header-username">O'qituvchi</span>
                    <div class="header-avatar">👤</div>
                </div>
            </header>
            <div id="view-container"></div>
        </main>
    `;
}
window.initAdminPanel = initAdminPanel;

async function loadCloudData() {
    try {
        const doc = await db.collection('settings').doc('admin_v1').get();
        if (doc.exists) {
            const data = doc.data();
            state.xp = data.xp || 0;
            state.level = data.level || 1;
            state.streak = data.streak || 0;
            state.progress = data.progress || {};
            state.unlockedTopics = data.unlockedTopics || [];
            state.topics = data.topics || [];
            state.materials = data.materials || {};
        }

        // Migration check: if cloud is empty, check for local data
        if (state.topics.length === 0) {
            const keys = ['mathquest_admin_v1', 'mathquest_v1', 'mathquest_data'];
            for (let key of keys) {
                const localDataRaw = localStorage.getItem(key);
                if (localDataRaw) {
                    try {
                        const localData = JSON.parse(localDataRaw);
                        // Is it a state object or just a topics array?
                        const topicsToMigrate = localData.topics || (Array.isArray(localData) ? localData : null);
                        
                        if (topicsToMigrate && topicsToMigrate.length > 0) {
                            console.log(`Migration: Found data in ${key}. Restoring...`);
                            state.topics = topicsToMigrate;
                            state.xp = localData.xp || state.xp;
                            state.level = localData.level || state.level;
                            state.materials = localData.materials || state.materials || {};
                            state.unlockedTopics = localData.unlockedTopics || state.topics.map(t => t.id);
                            
                            await saveCloudData();
                            alert(`Eski mavzularingiz (${key}) topildi va yuklandi! 🔥✅`);
                            renderTopics();
                            return; 
                        }
                    } catch (e) {
                        console.error(`Migration error for key ${key}:`, e);
                    }
                }
            }
            
            // DEEP SCAN: If still empty, scan EVERYTHING in localStorage for anything resembling topics
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.includes('mathquest') || key.includes('admin') || key.includes('state')) {
                    const val = localStorage.getItem(key);
                    try {
                        const parsed = JSON.parse(val);
                        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].id && parsed[0].title) {
                            console.log("Deep scan found topics in key:", key);
                            state.topics = parsed;
                            await saveCloudData();
                            alert("Deep Scan: Mavzular topildi! ✅");
                            renderTopics();
                            return;
                        }
                    } catch(e) {}
                }
            }
        }
    } catch (e) {
        console.error("Cloud load error", e);
    }
}

async function saveCloudData() {
    try {
        await db.collection('settings').doc('admin_v1').set({
            xp: state.xp,
            level: state.level,
            streak: state.streak,
            progress: state.progress,
            unlockedTopics: state.unlockedTopics,
            topics: state.topics,
            materials: state.materials
        });
    } catch (e) {
        console.error("Cloud save error", e);
        alert("Xatolik: Ma'lumotlarni bulutga saqlab bo'lmadi. ❌");
    }
}

async function removeTopic(topicId) {
    if (confirm("Ushbu mavzuni butunlay o'chirib tashlamoqchimisiz? Barcha nazariya va testlar o'chib ketadi!")) {
        showLoading();
        state.topics = state.topics.filter(t => t.id !== topicId);
        state.unlockedTopics = state.unlockedTopics.filter(id => id !== topicId);
        delete state.materials[topicId];
        delete state.progress[topicId];
        
        await saveCloudData();
        hideLoading();
        renderTopics();
        alert("Mavzu muvaffaqiyatli o'chirildi! 🗑️");
    }
}
window.removeTopic = removeTopic;

async function restoreFromClipboard() {
    const dataRaw = prompt("Iltimos, avvaldan nusxalangan ma'lumotni shu yerga qo'ying (Paste):");
    if (dataRaw) {
        try {
            const parsed = JSON.parse(dataRaw);
            const topicsToMigrate = parsed.topics || (Array.isArray(parsed) ? parsed : null);
            if (topicsToMigrate && topicsToMigrate.length > 0) {
                state.topics = topicsToMigrate;
                state.xp = parsed.xp || 0;
                state.level = parsed.level || 1;
                state.materials = parsed.materials || {};
                state.unlockedTopics = parsed.unlockedTopics || state.topics.map(t => t.id);
                
                await saveCloudData();
                alert("Ma'lumotlar muvaffaqiyatli saqlandi! ✅");
                renderTopics();
            } else {
                alert("Xatolik: Ma'lumot formati noto'g'ri.");
            }
        } catch (e) {
            alert("Xatolik: Matnni o'qib bo'lmadi. JSON formatida ekanligiga ishonch hosil qiling.");
        }
    }
}
window.restoreFromClipboard = restoreFromClipboard;

function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-links li');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const page = item.getAttribute('data-page');
            navigate(page);
            
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
        });
    });

    const mobileBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.querySelector('.sidebar');
    if (mobileBtn) {
        mobileBtn.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }
}

function navigate(page, params = null) {
    if (routes[page]) {
        state.currentPage = page;
        routes[page](params);
        document.querySelector('.sidebar').classList.remove('active');
        window.scrollTo(0, 0);
    }
}

function setupThemeToggle() {
    const toggle = document.getElementById('theme-toggle');
    if (toggle) {
        toggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-theme');
            const icon = toggle.querySelector('.icon');
            if (icon) icon.textContent = document.body.classList.contains('dark-theme') ? '☀️' : '🌙';
        });
    }
}

function updateHeaderStats() {
    const xp = document.getElementById('xp-value');
    const level = document.getElementById('level-value');
    const streak = document.getElementById('streak-value');
    if (xp) xp.textContent = state.xp;
    if (level) level.textContent = state.level;
    if (streak) streak.textContent = state.streak;
}

// Loading functions removed, now using centralized window.showLoading/hideLoading from auth.js

async function addXP(amount) {
    state.xp += amount;
    const newLevel = Math.floor(state.xp / 100) + 1;
    if (newLevel > state.level) {
        state.level = newLevel;
        alert(`Tabriklaymiz! Siz ${newLevel}-darajaga chiqdingiz! 🎊`);
    }
    updateHeaderStats();
    await saveCloudData();
}

// Admin Topic Management
async function addTopic() {
    const title = document.getElementById('new-topic-title').value;
    
    if (!title) return alert("Mavzu nomini kiriting!");
    
    showLoading();
    const id = title.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const newTopic = {
        id: id,
        title: title,
        icon: '📚',
        theory: 'Ushbu mavzu uchun nazariya hali qo\'shilmagan.'
    };

    state.topics.push(newTopic);
    state.unlockedTopics.push(id);

    // Process all attached files
    const files = document.getElementById('new-topic-materials').files;
    state.materials[id] = [];
    
    for (let file of files) {
        const type = file.name.endsWith('.pdf') ? 'pdf' : (file.name.endsWith('.ppt') || file.name.endsWith('.pptx')) ? 'ppt' : 'doc';
        state.materials[id].push({
            name: file.name,
            type: type,
            url: '#' // Note: physical binary storage requires Firebase Storage
        });
    }

    await saveCloudData();
    hideLoading();
    renderTopics();
    alert("Yangi mavzu va fayllar muvaffaqiyatli saqlandi! ✅");
}
window.addTopic = addTopic;

// Simulated Physical Upload
async function triggerUpload(topicId, type) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = type === 'pdf' ? '.pdf' : type === 'doc' ? '.doc,.docx' : '.ppt,.pptx';
    
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        showLoading();
        const newFile = {
            name: file.name,
            type: type,
            url: '#' 
        };

        if (!state.materials[topicId]) {
            state.materials[topicId] = [];
        }
        state.materials[topicId].push(newFile);
        
        await saveCloudData();
        hideLoading();
        renderTopics();
        alert(`${file.name} muvaffaqiyatli biriktirildi! ✅`);
    };
    input.click();
}
window.triggerUpload = triggerUpload;

function renderDashboard() {
    const container = document.getElementById('view-container');
    const topicCount = state.topics.length;
    const materialCount = Object.values(state.materials).reduce((acc, curr) => acc + curr.length, 0);
    const videoCount = state.topics.reduce((acc, curr) => acc + (curr.videos ? curr.videos.length : 0), 0);

    container.innerHTML = `
        <div class="fade-in dashboard-view">
            <h1 class="view-title">Xush kelibsiz, ${state.user.name}! 👋</h1>
            <p class="view-subtitle">Bugungi MathQuest statistikangiz va kiritilgan ma'lumotlar:</p>
            
            <div class="dashboard-grid grid">
                <div class="card stat-card">
                    <div class="stat-icon">📚</div>
                    <div class="stat-info">
                        <h3>${topicCount}</h3>
                        <p>Mavzular</p>
                    </div>
                </div>
                <div class="card stat-card">
                    <div class="stat-icon">🎥</div>
                    <div class="stat-info">
                        <h3>${videoCount}</h3>
                        <p>Videolar</p>
                    </div>
                </div>
                <div class="card stat-card">
                    <div class="stat-icon">📄</div>
                    <div class="stat-info">
                        <h3>${materialCount}</h3>
                        <p>Materiallar</p>
                    </div>
                </div>
            </div>

            <div class="recent-activity mt-3">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
                    <h2>Sizning Mavzularingiz</h2>
                    <button class="primary-btn btn-sm" onclick="appNavigate('topics')">Barchasini ko'rish</button>
                </div>
                <div class="grid">
                    ${state.topics.slice(0, 4).map(topic => `
                        <div class="card topic-summary-card" onclick="appNavigate('topics')">
                            <span class="topic-icon-sm">${topic.icon || '📘'}</span>
                            <h4>${topic.title}</h4>
                            <p>${topic.quizzes ? topic.quizzes.length : 0} ta mashq</p>
                        </div>
                    `).join('')}
                    ${topicCount === 0 ? '<p style="grid-column: 1/-1; text-align:center; padding:2rem; color:var(--text-muted)">Hozircha mavzular kiritilmagan. "Mavzular" bo\'limidan yangi mavzu qo\'shing.</p>' : ''}
                </div>
            </div>
        </div>
    `;
}

function renderTopics() {
    const container = document.getElementById('view-container');
    container.innerHTML = `
        <div class="fade-in">
            <h1 class="view-title">Admin: Mavzularni boshqarish 🛠️</h1>
            
            <!-- Admin: Multi-input Topic Creator -->
            <div class="card admin-topic-form">
                <h3 style="display:flex; align-items:center; gap:0.5rem;"><span class="icon">🆕</span> Yangi mavzu qo'shish</h3>
                
                <div class="form-group" style="margin-top:1.5rem;">
                    <label>Mavzu nomi</label>
                    <input type="text" id="new-topic-title" class="form-input" placeholder="Masalan: Foizlar">
                </div>

                <div class="form-group" style="margin-top:1.5rem;">
                    <label>📁 O'quv materiallari (PDF/Word/PPT)</label>
                    <input type="file" id="new-topic-materials" class="form-input" accept=".pdf,.doc,.docx,.ppt,.pptx" multiple>
                    <p style="font-size:0.8rem; color:var(--text-muted); margin-top:0.5rem;">Bir vaqtning o'zida bir nechta fayl tanlashingiz mumkin.</p>
                </div>

                <div class="admin-form-actions">
                    <button class="primary-btn" onclick="window.addTopic()" style="padding: 0.8rem 2.5rem; font-size: 1rem;">Saqlash</button>
                </div>
            </div>

            <div class="topics-grid">
                ${state.topics.map(topic => {
                    const isUnlocked = state.unlockedTopics.includes(topic.id);
                    const progress = state.progress[topic.id] || 0;
                    const materials = state.materials ? state.materials[topic.id] || [] : [];
                    
                    return `
                        <div class="card topic-card ${isUnlocked ? '' : 'locked'}" style="padding: 1.5rem;">
                            <div class="topic-info-main">
                                <div style="display:flex; justify-content:space-between; align-items:center;">
                                    <h3 style="font-size:1.6rem; margin:0; font-weight:700; color:var(--text-main)">${topic.title}</h3>
                                    <div style="display:flex; gap:0.5rem;">
                                        <button class="btn-icon" onclick="window.openEditTopic('${topic.id.replace(/'/g, "\\'")}')" title="Tahrirlash" style="font-size:1.2rem; background:rgba(var(--primary-rgb), 0.1); border-radius:8px; padding:0.5rem;">✏️</button>
                                        <button class="btn-icon" onclick="window.removeTopic('${topic.id.replace(/'/g, "\\'")}')" title="O'chirish" style="font-size:1.2rem; background:rgba(239, 68, 68, 0.1); color:var(--danger); border-radius:8px; padding:0.5rem;">🗑️</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

function renderQuiz(topicId) {
    const topic = state.topics.find(t => t.id === topicId);
    if (!topic) return;

    currentQuizState = { topic, currentQuestionIndex: 0, score: 0, answers: [] };
    
    const container = document.getElementById('view-container');
    container.innerHTML = `
        <div class="theory-view fade-in card">
            <h2 class="view-title">${topic.title}: Nazariya 📖</h2>
            <div class="theory-content" style="font-size:1.2rem; margin:2rem 0; line-height:1.8;">
                <p>${topic.theory}</p>
            </div>
            <div class="theory-actions">
                <button class="primary-btn" onclick="window.renderCurrentQuestion()">Mashqni boshlash 🚀</button>
                <button class="primary-btn" style="background:var(--border); color:var(--text-main)" onclick="appNavigate('topics')">Orqaga</button>
            </div>
        </div>
    `;
}

function renderCurrentQuestion() {
    const { topic, currentQuestionIndex } = currentQuizState;
    const question = topic.quizzes[currentQuestionIndex];
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
                    ${question.type === 'mcq' ? 
                        question.options.map((opt, i) => `
                            <button class="option-btn" onclick="window.submitAnswer(${i})">${opt}</button>
                        `).join('') :
                        `<input type="text" id="fib-answer" placeholder="Javobni yozing..." class="fib-input">
                         <button class="primary-btn" onclick="window.submitAnswer(document.getElementById('fib-answer').value)">Yuborish</button>`
                    }
                </div>
            </div>
        </div>
    `;
}

function submitAnswer(answer) {
    const { topic, currentQuestionIndex } = currentQuizState;
    const question = topic.quizzes[currentQuestionIndex];
    let isCorrect = false;

    if (question.type === 'mcq') {
        isCorrect = (answer === question.correct);
    } else {
        isCorrect = (String(answer).trim().toLowerCase() === String(question.correct).toLowerCase());
    }

    if (isCorrect) {
        currentQuizState.score++;
    }

    currentQuizState.currentQuestionIndex++;
    if (currentQuizState.currentQuestionIndex < topic.quizzes.length) {
        renderCurrentQuestion();
    } else {
        finishQuiz();
    }
}

async function finishQuiz() {
    const { topic, score } = currentQuizState;
    const finalPercent = Math.round((score / topic.quizzes.length) * 100);
    const container = document.getElementById('view-container');
    
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

    const earnedXP = score * 10;
    await addXP(earnedXP);

    container.innerHTML = `
        <div class="quiz-result fade-in card text-center">
            <h1>Natija: ${finalPercent}%</h1>
            <p>${finalPercent >= 70 ? 'Ajoyib! Siz mavzuni muvaffaqiyatli topshirdingiz. 🎉' : 'Yana bir bor urinib ko\'ring! 💪'}</p>
            <div class="result-stats">
                <div class="stat"><span>To\'g\'ri javoblar:</span> <strong>${score} / ${topic.quizzes.length}</strong></div>
                <div class="stat"><span>XP to\'pladingiz:</span> <strong>+${earnedXP}</strong></div>
            </div>
            <button class="primary-btn" onclick="appNavigate('topics')">Mavzularga qaytish</button>
        </div>
    `;
    await saveCloudData();
}

function renderVideos() {
    const container = document.getElementById('view-container');
    container.innerHTML = `
        <div class="fade-in">
            <h1 class="view-title">Admin: Video darslarni boshqarish 🎥</h1>

            <!-- Admin: Add Video Form -->
            <div class="card admin-video-form" style="margin-bottom: 2rem;">
                <h3 style="display:flex; align-items:center; gap:0.5rem;"><span class="icon">➕</span> Yangi video qo'shish</h3>
                <div class="form-grid" style="margin-top:1.5rem;">
                    <div class="form-group">
                        <label>Mavzuni tanlang</label>
                        <select id="video-topic-id" class="form-input">
                            ${state.topics.map(t => `<option value="${t.id}">${t.title}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>YouTube Link (URL)</label>
                        <input type="text" id="video-url" class="form-input" placeholder="https://www.youtube.com/watch?v=...">
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
                            ${topic.videos && topic.videos.length > 0 ? topic.videos.map(video => `
                                <div class="video-item" style="margin-bottom:2rem; border-bottom:1px solid var(--border); padding-bottom:1rem;">
                                    <iframe width="100%" height="250" src="${video.url.replace('watch?v=', 'embed/')}" frameborder="0" allowfullscreen style="border-radius:var(--radius-md)"></iframe>
                                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px;">
                                        <span style="font-weight:600;">${video.title}</span>
                                        <button class="primary-btn btn-sm" onclick="window.rewardVideo('${video.xp}')">+${video.xp} XP</button>
                                    </div>
                                </div>
                            `).join('') : '<p style="color:var(--text-muted)">Ushbu mavzu uchun videolar hali yo\'q.</p>'}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

async function addVideo() {
    const topicId = document.getElementById('video-topic-id').value;
    let url = document.getElementById('video-url').value;

    if (!topicId || !url) return alert("Barcha maydonlarni to'ldiring!");

    showLoading();
    // Convert regular YouTube link to embed link if needed
    if (url.includes('watch?v=')) {
        url = url.replace('watch?v=', 'embed/');
    } else if (url.includes('youtu.be/')) {
        url = url.replace('youtu.be/', 'www.youtube.com/embed/');
    }

    const topic = state.topics.find(t => t.id === topicId);
    if (!topic) return;

    if (!topic.videos) topic.videos = [];
    topic.videos.push({
        title: "Video dars",
        url: url,
        xp: 20
    });

    await saveCloudData();
    hideLoading();
    renderVideos();
    alert("Video muvaffaqiyatli qo'shildi! 🎥✅");
}
window.addVideo = addVideo;

function rewardVideo(xp) {
    addXP(parseInt(xp));
    alert(`${xp} XP sovg'a qilindi!`);
}

function renderLeaderboard() {
    const container = document.getElementById('view-container');
    container.innerHTML = `
        <div class="fade-in card">
            <h2>🏆 Top O'quvchilar</h2>
            <p style="color:var(--text-muted); margin-bottom:1.5rem;">Hozircha o'quvchilar ro'yxati bo'sh. O'quvchilar paneli ishga tushgandan so'ng natijalar bu yerda ko'rinadi.</p>
            <table class="leaderboard-table">
                <thead>
                    <tr><th>O'rin</th><th>Ism</th><th>XP</th></tr>
                </thead>
                <tbody>
                    <tr><td colspan="3" style="text-align:center; padding: 2rem; color:var(--text-muted)">Ma'lumotlar yo'q</td></tr>
                </tbody>
            </table>
        </div>
    `;
}

function renderProfile() {
    const container = document.getElementById('view-container');
    container.innerHTML = `
        <div class="fade-in profile-view">
            <div class="card profile-header-card">
                <div class="large-avatar">👤</div>
                <h2>${state.user.name}</h2>
                <p>Admin | ${state.level}-daraja</p>
            </div>
            <div class="grid" style="margin-top: 2rem;">
                <div class="card">
                    <h3>🎖 Yutuqlar</h3>
                    <div class="badges-container">
                        ${state.xp > 0 ? '<span class="badge" title="Birinchi qadam">🎯</span>' : ''}
                        ${state.level > 1 ? '<span class="badge" title="Bilimdon">🌟</span>' : ''}
                        ${Object.keys(state.progress).length > 2 ? '<span class="badge" title="Matematik">🎓</span>' : ''}
                    </div>
                </div>
                <div class="card">
                    <h3>📈 Statistika</h3>
                    <p>To'plangan XP: <strong>${state.xp}</strong></p>
                    <p>Faollik: <strong>${state.streak} kun</strong></p>
                </div>
            </div>
        </div>
    `;
}

// Global Exports moved to initAdminPanel

function renderMustahkamlash() {
    const container = document.getElementById('view-container');
    container.innerHTML = `
        <div class="fade-in">
            <h1 class="view-title">Admin: Mavzularni mustahkamlash 🧱</h1>

            <!-- Admin: Add Quiz Question Form -->
            <div class="card admin-quiz-form" style="margin-bottom: 2rem;">
                <h3 style="display:flex; align-items:center; gap:0.5rem;"><span class="icon">📝</span> Yangi test savoli qo'shish</h3>
                <div class="form-grid" style="margin-top:1.5rem;">
                    <div class="form-group">
                        <label>Mavzuni tanlang</label>
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
                    <input type="text" id="quiz-question" class="form-input" placeholder="Masalan: 5 * 5 nechaga teng?">
                </div>
                
                <div id="mcq-options-area" style="margin-top:1rem;">
                    <label>Variantlar (vergul bilan ajrating)</label>
                    <input type="text" id="quiz-options" class="form-input" placeholder="20, 25, 30, 35">
                    <p style="font-size:0.8rem; color:var(--text-muted); margin-top:0.5rem;">To'g'ri javob tartib raqami (0 dan boshlab): <input type="number" id="quiz-correct-index" style="width:50px;" value="1"></p>
                </div>

                <div id="fib-answer-area" style="margin-top:1rem; display:none;">
                    <label>To'g'ri javob</label>
                    <input type="text" id="quiz-fib-answer" class="form-input" placeholder="25">
                </div>

                <div class="admin-form-actions">
                    <button class="primary-btn" onclick="window.addQuestion()">Savolni saqlash</button>
                </div>
            </div>

            <div class="grid">
                ${state.topics.map(topic => `
                    <div class="card">
                        <h3>${topic.title}</h3>
                        <p style="margin-bottom:1rem; color:var(--text-muted)">Mavjud savollar: ${topic.quizzes ? topic.quizzes.length : 0} ta</p>
                        <button class="primary-btn btn-sm" onclick="window.startQuiz('${topic.id.replace(/'/g, "\\'")}')">Mashqlarni ko'rish</button>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function toggleQuizOptions(type) {
    document.getElementById('mcq-options-area').style.display = type === 'mcq' ? 'block' : 'none';
    document.getElementById('fib-answer-area').style.display = type === 'fib' ? 'block' : 'none';
}
window.toggleQuizOptions = toggleQuizOptions;

async function addQuestion() {
    const topicId = document.getElementById('quiz-topic-id').value;
    const type = document.getElementById('quiz-type').value;
    const questionText = document.getElementById('quiz-question').value;

    if (!topicId || !questionText) return alert("Barcha maydonlarni to'ldiring!");

    showLoading();
    const topic = state.topics.find(t => t.id === topicId);
    if (!topic) return;
    if (!topic.quizzes) topic.quizzes = [];

    if (type === 'mcq') {
        const optionsText = document.getElementById('quiz-options').value;
        const correctIndex = parseInt(document.getElementById('quiz-correct-index').value);
        if (!optionsText) return alert("Variantlarni kiriting!");
        
        topic.quizzes.push({
            type: 'mcq',
            q: questionText,
            options: optionsText.split(',').map(s => s.trim()),
            correct: correctIndex,
            difficulty: 'medium'
        });
    } else {
        const correct = document.getElementById('quiz-fib-answer').value;
        if (!correct) return alert("To'g'ri javobni kiriting!");
        
        topic.quizzes.push({
            type: 'fib',
            q: questionText,
            correct: correct,
            difficulty: 'medium'
        });
    }

    await saveCloudData();
    hideLoading();
    renderMustahkamlash();
    alert("Savol muvaffaqiyatli qo'shildi! 📝✅");
}
window.addQuestion = addQuestion;

function openEditTopic(topicId) {
    const topic = state.topics.find(t => t.id === topicId);
    if (!topic) return;

    const container = document.getElementById('view-container');
    const materials = state.materials[topicId] || [];

    container.innerHTML = `
        <div class="fade-in">
            <h1 class="view-title">Mavzuni tahrirlash: ${topic.title} ✏️</h1>
            
            <div class="card admin-topic-form" style="position:relative; padding-bottom: 5rem;">
                <h3 style="display:flex; align-items:center; gap:0.5rem;"><span class="icon">📝</span> Mavzu ma'lumotlarini o'zgartirish</h3>
                
                <div class="form-group" style="margin-top:1.5rem;">
                    <label>Mavzu nomi</label>
                    <input type="text" id="edit-topic-title" class="form-input" value="${topic.title}">
                </div>

                <div class="form-group" style="margin-top:1.5rem;">
                    <label>📁 O'quv materiallari (PDF/Word/PPT qo'shish)</label>
                    <input type="file" id="edit-topic-materials" class="form-input" accept=".pdf,.doc,.docx,.ppt,.pptx" multiple>
                </div>

                <div class="materials-preview" style="margin-top:2rem; padding:1.5rem; background:rgba(var(--primary-rgb), 0.05); border-radius:var(--radius-md);">
                    <h4 style="margin-bottom:1rem; display:flex; align-items:center; gap:0.5rem;"><span class="icon">📁</span> Joriy materiallar:</h4>
                    <div class="file-list">
                        ${materials.length > 0 ? materials.map((f, i) => `
                            <div class="file-item" style="background:white; border:1px solid var(--border); display:flex; justify-content:space-between; align-items:center; padding:0.8rem; border-radius:8px; margin-bottom:0.5rem;">
                                <div style="display:flex; align-items:center; gap:0.8rem;">
                                    <span style="font-size:1.2rem;">${f.type === 'pdf' ? '📄' : f.type === 'doc' ? '📝' : '📊'}</span>
                                    <span style="font-weight:500;">${f.name}</span>
                                </div>
                                <button class="btn-icon" onclick="window.removeMaterial('${topicId.replace(/'/g, "\\'")}', ${i})" style="color:var(--accent-red); padding:5px;">🗑️</button>
                            </div>
                        `).join('') : '<p style="font-size:0.9rem; color:var(--text-muted)">Hali hech qanday material qo\'shilmagan.</p>'}
                    </div>
                </div>

                <div class="admin-form-actions" style="position:absolute; bottom:1.5rem; right:1.5rem; display:flex; gap:1rem;">
                    <button class="primary-btn" style="background:var(--border); color:var(--text-main); padding: 0.6rem 1.5rem;" onclick="appNavigate('topics')">Bekor qilish</button>
                    <button class="primary-btn" onclick="window.saveTopicEdit('${topicId}')" style="padding: 0.8rem 3rem; font-weight:700;">Saqlash</button>
                </div>
            </div>
        </div>
    `;
}
window.openEditTopic = openEditTopic;


async function saveTopicEdit(id) {
    const topic = state.topics.find(t => t.id === id);
    if (!topic) return;

    const newTitle = document.getElementById('edit-topic-title').value;
    const newFiles = document.getElementById('edit-topic-materials').files;

    if (!newTitle) return alert("Mavzu nomini kiriting!");

    showLoading();
    topic.title = newTitle;

    // Handle new file additions
    if (!state.materials[id]) state.materials[id] = [];
    for (let file of newFiles) {
        const type = file.name.endsWith('.pdf') ? 'pdf' : (file.name.endsWith('.ppt') || file.name.endsWith('.pptx')) ? 'ppt' : 'doc';
        state.materials[id].push({
            name: file.name,
            type: type,
            url: '#' 
        });
    }

    await saveCloudData();
    hideLoading();
    renderTopics();
    alert("Mavzu muvaffaqiyatli yangilandi! ✅");
}
window.saveTopicEdit = saveTopicEdit;

async function removeMaterial(topicId, index) {
    if (confirm("Ushbu materialni ro'yxatdan o'chirmoqchimisiz?")) {
        showLoading();
        state.materials[topicId].splice(index, 1);
        await saveCloudData();
        hideLoading();
        openEditTopic(topicId); // Refresh edit view
    }
}
})(); // End of Admin Namespace
