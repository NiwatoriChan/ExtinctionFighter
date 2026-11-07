/* ============================================================================
 * ANIMATIONS PACHYRHINOSAURE : FATALITÉ 3D (IMPACT CRÂNIEN POLAIRE)
 * Acte 1 : Grattage furieux du sol au sabot antérieur & présentation des ocelles
 * Acte 2 : Charge polaire supersonique bosse nasale verrouillée en bélier
 * Acte 3 : Pulvérisation ascendante et rugissement de triomphe cabré
 * ============================================================================ */

registerFighterAnimation('pachyrhino', {
    animateFatality(ctx) {
        const { fighter, rig, prog, baseHipsY, time } = ctx;
        const sp = rig.specialParts;
        const pRig = sp && sp.pRig;

        if (!sp || !pRig) return;

        rig.torso.rotation.set(0, 0, 0);
        rig.neck.rotation.set(0, 0, 0);
        rig.legs.forEach(l => { if (l) l.rotation.set(0, 0, 0); });
        rig.tailSegments.forEach(s => { if (s) s.rotation.set(0, 0, 0); });
        rig.hips.position.y = baseHipsY || 1.65;

        if (prog < 0.35) {
            // Acte 1 : Recul d'armement, patte avant qui gratte furieusement la terre, tête baissée en bélier
            const p = prog / 0.35;
            sp.applyPoseMode('crouch', time);
            rig.hips.position.x = -1.2 * p;

            const pawCycle = Math.sin(prog * 48);
            pRig.rootJoint.position.set(0, 1.36, 0);
            pRig.rootJoint.rotation.set(0.22, Math.sin(prog * 24) * 0.05, 0);

            pRig.neckSegments.forEach((seg, i) => {
                seg.rotation.set(0.08 + i * 0.025, 0, 0);
            });
            pRig.setHeadRot(0.44, Math.sin(prog * 24) * 0.08, 0);
            pRig.setJawRot(0.32 + Math.abs(pawCycle) * 0.25);

            // La patte avant droite gratte le sol avant la charge
            pRig.setForelimbPose(pRig.rightFrontLeg, pawCycle * 0.55, Math.max(0, pawCycle) * 0.65, -0.25, 0.28, 0.06);
            pRig.setForelimbPose(pRig.leftFrontLeg, 0.12, 0.18, -0.10, 0.28, 0.06);

            sp.updateAnatomicalSkin(time, fighter, 'crouch');

        } else if (prog < 0.65) {
            // Acte 2 : Charge polaire foudroyante à travers l'arène
            const p = (prog - 0.35) / 0.30;
            sp.applyPoseMode('sprint', time, { isSprint: true, strideSpeed: 22.0, strideAmp: 1.45 });
            rig.hips.position.x = -1.2 + p * 3.0;

            pRig.rootJoint.position.set(0, 1.38, 0.18);
            pRig.rootJoint.rotation.set(0.28, 0, 0);

            pRig.neckSegments.forEach((seg, i) => {
                seg.rotation.set(0.10 + i * 0.03, 0, 0);
            });
            pRig.setHeadRot(0.48, 0, 0);
            pRig.setJawRot(0.42);

            sp.updateAnatomicalSkin(time, fighter, 'sprint');

        } else {
            // Acte 3 : Impact cataclysmique, projection vers le ciel et cabré de triomphe cératopsien
            const p = (prog - 0.65) / 0.35;
            sp.applyPoseMode('display', time);
            rig.hips.position.x = 1.8;

            const rearLift = Math.sin(Math.min(1, p * 1.4) * Math.PI * 0.5);
            pRig.rootJoint.position.set(0, 1.72 + rearLift * 0.22, 0);
            pRig.rootJoint.rotation.set(-0.32 * rearLift, 0, 0);

            pRig.neckSegments.forEach((seg, i) => {
                seg.rotation.set(-0.12 - i * 0.035, 0, 0);
            });
            pRig.setHeadRot(-0.74 * rearLift, Math.sin(time * 12) * 0.12, 0);
            pRig.setJawRot(0.72);

            pRig.setForelimbPose(pRig.leftFrontLeg, -0.42 * rearLift, 0.55, -0.25, 0, 0.08);
            pRig.setForelimbPose(pRig.rightFrontLeg, -0.32 * rearLift, 0.48, -0.22, 0, 0.08);

            sp.updateAnatomicalSkin(time, fighter, 'display');
        }
    },

    executeFatality(winner, loser) {
        setTimeout(() => {
            if (matchState !== 'fatality_anim') return;
            sfx.playRoar(85, 0.5);
            spawnFloatingPopup(winner.x, 'CHARGE POLAIRE !', '#38bdf8');
        }, 800);
        setTimeout(() => {
            if (matchState !== 'fatality_anim') return;
            sfx.playBoneCrack();
            loser.vx = winner.facing * 14;
            loser.vy = 9;
            loser.decapitated = true;
            loser.isDead = true;
            loser.hp = 0;
            spawn3DBloodAndBones(loser.x, 2.2, 70, true);
            screenShake = 0.95;
            showAnnouncer('FATALITY !', 'PACHYRHINOSAURE PULVÉRISE L’ENNEMI');
        }, 1850);
    }
});
