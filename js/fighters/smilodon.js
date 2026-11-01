/* ============================================================================
 * COMBATTANT : SMILODON (Smilodon Fatalis - Tigre à Dents de Sabre)
 * Personnage Secret Déblocable en remportant le Mode Campagne d'Extinction !
 * Félin musclé du Pléistocène avec canines sabres géantes, bonds féroces et fatalité d'égorgement.
 * ============================================================================ */

registerFighter({
    id: 'smilodon',
    name: 'SMILODON',
    fullName: 'Smilodon Fatalis',
    role: 'Félin Préhistorique',
    title: '« La Terreur Glaciaire du Pléistocène »',
    primaryColor: 0xd97706,
    secondaryColor: 0x78350f,
    accentColor: 0xfef08a,
    cssPrimary: '#f59e0b',
    scale: 1.02,
    stats: { pow: 92, spd: 94, def: 78 },
    maxHp: 1000,
    walkSpeed: 8.8,
    special1Name: 'Bond Prédateur (H)',
    special2Name: 'Morsure Mortelle (T)',
    fatalityName: 'Égorgement Fatal (R)',
    moveStyle: 'Démarche féline musclée, bonds fulgurants, griffes rétractiles et crocs sabres dévastateurs.',
    fatalityDesc: 'Plaque sauvagement la victime au sol, rugit à pleins poumons et transperce la gorge avec ses canines sabres colossales.',
    isUnlockable: true,
    skins: [
        { name: 'Pleistocene Gold', primary: 0xd97706, secondary: 0x78350f, accent: 0xfef08a },
        { name: 'Arctic Ghost', primary: 0xe2e8f0, secondary: 0x64748b, accent: 0x38bdf8 },
        { name: 'Shadow Stalker', primary: 0x18181b, secondary: 0x09090b, accent: 0xef4444 },
        { name: 'Saber Blood', primary: 0x991b1b, secondary: 0x450a0a, accent: 0xfbbf24 }
    ]
}, {
    animBaseHipsY: 1.55,
    attackReach: 3.55,

    // Spécial 1 (H) : Bond Prédateur (saut félin fulgurant en avant)
    onSpecial(attacker, defender, dist, basePow) {
        sfx.playRoar(110, 0.4);
        attacker.vx = attacker.facing * 22;
        if (dist < 4.8) {
            applyDamage(attacker, defender, Math.round(basePow * 1.05), true, 'BOND PRÉDATEUR !');
            spawn3DBloodAndBones(defender.x, 1.8, 18, false);
            screenShake = 0.4;
        }
    },

    // Spécial 2 (T) : Morsure Mortelle aux crocs sabres perforants
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

    // Construction du modèle 3D articulé du Smilodon
    buildRig(ctx) {
        const { hips, rig, addMesh, bodyMat, darkMat, accentMat, boneMat, eyeMat } = ctx;
        hips.position.y = 1.55;

        // 1. Torse félin puissant et arqué avec épaules colossales
        // Cage thoracique profonde et musclée
        addMesh(new THREE.BoxGeometry(2.1, 1.25, 1.18), bodyMat, rig.torso, 0, 0.12, 0);
        // Garrot / bosse musculaire imposante des épaules (propre au Smilodon)
        addMesh(new THREE.BoxGeometry(1.2, 0.45, 1.14), darkMat, rig.torso, 0.4, 0.62, 0);
        // Plastron ventral et pelage intérieur plus clair
        addMesh(new THREE.BoxGeometry(1.85, 0.28, 0.98), accentMat, rig.torso, 0.05, -0.42, 0);

        // Bandes / rosettes de prédateur sur le dos
        for (let i = 0; i < 5; i++) {
            addMesh(new THREE.BoxGeometry(0.18, 0.12, 1.19), darkMat, rig.torso, -0.6 + i * 0.32, 0.58, 0);
        }

        // 2. Cou félin trapu et puissant
        rig.neck.position.set(1.05, 0.32, 0);
        rig.torso.add(rig.neck);
        addMesh(new THREE.BoxGeometry(0.72, 0.78, 0.88), bodyMat, rig.neck, 0.15, 0.08, 0, 0, 0, 0.25);

        // 3. Tête féline large avec oreilles et canines sabres géantes
        rig.headGroup.position.set(0.48, 0.28, 0);
        rig.neck.add(rig.headGroup);
        // Crâne supérieur
        addMesh(new THREE.BoxGeometry(1.1, 0.68, 0.84), bodyMat, rig.headGroup, 0.35, 0.12, 0);
        // Museau musclé
        addMesh(new THREE.BoxGeometry(0.75, 0.46, 0.72), darkMat, rig.headGroup, 0.76, 0.02, 0);
        // Truffe féline
        addMesh(new THREE.BoxGeometry(0.2, 0.15, 0.32), darkMat, rig.headGroup, 1.15, 0.12, 0);

        // Oreilles félines pointues
        addMesh(new THREE.ConeGeometry(0.14, 0.38, 4), darkMat, rig.headGroup, -0.05, 0.52, 0.34, 0, 0, -0.2);
        addMesh(new THREE.ConeGeometry(0.14, 0.38, 4), darkMat, rig.headGroup, -0.05, 0.52, -0.34, 0, 0, -0.2);

        // Yeux perçants de fauve prédateur
        addMesh(new THREE.SphereGeometry(0.09, 8, 8), eyeMat, rig.headGroup, 0.42, 0.22, 0.43);
        addMesh(new THREE.SphereGeometry(0.09, 8, 8), eyeMat, rig.headGroup, 0.42, 0.22, -0.43);

        // --- LES EMBLÉMATIQUES CANINES SABRES DU SMILODON ---
        // Deux gigantesques crocs recourbés s'étendant bien au-dessous de la mâchoire inférieure
        // Canines longues en ivoire étincelant (accentMat / boneMat)
        addMesh(new THREE.ConeGeometry(0.09, 0.88, 6), boneMat, rig.headGroup, 0.76, -0.38, 0.30, 0.12, 0, 0.22);
        addMesh(new THREE.ConeGeometry(0.09, 0.88, 6), boneMat, rig.headGroup, 0.76, -0.38, -0.30, -0.12, 0, 0.22);

        // Petites incisives supérieures
        for (let t = -1; t <= 1; t++) {
            addMesh(new THREE.ConeGeometry(0.04, 0.16, 4), boneMat, rig.headGroup, 0.95, -0.18, t * 0.12, Math.PI, 0, 0);
        }

        // 4. Mâchoire inférieure articulée (avec bride mentonnière caractéristique)
        rig.jaw.position.set(0.15, -0.16, 0);
        rig.headGroup.add(rig.jaw);
        addMesh(new THREE.BoxGeometry(0.92, 0.24, 0.64), darkMat, rig.jaw, 0.48, -0.08, 0);
        // Brides mentonnières protectrices du Smilodon
        addMesh(new THREE.BoxGeometry(0.3, 0.32, 0.66), bodyMat, rig.jaw, 0.65, -0.22, 0);
        // Dents inférieures
        addMesh(new THREE.ConeGeometry(0.05, 0.22, 4), boneMat, rig.jaw, 0.72, 0.14, 0.22);
        addMesh(new THREE.ConeGeometry(0.05, 0.22, 4), boneMat, rig.jaw, 0.72, 0.14, -0.22);

        // 5. Courte queue caractéristique du Smilodon (bobtail musclé)
        let pTail = rig.torso;
        for (let s = 0; s < 3; s++) {
            const seg = new THREE.Group();
            seg.position.set(s === 0 ? -1.05 : -0.38, s === 0 ? 0.05 : -0.05, 0);
            const w = 0.38 * Math.pow(0.8, s);
            addMesh(new THREE.BoxGeometry(0.42, w, w), s === 2 ? darkMat : bodyMat, seg, -0.18, 0, 0);
            pTail.add(seg);
            rig.tailSegments.push(seg);
            pTail = seg;
        }

        // 6. Quatre pattes félines puissantes (membres antérieurs exceptionnellement massifs)
        [
            // Pattes avant (droite & gauche) : très robustes pour plaquer les proies
            { x: 0.85, z: -0.62, h: 1.35, isFront: true },
            { x: 0.85, z: 0.62, h: 1.35, isFront: true },
            // Pattes arrière : puissants jarrets félins propulseurs
            { x: -0.82, z: -0.58, h: 1.30, isFront: false },
            { x: -0.82, z: 0.58, h: 1.30, isFront: false }
        ].forEach((pos, idx) => {
            const leg = new THREE.Group();
            leg.position.set(pos.x, -0.05, pos.z);
            // Cuisse / bras musclé
            addMesh(new THREE.BoxGeometry(pos.isFront ? 0.48 : 0.44, pos.h * 0.55, 0.46), idx % 2 === 0 ? bodyMat : darkMat, leg, 0, -pos.h * 0.25, 0);
            // Jarret / avant-bras
            addMesh(new THREE.BoxGeometry(pos.isFront ? 0.42 : 0.38, pos.h * 0.5, 0.40), darkMat, leg, 0.02, -pos.h * 0.7, 0);
            // Patte large avec coussinets et griffes d'ivoire acérées
            const paw = addMesh(new THREE.BoxGeometry(0.56, 0.22, 0.48), accentMat, leg, 0.12, -pos.h * 0.95, 0);
            for (let c = -1; c <= 1; c++) {
                addMesh(new THREE.ConeGeometry(0.04, 0.18, 4), boneMat, paw, 0.28, -0.02, c * 0.14, 0, 0, -Math.PI / 2);
            }
            hips.add(leg);
            rig.legs.push(leg);
        });
    },

    // Animation d'attente (idle) & de marche féline
    animateIdle(ctx) {
        const { rig, baseHipsY, time, isWalk } = ctx;
        const freq = isWalk ? 11 : 3.8;

        // Souplesse féline : ondulation du bassin et respiration
        rig.hips.position.y = baseHipsY + Math.sin(time * freq) * (isWalk ? 0.14 : 0.05);
        rig.torso.rotation.y = isWalk ? Math.sin(time * freq * 0.5) * 0.10 : 0;
        rig.torso.rotation.z = Math.sin(time * 2.8) * 0.04;

        // Grognement félin : légers mouvements des mâchoires dévoilant les crocs sabres
        rig.jaw.rotation.z = -0.08 - Math.abs(Math.sin(time * 3.2)) * 0.18;

        // Marche féline au pas diagonal
        if (rig.legs && rig.legs.length >= 4) {
            const swingL = isWalk ? Math.sin(time * freq) * 0.55 : 0;
            rig.legs[0].rotation.z = swingL;   // Avant-Gauche
            rig.legs[3].rotation.z = swingL;   // Arrière-Droit
            rig.legs[1].rotation.z = -swingL;  // Avant-Droit
            rig.legs[2].rotation.z = -swingL;  // Arrière-Gauche
        }

        // Frémissement de la courte queue de Smilodon
        rig.tailSegments.forEach((seg, i) => {
            seg.rotation.y = Math.sin(time * 8 - i * 0.8) * 0.35;
        });
    },

    // Animations des différentes attaques
    animateAttack(ctx) {
        const { rig, act, swing, prog, baseHipsY } = ctx;

        if (act === 'light') {
            // Coup de patte griffu foudroyant
            rig.torso.rotation.z = -swing * 0.42;
            if (rig.legs[0]) rig.legs[0].rotation.z = swing * 1.35;
            rig.headGroup.rotation.z = -swing * 0.35;
            rig.jaw.rotation.z = -swing * 0.65;
        } else if (act === 'heavy') {
            // Double bond percutant avec les deux pattes avant
            rig.hips.position.y = baseHipsY + swing * 0.55;
            rig.torso.rotation.z = swing * 0.5;
            if (rig.legs[0]) rig.legs[0].rotation.z = swing * 1.1;
            if (rig.legs[1]) rig.legs[1].rotation.z = swing * 1.1;
            rig.jaw.rotation.z = -swing * 0.95;
        } else if (act === 'special') {
            // Bond Prédateur : arc aérien majestueux toutes griffes dehors
            rig.hips.position.y = baseHipsY + swing * 0.85;
            rig.torso.rotation.z = -0.2 + swing * 0.4;
            if (rig.legs[0]) rig.legs[0].rotation.z = 0.9;
            if (rig.legs[1]) rig.legs[1].rotation.z = 0.9;
            rig.jaw.rotation.z = -1.0;
        } else if (act === 'special2') {
            // Morsure Mortelle : ouverture à 110° des mâchoires puis projection des sabres
            rig.hips.position.x = swing * 0.85;
            rig.headGroup.rotation.z = -0.4 + swing * 0.8;
            rig.jaw.rotation.z = -1.25 * swing;
        } else {
            rig.torso.rotation.z = swing * 0.3;
        }
    },

    // Chorégraphie 3D de la fatalité
    animateFatality(ctx) {
        const { rig, prog, baseHipsY } = ctx;

        if (prog < 0.30) {
            // Phase 1 : Bondissement sur la poitrine de la victime
            rig.hips.position.y = baseHipsY + 0.9;
            rig.torso.rotation.z = 0.45;
            rig.jaw.rotation.z = -0.6;
        } else if (prog < 0.70) {
            // Phase 2 : Placage au sol, relèvement de la tête et ouverture maximale des mâchoires sabres
            rig.hips.position.y = baseHipsY * 0.65;
            rig.headGroup.rotation.z = -0.75;
            rig.jaw.rotation.z = -1.45; // Ouverture colossale à 120° propre au Smilodon
        } else {
            // Phase 3 : Enfoncement brutal des canines sabres dans le cou
            rig.hips.position.y = baseHipsY * 0.55;
            rig.headGroup.rotation.z = 0.85;
            rig.jaw.rotation.z = -0.25;
        }
    },

    // Exécution sonore et visuelle de la fatalité
    executeFatality(winner, loser) {
        setTimeout(() => {
            if (matchState !== 'fatality_anim') return;
            sfx.playRoar(75, 0.9);
            sfx.playHit(true);
            spawnFloatingPopup(loser.x, '🐯 PLACAGE SAUVAGE !', '#f59e0b');
            spawn3DBloodAndBones(loser.x, 1.6, 25, true);
        }, 800);

        setTimeout(() => {
            if (matchState !== 'fatality_anim') return;
            sfx.playBoneCrack();
            sfx.playHit(true);
            spawnFloatingPopup(loser.x, '🩸 CANINES SABRES ENFONCÉES !', '#ef4444');
            spawn3DBloodAndBones(loser.x, 1.2, 55, true);
            screenShake = 0.85;
        }, 1600);

        setTimeout(() => {
            if (matchState !== 'fatality_anim') return;
            sfx.playBoneCrack();
            sfx.playRoar(60, 1.0);
            loser.decapitated = true;
            loser.isDead = true;
            loser.hp = 0;
            spawn3DBloodAndBones(loser.x, 1.0, 90, true);
            screenShake = 1.2;
            showAnnouncer('FATALITY !', 'ÉGORGEMENT FATAL DU SMILODON');
        }, 2400);
    }
});
