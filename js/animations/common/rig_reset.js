// ============================================================================
// js/animations/common/rig_reset.js — 3D Rig Rest-Pose Reset & Emissive Flash
// ============================================================================

function resetDino3DRig(fighter, rig, baseHipsY, time, dt) {
    // 1. RÉINITIALISATION COMPLÈTE À LA POSE DE REPOS (REST POSE) À CHAQUE FRAME
    rig.hips.rotation.set(0, 0, 0);
    rig.torso.rotation.set(0, 0, 0);
    rig.neck.rotation.set(0, 0, 0);
    rig.headGroup.rotation.set(0, 0, 0);
    rig.jaw.rotation.set(0, 0, 0);

    rig.torso.scale.set(1, 1, 1);
    rig.neck.scale.set(1, 1, 1);
    if (!fighter.isXrayTarget && matchState !== 'fatality_anim') {
        rig.headGroup.scale.set(1, 1, 1);
    }
    rig.jaw.scale.set(1, 1, 1);

    if (rig.restPose) {
        rig.torso.position.copy(rig.restPose.torsoPos);
        rig.neck.position.copy(rig.restPose.neckPos);
        rig.headGroup.position.copy(rig.restPose.headPos);
        rig.jaw.position.copy(rig.restPose.jawPos);
    }

    if (rig.arms) {
        rig.arms.forEach((a, i) => {
            if (!a) return;
            a.rotation.set(0, 0, 0);
            a.scale.set(1, 1, 1);
            if (rig.restPose && rig.restPose.armsPos && rig.restPose.armsPos[i]) {
                a.position.copy(rig.restPose.armsPos[i]);
            }
        });
    }
    if (rig.legs) {
        rig.legs.forEach((l, i) => {
            if (!l) return;
            l.rotation.set(0, 0, 0);
            l.scale.set(1, 1, 1);
            if (rig.restPose && rig.restPose.legsPos && rig.restPose.legsPos[i]) {
                l.position.copy(rig.restPose.legsPos[i]);
            }
        });
    }
    if (rig.tailSegments) {
        rig.tailSegments.forEach((s, i) => {
            if (!s) return;
            s.rotation.set(0, 0, 0);
            s.scale.set(1, 1, 1);
            if (rig.restPose && rig.restPose.tailPos && rig.restPose.tailPos[i]) {
                s.position.copy(rig.restPose.tailPos[i]);
            }
        });
    }
    if (rig.specialParts) {
        if (rig.specialParts.neckSegments) {
            rig.specialParts.neckSegments.forEach((n, i) => {
                n.rotation.set(0, 0, 0);
                if (rig.restPose && rig.restPose.neckSegmentsPos && rig.restPose.neckSegmentsPos[i]) {
                    n.position.copy(rig.restPose.neckSegmentsPos[i]);
                }
            });
        }
        if (rig.specialParts.sonicCrest && matchState !== 'fatality_anim') {
            rig.specialParts.sonicCrest.scale.set(1, 1, 1);
        }
        if (rig.specialParts.stinger) {
            rig.specialParts.stinger.rotation.set(0, 0, 0);
        }
        if (rig.specialParts.leftWing) {
            rig.specialParts.leftWing.rotation.set(0, 0, 0);
        }
        if (rig.specialParts.rightWing) {
            rig.specialParts.rightWing.rotation.set(0, 0, 0);
        }
    }

    const isBlocking = Boolean(fighter.isBlocking);
    const bType = fighter.blockType || 'mid';

    if (rig.armorRig) {
        rig.armorRig.high.visible = false;
        rig.armorRig.mid.visible = false;
        rig.armorRig.low.visible = false;
    }

    rig.shieldMesh.visible = isBlocking;
    if (isBlocking) {
        if (bType === 'high') {
            rig.shieldMesh.position.set(0.8, 2.5, 0);
            rig.shieldMesh.scale.set(1.15, 1.15, 1.15);
        } else if (bType === 'low') {
            rig.shieldMesh.position.set(0.4, 0.9, 0);
            rig.shieldMesh.scale.set(1.35, 0.85, 1.25);
        } else {
            rig.shieldMesh.position.set(0.6, 1.9, 0);
            rig.shieldMesh.scale.set(1.35, 1.35, 1.25);
        }
    }

    rig.hips.position.set(0, baseHipsY, 0);

    // Mise à jour du THREE.AnimationMixer et des volumes THREE.Box3 découplés (Update 2.0)
    if (fighter.combatController && dt > 0) {
        fighter.combatController.update(dt);
    }

    if (rig.specialParts && typeof rig.specialParts.resetQuetzalPose === 'function') {
        rig.specialParts.resetQuetzalPose(time);
    }

    // Flash lumineux d'impact (blanc sur coup reçu, cyan sur relevé invulnérable)
    const isWakeUpInvuln = fighter.combatController && fighter.combatController.state === CombatState.WAKE_UP_STAND;
    if (fighter.hitStun > 0.08) {
        rig.bodyMat.emissive.setHex(0xffffff);
        rig.bodyMat.emissiveIntensity = 0.75;
    } else if (isWakeUpInvuln) {
        rig.bodyMat.emissive.setHex(0x38bdf8);
        rig.bodyMat.emissiveIntensity = 0.35 + Math.sin(time * 28) * 0.2;
    } else {
        rig.bodyMat.emissive.setHex(0x000000);
        rig.bodyMat.emissiveIntensity = 0;
    }
}
