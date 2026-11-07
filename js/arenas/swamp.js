/* ============================================================================
 * ARÈNE : 🍄 Abysse Fongique Toxique (Bioluminescence)
 * Diorama 3D stylisé "Cartoon Mature / Primal" validé sous Blender 5.2.3 :
 *   - Tourbière acide marécageuse à ondulations vertes & croûtes d'humus
 *   - Champignons géants bioluminescents à lamelles incandescentes et respiration organique
 *   - Arches de racines noueuses de mangroves préhistoriques & étagères fongiques
 *   - Bulles de miasmes toxiques éclatant en geysers & spores phosphorescentes
 * ============================================================================ */

let _cachedSwampMaps = null;

function getSwampPBRMaps() {
    if (_cachedSwampMaps) return _cachedSwampMaps;

    const size = 512;
    const canvas = document.createElement('canvas');
    const bump = document.createElement('canvas');
    canvas.width = bump.width = size;
    canvas.height = bump.height = size;
    const ctx = canvas.getContext('2d');
    const bCtx = bump.getContext('2d');

    // Dégradé marécageux acide / vert émeraude / noir tourbe
    const grad = ctx.createRadialGradient(size * 0.5, size * 0.5, 20, size * 0.5, size * 0.5, size * 0.7);
    grad.addColorStop(0.0, '#a3e635');
    grad.addColorStop(0.35, '#22c55e');
    grad.addColorStop(0.7, '#064e3b');
    grad.addColorStop(1.0, '#022c22');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    bCtx.fillStyle = '#606060';
    bCtx.fillRect(0, 0, size, size);

    let seed = 7331;
    const rand = () => {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
    };

    // Plaques d'écume acide et champignons encroûtants (style cel-shading mature)
    for (let i = 0; i < 60; i++) {
        const x = rand() * size;
        const y = rand() * size;
        const r = 12 + rand() * 26;
        ctx.beginPath();
        bCtx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        bCtx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = rand() > 0.5 ? 'rgba(34, 197, 94, 0.45)' : 'rgba(2, 44, 34, 0.65)';
        ctx.fill();
        ctx.strokeStyle = '#a3e635';
        ctx.lineWidth = 1.8;
        ctx.stroke();

        bCtx.fillStyle = '#b0b0b0';
        bCtx.fill();
    }

    const swampMap = new THREE.CanvasTexture(canvas);
    const swampBump = new THREE.CanvasTexture(bump);
    swampMap.wrapS = swampMap.wrapT = swampBump.wrapS = swampBump.wrapT = THREE.RepeatWrapping;
    swampMap.repeat.set(3, 3);
    swampBump.repeat.set(3, 3);
    if (THREE.SRGBColorSpace) swampMap.colorSpace = THREE.SRGBColorSpace;

    _cachedSwampMaps = { swampMap, swampBump };
    return _cachedSwampMaps;
}

registerArena({
    id: 'swamp',
    label: "🍄 Abysse Fongique Toxique (Bioluminescence)",
    skyColor: 0x021810,
    floorColor: 0x064e3b,
    accentColor: 0x22c55e,

    getGroundHeight(x, z = 0) {
        void z;
        const mireBasin = -Math.cos(x * 0.42) * 0.34;
        const rootHummock = Math.sin(x * 0.75) * 0.18;
        return mireBasin + rootHummock + 0.10;
    },

    buildDecor(group, scene) {
        void scene;
        const targetGroup = group || arenaGroup;
        const { swampMap, swampBump } = getSwampPBRMaps();

        // 1. Plan d'acide et de tourbe marécageuse
        const swampGeo = new THREE.PlaneGeometry(170, 110, 36, 24);
        swampGeo.rotateX(-Math.PI / 2);
        const swampMat = new THREE.MeshStandardMaterial({
            map: swampMap,
            bumpMap: swampBump,
            bumpScale: 0.14,
            color: 0x064e3b,
            emissive: 0x14532d,
            emissiveIntensity: 0.42,
            roughness: 0.35,
            metalness: 0.25
        });
        const swampSea = new THREE.Mesh(swampGeo, swampMat);
        swampSea.position.y = -2.15;
        targetGroup.add(swampSea);

        // 2. Champignons géants bioluminescents (chapeaux galbés, lamelles lumineuses, anneaux)
        const mushrooms = [];
        const mushroomPositions = [-15, -8.5, 6, 14.5];
        const barkMat = new THREE.MeshStandardMaterial({
            color: 0x1e3a2f,
            bumpMap: swampBump,
            bumpScale: 0.08,
            roughness: 0.82
        });

        mushroomPositions.forEach((mx, idx) => {
            const mGroup = new THREE.Group();
            mGroup.position.set(mx, 0, -8 - (idx % 2) * 2.5);

            const stemH = 6.2 + (idx % 3) * 1.4;
            const stem = new THREE.Mesh(
                new THREE.CylinderGeometry(0.55, 0.95, stemH, 8, 4),
                barkMat
            );
            stem.position.y = stemH * 0.48;
            stem.rotation.z = (idx % 2 === 0 ? 0.08 : -0.08);
            mGroup.add(stem);

            // Chapeau de champignon stylisé parasol / cloche avec lamelles
            const capMat = new THREE.MeshStandardMaterial({
                color: idx % 2 === 0 ? 0x22c55e : 0x10b981,
                emissive: 0x16a34a,
                emissiveIntensity: 0.82,
                roughness: 0.35,
                metalness: 0.15
            });
            const cap = new THREE.Mesh(new THREE.ConeGeometry(3.1, 1.9, 14), capMat);
            cap.position.set(0, stemH, 0);
            mGroup.add(cap);

            // Lamelles inférieures incandescentes
            const gillsMat = new THREE.MeshBasicMaterial({ color: 0xa3e635 });
            const gills = new THREE.Mesh(new THREE.CylinderGeometry(2.9, 0.7, 0.25, 14), gillsMat);
            gills.position.set(0, stemH - 0.2, 0);
            mGroup.add(gills);

            // Étagères fongiques parasites sur le tronc
            for (let s = 0; s < 3; s++) {
                const shelf = new THREE.Mesh(new THREE.CylinderGeometry(0.8 - s * 0.15, 0.4, 0.18, 6), capMat);
                shelf.scale.set(1.4, 0.5, 1.0);
                shelf.position.set((s % 2 === 0 ? 0.6 : -0.6), 1.8 + s * 1.4, 0);
                mGroup.add(shelf);
            }

            const pLight = new THREE.PointLight(0x22c55e, 1.25, 16);
            pLight.position.set(0, stemH + 0.6, 0);
            mGroup.add(pLight);

            targetGroup.add(mGroup);
            mushrooms.push({ group: mGroup, cap, capMat, pLight, phase: idx * 1.3 });
        });

        // 3. Arches de racines noueuses de mangroves préhistoriques
        const rootMat = new THREE.MeshStandardMaterial({ color: 0x132e22, roughness: 0.88 });
        for (let rx of [-12, -2, 9, 17]) {
            const arch = new THREE.Mesh(new THREE.TorusGeometry(3.4, 0.38, 6, 16, Math.PI * 0.85), rootMat);
            arch.position.set(rx, 0.2, -6.5);
            arch.rotation.set(0.25, rx * 0.3, 0.15);
            targetGroup.add(arch);
        }

        // 4. Bulles d'acide marécageux en lévitation dynamique
        const bubbles = [];
        const bubbleGeo = new THREE.SphereGeometry(0.42, 10, 8);
        const bubbleMat = new THREE.MeshPhysicalMaterial({
            color: 0xa3e635,
            emissive: 0x22c55e,
            emissiveIntensity: 0.45,
            roughness: 0.1,
            metalness: 0.1,
            clearcoat: 0.8,
            transparent: true,
            opacity: 0.75
        });

        for (let i = 0; i < 26; i++) {
            const bubble = new THREE.Mesh(bubbleGeo, bubbleMat);
            const startX = -16 + Math.random() * 32;
            const startZ = -4 - Math.random() * 9;
            bubble.position.set(startX, -1.8 + Math.random() * 8, startZ);
            targetGroup.add(bubble);
            bubbles.push({
                mesh: bubble,
                startX,
                startZ,
                speedY: 1.3 + Math.random() * 1.9,
                wobbleSpeed: 2.2 + Math.random() * 3.0,
                phase: Math.random() * Math.PI * 2,
                maxHeight: 7.2 + Math.random() * 3.5
            });
        }

        // 5. Spores phosphorescentes flottantes
        const spores = [];
        const sporeMat = new THREE.MeshBasicMaterial({ color: 0x86efac, transparent: true, opacity: 0.75 });
        const sporeGeo = new THREE.OctahedronGeometry(0.14, 0);
        for (let i = 0; i < 36; i++) {
            const spore = new THREE.Mesh(sporeGeo, sporeMat);
            const x = -17 + Math.random() * 34;
            const y = 0.5 + Math.random() * 6.5;
            const z = -2 - Math.random() * 9;
            spore.position.set(x, y, z);
            targetGroup.add(spore);
            spores.push({
                mesh: spore,
                x, y, z,
                speed: 0.4 + Math.random() * 0.7,
                phase: i * 0.45
            });
        }

        return {
            swampSea,
            swampMat,
            mushrooms,
            bubbles,
            spores
        };
    },

    animate(decor, group, scene, time, dt) {
        void group;
        void scene;
        if (!decor) return;

        // 1. Respiration organique des chapeaux de champignons
        if (decor.mushrooms) {
            decor.mushrooms.forEach(m => {
                const pulse = 1.0 + Math.sin(time * 2.2 + m.phase) * 0.08;
                m.cap.scale.set(pulse, 1.0 / pulse, pulse);
                m.capMat.emissiveIntensity = 0.65 + Math.sin(time * 2.5 + m.phase) * 0.35;
                if (m.pLight) m.pLight.intensity = 0.95 + Math.sin(time * 2.5 + m.phase) * 0.35;
            });
        }

        // 2. Ondulation lente de la tourbière acide
        if (decor.swampSea && decor.swampSea.geometry) {
            const pos = decor.swampSea.geometry.attributes.position;
            for (let i = 0; i < pos.count; i++) {
                const sx = pos.getX(i);
                const sz = pos.getZ(i);
                pos.setY(i, Math.sin(sx * 0.25 + time * 1.5) * 0.1 + Math.cos(sz * 0.3 - time * 1.2) * 0.08);
            }
            pos.needsUpdate = true;
        }

        // 3. Ascension et éclatement des bulles de miasmes
        if (decor.bubbles) {
            decor.bubbles.forEach(b => {
                b.mesh.position.y += b.speedY * dt;
                b.mesh.position.x = b.startX + Math.sin(time * b.wobbleSpeed + b.phase) * 0.48;
                if (b.mesh.position.y > b.maxHeight) {
                    b.mesh.position.y = -1.8;
                    b.startX = -16 + Math.random() * 32;
                }
            });
        }

        // 4. Tourbillonnement des spores bioluminescentes
        if (decor.spores) {
            decor.spores.forEach(s => {
                s.mesh.position.x += Math.sin(time * s.speed + s.phase) * 0.025;
                s.mesh.position.y += Math.cos(time * 0.8 + s.phase) * 0.018;
                s.mesh.rotation.y += dt * 1.8;
            });
        }
    }
});
