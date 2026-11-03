/* ============================================================================
 * COMBATTANT : SPINOSAURE (Spinosaurus Aegyptiacus)
 * Données (stats, skins, textes), modèle 3D, animations, coups spéciaux & fatalité.
 * Silhouette paléoart : corps allongé semi-aquatique, grande voile dorsale en M
 * à bandes sombres, long museau de baryonychiné à rosette terminale et crête nasale,
 * bras musclés à grandes griffes falciformes, pattes arrière courtes et queue-rame.
 * ============================================================================ */

registerFighter({
    id: 'spinosaurus',
    name: 'SPINOSAURE',
    fullName: 'Spinosaurus Aegyptiacus',
    role: 'Léviathan du Crétacé',
    title: '« Le Carnivore Démesuré »',
    primaryColor: 0xc29356,
    secondaryColor: 0x3b352e,
    accentColor: 0xd97706,
    cssPrimary: '#0284c7',
    scale: 1.16,
    previewScale: 0.88,
    stats: { pow: 95, spd: 74, def: 88 },
    maxHp: 1120,
    walkSpeed: 7.6,
    special1Name: 'Tranchage Fluvial (H)',
    special2Name: 'Vague Sanglante (T)',
    fatalityName: 'Éventration du Nil (R)',
    moveStyle: 'Posture massive avec crête neurale impressionnante, coups de museau et balayages aquatiques.',
    fatalityDesc: 'Empale la victime de ses griffes crocodiliennes, la soulève au-dessus de sa voile dorsale et la déchiquette en deux parties.',
    skins: [
        { name: 'Kem Kem Leviathan', primary: 0xc29356, secondary: 0x3b352e, accent: 0xd97706, belly: 0xd9c29c },
        { name: 'River Emperor', primary: 0x0284c7, secondary: 0x082f49, accent: 0x38bdf8, belly: 0xbae6fd },
        { name: 'Bile Croc', primary: 0x166534, secondary: 0x14532d, accent: 0x86efac, belly: 0xbbf7d0 },
        { name: 'Deep Trench', primary: 0x312e81, secondary: 0x1e1b4b, accent: 0x818cf8, belly: 0xc7d2fe },
        { name: 'Nile Blood', primary: 0x991b1b, secondary: 0x450a0a, accent: 0xfca5a5, belly: 0xfecaca }
    ]
}, {
    animBaseHipsY: 1.85,

    onSpecial2(attacker, defender, dist, basePow) {
        spawn3DProjectile(attacker, 'boulder');
    },

    buildRig(ctx) {
        const { hips, rig, addMesh, bodyMat, darkMat, accentMat, boneMat, skin, skinMeshes } = ctx;

        const bellyMat = new THREE.MeshStandardMaterial({ color: skin.belly || 0xd9c29c, roughness: 0.7 });
        const sailMat = new THREE.MeshStandardMaterial({
            color: skin.accent || 0xd97706,
            roughness: 0.65,
            metalness: 0.05,
            side: THREE.DoubleSide
        });
        const sailDarkMat = new THREE.MeshStandardMaterial({
            color: skin.secondary || 0x3b352e,
            roughness: 0.7,
            side: THREE.DoubleSide
        });
        const clawMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.4 });
        const irisMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
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
            if (mat === bellyMat || mat === sailMat) skinMeshes.push(m);
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
        const claw = (parent, p, len, r, rz = -Math.PI / 2 - 0.4) =>
            addMesh(new THREE.ConeGeometry(r, len, 6), clawMat, parent, p[0], p[1], p[2], 0, 0, rz);

        hips.position.y = 1.85;

        // =====================================================================
        // 1. TORSE : long fût cylindrique bas et profilé de nageur
        // =====================================================================
        blob(rig.torso, [0.05, 0.14, 0], [1.48, 0.65, 0.58], bodyMat, 0.04);
        blob(rig.torso, [-0.65, 0.16, 0], [0.85, 0.58, 0.52], bodyMat, -0.04);
        blob(rig.torso, [0.78, 0.14, 0], [0.72, 0.56, 0.52], bodyMat, 0.08);
        blob(rig.torso, [0.08, -0.22, 0], [1.28, 0.36, 0.48], bellyMat, 0.03);
        blob(rig.torso, [0.0, 0.54, 0], [1.36, 0.24, 0.42], darkMat, 0.04);

        // Motifs sombres latéraux de camouflage fluvial
        [-0.75, -0.32, 0.12, 0.55, 0.92].forEach((sx, i) => {
            blob(rig.torso, [sx, 0.25 + (i % 2) * 0.06, 0], [0.11, 0.36, 0.59], darkMat, 0.2);
        });

        // =====================================================================
        // 2. GRANDE VOILE DORSALE EN M (Spinosaurus aegyptiacus moderne)
        // =====================================================================
        const sailGroup = new THREE.Group();
        rig.torso.add(sailGroup);
        rig.specialParts.sailGroup = sailGroup;

        // Profil de la voile : haute à l'avant, léger creux médian, haute sur le bassin
        const spineDefs = [
            [-1.18, 0.45, 0.95],
            [-0.88, 0.50, 1.55],
            [-0.56, 0.52, 1.82],
            [-0.22, 0.54, 1.62],
            [0.12, 0.54, 1.58],
            [0.46, 0.54, 1.88],
            [0.78, 0.52, 1.72],
            [1.06, 0.46, 1.05]
        ];
        // Membrane principale de la voile
        const sailPoly = [
            [0.0, 0.52, 0],
            [-1.25, 0.42, 0],
            ...spineDefs.map(d => [d[0], d[1] + d[2], 0]),
            [1.18, 0.40, 0]
        ];
        membrane(sailGroup, sailPoly, sailMat);

        // Rayons d'épines neurales en relief + bandes sombres obliques sur la voile
        spineDefs.forEach((d, idx) => {
            bone(sailGroup, [d[0], d[1], 0], [d[0] - 0.04, d[1] + d[2], 0], 0.055, 0.028, idx % 2 === 0 ? darkMat : bodyMat, 6);
            if (idx % 2 === 1 && idx < spineDefs.length - 1) {
                const nxt = spineDefs[idx + 1];
                membrane(sailGroup, [
                    [d[0] - 0.04, d[1] + d[2], 0.015],
                    [nxt[0] - 0.04, nxt[1] + nxt[2], 0.015],
                    [nxt[0] + 0.08, nxt[1] + nxt[2] * 0.35, 0.015],
                    [d[0] + 0.06, d[1] + d[2] * 0.45, 0.015]
                ], sailDarkMat);
                membrane(sailGroup, [
                    [d[0] - 0.04, d[1] + d[2], -0.015],
                    [d[0] + 0.06, d[1] + d[2] * 0.45, -0.015],
                    [nxt[0] + 0.08, nxt[1] + nxt[2] * 0.35, -0.015],
                    [nxt[0] - 0.04, nxt[1] + nxt[2], -0.015]
                ], sailDarkMat);
            }
        });

        // =====================================================================
        // 3. COU EN S ET LONG MUSEAU CROCODILIEN À ROSETTE TERMINALE
        // =====================================================================
        rig.neck.position.set(1.22, 0.32, 0);
        rig.torso.add(rig.neck);
        const N0 = [0, 0, 0], N1 = [0.38, 0.34, 0], N2 = [0.68, 0.62, 0];
        bone(rig.neck, N0, N1, 0.42, 0.32, bodyMat, 9);
        joint(rig.neck, N1, 0.31, bodyMat);
        bone(rig.neck, N1, N2, 0.31, 0.25, bodyMat, 9);
        // Bande dorsale sombre et fanon gulaire clair sous la gorge
        bone(rig.neck, [-0.04, 0.14, 0], [0.62, 0.74, 0], 0.18, 0.14, darkMat, 7);
        blob(rig.neck, [0.35, 0.16, 0], [0.42, 0.18, 0.22], bellyMat, 0.55);

        // Crête d'épines cervicales
        for (let c = 0; c < 5; c++) {
            const t = c / 4;
            addMesh(new THREE.ConeGeometry(0.03, 0.11, 4), darkMat, rig.neck, 0.12 + t * 0.5, 0.28 + t * 0.48, 0, 0, 0, -0.4);
        }

        rig.headGroup.position.set(0.68, 0.64, 0);
        rig.neck.add(rig.headGroup);

        // Arrière-crâne étroit et haut
        blob(rig.headGroup, [0.14, 0.06, 0], [0.36, 0.24, 0.24], bodyMat, -0.06);
        blob(rig.headGroup, [0.10, 0.22, 0], [0.30, 0.12, 0.22], darkMat, -0.06);
        // Long museau étroit (maxillaire) avec encoche sub-narinaire et rosette terminale renflée au bout
        bone(rig.headGroup, [0.22, 0.04, 0], [1.22, -0.02, 0], 0.20, 0.12, bodyMat, 8);
        blob(rig.headGroup, [1.38, -0.02, 0], [0.24, 0.15, 0.13], bodyMat, -0.15); // Rosette prémaxillaire crochue

        // Crête nasale médiane caractéristique entre les yeux
        membrane(rig.headGroup, [[0.25, 0.18, 0.02], [0.48, 0.40, 0], [0.76, 0.14, 0.02]], accentMat);
        membrane(rig.headGroup, [[0.25, 0.18, -0.02], [0.76, 0.14, -0.02], [0.48, 0.40, 0]], accentMat);
        bone(rig.headGroup, [0.26, 0.20, 0], [0.72, 0.15, 0], 0.05, 0.03, darkMat, 5);

        // Yeux haut placés de piscivore
        [-1, 1].forEach(side => {
            addMesh(new THREE.SphereGeometry(0.055, 8, 8), irisMat, rig.headGroup, 0.26, 0.15, side * 0.20);
            addMesh(new THREE.SphereGeometry(0.028, 6, 6), pupilMat, rig.headGroup, 0.29, 0.15, side * 0.24);
            blob(rig.headGroup, [0.25, 0.23, side * 0.19], [0.12, 0.04, 0.06], darkMat, 0.1);
        });

        // Dents coniques entrecroisées de piscivore (grandes canines dans la rosette)
        for (let t = 0; t < 9; t++) {
            const tx = 0.35 + t * 0.14;
            const isRosette = t >= 7;
            const len = isRosette ? 0.16 : 0.10;
            [-1, 1].forEach(side => {
                addMesh(new THREE.ConeGeometry(0.02, len, 5), boneMat, rig.headGroup,
                    tx, isRosette ? -0.13 : -0.10, side * (isRosette ? 0.10 : 0.13), Math.PI, 0, 0);
            });
        }

        // Mâchoire inférieure longue et fine
        rig.jaw.position.set(0.10, -0.10, 0);
        rig.headGroup.add(rig.jaw);
        bone(rig.jaw, [0, 0, 0], [1.18, -0.02, 0], 0.14, 0.08, bellyMat, 7);
        blob(rig.jaw, [1.28, 0.0, 0], [0.16, 0.09, 0.09], bellyMat, 0.1);
        for (let t = 0; t < 8; t++) {
            const tx = 0.25 + t * 0.13;
            [-1, 1].forEach(side => {
                addMesh(new THREE.ConeGeometry(0.018, 0.09, 5), boneMat, rig.jaw, tx, 0.06, side * 0.09);
            });
        }

        // =====================================================================
        // 4. BRAS PUISSANTS ARMÉS DE GRANDES GRIFFES DE PÊCHE / ÉVENTRATION
        // =====================================================================
        [-1, 1].forEach(side => {
            const arm = new THREE.Group();
            arm.position.set(0.95, -0.05, side * 0.48);
            rig.torso.add(arm);
            rig.arms.push(arm);

            const S = [0, 0, 0], E = [-0.08, -0.45, side * 0.06], W = [0.35, -0.82, side * 0.04];
            blob(arm, [-0.02, -0.20, 0], [0.18, 0.28, 0.16], bodyMat, 0.2);
            bone(arm, S, E, 0.16, 0.12, bodyMat, 8);
            joint(arm, E, 0.12, darkMat);
            bone(arm, E, W, 0.12, 0.09, darkMat, 8);
            joint(arm, W, 0.09, darkMat);

            // 3 doigts avec griffe du pouce géante recourbée (type Baryonyx/Spinosaurus)
            [-0.06, 0, 0.06].forEach((dz, i) => {
                const isThumb = i === 0;
                const fingerTip = [W[0] + 0.18, W[1] - 0.10, W[2] + dz];
                bone(arm, W, fingerTip, 0.04, 0.028, darkMat, 5);
                claw(arm, [fingerTip[0] + 0.10, fingerTip[1] - 0.08, fingerTip[2]],
                    isThumb ? 0.36 : 0.22, isThumb ? 0.048 : 0.032, -Math.PI / 2 - 0.65);
            });
        });

        // =====================================================================
        // 5. QUEUE EN RAME AQUATIQUE (Paddle Tail à haute crête caudale)
        // =====================================================================
        let pTail = rig.torso;
        const tLen = 0.88;
        const finHeights = [0.68, 0.78, 0.72, 0.42];
        const radii = [0.44, 0.32, 0.22, 0.12, 0.04];
        for (let s = 0; s < 4; s++) {
            const seg = new THREE.Group();
            seg.position.set(s === 0 ? -1.18 : -tLen, s === 0 ? 0.12 : 0, 0);

            const r1 = radii[s], r2 = radii[s + 1];
            bone(seg, [0, 0, 0], [-tLen, 0, 0], r1, r2, bodyMat, 8);
            bone(seg, [0, -r1 * 0.35, 0], [-tLen, -r2 * 0.35, 0], r1 * 0.65, r2 * 0.6, bellyMat, 7);

            // Nageoire caudale supérieure (haute membrane soutenue par épines neurales)
            const fh1 = finHeights[s], fh2 = finHeights[Math.min(3, s + 1)];
            membrane(seg, [
                [0, r1 * 0.6, 0],
                [-tLen * 0.5, (fh1 + fh2) * 0.52, 0],
                [-tLen, r2 * 0.6 + fh2 * (s === 3 ? 0.2 : 0.85), 0],
                [-tLen, r2 * 0.5, 0]
            ], sailMat);
            // Nageoire caudale inférieure (chevrons)
            membrane(seg, [
                [0, -r1 * 0.5, 0],
                [-tLen * 0.5, -r1 * 0.5 - fh1 * 0.32, 0],
                [-tLen, -r2 * 0.5, 0]
            ], bellyMat);

            // Rayures verticales sombres sur la queue-rame
            [-0.25, -0.65].forEach(bx => {
                blob(seg, [bx, fh1 * 0.22, 0], [0.09, fh1 * 0.55, r1 * 0.6 + 0.03], darkMat, 0.05);
            });

            pTail.add(seg);
            rig.tailSegments.push(seg);
            pTail = seg;
        }

        // =====================================================================
        // 6. PATTES ARRIÈRE COURTES ET ROBUSTES (anatomie moderne de Spinosaurus)
        // =====================================================================
        [-1, 1].forEach(side => {
            const leg = new THREE.Group();
            leg.position.set(-0.35, 0.02, side * 0.46);
            hips.add(leg);
            rig.legs.push(leg);

            const H = [0, 0, 0];
            const K = [0.22, -0.68, side * 0.04];
            const A = [-0.16, -1.36, side * 0.04];
            const F = [0.12, -1.78, side * 0.05];

            blob(leg, [0.06, -0.34, 0], [0.38, 0.48, 0.30], bodyMat, 0.22);
            blob(leg, [0.08, -0.32, side * 0.14], [0.24, 0.09, 0.18], darkMat, 0.15);
            joint(leg, K, 0.20, bodyMat);
            bone(leg, K, A, 0.20, 0.13, darkMat, 8);
            joint(leg, A, 0.13, darkMat);
            bone(leg, A, F, 0.13, 0.11, darkMat, 7);

            // Pied palmé large à 4 orteils et griffes plates
            [-0.14, -0.04, 0.06, 0.15].forEach((dz, i) => {
                const tip = [F[0] + (i === 1 || i === 2 ? 0.38 : 0.28), -1.84, F[2] + dz];
                bone(leg, F, tip, 0.055, 0.04, darkMat, 5);
                claw(leg, [tip[0] + 0.06, tip[1], tip[2]], 0.13, 0.035, -Math.PI / 2 - 0.1);
            });
        });
    },

    animateIdle(ctx) {
        const { rig, baseHipsY, time, isWalk } = ctx;
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

    hasCustomDirectionals: true,

    animateAttack(ctx) {
        const { rig, act, prog, swing, strike, baseHipsY } = ctx;
        const s = strike !== undefined ? strike : swing;

        if (act === 'light') {
            rig.arms[0].rotation.z = s * 1.35;
            rig.arms[1].rotation.z = -s * 0.45;
            rig.torso.rotation.y = s * 0.35;
            rig.jaw.rotation.z = -s * 0.45;
        } else if (act === 'light2') {
            rig.arms[0].rotation.z = -s * 0.45;
            rig.arms[1].rotation.z = s * 1.45;
            rig.torso.rotation.y = -s * 0.45;
            rig.jaw.rotation.z = -s * 0.85;
        } else if (act === 'fwd_light') {
            rig.hips.position.x = s * 0.95;
            rig.torso.rotation.z = -s * 0.40;
            rig.jaw.rotation.z = -s * 0.95;
            rig.arms[0].rotation.z = s * 1.1;
        } else if (act === 'low_light' || act === 'low_heavy') {
            rig.hips.position.y = (baseHipsY || 1.85) * 0.55;
            rig.torso.rotation.z = -0.32;
            rig.arms[0].rotation.y = s * 1.25;
            rig.jaw.rotation.z = -s * 0.65;
        } else if (act === 'anti_air' || act === 'up_light') {
            rig.hips.position.y = (baseHipsY || 1.85) + s * 0.75;
            rig.torso.rotation.z = s * 0.55;
            rig.arms[0].rotation.z = s * 1.6;
            rig.arms[1].rotation.z = s * 1.6;
            rig.jaw.rotation.z = -s * 1.15;
        } else if (act === 'back_light') {
            rig.hips.position.x = -s * 0.75;
            rig.arms[0].rotation.z = s * 1.1;
            rig.jaw.rotation.z = -s * 0.65;
        } else if (act === 'throw') {
            rig.hips.position.x = s * 0.85;
            rig.torso.rotation.y = Math.sin(prog * 24) * 0.45;
            rig.jaw.rotation.z = prog < 0.35 ? -1.2 : -0.25;
        } else if (act === 'air_light' || act === 'air_heavy') {
            rig.torso.rotation.z = -s * 0.6;
            rig.arms[0].rotation.z = s * 1.5;
            rig.arms[1].rotation.z = s * 1.5;
            rig.jaw.rotation.z = -s * 0.95;
        } else if (act === 'heavy' || act === 'fwd_heavy') {
            rig.hips.position.x = s * (act === 'fwd_heavy' ? 1.25 : 0.6);
            rig.torso.rotation.z = -s * 0.35;
            rig.arms[0].rotation.z = s * 1.45;
            rig.arms[1].rotation.z = s * 1.45;
            rig.jaw.rotation.z = -s * 0.65;
        } else if (act === 'special' || act === 'special2') {
            rig.hips.rotation.y = prog * Math.PI * 2;
        }
    },

    animateFatality(ctx) {
        const { rig, prog } = ctx;
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

    executeFatality(winner, loser) {
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
