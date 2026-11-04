/* ============================================================================
 * COMBATTANT : QUETZALCOATLUS (Quetzalcoatlus Northropi)
 * Données (stats, skins, textes), modèle 3D paléontologique procédural haute
 * fidélité (textures PBR pycnofibres, kératine du bec, crête sagittale, patagium
 * vascularisé à actinofibrilles, maillage corporel continu par spline Catmull-Rom
 * et membranes alaires déformables en temps réel), animations biomécaniques,
 * coups spéciaux & fatalité.
 * ============================================================================ */

// Cache global des textures procédurales PBR 1024x1024 pour éviter toute régénération coûteuse
let _cachedQuetzalPBRMaps = null;

function getQuetzalPBRMaps() {
    if (_cachedQuetzalPBRMaps) return _cachedQuetzalPBRMaps;

    function applySRGB(tex) {
        if (THREE.SRGBColorSpace) {
            tex.colorSpace = THREE.SRGBColorSpace;
        } else if (THREE.sRGBEncoding) {
            tex.encoding = THREE.sRGBEncoding;
        }
    }

    function createPycnofiberMaps() {
        const size = 1024;
        const colorCanvas = document.createElement('canvas');
        const bumpCanvas = document.createElement('canvas');
        colorCanvas.width = bumpCanvas.width = size;
        colorCanvas.height = bumpCanvas.height = size;
        const cCtx = colorCanvas.getContext('2d');
        const bCtx = bumpCanvas.getContext('2d');

        // Countershaded organic base coat (U = around circumference, V = tail to head)
        const grad = cCtx.createLinearGradient(0, 0, size, 0);
        grad.addColorStop(0.0, '#2e241d');   // Dorsal spine (dark sepia-slate)
        grad.addColorStop(0.22, '#5c4635');  // Upper flank (warm umber)
        grad.addColorStop(0.42, '#9e7f60');  // Lower flank (ochre-tan)
        grad.addColorStop(0.5, '#cbb597');   // Ventral belly/throat (pale cream)
        grad.addColorStop(0.58, '#9e7f60');
        grad.addColorStop(0.78, '#5c4635');
        grad.addColorStop(1.0, '#2e241d');
        cCtx.fillStyle = grad;
        cCtx.fillRect(0, 0, size, size);

        bCtx.fillStyle = '#808080';
        bCtx.fillRect(0, 0, size, size);

        // Organic mottled markings along dorsal/flank regions
        for (let i = 0; i < 450; i++) {
            const u = Math.random();
            if (u > 0.35 && u < 0.65) continue; // Keep belly clean
            const x = u * size;
            const y = Math.random() * size;
            const r = 8 + Math.random() * 26;
            const g = cCtx.createRadialGradient(x, y, 1, x, y, r);
            const dark = Math.random() > 0.45;
            g.addColorStop(0, dark ? 'rgba(32, 24, 18, 0.22)' : 'rgba(180, 145, 105, 0.16)');
            g.addColorStop(1, 'rgba(0,0,0,0)');
            cCtx.fillStyle = g;
            cCtx.beginPath();
            cCtx.arc(x, y, r, 0, Math.PI * 2);
            cCtx.fill();
        }

        // 65,000 fine directional pycnofiber filaments
        for (let i = 0; i < 65000; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const len = 5 + Math.random() * 14;
            const angle = Math.PI / 2 + (Math.random() - 0.5) * 0.28;
            const lum = Math.floor(105 + Math.random() * 50);

            cCtx.strokeStyle = Math.random() > 0.5
                ? 'rgba(225, 200, 170, 0.12)'
                : 'rgba(25, 18, 12, 0.15)';
            cCtx.lineWidth = 1.0;
            cCtx.beginPath();
            cCtx.moveTo(x, y);
            cCtx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
            cCtx.stroke();

            bCtx.strokeStyle = `rgb(${lum},${lum},${lum})`;
            bCtx.lineWidth = 1.1;
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

    function createKeratinBeakMaps() {
        const size = 1024;
        const canvas = document.createElement('canvas');
        const bump = document.createElement('canvas');
        canvas.width = bump.width = size;
        canvas.height = bump.height = size;
        const ctx = canvas.getContext('2d');
        const bCtx = bump.getContext('2d');

        // Longitudinal gradient from cranial base (left) to spear tip (right)
        const grad = ctx.createLinearGradient(0, 0, size, 0);
        grad.addColorStop(0.0, '#29221e');   // Dark cranial base
        grad.addColorStop(0.25, '#47382c');  // Nasoantorbital region
        grad.addColorStop(0.58, '#8a5a32');  // Horn-colored mid rostrum
        grad.addColorStop(0.84, '#c47f35');  // Golden-amber spear blade
        grad.addColorStop(0.96, '#3b281c');  // Darkened wear tip
        grad.addColorStop(1.0, '#1c140e');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, size, size);

        bCtx.fillStyle = '#808080';
        bCtx.fillRect(0, 0, size, size);

        // Longitudinal vascular sulci & keratin growth layers
        for (let i = 0; i < 4000; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const len = 20 + Math.random() * 90;
            ctx.strokeStyle = Math.random() > 0.5
                ? 'rgba(20, 14, 10, 0.16)'
                : 'rgba(245, 200, 140, 0.09)';
            ctx.lineWidth = 0.8 + Math.random() * 1.8;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + len, y + (Math.random() - 0.5) * 4);
            ctx.stroke();

            const bVal = Math.random() > 0.5 ? 155 : 95;
            bCtx.strokeStyle = `rgb(${bVal},${bVal},${bVal})`;
            bCtx.lineWidth = 1.2;
            bCtx.beginPath();
            bCtx.moveTo(x, y);
            bCtx.lineTo(x + len, y + (Math.random() - 0.5) * 4);
            bCtx.stroke();
        }

        // Transverse keratin growth annuli
        for (let x = 80; x < size; x += 18 + Math.random() * 16) {
            ctx.strokeStyle = 'rgba(15, 10, 8, 0.18)';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.quadraticCurveTo(x - 25, size * 0.5, x, size);
            ctx.stroke();
        }

        const colorMap = new THREE.CanvasTexture(canvas);
        const bumpMap = new THREE.CanvasTexture(bump);
        applySRGB(colorMap);
        return { colorMap, bumpMap };
    }

    function createCrestMaps() {
        const size = 512;
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = size;
        const ctx = canvas.getContext('2d');

        const grad = ctx.createLinearGradient(0, size, size * 0.8, 0);
        grad.addColorStop(0.0, '#2b1e19');
        grad.addColorStop(0.22, '#7c2519');
        grad.addColorStop(0.55, '#b9381e');
        grad.addColorStop(0.82, '#d9771c');
        grad.addColorStop(1.0, '#eab354');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, size, size);

        // Organic vascularized horn ridges & dark display mottling
        for (let i = 0; i < 90; i++) {
            const x = (i / 90) * size;
            ctx.strokeStyle = i % 5 === 0 ? 'rgba(28, 14, 12, 0.35)' : 'rgba(255, 220, 160, 0.12)';
            ctx.lineWidth = i % 5 === 0 ? 5 : 1.5;
            ctx.beginPath();
            ctx.moveTo(x, size);
            ctx.quadraticCurveTo(x - 30, size * 0.45, x + 35, 0);
            ctx.stroke();
        }

        const tex = new THREE.CanvasTexture(canvas);
        applySRGB(tex);
        return tex;
    }

    function createPatagiumMaps() {
        const size = 1024;
        const colorCanvas = document.createElement('canvas');
        const bumpCanvas = document.createElement('canvas');
        const thickCanvas = document.createElement('canvas');
        colorCanvas.width = bumpCanvas.width = thickCanvas.width = size;
        colorCanvas.height = bumpCanvas.height = thickCanvas.height = size;

        const cCtx = colorCanvas.getContext('2d');
        const bCtx = bumpCanvas.getContext('2d');
        const tCtx = thickCanvas.getContext('2d');

        // V (0 = thick muscular leading edge, 1 = thin translucent trailing edge)
        const grad = cCtx.createLinearGradient(0, 0, 0, size);
        grad.addColorStop(0.0, '#2b2019');   // Dark leathery leading spar
        grad.addColorStop(0.18, '#4a3327');  // Muscular anterior membrane
        grad.addColorStop(0.55, '#6b4332');  // Vascularized mid-chord
        grad.addColorStop(0.85, '#7c4935');  // Translucent warm trailing zone
        grad.addColorStop(1.0, '#3a2219');   // Toughened trailing edge rim
        cCtx.fillStyle = grad;
        cCtx.fillRect(0, 0, size, size);

        // Subsurface thickness map
        const tGrad = tCtx.createLinearGradient(0, 0, 0, size);
        tGrad.addColorStop(0.0, '#101010');
        tGrad.addColorStop(0.22, '#606060');
        tGrad.addColorStop(0.75, '#e5e5e5');
        tGrad.addColorStop(1.0, '#909090');
        tCtx.fillStyle = tGrad;
        tCtx.fillRect(0, 0, size, size);

        bCtx.fillStyle = '#808080';
        bCtx.fillRect(0, 0, size, size);

        // Structural Actinofibrils (fine parallel collagenous fibers spanning the wing)
        for (let x = 0; x < size; x += 3.5) {
            const wave = Math.sin(x * 0.04) * 14;
            cCtx.strokeStyle = 'rgba(24, 14, 10, 0.22)';
            cCtx.lineWidth = 1.1;
            cCtx.beginPath();
            cCtx.moveTo(x, 0);
            cCtx.quadraticCurveTo(x + wave, size * 0.5, x - wave * 0.5, size);
            cCtx.stroke();

            bCtx.strokeStyle = x % 7 < 3.5 ? '#9c9c9c' : '#666666';
            bCtx.lineWidth = 1.4;
            cCtx.beginPath();
            cCtx.moveTo(x, 0);
            cCtx.quadraticCurveTo(x + wave, size * 0.5, x - wave * 0.5, size);
            bCtx.stroke();
        }

        // Branching arterial/venous network inside the patagium
        function drawVessel(x, y, angle, width, depth) {
            if (depth <= 0 || width < 0.4 || y > size || x < 0 || x > size) return;
            const len = 35 + Math.random() * 55;
            const nx = x + Math.cos(angle) * len;
            const ny = y + Math.sin(angle) * len;

            cCtx.strokeStyle = `rgba(115, 28, 22, ${0.12 + width * 0.05})`;
            cCtx.lineWidth = width;
            cCtx.beginPath();
            cCtx.moveTo(x, y);
            cCtx.lineTo(nx, ny);
            cCtx.stroke();

            bCtx.strokeStyle = '#a8a8a8';
            bCtx.lineWidth = width * 0.9;
            cCtx.beginPath();
            bCtx.beginPath();
            bCtx.moveTo(x, y);
            bCtx.lineTo(nx, ny);
            bCtx.stroke();

            drawVessel(nx, ny, angle + (Math.random() - 0.5) * 0.45, width * 0.78, depth - 1);
            if (Math.random() > 0.35) {
                drawVessel(nx, ny, angle + (Math.random() > 0.5 ? 0.5 : -0.5), width * 0.6, depth - 1);
            }
        }

        for (let i = 0; i < 24; i++) {
            drawVessel(Math.random() * size, 20, Math.PI * 0.5 + (Math.random() - 0.5) * 0.4, 3.2, 6);
        }

        const colorMap = new THREE.CanvasTexture(colorCanvas);
        const bumpMap = new THREE.CanvasTexture(bumpCanvas);
        const thicknessMap = new THREE.CanvasTexture(thickCanvas);
        applySRGB(colorMap);
        return { colorMap, bumpMap, thicknessMap };
    }

    _cachedQuetzalPBRMaps = {
        pycnoMaps: createPycnofiberMaps(),
        beakMaps: createKeratinBeakMaps(),
        crestTex: createCrestMaps(),
        patagiumMaps: createPatagiumMaps()
    };
    return _cachedQuetzalPBRMaps;
}

// Helper compatible Three.js r128+ pour CapsuleGeometry
function createQuetzalCapsuleGeometry(radius, length, capSegments = 6, radialSegments = 10) {
    if (THREE.CapsuleGeometry) {
        return new THREE.CapsuleGeometry(radius, length, capSegments, radialSegments);
    }
    const totalRings = capSegments * 2 + 1;
    const geo = new THREE.CylinderGeometry(radius, radius, length + radius * 2, radialSegments, totalRings, false);
    const pos = geo.attributes.position;
    const halfLen = length / 2;

    for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);
        const rLen = Math.sqrt(x * x + z * z);
        const angle = Math.atan2(z, x);

        // Normaliser la position verticale [-1, 1]
        const normY = y / (halfLen + radius);
        if (normY > 0.999) {
            pos.setXYZ(i, 0, halfLen + radius, 0);
        } else if (normY < -0.999) {
            pos.setXYZ(i, 0, -halfLen - radius, 0);
        } else {
            // Transformer les anneaux supérieurs et inférieurs en calottes hémisphériques
            const u = (1 - normY) * 0.5; // 0 (top) to 1 (bottom)
            const ringIdx = Math.round(u * totalRings);
            let phi = Math.PI * 0.5;
            let centerOffset = 0;
            if (ringIdx <= capSegments) {
                phi = (ringIdx / capSegments) * (Math.PI * 0.5);
                centerOffset = halfLen;
            } else {
                phi = Math.PI * 0.5 + ((ringIdx - capSegments - 1) / capSegments) * (Math.PI * 0.5);
                centerOffset = -halfLen;
            }
            const sinPhi = Math.sin(phi);
            const cosPhi = Math.cos(phi);
            if (rLen > 0.00001) {
                pos.setXYZ(i, Math.cos(angle) * radius * sinPhi, centerOffset + radius * cosPhi, Math.sin(angle) * radius * sinPhi);
            } else {
                pos.setXYZ(i, 0, centerOffset + radius * cosPhi, 0);
            }
        }
    }
    geo.computeVertexNormals();
    return geo;
}

registerFighter({
    id: 'quetzal',
    name: 'QUETZALCOATLUS',
    fullName: 'Quetzalcoatlus Northropi',
    role: 'Monarque Céleste',
    title: '« L’Envergure Démesurée des Cieux »',
    primaryColor: 0x9e7f60,
    secondaryColor: 0x2e241d,
    accentColor: 0xd9771c,
    cssPrimary: '#f59e0b',
    scale: 0.96,
    previewScale: 0.72,
    stats: { pow: 94, spd: 96, def: 74 },
    maxHp: 940,
    walkSpeed: 9.6,
    special1Name: 'Piqué Sonique (H)',
    special2Name: 'Bourrasque d’Ailes (T)',
    fatalityName: 'Chute Stratosphérique (R)',
    moveStyle: 'Démarche quadrupède ailée sur de longues échasses, vol libre stratosphérique de 2 secondes avec jauge circulaire d’endurance, estocs foudroyants et piqués dévastateurs.',
    fatalityDesc: 'Saisit l’ennemi de son long bec en dague, s’élève dans la haute atmosphère et le laisse s’écraser à vitesse terminale.',
    skins: [
        { name: 'Javelina Sovereign', primary: 0x9e7f60, secondary: 0x2e241d, accent: 0xd9771c, membrane: 0x6b4332, beak: 0xc47f35, isDefaultPBR: true },
        { name: 'Sky Sovereign', primary: 0x38bdf8, secondary: 0x0c4a6e, accent: 0x7dd3fc, membrane: 0x0284c7, beak: 0xfacc15 },
        { name: 'Blood Harpy', primary: 0xef4444, secondary: 0x450a0a, accent: 0xf87171, membrane: 0x991b1b, beak: 0xe7e5e4 },
        { name: 'Aurora Spirit', primary: 0x818cf8, secondary: 0x312e81, accent: 0xc084fc, membrane: 0x6366f1, beak: 0xf0abfc },
        { name: 'Nocturnal Glider', primary: 0x71717a, secondary: 0x18181b, accent: 0x38bdf8, membrane: 0x3f3f46, beak: 0x94a3b8 }
    ]
}, {
    // Hauteur de base du bassin utilisée par le système d'animation (5.2m de haut, hanches à 1.98m)
    animBaseHipsY: 1.98,
    attackReach: 4.15,

    // Spécial 2 (T)
    onSpecial2(attacker, defender, dist, basePow) {
        spawn3DProjectile(attacker, 'feather');
    },

    // Construction du modèle 3D paléontologique articulé (Quetzalcoatlus northropi)
    buildRig(ctx) {
        const { hips, rig, skin, skinMeshes } = ctx;
        const { pycnoMaps, beakMaps, crestTex, patagiumMaps } = getQuetzalPBRMaps();

        const isDefaultSkin = Boolean(skin && skin.isDefaultPBR);
        const furTint = isDefaultSkin ? 0xffffff : (skin.primary || 0xffffff);
        const beakTint = isDefaultSkin ? 0xffffff : (skin.beak || 0xffffff);
        const crestTint = isDefaultSkin ? 0xffffff : (skin.accent || 0xffffff);
        const membraneTint = isDefaultSkin ? 0xffffff : (skin.membrane || 0xffffff);

        // =====================================================================
        // 1. PALETTE DE MATÉRIAUX PHYSIQUEMENT BASÉS (PBR)
        // =====================================================================
        const materials = {
            bodyFur: new THREE.MeshStandardMaterial({
                color: furTint,
                map: pycnoMaps.colorMap,
                bumpMap: pycnoMaps.bumpMap,
                bumpScale: 0.018,
                roughness: 0.84,
                metalness: 0.02
            }),
            beakKeratin: new THREE.MeshPhysicalMaterial({
                color: beakTint,
                map: beakMaps.colorMap,
                bumpMap: beakMaps.bumpMap,
                bumpScale: 0.012,
                roughness: 0.36,
                metalness: 0.05,
                clearcoat: 0.28,
                clearcoatRoughness: 0.35,
                side: THREE.DoubleSide
            }),
            crest: new THREE.MeshPhysicalMaterial({
                color: crestTint,
                map: crestTex,
                bumpMap: beakMaps.bumpMap,
                bumpScale: 0.014,
                roughness: 0.32,
                clearcoat: 0.35,
                clearcoatRoughness: 0.28,
                side: THREE.DoubleSide
            }),
            oralMucosa: new THREE.MeshPhysicalMaterial({
                color: 0x7c3a32,
                roughness: 0.25,
                clearcoat: 0.7,
                clearcoatRoughness: 0.15,
                side: THREE.DoubleSide
            }),
            wingMembrane: new THREE.MeshPhysicalMaterial({
                color: membraneTint,
                map: patagiumMaps.colorMap,
                bumpMap: patagiumMaps.bumpMap,
                bumpScale: 0.012,
                roughness: 0.56,
                metalness: 0.02,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.98
            }),
            limbSkin: new THREE.MeshStandardMaterial({
                map: pycnoMaps.colorMap,
                bumpMap: pycnoMaps.bumpMap,
                bumpScale: 0.014,
                color: isDefaultSkin ? 0x9c8876 : furTint,
                roughness: 0.72
            }),
            scalyPad: new THREE.MeshStandardMaterial({
                color: 0x2b2420,
                bumpMap: beakMaps.bumpMap,
                bumpScale: 0.02,
                roughness: 0.65
            }),
            boneXray: new THREE.MeshStandardMaterial({
                color: 0xf8fafc,
                emissive: 0x38bdf8,
                emissiveIntensity: 0.4,
                roughness: 0.22
            }),
            eyeIris: new THREE.MeshStandardMaterial({
                color: 0xf59e0b,
                emissive: 0x78350f,
                emissiveIntensity: 0.25,
                roughness: 0.18
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
            eyePupil: new THREE.MeshBasicMaterial({ color: 0x040404 }),
            claw: new THREE.MeshPhysicalMaterial({
                color: 0x171412,
                roughness: 0.24,
                clearcoat: 0.5
            })
        };

        // Synchroniser rig.bodyMat pour le flash d'impact en combat
        rig.bodyMat = materials.bodyFur;

        const skeletonMeshes = [];

        function registerSkin(mesh) {
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            skinMeshes.push(mesh);
            return mesh;
        }

        function createBoneVisual(p1, p2, radius = 0.032) {
            const dist = p1.distanceTo(p2);
            const geo = new THREE.CylinderGeometry(radius * 0.72, radius, dist, 10);
            geo.translate(0, dist / 2, 0);
            geo.rotateX(Math.PI / 2);
            const mesh = new THREE.Mesh(geo, materials.boneXray);
            mesh.position.copy(p1);
            mesh.lookAt(p2);
            mesh.visible = false;
            skeletonMeshes.push(mesh);
            return mesh;
        }

        // Helper pour sculpter organiquement les segments musculaires des membres
        function createMuscularSegment(length, axis, profileFn, material) {
            const radialSegs = 20;
            const heightSegs = 16;
            const geo = new THREE.CylinderGeometry(1, 1, length, radialSegs, heightSegs, false);
            const pos = geo.attributes.position;

            for (let i = 0; i < pos.count; i++) {
                const x = pos.getX(i);
                const y = pos.getY(i); // -length/2 to +length/2
                const z = pos.getZ(i);
                const t = (y + length / 2) / length; // 0 (proximal) to 1 (distal)
                const angle = Math.atan2(z, x);

                const { rx, rz, offsetY = 0, offsetZ = 0 } = profileFn(t, angle);
                const rLen = Math.sqrt(x * x + z * z);
                if (rLen > 0.0001) {
                    pos.setX(i, Math.cos(angle) * rx);
                    pos.setZ(i, Math.sin(angle) * rz + offsetZ);
                    pos.setY(i, y + offsetY);
                }
            }

            if (axis === 'z') {
                geo.rotateX(Math.PI / 2);
                geo.translate(0, 0, length / 2);
            } else if (axis === 'x') {
                geo.rotateZ(-Math.PI / 2);
                geo.translate(length / 2, 0, 0);
            } else if (axis === '-x') {
                geo.rotateZ(Math.PI / 2);
                geo.translate(-length / 2, 0, 0);
            } else if (axis === '-y') {
                geo.rotateX(Math.PI);
                geo.translate(0, -length / 2, 0);
            }
            geo.computeVertexNormals();
            return registerSkin(new THREE.Mesh(geo, material));
        }

        hips.position.y = 1.98;

        // Groupe racine du modèle paléontologique (orienté vers +X dans le repère du jeu)
        const quetzal = new THREE.Group();
        quetzal.position.set(0, -1.98, 0);
        quetzal.rotation.y = Math.PI / 2;
        rig.torso.add(quetzal);

        const rootJoint = new THREE.Group();
        rootJoint.position.set(0, 1.98, 0);
        quetzal.add(rootJoint);

        const torsoGroup = new THREE.Group();
        rootJoint.add(torsoGroup);

        // Nœud d'attache de cou et membres factices pour la compatibilité standard du rig
        rig.neck.position.set(0.55, 0.5, 0);
        rig.torso.add(rig.neck);

        const qTailProxy = new THREE.Group();
        qTailProxy.position.set(-0.82, -0.3, 0);
        rig.torso.add(qTailProxy);
        rig.tailSegments.push(qTailProxy);

        const armProxyL = new THREE.Group();
        const armProxyR = new THREE.Group();
        rig.torso.add(armProxyL, armProxyR);
        rig.arms.push(armProxyL, armProxyR);

        const legProxyL = new THREE.Group();
        const legProxyR = new THREE.Group();
        hips.add(legProxyL, legProxyR);
        rig.legs.push(legProxyL, legProxyR);

        // =====================================================================
        // 2A. RIG SQUELETTIQUE DU TORSE & DES 7 VERTÈBRES CERVICALES
        // =====================================================================
        const tailTipNode = new THREE.Group();
        tailTipNode.position.set(0, 0.02, -1.35);
        torsoGroup.add(tailTipNode);

        const pelvisNode = new THREE.Group();
        pelvisNode.position.set(0, 0.05, -0.88);
        torsoGroup.add(pelvisNode);

        const lumbarNode = new THREE.Group();
        lumbarNode.position.set(0, 0.06, -0.35);
        torsoGroup.add(lumbarNode);

        const chestCenterNode = new THREE.Group();
        chestCenterNode.position.set(0, 0.04, 0.25);
        torsoGroup.add(chestCenterNode);

        const chestFrontNode = new THREE.Group();
        chestFrontNode.position.set(0, 0.10, 0.68);
        torsoGroup.add(chestFrontNode);

        // Colonne vertébrale interne & côtes thoraciques pour le mode X-Ray
        torsoGroup.add(createBoneVisual(new THREE.Vector3(0, 0.04, -1.3), new THREE.Vector3(0, 0.14, 0.85), 0.055));
        for (let r = 0; r < 7; r++) {
            const ribGeo = new THREE.TorusGeometry(0.34 - r * 0.025, 0.016, 8, 22, Math.PI * 1.45);
            ribGeo.rotateY(Math.PI);
            ribGeo.rotateZ(Math.PI * 0.28);
            const rib = new THREE.Mesh(ribGeo, materials.boneXray);
            rib.position.set(0, 0.04, 0.58 - r * 0.19);
            rib.visible = false;
            skeletonMeshes.push(rib);
            torsoGroup.add(rib);
        }

        // 7 segments de vertèbres cervicales articulées (longueur totale du cou ~ 2.4m)
        const neckSegments = [];
        const numNeckVerts = 7;
        const segLen = 0.34;
        let parentNeck = torsoGroup;

        for (let i = 0; i < numNeckVerts; i++) {
            const segGroup = new THREE.Group();
            if (i === 0) {
                segGroup.position.set(0, 0.14, 0.82);
            } else {
                segGroup.position.set(0, 0, segLen);
            }
            parentNeck.add(segGroup);
            neckSegments.push(segGroup);

            const cBone = createBoneVisual(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, segLen), 0.046 - i * 0.002);
            segGroup.add(cBone);

            parentNeck = segGroup;
        }

        // =====================================================================
        // 2B. MAILLAGE CORPOREL & CERVICAL CONTINU (SPLINE CATMULL-ROM EN TEMPS RÉEL)
        // =====================================================================
        const bodySpineNodes = [
            { node: tailTipNode, rx: 0.015, ry: 0.015, yOff: 0 },
            { node: pelvisNode, rx: 0.18, ry: 0.19, yOff: 0.01 },
            { node: lumbarNode, rx: 0.31, ry: 0.33, yOff: 0.0 },
            { node: chestCenterNode, rx: 0.42, ry: 0.45, yOff: -0.04 }, // Carène pectorale profonde
            { node: chestFrontNode, rx: 0.34, ry: 0.35, yOff: 0.02 },
            ...neckSegments.map((seg, i) => ({
                node: seg,
                rx: 0.185 - i * 0.011,
                ry: 0.225 - i * 0.012,
                yOff: 0
            }))
        ];

        // Adaptateur d'axe pour que rig.headGroup (Bone_Head) ait +X vers l'avant et rotation.z en tangage
        const headAdapter = new THREE.Group();
        headAdapter.position.set(0, 0, segLen);
        headAdapter.rotation.y = -Math.PI / 2;
        parentNeck.add(headAdapter);

        rig.headGroup.position.set(0, 0, 0);
        rig.headGroup.rotation.set(0, 0, 0);
        headAdapter.add(rig.headGroup);

        const headGroup = new THREE.Group();
        headGroup.rotation.y = Math.PI / 2;
        rig.headGroup.add(headGroup);

        const skullBaseNode = new THREE.Group();
        skullBaseNode.position.set(0, 0.03, 0.08);
        headGroup.add(skullBaseNode);
        bodySpineNodes.push({ node: skullBaseNode, rx: 0.115, ry: 0.145, yOff: 0 });

        const tubeRings = 44;
        const tubeSides = 28;
        const seamlessBodyGeo = new THREE.PlaneGeometry(1, 1, tubeSides, tubeRings - 1);
        const seamlessBodyMesh = registerSkin(new THREE.Mesh(seamlessBodyGeo, materials.bodyFur));
        quetzal.add(seamlessBodyMesh);

        const _wp = new THREE.Vector3();
        const _up = new THREE.Vector3();
        const _right = new THREE.Vector3();
        const _tangent = new THREE.Vector3();
        const _quat = new THREE.Quaternion();
        const _qQuetzalInv = new THREE.Quaternion();

        function updateContinuousBodySkin(breathPhase) {
            const centers = [];
            const upVectors = [];
            const radiiX = [];
            const radiiY = [];

            quetzal.getWorldQuaternion(_qQuetzalInv).invert();

            for (let i = 0; i < bodySpineNodes.length; i++) {
                const item = bodySpineNodes[i];
                item.node.getWorldPosition(_wp);
                const localPos = quetzal.worldToLocal(_wp.clone());

                item.node.getWorldQuaternion(_quat);
                _quat.premultiply(_qQuetzalInv);
                _up.set(0, 1, 0).applyQuaternion(_quat).normalize();

                let breathBoost = 0;
                if (i === 3 || i === 4) breathBoost = Math.sin(breathPhase) * 0.016;

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

                for (let s = 0; s <= tubeSides; s++) {
                    const u = s / tubeSides;
                    const theta = u * Math.PI * 2;

                    let xFactor = Math.sin(theta) * rx;
                    let yFactor = Math.cos(theta) * ry;

                    if (Math.cos(theta) > 0.6) {
                        yFactor += Math.pow(Math.cos(theta), 4) * ry * 0.14;
                    }
                    if (t > 0.18 && t < 0.42 && Math.cos(theta) < -0.2) {
                        xFactor *= 1.12;
                        yFactor *= 1.08;
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
        // 2C. CRÂNE SCULPTÉ, ROSTRE EN LANCE, FENÊTRE NASOANTORBITAIRE & CRÊTE SAGITTALE
        // =====================================================================
        function buildSculptedSkull() {
            const slices = [
                { z: -0.06, topY: 0.11, botY: -0.03, halfW: 0.085, fenestra: 0.0 },
                { z: 0.05,  topY: 0.16, botY: -0.04, halfW: 0.125, fenestra: 0.0 },
                { z: 0.22,  topY: 0.17, botY: -0.03, halfW: 0.115, fenestra: 0.25 },
                { z: 0.48,  topY: 0.15, botY: -0.02, halfW: 0.088, fenestra: 0.52 },
                { z: 0.85,  topY: 0.12, botY: -0.015, halfW: 0.068, fenestra: 0.35 },
                { z: 1.25,  topY: 0.09, botY: -0.01, halfW: 0.046, fenestra: 0.10 },
                { z: 1.68,  topY: 0.058, botY: -0.005, halfW: 0.026, fenestra: 0.0 },
                { z: 2.05,  topY: 0.028, botY: -0.002, halfW: 0.011, fenestra: 0.0 },
                { z: 2.26,  topY: 0.004, botY: 0.0,   halfW: 0.002, fenestra: 0.0 }
            ];

            const radialSteps = 28;
            const lengthSteps = 42;
            const geo = new THREE.PlaneGeometry(1, 1, radialSteps, lengthSteps);
            const pos = geo.attributes.position;
            const uvs = geo.attributes.uv;

            const zCurve = new THREE.CatmullRomCurve3(slices.map(s => new THREE.Vector3(s.halfW, s.topY, s.z)));
            const botCurve = new THREE.CatmullRomCurve3(slices.map(s => new THREE.Vector3(s.fenestra, s.botY, s.z)));

            let idx = 0;
            for (let iy = 0; iy <= lengthSteps; iy++) {
                const v = iy / lengthSteps;
                const pTop = zCurve.getPoint(v);
                const pBot = botCurve.getPoint(v);
                const halfW = pTop.x;
                const topY = pTop.y;
                const z = pTop.z;
                const fenestraDepth = pBot.x;
                const botY = pBot.y;

                for (let ix = 0; ix <= radialSteps; ix++) {
                    const u = ix / radialSteps;
                    const angle = u * Math.PI * 2;

                    const s = Math.sin(angle);
                    const c = Math.cos(angle);

                    let x = Math.sign(s) * Math.pow(Math.abs(s), 0.85) * halfW;
                    let y = c >= 0
                        ? botY + (topY - botY) * Math.pow(c, 0.75)
                        : botY + (c * 0.015 * (1 - v));

                    const sideFactor = Math.exp(-Math.pow(Math.abs(c) - 0.35, 2) * 12.0);
                    x *= (1.0 - fenestraDepth * sideFactor);

                    pos.setXYZ(idx, x, y, z);
                    uvs.setXY(idx, v, u);
                    idx++;
                }
            }
            geo.computeVertexNormals();
            const skullMesh = registerSkin(new THREE.Mesh(geo, materials.beakKeratin));
            headGroup.add(skullMesh);

            // Crête sagittale osseuse à double courbure
            const crestShape = new THREE.Shape();
            crestShape.moveTo(-0.06, 0.10);
            crestShape.bezierCurveTo(-0.18, 0.50, 0.22, 0.62, 0.52, 0.42);
            crestShape.bezierCurveTo(0.76, 0.26, 0.98, 0.15, 1.18, 0.09);
            crestShape.lineTo(0.05, 0.11);
            crestShape.closePath();

            const crestGeo = new THREE.ExtrudeGeometry(crestShape, {
                steps: 2,
                depth: 0.018,
                bevelEnabled: true,
                bevelThickness: 0.014,
                bevelSize: 0.014,
                bevelSegments: 5
            });
            crestGeo.rotateY(-Math.PI / 2);
            crestGeo.translate(0.009, 0.0, 0.06);
            const crestMesh = registerSkin(new THREE.Mesh(crestGeo, materials.crest));
            headGroup.add(crestMesh);

            headGroup.add(createBoneVisual(new THREE.Vector3(0, 0.05, 0), new THREE.Vector3(0, 0.01, 2.2), 0.038));
        }
        buildSculptedSkull();

        // Yeux réalistes avec cornée réfractive, anneau scléral et paupières clignantes
        const eyelids = [];
        [-1, 1].forEach(side => {
            const eyeSocket = new THREE.Group();
            eyeSocket.position.set(side * 0.102, 0.078, 0.14);
            eyeSocket.rotation.y = side * 0.28;
            headGroup.add(eyeSocket);

            const iris = new THREE.Mesh(new THREE.SphereGeometry(0.026, 16, 16), materials.eyeIris);
            eyeSocket.add(iris);

            const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.015, 12, 12), materials.eyePupil);
            pupil.scale.set(0.75, 1.1, 0.6);
            pupil.position.set(0, 0, 0.018);
            eyeSocket.add(pupil);

            const cornea = new THREE.Mesh(new THREE.SphereGeometry(0.0285, 18, 18), materials.eyeCornea);
            eyeSocket.add(cornea);

            const lidGeo = new THREE.SphereGeometry(0.030, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.52);
            const lid = registerSkin(new THREE.Mesh(lidGeo, materials.scalyPad));
            lid.rotation.x = -Math.PI * 0.45;
            eyeSocket.add(lid);
            eyelids.push(lid);

            const browGeo = createQuetzalCapsuleGeometry(0.014, 0.075, 6, 10);
            browGeo.rotateX(Math.PI / 2);
            const brow = registerSkin(new THREE.Mesh(browGeo, materials.beakKeratin));
            brow.position.set(0, 0.026, 0.005);
            brow.rotation.z = side * -0.2;
            eyeSocket.add(brow);
        });

        // Mâchoire inférieure articulée (Mandibule), cavité buccale, langue & poche gulaire
        const jawAdapter = new THREE.Group();
        jawAdapter.position.set(0, -0.028, 0.10);
        jawAdapter.rotation.y = -Math.PI / 2;
        headGroup.add(jawAdapter);

        rig.jaw.position.set(0, 0, 0);
        rig.jaw.rotation.set(0, 0, 0);
        jawAdapter.add(rig.jaw);

        const jawGroup = new THREE.Group();
        jawGroup.rotation.y = Math.PI / 2;
        rig.jaw.add(jawGroup);

        function buildSculptedMandible() {
            const mSlices = [
                { z: -0.04, topY: 0.01, botY: -0.045, halfW: 0.078 },
                { z: 0.15,  topY: 0.01, botY: -0.065, halfW: 0.068 },
                { z: 0.55,  topY: 0.005, botY: -0.058, halfW: 0.045 },
                { z: 1.10,  topY: 0.002, botY: -0.038, halfW: 0.026 },
                { z: 1.65,  topY: 0.0,   botY: -0.018, halfW: 0.011 },
                { z: 2.02,  topY: 0.0,   botY: -0.003, halfW: 0.002 }
            ];

            const rSteps = 20;
            const lSteps = 32;
            const geo = new THREE.PlaneGeometry(1, 1, rSteps, lSteps);
            const pos = geo.attributes.position;
            const uvs = geo.attributes.uv;
            const curve = new THREE.CatmullRomCurve3(mSlices.map(s => new THREE.Vector3(s.halfW, s.botY, s.z)));

            let idx = 0;
            for (let iy = 0; iy <= lSteps; iy++) {
                const v = iy / lSteps;
                const pt = curve.getPoint(v);
                const halfW = pt.x;
                const botY = pt.y;
                const z = pt.z;

                for (let ix = 0; ix <= rSteps; ix++) {
                    const u = ix / rSteps;
                    const angle = u * Math.PI * 2;
                    const s = Math.sin(angle);
                    const c = Math.cos(angle);

                    const x = Math.sign(s) * Math.pow(Math.abs(s), 0.85) * halfW;
                    const y = c <= 0
                        ? Math.pow(Math.abs(c), 0.72) * botY
                        : -c * 0.008 * (1 - v);

                    pos.setXYZ(idx, x, y, z);
                    uvs.setXY(idx, v, u);
                    idx++;
                }
            }
            geo.computeVertexNormals();
            jawGroup.add(registerSkin(new THREE.Mesh(geo, materials.beakKeratin)));

            const tongueGeo = new THREE.ConeGeometry(0.035, 0.95, 10);
            tongueGeo.scale(0.85, 0.35, 1);
            tongueGeo.rotateX(Math.PI / 2);
            tongueGeo.translate(0, 0.004, 0.52);
            jawGroup.add(registerSkin(new THREE.Mesh(tongueGeo, materials.oralMucosa)));

            const gularGeo = new THREE.ConeGeometry(0.095, 0.82, 14);
            gularGeo.scale(0.48, 0.85, 1);
            gularGeo.rotateX(Math.PI / 2 + 0.14);
            gularGeo.translate(0, -0.045, 0.38);
            const gularMesh = registerSkin(new THREE.Mesh(gularGeo, materials.crest));
            jawGroup.add(gularMesh);
            jawGroup.userData.gularMesh = gularMesh;
        }
        buildSculptedMandible();

        // =====================================================================
        // 2D. MEMBRES ANTÉRIEURS SCULPTÉS, OS PTÉROÏDE & PHALANGES ALAIRES
        // =====================================================================
        function buildWing(side) {
            const axis = side === 1 ? 'x' : '-x';
            const shoulder = new THREE.Group();
            shoulder.position.set(side * 0.35, 0.12, 0.56);
            torsoGroup.add(shoulder);

            // 1. Humérus (0.56m avec crête deltopectorale)
            const humLen = 0.56;
            const humMesh = createMuscularSegment(humLen, axis, (t, angle) => {
                const base = THREE.MathUtils.lerp(0.125, 0.082, t);
                const deltoCrest = Math.sin(t * Math.PI) * 0.038 * Math.max(0, Math.cos(angle));
                return { rx: base + deltoCrest, rz: base * 0.88 };
            }, materials.bodyFur);
            shoulder.add(humMesh);
            shoulder.add(createBoneVisual(new THREE.Vector3(0, 0, 0), new THREE.Vector3(side * humLen, 0, 0), 0.045));

            // 2. Coude -> Avant-bras (Radius & Ulna : 0.86m)
            const elbow = new THREE.Group();
            elbow.position.set(side * humLen, 0, 0);
            shoulder.add(elbow);

            const forearmLen = 0.86;
            const faMesh = createMuscularSegment(forearmLen, axis, (t) => {
                const belly = Math.sin(t * Math.PI * 0.85) * 0.022;
                const r = THREE.MathUtils.lerp(0.084, 0.062, t) + belly;
                return { rx: r * 0.85, rz: r * 1.1 };
            }, materials.limbSkin);
            elbow.add(faMesh);
            elbow.add(createBoneVisual(new THREE.Vector3(0, 0, 0), new THREE.Vector3(side * forearmLen, 0, 0), 0.038));

            // 3. Poignet + Os Ptéroïde (soutient le Propatagium) + Métacarpe IV allongé (1.16m)
            const wrist = new THREE.Group();
            wrist.position.set(side * forearmLen, 0, 0);
            elbow.add(wrist);

            const pteroidTip = new THREE.Group();
            pteroidTip.position.set(-side * 0.14, 0.01, 0.24);
            wrist.add(pteroidTip);
            wrist.add(createBoneVisual(new THREE.Vector3(0, 0, 0), pteroidTip.position.clone(), 0.015));

            const mcLen = 1.16;
            const mcMesh = createMuscularSegment(mcLen, axis, (t) => {
                const r = THREE.MathUtils.lerp(0.064, 0.048, t) + (t > 0.85 ? (t - 0.85) * 0.08 : 0);
                return { rx: r * 0.88, rz: r };
            }, materials.limbSkin);
            wrist.add(mcMesh);
            wrist.add(createBoneVisual(new THREE.Vector3(0, 0, 0), new THREE.Vector3(side * mcLen, 0, 0), 0.032));

            // 4. Articulation métacarpo-phalangienne (Knuckle + 3 doigts griffus I–III)
            const knuckle = new THREE.Group();
            knuckle.position.set(side * mcLen, 0, 0);
            wrist.add(knuckle);

            const digitsGroup = new THREE.Group();
            knuckle.add(digitsGroup);
            for (let d = 0; d < 3; d++) {
                const finger = new THREE.Group();
                finger.rotation.y = (d - 1) * 0.36;
                finger.rotation.x = 0.12;
                const fLen = 0.11 + d * 0.025;
                const fGeo = createQuetzalCapsuleGeometry(0.016, fLen, 6, 10);
                fGeo.rotateX(Math.PI / 2);
                fGeo.translate(0, 0, fLen / 2);
                finger.add(registerSkin(new THREE.Mesh(fGeo, materials.scalyPad)));

                const cGeo = new THREE.ConeGeometry(0.016, 0.085, 10);
                cGeo.rotateX(Math.PI / 2 + 0.28);
                cGeo.translate(0, -0.01, fLen + 0.035);
                finger.add(registerSkin(new THREE.Mesh(cGeo, materials.claw)));
                digitsGroup.add(finger);
            }

            // 5. 4e Doigt Alaire Géant (Phalanges 1 à 4)
            const phalanx1 = new THREE.Group();
            knuckle.add(phalanx1);
            const p1Len = 1.36;
            const p1Mesh = createMuscularSegment(p1Len, axis, (t) => {
                const r = THREE.MathUtils.lerp(0.052, 0.036, t);
                return { rx: r * 0.78, rz: r * 1.15 };
            }, materials.beakKeratin);
            phalanx1.add(p1Mesh);
            phalanx1.add(createBoneVisual(new THREE.Vector3(0, 0, 0), new THREE.Vector3(side * p1Len, 0, 0), 0.026));

            const phalanx2 = new THREE.Group();
            phalanx2.position.set(side * p1Len, 0, 0);
            phalanx1.add(phalanx2);
            const p2Len = 0.96;
            const p2Mesh = createMuscularSegment(p2Len, axis, (t) => {
                const r = THREE.MathUtils.lerp(0.036, 0.022, t);
                return { rx: r * 0.78, rz: r * 1.12 };
            }, materials.beakKeratin);
            phalanx2.add(p2Mesh);
            phalanx2.add(createBoneVisual(new THREE.Vector3(0, 0, 0), new THREE.Vector3(side * p2Len, 0, 0), 0.018));

            const phalanx3 = new THREE.Group();
            phalanx3.position.set(side * p2Len, 0, 0);
            phalanx2.add(phalanx3);
            const p3Len = 0.74;
            const p3Mesh = createMuscularSegment(p3Len, axis, (t) => {
                const r = THREE.MathUtils.lerp(0.022, 0.004, t);
                return { rx: r * 0.8, rz: r, offsetZ: -Math.pow(t, 2) * 0.09 };
            }, materials.beakKeratin);
            phalanx3.add(p3Mesh);
            phalanx3.add(createBoneVisual(new THREE.Vector3(0, 0, 0), new THREE.Vector3(side * p3Len, 0, -0.08), 0.012));

            const wingTip = new THREE.Group();
            wingTip.position.set(side * p3Len, 0, -0.09);
            phalanx3.add(wingTip);

            return {
                side,
                shoulder,
                elbow,
                wrist,
                pteroidTip,
                knuckle,
                digitsGroup,
                phalanx1,
                phalanx2,
                phalanx3,
                wingTip
            };
        }

        const leftWing = buildWing(1);
        const rightWing = buildWing(-1);

        // =====================================================================
        // 2E. MEMBRES POSTÉRIEURS SCULPTÉS & PIEDS PLANTIGRADES À 4 ORTEILS
        // =====================================================================
        function buildLeg(side) {
            const hip = new THREE.Group();
            hip.position.set(side * 0.23, -0.06, -0.72);
            torsoGroup.add(hip);

            // Fémur (0.68m)
            const femLen = 0.68;
            const femMesh = createMuscularSegment(femLen, '-y', (t) => {
                const thighBulge = Math.sin(t * Math.PI * 0.8) * 0.024;
                const r = THREE.MathUtils.lerp(0.092, 0.054, t) + thighBulge;
                return { rx: r * 0.86, rz: r * 1.15 };
            }, materials.bodyFur);
            hip.add(femMesh);
            hip.add(createBoneVisual(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -femLen, 0), 0.032));

            // Genou -> Tibiotarse (1.06m avec galbe du gastrocnémien)
            const knee = new THREE.Group();
            knee.position.set(0, -femLen, 0);
            hip.add(knee);

            const tibLen = 1.06;
            const tibMesh = createMuscularSegment(tibLen, '-y', (t) => {
                const calf = Math.exp(-Math.pow(t - 0.25, 2) * 18) * 0.02;
                const r = THREE.MathUtils.lerp(0.054, 0.032, t) + calf;
                return { rx: r * 0.88, rz: r * 1.08 };
            }, materials.limbSkin);
            knee.add(tibMesh);
            knee.add(createBoneVisual(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -tibLen, 0), 0.024));

            // Cheville -> Pied plantigrade à 4 orteils griffus
            const ankle = new THREE.Group();
            ankle.position.set(0, -tibLen, 0);
            knee.add(ankle);

            const heelGeo = createQuetzalCapsuleGeometry(0.034, 0.14, 6, 10);
            heelGeo.rotateX(Math.PI / 2);
            heelGeo.translate(0, -0.02, 0.06);
            ankle.add(registerSkin(new THREE.Mesh(heelGeo, materials.scalyPad)));

            for (let t = 0; t < 4; t++) {
                const spread = (t - 1.5) * 0.18;
                const toeGroup = new THREE.Group();
                toeGroup.rotation.y = spread;
                ankle.add(toeGroup);

                const toeLen = 0.21 + (t === 1 || t === 2 ? 0.04 : 0);
                const tGeo = createQuetzalCapsuleGeometry(0.013, toeLen, 5, 8);
                tGeo.rotateX(Math.PI / 2);
                tGeo.translate(0, -0.022, 0.08 + toeLen / 2);
                toeGroup.add(registerSkin(new THREE.Mesh(tGeo, materials.scalyPad)));

                const cGeo = new THREE.ConeGeometry(0.013, 0.065, 8);
                cGeo.rotateX(Math.PI / 2 + 0.22);
                cGeo.translate(0, -0.026, 0.09 + toeLen + 0.025);
                toeGroup.add(registerSkin(new THREE.Mesh(cGeo, materials.claw)));
            }

            return { side, hip, knee, ankle };
        }

        const leftLeg = buildLeg(1);
        const rightLeg = buildLeg(-1);

        // =====================================================================
        // 3. MEMBRANES ALAIRES DYNAMIQUES EN 3 PARTIES (BRACHIO- & PROPATAGIUM)
        // =====================================================================
        function createDynamicMembrane(cols = 24, rows = 10) {
            const geo = new THREE.PlaneGeometry(1, 1, cols - 1, rows - 1);
            const mesh = new THREE.Mesh(geo, materials.wingMembrane);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            skinMeshes.push(mesh);
            quetzal.add(mesh);
            return { geo, cols, rows };
        }

        const leftBrachio = createDynamicMembrane(26, 10);
        const rightBrachio = createDynamicMembrane(26, 10);
        const leftPropatagium = createDynamicMembrane(10, 6);
        const rightPropatagium = createDynamicMembrane(10, 6);

        const tempVec = new THREE.Vector3();
        function getLocalJointPos(obj) {
            obj.getWorldPosition(tempVec);
            return quetzal.worldToLocal(tempVec.clone());
        }

        function updateWingMembranes(brachio, propat, wing, leg, time, isSoaring) {
            const pShoulder = getLocalJointPos(wing.shoulder);
            const pElbow = getLocalJointPos(wing.elbow);
            const pWrist = getLocalJointPos(wing.wrist);
            const pPteroid = getLocalJointPos(wing.pteroidTip);
            const pKnuckle = getLocalJointPos(wing.knuckle);
            const pP2 = getLocalJointPos(wing.phalanx2);
            const pP3 = getLocalJointPos(wing.phalanx3);
            const pTip = getLocalJointPos(wing.wingTip);

            const pHipAnchor = getLocalJointPos(leg.hip).add(new THREE.Vector3(wing.side * 0.08, 0.04, 0.12));
            const pAnkleAnchor = getLocalJointPos(leg.knee).lerp(getLocalJointPos(leg.ankle), 0.72);

            const leadingPoints = [pShoulder, pElbow, pWrist, pKnuckle, pP2, pP3, pTip];
            const trailingPoints = [
                pHipAnchor,
                pAnkleAnchor,
                pAnkleAnchor.clone().lerp(pKnuckle, 0.44).add(new THREE.Vector3(0, -0.03, -0.28)),
                pKnuckle.clone().add(new THREE.Vector3(0, -0.04, -0.52)),
                pP2.clone().add(new THREE.Vector3(0, -0.02, -0.32)),
                pP3.clone().add(new THREE.Vector3(0, -0.01, -0.15)),
                pTip
            ];

            const leadCurve = new THREE.CatmullRomCurve3(leadingPoints);
            const trailCurve = new THREE.CatmullRomCurve3(trailingPoints);

            const posAttr = brachio.geo.attributes.position;
            let idx = 0;
            for (let r = 0; r < brachio.rows; r++) {
                const v = r / (brachio.rows - 1);
                for (let c = 0; c < brachio.cols; c++) {
                    const u = c / (brachio.cols - 1);
                    const pLead = leadCurve.getPoint(u);
                    const pTrail = trailCurve.getPoint(u);

                    const pt = pLead.clone().lerp(pTrail, v);
                    const camber = Math.sin(v * Math.PI) * Math.sin(u * Math.PI) * 0.11;
                    const flutter = isSoaring
                        ? Math.sin(time * 14 - u * 9) * Math.pow(v, 2) * 0.016
                        : 0;
                    pt.y += camber + flutter;

                    posAttr.setXYZ(idx, pt.x, pt.y, pt.z);
                    idx++;
                }
            }
            posAttr.needsUpdate = true;
            brachio.geo.computeVertexNormals();

            const proLead = new THREE.CatmullRomCurve3([
                pShoulder.clone().add(new THREE.Vector3(0, 0, 0.12)),
                pPteroid,
                pWrist
            ]);
            const proTrail = new THREE.CatmullRomCurve3([pShoulder, pElbow, pWrist]);
            const proPos = propat.geo.attributes.position;
            let pIdx = 0;
            for (let r = 0; r < propat.rows; r++) {
                const v = r / (propat.rows - 1);
                for (let c = 0; c < propat.cols; c++) {
                    const u = c / (propat.cols - 1);
                    const pt = proLead.getPoint(u).lerp(proTrail.getPoint(u), v);
                    pt.y += Math.sin(v * Math.PI) * 0.025;
                    proPos.setXYZ(pIdx, pt.x, pt.y, pt.z);
                    pIdx++;
                }
            }
            proPos.needsUpdate = true;
            propat.geo.computeVertexNormals();
        }

        // =====================================================================
        // 4. MOTEUR DE POSES BIOMÉCANIQUES (SOAR, WALK, DISPLAY, ANATOMY, IDLE)
        // =====================================================================
        const qRig = {
            quetzal,
            rootJoint,
            torsoGroup,
            neckSegments,
            headGroup,
            jawGroup,
            leftWing,
            rightWing,
            leftLeg,
            rightLeg,
            eyelids,
            gularMesh: jawGroup.userData.gularMesh,
            skeletonMeshes,
            materials,
            currentMode: 'walk',
            poseUpdatedThisFrame: false
        };

        // Helper pour orienter la tête et la mâchoire selon la convention du modèle HTML (+Z avant)
        function setQuetzalHeadRot(rx, ry, rz) {
            rig.headGroup.rotation.set(rz || 0, ry || 0, -(rx || 0));
        }

        function setQuetzalJawRot(rx) {
            rig.jaw.rotation.set(0, 0, -(rx || 0));
        }

        qRig.setHeadRot = setQuetzalHeadRot;
        qRig.setJawRot = setQuetzalJawRot;

        function applyPoseMode(mode, t, opts = {}) {
            qRig.currentMode = mode;
            qRig.poseUpdatedThisFrame = true;

            if (mode === 'soar') {
                // --- MODE 1 : VOL THERMIQUE PLANÉ & BATTU (SOAR) ---
                const flapFreq = opts.flapFreq || 2.0;
                const flapAmp = opts.flapAmp !== undefined ? opts.flapAmp : 1.0;
                const flap = Math.sin(t * flapFreq) * flapAmp;
                const flapDelayed = Math.sin(t * flapFreq - 0.55) * flapAmp;
                const flapTip = Math.sin(t * flapFreq - 1.1) * flapAmp;

                const baseY = opts.rootY !== undefined ? opts.rootY : 1.98;
                rootJoint.position.set(0, baseY - flap * 0.22, 0);
                rootJoint.rotation.set(0.05 + Math.cos(t * flapFreq) * 0.03, 0, Math.sin(t * 0.65) * 0.075);

                neckSegments.forEach((seg, i) => {
                    seg.rotation.set(
                        i === 0 ? 0.14 : -0.02 + Math.sin(t * flapFreq + i * 0.2) * 0.012,
                        Math.sin(t * 0.75) * 0.035,
                        0
                    );
                });
                setQuetzalHeadRot(-0.08, Math.sin(t * 0.75) * 0.08, 0);
                setQuetzalJawRot(0.02);

                [leftWing, rightWing].forEach(w => {
                    const s = w.side;
                    w.shoulder.rotation.set(0, -s * 0.08, s * flap * 0.34);
                    w.elbow.rotation.set(0, s * 0.16, s * flapDelayed * 0.22);
                    w.wrist.rotation.set(0, -s * 0.12, s * flapDelayed * 0.15);
                    w.knuckle.rotation.set(0, -s * 0.15, s * flapTip * 0.18);
                    w.phalanx1.rotation.set(0, 0, 0);
                    w.phalanx2.rotation.set(0, -s * 0.06, s * flapTip * 0.12);
                    w.phalanx3.rotation.set(0, -s * 0.08, s * flapTip * 0.1);
                });

                [leftLeg, rightLeg].forEach(l => {
                    l.hip.rotation.set(Math.PI * 0.46, 0, -l.side * 0.32);
                    l.knee.rotation.set(0.08, 0, 0);
                    l.ankle.rotation.set(0.85, 0, 0);
                });

            } else if (mode === 'walk' || mode === 'idle') {
                // --- MODE 2 : TRAQUE QUADRUPÈDE TERRESTRE (WALK / IDLE) ---
                const isIdle = mode === 'idle';
                const strideSpeed = opts.strideSpeed || 2.5;
                const lPhase = t * strideSpeed;
                const rPhase = lPhase + Math.PI;
                const strideAmp = isIdle ? 0.0 : (opts.strideAmp !== undefined ? opts.strideAmp : 1.0);

                const breathBob = isIdle ? Math.sin(t * 2.2) * 0.03 : Math.abs(Math.sin(lPhase)) * 0.055 * strideAmp;
                rootJoint.position.set(0, 1.98 + breathBob, 0);
                rootJoint.rotation.set(
                    -0.68 + (isIdle ? Math.sin(t * 2.2) * 0.015 : 0),
                    isIdle ? Math.sin(t * 1.1) * 0.015 : Math.sin(lPhase) * 0.03 * strideAmp,
                    isIdle ? 0 : Math.cos(lPhase) * 0.028 * strideAmp
                );

                neckSegments.forEach((seg, i) => {
                    let rx = 0.14;
                    if (i === 0) rx = -0.58;
                    else if (i < 4) rx = -0.08;
                    rx += Math.sin(t * 1.8 + i * 0.35) * 0.012;
                    seg.rotation.set(rx, Math.sin(t * 1.1) * 0.04, 0);
                });

                setQuetzalHeadRot(
                    0.92 + Math.sin(t * (isIdle ? 1.8 : 2.5)) * 0.04,
                    Math.sin(t * 1.1) * 0.12,
                    0
                );
                setQuetzalJawRot(0.04 + Math.max(0, Math.sin(t * (isIdle ? 1.6 : 3.2))) * (isIdle ? 0.05 : 0.10));

                [leftWing, rightWing].forEach(w => {
                    const s = w.side;
                    const phase = s === 1 ? lPhase : rPhase;
                    const swing = Math.sin(phase) * 0.24 * strideAmp;
                    const lift = Math.max(0, Math.cos(phase)) * 0.18 * strideAmp;
                    const idleBreath = isIdle ? Math.sin(t * 2.2) * 0.02 : 0;

                    w.shoulder.rotation.set(0.68 + swing, -s * 0.25, -s * 1.18 + s * (lift * 0.3 + idleBreath));
                    w.elbow.rotation.set(0, 0, -s * 0.22 - s * lift * 0.4);
                    w.wrist.rotation.set(0, 0, s * 0.08);

                    w.knuckle.rotation.set(0, s * 1.38, s * 1.95);
                    w.phalanx1.rotation.set(0, 0, 0);
                    w.phalanx2.rotation.set(0, 0, s * 0.12);
                    w.phalanx3.rotation.set(0, 0, s * 0.12);
                });

                [leftLeg, rightLeg].forEach(l => {
                    const s = l.side;
                    const phase = s === 1 ? rPhase : lPhase;
                    const swing = Math.sin(phase) * 0.28 * strideAmp;
                    const kneeBend = Math.max(0, Math.cos(phase)) * 0.35 * strideAmp;

                    l.hip.rotation.set(0.55 + swing, 0, 0);
                    l.knee.rotation.set(0.22 + kneeBend, 0, 0);
                    l.ankle.rotation.set(-0.12 - swing * 0.5, 0, 0);
                });

            } else if (mode === 'display') {
                // --- MODE 3 : APPEL TERRITORIAL / PARADE D'INTIMIDATION (DISPLAY) ---
                const callWave = Math.sin(t * 2.8);

                rootJoint.position.set(0, 2.12, 0);
                rootJoint.rotation.set(-0.78, 0, 0);

                neckSegments.forEach((seg, i) => {
                    const rx = i === 0 ? -0.62 : (-0.06 + callWave * 0.025);
                    seg.rotation.set(rx, Math.sin(t * 1.5) * 0.03, 0);
                });

                setQuetzalHeadRot(0.45 - Math.max(0, callWave) * 0.35, Math.sin(t * 1.5) * 0.08, 0);
                setQuetzalJawRot(0.22 + Math.max(0, callWave) * 0.38);

                [leftWing, rightWing].forEach(w => {
                    const s = w.side;
                    w.shoulder.rotation.set(0.45, -s * 0.25, -s * 0.28 + s * callWave * 0.12);
                    w.elbow.rotation.set(0, s * 0.2, s * 0.35);
                    w.wrist.rotation.set(0, -s * 0.1, -s * 0.35);
                    w.knuckle.rotation.set(0, -s * 0.15, -s * 0.45 + s * callWave * 0.15);
                    w.phalanx1.rotation.set(0, 0, 0);
                    w.phalanx2.rotation.set(0, 0, -s * 0.15);
                    w.phalanx3.rotation.set(0, 0, -s * 0.1);
                });

                [leftLeg, rightLeg].forEach(l => {
                    l.hip.rotation.set(0.68, 0, -l.side * 0.06);
                    l.knee.rotation.set(0.16, 0, 0);
                    l.ankle.rotation.set(-0.08, 0, 0);
                });

            } else if (mode === 'anatomy') {
                // --- MODE 4 : ENVERGURE DORSALE COMPLÈTE (ANATOMY) ---
                rootJoint.position.set(0, 2.15, 0);
                rootJoint.rotation.set(0, 0, 0);

                neckSegments.forEach(seg => {
                    seg.rotation.set(0, 0, 0);
                });
                setQuetzalHeadRot(0, 0, 0);
                setQuetzalJawRot(0.08);

                [leftWing, rightWing].forEach(w => {
                    const s = w.side;
                    w.shoulder.rotation.set(0, 0, 0);
                    w.elbow.rotation.set(0, 0, 0);
                    w.wrist.rotation.set(0, 0, 0);
                    w.knuckle.rotation.set(0, -s * 0.08, 0);
                    w.phalanx1.rotation.set(0, 0, 0);
                    w.phalanx2.rotation.set(0, -s * 0.04, 0);
                    w.phalanx3.rotation.set(0, -s * 0.04, 0);
                });

                [leftLeg, rightLeg].forEach(l => {
                    l.hip.rotation.set(Math.PI * 0.42, 0, -l.side * 0.22);
                    l.knee.rotation.set(0, 0, 0);
                    l.ankle.rotation.set(0.8, 0, 0);
                });
            }
        }

        function resetQuetzalPose(time) {
            rig.torso.rotation.set(0, 0, 0);
            rig.neck.rotation.set(0, 0, 0);
            if (rig.arms[0]) rig.arms[0].rotation.set(0, 0, 0);
            if (rig.arms[1]) rig.arms[1].rotation.set(0, 0, 0);
            if (rig.legs[0]) rig.legs[0].rotation.set(0, 0, 0);
            if (rig.legs[1]) rig.legs[1].rotation.set(0, 0, 0);
            applyPoseMode('idle', time || 0);
            qRig.poseUpdatedThisFrame = false;
        }

        function updateAnatomicalSkin(time, fighter, modeOverride) {
            const t = time || 0;
            const breathPhase = t * 2.4;

            // Clignement périodique des paupières & respiration de la poche gulaire
            const blinkCycle = ((t % 4.8) + 4.8) % 4.8;
            const blinkAmt = blinkCycle < 0.16 ? Math.sin((blinkCycle / 0.16) * Math.PI) : 0;
            eyelids.forEach(lid => {
                lid.rotation.x = -Math.PI * 0.45 + blinkAmt * 0.95;
            });
            if (jawGroup.userData.gularMesh) {
                jawGroup.userData.gularMesh.scale.y = 0.85 + Math.sin(breathPhase) * 0.08;
            }

            // Si combat_reactions.js a pris la main (hitstun, garde, knockdown, X-ray), adapter la posture
            if (!qRig.poseUpdatedThisFrame && fighter) {
                if (fighter.isBlocking && fighter.blockType === 'high') {
                    applyPoseMode('display', t);
                    qRig.poseUpdatedThisFrame = false;
                } else if (fighter.isFlying) {
                    applyPoseMode('soar', t);
                    qRig.poseUpdatedThisFrame = false;
                }
            }

            // Propager les rotations génériques éventuelles (combat_reactions, sprint, etc.) sur les 7 vertèbres et membres
            if (Math.abs(rig.neck.rotation.z) > 0.001 || Math.abs(rig.neck.rotation.y) > 0.001) {
                const pitchPerSeg = -rig.neck.rotation.z / neckSegments.length;
                const yawPerSeg = rig.neck.rotation.y / neckSegments.length;
                neckSegments.forEach(seg => {
                    seg.rotation.x += pitchPerSeg;
                    seg.rotation.y += yawPerSeg;
                });
                rig.neck.rotation.set(0, 0, 0);
            }
            if (!qRig.poseUpdatedThisFrame) {
                if (rig.legs[0] && Math.abs(rig.legs[0].rotation.z) > 0.001) {
                    leftLeg.hip.rotation.x -= rig.legs[0].rotation.z * 0.45;
                    leftLeg.knee.rotation.x += Math.max(0, rig.legs[0].rotation.z) * 0.35;
                }
                if (rig.legs[1] && Math.abs(rig.legs[1].rotation.z) > 0.001) {
                    rightLeg.hip.rotation.x -= rig.legs[1].rotation.z * 0.45;
                    rightLeg.knee.rotation.x += Math.max(0, rig.legs[1].rotation.z) * 0.35;
                }
                if (rig.arms[0] && Math.abs(rig.arms[0].rotation.z) > 0.001) {
                    leftWing.shoulder.rotation.x -= rig.arms[0].rotation.z * 0.35;
                }
                if (rig.arms[1] && Math.abs(rig.arms[1].rotation.z) > 0.001) {
                    rightWing.shoulder.rotation.x -= rig.arms[1].rotation.z * 0.35;
                }
            }

            // Synchroniser l'affichage du squelette interne X-Ray du modèle
            const isXray = Boolean(fighter && fighter.isXrayTarget);
            skeletonMeshes.forEach(m => { m.visible = isXray; });
            if (!isXray) {
                materials.wingMembrane.transparent = true;
                materials.wingMembrane.opacity = 0.98;
            }

            const effectiveMode = modeOverride || qRig.currentMode;
            const isSoaring = effectiveMode === 'soar' || Boolean(fighter && fighter.isFlying);

            // Mettre à jour les matrices mondiales avant de calculer le maillage continu et les patagia
            quetzal.updateMatrixWorld(true);
            updateContinuousBodySkin(breathPhase);
            updateWingMembranes(leftBrachio, leftPropatagium, leftWing, leftLeg, t, isSoaring);
            updateWingMembranes(rightBrachio, rightPropatagium, rightWing, rightLeg, t, isSoaring);
        }

        rig.specialParts.qRig = qRig;
        rig.specialParts.applyPoseMode = applyPoseMode;
        rig.specialParts.resetQuetzalPose = resetQuetzalPose;
        rig.specialParts.updateAnatomicalSkin = updateAnatomicalSkin;

        // Initialiser la pose par défaut et générer le maillage continu initial
        applyPoseMode('idle', 0);
        updateAnatomicalSkin(0, null, 'idle');

        // =====================================================================
        // 5. INDICATEUR D'ENDURANCE DE VOL CIRCULAIRE (Roue d'endurance de 2 secondes)
        // =====================================================================
        const gaugeCanvas = document.createElement('canvas');
        gaugeCanvas.width = 256;
        gaugeCanvas.height = 256;
        const gCtx = gaugeCanvas.getContext('2d');
        const gaugeTexture = new THREE.CanvasTexture(gaugeCanvas);
        gaugeTexture.minFilter = THREE.LinearFilter;
        gaugeTexture.magFilter = THREE.LinearFilter;

        const gaugeMat = new THREE.SpriteMaterial({
            map: gaugeTexture,
            transparent: true,
            opacity: 0.0,
            depthTest: false
        });
        const enduranceSprite = new THREE.Sprite(gaugeMat);
        enduranceSprite.scale.set(1.5, 1.5, 1.5);
        enduranceSprite.position.set(0, 5.1, 0); // Flotte au-dessus de la crête du Quetzalcoatlus
        rig.root.add(enduranceSprite);

        let lastDrawnPct = -1;
        let currentOpacity = 0.0;

        rig.specialParts.flightEnduranceGauge = enduranceSprite;
        rig.specialParts.updateEnduranceCircle = (endurance, isFlying, delta) => {
            const maxEnd = 2.0;
            const pct = Math.max(0, Math.min(1.0, endurance / maxEnd));

            const targetOpacity = (isFlying || pct < 0.98) ? 1.0 : 0.0;
            currentOpacity += (targetOpacity - currentOpacity) * Math.min(1.0, delta * 8);
            gaugeMat.opacity = currentOpacity;
            if (currentOpacity < 0.02) {
                enduranceSprite.visible = false;
                return;
            }
            enduranceSprite.visible = true;

            if (Math.abs(pct - lastDrawnPct) > 0.005 || isFlying) {
                lastDrawnPct = pct;
                const size = 256;
                const cx = size / 2;
                const cy = size / 2;
                const radius = 86;
                const strokeW = 18;

                gCtx.clearRect(0, 0, size, size);

                gCtx.beginPath();
                gCtx.arc(cx, cy, radius + strokeW * 0.75, 0, Math.PI * 2);
                gCtx.fillStyle = 'rgba(10, 15, 26, 0.82)';
                gCtx.fill();

                gCtx.beginPath();
                gCtx.arc(cx, cy, radius, 0, Math.PI * 2);
                gCtx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
                gCtx.lineWidth = strokeW;
                gCtx.lineCap = 'round';
                gCtx.stroke();

                if (pct > 0.001) {
                    const startAngle = -Math.PI / 2;
                    const endAngle = startAngle + (Math.PI * 2 * pct);

                    gCtx.beginPath();
                    gCtx.arc(cx, cy, radius, startAngle, endAngle, false);

                    let color = '#38bdf8';
                    let glowColor = 'rgba(56, 189, 248, 0.9)';
                    if (pct > 0.55) {
                        color = '#38bdf8';
                        glowColor = 'rgba(56, 189, 248, 0.9)';
                    } else if (pct > 0.25) {
                        color = '#fbbf24';
                        glowColor = 'rgba(251, 191, 36, 0.9)';
                    } else {
                        color = '#f87171';
                        glowColor = 'rgba(248, 113, 113, 1.0)';
                    }

                    gCtx.shadowColor = glowColor;
                    gCtx.shadowBlur = 16;
                    gCtx.strokeStyle = color;
                    gCtx.lineWidth = strokeW;
                    gCtx.lineCap = 'round';
                    gCtx.stroke();
                    gCtx.shadowBlur = 0;
                }

                gCtx.fillStyle = pct <= 0.25 ? '#f87171' : '#ffffff';
                gCtx.font = 'bold 38px sans-serif';
                gCtx.textAlign = 'center';
                gCtx.textBaseline = 'middle';
                const secText = `${(endurance).toFixed(1)}s`;
                gCtx.fillText(secText, cx, cy - 6);

                gCtx.font = 'bold 20px sans-serif';
                gCtx.fillStyle = '#38bdf8';
                gCtx.fillText('VOL', cx, cy + 32);

                for (let i = 0; i < 4; i++) {
                    const angle = -Math.PI / 2 + (i * Math.PI / 2);
                    const tx1 = cx + Math.cos(angle) * (radius - strokeW * 0.7);
                    const ty1 = cy + Math.sin(angle) * (radius - strokeW * 0.7);
                    const tx2 = cx + Math.cos(angle) * (radius + strokeW * 0.7);
                    const ty2 = cy + Math.sin(angle) * (radius + strokeW * 0.7);
                    gCtx.beginPath();
                    gCtx.moveTo(tx1, ty1);
                    gCtx.lineTo(tx2, ty2);
                    gCtx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
                    gCtx.lineWidth = 3;
                    gCtx.stroke();
                }

                gaugeTexture.needsUpdate = true;
            }
        };
    },
});
