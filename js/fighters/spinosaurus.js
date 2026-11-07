/* ============================================================================
 * COMBATTANT : SPINOSAURE (Spinosaurus Aegyptiacus)
 * Modèle 3D paléontologique stylisé "Cartoon Mature / Primal" validé sous Blender 5.2.3:
 *   - Textures PBR procédurales 1024x1024 (écailles polygonales crocodiliennes cobalt,
 *     bandes fluviales sombres, contre-ombrage cyan électrique, voilure M vascularisée)
 *   - Crâne baryonychiné élancé à encoche sub-narinaire & rosette prémaxillaire à crocs coniques
 *   - Crête nasale rugueuse médiane & yeux de piscivore
 *   - Membres antérieurs musclés armés de griffes falciformes géantes
 *   - Grande voile dorsale en M à épines neurales en relief & queue natatoire en rame
 * ============================================================================ */

let _cachedSpinoPBRMaps = null;

function getSpinoPBRMaps() {
    if (_cachedSpinoPBRMaps) return _cachedSpinoPBRMaps;

    function applySRGB(tex) {
        if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
        else if (THREE.sRGBEncoding) tex.encoding = THREE.sRGBEncoding;
    }

    let _seed = 5710;
    function rand() {
        _seed = (_seed * 16807) % 2147483647;
        return (_seed - 1) / 2147483646;
    }

    function createBodyHideMaps() {
        const size = 1024;
        const colorCanvas = document.createElement('canvas');
        const bumpCanvas = document.createElement('canvas');
        colorCanvas.width = bumpCanvas.width = size;
        colorCanvas.height = bumpCanvas.height = size;
        const cCtx = colorCanvas.getContext('2d');
        const bCtx = bumpCanvas.getContext('2d');

        // Contre-ombrage fluvial : échine bleu cobalt sombre -> flancs bleu électrique -> ventre cyan-crème lumineux
        const grad = cCtx.createLinearGradient(0, 0, size, 0);
        grad.addColorStop(0.00, '#09152e'); // Échine dorsale bleu nuit profond
        grad.addColorStop(0.18, '#173679'); // Haut des flancs cobalt marin
        grad.addColorStop(0.38, '#1d4ed8'); // Flancs bleu azur vif
        grad.addColorStop(0.48, '#06b6d4'); // Transition turquoise
        grad.addColorStop(0.50, '#67e8f9'); // Ventre cyan clair lumineux
        grad.addColorStop(0.52, '#06b6d4');
        grad.addColorStop(0.62, '#1d4ed8');
        grad.addColorStop(0.82, '#173679');
        grad.addColorStop(1.00, '#09152e');
        cCtx.fillStyle = grad;
        cCtx.fillRect(0, 0, size, size);

        bCtx.fillStyle = '#7a7a7a';
        bCtx.fillRect(0, 0, size, size);

        // Rayures tigrées sombres de prédateur aquatique le long des flancs
        const numStripes = 28;
        for (let s = 0; s < numStripes; s++) {
            const yCenter = ((s + 0.5) / numStripes) * size;
            const stripeW = 12 + rand() * 16;
            [0, 1].forEach(side => {
                const startX = side === 0 ? 0 : size;
                const endX = side === 0 ? size * (0.34 + rand() * 0.08) : size * (0.66 - rand() * 0.08);
                const midX = (startX + endX) * 0.5;
                const waveY = yCenter + (rand() - 0.5) * 22;

                cCtx.save();
                cCtx.strokeStyle = 'rgba(7, 16, 42, 0.85)';
                cCtx.lineWidth = stripeW;
                cCtx.lineCap = 'round';
                cCtx.beginPath();
                cCtx.moveTo(startX, yCenter);
                cCtx.quadraticCurveTo(midX, waveY, endX, yCenter + (rand() - 0.5) * 16);
                cCtx.stroke();

                // Liseré cyan électrique cel-shaded
                cCtx.strokeStyle = 'rgba(103, 232, 249, 0.45)';
                cCtx.lineWidth = stripeW * 0.38;
                cCtx.beginPath();
                cCtx.moveTo(startX, yCenter + stripeW * 0.5);
                cCtx.quadraticCurveTo(midX, waveY + stripeW * 0.5, endX, yCenter + stripeW * 0.4);
                cCtx.stroke();
                cCtx.restore();

                bCtx.strokeStyle = '#3e3e3e';
                bCtx.lineWidth = stripeW * 0.85;
                bCtx.beginPath();
                bCtx.moveTo(startX, yCenter);
                bCtx.quadraticCurveTo(midX, waveY, endX, yCenter);
                bCtx.stroke();
            });
        }

        // Pavage d'écailles polygonales crocodiliennes (60 000 écailles)
        for (let i = 0; i < 60000; i++) {
            const x = rand() * size;
            const y = rand() * size;
            const u = x / size;
            const isDorsal = u < 0.22 || u > 0.78;
            const scaleR = isDorsal ? (1.7 + rand() * 2.8) : (1.0 + rand() * 1.8);
            const lum = Math.floor(100 + rand() * 75);

            bCtx.fillStyle = `rgb(${lum},${lum},${lum})`;
            bCtx.beginPath();
            bCtx.arc(x, y, scaleR, 0, Math.PI * 2);
            bCtx.fill();

            if (i % 3 === 0) {
                cCtx.strokeStyle = 'rgba(8, 18, 48, 0.38)';
                cCtx.lineWidth = 0.9;
                cCtx.fillStyle = rand() > 0.5 ? 'rgba(6, 182, 212, 0.18)' : 'rgba(12, 26, 68, 0.22)';
                cCtx.beginPath();
                cCtx.arc(x, y, scaleR, 0, Math.PI * 2);
                cCtx.fill();
                cCtx.stroke();
            }
        }

        const colorMap = new THREE.CanvasTexture(colorCanvas);
        const bumpMap = new THREE.CanvasTexture(bumpCanvas);
        colorMap.wrapS = colorMap.wrapT = bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping;
        applySRGB(colorMap);
        return { colorMap, bumpMap };
    }

    function createSailMaps() {
        const size = 512;
        const colorCanvas = document.createElement('canvas');
        const bumpCanvas = document.createElement('canvas');
        colorCanvas.width = bumpCanvas.width = size;
        colorCanvas.height = bumpCanvas.height = size;
        const cCtx = colorCanvas.getContext('2d');
        const bCtx = bumpCanvas.getContext('2d');

        // Voilure en M : dégradé vertical et vagues vasculaires
        const grad = cCtx.createLinearGradient(0, size, 0, 0);
        grad.addColorStop(0.0, '#0c1a44');
        grad.addColorStop(0.35, '#1d4ed8');
        grad.addColorStop(0.7, '#06b6d4');
        grad.addColorStop(0.92, '#38bdf8');
        grad.addColorStop(1.0, '#a5f3fc');
        cCtx.fillStyle = grad;
        cCtx.fillRect(0, 0, size, size);

        bCtx.fillStyle = '#808080';
        bCtx.fillRect(0, 0, size, size);

        // Rayons vasculaires et chevrons sombres cel-shading
        for (let i = 0; i < 18; i++) {
            const x = (i / 18) * size;
            cCtx.strokeStyle = i % 2 === 0 ? 'rgba(7, 16, 42, 0.75)' : 'rgba(255, 255, 255, 0.25)';
            cCtx.lineWidth = i % 2 === 0 ? 9 : 3.5;
            cCtx.beginPath();
            cCtx.moveTo(x, size);
            cCtx.quadraticCurveTo(x + (rand() - 0.5) * 40, size * 0.45, x + (rand() - 0.5) * 25, 0);
            cCtx.stroke();

            bCtx.strokeStyle = i % 2 === 0 ? '#404040' : '#b0b0b0';
            bCtx.lineWidth = 8;
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

    _cachedSpinoPBRMaps = {
        hide: createBodyHideMaps(),
        sail: createSailMaps()
    };
    return _cachedSpinoPBRMaps;
}

registerFighter({
    id: 'spinosaurus',
    name: 'SPINOSAURE',
    fullName: 'Spinosaurus Aegyptiacus',
    role: 'Léviathan du Crétacé',
    title: '« Le Carnivore Démesuré »',
    primaryColor: 0x1d4ed8,
    secondaryColor: 0x0f172a,
    accentColor: 0x06b6d4,
    cssPrimary: '#0284c7',
    scale: 1.16,
    previewScale: 0.88,
    stats: { pow: 95, spd: 74, def: 88 },
    maxHp: 1120,
    walkSpeed: 7.6,
    special1Name: 'Tranchage Fluvial (H)',
    special2Name: 'Vague Sanglante (T)',
    fatalityName: 'Éventration du Nil (R)',
    moveStyle: 'Posture massive semi-aquatique, mâchoire de gavial à rosette, revers de grandes griffes et coups de voile.',
    fatalityDesc: 'Empale la victime de ses griffes crocodiliennes, la soulève au-dessus de sa voile dorsale et la déchiquette en deux parties.',
    skins: [
        { name: 'Cobalt Leviathan', primary: 0x1d4ed8, secondary: 0x0f172a, accent: 0x06b6d4, belly: 0x67e8f9, isDefaultPBR: true }
    ]
}, {
    animBaseHipsY: 1.85,

    onSpecial2(attacker, defender, dist, basePow) {
        spawn3DProjectile(attacker, 'boulder');
    },

    buildRig(ctx) {
        const { hips, rig, addMesh, bodyMat, darkMat, accentMat, boneMat, skin, skinMeshes } = ctx;
        const { hide, sail } = getSpinoPBRMaps();

        const isDefaultSkin = Boolean(skin && skin.isDefaultPBR);
        const bodyTint = isDefaultSkin ? 0xffffff : (skin.primary || 0x1d4ed8);

        const pbrBodyMat = new THREE.MeshStandardMaterial({
            color: bodyTint,
            map: hide.colorMap,
            bumpMap: hide.bumpMap,
            bumpScale: 0.035,
            roughness: 0.58,
            metalness: 0.08
        });
        const pbrSailMat = new THREE.MeshPhysicalMaterial({
            map: sail.colorMap,
            bumpMap: sail.bumpMap,
            bumpScale: 0.04,
            roughness: 0.42,
            metalness: 0.05,
            clearcoat: 0.28,
            side: THREE.DoubleSide
        });
        const clawMat = new THREE.MeshStandardMaterial({ color: 0x0a101d, roughness: 0.22, metalness: 0.35 });
        const irisMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
        const pupilMat = new THREE.MeshBasicMaterial({ color: 0x060b14 });

        rig.bodyMat = pbrBodyMat;

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
        const membrane = (parent, pts, mat) => {
            const g = new THREE.BufferGeometry();
            g.setAttribute('position', new THREE.Float32BufferAttribute(pts.flat(), 3));
            const idx = [];
            for (let i = 1; i < pts.length - 1; i++) idx.push(0, i, i + 1);
            g.setIndex(idx);
            g.computeVertexNormals();
            const m = addMesh(g, mat, parent);
            skinMeshes.push(m);
            return m;
        };
        const claw = (parent, p, len, r, rz = -Math.PI / 2 - 0.4) =>
            addMesh(new THREE.ConeGeometry(r, len, 6), clawMat, parent, p[0], p[1], p[2], 0, 0, rz);

        hips.position.y = 1.85;

        // =====================================================================
        // 1. TORSE : fût profilé de prédateur aquatique
        // =====================================================================
        blob(rig.torso, [0.05, 0.16, 0], [1.52, 0.68, 0.60], pbrBodyMat, 0.04);
        blob(rig.torso, [-0.68, 0.18, 0], [0.88, 0.60, 0.54], pbrBodyMat, -0.04);
        blob(rig.torso, [0.82, 0.16, 0], [0.76, 0.58, 0.54], pbrBodyMat, 0.08);

        // =====================================================================
        // 2. GRANDE VOILE DORSALE EN M VASCULARISÉE (Profil 2026 Spinosaurus)
        // =====================================================================
        const sailGroup = new THREE.Group();
        rig.torso.add(sailGroup);
        rig.specialParts.sailGroup = sailGroup;

        const spineDefs = [
            [-1.20, 0.45, 0.98],
            [-0.90, 0.50, 1.62],
            [-0.56, 0.52, 1.90],
            [-0.22, 0.54, 1.66],
            [0.12, 0.54, 1.62],
            [0.46, 0.54, 1.92],
            [0.80, 0.52, 1.76],
            [1.10, 0.46, 1.08]
        ];
        const sailPoly = [
            [0.0, 0.52, 0],
            [-1.28, 0.42, 0],
            ...spineDefs.map(d => [d[0], d[1] + d[2], 0]),
            [1.20, 0.40, 0]
        ];
        membrane(sailGroup, sailPoly, pbrSailMat);

        spineDefs.forEach((d) => {
            bone(sailGroup, [d[0], d[1], 0], [d[0] - 0.04, d[1] + d[2], 0], 0.055, 0.026, pbrBodyMat, 6);
        });

        // =====================================================================
        // 3. COU EN S & CRÂNE BARYONYCHINÉ À ROSETTE PRÉMAXILLAIRE CROCHUE
        // =====================================================================
        rig.neck.position.set(1.24, 0.34, 0);
        rig.torso.add(rig.neck);
        const N0 = [0, 0, 0], N1 = [0.40, 0.36, 0], N2 = [0.72, 0.65, 0];
        bone(rig.neck, N0, N1, 0.44, 0.34, pbrBodyMat, 9);
        joint(rig.neck, N1, 0.32, pbrBodyMat);
        bone(rig.neck, N1, N2, 0.32, 0.26, pbrBodyMat, 9);

        // Crête d'épines cervicales
        for (let c = 0; c < 5; c++) {
            const t = c / 4;
            addMesh(new THREE.ConeGeometry(0.035, 0.13, 5), clawMat, rig.neck, 0.12 + t * 0.52, 0.30 + t * 0.50, 0, 0, 0, -0.4);
        }

        rig.headGroup.position.set(0.72, 0.66, 0);
        rig.neck.add(rig.headGroup);

        // Arrière-crâne et long rostre avec encoche sub-narinaire
        blob(rig.headGroup, [0.15, 0.06, 0], [0.38, 0.26, 0.25], pbrBodyMat, -0.06);
        bone(rig.headGroup, [0.24, 0.04, 0], [1.26, -0.02, 0], 0.21, 0.12, pbrBodyMat, 8);
        blob(rig.headGroup, [1.42, -0.02, 0], [0.26, 0.16, 0.14], pbrBodyMat, -0.15); // Rosette renflée

        // Crête nasale médiane entre les yeux
        membrane(rig.headGroup, [[0.25, 0.20, 0.02], [0.50, 0.44, 0], [0.80, 0.15, 0.02]], pbrSailMat);
        membrane(rig.headGroup, [[0.25, 0.20, -0.02], [0.80, 0.15, -0.02], [0.50, 0.44, 0]], pbrSailMat);

        [-1, 1].forEach(side => {
            addMesh(new THREE.SphereGeometry(0.058, 8, 8), irisMat, rig.headGroup, 0.28, 0.16, side * 0.21);
            addMesh(new THREE.SphereGeometry(0.028, 6, 6), pupilMat, rig.headGroup, 0.31, 0.16, side * 0.25);
            blob(rig.headGroup, [0.26, 0.24, side * 0.20], [0.13, 0.05, 0.06], clawMat, 0.1);
        });

        // Dents coniques entrecroisées
        for (let t = 0; t < 10; t++) {
            const tx = 0.36 + t * 0.13;
            const isRosette = t >= 8;
            const len = isRosette ? 0.18 : 0.11;
            [-1, 1].forEach(side => {
                addMesh(new THREE.ConeGeometry(0.022, len, 5), boneMat, rig.headGroup,
                    tx, isRosette ? -0.14 : -0.10, side * (isRosette ? 0.11 : 0.14), Math.PI, 0, 0);
            });
        }

        // Mâchoire inférieure longue et fine
        rig.jaw.position.set(0.12, -0.10, 0);
        rig.headGroup.add(rig.jaw);
        bone(rig.jaw, [0, 0, 0], [1.22, -0.02, 0], 0.15, 0.09, pbrBodyMat, 7);
        blob(rig.jaw, [1.32, 0.0, 0], [0.18, 0.10, 0.10], pbrBodyMat, 0.1);
        for (let t = 0; t < 9; t++) {
            const tx = 0.26 + t * 0.13;
            [-1, 1].forEach(side => {
                addMesh(new THREE.ConeGeometry(0.02, 0.10, 5), boneMat, rig.jaw, tx, 0.07, side * 0.10);
            });
        }

        // =====================================================================
        // 4. BRAS PUISSANTS & IMMENSES GRIFFES CROCODILE DU POUCE
        // =====================================================================
        [-1, 1].forEach(side => {
            const arm = new THREE.Group();
            arm.position.set(0.98, -0.05, side * 0.50);
            rig.torso.add(arm);
            rig.arms.push(arm);

            const S = [0, 0, 0], E = [-0.08, -0.48, side * 0.06], W = [0.38, -0.86, side * 0.04];
            blob(arm, [-0.02, -0.22, 0], [0.20, 0.30, 0.17], pbrBodyMat, 0.2);
            bone(arm, S, E, 0.17, 0.13, pbrBodyMat, 8);
            joint(arm, E, 0.13, clawMat);
            bone(arm, E, W, 0.13, 0.10, pbrBodyMat, 8);
            joint(arm, W, 0.10, clawMat);

            [-0.06, 0, 0.06].forEach((dz, i) => {
                const isThumb = i === 0;
                const fingerTip = [W[0] + 0.19, W[1] - 0.11, W[2] + dz];
                bone(arm, W, fingerTip, 0.045, 0.03, clawMat, 5);
                claw(arm, [fingerTip[0] + 0.11, fingerTip[1] - 0.08, fingerTip[2]],
                    isThumb ? 0.38 : 0.24, isThumb ? 0.052 : 0.035, -Math.PI / 2 - 0.65);
            });
        });

        // =====================================================================
        // 5. QUEUE NATATOIRE EN RAME (PADDLE TAIL)
        // =====================================================================
        let pTail = rig.torso;
        const tLen = 0.92;
        const finHeights = [0.72, 0.82, 0.76, 0.45];
        for (let s = 0; s < 4; s++) {
            const seg = new THREE.Group();
            seg.position.set(s === 0 ? -1.15 : -tLen, s === 0 ? 0.16 : 0, 0);
            const r1 = 0.40 - s * 0.08, r2 = 0.32 - s * 0.07;
            bone(seg, [0, 0, 0], [-tLen, 0, 0], r1, r2, pbrBodyMat, 8);

            // Voilure haute de la queue natatoire
            const fH = finHeights[s];
            const finPts = [
                [0, r1 * 0.8, 0],
                [-tLen * 0.5, fH, 0],
                [-tLen, r2 * 0.8, 0],
                [-tLen, -r2 * 0.5, 0],
                [0, -r1 * 0.5, 0]
            ];
            membrane(seg, finPts, pbrSailMat);

            pTail.add(seg);
            rig.tailSegments.push(seg);
            pTail = seg;
        }

        // =====================================================================
        // 6. PATTES ARRIÈRE SEMI-AQUATIQUES DIGITIGRADES (sol à y = -1.85)
        // =====================================================================
        [-1, 1].forEach(side => {
            const leg = new THREE.Group();
            leg.position.set(-0.35, 0.05, side * 0.48);
            hips.add(leg);
            rig.legs.push(leg);

            const H = [0, 0, 0], K = [0.22, -0.68, side * 0.04], A = [-0.18, -1.35, side * 0.04], F = [0.12, -1.78, side * 0.04];
            blob(leg, [0.06, -0.35, 0], [0.38, 0.52, 0.30], pbrBodyMat, 0.22);
            joint(leg, K, 0.21, clawMat);
            bone(leg, K, A, 0.20, 0.13, pbrBodyMat, 8);
            joint(leg, A, 0.13, clawMat);
            bone(leg, A, F, 0.13, 0.10, pbrBodyMat, 7);

            [-0.11, 0, 0.11].forEach(dz => {
                const toeTip = [F[0] + 0.32, -1.82, F[2] + dz];
                bone(leg, F, toeTip, 0.05, 0.035, clawMat, 5);
                claw(leg, [toeTip[0] + 0.07, toeTip[1], toeTip[2]], 0.18, 0.038, -Math.PI / 2 - 0.2);
            });
        });
    }
});
