/* ============================================================================
 * ANIMATIONS ANKYLOSAURE : ATTENTE (IDLE) & ACCROUPISSEMENT (CROUCH)
 * ============================================================================ */

registerFighterAnimation('ankylo', {
    animateIdle(ctx) {
        if (ctx.isWalk && FIGHTER_IMPLS.ankylo && FIGHTER_IMPLS.ankylo.animateWalk) {
            FIGHTER_IMPLS.ankylo.animateWalk(ctx);
            return;
        }
        const { rig, baseHipsY, time, act } = ctx;
        const freq = 3;
        rig.hips.position.y = baseHipsY + Math.sin(time * freq) * 0.05;
        rig.torso.rotation.x = 0;
        rig.legs[0].rotation.z = 0;
        rig.legs[3].rotation.z = 0;
        rig.legs[1].rotation.z = 0;
        rig.legs[2].rotation.z = 0;
        rig.tailSegments.forEach((seg, i) => {
            seg.rotation.y = Math.sin(time * 5 - i * 0.4) * 0.28;
        });

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
