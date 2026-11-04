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
        const qRig = sp && sp.qRig;
        if (!sp || !qRig) return;

        // Neutraliser les rotations génériques de applyUniversalAttackBase pour piloter le squelette anatomique
        rig.torso.rotation.set(0, 0, 0);
        rig.neck.rotation.set(0, 0, 0);
        rig.headGroup.position.set(0, 0, 0);
        rig.headGroup.rotation.set(0, 0, 0);
        rig.jaw.rotation.set(0, 0, 0);
        if (rig.legs[0]) rig.legs[0].rotation.z = 0.02;
        if (rig.legs[1]) rig.legs[1].rotation.z = -0.02;

        let skinMode = 'idle';

        // Fonction utilitaire pour déployer les ailes selon un facteur [0..1]
        const setWingSpread = (spreadAmt, sweepForward = 0, dihedral = 0) => {
            [qRig.leftWing, qRig.rightWing].forEach(w => {
                const side = w.side;
                w.shoulder.rotation.set(
                    THREE.MathUtils.lerp(0.68, -0.10 - sweepForward, spreadAmt),
                    -side * 0.25 * (1 - spreadAmt) + side * sweepForward * 0.45,
                    THREE.MathUtils.lerp(-side * 1.18, side * dihedral, spreadAmt)
                );
                w.elbow.rotation.set(0, side * sweepForward * 0.25, THREE.MathUtils.lerp(-side * 0.22, side * dihedral * 0.4, spreadAmt));
                w.wrist.rotation.set(0, 0, THREE.MathUtils.lerp(side * 0.08, 0, spreadAmt));
                w.knuckle.rotation.set(
                    0,
                    THREE.MathUtils.lerp(side * 1.38, -side * 0.14, spreadAmt),
                    THREE.MathUtils.lerp(side * 1.95, side * dihedral * 0.35, spreadAmt)
                );
                w.phalanx1.rotation.set(0, 0, 0);
                w.phalanx2.rotation.set(0, 0, side * 0.08 * (1 - spreadAmt));
                w.phalanx3.rotation.set(0, 0, side * 0.08 * (1 - spreadAmt));
            });
        };

        if (act === 'light') {
            // Coup Léger 1 : Estoc rapide du long rostre en lance (détente des 7 vertèbres cervicales)
            sp.applyPoseMode('idle', time);
            rig.hips.position.x = s * 0.65;
            qRig.rootJoint.rotation.x = -0.58 + s * 0.38;
            qRig.neckSegments.forEach((seg, i) => {
                const whip = i === 0 ? (-0.32 + s * 0.48) : (0.04 + s * 0.065);
                seg.rotation.set(whip, 0, 0);
            });
            qRig.setHeadRot(0.42 - s * 0.62, 0, 0);
            qRig.setJawRot(0.08 + Math.max(0, s) * 0.36);

        } else if (act === 'light2') {
            // Coup Léger 2 (Combo 1-2) : Estoc croisé avec ouverture d'intimidation des ailes
            sp.applyPoseMode('idle', time);
            rig.hips.position.x = s * 0.82;
            qRig.rootJoint.rotation.set(-0.55 + s * 0.42, -s * 0.22, 0);
            qRig.neckSegments.forEach((seg, i) => {
                const whip = i === 0 ? (-0.28 + s * 0.52) : (0.04 + s * 0.07);
                seg.rotation.set(whip, -s * 0.045, 0);
            });
            qRig.setHeadRot(0.38 - s * 0.68, -s * 0.18, 0);
            qRig.setJawRot(0.12 + Math.max(0, s) * 0.48);
            setWingSpread(Math.max(0, s) * 0.55, s * 0.25, 0.15);

        } else if (act === 'fwd_light') {
            // Avant + Léger : Harponnage horizontal maximal à longue portée
            sp.applyPoseMode('idle', time);
            rig.hips.position.x = s * 1.25;
            rig.hips.position.y = baseHipsY - Math.max(0, s) * 0.16;
            qRig.rootJoint.rotation.x = -0.52 + s * 0.58;
            qRig.neckSegments.forEach((seg, i) => {
                const ext = i === 0 ? (-0.20 + s * 0.55) : (0.03 + s * 0.055);
                seg.rotation.set(ext, 0, 0);
            });
            qRig.setHeadRot(0.28 - s * 0.58, 0, 0);
            qRig.setJawRot(0.10 + Math.max(0, s) * 0.42);
            setWingSpread(Math.max(0, s) * 0.45, -0.25, 0.10);

        } else if (act === 'low_light' || act === 'low_heavy') {
            // Direction BAS ⬇️ : Frappe de cigogne géante au ras du sol & fauchage d'aile
            sp.applyPoseMode('idle', time);
            const isHeavyLow = act === 'low_heavy';
            rig.hips.position.y = baseHipsY - Math.max(0, s) * (isHeavyLow ? 0.58 : 0.42);
            rig.hips.position.x = s * 0.55;
            qRig.rootJoint.position.y = 1.98 - Math.max(0, s) * 0.28;
            qRig.rootJoint.rotation.x = -0.35 + s * 0.68;

            qRig.neckSegments.forEach((seg, i) => {
                const dive = i === 0 ? (0.15 + s * 0.58) : (0.04 + s * 0.085);
                seg.rotation.set(dive, isHeavyLow ? Math.sin(prog * Math.PI) * 0.06 : 0, 0);
            });
            qRig.setHeadRot(-0.25 - s * 0.42, 0, 0);
            qRig.setJawRot(0.15 + Math.max(0, s) * 0.52);
            if (isHeavyLow) {
                setWingSpread(Math.max(0, s) * 0.78, s * 0.55, -0.28);
            }

        } else if (act === 'anti_air' || act === 'up_light') {
            // Direction HAUT ⬆️ : Parade Territoriale (Display Mode) & Harponnage Céleste au Zénith
            sp.applyPoseMode('display', time);
            skinMode = 'display';
            rig.hips.position.y = baseHipsY + Math.max(0, s) * 0.92;
            rig.hips.position.x = s * 0.35;
            qRig.rootJoint.position.y = 2.18 + Math.max(0, s) * 0.22;
            qRig.rootJoint.rotation.set(-0.88 - s * 0.22, 0, 0);

            qRig.neckSegments.forEach((seg, i) => {
                const skyArch = i === 0 ? (-0.68 - s * 0.25) : (-0.06 - s * 0.045);
                seg.rotation.set(skyArch, 0, 0);
            });
            qRig.setHeadRot(0.55 + s * 0.52, 0, 0);
            qRig.setJawRot(0.25 + Math.max(0, s) * 0.55);
            setWingSpread(0.75 + Math.max(0, s) * 0.25, 0.20, 0.35 * s);

        } else if (act === 'back_light') {
            // Direction ARRIÈRE ⬅️ : Battement de recul défensif & coup de bec
            sp.applyPoseMode('display', time);
            skinMode = 'display';
            rig.hips.position.x = -s * 0.82;
            qRig.rootJoint.rotation.x = -0.72 + s * 0.25;
            qRig.neckSegments.forEach((seg, i) => {
                seg.rotation.set(i === 0 ? -0.35 + s * 0.45 : s * 0.04, 0, 0);
            });
            qRig.setHeadRot(0.25 - s * 0.48, 0, 0);
            qRig.setJawRot(0.18 + Math.max(0, s) * 0.38);
            setWingSpread(0.68 + Math.max(0, s) * 0.30, s * 0.35, 0.22);

        } else if (act === 'air_light' || act === 'air_heavy') {
            // Piqué plongeant aérien (Azhdarchid Dive Strike) : envergure complète et rostre en flèche
            sp.applyPoseMode('soar', time, { flapFreq: 6.5, flapAmp: 0.85, rootY: 1.98 });
            skinMode = 'soar';
            const isHeavyAir = act === 'air_heavy';
            qRig.rootJoint.rotation.x = 0.38 + s * (isHeavyAir ? 0.42 : 0.28);
            qRig.neckSegments.forEach((seg, i) => {
                seg.rotation.set((i === 0 ? 0.22 : 0.04) + s * 0.05, 0, 0);
            });
            qRig.setHeadRot(-0.22 - s * 0.35, 0, 0);
            qRig.setJawRot(0.18 + Math.max(0, s) * 0.48);

        } else if (act === 'throw') {
            // Chope au bec géant : saisie de la proie, secousse cervicale et projection
            sp.applyPoseMode('display', time);
            skinMode = 'display';
            if (prog < 0.32) {
                rig.hips.position.x = s * 0.95;
                qRig.rootJoint.rotation.x = -0.38;
                qRig.neckSegments.forEach((seg, i) => {
                    seg.rotation.set(i === 0 ? 0.18 : 0.05, 0, 0);
                });
                qRig.setHeadRot(-0.35, 0, 0);
                qRig.setJawRot(0.65);
            } else if (prog < 0.72) {
                const shake = Math.sin(prog * 38);
                rig.hips.position.x = 0.88;
                qRig.rootJoint.rotation.set(-0.78, shake * 0.28, 0);
                qRig.neckSegments.forEach((seg, i) => {
                    seg.rotation.set(i === 0 ? -0.58 : -0.05, shake * 0.08, 0);
                });
                qRig.setHeadRot(0.38, shake * 0.35, shake * 0.18);
                qRig.setJawRot(0.12);
                setWingSpread(0.75, 0.15 * shake, 0.25);
            } else {
                rig.hips.position.x = 0.62;
                qRig.rootJoint.rotation.set(-0.85, 0, 0);
                qRig.setHeadRot(0.62, 0, 0);
                qRig.setJawRot(0.58);
                setWingSpread(0.92, 0.35, 0.32);
            }

        } else if (act === 'heavy' || act === 'fwd_heavy') {
            // Bourrasque d'ailes dévastatrice : envergure dorsale de 11m rabattue vers l'avant
            sp.applyPoseMode('anatomy', time);
            skinMode = 'soar';
            if (act === 'fwd_heavy') rig.hips.position.x = s * 0.92;
            qRig.rootJoint.position.y = 2.08;
            qRig.rootJoint.rotation.x = -0.45 + s * 0.55;

            qRig.neckSegments.forEach((seg, i) => {
                seg.rotation.set(i === 0 ? (-0.32 + s * 0.48) : (s * 0.045), 0, 0);
            });
            qRig.setHeadRot(0.22 - s * 0.45, 0, 0);
            qRig.setJawRot(0.18 + Math.max(0, s) * 0.46);
            setWingSpread(0.95, Math.max(-0.35, s * 0.72), s * 0.32);

        } else if (act === 'special') {
            // Piqué Sonique : envol thermique suivi d'une plongée supersonique bec en avant
            sp.applyPoseMode('soar', time, { flapFreq: 9.0, flapAmp: 1.25, rootY: 2.05 });
            skinMode = 'soar';
            rig.hips.position.y = baseHipsY + Math.max(0, s) * 1.45;
            rig.hips.position.x = s * 0.75;
            qRig.rootJoint.rotation.x = 0.28 + s * 0.38;
            qRig.neckSegments.forEach((seg, i) => {
                seg.rotation.set((i === 0 ? 0.18 : 0.035) + s * 0.045, 0, 0);
            });
            qRig.setHeadRot(-0.22 - s * 0.32, 0, 0);
            qRig.setJawRot(0.24 + Math.max(0, s) * 0.42);

        } else if (act === 'special2') {
            // Bourrasque Tourbillonnaire : battements frénétiques des ailes géantes
            const flapFreq = 14.0;
            sp.applyPoseMode('soar', time, {
                flapFreq,
                flapAmp: 1.45,
                rootY: 2.12
            });
            skinMode = 'soar';
            rig.hips.position.y = baseHipsY + Math.sin(prog * Math.PI) * 0.85;
            qRig.rootJoint.rotation.x = -0.52 + Math.sin(prog * Math.PI * 6) * 0.14;
            qRig.setHeadRot(0.32, 0, 0);
            qRig.setJawRot(0.42);
        }

        sp.updateAnatomicalSkin(time, fighter, skinMode);
    }
});

