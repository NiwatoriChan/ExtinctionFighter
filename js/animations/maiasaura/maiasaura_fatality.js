/* ============================================================================
 * ANIMATIONS MAIASAURA : FATALITÉ 3D (FRÉNÉSIE DU NID)
 * ============================================================================ */

registerFighterAnimation('maiasaura', {
    animateFatality(ctx) {
        const { rig, prog } = ctx;
        rig.torso.rotation.z = -0.22;
        rig.neck.rotation.z = -0.3 + Math.sin(prog * 60) * 0.08;
        if (rig.specialParts.sonicCrest) {
            rig.specialParts.sonicCrest.scale.setScalar(1 + Math.sin(prog * 50) * 0.4);
        }
    },

    executeFatality(winner, loser) {
        const sonicInterval = setInterval(() => {
            if (matchState !== 'fatality_anim') { clearInterval(sonicInterval); return; }
            spawn3DProjectile(winner, 'sonic');
            loser.rig.headGroup.scale.multiplyScalar(1.22);
        }, 320);

        setTimeout(() => {
            clearInterval(sonicInterval);
            if (matchState !== 'fatality_anim') return;
            sfx.playBoneCrack();
            loser.decapitated = true;
            loser.isDead = true;
            loser.hp = 0;
            spawn3DBloodAndBones(loser.x, 2.8, 75, true);
            screenShake = 0.9;
            showAnnouncer('FATALITY !', 'EXPLOSION ULTRASONIQUE');
        }, 2150);
    }
});
