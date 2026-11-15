// ============================================================================
// js/animations/quetzalcoatlus/quetzalcoatlus_jumping.js — Quetzalcoatlus Jump & Flight Animations
// ============================================================================

registerFighterAnimation('quetzal', {
    animateFlight(ctx) {
        const { fighter, rig, baseHipsY, time } = ctx;
        const sp = rig.specialParts;
        const flap = Math.sin(time * 5.6) * 0.58;
        rig.hips.position.y = (baseHipsY || 1.98) + Math.sin(time * 5.6 - 0.6) * 0.16;
        rig.torso.rotation.z = -0.14 + Math.sin(time * 5.6) * 0.08;
        rig.neck.rotation.z = -0.12;
        rig.headGroup.rotation.z = 0.08;
        if (sp && sp.leftWing && sp.rightWing) {
            sp.leftWing.rotation.set(flap, 0.18, 0);
            sp.rightWing.rotation.set(-flap, -0.18, 0);
        }
        if (rig.arms.length >= 2) {
            rig.arms[0].rotation.set(0, Math.cos(time * 5.6) * 0.12, 0);
            rig.arms[1].rotation.set(0, -Math.cos(time * 5.6) * 0.12, 0);
        }
        if (rig.legs.length >= 2) {
            rig.legs[0].rotation.z = -0.62;
            rig.legs[1].rotation.z = -0.58;
        }
    },

    animateJump(ctx) {
        const { fighter, rig, baseHipsY, time, dt } = ctx;

        // Mise à jour de la jauge d'endurance circulaire 3D
        if (rig.specialParts && rig.specialParts.updateEnduranceCircle) {
            const endurance = fighter ? (fighter.flightEndurance !== undefined ? fighter.flightEndurance : 2.0) : 2.0;
            const isFlying = fighter ? !!fighter.isFlying : false;
            rig.specialParts.updateEnduranceCircle(endurance, isFlying, dt || 0.016);
        }

        if (fighter && fighter.isFlying) {
            this.animateFlight(ctx);
            return;
        }

        const sp = rig.specialParts;

        const vy = fighter ? (fighter.vy || 0) : 0;
        const isRising = vy > 0;
        const flap = Math.sin(time * (isRising ? 8.2 : 3.4)) * (isRising ? 0.65 : 0.25);

        rig.hips.position.y = baseHipsY + 0.12;
        rig.torso.rotation.z = isRising ? 0.24 : -0.10;
        rig.headGroup.rotation.z = isRising ? 0.14 : -0.06;
        rig.jaw.rotation.z = isRising ? -0.24 : -0.05;
        if (sp.leftWing && sp.rightWing) {
            sp.leftWing.rotation.set(flap, 0.16, 0);
            sp.rightWing.rotation.set(-flap, -0.16, 0);
        }
        if (rig.arms.length >= 2) {
            rig.arms[0].rotation.set(0, 0, 0);
            rig.arms[1].rotation.set(0, 0, 0);
        }
        if (rig.legs.length >= 2) {
            rig.legs[0].rotation.z = isRising ? -0.68 : 0.34;
            rig.legs[1].rotation.z = isRising ? -0.60 : 0.28;
        }
    }
});

