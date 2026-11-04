/* ============================================================================
 * ANIMATIONS T-REX : FATALITÉ 3D (DÉVORATION ROYALE)
 * Acte 1 : Plongeon maxillaire et saisie broyeuse.
 * Acte 2 : Secousse cervicale frénétique arrachant la tête de la proie.
 * Acte 3 : Engloutissement royal tête rejetée vers le ciel et rugissement final.
 * ============================================================================ */

registerFighterAnimation('trex', {
    animateFatality(ctx) {
        const { fighter, rig, prog, baseHipsY, time } = ctx;
        const sp = rig.specialParts;
        const tRig = sp && sp.tRig;

        if (!sp || !tRig) return;

        rig.hips.position.y = baseHipsY;
        sp.applyPoseMode('idle', time || (prog * 6.0));

        if (prog < 0.30) {
            // Acte 1 : Fente plongeante et morsure royale sur la victime
            const p = prog / 0.30;
            const plunge = Math.sin(p * Math.PI * 0.5);
            rig.hips.position.x = plunge * 0.85;
            tRig.rootJoint.position.y = 2.02 - plunge * 0.24;
            tRig.rootJoint.rotation.set(0.36 * plunge, 0, 0);

            tRig.neckSegments.forEach((seg, i) => {
                seg.rotation.set((i < 2 ? 0.04 : 0.10) * plunge, 0, 0);
            });
            tRig.setHeadRot(0.28 * plunge, 0, 0);
            tRig.setJawRot(p < 0.7 ? Math.sin((p / 0.7) * Math.PI * 0.5) * 1.05 : 0.22);

            tRig.setDigitigradeLegPose(tRig.leftLeg, -0.38 * plunge, 0.32 * plunge, -0.20 * plunge, 0.18 * plunge, -0.22, 0.05);
            tRig.setDigitigradeLegPose(tRig.rightLeg, 0.30 * plunge, 0.12 * plunge, 0.22 * plunge, 0.18 * plunge, -0.18, 0.05);
            [tRig.leftArm, tRig.rightArm].forEach(arm => {
                tRig.setForelimbPose(arm, -0.25 * plunge, 0.14, 0.25 * plunge, -0.15, -0.35 * plunge);
            });

        } else if (prog < 0.72) {
            // Acte 2 : Déchiquetage brutal de gauche à droite et arrachement de la tête
            const thrash = Math.sin(prog * 48);
            const pitchWhip = Math.cos(prog * 36);
            rig.hips.position.x = 0.78;
            tRig.rootJoint.position.y = 2.08;
            tRig.rootJoint.rotation.set(-0.18 + pitchWhip * 0.12, thrash * 0.36, thrash * 0.08);

            tRig.neckSegments.forEach((seg, i) => {
                seg.rotation.set((i < 2 ? -0.18 : 0.04) + pitchWhip * 0.04, thrash * 0.11, 0);
            });
            tRig.setHeadRot(-0.08 + pitchWhip * 0.28, thrash * 0.52, thrash * 0.32);
            tRig.setJawRot(0.24 + Math.abs(thrash) * 0.18);

            tRig.setDigitigradeLegPose(tRig.leftLeg, -0.22, 0.20, -0.14, 0.10, -0.24, 0.06);
            tRig.setDigitigradeLegPose(tRig.rightLeg, 0.22, 0.20, -0.14, 0.10, -0.24, 0.06);

            tRig.caudalSegments.forEach((seg, i) => {
                seg.rotation.set(0.04, -thrash * (0.14 + i * 0.03), 0);
            });

        } else {
            // Acte 3 : Tête rejetée vers le zénith, déglutition vorace et rugissement de triomphe
            const p = (prog - 0.72) / 0.28;
            const gulp = Math.abs(Math.sin(prog * 32));
            rig.hips.position.x = 0.78 * (1 - p * 0.5);
            tRig.rootJoint.position.y = 2.20;
            tRig.rootJoint.rotation.set(-0.36, 0, 0);

            tRig.neckSegments.forEach((seg, i) => {
                seg.rotation.set((i < 2 ? -0.26 : -0.08) - gulp * 0.03, 0, 0);
            });
            tRig.setHeadRot(-0.52 - gulp * 0.12, Math.sin(prog * 18) * 0.08, 0);
            tRig.setJawRot(0.28 + gulp * 0.58);

            tRig.setDigitigradeLegPose(tRig.leftLeg, 0.10, -0.08, 0.08, 0, -0.20, 0.05);
            tRig.setDigitigradeLegPose(tRig.rightLeg, -0.12, 0.08, -0.06, 0, -0.20, 0.05);

            tRig.caudalSegments.forEach((seg, i) => {
                seg.rotation.set(0.08 + i * 0.015, Math.sin(prog * 14 - i * 0.5) * 0.08, 0);
            });
        }

        sp.updateAnatomicalSkin(time || (prog * 6.0), fighter, 'display');
    },

    executeFatality(winner, loser) {
        setTimeout(() => {
            if (matchState !== 'fatality_anim') return;
            sfx.playBoneCrack();
            spawn3DBloodAndBones(loser.x, 2.5, 35, true);
            spawnFloatingPopup(loser.x, 'MÂCHOIRE ROYALE !', '#ef4444');
        }, 950);
        setTimeout(() => {
            if (matchState !== 'fatality_anim') return;
            sfx.playBoneCrack();
            sfx.playRoar(52, 0.9);
            loser.decapitated = true;
            loser.isDead = true;
            loser.hp = 0;
            spawn3DBloodAndBones(loser.x, 2.8, 65, true);
            screenShake = 0.9;
            showAnnouncer('FATALITY !', 'T-REX DÉVORE SA PROIE');
        }, 2200);
    }
});
