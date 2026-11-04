// ============================================================================
// js/animations/megatherium/megatherium_attacking.js — Megatherium Attack Animations
// ============================================================================

registerFighterAnimation('giantsloth', {
    hasCustomDirectionals: true,

    animateAttack(ctx) {
        const { rig, act, swing, baseHipsY } = ctx;
        if (act === 'light') {
            rig.arms[0].rotation.z = -swing * 1.3;
            rig.arms[0].rotation.y = swing * 0.65;
            rig.torso.rotation.y = swing * 0.35;
        } else if (act === 'light2') {
            rig.arms[1].rotation.z = -swing * 1.3;
            rig.arms[1].rotation.y = -swing * 0.65;
            rig.torso.rotation.y = -swing * 0.35;
        } else if (act === 'fwd_light') {
            rig.hips.position.x = swing * 0.75;
            rig.arms[0].rotation.z = -swing * 1.2;
            rig.torso.rotation.z = -0.25;
        } else if (act === 'low_light' || act === 'low_heavy') {
            rig.hips.position.y = baseHipsY - swing * 0.4;
            rig.arms[0].rotation.z = -swing * 1.5;
            rig.torso.rotation.z = 0.25;
        } else if (act === 'anti_air' || act === 'up_light') {
            rig.arms[0].rotation.z = -swing * 1.8;
            rig.arms[1].rotation.z = -swing * 1.8;
            rig.torso.rotation.z = swing * 0.45;
        } else if (act === 'back_light') {
            rig.hips.position.x = -swing * 0.7;
            rig.arms[0].rotation.z = -swing * 1.1;
        } else if (act === 'air_light' || act === 'air_heavy') {
            rig.torso.rotation.z = -swing * 0.5;
            rig.arms[0].rotation.z = -swing * 1.6;
            rig.arms[1].rotation.z = -swing * 1.6;
        } else if (act === 'fwd_heavy') {
            rig.hips.position.x = swing * 1.1;
            rig.torso.rotation.z = -swing * 0.4;
            rig.arms[0].rotation.z = -swing * 1.5;
            rig.arms[1].rotation.z = -swing * 1.5;
        } else if (act === 'throw') {
            rig.arms[0].rotation.y = swing * 1.4;
            rig.arms[1].rotation.y = -swing * 1.4;
            rig.torso.rotation.z = swing * 0.35;
        } else if (act === 'throw_whiff') {
            rig.hips.position.x = swing * 0.35;
            rig.arms[0].rotation.y = swing * 0.6;
            rig.arms[1].rotation.y = -swing * 0.6;
        } else if (act === 'heavy') {
            rig.torso.rotation.z = -swing * 0.45;
            rig.arms[0].rotation.z = -swing * 1.45;
            rig.arms[1].rotation.z = -swing * 1.45;
        } else if (act === 'special') {
            rig.hips.position.y = baseHipsY + swing * 0.65;
            rig.torso.rotation.z = 0.35 - swing * 0.75;
        } else if (act === 'special2') {
            rig.arms[0].rotation.y = swing * 1.35;
            rig.arms[1].rotation.y = -swing * 1.35;
        }
    }
});
