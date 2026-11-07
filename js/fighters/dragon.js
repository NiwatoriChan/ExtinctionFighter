/* ============================================================================
 * BOSS FINAL NON JOUABLE : DRAK'ZUL LE DRAGON PRIMORDIAL
 * Boss suprême de la Campagne (affronté après 5 prédateurs aléatoires).
 * Stylisation cartoon mature / Primal graphic comic :
 * - Cartographie PBR procédurale 1024x1024 (écailles d'obsidienne craquelées de magma,
 *   voilure alaire en cuir incandescent nervuré, plastron ventral embrasé)
 * - Anatomie reptilienne d'archosaure volcanique au garrot puissant et crête d'ostéodermes
 * - Crâne cornu cuirassé aux yeux ardents et gosier de feu
 * - Grandes ailes membraneuses à 4 doigts osseux et griffe d'alula articulée
 * - Queue serpentine crantée à dard hallebarde
 * ============================================================================ */

let _cachedDragonPBR = null;
function getDragonPBRMaps() {
    if (_cachedDragonPBR) return _cachedDragonPBR;
    if (typeof document === 'undefined') return { scaleTex: null, bumpTex: null, wingTex: null, magmaTex: null };

    const size = 1024;
    const scaleCanvas = document.createElement('canvas');
    const bumpCanvas = document.createElement('canvas');
    const wingCanvas = document.createElement('canvas');
    const magmaCanvas = document.createElement('canvas');
    scaleCanvas.width = bumpCanvas.width = wingCanvas.width = magmaCanvas.width = size;
    scaleCanvas.height = bumpCanvas.height = wingCanvas.height = magmaCanvas.height = size;

    const sCtx = scaleCanvas.getContext('2d');
    const bCtx = bumpCanvas.getContext('2d');
    const wCtx = wingCanvas.getContext('2d');
    const mCtx = magmaCanvas.getContext('2d');

    let seed = 638291;
    const rand = () => { seed = (seed * 16807 + 11) % 2147483647; return (seed & 0x7fffffff) / 2147483647; };

    // --- 1. ÉCAILLES D'OBSIDIENNE & FAUX DE MAGMA ---
    sCtx.fillStyle = '#111113'; // Noir obsidienne de base
    sCtx.fillRect(0, 0, size, size);

    bCtx.fillStyle = '#808080';
    bCtx.fillRect(0, 0, size, size);

    const cols = 36;
    const rows = 36;
    const cellW = size / cols;
    const cellH = size / rows;

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const cx = (c + 0.5) * cellW + (rand() - 0.5) * 4;
            const cy = (r + 0.5) * cellH + (rand() - 0.5) * 4;
            const rw = cellW * (0.38 + rand() * 0.22);
            const rh = cellH * (0.38 + rand() * 0.22);

            // Écaille polygonale facettée
            sCtx.beginPath();
            sCtx.ellipse(cx, cy, rw, rh, (rand() - 0.5) * 0.4, 0, Math.PI * 2);
            sCtx.fillStyle = rand() > 0.5 ? '#1c1917' : '#0c0a09';
            sCtx.fill();
            sCtx.strokeStyle = rand() > 0.8 ? 'rgba(239, 68, 68, 0.45)' : 'rgba(5, 5, 6, 0.95)';
            sCtx.lineWidth = 1.8;
            sCtx.stroke();

            bCtx.beginPath();
            bCtx.ellipse(cx, cy, rw, rh, 0, 0, Math.PI * 2);
            bCtx.fillStyle = rand() > 0.5 ? '#404040' : '#b0b0b0';
            bCtx.fill();
        }
    }

    // Réseau de micro-fissures de magma ardent traversant les écailles
    sCtx.strokeStyle = 'rgba(255, 59, 0, 0.85)';
    sCtx.lineWidth = 2.4;
    for (let k = 0; k < 22; k++) {
        let x = rand() * size;
        let y = rand() * size;
        sCtx.beginPath();
        sCtx.moveTo(x, y);
        for (let seg = 0; seg < 6; seg++) {
            x += (rand() - 0.5) * 60;
            y += (rand() - 0.5) * 60;
            sCtx.lineTo(x, y);
        }
        sCtx.stroke();
    }

    // --- 2. MEMBRANE ALAIRE INCANDESCENTE ---
    const wGrad = wCtx.createLinearGradient(0, 0, size, size);
    wGrad.addColorStop(0.00, '#450a0a'); // Racine de l'aile sombre
    wGrad.addColorStop(0.35, '#991b1b'); // Cuir rouge sang
    wGrad.addColorStop(0.65, '#dc2626'); // Braises vives
    wGrad.addColorStop(0.90, '#f97316'); // Bord festonné embrasé
    wGrad.addColorStop(1.00, '#1c1917');
    wCtx.fillStyle = wGrad;
    wCtx.fillRect(0, 0, size, size);

    // Réseau veineux de lave rayonnant à travers la membrane
    wCtx.strokeStyle = 'rgba(254, 240, 138, 0.45)';
    wCtx.lineWidth = 1.8;
    for (let i = 0; i < 40; i++) {
        const startX = rand() * (size * 0.3);
        const startY = rand() * (size * 0.3);
        wCtx.beginPath();
        wCtx.moveTo(startX, startY);
        wCtx.bezierCurveTo(
            startX + size * 0.3 + (rand() - 0.5) * 80,
            startY + size * 0.3 + (rand() - 0.5) * 80,
            startX + size * 0.6 + (rand() - 0.5) * 80,
            startY + size * 0.6 + (rand() - 0.5) * 80,
            size * (0.7 + rand() * 0.3),
            size * (0.7 + rand() * 0.3)
        );
        wCtx.stroke();
    }

    // --- 3. PLASTRON VENTRAL DE MAGMA EN FUSION ---
    const mGrad = mCtx.createLinearGradient(0, 0, 0, size);
    mGrad.addColorStop(0.00, '#fffbeb'); // Cœur blanc-jaune de lave
    mGrad.addColorStop(0.20, '#fef08a');
    mGrad.addColorStop(0.45, '#f59e0b');
    mGrad.addColorStop(0.70, '#ef4444');
    mGrad.addColorStop(0.90, '#991b1b');
    mGrad.addColorStop(1.00, '#1c1917');
    mCtx.fillStyle = mGrad;
    mCtx.fillRect(0, 0, size, size);

    const scaleTex = new THREE.CanvasTexture(scaleCanvas);
    const bumpTex = new THREE.CanvasTexture(bumpCanvas);
    const wingTex = new THREE.CanvasTexture(wingCanvas);
    const magmaTex = new THREE.CanvasTexture(magmaCanvas);
    scaleTex.wrapS = scaleTex.wrapT = bumpTex.wrapS = bumpTex.wrapT = THREE.RepeatWrapping;
    wingTex.wrapS = wingTex.wrapT = magmaTex.wrapS = magmaTex.wrapT = THREE.ClampToEdgeWrapping;

    const applySRGB = (tex) => {
        if ('colorSpace' in tex && THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
        else if ('encoding' in tex && THREE.sRGBEncoding) tex.encoding = THREE.sRGBEncoding;
    };
    applySRGB(scaleTex);
    applySRGB(wingTex);
    applySRGB(magmaTex);

    _cachedDragonPBR = { scaleTex, bumpTex, wingTex, magmaTex };
    return _cachedDragonPBR;
}

registerBoss({
    id: 'dragon',
    name: "DRAK'ZUL",
    fullName: "Drak'Zul le Dragon Primordial",
    role: "Boss Suprême (Non Jouable)",
    title: "« Le Fléau Incandescent de l'Extinction »",
    primaryColor: 0x111113,
    secondaryColor: 0x1c1917,
    accentColor: 0xff3b00,
    cssPrimary: '#ef4444',
    scale: 1.35,
    previewScale: 0.75,
    stats: { pow: 48, spd: 55, def: 40 },
    maxHp: 680,
    walkSpeed: 5.2,
    special1Name: 'Souffle Infernale (H)',
    special2Name: 'Cataclysme Éruptif (T)',
    fatalityName: 'Incinération Suprême (R)',
    moveStyle: 'Posture serpentine colossale, battements d’ailes destructeurs et souffle de magma.',
    fatalityDesc: 'Broie la victime sous son talon draconique et la réduit en cendres par un torrent de feu infernal.',
    isBoss: true,
    skins: [
        { name: 'Hellfire Obsidian', primary: 0x111113, secondary: 0x1c1917, accent: 0xff3b00, membrane: 0x991b1b },
        { name: 'Abyssal Frost', primary: 0x0f172a, secondary: 0x0284c7, accent: 0x38bdf8, membrane: 0x0369a1 }
    ]
}, {
    animBaseHipsY: 2.1,
    attackReach: 3.15,

    onSpecial(attacker, defender, dist, basePow) {
        sfx.playRoar(75, 0.5);
        spawn3DProjectile(attacker, 'dragon_fire');
    },

    onSpecial2(attacker, defender, dist, basePow) {
        screenShake = 0.35;
        spawn3DBloodAndBones(defender.x, 0.3, 10, true);
        if (dist < 4.2) {
            applyDamage(attacker, defender, Math.round(basePow * 0.8), true, 'CATACLYSME DRACONIQUE !');
        }
    },

    buildRig(ctx) {
        const { hips, rig, addMesh, darkMat, accentMat, boneMat, skin, skinMeshes } = ctx;

        const pbr = getDragonPBRMaps();

        const stylizedBodyMat = new THREE.MeshStandardMaterial({
            color: skin.primary || 0x111113,
            map: pbr.scaleTex,
            bumpMap: pbr.bumpTex,
            bumpScale: 0.08,
            roughness: 0.35,
            metalness: 0.65
        });
        const darkHornMat = new THREE.MeshStandardMaterial({
            color: skin.secondary || 0x1c1917,
            roughness: 0.30,
            metalness: 0.50
        });
        const wingMembraneMat = new THREE.MeshStandardMaterial({
            color: skin.membrane || 0x991b1b,
            map: pbr.wingTex,
            roughness: 0.45,
            metalness: 0.20,
            emissive: 0x7f1d1d,
            emissiveIntensity: 0.35,
            side: THREE.DoubleSide
        });
        const magmaMat = new THREE.MeshStandardMaterial({
            color: skin.accent || 0xff3b00,
            map: pbr.magmaTex,
            roughness: 0.20,
            metalness: 0.40,
            emissive: 0xff3b00,
            emissiveIntensity: 0.75
        });
        const eyeGlowMat = new THREE.MeshBasicMaterial({ color: 0xffeb3b });
        const pupilMat = new THREE.MeshBasicMaterial({ color: 0x09090b });

        const UP = new THREE.Vector3(0, 1, 0);
        const bone = (parent, a, b, r1, r2, mat, seg = 9) => {
            const A = new THREE.Vector3(a[0], a[1], a[2]);
            const B = new THREE.Vector3(b[0], b[1], b[2]);
            const dir = B.clone().sub(A);
            const len = dir.length();
            const m = addMesh(new THREE.CylinderGeometry(r2, r1, len, seg), mat, parent,
                (A.x + B.x) / 2, (A.y + B.y) / 2, (A.z + B.z) / 2);
            m.quaternion.setFromUnitVectors(UP, dir.normalize());
            if (mat === stylizedBodyMat) skinMeshes.push(m);
            return m;
        };
        const joint = (parent, p, r, mat) => addMesh(new THREE.SphereGeometry(r, 12, 10), mat, parent, p[0], p[1], p[2]);
        const blob = (parent, p, s, mat, rz = 0, ry = 0, rx = 0) => {
            const m = addMesh(new THREE.SphereGeometry(1, 16, 12), mat, parent, p[0], p[1], p[2], rx, ry, rz);
            m.scale.set(s[0], s[1], s[2]);
            if (mat === stylizedBodyMat) skinMeshes.push(m);
            return m;
        };
        const membrane = (parent, pts, mat) => {
            const g = new THREE.BufferGeometry();
            g.setAttribute('position', new THREE.Float32BufferAttribute(pts.flat(), 3));
            const idx = [];
            for (let i = 1; i < pts.length - 1; i++) idx.push(0, i, i + 1);
            g.setIndex(idx);
            g.computeVertexNormals();
            const m = addMesh(g, mat, parent);
            skinMeshes.push(m);
            return m;
        };

        hips.position.y = 2.1;

        // =====================================================================
        // 1. TORSE D'ARCHOSAURE VOLCANIQUE : écailles d'obsidienne & plastron magma
        // =====================================================================
        blob(rig.torso, [0.06, 0.24, 0], [1.38, 0.76, 0.70], stylizedBodyMat, 0.14);
        blob(rig.torso, [0.70, 0.36, 0], [0.80, 0.72, 0.72], darkHornMat, 0.22);       // Épaules cuirassées
        blob(rig.torso, [-0.60, 0.14, 0], [0.82, 0.66, 0.62], stylizedBodyMat, 0.04);  // Bassin colossal

        // Plastron ventral segmenté incandescent (sillons de magma)
        for (let v = 0; v < 6; v++) {
            const vx = -0.55 + v * 0.26;
            const vy = -0.22 + v * 0.04;
            blob(rig.torso, [vx, vy, 0], [0.17, 0.30, 0.54 - Math.abs(v - 2.5) * 0.04], magmaMat, 0.14);
        }

        // Crête d'ostéodermes dorsaux épineux en basalte
        for (let i = 0; i < 8; i++) {
            const sx = -1.05 + i * 0.28;
            const sy = 0.74 + Math.sin(i * 0.4) * 0.16;
            addMesh(new THREE.ConeGeometry(0.095, 0.38, 5), darkHornMat, rig.torso, sx, sy, 0, 0, 0, 0.35);
        }

        // =====================================================================
        // 2. GRANDES AILES MEMBRANEUSES ANATOMIQUES À 4 DOIGTS ET ALULA GRIFFUE
        // =====================================================================
        const buildDragonWing = (side) => {
            const wGroup = new THREE.Group();
            wGroup.position.set(0.46, 0.60, side * 0.54);
            rig.torso.add(wGroup);

            const S = [0, 0, 0];
            const E = [-0.30, 0.58, side * 0.46];        // Coude
            const W = [0.68, 1.52, side * 0.70];         // Poignet haut

            joint(wGroup, S, 0.17, darkHornMat);
            bone(wGroup, S, E, 0.15, 0.12, darkHornMat, 8);
            joint(wGroup, E, 0.13, darkHornMat);
            bone(wGroup, E, W, 0.12, 0.095, stylizedBodyMat, 8);
            joint(wGroup, W, 0.11, darkHornMat);

            // Griffe d'alula recourbée au poignet
            bone(wGroup, W, [W[0] + 0.25, W[1] - 0.04, W[2]], 0.048, 0.032, darkHornMat, 5);
            addMesh(new THREE.ConeGeometry(0.038, 0.20, 5), darkHornMat, wGroup, W[0] + 0.30, W[1] - 0.15, W[2], 0, 0, Math.PI - 0.3);

            // 4 longs doigts osseux déployant la voilure
            const F1 = [-1.50, 0.94, side * 0.98];
            const F2 = [-1.68, 0.14, side * 0.90];
            const F3 = [-1.32, -0.60, side * 0.74];
            const F4 = [-0.75, -0.84, side * 0.50];
            const Flank = [-0.98, -0.44, 0];

            [F1, F2, F3, F4].forEach(fTip => {
                bone(wGroup, W, fTip, 0.052, 0.015, darkHornMat, 7);
            });

            // Membranes entre les doigts et le flanc
            membrane(wGroup, [W, F1, F2], wingMembraneMat);
            membrane(wGroup, [W, F2, F3], wingMembraneMat);
            membrane(wGroup, [W, F3, F4, E], wingMembraneMat);
            membrane(wGroup, [E, F4, Flank, S], wingMembraneMat);
            // Propatagium avant
            membrane(wGroup, [S, W, E], wingMembraneMat);

            return wGroup;
        };

        rig.specialParts.leftWing = buildDragonWing(1);
        rig.specialParts.rightWing = buildDragonWing(-1);

        // =====================================================================
        // 3. COU PUISSANT EN S & CRÂNE DRACONIQUE CORNU
        // =====================================================================
        rig.neck.position.set(1.10, 0.58, 0);
        rig.torso.add(rig.neck);
        const N0 = [0, 0, 0], N1 = [0.34, 0.40, 0], N2 = [0.56, 0.76, 0];
        bone(rig.neck, N0, N1, 0.44, 0.35, stylizedBodyMat, 10);
        joint(rig.neck, N1, 0.34, stylizedBodyMat);
        bone(rig.neck, N1, N2, 0.34, 0.29, stylizedBodyMat, 10);

        // Gorge incandescente magma et épines cervicales
        for (let k = 0; k < 4; k++) {
            const t = k / 3;
            blob(rig.neck, [0.12 + t * 0.42, 0.04 + t * 0.58, 0], [0.13, 0.17, 0.27 - t * 0.04], magmaMat, 0.5);
            addMesh(new THREE.ConeGeometry(0.065, 0.26, 5), darkHornMat, rig.neck, t * 0.45, 0.28 + t * 0.62, 0, 0, 0, 0.45);
        }

        rig.headGroup.position.set(0.58, 0.80, 0);
        rig.neck.add(rig.headGroup);

        // Crâne reptilien cuirassé et museau carnassier
        blob(rig.headGroup, [0.18, 0.08, 0], [0.44, 0.30, 0.34], darkHornMat, -0.06);
        blob(rig.headGroup, [0.66, 0.04, 0], [0.46, 0.24, 0.26], stylizedBodyMat, -0.10);
        blob(rig.headGroup, [0.96, 0.02, 0], [0.24, 0.20, 0.22], darkHornMat, -0.15);

        // Grandes cornes occipitales courbées vers l'arrière + cornes temporales
        [-1, 1].forEach(side => {
            const H0 = [0.02, 0.26, side * 0.22];
            const H1 = [-0.44, 0.48, side * 0.33];
            const H2 = [-0.92, 0.60, side * 0.38];
            bone(rig.headGroup, H0, H1, 0.095, 0.06, darkHornMat, 7);
            bone(rig.headGroup, H1, H2, 0.06, 0.012, darkHornMat, 6);

            // Seconde paire de cornes jugales
            bone(rig.headGroup, [0.06, 0.12, side * 0.28], [-0.46, 0.24, side * 0.45], 0.065, 0.014, darkHornMat, 6);
            addMesh(new THREE.ConeGeometry(0.048, 0.20, 5), darkHornMat, rig.headGroup, 0.12, -0.04, side * 0.33, side * 0.6, 0, 0.8);

            // Yeux ardents sous arcade osseuse
            blob(rig.headGroup, [0.35, 0.19, side * 0.25], [0.19, 0.07, 0.09], darkHornMat, 0.1);
            addMesh(new THREE.SphereGeometry(0.058, 10, 10), eyeGlowMat, rig.headGroup, 0.37, 0.10, side * 0.27);
            addMesh(new THREE.SphereGeometry(0.028, 8, 8), pupilMat, rig.headGroup, 0.40, 0.10, side * 0.30);
        });

        // Crocs supérieurs acérés
        for (let t = 0; t < 6; t++) {
            const tx = 0.34 + t * 0.12;
            [-1, 1].forEach(side => {
                addMesh(new THREE.ConeGeometry(0.026, 0.15, 5), boneMat, rig.headGroup, tx, -0.12, side * (0.21 - t * 0.01), Math.PI, 0, 0);
            });
        }

        // Mâchoire inférieure et gosier de feu
        rig.jaw.position.set(0.12, -0.12, 0);
        rig.headGroup.add(rig.jaw);
        bone(rig.jaw, [0, 0, 0], [0.84, -0.02, 0], 0.19, 0.12, darkHornMat, 7);
        blob(rig.jaw, [0.40, 0.04, 0], [0.38, 0.07, 0.15], magmaMat);
        for (let t = 0; t < 5; t++) {
            const tx = 0.26 + t * 0.12;
            [-1, 1].forEach(side => {
                addMesh(new THREE.ConeGeometry(0.023, 0.12, 5), boneMat, rig.jaw, tx, 0.06, side * 0.16);
            });
        }

        // =====================================================================
        // 4. MEMBRES ANTÉRIEURS (rig.arms) & POSTÉRIEURS (rig.legs)
        // =====================================================================
        [-1, 1].forEach(side => {
            // Bras / pattes avant puissantes
            const arm = new THREE.Group();
            arm.position.set(0.80, 0.02, side * 0.56);
            rig.torso.add(arm);
            rig.arms.push(arm);

            const E = [-0.14, -0.80, side * 0.06];
            const W = [0.18, -1.70, side * 0.04];
            blob(arm, [-0.04, -0.40, 0], [0.30, 0.48, 0.28], darkHornMat, -0.15);
            joint(arm, E, 0.19, darkHornMat);
            bone(arm, E, W, 0.19, 0.14, stylizedBodyMat, 8);
            [-0.10, 0, 0.10].forEach(dz => {
                const tip = [W[0] + 0.25, -1.98, W[2] + dz];
                bone(arm, W, tip, 0.048, 0.032, darkHornMat, 5);
                addMesh(new THREE.ConeGeometry(0.036, 0.16, 5), darkHornMat, arm, tip[0] + 0.06, tip[1] - 0.02, tip[2], 0, 0, -Math.PI / 2 - 0.25);
            });

            // Pattes arrière digitigrades puissantes (sol à y = -2.1)
            const leg = new THREE.Group();
            leg.position.set(-0.35, 0.04, side * 0.58);
            hips.add(leg);
            rig.legs.push(leg);

            const K = [0.25, -0.80, side * 0.04];
            const A = [-0.22, -1.54, side * 0.04];
            const F = [0.14, -2.04, side * 0.04];
            blob(leg, [0.06, -0.40, 0], [0.44, 0.56, 0.36], stylizedBodyMat, 0.22);
            joint(leg, K, 0.23, darkHornMat);
            bone(leg, K, A, 0.22, 0.15, darkHornMat, 8);
            joint(leg, A, 0.15, darkHornMat);
            bone(leg, A, F, 0.15, 0.12, stylizedBodyMat, 7);
            [-0.12, 0, 0.12].forEach(dz => {
                const tip = [F[0] + 0.34, -2.08, F[2] + dz];
                bone(leg, F, tip, 0.058, 0.04, darkHornMat, 5);
                addMesh(new THREE.ConeGeometry(0.042, 0.17, 5), darkHornMat, leg, tip[0] + 0.07, tip[1], tip[2], 0, 0, -Math.PI / 2 - 0.15);
            });
        });

        // =====================================================================
        // 5. LONGUE QUEUE SINUEUSE CRANTÉE À DARD HALLEBARDE (4 segments)
        // =====================================================================
        let parentTail = rig.torso;
        const tLens = [0.95, 0.95, 0.92, 0.98];
        const tRads = [0.48, 0.36, 0.24, 0.14, 0.06];
        for (let s = 0; s < 4; s++) {
            const seg = new THREE.Group();
            seg.position.set(s === 0 ? -1.18 : -tLens[s - 1], s === 0 ? 0.12 : 0, 0);
            const len = tLens[s], r1 = tRads[s], r2 = tRads[s + 1];
            bone(seg, [0, 0, 0], [-len, 0.02, 0], r1, r2, stylizedBodyMat, 8);
            // Épines dorsales tout le long de la queue
            [-0.26, -0.60, -0.88].forEach(bx => {
                addMesh(new THREE.ConeGeometry(0.058 - s * 0.01, 0.24 - s * 0.03, 4), darkHornMat, seg, bx, r1 * 0.75, 0, 0, 0, 0.35);
            });
            parentTail.add(seg);
            rig.tailSegments.push(seg);
            parentTail = seg;
        }
        // Dard caudal barbelé en fer de lance à l'extrémité
        membrane(parentTail, [[-0.68, 0, 0], [-1.08, 0.25, 0], [-1.60, 0.02, 0], [-1.08, -0.22, 0]], darkHornMat);
        bone(parentTail, [-0.88, 0, 0], [-1.68, 0.02, 0], 0.065, 0.009, darkHornMat, 7);
    },
});
