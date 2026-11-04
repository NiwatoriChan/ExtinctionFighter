/* ============================================================================
 * ANIMATIONS APATOSAURE : ATTAQUES, COMBOS & COUPS SPÉCIAUX
 * ============================================================================ */

registerFighterAnimation('apato', {
    hasCustomDirectionals: true,

    animateAttack(ctx) {
        const { rig, act, prog, swing, baseHipsY } = ctx;
        if (act === 'light') {
            rig.specialParts.neckSegments.forEach((nSeg, i) => {
                nSeg.rotation.z = -swing * (0.42 - i * 0.08);
                nSeg.rotation.y = swing * 0.45;
            });
            rig.headGroup.rotation.y = swing * 0.55;
        } else if (act === 'light2') {
            rig.specialParts.neckSegments.forEach((nSeg, i) => {
                nSeg.rotation.z = -swing * (0.35 - i * 0.06);
                nSeg.rotation.y = -swing * 0.45;
            });
            rig.headGroup.rotation.y = -swing * 0.55;
        } else if (act === 'fwd_light') {
            rig.hips.position.x = swing * 0.8;
            rig.specialParts.neckSegments.forEach(nSeg => {
                nSeg.rotation.z = -swing * 0.38;
            });
            rig.headGroup.position.x = swing * 0.6;
        } else if (act === 'low_light' || act === 'low_heavy') {
            rig.hips.rotation.y = Math.PI * swing * 0.75;
            rig.hips.position.y = baseHipsY - swing * 0.2;
            rig.tailSegments.forEach((s, i) => {
                s.rotation.y = Math.sin(prog * Math.PI * 2 - i * 0.3) * 0.6;
                s.position.y = -swing * 0.25;
            });
        } else if (act === 'anti_air' || act === 'up_light') {
            rig.hips.rotation.z = swing * 0.7;
            rig.specialParts.neckSegments.forEach(n => { n.rotation.z = swing * 0.45; });
            rig.headGroup.rotation.z = swing * 0.6;
        } else if (act === 'back_light') {
            rig.hips.position.x = -swing * 0.65;
            rig.specialParts.neckSegments.forEach(n => { n.rotation.z = swing * 0.35; });
        } else if (act === 'air_light' || act === 'air_heavy') {
            rig.hips.rotation.z = -swing * 0.4;
            rig.legs.forEach(l => { l.rotation.z = swing * 0.6; });
        } else if (act === 'fwd_heavy') {
            rig.hips.position.x = swing * 1.2;
            rig.torso.rotation.z = -swing * 0.45;
            rig.specialParts.neckSegments.forEach(n => { n.rotation.z = -swing * 0.5; });
        } else if (act === 'throw') {
            rig.specialParts.neckSegments.forEach(n => { n.rotation.z = -swing * 0.6; });
            rig.headGroup.rotation.z = swing * 0.9;
        } else if (act === 'throw_whiff') {
            rig.hips.position.x = swing * 0.35;
            rig.specialParts.neckSegments.forEach(n => { n.rotation.z = -swing * 0.3; });
        } else if (act === 'heavy' || act === 'special2') {
            rig.hips.rotation.z = Math.sin(prog * Math.PI) * 0.58;
            rig.legs[0].rotation.z = swing * 0.7;
            rig.legs[1].rotation.z = swing * 0.7;
        } else if (act === 'special') {
            rig.hips.rotation.y = Math.PI * swing;
            rig.tailSegments.forEach((s, i) => {
                s.rotation.y = Math.sin(prog * Math.PI * 2 - i * 0.3) * 0.55;
            });
        }
    }
});
