/* ============================================================================
 * COMBATTANT : SMILODON (Smilodon Fatalis - Tigre à Dents de Sabre)
 * Personnage Secret Déblocable en remportant le Mode Campagne d'Extinction !
 * Silhouette paléoart : grand félin machairodonte au garrot surpuissant et dos
 * incliné, pelage fauve ocre tacheté de rosettes sombres et ventre crème, courte
 * queue bobtail, brides mentonnières et deux canines sabres géantes recourbées.
 * ============================================================================ */

registerFighter({
    id: 'smilodon',
    name: 'SMILODON',
    fullName: 'Smilodon Fatalis',
    role: 'Félin Préhistorique',
    title: '« La Terreur Glaciaire du Pléistocène »',
    primaryColor: 0xc98e42,
    secondaryColor: 0x3d2614,
    accentColor: 0xe8dcc8,
    cssPrimary: '#f59e0b',
    scale: 0.84,
    previewScale: 0.95,
    stats: { pow: 92, spd: 94, def: 78 },
    maxHp: 1000,
    walkSpeed: 8.8,
    special1Name: 'Bond Prédateur (H)',
    special2Name: 'Morsure Mortelle (T)',
    fatalityName: 'Égorgement Fatal (R)',
    moveStyle: 'Démarche féline musclée, bonds fulgurants, griffes rétractiles et crocs sabres dévastateurs.',
    fatalityDesc: 'Plaque sauvagement la victime au sol, rugit à pleins poumons et transperce la gorge avec ses canines sabres colossales.',
    isUnlockable: true,
    skins: [
        { name: 'La Brea Gold', primary: 0xc98e42, secondary: 0x3d2614, accent: 0xe8dcc8 },
        { name: 'Pleistocene Gold', primary: 0xd97706, secondary: 0x78350f, accent: 0xfef08a },
        { name: 'Arctic Ghost', primary: 0xe2e8f0, secondary: 0x64748b, accent: 0xf8fafc },
        { name: 'Shadow Stalker', primary: 0x18181b, secondary: 0x09090b, accent: 0xef4444 },
        { name: 'Saber Blood', primary: 0x991b1b, secondary: 0x450a0a, accent: 0xfbbf24 }
    ]
}, {
    animBaseHipsY: 1.55,
    attackReach: 3.55,

    onSpecial(attacker, defender, dist, basePow) {
        sfx.playRoar(110, 0.4);
        attacker.vx = attacker.facing * 22;
        if (dist < 4.8) {
            applyDamage(attacker, defender, Math.round(basePow * 1.05), true, 'BOND PRÉDATEUR !');
            spawn3DBloodAndBones(defender.x, 1.8, 18, false);
            screenShake = 0.4;
        }
    },

    onSpecial2(attacker, defender, dist, basePow) {
        sfx.playRoar(90, 0.5);
        if (dist < 3.9) {
            sfx.playBoneCrack();
            applyDamage(attacker, defender, Math.round(basePow * 1.25), true, 'CROCS SABRES !');
            spawn3DBloodAndBones(defender.x, 2.0, 32, true);
            screenShake = 0.65;
        } else {
            attacker.vx = attacker.facing * 18;
        }
    },

    buildRig(ctx) {
        const { hips, rig, addMesh, bodyMat, darkMat, accentMat, boneMat, skin, skinMeshes } = ctx;
        void accentMat;

        const creamMat = new THREE.MeshStandardMaterial({ color: skin.accent || 0xe8dcc8, roughness: 0.75 });
        const noseMat = new THREE.MeshStandardMaterial({ color: 0x3b2323, roughness: 0.5 });
        const gumMat = new THREE.MeshStandardMaterial({ color: 0x7f2929, roughness: 0.6 });
        const saberMat = new THREE.MeshStandardMaterial({ color: 0xf5f0e1, roughness: 0.25, metalness: 0.1 });
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
            if (mat === creamMat) skinMeshes.push(m);
            return m;
        };
        const joint = (parent, p, r, mat) => addMesh(new THREE.SphereGeometry(r, 10, 8), mat, parent, p[0], p[1], p[2]);
        const blob = (parent, p, s, mat, rz = 0, ry = 0, rx = 0) => {
            const m = addMesh(new THREE.SphereGeometry(1, 14, 10), mat, parent, p[0], p[1], p[2], rx, ry, rz);
            m.scale.set(s[0], s[1], s[2]);
            if (mat === creamMat) skinMeshes.push(m);
            return m;
        };

        hips.position.y = 1.55;

        // =====================================================================
        // 1. TORSE FÉLIN PUISSANT : garrot très haut et musclé, dos incliné, rosettes
        // =====================================================================
        blob(rig.torso, [0.05, 0.18, 0], [1.18, 0.66, 0.58], bodyMat, 0.10);         // cage thoracique
        blob(rig.torso, [0.58, 0.42, 0], [0.68, 0.64, 0.62], bodyMat, 0.14);         // garrot / épaules colossales
        blob(rig.torso, [-0.58, 0.14, 0], [0.68, 0.56, 0.52], bodyMat, -0.08);       // arrière-train / bassin
        blob(rig.torso, [0.12, -0.22, 0], [1.04, 0.34, 0.48], creamMat, 0.10);       // poitrail et ventre crème

        // Rosettes et taches sombres sur les flancs et le dos (comme sur la planche paléoart)
        const spots = [
            [-0.78, 0.36, 0.38], [-0.52, 0.46, 0.44], [-0.22, 0.52, 0.46], [0.08, 0.56, 0.48], [0.38, 0.64, 0.46],
            [-0.68, 0.10, 0.48], [-0.36, 0.18, 0.55], [-0.04, 0.22, 0.56], [0.26, 0.28, 0.56],
            [-0.48, -0.04, 0.48], [-0.14, 0.0, 0.52], [0.18, 0.06, 0.52]
        ];
        spots.forEach(sp => {
            [-1, 1].forEach(side => {
                blob(rig.torso, [sp[0], sp[1], side * sp[2]], [0.09, 0.065, 0.03], darkMat, 0.15);
            });
        });

        // =====================================================================
        // 2. COU TRAPU ET SURPUISSANT DE SMILODON
        // =====================================================================
        rig.neck.position.set(0.98, 0.44, 0);
        rig.torso.add(rig.neck);
        bone(rig.neck, [-0.10, -0.04, 0], [0.36, 0.16, 0], 0.44, 0.38, bodyMat, 10);
        blob(rig.neck, [0.16, -0.14, 0], [0.34, 0.22, 0.32], creamMat, 0.25);

        // =====================================================================
        // 3. TÊTE FÉLINE, BRIDES MENTONNIÈRES & CANINES SABRES GÉANTES
        // =====================================================================
        rig.headGroup.position.set(0.38, 0.18, 0);
        rig.neck.add(rig.headGroup);

        // Crâne félin massif et museau large
        blob(rig.headGroup, [0.16, 0.10, 0], [0.42, 0.34, 0.36], bodyMat, -0.05);
        blob(rig.headGroup, [0.54, 0.04, 0], [0.32, 0.24, 0.28], bodyMat, -0.12);
        // Bajoues / babines crème et truffe sombre
        blob(rig.headGroup, [0.56, -0.05, 0], [0.28, 0.16, 0.29], creamMat, -0.10);
        blob(rig.headGroup, [0.82, 0.06, 0], [0.10, 0.08, 0.12], noseMat, -0.15);

        // Oreilles arrondies de grand fauve et yeux perçants
        [-1, 1].forEach(side => {
            blob(rig.headGroup, [-0.02, 0.38, side * 0.28], [0.10, 0.15, 0.12], bodyMat, -0.25, side * 0.3);
            blob(rig.headGroup, [0.01, 0.38, side * 0.29], [0.06, 0.10, 0.08], creamMat, -0.25, side * 0.3);
            addMesh(new THREE.SphereGeometry(0.052, 8, 8), irisMat, rig.headGroup, 0.36, 0.16, side * 0.28);
            addMesh(new THREE.SphereGeometry(0.026, 6, 6), pupilMat, rig.headGroup, 0.39, 0.16, side * 0.31);
            blob(rig.headGroup, [0.35, 0.23, side * 0.26], [0.13, 0.04, 0.07], darkMat, -0.1);
        });

        // LES DEUX CANINES SABRES EMBLÉMATIQUES DU SMILODON (longues lames d'ivoire recourbées)
        [-1, 1].forEach(side => {
            const C0 = [0.62, -0.06, side * 0.21];
            const C1 = [0.66, -0.34, side * 0.20];
            const C2 = [0.58, -0.62, side * 0.19];
            bone(rig.headGroup, C0, C1, 0.062, 0.046, saberMat, 7);
            bone(rig.headGroup, C1, C2, 0.046, 0.008, saberMat, 7);
        });
        // Incisives supérieures
        for (let t = -1; t <= 1; t++) {
            addMesh(new THREE.ConeGeometry(0.022, 0.09, 5), saberMat, rig.headGroup, 0.76, -0.14, t * 0.07, Math.PI, 0, 0);
        }

        // Mâchoire inférieure articulée avec brides mentonnières protectrices (Mandibular Flanges)
        rig.jaw.position.set(0.14, -0.14, 0);
        rig.headGroup.add(rig.jaw);
        blob(rig.jaw, [0.28, -0.04, 0], [0.32, 0.12, 0.22], creamMat, -0.05);
        blob(rig.jaw, [0.26, 0.02, 0], [0.26, 0.06, 0.17], gumMat);
        // Brides mentonnières descendant de chaque côté pour encadrer les canines sabres
        [-1, 1].forEach(side => {
            blob(rig.jaw, [0.46, -0.12, side * 0.14], [0.14, 0.16, 0.06], creamMat, 0.1);
            addMesh(new THREE.ConeGeometry(0.022, 0.09, 5), saberMat, rig.jaw, 0.48, 0.06, side * 0.14);
        });

        // =====================================================================
        // 4. COURTE QUEUE BOBTAIL MUSCLÉE (3 segments)
        // =====================================================================
        let pTail = rig.torso;
        for (let s = 0; s < 3; s++) {
            const seg = new THREE.Group();
            seg.position.set(s === 0 ? -1.08 : -0.26, s === 0 ? 0.16 : 0.03, 0);
            const r1 = 0.16 - s * 0.025, r2 = 0.13 - s * 0.025;
            bone(seg, [0, 0, 0], [-0.28, 0.04, 0], r1, r2, s === 2 ? darkMat : bodyMat, 7);
            if (s === 1) blob(seg, [-0.14, 0.02, 0], [0.08, r1 * 1.05, r1 * 1.05], darkMat);
            pTail.add(seg);
            rig.tailSegments.push(seg);
            pTail = seg;
        }

        // =====================================================================
        // 5. QUATRE PATTES FÉLINES PUISSANTES (avant surdimensionnées, sol à y = -1.55)
        // =====================================================================
        [
            { x: 0.68, z: -0.46, isFront: true },
            { x: 0.68, z: 0.46, isFront: true },
            { x: -0.68, z: -0.44, isFront: false },
            { x: -0.68, z: 0.44, isFront: false }
        ].forEach(pos => {
            const leg = new THREE.Group();
            leg.position.set(pos.x, 0.02, pos.z);
            hips.add(leg);
            rig.legs.push(leg);

            const side = Math.sign(pos.z);
            const K = [pos.isFront ? -0.10 : 0.16, -0.74, 0];
            const A = [pos.isFront ? 0.04 : -0.14, -1.24, 0];
            const F = [0.14, -1.48, 0];

            // Cuisse / épaule féline musclée tachetée
            blob(leg, [0.02, -0.36, 0], [pos.isFront ? 0.34 : 0.32, 0.48, 0.26], bodyMat, pos.isFront ? -0.14 : 0.18);
            blob(leg, [0.04, -0.34, side * 0.14], [0.08, 0.06, 0.04], darkMat);
            blob(leg, [-0.04, -0.52, side * 0.13], [0.07, 0.05, 0.04], darkMat);

            joint(leg, K, pos.isFront ? 0.20 : 0.17, bodyMat);
            bone(leg, K, A, pos.isFront ? 0.19 : 0.16, pos.isFront ? 0.14 : 0.12, bodyMat, 8);
            // Face interne et bas de patte crème
            bone(leg, A, F, pos.isFront ? 0.14 : 0.12, 0.11, creamMat, 7);

            // Large patte féline à coussinets et griffes rétractiles
            blob(leg, [0.20, -1.50, 0], [0.22, 0.09, 0.19], creamMat);
            [-0.10, -0.03, 0.03, 0.10].forEach(dz => {
                addMesh(new THREE.ConeGeometry(0.025, 0.11, 5), saberMat, leg, 0.38, -1.51, dz, 0, 0, -Math.PI / 2 - 0.25);
            });
        });
    },
});
