/* ============================================================================
 * COMBATTANT : MÉGATHÉRIUM (Megatherium Americanum - Paresseux Géant)
 * Stylisation cartoon mature / Primal graphic comic :
 * - Cartographie PBR procédurale 1024x1024 (fourrure hirsute grossière du
 *   Pléistocène en mèches étagées, museau en cuir craquelé, griffes en kératine striée)
 * - Silhouette colossale en poire avec bassin monumental et garrot puissant
 * - Crâne massif arrondi à museau tronqué et orbites expressives
 * - Avant-bras herculéens pourvus de franges de longs poils et de 3 faux en ivoire
 * - Queue trépied massive stabilisant la posture bipède
 * - Pattes arrière columnaires pédolatérales
 * ============================================================================ */

let _cachedMegatheriumPBR = null;
function getMegatheriumPBRMaps() {
    if (_cachedMegatheriumPBR) return _cachedMegatheriumPBR;
    if (typeof document === 'undefined') return { furTex: null, bumpTex: null, clawTex: null };

    const size = 1024;
    const furCanvas = document.createElement('canvas');
    const bumpCanvas = document.createElement('canvas');
    const clawCanvas = document.createElement('canvas');
    furCanvas.width = bumpCanvas.width = clawCanvas.width = size;
    furCanvas.height = bumpCanvas.height = clawCanvas.height = size;

    const fCtx = furCanvas.getContext('2d');
    const bCtx = bumpCanvas.getContext('2d');
    const cCtx = clawCanvas.getContext('2d');

    let seed = 482910;
    const rand = () => { seed = (seed * 16807 + 11) % 2147483647; return (seed & 0x7fffffff) / 2147483647; };

    // --- 1. TOISON HIRSUTE GROSSIÈRE DE MÉGATHÉRIUM ---
    const furGrad = fCtx.createLinearGradient(0, 0, 0, size);
    furGrad.addColorStop(0.00, '#291205'); // Garrot & dos brun-châtaigne foncé
    furGrad.addColorStop(0.22, '#451a03');
    furGrad.addColorStop(0.48, '#78350f'); // Ocre terreux
    furGrad.addColorStop(0.72, '#b45309'); // Teintes ambre doré en surface
    furGrad.addColorStop(0.92, '#d97706');
    furGrad.addColorStop(1.00, '#fbbf24'); // Pointes décolorées par le soleil
    fCtx.fillStyle = furGrad;
    fCtx.fillRect(0, 0, size, size);

    bCtx.fillStyle = '#808080';
    bCtx.fillRect(0, 0, size, size);

    // Mèches grossières et épaisses de toison pléistocène
    for (let i = 0; i < 5000; i++) {
        const x = rand() * size;
        const y = rand() * size;
        const len = 14 + rand() * 32;
        const width = 2.2 + rand() * 2.8;
        const slant = (rand() - 0.5) * 12;

        const col = rand() > 0.4 ? 'rgba(69, 26, 3, 0.45)' : 'rgba(251, 191, 36, 0.22)';
        fCtx.strokeStyle = col;
        fCtx.lineWidth = width;
        fCtx.beginPath();
        fCtx.moveTo(x, y);
        fCtx.quadraticCurveTo(x + slant * 0.5, y + len * 0.5, x + slant, y + len);
        fCtx.stroke();

        bCtx.strokeStyle = rand() > 0.5 ? '#d8d8d8' : '#303030';
        bCtx.lineWidth = width;
        bCtx.beginPath();
        bCtx.moveTo(x, y);
        bCtx.quadraticCurveTo(x + slant * 0.5, y + len * 0.5, x + slant, y + len);
        bCtx.stroke();
    }

    // Traits d'encrage cel-shading façon comic book
    fCtx.strokeStyle = 'rgba(28, 12, 3, 0.5)';
    fCtx.lineWidth = 1.8;
    for (let j = 0; j < 350; j++) {
        const cx = rand() * size;
        const cy = rand() * size;
        fCtx.beginPath();
        fCtx.moveTo(cx, cy);
        fCtx.lineTo(cx + (rand() - 0.5) * 20, cy + 24 + rand() * 18);
        fCtx.stroke();
    }

    // --- 2. KÉRATINE RAYÉE DES GRIFFES GÉANTES ---
    const clawGrad = cCtx.createLinearGradient(0, 0, size, 0);
    clawGrad.addColorStop(0.0, '#1c1917'); // Dos de griffe sombre
    clawGrad.addColorStop(0.3, '#78350f');
    clawGrad.addColorStop(0.6, '#d97706'); // Kératine ambrée
    clawGrad.addColorStop(0.85, '#fef3c7'); // Fil tranchant
    clawGrad.addColorStop(1.0, '#fffbeb');
    cCtx.fillStyle = clawGrad;
    cCtx.fillRect(0, 0, size, size);

    cCtx.strokeStyle = 'rgba(41, 18, 5, 0.35)';
    cCtx.lineWidth = 2.4;
    for (let y = 16; y < size; y += 22 + rand() * 18) {
        cCtx.beginPath();
        cCtx.moveTo(0, y);
        cCtx.lineTo(size, y + (rand() - 0.5) * 12);
        cCtx.stroke();
    }

    const furTex = new THREE.CanvasTexture(furCanvas);
    const bumpTex = new THREE.CanvasTexture(bumpCanvas);
    const clawTex = new THREE.CanvasTexture(clawCanvas);
    furTex.wrapS = furTex.wrapT = bumpTex.wrapS = bumpTex.wrapT = THREE.RepeatWrapping;
    clawTex.wrapS = clawTex.wrapT = THREE.ClampToEdgeWrapping;

    const applySRGB = (tex) => {
        if ('colorSpace' in tex && THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
        else if ('encoding' in tex && THREE.sRGBEncoding) tex.encoding = THREE.sRGBEncoding;
    };
    applySRGB(furTex);
    applySRGB(clawTex);

    _cachedMegatheriumPBR = { furTex, bumpTex, clawTex };
    return _cachedMegatheriumPBR;
}

registerFighter({
    id: 'giantsloth',
    name: 'MÉGATHÉRIUM',
    fullName: 'Megatherium Americanum',
    role: 'Paresseux Géant Béhémoth',
    title: '« La Force Brute du Pléistocène »',
    primaryColor: 0xb45309,
    secondaryColor: 0x451a03,
    accentColor: 0xfbbf24,
    cssPrimary: '#d97706',
    scale: 1.08,
    previewScale: 0.90,
    stats: { pow: 96, spd: 70, def: 93 },
    maxHp: 1180,
    walkSpeed: 7.4,
    special1Name: 'Griffes Béhémoth (H)',
    special2Name: 'Écrasement Pectoral (T)',
    fatalityName: 'Étreinte Annihilatrice (R)',
    moveStyle: 'Posture bipède colossale et voûtée, revers de pattes herculéennes armées de griffes recourbées.',
    fatalityDesc: 'Enserre le torse de la victime dans ses avant-bras colossaux, brise la cage thoracique en deux dans une étreinte fatale avant de l’écraser au sol.',
    skins: [
        { name: 'Sunlit Megatherium', primary: 0xb45309, secondary: 0x451a03, accent: 0xfbbf24, claw: 0xfef3c7 },
        { name: 'Tundra Behemoth', primary: 0x78716c, secondary: 0x292524, accent: 0xd6d3d1, claw: 0xf5f5f4 }
    ]
}, {
    animBaseHipsY: 1.85,

    onSpecial2(attacker, defender, dist, basePow) {
        special2SeismicQuake(attacker, defender, dist, basePow);
    },

    buildRig(ctx) {
        const { hips, rig, addMesh, bodyMat, darkMat, accentMat, boneMat, skin, skinMeshes } = ctx;
        void accentMat;
        void boneMat;

        const pbr = getMegatheriumPBRMaps();

        const stylizedBodyMat = new THREE.MeshStandardMaterial({
            color: skin.primary || 0xb45309,
            map: pbr.furTex,
            bumpMap: pbr.bumpTex,
            bumpScale: 0.08,
            roughness: 0.72,
            metalness: 0.04
        });
        const darkFurMat = new THREE.MeshStandardMaterial({
            color: skin.secondary || 0x451a03,
            roughness: 0.85,
            metalness: 0.02
        });
        const furLightMat = new THREE.MeshStandardMaterial({
            color: skin.accent || 0xfbbf24,
            roughness: 0.65,
            metalness: 0.05
        });
        const snoutMat = new THREE.MeshStandardMaterial({ color: 0x240e04, roughness: 0.50, metalness: 0.1 });
        const clawMat = new THREE.MeshStandardMaterial({
            color: skin.claw || 0xfef3c7,
            map: pbr.clawTex,
            roughness: 0.28,
            metalness: 0.35
        });
        const eyeAmberMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
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
            if (mat === stylizedBodyMat || mat === furLightMat) skinMeshes.push(m);
            return m;
        };
        const joint = (parent, p, r, mat) => addMesh(new THREE.SphereGeometry(r, 12, 10), mat, parent, p[0], p[1], p[2]);
        const blob = (parent, p, s, mat, rz = 0, ry = 0, rx = 0) => {
            const m = addMesh(new THREE.SphereGeometry(1, 16, 12), mat, parent, p[0], p[1], p[2], rx, ry, rz);
            m.scale.set(s[0], s[1], s[2]);
            if (mat === stylizedBodyMat || mat === furLightMat) skinMeshes.push(m);
            return m;
        };

        hips.position.y = 1.85;

        // =====================================================================
        // 1. TORSE COLOSSAL EN POIRE : abdomen et bassin de titan, toison étagée
        // =====================================================================
        blob(rig.torso, [-0.15, 0.22, 0], [1.32, 1.02, 0.98], stylizedBodyMat, 0.26);
        blob(rig.torso, [0.58, 0.60, 0], [0.90, 0.82, 0.88], stylizedBodyMat, 0.20);   // Épaules béhémoth
        blob(rig.torso, [0.52, 0.76, 0], [0.80, 0.60, 0.80], furLightMat, 0.18);       // Manteau nucal clair
        blob(rig.torso, [-0.12, -0.18, 0], [1.14, 0.70, 0.86], darkFurMat, 0.24);      // Ventre trapu sombre

        // Mèches de toison hirsute sculptées en saillie sur le dos et les flancs
        [
            [-0.78, 0.58, 0.44], [-0.38, 0.82, 0.48], [0.06, 0.92, 0.50], [0.46, 0.96, 0.46],
            [-0.68, 0.18, 0.82], [-0.22, 0.28, 0.86], [0.26, 0.38, 0.80]
        ].forEach(f => {
            [-1, 1].forEach(side => {
                blob(rig.torso, [f[0], f[1], side * f[2]], [0.36, 0.20, 0.22], darkFurMat, 0.25, side * 0.2);
            });
        });

        // =====================================================================
        // 2. COU MASSIF & TÊTE DE PARESSEUX GÉANT À MUSEAU CUIRASSÉ SOMBRE
        // =====================================================================
        rig.neck.position.set(0.84, 0.80, 0);
        rig.torso.add(rig.neck);
        blob(rig.neck, [0.20, 0.14, 0], [0.50, 0.46, 0.48], furLightMat, 0.15);
        blob(rig.neck, [0.15, -0.08, 0], [0.46, 0.35, 0.44], stylizedBodyMat, 0.10);

        rig.headGroup.position.set(0.44, 0.22, 0);
        rig.neck.add(rig.headGroup);

        // Crâne trapu bombé et museau cylindrique tronqué
        blob(rig.headGroup, [0.16, 0.10, 0], [0.44, 0.36, 0.38], furLightMat, -0.08);
        blob(rig.headGroup, [0.50, 0.04, 0], [0.35, 0.28, 0.30], stylizedBodyMat, -0.14);
        // Truffe et mufle sombre glabre en cuir plissé
        blob(rig.headGroup, [0.75, -0.02, 0], [0.20, 0.22, 0.23], snoutMat, -0.15);

        // Petites oreilles rondes enfouies sous la toison et cernes sombres
        [-1, 1].forEach(side => {
            blob(rig.headGroup, [0.06, 0.30, side * 0.34], [0.11, 0.12, 0.07], darkFurMat, -0.2, side * 0.4);
            blob(rig.headGroup, [0.38, 0.14, side * 0.29], [0.14, 0.10, 0.08], darkFurMat);
            addMesh(new THREE.SphereGeometry(0.052, 10, 10), eyeAmberMat, rig.headGroup, 0.40, 0.14, side * 0.33);
            addMesh(new THREE.SphereGeometry(0.026, 8, 8), pupilMat, rig.headGroup, 0.43, 0.14, side * 0.36);
            blob(rig.headGroup, [0.88, 0.02, side * 0.10], [0.05, 0.045, 0.035], pupilMat); // Narine
        });

        // Mâchoire inférieure
        rig.jaw.position.set(0.20, -0.15, 0);
        rig.headGroup.add(rig.jaw);
        blob(rig.jaw, [0.28, -0.02, 0], [0.35, 0.15, 0.24], darkFurMat, -0.05);
        blob(rig.jaw, [0.50, -0.01, 0], [0.18, 0.12, 0.19], snoutMat, 0.05);

        // =====================================================================
        // 3. BRAS HERCULÉENS AUX 3 FAUX D'IVOIRE RECOURBÉES
        // =====================================================================
        [-1, 1].forEach(side => {
            const arm = new THREE.Group();
            arm.position.set(0.70, 0.56, side * 0.70);
            rig.torso.add(arm);
            rig.arms.push(arm);

            const E = [0.20, -0.64, side * 0.10];
            const W = [0.68, -1.20, side * 0.04];

            // Épaule et bras velus ultra-massifs
            blob(arm, [0.10, -0.32, side * 0.04], [0.34, 0.50, 0.30], stylizedBodyMat, -0.28);
            joint(arm, E, 0.26, stylizedBodyMat);
            bone(arm, E, W, 0.26, 0.22, darkFurMat, 10);
            // Longues mèches tombantes de fourrure sous le coude et l'avant-bras
            blob(arm, [0.36, -0.96, side * 0.06], [0.40, 0.22, 0.24], stylizedBodyMat, -0.65);
            blob(arm, [W[0] + 0.08, W[1] - 0.04, W[2]], [0.20, 0.16, 0.22], snoutMat);

            // 3 immenses griffes courbes en faux d'ivoire
            [-0.13, 0, 0.13].forEach((cz, idx) => {
                const cScale = idx === 1 ? 1.15 : 0.98;
                const C0 = [W[0] + 0.18, W[1] - 0.04, W[2] + cz];
                const C1 = [C0[0] + 0.28 * cScale, C0[1] - 0.18 * cScale, C0[2]];
                const C2 = [C1[0] + 0.14 * cScale, C1[1] - 0.34 * cScale, C1[2]];
                bone(arm, C0, C1, 0.060, 0.042, clawMat, 7);
                bone(arm, C1, C2, 0.042, 0.010, clawMat, 7);
            });
        });

        // =====================================================================
        // 4. LOURDE QUEUE TRÉPIED POILUE (3 segments d'appui)
        // =====================================================================
        let pTail = rig.torso;
        const tLens = [0.65, 0.60, 0.58];
        const tRads = [0.52, 0.38, 0.25, 0.10];
        for (let s = 0; s < 3; s++) {
            const seg = new THREE.Group();
            seg.position.set(s === 0 ? -1.06 : -tLens[s - 1], s === 0 ? -0.14 : -0.15, 0);
            const len = tLens[s], r1 = tRads[s], r2 = tRads[s + 1];
            bone(seg, [0, 0, 0], [-len, -0.15, 0], r1, r2, stylizedBodyMat, 10);
            blob(seg, [-len * 0.5, -0.08, 0], [len * 0.68, r1 * 1.0, r1 * 1.10], s === 2 ? darkFurMat : stylizedBodyMat, 0.22);
            pTail.add(seg);
            rig.tailSegments.push(seg);
            pTail = seg;
        }

        // =====================================================================
        // 5. PATTES ARRIÈRE COLONNAIRES PÉDOLATÉRALES (sol à y = -1.85)
        // =====================================================================
        [-1, 1].forEach(side => {
            const leg = new THREE.Group();
            leg.position.set(-0.32, 0.0, side * 0.60);
            hips.add(leg);
            rig.legs.push(leg);

            const K = [0.18, -0.84, side * 0.04];
            const F = [0.08, -1.70, side * 0.04];

            blob(leg, [0.06, -0.46, 0], [0.48, 0.62, 0.40], stylizedBodyMat, 0.16);
            joint(leg, K, 0.30, stylizedBodyMat);
            bone(leg, K, F, 0.30, 0.25, darkFurMat, 10);
            // Pied plantigrade pédolatéral avec bord externe épais reposant au sol
            blob(leg, [0.20, -1.74, side * 0.04], [0.38, 0.16, 0.28], darkFurMat);
            [-0.10, 0.0, 0.10].forEach(dz => {
                bone(leg, [0.46, -1.74, side * 0.04 + dz], [0.68, -1.80, side * 0.04 + dz], 0.048, 0.012, clawMat, 6);
            });
        });
    },
});
