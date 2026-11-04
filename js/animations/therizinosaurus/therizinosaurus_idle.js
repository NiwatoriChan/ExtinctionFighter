// ============================================================================
// js/animations/therizinosaurus/therizinosaurus_idle.js — Therizinosaurus Idle & Crouch Animations
// ============================================================================

registerFighterAnimation('therizino', {
    animateIdle(ctx) {
        const { fighter, rig, baseHipsY, time, isWalk } = ctx;
        if (isWalk && this.animateWalk) {
            this.animateWalk(ctx);
            return;
        }
        const freq = 3.8;
        rig.hips.position.y = baseHipsY + Math.abs(Math.sin(time * freq)) * 0.05;
        rig.arms[0].rotation.y = Math.sin(time * 4) * 0.22;
        rig.arms[1].rotation.y = -Math.sin(time * 4) * 0.22;
        rig.arms[0].rotation.z = 0.15 + Math.sin(time * 3) * 0.1;
        rig.arms[1].rotation.z = 0.15 - Math.sin(time * 3) * 0.1;
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
