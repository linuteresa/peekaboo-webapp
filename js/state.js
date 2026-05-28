import { LEVEL_THRESHOLDS } from './config.js';

export const state = {
    screen: 'login', 
    user: null,
    completed: new Set(),
    gameType: null,
    currentItem: null
};

export function getLevel(score) {
    let level = 0;
    LEVEL_THRESHOLDS.forEach((threshold, index) => {
        if (score >= threshold) level = index;
    });
    return level;
}