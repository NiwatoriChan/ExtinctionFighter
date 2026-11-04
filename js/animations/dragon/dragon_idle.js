// ============================================================================
// js/animations/dragon/dragon_idle.js — Dragon Idle & Crouch Animations
// ============================================================================

registerFighterAnimation('dragon', {
    animateIdle(ctx) {
        const { fighter, rig, time, isWalk, baseHipsY } = ctx;
        if (isWalk && this.animateWalk) {
            this.animateWalk(ctx);
            return;
        }
        const freq = 3.2;

        rig.hips.position.y = baseHipsY + Math.sin(time * freq) * 0.12;
        rig.torso.rotation.z = Math.sin(time * 2.5) * 0.05;
        rig.jaw.rotation.z = -0.12 - Math.abs(Math.sin(time * 2)) * 0.15;

        const wingFlap = Math.sin(time * 4.5) * 0.45;
        if (rig.specialParts.leftWing) rig.specialParts.leftWing.rotation.x = -wingFlap;
        if (rig.specialParts.rightWing) rig.specialParts.rightWing.rotation.x = wingFlap;

        if (rig.legs && rig.legs.length >= 2) {
            rig.legs[0].rotation.z = 0;
            rig.legs[1].rotation.z = 0;
        }

        rig.tailSegments.forEach((seg, i) => {
            seg.rotation.y = Math.sin(time * 3.5 - i * 0.5) * 0.18;
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
