/* ============================================================================
 * COMBATTANT : THÉRIZINOSAURE (Therizinosaurus Cheloniformis)
 * Modèle 3D paléontologique stylisé "Cartoon Mature / Primal" validé sous Blender 5.2.3:
 *   - Textures PBR procédurales (plumage dense noir obsidienne & émeraudes éclatantes,
 *     rémiges étagées, collerette crème duveteuse, kératine métallique des faux)
 *   - Posture bipède dressée de bretteur préhistorique à abdomen rebondi
 *   - Long cou en S emplumé à crinière nucale & tête profilée à bec kératineux
 *   - 3 gigantesques griffes-faux d'un mètre recourbées par main à lueur spectrale
 * ============================================================================ */

let _cachedTherizinoPBRMaps = null;

function getTherizinoPBRMaps() {
    if (_cachedTherizinoPBRMaps) return _cachedTherizinoPBRMaps;

    function applySRGB(tex) {
        if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
        else if (THREE.sRGBEncoding) tex.encoding = THREE.sRGBEncoding;
    }

    let _seed = 3099;
    function rand() {
        _seed = (_seed * 16807) % 2147483647;
        return (_seed - 1) / 2147483646;
    }

    function createFeatherMaps() {
        const size = 1024;
        const colorCanvas = document.createElement('canvas');
        const bumpCanvas = document.createElement('canvas');
        colorCanvas.width = bumpCanvas.width = size;
        colorCanvas.height = bumpCanvas.height = size;
        const cCtx = colorCanvas.getContext('2d');
        const bCtx = bumpCanvas.getContext('2d');

        // Manteau de plumage sombre obsidienne & reflets vert émeraude / sarcelle
        const grad = cCtx.createLinearGradient(0, 0, size, 0);
        grad.addColorStop(0.00, '#020617'); // Dos nuit profonde
        grad.addColorStop(0.20, '#0f172a'); // Épaules ardoise
        grad.addColorStop(0.42, '#064e3b'); // Reflets plumes émeraude
        grad.addColorStop(0.50, '#10b981'); // Plastron ventral vert néon
        grad.addColorStop(0.58, '#064e3b');
        grad.addColorStop(0.80, '#0f172a');
        grad.addColorStop(1.00, '#020617');
        cCtx.fillStyle = grad;
        cCtx.fillRect(0, 0, size, size);

        bCtx.fillStyle = '#808080';
        bCtx.fillRect(0, 0, size, size);

        // 55 000 barbes de plumes filamenteuses primitives (proto-feathers)
        for (let i = 0; i < 55000; i++) {
            const x = rand() * size;
            const y = rand() * size;
            const len = 7 + rand() * 16;
            const angle = Math.PI / 2 + (rand() - 0.5) * 0.35;
            const lum = Math.floor(95 + rand() * 65);

            cCtx.strokeStyle = rand() > 0.55
                ? 'rgba(52, 211, 153, 0.18)'
                : 'rgba(2, 6, 23, 0.28)';
            cCtx.lineWidth = 1.1;
            cCtx.beginPath();
            cCtx.moveTo(x, y);
            cCtx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
            cCtx.stroke();

            bCtx.strokeStyle = `rgb(${lum},${lum},${lum})`;
            bCtx.lineWidth = 1.2;
            bCtx.beginPath();
            bCtx.moveTo(x, y);
            bCtx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
            bCtx.stroke();
        }

        const colorMap = new THREE.CanvasTexture(colorCanvas);
        const bumpMap = new THREE.CanvasTexture(bumpCanvas);
        colorMap.wrapS = colorMap.wrapT = bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping;
        applySRGB(colorMap);
        return { colorMap, bumpMap };
    }

    function createScytheMaps() {
        const size = 512;
        const colorCanvas = document.createElement('canvas');
        const bumpCanvas = document.createElement('canvas');
        colorCanvas.width = bumpCanvas.width = size;
        colorCanvas.height = bumpCanvas.height = size;
        const cCtx = colorCanvas.getContext('2d');
        const bCtx = bumpCanvas.getContext('2d');

        // Lame de faux en kératine aciérée avec fil tranchant cyan étincelant
        const grad = cCtx.createLinearGradient(0, 0, size, 0);
        grad.addColorStop(0.00, '#0f172a'); // Dos de la griffe
        grad.addColorStop(0.35, '#334155');
        grad.addColorStop(0.70, '#94a3b8');
        grad.addColorStop(0.92, '#38bdf8'); // Fil tranchant cyan
        grad.addColorStop(1.00, '#f8fafc'); // Arête rasoir
        cCtx.fillStyle = grad;
        cCtx.fillRect(0, 0, size, size);

        bCtx.fillStyle = '#808080';
        bCtx.fillRect(0, 0, size, size);

        // Cannelures longitudinales (gouttières de sang)
        for (let y = 0; y < size; y += 8) {
            cCtx.strokeStyle = 'rgba(15, 23, 42, 0.4)';
            cCtx.lineWidth = 1.5;
            cCtx.beginPath();
            cCtx.moveTo(0, y);
            cCtx.lineTo(size, y);
            cCtx.stroke();

            bCtx.strokeStyle = '#505050';
            bCtx.lineWidth = 2.0;
            bCtx.beginPath();
            bCtx.moveTo(0, y);
            bCtx.lineTo(size, y);
            bCtx.stroke();
        }

        const colorMap = new THREE.CanvasTexture(colorCanvas);
        const bumpMap = new THREE.CanvasTexture(bumpCanvas);
        applySRGB(colorMap);
        return { colorMap, bumpMap };
    }

    _cachedTherizinoPBRMaps = {
        feathers: createFeatherMaps(),
        scythe: createScytheMaps()
    };
    return _cachedTherizinoPBRMaps;
}

registerFighter({
    id: 'therizino',
    name: 'THÉRIZINOSAURE',
    fullName: 'Therizinosaurus Cheloniformis',
    role: 'Faucheuse Préhistorique',
    title: '« Les Lames Vivantes de Mongolie »',
    primaryColor: 0x0f172a,
    secondaryColor: 0x020617,
    accentColor: 0x10b981,
    cssPrimary: '#0d9488',
    scale: 1.05,
    previewScale: 0.92,
    stats: { pow: 97, spd: 75, def: 82 },
    maxHp: 1040,
    walkSpeed: 7.9,
    special1Name: 'Croix de Faucheuse (H)',
    special2Name: 'Tourbillon de Lames (T)',
    fatalityName: 'Découpe Chirurgicale (R)',
    moveStyle: 'Posture droite de bretteur, moulinets de faux d’un mètre, entailles fulgurantes en X.',
    fatalityDesc: 'Croise ses griffes géantes d’un mètre et exécute trois entailles fulgurantes en X qui découpent la cible et font voler sa tête.',
    skins: [
        { name: 'Cyber Reaper', primary: 0x0f172a, secondary: 0x020617, accent: 0x10b981, claw: 0xf8fafc, isDefaultPBR: true }
    ]
}, {
    animBaseHipsY: 2.15,

    onSpecial2(attacker, defender, dist, basePow) {
        spawn3DProjectile(attacker, 'boulder');
    },

    buildRig(ctx) {
        const { hips, rig, addMesh, skinMeshes } = ctx;
        const { feathers, scythe } = getTherizinoPBRMaps();

        const pbrFeatherMat = new THREE.MeshStandardMaterial({
            map: feathers.colorMap,
            bumpMap: feathers.bumpMap,
            bumpScale: 0.032,
            roughness: 0.72,
            metalness: 0.04
        });
        const pbrScytheMat = new THREE.MeshPhysicalMaterial({
            map: scythe.colorMap,
            bumpMap: scythe.bumpMap,
            bumpScale: 0.04,
            roughness: 0.16,
            metalness: 0.75,
            clearcoat: 0.75
        });
        const creamPlumageMat = new THREE.MeshStandardMaterial({
            color: 0xfef08a,
            map: feathers.colorMap,
            roughness: 0.65
        });
        const beakMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.35 });
        const irisMat = new THREE.MeshBasicMaterial({ color: 0x4ade80 });
        const pupilMat = new THREE.MeshBasicMaterial({ color: 0x09090b });

        rig.bodyMat = pbrFeatherMat;

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

        hips.position.y = 2.15;

        // =====================================================================
        // 1. TORSE : posture redressée à large abdomen rebondi et collerette crème
        // =====================================================================
        blob(rig.torso, [-0.08, 0.25, 0], [1.20, 0.90, 0.84], pbrFeatherMat, 0.52);
        blob(rig.torso, [0.44, 0.74, 0], [0.74, 0.64, 0.70], pbrFeatherMat, 0.45);
        blob(rig.torso, [0.06, 0.05, 0], [0.98, 0.68, 0.76], creamPlumageMat, 0.48);
        blob(rig.torso, [0.54, 0.78, 0], [0.34, 0.54, 0.72], creamPlumageMat, -0.35);

        // =====================================================================
        // 2. LONG COU EN S EMPLUMÉ À CRINIÈRE NUCALE
        // =====================================================================
        rig.neck.position.set(0.64, 0.98, 0);
        rig.torso.add(rig.neck);
        const N0 = [0, 0, 0], N1 = [0.24, 0.64, 0], N2 = [0.34, 1.28, 0];
        bone(rig.neck, N0, N1, 0.38, 0.28, pbrFeatherMat, 9);
        joint(rig.neck, N1, 0.28, pbrFeatherMat);
        bone(rig.neck, N1, N2, 0.28, 0.20, pbrFeatherMat, 9);
        bone(rig.neck, [0.08, -0.02, 0], [0.38, 1.20, 0], 0.25, 0.14, creamPlumageMat, 8);

        // =====================================================================
        // 3. PETITE TÊTE PROFILÉE À BEC KÉRATINEUX CROCHU
        // =====================================================================
        rig.headGroup.position.set(0.36, 1.32, 0);
        rig.neck.add(rig.headGroup);

        blob(rig.headGroup, [0.08, 0.04, 0], [0.34, 0.22, 0.21], pbrFeatherMat, -0.08);
        blob(rig.headGroup, [0.15, 0.04, 0], [0.24, 0.17, 0.22], creamPlumageMat, -0.05);

        bone(rig.headGroup, [0.28, 0.02, 0], [0.60, -0.04, 0], 0.12, 0.035, beakMat, 6);
        addMesh(new THREE.ConeGeometry(0.038, 0.14, 5), pbrScytheMat, rig.headGroup, 0.62, -0.07, 0, 0, 0, -Math.PI / 2 - 0.35);

        [-1, 1].forEach(side => {
            addMesh(new THREE.SphereGeometry(0.05, 8, 8), irisMat, rig.headGroup, 0.20, 0.08, side * 0.19);
            addMesh(new THREE.SphereGeometry(0.026, 6, 6), pupilMat, rig.headGroup, 0.22, 0.08, side * 0.22);
        });

        rig.jaw.position.set(0.12, -0.08, 0);
        rig.headGroup.add(rig.jaw);
        bone(rig.jaw, [0, 0, 0], [0.44, -0.02, 0], 0.09, 0.03, beakMat, 6);

        // =====================================================================
        // 4. BRAS EMPLUMÉS ET LES 3 GRANDES FAUX RECOURBÉES D'UN MÈTRE
        // =====================================================================
        [-1, 1].forEach(side => {
            const arm = new THREE.Group();
            arm.position.set(0.50, 0.58, side * 0.60);
            rig.torso.add(arm);
            rig.arms.push(arm);

            const S = [0, 0, 0];
            const E = [0.18, -0.48, side * 0.08];
            const W = [0.70, -0.60, side * 0.04];

            blob(arm, [0.08, -0.22, side * 0.04], [0.24, 0.34, 0.19], pbrFeatherMat, -0.35);
            bone(arm, S, E, 0.17, 0.14, pbrFeatherMat, 8);
            joint(arm, E, 0.14, pbrFeatherMat);
            bone(arm, E, W, 0.14, 0.11, pbrFeatherMat, 8);

            // Rémiges primitives sur l'avant-bras
            blob(arm, [0.38, -0.64, side * 0.06], [0.36, 0.18, 0.11], pbrFeatherMat, -0.25);

            // 3 immenses griffes en faux recourbées métalliques
            [-0.12, 0, 0.12].forEach((cz, cIdx) => {
                const scaleLen = cIdx === 1 ? 1.15 : (cIdx === 0 ? 1.04 : 0.90);
                const C0 = [W[0] + 0.06, W[1] - 0.02, W[2] + cz];
                const C1 = [C0[0] + 0.44 * scaleLen, C0[1] - 0.19 * scaleLen, C0[2]];
                const C2 = [C1[0] + 0.38 * scaleLen, C1[1] - 0.38 * scaleLen, C0[2]];
                const C3 = [C2[0] + 0.20 * scaleLen, C2[1] - 0.40 * scaleLen, C0[2]];

                joint(arm, C0, 0.058, pbrFeatherMat);
                bone(arm, C0, C1, 0.050, 0.038, pbrScytheMat, 6);
                bone(arm, C1, C2, 0.038, 0.024, pbrScytheMat, 6);
                bone(arm, C2, C3, 0.024, 0.005, pbrScytheMat, 5);
            });
        });

        // =====================================================================
        // 5. QUEUE EN PANACHE DE PLUMES
        // =====================================================================
        let pTail = rig.torso;
        for (let s = 0; s < 3; s++) {
            const seg = new THREE.Group();
            seg.position.set(s === 0 ? -0.98 : -0.70, s === 0 ? -0.18 : -0.05, 0);
            const r1 = 0.44 - s * 0.11, r2 = 0.33 - s * 0.10;
            bone(seg, [0, 0, 0], [-0.75, -0.06, 0], r1, r2, pbrFeatherMat, 8);
            blob(seg, [-0.40, 0.04, 0], [0.48, r1 * 0.78, r1 * 1.18], pbrFeatherMat, 0.12);
            pTail.add(seg);
            rig.tailSegments.push(seg);
            pTail = seg;
        }

        // =====================================================================
        // 6. PATTES ARRIÈRE PUISSANTES À 4 ORTEILS (sol à y = -2.15)
        // =====================================================================
        [-1, 1].forEach(side => {
            const leg = new THREE.Group();
            leg.position.set(-0.18, 0.0, side * 0.50);
            hips.add(leg);
            rig.legs.push(leg);

            const H = [0, 0, 0], K = [0.22, -0.82, side * 0.04], A = [-0.14, -1.58, side * 0.04], F = [0.12, -2.06, side * 0.05];
            blob(leg, [0.06, -0.42, 0], [0.42, 0.56, 0.36], pbrFeatherMat, 0.2);
            joint(leg, K, 0.20, pbrFeatherMat);
            bone(leg, K, A, 0.19, 0.13, pbrFeatherMat, 8);
            joint(leg, A, 0.13, pbrFeatherMat);
            bone(leg, A, F, 0.12, 0.10, pbrFeatherMat, 7);

            [-0.14, -0.05, 0.05, 0.14].forEach((dz, i) => {
                const tip = [F[0] + (i === 1 || i === 2 ? 0.38 : 0.30), -2.12, F[2] + dz];
                bone(leg, F, tip, 0.05, 0.036, pbrFeatherMat, 5);
                addMesh(new THREE.ConeGeometry(0.034, 0.15, 5), pbrScytheMat, leg,
                    tip[0] + 0.07, tip[1], tip[2], 0, 0, -Math.PI / 2 - 0.2);
            });
        });
    }
});
