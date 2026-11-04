/* ============================================================================
 * ANIMATIONS APATOSAURE : ATTENTE (IDLE) & ACCROUPISSEMENT (CROUCH)
 * ============================================================================ */

registerFighterAnimation('apato', {
    animateIdle(ctx) {
        if (ctx.isWalk && FIGHTER_IMPLS.apato && FIGHTER_IMPLS.apato.animateWalk) {
            FIGHTER_IMPLS.apato.animateWalk(ctx);
            return;
        }
        const { rig, baseHipsY, time, act } = ctx;
        const freq = 2.5;
        rig.hips.position.y = baseHipsY + Math.abs(Math.sin(time * freq)) * 0.04;
        rig.specialParts.neckSegments.forEach((nSeg, i) => {
            nSeg.rotation.z = Math.sin(time * 3 - i * 0.6) * 0.1;
            nSeg.rotation.y = Math.cos(time * 2.5 - i * 0.5) * 0.08;
        });
        rig.tailSegments.forEach((seg, i) => {
            seg.rotation.y = Math.sin(time * 6 - i * 0.6) * 0.22;
        });
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
