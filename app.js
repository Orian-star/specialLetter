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

const LV = 40;
function hexc(c) {
    const r = Math.floor(clamp(c[0]) * (LV - 0.01));
    const g = Math.floor(clamp(c[1]) * (LV - 0.01));
    const b = Math.floor(clamp(c[2]) * (LV - 0.01));
    return `#${Math.floor(r * 255 / (LV - 1)).toString(16).padStart(2, '0')}` +
           `${Math.floor(g * 255 / (LV - 1)).toString(16).padStart(2, '0')}` +
           `${Math.floor(b * 255 / (LV - 1)).toString(16).padStart(2, '0')}`;
}

const FIRE_STOPS = [
    [0.00, [0.30, 0.01, 0.00]],
    [0.18, [0.78, 0.05, 0.01]],
    [0.38, [1.00, 0.24, 0.02]],
    [0.60, [1.00, 0.52, 0.05]],
    [0.80, [1.00, 0.80, 0.26]],
    [1.00, [1.00, 0.98, 0.82]]
];

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
const LUT = rampLut(FIRE_STOPS);

function startAnimation() {
    document.getElementById('btn-launch').style.display = 'none';
    canvas = document.getElementById('ascii-canvas');
    canvas.style.display = 'block';
    ctx = canvas.getContext('2d');

    ctx.font = `bold ${SIZE}px monospace`;
    const metrics = ctx.measureText("M");
    CW = metrics.width;
    CH = SIZE * 1.2;

    const scr_h = window.innerHeight;
    ROWS = Math.floor(Math.max(30, Math.min(46, (scr_h - 140) / CH)));
    COLS = Math.floor(ROWS * CH / CW);
    W = COLS * CW;
    H = ROWS * CH;
    S = H / 640.0;

    canvas.width = W;
    canvas.height = H;

    let startTime = performance.now();
    let lastTime = 0;
    let frame = 0;
    let sparks = [];

    function loop(now) {
        let t = (now - startTime) / 1000;
        let dt = clamp(t - lastTime, 0.0, 0.1);
        lastTime = t;
        frame++;

        // Fond sombre
        ctx.fillStyle = hexc([0.010, 0.007, 0.012]);
        ctx.fillRect(0, 0, W, H);

        ctx.font = `bold ${SIZE}px monospace`;
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";

        let gt = ease((t - T_GLOW) / 3.6);
        let tbn = t - T_BURN;

        // Simulation visuelle de l'enveloppe et du texte central au fil du temps
        let cx = W / 2;
        let cy = H / 2;

        if (t < T_R0) {
            // Phase enveloppe / cachet / texte "FOR YOU"
            ctx.fillStyle = hexc([0.73, 0.55, 0.34]);
            ctx.fillText("✉ [ FOR YOU ]", cx, cy - 40);
            
            let alphaCur = clamp((t - T_CUR0) / 0.3);
            if (alphaCur > 0 && t < T_BURN) {
                // Curseur de souris virtuel qui clique sur le sceau
                let cursorX = cx + Math.sin(t * 3) * 10;
                let cursorY = cy + 20;
                ctx.fillStyle = "#ffffff";
                ctx.fillText("🖱️", cursorX, cursorY);
            }
        } else {
            // Phase éclosion de la rose et feux / étincelles
            let progress = ease((t - T_R0) / T_FORM);
            let roseSize = Math.floor(progress * 40);

            ctx.fillStyle = hexc([0.90, 0.09, 0.15]);
            ctx.fillText("🌹 F O R   Y O U 🌹", cx, cy - 20);

            // Génération d'étincelles façon feu d'artifice/rose
            if (Math.random() < 0.6) {
                sparks.push({
                    x: cx + (Math.random() - 0.5) * 150,
                    y: cy + (Math.random() - 0.5) * 150,
                    vx: (Math.random() - 0.5) * 60,
                    vy: -Math.random() * 80 - 20,
                    life: 0,
                    maxLife: Math.random() * 1.5 + 0.5,
                    color: LUT[Math.floor(Math.random() * LUT.length)]
                });
            }
        }

        // Mise à jour et affichage des étincelles
        let aliveSparks = [];
        for (let s_Obj of sparks) {
            s_Obj.life += dt;
            if (s_Obj.life >= s_Obj.maxLife) continue;
            s_Obj.x += s_Obj.vx * dt;
            s_Obj.y += s_Obj.vy * dt;

            let k = 1 - s_Obj.life / s_Obj.maxLife;
            ctx.fillStyle = hexc(s_Obj.color);
            ctx.fillText(k > 0.5 ? "*" : ".", s_Obj.x, s_Obj.y);
            aliveSparks.push(s_Obj);
        }
        sparks = aliveSparks;

        if (t < T_FIRE_END + 4) {
            requestAnimationFrame(loop);
        }
    }

    requestAnimationFrame(loop);
}