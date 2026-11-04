/* ============================================================================
 * ANIMATIONS APATOSAURE : FATALITÉ 3D (ÉCRASEMENT TITANESQUE)
 * ============================================================================ */

registerFighterAnimation('apato', {
    animateFatality(ctx) {
        const { rig, prog, baseHipsY } = ctx;
        if (prog < 0.58) {
            const p = prog / 0.58;
            rig.hips.rotation.z = p * 0.95;
            rig.hips.position.y = baseHipsY + p * 1.4;
            rig.legs[0].rotation.z = 0.8;
            rig.legs[1].rotation.z = 0.8;
        } else {
            rig.hips.rotation.z = -0.18;
            rig.hips.position.y = baseHipsY * 0.85;
        }
    },

    executeFatality(winner, loser) {
        setTimeout(() => {
            if (matchState !== 'fatality_anim') return;
            sfx.playRoar(50, 0.9);
            spawnFloatingPopup(winner.x, 'TITAN EN HAUTEUR !', '#2dd4bf');
        }, 900);
        setTimeout(() => {
            if (matchState !== 'fatality_anim') return;
            sfx.playBoneCrack();
            loser.flattened = true;
            loser.isDead = true;
            loser.hp = 0;
            spawn3DBloodAndBones(loser.x, 0.6, 80, true);
            screenShake = 1.2;
            showAnnouncer('FATALITY !', 'ÉCRASEMENT TITANESQUE');
        }, 2050);
    }
});
