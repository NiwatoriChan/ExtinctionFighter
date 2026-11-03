/* ============================================================================
 * COMBATTANT : MAIASAURA (Maiasaura Peeblesorum)
 * Données (stats, skins, textes), modèle 3D, animations, coups spéciaux & fatalité.
 * Silhouette paléoart : hadrosauridé athlétique à peau tigrée olive et ocre,
 * large bec de canard aplati, courte crête osseuse pointue entre les yeux,
 * crête de denticules dermiques le long de l'échine et longue queue de balancier.
 * ============================================================================ */

registerFighter({
    id: 'maiasaura',
    name: 'MAIASAURA',
    fullName: 'Maiasaura Peeblesorum',
    role: 'Protectrice Féroce',
    title: '« La Bonne Mère Indomptable »',
    primaryColor: 0x6c7a42,
    secondaryColor: 0x3b4424,
    accentColor: 0xc89646,
    cssPrimary: '#10b981',
    scale: 0.98,
    previewScale: 0.92,
    stats: { pow: 82, spd: 86, def: 78 },
    maxHp: 980,
    walkSpeed: 9.2,
    special1Name: 'Ruade Maternelle (H)',
    special2Name: 'Cri d’Alerte Sonique (T)',
    fatalityName: 'Frénésie du Nid (R)',
    moveStyle: 'Galop agile à deux et quatre pattes, ruades foudroyantes et ondes sonores stridentes.',
    fatalityDesc: 'Pousse un hurlement qui paralyse le système nerveux adverse, puis piétine frénétiquement le torse de la victime jusqu’à dislocation complète.',
    skins: [
        { name: 'Two Medicine Matriarch', primary: 0x6c7a42, secondary: 0x3b4424, accent: 0xc89646, belly: 0xbab693 },
        { name: 'Matriarch Flora', primary: 0x10b981, secondary: 0x065f46, accent: 0xfbbf24, belly: 0xa7f3d0 },
        { name: 'Autumn Ember', primary: 0xb45309, secondary: 0x9a3412, accent: 0xfed7aa, belly: 0xfde68a },
        { name: 'Cherry Blossom', primary: 0xbe185d, secondary: 0x9d174d, accent: 0xfce7f3, belly: 0xfbcfe8 },
        { name: 'Silver Meadow', primary: 0x475569, secondary: 0x334155, accent: 0x38bdf8, belly: 0xcbd5e1 }
    ]
}, {
    animBaseHipsY: 1.95,

    onSpecial2(attacker, defender, dist, basePow) {
        spawn3DProjectile(attacker, 'sonic');
    },

    buildRig(ctx) {
        const { hips, rig, addMesh, bodyMat, darkMat, accentMat, skin, skinMeshes } = ctx;

        const bellyMat = new THREE.MeshStandardMaterial({ color: skin.belly || 0xbab693, roughness: 0.75 });
        const stripeMat = new THREE.MeshStandardMaterial({ color: skin.accent || 0xc89646, roughness: 0.65 });
        const beakMat = new THREE.MeshStandardMaterial({ color: 0x38342c, roughness: 0.5 });
        const irisMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
        const pupilMat = new THREE.MeshBasicMaterial({ color: 0x09090b });
        void accentMat;

        const UP = new THREE.Vector3(0, 1, 0);
        const bone = (parent, a, b, r1, r2, mat, seg = 8) => {
            const A = new THREE.Vector3(a[0], a[1], a[2]);
            const B = new THREE.Vector3(b[0], b[1], b[2]);
            const dir = B.clone().sub(A);
            const len = dir.length();
            const m = addMesh(new THREE.CylinderGeometry(r2, r1, len, seg), mat, parent,
                (A.x + B.x) / 2, (A.y + B.y) / 2, (A.z + B.z) / 2);
            m.quaternion.setFromUnitVectors(UP, dir.normalize());
            if (mat === bellyMat || mat === stripeMat) skinMeshes.push(m);
            return m;
        };
        const joint = (parent, p, r, mat) => addMesh(new THREE.SphereGeometry(r, 10, 8), mat, parent, p[0], p[1], p[2]);
        const blob = (parent, p, s, mat, rz = 0, ry = 0, rx = 0) => {
            const m = addMesh(new THREE.SphereGeometry(1, 14, 10), mat, parent, p[0], p[1], p[2], rx, ry, rz);
            m.scale.set(s[0], s[1], s[2]);
            if (mat === bellyMat || mat === stripeMat) skinMeshes.push(m);
            return m;
        };

        hips.position.y = 1.95;

        // =====================================================================
        // 1. TORSE D'HADROSAURE : bassin haut, dos arqué à crête dermique, rayures ocre
        // =====================================================================
        blob(rig.torso, [-0.08, 0.24, 0], [1.22, 0.76, 0.66], bodyMat, 0.06);
        blob(rig.torso, [-0.48, 0.34, 0], [0.82, 0.72, 0.62], bodyMat, -0.06);      // croupe / sacrum saillant
        blob(rig.torso, [0.62, 0.14, 0], [0.68, 0.60, 0.56], bodyMat, 0.12);        // poitrail
        blob(rig.torso, [0.05, -0.20, 0], [1.08, 0.40, 0.54], bellyMat, 0.04);      // ventre clair
        blob(rig.torso, [-0.05, 0.66, 0], [1.14, 0.28, 0.44], darkMat, 0.06);       // dos sombre

        // Bandes tigrées ocre sur les flancs et le dos (comme sur la planche paléoart)
        [-0.82, -0.50, -0.18, 0.14, 0.44, 0.72].forEach((sx, i) => {
            blob(rig.torso, [sx, 0.34, 0], [0.10, 0.54 - Math.abs(i - 2.5) * 0.03, 0.67 - Math.abs(sx) * 0.12], stripeMat, 0.18);
        });

        // Crête continue de petites écailles rectangulaires sur la ligne médiane du dos
        for (let x = -1.05; x <= 0.85; x += 0.14) {
            const dy = 0.92 - Math.pow((x + 0.1) * 0.65, 2) * 0.35;
            addMesh(new THREE.BoxGeometry(0.09, 0.11, 0.05), darkMat, rig.torso, x, dy, 0, 0, 0, 0.08);
        }

        // =====================================================================
        // 2. COU GRACIEUX EN S À FANON GULAIRE
        // =====================================================================
        rig.neck.position.set(0.96, 0.32, 0);
        rig.torso.add(rig.neck);
        const N0 = [0, 0, 0], N1 = [0.28, 0.38, 0], N2 = [0.42, 0.78, 0];
        bone(rig.neck, N0, N1, 0.36, 0.27, bodyMat, 9);
        joint(rig.neck, N1, 0.26, bodyMat);
        bone(rig.neck, N1, N2, 0.26, 0.21, bodyMat, 9);
        bone(rig.neck, [0.06, -0.08, 0], [0.44, 0.68, 0], 0.24, 0.15, bellyMat, 8);
        // Écailles cervicales
        for (let c = 0; c < 5; c++) {
            const t = c / 4;
            addMesh(new THREE.BoxGeometry(0.07, 0.08, 0.04), darkMat, rig.neck, t * 0.36, 0.18 + t * 0.62, 0, 0, 0, -0.45);
        }

        // =====================================================================
        // 3. TÊTE À BEC DE CANARD PLAT & CRÊTE NASALE COURTE (MAIASAURA)
        // =====================================================================
        rig.headGroup.position.set(0.44, 0.82, 0);
        rig.neck.add(rig.headGroup);

        // Arrière-crâne et joues musclées
        blob(rig.headGroup, [0.12, 0.04, 0], [0.34, 0.23, 0.24], bodyMat, -0.08);
        blob(rig.headGroup, [0.16, 0.04, 0], [0.24, 0.17, 0.25], bellyMat, -0.05);
        // Chanfrein incliné vers le bec
        bone(rig.headGroup, [0.22, 0.06, 0], [0.64, -0.04, 0], 0.18, 0.13, bodyMat, 8);

        // Large bec de canard aplati et spatulé à l'avant (rhamphothèque sombre)
        blob(rig.headGroup, [0.76, -0.07, 0], [0.24, 0.09, 0.22], beakMat, -0.12);
        blob(rig.headGroup, [0.68, -0.04, 0], [0.20, 0.11, 0.18], bodyMat, -0.15);

        // Crête osseuse pleine courte et pointue juste au-dessus des yeux (typique de Maiasaura)
        const crest = new THREE.Group();
        crest.position.set(0.18, 0.24, 0);
        blob(crest, [0, 0.04, 0], [0.16, 0.12, 0.11], stripeMat, 0.35);
        addMesh(new THREE.ConeGeometry(0.10, 0.22, 5), darkMat, crest, -0.02, 0.12, 0, 0, 0, 0.25);
        rig.headGroup.add(crest);
        rig.specialParts.sonicCrest = crest;

        // Yeux et grandes narines allongées
        [-1, 1].forEach(side => {
            addMesh(new THREE.SphereGeometry(0.048, 8, 8), irisMat, rig.headGroup, 0.22, 0.08, side * 0.21);
            addMesh(new THREE.SphereGeometry(0.024, 6, 6), pupilMat, rig.headGroup, 0.24, 0.08, side * 0.24);
            blob(rig.headGroup, [0.56, 0.01, side * 0.13], [0.11, 0.035, 0.03], darkMat, -0.2);
        });

        // Mâchoire inférieure
        rig.jaw.position.set(0.14, -0.10, 0);
        rig.headGroup.add(rig.jaw);
        bone(rig.jaw, [0, 0, 0], [0.52, -0.02, 0], 0.12, 0.09, bellyMat, 7);
        blob(rig.jaw, [0.58, -0.02, 0], [0.16, 0.07, 0.17], beakMat, 0.05);

        // =====================================================================
        // 4. BRAS AGILES À MAINS EN MOUFLE SABOTÉE
        // =====================================================================
        [-1, 1].forEach(side => {
            const arm = new THREE.Group();
            arm.position.set(0.76, -0.08, side * 0.44);
            rig.torso.add(arm);
            rig.arms.push(arm);

            const S = [0, 0, 0], E = [-0.10, -0.44, side * 0.05], H = [0.24, -0.86, side * 0.04];
            blob(arm, [-0.02, -0.20, 0], [0.16, 0.28, 0.14], bodyMat, -0.15);
            bone(arm, S, E, 0.14, 0.10, bodyMat, 7);
            joint(arm, E, 0.10, bodyMat);
            bone(arm, E, H, 0.10, 0.07, darkMat, 7);
            // Main d'hadrosaure enveloppée en sabot
            blob(arm, [H[0] + 0.08, H[1] - 0.06, H[2]], [0.12, 0.06, 0.09], beakMat, -0.4);
        });

        // =====================================================================
        // 5. LONGUE QUEUE HAUTE COMPRIMÉE LATÉRALEMENT À BANDES OCRE (4 segments)
        // =====================================================================
        let pTail = rig.torso;
        const tLens = [0.85, 0.85, 0.82, 0.85];
        const tRads = [0.46, 0.34, 0.23, 0.13, 0.04];
        for (let s = 0; s < 4; s++) {
            const seg = new THREE.Group();
            seg.position.set(s === 0 ? -1.08 : -tLens[s - 1], s === 0 ? 0.20 : 0, 0);
            const len = tLens[s], r1 = tRads[s], r2 = tRads[s + 1];
            bone(seg, [0, 0, 0], [-len, 0, 0], r1, r2, bodyMat, 8);
            bone(seg, [0, -r1 * 0.35, 0], [-len, -r2 * 0.35, 0], r1 * 0.65, r2 * 0.6, bellyMat, 7);
            // Bandes ocre et crête d'écailles caudales
            blob(seg, [-len * 0.35, r1 * 0.2, 0], [0.11, r1 * 0.85, r1 * 0.88], stripeMat, 0.1);
            blob(seg, [-len * 0.78, r2 * 0.2, 0], [0.10, r2 * 0.85, r2 * 0.88], darkMat, 0.1);
            if (s < 3) {
                for (let k = 0; k < 3; k++) {
                    addMesh(new THREE.BoxGeometry(0.08, 0.09 - s * 0.02, 0.04), darkMat, seg, -0.2 - k * 0.26, r1 * 0.78, 0);
                }
            }
            pTail.add(seg);
            rig.tailSegments.push(seg);
            pTail = seg;
        }

        // =====================================================================
        // 6. PATTES ARRIÈRE PUISSANTES À 3 SABOTS (sol à y = -1.95)
        // =====================================================================
        [-1, 1].forEach(side => {
            const leg = new THREE.Group();
            leg.position.set(-0.24, 0.04, side * 0.46);
            hips.add(leg);
            rig.legs.push(leg);

            const H = [0, 0, 0], K = [0.24, -0.74, side * 0.04], A = [-0.18, -1.44, side * 0.04], F = [0.10, -1.88, side * 0.04];
            blob(leg, [0.06, -0.36, 0], [0.40, 0.52, 0.32], bodyMat, 0.22);
            // Rayures ocre sur la cuisse
            blob(leg, [0.08, -0.28, side * 0.14], [0.28, 0.09, 0.22], stripeMat, 0.18);
            blob(leg, [0.10, -0.48, side * 0.13], [0.24, 0.08, 0.20], stripeMat, 0.22);

            joint(leg, K, 0.21, bodyMat);
            bone(leg, K, A, 0.20, 0.13, bodyMat, 8);
            joint(leg, A, 0.13, darkMat);
            bone(leg, A, F, 0.13, 0.11, darkMat, 7);

            // Pied trilobé à sabots larges d'hadrosaure
            [-0.12, 0, 0.12].forEach((dz, i) => {
                const tip = [F[0] + (i === 1 ? 0.34 : 0.26), -1.94, F[2] + dz];
                bone(leg, F, tip, 0.06, 0.05, darkMat, 5);
                blob(leg, [tip[0] + 0.05, tip[1], tip[2]], [0.07, 0.04, 0.06], beakMat);
            });
        });
    },

    animateIdle(ctx) {
        const { rig, baseHipsY, time, isWalk } = ctx;
        const freq = isWalk ? 14 : 5;
        rig.hips.position.y = baseHipsY + Math.abs(Math.sin(time * freq)) * (isWalk ? 0.28 : 0.08);
        rig.neck.rotation.z = Math.sin(time * freq) * 0.1;
        rig.legs[0].rotation.z = isWalk ? Math.sin(time * freq) * 0.62 : 0;
        rig.legs[1].rotation.z = isWalk ? -Math.sin(time * freq) * 0.62 : 0;
        rig.tailSegments.forEach((seg, i) => {
            seg.rotation.y = Math.sin(time * 5 - i * 0.5) * 0.18;
        });
    },

    hasCustomDirectionals: true,

    animateAttack(ctx) {
        const { rig, act, prog, swing, baseHipsY } = ctx;
        if (act === 'light') {
            rig.arms[0].rotation.z = swing * 1.2;
            rig.headGroup.rotation.z = -swing * 0.35;
        } else if (act === 'light2') {
            rig.arms[1].rotation.z = swing * 1.2;
            rig.headGroup.rotation.z = swing * 0.35;
        } else if (act === 'fwd_light') {
            rig.hips.position.x = swing * 0.75;
            rig.neck.rotation.z = -swing * 0.6;
            rig.headGroup.rotation.z = -swing * 0.45;
        } else if (act === 'low_light' || act === 'low_heavy') {
            rig.hips.position.y = baseHipsY - swing * 0.3;
            rig.tailSegments.forEach(s => { s.rotation.y = -swing * 0.85; });
        } else if (act === 'anti_air' || act === 'up_light') {
            rig.neck.rotation.z = swing * 0.75;
            rig.headGroup.rotation.z = swing * 0.55;
            if (rig.specialParts.sonicCrest) rig.specialParts.sonicCrest.scale.setScalar(1 + swing * 0.5);
        } else if (act === 'back_light') {
            rig.hips.position.x = -swing * 0.7;
            rig.headGroup.rotation.z = swing * 0.45;
        } else if (act === 'air_light' || act === 'air_heavy') {
            rig.hips.rotation.z = -swing * 0.4;
            rig.legs[0].rotation.z = swing * 0.9;
        } else if (act === 'fwd_heavy') {
            rig.hips.position.x = swing * 1.1;
            rig.neck.rotation.z = -swing * 0.55;
            rig.arms[0].rotation.z = swing * 1.2;
            rig.arms[1].rotation.z = swing * 1.2;
        } else if (act === 'throw') {
            rig.arms[0].rotation.z = 0.8;
            rig.arms[1].rotation.z = 0.8;
            rig.headGroup.rotation.z = -0.6;
        } else if (act === 'throw_whiff') {
            rig.hips.position.x = swing * 0.35;
            rig.arms[0].rotation.z = 0.5;
        } else if (act === 'heavy' || act === 'special2') {
            rig.hips.position.y = baseHipsY + swing * 1.35;
            rig.hips.rotation.z = prog * Math.PI * 2;
            rig.legs[0].rotation.z = 0.85;
            rig.legs[1].rotation.z = -0.85;
        } else if (act === 'special') {
            rig.neck.rotation.z = -swing * 0.35;
            rig.headGroup.rotation.z = swing * 0.25;
        }
    },

    animateFatality(ctx) {
        const { rig, prog } = ctx;
        rig.torso.rotation.z = -0.22;
        rig.neck.rotation.z = -0.3 + Math.sin(prog * 60) * 0.08;
        if (rig.specialParts.sonicCrest) {
            rig.specialParts.sonicCrest.scale.setScalar(1 + Math.sin(prog * 50) * 0.4);
        }
    },

    executeFatality(winner, loser) {
        const sonicInterval = setInterval(() => {
            if (matchState !== 'fatality_anim') { clearInterval(sonicInterval); return; }
            spawn3DProjectile(winner, 'sonic');
            loser.rig.headGroup.scale.multiplyScalar(1.22);
        }, 320);

        setTimeout(() => {
            clearInterval(sonicInterval);
            if (matchState !== 'fatality_anim') return;
            sfx.playBoneCrack();
            loser.decapitated = true;
            loser.isDead = true;
            loser.hp = 0;
            spawn3DBloodAndBones(loser.x, 2.8, 75, true);
            screenShake = 0.9;
            showAnnouncer('FATALITY !', 'EXPLOSION ULTRASONIQUE');
        }, 2150);
    },
});
