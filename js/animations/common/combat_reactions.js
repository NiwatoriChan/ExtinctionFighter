// ============================================================================
// js/animations/common/combat_reactions.js — Super Reactions, Knockdown, HitStun & 3D Guard Armor
// ============================================================================

function animateCombatReactions(fighter, rig, baseHipsY, act, time, dt) {
    const safeDt = Math.min(0.05, Math.max(0.001, dt || 0.016));

    if (rig.skeletonGroup) {
        rig.skeletonGroup.visible = false;
    }

    // Lissage permanent du flash émissif de l'armure ostéodermique vers 0.85 après une déviation
    if (rig.armorRig && rig.armorRig.mat && typeof rig.armorRig.mat.emissiveIntensity === 'number') {
        const curEmissive = rig.armorRig.mat.emissiveIntensity;
        if (Math.abs(curEmissive - 0.85) > 0.005) {
            rig.armorRig.mat.emissiveIntensity = curEmissive + (0.85 - curEmissive) * (1 - Math.exp(-9.5 * safeDt));
        }
    }

    // --- RÉACTION DE LA CIBLE PENDANT UN PRIMAL SUPER CINÉMATIQUE (3 BEATS) ---
    if (fighter.isSuperTarget && typeof superState !== 'undefined' && superState && superState.phase === 'cinematic') {
        const beat = superState.beat || 1;
        const vib = Math.sin(time * 58) * 0.14;
        if (beat <= 1) {
            // Beat 1 : Impact crânien / projection violente de la tête en arrière
            rig.hips.position.x = -0.35 + vib * 0.35;
            rig.hips.position.y = baseHipsY + 0.08;
            rig.hips.rotation.z = 0.18;
            rig.torso.rotation.z = 0.38 + vib;
            rig.neck.rotation.z = 0.48;
            rig.headGroup.rotation.z = 0.82 + vib * 1.3;
            rig.headGroup.rotation.y = Math.sin(time * 42) * 0.35;
            rig.jaw.rotation.z = -0.88;
        } else if (beat === 2) {
            // Beat 2 : Écrasement thoracique / torsion viscérale du buste
            rig.hips.position.x = -0.50 + vib * 0.45;
            rig.hips.position.y = baseHipsY * 0.78;
            rig.hips.rotation.z = -0.22;
            rig.torso.rotation.z = -0.52 + vib;
            rig.torso.rotation.y = Math.sin(time * 48) * 0.42;
            rig.neck.rotation.z = -0.36;
            rig.headGroup.rotation.z = -0.45;
            rig.jaw.rotation.z = -0.76;
            if (rig.legs) {
                if (rig.legs[0]) rig.legs[0].rotation.z = 0.58;
                if (rig.legs[1]) rig.legs[1].rotation.z = -0.52;
            }
        } else {
            // Beat 3 : Projection ascendante finale (launch recoil)
            rig.hips.position.x = -0.68;
            rig.hips.position.y = baseHipsY + 0.62;
            rig.hips.rotation.z = 0.46;
            rig.torso.rotation.z = 0.56 + vib;
            rig.neck.rotation.z = 0.48;
            rig.headGroup.rotation.z = 0.68;
            rig.jaw.rotation.z = -0.95;
            if (rig.legs) {
                if (rig.legs[0]) rig.legs[0].rotation.z = -0.62;
                if (rig.legs[1]) rig.legs[1].rotation.z = 0.52;
            }
        }
        if (rig.arms) {
            if (rig.arms[0]) rig.arms[0].rotation.z = -0.92 + vib;
            if (rig.arms[1]) rig.arms[1].rotation.z = 0.92 - vib;
        }
        if (rig.tailSegments) {
            rig.tailSegments.forEach((s, i) => {
                if (!s) return;
                s.rotation.z = beat >= 3 ? -0.45 : 0.30;
                s.rotation.y = Math.sin(time * 38 + i * 0.5) * 0.30;
            });
        }
        return true;
    }

    // État mort / aplati / décapité
    rig.headGroup.visible = !fighter.decapitated;
    if (fighter.flattened) {
        const currentScale = fighter.scale !== undefined ? fighter.scale : fighter.dino.scale;
        rig.root.scale.set(currentScale * 1.65, 0.12, currentScale * 1.65);
        return true;
    } else {
        const currentScale = fighter.scale !== undefined ? fighter.scale : fighter.dino.scale;
        rig.root.scale.setScalar(currentScale);
    }

    if (fighter.isDead) {
        const currentScale = fighter.scale !== undefined ? fighter.scale : ((fighter.dino && fighter.dino.scale) || 1.0);
        const airHeight = (fighter.y || 0) - (fighter.groundY || 0);
        if (airHeight > 0.35) {
            // Projection aérienne dramatique pendant le Slow-Mo K.O. / Extinction Finish
            const tumble = Math.min(1.0, airHeight * 0.45);
            rig.hips.position.y = baseHipsY;
            rig.hips.rotation.z = 0.48 + tumble * 0.35;
            rig.torso.rotation.z = 0.38;
            rig.neck.rotation.z = 0.32;
            rig.headGroup.rotation.z = 0.52;
            rig.jaw.rotation.z = -0.82;
            if (rig.legs) {
                if (rig.legs[0]) rig.legs[0].rotation.z = -0.58;
                if (rig.legs[1]) rig.legs[1].rotation.z = 0.48;
            }
            if (rig.arms) {
                if (rig.arms[0]) rig.arms[0].rotation.z = -0.85;
                if (rig.arms[1]) rig.arms[1].rotation.z = 0.78;
            }
            return true;
        }
        const groundY = Math.max(0.62 * currentScale, baseHipsY * 0.38);
        const rollDir = fighter.facing === 1 ? -1 : 1;
        rig.hips.position.y = groundY;
        rig.hips.rotation.x = 1.45 * rollDir;
        rig.hips.rotation.z = 0;
        rig.torso.rotation.z = 0.05;
        rig.neck.rotation.z = -0.08;
        rig.headGroup.rotation.z = -0.15;
        rig.jaw.rotation.z = -0.45;
        if (rig.legs) {
            if (rig.legs[0]) rig.legs[0].rotation.z = 0.45;
            if (rig.legs[1]) rig.legs[1].rotation.z = -0.35;
            if (rig.legs[2]) rig.legs[2].rotation.z = 0.28;
            if (rig.legs[3]) rig.legs[3].rotation.z = -0.22;
        }
        if (rig.arms) {
            if (rig.arms[0]) rig.arms[0].rotation.z = 0.35;
            if (rig.arms[1]) rig.arms[1].rotation.z = -0.25;
        }
        rig.tailSegments.forEach(s => {
            s.rotation.z = 0;
            s.rotation.y = 0;
        });
        return true;
    }

    // État étourdi ("ACHEVEZ-LE !")
    if (fighter.isDizzy) {
        rig.hips.rotation.z = Math.sin(time * 7) * 0.18;
        rig.hips.rotation.x = Math.cos(time * 5) * 0.12;
        rig.headGroup.rotation.z = -0.3 + Math.sin(time * 9) * 0.2;
        rig.jaw.rotation.z = -0.35;
        if (fighter.kneeling) rig.hips.position.y = baseHipsY * 0.55;
        return true;
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
        return true;
    }

    // --- SÉQUENCE KNOCKDOWN, GROUNDED STATE & WAKE-UP RECOVERY (UPDATE 2.0) ---
    if (fighter.combatController) {
        const cState = fighter.combatController.state;
        if (cState === CombatState.KNOCKDOWN_FALL) {
            const fallProg = Math.min(1.0, fighter.combatController.stateElapsed / 0.42);
            const currentScale = fighter.scale !== undefined ? fighter.scale : ((fighter.dino && fighter.dino.scale) || 1.0);
            const groundY = Math.max(0.62 * currentScale, baseHipsY * 0.38);
            const rollDir = fighter.facing === 1 ? -1 : 1;
            // Rebond amorti à l'impact au sol
            const impactBounce = Math.abs(Math.sin(fallProg * Math.PI * 2.2)) * (1 - fallProg) * 0.35;
            rig.hips.position.y = groundY + (baseHipsY - groundY) * (1 - fallProg) + impactBounce;
            rig.hips.position.x = -fallProg * 0.45;
            // Chute horizontale sur le flanc : pas de rotation verticale en Z, roulis propre en X
            rig.hips.rotation.x = fallProg * 1.45 * rollDir;
            rig.hips.rotation.z = (1 - fallProg) * 0.08;
            rig.torso.rotation.z = (1 - fallProg) * 0.12;
            rig.neck.rotation.z = -fallProg * 0.08;
            rig.headGroup.rotation.z = -fallProg * 0.15;
            rig.jaw.rotation.z = -0.40 * fallProg;
            if (rig.legs) {
                if (rig.legs[0]) rig.legs[0].rotation.z = fallProg * 0.45 + Math.sin(time * 28) * 0.15 * (1 - fallProg);
                if (rig.legs[1]) rig.legs[1].rotation.z = -fallProg * 0.35;
                if (rig.legs[2]) rig.legs[2].rotation.z = fallProg * 0.28;
                if (rig.legs[3]) rig.legs[3].rotation.z = -fallProg * 0.22;
            }
            if (rig.arms) {
                if (rig.arms[0]) rig.arms[0].rotation.z = fallProg * 0.35;
                if (rig.arms[1]) rig.arms[1].rotation.z = -fallProg * 0.25;
            }
            rig.tailSegments.forEach((s, i) => {
                s.rotation.z = (1 - fallProg) * 0.06;
                s.rotation.y = Math.sin(fallProg * Math.PI + i * 0.4) * 0.25;
            });
            return true;
        }
        if (cState === CombatState.GROUNDED_IDLE) {
            // Au sol : horizontal sur le flanc, respiration lourde de la cage thoracique, corps posé au sol
            const currentScale = fighter.scale !== undefined ? fighter.scale : ((fighter.dino && fighter.dino.scale) || 1.0);
            const groundY = Math.max(0.62 * currentScale, baseHipsY * 0.38);
            const rollDir = fighter.facing === 1 ? -1 : 1;
            const breath = Math.sin(time * 6);
            rig.hips.position.y = groundY + breath * 0.03;
            rig.hips.position.x = -0.45;
            rig.hips.rotation.x = (1.45 + breath * 0.02) * rollDir;
            rig.hips.rotation.z = 0; // Totalement horizontal
            rig.torso.scale.set(1, 1 + breath * 0.04, 1 + breath * 0.04);
            rig.torso.rotation.z = breath * 0.03;
            rig.neck.rotation.z = -0.08;
            rig.headGroup.rotation.z = -0.15 + Math.sin(time * 8) * 0.06;
            rig.headGroup.rotation.y = Math.cos(time * 5) * 0.08;
            rig.jaw.rotation.z = -0.35 - Math.abs(breath) * 0.12;
            if (rig.legs) {
                if (rig.legs[0]) rig.legs[0].rotation.z = 0.45 + Math.sin(time * 8) * 0.06;
                if (rig.legs[1]) rig.legs[1].rotation.z = -0.35 + Math.cos(time * 7) * 0.05;
                if (rig.legs[2]) rig.legs[2].rotation.z = 0.28;
                if (rig.legs[3]) rig.legs[3].rotation.z = -0.22;
            }
            if (rig.arms) {
                if (rig.arms[0]) rig.arms[0].rotation.z = 0.35;
                if (rig.arms[1]) rig.arms[1].rotation.z = -0.25;
            }
            rig.tailSegments.forEach((s, i) => {
                s.rotation.z = 0;
                s.rotation.y = Math.sin(time * 4 - i * 0.5) * 0.12;
            });
            return true;
        }
        if (cState === CombatState.WAKE_UP_STAND) {
            const currentScale = fighter.scale !== undefined ? fighter.scale : ((fighter.dino && fighter.dino.scale) || 1.0);
            const groundY = Math.max(0.62 * currentScale, baseHipsY * 0.38);
            const rollDir = fighter.facing === 1 ? -1 : 1;
            const wakeProg = Math.min(1.0, fighter.combatController.stateElapsed / 0.46);
            // Phase 1 (0 -> 0.55) : Appui puissant sur les pattes, Phase 2 (0.55 -> 1.0) : Redressement et rugissement
            const easeOut = 1 - Math.pow(1 - wakeProg, 2);
            rig.hips.position.y = groundY + (baseHipsY - groundY) * easeOut;
            rig.hips.position.x = -0.45 * (1 - easeOut);
            rig.hips.rotation.x = 1.45 * rollDir * (1 - easeOut);
            rig.hips.rotation.z = (1 - easeOut) * 0.08;
            rig.torso.rotation.z = wakeProg < 0.55 ? -0.25 : Math.sin((wakeProg - 0.55) / 0.45 * Math.PI) * 0.35;
            rig.neck.rotation.z = Math.sin(wakeProg * Math.PI) * 0.35;
            rig.headGroup.rotation.z = Math.sin(wakeProg * Math.PI) * 0.45;
            rig.headGroup.rotation.y = Math.sin(wakeProg * Math.PI * 3) * 0.22;
            rig.jaw.rotation.z = -Math.sin(wakeProg * Math.PI) * 0.85;
            if (rig.legs) {
                if (rig.legs[0]) rig.legs[0].rotation.z = (1 - easeOut) * 0.45;
                if (rig.legs[1]) rig.legs[1].rotation.z = -(1 - easeOut) * 0.35;
                if (rig.legs[2]) rig.legs[2].rotation.z = (1 - easeOut) * 0.28;
                if (rig.legs[3]) rig.legs[3].rotation.z = -(1 - easeOut) * 0.22;
            }
            if (rig.arms) {
                if (rig.arms[0]) rig.arms[0].rotation.z = (1 - easeOut) * 0.35;
                if (rig.arms[1]) rig.arms[1].rotation.z = -(1 - easeOut) * 0.25;
            }
            rig.tailSegments.forEach(s => {
                s.rotation.z = 0;
            });
            return true;
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
            return true;
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
        return true;
    }

    // --- POSTURES DE GARDE DIRECTIONNELLES 3-VOIES (GUARD_HIGH / GUARD_MID / GUARD_LOW) ---
    if (fighter.isBlocking) {
        const rawType = fighter.blockType || 'mid';
        const bType = (rawType === 'low' || act === 'crouch') ? 'low' : (rawType === 'high' ? 'high' : 'mid');
        const guardStamina = (fighter.guardStamina !== undefined && fighter.guardStamina !== null) ? fighter.guardStamina : 100;
        const isLowGuard = guardStamina < 30;
        const lowPulse = Math.sin(time * 24);
        const zoneColor = isLowGuard
            ? (lowPulse > 0 ? 0xef4444 : 0xb91c1c)
            : (bType === 'high' ? 0x38bdf8 : (bType === 'low' ? 0x10b981 : 0xf59e0b));
        const runeColor = isLowGuard
            ? 0xfca5a5
            : (bType === 'high' ? 0xbae6fd : (bType === 'low' ? 0xa7f3d0 : 0xfef08a));

        // Restauration de l'Armure Ostéodermique 3D par zone défendue
        if (rig.armorRig) {
            if (rig.armorRig.high) rig.armorRig.high.visible = (bType === 'high');
            if (rig.armorRig.mid) rig.armorRig.mid.visible = (bType === 'mid');
            if (rig.armorRig.low) rig.armorRig.low.visible = (bType === 'low');

            if (rig.armorRig.mat) {
                if (rig.armorRig.mat.color) rig.armorRig.mat.color.setHex(zoneColor);
                if (rig.armorRig.mat.emissive) rig.armorRig.mat.emissive.setHex(zoneColor);
                if (isLowGuard) {
                    const targetCrit = 1.15 + Math.abs(lowPulse) * 0.55;
                    const curI = typeof rig.armorRig.mat.emissiveIntensity === 'number' ? rig.armorRig.mat.emissiveIntensity : 0.85;
                    rig.armorRig.mat.emissiveIntensity = Math.max(curI, targetCrit);
                }
            }
            if (rig.armorRig.runeMat && rig.armorRig.runeMat.color) {
                rig.armorRig.runeMat.color.setHex(runeColor);
            }
        }

        if (rig.shieldMesh) {
            rig.shieldMesh.visible = true;
        }
        const shieldPulse = 1 + Math.sin(time * 18) * 0.05;
        if (typeof fighter.playGuard === 'function' && act !== 'walk') {
            fighter.playGuard(bType, 0.08);
        }

        if (bType === 'low') {
            // Garde Basse (Guard_Low) : Accroupi au ras du sol, bouclier émeraude élargi protégeant les pattes
            if (rig.shieldMesh) {
                rig.shieldMesh.position.set(0.65, 1.05, 0);
                rig.shieldMesh.scale.set(1.15 * shieldPulse, 0.62 * shieldPulse, 1.15 * shieldPulse);
                if (rig.shieldMesh.material && rig.shieldMesh.material.color) rig.shieldMesh.material.color.setHex(zoneColor);
            }
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
            return true;
        } else if (bType === 'high') {
            // Garde Haute (Guard_High) : Buste cabré vers le haut, dôme cyan protégeant le crâne et les airs
            if (rig.shieldMesh) {
                rig.shieldMesh.position.set(0.70, 2.75, 0);
                rig.shieldMesh.scale.set(1.05 * shieldPulse, 0.92 * shieldPulse, 1.05 * shieldPulse);
                rig.shieldMesh.rotation.z = 0.35;
                if (rig.shieldMesh.material && rig.shieldMesh.material.color) rig.shieldMesh.material.color.setHex(zoneColor);
            }
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
                return true;
            }
        } else {
            // Garde Médiane (Guard_Mid) : Ancrage défensif central, rempart doré vertical devant le torse
            if (rig.shieldMesh) {
                rig.shieldMesh.position.set(0.65, 1.95, 0);
                rig.shieldMesh.scale.set(0.92 * shieldPulse, 1.05 * shieldPulse, 1.05 * shieldPulse);
                if (rig.shieldMesh.material && rig.shieldMesh.material.color) rig.shieldMesh.material.color.setHex(zoneColor);
            }
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
                return true;
            }
        }
    }

    return false;
}
