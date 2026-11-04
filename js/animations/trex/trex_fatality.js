/* ============================================================================
 * ANIMATIONS T-REX : FATALITÉ 3D (DÉVORATION ROYALE)
 * ============================================================================ */

registerFighterAnimation('trex', {
    animateFatality(ctx) {
        const { rig, prog } = ctx;
        if (prog < 0.3) {
            rig.torso.rotation.z = -0.35;
            rig.neck.rotation.z = -0.4;
            rig.jaw.rotation.z = -0.7;
        } else if (prog < 0.72) {
            rig.torso.rotation.z = 0.25;
            rig.headGroup.rotation.y = Math.sin(prog * 45) * 0.55;
            rig.headGroup.rotation.z = Math.cos(prog * 35) * 0.35;
            rig.jaw.rotation.z = -0.25;
        } else {
            rig.torso.rotation.z = 0.35;
            rig.headGroup.rotation.z = 0.65;
            rig.jaw.rotation.z = Math.sin(prog * 30) * 0.35 - 0.35;
        }
    },

    executeFatality(winner, loser) {
        setTimeout(() => {
            if (matchState !== 'fatality_anim') return;
            sfx.playBoneCrack();
            spawn3DBloodAndBones(loser.x, 2.5, 35, true);
            spawnFloatingPopup(loser.x, 'MÂCHOIRE ROYALE !', '#ef4444');
        }, 950);
        setTimeout(() => {
            if (matchState !== 'fatality_anim') return;
            sfx.playBoneCrack();
            sfx.playRoar(52, 0.9);
            loser.decapitated = true;
            loser.isDead = true;
            loser.hp = 0;
            spawn3DBloodAndBones(loser.x, 2.8, 65, true);
            screenShake = 0.9;
            showAnnouncer('FATALITY !', 'T-REX DÉVORE SA PROIE');
        }, 2200);
    }
});
