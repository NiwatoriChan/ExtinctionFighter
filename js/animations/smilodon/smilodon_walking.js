// ============================================================================
// js/animations/smilodon/smilodon_walking.js — Smilodon Walk, Sprint & Dash Animations
// ============================================================================

registerFighterAnimation('smilodon', {
    animateWalk(ctx) {
        const { fighter, rig, baseHipsY, time } = ctx;
        const freq = 11;
        rig.hips.position.y = baseHipsY + Math.sin(time * freq) * 0.14;
        rig.torso.rotation.y = Math.sin(time * freq * 0.5) * 0.10;
        rig.torso.rotation.z = Math.sin(time * 2.8) * 0.04;
        rig.jaw.rotation.z = -0.08 - Math.abs(Math.sin(time * 3.2)) * 0.18;

        if (rig.legs && rig.legs.length >= 4) {
            const swingL = Math.sin(time * freq) * 0.55;
            rig.legs[0].rotation.z = swingL;
            rig.legs[3].rotation.z = swingL;
            rig.legs[1].rotation.z = -swingL;
            rig.legs[2].rotation.z = -swingL;
        }

        rig.tailSegments.forEach((seg, i) => {
            seg.rotation.y = Math.sin(time * 8 - i * 0.8) * 0.35;
        });

        // Inclinaison dynamique de course (Sprint Boost) ou recul prudent
        if (fighter && fighter.state === 'walk') {
            const moveDir = fighter.vx * fighter.facing;
            if (moveDir > 6.5) {
                rig.torso.rotation.z -= 0.22;
                rig.headGroup.rotation.z -= 0.10;
                rig.hips.position.y = baseHipsY * 0.90 + Math.abs(Math.sin(time * 14)) * 0.14;
            } else if (moveDir < -0.5) {
                rig.torso.rotation.z += 0.12;
                rig.headGroup.rotation.z -= 0.08;
            }
        }
    },

    animateDash(ctx) {
        const { rig, lunge, isBackDash, baseHipsY, time } = ctx;
        if (isBackDash) {
            rig.hips.position.y = baseHipsY * (0.82 + lunge * 0.28);
            rig.hips.position.x = -lunge * 0.45;
            rig.torso.rotation.z = 0.34;
            rig.headGroup.rotation.z = -0.22;
            rig.legs.forEach((leg, i) => {
                leg.rotation.z = (i % 2 === 0 ? -0.55 : 0.45) + lunge * (i % 2 === 0 ? 0.8 : -0.6);
            });
            rig.tailSegments.forEach((seg, i) => {
                seg.rotation.z = 0.25 + i * 0.06;
            });
        } else {
            rig.hips.position.y = baseHipsY * 0.68;
            rig.hips.position.x = lunge * 0.55;
            rig.torso.rotation.z = -0.52;
            rig.headGroup.rotation.z = 0.35;
            if (rig.jaw) rig.jaw.rotation.z = -0.35 * lunge;
            rig.legs.forEach((leg, i) => {
                leg.rotation.z = (i % 2 === 0 ? 1 : -1) * Math.sin(time * 28) * 0.95;
            });
            rig.tailSegments.forEach((seg) => {
                seg.rotation.z = 0.18;
            });
        }
    }
});
