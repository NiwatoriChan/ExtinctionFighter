// 5. SYSTÈME D'ANIMATION 3D DISTINCT PAR ESPÈCE (MOUVEMENTS, ATTAQUES, X-RAY & FATALITÉS)
function animateDino3DRig(fighter, time, dt) {
    const rig = fighter.rig;
    if (!rig) return;
    const id = fighter.dino.id;
    const act = fighter.action;
    const prog = fighter.actionDuration > 0 ? Math.min(1, fighter.actionTimer / fighter.actionDuration) : 0;
    const swing = Math.sin(prog * Math.PI);

    // Réinitialisation douce des rotations de base
    rig.hips.rotation.set(0, 0, 0);
    rig.torso.rotation.set(0, 0, 0);
    rig.neck.rotation.set(0, 0, 0);
    rig.headGroup.rotation.set(0, 0, 0);
    rig.jaw.rotation.set(0, 0, 0);
    rig.shieldMesh.visible = fighter.isBlocking;

    const fighterImpl = FIGHTER_IMPLS[id] || {};
    const baseHipsY = fighterImpl.animBaseHipsY !== undefined ? fighterImpl.animBaseHipsY : 2.1;
    rig.hips.position.set(0, baseHipsY, 0);

    // Flash blanc si touché
    rig.bodyMat.emissive.setHex(fighter.hitStun > 0.12 ? 0xffffff : 0x000000);
    rig.bodyMat.emissiveIntensity = fighter.hitStun > 0.12 ? 0.65 : 0;

    // --- ANIMATION DE L'ATTAQUANT PENDANT LE X-RAY (VERROUILLÉ EN 3 PHASES) ---
    if (fighter.isXrayAttacker && xrayCinematicTimer > 0) {
        const phasePulse = Math.sin(time * 24);
        if (xrayStage === 1) {
            // Phase 1 : Frappe descendante brise-crâne
            rig.hips.position.x = 0.55;
            rig.torso.rotation.z = -0.32 + phasePulse * 0.12;
            rig.headGroup.rotation.z = -0.35;
            rig.jaw.rotation.z = -0.75;
        } else if (xrayStage === 2) {
            // Phase 2 : Impact thoracique lourd
            rig.hips.position.x = 0.78;
            rig.torso.rotation.y = phasePulse * 0.45;
            rig.torso.rotation.z = 0.22;
        } else {
            // Phase 3 : Cisaillement final de la colonne vertébrale
            rig.hips.position.x = 0.92;
            rig.hips.position.y = baseHipsY + 0.35;
            rig.torso.rotation.z = 0.45;
            rig.headGroup.rotation.z = 0.55;
            rig.jaw.rotation.z = -0.85;
        }
        return;
    }

    // --- ANIMATION ANATOMIQUE DU SQUELETTE X-RAY 2.0 EN 3 PHASES (CIBLE VERROUILLÉE) ---
    if (fighter.isXrayTarget) {
        rig.skeletonGroup.visible = true;
        rig.skinMeshes.forEach(m => {
            m.material.transparent = true;
            m.material.opacity = 0.14;
        });

        const xp = rig.xrayParts;
        if (xp) {
            // Battement cardiaque accéléré
            xp.heart.scale.setScalar(1 + Math.sin(time * 28) * 0.28);
            xp.skullMat.color.setHex(xrayStage === 1 ? 0xef4444 : 0xf0f9ff);
            xp.ribMat.color.setHex(xrayStage === 2 ? 0xef4444 : 0xe0f2fe);
            xp.spineMat.color.setHex(xrayStage === 3 ? 0xef4444 : 0xe0f2fe);

            if (xrayStage === 1) {
                // Phase 1 : Dislocation de la mâchoire et vibration crânienne
                xp.skullGroup.rotation.z = Math.sin(time * 55) * 0.28;
                xp.jawBone.rotation.z = -0.45 + Math.sin(time * 40) * 0.2;
                rig.headGroup.rotation.z = 0.45;
            } else if (xrayStage === 2) {
                // Phase 2 : Enfoncement de la cage thoracique
                xp.ribCageGroup.scale.set(0.82 + Math.sin(time * 50) * 0.15, 0.85, 1.2);
                rig.torso.rotation.z = -0.25;
            } else if (xrayStage === 3) {
                // Phase 3 : Cisaillement de la colonne vertébrale
                xp.spineGroup.rotation.z = Math.sin(time * 60) * 0.35;
                rig.hips.position.y = baseHipsY + 0.55;
                rig.hips.rotation.z = 0.38;
            }
        }
        return;
    } else {
        rig.skeletonGroup.visible = false;
        if (rig.xrayParts) {
            rig.xrayParts.ribCageGroup.scale.set(1, 1, 1);
            rig.xrayParts.skullGroup.rotation.set(0, 0, 0);
            rig.xrayParts.spineGroup.rotation.set(0, 0, 0);
        }
        rig.skinMeshes.forEach(m => {
            m.material.transparent = false;
            m.material.opacity = 1.0;
        });
    }

    // État mort / aplati / décapité
    rig.headGroup.visible = !fighter.decapitated;
    if (fighter.flattened) {
        rig.root.scale.set(fighter.dino.scale * 1.65, 0.12, fighter.dino.scale * 1.65);
        return;
    } else {
        rig.root.scale.setScalar(fighter.dino.scale);
    }

    if (fighter.isDead) {
        rig.hips.position.y = 0.65;
        rig.hips.rotation.z = Math.PI / 2.1;
        return;
    }

    // État étourdi ("ACHEVEZ-LE !")
    if (fighter.isDizzy) {
        rig.hips.rotation.z = Math.sin(time * 7) * 0.18;
        rig.hips.rotation.x = Math.cos(time * 5) * 0.12;
        rig.headGroup.rotation.z = -0.3 + Math.sin(time * 9) * 0.2;
        rig.jaw.rotation.z = -0.35;
        if (fighter.kneeling) rig.hips.position.y = baseHipsY * 0.55;
        return;
    }

    // Contexte transmis aux animations propres à chaque combattant (js/fighters/*.js)
    const animCtx = { fighter, rig, id, act, prog, swing, baseHipsY, time, dt };

    // --- 1. ANIMATIONS D'ATTENTE (IDLE) & DE MARCHE SPÉCIFIQUES À CHAQUE ESPÈCE ---
    if (act === 'idle' || act === 'walk' || act === 'crouch') {
        const isWalk = act === 'walk';
        animCtx.isWalk = isWalk;
        if (fighterImpl.animateIdle) fighterImpl.animateIdle(animCtx);

        if (act === 'crouch') {
            rig.hips.position.y = baseHipsY * 0.72;
            rig.torso.rotation.z = -0.18;
        }
        return;
    }

    // --- 2. ANIMATIONS D'ATTAQUES DISTINCTES PAR ESPÈCE ---
    if (act === 'light' || act === 'heavy' || act === 'special' || act === 'special2' || act === 'xray') {
        if (fighterImpl.animateAttack) fighterImpl.animateAttack(animCtx);
        return;
    }

    // --- 3. CHORÉGRAPHIES DE FATALITÉS 3D UNIQUES PAR ESPÈCE (9 ESPÈCES) ---
    if (act === 'fatality') {
        if (fighterImpl.animateFatality) fighterImpl.animateFatality(animCtx);
    }
}
