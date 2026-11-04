// ============================================================================
// js/animations/spinosaurus/spinosaurus_attacking.js — Spinosaurus Attack Animations
// ============================================================================

registerFighterAnimation('spinosaurus', {
    hasCustomDirectionals: true,

    animateAttack(ctx) {
        const { rig, act, prog, swing, strike, baseHipsY } = ctx;
        const s = strike !== undefined ? strike : swing;

        if (act === 'light') {
            rig.arms[0].rotation.z = s * 1.35;
            rig.arms[1].rotation.z = -s * 0.45;
            rig.torso.rotation.y = s * 0.35;
            rig.jaw.rotation.z = -s * 0.45;
        } else if (act === 'light2') {
            rig.arms[0].rotation.z = -s * 0.45;
            rig.arms[1].rotation.z = s * 1.45;
            rig.torso.rotation.y = -s * 0.45;
            rig.jaw.rotation.z = -s * 0.85;
        } else if (act === 'fwd_light') {
            rig.hips.position.x = s * 0.95;
            rig.torso.rotation.z = -s * 0.40;
            rig.jaw.rotation.z = -s * 0.95;
            rig.arms[0].rotation.z = s * 1.1;
        } else if (act === 'low_light' || act === 'low_heavy') {
            rig.hips.position.y = (baseHipsY || 1.85) * 0.55;
            rig.torso.rotation.z = -0.32;
            rig.arms[0].rotation.y = s * 1.25;
            rig.jaw.rotation.z = -s * 0.65;
        } else if (act === 'anti_air' || act === 'up_light') {
            rig.hips.position.y = (baseHipsY || 1.85) + s * 0.75;
            rig.torso.rotation.z = s * 0.55;
            rig.arms[0].rotation.z = s * 1.6;
            rig.arms[1].rotation.z = s * 1.6;
            rig.jaw.rotation.z = -s * 1.15;
        } else if (act === 'back_light') {
            rig.hips.position.x = -s * 0.75;
            rig.arms[0].rotation.z = s * 1.1;
            rig.jaw.rotation.z = -s * 0.65;
        } else if (act === 'throw') {
            rig.hips.position.x = s * 0.85;
            rig.torso.rotation.y = Math.sin(prog * 24) * 0.45;
            rig.jaw.rotation.z = prog < 0.35 ? -1.2 : -0.25;
        } else if (act === 'air_light' || act === 'air_heavy') {
            rig.torso.rotation.z = -s * 0.6;
            rig.arms[0].rotation.z = s * 1.5;
            rig.arms[1].rotation.z = s * 1.5;
            rig.jaw.rotation.z = -s * 0.95;
        } else if (act === 'heavy' || act === 'fwd_heavy') {
            rig.hips.position.x = s * (act === 'fwd_heavy' ? 1.25 : 0.6);
            rig.torso.rotation.z = -s * 0.35;
            rig.arms[0].rotation.z = s * 1.45;
            rig.arms[1].rotation.z = s * 1.45;
            rig.jaw.rotation.z = -s * 0.65;
        } else if (act === 'special' || act === 'special2') {
            rig.hips.rotation.y = prog * Math.PI * 2;
        }
    }
});
