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

    // Éléments de décor 3D dynamiques (ajoutés à arenaGroup)
    buildDecor(group, scene) {
        const targetGroup = group || arenaGroup;

        // Mer de magma incandescent avec pulsation de chaleur
        const lavaMat = new THREE.MeshStandardMaterial({
            color: 0xb91c1c,
            roughness: 0.3,
            emissive: 0x991b1b,
            emissiveIntensity: 0.7
        });
        const lavaSea = new THREE.Mesh(new THREE.PlaneGeometry(160, 100), lavaMat);
        lavaSea.rotation.x = -Math.PI / 2;
        lavaSea.position.y = -2.2;
        targetGroup.add(lavaSea);

        // Piliers de basalte noir et cornes de dragon titanesques
        const pillarMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0c, roughness: 0.9 });
        const glowSpheres = [];
        for (let x of [-18, -11, -5, 5, 11, 18]) {
            const pillar = new THREE.Mesh(new THREE.ConeGeometry(3.5, 16, 6), pillarMat);
            pillar.position.set(x, 6.0, -12);
            targetGroup.add(pillar);

            // Veines de lave rougeoyante au sommet
            const glow = new THREE.Mesh(
                new THREE.SphereGeometry(1.4, 10, 10),
                new THREE.MeshBasicMaterial({ color: 0xf97316 })
            );
            glow.position.set(x, 14.0, -12);
            targetGroup.add(glow);
            glowSpheres.push(glow);
        }

        // Crâne d'Ancien Dragon géant fossilisé en arrière-plan
        const skullMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.7 });
        const skull = new THREE.Mesh(new THREE.BoxGeometry(6.5, 4.2, 5.0), skullMat);
        skull.position.set(0, 8.5, -22);
        skull.rotation.x = 0.2;
        targetGroup.add(skull);

        // Cornes massives du crâne fossile
        const hornMat = new THREE.MeshStandardMaterial({ color: 0x78350f });
        [-3.2, 3.2].forEach(z => {
            const horn = new THREE.Mesh(new THREE.ConeGeometry(0.8, 6.5, 6), hornMat);
            horn.position.set(z * 1.5, 12.0, -22);
            horn.rotation.z = z > 0 ? -0.45 : 0.45;
            targetGroup.add(horn);
        });

        // Yeux incandescents braisants du dragon fossilisé
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
        const eyeLeft = new THREE.Mesh(new THREE.SphereGeometry(0.55, 10, 10), eyeMat);
        eyeLeft.position.set(-1.4, 8.8, -19.4);
        targetGroup.add(eyeLeft);

        const eyeRight = new THREE.Mesh(new THREE.SphereGeometry(0.55, 10, 10), eyeMat);
        eyeRight.position.set(1.4, 8.8, -19.4);
        targetGroup.add(eyeRight);

        const skullLight = new THREE.PointLight(0xef4444, 1.4, 25);
        skullLight.position.set(0, 9.5, -18);
        targetGroup.add(skullLight);

        // Colonnes de flammes magmatiques dansantes (12 flammes)
        const flameColumns = [];
        for (let i = 0; i < 12; i++) {
            const fMat = new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? 0xf97316 : 0xef4444 });
            const flame = new THREE.Mesh(new THREE.OctahedronGeometry(0.85, 1), fMat);
            const fx = -16 + i * 2.9 + (Math.random() - 0.5) * 1.5;
            const fz = -6 - (i % 3) * 3;
            flame.position.set(fx, 2.4, fz);
            targetGroup.add(flame);
            flameColumns.push({ mesh: flame, fx, fz, baseY: 2.4, phase: i * 0.7, speed: 5.0 + Math.random() * 4 });
        }

        // Étincelles et cendres infernales ascendantes
        const embers = [];
        const emberMat = new THREE.MeshBasicMaterial({ color: 0xfba01a, transparent: true, opacity: 0.85 });
        const emberGeo = new THREE.BoxGeometry(0.18, 0.18, 0.18);
        for (let i = 0; i < 35; i++) {
            const emb = new THREE.Mesh(emberGeo, emberMat);
            const x = -16 + Math.random() * 32;
            const y = 0.5 + Math.random() * 18;
            const z = -4 - Math.random() * 16;
            emb.position.set(x, y, z);
            targetGroup.add(emb);
            embers.push({ mesh: emb, x, z, vy: 2.5 + Math.random() * 3.5, vx: (Math.random() - 0.5) * 1.2 });
        }

        return { lavaMat, glowSpheres, skull, eyeLeft, eyeRight, eyeMat, skullLight, flameColumns, embers };
    },

    // Animation dynamique en temps réel de l'antre du dragon
    animate(decor, group, scene, time, dt) {
        if (!decor) return;

        // 1. Pulsation de chaleur du magma infernal
        if (decor.lavaMat) {
            decor.lavaMat.emissiveIntensity = 0.6 + Math.sin(time * 2.8) * 0.25;
        }

        // 2. Colonnes de flammes dansantes
        if (decor.flameColumns) {
            decor.flameColumns.forEach(f => {
                const scaleY = 1.0 + Math.sin(time * f.speed + f.phase) * 0.55 + Math.cos(time * 8) * 0.2;
                f.mesh.scale.set(0.9, scaleY, 0.9);
                f.mesh.position.y = f.baseY + (scaleY - 1.0) * 0.4;
                f.mesh.rotation.y += dt * 3.5;
            });
        }

        // 3. Regard incandescent du crâne du Dragon Ancien
        if (decor.eyeMat) {
            const glow = 0.85 + Math.sin(time * 3.5) * 0.35;
            decor.eyeMat.color.setRGB(1.0, 0.15 + glow * 0.3, 0);
            if (decor.skullLight) decor.skullLight.intensity = 1.0 + glow * 0.8;
        }

        // 4. Sommets de basalte lumineux palpitants
        if (decor.glowSpheres) {
            decor.glowSpheres.forEach((sph, i) => {
                sph.scale.setScalar(1.0 + Math.sin(time * 3 + i) * 0.15);
            });
        }

        // 5. Ascension des braises infernales
        if (decor.embers) {
            decor.embers.forEach(emb => {
                emb.mesh.position.y += emb.vy * dt;
                emb.mesh.position.x += emb.vx * dt;
                emb.mesh.rotation.x += 4 * dt;
                emb.mesh.rotation.y += 3 * dt;
                if (emb.mesh.position.y > 20) {
                    emb.mesh.position.y = 0.5;
                    emb.mesh.position.x = -16 + Math.random() * 32;
                }
            });
        }
    }
});
