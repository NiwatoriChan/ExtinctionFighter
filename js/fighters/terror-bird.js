/* ============================================================================
 * COMBATTANT : OISEAU DE TERREUR (Phorusrhacos Longissimus)
 * Données (stats, skins, textes), modèle 3D, animations, coups spéciaux & fatalité.
 * ============================================================================ */

registerFighter({
    id: 'terabird',
    name: 'OISEAU DE TERREUR',
    fullName: 'Phorusrhacos Longissimus',
    role: 'Faucheur Véloce',
    title: '« La Hache Plumée du Miocène »',
    primaryColor: 0xea580c,
    secondaryColor: 0x9a3412,
    accentColor: 0xfacc15,
    cssPrimary: '#ea580c',
    scale: 0.88,
    stats: { pow: 92, spd: 98, def: 68 },
    maxHp: 920,
    walkSpeed: 10.4,
    special1Name: 'Pique de Hache (H)',
    special2Name: 'Foulée Furieuse (T)',
    fatalityName: 'Trépanation Sauvage (R)',
    moveStyle: 'Sprinteur hyperkinétique bipède, frappes verticales de son bec tranchant en coin.',
    fatalityDesc: 'Assène une frappe verticale d’une violence inouïe avec son bec crochu, ouvrant le crâne adverse en deux avant de déchirer les viscères.',
    skins: [
        { name: 'Terror Feather', primary: 0xea580c, secondary: 0x9a3412, accent: 0xfacc15 },
        { name: 'Snow Owl', primary: 0xf1f5f9, secondary: 0x94a3b8, accent: 0xfacc15 },
        { name: 'Raven Nightmare', primary: 0x18181b, secondary: 0x09090b, accent: 0xa855f7 },
        { name: 'Blood Falcon', primary: 0x991b1b, secondary: 0x7f1d1d, accent: 0xfca5a5 }
    ]
}, {
    // Hauteur de base du bassin utilisée par le système d'animation
    animBaseHipsY: 2.25,

    // Spécial 2 (T)
    onSpecial2(attacker, defender, dist, basePow) {
        spawn3DProjectile(attacker, 'boulder');
    },

    // Construction du modèle 3D articulé
    buildRig(ctx) {
        const { hips, rig, addMesh, bodyMat, darkMat, accentMat, boneMat, eyeMat } = ctx;
        hips.position.y = 2.25;
        // Corps d'oiseau-terreur profilé
        addMesh(new THREE.BoxGeometry(1.75, 1.15, 1.05), bodyMat, rig.torso, 0, 0.15, 0, 0, 0, 0.25);

        // Ailes griffues articulées
        [-0.58, 0.58].forEach((zOff, idx) => {
            const wing = new THREE.Group();
            wing.position.set(0.2, 0.3, zOff);
            addMesh(new THREE.BoxGeometry(1.15, 0.65, 0.12), darkMat, wing, -0.25, -0.1, 0);
            addMesh(new THREE.BoxGeometry(0.95, 0.22, 0.14), accentMat, wing, -0.3, -0.35, 0);
            rig.torso.add(wing);
            rig.arms.push(wing);
        });

        // Long cou vertical de rapace + ÉNORME BEC CROCHU
        rig.neck.position.set(0.75, 0.55, 0);
        rig.torso.add(rig.neck);
        addMesh(new THREE.BoxGeometry(0.48, 1.25, 0.48), bodyMat, rig.neck, 0.1, 0.55, 0, 0, 0, -0.12);

        rig.headGroup.position.set(0.18, 1.22, 0);
        rig.neck.add(rig.headGroup);
        addMesh(new THREE.BoxGeometry(0.72, 0.62, 0.58), bodyMat, rig.headGroup, 0.1, 0.1, 0);
        // Crête de plumes écarlates
        for (let f = 0; f < 4; f++) {
            addMesh(new THREE.ConeGeometry(0.1, 0.55, 4), accentMat, rig.headGroup, -0.15 - f * 0.1, 0.48, 0, 0, 0, 0.75);
        }
        // Bec de hache géant crochu
        addMesh(new THREE.BoxGeometry(0.95, 0.45, 0.42), boneMat, rig.headGroup, 0.72, 0.12, 0);
        addMesh(new THREE.ConeGeometry(0.22, 0.55, 4), boneMat, rig.headGroup, 1.15, -0.15, 0, 0, 0, Math.PI * 0.92);
        addMesh(new THREE.SphereGeometry(0.09, 8, 8), eyeMat, rig.headGroup, 0.25, 0.18, 0.3);
        addMesh(new THREE.SphereGeometry(0.09, 8, 8), eyeMat, rig.headGroup, 0.25, 0.18, -0.3);

        // Éventail de plumes caudales
        const tailFan = new THREE.Group();
        tailFan.position.set(-0.9, 0.15, 0);
        for (let z = -0.35; z <= 0.35; z += 0.35) {
            addMesh(new THREE.BoxGeometry(0.95, 0.15, 0.32), darkMat, tailFan, -0.45, 0.1, z, 0, z * 0.4, -0.2);
        }
        rig.torso.add(tailFan);
        rig.tailSegments.push(tailFan);

        // Longues pattes d'échassier tueur avec serres
        [-0.45, 0.45].forEach(zOff => {
            const leg = new THREE.Group();
            leg.position.set(0, 0, zOff);
            addMesh(new THREE.BoxGeometry(0.45, 1.0, 0.38), bodyMat, leg, 0, -0.45, 0);
            addMesh(new THREE.CylinderGeometry(0.12, 0.1, 1.25, 6), boneMat, leg, -0.05, -1.45, 0);
            addMesh(new THREE.BoxGeometry(0.85, 0.16, 0.42), boneMat, leg, 0.2, -2.15, 0);
            hips.add(leg);
            rig.legs.push(leg);
        });
    },

    // Animation d'attente (idle) / de marche
    animateIdle(ctx) {
        const { rig, baseHipsY, time, isWalk } = ctx;
        // Terabird : Démarche d'oiseau de proie à grands pas + battements d'ailes nerveux
        const freq = isWalk ? 15 : 5.5;
        rig.hips.position.y = baseHipsY + Math.abs(Math.sin(time * freq)) * (isWalk ? 0.32 : 0.07);
        rig.neck.rotation.z = isWalk ? -0.25 + Math.sin(time * freq * 2) * 0.15 : Math.sin(time * 8) * 0.06;
        rig.arms[0].rotation.x = -Math.abs(Math.sin(time * 6)) * 0.35;
        rig.arms[1].rotation.x = Math.abs(Math.sin(time * 6)) * 0.35;
        rig.legs[0].rotation.z = isWalk ? Math.sin(time * freq) * 0.72 : 0;
        rig.legs[1].rotation.z = isWalk ? -Math.sin(time * freq) * 0.72 : 0;
    },

    hasCustomDirectionals: true,

    // Animations d'attaques (light / heavy / special / special2 / xray)
    animateAttack(ctx) {
        const { rig, act, prog, swing, strike, baseHipsY } = ctx;
        const s = strike !== undefined ? strike : swing;
        if (act === 'light') {
            // Coup de bec hachoir gauche
            rig.neck.rotation.z = -swing * 0.75;
            rig.headGroup.rotation.z = -swing * 0.45;
            rig.jaw.rotation.z = -swing * 0.5;
        } else if (act === 'light2') {
            // Coup de bec croisé droit avec torsion
            rig.torso.rotation.y = swing * 0.35;
            rig.neck.rotation.z = -swing * 0.9;
            rig.headGroup.rotation.z = -swing * 0.55;
            rig.jaw.rotation.z = -swing * 0.7;
        } else if (act === 'fwd_light') {
            // Ruée agressive et picotement perforant
            rig.hips.position.x = swing * 0.85;
            rig.neck.rotation.z = -swing * 0.8;
            rig.arms[0].rotation.x = -0.6;
            rig.arms[1].rotation.x = 0.6;
        } else if (act === 'low_light' || act === 'low_heavy') {
            // Direction BAS ⬇️ (Balayage bas) : Balayage des serres au sol
            rig.hips.position.y = baseHipsY - swing * 0.35;
            rig.legs[0].rotation.z = swing * 1.2;
            rig.torso.rotation.z = 0.35;
        } else if (act === 'anti_air' || act === 'up_light') {
            // Direction HAUT ⬆️ (Anti-Air Launcher / Ciel) : Décollage vertical bec pointé vers le ciel et battement d'ailes
            rig.neck.rotation.z = swing * 0.85;
            rig.headGroup.rotation.z = swing * 0.6;
            rig.jaw.rotation.z = -swing * 0.8;
            rig.arms[0].rotation.x = -1.2;
            rig.arms[1].rotation.x = 1.2;
        } else if (act === 'back_light') {
            // Direction ARRIÈRE ⬅️ : Saut en arrière et frappe de bec rapide
            rig.hips.position.x = -s * 0.75;
            rig.neck.rotation.z = -s * 0.65;
            rig.jaw.rotation.z = -s * 0.55;
        } else if (act === 'air_light' || act === 'air_heavy') {
            // Plongeon serres déployées
            rig.torso.rotation.z = -swing * 0.7;
            rig.legs[0].rotation.z = swing * 1.3;
            rig.legs[1].rotation.z = swing * 1.1;
        } else if (act === 'fwd_heavy') {
            // Grand bond en avant serres en avant
            rig.hips.position.x = swing * 1.1;
            rig.hips.position.y = baseHipsY + swing * 0.8;
            rig.legs[0].rotation.z = swing * 1.2;
            rig.legs[1].rotation.z = swing * 1.0;
        } else if (act === 'throw') {
            // Saisie au bec et projection violente
            rig.neck.rotation.z = -swing * 0.95;
            rig.headGroup.rotation.y = swing * 1.2;
        } else if (act === 'throw_whiff') {
            rig.hips.position.x = swing * 0.45;
            rig.neck.rotation.z = -swing * 0.4;
        } else if (act === 'heavy' || act === 'special2') {
            // Saut de rapace toutes serres en avant
            rig.hips.position.y = baseHipsY + swing * 1.5;
            rig.torso.rotation.z = swing * 0.35;
            rig.legs[0].rotation.z = swing * 1.1;
            rig.legs[1].rotation.z = swing * 0.9;
            rig.arms[0].rotation.x = -0.85;
            rig.arms[1].rotation.x = 0.85;
        } else if (act === 'special') {
            // Plongeon Guillotine Aviaire
            rig.hips.position.y = baseHipsY + Math.sin(prog * Math.PI) * 1.8;
            rig.neck.rotation.z = -swing * 0.95;
            rig.arms[0].rotation.x = -1.1;
            rig.arms[1].rotation.x = 1.1;
        }
    },

    // Chorégraphie 3D de la fatalité
    animateFatality(ctx) {
        const { rig, prog, baseHipsY } = ctx;
        // TERABIRD : Bondit sur la victime et martèle 4 coups de bec avant d'arracher son cœur
        if (prog < 0.3) {
            rig.hips.position.y = baseHipsY + Math.sin((prog / 0.3) * Math.PI) * 2.5;
            rig.arms[0].rotation.x = -1.2;
            rig.arms[1].rotation.x = 1.2;
        } else if (prog < 0.78) {
            rig.neck.rotation.z = -Math.abs(Math.sin(prog * 38)) * 1.05;
        } else {
            rig.torso.rotation.z = 0.35;
            rig.neck.rotation.z = 0.45;
            rig.arms[0].rotation.x = -1.1;
            rig.arms[1].rotation.x = 1.1;
        }
    },

    // Script de la fatalité (sons, sang, effets, annonce)
    executeFatality(winner, loser) {
        // 6) TERABIRD : Martèle 4 coups de bec rapides puis arrache le cœur battant 3D
        [900, 1250, 1600].forEach(delay => {
            setTimeout(() => {
                if (matchState !== 'fatality_anim') return;
                sfx.playHit(true);
                spawn3DBloodAndBones(loser.x, 2.1, 18, false);
            }, delay);
        });
        setTimeout(() => {
            if (matchState !== 'fatality_anim') return;
            sfx.playBoneCrack();
            sfx.playRoar(130, 0.7);
            loser.isDead = true;
            loser.hp = 0;
            // Cœur 3D arraché au bout du bec
            const heart = new THREE.Mesh(
                new THREE.SphereGeometry(0.38, 10, 10),
                new THREE.MeshStandardMaterial({ color: 0xdc2626, emissive: 0x991b1b })
            );
            heart.position.set(winner.x + winner.facing * 1.3, 3.8, 0);
            fxGroup.add(heart);
            particles3D.push({ mesh: heart, vx: 0, vy: 1.2, vz: 0, life: 1.5 });

            spawn3DBloodAndBones(loser.x, 2.3, 65, true);
            screenShake = 0.85;
            showAnnouncer('FATALITY !', 'CŒUR ARRACHÉ PAR LE TERABIRD');
        }, 2100);
    },
});
