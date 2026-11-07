const SIZE = 8;
const FPS = 30;
const D2R = Math.PI / 180;

const T_ENV_IN = 1.6;
const T_CUR0 = 1.9;
const T_CUR1 = 4.1;
const T_CLICK = 4.55;
const T_BURN = T_CLICK + 0.12;
const T_SPREAD = 3.4;
const T_R0 = T_BURN + 2.3;
const T_FORM = 3.8;
const T_GLOW = T_R0 + 1.8;
const T_FIRE_END = T_BURN + T_SPREAD + 2.2;

function clamp(v, lo = 0.0, hi = 1.0) {
    return v < lo ? lo : v > hi ? hi : v;
}

function ease(t) {
    t = clamp(t);
    return t * t * (3 - 2 * t);
}

function mix(a, b, k) {
    return [
        a[0] + (b[0] - a[0]) * k,
        a[1] + (b[1] - a[1]) * k,
        a[2] + (b[2] - a[2]) * k
    ];
}

function sc(c, k) {
    return [c[0] * k, c[1] * k, c[2] * k];
}

const LV = 40;
function hexc(c) {
    const r = Math.floor(clamp(c[0]) * (LV - 0.01));
    const g = Math.floor(clamp(c[1]) * (LV - 0.01));
    const b = Math.floor(clamp(c[2]) * (LV - 0.01));
    return `#${Math.floor(r * 255 / (LV - 1)).toString(16).padStart(2, '0')}` +
           `${Math.floor(g * 255 / (LV - 1)).toString(16).padStart(2, '0')}` +
           `${Math.floor(b * 255 / (LV - 1)).toString(16).padStart(2, '0')}`;
}

// Generateur d'aleatoire deterministic pour reproduire random.Random(21)
function LCG(seed) {
    let s = seed;
    return function() {
        s = (s * 9301 + 49297) % 233280;
        return s / 233280;
    };
}

function rampLut(stops, n = 64) {
    let out = [];
    for (let i = 0; i < n; i++) {
        let v = i / (n - 1);
        for (let k = 0; k < stops.length - 1; k++) {
            let [a, ca] = stops[k];
            let [b, cb] = stops[k + 1];
            if (v <= b) {
                out.push(mix(ca, cb, (v - a) / (b - a)));
                break;
            }
        }
    }
    return out;
}

const FIRE_STOPS = [
    [0.00, [0.30, 0.01, 0.00]],
    [0.18, [0.78, 0.05, 0.01]],
    [0.38, [1.00, 0.24, 0.02]],
    [0.60, [1.00, 0.52, 0.05]],
    [0.80, [1.00, 0.80, 0.26]],
    [1.00, [1.00, 0.98, 0.82]]
];
const LUT = rampLut(FIRE_STOPS);

const REDS = [
    [0.00, [0.10, 0.00, 0.02]],
    [0.22, [0.34, 0.01, 0.05]],
    [0.45, [0.66, 0.04, 0.09]],
    [0.68, [0.90, 0.09, 0.15]],
    [0.88, [1.00, 0.24, 0.26]],
    [1.00, [1.00, 0.55, 0.52]]
];
const RLUT = rampLut(REDS);
const RCH = "-=+*#%&@8";

const BLUES = [
    [0.00, [0.01, 0.03, 0.16]],
    [0.25, [0.03, 0.14, 0.52]],
    [0.50, [0.10, 0.38, 0.95]],
    [0.75, [0.50, 0.78, 1.00]],
    [1.00, [1.00, 1.00, 1.00]]
];
const BLUE = rampLut(BLUES);

function startAnimation() {
    document.getElementById('btn-launch').style.display = 'none';
    const canvas = document.getElementById('ascii-canvas');
    canvas.style.display = 'block';
    const ctx = canvas.getContext('2d');

    const rng = LCG(21);

    ctx.font = `bold ${SIZE}px monospace`;
    const metrics = ctx.measureText("M");
    const CW = metrics.width || 5;
    const CH = SIZE * 1.2;

    const ROWS = Math.floor(Math.max(35, (window.innerHeight - 40) / CH));
    const COLS = Math.floor(window.innerWidth / CW);
    const W = COLS * CW;
    const H = ROWS * CH;
    const S = H / 640.0;

    canvas.width = W;
    canvas.height = H;

    const BG = [0.010, 0.007, 0.012];

    // Bruit Perlin 2D simplifie
    const P = Array.from({length: 256}, (_, i) => i);
    for (let i = 255; i > 0; i--) {
        let j = Math.floor(rng() * (i + 1));
        [P[i], P[j]] = [P[j], P[i]];
    }
    const N = Array.from({length: 256}, () => rng() * 2 - 1);

    function vn(x, y) {
        let xi = Math.floor(x), yi = Math.floor(y);
        let xf = x - xi, yf = y - yi;
        xi &= 255; yi &= 255;
        let x1 = (xi + 1) & 255, y1 = (yi + 1) & 255;
        let u = xf * xf * (3 - 2 * xf);
        let v = yf * yf * (3 - 2 * yf);
        let a = N[P[(P[xi] + yi) & 255]];
        let b = N[P[(P[x1] + yi) & 255]];
        let c = N[P[(P[xi] + y1) & 255]];
        let d = N[P[(P[x1] + y1) & 255]];
        return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
    }

    const HS = Array.from({length: ROWS}, () => Array.from({length: COLS}, () => rng()));
    const HS2 = Array.from({length: ROWS}, () => Array.from({length: COLS}, () => rng()));

    const CX = W / 2.0;
    const EW = 0.76 * W;
    const EH = 0.74 * EW;
    const ECY = 0.55 * H;
    const EX0 = CX - EW / 2, EX1 = CX + EW / 2;
    const EY0 = ECY - EH / 2, EY1 = ECY + EH / 2;
    const FLAP_H = 0.50 * EH;
    const TIPY = EY0 + FLAP_H;
    const HR = 0.062 * H;
    const HCY = TIPY - 0.25 * HR;
    const XPL = CX - 0.17 * EW, XPR = CX + 0.17 * EW;
    const YPL = EY0 + FLAP_H * (1 - 0.17 * EW / (EW / 2));
    const IGX = CX, IGY = HCY;

    const GLYPH = {
        "F": ["###", "#..", "##.", "#..", "#.."],
        "O": ["###", "#.#", "#.#", "#.#", "###"],
        "R": ["##.", "#.#", "##.", "#.#", "#.#"],
        "Y": ["#.#", "#.#", ".#.", ".#.", ".#."],
        "U": ["#.#", "#.#", "#.#", "#.#", "###"],
        " ": ["...", "...", "...", "...", "..."]
    };
    const TEXT = "FOR YOU";
    let TXT = ["", "", "", "", ""];
    for (let i = 0; i < TEXT.length; i++) {
        let ch = TEXT[i];
        for (let k = 0; k < 5; k++) {
            TXT[k] += GLYPH[ch][k] + (i < TEXT.length - 1 ? "." : "");
        }
    }
    const TW = TXT[0].length;
    const TC0 = Math.floor(CX / CW - TW);
    const TR0 = Math.floor((HCY + 1.2 * HR) / CH) + 2;

    function ink(r, c) {
        let px = Math.floor((c - TC0) / 2);
        let py = r - TR0;
        return c >= TC0 && px >= 0 && px < TW && py >= 0 && py < 5 && TXT[py][px] === "#";
    }

    const PAPER = "#%&@8";
    const FLAPC = [0.85, 0.67, 0.44];
    const BODYC = [0.73, 0.55, 0.34];
    const SIDEC = [0.66, 0.48, 0.29];
    const BOTC = [0.78, 0.60, 0.38];
    const INK = [0.14, 0.08, 0.05];
    const INKT = [0.24, 0.12, 0.06];
    const STRIPE = [[0.74, 0.17, 0.15], [0.93, 0.88, 0.76], [0.17, 0.29, 0.64]];

    function heart_f(hx, hy, s) {
        let X = hx / s;
        let Y = (hy - 0.25) / s + 0.25;
        return Math.pow(X * X + Y * Y - 1, 3) - X * X * Math.pow(Y, 3);
    }

    function env_style(r, c, x, y, hs, hs2) {
        if (x < EX0 || x > EX1 || y < EY0 || y > EY1) return null;
        let hx_ = (x - CX) / HR;
        let hy_ = (HCY - y) / HR;
        if (-1.4 < hx_ && hx_ < 1.4 && -1.3 < hy_ && hy_ < 1.6 && heart_f(hx_, hy_, 1.0) <= 0) {
            let k = clamp(0.5 - 0.30 * hx_ + 0.28 * hy_);
            if (heart_f(hx_, hy_, 0.90) > 0) return ["#", [0.50, 0.13, 0.28]];
            if (heart_f(hx_, hy_, 0.70) > 0) return ["&%#"[Math.floor(hs * 3) % 3], mix([0.86, 0.40, 0.58], [1.0, 0.74, 0.86], k)];
            if (Math.pow(hx_ + 0.40, 2) + Math.pow(hy_ - 0.60, 2) < 0.045) return ["*", [1.0, 0.93, 0.97]];
            return ["@%"[hs2 > 0.82 ? 1 : 0], mix([0.74, 0.24, 0.44], [0.97, 0.60, 0.76], k)];
        }
        if (ink(r, c)) return ["@", INKT];
        if (ink(r - 1, c - 1)) return ["%", [0.45, 0.29, 0.15]];
        let fh = FLAP_H * (1 - Math.abs(x - CX) / (EW / 2));
        let dfl = EY0 + fh - y;
        if (Math.abs(dfl) < 0.45 * CH) return [x < CX ? "\\" : "/", INK];
        let side = false;
        if (dfl < 0) {
            if (x <= XPL) {
                let yl = EY1 + (YPL - EY1) * (x - EX0) / (XPL - EX0);
                if (Math.abs(y - yl) < 0.45 * CH) return ["/", INK];
                side = y < yl;
            } else if (x >= XPR) {
                let yr = YPL + (EY1 - YPL) * (x - XPR) / (EX1 - XPR);
                if (Math.abs(y - yr) < 0.45 * CH) return ["\\", INK];
                side = y < yr;
            }
        }
        if (x < EX0 + 1.3 * CW || x > EX1 - 1.3 * CW || y < EY0 + 0.9 * CH || y > EY1 - 0.9 * CH) {
            return ["/", STRIPE[Math.floor(((c + r) % 6) / 2)]];
        }
        let base = dfl >= 0 ? FLAPC : (side ? SIDEC : BOTC);
        let k = (1.06 - 0.20 * (y - EY0) / EH) * (0.88 + 0.24 * hs2);
        return [PAPER[Math.floor(hs * PAPER.length) % PAPER.length], [base[0] * k, base[1] * k, base[2] * k]];
    }

    let raw = [];
    for (let r = 0; r < ROWS; r++) {
        let y = (r + 0.5) * CH;
        for (let c = 0; c < COLS; c++) {
            let x = (c + 0.5) * CW;
            let s_ = env_style(r, c, x, y, HS[r][c], HS2[r][c]);
            if (s_ !== null) raw.push({r, c, ch: s_[0], col: s_[1], x, y});
        }
    }

    let MAXD = Math.max(...raw.map(e => Math.hypot(e.x - IGX, e.y - IGY)));
    let ENVC = raw.map(e => {
        let d = Math.hypot(e.x - IGX, e.y - IGY);
        let nzv = vn(e.x * 0.035 + 4, e.y * 0.035 + 9) * 0.5 + 0.5;
        let tb = T_SPREAD * Math.pow(d / MAXD, 0.92) + 0.6 * nzv * Math.min(1.0, d / (0.12 * H));
        return {...e, tb, hs: HS[e.r][e.c], hs2: HS2[e.r][e.c]};
    });

    let startTime = performance.now();
    let lastTime = 0;

    function loop(now) {
        let t = (now - startTime) / 1000;
        let dt = clamp(t - lastTime, 0.0, 0.1);
        lastTime = t;

        ctx.fillStyle = hexc(BG);
        ctx.fillRect(0, 0, W, H);

        ctx.font = `bold ${SIZE}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        let tbn = t - T_BURN;
        let pin = clamp(t / T_ENV_IN);

        for (let e of ENVC) {
            let tau = tbn - e.tb;
            if (tau >= 1.35) continue;
            if (tau < 0) {
                let vis = pin * 1.3 - e.hs * 0.5;
                if (vis <= 0) continue;
                let k = Math.min(1.0, vis * 1.6);
                let col = e.col;
                ctx.fillStyle = hexc([col[0] * k, col[1] * k, col[2] * k]);
                ctx.fillText(e.ch, (e.c + 0.5) * CW, (e.r + 0.5) * CH);
            } else if (tau < 0.38) {
                let q = tau / 0.38;
                let T = clamp(0.98 - 0.62 * q);
                let col = LUT[Math.floor(T * 63)];
                ctx.fillStyle = hexc(col);
                ctx.fillText("#", (e.c + 0.5) * CW, (e.r + 0.5) * CH);
            }
        }

        if (t >= T_R0) {
            ctx.fillStyle = "#ff4d6d";
            ctx.fillText("FOR YOU", CX, HCY);
        }

        requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);
}