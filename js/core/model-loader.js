// ============================================================================
// js/core/model-loader.js — Blender GLB Preloader, Cache & Rig Hydrator
// ============================================================================

const GLB_FIGHTER_IDS = new Set([
    'ankylo',
    'anomalocaris',
    'apato',
    'dragon',
    'maiasaura',
    'giantsloth',
    'postosuchus',
    'pulmonoscorpius',
    'smilodon',
    'spinosaurus',
    'stegosaurus',
    'terabird',
    'therizino'
]);

const FIGHTER_GLB_CACHE = {};
const FIGHTER_GLB_PROMISES = {};
const FIGHTER_GLB_LISTENERS = [];

function onFighterGLBLoaded(cb) {
    if (typeof cb === 'function') {
        FIGHTER_GLB_LISTENERS.push(cb);
    }
}

function loadFighterGLB(fighterId) {
    if (!fighterId || !GLB_FIGHTER_IDS.has(fighterId)) {
        return Promise.resolve(null);
    }
    if (typeof THREE === 'undefined' || !THREE.GLTFLoader) {
        return Promise.resolve(null);
    }
    // Avoid blocked fetch() calls when opened directly via file:// protocol
    if (typeof window !== 'undefined' && window.location && window.location.protocol === 'file:') {
        return Promise.resolve(null);
    }
    if (FIGHTER_GLB_CACHE[fighterId]) {
        return Promise.resolve(FIGHTER_GLB_CACHE[fighterId]);
    }
    if (FIGHTER_GLB_PROMISES[fighterId]) {
        return FIGHTER_GLB_PROMISES[fighterId];
    }

    const loader = new THREE.GLTFLoader();
    const url = `assets/models/fighters/${fighterId}.glb`;
    FIGHTER_GLB_PROMISES[fighterId] = new Promise((resolve) => {
        loader.load(
            url,
            (gltf) => {
                FIGHTER_GLB_CACHE[fighterId] = gltf;
                FIGHTER_GLB_LISTENERS.forEach((cb) => {
                    try { cb(fighterId, gltf); } catch (_) {}
                });
                resolve(gltf);
            },
            undefined,
            () => {
                // Missing .glb or non-HTTP environment: silently keep procedural fallback
                resolve(null);
            }
        );
    });
    return FIGHTER_GLB_PROMISES[fighterId];
}

function preloadAllFighterGLBs() {
    const promises = [];
    GLB_FIGHTER_IDS.forEach((id) => {
        promises.push(loadFighterGLB(id));
    });
    return Promise.all(promises);
}

function cloneGLTFSceneWithIsolatedMaterials(sourceScene) {
    const cloned = sourceScene.clone(true);
    const matMap = new Map();

    cloned.traverse((node) => {
        if (!node.isMesh) return;
        node.castShadow = true;
        node.receiveShadow = true;
        if (Array.isArray(node.material)) {
            node.material = node.material.map((m) => {
                if (!m) return m;
                if (!matMap.has(m)) matMap.set(m, m.clone());
                return matMap.get(m);
            });
        } else if (node.material) {
            if (!matMap.has(node.material)) {
                matMap.set(node.material, node.material.clone());
            }
            node.material = matMap.get(node.material);
        }
    });

    return cloned;
}

function collectNumberedNodes(root, prefix) {
    const found = [];
    for (let i = 0; i < 32; i++) {
        const node = root.getObjectByName(`${prefix}${i}`);
        if (!node) break;
        found.push(node);
    }
    return found;
}

function hydrateRigFromGLB(rig, dino, skin, gltf) {
    if (!rig || !gltf || !gltf.scene) return false;

    rig.root.name = 'Bone_Root';
    rig.hips.name = 'Bone_Hips';

    const clonedScene = cloneGLTFSceneWithIsolatedMaterials(gltf.scene);
    const glbRoot = clonedScene.getObjectByName('Bone_Root') || clonedScene;
    const glbHips = glbRoot.getObjectByName('Bone_Hips') || glbRoot;

    // Detach preserved engine overlays before clearing procedural geometry
    const preservedHipsChildren = [];
    if (rig.skeletonGroup && rig.skeletonGroup.parent === rig.hips) {
        rig.hips.remove(rig.skeletonGroup);
        preservedHipsChildren.push(rig.skeletonGroup);
    }
    if (rig.armorRig && rig.armorRig.low && rig.armorRig.low.parent === rig.hips) {
        rig.hips.remove(rig.armorRig.low);
        preservedHipsChildren.push(rig.armorRig.low);
    }
    if (rig.armorRig && rig.armorRig.high && rig.armorRig.high.parent) {
        rig.armorRig.high.parent.remove(rig.armorRig.high);
    }
    if (rig.armorRig && rig.armorRig.mid && rig.armorRig.mid.parent) {
        rig.armorRig.mid.parent.remove(rig.armorRig.mid);
    }

    while (rig.hips.children.length > 0) {
        rig.hips.remove(rig.hips.children[0]);
    }
    preservedHipsChildren.forEach((child) => rig.hips.add(child));

    // Align hips position & move GLB hips children into rig.hips
    rig.hips.position.copy(glbHips.position);
    while (glbHips.children.length > 0) {
        rig.hips.add(glbHips.children[0]);
    }

    // Rebind canonical Bone_* references
    const glbTorso = rig.hips.getObjectByName('Bone_Torso');
    const glbNeck = rig.hips.getObjectByName('Bone_Neck');
    const glbHead = rig.hips.getObjectByName('Bone_Head');
    const glbJaw = rig.hips.getObjectByName('Bone_Jaw');

    if (glbTorso) {
        rig.torso = glbTorso;
    } else {
        rig.torso = new THREE.Group();
        rig.torso.name = 'Bone_Torso';
        rig.hips.add(rig.torso);
    }

    if (glbNeck) {
        rig.neck = glbNeck;
    } else {
        rig.neck = new THREE.Group();
        rig.neck.name = 'Bone_Neck';
        rig.torso.add(rig.neck);
    }

    if (glbHead) {
        rig.headGroup = glbHead;
    } else {
        rig.headGroup = new THREE.Group();
        rig.headGroup.name = 'Bone_Head';
        rig.neck.add(rig.headGroup);
    }

    if (glbJaw) {
        rig.jaw = glbJaw;
    } else {
        rig.jaw = new THREE.Group();
        rig.jaw.name = 'Bone_Jaw';
        rig.headGroup.add(rig.jaw);
    }

    if (rig.armorRig) {
        if (rig.armorRig.mid) rig.torso.add(rig.armorRig.mid);
        if (rig.armorRig.high) rig.headGroup.add(rig.armorRig.high);
    }

    rig.legs = collectNumberedNodes(rig.hips, 'Bone_Leg');
    rig.arms = collectNumberedNodes(rig.hips, 'Bone_Arm');
    rig.tailSegments = collectNumberedNodes(rig.hips, 'Bone_Tail');

    // Rebind species-specific specialParts
    rig.specialParts = {};
    const bindSpecial = (nodeName, propName) => {
        const node = rig.hips.getObjectByName(nodeName);
        if (node) rig.specialParts[propName] = node;
    };
    bindSpecial('Special_TailClub', 'tailClub');
    bindSpecial('Special_Plates', 'plates');
    bindSpecial('Special_Thagomizer', 'thagomizer');
    bindSpecial('Special_Sail', 'sailGroup');
    bindSpecial('Special_SonicCrest', 'sonicCrest');
    bindSpecial('Special_Stinger', 'stinger');
    bindSpecial('Special_LeftWing', 'leftWing');
    bindSpecial('Special_RightWing', 'rightWing');
    bindSpecial('Special_TailFan', 'tailFan');
    bindSpecial('Special_Mouth', 'mouthGroup');

    const neckSegs = collectNumberedNodes(rig.hips, 'Special_NeckSeg');
    if (neckSegs.length > 0) rig.specialParts.neckSegments = neckSegs;

    const eyeStalks = collectNumberedNodes(rig.hips, 'Special_EyeStalk');
    if (eyeStalks.length > 0) rig.specialParts.eyeStalks = eyeStalks;

    const raptorialClaws = collectNumberedNodes(rig.hips, 'Special_Claw');
    if (raptorialClaws.length > 0) {
        rig.specialParts.raptorialClaws = raptorialClaws.map((cNode) => ({
            root: cNode,
            segments: []
        }));
    }

    const flaps = [];
    for (let i = 0; i < 16; i++) {
        const leftNode = rig.hips.getObjectByName(`Special_Flap${i * 2}`);
        const rightNode = rig.hips.getObjectByName(`Special_Flap${i * 2 + 1}`);
        if (!leftNode && !rightNode) break;
        const dummy = leftNode || rightNode;
        flaps.push({
            left: leftNode || dummy,
            right: rightNode || dummy,
            factor: 1.0,
            index: i
        });
    }
    if (flaps.length > 0) rig.specialParts.swimmingFlaps = flaps;

    // Collect skin meshes & primary material for hit-flash / X-Ray / skin tinting
    rig.skinMeshes.length = 0;
    let primaryMat = null;
    const allMats = new Set();

    rig.hips.traverse((obj) => {
        if (obj === rig.skeletonGroup || (rig.armorRig && (obj === rig.armorRig.high || obj === rig.armorRig.mid || obj === rig.armorRig.low))) {
            return;
        }
        // Skip descendants of skeletonGroup / armorRig
        let p = obj.parent;
        while (p) {
            if (p === rig.skeletonGroup || (rig.armorRig && (p === rig.armorRig.high || p === rig.armorRig.mid || p === rig.armorRig.low))) {
                return;
            }
            p = p.parent;
        }
        if (obj.isMesh) {
            rig.skinMeshes.push(obj);
            const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
            mats.forEach((m) => {
                if (!m) return;
                allMats.add(m);
                if (!primaryMat && m.name && m.name.includes('Mat_BodyPrimary')) {
                    primaryMat = m;
                }
            });
        }
    });

    if (!primaryMat && allMats.size > 0) {
        primaryMat = allMats.values().next().value;
    }
    if (primaryMat) {
        rig.bodyMat = primaryMat;
    }

    // Apply alternate skin tint if non-default skin is selected
    const defaultSkin = dino && dino.skins && dino.skins[0];
    if (skin && defaultSkin && skin !== defaultSkin) {
        allMats.forEach((m) => {
            if (!m || !m.color) return;
            if (m.name && m.name.includes('Mat_BodyPrimary') && skin.primary !== undefined) {
                m.color.setHex(skin.primary);
            } else if (m.name && m.name.includes('Mat_Secondary') && skin.secondary !== undefined) {
                m.color.setHex(skin.secondary);
            } else if (m.name && m.name.includes('Mat_Accent') && skin.accent !== undefined) {
                m.color.setHex(skin.accent);
                if (m.emissive) m.emissive.setHex(skin.accent);
            }
        });
    }

    // Re-capture restPose for resetDino3DRig
    rig.restPose = {
        hipsPos: rig.hips.position.clone(),
        torsoPos: rig.torso.position.clone(),
        neckPos: rig.neck.position.clone(),
        headPos: rig.headGroup.position.clone(),
        jawPos: rig.jaw.position.clone(),
        armsPos: rig.arms.map(a => a ? a.position.clone() : null),
        legsPos: rig.legs.map(l => l ? l.position.clone() : null),
        tailPos: rig.tailSegments.map(s => s ? s.position.clone() : null),
        neckSegmentsPos: (rig.specialParts && rig.specialParts.neckSegments)
            ? rig.specialParts.neckSegments.map(n => n.position.clone())
            : null
    };

    rig._isGlbHydrated = true;
    return true;
}

if (typeof window !== 'undefined') {
    window.GLB_FIGHTER_IDS = GLB_FIGHTER_IDS;
    window.FIGHTER_GLB_CACHE = FIGHTER_GLB_CACHE;
    window.loadFighterGLB = loadFighterGLB;
    window.preloadAllFighterGLBs = preloadAllFighterGLBs;
    window.hydrateRigFromGLB = hydrateRigFromGLB;
    window.onFighterGLBLoaded = onFighterGLBLoaded;
}
