// ============================================================================
// js/animations/megatherium/megatherium_fatality.js — Megatherium Fatality Animations
// ============================================================================

registerFighterAnimation('giantsloth', {
    animateFatality(ctx) {
        const { rig, prog } = ctx;
        rig.arms[0].rotation.y = 1.25;
        rig.arms[1].rotation.y = -1.25;
        rig.torso.rotation.z = Math.sin(prog * Math.PI * 4) * 0.35;
    },

    executeFatality(winner, loser) {
        setTimeout(() => {
            if (matchState !== 'fatality_anim') return;
            sfx.playBoneCrack();
            spawn3DBloodAndBones(loser.x, 2.2, 45, true);
            spawnFloatingPopup(loser.x, 'ÉTREINTE BÉHÉMOTH !', '#ca8a04');
        }, 950);
        setTimeout(() => {
            if (matchState !== 'fatality_anim') return;
            sfx.playBoneCrack();
            sfx.playRoar(50, 0.9);
            loser.flattened = true;
            loser.isDead = true;
            loser.hp = 0;
            spawn3DBloodAndBones(loser.x, 0.8, 85, true);
            screenShake = 1.0;
            showAnnouncer('FATALITY !', 'ÉTREINTE ANNIHILATRICE DU MÉGATHÉRIUM');
        }, 2200);
    }
});
