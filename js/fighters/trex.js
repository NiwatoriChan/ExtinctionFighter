/* ============================================================================
 * COMBATTANT : T-REX (Tyrannosaurus Rex)
 * Données (stats, skins, textes), modèle 3D, animations, coups spéciaux & fatalité.
 * ============================================================================ */

registerFighter({
    id: 'trex',
    name: 'T-REX',
    fullName: 'Tyrannosaurus Rex',
    role: 'Apex Carnivore',
    title: '« Le Roi Sanglant du Crétacé »',
    primaryColor: 0xdc2626,
    secondaryColor: 0x7f1d1d,
    accentColor: 0xf59e0b,
    cssPrimary: '#dc2626',
    scale: 1.05,
    stats: { pow: 96, spd: 72, def: 85 },
    maxHp: 1050,
    walkSpeed: 7.8,
    special1Name: 'Morsure Sismique (H)',
    special2Name: 'Rugissement de Magma (T)',
    fatalityName: 'Dévoration Royale (R)',
    moveStyle: 'Foulée bipède lourde, morsure plongeante et balayage caudal rotatif.',
    fatalityDesc: 'Saisit la victime dans ses mâchoires géantes, la secoue violemment, arrache la tête et l’avale dans une gerbe de sang.',
    skins: [
        { name: 'Apex Crimson', primary: 0xdc2626, secondary: 0x7f1d1d, accent: 0xf59e0b },
        { name: 'Abyssal Shadow', primary: 0x18181b, secondary: 0x09090b, accent: 0x38bdf8 },
        { name: 'Albino Phantom', primary: 0xe2e8f0, secondary: 0x94a3b8, accent: 0xd946ef },
        { name: 'Molten Core', primary: 0x7c2d12, secondary: 0x451a03, accent: 0xf97316 }
    ]
}, {
    // Hauteur de base du bassin utilisée par le système d'animation
    animBaseHipsY: 2.1,

    // Spécial 2 (T)
    onSpecial2(attacker, defender, dist, basePow) {
        spawn3DProjectile(attacker, 'boulder');
    },

    // Construction du modèle 3D articulé
    buildRig(ctx) {
        const { hips, rig, addMesh, bodyMat, darkMat, accentMat, boneMat, eyeMat } = ctx;
        hips.position.y = 2.1;
        // Torse massif incliné
        addMesh(new THREE.BoxGeometry(2.3, 1.35, 1.3), bodyMat, rig.torso, 0, 0.2, 0, 0, 0, 0.18);
        addMesh(new THREE.BoxGeometry(2.0, 0.35, 1.1), darkMat, rig.torso, 0, 0.85, 0, 0, 0, 0.18);

        // Crêtes dorsales
        for (let i = 0; i < 6; i++) {
            addMesh(new THREE.ConeGeometry(0.14, 0.38, 5), accentMat, rig.torso, -0.9 + i * 0.36, 1.05 + i * 0.05, 0);
        }

        // Cou & Tête géante articulée
        rig.neck.position.set(1.05, 0.65, 0);
        rig.torso.add(rig.neck);
        addMesh(new THREE.BoxGeometry(0.8, 0.9, 0.95), bodyMat, rig.neck, 0.2, 0.3, 0, 0, 0, -0.3);

        rig.headGroup.position.set(0.55, 0.75, 0);
        rig.neck.add(rig.headGroup);
        // Crâne supérieur
        addMesh(new THREE.BoxGeometry(1.45, 0.68, 0.95), bodyMat, rig.headGroup, 0.45, 0.15, 0);
        addMesh(new THREE.BoxGeometry(0.5, 0.25, 0.98), darkMat, rig.headGroup, 0.15, 0.45, 0);
        // Yeux
        addMesh(new THREE.SphereGeometry(0.1, 8, 8), eyeMat, rig.headGroup, 0.35, 0.28, 0.48);
        addMesh(new THREE.SphereGeometry(0.1, 8, 8), eyeMat, rig.headGroup, 0.35, 0.28, -0.48);
        // Dents supérieures
        for (let t = 0; t < 5; t++) {
            addMesh(new THREE.ConeGeometry(0.06, 0.22, 4), boneMat, rig.headGroup, 0.25 + t * 0.2, -0.22, 0.38, Math.PI, 0, 0);
            addMesh(new THREE.ConeGeometry(0.06, 0.22, 4), boneMat, rig.headGroup, 0.25 + t * 0.2, -0.22, -0.38, Math.PI, 0, 0);
        }
        // Mâchoire inférieure
        rig.jaw.position.set(0.0, -0.18, 0);
        rig.headGroup.add(rig.jaw);
        addMesh(new THREE.BoxGeometry(1.3, 0.32, 0.82), darkMat, rig.jaw, 0.45, -0.1, 0);
        for (let t = 0; t < 4; t++) {
            addMesh(new THREE.ConeGeometry(0.05, 0.18, 4), boneMat, rig.jaw, 0.3 + t * 0.2, 0.12, 0.32);
            addMesh(new THREE.ConeGeometry(0.05, 0.18, 4), boneMat, rig.jaw, 0.3 + t * 0.2, 0.12, -0.32);
        }

        // Petits bras de T-Rex
        [-0.55, 0.55].forEach(zOff => {
            const arm = new THREE.Group();
            arm.position.set(0.95, 0.0, zOff);
            addMesh(new THREE.BoxGeometry(0.55, 0.18, 0.18), darkMat, arm, 0.22, -0.1, 0, 0, 0, -0.4);
            rig.torso.add(arm);
            rig.arms.push(arm);
        });

        // Queue segmentée (4 segments)
        let parentTail = rig.torso;
        for (let s = 0; s < 4; s++) {
            const seg = new THREE.Group();
            seg.position.set(s === 0 ? -1.1 : -0.82, s === 0 ? 0.1 : 0, 0);
            const w = 0.85 * Math.pow(0.74, s);
            addMesh(new THREE.BoxGeometry(0.9, w, w), s % 2 === 0 ? bodyMat : darkMat, seg, -0.4, 0, 0);
            parentTail.add(seg);
            rig.tailSegments.push(seg);
            parentTail = seg;
        }

        // 2 Jambes musclées
        [-0.58, 0.58].forEach(zOff => {
            const leg = new THREE.Group();
            leg.position.set(-0.15, 0, zOff);
            addMesh(new THREE.BoxGeometry(0.75, 1.15, 0.52), bodyMat, leg, 0, -0.5, 0, 0, 0, 0.15);
            addMesh(new THREE.BoxGeometry(0.48, 1.05, 0.42), darkMat, leg, -0.1, -1.4, 0, 0, 0, -0.1);
            addMesh(new THREE.BoxGeometry(0.85, 0.25, 0.55), boneMat, leg, 0.15, -1.98, 0);
            hips.add(leg);
            rig.legs.push(leg);
        });
    },

    // Animation d'attente (idle) / de marche
    animateIdle(ctx) {
        const { rig, baseHipsY, time, isWalk } = ctx;
        // T-Rex : Foulée bipède lourde, mâchoire qui respire, queue qui contrebalance
        const freq = isWalk ? 11 : 3.5;
        rig.hips.position.y = baseHipsY + Math.abs(Math.sin(time * freq)) * (isWalk ? 0.22 : 0.06);
        rig.torso.rotation.z = isWalk ? -0.12 + Math.sin(time * freq) * 0.06 : Math.sin(time * 3) * 0.03;
        rig.jaw.rotation.z = -0.08 - Math.abs(Math.sin(time * 2.5)) * 0.12;
        rig.legs[0].rotation.z = isWalk ? Math.sin(time * freq) * 0.55 : 0;
        rig.legs[1].rotation.z = isWalk ? -Math.sin(time * freq) * 0.55 : 0;
        rig.tailSegments.forEach((seg, i) => {
            seg.rotation.y = Math.sin(time * freq - i * 0.5) * (isWalk ? 0.22 : 0.1);
        });
    },

    // Animations d'attaques (light / heavy / special / special2 / xray)
    animateAttack(ctx) {
        const { rig, act, prog, swing } = ctx;
        if (act === 'light') {
            // Morsure plongeante en avant
            rig.torso.rotation.z = -swing * 0.35;
            rig.neck.rotation.z = -swing * 0.3;
            rig.jaw.rotation.z = -swing * 0.65;
        } else if (act === 'heavy') {
            // Balayage caudal rotatif à 360°
            rig.hips.rotation.y = prog * Math.PI * 2;
            rig.tailSegments.forEach(s => { s.rotation.y = 0.35; });
        } else {
            // Rugissement volcanique / Morsure sismique
            rig.torso.rotation.z = swing * 0.28;
            rig.headGroup.rotation.z = swing * 0.45;
            rig.jaw.rotation.z = -0.75;
        }
    },

    // Chorégraphie 3D de la fatalité
    animateFatality(ctx) {
        const { rig, prog } = ctx;
        // T-REX : Saisit la victime, la secoue violemment de gauche à droite, puis avale sa tête
        if (prog < 0.3) {
            rig.torso.rotation.z = -0.35;
            rig.neck.rotation.z = -0.4;
            rig.jaw.rotation.z = -0.7;
        } else if (prog < 0.72) {
            rig.torso.rotation.z = 0.25;
            rig.headGroup.rotation.y = Math.sin(prog * 45) * 0.55;
            rig.headGroup.rotation.z = Math.cos(prog * 35) * 0.35;
            rig.jaw.rotation.z = -0.25;
        } else {
            rig.torso.rotation.z = 0.35;
            rig.headGroup.rotation.z = 0.65;
            rig.jaw.rotation.z = Math.sin(prog * 30) * 0.35 - 0.35;
        }
    },

    // Script de la fatalité (sons, sang, effets, annonce)
    executeFatality(winner, loser) {
        // 1) T-REX : Saisit la victime, la secoue violemment et avale sa tête
        setTimeout(() => {
            if (matchState !== 'fatality_anim') return;
            sfx.playBoneCrack();
            spawn3DBloodAndBones(loser.x, 2.5, 35, true);
            spawnFloatingPopup(loser.x, 'MÂCHOIRE ROYALE !', '#ef4444');
        }, 950);
        setTimeout(() => {
            if (matchState !== 'fatality_anim') return;
            sfx.playBoneCrack();
            sfx.playRoar(52, 0.9);
            loser.decapitated = true;
            loser.isDead = true;
            loser.hp = 0;
            spawn3DBloodAndBones(loser.x, 2.8, 65, true);
            screenShake = 0.9;
            showAnnouncer('FATALITY !', 'T-REX DÉVORE SA PROIE');
        }, 2200);
    },
});
