// ============================================================================
// js/animations/megatherium/megatherium_idle.js — Megatherium Idle & Crouch Animations
// ============================================================================

registerFighterAnimation('giantsloth', {
    animateIdle(ctx) {
        const { fighter, rig, baseHipsY, time, isWalk } = ctx;
        if (isWalk && this.animateWalk) {
            this.animateWalk(ctx);
            return;
        }
        const freq = 2.0;
        rig.hips.position.y = baseHipsY + Math.abs(Math.sin(time * freq)) * 0.04;
        rig.torso.rotation.y = Math.sin(time * 2.2) * 0.15;
        rig.arms[0].rotation.y = 0.3 + Math.sin(time * 3) * 0.15;
        rig.arms[1].rotation.y = -0.3 - Math.sin(time * 3) * 0.15;
        rig.legs[0].rotation.z = 0;
        rig.legs[1].rotation.z = 0;

        // Posture d'accroupissement (Crouch)
        if (fighter && fighter.isCrouching) {
            rig.hips.position.y = baseHipsY * 0.58;
            rig.torso.rotation.z -= 0.18;
            rig.headGroup.rotation.z += 0.15;
            rig.legs.forEach(leg => { leg.rotation.z *= 0.35; });
        }
    }
});
