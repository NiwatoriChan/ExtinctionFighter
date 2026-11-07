/* ============================================================================
 * ANIMATIONS PACHYRHINOSAURE : MARCHE (WALK), COURSE (SPRINT) & RUÉE (DASH)
 * Allure diagonale quadrupède lourde, galop de charge boréale tête baissée
 * exposant la bosse nasale pachyostotique, et ruée en bouclier blindé.
 * ============================================================================ */

registerFighterAnimation('pachyrhino', {
    animateWalk(ctx) {
        const { fighter, rig, baseHipsY, time, isMovingBackward } = ctx;
        const sp = rig.specialParts;
        const pRig = sp && sp.pRig;

        if (!sp || !pRig) return;

        const isSprint = Boolean(fighter && (fighter.isSprinting || fighter.sprintDuration > 0.22));
        const sprintBoost = isSprint ? Math.min(1.0, (fighter.sprintDuration || 0.35) * 1.8) : 0;
        const dirSign = isMovingBackward ? -1 : 1;

        rig.hips.position.y = baseHipsY;

        sp.applyPoseMode(isSprint ? 'sprint' : 'walk', time * dirSign, {
            isSprint,
            strideSpeed: isSprint ? 12.6 + sprintBoost * 2.2 : (isMovingBackward ? 7.8 : 9.2),
            strideAmp: isSprint ? 1.18 + sprintBoost * 0.22 : (isMovingBackward ? 0.85 : 1.0)
        });

        if (isMovingBackward && !isSprint) {
            // Marche arrière défensive : collerette relevée en bouclier frontal
            pRig.rootJoint.rotation.x -= 0.08;
            pRig.setHeadRot(0.18, 0, 0);
        }

        sp.updateAnatomicalSkin(time, fighter, isSprint ? 'sprint' : 'walk');
    },

    animateDash(ctx) {
        const { fighter, rig, lunge, isBackDash, baseHipsY, time } = ctx;
        const sp = rig.specialParts;
        const pRig = sp && sp.pRig;

        if (!sp || !pRig) return;

        rig.torso.rotation.set(0, 0, 0);
        rig.neck.rotation.set(0, 0, 0);
        rig.legs.forEach(l => { if (l) l.rotation.set(0, 0, 0); });
        rig.tailSegments.forEach(s => { if (s) s.rotation.set(0, 0, 0); });

        if (isBackDash) {
            // Ruée arrière défensive : répulsion des membres antérieurs et collerette dressée en rempart
            sp.applyPoseMode('crouch', time);
            rig.hips.position.x = -lunge * 0.42;
            rig.hips.position.y = baseHipsY;

            pRig.rootJoint.position.set(0, 1.48 + lunge * 0.14, -lunge * 0.16);
            pRig.rootJoint.rotation.set(-0.16 * lunge, 0, 0);

            pRig.neckSegments.forEach((seg, i) => {
                seg.rotation.set(0.06 + i * 0.02, 0, 0);
            });
            pRig.setHeadRot(0.28 * lunge, 0, 0);
            pRig.setJawRot(0.12 * lunge);

            pRig.setForelimbPose(pRig.leftFrontLeg, 0.38 * lunge, 0.22, -0.15, 0.22, 0.06);
            pRig.setForelimbPose(pRig.rightFrontLeg, 0.24 * lunge, 0.18, -0.12, 0.22, 0.06);
            pRig.setHindlimbPose(pRig.leftHindLeg, -0.35 * lunge, 0.28, -0.18, 0.25, 0.05);
            pRig.setHindlimbPose(pRig.rightHindLeg, -0.22 * lunge, 0.22, -0.14, 0.25, 0.05);

            pRig.caudalSegments.forEach((seg, i) => {
                seg.rotation.set(0.06, Math.sin(time * 22 - i * 0.5) * 0.14, 0);
            });

            sp.updateAnatomicalSkin(time, fighter, 'crouch');
            return;
        }

        // Ruée avant explosive (Coup de Bélier Boréal) : bosse nasale projetée en avant
        sp.applyPoseMode('sprint', time, { isSprint: true, strideSpeed: 18.0, strideAmp: 1.35 });
        rig.hips.position.x = lunge * 0.55;
        rig.hips.position.y = baseHipsY;

        pRig.rootJoint.position.set(0, 1.38, lunge * 0.22);
        pRig.rootJoint.rotation.set(0.26 * lunge, 0, 0);

        pRig.neckSegments.forEach((seg, i) => {
            seg.rotation.set(0.08 + i * 0.025, 0, 0);
        });
        pRig.setHeadRot(0.38 * lunge, 0, 0);
        pRig.setJawRot(0.32 * lunge);

        const galop = Math.sin(time * 26);
        pRig.setForelimbPose(pRig.leftFrontLeg, -0.48 * galop, 0.35, -0.20, 0.20, 0.06);
        pRig.setForelimbPose(pRig.rightFrontLeg, 0.48 * galop, 0.35, -0.20, 0.20, 0.06);
        pRig.setHindlimbPose(pRig.leftHindLeg, 0.52 * galop, 0.38, -0.22, 0.18, 0.05);
        pRig.setHindlimbPose(pRig.rightHindLeg, -0.52 * galop, 0.38, -0.22, 0.18, 0.05);

        pRig.caudalSegments.forEach((seg, i) => {
            seg.rotation.set(-0.06, Math.sin(time * 20 - i * 0.5) * 0.18, 0);
        });

        sp.updateAnatomicalSkin(time, fighter, 'sprint');
    }
});
