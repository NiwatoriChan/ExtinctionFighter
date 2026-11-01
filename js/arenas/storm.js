/* ============================================================================
 * ARÈNE : ⚡ Canyon de l'Orage Primordial (Pluie & Foudre)
 * ============================================================================ */

registerArena({
    id: 'storm',
    label: "⚡ Canyon de l'Orage Primordial (Pluie & Foudre)",
    skyColor: 0x090d16,
    floorColor: 0x18181b,
    accentColor: 0x38bdf8,

    // Éléments de décor 3D dynamiques (ajoutés à arenaGroup)
    buildDecor(group, scene) {
        const targetGroup = group || arenaGroup;

        // Canyon de l'Orage Primordial : Colonnes de basalte noir
        const canyonMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.9 });
        const pillars = [];
        for (let x of [-16, -10, 10, 16]) {
            const pillar = new THREE.Mesh(new THREE.BoxGeometry(3.5, 14, 4), canyonMat);
            pillar.position.set(x, 5.5, -9);
            targetGroup.add(pillar);
            pillars.push(pillar);
        }

        // Système de pluie torrentielle dynamique (80 gouttes avec vitesse)
        const rainDrops = [];
        const rainMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.65 });
        const dropGeo = new THREE.CylinderGeometry(0.03, 0.03, 2.2, 3);
        for (let i = 0; i < 80; i++) {
            const drop = new THREE.Mesh(dropGeo, rainMat);
            drop.position.set(-20 + Math.random() * 40, Math.random() * 22, -8 + Math.random() * 12);
            drop.rotation.z = 0.16; // Inclinée par le vent d'orage
            targetGroup.add(drop);
            rainDrops.push({
                mesh: drop,
                speedY: 28 + Math.random() * 16,
                speedX: 4.5 + Math.random() * 2.0,
                baseY: 22,
                minY: -1.2
            });
        }

        // Éclairs procéduraux en zigzag
        const bolts = [];
        const boltMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0 });
        for (let i = 0; i < 3; i++) {
            const boltGroup = new THREE.Group();
            for (let s = 0; s < 4; s++) {
                const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.15, 4.0, 5), boltMat);
                seg.position.set((s % 2 === 0 ? 0.6 : -0.6), s * 3.2, 0);
                seg.rotation.z = (s % 2 === 0 ? 0.28 : -0.28);
                boltGroup.add(seg);
            }
            boltGroup.position.set(-10 + i * 10, 5, -12);
            boltGroup.visible = false;
            targetGroup.add(boltGroup);
            bolts.push(boltGroup);
        }

        // Source de lumière intense pour le flash d'éclair
        const lightningLight = new THREE.PointLight(0x7dd3fc, 0, 80);
        lightningLight.position.set(0, 16, -6);
        targetGroup.add(lightningLight);

        // Arcs d'énergie plasma entre piliers
        const plasmaArcs = [];
        const arcMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.6 });
        for (let i = 0; i < 4; i++) {
            const arc = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.05, 6, 16, Math.PI), arcMat);
            arc.position.set(-13 + i * 8.5, 7.5 + (i % 2) * 1.5, -9);
            arc.rotation.x = Math.PI / 2;
            targetGroup.add(arc);
            plasmaArcs.push(arc);
        }

        return {
            rainDrops,
            bolts,
            boltMat,
            lightningLight,
            plasmaArcs,
            lightningTimer: 2.5,
            flashTimer: 0
        };
    },

    // Animation dynamique en temps réel de la tempête
    animate(decor, group, scene, time, dt) {
        if (!decor) return;

        // 1. Pluie torrentielle en chute continue
        if (decor.rainDrops) {
            decor.rainDrops.forEach(drop => {
                drop.mesh.position.y -= drop.speedY * dt;
                drop.mesh.position.x += drop.speedX * dt;
                if (drop.mesh.position.y < drop.minY) {
                    drop.mesh.position.y = drop.baseY + Math.random() * 4;
                    drop.mesh.position.x = -22 + Math.random() * 40;
                }
            });
        }

        // 2. Gestion des éclairs atmosphériques et du tonnerre
        decor.lightningTimer -= dt;
        if (decor.lightningTimer <= 0) {
            decor.lightningTimer = 3.2 + Math.random() * 3.5;
            decor.flashTimer = 0.16; // Durée du flash
            if (decor.bolts && decor.bolts.length > 0) {
                const activeBolt = decor.bolts[Math.floor(Math.random() * decor.bolts.length)];
                activeBolt.visible = true;
                activeBolt.position.x = -14 + Math.random() * 28;
                setTimeout(() => { activeBolt.visible = false; }, 160);
            }
            if (typeof sfx !== 'undefined' && sfx.playThunder) {
                sfx.playThunder();
            }
        }

        if (decor.flashTimer > 0) {
            decor.flashTimer -= dt;
            const intensity = (decor.flashTimer / 0.16) * 3.5;
            decor.lightningLight.intensity = intensity;
            if (scene) {
                scene.background.setHex(intensity > 1.5 ? 0x224466 : 0x090d16);
            }
        } else {
            decor.lightningLight.intensity = 0;
            if (scene) scene.background.setHex(0x090d16);
        }

        // 3. Arcs plasma frémissants entre les colonnes
        if (decor.plasmaArcs) {
            decor.plasmaArcs.forEach((arc, i) => {
                arc.scale.setScalar(0.9 + Math.sin(time * 16 + i * 2) * 0.2);
                arc.rotation.z = Math.sin(time * 8 + i) * 0.4;
            });
        }
    }
});
