/* ============================================================================
 * COMBATTANT : STÉGOSAURE (Stegosaurus Stenops)
 * Données (stats, skins, textes), modèle 3D, animations, coups spéciaux & fatalité.
 * Silhouette paléoart : dos puissamment voûté (bassin très haut, épaules basses),
 * tout petit crâne allongé au bout d'un cou bas à ossicules gulaires, deux rangées
 * alternées de grandes plaques pentagonales nervurées et thagomiseur à 4 pointes.
 * ============================================================================ */

registerFighter({
    id: 'stegosaurus',
    name: 'STÉGOSAURE',
    fullName: 'Stegosaurus Stenops',
    role: 'Sentinelle à Plaques',
    title: '« Le Mur d’Épines et de Plaques »',
    primaryColor: 0x787e5c,
    secondaryColor: 0x454a34,
    accentColor: 0xb59268,
    cssPrimary: '#b45309',
    scale: 1.08,
    previewScale: 0.88,
    stats: { pow: 92, spd: 68, def: 95 },
    maxHp: 1160,
    walkSpeed: 7.2,
    special1Name: 'Thagomiseur Caudal (H)',
    special2Name: 'Écran Thermique (T)',
    fatalityName: 'Transfixion Quadruple (R)',
    moveStyle: 'Marche quadrupède lourde rythmée par ses doubles rangées de plaques dorsales et ses 4 pointes caudales.',
    fatalityDesc: 'Pivote à 180° et empale le torse et la cage thoracique ennemie de ses 4 pointes osseuses d’un mètre avant de projeter la dépouille.',
    skins: [
        { name: 'Morrison Sage', primary: 0x787e5c, secondary: 0x454a34, accent: 0xb59268, belly: 0x9fa483 },
        { name: 'Solar Shield', primary: 0xb45309, secondary: 0x78350f, accent: 0xf59e0b, belly: 0xfde68a },
        { name: 'Verdant Grove', primary: 0x166534, secondary: 0x14532d, accent: 0x22c55e, belly: 0x86efac },
        { name: 'Cobalt Night', primary: 0x1e3a8a, secondary: 0x172554, accent: 0x3b82f6, belly: 0x93c5fd },
        { name: 'Basalt Magma', primary: 0x27272a, secondary: 0x18181b, accent: 0xf97316, belly: 0x52525b }
    ]
}, {
    animBaseHipsY: 1.65,

    onSpecial2(attacker, defender, dist, basePow) {
        special2SeismicQuake(attacker, defender, dist, basePow);
    },

    buildRig(ctx) {
        const { hips, rig, addMesh, bodyMat, darkMat, accentMat, boneMat, skin, skinMeshes } = ctx;
        void accentMat;

        const bellyMat = new THREE.MeshStandardMaterial({ color: skin.belly || 0x9fa483, roughness: 0.75 });
        const plateMat = new THREE.MeshStandardMaterial({
            color: skin.accent || 0xb59268,
            roughness: 0.55,
            metalness: 0.08,
            side: THREE.DoubleSide
        });
        const plateEdgeMat = new THREE.MeshStandardMaterial({ color: skin.secondary || 0x454a34, roughness: 0.65 });
        const beakMat = new THREE.MeshStandardMaterial({ color: 0x292524, roughness: 0.5 });
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
            if (mat === bellyMat) skinMeshes.push(m);
            return m;
        };
        const makePentagonPlate = (parent, x, y, z, w, h, tiltZ = 0.12, tiltX = 0) => {
            const g = new THREE.BufferGeometry();
            const pts = [
                [0, 0, 0],
                [-w * 0.34, 0, 0],
                [-w * 0.52, h * 0.50, 0],
                [0, h, 0],
                [w * 0.52, h * 0.55, 0],
                [w * 0.34, 0, 0]
            ];
            g.setAttribute('position', new THREE.Float32BufferAttribute(pts.flat(), 3));
            g.setIndex([0, 1, 2, 0, 2, 3, 0, 3, 4, 0, 4, 5]);
            g.computeVertexNormals();
            const grp = new THREE.Group();
            grp.position.set(x, y, z);
            grp.rotation.set(tiltX, 0, tiltZ);
            const m = addMesh(g, plateMat, grp);
            skinMeshes.push(m);
            // Nervure centrale et bordure sombre
            bone(grp, [0, 0, 0], [0, h * 0.96, 0], w * 0.06, 0.012, plateEdgeMat, 5);
            bone(grp, [-w * 0.30, 0.02, 0], [-w * 0.48, h * 0.48, 0], 0.025, 0.015, plateEdgeMat, 4);
            bone(grp, [w * 0.30, 0.02, 0], [w * 0.48, h * 0.52, 0], 0.025, 0.015, plateEdgeMat, 4);
            parent.add(grp);
            return grp;
        };

        hips.position.y = 1.65;

        // =====================================================================
        // 1. TORSE : dos très haut et arqué sur le bassin, plongeant vers les épaules
        // =====================================================================
        blob(rig.torso, [-0.18, 0.32, 0], [1.18, 0.92, 0.78], bodyMat, -0.22);      // voûte dorsale / bassin haut
        blob(rig.torso, [0.68, -0.02, 0], [0.76, 0.65, 0.66], bodyMat, -0.32);      // poitrail et épaules basses
        blob(rig.torso, [-0.10, 0.72, 0], [1.12, 0.46, 0.58], darkMat, -0.22);      // crête dorsale sombre
        blob(rig.torso, [0.05, -0.22, 0], [1.15, 0.44, 0.66], bellyMat, -0.18);     // ventre clair

        // =====================================================================
        // 2. DEUX RANGÉES ALTERNÉES DE PLAQUES PENTAGONALES (CERVICALES + DORSALES)
        // =====================================================================
        const platesGroup = new THREE.Group();
        rig.torso.add(platesGroup);
        rig.specialParts.plates = platesGroup;

        const torsoPlates = [
            { x: -1.08, y: 0.55, w: 0.58, h: 0.72, tz: 0.30 },
            { x: -0.78, y: 0.78, w: 0.78, h: 0.98, tz: 0.22 },
            { x: -0.44, y: 0.96, w: 0.94, h: 1.18, tz: 0.14 },
            { x: -0.08, y: 1.02, w: 0.98, h: 1.24, tz: 0.05 },
            { x: 0.28,  y: 0.94, w: 0.88, h: 1.10, tz: -0.06 },
            { x: 0.60,  y: 0.72, w: 0.72, h: 0.88, tz: -0.16 },
            { x: 0.88,  y: 0.45, w: 0.54, h: 0.65, tz: -0.26 },
            { x: 1.10,  y: 0.22, w: 0.38, h: 0.45, tz: -0.32 }
        ];
        torsoPlates.forEach((p, i) => {
            const side = (i % 2 === 0) ? 1 : -1;
            makePentagonPlate(platesGroup, p.x, p.y, side * 0.14, p.w, p.h, p.tz, side * 0.12);
        });

        // =====================================================================
        // 3. COU BAS À PETITES PLAQUES & TÊTE ÉTROITE ET ALLONGÉE
        // =====================================================================
        rig.neck.position.set(1.18, -0.12, 0);
        rig.torso.add(rig.neck);
        const N0 = [0, 0, 0], N1 = [0.42, -0.14, 0], N2 = [0.78, -0.16, 0];
        bone(rig.neck, N0, N1, 0.38, 0.26, bodyMat, 8);
        joint(rig.neck, N1, 0.25, bodyMat);
        bone(rig.neck, N1, N2, 0.25, 0.18, bodyMat, 8);
        bone(rig.neck, [0.02, -0.12, 0], [0.74, -0.24, 0], 0.24, 0.12, bellyMat, 7);

        // Petites plaques cervicales sur la nuque
        [0.12, 0.34, 0.55, 0.72].forEach((nx, idx) => {
            const side = idx % 2 === 0 ? 1 : -1;
            makePentagonPlate(rig.neck, nx, 0.16 - nx * 0.22, side * 0.08, 0.26 - idx * 0.03, 0.32 - idx * 0.04, -0.2, side * 0.1);
        });

        rig.headGroup.position.set(0.80, -0.16, 0);
        rig.neck.add(rig.headGroup);
        // Petite tête tubulaire profilée caractéristique de Stegosaurus
        blob(rig.headGroup, [0.16, 0.02, 0], [0.28, 0.15, 0.15], bodyMat, -0.05);
        bone(rig.headGroup, [0.18, 0.02, 0], [0.58, -0.02, 0], 0.13, 0.08, bodyMat, 7);
        // Bec corné (rhamphothèque) à l'avant
        blob(rig.headGroup, [0.64, -0.03, 0], [0.12, 0.08, 0.08], beakMat, -0.15);

        [-1, 1].forEach(side => {
            addMesh(new THREE.SphereGeometry(0.038, 8, 8), irisMat, rig.headGroup, 0.26, 0.05, side * 0.13);
            addMesh(new THREE.SphereGeometry(0.02, 6, 6), pupilMat, rig.headGroup, 0.28, 0.05, side * 0.15);
        });

        rig.jaw.position.set(0.14, -0.07, 0);
        rig.headGroup.add(rig.jaw);
        bone(rig.jaw, [0, 0, 0], [0.46, 0.01, 0], 0.08, 0.045, bellyMat, 6);

        // =====================================================================
        // 4. QUEUE PUISSANTE + PLAQUES CAUDALES + THAGOMISEUR (4 ÉPINES D'OS)
        // =====================================================================
        let pTail = rig.torso;
        const tLens = [0.76, 0.74, 0.72, 0.75];
        const tRads = [0.48, 0.36, 0.25, 0.15, 0.06];
        for (let s = 0; s < 4; s++) {
            const seg = new THREE.Group();
            seg.position.set(s === 0 ? -1.12 : -tLens[s - 1], s === 0 ? 0.24 : -0.04, 0);
            const len = tLens[s], r1 = tRads[s], r2 = tRads[s + 1];
            bone(seg, [0, 0, 0], [-len, -0.04, 0], r1, r2, bodyMat, 8);
            bone(seg, [0, -r1 * 0.35, 0], [-len, -0.04 - r2 * 0.35, 0], r1 * 0.65, r2 * 0.6, bellyMat, 7);

            // Plaques caudales sur les 3 premiers segments
            if (s < 3) {
                const side = s % 2 === 0 ? -1 : 1;
                const pw = 0.48 - s * 0.11;
                const ph = 0.60 - s * 0.14;
                makePentagonPlate(seg, -len * 0.48, r1 * 0.55, side * 0.09, pw, ph, 0.32, side * 0.12);
            }
            pTail.add(seg);
            rig.tailSegments.push(seg);
            pTail = seg;
        }

        // Thagomiseur : 4 longues pointes osseuses (2 paires) à l'extrémité de la queue
        const thago = new THREE.Group();
        thago.position.set(-0.35, 0.02, 0);
        [-1, 1].forEach(side => {
            // Paire antérieure (plus longue, dressée à 45°)
            bone(thago, [0.12, 0.04, side * 0.06], [-0.48, 0.52, side * 0.46], 0.065, 0.008, boneMat, 6);
            // Paire postérieure (orientée plus vers l'arrière)
            bone(thago, [-0.14, 0.02, side * 0.05], [-0.76, 0.38, side * 0.38], 0.055, 0.007, boneMat, 6);
        });
        pTail.add(thago);
        rig.specialParts.thagomizer = thago;

        // =====================================================================
        // 5. PATTES AVANT COURTES (rig.arms) & PATTES ARRIÈRE HAUTES (rig.legs)
        // =====================================================================
        [-1, 1].forEach(side => {
            // Membre antérieur court et musclé (sol à y = -1.65)
            const fLeg = new THREE.Group();
            fLeg.position.set(0.75, -0.20, side * 0.56);
            hips.add(fLeg);
            rig.arms.push(fLeg);

            const S = [0, 0, 0], E = [-0.12, -0.64, side * 0.06], W = [0.08, -1.36, side * 0.04];
            blob(fLeg, [-0.04, -0.30, 0], [0.28, 0.40, 0.24], bodyMat, -0.18);
            joint(fLeg, E, 0.18, darkMat);
            bone(fLeg, E, W, 0.18, 0.15, darkMat, 8);
            blob(fLeg, [0.14, -1.40, side * 0.04], [0.22, 0.09, 0.20], darkMat);
            [-0.10, 0, 0.10].forEach(dz => {
                addMesh(new THREE.ConeGeometry(0.035, 0.09, 5), beakMat, fLeg, 0.32, -1.42, side * 0.04 + dz, 0, 0, -Math.PI / 2 - 0.2);
            });

            // Membre postérieur colonnaire très haut (sol à y = -1.65)
            const hLeg = new THREE.Group();
            hLeg.position.set(-0.56, 0.12, side * 0.58);
            hips.add(hLeg);
            rig.legs.push(hLeg);

            const H = [0, 0, 0], K = [0.14, -0.88, side * 0.04], A = [-0.04, -1.68, side * 0.04];
            blob(hLeg, [0.04, -0.44, 0], [0.38, 0.56, 0.30], bodyMat, 0.12);
            joint(hLeg, K, 0.22, bodyMat);
            bone(hLeg, K, A, 0.22, 0.17, darkMat, 8);
            blob(hLeg, [0.06, -1.72, side * 0.04], [0.26, 0.10, 0.24], darkMat);
            [-0.11, 0, 0.11].forEach(dz => {
                addMesh(new THREE.ConeGeometry(0.04, 0.10, 5), beakMat, hLeg, 0.26, -1.74, side * 0.04 + dz, 0, 0, -Math.PI / 2 - 0.2);
            });
        });
    },
});
