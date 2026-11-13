// 6. SCÈNES THREE.JS : APERÇUS DE SÉLECTION & ARÈNE DE COMBAT 3D
let battleRenderer = null;
let battleScene = null;
let battleCamera = null;
let arenaGroup = null;
let fxGroup = null;

// Contrôle caméra souris
let isDraggingCam = false;
let prevMouse = { x: 0, y: 0 };
let camOrbit = { yaw: 0, pitch: 0.12 };
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
        battleRenderer.toneMappingExposure = bloomAllowed ? 1.12 : 0.92;
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

    const ambLight = new THREE.AmbientLight(0xffffff, 0.65);
    battleScene.add(ambLight);

    const sunLight = new THREE.DirectionalLight(0xfff7ed, 1.35);
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

    const rimLight = new THREE.PointLight(0xef4444, 1.2, 35);
    rimLight.position.set(0, 6, -8);
    battleScene.add(rimLight);

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

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(48, 16 / 9, 0.1, 250);
    camera.position.set(0, 4.5, 14.5);
    camera.lookAt(0, 1.2, 0);

    const ambLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambLight);

    const sunLight = new THREE.DirectionalLight(0xffedd5, 1.25);
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

function renderBattle3D(now) {
    if (!battleRenderer || !fighter1) return;
    if (!fighter2 && matchState !== 'campaign_level' && matchState !== 'campaign_victory') return;
    const canvas = document.getElementById('battleCanvas');
    if (_battleCanvasNeedsResize || canvas.width < 10) {
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

    // Calcul de la caméra dynamique (Zoom X-Ray, Zoom Fatalité, Relief & Plateformes ou Orbit utilisateur)
    const f2Pos = (fighter2 && !fighter2.isDead) 
        ? { x: fighter2.x, y: fighter2.y } 
        : (typeof campaignActiveMinions !== 'undefined' && campaignActiveMinions && campaignActiveMinions[0] 
            ? { x: campaignActiveMinions[0].x, y: campaignActiveMinions[0].y } 
            : { x: fighter1.x + (fighter1.facing * 4.5), y: fighter1.y });

    const midX = (fighter1.x + f2Pos.x) * 0.5;
    const midY = ((fighter1.y || 0) + (f2Pos.y || 0)) * 0.5;
    const dist = Math.abs(fighter1.x - f2Pos.x);
    const vertSpan = Math.abs((fighter1.y || 0) - (f2Pos.y || 0));
    let targetDist = Math.max(10.5, Math.min(24.0, dist * 1.05 + vertSpan * 0.65 + 6.5));
    let targetY = 3.6 + midY * 0.65 + camOrbit.pitch * 8;
    let focusX = midX;
    let focusY = 2.1 + midY * 0.75;

    if (xrayCinematicTimer > 0) {
        targetDist = 5.4;
        const xTarget = fighter1.isXrayTarget ? fighter1 : fighter2;
        const baseY = xTarget.y || 0;
        targetY = baseY + (xrayStage === 1 ? 2.9 : (xrayStage === 2 ? 2.2 : 2.5));
        focusX = xTarget.x;
        focusY = targetY - 0.3;
    } else if (matchState === 'fatality_anim' && fatalityFocusFighter) {
        targetDist = 7.4;
        targetY = 2.8 + midY * 0.7;
        focusX = (fighter1.x + fighter2.x) * 0.5;
        focusY = 2.1 + midY * 0.75;
    }

    const shakeMult = (typeof window !== 'undefined' && typeof window.screenShakeMultiplier === 'number')
        ? Math.max(0, window.screenShakeMultiplier)
        : 1.0;
    const shakeX = (Math.random() - 0.5) * screenShake * shakeMult;
    const shakeY = (Math.random() - 0.5) * screenShake * shakeMult;

    const camX = focusX + Math.sin(camOrbit.yaw) * targetDist + shakeX;
    const camZ = Math.cos(camOrbit.yaw) * targetDist;

    battleCamera.position.x += (camX - battleCamera.position.x) * 0.14;
    battleCamera.position.y += (targetY + shakeY - battleCamera.position.y) * 0.14;
    battleCamera.position.z += (camZ - battleCamera.position.z) * 0.14;
    battleCamera.lookAt(focusX, focusY, 0);

    battleRenderer.render(battleScene, battleCamera);
}
