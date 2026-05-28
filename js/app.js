import { state } from './state.js';
import { initAiPanel, setupAiPanel } from './ai.js';
import { renderOnboard, renderLogin, renderHome, renderGameList, renderGamePage } from './screens.js';

const SCREEN_MAP = {
    onboard: renderOnboard,
    login: renderLogin,
    home: renderHome,
    gameList: renderGameList,
    gamePage: renderGamePage
};

function navigate(screenName) {
    state.screen = screenName;
    render();
}

function render() {
    const appContainer = document.getElementById('app');
    appContainer.innerHTML = ''; // Clear current screen

    // Build the new screen and inject it
    const renderFn = SCREEN_MAP[state.screen];
    const screenElement = renderFn(navigate);
    appContainer.appendChild(screenElement);

    // Toggle AI panel visibility globally based on screen
    const aiPanel = document.getElementById('aiPanel');
    aiPanel.style.display = state.screen === 'gamePage' ? 'flex' : 'none';

    if (state.screen === 'gamePage') {
        setupAiPanel();
    }
}

// Bootstrap application
document.addEventListener('DOMContentLoaded', () => {
    initAiPanel();
    render(); // Initial render
});