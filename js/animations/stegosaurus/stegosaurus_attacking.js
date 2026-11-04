// ============================================================================
// js/animations/stegosaurus/stegosaurus_attacking.js — Stegosaurus Attack Animations
// ============================================================================

registerFighterAnimation('stegosaurus', {
    hasCustomDirectionals: true,

    animateAttack(ctx) {
        const { rig, act, prog, swing, strike, baseHipsY } = ctx;
        const s = strike !== undefined ? strike : swing;
        if (act === 'light') {
            rig.torso.rotation.y = swing * 0.55;
            rig.headGroup.rotation.y = swing * 0.65;
        } else if (act === 'light2') {
            rig.torso.rotation.y = -swing * 0.55;
            rig.headGroup.rotation.y = -swing * 0.65;
        } else if (act === 'fwd_light') {
            rig.hips.position.x = swing * 0.7;
            rig.torso.rotation.z = -swing * 0.25;
            rig.headGroup.rotation.z = -0.3;
        } else if (act === 'low_light' || act === 'low_heavy') {
            rig.hips.rotation.y = -swing * 1.5;
            rig.hips.position.y = baseHipsY - swing * 0.25;
            rig.tailSegments.forEach(seg => {
                seg.rotation.y = -swing * 0.7;
                seg.rotation.z = -0.25;
            });
        } else if (act === 'anti_air' || act === 'up_light') {
            rig.hips.rotation.z = swing * 0.45;
            rig.tailSegments.forEach(seg => {
                seg.rotation.z = swing * 0.9;
                seg.rotation.y = Math.sin(prog * Math.PI) * 0.35;
            });
        } else if (act === 'back_light') {
            rig.hips.position.x = -s * 0.65;
            rig.hips.rotation.y = -s * 0.9;
            rig.tailSegments.forEach(seg => { seg.rotation.y = -s * 0.6; });
        } else if (act === 'air_light' || act === 'air_heavy') {
            rig.hips.rotation.z = prog * Math.PI * 2;
            rig.tailSegments.forEach(seg => { seg.rotation.z = 0.6; });
        } else if (act === 'fwd_heavy') {
            rig.hips.position.x = swing * 1.1;
            rig.torso.rotation.z = -swing * 0.4;
            rig.hips.rotation.y = -swing * 1.2;
            rig.tailSegments.forEach(seg => { seg.rotation.y = -swing * 0.5; });
        } else if (act === 'throw') {
            rig.hips.rotation.y = -swing * 1.7;
            rig.tailSegments.forEach(seg => { seg.rotation.z = swing * 0.85; });
        } else if (act === 'throw_whiff') {
            rig.hips.position.x = swing * 0.4;
            rig.hips.rotation.y = -swing * 0.6;
        } else if (act === 'heavy' || act === 'special') {
            rig.hips.rotation.y = -swing * 1.95;
            rig.tailSegments.forEach(seg => { seg.rotation.y = -swing * 0.65; });
        } else if (act === 'special2') {
            rig.torso.rotation.z = Math.sin(prog * Math.PI * 6) * 0.15;
        }
    }
});
