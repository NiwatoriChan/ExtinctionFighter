/* ============================================================================
 * ANIMATIONS T-REX : SAUT (JUMPING & AIRBORNE)
 * Propulsion digitigrade explosive en montée (extension fémur-tibia-métatarse)
 * et repli amortisseur griffes déployées en descente.
 * ============================================================================ */

registerFighterAnimation('trex', {
    animateJump(ctx) {
        const { fighter, rig, baseHipsY, time } = ctx;
        const sp = rig.specialParts;

        const vy = fighter ? (fighter.vy || 0) : 0;
        const isRising = vy > 0;
        const airTilt = Math.max(-0.38, Math.min(0.38, vy * 0.025));

        rig.hips.position.y = baseHipsY + 0.14;
        rig.torso.rotation.z = isRising ? (0.24 + airTilt * 0.35) : (-0.18 + airTilt * 0.2);
        rig.headGroup.rotation.z = isRising ? 0.14 : -0.18;
        rig.jaw.rotation.z = isRising ? -0.36 : -0.20;

        if (rig.legs.length >= 2) {
            rig.legs[0].rotation.z = isRising ? -0.45 : 0.35;
            rig.legs[1].rotation.z = isRising ? 0.35 : 0.18;
        }
        rig.arms.forEach(arm => { if (arm) arm.rotation.z = isRising ? 0.30 : -0.15; });
        rig.tailSegments.forEach((seg, i) => {
            if (seg) {
                seg.rotation.z = (isRising ? -0.09 : 0.07) * (1 + i * 0.1);
                seg.rotation.y = Math.sin(time * 8 - i * 0.5) * 0.08;
            }
        });
    }
});
