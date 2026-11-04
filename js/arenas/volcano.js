/* ============================================================================
 * ARÈNE : 🌋 Cratère du Chicxulub (Lave & Météores)
 * ============================================================================ */

registerArena({
    id: 'volcano',
    label: "🌋 Cratère du Chicxulub (Lave & Météores)",
    skyColor: 0x180505,
    floorColor: 0x1c1917,
    accentColor: 0xf97316,

    // Relief volcanique : dôme de magma central fracturé, failles latérales et rebords d'obsidienne
    getGroundHeight(x, z = 0) {
        const centralDome = Math.exp(-(x * x) / 9.5) * 0.65;
        const lavaTroughs = -Math.exp(-Math.pow(Math.abs(x) - 5.2, 2) / 4.5) * 0.38;
        const craterRim = Math.pow(Math.min(1, Math.abs(x) / 11.0), 3) * 0.72;
        return centralDome + lavaTroughs + craterRim;
    },

    // Éléments de décor 3D dynamiques (ajoutés à arenaGroup)
    buildDecor(group, scene) {
        const targetGroup = group || arenaGroup;

        // Mer de magma en fusion avec pulsation thermique
        const lavaMat = new THREE.MeshStandardMaterial({
            color: 0x991b1b,
            roughness: 0.35,
            metalness: 0.1,
            emissive: 0x7f1d1d,
            emissiveIntensity: 0.65
        });
        const lavaSea = new THREE.Mesh(new THREE.PlaneGeometry(160, 100, 16, 16), lavaMat);
        lavaSea.rotation.x = -Math.PI / 2;
        lavaSea.position.y = -2.2;
        targetGroup.add(lavaSea);

        // Volcans 3D escarpés avec calderas lumineuses et sources de lumière
        const calderas = [];
        const calderaLights = [];
        const coneMat = new THREE.MeshStandardMaterial({ color: 0x0c0a09, roughness: 0.95 });

        for (let x of [-16, -6, 8, 18]) {
            const cone = new THREE.Mesh(new THREE.ConeGeometry(5.5, 11, 8), coneMat);
            cone.position.set(x, 4.0, -14);
            targetGroup.add(cone);

            // Cratère magmatique lumineux
            const calderaMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });
            const caldera = new THREE.Mesh(new THREE.SphereGeometry(1.6, 12, 12), calderaMat);
            caldera.position.set(x, 9.5, -14);
            targetGroup.add(caldera);
            calderas.push(caldera);

            // Lumière vacillante du cratère
            const pLight = new THREE.PointLight(0xf97316, 1.2, 18);
            pLight.position.set(x, 10.5, -13);
            targetGroup.add(pLight);
            calderaLights.push(pLight);
        }

        // Gigantesque météore du Chicxulub en fusion
        const meteorMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
        const meteor = new THREE.Mesh(new THREE.SphereGeometry(3.6, 16, 16), meteorMat);
        meteor.position.set(0, 14, -26);
        targetGroup.add(meteor);

        // Halo incandescent autour du météore
        const haloMat = new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.45, wireframe: true });
        const halo = new THREE.Mesh(new THREE.SphereGeometry(4.4, 12, 12), haloMat);
        halo.position.set(0, 14, -26);
        targetGroup.add(halo);

        // Fragments de météores incandescents en orbite dynamique
        const orbitRocks = [];
        for (let i = 0; i < 8; i++) {
            const rockMat = new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? 0xef4444 : 0xf97316 });
            const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.75 + Math.random() * 0.4), rockMat);
            const radiusX = 12 + Math.random() * 14;
            const radiusZ = 6 + Math.random() * 8;
            const speed = 0.4 + Math.random() * 0.6;
            const angle = (i / 8) * Math.PI * 2;
            const baseY = 8 + (i % 3) * 2.5;
            rock.position.set(Math.cos(angle) * radiusX, baseY, -22 + Math.sin(angle) * radiusZ);
            targetGroup.add(rock);
            orbitRocks.push({ mesh: rock, radiusX, radiusZ, speed, angle, baseY, rotX: Math.random() * 2, rotY: Math.random() * 2 });
        }

        // Particules d'étincelles et braises volcaniques ascendantes
        const embers = [];
        const emberMat = new THREE.MeshBasicMaterial({ color: 0xfacc15, transparent: true, opacity: 0.85 });
        const emberGeo = new THREE.BoxGeometry(0.18, 0.18, 0.18);
        for (let i = 0; i < 35; i++) {
            const ember = new THREE.Mesh(emberGeo, emberMat);
            const srcX = [-16, -6, 8, 18][i % 4] + (Math.random() - 0.5) * 3;
            ember.position.set(srcX, 9.5 + Math.random() * 12, -14 + (Math.random() - 0.5) * 4);
            targetGroup.add(ember);
            embers.push({
                mesh: ember,
                srcX,
                vy: 2.2 + Math.random() * 3.0,
                vx: (Math.random() - 0.5) * 1.5,
                baseY: 9.5,
                maxY: 24 + Math.random() * 6
            });
        }

        return { lavaMat, calderas, calderaLights, meteor, halo, orbitRocks, embers };
    },

    // Boucle d'animation en temps réel de l'arène
    animate(decor, group, scene, time, dt) {
        if (!decor) return;

        // 1. Pulsation thermique de la mer de lave
        if (decor.lavaMat) {
            const heat = 0.55 + Math.sin(time * 2.2) * 0.25;
            decor.lavaMat.emissiveIntensity = heat;
        }

        // 2. Pulsation et rotation du météore central
        if (decor.meteor && decor.halo) {
            const scale = 1.0 + Math.sin(time * 2.5) * 0.06;
            decor.meteor.scale.setScalar(scale);
            decor.halo.rotation.y = time * 0.4;
            decor.halo.rotation.x = time * 0.25;
        }

        // 3. Orbite elliptique des fragments de météorites
        if (decor.orbitRocks) {
            decor.orbitRocks.forEach(item => {
                item.angle += dt * item.speed;
                item.mesh.position.x = Math.cos(item.angle) * item.radiusX;
                item.mesh.position.z = -22 + Math.sin(item.angle) * item.radiusZ;
                item.mesh.position.y = item.baseY + Math.sin(time * 1.8 + item.angle) * 0.8;
                item.mesh.rotation.x += dt * item.rotX;
                item.mesh.rotation.y += dt * item.rotY;
            });
        }

        // 4. Vacillement réaliste des feux de calderas
        if (decor.calderaLights) {
            decor.calderaLights.forEach((light, idx) => {
                light.intensity = 1.0 + Math.sin(time * 8 + idx * 1.5) * 0.4 + Math.cos(time * 13) * 0.2;
            });
        }

        // 5. Ascension des braises volcaniques incandescentes
        if (decor.embers) {
            decor.embers.forEach(emb => {
                emb.mesh.position.y += emb.vy * dt;
                emb.mesh.position.x += emb.vx * dt;
                emb.mesh.rotation.x += 4 * dt;
                emb.mesh.rotation.y += 3 * dt;
                if (emb.mesh.position.y > emb.maxY) {
                    emb.mesh.position.y = emb.baseY;
                    emb.mesh.position.x = emb.srcX + (Math.random() - 0.5) * 2;
                }
            });
        }
    }
});
