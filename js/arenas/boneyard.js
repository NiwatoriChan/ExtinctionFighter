/* ============================================================================
 * ARÈNE : 🏛️ Citadelle Céleste d'Os (Aurores & Runes)
 * Diorama 3D stylisé "Cartoon Mature / Primal" validé sous Blender 5.2.3 :
 *   - Mer d'éther stellaire abyssale & tumulus d'ossements cyclopéens
 *   - Colonnade d'arches thoraciques de sauropodes colossaux gravées de runes stellaires
 *   - Obélisques monolithiques de cristal astral et anneaux d'astrolabe céleste
 *   - Feux follets astraux en lévitation orbitale & filaments d'aurore cosmique
 * ============================================================================ */

let _cachedBoneyardMaps = null;

function getBoneyardPBRMaps() {
    if (_cachedBoneyardMaps) return _cachedBoneyardMaps;

    const size = 512;
    const canvas = document.createElement('canvas');
    const bump = document.createElement('canvas');
    canvas.width = bump.width = size;
    canvas.height = bump.height = size;
    const ctx = canvas.getContext('2d');
    const bCtx = bump.getContext('2d');

    // Dégradé céleste cosmique indigo profond / violet astral / ivoire
    const grad = ctx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0.0, '#0f172a');
    grad.addColorStop(0.4, '#1e1b4b');
    grad.addColorStop(0.8, '#312e81');
    grad.addColorStop(1.0, '#4338ca');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    bCtx.fillStyle = '#707070';
    bCtx.fillRect(0, 0, size, size);

    let seed = 8181;
    const rand = () => {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
    };

    // Gravures de runes astrales cel-shadées
    for (let i = 0; i < 30; i++) {
        const x = rand() * size;
        const y = rand() * size;
        ctx.strokeStyle = '#818cf8';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.arc(x, y, 14 + rand() * 18, 0, Math.PI * 1.5);
        ctx.stroke();

        ctx.strokeStyle = '#c7d2fe';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x - 12, y);
        ctx.lineTo(x + 12, y);
        ctx.moveTo(x, y - 12);
        ctx.lineTo(x, y + 12);
        ctx.stroke();

        bCtx.strokeStyle = '#202020';
        bCtx.lineWidth = 3.0;
        bCtx.stroke();
    }

    const cosmicMap = new THREE.CanvasTexture(canvas);
    const cosmicBump = new THREE.CanvasTexture(bump);
    cosmicMap.wrapS = cosmicMap.wrapT = cosmicBump.wrapS = cosmicBump.wrapT = THREE.RepeatWrapping;
    cosmicMap.repeat.set(3, 3);
    cosmicBump.repeat.set(3, 3);
    if (THREE.SRGBColorSpace) cosmicMap.colorSpace = THREE.SRGBColorSpace;

    _cachedBoneyardMaps = { cosmicMap, cosmicBump };
    return _cachedBoneyardMaps;
}

registerArena({
    id: 'boneyard',
    label: "🏛️ Citadelle Céleste d'Os (Aurores & Runes)",
    skyColor: 0x050814,
    floorColor: 0x1e1b4b,
    accentColor: 0x818cf8,

    getGroundHeight(x, z = 0) {
        void z;
        const centralMound = Math.cos(x * 0.28) * 0.48;
        const ribRidges = Math.sin(x * 1.1) * 0.10;
        return centralMound + ribRidges + 0.12;
    },

    buildDecor(group, scene) {
        void scene;
        const targetGroup = group || arenaGroup;
        const { cosmicMap, cosmicBump } = getBoneyardPBRMaps();

        // 1. Vide cosmique / mer astrale
        const abyssGeo = new THREE.PlaneGeometry(170, 110, 24, 16);
        abyssGeo.rotateX(-Math.PI / 2);
        const abyssMat = new THREE.MeshStandardMaterial({
            map: cosmicMap,
            bumpMap: cosmicBump,
            bumpScale: 0.12,
            roughness: 0.45,
            metalness: 0.35,
            emissive: 0x1e1b4b,
            emissiveIntensity: 0.4
        });
        const cosmicAbyss = new THREE.Mesh(abyssGeo, abyssMat);
        cosmicAbyss.position.y = -2.3;
        targetGroup.add(cosmicAbyss);

        // 2. Colonnade d'Arches Thoraciques colossales de Sauropodes
        const boneMat = new THREE.MeshStandardMaterial({
            color: 0xf1f5f9,
            roughness: 0.42,
            metalness: 0.15
        });
        const runeGlowMat = new THREE.MeshStandardMaterial({
            color: 0x818cf8,
            emissive: 0x6366f1,
            emissiveIntensity: 0.85,
            roughness: 0.25
        });

        const ribs = [];
        for (let x = -15; x <= 15; x += 3.0) {
            const archH = 6.8 + Math.sin(x * 0.25) * 0.8;
            const rib = new THREE.Mesh(new THREE.TorusGeometry(archH, 0.46, 8, 28, Math.PI * 0.95), boneMat);
            rib.position.set(x, 0.4, -6.5);
            rib.rotation.y = Math.sin(x * 0.15) * 0.2;
            targetGroup.add(rib);
            ribs.push(rib);

            // Bague runique astrale au sommet de chaque arche
            const runeRing = new THREE.Mesh(new THREE.TorusGeometry(archH * 0.22, 0.14, 6, 16), runeGlowMat);
            runeRing.position.set(x, archH + 0.2, -6.5);
            runeRing.rotation.y = Math.PI / 2;
            targetGroup.add(runeRing);
        }

        // 3. Obélisques monolithiques gravés de glyphes stellaires
        const obelisks = [];
        const obeliskMat = new THREE.MeshStandardMaterial({
            color: 0x312e81,
            emissive: 0x4338ca,
            emissiveIntensity: 0.55,
            roughness: 0.32,
            metalness: 0.38
        });
        for (let x of [-16, -9.5, 9.5, 16]) {
            const oGroup = new THREE.Group();
            oGroup.position.set(x, -2.2, -8.5);

            const obelisk = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 1.15, 11.5, 6), obeliskMat);
            obelisk.position.y = 5.75;
            oGroup.add(obelisk);

            // Pointe pyramidale au sommet
            const cap = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.4, 6), runeGlowMat);
            cap.position.y = 12.2;
            oGroup.add(cap);

            targetGroup.add(oGroup);
            obelisks.push(obelisk);
        }

        // 4. Anneaux d'astrolabe céleste et aurores astrales
        const auroraMat1 = new THREE.MeshBasicMaterial({ color: 0xa855f7, transparent: true, opacity: 0.42, wireframe: true });
        const aurora1 = new THREE.Mesh(new THREE.TorusGeometry(19, 2.2, 8, 36), auroraMat1);
        aurora1.position.set(0, 13, -21);
        aurora1.rotation.x = 0.55;
        targetGroup.add(aurora1);

        const auroraMat2 = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.35, wireframe: true });
        const aurora2 = new THREE.Mesh(new THREE.TorusGeometry(15, 1.7, 8, 32), auroraMat2);
        aurora2.position.set(0, 14.5, -23);
        aurora2.rotation.x = -0.42;
        targetGroup.add(aurora2);

        // 5. Feux follets astraux (wisps)
        const wisps = [];
        const wispGeo = new THREE.OctahedronGeometry(0.24, 1);
        for (let i = 0; i < 24; i++) {
            const wMat = new THREE.MeshBasicMaterial({
                color: i % 2 === 0 ? 0x818cf8 : 0x38bdf8,
                transparent: true,
                opacity: 0.82
            });
            const wisp = new THREE.Mesh(wispGeo, wMat);
            const baseX = -15 + (i / 24) * 30 + (Math.random() - 0.5) * 2;
            const baseY = 2.2 + Math.random() * 6.5;
            const baseZ = -6.0 + (Math.random() - 0.5) * 4;
            wisp.position.set(baseX, baseY, baseZ);
            targetGroup.add(wisp);
            wisps.push({
                mesh: wisp,
                baseX, baseY, baseZ,
                phase: i * 0.55,
                speed: 0.9 + Math.random() * 0.9
            });
        }

        return {
            cosmicAbyss,
            obeliskMat,
            aurora1,
            aurora2,
            auroraMat1,
            auroraMat2,
            wisps
        };
    },

    animate(decor, group, scene, time, dt) {
        void group;
        void scene;
        if (!decor) return;

        // 1. Rotation de l'astrolabe et aurores cosmiques
        if (decor.aurora1) {
            decor.aurora1.rotation.z = time * 0.09;
            decor.aurora1.rotation.y = time * 0.06;
        }
        if (decor.aurora2) {
            decor.aurora2.rotation.z = -time * 0.07;
            decor.aurora2.rotation.y = -time * 0.05;
        }

        // 2. Ondulation spectrale
        if (decor.auroraMat1) {
            const hue = (0.74 + Math.sin(time * 0.25) * 0.12) % 1;
            decor.auroraMat1.color.setHSL(hue, 0.88, 0.58);
        }

        // 3. Respiration mystique des obélisques
        if (decor.obeliskMat) {
            decor.obeliskMat.emissiveIntensity = 0.42 + Math.sin(time * 2.8) * 0.28;
        }

        // 4. Lévitation ondulatoire des feux follets astraux
        if (decor.wisps) {
            decor.wisps.forEach(w => {
                w.mesh.position.y = w.baseY + Math.sin(time * w.speed + w.phase) * 1.35;
                w.mesh.position.x = w.baseX + Math.cos(time * 0.75 + w.phase) * 0.7;
                w.mesh.rotation.y += dt * 2.2;
                w.mesh.rotation.x += dt * 1.6;
            });
        }
    }
});
