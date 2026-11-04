// ============================================================================
// js/animations/pulmonoscorpius/pulmonoscorpius_idle.js — Pulmonoscorpius Idle & Crouch Animations
// ============================================================================

registerFighterAnimation('pulmonoscorpius', {
    animateIdle(ctx) {
        const { fighter, rig, baseHipsY, time, isWalk } = ctx;
        if (isWalk && this.animateWalk) {
            this.animateWalk(ctx);
            return;
        }
        const freq = 3.5;
        rig.hips.position.y = baseHipsY + Math.sin(time * freq) * 0.02;
        rig.arms[0].rotation.y = 0.25 + Math.sin(time * 3) * 0.15;
        rig.arms[1].rotation.y = -0.25 - Math.sin(time * 3) * 0.15;
        rig.tailSegments.forEach((seg, i) => {
            seg.rotation.z = -0.35 + Math.sin(time * 4 + i * 0.4) * 0.08;
        });
        if (rig.specialParts.stinger) {
            rig.specialParts.stinger.rotation.z = 0.4 + Math.sin(time * 6) * 0.15;
        }
        rig.legs.forEach((leg) => {
            leg.rotation.z = 0;
        });

        // Posture d'accroupissement (Crouch)
        if (fighter && fighter.isCrouching) {
            rig.hips.position.y = baseHipsY * 0.58;
            rig.torso.rotation.z -= 0.18;
            rig.headGroup.rotation.z += 0.15;
            rig.legs.forEach(leg => { leg.rotation.z *= 0.35; });
        }
    }
});
