/* ============================================================================
 * COMBATTANT : ANKYLOSAURE (Ankylosaurus Magniventris)
 * Modèle 3D paléontologique stylisé "Cartoon Mature / Primal" validé sous Blender 5.2.3:
 *   - Textures PBR procédurales 1024x1024 (cuirasse d'ostéodermes vert jade & ambre,
 *     bandes transversales carénées, caputegulae crâniennes, ventre souple turquoise)
 *   - Silhouette de forteresse vivante surbaissée & frange d'épines marginales
 *   - Crâne triangulaire blindé à 4 cornes pyramidales (squamosales & jugales)
 *   - Queue raidie terminée par une lourde massue osseuse bilobée (Tail Club)
 * ============================================================================ */

let _cachedAnkyloPBRMaps = null;

function getAnkyloPBRMaps() {
    if (_cachedAnkyloPBRMaps) return _cachedAnkyloPBRMaps;

    function applySRGB(tex) {
        if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
        else if (THREE.sRGBEncoding) tex.encoding = THREE.sRGBEncoding;
    }

    let _seed = 4423;
    function rand() {
        _seed = (_seed * 16807) % 2147483647;
        return (_seed - 1) / 2147483646;
    }

    function createArmorMaps() {
        const size = 1024;
        const colorCanvas = document.createElement('canvas');
        const bumpCanvas = document.createElement('canvas');
        colorCanvas.width = bumpCanvas.width = size;
        colorCanvas.height = bumpCanvas.height = size;
        const cCtx = colorCanvas.getContext('2d');
        const bCtx = bumpCanvas.getContext('2d');

        // Dégradé de base : vert jade profond / sarcelle / ambre doré
        const grad = cCtx.createLinearGradient(0, 0, size, 0);
        grad.addColorStop(0.00, '#042f2e'); // Arête dorsale sombre
        grad.addColorStop(0.20, '#134e4a');
        grad.addColorStop(0.38, '#0d9488'); // Jade éclatant
        grad.addColorStop(0.48, '#f59e0b'); // Nervures ambre
        grad.addColorStop(0.50, '#5eead4'); // Ventre turquoise clair
        grad.addColorStop(0.52, '#f59e0b');
        grad.addColorStop(0.62, '#0d9488');
        grad.addColorStop(0.80, '#134e4a');
        grad.addColorStop(1.00, '#042f2e');
        cCtx.fillStyle = grad;
        cCtx.fillRect(0, 0, size, size);

        bCtx.fillStyle = '#7a7a7a';
        bCtx.fillRect(0, 0, size, size);

        // Réseau de plaques polygonales d'ostéodermes (caputegulae / carapaces)
        const gridCols = 36;
        const gridRows = 36;
        const cellW = size / gridCols;
        const cellH = size / gridRows;

        for (let gy = 0; gy < gridRows; gy++) {
            for (let gx = 0; gx < gridCols; gx++) {
                const cx = (gx + 0.2 + rand() * 0.6) * cellW;
                const cy = (gy + 0.2 + rand() * 0.6) * cellH;
                const rx = cellW * (0.38 + rand() * 0.22);
                const ry = cellH * (0.38 + rand() * 0.22);
                const sides = 5 + Math.floor(rand() * 3);
                const rot = rand() * Math.PI * 2;

                cCtx.beginPath();
                bCtx.beginPath();
                for (let s = 0; s < sides; s++) {
                    const a = rot + (s / sides) * Math.PI * 2;
                    const px = cx + Math.cos(a) * rx;
                    const py = cy + Math.sin(a) * ry;
                    if (s === 0) { cCtx.moveTo(px, py); bCtx.moveTo(px, py); }
                    else { cCtx.lineTo(px, py); bCtx.lineTo(px, py); }
                }
                cCtx.closePath();
                bCtx.closePath();

                const shade = rand();
                cCtx.fillStyle = shade > 0.6 ? 'rgba(245, 158, 11, 0.35)' : 'rgba(4, 47, 46, 0.45)';
                cCtx.fill();
                cCtx.strokeStyle = 'rgba(2, 24, 23, 0.75)';
                cCtx.lineWidth = 2.2;
                cCtx.stroke();

                bCtx.fillStyle = shade > 0.6 ? '#d0d0d0' : '#454545';
                bCtx.fill();
                bCtx.strokeStyle = '#181818';
                bCtx.lineWidth = 2.8;
                bCtx.stroke();
            }
        }

        const colorMap = new THREE.CanvasTexture(colorCanvas);
        const bumpMap = new THREE.CanvasTexture(bumpCanvas);
        colorMap.wrapS = colorMap.wrapT = bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping;
        applySRGB(colorMap);
        return { colorMap, bumpMap };
    }

    _cachedAnkyloPBRMaps = {
        armor: createArmorMaps()
    };
    return _cachedAnkyloPBRMaps;
}

registerFighter({
    id: 'ankylo',
    name: 'ANKYLOSAURE',
    fullName: 'Ankylosaurus Magniventris',
    role: 'Forteresse Vivante',
    title: '« Le Cuirassé Caudal »',
    primaryColor: 0x0d9488,
    secondaryColor: 0x134e4a,
    accentColor: 0xf59e0b,
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
        { name: 'Jade Fortress', primary: 0x0d9488, secondary: 0x134e4a, accent: 0xf59e0b, belly: 0x5eead4, isDefaultPBR: true }
    ]
}, {
    animBaseHipsY: 1.35,

    onSpecial2(attacker, defender, dist, basePow) {
        spawn3DProjectile(attacker, 'boulder');
    },

    buildRig(ctx) {
        const { hips, rig, addMesh, skinMeshes } = ctx;
        const { armor } = getAnkyloPBRMaps();

        const pbrArmorMat = new THREE.MeshStandardMaterial({
            map: armor.colorMap,
            bumpMap: armor.bumpMap,
            bumpScale: 0.042,
            roughness: 0.54,
            metalness: 0.1
        });
        const hornMat = new THREE.MeshStandardMaterial({
            color: 0xf59e0b,
            roughness: 0.28,
            metalness: 0.4
        });
        const beakMat = new THREE.MeshStandardMaterial({ color: 0x134e4a, roughness: 0.4 });
        const irisMat = new THREE.MeshBasicMaterial({ color: 0x34d399 });
        const pupilMat = new THREE.MeshBasicMaterial({ color: 0x09090b });

        rig.bodyMat = pbrArmorMat;

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
            skinMeshes.push(m);
            return m;
        };
        const spike = (parent, p, r, len, rx, ry, rz, mat = hornMat) =>
            addMesh(new THREE.ConeGeometry(r, len, 5), mat, parent, p[0], p[1], p[2], rx, ry, rz);

        hips.position.y = 1.35;

        // =====================================================================
        // 1. CARAPACE BLINDÉE LARGE & BANDES TRANSVERSALES D'OSTÉODERMES
        // =====================================================================
        blob(rig.torso, [0.0, 0.16, 0], [1.48, 0.70, 1.05], pbrArmorMat, -0.03);
        blob(rig.torso, [0.0, 0.35, 0], [1.38, 0.54, 0.96], pbrArmorMat, -0.03);

        const rowX = [-1.08, -0.76, -0.44, -0.10, 0.26, 0.60, 0.90, 1.16];
        rowX.forEach((rx) => {
            const t = 1 - Math.pow((rx - 0.05) / 1.35, 2);
            const archY = 0.22 + Math.max(0.1, t) * 0.48;
            const halfW = 0.45 + Math.max(0.05, t) * 0.52;

            [0.18, 0.48, 0.76].forEach((frac, k) => {
                [-1, 1].forEach(side => {
                    const oz = side * halfW * frac;
                    const oy = archY - frac * frac * 0.32;
                    blob(rig.torso, [rx, oy, oz], [0.14, 0.08, 0.10], k === 0 ? hornMat : pbrArmorMat, 0, 0, side * frac * 0.5);
                });
            });

            // Épines marginales latérales
            [-1, 1].forEach(side => {
                const sz = side * (halfW + 0.07);
                const sy = 0.12 + Math.max(0, t) * 0.12;
                const sLen = 0.30 + Math.max(0, t) * 0.15;
                spike(rig.torso, [rx - 0.04, sy, sz], 0.09, sLen, side * 1.18, 0, 0.45, hornMat);
            });
        });

        // =====================================================================
        // 2. COU BLINDÉ & CRÂNE TRIANGULAIRE AUX 4 CORNES PYRAMIDALES
        // =====================================================================
        rig.neck.position.set(1.28, 0.08, 0);
        rig.torso.add(rig.neck);
        bone(rig.neck, [-0.08, 0, 0], [0.30, -0.04, 0], 0.40, 0.34, pbrArmorMat, 8);

        rig.headGroup.position.set(0.30, -0.04, 0);
        rig.neck.add(rig.headGroup);

        blob(rig.headGroup, [0.30, 0.04, 0], [0.44, 0.30, 0.38], pbrArmorMat, -0.12);
        blob(rig.headGroup, [0.60, -0.04, 0], [0.30, 0.24, 0.26], pbrArmorMat, -0.25);
        blob(rig.headGroup, [0.36, 0.23, 0], [0.36, 0.13, 0.32], hornMat, -0.15); // Caputegulae
        blob(rig.headGroup, [0.78, -0.12, 0], [0.18, 0.17, 0.17], beakMat, -0.4); // Bec rostral

        // Les 4 cornes pyramidales (2 squamosales en haut, 2 jugales en bas)
        [-1, 1].forEach(side => {
            spike(rig.headGroup, [0.06, 0.28, side * 0.34], 0.11, 0.36, side * 0.55, 0, 0.65, hornMat);
            spike(rig.headGroup, [0.15, -0.10, side * 0.40], 0.10, 0.32, side * 1.35, 0, 0.40, hornMat);
            addMesh(new THREE.SphereGeometry(0.05, 8, 8), irisMat, rig.headGroup, 0.42, 0.05, side * 0.32);
            addMesh(new THREE.SphereGeometry(0.026, 6, 6), pupilMat, rig.headGroup, 0.44, 0.05, side * 0.35);
        });

        // Mâchoire inférieure
        rig.jaw.position.set(0.18, -0.16, 0);
        rig.headGroup.add(rig.jaw);
        blob(rig.jaw, [0.28, -0.02, 0], [0.32, 0.11, 0.22], pbrArmorMat, -0.08);

        // =====================================================================
        // 3. QUEUE RAIDIE & MASSUE OSSEUSE BILOBÉE (TAIL CLUB)
        // =====================================================================
        let pTail = rig.torso;
        const tLens = [0.70, 0.70, 0.74];
        const tRads = [0.36, 0.26, 0.18, 0.14];
        for (let s = 0; s < 3; s++) {
            const seg = new THREE.Group();
            seg.position.set(s === 0 ? -1.30 : -tLens[s - 1], s === 0 ? 0.14 : 0, 0);
            const len = tLens[s], r1 = tRads[s], r2 = tRads[s + 1];
            bone(seg, [0, 0, 0], [-len, 0, 0], r1, r2, pbrArmorMat, 8);
            if (s < 2) {
                [-1, 1].forEach(side => {
                    spike(seg, [-len * 0.45, 0.02, side * (r1 + 0.04)], 0.065, 0.24, side * 1.25, 0, 0.5, hornMat);
                });
            }
            pTail.add(seg);
            rig.tailSegments.push(seg);
            pTail = seg;
        }

        const clubGroup = new THREE.Group();
        clubGroup.position.set(-0.74, 0, 0);
        blob(clubGroup, [-0.08, 0.02, 0.24], [0.44, 0.28, 0.28], hornMat, 0, -0.15);
        blob(clubGroup, [-0.08, 0.02, -0.24], [0.44, 0.28, 0.28], hornMat, 0, 0.15);
        blob(clubGroup, [-0.38, 0.0, 0], [0.30, 0.24, 0.28], pbrArmorMat);
        pTail.add(clubGroup);
        rig.specialParts.tailClub = clubGroup;

        // =====================================================================
        // 4. QUATRE PATTES COLONNAIRES BLINDÉES (sol à y = -1.35)
        // =====================================================================
        [
            { x: 0.80, z: -0.70, isFront: true },
            { x: 0.80, z: 0.70, isFront: true },
            { x: -0.80, z: -0.70, isFront: false },
            { x: -0.80, z: 0.70, isFront: false }
        ].forEach(pos => {
            const leg = new THREE.Group();
            leg.position.set(pos.x, -0.05, pos.z);
            hips.add(leg);
            rig.legs.push(leg);

            const side = Math.sign(pos.z);
            const K = [pos.isFront ? -0.10 : 0.14, -0.64, side * 0.06];
            const F = [0.06, -1.26, side * 0.04];

            blob(leg, [0, -0.32, 0], [0.30, 0.44, 0.26], pbrArmorMat, pos.isFront ? -0.15 : 0.15);
            joint(leg, K, 0.19, hornMat);
            bone(leg, K, F, 0.19, 0.16, pbrArmorMat, 8);
            blob(leg, [0.12, -1.28, side * 0.04], [0.26, 0.11, 0.24], pbrArmorMat);

            [-0.12, -0.04, 0.04, 0.12].forEach(dz => {
                spike(leg, [0.34, -1.30, side * 0.04 + dz], 0.038, 0.11, 0, 0, -Math.PI / 2 - 0.2, hornMat);
            });
        });
    }
});
