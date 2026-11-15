/* ============================================================================
 * ANIMATIONS PACHYRHINOSAURE : FATALITÉ 3D (IMPACT CRÂNIEN POLAIRE)
 * Acte 1 : Grattage furieux du sol au sabot antérieur & présentation des ocelles
 * Acte 2 : Charge polaire supersonique bosse nasale verrouillée en bélier
 * Acte 3 : Pulvérisation ascendante et rugissement de triomphe cabré
 * ============================================================================ */

registerFighterAnimation('pachyrhino', {
    animateFatality(ctx) {
        const { fighter, rig, prog, baseHipsY, time } = ctx;
        const sp = rig.specialParts;

        const by = baseHipsY || 1.65;
        rig.hips.position.y = by;
        if (prog < 0.35) {
            const p = prog / 0.35;
            const paw = Math.sin(prog * 46);
            rig.hips.position.x = -1.2 * p;
            rig.hips.position.y = by - 0.18;
            rig.torso.rotation.z = -0.22;
            rig.headGroup.rotation.z = -0.44;
            rig.jaw.rotation.z = -0.28 - Math.abs(paw) * 0.22;
            if (rig.legs[1]) rig.legs[1].rotation.z = paw * 0.58;
        } else if (prog < 0.65) {
            const p = (prog - 0.35) / 0.30;
            const g = Math.sin(prog * 40);
            rig.hips.position.x = -1.2 + p * 3.0;
            rig.hips.position.y = by - 0.14;
            rig.torso.rotation.z = -0.26;
            rig.headGroup.rotation.z = -0.48;
            rig.jaw.rotation.z = -0.38;
            if (rig.legs.length >= 4) {
                rig.legs[0].rotation.z = g * 0.65;
                rig.legs[3].rotation.z = g * 0.65;
                rig.legs[1].rotation.z = -g * 0.65;
                rig.legs[2].rotation.z = -g * 0.65;
            }
        } else {
            const p = (prog - 0.65) / 0.35;
            const rearLift = Math.sin(Math.min(1, p * 1.4) * Math.PI * 0.5);
            rig.hips.position.x = 1.8;
            rig.hips.position.y = by + rearLift * 0.22;
            rig.torso.rotation.z = 0.36 * rearLift;
            rig.headGroup.rotation.z = 0.68 * rearLift;
            rig.headGroup.rotation.y = Math.sin(prog * 22) * 0.14;
            rig.jaw.rotation.z = -0.68;
            if (rig.legs.length >= 2) {
                rig.legs[0].rotation.z = 0.48 * rearLift;
                rig.legs[1].rotation.z = 0.40 * rearLift;
            }
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
