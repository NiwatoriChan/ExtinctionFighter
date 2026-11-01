/* ============================================================================
 * ARÈNE : 🌋 Cratère du Chicxulub (Lave & Météores)
 * ============================================================================ */

registerArena({
    id: 'volcano',
    label: "🌋 Cratère du Chicxulub (Lave & Météores)",
    skyColor: 0x180505,
    floorColor: 0x1c1917,
    accentColor: 0xf97316,

    // Éléments de décor 3D (ajoutés à arenaGroup)
    buildDecor() {
        // Mer de magma en fusion & météores incandescents
        const lavaSea = new THREE.Mesh(
            new THREE.PlaneGeometry(160, 100),
            new THREE.MeshBasicMaterial({ color: 0x991b1b })
        );
        lavaSea.rotation.x = -Math.PI / 2;
        lavaSea.position.y = -2.2;
        arenaGroup.add(lavaSea);

        // Volcans 3D escarpés
        for (let x of [-16, -6, 8, 18]) {
            const cone = new THREE.Mesh(
                new THREE.ConeGeometry(5.5, 11, 8),
                new THREE.MeshStandardMaterial({ color: 0x0c0a09, roughness: 0.95 })
            );
            cone.position.set(x, 4.0, -14);
            arenaGroup.add(cone);
            // Cratère lumineux au sommet du volcan
            const caldera = new THREE.Mesh(
                new THREE.SphereGeometry(1.6, 12, 12),
                new THREE.MeshBasicMaterial({ color: 0xf97316 })
            );
            caldera.position.set(x, 9.5, -14);
            arenaGroup.add(caldera);
        }

        // Gigantesque météore du Chicxulub en flammes
        const meteor = new THREE.Mesh(
            new THREE.SphereGeometry(3.6, 16, 16),
            new THREE.MeshBasicMaterial({ color: 0xf59e0b })
        );
        meteor.position.set(0, 14, -26);
        arenaGroup.add(meteor);

        // Fragments de météores incandescents en orbite
        for (let i = 0; i < 6; i++) {
            const rock = new THREE.Mesh(
                new THREE.DodecahedronGeometry(0.85),
                new THREE.MeshBasicMaterial({ color: 0xef4444 })
            );
            rock.position.set(-10 + i * 4, 8 + (i % 3) * 2, -18);
            arenaGroup.add(rock);
        }
    }
});
