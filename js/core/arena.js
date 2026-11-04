// ============================================================================
// js/core/arena.js — Relief Topographique 3D & Surfaces Praticables (Arbres,
// Champignons Géants, Ponts d'Os, Corniches de Basalte, Banquise & Autels)
// ============================================================================

function getArenaGroundHeight(arenaType, x, z = 0) {
    const key = arenaType || (typeof currentArena !== 'undefined' ? currentArena : 'volcano');
    const arena = (typeof ARENAS !== 'undefined' && (ARENAS[key] || ARENAS['volcano'])) || null;
    const clampedX = Math.max(-16, Math.min(16, x || 0));
    if (arena && typeof arena.getGroundHeight === 'function') {
        return arena.getGroundHeight(clampedX, z);
    }
    // Relief par défaut si non spécifié
    return Math.sin(clampedX * 0.35) * 0.28 + Math.cos(clampedX * 0.18) * 0.15;
}

function getArenaPlatforms(arenaType) {
    return [];
}

function getPlatformSurfaceY(plat, x) {
    return 0;
}

function getFighterSupportHeight(fighter, arenaType) {
    if (!fighter) return 0;
    return getArenaGroundHeight(arenaType, fighter.x, 0);
}

function getFighterSurfaceSlope(fighter, arenaType) {
    if (!fighter) return 0;
    const dx = 0.35;
    const y1 = getArenaGroundHeight(arenaType, fighter.x - dx, 0);
    const y2 = getArenaGroundHeight(arenaType, fighter.x + dx, 0);
    return Math.atan2(y2 - y1, dx * 2);
}

function buildArenaPlatforms3D(arena, group, accentColor) {
    return [];
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
    } else {
        scene.fog = new THREE.FogExp2(skyColor, 0.024);
    }

    // ========================================================================
    // 1. SOL SCULPTÉ EN RELIEF 3D (NON PLAT : COLLINES, CRATÈRES, PENTES, DUNES)
    // ========================================================================
    const stageWidth = 32;
    const stageDepth = 12;
    const segsX = 72;
    const segsZ = 18;
    const stageGeo = new THREE.BoxGeometry(stageWidth, 2.8, stageDepth, segsX, 2, segsZ);
    const pos = stageGeo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const baseCol = new THREE.Color(floorColor);
    const accentCol = new THREE.Color(accentColor);
    const tempCol = new THREE.Color();

    for (let i = 0; i < pos.count; i++) {
        const vx = pos.getX(i);
        const vy = pos.getY(i);
        const vz = pos.getZ(i);

        const groundH = getArenaGroundHeight(arenaType, vx, vz);
        // Légère rugosité naturelle sur les bords avant/arrière hors ligne de combat z=0
        const zEdgeFactor = Math.max(0, (Math.abs(vz) - 1.8) / 4.2);
        const zMicroRelief = zEdgeFactor * (Math.sin(vx * 0.8 + vz * 0.9) * 0.18 + Math.cos(vx * 1.5 - vz * 0.6) * 0.08);
        const surfaceY = groundH + zMicroRelief;

        if (vy > 0.1) {
            pos.setY(i, surfaceY);
        } else if (vy > -0.1) {
            pos.setY(i, surfaceY * 0.5 - 1.1);
        } else {
            pos.setY(i, -2.5);
        }

        // Coloration par sommet selon l'altitude pour renforcer la lisibilité du relief
        const heightBlend = Math.max(0, Math.min(1, (surfaceY + 0.5) / 1.4));
        tempCol.copy(baseCol);
        if (vy > 0) {
            tempCol.lerp(accentCol, heightBlend * 0.22);
            tempCol.multiplyScalar(0.82 + heightBlend * 0.36);
        } else {
            tempCol.multiplyScalar(0.55);
        }
        colors[i * 3] = tempCol.r;
        colors[i * 3 + 1] = tempCol.g;
        colors[i * 3 + 2] = tempCol.b;
    }
    stageGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    stageGeo.computeVertexNormals();

    const stageMat = new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.78,
        metalness: 0.18
    });
    const stageMesh = new THREE.Mesh(stageGeo, stageMat);
    stageMesh.receiveShadow = true;
    stageMesh.castShadow = true;
    group.add(stageMesh);

    // ========================================================================
    // 2. BORDURE TELLURIQUE LUMINEUSE ÉPOUSANT LA COURBE DU TERRAIN
    // ========================================================================
    const rimGeo = new THREE.BoxGeometry(stageWidth + 0.25, 0.20, stageDepth + 0.25, segsX, 1, 2);
    const rimPos = rimGeo.attributes.position;
    for (let i = 0; i < rimPos.count; i++) {
        const rx = rimPos.getX(i);
        const ry = rimPos.getY(i);
        const rz = rimPos.getZ(i);
        const gh = getArenaGroundHeight(arenaType, rx, rz);
        rimPos.setY(i, gh - 0.06 + (ry > 0 ? 0.10 : -0.10));
    }
    rimGeo.computeVertexNormals();
    const rimMat = new THREE.MeshBasicMaterial({ color: accentColor });
    const rimMesh = new THREE.Mesh(rimGeo, rimMat);
    group.add(rimMesh);

    // ========================================================================
    // 3. ÉLÉMENTS DE DÉCOR 3D SPÉCIFIQUES DE L'ARÈNE
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
