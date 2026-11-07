/* ============================================================================
 * COMBATTANT : POSTOSUCHUS (Postosuchus Kirkpatricki)
 * Modèle 3D paléontologique stylisé "Cartoon Mature / Primal" validé sous Blender 5.2.3:
 *   - Textures PBR procédurales 1024x1024 (écailles rugueuses carmin volcanique & charbon,
 *     double rangée d'ostéodermes carénés dorsaux, balafres du Trias, ventre rose-saumon)
 *   - Silhouette de rauisuchien carnassier : crâne haut et étroit, mâchoires en tenaille
 *   - Double crête sourcilière proéminente, dents ziphodontes crénelées
 *   - Posture semi-bipède / quadrupède athlétique et queue annelée
 * ============================================================================ */

let _cachedPostoPBRMaps = null;

function getPostoPBRMaps() {
    if (_cachedPostoPBRMaps) return _cachedPostoPBRMaps;

    function applySRGB(tex) {
        if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
        else if (THREE.sRGBEncoding) tex.encoding = THREE.sRGBEncoding;
    }

    let _seed = 8821;
    function rand() {
        _seed = (_seed * 16807) % 2147483647;
        return (_seed - 1) / 2147483646;
    }

    function createHideMaps() {
        const size = 1024;
        const colorCanvas = document.createElement('canvas');
        const bumpCanvas = document.createElement('canvas');
        colorCanvas.width = bumpCanvas.width = size;
        colorCanvas.height = bumpCanvas.height = size;
        const cCtx = colorCanvas.getContext('2d');
        const bCtx = bumpCanvas.getContext('2d');

        // Contre-ombrage : crête charbon -> flancs carmin sanguin -> ventre saumon
        const grad = cCtx.createLinearGradient(0, 0, size, 0);
        grad.addColorStop(0.00, '#1c0a0a'); // Crête dorsale obsidienne
        grad.addColorStop(0.18, '#581010'); // Haut des flancs cramoisi
        grad.addColorStop(0.38, '#b91c1c'); // Flancs carmin flamboyant
        grad.addColorStop(0.48, '#ea580c'); // Transition orangée
        grad.addColorStop(0.50, '#fca5a5'); // Ventre rose-saumon
        grad.addColorStop(0.52, '#ea580c');
        grad.addColorStop(0.62, '#b91c1c');
        grad.addColorStop(0.82, '#581010');
        grad.addColorStop(1.00, '#1c0a0a');
        cCtx.fillStyle = grad;
        cCtx.fillRect(0, 0, size, size);

        bCtx.fillStyle = '#7a7a7a';
        bCtx.fillRect(0, 0, size, size);

        // Bandes sombres et ocelles de camouflage du Trias
        for (let s = 0; s < 24; s++) {
            const yCenter = ((s + 0.5) / 24) * size;
            const stripeW = 10 + rand() * 14;
            [0, 1].forEach(side => {
                const startX = side === 0 ? 0 : size;
                const endX = side === 0 ? size * (0.32 + rand() * 0.08) : size * (0.68 - rand() * 0.08);
                cCtx.strokeStyle = 'rgba(18, 5, 5, 0.82)';
                cCtx.lineWidth = stripeW;
                cCtx.beginPath();
                cCtx.moveTo(startX, yCenter);
                cCtx.lineTo(endX, yCenter + (rand() - 0.5) * 18);
                cCtx.stroke();
            });
        }

        // Pavage d'écailles polygonales et gros ostéodermes dorsaux (50 000 écailles)
        for (let i = 0; i < 50000; i++) {
            const x = rand() * size;
            const y = rand() * size;
            const u = x / size;
            const isDorsal = u < 0.22 || u > 0.78;
            const scaleR = isDorsal ? (1.8 + rand() * 2.8) : (1.1 + rand() * 1.8);
            const lum = Math.floor(105 + rand() * 70);

            bCtx.fillStyle = `rgb(${lum},${lum},${lum})`;
            bCtx.beginPath();
            bCtx.arc(x, y, scaleR, 0, Math.PI * 2);
            bCtx.fill();

            if (i % 3 === 0) {
                cCtx.strokeStyle = 'rgba(15, 4, 4, 0.42)';
                cCtx.lineWidth = 0.9;
                cCtx.stroke();
            }
        }

        const colorMap = new THREE.CanvasTexture(colorCanvas);
        const bumpMap = new THREE.CanvasTexture(bumpCanvas);
        colorMap.wrapS = colorMap.wrapT = bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping;
        applySRGB(colorMap);
        return { colorMap, bumpMap };
    }

    _cachedPostoPBRMaps = {
        hide: createHideMaps()
    };
    return _cachedPostoPBRMaps;
}

registerFighter({
    id: 'postosuchus',
    name: 'POSTOSUCHUS',
    fullName: 'Postosuchus Kirkpatricki',
    role: 'Archosaurien Carnassier',
    title: '« L’Ombre du Trias Supérieur »',
    primaryColor: 0xb91c1c,
    secondaryColor: 0x18181b,
    accentColor: 0xf97316,
    cssPrimary: '#b91c1c',
    scale: 0.92,
    previewScale: 0.92,
    stats: { pow: 91, spd: 80, def: 84 },
    maxHp: 1020,
    walkSpeed: 8.4,
    special1Name: 'Croc Mortel (H)',
    special2Name: 'Roulade Triasique (T)',
    fatalityName: 'Déchirement Préhistorique (R)',
    moveStyle: 'Démarche menaçante, bonds violents, mâchoires en étau et roulement déchiqueteur.',
    fatalityDesc: 'Broyage du cou par morsure en étau, roule sur lui-même comme un crocodile primitif pour arracher la colonne vertébrale.',
    skins: [
        { name: 'Bloodfang Archosaur', primary: 0xb91c1c, secondary: 0x18181b, accent: 0xf97316, belly: 0xfca5a5, isDefaultPBR: true }
    ]
}, {
    animBaseHipsY: 1.48,

    onSpecial2(attacker, defender, dist, basePow) {
        spawn3DProjectile(attacker, 'boulder');
    },

    buildRig(ctx) {
        const { hips, rig, addMesh, boneMat, skinMeshes } = ctx;
        const { hide } = getPostoPBRMaps();

        const pbrHideMat = new THREE.MeshStandardMaterial({
            map: hide.colorMap,
            bumpMap: hide.bumpMap,
            bumpScale: 0.038,
            roughness: 0.62,
            metalness: 0.06
        });
        const clawMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.25, metalness: 0.35 });
        const irisMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
        const pupilMat = new THREE.MeshBasicMaterial({ color: 0x09090b });

        rig.bodyMat = pbrHideMat;

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

        hips.position.y = 1.48;

        // =====================================================================
        // 1. CORPS DE RAUISUCHIEN : long, musclé, double rangée d'ostéodermes
        // =====================================================================
        blob(rig.torso, [0.0, 0.14, 0], [1.44, 0.58, 0.55], pbrHideMat, -0.03);
        blob(rig.torso, [-0.64, 0.18, 0], [0.84, 0.54, 0.50], pbrHideMat, 0.04);
        blob(rig.torso, [0.74, 0.12, 0], [0.74, 0.52, 0.50], pbrHideMat, -0.06);

        // Double rangée d'ostéodermes dorsaux carénés en relief
        for (let x = -1.18; x <= 1.08; x += 0.22) {
            const dy = 0.64 - Math.pow(x * 0.45, 2) * 0.18;
            [-1, 1].forEach(side => {
                blob(rig.torso, [x, dy, side * 0.14], [0.10, 0.06, 0.08], clawMat);
                addMesh(new THREE.ConeGeometry(0.045, 0.12, 4), clawMat, rig.torso, x, dy + 0.06, side * 0.14, 0, 0, 0.15);
            });
        }

        // =====================================================================
        // 2. COU ROBUSTE & CRÂNE HAUT DE POSTOSUCHUS
        // =====================================================================
        rig.neck.position.set(1.24, 0.14, 0);
        rig.torso.add(rig.neck);
        bone(rig.neck, [-0.08, 0, 0], [0.44, 0.12, 0], 0.40, 0.34, pbrHideMat, 9);

        rig.headGroup.position.set(0.44, 0.14, 0);
        rig.neck.add(rig.headGroup);

        // Crâne haut et comprimé latéralement à double crête rugueuse
        blob(rig.headGroup, [0.22, 0.08, 0], [0.44, 0.30, 0.29], pbrHideMat, -0.04);
        blob(rig.headGroup, [0.70, 0.05, 0], [0.52, 0.25, 0.23], pbrHideMat, -0.06);

        [-1, 1].forEach(side => {
            // Arcade sourcilière saillante
            blob(rig.headGroup, [0.30, 0.24, side * 0.23], [0.24, 0.07, 0.08], clawMat, 0.1);
            addMesh(new THREE.SphereGeometry(0.055, 8, 8), irisMat, rig.headGroup, 0.30, 0.13, side * 0.25);
            addMesh(new THREE.SphereGeometry(0.028, 6, 6), pupilMat, rig.headGroup, 0.33, 0.13, side * 0.28);
        });

        // Dents ziphodontes crénelées
        for (let t = 0; t < 7; t++) {
            const tx = 0.28 + t * 0.12;
            const len = (t === 2 || t === 3) ? 0.16 : 0.11;
            [-1, 1].forEach(side => {
                addMesh(new THREE.ConeGeometry(0.024, len, 5), boneMat, rig.headGroup, tx, -0.14, side * (0.20 - t * 0.008), Math.PI, 0, 0);
            });
        }

        // Mâchoire inférieure
        rig.jaw.position.set(0.10, -0.12, 0);
        rig.headGroup.add(rig.jaw);
        bone(rig.jaw, [0.16, -0.04, 0], [0.98, -0.02, 0], 0.17, 0.11, pbrHideMat, 7);
        for (let t = 0; t < 6; t++) {
            const tx = 0.26 + t * 0.12;
            [-1, 1].forEach(side => {
                addMesh(new THREE.ConeGeometry(0.02, 0.10, 4), boneMat, rig.jaw, tx, 0.06, side * 0.15);
            });
        }

        // =====================================================================
        // 3. LONGUE QUEUE CROCODILIENNE ANNELÉE (4 segments)
        // =====================================================================
        let pTail = rig.torso;
        const tLens = [0.90, 0.90, 0.88, 0.92];
        const tRads = [0.44, 0.32, 0.22, 0.13, 0.04];
        for (let s = 0; s < 4; s++) {
            const seg = new THREE.Group();
            seg.position.set(s === 0 ? -1.26 : -tLens[s - 1], s === 0 ? 0.12 : 0, 0);
            const len = tLens[s], r1 = tRads[s], r2 = tRads[s + 1];
            bone(seg, [0, 0, 0], [-len, -0.02, 0], r1, r2, pbrHideMat, 8);
            [-0.28, -0.68].forEach(bx => {
                addMesh(new THREE.ConeGeometry(0.038, 0.11 - s * 0.015, 4), clawMat, seg, bx, r1 * 0.88, 0, 0, 0, 0.2);
            });
            pTail.add(seg);
            rig.tailSegments.push(seg);
            pTail = seg;
        }

        // =====================================================================
        // 4. MEMBRES AVANT COURTS & MEMBRES ARRIÈRE ÉRIGÉS (sol à y = -1.48)
        // =====================================================================
        [
            { x: 0.86, z: -0.48, isFront: true },
            { x: 0.86, z: 0.48, isFront: true },
            { x: -0.80, z: -0.50, isFront: false },
            { x: -0.80, z: 0.50, isFront: false }
        ].forEach(pos => {
            const leg = new THREE.Group();
            leg.position.set(pos.x, 0.0, pos.z);
            hips.add(leg);
            rig.legs.push(leg);

            const side = Math.sign(pos.z);
            if (pos.isFront) {
                const S = [0, 0, 0], E = [-0.12, -0.58, side * 0.04], W = [0.15, -1.18, side * 0.04];
                blob(leg, [-0.04, -0.28, 0], [0.22, 0.36, 0.19], pbrHideMat, -0.18);
                joint(leg, E, 0.13, clawMat);
                bone(leg, E, W, 0.13, 0.09, pbrHideMat, 7);
                [-0.08, -0.02, 0.04, 0.09].forEach(dz => {
                    const tip = [W[0] + 0.24, -1.38, W[2] + dz];
                    bone(leg, W, tip, 0.035, 0.024, clawMat, 5);
                    addMesh(new THREE.ConeGeometry(0.024, 0.10, 5), clawMat, leg, tip[0] + 0.04, tip[1] - 0.02, tip[2], 0, 0, -Math.PI / 2 - 0.4);
                });
            } else {
                const H = [0, 0, 0], K = [0.22, -0.66, side * 0.04], A = [-0.15, -1.26, side * 0.04], F = [0.12, -1.44, side * 0.04];
                blob(leg, [0.06, -0.34, 0], [0.36, 0.48, 0.28], pbrHideMat, 0.22);
                joint(leg, K, 0.19, clawMat);
                bone(leg, K, A, 0.18, 0.12, pbrHideMat, 8);
                joint(leg, A, 0.12, clawMat);
                bone(leg, A, F, 0.12, 0.10, pbrHideMat, 7);
                [-0.10, -0.03, 0.04, 0.10].forEach(dz => {
                    const tip = [F[0] + 0.30, -1.46, F[2] + dz];
                    bone(leg, F, tip, 0.044, 0.03, clawMat, 5);
                    addMesh(new THREE.ConeGeometry(0.028, 0.12, 5), clawMat, leg, tip[0] + 0.05, tip[1], tip[2], 0, 0, -Math.PI / 2 - 0.15);
                });
            }
        });
    }
});
