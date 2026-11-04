// ============================================================================
// js/animations/quetzalcoatlus/quetzalcoatlus_jumping.js — Quetzalcoatlus Jump & Flight Animations
// ============================================================================

registerFighterAnimation('quetzal', {
    animateFlight(ctx) {
        const { fighter, rig, time } = ctx;
        const sp = rig.specialParts;
        if (!sp || typeof sp.applyPoseMode !== 'function') return;

        // Vol thermique et battements puissants extraits du modèle paléontologique
        sp.applyPoseMode('soar', time, {
            flapFreq: 5.2,
            flapAmp: 1.15,
            rootY: 1.98
        });

        if (typeof sp.updateAnatomicalSkin === 'function') {
            sp.updateAnatomicalSkin(time, fighter, 'soar');
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
        const qRig = sp && sp.qRig;
        if (!sp || !qRig) return;

        const vy = fighter ? (fighter.vy || 0) : 0;
        const isRising = vy > 0;
        const airTilt = Math.max(-0.42, Math.min(0.42, vy * 0.028));

        rig.hips.position.y = baseHipsY + 0.12;

        // Envol par propulsion quadrupède (Quad-Launch) puis plané
        sp.applyPoseMode('soar', time, {
            flapFreq: isRising ? 7.2 : 3.0,
            flapAmp: isRising ? 1.25 : 0.60,
            rootY: 2.05
        });

        qRig.rootJoint.rotation.x = isRising ? (-0.28 - airTilt * 0.4) : 0;
        qRig.setHeadRot(isRising ? -0.18 : 0, 0, 0);
        qRig.setJawRot(isRising ? 0.24 : 0.05);

        [qRig.leftLeg, qRig.rightLeg].forEach(l => {
            if (isRising) {
                // Détente explosive des membres postérieurs vers l'arrière
                l.hip.rotation.set(Math.PI * 0.44, 0, -l.side * 0.08);
                l.knee.rotation.set(0.08, 0, 0);
                l.ankle.rotation.set(0.75, 0, 0);
            } else {
                // Préparation à la réception au sol
                l.hip.rotation.set(0.42, 0, -l.side * 0.06);
                l.knee.rotation.set(0.35, 0, 0);
                l.ankle.rotation.set(-0.18, 0, 0);
            }
        });

        sp.updateAnatomicalSkin(time, fighter, 'soar');
    }
});

