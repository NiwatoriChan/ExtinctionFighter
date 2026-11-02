/* ============================================================================
 * COMBATTANT : MÉGATHÉRIUM (Megatherium Americanum)
 * Données (stats, skins, textes), modèle 3D, animations, coups spéciaux & fatalité.
 * ============================================================================ */

registerFighter({
    id: 'giantsloth',
    name: 'MÉGATHÉRIUM',
    fullName: 'Megatherium Americanum',
    role: 'Paresseux Géant Béhémoth',
    title: '« La Force Brute du Pléistocène »',
    primaryColor: 0x854d0e,
    secondaryColor: 0x543209,
    accentColor: 0xfacc15,
    cssPrimary: '#854d0e',
    scale: 1.08,
    stats: { pow: 96, spd: 70, def: 93 },
    maxHp: 1180,
    walkSpeed: 7.4,
    special1Name: 'Griffes Béhémoth (H)',
    special2Name: 'Écrasement Pectoral (T)',
    fatalityName: 'Étreinte Annihilatrice (R)',
    moveStyle: 'Posture bipède colossale et voûtée, revers de pattes herculéennes armées de griffes recourbées.',
    fatalityDesc: 'Enserre le torse de la victime dans ses avant-bras colossaux, brise la cage thoracique en deux dans une étreinte fatale avant de l’écraser au sol.',
    skins: [
        { name: 'Pleistocene Grizzly', primary: 0x854d0e, secondary: 0x543209, accent: 0xfacc15 },
        { name: 'Mammoth Fur', primary: 0xe2e8f0, secondary: 0x94a3b8, accent: 0x93c5fd },
        { name: 'Obsidian Behemoth', primary: 0x27272a, secondary: 0x18181b, accent: 0xf97316 },
        { name: 'Moss Covered', primary: 0x3f6212, secondary: 0x1a2e05, accent: 0x65a30d }
    ]
}, {
    // Hauteur de base du bassin utilisée par le système d'animation
    animBaseHipsY: 1.85,

    // Spécial 2 (T)
    onSpecial2(attacker, defender, dist, basePow) {
        special2SeismicQuake(attacker, defender, dist, basePow);
    },

    // Construction du modèle 3D articulé
    buildRig(ctx) {
        const { hips, rig, addMesh, bodyMat, darkMat, boneMat, eyeMat } = ctx;
        // MÉGATHÉRIUM : Paresseux géant colossal à l'allure de grizzly préhistorique armé de serres
        hips.position.y = 1.85;
        // Bassin gigantesque et torse herculéen trapu
        addMesh(new THREE.BoxGeometry(2.1, 1.7, 1.5), bodyMat, rig.torso, 0, 0.3, 0, 0, 0, 0.35);
        addMesh(new THREE.BoxGeometry(1.7, 1.4, 1.55), darkMat, rig.torso, -0.15, 0.2, 0, 0, 0, 0.35);

        // Cou trapu & tête massive arrondie à museau émoussé
        rig.neck.position.set(0.7, 0.95, 0);
        rig.torso.add(rig.neck);
        addMesh(new THREE.BoxGeometry(0.65, 0.7, 0.75), bodyMat, rig.neck, 0.2, 0.2, 0);

        rig.headGroup.position.set(0.35, 0.35, 0);
        rig.neck.add(rig.headGroup);
        addMesh(new THREE.BoxGeometry(0.85, 0.65, 0.7), darkMat, rig.headGroup, 0.25, 0.05, 0);
        addMesh(new THREE.BoxGeometry(0.45, 0.4, 0.5), bodyMat, rig.headGroup, 0.68, -0.05, 0); // Museau
        addMesh(new THREE.SphereGeometry(0.08, 8, 8), eyeMat, rig.headGroup, 0.4, 0.18, 0.36);
        addMesh(new THREE.SphereGeometry(0.08, 8, 8), eyeMat, rig.headGroup, 0.4, 0.18, -0.36);

        // Bras gigantesques aux griffes courbées terrifiantes
        [-0.85, 0.85].forEach(z => {
            const arm = new THREE.Group();
            arm.position.set(0.65, 0.6, z);
            // Avant-bras puissant
            addMesh(new THREE.BoxGeometry(0.95, 0.45, 0.42), darkMat, arm, 0.4, -0.25, 0, 0, 0, -0.4);
            // 3 Grandes griffes recourbées de 35 cm pour déraciner les arbres
            [-0.14, 0, 0.14].forEach(cz => {
                const claw = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.85, 5), boneMat);
                claw.position.set(0.95, -0.65, cz);
                claw.rotation.z = -1.9;
                claw.rotation.x = (cz > 0 ? 0.2 : -0.2);
                arm.add(claw);
            });
            rig.torso.add(arm);
            rig.arms.push(arm);
        });

        // Queue robuste formant un trépied d'appui au sol
        let pTail = rig.torso;
        for (let s = 0; s < 3; s++) {
            const seg = new THREE.Group();
            seg.position.set(s === 0 ? -1.0 : -0.65, s === 0 ? -0.15 : -0.1, 0);
            addMesh(new THREE.BoxGeometry(0.7, 0.65 - s * 0.12, 0.65 - s * 0.12), darkMat, seg, -0.3, 0, 0);
            pTail.add(seg);
            rig.tailSegments.push(seg);
            pTail = seg;
        }

        // Pattes arrière colonnaires ultra-stables
        [-0.65, 0.65].forEach(z => {
            const leg = new THREE.Group();
            leg.position.set(-0.25, 0, z);
            addMesh(new THREE.BoxGeometry(0.75, 1.15, 0.65), bodyMat, leg, 0, -0.5, 0);
            addMesh(new THREE.BoxGeometry(0.85, 0.4, 0.75), darkMat, leg, 0.1, -1.25, 0);
            hips.add(leg);
            rig.legs.push(leg);
        });
    },

    // Animation d'attente (idle) / de marche
    animateIdle(ctx) {
        const { rig, baseHipsY, time, isWalk } = ctx;
        // Mégathérium : Balancement pesant de grizzly avec serres repliées
        const freq = isWalk ? 6.5 : 2.0;
        rig.hips.position.y = baseHipsY + Math.abs(Math.sin(time * freq)) * (isWalk ? 0.12 : 0.04);
        rig.torso.rotation.y = Math.sin(time * 2.2) * 0.15;
        rig.arms[0].rotation.y = 0.3 + Math.sin(time * 3) * 0.15;
        rig.arms[1].rotation.y = -0.3 - Math.sin(time * 3) * 0.15;
        rig.legs[0].rotation.z = isWalk ? Math.sin(time * freq) * 0.42 : 0;
        rig.legs[1].rotation.z = isWalk ? -Math.sin(time * freq) * 0.42 : 0;
    },

    hasCustomDirectionals: true,

    // Animations d'attaques (light / heavy / special / special2 / xray)
    animateAttack(ctx) {
        const { rig, act, swing, baseHipsY } = ctx;
        if (act === 'light') {
            rig.arms[0].rotation.z = -swing * 1.3;
            rig.arms[0].rotation.y = swing * 0.65;
            rig.torso.rotation.y = swing * 0.35;
        } else if (act === 'light2') {
            rig.arms[1].rotation.z = -swing * 1.3;
            rig.arms[1].rotation.y = -swing * 0.65;
            rig.torso.rotation.y = -swing * 0.35;
        } else if (act === 'fwd_light') {
            rig.hips.position.x = swing * 0.75;
            rig.arms[0].rotation.z = -swing * 1.2;
            rig.torso.rotation.z = -0.25;
        } else if (act === 'low_light' || act === 'low_heavy') {
            // Direction BAS ⬇️ (Balayage bas) : Griffes massives rasant le sol
            rig.hips.position.y = baseHipsY - swing * 0.4;
            rig.arms[0].rotation.z = -swing * 1.5;
            rig.torso.rotation.z = 0.25;
        } else if (act === 'anti_air' || act === 'up_light') {
            // Direction HAUT ⬆️ (Anti-Air Launcher / Ciel) : Griffes de béhémoth projetées vers le ciel
            rig.arms[0].rotation.z = -swing * 1.8;
            rig.arms[1].rotation.z = -swing * 1.8;
            rig.torso.rotation.z = swing * 0.45;
        } else if (act === 'back_light') {
            // Direction ARRIÈRE ⬅️ : Garde lourde en recul et revers de griffe
            rig.hips.position.x = -swing * 0.7;
            rig.arms[0].rotation.z = -swing * 1.1;
        } else if (act === 'air_light' || act === 'air_heavy') {
            rig.torso.rotation.z = -swing * 0.5;
            rig.arms[0].rotation.z = -swing * 1.6;
            rig.arms[1].rotation.z = -swing * 1.6;
        } else if (act === 'fwd_heavy') {
            rig.hips.position.x = swing * 1.1;
            rig.torso.rotation.z = -swing * 0.4;
            rig.arms[0].rotation.z = -swing * 1.5;
            rig.arms[1].rotation.z = -swing * 1.5;
        } else if (act === 'throw') {
            rig.arms[0].rotation.y = swing * 1.4;
            rig.arms[1].rotation.y = -swing * 1.4;
            rig.torso.rotation.z = swing * 0.35;
        } else if (act === 'throw_whiff') {
            rig.hips.position.x = swing * 0.35;
            rig.arms[0].rotation.y = swing * 0.6;
            rig.arms[1].rotation.y = -swing * 0.6;
        } else if (act === 'heavy') {
            rig.torso.rotation.z = -swing * 0.45;
            rig.arms[0].rotation.z = -swing * 1.45;
            rig.arms[1].rotation.z = -swing * 1.45;
        } else if (act === 'special') {
            rig.hips.position.y = baseHipsY + swing * 0.65;
            rig.torso.rotation.z = 0.35 - swing * 0.75;
        } else if (act === 'special2') {
            rig.arms[0].rotation.y = swing * 1.35;
            rig.arms[1].rotation.y = -swing * 1.35;
        }
    },

    // Chorégraphie 3D de la fatalité
    animateFatality(ctx) {
        const { rig, prog } = ctx;
        rig.arms[0].rotation.y = 1.25;
        rig.arms[1].rotation.y = -1.25;
        rig.torso.rotation.z = Math.sin(prog * Math.PI * 4) * 0.35;
    },

    // Script de la fatalité (sons, sang, effets, annonce)
    executeFatality(winner, loser) {
        // 13) MÉGATHÉRIUM : Étreinte colossale broyant les côtes et piétinement
        setTimeout(() => {
            if (matchState !== 'fatality_anim') return;
            sfx.playBoneCrack();
            spawn3DBloodAndBones(loser.x, 2.2, 45, true);
            spawnFloatingPopup(loser.x, 'ÉTREINTE BÉHÉMOTH !', '#ca8a04');
        }, 950);
        setTimeout(() => {
            if (matchState !== 'fatality_anim') return;
            sfx.playBoneCrack();
            sfx.playRoar(50, 0.9);
            loser.flattened = true;
            loser.isDead = true;
            loser.hp = 0;
            spawn3DBloodAndBones(loser.x, 0.8, 85, true);
            screenShake = 1.0;
            showAnnouncer('FATALITY !', 'ÉTREINTE ANNIHILATRICE DU MÉGATHÉRIUM');
        }, 2200);
    },
});
