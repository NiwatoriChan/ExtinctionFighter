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

    // Sol principal de l'arène
    const stageGeo = new THREE.BoxGeometry(32, 2.2, 12);
    const stageMat = new THREE.MeshStandardMaterial({ color: floorColor, roughness: 0.75, metalness: 0.2 });
    const stageMesh = new THREE.Mesh(stageGeo, stageMat);
    stageMesh.position.set(0, -1.1, 0);
    stageMesh.receiveShadow = true;
    group.add(stageMesh);

    // Bordure lumineuse d'énergie tellurique
    const rimGeo = new THREE.BoxGeometry(32.2, 0.22, 12.2);
    const rimMat = new THREE.MeshBasicMaterial({ color: accentColor });
    const rimMesh = new THREE.Mesh(rimGeo, rimMat);
    rimMesh.position.set(0, -0.02, 0);
    group.add(rimMesh);

    // Éléments de décor 3D spécifiques de l'arène
    if (arena && arena.buildDecor) {
        // Temporairement affecter arenaGroup à group si customGroup est passé
        const oldArenaGroup = arenaGroup;
        arenaGroup = group;
        arena.buildDecor();
        arenaGroup = oldArenaGroup;
    }
}
