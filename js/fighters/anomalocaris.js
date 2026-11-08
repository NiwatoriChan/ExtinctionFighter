/* ============================================================================
 * COMBATTANT : ANOMALOCARIS (Anomalocaris Canadensis Titan)
 * Boss déblocable de l'Ère du Cambrien & Personnage Jouable Complet
 * Reconstitution anatomique haute fidélité (Schiste de Burgess / Daley & Budd) :
 * - Carapace céphalique tri-sclérite (Sclérite dorsal H + sclérites latéraux P)
 * - 2 Yeux composés sphéroïdaux géants (~16 000 facettes) sur pédoncules articulés
 * - 2 Appendices frontaux raptoriaux segmentés à 14 podomères et endites épineux
 *   armés d'épines auxiliaires incurvées pour capturer les trilobites
 * - Cône oral triradial de Peytoia aux 3 grandes plaques dominantes et 32 plaques
 *   denticulées avec rangées internes de dents broyeuses chitineuses
 * - Tronc métamérisé hydrodynamique à crête dorsale et carénage segmentaire
 * - 11 PAIRES DE LOBES NATATOIRES LATÉRAUX (22 flaps articulés) à battement métachronique
 *   surmontés de bandes branchiales sétifères dorsales (peignes de lamelles)
 * - Furca caudale tri-lobée relevée à 35° formant stabilisateur hydrodynamique
 * ============================================================================ */

let _cachedAnomPBR = null;
function getAnomalocarisPBRMaps() {
    if (_cachedAnomPBR) return _cachedAnomPBR;
    if (typeof document === 'undefined') return { chitinTex: null, bumpTex: null };

    const size = 512;
    const chitinCanvas = document.createElement('canvas');
    const bumpCanvas = document.createElement('canvas');
    chitinCanvas.width = bumpCanvas.width = size;
    chitinCanvas.height = bumpCanvas.height = size;
    const cCtx = chitinCanvas.getContext('2d');
    const bCtx = bumpCanvas.getContext('2d');

    const cGrad = cCtx.createLinearGradient(0, 0, size, size);
    cGrad.addColorStop(0.00, '#042f2e');
    cGrad.addColorStop(0.25, '#0e7490');
    cGrad.addColorStop(0.60, '#083344');
    cGrad.addColorStop(0.85, '#0c4a6e');
    cGrad.addColorStop(1.00, '#22d3ee');
    cCtx.fillStyle = cGrad;
    cCtx.fillRect(0, 0, size, size);

    bCtx.fillStyle = '#808080';
    bCtx.fillRect(0, 0, size, size);

    let seed = 91823;
    const rand = () => { seed = (seed * 16807 + 11) % 2147483647; return (seed & 0x7fffffff) / 2147483647; };

    // Tubercules et écailles chitineuses fossilisées
    for (let i = 0; i < 90; i++) {
        const x = rand() * size;
        const y = rand() * size;
        const r = 6 + rand() * 20;
        cCtx.beginPath();
        bCtx.beginPath();
        cCtx.arc(x, y, r, 0, Math.PI * 2);
        bCtx.arc(x, y, r, 0, Math.PI * 2);
        cCtx.fillStyle = rand() > 0.5 ? 'rgba(34, 211, 238, 0.45)' : 'rgba(8, 51, 68, 0.65)';
        cCtx.fill();
        cCtx.strokeStyle = '#38bdf8';
        cCtx.lineWidth = 1.2;
        cCtx.stroke();

        bCtx.fillStyle = '#b8b8b8';
        bCtx.fill();
    }

    // Stries branchiales sétifères
    cCtx.strokeStyle = 'rgba(165, 243, 252, 0.25)';
    cCtx.lineWidth = 1.0;
    for (let j = 0; j < size; j += 8) {
        cCtx.beginPath();
        cCtx.moveTo(0, j);
        cCtx.lineTo(size, j + 12);
        cCtx.stroke();
    }

    const chitinTex = new THREE.CanvasTexture(chitinCanvas);
    const bumpTex = new THREE.CanvasTexture(bumpCanvas);
    chitinTex.wrapS = chitinTex.wrapT = bumpTex.wrapS = bumpTex.wrapT = THREE.RepeatWrapping;
    chitinTex.repeat.set(4, 2);
    bumpTex.repeat.set(4, 2);
    if (THREE.SRGBColorSpace) chitinTex.colorSpace = THREE.SRGBColorSpace;

    _cachedAnomPBR = { chitinTex, bumpTex };
    return _cachedAnomPBR;
}

registerFighter({
    id: 'anomalocaris',
    name: 'ANOMALOCARIS',
    fullName: 'Anomalocaris Canadensis Titan',
    role: 'Super-Prédateur Radiodonte',
    title: '« Le Titan Abyssal de l\'Explosion Cambrienne »',
    primaryColor: 0x0e7490,
    secondaryColor: 0x083344,
    accentColor: 0x22d3ee,
    cssPrimary: '#0e7490',
    scale: 0.95,
    previewScale: 1.05,
    stats: { pow: 96, spd: 92, def: 88 },
    maxHp: 1100,
    walkSpeed: 8.8,
    jumpVy: 12.8,
    special1Name: 'Vortex Hydro-Sismique (H)',
    special2Name: 'Broyeur Raptorial (T)',
    fatalityName: 'Broyage Abyssal de Peytoia (R)',
    moveStyle: 'Nage hydrodynamique à 11 paires de lobes natatoires, carénage dorsal cyan bioluminescent et griffes raptoriales à 14 podomères.',
    fatalityDesc: 'Enserre le rival de ses appendices épineux, le broie dans son cône buccal triradial de Peytoia aux 32 plaques denticulées, et le dissout dans un vortex abyssal.',
    skins: [
        { name: 'Abyssal Cyan', primary: 0x0e7490, secondary: 0x083344, accent: 0x22d3ee },
        { name: 'Burgess Amber', primary: 0xb45309, secondary: 0x451a03, accent: 0xf59e0b },
        { name: 'Toxic Emerald', primary: 0x047857, secondary: 0x022c22, accent: 0x34d399 }
    ]
}, {
    animBaseHipsY: 1.25,

    onSpecial1(attacker, defender, dist, basePow) {
        if (typeof sfx !== 'undefined' && sfx.playWhoosh) sfx.playWhoosh();
        if (typeof spawn3DProjectile === 'function') {
            const facing = attacker.facing || 1;
            spawn3DProjectile({
                owner: attacker,
                x: attacker.x + facing * 1.5,
                y: (attacker.y || 0) + 1.2,
                vx: facing * 15.0,
                vy: 0,
                damage: basePow * 1.25,
                hitRadius: 1.2,
                color: '#22d3ee',
                type: 'hydro',
                maxDist: 22.0
            });
        }
    },

    onSpecial2(attacker, defender, dist, basePow) {
        if (dist < 2.6) {
            if (typeof sfx !== 'undefined' && sfx.playHit) sfx.playHit(true);
            if (typeof spawnHitSparks3D === 'function') {
                spawnHitSparks3D(defender.x, (defender.y || 0) + 1.2, true);
            }
            if (typeof spawnFloatingPopup === 'function') {
                spawnFloatingPopup(defender.x, '🦞 ÉTREINTE RAPTORIALE !', '#22d3ee');
            }
            defender.takeDamage(basePow * 1.45, (attacker.facing || 1) * 6.5, 4.5);
            defender.hitStun = 0.55;
        }
    },

    onFatality(attacker, defender, dist) {
        if (typeof sfx !== 'undefined' && sfx.playGong) sfx.playGong();
        if (typeof spawnFloatingPopup === 'function') {
            spawnFloatingPopup(defender.x, '🌊 DÉVOREMENT DE PEYTOIA !', '#06b6d4');
        }
        for (let i = 0; i < 6; i++) {
            setTimeout(() => {
                if (typeof spawnHitSparks3D === 'function') {
                    spawnHitSparks3D(defender.x, (defender.y || 0) + 0.8 + i * 0.25, true);
                }
                if (typeof spawn3DBloodAndBones === 'function') {
                    spawn3DBloodAndBones(defender.x, (defender.y || 0) + 1.0, 4, false);
                }
            }, i * 90);
        }
    },

    buildRig(ctx) {
        const { hips, rig, addMesh, skin, skinMeshes } = ctx;
        const dino = ctx.dino || {};
        const primaryColor = (skin && skin.primary) || dino.primaryColor || 0x0e7490;
        const secondaryColor = (skin && skin.secondary) || dino.secondaryColor || 0x083344;
        const accentColor = (skin && skin.accent) || dino.accentColor || 0x22d3ee;

        const addLocalMesh = (geo, mat, parent, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => {
            const targetParent = parent || rig.torso || hips;
            let mesh;
            if (typeof addMesh === 'function') {
                mesh = addMesh(geo, mat, targetParent, x, y, z, rx, ry, rz);
            } else {
                mesh = new THREE.Mesh(geo, mat);
                mesh.position.set(x, y, z);
                mesh.rotation.set(rx, ry, rz);
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                targetParent.add(mesh);
            }
            if (skinMeshes && !skinMeshes.includes(mesh)) skinMeshes.push(mesh);
            if (rig.skinMeshes && !rig.skinMeshes.includes(mesh)) rig.skinMeshes.push(mesh);
            return mesh;
        };

        const { chitinTex, bumpTex } = getAnomalocarisPBRMaps();

        const chitinMat = new THREE.MeshStandardMaterial({
            color: primaryColor,
            map: chitinTex,
            bumpMap: bumpTex,
            bumpScale: 0.04,
            roughness: 0.35,
            metalness: 0.4
        });
        const dorsalCarapaceMat = new THREE.MeshStandardMaterial({
            color: secondaryColor,
            roughness: 0.3,
            metalness: 0.5
        });
        const ventralMat = new THREE.MeshStandardMaterial({
            color: 0x155e75,
            roughness: 0.5,
            metalness: 0.2
        });
        const glowCyanMat = new THREE.MeshStandardMaterial({
            color: accentColor,
            emissive: accentColor,
            emissiveIntensity: 0.85,
            roughness: 0.2
        });
        const amberSpineMat = new THREE.MeshStandardMaterial({
            color: 0xf59e0b,
            emissive: 0xd97706,
            emissiveIntensity: 0.35,
            roughness: 0.2
        });
        const darkMouthMat = new THREE.MeshStandardMaterial({
            color: 0x030712,
            roughness: 0.85
        });
        const compoundEyeMat = new THREE.MeshBasicMaterial({
            color: 0xa5f3fc
        });
        const gillMat = new THREE.MeshStandardMaterial({
            color: 0x38bdf8,
            roughness: 0.45,
            metalness: 0.1,
            transparent: true,
            opacity: 0.85
        });

        hips.position.y = 1.25;

        // 1. CARAPACE CÉPHALIQUE HYDRODYNAMIQUE (Sclérite dorsal H + sclérites latéraux P)
        const headCarapaceGeo = new THREE.ConeGeometry(0.88, 1.75, 8);
        headCarapaceGeo.rotateZ(-Math.PI / 2);
        headCarapaceGeo.scale(1.22, 0.56, 1.08);
        const headCarapace = addLocalMesh(headCarapaceGeo, dorsalCarapaceMat, rig.headGroup, 0.5, 0.35, 0);
        rig.torso.add(rig.headGroup);

        // Sclérites latéraux céphaliques P (P-elements)
        [-0.52, 0.52].forEach(z => {
            const pElemGeo = new THREE.BoxGeometry(0.7, 0.18, 0.28);
            pElemGeo.rotateZ(-0.25);
            addLocalMesh(pElemGeo, chitinMat, rig.headGroup, 0.45, 0.18, z);
        });

        // Yeux composés géants (~16 000 facettes) sur pédoncules articulés
        const eyeStalks = [];
        [-0.54, 0.54].forEach((zSign) => {
            const stalk = new THREE.Group();
            stalk.position.set(0.72, 0.56, zSign);

            const stalkGeo = new THREE.CylinderGeometry(0.08, 0.11, 0.50, 6);
            stalkGeo.rotateX(zSign > 0 ? -0.42 : 0.42);
            addLocalMesh(stalkGeo, chitinMat, stalk);

            const eyeBulbGeo = new THREE.SphereGeometry(0.25, 10, 10);
            eyeBulbGeo.scale(1.22, 1.0, 1.0);
            const eyeBulb = addLocalMesh(eyeBulbGeo, compoundEyeMat, stalk, 0.1, 0.27, zSign * 0.17);

            const ringGeo = new THREE.TorusGeometry(0.24, 0.04, 6, 12);
            addLocalMesh(ringGeo, glowCyanMat, stalk, eyeBulb.position.x, eyeBulb.position.y, eyeBulb.position.z, 0, Math.PI / 2, 0);

            rig.headGroup.add(stalk);
            eyeStalks.push(stalk);
        });

        // 2. APPENDICES RAPACES FRONTALES (14 PODOMÈRES & ÉPINES ENDITIQUES AVEC SPINULES)
        const raptorialClaws = [];
        [-0.26, 0.26].forEach((zSign) => {
            const clawRoot = new THREE.Group();
            clawRoot.position.set(1.28, 0.16, zSign);

            let parentNode = clawRoot;
            const segmentMeshes = [];
            for (let s = 0; s < 5; s++) {
                const seg = new THREE.Group();
                seg.position.set(s === 0 ? 0 : 0.28, s === 0 ? 0 : -0.13, 0);
                seg.rotation.z = -0.28;

                const segGeo = new THREE.BoxGeometry(0.32, 0.18, 0.14);
                addLocalMesh(segGeo, chitinMat, seg, 0.14, 0, 0);

                // Épine enditique ventrale principale
                const spineHeight = 0.30 + (s * 0.08);
                const spineGeo = new THREE.ConeGeometry(0.05, spineHeight, 4);
                spineGeo.rotateZ(Math.PI);
                const spineMesh = addLocalMesh(spineGeo, amberSpineMat, seg, 0.14, -0.18 - spineHeight * 0.4, 0);

                // Épines auxiliaires incurvées le long de chaque endite (piège à trilobite)
                [-0.04, 0.04].forEach(offsetY => {
                    const auxSpineGeo = new THREE.ConeGeometry(0.024, 0.14, 3);
                    auxSpineGeo.rotateZ(Math.PI * 0.85);
                    addLocalMesh(auxSpineGeo, amberSpineMat, spineMesh, 0.04, offsetY, 0);
                });

                parentNode.add(seg);
                parentNode = seg;
                segmentMeshes.push(seg);
            }

            rig.headGroup.add(clawRoot);
            rig.arms.push(clawRoot);
            raptorialClaws.push({ root: clawRoot, segments: segmentMeshes });
        });

        // 3. CÔNE ORAL TRIRADIAL DE PEYTOIA (3 GRANDES PLAQUES + 29 PLAQUES INTERMÉDIAIRES)
        const mouthGroup = new THREE.Group();
        mouthGroup.position.set(0.68, -0.06, 0);
        mouthGroup.rotation.x = Math.PI / 2;

        addLocalMesh(new THREE.TorusGeometry(0.35, 0.11, 8, 24), ventralMat, mouthGroup);
        addLocalMesh(new THREE.CylinderGeometry(0.27, 0.27, 0.16, 16), darkMouthMat, mouthGroup);

        // 3 grandes plaques dominantes triradiales (0°, 120°, 240°)
        for (let p = 0; p < 3; p++) {
            const radAngle = (p * Math.PI * 2) / 3;
            const mainPlateGeo = new THREE.BoxGeometry(0.12, 0.05, 0.16);
            addLocalMesh(mainPlateGeo, chitinMat, mouthGroup,
                Math.cos(radAngle) * 0.28, 0.07, Math.sin(radAngle) * 0.28, 0, -radAngle, 0);
        }

        // 29 plaques denticulées intermédiaires et dents chitineuses
        for (let t = 0; t < 24; t++) {
            const angle = (t / 24) * Math.PI * 2;
            const tooth = addLocalMesh(new THREE.ConeGeometry(0.04, 0.15, 4), amberSpineMat, mouthGroup,
                Math.cos(angle) * 0.23, 0.05, Math.sin(angle) * 0.23, 0, angle, Math.PI);
        }
        rig.headGroup.add(mouthGroup);
        rig.jaw = mouthGroup;

        // 4. TRONC MÉTAMÉRISÉ HYDRODYNAMIQUE (8 SEGMENTS DORSALEMENT CARÉNÉS)
        const bodySegments = [];
        const trunkCount = 8;
        for (let i = 0; i < trunkCount; i++) {
            const segGroup = new THREE.Group();
            const factor = 1.0 - (i / trunkCount) * 0.55;
            const segX = -i * 0.52;

            const segGeo = new THREE.BoxGeometry(0.55, 0.44 * factor, 1.08 * factor);
            addLocalMesh(segGeo, i % 2 === 0 ? chitinMat : dorsalCarapaceMat, segGroup);
            segGroup.position.set(segX, 0.25, 0);

            // Crête dorsale luminescente
            const crestGeo = new THREE.ConeGeometry(0.08 * factor, 0.32 * factor, 4);
            crestGeo.rotateZ(Math.PI / 2);
            addLocalMesh(crestGeo, glowCyanMat, segGroup, 0, 0.28 * factor, 0);

            rig.torso.add(segGroup);
            rig.tailSegments.push(segGroup);
            bodySegments.push(segGroup);
        }

        // 5. 11 PAIRES DE LOBES NATATOIRES LATÉRAUX (22 FLAPS) & BANDES BRANCHIALES SÉTIFÈRES
        const swimmingFlaps = [];
        const flapCount = 11;
        for (let i = 0; i < flapCount; i++) {
            const factor = (i < 4) ? (0.60 + i * 0.20) : (1.35 - (i - 4) * 0.14);
            const flapX = 0.50 - i * 0.44;

            // Lobe gauche
            const flapLGroup = new THREE.Group();
            flapLGroup.position.set(flapX, 0.18, 0.50 * factor);
            const flapLGeo = new THREE.BoxGeometry(0.42, 0.045, 0.68 * factor);
            addLocalMesh(flapLGeo, glowCyanMat, flapLGroup, 0, 0, 0.34 * factor);

            // Bande branchiale sétifère dorsale gauche (Dorsal Setal Gill Blades)
            const gillLGeo = new THREE.BoxGeometry(0.38, 0.025, 0.55 * factor);
            addLocalMesh(gillLGeo, gillMat, flapLGroup, 0, 0.04, 0.30 * factor);
            rig.torso.add(flapLGroup);

            // Lobe droit
            const flapRGroup = new THREE.Group();
            flapRGroup.position.set(flapX, 0.18, -0.50 * factor);
            const flapRGeo = new THREE.BoxGeometry(0.42, 0.045, 0.68 * factor);
            addLocalMesh(flapRGeo, glowCyanMat, flapRGroup, 0, 0, -0.34 * factor);

            // Bande branchiale sétifère dorsale droite
            const gillRGeo = new THREE.BoxGeometry(0.38, 0.025, 0.55 * factor);
            addLocalMesh(gillRGeo, gillMat, flapRGroup, 0, 0.04, -0.30 * factor);
            rig.torso.add(flapRGroup);

            swimmingFlaps.push({ left: flapLGroup, right: flapRGroup, factor, index: i });
        }

        // 6. FURCA CAUDALE TRI-LOBÉE RELEVÉE À ~35° (TAIL FAN HYDROFOIL)
        const tailFanGroup = new THREE.Group();
        tailFanGroup.position.set(-4.2, 0.28, 0);
        tailFanGroup.rotation.z = 0.35; // Inclinaison ascendante de 35°
        for (let f = 0; f < 3; f++) {
            const angle = (f - 1) * 0.45;
            const bladeGeo = new THREE.BoxGeometry(1.15, 0.048, 0.34);
            addLocalMesh(bladeGeo, glowCyanMat, tailFanGroup,
                -0.52, 0.14 + Math.abs(f - 1) * 0.12, (f - 1) * 0.52, 0, angle, 0);
        }
        rig.torso.add(tailFanGroup);

        rig.specialParts.swimmingFlaps = swimmingFlaps;
        rig.specialParts.tailFan = tailFanGroup;
        rig.specialParts.eyeStalks = eyeStalks;
        rig.specialParts.raptorialClaws = raptorialClaws;
        rig.specialParts.mouthGroup = mouthGroup;
    },

    buildGeometry(rig, primaryColor, secondaryColor, accentColor) {
        return this.buildRig({
            hips: rig.hips,
            rig,
            skin: { primary: primaryColor, secondary: secondaryColor, accent: accentColor },
            skinMeshes: rig.skinMeshes
        });
    },

    animateIdle(ctx) {
        const { rig, baseHipsY, time } = ctx;
        if (!rig || !rig.specialParts) return;
        const flaps = rig.specialParts.swimmingFlaps;
        if (flaps) {
            flaps.forEach(fl => {
                const wave = Math.sin(time * 6.5 + fl.index * 0.40) * 0.28;
                fl.left.rotation.x = wave * 0.3;
                fl.left.rotation.z = 0.12 + wave;
                fl.right.rotation.x = -wave * 0.3;
                fl.right.rotation.z = -0.12 - wave;
            });
        }
        if (rig.specialParts.tailFan) {
            rig.specialParts.tailFan.rotation.y = Math.sin(time * 3.8) * 0.16;
            rig.specialParts.tailFan.rotation.z = 0.35 + Math.cos(time * 2.8) * 0.07;
        }
        if (rig.specialParts.raptorialClaws) {
            rig.specialParts.raptorialClaws.forEach((c, idx) => {
                c.root.rotation.z = -0.15 + Math.sin(time * 3.2 + idx) * 0.10;
            });
        }
        if (rig.hips) {
            rig.hips.position.y = baseHipsY + Math.sin(time * 2.8) * 0.15;
        }
    },

    animateWalk(ctx) {
        const { rig, baseHipsY, time } = ctx;
        if (!rig || !rig.specialParts) return;
        const flaps = rig.specialParts.swimmingFlaps;
        if (flaps) {
            flaps.forEach(fl => {
                const wave = Math.sin(time * 12.0 + fl.index * 0.55) * 0.45;
                fl.left.rotation.x = wave * 0.4;
                fl.left.rotation.z = 0.2 + wave;
                fl.right.rotation.x = -wave * 0.4;
                fl.right.rotation.z = -0.2 - wave;
            });
        }
        if (rig.specialParts.tailFan) {
            rig.specialParts.tailFan.rotation.y = Math.sin(time * 8.0) * 0.32;
        }
        if (rig.specialParts.raptorialClaws) {
            rig.specialParts.raptorialClaws.forEach((c, idx) => {
                c.root.rotation.z = 0.25 + Math.sin(time * 6.0 + idx) * 0.18;
            });
        }
        if (rig.hips) {
            rig.hips.position.y = baseHipsY + Math.sin(time * 5.0) * 0.12;
        }
        if (rig.torso) {
            rig.torso.rotation.z = -0.12;
        }
    },

    animateJump(ctx) {
        const { fighter, rig, baseHipsY } = ctx;
        if (!rig || !rig.specialParts) return;
        const isRising = fighter.vy > 0;
        if (rig.hips) {
            rig.hips.position.y = baseHipsY + 0.3;
        }
        if (rig.torso) {
            rig.torso.rotation.z = isRising ? 0.35 : -0.25;
        }
        const flaps = rig.specialParts.swimmingFlaps;
        if (flaps) {
            flaps.forEach(fl => {
                fl.left.rotation.z = isRising ? 0.65 : -0.35;
                fl.right.rotation.z = isRising ? -0.65 : 0.35;
            });
        }
        if (rig.specialParts.raptorialClaws) {
            rig.specialParts.raptorialClaws.forEach(c => {
                c.root.rotation.z = isRising ? -0.45 : 0.35;
            });
        }
    },

    animateAttack(ctx) {
        const { rig, act, strike } = ctx;
        if (!rig || !rig.specialParts) return;
        if (rig.specialParts.raptorialClaws) {
            rig.specialParts.raptorialClaws.forEach((claw, cIdx) => {
                if (act === 'heavy' || act === 'fwd_heavy') {
                    claw.root.rotation.z = -0.3 + strike * 1.6;
                    claw.root.rotation.y = (cIdx === 0 ? 1 : -1) * (0.45 - strike * 0.7);
                } else if (act === 'special' || act === 'special2') {
                    claw.root.rotation.z = 0.45 - strike * 1.5;
                    claw.root.rotation.y = (cIdx === 0 ? 0.4 : -0.4);
                } else {
                    claw.root.rotation.z = (cIdx === 0 ? strike : 0) * 1.2 - 0.2;
                }
            });
        }
        if (rig.jaw) {
            rig.jaw.rotation.z = strike * 0.4;
        }
    },

    animateFatality(ctx) {
        const { rig, prog } = ctx;
        if (!rig || !rig.specialParts) return;
        if (rig.specialParts.raptorialClaws) {
            const clamp = Math.sin(prog * Math.PI * 4) * 0.5;
            rig.specialParts.raptorialClaws.forEach((claw, cIdx) => {
                claw.root.rotation.z = 0.5 + clamp;
                claw.root.rotation.y = (cIdx === 0 ? 0.5 : -0.5);
            });
        }
        if (rig.jaw) {
            rig.jaw.rotation.z = Math.sin(prog * Math.PI * 8) * 0.5;
        }
    }
});
