/* ============================================================================
 * ANIMATIONS OISEAU DE TERREUR : ATTENTE (IDLE) & ACCROUPISSEMENT (CROUCH)
 * ============================================================================ */

registerFighterAnimation('terabird', {
    animateIdle(ctx) {
        if (ctx.isWalk && FIGHTER_IMPLS.terabird && FIGHTER_IMPLS.terabird.animateWalk) {
            FIGHTER_IMPLS.terabird.animateWalk(ctx);
            return;
        }
        const { rig, baseHipsY, time, act } = ctx;
        const freq = 5.5;
        rig.hips.position.y = baseHipsY + Math.abs(Math.sin(time * freq)) * 0.07;
        rig.neck.rotation.z = Math.sin(time * 8) * 0.06;
        rig.arms[0].rotation.x = -Math.abs(Math.sin(time * 6)) * 0.35;
        rig.arms[1].rotation.x = Math.abs(Math.sin(time * 6)) * 0.35;
        rig.legs[0].rotation.z = 0;
        rig.legs[1].rotation.z = 0;

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
