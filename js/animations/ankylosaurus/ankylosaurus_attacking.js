/* ============================================================================
 * ANIMATIONS ANKYLOSAURE : ATTAQUES, COMBOS & COUPS SPÉCIAUX
 * ============================================================================ */

registerFighterAnimation('ankylo', {
    hasCustomDirectionals: true,

    animateAttack(ctx) {
        const { rig, act, prog, swing, strike, baseHipsY } = ctx;
        const s = strike !== undefined ? strike : swing;

        if (act === 'light') {
            rig.hips.position.x = s * 0.75;
            rig.torso.rotation.x = s * 0.45;
            rig.headGroup.rotation.y = s * 0.35;
        } else if (act === 'light2') {
            rig.hips.position.x = s * 0.85;
            rig.torso.rotation.x = -s * 0.35;
            rig.headGroup.rotation.y = -s * 0.45;
            rig.headGroup.rotation.z = -s * 0.35;
        } else if (act === 'fwd_light') {
            rig.hips.position.x = s * 1.1;
            rig.torso.rotation.z = -s * 0.38;
            rig.headGroup.rotation.z = -s * 0.45;
        } else if (act === 'low_light' || act === 'low_heavy') {
            rig.hips.position.y = baseHipsY * 0.6;
            rig.torso.rotation.z = -0.25;
            rig.tailSegments.forEach(seg => {
                seg.rotation.y = Math.cos(prog * Math.PI) * 1.15;
                seg.rotation.z = -0.22;
            });
        } else if (act === 'anti_air' || act === 'up_light') {
            rig.hips.position.y = baseHipsY + s * 0.45;
            rig.torso.rotation.z = -s * 0.45;
            rig.tailSegments.forEach(seg => { seg.rotation.z = s * 0.85; });
        } else if (act === 'throw') {
            rig.hips.position.x = s * 0.85;
            rig.tailSegments.forEach(seg => { seg.rotation.y = Math.sin(prog * 20) * 0.65; });
        } else if (act === 'heavy' || act === 'special') {
            rig.hips.rotation.y = prog * Math.PI * 2;
            rig.tailSegments.forEach(seg => { seg.rotation.y = 0.48; });
        } else if (act === 'fwd_heavy') {
            rig.hips.position.x = s * 1.35;
            rig.torso.rotation.z = -s * 0.45;
        } else if (act === 'air_light' || act === 'air_heavy') {
            rig.torso.rotation.z = -s * 0.45;
            rig.tailSegments.forEach(seg => { seg.rotation.z = 0.55; });
        } else if (act === 'back_light') {
            rig.hips.position.x = -s * 0.65;
            rig.torso.rotation.x = s * 0.35;
        } else if (act === 'special2') {
            rig.hips.position.y = baseHipsY + s * 0.8;
            rig.torso.rotation.z = -prog * Math.PI * 4;
        }
    }
});
