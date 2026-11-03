// 5. SYSTÈME D'ANIMATION 3D DISTINCT PAR ESPÈCE (MOUVEMENTS, ATTAQUES, X-RAY & FATALITÉS)
function animateDino3DRig(fighter, time, dt) {
    const rig = fighter.rig;
    if (!rig) return;
    const id = fighter.dino.id;
    const act = fighter.action;
    const prog = fighter.actionDuration > 0 ? Math.min(1, fighter.actionTimer / fighter.actionDuration) : 0;

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

    const fighterImpl = FIGHTER_IMPLS[id] || {};
    const baseHipsY = fighterImpl.animBaseHipsY !== undefined ? fighterImpl.animBaseHipsY : 2.1;
    rig.hips.position.set(0, baseHipsY, 0);

    // Mise à jour du THREE.AnimationMixer et des volumes THREE.Box3 découplés (Update 2.0)
    if (fighter.combatController && dt > 0) {
        fighter.combatController.update(dt);
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

    // --- ANIMATION DE L'ATTAQUANT PENDANT LE X-RAY (VERROUILLÉ EN 3 PHASES) ---
    if (fighter.isXrayAttacker && xrayCinematicTimer > 0) {
        const phasePulse = Math.sin(time * 24);
        if (xrayStage === 1) {
            rig.hips.position.x = 0.55;
            rig.torso.rotation.z = -0.32 + phasePulse * 0.12;
            rig.headGroup.rotation.z = -0.35;
            rig.jaw.rotation.z = -0.75;
        } else if (xrayStage === 2) {
            rig.hips.position.x = 0.78;
            rig.torso.rotation.y = phasePulse * 0.45;
            rig.torso.rotation.z = 0.22;
        } else {
            rig.hips.position.x = 0.92;
            rig.hips.position.y = baseHipsY + 0.35;
            rig.torso.rotation.z = 0.45;
            rig.headGroup.rotation.z = 0.55;
            rig.jaw.rotation.z = -0.85;
        }
        return;
    }

    // --- ANIMATION ANATOMIQUE DU SQUELETTE X-RAY 2.0 EN 3 PHASES (CIBLE VERROUILLÉE) ---
    if (fighter.isXrayTarget) {
        rig.skeletonGroup.visible = true;
        rig.skinMeshes.forEach(m => {
            m.material.transparent = true;
            m.material.opacity = 0.14;
        });

        const xp = rig.xrayParts;
        if (xp) {
            xp.heart.scale.setScalar(1 + Math.sin(time * 28) * 0.28);
            xp.skullMat.color.setHex(xrayStage === 1 ? 0xef4444 : 0xf0f9ff);
            xp.ribMat.color.setHex(xrayStage === 2 ? 0xef4444 : 0xe0f2fe);
            xp.spineMat.color.setHex(xrayStage === 3 ? 0xef4444 : 0xe0f2fe);

            if (xrayStage === 1) {
                xp.skullGroup.rotation.z = Math.sin(time * 55) * 0.28;
                xp.jawBone.rotation.z = -0.45 + Math.sin(time * 40) * 0.2;
                rig.headGroup.rotation.z = 0.45;
            } else if (xrayStage === 2) {
                xp.ribCageGroup.scale.set(0.82 + Math.sin(time * 50) * 0.15, 0.85, 1.2);
                rig.torso.rotation.z = -0.25;
            } else if (xrayStage === 3) {
                xp.spineGroup.rotation.z = Math.sin(time * 60) * 0.35;
                rig.hips.position.y = baseHipsY + 0.55;
                rig.hips.rotation.z = 0.38;
            }
        }
        return;
    } else {
        rig.skeletonGroup.visible = false;
        if (rig.xrayParts) {
            rig.xrayParts.ribCageGroup.scale.set(1, 1, 1);
            rig.xrayParts.skullGroup.rotation.set(0, 0, 0);
            rig.xrayParts.spineGroup.rotation.set(0, 0, 0);
        }
        rig.skinMeshes.forEach(m => {
            m.material.transparent = false;
            m.material.opacity = 1.0;
        });
    }

    // État mort / aplati / décapité
    rig.headGroup.visible = !fighter.decapitated;
    if (fighter.flattened) {
        const currentScale = fighter.scale !== undefined ? fighter.scale : fighter.dino.scale;
        rig.root.scale.set(currentScale * 1.65, 0.12, currentScale * 1.65);
        return;
    } else {
        const currentScale = fighter.scale !== undefined ? fighter.scale : fighter.dino.scale;
        rig.root.scale.setScalar(currentScale);
    }

    if (fighter.isDead) {
        rig.hips.position.y = 0.65;
        rig.hips.rotation.z = Math.PI / 2.1;
        return;
    }

    // État étourdi ("ACHEVEZ-LE !")
    if (fighter.isDizzy) {
        rig.hips.rotation.z = Math.sin(time * 7) * 0.18;
        rig.hips.rotation.x = Math.cos(time * 5) * 0.12;
        rig.headGroup.rotation.z = -0.3 + Math.sin(time * 9) * 0.2;
        rig.jaw.rotation.z = -0.35;
        if (fighter.kneeling) rig.hips.position.y = baseHipsY * 0.55;
        return;
    }

    // --- VICTIME SECOUÉE PENDANT UNE CHOPE (SYNCHRONISATION ATTAQUANT / DÉFENSEUR) ---
    if (fighter.beingThrownTimer > 0) {
        const thrash = Math.sin(time * 48);
        rig.hips.position.y = baseHipsY * 0.88 + Math.abs(thrash) * 0.25;
        rig.hips.rotation.z = 0.38 + thrash * 0.25;
        rig.torso.rotation.y = thrash * 0.55;
        rig.headGroup.rotation.z = -thrash * 0.65;
        rig.jaw.rotation.z = -0.85;
        if (rig.legs) {
            if (rig.legs[0]) rig.legs[0].rotation.z = thrash * 0.85;
            if (rig.legs[1]) rig.legs[1].rotation.z = -thrash * 0.85;
        }
        if (rig.arms) {
            if (rig.arms[0]) rig.arms[0].rotation.z = -thrash * 0.95;
            if (rig.arms[1]) rig.arms[1].rotation.z = thrash * 0.95;
        }
        return;
    }

    // --- SÉQUENCE KNOCKDOWN, GROUNDED STATE & WAKE-UP RECOVERY (UPDATE 2.0) ---
    if (fighter.combatController) {
        const cState = fighter.combatController.state;
        if (cState === CombatState.KNOCKDOWN_FALL) {
            const fallProg = Math.min(1.0, fighter.combatController.stateElapsed / 0.42);
            // Rebond amorti à l'impact au sol
            const impactBounce = Math.abs(Math.sin(fallProg * Math.PI * 2.2)) * (1 - fallProg) * 0.45;
            rig.hips.position.y = Math.max(0.55, baseHipsY * (1 - fallProg * 0.72) + impactBounce);
            rig.hips.position.x = -fallProg * 0.45;
            rig.hips.rotation.z = fallProg * 1.52;
            rig.hips.rotation.x = Math.sin(fallProg * Math.PI) * 0.38;
            rig.torso.rotation.z = (1 - fallProg) * 0.45;
            rig.neck.rotation.z = (1 - fallProg) * 0.55;
            rig.jaw.rotation.z = -0.75 * (1 - fallProg * 0.4);
            if (rig.legs) {
                if (rig.legs[0]) rig.legs[0].rotation.z = fallProg * 0.85 + Math.sin(time * 28) * 0.25 * (1 - fallProg);
                if (rig.legs[1]) rig.legs[1].rotation.z = -fallProg * 0.65;
            }
            if (rig.arms) {
                if (rig.arms[0]) rig.arms[0].rotation.z = fallProg * 1.1;
                if (rig.arms[1]) rig.arms[1].rotation.z = -fallProg * 0.9;
            }
            rig.tailSegments.forEach((s, i) => {
                s.rotation.z = (1 - fallProg) * 0.45;
                s.rotation.y = Math.sin(fallProg * Math.PI + i * 0.4) * 0.55;
            });
            return;
        }
        if (cState === CombatState.GROUNDED_IDLE) {
            // Au sol : respiration lourde de la cage thoracique, spasmes des pattes et tête groggy
            const breath = Math.sin(time * 7);
            rig.hips.position.y = 0.58 + breath * 0.04;
            rig.hips.rotation.z = 1.52 + breath * 0.03;
            rig.hips.rotation.x = 0.25;
            rig.torso.scale.set(1, 1 + breath * 0.05, 1 + breath * 0.05);
            rig.headGroup.rotation.z = -0.22 + Math.sin(time * 9) * 0.14;
            rig.headGroup.rotation.y = Math.cos(time * 6) * 0.18;
            rig.jaw.rotation.z = -0.38 - Math.abs(breath) * 0.15;
            if (rig.legs) {
                if (rig.legs[0]) rig.legs[0].rotation.z = 0.65 + Math.sin(time * 11) * 0.12;
                if (rig.legs[1]) rig.legs[1].rotation.z = -0.45 + Math.cos(time * 9) * 0.10;
            }
            rig.tailSegments.forEach((s, i) => {
                s.rotation.y = Math.sin(time * 5 - i * 0.6) * 0.18;
            });
            return;
        }
        if (cState === CombatState.WAKE_UP_STAND) {
            const wakeProg = Math.min(1.0, fighter.combatController.stateElapsed / 0.46);
            // Phase 1 (0 -> 0.55) : Appui puissant sur les pattes, Phase 2 (0.55 -> 1.0) : Redressement et rugissement
            const easeOut = 1 - Math.pow(1 - wakeProg, 2);
            rig.hips.position.y = 0.58 + (baseHipsY - 0.58) * easeOut;
            rig.hips.rotation.z = 1.52 * (1 - easeOut);
            rig.hips.rotation.x = 0.25 * (1 - easeOut);
            rig.torso.rotation.z = wakeProg < 0.55 ? -0.45 : Math.sin((wakeProg - 0.55) / 0.45 * Math.PI) * 0.42;
            rig.neck.rotation.z = Math.sin(wakeProg * Math.PI) * 0.45;
            rig.headGroup.rotation.z = Math.sin(wakeProg * Math.PI) * 0.55;
            rig.headGroup.rotation.y = Math.sin(wakeProg * Math.PI * 3) * 0.28;
            rig.jaw.rotation.z = -Math.sin(wakeProg * Math.PI) * 0.85;
            if (rig.legs) {
                if (rig.legs[0]) rig.legs[0].rotation.z = (1 - easeOut) * 0.75;
                if (rig.legs[1]) rig.legs[1].rotation.z = -(1 - easeOut) * 0.65;
            }
            return;
        }
        if (cState === CombatState.BLOCK_DEFLECTED) {
            // Déviation suite à une parade adverse réussie : perte d'équilibre et recul du buste/mâchoire
            const deflProg = Math.min(1.0, fighter.combatController.stateElapsed / 0.36);
            const recoil = Math.sin(deflProg * Math.PI);
            const wobble = Math.sin(time * 36) * 0.18 * recoil;
            rig.hips.position.x = -recoil * 0.68;
            rig.hips.position.y = baseHipsY - recoil * 0.18;
            rig.hips.rotation.z = recoil * 0.28;
            rig.torso.rotation.z = recoil * 0.55;
            rig.torso.rotation.y = wobble;
            rig.neck.rotation.z = recoil * 0.52;
            rig.headGroup.rotation.z = recoil * 0.75;
            rig.headGroup.rotation.y = -wobble * 1.5;
            rig.jaw.rotation.z = -recoil * 0.78;
            if (rig.arms) {
                if (rig.arms[0]) rig.arms[0].rotation.z = -recoil * 1.15;
                if (rig.arms[1]) rig.arms[1].rotation.z = -recoil * 0.95;
            }
            if (rig.legs) {
                if (rig.legs[0]) rig.legs[0].rotation.z = -recoil * 0.55;
                if (rig.legs[1]) rig.legs[1].rotation.z = recoil * 0.45;
            }
            return;
        }
    }

    // --- RECUL VISCÉRAL ET RÉACTION DIRECTIONNELLE AUX COUPS (HIT_REACT_HIGH / MID / LOW) ---
    if (fighter.hitStun > 0) {
        const stunStrength = Math.min(1.0, fighter.hitStun * 3.8);
        const staggerVib = Math.sin(time * 52) * 0.10 * stunStrength;
        const reactZone = fighter.lastHitZone || 'mid';

        rig.hips.position.x = -stunStrength * 0.55;
        if (reactZone === 'low') {
            // Impact BAS : Les genoux/chevilles plient violemment, le bassin s'affaisse et le buste pique vers l'avant
            rig.hips.position.y = baseHipsY * (1 - stunStrength * 0.44);
            rig.hips.rotation.z = -stunStrength * 0.28;
            rig.torso.rotation.z = -stunStrength * 0.48 + staggerVib;
            rig.neck.rotation.z = -stunStrength * 0.35;
            rig.headGroup.rotation.z = -stunStrength * 0.42;
            if (rig.legs) {
                if (rig.legs[0]) rig.legs[0].rotation.z = stunStrength * 0.95;
                if (rig.legs[1]) rig.legs[1].rotation.z = -stunStrength * 0.75;
            }
        } else if (reactZone === 'high') {
            // Impact HAUT : Coup au crâne/menton projetant la tête et le buste vers le ciel
            rig.hips.position.y = baseHipsY + stunStrength * 0.12;
            rig.hips.rotation.z = stunStrength * 0.32;
            rig.torso.rotation.z = stunStrength * 0.58 + staggerVib;
            rig.neck.rotation.z = stunStrength * 0.55;
            rig.headGroup.rotation.z = stunStrength * 0.85;
            rig.headGroup.rotation.y = staggerVib * 2.2;
            if (rig.legs) {
                if (rig.legs[0]) rig.legs[0].rotation.z = -stunStrength * 0.45;
                if (rig.legs[1]) rig.legs[1].rotation.z = stunStrength * 0.35;
            }
        } else {
            // Impact MÉDIAN : Coup au thorax pliant l'abdomen en deux et projetant les épaules en arrière
            rig.hips.position.y = baseHipsY - stunStrength * 0.16;
            rig.hips.rotation.z = stunStrength * 0.18;
            rig.torso.rotation.z = stunStrength * 0.44 + staggerVib;
            rig.torso.rotation.y = staggerVib * 1.8;
            rig.neck.rotation.z = stunStrength * 0.38;
            rig.headGroup.rotation.z = stunStrength * 0.55;
            if (rig.legs) {
                if (rig.legs[0]) rig.legs[0].rotation.z = stunStrength * 0.45;
                if (rig.legs[1]) rig.legs[1].rotation.z = -stunStrength * 0.45;
            }
        }
        rig.jaw.rotation.z = -0.82 * stunStrength;

        if (rig.arms) {
            if (rig.arms[0]) rig.arms[0].rotation.z = -stunStrength * 0.85;
            if (rig.arms[1]) rig.arms[1].rotation.z = stunStrength * 0.85;
        }
        rig.tailSegments.forEach((s, i) => {
            s.rotation.z = stunStrength * 0.35;
            s.rotation.y = Math.sin(time * 35 + i) * 0.25 * stunStrength;
        });
        return;
    }

    // --- POSTURES DE GARDE DIRECTIONNELLES 3-VOIES (GUARD_HIGH / GUARD_MID / GUARD_LOW) ---
    if (fighter.isBlocking) {
        rig.shieldMesh.visible = true;
        const bType = fighter.blockType || 'mid';
        const shieldPulse = 1 + Math.sin(time * 18) * 0.05;
        if (typeof fighter.playGuard === 'function' && act !== 'walk') {
            fighter.playGuard(bType, 0.08);
        }

        if (bType === 'low' || act === 'crouch') {
            // Garde Basse (Guard_Low) : Accroupi au ras du sol, bouclier émeraude élargi protégeant les pattes
            rig.shieldMesh.position.set(0.65, 1.05, 0);
            rig.shieldMesh.scale.set(1.15 * shieldPulse, 0.62 * shieldPulse, 1.15 * shieldPulse);
            rig.shieldMesh.material.color.setHex(0x10b981); // Émeraude pour Garde Basse
            rig.hips.position.y = baseHipsY * 0.54;
            rig.hips.position.x = -0.15;
            rig.torso.rotation.z = -0.38;
            rig.neck.rotation.z = -0.25;
            rig.headGroup.rotation.z = -0.32;
            rig.jaw.rotation.z = -0.05;
            if (rig.legs) {
                if (rig.legs[0]) rig.legs[0].rotation.z = 0.58;
                if (rig.legs[1]) rig.legs[1].rotation.z = -0.58;
            }
            rig.tailSegments.forEach((s, i) => {
                s.rotation.y = (i + 1) * 0.28;
                s.rotation.z = -0.25;
            });
            return;
        } else if (bType === 'high') {
            // Garde Haute (Guard_High) : Buste cabré vers le haut, dôme cyan protégeant le crâne et les airs
            rig.shieldMesh.position.set(0.70, 2.75, 0);
            rig.shieldMesh.scale.set(1.05 * shieldPulse, 0.92 * shieldPulse, 1.05 * shieldPulse);
            rig.shieldMesh.rotation.z = 0.35;
            rig.shieldMesh.material.color.setHex(0x38bdf8); // Cyan pour Garde Haute
            rig.hips.position.x = -0.22;
            rig.hips.position.y = baseHipsY * (act === 'walk' ? 1.0 : 1.08);
            rig.torso.rotation.z = 0.28;
            rig.neck.rotation.z = 0.32;
            rig.headGroup.rotation.z = 0.30;
            rig.jaw.rotation.z = -0.04;
            if (rig.arms) {
                if (rig.arms[0]) rig.arms[0].rotation.z = 1.05;
                if (rig.arms[1]) rig.arms[1].rotation.z = 1.05;
            }
            if (act !== 'walk') {
                if (rig.legs) {
                    if (rig.legs[0]) rig.legs[0].rotation.z = 0.25;
                    if (rig.legs[1]) rig.legs[1].rotation.z = -0.35;
                }
                return;
            }
        } else {
            // Garde Médiane (Guard_Mid) : Ancrage défensif central, rempart doré vertical devant le torse
            rig.shieldMesh.position.set(0.65, 1.95, 0);
            rig.shieldMesh.scale.set(0.92 * shieldPulse, 1.05 * shieldPulse, 1.05 * shieldPulse);
            rig.shieldMesh.material.color.setHex(0xf59e0b); // Or pour Garde Médiane
            rig.hips.position.x = -0.28;
            rig.hips.position.y = baseHipsY * (act === 'walk' ? 1.0 : 0.92);
            rig.torso.rotation.z = -0.25;
            rig.neck.rotation.z = -0.28;
            rig.headGroup.rotation.z = -0.22;
            rig.jaw.rotation.z = -0.04;
            if (rig.arms) {
                if (rig.arms[0]) rig.arms[0].rotation.z = 0.75;
                if (rig.arms[1]) rig.arms[1].rotation.z = 0.75;
            }
            if (act !== 'walk') {
                if (rig.legs) {
                    if (rig.legs[0]) rig.legs[0].rotation.z = 0.32;
                    if (rig.legs[1]) rig.legs[1].rotation.z = -0.38;
                }
                return;
            }
        }
    }

    // --- RUÉE / DASH AÉRODYNAMIQUE (AVANT / ARRIÈRE) ---
    if (fighter.dashTimer > 0) {
        const dashProg = Math.min(1.0, fighter.dashTimer / 0.22);
        const lunge = Math.sin(dashProg * Math.PI);
        const dashDir = fighter.dashDir !== undefined && fighter.dashDir !== 0
            ? fighter.dashDir
            : (Math.sign(fighter.vx) || fighter.facing);
        const isBackDash = dashDir !== fighter.facing;

        // Animation spécifique au combattant si définie
        if (fighterImpl && fighterImpl.animateDash) {
            fighterImpl.animateDash({ fighter, rig, id, lunge, dashProg, isBackDash, baseHipsY, time });
            return;
        }

        if (isBackDash) {
            // Esquive / Retraite vive en arrière (Backdash) : Bond agile en retrait
            rig.hips.position.y = baseHipsY * (0.84 + lunge * 0.22);
            rig.hips.position.x = -lunge * 0.35;
            rig.torso.rotation.z = 0.26;
            rig.neck.rotation.z = 0.18;
            rig.headGroup.rotation.z = -0.12;
            rig.jaw.rotation.z = 0;
            if (rig.arms && rig.arms.length >= 2) {
                // Bras étendus vers l'arrière / équilibre
                rig.arms[0].rotation.z = 0.45;
                rig.arms[1].rotation.z = 0.45;
                rig.arms[0].rotation.y = 0.22;
                rig.arms[1].rotation.y = -0.22;
            }
            if (rig.legs) {
                if (rig.legs[0]) rig.legs[0].rotation.z = -0.45 + lunge * 0.65;
                if (rig.legs[1]) rig.legs[1].rotation.z = 0.35 - lunge * 0.55;
            }
            rig.tailSegments.forEach((s, i) => {
                s.rotation.z = -0.22;
                s.rotation.y = Math.sin(time * 24 - i * 0.5) * 0.18;
            });
            return;
        }

        // Ruée offensive vers l'avant (Forward Dash) : Aérodynamique et plongeante avec bras étendus
        rig.hips.position.y = baseHipsY * 0.74;
        rig.hips.position.x = lunge * 0.45;
        rig.torso.rotation.z = -0.48;
        rig.neck.rotation.z = -0.28;
        rig.headGroup.rotation.z = -0.18;
        rig.jaw.rotation.z = -0.35;
        if (rig.arms && rig.arms.length >= 2) {
            // Bras étendus vers l'avant en ruée aérodynamique
            rig.arms[0].rotation.z = -1.25;
            rig.arms[1].rotation.z = -1.25;
            rig.arms[0].rotation.y = 0.28;
            rig.arms[1].rotation.y = -0.28;
        }
        if (rig.specialParts) {
            if (rig.specialParts.leftWing) rig.specialParts.leftWing.rotation.x = -1.4;
            if (rig.specialParts.rightWing) rig.specialParts.rightWing.rotation.x = 1.4;
        }
        if (rig.legs) {
            if (rig.legs[0]) rig.legs[0].rotation.z = 1.05 * Math.sin(time * 28);
            if (rig.legs[1]) rig.legs[1].rotation.z = -1.05 * Math.sin(time * 28);
        }
        rig.tailSegments.forEach((s, i) => {
            s.rotation.z = 0.18;
            s.rotation.y = Math.sin(time * 22 - i * 0.5) * 0.22;
        });
        return;
    }

    // --- GESTION DU SAUT LIBRE (HORS ATTAQUE) ---
    const isAttackAction = act === 'light' || act === 'light2' || act === 'heavy' || act === 'special' || act === 'special2' || act === 'xray' ||
        act === 'fwd_light' || act === 'low_light' || act === 'air_light' ||
        act === 'fwd_heavy' || act === 'anti_air' || act === 'air_heavy' ||
        act === 'up_light' || act === 'low_heavy' || act === 'back_light' ||
        act === 'throw' || act === 'throw_whiff';

    if (fighter.y > 0.05 && !isAttackAction && !fighter.isFlying) {
        const isRising = fighter.vy > 0;
        rig.hips.position.y = baseHipsY + 0.18;
        rig.torso.rotation.z = isRising ? 0.24 : -0.26;
        rig.neck.rotation.z = isRising ? 0.20 : -0.18;
        rig.headGroup.rotation.z = isRising ? 0.25 : -0.18;
        if (rig.legs) {
            if (rig.legs[0]) rig.legs[0].rotation.z = isRising ? 0.48 : 0.22;
            if (rig.legs[1]) rig.legs[1].rotation.z = isRising ? -0.38 : -0.22;
        }
    }

    // --- COURBES BIOMÉCANIQUES D'ATTAQUE (ANTICIPATION COIL, SNAP EXPLOSIF, FOLLOW-THROUGH) ---
    let strike = 0;
    let anticipate = 0;
    if (prog < 0.25) {
        // Phase 1 : Armement prononcé (Coil / Windup)
        anticipate = Math.sin((prog / 0.25) * (Math.PI * 0.5));
        strike = -anticipate * 0.42;
    } else if (prog < 0.50) {
        // Phase 2 : Détente explosive non-linéaire à l'impact (Snap actif)
        const p = (prog - 0.25) / 0.25;
        strike = -0.42 + 1.54 * Math.pow(Math.sin(p * (Math.PI * 0.5)), 0.72);
    } else {
        // Phase 3 : Récupération (Follow-through & retour au neutre)
        const p = (prog - 0.50) / 0.50;
        strike = 1.12 * Math.cos(p * (Math.PI * 0.5));
    }
    const swing = Math.max(0, strike);

    if (fighter._walkAnimTime === undefined) {
        fighter._walkAnimTime = time;
    }
    const isWalk = act === 'walk';
    // Détection du recul : le déplacement effectif est opposé à l'orientation du combattant
    const isMovingBackward = isWalk && (fighter.vx * fighter.facing < -0.05);

    if (isWalk) {
        const safeDt = Math.min(0.05, Math.max(0, dt || 0.016));
        const walkSpeedRef = (fighter.dino && fighter.dino.walkSpeed) || 7.5;
        const speedScale = Math.max(0.45, Math.min(1.8, Math.abs(fighter.vx) / walkSpeedRef));
        const dirSign = isMovingBackward ? -1 : 1;
        fighter._walkAnimTime += safeDt * speedScale * dirSign;
    } else {
        fighter._walkAnimTime = time;
    }

    const animTime = isWalk ? fighter._walkAnimTime : time;

    // Contexte enrichi transmis aux combattants
    const animCtx = { fighter, rig, id, act, prog, strike, swing, anticipate, baseHipsY, time: animTime, dt, isWalk, isMovingBackward };

    // --- 1. ANIMATIONS D'ATTENTE (IDLE), MARCHE (WALK), VOL (FLY), SAUT (JUMP) & SPRINT ---
    if (act === 'idle' || act === 'walk' || act === 'crouch' || act === 'fly' || (fighter && fighter.isFlying) || (act === 'jump' && fighter && fighter.isFlying)) {
        animCtx.isWalk = isWalk;
        if (fighter.animationController) {
            if (!isWalk && act === 'idle') {
                fighter.playIdle(0.15);
            } else if (isWalk) {
                if (fighter.isSprinting || fighter.sprintDuration > 0.45) {
                    fighter.playSprint(0.10);
                } else if (fighter.sprintDuration > 0.18) {
                    fighter.playRun(0.12);
                } else {
                    fighter.playWalk(0.15, isMovingBackward ? -1.0 : 1.0);
                }
            }
        }
        if (fighterImpl.animateIdle) fighterImpl.animateIdle(animCtx);

        // En Sprint / Course rapide : inclinaison aérodynamique de prédateur en chasse
        if (isWalk && (fighter.isSprinting || fighter.sprintDuration > 0.25)) {
            const sprintBoost = Math.min(1.0, fighter.sprintDuration * 1.8);
            rig.torso.rotation.z -= 0.18 * sprintBoost;
            rig.neck.rotation.z -= 0.14 * sprintBoost;
            rig.headGroup.rotation.z += 0.16 * sprintBoost;
        } else if (isWalk && isMovingBackward) {
            // En recul : posture défensive / alerte plus redressée
            rig.torso.rotation.z += 0.08;
            rig.neck.rotation.z += 0.05;
        }

        if (act === 'crouch') {
            rig.hips.position.y = baseHipsY * 0.62;
            rig.torso.rotation.z = -0.26;
            if (rig.legs) {
                if (rig.legs[0]) rig.legs[0].rotation.z = 0.42;
                if (rig.legs[1]) rig.legs[1].rotation.z = -0.42;
            }
        }
        return;
    }

    // --- 2. CHORÉGRAPHIES D'ATTAQUES ULTRA-LISIBLES (TRAJECTOIRES, APPUIS & EFFETS VISUELS) ---
    if (isAttackAction) {
        // A. SOCLE DIRECTIONNEL UNIVERSEL (COMMAND NORMALS & ZONES HIGH / MID / LOW)
        if (act === 'light') {
            // Coup Léger 1 : Frappe vive diagonale du côté avant gauche
            rig.hips.position.x = strike * 0.55;
            rig.hips.position.y = baseHipsY - anticipate * 0.12;
            rig.torso.rotation.z = -strike * 0.36;
            rig.torso.rotation.y = strike * 0.32;
            rig.neck.rotation.z = -strike * 0.34;
            rig.headGroup.rotation.z = -strike * 0.36;
            rig.headGroup.rotation.y = strike * 0.28;
            rig.jaw.rotation.z = -swing * 0.85;
            if (rig.arms && rig.arms[0]) rig.arms[0].rotation.z = strike * 1.35;
        } else if (act === 'light2') {
            // Coup Léger 2 (Combo 1-2) : Frappe croisée opposée du côté droit avec torsion du buste
            rig.hips.position.x = strike * 0.72;
            rig.torso.rotation.z = -strike * 0.45;
            rig.torso.rotation.y = -strike * 0.42;
            rig.neck.rotation.z = -strike * 0.42;
            rig.headGroup.rotation.z = -strike * 0.48;
            rig.headGroup.rotation.y = -strike * 0.38;
            rig.jaw.rotation.z = -swing * 1.10;
            if (rig.arms && rig.arms[1]) rig.arms[1].rotation.z = strike * 1.45;
            rig.tailSegments.forEach(s => { s.rotation.y = strike * 0.52; });
        } else if (act === 'up_light') {
            // Direction HAUT ⬆️ (Uppercut / Morsure haute ascendante - Zone HIGH)
            rig.hips.position.y = baseHipsY - anticipate * 0.28 + swing * 0.78;
            rig.hips.position.x = strike * 0.32;
            rig.hips.rotation.z = strike * 0.25;
            rig.torso.rotation.z = strike * 0.64;
            rig.neck.rotation.z = strike * 0.70;
            rig.headGroup.rotation.z = strike * 0.88;
            rig.jaw.rotation.z = -swing * 1.30;
            if (rig.arms) {
                if (rig.arms[0]) rig.arms[0].rotation.z = strike * 1.90;
                if (rig.arms[1]) rig.arms[1].rotation.z = strike * 1.90;
            }
        } else if (act === 'anti_air') {
            // Direction HAUT / ARRIÈRE ⬆️ (Anti-Air Launcher céleste - Zone HIGH)
            rig.hips.position.y = baseHipsY - anticipate * 0.38 + swing * 1.05;
            rig.hips.position.x = strike * 0.42;
            rig.hips.rotation.z = strike * 0.38;
            rig.torso.rotation.z = strike * 0.72;
            rig.neck.rotation.z = strike * 0.75;
            rig.headGroup.rotation.z = strike * 0.95;
            rig.jaw.rotation.z = -swing * 1.40;
            if (rig.arms) {
                if (rig.arms[0]) rig.arms[0].rotation.z = strike * 2.05;
                if (rig.arms[1]) rig.arms[1].rotation.z = strike * 2.05;
            }
            rig.tailSegments.forEach(s => { s.rotation.z = -strike * 0.62; });
        } else if (act === 'fwd_light') {
            // Direction AVANT ➡️ (Poke / Percée horizontale longue portée - Zone MID)
            rig.hips.position.x = strike * 1.18;
            rig.hips.position.y = baseHipsY * 0.86;
            rig.torso.rotation.z = -strike * 0.44;
            rig.neck.rotation.z = -strike * 0.48;
            rig.headGroup.rotation.z = -strike * 0.32;
            rig.jaw.rotation.z = -swing * 0.95;
            if (rig.arms) {
                if (rig.arms[0]) rig.arms[0].rotation.z = strike * 1.32;
                if (rig.arms[1]) rig.arms[1].rotation.z = strike * 1.32;
            }
        } else if (act === 'fwd_heavy') {
            // Direction AVANT LOURD ➡️ (Charge bélier massive vers l'avant - Zone MID)
            rig.hips.position.x = strike * 1.52;
            rig.hips.position.y = baseHipsY * 0.84;
            rig.torso.rotation.z = -strike * 0.54;
            rig.neck.rotation.z = -strike * 0.56;
            rig.headGroup.rotation.z = -strike * 0.42;
            rig.jaw.rotation.z = -swing * 1.15;
        } else if (act === 'low_light') {
            // Direction BAS ⬇️ (Balayage ras du sol, fauchage des chevilles - Zone LOW)
            rig.hips.position.y = baseHipsY * (0.48 - swing * 0.08);
            rig.hips.position.x = strike * 0.45;
            rig.torso.rotation.z = -0.48;
            rig.torso.rotation.y = Math.cos(prog * Math.PI) * 0.88;
            rig.headGroup.rotation.z = -0.58;
            rig.headGroup.position.y = rig.restPose ? rig.restPose.headPos.y - 0.25 : -0.25;
            rig.jaw.rotation.z = -swing * 0.88;
            rig.tailSegments.forEach((s, i) => {
                s.rotation.y = Math.sin(prog * Math.PI) * (1.05 + i * 0.1);
                s.rotation.z = -0.35;
            });
            if (rig.legs && rig.legs[0]) rig.legs[0].rotation.y = strike * 1.25;
        } else if (act === 'low_heavy') {
            // Direction BAS LOURD ⬇️ (Écrasement pilonnage lourd au ras du sol - Zone LOW)
            const slamDrop = prog < 0.28 ? (prog / 0.28) * 0.45 : -swing * 0.52;
            rig.hips.position.y = baseHipsY * (0.65 + slamDrop);
            rig.hips.position.x = strike * 0.55;
            rig.torso.rotation.z = prog < 0.28 ? 0.32 : -0.62;
            rig.headGroup.rotation.z = prog < 0.28 ? 0.25 : -0.78;
            rig.headGroup.position.y = rig.restPose ? rig.restPose.headPos.y - 0.32 : -0.32;
            rig.jaw.rotation.z = -swing * 1.20;
            if (rig.arms) {
                if (rig.arms[0]) rig.arms[0].rotation.z = -strike * 1.55;
                if (rig.arms[1]) rig.arms[1].rotation.z = -strike * 1.55;
            }
            rig.tailSegments.forEach(s => { s.rotation.z = -0.45; s.rotation.y = -strike * 1.05; });
        } else if (act === 'back_light') {
            // Direction ARRIÈRE ⬅️ (Coup défensif en recul d'esquive - Zone MID)
            rig.hips.position.x = -strike * 0.82;
            rig.hips.position.y = baseHipsY * 0.92;
            rig.torso.rotation.z = strike * 0.36;
            rig.headGroup.rotation.z = strike * 0.26;
            rig.jaw.rotation.z = -swing * 0.78;
            if (rig.arms && rig.arms[0]) rig.arms[0].rotation.z = strike * 1.25;
        } else if (act === 'air_light' || act === 'air_heavy') {
            // Attaque aérienne (Piqué Plongeant vers le sol - Zone HIGH / OVERHEAD)
            const isHeavyAir = act === 'air_heavy';
            rig.torso.rotation.z = isHeavyAir ? -0.78 : -0.62;
            rig.neck.rotation.z = -0.35;
            rig.headGroup.rotation.z = -0.45;
            rig.jaw.rotation.z = -swing * 1.05;
            if (rig.arms) {
                if (rig.arms[0]) rig.arms[0].rotation.z = strike * 1.45;
                if (rig.arms[1]) rig.arms[1].rotation.z = strike * 1.45;
            }
            if (rig.legs) {
                if (rig.legs[0]) rig.legs[0].rotation.z = strike * 1.15;
                if (rig.legs[1]) rig.legs[1].rotation.z = strike * 0.95;
            }
        } else if (act === 'throw') {
            // Chope (Grapple au corps à corps : morsure/saisie -> secousse violente -> projection)
            if (prog < 0.30) {
                rig.hips.position.x = strike * 1.05;
                rig.torso.rotation.z = -0.38;
                rig.jaw.rotation.z = -1.35;
            } else if (prog < 0.72) {
                const shake = Math.sin(prog * 36);
                rig.hips.position.x = 0.95;
                rig.torso.rotation.y = shake * 0.58;
                rig.torso.rotation.z = 0.38;
                rig.headGroup.rotation.y = shake * 0.65;
                rig.headGroup.rotation.z = Math.cos(prog * 36) * 0.35;
                rig.jaw.rotation.z = -0.22;
            } else {
                rig.hips.position.x = 0.65;
                rig.torso.rotation.z = 0.52;
                rig.headGroup.rotation.z = 0.65;
                rig.jaw.rotation.z = -0.95;
            }
        } else if (act === 'throw_whiff') {
            // Chope ratée dans le vide (Whiff déséquilibré vers l'avant)
            const whiffArc = Math.sin(prog * Math.PI);
            rig.hips.position.x = whiffArc * 0.75;
            rig.hips.position.y = baseHipsY - whiffArc * 0.28;
            rig.torso.rotation.z = -whiffArc * 0.48;
            rig.headGroup.rotation.z = -whiffArc * 0.35;
            rig.headGroup.rotation.y = Math.sin(prog * Math.PI * 2) * 0.32;
            rig.jaw.rotation.z = -whiffArc * 0.75;
        }

        // B. DÉLÉGATION AUX CHORÉGRAPHIES SPÉCIFIQUES À L'ESPÈCE
        const isCustomNormal = fighterImpl.hasCustomDirectionals;
        const supportedByFighter = act === 'light' || act === 'light2' || act === 'heavy' || act === 'fwd_heavy' || act === 'fwd_light' || act === 'low_light' || act === 'low_heavy' || act === 'anti_air' || act === 'up_light' || act === 'back_light' || act === 'throw' || act === 'air_light' || act === 'air_heavy' || act === 'special' || act === 'special2';
        if (fighterImpl.animateAttack && act !== 'throw_whiff' && (isCustomNormal ? supportedByFighter : (act === 'light' || act === 'heavy' || act === 'special' || act === 'special2'))) {
            fighterImpl.animateAttack(animCtx);
        }

        // C. ENRICHISSEMENT BIOMÉCANIQUE POST-CHORÉGRAPHIE (APPUIS DES JAMBES, SQUASH & STRETCH, MOMENTUM & STALE FATIGUE)
        // 1. Travail des jambes et ancrage dynamique (évite les jambes figées pendant les frappes)
        if (rig.legs && rig.legs.length >= 2) {
            const legsUnanimated = Math.abs(rig.legs[0].rotation.z) < 0.01 && Math.abs(rig.legs[1].rotation.z) < 0.01;
            if (legsUnanimated) {
                if (act === 'up_light' || act === 'anti_air') {
                    // Détente verticale des jarrets vers le ciel
                    rig.legs[0].rotation.z = -strike * 0.65;
                    rig.legs[1].rotation.z = -strike * 0.55;
                } else if (act === 'low_light' || act === 'low_heavy') {
                    // Grand écart / flexion basse d'écrasement
                    rig.legs[0].rotation.z = 0.68 + swing * 0.25;
                    rig.legs[1].rotation.z = -0.68 - swing * 0.25;
                } else if (act === 'back_light') {
                    // Pas de retrait défensif
                    rig.legs[0].rotation.z = -strike * 0.55;
                    rig.legs[1].rotation.z = strike * 0.65;
                } else {
                    // Fente avant offensive (jambe avant fléchie en appui, jambe arrière en poussée)
                    const lungeStep = (act === 'fwd_light' || act === 'fwd_heavy' || act === 'heavy') ? 0.72 : 0.48;
                    rig.legs[0].rotation.z = strike * lungeStep;
                    rig.legs[1].rotation.z = -strike * lungeStep;
                    if (rig.legs.length >= 4) {
                        rig.legs[2].rotation.z = -strike * lungeStep * 0.85;
                        rig.legs[3].rotation.z = strike * lungeStep * 0.85;
                    }
                }
            }
        }

        // 2. Squash & Stretch anatomique sur l'organe de frappe actif pendant l'impact (rend la hitbox évidente)
        if (swing > 0.25) {
            const impactPop = 1 + (swing - 0.25) * 0.20;
            if (act === 'up_light' || act === 'anti_air' || act === 'fwd_light' || act === 'throw' || id === 'trex' || id === 'pachy' || id === 'terabird' || id === 'quetzal' || id === 'postosuchus' || id === 'smilodon') {
                if (!fighter.isXrayTarget && matchState !== 'fatality_anim') {
                    rig.headGroup.scale.setScalar(impactPop);
                }
            }
            if (rig.arms && rig.arms.length > 0 && (id === 'therizinosaurus' || id === 'spinosaurus' || id === 'giantsloth' || id === 'pulmonoscorpius')) {
                rig.arms.forEach(a => { if (a) a.scale.setScalar(impactPop); });
            }
            if (rig.tailSegments && rig.tailSegments.length > 0 && (act === 'low_light' || act === 'low_heavy' || id === 'ankylosaurus' || id === 'stegosaurus' || id === 'apato')) {
                const lastTail = rig.tailSegments[rig.tailSegments.length - 1];
                if (lastTail) lastTail.scale.setScalar(1 + (swing - 0.25) * 0.26);
            }
        }

        // 3. Amplification cinématique du Momentum (Attaque lancée à pleine vitesse)
        if (fighter.combatController && fighter.combatController.lastAttackSpeed > 4.2 && act !== 'back_light') {
            const momFactor = Math.min(1.0, (fighter.combatController.lastAttackSpeed - 4.2) / 6.0);
            rig.hips.position.x += swing * 0.42 * momFactor;
            rig.torso.rotation.z -= swing * 0.16 * momFactor;
        }

        // 4. Limiteur d'avancée visuelle du bassin (Visual Body Blocker) :
        // Empêche le maillage 3D de pénétrer dans le corps adverse lors d'une fente au corps-à-corps
        const opponent = (typeof fighter1 !== 'undefined' && typeof fighter2 !== 'undefined')
            ? (fighter === fighter1 ? fighter2 : fighter1)
            : null;
        if (opponent && rig.hips.position.x > 0.25 && Math.abs(fighter.y - opponent.y) < 2.2) {
            const centerDist = Math.abs(fighter.x - opponent.x);
            const bodyClearance = ((fighter.bodyRadius || 1.32) + (opponent.bodyRadius || 1.32)) * 0.82;
            const maxLocalForwardX = Math.max(0.28, (centerDist - bodyClearance) / (fighter.dino.scale || 1.0));
            if (rig.hips.position.x > maxLocalForwardX) {
                rig.hips.position.x = maxLocalForwardX;
            }
        }

        // 5. Expression corporelle de Fatigue (Stale-Move Negation : coup répété / usé)
        if (fighter.staleMultiplier !== undefined && fighter.staleMultiplier < 1.0 && prog > 0.48) {
            const fatigue = (1.0 - fighter.staleMultiplier) * ((prog - 0.48) / 0.52);
            rig.hips.position.y -= fatigue * 0.28;
            rig.torso.rotation.z -= fatigue * 0.25;
            rig.headGroup.rotation.z -= fatigue * 0.35;
            rig.jaw.rotation.z = Math.min(rig.jaw.rotation.z, -0.45 * fatigue - Math.abs(Math.sin(time * 18)) * 0.22 * fatigue);
        }

        return;
    }

    // --- 3. CHORÉGRAPHIES DE FATALITÉS 3D UNIQUES PAR ESPÈCE ---
    if (act === 'fatality') {
        if (fighterImpl.animateFatality) fighterImpl.animateFatality(animCtx);
    }
}
