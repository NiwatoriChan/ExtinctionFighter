/* ============================================================================
 * COMBATTANT : THÉRIZINOSAURE (Therizinosaurus Cheloniformis)
 * Données (stats, skins, textes), modèle 3D, animations, coups spéciaux & fatalité.
 * ============================================================================ */

registerFighter({
    id: 'therizino',
    name: 'THÉRIZINOSAURE',
    fullName: 'Therizinosaurus Cheloniformis',
    role: 'Faucheuse Préhistorique',
    title: '« Les Lames Vivantes de Mongolie »',
    primaryColor: 0x0d9488,
    secondaryColor: 0x134e4a,
    accentColor: 0x2dd4bf,
    cssPrimary: '#0d9488',
    scale: 1.05,
    stats: { pow: 97, spd: 75, def: 82 },
    maxHp: 1040,
    walkSpeed: 7.9,
    special1Name: 'Croix de Faucheuse (H)',
    special2Name: 'Tourbillon de Lames (T)',
    fatalityName: 'Découpe Chirurgicale (R)',
    moveStyle: 'Posture droite de bretteur préhistorique, grands coups de faux croisés et tourbillon tranchant.',
    fatalityDesc: 'Croise ses griffes géantes d’un mètre et exécute trois entailles fulgurantes en X qui découpent la cible et font voler sa tête.',
    skins: [
        { name: 'Obsidian Scythe', primary: 0x0d9488, secondary: 0x134e4a, accent: 0x2dd4bf },
        { name: 'Crimson Reaver', primary: 0x991b1b, secondary: 0x450a0a, accent: 0xef4444 },
        { name: 'Verdant Harvester', primary: 0x15803d, secondary: 0x14532d, accent: 0x22c55e },
        { name: 'Gold Plumed', primary: 0xa16207, secondary: 0x713f12, accent: 0xfbbf24 }
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
        hips.position.y = 2.15;
        // Torse dressé très haut de Thérizinosaure
        addMesh(new THREE.BoxGeometry(1.95, 1.55, 1.35), bodyMat, rig.torso, 0, 0.35, 0, 0, 0, 0.52);
        addMesh(new THREE.BoxGeometry(1.65, 1.25, 1.42), darkMat, rig.torso, -0.1, 0.25, 0, 0, 0, 0.52);

        // Long cou dressé & petite tête à bec
        rig.neck.position.set(0.65, 1.05, 0);
        rig.torso.add(rig.neck);
        addMesh(new THREE.BoxGeometry(0.48, 1.25, 0.52), bodyMat, rig.neck, 0.15, 0.55, 0, 0, 0, -0.18);

        rig.headGroup.position.set(0.28, 1.18, 0);
        rig.neck.add(rig.headGroup);
        addMesh(new THREE.BoxGeometry(0.78, 0.44, 0.48), darkMat, rig.headGroup, 0.2, 0.05, 0);
        addMesh(new THREE.ConeGeometry(0.15, 0.48, 4), boneMat, rig.headGroup, 0.65, 0.0, 0, 0, 0, -Math.PI / 2);
        // Crête de plumes émeraude
        addMesh(new THREE.BoxGeometry(0.55, 0.28, 0.12), accentMat, rig.headGroup, -0.05, 0.32, 0, 0, 0, 0.4);
        addMesh(new THREE.SphereGeometry(0.08, 8, 8), eyeMat, rig.headGroup, 0.25, 0.12, 0.26);
        addMesh(new THREE.SphereGeometry(0.08, 8, 8), eyeMat, rig.headGroup, 0.25, 0.12, -0.26);

        // BRAS + LES 6 VRAIES GRIFFES-FAUX MULTI-SEGMENTS DU THÉRIZINOSAURE
        [-0.72, 0.72].forEach(zOff => {
            const arm = new THREE.Group();
            arm.position.set(0.55, 0.65, zOff);
            // Bras musclé et avant-bras étendu
            addMesh(new THREE.BoxGeometry(0.85, 0.32, 0.32), darkMat, arm, 0.35, -0.08, 0, 0, 0, -0.22);
            addMesh(new THREE.BoxGeometry(0.65, 0.26, 0.28), bodyMat, arm, 0.95, -0.22, 0, 0, 0, -0.38);

            // 3 immenses faux courbées et acérées avec garde osseuse
            [-0.18, 0, 0.18].forEach((cZ, cIdx) => {
                const clawRoot = new THREE.Group();
                clawRoot.position.set(1.28, -0.32, cZ);
                const len = 1.35 + (cIdx === 1 ? 0.35 : 0.1); // Griffe centrale plus longue
                // Base de la griffe
                addMesh(new THREE.BoxGeometry(len * 0.45, 0.11, 0.07), boneMat, clawRoot, len * 0.22, -0.08, 0, 0, 0, -0.55);
                // Courbure médiane acérée
                addMesh(new THREE.BoxGeometry(len * 0.42, 0.08, 0.05), accentMat, clawRoot, len * 0.55, -0.32, 0, 0, 0, -1.15);
                // Pointe de faux effilée
                addMesh(new THREE.ConeGeometry(0.045, len * 0.4, 4), boneMat, clawRoot, len * 0.68, -0.62, 0, 0, 0, -1.75);
                arm.add(clawRoot);
            });
            rig.torso.add(arm);
            rig.arms.push(arm);
        });

        // Queue à plumes
        let pTail = rig.torso;
        for (let s = 0; s < 3; s++) {
            const seg = new THREE.Group();
            seg.position.set(s === 0 ? -0.95 : -0.7, s === 0 ? -0.15 : 0, 0);
            addMesh(new THREE.BoxGeometry(0.75, 0.55 - s * 0.12, 0.55), s === 2 ? accentMat : bodyMat, seg, -0.35, 0, 0);
            pTail.add(seg);
            rig.tailSegments.push(seg);
            pTail = seg;
        }

        // 2 Jambes solides
        [-0.54, 0.54].forEach(zOff => {
            const leg = new THREE.Group();
            leg.position.set(-0.1, 0, zOff);
            addMesh(new THREE.BoxGeometry(0.68, 1.15, 0.52), bodyMat, leg, 0, -0.5, 0);
            addMesh(new THREE.BoxGeometry(0.5, 1.0, 0.44), darkMat, leg, -0.05, -1.4, 0);
            addMesh(new THREE.BoxGeometry(0.85, 0.24, 0.56), boneMat, leg, 0.15, -2.02, 0);
            hips.add(leg);
            rig.legs.push(leg);
        });
    },

    // Animation d'attente (idle) / de marche
    animateIdle(ctx) {
        const { rig, baseHipsY, time, isWalk } = ctx;
        // Thérizinosaure : Garde haute intimidante, balancement des 6 griffes faux d'un mètre
        const freq = isWalk ? 11.5 : 3.8;
        rig.hips.position.y = baseHipsY + Math.abs(Math.sin(time * freq)) * (isWalk ? 0.18 : 0.05);
        rig.arms[0].rotation.y = Math.sin(time * 4) * 0.22;
        rig.arms[1].rotation.y = -Math.sin(time * 4) * 0.22;
        rig.arms[0].rotation.z = 0.15 + Math.sin(time * 3) * 0.1;
        rig.arms[1].rotation.z = 0.15 - Math.sin(time * 3) * 0.1;
        rig.legs[0].rotation.z = isWalk ? Math.sin(time * freq) * 0.55 : 0;
        rig.legs[1].rotation.z = isWalk ? -Math.sin(time * freq) * 0.55 : 0;
    },

    // Animations d'attaques (light / heavy / special / special2 / xray)
    animateAttack(ctx) {
        const { rig, act, prog, swing } = ctx;
        if (act === 'light') {
            // Entaille croisée rapide des faux d'un mètre
            rig.arms[0].rotation.y = swing * 1.15;
            rig.arms[1].rotation.y = -swing * 1.15;
            rig.arms[0].rotation.z = -swing * 0.65;
            rig.arms[1].rotation.z = -swing * 0.65;
        } else if (act === 'heavy' || act === 'special') {
            // Guillotine en X des 6 lames géantes
            rig.torso.rotation.z = -swing * 0.3;
            rig.arms[0].rotation.z = Math.cos(prog * Math.PI) * 1.2;
            rig.arms[1].rotation.z = Math.cos(prog * Math.PI) * 1.2;
        } else {
            // Tourbillon de Lames 360°
            rig.hips.rotation.y = prog * Math.PI * 4;
            rig.arms[0].rotation.x = -0.75;
            rig.arms[1].rotation.x = 0.75;
        }
    },

    // Chorégraphie 3D de la fatalité
    animateFatality(ctx) {
        const { rig, prog } = ctx;
        // THÉRIZINOSAURE : 3 entailles chirurgicales ultra-rapides avec ses faux d'un mètre
        const slashWave = Math.sin(prog * Math.PI * 6);
        rig.torso.rotation.y = slashWave * 0.55;
        rig.arms[0].rotation.z = slashWave * 1.3;
        rig.arms[1].rotation.z = -slashWave * 1.3;
        rig.arms[0].rotation.y = Math.cos(prog * Math.PI * 6) * 0.85;
        rig.arms[1].rotation.y = -Math.cos(prog * Math.PI * 6) * 0.85;
    },

    // Script de la fatalité (sons, sang, effets, annonce)
    executeFatality(winner, loser) {
        // 9) THÉRIZINOSAURE : 3 entailles laser avec ses 6 griffes faux d'un mètre
        [750, 1250, 1750].forEach((delay, idx) => {
            setTimeout(() => {
                if (matchState !== 'fatality_anim') return;
                sfx.playBoneCrack();
                const slashGeo = new THREE.BoxGeometry(3.8, 0.14, 0.14);
                const slashMat = new THREE.MeshBasicMaterial({ color: 0xa7f3d0 });
                const slashMesh = new THREE.Mesh(slashGeo, slashMat);
                slashMesh.position.set(loser.x, 2.2, 0.8);
                slashMesh.rotation.z = (idx - 1) * 0.65;
                fxGroup.add(slashMesh);
                particles3D.push({ mesh: slashMesh, vx: 0, vy: 0.5, vz: 0, life: 0.45 });
                spawn3DBloodAndBones(loser.x, 2.3, 25, true);
            }, delay);
        });
        setTimeout(() => {
            if (matchState !== 'fatality_anim') return;
            sfx.playRoar(95, 0.8);
            loser.decapitated = true;
            loser.isDead = true;
            loser.hp = 0;
            spawn3DBloodAndBones(loser.x, 2.6, 75, true);
            screenShake = 0.95;
            showAnnouncer('FATALITY !', 'DÉCOUPE CHIRURGICALE DU THÉRIZINOSAURE');
        }, 2200);
    },
});
