function teardownActiveBattle() {
    isMatchPaused = false;
    if (typeof teardownSuperState === 'function') {
        teardownSuperState();
    }
    if (typeof resetBattleLighting === 'function') {
        resetBattleLighting();
    }
    superState = null;
    battleTimeScale = 1.0;
    koSlowMoTimer = 0;
    koPendingData = null;
    hitstopTimer = 0;
    hitstopTarget = null;
    screenShake = 0;
    camRecoilX = 0;
    camRecoilY = 0;
    camFovKick = 0;
    roundIntroAnnounced = false;

    if (typeof cleanupCampaignTransientEntities === 'function') {
        cleanupCampaignTransientEntities();
    }
    if (typeof campaignBossFighter !== 'undefined' && campaignBossFighter) {
        if (campaignBossFighter !== fighter1 && campaignBossFighter !== fighter2 && typeof campaignBossFighter.destroy === 'function') {
            campaignBossFighter.destroy();
        }
        campaignBossFighter = null;
    }
    if (fighter1) {
        fighter1.destroy();
        fighter1 = null;
    }
    if (fighter2) {
        fighter2.destroy();
        fighter2 = null;
    }

    if (typeof fxGroup !== 'undefined' && fxGroup) {
        while (fxGroup.children.length > 0) {
            fxGroup.remove(fxGroup.children[0]);
        }
    }
    for (let i = 0; i < particles3D.length; i++) {
        const pt = particles3D[i];
        if (pt && pt.ownsMaterial && pt.mesh && pt.mesh.material) {
            pt.mesh.material.dispose();
        }
    }
    projectiles3D = [];
    particles3D = [];

    if (typeof hideSuperFlashOverlay === 'function') {
        hideSuperFlashOverlay();
    }
    if (typeof document !== 'undefined') {
        ['pauseModal', 'postMatchMenu', 'superFlashOverlay', 'duelTopHudOverlay'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.add('hidden');
        });
        ['campaignSmashHUD', 'eraVictoryModal', 'campaignGameOverModal'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.remove();
        });
    }

    if (typeof sfx !== 'undefined' && typeof sfx.startMusicLoop === 'function' && sfx.enabled) {
        sfx.startMusicLoop('menu');
    }
}
if (typeof window !== 'undefined') {
    window.teardownActiveBattle = teardownActiveBattle;
}

// 10. DÉMARRAGE DU MATCH ET GESTION DES ROUNDS
function startMatch() {
    sfx.init();
    sfx.playGong();
    if (typeof sfx.startMusicLoop === 'function') {
        sfx.startMusicLoop('battle');
    }
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
        const aiDiffEl = document.getElementById('aiDifficulty') || document.getElementById('settingsAiDiff');
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

    if (typeof mainMenuVisibleSignal !== 'undefined') mainMenuVisibleSignal.value = false;
    if (typeof campaignMapVisibleSignal !== 'undefined') campaignMapVisibleSignal.value = false;
    const campScreen = document.getElementById('campaignScreen');
    if (campScreen) campScreen.classList.add('hidden');

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
    const duelHud = document.getElementById('duelTopHudOverlay');
    if (duelHud) {
        duelHud.classList.remove('hidden');
        duelHud.style.display = '';
    }
    const smashHud = document.getElementById('campaignSmashHUD');
    if (smashHud) smashHud.remove();
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
    if (typeof teardownSuperState === 'function') {
        teardownSuperState();
    }
    if (typeof resetBattleLighting === 'function') {
        resetBattleLighting();
    }
    fighter1.resetForRound();
    fighter2.resetForRound();
    if (typeof AIMacroStatechart !== 'undefined' && AIMacroStatechart.service) {
        AIMacroStatechart.service.send({ type: 'ROUND_RESET' });
    }

    if (typeof fxGroup !== 'undefined' && fxGroup) {
        while (fxGroup.children.length > 0) {
            const child = fxGroup.children[0];
            fxGroup.remove(child);
        }
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
    superState = null;
    battleTimeScale = 1.0;
    koSlowMoTimer = 0;
    koPendingData = null;
    hitstopTimer = 0;
    hitstopTarget = null;
    screenShake = 0;
    camRecoilX = 0;
    camRecoilY = 0;
    camFovKick = 0;
    roundIntroAnnounced = false;

    if (typeof hideSuperFlashOverlay === 'function') {
        hideSuperFlashOverlay();
    }
    if (typeof document !== 'undefined') {
        const roundTextEl = document.getElementById('hudRoundText');
        if (roundTextEl) roundTextEl.textContent = `ROUND ${roundNumber}`;
        const timerEl = document.getElementById('hudTimer');
        if (timerEl) {
            timerEl.textContent = typeof formatHudTimer === 'function' ? formatHudTimer(roundTimer) : roundTimer;
        }
        const sfOverlay = document.getElementById('superFlashOverlay');
        if (sfOverlay) sfOverlay.classList.add('hidden');
        const postMatchEl = document.getElementById('postMatchMenu');
        if (postMatchEl) postMatchEl.classList.add('hidden');
    }
    if (typeof hideComboHUD === 'function') hideComboHUD();

    matchState = 'intro';
    stateTimer = 1.6;
    if (typeof showAnnouncer === 'function') {
        showAnnouncer(`ROUND ${roundNumber}`, `${fighter1.dino.name} VS ${fighter2.dino.name}`);
    }
    if (typeof updateBattleHUD === 'function') updateBattleHUD();
    if (typeof updateGamepadHelperHUD === 'function') {
        updateGamepadHelperHUD();
    }
}

function _handlePostDamageZeroHp(attacker, defender, isExtinction = false) {
    if (matchState === 'campaign_level') {
        if (defender === fighter1) {
            if (typeof handlePlayerStockLoss === 'function') handlePlayerStockLoss();
        } else if (typeof handleCampaignBossDefeated === 'function') {
            handleCampaignBossDefeated();
        } else if (typeof finishCampaignEraVictory === 'function') {
            finishCampaignEraVictory();
        }
        return;
    }
    if (matchState === 'fight') {
        handleKnockout(attacker, defender, isExtinction);
    }
}

function applyDamage(attacker, defender, rawDamage, isHeavy, label = '', isSuperLockedHit = false, attackCategory = 'mid', options = {}) {
    if (!defender || defender.isDead) return 'none';
    const opts = options || {};

    // Invulnérabilité de démarrage Primal Super (Reversal)
    if (!isSuperLockedHit && defender.superInvulnTimer > 0) {
        return 'invuln';
    }

    // Invulnérabilité pendant l'animation de relevé (Wake_Up_Stand)
    const hasCombatState = typeof CombatState !== 'undefined';
    if (!isSuperLockedHit && hasCombatState && defender.combatController && defender.combatController.state === CombatState.WAKE_UP_STAND) {
        if (typeof spawnFloatingPopup === 'function') {
            spawnFloatingPopup(defender.x, '🛡️ INVULNÉRABLE (RELEVÉ) !', '#38bdf8');
        }
        return 'invuln';
    }

    const attackZone = typeof DinosaurCombatController !== 'undefined'
        ? DinosaurCombatController.resolveAttackZoneFromAction(attackCategory)
        : 'mid';

    // Détection Counter-Hit (interruption du Windup) & Punish (pendant Recovery) avant modification d'état
    const defCtrlState = defender.combatController ? defender.combatController.state : null;
    const isCounter = !isSuperLockedHit && !defender.isBlocking && hasCombatState && defCtrlState === CombatState.ATTACK_WINDUP;
    const isPunish = !isSuperLockedHit && !defender.isBlocking && !isCounter && hasCombatState && defCtrlState === CombatState.ATTACK_RECOVERY;

    let finalDamage = rawDamage;
    let momentumMult = 1.0;
    let staleMult = 1.0;

    // --- ÉQUATION UPDATE 2.0 : MOMENTUM DAMAGE & STALE-MOVE NEGATION ---
    // Total Damage = Base Damage * (1 + k * ||v||) * StaleMultiplier
    if (!isSuperLockedHit && attackCategory !== 'super' && attacker && attacker.combatController) {
        const dmgEval = attacker.combatController.evaluateScaledDamage(rawDamage);
        finalDamage = dmgEval.scaledDamage;
        momentumMult = dmgEval.momentumMultiplier;
        staleMult = dmgEval.staleMultiplier;
        attacker.momentumMultiplier = momentumMult;
        attacker.staleMultiplier = staleMult;
    }

    // Modificateur de puissance d'attaque de l'attaquant (débuff d'intimidation du T-Rex, etc.)
    if (attacker && attacker.atkPowerMod !== undefined && attacker.atkPowerMod !== 1.0) {
        finalDamage = Math.round(finalDamage * attacker.atkPowerMod);
    }

    // Avantage joueur contre le boss en campagne
    if (attacker && attacker.isP1 && gameMode === 'campaign' && defender.dino && defender.dino.isBoss) {
        finalDamage = Math.round(finalDamage * 1.35);
    }

    if (attacker) {
        attacker.hasHitConfirmed = true;
    }

    // --- DAMAGE SCALING (PRORATION DÉGRESSIVE DU COMBO) ---
    // Les coups de Primal Super gèrent leur propre plancher de proration à 55% dans super-attack.js
    if (!isSuperLockedHit && attackCategory !== 'super' && attacker && attacker.comboCount > 0) {
        let scale = 1.0;
        if (attacker.comboCount === 1) scale = 0.82;
        else if (attacker.comboCount === 2) scale = 0.68;
        else if (attacker.comboCount === 3) scale = 0.54;
        else scale = 0.40;
        finalDamage = Math.max(4, Math.round(finalDamage * scale));
    }

    // --- HYPER-ARMURE DE L'ANKYLOSAURE ---
    if (defender.hasHyperArmor && !isHeavy && attackCategory !== 'throw' && attackCategory !== 'super' && !isSuperLockedHit) {
        finalDamage = Math.max(8, Math.round(finalDamage * 0.5));
        defender.hp = Math.max(0, defender.hp - finalDamage);
        defender.rage = Math.min(100, (defender.rage || 0) + 4.5);
        defender.hitFlashTimer = 0.08;
        defender.hitFlashColor = 0x38bdf8;
        hitstopTimer = Math.max(hitstopTimer, 0.045);
        hitstopTarget = defender;
        if (typeof sfx !== 'undefined') {
            if (typeof sfx.playBlock === 'function') sfx.playBlock(false);
            else if (typeof sfx.playHit === 'function') sfx.playHit(false);
        }
        if (typeof spawnFloatingPopup === 'function') spawnFloatingPopup(defender.x, '🛡️ HYPER ARMURE !', '#38bdf8');
        if (typeof spawn3DBloodAndBones === 'function') spawn3DBloodAndBones(defender.x, (defender.y || 0) + 1.8, 6, false);
        if (typeof updateBattleHUD === 'function') updateBattleHUD();
        if (defender.hp <= 0) {
            _handlePostDamageZeroHp(attacker, defender, false);
        }
        return 'armor';
    }

    // --- MATRICE DIRECTIONNELLE 3-VOIES + PARADE PARFAITE (130ms) ---
    const isBlocking = defender.isBlocking && !defender.isDizzy && !isSuperLockedHit && !defender.isSuperTarget;
    let guardBroken = false;
    let isPerfectParry = false;
    const nowSecParry = (typeof performance !== 'undefined' ? performance.now() : Date.now()) * 0.001;

    if (isBlocking) {
        if (attackCategory === 'throw' || attackCategory === 'seismic') {
            // Chope et Séisme sont strictement inbloquables !
            guardBroken = true;
        } else {
            const isMatchedGuard = typeof DinosaurCombatController !== 'undefined'
                ? DinosaurCombatController.isDirectionalGuardMatched(attackCategory, defender.blockType)
                : (defender.blockType === attackZone);

            if (!isMatchedGuard) {
                guardBroken = true;
                const zoneLabels = {
                    high: '👆 FRAPPE HAUTE (GARDE PERCÉE) !',
                    mid: '👉 FRAPPE MÉDIANE (GARDE PERCÉE) !',
                    low: '🦶 FRAPPE BASSE (GARDE PERCÉE) !'
                };
                if (typeof spawnFloatingPopup === 'function') {
                    spawnFloatingPopup(defender.x, zoneLabels[attackZone] || '💥 GARDE PERCÉE !', '#ef4444');
                }
            } else {
                // Fenêtre de Parade Parfaite : <= 130ms depuis la prise de garde ou le changement de zone
                const guardAge = nowSecParry - (defender.guardStartTime !== undefined ? defender.guardStartTime : -999);
                if (guardAge >= 0 && guardAge <= 0.13) {
                    isPerfectParry = true;
                } else {
                    const staminaCost = opts.guardStaminaCost !== undefined
                        ? opts.guardStaminaCost
                        : (attackCategory === 'super' ? 55 : (isHeavy ? 28 : 14));
                    defender.guardStamina = Math.max(0, (defender.guardStamina !== undefined ? defender.guardStamina : 100) - staminaCost);
                    if (defender.guardStamina <= 0) {
                        guardBroken = true;
                        defender.guardStamina = 50;
                        defender.isBlocking = false;
                        defender.blockType = 'none';
                        defender._prevBlockType = 'none';
                        hitstopTimer = Math.max(hitstopTimer, 0.16);
                        hitstopTarget = defender;
                        camFovKick = Math.max(camFovKick, 3.0);
                        if (typeof sfx !== 'undefined') {
                            if (typeof sfx.playGuardBreak === 'function') sfx.playGuardBreak();
                            else if (typeof sfx.playBoneCrack === 'function') sfx.playBoneCrack();
                        }
                        if (typeof spawnFloatingPopup === 'function') {
                            spawnFloatingPopup(defender.x, '💥 GARDE BRISÉE !', '#ef4444');
                        }
                    }
                }
            }
        }
    }

    if (isBlocking && !guardBroken) {
        const bnds = typeof getStageBounds3D === 'function' ? getStageBounds3D() : { left: STAGE_LEFT_3D, right: STAGE_RIGHT_3D };
        const isCorner = Math.abs(defender.x) >= bnds.right - 1.2;
        const attFacing = attacker ? (attacker.facing || 1) : 1;

        // A. PARADE PARFAITE (<= 130ms) : 0 dégât, 0 endurance, +15 Rage, déviation étendue (0.48s) !
        if (isPerfectParry) {
            if (attacker && attacker.combatController) {
                attacker.combatController.triggerAttackerBlockDeflect(attackZone);
                attacker.combatController.deflectTimer = 0.48;
                attacker.actionDuration = 0;
                attacker.actionTimer = 0;
                attacker.action = 'idle';
                attacker.hitStun = 0.36;
                attacker.vx = -attFacing * 7.2;
            }
            defender.hitStun = 0;
            defender.rage = Math.min(100, (defender.rage || 0) + 15);
            defender.hitFlashTimer = 0.14;
            defender.hitFlashColor = 0xfef08a;
            hitstopTimer = 0.11;
            hitstopTarget = attacker || defender;
            screenShake = Math.max(screenShake, 0.28);
            camFovKick = Math.max(camFovKick, 1.8);

            if (typeof sfx !== 'undefined') {
                if (typeof sfx.playParry === 'function') sfx.playParry();
                else if (typeof sfx.playBlock === 'function') sfx.playBlock(true);
                else if (typeof sfx.playGong === 'function') sfx.playGong();
            }
            if (typeof spawn3DParryBurst === 'function') {
                spawn3DParryBurst(defender.x, (defender.y || 0) + 1.8);
            }
            if (typeof spawn3DGuardDeflectEffect === 'function') {
                spawn3DGuardDeflectEffect(defender, defender.blockType || attackZone);
            }
            if (typeof spawnFloatingPopup === 'function') {
                spawnFloatingPopup(defender.x, '⚡ PARADE PARFAITE !', '#fef08a');
            }
            if (typeof updateBattleHUD === 'function') updateBattleHUD();
            return 'parry';
        }

        // B. GARDE DIRECTIONNELLE NORMALE : Déviation, chip éventuel (Thérizinosaure / Super) & blockstun
        const staleBlockstunMult = (attacker && attacker.combatController)
            ? attacker.combatController.calculateStaleBlockstunMultiplier(attacker.lastStaleCount || 0)
            : 1.0;

        if (attacker && attacker.combatController && !opts.noDeflect) {
            attacker.combatController.triggerAttackerBlockDeflect(attackZone);
            attacker.actionDuration = 0;
            attacker.actionTimer = 0;
            attacker.action = 'idle';
            attacker.hitStun = 0.24;
        }

        const isTherizino = attacker && attacker.dino && (attacker.dino.id === 'therizino' || attacker.dino.id === 'therizinosaurus');
        if (isTherizino) {
            // Thérizinosaure : Griffes déchiqueteuses traversant la garde (40% de dégâts)
            finalDamage = Math.max(14, Math.round(rawDamage * 0.40));
            defender.hitStun = 0.22 * staleBlockstunMult;
            if (isCorner && attacker) {
                attacker.vx = -attFacing * 5.2;
                defender.vx = 0;
            } else {
                defender.vx = attFacing * 5.5;
            }
            screenShake = Math.max(screenShake, 0.25);
            if (typeof spawnFloatingPopup === 'function') {
                spawnFloatingPopup(defender.x, '⚔️ GRIFFES DÉCHIQUETEUSES (CHIP 40%) !', '#f97316');
            }
            if (typeof spawn3DBloodAndBones === 'function') {
                spawn3DBloodAndBones(defender.x, (defender.y || 0) + 1.8, 8, false);
            }
        } else if (attackCategory === 'super') {
            // Primal Super bloquée : 18% de chip damage + gros recul
            finalDamage = opts.chipDamage !== undefined ? opts.chipDamage : Math.max(12, Math.round(rawDamage * 0.18));
            defender.hitStun = 0.26;
            if (attacker) attacker.vx = -attFacing * 7.0;
            if (!isCorner) defender.vx = attFacing * 5.2;
            screenShake = Math.max(screenShake, 0.30);
            if (typeof spawnFloatingPopup === 'function') {
                spawnFloatingPopup(defender.x, `🛡️ SUPER BLOQUÉE ! -${finalDamage}`, '#fbbf24');
            }
        } else {
            // Garde directionnelle standard : 0 dégât & déviation
            finalDamage = 0;
            defender.hitStun = (isHeavy ? 0.22 : 0.11) * staleBlockstunMult;
            if (attacker) attacker.vx = -attFacing * (isHeavy ? 6.2 : 4.5);
            if (!isCorner) {
                defender.vx = attFacing * (isHeavy ? 4.2 : 2.5);
            }
            const deflectLabels = {
                high: '🛡️ DÉVIATION HAUTE !',
                mid: '🛡️ DÉVIATION MÉDIANE !',
                low: '🛡️ DÉVIATION BASSE !'
            };
            if (typeof spawnFloatingPopup === 'function') {
                spawnFloatingPopup(defender.x, deflectLabels[defender.blockType] || '🛡️ DÉVIATION !', '#fbbf24');
            }
        }

        if (typeof sfx !== 'undefined') {
            if (typeof sfx.playBlock === 'function') sfx.playBlock(Boolean(isHeavy));
            else if (typeof sfx.playHit === 'function') sfx.playHit(false);
        }
        hitstopTimer = Math.max(hitstopTimer, isHeavy ? 0.065 : 0.035);
        hitstopTarget = defender;
        camRecoilX += attFacing * (isHeavy ? 0.25 : 0.10);

        if (typeof spawn3DGuardDeflectEffect === 'function') {
            spawn3DGuardDeflectEffect(defender, defender.blockType || attackZone);
        }

        defender.hp = Math.max(0, defender.hp - finalDamage);
        defender.rage = Math.min(100, (defender.rage || 0) + (isHeavy ? 5 : 2.5));
        if (typeof updateBattleHUD === 'function') updateBattleHUD();
        if (defender.hp <= 0) {
            _handlePostDamageZeroHp(attacker, defender, false);
        }
        return 'block';
    }

    // --- IMPACT DIRECT RÉUSSI (COUP NET / COUNTER-HIT / PUNISH / GARDE PERCÉE) ---
    let hitStunMult = 1.0;
    let extraHitstop = 0;

    if (isCounter) {
        finalDamage = Math.round(finalDamage * 1.20);
        hitStunMult = 1.35;
        extraHitstop = 0.055;
        camFovKick = Math.max(camFovKick, 3.2);
        if (typeof sfx !== 'undefined' && typeof sfx.playCounterHit === 'function') {
            sfx.playCounterHit();
        }
        if (typeof spawn3DCounterBurst === 'function') {
            spawn3DCounterBurst(defender.x, (defender.y || 0) + 1.9);
        }
        if (typeof spawnFloatingPopup === 'function') {
            spawnFloatingPopup(defender.x, '🔥 COUNTER !', '#f97316');
        }
    } else if (isPunish) {
        finalDamage = Math.round(finalDamage * 1.15);
        hitStunMult = 1.20;
        extraHitstop = 0.035;
        camFovKick = Math.max(camFovKick, 2.2);
        if (typeof spawnFloatingPopup === 'function') {
            spawnFloatingPopup(defender.x, '⚡ PUNISH !', '#fbbf24');
        }
    }

    // Incrémenter Combo & Dégâts cumulés avant audio & HUD
    if (attacker) {
        attacker.comboCount = (attacker.comboCount || 0) + 1;
        attacker.comboDamage = (attacker.comboDamage || 0) + finalDamage;
    }

    // Audio impact avec pitch combo progressif
    if (typeof sfx !== 'undefined' && typeof sfx.playHit === 'function') {
        sfx.playHit(Boolean(isHeavy), { comboCount: attacker ? attacker.comboCount : 1 });
    }

    // Hitstop hiérarchisé : Light 0.055s, Heavy 0.115s, Special 0.13s, Super 0.15s (+ Counter/GuardBreak)
    const attAct = attacker ? attacker.action : '';
    let baseHitstop = 0.055;
    if (attackCategory === 'super') {
        baseHitstop = isSuperLockedHit ? 0.08 : 0.15;
    } else if (attAct === 'special' || attAct === 'special2' || attackCategory === 'seismic') {
        baseHitstop = 0.13;
    } else if (isHeavy) {
        baseHitstop = 0.115;
    }
    hitstopTimer = Math.max(hitstopTimer, baseHitstop + extraHitstop);
    hitstopTarget = defender;

    // Full-Body Hit-Flash multi-matériaux
    defender.hitFlashTimer = Math.max(defender.hitFlashTimer || 0, isHeavy ? 0.11 : 0.075);
    defender.hitFlashColor = isCounter
        ? 0xf97316
        : ((opts.isSuperBeat && opts.beatNum >= 3) ? 0xf97316 : (isPunish ? 0xfbbf24 : 0xffffff));

    // Recul caméra directionnel + FOV Kick
    const attFacing = attacker ? (attacker.facing || 1) : 1;
    camRecoilX += attFacing * (isHeavy ? 0.55 : 0.22);
    camRecoilY += (attackZone === 'high' ? 0.25 : -0.15);
    camFovKick = Math.max(camFovKick, attackCategory === 'super' ? 3.6 : (isHeavy ? 2.6 : 0.9));

    // Passifs de signature & statuts
    if (attacker && attacker.dino && !defender.isDead) {
        if (attacker.dino.id === 'smilodon' || attacker.dino.id === 'gorgonopsia') {
            defender.bleedStacks = Math.min(3, (defender.bleedStacks || 0) + 1);
            defender.bleedTimer = 4.0;
            const bleedLabel = attacker.dino.id === 'gorgonopsia'
                ? `🩸 DÉCHIRURE SABRE ×${defender.bleedStacks}`
                : `🩸 SAIGNEMENT ×${defender.bleedStacks}`;
            if (typeof spawnFloatingPopup === 'function') spawnFloatingPopup(defender.x, bleedLabel, '#dc2626');
        }
        if (attacker.dino.id === 'pulmonoscorpius') {
            defender.poisonStacks = Math.min(3, (defender.poisonStacks || 0) + 1);
            defender.poisonTimer = 5.0;
            if (typeof spawnFloatingPopup === 'function') spawnFloatingPopup(defender.x, `🧪 VENIN ×${defender.poisonStacks}`, '#22c55e');
        }
        if (attacker.dino.id === 'trex' && (attacker.action === 'special' || attackCategory === 'throw')) {
            defender.atkPowerMod = 0.75;
            defender.atkPowerModTimer = 4.5;
            if (typeof spawnFloatingPopup === 'function') spawnFloatingPopup(defender.x, '🦖 INTIMIDATION (-25% ATQ) !', '#eab308');
        }
    }

    const kbMult = defender.knockbackMult || 1.0;
    const isBossDef = defender.dino && defender.dino.isBoss;
    const stunDecay = Math.max(0.55, 1.0 - Math.max(0, (attacker ? attacker.comboCount : 1) - 1) * 0.12);
    const baseHitStun = isSuperLockedHit
        ? 1.2
        : (isHeavy ? (isBossDef ? 0.46 : 0.36) : (isBossDef ? 0.30 : 0.22));
    defender.hitStun = baseHitStun * stunDecay * hitStunMult;
    defender.lastHitZone = attackZone;

    // Interrompre proprement l'attaque adverse lors d'un impact net (Counter / Hit)
    if (!isSuperLockedHit && defender.actionDuration > 0 && !defender.isSuperAttacker) {
        defender.actionDuration = 0;
        defender.actionTimer = 0;
        defender.action = 'hit';
        defender.hasHyperArmor = false;
    }

    // --- KNOCKDOWN COMBO-FRIENDLY & SUIVI DE JUGGLE AÉRIEN ---
    // Knockdown UNIQUEMENT sur low_heavy, throw, seismic, special, special2, air_heavy, super, ou combo >= 4 (PAS sur heavy neutre!)
    const isKnockdownMove = (
        attAct === 'low_heavy' ||
        attAct === 'air_heavy' ||
        attAct === 'special' ||
        attAct === 'special2' ||
        attAct === 'throw' ||
        attackCategory === 'throw' ||
        attackCategory === 'seismic' ||
        attackCategory === 'super'
    );
    const causesKnockdown = !isSuperLockedHit && !isBossDef && (
        isKnockdownMove ||
        (attacker && attacker.comboCount >= 4)
    );
    if (defender.combatController && !isSuperLockedHit) {
        defender.combatController.triggerDefenderHitOrKnockdown(attackZone, causesKnockdown, 1.15);
    }

    // Suivi du juggle si la cible est touchée en l'air
    const defAirH = (defender.y || 0) - (defender.groundY || 0);
    const isDefenderAirborne = defAirH > 0.20 || Boolean(defender.isFlying);
    if (isDefenderAirborne && !isSuperLockedHit) {
        defender.juggleCount = (defender.juggleCount || 0) + 1;
    }

    const isSuperPosLocked = typeof superState !== 'undefined' && superState && Boolean(superState.lockPositions);
    if (!isSuperLockedHit && !isSuperPosLocked) {
        const bnds = typeof getStageBounds3D === 'function' ? getStageBounds3D() : { left: STAGE_LEFT_3D, right: STAGE_RIGHT_3D };
        const isCorner = Math.abs(defender.x) >= bnds.right - 1.2;
        const pushbackBonus = Math.max(0, (attacker ? attacker.comboCount : 1) - 1) * 1.1;

        if (attackCategory === 'throw') {
            defender.vx = attFacing * 11.5 * kbMult;
            defender.vy = 6.2;
        } else if (attackCategory === 'antiair') {
            defender.vx = attFacing * 3.5 * kbMult;
            defender.vy = Math.max(4.5, 8.6 - (defender.juggleCount || 0) * 1.1);
        } else if (attackCategory === 'low') {
            if (isCorner && attacker) {
                attacker.vx = -attFacing * 4.2;
                defender.vx = 0;
            } else {
                defender.vx = attFacing * (5.5 + pushbackBonus) * kbMult;
            }
            defender.vy = causesKnockdown ? 3.2 : 1.6;
        } else {
            if (isCorner && attacker) {
                attacker.vx = -attFacing * (isHeavy ? 5.6 : 3.8);
                defender.vx = 0;
            } else {
                defender.vx = attFacing * ((isHeavy ? 8.6 : 5.4) + pushbackBonus) * kbMult;
            }
            if (isDefenderAirborne) {
                defender.vy = Math.max(1.5, (isHeavy ? 5.2 : 4.2) - (defender.juggleCount || 0) * 1.15);
            } else if (causesKnockdown) {
                defender.vy = 4.4;
            }
        }
    } else {
        defender.vx = 0;
        defender.vy = 0;
    }

    screenShake = Math.max(screenShake, isHeavy ? 0.38 : 0.16);
    if (isHeavy && typeof triggerGamepadRumble === 'function') {
        triggerGamepadRumble(defender.isP1 ? 0 : 1, 0.35, 0.75, 160);
    }
    if (typeof spawn3DHitImpactBurst === 'function') {
        spawn3DHitImpactBurst(defender, attackZone, isHeavy);
    }
    if (causesKnockdown && typeof spawn3DGroundShockwave === 'function') {
        spawn3DGroundShockwave(defender.x, 0xef4444, 2.4, true);
    }
    if (typeof spawn3DBloodAndBones === 'function') {
        spawn3DBloodAndBones(defender.x, (defender.y || 0) + 2.0, isHeavy ? 18 : 8, isHeavy);
    }

    if (attacker && attacker.isP1 && attacker.comboCount >= 2 && typeof showComboHUD === 'function') {
        showComboHUD(attacker.comboCount, attacker.comboDamage || 0);
    }

    let extraTag = '';
    if (!isSuperLockedHit && attackCategory !== 'super') {
        if (momentumMult >= 1.12) {
            extraTag += ` ⚡+${Math.round((momentumMult - 1) * 100)}%`;
        }
        if (staleMult < 1.0) {
            extraTag += ` ⚠️USÉ ${Math.round(staleMult * 100)}%`;
        }
    }
    const textLabel = (label || (attacker && attacker.comboCount > 1 ? `${attacker.comboCount} HITS ! -${finalDamage}` : `-${finalDamage}`)) + extraTag;
    if (typeof spawnFloatingPopup === 'function') {
        spawnFloatingPopup(defender.x, textLabel, isCounter ? '#f97316' : (isHeavy ? '#ef4444' : '#fde047'));
    }

    if (gameMode === 'practice' && !defender.isP1) {
        defender.hp = Math.max(150, defender.hp - finalDamage);
        defender._practiceRegenDelay = 1.8;
    } else if (isSuperLockedHit) {
        // Garder au moins 1 PV pendant les beats intermédiaires de la Primal Super pour jouer tout le final
        defender.hp = Math.max(1, defender.hp - finalDamage);
    } else {
        defender.hp = Math.max(0, defender.hp - finalDamage);
    }

    if (attacker && !attacker.isSuperAttacker && attackCategory !== 'super') {
        attacker.rage = Math.min(100, (attacker.rage || 0) + (isHeavy ? 6.5 : 4.0));
    }
    if (!defender.isSuperTarget) {
        defender.rage = Math.min(100, (defender.rage || 0) + (isHeavy ? 7.5 : 4.5));
    }

    if (typeof updateBattleHUD === 'function') updateBattleHUD();

    if (defender.hp <= 0 && !isSuperLockedHit && !opts.deferKnockout) {
        const isExtinction = (attackCategory === 'super' || Boolean(opts.isExtinctionFinish)) && Boolean(attacker && attacker.roundsWon >= 1);
        _handlePostDamageZeroHp(attacker, defender, isExtinction);
    }

    return 'hit';
}

function handleKnockout(winner, loser, isExtinctionFinish = false) {
    if (matchState !== 'fight' || koSlowMoTimer > 0) return;

    winner.roundsWon++;
    if (!winner.isSuperAttacker) {
        winner.action = 'idle';
        winner.actionDuration = 0;
        winner.actionTimer = 0;
    }
    winner.bufferedInput = null;
    winner.bufferedAction = null;

    loser.hp = 0;
    loser.isDead = true;
    loser.isDizzy = false;
    loser.isBlocking = false;
    loser.blockType = 'none';
    loser._prevBlockType = 'none';
    loser.bufferedInput = null;
    loser.bufferedAction = null;
    loser.action = 'ko';
    loser.actionDuration = 0;
    loser.actionTimer = 0;
    loser.hitStun = 0;

    // Préserver la trajectoire d'éjection du coup fatal (ou appliquer une projection dramatique par défaut)
    if (Math.abs(loser.vx || 0) < 0.5 && Math.abs(loser.vy || 0) < 0.5) {
        const launchDir = winner ? (winner.facing || (loser.x >= winner.x ? 1 : -1)) : 1;
        loser.vx = launchDir * (isExtinctionFinish ? 13.5 : 9.5);
        loser.vy = isExtinctionFinish ? 7.2 : 5.4;
    }

    // Slow-Mo K.O. cinématique (remplace définitivement finish_him / fatality_anim)
    koSlowMoTimer = isExtinctionFinish ? 1.15 : 0.95;
    battleTimeScale = isExtinctionFinish ? 0.18 : 0.22;
    koPendingData = { winner, loser, isExtinctionFinish: Boolean(isExtinctionFinish) };

    if (typeof sfx !== 'undefined') {
        if (typeof sfx.playKoFinish === 'function') {
            sfx.playKoFinish(Boolean(isExtinctionFinish));
        } else {
            if (typeof sfx.playGong === 'function') sfx.playGong();
            if (typeof sfx.playRoar === 'function') sfx.playRoar(70, 0.65);
        }
    }

    screenShake = Math.max(screenShake, isExtinctionFinish ? 0.95 : 0.65);
    camFovKick = Math.max(camFovKick, isExtinctionFinish ? 4.5 : 3.2);
    if (typeof triggerGamepadRumble === 'function') {
        triggerGamepadRumble(loser.isP1 ? 0 : 1, 0.75, 1.0, isExtinctionFinish ? 480 : 360);
    }

    if (isExtinctionFinish) {
        if (typeof showAnnouncer === 'function') {
            showAnnouncer('☢ EXTINCTION FINISH !', `${winner.dino.name} ANÉANTIT ${loser.dino.name} !`);
        }
        if (typeof showSuperFlashOverlay === 'function' && typeof getSuperSpec === 'function') {
            const spec = getSuperSpec(winner.dino && winner.dino.id);
            if (spec) showSuperFlashOverlay(winner, spec, true);
        }
    } else if (typeof showAnnouncer === 'function') {
        showAnnouncer(
            'K.O. !',
            winner.roundsWon >= 2
                ? `${winner.dino.name} REMPORTE LE KOMBAT !`
                : `${winner.dino.name} REMPORTE LE ROUND ${roundNumber}`
        );
    }

    if (typeof updateBattleHUD === 'function') updateBattleHUD();
}

// ============================================================================
// BLOQUEUR PHYSIQUE ANTI-TRAVERSÉE (BODY BLOCKER / PUSHBOX COLLISION SYSTEM)
// Empêche strictement les deux animaux de se traverser au sol, en course, en dash,
// lors des attaques spéciales ou contre les bords de l'arène.
// ============================================================================
function resolveFighterBodyBlocker(f1, f2) {
    if (!f1 || !f2 || (typeof superState !== 'undefined' && superState && superState.lockPositions)) return;

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

    if (Math.abs(f1.x - f2.x) > minSep * 2.2) {
        f1._lockedSide = f1.x <= f2.x ? -1 : 1;
        return;
    }

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
        const bnds = typeof getStageBounds3D === 'function' ? getStageBounds3D() : { left: STAGE_LEFT_3D, right: STAGE_RIGHT_3D };
        if (f2.x < bnds.left) {
            f2.x = bnds.left;
            f1.x = f2.x + side * minSep;
        } else if (f2.x > bnds.right) {
            f2.x = bnds.right;
            f1.x = f2.x + side * minSep;
        }

        if (f1.x < bnds.left) {
            f1.x = bnds.left;
            f2.x = f1.x - side * minSep;
        } else if (f1.x > bnds.right) {
            f1.x = bnds.right;
            f2.x = f1.x - side * minSep;
        }

        f1.x = Math.max(bnds.left, Math.min(bnds.right, f1.x));
        f2.x = Math.max(bnds.left, Math.min(bnds.right, f2.x));

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

function updateParticles3D(pDt) {
    if (!Array.isArray(particles3D) || particles3D.length === 0) return;
    for (let i = particles3D.length - 1; i >= 0; i--) {
        const pt = particles3D[i];
        if (!pt || !pt.mesh) {
            particles3D.splice(i, 1);
            continue;
        }
        pt.mesh.position.x += (pt.vx || 0) * pDt;
        pt.mesh.position.y += (pt.vy || 0) * pDt;
        pt.mesh.position.z += (pt.vz || 0) * pDt;
        if (pt.onUpdate) {
            pt.onUpdate(pt, pDt);
        } else {
            pt.mesh.rotation.x += 6 * pDt;
            pt.mesh.rotation.y += 6 * pDt;
        }
        if (!pt.noGravity) {
            pt.vy -= 22 * pDt;
            const ptFloorY = (typeof getArenaGroundHeight === 'function' ? getArenaGroundHeight(currentArena, pt.mesh.position.x, pt.mesh.position.z) : 0) + 0.15;
            if (pt.mesh.position.y < ptFloorY) {
                pt.mesh.position.y = ptFloorY;
                pt.vx *= Math.pow(0.6, pDt * 60);
                pt.vy = 0;
            }
        }
        pt.life -= pDt;
        if (pt.life <= 0) {
            if (typeof fxGroup !== 'undefined' && fxGroup) fxGroup.remove(pt.mesh);
            if (pt.ownsMaterial && pt.mesh && pt.mesh.material) {
                pt.mesh.material.dispose();
            }
            particles3D.splice(i, 1);
        }
    }
}

function updateBattle3D(dt, nowSec) {
    if (typeof isMatchPaused !== 'undefined' && isMatchPaused) return;

    // Mode Campagne Smash Melee : mise à jour des vagues, minions et objets
    if (matchState === 'campaign_level') {
        if (typeof updateCampaignLevelEngine === 'function') {
            updateCampaignLevelEngine(dt, nowSec);
        }
    }

    // 1. Hitstop (Impact Freeze) : fige la physique tout en vibrant la cible et en animant les particules
    if (hitstopTimer > 0) {
        hitstopTimer = Math.max(0, hitstopTimer - dt);
        if (hitstopTarget) {
            if (hitstopTimer > 0) {
                const shakeAmp = Math.min(0.22, 0.08 + hitstopTimer * 1.1);
                hitstopTarget.hitShakeOffset = Math.sin((nowSec || 0) * 145) * shakeAmp;
            } else {
                hitstopTarget.hitShakeOffset = 0;
                hitstopTarget = null;
            }
        }
        [fighter1, fighter2].forEach(f => {
            if (!f) return;
            if (f.hitFlashTimer > 0) f.hitFlashTimer = Math.max(0, f.hitFlashTimer - dt * 0.45);
            if (f.rig && f.rig.root) {
                f.rig.root.position.set(f.x + (f.hitShakeOffset || 0), f.y, 0);
            }
        });
        if (screenShake > 0) screenShake = Math.max(0, screenShake - dt * 0.65);
        const hitstopRecoilDecay = Math.exp(-5.0 * dt);
        camRecoilX *= hitstopRecoilDecay;
        camRecoilY *= hitstopRecoilDecay;
        updateParticles3D(dt * 0.65);
        return;
    }
    if (hitstopTarget) {
        hitstopTarget.hitShakeOffset = 0;
        hitstopTarget = null;
    }

    // 2. Compte à rebours du Slow-Mo K.O. (temps réel dt)
    if (koSlowMoTimer > 0) {
        koSlowMoTimer = Math.max(0, koSlowMoTimer - dt);
        if (koSlowMoTimer <= 0) {
            battleTimeScale = 1.0;
            const pending = koPendingData;
            koPendingData = null;
            if (typeof teardownSuperState === 'function') teardownSuperState();
            if (typeof hideSuperFlashOverlay === 'function') hideSuperFlashOverlay();
            if (pending && pending.winner && pending.loser) {
                if (pending.winner.roundsWon >= 2) {
                    finishMatch(pending.winner, pending.loser);
                } else {
                    matchState = 'round_over';
                    stateTimer = 2.0;
                    if (typeof showAnnouncer === 'function') {
                        showAnnouncer('K.O. !', `${pending.winner.dino.name} REMPORTE LE ROUND ${roundNumber}`);
                    }
                }
            }
        }
    }

    const simDt = dt * (typeof battleTimeScale === 'number' ? battleTimeScale : 1.0);

    // 3. Moteur Primal Super (piloté par dt réel, 100% pause-safe)
    if (typeof updateSuperAttack === 'function') {
        updateSuperAttack(dt, nowSec);
    }

    // Super Flash Freeze : figer la simulation des combattants tout en animant l'aura, le flash et la caméra
    if (superState && superState.phase === 'flash') {
        if (screenShake > 0) screenShake = Math.max(0, screenShake - dt * 1.2);
        [fighter1, fighter2].forEach(f => {
            if (!f) return;
            if (f.hitFlashTimer > 0) f.hitFlashTimer = Math.max(0, f.hitFlashTimer - dt);
            if (f.rig && f.rig.root) {
                f.rig.root.position.set(f.x, f.y, 0);
            }
            if (typeof animateDino3DRig === 'function') {
                animateDino3DRig(f, nowSec, dt * 0.15);
            }
        });
        updateParticles3D(dt);
        return;
    }

    // Dynamisme en temps réel du décor de l'arène 3D
    if (typeof updateArenaDynamics === 'function') {
        updateArenaDynamics(currentArena, arenaGroup, battleScene, nowSec, simDt);
    }

    if (screenShake > 0) screenShake = Math.max(0, screenShake - dt * 1.5);

    if (matchState === 'intro') {
        stateTimer -= dt;
        if (!roundIntroAnnounced && stateTimer <= 0.70) {
            roundIntroAnnounced = true;
            if (typeof showAnnouncer === 'function') showAnnouncer('KOMBAT !', 'AFFRONTEZ-VOUS EN 3D !');
            if (typeof sfx !== 'undefined' && typeof sfx.playRoar === 'function') sfx.playRoar(90, 0.35);
        }
        if (stateTimer <= 0) {
            matchState = 'fight';
            if (typeof clearAnnouncer === 'function') clearAnnouncer();
            if (typeof updateGamepadHelperHUD === 'function') {
                updateGamepadHelperHUD();
            }
        }
    } else if (matchState === 'round_over') {
        stateTimer -= dt;
        if (stateTimer <= 0) {
            roundNumber++;
            startNewRound();
        }
    }

    const isCinematicLock = Boolean(
        (superState && (superState.phase === 'flash' || superState.phase === 'cinematic')) ||
        koSlowMoTimer > 0
    );

    // Pause du chronomètre pendant les Super Flash/Cinématiques et le Slow-Mo K.O.
    if (matchState === 'fight' && gameMode !== 'practice' && !isCinematicLock) {
        roundTimerAccum += dt;
        if (roundTimerAccum >= 1) {
            roundTimerAccum = 0;
            roundTimer = Math.max(0, roundTimer - 1);
            const hudTimerEl = typeof document !== 'undefined' ? document.getElementById('hudTimer') : null;
            if (hudTimerEl) {
                hudTimerEl.textContent = typeof formatHudTimer === 'function' ? formatHudTimer(roundTimer) : roundTimer;
            }
            if (roundTimer === 0) {
                const winner = fighter1.hp >= fighter2.hp ? fighter1 : fighter2;
                const loser = winner === fighter1 ? fighter2 : fighter1;
                handleKnockout(winner, loser, false);
            }
        }
    }

    const isSuperPosLocked = Boolean(superState && superState.lockPositions);

    // Verrouiller l'ordre gauche/droite initial avant les déplacements d'inputs et d'IA
    if (fighter1 && fighter2 && !isSuperPosLocked) {
        const isHighAir = Math.abs(fighter1.y - fighter2.y) >= 1.48;
        if (!isHighAir && fighter1._lockedSide === undefined) {
            fighter1._lockedSide = fighter1.x <= fighter2.x ? -1 : 1;
        }
    }

    // Inputs de déplacement & IA (verrouillés pendant Super Flash/Cinématique & Slow-Mo K.O.)
    if ((matchState === 'fight' || matchState === 'campaign_level') && !isCinematicLock) {
        handlePlayer1Inputs(simDt);

        // Assistance Auto-Block optionnelle (Paramètres -> Contrôles)
        if (typeof window !== 'undefined' && window.autoBlockEnabled && fighter1 && fighter2 &&
            !fighter1.isDead && !fighter1.isDizzy && fighter1.hitStun <= 0 &&
            fighter1.actionDuration <= 0 && !fighter1.isBlocking && fighter1.guardStamina > 15 &&
            (fighter1.y - (fighter1.groundY || 0)) <= 0.1) {
            const enemyAttacking = fighter2.actionDuration > 0 &&
                fighter2.action !== 'idle' && fighter2.action !== 'walk' && fighter2.action !== 'crouch';
            if (enemyAttacking && Math.abs(fighter1.x - fighter2.x) < 4.5) {
                fighter1.isBlocking = true;
                const act2 = fighter2.action || '';
                fighter1.blockType = (act2 === 'up_light' || act2 === 'anti_air' || act2.startsWith('air_'))
                    ? 'high'
                    : (act2.startsWith('low_') ? 'low' : 'mid');
            }
        }

        if (gameMode === 'pvp') {
            handlePlayer2Inputs(simDt);
        } else if ((gameMode === 'cpu' || gameMode === 'campaign') && matchState === 'fight' && fighter2) {
            updateAI(fighter2, fighter1, simDt);
        } else if (matchState === 'campaign_level' && fighter2 && (typeof isCampaignBossWaveActive === 'function' ? isCampaignBossWaveActive() : (typeof currentCampaignWaveIdx !== 'undefined' && currentCampaignWaveIdx === 2))) {
            updateAI(fighter2, fighter1, simDt);
        }
        if (fighter1 && fighter2) {
            resolveFighterBodyBlocker(fighter1, fighter2);
        }
    }

    // Mode Entraînement : régénération fluide des PV et de la jauge de Rage
    if (gameMode === 'practice' && matchState === 'fight') {
        let hudDirty = false;
        [fighter1, fighter2].forEach(pf => {
            if (!pf || pf.isDead) return;
            if (pf._practiceRegenDelay > 0) {
                pf._practiceRegenDelay = Math.max(0, pf._practiceRegenDelay - dt);
            } else if (pf.hitStun <= 0 && pf.hp < pf.maxHp) {
                pf.hp = Math.min(pf.maxHp, pf.hp + Math.max(1, pf.maxHp * 0.35 * dt));
                hudDirty = true;
            }
            if (pf.isP1 && pf.rage < 100) {
                pf.rage = Math.min(100, pf.rage + 5 * dt);
                hudDirty = true;
            }
        });
        if (hudDirty && typeof updateBattleHUD === 'function') updateBattleHUD();
    }

    [fighter1, fighter2].forEach(f => {
        if (!f) return;
        const other = f === fighter1 ? fighter2 : fighter1;

        if (f.dashCooldown > 0) f.dashCooldown = Math.max(0, f.dashCooldown - simDt);
        if (f.dashTimer > 0) f.dashTimer = Math.max(0, f.dashTimer - simDt);
        if (f.beingThrownTimer > 0) f.beingThrownTimer = Math.max(0, f.beingThrownTimer - simDt);
        if (f.hitFlashTimer > 0) f.hitFlashTimer = Math.max(0, f.hitFlashTimer - dt);
        if (f.landingSquashTimer > 0) f.landingSquashTimer = Math.max(0, f.landingSquashTimer - simDt);
        if (f.superInvulnTimer > 0) f.superInvulnTimer = Math.max(0, f.superInvulnTimer - simDt);
        f.hitShakeOffset = 0;

        // Décrémentation du Buffer Universel 140ms
        if (f.bufferedInput) {
            f.bufferedInput.ttl -= simDt;
            if (f.bufferedInput.ttl <= 0) {
                f.bufferedInput = null;
            }
        }
        if (f.bufferTimer > 0) {
            f.bufferTimer -= simDt;
            if (f.bufferTimer <= 0) f.bufferedAction = null;
        }

        // Tics du Saignement (Smilodon / Gorgonopsia)
        if (f.bleedTimer > 0 && !f.isDead) {
            f.bleedTimer -= simDt;
            f.bleedTickTimer = (f.bleedTickTimer || 0) + simDt;
            if (f.bleedTickTimer >= 0.8) {
                f.bleedTickTimer = 0;
                const bleedDmg = Math.max(1, Math.round(f.bleedStacks * (f.maxHp * 0.012)));
                f.hp = Math.max(1, f.hp - bleedDmg);
                if (typeof spawn3DBloodAndBones === 'function') spawn3DBloodAndBones(f.x, f.y + 1.8, 6, false);
                if (typeof spawnFloatingPopup === 'function') spawnFloatingPopup(f.x, `🩸 -${bleedDmg}`, '#dc2626');
                if (typeof updateBattleHUD === 'function') updateBattleHUD();
            }
        }

        // Tics de la Neurotoxine (Pulmonoscorpius)
        if (f.poisonTimer > 0 && !f.isDead) {
            f.poisonTimer -= simDt;
            f.poisonTickTimer = (f.poisonTickTimer || 0) + simDt;
            if (f.poisonTickTimer >= 1.0) {
                f.poisonTickTimer = 0;
                const poisonDmg = Math.max(1, Math.round(f.poisonStacks * (f.maxHp * 0.010)));
                f.hp = Math.max(1, f.hp - poisonDmg);
                if (typeof spawnFloatingPopup === 'function') spawnFloatingPopup(f.x, `🧪 -${poisonDmg}`, '#22c55e');
                if (typeof updateBattleHUD === 'function') updateBattleHUD();
            }
        }

        // Décrémentation du débuff d'attaque (T-Rex)
        if (f.atkPowerModTimer > 0) {
            f.atkPowerModTimer -= simDt;
            if (f.atkPowerModTimer <= 0) f.atkPowerMod = 1.0;
        }

        // Régénération de l'endurance de garde hors blocage
        if (!f.isBlocking && f.guardStamina !== undefined && f.guardStamina < 100) {
            f.guardStamina = Math.min(100, f.guardStamina + 14 * simDt);
        }

        // Décrémenter les cooldowns d'attaque
        if (f.cooldowns) {
            for (const key in f.cooldowns) {
                if (f.cooldowns[key] > 0) {
                    f.cooldowns[key] = Math.max(0, f.cooldowns[key] - simDt);
                }
            }
        }

        // Si les positions sont verrouillées par une cinématique Primal Super
        if (isSuperPosLocked) {
            if (f.rig && f.rig.root) {
                f.rig.root.position.set(f.x, f.y, 0);
                f.rig.root.rotation.z = 0;
                const targetRotY = f.facing === 1 ? 0 : Math.PI;
                const rotAlpha = 1 - Math.exp(-16 * simDt);
                f.rig.root.rotation.y += (targetRotY - f.rig.root.rotation.y) * rotAlpha;
            }
            if (typeof animateDino3DRig === 'function') animateDino3DRig(f, nowSec, simDt);
            return;
        }

        let otherX = f.x + (f.facing || 1);
        if (other) {
            otherX = other.x;
        } else if (typeof campaignActiveMinions !== 'undefined' && campaignActiveMinions && campaignActiveMinions.length > 0) {
            let bestDist = Infinity;
            for (const m of campaignActiveMinions) {
                if (!m || m.isDead) continue;
                const d = Math.abs(m.x - f.x);
                if (d < bestDist) {
                    bestDist = d;
                    otherX = m.x;
                }
            }
        }
        const isLockedFacingAct = f.action === 'special' || (f.action && f.action.startsWith('super_'));
        if (!f.isDead && !isLockedFacingAct && f.dashTimer <= 0) {
            f.facing = f.x <= otherX ? 1 : -1;
        }

        // Gestion de la fin du hitstun (réinitialise le compteur combo de l'adversaire!)
        if (f.hitStun > 0) {
            f.hitStun -= simDt;
            if (f.hitStun <= 0) {
                f.hitStun = 0;
                if (other) {
                    if (other.isP1 && other.comboCount > 0 && typeof hideComboHUD === 'function') {
                        hideComboHUD();
                    }
                    other.comboCount = 0;
                    other.comboDamage = 0;
                }
            }
        }

        const prevAirHeight = (f.y || 0) - (f.groundY || 0);
        const wasAirborneNow = Boolean(f._wasAirborne) || prevAirHeight > 0.12 || Boolean(f.isFlying);
        const wasGroundedOnFloor = !f.isFlying && f.vy <= 0.05 && prevAirHeight <= 0.09;

        // Intégration horizontale unique & amortissement exponentiel exact (100% dt-indépendant)
        const isActiveGroundWalk = (
            (f._moveInputDir || 0) !== 0 &&
            f.actionDuration <= 0 &&
            f.dashTimer <= 0 &&
            f.hitStun <= 0 &&
            !f.isFlying &&
            wasGroundedOnFloor
        );
        if (isActiveGroundWalk) {
            f.x += f.vx * simDt;
        } else {
            const damp60 = f.dashTimer > 0 ? 0.94 : (wasGroundedOnFloor ? 0.82 : 0.96);
            const lambda = -60 * Math.log(damp60);
            const decay = Math.exp(-lambda * simDt);
            if (lambda > 1e-6 && simDt > 0) {
                f.x += f.vx * ((1 - decay) / lambda);
            } else {
                f.x += f.vx * simDt;
            }
            f.vx *= decay;
            if (Math.abs(f.vx) < 0.02) f.vx = 0;
        }

        // Intégration verticale cinématique exacte (gravité + bonus progressif anti-infini juggle)
        const grav = 26 * (f.gravityScale || 1.0) * (1 + (f.hitStun > 0 ? (f.juggleCount || 0) * 0.14 : 0));
        if (!f.isFlying && (!wasGroundedOnFloor || f.vy > 0.05)) {
            f.y += f.vy * simDt - 0.5 * grav * simDt * simDt;
        } else {
            f.y += f.vy * simDt;
        }

        // Rebond mural dynamique (Wall Splat) en bordure d'arène
        const bounds = typeof getStageBounds3D === 'function' ? getStageBounds3D() : { left: STAGE_LEFT_3D, right: STAGE_RIGHT_3D };
        const wallBound = bounds.right - 0.25;
        if ((f.x >= wallBound || f.x <= -wallBound) && Math.abs(f.vx) > 6.4 && f.hitStun > 0.08) {
            f.vx = -f.vx * 0.45;
            f.vy = 5.2;
            screenShake = Math.max(screenShake, 0.48);
            if (typeof sfx !== 'undefined' && typeof sfx.playBoneCrack === 'function') sfx.playBoneCrack();
            if (typeof spawnFloatingPopup === 'function') spawnFloatingPopup(f.x, '💥 REBOND MURAL !', '#ef4444');
            if (typeof spawn3DBloodAndBones === 'function') spawn3DBloodAndBones(f.x, f.y + 2.0, 16, true);
        }

        f.x = Math.max(bounds.left, Math.min(bounds.right, f.x));
        resolveFighterBodyBlocker(fighter1, fighter2);

        const groundFloorY = typeof getArenaGroundHeight === 'function' ? getArenaGroundHeight(currentArena, f.x, 0) : 0;
        let supportY = groundFloorY;
        const platforms = typeof getArenaPlatforms === 'function' ? getArenaPlatforms(currentArena) : [];

        // Gestion de la traversée descendante des plateformes semi-solides (Drop Through)
        if (f._dropThroughTimer > 0) {
            f._dropThroughTimer -= simDt;
        } else {
            f._dropThroughTimer = 0;
        }

        for (const plat of platforms) {
            if (plat.isJumpPad) continue;
            if (f.x >= plat.xMin && f.x <= plat.xMax) {
                const platY = plat.y;
                if (!f._dropThroughTimer || f._dropThroughTimer <= 0) {
                    const prevY = f._prevY !== undefined ? f._prevY : f.y;
                    const fallSpeedTolerance = Math.max(0.48, Math.abs(f.vy || 0) * simDt * 2.2);
                    const wasAboveOrOn = (prevY >= platY - 0.20) || (f.groundY !== undefined && Math.abs(f.groundY - platY) < 0.05);
                    const isWithinLatchingZone = f.y >= platY - fallSpeedTolerance;

                    if (wasAboveOrOn && isWithinLatchingZone && f.vy <= 0.15) {
                        if (platY > supportY) {
                            supportY = platY;
                        }
                    }
                }
            }
        }

        // Détection et activation des Cheminées Hydrothermales (Geyser Jump Pads)
        if (f._geyserCooldown > 0) {
            f._geyserCooldown -= simDt;
        } else {
            for (const plat of platforms) {
                if (plat.isJumpPad) {
                    const padX = plat.x;
                    const padY = plat.y !== undefined ? plat.y : groundFloorY;
                    if (Math.abs(f.x - padX) < 1.35 && Math.abs(f.y - padY) < 1.4) {
                        f.vy = plat.jumpForce || 17.5;
                        f.groundY = groundFloorY;
                        f.action = 'jump';
                        f._geyserCooldown = 0.6;
                        if (typeof sfx !== 'undefined' && sfx.playWhoosh) sfx.playWhoosh();
                        if (typeof spawnBubbleGeyserFx === 'function') spawnBubbleGeyserFx(padX, padY);
                        if (typeof spawnFloatingPopup === 'function') spawnFloatingPopup(f.x, '💨 GEYSER ABYSSAL !', '#38bdf8');
                        break;
                    }
                }
            }
        }

        f._prevY = f.y;
        f.groundY = supportY;
        const floorY = supportY;
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
            f.y = floorY;
            f.vy = 0;
        } else if (f.y > floorY) {
            f.vy -= grav * simDt;
            if (f.y <= floorY) {
                f.y = floorY;
                f.vy = 0;
            }
        } else {
            f.y = floorY;
            f.vy = 0;
        }

        // Détection d'atterrissage (airborne -> grounded) : squash, audio, poussière, reset juggle & flush buffer
        const isGroundedNow = !f.isFlying && f.vy <= 0.05 && (f.y - floorY) <= 0.08;
        if (wasAirborneNow && isGroundedNow) {
            f.landingSquashTimer = 0.14;
            f.juggleCount = 0;
            if (f.action === 'jump') {
                f.action = 'idle';
            } else if (f.action === 'air_light' || f.action === 'air_heavy') {
                // Landing cancel des attaques aériennes pour combos fluides
                f.action = 'idle';
                f.actionTimer = 0;
                f.actionDuration = 0;
                f.hasHyperArmor = false;
                if (f.combatController && typeof CombatState !== 'undefined' && (
                    f.combatController.state === CombatState.ATTACK_WINDUP ||
                    f.combatController.state === CombatState.ATTACK_ACTIVE ||
                    f.combatController.state === CombatState.ATTACK_RECOVERY
                )) {
                    f.combatController.state = CombatState.IDLE;
                }
            }
            if (typeof sfx !== 'undefined') {
                if (typeof sfx.playLand === 'function') sfx.playLand(f.weightClass === 'heavy');
                else if (typeof sfx.playFootstep === 'function') sfx.playFootstep(f.weightClass === 'heavy');
            }
            if (typeof spawn3DDustPuff === 'function') {
                spawn3DDustPuff(f.x, floorY, f.weightClass === 'heavy' ? 1.35 : 0.9, f.weightClass === 'heavy' ? 8 : 5);
            }
            if (f.weightClass === 'heavy') {
                screenShake = Math.max(screenShake, 0.10);
            }
        }
        f._wasAirborne = !isGroundedNow;

        if (!f.isDead && !isLockedFacingAct && f.dashTimer <= 0) {
            f.facing = f.x <= otherX ? 1 : -1;
        }

        if (f.actionDuration > 0) {
            f.actionTimer += simDt;
            const progress = f.actionTimer / f.actionDuration;
            const profile = typeof f.getAttackFrameProfile === 'function'
                ? f.getAttackFrameProfile(f.action)
                : (typeof getAttackFrameProfile === 'function' ? getAttackFrameProfile(f.action) : { activeStart: 0.28, activeEnd: 0.68 });
            const isSuperCinematicOrAoe = f.action === 'super_cinematic' || f.action === 'super_aoe';

            // Synchronisation des phases Windup -> Active -> Recovery avec activeStart..activeEnd par coup
            if (f.combatController && typeof CombatState !== 'undefined' && !isSuperCinematicOrAoe) {
                if (progress < profile.activeStart) {
                    f.combatController.state = CombatState.ATTACK_WINDUP;
                } else if (progress <= profile.activeEnd) {
                    f.combatController.state = CombatState.ATTACK_ACTIVE;
                } else {
                    f.combatController.state = CombatState.ATTACK_RECOVERY;
                }
            }

            if (!isSuperCinematicOrAoe && f.action !== 'throw_whiff' && f.action !== 'super_whiff' && !f.hasSpawnedAttackFx && progress >= Math.max(0.18, profile.activeStart - 0.06)) {
                f.hasSpawnedAttackFx = true;
                if (typeof spawn3DAttackEffect === 'function') {
                    spawn3DAttackEffect(f, f.action);
                }
            }

            // CORRECTIF MULTI-FRAMES : on ne verrouille hasHitCurrentAttack QUE lorsque checkAttackCollision3D retourne TRUE !
            if (!isSuperCinematicOrAoe && f.action !== 'throw_whiff' && f.action !== 'super_whiff' && !f.hasHitCurrentAttack) {
                if (other) {
                    if (progress >= profile.activeStart && progress <= profile.activeEnd) {
                        const didConnect = checkAttackCollision3D(f, other);
                        if (didConnect) {
                            f.hasHitCurrentAttack = true;
                        }
                    }
                } else if (matchState === 'campaign_level' && progress >= profile.activeStart && progress <= profile.activeEnd && typeof checkPlayerAttacksAgainstMinions === 'function') {
                    checkPlayerAttacksAgainstMinions();
                }
            }

            // Consommer le buffer si la fenêtre de cancel sur Hit-Confirm s'est ouverte
            if (f.bufferedInput && typeof f.consumeBufferedInput === 'function') {
                f.consumeBufferedInput(other);
            }

            // Fin naturelle de l'attaque (sauf actions super_* pilotées par super-attack.js)
            if (f.actionDuration > 0 && f.actionTimer >= f.actionDuration && !isSuperCinematicOrAoe && f.action !== 'super_startup' && f.action !== 'super_whiff') {
                f.action = 'idle';
                f.actionTimer = 0;
                f.actionDuration = 0;
                f.hasHyperArmor = false;
                f.hasHitConfirmed = false;
                f.lastAttackType = null;
                if (f.combatController && typeof CombatState !== 'undefined' && (
                    f.combatController.state === CombatState.ATTACK_WINDUP ||
                    f.combatController.state === CombatState.ATTACK_ACTIVE ||
                    f.combatController.state === CombatState.ATTACK_RECOVERY
                )) {
                    f.combatController.state = CombatState.IDLE;
                }
            }
        }

        // Flush immédiat du buffer universel 140ms dès que le combattant redevient actionnable (fin recovery / landing / fin hitstun / fin dash)
        if (f.bufferedInput && typeof f.consumeBufferedInput === 'function') {
            f.consumeBufferedInput(other);
        }
    });

    // Résolution stricte du bloqueur physique (Body Blocker) AVANT la mise à jour des matrices 3D et animations
    resolveFighterBodyBlocker(fighter1, fighter2);

    // Synchroniser l'orientation, l'inclinaison sur pente, la position 3D et l'animation (lerps dt-indépendants)
    const isSuperPosLockedAfterStep = Boolean(superState && superState.lockPositions);
    if (!isSuperPosLockedAfterStep) {
        const facingAlpha = 1 - Math.exp(-16 * simDt);
        const slopeAlpha = 1 - Math.exp(-14 * simDt);
        [fighter1, fighter2].forEach(f => {
            if (!f) return;
            const other = f === fighter1 ? fighter2 : fighter1;
            const otherX = other ? other.x : (typeof campaignActiveMinions !== 'undefined' && campaignActiveMinions && campaignActiveMinions[0] ? campaignActiveMinions[0].x : f.x + (f.facing || 1));
            const isLockedFacingAct = f.action === 'special' || (f.action && f.action.startsWith('super_'));
            if (!f.isDead && !isLockedFacingAct && f.dashTimer <= 0) {
                f.facing = f.x <= otherX ? 1 : -1;
            }
            const isGroundedNow = !f.isFlying && f.vy <= 0.05 && (f.y - (f.groundY || 0)) <= 0.09;
            if (isGroundedNow) {
                const supportY = typeof getFighterSupportHeight === 'function' ? getFighterSupportHeight(f, currentArena) : 0;
                f.groundY = supportY;
                f.y = supportY;
            }
            if (f.rig && f.rig.root) {
                f.rig.root.position.set(f.x + (f.hitShakeOffset || 0), f.y, 0);
                const targetRotY = f.facing === 1 ? 0 : Math.PI;
                f.rig.root.rotation.y += (targetRotY - f.rig.root.rotation.y) * facingAlpha;

                const slope = (isGroundedNow && typeof getFighterSurfaceSlope === 'function')
                    ? getFighterSurfaceSlope(f, currentArena)
                    : 0;
                const targetPitchZ = isGroundedNow ? Math.max(-0.26, Math.min(0.26, slope * f.facing * 0.72)) : 0;
                f.rig.root.rotation.z += (targetPitchZ - f.rig.root.rotation.z) * slopeAlpha;
            }

            if (typeof animateDino3DRig === 'function') {
                animateDino3DRig(f, nowSec, simDt);
            }
        });
    }

    // Mise à jour des projectiles 3D (avec simDt pour suivre le slow-mo)
    for (let i = projectiles3D.length - 1; i >= 0; i--) {
        const p = projectiles3D[i];
        p.mesh.position.x += p.vx * simDt;
        p.mesh.rotation.z += 8 * simDt;
        p.life -= simDt;
        const target = p.owner === fighter1 ? fighter2 : fighter1;
        let hitHandled = false;

        // En mode Campagne Vagues 1 & 2 : collisions des projectiles du joueur contre les minions
        if (matchState === 'campaign_level' && p.owner === fighter1 && typeof campaignActiveMinions !== 'undefined') {
            for (let mIdx = 0; mIdx < campaignActiveMinions.length; mIdx++) {
                const minion = campaignActiveMinions[mIdx];
                if (!minion || minion.isDead) continue;
                const hitRadius = (minion.radius || 0.75) + 0.95;
                if (Math.abs(p.mesh.position.x - minion.x) < hitRadius && Math.abs(p.mesh.position.y - (minion.y + 0.8)) < 2.2) {
                    const powBonus = fighter1 && fighter1.dino ? Math.round(fighter1.dino.stats.pow * 1.15) : p.damage;
                    const projDmg = Math.max(p.damage || 85, powBonus);
                    minion.takeDamage(projDmg, (p.vx >= 0 ? 1 : -1) * 9.5, 5.5, 'projectile');
                    if (typeof spawnHitSparks3D === 'function') {
                        spawnHitSparks3D(minion.x, minion.y + 0.9, true);
                    }
                    if (typeof updateCampaignSmashHUD === 'function') updateCampaignSmashHUD();
                    if (typeof fxGroup !== 'undefined' && fxGroup) fxGroup.remove(p.mesh);
                    projectiles3D.splice(i, 1);
                    hitHandled = true;
                    break;
                }
            }
            if (hitHandled) continue;
        }

        // Renvoi de projectile de l'Ankylosaure (ID canonique 'ankylo' + alias 'ankylosaurus')
        const targetIsAnkylo = target && target.dino && (target.dino.id === 'ankylo' || target.dino.id === 'ankylosaurus');
        if (targetIsAnkylo && (target.action === 'special' || target.hasHyperArmor) && Math.abs(p.mesh.position.x - target.x) < 2.6 && Math.abs(p.mesh.position.y - (target.y + 1.8)) < 2.2) {
            p.owner = target;
            p.vx = -p.vx * 1.35;
            if (typeof sfx !== 'undefined') {
                if (typeof sfx.playParry === 'function') sfx.playParry();
                else if (typeof sfx.playBoneCrack === 'function') sfx.playBoneCrack();
            }
            if (typeof spawnFloatingPopup === 'function') spawnFloatingPopup(target.x, '🛡️ RENVOI DE PROJECTILE !', '#38bdf8');
            screenShake = Math.max(screenShake, 0.35);
            continue;
        }

        if (target && !target.isDead && (matchState === 'fight' || matchState === 'campaign_level') &&
            Math.abs(p.mesh.position.x - target.x) < 1.75 && Math.abs(p.mesh.position.y - (target.y + 1.8)) < 2.2) {
            applyDamage(p.owner, target, p.damage, true, '🔥 IMPACT SPÉCIAL !', false, 'mid');
            if (typeof fxGroup !== 'undefined' && fxGroup) fxGroup.remove(p.mesh);
            projectiles3D.splice(i, 1);
            continue;
        }
        if (p.life <= 0) {
            if (typeof fxGroup !== 'undefined' && fxGroup) fxGroup.remove(p.mesh);
            projectiles3D.splice(i, 1);
        }
    }

    // Mise à jour des particules 3D
    updateParticles3D(simDt);

    _hudCooldownThrottle += dt;
    if (_hudCooldownThrottle >= 0.08 && typeof updateBattleHUDCooldowns === 'function') {
        _hudCooldownThrottle = 0;
        updateBattleHUDCooldowns();
    }
}

function finishMatch(winner, loser) {
    battleTimeScale = 1.0;
    koSlowMoTimer = 0;
    koPendingData = null;
    if (typeof teardownSuperState === 'function') teardownSuperState();
    if (typeof hideSuperFlashOverlay === 'function') hideSuperFlashOverlay();

    if (loser) {
        loser.isDizzy = false;
        loser.isDead = true;
        loser.hp = 0;
    }
    if (typeof document !== 'undefined') {
        const sfOverlay = document.getElementById('superFlashOverlay');
        if (sfOverlay) sfOverlay.classList.add('hidden');
    }
    matchState = 'match_over';

    if (typeof showAnnouncer === 'function') {
        if (gameMode === 'campaign') {
            if (winner && winner.isP1) {
                if (campaignStage < 6) {
                    showAnnouncer('ÉTAPE REMPORTÉE !', `${winner.dino.name} ACCÈDE À L'ÉTAPE ${campaignStage + 1} / 6`);
                } else {
                    showAnnouncer('👑 VICTOIRE DE LA TOUR ARCADE !', "VOUS AVEZ TERRASSÉ DRAK'ZUL LE DRAGON SUPRÊME !");
                }
            } else {
                showAnnouncer('DÉFAITE...', `ÉCHEC À L'ÉTAPE ${campaignStage} / 6`);
            }
        } else {
            showAnnouncer(`${winner ? winner.dino.name : 'VAINQUEUR'} VICTORIEUX`, 'VICTOIRE TOTALE !');
        }
    }

    if (typeof showPostMatchMenu === 'function') {
        showPostMatchMenu(winner);
    } else {
        if (typeof updatePostMatchMenuUI === 'function') {
            updatePostMatchMenuUI(winner);
        }
        if (typeof document !== 'undefined') {
            const pmm = document.getElementById('postMatchMenu');
            if (pmm) pmm.classList.remove('hidden');
        }
    }
}
