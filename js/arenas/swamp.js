/* ============================================================================
 * ARÈNE : 🍄 Abysse Fongique Toxique (Bioluminescence)
 * ============================================================================ */

registerArena({
    id: 'swamp',
    label: "🍄 Abysse Fongique Toxique (Bioluminescence)",
    skyColor: 0x021f15,
    floorColor: 0x052e16,
    accentColor: 0x22c55e,

    // Éléments de décor 3D (ajoutés à arenaGroup)
    buildDecor() {
        // Abysse Fongique Toxique : Champignons géants bioluminescents et brume d'acide
        const swampMat = new THREE.MeshBasicMaterial({ color: 0x052e16 });
        const swampPlane = new THREE.Mesh(new THREE.PlaneGeometry(160, 100), swampMat);
        swampPlane.rotation.x = -Math.PI / 2;
        swampPlane.position.y = -2.1;
        arenaGroup.add(swampPlane);

        // Champignons géants luminescents
        for (let x of [-13, -7, 6, 14]) {
            const stem = new THREE.Mesh(
                new THREE.CylinderGeometry(0.45, 0.7, 5, 8),
                new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.8 })
            );
            stem.position.set(x, 2.2, -7);
            arenaGroup.add(stem);

            const cap = new THREE.Mesh(
                new THREE.ConeGeometry(2.4, 1.6, 12),
                new THREE.MeshStandardMaterial({
                    color: 0x22c55e,
                    emissive: 0x16a34a,
                    emissiveIntensity: 0.75
                })
            );
            cap.position.set(x, 4.8, -7);
            arenaGroup.add(cap);
        }

        // Bulles d'acide en suspension
        for (let i = 0; i < 8; i++) {
            const bubble = new THREE.Mesh(
                new THREE.SphereGeometry(0.45, 8, 8),
                new THREE.MeshBasicMaterial({ color: 0xa3e635, transparent: true, opacity: 0.75 })
            );
            bubble.position.set(-11 + i * 3.2, 1.8 + (i % 4) * 0.9, -4 - (i % 3) * 2);
            arenaGroup.add(bubble);
        }
    }
});
