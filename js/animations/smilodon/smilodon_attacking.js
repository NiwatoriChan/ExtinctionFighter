// ============================================================================
// js/animations/smilodon/smilodon_attacking.js — Smilodon Attack Animations
// ============================================================================

registerFighterAnimation('smilodon', {
    hasCustomDirectionals: true,

    animateAttack(ctx) {
        const { rig, act, swing, strike, baseHipsY } = ctx;
        const s = strike !== undefined ? strike : swing;

        if (act === 'light') {
            rig.torso.rotation.z = -s * 0.42;
            rig.torso.rotation.y = s * 0.25;
            if (rig.legs[0]) rig.legs[0].rotation.z = s * 1.35;
            rig.headGroup.rotation.z = -s * 0.35;
            rig.jaw.rotation.z = -s * 0.65;
        } else if (act === 'light2') {
            rig.torso.rotation.z = -s * 0.48;
            rig.torso.rotation.y = -s * 0.38;
            if (rig.legs[1]) rig.legs[1].rotation.z = s * 1.45;
            rig.headGroup.rotation.z = -s * 0.45;
            rig.jaw.rotation.z = -s * 0.95;
        } else if (act === 'fwd_light') {
            rig.hips.position.x = s * 0.95;
            rig.torso.rotation.z = -s * 0.45;
            if (rig.legs[0]) rig.legs[0].rotation.z = s * 1.5;
            rig.headGroup.rotation.z = -s * 0.4;
            rig.jaw.rotation.z = -s * 0.8;
        } else if (act === 'low_light' || act === 'low_heavy') {
            rig.hips.position.y = baseHipsY * 0.52;
            rig.torso.rotation.z = -0.32;
            if (rig.legs[0]) rig.legs[0].rotation.y = s * 1.25;
            rig.jaw.rotation.z = -s * 0.65;
        } else if (act === 'anti_air' || act === 'up_light') {
            rig.hips.position.y = baseHipsY + s * 1.05;
            rig.torso.rotation.z = s * 0.65;
            if (rig.legs[0]) rig.legs[0].rotation.z = s * 1.6;
            if (rig.legs[1]) rig.legs[1].rotation.z = s * 1.6;
            rig.headGroup.rotation.z = s * 0.65;
            rig.jaw.rotation.z = -s * 1.25;
        } else if (act === 'back_light') {
            rig.hips.position.x = -s * 0.75;
            rig.torso.rotation.z = s * 0.25;
            if (rig.legs[0]) rig.legs[0].rotation.z = s * 1.1;
        } else if (act === 'throw') {
            rig.hips.position.x = s * 0.9;
            rig.hips.position.y = baseHipsY * 0.65;
            rig.headGroup.rotation.z = 0.55 * s;
            rig.jaw.rotation.z = -1.15 * s;
        } else if (act === 'air_light' || act === 'air_heavy') {
            rig.torso.rotation.z = -s * 0.55;
            if (rig.legs[0]) rig.legs[0].rotation.z = s * 1.35;
            if (rig.legs[1]) rig.legs[1].rotation.z = s * 1.35;
            rig.jaw.rotation.z = -s * 0.95;
        } else if (act === 'heavy' || act === 'fwd_heavy') {
            rig.hips.position.y = baseHipsY + s * 0.55;
            rig.hips.position.x = s * (act === 'fwd_heavy' ? 1.2 : 0.6);
            rig.torso.rotation.z = s * 0.5;
            if (rig.legs[0]) rig.legs[0].rotation.z = s * 1.1;
            if (rig.legs[1]) rig.legs[1].rotation.z = s * 1.1;
            rig.jaw.rotation.z = -s * 0.95;
        } else if (act === 'special') {
            rig.hips.position.y = baseHipsY + s * 0.85;
            rig.torso.rotation.z = -0.2 + s * 0.4;
            if (rig.legs[0]) rig.legs[0].rotation.z = 0.9;
            if (rig.legs[1]) rig.legs[1].rotation.z = 0.9;
            rig.jaw.rotation.z = -1.0;
        } else if (act === 'special2') {
            rig.hips.position.x = s * 0.85;
            rig.headGroup.rotation.z = -0.4 + s * 0.8;
            rig.jaw.rotation.z = -1.25 * s;
        } else {
            rig.torso.rotation.z = s * 0.3;
        }
    }
});
