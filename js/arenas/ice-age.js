/* ============================================================================
 * ARÈNE : ❄️ Glacier de l'Ère Glaciaire (Blizzard & Aurore Boréale)
 * Diorama 3D stylisé "Cartoon Mature / Primal" validé sous Blender 5.2.3 :
 *   - Banquise polaire PBR à fissures cyan-cobalt et plaques de glace flottantes
 *   - Parois d'icebergs facettés à réfraction bleutée & stalactites géantes
 *   - Squelettes et Crânes de Mammouths Laineux aux défenses d'ivoire spiralées
 *   - Rideaux d'Aurore Boréale multi-couches ondulants et blizzard cinématique
 * ============================================================================ */

let _cachedIceAgeMaps = null;

function getIceAgePBRMaps() {
    if (_cachedIceAgeMaps) return _cachedIceAgeMaps;

    const size = 512;
    const iceCanvas = document.createElement('canvas');
    const bumpCanvas = document.createElement('canvas');
    iceCanvas.width = bumpCanvas.width = size;
    iceCanvas.height = bumpCanvas.height = size;
    const iCtx = iceCanvas.getContext('2d');
    const bCtx = bumpCanvas.getContext('2d');

    const grad = iCtx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0.0, '#082f49');
    grad.addColorStop(0.45, '#0284c7');
    grad.addColorStop(0.85, '#7dd3fc');
    grad.addColorStop(1.0, '#e0f2fe');
    iCtx.fillStyle = grad;
    iCtx.fillRect(0, 0, size, size);

    bCtx.fillStyle = '#909090';
    bCtx.fillRect(0, 0, size, size);

    let seed = 4096;
    const rand = () => {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
    };

    // Réseau de fractures glaciaires stylisées (blanc givré + sillon cobalt profond)
    for (let i = 0; i < 42; i++) {
        let x = rand() * size;
        let y = rand() * size;
        iCtx.beginPath();
        bCtx.beginPath();
        iCtx.moveTo(x, y);
        bCtx.moveTo(x, y);
        for (let s = 0; s < 5; s++) {
            x += (rand() - 0.5) * 95;
            y += (rand() - 0.5) * 95;
            iCtx.lineTo(x, y);
            bCtx.lineTo(x, y);
        }
        iCtx.strokeStyle = 'rgba(240, 249, 255, 0.72)';
        iCtx.lineWidth = 3.2;
        iCtx.stroke();

        iCtx.strokeStyle = '#0c4a6e';
        iCtx.lineWidth = 1.4;
        iCtx.stroke();

        bCtx.strokeStyle = '#242424';
        bCtx.lineWidth = 3.5;
        bCtx.stroke();
    }

    // Texture d'ivoire fossile strié pour les défenses de mammouths
    const ivoryCanvas = document.createElement('canvas');
    ivoryCanvas.width = ivoryCanvas.height = 256;
    const vCtx = ivoryCanvas.getContext('2d');
    const vGrad = vCtx.createLinearGradient(0, 0, 256, 0);
    vGrad.addColorStop(0, '#cbd5e1');
    vGrad.addColorStop(0.5, '#f8fafc');
    vGrad.addColorStop(0.85, '#e2e8f0');
    vGrad.addColorStop(1.0, '#64748b');
    vCtx.fillStyle = vGrad;
    vCtx.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y += 14) {
        vCtx.strokeStyle = 'rgba(30, 41, 59, 0.35)';
        vCtx.lineWidth = 2.0;
        vCtx.beginPath();
        vCtx.moveTo(0, y);
        vCtx.lineTo(256, y + 4);
        vCtx.stroke();
    }

    const iceMap = new THREE.CanvasTexture(iceCanvas);
    const iceBump = new THREE.CanvasTexture(bumpCanvas);
    const ivoryMap = new THREE.CanvasTexture(ivoryCanvas);
    iceMap.wrapS = iceMap.wrapT = iceBump.wrapS = iceBump.wrapT = ivoryMap.wrapS = ivoryMap.wrapT = THREE.RepeatWrapping;
    iceMap.repeat.set(3, 2);
    iceBump.repeat.set(3, 2);
    if (THREE.SRGBColorSpace) {
        iceMap.colorSpace = THREE.SRGBColorSpace;
        ivoryMap.colorSpace = THREE.SRGBColorSpace;
    }

    _cachedIceAgeMaps = { iceMap, iceBump, ivoryMap };
    return _cachedIceAgeMaps;
}

registerArena({
    id: 'iceage',
    label: "❄️ Glacier de l'Ère Glaciaire (Blizzard & Aurore)",
    skyColor: 0x06101e,
    floorColor: 0x94a3b8,
    accentColor: 0x38bdf8,

    getGroundHeight(x, z = 0) {
        void z;
        const crevasseDip = -Math.exp(-(x * x) / 8.0) * 0.45;
        const snowDrifts = Math.sin(x * 0.48) * 0.25 + Math.pow(Math.min(1, Math.abs(x) / 10.5), 2) * 0.68;
        return crevasseDip + snowDrifts;
    },

    buildDecor(group, scene) {
        void scene;
        const targetGroup = group || arenaGroup;
        const { iceMap, iceBump, ivoryMap } = getIceAgePBRMaps();

        // 1. Mer arctique gelée & banquise fracturée sous l'arène
        const seaMat = new THREE.MeshStandardMaterial({
            map: iceMap,
            bumpMap: iceBump,
            bumpScale: 0.12,
            roughness: 0.22,
            metalness: 0.42
        });
        const frozenSea = new THREE.Mesh(new THREE.PlaneGeometry(170, 110, 24, 16), seaMat);
        frozenSea.rotation.x = -Math.PI / 2;
        frozenSea.position.y = -2.25;
        targetGroup.add(frozenSea);

        // 2. Matériaux glaciaires PBR (style cartoon mature)
        const glacierIceMat = new THREE.MeshPhysicalMaterial({
            color: 0xbae6fd,
            map: iceMap,
            bumpMap: iceBump,
            bumpScale: 0.08,
            roughness: 0.16,
            metalness: 0.15,
            clearcoat: 0.65,
            clearcoatRoughness: 0.15,
            transparent: true,
            opacity: 0.94
        });
        const deepGlacierMat = new THREE.MeshStandardMaterial({
            color: 0x0c4a6e,
            bumpMap: iceBump,
            bumpScale: 0.09,
            roughness: 0.65,
            metalness: 0.25
        });
        const snowCapMat = new THREE.MeshStandardMaterial({
            color: 0xf8fafc,
            roughness: 0.85,
            metalness: 0.05
        });
        const frostBoneMat = new THREE.MeshStandardMaterial({
            color: 0xf1f5f9,
            map: ivoryMap,
            bumpMap: iceBump,
            bumpScale: 0.04,
            roughness: 0.38,
            metalness: 0.12
        });

        // 3. Cathédrales d'Icebergs facettés & cascades gelées en arrière-plan
        const icePeaks = [];
        const peakDefs = [
            { x: -20, z: -14, r: 4.5, h: 15.5 },
            { x: -12, z: -12, r: 3.6, h: 12.2 },
            { x: -4.5, z: -15, r: 4.2, h: 16.8 },
            { x: 4.5, z: -15, r: 4.0, h: 16.0 },
            { x: 12.5, z: -12, r: 3.8, h: 12.8 },
            { x: 20.5, z: -14, r: 4.8, h: 15.8 }
        ];
        peakDefs.forEach((p, i) => {
            const pGroup = new THREE.Group();
            pGroup.position.set(p.x, -2.2, p.z);

            const spireGeo = new THREE.ConeGeometry(p.r, p.h, 6, 4);
            const sPos = spireGeo.attributes.position;
            for (let k = 0; k < sPos.count; k++) {
                const vx = sPos.getX(k);
                const vy = sPos.getY(k);
                const vz = sPos.getZ(k);
                const skew = Math.sin((vy / p.h) * Math.PI) * (i % 2 === 0 ? 0.85 : -0.85);
                sPos.setX(k, vx * 1.15 + skew);
                sPos.setZ(k, vz * 0.82);
            }
            spireGeo.computeVertexNormals();
            const spire = new THREE.Mesh(spireGeo, i % 2 === 0 ? glacierIceMat : deepGlacierMat);
            spire.position.y = p.h * 0.48;
            spire.rotation.y = i * 0.55;
            pGroup.add(spire);

            // Contrefort enneigé à la base
            const snowBase = new THREE.Mesh(new THREE.DodecahedronGeometry(p.r * 0.65, 1), snowCapMat);
            snowBase.scale.set(1.4, 0.7, 1.1);
            snowBase.position.set(0, p.r * 0.35, p.r * 0.3);
            pGroup.add(snowBase);

            targetGroup.add(pGroup);
            icePeaks.push(spire);
        });

        // 4. Crânes de Mammouths Laineux Colossaux & Grandes Défenses Spiralées pris dans la glace
        const boneArches = [];
        [-8.2, 8.2].forEach((x, idx) => {
            const mammothGroup = new THREE.Group();
            mammothGroup.position.set(x, 0.4, -8.8);
            mammothGroup.rotation.y = idx === 0 ? 0.28 : -0.28;

            // Crâne bombé de Mammouth (dôme crânien haut + fosse nasale + alvéoles des défenses)
            const cranium = new THREE.Mesh(new THREE.DodecahedronGeometry(1.55, 1), frostBoneMat);
            cranium.scale.set(1.0, 1.45, 1.15);
            cranium.position.set(0, 2.2, -1.2);
            mammothGroup.add(cranium);

            const eyeSocketMat = new THREE.MeshBasicMaterial({ color: 0x082f49 });
            [-0.85, 0.85].forEach(side => {
                const socket = new THREE.Mesh(new THREE.SphereGeometry(0.36, 8, 8), eyeSocketMat);
                socket.position.set(side, 2.1, -0.35);
                mammothGroup.add(socket);

                // Gaine osseuse prémaxillaire
                const sheath = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 1.6, 8), frostBoneMat);
                sheath.position.set(side * 0.65, 1.0, -0.2);
                sheath.rotation.x = 0.45;
                mammothGroup.add(sheath);
            });

            // Grandes défenses d'ivoire recourbées formant une arche majestueuse
            const tuskArch = new THREE.Mesh(new THREE.TorusGeometry(3.8, 0.34, 10, 28, Math.PI * 1.05), frostBoneMat);
            tuskArch.position.set(0, 1.4, 0);
            tuskArch.rotation.z = idx === 0 ? 0.12 : -0.12;
            mammothGroup.add(tuskArch);
            boneArches.push(tuskArch);

            // Côtes thoraciques fossiles émergeant de la neige
            for (let r = 0; r < 3; r++) {
                const rib = new THREE.Mesh(new THREE.TorusGeometry(2.2 - r * 0.25, 0.16, 7, 16, Math.PI * 0.8), frostBoneMat);
                rib.position.set(0, 0.5, -2.2 - r * 1.1);
                mammothGroup.add(rib);
            }

            targetGroup.add(mammothGroup);
        });

        // 5. Clusters de Cristaux de Glace Bioluminescents le long de la corniche
        const iceCrystals = [];
        const crystalMat = new THREE.MeshPhysicalMaterial({
            color: 0x7dd3fc,
            emissive: 0x0284c7,
            emissiveIntensity: 0.55,
            roughness: 0.12,
            metalness: 0.2,
            clearcoat: 0.9,
            transparent: true,
            opacity: 0.9
        });
        for (let x = -14; x <= 14; x += 3.5) {
            const cluster = new THREE.Group();
            cluster.position.set(x, 0.2, -5.4);
            for (let c = -1; c <= 1; c++) {
                const h = (c === 0 ? 2.1 : 1.35);
                const shard = new THREE.Mesh(new THREE.ConeGeometry(0.32, h, 5), crystalMat);
                shard.position.set(c * 0.32, h * 0.45, Math.abs(c) * -0.15);
                shard.rotation.z = -c * 0.28;
                cluster.add(shard);
            }
            targetGroup.add(cluster);
            iceCrystals.push(cluster);
        }

        // 6. Blizzard polaire dynamique (90 flocons et bourrasques obliques)
        const snowflakes = [];
        const snowMat = new THREE.MeshBasicMaterial({ color: 0xf0f9ff, transparent: true, opacity: 0.85 });
        const flakeGeo = new THREE.OctahedronGeometry(0.075, 0);
        for (let i = 0; i < 90; i++) {
            const flake = new THREE.Mesh(flakeGeo, snowMat);
            flake.position.set(-22 + Math.random() * 44, Math.random() * 20, -9 + Math.random() * 14);
            targetGroup.add(flake);
            snowflakes.push({
                mesh: flake,
                speedY: 3.0 + Math.random() * 3.8,
                speedX: -2.6 - Math.random() * 2.4,
                swayFreq: 1.8 + Math.random() * 3.2,
                baseY: 20,
                minY: -1.0
            });
        }

        // 7. Rideaux célestes d'Aurore Boréale sculptés en rubans ondulants
        const auroraRibbons = [];
        const auroraDefs = [
            { col: 0x34d399, y: 11.5, z: -16, w: 38, h: 4.2, speed: 1.1 },
            { col: 0x38bdf8, y: 13.5, z: -19, w: 42, h: 4.8, speed: 0.85 },
            { col: 0xa855f7, y: 15.2, z: -22, w: 46, h: 4.5, speed: 1.35 }
        ];
        auroraDefs.forEach((ad, idx) => {
            const aGeo = new THREE.PlaneGeometry(ad.w, ad.h, 36, 4);
            const aMat = new THREE.MeshBasicMaterial({
                color: ad.col,
                transparent: true,
                opacity: 0.34,
                side: THREE.DoubleSide,
                depthWrite: false,
                blending: THREE.AdditiveBlending
            });
            const ribbon = new THREE.Mesh(aGeo, aMat);
            ribbon.position.set(0, ad.y, ad.z);
            ribbon.rotation.x = 0.22;
            targetGroup.add(ribbon);
            auroraRibbons.push({ mesh: ribbon, geo: aGeo, speed: ad.speed, phase: idx * 1.7 });
        });

        const polarLight = new THREE.PointLight(0x38bdf8, 1.1, 48);
        polarLight.position.set(0, 9, -4);
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

    animate(decor, group, scene, time, dt) {
        void group;
        void scene;
        if (!decor) return;

        // 1. Chute et tourbillonnement des flocons du blizzard
        if (decor.snowflakes) {
            decor.snowflakes.forEach(flake => {
                flake.mesh.position.y -= flake.speedY * dt;
                flake.mesh.position.x += (flake.speedX + Math.sin(time * flake.swayFreq) * 0.9) * dt;
                flake.mesh.rotation.z += 3 * dt;
                if (flake.mesh.position.y < flake.minY) {
                    flake.mesh.position.y = flake.baseY + Math.random() * 2;
                    flake.mesh.position.x = -18 + Math.random() * 38;
                }
            });
        }

        // 2. Ondulation sinusoïdale en temps réel des draperies d'Aurore Boréale
        if (decor.auroraRibbons) {
            decor.auroraRibbons.forEach(ribbon => {
                const pos = ribbon.geo.attributes.position;
                for (let i = 0; i < pos.count; i++) {
                    const vx = pos.getX(i);
                    const vy = pos.getY(i);
                    const waveZ = Math.sin(vx * 0.22 + time * ribbon.speed + ribbon.phase) * 1.8 +
                                  Math.cos(vx * 0.45 - time * 0.7) * 0.7;
                    const archY = Math.cos(vx * 0.06) * 1.4;
                    pos.setZ(i, waveZ + (vy > 0 ? 0.6 : -0.4));
                    pos.setY(i, (vy > 0 ? 2.1 : -2.1) + archY);
                }
                pos.needsUpdate = true;
            });
        }

        // 3. Pulsation cristalline des stalagmites de glace
        if (decor.iceCrystals) {
            decor.iceCrystals.forEach((cr, i) => {
                cr.scale.y = 1.0 + Math.sin(time * 2.6 + i) * 0.12;
            });
        }
    }
});
