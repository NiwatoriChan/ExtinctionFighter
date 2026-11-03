/* ============================================================================
 * COMBATTANT : POSTOSUCHUS (Postosuchus Kirkpatricki)
 * Données (stats, skins, textes), modèle 3D, animations, coups spéciaux & fatalité.
 * Silhouette paléoart : archosaure rauisuchien au corps svelte et bas, double
 * rangée d'ostéodermes dorsaux carénés, crâne profond type tyrannosaure, pattes
 * arrière longues érigées et membres antérieurs plus courts, longue queue annelée.
 * ============================================================================ */

registerFighter({
    id: 'postosuchus',
    name: 'POSTOSUCHUS',
    fullName: 'Postosuchus Kirkpatricki',
    role: 'Archosaurien Carnassier',
    title: '« L’Ombre du Trias Supérieur »',
    primaryColor: 0x736e56,
    secondaryColor: 0x363327,
    accentColor: 0xa8a186,
    cssPrimary: '#b91c1c',
    scale: 0.92,
    previewScale: 0.92,
    stats: { pow: 91, spd: 80, def: 84 },
    maxHp: 1020,
    walkSpeed: 8.4,
    special1Name: 'Croc Mortel (H)',
    special2Name: 'Roulade Triasique (T)',
    fatalityName: 'Déchirement Préhistorique (R)',
    moveStyle: 'Démarche semi-érigée menaçante, bonds violents et morsures en tenaille.',
    fatalityDesc: 'Broyage du cou par morsure en étau, roule sur lui-même comme un crocodile primitif pour arracher la colonne vertébrale.',
    skins: [
        { name: 'Chinle Archosaur', primary: 0x736e56, secondary: 0x363327, accent: 0xa8a186 },
        { name: 'Triassic Stalker', primary: 0xb91c1c, secondary: 0x450a0a, accent: 0xf97316 },
        { name: 'Canyon Dust', primary: 0x78350f, secondary: 0x451a03, accent: 0xf59e0b },
        { name: 'Swamp Basilisk', primary: 0x166534, secondary: 0x052e16, accent: 0x4ade80 },
        { name: 'Basalt Viper', primary: 0x27272a, secondary: 0x09090b, accent: 0x38bdf8 }
    ]
}, {
    animBaseHipsY: 1.48,

    onSpecial2(attacker, defender, dist, basePow) {
        spawn3DProjectile(attacker, 'boulder');
    },

    buildRig(ctx) {
        const { hips, rig, addMesh, bodyMat, darkMat, accentMat, boneMat, skin, skinMeshes } = ctx;
        void accentMat;

        const bellyMat = new THREE.MeshStandardMaterial({ color: skin.accent || 0xa8a186, roughness: 0.75 });
        const clawMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.45 });
        const irisMat = new THREE.MeshBasicMaterial({ color: 0xeab308 });
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
            if (mat === bellyMat) skinMeshes.push(m);
            return m;
        };
        const joint = (parent, p, r, mat) => addMesh(new THREE.SphereGeometry(r, 10, 8), mat, parent, p[0], p[1], p[2]);
        const blob = (parent, p, s, mat, rz = 0, ry = 0, rx = 0) => {
            const m = addMesh(new THREE.SphereGeometry(1, 14, 10), mat, parent, p[0], p[1], p[2], rx, ry, rz);
            m.scale.set(s[0], s[1], s[2]);
            if (mat === bellyMat) skinMeshes.push(m);
            return m;
        };

        hips.position.y = 1.48;

        // =====================================================================
        // 1. CORPS DE RAUISUCHIEN : long, athlétique, couvert de deux rangées d'ostéodermes
        // =====================================================================
        blob(rig.torso, [0.0, 0.14, 0], [1.42, 0.56, 0.54], bodyMat, -0.03);
        blob(rig.torso, [-0.62, 0.18, 0], [0.82, 0.52, 0.48], bodyMat, 0.04);
        blob(rig.torso, [0.72, 0.10, 0], [0.72, 0.50, 0.48], bodyMat, -0.06);
        blob(rig.torso, [0.04, -0.18, 0], [1.24, 0.30, 0.44], bellyMat, -0.02);
        blob(rig.torso, [0.0, 0.48, 0], [1.32, 0.22, 0.38], darkMat, -0.03);

        // Taches et marbrures sombres sur les flancs + double rangée d'ostéodermes dorsaux carénés
        for (let x = -1.15; x <= 1.05; x += 0.22) {
            const dy = 0.62 - Math.pow(x * 0.45, 2) * 0.18;
            [-1, 1].forEach(side => {
                // Plaque ostéodermique carénée
                blob(rig.torso, [x, dy, side * 0.13], [0.09, 0.05, 0.07], darkMat);
                addMesh(new THREE.ConeGeometry(0.04, 0.11, 4), darkMat, rig.torso, x, dy + 0.06, side * 0.13, 0, 0, 0.15);
                // Taches latérales
                if (Math.abs(x) < 0.95) {
                    blob(rig.torso, [x + 0.05, 0.18 + (Math.round(x * 5) % 2) * 0.12, side * 0.49], [0.08, 0.06, 0.04], darkMat);
                }
            });
        }

        // =====================================================================
        // 2. COU ROBUSTE & CRÂNE PROFOND DE POSTOSUCHUS
        // =====================================================================
        rig.neck.position.set(1.22, 0.12, 0);
        rig.torso.add(rig.neck);
        bone(rig.neck, [-0.08, 0, 0], [0.42, 0.10, 0], 0.38, 0.32, bodyMat, 9);
        bone(rig.neck, [-0.04, -0.12, 0], [0.40, -0.04, 0], 0.26, 0.22, bellyMat, 8);
        [0.05, 0.24].forEach(nx => {
            [-1, 1].forEach(side => {
                addMesh(new THREE.ConeGeometry(0.038, 0.10, 4), darkMat, rig.neck, nx, 0.34 + nx * 0.15, side * 0.11, 0, 0, 0.1);
            });
        });

        rig.headGroup.position.set(0.42, 0.12, 0);
        rig.neck.add(rig.headGroup);

        // Crâne haut, étroit et comprimé latéralement avec crête sourcilière rugueuse
        blob(rig.headGroup, [0.20, 0.08, 0], [0.42, 0.28, 0.28], bodyMat, -0.04);
        blob(rig.headGroup, [0.68, 0.05, 0], [0.50, 0.24, 0.22], bodyMat, -0.06);
        blob(rig.headGroup, [0.52, 0.24, 0], [0.56, 0.09, 0.18], darkMat, -0.05);

        [-1, 1].forEach(side => {
            // Arcade sourcilière saillante
            blob(rig.headGroup, [0.28, 0.22, side * 0.22], [0.22, 0.06, 0.07], darkMat, 0.1);
            addMesh(new THREE.SphereGeometry(0.052, 8, 8), irisMat, rig.headGroup, 0.28, 0.12, side * 0.24);
            addMesh(new THREE.SphereGeometry(0.026, 6, 6), pupilMat, rig.headGroup, 0.31, 0.12, side * 0.27);
            blob(rig.headGroup, [0.98, 0.09, side * 0.16], [0.07, 0.04, 0.03], darkMat);
        });

        // Dents ziphodontes crénelées
        for (let t = 0; t < 7; t++) {
            const tx = 0.26 + t * 0.12;
            const len = (t === 2 || t === 3) ? 0.15 : 0.10;
            [-1, 1].forEach(side => {
                addMesh(new THREE.ConeGeometry(0.022, len, 5), boneMat, rig.headGroup, tx, -0.13, side * (0.19 - t * 0.008), Math.PI, 0, 0);
            });
        }

        // Mâchoire inférieure
        rig.jaw.position.set(0.08, -0.12, 0);
        rig.headGroup.add(rig.jaw);
        blob(rig.jaw, [0.24, -0.03, 0], [0.34, 0.14, 0.23], bodyMat, 0.05);
        bone(rig.jaw, [0.16, -0.04, 0], [0.96, -0.02, 0], 0.16, 0.10, bellyMat, 7);
        for (let t = 0; t < 6; t++) {
            const tx = 0.24 + t * 0.12;
            [-1, 1].forEach(side => {
                addMesh(new THREE.ConeGeometry(0.018, 0.09, 4), boneMat, rig.jaw, tx, 0.05, side * 0.14);
            });
        }

        // =====================================================================
        // 3. LONGUE QUEUE CROCODILIENNE ANNELÉE (4 segments)
        // =====================================================================
        let pTail = rig.torso;
        const tLens = [0.88, 0.88, 0.86, 0.90];
        const tRads = [0.42, 0.31, 0.21, 0.12, 0.035];
        for (let s = 0; s < 4; s++) {
            const seg = new THREE.Group();
            seg.position.set(s === 0 ? -1.24 : -tLens[s - 1], s === 0 ? 0.12 : 0, 0);
            const len = tLens[s], r1 = tRads[s], r2 = tRads[s + 1];
            bone(seg, [0, 0, 0], [-len, -0.02, 0], r1, r2, bodyMat, 8);
            bone(seg, [0, -r1 * 0.35, 0], [-len, -0.02 - r2 * 0.35, 0], r1 * 0.65, r2 * 0.6, bellyMat, 7);
            // Bandes sombres et ostéodermes caudaux
            [-0.28, -0.68].forEach(bx => {
                blob(seg, [bx, r1 * 0.2, 0], [0.10, r1 * 0.78, r1 * 0.92], darkMat);
                addMesh(new THREE.ConeGeometry(0.035, 0.10 - s * 0.015, 4), darkMat, seg, bx, r1 * 0.85, 0, 0, 0, 0.2);
            });
            pTail.add(seg);
            rig.tailSegments.push(seg);
            pTail = seg;
        }

        // =====================================================================
        // 4. PATTES D'ARCHOSAURE (membres avant plus courts, arrière longs érigés)
        // =====================================================================
        [
            { x: 0.84, z: -0.46, isFront: true },
            { x: 0.84, z: 0.46, isFront: true },
            { x: -0.78, z: -0.48, isFront: false },
            { x: -0.78, z: 0.48, isFront: false }
        ].forEach(pos => {
            const leg = new THREE.Group();
            leg.position.set(pos.x, 0.0, pos.z);
            hips.add(leg);
            rig.legs.push(leg);

            const side = Math.sign(pos.z);
            if (pos.isFront) {
                // Membre antérieur plus court et fin (semi-bipède / facultativement quadrupède)
                const S = [0, 0, 0], E = [-0.12, -0.56, side * 0.04], W = [0.14, -1.16, side * 0.04];
                blob(leg, [-0.04, -0.28, 0], [0.20, 0.34, 0.18], bodyMat, -0.18);
                joint(leg, E, 0.12, bodyMat);
                bone(leg, E, W, 0.12, 0.08, darkMat, 7);
                [-0.08, -0.02, 0.04, 0.09].forEach(dz => {
                    const tip = [W[0] + 0.22, -1.36, W[2] + dz];
                    bone(leg, W, tip, 0.032, 0.022, darkMat, 5);
                    addMesh(new THREE.ConeGeometry(0.022, 0.09, 5), clawMat, leg, tip[0] + 0.04, tip[1] - 0.02, tip[2], 0, 0, -Math.PI / 2 - 0.4);
                });
            } else {
                // Membre postérieur long, puissant et vertical (sol à y = -1.48)
                const H = [0, 0, 0], K = [0.22, -0.64, side * 0.04], A = [-0.14, -1.24, side * 0.04], F = [0.12, -1.42, side * 0.04];
                blob(leg, [0.06, -0.32, 0], [0.34, 0.46, 0.26], bodyMat, 0.22);
                joint(leg, K, 0.18, bodyMat);
                bone(leg, K, A, 0.17, 0.11, bodyMat, 8);
                joint(leg, A, 0.11, darkMat);
                bone(leg, A, F, 0.11, 0.09, darkMat, 7);
                [-0.10, -0.03, 0.04, 0.10].forEach(dz => {
                    const tip = [F[0] + 0.28, -1.44, F[2] + dz];
                    bone(leg, F, tip, 0.04, 0.028, darkMat, 5);
                    addMesh(new THREE.ConeGeometry(0.026, 0.11, 5), clawMat, leg, tip[0] + 0.05, tip[1], tip[2], 0, 0, -Math.PI / 2 - 0.15);
                });
            }
        });
    },

    animateIdle(ctx) {
        const { rig, baseHipsY, time, isWalk } = ctx;
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

    hasCustomDirectionals: true,

    animateAttack(ctx) {
        const { rig, act, prog, swing, strike, baseHipsY } = ctx;
        const s = strike !== undefined ? strike : swing;
        if (act === 'light') {
            rig.hips.rotation.z = swing * 0.45;
            rig.headGroup.rotation.z = -swing * 0.4;
            rig.jaw.rotation.z = -swing * 0.75;
        } else if (act === 'light2') {
            rig.torso.rotation.y = swing * 0.45;
            rig.headGroup.rotation.z = -swing * 0.45;
            rig.jaw.rotation.z = -swing * 0.85;
        } else if (act === 'fwd_light') {
            rig.hips.position.x = swing * 0.85;
            rig.hips.rotation.z = swing * 0.3;
            rig.headGroup.rotation.z = -swing * 0.35;
            rig.jaw.rotation.z = -swing * 0.8;
        } else if (act === 'low_light' || act === 'low_heavy') {
            rig.hips.position.y = baseHipsY - swing * 0.35;
            rig.headGroup.rotation.z = -0.45;
            rig.jaw.rotation.z = -swing * 0.7;
            rig.tailSegments.forEach(seg => { seg.rotation.y = -swing * 0.8; });
        } else if (act === 'anti_air' || act === 'up_light') {
            rig.hips.rotation.z = swing * 0.75;
            rig.headGroup.rotation.z = swing * 0.6;
            rig.jaw.rotation.z = -swing * 1.1;
        } else if (act === 'back_light') {
            rig.hips.position.x = -s * 0.75;
            rig.jaw.rotation.z = -s * 0.75;
        } else if (act === 'air_light' || act === 'air_heavy') {
            rig.torso.rotation.z = -swing * 0.6;
            rig.jaw.rotation.z = -swing * 0.9;
        } else if (act === 'fwd_heavy') {
            rig.hips.position.x = swing * 1.15;
            rig.hips.rotation.z = swing * 0.4;
            rig.jaw.rotation.z = -swing * 1.0;
        } else if (act === 'throw') {
            rig.jaw.rotation.z = -0.9;
            rig.torso.rotation.y = swing * 1.5;
            rig.headGroup.rotation.y = swing * 1.2;
        } else if (act === 'throw_whiff') {
            rig.hips.position.x = swing * 0.4;
            rig.jaw.rotation.z = -0.4;
        } else if (act === 'heavy' || act === 'special') {
            rig.hips.position.y = baseHipsY + swing * 0.65;
            rig.torso.rotation.x = prog * Math.PI * 4;
            rig.jaw.rotation.z = -0.5;
        } else if (act === 'special2') {
            rig.hips.position.x = swing * 0.9;
            rig.jaw.rotation.z = -0.8;
        }
    },

    animateFatality(ctx) {
        const { rig, prog, baseHipsY } = ctx;
        if (prog < 0.25) {
            rig.hips.rotation.z = 0.35;
            rig.jaw.rotation.z = -0.8;
        } else {
            rig.hips.position.y = baseHipsY + 0.55;
            rig.torso.rotation.x = (prog - 0.25) * Math.PI * 14;
            rig.jaw.rotation.z = -0.25;
        }
    },

    executeFatality(winner, loser) {
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
