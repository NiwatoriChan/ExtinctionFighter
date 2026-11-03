/* ============================================================================
 * COMBATTANT : THÉRIZINOSAURE (Therizinosaurus Cheloniformis)
 * Données (stats, skins, textes), modèle 3D, animations, coups spéciaux & fatalité.
 * Silhouette paléoart : posture bipède dressée à abdomen rebondi, plumage dense
 * brun et collier crème, très long cou en S emplumé, petite tête à bec corné,
 * bras emplumés et 3 gigantesques griffes-faux courbées d'un mètre par main.
 * ============================================================================ */

registerFighter({
    id: 'therizino',
    name: 'THÉRIZINOSAURE',
    fullName: 'Therizinosaurus Cheloniformis',
    role: 'Faucheuse Préhistorique',
    title: '« Les Lames Vivantes de Mongolie »',
    primaryColor: 0x6e4e37,
    secondaryColor: 0x362417,
    accentColor: 0xd6c7b2,
    cssPrimary: '#0d9488',
    scale: 1.05,
    previewScale: 0.92,
    stats: { pow: 97, spd: 75, def: 82 },
    maxHp: 1040,
    walkSpeed: 7.9,
    special1Name: 'Croix de Faucheuse (H)',
    special2Name: 'Tourbillon de Lames (T)',
    fatalityName: 'Découpe Chirurgicale (R)',
    moveStyle: 'Posture droite de bretteur préhistorique, grands coups de faux croisés et tourbillon tranchant.',
    fatalityDesc: 'Croise ses griffes géantes d’un mètre et exécute trois entailles fulgurantes en X qui découpent la cible et font voler sa tête.',
    skins: [
        { name: 'Nemegt Plumage', primary: 0x6e4e37, secondary: 0x362417, accent: 0xd6c7b2, claw: 0xd4c5a9 },
        { name: 'Obsidian Scythe', primary: 0x0d9488, secondary: 0x134e4a, accent: 0x2dd4bf, claw: 0xfef3c7 },
        { name: 'Crimson Reaver', primary: 0x991b1b, secondary: 0x450a0a, accent: 0xef4444, claw: 0xe7e5e4 },
        { name: 'Verdant Harvester', primary: 0x15803d, secondary: 0x14532d, accent: 0x22c55e, claw: 0xfef08a },
        { name: 'Gold Plumed', primary: 0xa16207, secondary: 0x713f12, accent: 0xfbbf24, claw: 0xffffff }
    ]
}, {
    animBaseHipsY: 2.15,

    onSpecial2(attacker, defender, dist, basePow) {
        spawn3DProjectile(attacker, 'boulder');
    },

    buildRig(ctx) {
        const { hips, rig, addMesh, bodyMat, darkMat, accentMat, boneMat, skin, skinMeshes } = ctx;

        const scytheMat = new THREE.MeshStandardMaterial({ color: skin.claw || 0xd4c5a9, roughness: 0.3, metalness: 0.15 });
        const scytheTipMat = new THREE.MeshStandardMaterial({ color: 0x292524, roughness: 0.35 });
        const beakMat = new THREE.MeshStandardMaterial({ color: 0xc29b61, roughness: 0.45 });
        const legScaleMat = new THREE.MeshStandardMaterial({ color: 0x574c3f, roughness: 0.7 });
        const irisMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
        const pupilMat = new THREE.MeshBasicMaterial({ color: 0x09090b });
        void boneMat;

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
            if (mat === accentMat) skinMeshes.push(m);
            return m;
        };

        hips.position.y = 2.15;

        // =====================================================================
        // 1. TORSE : posture redressée à large abdomen rebondi et collier clair
        // =====================================================================
        blob(rig.torso, [-0.08, 0.25, 0], [1.18, 0.86, 0.82], bodyMat, 0.52);     // abdomen massif emplumé
        blob(rig.torso, [0.42, 0.72, 0], [0.72, 0.62, 0.68], darkMat, 0.45);      // haut du dos et épaules
        blob(rig.torso, [0.05, 0.05, 0], [0.95, 0.65, 0.75], accentMat, 0.48);    // ventre duveteux crème
        // Bande / collier de plumes claires en écharpe sur l'épaule (comme sur le paléoart)
        blob(rig.torso, [0.52, 0.76, 0], [0.32, 0.52, 0.71], accentMat, -0.35);

        // Touffes de plumes sur la croupe
        for (let i = 0; i < 5; i++) {
            blob(rig.torso, [-0.35 - i * 0.16, 0.55 - i * 0.12, 0], [0.28, 0.12, 0.45 - i * 0.05], darkMat, 0.35);
        }

        // =====================================================================
        // 2. LONG COU EN S EMPLUMÉ À CRINIÈRE DORSALE
        // =====================================================================
        rig.neck.position.set(0.62, 0.96, 0);
        rig.torso.add(rig.neck);
        const N0 = [0, 0, 0], N1 = [0.24, 0.62, 0], N2 = [0.32, 1.25, 0];
        bone(rig.neck, N0, N1, 0.36, 0.26, bodyMat, 9);
        joint(rig.neck, N1, 0.26, bodyMat);
        bone(rig.neck, N1, N2, 0.26, 0.19, bodyMat, 9);
        // Gorge claire et crinière de plumes sombres le long de la nuque
        bone(rig.neck, [0.08, -0.02, 0], [0.38, 1.18, 0], 0.24, 0.13, accentMat, 8);
        for (let f = 0; f < 7; f++) {
            const t = f / 6;
            blob(rig.neck, [0.04 + t * 0.18, 0.18 + t * 1.05, 0], [0.18, 0.07, 0.14], darkMat, 0.45);
        }

        // =====================================================================
        // 3. PETITE TÊTE PROFILÉE À BEC KÉRATINEUX
        // =====================================================================
        rig.headGroup.position.set(0.34, 1.30, 0);
        rig.neck.add(rig.headGroup);

        blob(rig.headGroup, [0.08, 0.04, 0], [0.32, 0.21, 0.20], bodyMat, -0.08);
        blob(rig.headGroup, [0.14, 0.04, 0], [0.22, 0.16, 0.21], accentMat, -0.05); // masque facial clair
        // Houppette de plumes hérissées sur la nuque
        for (let c = 0; c < 4; c++) {
            blob(rig.headGroup, [-0.08 - c * 0.07, 0.18 - c * 0.02, 0], [0.16, 0.05, 0.08], darkMat, 0.35);
        }
        // Bec supérieur crochu
        bone(rig.headGroup, [0.28, 0.02, 0], [0.58, -0.04, 0], 0.11, 0.03, beakMat, 6);
        addMesh(new THREE.ConeGeometry(0.035, 0.12, 5), scytheTipMat, rig.headGroup, 0.60, -0.06, 0, 0, 0, -Math.PI / 2 - 0.35);

        // Yeux entourés de peau claire
        [-1, 1].forEach(side => {
            addMesh(new THREE.SphereGeometry(0.048, 8, 8), irisMat, rig.headGroup, 0.18, 0.07, side * 0.18);
            addMesh(new THREE.SphereGeometry(0.025, 6, 6), pupilMat, rig.headGroup, 0.20, 0.07, side * 0.21);
        });

        // Mâchoire inférieure
        rig.jaw.position.set(0.12, -0.08, 0);
        rig.headGroup.add(rig.jaw);
        bone(rig.jaw, [0, 0, 0], [0.42, -0.02, 0], 0.08, 0.025, beakMat, 6);

        // =====================================================================
        // 4. BRAS EMPLUMÉS ET 3 FAUX D'UN MÈTRE PAR MAIN
        // =====================================================================
        [-1, 1].forEach(side => {
            const arm = new THREE.Group();
            arm.position.set(0.48, 0.56, side * 0.58);
            rig.torso.add(arm);
            rig.arms.push(arm);

            const S = [0, 0, 0];
            const E = [0.18, -0.46, side * 0.08];
            const W = [0.68, -0.58, side * 0.04];

            blob(arm, [0.08, -0.22, side * 0.04], [0.22, 0.32, 0.18], darkMat, -0.35);
            bone(arm, S, E, 0.16, 0.13, darkMat, 8);
            joint(arm, E, 0.13, bodyMat);
            bone(arm, E, W, 0.13, 0.10, bodyMat, 8);
            // Frange de plumes d'avant-bras (rémiges primitives)
            blob(arm, [0.36, -0.62, side * 0.06], [0.34, 0.16, 0.10], bodyMat, -0.25);
            blob(arm, [0.26, -0.70, side * 0.06], [0.28, 0.12, 0.09], accentMat, -0.30);

            // 3 immenses griffes en faux recourbées (doigt I, II, III)
            [-0.12, 0, 0.12].forEach((cz, cIdx) => {
                const scaleLen = cIdx === 1 ? 1.12 : (cIdx === 0 ? 1.02 : 0.88);
                const C0 = [W[0] + 0.06, W[1] - 0.02, W[2] + cz];
                const C1 = [C0[0] + 0.42 * scaleLen, C0[1] - 0.18 * scaleLen, C0[2]];
                const C2 = [C1[0] + 0.36 * scaleLen, C1[1] - 0.36 * scaleLen, C0[2]];
                const C3 = [C2[0] + 0.18 * scaleLen, C2[1] - 0.38 * scaleLen, C0[2]];

                joint(arm, C0, 0.055, darkMat);
                bone(arm, C0, C1, 0.048, 0.036, scytheMat, 6);
                bone(arm, C1, C2, 0.036, 0.022, scytheMat, 6);
                bone(arm, C2, C3, 0.022, 0.004, scytheTipMat, 5);
            });
        });

        // =====================================================================
        // 5. QUEUE TOUFFUE EMPLUMÉE (3 segments)
        // =====================================================================
        let pTail = rig.torso;
        for (let s = 0; s < 3; s++) {
            const seg = new THREE.Group();
            seg.position.set(s === 0 ? -0.95 : -0.68, s === 0 ? -0.18 : -0.05, 0);
            const r1 = 0.42 - s * 0.11, r2 = 0.31 - s * 0.10;
            bone(seg, [0, 0, 0], [-0.72, -0.06, 0], r1, r2, bodyMat, 8);
            // Panache de longues plumes caudales
            blob(seg, [-0.38, 0.04, 0], [0.46, r1 * 0.75, r1 * 1.15], s === 2 ? darkMat : bodyMat, 0.12);
            if (s === 2) {
                [-0.14, 0, 0.14].forEach(fz => {
                    blob(seg, [-0.75, -0.06, fz], [0.42, 0.08, 0.12], darkMat, 0.08, fz * 0.5);
                });
            }
            pTail.add(seg);
            rig.tailSegments.push(seg);
            pTail = seg;
        }

        // =====================================================================
        // 6. PATTES ARRIÈRE ROBUSTES À 4 ORTEILS (sol à y = -2.15)
        // =====================================================================
        [-1, 1].forEach(side => {
            const leg = new THREE.Group();
            leg.position.set(-0.18, 0.0, side * 0.48);
            hips.add(leg);
            rig.legs.push(leg);

            const H = [0, 0, 0], K = [0.22, -0.82, side * 0.04], A = [-0.14, -1.58, side * 0.04], F = [0.12, -2.06, side * 0.05];
            // Cuisse emplumée large
            blob(leg, [0.06, -0.42, 0], [0.40, 0.54, 0.34], bodyMat, 0.2);
            blob(leg, [0.10, -0.68, 0], [0.28, 0.26, 0.26], accentMat, 0.15);
            joint(leg, K, 0.19, bodyMat);
            bone(leg, K, A, 0.18, 0.12, legScaleMat, 8);
            joint(leg, A, 0.12, legScaleMat);
            bone(leg, A, F, 0.11, 0.10, legScaleMat, 7);

            // 4 orteils porteurs caractéristiques des thérizinosauridés
            [-0.14, -0.05, 0.05, 0.14].forEach((dz, i) => {
                const tip = [F[0] + (i === 1 || i === 2 ? 0.36 : 0.28), -2.12, F[2] + dz];
                bone(leg, F, tip, 0.048, 0.035, legScaleMat, 5);
                addMesh(new THREE.ConeGeometry(0.032, 0.14, 5), scytheTipMat, leg,
                    tip[0] + 0.06, tip[1], tip[2], 0, 0, -Math.PI / 2 - 0.2);
            });
        });
    },

    animateIdle(ctx) {
        const { rig, baseHipsY, time, isWalk } = ctx;
        const freq = isWalk ? 11.5 : 3.8;
        rig.hips.position.y = baseHipsY + Math.abs(Math.sin(time * freq)) * (isWalk ? 0.18 : 0.05);
        rig.arms[0].rotation.y = Math.sin(time * 4) * 0.22;
        rig.arms[1].rotation.y = -Math.sin(time * 4) * 0.22;
        rig.arms[0].rotation.z = 0.15 + Math.sin(time * 3) * 0.1;
        rig.arms[1].rotation.z = 0.15 - Math.sin(time * 3) * 0.1;
        rig.legs[0].rotation.z = isWalk ? Math.sin(time * freq) * 0.55 : 0;
        rig.legs[1].rotation.z = isWalk ? -Math.sin(time * freq) * 0.55 : 0;
    },

    hasCustomDirectionals: true,

    animateAttack(ctx) {
        const { rig, act, prog, swing, strike, baseHipsY } = ctx;
        const s = strike !== undefined ? strike : swing;

        if (act === 'light') {
            rig.arms[0].rotation.y = s * 1.25;
            rig.arms[0].rotation.z = -s * 0.75;
            rig.arms[1].rotation.z = s * 0.25;
            rig.torso.rotation.y = s * 0.35;
        } else if (act === 'light2') {
            rig.arms[0].rotation.z = s * 0.25;
            rig.arms[1].rotation.y = -s * 1.35;
            rig.arms[1].rotation.z = -s * 0.85;
            rig.torso.rotation.y = -s * 0.45;
        } else if (act === 'fwd_light') {
            rig.hips.position.x = s * 0.95;
            rig.torso.rotation.z = -s * 0.38;
            rig.arms[0].rotation.z = -s * 1.1;
            rig.arms[1].rotation.z = -s * 1.1;
        } else if (act === 'low_light' || act === 'low_heavy') {
            rig.hips.position.y = (baseHipsY || 2.15) * 0.55;
            rig.torso.rotation.z = -0.32;
            rig.arms[0].rotation.y = s * 1.45;
            rig.arms[1].rotation.y = -s * 1.45;
        } else if (act === 'anti_air' || act === 'up_light') {
            rig.hips.position.y = (baseHipsY || 2.15) + s * 0.75;
            rig.torso.rotation.z = s * 0.55;
            rig.arms[0].rotation.z = s * 1.6;
            rig.arms[1].rotation.z = s * 1.6;
            rig.headGroup.rotation.z = s * 0.55;
        } else if (act === 'back_light') {
            rig.hips.position.x = -s * 0.75;
            rig.arms[0].rotation.z = -s * 0.9;
            rig.arms[1].rotation.z = -s * 0.9;
        } else if (act === 'throw') {
            rig.hips.position.x = s * 0.85;
            rig.arms[0].rotation.z = Math.sin(prog * 20) * 0.85;
            rig.arms[1].rotation.z = Math.sin(prog * 20) * 0.85;
        } else if (act === 'air_light' || act === 'air_heavy') {
            rig.torso.rotation.z = -s * 0.65;
            rig.arms[0].rotation.z = -s * 1.5;
            rig.arms[1].rotation.z = -s * 1.5;
        } else if (act === 'heavy' || act === 'fwd_heavy') {
            rig.hips.position.x = s * (act === 'fwd_heavy' ? 1.25 : 0.5);
            rig.torso.rotation.z = -s * 0.38;
            rig.arms[0].rotation.z = Math.cos(prog * Math.PI) * 1.35;
            rig.arms[1].rotation.z = Math.cos(prog * Math.PI) * 1.35;
        } else if (act === 'special') {
            rig.torso.rotation.z = -s * 0.3;
            rig.arms[0].rotation.z = Math.cos(prog * Math.PI) * 1.2;
            rig.arms[1].rotation.z = Math.cos(prog * Math.PI) * 1.2;
        } else if (act === 'special2') {
            rig.hips.rotation.y = prog * Math.PI * 4;
            rig.arms[0].rotation.x = -0.75;
            rig.arms[1].rotation.x = 0.75;
        }
    },

    animateFatality(ctx) {
        const { rig, prog } = ctx;
        const slashWave = Math.sin(prog * Math.PI * 6);
        rig.torso.rotation.y = slashWave * 0.55;
        rig.arms[0].rotation.z = slashWave * 1.3;
        rig.arms[1].rotation.z = -slashWave * 1.3;
        rig.arms[0].rotation.y = Math.cos(prog * Math.PI * 6) * 0.85;
        rig.arms[1].rotation.y = -Math.cos(prog * Math.PI * 6) * 0.85;
    },

    executeFatality(winner, loser) {
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
