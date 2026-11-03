/* ============================================================================
 * COMBATTANT : PULMONOSCORPIUS (Pulmonoscorpius Kirktonensis)
 * Données (stats, skins, textes), modèle 3D, animations, coups spéciaux & fatalité.
 * Silhouette paléoart : scorpion géant du Carbonifère à carapace chitineuse
 * brun-acajou segmentée (prosoma + 7 tergites du mésosoma), 2 grands pédipalpes
 * à pinces renflées, 8 pattes ambulatoires articulées et métasoma arqué à telson.
 * ============================================================================ */

registerFighter({
    id: 'pulmonoscorpius',
    name: 'PULMONOSCORPIUS',
    fullName: 'Pulmonoscorpius Kirktonensis',
    role: 'Scorpion Primordial Géant',
    title: '« L’Arachnide Venimeux du Carbonifère »',
    primaryColor: 0x6e4f3d,
    secondaryColor: 0x38261c,
    accentColor: 0xa85525,
    cssPrimary: '#9333ea',
    scale: 0.80,
    previewScale: 0.95,
    stats: { pow: 93, spd: 88, def: 89 },
    maxHp: 1000,
    walkSpeed: 8.8,
    special1Name: 'Dard Neurotoxique (H)',
    special2Name: 'Pince Broyeuse (T)',
    fatalityName: 'Injection Mortelle (R)',
    moveStyle: 'Galop à 8 pattes chitineuses, garde de pinces dentelées et dard caudal prêt à fondre.',
    fatalityDesc: 'Verrouille la tête de la victime dans ses pinces et lui transperce le crâne de son dard caudal venimeux jusqu’à liquéfaction.',
    skins: [
        { name: 'Kirkton Chitin', primary: 0x6e4f3d, secondary: 0x38261c, accent: 0xa85525, legs: 0x8c684c },
        { name: 'Carbon Chitin', primary: 0x9333ea, secondary: 0x4c1d95, accent: 0x22c55e, legs: 0xa855f7 },
        { name: 'Toxic Emerald', primary: 0x14532d, secondary: 0x052e16, accent: 0x22c55e, legs: 0x16a34a },
        { name: 'Amber Fossil', primary: 0x78350f, secondary: 0x451a03, accent: 0xf59e0b, legs: 0xb45309 },
        { name: 'Spectral Phantom', primary: 0x1e293b, secondary: 0x0f172a, accent: 0x06b6d4, legs: 0x475569 }
    ]
}, {
    animBaseHipsY: 0.95,

    onSpecial2(attacker, defender, dist, basePow) {
        sfx.playStinger();
        spawn3DProjectile(attacker, 'venom');
    },

    buildRig(ctx) {
        const { hips, rig, addMesh, bodyMat, darkMat, accentMat, skin, skinMeshes } = ctx;
        void accentMat;

        const chitinMat = new THREE.MeshStandardMaterial({ color: skin.primary || 0x6e4f3d, roughness: 0.35, metalness: 0.2 });
        const legChitinMat = new THREE.MeshStandardMaterial({ color: skin.legs || 0x8c684c, roughness: 0.4, metalness: 0.15 });
        const telsonMat = new THREE.MeshStandardMaterial({ color: skin.accent || 0xa85525, roughness: 0.3, metalness: 0.25 });
        const tipMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.25, metalness: 0.3 });
        const eyeBlackMat = new THREE.MeshBasicMaterial({ color: 0x09090b });
        void bodyMat;

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
            const m = addMesh(new THREE.SphereGeometry(r, 9, 7), mat, parent, p[0], p[1], p[2]);
            skinMeshes.push(m);
            return m;
        };
        const blob = (parent, p, s, mat, rz = 0, ry = 0, rx = 0) => {
            const m = addMesh(new THREE.SphereGeometry(1, 12, 10), mat, parent, p[0], p[1], p[2], rx, ry, rz);
            m.scale.set(s[0], s[1], s[2]);
            skinMeshes.push(m);
            return m;
        };

        hips.position.y = 0.95;

        // =====================================================================
        // 1. MÉSOSOMA SEGMENTÉ (7 plaques tergites de carapace) & PROSOMA
        // =====================================================================
        for (let t = 0; t < 7; t++) {
            const tx = -0.82 + t * 0.22;
            const archW = 0.56 - Math.pow((t - 2.5) / 5.5, 2) * 0.22;
            const archH = 0.26 - Math.abs(t - 2.5) * 0.015;
            // Tergite chitineux bombé et bordure sombre d'articulation
            blob(rig.torso, [tx, 0.08, 0], [0.16, archH, archW], chitinMat);
            blob(rig.torso, [tx - 0.07, 0.10, 0], [0.05, archH * 1.04, archW * 1.02], darkMat);
        }
        // Sternites ventraux plus clairs
        blob(rig.torso, [-0.15, -0.06, 0], [0.85, 0.16, 0.46], legChitinMat);

        // Céphalothorax (Prosoma) trapézoïdal à l'avant + yeux médians et latéraux + chélicères
        rig.headGroup.position.set(0.55, 0.10, 0);
        rig.torso.add(rig.headGroup);
        blob(rig.headGroup, [0.12, 0.02, 0], [0.38, 0.22, 0.44], darkMat, -0.05);
        blob(rig.headGroup, [0.22, 0.06, 0], [0.28, 0.18, 0.36], chitinMat, -0.08);

        // Paire d'ocelles médians sur le tubercule oculaire dorsal
        [-0.06, 0.06].forEach(z => {
            addMesh(new THREE.SphereGeometry(0.045, 8, 8), eyeBlackMat, rig.headGroup, 0.20, 0.22, z);
        });
        // Groupes d'yeux latéraux aux angles avant du prosoma
        [-1, 1].forEach(side => {
            [0.36, 0.42].forEach((ex, idx) => {
                addMesh(new THREE.SphereGeometry(0.032, 6, 6), eyeBlackMat, rig.headGroup, ex, 0.08, side * (0.32 - idx * 0.03));
            });
            // Chélicères (petites pinces buccales déchiqueteuses)
            blob(rig.headGroup, [0.48, -0.04, side * 0.11], [0.14, 0.08, 0.08], telsonMat, -0.2);
            addMesh(new THREE.ConeGeometry(0.035, 0.16, 5), tipMat, rig.headGroup, 0.62, -0.06, side * 0.10, 0, 0, -Math.PI / 2 - 0.15);
        });

        // =====================================================================
        // 2. DEUX GRANDS PÉDIPALPES ARTICULÉS (PINCES MASSIVES RENFLÉES)
        // =====================================================================
        [-1, 1].forEach(side => {
            const pincerArm = new THREE.Group();
            pincerArm.position.set(0.68, 0.04, side * 0.42);
            rig.torso.add(pincerArm);
            rig.arms.push(pincerArm);

            const S = [0, 0, 0];
            const E = [0.22, 0.02, side * 0.36];         // coude (fémur -> patella)
            const W = [0.68, 0.0, side * 0.24];          // poignet (base de la pince)

            joint(pincerArm, S, 0.11, darkMat);
            bone(pincerArm, S, E, 0.10, 0.11, legChitinMat, 7);
            joint(pincerArm, E, 0.12, darkMat);
            bone(pincerArm, E, W, 0.12, 0.14, chitinMat, 8);

            // Manus (paume renflée de la pince) + doigts courbés dentelés
            const chela = new THREE.Group();
            chela.position.set(W[0], W[1], W[2]);
            chela.rotation.y = -side * 0.22;
            pincerArm.add(chela);

            blob(chela, [0.24, 0.02, 0], [0.32, 0.18, 0.16], telsonMat, 0.06);
            blob(chela, [0.18, 0.02, 0], [0.26, 0.19, 0.17], chitinMat, 0.06);
            // Doigt fixe supérieur courbé
            bone(chela, [0.46, 0.08, 0], [0.92, 0.03, 0], 0.075, 0.015, darkMat, 6);
            // Doigt mobile inférieur courbé
            bone(chela, [0.44, -0.07, 0], [0.88, -0.02, 0], 0.065, 0.014, darkMat, 6);
        });

        // =====================================================================
        // 3. 8 PATTES AMBULATOIRES ARTICULÉES (4 paires, sol à y = -0.95)
        // =====================================================================
        for (let side = -1; side <= 1; side += 2) {
            for (let l = 0; l < 4; l++) {
                const legGroup = new THREE.Group();
                const xOffset = 0.38 - l * 0.28;
                legGroup.position.set(xOffset, -0.04, side * 0.42);
                hips.add(legGroup);
                rig.legs.push(legGroup);

                const spreadX = (1.5 - l) * 0.12;
                const C = [0, 0, 0];
                const F = [spreadX * 0.5, 0.18, side * 0.36];        // fémur arqué vers le haut
                const P = [spreadX * 0.9, -0.32, side * 0.68];       // patella / tibia
                const T = [spreadX * 1.15, -0.88, side * 0.92];      // tarse au sol

                joint(legGroup, C, 0.07, darkMat);
                bone(legGroup, C, F, 0.07, 0.06, legChitinMat, 6);
                joint(legGroup, F, 0.065, darkMat);
                bone(legGroup, F, P, 0.06, 0.048, legChitinMat, 6);
                joint(legGroup, P, 0.05, darkMat);
                bone(legGroup, P, T, 0.045, 0.025, chitinMat, 6);
                // Griffes tarsales doubles au bout de chaque patte
                addMesh(new THREE.ConeGeometry(0.02, 0.09, 4), tipMat, legGroup, T[0] + 0.03, T[1] - 0.02, T[2] + side * 0.03, 0, 0, -side * 0.5);
            }
        }

        // =====================================================================
        // 4. MÉTASOMA EN 5 SEGMENTS CARÉNÉS + TELSON VENIMEUX ET AIGUILLON
        // =====================================================================
        let pSeg = rig.torso;
        const mLens = [0.46, 0.46, 0.46, 0.48, 0.50];
        const mRads = [0.22, 0.20, 0.18, 0.16, 0.14, 0.12];
        for (let s = 0; s < 5; s++) {
            const seg = new THREE.Group();
            seg.position.set(s === 0 ? -0.92 : -mLens[s - 1], s === 0 ? 0.12 : 0.14, 0);
            const len = mLens[s], r1 = mRads[s], r2 = mRads[s + 1];
            joint(seg, [0, 0, 0], r1 * 1.05, darkMat);
            bone(seg, [0, 0, 0], [-len, 0.14, 0], r1, r2, chitinMat, 8);
            // Carène dorsale chitineuse sombre
            bone(seg, [-0.04, r1 * 0.65, 0], [-len + 0.04, 0.14 + r2 * 0.65, 0], r1 * 0.45, r2 * 0.45, darkMat, 6);
            pSeg.add(seg);
            rig.tailSegments.push(seg);
            pSeg = seg;
        }

        // Telson (vésicule à venin renflée rousse) + Aculeus (dard recourbé noir à la pointe)
        const telson = new THREE.Group();
        telson.position.set(-0.50, 0.16, 0);
        blob(telson, [-0.06, 0.04, 0], [0.24, 0.17, 0.16], telsonMat, -0.25);
        bone(telson, [-0.14, 0.14, 0], [0.06, 0.36, 0], 0.075, 0.035, telsonMat, 7);
        bone(telson, [0.06, 0.36, 0], [0.28, 0.26, 0], 0.035, 0.005, tipMat, 6);
        pSeg.add(telson);
        rig.specialParts.stinger = telson;
    },

    animateIdle(ctx) {
        const { rig, baseHipsY, time, isWalk } = ctx;
        const freq = isWalk ? 14 : 3.5;
        rig.hips.position.y = baseHipsY + Math.sin(time * freq) * (isWalk ? 0.08 : 0.02);
        rig.arms[0].rotation.y = 0.25 + Math.sin(time * 3) * 0.15;
        rig.arms[1].rotation.y = -0.25 - Math.sin(time * 3) * 0.15;
        rig.tailSegments.forEach((seg, i) => {
            seg.rotation.z = -0.35 + Math.sin(time * 4 + i * 0.4) * 0.08;
        });
        if (rig.specialParts.stinger) {
            rig.specialParts.stinger.rotation.z = 0.4 + Math.sin(time * 6) * 0.15;
        }
        rig.legs.forEach((leg, i) => {
            const phase = (i % 2 === 0 ? 0 : Math.PI);
            leg.rotation.z = isWalk ? Math.sin(time * freq + phase + i * 0.5) * 0.35 : 0;
        });
    },

    hasCustomDirectionals: true,

    animateAttack(ctx) {
        const { rig, act, prog, swing, strike, baseHipsY } = ctx;
        const s = strike !== undefined ? strike : swing;

        if (act === 'light') {
            rig.arms[0].rotation.y = 0.3 + s * 1.15;
            rig.arms[1].rotation.y = -0.3 - s * 0.35;
        } else if (act === 'light2') {
            rig.arms[0].rotation.y = 0.2 - s * 0.35;
            rig.arms[1].rotation.y = -0.3 - s * 1.25;
            rig.tailSegments.forEach(seg => { seg.rotation.z = -s * 0.4; });
        } else if (act === 'fwd_light') {
            rig.hips.position.x = s * 0.95;
            rig.arms[0].rotation.y = s * 1.3;
            rig.arms[1].rotation.y = -s * 1.3;
        } else if (act === 'low_light' || act === 'low_heavy') {
            rig.hips.position.y = (baseHipsY || 0.95) * 0.55;
            rig.arms[0].rotation.x = -s * 0.65;
            rig.arms[1].rotation.x = -s * 0.65;
        } else if (act === 'anti_air' || act === 'up_light') {
            rig.hips.position.y = (baseHipsY || 0.95) + s * 0.45;
            rig.tailSegments.forEach(seg => { seg.rotation.z = s * 0.85; });
            if (rig.specialParts.stinger) rig.specialParts.stinger.rotation.z = s * 1.8;
            rig.arms[0].rotation.z = s * 1.2;
            rig.arms[1].rotation.z = -s * 1.2;
        } else if (act === 'back_light') {
            rig.hips.position.x = -s * 0.7;
            rig.arms[0].rotation.y = s * 1.1;
            rig.arms[1].rotation.y = -s * 1.1;
        } else if (act === 'throw') {
            rig.hips.position.x = s * 0.85;
            rig.arms[0].rotation.y = 1.2;
            rig.arms[1].rotation.y = -1.2;
            if (rig.specialParts.stinger) rig.specialParts.stinger.rotation.z = Math.sin(prog * 20) * 1.2;
        } else if (act === 'air_light' || act === 'air_heavy') {
            rig.torso.rotation.z = -s * 0.55;
            rig.arms[0].rotation.y = s * 1.35;
            rig.arms[1].rotation.y = -s * 1.35;
            rig.tailSegments.forEach(seg => { seg.rotation.z = -s * 0.75; });
        } else if (act === 'heavy' || act === 'fwd_heavy') {
            rig.hips.position.x = s * (act === 'fwd_heavy' ? 1.2 : 0.6);
            rig.arms[0].rotation.y = s * 1.45;
            rig.arms[1].rotation.y = -s * 1.45;
        } else if (act === 'special') {
            rig.tailSegments.forEach(seg => { seg.rotation.z = -s * 0.85; });
            if (rig.specialParts.stinger) rig.specialParts.stinger.rotation.z = s * 1.45;
        } else if (act === 'special2') {
            rig.torso.rotation.y = Math.sin(prog * Math.PI * 2) * 0.45;
            rig.tailSegments.forEach(seg => { seg.rotation.z = -0.7; });
        }
    },

    animateFatality(ctx) {
        const { rig, prog } = ctx;
        rig.arms[0].rotation.y = 0.85;
        rig.arms[1].rotation.y = -0.85;
        rig.tailSegments.forEach(seg => { seg.rotation.z = -Math.sin(prog * Math.PI * 4) * 0.75; });
        if (rig.specialParts.stinger) rig.specialParts.stinger.rotation.z = Math.sin(prog * Math.PI * 4) * 1.2;
    },

    executeFatality(winner, loser) {
        setTimeout(() => {
            if (matchState !== 'fatality_anim') return;
            sfx.playStinger();
            sfx.playBoneCrack();
            spawn3DBloodAndBones(loser.x, 2.2, 40, true);
            spawnFloatingPopup(loser.x, 'DARD ENFOUÉ !', '#22c55e');
        }, 900);
        setTimeout(() => {
            if (matchState !== 'fatality_anim') return;
            sfx.playBoneCrack();
            sfx.playRoar(120, 0.6);
            loser.decapitated = true;
            loser.isDead = true;
            loser.hp = 0;
            spawn3DBloodAndBones(loser.x, 2.6, 75, true);
            screenShake = 0.85;
            showAnnouncer('FATALITY !', 'INJECTION MORTELLE DU PULMONOSCORPIUS');
        }, 2200);
    },
});
