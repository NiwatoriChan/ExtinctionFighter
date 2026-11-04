// ============================================================================
// js/animations/postosuchus/postosuchus_idle.js — Postosuchus Idle & Crouch Animations
// ============================================================================

registerFighterAnimation('postosuchus', {
    animateIdle(ctx) {
        const { fighter, rig, baseHipsY, time, isWalk } = ctx;
        if (isWalk && this.animateWalk) {
            this.animateWalk(ctx);
            return;
        }
        const freq = 3.5;
        rig.hips.position.y = baseHipsY + Math.sin(time * freq) * 0.06;
        rig.torso.rotation.y = 0;
        rig.jaw.rotation.z = -0.06 - Math.abs(Math.sin(time * 3)) * 0.14;
        rig.legs[0].rotation.z = 0;
        rig.legs[3].rotation.z = 0;
        rig.legs[1].rotation.z = 0;
        rig.legs[2].rotation.z = 0;
        rig.tailSegments.forEach((seg, i) => {
            seg.rotation.y = Math.sin(time * 7 - i * 0.5) * 0.26;
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
