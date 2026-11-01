/* ============================================================================
 * COMBATTANT : SPINOSAURE (Spinosaurus Aegyptiacus)
 * Données (stats, skins, textes), modèle 3D, animations, coups spéciaux & fatalité.
 * ============================================================================ */

registerFighter({
    id: 'spinosaurus',
    name: 'SPINOSAURE',
    fullName: 'Spinosaurus Aegyptiacus',
    role: 'Léviathan du Crétacé',
    title: '« Le Carnivore Démesuré »',
    primaryColor: 0x0284c7,
    secondaryColor: 0x082f49,
    accentColor: 0x38bdf8,
    cssPrimary: '#0284c7',
    scale: 1.12,
    stats: { pow: 95, spd: 74, def: 88 },
    maxHp: 1120,
    walkSpeed: 7.6,
    special1Name: 'Tranchage Fluvial (H)',
    special2Name: 'Vague Sanglante (T)',
    fatalityName: 'Éventration du Nil (R)',
    moveStyle: 'Posture massive avec crête neurale impressionnante, coups de museau et balayages aquatiques.',
    fatalityDesc: 'Empale la victime de ses griffes crocodiliennes, la soulève au-dessus de sa voile dorsale et la déchiquette en deux parties.',
    skins: [
        { name: 'River Emperor', primary: 0x0284c7, secondary: 0x082f49, accent: 0x38bdf8 },
        { name: 'Bile Croc', primary: 0x166534, secondary: 0x14532d, accent: 0x86efac },
        { name: 'Deep Trench', primary: 0x312e81, secondary: 0x1e1b4b, accent: 0x818cf8 },
        { name: 'Nile Blood', primary: 0x991b1b, secondary: 0x450a0a, accent: 0xfca5a5 }
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
        // Torse puissant de Spinosaure
        addMesh(new THREE.BoxGeometry(2.55, 1.32, 1.22), bodyMat, rig.torso, 0, 0.18, 0, 0, 0, 0.12);

        // GRANDE VOILE DORSALE (Neural Sail) emblématique du Spinosaure
        const sailGroup = new THREE.Group();
        const sailHeights = [0.85, 1.45, 1.95, 2.15, 1.95, 1.5, 0.95];
        sailHeights.forEach((h, idx) => {
            const xPos = -1.05 + idx * 0.34;
            addMesh(new THREE.CylinderGeometry(0.06, 0.09, h, 6), boneMat, sailGroup, xPos, 0.75 + h * 0.5, 0);
            if (idx < sailHeights.length - 1) {
                addMesh(new THREE.BoxGeometry(0.36, h * 0.88, 0.14), accentMat, sailGroup, xPos + 0.17, 0.7 + h * 0.44, 0);
            }
        });
        rig.torso.add(sailGroup);
        rig.specialParts.sailGroup = sailGroup;

        // Cou & Long museau étroit de crocodile (Baryonychine snout)
        rig.neck.position.set(1.18, 0.58, 0);
        rig.torso.add(rig.neck);
        addMesh(new THREE.BoxGeometry(0.75, 0.85, 0.72), darkMat, rig.neck, 0.2, 0.25, 0, 0, 0, -0.28);

        rig.headGroup.position.set(0.5, 0.68, 0);
        rig.neck.add(rig.headGroup);
        addMesh(new THREE.BoxGeometry(1.75, 0.42, 0.56), bodyMat, rig.headGroup, 0.65, 0.08, 0);
        // Crête nasale de Spinosaure
        addMesh(new THREE.ConeGeometry(0.12, 0.42, 4), accentMat, rig.headGroup, 0.35, 0.42, 0, 0, 0, -0.3);
        addMesh(new THREE.SphereGeometry(0.09, 8, 8), eyeMat, rig.headGroup, 0.28, 0.18, 0.3);
        addMesh(new THREE.SphereGeometry(0.09, 8, 8), eyeMat, rig.headGroup, 0.28, 0.18, -0.3);

        rig.jaw.position.set(0.05, -0.14, 0);
        rig.headGroup.add(rig.jaw);
        addMesh(new THREE.BoxGeometry(1.65, 0.22, 0.48), darkMat, rig.jaw, 0.6, -0.06, 0);

        // Bras puissants armés de griffes d'éventration
        [-0.62, 0.62].forEach(zOff => {
            const arm = new THREE.Group();
            arm.position.set(0.95, 0.0, zOff);
            addMesh(new THREE.BoxGeometry(0.85, 0.28, 0.28), darkMat, arm, 0.3, -0.15, 0, 0, 0, -0.35);
            addMesh(new THREE.ConeGeometry(0.09, 0.55, 4), boneMat, arm, 0.78, -0.35, 0, 0, 0, -1.2);
            rig.torso.add(arm);
            rig.arms.push(arm);
        });

        // Queue en rame aquatique (Paddle Tail)
        let pTail = rig.torso;
        for (let s = 0; s < 4; s++) {
            const seg = new THREE.Group();
            seg.position.set(s === 0 ? -1.2 : -0.85, 0, 0);
            addMesh(new THREE.BoxGeometry(0.9, 0.85 - s * 0.12, 0.28), s % 2 === 0 ? bodyMat : accentMat, seg, -0.42, 0.1, 0);
            pTail.add(seg);
            rig.tailSegments.push(seg);
            pTail = seg;
        }

        // 2 Jambes robustes
        [-0.56, 0.56].forEach(zOff => {
            const leg = new THREE.Group();
            leg.position.set(-0.18, 0, zOff);
            addMesh(new THREE.BoxGeometry(0.72, 1.15, 0.5), bodyMat, leg, 0, -0.5, 0);
            addMesh(new THREE.BoxGeometry(0.48, 1.05, 0.42), darkMat, leg, -0.08, -1.42, 0);
            addMesh(new THREE.BoxGeometry(0.85, 0.24, 0.55), boneMat, leg, 0.15, -2.02, 0);
            hips.add(leg);
            rig.legs.push(leg);
        });
    },

    // Animation d'attente (idle) / de marche
    animateIdle(ctx) {
        const { rig, baseHipsY, time, isWalk } = ctx;
        // Spinosaure : Démarche lourde de léviathan, bras griffus prêts à lacérer, queue aquatique
        const freq = isWalk ? 10.5 : 3.2;
        rig.hips.position.y = baseHipsY + Math.abs(Math.sin(time * freq)) * (isWalk ? 0.2 : 0.06);
        rig.jaw.rotation.z = -0.1 - Math.abs(Math.sin(time * 2.8)) * 0.12;
        rig.arms[0].rotation.z = Math.sin(time * 4) * 0.15;
        rig.arms[1].rotation.z = -Math.sin(time * 4) * 0.15;
        rig.legs[0].rotation.z = isWalk ? Math.sin(time * freq) * 0.52 : 0;
        rig.legs[1].rotation.z = isWalk ? -Math.sin(time * freq) * 0.52 : 0;
        rig.tailSegments.forEach((seg, i) => {
            seg.rotation.y = Math.sin(time * 6 - i * 0.5) * 0.25;
        });
    },

    // Animations d'attaques (light / heavy / special / special2 / xray)
    animateAttack(ctx) {
        const { rig, act, prog, swing } = ctx;
        if (act === 'light') {
            // Lacération alternée des griffes géantes
            rig.arms[0].rotation.z = swing * 1.35;
            rig.arms[1].rotation.z = -swing * 0.95;
            rig.torso.rotation.y = Math.sin(prog * Math.PI * 2) * 0.35;
        } else if (act === 'heavy') {
            // Double coup de griffes plongeant + morsure
            rig.torso.rotation.z = -swing * 0.35;
            rig.arms[0].rotation.z = swing * 1.45;
            rig.arms[1].rotation.z = swing * 1.45;
            rig.jaw.rotation.z = -swing * 0.65;
        } else {
            // Illumination thermique de la voile dorsale + balayage
            rig.hips.rotation.y = prog * Math.PI * 2;
        }
    },

    // Chorégraphie 3D de la fatalité
    animateFatality(ctx) {
        const { rig, prog } = ctx;
        // SPINOSAURE : Empale et soulève sa victime avec ses griffes pendant que sa voile irradie
        if (prog < 0.35) {
            rig.torso.rotation.z = -0.3;
            rig.arms[0].rotation.z = 1.1;
            rig.arms[1].rotation.z = 1.1;
        } else if (prog < 0.75) {
            rig.torso.rotation.z = 0.38;
            rig.arms[0].rotation.z = 1.55;
            rig.arms[1].rotation.z = 1.55;
            rig.jaw.rotation.z = -0.7;
        } else {
            rig.arms[0].rotation.y = 0.95;
            rig.arms[1].rotation.y = -0.95;
        }
    },

    // Script de la fatalité (sons, sang, effets, annonce)
    executeFatality(winner, loser) {
        // 8) SPINOSAURE : Empale la cible, la soulève dans les airs et la déchire dans un geyser thermique
        setTimeout(() => {
            if (matchState !== 'fatality_anim') return;
            sfx.playBoneCrack();
            loser.vy = 8.5;
            spawnFloatingPopup(loser.x, 'EMPALEMENT ABYSSAL !', '#f97316');
            spawn3DBloodAndBones(loser.x, 2.5, 35, true);
        }, 950);
        setTimeout(() => {
            if (matchState !== 'fatality_anim') return;
            sfx.playBoneCrack();
            sfx.playRoar(54, 0.95);
            loser.decapitated = true;
            loser.isDead = true;
            loser.hp = 0;
            spawn3DBloodAndBones(loser.x, 2.8, 85, true);
            screenShake = 1.1;
            showAnnouncer('FATALITY !', 'ÉVENTRATION DU SPINOSAURE');
        }, 2150);
    },
});
