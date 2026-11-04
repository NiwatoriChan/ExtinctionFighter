// ============================================================================
// js/animations/postosuchus/postosuchus_attacking.js — Postosuchus Attack Animations
// ============================================================================

registerFighterAnimation('postosuchus', {
    hasCustomDirectionals: true,

    animateAttack(ctx) {
        const { rig, act, prog, swing, strike, baseHipsY } = ctx;
        const s = strike !== undefined ? strike : swing;
        if (act === 'light') {
            rig.hips.rotation.z = swing * 0.45;
            rig.headGroup.rotation.z = -swing * 0.4;
            rig.jaw.rotation.z = -swing * 0.75;
        } else if (act === 'light2') {
            rig.torso.rotation.y = swing * 0.45;
            rig.headGroup.rotation.z = -swing * 0.45;
            rig.jaw.rotation.z = -swing * 0.85;
        } else if (act === 'fwd_light') {
            rig.hips.position.x = swing * 0.85;
            rig.hips.rotation.z = swing * 0.3;
            rig.headGroup.rotation.z = -swing * 0.35;
            rig.jaw.rotation.z = -swing * 0.8;
        } else if (act === 'low_light' || act === 'low_heavy') {
            rig.hips.position.y = baseHipsY - swing * 0.35;
            rig.headGroup.rotation.z = -0.45;
            rig.jaw.rotation.z = -swing * 0.7;
            rig.tailSegments.forEach(seg => { seg.rotation.y = -swing * 0.8; });
        } else if (act === 'anti_air' || act === 'up_light') {
            rig.hips.rotation.z = swing * 0.75;
            rig.headGroup.rotation.z = swing * 0.6;
            rig.jaw.rotation.z = -swing * 1.1;
        } else if (act === 'back_light') {
            rig.hips.position.x = -s * 0.75;
            rig.jaw.rotation.z = -s * 0.75;
        } else if (act === 'air_light' || act === 'air_heavy') {
            rig.torso.rotation.z = -swing * 0.6;
            rig.jaw.rotation.z = -swing * 0.9;
        } else if (act === 'fwd_heavy') {
            rig.hips.position.x = swing * 1.15;
            rig.hips.rotation.z = swing * 0.4;
            rig.jaw.rotation.z = -swing * 1.0;
        } else if (act === 'throw') {
            rig.jaw.rotation.z = -0.9;
            rig.torso.rotation.y = swing * 1.5;
            rig.headGroup.rotation.y = swing * 1.2;
        } else if (act === 'throw_whiff') {
            rig.hips.position.x = swing * 0.4;
            rig.jaw.rotation.z = -0.4;
        } else if (act === 'heavy' || act === 'special') {
            rig.hips.position.y = baseHipsY + swing * 0.65;
            rig.torso.rotation.x = prog * Math.PI * 4;
            rig.jaw.rotation.z = -0.5;
        } else if (act === 'special2') {
            rig.hips.position.x = swing * 0.9;
            rig.jaw.rotation.z = -0.8;
        }
    }
});
