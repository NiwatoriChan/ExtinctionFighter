/* ============================================================================
 * COMBATTANT : QUETZALCOATLUS (Quetzalcoatlus Northropi)
 * Données (stats, skins, textes), modèle 3D paléontologique procédural haute
 * fidélité (textures PBR pycnofibres, kératine du bec, crête sagittale, patagium
 * vascularisé à actinofibrilles, maillage corporel continu par spline Catmull-Rom
 * et membranes alaires déformables en temps réel), animations biomécaniques,
 * coups spéciaux & fatalité.
 * ============================================================================ */

/**
 * Attache la jauge circulaire d'endurance de vol 3D au-dessus du Quetzalcoatlus
 * (partagée entre le rig GLB hydraté et le rig procédural de repli).
 */
function attachQuetzalEnduranceGauge(rig) {
    if (!rig || !rig.root) return;
    if (!rig.specialParts) rig.specialParts = {};

    const gaugeCanvas = document.createElement('canvas');
    gaugeCanvas.width = 256;
    gaugeCanvas.height = 256;
    const gCtx = gaugeCanvas.getContext('2d');
    const gaugeTexture = new THREE.CanvasTexture(gaugeCanvas);
    gaugeTexture.minFilter = THREE.LinearFilter;
    gaugeTexture.magFilter = THREE.LinearFilter;

    const gaugeMat = new THREE.SpriteMaterial({
        map: gaugeTexture,
        transparent: true,
        opacity: 0.0,
        depthTest: false
    });
    const enduranceSprite = new THREE.Sprite(gaugeMat);
    enduranceSprite.scale.set(1.5, 1.5, 1.5);
    enduranceSprite.position.set(0, 5.1, 0);
    rig.root.add(enduranceSprite);

    let lastDrawnPct = -1;
    let currentOpacity = 0.0;

    rig.specialParts.flightEnduranceGauge = enduranceSprite;
    rig.specialParts.updateEnduranceCircle = (endurance, isFlying, delta) => {
        const maxEnd = 2.0;
        const pct = Math.max(0, Math.min(1.0, endurance / maxEnd));

        const targetOpacity = (isFlying || pct < 0.98) ? 1.0 : 0.0;
        currentOpacity += (targetOpacity - currentOpacity) * Math.min(1.0, delta * 8);
        gaugeMat.opacity = currentOpacity;
        if (currentOpacity < 0.02) {
            enduranceSprite.visible = false;
            return;
        }
        enduranceSprite.visible = true;

        if (Math.abs(pct - lastDrawnPct) > 0.005 || isFlying) {
            lastDrawnPct = pct;
            const size = 256;
            const cx = size / 2;
            const cy = size / 2;
            const radius = 86;
            const strokeW = 18;

            gCtx.clearRect(0, 0, size, size);

            gCtx.beginPath();
            gCtx.arc(cx, cy, radius + strokeW * 0.75, 0, Math.PI * 2);
            gCtx.fillStyle = 'rgba(10, 15, 26, 0.82)';
            gCtx.fill();

            gCtx.beginPath();
            gCtx.arc(cx, cy, radius, 0, Math.PI * 2);
            gCtx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
            gCtx.lineWidth = strokeW;
            gCtx.lineCap = 'round';
            gCtx.stroke();

            if (pct > 0.001) {
                const startAngle = -Math.PI / 2;
                const endAngle = startAngle + (Math.PI * 2 * pct);

                gCtx.beginPath();
                gCtx.arc(cx, cy, radius, startAngle, endAngle, false);

                let color = '#38bdf8';
                let glowColor = 'rgba(56, 189, 248, 0.9)';
                if (pct > 0.55) {
                    color = '#38bdf8';
                    glowColor = 'rgba(56, 189, 248, 0.9)';
                } else if (pct > 0.25) {
                    color = '#fbbf24';
                    glowColor = 'rgba(251, 191, 36, 0.9)';
                } else {
                    color = '#f87171';
                    glowColor = 'rgba(248, 113, 113, 1.0)';
                }

                gCtx.shadowColor = glowColor;
                gCtx.shadowBlur = 16;
                gCtx.strokeStyle = color;
                gCtx.lineWidth = strokeW;
                gCtx.lineCap = 'round';
                gCtx.stroke();
                gCtx.shadowBlur = 0;
            }

            gCtx.fillStyle = pct <= 0.25 ? '#f87171' : '#ffffff';
            gCtx.font = 'bold 38px sans-serif';
            gCtx.textAlign = 'center';
            gCtx.textBaseline = 'middle';
            const secText = `${(endurance).toFixed(1)}s`;
            gCtx.fillText(secText, cx, cy - 6);

            gCtx.font = 'bold 20px sans-serif';
            gCtx.fillStyle = '#38bdf8';
            gCtx.fillText('VOL', cx, cy + 32);

            for (let i = 0; i < 4; i++) {
                const angle = -Math.PI / 2 + (i * Math.PI / 2);
                const tx1 = cx + Math.cos(angle) * (radius - strokeW * 0.7);
                const ty1 = cy + Math.sin(angle) * (radius - strokeW * 0.7);
                const tx2 = cx + Math.cos(angle) * (radius + strokeW * 0.7);
                const ty2 = cy + Math.sin(angle) * (radius + strokeW * 0.7);
                gCtx.beginPath();
                gCtx.moveTo(tx1, ty1);
                gCtx.lineTo(tx2, ty2);
                gCtx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
                gCtx.lineWidth = 3;
                gCtx.stroke();
            }

            gaugeTexture.needsUpdate = true;
        }
    };
}

if (typeof window !== 'undefined') {
    window.attachQuetzalEnduranceGauge = attachQuetzalEnduranceGauge;
}

registerFighter({
    id: 'quetzal',
    name: 'QUETZALCOATLUS',
    fullName: 'Quetzalcoatlus Northropi',
    role: 'Monarque Céleste',
    title: '« L’Envergure Démesurée des Cieux »',
    primaryColor: 0x52555a,
    secondaryColor: 0x2b2d30,
    accentColor: 0x8f7454,
    cssPrimary: '#5c6066',
    scale: 0.96,
    previewScale: 0.72,
    stats: { pow: 94, spd: 96, def: 74 },
    maxHp: 940,
    walkSpeed: 9.6,
    special1Name: 'Piqué Sonique (H)',
    special2Name: 'Bourrasque d’Ailes (T)',
    fatalityName: 'Chute Stratosphérique (R)',
    moveStyle: 'Démarche quadrupède ailée sur de longues échasses, vol libre stratosphérique de 2 secondes avec jauge circulaire d’endurance, estocs foudroyants et piqués dévastateurs.',
    fatalityDesc: 'Saisit l’ennemi de son long bec en dague, s’élève dans la haute atmosphère et le laisse s’écraser à vitesse terminale.',
    skins: [
        { name: 'Ashen Ridge Azhdarchid', primary: 0x52555a, secondary: 0x2b2d30, accent: 0x8f7454, membrane: 0x7d6c58, beak: 0x9c865b, isDefaultPBR: true },
        { name: 'Steppe Ochre Monarch', primary: 0x7a6852, secondary: 0x3b3126, accent: 0x8a523b, membrane: 0x8c775c, beak: 0xb09662 }
    ]
}, {
    // Hauteur de base du bassin utilisée par le système d'animation (5.2m de haut, hanches à 1.98m)
    animBaseHipsY: 1.98,
    attackReach: 4.15,

    // Spécial 2 (T)
    onSpecial2(attacker, defender, dist, basePow) {
        spawn3DProjectile(attacker, 'feather');
    }
});
