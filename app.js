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

let canvas, ctx;
let ROWS, COLS, W, H, CW, CH, S;

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

function rgbToHex(c) {
    const r = Math.floor(clamp(c[0]) * 255);
    const g = Math.floor(clamp(c[1]) * 255);
    const b = Math.floor(clamp(c[2]) * 255);
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function startAnimation() {
    document.getElementById('btn-launch').style.display = 'none';
    canvas = document.getElementById('ascii-canvas');
    canvas.style.display = 'block';
    ctx = canvas.getContext('2d');

    // Configuration de la grille ASCII
    ctx.font = `bold ${SIZE}px monospace`;
    const metrics = ctx.measureText("M");
    CW = metrics.width;
    CH = SIZE * 1.2;

    ROWS = Math.floor(Math.max(30, Math.min(46, (window.innerHeight - 140) / CH)));
    COLS = Math.floor(ROWS * CH / CW);
    W = COLS * CW;
    H = ROWS * CH;
    S = H / 640.0;

    canvas.width = W;
    canvas.height = H;

    let startTime = performance.now();
    let lastTime = 0;

    function loop(now) {
        let t = (now - startTime) / 1000;
        let dt = clamp(t - lastTime, 0.0, 0.1);
        lastTime = t;

        // Effacer le canvas
        ctx.fillStyle = "#030204";
        ctx.fillRect(0, 0, W, H);

        // Simulation minimale pour l'affichage web
        ctx.font = `bold ${SIZE}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        let progress = Math.min(1.0, t / T_FIRE_END);
        let text = t > T_R0 ? "FOR YOU ❤️" : "Chargement...";
        
        ctx.fillStyle = t > T_R0 ? "#ff4d6d" : "#ffb703";
        ctx.fillText(text, W / 2, H / 2);

        if (t < T_FIRE_END + 2) {
            requestAnimationFrame(loop);
        }
    }

    requestAnimationFrame(loop);
}