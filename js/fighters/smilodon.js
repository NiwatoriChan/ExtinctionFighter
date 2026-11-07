/* ============================================================================
 * COMBATTANT : SMILODON (Smilodon Fatalis - Tigre à Dents de Sabre)
 * Personnage Secret Déblocable en remportant le Mode Campagne d'Extinction !
 * Stylisation cartoon mature / Primal graphic comic :
 * - Cartographie PBR procédurale 1024x1024 (pelage fauve ocre à rosettes sombres,
 *   ventre crème soyeux, canines en ivoire strié à tranchant biseauté)
 * - Garrot herculéen sculpté, cou trapu hyper-musclé pour la prise au cou
 * - Crâne félin massif avec brides mentonnières (mandibular flanges)
 * - Canines sabres colossales incurvées avec cannelures et fil tranchant
 * - Pattes antérieures surdimensionnées aux griffes rétractiles acérées
 * - Queue bobtail musclée crantée
 * ============================================================================ */

let _cachedSmilodonPBR = null;
function getSmilodonPBRMaps() {
    if (_cachedSmilodonPBR) return _cachedSmilodonPBR;
    if (typeof document === 'undefined') return { furMat: null, saberMat: null };

    const size = 1024;
    const furCanvas = document.createElement('canvas');
    const bumpCanvas = document.createElement('canvas');
    const saberCanvas = document.createElement('canvas');
    furCanvas.width = bumpCanvas.width = saberCanvas.width = size;
    furCanvas.height = bumpCanvas.height = saberCanvas.height = size;

    const fCtx = furCanvas.getContext('2d');
    const bCtx = bumpCanvas.getContext('2d');
    const sCtx = saberCanvas.getContext('2d');

    let seed = 918273;
    const rand = () => { seed = (seed * 16807 + 11) % 2147483647; return (seed & 0x7fffffff) / 2147483647; };

    // --- 1. PELAGE FAUVE TACHETÉ DE ROSETTES ---
    const furGrad = fCtx.createLinearGradient(0, 0, size, 0);
    furGrad.addColorStop(0.00, '#451a03'); // Échine brun-sombre
    furGrad.addColorStop(0.18, '#78350f');
    furGrad.addColorStop(0.38, '#d97706'); // Ocre fauve doré
    furGrad.addColorStop(0.48, '#fbbf24'); // Reflets ambre
    furGrad.addColorStop(0.50, '#fef3c7'); // Ventre & poitrail crème
    furGrad.addColorStop(0.52, '#fbbf24');
    furGrad.addColorStop(0.62, '#d97706');
    furGrad.addColorStop(0.82, '#78350f');
    furGrad.addColorStop(1.00, '#451a03');
    fCtx.fillStyle = furGrad;
    fCtx.fillRect(0, 0, size, size);

    bCtx.fillStyle = '#808080';
    bCtx.fillRect(0, 0, size, size);

    // Micro-fibres et mèches de fourrure denses
    fCtx.fillStyle = 'rgba(254, 243, 199, 0.08)';
    bCtx.fillStyle = 'rgba(240, 240, 240, 0.1)';
    for (let i = 0; i < 4000; i++) {
        const x = rand() * size;
        const y = rand() * size;
        const len = 8 + rand() * 18;
        const ang = (rand() - 0.5) * 0.4 + Math.PI * 0.5;
        fCtx.fillRect(x, y, 1.5, len);
        bCtx.fillRect(x, y, 1.5, len);
    }

    // Rosettes léopard / jaguar stylisées machairodonte
    const numRosettes = 95;
    for (let r = 0; r < numRosettes; r++) {
        const cx = rand() * size;
        const cy = rand() * size;
        // Éviter le ventre central crème pur
        const normY = cy / size;
        if (normY > 0.46 && normY < 0.54 && rand() > 0.25) continue;

        const rad = 14 + rand() * 22;
        const numSpots = 3 + Math.floor(rand() * 4);
        const innerCol = rand() > 0.4 ? 'rgba(180, 83, 9, 0.65)' : 'rgba(146, 64, 14, 0.7)';

        // Cœur ocre de la rosette
        fCtx.beginPath();
        fCtx.arc(cx, cy, rad * 0.75, 0, Math.PI * 2);
        fCtx.fillStyle = innerCol;
        fCtx.fill();

        bCtx.beginPath();
        bCtx.arc(cx, cy, rad * 0.75, 0, Math.PI * 2);
        bCtx.fillStyle = '#656565';
        bCtx.fill();

        // Anneau de taches sombres polygonales cernant la rosette
        for (let s = 0; s < numSpots; s++) {
            const angle = (s / numSpots) * Math.PI * 2 + (rand() - 0.5) * 0.5;
            const spotDist = rad * (0.8 + rand() * 0.3);
            const sx = cx + Math.cos(angle) * spotDist;
            const sy = cy + Math.sin(angle) * spotDist;
            const srX = 4 + rand() * 7;
            const srY = 4 + rand() * 6;

            fCtx.save();
            fCtx.translate(sx, sy);
            fCtx.rotate(angle + Math.PI / 2);
            fCtx.beginPath();
            fCtx.ellipse(0, 0, srX, srY, 0, 0, Math.PI * 2);
            fCtx.fillStyle = '#1c1917'; // Noir suie encré
            fCtx.fill();
            fCtx.restore();

            bCtx.save();
            bCtx.translate(sx, sy);
            bCtx.rotate(angle + Math.PI / 2);
            bCtx.beginPath();
            bCtx.ellipse(0, 0, srX, srY, 0, 0, Math.PI * 2);
            bCtx.fillStyle = '#222222';
            bCtx.fill();
            bCtx.restore();
        }
    }

    // --- 2. CANINES SABRES EN IVOIRE STRIÉ ---
    const saberGrad = sCtx.createLinearGradient(0, 0, 0, size);
    saberGrad.addColorStop(0.0, '#fffbeb'); // Base d'ivoire clair
    saberGrad.addColorStop(0.3, '#fef3c7');
    saberGrad.addColorStop(0.7, '#fde68a'); // Patine miel
    saberGrad.addColorStop(0.95, '#f59e0b');
    saberGrad.addColorStop(1.0, '#ffffff'); // Pointe acérée
    sCtx.fillStyle = saberGrad;
    sCtx.fillRect(0, 0, size, size);

    // Stries longitudinales d'usure de l'émail et micro-dentelures
    sCtx.strokeStyle = 'rgba(180, 83, 9, 0.22)';
    sCtx.lineWidth = 2.0;
    for (let x = 12; x < size; x += 18 + rand() * 14) {
        sCtx.beginPath();
        sCtx.moveTo(x, 0);
        sCtx.bezierCurveTo(x + 10, size * 0.35, x - 12, size * 0.7, x + 6, size);
        sCtx.stroke();
    }
    // Ligne de cel-shading biseautée au tranchant postérieur
    sCtx.strokeStyle = 'rgba(69, 26, 3, 0.55)';
    sCtx.lineWidth = 4.5;
    sCtx.strokeRect(4, 4, size - 8, size - 8);

    const furTex = new THREE.CanvasTexture(furCanvas);
    const bumpTex = new THREE.CanvasTexture(bumpCanvas);
    const saberTex = new THREE.CanvasTexture(saberCanvas);
    furTex.wrapS = furTex.wrapT = bumpTex.wrapS = bumpTex.wrapT = THREE.RepeatWrapping;
    saberTex.wrapS = saberTex.wrapT = THREE.ClampToEdgeWrapping;

    const applySRGB = (tex) => {
        if ('colorSpace' in tex && THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
        else if ('encoding' in tex && THREE.sRGBEncoding) tex.encoding = THREE.sRGBEncoding;
    };
    applySRGB(furTex);
    applySRGB(saberTex);

    _cachedSmilodonPBR = {
        furTex,
        bumpTex,
        saberTex
    };
    return _cachedSmilodonPBR;
}

registerFighter({
    id: 'smilodon',
    name: 'SMILODON',
    fullName: 'Smilodon Fatalis',
    role: 'Félin Machairodonte Apex',
    title: '« La Terreur Glaciaire du Pléistocène »',
    primaryColor: 0xd97706,
    secondaryColor: 0x1c1917,
    accentColor: 0xfef3c7,
    cssPrimary: '#f59e0b',
    scale: 0.86,
    previewScale: 0.95,
    stats: { pow: 94, spd: 94, def: 80 },
    maxHp: 1020,
    walkSpeed: 8.8,
    special1Name: 'Bond Prédateur (H)',
    special2Name: 'Morsure Mortelle (T)',
    fatalityName: 'Égorgement Fatal (R)',
    moveStyle: 'Démarche féline musclée, bonds fulgurants, griffes rétractiles et crocs sabres dévastateurs.',
    fatalityDesc: 'Plaque sauvagement la victime au sol, rugit à pleins poumons et transperce la gorge avec ses canines sabres colossales.',
    isUnlockable: true,
    skins: [
        { name: 'Saber Predator', primary: 0xd97706, secondary: 0x1c1917, accent: 0xfef3c7 },
        { name: 'Glacial Ghost', primary: 0xe2e8f0, secondary: 0x334155, accent: 0xffffff }
    ]
}, {
    animBaseHipsY: 1.55,
    attackReach: 3.55,

    onSpecial(attacker, defender, dist, basePow) {
        sfx.playRoar(110, 0.4);
        attacker.vx = attacker.facing * 22;
        if (dist < 4.8) {
            applyDamage(attacker, defender, Math.round(basePow * 1.05), true, 'BOND PRÉDATEUR !');
            spawn3DBloodAndBones(defender.x, 1.8, 18, false);
            screenShake = 0.4;
        }
    },

    onSpecial2(attacker, defender, dist, basePow) {
        sfx.playRoar(90, 0.5);
        if (dist < 3.9) {
            sfx.playBoneCrack();
            applyDamage(attacker, defender, Math.round(basePow * 1.25), true, 'CROCS SABRES !');
            spawn3DBloodAndBones(defender.x, 2.0, 32, true);
            screenShake = 0.65;
        } else {
            attacker.vx = attacker.facing * 18;
        }
    },

    buildRig(ctx) {
        const { hips, rig, addMesh, bodyMat, darkMat, accentMat, skin, skinMeshes } = ctx;
        void accentMat;

        const pbr = getSmilodonPBRMaps();

        // Matériaux PBR stylisés mature
        const stylizedBodyMat = new THREE.MeshStandardMaterial({
            color: skin.primary || 0xd97706,
            map: pbr.furTex,
            bumpMap: pbr.bumpTex,
            bumpScale: 0.05,
            roughness: 0.62,
            metalness: 0.08
        });
        const creamMat = new THREE.MeshStandardMaterial({
            color: skin.accent || 0xfef3c7,
            roughness: 0.70,
            metalness: 0.05
        });
        const darkFurMat = new THREE.MeshStandardMaterial({
            color: skin.secondary || 0x1c1917,
            roughness: 0.80,
            metalness: 0.05
        });
        const saberMat = new THREE.MeshStandardMaterial({
            color: 0xfffbeb,
            map: pbr.saberTex,
            roughness: 0.22,
            metalness: 0.28
        });
        const noseMat = new THREE.MeshStandardMaterial({ color: 0x271406, roughness: 0.45 });
        const gumMat = new THREE.MeshStandardMaterial({ color: 0x881337, roughness: 0.55 });
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
            if (mat === stylizedBodyMat || mat === creamMat) skinMeshes.push(m);
            return m;
        };
        const joint = (parent, p, r, mat) => addMesh(new THREE.SphereGeometry(r, 12, 10), mat, parent, p[0], p[1], p[2]);
        const blob = (parent, p, s, mat, rz = 0, ry = 0, rx = 0) => {
            const m = addMesh(new THREE.SphereGeometry(1, 16, 12), mat, parent, p[0], p[1], p[2], rx, ry, rz);
            m.scale.set(s[0], s[1], s[2]);
            if (mat === stylizedBodyMat || mat === creamMat) skinMeshes.push(m);
            return m;
        };

        hips.position.y = 1.55;

        // =====================================================================
        // 1. TORSE DE MACHAIRODONTE : garrot ultra-musclé, dos fuyant, ventre crème
        // =====================================================================
        // Cage thoracique puissante
        blob(rig.torso, [0.08, 0.20, 0], [1.22, 0.72, 0.62], stylizedBodyMat, 0.12);
        // Garrot colossal et omoplates saillantes caractéristiques du Smilodon
        blob(rig.torso, [0.60, 0.46, 0], [0.72, 0.70, 0.66], stylizedBodyMat, 0.16);
        blob(rig.torso, [0.55, 0.58, 0], [0.50, 0.52, 0.48], darkFurMat, 0.12); // Crête sombre du garrot
        // Arrière-train plus bas et compact (bassin fuyant)
        blob(rig.torso, [-0.60, 0.12, 0], [0.70, 0.58, 0.54], stylizedBodyMat, -0.09);
        // Poitrail profond et ventre crème doux
        blob(rig.torso, [0.14, -0.22, 0], [1.08, 0.38, 0.52], creamMat, 0.10);
        blob(rig.torso, [0.72, -0.06, 0], [0.42, 0.32, 0.44], creamMat, 0.32); // Jabot pectoral

        // Mèches de pelage sculptées le long de la ligne dorsale et des flancs
        const tufts = [
            [-0.78, 0.42, 0.38], [-0.48, 0.52, 0.44], [-0.18, 0.58, 0.48], [0.16, 0.62, 0.50], [0.42, 0.68, 0.48],
            [-0.64, 0.14, 0.52], [-0.32, 0.22, 0.58], [0.02, 0.26, 0.59], [0.32, 0.30, 0.58],
            [-0.42, -0.06, 0.50], [-0.08, -0.02, 0.54], [0.24, 0.04, 0.54]
        ];
        tufts.forEach(sp => {
            [-1, 1].forEach(side => {
                blob(rig.torso, [sp[0], sp[1], side * sp[2]], [0.12, 0.07, 0.04], darkFurMat, 0.20, side * 0.15);
            });
        });

        // =====================================================================
        // 2. COU COURT, MASSIF ET HYPER-MUSCLÉ (force de frappe descendante)
        // =====================================================================
        rig.neck.position.set(1.02, 0.46, 0);
        rig.torso.add(rig.neck);
        bone(rig.neck, [-0.12, -0.06, 0], [0.38, 0.18, 0], 0.48, 0.40, stylizedBodyMat, 10);
        blob(rig.neck, [0.18, -0.16, 0], [0.38, 0.25, 0.34], creamMat, 0.25);
        blob(rig.neck, [0.08, 0.26, 0], [0.40, 0.20, 0.32], darkFurMat, 0.30); // Crinière courte nucale

        // =====================================================================
        // 3. TÊTE FÉLINE ÉNORME, BRIDES MENTONNIÈRES & CANINES SABRES D'IVOIRE
        // =====================================================================
        rig.headGroup.position.set(0.40, 0.20, 0);
        rig.neck.add(rig.headGroup);

        // Boîte crânienne féline compacte et arcades zygomatiques évasées
        blob(rig.headGroup, [0.16, 0.12, 0], [0.44, 0.36, 0.40], stylizedBodyMat, -0.05);
        blob(rig.headGroup, [0.56, 0.06, 0], [0.36, 0.26, 0.32], stylizedBodyMat, -0.12);
        // Bajoues / coussinets de vibrisses crème
        blob(rig.headGroup, [0.60, -0.04, 0], [0.30, 0.18, 0.32], creamMat, -0.10);
        // Truffe féline noire rainurée
        blob(rig.headGroup, [0.86, 0.08, 0], [0.11, 0.09, 0.13], noseMat, -0.15);

        // Yeux félins ambrés et oreilles d'affût
        [-1, 1].forEach(side => {
            // Pavillon de l'oreille arrondie
            blob(rig.headGroup, [-0.04, 0.42, side * 0.30], [0.11, 0.16, 0.13], darkFurMat, -0.28, side * 0.3);
            blob(rig.headGroup, [0.0, 0.42, side * 0.31], [0.07, 0.11, 0.09], creamMat, -0.28, side * 0.3);
            // Orbite féline expressive cerclée de noir
            blob(rig.headGroup, [0.36, 0.25, side * 0.28], [0.14, 0.05, 0.08], darkFurMat, -0.1);
            addMesh(new THREE.SphereGeometry(0.056, 10, 10), eyeAmberMat, rig.headGroup, 0.38, 0.18, side * 0.29);
            addMesh(new THREE.SphereGeometry(0.028, 8, 8), pupilMat, rig.headGroup, 0.42, 0.18, side * 0.32);
        });

        // LES GIGANTESQUES CANINES SABRES DU SMILODON (profil en cimeterre courbé)
        [-1, 1].forEach(side => {
            const C0 = [0.65, -0.06, side * 0.22];
            const C1 = [0.70, -0.38, side * 0.21];
            const C2 = [0.62, -0.68, side * 0.20];
            bone(rig.headGroup, C0, C1, 0.070, 0.050, saberMat, 8);
            bone(rig.headGroup, C1, C2, 0.050, 0.008, saberMat, 8);

            // Biseau tranchant postérieur de la canine
            bone(rig.headGroup, [0.63, -0.10, side * 0.22], [0.59, -0.62, side * 0.20], 0.018, 0.005, saberMat, 5);
        });
        // Rangée d'incisives supérieures acérées
        for (let t = -2; t <= 2; t++) {
            addMesh(new THREE.ConeGeometry(0.022, 0.09, 5), saberMat, rig.headGroup, 0.80, -0.14, t * 0.045, Math.PI, 0, 0);
        }

        // Mâchoire inférieure articulée avec brides mentonnières (Mandibular Flanges)
        rig.jaw.position.set(0.16, -0.14, 0);
        rig.headGroup.add(rig.jaw);
        blob(rig.jaw, [0.30, -0.04, 0], [0.34, 0.13, 0.24], creamMat, -0.05);
        blob(rig.jaw, [0.28, 0.02, 0], [0.28, 0.07, 0.18], gumMat);
        // Brides osseuses protégeant les canines au repos
        [-1, 1].forEach(side => {
            blob(rig.jaw, [0.48, -0.14, side * 0.15], [0.15, 0.18, 0.07], creamMat, 0.12);
            addMesh(new THREE.ConeGeometry(0.024, 0.10, 5), saberMat, rig.jaw, 0.50, 0.07, side * 0.15);
        });

        // =====================================================================
        // 4. COURTE QUEUE BOBTAIL FÉLINE (3 segments musclés avec anneaux)
        // =====================================================================
        let pTail = rig.torso;
        for (let s = 0; s < 3; s++) {
            const seg = new THREE.Group();
            seg.position.set(s === 0 ? -1.12 : -0.28, s === 0 ? 0.18 : 0.02, 0);
            const r1 = 0.17 - s * 0.026, r2 = 0.14 - s * 0.026;
            const matChoice = s === 2 ? darkFurMat : stylizedBodyMat;
            bone(seg, [0, 0, 0], [-0.30, 0.04, 0], r1, r2, matChoice, 8);
            if (s === 1) blob(seg, [-0.15, 0.02, 0], [0.09, r1 * 1.1, r1 * 1.1], darkFurMat);
            pTail.add(seg);
            rig.tailSegments.push(seg);
            pTail = seg;
        }

        // =====================================================================
        // 5. QUATRE PATTES FÉLINES HERCULÉENNES (sol à y = -1.55)
        // =====================================================================
        [
            { x: 0.70, z: -0.48, isFront: true },
            { x: 0.70, z: 0.48, isFront: true },
            { x: -0.70, z: -0.45, isFront: false },
            { x: -0.70, z: 0.45, isFront: false }
        ].forEach(pos => {
            const leg = new THREE.Group();
            leg.position.set(pos.x, 0.02, pos.z);
            hips.add(leg);
            rig.legs.push(leg);

            const side = Math.sign(pos.z);
            const K = [pos.isFront ? -0.10 : 0.16, -0.74, 0];
            const A = [pos.isFront ? 0.04 : -0.14, -1.24, 0];
            const F = [0.14, -1.48, 0];

            // Épaule imposante / cuisse féline galbée
            blob(leg, [0.02, -0.36, 0], [pos.isFront ? 0.36 : 0.34, 0.50, 0.28], stylizedBodyMat, pos.isFront ? -0.14 : 0.18);
            blob(leg, [0.04, -0.34, side * 0.15], [0.09, 0.07, 0.04], darkFurMat);
            blob(leg, [-0.04, -0.52, side * 0.14], [0.08, 0.06, 0.04], darkFurMat);

            joint(leg, K, pos.isFront ? 0.21 : 0.18, stylizedBodyMat);
            bone(leg, K, A, pos.isFront ? 0.20 : 0.17, pos.isFront ? 0.15 : 0.13, stylizedBodyMat, 8);
            // Bas de patte et métapodes crème
            bone(leg, A, F, pos.isFront ? 0.15 : 0.13, 0.12, creamMat, 7);

            // Large coussinet plantaire et griffes rétractiles en faux d'ivoire
            blob(leg, [0.22, -1.50, 0], [0.24, 0.10, 0.20], creamMat);
            [-0.11, -0.035, 0.035, 0.11].forEach(dz => {
                addMesh(new THREE.ConeGeometry(0.028, 0.13, 5), saberMat, leg, 0.40, -1.51, dz, 0, 0, -Math.PI / 2 - 0.25);
            });
        });
    },
});
