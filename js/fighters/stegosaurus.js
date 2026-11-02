/* ============================================================================
 * COMBATTANT : STÉGOSAURE (Stegosaurus Stenops)
 * Données (stats, skins, textes), modèle 3D, animations, coups spéciaux & fatalité.
 * ============================================================================ */

registerFighter({
    id: 'stegosaurus',
    name: 'STÉGOSAURE',
    fullName: 'Stegosaurus Stenops',
    role: 'Sentinelle à Plaques',
    title: '« Le Mur d’Épines et de Plaques »',
    primaryColor: 0xb45309,
    secondaryColor: 0x78350f,
    accentColor: 0xf59e0b,
    cssPrimary: '#b45309',
    scale: 1.08,
    stats: { pow: 92, spd: 68, def: 95 },
    maxHp: 1160,
    walkSpeed: 7.2,
    special1Name: 'Thagomiseur Caudal (H)',
    special2Name: 'Écran Thermique (T)',
    fatalityName: 'Transfixion Quadruple (R)',
    moveStyle: 'Marche quadrupède lourde rythmée par ses doubles rangées de plaques dorsales et ses 4 pointes caudales.',
    fatalityDesc: 'Pivote à 180° et empale le torse et la cage thoracique ennemie de ses 4 pointes osseuses d’un mètre avant de projeter la dépouille.',
    skins: [
        { name: 'Solar Shield', primary: 0xb45309, secondary: 0x78350f, accent: 0xf59e0b },
        { name: 'Verdant Grove', primary: 0x166534, secondary: 0x14532d, accent: 0x22c55e },
        { name: 'Cobalt Night', primary: 0x1e3a8a, secondary: 0x172554, accent: 0x3b82f6 },
        { name: 'Basalt Magma', primary: 0x27272a, secondary: 0x18181b, accent: 0xf97316 }
    ]
}, {
    // Hauteur de base du bassin utilisée par le système d'animation
    animBaseHipsY: 1.65,

    // Spécial 2 (T)
    onSpecial2(attacker, defender, dist, basePow) {
        special2SeismicQuake(attacker, defender, dist, basePow);
    },

    // Construction du modèle 3D articulé
    buildRig(ctx) {
        const { hips, rig, addMesh, bodyMat, darkMat, accentMat, boneMat, eyeMat } = ctx;
        // STÉGOSAURE : Grand dinosaure quadrupède cuirassé, plaques dorsales en quinconce et thagomiseur
        hips.position.y = 1.65;
        // Torse massif et voûté
        addMesh(new THREE.BoxGeometry(2.4, 1.4, 1.3), bodyMat, rig.torso, 0, 0.15, 0, 0, 0, -0.15);
        addMesh(new THREE.BoxGeometry(1.8, 1.1, 1.38), darkMat, rig.torso, -0.2, 0.05, 0, 0, 0, -0.15);

        // Petit cou & tête très basse
        rig.neck.position.set(1.15, -0.1, 0);
        rig.torso.add(rig.neck);
        addMesh(new THREE.BoxGeometry(0.7, 0.5, 0.55), bodyMat, rig.neck, 0.3, -0.12, 0, 0, 0, -0.25);

        rig.headGroup.position.set(0.6, -0.22, 0);
        rig.neck.add(rig.headGroup);
        addMesh(new THREE.BoxGeometry(0.75, 0.42, 0.45), darkMat, rig.headGroup, 0.25, 0, 0);
        addMesh(new THREE.ConeGeometry(0.14, 0.38, 4), boneMat, rig.headGroup, 0.65, -0.05, 0, 0, 0, -Math.PI / 2);
        addMesh(new THREE.SphereGeometry(0.07, 8, 8), eyeMat, rig.headGroup, 0.35, 0.1, 0.24);
        addMesh(new THREE.SphereGeometry(0.07, 8, 8), eyeMat, rig.headGroup, 0.35, 0.1, -0.24);

        // Deux rangées alternées de 8 grandes plaques dermiques dorsales losanges
        const platesGroup = new THREE.Group();
        for (let i = 0; i < 8; i++) {
            const pSide = (i % 2 === 0) ? 0.22 : -0.22;
            const pX = -1.0 + i * 0.35;
            const pScale = 0.55 + Math.sin((i / 7) * Math.PI) * 0.55;
            const plate = new THREE.Mesh(new THREE.BoxGeometry(0.35 * pScale, 0.85 * pScale, 0.06), accentMat);
            plate.position.set(pX, 0.85 + pScale * 0.35, pSide);
            plate.rotation.y = (i % 2 === 0 ? 0.12 : -0.12);
            plate.rotation.z = 0.15;
            platesGroup.add(plate);
        }
        rig.torso.add(platesGroup);
        rig.specialParts.plates = platesGroup;

        // Bras avant plus courts (quadrupède)
        [-0.62, 0.62].forEach(z => {
            const fLeg = new THREE.Group();
            fLeg.position.set(0.75, -0.2, z);
            addMesh(new THREE.BoxGeometry(0.48, 0.9, 0.42), bodyMat, fLeg, 0, -0.35, 0);
            addMesh(new THREE.BoxGeometry(0.42, 0.75, 0.38), darkMat, fLeg, 0, -0.9, 0);
            hips.add(fLeg);
            rig.arms.push(fLeg);
        });

        // Queue puissante armée du THAGOMISEUR (4 épines osseuses mortelles)
        let pTail = rig.torso;
        for (let s = 0; s < 4; s++) {
            const seg = new THREE.Group();
            seg.position.set(s === 0 ? -1.15 : -0.75, s === 0 ? 0.1 : -0.05, 0);
            addMesh(new THREE.BoxGeometry(0.8, 0.6 - s * 0.1, 0.55 - s * 0.08), bodyMat, seg, -0.38, 0, 0);
            pTail.add(seg);
            rig.tailSegments.push(seg);
            pTail = seg;
        }
        // Thagomiseur : 4 pointes osseuses sur le dernier segment caudal
        const thago = new THREE.Group();
        thago.position.set(-0.65, 0.05, 0);
        // 2 pointes à gauche et 2 pointes à droite
        [-0.32, 0.32].forEach(z => {
            [0.25, -0.15].forEach(x => {
                const spike = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.95, 5), boneMat);
                spike.position.set(x, 0.1, z);
                spike.rotation.z = Math.PI / 2 - 0.2;
                spike.rotation.x = (z > 0 ? 0.6 : -0.6);
                thago.add(spike);
            });
        });
        pTail.add(thago);
        rig.specialParts.thagomizer = thago;

        // 2 Pattes arrière massives et hautes
        [-0.68, 0.68].forEach(z => {
            const hLeg = new THREE.Group();
            hLeg.position.set(-0.65, 0, z);
            addMesh(new THREE.BoxGeometry(0.65, 1.25, 0.52), bodyMat, hLeg, 0, -0.45, 0);
            addMesh(new THREE.BoxGeometry(0.5, 0.95, 0.44), darkMat, hLeg, 0, -1.2, 0);
            hips.add(hLeg);
            rig.legs.push(hLeg);
        });
    },

    // Animation d'attente (idle) / de marche
    animateIdle(ctx) {
        const { rig, baseHipsY, time, isWalk } = ctx;
        // Stégosaure : Balancement lent de la queue et du thagomiseur
        const freq = isWalk ? 7.2 : 2.5;
        rig.hips.position.y = baseHipsY + Math.abs(Math.sin(time * freq)) * (isWalk ? 0.1 : 0.03);
        rig.torso.rotation.y = Math.sin(time * (freq * 0.5)) * 0.12;
        rig.tailSegments.forEach((seg, i) => {
            seg.rotation.y = Math.sin(time * 3.5 - i * 0.4) * 0.28;
        });
        rig.legs[0].rotation.z = isWalk ? Math.sin(time * freq) * 0.45 : 0;
        rig.legs[1].rotation.z = isWalk ? -Math.sin(time * freq) * 0.45 : 0;
        rig.arms[0].rotation.z = isWalk ? -Math.sin(time * freq) * 0.45 : 0;
        rig.arms[1].rotation.z = isWalk ? Math.sin(time * freq) * 0.45 : 0;
    },

    hasCustomDirectionals: true,

    // Animations d'attaques (light / heavy / special / special2 / xray)
    animateAttack(ctx) {
        const { rig, act, prog, swing, baseHipsY } = ctx;
        if (act === 'light') {
            rig.torso.rotation.y = swing * 0.55;
            rig.headGroup.rotation.y = swing * 0.65;
        } else if (act === 'light2') {
            rig.torso.rotation.y = -swing * 0.55;
            rig.headGroup.rotation.y = -swing * 0.65;
        } else if (act === 'fwd_light') {
            rig.hips.position.x = swing * 0.7;
            rig.torso.rotation.z = -swing * 0.25;
            rig.headGroup.rotation.z = -0.3;
        } else if (act === 'low_light' || act === 'low_heavy') {
            // Direction BAS ⬇️ (Balayage bas) : Fouet caudal bas du thagomiseur
            rig.hips.rotation.y = -swing * 1.5;
            rig.hips.position.y = baseHipsY - swing * 0.25;
            rig.tailSegments.forEach((seg, i) => {
                seg.rotation.y = -swing * 0.7;
                seg.rotation.z = -0.25;
            });
        } else if (act === 'anti_air' || act === 'up_light') {
            // Direction HAUT ⬆️ (Anti-Air Launcher / Ciel) : Épines du thagomiseur fouettées vers le ciel
            rig.hips.rotation.z = swing * 0.45;
            rig.tailSegments.forEach((seg, i) => {
                seg.rotation.z = swing * 0.9;
                seg.rotation.y = Math.sin(prog * Math.PI) * 0.35;
            });
        } else if (act === 'back_light') {
            // Direction ARRIÈRE ⬅️ : Pivote en retrait et présente les épines du thagomiseur
            rig.hips.position.x = -s * 0.65;
            rig.hips.rotation.y = -s * 0.9;
            rig.tailSegments.forEach(seg => { seg.rotation.y = -s * 0.6; });
        } else if (act === 'air_light' || act === 'air_heavy') {
            rig.hips.rotation.z = prog * Math.PI * 2;
            rig.tailSegments.forEach(s => s.rotation.z = 0.6);
        } else if (act === 'fwd_heavy') {
            rig.hips.position.x = swing * 1.1;
            rig.torso.rotation.z = -swing * 0.4;
            rig.hips.rotation.y = -swing * 1.2;
            rig.tailSegments.forEach(s => s.rotation.y = -swing * 0.5);
        } else if (act === 'throw') {
            rig.hips.rotation.y = -swing * 1.7;
            rig.tailSegments.forEach(s => s.rotation.z = swing * 0.85);
        } else if (act === 'throw_whiff') {
            rig.hips.position.x = swing * 0.4;
            rig.hips.rotation.y = -swing * 0.6;
        } else if (act === 'heavy' || act === 'special') {
            rig.hips.rotation.y = -swing * 1.95;
            rig.tailSegments.forEach((seg, i) => { seg.rotation.y = -swing * 0.65; });
        } else if (act === 'special2') {
            rig.torso.rotation.z = Math.sin(prog * Math.PI * 6) * 0.15;
        }
    },

    // Chorégraphie 3D de la fatalité
    animateFatality(ctx) {
        const { rig, prog } = ctx;
        rig.hips.rotation.y = -Math.min(1, prog * 1.8) * Math.PI;
        rig.tailSegments.forEach((seg, i) => { seg.rotation.y = -Math.sin(prog * Math.PI * 2) * 0.65; });
    },

    // Script de la fatalité (sons, sang, effets, annonce)
    executeFatality(winner, loser) {
        // 11) STÉGOSAURE : Rotation et transfixion quadruple au THAGOMISEUR
        setTimeout(() => {
            if (matchState !== 'fatality_anim') return;
            sfx.playBoneCrack();
            sfx.playHit(true);
            spawn3DBloodAndBones(loser.x, 2.0, 45, true);
            spawnFloatingPopup(loser.x, 'THAGOMISEUR !', '#f59e0b');
        }, 950);
        setTimeout(() => {
            if (matchState !== 'fatality_anim') return;
            sfx.playBoneCrack();
            sfx.playRoar(55, 0.9);
            loser.flattened = true;
            loser.isDead = true;
            loser.hp = 0;
            spawn3DBloodAndBones(loser.x, 1.2, 70, true);
            screenShake = 0.9;
            showAnnouncer('FATALITY !', 'TRANSFIXION DU STÉGOSAURE');
        }, 2200);
    },
});
