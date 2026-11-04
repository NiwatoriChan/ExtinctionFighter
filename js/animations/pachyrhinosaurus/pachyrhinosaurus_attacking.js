/* ============================================================================
 * ANIMATIONS PACHYRHINOSAURE : ATTAQUES, COMBOS & COUPS SPÉCIAUX
 * ============================================================================ */

registerFighterAnimation('pachyrhino', {
    hasCustomDirectionals: true,

    animateAttack(ctx) {
        const { rig, act, prog, swing, strike, baseHipsY } = ctx;
        const s = strike !== undefined ? strike : swing;

        if (act === 'light') {
            rig.headGroup.rotation.z = s * 0.75;
            rig.headGroup.rotation.y = s * 0.35;
        } else if (act === 'light2') {
            rig.headGroup.rotation.z = s * 0.85;
            rig.headGroup.rotation.y = -s * 0.45;
        } else if (act === 'fwd_light') {
            rig.hips.position.x = s * 0.95;
            rig.torso.rotation.z = -s * 0.35;
            rig.headGroup.rotation.z = -0.3 + s * 0.65;
        } else if (act === 'low_light' || act === 'low_heavy') {
            rig.hips.position.y = (baseHipsY || 1.65) * 0.58;
            rig.headGroup.rotation.z = -0.65 + s * 0.45;
            rig.headGroup.rotation.y = Math.cos(prog * Math.PI) * 0.65;
        } else if (act === 'anti_air' || act === 'up_light') {
            rig.hips.position.y = (baseHipsY || 1.65) + s * 0.65;
            rig.torso.rotation.z = s * 0.55;
            rig.headGroup.rotation.z = s * 1.05;
        } else if (act === 'back_light') {
            rig.hips.position.x = -s * 0.7;
            rig.headGroup.rotation.z = s * 0.55;
        } else if (act === 'throw') {
            rig.hips.position.x = s * 0.85;
            rig.headGroup.rotation.z = prog < 0.35 ? -0.45 : 0.85;
        } else if (act === 'air_light' || act === 'air_heavy') {
            rig.torso.rotation.z = -s * 0.5;
            rig.headGroup.rotation.z = -0.5 - s * 0.4;
        } else if (act === 'heavy' || act === 'fwd_heavy' || act === 'special') {
            rig.hips.position.x = s * (act === 'fwd_heavy' ? 1.35 : 0.85);
            rig.torso.rotation.z = -s * 0.25;
            rig.headGroup.rotation.z = -0.45 + s * 0.65;
        } else if (act === 'special2') {
            rig.torso.rotation.z = Math.sin(prog * Math.PI * 2) * 0.38;
            rig.legs[0].rotation.z = s * 0.8;
            rig.legs[1].rotation.z = s * 0.8;
        }
    }
});
