import { mk, esc, elephantSVG, hillsSVG } from './utils.js';
import { state, getLevel } from './state.js';
import { CONFIGS, ALL_GAMES, LEVEL_THRESHOLDS } from './config.js';
import { runOCR } from './ocr.js';

function isItemUnlocked(game, type) {
    const games = ALL_GAMES[type];
    const idx = games.findIndex(g => g.id === game.id);
    return idx === 0 || state.completed.has(games[idx - 1].id);
}

export function renderLogin(navigate) {
    const div = mk('div', 'sky screen');
    div.innerHTML = `
        <div class="cloud c1"></div><div class="cloud c2"></div>
        <div class="content" style="align-items:center;justify-content:center;padding:32px 20px;gap:0;">
            <div style="animation:float 3s ease-in-out infinite;margin-bottom:-16px;z-index:2;">${elephantSVG(100)}</div>
            <div class="login-card">
                <h2 class="fredoka" style="font-size:28px;color:#1A6E9C;text-align:center;margin-bottom:4px;">Peekaboo Learn</h2>
                <p style="text-align:center;font-size:14px;color:#6B7280;margin-bottom:24px;">What's your name, little explorer?</p>
                <input id="nameInput" class="name-input" placeholder="Type your name here 😊" />
                <button id="loginBtn" class="btn-orange" style="width:100%;margin-top:16px;opacity:0.5;pointer-events:none;">LET'S GO! 🚀</button>
                <p style="text-align:center;font-size:12px;color:#9CA3AF;margin-top:14px;">No account needed — just start learning!</p>
            </div>
        </div>
        <div class="hills">${hillsSVG()}</div>
    `;

    setTimeout(() => {
        const inp = div.querySelector('#nameInput');
        const btn = div.querySelector('#loginBtn');
        
        inp.addEventListener('input', () => {
            const v = inp.value.trim();
            btn.style.opacity = v ? '1' : '0.5';
            btn.style.pointerEvents = v ? 'auto' : 'none';
        });
        
        btn.addEventListener('click', () => {
            const n = inp.value.trim();
            if (n) {
                state.user = { name: n, score: 0 };
                navigate('home');
            }
        });
        
        inp.addEventListener('keydown', e => {
            if (e.key === 'Enter' && inp.value.trim()) {
                state.user = { name: inp.value.trim(), score: 0 };
                navigate('home');
            }
        });
        inp.focus();
    }, 0);
    return div;
}

export function renderHome(navigate) {
    const { user, completed } = state;
    const level = getLevel(user.score);
    const nextT = LEVEL_THRESHOLDS[Math.min(level + 1, LEVEL_THRESHOLDS.length - 1)];
    const pct = level >= 5 ? 100 : Math.min(100, Math.round((user.score / nextT) * 100));

    const div = mk('div', 'sky screen');
    div.innerHTML = `
        <div class="cloud c1"></div><div class="cloud c2"></div><div class="cloud c3"></div>
        <div class="content">
            <div class="topbar">
                <div class="logo-area">
                    <div style="width:36px;height:36px;">${elephantSVG(36)}</div>
                    <div class="logo-dots">
                        <div class="dot" style="background:#FF5C5C;"></div>
                        <div class="dot" style="background:#FFD600;"></div>
                        <div class="dot" style="background:#4CAF50;"></div>
                    </div>
                </div>
                <button id="menuBtn" style="background:rgba(255,255,255,0.3);border:none;border-radius:12px;width:42px;height:42px;font-size:22px;color:white;display:flex;align-items:center;justify-content:center;">☰</button>
            </div>
            <div class="hero">
                <h1 class="fredoka">Peekaboo Learn</h1>
                <p class="subtitle">LEARN &amp; PLAY</p>
            </div>
            <div class="tiles-wrap">
                <div class="tiles-grid" id="tilesGrid"></div>
            </div>
            <div class="bottom-area">
                <div class="progress-cloud" style="display:flex;align-items:center;gap:12px;">
                    <div style="font-size:22px;">⭐</div>
                    <div style="flex:1;">
                        <div style="display:flex;justify-content:space-between;margin-bottom:5px;">
                            <span style="font-weight:800;font-size:13px;color:white;">Level ${level}</span>
                            <span style="font-weight:800;font-size:13px;color:white;">${user.score} pts</span>
                        </div>
                        <div style="background:rgba(255,255,255,0.3);border-radius:20px;height:8px;">
                            <div style="width:${pct}%;height:100%;background:#FFE047;border-radius:20px;transition:width 0.6s;"></div>
                        </div>
                        <div style="font-size:10px;color:rgba(255,255,255,0.85);margin-top:3px;">${completed.size} lessons done</div>
                    </div>
                </div>
                <button class="btn-orange" id="dashBtn">PARENT DASHBOARD</button>
            </div>
        </div>
        <div class="hills">${hillsSVG()}</div>
    `;

    setTimeout(() => {
        div.querySelector('#menuBtn').addEventListener('click', () => alert('Menu — coming soon!'));
        div.querySelector('#dashBtn').addEventListener('click', () => {
            const lvl = getLevel(state.user.score);
            alert(`👋 Hi!\n\n${esc(state.user.name)}'s Progress:\n⭐ Level: ${lvl}\n🏆 Score: ${state.user.score} pts\n📚 Lessons done: ${state.completed.size}`);
        });

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
                    state.gameType = type;
                    navigate('gameList');
                });
            }
            grid.appendChild(outer);
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
        div.querySelector('#backBtn').addEventListener('click', () => navigate('home'));
        const list = div.querySelector('#gameList');
        
        games.forEach(game => {
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
    
    const div = mk('div', 'sky screen');
    
    div.innerHTML = `
        <div class="cloud c1"></div><div class="cloud c2"></div>
        <div class="content" style="padding: 16px 20px; display: flex; flex-direction: column;">
            
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 24px;">
                <button id="backBtn" style="background:rgba(255,255,255,0.25); border:2px solid rgba(255,255,255,0.4); color:white; border-radius:50px; padding:8px 18px; font-weight:800; font-size:14px;">← Back</button>
                <div style="font-size: 28px; font-weight: 900; color: white; text-shadow: 2px 3px 0 rgba(0,0,0,0.18);">${cfg.emoji} ${currentItem.letter}</div>
                <div style="width: 70px;"></div> </div>

            <div style="background: white; border-radius: 24px; padding: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.12); margin-bottom: 24px;">
                <h3 class="fredoka" style="color: ${cfg.dark}; text-align: center; margin-bottom: 12px; font-size: 18px;">Watch & Learn!</h3>
                <div style="position: relative; padding-bottom: 56.25%; height: 0; border-radius: 14px; overflow: hidden;">
                    <iframe style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;" 
                            src="https://www.youtube.com/embed/${currentItem.vid}?rel=0" 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                </div>
            </div>

            <div style="background: white; border-radius: 24px; padding: 20px; box-shadow: 0 8px 24px rgba(0,0,0,0.12); display: flex; flex-direction: column; align-items: center; padding-bottom: 100px;">
                <h3 class="fredoka" style="color: ${cfg.dark}; margin-bottom: 8px; font-size: 18px;">Your Turn to Practice!</h3>
                <p style="color: #6B7280; font-size: 14px; margin-bottom: 16px; text-align: center;">Draw the ${currentItem.type} <strong>${currentItem.letter}</strong> below:</p>
                
                <div style="border: 3px dashed #CBD5E1; border-radius: 20px; width: 100%; max-width: 320px; height: 220px; position: relative; background: #F8FAFC; touch-action: none;">
                    <canvas id="drawCanvas" style="width: 100%; height: 100%; border-radius: 20px;"></canvas>
                    <div id="ocrResult" style="position: absolute; bottom: 12px; left: 0; right: 0; text-align: center; font-weight: 800; color: ${cfg.dark}; font-size: 18px; pointer-events: none; text-shadow: 1px 1px 0px white;"></div>
                </div>

                <div id="controlsDiv" style="display: flex; gap: 12px; margin-top: 16px; width: 100%; max-width: 320px;">
                    <button id="clearBtn" style="flex: 1; padding: 14px; border-radius: 14px; background: #F1F5F9; color: #475569; font-weight: 800; font-size: 16px;">Clear</button>
                    <button id="checkBtn" style="flex: 2; padding: 14px; border-radius: 14px; background: ${cfg.grad}; color: white; font-weight: 800; font-size: 16px; box-shadow: 0 4px 0 ${cfg.shadow};">Check! ✨</button>
                </div>
                
                <button id="finishBtn" class="btn-orange" style="display: none; width: 100%; max-width: 320px; margin-top: 16px;">Awesome! Continue 🌟</button>
            </div>
        </div>
        <div class="hills" style="opacity: 0.7;">${hillsSVG()}</div>
    `;


    setTimeout(() => {
        div.querySelector('#backBtn').addEventListener('click', () => navigate('gameList'));

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
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            resultText.textContent = '';
        });

       
        checkBtn.addEventListener('click', async () => {
            resultText.textContent = 'Checking... 👀';
            checkBtn.style.opacity = '0.5';
            checkBtn.disabled = true;

            try {
                
                const result = await runOCR(canvas, currentItem.letter, currentItem.type);
                
                if (result.pass) {
                    resultText.textContent = 'Correct! 🎉';
                    resultText.style.color = '#10B981';
                    
                   
                    state.completed.add(currentItem.id);
                    state.user.score += currentItem.points;
                    
                
                    controlsDiv.style.display = 'none';
                    finishBtn.style.display = 'block';
                } else {
                    resultText.textContent = result.message || 'Try again! ✏️';
                    resultText.style.color = '#EF4444';
                }
            } catch (err) {
                resultText.textContent = 'Oops! Error checking. Try again.';
            } finally {
                checkBtn.style.opacity = '1';
                checkBtn.disabled = false;
            }
        });

        finishBtn.addEventListener('click', () => navigate('gameList'));
    }, 0);

    return div;
}