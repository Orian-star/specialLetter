const SIZE = 12; // Taille de police augmentée pour que ce soit bien lisible et grand
const FPS = 30;

function startAnimation() {
    document.getElementById('btn-launch').style.display = 'none';
    const canvas = document.getElementById('ascii-canvas');
    canvas.style.display = 'block';
    const ctx = canvas.getContext('2d');

    // Plein écran dynamique
    const W = window.innerWidth;
    const H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;

    const CW = SIZE * 0.7;
    const CH = SIZE * 1.2;
    const COLS = Math.floor(W / CW);
    const ROWS = Math.floor(H / CH);

    let startTime = performance.now();
    let sparks = [];

    // Palette de couleurs pour le feu et la rose
    const FIRE_COLORS = ['#ff3300', '#ff6600', '#ff9900', '#ffcc00', '#ffffff', '#ff4d6d'];

    function loop(now) {
        let t = (now - startTime) / 1000;

        // Fond noir profond
        ctx.fillStyle = "#030204";
        ctx.fillRect(0, 0, W, H);

        ctx.font = `bold ${SIZE}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const CX = W / 2;
        const CY = H / 2;

        // Génération d'étincelles façon feu d'artifice / rose qui brûle
        if (Math.random() < 0.8) {
            let angle = Math.random() * Math.PI * 2;
            let speed = Math.random() * 120 + 20;
            sparks.push({
                x: CX,
                y: CY + 40,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 20,
                life: 0,
                maxLife: Math.random() * 2 + 1,
                char: ['*', '+', '.', '#', '&'][Math.floor(Math.random() * 5)],
                color: FIRE_COLORS[Math.floor(Math.random() * FIRE_COLORS.length)]
            });
        }

        // Mise à jour et affichage des étincelles et particules
        let aliveSparks = [];
        for (let s of sparks) {
            s.life += 0.03;
            if (s.life >= s.maxLife) continue;
            s.x += s.vx * 0.03;
            s.y += s.vy * 0.03;
            s.vy += 20 * 0.03; // Gravité légère

            let alpha = 1 - (s.life / s.maxLife);
            ctx.fillStyle = s.color;
            ctx.globalAlpha = alpha;
            ctx.fillText(s.char, s.x, s.y);
            aliveSparks.push(s);
        }
        sparks = aliveSparks;
        ctx.globalAlpha = 1.0;

        // Affichage du texte principal en grand au centre
        ctx.font = `bold ${Math.floor(SIZE * 2.5)}px monospace`;
        ctx.fillStyle = "#ff4d6d";
        ctx.shadowColor = "#ff1654";
        ctx.shadowBlur = 25;
        ctx.fillText("🌹 F O R   Y O U 🌹", CX, CY);
        
        ctx.font = `bold ${SIZE}px monospace`;
        ctx.fillStyle = "#ffffff";
        ctx.shadowBlur = 0;
        ctx.fillText("Appuyez sur Échap ou rechargez pour recommencer", CX, CY + 70);

        requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);
}