// ============================================================================
// js/animations/stegosaurus/stegosaurus_idle.js — Stegosaurus Idle & Crouch Animations
// ============================================================================

registerFighterAnimation('stegosaurus', {
    animateIdle(ctx) {
        const { fighter, rig, baseHipsY, time, isWalk } = ctx;
        if (isWalk && this.animateWalk) {
            this.animateWalk(ctx);
            return;
        }
        const freq = 2.5;
        rig.hips.position.y = baseHipsY + Math.abs(Math.sin(time * freq)) * 0.03;
        rig.torso.rotation.y = Math.sin(time * (freq * 0.5)) * 0.12;
        rig.tailSegments.forEach((seg, i) => {
            seg.rotation.y = Math.sin(time * 3.5 - i * 0.4) * 0.28;
        });
        rig.legs[0].rotation.z = 0;
        rig.legs[1].rotation.z = 0;
        rig.arms[0].rotation.z = 0;
        rig.arms[1].rotation.z = 0;

        // Posture d'accroupissement (Crouch)
        if (fighter && fighter.isCrouching) {
            rig.hips.position.y = baseHipsY * 0.58;
            rig.torso.rotation.z -= 0.18;
            rig.headGroup.rotation.z += 0.15;
            rig.legs.forEach(leg => { leg.rotation.z *= 0.35; });
        }
    }
});
