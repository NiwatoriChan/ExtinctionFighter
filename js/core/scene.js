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

// Gestion des paramètres graphiques (Faible / Moyen / Élevé / Ultra)
function applyGraphicsSettings(quality) {
    graphicsQuality = quality;
    localStorage.setItem('ek3d_graphics_quality', quality);

    if (battleRenderer) {
        if (quality === 'low') {
            battleRenderer.setPixelRatio(1);
            battleRenderer.shadowMap.enabled = false;
        } else if (quality === 'medium') {
            battleRenderer.setPixelRatio(1.25);
            battleRenderer.shadowMap.enabled = true;
            battleRenderer.shadowMap.type = THREE.BasicShadowMap;
        } else if (quality === 'high') {
            battleRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
            battleRenderer.shadowMap.enabled = true;
            battleRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
        } else if (quality === 'ultra') {
            battleRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
            battleRenderer.shadowMap.enabled = true;
            battleRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
        }
        battleRenderer.shadowMap.needsUpdate = true;
    }
}

function initBattle3DScene() {
    if (battleRenderer) return;
    const canvas = document.getElementById('battleCanvas');
    battleRenderer = new THREE.WebGLRenderer({ canvas, antialias: graphicsQuality !== 'low' });
    applyGraphicsSettings(graphicsQuality);

    battleScene = new THREE.Scene();
    battleCamera = new THREE.PerspectiveCamera(45, 2, 0.1, 250);

    const ambLight = new THREE.AmbientLight(0xffffff, 0.65);
    battleScene.add(ambLight);

    const sunLight = new THREE.DirectionalLight(0xfff7ed, 1.35);
    sunLight.position.set(8, 18, 12);
    sunLight.castShadow = true;
    battleScene.add(sunLight);

    const rimLight = new THREE.PointLight(0xef4444, 1.2, 35);
    rimLight.position.set(0, 6, -8);
    battleScene.add(rimLight);

    arenaGroup = new THREE.Group();
    fxGroup = new THREE.Group();
    battleScene.add(arenaGroup);
    battleScene.add(fxGroup);

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

    const rect = canvas.parentElement.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
        if (canvas.width !== Math.floor(rect.width) || canvas.height !== Math.floor(rect.height)) {
            arenaPreview.renderer.setSize(rect.width, rect.height, false);
            arenaPreview.camera.aspect = rect.width / rect.height;
            arenaPreview.camera.updateProjectionMatrix();
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
    if (!battleRenderer || !fighter1 || !fighter2) return;
    const canvas = document.getElementById('battleCanvas');
    const rect = canvas.parentElement.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
        if (canvas.width !== Math.floor(rect.width) || canvas.height !== Math.floor(rect.height)) {
            battleRenderer.setSize(rect.width, rect.height, false);
            battleCamera.aspect = rect.width / rect.height;
            battleCamera.updateProjectionMatrix();
        }
    }

    // Calcul de la caméra dynamique (Zoom X-Ray, Zoom Fatalité ou Orbit utilisateur)
    const midX = (fighter1.x + fighter2.x) * 0.5;
    const dist = Math.abs(fighter1.x - fighter2.x);
    let targetDist = Math.max(10.5, Math.min(17.5, dist * 1.15 + 6.5));
    let targetY = 3.6 + camOrbit.pitch * 8;
    let focusX = midX;
    let focusY = 2.1;

    if (xrayCinematicTimer > 0) {
        targetDist = 5.4;
        targetY = xrayStage === 1 ? 2.9 : (xrayStage === 2 ? 2.2 : 2.5);
        const xTarget = fighter1.isXrayTarget ? fighter1 : fighter2;
        focusX = xTarget.x;
        focusY = targetY - 0.3;
    } else if (matchState === 'fatality_anim' && fatalityFocusFighter) {
        targetDist = 7.4;
        targetY = 2.8;
        focusX = (fighter1.x + fighter2.x) * 0.5;
    }

    const shakeX = (Math.random() - 0.5) * screenShake;
    const shakeY = (Math.random() - 0.5) * screenShake;

    const camX = focusX + Math.sin(camOrbit.yaw) * targetDist + shakeX;
    const camZ = Math.cos(camOrbit.yaw) * targetDist;

    battleCamera.position.x += (camX - battleCamera.position.x) * 0.14;
    battleCamera.position.y += (targetY + shakeY - battleCamera.position.y) * 0.14;
    battleCamera.position.z += (camZ - battleCamera.position.z) * 0.14;
    battleCamera.lookAt(focusX, focusY, 0);

    battleRenderer.render(battleScene, battleCamera);
}
