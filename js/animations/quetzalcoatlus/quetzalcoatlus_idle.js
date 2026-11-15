// ============================================================================
// js/animations/quetzalcoatlus/quetzalcoatlus_idle.js — Quetzalcoatlus Idle & Crouch Animations
// ============================================================================

registerFighterAnimation('quetzal', {
    // Animation d'attente (idle) / marche quadrupède / vol thermique
    animateIdle(ctx) {
        const { fighter, rig, baseHipsY, time, isWalk, dt } = ctx;

        // Mise à jour de la jauge d'endurance circulaire 3D
        if (rig.specialParts && rig.specialParts.updateEnduranceCircle) {
            const endurance = fighter ? (fighter.flightEndurance !== undefined ? fighter.flightEndurance : 2.0) : 2.0;
            const isFlying = fighter ? !!fighter.isFlying : false;
            rig.specialParts.updateEnduranceCircle(endurance, isFlying, dt || 0.016);
        }

        // --- MODE VOL ACTIF (Ailes déployées en vol thermique et battements puissants) ---
        if (fighter && fighter.isFlying) {
            if (this.animateFlight) {
                this.animateFlight(ctx);
            }
            return;
        }

        if (isWalk && this.animateWalk) {
            this.animateWalk(ctx);
            return;
        }

        const sp = rig.specialParts;

        const breathe = Math.sin(time * 2.2);
        const crouch = Boolean(fighter && fighter.isCrouching);
        rig.hips.position.y = crouch ? baseHipsY * 0.72 : (baseHipsY + breathe * 0.028);
        rig.torso.rotation.z = crouch ? -0.18 : (-0.06 + breathe * 0.025);
        rig.neck.rotation.z = crouch ? 0.10 : (0.14 - breathe * 0.02);
        rig.headGroup.rotation.z = crouch ? -0.12 : (-0.18 + Math.sin(time * 1.4) * 0.04);
        rig.headGroup.rotation.y = Math.sin(time * 1.1) * 0.09;
        rig.jaw.rotation.z = -0.04 - Math.max(0, Math.sin(time * 1.8)) * 0.06;
        if (sp.leftWing && sp.rightWing) {
            const sway = breathe * 0.04;
            sp.leftWing.rotation.set(-0.62 + sway, 0.16, 0.22);
            sp.rightWing.rotation.set(0.62 - sway, -0.16, 0.22);
        }
        if (rig.arms.length >= 2) {
            rig.arms[0].rotation.set(1.38, 0.52, -0.28);
            rig.arms[1].rotation.set(-1.38, -0.52, -0.28);
        }
        if (rig.legs.length >= 2) {
            rig.legs[0].rotation.z = crouch ? 0.26 : 0;
            rig.legs[1].rotation.z = crouch ? 0.26 : 0;
        }
    }
});

