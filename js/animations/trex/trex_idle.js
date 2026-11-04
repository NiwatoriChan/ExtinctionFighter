/* ============================================================================
 * ANIMATIONS T-REX : ATTENTE (IDLE), ACCROUPISSEMENT (CROUCH) & PARADE
 * Pilotage biomécanique du squelette articulé (respiration thoracique et
 * gastrale, onde cervicale en S, scan binoculaire, compensation digitigrade).
 * ============================================================================ */

registerFighterAnimation('trex', {
    animateIdle(ctx) {
        if (ctx.isWalk && FIGHTER_IMPLS.trex && FIGHTER_IMPLS.trex.animateWalk) {
            FIGHTER_IMPLS.trex.animateWalk(ctx);
            return;
        }

        const { fighter, rig, baseHipsY, time, act } = ctx;
        const sp = rig.specialParts;
        const tRig = sp && sp.tRig;

        if (!sp || !tRig) return;

        rig.hips.position.y = baseHipsY;

        if (act === 'crouch' || (fighter && fighter.isCrouching)) {
            sp.applyPoseMode('crouch', time);
            sp.updateAnatomicalSkin(time, fighter, 'crouch');
            return;
        }

        sp.applyPoseMode('idle', time);
        sp.updateAnatomicalSkin(time, fighter, 'idle');
    }
});
