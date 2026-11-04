/* ============================================================================
 * COMBATTANT : MÉGATHÉRIUM (Megatherium Americanum)
 * Données (stats, skins, textes), modèle 3D, animations, coups spéciaux & fatalité.
 * Silhouette paléoart : paresseux terrestre géant du Pléistocène à épaisse
 * fourrure brune hirsute, bassin monumental, tête arrondie à museau sombre,
 * lourde queue trépied et avant-bras herculéens armés de 3 longues griffes courbes.
 * ============================================================================ */

registerFighter({
    id: 'giantsloth',
    name: 'MÉGATHÉRIUM',
    fullName: 'Megatherium Americanum',
    role: 'Paresseux Géant Béhémoth',
    title: '« La Force Brute du Pléistocène »',
    primaryColor: 0x705136,
    secondaryColor: 0x453120,
    accentColor: 0x9e7b56,
    cssPrimary: '#854d0e',
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
        { name: 'Pampas Megatherium', primary: 0x705136, secondary: 0x453120, accent: 0x9e7b56, claw: 0xd4c6b0 },
        { name: 'Pleistocene Grizzly', primary: 0x854d0e, secondary: 0x543209, accent: 0xfacc15, claw: 0xfef3c7 },
        { name: 'Mammoth Fur', primary: 0xe2e8f0, secondary: 0x94a3b8, accent: 0x93c5fd, claw: 0x475569 },
        { name: 'Obsidian Behemoth', primary: 0x27272a, secondary: 0x18181b, accent: 0xf97316, claw: 0xe5e7eb },
        { name: 'Moss Covered', primary: 0x3f6212, secondary: 0x1a2e05, accent: 0x65a30d, claw: 0xd9f99d }
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

        const furLightMat = new THREE.MeshStandardMaterial({ color: skin.accent || 0x9e7b56, roughness: 0.85 });
        const snoutMat = new THREE.MeshStandardMaterial({ color: 0x292524, roughness: 0.55 });
        const clawMat = new THREE.MeshStandardMaterial({ color: skin.claw || 0xd4c6b0, roughness: 0.35, metalness: 0.1 });
        const irisMat = new THREE.MeshBasicMaterial({ color: 0x78350f });
        const pupilMat = new THREE.MeshBasicMaterial({ color: 0x09090b });

        const UP = new THREE.Vector3(0, 1, 0);
        const bone = (parent, a, b, r1, r2, mat, seg = 8) => {
            const A = new THREE.Vector3(a[0], a[1], a[2]);
            const B = new THREE.Vector3(b[0], b[1], b[2]);
            const dir = B.clone().sub(A);
            const len = dir.length();
            const m = addMesh(new THREE.CylinderGeometry(r2, r1, len, seg), mat, parent,
                (A.x + B.x) / 2, (A.y + B.y) / 2, (A.z + B.z) / 2);
            m.quaternion.setFromUnitVectors(UP, dir.normalize());
            if (mat === furLightMat) skinMeshes.push(m);
            return m;
        };
        const joint = (parent, p, r, mat) => addMesh(new THREE.SphereGeometry(r, 10, 8), mat, parent, p[0], p[1], p[2]);
        const blob = (parent, p, s, mat, rz = 0, ry = 0, rx = 0) => {
            const m = addMesh(new THREE.SphereGeometry(1, 14, 10), mat, parent, p[0], p[1], p[2], rx, ry, rz);
            m.scale.set(s[0], s[1], s[2]);
            if (mat === furLightMat) skinMeshes.push(m);
            return m;
        };

        hips.position.y = 1.85;

        // =====================================================================
        // 1. TORSE COLOSSAL EN POIRE : bassin gigantesque et épaisse toison hirsute
        // =====================================================================
        blob(rig.torso, [-0.15, 0.22, 0], [1.26, 0.96, 0.94], bodyMat, 0.26);      // abdomen et bassin énormes
        blob(rig.torso, [0.56, 0.56, 0], [0.86, 0.78, 0.84], bodyMat, 0.20);       // épaules et garrot puissants
        blob(rig.torso, [0.48, 0.72, 0], [0.76, 0.56, 0.76], furLightMat, 0.18);   // manteau d'épaules plus clair
        blob(rig.torso, [-0.12, -0.18, 0], [1.10, 0.65, 0.82], darkMat, 0.24);     // sous-poil ventral sombre

        // Mèches de fourrure hirsute superposées sur le dos et les flancs
        [
            [-0.75, 0.55, 0.42], [-0.35, 0.78, 0.46], [0.08, 0.88, 0.48], [0.48, 0.92, 0.44],
            [-0.65, 0.15, 0.78], [-0.20, 0.25, 0.82], [0.28, 0.35, 0.76]
        ].forEach(f => {
            [-1, 1].forEach(side => {
                blob(rig.torso, [f[0], f[1], side * f[2]], [0.34, 0.18, 0.20], bodyMat, 0.25, side * 0.2);
            });
        });

        // =====================================================================
        // 2. COU MASSIF & TÊTE DE PARESSEUX GÉANT À MUSEAU CUIRASSÉ SOMBRE
        // =====================================================================
        rig.neck.position.set(0.82, 0.78, 0);
        rig.torso.add(rig.neck);
        blob(rig.neck, [0.18, 0.12, 0], [0.46, 0.42, 0.46], furLightMat, 0.15);
        blob(rig.neck, [0.14, -0.06, 0], [0.42, 0.32, 0.40], bodyMat, 0.10);

        rig.headGroup.position.set(0.42, 0.20, 0);
        rig.neck.add(rig.headGroup);

        // Crâne bombé couvert de fourrure claire et museau cylindrique tronqué
        blob(rig.headGroup, [0.16, 0.08, 0], [0.42, 0.34, 0.36], furLightMat, -0.08);
        blob(rig.headGroup, [0.48, 0.02, 0], [0.32, 0.26, 0.28], bodyMat, -0.14);
        // Truffe / museau sombre glabre avec narines
        blob(rig.headGroup, [0.72, -0.02, 0], [0.18, 0.20, 0.21], snoutMat, -0.15);

        // Petites oreilles rondes de paresseux et yeux expressifs
        [-1, 1].forEach(side => {
            blob(rig.headGroup, [0.05, 0.28, side * 0.32], [0.10, 0.11, 0.06], darkMat, -0.2, side * 0.4);
            blob(rig.headGroup, [0.36, 0.12, side * 0.27], [0.12, 0.09, 0.07], darkMat); // cerne sombre
            addMesh(new THREE.SphereGeometry(0.048, 8, 8), irisMat, rig.headGroup, 0.38, 0.12, side * 0.31);
            addMesh(new THREE.SphereGeometry(0.025, 6, 6), pupilMat, rig.headGroup, 0.41, 0.12, side * 0.34);
            blob(rig.headGroup, [0.84, 0.02, side * 0.09], [0.05, 0.04, 0.03], pupilMat); // narine
        });

        // Mâchoire inférieure
        rig.jaw.position.set(0.18, -0.14, 0);
        rig.headGroup.add(rig.jaw);
        blob(rig.jaw, [0.26, -0.02, 0], [0.32, 0.14, 0.22], darkMat, -0.05);
        blob(rig.jaw, [0.46, -0.01, 0], [0.16, 0.11, 0.17], snoutMat, 0.05);

        // =====================================================================
        // 3. BRAS HERCULÉENS AUX 3 LONGUES GRIFFES RECOURBÉES DE TERRASSEMENT
        // =====================================================================
        [-1, 1].forEach(side => {
            const arm = new THREE.Group();
            arm.position.set(0.68, 0.54, side * 0.68);
            rig.torso.add(arm);
            rig.arms.push(arm);

            const S = [0, 0, 0];
            const E = [0.18, -0.62, side * 0.10];
            const W = [0.64, -1.16, side * 0.04];

            // Épaule et bras velus ultra-massifs
            blob(arm, [0.08, -0.30, side * 0.04], [0.30, 0.46, 0.28], bodyMat, -0.28);
            joint(arm, E, 0.24, bodyMat);
            bone(arm, E, W, 0.24, 0.20, darkMat, 9);
            // Frange de longs poils sous l'avant-bras
            blob(arm, [0.34, -0.92, side * 0.06], [0.36, 0.20, 0.22], bodyMat, -0.65);
            blob(arm, [W[0] + 0.08, W[1] - 0.04, W[2]], [0.18, 0.14, 0.20], snoutMat);

            // 3 grandes griffes courbes en ivoire (pour arracher les branches)
            [-0.12, 0, 0.12].forEach((cz, idx) => {
                const cScale = idx === 1 ? 1.12 : 0.95;
                const C0 = [W[0] + 0.16, W[1] - 0.04, W[2] + cz];
                const C1 = [C0[0] + 0.26 * cScale, C0[1] - 0.16 * cScale, C0[2]];
                const C2 = [C1[0] + 0.12 * cScale, C1[1] - 0.30 * cScale, C1[2]];
                bone(arm, C0, C1, 0.055, 0.038, clawMat, 6);
                bone(arm, C1, C2, 0.038, 0.008, clawMat, 6);
            });
        });

        // =====================================================================
        // 4. LOURDE QUEUE TRÉPIED POILUE (3 segments)
        // =====================================================================
        let pTail = rig.torso;
        const tLens = [0.62, 0.58, 0.56];
        const tRads = [0.48, 0.34, 0.22, 0.08];
        for (let s = 0; s < 3; s++) {
            const seg = new THREE.Group();
            seg.position.set(s === 0 ? -1.02 : -tLens[s - 1], s === 0 ? -0.12 : -0.14, 0);
            const len = tLens[s], r1 = tRads[s], r2 = tRads[s + 1];
            bone(seg, [0, 0, 0], [-len, -0.14, 0], r1, r2, bodyMat, 9);
            blob(seg, [-len * 0.5, -0.08, 0], [len * 0.65, r1 * 0.95, r1 * 1.05], s === 2 ? darkMat : bodyMat, 0.22);
            pTail.add(seg);
            rig.tailSegments.push(seg);
            pTail = seg;
        }

        // =====================================================================
        // 5. PATTES ARRIÈRE COLONNAIRES PÉDOLATÉRALES (sol à y = -1.85)
        // =====================================================================
        [-1, 1].forEach(side => {
            const leg = new THREE.Group();
            leg.position.set(-0.30, 0.0, side * 0.58);
            hips.add(leg);
            rig.legs.push(leg);

            const K = [0.16, -0.82, side * 0.04];
            const F = [0.06, -1.68, side * 0.04];

            blob(leg, [0.05, -0.44, 0], [0.46, 0.58, 0.38], bodyMat, 0.16);
            joint(leg, K, 0.28, bodyMat);
            bone(leg, K, F, 0.28, 0.24, darkMat, 9);
            // Grand pied plantigrade appuyé sur la tranche externe (pédolatéral) + griffes
            blob(leg, [0.18, -1.72, side * 0.04], [0.36, 0.14, 0.26], darkMat);
            [-0.09, 0.0, 0.09].forEach(dz => {
                bone(leg, [0.44, -1.72, side * 0.04 + dz], [0.64, -1.78, side * 0.04 + dz], 0.045, 0.01, clawMat, 5);
            });
        });
    },
});
