/* ============================================================================
 * ANIMATIONS PACHYRHINOSAURE : ATTENTE (IDLE) & ACCROUPISSEMENT (CROUCH)
 * ============================================================================ */

registerFighterAnimation('pachyrhino', {
    animateIdle(ctx) {
        if (ctx.isWalk && FIGHTER_IMPLS.pachyrhino && FIGHTER_IMPLS.pachyrhino.animateWalk) {
            FIGHTER_IMPLS.pachyrhino.animateWalk(ctx);
            return;
        }
        const { rig, baseHipsY, time, act } = ctx;
        const freq = 4;
        rig.hips.position.y = baseHipsY + Math.abs(Math.sin(time * freq)) * 0.04;
        rig.headGroup.rotation.z = Math.sin(time * 3.5) * 0.08;
        rig.legs[0].rotation.z = 0;
        rig.legs[3].rotation.z = 0;
        rig.legs[1].rotation.z = 0;
        rig.legs[2].rotation.z = 0;

        if (act === 'crouch') {
            rig.hips.position.y = baseHipsY * 0.62;
            rig.torso.rotation.z = -0.26;
            if (rig.legs) {
                if (rig.legs[0]) rig.legs[0].rotation.z = 0.42;
                if (rig.legs[1]) rig.legs[1].rotation.z = -0.42;
            }
        }
    }
});
