/* ============================================================================
 * ARÈNE : 🏜️ Désert Rouge de la Pangée (Permien & Trias, -299 à -201 Ma)
 * Diorama 3D stylisé "Cartoon Mature / Primal" :
 *   - Mer de dunes barchanes ocre-rouge balayées par les vents arides de la Pangée
 *   - Mesas stratifiées de grès rouge (Red Beds / Chinle), hoodoos sculptés et
 *     arche naturelle monumentale encadrant un soleil couchant brûlant
 *   - Squelette fossile de synapside à voile dorsale du Permien, crâne géant
 *     blanchi au soleil et troncs pétrifiés du Trias aux cœurs d'ambre et d'agate
 *   - Flore xérophile préhistorique (cycads arides), tourbillons de poussière
 *     (dust devils), rafales de sable doré et ptérosaures planant dans les thermiques
 * ============================================================================ */

let _cachedDesertCanvases = null;

function getDesertPBRCanvases() {
    if (_cachedDesertCanvases) return _cachedDesertCanvases;
    if (typeof document === 'undefined') return null;

    // 1. Texture de dunes de sable rouge-ocre ondulées par le vent + bump map
    const sandSize = 512;
    const sandCanvas = document.createElement('canvas');
    const sandBumpCanvas = document.createElement('canvas');
    sandCanvas.width = sandBumpCanvas.width = sandSize;
    sandCanvas.height = sandBumpCanvas.height = sandSize;
    const sCtx = sandCanvas.getContext('2d');
    const sbCtx = sandBumpCanvas.getContext('2d');

    const sandGrad = sCtx.createLinearGradient(0, 0, sandSize, sandSize);
    sandGrad.addColorStop(0.0, '#b85324');
    sandGrad.addColorStop(0.35, '#d47431');
    sandGrad.addColorStop(0.7, '#c25d27');
    sandGrad.addColorStop(1.0, '#9e411a');
    sCtx.fillStyle = sandGrad;
    sCtx.fillRect(0, 0, sandSize, sandSize);

    sbCtx.fillStyle = '#787878';
    sbCtx.fillRect(0, 0, sandSize, sandSize);

    let seed = 25201;
    const rand = () => {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
    };

    // Ondulations éoliennes (rides de sable parallèles stylisées)
    for (let row = 0; row < 28; row++) {
        const baseY = (row / 28) * sandSize;
        const amp = 4 + rand() * 5;
        const freq = (2 + Math.floor(rand() * 2)) * ((Math.PI * 2) / sandSize);
        const phase = rand() * Math.PI * 2;

        // Crête lumineuse dorée
        sCtx.beginPath();
        sbCtx.beginPath();
        for (let x = 0; x <= sandSize; x += 8) {
            const y = baseY + Math.sin(x * freq + phase) * amp;
            if (x === 0) {
                sCtx.moveTo(x, y);
                sbCtx.moveTo(x, y);
            } else {
                sCtx.lineTo(x, y);
                sbCtx.lineTo(x, y);
            }
        }
        sCtx.strokeStyle = 'rgba(251, 191, 96, 0.48)';
        sCtx.lineWidth = 4.2;
        sCtx.stroke();

        sbCtx.strokeStyle = '#dcdcdc';
        sbCtx.lineWidth = 5.0;
        sbCtx.stroke();

        // Creux d'ombre terre de Sienne (contour mature cartoon)
        sCtx.beginPath();
        sbCtx.beginPath();
        for (let x = 0; x <= sandSize; x += 8) {
            const y = baseY + 5.5 + Math.sin(x * freq + phase) * amp;
            if (x === 0) {
                sCtx.moveTo(x, y);
                sbCtx.moveTo(x, y);
            } else {
                sCtx.lineTo(x, y);
                sbCtx.lineTo(x, y);
            }
        }
        sCtx.strokeStyle = 'rgba(92, 32, 14, 0.52)';
        sCtx.lineWidth = 3.0;
        sCtx.stroke();

        sbCtx.strokeStyle = '#2d2d2d';
        sbCtx.lineWidth = 3.5;
        sbCtx.stroke();
    }

    // Grain minéral d'oxyde de fer & quartz
    for (let i = 0; i < 650; i++) {
        const px = rand() * sandSize;
        const py = rand() * sandSize;
        const r = 1 + rand() * 2.2;
        sCtx.fillStyle = rand() > 0.5 ? 'rgba(253, 212, 138, 0.32)' : 'rgba(69, 22, 10, 0.28)';
        sCtx.fillRect(px, py, r, r);
    }

    // 2. Texture de grès stratifié Permien-Trias (Painted Desert / Red Beds) + bump map
    const strataSize = 512;
    const strataCanvas = document.createElement('canvas');
    const strataBumpCanvas = document.createElement('canvas');
    strataCanvas.width = strataBumpCanvas.width = strataSize;
    strataCanvas.height = strataBumpCanvas.height = strataSize;
    const rCtx = strataCanvas.getContext('2d');
    const rbCtx = strataBumpCanvas.getContext('2d');

    const strataPalette = [
        '#6b1f14', '#8f2d18', '#b5441c', '#d46a28',
        '#c25420', '#7c2416', '#e09346', '#9e3619',
        '#5c1a10', '#cc6226', '#ad3d1b', '#d98234'
    ];

    let curY = 0;
    let bandIdx = 0;
    while (curY < strataSize) {
        const bandH = 18 + rand() * 34;
        const col = strataPalette[bandIdx % strataPalette.length];
        bandIdx++;

        rCtx.fillStyle = col;
        rCtx.fillRect(0, curY, strataSize, bandH + 2);

        const lum = Math.floor(95 + rand() * 115);
        rbCtx.fillStyle = `rgb(${lum},${lum},${lum})`;
        rbCtx.fillRect(0, curY, strataSize, bandH + 2);

        // Ligne de strate sédimentaire encrée
        rCtx.beginPath();
        rbCtx.beginPath();
        for (let x = 0; x <= strataSize; x += 16) {
            const wy = curY + Math.sin(x * 0.025 + bandIdx) * 3.5;
            if (x === 0) {
                rCtx.moveTo(x, wy);
                rbCtx.moveTo(x, wy);
            } else {
                rCtx.lineTo(x, wy);
                rbCtx.lineTo(x, wy);
            }
        }
        rCtx.strokeStyle = 'rgba(42, 12, 8, 0.72)';
        rCtx.lineWidth = 3.2;
        rCtx.stroke();

        rbCtx.strokeStyle = '#1d1d1d';
        rbCtx.lineWidth = 4.2;
        rbCtx.stroke();

        // Liseré supérieur ocre clair
        rCtx.strokeStyle = 'rgba(253, 215, 148, 0.28)';
        rCtx.lineWidth = 1.6;
        rCtx.stroke();

        curY += bandH;
    }

    // Fissures verticales d'érosion désertique
    for (let c = 0; c < 26; c++) {
        let cx = rand() * strataSize;
        let cy = rand() * strataSize;
        rCtx.beginPath();
        rbCtx.beginPath();
        rCtx.moveTo(cx, cy);
        rbCtx.moveTo(cx, cy);
        for (let seg = 0; seg < 4; seg++) {
            cx += (rand() - 0.5) * 18;
            cy += 22 + rand() * 35;
            rCtx.lineTo(cx, cy);
            rbCtx.lineTo(cx, cy);
        }
        rCtx.strokeStyle = 'rgba(38, 11, 6, 0.65)';
        rCtx.lineWidth = 2.2;
        rCtx.stroke();

        rbCtx.strokeStyle = '#141414';
        rbCtx.lineWidth = 3.4;
        rbCtx.stroke();
    }

    // 3. Texture d'os fossiles blanchis au soleil du désert
    const boneCanvas = document.createElement('canvas');
    boneCanvas.width = boneCanvas.height = 256;
    const fCtx = boneCanvas.getContext('2d');
    const bGrad = fCtx.createLinearGradient(0, 0, 256, 256);
    bGrad.addColorStop(0.0, '#f7ebd4');
    bGrad.addColorStop(0.45, '#e5cfa8');
    bGrad.addColorStop(0.85, '#c7a77c');
    bGrad.addColorStop(1.0, '#9a7b56');
    fCtx.fillStyle = bGrad;
    fCtx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 38; i++) {
        const y = rand() * 256;
        fCtx.strokeStyle = 'rgba(72, 42, 22, 0.34)';
        fCtx.lineWidth = 1.2 + rand() * 1.4;
        fCtx.beginPath();
        fCtx.moveTo(0, y);
        fCtx.lineTo(256, y + (rand() - 0.5) * 18);
        fCtx.stroke();
    }

    _cachedDesertCanvases = {
        sandCanvas,
        sandBumpCanvas,
        strataCanvas,
        strataBumpCanvas,
        boneCanvas
    };
    return _cachedDesertCanvases;
}

function getDesertPBRMaps() {
    const canvases = getDesertPBRCanvases();
    if (!canvases || typeof THREE === 'undefined' || !THREE.CanvasTexture) {
        return {
            sandMap: null,
            sandBump: null,
            strataMap: null,
            strataBump: null,
            boneMap: null
        };
    }

    const sandMap = new THREE.CanvasTexture(canvases.sandCanvas);
    const sandBump = new THREE.CanvasTexture(canvases.sandBumpCanvas);
    const strataMap = new THREE.CanvasTexture(canvases.strataCanvas);
    const strataBump = new THREE.CanvasTexture(canvases.strataBumpCanvas);
    const boneMap = new THREE.CanvasTexture(canvases.boneCanvas);

    [sandMap, sandBump, strataMap, strataBump, boneMap].forEach(tex => {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
    });
    sandMap.repeat.set(7, 5);
    sandBump.repeat.set(7, 5);
    strataMap.repeat.set(2, 2);
    strataBump.repeat.set(2, 2);

    if (THREE.SRGBColorSpace) {
        sandMap.colorSpace = THREE.SRGBColorSpace;
        strataMap.colorSpace = THREE.SRGBColorSpace;
        boneMap.colorSpace = THREE.SRGBColorSpace;
    } else if (THREE.sRGBEncoding) {
        sandMap.encoding = THREE.sRGBEncoding;
        strataMap.encoding = THREE.sRGBEncoding;
        boneMap.encoding = THREE.sRGBEncoding;
    }

    return { sandMap, sandBump, strataMap, strataBump, boneMap };
}

registerArena({
    id: 'desert',
    label: "🏜️ Désert Rouge de la Pangée (Permien & Trias)",
    skyColor: 0x5c2414,
    floorColor: 0x9c4a24,
    accentColor: 0xc2651a,

    // Relief dunaire et lit d'oued asséché : cuvette centrale, dunes ondulantes et corniches de grès
    getGroundHeight(x, z = 0) {
        void z;
        const wadiDip = -Math.exp(-(x * x) / 14.0) * 0.32;
        const windDunes = Math.sin(x * 0.40 + 0.4) * 0.22 + Math.cos(x * 0.88) * 0.09;
        const mesaFlanks = Math.pow(Math.min(1, Math.abs(x) / 11.5), 2) * 0.56;
        return wadiDip + windDunes + mesaFlanks + 0.06;
    },

    buildDecor(group, scene) {
        void scene;
        const targetGroup = group || arenaGroup;
        const { sandMap, sandBump, strataMap, strataBump, boneMap } = getDesertPBRMaps();

        // ====================================================================
        // 1. MER DE DUNES BARCHANES OCRE-ROUGE DE LA PANGÉE
        // ====================================================================
        const sandGeo = new THREE.PlaneGeometry(185, 125, 52, 32);
        sandGeo.rotateX(-Math.PI / 2);
        const sPos = sandGeo.attributes.position;
        for (let i = 0; i < sPos.count; i++) {
            const sx = sPos.getX(i);
            const sz = sPos.getZ(i);
            // Garder la cuvette sous le socle de combat libre, puis élever les dunes en arrière-plan
            const distFromStage = Math.max(0, Math.min(1, (Math.abs(sz) - 7.5) / 14.0));
            const backSlope = sz < -8 ? Math.min(2.6, (-sz - 8) * 0.065) : 0;
            const barchanWave = Math.sin(sx * 0.14 + Math.cos(sz * 0.12) * 1.4) * 1.15 +
                                Math.cos(sz * 0.22 - sx * 0.08) * 0.55;
            sPos.setY(i, backSlope + distFromStage * barchanWave);
        }
        sandGeo.computeVertexNormals();

        const sandMat = new THREE.MeshStandardMaterial({
            map: sandMap,
            bumpMap: sandBump,
            bumpScale: 0.18,
            color: 0xe69554,
            roughness: 0.88,
            metalness: 0.04
        });
        const sandSea = new THREE.Mesh(sandGeo, sandMat);
        sandSea.position.set(0, -2.25, -8);
        sandSea.receiveShadow = true;
        targetGroup.add(sandSea);

        // ====================================================================
        // 2. MESAS STRATIFIÉES (RED BEDS), BUTTES & ARCHE DE GRÈS NATURELLE
        // ====================================================================
        const strataMat = new THREE.MeshStandardMaterial({
            map: strataMap,
            bumpMap: strataBump,
            bumpScale: 0.14,
            color: 0xd9733c,
            roughness: 0.84,
            metalness: 0.08
        });
        const darkSandstoneMat = new THREE.MeshStandardMaterial({
            map: strataMap,
            bumpMap: strataBump,
            bumpScale: 0.12,
            color: 0x9a3d1c,
            roughness: 0.90,
            metalness: 0.06
        });
        const caprockMat = new THREE.MeshStandardMaterial({
            map: strataMap,
            bumpMap: strataBump,
            bumpScale: 0.10,
            color: 0xc25724,
            roughness: 0.80,
            metalness: 0.08
        });

        function addStratifiedMesa(x, z, radius, height, seedOffset) {
            const mGroup = new THREE.Group();
            mGroup.position.set(x, -2.3, z);

            // Tablier d'éboulis (talus) évasé à la base
            const talusH = height * 0.34;
            const talusGeo = new THREE.CylinderGeometry(radius * 0.78, radius * 1.38, talusH, 9, 2);
            const tPos = talusGeo.attributes.position;
            for (let i = 0; i < tPos.count; i++) {
                const vx = tPos.getX(i);
                const vz = tPos.getZ(i);
                const ang = Math.atan2(vz, vx);
                const crag = 1.0 + 0.14 * Math.sin(ang * 4 + seedOffset);
                tPos.setX(i, vx * crag);
                tPos.setZ(i, vz * crag);
            }
            talusGeo.computeVertexNormals();
            const talus = new THREE.Mesh(talusGeo, darkSandstoneMat);
            talus.position.y = talusH * 0.5;
            talus.receiveShadow = true;
            mGroup.add(talus);

            // Paroi verticale érodée en strates
            const cliffH = height * 0.54;
            const cliffGeo = new THREE.CylinderGeometry(radius * 0.64, radius * 0.78, cliffH, 9, 4);
            const cPos = cliffGeo.attributes.position;
            for (let i = 0; i < cPos.count; i++) {
                const vx = cPos.getX(i);
                const vy = cPos.getY(i);
                const vz = cPos.getZ(i);
                const ang = Math.atan2(vz, vx);
                const ledge = 1.0 + 0.09 * Math.sin(vy * 1.3 + seedOffset) + 0.11 * Math.cos(ang * 5 + seedOffset);
                cPos.setX(i, vx * ledge);
                cPos.setZ(i, vz * ledge);
            }
            cliffGeo.computeVertexNormals();
            const cliff = new THREE.Mesh(cliffGeo, strataMat);
            cliff.position.y = talusH + cliffH * 0.48;
            cliff.castShadow = true;
            cliff.receiveShadow = true;
            mGroup.add(cliff);

            // Dalle sommitale plate en surplomb (caprock typique des mesas)
            const capH = height * 0.15;
            const capGeo = new THREE.CylinderGeometry(radius * 0.74, radius * 0.62, capH, 9, 1);
            const cap = new THREE.Mesh(capGeo, caprockMat);
            cap.position.y = talusH + cliffH + capH * 0.45;
            cap.rotation.y = seedOffset * 0.35;
            cap.castShadow = true;
            mGroup.add(cap);

            targetGroup.add(mGroup);
        }

        const mesaDefs = [
            { x: -23.5, z: -21.0, r: 6.4, h: 14.5, s: 1.1 },
            { x: -12.5, z: -24.5, r: 4.5, h: 11.2, s: 2.3 },
            { x: 13.0, z: -23.5, r: 5.2, h: 12.6, s: 3.7 },
            { x: 24.0, z: -19.5, r: 6.2, h: 14.2, s: 4.9 },
            { x: -3.2, z: -31.0, r: 4.2, h: 10.2, s: 5.8 }
        ];
        mesaDefs.forEach(m => addStratifiedMesa(m.x, m.z, m.r, m.h, m.s));

        // Arche de grès rouge monumentale (style Delicate Arch / Badlands du Trias) encadrant le soleil
        const archGroup = new THREE.Group();
        archGroup.position.set(1.0, -1.6, -16.5);
        archGroup.rotation.y = -0.10;

        const archGeo = new THREE.TorusGeometry(6.8, 1.18, 9, 28, Math.PI);
        const aPos = archGeo.attributes.position;
        for (let i = 0; i < aPos.count; i++) {
            const ax = aPos.getX(i);
            const ay = aPos.getY(i);
            const az = aPos.getZ(i);
            const shoulderFactor = 1.0 + 0.24 * Math.pow(Math.abs(ax) / 7.5, 2);
            const lintelFlatten = ay > 4.6 ? 4.6 + (ay - 4.6) * 0.68 : ay;
            const crag = 1.0 + 0.14 * Math.sin(ax * 0.9 + ay * 0.85) + 0.08 * Math.cos(ax * 1.7);
            aPos.setXYZ(i, ax * 1.14, lintelFlatten * 1.02 + crag * 0.12, az * 1.25 * shoulderFactor);
        }
        archGeo.computeVertexNormals();
        const archSpan = new THREE.Mesh(archGeo, strataMat);
        archSpan.position.y = 2.4;
        archSpan.castShadow = true;
        archSpan.receiveShadow = true;
        archGroup.add(archSpan);

        // Contreforts massifs et blocs rocheux aux pieds de l'arche
        [-7.6, 7.6].forEach((px, idx) => {
            const foot = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 3.3, 4.8, 8), darkSandstoneMat);
            foot.position.set(px, 1.5, idx === 0 ? 0.2 : -0.2);
            foot.rotation.y = idx * 0.8;
            archGroup.add(foot);
        });
        targetGroup.add(archGroup);

        // Cheminées de fée (Hoodoos) sculptées par l'érosion sur les flancs du canyon
        function addHoodoo(x, z, scale = 1.0) {
            const hGroup = new THREE.Group();
            hGroup.position.set(x, -2.1, z);

            const base = new THREE.Mesh(new THREE.CylinderGeometry(0.95 * scale, 1.65 * scale, 2.2 * scale, 7), darkSandstoneMat);
            base.position.y = 1.1 * scale;
            hGroup.add(base);

            const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.48 * scale, 0.85 * scale, 3.6 * scale, 7), strataMat);
            neck.position.y = 3.8 * scale;
            hGroup.add(neck);

            const mushroomCap = new THREE.Mesh(new THREE.CylinderGeometry(1.45 * scale, 1.15 * scale, 1.1 * scale, 7), caprockMat);
            mushroomCap.position.y = 6.0 * scale;
            mushroomCap.rotation.z = (x > 0 ? -0.07 : 0.07);
            hGroup.add(mushroomCap);

            targetGroup.add(hGroup);
        }

        addHoodoo(-17.8, -9.2, 1.15);
        addHoodoo(17.6, -9.5, 1.10);
        addHoodoo(-15.0, -14.2, 0.88);
        addHoodoo(15.2, -13.8, 0.92);

        // ====================================================================
        // 3. SOLEIL BRÛLANT DE LA PANGÉE, COURONNE SOLAIRE & RAYONS DE CHALEUR
        // ====================================================================
        const sunGroup = new THREE.Group();
        sunGroup.position.set(1.6, 8.4, -36.0);
        targetGroup.add(sunGroup);

        const sunCore = new THREE.Mesh(
            new THREE.CircleGeometry(3.8, 32),
            new THREE.MeshBasicMaterial({ color: 0xfff3c4, fog: false })
        );
        sunGroup.add(sunCore);

        const sunHaloInnerMat = new THREE.MeshBasicMaterial({
            color: 0xfbbf24,
            transparent: true,
            opacity: 0.44,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            fog: false
        });
        const sunHaloInner = new THREE.Mesh(new THREE.CircleGeometry(6.4, 32), sunHaloInnerMat);
        sunHaloInner.position.z = -0.15;
        sunGroup.add(sunHaloInner);

        const sunHaloOuterMat = new THREE.MeshBasicMaterial({
            color: 0xea580c,
            transparent: true,
            opacity: 0.24,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            fog: false
        });
        const sunHaloOuter = new THREE.Mesh(new THREE.CircleGeometry(10.6, 32), sunHaloOuterMat);
        sunHaloOuter.position.z = -0.3;
        sunGroup.add(sunHaloOuter);

        // Lueur rasante d'horizon désertique au crépuscule
        const horizonGlowMat = new THREE.MeshBasicMaterial({
            color: 0xf97316,
            transparent: true,
            opacity: 0.16,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            fog: false
        });
        const horizonGlow = new THREE.Mesh(new THREE.PlaneGeometry(140, 20), horizonGlowMat);
        horizonGlow.position.set(0, 5.0, -44);
        targetGroup.add(horizonGlow);

        // Rayons solaires volumétriques obliques traversant le canyon
        const sunbeams = [];
        const beamMat = new THREE.MeshBasicMaterial({
            color: 0xfde68a,
            transparent: true,
            opacity: 0.055,
            side: THREE.DoubleSide,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            fog: false
        });
        for (let i = 0; i < 4; i++) {
            const beam = new THREE.Mesh(new THREE.ConeGeometry(4.2 + i * 1.1, 28, 8, 1, true), beamMat.clone());
            beam.position.set(-10 + i * 7.5, 10.5, -20 - (i % 2) * 4);
            beam.rotation.z = -0.32;
            beam.rotation.x = 0.14;
            targetGroup.add(beam);
            sunbeams.push(beam);
        }

        // Lumière solaire chaude rasante illuminant les mesas et fossiles
        const desertSunLight = new THREE.PointLight(0xffa447, 1.55, 68);
        desertSunLight.position.set(2, 12, -17);
        targetGroup.add(desertSunLight);

        // ====================================================================
        // 4. FOSSILES DU PERMIEN-TRIAS, BOIS PÉTRIFIÉ & FLORE XÉROPHILE
        // ====================================================================
        const fossilBoneMat = new THREE.MeshStandardMaterial({
            map: boneMap,
            color: 0xf3e4c6,
            roughness: 0.56,
            metalness: 0.08
        });
        const darkSocketMat = new THREE.MeshBasicMaterial({ color: 0x2a1008 });

        // 4A. Squelette colossal de Synapside à Voile Dorsale (Permien) à moitié ensablé à gauche
        const sailFossilGroup = new THREE.Group();
        sailFossilGroup.position.set(-10.8, -1.65, -8.2);
        sailFossilGroup.rotation.y = 0.32;

        // Colonne vertébrale incurvée + 6 côtes thoraciques + hautes épines neurales (voile de Dimetrodon)
        for (let r = 0; r < 6; r++) {
            const rx = (r - 2.5) * 1.05;
            const ribRadius = 2.05 - Math.abs(r - 2.5) * 0.22;
            const rib = new THREE.Mesh(
                new THREE.TorusGeometry(ribRadius, 0.17, 6, 16, Math.PI * 0.82),
                fossilBoneMat
            );
            rib.position.set(rx, 0.9, 0);
            rib.rotation.y = Math.PI / 2;
            rib.rotation.z = -0.18 + r * 0.05;
            sailFossilGroup.add(rib);

            // Vertèbre massive
            const vert = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.65, 6), fossilBoneMat);
            vert.rotation.z = Math.PI / 2;
            vert.position.set(rx, 2.35 - Math.abs(r - 2.5) * 0.15, 0);
            sailFossilGroup.add(vert);

            // Épine neurale dorsale de voile permienne
            const spineH = 3.2 - Math.abs(r - 2.5) * 0.58;
            const spine = new THREE.Mesh(new THREE.ConeGeometry(0.11, spineH, 5), fossilBoneMat);
            spine.position.set(rx, 2.35 - Math.abs(r - 2.5) * 0.15 + spineH * 0.5, -0.05);
            spine.rotation.z = (r - 2.5) * -0.06;
            sailFossilGroup.add(spine);
        }
        targetGroup.add(sailFossilGroup);

        // 4B. Crâne géant d'Archosaure / Gorgonopsien blanchi au soleil à droite (vu de 3/4 profil)
        const skullGroup = new THREE.Group();
        skullGroup.position.set(10.8, -0.65, -8.3);
        skullGroup.rotation.set(0.06, -Math.PI * 0.62, 0.08);

        // Boîte crânienne postérieure arrondie
        const braincase = new THREE.Mesh(new THREE.DodecahedronGeometry(1.25, 1), fossilBoneMat);
        braincase.scale.set(0.92, 0.95, 1.15);
        braincase.position.set(0, 1.45, -0.85);
        skullGroup.add(braincase);

        // Museau allongé de prédateur synapside / rauisuchien
        const snout = new THREE.Mesh(new THREE.BoxGeometry(1.45, 1.15, 2.55), fossilBoneMat);
        snout.position.set(0, 1.25, 0.9);
        snout.rotation.x = 0.08;
        skullGroup.add(snout);

        const noseTip = new THREE.Mesh(new THREE.ConeGeometry(0.76, 1.1, 6), fossilBoneMat);
        noseTip.rotation.x = Math.PI / 2;
        noseTip.scale.set(0.95, 1.0, 0.78);
        noseTip.position.set(0, 1.15, 2.55);
        skullGroup.add(noseTip);

        // Crête sourcilière osseuse
        const browRidge = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.28, 1.15), fossilBoneMat);
        browRidge.position.set(0, 2.02, -0.15);
        skullGroup.add(browRidge);

        // Mâchoire inférieure entr'ouverte
        const mandible = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.42, 2.75), fossilBoneMat);
        mandible.position.set(0, 0.42, 0.72);
        mandible.rotation.x = 0.22;
        skullGroup.add(mandible);

        [-0.74, 0.74].forEach(side => {
            // Orbite oculaire sombre + fosse temporale
            const orbit = new THREE.Mesh(new THREE.SphereGeometry(0.36, 8, 8), darkSocketMat);
            orbit.position.set(side, 1.56, -0.22);
            skullGroup.add(orbit);

            const fenestra = new THREE.Mesh(new THREE.SphereGeometry(0.28, 7, 7), darkSocketMat);
            fenestra.position.set(side, 1.52, -0.95);
            skullGroup.add(fenestra);

            // Grands crocs sabre de gorgonopsien + rangée dentaire
            const fang = new THREE.Mesh(new THREE.ConeGeometry(0.14, 1.05, 5), fossilBoneMat);
            fang.position.set(side * 0.78, 0.65, 1.65);
            fang.rotation.x = Math.PI;
            skullGroup.add(fang);

            for (let t = 0; t < 3; t++) {
                const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.48, 4), fossilBoneMat);
                tooth.position.set(side * 0.72, 0.78, 0.35 + t * 0.42);
                tooth.rotation.x = Math.PI;
                skullGroup.add(tooth);
            }
        });
        targetGroup.add(skullGroup);

        // 4C. Troncs de forêt pétrifiée du Trias (Formation de Chinle : écorce minéralisée & cœur d'ambre/agate)
        const petrifiedBarkMat = new THREE.MeshStandardMaterial({
            map: strataMap,
            color: 0x7c3318,
            roughness: 0.72,
            metalness: 0.16
        });
        const agateCoreMat = new THREE.MeshStandardMaterial({
            color: 0xf59e0b,
            emissive: 0xd97706,
            emissiveIntensity: 0.55,
            roughness: 0.22,
            metalness: 0.35
        });

        const logDefs = [
            { x: -14.2, y: -0.45, z: -7.6, len: 3.6, r: 0.52, rotY: 0.42, tiltZ: 0.10 },
            { x: -4.6, y: -0.62, z: -8.6, len: 3.2, r: 0.46, rotY: -0.35, tiltZ: -0.08 },
            { x: 5.2, y: -0.55, z: -8.4, len: 3.5, r: 0.50, rotY: 0.28, tiltZ: 0.09 },
            { x: 14.4, y: -0.42, z: -7.5, len: 3.2, r: 0.48, rotY: -0.52, tiltZ: -0.10 }
        ];
        logDefs.forEach(ld => {
            const logGroup = new THREE.Group();
            logGroup.position.set(ld.x, ld.y, ld.z);
            logGroup.rotation.set(0, ld.rotY, ld.tiltZ);

            const trunk = new THREE.Mesh(
                new THREE.CylinderGeometry(ld.r * 0.88, ld.r, ld.len, 8),
                petrifiedBarkMat
            );
            trunk.rotation.z = Math.PI / 2;
            trunk.castShadow = true;
            logGroup.add(trunk);

            // Disques d'agate ambrée aux extrémités fracturées du tronc pétrifié
            [-ld.len * 0.502, ld.len * 0.502].forEach(ex => {
                const cap = new THREE.Mesh(new THREE.CircleGeometry(ld.r * 0.74, 10), agateCoreMat);
                cap.position.x = ex;
                cap.rotation.y = ex > 0 ? Math.PI / 2 : -Math.PI / 2;
                logGroup.add(cap);
            });

            targetGroup.add(logGroup);
        });

        // 4D. Flore xérophile du Permien-Trias (Cycads arides & rosettes sèches oscillant dans le vent)
        const desertFlora = [];
        const cycadTrunkMat = new THREE.MeshStandardMaterial({ color: 0x5c341d, roughness: 0.92 });
        const cycadFrondMat = new THREE.MeshStandardMaterial({
            color: 0x6b7c32,
            roughness: 0.72,
            side: THREE.DoubleSide
        });

        function addDesertCycad(x, y, z, scale = 1.0) {
            const cGroup = new THREE.Group();
            cGroup.position.set(x, y, z);

            const trunkH = 1.55 * scale;
            const trunk = new THREE.Mesh(
                new THREE.CylinderGeometry(0.30 * scale, 0.44 * scale, trunkH, 7),
                cycadTrunkMat
            );
            trunk.position.y = trunkH * 0.5;
            cGroup.add(trunk);

            const crown = new THREE.Group();
            crown.position.y = trunkH;
            for (let f = 0; f < 9; f++) {
                const angle = (f / 9) * Math.PI * 2;
                const frond = new THREE.Mesh(new THREE.ConeGeometry(0.26 * scale, 2.05 * scale, 4), cycadFrondMat);
                frond.rotation.z = 1.02;
                frond.rotation.y = angle;
                frond.position.set(Math.cos(angle) * 0.72 * scale, 0.28 * scale, -Math.sin(angle) * 0.72 * scale);
                crown.add(frond);
            }
            cGroup.add(crown);
            targetGroup.add(cGroup);

            desertFlora.push({
                crown,
                phase: x * 0.7 + z,
                speed: 1.8 + (Math.abs(x) % 3) * 0.35
            });
        }

        [
            [-16.0, -0.95, -7.4, 1.08], [-7.2, -1.05, -7.4, 0.96], [-2.0, -1.15, -7.9, 0.88],
            [3.2, -1.10, -7.7, 0.94], [7.6, -1.02, -7.4, 0.92], [15.8, -0.95, -7.6, 1.05]
        ].forEach(c => addDesertCycad(c[0], c[1], c[2], c[3]));

        // ====================================================================
        // 5. TOURBILLONS DE SABLE (DUST DEVILS), RAFALES & PTÉROSAURES DU TRIAS
        // ====================================================================
        const dustDevils = [];
        const dustConeMat = new THREE.MeshBasicMaterial({
            color: 0xe69a52,
            transparent: true,
            opacity: 0.16,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        const dustWispMat = new THREE.MeshBasicMaterial({
            color: 0xf5b971,
            transparent: true,
            opacity: 0.22,
            side: THREE.DoubleSide,
            depthWrite: false
        });

        [
            { baseX: -12.5, z: -14.5, scale: 1.0, driftAmp: 4.0, speed: 0.36 },
            { baseX: 12.0, z: -19.5, scale: 1.25, driftAmp: 5.0, speed: 0.28 }
        ].forEach((dd, idx) => {
            const funnelGroup = new THREE.Group();
            funnelGroup.position.set(dd.baseX, -1.7, dd.z);

            // Entonnoir translucide continu du tourbillon de sable
            const coneGeo = new THREE.CylinderGeometry(1.75 * dd.scale, 0.32 * dd.scale, 8.8 * dd.scale, 12, 5, true);
            const cPos = coneGeo.attributes.position;
            for (let i = 0; i < cPos.count; i++) {
                const cy = cPos.getY(i);
                const twist = Math.sin(cy * 0.75 + idx) * 0.28 * dd.scale;
                cPos.setX(i, cPos.getX(i) + twist);
            }
            coneGeo.computeVertexNormals();
            const funnelCone = new THREE.Mesh(coneGeo, dustConeMat);
            funnelCone.position.y = 4.4 * dd.scale;
            funnelGroup.add(funnelCone);

            // Fines volutes obliques de poussière s'enroulant autour de l'entonnoir
            const rings = [];
            for (let r = 0; r < 5; r++) {
                const t = r / 4;
                const rad = (0.42 + t * 1.45) * dd.scale;
                const ring = new THREE.Mesh(
                    new THREE.TorusGeometry(rad, 0.065 * dd.scale, 5, 16, Math.PI * 1.35),
                    dustWispMat
                );
                ring.rotation.x = Math.PI / 2 + 0.16;
                ring.position.y = (0.9 + r * 1.65) * dd.scale;
                funnelGroup.add(ring);
                rings.push({ mesh: ring, idx: r });
            }
            targetGroup.add(funnelGroup);
            dustDevils.push({
                group: funnelGroup,
                rings,
                baseX: dd.baseX,
                z: dd.z,
                driftAmp: dd.driftAmp,
                speed: dd.speed,
                phase: idx * 2.4
            });
        });

        // Particules de sable et de poussière rouge balayées par le vent chaud
        const sandParticles = [];
        const sandGrainGeo = new THREE.OctahedronGeometry(0.085, 0);
        const sandGrainMat = new THREE.MeshBasicMaterial({
            color: 0xfcd38d,
            transparent: true,
            opacity: 0.68
        });
        for (let i = 0; i < 80; i++) {
            const grain = new THREE.Mesh(sandGrainGeo, sandGrainMat);
            const gx = -24 + Math.random() * 48;
            const gy = 0.2 + Math.random() * 11.5;
            const gz = -14 + Math.random() * 19;
            grain.position.set(gx, gy, gz);
            targetGroup.add(grain);
            sandParticles.push({
                mesh: grain,
                speedX: 6.5 + Math.random() * 6.0,
                baseY: gy,
                bobAmp: 0.35 + Math.random() * 0.55,
                phase: Math.random() * Math.PI * 2
            });
        }

        // Ptérosaures primitifs du Trias (Eudimorphodon) planant dans les courants thermiques
        const pterosaurs = [];
        const pteroMat = new THREE.MeshStandardMaterial({
            color: 0x3b180e,
            roughness: 0.7,
            side: THREE.DoubleSide
        });

        [
            { radius: 14, height: 11.5, speed: 0.36, phase: 0.4 },
            { radius: 20, height: 13.8, speed: 0.28, phase: 2.6 },
            { radius: 17, height: 10.2, speed: 0.42, phase: 4.7 }
        ].forEach(cfg => {
            const pGroup = new THREE.Group();
            const body = new THREE.Mesh(new THREE.ConeGeometry(0.18, 1.15, 5), pteroMat);
            body.rotation.x = Math.PI / 2;
            pGroup.add(body);

            const wingGeo = new THREE.BufferGeometry();
            wingGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
                0, 0, 0.22,
                1.85, 0.04, -0.08,
                0, 0, -0.36
            ]), 3));
            wingGeo.computeVertexNormals();

            const leftWing = new THREE.Mesh(wingGeo, pteroMat);
            const rightWing = new THREE.Mesh(wingGeo, pteroMat);
            rightWing.scale.x = -1;
            pGroup.add(leftWing, rightWing);
            targetGroup.add(pGroup);

            pterosaurs.push({
                group: pGroup,
                leftWing,
                rightWing,
                radius: cfg.radius,
                height: cfg.height,
                speed: cfg.speed,
                phase: cfg.phase
            });
        });

        return {
            sandMap,
            sunHaloInner,
            sunHaloOuter,
            sunbeams,
            desertSunLight,
            desertFlora,
            dustDevils,
            sandParticles,
            pterosaurs
        };
    },

    animate(decor, group, scene, time, dt) {
        void group;
        void scene;
        if (!decor) return;

        // 1. Dérive subtile des rides de sable balayées par le vent
        if (decor.sandMap) {
            decor.sandMap.offset.x = (time * 0.012) % 1;
        }

        // 2. Pulsation thermique du soleil de la Pangée et des rayons de chaleur
        if (decor.sunHaloInner && decor.sunHaloOuter) {
            decor.sunHaloInner.scale.setScalar(1.0 + Math.sin(time * 1.4) * 0.06);
            decor.sunHaloOuter.scale.setScalar(1.0 + Math.cos(time * 0.95) * 0.08);
        }
        if (decor.sunbeams) {
            decor.sunbeams.forEach((beam, idx) => {
                if (beam.material) {
                    beam.material.opacity = 0.042 + Math.sin(time * 1.1 + idx * 1.3) * 0.018;
                }
            });
        }
        if (decor.desertSunLight) {
            decor.desertSunLight.intensity = 1.45 + Math.sin(time * 2.1) * 0.16;
        }

        // 3. Balancement des cycads arides dans la brise brûlante
        if (decor.desertFlora) {
            decor.desertFlora.forEach(f => {
                f.crown.rotation.z = Math.sin(time * f.speed + f.phase) * 0.09;
                f.crown.rotation.x = Math.cos(time * (f.speed * 0.75) + f.phase) * 0.05;
            });
        }

        // 4. Rotation et dérive des tourbillons de poussière (dust devils)
        if (decor.dustDevils) {
            decor.dustDevils.forEach(dd => {
                dd.group.position.x = dd.baseX + Math.sin(time * dd.speed + dd.phase) * dd.driftAmp;
                dd.group.rotation.y += dt * 2.8;
                dd.rings.forEach(r => {
                    const wobble = Math.sin(time * 3.6 + r.idx * 0.7 + dd.phase) * 0.28;
                    r.mesh.position.x = wobble;
                    r.mesh.rotation.z = time * (2.5 + r.idx * 0.35);
                });
            });
        }

        // 5. Rafales horizontales de sable et de poussière dorée
        if (decor.sandParticles) {
            decor.sandParticles.forEach(sp => {
                sp.mesh.position.x += sp.speedX * dt;
                sp.mesh.position.y = sp.baseY + Math.sin(time * 2.4 + sp.phase) * sp.bobAmp;
                sp.mesh.rotation.z += dt * 4.2;
                if (sp.mesh.position.x > 24) {
                    sp.mesh.position.x = -24;
                    sp.baseY = 0.2 + Math.random() * 11.5;
                }
            });
        }

        // 6. Vol thermique des ptérosaures du Trias devant le soleil
        if (decor.pterosaurs) {
            decor.pterosaurs.forEach(p => {
                const angle = time * p.speed + p.phase;
                const px = Math.cos(angle) * p.radius;
                const pz = -21 + Math.sin(angle) * (p.radius * 0.45);
                const py = p.height + Math.sin(time * 1.3 + p.phase) * 1.1;

                p.group.position.set(px, py, pz);
                p.group.rotation.y = -angle;
                p.group.rotation.z = 0.18;

                const flap = Math.sin(time * 5.8 + p.phase) * 0.38;
                p.leftWing.rotation.z = flap;
                p.rightWing.rotation.z = -flap;
            });
        }
    }
});
