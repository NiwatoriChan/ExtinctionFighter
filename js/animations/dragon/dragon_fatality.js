// ============================================================================
// js/animations/dragon/dragon_fatality.js — Dragon Fatality Animations
// ============================================================================

registerFighterAnimation('dragon', {
    animateFatality(ctx) {
        const { rig, prog } = ctx;
        if (prog < 0.35) {
            rig.hips.position.y = 2.8;
            rig.torso.rotation.z = 0.3;
            if (rig.specialParts.leftWing) rig.specialParts.leftWing.rotation.x = -1.1;
            if (rig.specialParts.rightWing) rig.specialParts.rightWing.rotation.x = 1.1;
        } else if (prog < 0.75) {
            rig.hips.position.y = 1.8;
            rig.headGroup.rotation.z = -0.55;
            rig.jaw.rotation.z = -0.9;
        } else {
            rig.hips.position.y = 2.1;
            rig.headGroup.rotation.z = 0.6;
            rig.jaw.rotation.z = -0.75;
        }
    },

    executeFatality(winner, loser) {
        setTimeout(() => {
            if (matchState !== 'fatality_anim') return;
            sfx.playRoar(45, 1.1);
            spawnFloatingPopup(loser.x, 'SOUFFLE INFERNAL !', '#f97316');
            spawn3DBloodAndBones(loser.x, 2.2, 45, true);
        }, 900);

        setTimeout(() => {
            if (matchState !== 'fatality_anim') return;
            sfx.playBoneCrack();
            sfx.playHit(true);
            loser.flattened = true;
            loser.isDead = true;
            loser.hp = 0;
            spawn3DBloodAndBones(loser.x, 0.8, 85, true);
            screenShake = 1.2;
            showAnnouncer('FATALITY !', 'DRAK\'ZUL RÉDUIT SA PROIE EN CENDRES');
        }, 2200);
    }
});
