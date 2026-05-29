import { state } from './state.js';
import { initAiPanel, setupAiPanel } from './ai.js';
import { renderLogin, renderHome, renderGameList, renderGamePage, renderStoryPage, renderDashboard } from './screen.js';

const SCREEN_MAP = {
    login: renderLogin,
    home: renderHome,
    dashboard: renderDashboard,
    gameList: renderGameList,
    gamePage: renderGamePage,
    storyPage: renderStoryPage
};

function navigate(screenName) {
    state.screen = screenName;
    render();
}

function render() {
    const appContainer = document.getElementById('app');
    appContainer.innerHTML = ''; 

    
    const renderFn = SCREEN_MAP[state.screen];
    
    if (!renderFn) {
        console.error(`Screen "${state.screen}" not found in SCREEN_MAP.`);
        return;
    }

    const screenElement = renderFn(navigate);
    appContainer.appendChild(screenElement);

    const aiPanel = document.getElementById('aiPanel');
    aiPanel.style.display = state.screen === 'gamePage' ? 'flex' : 'none';

    if (state.screen === 'gamePage') {
        setupAiPanel();
    } else if (state.screen === 'storyPage') {
        aiPanel.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initAiPanel();
    render(); 
});
