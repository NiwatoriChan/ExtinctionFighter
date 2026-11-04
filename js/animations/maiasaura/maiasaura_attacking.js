/* ============================================================================
 * ANIMATIONS MAIASAURA : ATTAQUES, COMBOS & COUPS SPÉCIAUX
 * ============================================================================ */

registerFighterAnimation('maiasaura', {
    hasCustomDirectionals: true,

    animateAttack(ctx) {
        const { rig, act, prog, swing, baseHipsY } = ctx;
        if (act === 'light') {
            rig.arms[0].rotation.z = swing * 1.2;
            rig.headGroup.rotation.z = -swing * 0.35;
        } else if (act === 'light2') {
            rig.arms[1].rotation.z = swing * 1.2;
            rig.headGroup.rotation.z = swing * 0.35;
        } else if (act === 'fwd_light') {
            rig.hips.position.x = swing * 0.75;
            rig.neck.rotation.z = -swing * 0.6;
            rig.headGroup.rotation.z = -swing * 0.45;
        } else if (act === 'low_light' || act === 'low_heavy') {
            rig.hips.position.y = baseHipsY - swing * 0.3;
            rig.tailSegments.forEach(s => { s.rotation.y = -swing * 0.85; });
        } else if (act === 'anti_air' || act === 'up_light') {
            rig.neck.rotation.z = swing * 0.75;
            rig.headGroup.rotation.z = swing * 0.55;
            if (rig.specialParts.sonicCrest) rig.specialParts.sonicCrest.scale.setScalar(1 + swing * 0.5);
        } else if (act === 'back_light') {
            rig.hips.position.x = -swing * 0.7;
            rig.headGroup.rotation.z = swing * 0.45;
        } else if (act === 'air_light' || act === 'air_heavy') {
            rig.hips.rotation.z = -swing * 0.4;
            rig.legs[0].rotation.z = swing * 0.9;
        } else if (act === 'fwd_heavy') {
            rig.hips.position.x = swing * 1.1;
            rig.neck.rotation.z = -swing * 0.55;
            rig.arms[0].rotation.z = swing * 1.2;
            rig.arms[1].rotation.z = swing * 1.2;
        } else if (act === 'throw') {
            rig.arms[0].rotation.z = 0.8;
            rig.arms[1].rotation.z = 0.8;
            rig.headGroup.rotation.z = -0.6;
        } else if (act === 'throw_whiff') {
            rig.hips.position.x = swing * 0.35;
            rig.arms[0].rotation.z = 0.5;
        } else if (act === 'heavy' || act === 'special2') {
            rig.hips.position.y = baseHipsY + swing * 1.35;
            rig.hips.rotation.z = prog * Math.PI * 2;
            rig.legs[0].rotation.z = 0.85;
            rig.legs[1].rotation.z = -0.85;
        } else if (act === 'special') {
            rig.neck.rotation.z = -swing * 0.35;
            rig.headGroup.rotation.z = swing * 0.25;
        }
    }
});
