/* ============================================================================
 * ARÈNE : 🍄 Abysse Fongique Toxique (Bioluminescence)
 * ============================================================================ */

registerArena({
    id: 'swamp',
    label: "🍄 Abysse Fongique Toxique (Bioluminescence)",
    skyColor: 0x021f15,
    floorColor: 0x052e16,
    accentColor: 0x22c55e,

    // Éléments de décor 3D dynamiques (ajoutés à arenaGroup)
    buildDecor(group, scene) {
        const targetGroup = group || arenaGroup;

        // Abysse Fongique Toxique : Sol marécageux d'acide sombre
        const swampMat = new THREE.MeshStandardMaterial({
            color: 0x052e16,
            roughness: 0.4,
            emissive: 0x064e3b,
            emissiveIntensity: 0.35
        });
        const swampPlane = new THREE.Mesh(new THREE.PlaneGeometry(160, 100), swampMat);
        swampPlane.rotation.x = -Math.PI / 2;
        swampPlane.position.y = -2.1;
        targetGroup.add(swampPlane);

        // Champignons géants luminescents avec respiration organique
        const mushrooms = [];
        const mushroomPositions = [-14, -8, 5, 13];
        mushroomPositions.forEach((x, idx) => {
            const mGroup = new THREE.Group();

            const stem = new THREE.Mesh(
                new THREE.CylinderGeometry(0.45, 0.75, 5, 8),
                new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.85 })
            );
            stem.position.set(0, 2.2, 0);
            mGroup.add(stem);

            const capMat = new THREE.MeshStandardMaterial({
                color: idx % 2 === 0 ? 0x22c55e : 0x10b981,
                emissive: 0x16a34a,
                emissiveIntensity: 0.75,
                roughness: 0.35
            });
            const cap = new THREE.Mesh(new THREE.ConeGeometry(2.4, 1.6, 12), capMat);
            cap.position.set(0, 4.8, 0);
            mGroup.add(cap);

            // Point lumineux doux pour chaque champignon géant
            const pLight = new THREE.PointLight(0x22c55e, 0.9, 12);
            pLight.position.set(0, 5.2, 0);
            mGroup.add(pLight);

            mGroup.position.set(x, 0, -7);
            targetGroup.add(mGroup);
            mushrooms.push({ group: mGroup, cap, capMat, pLight, phase: idx * 1.2 });
        });

        // Bulles d'acide en lévitation dynamique et éclatement
        const bubbles = [];
        const bubbleGeo = new THREE.SphereGeometry(0.38, 8, 8);
        const bubbleMat = new THREE.MeshBasicMaterial({
            color: 0xa3e635,
            transparent: true,
            opacity: 0.75
        });

        for (let i = 0; i < 22; i++) {
            const bubble = new THREE.Mesh(bubbleGeo, bubbleMat);
            const startX = -15 + Math.random() * 30;
            const startZ = -4 - Math.random() * 8;
            bubble.position.set(startX, -1.8 + Math.random() * 8, startZ);
            targetGroup.add(bubble);
            bubbles.push({
                mesh: bubble,
                startX,
                startZ,
                speedY: 1.2 + Math.random() * 1.8,
                wobbleSpeed: 2 + Math.random() * 3,
                phase: Math.random() * Math.PI * 2,
                maxHeight: 6.5 + Math.random() * 3
            });
        }

        // Spores toxiques bioluminescentes en suspension
        const spores = [];
        const sporeMat = new THREE.MeshBasicMaterial({ color: 0x4ade80, transparent: true, opacity: 0.65 });
        const sporeGeo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
        for (let i = 0; i < 30; i++) {
            const spore = new THREE.Mesh(sporeGeo, sporeMat);
            const x = -16 + Math.random() * 32;
            const y = 0.5 + Math.random() * 5.5;
            const z = -2 - Math.random() * 8;
            spore.position.set(x, y, z);
            targetGroup.add(spore);
            spores.push({ mesh: spore, x, y, z, speed: 0.4 + Math.random() * 0.6, phase: i * 0.4 });
        }

        return { swampMat, mushrooms, bubbles, spores };
    },

    // Animation dynamique du marais toxique
    animate(decor, group, scene, time, dt) {
        if (!decor) return;

        // 1. Respiration des champignons bioluminescents
        if (decor.mushrooms) {
            decor.mushrooms.forEach(m => {
                const pulse = 1.0 + Math.sin(time * 2.2 + m.phase) * 0.08;
                m.cap.scale.set(pulse, 1.0 / pulse, pulse);
                m.capMat.emissiveIntensity = 0.6 + Math.sin(time * 2.5 + m.phase) * 0.35;
                if (m.pLight) m.pLight.intensity = 0.8 + Math.sin(time * 2.5 + m.phase) * 0.3;
            });
        }

        // 2. Ascension continue et ondulation des bulles d'acide
        if (decor.bubbles) {
            decor.bubbles.forEach(b => {
                b.mesh.position.y += b.speedY * dt;
                b.mesh.position.x = b.startX + Math.sin(time * b.wobbleSpeed + b.phase) * 0.45;

                // Si la bulle atteint sa hauteur maximale : éclatement et réapparition au fond
                if (b.mesh.position.y > b.maxHeight) {
                    b.mesh.position.y = -1.8;
                    b.startX = -15 + Math.random() * 30;
                }
            });
        }

        // 3. Tourbillonnement lent des spores toxiques
        if (decor.spores) {
            decor.spores.forEach(s => {
                s.mesh.position.x += Math.sin(time * s.speed + s.phase) * 0.025;
                s.mesh.position.y += Math.cos(time * 0.8 + s.phase) * 0.015;
                s.mesh.rotation.y += dt * 1.5;
            });
        }
    }
});
