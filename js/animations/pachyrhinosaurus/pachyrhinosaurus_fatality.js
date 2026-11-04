/* ============================================================================
 * ANIMATIONS PACHYRHINOSAURE : FATALITÉ 3D (IMPACT CRÂNIEN POLAIRE)
 * ============================================================================ */

registerFighterAnimation('pachyrhino', {
    animateFatality(ctx) {
        const { rig, prog } = ctx;
        if (prog < 0.35) {
            rig.hips.position.x = -1.2 * (prog / 0.35);
            rig.headGroup.rotation.z = -0.45;
            rig.legs[0].rotation.z = Math.sin(prog * 45) * 0.65;
        } else if (prog < 0.65) {
            const p = (prog - 0.35) / 0.3;
            rig.hips.position.x = -1.2 + p * 3.0;
            rig.headGroup.rotation.z = -0.5;
        } else {
            rig.hips.position.x = 1.8;
            rig.headGroup.rotation.z = 0.85;
        }
    },

    executeFatality(winner, loser) {
        setTimeout(() => {
            if (matchState !== 'fatality_anim') return;
            sfx.playRoar(85, 0.5);
            spawnFloatingPopup(winner.x, 'CHARGE POLAIRE !', '#38bdf8');
        }, 800);
        setTimeout(() => {
            if (matchState !== 'fatality_anim') return;
            sfx.playBoneCrack();
            loser.vx = winner.facing * 14;
            loser.vy = 9;
            loser.decapitated = true;
            loser.isDead = true;
            loser.hp = 0;
            spawn3DBloodAndBones(loser.x, 2.2, 70, true);
            screenShake = 0.95;
            showAnnouncer('FATALITY !', 'PACHYRHINOSAURE PULVÉRISE L’ENNEMI');
        }, 1850);
    }
});
