// ============================================================================
// js/animations/quetzalcoatlus/quetzalcoatlus_walking.js — Quetzalcoatlus Walk, Sprint & Dash Animations
// ============================================================================

registerFighterAnimation('quetzal', {
    animateWalk(ctx) {
        const { fighter, rig, baseHipsY, time, dt } = ctx;

        // Mise à jour de la jauge d'endurance circulaire 3D
        if (rig.specialParts && rig.specialParts.updateEnduranceCircle) {
            const endurance = fighter ? (fighter.flightEndurance !== undefined ? fighter.flightEndurance : 2.0) : 2.0;
            const isFlying = fighter ? !!fighter.isFlying : false;
            rig.specialParts.updateEnduranceCircle(endurance, isFlying, dt || 0.016);
        }

        if (fighter && fighter.isFlying) {
            if (this.animateFlight) {
                this.animateFlight(ctx);
            }
            return;
        }

        const sp = rig.specialParts;
        const qRig = sp && sp.qRig;

        const moveDir = fighter ? (fighter.vx * fighter.facing) : 4.0;
        const isSprint = moveDir > 6.5 || (fighter && (fighter.isSprinting || fighter.sprintDuration > 0.25));
        const strideSpeed = isSprint ? 5.6 : 4.2;
        const strideAmp = isSprint ? 1.32 : 1.0;

        // Marche quadrupède terrestre extraite du modèle paléontologique
        if (sp && typeof sp.applyPoseMode === 'function') {
            sp.applyPoseMode('walk', time, { strideSpeed, strideAmp });
        }

        rig.hips.position.y = baseHipsY;

        // Inclinaison dynamique de course (Sprint Boost) ou recul prudent
        if (qRig && fighter) {
            if (isSprint) {
                qRig.rootJoint.rotation.x += 0.22; // Buste penché vers l'avant (+Z du modèle)
                qRig.neckSegments.forEach((seg, i) => {
                    seg.rotation.x += (i < 4 ? 0.045 : -0.02);
                });
                qRig.setHeadRot(0.35, 0, 0);
                qRig.setJawRot(0.16);
            } else if (moveDir < -0.5) {
                qRig.rootJoint.rotation.x -= 0.14; // Posture défensive redressée
                qRig.setHeadRot(0.62, 0, 0);
            }
        }

        if (sp && typeof sp.updateAnatomicalSkin === 'function') {
            sp.updateAnatomicalSkin(time, fighter, 'walk');
        }
    },

    // Ruée / Dash : Envergure aérodynamique complète et fente profilée
    animateDash(ctx) {
        const { fighter, rig, lunge, isBackDash, baseHipsY, time } = ctx;
        const sp = rig.specialParts;
        const qRig = sp && sp.qRig;

        if (!qRig || !sp) return;

        // Partir du déploiement complet en vol / envergure
        sp.applyPoseMode('soar', time, {
            flapFreq: 8.5,
            flapAmp: 0.75,
            rootY: isBackDash ? 2.18 + lunge * 0.25 : 1.82
        });

        if (isBackDash) {
            // Esquive aérienne en retrait ailes déployées en freinage (parade / cabré)
            rig.hips.position.y = baseHipsY * (0.94 + lunge * 0.18);
            rig.hips.position.x = -lunge * 0.45;
            qRig.rootJoint.rotation.set(-0.48, 0, 0);

            qRig.neckSegments.forEach((seg, i) => {
                seg.rotation.set(i === 0 ? -0.45 : -0.04, 0, 0);
            });
            qRig.setHeadRot(0.32, 0, 0);
            qRig.setJawRot(0.28 * lunge);

            [qRig.leftWing, qRig.rightWing].forEach(w => {
                const s = w.side;
                w.shoulder.rotation.set(0.38, -s * 0.18, s * 0.22 * lunge);
                w.elbow.rotation.set(0, s * 0.12, s * 0.15);
                w.knuckle.rotation.set(0, -s * 0.12, -s * 0.15);
            });

            [qRig.leftLeg, qRig.rightLeg].forEach(l => {
                l.hip.rotation.set(0.45 - lunge * 0.35, 0, -l.side * 0.1);
                l.knee.rotation.set(0.35, 0, 0);
                l.ankle.rotation.set(-0.2, 0, 0);
            });
        } else {
            // Ruée offensive vers l'avant : rostre en lance pointé et ailes profilées en flèche
            rig.hips.position.y = baseHipsY * 0.85;
            rig.hips.position.x = lunge * 0.58;
            qRig.rootJoint.rotation.set(0.26, 0, 0);

            qRig.neckSegments.forEach((seg, i) => {
                seg.rotation.set(i === 0 ? 0.16 : 0.025, 0, 0);
            });
            qRig.setHeadRot(-0.18, 0, 0);
            qRig.setJawRot(0.22);

            [qRig.leftWing, qRig.rightWing].forEach(w => {
                const s = w.side;
                w.shoulder.rotation.set(-0.15, s * 0.28, -s * 0.18);
                w.elbow.rotation.set(0, -s * 0.15, 0);
                w.wrist.rotation.set(0, 0, 0);
                w.knuckle.rotation.set(0, -s * 0.22, 0);
            });
        }

        sp.updateAnatomicalSkin(time, fighter, 'soar');
    }
});

