/* ============================================================================
 * COMBATTANT : OISEAU DE TERREUR (Phorusrhacos Longissimus)
 * Stylisation cartoon mature / Primal graphic comic :
 * - Cartographie PBR procédurale 1024x1024 (plumage étagé ocre-braise et charbon,
 *   bec en hache d'ambre corné lustré à pointe d'onyx crochue, tarses écaillés)
 * - Tête de rapace colossal au bec en coin démesuré et regard féroce
 * - Huppe occipitale de plumes effilées en éventail
 * - Long cou musclé en S avec crinière nucale sombre
 * - Ailes vestigiales repliées aux pennes détaillées
 * - Pattes de sprinteur hyper-développées avec griffe interne tueuse
 * ============================================================================ */

let _cachedTerrorBirdPBR = null;
function getTerrorBirdPBRMaps() {
    if (_cachedTerrorBirdPBR) return _cachedTerrorBirdPBR;
    if (typeof document === 'undefined') return { featherTex: null, bumpTex: null, beakTex: null };

    const size = 1024;
    const featherCanvas = document.createElement('canvas');
    const bumpCanvas = document.createElement('canvas');
    const beakCanvas = document.createElement('canvas');
    featherCanvas.width = bumpCanvas.width = beakCanvas.width = size;
    featherCanvas.height = bumpCanvas.height = beakCanvas.height = size;

    const fCtx = featherCanvas.getContext('2d');
    const bCtx = bumpCanvas.getContext('2d');
    const kCtx = beakCanvas.getContext('2d');

    let seed = 371946;
    const rand = () => { seed = (seed * 16807 + 11) % 2147483647; return (seed & 0x7fffffff) / 2147483647; };

    // --- 1. PLUMAGE DE CHASSEUR MIOCÈNE (Ocre braise, suie et crème) ---
    const fGrad = fCtx.createLinearGradient(0, 0, 0, size);
    fGrad.addColorStop(0.00, '#1c1917'); // Échine & dos suie
    fGrad.addColorStop(0.20, '#431407');
    fGrad.addColorStop(0.45, '#c2410c'); // Braise incandescente
    fGrad.addColorStop(0.70, '#ea580c');
    fGrad.addColorStop(0.88, '#f59e0b'); // Poitrail ocre vif
    fGrad.addColorStop(1.00, '#ffedd5'); // Duvet crème ventral
    fCtx.fillStyle = fGrad;
    fCtx.fillRect(0, 0, size, size);

    bCtx.fillStyle = '#808080';
    bCtx.fillRect(0, 0, size, size);

    // Vanes et barbes de plumes superposées en écailles
    const cols = 28;
    const rows = 32;
    const stepX = size / cols;
    const stepY = size / rows;

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const px = (c + (r % 2) * 0.5) * stepX + (rand() - 0.5) * 4;
            const py = r * stepY + (rand() - 0.5) * 4;
            const fw = stepX * 1.1;
            const fh = stepY * 1.6;

            fCtx.save();
            fCtx.translate(px, py);
            fCtx.beginPath();
            fCtx.moveTo(0, 0);
            fCtx.quadraticCurveTo(fw * 0.55, fh * 0.45, 0, fh);
            fCtx.quadraticCurveTo(-fw * 0.55, fh * 0.45, 0, 0);
            const shade = rand();
            fCtx.fillStyle = shade > 0.6 ? 'rgba(28, 25, 23, 0.55)' : 'rgba(234, 88, 12, 0.35)';
            fCtx.fill();
            fCtx.strokeStyle = 'rgba(12, 10, 9, 0.7)';
            fCtx.lineWidth = 1.4;
            fCtx.stroke();
            // Rachis central de la plume
            fCtx.beginPath();
            fCtx.moveTo(0, 0);
            fCtx.lineTo(0, fh * 0.9);
            fCtx.strokeStyle = 'rgba(254, 215, 170, 0.4)';
            fCtx.lineWidth = 1.0;
            fCtx.stroke();
            fCtx.restore();

            bCtx.save();
            bCtx.translate(px, py);
            bCtx.beginPath();
            bCtx.moveTo(0, 0);
            bCtx.quadraticCurveTo(fw * 0.55, fh * 0.45, 0, fh);
            bCtx.quadraticCurveTo(-fw * 0.55, fh * 0.45, 0, 0);
            bCtx.fillStyle = shade > 0.6 ? '#303030' : '#b8b8b8';
            bCtx.fill();
            bCtx.restore();
        }
    }

    // --- 2. BEC EN HACHE EN CORNE POLIE AVEC CULMEN SOMBRE ---
    const bGrad = kCtx.createLinearGradient(0, 0, size, size);
    bGrad.addColorStop(0.00, '#1c1917'); // Culmen dorsal noir
    bGrad.addColorStop(0.18, '#78350f');
    bGrad.addColorStop(0.45, '#d97706'); // Ambre profond
    bGrad.addColorStop(0.70, '#facc15'); // Jaune corne éclatant
    bGrad.addColorStop(0.92, '#fef08a');
    bGrad.addColorStop(1.00, '#09090b'); // Pointe d'onyx
    kCtx.fillStyle = bGrad;
    kCtx.fillRect(0, 0, size, size);

    // Stries de croissance longitudinale de la kératine
    kCtx.strokeStyle = 'rgba(69, 26, 3, 0.3)';
    kCtx.lineWidth = 2.0;
    for (let x = 10; x < size; x += 16 + rand() * 12) {
        kCtx.beginPath();
        kCtx.moveTo(x, 0);
        kCtx.bezierCurveTo(x + 15, size * 0.4, x - 10, size * 0.7, x + 5, size);
        kCtx.stroke();
    }
    // Ligne biseautée du fil tranchant
    kCtx.strokeStyle = 'rgba(12, 10, 9, 0.85)';
    kCtx.lineWidth = 4.0;
    kCtx.strokeRect(3, 3, size - 6, size - 6);

    const featherTex = new THREE.CanvasTexture(featherCanvas);
    const bumpTex = new THREE.CanvasTexture(bumpCanvas);
    const beakTex = new THREE.CanvasTexture(beakCanvas);
    featherTex.wrapS = featherTex.wrapT = bumpTex.wrapS = bumpTex.wrapT = THREE.RepeatWrapping;
    beakTex.wrapS = beakTex.wrapT = THREE.ClampToEdgeWrapping;

    const applySRGB = (tex) => {
        if ('colorSpace' in tex && THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
        else if ('encoding' in tex && THREE.sRGBEncoding) tex.encoding = THREE.sRGBEncoding;
    };
    applySRGB(featherTex);
    applySRGB(beakTex);

    _cachedTerrorBirdPBR = { featherTex, bumpTex, beakTex };
    return _cachedTerrorBirdPBR;
}

registerFighter({
    id: 'terabird',
    name: 'OISEAU DE TERREUR',
    fullName: 'Phorusrhacos Longissimus',
    role: 'Faucheur Véloce Miocène',
    title: '« La Hache Plumée du Miocène »',
    primaryColor: 0xea580c,
    secondaryColor: 0x1c1917,
    accentColor: 0xfacc15,
    cssPrimary: '#ea580c',
    scale: 0.88,
    previewScale: 0.92,
    stats: { pow: 93, spd: 98, def: 70 },
    maxHp: 940,
    walkSpeed: 10.4,
    special1Name: 'Pique de Hache (H)',
    special2Name: 'Foulée Furieuse (T)',
    fatalityName: 'Trépanation Sauvage (R)',
    moveStyle: 'Sprinteur hyperkinétique bipède, frappes verticales de son bec tranchant en coin.',
    fatalityDesc: 'Assène une frappe verticale d’une violence inouïe avec son bec crochu, ouvrant le crâne adverse en deux avant de déchirer les viscères.',
    skins: [
        { name: 'Firestorm Terror', primary: 0xea580c, secondary: 0x1c1917, accent: 0xfacc15, neck: 0xffedd5, beak: 0xfacc15 },
        { name: 'Ash Harpy', primary: 0x57534e, secondary: 0x1c1917, accent: 0x38bdf8, neck: 0xe2e8f0, beak: 0x38bdf8 }
    ]
}, {
    animBaseHipsY: 2.25,

    onSpecial2(attacker, defender, dist, basePow) {
        spawn3DProjectile(attacker, 'boulder');
    },

    buildRig(ctx) {
        const { hips, rig, addMesh, bodyMat, darkMat, accentMat, boneMat, skin, skinMeshes } = ctx;
        void accentMat;
        void boneMat;

        const pbr = getTerrorBirdPBRMaps();

        const stylizedBodyMat = new THREE.MeshStandardMaterial({
            color: skin.primary || 0xea580c,
            map: pbr.featherTex,
            bumpMap: pbr.bumpTex,
            bumpScale: 0.06,
            roughness: 0.65,
            metalness: 0.05
        });
        const darkFeatherMat = new THREE.MeshStandardMaterial({
            color: skin.secondary || 0x1c1917,
            roughness: 0.75,
            metalness: 0.05
        });
        const neckMat = new THREE.MeshStandardMaterial({
            color: skin.neck || 0xffedd5,
            roughness: 0.60,
            metalness: 0.04
        });
        const beakMat = new THREE.MeshStandardMaterial({
            color: skin.beak || 0xfacc15,
            map: pbr.beakTex,
            roughness: 0.22,
            metalness: 0.30
        });
        const beakTipMat = new THREE.MeshStandardMaterial({ color: 0x111113, roughness: 0.25, metalness: 0.40 });
        const tarsusMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.45, metalness: 0.12 });
        const eyeAmberMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
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
            if (mat === stylizedBodyMat || mat === neckMat) skinMeshes.push(m);
            return m;
        };
        const joint = (parent, p, r, mat) => addMesh(new THREE.SphereGeometry(r, 12, 10), mat, parent, p[0], p[1], p[2]);
        const blob = (parent, p, s, mat, rz = 0, ry = 0, rx = 0) => {
            const m = addMesh(new THREE.SphereGeometry(1, 16, 12), mat, parent, p[0], p[1], p[2], rx, ry, rz);
            m.scale.set(s[0], s[1], s[2]);
            if (mat === stylizedBodyMat || mat === neckMat) skinMeshes.push(m);
            return m;
        };

        hips.position.y = 2.25;

        // =====================================================================
        // 1. CORPS D'OISEAU COUREUR : ovoïde puissant et profil aérodynamique
        // =====================================================================
        blob(rig.torso, [0.06, 0.18, 0], [1.02, 0.66, 0.60], stylizedBodyMat, 0.18);
        blob(rig.torso, [0.44, 0.26, 0], [0.62, 0.56, 0.54], neckMat, 0.28);           // Poitrail clair duveteux
        blob(rig.torso, [-0.16, 0.44, 0], [0.86, 0.36, 0.50], darkFeatherMat, 0.10);   // Manteau dorsal sombre

        // Mèches de plumes sculptées le long de la ligne dorsale
        for (let i = 0; i < 6; i++) {
            const sx = -0.55 + i * 0.20;
            const sy = 0.52 + Math.sin(i * 0.6) * 0.08;
            [-1, 1].forEach(side => {
                blob(rig.torso, [sx, sy, side * 0.26], [0.18, 0.08, 0.10], darkFeatherMat, 0.32, side * 0.15);
            });
        }

        // Petites ailes vestigiales repliées avec rémiges en éventail
        [-1, 1].forEach(side => {
            const wing = new THREE.Group();
            wing.position.set(0.30, 0.28, side * 0.50);
            blob(wing, [-0.26, -0.08, side * 0.05], [0.48, 0.26, 0.11], darkFeatherMat, 0.25, side * 0.12);
            // Vanes de rémiges étagées
            for (let r = 0; r < 5; r++) {
                blob(wing, [-0.44 - r * 0.08, -0.14 - r * 0.04, side * 0.06], [0.26, 0.06, 0.04], stylizedBodyMat, 0.35 + r * 0.08);
            }
            rig.torso.add(wing);
            rig.arms.push(wing);
        });

        // Queue en éventail de plumes prédatrices souples
        const tailFan = new THREE.Group();
        tailFan.position.set(-0.84, 0.08, 0);
        for (let i = -2; i <= 2; i++) {
            const z = i * 0.11;
            const matC = i % 2 === 0 ? darkFeatherMat : stylizedBodyMat;
            blob(tailFan, [-0.40, -0.14 - Math.abs(i) * 0.03, z], [0.52, 0.09, 0.13], matC, 0.42, i * 0.14);
        }
        rig.torso.add(tailFan);
        rig.tailSegments.push(tailFan);

        // =====================================================================
        // 2. COU PUISSANT EN S DE CHASSEUR
        // =====================================================================
        rig.neck.position.set(0.70, 0.40, 0);
        rig.torso.add(rig.neck);
        const N0 = [0, 0, 0], N1 = [0.30, 0.58, 0], N2 = [0.22, 1.20, 0];
        bone(rig.neck, N0, N1, 0.32, 0.25, neckMat, 10);
        joint(rig.neck, N1, 0.25, neckMat);
        bone(rig.neck, N1, N2, 0.25, 0.22, neckMat, 10);
        // Crinière nucale sombre le long de la colonne cervicale
        bone(rig.neck, [-0.06, 0.08, 0], [0.14, 1.20, 0], 0.20, 0.15, darkFeatherMat, 8);

        // =====================================================================
        // 3. TÊTE & IMMENSE BEC EN HACHE CROCHU
        // =====================================================================
        rig.headGroup.position.set(0.24, 1.26, 0);
        rig.neck.add(rig.headGroup);

        // Boîte crânienne allongée
        blob(rig.headGroup, [0.08, 0.08, 0], [0.40, 0.30, 0.26], neckMat, -0.05);
        blob(rig.headGroup, [0.04, 0.24, 0], [0.34, 0.15, 0.24], darkFeatherMat, -0.05);

        // Huppe de plumes effilées en crête de guerre à l'arrière du crâne
        for (let f = 0; f < 6; f++) {
            const ang = 0.32 + f * 0.13;
            blob(rig.headGroup, [-0.30 - f * 0.06, 0.24 - f * 0.04, (f % 2 === 0 ? 1 : -1) * 0.04], [0.28, 0.045, 0.06], darkFeatherMat, ang);
        }

        // Regard de rapace ardent sous une arcade sourcilière sévère
        [-1, 1].forEach(side => {
            blob(rig.headGroup, [0.24, 0.16, side * 0.19], [0.16, 0.12, 0.09], darkFeatherMat); // Cerne orbital
            addMesh(new THREE.SphereGeometry(0.058, 10, 10), eyeAmberMat, rig.headGroup, 0.26, 0.16, side * 0.23);
            addMesh(new THREE.SphereGeometry(0.029, 8, 8), pupilMat, rig.headGroup, 0.29, 0.16, side * 0.26);
            addMesh(new THREE.BoxGeometry(0.24, 0.045, 0.09), darkFeatherMat, rig.headGroup, 0.25, 0.24, side * 0.22, 0, 0, -0.15);
        });

        // IMMENSE BEC SUPÉRIEUR EN HACHE (haut, tranchant et terminé par un croc faucheur)
        blob(rig.headGroup, [0.65, 0.13, 0], [0.45, 0.26, 0.14], beakMat, -0.08);
        bone(rig.headGroup, [0.36, 0.30, 0], [1.02, 0.18, 0], 0.12, 0.085, beakMat, 7);
        bone(rig.headGroup, [0.36, 0.02, 0], [1.02, -0.02, 0], 0.13, 0.075, beakMat, 7);
        // Croc terminal noir plongeant
        bone(rig.headGroup, [0.98, 0.15, 0], [1.18, -0.18, 0], 0.095, 0.015, beakTipMat, 7);
        // Narine ovale sculptée
        [-1, 1].forEach(side => {
            blob(rig.headGroup, [0.56, 0.17, side * 0.13], [0.08, 0.035, 0.025], beakTipMat);
        });

        // Mâchoire inférieure articulée
        rig.jaw.position.set(0.26, -0.09, 0);
        rig.headGroup.add(rig.jaw);
        bone(rig.jaw, [0, 0, 0], [0.76, -0.02, 0], 0.10, 0.045, beakTipMat, 7);
        bone(rig.jaw, [0.06, 0.03, 0], [0.72, 0.0, 0], 0.08, 0.035, beakMat, 7);

        // =====================================================================
        // 4. LONGUES PATTES DE COUREUR AVEC GRIFFE TUEUSE (sol à y = -2.25)
        // =====================================================================
        [-1, 1].forEach(side => {
            const leg = new THREE.Group();
            leg.position.set(-0.04, 0, side * 0.36);
            hips.add(leg);
            rig.legs.push(leg);

            const H = [0, 0, 0];
            const K = [0.28, -0.56, 0];
            const M = [0.02, -0.98, 0];
            const A = [-0.22, -1.36, 0];
            const F = [0.14, -2.16, 0];

            // Cuisse puissante (fémur)
            bone(leg, H, K, 0.30, 0.24, stylizedBodyMat, 10);
            blob(leg, [0.11, -0.30, 0], [0.36, 0.44, 0.28], stylizedBodyMat, 0.35);
            joint(leg, K, 0.24, stylizedBodyMat);

            // Pilon musculaire supérieur emplumé
            bone(leg, K, M, 0.24, 0.15, darkFeatherMat, 10);
            blob(leg, [0.14, -0.76, 0], [0.24, 0.32, 0.20], darkFeatherMat, -0.52);
            joint(leg, M, 0.14, darkFeatherMat);

            // Bas du tibiotarse écailleux
            bone(leg, M, A, 0.13, 0.10, tarsusMat, 8);
            joint(leg, A, 0.11, tarsusMat);

            // Tarsométatarse écailleux avec scutelles proéminentes
            bone(leg, A, F, 0.096, 0.08, tarsusMat, 8);
            for (let s = 1; s <= 6; s++) {
                const t = s / 7;
                const sx = A[0] + (F[0] - A[0]) * t + 0.055;
                const sy = A[1] + (F[1] - A[1]) * t;
                blob(leg, [sx, sy, 0], [0.048, 0.038, 0.08], tarsusMat, 0.36);
            }

            // Hallux postérieur
            bone(leg, [0.06, -1.96, 0], [-0.11, -2.06, 0], 0.036, 0.025, tarsusMat, 6);
            addMesh(new THREE.ConeGeometry(0.025, 0.11, 5), beakTipMat, leg, -0.15, -2.09, 0, 0, 0, Math.PI / 2 + 0.35);

            // 3 orteils de rapace (doigt interne avec griffe tueuse recourbée colossale)
            joint(leg, F, 0.092, tarsusMat);
            [-0.12, 0, 0.12].forEach((dz, idx) => {
                const isInner = (side < 0 && idx === 2) || (side > 0 && idx === 0);
                const lenToe = idx === 1 ? 0.40 : 0.32;
                const mid = [F[0] + lenToe * 0.5, -2.19, dz * 0.85];
                const tip = [F[0] + lenToe, -2.21, dz * 1.15];
                bone(leg, F, mid, 0.055, 0.044, tarsusMat, 7);
                joint(leg, mid, 0.044, tarsusMat);
                bone(leg, mid, tip, 0.042, 0.032, tarsusMat, 7);
                joint(leg, tip, 0.032, tarsusMat);
                addMesh(new THREE.ConeGeometry(isInner ? 0.046 : 0.034, isInner ? 0.22 : 0.15, 6),
                    beakTipMat, leg, tip[0] + 0.08, tip[1] + (isInner ? 0.035 : 0.012), dz * 1.15,
                    0, 0, -Math.PI / 2 - (isInner ? 0.48 : 0.24));
            });
        });
    },
});
