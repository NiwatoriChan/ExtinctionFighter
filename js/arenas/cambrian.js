/* ============================================================================
 * ARÈNE : 🌊 Récif Abyssal du Cambrien (Explosion du Vivant -530 Ma)
 * Grande carte d'exploration et de combat Melee Adventure 3D :
 *   - Très large arène sous-marine (X: -26 à +26, largeur 58)
 *   - Plateformes étagées multi-paliers (altitudes Y = 2.8, 3.5, 5.6 et Pinacle à 7.2)
 *   - 2 Cheminées hydrothermales / Geysers de saut (Super Jump Pads à X: -11 et +11)
 *   - Faune cambrienne primordiale : Éponges géantes Vauxia, Lys de mer Crinoïdes,
 *     frondes de Charnia et bancs de poissons primordiaux
 *   - Rayons caustiques volumétriques et panaches de bulles hydrothermales
 * ============================================================================ */

let _cachedCambrianMaps = null;

function getCambrianPBRMaps() {
    if (_cachedCambrianMaps) return _cachedCambrianMaps;
    if (typeof document === 'undefined') return { colorMap: null, bumpMap: null };

    const size = 512;
    const canvas = document.createElement('canvas');
    const bump = document.createElement('canvas');
    canvas.width = bump.width = size;
    canvas.height = bump.height = size;
    const ctx = canvas.getContext('2d');
    const bCtx = bump.getContext('2d');

    // Dégradé abyssal océanique cyan / teal / basalte sombre
    const grad = ctx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0.0, '#042f2e');
    grad.addColorStop(0.35, '#0e7490');
    grad.addColorStop(0.7, '#083344');
    grad.addColorStop(1.0, '#021e28');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    bCtx.fillStyle = '#606060';
    bCtx.fillRect(0, 0, size, size);

    let seed = 42891;
    const rand = () => {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
    };

    // Sédiments marins calcifiés et fossiles de trilobites incrustés
    for (let i = 0; i < 90; i++) {
        const x = rand() * size;
        const y = rand() * size;
        const r = 10 + rand() * 28;
        ctx.beginPath();
        bCtx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        bCtx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = rand() > 0.6 ? 'rgba(34, 211, 238, 0.35)' : 'rgba(8, 51, 68, 0.7)';
        ctx.fill();
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 1.6;
        ctx.stroke();

        bCtx.fillStyle = '#b0b0b0';
        bCtx.fill();
    }

    const colorMap = new THREE.CanvasTexture(canvas);
    const bumpMap = new THREE.CanvasTexture(bump);
    colorMap.wrapS = colorMap.wrapT = bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping;
    colorMap.repeat.set(8, 2);
    bumpMap.repeat.set(8, 2);
    if (THREE.SRGBColorSpace) colorMap.colorSpace = THREE.SRGBColorSpace;

    _cachedCambrianMaps = { colorMap, bumpMap };
    return _cachedCambrianMaps;
}

registerArena({
    id: 'cambrian',
    label: "🌊 Récif Abyssal du Cambrien (Explosion du Vivant)",
    skyColor: 0x031826,
    floorColor: 0x082535,
    accentColor: 0x22d3ee,
    stageBound: 26.0,  // Très grande arène : X de -26 à +26
    stageWidth: 58,    // Sol sculpté de 58 unités de long
    stageDepth: 14,

    // Relief topographique du fond océanique : cuvette centrale, récifs surélevés et crêtes
    getGroundHeight(x, z = 0) {
        void z;
        const trenchHollow = -Math.exp(-(x * x) / 24.0) * 0.48;
        const outerShelves = Math.pow(Math.min(1, Math.abs(x) / 22.0), 2) * 0.72;
        const sandRipples = Math.sin(x * 0.45) * 0.22 + Math.cos(x * 0.85) * 0.12;
        return trenchHollow + outerShelves + sandRipples + 0.10;
    },

    // Plateformes étagées de combat et cheminées de projection (Jump Pads)
    platforms: [
        // 1. Cheminées Hydrothermales (Geyser Jump Pads)
        {
            id: 'cambrian_geyser_left',
            label: "💨 Cheminée Hydrothermale Ouest (Geyser Jump)",
            x: -11.0,
            y: 0.15,
            isJumpPad: true,
            jumpForce: 21.0
        },
        {
            id: 'cambrian_geyser_right',
            label: "💨 Cheminée Hydrothermale Est (Geyser Jump)",
            x: 11.0,
            y: 0.15,
            isJumpPad: true,
            jumpForce: 21.0
        },

        // 2. Étage 1 : Plateaux Coralliens Inférieurs (Y = 4.2)
        {
            id: 'cambrian_shelf_left',
            label: "🪸 Lagon Corallien Inférieur Ouest",
            xMin: -24.0,
            xMax: -14.5,
            y: 4.2,
            style: 'coral'
        },
        {
            id: 'cambrian_shelf_right',
            label: "🪸 Lagon Corallien Inférieur Est",
            xMin: 14.5,
            xMax: 24.0,
            y: 4.2,
            style: 'coral'
        },

        // 3. Étage 2 : Autel Récifal Central (Y = 5.2)
        {
            id: 'cambrian_bridge_center',
            label: "🌊 Autel Récifal Central",
            xMin: -5.8,
            xMax: 5.8,
            y: 5.2,
            style: 'altar'
        },

        // 4. Étage 3 : Aiguilles de Stromatolites Élevées (Y = 8.2)
        {
            id: 'cambrian_spire_left',
            label: "🏛️ Aiguille de Stromatolites Ouest",
            xMin: -17.5,
            xMax: -8.0,
            y: 8.2,
            style: 'spire'
        },
        {
            id: 'cambrian_spire_right',
            label: "🏛️ Aiguille de Stromatolites Est",
            xMin: 8.0,
            xMax: 17.5,
            y: 8.2,
            style: 'spire'
        },

        // 5. Étage 4 : Pinacle Abyssal Suprême (Y = 10.5)
        {
            id: 'cambrian_spire_center_high',
            label: "⭐ Pinacle Abyssal Suprême",
            xMin: -3.2,
            xMax: 3.2,
            y: 10.5,
            style: 'apex'
        }
    ],

    buildDecor(group, scene) {
        const targetGroup = group || arenaGroup;
        const decor = {
            crinoids: [],
            geysers: [],
            bubbleEmitters: [],
            godrays: null,
            fishes: []
        };

        const cyanGlowMat = new THREE.MeshStandardMaterial({
            color: 0x22d3ee,
            emissive: 0x06b6d4,
            emissiveIntensity: 0.85,
            roughness: 0.2
        });
        const amberVentMat = new THREE.MeshStandardMaterial({
            color: 0xf59e0b,
            emissive: 0xd97706,
            emissiveIntensity: 0.95,
            roughness: 0.3
        });
        const spongeMat = new THREE.MeshStandardMaterial({
            color: 0x0d9488,
            roughness: 0.45,
            metalness: 0.2
        });
        const basaltMat = new THREE.MeshStandardMaterial({
            color: 0x083344,
            roughness: 0.65,
            metalness: 0.35
        });

        // ====================================================================
        // 1. CHEMINÉES HYDROTHERMALES 3D (AVEC ANNEAUX LUMINEUX & BULLES)
        // ====================================================================
        [-11.0, 11.0].forEach((gx) => {
            const geyserGroup = new THREE.Group();
            geyserGroup.position.set(gx, 0, 0);

            // Cône de roche volcanique
            const coneGeo = new THREE.CylinderGeometry(0.85, 1.5, 0.9, 10);
            const cone = new THREE.Mesh(coneGeo, basaltMat);
            cone.position.y = 0.45;
            cone.castShadow = true;
            cone.receiveShadow = true;
            geyserGroup.add(cone);

            // Cœur thermique bouillonnant
            const coreGeo = new THREE.CylinderGeometry(0.65, 0.65, 0.2, 10);
            const core = new THREE.Mesh(coreGeo, amberVentMat);
            core.position.y = 0.88;
            geyserGroup.add(core);

            // Anneau d'énergie hydrothermale
            const ringGeo = new THREE.TorusGeometry(0.72, 0.08, 6, 16);
            ringGeo.rotateX(Math.PI / 2);
            const ring = new THREE.Mesh(ringGeo, cyanGlowMat);
            ring.position.y = 0.95;
            geyserGroup.add(ring);

            // Panache de bulles procedurales
            const bubbleParticles = [];
            for (let b = 0; b < 12; b++) {
                const bMesh = new THREE.Mesh(new THREE.SphereGeometry(0.12 + Math.random() * 0.12, 6, 6), cyanGlowMat);
                bMesh.position.set(
                    (Math.random() - 0.5) * 0.7,
                    1.0 + Math.random() * 4.5,
                    (Math.random() - 0.5) * 0.7
                );
                geyserGroup.add(bMesh);
                bubbleParticles.push({ mesh: bMesh, speed: 2.5 + Math.random() * 3.0, baseY: 1.0, maxY: 5.5 });
            }

            targetGroup.add(geyserGroup);
            decor.geysers.push({ group: geyserGroup, ring, bubbles: bubbleParticles });
        });

        // ====================================================================
        // 2. ÉPONGES GÉANTES PRIMORDIALES (VAUXIA & HAZELIA EN ARRIÈRE-PLAN)
        // ====================================================================
        const spongeSpawns = [
            { x: -21, z: -3.5, h: 4.2, r: 0.9 },
            { x: -16, z: -4.0, h: 5.5, r: 1.1 },
            { x: -6, z: -3.8, h: 3.8, r: 0.8 },
            { x: 6, z: -3.8, h: 4.0, r: 0.85 },
            { x: 16, z: -4.2, h: 5.8, r: 1.2 },
            { x: 21, z: -3.5, h: 4.5, r: 0.95 }
        ];

        spongeSpawns.forEach(sp => {
            const sponge = new THREE.Group();
            sponge.position.set(sp.x, 0, sp.z);

            const cupGeo = new THREE.CylinderGeometry(sp.r, sp.r * 0.35, sp.h, 8, 3, true);
            const cup = new THREE.Mesh(cupGeo, spongeMat);
            cup.position.y = sp.h * 0.5;
            cup.castShadow = true;
            sponge.add(cup);

            // Anneau bioluminescent à l'embouchure
            const rim = new THREE.Mesh(new THREE.TorusGeometry(sp.r, 0.08, 6, 14), cyanGlowMat);
            rim.rotateX(Math.PI / 2);
            rim.position.y = sp.h;
            sponge.add(rim);

            targetGroup.add(sponge);
        });

        // ====================================================================
        // 3. LYS DE MER CRINOÏDES & FRONDES DE CHARNIA ONDULANTES
        // ====================================================================
        for (let cx = -23; cx <= 23; cx += 4.5) {
            const crinoidGroup = new THREE.Group();
            crinoidGroup.position.set(cx + (Math.random() - 0.5) * 1.5, 0, 2.5 + Math.random() * 2.5);

            // Tige segmentée
            const stemHeight = 1.8 + Math.random() * 1.4;
            const stemGeo = new THREE.CylinderGeometry(0.06, 0.1, stemHeight, 5);
            const stem = new THREE.Mesh(stemGeo, basaltMat);
            stem.position.y = stemHeight * 0.5;
            crinoidGroup.add(stem);

            // Calice à bras plumeux
            const crown = new THREE.Group();
            crown.position.y = stemHeight;
            for (let a = 0; a < 5; a++) {
                const angle = (a / 5) * Math.PI * 2;
                const armGeo = new THREE.ConeGeometry(0.12, 1.1, 4);
                armGeo.rotateZ(0.65);
                const arm = new THREE.Mesh(armGeo, cyanGlowMat);
                arm.rotation.y = angle;
                crown.add(arm);
            }
            crinoidGroup.add(crown);
            targetGroup.add(crinoidGroup);

            decor.crinoids.push({ group: crinoidGroup, crown, seed: cx });
        }

        // ====================================================================
        // 4. RAYONS CAUSTIQUES VOLUMÉTRIQUES DE LUMIÈRE SOUS-MARINE
        // ====================================================================
        const godrayGeo = new THREE.ConeGeometry(8, 26, 8, 1, true);
        godrayGeo.rotateX(Math.PI);
        const godrayMat = new THREE.MeshBasicMaterial({
            color: 0x22d3ee,
            transparent: true,
            opacity: 0.12,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        const godrayMesh = new THREE.Mesh(godrayGeo, godrayMat);
        godrayMesh.position.set(0, 13, -2);
        godrayMesh.scale.set(3.2, 1.0, 1.2);
        targetGroup.add(godrayMesh);
        decor.godrays = godrayMesh;

        // ====================================================================
        // 5. BANCS DE PIKAIA & POISSONS PRIMORDIAUX EN ARRIÈRE-PLAN
        // ====================================================================
        for (let f = 0; f < 8; f++) {
            const fishMesh = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.8, 4), cyanGlowMat);
            fishMesh.rotateZ(-Math.PI / 2);
            fishMesh.position.set(
                (Math.random() - 0.5) * 45,
                4.0 + Math.random() * 5.0,
                -7.0 - Math.random() * 6.0
            );
            targetGroup.add(fishMesh);
            decor.fishes.push({
                mesh: fishMesh,
                speed: 3.5 + Math.random() * 2.5,
                baseY: fishMesh.position.y,
                seed: f
            });
        }

        return decor;
    },

    animate(decor, group, scene, time, dt) {
        if (!decor) return;

        // 1. Ondulation douce des crinoïdes au gré des courants marins
        if (decor.crinoids) {
            decor.crinoids.forEach(c => {
                const sway = Math.sin(time * 2.2 + c.seed) * 0.14;
                c.crown.rotation.z = sway;
                c.crown.rotation.x = Math.cos(time * 1.8 + c.seed) * 0.08;
            });
        }

        // 2. Ébullition des geysers hydrothermaux et montée des bulles
        if (decor.geysers) {
            decor.geysers.forEach(g => {
                const pulse = 0.85 + Math.sin(time * 6.0) * 0.15;
                if (g.ring) {
                    g.ring.scale.set(pulse, pulse, pulse);
                }
                if (g.bubbles) {
                    g.bubbles.forEach(b => {
                        b.mesh.position.y += b.speed * dt;
                        if (b.mesh.position.y > b.maxY) {
                            b.mesh.position.y = b.baseY;
                            b.mesh.position.x = (Math.random() - 0.5) * 0.6;
                        }
                    });
                }
            });
        }

        // 3. Nage des Pikaia en arrière-plan
        if (decor.fishes) {
            decor.fishes.forEach(f => {
                f.mesh.position.x += f.speed * dt;
                f.mesh.position.y = f.baseY + Math.sin(time * 3.5 + f.seed) * 0.45;
                if (f.mesh.position.x > 32) {
                    f.mesh.position.x = -32;
                }
            });
        }

        // 4. Scintillement des caustiques volumétriques
        if (decor.godrays) {
            decor.godrays.rotation.z = Math.sin(time * 0.6) * 0.04;
            decor.godrays.material.opacity = 0.10 + Math.sin(time * 1.5) * 0.03;
        }
    }
});
