/* ============================================================================
 * ANIMATIONS MAIASAURA : MARCHE (WALK), COURSE (SPRINT) & RUÉE (DASH)
 * ============================================================================ */

registerFighterAnimation('maiasaura', {
    animateWalk(ctx) {
        const { fighter, rig, baseHipsY, time, isMovingBackward } = ctx;
        const freq = 14;
        rig.hips.position.y = baseHipsY + Math.abs(Math.sin(time * freq)) * 0.28;
        rig.neck.rotation.z = Math.sin(time * freq) * 0.1;
        rig.legs[0].rotation.z = Math.sin(time * freq) * 0.62;
        rig.legs[1].rotation.z = -Math.sin(time * freq) * 0.62;
        rig.tailSegments.forEach((seg, i) => {
            seg.rotation.y = Math.sin(time * 5 - i * 0.5) * 0.18;
        });

        if (fighter && (fighter.isSprinting || fighter.sprintDuration > 0.25)) {
            const sprintBoost = Math.min(1.0, fighter.sprintDuration * 1.8);
            rig.torso.rotation.z -= 0.18 * sprintBoost;
            rig.neck.rotation.z -= 0.14 * sprintBoost;
            rig.headGroup.rotation.z += 0.16 * sprintBoost;
        } else if (isMovingBackward) {
            rig.torso.rotation.z += 0.08;
            rig.neck.rotation.z += 0.05;
        }
    },

    animateDash(ctx) {
        const { rig, lunge, isBackDash, baseHipsY, time } = ctx;
        if (isBackDash) {
            rig.hips.position.y = baseHipsY * (0.84 + lunge * 0.22);
            rig.hips.position.x = -lunge * 0.35;
            rig.torso.rotation.z = 0.26;
            rig.neck.rotation.z = 0.18;
            rig.headGroup.rotation.z = -0.12;
            rig.jaw.rotation.z = 0;
            if (rig.arms && rig.arms.length >= 2) {
                rig.arms[0].rotation.z = 0.45;
                rig.arms[1].rotation.z = 0.45;
                rig.arms[0].rotation.y = 0.22;
                rig.arms[1].rotation.y = -0.22;
            }
            if (rig.legs) {
                if (rig.legs[0]) rig.legs[0].rotation.z = -0.45 + lunge * 0.65;
                if (rig.legs[1]) rig.legs[1].rotation.z = 0.35 - lunge * 0.55;
            }
            rig.tailSegments.forEach((s, i) => {
                s.rotation.z = -0.22;
                s.rotation.y = Math.sin(time * 24 - i * 0.5) * 0.18;
            });
            return;
        }

        rig.hips.position.y = baseHipsY * 0.74;
        rig.hips.position.x = lunge * 0.45;
        rig.torso.rotation.z = -0.48;
        rig.neck.rotation.z = -0.28;
        rig.headGroup.rotation.z = -0.18;
        rig.jaw.rotation.z = -0.35;
        if (rig.arms && rig.arms.length >= 2) {
            rig.arms[0].rotation.z = -1.25;
            rig.arms[1].rotation.z = -1.25;
            rig.arms[0].rotation.y = 0.28;
            rig.arms[1].rotation.y = -0.28;
        }
        if (rig.legs) {
            if (rig.legs[0]) rig.legs[0].rotation.z = 1.05 * Math.sin(time * 28);
            if (rig.legs[1]) rig.legs[1].rotation.z = -1.05 * Math.sin(time * 28);
        }
        rig.tailSegments.forEach((s, i) => {
            s.rotation.z = 0.18;
            s.rotation.y = Math.sin(time * 22 - i * 0.5) * 0.22;
        });
    }
});
