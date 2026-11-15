/* ============================================================================
 * ANIMATIONS PACHYRHINOSAURE : ATTAQUES, COMBOS & COUPS SPÉCIAUX
 * Chorégraphies biomécaniques articulant la bosse nasale pachyostotique,
 * la grande collerette à cornes P2/P3, le bec rostral/prédentaire et les
 * 4 membres quadrupèdes massifs.
 * ============================================================================ */

registerFighterAnimation('pachyrhino', {
    hasCustomDirectionals: true,

    animateAttack(ctx) {
        const { fighter, rig, act, prog, swing, strike, anticipate, baseHipsY, time } = ctx;
        const s = strike !== undefined ? strike : swing;
        const sp = rig.specialParts;

        const by = baseHipsY || 1.65;
        rig.hips.position.y = by;

        if (act === 'light' || act === 'light2') {
            const flip = act === 'light2' ? -1 : 1;
            rig.hips.position.x = s * (act === 'light2' ? 0.68 : 0.52);
            rig.torso.rotation.set(flip * s * 0.14, -flip * s * 0.16, -s * 0.16);
            rig.headGroup.rotation.set(flip * s * 0.18, -flip * s * 0.42, -0.18 + s * 0.52);
            rig.jaw.rotation.z = -0.15 - Math.max(0, s) * 0.40;
        } else if (act === 'fwd_light') {
            rig.hips.position.x = s * 0.98;
            rig.hips.position.y = by - 0.12 * Math.max(0, s);
            rig.torso.rotation.z = -0.26 * Math.max(0, s);
            rig.headGroup.rotation.z = -0.34 + s * 0.56;
            rig.jaw.rotation.z = -0.15 - Math.max(0, s) * 0.35;
            if (rig.legs.length >= 4) {
                rig.legs[0].rotation.z = 0.42 * s;
                rig.legs[1].rotation.z = -0.28 * s;
                rig.legs[2].rotation.z = -0.36 * s;
                rig.legs[3].rotation.z = 0.28 * s;
            }
        } else if (act === 'low_light') {
            rig.hips.position.y = by * 0.72;
            rig.hips.position.x = s * 0.56;
            rig.torso.rotation.set(0, Math.cos(prog * Math.PI) * 0.18, -0.24);
            rig.headGroup.rotation.set(0, Math.cos(prog * Math.PI) * 0.55, -0.42 + s * 0.32);
            rig.jaw.rotation.z = -0.24 - Math.max(0, s) * 0.30;
        } else if (act === 'low_heavy') {
            rig.hips.position.x = s * 0.72;
            const stompLift = prog < 0.42 ? Math.sin((prog / 0.42) * Math.PI) : 0;
            const stompSlam = prog >= 0.42 ? Math.sin(((prog - 0.42) / 0.58) * Math.PI) : 0;
            rig.hips.position.y = by * 0.80 + stompLift * 0.30 - stompSlam * 0.20;
            rig.torso.rotation.set(0, Math.cos(prog * Math.PI) * 0.22, stompLift * 0.22 - stompSlam * 0.26);
            rig.headGroup.rotation.set(0, Math.cos(prog * Math.PI) * 0.52, -0.35 + stompLift * 0.35 - stompSlam * 0.25);
            rig.jaw.rotation.z = -0.24 - stompSlam * 0.45;
        } else if (act === 'anti_air' || act === 'up_light') {
            rig.hips.position.y = by + Math.max(0, s) * 0.36;
            rig.torso.rotation.z = 0.36 * Math.max(0.2, s);
            rig.neck.rotation.z = 0.18 * Math.max(0.2, s);
            rig.headGroup.rotation.z = 0.65 * Math.max(0.2, s);
            rig.jaw.rotation.z = -0.45 - Math.max(0, s) * 0.38;
        } else if (act === 'back_light') {
            rig.hips.position.x = -s * 0.68;
            rig.torso.rotation.z = 0.16 * s;
            rig.headGroup.rotation.set(0, s * 0.22, 0.42 * s);
            rig.jaw.rotation.z = -0.22 * Math.max(0, s);
        } else if (act === 'throw') {
            rig.hips.position.x = s * 0.85;
            const isScoop = prog < 0.38;
            rig.hips.position.y = isScoop ? by * 0.84 : by + 0.12;
            rig.torso.rotation.z = isScoop ? -0.26 : 0.30;
            rig.headGroup.rotation.z = isScoop ? -0.46 : 0.72;
            rig.jaw.rotation.z = isScoop ? -0.15 : -0.60;
        } else if (act === 'air_light' || act === 'air_heavy') {
            rig.torso.rotation.z = -0.36 * s;
            rig.headGroup.rotation.z = -0.42 - 0.30 * s;
            rig.jaw.rotation.z = -0.32;
        } else if (act === 'heavy' || act === 'fwd_heavy' || act === 'special') {
            rig.hips.position.x = s * (act === 'fwd_heavy' ? 1.35 : (act === 'special' ? 1.15 : 0.88));
            const windup = anticipate || 0;
            rig.hips.position.y = by - Math.max(0, s) * 0.14;
            rig.torso.rotation.z = windup * 0.18 - Math.max(0, s) * 0.30;
            rig.headGroup.rotation.z = windup > 0.1 ? -0.46 * windup : (-0.38 + s * 0.66);
            rig.jaw.rotation.z = -0.22 - Math.max(0, s) * 0.50;
            const g = Math.sin(time * 18);
            if (rig.legs.length >= 4 && (act === 'fwd_heavy' || act === 'special')) {
                rig.legs[0].rotation.z = g * 0.55;
                rig.legs[3].rotation.z = g * 0.55;
                rig.legs[1].rotation.z = -g * 0.55;
                rig.legs[2].rotation.z = -g * 0.55;
            }
        } else if (act === 'special2') {
            const rearPhase = prog < 0.48 ? Math.sin((prog / 0.48) * Math.PI) : 0;
            const slamPhase = prog >= 0.48 ? Math.sin(((prog - 0.48) / 0.52) * Math.PI) : 0;
            rig.hips.position.y = by + rearPhase * 0.36 - slamPhase * 0.24;
            rig.torso.rotation.z = rearPhase * 0.42 - slamPhase * 0.34;
            rig.headGroup.rotation.set(0, Math.sin(prog * Math.PI * 4) * 0.16, rearPhase * 0.45 - slamPhase * 0.46);
            rig.jaw.rotation.z = -0.35 - rearPhase * 0.45 - slamPhase * 0.25;
            if (rig.legs.length >= 2) {
                rig.legs[0].rotation.z = rearPhase * 0.55 - slamPhase * 0.25;
                rig.legs[1].rotation.z = rearPhase * 0.55 - slamPhase * 0.25;
            }
        }
    }
});
