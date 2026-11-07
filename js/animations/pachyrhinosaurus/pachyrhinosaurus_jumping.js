/* ============================================================================
 * ANIMATIONS PACHYRHINOSAURE : SAUT (JUMPING & AIRBORNE)
 * Détente explosive des membres postérieurs à la montée (cabré quadrupède)
 * et préparation des sabots antérieurs massifs à la réception.
 * ============================================================================ */

registerFighterAnimation('pachyrhino', {
    animateJump(ctx) {
        const { fighter, rig, baseHipsY, time } = ctx;
        const sp = rig.specialParts;
        const pRig = sp && sp.pRig;

        if (!sp || !pRig) return;

        const isRising = Boolean(fighter && fighter.vy > 0);
        const vyClamp = fighter ? Math.max(-1.0, Math.min(1.0, fighter.vy * 0.08)) : 0;

        sp.applyPoseMode('idle', time);
        rig.hips.position.y = baseHipsY + 0.16;

        if (isRising) {
            // Phase ascendante : cabré puissant, pattes avant repliées, collerette haute
            pRig.rootJoint.position.set(0, 1.76, 0);
            pRig.rootJoint.rotation.set(-0.24 - vyClamp * 0.12, 0, 0);

            pRig.neckSegments.forEach((seg, i) => {
                seg.rotation.set(-0.06 - i * 0.02, 0, 0);
            });
            pRig.setHeadRot(-0.22, 0, 0);
            pRig.setJawRot(0.28);

            pRig.setForelimbPose(pRig.leftFrontLeg, -0.35, 0.65, -0.35, 0.10, 0.07);
            pRig.setForelimbPose(pRig.rightFrontLeg, -0.28, 0.60, -0.32, 0.10, 0.07);
            pRig.setHindlimbPose(pRig.leftHindLeg, -0.45, -0.25, 0.35, 0, 0.05);
            pRig.setHindlimbPose(pRig.rightHindLeg, -0.38, -0.22, 0.32, 0, 0.05);

            pRig.caudalSegments.forEach((seg, i) => {
                seg.rotation.set(-0.06 - i * 0.015, 0, 0);
            });
        } else {
            // Phase descendante : inclinaison vers le sol, pattes avant tendues pour amortir les 4 tonnes
            pRig.rootJoint.position.set(0, 1.62, 0);
            pRig.rootJoint.rotation.set(0.20 - vyClamp * 0.10, 0, 0);

            pRig.neckSegments.forEach((seg, i) => {
                seg.rotation.set(0.05 + i * 0.015, 0, 0);
            });
            pRig.setHeadRot(0.24, 0, 0);
            pRig.setJawRot(0.14);

            pRig.setForelimbPose(pRig.leftFrontLeg, 0.32, -0.15, 0.22, 0.05, 0.06);
            pRig.setForelimbPose(pRig.rightFrontLeg, 0.26, -0.15, 0.22, 0.05, 0.06);
            pRig.setHindlimbPose(pRig.leftHindLeg, 0.25, 0.35, -0.18, 0.12, 0.05);
            pRig.setHindlimbPose(pRig.rightHindLeg, 0.18, 0.32, -0.16, 0.12, 0.05);

            pRig.caudalSegments.forEach((seg, i) => {
                seg.rotation.set(0.05 + i * 0.012, 0, 0);
            });
        }

        sp.updateAnatomicalSkin(time, fighter, 'idle');
    }
});
