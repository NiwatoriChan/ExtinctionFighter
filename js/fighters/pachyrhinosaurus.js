/* ============================================================================
 * COMBATTANT : PACHYRHINOSAURE (Pachyrhinosaurus Canadensis)
 * Données (stats, skins, textes), modèle 3D, animations, coups spéciaux & fatalité.
 * Silhouette paléoart : cératopsien centrosauriné robuste, bec de perroquet crochu,
 * épaisse bosse nasale calleuse (nasal boss), bosses supraorbitaires, grande
 * collerette osseuse festonnée couronnée de deux cornes recourbées vers l'extérieur.
 * ============================================================================ */

registerFighter({
    id: 'pachyrhino',
    name: 'PACHYRHINOSAURE',
    fullName: 'Pachyrhinosaurus Canadensis',
    role: 'Bélier Blindé',
    title: '« Le Colosse à Bosse d’Acier »',
    primaryColor: 0x8f7960,
    secondaryColor: 0x4f4132,
    accentColor: 0xc9b293,
    cssPrimary: '#d97706',
    scale: 1.0,
    previewScale: 0.92,
    stats: { pow: 88, spd: 76, def: 92 },
    maxHp: 1100,
    walkSpeed: 8.2,
    special1Name: 'Charge Boréale (H)',
    special2Name: 'Cornes Sismiques (T)',
    fatalityName: 'Impact Crânien Polaire (R)',
    moveStyle: 'Trot quadrupède puissant, coup de bosse nasale et soulèvement de collerette.',
    fatalityDesc: 'Gratte le sol, charge à vitesse supersonique avec sa bosse nasale blindée, pulvérise le torse ennemi et empale son crâne.',
    skins: [
        { name: 'Alberta Centrosaur', primary: 0x8f7960, secondary: 0x4f4132, accent: 0xc9b293, belly: 0xb5a188 },
        { name: 'Tundra Brawler', primary: 0xd97706, secondary: 0x78350f, accent: 0x38bdf8, belly: 0xfde68a },
        { name: 'Glacial Frost', primary: 0x0284c7, secondary: 0x0369a1, accent: 0xe0f2fe, belly: 0xbae6fd },
        { name: 'Volcanic Basalt', primary: 0x27272a, secondary: 0x18181b, accent: 0xf97316, belly: 0x52525b },
        { name: 'Emerald Moss', primary: 0x15803d, secondary: 0x166534, accent: 0xfacc15, belly: 0x86efac }
    ]
}, {
    animBaseHipsY: 1.65,

    onSpecial2(attacker, defender, dist, basePow) {
        special2SeismicQuake(attacker, defender, dist, basePow);
    },

    buildRig(ctx) {
        const { hips, rig, addMesh, bodyMat, darkMat, accentMat, boneMat, skin, skinMeshes } = ctx;
        void accentMat;
        void boneMat;

        const bellyMat = new THREE.MeshStandardMaterial({ color: skin.belly || 0xb5a188, roughness: 0.75 });
        const hornMat = new THREE.MeshStandardMaterial({ color: skin.accent || 0xc9b293, roughness: 0.4, metalness: 0.05 });
        const beakMat = new THREE.MeshStandardMaterial({ color: 0x3f362d, roughness: 0.45 });
        const irisMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
        const pupilMat = new THREE.MeshBasicMaterial({ color: 0x09090b });

        const UP = new THREE.Vector3(0, 1, 0);
        const bone = (parent, a, b, r1, r2, mat, seg = 8) => {
            const A = new THREE.Vector3(a[0], a[1], a[2]);
            const B = new THREE.Vector3(b[0], b[1], b[2]);
            const dir = B.clone().sub(A);
            const len = dir.length();
            const m = addMesh(new THREE.CylinderGeometry(r2, r1, len, seg), mat, parent,
                (A.x + B.x) / 2, (A.y + B.y) / 2, (A.z + B.z) / 2);
            m.quaternion.setFromUnitVectors(UP, dir.normalize());
            return m;
        };
        const joint = (parent, p, r, mat) => addMesh(new THREE.SphereGeometry(r, 10, 8), mat, parent, p[0], p[1], p[2]);
        const blob = (parent, p, s, mat, rz = 0, ry = 0, rx = 0) => {
            const m = addMesh(new THREE.SphereGeometry(1, 14, 10), mat, parent, p[0], p[1], p[2], rx, ry, rz);
            m.scale.set(s[0], s[1], s[2]);
            if (mat === bellyMat || mat === hornMat) skinMeshes.push(m);
            return m;
        };

        hips.position.y = 1.65;

        // =====================================================================
        // 1. CORPS DE CÉRATOPSIEN : dos bombé sur le bassin, poitrail puissant
        // =====================================================================
        blob(rig.torso, [-0.08, 0.24, 0], [1.28, 0.82, 0.78], bodyMat, -0.08);
        blob(rig.torso, [-0.52, 0.32, 0], [0.85, 0.78, 0.72], bodyMat, 0.05);
        blob(rig.torso, [0.68, 0.14, 0], [0.76, 0.72, 0.72], bodyMat, -0.15);
        blob(rig.torso, [-0.05, 0.68, 0], [1.18, 0.36, 0.56], darkMat, -0.08);
        blob(rig.torso, [0.05, -0.22, 0], [1.12, 0.42, 0.64], bellyMat, -0.05);

        // =====================================================================
        // 2. COU MASSIF & TÊTE À COLLERETTE ET BOSSE NASALE (PACHYRHINOSAURUS)
        // =====================================================================
        rig.neck.position.set(1.12, 0.18, 0);
        rig.torso.add(rig.neck);
        bone(rig.neck, [-0.1, 0, 0], [0.28, 0.04, 0], 0.52, 0.46, bodyMat, 9);
        blob(rig.neck, [0.14, -0.16, 0], [0.36, 0.28, 0.36], bellyMat);

        rig.headGroup.position.set(0.26, 0.04, 0);
        rig.neck.add(rig.headGroup);

        // Grande collerette pariéto-squamosale inclinée vers l'arrière et le haut
        const frill = new THREE.Group();
        frill.position.set(-0.02, 0.24, 0);
        frill.rotation.z = 0.48;
        rig.headGroup.add(frill);

        // Bouclier de la collerette (deux lobes latéraux et crête médiane)
        blob(frill, [0, 0.36, 0], [0.14, 0.68, 0.76], bodyMat);
        blob(frill, [0.03, 0.38, 0.34], [0.12, 0.54, 0.36], darkMat);
        blob(frill, [0.03, 0.38, -0.34], [0.12, 0.54, 0.36], darkMat);
        // Bordure osseuse festonnée (époccipitaux)
        for (let a = -2; a <= 2; a++) {
            const ang = a * 0.45;
            const fz = Math.sin(ang) * 0.74;
            const fy = 0.38 + Math.cos(ang) * 0.56;
            addMesh(new THREE.ConeGeometry(0.065, 0.18, 5), hornMat, frill, 0, fy, fz, ang * 0.7, 0, -0.2);
        }

        // Deux grandes cornes pariétales recourbées au sommet de la collerette + corne médiane vers l'avant
        [-1, 1].forEach(side => {
            const H0 = [0, 0.94, side * 0.18];
            const H1 = [-0.14, 1.18, side * 0.42];
            const H2 = [-0.28, 1.06, side * 0.62];
            bone(frill, H0, H1, 0.09, 0.055, hornMat, 6);
            bone(frill, H1, H2, 0.055, 0.012, hornMat, 6);
            // Corne jugale (pommette)
            addMesh(new THREE.ConeGeometry(0.065, 0.22, 5), hornMat, rig.headGroup, 0.16, -0.14, side * 0.46, side * 1.25, 0, 0.2);
        });
        // Corne centrale incurvée vers l'avant au milieu de la collerette
        bone(frill, [0.04, 0.78, 0], [0.34, 0.96, 0], 0.075, 0.015, hornMat, 6);

        // Crâne facial & museau haut de cératopsien
        blob(rig.headGroup, [0.36, 0.02, 0], [0.46, 0.34, 0.36], bodyMat, -0.08);
        blob(rig.headGroup, [0.76, -0.06, 0], [0.38, 0.28, 0.26], bodyMat, -0.18);

        // LA BOSSE NASALE MASSIVE ET RUGUEUSE (Nasal Boss emblématique de Pachyrhinosaurus)
        const boss = new THREE.Group();
        boss.position.set(0.74, 0.20, 0);
        blob(boss, [0, 0, 0], [0.34, 0.18, 0.25], hornMat, -0.15);
        blob(boss, [-0.10, 0.06, 0], [0.24, 0.15, 0.22], darkMat, -0.10);
        blob(boss, [0.14, -0.02, 0], [0.20, 0.14, 0.20], hornMat, -0.25);
        rig.headGroup.add(boss);
        rig.specialParts.nasalBoss = boss;

        // Bosses supraorbitaires et yeux
        [-1, 1].forEach(side => {
            blob(rig.headGroup, [0.34, 0.24, side * 0.26], [0.18, 0.10, 0.12], hornMat, 0.2);
            addMesh(new THREE.SphereGeometry(0.052, 8, 8), irisMat, rig.headGroup, 0.36, 0.10, side * 0.34);
            addMesh(new THREE.SphereGeometry(0.026, 6, 6), pupilMat, rig.headGroup, 0.38, 0.10, side * 0.37);
            // Grande narine basse devant la bosse
            blob(rig.headGroup, [0.88, -0.02, side * 0.21], [0.10, 0.06, 0.04], darkMat);
        });

        // Bec rostral crochu de perroquet (haut et pointu)
        blob(rig.headGroup, [1.04, -0.14, 0], [0.18, 0.22, 0.15], beakMat, -0.35);
        addMesh(new THREE.ConeGeometry(0.08, 0.24, 5), beakMat, rig.headGroup, 1.12, -0.28, 0, 0, 0, Math.PI - 0.25);

        // Mâchoire inférieure et bec prédentaire
        rig.jaw.position.set(0.24, -0.22, 0);
        rig.headGroup.add(rig.jaw);
        blob(rig.jaw, [0.32, -0.02, 0], [0.36, 0.13, 0.22], bellyMat, -0.05);
        blob(rig.jaw, [0.68, -0.02, 0], [0.16, 0.14, 0.14], beakMat, 0.25);

        // =====================================================================
        // 3. QUEUE TRAPUE ET TOMBANTE DE CÉRATOPSIEN (3 segments)
        // =====================================================================
        let pTail = rig.torso;
        const tLens = [0.62, 0.58, 0.55];
        const tRads = [0.42, 0.28, 0.16, 0.05];
        for (let s = 0; s < 3; s++) {
            const seg = new THREE.Group();
            seg.position.set(s === 0 ? -1.12 : -tLens[s - 1], s === 0 ? 0.14 : -0.08, 0);
            const len = tLens[s], r1 = tRads[s], r2 = tRads[s + 1];
            bone(seg, [0, 0, 0], [-len, -0.08, 0], r1, r2, bodyMat, 8);
            bone(seg, [0, -r1 * 0.35, 0], [-len, -0.08 - r2 * 0.35, 0], r1 * 0.65, r2 * 0.6, bellyMat, 7);
            pTail.add(seg);
            rig.tailSegments.push(seg);
            pTail = seg;
        }

        // =====================================================================
        // 4. QUATRE PATTES MUSCLÉES DE BÉLIER (sol à y = -1.65)
        // =====================================================================
        [
            { x: 0.78, z: -0.56, isFront: true },
            { x: 0.78, z: 0.56, isFront: true },
            { x: -0.74, z: -0.58, isFront: false },
            { x: -0.74, z: 0.58, isFront: false }
        ].forEach(pos => {
            const leg = new THREE.Group();
            leg.position.set(pos.x, -0.04, pos.z);
            hips.add(leg);
            rig.legs.push(leg);

            const side = Math.sign(pos.z);
            const K = [pos.isFront ? -0.14 : 0.16, -0.76, side * 0.05];
            const F = [0.08, -1.52, side * 0.04];

            blob(leg, [0.02, -0.38, 0], [pos.isFront ? 0.32 : 0.38, 0.50, 0.28], bodyMat, pos.isFront ? -0.22 : 0.18);
            joint(leg, K, 0.20, bodyMat);
            bone(leg, K, F, 0.20, 0.15, darkMat, 8);
            blob(leg, [0.16, -1.55, side * 0.04], [0.24, 0.10, 0.22], darkMat);
            [-0.11, -0.03, 0.04, 0.11].forEach(dz => {
                addMesh(new THREE.ConeGeometry(0.035, 0.10, 5), hornMat, leg, 0.34, -1.57, side * 0.04 + dz, 0, 0, -Math.PI / 2 - 0.2);
            });
        });
    },

    animateIdle(ctx) {
        const { rig, baseHipsY, time, isWalk } = ctx;
        const freq = isWalk ? 13 : 4;
        rig.hips.position.y = baseHipsY + Math.abs(Math.sin(time * freq)) * (isWalk ? 0.15 : 0.04);
        rig.headGroup.rotation.z = isWalk ? -0.18 + Math.sin(time * freq) * 0.1 : Math.sin(time * 3.5) * 0.08;
        const s = isWalk ? Math.sin(time * freq) * 0.45 : 0;
        rig.legs[0].rotation.z = s;
        rig.legs[3].rotation.z = s;
        rig.legs[1].rotation.z = -s;
        rig.legs[2].rotation.z = -s;
    },

    hasCustomDirectionals: true,

    animateAttack(ctx) {
        const { rig, act, prog, swing, strike, baseHipsY } = ctx;
        const s = strike !== undefined ? strike : swing;

        if (act === 'light') {
            rig.headGroup.rotation.z = s * 0.75;
            rig.headGroup.rotation.y = s * 0.35;
        } else if (act === 'light2') {
            rig.headGroup.rotation.z = s * 0.85;
            rig.headGroup.rotation.y = -s * 0.45;
        } else if (act === 'fwd_light') {
            rig.hips.position.x = s * 0.95;
            rig.torso.rotation.z = -s * 0.35;
            rig.headGroup.rotation.z = -0.3 + s * 0.65;
        } else if (act === 'low_light' || act === 'low_heavy') {
            rig.hips.position.y = (baseHipsY || 1.65) * 0.58;
            rig.headGroup.rotation.z = -0.65 + s * 0.45;
            rig.headGroup.rotation.y = Math.cos(prog * Math.PI) * 0.65;
        } else if (act === 'anti_air' || act === 'up_light') {
            rig.hips.position.y = (baseHipsY || 1.65) + s * 0.65;
            rig.torso.rotation.z = s * 0.55;
            rig.headGroup.rotation.z = s * 1.05;
        } else if (act === 'back_light') {
            rig.hips.position.x = -s * 0.7;
            rig.headGroup.rotation.z = s * 0.55;
        } else if (act === 'throw') {
            rig.hips.position.x = s * 0.85;
            rig.headGroup.rotation.z = prog < 0.35 ? -0.45 : 0.85;
        } else if (act === 'air_light' || act === 'air_heavy') {
            rig.torso.rotation.z = -s * 0.5;
            rig.headGroup.rotation.z = -0.5 - s * 0.4;
        } else if (act === 'heavy' || act === 'fwd_heavy' || act === 'special') {
            rig.hips.position.x = s * (act === 'fwd_heavy' ? 1.35 : 0.85);
            rig.torso.rotation.z = -s * 0.25;
            rig.headGroup.rotation.z = -0.45 + s * 0.65;
        } else if (act === 'special2') {
            rig.torso.rotation.z = Math.sin(prog * Math.PI * 2) * 0.38;
            rig.legs[0].rotation.z = s * 0.8;
            rig.legs[1].rotation.z = s * 0.8;
        }
    },

    animateFatality(ctx) {
        const { rig, prog } = ctx;
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

    executeFatality(winner, loser) {
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
