import { LEVEL_THRESHOLDS } from './config.js';

const STORAGE_KEY = 'peekaboo_state_v1';

export const state = {
    screen: 'home',
    user: null,
    completed: new Set(),
    gameType: null,
    currentItem: null,
    proficiency: {},
    settings: {
        sound: true,
        rewardStories: true,
    },
    pendingScrollTarget: null,
};

function normalizeSettings(input) {
    const s = input && typeof input === 'object' ? input : {};
    return {
        sound: s.sound !== false,
        rewardStories: s.rewardStories !== false,
    };
}

export function persistState() {
    try {
        if (typeof window === 'undefined' || !window.localStorage) return;
        const payload = {
            user: state.user,
            completed: Array.from(state.completed || []),
            proficiency: state.proficiency || {},
            settings: normalizeSettings(state.settings),
        };
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {}
}

export function loadPersistedState() {
    try {
        if (typeof window === 'undefined' || !window.localStorage) return null;
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') return null;
        return parsed;
    } catch (e) {
        return null;
    }
}

(function hydrateFromStorage() {
    const saved = loadPersistedState();
    if (!saved) return;

    if (saved.user && typeof saved.user === 'object') {
        state.user = saved.user;
    }

    state.completed = new Set(Array.isArray(saved.completed) ? saved.completed : []);
    state.proficiency = saved.proficiency && typeof saved.proficiency === 'object' ? saved.proficiency : {};
    state.settings = normalizeSettings(saved.settings);
})();

export function getLevel(score) {
    let level = 0;
    LEVEL_THRESHOLDS.forEach((threshold, index) => {
        if (score >= threshold) level = index;
    });
    return level;
}
