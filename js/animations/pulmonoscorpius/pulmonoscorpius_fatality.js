// ============================================================================
// js/animations/pulmonoscorpius/pulmonoscorpius_fatality.js — Pulmonoscorpius Fatality Animations
// ============================================================================

registerFighterAnimation('pulmonoscorpius', {
    animateFatality(ctx) {
        const { rig, prog } = ctx;
        rig.arms[0].rotation.y = 0.85;
        rig.arms[1].rotation.y = -0.85;
        rig.tailSegments.forEach(seg => { seg.rotation.z = -Math.sin(prog * Math.PI * 4) * 0.75; });
        if (rig.specialParts.stinger) rig.specialParts.stinger.rotation.z = Math.sin(prog * Math.PI * 4) * 1.2;
    },

    executeFatality(winner, loser) {
        setTimeout(() => {
            if (matchState !== 'fatality_anim') return;
            sfx.playStinger();
            sfx.playBoneCrack();
            spawn3DBloodAndBones(loser.x, 2.2, 40, true);
            spawnFloatingPopup(loser.x, 'DARD ENFOUÉ !', '#22c55e');
        }, 900);
        setTimeout(() => {
            if (matchState !== 'fatality_anim') return;
            sfx.playBoneCrack();
            sfx.playRoar(120, 0.6);
            loser.decapitated = true;
            loser.isDead = true;
            loser.hp = 0;
            spawn3DBloodAndBones(loser.x, 2.6, 75, true);
            screenShake = 0.85;
            showAnnouncer('FATALITY !', 'INJECTION MORTELLE DU PULMONOSCORPIUS');
        }, 2200);
    }
});
