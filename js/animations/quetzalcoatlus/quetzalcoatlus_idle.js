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
        rig.hips.position.y = crouch ? baseHipsY * 0.80 : (baseHipsY + breathe * 0.018);
        rig.torso.rotation.z = crouch ? -0.14 : (-0.02 + breathe * 0.015);
        rig.neck.rotation.z = crouch ? 0.08 : (0.04 - breathe * 0.015);
        rig.headGroup.rotation.z = crouch ? -0.10 : (-0.06 + Math.sin(time * 1.4) * 0.04);
        rig.headGroup.rotation.y = Math.sin(time * 1.1) * 0.09;
        rig.jaw.rotation.z = -0.02 - Math.max(0, Math.sin(time * 1.8)) * 0.04;
        if (sp.leftWing && sp.rightWing) {
            const sway = breathe * 0.02;
            sp.leftWing.rotation.set(sway * 0.5, 0.0, crouch ? -0.12 : 0.0);
            sp.rightWing.rotation.set(-sway * 0.5, 0.0, crouch ? -0.12 : 0.0);
        }
        if (rig.arms.length >= 2) {
            rig.arms[0].rotation.set(0.0, 0.0, 0.0);
            rig.arms[1].rotation.set(0.0, 0.0, 0.0);
        }
        if (rig.legs.length >= 2) {
            rig.legs[0].rotation.z = crouch ? 0.22 : 0;
            rig.legs[1].rotation.z = crouch ? 0.22 : 0;
        }
    }
});

