// ============================================================================
// js/animations/spinosaurus/spinosaurus_fatality.js — Spinosaurus Fatality Animations
// ============================================================================

registerFighterAnimation('spinosaurus', {
    animateFatality(ctx) {
        const { rig, prog } = ctx;
        if (prog < 0.35) {
            rig.torso.rotation.z = -0.3;
            rig.arms[0].rotation.z = 1.1;
            rig.arms[1].rotation.z = 1.1;
        } else if (prog < 0.75) {
            rig.torso.rotation.z = 0.38;
            rig.arms[0].rotation.z = 1.55;
            rig.arms[1].rotation.z = 1.55;
            rig.jaw.rotation.z = -0.7;
        } else {
            rig.arms[0].rotation.y = 0.95;
            rig.arms[1].rotation.y = -0.95;
        }
    },

    executeFatality(winner, loser) {
        setTimeout(() => {
            if (matchState !== 'fatality_anim') return;
            sfx.playBoneCrack();
            loser.vy = 8.5;
            spawnFloatingPopup(loser.x, 'EMPALEMENT ABYSSAL !', '#f97316');
            spawn3DBloodAndBones(loser.x, 2.5, 35, true);
        }, 950);
        setTimeout(() => {
            if (matchState !== 'fatality_anim') return;
            sfx.playBoneCrack();
            sfx.playRoar(54, 0.95);
            loser.decapitated = true;
            loser.isDead = true;
            loser.hp = 0;
            spawn3DBloodAndBones(loser.x, 2.8, 85, true);
            screenShake = 1.1;
            showAnnouncer('FATALITY !', 'ÉVENTRATION DU SPINOSAURE');
        }, 2150);
    }
});
