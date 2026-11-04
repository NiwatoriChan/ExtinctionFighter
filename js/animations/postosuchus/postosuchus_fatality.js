// ============================================================================
// js/animations/postosuchus/postosuchus_fatality.js — Postosuchus Fatality Animations
// ============================================================================

registerFighterAnimation('postosuchus', {
    animateFatality(ctx) {
        const { rig, prog, baseHipsY } = ctx;
        if (prog < 0.25) {
            rig.hips.rotation.z = 0.35;
            rig.jaw.rotation.z = -0.8;
        } else {
            rig.hips.position.y = baseHipsY + 0.55;
            rig.torso.rotation.x = (prog - 0.25) * Math.PI * 14;
            rig.jaw.rotation.z = -0.25;
        }
    },

    executeFatality(winner, loser) {
        setTimeout(() => {
            if (matchState !== 'fatality_anim') return;
            sfx.playBoneCrack();
            spawnFloatingPopup(loser.x, 'MÂCHOIRE VERROUILLÉE !', '#fef08a');
            spawn3DBloodAndBones(loser.x, 2.0, 30, true);
        }, 850);
        const rollInterval = setInterval(() => {
            if (matchState !== 'fatality_anim') { clearInterval(rollInterval); return; }
            sfx.playHit(true);
            loser.rig.hips.rotation.x += 1.4;
            spawn3DBloodAndBones(loser.x, 2.1, 20, true);
        }, 320);
        setTimeout(() => {
            clearInterval(rollInterval);
            if (matchState !== 'fatality_anim') return;
            sfx.playBoneCrack();
            sfx.playRoar(58, 0.85);
            loser.decapitated = true;
            loser.isDead = true;
            loser.hp = 0;
            spawn3DBloodAndBones(loser.x, 2.2, 80, true);
            screenShake = 1.0;
            showAnnouncer('FATALITY !', 'TONNEAU DE LA MORT DU POSTOSUCHUS');
        }, 2200);
    }
});
