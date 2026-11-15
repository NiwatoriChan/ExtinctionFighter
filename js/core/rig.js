// 4. CONSTRUCTEUR DE MODÈLES 3D ARTICULÉS (THREE.JS) POUR CHAQUE ESPÈCE
function createDino3DRig(dino, skinIndex = 0) {
    const skin = (dino.skins && dino.skins[skinIndex]) ? dino.skins[skinIndex] : (dino.skins && dino.skins[0]) ? dino.skins[0] : {
        primary: dino.primaryColor,
        secondary: dino.secondaryColor,
        accent: dino.accentColor
    };
    const root = new THREE.Group();
    root.name = 'Bone_Root';
    const hips = new THREE.Group();
    hips.name = 'Bone_Hips';
    root.add(hips);

    const bodyMat = new THREE.MeshStandardMaterial({
        color: skin.primary,
        roughness: 0.74,
        metalness: 0.02
    });
    const darkMat = new THREE.MeshStandardMaterial({
        color: skin.secondary,
        roughness: 0.80,
        metalness: 0.02
    });
    const accentMat = new THREE.MeshStandardMaterial({
        color: skin.accent,
        roughness: 0.48,
        metalness: 0.04
    });
    const shieldMat = new THREE.MeshBasicMaterial({
        color: 0xf59e0b,
        transparent: true,
        opacity: 0.28,
        wireframe: true
    });

    const skinMeshes = [];

    // Structure des articulations communes et spécifiques
    const rig = {
        root,
        hips,
        torso: new THREE.Group(),
        neck: new THREE.Group(),
        headGroup: new THREE.Group(),
        jaw: new THREE.Group(),
        tailSegments: [],
        legs: [], // [frontLeft/left, frontRight/right, backLeft, backRight]
        arms: [],
        specialParts: {},
        skeletonGroup: new THREE.Group(),
        xrayParts: {},
        shieldMesh: null,
        bodyMat,
        darkMat,
        accentMat,
        skinMeshes,
        armorRig: null
    };

    hips.add(rig.torso);

    // --- ARMURE DIRECTIONNELLE 3-VOIES (HIGH / MID / LOW) ---
    // Matériau d'armure ostéodermique renforcée avec lueur prismatique
    const armorMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        emissive: 0xd97706,
        emissiveIntensity: 0.85,
        roughness: 0.25,
        metalness: 0.75
    });
    const armorRuneMat = new THREE.MeshBasicMaterial({
        color: 0xfef08a,
        wireframe: true,
        transparent: true,
        opacity: 0.75
    });

    // 1. Armure Haute (Head / Horns / Crest Shield)
    const armorHighGroup = new THREE.Group();
    const highPlate = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.75, 0.85), armorMat);
    const highPlateGlow = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.85, 0.95), armorRuneMat);
    const highHornL = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.65, 5), armorMat);
    highHornL.position.set(0.2, 0.45, 0.35);
    highHornL.rotation.z = -0.4;
    const highHornR = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.65, 5), armorMat);
    highHornR.position.set(0.2, 0.45, -0.35);
    highHornR.rotation.z = -0.4;
    armorHighGroup.add(highPlate, highPlateGlow, highHornL, highHornR);
    armorHighGroup.position.set(0.35, 0.25, 0);
    armorHighGroup.visible = false;
    rig.headGroup.add(armorHighGroup);

    // 2. Armure Médiane (Torso / Ribs / Flank Carapace)
    const armorMidGroup = new THREE.Group();
    const midCarapace = new THREE.Mesh(new THREE.BoxGeometry(1.65, 1.25, 1.35), armorMat);
    const midCarapaceGlow = new THREE.Mesh(new THREE.BoxGeometry(1.80, 1.35, 1.45), armorRuneMat);
    for (let s = -1; s <= 1; s += 2) {
        for (let i = 0; i < 3; i++) {
            const spike = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.55, 4), armorMat);
            spike.position.set(-0.45 + i * 0.45, 0.35, s * 0.75);
            spike.rotation.x = s * 0.7;
            armorMidGroup.add(spike);
        }
    }
    armorMidGroup.add(midCarapace, midCarapaceGlow);
    armorMidGroup.position.set(0.15, 0.1, 0);
    armorMidGroup.visible = false;
    rig.torso.add(armorMidGroup);

    // 3. Armure Basse (Legs / Ankle / Ground Greaves Barricade)
    const armorLowGroup = new THREE.Group();
    const lowGroundPlate = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.65, 1.45), armorMat);
    const lowGroundPlateGlow = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.75, 1.55), armorRuneMat);
    armorLowGroup.add(lowGroundPlate, lowGroundPlateGlow);
    armorLowGroup.position.set(0, -1.2, 0);
    armorLowGroup.visible = false;
    hips.add(armorLowGroup);

    rig.armorRig = {
        high: armorHighGroup,
        mid: armorMidGroup,
        low: armorLowGroup,
        mat: armorMat,
        runeMat: armorRuneMat
    };

    // Bouclier d'énergie complémentaire 3D
    rig.shieldMesh = new THREE.Mesh(new THREE.SphereGeometry(2.2, 16, 12), shieldMat);
    rig.shieldMesh.position.set(0.6, 2.0, 0);
    rig.shieldMesh.visible = false;
    root.add(rig.shieldMesh);

    // --- SQUELETTE 3D HAUTE DÉFINITION POUR LE MODE X-RAY 2.0 ---
    const xrayBoneMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe });
    const xrayCyanMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee, wireframe: true });
    const xraySkullMat = new THREE.MeshBasicMaterial({ color: 0xf0f9ff });
    const xrayRibMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe });
    const xraySpineMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe });
    const xrayOrganMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e });

    // Colonne vertébrale + Moelle épinière lumineuse
    const spineGroup = new THREE.Group();
    for (let i = 0; i < 8; i++) {
        const vert = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 0.26), xraySpineMat);
        vert.position.set(-1.05 + i * 0.3, 0.25 + (i > 5 ? (i - 5) * 0.2 : 0), 0);
        spineGroup.add(vert);
    }
    rig.skeletonGroup.add(spineGroup);

    // Cage thoracique détaillée + Cœur interne battant
    const ribCageGroup = new THREE.Group();
    for (let i = 0; i < 6; i++) {
        const ribL = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.045, 8, 14, Math.PI * 0.85), xrayRibMat);
        ribL.position.set(-0.75 + i * 0.28, 0.15, 0.08);
        ribL.rotation.y = Math.PI / 2;
        ribCageGroup.add(ribL);

        const ribR = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.045, 8, 14, Math.PI * 0.85), xrayRibMat);
        ribR.position.set(-0.75 + i * 0.28, 0.15, -0.08);
        ribR.rotation.y = -Math.PI / 2;
        ribCageGroup.add(ribR);
    }
    const internalHeart = new THREE.Mesh(new THREE.DodecahedronGeometry(0.24, 1), xrayOrganMat);
    internalHeart.position.set(0.25, 0.15, 0);
    ribCageGroup.add(internalHeart);
    rig.skeletonGroup.add(ribCageGroup);

    // Bassin & Fémurs
    const pelvis = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.42, 0.78), xrayCyanMat);
    pelvis.position.set(-0.65, 0.05, 0);
    rig.skeletonGroup.add(pelvis);
    [-0.36, 0.36].forEach(zOff => {
        const femur = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.07, 1.1, 8), xrayBoneMat);
        femur.position.set(-0.55, -0.6, zOff);
        rig.skeletonGroup.add(femur);
    });

    // Crâne anatomique + Mâchoire + Orbites
    const skullBoneGroup = new THREE.Group();
    skullBoneGroup.position.set(1.45, 0.78, 0);
    const cranium = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.48, 0.58), xraySkullMat);
    const jawBone = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.2, 0.5), xraySkullMat);
    jawBone.position.set(0.04, -0.32, 0);
    const eyeSocketL = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), xrayOrganMat);
    eyeSocketL.position.set(0.15, 0.08, 0.28);
    const eyeSocketR = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), xrayOrganMat);
    eyeSocketR.position.set(0.15, 0.08, -0.28);
    skullBoneGroup.add(cranium, jawBone, eyeSocketL, eyeSocketR);
    rig.skeletonGroup.add(skullBoneGroup);

    rig.xrayParts = {
        skullGroup: skullBoneGroup,
        skullMat: xraySkullMat,
        jawBone,
        ribCageGroup,
        ribMat: xrayRibMat,
        spineGroup,
        spineMat: xraySpineMat,
        heart: internalHeart
    };

    rig.skeletonGroup.visible = false;
    hips.add(rig.skeletonGroup);

    // --- CONSTRUCTION 3D PAR ESPÈCE (MODÈLES BLENDER .GLB UNIQUEMENT) ---
    const reportMissingModel = (err) => {
        if (typeof reportGlbLoadError === 'function') {
            reportGlbLoadError(dino && dino.id, err);
        } else {
            console.error('[ExtinctionFighter] Échec chargement modèle GLB :', err);
        }
    };

    const useBossGlb = Boolean(dino && dino.bossGlbId);
    const glbAssetId = useBossGlb ? dino.bossGlbId : (dino && dino.id);
    const cachedGlb = useBossGlb
        ? ((typeof CAMPAIGN_GLB_CACHE !== 'undefined') ? CAMPAIGN_GLB_CACHE[glbAssetId] : null)
        : ((typeof FIGHTER_GLB_CACHE !== 'undefined' && glbAssetId) ? FIGHTER_GLB_CACHE[glbAssetId] : null);

    if (cachedGlb && typeof hydrateRigFromGLB === 'function') {
        if (!hydrateRigFromGLB(rig, dino, skin, cachedGlb)) {
            reportMissingModel(new Error(`Hydratation GLB impossible pour "${glbAssetId}"`));
        }
    } else {
        // Nommage standardisé et pose de repos initiale en attendant l'hydratation GLB asynchrone
        root.name = 'Bone_Root';
        hips.name = 'Bone_Hips';
        rig.torso.name = 'Bone_Torso';
        rig.neck.name = 'Bone_Neck';
        rig.headGroup.name = 'Bone_Head';
        rig.jaw.name = 'Bone_Jaw';

        rig.restPose = {
            hipsPos: hips.position.clone(),
            torsoPos: rig.torso.position.clone(),
            neckPos: rig.neck.position.clone(),
            headPos: rig.headGroup.position.clone(),
            jawPos: rig.jaw.position.clone(),
            armsPos: [],
            legsPos: [],
            tailPos: [],
            neckSegmentsPos: null
        };

        const glbLoaderFn = useBossGlb
            ? (typeof loadCampaignGLB === 'function' ? loadCampaignGLB : null)
            : (typeof loadFighterGLB === 'function' ? loadFighterGLB : null);

        if (!glbLoaderFn || typeof hydrateRigFromGLB !== 'function' || !glbAssetId) {
            reportMissingModel(new Error(`Chargeur GLB indisponible pour "${glbAssetId}"`));
        } else {
            glbLoaderFn(glbAssetId).then((gltf) => {
                if (!rig._isGlbHydrated) {
                    const ok = hydrateRigFromGLB(rig, dino, skin, gltf);
                    if (!ok) {
                        reportMissingModel(new Error(`Hydratation GLB impossible pour "${glbAssetId}"`));
                    }
                }
            }).catch((err) => {
                reportMissingModel(err);
            });
        }
    }

    root.scale.setScalar(dino.scale);
    return rig;
}
