/* ============================================================================
 * ANIMATIONS OISEAU DE TERREUR : ATTAQUES, COMBOS & COUPS SPÉCIAUX
 * ============================================================================ */

registerFighterAnimation('terabird', {
    hasCustomDirectionals: true,

    animateAttack(ctx) {
        const { rig, act, prog, swing, strike, baseHipsY } = ctx;
        const s = strike !== undefined ? strike : swing;
        if (act === 'light') {
            rig.neck.rotation.z = -swing * 0.75;
            rig.headGroup.rotation.z = -swing * 0.45;
            rig.jaw.rotation.z = -swing * 0.5;
        } else if (act === 'light2') {
            rig.torso.rotation.y = swing * 0.35;
            rig.neck.rotation.z = -swing * 0.9;
            rig.headGroup.rotation.z = -swing * 0.55;
            rig.jaw.rotation.z = -swing * 0.7;
        } else if (act === 'fwd_light') {
            rig.hips.position.x = swing * 0.85;
            rig.neck.rotation.z = -swing * 0.8;
            rig.arms[0].rotation.x = -0.6;
            rig.arms[1].rotation.x = 0.6;
        } else if (act === 'low_light' || act === 'low_heavy') {
            rig.hips.position.y = baseHipsY - swing * 0.35;
            rig.legs[0].rotation.z = swing * 1.2;
            rig.torso.rotation.z = 0.35;
        } else if (act === 'anti_air' || act === 'up_light') {
            rig.neck.rotation.z = swing * 0.85;
            rig.headGroup.rotation.z = swing * 0.6;
            rig.jaw.rotation.z = -swing * 0.8;
            rig.arms[0].rotation.x = -1.2;
            rig.arms[1].rotation.x = 1.2;
        } else if (act === 'back_light') {
            rig.hips.position.x = -s * 0.75;
            rig.neck.rotation.z = -s * 0.65;
            rig.jaw.rotation.z = -s * 0.55;
        } else if (act === 'air_light' || act === 'air_heavy') {
            rig.torso.rotation.z = -swing * 0.7;
            rig.legs[0].rotation.z = swing * 1.3;
            rig.legs[1].rotation.z = swing * 1.1;
        } else if (act === 'fwd_heavy') {
            rig.hips.position.x = swing * 1.1;
            rig.hips.position.y = baseHipsY + swing * 0.8;
            rig.legs[0].rotation.z = swing * 1.2;
            rig.legs[1].rotation.z = swing * 1.0;
        } else if (act === 'throw') {
            rig.neck.rotation.z = -swing * 0.95;
            rig.headGroup.rotation.y = swing * 1.2;
        } else if (act === 'throw_whiff') {
            rig.hips.position.x = swing * 0.45;
            rig.neck.rotation.z = -swing * 0.4;
        } else if (act === 'heavy' || act === 'special2') {
            rig.hips.position.y = baseHipsY + swing * 1.5;
            rig.torso.rotation.z = swing * 0.35;
            rig.legs[0].rotation.z = swing * 1.1;
            rig.legs[1].rotation.z = swing * 0.9;
            rig.arms[0].rotation.x = -0.85;
            rig.arms[1].rotation.x = 0.85;
        } else if (act === 'special') {
            rig.hips.position.y = baseHipsY + Math.sin(prog * Math.PI) * 1.8;
            rig.neck.rotation.z = -swing * 0.95;
            rig.arms[0].rotation.x = -1.1;
            rig.arms[1].rotation.x = 1.1;
        }
    }
});
