/* ============================================================================
 * ANIMATIONS T-REX : MARCHE (WALK), COURSE (SPRINT) & RUÉE (DASH)
 * Cinématique bipède théropode à 4 segments (fémur, tibia, métatarse, orteils),
 * transfert de masse pelvien, stabilisation cervicale en S et balancier caudal.
 * ============================================================================ */

registerFighterAnimation('trex', {
    animateWalk(ctx) {
        const { fighter, rig, baseHipsY, time, isMovingBackward } = ctx;
        const sp = rig.specialParts;
        const tRig = sp && sp.tRig;

        if (!sp || !tRig) return;

        const moveDir = fighter ? (fighter.vx * fighter.facing) : 4.0;
        const isSprint = !isMovingBackward && (moveDir > 6.2 || (fighter && (fighter.isSprinting || fighter.sprintDuration > 0.22)));
        const strideSpeed = isSprint ? 9.8 : 7.4;
        const strideAmp = isSprint ? 1.28 : 1.0;

        sp.applyPoseMode(isSprint ? 'sprint' : 'walk', time, {
            isSprint,
            strideSpeed,
            strideAmp
        });

        rig.hips.position.y = baseHipsY;

        if (isMovingBackward) {
            // Marche arrière prudente de prédateur : buste plus redressé, cou arqué en alerte
            tRig.rootJoint.rotation.x = -0.06;
            tRig.neckSegments.forEach((seg, i) => {
                seg.rotation.x += (i < 2 ? -0.05 : 0.03);
            });
            tRig.setHeadRot(0.22, 0, 0);
            tRig.setJawRot(0.18);
        }

        sp.updateAnatomicalSkin(time, fighter, isSprint ? 'sprint' : 'walk');
    },

    animateDash(ctx) {
        const { fighter, rig, lunge, isBackDash, baseHipsY, time } = ctx;
        const sp = rig.specialParts;
        const tRig = sp && sp.tRig;

        if (!sp || !tRig) return;

        rig.hips.position.y = baseHipsY;

        if (isBackDash) {
            // Esquive arrière explosive : flexion élastique des jarrets, buste cabré et grondement défensif
            sp.applyPoseMode('idle', time);
            rig.hips.position.x = -lunge * 0.48;
            tRig.rootJoint.position.y = 2.02 + lunge * 0.14;
            tRig.rootJoint.rotation.set(-0.24 * lunge, 0, 0);

            tRig.neckSegments.forEach((seg, i) => {
                seg.rotation.set((i < 2 ? -0.18 : 0.06) - lunge * 0.04, 0, 0);
            });
            tRig.setHeadRot(0.26 * lunge, 0, 0);
            tRig.setJawRot(0.32 * lunge);

            [tRig.leftArm, tRig.rightArm].forEach(arm => {
                tRig.setForelimbPose(arm, -0.18 * lunge, 0.12, 0.18, -0.10, -0.25);
            });

            tRig.setDigitigradeLegPose(tRig.leftLeg, -0.28 * lunge, 0.25 * lunge, -0.15 * lunge, 0.14 * lunge, -0.18, 0.04);
            tRig.setDigitigradeLegPose(tRig.rightLeg, 0.22 * lunge, 0.18 * lunge, -0.10 * lunge, 0.14 * lunge, -0.18, 0.04);

            tRig.caudalSegments.forEach((seg, i) => {
                seg.rotation.set(0.06 * lunge, Math.sin(time * 20 - i * 0.5) * 0.10, 0);
            });

            sp.updateAnatomicalSkin(time, fighter, 'idle');
            return;
        }

        // Ruée offensive vers l'avant : profil horizontal de chasseur, cou tendu en bélier, foulée explosive
        sp.applyPoseMode('sprint', time, {
            isSprint: true,
            strideSpeed: 14.5,
            strideAmp: 1.35
        });

        rig.hips.position.x = lunge * 0.58;
        tRig.rootJoint.position.y = 1.88;
        tRig.rootJoint.rotation.x = 0.34;

        tRig.neckSegments.forEach((seg, i) => {
            seg.rotation.set(i < 2 ? 0.02 : 0.06, 0, 0);
        });
        tRig.setHeadRot(-0.14, 0, 0);
        tRig.setJawRot(0.38 * lunge);

        [tRig.leftArm, tRig.rightArm].forEach(arm => {
            tRig.setForelimbPose(arm, 0.14 * lunge, 0.06, 0.24, 0.12, 0.45);
        });

        tRig.caudalSegments.forEach((seg, i) => {
            seg.rotation.set(-0.04, Math.sin(time * 22 - i * 0.45) * 0.12, 0);
        });

        sp.updateAnatomicalSkin(time, fighter, 'sprint');
    }
});
