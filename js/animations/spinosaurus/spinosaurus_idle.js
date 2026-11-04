// ============================================================================
// js/animations/spinosaurus/spinosaurus_idle.js — Spinosaurus Idle & Crouch Animations
// ============================================================================

registerFighterAnimation('spinosaurus', {
    animateIdle(ctx) {
        const { fighter, rig, baseHipsY, time, isWalk } = ctx;
        if (isWalk && this.animateWalk) {
            this.animateWalk(ctx);
            return;
        }
        const freq = 3.2;
        rig.hips.position.y = baseHipsY + Math.abs(Math.sin(time * freq)) * 0.06;
        rig.jaw.rotation.z = -0.1 - Math.abs(Math.sin(time * 2.8)) * 0.12;
        rig.arms[0].rotation.z = Math.sin(time * 4) * 0.15;
        rig.arms[1].rotation.z = -Math.sin(time * 4) * 0.15;
        rig.legs[0].rotation.z = 0;
        rig.legs[1].rotation.z = 0;
        rig.tailSegments.forEach((seg, i) => {
            seg.rotation.y = Math.sin(time * 6 - i * 0.5) * 0.25;
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
