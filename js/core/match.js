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

    document.getElementById('selectScreen').classList.add('hidden');
    document.getElementById('arenaScreen').classList.add('hidden');
    document.getElementById('mainMenu').classList.add('hidden');
    document.getElementById('battleScreen').classList.remove('hidden');
    document.getElementById('battleScreen').classList.add('flex');
    document.getElementById('btnBackToSelect').classList.remove('hidden');
    document.getElementById('btnResetCam').classList.remove('hidden');
    document.getElementById('postMatchMenu').classList.add('hidden');

    document.getElementById('hudP1Name').textContent = fighter1.dino.name;
    document.getElementById('hudP2Name').textContent = fighter2.dino.name;

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
    document.getElementById('xrayOverlayHud').classList.add('hidden');
    document.getElementById('fatalityPromptBox').classList.add('hidden');
    document.getElementById('postMatchMenu').classList.add('hidden');

    matchState = 'intro';
    stateTimer = 1.6;
    showAnnouncer(`ROUND ${roundNumber}`, `${fighter1.dino.name} VS ${fighter2.dino.name}`);
    updateBattleHUD();

    setTimeout(() => {
        if (matchState === 'intro') {
            showAnnouncer('KOMBAT !', 'AFFRONTEZ-VOUS EN 3D !');
            sfx.playRoar(90, 0.35);
        }
    }, 900);
}

function applyDamage(attacker, defender, rawDamage, isHeavy, label = '', isLockedXrayHit = false) {
    if (defender.isDead) return;

    let finalDamage = rawDamage;
    // Avantage joueur contre le boss en campagne pour rendre le combat palpitant et accessible
    if (attacker.isP1 && gameMode === 'campaign' && defender.dino && defender.dino.isBoss) {
        finalDamage = Math.round(finalDamage * 1.35);
    }

    if (defender.isBlocking && !defender.isDizzy && !isLockedXrayHit && !defender.isXrayTarget) {
        finalDamage = Math.max(8, Math.round(finalDamage * 0.22));
        sfx.playHit(false);
        spawnFloatingPopup(defender.x, '🛡️ BLOQUÉ !', '#fbbf24');
    } else {
        sfx.playHit(isHeavy);
        const isBossDef = defender.dino && defender.dino.isBoss;
        defender.hitStun = isLockedXrayHit ? 1.2 : (isHeavy ? (isBossDef ? 0.48 : 0.36) : (isBossDef ? 0.32 : 0.2));
        // Ne pas repousser les personnages pendant que le X-Ray verrouille leurs positions
        if (!isLockedXrayHit && !xrayLockPositions) {
            defender.vx = attacker.facing * (isHeavy ? 8.5 : 4.5);
            if (isHeavy) defender.vy = 4.2;
        } else {
            defender.vx = 0;
            defender.vy = 0;
        }
        screenShake = isHeavy ? 0.38 : 0.16;
        spawn3DBloodAndBones(defender.x, 2.0, isHeavy ? 18 : 8, isHeavy);

        attacker.comboCount++;
        const textLabel = label || (attacker.comboCount > 1 ? `${attacker.comboCount} HITS ! -${finalDamage}` : `-${finalDamage}`);
        spawnFloatingPopup(defender.x, textLabel, isHeavy ? '#ef4444' : '#fde047');
    }

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
            document.getElementById('hudTimer').textContent = roundTimer;
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
            if (f.hitStun <= 0) f.comboCount = 0;
        }

        f.x += f.vx * dt;
        f.y += f.vy * dt;
        f.vx *= f.dashTimer > 0 ? 0.94 : 0.82;

        if (f.y > 0) {
            f.vy -= 26 * dt;
        } else {
            f.y = 0;
            f.vy = 0;
        }

        f.x = Math.max(STAGE_LEFT_3D, Math.min(STAGE_RIGHT_3D, f.x));

        if (f.actionDuration > 0) {
            f.actionTimer += dt;
            const progress = f.actionTimer / f.actionDuration;

            if (f.action !== 'fatality' && f.action !== 'xray' && !f.hasHitCurrentAttack && progress >= 0.30 && progress <= 0.75) {
                f.hasHitCurrentAttack = true;
                checkAttackCollision3D(f, other);
            }

            // Exécuter automatiquement l'action mise en mémoire tampon (Input Buffer) dès la fenêtre de cancel
            if (f.bufferedAction && f.canCancelInto(f.bufferedAction)) {
                const nextAct = f.bufferedAction;
                f.bufferedAction = null;
                triggerPlayerAction(f, other, nextAct);
            } else if (f.actionTimer >= f.actionDuration && f.action !== 'fatality') {
                f.action = 'idle';
                f.actionTimer = 0;
                f.actionDuration = 0;
                if (f.bufferedAction) {
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
