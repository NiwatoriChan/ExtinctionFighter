// ============================================================================
// js/animations/smilodon/smilodon_fatality.js — Smilodon Fatality Animations
// ============================================================================

registerFighterAnimation('smilodon', {
    animateFatality(ctx) {
        const { rig, prog, baseHipsY } = ctx;
        if (prog < 0.30) {
            rig.hips.position.y = baseHipsY + 0.9;
            rig.torso.rotation.z = 0.45;
            rig.jaw.rotation.z = -0.6;
        } else if (prog < 0.70) {
            rig.hips.position.y = baseHipsY * 0.65;
            rig.headGroup.rotation.z = -0.75;
            rig.jaw.rotation.z = -1.45;
        } else {
            rig.hips.position.y = baseHipsY * 0.55;
            rig.headGroup.rotation.z = 0.85;
            rig.jaw.rotation.z = -0.25;
        }
    },

    executeFatality(winner, loser) {
        setTimeout(() => {
            if (matchState !== 'fatality_anim') return;
            sfx.playRoar(75, 0.9);
            sfx.playHit(true);
            spawnFloatingPopup(loser.x, '🐯 PLACAGE SAUVAGE !', '#f59e0b');
            spawn3DBloodAndBones(loser.x, 1.6, 25, true);
        }, 800);

        setTimeout(() => {
            if (matchState !== 'fatality_anim') return;
            sfx.playBoneCrack();
            sfx.playHit(true);
            spawnFloatingPopup(loser.x, '🩸 CANINES SABRES ENFONCÉES !', '#ef4444');
            spawn3DBloodAndBones(loser.x, 1.2, 55, true);
            screenShake = 0.85;
        }, 1600);

        setTimeout(() => {
            if (matchState !== 'fatality_anim') return;
            sfx.playBoneCrack();
            sfx.playRoar(60, 1.0);
            loser.decapitated = true;
            loser.isDead = true;
            loser.hp = 0;
            spawn3DBloodAndBones(loser.x, 1.0, 90, true);
            screenShake = 1.2;
            showAnnouncer('FATALITY !', 'ÉGORGEMENT FATAL DU SMILODON');
        }, 2400);
    }
});
