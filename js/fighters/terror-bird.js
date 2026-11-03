/* ============================================================================
 * COMBATTANT : OISEAU DE TERREUR (Phorusrhacos Longissimus)
 * Données (stats, skins, textes), modèle 3D, animations, coups spéciaux & fatalité.
 * Silhouette paléoart : grand oiseau coureur prédateur à longues pattes écaillées,
 * plumage gris-brun ébouriffé, petites ailes vestigiales repliées, long cou en S,
 * huppe occipitale et gigantesque bec en hache jaune crochu à la pointe.
 * ============================================================================ */

registerFighter({
    id: 'terabird',
    name: 'OISEAU DE TERREUR',
    fullName: 'Phorusrhacos Longissimus',
    role: 'Faucheur Véloce',
    title: '« La Hache Plumée du Miocène »',
    primaryColor: 0x5c5349,
    secondaryColor: 0x2b2623,
    accentColor: 0xeab308,
    cssPrimary: '#ea580c',
    scale: 0.88,
    previewScale: 0.92,
    stats: { pow: 92, spd: 98, def: 68 },
    maxHp: 920,
    walkSpeed: 10.4,
    special1Name: 'Pique de Hache (H)',
    special2Name: 'Foulée Furieuse (T)',
    fatalityName: 'Trépanation Sauvage (R)',
    moveStyle: 'Sprinteur hyperkinétique bipède, frappes verticales de son bec tranchant en coin.',
    fatalityDesc: 'Assène une frappe verticale d’une violence inouïe avec son bec crochu, ouvrant le crâne adverse en deux avant de déchirer les viscères.',
    skins: [
        { name: 'Patagonian Terror', primary: 0x5c5349, secondary: 0x2b2623, accent: 0xeab308, neck: 0x9ca3af, beak: 0xeab308 },
        { name: 'Terror Feather', primary: 0xea580c, secondary: 0x9a3412, accent: 0xfacc15, neck: 0xfed7aa, beak: 0xfacc15 },
        { name: 'Snow Owl', primary: 0xf1f5f9, secondary: 0x94a3b8, accent: 0xfacc15, neck: 0xffffff, beak: 0xf59e0b },
        { name: 'Raven Nightmare', primary: 0x18181b, secondary: 0x09090b, accent: 0xa855f7, neck: 0x3f3f46, beak: 0xc084fc },
        { name: 'Blood Falcon', primary: 0x991b1b, secondary: 0x450a0a, accent: 0xfca5a5, neck: 0xfecaca, beak: 0xfef08a }
    ]
}, {
    animBaseHipsY: 2.25,

    onSpecial2(attacker, defender, dist, basePow) {
        spawn3DProjectile(attacker, 'boulder');
    },

    buildRig(ctx) {
        const { hips, rig, addMesh, bodyMat, darkMat, accentMat, boneMat, skin, skinMeshes } = ctx;
        void accentMat;
        void boneMat;

        const neckMat = new THREE.MeshStandardMaterial({ color: skin.neck || 0x9ca3af, roughness: 0.75 });
        const beakMat = new THREE.MeshStandardMaterial({ color: skin.beak || 0xeab308, roughness: 0.35, metalness: 0.08 });
        const beakTipMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.4 });
        const tarsusMat = new THREE.MeshStandardMaterial({ color: 0xa88b67, roughness: 0.55 });
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
            if (mat === neckMat) skinMeshes.push(m);
            return m;
        };
        const joint = (parent, p, r, mat) => addMesh(new THREE.SphereGeometry(r, 10, 8), mat, parent, p[0], p[1], p[2]);
        const blob = (parent, p, s, mat, rz = 0, ry = 0, rx = 0) => {
            const m = addMesh(new THREE.SphereGeometry(1, 14, 10), mat, parent, p[0], p[1], p[2], rx, ry, rz);
            m.scale.set(s[0], s[1], s[2]);
            if (mat === neckMat) skinMeshes.push(m);
            return m;
        };

        hips.position.y = 2.25;

        // =====================================================================
        // 1. CORPS D'OISEAU COUREUR : ovoïde compact à plumage étagé
        // =====================================================================
        blob(rig.torso, [0.05, 0.16, 0], [0.98, 0.62, 0.56], bodyMat, 0.18);
        blob(rig.torso, [0.42, 0.24, 0], [0.58, 0.52, 0.52], neckMat, 0.28);       // poitrail clair duveteux
        blob(rig.torso, [-0.15, 0.42, 0], [0.82, 0.34, 0.48], darkMat, 0.10);      // manteau dorsal sombre

        // Petites ailes vestigiales repliées contre les flancs
        [-1, 1].forEach(side => {
            const wing = new THREE.Group();
            wing.position.set(0.28, 0.26, side * 0.48);
            blob(wing, [-0.24, -0.08, side * 0.05], [0.46, 0.24, 0.10], darkMat, 0.25, side * 0.12);
            // Rémiges courtes en éventail
            for (let r = 0; r < 4; r++) {
                blob(wing, [-0.42 - r * 0.08, -0.14 - r * 0.04, side * 0.06], [0.24, 0.06, 0.04], bodyMat, 0.35 + r * 0.08);
            }
            rig.torso.add(wing);
            rig.arms.push(wing);
        });

        // Queue tombante en éventail de plumes souples
        const tailFan = new THREE.Group();
        tailFan.position.set(-0.82, 0.08, 0);
        for (let i = -2; i <= 2; i++) {
            const z = i * 0.10;
            blob(tailFan, [-0.38, -0.14 - Math.abs(i) * 0.03, z], [0.48, 0.08, 0.12], i % 2 === 0 ? darkMat : bodyMat, 0.42, i * 0.14);
        }
        rig.torso.add(tailFan);
        rig.tailSegments.push(tailFan);

        // =====================================================================
        // 2. COU PUISSANT EN S DE PHORUSRHACOS
        // =====================================================================
        rig.neck.position.set(0.68, 0.38, 0);
        rig.torso.add(rig.neck);
        const N0 = [0, 0, 0], N1 = [0.28, 0.55, 0], N2 = [0.20, 1.15, 0];
        bone(rig.neck, N0, N1, 0.30, 0.23, neckMat, 9);
        joint(rig.neck, N1, 0.23, neckMat);
        bone(rig.neck, N1, N2, 0.23, 0.20, neckMat, 9);
        // Nuque plus sombre
        bone(rig.neck, [-0.05, 0.08, 0], [0.12, 1.15, 0], 0.18, 0.14, bodyMat, 7);

        // =====================================================================
        // 3. TÊTE & GIGANTESQUE BEC EN HACHE CROCHU
        // =====================================================================
        rig.headGroup.position.set(0.22, 1.22, 0);
        rig.neck.add(rig.headGroup);

        // Boîte crânienne allongée
        blob(rig.headGroup, [0.06, 0.08, 0], [0.38, 0.28, 0.24], neckMat, -0.05);
        blob(rig.headGroup, [0.02, 0.22, 0], [0.32, 0.14, 0.22], darkMat, -0.05);

        // Huppe de plumes effilées à l'arrière du crâne (comme un cariama / Phorusrhacos)
        for (let f = 0; f < 5; f++) {
            const ang = 0.35 + f * 0.14;
            blob(rig.headGroup, [-0.28 - f * 0.05, 0.22 - f * 0.04, (f % 2 === 0 ? 1 : -1) * 0.03], [0.26, 0.04, 0.05], darkMat, ang);
        }

        // Yeux perçants de rapace sous une arcade sourcilière sévère
        [-1, 1].forEach(side => {
            blob(rig.headGroup, [0.22, 0.14, side * 0.18], [0.15, 0.11, 0.08], darkMat); // cerne sombre
            addMesh(new THREE.SphereGeometry(0.055, 8, 8), irisMat, rig.headGroup, 0.24, 0.14, side * 0.22);
            addMesh(new THREE.SphereGeometry(0.028, 6, 6), pupilMat, rig.headGroup, 0.27, 0.14, side * 0.25);
            addMesh(new THREE.BoxGeometry(0.22, 0.04, 0.08), darkMat, rig.headGroup, 0.23, 0.22, side * 0.21, 0, 0, -0.15);
        });

        // IMMENSE BEC SUPÉRIEUR EN HACHE (haut, comprimé latéralement, terminé par un croc)
        // Base haute du bec
        blob(rig.headGroup, [0.62, 0.12, 0], [0.42, 0.24, 0.13], beakMat, -0.08);
        // Dos arqué du culmen
        bone(rig.headGroup, [0.34, 0.28, 0], [0.98, 0.16, 0], 0.11, 0.08, beakMat, 6);
        bone(rig.headGroup, [0.34, 0.02, 0], [0.98, -0.02, 0], 0.12, 0.07, beakMat, 6);
        // Pointe crochue mortelle plongeant vers le bas
        bone(rig.headGroup, [0.94, 0.14, 0], [1.14, -0.16, 0], 0.09, 0.015, beakTipMat, 6);
        // Narine ovale sur le bec
        [-1, 1].forEach(side => {
            blob(rig.headGroup, [0.54, 0.16, side * 0.12], [0.07, 0.03, 0.02], beakTipMat);
        });

        // Mâchoire inférieure articulée
        rig.jaw.position.set(0.25, -0.08, 0);
        rig.headGroup.add(rig.jaw);
        bone(rig.jaw, [0, 0, 0], [0.72, -0.02, 0], 0.09, 0.04, beakTipMat, 6);
        bone(rig.jaw, [0.05, 0.03, 0], [0.68, 0.0, 0], 0.07, 0.03, beakMat, 6);

        // =====================================================================
        // 4. LONGUES PATTES DE COUREUR AVEC GRIFFE TUEUSE (sol à y = -2.25)
        // =====================================================================
        [-1, 1].forEach(side => {
            const leg = new THREE.Group();
            leg.position.set(-0.04, 0, side * 0.35);
            hips.add(leg);
            rig.legs.push(leg);

            const H = [0, 0, 0];                      // hanche
            const K = [0.26, -0.54, 0];               // genou avancé sous le plumage
            const M = [0.02, -0.96, 0];               // bas du pilon emplumé (tibiotarse)
            const A = [-0.20, -1.34, 0];              // cheville / talon haut (articulation intertarsienne)
            const F = [0.14, -2.16, 0];               // base des orteils (métatarse distal)

            // Cuisse (fémur) et haut du pilon emplumé
            bone(leg, H, K, 0.28, 0.23, bodyMat, 10);
            blob(leg, [0.10, -0.28, 0], [0.34, 0.42, 0.26], bodyMat, 0.35);
            joint(leg, K, 0.22, bodyMat);

            // Pilon musculaire (tibiotarse supérieur emplumé + manchon sombre)
            bone(leg, K, M, 0.22, 0.14, darkMat, 10);
            blob(leg, [0.13, -0.74, 0], [0.22, 0.30, 0.19], darkMat, -0.52);
            joint(leg, M, 0.135, darkMat);

            // Bas du tibiotarse écaillé rejoignant le talon haut (A)
            bone(leg, M, A, 0.12, 0.095, tarsusMat, 8);
            joint(leg, A, 0.105, tarsusMat);

            // Long tarsométatarse écaillé incliné vers l'avant (A -> F)
            bone(leg, A, F, 0.092, 0.076, tarsusMat, 8);
            // Écailles scutellées sur la face antérieure du tarsométatarse
            for (let s = 1; s <= 5; s++) {
                const t = s / 6;
                const sx = A[0] + (F[0] - A[0]) * t + 0.05;
                const sy = A[1] + (F[1] - A[1]) * t;
                blob(leg, [sx, sy, 0], [0.045, 0.035, 0.075], tarsusMat, 0.36);
            }

            // Ergot / hallux postérieur court au-dessus du pied
            const halluxBase = [0.06, -1.96, 0];
            const halluxTip = [-0.10, -2.06, 0];
            bone(leg, halluxBase, halluxTip, 0.035, 0.024, tarsusMat, 5);
            addMesh(new THREE.ConeGeometry(0.024, 0.10, 5), beakTipMat, leg, -0.14, -2.09, 0, 0, 0, Math.PI / 2 + 0.35);

            // 3 orteils puissants de rapace coureur (doigt interne armé d'une grande griffe courbe)
            joint(leg, F, 0.088, tarsusMat);
            [-0.12, 0, 0.12].forEach((dz, idx) => {
                const isInner = (side < 0 && idx === 2) || (side > 0 && idx === 0);
                const lenToe = idx === 1 ? 0.38 : 0.30;
                const mid = [F[0] + lenToe * 0.5, -2.19, dz * 0.85];
                const tip = [F[0] + lenToe, -2.21, dz * 1.15];
                bone(leg, F, mid, 0.052, 0.042, tarsusMat, 6);
                joint(leg, mid, 0.042, tarsusMat);
                bone(leg, mid, tip, 0.040, 0.030, tarsusMat, 6);
                joint(leg, tip, 0.030, tarsusMat);
                addMesh(new THREE.ConeGeometry(isInner ? 0.042 : 0.032, isInner ? 0.20 : 0.14, 6),
                    beakTipMat, leg, tip[0] + 0.07, tip[1] + (isInner ? 0.03 : 0.01), dz * 1.15,
                    0, 0, -Math.PI / 2 - (isInner ? 0.45 : 0.22));
            });
        });
    },

    animateIdle(ctx) {
        const { rig, baseHipsY, time, isWalk } = ctx;
        const freq = isWalk ? 15 : 5.5;
        rig.hips.position.y = baseHipsY + Math.abs(Math.sin(time * freq)) * (isWalk ? 0.32 : 0.07);
        rig.neck.rotation.z = isWalk ? -0.25 + Math.sin(time * freq * 2) * 0.15 : Math.sin(time * 8) * 0.06;
        rig.arms[0].rotation.x = -Math.abs(Math.sin(time * 6)) * 0.35;
        rig.arms[1].rotation.x = Math.abs(Math.sin(time * 6)) * 0.35;
        rig.legs[0].rotation.z = isWalk ? Math.sin(time * freq) * 0.72 : 0;
        rig.legs[1].rotation.z = isWalk ? -Math.sin(time * freq) * 0.72 : 0;
    },

    hasCustomDirectionals: true,

    animateAttack(ctx) {
        const { rig, act, prog, swing, strike, baseHipsY } = ctx;
        const s = strike !== undefined ? strike : swing;
        if (act === 'light') {
            rig.neck.rotation.z = -swing * 0.75;
            rig.headGroup.rotation.z = -swing * 0.45;
            rig.jaw.rotation.z = -swing * 0.5;
        } else if (act === 'light2') {
            rig.torso.rotation.y = swing * 0.35;
            rig.neck.rotation.z = -swing * 0.9;
            rig.headGroup.rotation.z = -swing * 0.55;
            rig.jaw.rotation.z = -swing * 0.7;
        } else if (act === 'fwd_light') {
            rig.hips.position.x = swing * 0.85;
            rig.neck.rotation.z = -swing * 0.8;
            rig.arms[0].rotation.x = -0.6;
            rig.arms[1].rotation.x = 0.6;
        } else if (act === 'low_light' || act === 'low_heavy') {
            rig.hips.position.y = baseHipsY - swing * 0.35;
            rig.legs[0].rotation.z = swing * 1.2;
            rig.torso.rotation.z = 0.35;
        } else if (act === 'anti_air' || act === 'up_light') {
            rig.neck.rotation.z = swing * 0.85;
            rig.headGroup.rotation.z = swing * 0.6;
            rig.jaw.rotation.z = -swing * 0.8;
            rig.arms[0].rotation.x = -1.2;
            rig.arms[1].rotation.x = 1.2;
        } else if (act === 'back_light') {
            rig.hips.position.x = -s * 0.75;
            rig.neck.rotation.z = -s * 0.65;
            rig.jaw.rotation.z = -s * 0.55;
        } else if (act === 'air_light' || act === 'air_heavy') {
            rig.torso.rotation.z = -swing * 0.7;
            rig.legs[0].rotation.z = swing * 1.3;
            rig.legs[1].rotation.z = swing * 1.1;
        } else if (act === 'fwd_heavy') {
            rig.hips.position.x = swing * 1.1;
            rig.hips.position.y = baseHipsY + swing * 0.8;
            rig.legs[0].rotation.z = swing * 1.2;
            rig.legs[1].rotation.z = swing * 1.0;
        } else if (act === 'throw') {
            rig.neck.rotation.z = -swing * 0.95;
            rig.headGroup.rotation.y = swing * 1.2;
        } else if (act === 'throw_whiff') {
            rig.hips.position.x = swing * 0.45;
            rig.neck.rotation.z = -swing * 0.4;
        } else if (act === 'heavy' || act === 'special2') {
            rig.hips.position.y = baseHipsY + swing * 1.5;
            rig.torso.rotation.z = swing * 0.35;
            rig.legs[0].rotation.z = swing * 1.1;
            rig.legs[1].rotation.z = swing * 0.9;
            rig.arms[0].rotation.x = -0.85;
            rig.arms[1].rotation.x = 0.85;
        } else if (act === 'special') {
            rig.hips.position.y = baseHipsY + Math.sin(prog * Math.PI) * 1.8;
            rig.neck.rotation.z = -swing * 0.95;
            rig.arms[0].rotation.x = -1.1;
            rig.arms[1].rotation.x = 1.1;
        }
    },

    animateFatality(ctx) {
        const { rig, prog, baseHipsY } = ctx;
        if (prog < 0.3) {
            rig.hips.position.y = baseHipsY + Math.sin((prog / 0.3) * Math.PI) * 2.5;
            rig.arms[0].rotation.x = -1.2;
            rig.arms[1].rotation.x = 1.2;
        } else if (prog < 0.78) {
            rig.neck.rotation.z = -Math.abs(Math.sin(prog * 38)) * 1.05;
        } else {
            rig.torso.rotation.z = 0.35;
            rig.neck.rotation.z = 0.45;
            rig.arms[0].rotation.x = -1.1;
            rig.arms[1].rotation.x = 1.1;
        }
    },

    executeFatality(winner, loser) {
        [900, 1250, 1600].forEach(delay => {
            setTimeout(() => {
                if (matchState !== 'fatality_anim') return;
                sfx.playHit(true);
                spawn3DBloodAndBones(loser.x, 2.1, 18, false);
            }, delay);
        });
        setTimeout(() => {
            if (matchState !== 'fatality_anim') return;
            sfx.playBoneCrack();
            sfx.playRoar(130, 0.7);
            loser.isDead = true;
            loser.hp = 0;
            const heart = new THREE.Mesh(
                new THREE.SphereGeometry(0.38, 10, 10),
                new THREE.MeshStandardMaterial({ color: 0xdc2626, emissive: 0x991b1b })
            );
            heart.position.set(winner.x + winner.facing * 1.3, 3.8, 0);
            fxGroup.add(heart);
            particles3D.push({ mesh: heart, vx: 0, vy: 1.2, vz: 0, life: 1.5 });

            spawn3DBloodAndBones(loser.x, 2.3, 65, true);
            screenShake = 0.85;
            showAnnouncer('FATALITY !', 'CŒUR ARRACHÉ PAR LE TERABIRD');
        }, 2100);
    },
});
