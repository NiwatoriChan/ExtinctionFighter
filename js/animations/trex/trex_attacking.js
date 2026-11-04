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
        const tRig = sp && sp.tRig;
        if (!sp || !tRig) return;

        // Neutraliser les rotations génériques de applyUniversalAttackBase pour piloter le squelette anatomique
        rig.torso.rotation.set(0, 0, 0);
        rig.neck.rotation.set(0, 0, 0);
        rig.headGroup.position.set(0, 0, 0);
        rig.headGroup.rotation.set(0, 0, 0);
        rig.jaw.rotation.set(0, 0, 0);
        rig.tailSegments.forEach(seg => { if (seg) seg.rotation.set(0, 0, 0); });
        if (rig.legs[0]) rig.legs[0].rotation.z = 0.02;
        if (rig.legs[1]) rig.legs[1].rotation.z = -0.02;

        let skinMode = 'idle';

        if (act === 'light') {
            // Coup Léger 1 : Morsure éclair (Snap Bite) avec inclinaison latérale de prédateur
            sp.applyPoseMode('idle', time);
            rig.hips.position.x = s * 0.58;
            rig.hips.position.y = baseHipsY;

            tRig.rootJoint.position.y = 2.08 - (anticipate || 0) * 0.08;
            tRig.rootJoint.rotation.set(s * 0.24, -s * 0.16, 0);

            tRig.neckSegments.forEach((seg, i) => {
                const whip = (i < 2 ? -0.12 : 0.06) + s * (0.06 + i * 0.015);
                seg.rotation.set(whip, -s * 0.035, 0);
            });

            // Ouverture explosive pendant l'armement/début de frappe, fermeture broyeuse à l'impact
            const jawGape = prog < 0.36
                ? Math.sin((prog / 0.36) * Math.PI * 0.5) * 0.82
                : Math.max(0.06, Math.cos(((prog - 0.36) / 0.64) * Math.PI * 0.5) * 0.68);
            tRig.setHeadRot(0.12 + s * 0.26, -s * 0.18, s * 0.16);
            tRig.setJawRot(jawGape);

            tRig.setDigitigradeLegPose(tRig.leftLeg, -s * 0.32, Math.max(0, s) * 0.28, -Math.max(0, s) * 0.18, 0.06, -0.15, 0.03);
            tRig.setDigitigradeLegPose(tRig.rightLeg, s * 0.28, 0, Math.max(0, s) * 0.22, 0.06, -0.15, 0.03);
            [tRig.leftArm, tRig.rightArm].forEach(arm => {
                tRig.setForelimbPose(arm, -s * 0.22, 0.08, 0.18 + s * 0.15, -s * 0.12, -0.25 * s);
            });

            tRig.caudalSegments.forEach((seg, i) => {
                seg.rotation.set(0.02, s * (0.06 + i * 0.02), 0);
            });

        } else if (act === 'light2') {
            // Coup Léger 2 (Combo 1-2) : Arrachement croisé avec torsion violente du cou et de la mâchoire
            sp.applyPoseMode('idle', time);
            rig.hips.position.x = s * 0.76;
            rig.hips.position.y = baseHipsY;

            tRig.rootJoint.position.y = 2.04;
            tRig.rootJoint.rotation.set(s * 0.30, s * 0.24, 0);

            tRig.neckSegments.forEach((seg, i) => {
                const whip = (i < 2 ? -0.10 : 0.07) + s * 0.08;
                seg.rotation.set(whip, s * 0.065, 0);
            });

            const jawGape = prog < 0.38 ? 0.95 : Math.max(0.08, (1 - prog) * 0.85);
            tRig.setHeadRot(0.08 + s * 0.32, s * 0.28, -s * 0.24);
            tRig.setJawRot(jawGape);

            tRig.setDigitigradeLegPose(tRig.leftLeg, s * 0.26, 0, Math.max(0, s) * 0.20, 0.08, -0.16, 0.04);
            tRig.setDigitigradeLegPose(tRig.rightLeg, -s * 0.36, Math.max(0, s) * 0.32, -Math.max(0, s) * 0.22, 0.08, -0.16, 0.04);
            [tRig.leftArm, tRig.rightArm].forEach(arm => {
                tRig.setForelimbPose(arm, -s * 0.28, 0.12, 0.22 + s * 0.18, -s * 0.15, 0.45 * s);
            });

            tRig.caudalSegments.forEach((seg, i) => {
                seg.rotation.set(-0.02, -s * (0.09 + i * 0.03), 0);
            });

        } else if (act === 'fwd_light') {
            // Avant + Léger : Fente prédatrice horizontale à longue portée (Jaw Lunge)
            sp.applyPoseMode('idle', time);
            rig.hips.position.x = s * 1.18;
            rig.hips.position.y = baseHipsY;

            tRig.rootJoint.position.y = 1.94;
            tRig.rootJoint.rotation.set(0.32 * Math.max(0, s), 0, 0);

            tRig.neckSegments.forEach((seg, i) => {
                seg.rotation.set((i < 2 ? -0.02 : 0.06) + s * 0.06, 0, 0);
            });

            tRig.setHeadRot(-0.18 + s * 0.22, 0, 0);
            tRig.setJawRot(0.18 + Math.max(0, s) * 0.74);

            tRig.setDigitigradeLegPose(tRig.leftLeg, -s * 0.48, Math.max(0, s) * 0.42, -Math.max(0, s) * 0.25, 0.14, -0.20, 0.04);
            tRig.setDigitigradeLegPose(tRig.rightLeg, s * 0.42, -Math.max(0, s) * 0.15, Math.max(0, s) * 0.35, 0.14, -0.15, 0.04);

            tRig.caudalSegments.forEach((seg, i) => {
                seg.rotation.set(-0.03 - i * 0.008, 0, 0);
            });

        } else if (act === 'low_light') {
            // Bas + Léger ⬇️ : Morsure faucheuse au ras du sol & fouet caudal bas
            sp.applyPoseMode('crouch', time);
            skinMode = 'crouch';
            rig.hips.position.x = s * 0.52;
            rig.hips.position.y = baseHipsY;

            tRig.rootJoint.position.y = 1.52 - Math.max(0, s) * 0.18;
            tRig.rootJoint.rotation.set(0.28 + Math.max(0, s) * 0.22, Math.sin(prog * Math.PI) * 0.25, 0);

            tRig.neckSegments.forEach((seg, i) => {
                seg.rotation.set((i < 2 ? 0.04 : 0.12) + s * 0.06, 0, 0);
            });
            tRig.setHeadRot(0.28 + s * 0.25, 0, s * 0.12);
            tRig.setJawRot(0.20 + Math.max(0, s) * 0.68);

            tRig.setDigitigradeLegPose(tRig.leftLeg, -0.18 * s, 0.22, -0.14, 0.56, -0.22, 0.05);
            tRig.setDigitigradeLegPose(tRig.rightLeg, 0.18 * s, 0.18, -0.12, 0.56, -0.22, 0.05);

            tRig.caudalSegments.forEach((seg, i) => {
                seg.rotation.set(0.06, Math.cos(prog * Math.PI) * (0.18 + i * 0.06), 0);
            });

        } else if (act === 'low_heavy') {
            // Bas + Lourd ⬇️ : Piétinement Sismique Colossal (Crushing Theropod Stomp) + Rugissement bas
            sp.applyPoseMode('idle', time);
            rig.hips.position.x = s * 0.48;
            rig.hips.position.y = baseHipsY;

            if (prog < 0.34) {
                // Phase 1 : Armement - la patte avant se lève très haut, genou plié et griffes écartées
                const lift = Math.sin((prog / 0.34) * Math.PI * 0.5);
                tRig.rootJoint.position.y = 2.16 + lift * 0.12;
                tRig.rootJoint.rotation.set(-0.18 * lift, -0.12 * lift, 0.08 * lift);

                tRig.neckSegments.forEach((seg, i) => {
                    seg.rotation.set((i < 2 ? -0.20 : 0.04) - lift * 0.04, 0, 0);
                });
                tRig.setHeadRot(0.15 + lift * 0.18, 0, 0);
                tRig.setJawRot(0.35 * lift);

                // Jambe gauche levée haut pour écraser, jambe droite en appui solide
                tRig.setDigitigradeLegPose(tRig.leftLeg, -0.78 * lift, 0.92 * lift, -0.55 * lift, 0, 0.45 * lift, 0.06);
                tRig.setDigitigradeLegPose(tRig.rightLeg, 0.08 * lift, 0, 0, 0.05 * lift, -0.20, 0.04);
            } else {
                // Phase 2 : Abattement sismique de 8 tonnes au sol !
                const slam = Math.sin(((prog - 0.34) / 0.66) * Math.PI);
                tRig.rootJoint.position.y = 2.10 - slam * 0.34;
                tRig.rootJoint.rotation.set(0.32 * slam, 0.10 * slam, -0.05 * slam);

                tRig.neckSegments.forEach((seg, i) => {
                    seg.rotation.set((i < 2 ? -0.04 : 0.12) + slam * 0.08, 0, 0);
                });
                tRig.setHeadRot(0.28 + slam * 0.24, 0, 0);
                tRig.setJawRot(0.25 + slam * 0.72);

                tRig.setDigitigradeLegPose(tRig.leftLeg, -0.35 * slam, 0.25 * slam, -0.15 * slam, 0.32 * slam, -0.28, 0.06);
                tRig.setDigitigradeLegPose(tRig.rightLeg, 0.22 * slam, 0.15 * slam, -0.10 * slam, 0.32 * slam, -0.22, 0.05);
            }

            tRig.caudalSegments.forEach((seg, i) => {
                seg.rotation.set(0.05, -s * (0.12 + i * 0.03), 0);
            });

        } else if (act === 'up_light' || act === 'anti_air') {
            // Direction HAUT ⬆️ : Détente verticale & Morsure Zénithale Anti-Air
            sp.applyPoseMode('display', time);
            skinMode = 'display';
            const isLauncher = act === 'anti_air';
            const skyReach = Math.max(0, s);

            rig.hips.position.y = baseHipsY + skyReach * (isLauncher ? 0.75 : 0.48);
            rig.hips.position.x = s * 0.36;

            tRig.rootJoint.position.y = 2.18 + skyReach * 0.16;
            tRig.rootJoint.rotation.set(-0.38 - skyReach * 0.32, 0, 0);

            tRig.neckSegments.forEach((seg, i) => {
                seg.rotation.set((i < 2 ? -0.24 : -0.08) - skyReach * 0.07, 0, 0);
            });
            tRig.setHeadRot(-0.28 - skyReach * 0.45, 0, 0);
            tRig.setJawRot(0.28 + skyReach * 0.85);

            // Extension propulsive des deux jambes digitigrades
            tRig.setDigitigradeLegPose(tRig.leftLeg, 0.28 * skyReach, -0.25 * skyReach, 0.35 * skyReach, 0, 0.30 * skyReach, 0.03);
            tRig.setDigitigradeLegPose(tRig.rightLeg, 0.18 * skyReach, -0.20 * skyReach, 0.28 * skyReach, 0, 0.25 * skyReach, 0.03);

            tRig.caudalSegments.forEach((seg, i) => {
                seg.rotation.set(0.10 + i * 0.03 * skyReach, 0, 0);
            });

        } else if (act === 'back_light') {
            // Direction ARRIÈRE ⬅️ : Pas de retrait défensif & coup de crête nasale / mâchoire
            sp.applyPoseMode('idle', time);
            rig.hips.position.x = -s * 0.78;
            rig.hips.position.y = baseHipsY;

            tRig.rootJoint.position.y = 2.06;
            tRig.rootJoint.rotation.set(-0.16 * s, s * 0.18, 0);

            tRig.neckSegments.forEach((seg, i) => {
                seg.rotation.set((i < 2 ? -0.18 : 0.06) + s * 0.05, s * 0.04, 0);
            });
            tRig.setHeadRot(0.22 + s * 0.24, s * 0.16, 0);
            tRig.setJawRot(0.18 + Math.max(0, s) * 0.64);

            tRig.setDigitigradeLegPose(tRig.leftLeg, 0.28 * s, 0.15, -0.10, 0.06, -0.15, 0.04);
            tRig.setDigitigradeLegPose(tRig.rightLeg, -0.32 * s, 0.25, -0.15, 0.06, -0.15, 0.04);

        } else if (act === 'air_light' || act === 'air_heavy') {
            // Attaque sautée plongeante : Guillotine maxillaire aérienne & serres en avant
            sp.applyPoseMode('idle', time);
            const isHeavyAir = act === 'air_heavy';

            tRig.rootJoint.position.y = 2.08;
            tRig.rootJoint.rotation.set(0.36 + s * (isHeavyAir ? 0.28 : 0.18), 0, 0);

            tRig.neckSegments.forEach((seg, i) => {
                seg.rotation.set((i < 2 ? 0.02 : 0.10) + s * 0.05, 0, 0);
            });
            tRig.setHeadRot(0.25 + s * 0.28, 0, 0);
            tRig.setJawRot(0.25 + Math.max(0, s) * 0.78);

            // Serres projetées vers l'avant et le bas pour écraser la cible
            tRig.setDigitigradeLegPose(tRig.leftLeg, -0.52, 0.35, -0.25, 0, -0.28, 0.06);
            tRig.setDigitigradeLegPose(tRig.rightLeg, -0.32, 0.45, -0.30, 0, -0.28, 0.06);

            tRig.caudalSegments.forEach((seg, i) => {
                seg.rotation.set(-0.08 - i * 0.02, 0, 0);
            });

        } else if (act === 'throw') {
            // Chope au corps à corps : Morsure broyeuse d'os -> Secousse cervicale -> Projection
            sp.applyPoseMode('idle', time);
            rig.hips.position.y = baseHipsY;

            if (prog < 0.30) {
                // Phase 1 : Saisie vorace dans les mâchoires
                rig.hips.position.x = s * 0.96;
                tRig.rootJoint.position.y = 1.96;
                tRig.rootJoint.rotation.set(0.28, 0, 0);
                tRig.neckSegments.forEach((seg, i) => {
                    seg.rotation.set(i < 2 ? 0.02 : 0.08, 0, 0);
                });
                tRig.setHeadRot(0.22, 0, 0);
                tRig.setJawRot(0.92 * (1 - prog / 0.30) + 0.18);
                tRig.setDigitigradeLegPose(tRig.leftLeg, -0.36, 0.30, -0.20, 0.12, -0.20, 0.05);
                tRig.setDigitigradeLegPose(tRig.rightLeg, 0.28, 0.10, 0.15, 0.12, -0.20, 0.05);
            } else if (prog < 0.72) {
                // Phase 2 : Secousse latérale brutale de la proie (M. transversospinalis)
                const shake = Math.sin(prog * 38);
                rig.hips.position.x = 0.88;
                tRig.rootJoint.position.y = 2.06;
                tRig.rootJoint.rotation.set(-0.12, shake * 0.32, shake * 0.08);
                tRig.neckSegments.forEach((seg, i) => {
                    seg.rotation.set(i < 2 ? -0.16 : 0.04, shake * 0.10, 0);
                });
                tRig.setHeadRot(0.08, shake * 0.42, shake * 0.28);
                tRig.setJawRot(0.18);
                tRig.setDigitigradeLegPose(tRig.leftLeg, -0.20, 0.18, -0.12, 0.08, -0.22, 0.06);
                tRig.setDigitigradeLegPose(tRig.rightLeg, 0.20, 0.18, -0.12, 0.08, -0.22, 0.06);
                tRig.caudalSegments.forEach((seg, i) => {
                    seg.rotation.set(0.02, -shake * (0.12 + i * 0.03), 0);
                });
            } else {
                // Phase 3 : Coup de fouet cervical projetant l'adversaire au loin
                const toss = (prog - 0.72) / 0.28;
                rig.hips.position.x = 0.65 * (1 - toss * 0.5);
                tRig.rootJoint.position.y = 2.16;
                tRig.rootJoint.rotation.set(-0.28, 0, 0);
                tRig.neckSegments.forEach((seg, i) => {
                    seg.rotation.set(i < 2 ? -0.24 : -0.06, 0, 0);
                });
                tRig.setHeadRot(-0.32, 0, 0);
                tRig.setJawRot(0.78);
            }

        } else if (act === 'heavy') {
            // Coup Lourd : Balayage Caudal Rotatif 360° (Pivot sur les membres digitigrades & fouet de queue)
            sp.applyPoseMode('idle', time);
            rig.hips.position.y = baseHipsY;
            rig.hips.position.x = s * 0.62;

            // Rotation complète fluide avec inclinaison basse du buste pour projeter la queue vers l'avant
            const spinAngle = prog * Math.PI * 2;
            tRig.rootJoint.position.y = 1.96;
            tRig.rootJoint.rotation.set(0.22 * Math.sin(prog * Math.PI), spinAngle, 0);

            tRig.neckSegments.forEach((seg, i) => {
                seg.rotation.set(i < 2 ? -0.10 : 0.06, 0.08, 0);
            });
            tRig.setHeadRot(0.18, 0.22, 0);
            tRig.setJawRot(0.42 * Math.sin(prog * Math.PI));

            const stepCycle = Math.sin(prog * Math.PI * 4);
            tRig.setDigitigradeLegPose(tRig.leftLeg, stepCycle * 0.28, Math.max(0, stepCycle) * 0.35, -0.15, 0.14, -0.18, 0.05);
            tRig.setDigitigradeLegPose(tRig.rightLeg, -stepCycle * 0.28, Math.max(0, -stepCycle) * 0.35, -0.15, 0.14, -0.18, 0.05);

            // Courbure en fouet des 6 segments caudaux
            tRig.caudalSegments.forEach((seg, i) => {
                seg.rotation.set(0.02, (0.16 + i * 0.04) * Math.sin(prog * Math.PI), 0);
            });

        } else if (act === 'fwd_heavy') {
            // Avant + Lourd ➡️ : Charge Bélier Crânienne & Morsure Broyeuse d'Os
            sp.applyPoseMode('sprint', time, { isSprint: true, strideSpeed: 12.0, strideAmp: 1.25 });
            skinMode = 'sprint';
            rig.hips.position.x = s * 1.42;
            rig.hips.position.y = baseHipsY;

            tRig.rootJoint.position.y = 1.88;
            tRig.rootJoint.rotation.set(0.36 * Math.max(0, s), 0, 0);

            tRig.neckSegments.forEach((seg, i) => {
                seg.rotation.set((i < 2 ? 0.02 : 0.08) + s * 0.06, 0, 0);
            });

            const jawCrunch = prog < 0.42
                ? Math.sin((prog / 0.42) * Math.PI * 0.5) * 0.96
                : Math.max(0.05, Math.cos(((prog - 0.42) / 0.58) * Math.PI * 0.5) * 0.85);
            tRig.setHeadRot(-0.12 + s * 0.28, 0, s * 0.14);
            tRig.setJawRot(jawCrunch);

            tRig.setDigitigradeLegPose(tRig.leftLeg, -s * 0.52, Math.max(0, s) * 0.45, -Math.max(0, s) * 0.28, 0.16, -0.22, 0.05);
            tRig.setDigitigradeLegPose(tRig.rightLeg, s * 0.46, -0.12, Math.max(0, s) * 0.38, 0.16, -0.18, 0.05);

        } else if (act === 'special') {
            // Spécial 1 (H) : Morsure Sismique (Cabré d'intimidation suivi d'un claquement de mâchoire dévastateur)
            sp.applyPoseMode('display', time);
            skinMode = 'display';
            rig.hips.position.x = s * 0.85;
            rig.hips.position.y = baseHipsY;

            if (prog < 0.35) {
                const coil = prog / 0.35;
                tRig.rootJoint.position.y = 2.22;
                tRig.rootJoint.rotation.set(-0.32 * coil, 0, 0);
                tRig.neckSegments.forEach((seg, i) => {
                    seg.rotation.set((i < 2 ? -0.26 : -0.05) * coil, 0, 0);
                });
                tRig.setHeadRot(-0.25 * coil, 0, 0);
                tRig.setJawRot(1.05 * coil);
            } else {
                const crunch = Math.sin(((prog - 0.35) / 0.65) * Math.PI);
                tRig.rootJoint.position.y = 2.10 - crunch * 0.24;
                tRig.rootJoint.rotation.set(0.35 * crunch, 0, 0);
                tRig.neckSegments.forEach((seg, i) => {
                    seg.rotation.set((i < 2 ? 0.04 : 0.10) * crunch, 0, 0);
                });
                tRig.setHeadRot(0.24 * crunch, 0, crunch * 0.15);
                tRig.setJawRot(Math.max(0.08, 1.05 * (1 - crunch * 0.92)));
                tRig.setDigitigradeLegPose(tRig.leftLeg, -0.42 * crunch, 0.35 * crunch, -0.22 * crunch, 0.18 * crunch, -0.24, 0.05);
                tRig.setDigitigradeLegPose(tRig.rightLeg, 0.35 * crunch, 0.10 * crunch, 0.25 * crunch, 0.18 * crunch, -0.20, 0.05);
            }

        } else if (act === 'special2') {
            // Spécial 2 (T) : Rugissement de Magma (Piétinement sismique + Hurlement primordial vibrant)
            sp.applyPoseMode('display', time);
            skinMode = 'display';
            const roarWave = Math.sin(prog * Math.PI);
            const vib = Math.sin(prog * Math.PI * 16) * 0.04 * roarWave;

            rig.hips.position.y = baseHipsY;
            tRig.rootJoint.position.y = 2.08 - roarWave * 0.12;
            tRig.rootJoint.rotation.set(0.18 * roarWave + vib, 0, 0);

            tRig.neckSegments.forEach((seg, i) => {
                seg.rotation.set((i < 2 ? -0.08 : 0.12) * roarWave, vib * 0.8, 0);
            });
            tRig.setHeadRot(-0.18 * roarWave + vib, vib * 1.5, 0);
            tRig.setJawRot(0.95 * roarWave + Math.abs(vib) * 2.0);

            tRig.setDigitigradeLegPose(tRig.leftLeg, -0.25 * roarWave, 0.22 * roarWave, -0.15 * roarWave, 0.12 * roarWave, -0.25, 0.06);
            tRig.setDigitigradeLegPose(tRig.rightLeg, 0.22 * roarWave, 0.18 * roarWave, -0.12 * roarWave, 0.12 * roarWave, -0.25, 0.06);

            tRig.caudalSegments.forEach((seg, i) => {
                seg.rotation.set(-0.03 * roarWave, Math.sin(prog * Math.PI * 6 - i * 0.5) * 0.12 * roarWave, 0);
            });
        }

        sp.updateAnatomicalSkin(time, fighter, skinMode);
    }
});
