/* ============================================================================
 * COMBATTANT : ANKYLOSAURE (Ankylosaurus Magniventris)
 * Données (stats, skins, textes), modèle 3D, animations, coups spéciaux & fatalité.
 * Silhouette paléoart : blindé quadrupède bas et large, rangées transversales
 * d'ostéodermes carénés, épines latérales en dents de scie, crâne triangulaire
 * à 4 cornes pyramidales (squamosales et jugales) et lourde massue caudale bilobée.
 * ============================================================================ */

registerFighter({
    id: 'ankylo',
    name: 'ANKYLOSAURE',
    fullName: 'Ankylosaurus Magniventris',
    role: 'Forteresse Vivante',
    title: '« Le Cuirassé Caudal »',
    primaryColor: 0x706758,
    secondaryColor: 0x3d372e,
    accentColor: 0xc8beab,
    cssPrimary: '#059669',
    scale: 1.02,
    previewScale: 0.95,
    stats: { pow: 90, spd: 64, def: 99 },
    maxHp: 1200,
    walkSpeed: 6.8,
    special1Name: 'Balayage Massue (H)',
    special2Name: 'Cuirasse d’Ostéodermes (T)',
    fatalityName: 'Pulvérisation Caudale (R)',
    moveStyle: 'Démarche basse et blindée, frappe circulaire de massue osseuse caudale.',
    fatalityDesc: 'Effectue un demi-tour centrifuge avec sa massue osseuse de 50 kg, fracasse les rotules de l’opposant avant de lui aplatir la cage thoracique.',
    skins: [
        { name: 'Hell Creek Tank', primary: 0x706758, secondary: 0x3d372e, accent: 0xc8beab, belly: 0x9e9585 },
        { name: 'Bastion Iron', primary: 0x059669, secondary: 0x064e3b, accent: 0xa3e635, belly: 0x6ee7b7 },
        { name: 'Obsidian Shell', primary: 0x18181b, secondary: 0x09090b, accent: 0xf59e0b, belly: 0x3f3f46 },
        { name: 'Desert Dune', primary: 0xa16207, secondary: 0x713f12, accent: 0xfef08a, belly: 0xfde047 },
        { name: 'Toxic Carapace', primary: 0x4d7c0f, secondary: 0x365314, accent: 0x86efac, belly: 0xbef264 }
    ]
}, {
    animBaseHipsY: 1.35,

    onSpecial2(attacker, defender, dist, basePow) {
        spawn3DProjectile(attacker, 'boulder');
    },

    buildRig(ctx) {
        const { hips, rig, addMesh, bodyMat, darkMat, accentMat, boneMat, skin, skinMeshes } = ctx;

        const bellyMat = new THREE.MeshStandardMaterial({ color: skin.belly || 0x9e9585, roughness: 0.75 });
        const hornMat = new THREE.MeshStandardMaterial({ color: skin.accent || 0xc8beab, roughness: 0.45, metalness: 0.05 });
        const beakMat = new THREE.MeshStandardMaterial({ color: 0x292524, roughness: 0.5 });
        const irisMat = new THREE.MeshBasicMaterial({ color: 0xd97706 });
        const pupilMat = new THREE.MeshBasicMaterial({ color: 0x09090b });
        void accentMat;
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
            if (mat === bellyMat || mat === hornMat) skinMeshes.push(m);
            return m;
        };
        const spike = (parent, p, r, len, rx, ry, rz, mat = hornMat) =>
            addMesh(new THREE.ConeGeometry(r, len, 5), mat, parent, p[0], p[1], p[2], rx, ry, rz);

        hips.position.y = 1.35;

        // =====================================================================
        // 1. CARAPACE BLINDÉE LARGE ET SURBAISSÉE + OSTÉODERMES EN RANGÉES
        // =====================================================================
        blob(rig.torso, [0.0, 0.16, 0], [1.45, 0.68, 1.02], bodyMat, -0.03);        // dôme principal
        blob(rig.torso, [0.0, 0.34, 0], [1.36, 0.52, 0.94], darkMat, -0.03);        // cuirasse dorsale sombre
        blob(rig.torso, [0.05, -0.18, 0], [1.28, 0.36, 0.86], bellyMat, -0.02);     // ventre clair souple

        // Bandes transversales d'ostéodermes carénés + frange d'épines latérales en dents de scie
        const rowX = [-1.05, -0.75, -0.42, -0.08, 0.26, 0.58, 0.88, 1.14];
        rowX.forEach((rx, idx) => {
            const t = 1 - Math.pow((rx - 0.05) / 1.35, 2);
            const archY = 0.22 + Math.max(0.1, t) * 0.48;
            const halfW = 0.45 + Math.max(0.05, t) * 0.52;

            // Arceau transversal de cuirasse
            blob(rig.torso, [rx, archY - 0.14, 0], [0.13, 0.36, halfW], darkMat);

            // Ostéodermes dorsaux carénés (3 paires par bande)
            [0.18, 0.48, 0.76].forEach((frac, k) => {
                [-1, 1].forEach(side => {
                    const oz = side * halfW * frac;
                    const oy = archY - frac * frac * 0.32;
                    blob(rig.torso, [rx, oy, oz], [0.13, 0.08, 0.09], k === 0 ? hornMat : darkMat, 0, 0, side * frac * 0.5);
                });
            });

            // Grandes épines marginales latérales pointant vers l'extérieur et l'arrière
            [-1, 1].forEach(side => {
                const sz = side * (halfW + 0.06);
                const sy = 0.12 + Math.max(0, t) * 0.12;
                const sLen = 0.28 + Math.max(0, t) * 0.14;
                spike(rig.torso, [rx - 0.04, sy, sz], 0.09, sLen, side * 1.18, 0, 0.45, hornMat);
            });
            void idx;
        });

        // =====================================================================
        // 2. COU BLINDÉ (DEMI-ANNEAUX CERVICAUX) & CRÂNE TRIANGULAIRE À 4 CORNES
        // =====================================================================
        rig.neck.position.set(1.26, 0.08, 0);
        rig.torso.add(rig.neck);
        bone(rig.neck, [-0.08, 0, 0], [0.28, -0.04, 0], 0.38, 0.32, bodyMat, 8);
        // Demi-anneau cervical blindé
        blob(rig.neck, [0.12, 0.14, 0], [0.16, 0.22, 0.38], darkMat, -0.1);
        [-1, 1].forEach(side => {
            spike(rig.neck, [0.12, 0.10, side * 0.38], 0.07, 0.22, side * 1.1, 0, 0.35, hornMat);
        });

        rig.headGroup.position.set(0.28, -0.04, 0);
        rig.neck.add(rig.headGroup);

        // Crâne massif, large à l'arrière et busqué vers le bec
        blob(rig.headGroup, [0.28, 0.04, 0], [0.42, 0.28, 0.36], darkMat, -0.12);
        blob(rig.headGroup, [0.58, -0.04, 0], [0.28, 0.22, 0.24], bodyMat, -0.25);
        // Plaques crâniennes (caputegulae) sur le front
        blob(rig.headGroup, [0.34, 0.22, 0], [0.34, 0.12, 0.30], hornMat, -0.15);
        // Bec corné sombre recourbé à l'avant
        blob(rig.headGroup, [0.76, -0.12, 0], [0.16, 0.16, 0.16], beakMat, -0.4);

        // Les 4 cornes pyramidales emblématiques d'Ankylosaurus :
        // 2 cornes squamosales (en haut à l'arrière, pointant en haut et en arrière)
        // 2 cornes jugales (sur les joues en bas, pointant sur les côtés et vers le bas)
        [-1, 1].forEach(side => {
            spike(rig.headGroup, [0.06, 0.26, side * 0.32], 0.10, 0.34, side * 0.55, 0, 0.65, hornMat);
            spike(rig.headGroup, [0.14, -0.10, side * 0.38], 0.09, 0.30, side * 1.35, 0, 0.40, hornMat);
            // Œil protégé par une paupière osseuse
            blob(rig.headGroup, [0.40, 0.10, side * 0.30], [0.11, 0.05, 0.06], hornMat);
            addMesh(new THREE.SphereGeometry(0.048, 8, 8), irisMat, rig.headGroup, 0.40, 0.04, side * 0.31);
            addMesh(new THREE.SphereGeometry(0.025, 6, 6), pupilMat, rig.headGroup, 0.42, 0.04, side * 0.34);
        });

        // Mâchoire inférieure
        rig.jaw.position.set(0.18, -0.16, 0);
        rig.headGroup.add(rig.jaw);
        blob(rig.jaw, [0.26, -0.02, 0], [0.30, 0.10, 0.20], bellyMat, -0.08);
        blob(rig.jaw, [0.50, -0.02, 0], [0.12, 0.09, 0.13], beakMat, 0.1);

        // =====================================================================
        // 3. QUEUE RAIDIE + LOURDE MASSUE OSSEUSE BILOBÉE (Tail Club)
        // =====================================================================
        let pTail = rig.torso;
        const tLens = [0.68, 0.68, 0.72];
        const tRads = [0.34, 0.25, 0.17, 0.13];
        for (let s = 0; s < 3; s++) {
            const seg = new THREE.Group();
            seg.position.set(s === 0 ? -1.28 : -tLens[s - 1], s === 0 ? 0.14 : 0, 0);
            const len = tLens[s], r1 = tRads[s], r2 = tRads[s + 1];
            bone(seg, [0, 0, 0], [-len, 0, 0], r1, r2, bodyMat, 8);
            // Anneaux d'ostéodermes et épines caudales sur les 2 premiers segments
            if (s < 2) {
                blob(seg, [-len * 0.45, r1 * 0.5, 0], [0.14, 0.10, r1 * 0.95], darkMat);
                [-1, 1].forEach(side => {
                    spike(seg, [-len * 0.45, 0.02, side * (r1 + 0.04)], 0.06, 0.22, side * 1.25, 0, 0.5, hornMat);
                });
            }
            pTail.add(seg);
            rig.tailSegments.push(seg);
            pTail = seg;
        }

        // Massue caudale bilobée en os massif au bout du manche raidi (tendons ossifiés)
        const clubGroup = new THREE.Group();
        clubGroup.position.set(-0.72, 0, 0);
        // Deux gros lobes latéraux majeurs + lobe terminal médian
        blob(clubGroup, [-0.08, 0.02, 0.22], [0.42, 0.26, 0.26], hornMat, 0, -0.15);
        blob(clubGroup, [-0.08, 0.02, -0.22], [0.42, 0.26, 0.26], hornMat, 0, 0.15);
        blob(clubGroup, [-0.36, 0.0, 0], [0.28, 0.22, 0.26], darkMat);
        blob(clubGroup, [0.18, 0.02, 0], [0.22, 0.18, 0.28], darkMat);
        pTail.add(clubGroup);
        rig.specialParts.tailClub = clubGroup;

        // =====================================================================
        // 4. QUATRE PATTES TRAPUES ET ROBUSTES (sol à y = -1.35)
        // =====================================================================
        [
            { x: 0.78, z: -0.68, isFront: true },
            { x: 0.78, z: 0.68, isFront: true },
            { x: -0.78, z: -0.68, isFront: false },
            { x: -0.78, z: 0.68, isFront: false }
        ].forEach(pos => {
            const leg = new THREE.Group();
            leg.position.set(pos.x, -0.05, pos.z);
            hips.add(leg);
            rig.legs.push(leg);

            const side = Math.sign(pos.z);
            const H = [0, 0, 0];
            const K = [pos.isFront ? -0.10 : 0.14, -0.62, side * 0.06];
            const F = [0.06, -1.24, side * 0.04];

            blob(leg, [0, -0.32, 0], [0.28, 0.42, 0.24], bodyMat, pos.isFront ? -0.15 : 0.15);
            joint(leg, K, 0.18, darkMat);
            bone(leg, K, F, 0.18, 0.15, darkMat, 8);
            // Écailles blindées sur l'avant-bras / tibia
            blob(leg, [K[0] * 0.5, -0.88, side * 0.14], [0.14, 0.22, 0.08], hornMat);
            // Pied large à sabots émoussés
            blob(leg, [0.12, -1.26, side * 0.04], [0.24, 0.10, 0.22], darkMat);
            [-0.12, -0.04, 0.04, 0.12].forEach(dz => {
                spike(leg, [0.32, -1.28, side * 0.04 + dz], 0.035, 0.10, 0, 0, -Math.PI / 2 - 0.2, hornMat);
            });
        });
    },

    animateIdle(ctx) {
        const { rig, baseHipsY, time, isWalk } = ctx;
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

    animateAttack(ctx) {
        const { rig, act, prog, swing, strike, baseHipsY } = ctx;
        const s = strike !== undefined ? strike : swing;

        if (act === 'light') {
            rig.hips.position.x = s * 0.75;
            rig.torso.rotation.x = s * 0.45;
            rig.headGroup.rotation.y = s * 0.35;
        } else if (act === 'light2') {
            rig.hips.position.x = s * 0.85;
            rig.torso.rotation.x = -s * 0.35;
            rig.headGroup.rotation.y = -s * 0.45;
            rig.headGroup.rotation.z = -s * 0.35;
        } else if (act === 'fwd_light') {
            rig.hips.position.x = s * 1.1;
            rig.torso.rotation.z = -s * 0.38;
            rig.headGroup.rotation.z = -s * 0.45;
        } else if (act === 'low_light' || act === 'low_heavy') {
            rig.hips.position.y = baseHipsY * 0.6;
            rig.torso.rotation.z = -0.25;
            rig.tailSegments.forEach(seg => {
                seg.rotation.y = Math.cos(prog * Math.PI) * 1.15;
                seg.rotation.z = -0.22;
            });
        } else if (act === 'anti_air' || act === 'up_light') {
            rig.hips.position.y = baseHipsY + s * 0.45;
            rig.torso.rotation.z = -s * 0.45;
            rig.tailSegments.forEach(seg => { seg.rotation.z = s * 0.85; });
        } else if (act === 'throw') {
            rig.hips.position.x = s * 0.85;
            rig.tailSegments.forEach(seg => { seg.rotation.y = Math.sin(prog * 20) * 0.65; });
        } else if (act === 'heavy' || act === 'special') {
            rig.hips.rotation.y = prog * Math.PI * 2;
            rig.tailSegments.forEach(seg => { seg.rotation.y = 0.48; });
        } else if (act === 'fwd_heavy') {
            rig.hips.position.x = s * 1.35;
            rig.torso.rotation.z = -s * 0.45;
        } else if (act === 'air_light' || act === 'air_heavy') {
            rig.torso.rotation.z = -s * 0.45;
            rig.tailSegments.forEach(seg => { seg.rotation.z = 0.55; });
        } else if (act === 'back_light') {
            rig.hips.position.x = -s * 0.65;
            rig.torso.rotation.x = s * 0.35;
        } else if (act === 'special2') {
            rig.hips.position.y = baseHipsY + s * 0.8;
            rig.torso.rotation.z = -prog * Math.PI * 4;
        }
    },

    animateFatality(ctx) {
        const { rig, prog } = ctx;
        if (prog < 0.45) {
            rig.hips.rotation.y = Math.sin(prog * Math.PI * 2) * 1.8;
        } else {
            const p = (prog - 0.45) / 0.55;
            rig.hips.rotation.y = p * Math.PI * 4;
            rig.tailSegments.forEach(s => { s.rotation.y = 0.5; s.rotation.z = 0.25; });
        }
    },

    executeFatality(winner, loser) {
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
