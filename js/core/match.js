// 10. DÉMARRAGE DU MATCH ET GESTION DES ROUNDS
function startMatch() {
    sfx.init();
    sfx.playGong();
    initBattle3DScene();

    const p1Dino = DINO_ROSTER[p1ChoiceIndex] || DINO_ROSTER[0];
    let p2Dino = DINO_ROSTER[p2ChoiceIndex] || DINO_ROSTER[1];
    let p2Skin = p2SkinIndex;

    // En mode campagne, le jeu assigne automatiquement l'adversaire et son arène thématique
    if (gameMode === 'campaign') {
        if (campaignStage === 6 && typeof DRAGON_BOSS !== 'undefined' && DRAGON_BOSS) {
            p2Dino = DRAGON_BOSS;
            p2Skin = 0;
            currentArena = 'dragonlair';
        } else if (campaignOpponents && campaignOpponents[campaignStage - 1] !== undefined) {
            // S'assurer que l'adversaire de l'étape n'est pas le combattant choisi par le joueur
            if (campaignOpponents[campaignStage - 1] === p1ChoiceIndex) {
                for (let k = 0; k < DINO_ROSTER.length; k++) {
                    if (k !== p1ChoiceIndex && !DINO_ROSTER[k].isBoss && (!DINO_ROSTER[k].isUnlockable || isFighterUnlocked(DINO_ROSTER[k].id))) {
                        campaignOpponents[campaignStage - 1] = k;
                        break;
                    }
                }
            }
            p2Dino = DINO_ROSTER[campaignOpponents[campaignStage - 1]];
            p2Skin = 0;
            currentArena = typeof getThemedArenaForFighter === 'function' ? getThemedArenaForFighter(p2Dino.id) : 'volcano';
        }
    } else {
        const arenaSelectEl = document.getElementById('arenaSelect');
        if (arenaSelectEl && arenaSelectEl.value && !currentArena) {
            currentArena = arenaSelectEl.value;
        }
        if (!currentArena) currentArena = 'volcano';
    }

    // Difficulté IA en campagne : calibrée sur 'easy' pour un parcours exaltant et un boss Drak'Zul battable
    if (gameMode === 'campaign') {
        aiDifficulty = 'easy';
    } else {
        const aiDiffEl = document.getElementById('aiDifficulty');
        if (aiDiffEl) aiDifficulty = aiDiffEl.value;
    }

    buildArena3D(currentArena);

    if (fighter1) fighter1.destroy();
    if (fighter2) fighter2.destroy();

    fighter1 = new Fighter3D(p1Dino, true, p1SkinIndex);
    fighter2 = new Fighter3D(p2Dino, false, p2Skin);
    roundNumber = 1;

    isMatchPaused = false;
    const pauseModal = document.getElementById('pauseModal');
    if (pauseModal) pauseModal.classList.add('hidden');

    const selScreen = document.getElementById('selectScreen');
    if (selScreen) selScreen.classList.add('hidden');
    const arScreen = document.getElementById('arenaScreen');
    if (arScreen) arScreen.classList.add('hidden');
    const mmScreen = document.getElementById('mainMenu');
    if (mmScreen) mmScreen.classList.add('hidden');
    const btScreen = document.getElementById('battleScreen');
    if (btScreen) {
        btScreen.classList.remove('hidden');
        btScreen.classList.add('flex');
    }
    const btnBack = document.getElementById('btnBackToSelect');
    if (btnBack) btnBack.classList.add('hidden');
    const btnCam = document.getElementById('btnResetCam');
    if (btnCam) btnCam.classList.add('hidden');
    const pmmMenu = document.getElementById('postMatchMenu');
    if (pmmMenu) pmmMenu.classList.add('hidden');

    const p1NameEl = document.getElementById('hudP1Name');
    if (p1NameEl) p1NameEl.textContent = fighter1.dino.name;
    const p2NameEl = document.getElementById('hudP2Name');
    if (p2NameEl) p2NameEl.textContent = fighter2.dino.name;
    if (typeof updateHudPortraits === 'function') {
        updateHudPortraits();
    }
    if (typeof updateGamepadHelperHUD === 'function') {
        updateGamepadHelperHUD();
    }

    startNewRound();
}

function startNewRound() {
    fighter1.resetForRound();
    fighter2.resetForRound();

    while (fxGroup.children.length > 0) {
        const child = fxGroup.children[0];
        fxGroup.remove(child);
    }
    for (let i = 0; i < particles3D.length; i++) {
        const pt = particles3D[i];
        if (pt && pt.ownsMaterial && pt.mesh && pt.mesh.material) {
            pt.mesh.material.dispose();
        }
    }
    projectiles3D = [];
    particles3D = [];
    roundTimer = 99;
    roundTimerAccum = 0;
    xrayCinematicTimer = 0;
    xrayStage = 0;
    xrayLockPositions = null;
    fatalityFocusFighter = null;

    const roundTextEl = document.getElementById('hudRoundText');
    if (roundTextEl) roundTextEl.textContent = `ROUND ${roundNumber}`;
    const timerEl = document.getElementById('hudTimer');
    if (timerEl) {
        timerEl.textContent = typeof formatHudTimer === 'function' ? formatHudTimer(roundTimer) : roundTimer;
    }
    const xrayOverlay = document.getElementById('xrayOverlayHud');
    if (xrayOverlay) xrayOverlay.classList.add('hidden');
    const fatalityBox = document.getElementById('fatalityPromptBox');
    if (fatalityBox) fatalityBox.classList.add('hidden');
    const postMatchEl = document.getElementById('postMatchMenu');
    if (postMatchEl) postMatchEl.classList.add('hidden');
    if (typeof hideComboHUD === 'function') hideComboHUD();

    matchState = 'intro';
    stateTimer = 1.6;
    showAnnouncer(`ROUND ${roundNumber}`, `${fighter1.dino.name} VS ${fighter2.dino.name}`);
    updateBattleHUD();
    if (typeof updateGamepadHelperHUD === 'function') {
        updateGamepadHelperHUD();
    }

    setTimeout(() => {
        if (matchState === 'intro') {
            showAnnouncer('KOMBAT !', 'AFFRONTEZ-VOUS EN 3D !');
            sfx.playRoar(90, 0.35);
        }
    }, 900);
}

function applyDamage(attacker, defender, rawDamage, isHeavy, label = '', isLockedXrayHit = false, attackCategory = 'mid') {
    if (defender.isDead) return;

    // Invulnérabilité pendant l'animation de relevé (Wake_Up_Stand)
    if (!isLockedXrayHit && defender.combatController && defender.combatController.state === CombatState.WAKE_UP_STAND) {
        spawnFloatingPopup(defender.x, '🛡️ INVULNÉRABLE (RELEVÉ) !', '#38bdf8');
        return;
    }

    const attackZone = typeof DinosaurCombatController !== 'undefined'
        ? DinosaurCombatController.resolveAttackZoneFromAction(attackCategory)
        : 'mid';

    let finalDamage = rawDamage;
    let momentumMult = 1.0;
    let staleMult = 1.0;

    // --- ÉQUATION UPDATE 2.0 : MOMENTUM DAMAGE & STALE-MOVE NEGATION ---
    // Total Damage = Base Damage * (1 + k * ||v||) * StaleMultiplier
    if (!isLockedXrayHit && attacker.combatController) {
        const dmgEval = attacker.combatController.evaluateScaledDamage(rawDamage);
        finalDamage = dmgEval.scaledDamage;
        momentumMult = dmgEval.momentumMultiplier;
        staleMult = dmgEval.staleMultiplier;
        attacker.momentumMultiplier = momentumMult;
        attacker.staleMultiplier = staleMult;
    }

    // Modificateur de puissance d'attaque de l'attaquant (débuff d'intimidation du T-Rex, etc.)
    if (attacker.atkPowerMod !== undefined && attacker.atkPowerMod !== 1.0) {
        finalDamage = Math.round(finalDamage * attacker.atkPowerMod);
    }

    // Avantage joueur contre le boss en campagne pour rendre le combat palpitant et accessible
    if (attacker.isP1 && gameMode === 'campaign' && defender.dino && defender.dino.isBoss) {
        finalDamage = Math.round(finalDamage * 1.35);
    }

    attacker.hasHitConfirmed = true;

    // --- DAMAGE SCALING (PRORATION DÉGRESSIVE DU COMBO) ---
    // Chaque coup consécutif inflige des dégâts dégressifs pour éviter les one-shots abusifs
    if (!isLockedXrayHit && attacker.comboCount > 0) {
        let scale = 1.0;
        if (attacker.comboCount === 1) scale = 0.82;
        else if (attacker.comboCount === 2) scale = 0.68;
        else if (attacker.comboCount === 3) scale = 0.54;
        else scale = 0.40;
        finalDamage = Math.max(4, Math.round(finalDamage * scale));
    }

    // --- HYPER-ARMURE DE L'ANKYLOSAURE ---
    if (defender.hasHyperArmor && !isHeavy && attackCategory !== 'throw' && !isLockedXrayHit) {
        finalDamage = Math.max(8, Math.round(finalDamage * 0.5));
        defender.hp = Math.max(0, defender.hp - finalDamage);
        defender.rage = Math.min(100, defender.rage + 4.5);
        sfx.playHit(false);
        spawnFloatingPopup(defender.x, '🛡️ HYPER ARMURE !', '#38bdf8');
        spawn3DBloodAndBones(defender.x, 1.8, 6, false);
        updateBattleHUD();
        if (defender.hp <= 0 && matchState === 'fight') handleKnockout(attacker, defender);
        return;
    }

    // --- MATRICE DIRECTIONNELLE 3-VOIES : ATTAQUE (HIGH / MID / LOW) VS GARDE (HIGH / MID / LOW) ---
    const isBlocking = defender.isBlocking && !defender.isDizzy && !isLockedXrayHit && !defender.isXrayTarget;
    let guardBroken = false;

    if (isBlocking) {
        if (attackCategory === 'throw' || attackCategory === 'seismic') {
            // Chope et Séisme sont strictement inbloquables !
            guardBroken = true;
        } else {
            const isMatchedGuard = typeof DinosaurCombatController !== 'undefined'
                ? DinosaurCombatController.isDirectionalGuardMatched(attackCategory, defender.blockType)
                : (defender.blockType === attackZone);

            if (!isMatchedGuard) {
                // Garde directionnelle non correspondante -> Coup net traversant la défense !
                guardBroken = true;
                const zoneLabels = {
                    high: '👆 FRAPPE HAUTE (GARDE PERCÉE) !',
                    mid: '👉 FRAPPE MÉDIANE (GARDE PERCÉE) !',
                    low: '🦶 FRAPPE BASSE (GARDE PERCÉE) !'
                };
                spawnFloatingPopup(defender.x, zoneLabels[attackZone] || '💥 GARDE PERCÉE !', '#ef4444');
            } else {
                // Garde correspondante : consomme l'endurance de garde du défenseur
                const staminaCost = isHeavy ? 28 : 14;
                defender.guardStamina = Math.max(0, (defender.guardStamina !== undefined ? defender.guardStamina : 100) - staminaCost);
                if (defender.guardStamina <= 0) {
                    guardBroken = true;
                    defender.guardStamina = 50;
                    spawnFloatingPopup(defender.x, '💥 GARDE BRISÉE (ENDURANCE ÉPUISÉE) !', '#ef4444');
                }
            }
        }
    }

    if (isBlocking && !guardBroken) {
        // --- PARADE DIRECTIONNELLE RÉUSSIE : DÉVIATION (BLOCK_DEFLECT_[ZONE]) & DÉSAVANTAGE DE FRAMES ---
        const isCorner = Math.abs(defender.x) >= STAGE_RIGHT_3D - 1.2;
        const staleBlockstunMult = attacker.combatController
            ? attacker.combatController.calculateStaleBlockstunMultiplier(attacker.lastStaleCount || 0)
            : 1.0;

        // Déclencher Block_Deflect_[Zone] sur l'attaquant (recul & désavantage de recovery)
        if (attacker.combatController) {
            attacker.combatController.triggerAttackerBlockDeflect(attackZone);
            attacker.actionDuration = 0;
            attacker.actionTimer = 0;
            attacker.action = 'idle';
            attacker.hitStun = 0.24;
        }

        if (attacker.dino && attacker.dino.id === 'therizinosaurus') {
            // Thérizinosaure : Griffes déchiqueteuses qui traversent la garde (40% de dégâts)
            finalDamage = Math.max(14, Math.round(rawDamage * 0.40));
            defender.hitStun = 0.22 * staleBlockstunMult;
            if (isCorner) {
                attacker.vx = -attacker.facing * 5.2;
                defender.vx = 0;
            } else {
                defender.vx = attacker.facing * 5.5;
            }
            sfx.playHit(true);
            screenShake = 0.25;
            spawnFloatingPopup(defender.x, '⚔️ GRIFFES DÉCHIQUETEUSES (CHIP 40%) !', '#f97316');
            if (typeof spawn3DGuardDeflectEffect === 'function') {
                spawn3DGuardDeflectEffect(defender, defender.blockType || attackZone);
            }
            spawn3DBloodAndBones(defender.x, 1.8, 8, false);
        } else {
            // Garde directionnelle parfaite (High/Mid/Low) : 0 dégât subi & déviation de l'attaquant !
            finalDamage = 0;
            defender.hitStun = (isHeavy ? 0.22 : 0.11) * staleBlockstunMult;
            attacker.vx = -attacker.facing * (isHeavy ? 6.2 : 4.5);
            if (!isCorner) {
                defender.vx = attacker.facing * (isHeavy ? 4.2 : 2.5);
            }
            sfx.playHit(false);
            const deflectLabels = {
                high: '🛡️ DÉVIATION HAUTE !',
                mid: '🛡️ DÉVIATION MÉDIANE !',
                low: '🛡️ DÉVIATION BASSE !'
            };
            spawnFloatingPopup(defender.x, deflectLabels[defender.blockType] || '🛡️ DÉVIATION !', '#fbbf24');
            if (typeof spawn3DGuardDeflectEffect === 'function') {
                spawn3DGuardDeflectEffect(defender, defender.blockType || attackZone);
            }
            spawn3DBloodAndBones(defender.x, 1.8, 4, false);
        }

        defender.hp = Math.max(0, defender.hp - finalDamage);
        defender.rage = Math.min(100, defender.rage + (isHeavy ? 5 : 2.5));
        updateBattleHUD();
        if (defender.hp <= 0 && matchState === 'fight') handleKnockout(attacker, defender);
        return;
    }

    // --- IMPACT DIRECT RÉUSSI (COUP NET / GARDE PERCÉE) ---
    sfx.playHit(isHeavy);

    // Hitstop : Impact Freeze pour un ressenti percutant et viscéral
    hitstopTimer = isHeavy ? 0.065 : 0.035;

    // Signature Passives & Status Effects
    if (attacker.dino && !defender.isDead) {
        // Smilodon : Saignement cumulable (jusqu'à 3 stacks)
        if (attacker.dino.id === 'smilodon') {
            defender.bleedStacks = Math.min(3, (defender.bleedStacks || 0) + 1);
            defender.bleedTimer = 4.0;
            spawnFloatingPopup(defender.x, `🩸 SAIGNEMENT ×${defender.bleedStacks}`, '#dc2626');
        }
        // Pulmonoscorpius : Neurotoxine paralysante (jusqu'à 3 stacks)
        if (attacker.dino.id === 'pulmonoscorpius') {
            defender.poisonStacks = Math.min(3, (defender.poisonStacks || 0) + 1);
            defender.poisonTimer = 5.0;
            spawnFloatingPopup(defender.x, `🧪 VENIN ×${defender.poisonStacks}`, '#22c55e');
        }
        // T-Rex : Intimidation par morsure ou rugissement (-25% attaque adverse)
        if (attacker.dino.id === 'trex' && (attacker.action === 'special' || attackCategory === 'throw')) {
            defender.atkPowerMod = 0.75;
            defender.atkPowerModTimer = 4.5;
            spawnFloatingPopup(defender.x, '🦖 INTIMIDATION (-25% ATQ) !', '#eab308');
        }
    }

    const kbMult = defender.knockbackMult || 1.0;
    const isBossDef = defender.dino && defender.dino.isBoss;
    const stunDecay = Math.max(0.55, 1.0 - (attacker.comboCount || 0) * 0.14);
    defender.hitStun = (isLockedXrayHit ? 1.2 : (isHeavy ? (isBossDef ? 0.46 : 0.35) : (isBossDef ? 0.30 : 0.20))) * stunDecay;
    defender.lastHitZone = attackZone;

    // --- DÉCLENCHEMENT DE LA SÉQUENCE KNOCKDOWN -> GROUNDED_IDLE -> WAKE_UP_STAND ---
    const causesKnockdown = !isLockedXrayHit && !isBossDef && (
        isHeavy ||
        attackCategory === 'throw' ||
        attackCategory === 'seismic' ||
        momentumMult >= 1.28
    );
    if (defender.combatController && !isLockedXrayHit) {
        defender.combatController.triggerDefenderHitOrKnockdown(attackZone, causesKnockdown, 1.15);
    }

    // Ne pas repousser les personnages pendant que le X-Ray verrouille leurs positions
    if (!isLockedXrayHit && !xrayLockPositions) {
        const isCorner = Math.abs(defender.x) >= STAGE_RIGHT_3D - 1.2;
        const pushbackBonus = (attacker.comboCount || 0) * 1.5;

        if (attackCategory === 'antiair') {
            defender.vx = attacker.facing * 3.5 * kbMult;
            defender.vy = 8.5;
        } else if (attackCategory === 'low') {
            if (isCorner) {
                attacker.vx = -attacker.facing * 4.2;
                defender.vx = 0;
            } else {
                defender.vx = attacker.facing * (5.5 + pushbackBonus) * kbMult;
            }
            defender.vy = 2.4;
        } else {
            if (isCorner) {
                // Au coin : Reversal pushback pour empêcher l'attaquant de coller indéfiniment
                attacker.vx = -attacker.facing * (isHeavy ? 5.8 : 4.0);
                defender.vx = 0;
            } else {
                defender.vx = attacker.facing * ((isHeavy ? 9.2 : 5.8) + pushbackBonus) * kbMult;
            }
            if (isHeavy) defender.vy = 4.2;
        }
    } else {
        defender.vx = 0;
        defender.vy = 0;
    }
    screenShake = isHeavy ? 0.38 : 0.16;
    if (typeof spawn3DHitImpactBurst === 'function') {
        spawn3DHitImpactBurst(defender, attackZone, isHeavy);
    }
    if (causesKnockdown && typeof spawn3DGroundShockwave === 'function') {
        spawn3DGroundShockwave(defender.x, 0xef4444, 2.4, true);
    }
    spawn3DBloodAndBones(defender.x, 2.0, isHeavy ? 18 : 8, isHeavy);

    attacker.comboCount++;
    if (attacker.isP1 && attacker.comboCount >= 2 && typeof showComboHUD === 'function') {
        showComboHUD(attacker.comboCount);
    }

    // Feedback visuel pour Momentum Damage et Stale-Move Negation
    let extraTag = '';
    if (!isLockedXrayHit) {
        if (momentumMult >= 1.12) {
            extraTag += ` ⚡+${Math.round((momentumMult - 1) * 100)}%`;
        }
        if (staleMult < 1.0) {
            extraTag += ` ⚠️USÉ ${Math.round(staleMult * 100)}%`;
        }
    }
    const textLabel = (label || (attacker.comboCount > 1 ? `${attacker.comboCount} HITS ! -${finalDamage}` : `-${finalDamage}`)) + extraTag;
    spawnFloatingPopup(defender.x, textLabel, isHeavy ? '#ef4444' : '#fde047');

    if (gameMode === 'practice' && !defender.isP1) {
        defender.hp = Math.max(150, defender.hp - finalDamage);
        setTimeout(() => { defender.hp = defender.maxHp; updateBattleHUD(); }, 1800);
    } else if (isLockedXrayHit) {
        // Garder au moins 1 PV pendant les phases 1 et 2 du X-Ray pour que l'animation complète se joue
        defender.hp = Math.max(1, defender.hp - finalDamage);
    } else {
        defender.hp = Math.max(0, defender.hp - finalDamage);
    }

    if (!attacker.isXrayAttacker) {
        attacker.rage = Math.min(100, attacker.rage + (isHeavy ? 6 : 3.5));
    }
    defender.rage = Math.min(100, defender.rage + (isHeavy ? 7.5 : 4.5));

    updateBattleHUD();

    if (defender.hp <= 0 && matchState === 'fight' && !isLockedXrayHit) {
        xrayCinematicTimer = 0;
        xrayStage = 0;
        xrayLockPositions = null;
        fighter1.isXrayTarget = false;
        fighter2.isXrayTarget = false;
        fighter1.isXrayAttacker = false;
        fighter2.isXrayAttacker = false;
        document.getElementById('xrayOverlayHud').classList.add('hidden');
        handleKnockout(attacker, defender);
    }
}

function handleKnockout(winner, loser) {
    if (matchState !== 'fight') return;

    winner.roundsWon++;
    winner.action = 'idle';
    winner.actionDuration = 0;
    winner.actionTimer = 0;
    winner.bufferedAction = null;

    loser.action = 'idle';
    loser.actionDuration = 0;
    loser.actionTimer = 0;
    loser.bufferedAction = null;
    loser.isBlocking = false;
    loser.hitStun = 0;

    sfx.playGong();
    sfx.playRoar(70, 0.65);
    updateBattleHUD();

    if (winner.roundsWon >= 2) {
        // Balle de match : Déclenche la séquence "ACHEVEZ-LE !" pour la Fatalité
        matchState = 'finish_him';
        stateTimer = 6.5;
        loser.hp = 1;
        loser.isDizzy = true;
        loser.vx = 0;
        loser.vy = 0;

        showAnnouncer('ACHEVEZ-LE !', `APPUYEZ SUR [R] OU [ESPACE] POUR LA FATALITÉ DE ${winner.dino.name}`);
        if (winner.isP1 || gameMode === 'pvp') {
            const fatBtn = document.getElementById('btnTriggerFatalityNow');
            if (fatBtn) {
                fatBtn.className = 'px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-800 via-red-600 to-amber-500 text-white font-black text-sm sm:text-lg uppercase tracking-wider border-2 border-amber-300 shadow-2xl finish-pulse cursor-pointer';
                fatBtn.innerHTML = `💀 EXÉCUTER LA FATALITÉ ! (Touche R ou Espace)`;
            }
            document.getElementById('fatalityPromptBox').classList.remove('hidden');
        }
    } else {
        // Fin du 1er round : l'adversaire tombe K.O. et le round suivant se lance
        matchState = 'round_over';
        stateTimer = 2.6;
        loser.hp = 0;
        loser.isDead = true;
        showAnnouncer('K.O. !', `${winner.dino.name} REMPORTE LE ROUND ${roundNumber}`);
    }
}

// ============================================================================
// BLOQUEUR PHYSIQUE ANTI-TRAVERSÉE (BODY BLOCKER / PUSHBOX COLLISION SYSTEM)
// Empêche strictement les deux animaux de se traverser au sol, en course, en dash,
// lors des attaques spéciales ou contre les bords de l'arène.
// ============================================================================
function resolveFighterBodyBlocker(f1, f2) {
    if (!f1 || !f2 || matchState === 'fatality_anim' || xrayLockPositions) return;

    const minSep = (f1.bodyRadius || 1.32) + (f2.bodyRadius || 1.32);

    // Autoriser le franchissement aérien (Cross-Up) ou lorsque l'un des combattants est sur une branche/plateforme en hauteur
    const f1Air = f1.y - (f1.groundY || 0);
    const f2Air = f2.y - (f2.groundY || 0);
    const isHighAirCross = (
        f1.isFlying ||
        f2.isFlying ||
        Math.abs(f1.y - f2.y) >= 1.48 ||
        (Math.max(f1Air, f2Air) >= 2.2 && Math.abs(f1.y - f2.y) >= 1.35)
    );

    if (f1._lockedSide === undefined) {
        f1._lockedSide = f1.x <= f2.x ? -1 : 1;
    }

    if (isHighAirCross) {
        if (Math.abs(f1.x - f2.x) > 0.35) {
            f1._lockedSide = f1.x < f2.x ? -1 : 1;
        }
        return;
    }

    // Side verrouillé : -1 signifie que f1 doit rester à GAUCHE de f2 (f1.x <= f2.x - minSep)
    //                  +1 signifie que f1 doit rester à DROITE de f2 (f1.x >= f2.x + minSep)
    const side = f1._lockedSide || (f1.x <= f2.x ? -1 : 1);

    // Distance signée actuelle le long de l'axe autorisé : doit être >= minSep
    const currentSignedSep = (f1.x - f2.x) * side;

    if (currentSignedSep < minSep) {
        const overlap = minSep - currentSignedSep;

        // Répartition de la poussée selon le mouvement et la classe de poids
        const w1 = f1.weightClass === 'heavy' ? 1.35 : (f1.weightClass === 'speed' ? 0.80 : 1.0);
        const w2 = f2.weightClass === 'heavy' ? 1.35 : (f2.weightClass === 'speed' ? 0.80 : 1.0);

        // Si un seul combattant avance activement vers l'autre, celui qui est en garde/immobile résiste davantage
        const f1Pushing = (side === -1 && f1.vx > 0.2) || (side === 1 && f1.vx < -0.2);
        const f2Pushing = (side === -1 && f2.vx < -0.2) || (side === 1 && f2.vx > 0.2);

        let push1Ratio = w2 / (w1 + w2);
        let push2Ratio = w1 / (w1 + w2);

        if (f1Pushing && !f2Pushing) {
            push1Ratio = f2.isBlocking ? 0.78 : 0.62;
            push2Ratio = 1.0 - push1Ratio;
        } else if (f2Pushing && !f1Pushing) {
            push2Ratio = f1.isBlocking ? 0.78 : 0.62;
            push1Ratio = 1.0 - push2Ratio;
        }

        f1.x += side * overlap * push1Ratio;
        f2.x -= side * overlap * push2Ratio;

        // Contrainte stricte aux murs de l'arène : si f2 est bloqué contre un mur, f1 subit 100% du recul
        if (f2.x < STAGE_LEFT_3D) {
            f2.x = STAGE_LEFT_3D;
            f1.x = f2.x + side * minSep;
        } else if (f2.x > STAGE_RIGHT_3D) {
            f2.x = STAGE_RIGHT_3D;
            f1.x = f2.x + side * minSep;
        }

        if (f1.x < STAGE_LEFT_3D) {
            f1.x = STAGE_LEFT_3D;
            f2.x = f1.x - side * minSep;
        } else if (f1.x > STAGE_RIGHT_3D) {
            f1.x = STAGE_RIGHT_3D;
            f2.x = f1.x - side * minSep;
        }

        f1.x = Math.max(STAGE_LEFT_3D, Math.min(STAGE_RIGHT_3D, f1.x));
        f2.x = Math.max(STAGE_LEFT_3D, Math.min(STAGE_RIGHT_3D, f2.x));

        // Annuler la vélocité entrante pour empêcher l'accumulation de vitesse à travers le bloqueur
        if (side === -1) {
            if (f1.vx > 0 && f1.vx > f2.vx) f1.vx = Math.min(0, f2.vx);
            if (f2.vx < 0 && f2.vx < f1.vx) f2.vx = Math.max(0, f1.vx);
        } else {
            if (f1.vx < 0 && f1.vx < f2.vx) f1.vx = Math.max(0, f2.vx);
            if (f2.vx > 0 && f2.vx > f1.vx) f2.vx = Math.min(0, f1.vx);
        }
    }
}

let _hudCooldownThrottle = 0;

function updateBattle3D(dt, nowSec) {
    // Hitstop (Impact Freeze) : Fige temporairement la physique et les animations pour le punch
    if (hitstopTimer > 0) {
        hitstopTimer = Math.max(0, hitstopTimer - dt);
        return;
    }

    // Dynamisme en temps réel du décor de l'arène 3D
    if (typeof updateArenaDynamics === 'function') {
        updateArenaDynamics(currentArena, arenaGroup, battleScene, nowSec, dt);
    }

    if (screenShake > 0) screenShake = Math.max(0, screenShake - dt * 1.5);
    if (xrayCinematicTimer > 0) {
        xrayCinematicTimer -= dt;
        // Tant que la cinématique X-Ray est active, figer les positions des 2 combattants
        if (xrayLockPositions) {
            const { attacker, defender, attX, defX, attY, defY, attFacing, defFacing } = xrayLockPositions;
            attacker.x = attX;
            attacker.y = attY !== undefined ? attY : 0;
            attacker.groundY = attacker.y;
            attacker.vx = 0;
            attacker.vy = 0;
            attacker.facing = attFacing;

            defender.x = defX;
            defender.y = defY !== undefined ? defY : 0;
            defender.groundY = defender.y;
            defender.vx = 0;
            defender.vy = 0;
            defender.facing = defFacing;
        }
        if (xrayCinematicTimer <= 0) {
            xrayStage = 0;
            xrayLockPositions = null;
            fighter1.isXrayTarget = false;
            fighter2.isXrayTarget = false;
            fighter1.isXrayAttacker = false;
            fighter2.isXrayAttacker = false;
            if (fighter1.action === 'xray') { fighter1.action = 'idle'; fighter1.actionDuration = 0; }
            if (fighter2.action === 'xray') { fighter2.action = 'idle'; fighter2.actionDuration = 0; }
            document.getElementById('xrayOverlayHud').classList.add('hidden');
        }
    }

    if (matchState === 'intro') {
        stateTimer -= dt;
        if (stateTimer <= 0) {
            matchState = 'fight';
            clearAnnouncer();
            if (typeof updateGamepadHelperHUD === 'function') {
                updateGamepadHelperHUD();
            }
        }
    } else if (matchState === 'finish_him') {
        stateTimer -= dt;
        if (fighter2.roundsWon >= 2 && (gameMode === 'cpu' || gameMode === 'campaign') && stateTimer < 4.8) {
            executeUnique3DFatality(fighter2, fighter1);
            return;
        }
        if (stateTimer <= 0) {
            const winner = fighter1.roundsWon >= 2 ? fighter1 : fighter2;
            const loser = winner === fighter1 ? fighter2 : fighter1;
            finishMatch(winner, loser);
        }
    } else if (matchState === 'fatality_anim') {
        stateTimer -= dt;
        if (stateTimer <= 0) {
            const winner = fighter1.roundsWon >= 2 ? fighter1 : fighter2;
            const loser = winner === fighter1 ? fighter2 : fighter1;
            finishMatch(winner, loser);
        }
    } else if (matchState === 'round_over') {
        stateTimer -= dt;
        if (stateTimer <= 0) {
            roundNumber++;
            startNewRound();
        }
    }

    // Pause du chronomètre pendant la cinématique X-Ray
    if (matchState === 'fight' && gameMode !== 'practice' && xrayCinematicTimer <= 0) {
        roundTimerAccum += dt;
        if (roundTimerAccum >= 1) {
            roundTimerAccum = 0;
            roundTimer = Math.max(0, roundTimer - 1);
            document.getElementById('hudTimer').textContent = typeof formatHudTimer === 'function' ? formatHudTimer(roundTimer) : roundTimer;
            if (roundTimer === 0) {
                const winner = fighter1.hp >= fighter2.hp ? fighter1 : fighter2;
                const loser = winner === fighter1 ? fighter2 : fighter1;
                handleKnockout(winner, loser);
            }
        }
    }

    // Verrouiller l'ordre gauche/droite initial avant les déplacements d'inputs et d'IA
    if (fighter1 && fighter2 && !xrayLockPositions && matchState !== 'fatality_anim') {
        const isHighAir = Math.abs(fighter1.y - fighter2.y) >= 1.48;
        if (!isHighAir && fighter1._lockedSide === undefined) {
            fighter1._lockedSide = fighter1.x <= fighter2.x ? -1 : 1;
        }
    }

    // Bloquer tous les inputs de déplacement et d'IA pendant le X-Ray
    if ((matchState === 'fight' || matchState === 'finish_him') && xrayCinematicTimer <= 0) {
        handlePlayer1Inputs(dt);
        if (gameMode === 'pvp') {
            handlePlayer2Inputs(dt);
        } else if ((gameMode === 'cpu' || gameMode === 'campaign') && matchState === 'fight') {
            updateAI(fighter2, fighter1, dt);
        }
        // Appliquer le bloqueur dès la sortie des inputs pour empêcher tout franchissement instantané
        resolveFighterBodyBlocker(fighter1, fighter2);
    }

    [fighter1, fighter2].forEach(f => {
        const other = f === fighter1 ? fighter2 : fighter1;

        if (f.dashCooldown > 0) f.dashCooldown = Math.max(0, f.dashCooldown - dt);
        if (f.dashTimer > 0) f.dashTimer = Math.max(0, f.dashTimer - dt);
        if (f.beingThrownTimer > 0) f.beingThrownTimer = Math.max(0, f.beingThrownTimer - dt);
        if (f.bufferTimer > 0) {
            f.bufferTimer -= dt;
            if (f.bufferTimer <= 0) f.bufferedAction = null;
        }

        // Tics du Saignement (Passif Smilodon)
        if (f.bleedTimer > 0 && !f.isDead) {
            f.bleedTimer -= dt;
            f.bleedTickTimer = (f.bleedTickTimer || 0) + dt;
            if (f.bleedTickTimer >= 0.8) {
                f.bleedTickTimer = 0;
                const bleedDmg = Math.max(1, Math.round(f.bleedStacks * (f.maxHp * 0.012)));
                f.hp = Math.max(1, f.hp - bleedDmg);
                spawn3DBloodAndBones(f.x, f.y + 1.8, 6, false);
                spawnFloatingPopup(f.x, `🩸 -${bleedDmg}`, '#dc2626');
                updateBattleHUD();
            }
        }

        // Tics de la Neurotoxine (Passif Pulmonoscorpius)
        if (f.poisonTimer > 0 && !f.isDead) {
            f.poisonTimer -= dt;
            f.poisonTickTimer = (f.poisonTickTimer || 0) + dt;
            if (f.poisonTickTimer >= 1.0) {
                f.poisonTickTimer = 0;
                const poisonDmg = Math.max(1, Math.round(f.poisonStacks * (f.maxHp * 0.010)));
                f.hp = Math.max(1, f.hp - poisonDmg);
                spawnFloatingPopup(f.x, `🧪 -${poisonDmg}`, '#22c55e');
                updateBattleHUD();
            }
        }

        // Décrémentation du débuff d'attaque (T-Rex)
        if (f.atkPowerModTimer > 0) {
            f.atkPowerModTimer -= dt;
            if (f.atkPowerModTimer <= 0) f.atkPowerMod = 1.0;
        }

        // Régénération de l'endurance de garde hors blocage (Update 2.0)
        if (!f.isBlocking && f.guardStamina !== undefined && f.guardStamina < 100) {
            f.guardStamina = Math.min(100, f.guardStamina + 14 * dt);
        }

        // Décrémenter les cooldowns d'attaque
        if (f.cooldowns) {
            for (const key in f.cooldowns) {
                if (f.cooldowns[key] > 0) {
                    f.cooldowns[key] = Math.max(0, f.cooldowns[key] - dt);
                }
            }
        }

        // Si les positions sont verrouillées par le X-Ray, on ne déplace pas les combattants
        if (xrayLockPositions) {
            f.rig.root.position.set(f.x, f.y, 0);
            f.rig.root.rotation.z = 0;
            const targetRotY = f.facing === 1 ? 0 : Math.PI;
            f.rig.root.rotation.y += (targetRotY - f.rig.root.rotation.y) * 0.35;
            animateDino3DRig(f, nowSec, dt);
            return;
        }

        if (!f.isDead && f.action !== 'special' && f.action !== 'fatality' && f.dashTimer <= 0) {
            f.facing = f.x <= other.x ? 1 : -1;
        }

        if (f.hitStun > 0) {
            f.hitStun -= dt;
            if (f.hitStun <= 0) {
                if (f.isP1 && f.comboCount > 0 && typeof hideComboHUD === 'function') {
                    hideComboHUD();
                }
                f.comboCount = 0;
            }
        }

        const wasGroundedOnFloor = !f.isFlying && f.vy <= 0.05 && (f.y - (f.groundY || 0)) <= 0.09;

        f.x += f.vx * dt;
        f.y += f.vy * dt;
        f.vx *= f.dashTimer > 0 ? 0.94 : 0.82;

        // Rebond mural dynamique (Wall Splat) en bordure d'arène
        const wallBound = STAGE_RIGHT_3D - 0.25;
        if ((f.x >= wallBound || f.x <= -wallBound) && Math.abs(f.vx) > 6.4 && f.hitStun > 0.08) {
            f.vx = -f.vx * 0.45;
            f.vy = 5.2;
            screenShake = 0.48;
            sfx.playBoneCrack();
            spawnFloatingPopup(f.x, '💥 REBOND MURAL !', '#ef4444');
            spawn3DBloodAndBones(f.x, f.y + 2.0, 16, true);
        }

        f.x = Math.max(STAGE_LEFT_3D, Math.min(STAGE_RIGHT_3D, f.x));
        resolveFighterBodyBlocker(fighter1, fighter2);

        const floorY = typeof getArenaGroundHeight === 'function' ? getArenaGroundHeight(currentArena, f.x, 0) : 0;

        // Gravité et suivi du relief topographique 3D au sol
        f.groundY = floorY;
        if (f.isFlying) {
            const maxFlightY = floorY + 6.4;
            if (f.y > maxFlightY) {
                f.y = maxFlightY;
                if (f.vy > 0) f.vy = 0;
            }
            if (f.y <= floorY) {
                f.y = floorY;
                f.vy = 0;
                f.isFlying = false;
            }
        } else if (wasGroundedOnFloor && f.vy <= 0) {
            // Adhérence fluide aux pentes montantes et descendantes du terrain
            f.y = floorY;
            f.vy = 0;
        } else if (f.y > floorY) {
            f.vy -= 26 * (f.gravityScale || 1.0) * dt;
            if (f.y <= floorY) {
                f.y = floorY;
                f.vy = 0;
            }
        } else {
            f.y = floorY;
            f.vy = 0;
        }

        if (!f.isDead && f.action !== 'special' && f.action !== 'fatality' && f.dashTimer <= 0) {
            f.facing = f.x <= other.x ? 1 : -1;
        }

        if (f.actionDuration > 0) {
            f.actionTimer += dt;
            const progress = f.actionTimer / f.actionDuration;

            // Synchronisation des phases Windup -> Active -> Recovery du DinosaurCombatController
            if (f.combatController && f.action !== 'fatality' && f.action !== 'xray') {
                if (progress < 0.32) {
                    f.combatController.state = CombatState.ATTACK_WINDUP;
                } else if (progress <= 0.70) {
                    f.combatController.state = CombatState.ATTACK_ACTIVE;
                } else {
                    f.combatController.state = CombatState.ATTACK_RECOVERY;
                }
            }

            if (f.action !== 'fatality' && f.action !== 'xray' && f.action !== 'throw_whiff' && !f.hasSpawnedAttackFx && progress >= 0.24) {
                f.hasSpawnedAttackFx = true;
                if (typeof spawn3DAttackEffect === 'function') {
                    spawn3DAttackEffect(f, f.action);
                }
            }

            if (f.action !== 'fatality' && f.action !== 'xray' && !f.hasHitCurrentAttack && progress >= 0.32 && progress <= 0.70) {
                f.hasHitCurrentAttack = true;
                checkAttackCollision3D(f, other);
            }

            // Exécuter automatiquement l'action mise en mémoire tampon (Input Buffer) dès la fenêtre de cancel
            if (f.bufferedAction && f.canCancelInto(f.bufferedAction)) {
                const nextAct = f.bufferedAction;
                f.bufferedAction = null;
                triggerPlayerAction(f, other, nextAct);
            } else if (f.actionTimer >= f.actionDuration && f.action !== 'fatality') {
                const hadHit = f.hasHitConfirmed;
                f.action = 'idle';
                f.actionTimer = 0;
                f.actionDuration = 0;
                f.hasHyperArmor = false;
                f.hasHitConfirmed = false;
                f.lastAttackType = null;
                if (f.combatController && (
                    f.combatController.state === CombatState.ATTACK_WINDUP ||
                    f.combatController.state === CombatState.ATTACK_ACTIVE ||
                    f.combatController.state === CombatState.ATTACK_RECOVERY
                )) {
                    f.combatController.state = CombatState.IDLE;
                }
                // Si le coup a manqué dans le vide (Whiff), punition : annuler toute action mise en tampon pendant le recovery
                if (!hadHit) {
                    f.bufferedAction = null;
                } else if (f.bufferedAction) {
                    const nextAct = f.bufferedAction;
                    f.bufferedAction = null;
                    triggerPlayerAction(f, other, nextAct);
                }
            }
        }
    });

    // Résolution stricte du bloqueur physique (Body Blocker) AVANT la mise à jour des matrices 3D et animations
    resolveFighterBodyBlocker(fighter1, fighter2);

    // Synchroniser l'orientation, l'inclinaison sur pente, la position 3D et l'animation
    if (!xrayLockPositions) {
        [fighter1, fighter2].forEach(f => {
            const other = f === fighter1 ? fighter2 : fighter1;
            if (!f.isDead && f.action !== 'special' && f.action !== 'fatality' && f.dashTimer <= 0) {
                f.facing = f.x <= other.x ? 1 : -1;
            }
            // Recaler groundY et y si le bloqueur physique a déplacé le personnage au sol / sur plateforme
            const isGroundedNow = !f.isFlying && f.vy <= 0.05 && (f.y - (f.groundY || 0)) <= 0.09;
            if (isGroundedNow) {
                const supportY = typeof getFighterSupportHeight === 'function' ? getFighterSupportHeight(f, currentArena) : 0;
                f.groundY = supportY;
                f.y = supportY;
            }
            f.rig.root.position.set(f.x, f.y, 0);
            const targetRotY = f.facing === 1 ? 0 : Math.PI;
            f.rig.root.rotation.y += (targetRotY - f.rig.root.rotation.y) * 0.25;

            // Inclinaison naturelle suivant la pente du sol ou de la branche
            const slope = (isGroundedNow && typeof getFighterSurfaceSlope === 'function')
                ? getFighterSurfaceSlope(f, currentArena)
                : 0;
            const targetPitchZ = isGroundedNow ? Math.max(-0.26, Math.min(0.26, slope * f.facing * 0.72)) : 0;
            f.rig.root.rotation.z += (targetPitchZ - f.rig.root.rotation.z) * 0.22;

            animateDino3DRig(f, nowSec, dt);
        });
    }

    // Mise à jour des projectiles 3D
    for (let i = projectiles3D.length - 1; i >= 0; i--) {
        const p = projectiles3D[i];
        p.mesh.position.x += p.vx * dt;
        p.mesh.rotation.z += 8 * dt;
        p.life -= dt;
        const target = p.owner === fighter1 ? fighter2 : fighter1;

        // Renvoi de projectile si l'Ankylosaure tournoie ou possède l'hyper-armure
        if (target.dino.id === 'ankylosaurus' && (target.action === 'special' || target.hasHyperArmor) && Math.abs(p.mesh.position.x - target.x) < 2.6 && Math.abs(p.mesh.position.y - (target.y + 1.8)) < 2.2) {
            p.owner = target;
            p.vx = -p.vx * 1.35;
            sfx.playBoneCrack();
            spawnFloatingPopup(target.x, '🛡️ RENVOI DE PROJECTILE !', '#38bdf8');
            screenShake = 0.35;
            continue;
        }

        if (Math.abs(p.mesh.position.x - target.x) < 1.55 && Math.abs(p.mesh.position.y - (target.y + 1.8)) < 2.1 && matchState === 'fight') {
            applyDamage(p.owner, target, p.damage, true, '🔥 IMPACT SPÉCIAL !');
            fxGroup.remove(p.mesh);
            projectiles3D.splice(i, 1);
            continue;
        }
        if (p.life <= 0) {
            fxGroup.remove(p.mesh);
            projectiles3D.splice(i, 1);
        }
    }

    // Mise à jour des particules 3D et des effets visuels d'attaques (arcs, ondes de choc, sillages)
    for (let i = particles3D.length - 1; i >= 0; i--) {
        const pt = particles3D[i];
        pt.mesh.position.x += pt.vx * dt;
        pt.mesh.position.y += pt.vy * dt;
        pt.mesh.position.z += pt.vz * dt;
        if (pt.onUpdate) {
            pt.onUpdate(pt, dt);
        } else {
            pt.mesh.rotation.x += 6 * dt;
            pt.mesh.rotation.y += 6 * dt;
        }
        if (!pt.noGravity) {
            pt.vy -= 22 * dt;
            const ptFloorY = (typeof getArenaGroundHeight === 'function' ? getArenaGroundHeight(currentArena, pt.mesh.position.x, pt.mesh.position.z) : 0) + 0.15;
            if (pt.mesh.position.y < ptFloorY) {
                pt.mesh.position.y = ptFloorY;
                pt.vx *= 0.6;
                pt.vy = 0;
            }
        }
        pt.life -= dt;
        if (pt.life <= 0) {
            fxGroup.remove(pt.mesh);
            if (pt.ownsMaterial && pt.mesh && pt.mesh.material) {
                pt.mesh.material.dispose();
            }
            particles3D.splice(i, 1);
        }
    }

    _hudCooldownThrottle += dt;
    if (_hudCooldownThrottle >= 0.08 && typeof updateBattleHUDCooldowns === 'function') {
        _hudCooldownThrottle = 0;
        updateBattleHUDCooldowns();
    }
}

function finishMatch(winner, loser) {
    if (loser) {
        loser.isDizzy = false;
        loser.isDead = true;
        loser.hp = 0;
    }
    document.getElementById('fatalityPromptBox').classList.add('hidden');
    matchState = 'match_over';

    if (gameMode === 'campaign') {
        if (winner && winner.isP1) {
            if (campaignStage < 6) {
                showAnnouncer('ÉTAPE REMPORTÉE !', `${winner.dino.name} ACCÈDE À L'ÉTAPE ${campaignStage + 1} / 6`);
            } else {
                showAnnouncer('👑 VICTOIRE DE LA CAMPAGNE !', "VOUS AVEZ TERRASSÉ DRAK'ZUL LE DRAGON SUPRÊME !");
                // Déblocage du combattant secret : SMILODON !
                unlockFighter('smilodon');
                setTimeout(() => {
                    if (typeof showFighterUnlockedModal === 'function') {
                        showFighterUnlockedModal('smilodon');
                    }
                }, 1800);
            }
        } else {
            showAnnouncer('DÉFAITE...', `ÉCHEC À L'ÉTAPE ${campaignStage} / 6`);
        }
    } else {
        showAnnouncer(`${winner ? winner.dino.name : 'VAINQUEUR'} VICTORIEUX`, 'VICTOIRE TOTALE !');
    }

    if (typeof updatePostMatchMenuUI === 'function') {
        updatePostMatchMenuUI(winner);
    }
    document.getElementById('postMatchMenu').classList.remove('hidden');
}
