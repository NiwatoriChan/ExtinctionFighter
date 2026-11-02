function resolveAttackVariant(attacker, type) {
    if (type !== 'light' && type !== 'heavy') return type;

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

    const isForward = (attacker.facing === 1 && moveRight) || (attacker.facing === -1 && moveLeft);
    const isBack = (attacker.facing === 1 && moveLeft) || (attacker.facing === -1 && moveRight);

    // 1. DIRECTION HAUT (STICK / CROIX VERS LE HAUT) ⬆️ : Frappes dirigées vers le HAUT (Ciel)
    if (isUp) {
        return type === 'light' ? 'up_light' : 'anti_air';
    }

    // 2. DIRECTION BAS (STICK / CROIX VERS LE BAS) ⬇️ : Frappes dirigées vers le BAS (Sol)
    if (isDown) {
        if (attacker.y > 0.15) return 'air_heavy'; // En l'air : piqué plongeant lourd vers le sol
        return type === 'light' ? 'low_light' : 'low_heavy';
    }

    // 3. DIRECTION AVANT (STICK / CROIX VERS L'AVANT) ➡️ : Frappes dirigées vers l'AVANT (Horizontale)
    if (isForward) {
        if (attacker.y > 0.15) return 'air_light'; // En l'air : frappe volante vers l'avant
        return type === 'light' ? 'fwd_light' : 'fwd_heavy';
    }

    // 4. DIRECTION ARRIÈRE (STICK / CROIX VERS L'ARRIÈRE) ⬅️ : Frappes défensives en recul
    if (isBack) {
        return type === 'light' ? 'back_light' : 'anti_air';
    }

    // 5. EN L'AIR SANS DIRECTION PARTICULIÈRE (NEUTRE EN VOL)
    if (attacker.y > 0.15) {
        return type === 'light' ? 'air_light' : 'air_heavy';
    }

    // 6. NEUTRE AU SOL (AUCUNE DIRECTION) ⏺️ : Frappes directes au centre (mi-hauteur)
    return type;
}

function triggerPlayerAction(attacker, defender, type) {
    if (!attacker || !defender) return;
    // Verrouillage strict pendant toute l'animation X-Ray
    if (xrayCinematicTimer > 0) return;

    if (matchState === 'finish_him' && defender.isDizzy) {
        // La Fatalité peut TOUJOURS être exécutée pendant la phase ACHEVEZ-LE
        executeUnique3DFatality(attacker, defender);
        return;
    }
    if (matchState !== 'fight') return;

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

    // --- MÉCANIQUE DE CHOPE / PROJECTION (UNBLOCKABLE THROW) ---
    if (type === 'throw') {
        const dist = Math.abs(attacker.x - defender.x);
        const inThrowRange = dist <= 2.95 && Math.abs(attacker.y - defender.y) < 2.0 && !defender.isDead;
        if (inThrowRange) {
            attacker.startAttack('throw');
            defender.isBlocking = false;
            defender.blockType = 'none';
            sfx.playBoneCrack();
            sfx.playHit(true);
            screenShake = 0.55;
            applyDamage(attacker, defender, Math.round(attacker.dino.stats.pow * 0.75), true, '🤜 PROJECTION !', false, 'throw');
            defender.vx = attacker.facing * 12.0;
            defender.vy = 5.2;
            spawn3DBloodAndBones(defender.x, 1.8, 18, true);
        } else {
            attacker.startAttack('throw_whiff');
            spawnFloatingPopup(attacker.x, 'CHOPE MANQUÉE !', '#94a3b8');
        }
        return;
    }

    if (type === 'xray') {
        // Le X-Ray Fatal est UNIQUEMENT disponible lorsque la jauge de rage est à 100%
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

    // Résolution contextuelle des Command Normals selon la direction tenue
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

        attacker.x = lockAttX;
        attacker.y = 0;
        attacker.vx = 0;
        attacker.vy = 0;
        attacker.isBlocking = false;
        attacker.bufferedAction = null;
        attacker.action = 'xray';
        attacker.actionTimer = 0;
        attacker.actionDuration = 2.35;
        attacker.isXrayAttacker = true;

        defender.x = lockDefX;
        defender.y = 0;
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
            attFacing: attacker.facing,
            defFacing: -attacker.facing
        };

        xrayCinematicTimer = 2.35;
        xrayStage = 1;

        const hud = document.getElementById('xrayOverlayHud');
        const titleEl = document.getElementById('xrayBoneTitle');
        const psiEl = document.getElementById('xrayPsiDetail');
        const phaseEl = document.getElementById('xrayPhaseCounter');
        const targetEl = document.getElementById('xrayTargetLabel');

        hud.classList.remove('hidden');
        targetEl.textContent = `CIBLE VERROUILLÉE : ${defender.dino.fullName.toUpperCase()}`;

        const totalDmg = Math.round(attacker.dino.stats.pow * 2.55);
        const hit1 = Math.round(totalDmg * 0.30);
        const hit2 = Math.round(totalDmg * 0.35);
        const hit3 = totalDmg - hit1 - hit2;

        // PHASE 1 : FRACTURE DU CRÂNE & MÂCHOIRE (Mouvement bloqué)
        phaseEl.textContent = 'IMPACT 1 / 3 • CRÂNE';
        titleEl.textContent = '💀 FRACTURE MAXILLO-CRÂNIENNE';
        psiEl.textContent = 'PRESSION : 4 950 PSI • DENTS & OS TEMPORAL BROYÉS';
        sfx.playBoneCrack();
        screenShake = 0.55;
        spawn3DBloodAndBones(defender.x, 2.8, 22, true);
        applyDamage(attacker, defender, hit1, true, '☢ X-RAY : CRÂNE BROYÉ !', true);

        // PHASE 2 : CAGE THORACIQUE & ORGANES INTERNES (Mouvement bloqué)
        setTimeout(() => {
            if (xrayCinematicTimer <= 0 || matchState !== 'fight') return;
            xrayStage = 2;
            phaseEl.textContent = 'IMPACT 2 / 3 • THORAX';
            titleEl.textContent = '🫀 PERFORATION DE LA CAGE THORACIQUE';
            psiEl.textContent = 'PRESSION : 6 400 PSI • 6 CÔTES BRISÉES & HÉMORRAGIE';
            sfx.playBoneCrack();
            sfx.playHit(true);
            screenShake = 0.7;
            spawn3DBloodAndBones(defender.x, 2.1, 28, true);
            applyDamage(attacker, defender, hit2, true, '☢ X-RAY : CÔTES PULVÉRISÉES !', true);
        }, 750);

        // PHASE 3 : RUPTURE DE LA COLONNE VERTÉBRALE & PROJECTION FINALE
        setTimeout(() => {
            if (xrayCinematicTimer <= 0 || matchState !== 'fight') return;
            xrayStage = 3;
            phaseEl.textContent = 'IMPACT 3 / 3 • VERTÈBRES';
            titleEl.textContent = '⚡ RUPTURE VERTÉBRALE CRITIQUE';
            psiEl.textContent = 'PRESSION : 8 900 PSI • DISLOCATION CERVICALE TOTALE';
            sfx.playBoneCrack();
            sfx.playRoar(62, 0.65);
            screenShake = 0.95;
            spawn3DBloodAndBones(defender.x, 2.3, 38, true);
            // Libérer le verrouillage sur l'impact final pour projeter la victime et autoriser le KO
            xrayLockPositions = null;
            applyDamage(attacker, defender, hit3, true, `💥 TOTAL X-RAY : -${totalDmg} PV !`, false);
            defender.vx = attacker.facing * 13.5;
            defender.vy = 6.8;
        }, 1500);
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

    const yDiff = Math.abs(attacker.y - defender.y);

    if (act === 'up_light') {
        // Direction HAUT ⬆️ : Uppercut / Morsure haute ascendante (touche au ciel et debout, brise la garde basse)
        if (dist <= reach && (defender.y > 0.25 || yDiff < 2.9)) {
            applyDamage(attacker, defender, Math.round(basePow * 0.52), false, '👆 UPPERCUT HAUT !', false, 'high');
            defender.vy = Math.max(defender.vy, 4.6);
        }
        return;
    }

    if (act === 'anti_air') {
        // Direction HAUT/ARRIÈRE ⬆️ : Launcher céleste (propulse puissamment l'ennemi dans les airs)
        if (dist <= reach && (defender.y > 0.35 || dist < 2.6)) {
            applyDamage(attacker, defender, Math.round(basePow * 0.84), true, '🚀 LAUNCHER CÉLESTE !', false, 'antiair');
        }
        return;
    }

    if (act === 'low_light') {
        // Direction BAS ⬇️ : Balayage bas des chevilles au ras du sol
        if (dist <= reach && yDiff < 1.6) {
            applyDamage(attacker, defender, Math.round(basePow * 0.46), false, '🦶 BALAYAGE BAS !', false, 'low');
        }
        return;
    }

    if (act === 'low_heavy') {
        // Direction BAS LOURD ⬇️ : Écrasement pilonnage lourd au ras du sol
        if (dist <= reach && yDiff < 1.7) {
            applyDamage(attacker, defender, Math.round(basePow * 0.86), true, '💥 ÉCRASEMENT BAS !', false, 'low');
        }
        return;
    }

    if (act === 'back_light') {
        // Direction ARRIÈRE ⬅️ : Coup défensif en recul
        if (dist <= reach && yDiff < 2.2) {
            applyDamage(attacker, defender, Math.round(basePow * 0.44), false, '🛡️ CONTRE ARRIÈRE !', false, 'mid');
        }
        return;
    }

    if (act === 'air_light' || act === 'air_heavy') {
        // Attaque sautée plongeante : coup Overhead (brise la garde basse accroupie)
        if (dist <= reach && yDiff < 2.9) {
            const isH = act === 'air_heavy';
            applyDamage(attacker, defender, Math.round(basePow * (isH ? 0.92 : 0.52)), isH, isH ? '🦅 DIVE HEAVY !' : '🦅 DIVE KICK !', false, 'overhead');
        }
        return;
    }

    // Coups standards et frappes avancées au sol
    if (dist <= reach && yDiff < 2.5) {
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
    spawn3DBloodAndBones(defender.x, 0.3, 18, true);
    if (dist < 8.5) {
        // Si l'adversaire saute, il évite l'onde de choc sismique qui se propage au sol
        if (defender.y > 0.25) {
            spawnFloatingPopup(defender.x, '🕊️ SÉISME ÉVITÉ EN VOL !', '#38bdf8');
        } else {
            // Onde sismique inbloquable au sol : force le saut !
            defender.isBlocking = false;
            defender.blockType = 'none';
            applyDamage(attacker, defender, Math.round(basePow * 1.25), true, '💥 SÉISME AU SOL (INBLOQUABLE) !', false, 'seismic');
            defender.vy = 5.2;
        }
    }
}
