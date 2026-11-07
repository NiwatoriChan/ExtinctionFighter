/* ============================================================================
 * ARÈNE : 🌿 Vallée d'Émeraude (Jungle du Jurassique -152 Ma)
 * Écosystème préhistorique 3D luxuriant :
 *   - Rivière jurassique sinueuse avec ondulations d'eau en temps réel
 *   - Flore fossile : Araucarias géants étagés, Fougères arborescentes (Dicksonia)
 *     et Cycads animés par le vent
 *   - Faune jurassique : Troupeau de Brachiosaures articulés au pas lourd,
 *     Ptérosaures planant en cercle et libellules géantes (Meganeura)
 *   - Atmosphère : Rayons crépusculaires volumétriques & nuée de spores bioluminescentes
 * ============================================================================ */

registerArena({
    id: 'jungle',
    label: "🌿 Vallée d'Émeraude (Jungle du Jurassique)",
    skyColor: 0x162b26,
    floorColor: 0x152c22,
    accentColor: 0x4ade80,

    // Relief vallonné de la jungle : berges moussues surélevées, racines noueuses et lit de rivière central
    getGroundHeight(x, z = 0) {
        const riverHollow = -Math.exp(-(x * x) / 14.0) * 0.42;
        const rootMounds = Math.sin(x * 0.45) * 0.26 + Math.cos(x * 0.85) * 0.14;
        const outerBanks = Math.pow(Math.min(1, Math.abs(x) / 11.5), 2) * 0.62;
        return riverHollow + rootMounds + outerBanks;
    },

    // Éléments de décor 3D dynamiques (ajoutés à arenaGroup)
    buildDecor(group, scene) {
        const targetGroup = group || arenaGroup;

        // ====================================================================
        // 1. GÉNÉRATEURS DE TEXTURES PROCÉDURALES "CARTOON MATURE"
        // ====================================================================
        function getBarkTexture() {
            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 256;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#291811';
            ctx.fillRect(0, 0, 256, 256);

            for (let i = 0; i < 400; i++) {
                const x = Math.random() * 256;
                const y = Math.random() * 256;
                const w = 3 + Math.random() * 6;
                const h = 16 + Math.random() * 45;
                const shade = Math.random();
                ctx.fillStyle = shade < 0.35 ? '#170c07' : (shade < 0.75 ? '#4a2e1d' : '#22543d');
                ctx.fillRect(x, y, w, h);
            }
            ctx.strokeStyle = 'rgba(10, 6, 4, 0.72)';
            ctx.lineWidth = 2.5;
            for (let y = 0; y < 256; y += 14) {
                ctx.beginPath();
                ctx.moveTo(0, y + Math.sin(y) * 4);
                ctx.lineTo(256, y + Math.cos(y) * 4);
                ctx.stroke();
            }
            const tex = new THREE.CanvasTexture(canvas);
            tex.wrapS = THREE.RepeatWrapping;
            tex.wrapT = THREE.RepeatWrapping;
            tex.repeat.set(2, 2);
            if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
            return tex;
        }

        function getDinoSkinTexture() {
            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 256;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#2d4a3e';
            ctx.fillRect(0, 0, 256, 256);

            // Pavage d'écailles polygonales stylisées
            for (let i = 0; i < 850; i++) {
                const x = Math.random() * 256;
                const y = Math.random() * 256;
                const r = 2.5 + Math.random() * 5.5;
                ctx.fillStyle = i % 3 === 0 ? '#1b2e26' : (i % 2 === 0 ? '#4ade80' : '#14532d');
                ctx.beginPath();
                ctx.arc(x, y, r, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#0f1713';
                ctx.lineWidth = 1.0;
                ctx.stroke();
            }
            const tex = new THREE.CanvasTexture(canvas);
            tex.wrapS = THREE.RepeatWrapping;
            tex.wrapT = THREE.RepeatWrapping;
            if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
            return tex;
        }

        function getSporeGlowTexture() {
            const canvas = document.createElement('canvas');
            canvas.width = 64;
            canvas.height = 64;
            const ctx = canvas.getContext('2d');
            const grad = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
            grad.addColorStop(0, 'rgba(255, 255, 230, 1)');
            grad.addColorStop(0.35, 'rgba(74, 222, 128, 0.85)');
            grad.addColorStop(0.7, 'rgba(16, 185, 129, 0.4)');
            grad.addColorStop(1, 'rgba(5, 46, 22, 0)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 64, 64);
            const tex = new THREE.CanvasTexture(canvas);
            if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
            return tex;
        }

        const barkTex = getBarkTexture();
        const dinoSkinTex = getDinoSkinTexture();
        const sporeTex = getSporeGlowTexture();

        // ====================================================================
        // 2. SOL DE LA VALLÉE ET RIVIÈRE PRÉHISTORIQUE ANIMÉE
        // ====================================================================
        // Fond de vallée luxuriant & marécageux
        const groundMat = new THREE.MeshStandardMaterial({
            color: 0x1b2e23,
            roughness: 0.9,
            metalness: 0.05
        });
        const valleyFloor = new THREE.Mesh(new THREE.PlaneGeometry(120, 65, 32, 20), groundMat);
        valleyFloor.rotation.x = -Math.PI / 2;
        valleyFloor.position.set(0, -2.15, -18);
        valleyFloor.receiveShadow = true;
        targetGroup.add(valleyFloor);

        // Plan d'eau de la rivière avec ondulations dynamiques
        const waterGeo = new THREE.PlaneGeometry(100, 28, 50, 20);
        waterGeo.rotateX(-Math.PI / 2);
        const waterMat = new THREE.MeshStandardMaterial({
            color: 0x0f4c45,
            roughness: 0.18,
            metalness: 0.65,
            transparent: true,
            opacity: 0.85
        });
        const waterMesh = new THREE.Mesh(waterGeo, waterMat);
        waterMesh.position.set(0, -1.9, -16);
        waterMesh.receiveShadow = true;
        targetGroup.add(waterMesh);

        // Silhouettes de crêtes montagneuses et volcaniques en arrière-plan
        const volcanoGeo = new THREE.ConeGeometry(24, 32, 10, 2, true);
        const volcanoMat = new THREE.MeshStandardMaterial({
            color: 0x15221c,
            roughness: 0.96
        });
        const peak1 = new THREE.Mesh(volcanoGeo, volcanoMat);
        peak1.position.set(-28, 11, -38);
        targetGroup.add(peak1);

        // Cascade jurassique descendant du pic rocheux vers la rivière
        const waterfallGeo = new THREE.PlaneGeometry(5.5, 24, 8, 16);
        const waterfallMat = new THREE.MeshBasicMaterial({
            color: 0x6ee7b7,
            transparent: true,
            opacity: 0.75,
            side: THREE.DoubleSide
        });
        const waterfall = new THREE.Mesh(waterfallGeo, waterfallMat);
        waterfall.position.set(-23.5, 4.0, -32);
        waterfall.rotation.y = 0.55;
        waterfall.rotation.x = -0.12;
        targetGroup.add(waterfall);

        const peak2 = new THREE.Mesh(new THREE.ConeGeometry(18, 26, 8, 2, true), volcanoMat);
        peak2.position.set(30, 9, -42);
        targetGroup.add(peak2);

        // Lueur volcanique lointaine au couchant
        const volcanoLight = new THREE.PointLight(0xf97316, 0.7, 55);
        volcanoLight.position.set(-28, 16, -34);
        targetGroup.add(volcanoLight);

        // ====================================================================
        // 3. FLORE PRÉHISTORIQUE (Araucarias, Fougères arborescentes, Cycads)
        // ====================================================================
        const animatedFoliage = [];

        // Conifères Araucaria à branches étagées
        function addAraucaria(x, z, scale = 1) {
            const treeGroup = new THREE.Group();
            treeGroup.position.set(x, -2.1, z);

            const trunkHeight = 16 * scale;
            const trunkGeo = new THREE.CylinderGeometry(0.35 * scale, 0.95 * scale, trunkHeight, 7);
            const trunkMat = new THREE.MeshStandardMaterial({ map: barkTex, roughness: 0.9 });
            const trunk = new THREE.Mesh(trunkGeo, trunkMat);
            trunk.position.y = trunkHeight / 2;
            trunk.castShadow = true;
            treeGroup.add(trunk);

            const leafMat = new THREE.MeshStandardMaterial({
                color: 0x1e4620,
                roughness: 0.72
            });

            const tiers = 4;
            for (let t = 0; t < tiers; t++) {
                const tierY = trunkHeight * (0.6 + (t / tiers) * 0.4);
                const branches = 4 + t;
                const spread = (tiers - t) * 1.5 * scale + 1.2 * scale;

                for (let b = 0; b < branches; b++) {
                    const angle = (b / branches) * Math.PI * 2 + t * 0.6;
                    const bx = Math.cos(angle) * spread;
                    const bz = Math.sin(angle) * spread;

                    // Support de branche
                    const brGeo = new THREE.CylinderGeometry(0.08 * scale, 0.16 * scale, spread, 4);
                    brGeo.rotateZ(Math.PI / 2 - 0.15);
                    brGeo.rotateY(-angle);
                    const br = new THREE.Mesh(brGeo, trunkMat);
                    br.position.set(bx * 0.5, tierY - 0.2, bz * 0.5);
                    treeGroup.add(br);

                    // Coussin de feuillage géométrique
                    const pad = new THREE.Mesh(new THREE.DodecahedronGeometry(1.3 * scale, 1), leafMat);
                    pad.scale.set(1.5, 0.4, 1.5);
                    pad.position.set(bx, tierY, bz);
                    pad.castShadow = true;
                    treeGroup.add(pad);
                }
            }

            targetGroup.add(treeGroup);
            animatedFoliage.push({
                mesh: treeGroup,
                phase: Math.random() * Math.PI * 2,
                speed: 0.8 + Math.random() * 0.4,
                amp: 0.015
            });
        }

        // Fougère arborescente (Dicksonia)
        function addTreeFern(x, z, scale = 1) {
            const fernGroup = new THREE.Group();
            fernGroup.position.set(x, -2.1, z);

            const height = 5.2 * scale;
            const trunkGeo = new THREE.CylinderGeometry(0.18 * scale, 0.32 * scale, height, 6);
            const trunkMat = new THREE.MeshStandardMaterial({ map: barkTex, roughness: 0.95 });
            const trunk = new THREE.Mesh(trunkGeo, trunkMat);
            trunk.position.y = height / 2;
            trunk.castShadow = true;
            fernGroup.add(trunk);

            const crownGroup = new THREE.Group();
            crownGroup.position.y = height;
            fernGroup.add(crownGroup);

            const frondCount = 10;
            const frondMat = new THREE.MeshStandardMaterial({
                color: 0x22c55e,
                roughness: 0.6,
                side: THREE.DoubleSide
            });

            for (let i = 0; i < frondCount; i++) {
                const angle = (i / frondCount) * Math.PI * 2;
                const len = 3.0 * scale;
                const frondGeo = new THREE.PlaneGeometry(0.7 * scale, len, 2, 6);
                const pos = frondGeo.attributes.position;
                for (let v = 0; v < pos.count; v++) {
                    const vy = pos.getY(v) + len / 2;
                    const t = vy / len;
                    const archY = Math.sin(t * Math.PI * 0.75) * (len * 0.35) - t * t * (len * 0.3);
                    pos.setY(v, archY);
                    pos.setZ(v, t * len * 0.85);
                }
                frondGeo.computeVertexNormals();

                const frond = new THREE.Mesh(frondGeo, frondMat);
                frond.rotation.y = angle;
                frond.castShadow = true;
                crownGroup.add(frond);
            }

            targetGroup.add(fernGroup);
            animatedFoliage.push({
                mesh: crownGroup,
                phase: Math.random() * Math.PI * 2,
                speed: 1.4 + Math.random() * 0.5,
                amp: 0.04
            });
        }

        // Cycads et fougères basses
        function addGroundFern(x, z, scale = 1) {
            const group = new THREE.Group();
            group.position.set(x, -2.0, z);
            const frondMat = new THREE.MeshStandardMaterial({
                color: 0x16a34a,
                roughness: 0.7,
                side: THREE.DoubleSide
            });
            for (let i = 0; i < 7; i++) {
                const angle = (i / 7) * Math.PI * 2;
                const geo = new THREE.PlaneGeometry(0.5 * scale, 1.8 * scale, 1, 4);
                const mesh = new THREE.Mesh(geo, frondMat);
                mesh.rotation.y = angle;
                mesh.rotation.x = 0.55;
                group.add(mesh);
            }
            targetGroup.add(group);
            animatedFoliage.push({
                mesh: group,
                phase: Math.random() * Math.PI * 2,
                speed: 1.6 + Math.random() * 0.6,
                amp: 0.035
            });
        }

        // Rochers moussus
        function addMossyRock(x, z, scale = 1) {
            const rockGeo = new THREE.DodecahedronGeometry(1.2 * scale, 1);
            rockGeo.scale(1.2, 0.7, 1.0);
            const rockMat = new THREE.MeshStandardMaterial({ color: 0x24352a, roughness: 0.92 });
            const rock = new THREE.Mesh(rockGeo, rockMat);
            rock.position.set(x, -2.0 + 0.3 * scale, z);
            rock.rotation.set(Math.random(), Math.random(), Math.random());
            rock.castShadow = true;
            rock.receiveShadow = true;
            targetGroup.add(rock);
        }

        // Plantation des arbres et végétaux
        const treeCoords = [
            [-22, -15, 1.1], [-17, -22, 1.3], [-10, -26, 1.0],
            [12, -24, 1.2], [20, -18, 1.15], [26, -14, 0.95],
            [-26, -10, 0.9], [25, -28, 1.25]
        ];
        treeCoords.forEach(c => addAraucaria(c[0], c[1], c[2]));

        const fernCoords = [
            [-14, -12, 1.1], [-7, -13, 0.95], [6, -12, 1.0],
            [15, -13, 1.15], [-20, -11, 0.85], [19, -11, 0.9]
        ];
        fernCoords.forEach(c => addTreeFern(c[0], c[1], c[2]));

        for (let x = -16; x <= 16; x += 4) {
            addGroundFern(x + (Math.random() - 0.5) * 2, -7.5 + (Math.random() - 0.5) * 1.5, 0.9);
        }

        [-15, -9, 8, 16, -21, 22].forEach(x => {
            addMossyRock(x, -10 + Math.random() * 4, 0.8 + Math.random() * 0.7);
        });

        // ====================================================================
        // 4. FAUNE DU JURASSIQUE (Brachiosaures, Ptérosaures, Libellules)
        // ====================================================================
        // Troupeau de Brachiosaures dans la vallée
        const brachiosaurs = [];
        function createSauropod(startX, startZ, scale = 1, speed = 1.0) {
            const dino = new THREE.Group();
            const skinMat = new THREE.MeshStandardMaterial({
                map: dinoSkinTex,
                roughness: 0.78,
                metalness: 0.05
            });

            // Torso puissant et incliné vers les épaules
            const torsoGeo = new THREE.SphereGeometry(2.0 * scale, 12, 10);
            torsoGeo.scale(1.0, 1.15, 1.6);
            const torso = new THREE.Mesh(torsoGeo, skinMat);
            torso.position.set(0, 4.4 * scale, 0);
            torso.rotation.x = -0.16;
            torso.castShadow = true;
            dino.add(torso);

            // Cou articulé (base + partie haute + tête avec crête nasale)
            const neckBase = new THREE.Group();
            neckBase.position.set(0, 5.2 * scale, 2.2 * scale);
            dino.add(neckBase);

            const neckGeo = new THREE.CylinderGeometry(0.48 * scale, 0.95 * scale, 4.6 * scale, 8);
            const lowerNeck = new THREE.Mesh(neckGeo, skinMat);
            lowerNeck.position.set(0, 2.1 * scale, 0.7 * scale);
            lowerNeck.rotation.x = 0.26;
            lowerNeck.castShadow = true;
            neckBase.add(lowerNeck);

            const headPivot = new THREE.Group();
            headPivot.position.set(0, 4.2 * scale, 1.3 * scale);
            neckBase.add(headPivot);

            const headGeo = new THREE.BoxGeometry(0.65 * scale, 0.55 * scale, 1.15 * scale);
            const head = new THREE.Mesh(headGeo, skinMat);
            head.position.z = 0.3 * scale;
            headPivot.add(head);

            // Crête crânienne caractéristique
            const crest = new THREE.Mesh(new THREE.SphereGeometry(0.32 * scale, 7, 7), skinMat);
            crest.position.set(0, 0.35 * scale, 0.1 * scale);
            headPivot.add(crest);

            // Queue effilée
            const tailPivot = new THREE.Group();
            tailPivot.position.set(0, 4.0 * scale, -2.6 * scale);
            dino.add(tailPivot);

            const tailGeo = new THREE.ConeGeometry(0.8 * scale, 6.2 * scale, 8);
            tailGeo.rotateX(-Math.PI / 2 - 0.22);
            const tail = new THREE.Mesh(tailGeo, skinMat);
            tail.position.set(0, -0.6 * scale, -2.8 * scale);
            tail.castShadow = true;
            tailPivot.add(tail);

            // 4 Pattes articulées (pattes avant plus hautes que pattes arrière)
            const legs = [];
            const legDefs = [
                { x: -1.05 * scale, y: 4.1 * scale, z: 1.7 * scale, h: 4.1 * scale, phase: 0 },
                { x: 1.05 * scale, y: 4.1 * scale, z: 1.7 * scale, h: 4.1 * scale, phase: Math.PI },
                { x: -0.95 * scale, y: 3.6 * scale, z: -1.7 * scale, h: 3.6 * scale, phase: Math.PI * 0.5 },
                { x: 0.95 * scale, y: 3.6 * scale, z: -1.7 * scale, h: 3.6 * scale, phase: Math.PI * 1.5 }
            ];

            legDefs.forEach(def => {
                const pivot = new THREE.Group();
                pivot.position.set(def.x, def.y, def.z);
                const legMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.42 * scale, 0.36 * scale, def.h, 7), skinMat);
                legMesh.position.y = -def.h / 2;
                legMesh.castShadow = true;
                pivot.add(legMesh);
                dino.add(pivot);
                legs.push({ pivot, phase: def.phase });
            });

            dino.position.set(startX, -2.0, startZ);
            targetGroup.add(dino);

            brachiosaurs.push({
                group: dino,
                neckBase,
                headPivot,
                tailPivot,
                legs,
                xPos: startX,
                zPos: startZ,
                speed,
                scale,
                phase: Math.random() * 10
            });
        }

        createSauropod(-12, -20, 0.9, 1.2);
        createSauropod(10, -25, 0.72, 1.4);

        // Ptérosaures planant au-dessus de la canopée
        const pterosaurs = [];
        function createPterosaur(orbitRadius, height, speed, phaseOffset) {
            const pGroup = new THREE.Group();
            const pMat = new THREE.MeshStandardMaterial({
                color: 0x4a3228,
                roughness: 0.75,
                side: THREE.DoubleSide
            });

            // Corps et crête
            const body = new THREE.Mesh(new THREE.ConeGeometry(0.22, 1.4, 6), pMat);
            body.rotation.x = Math.PI / 2;
            pGroup.add(body);

            const crest = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.9, 5), pMat);
            crest.position.set(0, 0.22, -0.35);
            crest.rotation.x = -Math.PI / 2 + 0.25;
            pGroup.add(crest);

            // Ailes membraneuses
            const wingGeo = new THREE.BufferGeometry();
            const wingVerts = new Float32Array([
                0, 0, 0.25,
                2.2, 0.05, -0.1,
                0, 0, -0.45
            ]);
            wingGeo.setAttribute('position', new THREE.BufferAttribute(wingVerts, 3));
            wingGeo.computeVertexNormals();

            const leftWing = new THREE.Mesh(wingGeo, pMat);
            const rightWing = new THREE.Mesh(wingGeo, pMat);
            rightWing.scale.x = -1;

            pGroup.add(leftWing);
            pGroup.add(rightWing);

            targetGroup.add(pGroup);
            pterosaurs.push({
                group: pGroup,
                leftWing,
                rightWing,
                radius: orbitRadius,
                height,
                speed,
                phase: phaseOffset
            });
        }

        createPterosaur(18, 14, 0.35, 0);
        createPterosaur(26, 17, 0.28, 2.2);
        createPterosaur(22, 12, 0.42, 4.4);

        // Libellules géantes préhistoriques (Meganeura)
        const dragonflies = [];
        function createDragonfly(x, y, z) {
            const dGroup = new THREE.Group();
            const bodyMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.3 });
            const body = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.02, 0.7, 5), bodyMat);
            body.rotation.x = Math.PI / 2;
            dGroup.add(body);

            const wingMat = new THREE.MeshBasicMaterial({ color: 0xa7f3d0, transparent: true, opacity: 0.5, side: THREE.DoubleSide });
            const w1 = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.16), wingMat);
            const w2 = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.16), wingMat);
            w1.position.z = 0.08;
            w2.position.z = -0.08;
            dGroup.add(w1, w2);

            dGroup.position.set(x, y, z);
            targetGroup.add(dGroup);

            dragonflies.push({
                group: dGroup,
                w1, w2,
                baseX: x, baseY: y, baseZ: z,
                phase: Math.random() * 10
            });
        }

        createDragonfly(-5, 0.8, -7);
        createDragonfly(6, 1.2, -8);
        createDragonfly(-11, 1.5, -9);
        createDragonfly(12, 0.9, -7.5);

        // ====================================================================
        // 5. ATMOSPHÈRE : SPORES BIOLUMINESCENTES & RAYONS DU SOLEIL
        // ====================================================================
        // Spores en suspension / Lucioles de jungle
        const sporeCount = 180;
        const sporeGeo = new THREE.BufferGeometry();
        const sporePositions = new Float32Array(sporeCount * 3);
        for (let i = 0; i < sporeCount; i++) {
            sporePositions[i * 3] = -24 + Math.random() * 48;
            sporePositions[i * 3 + 1] = -1.5 + Math.random() * 14;
            sporePositions[i * 3 + 2] = -5 - Math.random() * 25;
        }
        sporeGeo.setAttribute('position', new THREE.BufferAttribute(sporePositions, 3));

        const sporeMat = new THREE.PointsMaterial({
            size: 0.65,
            map: sporeTex,
            transparent: true,
            opacity: 0.85,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        const sporeSystem = new THREE.Points(sporeGeo, sporeMat);
        targetGroup.add(sporeSystem);

        // Rayons crépusculaires volumétriques perçant la canopée
        const sunbeamGroup = new THREE.Group();
        const beamMat = new THREE.MeshBasicMaterial({
            color: 0xfef08a,
            transparent: true,
            opacity: 0.042,
            side: THREE.DoubleSide,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });

        for (let i = 0; i < 5; i++) {
            const beam = new THREE.Mesh(new THREE.ConeGeometry(5 + i * 1.5, 30, 8, 1, true), beamMat);
            beam.position.set(-16 + i * 8, 12, -18 + (i % 2) * 4);
            beam.rotation.z = -0.28;
            beam.rotation.x = 0.18;
            sunbeamGroup.add(beam);
        }
        targetGroup.add(sunbeamGroup);

        return {
            waterMesh,
            waterfall,
            animatedFoliage,
            brachiosaurs,
            pterosaurs,
            dragonflies,
            sporeSystem,
            sunbeamGroup
        };
    },

    // ========================================================================
    // ANIMATION EN TEMPS RÉEL DE L'ÉCOSYSTÈME JURASSIQUE
    // ========================================================================
    animate(decor, group, scene, time, dt) {
        if (!decor) return;

        // 1. Ondulations liquides de la rivière préhistorique et chute d'eau
        if (decor.waterfall && decor.waterfall.material) {
            decor.waterfall.material.opacity = 0.65 + Math.sin(time * 8.0) * 0.15;
        }
        if (decor.waterMesh && decor.waterMesh.geometry && decor.waterMesh.geometry.attributes.position) {
            const pos = decor.waterMesh.geometry.attributes.position;
            for (let i = 0; i < pos.count; i++) {
                const wx = pos.getX(i);
                const wz = pos.getZ(i);
                const wave = Math.sin(wx * 0.4 + time * 2.4) * 0.08 + Math.cos(wz * 0.3 - time * 1.9) * 0.07;
                pos.setY(i, wave);
            }
            pos.needsUpdate = true;
        }

        // 2. Balancement du feuillage dans la brise tropicale
        if (decor.animatedFoliage) {
            decor.animatedFoliage.forEach(f => {
                f.mesh.rotation.z = Math.sin(time * f.speed + f.phase) * f.amp;
                f.mesh.rotation.x = Math.cos(time * (f.speed * 0.8) + f.phase) * (f.amp * 0.6);
            });
        }

        // 3. Déambulation majestueuse des Brachiosaures dans la vallée
        if (decor.brachiosaurs) {
            decor.brachiosaurs.forEach(dino => {
                // Avance continue le long de l'axe X dans la vallée
                dino.xPos += dino.speed * dt * 0.8;
                if (dino.xPos > 32) dino.xPos = -32;
                dino.group.position.x = dino.xPos;
                dino.group.rotation.y = Math.PI / 2;

                const walkCycle = time * 2.2 + dino.phase;
                // Balancement des 4 pattes articulées
                dino.legs.forEach(leg => {
                    leg.pivot.rotation.x = Math.sin(walkCycle + leg.phase) * 0.28;
                });

                // Ondulation du cou et contrebalancement de la queue
                dino.neckBase.rotation.x = Math.sin(time * 0.8 + dino.phase) * 0.06;
                dino.neckBase.rotation.y = Math.cos(time * 0.5 + dino.phase) * 0.12;
                dino.headPivot.rotation.x = Math.sin(time * 1.0 + dino.phase) * 0.05;
                dino.tailPivot.rotation.y = Math.cos(walkCycle * 0.5) * 0.18;
            });
        }

        // 4. Vol plané et battements d'ailes des Ptérosaures
        if (decor.pterosaurs) {
            decor.pterosaurs.forEach(p => {
                const angle = time * p.speed + p.phase;
                const px = Math.cos(angle) * p.radius;
                const pz = -18 + Math.sin(angle) * (p.radius * 0.65);
                const py = p.height + Math.sin(time * 1.4 + p.phase) * 1.5;

                p.group.position.set(px, py, pz);
                p.group.rotation.y = -angle;
                p.group.rotation.z = 0.2; // Inclinaison dans le virage

                const flap = Math.sin(time * 6.5 + p.phase) * 0.45;
                p.leftWing.rotation.z = flap;
                p.rightWing.rotation.z = -flap;
            });
        }

        // 5. Vol stationnaire, Flocking autonome Yuka (Separation/Alignment/Cohesion/Wander) et vrombissement des ailes des Meganeura
        if (typeof ArenaFaunaFlockSystem !== 'undefined') {
            ArenaFaunaFlockSystem.update(decor, time, dt);
        } else if (decor.dragonflies) {
            decor.dragonflies.forEach(d => {
                const t = time * 2.0 + d.phase;
                d.group.position.x = d.baseX + Math.sin(t) * 1.8;
                d.group.position.y = d.baseY + Math.sin(t * 1.6) * 0.35;
                d.group.position.z = d.baseZ + Math.cos(t * 0.9) * 1.2;
                const buzz = Math.sin(time * 36 + d.phase) * 0.35;
                d.w1.rotation.z = buzz;
                d.w2.rotation.z = -buzz;
            });
        }

        // 6. Dérive fluide des spores bioluminescentes
        if (decor.sporeSystem && decor.sporeSystem.geometry && decor.sporeSystem.geometry.attributes.position) {
            const pos = decor.sporeSystem.geometry.attributes.position;
            for (let i = 0; i < pos.count; i++) {
                let py = pos.getY(i) + Math.sin(time + i) * 0.012;
                let px = pos.getX(i) + Math.cos(time * 0.6 + i) * 0.014;
                if (py > 13) py = -1.5;
                if (px > 24) px = -24;
                pos.setY(i, py);
                pos.setX(i, px);
            }
            pos.needsUpdate = true;
        }

        // 7. Pulsation douce des rayons solaires volumétriques
        if (decor.sunbeamGroup) {
            decor.sunbeamGroup.children.forEach((beam, idx) => {
                if (beam.material) {
                    beam.material.opacity = 0.035 + Math.sin(time * 0.8 + idx) * 0.012;
                }
            });
        }
    }
});
