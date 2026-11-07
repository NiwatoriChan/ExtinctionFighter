/* ============================================================================
 * ANIMATIONS PACHYRHINOSAURE : ATTENTE (IDLE) & ACCROUPISSEMENT (CROUCH)
 * Pilotage biomécanique du squelette quadrupède articulé (respiration lourde,
 * balancement de la collerette pariéto-squamosale à ocelles, garde de bélier).
 * ============================================================================ */

registerFighterAnimation('pachyrhino', {
    animateIdle(ctx) {
        if (ctx.isWalk && FIGHTER_IMPLS.pachyrhino && FIGHTER_IMPLS.pachyrhino.animateWalk) {
            FIGHTER_IMPLS.pachyrhino.animateWalk(ctx);
            return;
        }

        const { fighter, rig, baseHipsY, time, act } = ctx;
        const sp = rig.specialParts;
        const pRig = sp && sp.pRig;

        if (!sp || !pRig) return;

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
