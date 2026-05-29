export function mk(tag, className = '') {
    const el = document.createElement(tag);
    if (className) el.className = className;
    return el;
}

export function esc(str) {
    return String(str).replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function elephantSVG(size = 90) {
    return `<svg width="${size}" height="${Math.round(size * 1.15)}" viewBox="0 0 100 115" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="50" cy="70" rx="28" ry="32" fill="#8B9DC3"/>
        <circle cx="35" cy="45" r="22" fill="#8B9DC3"/>
        <circle cx="70" cy="50" r="18" fill="#A8BFD9"/>
        <path d="M 50 65 Q 55 85 50 95 Q 48 88 45 85 Q 48 88 50 95" fill="#6B7BA8" stroke="#6B7BA8" stroke-width="3" stroke-linecap="round"/>
        <ellipse cx="28" cy="35" rx="8" ry="14" fill="#E8A8D8" opacity="0.8"/>
        <ellipse cx="72" cy="40" rx="10" ry="16" fill="#E8A8D8" opacity="0.8"/>
        <circle cx="38" cy="38" r="4" fill="#333"/>
        <circle cx="62" cy="43" r="4" fill="#333"/>
        <path d="M 48 52 Q 50 55 52 52" stroke="#333" stroke-width="2" stroke-linecap="round" fill="none"/>
        <path d="M 45 60 L 40 65" stroke="#333" stroke-width="2" stroke-linecap="round"/>
        <path d="M 55 60 L 60 65" stroke="#333" stroke-width="2" stroke-linecap="round"/>
    </svg>`;
}


export function hillsSVG() {
    return `<svg viewBox="0 0 400 90" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style="width:100%;height:90px;display:block;">
        <path d="M0 50 Q80 10 160 40 Q240 70 320 30 Q360 10 400 35 L400 90 L0 90 Z" fill="#4DC247"/>
        <path d="M0 65 Q60 40 130 58 Q200 76 270 50 Q330 28 400 55 L400 90 L0 90 Z" fill="#5DD456"/>
        <path d="M0 78 Q50 65 100 72 Q160 80 220 68 Q280 55 340 70 Q370 78 400 72 L400 90 L0 90 Z" fill="#6CE463"/>
    </svg>`;
}