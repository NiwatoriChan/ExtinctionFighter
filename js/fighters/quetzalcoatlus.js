/* ============================================================================
 * COMBATTANT : QUETZALCOATLUS (Quetzalcoatlus Northropi)
 * Données (stats, skins, textes), modèle 3D, animations, coups spéciaux & fatalité.
 * ============================================================================ */

registerFighter({
    id: 'quetzal',
    name: 'QUETZALCOATLUS',
    fullName: 'Quetzalcoatlus Northropi',
    role: 'Monarque Céleste',
    title: '« L’Envergure Démesurée des Cieux »',
    primaryColor: 0x0284c7,
    secondaryColor: 0x0369a1,
    accentColor: 0x38bdf8,
    cssPrimary: '#0284c7',
    scale: 1.06,
    stats: { pow: 94, spd: 96, def: 74 },
    maxHp: 940,
    walkSpeed: 9.6,
    special1Name: 'Piqué Sonique (H)',
    special2Name: 'Bourrasque d’Ailes (T)',
    fatalityName: 'Chute Stratosphérique (R)',
    moveStyle: 'Démarche quadrupède ailée sur de longues échasses, piqués foudroyants et battements d’ailes destructeurs.',
    fatalityDesc: 'Saisit l’ennemi de son long bec en dague, s’élève dans la haute atmosphère et le laisse s’écraser à vitesse terminale.',
    skins: [
        { name: 'Sky Sovereign', primary: 0x0284c7, secondary: 0x0369a1, accent: 0x38bdf8 },
        { name: 'Blood Harpy', primary: 0x991b1b, secondary: 0x450a0a, accent: 0xef4444 },
        { name: 'Aurora Spirit', primary: 0x6366f1, secondary: 0x312e81, accent: 0x818cf8 },
        { name: 'Nocturnal Glider', primary: 0x18181b, secondary: 0x09090b, accent: 0x0ea5e9 }
    ]
}, {
    // Hauteur de base du bassin utilisée par le système d'animation
    animBaseHipsY: 1.95,

    // Spécial 2 (T)
    onSpecial2(attacker, defender, dist, basePow) {
        spawn3DProjectile(attacker, 'feather');
    },

    // Construction du modèle 3D articulé
    buildRig(ctx) {
        const { hips, rig, addMesh, bodyMat, darkMat, accentMat, boneMat, eyeMat } = ctx;
        // QUETZALCOATLUS : Le géant ptérosaure azhdarchidé aux ailes immenses et long bec lancéolé
        hips.position.y = 1.95;
        // Torse profilé et caréné
        addMesh(new THREE.BoxGeometry(1.6, 0.85, 0.85), bodyMat, rig.torso, 0, 0.1, 0, 0, 0, 0.32);
        addMesh(new THREE.BoxGeometry(1.2, 0.65, 0.9), darkMat, rig.torso, -0.1, 0, 0, 0, 0, 0.32);

        // Cou très long et gracile (spécificité des Azhdarchidae)
        rig.neck.position.set(0.7, 0.5, 0);
        rig.torso.add(rig.neck);
        addMesh(new THREE.BoxGeometry(0.38, 1.45, 0.38), bodyMat, rig.neck, 0.25, 0.65, 0, 0, 0, -0.22);

        // Tête géante surmontée d'une crête osseuse et armée d'un bec d'1.8 m
        rig.headGroup.position.set(0.45, 1.4, 0);
        rig.neck.add(rig.headGroup);
        addMesh(new THREE.BoxGeometry(0.85, 0.38, 0.35), darkMat, rig.headGroup, 0.2, 0, 0);
        // Immense bec en dague
        addMesh(new THREE.ConeGeometry(0.14, 1.6, 4), boneMat, rig.headGroup, 1.05, -0.1, 0, 0, 0, -Math.PI / 2);
        // Crête céphalique stylisée
        addMesh(new THREE.BoxGeometry(0.7, 0.45, 0.08), accentMat, rig.headGroup, -0.1, 0.32, 0, 0, 0, 0.45);
        addMesh(new THREE.SphereGeometry(0.07, 8, 8), eyeMat, rig.headGroup, 0.25, 0.08, 0.19);
        addMesh(new THREE.SphereGeometry(0.07, 8, 8), eyeMat, rig.headGroup, 0.25, 0.08, -0.19);

        // Ailes articulées géantes (bras de marche repliés au sol ou déployés)
        [-0.65, 0.65].forEach((zOff, wIdx) => {
            const wingArm = new THREE.Group();
            wingArm.position.set(0.45, 0.2, zOff);
            // Bras principal
            addMesh(new THREE.BoxGeometry(0.3, 1.35, 0.25), darkMat, wingArm, 0.1, -0.6, 0, 0, 0, 0.15);
            // Doigt alaire et membrane ptérosaurienne
            const wingMembrane = new THREE.Mesh(new THREE.BoxGeometry(1.65, 1.1, 0.05), accentMat);
            wingMembrane.position.set(0.4, -0.5, 0);
            wingMembrane.rotation.y = (wIdx === 0 ? 0.2 : -0.2);
            wingArm.add(wingMembrane);
            rig.torso.add(wingArm);
            rig.arms.push(wingArm);
        });

        // Queue vestigiale
        const qTail = new THREE.Group();
        qTail.position.set(-0.85, 0, 0);
        addMesh(new THREE.BoxGeometry(0.5, 0.22, 0.22), darkMat, qTail, -0.2, 0, 0);
        rig.torso.add(qTail);
        rig.tailSegments.push(qTail);

        // Longues pattes arrière d'échassier
        [-0.45, 0.45].forEach(z => {
            const leg = new THREE.Group();
            leg.position.set(-0.25, 0, z);
            addMesh(new THREE.BoxGeometry(0.32, 1.2, 0.32), bodyMat, leg, 0, -0.5, 0);
            addMesh(new THREE.BoxGeometry(0.24, 1.1, 0.24), darkMat, leg, 0, -1.45, 0);
            hips.add(leg);
            rig.legs.push(leg);
        });
    },

    // Animation d'attente (idle) / de marche
    animateIdle(ctx) {
        const { rig, baseHipsY, time, isWalk } = ctx;
        // Quetzalcoatlus : Allure d'échassier volant majestueux
        const freq = isWalk ? 8.5 : 2.2;
        rig.hips.position.y = baseHipsY + Math.sin(time * freq) * (isWalk ? 0.15 : 0.04);
        rig.neck.rotation.z = -0.15 + Math.sin(time * 3) * 0.08;
        rig.arms[0].rotation.z = isWalk ? Math.sin(time * freq) * 0.35 : 0.1;
        rig.arms[1].rotation.z = isWalk ? -Math.sin(time * freq) * 0.35 : -0.1;
        rig.legs[0].rotation.z = isWalk ? -Math.sin(time * freq) * 0.45 : 0;
        rig.legs[1].rotation.z = isWalk ? Math.sin(time * freq) * 0.45 : 0;
    },

    hasCustomDirectionals: true,

    // Animations d'attaques claires et distinctes pour chaque coup
    animateAttack(ctx) {
        const { rig, act, prog, swing, strike, baseHipsY } = ctx;
        const s = strike !== undefined ? strike : swing;

        if (act === 'light') {
            // Coup Léger 1 : Estoc rapide du long bec en dague
            rig.neck.rotation.z = -s * 0.85;
            rig.neck.rotation.y = s * 0.25;
            rig.headGroup.rotation.z = -s * 0.45;
        } else if (act === 'light2') {
            // Coup Léger 2 (Combo 1-2) : Estoc croisé opposé avec impulsion de l'aile
            rig.neck.rotation.z = -s * 0.95;
            rig.neck.rotation.y = -s * 0.35;
            rig.headGroup.rotation.z = -s * 0.55;
            rig.arms[1].rotation.y = -s * 0.85;
        } else if (act === 'fwd_light') {
            // Avant + Léger (Poke aérien) : Harponnage maximal à longue portée
            rig.hips.position.x = s * 1.15;
            rig.neck.rotation.z = -s * 1.05;
            rig.headGroup.rotation.z = -s * 0.45;
        } else if (act === 'low_light' || act === 'low_heavy') {
            // Direction BAS ⬇️ (Balayage bas) : Bec au ras du sol et fauchage de l'aile
            rig.hips.position.y = baseHipsY * 0.55;
            rig.neck.rotation.z = -0.95;
            rig.arms[0].rotation.y = s * 1.25;
        } else if (act === 'anti_air' || act === 'up_light') {
            // Direction HAUT ⬆️ (Anti-Air Launcher / Envol vers le ciel) : Bec pointé vers le zénith
            rig.hips.position.y = baseHipsY + s * 1.25;
            rig.neck.rotation.z = s * 0.95;
            rig.headGroup.rotation.z = s * 0.75;
            rig.arms[0].rotation.z = s * 1.5;
            rig.arms[1].rotation.z = -s * 1.5;
        } else if (act === 'back_light') {
            // Direction ARRIÈRE ⬅️ (Battement de recul et estoc de bec défensif)
            rig.hips.position.x = -s * 0.8;
            rig.neck.rotation.z = -s * 0.65;
            rig.arms[0].rotation.y = s * 0.9;
        } else if (act === 'air_light' || act === 'air_heavy') {
            // Piqué plongeant aérien, serres en avant et ailes profilées
            rig.torso.rotation.z = -0.75;
            rig.neck.rotation.z = -s * 1.1;
            rig.arms[0].rotation.y = s * 1.2;
            rig.arms[1].rotation.y = -s * 1.2;
        } else if (act === 'throw') {
            // Saisie au bec et projection en vrille aérienne
            rig.hips.position.x = s * 0.95;
            rig.neck.rotation.z = -s * 0.9;
            rig.arms[0].rotation.y = s * 1.1;
            rig.arms[1].rotation.y = -s * 1.1;
        } else if (act === 'heavy' || act === 'fwd_heavy') {
            // Bourrasque d'ailes dévastatrice
            rig.arms[0].rotation.y = s * 1.45;
            rig.arms[1].rotation.y = -s * 1.45;
            rig.neck.rotation.z = -s * 0.4;
        } else if (act === 'special') {
            // Piqué Sonique
            rig.hips.position.y = baseHipsY + s * 1.5;
            rig.neck.rotation.z = -s * 1.2;
        } else if (act === 'special2') {
            // Bourrasque tourbillonnaire (Ultra)
            rig.arms[0].rotation.z = Math.sin(prog * Math.PI * 8) * 0.9;
            rig.arms[1].rotation.z = -Math.sin(prog * Math.PI * 8) * 0.9;
        }
    },

    // Chorégraphie 3D de la fatalité
    animateFatality(ctx) {
        const { rig, prog, baseHipsY } = ctx;
        rig.hips.position.y = baseHipsY + Math.sin(prog * Math.PI) * 4.5;
        rig.arms[0].rotation.y = Math.sin(prog * Math.PI * 10) * 1.1;
        rig.arms[1].rotation.y = -Math.sin(prog * Math.PI * 10) * 1.1;
    },

    // Script de la fatalité (sons, sang, effets, annonce)
    executeFatality(winner, loser) {
        // 12) QUETZALCOATLUS : Enlèvement aérien et écrasement terminal
        setTimeout(() => {
            if (matchState !== 'fatality_anim') return;
            sfx.playRoar(160, 0.5);
            loser.y = 8;
            spawnFloatingPopup(loser.x, 'CHUTE VERTIGINEUSE !', '#38bdf8');
        }, 1000);
        setTimeout(() => {
            if (matchState !== 'fatality_anim') return;
            loser.y = 0;
            sfx.playBoneCrack();
            sfx.playHit(true);
            loser.flattened = true;
            loser.isDead = true;
            loser.hp = 0;
            spawn3DBloodAndBones(loser.x, 0.5, 80, true);
            screenShake = 1.0;
            showAnnouncer('FATALITY !', 'CHUTE STRATOSPHÉRIQUE DU QUETZALCOATLUS');
        }, 2250);
    },
});
