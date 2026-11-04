// ============================================================================
// js/animations/smilodon/smilodon_idle.js — Smilodon Idle & Crouch Animations
// ============================================================================

registerFighterAnimation('smilodon', {
    animateIdle(ctx) {
        const { fighter, rig, baseHipsY, time, isWalk } = ctx;
        if (isWalk && this.animateWalk) {
            this.animateWalk(ctx);
            return;
        }
        const freq = 3.8;
        rig.hips.position.y = baseHipsY + Math.sin(time * freq) * 0.05;
        rig.torso.rotation.y = 0;
        rig.torso.rotation.z = Math.sin(time * 2.8) * 0.04;
        rig.jaw.rotation.z = -0.08 - Math.abs(Math.sin(time * 3.2)) * 0.18;

        if (rig.legs && rig.legs.length >= 4) {
            rig.legs[0].rotation.z = 0;
            rig.legs[3].rotation.z = 0;
            rig.legs[1].rotation.z = 0;
            rig.legs[2].rotation.z = 0;
        }

        rig.tailSegments.forEach((seg, i) => {
            seg.rotation.y = Math.sin(time * 8 - i * 0.8) * 0.35;
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
