/* ============================================================================
 * ANIMATIONS T-REX : FATALITÉ 3D (DÉVORATION ROYALE)
 * Acte 1 : Plongeon maxillaire et saisie broyeuse.
 * Acte 2 : Secousse cervicale frénétique arrachant la tête de la proie.
 * Acte 3 : Engloutissement royal tête rejetée vers le ciel et rugissement final.
 * ============================================================================ */

registerFighterAnimation('trex', {
    animateFatality(ctx) {
        const { fighter, rig, prog, baseHipsY, time } = ctx;
        const sp = rig.specialParts;

        rig.hips.position.y = baseHipsY;
        if (prog < 0.30) {
            const plunge = Math.sin((prog / 0.30) * Math.PI * 0.5);
            rig.hips.position.x = plunge * 0.85;
            rig.torso.rotation.z = -0.36 * plunge;
            rig.neck.rotation.z = -0.15 * plunge;
            rig.headGroup.rotation.z = -0.12 * plunge;
            rig.jaw.rotation.z = prog < 0.21 ? -0.95 * (prog / 0.21) : -0.18;
            if (rig.legs.length >= 2) {
                rig.legs[0].rotation.z = 0.35 * plunge;
                rig.legs[1].rotation.z = -0.30 * plunge;
            }
        } else if (prog < 0.72) {
            const thrash = Math.sin(prog * 46);
            rig.hips.position.x = 0.78;
            rig.torso.rotation.set(thrash * 0.14, thrash * 0.34, 0.12);
            rig.neck.rotation.set(0, thrash * 0.28, 0.10);
            rig.headGroup.rotation.set(thrash * 0.22, thrash * 0.42, 0.08);
            rig.jaw.rotation.z = -0.22 - Math.abs(thrash) * 0.16;
            rig.tailSegments.forEach((seg, i) => {
                if (seg) seg.rotation.y = -thrash * (0.18 + i * 0.04);
            });
        } else {
            const p = (prog - 0.72) / 0.28;
            const gulp = Math.abs(Math.sin(prog * 30));
            rig.hips.position.x = 0.78 * (1 - p * 0.5);
            rig.hips.position.y = baseHipsY + 0.10;
            rig.torso.rotation.z = 0.36;
            rig.neck.rotation.z = 0.24 + gulp * 0.06;
            rig.headGroup.rotation.z = 0.42 + gulp * 0.12;
            rig.jaw.rotation.z = -0.30 - gulp * 0.58;
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
