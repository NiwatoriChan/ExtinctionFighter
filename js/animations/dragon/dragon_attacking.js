// ============================================================================
// js/animations/dragon/dragon_attacking.js — Dragon Attack Animations
// ============================================================================

registerFighterAnimation('dragon', {
    hasCustomDirectionals: true,

    animateAttack(ctx) {
        const { rig, act, swing, strike, prog, baseHipsY } = ctx;
        const s = strike !== undefined ? strike : swing;

        if (rig.specialParts.leftWing) rig.specialParts.leftWing.rotation.x = -0.7 - swing * 0.6;
        if (rig.specialParts.rightWing) rig.specialParts.rightWing.rotation.x = 0.7 + swing * 0.6;

        if (act === 'light') {
            rig.torso.rotation.z = -swing * 0.4;
            if (rig.arms[0]) rig.arms[0].rotation.z = swing * 1.25;
            rig.jaw.rotation.z = -swing * 0.65;
        } else if (act === 'light2') {
            rig.torso.rotation.z = swing * 0.4;
            if (rig.arms[1]) rig.arms[1].rotation.z = swing * 1.25;
            rig.jaw.rotation.z = -swing * 0.7;
        } else if (act === 'fwd_light') {
            rig.hips.position.x = swing * 0.9;
            rig.headGroup.rotation.z = -swing * 0.45;
            rig.jaw.rotation.z = -swing * 0.55;
        } else if (act === 'low_light' || act === 'low_heavy') {
            rig.hips.position.y = baseHipsY - swing * 0.35;
            rig.tailSegments.forEach(seg => { seg.rotation.y = -swing * 0.85; });
        } else if (act === 'anti_air' || act === 'up_light') {
            rig.torso.rotation.z = swing * 0.6;
            rig.headGroup.rotation.z = swing * 0.7;
            rig.jaw.rotation.z = -swing * 1.0;
            if (rig.arms[0]) rig.arms[0].rotation.z = -swing * 1.5;
        } else if (act === 'back_light') {
            rig.hips.position.x = -s * 0.8;
            if (rig.arms[0]) rig.arms[0].rotation.z = s * 1.1;
        } else if (act === 'air_light' || act === 'air_heavy') {
            rig.torso.rotation.z = -swing * 0.7;
            rig.legs.forEach(l => { l.rotation.z = swing * 1.1; });
        } else if (act === 'fwd_heavy') {
            rig.hips.position.x = swing * 1.2;
            rig.torso.rotation.z = -swing * 0.5;
            if (rig.arms[0]) rig.arms[0].rotation.z = swing * 1.4;
            if (rig.arms[1]) rig.arms[1].rotation.z = swing * 1.4;
        } else if (act === 'throw') {
            if (rig.specialParts.leftWing) rig.specialParts.leftWing.rotation.x = 0.5;
            if (rig.specialParts.rightWing) rig.specialParts.rightWing.rotation.x = -0.5;
            rig.jaw.rotation.z = -0.85;
        } else if (act === 'throw_whiff') {
            rig.hips.position.x = swing * 0.4;
            rig.jaw.rotation.z = -0.3;
        } else if (act === 'heavy') {
            rig.hips.rotation.y = prog * Math.PI * 2;
            rig.tailSegments.forEach(seg => { seg.rotation.y = 0.45; });
        } else if (act === 'special' || act === 'special2') {
            rig.torso.rotation.z = swing * 0.4;
            rig.headGroup.rotation.z = -0.3 + swing * 0.7;
            rig.jaw.rotation.z = -0.85;
        } else {
            rig.torso.rotation.z = swing * 0.3;
        }
    }
});
