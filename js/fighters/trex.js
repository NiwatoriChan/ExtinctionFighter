/* ============================================================================
 * COMBATTANT : T-REX (Tyrannosaurus Rex)
 * Données (stats, skins, textes), modèle 3D, animations, coups spéciaux & fatalité.
 * Silhouette paléoart : posture horizontale équilibrée, crâne massif et profond
 * à arcades sourcilières proéminentes, cou en S musclé, petits bras à 2 doigts,
 * flancs tigrés, cuisses colossales digitigrades et lourde queue de balancier.
 * ============================================================================ */

registerFighter({
    id: 'trex',
    name: 'T-REX',
    fullName: 'Tyrannosaurus Rex',
    role: 'Apex Carnivore',
    title: '« Le Roi Sanglant du Crétacé »',
    primaryColor: 0x9e4734,
    secondaryColor: 0x2e211b,
    accentColor: 0xf59e0b,
    cssPrimary: '#dc2626',
    scale: 1.10,
    previewScale: 0.92,
    stats: { pow: 96, spd: 72, def: 85 },
    maxHp: 1050,
    walkSpeed: 7.8,
    special1Name: 'Morsure Sismique (H)',
    special2Name: 'Rugissement de Magma (T)',
    fatalityName: 'Dévoration Royale (R)',
    moveStyle: 'Foulée bipède lourde, morsure plongeante et balayage caudal rotatif.',
    fatalityDesc: 'Saisit la victime dans ses mâchoires géantes, la secoue violemment, arrache la tête et l’avale dans une gerbe de sang.',
    skins: [
        { name: 'Paleo Tyrant', primary: 0x9e4734, secondary: 0x2e211b, accent: 0xf59e0b, belly: 0xc99e7e },
        { name: 'Apex Crimson', primary: 0xdc2626, secondary: 0x7f1d1d, accent: 0xf59e0b, belly: 0xfca5a5 },
        { name: 'Abyssal Shadow', primary: 0x18181b, secondary: 0x09090b, accent: 0x38bdf8, belly: 0x3f3f46 },
        { name: 'Albino Phantom', primary: 0xe2e8f0, secondary: 0x64748b, accent: 0xd946ef, belly: 0xf8fafc },
        { name: 'Molten Core', primary: 0x7c2d12, secondary: 0x451a03, accent: 0xf97316, belly: 0xfdba74 }
    ]
}, {
    animBaseHipsY: 2.1,

    onSpecial2(attacker, defender, dist, basePow) {
        spawn3DProjectile(attacker, 'boulder');
    },

    buildRig(ctx) {
        const { hips, rig, addMesh, bodyMat, darkMat, accentMat, boneMat, skin, skinMeshes } = ctx;

        const bellyMat = new THREE.MeshStandardMaterial({ color: skin.belly || 0xc99e7e, roughness: 0.7, metalness: 0.05 });
        const gumMat = new THREE.MeshStandardMaterial({ color: 0x6b2121, roughness: 0.6 });
        const clawMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.45 });
        const irisMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
        const pupilMat = new THREE.MeshBasicMaterial({ color: 0x09090b });
        skinMeshes.push;

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
            if (mat === bellyMat) skinMeshes.push(m);
            return m;
        };
        const claw = (parent, p, len, r, rz = -Math.PI / 2 - 0.3) =>
            addMesh(new THREE.ConeGeometry(r, len, 6), clawMat, parent, p[0], p[1], p[2], 0, 0, rz);

        hips.position.y = 2.1;

        // =====================================================================
        // 1. TORSE : cage thoracique profonde, bassin puissant, rayures sombres
        // =====================================================================
        blob(rig.torso, [0.05, 0.22, 0], [1.32, 0.78, 0.72], bodyMat, 0.08);      // cage thoracique
        blob(rig.torso, [-0.55, 0.28, 0], [0.85, 0.72, 0.68], bodyMat, -0.05);    // région pelvienne / ilion
        blob(rig.torso, [0.65, 0.24, 0], [0.72, 0.66, 0.64], bodyMat, 0.15);      // épaules / poitrail
        blob(rig.torso, [0.1, -0.18, 0], [1.12, 0.45, 0.58], bellyMat, 0.06);     // ventre clair
        blob(rig.torso, [0.0, 0.68, 0], [1.22, 0.32, 0.52], darkMat, 0.08);       // dos sombre

        // Rayures tigrées verticales sur le dos et les flancs (style paléoart)
        [-0.85, -0.52, -0.18, 0.16, 0.48, 0.78].forEach((rx, i) => {
            const h = 0.52 - Math.abs(i - 2.5) * 0.04;
            blob(rig.torso, [rx, 0.46, 0], [0.09, h, 0.73 - Math.abs(rx) * 0.12], darkMat, 0.15);
        });

        // =====================================================================
        // 2. COU : épais et musclé en S (muscles nuchaux puissants)
        // =====================================================================
        rig.neck.position.set(1.02, 0.42, 0);
        rig.torso.add(rig.neck);
        bone(rig.neck, [-0.1, -0.05, 0], [0.42, 0.52, 0], 0.52, 0.44, bodyMat, 10);
        blob(rig.neck, [0.18, 0.34, 0], [0.48, 0.36, 0.42], darkMat, 0.55);       // bosse musculaire de la nuque
        blob(rig.neck, [0.24, 0.06, 0], [0.42, 0.26, 0.36], bellyMat, 0.45);      // gorge souple
        // Rayures cervicales
        [0.05, 0.26].forEach(nx => {
            blob(rig.neck, [nx, 0.38 + nx * 0.4, 0], [0.07, 0.26, 0.43], darkMat, 0.4);
        });

        // =====================================================================
        // 3. TÊTE : crâne massif et haut, museau lourd, arcades sourcilières
        // =====================================================================
        rig.headGroup.position.set(0.46, 0.62, 0);
        rig.neck.add(rig.headGroup);

        // Arrière-crâne large (fenêtres temporales et muscles adducteurs)
        blob(rig.headGroup, [0.12, 0.18, 0], [0.48, 0.38, 0.44], bodyMat, -0.05);
        blob(rig.headGroup, [0.08, 0.40, 0], [0.42, 0.20, 0.40], darkMat, -0.05);
        // Museau massif et profond (maxillaire & os nasal rugueux)
        blob(rig.headGroup, [0.72, 0.14, 0], [0.62, 0.32, 0.34], bodyMat, -0.06);
        blob(rig.headGroup, [1.12, 0.10, 0], [0.32, 0.27, 0.28], bodyMat, -0.1);
        // Crête nasale sombre rugueuse sur le dessus du museau
        blob(rig.headGroup, [0.78, 0.36, 0], [0.52, 0.12, 0.20], darkMat, -0.08);

        // Bosses lacrymales / arcades sourcilières proéminentes et yeux de prédateur
        [-1, 1].forEach(side => {
            // Arcade osseuse au-dessus et devant l'œil
            blob(rig.headGroup, [0.32, 0.38, side * 0.32], [0.22, 0.10, 0.12], darkMat, 0.15);
            blob(rig.headGroup, [0.14, 0.34, side * 0.35], [0.14, 0.11, 0.11], darkMat, -0.2);
            // Globe oculaire (vision binoculaire légèrement orientée vers l'avant)
            addMesh(new THREE.SphereGeometry(0.075, 10, 8), irisMat, rig.headGroup, 0.30, 0.24, side * 0.36);
            addMesh(new THREE.SphereGeometry(0.038, 8, 6), pupilMat, rig.headGroup, 0.34, 0.24, side * 0.41);
            // Narine charnue
            blob(rig.headGroup, [1.18, 0.20, side * 0.22], [0.08, 0.045, 0.04], darkMat);
        });

        // Palais et rangées de grandes dents coniques supérieures ("bananes d'os")
        blob(rig.headGroup, [0.68, -0.06, 0], [0.55, 0.08, 0.28], gumMat);
        for (let t = 0; t < 7; t++) {
            const tx = 0.30 + t * 0.14;
            const tLen = (t >= 2 && t <= 4) ? 0.20 : 0.13;
            const tRad = (t >= 2 && t <= 4) ? 0.038 : 0.026;
            [-1, 1].forEach(side => {
                const z = side * (0.28 - t * 0.012);
                addMesh(new THREE.ConeGeometry(tRad, tLen, 6), boneMat, rig.headGroup, tx, -0.14, z, Math.PI, 0, 0.08);
            });
        }

        // Mâchoire inférieure articulée (profonde à l'arrière avec muscle ptérygoïdien)
        rig.jaw.position.set(0.05, -0.12, 0);
        rig.headGroup.add(rig.jaw);
        blob(rig.jaw, [0.22, -0.06, 0], [0.38, 0.20, 0.36], bodyMat, 0.08);       // muscle mandibulaire arrière
        blob(rig.jaw, [0.68, -0.08, 0], [0.56, 0.14, 0.26], bellyMat, -0.04);     // branche mandibulaire
        blob(rig.jaw, [1.02, -0.07, 0], [0.26, 0.12, 0.21], darkMat, -0.02);      // menton
        blob(rig.jaw, [0.55, 0.02, 0], [0.46, 0.07, 0.20], gumMat);               // langue / gencive
        for (let t = 0; t < 6; t++) {
            const tx = 0.32 + t * 0.13;
            [-1, 1].forEach(side => {
                addMesh(new THREE.ConeGeometry(0.026, 0.12, 5), boneMat, rig.jaw, tx, 0.06, side * (0.22 - t * 0.01), 0, 0, -0.05);
            });
        }

        // =====================================================================
        // 4. PETITS BRAS À DEUX DOIGTS GRIFFUS
        // =====================================================================
        [-1, 1].forEach(side => {
            const arm = new THREE.Group();
            arm.position.set(0.88, -0.08, side * 0.52);
            rig.torso.add(arm);
            rig.arms.push(arm);

            const S = [0, 0, 0], E = [-0.08, -0.28, side * 0.04], H = [0.18, -0.44, side * 0.02];
            joint(arm, S, 0.11, bodyMat);
            bone(arm, S, E, 0.10, 0.075, bodyMat, 7);
            joint(arm, E, 0.075, darkMat);
            bone(arm, E, H, 0.07, 0.05, darkMat, 7);
            // 2 doigts caractéristiques de Tyrannosaure
            [-0.025, 0.025].forEach(dz => {
                claw(arm, [H[0] + 0.08, H[1] - 0.03, H[2] + dz], 0.11, 0.022, -Math.PI / 2 - 0.45);
            });
        });

        // =====================================================================
        // 5. LONGUE QUEUE MUSCLÉE EN BALANCIER (4 segments articulés)
        // =====================================================================
        let parentTail = rig.torso;
        const tailRadii = [0.52, 0.38, 0.25, 0.14, 0.04];
        const tailLengths = [0.92, 0.92, 0.90, 0.95];
        for (let s = 0; s < 4; s++) {
            const seg = new THREE.Group();
            seg.position.set(s === 0 ? -1.05 : -tailLengths[s - 1], s === 0 ? 0.22 : 0, 0);
            const r1 = tailRadii[s], r2 = tailRadii[s + 1], len = tailLengths[s];
            bone(seg, [0, 0, 0], [-len, 0.02, 0], r1, r2, bodyMat, 10);
            // Dessous plus clair et bandes sombres sur le dessus
            bone(seg, [-0.05, -r1 * 0.35, 0], [-len + 0.05, -r2 * 0.35, 0], r1 * 0.65, r2 * 0.6, bellyMat, 8);
            blob(seg, [-len * 0.32, r1 * 0.45, 0], [0.10, r1 * 0.65, r1 * 0.95], darkMat, 0.1);
            blob(seg, [-len * 0.75, r2 * 0.55, 0], [0.10, r2 * 0.70, r2 * 0.95], darkMat, 0.1);
            parentTail.add(seg);
            rig.tailSegments.push(seg);
            parentTail = seg;
        }

        // =====================================================================
        // 6. PATTES ARRIÈRE DIGITIGRADES PUISSANTES (sol à y = -2.1)
        // =====================================================================
        [-1, 1].forEach(side => {
            const leg = new THREE.Group();
            leg.position.set(-0.22, 0.05, side * 0.52);
            hips.add(leg);
            rig.legs.push(leg);

            const H = [0, 0, 0];
            const K = [0.28, -0.78, side * 0.04];     // genou avancé
            const A = [-0.22, -1.52, side * 0.04];    // cheville / jarret surélevé
            const F = [0.12, -2.02, side * 0.05];     // base des orteils

            // Énorme cuisse musclée avec rayures
            blob(leg, [0.08, -0.38, side * 0.02], [0.46, 0.58, 0.36], bodyMat, 0.25);
            blob(leg, [0.10, -0.25, side * 0.16], [0.32, 0.08, 0.24], darkMat, 0.15);
            blob(leg, [0.12, -0.48, side * 0.15], [0.28, 0.07, 0.22], darkMat, 0.2);

            // Jambe (tibia / mollet) et métatarse
            joint(leg, K, 0.24, bodyMat);
            bone(leg, K, A, 0.24, 0.15, bodyMat, 9);
            blob(leg, [0.0, -1.08, side * 0.04], [0.22, 0.34, 0.20], darkMat, -0.45); // galbe du mollet
            joint(leg, A, 0.15, darkMat);
            bone(leg, A, F, 0.14, 0.12, darkMat, 8);

            // Pied puissant à 3 orteils porteurs + ergot (hallux)
            joint(leg, F, 0.13, darkMat);
            [-0.14, 0, 0.14].forEach((dz, idx) => {
                const lenToe = idx === 1 ? 0.44 : 0.34;
                const tip = [F[0] + lenToe, -2.08, F[2] + dz];
                bone(leg, F, tip, 0.07, 0.048, darkMat, 6);
                claw(leg, [tip[0] + 0.08, tip[1], tip[2]], 0.18, 0.045, -Math.PI / 2 - 0.15);
            });
            // Ergot interne (hallux)
            claw(leg, [-0.14, -1.78, F[2] - side * 0.10], 0.12, 0.03, Math.PI / 2 + 0.4);
        });
    },

    // Animation d'attente (idle) / de marche
    animateIdle(ctx) {
        const { rig, baseHipsY, time, isWalk } = ctx;
        const freq = isWalk ? 11 : 3.5;
        rig.hips.position.y = baseHipsY + Math.abs(Math.sin(time * freq)) * (isWalk ? 0.22 : 0.06);
        rig.torso.rotation.z = isWalk ? -0.12 + Math.sin(time * freq) * 0.06 : Math.sin(time * 3) * 0.03;
        rig.jaw.rotation.z = -0.08 - Math.abs(Math.sin(time * 2.5)) * 0.12;
        rig.legs[0].rotation.z = isWalk ? Math.sin(time * freq) * 0.55 : 0;
        rig.legs[1].rotation.z = isWalk ? -Math.sin(time * freq) * 0.55 : 0;
        rig.tailSegments.forEach((seg, i) => {
            seg.rotation.y = Math.sin(time * freq - i * 0.5) * (isWalk ? 0.22 : 0.1);
        });
    },

    hasCustomDirectionals: true,

    animateAttack(ctx) {
        const { rig, act, prog, swing, strike } = ctx;
        const s = strike !== undefined ? strike : swing;

        if (act === 'light') {
            rig.torso.rotation.z = -s * 0.35;
            rig.torso.rotation.y = s * 0.25;
            rig.neck.rotation.z = -s * 0.30;
            rig.jaw.rotation.z = -s * 0.75;
        } else if (act === 'light2') {
            rig.torso.rotation.z = -s * 0.42;
            rig.torso.rotation.y = -s * 0.35;
            rig.neck.rotation.z = -s * 0.38;
            rig.jaw.rotation.z = -s * 1.05;
            rig.tailSegments.forEach(seg => { seg.rotation.y = s * 0.4; });
        } else if (act === 'fwd_light') {
            rig.hips.position.x = s * 0.95;
            rig.torso.rotation.z = -s * 0.42;
            rig.neck.rotation.z = -s * 0.45;
            rig.jaw.rotation.z = -s * 0.85;
        } else if (act === 'low_light' || act === 'low_heavy') {
            rig.hips.position.y = 1.35;
            rig.torso.rotation.z = -0.38;
            rig.neck.rotation.z = -0.40;
            rig.jaw.rotation.z = -s * 0.75;
            rig.tailSegments.forEach((seg, i) => { seg.rotation.y = Math.cos(prog * Math.PI) * 0.75; void i; });
        } else if (act === 'anti_air' || act === 'up_light') {
            rig.hips.position.y = 2.1 + s * 0.65;
            rig.torso.rotation.z = s * 0.55;
            rig.neck.rotation.z = s * 0.45;
            rig.headGroup.rotation.z = s * 0.65;
            rig.jaw.rotation.z = -s * 1.25;
            rig.tailSegments.forEach(seg => { seg.rotation.z = -s * 0.45; });
        } else if (act === 'throw') {
            rig.hips.position.x = s * 0.85;
            rig.torso.rotation.y = Math.sin(prog * 22) * 0.45;
            rig.jaw.rotation.z = prog < 0.35 ? -1.15 : -0.25;
        } else if (act === 'heavy' || act === 'fwd_heavy') {
            rig.hips.rotation.y = prog * Math.PI * 2;
            rig.tailSegments.forEach(seg => { seg.rotation.y = 0.42; });
        } else if (act === 'air_light' || act === 'air_heavy') {
            rig.torso.rotation.z = -0.58;
            rig.jaw.rotation.z = -s * 0.85;
        } else if (act === 'back_light') {
            rig.hips.position.x = -s * 0.75;
            rig.torso.rotation.z = s * 0.25;
            rig.jaw.rotation.z = -s * 0.85;
        } else if (act === 'special' || act === 'special2') {
            rig.torso.rotation.z = s * 0.28;
            rig.headGroup.rotation.z = s * 0.45;
            rig.jaw.rotation.z = -0.75;
        }
    },

    animateFatality(ctx) {
        const { rig, prog } = ctx;
        if (prog < 0.3) {
            rig.torso.rotation.z = -0.35;
            rig.neck.rotation.z = -0.4;
            rig.jaw.rotation.z = -0.7;
        } else if (prog < 0.72) {
            rig.torso.rotation.z = 0.25;
            rig.headGroup.rotation.y = Math.sin(prog * 45) * 0.55;
            rig.headGroup.rotation.z = Math.cos(prog * 35) * 0.35;
            rig.jaw.rotation.z = -0.25;
        } else {
            rig.torso.rotation.z = 0.35;
            rig.headGroup.rotation.z = 0.65;
            rig.jaw.rotation.z = Math.sin(prog * 30) * 0.35 - 0.35;
        }
    },

    executeFatality(winner, loser) {
        setTimeout(() => {
            if (matchState !== 'fatality_anim') return;
            sfx.playBoneCrack();
            spawn3DBloodAndBones(loser.x, 2.5, 35, true);
            spawnFloatingPopup(loser.x, 'MÂCHOIRE ROYALE !', '#ef4444');
        }, 950);
        setTimeout(() => {
            if (matchState !== 'fatality_anim') return;
            sfx.playBoneCrack();
            sfx.playRoar(52, 0.9);
            loser.decapitated = true;
            loser.isDead = true;
            loser.hp = 0;
            spawn3DBloodAndBones(loser.x, 2.8, 65, true);
            screenShake = 0.9;
            showAnnouncer('FATALITY !', 'T-REX DÉVORE SA PROIE');
        }, 2200);
    },
});
