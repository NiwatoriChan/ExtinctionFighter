/* ============================================================================
 * COMBATTANT : STÉGOSAURE (Stegosaurus Stenops)
 * Modèle 3D paléontologique stylisé "Cartoon Mature / Primal" validé sous Blender 5.2.3:
 *   - Textures PBR procédurales 1024x1024 (peau reptilienne vert mousse & émeraude,
 *     plaques pentagonales vascularisées orange solaire & cramoisi à nervures osseuses)
 *   - Dos voûté en dôme avec bassin élevé et épaules basses
 *   - Deux rangées alternées de plaques pentagonales avec liserés biseautés
 *   - Tête allongée à bec corné & thagomiseur terminal à 4 pointes d'ivoire
 * ============================================================================ */

let _cachedStegoPBRMaps = null;

function getStegoPBRMaps() {
    if (_cachedStegoPBRMaps) return _cachedStegoPBRMaps;

    function applySRGB(tex) {
        if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
        else if (THREE.sRGBEncoding) tex.encoding = THREE.sRGBEncoding;
    }

    let _seed = 1892;
    function rand() {
        _seed = (_seed * 16807) % 2147483647;
        return (_seed - 1) / 2147483646;
    }

    function createSkinMaps() {
        const size = 1024;
        const colorCanvas = document.createElement('canvas');
        const bumpCanvas = document.createElement('canvas');
        colorCanvas.width = bumpCanvas.width = size;
        colorCanvas.height = bumpCanvas.height = size;
        const cCtx = colorCanvas.getContext('2d');
        const bCtx = bumpCanvas.getContext('2d');

        const grad = cCtx.createLinearGradient(0, 0, size, 0);
        grad.addColorStop(0.00, '#0f291e'); // Crête sombre
        grad.addColorStop(0.25, '#14532d');
        grad.addColorStop(0.48, '#16a34a'); // Émeraude vivace
        grad.addColorStop(0.50, '#86efac'); // Ventre vert menthe clair
        grad.addColorStop(0.52, '#16a34a');
        grad.addColorStop(0.75, '#14532d');
        grad.addColorStop(1.00, '#0f291e');
        cCtx.fillStyle = grad;
        cCtx.fillRect(0, 0, size, size);

        bCtx.fillStyle = '#808080';
        bCtx.fillRect(0, 0, size, size);

        // Écailles tuberculées rondes
        for (let i = 0; i < 45000; i++) {
            const x = rand() * size;
            const y = rand() * size;
            const r = 1.2 + rand() * 2.5;
            const lum = Math.floor(110 + rand() * 65);
            bCtx.fillStyle = `rgb(${lum},${lum},${lum})`;
            bCtx.beginPath();
            bCtx.arc(x, y, r, 0, Math.PI * 2);
            bCtx.fill();

            if (i % 3 === 0) {
                cCtx.strokeStyle = 'rgba(10, 35, 20, 0.35)';
                cCtx.lineWidth = 0.8;
                cCtx.stroke();
            }
        }

        const colorMap = new THREE.CanvasTexture(colorCanvas);
        const bumpMap = new THREE.CanvasTexture(bumpCanvas);
        colorMap.wrapS = colorMap.wrapT = bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping;
        applySRGB(colorMap);
        return { colorMap, bumpMap };
    }

    function createPlateMaps() {
        const size = 512;
        const colorCanvas = document.createElement('canvas');
        const bumpCanvas = document.createElement('canvas');
        colorCanvas.width = bumpCanvas.width = size;
        colorCanvas.height = bumpCanvas.height = size;
        const cCtx = colorCanvas.getContext('2d');
        const bCtx = bumpCanvas.getContext('2d');

        // Dégradé solaire des plaques : base sombre -> orange incandescent -> bordure jaune
        const grad = cCtx.createLinearGradient(0, size, 0, 0);
        grad.addColorStop(0.00, '#450a0a');
        grad.addColorStop(0.35, '#ea580c');
        grad.addColorStop(0.75, '#f97316');
        grad.addColorStop(0.95, '#fbbf24');
        grad.addColorStop(1.00, '#fef08a');
        cCtx.fillStyle = grad;
        cCtx.fillRect(0, 0, size, size);

        bCtx.fillStyle = '#808080';
        bCtx.fillRect(0, 0, size, size);

        // Canaux vasculaires rayonnants
        for (let i = 0; i < 28; i++) {
            const x = (i / 28) * size;
            cCtx.strokeStyle = i % 2 === 0 ? 'rgba(69, 10, 10, 0.45)' : 'rgba(254, 240, 138, 0.35)';
            cCtx.lineWidth = i % 2 === 0 ? 5 : 2;
            cCtx.beginPath();
            cCtx.moveTo(x, size);
            cCtx.quadraticCurveTo(x + (rand() - 0.5) * 35, size * 0.5, x + (rand() - 0.5) * 20, 0);
            cCtx.stroke();

            bCtx.strokeStyle = i % 2 === 0 ? '#454545' : '#b5b5b5';
            bCtx.lineWidth = 4;
            bCtx.beginPath();
            bCtx.moveTo(x, size);
            bCtx.quadraticCurveTo(x, size * 0.5, x, 0);
            bCtx.stroke();
        }

        const colorMap = new THREE.CanvasTexture(colorCanvas);
        const bumpMap = new THREE.CanvasTexture(bumpCanvas);
        applySRGB(colorMap);
        return { colorMap, bumpMap };
    }

    _cachedStegoPBRMaps = {
        skin: createSkinMaps(),
        plate: createPlateMaps()
    };
    return _cachedStegoPBRMaps;
}

registerFighter({
    id: 'stegosaurus',
    name: 'STÉGOSAURE',
    fullName: 'Stegosaurus Stenops',
    role: 'Sentinelle à Plaques',
    title: '« Le Mur d’Épines et de Plaques »',
    primaryColor: 0x16a34a,
    secondaryColor: 0x14532d,
    accentColor: 0xff5400,
    cssPrimary: '#ea580c',
    scale: 1.08,
    previewScale: 0.88,
    stats: { pow: 92, spd: 68, def: 95 },
    maxHp: 1160,
    walkSpeed: 7.2,
    special1Name: 'Thagomiseur Caudal (H)',
    special2Name: 'Écran Thermique (T)',
    fatalityName: 'Transfixion Quadruple (R)',
    moveStyle: 'Marche quadrupède rythmée par ses doubles rangées de plaques dorsales et ses 4 pointes caudales.',
    fatalityDesc: 'Pivote à 180° et empale le torse adverse de ses 4 pointes osseuses d’un mètre avant de projeter la dépouille.',
    skins: [
        { name: 'Solar Stegosaur', primary: 0x16a34a, secondary: 0x14532d, accent: 0xff5400, belly: 0x86efac, isDefaultPBR: true }
    ]
}, {
    animBaseHipsY: 1.65,

    onSpecial2(attacker, defender, dist, basePow) {
        special2SeismicQuake(attacker, defender, dist, basePow);
    },

    buildRig(ctx) {
        const { hips, rig, addMesh, boneMat, skinMeshes } = ctx;
        const { skin, plate } = getStegoPBRMaps();

        const pbrSkinMat = new THREE.MeshStandardMaterial({
            map: skin.colorMap,
            bumpMap: skin.bumpMap,
            bumpScale: 0.035,
            roughness: 0.60,
            metalness: 0.08
        });
        const pbrPlateMat = new THREE.MeshPhysicalMaterial({
            map: plate.colorMap,
            bumpMap: plate.bumpMap,
            bumpScale: 0.045,
            roughness: 0.38,
            metalness: 0.12,
            clearcoat: 0.45,
            side: THREE.DoubleSide
        });
        const beakMat = new THREE.MeshStandardMaterial({ color: 0x292524, roughness: 0.45 });
        const irisMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
        const pupilMat = new THREE.MeshBasicMaterial({ color: 0x09090b });

        rig.bodyMat = pbrSkinMat;

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
            const m = addMesh(g, pbrPlateMat, grp);
            skinMeshes.push(m);
            parent.add(grp);
            return grp;
        };

        hips.position.y = 1.65;

        // =====================================================================
        // 1. TORSE : voûte dorsale haute sur le bassin, épaules basses
        // =====================================================================
        blob(rig.torso, [-0.18, 0.32, 0], [1.20, 0.94, 0.80], pbrSkinMat, -0.22);
        blob(rig.torso, [0.70, -0.02, 0], [0.78, 0.66, 0.68], pbrSkinMat, -0.32);

        // =====================================================================
        // 2. DEUX RANGÉES ALTERNÉES DE GRANDES PLAQUES PENTAGONALES
        // =====================================================================
        const platesGroup = new THREE.Group();
        rig.torso.add(platesGroup);
        rig.specialParts.plates = platesGroup;

        const torsoPlates = [
            { x: -1.08, y: 0.55, w: 0.60, h: 0.75, tz: 0.30 },
            { x: -0.78, y: 0.78, w: 0.80, h: 1.02, tz: 0.22 },
            { x: -0.44, y: 0.96, w: 0.96, h: 1.22, tz: 0.14 },
            { x: -0.08, y: 1.04, w: 1.00, h: 1.28, tz: 0.05 },
            { x: 0.28,  y: 0.94, w: 0.90, h: 1.14, tz: -0.06 },
            { x: 0.60,  y: 0.72, w: 0.74, h: 0.92, tz: -0.16 },
            { x: 0.88,  y: 0.45, w: 0.56, h: 0.68, tz: -0.26 },
            { x: 1.10,  y: 0.22, w: 0.40, h: 0.48, tz: -0.32 }
        ];
        torsoPlates.forEach((p, i) => {
            const side = (i % 2 === 0) ? 1 : -1;
            makePentagonPlate(platesGroup, p.x, p.y, side * 0.15, p.w, p.h, p.tz, side * 0.12);
        });

        // =====================================================================
        // 3. COU BAS & TÊTE PROFILÉE À BEC CORNÉ
        // =====================================================================
        rig.neck.position.set(1.20, -0.12, 0);
        rig.torso.add(rig.neck);
        const N0 = [0, 0, 0], N1 = [0.44, -0.14, 0], N2 = [0.80, -0.16, 0];
        bone(rig.neck, N0, N1, 0.40, 0.28, pbrSkinMat, 8);
        joint(rig.neck, N1, 0.26, pbrSkinMat);
        bone(rig.neck, N1, N2, 0.26, 0.19, pbrSkinMat, 8);

        // Plaques cervicales sur la nuque
        [0.12, 0.35, 0.56, 0.74].forEach((nx, idx) => {
            const side = idx % 2 === 0 ? 1 : -1;
            makePentagonPlate(rig.neck, nx, 0.16 - nx * 0.22, side * 0.08, 0.28 - idx * 0.03, 0.35 - idx * 0.04, -0.2, side * 0.1);
        });

        rig.headGroup.position.set(0.82, -0.16, 0);
        rig.neck.add(rig.headGroup);
        blob(rig.headGroup, [0.18, 0.02, 0], [0.30, 0.16, 0.16], pbrSkinMat, -0.05);
        bone(rig.headGroup, [0.20, 0.02, 0], [0.60, -0.02, 0], 0.14, 0.08, pbrSkinMat, 7);
        blob(rig.headGroup, [0.66, -0.03, 0], [0.14, 0.09, 0.09], beakMat, -0.15);

        [-1, 1].forEach(side => {
            addMesh(new THREE.SphereGeometry(0.04, 8, 8), irisMat, rig.headGroup, 0.28, 0.05, side * 0.14);
            addMesh(new THREE.SphereGeometry(0.022, 6, 6), pupilMat, rig.headGroup, 0.30, 0.05, side * 0.16);
        });

        rig.jaw.position.set(0.14, -0.07, 0);
        rig.headGroup.add(rig.jaw);
        bone(rig.jaw, [0, 0, 0], [0.48, 0.01, 0], 0.08, 0.05, pbrSkinMat, 6);

        // =====================================================================
        // 4. QUEUE & THAGOMISEUR TERMINAL (4 ÉPINES D'IVOIRE)
        // =====================================================================
        let pTail = rig.torso;
        const tLens = [0.78, 0.76, 0.74, 0.76];
        const tRads = [0.50, 0.38, 0.26, 0.16, 0.07];
        for (let s = 0; s < 4; s++) {
            const seg = new THREE.Group();
            seg.position.set(s === 0 ? -1.14 : -tLens[s - 1], s === 0 ? 0.24 : -0.04, 0);
            const len = tLens[s], r1 = tRads[s], r2 = tRads[s + 1];
            bone(seg, [0, 0, 0], [-len, -0.04, 0], r1, r2, pbrSkinMat, 8);

            if (s < 3) {
                const side = s % 2 === 0 ? -1 : 1;
                makePentagonPlate(seg, -len * 0.48, r1 * 0.55, side * 0.09, 0.50 - s * 0.11, 0.64 - s * 0.14, 0.32, side * 0.12);
            }
            pTail.add(seg);
            rig.tailSegments.push(seg);
            pTail = seg;
        }

        const thago = new THREE.Group();
        thago.position.set(-0.36, 0.02, 0);
        [-1, 1].forEach(side => {
            bone(thago, [0.12, 0.04, side * 0.06], [-0.50, 0.55, side * 0.48], 0.07, 0.009, boneMat, 6);
            bone(thago, [-0.15, 0.02, side * 0.05], [-0.80, 0.40, side * 0.40], 0.06, 0.008, boneMat, 6);
        });
        pTail.add(thago);
        rig.specialParts.thagomizer = thago;

        // =====================================================================
        // 5. PATTES AVANT COURTES & PATTES ARRIÈRE HAUTES (sol à y = -1.65)
        // =====================================================================
        [-1, 1].forEach(side => {
            const fLeg = new THREE.Group();
            fLeg.position.set(0.76, -0.20, side * 0.58);
            hips.add(fLeg);
            rig.arms.push(fLeg);

            const S = [0, 0, 0], E = [-0.12, -0.64, side * 0.06], W = [0.08, -1.36, side * 0.04];
            blob(fLeg, [-0.04, -0.30, 0], [0.30, 0.42, 0.25], pbrSkinMat, -0.18);
            joint(fLeg, E, 0.19, pbrSkinMat);
            bone(fLeg, E, W, 0.19, 0.16, pbrSkinMat, 8);
            blob(fLeg, [0.14, -1.40, side * 0.04], [0.24, 0.10, 0.21], beakMat);

            const hLeg = new THREE.Group();
            hLeg.position.set(-0.58, 0.12, side * 0.60);
            hips.add(hLeg);
            rig.legs.push(hLeg);

            const H = [0, 0, 0], K = [0.14, -0.88, side * 0.04], A = [-0.04, -1.68, side * 0.04];
            blob(hLeg, [0.04, -0.44, 0], [0.40, 0.58, 0.32], pbrSkinMat, 0.12);
            joint(hLeg, K, 0.23, pbrSkinMat);
            bone(hLeg, K, A, 0.23, 0.18, pbrSkinMat, 8);
            blob(hLeg, [0.06, -1.72, side * 0.04], [0.28, 0.11, 0.25], beakMat);
        });
    }
});
