/* ============================================================================
 * COMBATTANT : POSTOSUCHUS (Postosuchus Kirkpatricki)
 * Données (stats, skins, textes), modèle 3D, animations, coups spéciaux & fatalité.
 * ============================================================================ */

registerFighter({
    id: 'postosuchus',
    name: 'POSTOSUCHUS',
    fullName: 'Postosuchus Kirkpatricki',
    role: 'Archosaurien Carnassier',
    title: '« L’Ombre du Trias Supérieur »',
    primaryColor: 0xb91c1c,
    secondaryColor: 0x450a0a,
    accentColor: 0xf97316,
    cssPrimary: '#b91c1c',
    scale: 0.95,
    stats: { pow: 91, spd: 80, def: 84 },
    maxHp: 1020,
    walkSpeed: 8.4,
    special1Name: 'Croc Mortel (H)',
    special2Name: 'Roulade Triasique (T)',
    fatalityName: 'Déchirement Préhistorique (R)',
    moveStyle: 'Démarche semi-érigée menaçante, bonds violents et morsures en tenaille.',
    fatalityDesc: 'Broyage du cou par morsure en étau, roule sur lui-même comme un crocodile primitif pour arracher la colonne vertébrale.',
    skins: [
        { name: 'Triassic Stalker', primary: 0xb91c1c, secondary: 0x450a0a, accent: 0xf97316 },
        { name: 'Canyon Dust', primary: 0x78350f, secondary: 0x451a03, accent: 0xf59e0b },
        { name: 'Swamp Basilisk', primary: 0x166534, secondary: 0x052e16, accent: 0x4ade80 },
        { name: 'Basalt Viper', primary: 0x27272a, secondary: 0x09090b, accent: 0x38bdf8 }
    ]
}, {
    // Hauteur de base du bassin utilisée par le système d'animation
    animBaseHipsY: 1.48,

    // Spécial 2 (T)
    onSpecial2(attacker, defender, dist, basePow) {
        spawn3DProjectile(attacker, 'boulder');
    },

    // Construction du modèle 3D articulé
    buildRig(ctx) {
        const { hips, rig, addMesh, bodyMat, darkMat, accentMat, boneMat, eyeMat } = ctx;
        hips.position.y = 1.48;
        // Corps long et blindé d'Archosaure Rauisuchien (Postosuchus)
        addMesh(new THREE.BoxGeometry(2.65, 1.05, 1.25), bodyMat, rig.torso, 0, 0.1, 0);
        addMesh(new THREE.BoxGeometry(2.4, 0.25, 1.32), darkMat, rig.torso, 0, -0.35, 0);

        // Double rangée d'ostéodermes dorsaux blindés
        for (let i = -1.1; i <= 1.1; i += 0.36) {
            addMesh(new THREE.ConeGeometry(0.14, 0.38, 4), accentMat, rig.torso, i, 0.72, 0.25);
            addMesh(new THREE.ConeGeometry(0.14, 0.38, 4), accentMat, rig.torso, i, 0.72, -0.25);
        }

        // Cou musclé & Crâne rectangulaire profond de Postosuchus
        rig.neck.position.set(1.25, 0.2, 0);
        rig.torso.add(rig.neck);
        addMesh(new THREE.BoxGeometry(0.65, 0.75, 0.85), darkMat, rig.neck, 0.15, 0.05, 0);

        rig.headGroup.position.set(0.45, 0.15, 0);
        rig.neck.add(rig.headGroup);
        addMesh(new THREE.BoxGeometry(1.45, 0.56, 0.82), bodyMat, rig.headGroup, 0.5, 0.12, 0);
        addMesh(new THREE.BoxGeometry(1.3, 0.18, 0.86), darkMat, rig.headGroup, 0.45, 0.38, 0);
        addMesh(new THREE.SphereGeometry(0.09, 8, 8), eyeMat, rig.headGroup, 0.3, 0.25, 0.42);
        addMesh(new THREE.SphereGeometry(0.09, 8, 8), eyeMat, rig.headGroup, 0.3, 0.25, -0.42);

        // Dents carnassières
        for (let t = 0; t < 5; t++) {
            addMesh(new THREE.ConeGeometry(0.05, 0.2, 4), boneMat, rig.headGroup, 0.2 + t * 0.22, -0.18, 0.35, Math.PI, 0, 0);
            addMesh(new THREE.ConeGeometry(0.05, 0.2, 4), boneMat, rig.headGroup, 0.2 + t * 0.22, -0.18, -0.35, Math.PI, 0, 0);
        }
        rig.jaw.position.set(0, -0.15, 0);
        rig.headGroup.add(rig.jaw);
        addMesh(new THREE.BoxGeometry(1.35, 0.26, 0.72), darkMat, rig.jaw, 0.48, -0.08, 0);

        // Longue queue crocodilienne crantée (4 segments)
        let pTail = rig.torso;
        for (let s = 0; s < 4; s++) {
            const seg = new THREE.Group();
            seg.position.set(s === 0 ? -1.3 : -0.82, 0, 0);
            const sz = 0.72 * Math.pow(0.74, s);
            addMesh(new THREE.BoxGeometry(0.88, sz, sz * 0.85), s % 2 === 0 ? bodyMat : darkMat, seg, -0.4, 0, 0);
            addMesh(new THREE.ConeGeometry(0.1, 0.3, 4), accentMat, seg, -0.4, sz * 0.6, 0);
            pTail.add(seg);
            rig.tailSegments.push(seg);
            pTail = seg;
        }

        // 4 Pattes d'Archosaure (pattes arrière plus longues que pattes avant)
        [
            { x: 0.9, z: -0.62, h: 1.25 }, { x: 0.9, z: 0.62, h: 1.25 },
            { x: -0.88, z: -0.62, h: 1.45 }, { x: -0.88, z: 0.62, h: 1.45 }
        ].forEach((pos, idx) => {
            const leg = new THREE.Group();
            leg.position.set(pos.x, 0, pos.z);
            addMesh(new THREE.BoxGeometry(0.46, pos.h, 0.44), idx < 2 ? darkMat : bodyMat, leg, 0, -pos.h * 0.5, 0);
            addMesh(new THREE.BoxGeometry(0.58, 0.2, 0.48), boneMat, leg, 0.1, -pos.h, 0);
            hips.add(leg);
            rig.legs.push(leg);
        });
    },

    // Animation d'attente (idle) / de marche
    animateIdle(ctx) {
        const { rig, baseHipsY, time, isWalk } = ctx;
        // Postosuchus : Marche reptilienne prédatrice basse avec ondulation latérale de la queue
        const freq = isWalk ? 12 : 3.5;
        rig.hips.position.y = baseHipsY + Math.sin(time * freq) * 0.06;
        rig.torso.rotation.y = isWalk ? Math.sin(time * freq * 0.5) * 0.12 : 0;
        rig.jaw.rotation.z = -0.06 - Math.abs(Math.sin(time * 3)) * 0.14;
        const s = isWalk ? Math.sin(time * freq) * 0.48 : 0;
        rig.legs[0].rotation.z = s;
        rig.legs[3].rotation.z = s;
        rig.legs[1].rotation.z = -s;
        rig.legs[2].rotation.z = -s;
        rig.tailSegments.forEach((seg, i) => {
            seg.rotation.y = Math.sin(time * 7 - i * 0.5) * 0.26;
        });
    },

    // Animations d'attaques (light / heavy / special / special2 / xray)
    animateAttack(ctx) {
        const { rig, act, prog, swing, baseHipsY } = ctx;
        if (act === 'light') {
            // Bond bipède et claquement de mâchoires du Trias
            rig.hips.rotation.z = swing * 0.45;
            rig.headGroup.rotation.z = -swing * 0.4;
            rig.jaw.rotation.z = -swing * 0.75;
        } else if (act === 'heavy' || act === 'special') {
            // TONNEAU DE LA MORT (Rotation longitudinale Death Roll sur l'axe X !)
            rig.hips.position.y = baseHipsY + swing * 0.65;
            rig.torso.rotation.x = prog * Math.PI * 4;
            rig.jaw.rotation.z = -0.5;
        } else {
            // Ruée Mâchoire du Trias
            rig.hips.position.x = swing * 0.9;
            rig.jaw.rotation.z = -0.8;
        }
    },

    // Chorégraphie 3D de la fatalité
    animateFatality(ctx) {
        const { rig, prog, baseHipsY } = ctx;
        // POSTOSUCHUS : Saisit sa proie dans sa mâchoire puis exécute un Tonneau de la Mort (Death Roll) frénétique
        if (prog < 0.25) {
            rig.hips.rotation.z = 0.35;
            rig.jaw.rotation.z = -0.8;
        } else {
            rig.hips.position.y = baseHipsY + 0.55;
            rig.torso.rotation.x = (prog - 0.25) * Math.PI * 14;
            rig.jaw.rotation.z = -0.25;
        }
    },

    // Script de la fatalité (sons, sang, effets, annonce)
    executeFatality(winner, loser) {
        // 7) POSTOSUCHUS : Vrille Déchiqueteuse (Death Roll à 1000 tours/minute)
        setTimeout(() => {
            if (matchState !== 'fatality_anim') return;
            sfx.playBoneCrack();
            spawnFloatingPopup(loser.x, 'MÂCHOIRE VERROUILLÉE !', '#fef08a');
            spawn3DBloodAndBones(loser.x, 2.0, 30, true);
        }, 850);
        const rollInterval = setInterval(() => {
            if (matchState !== 'fatality_anim') { clearInterval(rollInterval); return; }
            sfx.playHit(true);
            loser.rig.hips.rotation.x += 1.4;
            spawn3DBloodAndBones(loser.x, 2.1, 20, true);
        }, 320);
        setTimeout(() => {
            clearInterval(rollInterval);
            if (matchState !== 'fatality_anim') return;
            sfx.playBoneCrack();
            sfx.playRoar(58, 0.85);
            loser.decapitated = true;
            loser.isDead = true;
            loser.hp = 0;
            spawn3DBloodAndBones(loser.x, 2.2, 80, true);
            screenShake = 1.0;
            showAnnouncer('FATALITY !', 'TONNEAU DE LA MORT DU POSTOSUCHUS');
        }, 2200);
    },
});
