/* ============================================================================
 * ARÈNE : ❄️ Glacier de l'Ère Glaciaire (Blizzard & Aurore Boréale)
 * Arène polaire préhistorique avec icebergs scintillants, arches d'ivoire fossile,
 * tempête de blizzard dynamique et rideaux ondulants d'aurores polaires.
 * ============================================================================ */

registerArena({
    id: 'iceage',
    label: "❄️ Glacier de l'Ère Glaciaire (Blizzard & Aurore)",
    skyColor: 0x07111e,
    floorColor: 0x94a3b8,
    accentColor: 0x38bdf8,

    // Éléments de décor 3D dynamiques
    buildDecor(group, scene) {
        const targetGroup = group || arenaGroup;

        // 1. Matériaux de glace et de pergélisol
        const iceMat = new THREE.MeshStandardMaterial({
            color: 0xbae6fd,
            roughness: 0.18,
            metalness: 0.35,
            transparent: true,
            opacity: 0.92
        });
        const darkIceMat = new THREE.MeshStandardMaterial({
            color: 0x0f172a,
            roughness: 0.85,
            metalness: 0.15
        });
        const frostBoneMat = new THREE.MeshStandardMaterial({
            color: 0xf1f5f9,
            roughness: 0.4,
            metalness: 0.2
        });

        // 2. Pics glaciaires & Monolithes d'icebergs géants en arrière-plan
        const icePeaks = [];
        const peakPositions = [-17, -11, -5, 5, 11, 17];
        peakPositions.forEach((x, i) => {
            const h = 10 + (i % 3) * 3.5;
            const peak = new THREE.Mesh(new THREE.ConeGeometry(2.8, h, 5), i % 2 === 0 ? iceMat : darkIceMat);
            peak.position.set(x, h * 0.45, -9.5);
            peak.rotation.y = i * 0.7;
            targetGroup.add(peak);
            icePeaks.push(peak);
        });

        // 3. Arches colossales de défenses de mammouths et d'os fossiles figés dans la banquise
        const boneArches = [];
        [-7, 7].forEach((x, idx) => {
            const arch = new THREE.Mesh(new THREE.TorusGeometry(3.6, 0.32, 6, 20, Math.PI), frostBoneMat);
            arch.position.set(x, 1.8, -8);
            arch.rotation.z = idx === 0 ? 0.15 : -0.15;
            targetGroup.add(arch);
            boneArches.push(arch);
        });

        // 4. Cristaux de glace étincelants le long de l'arène
        const iceCrystals = [];
        const crystalMat = new THREE.MeshBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.85 });
        for (let i = -14; i <= 14; i += 4) {
            const crystal = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.8, 4), crystalMat);
            crystal.position.set(i, 0.6, -5.2);
            crystal.rotation.z = (Math.random() - 0.5) * 0.4;
            targetGroup.add(crystal);
            iceCrystals.push(crystal);
        }

        // 5. Système de Blizzard dynamique (85 flocons et cristaux de neige en suspension)
        const snowflakes = [];
        const snowMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.82 });
        const flakeGeo = new THREE.SphereGeometry(0.06, 4, 4);
        for (let i = 0; i < 85; i++) {
            const flake = new THREE.Mesh(flakeGeo, snowMat);
            flake.position.set(-20 + Math.random() * 40, Math.random() * 20, -7 + Math.random() * 12);
            targetGroup.add(flake);
            snowflakes.push({
                mesh: flake,
                speedY: 2.8 + Math.random() * 3.5,
                speedX: -2.2 - Math.random() * 2.0,
                swayFreq: 1.5 + Math.random() * 3.0,
                baseY: 20,
                minY: -0.8
            });
        }

        // 6. Rideaux ondulants d'Aurore Boréale céleste
        const auroraRibbons = [];
        const auroraColors = [0x34d399, 0x38bdf8, 0xa855f7];
        auroraColors.forEach((col, idx) => {
            const auroraMat = new THREE.MeshBasicMaterial({
                color: col,
                transparent: true,
                opacity: 0.35,
                side: THREE.DoubleSide
            });
            const ribbon = new THREE.Mesh(new THREE.TorusGeometry(14 + idx * 2.5, 0.4, 6, 28, Math.PI / 1.4), auroraMat);
            ribbon.position.set(0, 11 + idx * 1.5, -14);
            ribbon.rotation.x = Math.PI / 3;
            ribbon.rotation.z = -0.2 + idx * 0.2;
            targetGroup.add(ribbon);
            auroraRibbons.push({ mesh: ribbon, baseRot: ribbon.rotation.z, speed: 0.8 + idx * 0.4 });
        });

        // 7. Éclairage polaire froid d'ambiance
        const polarLight = new THREE.PointLight(0x7dd3fc, 0.9, 45);
        polarLight.position.set(0, 8, -4);
        targetGroup.add(polarLight);

        return {
            icePeaks,
            boneArches,
            iceCrystals,
            snowflakes,
            auroraRibbons,
            polarLight
        };
    },

    // Animation dynamique en temps réel du blizzard et des aurores
    animate(decor, group, scene, time, dt) {
        if (!decor) return;

        // 1. Chute et dérive des flocons de blizzard
        if (decor.snowflakes) {
            decor.snowflakes.forEach(flake => {
                flake.mesh.position.y -= flake.speedY * dt;
                flake.mesh.position.x += (flake.speedX + Math.sin(time * flake.swayFreq) * 0.8) * dt;
                if (flake.mesh.position.y < flake.minY) {
                    flake.mesh.position.y = flake.baseY + Math.random() * 2;
                    flake.mesh.position.x = -16 + Math.random() * 36;
                }
            });
        }

        // 2. Ondulation fluide des rideaux d'aurore polaire
        if (decor.auroraRibbons) {
            decor.auroraRibbons.forEach(ribbon => {
                ribbon.mesh.rotation.z = ribbon.baseRot + Math.sin(time * ribbon.speed) * 0.12;
                ribbon.mesh.scale.y = 1.0 + Math.sin(time * 1.2) * 0.15;
            });
        }

        // 3. Scintillement des cristaux de glace
        if (decor.iceCrystals) {
            decor.iceCrystals.forEach((cr, i) => {
                cr.scale.y = 1.0 + Math.sin(time * 2.5 + i) * 0.15;
            });
        }
    }
});
