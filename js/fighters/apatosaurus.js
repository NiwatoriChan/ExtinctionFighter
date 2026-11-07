/* ============================================================================
 * COMBATTANT : APATOSAURE (Apatosaurus Ajax)
 * Modèle 3D paléontologique stylisé "Cartoon Mature / Primal" validé sous Blender 5.2.3:
 *   - Textures PBR procédurales 1024x1024 (peau cuirassée améthyste & ardoise, plis
 *     cutanés d'éléphant, fanon ventral lilas, crête d'épines dorsales en coin)
 *   - Silhouette de titan diplodocidé : cou colossal à 3 segments & fanons ventraux
 *   - Petite tête allongée aux narines hautes & 4 piliers éléphantins à griffes
 *   - Longue queue effilée à 5 segments articulés produisant le claquement supersonique
 * ============================================================================ */

let _cachedApatoPBRMaps = null;

function getApatoPBRMaps() {
    if (_cachedApatoPBRMaps) return _cachedApatoPBRMaps;

    function applySRGB(tex) {
        if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
        else if (THREE.sRGBEncoding) tex.encoding = THREE.sRGBEncoding;
    }

    let _seed = 9912;
    function rand() {
        _seed = (_seed * 16807) % 2147483647;
        return (_seed - 1) / 2147483646;
    }

    function createTitanMaps() {
        const size = 1024;
        const colorCanvas = document.createElement('canvas');
        const bumpCanvas = document.createElement('canvas');
        colorCanvas.width = bumpCanvas.width = size;
        colorCanvas.height = bumpCanvas.height = size;
        const cCtx = colorCanvas.getContext('2d');
        const bCtx = bumpCanvas.getContext('2d');

        // Dégradé de titan : violet améthyste profond -> pourpre nuit -> ventre lilas
        const grad = cCtx.createLinearGradient(0, 0, size, 0);
        grad.addColorStop(0.00, '#1e0b36'); // Échine dorsale sombre
        grad.addColorStop(0.22, '#4c1d95');
        grad.addColorStop(0.40, '#7c3aed'); // Améthyste vif
        grad.addColorStop(0.48, '#a78bfa');
        grad.addColorStop(0.50, '#c4b5fd'); // Ventre lilas clair
        grad.addColorStop(0.52, '#a78bfa');
        grad.addColorStop(0.60, '#7c3aed');
        grad.addColorStop(0.78, '#4c1d95');
        grad.addColorStop(1.00, '#1e0b36');
        cCtx.fillStyle = grad;
        cCtx.fillRect(0, 0, size, size);

        bCtx.fillStyle = '#7a7a7a';
        bCtx.fillRect(0, 0, size, size);

        // Plis cutanés pachydermiques profonds
        for (let y = 0; y < size; y += 10) {
            cCtx.strokeStyle = 'rgba(20, 6, 40, 0.45)';
            cCtx.lineWidth = 2.5;
            cCtx.beginPath();
            cCtx.moveTo(0, y + (rand() - 0.5) * 6);
            cCtx.lineTo(size, y + (rand() - 0.5) * 6);
            cCtx.stroke();

            bCtx.strokeStyle = '#323232';
            bCtx.lineWidth = 3.2;
            bCtx.beginPath();
            bCtx.moveTo(0, y);
            bCtx.lineTo(size, y);
            bCtx.stroke();
        }

        // Tubercules dermiques
        for (let i = 0; i < 40000; i++) {
            const x = rand() * size;
            const y = rand() * size;
            const r = 1.0 + rand() * 2.4;
            const lum = Math.floor(115 + rand() * 65);
            bCtx.fillStyle = `rgb(${lum},${lum},${lum})`;
            bCtx.beginPath();
            bCtx.arc(x, y, r, 0, Math.PI * 2);
            bCtx.fill();
        }

        const colorMap = new THREE.CanvasTexture(colorCanvas);
        const bumpMap = new THREE.CanvasTexture(bumpCanvas);
        colorMap.wrapS = colorMap.wrapT = bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping;
        applySRGB(colorMap);
        return { colorMap, bumpMap };
    }

    _cachedApatoPBRMaps = {
        titan: createTitanMaps()
    };
    return _cachedApatoPBRMaps;
}

registerFighter({
    id: 'apato',
    name: 'APATOSAURE',
    fullName: 'Apatosaurus Ajax',
    role: 'Titan Sismique',
    title: '« Le Fléau des Tempêtes »',
    primaryColor: 0x7c3aed,
    secondaryColor: 0x2e1065,
    accentColor: 0xd946ef,
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
        { name: 'Amethyst Behemoth', primary: 0x7c3aed, secondary: 0x2e1065, accent: 0xd946ef, belly: 0xc4b5fd, isDefaultPBR: true }
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
        const { hips, rig, addMesh, skinMeshes } = ctx;
        const { titan } = getApatoPBRMaps();

        const pbrTitanMat = new THREE.MeshStandardMaterial({
            map: titan.colorMap,
            bumpMap: titan.bumpMap,
            bumpScale: 0.045,
            roughness: 0.68,
            metalness: 0.05
        });
        const nailMat = new THREE.MeshStandardMaterial({ color: 0x2e1065, roughness: 0.35, metalness: 0.25 });
        const irisMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e });
        const pupilMat = new THREE.MeshBasicMaterial({ color: 0x09090b });

        rig.bodyMat = pbrTitanMat;

        const UP = new THREE.Vector3(0, 1, 0);
        const bone = (parent, a, b, r1, r2, mat, seg = 10) => {
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
            skinMeshes.push(m);
            return m;
        };

        hips.position.y = 2.05;

        // =====================================================================
        // 1. CORPS COLOSSAL DE SAUROPODE
        // =====================================================================
        blob(rig.torso, [0.0, 0.35, 0], [1.50, 0.98, 0.90], pbrTitanMat, -0.04);
        blob(rig.torso, [-0.55, 0.48, 0], [0.98, 0.90, 0.84], pbrTitanMat, 0.06);
        blob(rig.torso, [0.74, 0.32, 0], [0.88, 0.84, 0.80], pbrTitanMat, -0.10);

        // Épines dermiques dorsales
        for (let i = -1.1; i <= 0.9; i += 0.25) {
            addMesh(new THREE.ConeGeometry(0.05, 0.20, 5), nailMat, rig.torso, i, 1.26 - Math.abs(i + 0.2) * 0.14, 0, 0, 0, 0.1);
        }

        // =====================================================================
        // 2. COU ÉPAIS & PROFOND D'APATOSAURE (3 segments articulés)
        // =====================================================================
        let pNeck = rig.torso;
        const neckSegments = [];
        const neckDefs = [
            { pos: [1.10, 0.50, 0], end: [0.78, 0.46, 0], r1: 0.58, r2: 0.46 },
            { pos: [0.76, 0.44, 0], end: [0.74, 0.44, 0], r1: 0.46, r2: 0.34 },
            { pos: [0.72, 0.42, 0], end: [0.66, 0.28, 0], r1: 0.34, r2: 0.22 }
        ];
        neckDefs.forEach((nd) => {
            const nSeg = new THREE.Group();
            nSeg.position.set(nd.pos[0], nd.pos[1], nd.pos[2]);
            joint(nSeg, [0, 0, 0], nd.r1 * 0.94, pbrTitanMat);
            bone(nSeg, [0, 0, 0], nd.end, nd.r1, nd.r2, pbrTitanMat, 10);
            pNeck.add(nSeg);
            neckSegments.push(nSeg);
            pNeck = nSeg;
        });
        rig.neck = neckSegments[0];
        rig.specialParts.neckSegments = neckSegments;

        // =====================================================================
        // 3. TÊTE PROFILÉE DE DIPLODOCIDÉ
        // =====================================================================
        rig.headGroup.position.set(0.66, 0.28, 0);
        pNeck.add(rig.headGroup);

        blob(rig.headGroup, [0.15, 0.04, 0], [0.30, 0.22, 0.20], pbrTitanMat, -0.08);
        bone(rig.headGroup, [0.18, 0.0, 0], [0.60, -0.08, 0], 0.17, 0.12, pbrTitanMat, 8);
        blob(rig.headGroup, [0.62, -0.09, 0], [0.15, 0.10, 0.14], pbrTitanMat, -0.1);

        [-1, 1].forEach(side => {
            addMesh(new THREE.SphereGeometry(0.045, 8, 8), irisMat, rig.headGroup, 0.24, 0.07, side * 0.18);
            addMesh(new THREE.SphereGeometry(0.024, 6, 6), pupilMat, rig.headGroup, 0.26, 0.07, side * 0.20);
        });

        rig.jaw.position.set(0.14, -0.10, 0);
        rig.headGroup.add(rig.jaw);
        bone(rig.jaw, [0, 0, 0], [0.46, -0.01, 0], 0.12, 0.09, pbrTitanMat, 7);

        // =====================================================================
        // 4. LONGUE QUEUE EN FOUET EFFILÉE (5 segments)
        // =====================================================================
        let pTail = rig.torso;
        const tLens = [0.94, 0.94, 0.92, 0.90, 0.98];
        const tRads = [0.60, 0.42, 0.28, 0.16, 0.08, 0.018];
        for (let s = 0; s < 5; s++) {
            const seg = new THREE.Group();
            seg.position.set(s === 0 ? -1.26 : -tLens[s - 1], s === 0 ? 0.35 : -0.04, 0);
            const len = tLens[s], r1 = tRads[s], r2 = tRads[s + 1];
            joint(seg, [0, 0, 0], r1 * 0.92, pbrTitanMat);
            bone(seg, [0, 0, 0], [-len, -0.04, 0], r1, r2, pbrTitanMat, 9);
            pTail.add(seg);
            rig.tailSegments.push(seg);
            pTail = seg;
        }

        // =====================================================================
        // 5. QUATRE PILIERS COLONNAIRES (sol à y = -2.05)
        // =====================================================================
        [
            { x: 0.88, z: -0.60, isFront: true },
            { x: 0.88, z: 0.60, isFront: true },
            { x: -0.80, z: -0.64, isFront: false },
            { x: -0.80, z: 0.64, isFront: false }
        ].forEach(pos => {
            const leg = new THREE.Group();
            leg.position.set(pos.x, 0.05, pos.z);
            hips.add(leg);
            rig.legs.push(leg);

            const side = Math.sign(pos.z);
            const K = [pos.isFront ? -0.08 : 0.10, -0.96, 0];
            const F = [0.04, -1.98, 0];

            blob(leg, [0, -0.46, 0], [pos.isFront ? 0.40 : 0.48, 0.64, 0.38], pbrTitanMat, pos.isFront ? -0.08 : 0.08);
            joint(leg, K, 0.32, pbrTitanMat);
            bone(leg, K, F, 0.32, 0.29, pbrTitanMat, 10);
            blob(leg, [0.10, -2.0, 0], [0.36, 0.13, 0.34], nailMat);

            [-0.14, 0, 0.14].forEach((dz, i) => {
                const isThumb = pos.isFront && ((side < 0 && i === 2) || (side > 0 && i === 0));
                addMesh(new THREE.ConeGeometry(isThumb ? 0.06 : 0.048, isThumb ? 0.20 : 0.13, 5),
                    nailMat, leg, 0.40, -2.02, dz, 0, 0, -Math.PI / 2 - 0.2);
            });
        });
    }
});
