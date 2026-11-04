/* ============================================================================
 * ANIMATIONS T-REX : SAUT (JUMPING & AIRBORNE)
 * ============================================================================ */

registerFighterAnimation('trex', {
    animateJump(ctx) {
        const { fighter, rig, baseHipsY } = ctx;
        const isRising = fighter.vy > 0;
        rig.hips.position.y = baseHipsY + 0.18;
        rig.torso.rotation.z = isRising ? 0.24 : 0;
        rig.neck.rotation.z = isRising ? 0.20 : 0;
        rig.headGroup.rotation.z = isRising ? 0.25 : 0;
        if (rig.legs) {
            if (rig.legs[0]) rig.legs[0].rotation.z = isRising ? 0.48 : 0.15;
            if (rig.legs[1]) rig.legs[1].rotation.z = isRising ? -0.38 : -0.15;
        }
    }
});
