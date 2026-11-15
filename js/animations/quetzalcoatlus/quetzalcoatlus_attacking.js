// ============================================================================
// js/animations/quetzalcoatlus/quetzalcoatlus_attacking.js — Quetzalcoatlus Attack Animations
// ============================================================================

registerFighterAnimation('quetzal', {
    hasCustomDirectionals: true,

    // Chorégraphies d'attaques articulant les 7 vertèbres cervicales, le rostre de 2.5m et les ailes multi-segments
    animateAttack(ctx) {
        const { fighter, rig, act, prog, swing, strike, baseHipsY, time } = ctx;
        const s = strike !== undefined ? strike : swing;
        const sp = rig.specialParts;

        const by = baseHipsY || 1.98;
        rig.hips.position.y = by;

        const setGlbWings = (spread01, sweep = 0, dihedral = 0) => {
            const foldL = { x: 0.0, y: 0.0, z: 0.0 };
            const openL = { x: 1.42 + dihedral, y: sweep, z: 0.0 };
            if (sp.leftWing && sp.rightWing) {
                sp.leftWing.rotation.set(
                    THREE.MathUtils.lerp(foldL.x, openL.x, spread01),
                    THREE.MathUtils.lerp(foldL.y, openL.y, spread01),
                    THREE.MathUtils.lerp(foldL.z, openL.z, spread01)
                );
                sp.rightWing.rotation.set(
                    THREE.MathUtils.lerp(-foldL.x, -openL.x, spread01),
                    THREE.MathUtils.lerp(-foldL.y, -openL.y, spread01),
                    THREE.MathUtils.lerp(foldL.z, openL.z, spread01)
                );
            }
            if (rig.arms.length >= 2) {
                rig.arms[0].rotation.set(
                    0.0,
                    THREE.MathUtils.lerp(0.0, sweep * 0.3, spread01),
                    THREE.MathUtils.lerp(0.0, 2.68, spread01)
                );
                rig.arms[1].rotation.set(
                    0.0,
                    THREE.MathUtils.lerp(0.0, -sweep * 0.3, spread01),
                    THREE.MathUtils.lerp(0.0, 2.68, spread01)
                );
            }
        };

        if (act === 'light') {
            setGlbWings(0.15, 0, 0);
            rig.hips.position.x = s * 0.65;
            rig.torso.rotation.z = -0.06 - s * 0.36;
            rig.neck.rotation.z = 0.12 - s * 0.32;
            rig.headGroup.rotation.z = -0.18 + s * 0.24;
            rig.jaw.rotation.z = -0.08 - Math.max(0, s) * 0.36;
        } else if (act === 'light2') {
            rig.hips.position.x = s * 0.82;
            rig.torso.rotation.set(0, -s * 0.22, -0.08 - s * 0.40);
            rig.neck.rotation.set(0, -s * 0.18, 0.10 - s * 0.34);
            rig.headGroup.rotation.set(0, -s * 0.16, -0.15 + s * 0.28);
            rig.jaw.rotation.z = -0.12 - Math.max(0, s) * 0.45;
            setGlbWings(Math.max(0, s) * 0.62, s * 0.25, 0.18);
        } else if (act === 'fwd_light') {
            rig.hips.position.x = s * 1.25;
            rig.hips.position.y = by - Math.max(0, s) * 0.16;
            rig.torso.rotation.z = -0.45 * Math.max(0.1, s);
            rig.neck.rotation.z = -0.42 * s;
            rig.headGroup.rotation.z = 0.24;
            rig.jaw.rotation.z = -0.10 - Math.max(0, s) * 0.40;
            setGlbWings(Math.max(0, s) * 0.48, 0.28, 0.10);
        } else if (act === 'low_light' || act === 'low_heavy') {
            const isHeavyLow = act === 'low_heavy';
            rig.hips.position.y = by - Math.max(0, s) * (isHeavyLow ? 0.56 : 0.42);
            rig.hips.position.x = s * 0.55;
            rig.torso.rotation.z = -0.35 - Math.max(0, s) * 0.32;
            rig.neck.rotation.z = -0.25 - Math.max(0, s) * 0.32;
            rig.headGroup.rotation.z = -0.15;
            rig.jaw.rotation.z = -0.15 - Math.max(0, s) * 0.50;
            setGlbWings(isHeavyLow ? Math.max(0, s) * 0.80 : 0.10, -s * 0.50, -0.24);
        } else if (act === 'anti_air' || act === 'up_light') {
            rig.hips.position.y = by + Math.max(0, s) * 0.90;
            rig.hips.position.x = s * 0.35;
            rig.torso.rotation.z = 0.42 + Math.max(0, s) * 0.24;
            rig.neck.rotation.z = 0.32 + Math.max(0, s) * 0.22;
            rig.headGroup.rotation.z = 0.28 * s;
            rig.jaw.rotation.z = -0.25 - Math.max(0, s) * 0.52;
            setGlbWings(0.80 + Math.max(0, s) * 0.20, -0.20, 0.35 * s);
        } else if (act === 'back_light') {
            rig.hips.position.x = -s * 0.80;
            rig.torso.rotation.z = 0.32 - s * 0.22;
            rig.neck.rotation.z = 0.18 - s * 0.24;
            rig.jaw.rotation.z = -0.18 - Math.max(0, s) * 0.38;
            setGlbWings(0.75 + Math.max(0, s) * 0.25, -s * 0.32, 0.22);
        } else if (act === 'air_light' || act === 'air_heavy') {
            const flap = Math.sin(time * 7.0) * 0.45;
            rig.torso.rotation.z = -0.34 - s * (act === 'air_heavy' ? 0.38 : 0.24);
            rig.neck.rotation.z = -0.24 - s * 0.18;
            rig.jaw.rotation.z = -0.18 - Math.max(0, s) * 0.46;
            setGlbWings(1.0, 0.22, flap);
        } else if (act === 'throw') {
            if (prog < 0.32) {
                rig.hips.position.x = s * 0.95;
                rig.torso.rotation.z = -0.32;
                rig.neck.rotation.z = -0.28;
                rig.jaw.rotation.z = -0.62;
                setGlbWings(0.25, 0, 0);
            } else if (prog < 0.72) {
                const shake = Math.sin(prog * 38);
                rig.hips.position.x = 0.88;
                rig.torso.rotation.set(0, shake * 0.28, 0.38);
                rig.neck.rotation.set(0, shake * 0.24, 0.24);
                rig.headGroup.rotation.set(shake * 0.18, shake * 0.35, 0);
                rig.jaw.rotation.z = -0.12;
                setGlbWings(0.80, shake * 0.18, 0.25);
            } else {
                rig.hips.position.x = 0.62;
                rig.torso.rotation.z = 0.48;
                rig.headGroup.rotation.z = 0.32;
                rig.jaw.rotation.z = -0.58;
                setGlbWings(0.95, -0.30, 0.32);
            }
        } else if (act === 'heavy' || act === 'fwd_heavy') {
            if (act === 'fwd_heavy') rig.hips.position.x = s * 0.92;
            rig.torso.rotation.z = -0.22 - s * 0.32;
            rig.neck.rotation.z = -0.16 - s * 0.24;
            rig.jaw.rotation.z = -0.18 - Math.max(0, s) * 0.46;
            setGlbWings(0.95, -s * 0.68, s * 0.32);
        } else if (act === 'special') {
            rig.hips.position.y = by + Math.max(0, s) * 1.45;
            rig.hips.position.x = s * 0.75;
            rig.torso.rotation.z = -0.28 - s * 0.36;
            rig.neck.rotation.z = -0.22 - s * 0.26;
            rig.jaw.rotation.z = -0.24 - Math.max(0, s) * 0.40;
            setGlbWings(1.0, 0.34, Math.sin(time * 9.5) * 0.60);
        } else if (act === 'special2') {
            const flap = Math.sin(prog * Math.PI * 6) * 0.72;
            rig.hips.position.y = by + Math.sin(prog * Math.PI) * 0.85;
            rig.torso.rotation.z = 0.32 + Math.sin(prog * Math.PI * 6) * 0.14;
            rig.headGroup.rotation.z = 0.20;
            rig.jaw.rotation.z = -0.42;
            setGlbWings(1.0, 0.10, flap);
        }
    }
});

