/* ============================================================================
 * ANIMATIONS T-REX : ATTAQUES, COMBOS & COUPS SPÉCIAUX
 * ============================================================================ */

registerFighterAnimation('trex', {
    hasCustomDirectionals: true,

    animateAttack(ctx) {
        const { rig, act, prog, swing, strike } = ctx;
        const s = strike !== undefined ? strike : swing;

        if (act === 'light') {
            rig.torso.rotation.z = -s * 0.35;
            rig.torso.rotation.y = s * 0.25;
            rig.neck.rotation.z = -s * 0.30;
            rig.jaw.rotation.z = -s * 0.75;
        } else if (act === 'light2') {
            rig.torso.rotation.z = -s * 0.42;
            rig.torso.rotation.y = -s * 0.35;
            rig.neck.rotation.z = -s * 0.38;
            rig.jaw.rotation.z = -s * 1.05;
            rig.tailSegments.forEach(seg => { seg.rotation.y = s * 0.4; });
        } else if (act === 'fwd_light') {
            rig.hips.position.x = s * 0.95;
            rig.torso.rotation.z = -s * 0.42;
            rig.neck.rotation.z = -s * 0.45;
            rig.jaw.rotation.z = -s * 0.85;
        } else if (act === 'low_light' || act === 'low_heavy') {
            rig.hips.position.y = 1.35;
            rig.torso.rotation.z = -0.38;
            rig.neck.rotation.z = -0.40;
            rig.jaw.rotation.z = -s * 0.75;
            rig.tailSegments.forEach((seg, i) => { seg.rotation.y = Math.cos(prog * Math.PI) * 0.75; void i; });
        } else if (act === 'anti_air' || act === 'up_light') {
            rig.hips.position.y = 2.1 + s * 0.65;
            rig.torso.rotation.z = s * 0.55;
            rig.neck.rotation.z = s * 0.45;
            rig.headGroup.rotation.z = s * 0.65;
            rig.jaw.rotation.z = -s * 1.25;
            rig.tailSegments.forEach(seg => { seg.rotation.z = -s * 0.45; });
        } else if (act === 'throw') {
            rig.hips.position.x = s * 0.85;
            rig.torso.rotation.y = Math.sin(prog * 22) * 0.45;
            rig.jaw.rotation.z = prog < 0.35 ? -1.15 : -0.25;
        } else if (act === 'heavy' || act === 'fwd_heavy') {
            rig.hips.rotation.y = prog * Math.PI * 2;
            rig.tailSegments.forEach(seg => { seg.rotation.y = 0.42; });
        } else if (act === 'air_light' || act === 'air_heavy') {
            rig.torso.rotation.z = -0.58;
            rig.jaw.rotation.z = -s * 0.85;
        } else if (act === 'back_light') {
            rig.hips.position.x = -s * 0.75;
            rig.torso.rotation.z = s * 0.25;
            rig.jaw.rotation.z = -s * 0.85;
        } else if (act === 'special' || act === 'special2') {
            rig.torso.rotation.z = s * 0.28;
            rig.headGroup.rotation.z = s * 0.45;
            rig.jaw.rotation.z = -0.75;
        }
    }
});
