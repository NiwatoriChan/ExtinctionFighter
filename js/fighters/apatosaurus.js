/* ============================================================================
 * COMBATTANT : APATOSAURE (Apatosaurus Ajax)
 * Données (stats, skins, textes), modèle 3D, animations, coups spéciaux & fatalité.
 * Silhouette paléoart : sauropode diplodocidé massif, 4 pattes colonnaires d'éléphant,
 * cou extrêmement épais et profond à fanons ventraux, petite tête allongée et
 * très longue queue en fouet supersonique.
 * ============================================================================ */

registerFighter({
    id: 'apato',
    name: 'APATOSAURE',
    fullName: 'Apatosaurus Ajax',
    role: 'Titan Sismique',
    title: '« Le Fléau des Tempêtes »',
    primaryColor: 0x787166,
    secondaryColor: 0x454038,
    accentColor: 0xa69e90,
    cssPrimary: '#7c3aed',
    scale: 1.25,
    previewScale: 0.72,
    stats: { pow: 98, spd: 58, def: 94 },
    maxHp: 1250,
    walkSpeed: 6.2,
    special1Name: 'Fouet Caudal Supersonique (H)',
    special2Name: 'Piétinement Sismique (T)',
    fatalityName: 'Écrasement Titanesque (R)',
    moveStyle: 'Pas titanesque faisant trembler le sol, claquement de queue supersonique.',
    fatalityDesc: 'Dresse ses pattes antérieures dans le ciel orageux et s’abat de tout son poids de 30 tonnes, réduisant la victime en purée sous ses sabots.',
    skins: [
        { name: 'Jurassic Behemoth', primary: 0x787166, secondary: 0x454038, accent: 0xa69e90 },
        { name: 'Royal Titan', primary: 0x7c3aed, secondary: 0x4c1d95, accent: 0x38bdf8 },
        { name: 'Mossy Mountain', primary: 0x15803d, secondary: 0x14532d, accent: 0x86efac },
        { name: 'Sand Behemoth', primary: 0x92400e, secondary: 0x78350f, accent: 0xfde68a },
        { name: 'Cosmic Nebula', primary: 0x1e1b4b, secondary: 0x0f172a, accent: 0xc4b5fd }
    ]
}, {
    animBaseHipsY: 2.1,
    attackReach: 4.3,

    onSpecial(attacker, defender, dist, basePow) {
        if (dist < 6.4) {
            applyDamage(attacker, defender, Math.round(basePow * 1.15), true, 'FOUET SUPERSONIQUE !');
        }
    },

    onSpecial2(attacker, defender, dist, basePow) {
        special2SeismicQuake(attacker, defender, dist, basePow);
    },

    buildRig(ctx) {
        const { hips, rig, addMesh, bodyMat, darkMat, accentMat, skin, skinMeshes } = ctx;

        const bellyMat = new THREE.MeshStandardMaterial({ color: skin.accent || 0xa69e90, roughness: 0.75 });
        const nailMat = new THREE.MeshStandardMaterial({ color: 0x292524, roughness: 0.5 });
        const irisMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
        const pupilMat = new THREE.MeshBasicMaterial({ color: 0x09090b });
        void accentMat;

        const UP = new THREE.Vector3(0, 1, 0);
        const bone = (parent, a, b, r1, r2, mat, seg = 10) => {
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

        hips.position.y = 2.05;

        // =====================================================================
        // 1. CORPS COLOSSAL DE SAUROPODE : garrot et croupe hauts, flancs profonds
        // =====================================================================
        blob(rig.torso, [0.0, 0.34, 0], [1.46, 0.96, 0.88], bodyMat, -0.04);        // fût thoracique
        blob(rig.torso, [-0.55, 0.48, 0], [0.95, 0.88, 0.82], bodyMat, 0.06);       // croupe / bassin élevé
        blob(rig.torso, [0.72, 0.32, 0], [0.85, 0.82, 0.78], bodyMat, -0.10);       // poitrail massif
        blob(rig.torso, [-0.05, 0.86, 0], [1.34, 0.42, 0.62], darkMat, -0.04);      // échine dorsale sombre
        blob(rig.torso, [0.05, -0.18, 0], [1.26, 0.48, 0.74], bellyMat, -0.02);     // ventre clair

        // Petites épines dermiques le long de la crête dorsale
        for (let i = -1.1; i <= 0.9; i += 0.25) {
            addMesh(new THREE.ConeGeometry(0.045, 0.18, 5), darkMat, rig.torso, i, 1.24 - Math.abs(i + 0.2) * 0.14, 0, 0, 0, 0.1);
        }

        // =====================================================================
        // 2. COU EXTRÊMEMENT ÉPAIS ET MUSCLÉ D'APATOSAURUS (3 segments articulés)
        // =====================================================================
        let pNeck = rig.torso;
        const neckSegments = [];
        const neckDefs = [
            { pos: [1.08, 0.48, 0], end: [0.76, 0.44, 0], r1: 0.56, r2: 0.44 },
            { pos: [0.74, 0.42, 0], end: [0.72, 0.42, 0], r1: 0.44, r2: 0.32 },
            { pos: [0.70, 0.40, 0], end: [0.64, 0.26, 0], r1: 0.32, r2: 0.20 }
        ];
        neckDefs.forEach((nd, n) => {
            const nSeg = new THREE.Group();
            nSeg.position.set(nd.pos[0], nd.pos[1], nd.pos[2]);
            joint(nSeg, [0, 0, 0], nd.r1 * 0.92, bodyMat);
            // Fût principal et fanon cervical inférieur profond (propre à Apatosaurus !)
            bone(nSeg, [0, 0, 0], nd.end, nd.r1, nd.r2, bodyMat, 10);
            bone(nSeg, [0.04, -nd.r1 * 0.42, 0], [nd.end[0], nd.end[1] - nd.r2 * 0.45, 0], nd.r1 * 0.72, nd.r2 * 0.68, bellyMat, 8);
            bone(nSeg, [-0.04, nd.r1 * 0.38, 0], [nd.end[0] - 0.04, nd.end[1] + nd.r2 * 0.38, 0], nd.r1 * 0.55, nd.r2 * 0.52, darkMat, 8);
            pNeck.add(nSeg);
            neckSegments.push(nSeg);
            pNeck = nSeg;
        });
        rig.neck = neckSegments[0];
        rig.specialParts.neckSegments = neckSegments;

        // =====================================================================
        // 3. PETITE TÊTE PROFILÉE DE DIPLODOCIDÉ
        // =====================================================================
        rig.headGroup.position.set(0.64, 0.26, 0);
        pNeck.add(rig.headGroup);

        blob(rig.headGroup, [0.14, 0.04, 0], [0.28, 0.20, 0.19], darkMat, -0.08);   // crâne postérieur
        bone(rig.headGroup, [0.16, 0.0, 0], [0.58, -0.08, 0], 0.16, 0.11, bodyMat, 8); // museau incliné
        blob(rig.headGroup, [0.60, -0.09, 0], [0.14, 0.09, 0.13], bodyMat, -0.1);   // bout du museau carré

        [-1, 1].forEach(side => {
            addMesh(new THREE.SphereGeometry(0.042, 8, 8), irisMat, rig.headGroup, 0.22, 0.06, side * 0.17);
            addMesh(new THREE.SphereGeometry(0.022, 6, 6), pupilMat, rig.headGroup, 0.24, 0.06, side * 0.19);
            blob(rig.headGroup, [0.32, 0.14, side * 0.08], [0.06, 0.03, 0.03], nailMat); // narine haute
        });

        rig.jaw.position.set(0.14, -0.10, 0);
        rig.headGroup.add(rig.jaw);
        bone(rig.jaw, [0, 0, 0], [0.44, -0.01, 0], 0.11, 0.08, bellyMat, 7);

        // =====================================================================
        // 4. LONGUE QUEUE FOUET EFFILÉE (5 segments articulés)
        // =====================================================================
        let pTail = rig.torso;
        const tLens = [0.92, 0.92, 0.90, 0.88, 0.95];
        const tRads = [0.58, 0.40, 0.26, 0.15, 0.07, 0.015];
        for (let s = 0; s < 5; s++) {
            const seg = new THREE.Group();
            seg.position.set(s === 0 ? -1.24 : -tLens[s - 1], s === 0 ? 0.34 : -0.04, 0);
            const len = tLens[s], r1 = tRads[s], r2 = tRads[s + 1];
            joint(seg, [0, 0, 0], r1 * 0.92, bodyMat);
            bone(seg, [0, 0, 0], [-len, -0.04, 0], r1, r2, s >= 3 ? darkMat : bodyMat, 9);
            if (s < 3) {
                bone(seg, [0, -r1 * 0.35, 0], [-len, -0.04 - r2 * 0.35, 0], r1 * 0.65, r2 * 0.6, bellyMat, 7);
            }
            pTail.add(seg);
            rig.tailSegments.push(seg);
            pTail = seg;
        }

        // =====================================================================
        // 5. QUATRE PILIERS MASSIFS D'ÉLÉPHANT (sol à y = -2.05)
        // =====================================================================
        [
            { x: 0.86, z: -0.58, isFront: true },
            { x: 0.86, z: 0.58, isFront: true },
            { x: -0.78, z: -0.62, isFront: false },
            { x: -0.78, z: 0.62, isFront: false }
        ].forEach(pos => {
            const leg = new THREE.Group();
            leg.position.set(pos.x, 0.05, pos.z);
            hips.add(leg);
            rig.legs.push(leg);

            const side = Math.sign(pos.z);
            const H = [0, 0, 0];
            const K = [pos.isFront ? -0.08 : 0.10, -0.95, 0];
            const F = [0.04, -1.96, 0];

            // Cuisse / épaule monumentale
            blob(leg, [0, -0.45, 0], [pos.isFront ? 0.38 : 0.46, 0.62, 0.36], bodyMat, pos.isFront ? -0.08 : 0.08);
            joint(leg, K, 0.30, bodyMat);
            bone(leg, K, F, 0.30, 0.28, darkMat, 10);
            // Pied semi-lunaire éléphantin avec griffe interne (pollex) sur les pattes avant
            blob(leg, [0.10, -1.98, 0], [0.34, 0.12, 0.32], darkMat);
            [-0.14, 0, 0.14].forEach((dz, i) => {
                const isThumb = pos.isFront && ((side < 0 && i === 2) || (side > 0 && i === 0));
                addMesh(new THREE.ConeGeometry(isThumb ? 0.055 : 0.045, isThumb ? 0.18 : 0.12, 5),
                    nailMat, leg, 0.38, -2.0, dz, 0, 0, -Math.PI / 2 - 0.2);
            });
        });
    },
});
