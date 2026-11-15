// ============================================================================
// js/core/model-loader.js — Blender GLB Preloader, Cache & Rig Hydrator
// ============================================================================

const GLB_FIGHTER_IDS = new Set([
    'ankylo',
    'anomalocaris',
    'apato',
    'dragon',
    'maiasaura',
    'pachyrhino',
    'giantsloth',
    'postosuchus',
    'pulmonoscorpius',
    'quetzal',
    'smilodon',
    'spinosaurus',
    'stegosaurus',
    'terabird',
    'therizino',
    'trex'
]);

const FIGHTER_GLB_CACHE = {};
const FIGHTER_GLB_PROMISES = {};
const FIGHTER_GLB_LISTENERS = [];
let _reportedGlbError = null;

function reportGlbLoadError(fighterId, err) {
    if (err && err._isGlbFatalReport) {
        return err;
    }
    const reason = (err && err.message) ? err.message : String(err || 'Erreur inconnue');
    const isFileProto = (typeof window !== 'undefined' && window.location && window.location.protocol === 'file:');
    const hint = isFileProto
        ? ' Le jeu doit être lancé via un serveur HTTP local (start.bat sous Windows ou ./start.sh sous Linux/macOS).'
        : '';
    const msg = `[Extinction Kombat 3D] Échec critique du chargement du modèle GLB (${fighterId || 'inconnu'}) : ${reason}.${hint}`;

    console.error(msg, err);
    if (typeof window !== 'undefined') {
        window.__glbFatalError = msg;
        if (Array.isArray(window.__testErrors)) {
            window.__testErrors.push(msg);
        }
        try {
            window.dispatchEvent(new ErrorEvent('error', { message: msg, error: err instanceof Error ? err : new Error(msg) }));
        } catch (_) {}
    }

    if (typeof document !== 'undefined' && document.body && !_reportedGlbError) {
        _reportedGlbError = msg;
        const existing = document.getElementById('glb-fatal-error-overlay');
        if (existing) existing.remove();
        const overlay = document.createElement('div');
        overlay.id = 'glb-fatal-error-overlay';
        overlay.setAttribute('role', 'alert');
        overlay.style.cssText = [
            'position:fixed', 'inset:0', 'z-index:999999',
            'background:rgba(10,12,18,0.94)', 'color:#fef2f2',
            'display:flex', 'flex-direction:column', 'align-items:center', 'justify-content:center',
            'padding:32px', 'text-align:center', 'font-family:system-ui,-apple-system,sans-serif'
        ].join(';');
        overlay.innerHTML = `
            <div style="max-width:640px;border:2px solid #ef4444;border-radius:14px;padding:28px;background:#18181b;box-shadow:0 24px 60px rgba(0,0,0,0.7);">
                <div style="font-size:22px;font-weight:800;letter-spacing:1px;color:#f87171;margin-bottom:12px;">ERREUR DE CHARGEMENT MODÈLE 3D (.GLB)</div>
                <p style="font-size:15px;line-height:1.55;color:#e4e4e7;margin:0 0 18px 0;"></p>
                <button type="button" onclick="window.location.reload()" style="cursor:pointer;border:none;border-radius:8px;padding:10px 22px;font-weight:700;background:#ef4444;color:#fff;font-size:14px;">Recharger le jeu</button>
            </div>
        `;
        overlay.querySelector('p').textContent = msg;
        document.body.appendChild(overlay);
    }
    const fatalErr = new Error(msg);
    fatalErr._isGlbFatalReport = true;
    return fatalErr;
}

function onFighterGLBLoaded(cb) {
    if (typeof cb === 'function') {
        FIGHTER_GLB_LISTENERS.push(cb);
    }
}

function _loadGLBAsset(assetId, allowedIds, url, cache, promises, listeners) {
    if (!assetId || (allowedIds && !allowedIds.has(assetId))) {
        const err = reportGlbLoadError(assetId, new Error(`Identifiant GLB inconnu ou non enregistré: ${assetId}`));
        return Promise.reject(err);
    }
    if (typeof THREE === 'undefined' || !THREE.GLTFLoader) {
        const err = reportGlbLoadError(assetId, new Error('THREE.GLTFLoader indisponible'));
        return Promise.reject(err);
    }
    if (typeof window !== 'undefined' && window.location && window.location.protocol === 'file:') {
        const err = reportGlbLoadError(assetId, new Error('Protocole file:// non supporté pour fetch(.glb)'));
        return Promise.reject(err);
    }
    if (cache[assetId]) {
        return Promise.resolve(cache[assetId]);
    }
    if (promises[assetId]) {
        return promises[assetId];
    }

    const loader = new THREE.GLTFLoader();
    promises[assetId] = new Promise((resolve, reject) => {
        loader.load(
            url,
            (gltf) => {
                if (!gltf || !gltf.scene) {
                    const err = reportGlbLoadError(assetId, new Error(`Scène glTF invalide dans ${url}`));
                    reject(err);
                    return;
                }
                cache[assetId] = gltf;
                if (listeners) {
                    listeners.forEach((cb) => {
                        try { cb(assetId, gltf); } catch (_) {}
                    });
                }
                resolve(gltf);
            },
            undefined,
            (loadErr) => {
                const err = reportGlbLoadError(
                    assetId,
                    loadErr instanceof Error ? loadErr : new Error(`Impossible de charger ${url}`)
                );
                reject(err);
            }
        );
    });
    return promises[assetId];
}

function loadFighterGLB(fighterId) {
    return _loadGLBAsset(
        fighterId,
        GLB_FIGHTER_IDS,
        `assets/models/fighters/${fighterId}.glb`,
        FIGHTER_GLB_CACHE,
        FIGHTER_GLB_PROMISES,
        FIGHTER_GLB_LISTENERS
    );
}

function preloadAllFighterGLBs() {
    const promises = [];
    GLB_FIGHTER_IDS.forEach((id) => {
        promises.push(loadFighterGLB(id));
    });
    ['boss_cameroceras', 'boss_jaekelopterus', 'boss_dunkleosteus', 'boss_dimetrodon'].forEach((bossId) => {
        promises.push(loadCampaignGLB(bossId));
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
            }
        });
    }

    // Apply campaign boss theme tint when reusing a shared fighter GLB without a bespoke boss GLB
    if (dino && dino.isBoss && !dino.bossGlbId) {
        allMats.forEach((m) => {
            if (!m || !m.color || !m.name) return;
            if (m.name.includes('Mat_BodyPrimary') && dino.primaryColor !== undefined) {
                m.color.lerp(new THREE.Color(dino.primaryColor), 0.42);
            } else if (m.name.includes('Mat_Accent') && dino.accentColor !== undefined) {
                m.color.lerp(new THREE.Color(dino.accentColor), 0.42);
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

    if (dino && dino.id === 'quetzal' && typeof attachQuetzalEnduranceGauge === 'function') {
        attachQuetzalEnduranceGauge(rig);
    }

    rig._isGlbHydrated = true;
    if (Array.isArray(rig._onHydratedCallbacks) && rig._onHydratedCallbacks.length > 0) {
        const cbs = rig._onHydratedCallbacks.splice(0, rig._onHydratedCallbacks.length);
        cbs.forEach((cb) => {
            try { cb(rig); } catch (_) {}
        });
    }
    return true;
}

// ============================================================================
// CAMPAIGN MINIONS, BOSSES & PROPS (.GLB) REGISTRY & HYDRATION
// ============================================================================

const MINION_GLB_IDS = new Set([
    'cambrian_trilobite',
    'opabinia_radiodont_elite',
    'orthoceras',
    'eurypterid',
    'jawless_fish',
    'shark_placoderm',
    'bothriolepis',
    'meganeura',
    'arthropleura',
    'synapsid',
    'scutosaurus',
    'raptor',
    'triassic_hound',
    'dino_tank',
    'magma_ceratopsian',
    'mammal',
    'serpent',
    'bird_pterosaur',
    'glacier_panther'
]);
const MINION_GLB_CACHE = {};
const MINION_GLB_PROMISES = {};

const CAMPAIGN_BOSS_GLB_IDS = new Set([
    'boss_cameroceras',
    'boss_jaekelopterus',
    'boss_dunkleosteus',
    'boss_dimetrodon',
    'boss_pyroclast',
    'boss_wendigo'
]);
const CAMPAIGN_PROP_GLB_IDS = new Set([
    'pickup_meat',
    'pickup_amber',
    'hazard_meteor',
    'hazard_boulder',
    'hazard_icicle'
]);
const CAMPAIGN_GLB_IDS = new Set([...CAMPAIGN_BOSS_GLB_IDS, ...CAMPAIGN_PROP_GLB_IDS]);
const CAMPAIGN_GLB_CACHE = {};
const CAMPAIGN_GLB_PROMISES = {};

function _collectUniqueMaterials(rootObj) {
    const mats = new Set();
    if (!rootObj) return [];
    rootObj.traverse((node) => {
        if (!node.isMesh) return;
        const list = Array.isArray(node.material) ? node.material : [node.material];
        list.forEach((m) => { if (m) mats.add(m); });
    });
    return Array.from(mats);
}

function loadMinionGLB(enemyType) {
    return _loadGLBAsset(
        enemyType,
        MINION_GLB_IDS,
        `assets/models/minions/${enemyType}.glb`,
        MINION_GLB_CACHE,
        MINION_GLB_PROMISES
    );
}

function loadCampaignGLB(modelId) {
    return _loadGLBAsset(
        modelId,
        CAMPAIGN_GLB_IDS,
        `assets/models/campaign/${modelId}.glb`,
        CAMPAIGN_GLB_CACHE,
        CAMPAIGN_GLB_PROMISES
    );
}

function hydrateMinionFromGLB(minion, gltf) {
    if (!minion || !minion.root || !gltf || !gltf.scene) return false;

    const clonedScene = cloneGLTFSceneWithIsolatedMaterials(gltf.scene);
    const glbRoot = clonedScene.getObjectByName('Minion_Root') || clonedScene;
    const allMats = _collectUniqueMaterials(glbRoot);

    if (minion.def && minion.def.color !== undefined) {
        const waveCol = new THREE.Color(minion.def.color);
        allMats.forEach((m) => {
            if (!m || !m.color || !m.name) return;
            if (m.name.includes('Mat_BodyPrimary')) {
                m.color.lerp(waveCol, 0.35);
            }
        });
    }

    while (minion.root.children.length > 0) {
        minion.root.remove(minion.root.children[0]);
    }
    minion.root.add(glbRoot);

    minion.bodyMesh = glbRoot.getObjectByName('Body_Main') || glbRoot;
    minion.headMesh = glbRoot.getObjectByName('Head_Pivot') || null;
    minion.tailFan = glbRoot.getObjectByName('TailFan') || null;
    minion.tailMesh = minion.tailFan;
    minion.proboscis = glbRoot.getObjectByName('Proboscis') || null;
    const pClaw0 = glbRoot.getObjectByName('ProbClaw0');
    const pClaw1 = glbRoot.getObjectByName('ProbClaw1');
    minion.probClaws = (pClaw0 && pClaw1) ? [pClaw0, pClaw1] : null;

    minion.legs = collectNumberedNodes(glbRoot, 'Leg');
    minion.arms = collectNumberedNodes(glbRoot, 'Arm');

    const wingNodes = collectNumberedNodes(glbRoot, 'WingPivot');
    minion.wings = wingNodes.map((pivot, idx) => ({
        pivot,
        side: pivot.position.z <= 0 ? 1 : -1,
        idx
    }));

    minion.segments = collectNumberedNodes(glbRoot, 'Seg');
    minion.antennules = collectNumberedNodes(glbRoot, 'Antennule');

    const flaps = [];
    collectNumberedNodes(glbRoot, 'FlapL').forEach((mesh, idx) => {
        flaps.push({ mesh, side: 1, idx });
    });
    collectNumberedNodes(glbRoot, 'FlapR').forEach((mesh, idx) => {
        flaps.push({ mesh, side: -1, idx });
    });
    minion.swimmingFlaps = flaps;

    minion._glbMaterials = allMats;
    minion._isGlbHydrated = true;
    return true;
}

function hydrateCampaignPropFromGLB(targetGroup, gltf, targetScale = 1.0) {
    if (!targetGroup || !gltf || !gltf.scene) return false;
    const clonedScene = cloneGLTFSceneWithIsolatedMaterials(gltf.scene);
    const propRoot = clonedScene.getObjectByName('Prop_Root') || clonedScene;
    propRoot.scale.setScalar(targetScale);

    while (targetGroup.children.length > 0) {
        targetGroup.remove(targetGroup.children[0]);
    }
    targetGroup.add(propRoot);
    targetGroup._isGlbHydrated = true;
    return true;
}

function preloadAllCampaignGLBs() {
    const promises = [];
    MINION_GLB_IDS.forEach((id) => {
        promises.push(loadMinionGLB(id));
    });
    CAMPAIGN_GLB_IDS.forEach((id) => {
        promises.push(loadCampaignGLB(id));
    });
    return Promise.all(promises);
}

if (typeof window !== 'undefined') {
    window.GLB_FIGHTER_IDS = GLB_FIGHTER_IDS;
    window.FIGHTER_GLB_CACHE = FIGHTER_GLB_CACHE;
    window.loadFighterGLB = loadFighterGLB;
    window.preloadAllFighterGLBs = preloadAllFighterGLBs;
    window.hydrateRigFromGLB = hydrateRigFromGLB;
    window.onFighterGLBLoaded = onFighterGLBLoaded;
    window.reportGlbLoadError = reportGlbLoadError;
    window.MINION_GLB_IDS = MINION_GLB_IDS;
    window.MINION_GLB_CACHE = MINION_GLB_CACHE;
    window.loadMinionGLB = loadMinionGLB;
    window.hydrateMinionFromGLB = hydrateMinionFromGLB;
    window.CAMPAIGN_BOSS_GLB_IDS = CAMPAIGN_BOSS_GLB_IDS;
    window.CAMPAIGN_PROP_GLB_IDS = CAMPAIGN_PROP_GLB_IDS;
    window.CAMPAIGN_GLB_IDS = CAMPAIGN_GLB_IDS;
    window.CAMPAIGN_GLB_CACHE = CAMPAIGN_GLB_CACHE;
    window.loadCampaignGLB = loadCampaignGLB;
    window.hydrateCampaignPropFromGLB = hydrateCampaignPropFromGLB;
    window.preloadAllCampaignGLBs = preloadAllCampaignGLBs;
}
