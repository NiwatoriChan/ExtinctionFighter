/* ============================================================================
 * ANIMATIONS T-REX : ATTAQUES, COMBOS, COMMAND NORMALS & COUPS SPÉCIAUX
 * Chorégraphies biomécaniques articulant les 5 vertèbres cervicales en S,
 * le crâne binoculaire, la mâchoire à muscles adducteurs, les membres
 * postérieurs digitigrades à 4 segments et les 6 vertèbres caudales.
 * ============================================================================ */

registerFighterAnimation('trex', {
    hasCustomDirectionals: true,

    animateAttack(ctx) {
        const { fighter, rig, act, prog, swing, strike, anticipate, baseHipsY, time } = ctx;
        const s = strike !== undefined ? strike : swing;
        const sp = rig.specialParts;

        const by = baseHipsY || 2.10;
        rig.hips.position.y = by;

        if (act === 'light') {
            rig.hips.position.x = s * 0.58;
            rig.torso.rotation.set(s * 0.14, -s * 0.16, -s * 0.22);
            rig.neck.rotation.set(0, -s * 0.12, -s * 0.16);
            rig.headGroup.rotation.set(s * 0.16, -s * 0.14, -s * 0.18);
            rig.jaw.rotation.z = prog < 0.36 ? -Math.sin((prog / 0.36) * Math.PI * 0.5) * 0.85 : -0.10;
        } else if (act === 'light2') {
            rig.hips.position.x = s * 0.76;
            rig.torso.rotation.set(-s * 0.18, s * 0.24, -s * 0.28);
            rig.neck.rotation.set(0, s * 0.18, -s * 0.14);
            rig.headGroup.rotation.set(-s * 0.22, s * 0.24, -s * 0.16);
            rig.jaw.rotation.z = prog < 0.38 ? -0.92 : -0.12;
        } else if (act === 'fwd_light') {
            rig.hips.position.x = s * 1.16;
            rig.torso.rotation.z = -0.34 * Math.max(0, s);
            rig.neck.rotation.z = -0.18 * Math.max(0, s);
            rig.headGroup.rotation.z = 0.18 * Math.max(0, s);
            rig.jaw.rotation.z = -0.18 - Math.max(0, s) * 0.78;
            if (rig.legs.length >= 2) {
                rig.legs[0].rotation.z = 0.44 * s;
                rig.legs[1].rotation.z = -0.40 * s;
            }
        } else if (act === 'low_light') {
            rig.hips.position.y = by * 0.70 - Math.max(0, s) * 0.14;
            rig.hips.position.x = s * 0.52;
            rig.torso.rotation.set(0, Math.sin(prog * Math.PI) * 0.26, -0.32 - Math.max(0, s) * 0.16);
            rig.headGroup.rotation.z = -0.18;
            rig.jaw.rotation.z = -0.20 - Math.max(0, s) * 0.72;
            rig.tailSegments.forEach((seg, i) => {
                if (seg) seg.rotation.y = Math.cos(prog * Math.PI) * (0.20 + i * 0.06);
            });
        } else if (act === 'low_heavy') {
            rig.hips.position.x = s * 0.48;
            if (prog < 0.34) {
                const lift = Math.sin((prog / 0.34) * Math.PI * 0.5);
                rig.hips.position.y = by + lift * 0.14;
                rig.torso.rotation.z = 0.22 * lift;
                if (rig.legs[0]) rig.legs[0].rotation.z = 0.82 * lift;
            } else {
                const slam = Math.sin(((prog - 0.34) / 0.66) * Math.PI);
                rig.hips.position.y = by - slam * 0.32;
                rig.torso.rotation.z = -0.34 * slam;
                rig.jaw.rotation.z = -0.25 - slam * 0.70;
                if (rig.legs[0]) rig.legs[0].rotation.z = -0.25 * slam;
            }
        } else if (act === 'up_light' || act === 'anti_air') {
            const skyReach = Math.max(0, s);
            rig.hips.position.y = by + skyReach * (act === 'anti_air' ? 0.72 : 0.45);
            rig.hips.position.x = s * 0.36;
            rig.torso.rotation.z = 0.36 + skyReach * 0.32;
            rig.neck.rotation.z = 0.22 * skyReach;
            rig.headGroup.rotation.z = 0.34 * skyReach;
            rig.jaw.rotation.z = -0.28 - skyReach * 0.85;
        } else if (act === 'back_light') {
            rig.hips.position.x = -s * 0.78;
            rig.torso.rotation.set(0, s * 0.18, 0.16 * s);
            rig.jaw.rotation.z = -0.18 - Math.max(0, s) * 0.66;
        } else if (act === 'air_light' || act === 'air_heavy') {
            rig.torso.rotation.z = -0.34 - s * (act === 'air_heavy' ? 0.28 : 0.18);
            rig.headGroup.rotation.z = -0.18;
            rig.jaw.rotation.z = -0.25 - Math.max(0, s) * 0.75;
            rig.legs.forEach((l, i) => { if (l) l.rotation.z = 0.48 - i * 0.15; });
        } else if (act === 'throw') {
            if (prog < 0.30) {
                rig.hips.position.x = s * 0.96;
                rig.torso.rotation.z = -0.28;
                rig.jaw.rotation.z = -0.92 * (1 - prog / 0.30) - 0.18;
            } else if (prog < 0.72) {
                const shake = Math.sin(prog * 38);
                rig.hips.position.x = 0.88;
                rig.torso.rotation.set(shake * 0.08, shake * 0.32, 0.12);
                rig.headGroup.rotation.set(shake * 0.25, shake * 0.42, 0);
                rig.jaw.rotation.z = -0.18;
            } else {
                rig.hips.position.x = 0.65 * (1 - ((prog - 0.72) / 0.28) * 0.5);
                rig.torso.rotation.z = 0.30;
                rig.headGroup.rotation.z = 0.32;
                rig.jaw.rotation.z = -0.78;
            }
        } else if (act === 'heavy') {
            rig.hips.position.x = s * 0.62;
            rig.hips.rotation.y = prog * Math.PI * 2;
            rig.torso.rotation.z = -0.22 * Math.sin(prog * Math.PI);
            rig.jaw.rotation.z = -0.45 * Math.sin(prog * Math.PI);
            rig.tailSegments.forEach((seg, i) => {
                if (seg) seg.rotation.y = (0.18 + i * 0.05) * Math.sin(prog * Math.PI);
            });
        } else if (act === 'fwd_heavy') {
            rig.hips.position.x = s * 1.42;
            rig.torso.rotation.z = -0.36 * Math.max(0, s);
            rig.jaw.rotation.z = prog < 0.42 ? -Math.sin((prog / 0.42) * Math.PI * 0.5) * 0.95 : -0.12;
            if (rig.legs.length >= 2) {
                rig.legs[0].rotation.z = 0.50 * s;
                rig.legs[1].rotation.z = -0.44 * s;
            }
        } else if (act === 'special') {
            rig.hips.position.x = s * 0.85;
            if (prog < 0.35) {
                const coil = prog / 0.35;
                rig.torso.rotation.z = 0.34 * coil;
                rig.headGroup.rotation.z = 0.24 * coil;
                rig.jaw.rotation.z = -1.05 * coil;
            } else {
                const crunch = Math.sin(((prog - 0.35) / 0.65) * Math.PI);
                rig.torso.rotation.z = -0.36 * crunch;
                rig.jaw.rotation.z = -Math.max(0.08, 1.05 * (1 - crunch * 0.92));
            }
        } else if (act === 'special2') {
            const roarWave = Math.sin(prog * Math.PI);
            const vib = Math.sin(prog * Math.PI * 16) * 0.05 * roarWave;
            rig.torso.rotation.set(0, vib * 1.2, 0.22 * roarWave + vib);
            rig.headGroup.rotation.set(0, vib * 1.8, 0.25 * roarWave + vib);
            rig.jaw.rotation.z = -0.95 * roarWave - Math.abs(vib) * 2.0;
            rig.tailSegments.forEach((seg, i) => {
                if (seg) seg.rotation.y = Math.sin(prog * Math.PI * 6 - i * 0.5) * 0.16 * roarWave;
            });
        }
    }
});
