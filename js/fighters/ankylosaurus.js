/* ============================================================================
 * COMBATTANT : ANKYLOSAURE (Ankylosaurus Magniventris)
 * Données (stats, skins, textes), modèle 3D, animations, coups spéciaux & fatalité.
 * ============================================================================ */

registerFighter({
    id: 'ankylo',
    name: 'ANKYLOSAURE',
    fullName: 'Ankylosaurus Magniventris',
    role: 'Forteresse Vivante',
    title: '« Le Cuirassé Caudal »',
    primaryColor: 0x059669,
    secondaryColor: 0x064e3b,
    accentColor: 0xa3e635,
    cssPrimary: '#059669',
    scale: 1.02,
    stats: { pow: 90, spd: 64, def: 99 },
    maxHp: 1200,
    walkSpeed: 6.8,
    special1Name: 'Balayage Massue (H)',
    special2Name: 'Cuirasse d’Ostéodermes (T)',
    fatalityName: 'Pulvérisation Caudale (R)',
    moveStyle: 'Démarche basse et blindée, frappe circulaire de massue osseuse caudale.',
    fatalityDesc: 'Effectue un demi-tour centrifuge avec sa massue osseuse de 50 kg, fracasse les rotules de l’opposant avant de lui aplatir la cage thoracique.',
    skins: [
        { name: 'Bastion Iron', primary: 0x059669, secondary: 0x064e3b, accent: 0xa3e635 },
        { name: 'Obsidian Shell', primary: 0x18181b, secondary: 0x09090b, accent: 0xf59e0b },
        { name: 'Desert Dune', primary: 0xa16207, secondary: 0x713f12, accent: 0xfef08a },
        { name: 'Toxic Carapace', primary: 0x4d7c0f, secondary: 0x365314, accent: 0x86efac }
    ]
}, {
    // Hauteur de base du bassin utilisée par le système d'animation
    animBaseHipsY: 1.35,

    // Spécial 2 (T)
    onSpecial2(attacker, defender, dist, basePow) {
        spawn3DProjectile(attacker, 'boulder');
    },

    // Construction du modèle 3D articulé
    buildRig(ctx) {
        const { hips, rig, addMesh, bodyMat, darkMat, accentMat, boneMat, eyeMat } = ctx;
        hips.position.y = 1.35;
        // Carapace blindée bombée
        const shell = addMesh(new THREE.SphereGeometry(1.45, 14, 10), darkMat, rig.torso, 0, 0.15, 0);
        shell.scale.set(1.15, 0.65, 0.95);
        addMesh(new THREE.BoxGeometry(2.5, 0.55, 1.65), bodyMat, rig.torso, 0, -0.05, 0);

        // Rangées d'épines dorées sur la carapace
        for (let r = -0.9; r <= 0.9; r += 0.45) {
            for (let side of [-1, 1]) {
                addMesh(new THREE.ConeGeometry(0.16, 0.52, 5), accentMat, rig.torso, r, 0.48, side * 0.72, side * 0.45, 0, 0);
                addMesh(new THREE.ConeGeometry(0.14, 0.45, 5), boneMat, rig.torso, r, 0.08, side * 0.92, side * 1.1, 0, 0);
            }
        }

        // Tête blindée
        rig.neck.position.set(1.25, 0.05, 0);
        rig.torso.add(rig.neck);
        rig.headGroup.position.set(0.2, 0, 0);
        rig.neck.add(rig.headGroup);
        addMesh(new THREE.BoxGeometry(0.95, 0.55, 0.78), bodyMat, rig.headGroup, 0.35, 0, 0);
        addMesh(new THREE.ConeGeometry(0.13, 0.4, 4), accentMat, rig.headGroup, 0.1, 0.32, 0.35, -0.3, 0, 0.3);
        addMesh(new THREE.ConeGeometry(0.13, 0.4, 4), accentMat, rig.headGroup, 0.1, 0.32, -0.35, 0.3, 0, 0.3);
        addMesh(new THREE.SphereGeometry(0.08, 8, 8), eyeMat, rig.headGroup, 0.4, 0.08, 0.4);
        addMesh(new THREE.SphereGeometry(0.08, 8, 8), eyeMat, rig.headGroup, 0.4, 0.08, -0.4);

        // Queue + MASSUE D'OS GÉANTE (Tail Club)
        let pTail = rig.torso;
        for (let s = 0; s < 3; s++) {
            const seg = new THREE.Group();
            seg.position.set(s === 0 ? -1.25 : -0.75, 0, 0);
            addMesh(new THREE.BoxGeometry(0.8, 0.38, 0.42), bodyMat, seg, -0.35, 0, 0);
            pTail.add(seg);
            rig.tailSegments.push(seg);
            pTail = seg;
        }
        // Massue au bout du dernier segment
        const clubGroup = new THREE.Group();
        clubGroup.position.set(-0.75, 0, 0);
        addMesh(new THREE.SphereGeometry(0.48, 12, 10), accentMat, clubGroup, 0, 0, 0.25);
        addMesh(new THREE.SphereGeometry(0.48, 12, 10), accentMat, clubGroup, 0, 0, -0.25);
        addMesh(new THREE.ConeGeometry(0.2, 0.5, 5), boneMat, clubGroup, -0.35, 0, 0, 0, 0, Math.PI / 2);
        pTail.add(clubGroup);
        rig.specialParts.tailClub = clubGroup;

        // 4 Pattes courtes et trapues
        [
            { x: 0.82, z: -0.68 }, { x: 0.82, z: 0.68 },
            { x: -0.82, z: -0.68 }, { x: -0.82, z: 0.68 }
        ].forEach(pos => {
            const leg = new THREE.Group();
            leg.position.set(pos.x, -0.1, pos.z);
            addMesh(new THREE.BoxGeometry(0.48, 1.15, 0.48), darkMat, leg, 0, -0.55, 0);
            hips.add(leg);
            rig.legs.push(leg);
        });
    },

    // Animation d'attente (idle) / de marche
    animateIdle(ctx) {
        const { rig, baseHipsY, time, isWalk } = ctx;
        // Ankylosaure : Marche blindée basse + balancement menaçant de la massue caudale
        const freq = isWalk ? 10 : 3;
        rig.hips.position.y = baseHipsY + Math.sin(time * freq) * 0.05;
        rig.torso.rotation.x = isWalk ? Math.sin(time * freq) * 0.08 : 0;
        const s = isWalk ? Math.sin(time * freq) * 0.38 : 0;
        rig.legs[0].rotation.z = s;
        rig.legs[3].rotation.z = s;
        rig.legs[1].rotation.z = -s;
        rig.legs[2].rotation.z = -s;
        rig.tailSegments.forEach((seg, i) => {
            seg.rotation.y = Math.sin(time * 5 - i * 0.4) * 0.28;
        });
    },

    hasCustomDirectionals: true,

    // Animations d'attaques claires et distinctes pour chaque coup
    animateAttack(ctx) {
        const { rig, act, prog, swing, strike, baseHipsY } = ctx;
        const s = strike !== undefined ? strike : swing;

        if (act === 'light') {
            // Coup Léger 1 : Coup d'épaule épineuse avant gauche
            rig.hips.position.x = s * 0.75;
            rig.torso.rotation.x = s * 0.45;
            rig.headGroup.rotation.y = s * 0.35;
        } else if (act === 'light2') {
            // Coup Léger 2 (Combo 1-2) : Coup de tête blindée et cornes vers la droite
            rig.hips.position.x = s * 0.85;
            rig.torso.rotation.x = -s * 0.35;
            rig.headGroup.rotation.y = -s * 0.45;
            rig.headGroup.rotation.z = -s * 0.35;
        } else if (act === 'fwd_light') {
            // Avant + Léger (Percée cuirassée) : Charge bélier plongeante
            rig.hips.position.x = s * 1.1;
            rig.torso.rotation.z = -s * 0.38;
            rig.headGroup.rotation.z = -s * 0.45;
        } else if (act === 'low_light' || act === 'low_heavy') {
            // Bas + Attaque : Marteau d'os pilonnant et rasant le sol
            rig.hips.position.y = baseHipsY * 0.6;
            rig.torso.rotation.z = -0.25;
            rig.tailSegments.forEach((seg, i) => {
                seg.rotation.y = Math.cos(prog * Math.PI) * 1.15;
                seg.rotation.z = -0.22;
            });
        } else if (act === 'anti_air' || act === 'up_light') {
            // Haut + Attaque : Fouet ascendant du marteau d'os projeté vers le ciel
            rig.hips.position.y = baseHipsY + s * 0.45;
            rig.torso.rotation.z = -s * 0.45;
            rig.tailSegments.forEach(seg => { seg.rotation.z = s * 0.85; });
        } else if (act === 'throw') {
            // Chope : Crochet caudal et projection lourde
            rig.hips.position.x = s * 0.85;
            rig.tailSegments.forEach(seg => { seg.rotation.y = Math.sin(prog * 20) * 0.65; });
        } else if (act === 'heavy' || act === 'special') {
            // Tourbillon 360° du Marteau d'Os (Dévastateur & Renvoi de projectiles)
            rig.hips.rotation.y = prog * Math.PI * 2;
            rig.tailSegments.forEach(s => { s.rotation.y = 0.48; });
        } else if (act === 'fwd_heavy') {
            // Charge blindée lourde avec Hyper-Armure
            rig.hips.position.x = s * 1.35;
            rig.torso.rotation.z = -s * 0.45;
        } else if (act === 'air_light' || act === 'air_heavy') {
            // Écrasement cuirassé plongeant
            rig.torso.rotation.z = -s * 0.45;
            rig.tailSegments.forEach(s => { s.rotation.z = 0.55; });
        } else if (act === 'back_light') {
            // Direction ARRIÈRE ⬅️ : Retrait blindé et coup d'épaule protecteur
            rig.hips.position.x = -s * 0.65;
            rig.torso.rotation.x = s * 0.35;
        } else if (act === 'special2') {
            // Roulade en Boulet Tectonique (Ultra)
            rig.hips.position.y = baseHipsY + s * 0.8;
            rig.torso.rotation.z = -prog * Math.PI * 4;
        }
    },

    // Chorégraphie 3D de la fatalité
    animateFatality(ctx) {
        const { rig, prog } = ctx;
        // ANKYLOSAURE : Frappe basse brise-genoux puis rotation 360° Home-Run qui décapite
        if (prog < 0.45) {
            rig.hips.rotation.y = Math.sin(prog * Math.PI * 2) * 1.8;
        } else {
            const p = (prog - 0.45) / 0.55;
            rig.hips.rotation.y = p * Math.PI * 4;
            rig.tailSegments.forEach(s => { s.rotation.y = 0.5; s.rotation.z = 0.25; });
        }
    },

    // Script de la fatalité (sons, sang, effets, annonce)
    executeFatality(winner, loser) {
        // 3) ANKYLOSAURE : Frappe les genoux puis Home-Run 360° qui expédie la tête dans les airs
        setTimeout(() => {
            if (matchState !== 'fatality_anim') return;
            sfx.playBoneCrack();
            loser.kneeling = true;
            spawn3DBloodAndBones(loser.x, 1.0, 28, true);
            spawnFloatingPopup(loser.x, 'GENOUX BRISÉS !', '#facc15');
        }, 1050);
        setTimeout(() => {
            if (matchState !== 'fatality_anim') return;
            sfx.playBoneCrack();
            sfx.playRoar(60, 0.8);
            loser.decapitated = true;
            loser.isDead = true;
            loser.hp = 0;
            // Crâne expulsé en orbite
            const flyingHead = new THREE.Mesh(
                new THREE.BoxGeometry(0.95, 0.75, 0.75),
                new THREE.MeshStandardMaterial({ color: loser.dino.primaryColor })
            );
            flyingHead.position.set(loser.x, 2.2, 0);
            fxGroup.add(flyingHead);
            particles3D.push({ mesh: flyingHead, vx: winner.facing * 18, vy: 14, vz: 5, life: 1.5 });

            spawn3DBloodAndBones(loser.x, 2.2, 65, true);
            screenShake = 0.95;
            showAnnouncer('FATALITY !', 'HOME-RUN DE L’ANKYLOSAURE');
        }, 2150);
    },
});
