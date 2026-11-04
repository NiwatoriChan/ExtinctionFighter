let aiDecisionCooldown = 0;
function updateAI(ai, target, dt) {
    if (ai.hitStun > 0 || ai.isDead || ai.isDizzy || ai.actionDuration > 0) return;
    if (ai.combatController && (ai.combatController.isInKnockdownSequence() || ai.combatController.state === CombatState.BLOCK_DEFLECTED)) {
        ai.vx = 0;
        return;
    }

    aiDecisionCooldown -= dt;
    const dist = Math.abs(ai.x - target.x);
    const targetAirHeight = (target.y || 0) - (target.groundY || 0);
    const isBoss = ai.dino && ai.dino.isBoss;
    const aggr = isBoss ? 0.02 : (aiDifficulty === 'brutal' ? 0.08 : (aiDifficulty === 'normal' ? 0.045 : 0.02));

    if (dist > 3.1) {
        ai.isBlocking = false;
        ai.blockType = 'none';
        const speedScale = isBoss ? 0.6 : (aiDifficulty === 'easy' ? 0.7 : 0.95);
        ai.sprintDuration = (ai.sprintDuration || 0) + dt;
        const accelMult = ai.sprintDuration > 0.45 ? 1.35 : 1.0;
        ai.vx = ai.facing * ai.dino.walkSpeed * speedScale * accelMult;
        ai.x += ai.vx * dt;
        ai.action = 'walk';

        const rangedChance = isBoss ? 0.015 : aggr * 0.45;
        if (dist > 5.0 && Math.random() < rangedChance && aiDecisionCooldown <= 0) {
            if (!ai.cooldowns || ai.cooldowns['special'] <= 0) {
                ai.startAttack('special');
                aiDecisionCooldown = isBoss ? 1.3 : 0.7;
            }
        }
    } else {
        ai.sprintDuration = 0;
        const blockChance = isBoss ? 0.05 : (aiDifficulty === 'brutal' ? 0.55 : 0.28);
        if (target.actionDuration > 0 && Math.random() < blockChance) {
            ai.isBlocking = true;
            // Choix dynamique entre les 3 gardes directionnelles (High, Mid, Low) avec armure visuelle
            const incomingZone = typeof DinosaurCombatController !== 'undefined'
                ? DinosaurCombatController.resolveAttackZoneFromAction(target.action)
                : 'mid';
            const matchProb = aiDifficulty === 'brutal' ? 0.78 : (aiDifficulty === 'normal' ? 0.58 : 0.38);
            if (Math.random() < matchProb) {
                ai.blockType = incomingZone;
            } else {
                const zones = ['high', 'mid', 'low'];
                ai.blockType = zones[Math.floor(Math.random() * zones.length)];
            }
            ai.action = ai.blockType === 'low' ? 'crouch' : 'idle';
            return;
        }
        ai.isBlocking = false;
        ai.blockType = 'none';

        if (aiDecisionCooldown <= 0) {
            // Le boss ne déclenche pas de cinématique X-Ray pour ne pas frustrer le joueur
            if (!isBoss && ai.rage >= 100 && (!ai.cooldowns || ai.cooldowns['xray'] <= 0) && Math.random() < 0.6) {
                executeXRayMove(ai, target);
                if (ai.cooldowns && ai.maxCooldowns) ai.cooldowns['xray'] = ai.maxCooldowns['xray'];
            } else if (target.isBlocking && Math.random() < 0.55 && dist < 3.0) {
                // Mix-up directionnel si le joueur se protège : frappe la zone non protégée
                if (target.blockType === 'high') {
                    ai.startAttack('low_light'); // Perce la garde haute
                } else if (target.blockType === 'low') {
                    ai.startAttack('up_light');  // Perce la garde basse
                } else {
                    ai.startAttack(Math.random() < 0.5 ? 'up_light' : 'low_light');
                }
            } else if (targetAirHeight > 0.6 && Math.random() < 0.68) {
                // Interception céleste d'un adversaire en l'air par une Frappe Haute
                ai.startAttack('up_light');
            } else {
                // 3 Frappes Directionnelles (Haut, Mid, Bas) ou Coup Spécial Unique
                const moves = ['up_light', 'light', 'low_light', 'special'];
                const readyMoves = moves.filter(m => !ai.cooldowns || ai.cooldowns[m] === undefined || ai.cooldowns[m] <= 0);
                if (readyMoves.length > 0) {
                    const r = Math.random();
                    let chosen = 'light';
                    if (r < 0.30) chosen = 'up_light';       // Frappe en Haut
                    else if (r < 0.65) chosen = 'light';     // Frappe au Milieu
                    else if (r < 0.85) chosen = 'low_light'; // Frappe en Bas
                    else if (readyMoves.includes('special')) chosen = 'special'; // Spécial Unique
                    else chosen = readyMoves[Math.floor(Math.random() * readyMoves.length)];
                    ai.startAttack(chosen);
                }
            }
            aiDecisionCooldown = isBoss ? 1.15 : (aiDifficulty === 'brutal' ? 0.28 : (aiDifficulty === 'normal' ? 0.50 : 0.82));
        }
    }
}
