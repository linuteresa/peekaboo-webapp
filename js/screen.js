import { mk, esc, elephantSVG, hillsSVG } from './utils.js';
import { playPopSound, playSuccessSound, playErrorSound, playElephantSound, playProgressSound, setSoundEnabled } from './sounds.js';
import { state, getLevel, persistState } from './state.js';
import { CONFIGS, ALL_GAMES, LEVEL_THRESHOLDS } from './config.js';
import { runOCR } from './ocr.js';

function isItemUnlocked(game, type) {
    const games = ALL_GAMES[type];
    const idx = games.findIndex(g => g.id === game.id);
    return idx === 0 || state.completed.has(games[idx - 1].id);
}

function getNextItem(currentItem) {
    const games = ALL_GAMES[currentItem.type] || [];
    const idx = games.findIndex(item => item.id === currentItem.id);
    return idx >= 0 ? games[idx + 1] : null;
}

function formatNextLabel(item) {
    if (!item) return 'Continue';
    if (item.type === 'fill') return `Next word: ${item.letter}`;
    return `Next: ${item.letter}`;
}

function applyMascotFallback(root) {
    root.querySelectorAll('img[data-fallback="elephant"]').forEach(img => {
        const size = Number(img.dataset.fallbackSize) || img.width || 80;
        const applyFallback = () => {
            const wrap = document.createElement('div');
            wrap.innerHTML = elephantSVG(size);
            img.replaceWith(wrap.firstElementChild);
        };
        img.addEventListener('error', applyFallback, { once: true });
        if (img.complete && img.naturalWidth === 0) {
            applyFallback();
        }
    });
}

function scrollToTarget(root, targetId) {
    const target = root.querySelector(`#${targetId}`);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function renderLogin(navigate) {
    const div = mk('div', 'sky screen');
    div.innerHTML = `
        <div class="cloud c1"></div><div class="cloud c2"></div>
        <div class="content" style="align-items:center;justify-content:center;padding:32px 20px;gap:0;">
            <div style="animation:float 3s ease-in-out infinite;margin-bottom:-16px;z-index:2;">
                <img src="./assets/mascot.png" alt="Peekaboo Elephant" style="width:140px;height:140px;object-fit:contain;" data-fallback="elephant" data-fallback-size="100" />
            </div>
            <div class="login-card">
                <h2 class="fredoka" style="font-size:36px;background:linear-gradient(135deg,#FF6B35 0%,#FF9F2E 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;text-align:center;margin-bottom:8px;">Peekaboo Learn</h2>
                <p style="text-align:center;font-size:16px;color:#4B5563;margin-bottom:28px;font-weight:700;">What's your name, little explorer?</p>
                <input id="nameInput" class="name-input" placeholder="Type your name here 😊" />
                <button id="loginBtn" class="btn-orange" style="width:100%;margin-top:20px;opacity:0.5;pointer-events:none;">LET'S GO! 🚀</button>
                <p style="text-align:center;font-size:13px;color:#7B8896;margin-top:16px;font-weight:600;">No account needed — just start learning!</p>
            </div>
        </div>
        <div class="hills">${hillsSVG()}</div>
    `;
    applyMascotFallback(div);

    setTimeout(() => {
        const inp = div.querySelector('#nameInput');
        const btn = div.querySelector('#loginBtn');

        inp.addEventListener('input', () => {
            const v = inp.value.trim();
            btn.style.opacity = v ? '1' : '0.5';
            btn.style.pointerEvents = v ? 'auto' : 'none';
            if (v) playPopSound();
        });

        btn.addEventListener('click', () => {
            const n = inp.value.trim();
            if (n) {
                playSuccessSound();
                state.user = { name: n, score: 0 };
                setTimeout(() => navigate('home'), 300);
            }
        });

        inp.addEventListener('keydown', e => {
            if (e.key === 'Enter' && inp.value.trim()) {
                playSuccessSound();
                state.user = { name: inp.value.trim(), score: 0 };
                setTimeout(() => navigate('home'), 300);
            }
        });
        inp.focus();
    }, 0);
    return div;
}

export function renderHome(navigate) {
    const { completed } = state;
    const user = state.user || { name: 'Explorer', score: 0 };
    const level = getLevel(user.score);
    const nextT = LEVEL_THRESHOLDS[Math.min(level + 1, LEVEL_THRESHOLDS.length - 1)];
    const pct = level >= 5 ? 100 : Math.min(100, Math.round((user.score / nextT) * 100));
    const needsName = !state.user;

    const div = mk('div', 'sky screen');
    div.innerHTML = `
        <div class="cloud c1"></div><div class="cloud c2"></div><div class="cloud c3"></div>
        <div class="content">
            <div class="app-shell" id="homeTop">
                <div class="navbar">
                    <div class="logo-area">
                        <img src="./assets/mascot.png" alt="Peekaboo" class="logo-avatar" data-fallback="elephant" data-fallback-size="36" />
                        <div>
                            <div class="logo-title">Peekaboo Learn</div>
                            <div class="logo-subtitle">Play. Learn. Shine.</div>
                        </div>
                    </div>
                    <div class="nav-links">
                        <button class="nav-link active" type="button" data-scroll-target="homeTop">Home</button>
                        <button class="nav-link" type="button" data-scroll-target="howItWorksSection">How It Works</button>
                        <button class="nav-link" type="button" data-scroll-target="parentsSection">For Parents</button>
                    </div>
                    <button id="getStartedBtn" class="nav-cta" type="button">Get Started</button>
                </div>

                <div class="hero-panel">
                    <div class="hero-text">
                        <h1 class="hero-title">Learning is <span>More Fun</span> with <span class="hero-brand">Peekaboo Learn!</span></h1>
                        <p class="hero-subtitle">Interactive games and activities designed to help your child learn through play and joyful discovery.</p>
                        <button id="startBtn" class="btn-purple" type="button">Start Learning Now →</button>
                    </div>
                    <div class="hero-art">
                        <img src="./assets/mascot.png" alt="Peekaboo Elephant" class="hero-mascot" data-fallback="elephant" data-fallback-size="180" />
                        <div class="hero-chip chip-1">123</div>
                        <div class="hero-chip chip-2">A</div>
                        <div class="hero-chip chip-3">♪</div>
                    </div>
                </div>

                <div class="info-section" id="howItWorksSection">
                    <div class="section-title">How It Works</div>
                    <div class="section-subtitle">A simple, playful path to steady progress.</div>
                    <div class="steps-grid">
                        <div class="step-card">
                            <div class="step-icon">1</div>
                            <div>
                                <div class="step-title">Pick a game</div>
                                <div class="step-text">Choose letters, numbers, or words to explore.</div>
                            </div>
                        </div>
                        <div class="step-card">
                            <div class="step-icon">2</div>
                            <div>
                                <div class="step-title">Watch &amp; trace</div>
                                <div class="step-text">See the example and practice your draw.</div>
                            </div>
                        </div>
                        <div class="step-card">
                            <div class="step-icon">3</div>
                            <div>
                                <div class="step-title">Earn stars</div>
                                <div class="step-text">Get instant feedback and keep leveling up.</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="feature-strip" id="benefitsSection">
                    <div class="feature-card">
                        <div class="feature-icon">🎲</div>
                        <div>
                            <div class="feature-title">Learn Through Play</div>
                            <div class="feature-subtitle">Fun games that build skills naturally.</div>
                        </div>
                    </div>
                    <div class="feature-card">
                        <div class="feature-icon">🛡️</div>
                        <div>
                            <div class="feature-title">Safe &amp; Kid-Friendly</div>
                            <div class="feature-subtitle">A secure space made for kids.</div>
                        </div>
                    </div>
                    <div class="feature-card">
                        <div class="feature-icon">🏆</div>
                        <div>
                            <div class="feature-title">Track Progress</div>
                            <div class="feature-subtitle">See your child grow and shine.</div>
                        </div>
                    </div>
                    <div class="feature-card">
                        <div class="feature-icon">💜</div>
                        <div>
                            <div class="feature-title">Loved by Parents</div>
                            <div class="feature-subtitle">Thousands of happy families.</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="app-shell" id="gameSection">
                <div class="dashboard-preview" id="parentsSection">
                    <div class="dashboard-header">
                        <div>
                            <div class="section-title">Choose a learning adventure</div>
                            <div class="section-subtitle">Pick a game below and keep the streak going.</div>
                        </div>
                        <div class="stat-pills">
                            <div class="stat-pill">⭐ Level ${level}</div>
                            <div class="stat-pill">🏆 ${user.score} pts</div>
                            <div class="stat-pill">📚 ${completed.size} lessons</div>
                        </div>
                    </div>
                    <div class="tiles-wrap">
                        <div class="tiles-grid" id="tilesGrid"></div>
                    </div>
                    <div class="dashboard-actions">
                        <div class="progress-card">
                            <div class="progress-icon">⭐</div>
                            <div style="flex:1;">
                                <div class="progress-row">
                                    <span>Level ${level}</span>
                                    <span>${user.score} pts</span>
                                </div>
                                <div class="progress-bar">
                                    <div style="width:${pct}%;"></div>
                                </div>
                                <div class="progress-caption">${completed.size} lessons done</div>
                            </div>
                        </div>
                        <button class="btn-orange" id="dashBtn" type="button">Parent Dashboard</button>
                    </div>
                </div>
            </div>
            ${needsName ? `
            <div class="welcome-overlay" id="welcomeOverlay">
                <div class="welcome-modal">
                    <img src="./assets/mascot.png" alt="Peekaboo Elephant" class="welcome-mascot" data-fallback="elephant" data-fallback-size="120" />
                    <div class="login-card">
                        <h2 class="fredoka" style="font-size:32px;background:linear-gradient(135deg,#FF6B35 0%,#FF9F2E 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;text-align:center;margin-bottom:8px;">Welcome!</h2>
                        <p style="text-align:center;font-size:15px;color:#4B5563;margin-bottom:22px;font-weight:700;">What's your name, little explorer?</p>
                        <input id="welcomeNameInput" class="name-input" placeholder="Type your name here 😊" />
                        <button id="welcomeStartBtn" class="btn-orange" style="width:100%;margin-top:16px;opacity:0.5;pointer-events:none;">LET'S GO! 🚀</button>
                        <p style="text-align:center;font-size:13px;color:#7B8896;margin-top:14px;font-weight:600;">No account needed — just start learning!</p>
                    </div>
                </div>
            </div>` : ''}
        </div>
        <div class="hills">${hillsSVG()}</div>
    `;
    applyMascotFallback(div);

    setTimeout(() => {
        const start = () => {
            const section = div.querySelector('#gameSection');
            if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
            playPopSound();
        };

        if (state.pendingScrollTarget) {
            const target = state.pendingScrollTarget;
            state.pendingScrollTarget = null;
            const el = div.querySelector(`#${target}`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        const navLinks = Array.from(div.querySelectorAll('.nav-link'));
        navLinks.forEach(btn => {
            btn.addEventListener('click', () => {
                navLinks.forEach(link => link.classList.remove('active'));
                btn.classList.add('active');
                scrollToTarget(div, btn.dataset.scrollTarget);
                playPopSound();
            });
        });
        div.querySelector('#startBtn').addEventListener('click', start);
        div.querySelector('#getStartedBtn').addEventListener('click', start);
        div.querySelector('#dashBtn').addEventListener('click', () => {
            playPopSound();
            navigate('dashboard');
        });

        if (needsName) {
            const nameInput = div.querySelector('#welcomeNameInput');
            const startBtn = div.querySelector('#welcomeStartBtn');
            const enableStart = () => {
                const v = nameInput.value.trim();
                startBtn.style.opacity = v ? '1' : '0.5';
                startBtn.style.pointerEvents = v ? 'auto' : 'none';
                if (v) playPopSound();
            };
            nameInput.addEventListener('input', enableStart);
            startBtn.addEventListener('click', () => {
                const n = nameInput.value.trim();
                if (n) {
                    playSuccessSound();
                    state.user = { name: n, score: 0 };
                    persistState();
                    setTimeout(() => navigate('home'), 200);
                }
            });
            nameInput.addEventListener('keydown', e => {
                if (e.key === 'Enter' && nameInput.value.trim()) {
                    playSuccessSound();
                    state.user = { name: nameInput.value.trim(), score: 0 };
                    persistState();
                    setTimeout(() => navigate('home'), 200);
                }
            });
            nameInput.focus();
        }

        const grid = div.querySelector('#tilesGrid');
        [
            { type: 'letter', unlockAt: 0 },
            { type: 'number', unlockAt: 1 },
            { type: 'fill', unlockAt: 2 },
            { type: 'speak', unlockAt: 3 },
        ].forEach(({ type, unlockAt }) => {
            const cfg = CONFIGS[type];
            const unlocked = level >= unlockAt;
            const doneCount = ALL_GAMES[type].filter(g => state.completed.has(g.id)).length;
            const outer = mk('div', 'tile-outer');
            
            if (!unlocked) outer.style.cursor = 'not-allowed';
            
            outer.innerHTML = `
                <div class="tile-char">${unlocked ? cfg.emoji : '🔒'}</div>
                <div class="tile-card" style="background:${unlocked ? cfg.grad : 'linear-gradient(160deg,#B0BEC5,#78909C)'};box-shadow:0 7px 0 ${unlocked ? cfg.shadow : '#546E7A'};">
                    ${!unlocked ? `<div class="tile-locked"></div>` : ''}
                    <div class="tile-label">${cfg.label}</div>
                    ${unlocked ? `<div class="tile-badge">${doneCount}/${ALL_GAMES[type].length} done</div>` : `<div class="tile-badge">Level ${unlockAt} needed</div>`}
                </div>
            `;
            
            if (unlocked) {
                outer.addEventListener('click', () => {
                    playPopSound();
                    state.gameType = type;
                    navigate('gameList');
                });
            }
            grid.appendChild(outer);
        });
    }, 0);
    return div;
}

export function renderDashboard(navigate) {
    const { completed } = state;
    const user = state.user || { name: 'Explorer', score: 0 };
    const level = getLevel(user.score);
    const nextT = LEVEL_THRESHOLDS[Math.min(level + 1, LEVEL_THRESHOLDS.length - 1)];
    const pct = level >= 5 ? 100 : Math.min(100, Math.round((user.score / nextT) * 100));
    const allItems = Object.values(ALL_GAMES).flat();

    const progressRows = allItems
        .map(item => {
            const prof = state.proficiency[item.id] || { successes: 0, attempts: 0 };
            const successRate = prof.attempts ? prof.successes / prof.attempts : 1;
            return { item, prof, successRate };
        })
        .filter(entry => entry.prof.attempts > 0 && !completed.has(entry.item.id))
        .sort((a, b) => a.successRate - b.successRate)
        .slice(0, 3);

    const achievements = allItems.filter(item => completed.has(item.id)).slice(-3);
    const suggestion = progressRows[0]?.item || allItems.find(item => !completed.has(item.id));

    const formatItemLabel = item => {
        if (!item) return 'Keep exploring';
        if (item.type === 'letter') return `Letter ${item.letter}`;
        if (item.type === 'number') return `Number ${item.letter}`;
        return item.letter;
    };

    const renderProgressRows = () => {
        if (progressRows.length === 0) {
            return `<div class="empty-state">No struggle spots yet — fantastic job!</div>`;
        }
        return progressRows.map(({ item, prof, successRate }) => {
            const rate = Math.round(successRate * 100);
            return `
                <div class="metric-row">
                    <div>
                        <div class="metric-title">${formatItemLabel(item)}</div>
                        <div class="metric-subtitle">${prof.successes}/${prof.attempts} correct</div>
                    </div>
                    <div class="metric-bar">
                        <div style="width:${rate}%;"></div>
                    </div>
                    <div class="metric-rate">${rate}%</div>
                </div>
            `;
        }).join('');
    };

    const renderAchievements = () => {
        if (achievements.length === 0) {
            return `<div class="empty-state">Complete a lesson to earn badges.</div>`;
        }
        return achievements.map(item => `
            <div class="achievement-pill">${formatItemLabel(item)}</div>
        `).join('');
    };

    const div = mk('div', 'sky screen');
    div.innerHTML = `
        <div class="cloud c1"></div><div class="cloud c2"></div><div class="cloud c3"></div>
        <div class="content">
            <div class="app-shell">
                <div class="dashboard-titlebar" id="dashboardTop">
                    <button id="backBtn" class="chip-btn" type="button">← Back</button>
                    <div>
                        <div class="dashboard-title">Parent Dashboard</div>
                        <div class="dashboard-subtitle">A joyful snapshot of ${esc(user.name)}'s learning journey.</div>
                    </div>
                </div>
                <div class="dashboard-shell">
                    <div class="dashboard-sidebar">
                        <div class="profile-card">
                            <img src="./assets/mascot.png" alt="Peekaboo" class="profile-avatar" data-fallback="elephant" data-fallback-size="60" />
                            <div class="profile-name">${esc(user.name)}</div>
                            <div class="profile-sub">Level ${level} Explorer</div>
                        </div>
                        <button class="sidebar-link active" type="button" data-dash-target="dashboardTop">🏠 Home</button>
                        <button class="sidebar-link" type="button" data-dash-target="dashboardGames">🎮 Games</button>
                        <button class="sidebar-link" type="button" data-dash-target="dashboardAchievements">🏆 Achievements</button>
                        <button class="sidebar-link" type="button" data-dash-target="dashboardParents">👨‍👩‍👧 Parents</button>
                        <button class="sidebar-link" type="button" data-dash-target="dashboardSettings">⚙️ Settings</button>
                    </div>
                    <div class="dashboard-main">
                        <div class="dashboard-card" id="dashboardProgress">
                            <div class="card-header">
                                <div>
                                    <div class="card-title">Progress Overview</div>
                                    <div class="card-subtitle">Keep celebrating every small win.</div>
                                </div>
                                <div class="score-bubble">⭐ ${user.score}</div>
                            </div>
                            <div class="progress-summary">
                                <div class="summary-pill">Level ${level}</div>
                                <div class="summary-pill">${completed.size} lessons done</div>
                                <div class="summary-pill">${allItems.length - completed.size} to go</div>
                            </div>
                            <div class="progress-bar large">
                                <div style="width:${pct}%;"></div>
                            </div>
                            <div class="progress-caption">Next level at ${nextT} points</div>
                        </div>
                        <div class="dashboard-card" id="dashboardStruggles">
                            <div class="card-title">Struggle Spots</div>
                            <div class="card-subtitle">These are great opportunities for practice.</div>
                            <div class="metric-list">
                                ${renderProgressRows()}
                            </div>
                        </div>
                    </div>
                    <div class="dashboard-side">
                        <div class="dashboard-card" id="dashboardAchievements">
                            <div class="card-title">Achievements</div>
                            <div class="achievement-list">
                                ${renderAchievements()}
                            </div>
                        </div>
                        <div class="dashboard-card" id="dashboardGames">
                            <div class="card-title">Try Next</div>
                            <div class="try-next">
                                <div class="try-icon">✨</div>
                                <div>
                                    <div class="try-title">${formatItemLabel(suggestion)}</div>
                                    <div class="try-subtitle">Suggested practice</div>
                                </div>
                            </div>
                            <button id="practiceBtn" class="btn-purple small" type="button">Start Practice</button>
                        </div>
                        <div class="dashboard-card" id="dashboardParents">
                            <div class="card-title">Parent Tips</div>
                            <div class="card-subtitle">Small routines that build big wins.</div>
                            <div class="parent-tips">
                                <div class="tip-item">Read the letter out loud together.</div>
                                <div class="tip-item">Celebrate effort, not just correctness.</div>
                                <div class="tip-item">Practice for 5 minutes, then take a break.</div>
                            </div>
                        </div>
                        <div class="dashboard-card" id="dashboardSettings">
                            <div class="card-title">Settings</div>
                            <div class="card-subtitle">Learning preferences at a glance.</div>
                            <div class="settings-list">
                                <div class="setting-row"><span>Sound effects</span><button id="soundToggle" class="setting-toggle" type="button">${state.settings?.sound !== false ? 'On' : 'Off'}</button></div>
                                <div class="setting-row"><span>Reward stories</span><button id="rewardStoriesToggle" class="setting-toggle" type="button">${state.settings?.rewardStories !== false ? 'On' : 'Off'}</button></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="hills">${hillsSVG()}</div>
    `;
    applyMascotFallback(div);

    setTimeout(() => {
        div.querySelector('#backBtn').addEventListener('click', () => {
            playPopSound();
            navigate('home');
        });
        const sidebarLinks = Array.from(div.querySelectorAll('.sidebar-link'));
        sidebarLinks.forEach(link => {
            link.addEventListener('click', () => {
                sidebarLinks.forEach(item => item.classList.remove('active'));
                link.classList.add('active');
                scrollToTarget(div, link.dataset.dashTarget);
                playPopSound();
            });
        });
        div.querySelector('#practiceBtn').addEventListener('click', () => {
            playPopSound();
            if (suggestion) {
                state.currentItem = suggestion;
                state.gameType = suggestion.type;
                navigate('gamePage');
            } else {
                navigate('home');
            }
        });
    }, 0);

    return div;
}

export function renderGameList(navigate) {
    const { gameType, completed } = state;
    const cfg = CONFIGS[gameType];
    const games = ALL_GAMES[gameType];
    const doneCount = games.filter(g => completed.has(g.id)).length;
    const pct = games.length > 0 ? Math.round((doneCount / games.length) * 100) : 0;

    const div = mk('div', 'sky screen');
    div.innerHTML = `
        <div class="cloud c1"></div><div class="cloud c2"></div>
        <div class="content">
            <div class="game-header" style="background:${cfg.grad};box-shadow:0 4px 0 ${cfg.shadow};">
                <button id="backBtn" style="background:rgba(255,255,255,0.25);border:2px solid rgba(255,255,255,0.4);color:white;border-radius:50px;padding:8px 18px;font-weight:800;font-size:14px;align-self:flex-start;">← Back</button>
                <div style="display:flex;align-items:center;gap:12px;margin-top:6px;">
                    <span style="font-size:38px;">${cfg.emoji}</span>
                    <div style="flex:1;">
                        <h1 class="fredoka" style="color:white;font-size:24px;text-shadow:2px 3px 0 rgba(0,0,0,0.18);margin-bottom:5px;">${cfg.title}</h1>
                        <div style="display:flex;align-items:center;gap:8px;">
                            <div style="flex:1;background:rgba(255,255,255,0.25);border-radius:20px;height:10px;overflow:hidden;">
                                <div style="width:${pct}%;height:100%;background:white;border-radius:20px;transition:width 0.8s;"></div>
                            </div>
                            <span style="color:white;font-size:13px;font-weight:800;">${doneCount}/${games.length}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div id="gameList" style="overflow-y:auto;flex:1;padding:14px 16px 80px;"></div>
        </div>
        <div class="hills">${hillsSVG()}</div>
    `;

    setTimeout(() => {
        div.querySelector('#backBtn').addEventListener('click', () => {
            playPopSound();
            navigate('home');
        });
        const list = div.querySelector('#gameList');

        const sortedGames = [...games].sort((a, b) => {
            const isUnlockedA = isItemUnlocked(a, gameType);
            const isUnlockedB = isItemUnlocked(b, gameType);
            const completedA = completed.has(a.id);
            const completedB = completed.has(b.id);

            if (!isUnlockedA && !isUnlockedB) return 0;
            if (!isUnlockedA) return 1;
            if (!isUnlockedB) return -1;

            if (completedA && !completedB) return 1;
            if (!completedA && completedB) return -1;
            if (completedA && completedB) return 0;

            const profA = state.proficiency[a.id];
            const profB = state.proficiency[b.id];

            const successRateA = profA ? profA.successes / profA.attempts : 1;
            const successRateB = profB ? profB.successes / profB.attempts : 1;

            return successRateA - successRateB;
        });

        sortedGames.forEach(game => {
            const unlocked = isItemUnlocked(game, gameType);
            const done = completed.has(game.id);
            const item = mk('div', 'game-list-item' + (done ? ' done' : ''));

            if (!unlocked) { item.style.opacity = '0.55'; item.style.cursor = 'not-allowed'; }

            item.innerHTML = `
                <div class="item-icon" style="background:${done ? '#D1FAE5' : unlocked ? cfg.bg : '#F3F4F6'};color:${done ? '#059669' : cfg.color};">
                    ${done ? '✓' : unlocked ? game.letter : '🔒'}
                </div>
                <div style="flex:1;">
                    <div style="font-weight:800;font-size:16px;color:#1E293B;">${gameType === 'letter' ? 'Letter ' + game.letter : gameType === 'number' ? 'Number ' + game.letter : game.letter}</div>
                    <div style="font-size:12px;color:${done ? '#059669' : '#6B7280'};margin-top:2px;">${done ? 'Completed ⭐' : unlocked ? '+' + game.points + ' points' : 'Complete previous to unlock'}</div>
                </div>
                ${unlocked ? `<div style="width:32px;height:32px;border-radius:50%;background:${cfg.grad};display:flex;align-items:center;justify-content:center;color:white;font-size:14px;font-weight:900;box-shadow:0 3px 0 ${cfg.shadow};">▶</div>` : ''}
            `;

            if (unlocked) {
                item.addEventListener('click', () => {
                    playPopSound();
                    state.currentItem = game;
                    navigate('gamePage');
                });
            }
            list.appendChild(item);
        });
    }, 50);
    return div;
}

export function renderGamePage(navigate) {
    const { currentItem } = state;
    const cfg = CONFIGS[currentItem.type];
    const nextItem = getNextItem(currentItem);

    const div = mk('div', 'sky screen');

    div.innerHTML = `
        <div class="cloud c1"></div><div class="cloud c2"></div>
        <div class="content" style="padding: 16px 20px; display: flex; flex-direction: column;">

            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 16px;">
                <button id="backBtn" style="background:rgba(255,255,255,0.25); border:2px solid rgba(255,255,255,0.4); color:white; border-radius:50px; padding:8px 16px; font-weight:800; font-size:13px;">← Back</button>
                <div style="font-size: 24px; font-weight: 900; color: white; text-shadow: 2px 3px 0 rgba(0,0,0,0.18);">${cfg.emoji} ${currentItem.letter}</div>
                <div style="width: 60px;"></div>
            </div>

            <div style="display: flex; gap: 14px; flex: 1; overflow: auto;">
                <div style="flex: 1; min-width: 0; display: flex; flex-direction: column;">
                    <div style="background: white; border-radius: 18px; padding: 10px; box-shadow: 0 6px 16px rgba(0,0,0,0.12); flex-shrink: 0;">
                        <h4 class="fredoka" style="color: ${cfg.dark}; text-align: center; margin-bottom: 8px; font-size: 14px;">Watch & Learn!</h4>
                        <div style="position: relative; padding-bottom: 56.25%; height: 0; border-radius: 12px; overflow: hidden;">
                            <iframe style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;"
                                    src="https://www.youtube.com/embed/${currentItem.vid}?rel=0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                        </div>
                    </div>
                </div>

                <div style="flex: 1; min-width: 0; background: white; border-radius: 18px; padding: 16px; box-shadow: 0 6px 16px rgba(0,0,0,0.12); display: flex; flex-direction: column; align-items: center;">
                    <h4 class="fredoka" style="color: ${cfg.dark}; margin-bottom: 8px; font-size: 14px;">Your Turn!</h4>
                    <p style="color: #6B7280; font-size: 12px; margin-bottom: 12px; text-align: center;">Draw <strong>${currentItem.letter}</strong>:</p>

                    <div style="border: 3px dashed #CBD5E1; border-radius: 16px; width: 100%; flex: 1; position: relative; background: #F8FAFC; touch-action: none; min-height: 200px;">
                        <canvas id="drawCanvas" style="width: 100%; height: 100%; border-radius: 16px; display: block;"></canvas>
                        <div id="ocrResult" style="position: absolute; bottom: 8px; left: 0; right: 0; text-align: center; font-weight: 700; color: ${cfg.dark}; font-size: 14px; pointer-events: none; text-shadow: 1px 1px 0px white;"></div>
                    </div>

                    <div id="controlsDiv" style="display: flex; gap: 10px; margin-top: 12px; width: 100%;">
                        <button id="clearBtn" style="flex: 1; padding: 10px; border-radius: 10px; background: #F1F5F9; color: #475569; font-weight: 800; font-size: 14px;">Clear</button>
                        <button id="checkBtn" style="flex: 1.5; padding: 10px; border-radius: 10px; background: ${cfg.grad}; color: white; font-weight: 800; font-size: 14px; box-shadow: 0 4px 0 ${cfg.shadow};">Check! ✨</button>
                    </div>

                    <button id="finishBtn" class="btn-orange" style="display: none; width: 100%; margin-top: 12px; padding: 12px; font-size: 16px;">Continue 🌟</button>
                </div>
            </div>
        </div>
        <div class="hills" style="opacity: 0.7;">${hillsSVG()}</div>
    `;


    setTimeout(() => {
        playElephantSound();
        let autoAdvanceTimer = null;

        div.querySelector('#backBtn').addEventListener('click', () => {
            if (autoAdvanceTimer) {
                clearTimeout(autoAdvanceTimer);
                autoAdvanceTimer = null;
            }
            playPopSound();
            navigate('gameList');
        });

        const canvas = div.querySelector('#drawCanvas');
        const ctx = canvas.getContext('2d');
        const clearBtn = div.querySelector('#clearBtn');
        const checkBtn = div.querySelector('#checkBtn');
        const finishBtn = div.querySelector('#finishBtn');
        const controlsDiv = div.querySelector('#controlsDiv');
        const resultText = div.querySelector('#ocrResult');

        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        
        ctx.lineWidth = 14;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = cfg.color;

        let isDrawing = false;

        function getPos(e) {
            const rect = canvas.getBoundingClientRect();
            const clientX = e.clientX || (e.touches && e.touches[0].clientX);
            const clientY = e.clientY || (e.touches && e.touches[0].clientY);
            return {
                x: clientX - rect.left,
                y: clientY - rect.top
            };
        }

        function start(e) {
            isDrawing = true;
            const pos = getPos(e);
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
            e.preventDefault();
        }

        function draw(e) {
            if (!isDrawing) return;
            const pos = getPos(e);
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
            e.preventDefault();
        }

        function stop(e) {
            if (isDrawing) {
                ctx.stroke();
                ctx.beginPath();
                isDrawing = false;
            }
        }

        canvas.addEventListener('mousedown', start);
        canvas.addEventListener('mousemove', draw);
        canvas.addEventListener('mouseup', stop);
        canvas.addEventListener('mouseout', stop);
        canvas.addEventListener('touchstart', start, { passive: false });
        canvas.addEventListener('touchmove', draw, { passive: false });
        canvas.addEventListener('touchend', stop);
   
        clearBtn.addEventListener('click', () => {
            playPopSound();
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            resultText.textContent = '';
        });

        checkBtn.addEventListener('click', async () => {
            resultText.textContent = 'Checking... 👀';
            checkBtn.style.opacity = '0.5';
            checkBtn.disabled = true;

            try {
                const result = await runOCR(canvas, currentItem.letter, currentItem.type);

                if (!state.proficiency[currentItem.id]) {
                    state.proficiency[currentItem.id] = { successes: 0, attempts: 0 };
                }
                state.proficiency[currentItem.id].attempts += 1;

                if (result.pass) {
                    resultText.textContent = 'Correct! 🎉';
                    resultText.style.color = '#10B981';
                    playSuccessSound();

                    state.proficiency[currentItem.id].successes += 1;
                    state.completed.add(currentItem.id);
                    const prevScore = state.user.score;
                    state.user.score += currentItem.points;
                    const leveledUp = LEVEL_THRESHOLDS.some((t, i) => prevScore < t && state.user.score >= t);

                    setTimeout(() => {
                        controlsDiv.style.display = 'none';
                        finishBtn.style.display = 'block';
                        if (leveledUp) {
                            finishBtn.textContent = '🎉 LEVEL UP! 🎉';
                            finishBtn.dataset.leveledUp = 'true';
                        } else if (nextItem) {
                            finishBtn.textContent = formatNextLabel(nextItem);
                            finishBtn.dataset.leveledUp = 'false';
                            autoAdvanceTimer = setTimeout(() => {
                                playProgressSound();
                                state.currentItem = nextItem;
                                navigate('gamePage');
                            }, 1200);
                        } else {
                            finishBtn.textContent = 'Back to list';
                            finishBtn.dataset.leveledUp = 'false';
                        }
                    }, 600);
                } else {
                    resultText.textContent = result.message || 'Try again! ✏️';
                    resultText.style.color = '#EF4444';
                    playErrorSound();
                }
            } catch (err) {
                resultText.textContent = 'Oops! Error checking. Try again.';
                playErrorSound();
            } finally {
                checkBtn.style.opacity = '1';
                checkBtn.disabled = false;
            }
        });

        finishBtn.addEventListener('click', () => {
            playProgressSound();
            if (autoAdvanceTimer) {
                clearTimeout(autoAdvanceTimer);
                autoAdvanceTimer = null;
            }
            if (finishBtn.dataset.leveledUp === 'true') {
                navigate('storyPage');
            } else if (nextItem) {
                state.currentItem = nextItem;
                navigate('gamePage');
            } else {
                navigate('gameList');
            }
        });
    }, 0);

    return div;
}

export function renderStoryPage(navigate) {
    const { user, currentItem } = state;

    const div = mk('div', 'sky screen');
    div.innerHTML = `
        <div class="cloud c1"></div><div class="cloud c2"></div><div class="cloud c3"></div>
        <div class="content" style="padding: 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 24px;">
            <div style="text-align: center;">
                <div style="font-size: 80px; margin-bottom: 16px; animation: bounce 0.6s ease-in-out infinite;">⭐</div>
                <h1 class="fredoka" style="color: white; font-size: 36px; text-shadow: 2px 3px 0 rgba(0,0,0,0.18); margin: 0;">LEVEL UP!</h1>
                <p style="color: rgba(255,255,255,0.9); font-size: 18px; margin-top: 12px; font-weight: 700;">Here's your magical story...</p>
            </div>

            <div style="background: white; border-radius: 20px; padding: 24px; box-shadow: 0 8px 24px rgba(0,0,0,0.15); max-width: 500px; min-height: 250px; display: flex; align-items: center; justify-content: center;">
                <div id="storyContent" style="text-align: center; font-size: 16px; line-height: 1.8; color: #1E293B; font-weight: 500;">
                    <p style="margin: 0; color: #6B7280;">✨ Generating your story...</p>
                </div>
            </div>

            <button id="homeBtn" class="btn-orange" style="width: 100%; max-width: 300px; padding: 14px 28px; font-size: 18px; display: none;">Back Home 🏠</button>
        </div>
        <div class="hills" style="opacity: 0.7;">${hillsSVG()}</div>
    `;

    setTimeout(async () => {
        const storyContent = div.querySelector('#storyContent');
        const homeBtn = div.querySelector('#homeBtn');

        try {
            const { generateRewardStory } = await import('./ai.js');
            const story = await generateRewardStory(user.name, currentItem);
            storyContent.innerHTML = `<p style="margin: 0;">${esc(story)}</p>`;
            playSuccessSound();
        } catch (err) {
            console.error('Story error:', err);
            storyContent.innerHTML = `<p style="margin: 0;">${esc(user.name)} completed an amazing level! 🎉</p>`;
        }

        homeBtn.style.display = 'block';
        homeBtn.addEventListener('click', () => {
            playPopSound();
            navigate('gameList');
        });
    }, 300);

    return div;
}
