/* ============================================================================
 * ARÈNE : 🏛️ Citadelle Céleste d'Os (Aurores & Runes)
 * ============================================================================ */

registerArena({
    id: 'boneyard',
    label: "🏛️ Citadelle Céleste d'Os (Aurores & Runes)",
    skyColor: 0x050814,
    floorColor: 0x1e1b4b,
    accentColor: 0x818cf8,

    // Relief d'ossements : tumulus central sacré et dunes de cendres fossiles
    getGroundHeight(x, z = 0) {
        const centralMound = Math.cos(x * 0.28) * 0.48;
        const ribRidges = Math.sin(x * 1.1) * 0.10;
        return centralMound + ribRidges + 0.12;
    },

    // Éléments de décor 3D dynamiques (ajoutés à arenaGroup)
    buildDecor(group, scene) {
        const targetGroup = group || arenaGroup;

        // Citadelle Céleste d'Os : Arches thoraciques colossales de Sauropodes & runes stellaires
        const boneMat = new THREE.MeshStandardMaterial({ color: 0xf4f4f5, roughness: 0.45 });
        const ribs = [];
        for (let x = -14; x <= 14; x += 3.5) {
            const rib = new THREE.Mesh(new THREE.TorusGeometry(6.2, 0.48, 8, 24, Math.PI), boneMat);
            rib.position.set(x, 0, -5.5);
            targetGroup.add(rib);
            ribs.push(rib);
        }

        // Menhirs d'os et obélisques gravés de runes cosmiques
        const obelisks = [];
        const obeliskMat = new THREE.MeshStandardMaterial({
            color: 0x312e81,
            emissive: 0x4338ca,
            emissiveIntensity: 0.45,
            roughness: 0.3
        });
        for (let x of [-15, -9, 9, 15]) {
            const obelisk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.9, 9, 6), obeliskMat);
            obelisk.position.set(x, 4.5, -8);
            targetGroup.add(obelisk);
            obelisks.push(obelisk);
        }

        // Aurores cosmiques flottantes concentriques
        const auroraMat = new THREE.MeshBasicMaterial({ color: 0xa855f7, transparent: true, opacity: 0.38, wireframe: true });
        const aurora1 = new THREE.Mesh(new THREE.TorusGeometry(18, 2.5, 8, 32), auroraMat);
        aurora1.position.set(0, 12, -20);
        aurora1.rotation.x = 0.5;
        targetGroup.add(aurora1);

        const auroraMat2 = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.28, wireframe: true });
        const aurora2 = new THREE.Mesh(new THREE.TorusGeometry(14, 1.8, 8, 28), auroraMat2);
        aurora2.position.set(0, 14, -22);
        aurora2.rotation.x = -0.4;
        targetGroup.add(aurora2);

        // Feux follets astraux flottants (wisps)
        const wisps = [];
        const wispGeo = new THREE.OctahedronGeometry(0.22, 1);
        for (let i = 0; i < 20; i++) {
            const wMat = new THREE.MeshBasicMaterial({
                color: i % 2 === 0 ? 0x818cf8 : 0x38bdf8,
                transparent: true,
                opacity: 0.75
            });
            const wisp = new THREE.Mesh(wispGeo, wMat);
            const baseX = -14 + (i / 20) * 28 + (Math.random() - 0.5) * 2;
            const baseY = 2.0 + Math.random() * 6;
            const baseZ = -5.5 + (Math.random() - 0.5) * 4;
            wisp.position.set(baseX, baseY, baseZ);
            targetGroup.add(wisp);
            wisps.push({ mesh: wisp, baseX, baseY, baseZ, phase: i * 0.5, speed: 0.8 + Math.random() * 0.8 });
        }

        return { obeliskMat, aurora1, aurora2, auroraMat, auroraMat2, wisps };
    },

    // Animation dynamique de la citadelle stellaire
    animate(decor, group, scene, time, dt) {
        if (!decor) return;

        // 1. Rotation et balancement des aurores cosmiques
        if (decor.aurora1) {
            decor.aurora1.rotation.z = time * 0.08;
            decor.aurora1.rotation.y = time * 0.05;
        }
        if (decor.aurora2) {
            decor.aurora2.rotation.z = -time * 0.06;
            decor.aurora2.rotation.y = -time * 0.04;
        }

        // 2. Ondulation de couleur spectrale de l'aurore
        if (decor.auroraMat) {
            const hue = (0.72 + Math.sin(time * 0.2) * 0.12) % 1;
            decor.auroraMat.color.setHSL(hue, 0.85, 0.55);
        }

        // 3. Respiration mystique des obélisques runiques
        if (decor.obeliskMat) {
            decor.obeliskMat.emissiveIntensity = 0.35 + Math.sin(time * 2.5) * 0.25;
        }

        // 4. Lévitation ondulatoire des feux follets astraux
        if (decor.wisps) {
            decor.wisps.forEach(w => {
                w.mesh.position.y = w.baseY + Math.sin(time * w.speed + w.phase) * 1.2;
                w.mesh.position.x = w.baseX + Math.cos(time * 0.7 + w.phase) * 0.6;
                w.mesh.rotation.y += dt * 2.0;
                w.mesh.rotation.x += dt * 1.5;
            });
        }
    }
});
