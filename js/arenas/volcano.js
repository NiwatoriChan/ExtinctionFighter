/* ============================================================================
 * ARÈNE : 🌋 Cratère du Chicxulub (Lave & Météores)
 * Diorama 3D stylisé "Cartoon Mature / Primal" validé sous Blender 5.2.3 :
 *   - Mer de magma cellulaire Voronoï à croûte d'obsidienne fracturée et vagues
 *   - Spires de basalte sculptées & calderas actives à cascades de lave
 *   - Super-bolide du Chicxulub fracturé avec anneaux d'onde de choc & queue de plasma
 *   - Pluie d'astéroïdes en orbite et panaches de braises ascendantes
 * ============================================================================ */

let _cachedVolcanoMaps = null;

function getVolcanoPBRMaps() {
    if (_cachedVolcanoMaps) return _cachedVolcanoMaps;

    const size = 512;
    const lavaCanvas = document.createElement('canvas');
    const bumpCanvas = document.createElement('canvas');
    lavaCanvas.width = bumpCanvas.width = size;
    lavaCanvas.height = bumpCanvas.height = size;
    const lCtx = lavaCanvas.getContext('2d');
    const bCtx = bumpCanvas.getContext('2d');

    // Fond de magma incandescent orange-or à contours sombres
    const bgGrad = lCtx.createRadialGradient(size * 0.5, size * 0.5, 20, size * 0.5, size * 0.5, size * 0.7);
    bgGrad.addColorStop(0.0, '#fef08a');
    bgGrad.addColorStop(0.35, '#f97316');
    bgGrad.addColorStop(0.75, '#dc2626');
    bgGrad.addColorStop(1.0, '#7f1d1d');
    lCtx.fillStyle = bgGrad;
    lCtx.fillRect(0, 0, size, size);

    bCtx.fillStyle = '#404040';
    bCtx.fillRect(0, 0, size, size);

    let seed = 9001;
    const rand = () => {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
    };

    // Plaques de croûte basaltique refroidie flottant sur les rivières de lave
    const grid = 8;
    const cell = size / grid;
    for (let gy = 0; gy < grid; gy++) {
        for (let gx = 0; gx < grid; gx++) {
            const cx = (gx + 0.2 + rand() * 0.6) * cell;
            const cy = (gy + 0.2 + rand() * 0.6) * cell;
            const rx = cell * (0.32 + rand() * 0.16);
            const ry = cell * (0.30 + rand() * 0.16);
            const sides = 5 + Math.floor(rand() * 3);
            const rot = rand() * Math.PI * 2;

            lCtx.beginPath();
            bCtx.beginPath();
            for (let s = 0; s < sides; s++) {
                const a = rot + (s / sides) * Math.PI * 2;
                const rMod = 0.78 + rand() * 0.34;
                const px = cx + Math.cos(a) * rx * rMod;
                const py = cy + Math.sin(a) * ry * rMod;
                if (s === 0) {
                    lCtx.moveTo(px, py);
                    bCtx.moveTo(px, py);
                } else {
                    lCtx.lineTo(px, py);
                    bCtx.lineTo(px, py);
                }
            }
            lCtx.closePath();
            bCtx.closePath();

            // Halo jaune-orange autour de la croûte
            lCtx.strokeStyle = '#facc15';
            lCtx.lineWidth = 4.5;
            lCtx.stroke();

            // Plaque d'obsidienne sombre à contour cartoon encré
            lCtx.fillStyle = rand() > 0.4 ? '#1c1917' : '#291d1a';
            lCtx.fill();
            lCtx.strokeStyle = '#090707';
            lCtx.lineWidth = 2.0;
            lCtx.stroke();

            bCtx.fillStyle = '#d4d4d4';
            bCtx.fill();
            bCtx.strokeStyle = '#303030';
            bCtx.lineWidth = 3.0;
            bCtx.stroke();
        }
    }

    const lavaMap = new THREE.CanvasTexture(lavaCanvas);
    const lavaBump = new THREE.CanvasTexture(bumpCanvas);
    lavaMap.wrapS = lavaMap.wrapT = lavaBump.wrapS = lavaBump.wrapT = THREE.RepeatWrapping;
    lavaMap.repeat.set(4, 3);
    lavaBump.repeat.set(4, 3);
    if (THREE.SRGBColorSpace) lavaMap.colorSpace = THREE.SRGBColorSpace;

    _cachedVolcanoMaps = { lavaMap, lavaBump };
    return _cachedVolcanoMaps;
}

registerArena({
    id: 'volcano',
    label: "🌋 Cratère du Chicxulub (Lave & Météores)",
    skyColor: 0x1a0607,
    floorColor: 0x1c1917,
    accentColor: 0xf97316,

    getGroundHeight(x, z = 0) {
        void z;
        const centralDome = Math.exp(-(x * x) / 9.5) * 0.65;
        const lavaTroughs = -Math.exp(-Math.pow(Math.abs(x) - 5.2, 2) / 4.5) * 0.38;
        const craterRim = Math.pow(Math.min(1, Math.abs(x) / 11.0), 3) * 0.72;
        return centralDome + lavaTroughs + craterRim;
    },

    buildDecor(group, scene) {
        void scene;
        const targetGroup = group || arenaGroup;
        const { lavaMap, lavaBump } = getVolcanoPBRMaps();

        // 1. Mer de magma cellulaire avec ondulation thermique en temps réel
        const lavaGeo = new THREE.PlaneGeometry(170, 110, 44, 28);
        lavaGeo.rotateX(-Math.PI / 2);
        const lavaMat = new THREE.MeshStandardMaterial({
            map: lavaMap,
            bumpMap: lavaBump,
            bumpScale: 0.14,
            emissive: 0xea580c,
            emissiveMap: lavaMap,
            emissiveIntensity: 0.82,
            roughness: 0.32,
            metalness: 0.12
        });
        const lavaSea = new THREE.Mesh(lavaGeo, lavaMat);
        lavaSea.position.y = -2.25;
        targetGroup.add(lavaSea);

        // 2. Massifs volcaniques sculptés, colonnes de basalte & cascades de lave
        const calderas = [];
        const calderaLights = [];
        const lavaStreams = [];

        const basaltMat = new THREE.MeshStandardMaterial({
            color: 0x141110,
            bumpMap: lavaBump,
            bumpScale: 0.08,
            roughness: 0.86,
            metalness: 0.16
        });
        const obsidianRimMat = new THREE.MeshStandardMaterial({
            color: 0x271c19,
            roughness: 0.65,
            metalness: 0.25
        });
        const magmaGlowMat = new THREE.MeshStandardMaterial({
            color: 0xfef08a,
            emissive: 0xf97316,
            emissiveIntensity: 1.4,
            roughness: 0.18
        });

        const volcanoDefs = [
            { x: -19, z: -15, r: 6.2, h: 12.5 },
            { x: -7.5, z: -16.5, r: 5.4, h: 10.8 },
            { x: 8.5, z: -16.0, r: 5.8, h: 11.6 },
            { x: 19.5, z: -14.5, r: 6.5, h: 13.0 }
        ];

        volcanoDefs.forEach((v, idx) => {
            const vGroup = new THREE.Group();
            vGroup.position.set(v.x, -2.2, v.z);

            // Cône volcanique facetté et tordu (style cartoon mature)
            const coneGeo = new THREE.ConeGeometry(v.r, v.h, 11, 5, true);
            const cPos = coneGeo.attributes.position;
            for (let i = 0; i < cPos.count; i++) {
                const vx = cPos.getX(i);
                const vy = cPos.getY(i);
                const vz = cPos.getZ(i);
                const normY = (vy + v.h * 0.5) / v.h;
                const ridge = 1.0 + 0.18 * Math.sin(Math.atan2(vz, vx) * 5.0 + normY * 2.5);
                if (normY > 0.88) {
                    // Ouvrir le cratère au sommet
                    cPos.setX(i, vx * 1.45);
                    cPos.setZ(i, vz * 1.45);
                    cPos.setY(i, v.h * 0.38 - (normY - 0.88) * 1.8);
                } else {
                    cPos.setX(i, vx * ridge);
                    cPos.setZ(i, vz * ridge);
                }
            }
            coneGeo.computeVertexNormals();
            const coneMesh = new THREE.Mesh(coneGeo, basaltMat);
            coneMesh.position.y = v.h * 0.45;
            coneMesh.castShadow = true;
            coneMesh.receiveShadow = true;
            vGroup.add(coneMesh);

            // Éperons rocheux flanquant le volcan
            for (let s = 0; s < 4; s++) {
                const ang = (s / 4) * Math.PI * 2 + idx;
                const spur = new THREE.Mesh(new THREE.DodecahedronGeometry(v.r * 0.38, 0), obsidianRimMat);
                spur.scale.set(0.9, 2.2, 0.9);
                spur.position.set(Math.cos(ang) * v.r * 0.58, v.h * 0.25, Math.sin(ang) * v.r * 0.58);
                spur.rotation.z = -Math.cos(ang) * 0.35;
                vGroup.add(spur);
            }

            // Dôme de lave bouillonnante dans la caldera
            const caldera = new THREE.Mesh(new THREE.SphereGeometry(v.r * 0.32, 14, 10), magmaGlowMat);
            caldera.scale.set(1.2, 0.55, 1.2);
            caldera.position.set(0, v.h * 0.82, 0);
            vGroup.add(caldera);
            calderas.push(caldera);

            // Rivière / cascade de lave s'écoulant sur le flanc avant du volcan
            const streamGeo = new THREE.CylinderGeometry(0.28, 0.95, v.h * 0.86, 8, 6);
            const sPos = streamGeo.attributes.position;
            for (let k = 0; k < sPos.count; k++) {
                const sy = sPos.getY(k);
                sPos.setX(k, sPos.getX(k) + Math.sin(sy * 1.4 + idx) * 0.28);
            }
            streamGeo.computeVertexNormals();
            const stream = new THREE.Mesh(streamGeo, magmaGlowMat);
            stream.position.set(0, v.h * 0.42, v.r * 0.48);
            stream.rotation.x = 0.46;
            vGroup.add(stream);
            lavaStreams.push(stream);

            // Lumière ardente du cratère
            const pLight = new THREE.PointLight(0xf97316, 1.35, 24);
            pLight.position.set(v.x, v.h * 0.72, v.z + 2.0);
            targetGroup.add(pLight);
            calderaLights.push(pLight);

            targetGroup.add(vGroup);
        });

        // 3. Super-Bolide du Chicxulub en entrée atmosphérique (Noyau fracturé + Anneaux d'onde de choc)
        const meteorGroup = new THREE.Group();
        meteorGroup.position.set(0, 14.2, -26);
        targetGroup.add(meteorGroup);

        const coreGeo = new THREE.IcosahedronGeometry(3.5, 2);
        const corePos = coreGeo.attributes.position;
        for (let i = 0; i < corePos.count; i++) {
            const vx = corePos.getX(i);
            const vy = corePos.getY(i);
            const vz = corePos.getZ(i);
            const crag = 0.88 + 0.24 * Math.sin(vx * 1.7) * Math.cos(vy * 1.9 + vz * 1.5);
            corePos.setXYZ(i, vx * crag, vy * crag, vz * crag);
        }
        coreGeo.computeVertexNormals();
        const meteor = new THREE.Mesh(coreGeo, new THREE.MeshStandardMaterial({
            map: lavaMap,
            emissive: 0xf97316,
            emissiveMap: lavaMap,
            emissiveIntensity: 1.25,
            roughness: 0.4
        }));
        meteorGroup.add(meteor);

        // Couronne de plasma et onde de choc supersonique
        const haloMat = new THREE.MeshBasicMaterial({
            color: 0xfef08a,
            transparent: true,
            opacity: 0.55,
            wireframe: true
        });
        const halo = new THREE.Mesh(new THREE.IcosahedronGeometry(4.35, 1), haloMat);
        meteorGroup.add(halo);

        const shockRing1 = new THREE.Mesh(
            new THREE.TorusGeometry(5.6, 0.18, 8, 36),
            new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.65 })
        );
        shockRing1.rotation.set(1.15, 0.35, 0);
        meteorGroup.add(shockRing1);

        const shockRing2 = new THREE.Mesh(
            new THREE.TorusGeometry(7.2, 0.11, 8, 36),
            new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.42 })
        );
        shockRing2.rotation.set(1.22, -0.28, 0);
        meteorGroup.add(shockRing2);

        // Sillage de rentrée atmosphérique (cône de feu dans le ciel)
        const wakeGeo = new THREE.ConeGeometry(4.2, 16, 12, 1, true);
        const wakeMat = new THREE.MeshBasicMaterial({
            color: 0xea580c,
            transparent: true,
            opacity: 0.28,
            side: THREE.DoubleSide
        });
        const wakeCone = new THREE.Mesh(wakeGeo, wakeMat);
        wakeCone.position.set(-4.5, 5.5, -3.0);
        wakeCone.rotation.z = 0.68;
        meteorGroup.add(wakeCone);

        // 4. Fragments de météorites en orbite elliptique
        const orbitRocks = [];
        for (let i = 0; i < 10; i++) {
            const rMat = new THREE.MeshStandardMaterial({
                color: 0x291d1a,
                emissive: i % 2 === 0 ? 0xef4444 : 0xf97316,
                emissiveIntensity: 0.85,
                roughness: 0.5
            });
            const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.65 + (i % 3) * 0.25, 0), rMat);
            const radiusX = 11 + (i % 5) * 3.2;
            const radiusZ = 5.5 + (i % 4) * 2.2;
            const speed = 0.45 + (i % 4) * 0.18;
            const angle = (i / 10) * Math.PI * 2;
            const baseY = 7.5 + (i % 3) * 2.6;
            rock.position.set(Math.cos(angle) * radiusX, baseY, -22 + Math.sin(angle) * radiusZ);
            targetGroup.add(rock);
            orbitRocks.push({
                mesh: rock,
                radiusX,
                radiusZ,
                speed,
                angle,
                baseY,
                rotX: 1.2 + (i % 3),
                rotY: 1.5 + (i % 2)
            });
        }

        // 5. Braises et escarbilles volcaniques ascendantes
        const embers = [];
        const emberMat = new THREE.MeshBasicMaterial({ color: 0xfef08a, transparent: true, opacity: 0.9 });
        const emberGeo = new THREE.OctahedronGeometry(0.16, 0);
        for (let i = 0; i < 42; i++) {
            const ember = new THREE.Mesh(emberGeo, emberMat);
            const srcX = [-19, -7.5, 8.5, 19.5][i % 4] + (Math.random() - 0.5) * 4;
            ember.position.set(srcX, 6.5 + Math.random() * 14, -15 + (Math.random() - 0.5) * 5);
            targetGroup.add(ember);
            embers.push({
                mesh: ember,
                srcX,
                vy: 2.5 + Math.random() * 3.4,
                vx: (Math.random() - 0.5) * 1.6,
                baseY: 6.5,
                maxY: 24 + Math.random() * 6
            });
        }

        return {
            lavaSea,
            lavaMat,
             lavaMap,
            calderas,
            calderaLights,
            lavaStreams,
            meteor,
            halo,
            shockRing1,
            shockRing2,
            orbitRocks,
            embers
        };
    },

    animate(decor, group, scene, time, dt) {
        void group;
        void scene;
        if (!decor) return;

        // 1. Vagues de magma lourdes et défilement de la croûte
        if (decor.lavaSea && decor.lavaSea.geometry) {
            const pos = decor.lavaSea.geometry.attributes.position;
            for (let i = 0; i < pos.count; i++) {
                const lx = pos.getX(i);
                const lz = pos.getZ(i);
                pos.setY(i, Math.sin(lx * 0.18 + time * 1.8) * 0.16 + Math.cos(lz * 0.22 - time * 1.4) * 0.12);
            }
            pos.needsUpdate = true;
        }
        if (decor.lavaMat) {
            decor.lavaMat.emissiveIntensity = 0.72 + Math.sin(time * 2.4) * 0.22;
        }
        if (decor.lavaMap) {
            decor.lavaMap.offset.x = (time * 0.015) % 1;
            decor.lavaMap.offset.y = (time * 0.01) % 1;
        }

        // 2. Super-bolide du Chicxulub & anneaux d'onde de choc
        if (decor.meteor && decor.halo) {
            const pulse = 1.0 + Math.sin(time * 3.0) * 0.05;
            decor.meteor.scale.setScalar(pulse);
            decor.meteor.rotation.y = time * 0.25;
            decor.meteor.rotation.x = time * 0.15;
            decor.halo.rotation.y = -time * 0.45;
            decor.halo.rotation.z = time * 0.3;
        }
        if (decor.shockRing1 && decor.shockRing2) {
            decor.shockRing1.rotation.z = time * 0.8;
            decor.shockRing2.rotation.z = -time * 0.6;
            decor.shockRing1.scale.setScalar(1.0 + Math.sin(time * 4.0) * 0.06);
        }

        // 3. Orbite elliptique des fragments d'astéroïdes
        if (decor.orbitRocks) {
            decor.orbitRocks.forEach(item => {
                item.angle += dt * item.speed;
                item.mesh.position.x = Math.cos(item.angle) * item.radiusX;
                item.mesh.position.z = -22 + Math.sin(item.angle) * item.radiusZ;
                item.mesh.position.y = item.baseY + Math.sin(time * 1.8 + item.angle) * 0.85;
                item.mesh.rotation.x += dt * item.rotX;
                item.mesh.rotation.y += dt * item.rotY;
            });
        }

        // 4. Pulsation des calderas et cascades de lave
        if (decor.calderaLights) {
            decor.calderaLights.forEach((light, idx) => {
                light.intensity = 1.15 + Math.sin(time * 7.5 + idx * 1.5) * 0.35 + Math.cos(time * 12) * 0.18;
            });
        }
        if (decor.calderas) {
            decor.calderas.forEach((c, idx) => {
                c.scale.y = 0.55 + Math.sin(time * 4.2 + idx) * 0.12;
            });
        }

        // 5. Ascension des braises volcaniques
        if (decor.embers) {
            decor.embers.forEach(emb => {
                emb.mesh.position.y += emb.vy * dt;
                emb.mesh.position.x += emb.vx * dt;
                emb.mesh.rotation.x += 4 * dt;
                emb.mesh.rotation.y += 3 * dt;
                if (emb.mesh.position.y > emb.maxY) {
                    emb.mesh.position.y = emb.baseY;
                    emb.mesh.position.x = emb.srcX + (Math.random() - 0.5) * 2.5;
                }
            });
        }
    }
});
