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

        const breathe = Math.sin(time * 2.4);
        const crouch = (act === 'crouch' || (fighter && fighter.isCrouching));
        rig.hips.position.y = crouch ? baseHipsY * 0.72 : (baseHipsY + breathe * 0.035);
        rig.torso.rotation.z = crouch ? -0.18 : breathe * 0.03;
        rig.neck.rotation.z = crouch ? -0.14 : -breathe * 0.025;
        rig.headGroup.rotation.z = crouch ? -0.18 : (Math.sin(time * 1.5) * 0.045 - breathe * 0.02);
        rig.headGroup.rotation.y = Math.sin(time * 1.2) * 0.07;
        rig.jaw.rotation.z = -0.05 - Math.max(0, Math.sin(time * 1.8)) * 0.08;
        rig.legs.forEach((leg, i) => {
            if (leg) leg.rotation.z = crouch ? (i < 2 ? -0.22 : 0.18) : 0;
        });
        rig.tailSegments.forEach((seg, i) => {
            if (seg) seg.rotation.y = Math.sin(time * 2.8 - i * 0.5) * (0.09 + i * 0.03);
        });
    }
});
