/* ============================================================================
 * ANIMATIONS PACHYRHINOSAURE : MARCHE (WALK), COURSE (SPRINT) & RUÉE (DASH)
 * Allure diagonale quadrupède lourde, galop de charge boréale tête baissée
 * exposant la bosse nasale pachyostotique, et ruée en bouclier blindé.
 * ============================================================================ */

registerFighterAnimation('pachyrhino', {
    animateWalk(ctx) {
        const { fighter, rig, baseHipsY, time, isMovingBackward } = ctx;
        const sp = rig.specialParts;

        const isSprint = Boolean(fighter && (fighter.isSprinting || fighter.sprintDuration > 0.22));
        const dirSign = isMovingBackward ? -1 : 1;
        const speed = isSprint ? 13.0 : (isMovingBackward ? 7.8 : 9.2);
        const amp = isSprint ? 0.55 : (isMovingBackward ? 0.36 : 0.44);
        const c = Math.sin(time * speed * dirSign);

        rig.hips.position.y = baseHipsY + Math.abs(Math.sin(time * speed)) * (isSprint ? 0.12 : 0.07);
        rig.torso.rotation.z = isSprint ? -0.18 : (isMovingBackward ? 0.08 : -0.04);
        rig.headGroup.rotation.z = isSprint ? -0.32 : (isMovingBackward ? 0.18 : Math.sin(time * speed) * 0.04);
        rig.jaw.rotation.z = isSprint ? -0.22 : -0.06;

        if (rig.legs.length >= 4) {
            rig.legs[0].rotation.z = c * amp;
            rig.legs[3].rotation.z = c * amp;
            rig.legs[1].rotation.z = -c * amp;
            rig.legs[2].rotation.z = -c * amp;
        }
        rig.tailSegments.forEach((seg, i) => {
            if (seg) seg.rotation.y = Math.sin(time * speed - i * 0.5) * 0.13;
        });
    },

    animateDash(ctx) {
        const { fighter, rig, lunge, isBackDash, baseHipsY, time } = ctx;
        const sp = rig.specialParts;

        rig.hips.position.y = baseHipsY - (isBackDash ? 0.08 : 0.18 * lunge);
        rig.hips.position.x = isBackDash ? -lunge * 0.42 : lunge * 0.55;
        rig.torso.rotation.z = isBackDash ? 0.18 * lunge : -0.24 * lunge;
        rig.headGroup.rotation.z = isBackDash ? 0.24 * lunge : -0.38 * lunge;
        rig.jaw.rotation.z = -0.28 * lunge;
        const g = Math.sin(time * 24);
        if (rig.legs.length >= 4) {
            rig.legs[0].rotation.z = isBackDash ? 0.36 * lunge : g * 0.58;
            rig.legs[1].rotation.z = isBackDash ? 0.24 * lunge : -g * 0.58;
            rig.legs[2].rotation.z = isBackDash ? -0.32 * lunge : -g * 0.58;
            rig.legs[3].rotation.z = isBackDash ? -0.20 * lunge : g * 0.58;
        }
        rig.tailSegments.forEach((seg, i) => {
            if (seg) seg.rotation.y = Math.sin(time * 20 - i * 0.5) * 0.16;
        });
    }
});
