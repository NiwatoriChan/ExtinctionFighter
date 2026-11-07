/* ============================================================================
 * COMBATTANT : PACHYRHINOSAURE (Pachyrhinosaurus Canadensis)
 * Données (stats, skins, textes), modèle 3D paléontologique procédural haute
 * fidélité conçu et validé avec Blender 5.2 d'après assets/portraits/pachyrhino.png
 * (textures PBR 1024x1024 d'écailles polygonales gris-taupe rocheux et rosettes
 * d'ostéodermes saupoudrées de neige boréale sur l'échine, collerette blindée
 * dressée à fenêtres pariétales serties d'écussons osseux, cornes latérales P3
 * géantes recourbées vers l'extérieur et le bas, crochets médiaux P2, 6 paires
 * d'époccipitaux S1-S6, bosse nasale pachyostotique en chou-fleur cabossé, trio
 * d'épines frontales dressées, corne jugale saillante, œil ambre-orange sous
 * arcade sourcilière noueuse, bec de perroquet sillonné et tubercules dorsaux),
 * animations biomécaniques, coups spéciaux & fatalité.
 * ============================================================================ */

// Cache global des textures procédurales PBR 1024x1024 pour éviter toute régénération coûteuse
let _cachedPachyPBRMaps = null;

function getPachyPBRMaps() {
    if (_cachedPachyPBRMaps) return _cachedPachyPBRMaps;

    function applySRGB(tex) {
        if (THREE.SRGBColorSpace) {
            tex.colorSpace = THREE.SRGBColorSpace;
        } else if (THREE.sRGBEncoding) {
            tex.encoding = THREE.sRGBEncoding;
        }
    }

    // Fonctions de bruit et Voronoï cellulaire déterministes 2D (fidèles au shader Blender 5.2 v5)
    function hash2(ix, iy) {
        const n = Math.sin(ix * 127.1 + iy * 311.7) * 43758.5453123;
        return n - Math.floor(n);
    }

    function noise2(x, y) {
        const ix = Math.floor(x);
        const iy = Math.floor(y);
        const fx = x - ix;
        const fy = y - iy;
        const ux = fx * fx * (3.0 - 2.0 * fx);
        const uy = fy * fy * (3.0 - 2.0 * fy);
        const a = hash2(ix, iy);
        const b = hash2(ix + 1, iy);
        const c = hash2(ix, iy + 1);
        const d = hash2(ix + 1, iy + 1);
        return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
    }

    function fbm2(x, y, octaves = 4) {
        let val = 0.0;
        let amp = 0.5;
        let freq = 1.0;
        for (let i = 0; i < octaves; i++) {
            val += amp * noise2(x * freq, y * freq);
            freq *= 2.05;
            amp *= 0.5;
        }
        return val;
    }

    // Distance au bord Voronoï (0.0 dans le sillon inter-écailles, ~0.45 au dôme de l'écaille)
    function voronoiEdge2D(x, y, periodX, periodY) {
        const ix = Math.floor(x);
        const iy = Math.floor(y);
        const fx = x - ix;
        const fy = y - iy;
        let md1 = 8.0;
        let md2 = 8.0;
        for (let j = -1; j <= 1; j++) {
            for (let i = -1; i <= 1; i++) {
                const cx = ((ix + i) % periodX + periodX) % periodX;
                const cy = ((iy + j) % periodY + periodY) % periodY;
                const rx = i + hash2(cx, cy) * 0.84 - fx;
                const ry = j + hash2(cx + 37, cy + 91) * 0.84 - fy;
                const d = Math.sqrt(rx * rx + ry * ry);
                if (d < md1) {
                    md2 = md1;
                    md1 = d;
                } else if (d < md2) {
                    md2 = d;
                }
            }
        }
        return Math.max(0.0, Math.min(1.0, (md2 - md1) * 1.35));
    }

    // 1. Peau de cératopsien boréal : écailles polygonales gris-taupe rocheux, sillons profonds & neige dorsale
    function createBodyHideMaps() {
        const size = 1024;
        const colorCanvas = document.createElement('canvas');
        const bumpCanvas = document.createElement('canvas');
        colorCanvas.width = bumpCanvas.width = size;
        colorCanvas.height = bumpCanvas.height = size;
        const cCtx = colorCanvas.getContext('2d');
        const bCtx = bumpCanvas.getContext('2d');

        const imgData = cCtx.createImageData(size, size);
        const bImgData = bCtx.createImageData(size, size);
        const data = imgData.data;
        const bData = bImgData.data;

        const scaleFreq = 32;
        const rosFreq = 12;

        for (let y = 0; y < size; y++) {
            const v = y / size;
            for (let x = 0; x < size; x++) {
                const u = x / size;
                const dorsalDist = Math.abs(u - 0.5) * 2.0; // 1.0 au dos, 0.0 au ventre

                const wx = u * scaleFreq + 0.08 * Math.sin(v * Math.PI * 6.0);
                const wy = v * scaleFreq + 0.08 * Math.cos(u * Math.PI * 6.0);
                const e1 = voronoiEdge2D(wx, wy, scaleFreq, scaleFreq);
                const e2 = voronoiEdge2D(u * rosFreq, v * rosFreq, rosFreq, rosFreq);
                const edgeVal = Math.min(e1, e2 * 1.22 + 0.03);

                const macro = 0.76 + 0.48 * fbm2(u * 8.0, v * 8.0, 3);
                const neckFolds = 0.92 + 0.08 * Math.sin(v * Math.PI * 36.0);
                const shade = Math.max(0.0, Math.min(1.0, edgeVal * macro * neckFolds));

                // Palette flashy bleu glacier polaire, cyan électrique & cobalt
                let r, g, b;
                if (shade < 0.09) {
                    const t = shade / 0.09;
                    r = 8 + t * 14;
                    g = 35 + t * 45;
                    b = 85 + t * 65;
                } else if (shade < 0.28) {
                    const t = (shade - 0.09) / 0.19;
                    r = 22 + t * 20;
                    g = 80 + t * 65;
                    b = 150 + t * 60;
                } else {
                    const t = Math.min(1.0, (shade - 0.28) / 0.52);
                    r = 42 + t * 60;
                    g = 145 + t * 70;
                    b = 210 + t * 40;
                }

                if (dorsalDist < 0.28) {
                    const bellyMix = (0.28 - dorsalDist) / 0.28;
                    r += bellyMix * 35;
                    g += bellyMix * 45;
                    b += bellyMix * 30;
                }

                // Poudrage de neige arctique sur l'échine dorsale et le haut des épaules
                const snowNoise = fbm2(u * 14.0 + 3.1, v * 14.0 + 1.7, 4);
                const snowMask = Math.max(0.0, Math.min(1.0, (dorsalDist - 0.68) * 3.2 + (snowNoise - 0.48) * 1.4));
                if (snowMask > 0.18 && edgeVal > 0.06) {
                    const sAmt = Math.min(0.92, (snowMask - 0.18) * 1.35);
                    r = r * (1.0 - sAmt) + 238 * sAmt;
                    g = g * (1.0 - sAmt) + 245 * sAmt;
                    b = b * (1.0 - sAmt) + 252 * sAmt;
                }

                const idx = (y * size + x) * 4;
                data[idx] = Math.max(0, Math.min(255, Math.round(r)));
                data[idx + 1] = Math.max(0, Math.min(255, Math.round(g)));
                data[idx + 2] = Math.max(0, Math.min(255, Math.round(b)));
                data[idx + 3] = 255;

                const bump = Math.max(0, Math.min(255, Math.round(18 + Math.pow(Math.min(1.0, edgeVal * 1.6), 0.72) * 225)));
                bData[idx] = bump;
                bData[idx + 1] = bump;
                bData[idx + 2] = bump;
                bData[idx + 3] = 255;
            }
        }

        cCtx.putImageData(imgData, 0, 0);
        bCtx.putImageData(bImgData, 0, 0);

        const colorMap = new THREE.CanvasTexture(colorCanvas);
        const bumpMap = new THREE.CanvasTexture(bumpCanvas);
        colorMap.wrapS = colorMap.wrapT = THREE.RepeatWrapping;
        bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping;
        applySRGB(colorMap);
        return { colorMap, bumpMap };
    }

    // 2. Bouclier de la collerette pariéto-squamosale : fosses pariétales pavées & couronne d'écussons osseux
    function createFrillShieldMaps() {
        const size = 1024;
        const colorCanvas = document.createElement('canvas');
        const bumpCanvas = document.createElement('canvas');
        colorCanvas.width = bumpCanvas.width = size;
        colorCanvas.height = bumpCanvas.height = size;
        const cCtx = colorCanvas.getContext('2d');
        const bCtx = bumpCanvas.getContext('2d');

        const imgData = cCtx.createImageData(size, size);
        const bImgData = bCtx.createImageData(size, size);
        const data = imgData.data;
        const bData = bImgData.data;

        for (let y = 0; y < size; y++) {
            const v = y / (size - 1);
            for (let x = 0; x < size; x++) {
                const u = x / (size - 1);
                const ang = u * Math.PI * 2.0;
                const s = Math.sin(ang);
                const c = Math.cos(ang);
                const absS = Math.abs(s);

                const dx = (absS - 0.46) / 0.24;
                const dy = (v - 0.56) / 0.23;
                const fenDist = Math.sqrt(dx * dx + dy * dy);

                const isInsideFenestra = c > 0.0 && fenDist < 0.85;
                const freq = isInsideFenestra ? 36 : 18;
                const edgeVal = voronoiEdge2D(u * freq, v * freq, freq, freq);
                const macro = 0.82 + 0.36 * fbm2(u * 10.0, v * 10.0, 3);
                const cellShade = Math.min(1.0, edgeVal * macro);

                let r, g, b, bump;
                if (cellShade < 0.08) {
                    const t = cellShade / 0.08;
                    r = 10 + t * 16;
                    g = 42 + t * 45;
                    b = 95 + t * 60;
                } else {
                    const t = Math.min(1.0, (cellShade - 0.08) / 0.65);
                    r = 30 + t * 50;
                    g = 95 + t * 90;
                    b = 160 + t * 80;
                }
                bump = 24 + Math.pow(Math.min(1.0, edgeVal * 1.5), 0.70) * 185;

                if (c > 0.0) {
                    if (fenDist < 0.82) {
                        r *= 0.65;
                        g *= 0.75;
                        b = Math.min(255, b * 1.15 + 25);
                        bump *= 0.75;
                    } else if (fenDist < 1.16) {
                        const ringBoost = Math.sin(((fenDist - 0.82) / 0.34) * Math.PI);
                        r += ringBoost * 45;
                        g += ringBoost * 65;
                        b += ringBoost * 75;
                        bump = Math.min(255, bump + ringBoost * 42);
                    }
                }

                if (absS < 0.11) {
                    const barBoost = 1.0 - absS / 0.11;
                    r += barBoost * 30;
                    g += barBoost * 45;
                    b += barBoost * 55;
                    bump = Math.min(255, bump + barBoost * 36);
                }

                const snowN = fbm2(u * 12.0 + 1.4, v * 12.0 + 5.2, 3);
                const snowZone = (v < 0.26 ? (0.26 - v) * 2.8 : 0.0) + (v > 0.84 ? (v - 0.84) * 2.2 : 0.0);
                if (snowZone + (snowN - 0.52) > 0.25 && edgeVal > 0.05) {
                    const sAmt = Math.min(0.85, (snowZone + snowN - 0.77) * 1.6);
                    if (sAmt > 0) {
                        r = r * (1.0 - sAmt) + 236 * sAmt;
                        g = g * (1.0 - sAmt) + 243 * sAmt;
                        b = b * (1.0 - sAmt) + 250 * sAmt;
                    }
                }

                const idx = (y * size + x) * 4;
                data[idx] = Math.max(0, Math.min(255, Math.round(r)));
                data[idx + 1] = Math.max(0, Math.min(255, Math.round(g)));
                data[idx + 2] = Math.max(0, Math.min(255, Math.round(b)));
                data[idx + 3] = 255;

                const bVal = Math.max(0, Math.min(255, Math.round(bump)));
                bData[idx] = bVal;
                bData[idx + 1] = bVal;
                bData[idx + 2] = bVal;
                bData[idx + 3] = 255;
            }
        }

        cCtx.putImageData(imgData, 0, 0);
        bCtx.putImageData(bImgData, 0, 0);

        const colorMap = new THREE.CanvasTexture(colorCanvas);
        const bumpMap = new THREE.CanvasTexture(bumpCanvas);
        applySRGB(colorMap);
        return { colorMap, bumpMap };
    }

    // 3. Kératine pachyostotique cabossée de la bosse nasale et sillons longitudinaux des cornes
    function createKeratinBossMaps() {
        const size = 1024;
        const colorCanvas = document.createElement('canvas');
        const bumpCanvas = document.createElement('canvas');
        colorCanvas.width = bumpCanvas.width = size;
        colorCanvas.height = bumpCanvas.height = size;
        const cCtx = colorCanvas.getContext('2d');
        const bCtx = bumpCanvas.getContext('2d');

        const imgData = cCtx.createImageData(size, size);
        const bImgData = bCtx.createImageData(size, size);
        const data = imgData.data;
        const bData = bImgData.data;

        const nodFreq = 20;
        for (let y = 0; y < size; y++) {
            const v = y / (size - 1);
            const baseGrad = 0.42 + 0.52 * Math.pow(v, 0.62);
            for (let x = 0; x < size; x++) {
                const u = x / (size - 1);
                const fiber = 0.08 * Math.sin(u * Math.PI * 48.0 + 1.8 * Math.sin(v * Math.PI * 6.0));
                const cobble = voronoiEdge2D(u * nodFreq, v * nodFreq, nodFreq, nodFreq);
                const crevice = cobble < 0.08 ? (cobble / 0.08) * 0.45 : (0.45 + 0.55 * Math.min(1.0, (cobble - 0.08) / 0.42));
                const shade = Math.max(0.10, Math.min(1.12, (baseGrad + fiber) * crevice));

                let r = 85 * shade;
                let g = 195 * shade;
                let b = 255 * shade;

                const snowN = fbm2(u * 14.0 + 2.2, v * 14.0 + 4.1, 3);
                if (v > 0.68 && snowN > 0.56 && cobble > 0.09) {
                    const sAmt = Math.min(0.78, (v - 0.68) * 2.2 * (snowN - 0.52) * 2.4);
                    r = r * (1.0 - sAmt) + 238 * sAmt;
                    g = g * (1.0 - sAmt) + 244 * sAmt;
                    b = b * (1.0 - sAmt) + 250 * sAmt;
                }

                const idx = (y * size + x) * 4;
                data[idx] = Math.max(0, Math.min(255, Math.round(r)));
                data[idx + 1] = Math.max(0, Math.min(255, Math.round(g)));
                data[idx + 2] = Math.max(0, Math.min(255, Math.round(b)));
                data[idx + 3] = 255;

                const bVal = Math.max(0, Math.min(255, Math.round(22 + crevice * 190 + fiber * 380)));
                bData[idx] = bVal;
                bData[idx + 1] = bVal;
                bData[idx + 2] = bVal;
                bData[idx + 3] = 255;
            }
        }

        cCtx.putImageData(imgData, 0, 0);
        bCtx.putImageData(bImgData, 0, 0);

        const colorMap = new THREE.CanvasTexture(colorCanvas);
        const bumpMap = new THREE.CanvasTexture(bumpCanvas);
        colorMap.wrapS = colorMap.wrapT = THREE.RepeatWrapping;
        bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping;
        applySRGB(colorMap);
        return { colorMap, bumpMap };
    }

    // 4. Iris ambre-orange ardent à stries radiales (fidèle au regard du portrait)
    function createAmberEyeMap() {
        const size = 256;
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = size;
        const ctx = canvas.getContext('2d');
        const cx = size * 0.5;
        const cy = size * 0.5;
        const maxR = size * 0.5;

        const grad = ctx.createRadialGradient(cx, cy, maxR * 0.12, cx, cy, maxR);
        grad.addColorStop(0.00, '#120802');
        grad.addColorStop(0.24, '#fef08a');
        grad.addColorStop(0.48, '#f59e0b');
        grad.addColorStop(0.78, '#c2410c');
        grad.addColorStop(0.94, '#431407');
        grad.addColorStop(1.00, '#090503');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, size, size);

        for (let i = 0; i < 84; i++) {
            const ang = (i / 84) * Math.PI * 2;
            ctx.strokeStyle = i % 2 === 0 ? 'rgba(254, 240, 138, 0.28)' : 'rgba(67, 20, 7, 0.35)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(cx + Math.cos(ang) * maxR * 0.22, cy + Math.sin(ang) * maxR * 0.22);
            ctx.lineTo(cx + Math.cos(ang) * maxR * 0.90, cy + Math.sin(ang) * maxR * 0.90);
            ctx.stroke();
        }

        const tex = new THREE.CanvasTexture(canvas);
        applySRGB(tex);
        return tex;
    }

    _cachedPachyPBRMaps = {
        bodyHide: createBodyHideMaps(),
        frillShield: createFrillShieldMaps(),
        keratinBoss: createKeratinBossMaps(),
        amberEye: createAmberEyeMap()
    };
    return _cachedPachyPBRMaps;
}

function createPachyCapsuleGeometry(radius, length, capSegments = 6, radialSegments = 14) {
    const totalRings = capSegments * 2 + 1;
    const halfLen = length * 0.5;
    const geo = new THREE.CylinderGeometry(radius, radius, length + radius * 2, radialSegments, totalRings, false);
    const pos = geo.attributes.position;

    for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);
        const rLen = Math.sqrt(x * x + z * z);
        const angle = Math.atan2(z, x);
        const normY = y / (halfLen + radius);

        if (normY > 0.999) {
            pos.setXYZ(i, 0, halfLen + radius, 0);
        } else if (normY < -0.999) {
            pos.setXYZ(i, 0, -halfLen - radius, 0);
        } else {
            const u = (1 - normY) * 0.5;
            const ringIdx = Math.round(u * totalRings);
            let phi = Math.PI * 0.5;
            let centerOffset = 0;
            if (ringIdx <= capSegments) {
                phi = (ringIdx / capSegments) * (Math.PI * 0.5);
                centerOffset = halfLen;
            } else {
                phi = Math.PI * 0.5 + ((ringIdx - capSegments - 1) / capSegments) * (Math.PI * 0.5);
                centerOffset = -halfLen;
            }
            const sinPhi = Math.sin(phi);
            const cosPhi = Math.cos(phi);
            if (rLen > 0.00001) {
                pos.setXYZ(i, Math.cos(angle) * radius * sinPhi, centerOffset + radius * cosPhi, Math.sin(angle) * radius * sinPhi);
            } else {
                pos.setXYZ(i, 0, centerOffset + radius * cosPhi, 0);
            }
        }
    }
    geo.computeVertexNormals();
    return geo;
}

registerFighter({
    id: 'pachyrhino',
    name: 'PACHYRHINOSAURE',
    fullName: 'Pachyrhinosaurus Canadensis',
    role: 'Bélier Blindé',
    title: '« Le Colosse à Bosse d’Acier »',
    primaryColor: 0x0284c7,
    secondaryColor: 0x0c4a6e,
    accentColor: 0x38bdf8,
    cssPrimary: '#0284c7',
    scale: 1.0,
    previewScale: 0.90,
    stats: { pow: 88, spd: 76, def: 92 },
    maxHp: 1100,
    walkSpeed: 8.2,
    special1Name: 'Charge Boréale (H)',
    special2Name: 'Cornes Sismiques (T)',
    fatalityName: 'Impact Crânien Polaire (R)',
    moveStyle: 'Trot quadrupède puissant, coup de bosse nasale pachyostotique et soulèvement de collerette cornue.',
    fatalityDesc: 'Gratte le sol, charge à vitesse supersonique avec sa bosse nasale blindée, pulvérise le torse ennemi et empale son crâne.',
    skins: [
        { name: 'Glacial Ice Centrosaur', primary: 0x0284c7, secondary: 0x0c4a6e, accent: 0x38bdf8, belly: 0xe0f2fe, isDefaultPBR: true },
        { name: 'Blizzard Sapphire', primary: 0x0369a1, secondary: 0x082f49, accent: 0x7dd3fc, belly: 0xf0f9ff }
    ]
}, {
    animBaseHipsY: 1.65,
    attackReach: 3.75,

    onSpecial2(attacker, defender, dist, basePow) {
        special2SeismicQuake(attacker, defender, dist, basePow);
    },

    buildRig(ctx) {
        const { hips, rig, skin, skinMeshes } = ctx;
        const { bodyHide, frillShield, keratinBoss, amberEye } = getPachyPBRMaps();

        const isDefaultSkin = Boolean(skin && skin.isDefaultPBR);
        const bodyTint = isDefaultSkin ? 0xffffff : (skin.primary || 0x0284c7);
        const hornTint = isDefaultSkin ? 0xffffff : (skin.accent || 0x38bdf8);
        const frillTint = isDefaultSkin ? 0xffffff : (skin.primary || 0x0284c7);

        // =====================================================================
        // 1. PALETTE DE MATÉRIAUX PHYSIQUEMENT BASÉS (PBR)
        // =====================================================================
        const materials = {
            bodyHide: new THREE.MeshStandardMaterial({
                color: bodyTint,
                map: bodyHide.colorMap,
                bumpMap: bodyHide.bumpMap,
                bumpScale: 0.034,
                roughness: 0.56,
                metalness: 0.04
            }),
            frillShield: new THREE.MeshPhysicalMaterial({
                color: frillTint,
                map: frillShield.colorMap,
                bumpMap: frillShield.bumpMap,
                bumpScale: 0.032,
                roughness: 0.48,
                metalness: 0.05,
                clearcoat: 0.22,
                clearcoatRoughness: 0.35
            }),
            keratinBoss: new THREE.MeshPhysicalMaterial({
                color: hornTint,
                map: keratinBoss.colorMap,
                bumpMap: keratinBoss.bumpMap,
                bumpScale: 0.042,
                roughness: 0.42,
                metalness: 0.06,
                clearcoat: 0.28,
                clearcoatRoughness: 0.32
            }),
            hornKeratin: new THREE.MeshPhysicalMaterial({
                color: hornTint,
                map: keratinBoss.colorMap,
                bumpMap: keratinBoss.bumpMap,
                bumpScale: 0.028,
                roughness: 0.36,
                metalness: 0.06,
                clearcoat: 0.38,
                clearcoatRoughness: 0.25
            }),
            beakKeratin: new THREE.MeshPhysicalMaterial({
                color: 0x24201c,
                bumpMap: keratinBoss.bumpMap,
                bumpScale: 0.024,
                roughness: 0.32,
                metalness: 0.08,
                clearcoat: 0.42,
                clearcoatRoughness: 0.25
            }),
            scalyPad: new THREE.MeshStandardMaterial({
                color: isDefaultSkin ? 0x0d3b66 : (skin.secondary || 0x0c4a6e),
                bumpMap: bodyHide.bumpMap,
                bumpScale: 0.028,
                roughness: 0.52,
                metalness: 0.04
            }),
            hoof: new THREE.MeshPhysicalMaterial({
                color: 0x171412,
                roughness: 0.26,
                metalness: 0.10,
                clearcoat: 0.48
            }),
            oralMucosa: new THREE.MeshPhysicalMaterial({
                color: 0x6e2e28,
                roughness: 0.24,
                clearcoat: 0.72,
                clearcoatRoughness: 0.16,
                side: THREE.DoubleSide
            }),
            cavityDark: new THREE.MeshStandardMaterial({
                color: 0x080706,
                roughness: 0.92
            }),
            eyeIris: new THREE.MeshStandardMaterial({
                color: 0xffffff,
                map: amberEye,
                emissive: 0xd97706,
                emissiveMap: amberEye,
                emissiveIntensity: 0.48,
                roughness: 0.08
            }),
            eyePupil: new THREE.MeshBasicMaterial({ color: 0x040405 }),
            eyeCornea: new THREE.MeshPhysicalMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.26,
                roughness: 0.02,
                metalness: 0.0,
                clearcoat: 1.0,
                clearcoatRoughness: 0.02
            }),
            boneXray: new THREE.MeshStandardMaterial({
                color: 0xf8fafc,
                emissive: 0x38bdf8,
                emissiveIntensity: 0.42,
                roughness: 0.22
            })
        };

        rig.bodyMat = materials.bodyHide;
        const skeletonMeshes = [];

        function registerSkin(mesh) {
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            skinMeshes.push(mesh);
            return mesh;
        }

        // Fonction de relief cellulaire 3D (nodules d'ostéodermes & chou-fleur de la bosse nasale validés sous Blender 5.2)
        function cobbleCell3D(x, y, z, freq = 14.0) {
            const px = x * freq;
            const py = y * freq;
            const pz = z * freq;
            const ix = Math.floor(px);
            const iy = Math.floor(py);
            const iz = Math.floor(pz);
            const fx = px - ix;
            const fy = py - iy;
            const fz = pz - iz;
            let minDistSq = 8.0;
            for (let dz = -1; dz <= 1; dz++) {
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        const cx = ix + dx;
                        const cy = iy + dy;
                        const cz = iz + dz;
                        const h1 = Math.sin(cx * 127.1 + cy * 311.7 + cz * 74.7) * 43758.5453;
                        const h2 = Math.sin(cx * 269.5 + cy * 183.3 + cz * 246.1) * 43758.5453;
                        const h3 = Math.sin(cx * 419.2 + cy * 371.9 + cz * 113.5) * 43758.5453;
                        const rx = dx + (h1 - Math.floor(h1)) * 0.82 - fx;
                        const ry = dy + (h2 - Math.floor(h2)) * 0.82 - fy;
                        const rz = dz + (h3 - Math.floor(h3)) * 0.82 - fz;
                        const dSq = rx * rx + ry * ry + rz * rz;
                        if (dSq < minDistSq) minDistSq = dSq;
                    }
                }
            }
            const d = Math.min(1.0, Math.sqrt(minDistSq));
            return Math.max(0.0, 1.0 - Math.pow(d * 1.18, 1.75));
        }

        function createBoneVisual(p1, p2, radius = 0.045) {
            const dist = Math.max(0.01, p1.distanceTo(p2));
            const geo = new THREE.CylinderGeometry(radius * 0.74, radius, dist, 8);
            geo.translate(0, dist / 2, 0);
            geo.rotateX(Math.PI / 2);
            const mesh = new THREE.Mesh(geo, materials.boneXray);
            mesh.position.copy(p1);
            mesh.lookAt(p2);
            mesh.visible = false;
            skeletonMeshes.push(mesh);
            return mesh;
        }

        // Générateur de segments musculaires continus à dômes articulaires sphériques
        function createMuscularSegment(length, axis, profileFn, material, proxOverlap = 0.20, distOverlap = 0.16) {
            const radialSegs = 24;
            const heightSegs = 22;
            const geo = new THREE.PlaneGeometry(1, 1, radialSegs, heightSegs);
            const pos = geo.attributes.position;
            const uvs = geo.attributes.uv;

            const startS = -length * proxOverlap;
            const endS = length * (1 + distOverlap);
            const totalSpan = endS - startS;

            let idx = 0;
            for (let iy = 0; iy <= heightSegs; iy++) {
                const v = iy / heightSegs;
                const sPos = startS + v * totalSpan;
                const tClamped = Math.max(0, Math.min(1, sPos / length));

                let capFactor = 1.0;
                if (v < 0.15) {
                    capFactor = Math.sin((v / 0.15) * (Math.PI * 0.5));
                } else if (v > 0.85) {
                    capFactor = Math.sin(((1.0 - v) / 0.15) * (Math.PI * 0.5));
                }

                for (let ix = 0; ix <= radialSegs; ix++) {
                    const u = ix / radialSegs;
                    const angle = u * Math.PI * 2;
                    const { rx, rz, offsetX = 0, offsetZ = 0 } = profileFn(tClamped, angle);

                    const curRx = rx * capFactor;
                    const curRz = rz * capFactor;
                    const offWeight = Math.sin(tClamped * Math.PI) * capFactor;

                    const lx = Math.sin(angle) * curRx + offsetX * offWeight;
                    const lz = Math.cos(angle) * curRz + offsetZ * offWeight;

                    if (axis === '-y') {
                        pos.setXYZ(idx, lx, -sPos, lz);
                    } else if (axis === 'y') {
                        pos.setXYZ(idx, lx, sPos, -lz);
                    } else if (axis === 'z') {
                        pos.setXYZ(idx, lx, -lz, sPos);
                    } else if (axis === '-z') {
                        pos.setXYZ(idx, lx, lz, -sPos);
                    } else if (axis === 'x') {
                        pos.setXYZ(idx, sPos, -lz, lx);
                    } else if (axis === '-x') {
                        pos.setXYZ(idx, -sPos, lz, lx);
                    }

                    uvs.setXY(idx, 0.22 + 0.08 * Math.sin(angle), 0.32 + 0.36 * v);
                    idx++;
                }
            }

            geo.computeVertexNormals();
            return registerSkin(new THREE.Mesh(geo, material));
        }

        // Générateur de cornes et ostéodermes courbes sillonnés le long d'une spline Catmull-Rom 3D
        function createCurvedHornMesh(ctrlPoints, rBase, rTip, material, radialSegs = 20, heightSegs = 26, grooveAmp = 0.08) {
            const curve = new THREE.CatmullRomCurve3(ctrlPoints.map(p => new THREE.Vector3(p[0], p[1], p[2])));
            const geo = new THREE.PlaneGeometry(1, 1, radialSegs, heightSegs);
            const pos = geo.attributes.position;
            const uvs = geo.attributes.uv;

            const _pt = new THREE.Vector3();
            const _tang = new THREE.Vector3();
            const _up = new THREE.Vector3();
            const _right = new THREE.Vector3();

            let idx = 0;
            for (let iy = 0; iy <= heightSegs; iy++) {
                const t = iy / heightSegs;
                curve.getPoint(t, _pt);
                curve.getTangent(t, _tang).normalize();

                _up.set(0, 1, 0);
                if (Math.abs(_tang.dot(_up)) > 0.94) _up.set(0, 0, 1);
                _right.crossVectors(_tang, _up).normalize();
                _up.crossVectors(_right, _tang).normalize();

                const r = iy === heightSegs ? 0.0008 : (rBase * Math.pow(1 - t, 0.76) + rTip * t) * (1 - Math.pow(t, 4.0));

                for (let ix = 0; ix <= radialSegs; ix++) {
                    const u = ix / radialSegs;
                    const ang = u * Math.PI * 2;
                    const ridge = 1.0 + grooveAmp * Math.cos(ang * 9.0) * (1 - t * 0.6);
                    const rad = r * ridge;
                    const c = Math.cos(ang);
                    const s = Math.sin(ang);

                    const vx = _pt.x + (_right.x * c + _up.x * s) * rad;
                    const vy = _pt.y + (_right.y * c + _up.y * s) * rad;
                    const vz = _pt.z + (_right.z * c + _up.z * s) * rad;

                    pos.setXYZ(idx, vx, vy, vz);
                    uvs.setXY(idx, u, t);
                    idx++;
                }
            }

            geo.computeVertexNormals();
            return registerSkin(new THREE.Mesh(geo, material));
        }

        hips.position.y = 1.65;

        // Groupe racine du modèle paléontologique (+Z du modèle = +X avant dans le repère du jeu)
        const pachy = new THREE.Group();
        pachy.position.set(0, -1.65, 0);
        pachy.rotation.y = Math.PI / 2;
        rig.torso.add(pachy);

        const rootJoint = new THREE.Group();
        rootJoint.position.set(0, 1.65, 0);
        pachy.add(rootJoint);

        const torsoGroup = new THREE.Group();
        rootJoint.add(torsoGroup);

        // Nœuds mandataires standardisés pour la compatibilité ColliderRig & CombatReactions
        rig.neck.position.set(1.08, 0.16, 0);
        rig.torso.add(rig.neck);

        for (let l = 0; l < 4; l++) {
            const legProxy = new THREE.Group();
            legProxy.position.set(l < 2 ? 0.72 : -0.68, -0.04, (l % 2 === 0 ? -1 : 1) * 0.45);
            hips.add(legProxy);
            rig.legs.push(legProxy);
        }

        let parentTailProxy = rig.torso;
        for (let s = 0; s < 3; s++) {
            const tProxy = new THREE.Group();
            tProxy.position.set(s === 0 ? -1.05 : -0.62, s === 0 ? 0.12 : -0.06, 0);
            parentTailProxy.add(tProxy);
            rig.tailSegments.push(tProxy);
            parentTailProxy = tProxy;
        }

        // =====================================================================
        // 2A. RIG SQUELETTIQUE : 5 VERTÈBRES CAUDALES, BASSIN, THORAX & 3 CERVICALES
        // =====================================================================
        const caudalSegments = [];
        const caudalLengths = [0.46, 0.48, 0.50, 0.48, 0.44];
        const caudalRadiiX = [0.45, 0.35, 0.24, 0.145, 0.072];
        const caudalRadiiY = [0.52, 0.40, 0.28, 0.170, 0.084];

        let parentCaudal = torsoGroup;
        for (let i = 0; i < caudalLengths.length; i++) {
            const seg = new THREE.Group();
            if (i === 0) {
                seg.position.set(0, -0.05, -0.96);
            } else {
                seg.position.set(0, -0.09, -caudalLengths[i - 1]);
            }
            parentCaudal.add(seg);
            caudalSegments.push(seg);

            const tBone = createBoneVisual(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -0.08, -caudalLengths[i]), 0.055 - i * 0.007);
            seg.add(tBone);
            parentCaudal = seg;
        }

        const tailTipNode = new THREE.Group();
        tailTipNode.position.set(0, -0.06, -caudalLengths[caudalLengths.length - 1]);
        parentCaudal.add(tailTipNode);

        // Nœuds anatomiques du bassin bombé, du thorax en tonneau et du garrot
        const pelvisRearNode = new THREE.Group();
        pelvisRearNode.position.set(0, 0.04, -0.68);
        torsoGroup.add(pelvisRearNode);

        const hipsCenterNode = new THREE.Group();
        hipsCenterNode.position.set(0, 0.08, -0.26);
        torsoGroup.add(hipsCenterNode);

        const lumbarNode = new THREE.Group();
        lumbarNode.position.set(0, 0.01, 0.20);
        torsoGroup.add(lumbarNode);

        const thoraxNode = new THREE.Group();
        thoraxNode.position.set(0, -0.06, 0.64);
        torsoGroup.add(thoraxNode);

        // Tubercules dermiques ostéodermiques saillants sur l'échine et le haut des flancs (fidèles au portrait !)
        const dorsalTubercleRows = [
            [-0.42, 18, 0.052, 0.070], [-0.22, 20, 0.055, 0.074], [-0.02, 22, 0.058, 0.078],
            [0.18, 24, 0.058, 0.078],  [0.38, 26, 0.055, 0.072],  [0.58, 28, 0.050, 0.065],
            [-0.32, 38, 0.048, 0.062], [-0.12, 41, 0.052, 0.068], [0.08, 44, 0.054, 0.072],
            [0.28, 47, 0.052, 0.068],  [0.48, 50, 0.048, 0.062],  [0.66, 52, 0.044, 0.055]
        ];
        [-1, 1].forEach(side => {
            dorsalTubercleRows.forEach(([zPos, angDeg, rB, hT]) => {
                const ang = THREE.MathUtils.degToRad(angDeg);
                const nx = side * Math.sin(ang);
                const ny = Math.cos(ang);
                const rx = 0.65 - Math.abs(zPos - 0.1) * 0.12;
                const ry = 0.74 - Math.abs(zPos - 0.1) * 0.12;
                const bx = nx * rx;
                const by = 0.04 + ny * ry;
                torsoGroup.add(createCurvedHornMesh([
                    [bx, by, zPos],
                    [bx + nx * hT * 0.55, by + ny * hT * 0.55, zPos - 0.01],
                    [bx + nx * hT, by + ny * hT, zPos - 0.02]
                ], rB, 0.010, materials.bodyHide, 12, 10, 0.03));
            });
        });

        // Squelette interne X-Ray : colonne dorsale & cage thoracique en tonneau
        torsoGroup.add(createBoneVisual(new THREE.Vector3(0, 0.08, -0.90), new THREE.Vector3(0, -0.04, 0.88), 0.075));
        for (let r = 0; r < 8; r++) {
            const ribSpan = 0.58 - Math.abs(r - 3.5) * 0.045;
            const ribGeo = new THREE.TorusGeometry(ribSpan, 0.024, 8, 20, Math.PI * 1.45);
            ribGeo.rotateY(Math.PI);
            ribGeo.rotateZ(Math.PI * 0.28);
            const rib = new THREE.Mesh(ribGeo, materials.boneXray);
            rib.position.set(0, -0.02, 0.72 - r * 0.18);
            rib.visible = false;
            skeletonMeshes.push(rib);
            torsoGroup.add(rib);
        }

        // 3 vertèbres cervicales massives supportant le poids de la collerette et de la bosse nasale
        const neckSegments = [];
        const numNeckVerts = 3;
        const neckSegLen = 0.20;
        let parentNeck = torsoGroup;

        for (let i = 0; i < numNeckVerts; i++) {
            const segGroup = new THREE.Group();
            if (i === 0) {
                segGroup.position.set(0, -0.14, 0.88);
            } else {
                segGroup.position.set(0, -0.01, neckSegLen);
            }
            parentNeck.add(segGroup);
            neckSegments.push(segGroup);

            const cBone = createBoneVisual(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, neckSegLen), 0.065 - i * 0.004);
            segGroup.add(cBone);
            parentNeck = segGroup;
        }

        // Adaptateur d'axe pour que rig.headGroup (Bone_Head) ait +X vers l'avant et rotation.z en tangage
        const headAdapter = new THREE.Group();
        headAdapter.position.set(0, 0.04, neckSegLen);
        headAdapter.rotation.y = -Math.PI / 2;
        parentNeck.add(headAdapter);

        rig.headGroup.position.set(0, 0, 0);
        rig.headGroup.rotation.set(0, 0, 0);
        headAdapter.add(rig.headGroup);

        const headGroup = new THREE.Group();
        headGroup.rotation.y = Math.PI / 2;
        rig.headGroup.add(headGroup);

        // Nœuds d'ancrage du cou rentrant proprement sous l'occiput sans dépasser devant la collerette
        const skullBaseNode = new THREE.Group();
        skullBaseNode.position.set(0, -0.10, -0.02);
        headGroup.add(skullBaseNode);

        const skullCapNode = new THREE.Group();
        skullCapNode.position.set(0, -0.10, 0.12);
        headGroup.add(skullCapNode);

        // =====================================================================
        // 2B. MAILLAGE CORPOREL, CAUDAL & CERVICAL CONTINU (SPLINE CATMULL-ROM)
        // =====================================================================
        const caudalSpineNodes = [];
        for (let i = caudalSegments.length - 1; i >= 0; i--) {
            caudalSpineNodes.push({
                node: caudalSegments[i],
                rx: caudalRadiiX[i],
                ry: caudalRadiiY[i],
                yOff: 0.0
            });
        }

        const bodySpineNodes = [
            { node: tailTipNode, rx: 0.003, ry: 0.003, yOff: 0.0 },
            ...caudalSpineNodes,
            { node: pelvisRearNode, rx: 0.56, ry: 0.65, yOff: 0.02 },
            { node: hipsCenterNode, rx: 0.68, ry: 0.78, yOff: 0.04 },   // Bassin bombé de cératopsien
            { node: lumbarNode, rx: 0.72, ry: 0.82, yOff: 0.0 },        // Flancs en tonneau
            { node: thoraxNode, rx: 0.64, ry: 0.76, yOff: 0.02 },       // Poitrail puissant & garrot
            ...neckSegments.map((seg, i) => ({
                node: seg,
                rx: 0.48 - i * 0.08,
                ry: 0.54 - i * 0.10,
                yOff: 0.0
            })),
            { node: skullBaseNode, rx: 0.24, ry: 0.25, yOff: 0.0 },     // Rentre sous le crâne sans bosse sur la collerette
            { node: skullCapNode, rx: 0.003, ry: 0.003, yOff: 0.0 }
        ];

        const tubeRings = 68;
        const tubeSides = 40;
        const seamlessBodyGeo = new THREE.PlaneGeometry(1, 1, tubeSides, tubeRings - 1);
        const seamlessBodyMesh = registerSkin(new THREE.Mesh(seamlessBodyGeo, materials.bodyHide));
        pachy.add(seamlessBodyMesh);

        const _wp = new THREE.Vector3();
        const _up = new THREE.Vector3();
        const _right = new THREE.Vector3();
        const _tangent = new THREE.Vector3();
        const _quat = new THREE.Quaternion();
        const _qPachyInv = new THREE.Quaternion();

        function updateContinuousBodySkin(breathPhase) {
            const centers = [];
            const upVectors = [];
            const radiiX = [];
            const radiiY = [];

            pachy.getWorldQuaternion(_qPachyInv).invert();

            for (let i = 0; i < bodySpineNodes.length; i++) {
                const item = bodySpineNodes[i];
                item.node.getWorldPosition(_wp);
                const localPos = pachy.worldToLocal(_wp.clone());

                item.node.getWorldQuaternion(_quat);
                _quat.premultiply(_qPachyInv);
                _up.set(0, 1, 0).applyQuaternion(_quat).normalize();

                let breathBoost = 0;
                if (i === 8 || i === 9) breathBoost = Math.sin(breathPhase) * 0.024;
                else if (i === 10) breathBoost = Math.sin(breathPhase) * 0.015;

                localPos.addScaledVector(_up, item.yOff);
                centers.push(localPos);
                upVectors.push(_up.clone());
                radiiX.push(item.rx + breathBoost);
                radiiY.push(item.ry + breathBoost * 1.15);
            }

            const centerCurve = new THREE.CatmullRomCurve3(centers);
            const posAttr = seamlessBodyGeo.attributes.position;

            let vIdx = 0;
            for (let r = 0; r < tubeRings; r++) {
                const t = r / (tubeRings - 1);
                const pt = centerCurve.getPoint(t);
                centerCurve.getTangent(t, _tangent).normalize();

                const fIdx = t * (bodySpineNodes.length - 1);
                const i0 = Math.floor(fIdx);
                const i1 = Math.min(bodySpineNodes.length - 1, i0 + 1);
                const frac = fIdx - i0;

                const rx = THREE.MathUtils.lerp(radiiX[i0], radiiX[i1], frac);
                const ry = THREE.MathUtils.lerp(radiiY[i0], radiiY[i1], frac);
                _up.copy(upVectors[i0]).lerp(upVectors[i1], frac).normalize();

                _right.crossVectors(_up, _tangent).normalize();
                _up.crossVectors(_tangent, _right).normalize();

                const spineEnvelope = Math.sin(t * Math.PI);

                // Plis cutanés cervicaux et scapulaires profonds (visibles sur le cou dans le portrait !)
                let neckFold = 1.0;
                if (t > 0.62 && t < 0.94) {
                    const neckEnv = Math.sin(((t - 0.62) / 0.32) * Math.PI);
                    neckFold += 0.048 * neckEnv * Math.cos(t * Math.PI * 30.0);
                }

                for (let s = 0; s <= tubeSides; s++) {
                    const u = s / tubeSides;
                    const theta = u * Math.PI * 2;
                    const cosT = Math.cos(theta);
                    const sinT = Math.sin(theta);

                    let xFactor = Math.sign(sinT) * Math.pow(Math.abs(sinT), 0.88) * rx * neckFold;
                    let yFactor = cosT * ry * neckFold;

                    // Crête neurale dorsale bombée sur le sacrum et le garrot
                    if (cosT > 0.52) {
                        yFactor += Math.pow((cosT - 0.52) / 0.48, 1.7) * ry * 0.14 * spineEnvelope;
                    }
                    // Galbe des flancs en tonneau et du muscle caudofemoralis
                    if (t > 0.28 && t < 0.76 && Math.abs(sinT) > 0.45) {
                        xFactor *= 1.06;
                    }
                    // Fanon gulaire plissé sous le cou et le poitrail
                    if (t > 0.68 && t < 0.92 && cosT < -0.45) {
                        yFactor *= 1.08;
                    }

                    const vx = pt.x + _right.x * xFactor + _up.x * yFactor;
                    const vy = pt.y + _right.y * xFactor + _up.y * yFactor;
                    const vz = pt.z + _right.z * xFactor + _up.z * yFactor;

                    posAttr.setXYZ(vIdx, vx, vy, vz);
                    vIdx++;
                }
            }

            posAttr.needsUpdate = true;
            seamlessBodyGeo.computeVertexNormals();
        }

        // =====================================================================
        // 2C. CRÂNE CENTROSAURINE COMPACT, BEC ROSTRAL DE PERROQUET & BOSSE NASALE
        //     (Validés 1:1 sous Blender 5.2 d'après assets/portraits/pachyrhino.png)
        // =====================================================================
        function buildSculptedSkullAndBeak() {
            const slices = [
                { z: -0.08, topY: 0.16,  botY: -0.12, halfW: 0.003 }, // Capuchon occipital fermé
                { z: 0.02,  topY: 0.28,  botY: -0.22, halfW: 0.34  }, // Occiput
                { z: 0.18,  topY: 0.34,  botY: -0.27, halfW: 0.41  }, // Large évasement jugal (pommette)
                { z: 0.36,  topY: 0.31,  botY: -0.21, halfW: 0.31  }, // Région orbitaire & arcade sourcilière
                { z: 0.54,  topY: 0.29,  botY: -0.18, halfW: 0.22  }, // Pont nasal postérieur sous la crête rugueuse
                { z: 0.70,  topY: 0.26,  botY: -0.18, halfW: 0.175 }, // Crête nasale antérieure surplombant les narines
                { z: 0.81,  topY: 0.14,  botY: -0.20, halfW: 0.115 }, // Base du bec rostral de perroquet (v ~ 0.73)
                { z: 0.92,  topY: 0.00,  botY: -0.28, halfW: 0.075 }, // Arche supérieure du bec de perroquet
                { z: 0.99,  topY: -0.18, botY: -0.35, halfW: 0.038 }, // Courbure crochue plongeante
                { z: 0.97,  topY: -0.36, botY: -0.35, halfW: 0.002 }  // Pointe rostrale acérée !
            ];

            const radialSteps = 64;
            const lengthSteps = 76;
            const skullGeo = new THREE.PlaneGeometry(1, 1, radialSteps, lengthSteps);
            const pos = skullGeo.attributes.position;
            const uvs = skullGeo.attributes.uv;

            const topCurve = new THREE.CatmullRomCurve3(slices.map(s => new THREE.Vector3(s.halfW, s.topY, s.z)));
            const botCurve = new THREE.CatmullRomCurve3(slices.map(s => new THREE.Vector3(s.halfW, s.botY, s.z)));

            let idx = 0;
            for (let iy = 0; iy <= lengthSteps; iy++) {
                const v = iy / lengthSteps;
                const pTop = topCurve.getPoint(v);
                const pBot = botCurve.getPoint(v);
                const halfW = Math.max(0.002, pTop.x);
                const topY = pTop.y;
                const z = pTop.z;
                const botY = pBot.y;

                const jugalProfile = Math.exp(-Math.pow((v - 0.22) / 0.075, 2));
                const bossProfile = Math.exp(-Math.pow((v - 0.56) / 0.12, 2));
                const narisProfile = Math.exp(-Math.pow((v - 0.63) / 0.060, 2));

                for (let ix = 0; ix <= radialSteps; ix++) {
                    const u = ix / radialSteps;
                    const ang = u * Math.PI * 2;
                    const s = Math.sin(ang);
                    const c = Math.cos(ang);
                    const absS = Math.abs(s);
                    const signS = s >= 0 ? 1.0 : -1.0;

                    let x = signS * Math.pow(absS, 0.80) * halfW;
                    let y;
                    if (c >= 0) {
                        y = botY + (topY - botY) * Math.pow(c, 0.72);
                        // Crête nasale pachyostotique rugueuse intégrée directement au chanfrein !
                        if (bossProfile > 0.01 && c > 0.32) {
                            const bossArch = Math.pow((c - 0.32) / 0.68, 0.65);
                            const c1 = cobbleCell3D(x, y, z, 16.0);
                            const c2 = cobbleCell3D(x + 1.1, y - 0.6, z + 0.3, 28.0);
                            const knobs = 0.035 + 0.042 * c1 + 0.018 * c2;
                            y += bossProfile * bossArch * knobs;
                            x += signS * bossProfile * bossArch * (0.025 + 0.028 * c1);
                        }
                    } else {
                        const rim = Math.pow(absS, 1.5);
                        y = botY * rim + (botY + 0.04 * (1 - Math.pow(v - 0.5, 2))) * (1 - rim);
                    }

                    // Cavité orbitaire anatomique creusée proprement autour du centre de l'œil (y=0.105, z=0.355)
                    // pour que la paroi crânienne ne traverse jamais le globe oculaire, l'iris ou la pupille !
                    if (absS > 0.35) {
                        const dyEye = (y - 0.105) / 0.088;
                        const dzEye = (z - 0.355) / 0.098;
                        const eyeD2 = dyEye * dyEye + dzEye * dzEye;
                        if (eyeD2 < 1.25) {
                            const socketDepth = Math.pow(Math.cos(Math.min(1.0, Math.sqrt(eyeD2) / 1.118) * Math.PI * 0.5), 1.5);
                            const targetSocketX = signS * 0.195;
                            x = x * (1.0 - 0.85 * socketDepth) + targetSocketX * (0.85 * socketDepth);
                        }

                        // Arcade sourcilière supraorbitaire froncée et menaçante juste au-dessus de l'orbite !
                        const dyBrow = (y - 0.180 + 0.028 * ((z - 0.355) / 0.09)) / 0.052;
                        const dzBrow = (z - 0.355) / 0.105;
                        const browD2 = dyBrow * dyBrow + dzBrow * dzBrow;
                        if (browD2 < 1.5) {
                            const bStrength = Math.pow(Math.cos(Math.min(1.0, Math.sqrt(browD2) / 1.22) * Math.PI * 0.5), 1.4);
                            const nodule = cobbleCell3D(x, y, z, 18.0);
                            x += signS * bStrength * (0.068 + 0.032 * nodule);
                            y += bStrength * (0.018 + 0.016 * nodule);
                        }
                    }

                    // Profonde cavité narinaire charnue entourée d'anneaux cutanés concentriques
                    if (narisProfile > 0.01 && c > -0.22 && c < 0.38) {
                        const nArch = Math.sin(((c + 0.22) / 0.60) * Math.PI);
                        const nStrength = narisProfile * nArch;
                        const ringFold = 0.018 * Math.cos(nStrength * Math.PI * 4.5);
                        x *= (1.0 - 0.48 * Math.pow(nStrength, 1.4));
                        x += signS * ringFold * (1.0 - nStrength * 0.5);
                        y += ringFold * 0.5;
                    }

                    // Pommette jugale saillante
                    if (jugalProfile > 0.01 && c < -0.05 && c > -0.88) {
                        const jArch = Math.sin(((Math.abs(c) - 0.05) / 0.83) * Math.PI);
                        x += signS * jugalProfile * jArch * 0.14;
                        y -= jugalProfile * jArch * 0.08;
                    }

                    // Écailles cabossées sur le crâne vs sillons longitudinaux sur le bec rostral de perroquet
                    if (v > 0.04 && v < 0.73) {
                        const sc = cobbleCell3D(x, y, z, 22.0);
                        const nLen = Math.max(0.001, Math.hypot(signS * absS, c));
                        x += (signS * absS / nLen) * sc * 0.016;
                        y += (c / nLen) * sc * 0.016;
                    } else if (v >= 0.73 && iy < lengthSteps) {
                        const groove = 0.006 * Math.cos(ang * 18.0) * (1.0 - (v - 0.73) / 0.27);
                        x += signS * groove;
                    }

                    pos.setXYZ(idx, x, y, z);
                    uvs.setXY(idx, u, 0.72 + v * 0.25);
                    idx++;
                }
            }

            // Séparer les groupes de matériaux entre le crâne écaillé (0..73%) et le bec rostral corné (73..100%)
            skullGeo.clearGroups();
            const splitRow = Math.floor(lengthSteps * 0.73);
            const quadsPerRow = radialSteps * 6;
            skullGeo.addGroup(0, splitRow * quadsPerRow, 0);
            skullGeo.addGroup(splitRow * quadsPerRow, (lengthSteps - splitRow) * quadsPerRow, 1);

            skullGeo.computeVertexNormals();
            headGroup.add(registerSkin(new THREE.Mesh(skullGeo, [materials.bodyHide, materials.beakKeratin])));
            headGroup.add(createBoneVisual(new THREE.Vector3(0, 0.08, 0.0), new THREE.Vector3(0, -0.18, 0.98), 0.065));

            // Fond sombre des cavités narinaires (External Nares)
            [-1, 1].forEach(side => {
                const narisPlug = new THREE.Mesh(new THREE.SphereGeometry(1.0, 14, 12), materials.cavityDark);
                narisPlug.position.set(side * 0.088, -0.01, 0.67);
                narisPlug.scale.set(0.032, 0.050, 0.068);
                headGroup.add(narisPlug);
            });
        }
        buildSculptedSkullAndBeak();

        // Crête Nasale Pachyostotique Basse etProfilée (intégrée au chanfrein sans effet de rocher disproportionné)
        const nasalBossGroup = new THREE.Group();
        headGroup.add(nasalBossGroup);
        rig.specialParts.nasalBoss = nasalBossGroup;

        function buildSculptedNasalBoss() {
            const bRings = 48;
            const bSides = 48;
            const geo = new THREE.PlaneGeometry(1, 1, bSides, bRings - 1);
            const pos = geo.attributes.position;
            const uvs = geo.attributes.uv;

            let idx = 0;
            for (let iy = 0; iy < bRings; iy++) {
                const v = iy / (bRings - 1);
                const zRel = 0.42 + v * 0.38;
                const env = Math.sin(v * Math.PI);
                const cap = (iy === 0 || iy === bRings - 1) ? 0.002 : Math.pow(env, 0.42);

                const w = (0.125 + 0.020 * Math.sin(v * Math.PI)) * cap;
                const h = (0.048 + 0.016 * Math.sin(v * Math.PI)) * cap;
                const baseY = 0.275 - 0.045 * v;

                for (let ix = 0; ix <= bSides; ix++) {
                    const u = ix / bSides;
                    const ang = u * Math.PI * 2;
                    const s = Math.sin(ang);
                    const c = Math.cos(ang);
                    const absS = Math.abs(s);
                    const signS = s >= 0 ? 1.0 : -1.0;

                    let x = signS * Math.pow(absS, 0.74) * w;
                    let y = baseY + (c * 0.5 + 0.5) * h;

                    if (iy > 0 && iy < bRings - 1 && c > -0.2) {
                        const c1 = cobbleCell3D(x, y, zRel, 18.0);
                        const gnarl = 0.022 * c1 * Math.pow(env, 0.35);
                        x += signS * absS * gnarl * 0.7;
                        y += Math.max(0.2, c) * gnarl;
                    }

                    pos.setXYZ(idx, x, y, zRel);
                    uvs.setXY(idx, u, 0.74 + v * 0.20);
                    idx++;
                }
            }

            geo.computeVertexNormals();
            nasalBossGroup.add(registerSkin(new THREE.Mesh(geo, materials.bodyHide)));
        }
        buildSculptedNasalBoss();

        // Trio d'épines frontales / pariétales dressées derrière la bosse nasale (exactement comme le portrait !)
        headGroup.add(createCurvedHornMesh([
            [0.0, 0.28, 0.35],
            [0.0, 0.44, 0.38],
            [0.0, 0.59, 0.40]
        ], 0.064, 0.005, materials.hornKeratin, 20, 24));

        headGroup.add(createCurvedHornMesh([
            [0.0, 0.28, 0.20],
            [0.0, 0.42, 0.22],
            [0.0, 0.54, 0.23]
        ], 0.055, 0.005, materials.hornKeratin, 18, 22));

        // Épines frontales latérales, Cornes jugales saillantes & Yeux ambre-orange à paupières plissées
        const eyelids = [];
        const catchlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

        [-1, 1].forEach(side => {
            // Épine frontale latérale flanquant les cornes médianes
            headGroup.add(createCurvedHornMesh([
                [side * 0.10, 0.28, 0.25],
                [side * 0.13, 0.41, 0.27],
                [side * 0.15, 0.52, 0.28]
            ], 0.048, 0.004, materials.hornKeratin, 16, 20));

            // Grande corne épijugale (pommette) pointant vers l'extérieur, l'avant et le bas
            headGroup.add(createCurvedHornMesh([
                [side * 0.34, -0.09, 0.18],
                [side * 0.50, -0.15, 0.23],
                [side * 0.65, -0.20, 0.28]
            ], 0.076, 0.005, materials.hornKeratin, 20, 24));

            // Tubercules jugaux secondaires autour de la base de la corne épijugale
            [
                [0.35, -0.01, 0.14, 0.035],
                [0.32, -0.16, 0.12, 0.032]
            ].forEach(([jx, jy, jz, jr]) => {
                headGroup.add(createCurvedHornMesh([
                    [side * jx, jy, jz],
                    [side * (jx + 0.06), jy - 0.02, jz + 0.01],
                    [side * (jx + 0.11), jy - 0.03, jz + 0.02]
                ], jr, 0.004, materials.hornKeratin, 12, 14));
            });

            // Orbite oculaire orientée latéralement et légèrement vers l'avant (validée sous Blender 5.2 v8)
            const eyeCenter = new THREE.Vector3(side * 0.248, 0.105, 0.355);
            const eyeSocket = new THREE.Group();
            eyeSocket.position.copy(eyeCenter);
            eyeSocket.rotation.y = side * 1.31;
            eyeSocket.rotation.x = 0.04;
            headGroup.add(eyeSocket);

            // Manchette palpébrale plissée et froncée sertissant proprement l'iris sans le masquer
            const uSteps = 32;
            const vSteps = 16;
            const cuffGeo = new THREE.PlaneGeometry(1, 1, uSteps, vSteps);
            const cPos = cuffGeo.attributes.position;
            let cIdx = 0;
            for (let iv = 0; iv <= vSteps; iv++) {
                const tubeAng = (iv / vSteps) * Math.PI * 2;
                for (let iu = 0; iu <= uSteps; iu++) {
                    const ang = (iu / uSteps) * Math.PI * 2;
                    const sA = Math.sin(ang);
                    const cA = Math.cos(ang);
                    const rX = 0.045;
                    const rY = 0.036;
                    const rT = 0.013 * (1.0 + 0.12 * Math.cos(ang * 14.0));
                    const lx = -side * cA * (rX + Math.cos(tubeAng) * rT);
                    let ly = sA * (rY + Math.cos(tubeAng) * rT);
                    if (sA > 0.0) {
                        ly -= 0.005 * Math.pow(sA, 1.5);
                    }
                    const upperOverhang = 0.006 * Math.max(0.0, sA);
                    const lz = 0.014 + upperOverhang + Math.sin(tubeAng) * rT * 0.90;
                    cPos.setXYZ(cIdx++, lx, ly, lz);
                }
            }
            cuffGeo.computeVertexNormals();
            eyeSocket.add(registerSkin(new THREE.Mesh(cuffGeo, materials.scalyPad)));

            // Ombre profonde du fond de l'orbite
            const socketRing = new THREE.Mesh(new THREE.SphereGeometry(1.0, 18, 14), materials.cavityDark);
            socketRing.position.set(0, 0, -0.010);
            socketRing.scale.set(0.056, 0.048, 0.020);
            eyeSocket.add(socketRing);

            // Iris ambre-orange ardent bien dégagé en avant de la manchette palpébrale
            const iris = new THREE.Mesh(new THREE.SphereGeometry(1.0, 24, 18), materials.eyeIris);
            iris.position.set(0, 0, 0.016);
            iris.scale.set(0.038, 0.034, 0.024);
            eyeSocket.add(iris);

            // Pupille noire ronde centrée et bien contrastée
            const pupil = new THREE.Mesh(new THREE.SphereGeometry(1.0, 20, 16), materials.eyePupil);
            pupil.position.set(-side * 0.002, -0.001, 0.027);
            pupil.scale.set(0.020, 0.019, 0.018);
            eyeSocket.add(pupil);

            // Reflet spéculaire vif (catchlight) sur le bord supéro-antérieur de la pupille
            const catchlight = new THREE.Mesh(new THREE.SphereGeometry(1.0, 10, 10), catchlightMat);
            catchlight.position.set(-side * 0.008, 0.008, 0.043);
            catchlight.scale.set(0.006, 0.006, 0.005);
            eyeSocket.add(catchlight);

            // Dôme cornéen humide et brillant enveloppant l'iris et la pupille
            const cornea = new THREE.Mesh(new THREE.SphereGeometry(1.0, 20, 16), materials.eyeCornea);
            cornea.position.set(0, 0, 0.016);
            cornea.scale.set(0.040, 0.036, 0.028);
            eyeSocket.add(cornea);

            // Paupière mobile supérieure rentrée au repos sous l'arcade et s'abaissant lors du clignement
            const lidGeo = new THREE.SphereGeometry(0.042, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.48);
            const lid = registerSkin(new THREE.Mesh(lidGeo, materials.scalyPad));
            lid.position.set(0, 0, 0.016);
            lid.rotation.x = -Math.PI * 0.58;
            eyeSocket.add(lid);
            eyelids.push(lid);
        });

        // =====================================================================
        // 2D. GRANDE COLLERETTE PARIÉTO-SQUAMOSALE BLINDÉE DRESSÉE
        //     - 2 fosses pariétales serties d'écussons osseux en relief
        //     - Cornes supérieures P3 géantes recourbées vers l'extérieur et le bas
        //     - Crochets médiaux P2 & 6 paires d'époccipitaux S1 à S6
        // =====================================================================
        const frillOrigin = new THREE.Vector3(0, 0.15, 0.04);
        const frillTilt = -0.44; // Collerette dressée fièrement comme sur le portrait !

        function frillLocalToHead(x, zThick, yRad) {
            const zRot = zThick * Math.cos(frillTilt) + yRad * Math.sin(frillTilt);
            const yRot = -zThick * Math.sin(frillTilt) + yRad * Math.cos(frillTilt);
            return [
                frillOrigin.x + x,
                frillOrigin.y + yRot,
                frillOrigin.z + zRot
            ];
        }

        function buildSculptedFrill() {
            const fRings = 56;
            const fSides = 64;
            const geo = new THREE.PlaneGeometry(1, 1, fSides, fRings - 1);
            const pos = geo.attributes.position;
            const uvs = geo.attributes.uv;

            let idx = 0;
            for (let ir = 0; ir < fRings; ir++) {
                const v = ir / (fRings - 1);
                const fanExpand = (0.28 + 0.72 * Math.pow(Math.sin(v * Math.PI * 0.68), 0.82)) * (ir === 0 ? 0.01 : 1.0);
                const cap = Math.sin(v * Math.PI);
                const yBase = v * 1.06;

                for (let ix = 0; ix <= fSides; ix++) {
                    const u = ix / fSides;
                    const ang = u * Math.PI * 2;
                    const s = Math.sin(ang);
                    const c = Math.cos(ang);
                    const absS = Math.abs(s);

                    const lobe = 1.0 + 0.16 * Math.sin(absS * Math.PI) * Math.pow(v, 1.05);
                    const notch = 1.0 - 0.16 * Math.exp(-Math.pow(s / 0.20, 2)) * Math.pow(v, 2.2);
                    const scallop = 1.0 + (v > 0.48 ? 0.045 * Math.cos(ang * 12.0) * Math.pow((v - 0.48) / 0.52, 1.2) : 0.0);

                    const x = s * fanExpand * lobe * scallop;
                    const yRad = (yBase * notch * (0.36 + 0.64 * Math.pow(1.0 - 0.28 * absS * absS, 0.6))) * scallop;

                    const dishCurve = 0.08 * Math.pow(absS, 1.6) * v;
                    let thick = 0.095 * Math.pow(v, 0.42) * (1.0 - 0.38 * v) * Math.pow(cap, 0.60);
                    if (ir === fRings - 1) thick = 0.0;

                    // Fosse pariétale en creux + anneau d'écussons osseux en relief l'encadrant
                    const fenDist = Math.sqrt(Math.pow((v - 0.56) / 0.23, 2) + Math.pow((absS - 0.46) / 0.24, 2));
                    const fenDepression = Math.max(0.0, 1.0 - fenDist * fenDist) * 0.58;
                    const ringRidge = 0.046 * Math.exp(-Math.pow((fenDist - 1.04) / 0.25, 2)) * (c > 0 ? 1.0 : 0.3);

                    // Barre pariétale médiane centrale surélevée
                    const medRidge = 0.048 * Math.exp(-Math.pow(s / 0.11, 2)) * Math.sin(v * Math.PI);

                    const scuteFreq = fenDist > 0.80 ? 10.0 : 22.0;
                    const scuteH = (ir > 0 && ir < fRings - 1) ? 0.026 * cobbleCell3D(x, yRad, 0.0, scuteFreq) : 0.0;

                    const zThick = dishCurve + c * (thick * (1.0 - fenDepression) + ringRidge + medRidge + scuteH);
                    const pt = frillLocalToHead(x, zThick, yRad);

                    pos.setXYZ(idx, pt[0], pt[1], pt[2]);
                    uvs.setXY(idx, u, v);
                    idx++;
                }
            }

            geo.computeVertexNormals();
            headGroup.add(registerSkin(new THREE.Mesh(geo, materials.frillShield)));

            // Couronne de cornes de la collerette (fidèle à assets/portraits/pachyrhino.png) :
            [-1, 1].forEach(side => {
                // 1. Corne supérieure d'angle P3 géante : s'élève, balaye largement vers l'extérieur et recourbe sa pointe vers le bas !
                headGroup.add(createCurvedHornMesh([
                    frillLocalToHead(side * 0.40, 0.03, 0.83),
                    frillLocalToHead(side * 0.65, 0.07, 0.99),
                    frillLocalToHead(side * 0.95, 0.12, 0.98),
                    frillLocalToHead(side * 1.18, 0.17, 0.83),
                    frillLocalToHead(side * 1.28, 0.21, 0.64)
                ], 0.108, 0.006, materials.hornKeratin, 22, 30, 0.09));

                // 2. Crochet pariétal médial P2 encadrant l'échancrure centrale au sommet
                headGroup.add(createCurvedHornMesh([
                    frillLocalToHead(side * 0.17, 0.03, 0.84),
                    frillLocalToHead(side * 0.14, 0.07, 0.99),
                    frillLocalToHead(side * 0.08, 0.12, 1.09)
                ], 0.062, 0.005, materials.hornKeratin, 18, 22, 0.08));

                // 3. 6 Épines époccipitales marginales (S1 à S6) rayonnant le long du bord festonné
                const sVLocs = [0.78, 0.65, 0.52, 0.39, 0.27, 0.16];
                const sRadii = [0.065, 0.063, 0.060, 0.056, 0.050, 0.044];
                const sLens  = [0.22,  0.23,  0.23,  0.21,  0.19,  0.16];
                sVLocs.forEach((vPos, sIdx) => {
                    const rB = sRadii[sIdx];
                    const sLen = sLens[sIdx];
                    const fanW = 0.28 + 0.72 * Math.pow(Math.sin(vPos * Math.PI * 0.68), 0.82);
                    const lobeW = 1.0 + 0.16 * Math.pow(vPos, 1.05);
                    const rx = side * fanW * lobeW * 0.95;
                    const ry = vPos * 1.06 * 0.72;
                    const outX = side * sLen;
                    const outY = (vPos - 0.35) * sLen * 0.65;
                    headGroup.add(createCurvedHornMesh([
                        frillLocalToHead(rx * 0.92, 0.03, ry),
                        frillLocalToHead(rx + outX * 0.55, 0.07, ry + outY * 0.55),
                        frillLocalToHead(rx + outX, 0.12, ry + outY)
                    ], rB, 0.004, materials.hornKeratin, 16, 18, 0.08));
                });
            });
        }
        buildSculptedFrill();

        // =====================================================================
        // 2E. MANDIBULE COMPACTE ARTICULÉE, BEC PRÉDENTAIRE CROCHU & LANGUE CHARNUE
        // =====================================================================
        const jawAdapter = new THREE.Group();
        jawAdapter.position.set(0, -0.20, 0.16);
        jawAdapter.rotation.y = -Math.PI / 2;
        headGroup.add(jawAdapter);

        rig.jaw.position.set(0, 0, 0);
        rig.jaw.rotation.set(0, 0, 0);
        jawAdapter.add(rig.jaw);

        const jawGroup = new THREE.Group();
        jawGroup.rotation.y = Math.PI / 2;
        rig.jaw.add(jawGroup);

        function buildSculptedMandible() {
            const mSlices = [
                { z: -0.06, topY: 0.04, botY: -0.06, halfW: 0.003 },
                { z: 0.04,  topY: 0.05, botY: -0.14, halfW: 0.24  },
                { z: 0.22,  topY: 0.04, botY: -0.17, halfW: 0.24  },
                { z: 0.42,  topY: 0.02, botY: -0.15, halfW: 0.16  },
                { z: 0.56,  topY: 0.00, botY: -0.14, halfW: 0.11  }, // Base du bec prédentaire (v ~ 0.72)
                { z: 0.68,  topY: 0.01, botY: -0.11, halfW: 0.065 },
                { z: 0.77,  topY: 0.05, botY: -0.04, halfW: 0.002 }  // Pointe prédentaire recourbée vers le haut
            ];

            const rSteps = 32;
            const lSteps = 44;
            const geo = new THREE.PlaneGeometry(1, 1, rSteps, lSteps);
            const pos = geo.attributes.position;
            const uvs = geo.attributes.uv;

            const topCurve = new THREE.CatmullRomCurve3(mSlices.map(s => new THREE.Vector3(s.halfW, s.topY, s.z)));
            const botCurve = new THREE.CatmullRomCurve3(mSlices.map(s => new THREE.Vector3(s.halfW, s.botY, s.z)));

            let idx = 0;
            for (let iy = 0; iy <= lSteps; iy++) {
                const v = iy / lSteps;
                const ptTop = topCurve.getPoint(v);
                const ptBot = botCurve.getPoint(v);
                const halfW = Math.max(0.002, ptTop.x);
                const topY = ptTop.y;
                const botY = ptBot.y;
                const z = ptTop.z;

                for (let ix = 0; ix <= rSteps; ix++) {
                    const u = ix / rSteps;
                    const ang = u * Math.PI * 2;
                    const s = Math.sin(ang);
                    const c = Math.cos(ang);
                    const absS = Math.abs(s);

                    let x = Math.sign(s) * Math.pow(absS, 0.80) * halfW;
                    let y;
                    if (c <= 0) {
                        y = botY * Math.pow(Math.abs(c), 0.75);
                    } else {
                        const rim = Math.pow(absS, 1.4);
                        y = topY * rim + (topY - 0.03 * Math.sin(v * Math.PI)) * (1 - rim);
                    }

                    if (v > 0.05 && v < 0.72) {
                        const sc = cobbleCell3D(x, y, z, 22.0);
                        x += s * sc * 0.010;
                        y += c * sc * 0.010;
                    }

                    pos.setXYZ(idx, x, y, z);
                    uvs.setXY(idx, 0.5, 0.75 + v * 0.22);
                    idx++;
                }
            }

            geo.clearGroups();
            const splitRow = Math.floor(lSteps * 0.72);
            const quadsPerRow = rSteps * 6;
            geo.addGroup(0, splitRow * quadsPerRow, 0);
            geo.addGroup(splitRow * quadsPerRow, (lSteps - splitRow) * quadsPerRow, 1);

            geo.computeVertexNormals();
            jawGroup.add(registerSkin(new THREE.Mesh(geo, [materials.scalyPad, materials.beakKeratin])));

            // Langue charnue articulée à l'intérieur de la cavité buccale
            const tongueGeo = createPachyCapsuleGeometry(0.052, 0.36, 6, 12);
            tongueGeo.scale(1.05, 0.36, 1.0);
            tongueGeo.rotateX(Math.PI / 2 - 0.04);
            tongueGeo.translate(0, -0.01, 0.38);
            const tongueMesh = registerSkin(new THREE.Mesh(tongueGeo, materials.oralMucosa));
            jawGroup.add(tongueMesh);
            jawGroup.userData.tongueMesh = tongueMesh;

            jawGroup.add(createBoneVisual(new THREE.Vector3(0, -0.06, 0.0), new THREE.Vector3(0, 0.02, 0.75), 0.045));
        }
        buildSculptedMandible();

        const jawAdductors = [];
        [-1, 1].forEach(side => {
            const upperAnchor = new THREE.Group();
            upperAnchor.position.set(side * 0.18, -0.02, 0.20);
            headGroup.add(upperAnchor);

            const lowerAnchor = new THREE.Group();
            lowerAnchor.position.set(side * 0.16, -0.02, 0.18);
            jawGroup.add(lowerAnchor);

            const muscGeo = createPachyCapsuleGeometry(0.035, 0.16, 5, 10);
            muscGeo.scale(0.75, 1.0, 1.40);
            const muscMesh = registerSkin(new THREE.Mesh(muscGeo, materials.oralMucosa));
            headGroup.add(muscMesh);

            jawAdductors.push({ side, upperAnchor, lowerAnchor, muscMesh });
        });

        // =====================================================================
        // 2F. QUATRE MEMBRES QUADRUPÈDES MUSCLÉS ARTICULÉS À SABOTS
        // =====================================================================
        function buildForelimb(side) {
            const shoulder = new THREE.Group();
            shoulder.position.set(side * 0.42, -0.24, 0.68);
            torsoGroup.add(shoulder);

            // 1. Humérus & épaule musclée (0.62m)
            const humLen = 0.62;
            const humMesh = createMuscularSegment(humLen, '-y', (t, angle) => {
                const deltoid = Math.sin(t * Math.PI * 0.85) * 0.068;
                const r = THREE.MathUtils.lerp(0.29, 0.20, t) + deltoid;
                return {
                    rx: r * 0.86,
                    rz: r * 1.15,
                    offsetZ: Math.cos(angle) * 0.025
                };
            }, materials.bodyHide, 0.24, 0.18);
            shoulder.add(humMesh);
            shoulder.add(createBoneVisual(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -humLen, 0), 0.052));

            // 2. Coude -> Avant-bras (Radius & Ulna : 0.56m)
            const elbow = new THREE.Group();
            elbow.position.set(0, -humLen, 0);
            shoulder.add(elbow);

            const faLen = 0.56;
            const faMesh = createMuscularSegment(faLen, '-y', (t) => {
                const forearmBulge = Math.exp(-Math.pow(t - 0.30, 2) * 14.0) * 0.045;
                const r = THREE.MathUtils.lerp(0.20, 0.15, t) + forearmBulge;
                return { rx: r * 0.88, rz: r * 1.10 };
            }, materials.bodyHide, 0.18, 0.18);
            elbow.add(faMesh);
            elbow.add(createBoneVisual(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -faLen, 0), 0.044));

            // 3. Poignet & Pied antérieur (Manus) à 5 sabots cornés (anatomie cératopsienne & Blender v5)
            const wrist = new THREE.Group();
            wrist.position.set(0, -faLen, 0);
            elbow.add(wrist);

            const footLen = 0.22;
            const footMesh = createMuscularSegment(footLen, '-y', (t) => {
                const r = THREE.MathUtils.lerp(0.155, 0.185, t);
                return { rx: r * 1.08, rz: r * 0.98 };
            }, materials.scalyPad, 0.20, 0.16);
            wrist.add(footMesh);

            const toes = [];
            [-0.12, -0.06, 0.0, 0.06, 0.12].forEach(txOff => {
                const toeGroup = new THREE.Group();
                toeGroup.position.set(txOff, -footLen * 0.82, 0.08);
                wrist.add(toeGroup);

                const hoof = createCurvedHornMesh([
                    [0, 0, 0],
                    [txOff * 0.15, -0.03, 0.10],
                    [txOff * 0.25, -0.06, 0.18]
                ], 0.042, 0.012, materials.hoof, 12, 12);
                toeGroup.add(hoof);
                toes.push(toeGroup);
            });

            return { side, isFront: true, shoulder, elbow, wrist, toes };
        }

        function buildHindlimb(side) {
            const hip = new THREE.Group();
            hip.position.set(side * 0.40, -0.08, -0.62);
            torsoGroup.add(hip);

            // 1. Fémur colossal (0.68m)
            const femLen = 0.68;
            const femMesh = createMuscularSegment(femLen, '-y', (t, angle) => {
                const thighBulge = Math.sin(t * Math.PI * 0.82) * 0.085;
                const r = THREE.MathUtils.lerp(0.36, 0.225, t) + thighBulge;
                return {
                    rx: r * 0.84,
                    rz: r * 1.18,
                    offsetZ: Math.cos(angle) * 0.03
                };
            }, materials.bodyHide, 0.24, 0.18);
            hip.add(femMesh);
            hip.add(createBoneVisual(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -femLen, 0), 0.064));

            // 2. Genou -> Tibia / Mollet (0.60m)
            const knee = new THREE.Group();
            knee.position.set(0, -femLen, 0);
            hip.add(knee);

            const tibLen = 0.60;
            const tibMesh = createMuscularSegment(tibLen, '-y', (t) => {
                const calfBulge = Math.exp(-Math.pow(t - 0.28, 2) * 14.0) * 0.055;
                const r = THREE.MathUtils.lerp(0.225, 0.155, t) + calfBulge;
                return { rx: r * 0.88, rz: r * 1.12, offsetZ: -calfBulge * 0.35 };
            }, materials.bodyHide, 0.18, 0.18);
            knee.add(tibMesh);
            knee.add(createBoneVisual(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -tibLen, 0), 0.050));

            // 3. Cheville & Pied postérieur (Pes) à 4 sabots massifs
            const ankle = new THREE.Group();
            ankle.position.set(0, -tibLen, 0);
            knee.add(ankle);

            const pesLen = 0.26;
            const pesMesh = createMuscularSegment(pesLen, '-y', (t) => {
                const r = THREE.MathUtils.lerp(0.16, 0.195, t);
                return { rx: r * 1.08, rz: r * 1.02 };
            }, materials.scalyPad, 0.20, 0.16);
            ankle.add(pesMesh);

            const toes = [];
            [-0.11, -0.036, 0.038, 0.112].forEach(txOff => {
                const toeGroup = new THREE.Group();
                toeGroup.position.set(txOff, -pesLen * 0.84, 0.09);
                ankle.add(toeGroup);

                const hoof = createCurvedHornMesh([
                    [0, 0, 0],
                    [txOff * 0.15, -0.03, 0.11],
                    [txOff * 0.25, -0.06, 0.20]
                ], 0.050, 0.014, materials.hoof, 12, 12);
                toeGroup.add(hoof);
                toes.push(toeGroup);
            });

            return { side, isFront: false, hip, knee, ankle, toes };
        }

        const leftFrontLeg = buildForelimb(1);
        const rightFrontLeg = buildForelimb(-1);
        const leftHindLeg = buildHindlimb(1);
        const rightHindLeg = buildHindlimb(-1);

        // =====================================================================
        // 3. MOTEUR DE POSES BIOMÉCANIQUES QUADRUPÈDES (IDLE, WALK, SPRINT, DISPLAY, CROUCH)
        // =====================================================================
        const pRig = {
            pachy,
            rootJoint,
            torsoGroup,
            caudalSegments,
            neckSegments,
            headGroup,
            jawGroup,
            nasalBossGroup,
            leftFrontLeg,
            rightFrontLeg,
            leftHindLeg,
            rightHindLeg,
            eyelids,
            jawAdductors,
            tongueMesh: jawGroup.userData.tongueMesh,
            skeletonMeshes,
            materials,
            currentMode: 'idle',
            poseUpdatedThisFrame: false
        };

        // Convention : rx > 0 = tête baisse vers le sol (posture de bélier), rx < 0 = tête/collerette lève vers le ciel
        function setPachyHeadRot(rx, ry, rz) {
            rig.headGroup.rotation.set(rz || 0, ry || 0, -(rx || 0));
        }

        // Convention : openAmt > 0 = ouverture du bec prédentaire inférieur
        function setPachyJawRot(openAmt, rollZ = 0) {
            rig.jaw.rotation.set(rollZ || 0, 0, -Math.max(0, openAmt || 0));
        }

        // Cinématique du membre antérieur quadrupède (Épaule -> Coude -> Poignet)
        function setForelimbPose(leg, swingAngle = 0, elbowFlex = 0, wristFlex = 0, crouchDrop = 0, abduction = 0.05) {
            const rootPitch = rootJoint.rotation.x || 0;
            const cBend = crouchDrop * 0.85;
            const shRx = 0.30 - rootPitch + swingAngle + cBend;
            const elRx = -0.52 - elbowFlex - cBend * 1.75;
            const wrRx = -(shRx + elRx + rootPitch) + wristFlex;

            leg.shoulder.rotation.set(shRx, 0, abduction * leg.side);
            leg.elbow.rotation.set(elRx, 0, 0);
            leg.wrist.rotation.set(wrRx, 0, 0);
        }

        // Cinématique du membre postérieur quadrupède (Hanche -> Genou -> Cheville)
        function setHindlimbPose(leg, swingAngle = 0, kneeFlex = 0, ankleFlex = 0, crouchDrop = 0, abduction = 0.04) {
            const rootPitch = rootJoint.rotation.x || 0;
            const cBend = crouchDrop * 0.85;
            const hpRx = -0.36 - rootPitch + swingAngle - cBend;
            const knRx = 0.68 + kneeFlex + cBend * 1.75;
            const anRx = -(hpRx + knRx + rootPitch) + ankleFlex;

            leg.hip.rotation.set(hpRx, 0, abduction * leg.side);
            leg.knee.rotation.set(knRx, 0, 0);
            leg.ankle.rotation.set(anRx, 0, 0);
        }

        pRig.setHeadRot = setPachyHeadRot;
        pRig.setJawRot = setPachyJawRot;
        pRig.setForelimbPose = setForelimbPose;
        pRig.setHindlimbPose = setHindlimbPose;

        function applyPoseMode(mode, t, opts = {}) {
            pRig.currentMode = mode;
            pRig.poseUpdatedThisFrame = true;

            if (mode === 'idle') {
                // --- MODE 1 : GARDE DE BÉLIER BLINDÉ (RESPIRATION LOURDE & VEILLE DE COLLERETTE) ---
                const breath = Math.sin(t * 2.8);
                const weightShift = Math.sin(t * 1.4);
                const dropAmt = Math.max(0, -breath) * 0.04;

                rootJoint.position.set(weightShift * 0.025, 1.65 - dropAmt * 0.5, 0);
                rootJoint.rotation.set(
                    0.02 + breath * 0.015,
                    weightShift * 0.02,
                    weightShift * 0.015
                );

                neckSegments.forEach((seg, i) => {
                    const wave = Math.sin(t * 2.8 - i * 0.4) * 0.015;
                    seg.rotation.set(0.02 + wave, weightShift * 0.02, 0);
                });

                setPachyHeadRot(
                    0.12 + Math.sin(t * 2.8 - 1.0) * 0.045,
                    weightShift * 0.06,
                    Math.cos(t * 1.4) * 0.025
                );
                setPachyJawRot(0.04 + Math.max(0, breath) * 0.05);

                setForelimbPose(leftFrontLeg, 0.03, 0, 0, dropAmt, 0.05);
                setForelimbPose(rightFrontLeg, -0.03, 0, 0, dropAmt, 0.05);
                setHindlimbPose(leftHindLeg, -0.03, 0, 0, dropAmt, 0.04);
                setHindlimbPose(rightHindLeg, 0.03, 0, 0, dropAmt, 0.04);

                caudalSegments.forEach((seg, i) => {
                    seg.rotation.set(
                        0.02 + Math.cos(t * 2.8 - i * 0.45) * 0.02,
                        Math.sin(t * 2.2 - i * 0.55) * (0.05 + i * 0.018),
                        0
                    );
                });

            } else if (mode === 'walk' || mode === 'sprint') {
                // --- MODE 2 : TROT QUADRUPÈDE PUISSANT & GALOP DE CHARGE BORÉALE ---
                const isSprint = mode === 'sprint' || Boolean(opts.isSprint);
                const strideSpeed = opts.strideSpeed || (isSprint ? 12.2 : 8.8);
                const strideAmp = opts.strideAmp !== undefined ? opts.strideAmp : (isSprint ? 1.30 : 1.0);
                const phase = t * strideSpeed;

                const bounce = Math.abs(Math.sin(phase)) * (isSprint ? 0.14 : 0.09) * strideAmp;
                const chargeLean = isSprint ? 0.18 : 0.05;

                rootJoint.position.set(
                    Math.cos(phase) * 0.04 * strideAmp,
                    1.62 + bounce - (isSprint ? 0.08 : 0),
                    0
                );
                rootJoint.rotation.set(
                    chargeLean + Math.cos(phase * 2) * 0.035 * strideAmp,
                    Math.sin(phase) * 0.045 * strideAmp,
                    Math.cos(phase) * 0.035 * strideAmp
                );

                neckSegments.forEach((seg, i) => {
                    const basePitch = isSprint ? 0.08 : 0.03;
                    seg.rotation.set(
                        basePitch + Math.sin(phase * 2 - i * 0.3) * 0.025 * strideAmp,
                        -Math.sin(phase) * 0.025 * strideAmp,
                        0
                    );
                });

                // En sprint, le Pachyrhinosaure baisse la tête pour présenter sa bosse nasale en bélier !
                setPachyHeadRot(
                    (isSprint ? 0.28 : 0.12) + Math.sin(phase * 2) * 0.05 * strideAmp,
                    -Math.sin(phase) * 0.05 * strideAmp,
                    0
                );
                setPachyJawRot((isSprint ? 0.22 : 0.08) + Math.abs(Math.sin(phase)) * 0.12);

                // Allure diagonale quadrupède (antérieur gauche synchronisé avec postérieur droit)
                const flPhase = phase;
                const frPhase = phase + Math.PI;
                const hlPhase = phase + Math.PI * 0.85;
                const hrPhase = phase - Math.PI * 0.15;

                [
                    { leg: leftFrontLeg, p: flPhase },
                    { leg: rightFrontLeg, p: frPhase }
                ].forEach(({ leg, p }) => {
                    const swing = -Math.sin(p) * 0.42 * strideAmp;
                    const lift = Math.max(0, Math.cos(p));
                    setForelimbPose(leg, swing, lift * 0.52 * strideAmp, -lift * 0.25, isSprint ? 0.06 : 0.02, 0.05);
                });

                [
                    { leg: leftHindLeg, p: hlPhase },
                    { leg: rightHindLeg, p: hrPhase }
                ].forEach(({ leg, p }) => {
                    const swing = -Math.sin(p) * 0.44 * strideAmp;
                    const lift = Math.max(0, Math.cos(p));
                    setHindlimbPose(leg, swing, lift * 0.55 * strideAmp, -lift * 0.28, isSprint ? 0.06 : 0.02, 0.04);
                });

                caudalSegments.forEach((seg, i) => {
                    seg.rotation.set(
                        (isSprint ? -0.05 : 0.01) + Math.sin(phase * 2 - i * 0.4) * 0.03 * strideAmp,
                        -Math.cos(phase - i * 0.5) * (0.08 + i * 0.025) * strideAmp,
                        0
                    );
                });

            } else if (mode === 'display') {
                // --- MODE 3 : PARADE D'INTIMIDATION (CABRÉ CÉRATOPSIEN & EXHIBITION DE LA COLLERETTE) ---
                const vib = Math.sin(t * 26);
                rootJoint.position.set(0, 1.72, 0.04);
                rootJoint.rotation.set(-0.22 + vib * 0.012, 0, 0);

                neckSegments.forEach((seg, i) => {
                    seg.rotation.set(-0.08 - i * 0.02 + vib * 0.01, Math.sin(t * 6) * 0.03, 0);
                });

                setPachyHeadRot(-0.24 + vib * 0.025, Math.sin(t * 6) * 0.12, vib * 0.02);
                setPachyJawRot(0.62 + vib * 0.08);

                setForelimbPose(leftFrontLeg, -0.22, 0.25, -0.15, 0, 0.07);
                setForelimbPose(rightFrontLeg, -0.16, 0.18, -0.10, 0, 0.07);
                setHindlimbPose(leftHindLeg, 0.12, 0.08, 0, 0.05, 0.05);
                setHindlimbPose(rightHindLeg, 0.08, 0.12, 0, 0.05, 0.05);

                caudalSegments.forEach((seg, i) => {
                    seg.rotation.set(0.06 - i * 0.01, Math.sin(t * 5 - i * 0.5) * (0.06 + i * 0.02), 0);
                });

            } else if (mode === 'crouch') {
                // --- MODE 4 : POSTURE DE BOUCLIER BLINDÉ ACCROUPI (COLLERETTE DRESSÉE EN MURAILLE) ---
                const breath = Math.sin(t * 3.0);
                rootJoint.position.set(0, 1.24 + breath * 0.018, 0);
                rootJoint.rotation.set(0.16, 0, 0);

                neckSegments.forEach(seg => {
                    seg.rotation.set(0.08, 0, 0);
                });
                // Tête rentrée exposant la bosse nasale et la grande collerette blindée
                setPachyHeadRot(0.32, 0, 0);
                setPachyJawRot(0.08);

                setForelimbPose(leftFrontLeg, 0.08, 0.18, -0.10, 0.45, 0.07);
                setForelimbPose(rightFrontLeg, -0.06, 0.18, -0.10, 0.45, 0.07);
                setHindlimbPose(leftHindLeg, -0.05, 0.15, -0.08, 0.42, 0.06);
                setHindlimbPose(rightHindLeg, 0.05, 0.15, -0.08, 0.42, 0.06);

                caudalSegments.forEach((seg, i) => {
                    seg.rotation.set(0.03, Math.sin(t * 3.0 - i * 0.5) * 0.05, 0);
                });
            }
        }

        function resetPachyPose(time) {
            rig.torso.rotation.set(0, 0, 0);
            rig.neck.rotation.set(0, 0, 0);
            rig.legs.forEach(l => { if (l) l.rotation.set(0, 0, 0); });
            rig.tailSegments.forEach(s => { if (s) s.rotation.set(0, 0, 0); });
            applyPoseMode('idle', time || 0);
            pRig.poseUpdatedThisFrame = false;
        }

        const _pUpper = new THREE.Vector3();
        const _pLower = new THREE.Vector3();
        const _pMid = new THREE.Vector3();

        function updateAnatomicalSkin(time, fighter, modeOverride) {
            const t = time || 0;
            const breathPhase = t * 2.8;

            // 1. Clignement naturel des paupières et plissement agressif pendant les charges
            const blinkCycle = ((t % 4.6) + 4.6) % 4.6;
            const blinkAmt = blinkCycle < 0.15 ? Math.sin((blinkCycle / 0.15) * Math.PI) : 0;
            const jawOpenAmt = Math.max(0, -rig.jaw.rotation.z);
            const glareSquint = Math.min(0.34, jawOpenAmt * 0.30);
            eyelids.forEach(lid => {
                lid.rotation.x = -Math.PI * 0.58 + Math.max(blinkAmt * 0.96, glareSquint);
            });

            // 2. Animation de la langue selon l'ouverture du bec prédentaire
            if (jawGroup.userData.tongueMesh) {
                jawGroup.userData.tongueMesh.rotation.x = -0.04 + jawOpenAmt * 0.16 + Math.sin(t * 24) * 0.025 * jawOpenAmt;
            }

            // 3. Synchronisation avec combat_reactions.js et neutralisation des surcharges génériques
            if (pRig.poseUpdatedThisFrame) {
                rig.torso.rotation.set(0, 0, 0);
                rig.neck.rotation.set(0, 0, 0);
                if (fighter && (fighter.action === 'crouch' || fighter.isCrouching)) {
                    rig.hips.position.y = 1.65;
                }
            } else if (fighter) {
                const cState = fighter.combatController ? fighter.combatController.state : null;
                const isGroundedOrFalling = fighter.isDead || fighter.flattened || fighter.beingThrownTimer > 0 ||
                    cState === CombatState.KNOCKDOWN_FALL || cState === CombatState.GROUNDED_IDLE || cState === CombatState.WAKE_UP_STAND;

                if (!isGroundedOrFalling) {
                    const genericPitch = -(rig.hips.rotation.z + rig.torso.rotation.z);
                    const genericYaw = rig.torso.rotation.y;
                    const hipDrop = Math.max(-0.35, Math.min(0.85, 1.65 - rig.hips.position.y));

                    rig.hips.position.y = 1.65;
                    rig.hips.rotation.z = 0;
                    rig.torso.rotation.set(0, 0, 0);

                    rootJoint.position.y = 1.65 - hipDrop * 0.78;
                    rootJoint.rotation.set(genericPitch * 0.72, genericYaw, rig.hips.rotation.x);

                    const flSwing = rig.legs[0] ? -rig.legs[0].rotation.z * 0.45 : 0;
                    const frSwing = rig.legs[1] ? -rig.legs[1].rotation.z * 0.45 : 0;
                    const hlSwing = rig.legs[2] ? -rig.legs[2].rotation.z * 0.45 : -flSwing;
                    const hrSwing = rig.legs[3] ? -rig.legs[3].rotation.z * 0.45 : -frSwing;
                    const crouchAmt = Math.max(0, hipDrop * 0.55);

                    setForelimbPose(leftFrontLeg, flSwing, Math.max(0, flSwing) * 0.35, 0, crouchAmt, 0.05);
                    setForelimbPose(rightFrontLeg, frSwing, Math.max(0, frSwing) * 0.35, 0, crouchAmt, 0.05);
                    setHindlimbPose(leftHindLeg, hlSwing, Math.max(0, hlSwing) * 0.35, 0, crouchAmt, 0.04);
                    setHindlimbPose(rightHindLeg, hrSwing, Math.max(0, hrSwing) * 0.35, 0, crouchAmt, 0.04);
                }

                if (Math.abs(rig.neck.rotation.z) > 0.001 || Math.abs(rig.neck.rotation.y) > 0.001) {
                    const pitchPerSeg = -rig.neck.rotation.z / neckSegments.length;
                    const yawPerSeg = rig.neck.rotation.y / neckSegments.length;
                    neckSegments.forEach(seg => {
                        seg.rotation.x += pitchPerSeg;
                        seg.rotation.y += yawPerSeg;
                    });
                    rig.neck.rotation.set(0, 0, 0);
                }

                rig.tailSegments.forEach((tProxy, idx) => {
                    if (!tProxy) return;
                    if (Math.abs(tProxy.rotation.y) > 0.001 || Math.abs(tProxy.rotation.z) > 0.001) {
                        const cIdx = Math.min(caudalSegments.length - 1, idx);
                        caudalSegments[cIdx].rotation.y += tProxy.rotation.y * 0.65;
                        caudalSegments[cIdx].rotation.x -= tProxy.rotation.z * 0.55;
                        if (idx === 2 && caudalSegments.length > 3) {
                            caudalSegments[3].rotation.y += tProxy.rotation.y * 0.55;
                            caudalSegments[4].rotation.y += tProxy.rotation.y * 0.55;
                        }
                        tProxy.rotation.set(0, 0, 0);
                    }
                });
            }

            // 4. Synchroniser le squelette interne X-Ray
            const isXray = Boolean(fighter && fighter.isXrayTarget);
            skeletonMeshes.forEach(m => { m.visible = isXray; });

            // 5. Mettre à jour les matrices mondiales, les muscles adducteurs de la mâchoire et le maillage continu
            pachy.updateMatrixWorld(true);

            jawAdductors.forEach(item => {
                item.muscMesh.visible = jawOpenAmt > 0.05;
                if (item.muscMesh.visible) {
                    item.upperAnchor.getWorldPosition(_pUpper);
                    item.lowerAnchor.getWorldPosition(_pLower);
                    headGroup.worldToLocal(_pUpper);
                    headGroup.worldToLocal(_pLower);
                    _pMid.copy(_pUpper).add(_pLower).multiplyScalar(0.5);
                    const dist = Math.max(0.05, _pUpper.distanceTo(_pLower));
                    item.muscMesh.position.copy(_pMid);
                    item.muscMesh.scale.set(0.75, dist / 0.18, 1.35);
                    item.muscMesh.rotation.set(0.12 + jawOpenAmt * 0.30, 0, item.side * 0.08);
                }
            });

            updateContinuousBodySkin(breathPhase);
            void modeOverride;
        }

        rig.specialParts.pRig = pRig;
        rig.specialParts.applyPoseMode = applyPoseMode;
        rig.specialParts.resetPachyPose = resetPachyPose;
        rig.specialParts.resetQuetzalPose = resetPachyPose; // Hook automatique appelé par rig_reset.js
        rig.specialParts.updateAnatomicalSkin = updateAnatomicalSkin;

        // Initialiser la pose par défaut et générer le maillage continu initial
        applyPoseMode('idle', 0);
        updateAnatomicalSkin(0, null, 'idle');
    },
});
