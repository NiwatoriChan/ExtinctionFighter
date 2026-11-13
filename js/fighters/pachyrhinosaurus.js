// Pachyrhinosaurus Canadensis — Modèle Anatomique Quadrupède & Rig Musculo-Squelettique
// Refonte anatomique et texturale complète validée dans Blender 5.2 (modèle de référence ocellé terre cuite)

// Cache global de textures PBR procédurales partagé entre instances (J1/J2, aperçu menu & combat)
let _cachedPachyPBRMaps = null;
const _pachyClamp01 = (v) => (v < 0 ? 0 : (v > 1 ? 1 : v));
const _pachyMix = (a, b, t) => a + (b - a) * t;

function getPachyPBRMaps() {
    if (_cachedPachyPBRMaps) return _cachedPachyPBRMaps;

    // -------------------------------------------------------------------------
    // Hachage entier rapide & bruit cohérent
    // -------------------------------------------------------------------------
    const clamp01 = _pachyClamp01;
    const mix = _pachyMix;

    function ihash(ix, iy, seed = 0) {
        let n = (Math.imul(ix, 374761393) + Math.imul(iy, 668265263) + Math.imul(seed, 1442695041)) | 0;
        n = Math.imul(n ^ (n >>> 13), 1274126177) | 0;
        n = (n ^ (n >>> 16)) >>> 0;
        return n / 4294967295;
    }

    function vnoise(x, y, seed = 0) {
        const ix = Math.floor(x);
        const iy = Math.floor(y);
        const fx = x - ix;
        const fy = y - iy;
        const ux = fx * fx * (3 - 2 * fx);
        const uy = fy * fy * (3 - 2 * fy);
        const a = ihash(ix, iy, seed);
        const b = ihash(ix + 1, iy, seed);
        const c = ihash(ix, iy + 1, seed);
        const d = ihash(ix + 1, iy + 1, seed);
        return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
    }

    function fbm(x, y, octaves = 3, seed = 0) {
        let v = 0, amp = 0.5, freq = 1.0, norm = 0;
        for (let i = 0; i < octaves; i++) {
            v += amp * vnoise(x * freq, y * freq, seed + i * 31);
            norm += amp;
            amp *= 0.5;
            freq *= 2.03;
        }
        return v / norm;
    }

    function voronoiPebble(u, v, sx, sy, jitter = 0.85, seed = 11, tileU = false) {
        const x = u * sx;
        const y = v * sy;
        const ix = Math.floor(x);
        const iy = Math.floor(y);
        let d1 = 999, d2 = 999, cid = 0;
        const sxInt = sx | 0;

        for (let dy = -1; dy <= 1; dy++) {
            const cy = iy + dy;
            for (let dx = -1; dx <= 1; dx++) {
                const cx = ix + dx;
                const cxMod = tileU ? (((cx % sxInt) + sxInt) % sxInt) : cx;
                const h1 = ihash(cxMod, cy, seed);
                const h2 = ihash(cxMod, cy, seed + 79);
                const px = cx + 0.5 + (h1 - 0.5) * jitter;
                const py = cy + 0.5 + (h2 - 0.5) * jitter;
                const ddx = px - x;
                const ddy = py - y;
                const d = ddx * ddx + ddy * ddy;
                if (d < d1) {
                    d2 = d1;
                    d1 = d;
                    cid = h1;
                } else if (d < d2) {
                    d2 = d;
                }
            }
        }
        const d1s = Math.sqrt(d1);
        const d2s = Math.sqrt(d2);
        const edge = Math.max(0, Math.min(1, (d2s - d1s) * 2.5));
        const dome = Math.pow(Math.max(0, 1 - Math.min(1, d1s * 1.48)), 0.55);
        return { edge, dome, cid };
    }

    // Crée une paire { colorMap, bumpMap } à partir d'un shader CPU pixelFn(u, v, outRGBH)
    // Note WebGL : CanvasTexture.flipY = true par défaut => py=0 correspond à v=1.0, py=size-1 à v=0.0
    function createTexturePair(size, pixelFn) {
        const colCanvas = document.createElement('canvas');
        colCanvas.width = colCanvas.height = size;
        const colCtx = colCanvas.getContext('2d');
        const colImg = colCtx.createImageData(size, size);
        const cData = colImg.data;

        const bmpCanvas = document.createElement('canvas');
        bmpCanvas.width = bmpCanvas.height = size;
        const bmpCtx = bmpCanvas.getContext('2d');
        const bmpImg = bmpCtx.createImageData(size, size);
        const bData = bmpImg.data;

        const out = [0, 0, 0, 0.5];
        const inv = 1 / (size - 1);
        let idx = 0;

        for (let py = 0; py < size; py++) {
            const v = 1.0 - py * inv;
            for (let px = 0; px < size; px++) {
                const u = px * inv;
                pixelFn(u, v, out);
                cData[idx] = Math.round(clamp01(out[0]) * 255);
                cData[idx + 1] = Math.round(clamp01(out[1]) * 255);
                cData[idx + 2] = Math.round(clamp01(out[2]) * 255);
                cData[idx + 3] = 255;

                const hv = Math.round(clamp01(out[3]) * 255);
                bData[idx] = hv;
                bData[idx + 1] = hv;
                bData[idx + 2] = hv;
                bData[idx + 3] = 255;
                idx += 4;
            }
        }
        colCtx.putImageData(colImg, 0, 0);
        bmpCtx.putImageData(bmpImg, 0, 0);

        const colorMap = new THREE.CanvasTexture(colCanvas);
        const bumpMap = new THREE.CanvasTexture(bmpCanvas);
        colorMap.encoding = THREE.sRGBEncoding;
        colorMap.anisotropy = 4;
        bumpMap.anisotropy = 4;
        return { colorMap, bumpMap };
    }

    function createColorMapOnly(size, pixelFn) {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = size;
        const ctx = canvas.getContext('2d');
        const img = ctx.createImageData(size, size);
        const d = img.data;
        const out = [0, 0, 0, 0.5];
        const inv = 1 / (size - 1);
        let idx = 0;
        for (let py = 0; py < size; py++) {
            const v = 1.0 - py * inv;
            for (let px = 0; px < size; px++) {
                pixelFn(px * inv, v, out);
                d[idx] = Math.round(clamp01(out[0]) * 255);
                d[idx + 1] = Math.round(clamp01(out[1]) * 255);
                d[idx + 2] = Math.round(clamp01(out[2]) * 255);
                d[idx + 3] = 255;
                idx += 4;
            }
        }
        ctx.putImageData(img, 0, 0);
        const tex = new THREE.CanvasTexture(canvas);
        tex.encoding = THREE.sRGBEncoding;
        tex.anisotropy = 4;
        return tex;
    }

    // 1. PEAU DU CORPS : Terre cuite chaude, stries diagonales gris-taupe, rangée de scutelles & ventre sable
    const bodyHide = createTexturePair(512, (u, v, out) => {
        const dorsal = Math.cos(u * Math.PI * 2);
        const flank = Math.abs(Math.sin(u * Math.PI * 2));

        const p1 = voronoiPebble(u, v, 96, 118, 0.86, 17, true);
        const p2 = voronoiPebble(u, v, 38, 46, 0.80, 53, true);
        const backW = clamp01(dorsal * 0.5 + 0.5);
        const edge = mix(p1.edge, Math.min(p1.edge * 1.05, p2.edge * 1.25), backW * 0.35);
        const dome = mix(p1.dome, p1.dome * 0.72 + p2.dome * 0.28, backW * 0.35);

        const n1 = fbm(u * 14, v * 18, 3, 101);
        const n2 = fbm(u * 30 + 3.1, v * 36 + 1.7, 2, 211);

        let r = 0.64 + p1.cid * 0.08;
        let g = 0.33 + p1.cid * 0.05;
        let b = 0.14 + p1.cid * 0.03;

        // Ventre sable-beige chaud
        const bellyT = clamp01((-dorsal - 0.16) * 1.2 + (n1 - 0.5) * 0.22);
        r = mix(r, 0.81, bellyT);
        g = mix(g, 0.64, bellyT);
        b = mix(b, 0.46, bellyT);

        // Crête dorsale plus sombre
        const spineT = clamp01((dorsal - 0.78) * 3.8 + (n2 - 0.5) * 0.22) * 0.68;
        r = mix(r, 0.35, spineT);
        g = mix(g, 0.17, spineT);
        b = mix(b, 0.08, spineT);

        // Bandes et marbrures diagonales gris-taupe sur le dos et les épaules
        const warp = (n1 - 0.5) * 0.12 + (n2 - 0.5) * 0.06;
        const vDiag = v + flank * 0.16 + warp;
        const b1 = Math.exp(-Math.pow((vDiag - 0.75) / 0.025, 2));
        const b2 = Math.exp(-Math.pow((vDiag - 0.58) / 0.021, 2));
        const b3 = Math.exp(-Math.pow((vDiag - 0.41) / 0.024, 2)) * clamp01((n1 - 0.42) * 4.0);
        const hipSpots = Math.exp(-Math.pow((v - 0.34) / 0.11, 2)) * clamp01((n2 - 0.58) * 5.0);
        const rawBand = (b1 + b2 * 0.90 + b3 * 0.85 + hipSpots * 0.75) * clamp01((dorsal + 0.12) * 1.5);
        const taupeT = clamp01((rawBand + (n2 - 0.5) * 0.45 - 0.24) * 3.8) * 0.88;
        r = mix(r, 0.66, taupeT);
        g = mix(g, 0.60, taupeT);
        b = mix(b, 0.54, taupeT);

        // Rangée de 5 scutelles ostéodermiques ovales bombées & caillouteuses sur le haut du flanc
        let scuteBump = 0;
        if (dorsal > 0.18 && v > 0.48 && v < 0.69 && flank > 0.56 && flank < 0.80) {
            const sv = ((v - 0.48) / 0.21) * 5.0;
            const svIdx = Math.floor(sv);
            const svF = Math.abs((sv % 1.0) - 0.5) * 2.0;
            const sfF = Math.abs(flank - 0.68) / 0.076;
            const scaleV = 1.0 + 0.12 * Math.sin(svIdx * 1.9);
            const wob = (n2 - 0.5) * 0.22 + (p1.cid - 0.5) * 0.14;
            const scD = (Math.sqrt(svF * svF * 0.90 + sfF * sfF * 1.38) / scaleV) + wob;
            if (scD < 0.86) {
                if (scD > 0.72) {
                    const ringT = clamp01(1.0 - Math.abs(scD - 0.79) / 0.07) * 0.36;
                    r = mix(r, 0.28, ringT);
                    g = mix(g, 0.16, ringT);
                    b = mix(b, 0.10, ringT);
                    scuteBump = -0.10;
                } else {
                    const innerT = clamp01(1.0 - scD / 0.72);
                    const pebW = p1.dome * 0.8 + p2.cid * 0.2;
                    const fillT = 0.55 + 0.32 * innerT;
                    r = mix(r, mix(0.62, 0.72, pebW), fillT);
                    g = mix(g, mix(0.55, 0.65, pebW), fillT);
                    b = mix(b, mix(0.48, 0.57, pebW), fillT);
                    scuteBump = 0.14 + 0.28 * Math.pow(innerT, 0.7) + p1.dome * 0.14;
                }
            }
        }

        // Plis cutanés horizontaux de la gorge / cou
        let foldH = 0;
        if (v > 0.76 && dorsal < 0.25) {
            const fw = Math.sin((v - 0.76) * 200.0 + n1 * 4.5);
            foldH = fw * 0.13 * clamp01((0.25 - dorsal) * 2.0);
            if (fw < -0.4) {
                r = mix(r, 0.26, 0.20);
                g = mix(g, 0.12, 0.20);
                b = mix(b, 0.06, 0.20);
            }
        }

        const crev = clamp01(1.0 - edge) * 0.42;
        out[0] = mix(r, 0.26, crev);
        out[1] = mix(g, 0.12, crev);
        out[2] = mix(b, 0.06, crev);
        out[3] = 0.35 + dome * 0.42 + n2 * 0.08 + scuteBump + foldH - crev * 0.40;
    });

    // 2. PEAU DES MEMBRES : Grain serré uniforme terre cuite + intérieur sable + plis articulaires
    const limbHide = createTexturePair(384, (u, v, out) => {
        const p1 = voronoiPebble(u, v, 36, 42, 0.86, 31, true);
        const n1 = fbm(u * 10, v * 12, 2, 88);
        const dorsal = Math.cos(u * Math.PI * 2);

        let r = 0.64 + p1.cid * 0.07;
        let g = 0.34 + p1.cid * 0.04;
        let b = 0.15 + p1.cid * 0.02;

        const tanT = clamp01((-dorsal * 0.38 + 0.16) * 0.42 + clamp01((v - 0.66) * 1.3) * 0.24 + (n1 - 0.5) * 0.12);
        r = mix(r, 0.78, tanT);
        g = mix(g, 0.61, tanT);
        b = mix(b, 0.43, tanT);

        // Plis cutanés distaux subtils en relief (sans rayures sombres sur la cuisse/épaule)
        let fold = 0;
        if (v > 0.75 && v < 0.90 && dorsal > -0.25) {
            const fw = Math.sin((v - 0.75) * 105.0 + n1 * 3.0);
            fold = fw * 0.10 * clamp01((dorsal + 0.25) * 1.2);
            if (fw < -0.45) {
                r = mix(r, 0.29, 0.08);
                g = mix(g, 0.15, 0.08);
                b = mix(b, 0.07, 0.08);
            }
        }

        const crev = clamp01(1.0 - p1.edge) * 0.44;
        out[0] = mix(r, 0.25, crev);
        out[1] = mix(g, 0.11, crev);
        out[2] = mix(b, 0.05, crev);
        out[3] = 0.36 + p1.dome * 0.44 + fold - crev * 0.40;
    });

    // 3. BOUCLIER DE COLLERETTE : Deux grands ocelles (rose poudré + sauge + anneau anthracite + centre ocre)
    //    et taches mosaïques pastel sur les coins jugaux inférieurs
    const frillShield = createTexturePair(512, (u, v, out) => {
        const p1 = voronoiPebble(u, v, 64, 54, 0.85, 41, false);
        const n1 = fbm(u * 12, v * 12, 3, 131);
        const n2 = fbm(u * 26, v * 26, 2, 177);

        let r = 0.62 + p1.cid * 0.08;
        let g = 0.31 + p1.cid * 0.05;
        let b = 0.14 + p1.cid * 0.03;

        const midTaupe = Math.exp(-Math.pow((u - 0.5) / 0.14, 2)) *
            Math.exp(-Math.pow((v - 0.46) / 0.20, 2)) *
            clamp01((n1 - 0.36) * 2.5) * 0.72;
        r = mix(r, 0.64, midTaupe);
        g = mix(g, 0.58, midTaupe);
        b = mix(b, 0.52, midTaupe);

        const sx = Math.abs(u - 0.5);
        const dxOc = (sx - 0.185) * 1.15;
        const dyOc = v - 0.675;
        const wob = (n1 - 0.5) * 0.022 + (p1.cid - 0.5) * 0.008;
        const rOc = Math.sqrt(dxOc * dxOc + dyOc * dyOc) + wob;

        if (rOc < 0.155) {
            if (rOc < 0.044) {
                const ct = p1.cid * 0.32;
                r = mix(0.71, 0.60, ct);
                g = mix(0.54, 0.44, ct);
                b = mix(0.32, 0.24, ct);
            } else if (rOc < 0.086) {
                const ct = p1.cid * 0.38;
                r = mix(0.24, 0.33, ct);
                g = mix(0.26, 0.36, ct);
                b = mix(0.22, 0.31, ct);
            } else {
                const mintW = clamp01(0.45 + (0.65 - v) * 2.5 + (n2 - 0.5) * 1.1 + (p1.cid - 0.5) * 0.40);
                const ringR = mix(0.72, 0.58, mintW);
                const ringG = mix(0.59, 0.69, mintW);
                const ringB = mix(0.58, 0.63, mintW);
                const fade = clamp01((0.155 - rOc) / 0.030) * 0.94;
                r = mix(r, ringR, fade);
                g = mix(g, ringG, fade);
                b = mix(b, ringB, fade);
            }
        }

        // Traînée sauge-menthe vers l'avant de la crête
        const dxTr = (sx - 0.13) * 1.4;
        const dyTr = (v - 0.49) * 1.25;
        const rTr = Math.sqrt(dxTr * dxTr + dyTr * dyTr) + (n1 - 0.5) * 0.04;
        if (rTr < 0.078) {
            const trW = clamp01((0.078 - rTr) / 0.03) * clamp01((n2 - 0.35) * 3.0) * 0.85;
            r = mix(r, 0.58, trW);
            g = mix(g, 0.69, trW);
            b = mix(b, 0.63, trW);
        }

        const dxP = (sx - 0.23) * 1.05;
        const dyP = (v - 0.36) * 1.15;
        const rP = Math.sqrt(dxP * dxP + dyP * dyP) + (n1 - 0.5) * 0.042;
        if (rP < 0.110) {
            const pW = clamp01((0.110 - rP) / 0.035) * 0.88;
            const isMint = clamp01((n2 - 0.52) * 6.2 + (p1.cid - 0.5) * 0.65);
            r = mix(r, mix(0.72, 0.58, isMint), pW);
            g = mix(g, mix(0.59, 0.69, isMint), pW);
            b = mix(b, mix(0.58, 0.63, isMint), pW);
        }

        const crev = clamp01(1.0 - p1.edge) * 0.50;
        out[0] = mix(r, 0.23, crev);
        out[1] = mix(g, 0.11, crev);
        out[2] = mix(b, 0.05, crev);
        out[3] = 0.32 + p1.dome * 0.48 + (n2 - 0.5) * 0.08 - crev * 0.44;
    });

    // 4. MUSEAU & CRÂNE : Écailles caillouteuses terre cuite + arcade/joue taupe + mâchoire sable
    const snoutHide = createTexturePair(384, (u, v, out) => {
        const p1 = voronoiPebble(u, v, 48, 40, 0.86, 67, true);
        const n1 = fbm(u * 10, v * 10, 3, 191);
        const n2 = fbm(u * 22, v * 22, 2, 241);
        const dorsal = Math.cos(u * Math.PI * 2);
        const flank = Math.abs(Math.sin(u * Math.PI * 2));

        let r = 0.64 + p1.cid * 0.08;
        let g = 0.34 + p1.cid * 0.05;
        let b = 0.15 + p1.cid * 0.03;

        const tanT = clamp01((-dorsal - 0.05) * 1.15 + clamp01((v - 0.54) * 1.35) * 0.32 + (n1 - 0.5) * 0.14);
        r = mix(r, 0.82, tanT);
        g = mix(g, 0.66, tanT);
        b = mix(b, 0.50, tanT);

        const browPatch = Math.exp(-Math.pow((v - 0.34) / 0.13, 2)) * clamp01((dorsal + 0.35) * 1.6) * clamp01((n1 - 0.36) * 3.2);
        const cheekSlash = Math.exp(-Math.pow((v - (0.18 + flank * 0.25)) / 0.065, 2)) * clamp01((flank - 0.35) * 2.0) * clamp01((n2 - 0.38) * 3.2);
        const taupeT = clamp01(browPatch * 0.85 + cheekSlash * 0.78);
        r = mix(r, 0.64, taupeT);
        g = mix(g, 0.58, taupeT);
        b = mix(b, 0.52, taupeT);

        const narisAo = Math.exp(-Math.pow((v - 0.76) / 0.05, 2)) * Math.exp(-Math.pow((flank - 0.92) / 0.14, 2)) * 0.45;
        r = mix(r, 0.34, narisAo);
        g = mix(g, 0.18, narisAo);
        b = mix(b, 0.10, narisAo);

        const crev = clamp01(1.0 - p1.edge) * 0.44;
        out[0] = mix(r, 0.25, crev);
        out[1] = mix(g, 0.12, crev);
        out[2] = mix(b, 0.05, crev);
        out[3] = 0.36 + p1.dome * 0.42 - crev * 0.40;
    });

    // 5. BOSSE NASALE PACHYOSTOTIQUE : Os rugueux terre cuite & gris-taupe profondément fissuré
    const keratinBoss = createTexturePair(384, (u, v, out) => {
        const p1 = voronoiPebble(u, v, 32, 32, 0.88, 71, false);
        const p2 = voronoiPebble(u, v, 12, 12, 0.85, 97, false);
        const n1 = fbm(u * 10, v * 10, 3, 223);
        const n2 = fbm(u * 24, v * 28, 2, 251);

        const r0 = 0.60 + p1.cid * 0.08;
        const g0 = 0.34 + p1.cid * 0.05;
        const b0 = 0.17 + p1.cid * 0.03;

        const tTaupe = clamp01(0.30 + (n1 - 0.5) * 1.05 + (1.0 - p2.dome) * 0.18) * 0.68;
        const r = mix(r0, 0.63, tTaupe);
        const g = mix(g0, 0.56, tTaupe);
        const b = mix(b0, 0.49, tTaupe);

        const transCrack = Math.exp(-Math.pow((v - 0.65 + (n2 - 0.5) * 0.06) / 0.024, 2)) * clamp01(1.0 - Math.abs(u - 0.5) * 1.8) * 0.42;
        const crev = clamp01(clamp01(1.0 - Math.min(p1.edge, p2.edge * 1.28)) * 0.54 + transCrack);
        out[0] = mix(r, 0.24, crev);
        out[1] = mix(g, 0.13, crev);
        out[2] = mix(b, 0.07, crev);
        out[3] = 0.28 + p2.dome * 0.34 + p1.dome * 0.30 - crev * 0.44;
    });

    // 6. KÉRATINE DES CORNES & BEC PERROQUET : Ivoire-beige fibreux vieilli
    const hornKeratinMap = createTexturePair(256, (u, v, out) => {
        const fib = Math.sin(u * 120.0 + fbm(u * 6, v * 4, 2, 55) * 8.0) * 0.5 + 0.5;
        const n1 = fbm(u * 8, v * 10, 2, 83);
        const tCol = clamp01(0.45 + fib * 0.40 + (n1 - 0.5) * 0.25);
        let r = mix(0.46, 0.76, tCol);
        let g = mix(0.35, 0.67, tCol);
        let b = mix(0.24, 0.53, tCol);
        if (v > 0.72) {
            const tt = clamp01((v - 0.72) / 0.28) * 0.55;
            r = mix(r, 0.36, tt);
            g = mix(g, 0.27, tt);
            b = mix(b, 0.19, tt);
        } else if (v < 0.15) {
            const bt = clamp01((0.15 - v) / 0.15) * 0.65;
            r = mix(r, 0.50, bt);
            g = mix(g, 0.32, bt);
            b = mix(b, 0.17, bt);
        }
        out[0] = r;
        out[1] = g;
        out[2] = b;
        out[3] = 0.38 + fib * 0.35 + n1 * 0.15;
    });

    // 7. SABOTS ARRONDIS
    const hoofMap = createTexturePair(192, (u, v, out) => {
        const fib = Math.sin(u * 80.0) * 0.5 + 0.5;
        const t = 0.4 + fib * 0.45;
        let r = mix(0.46, 0.62, t);
        let g = mix(0.35, 0.50, t);
        let b = mix(0.25, 0.38, t);
        if (v > 0.65) {
            const tt = ((v - 0.65) / 0.35) * 0.55;
            r = mix(r, 0.32, tt);
            g = mix(g, 0.24, tt);
            b = mix(b, 0.17, tt);
        }
        out[0] = r;
        out[1] = g;
        out[2] = b;
        out[3] = 0.4 + fib * 0.3;
    });

    // 8. IRIS ACAJOU-AMBRE SOMBRE + PUPILLE NOIRE CENTRÉE (uv=(0.5, 0.5))
    const amberEye = createColorMapOnly(256, (u, v, out) => {
        const dx = u - 0.5;
        const dy = v - 0.5;
        const r = Math.sqrt(dx * dx + dy * dy);
        const ang = Math.atan2(dy, dx);
        const n = fbm(Math.cos(ang) * 4 + r * 12, Math.sin(ang) * 4 + r * 12, 2, 313);
        if (r < 0.19) {
            out[0] = 0.012; out[1] = 0.012; out[2] = 0.012;
        } else if (r < 0.40) {
            const t = clamp01((r - 0.19) / 0.21 + (n - 0.5) * 0.2);
            out[0] = mix(0.42, 0.14, t);
            out[1] = mix(0.17, 0.05, t);
            out[2] = mix(0.05, 0.015, t);
        } else {
            out[0] = 0.07; out[1] = 0.03; out[2] = 0.015;
        }
    });

    _cachedPachyPBRMaps = {
        bodyHide,
        limbHide,
        frillShield,
        snoutHide,
        keratinBoss,
        hornKeratinMap,
        hoofMap,
        amberEye
    };
    return _cachedPachyPBRMaps;
}

// Capsule anatomique lissée pour les segments osseux internes du mode X-Ray
function createPachyCapsuleGeometry(radius, length, capSegments = 8, radialSegs = 12) {
    const geo = new THREE.CylinderGeometry(radius, radius, length + radius * 2, radialSegs, capSegments * 2 + 2, false);
    const pos = geo.attributes.position;
    const halfLen = length * 0.5;

    for (let i = 0; i < pos.count; i++) {
        const vx = pos.getX(i);
        const vy = pos.getY(i);
        const vz = pos.getZ(i);
        const rLen = Math.hypot(vx, vz);
        const angle = Math.atan2(vz, vx);

        if (vy > 0.0001) {
            const ringIdx = Math.round(((halfLen + radius - vy) / (length + radius * 2)) * (capSegments * 2 + 2));
            let phi, centerOffset;
            if (ringIdx <= capSegments) {
                phi = (ringIdx / capSegments) * (Math.PI * 0.5);
                centerOffset = halfLen;
            } else {
                phi = Math.PI * 0.5;
                centerOffset = THREE.MathUtils.clamp(vy, -halfLen, halfLen);
            }
            const sinPhi = Math.sin(phi);
            const cosPhi = Math.cos(phi);
            if (rLen > 0.00001) {
                pos.setXYZ(i, Math.cos(angle) * radius * sinPhi, centerOffset + radius * cosPhi, Math.sin(angle) * radius * sinPhi);
            } else {
                pos.setXYZ(i, 0, centerOffset + radius * cosPhi, 0);
            }
        } else if (vy < -0.0001) {
            const ringIdx = Math.round(((halfLen + radius - vy) / (length + radius * 2)) * (capSegments * 2 + 2));
            let phi, centerOffset;
            if (ringIdx <= capSegments * 1.1) {
                phi = Math.PI * 0.5;
                centerOffset = THREE.MathUtils.clamp(vy, -halfLen, halfLen);
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
    primaryColor: 0xb85d28,
    secondaryColor: 0x5c2c12,
    accentColor: 0xd4a373,
    cssPrimary: '#b85d28',
    scale: 1.0,
    previewScale: 0.90,
    stats: { pow: 88, spd: 76, def: 92 },
    maxHp: 1100,
    walkSpeed: 8.2,
    special1Name: 'Charge Boréale (H)',
    special2Name: 'Cornes Sismiques (T)',
    fatalityName: 'Impact Crânien Polaire (R)',
    moveStyle: 'Trot quadrupède puissant, coup de bosse nasale pachyostotique et soulèvement de collerette ocellée.',
    fatalityDesc: 'Gratte le sol, charge à vitesse supersonique avec sa bosse nasale blindée, pulvérise le torse ennemi et empale son crâne.',
    skins: [
        { name: 'Ocellus Terre Cuite', primary: 0xb85d28, secondary: 0x5c2c12, accent: 0xd4a373, belly: 0xdfc09a, isDefaultPBR: true },
        { name: 'Glacial Ice Centrosaur', primary: 0x0284c7, secondary: 0x0c4a6e, accent: 0x38bdf8, belly: 0xe0f2fe },
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
        const maps = getPachyPBRMaps();
        const clamp01 = _pachyClamp01;
        const mix = _pachyMix;

        const isDefaultSkin = Boolean(skin && skin.isDefaultPBR);
        const bodyTint = isDefaultSkin ? 0xffffff : (skin.primary || 0x0284c7);
        const limbTint = isDefaultSkin ? 0xffffff : (skin.primary || 0x0284c7);
        const frillTint = isDefaultSkin ? 0xffffff : (skin.primary || 0x0284c7);
        const bossTint = isDefaultSkin ? 0xffffff : (skin.secondary || 0x0c4a6e);
        const hornTint = isDefaultSkin ? 0xffffff : (skin.accent || 0x38bdf8);

        // =====================================================================
        // 1. PALETTE DE MATÉRIAUX PHYSIQUEMENT BASÉS (PBR)
        // =====================================================================
        const materials = {
            bodyHide: new THREE.MeshStandardMaterial({
                color: bodyTint,
                map: maps.bodyHide.colorMap,
                bumpMap: maps.bodyHide.bumpMap,
                bumpScale: 0.026,
                roughness: 0.78,
                metalness: 0.03
            }),
            limbHide: new THREE.MeshStandardMaterial({
                color: limbTint,
                map: maps.limbHide.colorMap,
                bumpMap: maps.limbHide.bumpMap,
                bumpScale: 0.024,
                roughness: 0.80,
                metalness: 0.03
            }),
            frillShield: new THREE.MeshStandardMaterial({
                color: frillTint,
                map: maps.frillShield.colorMap,
                bumpMap: maps.frillShield.bumpMap,
                bumpScale: 0.030,
                roughness: 0.78,
                metalness: 0.03
            }),
            snoutHide: new THREE.MeshStandardMaterial({
                color: bodyTint,
                map: maps.snoutHide.colorMap,
                bumpMap: maps.snoutHide.bumpMap,
                bumpScale: 0.024,
                roughness: 0.78,
                metalness: 0.03
            }),
            keratinBoss: new THREE.MeshStandardMaterial({
                color: bossTint,
                map: maps.keratinBoss.colorMap,
                bumpMap: maps.keratinBoss.bumpMap,
                bumpScale: 0.038,
                roughness: 0.84,
                metalness: 0.03
            }),
            hornKeratin: new THREE.MeshStandardMaterial({
                color: hornTint,
                map: maps.hornKeratinMap.colorMap,
                bumpMap: maps.hornKeratinMap.bumpMap,
                bumpScale: 0.022,
                roughness: 0.62,
                metalness: 0.04
            }),
            beakKeratin: new THREE.MeshStandardMaterial({
                color: isDefaultSkin ? 0xffffff : hornTint,
                map: maps.hornKeratinMap.colorMap,
                bumpMap: maps.hornKeratinMap.bumpMap,
                bumpScale: 0.020,
                roughness: 0.58,
                metalness: 0.05
            }),
            scalyPad: new THREE.MeshStandardMaterial({
                color: limbTint,
                map: maps.limbHide.colorMap,
                bumpMap: maps.limbHide.bumpMap,
                bumpScale: 0.022,
                roughness: 0.82,
                metalness: 0.03
            }),
            hoof: new THREE.MeshStandardMaterial({
                color: isDefaultSkin ? 0xffffff : hornTint,
                map: maps.hoofMap.colorMap,
                bumpMap: maps.hoofMap.bumpMap,
                bumpScale: 0.014,
                roughness: 0.68,
                metalness: 0.05
            }),
            oralMucosa: new THREE.MeshPhysicalMaterial({
                color: 0x7c3e3a,
                roughness: 0.42,
                clearcoat: 0.35,
                clearcoatRoughness: 0.25,
                side: THREE.DoubleSide
            }),
            cavityDark: new THREE.MeshStandardMaterial({
                color: 0x160909,
                roughness: 0.78
            }),
            eyeIris: new THREE.MeshPhysicalMaterial({
                color: 0xffffff,
                map: maps.amberEye,
                roughness: 0.14,
                metalness: 0.0,
                clearcoat: 0.35,
                clearcoatRoughness: 0.08
            }),
            boneXray: new THREE.MeshStandardMaterial({
                color: 0xf8fafc,
                emissive: isDefaultSkin ? 0xd97706 : (skin.accent || 0x38bdf8),
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

        // Fonction utilitaire : construit un maillage paramétrique à quads lissés (winding vérifié)
        function buildParametricGridGeo(cols, rows, evalFn, closeU = false) {
            const geo = new THREE.BufferGeometry();
            const colCount = closeU ? cols : cols + 1;
            const totalVerts = rows * colCount;
            const positions = new Float32Array(totalVerts * 3);
            const uvs = new Float32Array(totalVerts * 2);
            const pt = [0, 0, 0, 0, 0];

            let vi = 0;
            for (let r = 0; r < rows; r++) {
                const tv = r / (rows - 1);
                for (let c = 0; c < colCount; c++) {
                    const tu = closeU ? (c / cols) : (c / cols);
                    evalFn(tu, tv, pt);
                    positions[vi * 3] = pt[0];
                    positions[vi * 3 + 1] = pt[1];
                    positions[vi * 3 + 2] = pt[2];
                    uvs[vi * 2] = pt[3];
                    uvs[vi * 2 + 1] = pt[4];
                    vi++;
                }
            }

            const indices = [];
            const segEnd = closeU ? cols : cols;
            for (let r = 0; r < rows - 1; r++) {
                const row0 = r * colCount;
                const row1 = (r + 1) * colCount;
                for (let c = 0; c < segEnd; c++) {
                    const cNext = closeU ? ((c + 1) % cols) : (c + 1);
                    const a = row0 + c;
                    const b = row0 + cNext;
                    const d = row1 + c;
                    const e = row1 + cNext;
                    // Triangle order giving (d - a) x (b - a) outward normal
                    indices.push(a, d, b);
                    indices.push(b, d, e);
                }
            }

            geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
            geo.setIndex(indices);
            geo.computeVertexNormals();
            return geo;
        }

        // Helper pour os X-Ray interne
        function createBoneVisual(pA, pB, r) {
            const dist = pA.distanceTo(pB);
            const boneGeo = createPachyCapsuleGeometry(r, Math.max(0.02, dist - r * 0.5), 6, 10);
            const bone = new THREE.Mesh(boneGeo, materials.boneXray);
            bone.position.copy(pA).add(pB).multiplyScalar(0.5);
            const dir = new THREE.Vector3().subVectors(pB, pA).normalize();
            bone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
            bone.visible = false;
            skeletonMeshes.push(bone);
            return bone;
        }

        // Corne courbe quadratique (base élargie + cannelures kératiniques, normale sortante vérifiée)
        function createCurvedHornMesh(pts, rStart, rEnd, mat, radialSegs = 14, tubularSegs = 18) {
            const P0 = new THREE.Vector3(pts[0][0], pts[0][1], pts[0][2]);
            const P1 = new THREE.Vector3(pts[1][0], pts[1][1], pts[1][2]);
            const P2 = new THREE.Vector3(pts[2][0], pts[2][1], pts[2][2]);
            const pos = new THREE.Vector3();
            const tan = new THREE.Vector3();
            const upRef = new THREE.Vector3();
            const binorm = new THREE.Vector3();
            const norm = new THREE.Vector3();
            const rMid = rStart * 0.58 + rEnd * 0.42;

            const geo = buildParametricGridGeo(radialSegs, tubularSegs, (tu, tv, out) => {
                const it = 1.0 - tv;
                pos.set(0, 0, 0)
                    .addScaledVector(P0, it * it)
                    .addScaledVector(P1, 2 * it * tv)
                    .addScaledVector(P2, tv * tv);

                tan.copy(P1).sub(P0).multiplyScalar(2 * it)
                    .addScaledVector(new THREE.Vector3().copy(P2).sub(P1), 2 * tv);
                if (tan.lengthSq() < 1e-8) tan.set(0, 1, 0);
                tan.normalize();

                upRef.set(Math.abs(tan.y) < 0.9 ? 0 : 1, Math.abs(tan.y) < 0.9 ? 1 : 0, 0);
                binorm.crossVectors(tan, upRef).normalize();
                norm.crossVectors(binorm, tan).normalize();

                let rad = rStart * it * it + rMid * 2 * it * tv + rEnd * tv * tv;
                if (tv < 0.16) rad *= 1.0 + 0.22 * (1.0 - tv / 0.16);

                const ang = -tu * Math.PI * 2;
                const flute = 1.0 + 0.055 * Math.cos(ang * 5.0) * Math.sin(tv * Math.PI);
                const c = Math.cos(ang) * rad * 1.05 * flute;
                const s = Math.sin(ang) * rad * 0.90 * flute;

                out[0] = pos.x + binorm.x * c + norm.x * s;
                out[1] = pos.y + binorm.y * c + norm.y * s;
                out[2] = pos.z + binorm.z * c + norm.z * s;
                out[3] = tu;
                out[4] = tv;
            }, true);
            return registerSkin(new THREE.Mesh(geo, mat));
        }

        // Segment de membre anatomique à rotule hémisphérique continue (zéro rebord en escalier)
        function createBallSocketLimbMesh(length, rStart, rMid, rEnd, midBulgeT = 0.42, radialSegs = 18, heightSegs = 22) {
            const geo = buildParametricGridGeo(radialSegs, heightSegs, (tu, tv, out) => {
                const ang = tu * Math.PI * 2;
                let y = 0, rad = rStart;
                if (tv < 0.16) {
                    const phi = (tv / 0.16) * (Math.PI * 0.5);
                    y = Math.cos(phi) * rStart * 0.90;
                    rad = Math.sin(phi) * rStart;
                } else if (tv > 0.84) {
                    const phi = ((1.0 - tv) / 0.16) * (Math.PI * 0.5);
                    y = -length - Math.cos(phi) * rEnd * 0.90;
                    rad = Math.sin(phi) * rEnd;
                } else {
                    const lt = (tv - 0.16) / 0.68;
                    y = -lt * length;
                    const linR = mix(rStart, rEnd, lt);
                    const bulge = (rMid - mix(rStart, rEnd, midBulgeT)) * Math.exp(-Math.pow((lt - midBulgeT) / 0.34, 2));
                    rad = linR + bulge;
                }
                const ca = Math.cos(ang);
                const sa = Math.sin(ang);
                out[0] = ca * rad * 0.96;
                out[1] = y;
                out[2] = sa * rad * 1.06;
                out[3] = tu;
                out[4] = tv;
            }, true);
            return registerSkin(new THREE.Mesh(geo, materials.limbHide));
        }

        // =====================================================================
        // 2. HIERARCHIE PRINCIPALE & NOEUDS D'ANIMATION (API PRIG)
        // =====================================================================
        const pachy = new THREE.Group();
        pachy.position.set(0, -1.65, 0);
        pachy.rotation.y = Math.PI / 2;
        rig.torso.add(pachy);

        const rootJoint = new THREE.Group();
        rootJoint.position.set(0, 1.65, 0);
        pachy.add(rootJoint);

        const torsoGroup = new THREE.Group();
        rootJoint.add(torsoGroup);

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

        // 5 Vertèbres caudales avec légère courbure relevée vers l'extrémité (comme la référence)
        const caudalSegments = [];
        const caudalLengths = [0.34, 0.34, 0.32, 0.30, 0.28];
        const caudalOffsetsY = [-0.08, -0.10, -0.06, 0.02, 0.06];
        const caudalRadiiX = [0.44, 0.33, 0.22, 0.12, 0.055];
        const caudalRadiiY = [0.54, 0.40, 0.26, 0.145, 0.065];

        let parentCaudal = torsoGroup;
        for (let i = 0; i < caudalLengths.length; i++) {
            const seg = new THREE.Group();
            if (i === 0) {
                seg.position.set(0, -0.06, -0.92);
            } else {
                seg.position.set(0, caudalOffsetsY[i], -caudalLengths[i - 1]);
            }
            parentCaudal.add(seg);
            caudalSegments.push(seg);
            seg.add(createBoneVisual(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, caudalOffsetsY[i] * 0.5, -caudalLengths[i]), 0.052 - i * 0.007));
            parentCaudal = seg;
        }

        const tailTipNode = new THREE.Group();
        tailTipNode.position.set(0, 0.08, -caudalLengths[caudalLengths.length - 1]);
        parentCaudal.add(tailTipNode);

        // Stations anatomiques du bassin, lombaires et thorax
        const pelvisRearNode = new THREE.Group();
        pelvisRearNode.position.set(0, 0.04, -0.66);
        torsoGroup.add(pelvisRearNode);

        const hipsCenterNode = new THREE.Group();
        hipsCenterNode.position.set(0, 0.08, -0.24);
        torsoGroup.add(hipsCenterNode);

        const lumbarNode = new THREE.Group();
        lumbarNode.position.set(0, 0.04, 0.22);
        torsoGroup.add(lumbarNode);

        const thoraxNode = new THREE.Group();
        thoraxNode.position.set(0, -0.04, 0.66);
        torsoGroup.add(thoraxNode);

        // Squelette interne X-Ray
        torsoGroup.add(createBoneVisual(new THREE.Vector3(0, 0.08, -0.88), new THREE.Vector3(0, -0.04, 0.88), 0.075));
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

        // 3 Vertèbres cervicales solides
        const neckSegments = [];
        const numNeckVerts = 3;
        const neckSegLen = 0.19;
        let parentNeck = torsoGroup;
        for (let i = 0; i < numNeckVerts; i++) {
            const segGroup = new THREE.Group();
            if (i === 0) segGroup.position.set(0, -0.11, 0.86);
            else segGroup.position.set(0, -0.01, neckSegLen);
            parentNeck.add(segGroup);
            neckSegments.push(segGroup);
            segGroup.add(createBoneVisual(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, neckSegLen), 0.065 - i * 0.004));
            parentNeck = segGroup;
        }

        // Adaptateur tête (rig.headGroup garde +X avant et rotation.z en tangage pour les animations)
        const headAdapter = new THREE.Group();
        headAdapter.position.set(0, 0.03, neckSegLen);
        headAdapter.rotation.y = -Math.PI / 2;
        parentNeck.add(headAdapter);

        rig.headGroup.position.set(0, 0, 0);
        rig.headGroup.rotation.set(0, 0, 0);
        headAdapter.add(rig.headGroup);

        const headGroup = new THREE.Group();
        headGroup.rotation.y = Math.PI / 2;
        rig.headGroup.add(headGroup);

        const skullBaseNode = new THREE.Group();
        skullBaseNode.position.set(0, -0.02, -0.04);
        headGroup.add(skullBaseNode);

        const skullCapNode = new THREE.Group();
        skullCapNode.position.set(0, -0.02, 0.12);
        headGroup.add(skullCapNode);

        // =====================================================================
        // 2B. MAILLAGE CORPOREL CONTINU (SPLINE CATMULL-ROM TEMPS RÉEL)
        // =====================================================================
        const caudalSpineNodes = [];
        for (let i = caudalSegments.length - 1; i >= 0; i--) {
            caudalSpineNodes.push({
                node: caudalSegments[i],
                rx: caudalRadiiX[i],
                ry: caudalRadiiY[i],
                yOff: 0
            });
        }

        const bodySpineNodes = [
            { node: tailTipNode, rx: 0.004, ry: 0.004, yOff: 0 },
            ...caudalSpineNodes,
            { node: pelvisRearNode, rx: 0.49, ry: 0.56, yOff: 0.02 },
            { node: hipsCenterNode, rx: 0.63, ry: 0.71, yOff: 0.03 },
            { node: lumbarNode, rx: 0.71, ry: 0.78, yOff: 0.02 },
            { node: thoraxNode, rx: 0.60, ry: 0.69, yOff: 0.0 },
            ...neckSegments.map((seg, i) => ({
                node: seg,
                rx: 0.50 - i * 0.075,
                ry: 0.56 - i * 0.09,
                yOff: -0.02 * i
            })),
            { node: skullBaseNode, rx: 0.30, ry: 0.30, yOff: 0.0 },
            { node: skullCapNode, rx: 0.004, ry: 0.004, yOff: 0.0 }
        ];

        const tubeRings = 68;
        const tubeSides = 40;
        const seamlessBodyGeo = new THREE.PlaneGeometry(1, 1, tubeSides, tubeRings - 1);
        const uvAttrBody = seamlessBodyGeo.attributes.uv;
        // Alignement explicite des UV : u=0/1 dorsal, u=0.5 ventre ; v=0 pointe de queue -> v=1 base tête
        let uvBi = 0;
        for (let r = 0; r < tubeRings; r++) {
            const tv = r / (tubeRings - 1);
            for (let s = 0; s <= tubeSides; s++) {
                uvAttrBody.setXY(uvBi++, s / tubeSides, tv);
            }
        }
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
                if (i === 8 || i === 9) breathBoost = Math.sin(breathPhase) * 0.022;
                else if (i === 10) breathBoost = Math.sin(breathPhase) * 0.014;

                localPos.addScaledVector(_up, item.yOff);
                centers.push(localPos);
                upVectors.push(_up.clone());
                radiiX.push(item.rx + breathBoost);
                radiiY.push(item.ry + breathBoost * 1.12);
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

                const rx = mix(radiiX[i0], radiiX[i1], frac);
                const ry = mix(radiiY[i0], radiiY[i1], frac);
                _up.copy(upVectors[i0]).lerp(upVectors[i1], frac).normalize();

                _right.crossVectors(_up, _tangent).normalize();
                _up.crossVectors(_tangent, _right).normalize();

                // Fanon gulaire subtil sous le cou (t entre 0.78 et 0.94)
                let dewlap = 0;
                if (t > 0.76 && t < 0.96) {
                    dewlap = 0.08 * Math.sin(((t - 0.76) / 0.20) * Math.PI);
                }

                for (let s = 0; s <= tubeSides; s++) {
                    const u = s / tubeSides;
                    const theta = u * Math.PI * 2;
                    const cosT = Math.cos(theta);
                    const sinT = Math.sin(theta);

                    const xFactor = sinT * rx * (1.0 + 0.06 * (1.0 - cosT * cosT));
                    let yFactor = cosT * (cosT < 0 ? (ry + dewlap) : ry);
                    if (cosT > 0.75 && t > 0.30 && t < 0.82) {
                        yFactor += 0.04 * Math.pow((cosT - 0.75) / 0.25, 2);
                    }

                    posAttr.setXYZ(
                        vIdx++,
                        pt.x + _right.x * xFactor + _up.x * yFactor,
                        pt.y + _right.y * xFactor + _up.y * yFactor,
                        pt.z + _right.z * xFactor + _up.z * yFactor
                    );
                }
            }
            posAttr.needsUpdate = true;
            seamlessBodyGeo.computeVertexNormals();
        }

        // =====================================================================
        // 2C. CRÂNE, MUSEAU, NARINES CREUSÉES, BOSSE NASALE & BEC PERROQUET
        // =====================================================================
        function skullSurface(tu, tv) {
            const ang = tu * Math.PI * 2;
            const ca = Math.cos(ang);
            const sa = Math.sin(ang);
            const lz = mix(-0.08, 0.88, tv);

            let yc, rx, ryTop, ryBot;
            if (tv < 0.35) {
                const t = tv / 0.35;
                yc = mix(0.08, 0.06, t);
                rx = mix(0.32, 0.35, Math.sin(t * Math.PI * 0.5));
                ryTop = mix(0.28, 0.27, t);
                ryBot = mix(0.135, 0.105, t);
            } else if (tv < 0.86) {
                const t = (tv - 0.35) / 0.51;
                yc = mix(0.06, 0.02, t);
                rx = mix(0.35, 0.26, Math.pow(t, 1.1));
                ryTop = mix(0.27, 0.285, t);
                ryBot = mix(0.105, 0.095, t);
            } else {
                const t = (tv - 0.86) / 0.14;
                yc = mix(0.02, -0.02, t);
                const s = Math.cos(t * Math.PI * 0.5);
                rx = 0.26 * s;
                ryTop = 0.285 * s;
                ryBot = 0.095 * s;
            }

            let cheekFlare = 0;
            if (tv > 0.06 && tv < 0.42 && ca > -0.45 && ca < 0.22) {
                cheekFlare = 0.058 * Math.sin(((tv - 0.06) / 0.36) * Math.PI) * (1.0 - Math.abs(ca + 0.12) / 0.35);
            }

            let rxEff, yOff;
            if (ca < -0.45) {
                const tuck = clamp01((-ca - 0.45) / 0.55);
                rxEff = rx * (1.0 - 0.48 * tuck);
                yOff = -ryBot * (0.86 - 0.28 * tuck);
            } else {
                rxEff = rx + cheekFlare;
                yOff = ca * (ca >= 0 ? ryTop : ryBot);
            }

            // Légère cambrure du bord buccal maxillaire pour dégager la mandibule et la langue
            if (ca < -0.25 && tv > 0.34 && tv < 0.82) {
                const tArch = Math.sin(((tv - 0.34) / 0.48) * Math.PI);
                yOff += 0.032 * tArch * clamp01((-ca - 0.25) / 0.55);
            }

            let lx = sa * rxEff;
            let ly = yc + yOff;

            if (ca > 0.38 && tv > 0.24 && tv < 0.84) {
                lx *= 1.0 + 0.18 * (ca - 0.38);
            }

            // Orbite creusée + arcade sourcilière ridée saillante au-dessus de l'oeil
            if (tv > 0.21 && tv < 0.41 && ca > 0.08 && ca < 0.68 && Math.abs(sa) > 0.60) {
                const oe = Math.hypot((tv - 0.31) / 0.09, (ca - 0.36) / 0.22);
                const sideS = sa > 0 ? 1 : -1;
                if (oe < 1.0) lx -= sideS * (1.0 - oe * oe) * 0.042;
                const be = Math.hypot((tv - 0.32) / 0.11, (ca - 0.60) / 0.14);
                if (be < 1.0) {
                    ly += (1.0 - be) * 0.048;
                    lx += sideS * (1.0 - be) * 0.044;
                }
            }

            // Fosse narinaire creusée sous l'avancée de la bosse nasale
            if (tv > 0.66 && tv < 0.83 && ca > -0.20 && ca < 0.32 && Math.abs(sa) > 0.60) {
                const ne = Math.hypot((tv - 0.74) / 0.065, (ca - 0.06) / 0.16);
                if (ne < 1.0) lx -= (sa > 0 ? 1 : -1) * (1.0 - ne * ne) * 0.052;
            }

            return [lx, ly, lz];
        }

        // Maillage du crâne
        const skullGeo = buildParametricGridGeo(36, 40, (tu, tv, out) => {
            const p = skullSurface(tu, tv);
            out[0] = p[0]; out[1] = p[1]; out[2] = p[2];
            out[3] = tu; out[4] = tv;
        }, true);
        headGroup.add(registerSkin(new THREE.Mesh(skullGeo, materials.snoutHide)));

        // Cavités sombres des narines + intérieur noir du palais
        [-1, 1].forEach(side => {
            const narisGeo = buildParametricGridGeo(12, 8, (tu, tv, out) => {
                const ang = tu * Math.PI * 2;
                const r = Math.sin(tv * Math.PI);
                out[0] = side * (0.210 + Math.cos(tv * Math.PI) * 0.022);
                out[1] = -0.005 + Math.sin(ang) * 0.018 * r;
                out[2] = 0.68 + Math.cos(ang) * 0.048 * r;
                out[3] = tu; out[4] = tv;
            }, true);
            headGroup.add(registerSkin(new THREE.Mesh(narisGeo, materials.cavityDark)));
        });

        const mouthCoreGeo = buildParametricGridGeo(12, 10, (tu, tv, out) => {
            const ang = tu * Math.PI * 2;
            const r = Math.sin(tv * Math.PI);
            out[0] = Math.sin(ang) * 0.135 * r;
            out[1] = -0.02 + Math.cos(ang) * 0.07 * r;
            out[2] = mix(0.05, 0.58, tv);
            out[3] = tu; out[4] = tv;
        }, true);
        headGroup.add(new THREE.Mesh(mouthCoreGeo, materials.cavityDark));

        // Bosse nasale pachyostotique arrondie posée proprement sur le chanfrein crânien
        const nasalBossGroup = new THREE.Group();
        headGroup.add(nasalBossGroup);

        const bossGeo = buildParametricGridGeo(34, 36, (tu, tv, out) => {
            const su = (tu - 0.5) * 2.0;
            const sv = (tv - 0.5) * 2.0;
            const edgeU = Math.abs(su);
            const edgeV = Math.abs(sv);
            const cosU = Math.cos(edgeU * Math.PI * 0.5);
            const cosV = Math.cos(edgeV * Math.PI * 0.5);
            const prof = Math.pow(Math.max(0, cosU), 0.52) * Math.pow(Math.max(0, cosV), 0.50);

            const cornerRound = 1.0 - 0.16 * (edgeU * edgeU) * (edgeV * edgeV);
            const maxW = 0.252 * (1.0 - 0.14 * Math.max(0, sv)) * cornerRound;
            const lx = Math.sin(su * Math.PI * 0.5) * maxW * (0.78 + 0.22 * Math.pow(Math.max(0, cosU), 0.5));
            let lz = 0.50 + Math.sin(sv * Math.PI * 0.5) * 0.285 * cornerRound;
            if (sv > 0.72) {
                const over = (sv - 0.72) / 0.28;
                lz -= over * over * 0.036;
            }
            const topH = 0.390 - 0.015 * sv + 0.016 * Math.cos(sv * Math.PI * 0.5);
            const baseY = 0.222 - 0.014 * Math.max(0, sv) - 0.018 * Math.pow(edgeU, 2.2) + 0.022 * Math.pow(edgeU * edgeV, 2);
            const groove = -0.018 * Math.exp(-Math.pow(su / 0.26, 2)) * prof * (1.0 - edgeV * edgeV);
            const cleft = -0.024 * Math.exp(-Math.pow((sv - 0.30) / 0.12, 2)) * prof;
            const ridges = 0.013 * Math.cos(sv * 11.0) * Math.cos(su * 6.0) * prof;
            const ly = baseY + (topH - baseY) * prof + groove + cleft + ridges;

            out[0] = lx; out[1] = ly; out[2] = lz;
            out[3] = tu; out[4] = tv;
        }, false);
        nasalBossGroup.add(registerSkin(new THREE.Mesh(bossGeo, materials.keratinBoss)));

        // Bec supérieur crochu de perroquet (jointif dans le museau sous la bosse nasale)
        const upperBeakGeo = buildParametricGridGeo(22, 20, (tu, tv, out) => {
            const su = (tu - 0.5) * 2.0;
            const ang = su * Math.PI * 0.56;
            const w = 0.178 * (1.0 - 0.74 * Math.pow(tv, 1.65));
            const tuckTop = 0.030 * Math.max(0, 1.0 - tv / 0.26);
            const zCurve = 0.765 + 0.155 * Math.sin(tv * Math.PI * 0.65) - 0.075 * Math.pow(tv, 2.2) - tuckTop;
            const yTop = 0.145 - tv * 0.22 - 0.035 * Math.pow(tv, 2.2);
            const thickZ = 0.118 * (1.0 - 0.70 * Math.pow(tv, 1.5));

            out[0] = Math.sin(ang) * w;
            out[1] = yTop;
            out[2] = zCurve + Math.cos(ang) * thickZ - 0.015;
            out[3] = tu; out[4] = tv;
        }, false);
        headGroup.add(registerSkin(new THREE.Mesh(upperBeakGeo, materials.beakKeratin)));

        // Yeux ambre-acajou orientés latéro-frontalement + paupières clignantes + corne épijugale
        const eyelids = [];
        const _vEyeFwd = new THREE.Vector3();
        const _vEyeUp = new THREE.Vector3();
        const _vEyeRight = new THREE.Vector3();

        [-1, 1].forEach(side => {
            const tuEye = side > 0 ? 0.195 : (1.0 - 0.195);
            const [sx, sy, sz] = skullSurface(tuEye, 0.31);
            const ex = sx + side * 0.002;

            _vEyeFwd.set(side * 0.90, 0.08, 0.42).normalize();
            _vEyeUp.set(0, 1, 0);
            _vEyeRight.crossVectors(_vEyeFwd, _vEyeUp).normalize();
            _vEyeUp.crossVectors(_vEyeRight, _vEyeFwd).normalize();

            const eyeGeo = buildParametricGridGeo(16, 16, (tu, tv, out) => {
                const dx = (tu - 0.5) * 2.0;
                const dy = (tv - 0.5) * 2.0;
                const rr = Math.sqrt(Math.min(1.0, dx * dx + dy * dy));
                const ang = Math.atan2(dy, dx);
                const theta = rr * Math.PI * 0.55;
                const rad = 0.044;
                const cT = Math.cos(theta), sT = Math.sin(theta);
                const cA = Math.cos(ang), sA = Math.sin(ang);
                out[0] = ex + (_vEyeFwd.x * cT + _vEyeRight.x * sT * cA + _vEyeUp.x * sT * sA) * rad;
                out[1] = sy + (_vEyeFwd.y * cT + _vEyeRight.y * sT * cA + _vEyeUp.y * sT * sA) * rad;
                out[2] = sz + (_vEyeFwd.z * cT + _vEyeRight.z * sT * cA + _vEyeUp.z * sT * sA) * rad;
                out[3] = tu; out[4] = tv;
            }, false);
            headGroup.add(new THREE.Mesh(eyeGeo, materials.eyeIris));

            // Bourrelet palpébral inférieur + paupière supérieure animée
            const rimTorus = new THREE.Mesh(new THREE.TorusGeometry(0.044, 0.014, 10, 18), materials.snoutHide);
            rimTorus.position.set(ex + side * 0.006, sy, sz);
            rimTorus.rotation.y = side * Math.PI * 0.38;
            headGroup.add(registerSkin(rimTorus));

            const lidGeo = new THREE.SphereGeometry(0.048, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.50);
            const eyelid = new THREE.Mesh(lidGeo, materials.snoutHide);
            eyelid.position.set(ex + side * 0.004, sy + 0.004, sz);
            eyelid.rotation.set(-Math.PI * 0.58, 0, side * 0.14);
            headGroup.add(eyelid);
            eyelids.push(eyelid);

            // Corne épijugale compacte
            headGroup.add(createCurvedHornMesh([
                [side * 0.28, -0.02, 0.05],
                [side * 0.34, -0.06, 0.03],
                [side * 0.38, -0.10, 0.00]
            ], 0.050, 0.006, materials.hornKeratin, 12, 12));
        });

        // =====================================================================
        // 2D. GRANDE COLLERETTE BOUCLIER OCELLÉE & CORNES P3 / P2 / ANTÉRIEURES
        // =====================================================================
        const FRILL_TILT = 0.62;
        const FRILL_ORIGIN_Y = 0.14;
        const FRILL_ORIGIN_Z = 0.02;

        function frillShapePoint(uRad, vRad) {
            const ang = uRad * 2.18;
            const cornerRound = 1.0 - 0.34 * Math.pow(Math.max(0, (Math.abs(uRad) - 0.72) / 0.28), 1.7);
            const baseR = (0.91 + 0.18 * Math.sin(Math.abs(uRad) * Math.PI * 0.80)
                - 0.14 * Math.exp(-Math.pow(uRad / 0.15, 2))) * cornerRound;
            const scallop = 0.028 * Math.sin(Math.abs(uRad) * 22.0) * Math.pow(vRad, 2.4) * cornerRound;
            const rr = (0.14 + 0.86 * vRad) * (baseR + scallop);

            const lx = Math.sin(ang) * rr * 1.08;
            const ly = Math.cos(ang) * rr * 0.98 + 0.21 * vRad;
            const cup = 0.085 * Math.pow(vRad, 1.4) * Math.pow(Math.abs(uRad), 1.3);
            return [lx, ly, cup];
        }

        function frillPointHead(lx, ly, lzLocal) {
            const cosT = Math.cos(FRILL_TILT);
            const sinT = Math.sin(FRILL_TILT);
            const ry = ly * cosT - lzLocal * sinT + FRILL_ORIGIN_Y;
            const rz = -ly * sinT - lzLocal * cosT + FRILL_ORIGIN_Z;
            return [lx, ry, rz];
        }

        // Remarque : face arrière tv=0..0.5 (sideSign=-1) et face avant tv=0.5..1.0 (sideSign=+1) -> normales sortantes exactes !
        const frillGeo = buildParametricGridGeo(52, 38, (tu, tv, out) => {
            const uRad = (tu - 0.5) * 2.0;
            let vRad, sideSign;
            if (tv <= 0.5) {
                vRad = tv / 0.5;
                sideSign = -1.0;
            } else {
                vRad = (1.0 - tv) / 0.5;
                sideSign = 1.0;
            }
            const [lx, ly, cup] = frillShapePoint(uRad, vRad);
            let thick = (0.074 - 0.020 * vRad) * Math.sqrt(Math.max(0, 1.0 - Math.pow(vRad, 8)));
            // Bossage osseux sous la racine P3 pour une jonction sans couture
            const p3Boss = Math.exp(-Math.pow((Math.abs(uRad) - 0.34) / 0.075, 2)) *
                Math.exp(-Math.pow((vRad - 0.82) / 0.15, 2));
            thick += 0.034 * p3Boss;
            if (vRad < 0.05) thick *= (vRad / 0.05) * 0.5 + 0.5;
            const [px, py, pz] = frillPointHead(lx, ly, cup + sideSign * thick);

            out[0] = px; out[1] = py; out[2] = pz;
            out[3] = clamp01(0.5 + lx / 2.25);
            out[4] = clamp01((ly + 0.44) / 1.62);
        }, false);
        headGroup.add(registerSkin(new THREE.Mesh(frillGeo, materials.frillShield)));

        function frillRimVec(uFrac, vFrac = 0.85, zOff = 0) {
            const [lx, ly, cup] = frillShapePoint(uFrac, vFrac);
            const [px, py, pz] = frillPointHead(lx, ly, cup + zOff);
            return new THREE.Vector3(px, py, pz);
        }

        // Cornes pariétales P3 recourbées, pointes médianes P2 & cornes antérieures évasées derrière l'oeil
        [-1, 1].forEach(side => {
            const p3Base = frillRimVec(side * 0.34, 0.83, -0.008);
            headGroup.add(createCurvedHornMesh([
                [p3Base.x, p3Base.y, p3Base.z],
                [p3Base.x + side * 0.28, p3Base.y + 0.21, p3Base.z - 0.04],
                [p3Base.x + side * 0.56, p3Base.y - 0.01, p3Base.z + 0.12]
            ], 0.068, 0.008, materials.hornKeratin, 14, 18));

            const p2Base = frillRimVec(side * 0.13, 0.82, -0.008);
            headGroup.add(createCurvedHornMesh([
                [p2Base.x, p2Base.y, p2Base.z],
                [p2Base.x + side * 0.04, p2Base.y + 0.11, p2Base.z - 0.01],
                [p2Base.x + side * 0.08, p2Base.y + 0.20, p2Base.z - 0.03]
            ], 0.042, 0.005, materials.hornKeratin, 12, 12));

            // Cornes antérieures triangulaires évasées sur le pont sourcilier vers la collerette
            headGroup.add(createCurvedHornMesh([
                [side * 0.30, 0.26, 0.03],
                [side * 0.36, 0.35, 0.01],
                [side * 0.40, 0.41, -0.01]
            ], 0.056, 0.005, materials.hornKeratin, 12, 12));

            headGroup.add(createCurvedHornMesh([
                [side * 0.33, 0.29, -0.06],
                [side * 0.38, 0.36, -0.09],
                [side * 0.42, 0.41, -0.11]
            ], 0.046, 0.004, materials.hornKeratin, 10, 12));
        });

        // Squelette crânien interne X-Ray
        const skullBone = createBoneVisual(new THREE.Vector3(0, 0.04, -0.05), new THREE.Vector3(0, 0.06, 0.80), 0.11);
        headGroup.add(skullBone);

        // =====================================================================
        // 2E. MANDIBULE ARTICULÉE, BEC PRÉDENTAIRE, LANGUE & MUSCLES ADDUCTEURS
        // =====================================================================
        const jawAdapter = new THREE.Group();
        jawAdapter.position.set(0, -0.02, 0.14);
        jawAdapter.rotation.y = -Math.PI / 2;
        headGroup.add(jawAdapter);

        rig.jaw.position.set(0, 0, 0);
        rig.jaw.rotation.set(0, 0, 0);
        jawAdapter.add(rig.jaw);

        const jawGroup = new THREE.Group();
        jawGroup.rotation.y = Math.PI / 2;
        rig.jaw.add(jawGroup);

        // Maillage mandibulaire en coordonnées locales de jawGroup (pivot en (0, 0, 0))
        const mandibleGeo = buildParametricGridGeo(24, 24, (tu, tv, out) => {
            const ang = tu * Math.PI * 2;
            const ca = Math.cos(ang);
            const sa = Math.sin(ang);
            const lz = mix(-0.06, 0.59, tv);
            let rx, ry, yc;
            if (tv < 0.75) {
                const t = tv / 0.75;
                rx = mix(0.22, 0.130, Math.pow(t, 1.1));
                ry = mix(0.088, 0.092, Math.sin(t * Math.PI * 0.7));
                yc = mix(-0.055, -0.068, t);
            } else {
                const t = (tv - 0.75) / 0.25;
                const s = Math.cos(t * Math.PI * 0.5);
                rx = 0.130 * s;
                ry = 0.088 * s;
                yc = mix(-0.068, -0.015, t);
            }
            out[0] = sa * rx;
            out[1] = yc + ca * ry;
            out[2] = lz;
            out[3] = tu; out[4] = tv;
        }, true);
        jawGroup.add(registerSkin(new THREE.Mesh(mandibleGeo, materials.snoutHide)));

        // Bec prédentaire inférieur recourbé vers le haut (en retrait sous le bec supérieur)
        const lowerBeakGeo = buildParametricGridGeo(16, 14, (tu, tv, out) => {
            const su = (0.5 - tu) * 2.0;
            const ang = su * Math.PI * 0.56;
            const w = 0.114 * (1.0 - 0.60 * Math.pow(tv, 1.4));
            const lz = 0.50 + tv * 0.145 - 0.02 * tv * tv;
            const ly = -0.070 + tv * 0.115 + 0.030 * tv * tv;
            const lzOff = Math.cos(ang) * (0.062 * (1.0 - 0.42 * tv));
            out[0] = Math.sin(ang) * w;
            out[1] = ly;
            out[2] = lz + lzOff;
            out[3] = 1.0 - tu; out[4] = tv;
        }, false);
        jawGroup.add(registerSkin(new THREE.Mesh(lowerBeakGeo, materials.beakKeratin)));

        const tongueGeo = buildParametricGridGeo(14, 14, (tu, tv, out) => {
            const ang = tu * Math.PI * 2;
            const r = Math.sin(tv * Math.PI);
            out[0] = Math.sin(ang) * 0.105 * r;
            out[1] = 0.012 + Math.cos(ang) * 0.030 * r + 0.022 * Math.sin(tv * Math.PI);
            out[2] = mix(0.10, 0.56, tv);
            out[3] = tu; out[4] = tv;
        }, true);
        const tongueMesh = new THREE.Mesh(tongueGeo, materials.oralMucosa);
        jawGroup.add(tongueMesh);
        jawGroup.userData.tongueMesh = tongueMesh;

        const jawAdductors = [];
        [-1, 1].forEach(side => {
            const upperAnchor = new THREE.Group();
            upperAnchor.position.set(side * 0.19, 0.08, 0.24);
            headGroup.add(upperAnchor);

            const lowerAnchor = new THREE.Group();
            lowerAnchor.position.set(side * 0.16, -0.02, 0.12);
            jawGroup.add(lowerAnchor);

            const muscMesh = new THREE.Mesh(
                createPachyCapsuleGeometry(0.032, 0.16, 4, 8),
                materials.oralMucosa
            );
            muscMesh.visible = false;
            headGroup.add(muscMesh);
            jawAdductors.push({ side, upperAnchor, lowerAnchor, muscMesh });
        });

        // =====================================================================
        // 2F. QUATRE MEMBRES CONTINUS À ROTULES HÉMISPHÉRIQUES & PIEDS PLANTÉS
        // =====================================================================
        function createBroadFootGroup(parentJoint, footHeight, widthX, lenZ, rAnkle, isFront, side) {
            // Dôme de pied enveloppant l'articulation par le haut (overlap +0.11m) jusqu'à la sole plate (-footHeight)
            const footGeo = buildParametricGridGeo(22, 18, (tu, tv, out) => {
                const ang = -tu * Math.PI * 2;
                const ca = Math.cos(ang);
                const sa = Math.sin(ang);
                const topY = 0.11;
                const botY = -footHeight;
                let y, rx, rz, zOff;
                if (tv < 0.08) {
                    const t = tv / 0.08;
                    y = topY;
                    rx = rAnkle * 0.98 * t;
                    rz = rAnkle * 1.00 * t;
                    zOff = 0;
                } else if (tv <= 0.78) {
                    const t = (tv - 0.08) / 0.70;
                    const ease = Math.sin(t * Math.PI * 0.5);
                    y = mix(topY, botY + 0.02, t);
                    const crease = 1.0 - 0.03 * Math.exp(-Math.pow((t - 0.28) / 0.08, 2));
                    rx = mix(rAnkle * 1.00, widthX, ease) * crease;
                    rz = mix(rAnkle * 1.02, lenZ, ease) * crease;
                    zOff = 0.04 * ease;
                } else {
                    const t = (tv - 0.78) / 0.22;
                    y = mix(botY + 0.02, botY, clamp01(t * 2.5));
                    rx = widthX * (1.0 - t);
                    rz = lenZ * (1.0 - t);
                    zOff = 0.04 * (1.0 - t);
                }
                const frontF = sa > 0 ? 1.12 : 0.86;
                out[0] = ca * rx;
                out[1] = y;
                out[2] = zOff + sa * rz * frontF;
                out[3] = tu;
                out[4] = tv * 0.65;
            }, true);
            parentJoint.add(registerSkin(new THREE.Mesh(footGeo, materials.limbHide)));

            const toes = [];
            const toeCount = isFront ? 5 : 4;
            const span = isFront ? 1.25 : 1.05;
            for (let i = 0; i < toeCount; i++) {
                const frac = (i / (toeCount - 1)) - 0.5;
                const ang = frac * span;
                const tx = Math.sin(ang) * (widthX * 0.92);
                const tz = 0.04 + Math.cos(ang) * (lenZ * 1.06);
                const ty = -footHeight + 0.045;

                const toeGroup = new THREE.Group();
                toeGroup.position.set(tx, ty, tz);
                toeGroup.rotation.y = ang * side * 0 + ang;
                parentJoint.add(toeGroup);

                const rr = isFront ? 0.050 : 0.056;
                const hoofGeo = buildParametricGridGeo(12, 10, (tu, tv, out) => {
                    const uA = tu * Math.PI * 2;
                    const pR = Math.sin(tv * Math.PI);
                    const pFwd = (1.0 - Math.cos(tv * Math.PI)) * 0.5;
                    const lx = Math.cos(uA) * rr * pR * 0.95;
                    const ly = Math.sin(uA) * rr * pR * 0.78;
                    const lz = (pFwd - 0.25) * (rr * 2.0);
                    out[0] = lx;
                    out[1] = Math.max(-0.044, ly - pFwd * 0.022);
                    out[2] = lz;
                    out[3] = tu;
                    out[4] = tv;
                }, true);
                toeGroup.add(registerSkin(new THREE.Mesh(hoofGeo, materials.hoof)));
                toes.push(toeGroup);
            }
            return toes;
        }

        function buildForelimb(side) {
            const shoulder = new THREE.Group();
            shoulder.position.set(side * 0.42, -0.21, 0.68);
            torsoGroup.add(shoulder);

            const humLen = 0.62;
            shoulder.add(createBallSocketLimbMesh(humLen, 0.27, 0.28, 0.202, 0.40, 18, 22));
            shoulder.add(createBoneVisual(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -humLen, 0), 0.052));

            const elbow = new THREE.Group();
            elbow.position.set(0, -humLen, 0);
            shoulder.add(elbow);

            const faLen = 0.56;
            elbow.add(createBallSocketLimbMesh(faLen, 0.200, 0.208, 0.180, 0.45, 18, 20));
            elbow.add(createBoneVisual(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -faLen, 0), 0.044));

            const wrist = new THREE.Group();
            wrist.position.set(0, -faLen, 0);
            elbow.add(wrist);

            const toes = createBroadFootGroup(wrist, 0.270, 0.225, 0.215, 0.180, true, side);
            return { side, isFront: true, shoulder, elbow, wrist, toes };
        }

        function buildHindlimb(side) {
            const hip = new THREE.Group();
            hip.position.set(side * 0.40, -0.10, -0.62);
            torsoGroup.add(hip);

            const femLen = 0.68;
            hip.add(createBallSocketLimbMesh(femLen, 0.32, 0.33, 0.212, 0.38, 18, 22));
            hip.add(createBoneVisual(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -femLen, 0), 0.064));

            const knee = new THREE.Group();
            knee.position.set(0, -femLen, 0);
            hip.add(knee);

            const tibLen = 0.60;
            knee.add(createBallSocketLimbMesh(tibLen, 0.210, 0.215, 0.175, 0.42, 18, 20));
            knee.add(createBoneVisual(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -tibLen, 0), 0.050));

            const ankle = new THREE.Group();
            ankle.position.set(0, -tibLen, 0);
            knee.add(ankle);

            const toes = createBroadFootGroup(ankle, 0.320, 0.230, 0.230, 0.175, false, side);
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
            tongueMesh,
            skeletonMeshes,
            materials,
            currentMode: 'idle',
            poseUpdatedThisFrame: false
        };

        // Convention : rx > 0 = tête baisse vers le sol, rx < 0 = tête/collerette lève vers le ciel
        function setPachyHeadRot(rx, ry, rz) {
            rig.headGroup.rotation.set(rz || 0, ry || 0, -(rx || 0));
        }

        // Convention : openAmt > 0 = ouverture du bec prédentaire inférieur
        function setPachyJawRot(openAmt, rollZ = 0) {
            rig.jaw.rotation.set(rollZ || 0, 0, -Math.max(0, openAmt || 0));
        }

        function setForelimbPose(leg, swingAngle = 0, elbowFlex = 0, wristFlex = 0, crouchDrop = 0, abduction = 0.09) {
            const rootPitch = rootJoint.rotation.x || 0;
            const cBend = crouchDrop * 0.85;
            const shRx = 0.28 - rootPitch + swingAngle + cBend;
            const elRx = -0.50 - elbowFlex - cBend * 1.75;
            const wrRx = -(shRx + elRx + rootPitch) + wristFlex;

            leg.shoulder.rotation.set(shRx, 0, abduction * leg.side);
            leg.elbow.rotation.set(elRx, 0, 0);
            leg.wrist.rotation.set(wrRx, 0, 0);
        }

        function setHindlimbPose(leg, swingAngle = 0, kneeFlex = 0, ankleFlex = 0, crouchDrop = 0, abduction = 0.08) {
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
                    0.13 + Math.sin(t * 2.8 - 1.0) * 0.045,
                    weightShift * 0.06,
                    Math.cos(t * 1.4) * 0.025
                );
                setPachyJawRot(0.18 + Math.max(0, breath) * 0.06);

                setForelimbPose(leftFrontLeg, 0.03, 0, 0, dropAmt, 0.09);
                setForelimbPose(rightFrontLeg, -0.03, 0, 0, dropAmt, 0.09);
                setHindlimbPose(leftHindLeg, -0.03, 0, 0, dropAmt, 0.08);
                setHindlimbPose(rightHindLeg, 0.03, 0, 0, dropAmt, 0.08);

                caudalSegments.forEach((seg, i) => {
                    seg.rotation.set(
                        0.02 + Math.cos(t * 2.8 - i * 0.45) * 0.02,
                        Math.sin(t * 2.2 - i * 0.55) * (0.05 + i * 0.018),
                        0
                    );
                });

            } else if (mode === 'walk' || mode === 'sprint') {
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

                setPachyHeadRot(
                    (isSprint ? 0.28 : 0.13) + Math.sin(phase * 2) * 0.05 * strideAmp,
                    -Math.sin(phase) * 0.05 * strideAmp,
                    0
                );
                setPachyJawRot((isSprint ? 0.24 : 0.12) + Math.abs(Math.sin(phase)) * 0.10);

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
                    setForelimbPose(leg, swing, lift * 0.52 * strideAmp, -lift * 0.25, isSprint ? 0.06 : 0.02, 0.09);
                });

                [
                    { leg: leftHindLeg, p: hlPhase },
                    { leg: rightHindLeg, p: hrPhase }
                ].forEach(({ leg, p }) => {
                    const swing = -Math.sin(p) * 0.44 * strideAmp;
                    const lift = Math.max(0, Math.cos(p));
                    setHindlimbPose(leg, swing, lift * 0.55 * strideAmp, -lift * 0.28, isSprint ? 0.06 : 0.02, 0.08);
                });

                caudalSegments.forEach((seg, i) => {
                    seg.rotation.set(
                        (isSprint ? -0.05 : 0.01) + Math.sin(phase * 2 - i * 0.4) * 0.03 * strideAmp,
                        -Math.cos(phase - i * 0.5) * (0.08 + i * 0.025) * strideAmp,
                        0
                    );
                });

            } else if (mode === 'display') {
                const vib = Math.sin(t * 26);
                rootJoint.position.set(0, 1.72, 0.04);
                rootJoint.rotation.set(-0.22 + vib * 0.012, 0, 0);

                neckSegments.forEach((seg, i) => {
                    seg.rotation.set(-0.08 - i * 0.02 + vib * 0.01, Math.sin(t * 6) * 0.03, 0);
                });

                setPachyHeadRot(-0.24 + vib * 0.025, Math.sin(t * 6) * 0.12, vib * 0.02);
                setPachyJawRot(0.56 + vib * 0.08);

                setForelimbPose(leftFrontLeg, -0.22, 0.25, -0.15, 0, 0.11);
                setForelimbPose(rightFrontLeg, -0.16, 0.18, -0.10, 0, 0.11);
                setHindlimbPose(leftHindLeg, 0.12, 0.08, 0, 0.05, 0.09);
                setHindlimbPose(rightHindLeg, 0.08, 0.12, 0, 0.05, 0.09);

                caudalSegments.forEach((seg, i) => {
                    seg.rotation.set(0.06 - i * 0.01, Math.sin(t * 5 - i * 0.5) * (0.06 + i * 0.02), 0);
                });

            } else if (mode === 'crouch') {
                const breath = Math.sin(t * 3.0);
                rootJoint.position.set(0, 1.24 + breath * 0.018, 0);
                rootJoint.rotation.set(0.16, 0, 0);

                neckSegments.forEach(seg => {
                    seg.rotation.set(0.08, 0, 0);
                });
                setPachyHeadRot(0.32, 0, 0);
                setPachyJawRot(0.10);

                setForelimbPose(leftFrontLeg, 0.08, 0.18, -0.10, 0.45, 0.11);
                setForelimbPose(rightFrontLeg, -0.06, 0.18, -0.10, 0.45, 0.11);
                setHindlimbPose(leftHindLeg, -0.05, 0.15, -0.08, 0.42, 0.10);
                setHindlimbPose(rightHindLeg, 0.05, 0.15, -0.08, 0.42, 0.10);

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

            const blinkCycle = ((t % 4.6) + 4.6) % 4.6;
            const blinkAmt = blinkCycle < 0.15 ? Math.sin((blinkCycle / 0.15) * Math.PI) : 0;
            const jawOpenAmt = Math.max(0, -rig.jaw.rotation.z);
            const glareSquint = Math.min(0.30, jawOpenAmt * 0.25);
            eyelids.forEach(lid => {
                lid.rotation.x = -Math.PI * 0.58 + Math.max(blinkAmt * 0.92, glareSquint);
            });

            if (tongueMesh) {
                tongueMesh.rotation.x = -0.04 + jawOpenAmt * 0.16 + Math.sin(t * 24) * 0.025 * jawOpenAmt;
            }

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

                    setForelimbPose(leftFrontLeg, flSwing, Math.max(0, flSwing) * 0.35, 0, crouchAmt, 0.09);
                    setForelimbPose(rightFrontLeg, frSwing, Math.max(0, frSwing) * 0.35, 0, crouchAmt, 0.09);
                    setHindlimbPose(leftHindLeg, hlSwing, Math.max(0, hlSwing) * 0.35, 0, crouchAmt, 0.08);
                    setHindlimbPose(rightHindLeg, hrSwing, Math.max(0, hrSwing) * 0.35, 0, crouchAmt, 0.08);
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

            const isXray = Boolean(fighter && fighter.isXrayTarget);
            skeletonMeshes.forEach(m => { m.visible = isXray; });

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
                    item.muscMesh.scale.set(0.75, dist / 0.16, 1.35);
                    item.muscMesh.rotation.set(0.12 + jawOpenAmt * 0.30, 0, item.side * 0.08);
                }
            });

            updateContinuousBodySkin(breathPhase);
            void modeOverride;
        }

        rig.specialParts.pRig = pRig;
        rig.specialParts.nasalBoss = nasalBossGroup;
        rig.specialParts.applyPoseMode = applyPoseMode;
        rig.specialParts.resetPachyPose = resetPachyPose;
        rig.specialParts.resetQuetzalPose = resetPachyPose;
        rig.specialParts.updateAnatomicalSkin = updateAnatomicalSkin;

        applyPoseMode('idle', 0);
        updateAnatomicalSkin(0, null, 'idle');
    },
});
