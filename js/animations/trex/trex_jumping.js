/* ============================================================================
 * ANIMATIONS T-REX : SAUT (JUMPING & AIRBORNE)
 * Propulsion digitigrade explosive en montée (extension fémur-tibia-métatarse)
 * et repli amortisseur griffes déployées en descente.
 * ============================================================================ */

registerFighterAnimation('trex', {
    animateJump(ctx) {
        const { fighter, rig, baseHipsY, time } = ctx;
        const sp = rig.specialParts;
        const tRig = sp && sp.tRig;

        if (!sp || !tRig) return;

        const vy = fighter ? (fighter.vy || 0) : 0;
        const isRising = vy > 0;
        const airTilt = Math.max(-0.38, Math.min(0.38, vy * 0.025));

        rig.hips.position.y = baseHipsY + 0.14;
        sp.applyPoseMode('idle', time);

        if (isRising) {
            // Phase ascendante : détente puissante des membres postérieurs, buste cabré vers le haut
            tRig.rootJoint.position.y = 2.18;
            tRig.rootJoint.rotation.set(-0.22 - airTilt * 0.35, 0, 0);

            tRig.neckSegments.forEach((seg, i) => {
                seg.rotation.set(i < 2 ? -0.18 : 0.04, 0, 0);
            });
            tRig.setHeadRot(-0.12, 0, 0);
            tRig.setJawRot(0.36);

            // Une jambe en poussée complète vers l'arrière, l'autre genou relevé
            tRig.setDigitigradeLegPose(tRig.leftLeg, -0.35, 0.55, -0.35, 0, 0.35, 0.04);
            tRig.setDigitigradeLegPose(tRig.rightLeg, 0.42, -0.38, 0.48, 0, 0.45, 0.04);
            [tRig.leftArm, tRig.rightArm].forEach(arm => {
                tRig.setForelimbPose(arm, -0.22, 0.14, 0.25, -0.15, -0.30);
            });

            tRig.caudalSegments.forEach((seg, i) => {
                seg.rotation.set(0.08 + i * 0.02, Math.sin(time * 8 - i * 0.5) * 0.05, 0);
            });
        } else {
            // Phase descendante : jambes ramenées vers l'avant, orteils écartés prêts à encaisser l'impact
            tRig.rootJoint.position.y = 2.04;
            tRig.rootJoint.rotation.set(0.16 - airTilt * 0.25, 0, 0);

            tRig.neckSegments.forEach((seg, i) => {
                seg.rotation.set(i < 2 ? -0.10 : 0.08, 0, 0);
            });
            tRig.setHeadRot(0.24, 0, 0);
            tRig.setJawRot(0.22);

            tRig.setDigitigradeLegPose(tRig.leftLeg, -0.25, 0.35, -0.25, 0.15, -0.22, 0.05);
            tRig.setDigitigradeLegPose(tRig.rightLeg, 0.12, 0.22, -0.18, 0.15, -0.22, 0.05);
            [tRig.leftArm, tRig.rightArm].forEach(arm => {
                tRig.setForelimbPose(arm, -0.10, 0.10, 0.12, 0.10, 0.45);
            });

            tRig.caudalSegments.forEach((seg, i) => {
                seg.rotation.set(-0.06 - i * 0.015, Math.sin(time * 8 - i * 0.5) * 0.06, 0);
            });
        }

        sp.updateAnatomicalSkin(time, fighter, 'idle');
    }
});
