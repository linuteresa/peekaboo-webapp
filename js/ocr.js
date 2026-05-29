const OCR_ALIASES = {
    'O': ['0', 'Q', 'C'], '0': ['O', 'Q'],
    'I': ['1', 'L', '|', 'T'], '1': ['I', 'L'], 'L': ['1', 'I'],
    'S': ['5', 'Z'], '5': ['S'], 'Z': ['2', 'S'], '2': ['Z'],
    'B': ['8', 'R'], '8': ['B'], 'G': ['6', 'C'], '6': ['G'],
    'U': ['V'], 'V': ['U'], 'M': ['N'], 'N': ['M'],
};

const LETTER_HINTS = {
    A: 'start at the top, draw two slanted lines, then add a line across the middle.',
    B: 'draw a straight line down, then add two round bumps on the right.',
    C: 'make a big curve like a moon opening to the right.',
    D: 'draw a straight line down, then add a big curve on the right.',
    E: 'draw a straight line down, then add three short lines across.',
    F: 'draw a straight line down, then add two lines across (top and middle).',
    G: 'make a big C, then add a short line in the middle.',
    H: 'draw two straight lines down, then connect them with a line in the middle.',
    I: 'draw one straight line down.',
    J: 'draw a line down and curve left at the bottom.',
    K: 'draw a straight line down, then two slanted lines from the middle.',
    L: 'draw a straight line down, then a line across the bottom.',
    M: 'draw a line down, two slants to the middle, then another line down.',
    N: 'draw a line down, a slant to the bottom right, then a line up.',
    O: 'make a round circle.',
    P: 'draw a line down, then add one round bump at the top.',
    Q: 'make a circle, then add a short tail at the bottom right.',
    R: 'draw a line down, add a bump at the top, then a slanted leg.',
    S: 'draw a smooth curve like a snake.',
    T: 'draw a line across the top, then a line down the middle.',
    U: 'draw a curve down and up like a cup.',
    V: 'draw two slanted lines that meet at the bottom.',
    W: 'make two V shapes in a row.',
    X: 'draw two crossing slanted lines.',
    Y: 'draw a V, then a line straight down from the middle.',
    Z: 'draw a line across the top, a diagonal down, then a line across the bottom.',
};

const NUMBER_HINTS = {
    '0': 'make a round oval.',
    '1': 'draw one straight line down.',
    '2': 'start with a curve on top, then a diagonal, then a line across the bottom.',
    '3': 'draw two stacked curves to the right.',
    '4': 'draw a line down, a line across, then a line down on the right.',
    '5': 'draw a line across the top, then down, then a curve at the bottom.',
    '6': 'make a curve around and close it like a loop with a tail.',
    '7': 'draw a line across the top, then a diagonal down.',
    '8': 'draw two small circles stacked.',
    '9': 'make a circle, then a straight line down.',
    '10': 'write a 1, then a 0.',
};

function getCorrectionHint(expected, type) {
    const normalized = expected.toString().toUpperCase();
    if (type === 'letter') {
        return LETTER_HINTS[normalized] || 'start at the top and follow the shape slowly.';
    }
    if (type === 'number') {
        return NUMBER_HINTS[normalized] || 'write the number slowly and a little larger.';
    }
    if (type === 'fill') {
        return `write the full word "${expected}" with clear letters.`;
    }
    return `write "${expected}" a little larger and slower.`;
}

export function preprocessForOCR(canvas) {
    const OUT = 300, PAD = 40;
    const src = canvas.getContext('2d');
    const { data, width: W, height: H } = src.getImageData(0, 0, canvas.width, canvas.height);

    let minX = W, maxX = 0, minY = H, maxY = 0;
    const mask = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            const i = (y * W + x) * 4;
            const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
            const lum = (r * 299 + g * 587 + b * 114) / 1000;
            
            if (a > 80 && lum < 210) {
                mask[y * W + x] = 1;
                minX = Math.min(minX, x); maxX = Math.max(maxX, x);
                minY = Math.min(minY, y); maxY = Math.max(maxY, y);
            }
        }
    }
    if (maxX <= minX || maxY <= minY) return null;

    const bw = document.createElement('canvas');
    bw.width = W; bw.height = H;
    const bwCtx = bw.getContext('2d');
    const bwData = bwCtx.createImageData(W, H);
    for (let i = 0; i < W * H; i++) {
        const v = mask[i] ? 0 : 255;
        bwData.data[i * 4] = v; bwData.data[i * 4 + 1] = v; bwData.data[i * 4 + 2] = v; bwData.data[i * 4 + 3] = 255;
    }
    bwCtx.putImageData(bwData, 0, 0);

    const dW = maxX - minX + 1, dH = maxY - minY + 1;
    const scale = Math.min((OUT - PAD * 2) / dW, (OUT - PAD * 2) / dH);
    const dx = (OUT - dW * scale) / 2, dy = (OUT - dH * scale) / 2;

    const out = document.createElement('canvas');
    out.width = OUT; out.height = OUT;
    const outCtx = out.getContext('2d');
    outCtx.fillStyle = 'white';
    outCtx.fillRect(0, 0, OUT, OUT);
    outCtx.drawImage(bw, minX, minY, dW, dH, dx, dy, dW * scale, dH * scale);
    return out;
}

export function levenshtein(a, b) {
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, (_, i) => Array.from({ length: n + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : 0));
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
    }
    return dp[m][n];
}

export async function runOCR(canvas, expected, type) {
    const processed = preprocessForOCR(canvas);
    if (!processed) return { pass: false, recognized: '', message: "Draw something first!" };

    const psm = type === 'fill' ? '8' : '10';
    const whitelist = type === 'number'
        ? '0123456789'
        : 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

    let raw = '', conf = 0;
    try {
        const result = await Tesseract.recognize(processed, 'eng', {
            logger: () => {},
            tessedit_pageseg_mode: psm,
            tessedit_char_whitelist: whitelist,
        });
        raw = result.data.text.trim().replace(/[^A-Za-z0-9]/g, '');
        conf = Math.round(result.data.confidence);
    } catch (e) {
        return { pass: false, recognized: '', message: 'OCR error. Try again.' };
    }

    const recog = raw.toUpperCase();
    const exp = expected.toString().toUpperCase().replace(/[^A-Z0-9]/g, '');

    let pass = false;
    if (type === 'fill') {
        pass = recog === exp || levenshtein(recog, exp) <= 1 || recog.includes(exp) || exp.includes(recog);
    } else {
        const first = recog.charAt(0);
        pass = first === exp || (OCR_ALIASES[exp] || []).includes(first) || (OCR_ALIASES[first] || []).includes(exp);
    }

    const displayRec = recog || '?';
    const confidencePass = conf >= 70;
    const finalPass = pass && confidencePass;
    const hint = getCorrectionHint(expected, type);
    const message = finalPass
        ? ''
        : (!confidencePass
            ? `I'm not sure — try writing "${expected}" bigger and clearer!`
            : `We read "${displayRec}". Try this: ${hint}`);
    return { pass: finalPass, recognized: displayRec, confidence: conf, message };
}
