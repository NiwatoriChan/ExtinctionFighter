/* ============================================================================
 * BOSS FINAL NON JOUABLE : DRAK'ZUL LE DRAGON PRIMORDIAL
 * Boss suprême de la Campagne (affronté après 5 prédateurs aléatoires).
 * Silhouette paléoart draconique : anatomie reptilienne d'archosaure volcanique
 * à écailles d'obsidienne, plastron ventral incandescent magma, grandes ailes
 * membraneuses à 4 doigts osseux et griffe d'alula, crâne cornu et dard caudal.
 * ============================================================================ */

registerBoss({
    id: 'dragon',
    name: "DRAK'ZUL",
    fullName: "Drak'Zul le Dragon Primordial",
    role: "Boss Suprême (Non Jouable)",
    title: "« Le Fléau Incandescent de l'Extinction »",
    primaryColor: 0x2b2726,
    secondaryColor: 0x171413,
    accentColor: 0xea580c,
    cssPrimary: '#ef4444',
    scale: 1.35,
    previewScale: 0.75,
    stats: { pow: 48, spd: 55, def: 40 },
    maxHp: 680,
    walkSpeed: 5.2,
    special1Name: 'Souffle Infernale (H)',
    special2Name: 'Cataclysme Éruptif (T)',
    fatalityName: 'Incinération Suprême (R)',
    moveStyle: 'Posture serpentine colossale, battements d’ailes destructeurs et souffle de magma.',
    fatalityDesc: 'Broie la victime sous son talon draconique et la réduit en cendres par un torrent de feu infernal.',
    isBoss: true,
    skins: [
        { name: 'Volcanic Obsidian', primary: 0x2b2726, secondary: 0x171413, accent: 0xea580c, membrane: 0x5c4030 },
        { name: 'Draconic Magma', primary: 0x7f1d1d, secondary: 0x18181b, accent: 0xf97316, membrane: 0x991b1b },
        { name: 'Abyssal Void', primary: 0x0f172a, secondary: 0x020617, accent: 0xa855f7, membrane: 0x312e81 },
        { name: 'Molten Gold', primary: 0x9a3412, secondary: 0x451a03, accent: 0xfacc15, membrane: 0x78350f }
    ]
}, {
    animBaseHipsY: 2.1,
    attackReach: 3.15,

    onSpecial(attacker, defender, dist, basePow) {
        sfx.playRoar(75, 0.5);
        spawn3DProjectile(attacker, 'dragon_fire');
    },

    onSpecial2(attacker, defender, dist, basePow) {
        screenShake = 0.35;
        spawn3DBloodAndBones(defender.x, 0.3, 10, true);
        if (dist < 4.2) {
            applyDamage(attacker, defender, Math.round(basePow * 0.8), true, 'CATACLYSME DRACONIQUE !');
        }
    },

    buildRig(ctx) {
        const { hips, rig, addMesh, bodyMat, darkMat, accentMat, boneMat, skin, skinMeshes } = ctx;

        const wingMembraneMat = new THREE.MeshStandardMaterial({
            color: skin.membrane || 0x5c4030,
            roughness: 0.75,
            metalness: 0.05,
            side: THREE.DoubleSide
        });
        const hornMat = new THREE.MeshStandardMaterial({ color: 0x38322e, roughness: 0.4, metalness: 0.2 });
        const eyeGlowMat = new THREE.MeshBasicMaterial({ color: 0xff5500 });
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
            return m;
        };
        const membrane = (parent, pts, mat) => {
            const g = new THREE.BufferGeometry();
            g.setAttribute('position', new THREE.Float32BufferAttribute(pts.flat(), 3));
            const idx = [];
            for (let i = 1; i < pts.length - 1; i++) idx.push(0, i, i + 1);
            g.setIndex(idx);
            g.computeVertexNormals();
            const m = addMesh(g, mat, parent);
            skinMeshes.push(m);
            return m;
        };

        hips.position.y = 2.1;

        // =====================================================================
        // 1. TORSE D'ARCHOSAURE VOLCANIQUE : écailles d'obsidienne & plastron magma
        // =====================================================================
        blob(rig.torso, [0.05, 0.22, 0], [1.34, 0.72, 0.66], bodyMat, 0.14);
        blob(rig.torso, [0.68, 0.34, 0], [0.76, 0.68, 0.68], darkMat, 0.22);         // épaules cuirassées
        blob(rig.torso, [-0.58, 0.14, 0], [0.78, 0.62, 0.58], bodyMat, 0.04);        // bassin
        // Plastron ventral segmenté incandescent (sillons de magma)
        for (let v = 0; v < 6; v++) {
            const vx = -0.55 + v * 0.26;
            const vy = -0.22 + v * 0.04;
            blob(rig.torso, [vx, vy, 0], [0.16, 0.28, 0.52 - Math.abs(v - 2.5) * 0.04], accentMat, 0.14);
        }

        // Crête d'ostéodermes dorsaux épineux en basalte
        for (let i = 0; i < 8; i++) {
            const sx = -1.05 + i * 0.28;
            const sy = 0.72 + Math.sin(i * 0.4) * 0.16;
            addMesh(new THREE.ConeGeometry(0.09, 0.36, 5), darkMat, rig.torso, sx, sy, 0, 0, 0, 0.35);
        }

        // =====================================================================
        // 2. GRANDES AILES MEMBRANEUSES ANATOMIQUES À 4 DOIGTS ET ALULA GRIFFUE
        // =====================================================================
        const buildDragonWing = (side) => {
            const wGroup = new THREE.Group();
            wGroup.position.set(0.45, 0.58, side * 0.52);
            rig.torso.add(wGroup);

            const S = [0, 0, 0];
            const E = [-0.28, 0.56, side * 0.45];        // coude
            const W = [0.65, 1.48, side * 0.68];         // poignet haut (sommet de l'aile)

            joint(wGroup, S, 0.16, darkMat);
            bone(wGroup, S, E, 0.14, 0.11, darkMat, 8);
            joint(wGroup, E, 0.12, darkMat);
            bone(wGroup, E, W, 0.11, 0.09, bodyMat, 8);
            joint(wGroup, W, 0.10, darkMat);

            // Griffe d'alula recourbée au poignet (Clawed alula visible sur le paléoart !)
            bone(wGroup, W, [W[0] + 0.24, W[1] - 0.04, W[2]], 0.045, 0.03, hornMat, 5);
            addMesh(new THREE.ConeGeometry(0.035, 0.18, 5), hornMat, wGroup, W[0] + 0.28, W[1] - 0.14, W[2], 0, 0, Math.PI - 0.3);

            // 4 longs doigts osseux déployant la membrane festonnée vers l'arrière
            const F1 = [-1.45, 0.92, side * 0.95];
            const F2 = [-1.62, 0.12, side * 0.88];
            const F3 = [-1.28, -0.58, side * 0.72];
            const F4 = [-0.72, -0.82, side * 0.48];
            const Flank = [-0.95, -0.42, 0];

            [F1, F2, F3, F4].forEach(fTip => {
                bone(wGroup, W, fTip, 0.05, 0.014, hornMat, 6);
            });

            // Membranes entre les doigts et le flanc
            membrane(wGroup, [W, F1, F2], wingMembraneMat);
            membrane(wGroup, [W, F2, F3], wingMembraneMat);
            membrane(wGroup, [W, F3, F4, E], wingMembraneMat);
            membrane(wGroup, [E, F4, Flank, S], wingMembraneMat);
            // Propatagium avant
            membrane(wGroup, [S, W, E], wingMembraneMat);

            return wGroup;
        };

        rig.specialParts.leftWing = buildDragonWing(1);
        rig.specialParts.rightWing = buildDragonWing(-1);

        // =====================================================================
        // 3. COU PUISSANT EN S & CRÂNE DRACONIQUE CORNU
        // =====================================================================
        rig.neck.position.set(1.08, 0.56, 0);
        rig.torso.add(rig.neck);
        const N0 = [0, 0, 0], N1 = [0.32, 0.38, 0], N2 = [0.54, 0.74, 0];
        bone(rig.neck, N0, N1, 0.42, 0.34, bodyMat, 9);
        joint(rig.neck, N1, 0.33, bodyMat);
        bone(rig.neck, N1, N2, 0.33, 0.28, bodyMat, 9);
        // Gorge incandescente magma et épines cervicales
        for (let k = 0; k < 4; k++) {
            const t = k / 3;
            blob(rig.neck, [0.12 + t * 0.42, 0.04 + t * 0.58, 0], [0.12, 0.16, 0.26 - t * 0.04], accentMat, 0.5);
            addMesh(new THREE.ConeGeometry(0.06, 0.24, 5), darkMat, rig.neck, t * 0.45, 0.26 + t * 0.62, 0, 0, 0, 0.45);
        }

        rig.headGroup.position.set(0.56, 0.78, 0);
        rig.neck.add(rig.headGroup);

        // Crâne reptilien cuirassé et museau carnassier
        blob(rig.headGroup, [0.18, 0.08, 0], [0.42, 0.28, 0.32], darkMat, -0.06);
        blob(rig.headGroup, [0.64, 0.04, 0], [0.44, 0.22, 0.24], bodyMat, -0.10);
        blob(rig.headGroup, [0.94, 0.02, 0], [0.22, 0.18, 0.20], darkMat, -0.15);

        // Grandes cornes occipitales courbées vers l'arrière + cornes jugales latérales
        [-1, 1].forEach(side => {
            const H0 = [0.02, 0.24, side * 0.22];
            const H1 = [-0.42, 0.46, side * 0.32];
            const H2 = [-0.88, 0.58, side * 0.36];
            bone(rig.headGroup, H0, H1, 0.09, 0.055, hornMat, 7);
            bone(rig.headGroup, H1, H2, 0.055, 0.01, hornMat, 6);

            // Seconde paire de cornes temporales
            bone(rig.headGroup, [0.06, 0.12, side * 0.28], [-0.45, 0.22, side * 0.44], 0.06, 0.012, hornMat, 6);
            // Épines de mâchoire / pommette
            addMesh(new THREE.ConeGeometry(0.045, 0.18, 5), hornMat, rig.headGroup, 0.12, -0.04, side * 0.32, side * 0.6, 0, 0.8);

            // Yeux ardents sous arcade osseuse
            blob(rig.headGroup, [0.34, 0.18, side * 0.24], [0.18, 0.06, 0.08], hornMat, 0.1);
            addMesh(new THREE.SphereGeometry(0.055, 8, 8), eyeGlowMat, rig.headGroup, 0.36, 0.10, side * 0.26);
            addMesh(new THREE.SphereGeometry(0.026, 6, 6), pupilMat, rig.headGroup, 0.39, 0.10, side * 0.29);
        });

        // Crocs supérieurs
        for (let t = 0; t < 6; t++) {
            const tx = 0.32 + t * 0.12;
            [-1, 1].forEach(side => {
                addMesh(new THREE.ConeGeometry(0.025, 0.14, 5), boneMat, rig.headGroup, tx, -0.12, side * (0.20 - t * 0.01), Math.PI, 0, 0);
            });
        }

        // Mâchoire inférieure et gosier de feu
        rig.jaw.position.set(0.12, -0.12, 0);
        rig.headGroup.add(rig.jaw);
        bone(rig.jaw, [0, 0, 0], [0.82, -0.02, 0], 0.18, 0.11, darkMat, 7);
        blob(rig.jaw, [0.38, 0.04, 0], [0.36, 0.06, 0.14], accentMat);
        for (let t = 0; t < 5; t++) {
            const tx = 0.24 + t * 0.12;
            [-1, 1].forEach(side => {
                addMesh(new THREE.ConeGeometry(0.022, 0.11, 5), boneMat, rig.jaw, tx, 0.06, side * 0.15);
            });
        }

        // =====================================================================
        // 4. MEMBRES ANTÉRIEURS GRIFFUS (rig.arms) & PATTES ARRIÈRE (rig.legs)
        // =====================================================================
        [-1, 1].forEach(side => {
            // Bras / pattes avant puissantes posées ou prêtes à lacérer
            const arm = new THREE.Group();
            arm.position.set(0.78, 0.02, side * 0.54);
            rig.torso.add(arm);
            rig.arms.push(arm);

            const S = [0, 0, 0], E = [-0.14, -0.78, side * 0.06], W = [0.16, -1.68, side * 0.04];
            blob(arm, [-0.04, -0.38, 0], [0.28, 0.46, 0.26], darkMat, -0.15);
            joint(arm, E, 0.18, darkMat);
            bone(arm, E, W, 0.18, 0.13, bodyMat, 8);
            [-0.10, 0, 0.10].forEach(dz => {
                const tip = [W[0] + 0.24, -1.96, W[2] + dz];
                bone(arm, W, tip, 0.045, 0.03, darkMat, 5);
                addMesh(new THREE.ConeGeometry(0.035, 0.15, 5), hornMat, arm, tip[0] + 0.06, tip[1] - 0.02, tip[2], 0, 0, -Math.PI / 2 - 0.25);
            });

            // Pattes arrière digitigrades puissantes (sol à y = -2.1)
            const leg = new THREE.Group();
            leg.position.set(-0.34, 0.04, side * 0.56);
            hips.add(leg);
            rig.legs.push(leg);

            const H = [0, 0, 0], K = [0.24, -0.78, side * 0.04], A = [-0.20, -1.52, side * 0.04], F = [0.12, -2.02, side * 0.04];
            blob(leg, [0.06, -0.38, 0], [0.42, 0.54, 0.34], bodyMat, 0.22);
            joint(leg, K, 0.22, darkMat);
            bone(leg, K, A, 0.21, 0.14, darkMat, 8);
            joint(leg, A, 0.14, darkMat);
            bone(leg, A, F, 0.14, 0.11, bodyMat, 7);
            [-0.12, 0, 0.12].forEach(dz => {
                const tip = [F[0] + 0.32, -2.08, F[2] + dz];
                bone(leg, F, tip, 0.055, 0.038, darkMat, 5);
                addMesh(new THREE.ConeGeometry(0.04, 0.16, 5), hornMat, leg, tip[0] + 0.07, tip[1], tip[2], 0, 0, -Math.PI / 2 - 0.15);
            });
        });

        // =====================================================================
        // 5. LONGUE QUEUE SINUEUSE CRANTÉE À DARD HALLEBARDE (4 segments)
        // =====================================================================
        let parentTail = rig.torso;
        const tLens = [0.92, 0.92, 0.90, 0.95];
        const tRads = [0.46, 0.34, 0.23, 0.13, 0.05];
        for (let s = 0; s < 4; s++) {
            const seg = new THREE.Group();
            seg.position.set(s === 0 ? -1.16 : -tLens[s - 1], s === 0 ? 0.12 : 0, 0);
            const len = tLens[s], r1 = tRads[s], r2 = tRads[s + 1];
            bone(seg, [0, 0, 0], [-len, 0.02, 0], r1, r2, bodyMat, 8);
            // Épines dorsales tout le long de la queue
            [-0.25, -0.58, -0.85].forEach(bx => {
                addMesh(new THREE.ConeGeometry(0.055 - s * 0.01, 0.22 - s * 0.03, 4), darkMat, seg, bx, r1 * 0.75, 0, 0, 0, 0.35);
            });
            parentTail.add(seg);
            rig.tailSegments.push(seg);
            parentTail = seg;
        }
        // Dard caudal barbelé en fer de lance à l'extrémité
        membrane(parentTail, [[-0.65, 0, 0], [-1.05, 0.24, 0], [-1.55, 0.02, 0], [-1.05, -0.20, 0]], darkMat);
        bone(parentTail, [-0.85, 0, 0], [-1.62, 0.02, 0], 0.06, 0.008, hornMat, 6);
    },

    animateIdle(ctx) {
        const { rig, time, isWalk, baseHipsY } = ctx;
        const freq = isWalk ? 10 : 3.2;

        rig.hips.position.y = baseHipsY + Math.sin(time * freq) * (isWalk ? 0.25 : 0.12);
        rig.torso.rotation.z = Math.sin(time * 2.5) * 0.05;
        rig.jaw.rotation.z = -0.12 - Math.abs(Math.sin(time * 2)) * 0.15;

        const wingFlap = Math.sin(time * (isWalk ? 9 : 4.5)) * 0.45;
        if (rig.specialParts.leftWing) rig.specialParts.leftWing.rotation.x = -wingFlap;
        if (rig.specialParts.rightWing) rig.specialParts.rightWing.rotation.x = wingFlap;

        if (rig.legs && rig.legs.length >= 2) {
            rig.legs[0].rotation.z = isWalk ? Math.sin(time * freq) * 0.5 : 0;
            rig.legs[1].rotation.z = isWalk ? -Math.sin(time * freq) * 0.5 : 0;
        }

        rig.tailSegments.forEach((seg, i) => {
            seg.rotation.y = Math.sin(time * 3.5 - i * 0.5) * 0.18;
        });
    },

    hasCustomDirectionals: true,

    animateAttack(ctx) {
        const { rig, act, swing, strike, prog, baseHipsY } = ctx;
        const s = strike !== undefined ? strike : swing;

        if (rig.specialParts.leftWing) rig.specialParts.leftWing.rotation.x = -0.7 - swing * 0.6;
        if (rig.specialParts.rightWing) rig.specialParts.rightWing.rotation.x = 0.7 + swing * 0.6;

        if (act === 'light') {
            rig.torso.rotation.z = -swing * 0.4;
            if (rig.arms[0]) rig.arms[0].rotation.z = swing * 1.25;
            rig.jaw.rotation.z = -swing * 0.65;
        } else if (act === 'light2') {
            rig.torso.rotation.z = swing * 0.4;
            if (rig.arms[1]) rig.arms[1].rotation.z = swing * 1.25;
            rig.jaw.rotation.z = -swing * 0.7;
        } else if (act === 'fwd_light') {
            rig.hips.position.x = swing * 0.9;
            rig.headGroup.rotation.z = -swing * 0.45;
            rig.jaw.rotation.z = -swing * 0.55;
        } else if (act === 'low_light' || act === 'low_heavy') {
            rig.hips.position.y = baseHipsY - swing * 0.35;
            rig.tailSegments.forEach(seg => { seg.rotation.y = -swing * 0.85; });
        } else if (act === 'anti_air' || act === 'up_light') {
            rig.torso.rotation.z = swing * 0.6;
            rig.headGroup.rotation.z = swing * 0.7;
            rig.jaw.rotation.z = -swing * 1.0;
            if (rig.arms[0]) rig.arms[0].rotation.z = -swing * 1.5;
        } else if (act === 'back_light') {
            rig.hips.position.x = -s * 0.8;
            if (rig.arms[0]) rig.arms[0].rotation.z = s * 1.1;
        } else if (act === 'air_light' || act === 'air_heavy') {
            rig.torso.rotation.z = -swing * 0.7;
            rig.legs.forEach(l => { l.rotation.z = swing * 1.1; });
        } else if (act === 'fwd_heavy') {
            rig.hips.position.x = swing * 1.2;
            rig.torso.rotation.z = -swing * 0.5;
            if (rig.arms[0]) rig.arms[0].rotation.z = swing * 1.4;
            if (rig.arms[1]) rig.arms[1].rotation.z = swing * 1.4;
        } else if (act === 'throw') {
            if (rig.specialParts.leftWing) rig.specialParts.leftWing.rotation.x = 0.5;
            if (rig.specialParts.rightWing) rig.specialParts.rightWing.rotation.x = -0.5;
            rig.jaw.rotation.z = -0.85;
        } else if (act === 'throw_whiff') {
            rig.hips.position.x = swing * 0.4;
            rig.jaw.rotation.z = -0.3;
        } else if (act === 'heavy') {
            rig.hips.rotation.y = prog * Math.PI * 2;
            rig.tailSegments.forEach(seg => { seg.rotation.y = 0.45; });
        } else if (act === 'special' || act === 'special2') {
            rig.torso.rotation.z = swing * 0.4;
            rig.headGroup.rotation.z = -0.3 + swing * 0.7;
            rig.jaw.rotation.z = -0.85;
        } else {
            rig.torso.rotation.z = swing * 0.3;
        }
    },

    animateFatality(ctx) {
        const { rig, prog } = ctx;
        if (prog < 0.35) {
            rig.hips.position.y = 2.8;
            rig.torso.rotation.z = 0.3;
            if (rig.specialParts.leftWing) rig.specialParts.leftWing.rotation.x = -1.1;
            if (rig.specialParts.rightWing) rig.specialParts.rightWing.rotation.x = 1.1;
        } else if (prog < 0.75) {
            rig.hips.position.y = 1.8;
            rig.headGroup.rotation.z = -0.55;
            rig.jaw.rotation.z = -0.9;
        } else {
            rig.hips.position.y = 2.1;
            rig.headGroup.rotation.z = 0.6;
            rig.jaw.rotation.z = -0.75;
        }
    },

    executeFatality(winner, loser) {
        setTimeout(() => {
            if (matchState !== 'fatality_anim') return;
            sfx.playRoar(45, 1.1);
            spawnFloatingPopup(loser.x, 'SOUFFLE INFERNAL !', '#f97316');
            spawn3DBloodAndBones(loser.x, 2.2, 45, true);
        }, 900);

        setTimeout(() => {
            if (matchState !== 'fatality_anim') return;
            sfx.playBoneCrack();
            sfx.playHit(true);
            loser.flattened = true;
            loser.isDead = true;
            loser.hp = 0;
            spawn3DBloodAndBones(loser.x, 0.8, 85, true);
            screenShake = 1.2;
            showAnnouncer('FATALITY !', 'DRAK\'ZUL RÉDUIT SA PROIE EN CENDRES');
        }, 2200);
    }
});
