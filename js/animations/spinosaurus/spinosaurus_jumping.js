// ============================================================================
// js/animations/spinosaurus/spinosaurus_jumping.js — Spinosaurus Jump Animations
// ============================================================================

registerFighterAnimation('spinosaurus', {
    animateJump(ctx) {
        const { fighter, rig, baseHipsY } = ctx;
        const vy = fighter.vy || 0;
        const isRising = vy > 0;
        const airTilt = isRising ? Math.min(0.35, vy * 0.028) : 0;

        rig.hips.position.y = baseHipsY + 0.15;
        rig.torso.rotation.z = isRising ? 0.22 + airTilt * 0.5 : 0;
        rig.headGroup.rotation.z = isRising ? 0.20 : 0;
        if (rig.jaw) rig.jaw.rotation.z = isRising ? -0.25 : -0.05;

        rig.legs.forEach((leg, i) => {
            leg.rotation.z = isRising ? -0.55 - (i % 2) * 0.18 : 0.25 + (i % 2) * 0.10;
        });

        rig.arms.forEach((arm, i) => {
            arm.rotation.z = isRising ? 0.45 : -0.15;
            arm.rotation.x = (i === 0 ? -1 : 1) * (isRising ? 0.25 : 0.20);
        });

        rig.tailSegments.forEach((seg, i) => {
            seg.rotation.z = (isRising ? -0.18 : 0.05) * (1 + i * 0.12);
        });
    }
});
