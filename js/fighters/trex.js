/* ============================================================================
 * COMBATTANT : T-REX (Tyrannosaurus Rex)
 * Données (stats, skins, textes), modèle 3D paléontologique procédural haute
 * fidélité (textures PBR 1024x1024 d'écailles tuberculées et rayures tigrées,
 * kératine crânienne rugueuse et crêtes sourcilières/nasales sculptées dans la
 * masse, maillage corporel, cervical et caudal continu par spline Catmull-Rom
 * en temps réel, crâne binoculaire et mandibule fermés sans couture, bras
 * musclés didactyles à griffes falciformes bien visibles sous le poitrail,
 * membres postérieurs digitigrades à 4 segments articulés à capsules
 * articulaires sphériques), animations biomécaniques, coups spéciaux & fatalité.
 * ============================================================================ */

// Cache global des textures procédurales PBR 1024x1024 pour éviter toute régénération coûteuse
let _cachedTrexPBRMaps = null;

function getTrexPBRMaps() {
    if (_cachedTrexPBRMaps) return _cachedTrexPBRMaps;

    function applySRGB(tex) {
        if (THREE.SRGBColorSpace) {
            tex.colorSpace = THREE.SRGBColorSpace;
        } else if (THREE.sRGBEncoding) {
            tex.encoding = THREE.sRGBEncoding;
        }
    }

    // 1. Peau d'écailles polygonales tuberculées, contre-ombrage & rayures tigrées dorsales
    function createBodyHideMaps() {
        const size = 1024;
        const colorCanvas = document.createElement('canvas');
        const bumpCanvas = document.createElement('canvas');
        colorCanvas.width = bumpCanvas.width = size;
        colorCanvas.height = bumpCanvas.height = size;
        const cCtx = colorCanvas.getContext('2d');
        const bCtx = bumpCanvas.getContext('2d');

        // Contre-ombrage organique (U = circonférence : 0/1 = épine dorsale, 0.5 = ventre / gastralia)
        const grad = cCtx.createLinearGradient(0, 0, size, 0);
        grad.addColorStop(0.00, '#221612');   // Crête dorsale sombre (charbon-sépia)
        grad.addColorStop(0.18, '#6e2e20');   // Haut des flancs (terre de Sienne brûlée)
        grad.addColorStop(0.36, '#9e4734');   // Milieu des flancs (ocre-terracotta)
        grad.addColorStop(0.45, '#bf8563');   // Transition ventrale chaude
        grad.addColorStop(0.50, '#d9b596');   // Ventre / gorge (crème parchemin clair)
        grad.addColorStop(0.55, '#bf8563');
        grad.addColorStop(0.64, '#9e4734');
        grad.addColorStop(0.82, '#6e2e20');
        grad.addColorStop(1.00, '#221612');
        cCtx.fillStyle = grad;
        cCtx.fillRect(0, 0, size, size);

        bCtx.fillStyle = '#808080';
        bCtx.fillRect(0, 0, size, size);

        // Rayures tigrées transversales irrégulières sur le dos et les flancs (V = queue -> cou)
        const numStripes = 28;
        for (let s = 0; s < numStripes; s++) {
            const vCenter = (s + 0.5) / numStripes;
            const yCenter = vCenter * size;
            const stripeW = 10 + Math.random() * 16;

            // Bandes symétriques de chaque côté de l'épine dorsale (U = 0..0.35 et U = 0.65..1.0)
            [0, 1].forEach(side => {
                const startX = side === 0 ? 0 : size;
                const endX = side === 0 ? size * (0.31 + Math.random() * 0.07) : size * (0.69 - Math.random() * 0.07);
                const midX = (startX + endX) * 0.5;
                const waveY = yCenter + (Math.random() - 0.5) * 22;

                cCtx.save();
                cCtx.strokeStyle = 'rgba(22, 13, 10, 0.58)';
                cCtx.lineWidth = stripeW;
                cCtx.lineCap = 'round';
                cCtx.beginPath();
                cCtx.moveTo(startX, yCenter);
                cCtx.quadraticCurveTo(midX, waveY, endX, yCenter + (Math.random() - 0.5) * 18);
                cCtx.stroke();

                // Liseré ocre clair adjacent pour accentuer le contraste paléoart
                cCtx.strokeStyle = 'rgba(218, 165, 115, 0.16)';
                cCtx.lineWidth = stripeW * 0.45;
                cCtx.beginPath();
                cCtx.moveTo(startX, yCenter + stripeW * 0.65);
                cCtx.quadraticCurveTo(midX, waveY + stripeW * 0.65, endX, yCenter + stripeW * 0.5);
                cCtx.stroke();
                cCtx.restore();

                // Léger relief d'ostéodermes le long des bandes dorsales
                bCtx.strokeStyle = '#969696';
                bCtx.lineWidth = stripeW * 0.7;
                bCtx.lineCap = 'round';
                bCtx.beginPath();
                bCtx.moveTo(startX, yCenter);
                bCtx.quadraticCurveTo(midX, waveY, endX, yCenter);
                bCtx.stroke();
            });
        }

        // Marbrures organiques et taches dermiques sur les flancs
        for (let i = 0; i < 520; i++) {
            const u = Math.random();
            if (u > 0.37 && u < 0.63) continue; // Garder le ventre propre
            const x = u * size;
            const y = Math.random() * size;
            const r = 6 + Math.random() * 24;
            const g = cCtx.createRadialGradient(x, y, 1, x, y, r);
            const isDark = Math.random() > 0.42;
            g.addColorStop(0, isDark ? 'rgba(24, 14, 10, 0.25)' : 'rgba(205, 135, 92, 0.18)');
            g.addColorStop(1, 'rgba(0, 0, 0, 0)');
            cCtx.fillStyle = g;
            cCtx.beginPath();
            cCtx.arc(x, y, r, 0, Math.PI * 2);
            cCtx.fill();
        }

        // Plis cutanés transversaux sous le ventre (gastralia) et la gorge
        for (let y = 0; y < size; y += 9) {
            cCtx.strokeStyle = 'rgba(75, 42, 28, 0.14)';
            cCtx.lineWidth = 1.6;
            cCtx.beginPath();
            cCtx.moveTo(size * 0.36, y);
            cCtx.quadraticCurveTo(size * 0.50, y + 6, size * 0.64, y);
            cCtx.stroke();

            bCtx.strokeStyle = '#686868';
            bCtx.lineWidth = 2.0;
            bCtx.beginPath();
            cCtx.moveTo(size * 0.36, y);
            cCtx.quadraticCurveTo(size * 0.50, y + 6, size * 0.64, y);
            bCtx.stroke();
        }

        // 68 000 écailles granuleuses / tuberculées (peau de Tyrannosauridé type Wyrex)
        for (let i = 0; i < 68000; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const u = x / size;
            const isDorsal = u < 0.22 || u > 0.78;
            const scaleR = isDorsal ? (1.4 + Math.random() * 2.4) : (0.9 + Math.random() * 1.5);
            const lum = Math.floor(110 + Math.random() * 65);

            bCtx.fillStyle = `rgb(${lum},${lum},${lum})`;
            bCtx.beginPath();
            bCtx.arc(x, y, scaleR, 0, Math.PI * 2);
            bCtx.fill();

            if (i % 3 === 0) {
                cCtx.fillStyle = Math.random() > 0.5
                    ? 'rgba(255, 215, 180, 0.07)'
                    : 'rgba(18, 10, 8, 0.10)';
                cCtx.beginPath();
                cCtx.arc(x, y, scaleR, 0, Math.PI * 2);
                cCtx.fill();
            }
        }

        // Gros tubercules d'ostéodermes le long de l'épine dorsale
        for (let i = 0; i < 1400; i++) {
            const side = i % 2 === 0 ? Math.random() * 0.16 : (1.0 - Math.random() * 0.16);
            const x = side * size;
            const y = Math.random() * size;
            const r = 3.0 + Math.random() * 4.5;
            bCtx.fillStyle = '#e2e2e2';
            bCtx.beginPath();
            bCtx.arc(x, y, r, 0, Math.PI * 2);
            bCtx.fill();

            cCtx.fillStyle = 'rgba(25, 16, 12, 0.28)';
            cCtx.beginPath();
            cCtx.arc(x, y, r, 0, Math.PI * 2);
            cCtx.fill();
        }

        const colorMap = new THREE.CanvasTexture(colorCanvas);
        const bumpMap = new THREE.CanvasTexture(bumpCanvas);
        colorMap.wrapS = colorMap.wrapT = bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping;
        applySRGB(colorMap);
        return { colorMap, bumpMap };
    }

    // 2. Kératine crânienne rugueuse, sillons neurovasculaires & cicatrices de combat faciales
    function createCraniumKeratinMaps() {
        const size = 1024;
        const canvas = document.createElement('canvas');
        const bump = document.createElement('canvas');
        canvas.width = bump.width = size;
        canvas.height = bump.height = size;
        const ctx = canvas.getContext('2d');
        const bCtx = bump.getContext('2d');

        // Gradient longitudinal : arrière-crâne musclé (gauche) -> museau & crête nasale cornée (droite)
        const grad = ctx.createLinearGradient(0, 0, size, 0);
        grad.addColorStop(0.00, '#59261b');
        grad.addColorStop(0.28, '#873827');
        grad.addColorStop(0.58, '#7a3121');
        grad.addColorStop(0.82, '#422018');
        grad.addColorStop(1.00, '#261510');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, size, size);

        bCtx.fillStyle = '#808080';
        bCtx.fillRect(0, 0, size, size);

        // Rugosités osseuses & sillons vasculaires du maxillaire et du nasal
        for (let i = 0; i < 5500; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const len = 14 + Math.random() * 55;
            const ang = (Math.random() - 0.5) * 0.45;
            ctx.strokeStyle = Math.random() > 0.45
                ? 'rgba(20, 11, 8, 0.22)'
                : 'rgba(220, 150, 110, 0.11)';
            ctx.lineWidth = 1.0 + Math.random() * 2.2;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
            ctx.stroke();

            const bVal = Math.random() > 0.5 ? 168 : 78;
            bCtx.strokeStyle = `rgb(${bVal},${bVal},${bVal})`;
            bCtx.lineWidth = 1.6;
            bCtx.beginPath();
            bCtx.moveTo(x, y);
            bCtx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
            bCtx.stroke();
        }

        // Marques de morsures cicatrisées (combats intraspécifiques de Tyrannosaures)
        for (let s = 0; s < 14; s++) {
            const sx = size * (0.25 + Math.random() * 0.65);
            const sy = size * (0.15 + Math.random() * 0.70);
            const sAng = -0.7 + Math.random() * 1.4;
            for (let t = -1; t <= 1; t++) {
                const ox = sx + t * 9;
                ctx.strokeStyle = 'rgba(185, 140, 118, 0.24)';
                ctx.lineWidth = 2.2;
                ctx.beginPath();
                ctx.moveTo(ox, sy);
                ctx.lineTo(ox + Math.cos(sAng) * 65, sy + Math.sin(sAng) * 65);
                ctx.stroke();

                bCtx.strokeStyle = '#484848';
                bCtx.lineWidth = 3.0;
                bCtx.beginPath();
                bCtx.moveTo(ox, sy);
                bCtx.lineTo(ox + Math.cos(sAng) * 65, sy + Math.sin(sAng) * 65);
                bCtx.stroke();
            }
        }

        const colorMap = new THREE.CanvasTexture(canvas);
        const bumpMap = new THREE.CanvasTexture(bump);
        applySRGB(colorMap);
        return { colorMap, bumpMap };
    }

    // 3. Écailles scutellées des pattes et coussinets plantaires
    function createScutePadMaps() {
        const size = 512;
        const canvas = document.createElement('canvas');
        const bump = document.createElement('canvas');
        canvas.width = bump.width = size;
        canvas.height = bump.height = size;
        const ctx = canvas.getContext('2d');
        const bCtx = bump.getContext('2d');

        ctx.fillStyle = '#2e211b';
        ctx.fillRect(0, 0, size, size);
        bCtx.fillStyle = '#808080';
        bCtx.fillRect(0, 0, size, size);

        // Plaques d'écailles tarsiennes transversales (scutes aviennes/théropodes)
        for (let y = 0; y < size; y += 16) {
            for (let x = 0; x < size; x += 28) {
                const offX = (Math.floor(y / 16) % 2) * 14;
                ctx.fillStyle = 'rgba(72, 52, 42, 0.45)';
                ctx.beginPath();
                ctx.roundRect ? ctx.roundRect(x + offX, y + 2, 24, 12, 4) : ctx.rect(x + offX, y + 2, 24, 12);
                ctx.fill();

                bCtx.fillStyle = '#bcbcbc';
                bCtx.beginPath();
                bCtx.roundRect ? bCtx.roundRect(x + offX, y + 2, 24, 12, 4) : bCtx.rect(x + offX, y + 2, 24, 12);
                bCtx.fill();
            }
        }

        const colorMap = new THREE.CanvasTexture(canvas);
        const bumpMap = new THREE.CanvasTexture(bump);
        colorMap.wrapS = colorMap.wrapT = bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping;
        applySRGB(colorMap);
        return { colorMap, bumpMap };
    }

    _cachedTrexPBRMaps = {
        hideMaps: createBodyHideMaps(),
        craniumMaps: createCraniumKeratinMaps(),
        scuteMaps: createScutePadMaps()
    };
    return _cachedTrexPBRMaps;
}

// Helper compatible Three.js r128+ pour CapsuleGeometry parfaitement fermée sans artefact
function createTrexCapsuleGeometry(radius, length, capSegments = 6, radialSegments = 14) {
    if (THREE.CapsuleGeometry) {
        return new THREE.CapsuleGeometry(radius, length, capSegments, radialSegments);
    }
    const heightSegments = capSegments * 2 + 8;
    const geo = new THREE.PlaneGeometry(1, 1, radialSegments, heightSegments);
    const pos = geo.attributes.position;
    const uvs = geo.attributes.uv;
    const halfLen = length * 0.5;

    let idx = 0;
    for (let iy = 0; iy <= heightSegments; iy++) {
        const v = iy / heightSegments;
        let y = 0;
        let r = radius;

        if (iy <= capSegments) {
            const phi = (iy / capSegments) * (Math.PI * 0.5);
            y = halfLen + Math.cos(phi) * radius;
            r = Math.sin(phi) * radius;
        } else if (iy >= heightSegments - capSegments) {
            const rem = iy - (heightSegments - capSegments);
            const phi = (rem / capSegments) * (Math.PI * 0.5);
            y = -halfLen - Math.sin(phi) * radius;
            r = Math.cos(phi) * radius;
        } else {
            const cylT = (iy - capSegments) / (heightSegments - capSegments * 2);
            y = halfLen - cylT * length;
            r = radius;
        }

        for (let ix = 0; ix <= radialSegments; ix++) {
            const u = ix / radialSegments;
            const theta = u * Math.PI * 2;
            pos.setXYZ(idx, Math.sin(theta) * r, y, Math.cos(theta) * r);
            uvs.setXY(idx, u, v);
            idx++;
        }
    }
    geo.computeVertexNormals();
    return geo;
}

registerFighter({
    id: 'trex',
    name: 'T-REX',
    fullName: 'Tyrannosaurus Rex',
    role: 'Apex Carnivore',
    title: '« Le Roi Sanglant du Crétacé »',
    primaryColor: 0x9e4734,
    secondaryColor: 0x2e211b,
    accentColor: 0xf59e0b,
    cssPrimary: '#dc2626',
    scale: 1.10,
    previewScale: 0.92,
    stats: { pow: 96, spd: 72, def: 85 },
    maxHp: 1050,
    walkSpeed: 7.8,
    special1Name: 'Morsure Sismique (H)',
    special2Name: 'Rugissement de Magma (T)',
    fatalityName: 'Dévoration Royale (R)',
    moveStyle: 'Foulée bipède lourde sur membres digitigrades, morsure broyeuse d’os à 12 800 PSI, piétinement sismique et balayage caudal rotatif.',
    fatalityDesc: 'Saisit la victime dans ses mâchoires géantes, la secoue violemment, arrache la tête et l’avale dans une gerbe de sang.',
    skins: [
        { name: 'Paleo Tyrant', primary: 0x9e4734, secondary: 0x2e211b, accent: 0xf59e0b, belly: 0xc99e7e, isDefaultPBR: true },
        { name: 'Apex Crimson', primary: 0xdc2626, secondary: 0x7f1d1d, accent: 0xf59e0b, belly: 0xfca5a5 },
        { name: 'Abyssal Shadow', primary: 0x27272a, secondary: 0x09090b, accent: 0x38bdf8, belly: 0x52525b },
        { name: 'Albino Phantom', primary: 0xe2e8f0, secondary: 0x64748b, accent: 0xd946ef, belly: 0xf8fafc },
        { name: 'Molten Core', primary: 0x9a3412, secondary: 0x451a03, accent: 0xf97316, belly: 0xfdba74 }
    ]
}, {
    animBaseHipsY: 2.1,
    attackReach: 3.95,

    onSpecial2(attacker, defender, dist, basePow) {
        spawn3DProjectile(attacker, 'boulder');
    },

    // Construction du modèle 3D paléontologique articulé (Tyrannosaurus rex)
    buildRig(ctx) {
        const { hips, rig, skin, skinMeshes } = ctx;
        const { hideMaps, craniumMaps, scuteMaps } = getTrexPBRMaps();

        const isDefaultSkin = Boolean(skin && skin.isDefaultPBR);
        const hideTint = isDefaultSkin ? 0xffffff : (skin.primary || 0xffffff);
        const skullTint = isDefaultSkin ? 0xffffff : (skin.primary || 0xffffff);
        const hornTint = isDefaultSkin ? 0x3b2318 : (skin.secondary || 0x2e211b);

        // =====================================================================
        // 1. PALETTE DE MATÉRIAUX PHYSIQUEMENT BASÉS (PBR)
        // =====================================================================
        const materials = {
            bodyHide: new THREE.MeshStandardMaterial({
                color: hideTint,
                map: hideMaps.colorMap,
                bumpMap: hideMaps.bumpMap,
                bumpScale: 0.022,
                roughness: 0.74,
                metalness: 0.04
            }),
            skullKeratin: new THREE.MeshPhysicalMaterial({
                color: skullTint,
                map: craniumMaps.colorMap,
                bumpMap: craniumMaps.bumpMap,
                bumpScale: 0.026,
                roughness: 0.52,
                metalness: 0.05,
                clearcoat: 0.22,
                clearcoatRoughness: 0.38
            }),
            hornBoss: new THREE.MeshPhysicalMaterial({
                color: hornTint,
                bumpMap: craniumMaps.bumpMap,
                bumpScale: 0.028,
                roughness: 0.42,
                metalness: 0.06,
                clearcoat: 0.35,
                clearcoatRoughness: 0.30
            }),
            oralMucosa: new THREE.MeshPhysicalMaterial({
                color: 0x6b1d1d,
                roughness: 0.24,
                metalness: 0.02,
                clearcoat: 0.80,
                clearcoatRoughness: 0.14
            }),
            toothEnamel: new THREE.MeshPhysicalMaterial({
                color: 0xf7eed7,
                roughness: 0.18,
                metalness: 0.02,
                clearcoat: 0.78,
                clearcoatRoughness: 0.14
            }),
            scalyPad: new THREE.MeshStandardMaterial({
                color: isDefaultSkin ? 0xffffff : (skin.secondary || 0x2e211b),
                map: scuteMaps.colorMap,
                bumpMap: scuteMaps.bumpMap,
                bumpScale: 0.024,
                roughness: 0.62,
                metalness: 0.04
            }),
            claw: new THREE.MeshPhysicalMaterial({
                color: 0x171412,
                roughness: 0.22,
                clearcoat: 0.58,
                clearcoatRoughness: 0.20
            }),
            eyeIris: new THREE.MeshStandardMaterial({
                color: skin && !isDefaultSkin && skin.accent ? skin.accent : 0xf59e0b,
                emissive: skin && !isDefaultSkin && skin.accent ? skin.accent : 0x92400e,
                emissiveIntensity: 0.35,
                roughness: 0.15
            }),
            eyeCornea: new THREE.MeshPhysicalMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.28,
                roughness: 0.02,
                metalness: 0.0,
                clearcoat: 1.0,
                clearcoatRoughness: 0.02
            }),
            eyePupil: new THREE.MeshBasicMaterial({ color: 0x050505 }),
            boneXray: new THREE.MeshStandardMaterial({
                color: 0xf8fafc,
                emissive: 0x38bdf8,
                emissiveIntensity: 0.42,
                roughness: 0.22
            })
        };

        // Synchroniser rig.bodyMat pour le flash d'impact en combat
        rig.bodyMat = materials.bodyHide;

        const skeletonMeshes = [];

        function registerSkin(mesh) {
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            skinMeshes.push(mesh);
            return mesh;
        }

        function createBoneVisual(p1, p2, radius = 0.045) {
            const dist = p1.distanceTo(p2);
            const geo = new THREE.CylinderGeometry(radius * 0.74, radius, dist, 10);
            geo.translate(0, dist / 2, 0);
            geo.rotateX(Math.PI / 2);
            const mesh = new THREE.Mesh(geo, materials.boneXray);
            mesh.position.copy(p1);
            mesh.lookAt(p2);
            mesh.visible = false;
            skeletonMeshes.push(mesh);
            return mesh;
        }

        // Helper sculptant un segment musculaire fermé avec capsules articulaires sphériques
        // aux deux extrémités (aucun disque plat de cylindre ne dépasse lors des flexions)
        function createMuscularSegment(length, axis, profileFn, material, proxOverlap = 0.14, distOverlap = 0.14) {
            const radialSegs = 24;
            const heightSegs = 22;
            const geo = new THREE.PlaneGeometry(1, 1, radialSegs, heightSegs);
            const pos = geo.attributes.position;
            const uvs = geo.attributes.uv;

            const startS = -length * proxOverlap;
            const endS = length * (1 + distOverlap);
            const totalSpan = endS - startS;

            let idx = 0;
            for (let iy = 0; iy <= heightSegs; iy++) {
                const v = iy / heightSegs;
                const sPos = startS + v * totalSpan;
                const tClamped = Math.max(0, Math.min(1, sPos / length));

                // Dômes hémisphériques doux aux extrémités proximale (v -> 0) et distale (v -> 1)
                let capFactor = 1.0;
                if (v < 0.16) {
                    capFactor = Math.sin((v / 0.16) * (Math.PI * 0.5));
                } else if (v > 0.84) {
                    capFactor = Math.sin(((1.0 - v) / 0.16) * (Math.PI * 0.5));
                }

                for (let ix = 0; ix <= radialSegs; ix++) {
                    const u = ix / radialSegs;
                    const angle = u * Math.PI * 2;
                    const { rx, rz, offsetX = 0, offsetZ = 0 } = profileFn(tClamped, angle);

                    const curRx = rx * capFactor;
                    const curRz = rz * capFactor;
                    const offWeight = Math.sin(tClamped * Math.PI) * capFactor;

                    const lx = Math.sin(angle) * curRx + offsetX * offWeight;
                    const lz = Math.cos(angle) * curRz + offsetZ * offWeight;

                    if (axis === '-y') {
                        pos.setXYZ(idx, lx, -sPos, lz);
                    } else if (axis === 'y') {
                        pos.setXYZ(idx, lx, sPos, -lz);
                    } else if (axis === 'z') {
                        pos.setXYZ(idx, lx, -lz, sPos);
                    } else if (axis === '-z') {
                        pos.setXYZ(idx, lx, lz, -sPos);
                    } else if (axis === 'x') {
                        pos.setXYZ(idx, sPos, -lz, lx);
                    } else if (axis === '-x') {
                        pos.setXYZ(idx, -sPos, lz, lx);
                    }

                    uvs.setXY(idx, u, v);
                    idx++;
                }
            }

            geo.computeVertexNormals();
            return registerSkin(new THREE.Mesh(geo, material));
        }

        hips.position.y = 2.1;

        // Groupe racine du modèle paléontologique (+Z du modèle = +X avant dans le repère du jeu)
        const trex = new THREE.Group();
        trex.position.set(0, -2.1, 0);
        trex.rotation.y = Math.PI / 2;
        rig.torso.add(trex);

        const rootJoint = new THREE.Group();
        rootJoint.position.set(0, 2.1, 0);
        trex.add(rootJoint);

        const torsoGroup = new THREE.Group();
        rootJoint.add(torsoGroup);

        // Nœuds mandataires standardisés pour la compatibilité ColliderRig & CombatReactions
        rig.neck.position.set(1.02, 0.42, 0);
        rig.torso.add(rig.neck);

        const armProxyL = new THREE.Group();
        const armProxyR = new THREE.Group();
        rig.torso.add(armProxyL, armProxyR);
        rig.arms.push(armProxyL, armProxyR);

        const legProxyL = new THREE.Group();
        const legProxyR = new THREE.Group();
        hips.add(legProxyL, legProxyR);
        rig.legs.push(legProxyL, legProxyR);

        let parentTailProxy = rig.torso;
        for (let s = 0; s < 4; s++) {
            const tProxy = new THREE.Group();
            tProxy.position.set(s === 0 ? -1.05 : -0.90, s === 0 ? 0.22 : 0, 0);
            parentTailProxy.add(tProxy);
            rig.tailSegments.push(tProxy);
            parentTailProxy = tProxy;
        }

        // =====================================================================
        // 2A. RIG SQUELETTIQUE : 6 VERTÈBRES CAUDALES, BASSIN, THORAX & 5 CERVICALES EN S
        // =====================================================================
        const caudalSegments = [];
        const caudalLengths = [0.64, 0.62, 0.60, 0.58, 0.54, 0.50];
        const caudalRadiiX = [0.40, 0.32, 0.24, 0.17, 0.11, 0.055];
        const caudalRadiiY = [0.46, 0.37, 0.28, 0.20, 0.13, 0.065];

        let parentCaudal = torsoGroup;
        for (let i = 0; i < caudalLengths.length; i++) {
            const seg = new THREE.Group();
            if (i === 0) {
                seg.position.set(0, 0.18, -0.78);
            } else {
                seg.position.set(0, 0, -caudalLengths[i - 1]);
            }
            parentCaudal.add(seg);
            caudalSegments.push(seg);

            const tBone = createBoneVisual(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -caudalLengths[i]), 0.052 - i * 0.006);
            seg.add(tBone);
            parentCaudal = seg;
        }

        const tailTipNode = new THREE.Group();
        tailTipNode.position.set(0, 0.0, -caudalLengths[caudalLengths.length - 1]);
        parentCaudal.add(tailTipNode);

        // Nœuds anatomiques du bassin, de l'abdomen et de la cage thoracique
        const pelvisRearNode = new THREE.Group();
        pelvisRearNode.position.set(0, 0.19, -0.72);
        torsoGroup.add(pelvisRearNode);

        const hipsCenterNode = new THREE.Group();
        hipsCenterNode.position.set(0, 0.18, -0.32);
        torsoGroup.add(hipsCenterNode);

        const lumbarNode = new THREE.Group();
        lumbarNode.position.set(0, 0.15, 0.14);
        torsoGroup.add(lumbarNode);

        const thoraxNode = new THREE.Group();
        thoraxNode.position.set(0, 0.15, 0.56);
        torsoGroup.add(thoraxNode);

        const chestFrontNode = new THREE.Group();
        chestFrontNode.position.set(0, 0.22, 0.94);
        torsoGroup.add(chestFrontNode);

        // Squelette interne X-Ray : colonne dorsale, botte pubienne & côtes thoraciques
        torsoGroup.add(createBoneVisual(new THREE.Vector3(0, 0.24, -0.78), new THREE.Vector3(0, 0.28, 1.02), 0.075));
        torsoGroup.add(createBoneVisual(new THREE.Vector3(0, 0.22, -0.35), new THREE.Vector3(0, -0.52, -0.12), 0.048));
        for (let r = 0; r < 9; r++) {
            const ribSpan = 0.50 - Math.abs(r - 3.5) * 0.042;
            const ribGeo = new THREE.TorusGeometry(ribSpan, 0.022, 8, 22, Math.PI * 1.42);
            ribGeo.rotateY(Math.PI);
            ribGeo.rotateZ(Math.PI * 0.29);
            const rib = new THREE.Mesh(ribGeo, materials.boneXray);
            rib.position.set(0, 0.16, 0.85 - r * 0.16);
            rib.visible = false;
            skeletonMeshes.push(rib);
            torsoGroup.add(rib);
        }

        // 5 vertèbres cervicales articulées (cou musclé en S de Tyrannosaurus)
        const neckSegments = [];
        const numNeckVerts = 5;
        const neckSegLen = 0.21;
        let parentNeck = torsoGroup;

        for (let i = 0; i < numNeckVerts; i++) {
            const segGroup = new THREE.Group();
            if (i === 0) {
                segGroup.position.set(0, 0.25, 0.94);
            } else {
                segGroup.position.set(0, 0, neckSegLen);
            }
            parentNeck.add(segGroup);
            neckSegments.push(segGroup);

            const cBone = createBoneVisual(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, neckSegLen), 0.062 - i * 0.003);
            segGroup.add(cBone);
            parentNeck = segGroup;
        }

        // Adaptateur d'axe pour que rig.headGroup (Bone_Head) ait +X vers l'avant et rotation.z en tangage
        const headAdapter = new THREE.Group();
        headAdapter.position.set(0, 0, neckSegLen);
        headAdapter.rotation.y = -Math.PI / 2;
        parentNeck.add(headAdapter);

        rig.headGroup.position.set(0, 0, 0);
        rig.headGroup.rotation.set(0, 0, 0);
        headAdapter.add(rig.headGroup);

        const headGroup = new THREE.Group();
        headGroup.rotation.y = Math.PI / 2;
        rig.headGroup.add(headGroup);

        // Nœuds d'ancrage et de fermeture du cou à l'intérieur de l'occiput du crâne
        const skullBaseNode = new THREE.Group();
        skullBaseNode.position.set(0, 0.14, 0.06);
        headGroup.add(skullBaseNode);

        const skullCapNode = new THREE.Group();
        skullCapNode.position.set(0, 0.15, 0.22);
        headGroup.add(skullCapNode);

        // =====================================================================
        // 2B. MAILLAGE CORPOREL, CAUDAL & CERVICAL CONTINU (SPLINE CATMULL-ROM)
        // =====================================================================
        const caudalSpineNodes = [];
        for (let i = caudalSegments.length - 1; i >= 0; i--) {
            caudalSpineNodes.push({
                node: caudalSegments[i],
                rx: caudalRadiiX[i],
                ry: caudalRadiiY[i],
                yOff: 0.0
            });
        }

        // Profil anatomique fluide : poitrail dégagé à l'avant pour exposer clairement
        // les bras et griffes didactyles, et fermeture complète aux deux extrémités (queue & occiput)
        const bodySpineNodes = [
            { node: tailTipNode, rx: 0.002, ry: 0.002, yOff: 0.0 },
            ...caudalSpineNodes,
            { node: pelvisRearNode, rx: 0.44, ry: 0.52, yOff: 0.02 },
            { node: hipsCenterNode, rx: 0.50, ry: 0.62, yOff: 0.04 },   // Ilion & bassin
            { node: lumbarNode, rx: 0.58, ry: 0.68, yOff: -0.02 },      // Flancs
            { node: thoraxNode, rx: 0.58, ry: 0.66, yOff: -0.04 },      // Cage thoracique & gastralia
            { node: chestFrontNode, rx: 0.40, ry: 0.44, yOff: 0.02 },   // Ceinture pectorale relevée (dégage les bras)
            ...neckSegments.map((seg, i) => ({
                node: seg,
                rx: 0.35 - i * 0.018,
                ry: 0.39 - i * 0.020,
                yOff: i >= 1 && i <= 3 ? 0.02 : 0.0
            })),
            { node: skullBaseNode, rx: 0.23, ry: 0.23, yOff: 0.0 },     // Rentre proprement dans l'arrière-crâne
            { node: skullCapNode, rx: 0.002, ry: 0.002, yOff: 0.0 }     // Capuchon fermé à l'intérieur du crâne
        ];

        const tubeRings = 58;
        const tubeSides = 30;
        const seamlessBodyGeo = new THREE.PlaneGeometry(1, 1, tubeSides, tubeRings - 1);
        const seamlessBodyMesh = registerSkin(new THREE.Mesh(seamlessBodyGeo, materials.bodyHide));
        trex.add(seamlessBodyMesh);

        const _wp = new THREE.Vector3();
        const _up = new THREE.Vector3();
        const _right = new THREE.Vector3();
        const _tangent = new THREE.Vector3();
        const _quat = new THREE.Quaternion();
        const _qTrexInv = new THREE.Quaternion();

        function updateContinuousBodySkin(breathPhase) {
            const centers = [];
            const upVectors = [];
            const radiiX = [];
            const radiiY = [];

            trex.getWorldQuaternion(_qTrexInv).invert();

            for (let i = 0; i < bodySpineNodes.length; i++) {
                const item = bodySpineNodes[i];
                item.node.getWorldPosition(_wp);
                const localPos = trex.worldToLocal(_wp.clone());

                item.node.getWorldQuaternion(_quat);
                _quat.premultiply(_qTrexInv);
                _up.set(0, 1, 0).applyQuaternion(_quat).normalize();

                // Dilatation respiratoire de la cage thoracique et des gastralia
                let breathBoost = 0;
                if (i === 9 || i === 10) breathBoost = Math.sin(breathPhase) * 0.024;
                else if (i === 11) breathBoost = Math.sin(breathPhase) * 0.014;

                localPos.addScaledVector(_up, item.yOff);
                centers.push(localPos);
                upVectors.push(_up.clone());
                radiiX.push(item.rx + breathBoost);
                radiiY.push(item.ry + breathBoost * 1.2);
            }

            const centerCurve = new THREE.CatmullRomCurve3(centers);
            const posAttr = seamlessBodyGeo.attributes.position;

            let vIdx = 0;
            for (let r = 0; r < tubeRings; r++) {
                const t = r / (tubeRings - 1);
                const pt = centerCurve.getPoint(t);
                centerCurve.getTangent(t, _tangent).normalize();

                const fIdx = t * (bodySpineNodes.length - 1);
                const i0 = Math.floor(fIdx);
                const i1 = Math.min(bodySpineNodes.length - 1, i0 + 1);
                const frac = fIdx - i0;

                const rx = THREE.MathUtils.lerp(radiiX[i0], radiiX[i1], frac);
                const ry = THREE.MathUtils.lerp(radiiY[i0], radiiY[i1], frac);
                _up.copy(upVectors[i0]).lerp(upVectors[i1], frac).normalize();

                _right.crossVectors(_up, _tangent).normalize();
                _up.crossVectors(_tangent, _right).normalize();

                // Profil anatomique lisse sans oscillation haute fréquence
                const spineEnvelope = Math.sin(t * Math.PI);

                for (let s = 0; s <= tubeSides; s++) {
                    const u = s / tubeSides;
                    const theta = u * Math.PI * 2;
                    const cosT = Math.cos(theta);
                    const sinT = Math.sin(theta);

                    let xFactor = sinT * rx;
                    let yFactor = cosT * ry;

                    // Crête neurale dorsale lisse et musclée le long de l'épine dorsale
                    if (cosT > 0.62) {
                        yFactor += Math.pow((cosT - 0.62) / 0.38, 2.0) * ry * 0.09 * spineEnvelope;
                    }
                    // Galbe musculaire du M. caudofemoralis à la base de la queue et des flancs
                    if (t > 0.24 && t < 0.68 && Math.abs(sinT) > 0.55) {
                        xFactor *= 1.06;
                    }
                    // Carène ventrale douce du panier gastral
                    if (t > 0.44 && t < 0.66 && cosT < -0.55) {
                        yFactor *= 1.06;
                    }

                    const vx = pt.x + _right.x * xFactor + _up.x * yFactor;
                    const vy = pt.y + _right.y * xFactor + _up.y * yFactor;
                    const vz = pt.z + _right.z * xFactor + _up.z * yFactor;

                    posAttr.setXYZ(vIdx, vx, vy, vz);
                    vIdx++;
                }
            }

            posAttr.needsUpdate = true;
            seamlessBodyGeo.computeVertexNormals();
        }

        // =====================================================================
        // 2C. CRÂNE SCULPTÉ DE TYRANNOSAURUS REX (FERMÉ SANS COUTURE, BOSSES INTÉGRÉES)
        // =====================================================================
        function buildSculptedSkull() {
            // Profil ostéologique fermé aux deux extrémités (Sue FMNH PR 2081) :
            // Arrière-crâne temporal large (vision binoculaire) se resserrant devant les orbites
            // en un museau profond et voûté. Toutes les crêtes (sourcilières, nasales, jugales)
            // sont sculptées directement dans le maillage continu sans primitives rapportées.
            const slices = [
                { z: -0.14, topY: 0.16, botY: 0.15,  halfW: 0.002, fenestra: 0.00 }, // Capuchon occipital fermé
                { z: -0.06, topY: 0.38, botY: -0.08, halfW: 0.34,  fenestra: 0.00 }, // Occiput
                { z: 0.08,  topY: 0.45, botY: -0.10, halfW: 0.43,  fenestra: 0.14 }, // Fenêtres temporales & quadratojugal
                { z: 0.28,  topY: 0.44, botY: -0.09, halfW: 0.40,  fenestra: 0.18 }, // Région postorbitaire & jugal évasé
                { z: 0.48,  topY: 0.41, botY: -0.07, halfW: 0.29,  fenestra: 0.14 }, // Rétrécissement pré-orbitaire (lacrimal)
                { z: 0.74,  topY: 0.38, botY: -0.06, halfW: 0.24,  fenestra: 0.28 }, // Fosse antorbitaire du maxillaire
                { z: 1.02,  topY: 0.35, botY: -0.05, halfW: 0.22,  fenestra: 0.18 }, // Milieu du museau & os nasal fusionné
                { z: 1.24,  topY: 0.29, botY: -0.05, halfW: 0.18,  fenestra: 0.06 }, // Région narinaire
                { z: 1.40,  topY: 0.19, botY: -0.04, halfW: 0.12,  fenestra: 0.00 }, // Prémaxillaire en U massif
                { z: 1.48,  topY: 0.05, botY: 0.04,  halfW: 0.002, fenestra: 0.00 }  // Extrémité rostrale fermée
            ];

            const radialSteps = 36;
            const lengthSteps = 48;
            const geo = new THREE.PlaneGeometry(1, 1, radialSteps, lengthSteps);
            const pos = geo.attributes.position;
            const uvs = geo.attributes.uv;

            const topCurve = new THREE.CatmullRomCurve3(slices.map(s => new THREE.Vector3(s.halfW, s.topY, s.z)));
            const botCurve = new THREE.CatmullRomCurve3(slices.map(s => new THREE.Vector3(s.fenestra, s.botY, s.z)));

            let idx = 0;
            for (let iy = 0; iy <= lengthSteps; iy++) {
                const v = iy / lengthSteps;
                const pTop = topCurve.getPoint(v);
                const pBot = botCurve.getPoint(v);
                const halfW = Math.max(0.001, pTop.x);
                const topY = pTop.y;
                const z = pTop.z;
                const fenestraDepth = Math.max(0, pBot.x);
                const botY = pBot.y;

                // Facteurs longitudinaux sculptant les reliefs osseux directement dans le crâne
                const browProfile = Math.exp(-Math.pow((v - 0.36) / 0.075, 2));     // Crêtes lacrymales / postorbitaires
                const orbitProfile = Math.exp(-Math.pow((v - 0.385) / 0.045, 2));   // Cavité orbitaire (loge de l'œil)
                const jugalProfile = Math.exp(-Math.pow((v - 0.28) / 0.07, 2));     // Pommettes jugales évasées
                const nasalProfile = (v > 0.38 && v < 0.84) ? Math.sin(((v - 0.38) / 0.46) * Math.PI) : 0;
                const nostrilProfile = Math.exp(-Math.pow((v - 0.80) / 0.045, 2));  // Dépression narinaire

                for (let ix = 0; ix <= radialSteps; ix++) {
                    const u = ix / radialSteps;
                    const angle = u * Math.PI * 2;
                    const s = Math.sin(angle);
                    const c = Math.cos(angle);
                    const absS = Math.abs(s);

                    // Coupe transversale sub-rectangulaire "boîte crânienne" typique du T-Rex
                    let x = Math.sign(s) * Math.pow(absS, 0.74) * halfW;
                    let y;
                    if (c >= 0) {
                        y = botY + (topY - botY) * Math.pow(c, 0.70);

                        // Crête nasale médiane bosselée intégrée au sommet du museau
                        if (nasalProfile > 0 && c > 0.80) {
                            const rugosity = 1.0 + 0.25 * Math.sin(v * Math.PI * 12);
                            y += Math.pow((c - 0.80) / 0.20, 1.6) * 0.032 * nasalProfile * rugosity;
                        }

                        // Arcades sourcilières lacrymales / postorbitaires sculptées au-dessus de l'orbite
                        if (browProfile > 0.01 && c > 0.56 && c < 0.94 && absS > 0.35) {
                            const browArch = Math.sin(((c - 0.56) / 0.38) * Math.PI);
                            y += browProfile * browArch * 0.048;
                            x += Math.sign(s) * browProfile * browArch * 0.044;
                        }
                    } else {
                        // Bord alvéolaire maxillaire externe et voûte palatine interne légèrement concave
                        const rimFactor = Math.pow(absS, 1.8);
                        y = botY * rimFactor + (botY + 0.035 * (1 - Math.pow(v - 0.5, 2))) * (1 - rimFactor);
                    }

                    // Creusement organique des fosses antorbitaire et temporale sur les flancs du crâne
                    const sideFactor = Math.exp(-Math.pow(c - 0.12, 2) * 16.0);
                    x *= (1.0 - fenestraDepth * sideFactor);

                    // Loge orbitaire excavée sous l'arcade sourcilière pour dégager parfaitement l'œil
                    if (orbitProfile > 0.01 && c > 0.22 && c < 0.64) {
                        const orbDepth = Math.sin(((c - 0.22) / 0.42) * Math.PI);
                        x *= (1.0 - 0.22 * orbitProfile * orbDepth);
                    }

                    // Creusement des narines à l'avant du museau
                    if (nostrilProfile > 0.01 && c > 0.18 && c < 0.68) {
                        const nFactor = Math.sin(((c - 0.18) / 0.50) * Math.PI);
                        x *= (1.0 - 0.22 * nostrilProfile * nFactor);
                    }

                    // Évasement des pommettes jugales sous l'orbite
                    if (jugalProfile > 0.01 && c < -0.10 && c > -0.78) {
                        const jArch = Math.sin(((Math.abs(c) - 0.10) / 0.68) * Math.PI);
                        x += Math.sign(s) * jugalProfile * jArch * 0.045;
                        y -= jugalProfile * jArch * 0.018;
                    }

                    pos.setXYZ(idx, x, y, z);
                    uvs.setXY(idx, v, u);
                    idx++;
                }
            }
            geo.computeVertexNormals();
            const skullMesh = registerSkin(new THREE.Mesh(geo, materials.skullKeratin));
            headGroup.add(skullMesh);

            // Dentition supérieure : 4 incisives prémaxillaires en D + 10 paires de crocs maxillaires ("bananes létales")
            // Positionnés exactement le long de la courbe maxillaire avec racines enfouies dans l'os
            for (let p = 0; p < 4; p++) {
                const px = (p - 1.5) * 0.036;
                const pmTooth = new THREE.ConeGeometry(0.015, 0.09, 8);
                pmTooth.scale(0.85, 1.0, 1.15);
                pmTooth.rotateX(Math.PI - 0.12);
                const tMesh = new THREE.Mesh(pmTooth, materials.toothEnamel);
                tMesh.position.set(px, -0.055, 1.39);
                tMesh.castShadow = true;
                headGroup.add(tMesh);
            }

            const maxTeethSpec = [
                { v: 0.40, len: 0.09, r: 0.017 },
                { v: 0.46, len: 0.13, r: 0.022 },
                { v: 0.52, len: 0.18, r: 0.030 }, // Géantes dents broyeuses d'os
                { v: 0.59, len: 0.21, r: 0.034 },
                { v: 0.66, len: 0.20, r: 0.032 },
                { v: 0.72, len: 0.17, r: 0.028 },
                { v: 0.78, len: 0.14, r: 0.024 },
                { v: 0.83, len: 0.12, r: 0.020 },
                { v: 0.88, len: 0.10, r: 0.018 },
                { v: 0.92, len: 0.08, r: 0.015 }
            ];

            maxTeethSpec.forEach(spec => {
                const pTop = topCurve.getPoint(spec.v);
                const pBot = botCurve.getPoint(spec.v);
                const xOff = pTop.x * 0.78;
                const yRoot = pBot.y + 0.018;
                const zPos = pTop.z;

                [-1, 1].forEach(side => {
                    const toothGeo = new THREE.ConeGeometry(spec.r, spec.len, 10);
                    toothGeo.scale(0.76, 1.0, 1.18);
                    toothGeo.rotateX(Math.PI - 0.15);
                    toothGeo.rotateZ(side * 0.04);
                    const tooth = new THREE.Mesh(toothGeo, materials.toothEnamel);
                    tooth.position.set(side * xOff, yRoot - spec.len * 0.38, zPos);
                    tooth.castShadow = true;
                    headGroup.add(tooth);
                });
            });

            headGroup.add(createBoneVisual(new THREE.Vector3(0, 0.16, 0.0), new THREE.Vector3(0, 0.12, 1.42), 0.065));
        }
        buildSculptedSkull();

        // Yeux de prédateur bien visibles dans la loge orbitaire (orientés à la fois latéralement et vers l'avant)
        const eyelids = [];
        const catchlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        [-1, 1].forEach(side => {
            const eyeSocket = new THREE.Group();
            eyeSocket.position.set(side * 0.292, 0.255, 0.38);
            // Orienté à ~58° : parfaitement lisible de profil (caméra de combat) ET de face (vision binoculaire)
            eyeSocket.rotation.y = side * 1.02;
            eyeSocket.rotation.x = 0.06;
            headGroup.add(eyeSocket);

            // Anneau scléral sombre encadrant le globe oculaire dans l'orbite
            const socketRing = new THREE.Mesh(new THREE.SphereGeometry(0.044, 14, 14), materials.hornBoss);
            socketRing.scale.set(1.05, 0.92, 0.65);
            socketRing.position.set(0, 0, -0.006);
            eyeSocket.add(socketRing);

            // Iris ambre-or lumineux
            const iris = new THREE.Mesh(new THREE.SphereGeometry(0.040, 18, 18), materials.eyeIris);
            iris.position.set(0, 0, 0.008);
            eyeSocket.add(iris);

            // Pupille fendue verticale de prédateur
            const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.023, 14, 14), materials.eyePupil);
            pupil.scale.set(0.46, 1.25, 0.55);
            pupil.position.set(0, 0, 0.034);
            eyeSocket.add(pupil);

            // Éclat spéculaire (catchlight) donnant vie au regard
            const catchlight = new THREE.Mesh(new THREE.SphereGeometry(0.007, 8, 8), catchlightMat);
            catchlight.position.set(side * -0.009, 0.012, 0.046);
            eyeSocket.add(catchlight);

            // Cornée réfractive brillante
            const cornea = new THREE.Mesh(new THREE.SphereGeometry(0.043, 18, 18), materials.eyeCornea);
            cornea.position.set(0, 0, 0.008);
            eyeSocket.add(cornea);

            // Paupière supérieure mobile (clignement & froncement agressif)
            const lidGeo = new THREE.SphereGeometry(0.045, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.50);
            const lid = registerSkin(new THREE.Mesh(lidGeo, materials.hornBoss));
            lid.position.set(0, 0, 0.008);
            lid.rotation.x = -Math.PI * 0.48;
            eyeSocket.add(lid);
            eyelids.push(lid);
        });

        // =====================================================================
        // 2D. MANDIBULE ARTICULÉE FERMÉE, LANGUE CHARNUE & MUSCLES ADDUCTEURS INTERNES
        // =====================================================================
        const jawAdapter = new THREE.Group();
        jawAdapter.position.set(0, -0.07, 0.08);
        jawAdapter.rotation.y = -Math.PI / 2;
        headGroup.add(jawAdapter);

        rig.jaw.position.set(0, 0, 0);
        rig.jaw.rotation.set(0, 0, 0);
        jawAdapter.add(rig.jaw);

        const jawGroup = new THREE.Group();
        jawGroup.rotation.y = Math.PI / 2;
        rig.jaw.add(jawGroup);

        function buildSculptedMandible() {
            // Mandibule fermée aux deux extrémités : large et profonde à l'arrière (surangulaire),
            // convergeant vers une symphyse mentonnière robuste à l'avant.
            const mSlices = [
                { z: -0.10, topY: -0.05, botY: -0.06, halfW: 0.002 }, // Capuchon articulaire arrière fermé
                { z: -0.04, topY: 0.03,  botY: -0.16, halfW: 0.32  },
                { z: 0.14,  topY: 0.04,  botY: -0.22, halfW: 0.35  },
                { z: 0.38,  topY: 0.03,  botY: -0.19, halfW: 0.25  },
                { z: 0.68,  topY: 0.02,  botY: -0.15, halfW: 0.20  },
                { z: 0.98,  topY: 0.02,  botY: -0.13, halfW: 0.17  },
                { z: 1.24,  topY: 0.01,  botY: -0.10, halfW: 0.12  },
                { z: 1.35,  topY: -0.02, botY: -0.05, halfW: 0.06  },
                { z: 1.39,  topY: -0.03, botY: -0.03, halfW: 0.002 }  // Symphyse mentonnière fermée
            ];

            const rSteps = 28;
            const lSteps = 40;
            const geo = new THREE.PlaneGeometry(1, 1, rSteps, lSteps);
            const pos = geo.attributes.position;
            const uvs = geo.attributes.uv;
            const curve = new THREE.CatmullRomCurve3(mSlices.map(s => new THREE.Vector3(s.halfW, s.botY, s.z)));
            const topCurve = new THREE.CatmullRomCurve3(mSlices.map(s => new THREE.Vector3(s.halfW, s.topY, s.z)));

            let idx = 0;
            for (let iy = 0; iy <= lSteps; iy++) {
                const v = iy / lSteps;
                const pt = curve.getPoint(v);
                const ptTop = topCurve.getPoint(v);
                const halfW = Math.max(0.001, pt.x);
                const botY = pt.y;
                const topY = ptTop.y;
                const z = pt.z;

                for (let ix = 0; ix <= rSteps; ix++) {
                    const u = ix / rSteps;
                    const angle = u * Math.PI * 2;
                    const s = Math.sin(angle);
                    const c = Math.cos(angle);
                    const absS = Math.abs(s);

                    const x = Math.sign(s) * Math.pow(absS, 0.78) * halfW;
                    let y;
                    if (c <= 0) {
                        y = botY * Math.pow(Math.abs(c), 0.72);
                    } else {
                        // Bord alvéolaire dentaire solide sur les côtés et plancher buccal légèrement creusé au centre
                        const rim = Math.pow(absS, 1.4);
                        y = topY * rim + (topY - 0.035 * Math.sin(v * Math.PI)) * (1 - rim);
                    }

                    pos.setXYZ(idx, x, y, z);
                    uvs.setXY(idx, v, u);
                    idx++;
                }
            }
            geo.computeVertexNormals();
            jawGroup.add(registerSkin(new THREE.Mesh(geo, materials.skullKeratin)));

            // 9 paires de dents dentaires inférieures ancrées solidement dans l'os dentaire
            for (let t = 0; t < 9; t++) {
                const v = 0.36 + (t / 8) * 0.52;
                const ptTop = topCurve.getPoint(v);
                const tx = ptTop.x * 0.74;
                const ty = ptTop.y;
                const tz = ptTop.z;
                const tLen = (t >= 1 && t <= 4) ? 0.12 : 0.085;
                const tRad = (t >= 1 && t <= 4) ? 0.021 : 0.015;

                [-1, 1].forEach(side => {
                    const dToothGeo = new THREE.ConeGeometry(tRad, tLen, 8);
                    dToothGeo.scale(0.78, 1.0, 1.15);
                    dToothGeo.rotateX(-0.10);
                    const dTooth = new THREE.Mesh(dToothGeo, materials.toothEnamel);
                    dTooth.position.set(side * tx, ty - 0.015 + tLen * 0.36, tz);
                    dTooth.castShadow = true;
                    jawGroup.add(dTooth);
                });
            }

            // Langue charnue articulée logée strictement à l'intérieur de la cavité mandibulaire
            const tongueGeo = createTrexCapsuleGeometry(0.068, 0.56, 6, 14);
            tongueGeo.scale(1.05, 0.38, 1.0);
            tongueGeo.rotateX(Math.PI / 2 - 0.04);
            tongueGeo.translate(0, -0.01, 0.62);
            const tongueMesh = registerSkin(new THREE.Mesh(tongueGeo, materials.oralMucosa));
            jawGroup.add(tongueMesh);
            jawGroup.userData.tongueMesh = tongueMesh;

            jawGroup.add(createBoneVisual(new THREE.Vector3(0, -0.08, 0.0), new THREE.Vector3(0, -0.05, 1.32), 0.048));
        }
        buildSculptedMandible();

        // Muscles adducteurs mandibulaires internes (M. adductor mandibulae) :
        // placés à l'intérieur des commissures (x = ±0.16) pour n'être visibles que bouche ouverte
        const jawAdductors = [];
        [-1, 1].forEach(side => {
            const upperAnchor = new THREE.Group();
            upperAnchor.position.set(side * 0.16, 0.04, 0.24);
            headGroup.add(upperAnchor);

            const lowerAnchor = new THREE.Group();
            lowerAnchor.position.set(side * 0.15, -0.03, 0.22);
            jawGroup.add(lowerAnchor);

            const muscGeo = createTrexCapsuleGeometry(0.038, 0.18, 5, 12);
            muscGeo.scale(0.72, 1.0, 1.45);
            const muscMesh = registerSkin(new THREE.Mesh(muscGeo, materials.oralMucosa));
            headGroup.add(muscMesh);

            jawAdductors.push({ side, upperAnchor, lowerAnchor, muscMesh });
        });

        // =====================================================================
        // 2E. BRAS MUSCLÉS & MAINS DIDACTYLES À GRIFFES FALCIFORMES BIEN VISIBLES
        // =====================================================================
        function buildForelimb(side) {
            // Attachés sur le bord ventro-latéral de la ceinture scapulo-coracoïdienne,
            // dégageant complètement les coudes, avant-bras, mains et griffes sous le poitrail
            const shoulder = new THREE.Group();
            shoulder.position.set(side * 0.38, -0.18, 0.90);
            torsoGroup.add(shoulder);

            // 1. Humérus musclé (0.42m) avec crête deltopectorale
            const humLen = 0.42;
            const humMesh = createMuscularSegment(humLen, '-y', (t, angle) => {
                const deltoid = Math.sin(t * Math.PI * 0.85) * 0.032;
                const r = THREE.MathUtils.lerp(0.115, 0.076, t) + deltoid;
                return {
                    rx: r * 0.88,
                    rz: r * 1.15,
                    offsetZ: Math.sin(t * Math.PI) * 0.018
                };
            }, materials.bodyHide, 0.18, 0.16);
            shoulder.add(humMesh);
            shoulder.add(createBoneVisual(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -humLen, 0), 0.030));

            // 2. Coude -> Avant-bras (Radius & Ulna : 0.38m projeté vers l'avant +Z)
            const elbow = new THREE.Group();
            elbow.position.set(0, -humLen, 0);
            shoulder.add(elbow);

            const faLen = 0.38;
            const faMesh = createMuscularSegment(faLen, 'z', (t) => {
                const forearmBelly = Math.exp(-Math.pow(t - 0.32, 2) * 14.0) * 0.024;
                const r = THREE.MathUtils.lerp(0.076, 0.054, t) + forearmBelly;
                return { rx: r * 0.86, rz: r * 1.10 };
            }, materials.bodyHide, 0.16, 0.14);
            elbow.add(faMesh);
            elbow.add(createBoneVisual(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, faLen), 0.024));

            // 3. Poignet & Main didactyle (paumes tournées médialement vers l'intérieur)
            const wrist = new THREE.Group();
            wrist.position.set(0, 0, faLen);
            elbow.add(wrist);

            // Paume métacarpienne écaillée
            const palmLen = 0.12;
            const palmMesh = createMuscularSegment(palmLen, 'z', (t) => {
                const r = THREE.MathUtils.lerp(0.054, 0.046, t);
                return { rx: r * 0.72, rz: r * 1.15 };
            }, materials.scalyPad, 0.15, 0.15);
            wrist.add(palmMesh);

            // 2 doigts articulés munis de grandes griffes falciformes noires (Doigt I et Doigt II)
            const fingers = [];
            const digitSpecs = [
                { idx: 0, yOff: 0.024,  xOff: -side * 0.012, pitch: -0.14, fLen: 0.13, fRad: 0.024, cLen: 0.16, cRad: 0.026 }, // Doigt I (robuste)
                { idx: 1, yOff: -0.022, xOff: side * 0.010,  pitch: 0.16,  fLen: 0.16, fRad: 0.021, cLen: 0.14, cRad: 0.022 }  // Doigt II (allongé)
            ];

            digitSpecs.forEach(spec => {
                const finger = new THREE.Group();
                finger.position.set(spec.xOff, spec.yOff, palmLen * 0.88);
                finger.rotation.x = spec.pitch;
                finger.rotation.y = -side * 0.18;
                wrist.add(finger);

                const phalMesh = createMuscularSegment(spec.fLen, 'z', (t) => {
                    const r = THREE.MathUtils.lerp(spec.fRad, spec.fRad * 0.82, t);
                    return { rx: r * 0.92, rz: r };
                }, materials.scalyPad, 0.18, 0.16);
                finger.add(phalMesh);

                // Griffe falciforme noire recourbée
                const clawGeo = new THREE.ConeGeometry(spec.cRad, spec.cLen, 10);
                clawGeo.scale(0.78, 1.0, 1.15);
                clawGeo.rotateX(Math.PI / 2 + 0.36);
                clawGeo.translate(0, -0.018, spec.fLen + spec.cLen * 0.38);
                finger.add(registerSkin(new THREE.Mesh(clawGeo, materials.claw)));

                fingers.push(finger);
            });

            return { side, shoulder, elbow, wrist, fingers };
        }

        const leftArm = buildForelimb(1);
        const rightArm = buildForelimb(-1);

        // =====================================================================
        // 2F. MEMBRES POSTÉRIEURS DIGITIGRADES COLOSSAUX À 4 SEGMENTS ARTICULÉS
        // =====================================================================
        function buildHindlimb(side) {
            // Ancrage pelvien médial intégré dans le galbe de l'ilion sans débordement
            const hip = new THREE.Group();
            hip.position.set(side * 0.28, -0.04, -0.32);
            torsoGroup.add(hip);

            // 1. Fémur colossal (0.86m) avec capsules articulaires sphériques à la hanche et au genou
            const femLen = 0.86;
            const femMesh = createMuscularSegment(femLen, '-y', (t, angle) => {
                const belly = Math.sin(t * Math.PI * 0.82) * 0.095;
                const r = THREE.MathUtils.lerp(0.32, 0.20, t) + belly;
                const frontBackAsym = Math.cos(angle) * 0.035;
                return {
                    rx: r * 0.78,
                    rz: r * 1.18,
                    offsetZ: frontBackAsym
                };
            }, materials.bodyHide, 0.18, 0.16);
            hip.add(femMesh);
            hip.add(createBoneVisual(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -femLen, 0), 0.068));

            // 2. Genou -> Tibia / Mollet (0.92m avec galbe puissant du M. gastrocnemius)
            const knee = new THREE.Group();
            knee.position.set(0, -femLen, 0);
            hip.add(knee);

            const tibLen = 0.92;
            const tibMesh = createMuscularSegment(tibLen, '-y', (t) => {
                const calfBulge = Math.exp(-Math.pow(t - 0.28, 2) * 14.0) * 0.085;
                const r = THREE.MathUtils.lerp(0.20, 0.115, t) + calfBulge;
                return {
                    rx: r * 0.85,
                    rz: r * 1.12,
                    offsetZ: -calfBulge * 0.42
                };
            }, materials.bodyHide, 0.16, 0.15);
            knee.add(tibMesh);
            knee.add(createBoneVisual(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -tibLen, 0), 0.052));

            // 3. Cheville (articulation mésotarsienne) -> Arctométatarse écaillé (0.56m)
            const ankle = new THREE.Group();
            ankle.position.set(0, -tibLen, 0);
            knee.add(ankle);

            const metaLen = 0.56;
            const metaMesh = createMuscularSegment(metaLen, '-y', (t) => {
                const r = THREE.MathUtils.lerp(0.115, 0.092, t) + (t > 0.78 ? (t - 0.78) * 0.06 : 0);
                return { rx: r * 0.94, rz: r * 0.92 };
            }, materials.scalyPad, 0.16, 0.16);
            ankle.add(metaMesh);
            ankle.add(createBoneVisual(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -metaLen, 0), 0.042));

            // Ergot médial surélevé (Hallux / Doigt I)
            const halluxGroup = new THREE.Group();
            halluxGroup.position.set(-side * 0.082, -metaLen * 0.62, -0.04);
            halluxGroup.rotation.y = -side * 0.55;
            halluxGroup.rotation.x = -0.35;
            ankle.add(halluxGroup);
            const halluxClaw = new THREE.ConeGeometry(0.022, 0.11, 8);
            halluxClaw.rotateX(-Math.PI / 2 - 0.35);
            halluxClaw.translate(0, 0, -0.045);
            halluxGroup.add(registerSkin(new THREE.Mesh(halluxClaw, materials.claw)));

            // 4. Pied digitigrade (Pes) à 3 grands orteils porteurs (Doigts II, III, IV)
            const foot = new THREE.Group();
            foot.position.set(0, -metaLen, 0);
            ankle.add(foot);

            const toes = [];
            const toeSpecs = [
                { idx: 0, angleY: 0.28,  xOff: 0.062, len: 0.34, r: 0.044, clawLen: 0.16, clawR: 0.038 }, // Doigt II
                { idx: 1, angleY: 0.0,   xOff: 0.0,   len: 0.44, r: 0.052, clawLen: 0.20, clawR: 0.046 }, // Doigt III (central géant)
                { idx: 2, angleY: -0.28, xOff: -0.062, len: 0.33, r: 0.042, clawLen: 0.15, clawR: 0.036 } // Doigt IV
            ];

            toeSpecs.forEach(spec => {
                const toeGroup = new THREE.Group();
                toeGroup.position.set(spec.xOff, 0.0, 0.01);
                toeGroup.rotation.y = spec.angleY;
                foot.add(toeGroup);

                const phalMesh = createMuscularSegment(spec.len, 'z', (t) => {
                    const r = THREE.MathUtils.lerp(spec.r, spec.r * 0.80, t);
                    return { rx: r * 1.05, rz: r * 0.74 };
                }, materials.scalyPad, 0.20, 0.16);
                toeGroup.add(phalMesh);

                // Griffe ungéale lourde légèrement recourbée vers le sol
                const ungualGeo = new THREE.ConeGeometry(spec.clawR, spec.clawLen, 10);
                ungualGeo.scale(0.82, 1.0, 1.1);
                ungualGeo.rotateX(Math.PI / 2 + 0.18);
                ungualGeo.translate(0, -0.008, spec.len + spec.clawLen * 0.38);
                toeGroup.add(registerSkin(new THREE.Mesh(ungualGeo, materials.claw)));

                toes.push(toeGroup);
            });

            return { side, hip, knee, ankle, foot, toes };
        }

        const leftLeg = buildHindlimb(1);
        const rightLeg = buildHindlimb(-1);

        // =====================================================================
        // 3. MOTEUR DE POSES BIOMÉCANIQUES (IDLE, WALK, SPRINT, DISPLAY, CROUCH)
        // =====================================================================
        const tRig = {
            trex,
            rootJoint,
            torsoGroup,
            caudalSegments,
            neckSegments,
            headGroup,
            jawGroup,
            leftArm,
            rightArm,
            leftLeg,
            rightLeg,
            eyelids,
            jawAdductors,
            tongueMesh: jawGroup.userData.tongueMesh,
            skeletonMeshes,
            materials,
            currentMode: 'idle',
            poseUpdatedThisFrame: false
        };

        // Convention : rx > 0 = tête/mâchoire baisse vers le sol, rx < 0 = tête lève vers le ciel
        function setTrexHeadRot(rx, ry, rz) {
            rig.headGroup.rotation.set(rz || 0, ry || 0, -(rx || 0));
        }

        // Convention : openAmt > 0 = ouverture de la mâchoire inférieure
        function setTrexJawRot(openAmt, rollZ = 0) {
            rig.jaw.rotation.set(rollZ || 0, 0, -Math.max(0, openAmt || 0));
        }

        // Cinématique des petits bras didactyles : les maintient dégagés sous et devant le poitrail
        function setForelimbPose(arm, shoulderPitch = 0, shoulderAbduct = 0, elbowFlex = 0, wristFlex = 0, clawCurl = 0) {
            const s = arm.side;
            // x > 0 incline l'humérus vers l'arrière/bas, z = s * (+) écarte le coude vers l'extérieur
            arm.shoulder.rotation.set(0.22 + shoulderPitch, 0, s * (0.22 + shoulderAbduct));
            // L'avant-bras (+Z) pointe vers l'avant et légèrement vers le bas sous la gorge/poitrail
            arm.elbow.rotation.set(0.08 - elbowFlex, -s * 0.14, 0);
            arm.wrist.rotation.set(0.10 + wristFlex, -s * 0.18, s * 0.28);
            if (arm.fingers) {
                arm.fingers.forEach((f, idx) => {
                    const basePitch = idx === 0 ? -0.14 : 0.16;
                    f.rotation.x = basePitch + clawCurl * (idx === 0 ? 0.25 : 0.35);
                    f.rotation.y = -s * (0.18 + clawCurl * 0.22);
                });
            }
        }

        // Cinématique inverse simplifiée du membre postérieur digitigrade à 4 segments
        // (hip = -0.52, knee = +0.94, ankle = -0.94, foot = +0.52 maintient la plante du pied à plat à y = 0)
        function setDigitigradeLegPose(leg, swingAngle = 0, kneeFlex = 0, ankleFlex = 0, crouchDrop = 0, toeCurl = 0, abduction = 0.04) {
            const rootPitch = rootJoint.rotation.x || 0;
            const cBend = crouchDrop * 0.85;
            const hipRx = -0.52 - rootPitch + swingAngle - cBend;
            const kneeRx = 0.94 + kneeFlex + cBend * 1.95;
            const ankleRx = -0.94 + ankleFlex - cBend * 1.55;
            const footRx = -(hipRx + kneeRx + ankleRx + rootPitch) + toeCurl * 0.45;

            leg.hip.rotation.set(hipRx, 0, abduction * leg.side);
            leg.knee.rotation.set(kneeRx, 0, 0);
            leg.ankle.rotation.set(ankleRx, 0, 0);
            leg.foot.rotation.set(footRx, 0, 0);

            leg.toes.forEach((toe, idx) => {
                const baseSpread = idx === 0 ? 0.28 : (idx === 2 ? -0.28 : 0);
                const splay = toeCurl < 0 ? -toeCurl * 0.14 : -toeCurl * 0.08;
                toe.rotation.x = Math.max(-0.25, toeCurl * 0.55);
                toe.rotation.y = baseSpread * (1 + splay);
            });
        }

        tRig.setHeadRot = setTrexHeadRot;
        tRig.setJawRot = setTrexJawRot;
        tRig.setForelimbPose = setForelimbPose;
        tRig.setDigitigradeLegPose = setDigitigradeLegPose;

        function applyPoseMode(mode, t, opts = {}) {
            tRig.currentMode = mode;
            tRig.poseUpdatedThisFrame = true;

            if (mode === 'idle') {
                // --- MODE 1 : POSTURE D'ATTENTE PRÉDATRICE (RESPIRATION LOURDE & SCAN BINOCULAIRE) ---
                const breath = Math.sin(t * 2.6);
                const weightShift = Math.sin(t * 1.3);
                const dropAmt = Math.max(0, -breath) * 0.04;

                rootJoint.position.set(weightShift * 0.025, 2.10 - dropAmt * 0.5, 0);
                rootJoint.rotation.set(
                    0.02 + breath * 0.018,
                    weightShift * 0.025,
                    weightShift * 0.015
                );

                neckSegments.forEach((seg, i) => {
                    const baseS = i < 2 ? -0.14 : (i === 2 ? -0.04 : 0.08);
                    const wave = Math.sin(t * 2.6 - i * 0.35) * 0.014;
                    seg.rotation.set(baseS + wave, Math.sin(t * 1.3) * 0.022, 0);
                });

                setTrexHeadRot(
                    0.18 + Math.sin(t * 2.6 - 1.2) * 0.035,
                    Math.sin(t * 1.3) * 0.08,
                    Math.cos(t * 1.3) * 0.025
                );
                setTrexJawRot(0.08 + Math.max(0, breath) * 0.09);

                // Bras didactyles bien dégagés sous le poitrail avec mouvements de griffes prédateurs
                [leftArm, rightArm].forEach(arm => {
                    const s = arm.side;
                    const twitch = Math.sin(t * 3.2 + s * 1.1);
                    setForelimbPose(arm, twitch * 0.06, 0.02, twitch * 0.09, -twitch * 0.06, 0.25 + twitch * 0.22);
                });

                setDigitigradeLegPose(leftLeg, 0.03, 0, 0, dropAmt, -0.08, 0.04);
                setDigitigradeLegPose(rightLeg, -0.03, 0, 0, dropAmt, -0.08, 0.04);

                caudalSegments.forEach((seg, i) => {
                    const basePitch = i === 0 ? 0.04 : (i < 3 ? -0.015 : 0.01);
                    seg.rotation.set(
                        basePitch + Math.cos(t * 2.6 - i * 0.45) * 0.018,
                        Math.sin(t * 2.2 - i * 0.52) * (0.045 + i * 0.014),
                        0
                    );
                });

            } else if (mode === 'walk' || mode === 'sprint') {
                // --- MODE 2 : FOULÉE BIPÈDE LOURDE & COURSE DE POURSUITE HORIZONTALE ---
                const isSprint = mode === 'sprint' || Boolean(opts.isSprint);
                const strideSpeed = opts.strideSpeed || (isSprint ? 10.5 : 7.8);
                const strideAmp = opts.strideAmp !== undefined ? opts.strideAmp : (isSprint ? 1.28 : 1.0);
                const lPhase = t * strideSpeed;
                const rPhase = lPhase + Math.PI;

                const stepBounce = Math.abs(Math.sin(lPhase)) * (isSprint ? 0.16 : 0.11) * strideAmp;
                const forwardLean = isSprint ? 0.24 : 0.08;

                rootJoint.position.set(
                    Math.cos(lPhase) * 0.06 * strideAmp,
                    2.06 + stepBounce - (isSprint ? 0.10 : 0),
                    0
                );
                rootJoint.rotation.set(
                    forwardLean + Math.cos(lPhase * 2) * 0.035 * strideAmp,
                    Math.sin(lPhase) * 0.065 * strideAmp,
                    Math.cos(lPhase) * 0.045 * strideAmp
                );

                neckSegments.forEach((seg, i) => {
                    const baseS = isSprint
                        ? (i < 2 ? -0.06 : 0.04)
                        : (i < 2 ? -0.14 : (i === 2 ? -0.03 : 0.08));
                    seg.rotation.set(
                        baseS - Math.cos(lPhase * 2 - i * 0.25) * 0.022 * strideAmp,
                        -Math.sin(lPhase) * 0.03 * strideAmp,
                        0
                    );
                });

                setTrexHeadRot(
                    (isSprint ? 0.04 : 0.16) + Math.sin(lPhase * 2) * 0.04 * strideAmp,
                    -Math.sin(lPhase) * 0.06 * strideAmp,
                    -Math.cos(lPhase) * 0.03 * strideAmp
                );
                setTrexJawRot((isSprint ? 0.24 : 0.12) + Math.abs(Math.sin(lPhase)) * 0.14);

                [leftArm, rightArm].forEach(arm => {
                    const phase = arm.side === 1 ? lPhase : rPhase;
                    const swing = Math.sin(phase) * 0.16 * strideAmp;
                    setForelimbPose(arm, swing, 0.04, 0.10 + swing * 0.5, 0, 0.35);
                });

                [leftLeg, rightLeg].forEach(leg => {
                    const phase = leg.side === 1 ? lPhase : rPhase;
                    const swing = -Math.sin(phase) * 0.46 * strideAmp;
                    const liftPhase = Math.max(0, Math.cos(phase));
                    const pushPhase = Math.max(0, -Math.cos(phase));

                    const kneeFlex = liftPhase * 0.62 * strideAmp - pushPhase * 0.18 * strideAmp;
                    const ankleFlex = -liftPhase * 0.45 * strideAmp + pushPhase * 0.38 * strideAmp;
                    const toeCurl = liftPhase > 0.2 ? liftPhase * 0.48 : -0.15;

                    setDigitigradeLegPose(leg, swing, kneeFlex, ankleFlex, isSprint ? 0.08 : 0.02, toeCurl, 0.04);
                });

                caudalSegments.forEach((seg, i) => {
                    const pitchBase = isSprint ? -0.02 : (i === 0 ? 0.03 : -0.01);
                    seg.rotation.set(
                        pitchBase + Math.sin(lPhase * 2 - i * 0.45) * 0.03 * strideAmp,
                        -Math.cos(lPhase - i * 0.48) * (0.08 + i * 0.024) * strideAmp,
                        0
                    );
                });

            } else if (mode === 'display') {
                // --- MODE 3 : RUGISSEMENT TERRITORIAL D'INTIMIDATION (APEX ROAR) ---
                const roarVib = Math.sin(t * 28);
                rootJoint.position.set(0, 2.16, 0.08);
                rootJoint.rotation.set(-0.18 + roarVib * 0.012, 0, 0);

                neckSegments.forEach((seg, i) => {
                    const arch = i < 2 ? -0.22 : (i === 2 ? -0.08 : 0.14);
                    seg.rotation.set(arch + roarVib * 0.01, Math.sin(t * 6) * 0.03, 0);
                });

                setTrexHeadRot(-0.15 + roarVib * 0.025, Math.sin(t * 6) * 0.12, roarVib * 0.02);
                setTrexJawRot(0.78 + roarVib * 0.08);

                // Bras écartés et griffes grandes ouvertes pendant le rugissement
                [leftArm, rightArm].forEach(arm => {
                    setForelimbPose(arm, -0.18, 0.16, 0.22, -0.15, -0.35);
                });

                setDigitigradeLegPose(leftLeg, 0.08, -0.08, 0.05, 0, -0.18, 0.06);
                setDigitigradeLegPose(rightLeg, -0.10, 0.04, -0.04, 0, -0.18, 0.06);

                caudalSegments.forEach((seg, i) => {
                    seg.rotation.set(
                        0.05 - i * 0.015,
                        Math.sin(t * 5 - i * 0.5) * (0.06 + i * 0.02),
                        0
                    );
                });

            } else if (mode === 'crouch') {
                // --- MODE 4 : ACCROUPISSEMENT D'EMBUSCADE PRÊT AU BOND ---
                const breath = Math.sin(t * 3.0);
                rootJoint.position.set(0, 1.56 + breath * 0.02, 0);
                rootJoint.rotation.set(0.18, 0, 0);

                neckSegments.forEach((seg, i) => {
                    seg.rotation.set(i < 2 ? -0.22 : 0.06, 0, 0);
                });
                setTrexHeadRot(0.05, 0, 0);
                setTrexJawRot(0.16);

                [leftArm, rightArm].forEach(arm => {
                    setForelimbPose(arm, 0.08, 0.06, 0.25, 0.10, 0.45);
                });

                setDigitigradeLegPose(leftLeg, 0.05, 0.15, -0.10, 0.52, -0.15, 0.05);
                setDigitigradeLegPose(rightLeg, -0.05, 0.15, -0.10, 0.52, -0.15, 0.05);

                caudalSegments.forEach((seg, i) => {
                    seg.rotation.set(-0.03, Math.sin(t * 3.0 - i * 0.5) * 0.05, 0);
                });
            }
        }

        function resetTrexPose(time) {
            rig.torso.rotation.set(0, 0, 0);
            rig.neck.rotation.set(0, 0, 0);
            if (rig.arms[0]) rig.arms[0].rotation.set(0, 0, 0);
            if (rig.arms[1]) rig.arms[1].rotation.set(0, 0, 0);
            if (rig.legs[0]) rig.legs[0].rotation.set(0, 0, 0);
            if (rig.legs[1]) rig.legs[1].rotation.set(0, 0, 0);
            rig.tailSegments.forEach(s => { if (s) s.rotation.set(0, 0, 0); });
            applyPoseMode('idle', time || 0);
            tRig.poseUpdatedThisFrame = false;
        }

        const _pUpper = new THREE.Vector3();
        const _pLower = new THREE.Vector3();
        const _pMid = new THREE.Vector3();

        function updateAnatomicalSkin(time, fighter, modeOverride) {
            const t = time || 0;
            const breathPhase = t * 2.6;

            // 1. Clignement naturel des paupières ou plissement agressif lors des attaques
            const blinkCycle = ((t % 4.4) + 4.4) % 4.4;
            const blinkAmt = blinkCycle < 0.15 ? Math.sin((blinkCycle / 0.15) * Math.PI) : 0;
            const jawOpenAmt = Math.max(0, -rig.jaw.rotation.z);
            const glareSquint = Math.min(0.32, jawOpenAmt * 0.28);
            eyelids.forEach(lid => {
                lid.rotation.x = -Math.PI * 0.48 + Math.max(blinkAmt * 0.92, glareSquint);
            });

            // 2. Vibration de la langue selon l'ouverture de la mâchoire
            if (jawGroup.userData.tongueMesh) {
                jawGroup.userData.tongueMesh.rotation.x = -0.04 + jawOpenAmt * 0.16 + Math.sin(t * 24) * 0.025 * jawOpenAmt;
            }

            // 3. Gestion des réactions de combat (combat_reactions.js) et neutralisation des surcharges génériques
            if (tRig.poseUpdatedThisFrame) {
                rig.torso.rotation.set(0, 0, 0);
                rig.neck.rotation.set(0, 0, 0);
                if (fighter && (fighter.action === 'crouch' || fighter.isCrouching)) {
                    rig.hips.position.y = 2.1;
                }
            } else if (fighter) {
                const cState = fighter.combatController ? fighter.combatController.state : null;
                const isGroundedOrFalling = fighter.isDead || fighter.flattened || fighter.beingThrownTimer > 0 ||
                    cState === CombatState.KNOCKDOWN_FALL || cState === CombatState.GROUNDED_IDLE || cState === CombatState.WAKE_UP_STAND;

                if (!isGroundedOrFalling) {
                    const genericPitch = -(rig.hips.rotation.z + rig.torso.rotation.z);
                    const genericYaw = rig.torso.rotation.y;
                    const hipDrop = Math.max(-0.35, Math.min(0.95, 2.1 - rig.hips.position.y));

                    rig.hips.position.y = 2.1;
                    rig.hips.rotation.z = 0;
                    rig.torso.rotation.set(0, 0, 0);

                    rootJoint.position.y = 2.10 - hipDrop * 0.78;
                    rootJoint.rotation.set(genericPitch * 0.72, genericYaw, rig.hips.rotation.x);

                    const lSwing = rig.legs[0] ? -rig.legs[0].rotation.z * 0.45 : 0;
                    const rSwing = rig.legs[1] ? -rig.legs[1].rotation.z * 0.45 : 0;
                    const crouchAmt = Math.max(0, hipDrop * 0.55);

                    setDigitigradeLegPose(leftLeg, lSwing, Math.max(0, lSwing) * 0.35, 0, crouchAmt, -0.15, 0.05);
                    setDigitigradeLegPose(rightLeg, rSwing, Math.max(0, rSwing) * 0.35, 0, crouchAmt, -0.15, 0.05);
                }

                if (Math.abs(rig.neck.rotation.z) > 0.001 || Math.abs(rig.neck.rotation.y) > 0.001) {
                    const pitchPerSeg = -rig.neck.rotation.z / neckSegments.length;
                    const yawPerSeg = rig.neck.rotation.y / neckSegments.length;
                    neckSegments.forEach(seg => {
                        seg.rotation.x += pitchPerSeg;
                        seg.rotation.y += yawPerSeg;
                    });
                    rig.neck.rotation.set(0, 0, 0);
                }

                if (rig.arms[0] && Math.abs(rig.arms[0].rotation.z) > 0.001) {
                    setForelimbPose(leftArm, -rig.arms[0].rotation.z * 0.35, 0.06, 0.15, 0, 0.3);
                }
                if (rig.arms[1] && Math.abs(rig.arms[1].rotation.z) > 0.001) {
                    setForelimbPose(rightArm, -rig.arms[1].rotation.z * 0.35, 0.06, 0.15, 0, 0.3);
                }

                rig.tailSegments.forEach((tProxy, idx) => {
                    if (!tProxy) return;
                    if (Math.abs(tProxy.rotation.y) > 0.001 || Math.abs(tProxy.rotation.z) > 0.001) {
                        const cIdx = Math.min(caudalSegments.length - 1, idx);
                        caudalSegments[cIdx].rotation.y += tProxy.rotation.y * 0.65;
                        caudalSegments[cIdx].rotation.x -= tProxy.rotation.z * 0.55;
                        if (idx === 3 && caudalSegments.length > 4) {
                            caudalSegments[4].rotation.y += tProxy.rotation.y * 0.55;
                            caudalSegments[5].rotation.y += tProxy.rotation.y * 0.55;
                        }
                        tProxy.rotation.set(0, 0, 0);
                    }
                });
            }

            // 4. Synchroniser l'affichage du squelette interne X-Ray
            const isXray = Boolean(fighter && fighter.isXrayTarget);
            skeletonMeshes.forEach(m => { m.visible = isXray; });

            // 5. Mettre à jour les matrices mondiales, les muscles adducteurs de la mâchoire et le maillage continu
            trex.updateMatrixWorld(true);

            jawAdductors.forEach(item => {
                item.muscMesh.visible = jawOpenAmt > 0.06;
                if (item.muscMesh.visible) {
                    item.upperAnchor.getWorldPosition(_pUpper);
                    item.lowerAnchor.getWorldPosition(_pLower);
                    headGroup.worldToLocal(_pUpper);
                    headGroup.worldToLocal(_pLower);
                    _pMid.copy(_pUpper).add(_pLower).multiplyScalar(0.5);
                    const dist = Math.max(0.06, _pUpper.distanceTo(_pLower));
                    item.muscMesh.position.copy(_pMid);
                    item.muscMesh.scale.set(0.72, dist / 0.22, 1.35);
                    item.muscMesh.rotation.set(0.15 + jawOpenAmt * 0.32, 0, item.side * 0.08);
                }
            });

            updateContinuousBodySkin(breathPhase);
            void modeOverride;
        }

        rig.specialParts.tRig = tRig;
        rig.specialParts.applyPoseMode = applyPoseMode;
        rig.specialParts.resetTrexPose = resetTrexPose;
        rig.specialParts.resetQuetzalPose = resetTrexPose; // Hook automatique dans rig_reset.js
        rig.specialParts.updateAnatomicalSkin = updateAnatomicalSkin;

        // Initialiser la pose par défaut et générer le maillage continu initial
        applyPoseMode('idle', 0);
        updateAnatomicalSkin(0, null, 'idle');
    },
});
