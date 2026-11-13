function resolveAttackVariant(attacker, type) {
    if (type !== 'strike' && type !== 'light' && type !== 'heavy') return type;

    const isP1 = attacker.isP1;

    // Détection directionnelle unifiée (Stick analogique, Croix directionnelle, Clavier, Tactile)
    const moveLeft = isP1
        ? (keys['KeyA'] || keys['KeyQ'] || (gameMode !== 'pvp' && keys['ArrowLeft']) || touchState.left)
        : (keys['ArrowLeft'] || p2TouchState.left);
    const moveRight = isP1
        ? (keys['KeyD'] || (gameMode !== 'pvp' && keys['ArrowRight']) || touchState.right)
        : (keys['ArrowRight'] || p2TouchState.right);
    const isUp = isP1
        ? (keys['KeyW'] || keys['KeyZ'] || (gameMode !== 'pvp' && keys['ArrowUp']) || touchState.up)
        : (keys['ArrowUp'] || p2TouchState.up);
    const isDown = isP1
        ? (keys['KeyS'] || keys['ShiftLeft'] || (gameMode !== 'pvp' && keys['ArrowDown']) || touchState.down)
        : (keys['ArrowDown'] || p2TouchState.down);

    // 1. DIRECTION HAUT (STICK / CROIX VERS LE HAUT) ⬆️ : Frappes dirigées vers le HAUT (Zone HIGH)
    if (isUp) {
        return 'up_light';
    }

    const airHeight = attacker.y - (attacker.groundY || 0);

    // 2. DIRECTION BAS (STICK / CROIX VERS LE BAS) ⬇️ : Frappes dirigées vers le BAS (Zone LOW)
    if (isDown) {
        if (airHeight > 0.15) return 'air_light';
        return 'low_light';
    }

    // 3. EN VOL AÉRIEN SANS HAUT/BAS (Attaque sautée)
    if (airHeight > 0.15) {
        return 'air_light';
    }

    // 4. NEUTRE OU AVANT AU SOL / SUR PLATEFORME ⏺️ : Frappe directe au MILIEU (Zone MID)
    return 'light';
}

function triggerPlayerAction(attacker, defender, type) {
    if (!attacker) return;
    if (!defender && matchState !== 'campaign_level') return;
    // Verrouillage strict pendant toute l'animation X-Ray
    if (xrayCinematicTimer > 0) return;

    if (matchState === 'finish_him' && defender && defender.isDizzy) {
        // La Fatalité peut TOUJOURS être exécutée pendant la phase ACHEVEZ-LE
        executeUnique3DFatality(attacker, defender);
        return;
    }
    if (matchState !== 'fight' && matchState !== 'campaign_level') return;

    // SAUTER
    if (type === 'jump') {
        const airHeight = attacker.y - (attacker.groundY || 0);
        if (airHeight <= 0.10) {
            attacker.vy = attacker.jumpVy || 11.8;
            const moveLeft = attacker.isP1
                ? (keys['KeyA'] || keys['KeyQ'] || (gameMode !== 'pvp' && keys['ArrowLeft']) || touchState.left)
                : (keys['ArrowLeft'] || p2TouchState.left);
            const moveRight = attacker.isP1
                ? (keys['KeyD'] || (gameMode !== 'pvp' && keys['ArrowRight']) || touchState.right)
                : (keys['ArrowRight'] || p2TouchState.right);
            const curWalkSpd = (attacker.dino && attacker.dino.walkSpeed) || 7.5;
            if (moveLeft) attacker.vx = -curWalkSpd * 0.70;
            if (moveRight) attacker.vx = curWalkSpd * 0.70;
            sfx.playHit(false);
            spawnFloatingPopup(attacker.x, '🦘 SAUT !', '#38bdf8');
        }
        return;
    }

    // PROTÉGER : Armure directionnelle 3-voies (Haute, Médiane, Basse)
    if (type === 'guard') {
        const isP1 = attacker.isP1;
        const isUp = isP1
            ? (keys['KeyW'] || keys['KeyZ'] || (gameMode !== 'pvp' && keys['ArrowUp']) || touchState.up)
            : (keys['ArrowUp'] || p2TouchState.up);
        const isDown = isP1
            ? (keys['KeyS'] || keys['ShiftLeft'] || (gameMode !== 'pvp' && keys['ArrowDown']) || touchState.down)
            : (keys['ArrowDown'] || p2TouchState.down);

        attacker.isBlocking = true;
        attacker.blockType = isUp ? 'high' : (isDown ? 'low' : 'mid');
        attacker.action = attacker.blockType === 'low' ? 'crouch' : 'idle';
        attacker.vx = 0;
        return;
    }

    // DASH : Ruée rapide et esquive
    if (type === 'dash') {
        const moveLeft = attacker.isP1
            ? (keys['KeyA'] || keys['KeyQ'] || (gameMode !== 'pvp' && keys['ArrowLeft']) || touchState.left)
            : (keys['ArrowLeft'] || p2TouchState.left);
        const moveRight = attacker.isP1
            ? (keys['KeyD'] || (gameMode !== 'pvp' && keys['ArrowRight']) || touchState.right)
            : (keys['ArrowRight'] || p2TouchState.right);
        const dir = moveLeft ? -1 : (moveRight ? 1 : attacker.facing);
        attacker.startDash(dir);
        return;
    }

    // SUPER ATTAQUE : Attaque X-Ray / Rage ultime
    if (type === 'xray') {
        if (attacker.rage < 100) {
            if (attacker.isP1 || gameMode === 'pvp') {
                sfx.playCooldownWarning();
                spawnFloatingPopup(attacker.x, '⚡ RAGE INSUFFISANTE (100% REQUIS) !', '#ef4444');
            }
            return;
        }
        if (attacker.cooldowns && attacker.cooldowns['xray'] > 0) {
            if (attacker.isP1 || gameMode === 'pvp') {
                sfx.playCooldownWarning();
                spawnFloatingPopup(attacker.x, `⏳ X-RAY EN RECHARGE (${attacker.cooldowns['xray'].toFixed(1)}s)`, '#94a3b8');
            }
            return;
        }
        executeXRayMove(attacker, defender);
        if (attacker.cooldowns && attacker.maxCooldowns) {
            attacker.cooldowns['xray'] = attacker.maxCooldowns['xray'];
        }
        return;
    }

    // FRAPPER & SPÉCIAL : Résolution contextuelle (Haut, Mid, Bas) ou Spécial unique
    const finalType = resolveAttackVariant(attacker, type);
    attacker.startAttack(finalType);
}

function executeXRayMove(attacker, defender) {
    if (xrayCinematicTimer > 0) return;
    attacker.rage = 0;

    const dist = Math.abs(attacker.x - defender.x);
    if (dist < 10.5) {
        // Verrouillage complet des 2 dinosaures face à face pour toute la durée du X-Ray
        const lockDefX = Math.max(STAGE_LEFT_3D + 3.0, Math.min(STAGE_RIGHT_3D - 3.0, defender.x));
        const lockAttX = lockDefX - attacker.facing * 2.25;
        const attGroundY = typeof getArenaGroundHeight === 'function' ? getArenaGroundHeight(currentArena, lockAttX, 0) : 0;
        const defGroundY = typeof getArenaGroundHeight === 'function' ? getArenaGroundHeight(currentArena, lockDefX, 0) : 0;

        attacker.x = lockAttX;
        attacker.y = attGroundY;
        attacker.groundY = attGroundY;
        attacker.onPlatform = null;
        attacker.vx = 0;
        attacker.vy = 0;
        attacker.isBlocking = false;
        attacker.bufferedAction = null;
        attacker.action = 'xray';
        attacker.actionTimer = 0;
        attacker.actionDuration = 2.35;
        attacker.isXrayAttacker = true;

        defender.x = lockDefX;
        defender.y = defGroundY;
        defender.groundY = defGroundY;
        defender.onPlatform = null;
        defender.vx = 0;
        defender.vy = 0;
        defender.isBlocking = false;
        defender.bufferedAction = null;
        defender.action = 'idle';
        defender.actionTimer = 0;
        defender.actionDuration = 0;
        defender.hitStun = 2.45;
        defender.isXrayTarget = true;

        xrayLockPositions = {
            attacker,
            defender,
            attX: lockAttX,
            defX: lockDefX,
            attY: attGroundY,
            defY: defGroundY,
            attFacing: attacker.facing,
            defFacing: -attacker.facing
        };

        xrayCinematicTimer = 2.35;
        xrayElapsed = 0;
        xrayPhaseApplied = 1;
        xrayStage = 1;

        const hud = document.getElementById('xrayOverlayHud');
        const titleEl = document.getElementById('xrayBoneTitle');
        const psiEl = document.getElementById('xrayPsiDetail');
        const phaseEl = document.getElementById('xrayPhaseCounter');
        const targetEl = document.getElementById('xrayTargetLabel');

        if (hud) hud.classList.remove('hidden');
        if (targetEl) targetEl.textContent = `CIBLE VERROUILLÉE : ${defender.dino.fullName.toUpperCase()}`;

        const totalDmg = Math.round(attacker.dino.stats.pow * 2.55);
        const hit1 = Math.round(totalDmg * 0.30);
        const hit2 = Math.round(totalDmg * 0.35);
        const hit3 = totalDmg - hit1 - hit2;

        xrayContext = { attacker, defender, totalDmg, hit2, hit3 };

        // PHASE 1 : FRACTURE DU CRÂNE & MÂCHOIRE (Phases 2 & 3 pilotées par dt dans updateBattle3D)
        if (phaseEl) phaseEl.textContent = 'IMPACT 1 / 3 • CRÂNE';
        if (titleEl) titleEl.textContent = '💀 FRACTURE MAXILLO-CRÂNIENNE';
        if (psiEl) psiEl.textContent = 'PRESSION : 4 950 PSI • DENTS & OS TEMPORAL BROYÉS';
        sfx.playBoneCrack();
        screenShake = 0.55;
        if (typeof triggerGamepadRumble === 'function') triggerGamepadRumble(0, 0.5, 0.8, 220);
        spawn3DBloodAndBones(defender.x, 2.8, 22, true);
        applyDamage(attacker, defender, hit1, true, '☢ X-RAY : CRÂNE BROYÉ !', true);
    } else {
        attacker.action = 'xray';
        attacker.actionTimer = 0;
        attacker.actionDuration = 0.65;
        spawn3DProjectile(attacker, 'xray_wave');
    }
}

// 9. LES 9 FATALITÉS 3D DISTINCTES EN TEMPS RÉEL
function executeUnique3DFatality(winner, loser) {
    matchState = 'fatality_anim';
    stateTimer = 3.8;
    fatalityFocusFighter = winner;
    document.getElementById('fatalityPromptBox').classList.add('hidden');

    winner.action = 'fatality';
    winner.actionTimer = 0;
    winner.actionDuration = 3.5;
    winner.x = loser.x - winner.facing * 2.8;
    winner.facing = loser.x >= winner.x ? 1 : -1;

    const id = winner.dino.id;
    showAnnouncer(winner.dino.fatalityName.replace(' (R)', ''), 'FATALITÉ 3D EN COURS !');
    sfx.playGong();
    sfx.playRoar(65, 0.8);
    screenShake = 0.5;


    const fighterImpl = FIGHTER_IMPLS[id];
    if (fighterImpl && fighterImpl.executeFatality) fighterImpl.executeFatality(winner, loser);
}

function checkAttackCollision3D(attacker, defender) {
    // Invulnérabilité pendant la séquence de relevé (Wake_Up_Stand) ou Grounded_Idle
    if (defender.combatController && defender.combatController.state === CombatState.WAKE_UP_STAND) {
        spawnFloatingPopup(defender.x, '🛡️ INVULNÉRABLE (RELEVÉ) !', '#38bdf8');
        return;
    }

    const dist = Math.abs(attacker.x - defender.x);
    const basePow = attacker.dino.stats.pow;

    if (attacker.action === 'special') {
        const fighterImpl = FIGHTER_IMPLS[attacker.dino.id];
        if (fighterImpl && fighterImpl.onSpecial) {
            fighterImpl.onSpecial(attacker, defender, dist, basePow);
            return;
        }
        attacker.vx = attacker.facing * 22;
        if (dist < 4.6) {
            applyDamage(attacker, defender, Math.round(basePow * 1.1), true, attacker.dino.special1Name.replace(' (H)', ''));
        }
        return;
    }

    if (attacker.action === 'special2') {
        const fighterImpl = FIGHTER_IMPLS[attacker.dino.id];
        if (fighterImpl && fighterImpl.onSpecial2) {
            fighterImpl.onSpecial2(attacker, defender, dist, basePow);
        } else {
            spawn3DProjectile(attacker, 'boulder');
        }
        return;
    }

    const reachImpl = FIGHTER_IMPLS[attacker.dino.id];
    let reach = ((reachImpl && reachImpl.attackReach) || 3.45);
    const act = attacker.action;

    if (act === 'fwd_light' || act === 'fwd_heavy') reach += 0.85;
    else if (act === 'heavy' || act === 'low_heavy') reach += 0.55;
    else if (act === 'anti_air' || act === 'up_light') reach += 0.35;

    // Évaluation découplée des volumes THREE.Box3 (ColliderRig Hitbox vs Hurtbox)
    let box3Hit = false;
    if (attacker.colliderRig && defender.colliderRig && attacker.combatController) {
        const atkKey = attacker.combatController.activeAttackKey || AnimationKey.ATTACK_MID;
        attacker.colliderRig.setHitboxActive(atkKey, true);
        const boxResult = attacker.colliderRig.checkIntersection(atkKey, defender.colliderRig);
        attacker.colliderRig.setHitboxActive(atkKey, false);
        box3Hit = boxResult.intersected;
    }

    const yDiff = Math.abs(attacker.y - defender.y);
    const defAirH = defender.y - (defender.groundY || 0);
    const inRange = (dist <= reach) || box3Hit;

    if (act === 'up_light') {
        // Direction HAUT ⬆️ : Uppercut / Morsure haute ascendante (Zone HIGH)
        if (inRange && (defAirH > 0.25 || defender.y > attacker.y + 0.35 || yDiff < 2.9)) {
            applyDamage(attacker, defender, Math.round(basePow * 0.52), false, '👆 UPPERCUT HAUT !', false, 'high');
            defender.vy = Math.max(defender.vy, 4.6);
            defender.onPlatform = null;
        }
        return;
    }

    if (act === 'anti_air') {
        // Direction HAUT/ARRIÈRE ⬆️ : Launcher céleste (Zone HIGH)
        if (inRange && (defAirH > 0.35 || defender.y > attacker.y + 0.35 || dist < 2.6 || box3Hit)) {
            applyDamage(attacker, defender, Math.round(basePow * 0.84), true, '🚀 LAUNCHER CÉLESTE !', false, 'antiair');
            defender.onPlatform = null;
        }
        return;
    }

    if (act === 'low_light') {
        // Direction BAS ⬇️ : Balayage bas des chevilles au ras du sol (Zone LOW)
        if (inRange && yDiff < 1.6) {
            applyDamage(attacker, defender, Math.round(basePow * 0.46), false, '🦶 BALAYAGE BAS !', false, 'low');
        }
        return;
    }

    if (act === 'low_heavy') {
        // Direction BAS LOURD ⬇️ : Écrasement pilonnage lourd au ras du sol (Zone LOW)
        if (inRange && yDiff < 1.7) {
            applyDamage(attacker, defender, Math.round(basePow * 0.86), true, '💥 ÉCRASEMENT BAS !', false, 'low');
        }
        return;
    }

    if (act === 'back_light') {
        // Direction ARRIÈRE ⬅️ : Coup défensif en recul (Zone MID)
        if (inRange && yDiff < 2.2) {
            applyDamage(attacker, defender, Math.round(basePow * 0.44), false, '🛡️ CONTRE ARRIÈRE !', false, 'mid');
        }
        return;
    }

    if (act === 'air_light' || act === 'air_heavy') {
        // Attaque sautée plongeante : coup Overhead (Zone HIGH)
        if (inRange && yDiff < 2.9) {
            const isH = act === 'air_heavy';
            applyDamage(attacker, defender, Math.round(basePow * (isH ? 0.92 : 0.52)), isH, isH ? '🦅 DIVE HEAVY !' : '🦅 DIVE KICK !', false, 'overhead');
        }
        return;
    }

    // Coups standards et frappes avancées au sol (Zone MID)
    if (inRange && yDiff < 2.5) {
        if (act === 'light') {
            applyDamage(attacker, defender, Math.round(basePow * 0.48), false, '', false, 'mid');
        } else if (act === 'light2') {
            applyDamage(attacker, defender, Math.round(basePow * 0.58), false, '⚡ COMBO 2-HITS !', false, 'mid');
        } else if (act === 'fwd_light') {
            applyDamage(attacker, defender, Math.round(basePow * 0.54), false, '👉 PERCÉE AVANT !', false, 'mid');
        } else if (act === 'heavy') {
            applyDamage(attacker, defender, Math.round(basePow * 0.88), true, '', false, 'mid');
        } else if (act === 'fwd_heavy') {
            applyDamage(attacker, defender, Math.round(basePow * 0.98), true, '💥 BÉLIER AVANT !', false, 'mid');
        }
    }
}

// Spécial 2 sismique partagé (Apatosaure, Pachyrhinosaure, Mégathérium, Stégosaure)
function special2SeismicQuake(attacker, defender, dist, basePow) {
    screenShake = 0.65;
    if (typeof spawn3DGroundShockwave === 'function') {
        spawn3DGroundShockwave(attacker.x + attacker.facing * 2.0, 0xf59e0b, 4.2, true);
        spawn3DGroundShockwave(defender.x, 0xef4444, 3.0, true);
    }
    spawn3DBloodAndBones(defender.x, defender.y + 0.3, 18, true);
    if (dist < 8.5) {
        const defAirH = defender.y - (defender.groundY || 0);
        // Si l'adversaire saute ou est en vol, il évite l'onde sismique !
        if (defAirH > 0.25) {
            spawnFloatingPopup(defender.x, '🕊️ SÉISME ÉVITÉ EN VOL / SAUT !', '#38bdf8');
        } else {
            // Onde sismique inbloquable au sol : force le saut !
            defender.isBlocking = false;
            defender.blockType = 'none';
            applyDamage(attacker, defender, Math.round(basePow * 1.25), true, '💥 SÉISME AU SOL (INBLOQUABLE) !', false, 'seismic');
            defender.vy = 5.2;
        }
    }
}
