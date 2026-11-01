/* ============================================================================
 * ARÈNE : ⚡ Canyon de l'Orage Primordial (Pluie & Foudre)
 * ============================================================================ */

registerArena({
    id: 'storm',
    label: "⚡ Canyon de l'Orage Primordial (Pluie & Foudre)",
    skyColor: 0x090d16,
    floorColor: 0x18181b,
    accentColor: 0x38bdf8,

    // Éléments de décor 3D (ajoutés à arenaGroup)
    buildDecor() {
        // Canyon de l'Orage Primordial : Tempête d'éclairs, colonnes de basalte et pluie diluvienne
        const canyonMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.9 });
        for (let x of [-16, -10, 10, 16]) {
            const pillar = new THREE.Mesh(new THREE.BoxGeometry(3.5, 14, 4), canyonMat);
            pillar.position.set(x, 5.5, -9);
            arenaGroup.add(pillar);
        }

        // Gouttes de pluie stylisées 3D
        const rainMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.5 });
        for (let i = 0; i < 35; i++) {
            const drop = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.8, 4), rainMat);
            drop.position.set(-16 + Math.random() * 32, Math.random() * 12, -8 + Math.random() * 8);
            drop.rotation.z = 0.15;
            arenaGroup.add(drop);
        }

        // Arcs d'énergie orageuse
        const lightningGeo = new THREE.CylinderGeometry(0.08, 0.2, 12, 5);
        const lightningMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe });
        const bolt = new THREE.Mesh(lightningGeo, lightningMat);
        bolt.position.set(4, 8, -15);
        bolt.rotation.z = 0.35;
        arenaGroup.add(bolt);
    }
});
