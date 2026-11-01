/* ============================================================================
 * COMBATTANT : PULMONOSCORPIUS (Pulmonoscorpius Kirktonensis)
 * Données (stats, skins, textes), modèle 3D, animations, coups spéciaux & fatalité.
 * ============================================================================ */

registerFighter({
    id: 'pulmonoscorpius',
    name: 'PULMONOSCORPIUS',
    fullName: 'Pulmonoscorpius Kirktonensis',
    role: 'Scorpion Primordial Géant',
    title: '« L’Arachnide Venimeux du Carbonifère »',
    primaryColor: 0x9333ea,
    secondaryColor: 0x4c1d95,
    accentColor: 0x22c55e,
    cssPrimary: '#9333ea',
    scale: 1.05,
    stats: { pow: 93, spd: 88, def: 89 },
    maxHp: 1000,
    walkSpeed: 8.8,
    special1Name: 'Dard Neurotoxique (H)',
    special2Name: 'Pince Broyeuse (T)',
    fatalityName: 'Injection Mortelle (R)',
    moveStyle: 'Galop à 8 pattes chitineuses, garde de pinces dentelées et dard caudal prêt à fondre.',
    fatalityDesc: 'Verrouille la tête de la victime dans ses pinces et lui transperce le crâne de son dard caudal venimeux jusqu’à liquéfaction.',
    skins: [
        { name: 'Carbon Chitin', primary: 0x9333ea, secondary: 0x4c1d95, accent: 0x22c55e },
        { name: 'Toxic Emerald', primary: 0x14532d, secondary: 0x052e16, accent: 0x22c55e },
        { name: 'Amber Fossil', primary: 0x78350f, secondary: 0x451a03, accent: 0xf59e0b },
        { name: 'Spectral Phantom', primary: 0x1e293b, secondary: 0x0f172a, accent: 0x06b6d4 }
    ]
}, {
    // Hauteur de base du bassin utilisée par le système d'animation
    animBaseHipsY: 0.95,

    // Spécial 2 (T)
    onSpecial2(attacker, defender, dist, basePow) {
        sfx.playStinger();
        spawn3DProjectile(attacker, 'venom');
    },

    // Construction du modèle 3D articulé
    buildRig(ctx) {
        const { hips, rig, addMesh, bodyMat, darkMat, accentMat, boneMat, eyeMat } = ctx;
        // PULMONOSCORPIUS : Scorpion géant à 8 pattes, prosoma, métasoma articulé et aiguillon
        hips.position.y = 0.95;
        // Prosoma (céphalothorax chitineux aplati)
        addMesh(new THREE.BoxGeometry(1.6, 0.55, 1.3), bodyMat, rig.torso, 0, 0, 0);
        addMesh(new THREE.BoxGeometry(1.2, 0.35, 1.1), darkMat, rig.torso, 0.1, 0.18, 0);
        // Yeux médians et latéraux bioluminescents
        [-0.15, 0.15].forEach(z => {
            addMesh(new THREE.SphereGeometry(0.065, 8, 8), eyeMat, rig.torso, 0.65, 0.28, z);
        });
        for (let o = -0.35; o <= 0.35; o += 0.7) {
            addMesh(new THREE.SphereGeometry(0.04, 6, 6), accentMat, rig.torso, 0.75, 0.12, o);
        }

        // Chélicères
        addMesh(new THREE.ConeGeometry(0.08, 0.35, 4), boneMat, rig.torso, 0.95, -0.05, 0.12, 0, 0, -Math.PI / 2);
        addMesh(new THREE.ConeGeometry(0.08, 0.35, 4), boneMat, rig.torso, 0.95, -0.05, -0.12, 0, 0, -Math.PI / 2);

        // Deux Pédipalpes (immenses pinces chitineuses articulées)
        [-0.85, 0.85].forEach((zOff, pIdx) => {
            const pincerArm = new THREE.Group();
            pincerArm.position.set(0.65, 0.05, zOff);
            // Brachium
            addMesh(new THREE.BoxGeometry(0.7, 0.22, 0.22), darkMat, pincerArm, 0.3, 0.1, 0, 0, 0, 0.35);
            // Tibia de la pince
            const chela = new THREE.Group();
            chela.position.set(0.7, 0.2, 0);
            addMesh(new THREE.BoxGeometry(0.65, 0.3, 0.28), bodyMat, chela, 0.28, 0, 0);
            // Doigt fixe dentelé
            addMesh(new THREE.ConeGeometry(0.09, 0.6, 4), accentMat, chela, 0.75, 0.08, 0, 0, 0, -Math.PI / 2);
            // Doigt mobile dentelé
            addMesh(new THREE.ConeGeometry(0.08, 0.55, 4), boneMat, chela, 0.72, -0.09, 0, 0, 0, -Math.PI / 2 + 0.3);
            pincerArm.add(chela);
            rig.torso.add(pincerArm);
            rig.arms.push(pincerArm);
        });

        // 8 pattes arachnides ambulatoires (4 de chaque côté)
        for (let side = -1; side <= 1; side += 2) {
            for (let l = 0; l < 4; l++) {
                const legGroup = new THREE.Group();
                const xOffset = -0.45 + l * 0.32;
                legGroup.position.set(xOffset, -0.05, side * 0.65);
                // Fémur relevé
                const rz = side > 0 ? 0.45 : -0.45;
                addMesh(new THREE.BoxGeometry(0.14, 0.55, 0.14), darkMat, legGroup, 0, 0.22, side * 0.22, 0, 0, rz);
                // Tibia descendant vers le sol
                addMesh(new THREE.BoxGeometry(0.11, 0.7, 0.11), bodyMat, legGroup, 0, -0.28, side * 0.42, 0, 0, -rz * 1.2);
                hips.add(legGroup);
                rig.legs.push(legGroup);
            }
        }

        // Métasoma : Queue de scorpion en 5 segments arquée vers l'avant + venin stinger
        let pSeg = rig.torso;
        for (let s = 0; s < 5; s++) {
            const seg = new THREE.Group();
            seg.position.set(s === 0 ? -0.85 : -0.55, s === 0 ? 0.1 : 0.18, 0);
            const sz = 0.55 - s * 0.05;
            addMesh(new THREE.BoxGeometry(0.65, sz, sz), s % 2 === 0 ? bodyMat : darkMat, seg, -0.25, 0, 0);
            pSeg.add(seg);
            rig.tailSegments.push(seg);
            pSeg = seg;
        }
        // Telson (ampoule à venin) + Aiguillon courbé (stinger)
        const telson = new THREE.Group();
        telson.position.set(-0.6, 0.05, 0);
        addMesh(new THREE.SphereGeometry(0.24, 8, 8), accentMat, telson, 0, 0, 0);
        // Aiguillon acéré noir et or
        addMesh(new THREE.ConeGeometry(0.08, 0.55, 5), boneMat, telson, 0.15, 0.32, 0, 0, 0, 0.65);
        pSeg.add(telson);
        rig.specialParts.stinger = telson;
    },

    // Animation d'attente (idle) / de marche
    animateIdle(ctx) {
        const { rig, baseHipsY, time, isWalk } = ctx;
        // Pulmonoscorpius : Ondulation des 8 pattes et dard dressé
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

    // Animations d'attaques (light / heavy / special / special2 / xray)
    animateAttack(ctx) {
        const { rig, act, prog, swing } = ctx;
        if (act === 'light') {
            rig.arms[0].rotation.y = 0.3 + swing * 0.95;
            rig.arms[1].rotation.y = -0.3 - swing * 0.45;
        } else if (act === 'heavy') {
            rig.arms[0].rotation.y = swing * 1.25;
            rig.arms[1].rotation.y = -swing * 1.25;
        } else if (act === 'special') {
            rig.tailSegments.forEach(seg => { seg.rotation.z = -swing * 0.85; });
            if (rig.specialParts.stinger) rig.specialParts.stinger.rotation.z = swing * 1.45;
        } else {
            rig.torso.rotation.y = Math.sin(prog * Math.PI * 2) * 0.45;
            rig.tailSegments.forEach(seg => { seg.rotation.z = -0.7; });
        }
    },

    // Chorégraphie 3D de la fatalité
    animateFatality(ctx) {
        const { rig, prog } = ctx;
        rig.arms[0].rotation.y = 0.85;
        rig.arms[1].rotation.y = -0.85;
        rig.tailSegments.forEach(seg => { seg.rotation.z = -Math.sin(prog * Math.PI * 4) * 0.75; });
        if (rig.specialParts.stinger) rig.specialParts.stinger.rotation.z = Math.sin(prog * Math.PI * 4) * 1.2;
    },

    // Script de la fatalité (sons, sang, effets, annonce)
    executeFatality(winner, loser) {
        // 10) PULMONOSCORPIUS : Injection de neurotoxine et liquéfaction interne
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
