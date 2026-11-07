/* ============================================================================
 * COMBATTANT : ANOMALOCARIS (Anomalocaris Canadensis Titan)
 * Boss déblocable de l'Ère du Cambrien & Personnage Jouable Complet :
 * - Carapace céphalique hydrodynamique (Céphalon)
 * - Yeux composés à facettes portés sur pédoncules articulés
 * - Appendices rapaces frontaux segmentés aux épines ventrales acérées (Endites)
 * - Cône buccal circulaire de Peytoia aux 16 dents chitineuses articulées
 * - Tronc métamérisé à 8 segments et crêtes dorsales luminescentes
 * - 9 paires de lobes natatoires latéraux ondulants (18 flaps articulés)
 * - Éventail caudal tri-lobé (Furca caudale) à battement fluide
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
    cGrad.addColorStop(0.35, '#0e7490');
    cGrad.addColorStop(0.70, '#083344');
    cGrad.addColorStop(1.00, '#22d3ee');
    cCtx.fillStyle = cGrad;
    cCtx.fillRect(0, 0, size, size);

    bCtx.fillStyle = '#808080';
    bCtx.fillRect(0, 0, size, size);

    let seed = 91823;
    const rand = () => { seed = (seed * 16807 + 11) % 2147483647; return (seed & 0x7fffffff) / 2147483647; };

    for (let i = 0; i < 70; i++) {
        const x = rand() * size;
        const y = rand() * size;
        const r = 8 + rand() * 22;
        cCtx.beginPath();
        bCtx.beginPath();
        cCtx.arc(x, y, r, 0, Math.PI * 2);
        bCtx.arc(x, y, r, 0, Math.PI * 2);
        cCtx.fillStyle = rand() > 0.6 ? 'rgba(34, 211, 238, 0.4)' : 'rgba(8, 51, 68, 0.6)';
        cCtx.fill();
        cCtx.strokeStyle = '#22d3ee';
        cCtx.lineWidth = 1.4;
        cCtx.stroke();

        bCtx.fillStyle = '#b0b0b0';
        bCtx.fill();
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
    moveStyle: 'Nage ondoyante à 9 paires de lobes natatoires, carénage dorsal cyan bioluminescent et griffes raptoriales.',
    fatalityDesc: 'Enserre le rival de ses appendices épineux, le broie dans son cône buccal circulaire aux 16 dents de chitine, et projette ses os dans un vortex abyssal.',
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
            spawn3DProjectile(attacker, 'hydro');
        }
    },

    onSpecial2(attacker, defender, dist, basePow) {
        attacker.vx = attacker.facing * 12.5;
        if (typeof sfx !== 'undefined' && sfx.playBoneCrack) sfx.playBoneCrack();
        if (dist < 2.8) {
            applyDamage(attacker, defender, Math.round(basePow * 1.55), false, '💥 BROYEUR RAPTORIAL !');
        }
    },

    buildRig(ctx) {
        const { hips, rig, addMesh, skin, skinMeshes } = ctx;
        const pbr = getAnomalocarisPBRMaps();

        const primaryCol = skin.primary || 0x0e7490;
        const secCol = skin.secondary || 0x083344;
        const accCol = skin.accent || 0x22d3ee;

        const chitinMat = new THREE.MeshStandardMaterial({
            color: primaryCol,
            map: pbr.chitinTex,
            bumpMap: pbr.bumpTex,
            bumpScale: 0.08,
            roughness: 0.35,
            metalness: 0.4
        });
        const dorsalCarapaceMat = new THREE.MeshStandardMaterial({
            color: secCol,
            roughness: 0.3,
            metalness: 0.5
        });
        const ventralMat = new THREE.MeshStandardMaterial({
            color: 0x155e75,
            roughness: 0.5,
            metalness: 0.2
        });
        const glowCyanMat = new THREE.MeshStandardMaterial({
            color: accCol,
            emissive: accCol,
            emissiveIntensity: 0.85,
            roughness: 0.2
        });
        const amberSpineMat = new THREE.MeshStandardMaterial({
            color: 0xf59e0b,
            emissive: 0xd97706,
            emissiveIntensity: 0.4,
            roughness: 0.2
        });
        const darkMouthMat = new THREE.MeshStandardMaterial({
            color: 0x030712,
            roughness: 0.85
        });
        const compoundEyeMat = new THREE.MeshBasicMaterial({
            color: 0xa5f3fc
        });

        hips.position.y = 1.25;

        // 1. CARAPACE CÉPHALIQUE HYDRODYNAMIQUE (CÉPHALON)
        const headCarapaceGeo = new THREE.ConeGeometry(0.85, 1.7, 8);
        headCarapaceGeo.rotateZ(-Math.PI / 2);
        headCarapaceGeo.scale(1.2, 0.55, 1.05);
        const headCarapace = addMesh(headCarapaceGeo, dorsalCarapaceMat, rig.headGroup, 0.5, 0.35, 0);
        rig.torso.add(rig.headGroup);

        // Yeux composés sur pédoncules articulés
        const eyeStalks = [];
        [-0.52, 0.52].forEach((zSign) => {
            const stalk = new THREE.Group();
            stalk.position.set(0.7, 0.55, zSign);

            const stalkGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.48, 6);
            stalkGeo.rotateX(zSign > 0 ? -0.4 : 0.4);
            const stalkMesh = addMesh(stalkGeo, chitinMat, stalk);

            const eyeBulbGeo = new THREE.SphereGeometry(0.24, 10, 10);
            eyeBulbGeo.scale(1.2, 1.0, 1.0);
            const eyeBulb = addMesh(eyeBulbGeo, compoundEyeMat, stalk, 0.1, 0.26, zSign * 0.16);

            const ringGeo = new THREE.TorusGeometry(0.23, 0.04, 6, 12);
            const ring = addMesh(ringGeo, glowCyanMat, stalk, eyeBulb.position.x, eyeBulb.position.y, eyeBulb.position.z, 0, Math.PI / 2, 0);

            rig.headGroup.add(stalk);
            eyeStalks.push(stalk);
        });

        // 2. APPENDICES RAPACES FRONTALES (RAPTORIAL CLAWS)
        const raptorialClaws = [];
        [-0.26, 0.26].forEach((zSign, clawIdx) => {
            const clawRoot = new THREE.Group();
            clawRoot.position.set(1.25, 0.15, zSign);

            let parentNode = clawRoot;
            const segmentMeshes = [];
            for (let s = 0; s < 4; s++) {
                const seg = new THREE.Group();
                seg.position.set(s === 0 ? 0 : 0.32, s === 0 ? 0 : -0.15, 0);
                seg.rotation.z = -0.32;

                const segGeo = new THREE.BoxGeometry(0.36, 0.20, 0.15);
                const segMesh = addMesh(segGeo, chitinMat, seg, 0.16, 0, 0);

                // Épines ventrales acérées (Endites)
                const spineGeo = new THREE.ConeGeometry(0.055, 0.32 + (s * 0.07), 4);
                spineGeo.rotateZ(Math.PI);
                const spine = addMesh(spineGeo, amberSpineMat, seg, 0.16, -0.22, 0);

                parentNode.add(seg);
                parentNode = seg;
                segmentMeshes.push(seg);
            }

            rig.headGroup.add(clawRoot);
            rig.arms.push(clawRoot);
            raptorialClaws.push({ root: clawRoot, segments: segmentMeshes });
        });

        // 3. CÔNE ORAL CIRCULAIRE DE PEYTOIA
        const mouthGroup = new THREE.Group();
        mouthGroup.position.set(0.65, -0.05, 0);
        mouthGroup.rotation.x = Math.PI / 2;

        const oralConeOuter = addMesh(new THREE.TorusGeometry(0.34, 0.11, 8, 20), ventralMat, mouthGroup);
        const oralCavity = addMesh(new THREE.CylinderGeometry(0.26, 0.26, 0.16, 14), darkMouthMat, mouthGroup);

        for (let t = 0; t < 16; t++) {
            const angle = (t / 16) * Math.PI * 2;
            const tooth = addMesh(new THREE.ConeGeometry(0.045, 0.16, 4), amberSpineMat, mouthGroup,
                Math.cos(angle) * 0.24, 0.05, Math.sin(angle) * 0.24, 0, angle, Math.PI);
        }
        rig.headGroup.add(mouthGroup);
        rig.jaw = mouthGroup;

        // 4. TRONC MÉTAMÉRISÉ HYDRODYNAMIQUE (8 SEGMENTS)
        const bodySegments = [];
        const trunkCount = 8;
        for (let i = 0; i < trunkCount; i++) {
            const segGroup = new THREE.Group();
            const factor = 1.0 - (i / trunkCount) * 0.55;
            const segX = -i * 0.55;

            const segGeo = new THREE.BoxGeometry(0.58, 0.45 * factor, 1.10 * factor);
            const segMesh = addMesh(segGeo, i % 2 === 0 ? chitinMat : dorsalCarapaceMat, segGroup);
            segGroup.position.set(segX, 0.25, 0);

            // Crête dorsale luminescente
            const crestGeo = new THREE.ConeGeometry(0.08 * factor, 0.32 * factor, 4);
            crestGeo.rotateZ(Math.PI / 2);
            const crest = addMesh(crestGeo, glowCyanMat, segGroup, 0, 0.28 * factor, 0);

            rig.torso.add(segGroup);
            rig.tailSegments.push(segGroup);
            bodySegments.push(segGroup);
        }

        // 5. 9 PAIRES DE LOBES NATATOIRES LATÉRAUX (SWIMMING FLAPS)
        const swimmingFlaps = [];
        const flapCount = 9;
        for (let i = 0; i < flapCount; i++) {
            const factor = (i < 3) ? (0.65 + i * 0.22) : (1.3 - (i - 3) * 0.15);
            const flapX = 0.3 - i * 0.52;

            // Lobe gauche
            const flapLGroup = new THREE.Group();
            flapLGroup.position.set(flapX, 0.18, 0.52 * factor);
            const flapLGeo = new THREE.BoxGeometry(0.48, 0.05, 0.72 * factor);
            const flapL = addMesh(flapLGeo, glowCyanMat, flapLGroup, 0, 0, 0.36 * factor);
            rig.torso.add(flapLGroup);

            // Lobe droit
            const flapRGroup = new THREE.Group();
            flapRGroup.position.set(flapX, 0.18, -0.52 * factor);
            const flapRGeo = new THREE.BoxGeometry(0.48, 0.05, 0.72 * factor);
            const flapR = addMesh(flapRGeo, glowCyanMat, flapRGroup, 0, 0, -0.36 * factor);
            rig.torso.add(flapRGroup);

            swimmingFlaps.push({ left: flapLGroup, right: flapRGroup, factor, index: i });
        }

        // 6. ÉVENTAIL CAUDAL TRI-LOBÉ (FURCA CAUDALE)
        const tailFanGroup = new THREE.Group();
        tailFanGroup.position.set(-4.2, 0.25, 0);
        for (let f = 0; f < 3; f++) {
            const angle = (f - 1) * 0.45;
            const bladeGeo = new THREE.BoxGeometry(1.1, 0.05, 0.32);
            const blade = addMesh(bladeGeo, glowCyanMat, tailFanGroup,
                -0.5, 0.15 + Math.abs(f - 1) * 0.12, (f - 1) * 0.5, 0, angle, 0);
        }
        rig.torso.add(tailFanGroup);

        rig.specialParts.swimmingFlaps = swimmingFlaps;
        rig.specialParts.tailFan = tailFanGroup;
        rig.specialParts.eyeStalks = eyeStalks;
        rig.specialParts.raptorialClaws = raptorialClaws;
        rig.specialParts.mouthGroup = mouthGroup;

        hips.add(rig.torso);
    },

    animateIdle(ctx) {
        const { rig, baseHipsY, time } = ctx;
        const flaps = rig.specialParts.swimmingFlaps;
        if (flaps) {
            flaps.forEach(fl => {
                const wave = Math.sin(time * 6.5 + fl.index * 0.45) * 0.28;
                fl.left.rotation.x = wave * 0.3;
                fl.left.rotation.z = 0.12 + wave;
                fl.right.rotation.x = -wave * 0.3;
                fl.right.rotation.z = -0.12 - wave;
            });
        }
        if (rig.specialParts.tailFan) {
            rig.specialParts.tailFan.rotation.y = Math.sin(time * 3.8) * 0.16;
            rig.specialParts.tailFan.rotation.z = Math.cos(time * 2.8) * 0.07;
        }
        if (rig.specialParts.raptorialClaws) {
            rig.specialParts.raptorialClaws.forEach((c, idx) => {
                c.root.rotation.z = -0.15 + Math.sin(time * 3.2 + idx) * 0.10;
            });
        }
        rig.hips.position.y = baseHipsY + Math.sin(time * 2.8) * 0.15;
    },

    animateWalk(ctx) {
        const { rig, baseHipsY, time } = ctx;
        const flaps = rig.specialParts.swimmingFlaps;
        if (flaps) {
            flaps.forEach(fl => {
                const wave = Math.sin(time * 12.0 + fl.index * 0.6) * 0.45;
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
        rig.hips.position.y = baseHipsY + Math.sin(time * 5.0) * 0.12;
        rig.torso.rotation.z = -0.12;
    },

    animateJump(ctx) {
        const { fighter, rig, baseHipsY } = ctx;
        const isRising = fighter.vy > 0;
        rig.hips.position.y = baseHipsY + 0.3;
        rig.torso.rotation.z = isRising ? 0.35 : -0.25;
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
        const { rig, act, prog, strike } = ctx;
        if (rig.specialParts.raptorialClaws) {
            rig.specialParts.raptorialClaws.forEach((claw, cIdx) => {
                if (act === 'heavy' || act === 'fwd_heavy') {
                    // Double pincer slam
                    claw.root.rotation.z = -0.3 + strike * 1.6;
                    claw.root.rotation.y = (cIdx === 0 ? 1 : -1) * (0.45 - strike * 0.7);
                } else if (act === 'special' || act === 'special2') {
                    // Broyeur raptorial / impale
                    claw.root.rotation.z = 0.45 - strike * 1.5;
                    claw.root.rotation.y = (cIdx === 0 ? 0.4 : -0.4);
                } else {
                    // Light claw snap
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
