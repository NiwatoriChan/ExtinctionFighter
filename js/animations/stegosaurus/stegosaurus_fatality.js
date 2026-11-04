// ============================================================================
// js/animations/stegosaurus/stegosaurus_fatality.js — Stegosaurus Fatality Animations
// ============================================================================

registerFighterAnimation('stegosaurus', {
    animateFatality(ctx) {
        const { rig, prog } = ctx;
        rig.hips.rotation.y = -Math.min(1, prog * 1.8) * Math.PI;
        rig.tailSegments.forEach(seg => { seg.rotation.y = -Math.sin(prog * Math.PI * 2) * 0.65; });
    },

    executeFatality(winner, loser) {
        setTimeout(() => {
            if (matchState !== 'fatality_anim') return;
            sfx.playBoneCrack();
            sfx.playHit(true);
            spawn3DBloodAndBones(loser.x, 2.0, 45, true);
            spawnFloatingPopup(loser.x, 'THAGOMISEUR !', '#f59e0b');
        }, 950);
        setTimeout(() => {
            if (matchState !== 'fatality_anim') return;
            sfx.playBoneCrack();
            sfx.playRoar(55, 0.9);
            loser.flattened = true;
            loser.isDead = true;
            loser.hp = 0;
            spawn3DBloodAndBones(loser.x, 1.2, 70, true);
            screenShake = 0.9;
            showAnnouncer('FATALITY !', 'TRANSFIXION DU STÉGOSAURE');
        }, 2200);
    }
});
