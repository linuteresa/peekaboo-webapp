const OCR_ALIASES = {
    'O': ['0', 'Q', 'C'], '0': ['O', 'Q'],
    'I': ['1', 'L', '|', 'T'], '1': ['I', 'L'], 'L': ['1', 'I'],
    'S': ['5', 'Z'], '5': ['S'], 'Z': ['2', 'S'], '2': ['Z'],
    'B': ['8', 'R'], '8': ['B'], 'G': ['6', 'C'], '6': ['G'],
    'U': ['V'], 'V': ['U'], 'M': ['N'], 'N': ['M'],
};

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
    const confidencePass = conf >= 80;
    const finalPass = pass && confidencePass;
    const message = finalPass ? '' : (!confidencePass ? `I'm not sure — write "${expected}" more clearly!` : `We read "${displayRec}" — write "${expected}" again!`);
    return { pass: finalPass, recognized: displayRec, confidence: conf, message };
}