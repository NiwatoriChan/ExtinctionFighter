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
        const qRig = sp && sp.qRig;

        // --- MODE AU SOL (Posture d'échassier quadrupède sur métacarpiens repliés) ---
        if (sp && typeof sp.applyPoseMode === 'function') {
            sp.applyPoseMode('idle', time);
        }

        const freq = 2.2;
        rig.hips.position.y = baseHipsY + Math.sin(time * freq) * 0.025;

        // Posture d'accroupissement (Crouch) : abaissement quadrupède prêt au bond (Quad-Launch)
        if (fighter && fighter.isCrouching && qRig) {
            rig.hips.position.y = baseHipsY * 0.62;
            qRig.rootJoint.position.y = 1.68;
            qRig.rootJoint.rotation.x = -0.35;

            qRig.neckSegments.forEach((seg, i) => {
                const rx = i === 0 ? -0.18 : (i < 4 ? 0.02 : 0.06);
                seg.rotation.set(rx, 0, 0);
            });
            qRig.setHeadRot(0.18, 0, 0);
            qRig.setJawRot(0.08);

            [qRig.leftWing, qRig.rightWing].forEach(w => {
                const s = w.side;
                w.shoulder.rotation.set(0.88, -s * 0.28, -s * 1.05);
                w.elbow.rotation.set(0, 0, -s * 0.45);
                w.wrist.rotation.set(0, 0, s * 0.22);
                w.knuckle.rotation.set(0, s * 1.38, s * 1.98);
            });

            [qRig.leftLeg, qRig.rightLeg].forEach(l => {
                l.hip.rotation.set(0.32, 0, 0);
                l.knee.rotation.set(0.68, 0, 0);
                l.ankle.rotation.set(-0.35, 0, 0);
            });
        }

        if (sp && typeof sp.updateAnatomicalSkin === 'function') {
            sp.updateAnatomicalSkin(time, fighter, 'idle');
        }
    }
});

