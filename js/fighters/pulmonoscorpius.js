/* ============================================================================
 * COMBATTANT : PULMONOSCORPIUS (Pulmonoscorpius Kirktonensis - Scorpion Primordial)
 * Stylisation cartoon mature / Primal graphic comic :
 * - Cartographie PBR procédurale 1024x1024 (chitine ultraviolette irisée, tergites
 *   granulés aux carènes keeled, ampoule du telson venimeux incandescente)
 * - Mésosoma à 7 tergites imbriqués avec sternites ventraux
 * - Prosoma trapézoïdal pourvu d'ocelles médians et latéraux, et chélicères
 * - Pédipalpes massifs aux pinces renflées et doigts dentelés
 * - 8 pattes ambulatoires articulées aux griffes tarsales
 * - Métasoma en 5 segments carénés et dard caudal mortel
 * ============================================================================ */

let _cachedScorpionPBR = null;
function getScorpionPBRMaps() {
    if (_cachedScorpionPBR) return _cachedScorpionPBR;
    if (typeof document === 'undefined') return { chitinTex: null, bumpTex: null, telsonTex: null };

    const size = 1024;
    const chitinCanvas = document.createElement('canvas');
    const bumpCanvas = document.createElement('canvas');
    const telsonCanvas = document.createElement('canvas');
    chitinCanvas.width = bumpCanvas.width = telsonCanvas.width = size;
    chitinCanvas.height = bumpCanvas.height = telsonCanvas.height = size;

    const cCtx = chitinCanvas.getContext('2d');
    const bCtx = bumpCanvas.getContext('2d');
    const tCtx = telsonCanvas.getContext('2d');

    let seed = 519283;
    const rand = () => { seed = (seed * 16807 + 11) % 2147483647; return (seed & 0x7fffffff) / 2147483647; };

    // --- 1. CHITINE ULTRAVIOLETTE ET CARÈNES SEGMENTÉES ---
    const cGrad = cCtx.createLinearGradient(0, 0, size, size);
    cGrad.addColorStop(0.00, '#1e1035'); // Noir violet profond
    cGrad.addColorStop(0.25, '#3b0764');
    cGrad.addColorStop(0.50, '#7e22ce'); // Pourpre royal
    cGrad.addColorStop(0.75, '#a855f7'); // Violet néon chatoyant
    cGrad.addColorStop(0.90, '#c084fc');
    cGrad.addColorStop(1.00, '#f43f5e'); // Reflets pourpres vifs
    cCtx.fillStyle = cGrad;
    cCtx.fillRect(0, 0, size, size);

    bCtx.fillStyle = '#808080';
    bCtx.fillRect(0, 0, size, size);

    // Plaques chitineuses polygonales et granulations
    const cols = 32;
    const rows = 32;
    const cellW = size / cols;
    const cellH = size / rows;

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const cx = (c + 0.5) * cellW + (rand() - 0.5) * 6;
            const cy = (r + 0.5) * cellH + (rand() - 0.5) * 6;
            const rad = cellW * (0.35 + rand() * 0.25);

            cCtx.beginPath();
            cCtx.arc(cx, cy, rad, 0, Math.PI * 2);
            cCtx.fillStyle = rand() > 0.6 ? 'rgba(88, 28, 135, 0.45)' : 'rgba(244, 63, 94, 0.25)';
            cCtx.fill();
            cCtx.strokeStyle = 'rgba(15, 6, 28, 0.8)';
            cCtx.lineWidth = 1.6;
            cCtx.stroke();

            bCtx.beginPath();
            bCtx.arc(cx, cy, rad, 0, Math.PI * 2);
            bCtx.fillStyle = rand() > 0.5 ? '#d0d0d0' : '#404040';
            bCtx.fill();
        }
    }

    // Carènes longitudinales saillantes
    cCtx.strokeStyle = 'rgba(244, 63, 94, 0.6)';
    cCtx.lineWidth = 3.5;
    for (let i = 0; i < 8; i++) {
        const x = (i + 0.5) * (size / 8);
        cCtx.beginPath();
        cCtx.moveTo(x, 0);
        cCtx.lineTo(x, size);
        cCtx.stroke();
    }

    // --- 2. TELSON VENIMEUX INCANDESCENT ---
    const tGrad = tCtx.createRadialGradient(size * 0.5, size * 0.5, 20, size * 0.5, size * 0.5, size * 0.5);
    tGrad.addColorStop(0.0, '#ffe4e6'); // Cœur de venin incandescent
    tGrad.addColorStop(0.2, '#f43f5e');
    tGrad.addColorStop(0.5, '#e11d48');
    tGrad.addColorStop(0.8, '#881337');
    tGrad.addColorStop(1.0, '#1c1917'); // Bordure chitineuse sombre
    tCtx.fillStyle = tGrad;
    tCtx.fillRect(0, 0, size, size);

    // Réseau de tubules vasculaires à venin
    tCtx.strokeStyle = 'rgba(255, 228, 230, 0.7)';
    tCtx.lineWidth = 2.2;
    for (let v = 0; v < 16; v++) {
        tCtx.beginPath();
        tCtx.moveTo(size * 0.5, size * 0.5);
        const ang = (v / 16) * Math.PI * 2;
        const dist = size * (0.35 + rand() * 0.15);
        tCtx.quadraticCurveTo(
            size * 0.5 + Math.cos(ang + 0.4) * dist * 0.6,
            size * 0.5 + Math.sin(ang + 0.4) * dist * 0.6,
            size * 0.5 + Math.cos(ang) * dist,
            size * 0.5 + Math.sin(ang) * dist
        );
        tCtx.stroke();
    }

    const chitinTex = new THREE.CanvasTexture(chitinCanvas);
    const bumpTex = new THREE.CanvasTexture(bumpCanvas);
    const telsonTex = new THREE.CanvasTexture(telsonCanvas);
    chitinTex.wrapS = chitinTex.wrapT = bumpTex.wrapS = bumpTex.wrapT = THREE.RepeatWrapping;
    telsonTex.wrapS = telsonTex.wrapT = THREE.ClampToEdgeWrapping;

    const applySRGB = (tex) => {
        if ('colorSpace' in tex && THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
        else if ('encoding' in tex && THREE.sRGBEncoding) tex.encoding = THREE.sRGBEncoding;
    };
    applySRGB(chitinTex);
    applySRGB(telsonTex);

    _cachedScorpionPBR = { chitinTex, bumpTex, telsonTex };
    return _cachedScorpionPBR;
}

registerFighter({
    id: 'pulmonoscorpius',
    name: 'PULMONOSCORPIUS',
    fullName: 'Pulmonoscorpius Kirktonensis',
    role: 'Scorpion Primordial Apex',
    title: '« L’Arachnide Venimeux du Carbonifère »',
    primaryColor: 0x9333ea,
    secondaryColor: 0x2e1065,
    accentColor: 0xf43f5e,
    cssPrimary: '#9333ea',
    scale: 0.82,
    previewScale: 0.95,
    stats: { pow: 94, spd: 88, def: 90 },
    maxHp: 1020,
    walkSpeed: 8.8,
    special1Name: 'Dard Neurotoxique (H)',
    special2Name: 'Pince Broyeuse (T)',
    fatalityName: 'Injection Mortelle (R)',
    moveStyle: 'Galop à 8 pattes chitineuses, garde de pinces dentelées et dard caudal prêt à fondre.',
    fatalityDesc: 'Verrouille la tête de la victime dans ses pinces et lui transperce le crâne de son dard caudal venimeux jusqu’à liquéfaction.',
    skins: [
        { name: 'Ultraviolet Chitin', primary: 0x9333ea, secondary: 0x2e1065, accent: 0xf43f5e, legs: 0xa855f7 },
        { name: 'Toxic Emerald', primary: 0x059669, secondary: 0x064e3b, accent: 0x10b981, legs: 0x34d399 }
    ]
}, {
    animBaseHipsY: 0.95,

    onSpecial2(attacker, defender, dist, basePow) {
        sfx.playStinger();
        spawn3DProjectile(attacker, 'venom');
    },

    buildRig(ctx) {
        const { hips, rig, addMesh, skin, skinMeshes } = ctx;

        const pbr = getScorpionPBRMaps();

        const chitinMat = new THREE.MeshStandardMaterial({
            color: skin.primary || 0x9333ea,
            map: pbr.chitinTex,
            bumpMap: pbr.bumpTex,
            bumpScale: 0.08,
            roughness: 0.28,
            metalness: 0.55
        });
        const darkChitinMat = new THREE.MeshStandardMaterial({
            color: skin.secondary || 0x2e1065,
            roughness: 0.35,
            metalness: 0.60
        });
        const legChitinMat = new THREE.MeshStandardMaterial({
            color: skin.legs || 0xa855f7,
            roughness: 0.30,
            metalness: 0.40
        });
        const telsonMat = new THREE.MeshStandardMaterial({
            color: skin.accent || 0xf43f5e,
            map: pbr.telsonTex,
            roughness: 0.20,
            metalness: 0.50,
            emissive: 0xe11d48,
            emissiveIntensity: 0.50
        });
        const tipMat = new THREE.MeshStandardMaterial({ color: 0x0d0d0f, roughness: 0.22, metalness: 0.40 });
        const eyeBlackMat = new THREE.MeshBasicMaterial({ color: 0x09090b });

        const UP = new THREE.Vector3(0, 1, 0);
        const bone = (parent, a, b, r1, r2, mat, seg = 8) => {
            const A = new THREE.Vector3(a[0], a[1], a[2]);
            const B = new THREE.Vector3(b[0], b[1], b[2]);
            const dir = B.clone().sub(A);
            const len = dir.length();
            const m = addMesh(new THREE.CylinderGeometry(r2, r1, len, seg), mat, parent,
                (A.x + B.x) / 2, (A.y + B.y) / 2, (A.z + B.z) / 2);
            m.quaternion.setFromUnitVectors(UP, dir.normalize());
            skinMeshes.push(m);
            return m;
        };
        const joint = (parent, p, r, mat) => {
            const m = addMesh(new THREE.SphereGeometry(r, 10, 8), mat, parent, p[0], p[1], p[2]);
            skinMeshes.push(m);
            return m;
        };
        const blob = (parent, p, s, mat, rz = 0, ry = 0, rx = 0) => {
            const m = addMesh(new THREE.SphereGeometry(1, 14, 10), mat, parent, p[0], p[1], p[2], rx, ry, rz);
            m.scale.set(s[0], s[1], s[2]);
            skinMeshes.push(m);
            return m;
        };

        hips.position.y = 0.95;

        // =====================================================================
        // 1. MÉSOSOMA SEGMENTÉ (7 tergites carénées) & CÉPHALOTHORAX (PROSOMA)
        // =====================================================================
        for (let t = 0; t < 7; t++) {
            const tx = -0.82 + t * 0.22;
            const archW = 0.58 - Math.pow((t - 2.5) / 5.5, 2) * 0.22;
            const archH = 0.27 - Math.abs(t - 2.5) * 0.015;
            // Tergite bombé avec relief PBR
            blob(rig.torso, [tx, 0.08, 0], [0.17, archH, archW], chitinMat);
            // Bordure sombre d'articulation inter-segmentaire
            blob(rig.torso, [tx - 0.07, 0.10, 0], [0.05, archH * 1.05, archW * 1.02], darkChitinMat);
            // Épines latérales carénées de tergite
            [-1, 1].forEach(side => {
                addMesh(new THREE.ConeGeometry(0.04, 0.14, 4), darkChitinMat, rig.torso, tx, 0.08, side * archW * 0.95, side * 0.4, 0, 0);
            });
        }
        // Sternites ventraux plus clairs
        blob(rig.torso, [-0.15, -0.06, 0], [0.88, 0.17, 0.48], legChitinMat);

        // Céphalothorax (Prosoma) trapézoïdal
        rig.headGroup.position.set(0.56, 0.10, 0);
        rig.torso.add(rig.headGroup);
        blob(rig.headGroup, [0.12, 0.02, 0], [0.40, 0.23, 0.46], darkChitinMat, -0.05);
        blob(rig.headGroup, [0.22, 0.06, 0], [0.30, 0.19, 0.38], chitinMat, -0.08);

        // Tubercule oculaire dorsal avec paire d'ocelles médians
        [-0.06, 0.06].forEach(z => {
            addMesh(new THREE.SphereGeometry(0.048, 8, 8), eyeBlackMat, rig.headGroup, 0.20, 0.23, z);
        });
        // Groupes d'yeux latéraux aux coins antérieurs
        [-1, 1].forEach(side => {
            [0.36, 0.43].forEach((ex, idx) => {
                addMesh(new THREE.SphereGeometry(0.034, 6, 6), eyeBlackMat, rig.headGroup, ex, 0.08, side * (0.33 - idx * 0.03));
            });
            // Chélicères (pinces préhensiles buccales à dards)
            blob(rig.headGroup, [0.50, -0.04, side * 0.11], [0.15, 0.08, 0.08], telsonMat, -0.2);
            addMesh(new THREE.ConeGeometry(0.038, 0.18, 5), tipMat, rig.headGroup, 0.64, -0.06, side * 0.10, 0, 0, -Math.PI / 2 - 0.15);
        });

        // =====================================================================
        // 2. DEUX GRANDS PÉDIPALPES ARTICULÉS (PINCES GÉANTES BROYEUSES)
        // =====================================================================
        [-1, 1].forEach(side => {
            const pincerArm = new THREE.Group();
            pincerArm.position.set(0.70, 0.04, side * 0.44);
            rig.torso.add(pincerArm);
            rig.arms.push(pincerArm);

            const S = [0, 0, 0];
            const E = [0.24, 0.02, side * 0.38];
            const W = [0.72, 0.0, side * 0.25];

            joint(pincerArm, S, 0.12, darkChitinMat);
            bone(pincerArm, S, E, 0.11, 0.12, legChitinMat, 8);
            joint(pincerArm, E, 0.13, darkChitinMat);
            bone(pincerArm, E, W, 0.13, 0.15, chitinMat, 8);

            // Manus (paume renflée de la pince)
            const chela = new THREE.Group();
            chela.position.set(W[0], W[1], W[2]);
            chela.rotation.y = -side * 0.22;
            pincerArm.add(chela);

            blob(chela, [0.26, 0.02, 0], [0.34, 0.19, 0.17], telsonMat, 0.06);
            blob(chela, [0.20, 0.02, 0], [0.28, 0.20, 0.18], chitinMat, 0.06);

            // Doigt fixe supérieur courbé
            bone(chela, [0.48, 0.08, 0], [0.96, 0.03, 0], 0.080, 0.016, darkChitinMat, 7);
            // Doigt mobile inférieur denticulé
            bone(chela, [0.46, -0.07, 0], [0.92, -0.02, 0], 0.070, 0.015, darkChitinMat, 7);

            // Dents acérées de préhension le long de l'intérieur des pinces
            for (let d = 0; d < 5; d++) {
                const dx = 0.55 + d * 0.08;
                addMesh(new THREE.ConeGeometry(0.018, 0.05, 4), tipMat, chela, dx, 0.04, 0, 0, 0, Math.PI);
                addMesh(new THREE.ConeGeometry(0.018, 0.05, 4), tipMat, chela, dx, -0.03, 0);
            }
        });

        // =====================================================================
        // 3. 8 PATTES AMBULATOIRES ARTICULÉES (4 paires, sol à y = -0.95)
        // =====================================================================
        for (let side = -1; side <= 1; side += 2) {
            for (let l = 0; l < 4; l++) {
                const legGroup = new THREE.Group();
                const xOffset = 0.40 - l * 0.29;
                legGroup.position.set(xOffset, -0.04, side * 0.44);
                hips.add(legGroup);
                rig.legs.push(legGroup);

                const spreadX = (1.5 - l) * 0.13;
                const C = [0, 0, 0];
                const F = [spreadX * 0.5, 0.20, side * 0.38];
                const P = [spreadX * 0.95, -0.32, side * 0.72];
                const T = [spreadX * 1.20, -0.88, side * 0.96];

                joint(legGroup, C, 0.075, darkChitinMat);
                bone(legGroup, C, F, 0.075, 0.065, legChitinMat, 7);
                joint(legGroup, F, 0.07, darkChitinMat);
                bone(legGroup, F, P, 0.065, 0.052, legChitinMat, 7);
                joint(legGroup, P, 0.055, darkChitinMat);
                bone(legGroup, P, T, 0.048, 0.028, chitinMat, 7);
                // Griffes tarsales doubles (ungues)
                addMesh(new THREE.ConeGeometry(0.022, 0.10, 4), tipMat, legGroup, T[0] + 0.03, T[1] - 0.02, T[2] + side * 0.03, 0, 0, -side * 0.5);
            }
        }

        // =====================================================================
        // 4. MÉTASOMA EN 5 SEGMENTS CARÉNÉS + TELSON VENIMEUX ET AIGUILLON
        // =====================================================================
        let pSeg = rig.torso;
        const mLens = [0.48, 0.48, 0.48, 0.50, 0.52];
        const mRads = [0.23, 0.21, 0.19, 0.17, 0.15, 0.12];
        for (let s = 0; s < 5; s++) {
            const seg = new THREE.Group();
            seg.position.set(s === 0 ? -0.94 : -mLens[s - 1], s === 0 ? 0.12 : 0.14, 0);
            const len = mLens[s], r1 = mRads[s], r2 = mRads[s + 1];
            joint(seg, [0, 0, 0], r1 * 1.05, darkChitinMat);
            bone(seg, [0, 0, 0], [-len, 0.14, 0], r1, r2, chitinMat, 8);
            // Carène dorsale keeled
            bone(seg, [-0.04, r1 * 0.65, 0], [-len + 0.04, 0.14 + r2 * 0.65, 0], r1 * 0.48, r2 * 0.48, darkChitinMat, 6);
            pSeg.add(seg);
            rig.tailSegments.push(seg);
            pSeg = seg;
        }

        // Telson (vésicule à venin incandescente) + Aculeus (aiguillon courbé d'onyx)
        const telson = new THREE.Group();
        telson.position.set(-0.52, 0.18, 0);
        blob(telson, [-0.06, 0.04, 0], [0.26, 0.18, 0.17], telsonMat, -0.25);
        bone(telson, [-0.15, 0.15, 0], [0.07, 0.38, 0], 0.080, 0.038, telsonMat, 8);
        bone(telson, [0.07, 0.38, 0], [0.30, 0.28, 0], 0.038, 0.005, tipMat, 7);
        pSeg.add(telson);
        rig.specialParts.stinger = telson;
    },
});
