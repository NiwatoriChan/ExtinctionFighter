/* ============================================================================
 * COMBATTANT : PACHYRHINOSAURE (Pachyrhinosaurus)
 * Données (stats, skins, textes), modèle 3D, animations, coups spéciaux & fatalité.
 * ============================================================================ */

registerFighter({
    id: 'pachyrhino',
    name: 'PACHYRHINOSAURE',
    fullName: 'Pachyrhinosaurus',
    role: 'Bélier Blindé',
    title: '« Le Colosse à Bosse d’Acier »',
    primaryColor: 0xd97706,
    secondaryColor: 0x78350f,
    accentColor: 0x38bdf8,
    cssPrimary: '#d97706',
    scale: 1.0,
    stats: { pow: 88, spd: 76, def: 92 },
    maxHp: 1100,
    walkSpeed: 8.2,
    special1Name: 'Charge Boréale (H)',
    special2Name: 'Cornes Sismiques (T)',
    fatalityName: 'Impact Crânien Polaire (R)',
    moveStyle: 'Trot quadrupède puissant, coup de bosse nasale et soulèvement de collerette.',
    fatalityDesc: 'Gratte le sol, charge à vitesse supersonique avec sa bosse nasale blindée, pulvérise le torse ennemi et empale son crâne.',
    skins: [
        { name: 'Tundra Brawler', primary: 0xd97706, secondary: 0x78350f, accent: 0x38bdf8 },
        { name: 'Glacial Frost', primary: 0x0284c7, secondary: 0x0369a1, accent: 0xe0f2fe },
        { name: 'Volcanic Basalt', primary: 0x27272a, secondary: 0x18181b, accent: 0xf97316 },
        { name: 'Emerald Moss', primary: 0x15803d, secondary: 0x166534, accent: 0xfacc15 }
    ]
}, {
    // Hauteur de base du bassin utilisée par le système d'animation
    animBaseHipsY: 2.1,

    // Spécial 2 (T)
    onSpecial2(attacker, defender, dist, basePow) {
        special2SeismicQuake(attacker, defender, dist, basePow);
    },

    // Construction du modèle 3D articulé
    buildRig(ctx) {
        const { hips, rig, addMesh, bodyMat, darkMat, accentMat, boneMat, eyeMat } = ctx;
        hips.position.y = 1.65;
        // Corps quadrupède massif
        addMesh(new THREE.BoxGeometry(2.4, 1.35, 1.45), bodyMat, rig.torso, 0, 0.15, 0);
        addMesh(new THREE.BoxGeometry(2.1, 0.3, 1.5), darkMat, rig.torso, 0, 0.75, 0);

        // Cou & Tête à collerette + BOSSE NASALE
        rig.neck.position.set(1.15, 0.3, 0);
        rig.torso.add(rig.neck);
        rig.headGroup.position.set(0.25, 0.1, 0);
        rig.neck.add(rig.headGroup);

        // Grande collerette osseuse (Frill)
        const frill = addMesh(new THREE.BoxGeometry(0.28, 1.65, 1.75), darkMat, rig.headGroup, -0.15, 0.55, 0, 0, 0, 0.35);
        addMesh(new THREE.BoxGeometry(0.32, 1.45, 1.55), accentMat, rig.headGroup, -0.12, 0.55, 0, 0, 0, 0.35);
        // Cornes du sommet de la collerette
        addMesh(new THREE.ConeGeometry(0.16, 0.75, 6), boneMat, rig.headGroup, -0.25, 1.45, 0.55, 0, 0, -0.45);
        addMesh(new THREE.ConeGeometry(0.16, 0.75, 6), boneMat, rig.headGroup, -0.25, 1.45, -0.55, 0, 0, -0.45);

        // Museau & Bec
        addMesh(new THREE.BoxGeometry(1.25, 0.68, 0.88), bodyMat, rig.headGroup, 0.55, -0.05, 0);
        // BOSSE NASALE MASSIVE (Pachyrhinosaure !)
        const boss = addMesh(new THREE.SphereGeometry(0.44, 12, 10), boneMat, rig.headGroup, 0.78, 0.34, 0);
        boss.scale.set(1.25, 0.75, 0.95);
        rig.specialParts.nasalBoss = boss;

        addMesh(new THREE.SphereGeometry(0.09, 8, 8), eyeMat, rig.headGroup, 0.35, 0.15, 0.46);
        addMesh(new THREE.SphereGeometry(0.09, 8, 8), eyeMat, rig.headGroup, 0.35, 0.15, -0.46);

        // Queue (3 segments)
        let pTail = rig.torso;
        for (let s = 0; s < 3; s++) {
            const seg = new THREE.Group();
            seg.position.set(s === 0 ? -1.15 : -0.65, 0, 0);
            const sz = 0.7 * Math.pow(0.72, s);
            addMesh(new THREE.BoxGeometry(0.7, sz, sz), bodyMat, seg, -0.3, 0, 0);
            pTail.add(seg);
            rig.tailSegments.push(seg);
            pTail = seg;
        }

        // 4 Pattes robustes
        [
            { x: 0.85, z: -0.62 }, { x: 0.85, z: 0.62 },
            { x: -0.85, z: -0.62 }, { x: -0.85, z: 0.62 }
        ].forEach((pos, idx) => {
            const leg = new THREE.Group();
            leg.position.set(pos.x, -0.1, pos.z);
            addMesh(new THREE.BoxGeometry(0.52, 1.45, 0.48), idx < 2 ? bodyMat : darkMat, leg, 0, -0.7, 0);
            addMesh(new THREE.BoxGeometry(0.6, 0.22, 0.52), boneMat, leg, 0.08, -1.45, 0);
            hips.add(leg);
            rig.legs.push(leg);
        });
    },

    // Animation d'attente (idle) / de marche
    animateIdle(ctx) {
        const { rig, baseHipsY, time, isWalk } = ctx;
        // Pachyrhinosaure : Trot quadrupède diagonal + secousse de collerette
        const freq = isWalk ? 13 : 4;
        rig.hips.position.y = baseHipsY + Math.abs(Math.sin(time * freq)) * (isWalk ? 0.15 : 0.04);
        rig.headGroup.rotation.z = isWalk ? -0.18 + Math.sin(time * freq) * 0.1 : Math.sin(time * 3.5) * 0.08;
        const s = isWalk ? Math.sin(time * freq) * 0.45 : 0;
        rig.legs[0].rotation.z = s;
        rig.legs[3].rotation.z = s;
        rig.legs[1].rotation.z = -s;
        rig.legs[2].rotation.z = -s;
    },

    // Animations d'attaques (light / heavy / special / special2 / xray)
    animateAttack(ctx) {
        const { rig, act, prog, swing } = ctx;
        if (act === 'light') {
            // Coup de cornes de collerette vers le haut
            rig.headGroup.rotation.z = swing * 0.75;
        } else if (act === 'heavy' || act === 'special') {
            // Coup de bélier de la bosse nasale
            rig.hips.position.x = swing * 0.85;
            rig.torso.rotation.z = -swing * 0.25;
            rig.headGroup.rotation.z = -0.45 + swing * 0.65;
        } else {
            // Piétinement des pattes avant (Cornes Sismiques)
            rig.torso.rotation.z = Math.sin(prog * Math.PI * 2) * 0.38;
            rig.legs[0].rotation.z = swing * 0.8;
            rig.legs[1].rotation.z = swing * 0.8;
        }
    },

    // Chorégraphie 3D de la fatalité
    animateFatality(ctx) {
        const { rig, prog } = ctx;
        // PACHYRHINOSAURE : Gratte le sol, charge supersonique et soulève la victime sur ses cornes
        if (prog < 0.35) {
            rig.hips.position.x = -1.2 * (prog / 0.35);
            rig.headGroup.rotation.z = -0.45;
            rig.legs[0].rotation.z = Math.sin(prog * 45) * 0.65;
        } else if (prog < 0.65) {
            const p = (prog - 0.35) / 0.3;
            rig.hips.position.x = -1.2 + p * 3.0;
            rig.headGroup.rotation.z = -0.5;
        } else {
            rig.hips.position.x = 1.8;
            rig.headGroup.rotation.z = 0.85;
        }
    },

    // Script de la fatalité (sons, sang, effets, annonce)
    executeFatality(winner, loser) {
        // 2) PACHYRHINOSAURE : Charge supersonique avec sa bosse nasale qui pulvérise et empale
        setTimeout(() => {
            if (matchState !== 'fatality_anim') return;
            sfx.playRoar(85, 0.5);
            spawnFloatingPopup(winner.x, 'CHARGE POLAIRE !', '#38bdf8');
        }, 800);
        setTimeout(() => {
            if (matchState !== 'fatality_anim') return;
            sfx.playBoneCrack();
            loser.vx = winner.facing * 14;
            loser.vy = 9;
            loser.decapitated = true;
            loser.isDead = true;
            loser.hp = 0;
            spawn3DBloodAndBones(loser.x, 2.2, 70, true);
            screenShake = 0.95;
            showAnnouncer('FATALITY !', 'PACHYRHINOSAURE PULVÉRISE L’ENNEMI');
        }, 1850);
    },
});
