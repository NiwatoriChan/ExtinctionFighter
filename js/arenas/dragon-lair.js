/* ============================================================================
 * ARÈNE : 🐲 L'Antre de Drak'Zul (Caldera Infernale)
 * Arène suprême du Boss Dragon dans la Campagne.
 * ============================================================================ */

registerArena({
    id: 'dragonlair',
    label: "🐲 L'Antre de Drak'Zul (Caldera Infernale)",
    skyColor: 0x1a0505,
    floorColor: 0x0f0505,
    accentColor: 0xef4444,

    // Éléments de décor 3D (ajoutés à arenaGroup)
    buildDecor() {
        // Mer de magma incandescent
        const lavaSea = new THREE.Mesh(
            new THREE.PlaneGeometry(160, 100),
            new THREE.MeshBasicMaterial({ color: 0xb91c1c })
        );
        lavaSea.rotation.x = -Math.PI / 2;
        lavaSea.position.y = -2.2;
        arenaGroup.add(lavaSea);

        // Piliers de basalte noir et cornes de dragon titanesques
        for (let x of [-18, -11, -5, 5, 11, 18]) {
            const pillar = new THREE.Mesh(
                new THREE.ConeGeometry(3.5, 16, 6),
                new THREE.MeshStandardMaterial({ color: 0x0a0a0c, roughness: 0.9 })
            );
            pillar.position.set(x, 6.0, -12);
            arenaGroup.add(pillar);

            // Veines de lave rougeoyante au sommet
            const glow = new THREE.Mesh(
                new THREE.SphereGeometry(1.4, 10, 10),
                new THREE.MeshBasicMaterial({ color: 0xf97316 })
            );
            glow.position.set(x, 14.0, -12);
            arenaGroup.add(glow);
        }

        // Crâne d'Ancien Dragon géant fossilisé en arrière-plan
        const skull = new THREE.Mesh(
            new THREE.BoxGeometry(6.5, 4.2, 5.0),
            new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.7 })
        );
        skull.position.set(0, 8.5, -22);
        skull.rotation.x = 0.2;
        arenaGroup.add(skull);

        // Cornes massives du crâne fossile
        [-3.2, 3.2].forEach(z => {
            const horn = new THREE.Mesh(
                new THREE.ConeGeometry(0.8, 6.5, 6),
                new THREE.MeshStandardMaterial({ color: 0x78350f })
            );
            horn.position.set(z * 1.5, 12.0, -22);
            horn.rotation.z = z > 0 ? -0.45 : 0.45;
            arenaGroup.add(horn);
        });

        // Flammes magmatiques flottantes
        for (let i = 0; i < 8; i++) {
            const flame = new THREE.Mesh(
                new THREE.OctahedronGeometry(0.75, 1),
                new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? 0xf97316 : 0xef4444 })
            );
            flame.position.set(-12 + i * 3.5, 2.5 + (i % 3) * 1.2, -6 - (i % 2) * 4);
            arenaGroup.add(flame);
        }
    }
});
