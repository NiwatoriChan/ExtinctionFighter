/* ============================================================================
 * COMBATTANT : MAIASAURA (Maiasaura Peeblesorum)
 * Modèle 3D paléontologique stylisé "Cartoon Mature / Primal" validé sous Blender 5.2.3:
 *   - Textures PBR procédurales 1024x1024 (peau tigrée émeraude & ocre flamboyant,
 *     bandes zébrées cel-shadées, crête d'écailles rectangulaires, ventre jaune d'or)
 *   - Large bec de canard aplati et spatulé à rhamphothèque sombre
 *   - Courte crête osseuse interorbitale pointue (amplificateur d'ondes soniques)
 *   - Bras agiles en moufles sabotées & queue haute comprimée latéralement
 * ============================================================================ */

let _cachedMaiaPBRMaps = null;

function getMaiaPBRMaps() {
    if (_cachedMaiaPBRMaps) return _cachedMaiaPBRMaps;

    function applySRGB(tex) {
        if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
        else if (THREE.sRGBEncoding) tex.encoding = THREE.sRGBEncoding;
    }

    let _seed = 5120;
    function rand() {
        _seed = (_seed * 16807) % 2147483647;
        return (_seed - 1) / 2147483646;
    }

    function createTigerMaps() {
        const size = 1024;
        const colorCanvas = document.createElement('canvas');
        const bumpCanvas = document.createElement('canvas');
        colorCanvas.width = bumpCanvas.width = size;
        colorCanvas.height = bumpCanvas.height = size;
        const cCtx = colorCanvas.getContext('2d');
        const bCtx = bumpCanvas.getContext('2d');

        // Dégradé : vert forêt sombre -> émeraude éclatant -> ocre ardent -> ventre jaune soleil
        const grad = cCtx.createLinearGradient(0, 0, size, 0);
        grad.addColorStop(0.00, '#064e3b');
        grad.addColorStop(0.20, '#047857');
        grad.addColorStop(0.40, '#10b981');
        grad.addColorStop(0.48, '#f97316'); // Rayure ocre
        grad.addColorStop(0.50, '#fef08a'); // Ventre jaune lumineux
        grad.addColorStop(0.52, '#f97316');
        grad.addColorStop(0.60, '#10b981');
        grad.addColorStop(0.80, '#047857');
        grad.addColorStop(1.00, '#064e3b');
        cCtx.fillStyle = grad;
        cCtx.fillRect(0, 0, size, size);

        bCtx.fillStyle = '#808080';
        bCtx.fillRect(0, 0, size, size);

        // Rayures zébrées ocre & noir végétal
        for (let i = 0; i < 26; i++) {
            const y = ((i + 0.5) / 26) * size;
            const w = 12 + rand() * 15;
            [0, 1].forEach(side => {
                const startX = side === 0 ? 0 : size;
                const endX = side === 0 ? size * (0.35 + rand() * 0.08) : size * (0.65 - rand() * 0.08);
                cCtx.strokeStyle = 'rgba(249, 115, 22, 0.85)';
                cCtx.lineWidth = w;
                cCtx.beginPath();
                cCtx.moveTo(startX, y);
                cCtx.lineTo(endX, y + (rand() - 0.5) * 16);
                cCtx.stroke();

                cCtx.strokeStyle = 'rgba(6, 78, 59, 0.75)';
                cCtx.lineWidth = w * 0.45;
                cCtx.beginPath();
                cCtx.moveTo(startX, y + w * 0.4);
                cCtx.lineTo(endX, y + w * 0.4);
                cCtx.stroke();

                bCtx.strokeStyle = '#404040';
                bCtx.lineWidth = w * 0.7;
                bCtx.beginPath();
                bCtx.moveTo(startX, y);
                bCtx.lineTo(endX, y);
                bCtx.stroke();
            });
        }

        const colorMap = new THREE.CanvasTexture(colorCanvas);
        const bumpMap = new THREE.CanvasTexture(bumpCanvas);
        colorMap.wrapS = colorMap.wrapT = bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping;
        applySRGB(colorMap);
        return { colorMap, bumpMap };
    }

    _cachedMaiaPBRMaps = {
        tiger: createTigerMaps()
    };
    return _cachedMaiaPBRMaps;
}

registerFighter({
    id: 'maiasaura',
    name: 'MAIASAURA',
    fullName: 'Maiasaura Peeblesorum',
    role: 'Protectrice Féroce',
    title: '« La Bonne Mère Indomptable »',
    primaryColor: 0x10b981,
    secondaryColor: 0x064e3b,
    accentColor: 0xf97316,
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
        { name: 'Tropical Matriarch', primary: 0x10b981, secondary: 0x064e3b, accent: 0xf97316, belly: 0xfef08a, isDefaultPBR: true }
    ]
}, {
    animBaseHipsY: 1.95,

    onSpecial2(attacker, defender, dist, basePow) {
        spawn3DProjectile(attacker, 'sonic');
    },

    buildRig(ctx) {
        const { hips, rig, addMesh, skinMeshes } = ctx;
        const { tiger } = getMaiaPBRMaps();

        const pbrTigerMat = new THREE.MeshStandardMaterial({
            map: tiger.colorMap,
            bumpMap: tiger.bumpMap,
            bumpScale: 0.034,
            roughness: 0.58,
            metalness: 0.08
        });
        const beakMat = new THREE.MeshStandardMaterial({ color: 0x064e3b, roughness: 0.4 });
        const crestMat = new THREE.MeshPhysicalMaterial({
            color: 0xf97316,
            emissive: 0xea580c,
            emissiveIntensity: 0.45,
            roughness: 0.3
        });
        const irisMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
        const pupilMat = new THREE.MeshBasicMaterial({ color: 0x09090b });

        rig.bodyMat = pbrTigerMat;

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

        hips.position.y = 1.95;

        // =====================================================================
        // 1. TORSE D'HADROSAURE : dos arqué, crête dermique, rayures tigrées
        // =====================================================================
        blob(rig.torso, [-0.08, 0.24, 0], [1.25, 0.78, 0.68], pbrTigerMat, 0.06);
        blob(rig.torso, [-0.48, 0.34, 0], [0.85, 0.74, 0.64], pbrTigerMat, -0.06);
        blob(rig.torso, [0.64, 0.14, 0], [0.70, 0.62, 0.58], pbrTigerMat, 0.12);

        // Crête de denticules dermiques
        for (let x = -1.05; x <= 0.85; x += 0.14) {
            const dy = 0.94 - Math.pow((x + 0.1) * 0.65, 2) * 0.35;
            addMesh(new THREE.BoxGeometry(0.09, 0.12, 0.05), crestMat, rig.torso, x, dy, 0, 0, 0, 0.08);
        }

        // =====================================================================
        // 2. COU EN S & TÊTE À BEC DE CANARD PLAT & CRÊTE SONIQUE POINTUE
        // =====================================================================
        rig.neck.position.set(0.98, 0.34, 0);
        rig.torso.add(rig.neck);
        const N0 = [0, 0, 0], N1 = [0.30, 0.40, 0], N2 = [0.44, 0.80, 0];
        bone(rig.neck, N0, N1, 0.38, 0.28, pbrTigerMat, 9);
        joint(rig.neck, N1, 0.27, pbrTigerMat);
        bone(rig.neck, N1, N2, 0.27, 0.22, pbrTigerMat, 9);

        rig.headGroup.position.set(0.46, 0.84, 0);
        rig.neck.add(rig.headGroup);

        blob(rig.headGroup, [0.14, 0.04, 0], [0.36, 0.24, 0.25], pbrTigerMat, -0.08);
        bone(rig.headGroup, [0.24, 0.06, 0], [0.66, -0.04, 0], 0.19, 0.14, pbrTigerMat, 8);

        // Large bec de canard aplati et spatulé à l'avant
        blob(rig.headGroup, [0.78, -0.07, 0], [0.25, 0.10, 0.23], beakMat, -0.12);

        // Crête osseuse pointue entre les yeux
        const crest = new THREE.Group();
        crest.position.set(0.18, 0.25, 0);
        blob(crest, [0, 0.04, 0], [0.18, 0.13, 0.12], crestMat, 0.35);
        addMesh(new THREE.ConeGeometry(0.10, 0.24, 5), crestMat, crest, -0.02, 0.13, 0, 0, 0, 0.25);
        rig.headGroup.add(crest);
        rig.specialParts.sonicCrest = crest;

        [-1, 1].forEach(side => {
            addMesh(new THREE.SphereGeometry(0.05, 8, 8), irisMat, rig.headGroup, 0.24, 0.09, side * 0.22);
            addMesh(new THREE.SphereGeometry(0.025, 6, 6), pupilMat, rig.headGroup, 0.26, 0.09, side * 0.25);
        });

        rig.jaw.position.set(0.14, -0.10, 0);
        rig.headGroup.add(rig.jaw);
        bone(rig.jaw, [0, 0, 0], [0.54, -0.02, 0], 0.13, 0.10, pbrTigerMat, 7);
        blob(rig.jaw, [0.60, -0.02, 0], [0.17, 0.08, 0.18], beakMat, 0.05);

        // =====================================================================
        // 3. BRAS EN MOUFLES SABOTÉES (rig.arms)
        // =====================================================================
        [-1, 1].forEach(side => {
            const arm = new THREE.Group();
            arm.position.set(0.78, -0.08, side * 0.46);
            rig.torso.add(arm);
            rig.arms.push(arm);

            const S = [0, 0, 0], E = [-0.10, -0.45, side * 0.05], H = [0.25, -0.88, side * 0.04];
            blob(arm, [-0.02, -0.20, 0], [0.17, 0.29, 0.15], pbrTigerMat, -0.15);
            bone(arm, S, E, 0.15, 0.11, pbrTigerMat, 7);
            joint(arm, E, 0.11, pbrTigerMat);
            bone(arm, E, H, 0.11, 0.08, pbrTigerMat, 7);
            blob(arm, [H[0] + 0.08, H[1] - 0.06, H[2]], [0.13, 0.07, 0.10], beakMat, -0.4);
        });

        // =====================================================================
        // 4. LONGUE QUEUE HAUTE COMPRIMÉE LATÉRALEMENT (4 segments)
        // =====================================================================
        let pTail = rig.torso;
        const tLens = [0.88, 0.88, 0.85, 0.88];
        const tRads = [0.48, 0.36, 0.24, 0.14, 0.045];
        for (let s = 0; s < 4; s++) {
            const seg = new THREE.Group();
            seg.position.set(s === 0 ? -1.10 : -tLens[s - 1], s === 0 ? 0.20 : 0, 0);
            const len = tLens[s], r1 = tRads[s], r2 = tRads[s + 1];
            bone(seg, [0, 0, 0], [-len, 0, 0], r1, r2, pbrTigerMat, 8);
            pTail.add(seg);
            rig.tailSegments.push(seg);
            pTail = seg;
        }

        // =====================================================================
        // 5. PATTES ARRIÈRE PUISSANTES À 3 SABOTS (sol à y = -1.95)
        // =====================================================================
        [-1, 1].forEach(side => {
            const leg = new THREE.Group();
            leg.position.set(-0.25, 0.04, side * 0.48);
            hips.add(leg);
            rig.legs.push(leg);

            const H = [0, 0, 0], K = [0.24, -0.76, side * 0.04], A = [-0.18, -1.46, side * 0.04], F = [0.10, -1.90, side * 0.04];
            blob(leg, [0.06, -0.36, 0], [0.42, 0.54, 0.34], pbrTigerMat, 0.22);
            joint(leg, K, 0.22, pbrTigerMat);
            bone(leg, K, A, 0.21, 0.14, pbrTigerMat, 8);
            joint(leg, A, 0.14, pbrTigerMat);
            bone(leg, A, F, 0.14, 0.12, pbrTigerMat, 7);

            [-0.12, 0, 0.12].forEach((dz, i) => {
                const tip = [F[0] + (i === 1 ? 0.35 : 0.27), -1.96, F[2] + dz];
                bone(leg, F, tip, 0.065, 0.055, pbrTigerMat, 5);
                blob(leg, [tip[0] + 0.05, tip[1], tip[2]], [0.08, 0.05, 0.07], beakMat);
            });
        });
    }
});
