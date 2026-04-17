(function() {
// 2. App State
const state = {
    user: { name: 'O\'quvchi', id: 'guest' },
    currentPage: 'dashboard',
    xp: 0,
    level: 1,
    streak: 0,
    progress: {}, 
    unlockedTopics: [],
    topics: [], // To be loaded from cloud
    materials: {}
};

// Mock Upload for Study Materials
function mockUpload(topicId, type) {
    const fileName = prompt(`Yangi ${type.toUpperCase()} hujjat nomini kiriting:`);
    if (!fileName) return;

    const newFile = {
        name: fileName + (type === 'pdf' ? '.pdf' : '.docx'),
        type: type,
        url: '#' // In a real app, this would be the Firebase Storage URL
    };

    if (!state.materials[topicId]) {
        state.materials[topicId] = [];
    }
    state.materials[topicId].push(newFile);
    
    saveLocalData();
    renderTopics();
    alert("Hujjat muvaffaqiyatli biriktirildi! ✅");
}
window.mockUpload = mockUpload;

const routes = {
    dashboard: renderDashboard,
    topics: renderTopics,
    videos: renderVideos,
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

async function initStudentPanel() {
    try {
        console.log("Student Panel initializing...");
        window.appNavigate = navigate;
        window.startQuiz = (id) => navigate('quiz', id);
        window.submitAnswer = submitAnswer;
        window.rewardVideo = rewardVideo;
        window.mockUpload = mockUpload;
        
        renderStudentLayout();
        showLoading();
        await loadLocalData();
        setupNavigation();
        setupThemeToggle();
        updateHeaderStats();
        hideLoading();
        navigate('dashboard');
    } catch (e) {
        console.error("Initialization error:", e);
        hideLoading();
        navigate('dashboard');
    }
}

async function loadLocalData() {
    try {
        // 1. Load global topics from content.js or simulated admin state
        const adminDataRaw = localStorage.getItem('mq_admin_v2');
        if (adminDataRaw) {
            const adminData = JSON.parse(adminDataRaw);
            state.topics = adminData.topics || [];
            state.materials = adminData.materials || {};
        } else {
            state.topics = (typeof topics !== 'undefined' ? JSON.parse(JSON.stringify(topics)) : []);
            state.materials = {};
        }

        // 2. Load student-specific progress
        const studentId = authState.user.uid;
        const studentDataRaw = localStorage.getItem(`mq_student_v2_${studentId}`);
        if (studentDataRaw) {
            const data = JSON.parse(studentDataRaw);
            state.xp = data.xp || 0;
            state.level = data.level || 1;
            state.streak = data.streak || 0;
            state.progress = data.progress || {};
            state.unlockedTopics = data.unlockedTopics || [];
        } else {
            // New student initialization
            state.unlockedTopics = state.topics.length > 0 ? [state.topics[0].id] : [];
            await saveLocalData();
        }
    } catch(e) {
        console.error("Local load error", e);
    }
}

async function saveLocalData() {
    try {
        const studentId = authState.user.uid;
        localStorage.setItem(`mq_student_v2_${studentId}`, JSON.stringify({
            xp: state.xp,
            level: state.level,
            streak: state.streak,
            progress: state.progress,
            unlockedTopics: state.unlockedTopics,
            name: authState.user.email ? authState.user.email.split('@')[0] : 'Student'
        }));
    } catch(e) {
        console.error("Local save error", e);
    }
}

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
                </div>
                <div class="user-profile-summary">
                    <span id="header-username">${authState.user.email}</span>
                    <div class="header-avatar">👤</div>
                </div>
            </header>
            <div id="view-container"></div>
        </main>
    `;
}
window.initStudentPanel = initStudentPanel;

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
    toggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        toggle.querySelector('.icon').textContent = document.body.classList.contains('dark-theme') ? '☀️' : '🌙';
    });
}

function updateHeaderStats() {
    document.getElementById('xp-value').textContent = state.xp;
    document.getElementById('level-value').textContent = state.level;
    document.getElementById('streak-value').textContent = state.streak;
}

function addXP(amount) {
    state.xp += amount;
    // Level up logic (Level = 1 + floor(XP/100))
    const newLevel = Math.floor(state.xp / 100) + 1;
    if (newLevel > state.level) {
        state.level = newLevel;
        showLevelUpModal(newLevel);
    }
    updateHeaderStats();
    saveLocalData();
}

function showLevelUpModal(level) {
    alert(`Tabriklaymiz! Siz ${level}-darajaga chiqdingiz! 🎊`);
}

// Views
function renderDashboard() {
    const container = document.getElementById('view-container');
    container.innerHTML = `
        <div class="fade-in dashboard-view">
            <h1 class="view-title">Xush kelibsiz, ${state.user.name}! 👋</h1>
            <p class="view-subtitle" style="color:rgba(255,255,255,0.8)">Bugungi matematik sarguzashtingizni boshlang.</p>
            
            <div class="dashboard-grid grid">
                <div class="card daily-challenge">
                    <h3>📅 Kunlik Topshiriq</h3>
                    <p>Mavzulardan birini yakunlang va +50 XP oling!</p>
                </div>
                
                <div class="card progress-overview" style="color:var(--text-main)">
                    <h3>📊 Umumiy Progress</h3>
                    <div class="level-indicator">
                        <div class="level-ring">${state.level}</div>
                        <div class="xp-progress-bar">
                            <div class="fill" style="width: ${state.xp % 100}%"></div>
                        </div>
                    </div>
                    <p>Keyingi darajagacha <strong>${100 - (state.xp % 100)} XP</strong> qoldi.</p>
                </div>
            </div>

            <h2 style="margin-top: 3rem; margin-bottom: 2rem;">Tezkor Kirish</h2>
            <div class="grid">
                <div class="card access-card" onclick="appNavigate('topics')" style="color:var(--text-main)">
                    <div class="icon">📚</div>
                    <h4>Mavzular</h4>
                    <p>4 ta mavzu mavjud</p>
                </div>
                <div class="card access-card" onclick="appNavigate('videos')" style="color:var(--text-main)">
                    <div class="icon">🎥</div>
                    <h4>Videolar</h4>
                    <p>Darslarni ko'ring</p>
                </div>
            </div>
        </div>
    `;
}

function renderTopics() {
    const container = document.getElementById('view-container');
    container.innerHTML = `
        <div class="fade-in">
            <h1 class="view-title">Matematika Mavzulari 📚</h1>
            <div class="topics-grid grid">
                ${topics.map(topic => {
                    const isUnlocked = state.unlockedTopics.includes(topic.id);
                    const progress = state.progress[topic.id] || 0;
                    const materials = state.materials ? state.materials[topic.id] || [] : [];
                    
                    return `
                        <div class="card topic-card ${isUnlocked ? '' : 'locked'}">
                            <div class="topic-icon">${isUnlocked ? topic.icon : '🔒'}</div>
                            <h3>${topic.title}</h3>
                            <div class="progress-info">
                                <div class="progress-bar"><div class="fill" style="width: ${progress}%"></div></div>
                                <span>${progress}%</span>
                            </div>
                            
                            <!-- Study Materials Section -->
                            <div class="materials-section">
                                <h4>📖 O'quv materiallari</h4>
                                <div class="file-list" id="files-${topic.id}">
                                    ${materials.length > 0 ? materials.map(file => `
                                        <div class="file-item">
                                            <div class="file-info">
                                                <span class="file-icon">${file.type === 'pdf' ? '📄' : '📝'}</span>
                                                <span class="file-name">${file.name}</span>
                                            </div>
                                            <a href="${file.url}" target="_blank" class="btn-icon">⬇️</a>
                                        </div>
                                    `).join('') : '<p style="font-size:0.8rem; color:var(--text-muted)">Hozircha materiallar yo\'q.</p>'}
                                </div>
                                <div class="upload-area">
                                    <button class="btn-icon" title="PDF biriktirish" onclick="window.mockUpload('${topic.id}', 'pdf')">📄+</button>
                                    <button class="btn-icon" title="Word biriktirish" onclick="window.mockUpload('${topic.id}', 'doc')">📝+</button>
                                </div>
                            </div>

                            <button class="primary-btn" style="width:100%; margin-top:1rem;" ${isUnlocked ? `onclick="window.startQuiz('${topic.id}')"` : 'disabled'}>
                                ${isUnlocked ? 'Mashqni boshlash' : 'Qulflangan'}
                            </button>
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
    
    // Check if there are any materials for this topic
    const materials = state.materials ? state.materials[topicId] || [] : [];
    
    // First, show Theory introduction
    const container = document.getElementById('view-container');
    container.innerHTML = `
        <div class="theory-view fade-in card">
            <h2 class="view-title">${topic.title}: Nazariya 📖</h2>
            <div class="theory-content" style="font-size:1.2rem; margin:2rem 0; line-height:1.8;">
                <p>${topic.theory}</p>
            </div>
            
            ${materials.length > 0 ? `
            <div class="student-materials" style="margin:2rem 0; padding:1.5rem; background:rgba(var(--primary-rgb), 0.05); border-radius:var(--radius-md);">
                <h3 style="margin-bottom:1rem; display:flex; align-items:center; gap:0.5rem;"><span class="icon">📁</span> O'quv Materiallari</h3>
                <div class="file-list grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:1rem;">
                    ${materials.map((f, i) => `
                        <a href="${f.url}" target="_blank" class="file-item card" style="text-decoration:none; display:flex; align-items:center; gap:0.8rem; padding:1rem; transition:transform 0.2s; border:1px solid var(--border);">
                            <span style="font-size:2rem;">${f.type === 'pdf' ? '📄' : f.type === 'doc' ? '📝' : '📊'}</span>
                            <span style="font-weight:600; color:var(--text-main); word-break:break-all;">${f.name}</span>
                        </a>
                    `).join('')}
                </div>
            </div>
            ` : ''}

            <div class="theory-actions">
                <button class="primary-btn" onclick="window.renderCurrentQuestion()">Mashqni boshlash 🚀</button>
                <button class="primary-btn" style="background:var(--border); color:var(--text-main)" onclick="appNavigate('topics')">Orqaga</button>
            </div>
        </div>
    `;
}
window.renderCurrentQuestion = renderCurrentQuestion;

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

function finishQuiz() {
    const { topic, score } = currentQuizState;
    const finalPercent = Math.round((score / topic.quizzes.length) * 100);
    const container = document.getElementById('view-container');
    
    // Update progress
    if (finalPercent > (state.progress[topic.id] || 0)) {
        state.progress[topic.id] = finalPercent;
    }

    // Unlock next topic if score >= 70%
    if (finalPercent >= 70) {
        const currentIndex = topics.findIndex(t => t.id === topic.id);
        if (currentIndex < topics.length - 1) {
            const nextTopic = topics[currentIndex + 1];
            if (!state.unlockedTopics.includes(nextTopic.id)) {
                state.unlockedTopics.push(nextTopic.id);
            }
        }
    }

    const earnedXP = score * 10;
    addXP(earnedXP);

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
    saveLocalData();
}

function renderVideos() {
    const container = document.getElementById('view-container');
    container.innerHTML = `
        <div class="fade-in">
            <h1 class="view-title">Video Darslar 🎥</h1>
            <div class="grid">
                ${topics.map(topic => `
                    <div class="card video-card">
                        <h3>${topic.title}</h3>
                        ${topic.videos.map(video => `
                            <div class="video-item">
                                <iframe width="100%" height="200" src="${video.url}" frameborder="0" allowfullscreen></iframe>
                                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px;">
                                    <span>${video.title}</span>
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
    alert(`${xp} XP sovg'a qilindi!`);
}

function renderLeaderboard() {
    const container = document.getElementById('view-container');
    container.innerHTML = `
        <div class="fade-in card">
            <h2>🏆 Top O'quvchilar</h2>
            <p>Eng yaxshi bilimdonlar ro'yxati</p>
            <table class="leaderboard-table">
                <thead>
                    <tr><th>O'rin</th><th>Ism</th><th>XP</th></tr>
                </thead>
                <tbody>
                    <tr class="highlight"><td>1</td><td>Siz (${state.user.name})</td><td>${state.xp}</td></tr>
                    <tr><td>2</td><td>Azizbek</td><td>1250</td></tr>
                    <tr><td>3</td><td>Dilnoza</td><td>980</td></tr>
                    <tr><td>4</td><td>Mirodil</td><td>750</td></tr>
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
                <p>O'quvchi | ${state.level}-daraja</p>
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

// Global helpers moved to initStudentPanel

})(); // End of Student Namespace
