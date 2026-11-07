/* ============================================================================
 * COMBATTANT : T-REX (Tyrannosaurus Rex)
 * Données (stats, skins, textes), modèle 3D paléontologique procédural haute
 * fidélité conçu et validé avec Blender 5.2 d'après le portrait de référence
 * (textures PBR 1024x1024 de peau volcanique vert-olive sombre et charbon,
 * écailles polygonales en pavés, cicatrices de combat cramoisies, crêtes
 * sourcilières/lacrymales et nasales blindées d'ostéodermes surplombant
 * l'orbite, renflement maxillaire balafré, fosses narinaires obliques,
 * gencives festonnées humides, crocs courbés à racines tachées, langue charnue
 * sillonnée, membranes d'adducteurs mandibulaires, filets de bave dynamiques,
 * triple rangée d'ostéodermes dorsaux/nucaux et plis gulaires sur maillage
 * continu Catmull-Rom en temps réel, bras didactyles et membres postérieurs
 * digitigrades à 4 segments articulés), animations biomécaniques & fatalité.
 * ============================================================================ */

// Cache global des textures procédurales PBR 1024x1024 pour éviter toute régénération coûteuse
let _cachedTrexPBRMaps = null;

function getTrexPBRMaps() {
    if (_cachedTrexPBRMaps) return _cachedTrexPBRMaps;

    function applySRGB(tex) {
        if (THREE.SRGBColorSpace) {
            tex.colorSpace = THREE.SRGBColorSpace;
        } else if (THREE.sRGBEncoding) {
            tex.encoding = THREE.sRGBEncoding;
        }
    }

    // Générateur déterministe rapide pour le réseau d'écailles polygonales
    let _seed = 1337;
    function rand() {
        _seed = (_seed * 16807) % 2147483647;
        return (_seed - 1) / 2147483646;
    }

    // 1. Peau volcanique pourpre-écarlate / magma ardent, écailles polygonales, plis gulaires & rayures dorsales
    function createBodyHideMaps() {
        const size = 1024;
        const colorCanvas = document.createElement('canvas');
        const bumpCanvas = document.createElement('canvas');
        colorCanvas.width = bumpCanvas.width = size;
        colorCanvas.height = bumpCanvas.height = size;
        const cCtx = colorCanvas.getContext('2d');
        const bCtx = bumpCanvas.getContext('2d');

        // Contre-ombrage flashy rubis-magma (U = circonférence : 0/1 = crête dorsale obsidienne, 0.5 = gorge/ventre or ambré éclatant)
        const grad = cCtx.createLinearGradient(0, 0, size, 0);
        grad.addColorStop(0.00, '#1c0707');   // Crête dorsale et ostéodermes (charbon obsidienne volcanique)
        grad.addColorStop(0.16, '#5b0f14');   // Haut des flancs (cramoisi volcanique profond)
        grad.addColorStop(0.32, '#a8181e');   // Milieu des flancs (rouge écarlate rubis)
        grad.addColorStop(0.42, '#d92626');   // Reflets écarlate vermillon éclatant
        grad.addColorStop(0.47, '#e06014');   // Transition ventrale magma ardent
        grad.addColorStop(0.50, '#f59e0b');   // Gorge / ventre (or solaire ambre éclatant)
        grad.addColorStop(0.53, '#e06014');
        grad.addColorStop(0.58, '#d92626');
        grad.addColorStop(0.68, '#a8181e');
        grad.addColorStop(0.84, '#5b0f14');
        grad.addColorStop(1.00, '#1c0707');
        cCtx.fillStyle = grad;
        cCtx.fillRect(0, 0, size, size);

        bCtx.fillStyle = '#787878';
        bCtx.fillRect(0, 0, size, size);

        // Bandes tigrées transversales charbon-noir le long de l'épine dorsale et des flancs (V = queue -> cou)
        const numStripes = 30;
        for (let s = 0; s < numStripes; s++) {
            const vCenter = (s + 0.5) / numStripes;
            const yCenter = vCenter * size;
            const stripeW = 11 + rand() * 15;

            [0, 1].forEach(side => {
                const startX = side === 0 ? 0 : size;
                const endX = side === 0 ? size * (0.32 + rand() * 0.07) : size * (0.68 - rand() * 0.07);
                const midX = (startX + endX) * 0.5;
                const waveY = yCenter + (rand() - 0.5) * 24;

                cCtx.save();
                cCtx.strokeStyle = 'rgba(15, 6, 6, 0.78)';
                cCtx.lineWidth = stripeW;
                cCtx.lineCap = 'round';
                cCtx.beginPath();
                cCtx.moveTo(startX, yCenter);
                cCtx.quadraticCurveTo(midX, waveY, endX, yCenter + (rand() - 0.5) * 18);
                cCtx.stroke();

                // Liseré or/ambre étincelant adjacent soulignant les reliefs d'ostéodermes
                cCtx.strokeStyle = 'rgba(251, 191, 36, 0.38)';
                cCtx.lineWidth = stripeW * 0.42;
                cCtx.beginPath();
                cCtx.moveTo(startX, yCenter + stripeW * 0.62);
                cCtx.quadraticCurveTo(midX, waveY + stripeW * 0.62, endX, yCenter + stripeW * 0.48);
                cCtx.stroke();
                cCtx.restore();

                bCtx.strokeStyle = '#9c9c9c';
                bCtx.lineWidth = stripeW * 0.72;
                bCtx.lineCap = 'round';
                bCtx.beginPath();
                bCtx.moveTo(startX, yCenter);
                bCtx.quadraticCurveTo(midX, waveY, endX, yCenter);
                bCtx.stroke();
            });
        }

        // Plis cutanés profonds sous la gorge, le cou et le panier gastral (visibles en bas à droite du portrait)
        for (let y = 0; y < size; y += 8) {
            const jitter = (rand() - 0.5) * 3.0;
            cCtx.strokeStyle = 'rgba(18, 15, 11, 0.34)';
            cCtx.lineWidth = 2.2;
            cCtx.beginPath();
            cCtx.moveTo(size * 0.33, y + jitter);
            cCtx.quadraticCurveTo(size * 0.50, y + 7 + jitter, size * 0.67, y - jitter);
            cCtx.stroke();

            bCtx.strokeStyle = '#4e4e4e';
            bCtx.lineWidth = 2.6;
            bCtx.beginPath();
            bCtx.moveTo(size * 0.33, y + jitter);
            bCtx.quadraticCurveTo(size * 0.50, y + 7 + jitter, size * 0.67, y - jitter);
            bCtx.stroke();
        }

        // Pavage d'écailles polygonales reptiliennes et tubercules dermiques (72 000 écailles)
        for (let i = 0; i < 72000; i++) {
            const x = rand() * size;
            const y = rand() * size;
            const u = x / size;
            const isDorsal = u < 0.24 || u > 0.76;
            const scaleR = isDorsal ? (1.8 + rand() * 3.0) : (1.1 + rand() * 1.9);
            const lum = Math.floor(112 + rand() * 72);

            bCtx.fillStyle = `rgb(${lum},${lum},${lum})`;
            bCtx.beginPath();
            bCtx.arc(x, y, scaleR, 0, Math.PI * 2);
            bCtx.fill();

            if (i % 3 === 0) {
                // Cernes sombres entre les écailles polygonales et reflets or-ambre au sommet
                cCtx.strokeStyle = 'rgba(20, 6, 6, 0.32)';
                cCtx.lineWidth = 0.8;
                cCtx.fillStyle = rand() > 0.48
                    ? 'rgba(245, 158, 11, 0.16)'
                    : 'rgba(28, 8, 8, 0.22)';
                cCtx.beginPath();
                cCtx.arc(x, y, scaleR, 0, Math.PI * 2);
                cCtx.fill();
                cCtx.stroke();
            }
        }

        // Gros ostéodermes cuirassés le long des crêtes nucales et dorsales
        for (let i = 0; i < 1800; i++) {
            const side = i % 2 === 0 ? rand() * 0.18 : (1.0 - rand() * 0.18);
            const x = side * size;
            const y = rand() * size;
            const r = 3.5 + rand() * 5.2;
            bCtx.fillStyle = '#ececec';
            bCtx.beginPath();
            bCtx.arc(x, y, r, 0, Math.PI * 2);
            bCtx.fill();

            cCtx.fillStyle = 'rgba(28, 8, 8, 0.48)';
            cCtx.strokeStyle = 'rgba(251, 191, 36, 0.35)';
            cCtx.lineWidth = 1.1;
            cCtx.beginPath();
            cCtx.arc(x, y, r, 0, Math.PI * 2);
            cCtx.fill();
            cCtx.stroke();
        }

        const colorMap = new THREE.CanvasTexture(colorCanvas);
        const bumpMap = new THREE.CanvasTexture(bumpCanvas);
        colorMap.wrapS = colorMap.wrapT = bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping;
        applySRGB(colorMap);
        return { colorMap, bumpMap };
    }

    // 2. Cuirasse crânienne en pavés d'écailles polygonales rouge rubis/écarlate & balafres cramoisies du portrait
    function createCraniumKeratinMaps() {
        const size = 1024;
        const canvas = document.createElement('canvas');
        const bump = document.createElement('canvas');
        canvas.width = bump.width = size;
        canvas.height = bump.height = size;
        const ctx = canvas.getContext('2d');
        const bCtx = bump.getContext('2d');

        // Base rouge rubis écarlate & or ardent avec zone claire sur le renflement maxillaire (joue)
        const grad = ctx.createLinearGradient(0, 0, size, 0);
        grad.addColorStop(0.00, '#240808'); // Occiput & tempes sombres obsidienne
        grad.addColorStop(0.28, '#781216'); // Région postorbitaire & jugale cramoisie
        grad.addColorStop(0.55, '#c91a24'); // Renflement maxillaire (écarlate éclatant)
        grad.addColorStop(0.78, '#e05318'); // Région narinaire & museau (magma flamboyant)
        grad.addColorStop(1.00, '#1c0606'); // Prémaxillaire kératinisé sombre
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, size, size);

        bCtx.fillStyle = '#747474';
        bCtx.fillRect(0, 0, size, size);

        // Réseau dense d'écailles polygonales / pavés reptiliens (cobblestone scutes du portrait)
        const gridCols = 44;
        const gridRows = 44;
        const cellW = size / gridCols;
        const cellH = size / gridRows;

        for (let gy = 0; gy < gridRows; gy++) {
            for (let gx = 0; gx < gridCols; gx++) {
                const cx = (gx + 0.2 + rand() * 0.6) * cellW;
                const cy = (gy + 0.2 + rand() * 0.6) * cellH;
                const rx = cellW * (0.38 + rand() * 0.24);
                const ry = cellH * (0.36 + rand() * 0.24);
                const sides = 5 + Math.floor(rand() * 3);
                const rot = rand() * Math.PI * 2;

                ctx.save();
                ctx.beginPath();
                bCtx.beginPath();
                for (let s = 0; s < sides; s++) {
                    const a = rot + (s / sides) * Math.PI * 2;
                    const rMod = 0.82 + rand() * 0.32;
                    const px = cx + Math.cos(a) * rx * rMod;
                    const py = cy + Math.sin(a) * ry * rMod;
                    if (s === 0) {
                        ctx.moveTo(px, py);
                        bCtx.moveTo(px, py);
                    } else {
                        ctx.lineTo(px, py);
                        bCtx.lineTo(px, py);
                    }
                }
                ctx.closePath();
                bCtx.closePath();

                // Nuance individuelle de chaque plaque d'écaille (rouge rubis, or ambré ou obsidienne)
                const shade = rand();
                if (shade > 0.68) {
                    ctx.fillStyle = 'rgba(245, 158, 11, 0.28)';
                } else if (shade < 0.30) {
                    ctx.fillStyle = 'rgba(24, 6, 6, 0.32)';
                } else {
                    ctx.fillStyle = 'rgba(185, 28, 28, 0.22)';
                }
                ctx.fill();
                ctx.strokeStyle = 'rgba(20, 5, 5, 0.72)';
                ctx.lineWidth = 2.2;
                ctx.stroke();
                ctx.restore();

                // Relief bombé de l'écaille dans la bumpMap avec sillon périphérique profond
                const bLum = Math.floor(155 + rand() * 65);
                bCtx.fillStyle = `rgb(${bLum},${bLum},${bLum})`;
                bCtx.fill();
                bCtx.strokeStyle = '#262626';
                bCtx.lineWidth = 2.6;
                bCtx.stroke();
            }
        }

        // Sillons neurovasculaires et rugosités osseuses de la kératine faciale
        for (let i = 0; i < 3600; i++) {
            const x = rand() * size;
            const y = rand() * size;
            const len = 10 + rand() * 38;
            const ang = (rand() - 0.5) * 0.55;
            ctx.strokeStyle = rand() > 0.45
                ? 'rgba(12, 16, 10, 0.25)'
                : 'rgba(165, 178, 122, 0.14)';
            ctx.lineWidth = 1.0 + rand() * 1.8;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
            ctx.stroke();
        }

        // Cicatrices et balafres cramoisies profondes sur le museau et le maxillaire (fidèles au portrait !)
        const scarClusters = [
            { x: 0.56, y: 0.28, ang: 1.12, len: 135, w: 4.5 },
            { x: 0.68, y: 0.34, ang: -0.95, len: 150, w: 5.0 },
            { x: 0.76, y: 0.24, ang: 0.85, len: 120, w: 4.2 },
            { x: 0.52, y: 0.72, ang: -1.08, len: 135, w: 4.5 },
            { x: 0.66, y: 0.68, ang: 0.92, len: 145, w: 4.8 },
            { x: 0.78, y: 0.76, ang: -0.82, len: 115, w: 4.0 },
            { x: 0.42, y: 0.22, ang: 0.45, len: 95, w: 3.6 },
            { x: 0.42, y: 0.78, ang: -0.45, len: 95, w: 3.6 }
        ];
        scarClusters.forEach(sc => {
            for (let t = -1; t <= 1; t++) {
                const sx = sc.x * size + t * 14;
                const sy = sc.y * size + t * 6;
                const ex = sx + Math.cos(sc.ang) * sc.len;
                const ey = sy + Math.sin(sc.ang) * sc.len;

                // Bord cicatriciel rosé/ocre
                ctx.strokeStyle = 'rgba(168, 92, 82, 0.48)';
                ctx.lineWidth = sc.w * 1.9;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(sx, sy);
                ctx.lineTo(ex, ey);
                ctx.stroke();

                // Sillon central rouge sang / cramoisi sombre
                ctx.strokeStyle = 'rgba(115, 22, 20, 0.82)';
                ctx.lineWidth = sc.w;
                ctx.beginPath();
                ctx.moveTo(sx, sy);
                ctx.lineTo(ex, ey);
                ctx.stroke();

                // Entaille profonde dans la bumpMap
                bCtx.strokeStyle = '#181818';
                bCtx.lineWidth = sc.w * 1.5;
                bCtx.lineCap = 'round';
                bCtx.beginPath();
                bCtx.moveTo(sx, sy);
                bCtx.lineTo(ex, ey);
                bCtx.stroke();
            }
        });

        const colorMap = new THREE.CanvasTexture(canvas);
        const bumpMap = new THREE.CanvasTexture(bump);
        colorMap.wrapS = colorMap.wrapT = bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping;
        applySRGB(colorMap);
        return { colorMap, bumpMap };
    }

    // 3. Émail dentaire de théropode : racines sombres tachées de sang/tanin -> pointes ivoire
    function createToothEnamelMaps() {
        const size = 256;
        const canvas = document.createElement('canvas');
        const bump = document.createElement('canvas');
        canvas.width = bump.width = size;
        canvas.height = bump.height = size;
        const ctx = canvas.getContext('2d');
        const bCtx = bump.getContext('2d');

        // V = 0 (haut du canvas / base racine) -> V = 1 (bas du canvas / pointe de la dent)
        const grad = ctx.createLinearGradient(0, 0, 0, size);
        grad.addColorStop(0.00, '#2b0f0c'); // Base gingivale tachée de sang sombre
        grad.addColorStop(0.18, '#5c3820'); // Collet brun-ocre
        grad.addColorStop(0.42, '#9e845c'); // Dentine ambrée
        grad.addColorStop(0.75, '#dfd4b6'); // Émail ivoire
        grad.addColorStop(1.00, '#faf5e6'); // Pointe tranchante éclatante
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, size, size);

        bCtx.fillStyle = '#808080';
        bCtx.fillRect(0, 0, size, size);

        // Cannelures longitudinales d'émail et dentelures (serrations ziphodontes)
        for (let x = 0; x < size; x += 4) {
            ctx.strokeStyle = x % 8 === 0 ? 'rgba(45, 28, 16, 0.16)' : 'rgba(255, 250, 235, 0.14)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, size);
            ctx.stroke();

            bCtx.strokeStyle = x % 8 === 0 ? '#646464' : '#9c9c9c';
            bCtx.lineWidth = 1.8;
            bCtx.beginPath();
            bCtx.moveTo(x, 0);
            bCtx.lineTo(x, size);
            bCtx.stroke();
        }

        const colorMap = new THREE.CanvasTexture(canvas);
        const bumpMap = new THREE.CanvasTexture(bump);
        applySRGB(colorMap);
        return { colorMap, bumpMap };
    }

    // 4. Iris ambre-or volcanique ardent à fibres radiales (comme dans le portrait)
    function createEyeIrisMap() {
        const size = 256;
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = size;
        const ctx = canvas.getContext('2d');
        const cx = size * 0.5;
        const cy = size * 0.5;

        const radGrad = ctx.createRadialGradient(cx, cy, size * 0.08, cx, cy, size * 0.5);
        radGrad.addColorStop(0.00, '#fef08a'); // Anneau pupillaire jaune incandescent
        radGrad.addColorStop(0.32, '#f59e0b'); // Ambre doré vif
        radGrad.addColorStop(0.68, '#ea580c'); // Orange volcanique profond
        radGrad.addColorStop(0.88, '#7c2d12'); // Anneau limbique brun-rouge
        radGrad.addColorStop(1.00, '#1c0a05'); // Sclère périphérique sombre
        ctx.fillStyle = radGrad;
        ctx.fillRect(0, 0, size, size);

        // Fibres stromales radiales de l'iris
        for (let i = 0; i < 140; i++) {
            const a = (i / 140) * Math.PI * 2;
            ctx.strokeStyle = i % 2 === 0 ? 'rgba(254, 240, 138, 0.28)' : 'rgba(69, 10, 10, 0.32)';
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.moveTo(cx + Math.cos(a) * size * 0.10, cy + Math.sin(a) * size * 0.10);
            ctx.lineTo(cx + Math.cos(a) * size * 0.46, cy + Math.sin(a) * size * 0.46);
            ctx.stroke();
        }

        const colorMap = new THREE.CanvasTexture(canvas);
        applySRGB(colorMap);
        return colorMap;
    }

    // 5. Muqueuse buccale humide, papilles linguales et gencives vascularisées
    function createOralMucosaMaps() {
        const size = 512;
        const canvas = document.createElement('canvas');
        const bump = document.createElement('canvas');
        canvas.width = bump.width = size;
        canvas.height = bump.height = size;
        const ctx = canvas.getContext('2d');
        const bCtx = bump.getContext('2d');

        const grad = ctx.createLinearGradient(0, 0, size, size);
        grad.addColorStop(0.00, '#4f1419');
        grad.addColorStop(0.50, '#7d242c');
        grad.addColorStop(1.00, '#59161c');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, size, size);

        bCtx.fillStyle = '#808080';
        bCtx.fillRect(0, 0, size, size);

        // Papilles linguales et plis muqueux humides
        for (let i = 0; i < 9000; i++) {
            const x = rand() * size;
            const y = rand() * size;
            const r = 1.0 + rand() * 2.2;
            const lum = Math.floor(110 + rand() * 60);
            bCtx.fillStyle = `rgb(${lum},${lum},${lum})`;
            bCtx.beginPath();
            bCtx.arc(x, y, r, 0, Math.PI * 2);
            bCtx.fill();

            if (i % 4 === 0) {
                ctx.fillStyle = rand() > 0.5 ? 'rgba(210, 105, 115, 0.12)' : 'rgba(42, 8, 12, 0.16)';
                ctx.beginPath();
                ctx.arc(x, y, r * 1.2, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        const colorMap = new THREE.CanvasTexture(canvas);
        const bumpMap = new THREE.CanvasTexture(bump);
        colorMap.wrapS = colorMap.wrapT = bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping;
        applySRGB(colorMap);
        return { colorMap, bumpMap };
    }

    // 6. Écailles scutellées des pattes et coussinets plantaires
    function createScutePadMaps() {
        const size = 512;
        const canvas = document.createElement('canvas');
        const bump = document.createElement('canvas');
        canvas.width = bump.width = size;
        canvas.height = bump.height = size;
        const ctx = canvas.getContext('2d');
        const bCtx = bump.getContext('2d');

        ctx.fillStyle = '#1d2419';
        ctx.fillRect(0, 0, size, size);
        bCtx.fillStyle = '#808080';
        bCtx.fillRect(0, 0, size, size);

        for (let y = 0; y < size; y += 16) {
            for (let x = 0; x < size; x += 28) {
                const offX = (Math.floor(y / 16) % 2) * 14;
                ctx.fillStyle = 'rgba(56, 68, 46, 0.52)';
                ctx.beginPath();
                ctx.roundRect ? ctx.roundRect(x + offX, y + 2, 24, 12, 4) : ctx.rect(x + offX, y + 2, 24, 12);
                ctx.fill();

                bCtx.fillStyle = '#c4c4c4';
                bCtx.beginPath();
                bCtx.roundRect ? bCtx.roundRect(x + offX, y + 2, 24, 12, 4) : bCtx.rect(x + offX, y + 2, 24, 12);
                bCtx.fill();
            }
        }

        const colorMap = new THREE.CanvasTexture(canvas);
        const bumpMap = new THREE.CanvasTexture(bump);
        colorMap.wrapS = colorMap.wrapT = bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping;
        applySRGB(colorMap);
        return { colorMap, bumpMap };
    }

    _cachedTrexPBRMaps = {
        hideMaps: createBodyHideMaps(),
        craniumMaps: createCraniumKeratinMaps(),
        toothMaps: createToothEnamelMaps(),
        irisMap: createEyeIrisMap(),
        mucosaMaps: createOralMucosaMaps(),
        scuteMaps: createScutePadMaps()
    };
    return _cachedTrexPBRMaps;
}

// Helper compatible Three.js r128+ pour CapsuleGeometry parfaitement fermée sans artefact
function createTrexCapsuleGeometry(radius, length, capSegments = 6, radialSegments = 14) {
    if (THREE.CapsuleGeometry) {
        return new THREE.CapsuleGeometry(radius, length, capSegments, radialSegments);
    }
    const heightSegments = capSegments * 2 + 8;
    const geo = new THREE.PlaneGeometry(1, 1, radialSegments, heightSegments);
    const pos = geo.attributes.position;
    const uvs = geo.attributes.uv;
    const halfLen = length * 0.5;

    let idx = 0;
    for (let iy = 0; iy <= heightSegments; iy++) {
        const v = iy / heightSegments;
        let y = 0;
        let r = radius;

        if (iy <= capSegments) {
            const phi = (iy / capSegments) * (Math.PI * 0.5);
            y = halfLen + Math.cos(phi) * radius;
            r = Math.sin(phi) * radius;
        } else if (iy >= heightSegments - capSegments) {
            const rem = iy - (heightSegments - capSegments);
            const phi = (rem / capSegments) * (Math.PI * 0.5);
            y = -halfLen - Math.sin(phi) * radius;
            r = Math.cos(phi) * radius;
        } else {
            const cylT = (iy - capSegments) / (heightSegments - capSegments * 2);
            y = halfLen - cylT * length;
            r = radius;
        }

        for (let ix = 0; ix <= radialSegments; ix++) {
            const u = ix / radialSegments;
            const theta = u * Math.PI * 2;
            pos.setXYZ(idx, Math.sin(theta) * r, y, Math.cos(theta) * r);
            uvs.setXY(idx, u, v);
            idx++;
        }
    }
    geo.computeVertexNormals();
    return geo;
}

registerFighter({
    id: 'trex',
    name: 'T-REX',
    fullName: 'Tyrannosaurus Rex',
    role: 'Apex Carnivore',
    title: '« Le Roi Sanglant du Crétacé »',
    primaryColor: 0xd92626,
    secondaryColor: 0x18181b,
    accentColor: 0xf59e0b,
    cssPrimary: '#dc2626',
    scale: 1.10,
    previewScale: 0.92,
    stats: { pow: 96, spd: 72, def: 85 },
    maxHp: 1050,
    walkSpeed: 7.8,
    special1Name: 'Morsure Sismique (H)',
    special2Name: 'Rugissement de Magma (T)',
    fatalityName: 'Dévoration Royale (R)',
    moveStyle: 'Foulée bipède lourde sur membres digitigrades, morsure broyeuse d’os à 12 800 PSI, piétinement sismique et balayage caudal rotatif.',
    fatalityDesc: 'Saisit la victime dans ses mâchoires géantes, la secoue violemment, arrache la tête et l’avale dans une gerbe de sang.',
    skins: [
        { name: 'Volcanic Crimson Tyrant', primary: 0xd92626, secondary: 0x18181b, accent: 0xf59e0b, belly: 0xfbbf24, isDefaultPBR: true }
    ]
}, {
    animBaseHipsY: 2.1,
    attackReach: 3.95,

    onSpecial2(attacker, defender, dist, basePow) {
        spawn3DProjectile(attacker, 'boulder');
    },

    // Construction du modèle 3D paléontologique articulé conçu avec Blender 5.2 et le portrait de référence
    buildRig(ctx) {
        const { hips, rig, skin, skinMeshes } = ctx;
        const { hideMaps, craniumMaps, toothMaps, irisMap, mucosaMaps, scuteMaps } = getTrexPBRMaps();

        const isDefaultSkin = Boolean(skin && skin.isDefaultPBR);
        const hideTint = isDefaultSkin ? 0xffffff : (skin.primary || 0xffffff);
        const skullTint = isDefaultSkin ? 0xffffff : (skin.primary || 0xffffff);
        const hornTint = isDefaultSkin ? 0xf59e0b : (skin.secondary || 0x18181b);

        // =====================================================================
        // 1. PALETTE DE MATÉRIAUX PHYSIQUEMENT BASÉS (PBR)
        // =====================================================================
        const materials = {
            bodyHide: new THREE.MeshStandardMaterial({
                color: hideTint,
                map: hideMaps.colorMap,
                bumpMap: hideMaps.bumpMap,
                bumpScale: 0.028,
                roughness: 0.68,
                metalness: 0.04
            }),
            skullKeratin: new THREE.MeshPhysicalMaterial({
                color: skullTint,
                map: craniumMaps.colorMap,
                bumpMap: craniumMaps.bumpMap,
                bumpScale: 0.036,
                roughness: 0.48,
                metalness: 0.05,
                clearcoat: 0.28,
                clearcoatRoughness: 0.32
            }),
            hornBoss: new THREE.MeshPhysicalMaterial({
                color: hornTint,
                bumpMap: craniumMaps.bumpMap,
                bumpScale: 0.034,
                roughness: 0.38,
                metalness: 0.06,
                clearcoat: 0.38,
                clearcoatRoughness: 0.26
            }),
            gingiva: new THREE.MeshPhysicalMaterial({
                color: 0x7a1f26,
                map: mucosaMaps.colorMap,
                bumpMap: mucosaMaps.bumpMap,
                bumpScale: 0.014,
                roughness: 0.16,
                metalness: 0.02,
                clearcoat: 0.92,
                clearcoatRoughness: 0.08
            }),
            oralMucosa: new THREE.MeshPhysicalMaterial({
                color: 0x8f2c34,
                map: mucosaMaps.colorMap,
                bumpMap: mucosaMaps.bumpMap,
                bumpScale: 0.018,
                roughness: 0.20,
                metalness: 0.02,
                clearcoat: 0.86,
                clearcoatRoughness: 0.12,
                side: THREE.DoubleSide
            }),
            toothEnamel: new THREE.MeshPhysicalMaterial({
                color: 0xffffff,
                map: toothMaps.colorMap,
                bumpMap: toothMaps.bumpMap,
                bumpScale: 0.010,
                roughness: 0.16,
                metalness: 0.02,
                clearcoat: 0.85,
                clearcoatRoughness: 0.10
            }),
            saliva: new THREE.MeshPhysicalMaterial({
                color: 0xeef6f8,
                transparent: true,
                opacity: 0.48,
                roughness: 0.03,
                metalness: 0.0,
                clearcoat: 1.0,
                clearcoatRoughness: 0.02
            }),
            scalyPad: new THREE.MeshStandardMaterial({
                color: isDefaultSkin ? 0xffffff : (skin.secondary || 0x1a2216),
                map: scuteMaps.colorMap,
                bumpMap: scuteMaps.bumpMap,
                bumpScale: 0.026,
                roughness: 0.58,
                metalness: 0.04
            }),
            claw: new THREE.MeshPhysicalMaterial({
                color: 0x12100e,
                roughness: 0.20,
                clearcoat: 0.64,
                clearcoatRoughness: 0.18
            }),
            darkCavity: new THREE.MeshBasicMaterial({ color: 0x060806 }),
            eyeIris: new THREE.MeshStandardMaterial({
                color: skin && !isDefaultSkin && skin.accent ? skin.accent : 0xffffff,
                map: irisMap,
                emissive: skin && !isDefaultSkin && skin.accent ? skin.accent : 0xd97706,
                emissiveMap: irisMap,
                emissiveIntensity: 0.48,
                roughness: 0.12
            }),
            eyeCornea: new THREE.MeshPhysicalMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.26,
                roughness: 0.02,
                metalness: 0.0,
                clearcoat: 1.0,
                clearcoatRoughness: 0.02
            }),
            eyePupil: new THREE.MeshBasicMaterial({ color: 0x040404 }),
            boneXray: new THREE.MeshStandardMaterial({
                color: 0xf8fafc,
                emissive: 0x38bdf8,
                emissiveIntensity: 0.42,
                roughness: 0.22
            })
        };

        // Synchroniser rig.bodyMat pour le flash d'impact en combat
        rig.bodyMat = materials.bodyHide;

        const skeletonMeshes = [];

        function registerSkin(mesh) {
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            skinMeshes.push(mesh);
            return mesh;
        }

        function createBoneVisual(p1, p2, radius = 0.045) {
            const dist = p1.distanceTo(p2);
            const geo = new THREE.CylinderGeometry(radius * 0.74, radius, dist, 10);
            geo.translate(0, dist / 2, 0);
            geo.rotateX(Math.PI / 2);
            const mesh = new THREE.Mesh(geo, materials.boneXray);
            mesh.position.copy(p1);
            mesh.lookAt(p2);
            mesh.visible = false;
            skeletonMeshes.push(mesh);
            return mesh;
        }

        // Helper sculptant un croc de Tyrannosaure recourbé (profil ziphodonte en D, racine tachée -> pointe ivoire)
        function createCurvedToothMesh(radius, length, isUpper = true, radialSegs = 10, heightSegs = 10) {
            const signY = isUpper ? -1.0 : 1.0;
            const curve = new THREE.CatmullRomCurve3([
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(0, signY * length * 0.42, -length * 0.05),
                new THREE.Vector3(0, signY * length * 0.82, -length * 0.14),
                new THREE.Vector3(0, signY * length, -length * 0.22)
            ]);
            const geo = new THREE.PlaneGeometry(1, 1, radialSegs, heightSegs);
            const pos = geo.attributes.position;
            const uvs = geo.attributes.uv;
            const pt = new THREE.Vector3();

            let idx = 0;
            for (let iy = 0; iy <= heightSegs; iy++) {
                const v = iy / heightSegs;
                curve.getPoint(v, pt);
                const r = (iy === heightSegs) ? 0.0008 : radius * (1.0 - Math.pow(v, 1.32));

                for (let ix = 0; ix <= radialSegs; ix++) {
                    const u = ix / radialSegs;
                    const ang = u * Math.PI * 2;
                    const lx = Math.sin(ang) * r * 0.76;
                    const lz = Math.cos(ang) * r * 1.15;
                    pos.setXYZ(idx, pt.x + lx, pt.y, pt.z + lz);
                    // En Three.js PlaneGeometry, v=0 est en haut (racine) et v=1 en bas (pointe)
                    uvs.setXY(idx, u, 1.0 - v);
                    idx++;
                }
            }
            geo.computeVertexNormals();
            const mesh = new THREE.Mesh(geo, materials.toothEnamel);
            mesh.castShadow = true;
            return mesh;
        }

        // Helper sculptant un segment musculaire fermé avec capsules articulaires sphériques
        function createMuscularSegment(length, axis, profileFn, material, proxOverlap = 0.14, distOverlap = 0.14) {
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
                if (v < 0.16) {
                    capFactor = Math.sin((v / 0.16) * (Math.PI * 0.5));
                } else if (v > 0.84) {
                    capFactor = Math.sin(((1.0 - v) / 0.16) * (Math.PI * 0.5));
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

                    uvs.setXY(idx, u, v);
                    idx++;
                }
            }

            geo.computeVertexNormals();
            return registerSkin(new THREE.Mesh(geo, material));
        }

        hips.position.y = 2.1;

        // Groupe racine du modèle paléontologique (+Z du modèle = +X avant dans le repère du jeu)
        const trex = new THREE.Group();
        trex.position.set(0, -2.1, 0);
        trex.rotation.y = Math.PI / 2;
        rig.torso.add(trex);

        const rootJoint = new THREE.Group();
        rootJoint.position.set(0, 2.1, 0);
        trex.add(rootJoint);

        const torsoGroup = new THREE.Group();
        rootJoint.add(torsoGroup);

        // Nœuds mandataires standardisés pour la compatibilité ColliderRig & CombatReactions
        rig.neck.position.set(1.02, 0.42, 0);
        rig.torso.add(rig.neck);

        const armProxyL = new THREE.Group();
        const armProxyR = new THREE.Group();
        rig.torso.add(armProxyL, armProxyR);
        rig.arms.push(armProxyL, armProxyR);

        const legProxyL = new THREE.Group();
        const legProxyR = new THREE.Group();
        hips.add(legProxyL, legProxyR);
        rig.legs.push(legProxyL, legProxyR);

        let parentTailProxy = rig.torso;
        for (let s = 0; s < 4; s++) {
            const tProxy = new THREE.Group();
            tProxy.position.set(s === 0 ? -1.05 : -0.90, s === 0 ? 0.22 : 0, 0);
            parentTailProxy.add(tProxy);
            rig.tailSegments.push(tProxy);
            parentTailProxy = tProxy;
        }

        // =====================================================================
        // 2A. RIG SQUELETTIQUE : 6 VERTÈBRES CAUDALES, BASSIN, THORAX & 5 CERVICALES EN S
        // =====================================================================
        const caudalSegments = [];
        const caudalLengths = [0.64, 0.62, 0.60, 0.58, 0.54, 0.50];
        const caudalRadiiX = [0.40, 0.32, 0.24, 0.17, 0.11, 0.055];
        const caudalRadiiY = [0.46, 0.37, 0.28, 0.20, 0.13, 0.065];

        let parentCaudal = torsoGroup;
        for (let i = 0; i < caudalLengths.length; i++) {
            const seg = new THREE.Group();
            if (i === 0) {
                seg.position.set(0, 0.18, -0.78);
            } else {
                seg.position.set(0, 0, -caudalLengths[i - 1]);
            }
            parentCaudal.add(seg);
            caudalSegments.push(seg);

            const tBone = createBoneVisual(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -caudalLengths[i]), 0.052 - i * 0.006);
            seg.add(tBone);
            parentCaudal = seg;
        }

        const tailTipNode = new THREE.Group();
        tailTipNode.position.set(0, 0.0, -caudalLengths[caudalLengths.length - 1]);
        parentCaudal.add(tailTipNode);

        // Nœuds anatomiques du bassin, de l'abdomen et de la cage thoracique
        const pelvisRearNode = new THREE.Group();
        pelvisRearNode.position.set(0, 0.19, -0.72);
        torsoGroup.add(pelvisRearNode);

        const hipsCenterNode = new THREE.Group();
        hipsCenterNode.position.set(0, 0.18, -0.32);
        torsoGroup.add(hipsCenterNode);

        const lumbarNode = new THREE.Group();
        lumbarNode.position.set(0, 0.15, 0.14);
        torsoGroup.add(lumbarNode);

        const thoraxNode = new THREE.Group();
        thoraxNode.position.set(0, 0.15, 0.56);
        torsoGroup.add(thoraxNode);

        const chestFrontNode = new THREE.Group();
        chestFrontNode.position.set(0, 0.22, 0.94);
        torsoGroup.add(chestFrontNode);

        // Squelette interne X-Ray : colonne dorsale, botte pubienne & côtes thoraciques
        torsoGroup.add(createBoneVisual(new THREE.Vector3(0, 0.24, -0.78), new THREE.Vector3(0, 0.28, 1.02), 0.075));
        torsoGroup.add(createBoneVisual(new THREE.Vector3(0, 0.22, -0.35), new THREE.Vector3(0, -0.52, -0.12), 0.048));
        for (let r = 0; r < 9; r++) {
            const ribSpan = 0.50 - Math.abs(r - 3.5) * 0.042;
            const ribGeo = new THREE.TorusGeometry(ribSpan, 0.022, 8, 22, Math.PI * 1.42);
            ribGeo.rotateY(Math.PI);
            ribGeo.rotateZ(Math.PI * 0.29);
            const rib = new THREE.Mesh(ribGeo, materials.boneXray);
            rib.position.set(0, 0.16, 0.85 - r * 0.16);
            rib.visible = false;
            skeletonMeshes.push(rib);
            torsoGroup.add(rib);
        }

        // 5 vertèbres cervicales articulées (cou musclé en S de Tyrannosaurus)
        const neckSegments = [];
        const numNeckVerts = 5;
        const neckSegLen = 0.21;
        let parentNeck = torsoGroup;

        for (let i = 0; i < numNeckVerts; i++) {
            const segGroup = new THREE.Group();
            if (i === 0) {
                segGroup.position.set(0, 0.25, 0.94);
            } else {
                segGroup.position.set(0, 0, neckSegLen);
            }
            parentNeck.add(segGroup);
            neckSegments.push(segGroup);

            const cBone = createBoneVisual(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, neckSegLen), 0.062 - i * 0.003);
            segGroup.add(cBone);
            parentNeck = segGroup;
        }

        // Adaptateur d'axe pour que rig.headGroup (Bone_Head) ait +X vers l'avant et rotation.z en tangage
        const headAdapter = new THREE.Group();
        headAdapter.position.set(0, 0, neckSegLen);
        headAdapter.rotation.y = -Math.PI / 2;
        parentNeck.add(headAdapter);

        rig.headGroup.position.set(0, 0, 0);
        rig.headGroup.rotation.set(0, 0, 0);
        headAdapter.add(rig.headGroup);

        const headGroup = new THREE.Group();
        headGroup.rotation.y = Math.PI / 2;
        rig.headGroup.add(headGroup);

        // Nœuds d'ancrage et de fermeture du cou à l'intérieur de l'occiput du crâne
        const skullBaseNode = new THREE.Group();
        skullBaseNode.position.set(0, 0.14, 0.06);
        headGroup.add(skullBaseNode);

        const skullCapNode = new THREE.Group();
        skullCapNode.position.set(0, 0.15, 0.22);
        headGroup.add(skullCapNode);

        // =====================================================================
        // 2B. MAILLAGE CORPOREL, CAUDAL & CERVICAL CONTINU (SPLINE CATMULL-ROM)
        //     Avec triple rangée d'ostéodermes dorsaux/nucaux et plis gulaires du cou
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
            { node: tailTipNode, rx: 0.002, ry: 0.002, yOff: 0.0 },
            ...caudalSpineNodes,
            { node: pelvisRearNode, rx: 0.44, ry: 0.52, yOff: 0.02 },
            { node: hipsCenterNode, rx: 0.50, ry: 0.62, yOff: 0.04 },   // Ilion & bassin
            { node: lumbarNode, rx: 0.58, ry: 0.68, yOff: -0.02 },      // Flancs
            { node: thoraxNode, rx: 0.58, ry: 0.66, yOff: -0.04 },      // Cage thoracique & gastralia
            { node: chestFrontNode, rx: 0.42, ry: 0.46, yOff: 0.02 },   // Ceinture pectorale relevée (dégage les bras)
            ...neckSegments.map((seg, i) => ({
                node: seg,
                rx: 0.38 - i * 0.016,
                ry: 0.43 - i * 0.018,
                yOff: i >= 1 && i <= 3 ? 0.02 : 0.0
            })),
            { node: skullBaseNode, rx: 0.26, ry: 0.26, yOff: 0.0 },     // Rentre proprement dans l'arrière-crâne
            { node: skullCapNode, rx: 0.002, ry: 0.002, yOff: 0.0 }     // Capuchon fermé à l'intérieur du crâne
        ];

        const tubeRings = 68;
        const tubeSides = 38;
        const seamlessBodyGeo = new THREE.PlaneGeometry(1, 1, tubeSides, tubeRings - 1);
        const seamlessBodyMesh = registerSkin(new THREE.Mesh(seamlessBodyGeo, materials.bodyHide));
        trex.add(seamlessBodyMesh);

        const _wp = new THREE.Vector3();
        const _up = new THREE.Vector3();
        const _right = new THREE.Vector3();
        const _tangent = new THREE.Vector3();
        const _quat = new THREE.Quaternion();
        const _qTrexInv = new THREE.Quaternion();

        function updateContinuousBodySkin(breathPhase) {
            const centers = [];
            const upVectors = [];
            const radiiX = [];
            const radiiY = [];

            trex.getWorldQuaternion(_qTrexInv).invert();

            for (let i = 0; i < bodySpineNodes.length; i++) {
                const item = bodySpineNodes[i];
                item.node.getWorldPosition(_wp);
                const localPos = trex.worldToLocal(_wp.clone());

                item.node.getWorldQuaternion(_quat);
                _quat.premultiply(_qTrexInv);
                _up.set(0, 1, 0).applyQuaternion(_quat).normalize();

                let breathBoost = 0;
                if (i === 9 || i === 10) breathBoost = Math.sin(breathPhase) * 0.024;
                else if (i === 11) breathBoost = Math.sin(breathPhase) * 0.014;

                localPos.addScaledVector(_up, item.yOff);
                centers.push(localPos);
                upVectors.push(_up.clone());
                radiiX.push(item.rx + breathBoost);
                radiiY.push(item.ry + breathBoost * 1.2);
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

                for (let s = 0; s <= tubeSides; s++) {
                    const u = s / tubeSides;
                    const theta = u * Math.PI * 2;
                    const cosT = Math.cos(theta);
                    const sinT = Math.sin(theta);
                    const absSin = Math.abs(sinT);

                    let xFactor = sinT * rx;
                    let yFactor = cosT * ry;

                    // Triple rangée d'ostéodermes cuirassés (crête médiane + rangées paravertébrales visibles sur le cou du portrait)
                    if (cosT > 0.52) {
                        const scuteWave = 0.5 + 0.5 * Math.cos(t * Math.PI * 46.0);
                        if (absSin < 0.22) {
                            const medArch = 1.0 - absSin / 0.22;
                            yFactor += medArch * (0.048 + 0.042 * scuteWave) * ry * spineEnvelope;
                        } else if (absSin > 0.26 && absSin < 0.64) {
                            const latArch = Math.sin(((absSin - 0.26) / 0.38) * Math.PI);
                            yFactor += latArch * (0.032 + 0.028 * scuteWave) * ry * spineEnvelope;
                            xFactor += Math.sign(sinT) * latArch * 0.024 * scuteWave * rx * spineEnvelope;
                        }
                    }

                    // Galbe musculaire du M. caudofemoralis à la base de la queue et des flancs
                    if (t > 0.24 && t < 0.68 && absSin > 0.55) {
                        xFactor *= 1.06;
                    }

                    // Plis gulaires profonds sous la gorge et le cou musclé (t = 0.68..0.95, cosT < -0.25)
                    if (t > 0.68 && t < 0.95 && cosT < -0.25) {
                        const throatFolds = 1.0 + 0.065 * Math.sin(t * Math.PI * 34.0);
                        yFactor *= 1.12 * throatFolds;
                    } else if (t > 0.44 && t < 0.66 && cosT < -0.55) {
                        yFactor *= 1.06;
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
        // 2C. CRÂNE BRACHYROSTRE SCULPTÉ AVEC BLENDER 5.2 (FIDÈLE AU PORTRAIT)
        //     Doubles crêtes sourcilières/lacrymales blindées d'ostéodermes surplombant
        //     l'orbite avec sillon crânien médian, gros renflement maxillaire balafré,
        //     fosse narinaire oblique profonde, bord labial festonné, palais muqueux,
        //     gencives festonnées humides et crocs recourbés à racines tachées.
        // =====================================================================
        function buildSculptedSkull() {
            const slices = [
                { z: -0.14, topY: 0.14, botY: -0.10, halfW: 0.002 }, // Capuchon occipital fermé
                { z: -0.04, topY: 0.38, botY: -0.20, halfW: 0.38  }, // Occiput & tempes larges
                { z: 0.10,  topY: 0.42, botY: -0.22, halfW: 0.46  }, // Quadratojugal profond fermant la commissure
                { z: 0.28,  topY: 0.43, botY: -0.17, halfW: 0.44  }, // Région postorbitaire / supraorbitaire
                { z: 0.46,  topY: 0.40, botY: -0.11, halfW: 0.34  }, // Rétrécissement pré-orbitaire (lacrimal)
                { z: 0.68,  topY: 0.41, botY: -0.14, halfW: 0.33  }, // Gros renflement maxillaire & voûte nasale
                { z: 0.90,  topY: 0.39, botY: -0.12, halfW: 0.29  }, // Milieu du museau profond
                { z: 1.08,  topY: 0.34, botY: -0.09, halfW: 0.25  }, // Région narinaire large
                { z: 1.22,  topY: 0.23, botY: -0.06, halfW: 0.18  }, // Prémaxillaire en U massif et émoussé
                { z: 1.30,  topY: 0.05, botY: 0.03,  halfW: 0.002 }  // Extrémité rostrale fermée
            ];

            const radialSteps = 60;
            const lengthSteps = 76;
            const geo = new THREE.PlaneGeometry(1, 1, radialSteps, lengthSteps);
            const pos = geo.attributes.position;
            const uvs = geo.attributes.uv;

            const topCurve = new THREE.CatmullRomCurve3(slices.map(s => new THREE.Vector3(s.halfW, s.topY, s.z)));
            const botCurve = new THREE.CatmullRomCurve3(slices.map(s => new THREE.Vector3(s.halfW, s.botY, s.z)));

            function getLipFestoon(v) {
                return -0.036 * Math.exp(-Math.pow((v - 0.56) / 0.14, 2)) +
                        0.026 * Math.exp(-Math.pow((v - 0.38) / 0.07, 2));
            }

            let idx = 0;
            for (let iy = 0; iy <= lengthSteps; iy++) {
                const v = iy / lengthSteps;
                const pTop = topCurve.getPoint(v);
                const pBot = botCurve.getPoint(v);
                const halfW = Math.max(0.001, pTop.x);
                const topY = pTop.y;
                const z = pTop.z;
                const botY = pBot.y + getLipFestoon(v);

                const browProfile = Math.exp(-Math.pow((v - 0.34) / 0.10, 2));
                const orbitProfile = Math.exp(-Math.pow((v - 0.35) / 0.058, 2));
                const jugalProfile = Math.exp(-Math.pow((v - 0.23) / 0.09, 2));
                const maxSwell = Math.exp(-Math.pow((v - 0.55) / 0.12, 2));
                const nasalProfile = (v > 0.36 && v < 0.84) ? Math.sin(((v - 0.36) / 0.48) * Math.PI) : 0;

                for (let ix = 0; ix <= radialSteps; ix++) {
                    const u = ix / radialSteps;
                    const angle = u * Math.PI * 2;
                    const s = Math.sin(angle);
                    const c = Math.cos(angle);
                    const absS = Math.abs(s);
                    const signS = s >= 0 ? 1.0 : -1.0;

                    let x = signS * Math.pow(absS, 0.68) * halfW;
                    let y;
                    if (c >= 0) {
                        y = botY + (topY - botY) * Math.pow(c, 0.64);

                        // Doubles crêtes sourcilières/lacrymales blindées d'ostéodermes surplombant l'orbite
                        if (browProfile > 0.01 && c > 0.28 && c < 0.90) {
                            const browArch = Math.sin(((c - 0.28) / 0.62) * Math.PI);
                            const scuteBoss = 0.72 + 0.28 * Math.cos(v * Math.PI * 22.0);
                            y += browProfile * browArch * 0.120 * scuteBoss;
                            x += signS * browProfile * browArch * 0.105 * scuteBoss;
                        }

                        // Sillon crânien médian entre les deux crêtes sourcilières (visible de 3/4 dans le portrait)
                        if (browProfile > 0.01 && c >= 0.86) {
                            const trough = Math.pow((c - 0.86) / 0.14, 1.5);
                            y -= browProfile * trough * 0.040;
                        }

                        // Crête nasale médiane bosselée d'ostéodermes sur le sommet du museau
                        if (nasalProfile > 0 && c > 0.74) {
                            const nasalBumps = 0.55 + 0.45 * Math.cos(v * Math.PI * 16.0);
                            y += Math.pow((c - 0.74) / 0.26, 1.4) * 0.052 * nasalProfile * nasalBumps;
                        }
                    } else {
                        const rimFactor = Math.pow(absS, 1.65);
                        y = botY * rimFactor + (botY + 0.048 * (1 - Math.pow(v - 0.5, 2))) * (1 - rimFactor);
                    }

                    // Sillon pré-orbitaire séparant le gros renflement maxillaire de la loge orbitaire
                    const crease = Math.exp(-Math.pow((v - 0.43) / 0.035, 2)) * Math.exp(-Math.pow((c - 0.08) / 0.28, 2));
                    x *= (1.0 - 0.22 * crease);

                    // Gros renflement maxillaire arrondi et balafré devant l'œil (signature du portrait !)
                    if (maxSwell > 0.01 && c > -0.32 && c < 0.46) {
                        const mArch = Math.sin(((c + 0.32) / 0.78) * Math.PI);
                        x += signS * maxSwell * mArch * 0.092;
                        y += maxSwell * mArch * 0.020;
                    }

                    // Loge orbitaire profondément excavée juste sous le surplomb de l'arcade sourcilière
                    if (orbitProfile > 0.01 && c > 0.04 && c < 0.46) {
                        const orbDepth = Math.sin(((c - 0.04) / 0.42) * Math.PI);
                        x *= (1.0 - 0.34 * orbitProfile * orbDepth);
                    }

                    // Plis palpébraux concentriques ridés sous l'orbite
                    if (orbitProfile > 0.01 && c > -0.18 && c <= 0.06) {
                        const wrinkle = 0.5 + 0.5 * Math.cos(((c + 0.18) / 0.24) * Math.PI * 4.0);
                        x += signS * orbitProfile * (0.018 + 0.016 * wrinkle);
                    }

                    // Fosse narinaire oblique profonde avec capuchon charnu supérieur
                    const narisU = (v - 0.80) / 0.052;
                    const narisV = (c - (0.36 - (v - 0.80) * 1.8)) / 0.14;
                    const narisDist2 = narisU * narisU + narisV * narisV;
                    if (narisDist2 < 1.0) {
                        const nDepth = Math.pow(1.0 - narisDist2, 1.5);
                        x *= (1.0 - 0.42 * nDepth);
                    } else if (narisDist2 >= 1.0 && narisDist2 < 2.2 && narisV > 0) {
                        const hood = Math.sin(((narisDist2 - 1.0) / 1.2) * Math.PI);
                        x += signS * 0.024 * hood;
                        y += 0.018 * hood;
                    }

                    // Pommettes jugales et quadratojugales évasées à écailles en pavés
                    if (jugalProfile > 0.01 && c < -0.02 && c > -0.88) {
                        const jArch = Math.sin(((Math.abs(c) - 0.02) / 0.86) * Math.PI);
                        const cobble = 0.78 + 0.22 * Math.cos(v * Math.PI * 24.0) * Math.sin(angle * 16.0);
                        x += signS * jugalProfile * jArch * 0.090 * cobble;
                        y -= jugalProfile * jArch * 0.038 * cobble;
                    }

                    pos.setXYZ(idx, x, y, z);
                    uvs.setXY(idx, v, u);
                    idx++;
                }
            }
            geo.computeVertexNormals();
            const skullMesh = registerSkin(new THREE.Mesh(geo, materials.skullKeratin));
            headGroup.add(skullMesh);

            // Gencive supérieure festonnée humide & voûte palatine interne (visible gueule ouverte comme dans le portrait)
            const gumRSteps = 22;
            const gumLSteps = 32;
            const gumGeo = new THREE.PlaneGeometry(1, 1, gumRSteps, gumLSteps);
            const gPos = gumGeo.attributes.position;
            const gUvs = gumGeo.attributes.uv;
            let gIdx = 0;
            for (let iy = 0; iy <= gumLSteps; iy++) {
                const v = iy / gumLSteps;
                const tv = 0.30 + v * 0.65;
                const pTop = topCurve.getPoint(tv);
                const pBot = botCurve.getPoint(tv);
                const by = pBot.y + getLipFestoon(tv);
                const hw = pTop.x * 0.77;
                const scallop = 0.008 * Math.abs(Math.sin(v * Math.PI * 10.0));

                for (let ix = 0; ix <= gumRSteps; ix++) {
                    const u = ix / gumRSteps;
                    const ang = u * Math.PI * 2;
                    const gx = Math.sin(ang) * hw;
                    const gy = by + 0.016 + Math.cos(ang) * (0.028 + scallop);
                    gPos.setXYZ(gIdx, gx, gy, pTop.z);
                    gUvs.setXY(gIdx, u, v);
                    gIdx++;
                }
            }
            gumGeo.computeVertexNormals();
            headGroup.add(registerSkin(new THREE.Mesh(gumGeo, materials.gingiva)));

            // Dentition supérieure : 4 incisives prémaxillaires + 10 paires de crocs maxillaires recourbés à racines tachées
            for (let p = 0; p < 4; p++) {
                const px = (p - 1.5) * 0.040;
                const tMesh = createCurvedToothMesh(0.014, 0.072, true);
                tMesh.position.set(px, -0.038, 1.22);
                tMesh.rotation.x = 0.08;
                headGroup.add(tMesh);
            }

            const maxTeethSpec = [
                { v: 0.36, len: 0.072, r: 0.015 },
                { v: 0.43, len: 0.105, r: 0.020 },
                { v: 0.50, len: 0.140, r: 0.027 },
                { v: 0.57, len: 0.162, r: 0.031 }, // Géants crocs broyeurs d'os
                { v: 0.64, len: 0.148, r: 0.029 },
                { v: 0.71, len: 0.125, r: 0.025 },
                { v: 0.77, len: 0.108, r: 0.021 },
                { v: 0.83, len: 0.092, r: 0.018 },
                { v: 0.88, len: 0.080, r: 0.016 },
                { v: 0.93, len: 0.068, r: 0.014 }
            ];

            maxTeethSpec.forEach(spec => {
                const pTop = topCurve.getPoint(spec.v);
                const pBot = botCurve.getPoint(spec.v);
                const xOff = pTop.x * 0.76;
                const yRoot = pBot.y + getLipFestoon(spec.v) + 0.015;
                const zPos = pTop.z;

                [-1, 1].forEach(side => {
                    const tooth = createCurvedToothMesh(spec.r, spec.len, true);
                    tooth.position.set(side * xOff, yRoot, zPos);
                    tooth.rotation.set(0.04, 0, side * 0.04);
                    headGroup.add(tooth);
                });
            });

            headGroup.add(createBoneVisual(new THREE.Vector3(0, 0.16, 0.0), new THREE.Vector3(0, 0.12, 1.24), 0.065));
        }
        buildSculptedSkull();

        // Yeux ardents à pupille fendue verticale logés sous l'arcade sourcilière surplombante
        const eyelids = [];
        const catchlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        [-1, 1].forEach(side => {
            const eyeSocket = new THREE.Group();
            eyeSocket.position.set(side * 0.312, 0.210, 0.33);
            eyeSocket.rotation.y = side * 1.04;
            eyeSocket.rotation.x = 0.06;
            headGroup.add(eyeSocket);

            // Ombre profonde de la cavité orbitaire
            const socketShadow = new THREE.Mesh(new THREE.SphereGeometry(0.056, 14, 14), materials.darkCavity);
            socketShadow.scale.set(1.12, 0.92, 0.62);
            socketShadow.position.set(0, 0, -0.010);
            eyeSocket.add(socketShadow);

            // Repli palpébral inférieur ridé
            const lowerLid = registerSkin(new THREE.Mesh(
                new THREE.SphereGeometry(0.050, 14, 10, 0, Math.PI * 2, Math.PI * 0.52, Math.PI * 0.48),
                materials.hornBoss
            ));
            lowerLid.position.set(0, -0.004, 0.006);
            lowerLid.rotation.x = 0.18;
            eyeSocket.add(lowerLid);

            // Iris ambre-or volcanique à fibres radiales
            const iris = new THREE.Mesh(new THREE.SphereGeometry(0.044, 20, 20), materials.eyeIris);
            iris.position.set(0, 0, 0.008);
            eyeSocket.add(iris);

            // Pupille fendue verticale de prédateur
            const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.026, 14, 14), materials.eyePupil);
            pupil.scale.set(0.36, 1.32, 0.55);
            pupil.position.set(0, 0, 0.036);
            eyeSocket.add(pupil);

            // Éclat spéculaire (catchlight) donnant vie au regard
            const catchlight = new THREE.Mesh(new THREE.SphereGeometry(0.008, 8, 8), catchlightMat);
            catchlight.position.set(side * -0.010, 0.013, 0.049);
            eyeSocket.add(catchlight);

            // Cornée réfractive brillante
            const cornea = new THREE.Mesh(new THREE.SphereGeometry(0.047, 18, 18), materials.eyeCornea);
            cornea.position.set(0, 0, 0.008);
            eyeSocket.add(cornea);

            // Paupière supérieure mobile (clignement & froncement agressif sous l'arcade sourcilière)
            const lidGeo = new THREE.SphereGeometry(0.050, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.52);
            const lid = registerSkin(new THREE.Mesh(lidGeo, materials.hornBoss));
            lid.position.set(0, 0, 0.008);
            lid.rotation.x = -Math.PI * 0.44;
            eyeSocket.add(lid);
            eyelids.push(lid);
        });

        // =====================================================================
        // 2D. MANDIBULE À MENTON MASSIF, GENCIVES, LANGUE SILLONNÉE,
        //     MEMBRANES D'ADDUCTEURS ET FILETS DE BAVE DYNAMIQUES (PORTRAIT)
        // =====================================================================
        const jawAdapter = new THREE.Group();
        jawAdapter.position.set(0, -0.10, 0.10);
        jawAdapter.rotation.y = -Math.PI / 2;
        headGroup.add(jawAdapter);

        rig.jaw.position.set(0, 0, 0);
        rig.jaw.rotation.set(0, 0, 0);
        jawAdapter.add(rig.jaw);

        const jawGroup = new THREE.Group();
        jawGroup.rotation.y = Math.PI / 2;
        rig.jaw.add(jawGroup);

        function buildSculptedMandible() {
            // Mandibule à surangulaire profond et symphyse mentonnière massive relevée (comme dans le portrait)
            const mSlices = [
                { z: -0.10, topY:  0.04, botY: -0.08, halfW: 0.002 },
                { z: -0.02, topY:  0.10, botY: -0.22, halfW: 0.36  }, // Apophyse coronoïde / surangulaire fermant la charnière
                { z: 0.16,  topY:  0.08, botY: -0.28, halfW: 0.38  },
                { z: 0.38,  topY:  0.02, botY: -0.23, halfW: 0.28  },
                { z: 0.62,  topY:  0.01, botY: -0.20, halfW: 0.23  },
                { z: 0.88,  topY:  0.02, botY: -0.22, halfW: 0.20  }, // Menton dentaire lourd et profond !
                { z: 1.06,  topY:  0.04, botY: -0.19, halfW: 0.15  },
                { z: 1.16,  topY:  0.03, botY: -0.11, halfW: 0.09  },
                { z: 1.21,  topY: -0.01, botY: -0.03, halfW: 0.002 }
            ];

            const rSteps = 40;
            const lSteps = 48;
            const geo = new THREE.PlaneGeometry(1, 1, rSteps, lSteps);
            const pos = geo.attributes.position;
            const uvs = geo.attributes.uv;
            const curve = new THREE.CatmullRomCurve3(mSlices.map(s => new THREE.Vector3(s.halfW, s.botY, s.z)));
            const topCurve = new THREE.CatmullRomCurve3(mSlices.map(s => new THREE.Vector3(s.halfW, s.topY, s.z)));

            let idx = 0;
            for (let iy = 0; iy <= lSteps; iy++) {
                const v = iy / lSteps;
                const pt = curve.getPoint(v);
                const ptTop = topCurve.getPoint(v);
                const halfW = Math.max(0.001, pt.x);
                const botY = pt.y;
                const topY = ptTop.y;
                const z = pt.z;

                for (let ix = 0; ix <= rSteps; ix++) {
                    const u = ix / rSteps;
                    const angle = u * Math.PI * 2;
                    const s = Math.sin(angle);
                    const c = Math.cos(angle);
                    const absS = Math.abs(s);

                    const x = Math.sign(s) * Math.pow(absS, 0.72) * halfW;
                    let y;
                    if (c <= 0) {
                        const chinRug = 1.0 + (v > 0.60 ? 0.06 * Math.cos(v * Math.PI * 22.0) : 0.0);
                        y = botY * Math.pow(Math.abs(c), 0.66) * chinRug;
                    } else {
                        const rim = Math.pow(absS, 1.4);
                        y = topY * rim + (topY - 0.05 * Math.sin(v * Math.PI)) * (1 - rim);
                    }

                    pos.setXYZ(idx, x, y, z);
                    uvs.setXY(idx, v, u);
                    idx++;
                }
            }
            geo.computeVertexNormals();
            jawGroup.add(registerSkin(new THREE.Mesh(geo, materials.skullKeratin)));

            // Gencive inférieure festonnée humide entourant les racines des dents dentaires
            const gumRSteps = 20;
            const gumLSteps = 28;
            const gumGeo = new THREE.PlaneGeometry(1, 1, gumRSteps, gumLSteps);
            const gPos = gumGeo.attributes.position;
            const gUvs = gumGeo.attributes.uv;
            let gIdx = 0;
            for (let iy = 0; iy <= gumLSteps; iy++) {
                const v = iy / gumLSteps;
                const tv = 0.28 + v * 0.62;
                const ptTop = topCurve.getPoint(tv);
                const hw = ptTop.x * 0.76;
                const scallop = 0.008 * Math.abs(Math.sin(v * Math.PI * 9.0));

                for (let ix = 0; ix <= gumRSteps; ix++) {
                    const u = ix / gumRSteps;
                    const ang = u * Math.PI * 2;
                    const gx = Math.sin(ang) * hw;
                    const gy = ptTop.y - 0.002 + Math.cos(ang) * (0.026 + scallop);
                    gPos.setXYZ(gIdx, gx, gy, ptTop.z);
                    gUvs.setXY(gIdx, u, v);
                    gIdx++;
                }
            }
            gumGeo.computeVertexNormals();
            jawGroup.add(registerSkin(new THREE.Mesh(gumGeo, materials.gingiva)));

            // 9 paires de crocs dentaires latéraux + 1 paire de crocs symphysaires avant (visibles sur le menton du portrait)
            for (let t = 0; t < 9; t++) {
                const v = 0.32 + (t / 8) * 0.56;
                const ptTop = topCurve.getPoint(v);
                const tx = ptTop.x * 0.74;
                const ty = ptTop.y;
                const tz = ptTop.z;
                const tLen = (t >= 1 && t <= 4) ? 0.102 : 0.075;
                const tRad = (t >= 1 && t <= 4) ? 0.019 : 0.014;

                [-1, 1].forEach(side => {
                    const dTooth = createCurvedToothMesh(tRad, tLen, false);
                    dTooth.position.set(side * tx, ty, tz);
                    dTooth.rotation.set(-0.06, 0, side * -0.04);
                    jawGroup.add(dTooth);
                });
            }

            [-1, 1].forEach(side => {
                const frontTooth = createCurvedToothMesh(0.014, 0.072, false);
                frontTooth.position.set(side * 0.040, 0.032, 1.08);
                frontTooth.rotation.set(-0.10, 0, side * -0.02);
                jawGroup.add(frontTooth);
            });

            // Langue charnue large et arrondie à sillon médian longitudinal (sulcus) fidèle au portrait
            const tRSteps = 26;
            const tLSteps = 28;
            const tongueGeo = new THREE.PlaneGeometry(1, 1, tRSteps, tLSteps);
            const tPos = tongueGeo.attributes.position;
            const tUvs = tongueGeo.attributes.uv;
            let tIdx = 0;
            for (let iy = 0; iy <= tLSteps; iy++) {
                const v = iy / tLSteps;
                const tz = 0.18 + v * 0.78;
                const archY = 0.02 + Math.sin(v * Math.PI * 0.85) * 0.065 -
                    Math.pow(Math.max(0.0, v - 0.65) / 0.35, 1.6) * 0.032;
                const tipRound = iy < tLSteps ? Math.pow(1.0 - Math.pow(v, 3.5), 0.42) : 0.002;
                const baseCap = iy === 0 ? 0.002 : 1.0;
                const w = 0.142 * tipRound * baseCap * (0.75 + 0.25 * Math.sin(v * Math.PI));
                const h = 0.044 * tipRound * baseCap * Math.sin(Math.min(1.0, v * 1.15) * Math.PI * 0.88);

                for (let ix = 0; ix <= tRSteps; ix++) {
                    const u = ix / tRSteps;
                    const ang = u * Math.PI * 2;
                    const s = Math.sin(ang);
                    const c = Math.cos(ang);
                    const lx = s * w;
                    const sulcus = -0.024 * Math.exp(-Math.pow(s / 0.26, 2)) * Math.max(0.0, c) * Math.sin(v * Math.PI);
                    const ly = archY + c * h + sulcus;
                    tPos.setXYZ(tIdx, lx, ly, tz);
                    tUvs.setXY(tIdx, u, v);
                    tIdx++;
                }
            }
            tongueGeo.computeVertexNormals();
            const tongueMesh = registerSkin(new THREE.Mesh(tongueGeo, materials.oralMucosa));
            jawGroup.add(tongueMesh);
            jawGroup.userData.tongueMesh = tongueMesh;

            jawGroup.add(createBoneVisual(new THREE.Vector3(0, -0.08, 0.0), new THREE.Vector3(0, -0.05, 1.18), 0.048));
        }
        buildSculptedMandible();

        // Membranes musculaires d'adducteurs mandibulaires (M. pterygoideus / commissures buccales du portrait)
        const jawAdductors = [];
        [-1, 1].forEach(side => {
            const upperAnchor = new THREE.Group();
            upperAnchor.position.set(side * 0.22, -0.04, 0.28);
            headGroup.add(upperAnchor);

            const lowerAnchor = new THREE.Group();
            lowerAnchor.position.set(side * 0.20, -0.04, 0.26);
            jawGroup.add(lowerAnchor);

            const muscGeo = createTrexCapsuleGeometry(0.044, 0.20, 6, 14);
            muscGeo.scale(0.68, 1.0, 1.85);
            const muscMesh = registerSkin(new THREE.Mesh(muscGeo, materials.oralMucosa));
            headGroup.add(muscMesh);

            jawAdductors.push({ side, upperAnchor, lowerAnchor, muscMesh });
        });

        // Filets de bave / salive translucides dynamiques s'étirant entre les crocs à l'ouverture de la gueule
        const salivaStrands = [];
        const strandSpecs = [
            { xUp: -0.20, yUp: -0.10, zUp: 0.58, xLo: -0.16, yLo: 0.03, zLo: 0.54, r: 0.0024 },
            { xUp: -0.18, yUp: -0.10, zUp: 0.74, xLo: -0.14, yLo: 0.03, zLo: 0.68, r: 0.0022 },
            { xUp: -0.15, yUp: -0.08, zUp: 0.92, xLo: -0.11, yLo: 0.04, zLo: 0.84, r: 0.0020 },
            { xUp:  0.20, yUp: -0.10, zUp: 0.64, xLo:  0.16, yLo: 0.03, zLo: 0.58, r: 0.0024 },
            { xUp:  0.16, yUp: -0.09, zUp: 0.86, xLo:  0.12, yLo: 0.04, zLo: 0.78, r: 0.0020 }
        ];
        strandSpecs.forEach(sp => {
            const upNode = new THREE.Group();
            upNode.position.set(sp.xUp, sp.yUp, sp.zUp);
            headGroup.add(upNode);

            const loNode = new THREE.Group();
            loNode.position.set(sp.xLo, sp.yLo, sp.zLo);
            jawGroup.add(loNode);

            const sGeo = new THREE.CylinderGeometry(sp.r * 0.65, sp.r, 1.0, 6);
            const sMesh = new THREE.Mesh(sGeo, materials.saliva);
            headGroup.add(sMesh);
            salivaStrands.push({ upNode, loNode, sMesh });
        });

        // Gouttes de bave pendantes aux crocs avant et au menton (comme sur le portrait)
        const dripSpecs = [
            { parent: headGroup, x: -0.10, y: -0.13, z: 1.08, len: 0.09 },
            { parent: headGroup, x:  0.05, y: -0.11, z: 1.18, len: 0.07 },
            { parent: jawGroup,  x: -0.07, y: -0.22, z: 0.94, len: 0.10 },
            { parent: jawGroup,  x:  0.09, y: -0.21, z: 0.84, len: 0.08 }
        ];
        dripSpecs.forEach(dr => {
            const dGeo = new THREE.ConeGeometry(0.0032, dr.len, 6);
            dGeo.rotateX(Math.PI);
            const dMesh = new THREE.Mesh(dGeo, materials.saliva);
            dMesh.position.set(dr.x, dr.y - dr.len * 0.5, dr.z);
            dr.parent.add(dMesh);
        });

        // =====================================================================
        // 2E. BRAS MUSCLÉS & MAINS DIDACTYLES À GRIFFES FALCIFORMES BIEN VISIBLES
        // =====================================================================
        function buildForelimb(side) {
            const shoulder = new THREE.Group();
            shoulder.position.set(side * 0.38, -0.18, 0.90);
            torsoGroup.add(shoulder);

            // 1. Humérus musclé (0.42m) avec crête deltopectorale
            const humLen = 0.42;
            const humMesh = createMuscularSegment(humLen, '-y', (t, angle) => {
                const deltoid = Math.sin(t * Math.PI * 0.85) * 0.032;
                const r = THREE.MathUtils.lerp(0.115, 0.076, t) + deltoid;
                return {
                    rx: r * 0.88,
                    rz: r * 1.15,
                    offsetZ: Math.sin(t * Math.PI) * 0.018
                };
            }, materials.bodyHide, 0.18, 0.16);
            shoulder.add(humMesh);
            shoulder.add(createBoneVisual(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -humLen, 0), 0.030));

            // 2. Coude -> Avant-bras (Radius & Ulna : 0.38m projeté vers l'avant +Z)
            const elbow = new THREE.Group();
            elbow.position.set(0, -humLen, 0);
            shoulder.add(elbow);

            const faLen = 0.38;
            const faMesh = createMuscularSegment(faLen, 'z', (t) => {
                const forearmBelly = Math.exp(-Math.pow(t - 0.32, 2) * 14.0) * 0.024;
                const r = THREE.MathUtils.lerp(0.076, 0.054, t) + forearmBelly;
                return { rx: r * 0.86, rz: r * 1.10 };
            }, materials.bodyHide, 0.16, 0.14);
            elbow.add(faMesh);
            elbow.add(createBoneVisual(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, faLen), 0.024));

            // 3. Poignet & Main didactyle (paumes tournées médialement vers l'intérieur)
            const wrist = new THREE.Group();
            wrist.position.set(0, 0, faLen);
            elbow.add(wrist);

            const palmLen = 0.12;
            const palmMesh = createMuscularSegment(palmLen, 'z', (t) => {
                const r = THREE.MathUtils.lerp(0.054, 0.046, t);
                return { rx: r * 0.72, rz: r * 1.15 };
            }, materials.scalyPad, 0.15, 0.15);
            wrist.add(palmMesh);

            // 2 doigts articulés munis de grandes griffes falciformes noires (Doigt I et Doigt II)
            const fingers = [];
            const digitSpecs = [
                { idx: 0, yOff: 0.024,  xOff: -side * 0.012, pitch: -0.14, fLen: 0.13, fRad: 0.024, cLen: 0.16, cRad: 0.026 },
                { idx: 1, yOff: -0.022, xOff: side * 0.010,  pitch: 0.16,  fLen: 0.16, fRad: 0.021, cLen: 0.14, cRad: 0.022 }
            ];

            digitSpecs.forEach(spec => {
                const finger = new THREE.Group();
                finger.position.set(spec.xOff, spec.yOff, palmLen * 0.88);
                finger.rotation.x = spec.pitch;
                finger.rotation.y = -side * 0.18;
                wrist.add(finger);

                const phalMesh = createMuscularSegment(spec.fLen, 'z', (t) => {
                    const r = THREE.MathUtils.lerp(spec.fRad, spec.fRad * 0.82, t);
                    return { rx: r * 0.92, rz: r };
                }, materials.scalyPad, 0.18, 0.16);
                finger.add(phalMesh);

                const clawGeo = new THREE.ConeGeometry(spec.cRad, spec.cLen, 10);
                clawGeo.scale(0.78, 1.0, 1.15);
                clawGeo.rotateX(Math.PI / 2 + 0.36);
                clawGeo.translate(0, -0.018, spec.fLen + spec.cLen * 0.38);
                finger.add(registerSkin(new THREE.Mesh(clawGeo, materials.claw)));

                fingers.push(finger);
            });

            return { side, shoulder, elbow, wrist, fingers };
        }

        const leftArm = buildForelimb(1);
        const rightArm = buildForelimb(-1);

        // =====================================================================
        // 2F. MEMBRES POSTÉRIEURS DIGITIGRADES COLOSSAUX À 4 SEGMENTS ARTICULÉS
        // =====================================================================
        function buildHindlimb(side) {
            const hip = new THREE.Group();
            hip.position.set(side * 0.28, -0.04, -0.32);
            torsoGroup.add(hip);

            // 1. Fémur colossal (0.86m)
            const femLen = 0.86;
            const femMesh = createMuscularSegment(femLen, '-y', (t, angle) => {
                const belly = Math.sin(t * Math.PI * 0.82) * 0.095;
                const r = THREE.MathUtils.lerp(0.32, 0.20, t) + belly;
                const frontBackAsym = Math.cos(angle) * 0.035;
                return {
                    rx: r * 0.78,
                    rz: r * 1.18,
                    offsetZ: frontBackAsym
                };
            }, materials.bodyHide, 0.18, 0.16);
            hip.add(femMesh);
            hip.add(createBoneVisual(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -femLen, 0), 0.068));

            // 2. Genou -> Tibia / Mollet (0.92m avec galbe puissant du M. gastrocnemius)
            const knee = new THREE.Group();
            knee.position.set(0, -femLen, 0);
            hip.add(knee);

            const tibLen = 0.92;
            const tibMesh = createMuscularSegment(tibLen, '-y', (t) => {
                const calfBulge = Math.exp(-Math.pow(t - 0.28, 2) * 14.0) * 0.085;
                const r = THREE.MathUtils.lerp(0.20, 0.115, t) + calfBulge;
                return {
                    rx: r * 0.85,
                    rz: r * 1.12,
                    offsetZ: -calfBulge * 0.42
                };
            }, materials.bodyHide, 0.16, 0.15);
            knee.add(tibMesh);
            knee.add(createBoneVisual(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -tibLen, 0), 0.052));

            // 3. Cheville (articulation mésotarsienne) -> Arctométatarse écaillé (0.56m)
            const ankle = new THREE.Group();
            ankle.position.set(0, -tibLen, 0);
            knee.add(ankle);

            const metaLen = 0.56;
            const metaMesh = createMuscularSegment(metaLen, '-y', (t) => {
                const r = THREE.MathUtils.lerp(0.115, 0.092, t) + (t > 0.78 ? (t - 0.78) * 0.06 : 0);
                return { rx: r * 0.94, rz: r * 0.92 };
            }, materials.scalyPad, 0.16, 0.16);
            ankle.add(metaMesh);
            ankle.add(createBoneVisual(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -metaLen, 0), 0.042));

            // Ergot médial surélevé (Hallux / Doigt I)
            const halluxGroup = new THREE.Group();
            halluxGroup.position.set(-side * 0.082, -metaLen * 0.62, -0.04);
            halluxGroup.rotation.y = -side * 0.55;
            halluxGroup.rotation.x = -0.35;
            ankle.add(halluxGroup);
            const halluxClaw = new THREE.ConeGeometry(0.022, 0.11, 8);
            halluxClaw.rotateX(-Math.PI / 2 - 0.35);
            halluxClaw.translate(0, 0, -0.045);
            halluxGroup.add(registerSkin(new THREE.Mesh(halluxClaw, materials.claw)));

            // 4. Pied digitigrade (Pes) à 3 grands orteils porteurs (Doigts II, III, IV)
            const foot = new THREE.Group();
            foot.position.set(0, -metaLen, 0);
            ankle.add(foot);

            const toes = [];
            const toeSpecs = [
                { idx: 0, angleY: 0.28,  xOff: 0.062, len: 0.34, r: 0.044, clawLen: 0.16, clawR: 0.038 },
                { idx: 1, angleY: 0.0,   xOff: 0.0,   len: 0.44, r: 0.052, clawLen: 0.20, clawR: 0.046 },
                { idx: 2, angleY: -0.28, xOff: -0.062, len: 0.33, r: 0.042, clawLen: 0.15, clawR: 0.036 }
            ];

            toeSpecs.forEach(spec => {
                const toeGroup = new THREE.Group();
                toeGroup.position.set(spec.xOff, 0.0, 0.01);
                toeGroup.rotation.y = spec.angleY;
                foot.add(toeGroup);

                const phalMesh = createMuscularSegment(spec.len, 'z', (t) => {
                    const r = THREE.MathUtils.lerp(spec.r, spec.r * 0.80, t);
                    return { rx: r * 1.05, rz: r * 0.74 };
                }, materials.scalyPad, 0.20, 0.16);
                toeGroup.add(phalMesh);

                const ungualGeo = new THREE.ConeGeometry(spec.clawR, spec.clawLen, 10);
                ungualGeo.scale(0.82, 1.0, 1.1);
                ungualGeo.rotateX(Math.PI / 2 + 0.18);
                ungualGeo.translate(0, -0.008, spec.len + spec.clawLen * 0.38);
                toeGroup.add(registerSkin(new THREE.Mesh(ungualGeo, materials.claw)));

                toes.push(toeGroup);
            });

            return { side, hip, knee, ankle, foot, toes };
        }

        const leftLeg = buildHindlimb(1);
        const rightLeg = buildHindlimb(-1);

        // =====================================================================
        // 3. MOTEUR DE POSES BIOMÉCANIQUES (IDLE, WALK, SPRINT, DISPLAY, CROUCH)
        // =====================================================================
        const tRig = {
            trex,
            rootJoint,
            torsoGroup,
            caudalSegments,
            neckSegments,
            headGroup,
            jawGroup,
            leftArm,
            rightArm,
            leftLeg,
            rightLeg,
            eyelids,
            jawAdductors,
            salivaStrands,
            tongueMesh: jawGroup.userData.tongueMesh,
            skeletonMeshes,
            materials,
            currentMode: 'idle',
            poseUpdatedThisFrame: false
        };

        // Convention : rx > 0 = tête/mâchoire baisse vers le sol, rx < 0 = tête lève vers le ciel
        function setTrexHeadRot(rx, ry, rz) {
            rig.headGroup.rotation.set(rz || 0, ry || 0, -(rx || 0));
        }

        // Convention : openAmt > 0 = ouverture de la mâchoire inférieure
        function setTrexJawRot(openAmt, rollZ = 0) {
            rig.jaw.rotation.set(rollZ || 0, 0, -Math.max(0, openAmt || 0));
        }

        // Cinématique des petits bras didactyles : les maintient dégagés sous et devant le poitrail
        function setForelimbPose(arm, shoulderPitch = 0, shoulderAbduct = 0, elbowFlex = 0, wristFlex = 0, clawCurl = 0) {
            const s = arm.side;
            arm.shoulder.rotation.set(0.22 + shoulderPitch, 0, s * (0.22 + shoulderAbduct));
            arm.elbow.rotation.set(0.08 - elbowFlex, -s * 0.14, 0);
            arm.wrist.rotation.set(0.10 + wristFlex, -s * 0.18, s * 0.28);
            if (arm.fingers) {
                arm.fingers.forEach((f, idx) => {
                    const basePitch = idx === 0 ? -0.14 : 0.16;
                    f.rotation.x = basePitch + clawCurl * (idx === 0 ? 0.25 : 0.35);
                    f.rotation.y = -s * (0.18 + clawCurl * 0.22);
                });
            }
        }

        // Cinématique inverse simplifiée du membre postérieur digitigrade à 4 segments
        function setDigitigradeLegPose(leg, swingAngle = 0, kneeFlex = 0, ankleFlex = 0, crouchDrop = 0, toeCurl = 0, abduction = 0.04) {
            const rootPitch = rootJoint.rotation.x || 0;
            const cBend = crouchDrop * 0.85;
            const hipRx = -0.52 - rootPitch + swingAngle - cBend;
            const kneeRx = 0.94 + kneeFlex + cBend * 1.95;
            const ankleRx = -0.94 + ankleFlex - cBend * 1.55;
            const footRx = -(hipRx + kneeRx + ankleRx + rootPitch) + toeCurl * 0.45;

            leg.hip.rotation.set(hipRx, 0, abduction * leg.side);
            leg.knee.rotation.set(kneeRx, 0, 0);
            leg.ankle.rotation.set(ankleRx, 0, 0);
            leg.foot.rotation.set(footRx, 0, 0);

            leg.toes.forEach((toe, idx) => {
                const baseSpread = idx === 0 ? 0.28 : (idx === 2 ? -0.28 : 0);
                const splay = toeCurl < 0 ? -toeCurl * 0.14 : -toeCurl * 0.08;
                toe.rotation.x = Math.max(-0.25, toeCurl * 0.55);
                toe.rotation.y = baseSpread * (1 + splay);
            });
        }

        tRig.setHeadRot = setTrexHeadRot;
        tRig.setJawRot = setTrexJawRot;
        tRig.setForelimbPose = setForelimbPose;
        tRig.setDigitigradeLegPose = setDigitigradeLegPose;

        function applyPoseMode(mode, t, opts = {}) {
            tRig.currentMode = mode;
            tRig.poseUpdatedThisFrame = true;

            if (mode === 'idle') {
                // --- MODE 1 : POSTURE D'ATTENTE PRÉDATRICE (RESPIRATION LOURDE & SCAN BINOCULAIRE) ---
                const breath = Math.sin(t * 2.6);
                const weightShift = Math.sin(t * 1.3);
                const dropAmt = Math.max(0, -breath) * 0.04;

                rootJoint.position.set(weightShift * 0.025, 2.10 - dropAmt * 0.5, 0);
                rootJoint.rotation.set(
                    0.02 + breath * 0.018,
                    weightShift * 0.025,
                    weightShift * 0.015
                );

                neckSegments.forEach((seg, i) => {
                    const baseS = i < 2 ? -0.14 : (i === 2 ? -0.04 : 0.08);
                    const wave = Math.sin(t * 2.6 - i * 0.35) * 0.014;
                    seg.rotation.set(baseS + wave, Math.sin(t * 1.3) * 0.022, 0);
                });

                setTrexHeadRot(
                    0.18 + Math.sin(t * 2.6 - 1.2) * 0.035,
                    Math.sin(t * 1.3) * 0.08,
                    Math.cos(t * 1.3) * 0.025
                );
                setTrexJawRot(0.12 + Math.max(0, breath) * 0.11);

                [leftArm, rightArm].forEach(arm => {
                    const s = arm.side;
                    const twitch = Math.sin(t * 3.2 + s * 1.1);
                    setForelimbPose(arm, twitch * 0.06, 0.02, twitch * 0.09, -twitch * 0.06, 0.25 + twitch * 0.22);
                });

                setDigitigradeLegPose(leftLeg, 0.03, 0, 0, dropAmt, -0.08, 0.04);
                setDigitigradeLegPose(rightLeg, -0.03, 0, 0, dropAmt, -0.08, 0.04);

                caudalSegments.forEach((seg, i) => {
                    const basePitch = i === 0 ? 0.04 : (i < 3 ? -0.015 : 0.01);
                    seg.rotation.set(
                        basePitch + Math.cos(t * 2.6 - i * 0.45) * 0.018,
                        Math.sin(t * 2.2 - i * 0.52) * (0.045 + i * 0.014),
                        0
                    );
                });

            } else if (mode === 'walk' || mode === 'sprint') {
                // --- MODE 2 : FOULÉE BIPÈDE LOURDE & COURSE DE POURSUITE HORIZONTALE ---
                const isSprint = mode === 'sprint' || Boolean(opts.isSprint);
                const strideSpeed = opts.strideSpeed || (isSprint ? 10.5 : 7.8);
                const strideAmp = opts.strideAmp !== undefined ? opts.strideAmp : (isSprint ? 1.28 : 1.0);
                const lPhase = t * strideSpeed;
                const rPhase = lPhase + Math.PI;

                const stepBounce = Math.abs(Math.sin(lPhase)) * (isSprint ? 0.16 : 0.11) * strideAmp;
                const forwardLean = isSprint ? 0.24 : 0.08;

                rootJoint.position.set(
                    Math.cos(lPhase) * 0.06 * strideAmp,
                    2.06 + stepBounce - (isSprint ? 0.10 : 0),
                    0
                );
                rootJoint.rotation.set(
                    forwardLean + Math.cos(lPhase * 2) * 0.035 * strideAmp,
                    Math.sin(lPhase) * 0.065 * strideAmp,
                    Math.cos(lPhase) * 0.045 * strideAmp
                );

                neckSegments.forEach((seg, i) => {
                    const baseS = isSprint
                        ? (i < 2 ? -0.06 : 0.04)
                        : (i < 2 ? -0.14 : (i === 2 ? -0.03 : 0.08));
                    seg.rotation.set(
                        baseS - Math.cos(lPhase * 2 - i * 0.25) * 0.022 * strideAmp,
                        -Math.sin(lPhase) * 0.03 * strideAmp,
                        0
                    );
                });

                setTrexHeadRot(
                    (isSprint ? 0.04 : 0.16) + Math.sin(lPhase * 2) * 0.04 * strideAmp,
                    -Math.sin(lPhase) * 0.06 * strideAmp,
                    -Math.cos(lPhase) * 0.03 * strideAmp
                );
                setTrexJawRot((isSprint ? 0.26 : 0.14) + Math.abs(Math.sin(lPhase)) * 0.14);

                [leftArm, rightArm].forEach(arm => {
                    const phase = arm.side === 1 ? lPhase : rPhase;
                    const swing = Math.sin(phase) * 0.16 * strideAmp;
                    setForelimbPose(arm, swing, 0.04, 0.10 + swing * 0.5, 0, 0.35);
                });

                [leftLeg, rightLeg].forEach(leg => {
                    const phase = leg.side === 1 ? lPhase : rPhase;
                    const swing = -Math.sin(phase) * 0.46 * strideAmp;
                    const liftPhase = Math.max(0, Math.cos(phase));
                    const pushPhase = Math.max(0, -Math.cos(phase));

                    const kneeFlex = liftPhase * 0.62 * strideAmp - pushPhase * 0.18 * strideAmp;
                    const ankleFlex = -liftPhase * 0.45 * strideAmp + pushPhase * 0.38 * strideAmp;
                    const toeCurl = liftPhase > 0.2 ? liftPhase * 0.48 : -0.15;

                    setDigitigradeLegPose(leg, swing, kneeFlex, ankleFlex, isSprint ? 0.08 : 0.02, toeCurl, 0.04);
                });

                caudalSegments.forEach((seg, i) => {
                    const pitchBase = isSprint ? -0.02 : (i === 0 ? 0.03 : -0.01);
                    seg.rotation.set(
                        pitchBase + Math.sin(lPhase * 2 - i * 0.45) * 0.03 * strideAmp,
                        -Math.cos(lPhase - i * 0.48) * (0.08 + i * 0.024) * strideAmp,
                        0
                    );
                });

            } else if (mode === 'display') {
                // --- MODE 3 : RUGISSEMENT TERRITORIAL D'INTIMIDATION (APEX ROAR) ---
                const roarVib = Math.sin(t * 28);
                rootJoint.position.set(0, 2.16, 0.08);
                rootJoint.rotation.set(-0.18 + roarVib * 0.012, 0, 0);

                neckSegments.forEach((seg, i) => {
                    const arch = i < 2 ? -0.22 : (i === 2 ? -0.08 : 0.14);
                    seg.rotation.set(arch + roarVib * 0.01, Math.sin(t * 6) * 0.03, 0);
                });

                setTrexHeadRot(-0.15 + roarVib * 0.025, Math.sin(t * 6) * 0.12, roarVib * 0.02);
                setTrexJawRot(0.78 + roarVib * 0.08);

                [leftArm, rightArm].forEach(arm => {
                    setForelimbPose(arm, -0.18, 0.16, 0.22, -0.15, -0.35);
                });

                setDigitigradeLegPose(leftLeg, 0.08, -0.08, 0.05, 0, -0.18, 0.06);
                setDigitigradeLegPose(rightLeg, -0.10, 0.04, -0.04, 0, -0.18, 0.06);

                caudalSegments.forEach((seg, i) => {
                    seg.rotation.set(
                        0.05 - i * 0.015,
                        Math.sin(t * 5 - i * 0.5) * (0.06 + i * 0.02),
                        0
                    );
                });

            } else if (mode === 'crouch') {
                // --- MODE 4 : ACCROUPISSEMENT D'EMBUSCADE PRÊT AU BOND ---
                const breath = Math.sin(t * 3.0);
                rootJoint.position.set(0, 1.56 + breath * 0.02, 0);
                rootJoint.rotation.set(0.18, 0, 0);

                neckSegments.forEach((seg, i) => {
                    seg.rotation.set(i < 2 ? -0.22 : 0.06, 0, 0);
                });
                setTrexHeadRot(0.05, 0, 0);
                setTrexJawRot(0.18);

                [leftArm, rightArm].forEach(arm => {
                    setForelimbPose(arm, 0.08, 0.06, 0.25, 0.10, 0.45);
                });

                setDigitigradeLegPose(leftLeg, 0.05, 0.15, -0.10, 0.52, -0.15, 0.05);
                setDigitigradeLegPose(rightLeg, -0.05, 0.15, -0.10, 0.52, -0.15, 0.05);

                caudalSegments.forEach((seg, i) => {
                    seg.rotation.set(-0.03, Math.sin(t * 3.0 - i * 0.5) * 0.05, 0);
                });
            }
        }

        function resetTrexPose(time) {
            rig.torso.rotation.set(0, 0, 0);
            rig.neck.rotation.set(0, 0, 0);
            if (rig.arms[0]) rig.arms[0].rotation.set(0, 0, 0);
            if (rig.arms[1]) rig.arms[1].rotation.set(0, 0, 0);
            if (rig.legs[0]) rig.legs[0].rotation.set(0, 0, 0);
            if (rig.legs[1]) rig.legs[1].rotation.set(0, 0, 0);
            rig.tailSegments.forEach(s => { if (s) s.rotation.set(0, 0, 0); });
            applyPoseMode('idle', time || 0);
            tRig.poseUpdatedThisFrame = false;
        }

        const _pUpper = new THREE.Vector3();
        const _pLower = new THREE.Vector3();
        const _pMid = new THREE.Vector3();
        const _upVec = new THREE.Vector3(0, 1, 0);
        const _dirVec = new THREE.Vector3();

        function updateAnatomicalSkin(time, fighter, modeOverride) {
            const t = time || 0;
            const breathPhase = t * 2.6;

            // 1. Clignement naturel des paupières ou plissement agressif lors des attaques
            const blinkCycle = ((t % 4.4) + 4.4) % 4.4;
            const blinkAmt = blinkCycle < 0.15 ? Math.sin((blinkCycle / 0.15) * Math.PI) : 0;
            const jawOpenAmt = Math.max(0, -rig.jaw.rotation.z);
            const glareSquint = Math.min(0.32, jawOpenAmt * 0.28);
            eyelids.forEach(lid => {
                lid.rotation.x = -Math.PI * 0.44 + Math.max(blinkAmt * 0.92, glareSquint);
            });

            // 2. Courbure et vibration de la langue sillonnée selon l'ouverture de la mâchoire
            if (jawGroup.userData.tongueMesh) {
                jawGroup.userData.tongueMesh.rotation.x = -0.02 + jawOpenAmt * 0.14 + Math.sin(t * 24) * 0.022 * jawOpenAmt;
            }

            // 3. Gestion des réactions de combat (combat_reactions.js) et neutralisation des surcharges génériques
            if (tRig.poseUpdatedThisFrame) {
                rig.torso.rotation.set(0, 0, 0);
                rig.neck.rotation.set(0, 0, 0);
                if (fighter && (fighter.action === 'crouch' || fighter.isCrouching)) {
                    rig.hips.position.y = 2.1;
                }
            } else if (fighter) {
                const cState = fighter.combatController ? fighter.combatController.state : null;
                const isGroundedOrFalling = fighter.isDead || fighter.flattened || fighter.beingThrownTimer > 0 ||
                    cState === CombatState.KNOCKDOWN_FALL || cState === CombatState.GROUNDED_IDLE || cState === CombatState.WAKE_UP_STAND;

                if (!isGroundedOrFalling) {
                    const genericPitch = -(rig.hips.rotation.z + rig.torso.rotation.z);
                    const genericYaw = rig.torso.rotation.y;
                    const hipDrop = Math.max(-0.35, Math.min(0.95, 2.1 - rig.hips.position.y));

                    rig.hips.position.y = 2.1;
                    rig.hips.rotation.z = 0;
                    rig.torso.rotation.set(0, 0, 0);

                    rootJoint.position.y = 2.10 - hipDrop * 0.78;
                    rootJoint.rotation.set(genericPitch * 0.72, genericYaw, rig.hips.rotation.x);

                    const lSwing = rig.legs[0] ? -rig.legs[0].rotation.z * 0.45 : 0;
                    const rSwing = rig.legs[1] ? -rig.legs[1].rotation.z * 0.45 : 0;
                    const crouchAmt = Math.max(0, hipDrop * 0.55);

                    setDigitigradeLegPose(leftLeg, lSwing, Math.max(0, lSwing) * 0.35, 0, crouchAmt, -0.15, 0.05);
                    setDigitigradeLegPose(rightLeg, rSwing, Math.max(0, rSwing) * 0.35, 0, crouchAmt, -0.15, 0.05);
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

                if (rig.arms[0] && Math.abs(rig.arms[0].rotation.z) > 0.001) {
                    setForelimbPose(leftArm, -rig.arms[0].rotation.z * 0.35, 0.06, 0.15, 0, 0.3);
                }
                if (rig.arms[1] && Math.abs(rig.arms[1].rotation.z) > 0.001) {
                    setForelimbPose(rightArm, -rig.arms[1].rotation.z * 0.35, 0.06, 0.15, 0, 0.3);
                }

                rig.tailSegments.forEach((tProxy, idx) => {
                    if (!tProxy) return;
                    if (Math.abs(tProxy.rotation.y) > 0.001 || Math.abs(tProxy.rotation.z) > 0.001) {
                        const cIdx = Math.min(caudalSegments.length - 1, idx);
                        caudalSegments[cIdx].rotation.y += tProxy.rotation.y * 0.65;
                        caudalSegments[cIdx].rotation.x -= tProxy.rotation.z * 0.55;
                        if (idx === 3 && caudalSegments.length > 4) {
                            caudalSegments[4].rotation.y += tProxy.rotation.y * 0.55;
                            caudalSegments[5].rotation.y += tProxy.rotation.y * 0.55;
                        }
                        tProxy.rotation.set(0, 0, 0);
                    }
                });
            }

            // 4. Synchroniser l'affichage du squelette interne X-Ray
            const isXray = Boolean(fighter && fighter.isXrayTarget);
            skeletonMeshes.forEach(m => { m.visible = isXray; });

            // 5. Mettre à jour les matrices mondiales, les membranes d'adducteurs, les filets de bave et le maillage continu
            trex.updateMatrixWorld(true);

            jawAdductors.forEach(item => {
                item.muscMesh.visible = jawOpenAmt > 0.05;
                if (item.muscMesh.visible) {
                    item.upperAnchor.getWorldPosition(_pUpper);
                    item.lowerAnchor.getWorldPosition(_pLower);
                    headGroup.worldToLocal(_pUpper);
                    headGroup.worldToLocal(_pLower);
                    _pMid.copy(_pUpper).add(_pLower).multiplyScalar(0.5);
                    const dist = Math.max(0.06, _pUpper.distanceTo(_pLower));
                    item.muscMesh.position.copy(_pMid);
                    item.muscMesh.scale.set(0.72, dist / 0.22, 1.45);
                    item.muscMesh.rotation.set(0.15 + jawOpenAmt * 0.32, 0, item.side * 0.08);
                }
            });

            salivaStrands.forEach(st => {
                st.sMesh.visible = jawOpenAmt > 0.08;
                if (st.sMesh.visible) {
                    st.upNode.getWorldPosition(_pUpper);
                    st.loNode.getWorldPosition(_pLower);
                    headGroup.worldToLocal(_pUpper);
                    headGroup.worldToLocal(_pLower);
                    _pMid.copy(_pUpper).add(_pLower).multiplyScalar(0.5);
                    _dirVec.copy(_pUpper).sub(_pLower);
                    const dist = Math.max(0.02, _dirVec.length());
                    st.sMesh.position.copy(_pMid);
                    st.sMesh.scale.set(1.0, dist, 1.0);
                    st.sMesh.quaternion.setFromUnitVectors(_upVec, _dirVec.normalize());
                }
            });

            updateContinuousBodySkin(breathPhase);
            void modeOverride;
        }

        rig.specialParts.tRig = tRig;
        rig.specialParts.applyPoseMode = applyPoseMode;
        rig.specialParts.resetTrexPose = resetTrexPose;
        rig.specialParts.resetQuetzalPose = resetTrexPose; // Hook automatique dans rig_reset.js
        rig.specialParts.updateAnatomicalSkin = updateAnatomicalSkin;

        // Initialiser la pose par défaut et générer le maillage continu initial
        applyPoseMode('idle', 0);
        updateAnatomicalSkin(0, null, 'idle');
    },
});
