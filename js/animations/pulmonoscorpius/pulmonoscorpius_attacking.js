// ============================================================================
// js/animations/pulmonoscorpius/pulmonoscorpius_attacking.js — Pulmonoscorpius Attack Animations
// ============================================================================

registerFighterAnimation('pulmonoscorpius', {
    hasCustomDirectionals: true,

    animateAttack(ctx) {
        const { rig, act, prog, swing, strike, baseHipsY } = ctx;
        const s = strike !== undefined ? strike : swing;

        if (act === 'light') {
            rig.arms[0].rotation.y = 0.3 + s * 1.15;
            rig.arms[1].rotation.y = -0.3 - s * 0.35;
        } else if (act === 'light2') {
            rig.arms[0].rotation.y = 0.2 - s * 0.35;
            rig.arms[1].rotation.y = -0.3 - s * 1.25;
            rig.tailSegments.forEach(seg => { seg.rotation.z = -s * 0.4; });
        } else if (act === 'fwd_light') {
            rig.hips.position.x = s * 0.95;
            rig.arms[0].rotation.y = s * 1.3;
            rig.arms[1].rotation.y = -s * 1.3;
        } else if (act === 'low_light' || act === 'low_heavy') {
            rig.hips.position.y = (baseHipsY || 0.95) * 0.55;
            rig.arms[0].rotation.x = -s * 0.65;
            rig.arms[1].rotation.x = -s * 0.65;
        } else if (act === 'anti_air' || act === 'up_light') {
            rig.hips.position.y = (baseHipsY || 0.95) + s * 0.45;
            rig.tailSegments.forEach(seg => { seg.rotation.z = s * 0.85; });
            if (rig.specialParts.stinger) rig.specialParts.stinger.rotation.z = s * 1.8;
            rig.arms[0].rotation.z = s * 1.2;
            rig.arms[1].rotation.z = -s * 1.2;
        } else if (act === 'back_light') {
            rig.hips.position.x = -s * 0.7;
            rig.arms[0].rotation.y = s * 1.1;
            rig.arms[1].rotation.y = -s * 1.1;
        } else if (act === 'throw') {
            rig.hips.position.x = s * 0.85;
            rig.arms[0].rotation.y = 1.2;
            rig.arms[1].rotation.y = -1.2;
            if (rig.specialParts.stinger) rig.specialParts.stinger.rotation.z = Math.sin(prog * 20) * 1.2;
        } else if (act === 'air_light' || act === 'air_heavy') {
            rig.torso.rotation.z = -s * 0.55;
            rig.arms[0].rotation.y = s * 1.35;
            rig.arms[1].rotation.y = -s * 1.35;
            rig.tailSegments.forEach(seg => { seg.rotation.z = -s * 0.75; });
        } else if (act === 'heavy' || act === 'fwd_heavy') {
            rig.hips.position.x = s * (act === 'fwd_heavy' ? 1.2 : 0.6);
            rig.arms[0].rotation.y = s * 1.45;
            rig.arms[1].rotation.y = -s * 1.45;
        } else if (act === 'special') {
            rig.tailSegments.forEach(seg => { seg.rotation.z = -s * 0.85; });
            if (rig.specialParts.stinger) rig.specialParts.stinger.rotation.z = s * 1.45;
        } else if (act === 'special2') {
            rig.torso.rotation.y = Math.sin(prog * Math.PI * 2) * 0.45;
            rig.tailSegments.forEach(seg => { seg.rotation.z = -0.7; });
        }
    }
});
