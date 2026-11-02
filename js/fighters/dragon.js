/* ============================================================================
 * BOSS FINAL NON JOUABLE : DRAK'ZUL LE DRAGON PRIMORDIAL
 * Boss suprême de la Campagne (affronté après 5 prédateurs aléatoires).
 * Modèle 3D ailé, souffle de feu, séisme infernal et fatalité draconique.
 * ============================================================================ */

registerBoss({
    id: 'dragon',
    name: "DRAK'ZUL",
    fullName: "Drak'Zul le Dragon Primordial",
    role: "Boss Suprême (Non Jouable)",
    title: "« Le Fléau Incandescent de l'Extinction »",
    primaryColor: 0x7f1d1d,
    secondaryColor: 0x18181b,
    accentColor: 0xf97316,
    cssPrimary: '#ef4444',
    scale: 1.35,
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
        { name: 'Draconic Magma', primary: 0x7f1d1d, secondary: 0x18181b, accent: 0xf97316 },
        { name: 'Abyssal Void', primary: 0x0f172a, secondary: 0x020617, accent: 0xa855f7 },
        { name: 'Molten Gold', primary: 0x9a3412, secondary: 0x451a03, accent: 0xfacc15 }
    ]
}, {
    animBaseHipsY: 2.1,
    attackReach: 3.15,

    // Spécial 1 (H) : Souffle de feu draconique
    onSpecial(attacker, defender, dist, basePow) {
        sfx.playRoar(75, 0.5);
        spawn3DProjectile(attacker, 'dragon_fire');
    },

    // Spécial 2 (T) : Cataclysme de flammes de portée modérée
    onSpecial2(attacker, defender, dist, basePow) {
        screenShake = 0.35;
        spawn3DBloodAndBones(defender.x, 0.3, 10, true);
        if (dist < 4.2) {
            applyDamage(attacker, defender, Math.round(basePow * 0.8), true, 'CATACLYSME DRACONIQUE !');
        }
    },

    // Construction du modèle 3D articulé du Dragon
    buildRig(ctx) {
        const { hips, rig, addMesh, bodyMat, darkMat, accentMat, boneMat, eyeMat } = ctx;
        hips.position.y = 2.1;

        // 1. Torse musclé et cuirassé de reptile volant
        addMesh(new THREE.BoxGeometry(2.6, 1.45, 1.35), bodyMat, rig.torso, 0, 0.2, 0, 0, 0, 0.12);
        // Plastron ventral incandescent
        addMesh(new THREE.BoxGeometry(2.2, 0.45, 1.05), accentMat, rig.torso, 0.1, -0.42, 0, 0, 0, 0.12);

        // Crêtes dorsales épineuses
        for (let i = 0; i < 7; i++) {
            addMesh(new THREE.ConeGeometry(0.18, 0.55, 5), accentMat, rig.torso, -1.0 + i * 0.32, 1.05 + Math.sin(i * 0.45) * 0.15, 0);
        }

        // 2. Grandes Ailes de Dragon articulées (sur le torse)
        const leftWingGroup = new THREE.Group();
        leftWingGroup.position.set(0.3, 0.65, 0.7);
        // Bras de l'aile
        addMesh(new THREE.CylinderGeometry(0.12, 0.14, 1.8, 6), darkMat, leftWingGroup, 0.6, 0.75, 0, 0, 0, -0.75);
        // 3 Doigts d'aile étirant la membrane
        for (let f = 0; f < 3; f++) {
            const fAngle = -0.45 + f * 0.35;
            addMesh(new THREE.CylinderGeometry(0.06, 0.08, 1.9, 5), boneMat, leftWingGroup, 1.3 + f * 0.25, 1.4 - f * 0.35, 0, 0, 0, fAngle);
        }
        // Membrane en cuir draconique
        const wingMembraneL = addMesh(new THREE.PlaneGeometry(2.6, 1.6), accentMat, leftWingGroup, 1.2, 0.75, 0);
        wingMembraneL.material.side = THREE.DoubleSide;
        wingMembraneL.rotation.x = Math.PI / 2;
        rig.torso.add(leftWingGroup);

        const rightWingGroup = new THREE.Group();
        rightWingGroup.position.set(0.3, 0.65, -0.7);
        addMesh(new THREE.CylinderGeometry(0.12, 0.14, 1.8, 6), darkMat, rightWingGroup, 0.6, 0.75, 0, 0, 0, -0.75);
        for (let f = 0; f < 3; f++) {
            const fAngle = -0.45 + f * 0.35;
            addMesh(new THREE.CylinderGeometry(0.06, 0.08, 1.9, 5), boneMat, rightWingGroup, 1.3 + f * 0.25, 1.4 - f * 0.35, 0, 0, 0, fAngle);
        }
        const wingMembraneR = addMesh(new THREE.PlaneGeometry(2.6, 1.6), accentMat, rightWingGroup, 1.2, 0.75, 0);
        wingMembraneR.material.side = THREE.DoubleSide;
        wingMembraneR.rotation.x = Math.PI / 2;
        rig.torso.add(rightWingGroup);

        rig.specialParts.leftWing = leftWingGroup;
        rig.specialParts.rightWing = rightWingGroup;

        // 3. Cou & Tête cornue imposante
        rig.neck.position.set(1.15, 0.65, 0);
        rig.torso.add(rig.neck);
        addMesh(new THREE.BoxGeometry(0.9, 0.95, 0.9), darkMat, rig.neck, 0.25, 0.35, 0, 0, 0, -0.28);

        rig.headGroup.position.set(0.55, 0.75, 0);
        rig.neck.add(rig.headGroup);
        // Crâne supérieur
        addMesh(new THREE.BoxGeometry(1.5, 0.7, 0.95), bodyMat, rig.headGroup, 0.45, 0.15, 0);

        // Grandes cornes recourbées vers l'arrière
        [-0.42, 0.42].forEach(z => {
            addMesh(new THREE.ConeGeometry(0.18, 1.25, 6), boneMat, rig.headGroup, -0.25, 0.85, z, -0.5, 0, -0.9);
            addMesh(new THREE.ConeGeometry(0.12, 0.75, 6), boneMat, rig.headGroup, -0.15, 0.55, z * 1.2, -0.3, 0, -0.6);
        });

        // Yeux incandescents de feu
        addMesh(new THREE.SphereGeometry(0.12, 8, 8), accentMat, rig.headGroup, 0.4, 0.3, 0.48);
        addMesh(new THREE.SphereGeometry(0.12, 8, 8), accentMat, rig.headGroup, 0.4, 0.3, -0.48);

        // Mâchoire inférieure
        rig.jaw.position.set(0.05, -0.18, 0);
        rig.headGroup.add(rig.jaw);
        addMesh(new THREE.BoxGeometry(1.35, 0.34, 0.85), darkMat, rig.jaw, 0.45, -0.1, 0);
        for (let t = 0; t < 5; t++) {
            addMesh(new THREE.ConeGeometry(0.06, 0.22, 4), boneMat, rig.headGroup, 0.3 + t * 0.2, -0.24, 0.4, Math.PI, 0, 0);
            addMesh(new THREE.ConeGeometry(0.06, 0.22, 4), boneMat, rig.headGroup, 0.3 + t * 0.2, -0.24, -0.4, Math.PI, 0, 0);
            addMesh(new THREE.ConeGeometry(0.06, 0.2, 4), boneMat, rig.jaw, 0.35 + t * 0.2, 0.12, 0.35);
            addMesh(new THREE.ConeGeometry(0.06, 0.2, 4), boneMat, rig.jaw, 0.35 + t * 0.2, 0.12, -0.35);
        }

        // 4. Bras / Pattes avant griffues
        [-0.65, 0.65].forEach(z => {
            const arm = new THREE.Group();
            arm.position.set(0.9, -0.1, z);
            addMesh(new THREE.BoxGeometry(0.5, 1.2, 0.45), darkMat, arm, 0, -0.55, 0);
            addMesh(new THREE.BoxGeometry(0.55, 0.25, 0.5), boneMat, arm, 0.1, -1.15, 0);
            rig.torso.add(arm);
            rig.arms.push(arm);
        });

        // 5. Queue de Dragon à pointe barbelée (4 segments)
        let parentTail = rig.torso;
        for (let s = 0; s < 4; s++) {
            const seg = new THREE.Group();
            seg.position.set(s === 0 ? -1.2 : -0.85, s === 0 ? 0.15 : 0, 0);
            const w = 0.85 * Math.pow(0.75, s);
            addMesh(new THREE.BoxGeometry(0.95, w, w), s % 2 === 0 ? bodyMat : darkMat, seg, -0.45, 0, 0);
            parentTail.add(seg);
            rig.tailSegments.push(seg);
            parentTail = seg;
        }
        // Pointe en trident / dard caudal de dragon
        addMesh(new THREE.ConeGeometry(0.24, 0.95, 5), accentMat, parentTail, -0.9, 0, 0, 0, 0, Math.PI / 2);

        // 6. Pattes arrière puissantes
        [-0.68, 0.68].forEach(z => {
            const leg = new THREE.Group();
            leg.position.set(-0.25, 0, z);
            addMesh(new THREE.BoxGeometry(0.8, 1.25, 0.6), bodyMat, leg, 0, -0.55, 0);
            addMesh(new THREE.BoxGeometry(0.55, 1.15, 0.48), darkMat, leg, -0.1, -1.5, 0);
            addMesh(new THREE.BoxGeometry(0.85, 0.3, 0.6), boneMat, leg, 0.2, -2.1, 0);
            hips.add(leg);
            rig.legs.push(leg);
        });
    },

    // Animation d'attente (idle) / vol stationnaire / marche
    animateIdle(ctx) {
        const { rig, time, isWalk, baseHipsY } = ctx;
        const freq = isWalk ? 10 : 3.2;

        rig.hips.position.y = baseHipsY + Math.sin(time * freq) * (isWalk ? 0.25 : 0.12);
        rig.torso.rotation.z = Math.sin(time * 2.5) * 0.05;
        rig.jaw.rotation.z = -0.12 - Math.abs(Math.sin(time * 2)) * 0.15;

        // Battement des ailes draconiques
        const wingFlap = Math.sin(time * (isWalk ? 9 : 4.5)) * 0.45;
        if (rig.specialParts.leftWing) rig.specialParts.leftWing.rotation.x = -wingFlap;
        if (rig.specialParts.rightWing) rig.specialParts.rightWing.rotation.x = wingFlap;

        if (rig.legs && rig.legs.length >= 2) {
            rig.legs[0].rotation.z = isWalk ? Math.sin(time * freq) * 0.5 : 0;
            rig.legs[1].rotation.z = isWalk ? -Math.sin(time * freq) * 0.5 : 0;
        }

        rig.tailSegments.forEach((seg, i) => {
            seg.rotation.y = Math.sin(time * 3.5 - i * 0.5) * 0.18;
        });
    },

    hasCustomDirectionals: true,

    // Animations d'attaques
    animateAttack(ctx) {
        const { rig, act, swing, prog, baseHipsY } = ctx;

        // Déploiement spectaculaire des ailes
        if (rig.specialParts.leftWing) rig.specialParts.leftWing.rotation.x = -0.7 - swing * 0.6;
        if (rig.specialParts.rightWing) rig.specialParts.rightWing.rotation.x = 0.7 + swing * 0.6;

        if (act === 'light') {
            // Coup de griffe gauche fulgurant
            rig.torso.rotation.z = -swing * 0.4;
            if (rig.arms[0]) rig.arms[0].rotation.z = swing * 1.25;
            rig.jaw.rotation.z = -swing * 0.65;
        } else if (act === 'light2') {
            // Coup de griffe droite croisé
            rig.torso.rotation.z = swing * 0.4;
            if (rig.arms[1]) rig.arms[1].rotation.z = swing * 1.25;
            rig.jaw.rotation.z = -swing * 0.7;
        } else if (act === 'fwd_light') {
            // Ruée ailée et encornement perforant
            rig.hips.position.x = swing * 0.9;
            rig.headGroup.rotation.z = -swing * 0.45;
            rig.jaw.rotation.z = -swing * 0.55;
        } else if (act === 'low_light' || act === 'low_heavy') {
            // Direction BAS ⬇️ (Balayage bas) : Balayage caudal bas avec dard en trident
            rig.hips.position.y = baseHipsY - swing * 0.35;
            rig.tailSegments.forEach(s => { s.rotation.y = -swing * 0.85; });
        } else if (act === 'anti_air' || act === 'up_light') {
            // Direction HAUT ⬆️ (Anti-Air Launcher / Ciel) : Rugissement enflammé vers le ciel et griffes ascendantes
            rig.torso.rotation.z = swing * 0.6;
            rig.headGroup.rotation.z = swing * 0.7;
            rig.jaw.rotation.z = -swing * 1.0;
            if (rig.arms[0]) rig.arms[0].rotation.z = -swing * 1.5;
        } else if (act === 'back_light') {
            // Direction ARRIÈRE ⬅️ : Battement d'ailes en recul et griffe protectrice
            rig.hips.position.x = -s * 0.8;
            if (rig.arms[0]) rig.arms[0].rotation.z = s * 1.1;
        } else if (act === 'air_light' || act === 'air_heavy') {
            // Plongeon piqué et écrasement des serres
            rig.torso.rotation.z = -swing * 0.7;
            rig.legs.forEach(l => { l.rotation.z = swing * 1.1; });
        } else if (act === 'fwd_heavy') {
            // Charge infernale ailes déployées
            rig.hips.position.x = swing * 1.2;
            rig.torso.rotation.z = -swing * 0.5;
            if (rig.arms[0]) rig.arms[0].rotation.z = swing * 1.4;
            if (rig.arms[1]) rig.arms[1].rotation.z = swing * 1.4;
        } else if (act === 'throw') {
            // Enveloppement des ailes et souffle de flammes à bout portant
            if (rig.specialParts.leftWing) rig.specialParts.leftWing.rotation.x = 0.5;
            if (rig.specialParts.rightWing) rig.specialParts.rightWing.rotation.x = -0.5;
            rig.jaw.rotation.z = -0.85;
        } else if (act === 'throw_whiff') {
            rig.hips.position.x = swing * 0.4;
            rig.jaw.rotation.z = -0.3;
        } else if (act === 'heavy') {
            // Tourbillon de queue et bourrasque d'ailes
            rig.hips.rotation.y = prog * Math.PI * 2;
            rig.tailSegments.forEach(s => { s.rotation.y = 0.45; });
        } else if (act === 'special' || act === 'special2') {
            // Rejet de la tête en arrière puis projection du souffle de flammes
            rig.torso.rotation.z = swing * 0.4;
            rig.headGroup.rotation.z = -0.3 + swing * 0.7;
            rig.jaw.rotation.z = -0.85;
        } else {
            rig.torso.rotation.z = swing * 0.3;
        }
    },

    // Chorégraphie de la Fatalité 3D
    animateFatality(ctx) {
        const { rig, prog } = ctx;
        if (prog < 0.35) {
            rig.hips.position.y = 2.8;
            rig.torso.rotation.z = 0.3;
            if (rig.specialParts.leftWing) rig.specialParts.leftWing.rotation.x = -1.1;
            if (rig.specialParts.rightWing) rig.specialParts.rightWing.rotation.x = 1.1;
        } else if (prog < 0.75) {
            rig.hips.position.y = 1.8;
            rig.headGroup.rotation.z = -0.55;
            rig.jaw.rotation.z = -0.9;
        } else {
            rig.hips.position.y = 2.1;
            rig.headGroup.rotation.z = 0.6;
            rig.jaw.rotation.z = -0.75;
        }
    },

    // Script d'exécution de la fatalité draconique
    executeFatality(winner, loser) {
        setTimeout(() => {
            if (matchState !== 'fatality_anim') return;
            sfx.playRoar(45, 1.1);
            spawnFloatingPopup(loser.x, 'SOUFFLE INFERNAL !', '#f97316');
            spawn3DBloodAndBones(loser.x, 2.2, 45, true);
        }, 900);

        setTimeout(() => {
            if (matchState !== 'fatality_anim') return;
            sfx.playBoneCrack();
            sfx.playHit(true);
            loser.flattened = true;
            loser.isDead = true;
            loser.hp = 0;
            spawn3DBloodAndBones(loser.x, 0.8, 85, true);
            screenShake = 1.2;
            showAnnouncer('FATALITY !', 'DRAK\'ZUL RÉDUIT SA PROIE EN CENDRES');
        }, 2200);
    }
});
