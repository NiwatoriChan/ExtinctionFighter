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
        const pRig = sp && sp.pRig;

        if (!sp || !pRig) return;

        // Neutraliser les rotations génériques pour piloter directement le squelette pRig
        rig.torso.rotation.set(0, 0, 0);
        rig.neck.rotation.set(0, 0, 0);
        rig.headGroup.position.set(0, 0, 0);
        rig.headGroup.rotation.set(0, 0, 0);
        rig.jaw.rotation.set(0, 0, 0);
        rig.legs.forEach(l => { if (l) l.rotation.set(0, 0, 0); });
        rig.tailSegments.forEach(seg => { if (seg) seg.rotation.set(0, 0, 0); });

        let skinMode = 'idle';

        if (act === 'light') {
            // Coup Léger 1 : Crochet latéral de la bosse nasale & corne jugale
            sp.applyPoseMode('idle', time);
            rig.hips.position.x = s * 0.52;
            rig.hips.position.y = baseHipsY;

            pRig.rootJoint.position.y = 1.62 - (anticipate || 0) * 0.08;
            pRig.rootJoint.rotation.set(s * 0.16, -s * 0.14, 0);

            pRig.neckSegments.forEach((seg, i) => {
                seg.rotation.set(0.05 + s * 0.06, -s * (0.06 + i * 0.03), 0);
            });

            pRig.setHeadRot(0.22 - s * 0.48, -s * 0.38, s * 0.18);
            pRig.setJawRot(0.12 + Math.max(0, s) * 0.35);

            pRig.setForelimbPose(pRig.leftFrontLeg, 0.28 * s, Math.max(0, s) * 0.22, 0, 0.08, 0.06);
            pRig.setForelimbPose(pRig.rightFrontLeg, -0.18 * s, 0, 0, 0.08, 0.06);
            pRig.setHindlimbPose(pRig.leftHindLeg, -0.18 * s, 0, 0, 0.06, 0.05);
            pRig.setHindlimbPose(pRig.rightHindLeg, 0.22 * s, 0, 0, 0.06, 0.05);

        } else if (act === 'light2') {
            // Coup Léger 2 (Combo) : Revers crânien croisé & claquement du bec de perroquet
            sp.applyPoseMode('idle', time);
            rig.hips.position.x = s * 0.68;
            rig.hips.position.y = baseHipsY;

            pRig.rootJoint.position.y = 1.60;
            pRig.rootJoint.rotation.set(s * 0.20, s * 0.18, 0);

            pRig.neckSegments.forEach((seg, i) => {
                seg.rotation.set(0.04 - s * 0.08, s * (0.08 + i * 0.035), 0);
            });

            pRig.setHeadRot(0.18 - s * 0.62, s * 0.46, -s * 0.24);
            pRig.setJawRot(0.18 + Math.max(0, s) * 0.48);

            pRig.setForelimbPose(pRig.leftFrontLeg, -0.22 * s, 0, 0, 0.10, 0.06);
            pRig.setForelimbPose(pRig.rightFrontLeg, 0.34 * s, Math.max(0, s) * 0.26, 0, 0.10, 0.06);

        } else if (act === 'fwd_light') {
            // Avant + Léger : Coup de bélier frontal rapide avec l'enclume nasale
            sp.applyPoseMode('idle', time);
            rig.hips.position.x = s * 0.98;
            rig.hips.position.y = baseHipsY;

            pRig.rootJoint.position.set(0, 1.48, s * 0.18);
            pRig.rootJoint.rotation.set(0.28 * s, 0, 0);

            pRig.neckSegments.forEach((seg, i) => {
                seg.rotation.set(0.08 + i * 0.02 - s * 0.06, 0, 0);
            });

            // Armement tête basse (+rx), puis coup de tête explosif vers le haut/avant (-rx)
            pRig.setHeadRot(0.36 - s * 0.58, 0, 0);
            pRig.setJawRot(0.15 + Math.max(0, s) * 0.35);

            pRig.setForelimbPose(pRig.leftFrontLeg, 0.42 * s, 0.18, -0.10, 0.18, 0.06);
            pRig.setForelimbPose(pRig.rightFrontLeg, -0.28 * s, 0.12, -0.08, 0.18, 0.06);
            pRig.setHindlimbPose(pRig.leftHindLeg, -0.36 * s, 0.22, -0.12, 0.15, 0.05);
            pRig.setHindlimbPose(pRig.rightHindLeg, 0.28 * s, 0.16, -0.10, 0.15, 0.05);

        } else if (act === 'low_light') {
            // Bas + Léger : Fauchage rasant du bec rostral et de la bosse nasale au ras du sol
            sp.applyPoseMode('crouch', time);
            skinMode = 'crouch';
            rig.hips.position.x = s * 0.56;
            rig.hips.position.y = baseHipsY;

            pRig.rootJoint.position.y = 1.18;
            pRig.rootJoint.rotation.set(0.24, Math.cos(prog * Math.PI) * 0.18, 0);

            pRig.neckSegments.forEach((seg, i) => {
                seg.rotation.set(0.12 + i * 0.03, Math.cos(prog * Math.PI) * 0.08, 0);
            });

            pRig.setHeadRot(0.48 - s * 0.35, Math.cos(prog * Math.PI) * 0.58, s * 0.16);
            pRig.setJawRot(0.24 + Math.max(0, s) * 0.32);

        } else if (act === 'low_heavy') {
            // Bas + Lourd : Piétinement sismique antérieur & balayage blindé de la collerette
            sp.applyPoseMode('crouch', time);
            skinMode = 'crouch';
            rig.hips.position.x = s * 0.72;
            rig.hips.position.y = baseHipsY;

            const stompLift = prog < 0.42 ? Math.sin((prog / 0.42) * Math.PI) : 0;
            const stompSlam = prog >= 0.42 ? Math.sin(((prog - 0.42) / 0.58) * Math.PI) : 0;

            pRig.rootJoint.position.y = 1.24 + stompLift * 0.32 - stompSlam * 0.18;
            pRig.rootJoint.rotation.set(-stompLift * 0.22 + stompSlam * 0.26, Math.cos(prog * Math.PI) * 0.22, 0);

            pRig.setHeadRot(0.45 - stompLift * 0.35 + stompSlam * 0.25, Math.cos(prog * Math.PI) * 0.55, 0);
            pRig.setJawRot(0.25 + stompSlam * 0.45);

            pRig.setForelimbPose(pRig.leftFrontLeg, stompLift * 0.45, stompLift * 0.65, -stompLift * 0.30, 0.35 + stompSlam * 0.22, 0.08);
            pRig.setForelimbPose(pRig.rightFrontLeg, stompLift * 0.38, stompLift * 0.58, -stompLift * 0.25, 0.35 + stompSlam * 0.22, 0.08);

        } else if (act === 'anti_air' || act === 'up_light') {
            // Haut + Attaque / Anti-Air : Cabré cératopsien & encornement vertical avec les cornes P2/P3
            sp.applyPoseMode('display', time);
            skinMode = 'display';
            rig.hips.position.y = baseHipsY + Math.max(0, s) * 0.38;

            pRig.rootJoint.position.y = 1.72 + Math.max(0, s) * 0.24;
            pRig.rootJoint.rotation.set(-0.34 * Math.max(0.2, s), 0, 0);

            pRig.neckSegments.forEach((seg, i) => {
                seg.rotation.set(-0.10 - i * 0.035 * s, 0, 0);
            });

            pRig.setHeadRot(-0.68 * s, 0, 0);
            pRig.setJawRot(0.45 + Math.max(0, s) * 0.38);

            pRig.setForelimbPose(pRig.leftFrontLeg, -0.45 * s, 0.55 * Math.max(0, s), -0.25, 0, 0.08);
            pRig.setForelimbPose(pRig.rightFrontLeg, -0.35 * s, 0.48 * Math.max(0, s), -0.22, 0, 0.08);
            pRig.setHindlimbPose(pRig.leftHindLeg, 0.18 * s, 0.15, 0, 0.08, 0.05);
            pRig.setHindlimbPose(pRig.rightHindLeg, 0.12 * s, 0.15, 0, 0.08, 0.05);

        } else if (act === 'back_light') {
            // Arrière + Léger : Recul défensif & coup de bouclier crânien répulsif
            sp.applyPoseMode('idle', time);
            rig.hips.position.x = -s * 0.68;
            rig.hips.position.y = baseHipsY;

            pRig.rootJoint.position.y = 1.56;
            pRig.rootJoint.rotation.set(-0.14 * s, 0, 0);
            pRig.setHeadRot(-0.42 * s, s * 0.22, 0);
            pRig.setJawRot(0.22 * Math.max(0, s));

            pRig.caudalSegments.forEach((seg, i) => {
                seg.rotation.set(0.04, s * (0.14 + i * 0.04), 0);
            });

        } else if (act === 'throw') {
            // Projection (Throw) : Embrochement bas sous l'adversaire puis catapultage par-dessus la collerette
            sp.applyPoseMode('idle', time);
            rig.hips.position.x = s * 0.85;
            rig.hips.position.y = baseHipsY;

            const isScoop = prog < 0.38;
            pRig.rootJoint.position.y = isScoop ? 1.38 : 1.74;
            pRig.rootJoint.rotation.set(isScoop ? 0.26 : -0.28, 0, 0);

            pRig.neckSegments.forEach((seg, i) => {
                seg.rotation.set(isScoop ? (0.10 + i * 0.02) : (-0.12 - i * 0.03), 0, 0);
            });

            pRig.setHeadRot(isScoop ? 0.48 : -0.78, 0, 0);
            pRig.setJawRot(isScoop ? 0.15 : 0.62);

        } else if (act === 'air_light' || act === 'air_heavy') {
            // Attaque aérienne : Impact météorique de la bosse nasale et des 4 sabots vers le bas
            sp.applyPoseMode('idle', time);
            pRig.rootJoint.rotation.set(0.38 * s, 0, 0);
            pRig.neckSegments.forEach(seg => {
                seg.rotation.set(0.08 + 0.06 * s, 0, 0);
            });
            pRig.setHeadRot(0.45 + 0.32 * s, 0, 0);
            pRig.setJawRot(0.35);

            pRig.setForelimbPose(pRig.leftFrontLeg, 0.38 * s, 0.25, -0.15, 0.12, 0.07);
            pRig.setForelimbPose(pRig.rightFrontLeg, 0.38 * s, 0.25, -0.15, 0.12, 0.07);

        } else if (act === 'heavy' || act === 'fwd_heavy' || act === 'special') {
            // Coup Lourd / Avant + Lourd / Spécial 1 (Charge Boréale) :
            // Dévastation frontale avec la bosse nasale pachyostotique et exhibition des ocelles
            const isFwd = act === 'fwd_heavy' || act === 'special';
            sp.applyPoseMode(isFwd ? 'sprint' : 'idle', time, { isSprint: true, strideSpeed: 16.0, strideAmp: 1.3 });
            skinMode = isFwd ? 'sprint' : 'idle';

            rig.hips.position.x = s * (act === 'fwd_heavy' ? 1.35 : (act === 'special' ? 1.15 : 0.88));
            rig.hips.position.y = baseHipsY;

            const windup = anticipate || 0;
            pRig.rootJoint.position.set(0, 1.44 - Math.max(0, s) * 0.10, s * 0.24);
            pRig.rootJoint.rotation.set(-windup * 0.18 + Math.max(0, s) * 0.30, 0, 0);

            pRig.neckSegments.forEach((seg, i) => {
                seg.rotation.set(0.09 + i * 0.025 - Math.max(0, s) * 0.08, 0, 0);
            });

            // La tête s'incline à 45° pendant l'élan pour présenter l'enclume nasale puis remonte violemment à l'impact
            const headPitch = windup > 0.1
                ? 0.46 * windup
                : (0.42 - s * 0.68);
            pRig.setHeadRot(headPitch, 0, 0);
            pRig.setJawRot(0.24 + Math.max(0, s) * 0.52);

            pRig.setForelimbPose(pRig.leftFrontLeg, 0.45 * s, 0.25, -0.15, 0.22, 0.06);
            pRig.setForelimbPose(pRig.rightFrontLeg, -0.35 * s, 0.20, -0.12, 0.22, 0.06);
            pRig.setHindlimbPose(pRig.leftHindLeg, -0.42 * s, 0.28, -0.18, 0.18, 0.05);
            pRig.setHindlimbPose(pRig.rightHindLeg, 0.35 * s, 0.22, -0.14, 0.18, 0.05);

        } else if (act === 'special2') {
            // Spécial 2 : Onde de Choc Sismique & Parade d'Intimidation de la Collerette
            sp.applyPoseMode('display', time);
            skinMode = 'display';
            rig.hips.position.y = baseHipsY;

            const rearPhase = prog < 0.48 ? Math.sin((prog / 0.48) * Math.PI) : 0;
            const slamPhase = prog >= 0.48 ? Math.sin(((prog - 0.48) / 0.52) * Math.PI) : 0;

            pRig.rootJoint.position.y = 1.65 + rearPhase * 0.36 - slamPhase * 0.28;
            pRig.rootJoint.rotation.set(-rearPhase * 0.42 + slamPhase * 0.32, 0, 0);

            pRig.neckSegments.forEach((seg, i) => {
                seg.rotation.set(-rearPhase * (0.10 + i * 0.03) + slamPhase * 0.12, 0, 0);
            });

            pRig.setHeadRot(-rearPhase * 0.45 + slamPhase * 0.48, Math.sin(prog * Math.PI * 4) * 0.14, 0);
            pRig.setJawRot(0.35 + rearPhase * 0.45 + slamPhase * 0.25);

            pRig.setForelimbPose(pRig.leftFrontLeg, -rearPhase * 0.55 + slamPhase * 0.25, rearPhase * 0.65, -rearPhase * 0.30, slamPhase * 0.42, 0.08);
            pRig.setForelimbPose(pRig.rightFrontLeg, -rearPhase * 0.55 + slamPhase * 0.25, rearPhase * 0.65, -rearPhase * 0.30, slamPhase * 0.42, 0.08);
            pRig.setHindlimbPose(pRig.leftHindLeg, rearPhase * 0.22, 0.15, 0, slamPhase * 0.30, 0.06);
            pRig.setHindlimbPose(pRig.rightHindLeg, rearPhase * 0.22, 0.15, 0, slamPhase * 0.30, 0.06);
        }

        sp.updateAnatomicalSkin(time, fighter, skinMode);
    }
});
