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

    document.getElementById('selectScreen').classList.add('hidden');
    document.getElementById('arenaScreen').classList.add('hidden');
    document.getElementById('mainMenu').classList.add('hidden');
    document.getElementById('battleScreen').classList.remove('hidden');
    document.getElementById('battleScreen').classList.add('flex');
    const btnBack = document.getElementById('btnBackToSelect');
    if (btnBack) btnBack.classList.add('hidden');
    const btnCam = document.getElementById('btnResetCam');
    if (btnCam) btnCam.classList.add('hidden');
    document.getElementById('postMatchMenu').classList.add('hidden');

    document.getElementById('hudP1Name').textContent = fighter1.dino.name;
    document.getElementById('hudP2Name').textContent = fighter2.dino.name;
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

    while (fxGroup.children.length > 0) fxGroup.remove(fxGroup.children[0]);
    projectiles3D = [];
    particles3D = [];
    roundTimer = 99;
    roundTimerAccum = 0;
    xrayCinematicTimer = 0;
    xrayStage = 0;
    xrayLockPositions = null;
    fatalityFocusFighter = null;

    document.getElementById('hudRoundText').textContent = `ROUND ${roundNumber}`;
    const timerEl = document.getElementById('hudTimer');
    if (timerEl) {
        timerEl.textContent = typeof formatHudTimer === 'function' ? formatHudTimer(roundTimer) : roundTimer;
    }
    document.getElementById('xrayOverlayHud').classList.add('hidden');
    document.getElementById('fatalityPromptBox').classList.add('hidden');
    document.getElementById('postMatchMenu').classList.add('hidden');
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

    let finalDamage = rawDamage;
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

    // --- RÉSOLUTION DE LA DÉFENSE (TRIANGLE ATTAQUE / GARDE / CHOPE) ---
    const isBlocking = defender.isBlocking && !defender.isDizzy && !isLockedXrayHit && !defender.isXrayTarget;
    let guardBroken = false;

    if (isBlocking) {
        if (attackCategory === 'throw') {
            // La chope est strictement inbloquable !
            guardBroken = true;
        } else if (attackCategory === 'low' && defender.blockType === 'high') {
            // Coup bas contre garde haute = garde brisée !
            guardBroken = true;
            spawnFloatingPopup(defender.x, '🦶 COUP BAS (GARDE BRISÉE) !', '#ef4444');
        } else if ((attackCategory === 'overhead' || attackCategory === 'high') && defender.blockType === 'low') {
            // Coup haut / uppercut / overhead contre garde basse accroupie = garde brisée !
            guardBroken = true;
            spawnFloatingPopup(defender.x, attackCategory === 'high' ? '👆 FRAPPE HAUTE (GARDE BRISÉE) !' : '🦅 OVERHEAD (GARDE BRISÉE) !', '#ef4444');
        } else if (attackCategory === 'seismic') {
            guardBroken = true;
        }
    }

    if (isBlocking && !guardBroken) {
        // --- PARADE RÉUSSIE : DEGATS DE GRATTE (CHIP DAMAGE) & BLOCAGE ---
        const isCorner = Math.abs(defender.x) >= STAGE_RIGHT_3D - 1.2;
        if (attacker.dino && attacker.dino.id === 'therizinosaurus') {
            // Thérizinosaure : Griffes déchiqueteuses qui traversent la garde (40% de dégâts)
            finalDamage = Math.max(14, Math.round(rawDamage * 0.40));
            defender.hitStun = 0.22;
            if (isCorner) {
                attacker.vx = -attacker.facing * 5.2;
                defender.vx = 0;
            } else {
                defender.vx = attacker.facing * 5.5;
            }
            sfx.playHit(true);
            screenShake = 0.25;
            spawnFloatingPopup(defender.x, '⚔️ GRIFFES DÉCHIQUETEUSES (CHIP 40%) !', '#f97316');
            spawn3DBloodAndBones(defender.x, 1.8, 8, false);
        } else {
            // Blocage normal : Gratte légère uniquement sur coup lourd / spécial (10%), 0% sur coup léger
            finalDamage = isHeavy ? Math.max(6, Math.round(rawDamage * 0.10)) : 0;
            defender.hitStun = isHeavy ? 0.24 : 0.12;
            if (isCorner) {
                // Reversal pushback : si le défenseur est au mur, l'attaquant rebondit en arrière
                attacker.vx = -attacker.facing * (isHeavy ? 6.5 : 4.5);
                defender.vx = 0;
            } else {
                defender.vx = attacker.facing * (isHeavy ? 7.2 : 5.0);
            }
            sfx.playHit(false);
            spawnFloatingPopup(defender.x, defender.blockType === 'low' ? '🛡️ PARADE BASSE !' : '🛡️ PARADE HAUTE !', '#fbbf24');
            spawn3DBloodAndBones(defender.x, 1.8, 4, false);
        }

        defender.hp = Math.max(0, defender.hp - finalDamage);
        defender.rage = Math.min(100, defender.rage + (isHeavy ? 5 : 2.5));
        updateBattleHUD();
        if (defender.hp <= 0 && matchState === 'fight') handleKnockout(attacker, defender);
        return;
    }

    // --- IMPACT DIRECT RÉUSSI (COUP NET / GARDE BRISÉE) ---
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
    spawn3DBloodAndBones(defender.x, 2.0, isHeavy ? 18 : 8, isHeavy);

    attacker.comboCount++;
    if (attacker.isP1 && attacker.comboCount >= 2 && typeof showComboHUD === 'function') {
        showComboHUD(attacker.comboCount);
    }
    const textLabel = label || (attacker.comboCount > 1 ? `${attacker.comboCount} HITS ! -${finalDamage}` : `-${finalDamage}`);
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
            const { attacker, defender, attX, defX, attFacing, defFacing } = xrayLockPositions;
            attacker.x = attX;
            attacker.y = 0;
            attacker.vx = 0;
            attacker.vy = 0;
            attacker.facing = attFacing;

            defender.x = defX;
            defender.y = 0;
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

    // Bloquer tous les inputs de déplacement et d'IA pendant le X-Ray
    if ((matchState === 'fight' || matchState === 'finish_him') && xrayCinematicTimer <= 0) {
        handlePlayer1Inputs(dt);
        if (gameMode === 'pvp') {
            handlePlayer2Inputs(dt);
        } else if ((gameMode === 'cpu' || gameMode === 'campaign') && matchState === 'fight') {
            updateAI(fighter2, fighter1, dt);
        }
    }

    [fighter1, fighter2].forEach(f => {
        const other = f === fighter1 ? fighter2 : fighter1;

        if (f.dashCooldown > 0) f.dashCooldown = Math.max(0, f.dashCooldown - dt);
        if (f.dashTimer > 0) f.dashTimer = Math.max(0, f.dashTimer - dt);
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
                spawn3DBloodAndBones(f.x, 1.8, 6, false);
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

        f.x += f.vx * dt;
        f.y += f.vy * dt;
        f.vx *= f.dashTimer > 0 ? 0.94 : 0.82;

        // Gravité personnalisée par classe de poids (Heavy, Brawler, Speed)
        if (f.y > 0) {
            f.vy -= 26 * (f.gravityScale || 1.0) * dt;
        } else {
            f.y = 0;
            f.vy = 0;
        }

        // Rebond mural dynamique (Wall Splat) en bordure d'arène
        const wallBound = STAGE_RIGHT_3D - 0.25;
        if ((f.x >= wallBound || f.x <= -wallBound) && Math.abs(f.vx) > 6.4 && f.hitStun > 0.08) {
            f.vx = -f.vx * 0.45;
            f.vy = 5.2;
            screenShake = 0.48;
            sfx.playBoneCrack();
            spawnFloatingPopup(f.x, '💥 REBOND MURAL !', '#ef4444');
            spawn3DBloodAndBones(f.x, 2.0, 16, true);
        }

        f.x = Math.max(STAGE_LEFT_3D, Math.min(STAGE_RIGHT_3D, f.x));

        if (f.actionDuration > 0) {
            f.actionTimer += dt;
            const progress = f.actionTimer / f.actionDuration;

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

        // Synchroniser position et orientation du modèle 3D
        f.rig.root.position.set(f.x, f.y, 0);
        const targetRotY = f.facing === 1 ? 0 : Math.PI;
        f.rig.root.rotation.y += (targetRotY - f.rig.root.rotation.y) * 0.25;

        animateDino3DRig(f, nowSec, dt);
    });

    // Collision physique entre les 2 dinosaures
    const minSep = 2.25;
    const dx = fighter2.x - fighter1.x;
    if (Math.abs(dx) < minSep && Math.abs(fighter1.y - fighter2.y) < 1.8 && matchState !== 'fatality_anim') {
        const push = (minSep - Math.abs(dx)) * 0.5;
        if (dx >= 0) {
            fighter1.x = Math.max(STAGE_LEFT_3D, fighter1.x - push);
            fighter2.x = Math.min(STAGE_RIGHT_3D, fighter2.x + push);
        } else {
            fighter1.x = Math.min(STAGE_RIGHT_3D, fighter1.x + push);
            fighter2.x = Math.max(STAGE_LEFT_3D, fighter2.x - push);
        }
    }

    // Mise à jour des projectiles 3D
    for (let i = projectiles3D.length - 1; i >= 0; i--) {
        const p = projectiles3D[i];
        p.mesh.position.x += p.vx * dt;
        p.mesh.rotation.z += 8 * dt;
        p.life -= dt;
        const target = p.owner === fighter1 ? fighter2 : fighter1;

        // Renvoi de projectile si l'Ankylosaure tournoie ou possède l'hyper-armure
        if (target.dino.id === 'ankylosaurus' && (target.action === 'special' || target.hasHyperArmor) && Math.abs(p.mesh.position.x - target.x) < 2.6) {
            p.owner = target;
            p.vx = -p.vx * 1.35;
            sfx.playBoneCrack();
            spawnFloatingPopup(target.x, '🛡️ RENVOI DE PROJECTILE !', '#38bdf8');
            screenShake = 0.35;
            continue;
        }

        if (Math.abs(p.mesh.position.x - target.x) < 1.55 && Math.abs(target.y) < 2.2 && matchState === 'fight') {
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

    // Mise à jour des particules 3D de sang et d'os
    for (let i = particles3D.length - 1; i >= 0; i--) {
        const pt = particles3D[i];
        pt.mesh.position.x += pt.vx * dt;
        pt.mesh.position.y += pt.vy * dt;
        pt.mesh.position.z += pt.vz * dt;
        pt.mesh.rotation.x += 6 * dt;
        pt.mesh.rotation.y += 6 * dt;
        pt.vy -= 22 * dt;
        if (pt.mesh.position.y < 0.15) {
            pt.mesh.position.y = 0.15;
            pt.vx *= 0.6;
            pt.vy = 0;
        }
        pt.life -= dt;
        if (pt.life <= 0) {
            fxGroup.remove(pt.mesh);
            particles3D.splice(i, 1);
        }
    }

    if (typeof updateBattleHUDCooldowns === 'function') {
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
