// ============================================================================
// js/core/arena.js — Relief Topographique 3D, Textures PBR Stylisées "Cartoon Mature"
// & Socles Géologiques Sculptés (Validés avec Blender 5.2.3)
// ============================================================================

const _cachedArenaStageMaps = {};

function getArenaStagePBRMaps(arenaType, floorColor, accentColor) {
    const cacheKey = `${arenaType}_${floorColor}_${accentColor}`;
    if (_cachedArenaStageMaps[cacheKey]) return _cachedArenaStageMaps[cacheKey];

    const size = 512;
    const colorCanvas = document.createElement('canvas');
    const bumpCanvas = document.createElement('canvas');
    colorCanvas.width = bumpCanvas.width = size;
    colorCanvas.height = bumpCanvas.height = size;
    const cCtx = colorCanvas.getContext('2d');
    const bCtx = bumpCanvas.getContext('2d');

    const baseCol = new THREE.Color(floorColor);
    const accCol = new THREE.Color(accentColor);
    const darkCol = baseCol.clone().multiplyScalar(0.45);
    const midCol = baseCol.clone().multiplyScalar(1.15);

    cCtx.fillStyle = `#${baseCol.getHexString()}`;
    cCtx.fillRect(0, 0, size, size);
    bCtx.fillStyle = '#808080';
    bCtx.fillRect(0, 0, size, size);

    let seed = (floorColor ^ accentColor) & 0x7fffffff || 42;
    const rand = () => {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
    };

    // Dalles rocheuses stylisées "Comic / Primal" à contours marqués et fissures d'accent
    const cols = 10;
    const rows = 10;
    const cw = size / cols;
    const ch = size / rows;

    for (let gy = -1; gy <= rows; gy++) {
        for (let gx = -1; gx <= cols; gx++) {
            const cx = (gx + 0.25 + rand() * 0.5) * cw;
            const cy = (gy + 0.25 + rand() * 0.5) * ch;
            const rx = cw * (0.44 + rand() * 0.26);
            const ry = ch * (0.44 + rand() * 0.26);
            const sides = 5 + Math.floor(rand() * 3);
            const rot = rand() * Math.PI * 2;

            cCtx.beginPath();
            bCtx.beginPath();
            for (let s = 0; s < sides; s++) {
                const a = rot + (s / sides) * Math.PI * 2;
                const rMod = 0.8 + rand() * 0.35;
                const px = cx + Math.cos(a) * rx * rMod;
                const py = cy + Math.sin(a) * ry * rMod;
                if (s === 0) {
                    cCtx.moveTo(px, py);
                    bCtx.moveTo(px, py);
                } else {
                    cCtx.lineTo(px, py);
                    bCtx.lineTo(px, py);
                }
            }
            cCtx.closePath();
            bCtx.closePath();

            const shade = rand();
            const tileCol = baseCol.clone();
            if (shade > 0.68) tileCol.lerp(accCol, 0.22);
            else if (shade < 0.32) tileCol.lerp(darkCol, 0.45);
            else tileCol.copy(midCol);

            cCtx.fillStyle = `#${tileCol.getHexString()}`;
            cCtx.fill();

            // Contour encré mature (style bande dessinée / cel-shaded)
            cCtx.strokeStyle = `#${darkCol.getHexString()}`;
            cCtx.lineWidth = 3.5;
            cCtx.stroke();

            // Biseau interne lumineux
            cCtx.strokeStyle = `rgba(255,255,255,0.12)`;
            cCtx.lineWidth = 1.4;
            cCtx.stroke();

            const bLum = Math.floor(120 + shade * 95);
            bCtx.fillStyle = `rgb(${bLum},${bLum},${bLum})`;
            bCtx.fill();
            bCtx.strokeStyle = '#222222';
            bCtx.lineWidth = 4.0;
            bCtx.stroke();
        }
    }

    // Veines telluriques / fissures lumineuses d'accentuation selon le biome
    for (let i = 0; i < 18; i++) {
        let vx = rand() * size;
        let vy = rand() * size;
        cCtx.beginPath();
        bCtx.beginPath();
        cCtx.moveTo(vx, vy);
        bCtx.moveTo(vx, vy);
        for (let seg = 0; seg < 5; seg++) {
            vx += (rand() - 0.5) * 65;
            vy += (rand() - 0.5) * 65;
            cCtx.lineTo(vx, vy);
            bCtx.lineTo(vx, vy);
        }
        cCtx.strokeStyle = `#${accCol.getHexString()}`;
        cCtx.lineWidth = 1.8 + rand() * 1.6;
        cCtx.globalAlpha = 0.42;
        cCtx.stroke();
        cCtx.globalAlpha = 1.0;

        bCtx.strokeStyle = '#141414';
        bCtx.lineWidth = 3.0;
        bCtx.stroke();
    }

    const colorMap = new THREE.CanvasTexture(colorCanvas);
    const bumpMap = new THREE.CanvasTexture(bumpCanvas);
    colorMap.wrapS = colorMap.wrapT = bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping;
    colorMap.repeat.set(5, 2);
    bumpMap.repeat.set(5, 2);
    if (THREE.SRGBColorSpace) colorMap.colorSpace = THREE.SRGBColorSpace;
    else if (THREE.sRGBEncoding) colorMap.encoding = THREE.sRGBEncoding;

    _cachedArenaStageMaps[cacheKey] = { colorMap, bumpMap };
    return _cachedArenaStageMaps[cacheKey];
}

function getArenaGroundHeight(arenaType, x, z = 0) {
    const key = arenaType || (typeof currentArena !== 'undefined' ? currentArena : 'volcano');
    const arena = (typeof ARENAS !== 'undefined' && (ARENAS[key] || ARENAS['volcano'])) || null;
    const bound = (arena && arena.stageBound) ? arena.stageBound : 16;
    const clampedX = Math.max(-bound, Math.min(bound, x || 0));
    if (arena && typeof arena.getGroundHeight === 'function') {
        return arena.getGroundHeight(clampedX, z);
    }
    return Math.sin(clampedX * 0.35) * 0.28 + Math.cos(clampedX * 0.18) * 0.15;
}

function getArenaPlatforms(arenaType) {
    const key = arenaType || (typeof currentArena !== 'undefined' ? currentArena : 'volcano');
    const arena = (typeof ARENAS !== 'undefined' && (ARENAS[key] || ARENAS['volcano'])) || null;
    return (arena && Array.isArray(arena.platforms)) ? arena.platforms : [];
}

function getPlatformSurfaceY(plat, x) {
    if (!plat) return 0;
    return plat.y || 0;
}

function getFighterSupportHeight(fighter, arenaType) {
    if (!fighter) return 0;
    const groundH = getArenaGroundHeight(arenaType, fighter.x, 0);
    let support = groundH;
    const plats = getArenaPlatforms(arenaType);
    for (const p of plats) {
        if (!p.isJumpPad && fighter.x >= p.xMin && fighter.x <= p.xMax) {
            // Tolérance dynamique basée sur la vélocité et la position
            if (fighter.y >= p.y - 0.45) {
                if (p.y > support) support = p.y;
            }
        }
    }
    return support;
}

function getFighterSurfaceSlope(fighter, arenaType) {
    if (!fighter) return 0;
    const dx = 0.35;
    const y1 = getArenaGroundHeight(arenaType, fighter.x - dx, 0);
    const y2 = getArenaGroundHeight(arenaType, fighter.x + dx, 0);
    return Math.atan2(y2 - y1, dx * 2);
}

function buildArenaPlatforms3D(arena, group, accentColor) {
    if (!arena || !Array.isArray(arena.platforms) || !group) return [];
    const meshes = [];

    const platMat = new THREE.MeshStandardMaterial({
        color: arena.floorColor || 0x082535,
        roughness: 0.65,
        metalness: 0.25
    });

    const glowRimMat = new THREE.MeshStandardMaterial({
        color: accentColor || 0x22d3ee,
        emissive: accentColor || 0x22d3ee,
        emissiveIntensity: 0.85,
        roughness: 0.2
    });

    const undersideMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(arena.floorColor || 0x082535).multiplyScalar(0.45),
        roughness: 0.85,
        metalness: 0.15
    });

    for (const plat of arena.platforms) {
        if (plat.isJumpPad) continue; // Les jump pads sont modélisés dans le décor 3D
        const w = (plat.xMax - plat.xMin);
        const centerX = (plat.xMin + plat.xMax) * 0.5;
        const platY = plat.y;
        const depth = 4.2;
        const thickness = 0.42;

        const platGroup = new THREE.Group();
        platGroup.position.set(centerX, platY - thickness * 0.5, 0);

        // 1. Dalle de plateforme praticable
        const slabGeo = new THREE.BoxGeometry(w, thickness, depth, 16, 2, 6);
        const slab = new THREE.Mesh(slabGeo, platMat);
        slab.receiveShadow = true;
        slab.castShadow = true;
        platGroup.add(slab);

        // 2. Bordure lumineuse d'accentuation (pour une lisibilité visuelle parfaite)
        const rimGeo = new THREE.BoxGeometry(w + 0.12, 0.08, depth + 0.12);
        const rim = new THREE.Mesh(rimGeo, glowRimMat);
        rim.position.y = thickness * 0.5;
        platGroup.add(rim);

        // 3. Contreforts de roche / concrétions inférieures
        const strutCount = Math.max(2, Math.floor(w / 3.0));
        for (let s = 0; s < strutCount; s++) {
            const sx = -w * 0.4 + (s / (strutCount - 1 || 1)) * (w * 0.8);
            const strutGeo = new THREE.ConeGeometry(0.38, 1.4, 5);
            strutGeo.rotateX(Math.PI);
            const strut = new THREE.Mesh(strutGeo, undersideMat);
            strut.position.set(sx, -thickness * 0.5 - 0.65, 0);
            strut.castShadow = true;
            platGroup.add(strut);
        }

        group.add(platGroup);
        meshes.push(platGroup);
    }
    return meshes;
}

function buildArena3D(arenaType, customGroup = null, customScene = null) {
    const group = customGroup || arenaGroup;
    const scene = customScene || battleScene;
    if (!group || !scene) return;

    while (group.children.length > 0) {
        group.remove(group.children[0]);
    }

    const arena = ARENAS[arenaType] || ARENAS['volcano'];
    let skyColor = 0x180505;
    let floorColor = 0x1c1917;
    let accentColor = 0xf97316;

    if (arena) {
        skyColor = arena.skyColor;
        floorColor = arena.floorColor;
        accentColor = arena.accentColor;
    }

    scene.background = new THREE.Color(skyColor);
    if (scene.fog) {
        scene.fog.color.setHex(skyColor);
        scene.fog.density = 0.018;
    } else {
        scene.fog = new THREE.FogExp2(skyColor, 0.018);
    }

    const { colorMap, bumpMap } = getArenaStagePBRMaps(arenaType, floorColor, accentColor);

    // ========================================================================
    // 1. DALLE TOPOGRAPHIQUE SCULPTÉE EN RELIEF 3D (STYLE MATURE CARTOON PBR)
    // ========================================================================
    const stageWidth = (arena && arena.stageWidth) ? arena.stageWidth : 32;
    const stageDepth = (arena && arena.stageDepth) ? arena.stageDepth : 12;
    const segsX = Math.round(stageWidth * 2.5);
    const segsZ = 22;
    const stageGeo = new THREE.BoxGeometry(stageWidth, 3.2, stageDepth, segsX, 4, segsZ);
    const pos = stageGeo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const baseCol = new THREE.Color(0xffffff);
    const accentCol = new THREE.Color(accentColor);
    const cliffDarkCol = new THREE.Color(floorColor).multiplyScalar(0.38);
    const tempCol = new THREE.Color();

    for (let i = 0; i < pos.count; i++) {
        let vx = pos.getX(i);
        const vy = pos.getY(i);
        let vz = pos.getZ(i);

        const groundH = getArenaGroundHeight(arenaType, vx, vz);
        const zEdgeFactor = Math.max(0, (Math.abs(vz) - 1.8) / 4.2);
        const zMicroRelief = zEdgeFactor * (Math.sin(vx * 0.8 + vz * 0.9) * 0.18 + Math.cos(vx * 1.5 - vz * 0.6) * 0.08);
        const surfaceY = groundH + zMicroRelief;

        // Sculpter les parois rocheuses du socle en strates biseautées (cliff overhang)
        if (vy > 0.5) {
            pos.setY(i, surfaceY);
        } else if (vy > -0.2) {
            const overhang = 1.0 + 0.035 * Math.sin(vx * 1.4);
            pos.setX(i, vx * overhang);
            pos.setZ(i, vz * overhang);
            pos.setY(i, surfaceY - 0.55);
        } else if (vy > -1.0) {
            const taper = 0.95 + 0.03 * Math.cos(vx * 2.1);
            pos.setX(i, vx * taper);
            pos.setZ(i, vz * taper);
            pos.setY(i, surfaceY * 0.4 - 1.45);
        } else {
            pos.setX(i, vx * 0.88);
            pos.setZ(i, vz * 0.88);
            pos.setY(i, -3.1);
        }

        const heightBlend = Math.max(0, Math.min(1, (surfaceY + 0.5) / 1.4));
        if (vy > 0.3) {
            tempCol.copy(baseCol).lerp(accentCol, heightBlend * 0.25);
            tempCol.multiplyScalar(0.88 + heightBlend * 0.24);
        } else if (vy > -0.3) {
            tempCol.copy(cliffDarkCol).lerp(accentCol, 0.35);
        } else {
            tempCol.copy(cliffDarkCol).multiplyScalar(0.65);
        }
        colors[i * 3] = tempCol.r;
        colors[i * 3 + 1] = tempCol.g;
        colors[i * 3 + 2] = tempCol.b;
    }
    stageGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    stageGeo.computeVertexNormals();

    const stageMat = new THREE.MeshStandardMaterial({
        map: colorMap,
        bumpMap: bumpMap,
        bumpScale: 0.06,
        vertexColors: true,
        roughness: 0.68,
        metalness: 0.14
    });
    const stageMesh = new THREE.Mesh(stageGeo, stageMat);
    stageMesh.receiveShadow = true;
    stageMesh.castShadow = true;
    group.add(stageMesh);

    if (typeof ArenaNavSystem !== 'undefined' && group === arenaGroup) {
        ArenaNavSystem.buildArenaNavMesh(arenaType, stageGeo);
    }

    // ========================================================================
    // 2. BORDURE TELLURIQUE SCULPTÉE & ROCHERS D'ENCADREMENT STYLISÉS
    // ========================================================================
    const rimGeo = new THREE.BoxGeometry(stageWidth + 0.36, 0.24, stageDepth + 0.36, segsX, 1, 2);
    const rimPos = rimGeo.attributes.position;
    for (let i = 0; i < rimPos.count; i++) {
        const rx = rimPos.getX(i);
        const ry = rimPos.getY(i);
        const rz = rimPos.getZ(i);
        const gh = getArenaGroundHeight(arenaType, rx, rz);
        const crag = Math.sin(rx * 2.2 + rz) * 0.04;
        rimPos.setY(i, gh - 0.08 + crag + (ry > 0 ? 0.11 : -0.11));
    }
    rimGeo.computeVertexNormals();
    const rimMat = new THREE.MeshStandardMaterial({
        color: accentColor,
        emissive: accentColor,
        emissiveIntensity: 0.55,
        roughness: 0.28,
        metalness: 0.45
    });
    const rimMesh = new THREE.Mesh(rimGeo, rimMat);
    group.add(rimMesh);

    // Piliers de corniche rocheuse / contreforts stylisés le long du rebord avant et arrière
    const buttressMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(floorColor).multiplyScalar(0.65),
        bumpMap: bumpMap,
        bumpScale: 0.05,
        roughness: 0.78,
        metalness: 0.15
    });
    const crystalAccentMat = new THREE.MeshStandardMaterial({
        color: accentColor,
        emissive: accentColor,
        emissiveIntensity: 0.65,
        roughness: 0.22,
        metalness: 0.4
    });

    const maxBx = Math.floor((stageWidth * 0.5) - 1.0);
    for (let bx = -maxBx; bx <= maxBx; bx += 3.0) {
        [-1, 1].forEach(zSide => {
            const bz = zSide * (stageDepth * 0.5 + 0.12);
            const gh = getArenaGroundHeight(arenaType, bx, bz);
            const crag = new THREE.Mesh(new THREE.DodecahedronGeometry(0.52, 0), buttressMat);
            crag.scale.set(1.2, 1.85, 0.75);
            crag.position.set(bx, gh - 0.75, bz);
            crag.rotation.set(0.15 * zSide, bx * 0.4, 0.08);
            crag.castShadow = true;
            crag.receiveShadow = true;
            group.add(crag);

            if (Math.abs(bx) % 6 === 0) {
                const shard = new THREE.Mesh(new THREE.OctahedronGeometry(0.24, 0), crystalAccentMat);
                shard.scale.set(0.7, 2.1, 0.7);
                shard.position.set(bx + 0.3, gh - 0.18, bz + zSide * 0.12);
                shard.rotation.z = (bx > 0 ? -0.25 : 0.25);
                group.add(shard);
            }
        });
    }

    // ========================================================================
    // 3. PLATEFORMES ÉTAGÉES & SURFACES PRATICABLES 3D
    // ========================================================================
    buildArenaPlatforms3D(arena, group, accentColor);

    // ========================================================================
    // 4. ÉLÉMENTS DE DÉCOR 3D SPÉCIFIQUES DE L'ARÈNE
    // ========================================================================
    if (arena && arena.buildDecor) {
        const oldArenaGroup = arenaGroup;
        arenaGroup = group;
        group.arenaDecor = arena.buildDecor(group, scene) || {};
        arenaGroup = oldArenaGroup;
    }
}

function updateArenaDynamics(arenaType, group, scene, time, dt) {
    if (!group) return;
    const arena = ARENAS[arenaType] || ARENAS['volcano'];
    if (arena && arena.animate && group.arenaDecor) {
        arena.animate(group.arenaDecor, group, scene, time, dt);
    }
}
