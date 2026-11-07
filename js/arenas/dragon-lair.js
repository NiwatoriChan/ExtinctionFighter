/* ============================================================================
 * ARÈNE : 🐲 L'Antre de Drak'Zul (Caldera Infernale)
 * Diorama 3D stylisé "Cartoon Mature / Primal" validé sous Blender 5.2.3 :
 *   - Fosse magmatique profonde à croûte de basalte fissurée et lueurs de soufre
 *   - Squelette fossile d'Ancien Dragon Titanesque (crâne cornu, mâchoires béantes,
 *     cage thoracique et vertèbres formant des arches cyclopéennes)
 *   - Colonnes de basalte hexagonal enlacées de chaînes ardentes
 *   - Colonnes de flammes magmatiques torsadées et étincelles tourbillonnantes
 * ============================================================================ */

let _cachedDragonLairMaps = null;

function getDragonLairPBRMaps() {
    if (_cachedDragonLairMaps) return _cachedDragonLairMaps;

    const size = 512;
    const canvas = document.createElement('canvas');
    const bump = document.createElement('canvas');
    canvas.width = bump.width = size;
    canvas.height = bump.height = size;
    const ctx = canvas.getContext('2d');
    const bCtx = bump.getContext('2d');

    // Dégradé infernal cramoisi / obsidienne / magma doré
    const grad = ctx.createRadialGradient(size * 0.5, size * 0.5, 30, size * 0.5, size * 0.5, size * 0.65);
    grad.addColorStop(0.0, '#fef08a');
    grad.addColorStop(0.25, '#ea580c');
    grad.addColorStop(0.65, '#991b1b');
    grad.addColorStop(0.9, '#450a0a');
    grad.addColorStop(1.0, '#180505');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    bCtx.fillStyle = '#606060';
    bCtx.fillRect(0, 0, size, size);

    let seed = 6667;
    const rand = () => {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
    };

    // Plaques de basalte polygonales angulaires (style cel-shading mature)
    const grid = 7;
    const cell = size / grid;
    for (let gy = 0; gy < grid; gy++) {
        for (let gx = 0; gx < grid; gx++) {
            const cx = (gx + 0.2 + rand() * 0.6) * cell;
            const cy = (gy + 0.2 + rand() * 0.6) * cell;
            const r = cell * (0.35 + rand() * 0.18);
            const sides = 5 + Math.floor(rand() * 3);
            const rot = rand() * Math.PI * 2;

            ctx.beginPath();
            bCtx.beginPath();
            for (let s = 0; s < sides; s++) {
                const a = rot + (s / sides) * Math.PI * 2;
                const px = cx + Math.cos(a) * r * (0.8 + rand() * 0.35);
                const py = cy + Math.sin(a) * r * (0.8 + rand() * 0.35);
                if (s === 0) { ctx.moveTo(px, py); bCtx.moveTo(px, py); }
                else { ctx.lineTo(px, py); bCtx.lineTo(px, py); }
            }
            ctx.closePath();
            bCtx.closePath();

            ctx.strokeStyle = '#facc15';
            ctx.lineWidth = 4.0;
            ctx.stroke();

            ctx.fillStyle = rand() > 0.45 ? '#140c0b' : '#221211';
            ctx.fill();
            ctx.strokeStyle = '#050202';
            ctx.lineWidth = 2.2;
            ctx.stroke();

            bCtx.fillStyle = '#c8c8c8';
            bCtx.fill();
            bCtx.strokeStyle = '#181818';
            bCtx.lineWidth = 3.5;
            bCtx.stroke();
        }
    }

    const magmaMap = new THREE.CanvasTexture(canvas);
    const magmaBump = new THREE.CanvasTexture(bump);
    magmaMap.wrapS = magmaMap.wrapT = magmaBump.wrapS = magmaBump.wrapT = THREE.RepeatWrapping;
    magmaMap.repeat.set(4, 3);
    magmaBump.repeat.set(4, 3);
    if (THREE.SRGBColorSpace) magmaMap.colorSpace = THREE.SRGBColorSpace;

    _cachedDragonLairMaps = { magmaMap, magmaBump };
    return _cachedDragonLairMaps;
}

registerArena({
    id: 'dragonlair',
    label: "🐲 L'Antre de Drak'Zul (Caldera Infernale)",
    skyColor: 0x180404,
    floorColor: 0x120505,
    accentColor: 0xef4444,

    getGroundHeight(x, z = 0) {
        void z;
        const calderaPit = -Math.exp(-(x * x) / 12.0) * 0.42;
        const obsidianDais = Math.pow(Math.min(1, Math.abs(x) / 10.5), 1.8) * 0.82;
        const cragRipples = Math.cos(x * 0.9) * 0.10;
        return calderaPit + obsidianDais + cragRipples;
    },

    buildDecor(group, scene) {
        void scene;
        const targetGroup = group || arenaGroup;
        const { magmaMap, magmaBump } = getDragonLairPBRMaps();

        // 1. Mer de magma incandescent ondulante
        const seaGeo = new THREE.PlaneGeometry(170, 110, 36, 24);
        seaGeo.rotateX(-Math.PI / 2);
        const seaMat = new THREE.MeshStandardMaterial({
            map: magmaMap,
            bumpMap: magmaBump,
            bumpScale: 0.15,
            emissive: 0xd92626,
            emissiveMap: magmaMap,
            emissiveIntensity: 0.88,
            roughness: 0.35,
            metalness: 0.12
        });
        const lavaSea = new THREE.Mesh(seaGeo, seaMat);
        lavaSea.position.y = -2.25;
        targetGroup.add(lavaSea);

        // 2. Colonnes de basalte hexagonal avec veines de lave
        const basaltMat = new THREE.MeshStandardMaterial({
            color: 0x140e0e,
            bumpMap: magmaBump,
            bumpScale: 0.08,
            roughness: 0.82,
            metalness: 0.2
        });
        const glowRuneMat = new THREE.MeshStandardMaterial({
            color: 0xf97316,
            emissive: 0xef4444,
            emissiveIntensity: 1.25,
            roughness: 0.2
        });

        const pillarXs = [-19, -12, -5.5, 5.5, 12, 19];
        const glowSpheres = [];
        pillarXs.forEach((px, i) => {
            const h = 13 + (i % 3) * 2.5;
            const pGeo = new THREE.CylinderGeometry(2.1, 2.8, h, 6);
            const pillar = new THREE.Mesh(pGeo, basaltMat);
            pillar.position.set(px, h * 0.45 - 2.2, -13 - (i % 2) * 2.0);
            pillar.rotation.y = i * 0.45;
            targetGroup.add(pillar);

            // Couronne de magma ardent au sommet
            const cap = new THREE.Mesh(new THREE.DodecahedronGeometry(1.4, 1), glowRuneMat);
            cap.scale.set(1.2, 0.6, 1.2);
            cap.position.set(px, h - 2.0, -13 - (i % 2) * 2.0);
            targetGroup.add(cap);
            glowSpheres.push(cap);

            // Chaîne de roche incandescente enroulée
            const chainTorus = new THREE.Mesh(new THREE.TorusGeometry(2.3, 0.16, 6, 16), glowRuneMat);
            chainTorus.position.set(px, h * 0.6 - 2.2, -13 - (i % 2) * 2.0);
            chainTorus.rotation.x = Math.PI / 2 + 0.2;
            targetGroup.add(chainTorus);
        });

        // 3. SQUELETTE COLOSSAL DU DRAGON ANCESTRAL (Sculpture anatomique mature cartoon)
        const boneMat = new THREE.MeshStandardMaterial({
            color: 0x271e1c,
            bumpMap: magmaBump,
            bumpScale: 0.06,
            roughness: 0.62,
            metalness: 0.18
        });
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });

        const dragonSkeletonGroup = new THREE.Group();
        dragonSkeletonGroup.position.set(0, 7.5, -23);
        targetGroup.add(dragonSkeletonGroup);

        // Boîte crânienne massive allongée
        const craniumGeo = new THREE.ConeGeometry(3.2, 7.5, 7);
        craniumGeo.rotateX(-Math.PI / 2 + 0.15);
        const cranium = new THREE.Mesh(craniumGeo, boneMat);
        cranium.scale.set(1.2, 0.75, 1.0);
        dragonSkeletonGroup.add(cranium);

        // Mâchoire inférieure béante fossilisée
        const jawGeo = new THREE.CylinderGeometry(1.6, 2.4, 6.8, 6);
        jawGeo.rotateX(-Math.PI / 2 + 0.45);
        const jaw = new THREE.Mesh(jawGeo, boneMat);
        jaw.position.set(0, -1.8, 0.5);
        dragonSkeletonGroup.add(jaw);

        // Crocs titanesques acérés
        for (let t = -3; t <= 3; t++) {
            if (t === 0) continue;
            const side = Math.sign(t);
            const z = (Math.abs(t) - 1) * 0.9 + 1.2;
            const fang = new THREE.Mesh(new THREE.ConeGeometry(0.24, 1.2, 5), glowRuneMat);
            fang.position.set(side * (1.1 - z * 0.1), -0.7, z);
            fang.rotation.x = Math.PI;
            dragonSkeletonGroup.add(fang);
        }

        // 4 Cornes monumentales d'ancien dragon recourbées
        [-1, 1].forEach(side => {
            // Corne principale occipitale
            const hornCurve = new THREE.Mesh(new THREE.TorusGeometry(3.5, 0.45, 6, 18, Math.PI * 0.65), boneMat);
            hornCurve.position.set(side * 2.8, 2.6, -1.5);
            hornCurve.rotation.set(0.3, side * 0.4, side * -0.55);
            dragonSkeletonGroup.add(hornCurve);

            // Corne jugale secondaire
            const jugalHorn = new THREE.Mesh(new THREE.ConeGeometry(0.38, 2.6, 5), boneMat);
            jugalHorn.position.set(side * 2.2, -0.2, -0.6);
            jugalHorn.rotation.set(0.2, 0, side * -1.25);
            dragonSkeletonGroup.add(jugalHorn);

            // Orbite oculaire et oeil ardent
            const eyeOrb = new THREE.Mesh(new THREE.SphereGeometry(0.55, 10, 10), eyeMat);
            eyeOrb.position.set(side * 1.5, 0.9, 1.2);
            dragonSkeletonGroup.add(eyeOrb);
        });

        // Colonne vertébrale et cage thoracique géante en arche
        for (let r = 0; r < 5; r++) {
            const ribArch = new THREE.Mesh(new THREE.TorusGeometry(5.2 - r * 0.35, 0.32, 6, 20, Math.PI * 0.9), boneMat);
            ribArch.position.set(0, -0.5, -4.5 - r * 2.8);
            ribArch.rotation.x = -0.15;
            dragonSkeletonGroup.add(ribArch);
        }

        const skullLight = new THREE.PointLight(0xef4444, 1.8, 32);
        skullLight.position.set(0, 8.5, -20);
        targetGroup.add(skullLight);

        // 4. Colonnes de flammes magmatiques torsadées (14 flammes)
        const flameColumns = [];
        for (let i = 0; i < 14; i++) {
            const fMat = new THREE.MeshBasicMaterial({
                color: i % 2 === 0 ? 0xf97316 : 0xef4444,
                transparent: true,
                opacity: 0.85
            });
            const flame = new THREE.Mesh(new THREE.ConeGeometry(0.85, 2.6, 6), fMat);
            const fx = -16.5 + i * 2.5 + (Math.random() - 0.5) * 1.4;
            const fz = -6.5 - (i % 3) * 2.8;
            flame.position.set(fx, 2.4, fz);
            targetGroup.add(flame);
            flameColumns.push({
                mesh: flame,
                baseY: 2.4,
                phase: i * 0.65,
                speed: 4.8 + Math.random() * 3.5
            });
        }

        // 5. Braises et scories infernales en suspension
        const embers = [];
        const emberMat = new THREE.MeshBasicMaterial({ color: 0xfef08a, transparent: true, opacity: 0.88 });
        const emberGeo = new THREE.OctahedronGeometry(0.18, 0);
        for (let i = 0; i < 40; i++) {
            const emb = new THREE.Mesh(emberGeo, emberMat);
            const x = -17 + Math.random() * 34;
            const y = 0.5 + Math.random() * 18;
            const z = -4 - Math.random() * 18;
            emb.position.set(x, y, z);
            targetGroup.add(emb);
            embers.push({
                mesh: emb,
                x, z,
                vy: 2.8 + Math.random() * 3.6,
                vx: (Math.random() - 0.5) * 1.5
            });
        }

        return {
            lavaSea,
            seaMat,
            glowSpheres,
            dragonSkeletonGroup,
            eyeMat,
            skullLight,
            flameColumns,
            embers
        };
    },

    animate(decor, group, scene, time, dt) {
        void group;
        void scene;
        if (!decor) return;

        // 1. Mer de magma en pulsation et déferlement
        if (decor.lavaSea && decor.lavaSea.geometry) {
            const pos = decor.lavaSea.geometry.attributes.position;
            for (let i = 0; i < pos.count; i++) {
                const lx = pos.getX(i);
                const lz = pos.getZ(i);
                pos.setY(i, Math.sin(lx * 0.2 + time * 2.2) * 0.18 + Math.cos(lz * 0.25 - time * 1.7) * 0.14);
            }
            pos.needsUpdate = true;
        }
        if (decor.seaMat) {
            decor.seaMat.emissiveIntensity = 0.78 + Math.sin(time * 2.6) * 0.24;
        }

        // 2. Colonnes de flammes dansantes torsadées
        if (decor.flameColumns) {
            decor.flameColumns.forEach(f => {
                const scaleY = 1.0 + Math.sin(time * f.speed + f.phase) * 0.5 + Math.cos(time * 7) * 0.22;
                f.mesh.scale.set(0.9, scaleY, 0.9);
                f.mesh.position.y = f.baseY + (scaleY - 1.0) * 0.45;
                f.mesh.rotation.y += dt * 3.8;
            });
        }

        // 3. Regard incandescent du crâne du Dragon Ancien
        if (decor.eyeMat) {
            const glow = 0.85 + Math.sin(time * 3.6) * 0.35;
            decor.eyeMat.color.setRGB(1.0, 0.18 + glow * 0.25, 0.05);
            if (decor.skullLight) decor.skullLight.intensity = 1.35 + glow * 0.85;
        }

        // 4. Pulsation des couronnes de basalte
        if (decor.glowSpheres) {
            decor.glowSpheres.forEach((sph, i) => {
                sph.scale.setScalar(1.0 + Math.sin(time * 3.2 + i) * 0.15);
            });
        }

        // 5. Ascension des braises infernales
        if (decor.embers) {
            decor.embers.forEach(emb => {
                emb.mesh.position.y += emb.vy * dt;
                emb.mesh.position.x += emb.vx * dt;
                emb.mesh.rotation.x += 4 * dt;
                emb.mesh.rotation.y += 3 * dt;
                if (emb.mesh.position.y > 22) {
                    emb.mesh.position.y = 0.5;
                    emb.mesh.position.x = -17 + Math.random() * 34;
                }
            });
        }
    }
});
