const SIZE = 16; // Taille de police confortable et bien visible

function startAnimation() {
    document.getElementById('btn-launch').style.display = 'none';
    const canvas = document.getElementById('ascii-canvas');
    canvas.style.display = 'block';
    const ctx = canvas.getContext('2d');

    // Force le canvas à occuper toute la taille réelle de la fenêtre
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let startTime = performance.now();
    let sparks = [];

    const FIRE_COLORS = ['#ff3300', '#ff6600', '#ff9900', '#ffcc00', '#ffffff', '#ff4d6d'];

    function loop(now) {
        let t = (now - startTime) / 1000;

        // Effacer l'écran en noir profond
        ctx.fillStyle = "#030204";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const CX = canvas.width / 2;
        const CY = canvas.height / 2;

        // Génération d'étincelles en continu
        if (Math.random() < 0.8) {
            let angle = Math.random() * Math.PI * 2;
            let speed = Math.random() * 180 + 30;
            sparks.push({
                x: CX,
                y: CY + 20,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 30,
                life: 0,
                maxLife: Math.random() * 2 + 1,
                char: ['*', '+', '.', '#', '&'][Math.floor(Math.random() * 5)],
                color: FIRE_COLORS[Math.floor(Math.random() * FIRE_COLORS.length)]
            });
        }

        // Mise à jour des particules
        let aliveSparks = [];
        for (let s of sparks) {
            s.life += 0.03;
            if (s.life >= s.maxLife) continue;
            s.x += s.vx * 0.03;
            s.y += s.vy * 0.03;
            s.vy += 25 * 0.03; // Gravité

            let alpha = 1 - (s.life / s.maxLife);
            ctx.fillStyle = s.color;
            ctx.globalAlpha = alpha;
            ctx.font = `bold ${SIZE}px monospace`;
            ctx.fillText(s.char, s.x, s.y);
            aliveSparks.push(s);
        }
        sparks = aliveSparks;
        ctx.globalAlpha = 1.0;

        // Affichage du texte principal bien grand au centre exact
        ctx.font = `bold ${Math.floor(SIZE * 2.2)}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#ff4d6d";
        ctx.shadowColor = "#ff1654";
        ctx.shadowBlur = 30;
        ctx.fillText("🌹 F O R   Y O U 🌹", CX, CY);

        requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);
}