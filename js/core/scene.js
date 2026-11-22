// 6. SCÈNES THREE.JS : APERÇUS DE SÉLECTION & ARÈNE DE COMBAT 3D
let battleRenderer = null;
let battleScene = null;
let battleCamera = null;
let battleLights = null;
let arenaGroup = null;
let fxGroup = null;

// Contrôle caméra souris & timing rendu indépendant du framerate
let isDraggingCam = false;
let prevMouse = { x: 0, y: 0 };
let camOrbit = { yaw: 0, pitch: 0.12 };
let _lastBattleRenderNow = 0;
let _camLookX = 0;
let _camLookY = 2.1;
let _camLookInitialized = false;
let _battleCanvasNeedsResize = true;
let _arenaPreviewNeedsResize = true;

window.addEventListener('resize', () => {
    _battleCanvasNeedsResize = true;
    _arenaPreviewNeedsResize = true;
});

// Gestion des paramètres graphiques (Faible / Moyen / Élevé / Ultra)
function applyGraphicsSettings(quality) {
    graphicsQuality = quality;
    try { localStorage.setItem('ek3d_graphics_quality', quality); } catch (_) {}

    const scaleMult = (typeof window !== 'undefined' && typeof window.renderScaleMultiplier === 'number')
        ? Math.max(0.5, Math.min(1.0, window.renderScaleMultiplier))
        : 1.0;
    const shadowsAllowed = (typeof window === 'undefined' || window.shadowMapsEnabled !== false);
    const bloomAllowed = (typeof window === 'undefined' || window.bloomGlowEnabled !== false);

    if (battleRenderer) {
        if (quality === 'low') {
            battleRenderer.setPixelRatio(Math.max(0.5, 1 * scaleMult));
            battleRenderer.shadowMap.enabled = false;
        } else if (quality === 'medium') {
            battleRenderer.setPixelRatio(Math.max(0.5, 1.25 * scaleMult));
            battleRenderer.shadowMap.enabled = shadowsAllowed;
            battleRenderer.shadowMap.type = THREE.BasicShadowMap;
        } else if (quality === 'high') {
            battleRenderer.setPixelRatio(Math.max(0.5, Math.min(window.devicePixelRatio || 1, 1.75) * scaleMult));
            battleRenderer.shadowMap.enabled = shadowsAllowed;
            battleRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
        } else if (quality === 'ultra') {
            battleRenderer.setPixelRatio(Math.max(0.5, Math.min(window.devicePixelRatio || 1, 2.0) * scaleMult));
            battleRenderer.shadowMap.enabled = shadowsAllowed;
            battleRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
        }
        battleRenderer.outputEncoding = THREE.sRGBEncoding;
        battleRenderer.toneMapping = THREE.ACESFilmicToneMapping;
        battleRenderer.toneMappingExposure = bloomAllowed ? 1.02 : 0.90;
        battleRenderer.shadowMap.needsUpdate = true;
    }
}

function initBattle3DScene() {
    _battleCanvasNeedsResize = true;
    if (battleRenderer) return;
    const canvas = document.getElementById('battleCanvas');
    battleRenderer = new THREE.WebGLRenderer({
        canvas,
        antialias: graphicsQuality !== 'low',
        powerPreference: 'high-performance'
    });
    applyGraphicsSettings(graphicsQuality);

    battleScene = new THREE.Scene();
    battleCamera = new THREE.PerspectiveCamera(45, 2, 0.1, 250);

    const ambLight = new THREE.AmbientLight(0xffffff, 0.38);
    battleScene.add(ambLight);

    const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x3f352c, 0.55);
    battleScene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfff7ed, 1.20);
    sunLight.position.set(8, 18, 12);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 2;
    sunLight.shadow.camera.far = 42;
    sunLight.shadow.camera.left = -15;
    sunLight.shadow.camera.right = 15;
    sunLight.shadow.camera.top = 10;
    sunLight.shadow.camera.bottom = -4;
    battleScene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0xd8e2ec, 0.50);
    rimLight.position.set(0, 6, -8);
    battleScene.add(rimLight);

    battleLights = {
        amb: ambLight,
        hemi: hemiLight,
        sun: sunLight,
        rim: rimLight,
        base: {
            amb: 0.38,
            hemi: 0.55,
            sun: 1.20,
            rim: 0.50
        }
    };

    arenaGroup = new THREE.Group();
    fxGroup = new THREE.Group();
    battleScene.add(arenaGroup);
    battleScene.add(fxGroup);

    if (typeof UIKit !== 'undefined' && UIKit.Root) {
        const battleUIRoot = new UIKit.Root({
            camera: battleCamera,
            renderer: battleRenderer,
            pixelSize: 0.01,
            sizeX: 16,
            sizeY: 9
        });
        battleScene.add(battleUIRoot);
        window.battleUIKitRoot = battleUIRoot;
    }

    // Événements souris pour tourner la caméra 3D
    canvas.addEventListener('mousedown', (e) => {
        isDraggingCam = true;
        prevMouse = { x: e.clientX, y: e.clientY };
    });
    window.addEventListener('mouseup', () => { isDraggingCam = false; });
    window.addEventListener('mousemove', (e) => {
        if (!isDraggingCam) return;
        const dx = e.clientX - prevMouse.x;
        const dy = e.clientY - prevMouse.y;
        prevMouse = { x: e.clientX, y: e.clientY };
        camOrbit.yaw = Math.max(-0.85, Math.min(0.85, camOrbit.yaw - dx * 0.005));
        camOrbit.pitch = Math.max(0.02, Math.min(0.55, camOrbit.pitch + dy * 0.004));
    });
}

// 7. APERÇU 3D EN DIRECT POUR LE SÉLECTEUR D'ARÈNE
let arenaPreview = {
    renderer: null,
    scene: null,
    camera: null,
    group: null,
    arenaId: null
};

function setupArenaPreview(canvasId = 'arenaPreviewCanvas') {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(48, 16 / 9, 0.1, 250);
    camera.position.set(0, 4.5, 14.5);
    camera.lookAt(0, 1.2, 0);

    const ambLight = new THREE.AmbientLight(0xffffff, 0.45);
    scene.add(ambLight);

    const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x3f352c, 0.45);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xffedd5, 1.15);
    sunLight.position.set(8, 16, 10);
    scene.add(sunLight);

    const group = new THREE.Group();
    scene.add(group);

    if (typeof UIKit !== 'undefined' && UIKit.Root) {
        const previewUIRoot = new UIKit.Root({
            camera: camera,
            renderer: renderer,
            pixelSize: 0.01,
            sizeX: 12,
            sizeY: 7
        });
        scene.add(previewUIRoot);
        arenaPreview.uikitRoot = previewUIRoot;
    }

    arenaPreview.renderer = renderer;
    arenaPreview.scene = scene;
    arenaPreview.camera = camera;
    arenaPreview.group = group;
}

function updateArenaPreview(time) {
    const arenaScreen = document.getElementById('arenaScreen');
    if (!arenaScreen || arenaScreen.classList.contains('hidden')) return;

    if (!arenaPreview.renderer) setupArenaPreview('arenaPreviewCanvas');
    if (!arenaPreview.renderer) return;

    const canvas = document.getElementById('arenaPreviewCanvas');
    if (!canvas || !canvas.parentElement) return;

    if (_arenaPreviewNeedsResize || canvas.width < 10) {
        const rect = canvas.parentElement.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
            _arenaPreviewNeedsResize = false;
            if (canvas.width !== Math.floor(rect.width) || canvas.height !== Math.floor(rect.height)) {
                arenaPreview.renderer.setSize(rect.width, rect.height, false);
                arenaPreview.camera.aspect = rect.width / rect.height;
                arenaPreview.camera.updateProjectionMatrix();
            }
        }
    }

    if (arenaPreview.arenaId !== currentArena) {
        buildArena3D(currentArena, arenaPreview.group, arenaPreview.scene);
        arenaPreview.arenaId = currentArena;
    }

    // Légère rotation panoramique atmosphérique pour la prévisualisation
    if (arenaPreview.camera) {
        const orbitAngle = Math.sin(time * 0.0004) * 0.22;
        arenaPreview.camera.position.x = Math.sin(orbitAngle) * 14.5;
        arenaPreview.camera.position.z = Math.cos(orbitAngle) * 14.5;
        arenaPreview.camera.position.y = 4.2 + Math.cos(time * 0.0006) * 0.6;
        arenaPreview.camera.lookAt(0, 1.5, 0);
    }

    // Animation dynamique du décor dans l'aperçu de l'arène
    if (typeof updateArenaDynamics === 'function' && arenaPreview.group) {
        updateArenaDynamics(currentArena, arenaPreview.group, arenaPreview.scene, time * 0.001, 0.016);
    }

    arenaPreview.renderer.render(arenaPreview.scene, arenaPreview.camera);
}

function resetBattleLighting() {
    if (!battleLights || !battleLights.base) return;
    if (battleLights.amb) battleLights.amb.intensity = battleLights.base.amb;
    if (battleLights.hemi) battleLights.hemi.intensity = battleLights.base.hemi;
    if (battleLights.sun) battleLights.sun.intensity = battleLights.base.sun;
    if (battleLights.rim) battleLights.rim.intensity = battleLights.base.rim;
}

function renderBattle3D(now) {
    if (!battleRenderer || !fighter1) return;
    if (!fighter2 && matchState !== 'campaign_level' && matchState !== 'campaign_victory') return;
    const canvas = document.getElementById('battleCanvas');
    if (canvas && canvas.parentElement && (_battleCanvasNeedsResize || canvas.width < 10)) {
        const rect = canvas.parentElement.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
            _battleCanvasNeedsResize = false;
            if (canvas.width !== Math.floor(rect.width) || canvas.height !== Math.floor(rect.height)) {
                battleRenderer.setSize(rect.width, rect.height, false);
                battleCamera.aspect = rect.width / rect.height;
                battleCamera.updateProjectionMatrix();
            }
        }
    }

    // Calcul du rDt réel de rendu (clamped 0.001..0.05) pour une caméra indépendante du framerate
    const renderNow = (typeof now === 'number' && Number.isFinite(now))
        ? now
        : (typeof performance !== 'undefined' && performance.now ? performance.now() : 0);
    let rDt = 0.016;
    if (_lastBattleRenderNow > 0 && renderNow > _lastBattleRenderNow) {
        rDt = (renderNow - _lastBattleRenderNow) * 0.001;
    }
    _lastBattleRenderNow = renderNow;
    rDt = Math.max(0.001, Math.min(0.05, rDt));

    // Cadrage de base entre les combattants (ou premier sbire en Campagne)
    const hasActiveCampaignMinion = (typeof matchState !== 'undefined' && matchState === 'campaign_level' &&
        typeof campaignActiveMinions !== 'undefined' && campaignActiveMinions && campaignActiveMinions.length > 0);
    const f2Pos = (fighter2 && (!fighter2.isDead || !hasActiveCampaignMinion))
        ? { x: fighter2.x, y: fighter2.y || 0 }
        : (hasActiveCampaignMinion
            ? { x: campaignActiveMinions[0].x, y: campaignActiveMinions[0].y || 0 }
            : { x: fighter1.x + ((fighter1.facing || 1) * 4.5), y: fighter1.y || 0 });

    const midX = (fighter1.x + f2Pos.x) * 0.5;
    const midY = ((fighter1.y || 0) + (f2Pos.y || 0)) * 0.5;
    const dist = Math.abs(fighter1.x - f2Pos.x);
    const vertSpan = Math.abs((fighter1.y || 0) - (f2Pos.y || 0));
    let targetDist = Math.max(10.5, Math.min(24.0, dist * 1.05 + vertSpan * 0.65 + 6.5));
    let targetY = 3.6 + midY * 0.65 + camOrbit.pitch * 8;
    let focusX = midX;
    let focusY = 2.1 + midY * 0.75;
    let activeYaw = camOrbit.yaw;
    let isTightFraming = false;

    const activeSuper = (typeof superState !== 'undefined') ? superState : null;
    const koTimer = (typeof koSlowMoTimer === 'number') ? koSlowMoTimer : 0;
    const koData = (typeof koPendingData !== 'undefined') ? koPendingData : null;

    // Intensités lumineuses cibles (assombrissement dramatique pendant Super Flash / Climax)
    let lightMult = { amb: 1.0, hemi: 1.0, sun: 1.0, rim: 1.0 };
    let isLightDimmed = false;

    if (activeSuper && activeSuper.phase === 'flash') {
        // SUPER FLASH : gros plan serré sur l'attaquant + assombrissement dramatique de l'arène
        const att = activeSuper.attacker || fighter1;
        const attY = att.y || 0;
        const dir = att.facing || 1;
        targetDist = 5.8;
        focusX = att.x + dir * 0.45;
        focusY = attY + 2.05;
        targetY = attY + 2.35;
        activeYaw = dir * 0.28;
        isTightFraming = true;
        lightMult = { amb: 0.42, hemi: 0.48, sun: 0.45, rim: 1.25 };
        isLightDimmed = true;
    } else if (activeSuper && activeSuper.phase === 'cinematic') {
        // SUPER CINÉMATIQUE : 3 angles dynamiques pilotés par superState.beat
        const att = activeSuper.attacker || fighter1;
        const def = activeSuper.defender || fighter2 || att;
        const beat = activeSuper.beat || 1;
        const dir = att.facing || 1;
        const sMidX = (att.x + def.x) * 0.5;
        const sMidY = ((att.y || 0) + (def.y || 0)) * 0.5;
        isTightFraming = true;
        lightMult = { amb: 0.72, hemi: 0.78, sun: 0.80, rim: 1.15 };
        isLightDimmed = true;

        if (beat <= 1) {
            // Beat 1 : choc latéral serré
            targetDist = 6.2;
            activeYaw = dir * 0.22;
            focusX = sMidX;
            focusY = sMidY + 1.95;
            targetY = sMidY + 2.6;
        } else if (beat === 2) {
            // Beat 2 : contre-champ oblique surélevé
            targetDist = 7.0;
            activeYaw = -dir * 0.42;
            focusX = def.x * 0.6 + att.x * 0.4;
            focusY = sMidY + 2.0;
            targetY = sMidY + 4.1;
        } else {
            // Beat 3 : plan large en retrait pour l'éjection finale
            targetDist = 9.2;
            activeYaw = dir * 0.14;
            focusX = sMidX + dir * 0.6;
            focusY = sMidY + 2.15;
            targetY = sMidY + 3.2;
        }
    } else if (activeSuper && activeSuper.phase === 'active_aoe') {
        // SUPER BEAM / SEISMIC / DIVE AOE : cadrage large spectaculaire
        targetDist = Math.max(targetDist, 14.5);
        targetY = Math.max(targetY, 4.2 + midY * 0.65);
        lightMult = { amb: 0.78, hemi: 0.84, sun: 0.86, rim: 1.12 };
        isLightDimmed = true;
    } else if (koTimer > 0 && koData && koData.loser) {
        // SLOW-MO K.O. / EXTINCTION FINISH : zoom serré en légère contre-plongée sur le vaincu
        const loser = koData.loser;
        const loserY = loser.y || 0;
        targetDist = 7.2;
        focusX = loser.x;
        focusY = loserY + 1.65;
        targetY = loserY + 1.95;
        activeYaw = -(loser.facing || 1) * 0.24;
        isTightFraming = true;
        if (koData.isExtinctionFinish) {
            lightMult = { amb: 0.62, hemi: 0.68, sun: 0.70, rim: 1.30 };
            isLightDimmed = true;
        }
    }

    // Clamp doux du focusX à l'intérieur des bornes de l'arène pour préserver le cadrage près des coins
    const stageBounds = (typeof getStageBounds3D === 'function')
        ? getStageBounds3D()
        : {
            left: (typeof STAGE_LEFT_3D !== 'undefined') ? STAGE_LEFT_3D : -11.0,
            right: (typeof STAGE_RIGHT_3D !== 'undefined') ? STAGE_RIGHT_3D : 11.0
        };
    const stageSpan = Math.max(0, stageBounds.right - stageBounds.left);
    const camMargin = isTightFraming
        ? Math.min(0.65, stageSpan * 0.05)
        : Math.min(2.2, stageSpan * 0.14);
    focusX = Math.max(stageBounds.left + camMargin, Math.min(stageBounds.right - camMargin, focusX));

    // Interpolation fluide des lumières d'arène (dim rapide sur Flash, restauration douce à 1 - exp(-8 * rDt))
    if (battleLights && battleLights.base) {
        const lightAlpha = 1 - Math.exp(-(isLightDimmed ? 16 : 8) * rDt);
        const b = battleLights.base;
        if (battleLights.amb) battleLights.amb.intensity += (b.amb * lightMult.amb - battleLights.amb.intensity) * lightAlpha;
        if (battleLights.hemi) battleLights.hemi.intensity += (b.hemi * lightMult.hemi - battleLights.hemi.intensity) * lightAlpha;
        if (battleLights.sun) battleLights.sun.intensity += (b.sun * lightMult.sun - battleLights.sun.intensity) * lightAlpha;
        if (battleLights.rim) battleLights.rim.intensity += (b.rim * lightMult.rim - battleLights.rim.intensity) * lightAlpha;
    }

    const shakeMult = (typeof window !== 'undefined' && typeof window.screenShakeMultiplier === 'number')
        ? Math.max(0, window.screenShakeMultiplier)
        : 1.0;
    const curShake = (typeof screenShake === 'number' && Number.isFinite(screenShake)) ? screenShake : 0;
    const shakeX = (Math.random() - 0.5) * curShake * shakeMult;
    const shakeY = (Math.random() - 0.5) * curShake * shakeMult;

    const recoilX = (typeof camRecoilX === 'number' && Number.isFinite(camRecoilX)) ? camRecoilX : 0;
    const recoilY = (typeof camRecoilY === 'number' && Number.isFinite(camRecoilY)) ? camRecoilY : 0;
    const fovKick = (typeof camFovKick === 'number' && Number.isFinite(camFovKick)) ? camFovKick : 0;

    // FOV impact kick (45° nominal + camFovKick)
    const targetFov = 45 + fovKick;
    if (Math.abs((battleCamera.fov || 45) - targetFov) > 0.005) {
        battleCamera.fov = targetFov;
        if (typeof battleCamera.updateProjectionMatrix === 'function') {
            battleCamera.updateProjectionMatrix();
        }
    }

    const camX = focusX + Math.sin(activeYaw) * targetDist + shakeX + recoilX * shakeMult;
    const camY = targetY + shakeY + recoilY * shakeMult;
    const camZ = Math.cos(activeYaw) * targetDist;

    const camAlpha = 1 - Math.exp(-9.5 * rDt);
    battleCamera.position.x += (camX - battleCamera.position.x) * camAlpha;
    battleCamera.position.y += (camY - battleCamera.position.y) * camAlpha;
    battleCamera.position.z += (camZ - battleCamera.position.z) * camAlpha;

    if (!_camLookInitialized) {
        _camLookX = focusX;
        _camLookY = focusY;
        _camLookInitialized = true;
    } else {
        const lookAlpha = 1 - Math.exp(-14 * rDt);
        _camLookX += (focusX - _camLookX) * lookAlpha;
        _camLookY += (focusY - _camLookY) * lookAlpha;
    }
    battleCamera.lookAt(_camLookX, _camLookY, 0);

    // Décroissance exponentielle fluide du recul directionnel & FOV kick
    const recoilDecay = Math.exp(-11 * rDt);
    if (typeof camRecoilX === 'number') {
        camRecoilX *= recoilDecay;
        if (Math.abs(camRecoilX) < 0.002) camRecoilX = 0;
    }
    if (typeof camRecoilY === 'number') {
        camRecoilY *= recoilDecay;
        if (Math.abs(camRecoilY) < 0.002) camRecoilY = 0;
    }
    if (typeof camFovKick === 'number') {
        camFovKick *= recoilDecay;
        if (Math.abs(camFovKick) < 0.005) camFovKick = 0;
    }

    battleRenderer.render(battleScene, battleCamera);
}

if (typeof window !== 'undefined') {
    window.resetBattleLighting = resetBattleLighting;
}
