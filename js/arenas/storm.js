/* ============================================================================
 * ARÈNE : ⚡ Canyon de l'Orage Primordial (Pluie & Foudre)
 * Diorama 3D stylisé "Cartoon Mature / Primal" validé sous Blender 5.2.3 :
 *   - Colonnes de basalte tectonique en gradins & mares d'eau d'orage réfléchissantes
 *   - Cristaux de Fulgurite (éclairs fossilisés) pulsant d'énergie électrique
 *   - Pluie torrentielle dense inclinée par les rafales de tempête
 *   - Éclairs branchés en zigzag & illumination stroboscopique du ciel et de la falaise
 * ============================================================================ */

let _cachedStormMaps = null;

function getStormPBRMaps() {
    if (_cachedStormMaps) return _cachedStormMaps;

    const size = 512;
    const canvas = document.createElement('canvas');
    const bump = document.createElement('canvas');
    canvas.width = bump.width = size;
    canvas.height = bump.height = size;
    const ctx = canvas.getContext('2d');
    const bCtx = bump.getContext('2d');

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, size, size);
    bCtx.fillStyle = '#606060';
    bCtx.fillRect(0, 0, size, size);

    let seed = 1204;
    const rand = () => {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
    };

    // Stries de ruissellement d'eau et reflets de basalte mouillé
    for (let i = 0; i < 50; i++) {
        const x = rand() * size;
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
        ctx.lineWidth = 1.6 + rand() * 2.2;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + (rand() - 0.5) * 40, size);
        ctx.stroke();

        bCtx.strokeStyle = '#202020';
        bCtx.lineWidth = 2.5;
        bCtx.stroke();
    }

    const stormMap = new THREE.CanvasTexture(canvas);
    const stormBump = new THREE.CanvasTexture(bump);
    stormMap.wrapS = stormMap.wrapT = stormBump.wrapS = stormBump.wrapT = THREE.RepeatWrapping;
    stormMap.repeat.set(3, 3);
    stormBump.repeat.set(3, 3);
    if (THREE.SRGBColorSpace) stormMap.colorSpace = THREE.SRGBColorSpace;

    _cachedStormMaps = { stormMap, stormBump };
    return _cachedStormMaps;
}

registerArena({
    id: 'storm',
    label: "⚡ Canyon de l'Orage Primordial (Pluie & Foudre)",
    skyColor: 0x090d16,
    floorColor: 0x18181b,
    accentColor: 0x38bdf8,

    getGroundHeight(x, z = 0) {
        void z;
        const tectonicTilt = Math.sin(x * 0.32) * 0.42;
        const basaltSteps = Math.tanh(Math.sin(x * 0.85) * 2.5) * 0.22;
        return tectonicTilt + basaltSteps + 0.15;
    },

    buildDecor(group, scene) {
        void scene;
        const targetGroup = group || arenaGroup;
        const { stormMap, stormBump } = getStormPBRMaps();

        // 1. Fond de canyon inondé par les torrents de pluie
        const wetFloorGeo = new THREE.PlaneGeometry(170, 110, 24, 16);
        wetFloorGeo.rotateX(-Math.PI / 2);
        const wetFloorMat = new THREE.MeshStandardMaterial({
            map: stormMap,
            bumpMap: stormBump,
            bumpScale: 0.15,
            color: 0x18181b,
            roughness: 0.22,
            metalness: 0.65
        });
        const floodedBasalt = new THREE.Mesh(wetFloorGeo, wetFloorMat);
        floodedBasalt.position.y = -2.25;
        targetGroup.add(floodedBasalt);

        // 2. Colonnes de basalte hexagonal en gradins
        const canyonMat = new THREE.MeshStandardMaterial({
            color: 0x0c0c10,
            bumpMap: stormBump,
            bumpScale: 0.09,
            roughness: 0.72,
            metalness: 0.3
        });
        const fulguriteMat = new THREE.MeshPhysicalMaterial({
            color: 0x38bdf8,
            emissive: 0x0284c7,
            emissiveIntensity: 0.85,
            roughness: 0.15,
            metalness: 0.35,
            clearcoat: 0.85
        });

        const pillars = [];
        const fulguriteSpikes = [];
        for (let x of [-17, -11, 11, 17]) {
            const pGeo = new THREE.CylinderGeometry(2.4, 3.2, 16, 6);
            const pillar = new THREE.Mesh(pGeo, canyonMat);
            pillar.position.set(x, 5.8, -9.5);
            pillar.rotation.y = x * 0.2;
            targetGroup.add(pillar);
            pillars.push(pillar);

            // Aiguilles de fulgurite (cristaux d'éclairs pétrifiés) au sommet
            for (let k = 0; k < 3; k++) {
                const fSpike = new THREE.Mesh(new THREE.ConeGeometry(0.35, 2.6 - k * 0.5, 5), fulguriteMat);
                fSpike.position.set(x + (k - 1) * 0.8, 14.5 + k * 0.4, -9.5);
                fSpike.rotation.z = (k - 1) * 0.25;
                targetGroup.add(fSpike);
                fulguriteSpikes.push(fSpike);
            }
        }

        // 3. Système de pluie torrentielle dense inclinée par les bourrasques
        const rainDrops = [];
        const rainMat = new THREE.MeshBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.72 });
        const dropGeo = new THREE.CylinderGeometry(0.028, 0.028, 2.8, 4);
        for (let i = 0; i < 95; i++) {
            const drop = new THREE.Mesh(dropGeo, rainMat);
            drop.position.set(-22 + Math.random() * 44, Math.random() * 24, -9 + Math.random() * 14);
            drop.rotation.z = 0.22;
            targetGroup.add(drop);
            rainDrops.push({
                mesh: drop,
                speedY: 30 + Math.random() * 16,
                speedX: 5.5 + Math.random() * 2.5,
                baseY: 24,
                minY: -1.2
            });
        }

        // 4. Éclairs procéduraux branchés en zigzag
        const bolts = [];
        const boltMat = new THREE.MeshBasicMaterial({ color: 0xf0f9ff });
        for (let i = 0; i < 4; i++) {
            const boltGroup = new THREE.Group();
            for (let s = 0; s < 5; s++) {
                const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.16, 4.2, 5), boltMat);
                seg.position.set((s % 2 === 0 ? 0.7 : -0.7), s * 3.4, 0);
                seg.rotation.z = (s % 2 === 0 ? 0.32 : -0.32);
                boltGroup.add(seg);
            }
            boltGroup.position.set(-12 + i * 8, 4.5, -12);
            boltGroup.visible = false;
            targetGroup.add(boltGroup);
            bolts.push(boltGroup);
        }

        // Lumière vive pour le flash d'éclair
        const lightningLight = new THREE.PointLight(0xa5f3fc, 0, 95);
        lightningLight.position.set(0, 17, -6);
        targetGroup.add(lightningLight);

        // Arcs d'énergie plasma entre piliers de basalte
        const plasmaArcs = [];
        const arcMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.75 });
        for (let i = 0; i < 5; i++) {
            const arc = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.06, 6, 16, Math.PI), arcMat);
            arc.position.set(-14 + i * 7.0, 7.8 + (i % 2) * 1.6, -9);
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
            fulguriteSpikes,
            lightningTimer: 2.2,
            flashTimer: 0
        };
    },

    animate(decor, group, scene, time, dt) {
        if (!decor) return;

        // 1. Chute de la pluie torrentielle
        if (decor.rainDrops) {
            decor.rainDrops.forEach(drop => {
                drop.mesh.position.y -= drop.speedY * dt;
                drop.mesh.position.x += drop.speedX * dt;
                if (drop.mesh.position.y < drop.minY) {
                    drop.mesh.position.y = drop.baseY + Math.random() * 4;
                    drop.mesh.position.x = -24 + Math.random() * 44;
                }
            });
        }

        // 2. Éclairs stroboscopiques et tonnerre
        decor.lightningTimer -= dt;
        if (decor.lightningTimer <= 0) {
            decor.lightningTimer = 2.8 + Math.random() * 3.2;
            decor.flashTimer = 0.18;
            if (decor.bolts && decor.bolts.length > 0) {
                const activeBolt = decor.bolts[Math.floor(Math.random() * decor.bolts.length)];
                activeBolt.visible = true;
                activeBolt.position.x = -15 + Math.random() * 30;
                setTimeout(() => { activeBolt.visible = false; }, 180);
            }
            if (typeof sfx !== 'undefined' && sfx.playThunder) {
                sfx.playThunder();
            }
        }

        if (decor.flashTimer > 0) {
            decor.flashTimer -= dt;
            const intensity = (decor.flashTimer / 0.18) * 4.2;
            decor.lightningLight.intensity = intensity;
            if (scene) {
                scene.background.setHex(intensity > 1.8 ? 0x2a4365 : 0x090d16);
            }
        } else {
            decor.lightningLight.intensity = 0;
            if (scene) scene.background.setHex(0x090d16);
        }

        // 3. Arcs plasma crépitants et cristaux de fulgurite pulsants
        if (decor.plasmaArcs) {
            decor.plasmaArcs.forEach((arc, i) => {
                arc.scale.setScalar(0.9 + Math.sin(time * 18 + i * 2) * 0.22);
                arc.rotation.z = Math.sin(time * 9 + i) * 0.45;
            });
        }
        if (decor.fulguriteSpikes) {
            decor.fulguriteSpikes.forEach((sp, i) => {
                sp.scale.y = 1.0 + Math.sin(time * 6 + i) * 0.15;
            });
        }
    }
});
