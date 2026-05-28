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
        </svg>`;
}

export function hillsSVG() {
    return `<svg viewBox="0 0 400 90" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style="width:100%;height:90px;display:block;">
        <path d="M0 50 Q80 10 160 40 Q240 70 320 30 Q360 10 400 35 L400 90 L0 90 Z" fill="#4DC247"/>
        <path d="M0 65 Q60 40 130 58 Q200 76 270 50 Q330 28 400 55 L400 90 L0 90 Z" fill="#5DD456"/>
        <path d="M0 78 Q50 65 100 72 Q160 80 220 68 Q280 55 340 70 Q370 78 400 72 L400 90 L0 90 Z" fill="#6CE463"/>
    </svg>`;
}