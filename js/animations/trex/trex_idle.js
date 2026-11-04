/* ============================================================================
 * ANIMATIONS T-REX : ATTENTE (IDLE), ACCROUPISSEMENT (CROUCH) & GARDE (BLOCK)
 * ============================================================================ */

registerFighterAnimation('trex', {
    animateIdle(ctx) {
        if (ctx.isWalk && FIGHTER_IMPLS.trex && FIGHTER_IMPLS.trex.animateWalk) {
            FIGHTER_IMPLS.trex.animateWalk(ctx);
            return;
        }
        const { rig, baseHipsY, time, act } = ctx;
        const freq = 3.5;
        rig.hips.position.y = baseHipsY + Math.abs(Math.sin(time * freq)) * 0.06;
        rig.torso.rotation.z = Math.sin(time * 3) * 0.03;
        rig.jaw.rotation.z = -0.08 - Math.abs(Math.sin(time * 2.5)) * 0.12;
        rig.legs[0].rotation.z = 0;
        rig.legs[1].rotation.z = 0;
        rig.tailSegments.forEach((seg, i) => {
            seg.rotation.y = Math.sin(time * freq - i * 0.5) * 0.1;
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
