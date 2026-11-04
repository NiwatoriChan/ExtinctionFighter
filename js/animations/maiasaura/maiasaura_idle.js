/* ============================================================================
 * ANIMATIONS MAIASAURA : ATTENTE (IDLE) & ACCROUPISSEMENT (CROUCH)
 * ============================================================================ */

registerFighterAnimation('maiasaura', {
    animateIdle(ctx) {
        if (ctx.isWalk && FIGHTER_IMPLS.maiasaura && FIGHTER_IMPLS.maiasaura.animateWalk) {
            FIGHTER_IMPLS.maiasaura.animateWalk(ctx);
            return;
        }
        const { rig, baseHipsY, time, act } = ctx;
        const freq = 5;
        rig.hips.position.y = baseHipsY + Math.abs(Math.sin(time * freq)) * 0.08;
        rig.neck.rotation.z = Math.sin(time * freq) * 0.1;
        rig.legs[0].rotation.z = 0;
        rig.legs[1].rotation.z = 0;
        rig.tailSegments.forEach((seg, i) => {
            seg.rotation.y = Math.sin(time * 5 - i * 0.5) * 0.18;
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
