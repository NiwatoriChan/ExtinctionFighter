/* ============================================================================
 * ARÈNE : 🏛️ Citadelle Céleste d'Os (Aurores & Runes)
 * ============================================================================ */

registerArena({
    id: 'boneyard',
    label: "🏛️ Citadelle Céleste d'Os (Aurores & Runes)",
    skyColor: 0x050814,
    floorColor: 0x1e1b4b,
    accentColor: 0x818cf8,

    // Éléments de décor 3D (ajoutés à arenaGroup)
    buildDecor() {
        // Citadelle Céleste d'Os : Arches thoraciques colossales de Sauropodes & runes stellaires
        const boneMat = new THREE.MeshStandardMaterial({ color: 0xf4f4f5, roughness: 0.45 });
        for (let x = -14; x <= 14; x += 3.5) {
            const rib = new THREE.Mesh(new THREE.TorusGeometry(6.2, 0.48, 8, 24, Math.PI), boneMat);
            rib.position.set(x, 0, -5.5);
            arenaGroup.add(rib);
        }
        // Menhirs d'os et obélisques gravés
        for (let x of [-15, -9, 9, 15]) {
            const obelisk = new THREE.Mesh(
                new THREE.CylinderGeometry(0.3, 0.9, 9, 6),
                new THREE.MeshStandardMaterial({ color: 0x312e81, emissive: 0x4338ca, emissiveIntensity: 0.4 })
            );
            obelisk.position.set(x, 4.5, -8);
            arenaGroup.add(obelisk);
        }
        // Aurores cosmiques flottantes
        const auroraMat = new THREE.MeshBasicMaterial({ color: 0xa855f7, transparent: true, opacity: 0.35, wireframe: true });
        const auroraMesh = new THREE.Mesh(new THREE.TorusGeometry(18, 2.5, 8, 32), auroraMat);
        auroraMesh.position.set(0, 12, -20);
        auroraMesh.rotation.x = 0.5;
        arenaGroup.add(auroraMesh);
    }
});
