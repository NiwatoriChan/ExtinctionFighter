let aiDecisionCooldown = 0;
function updateAI(ai, target, dt) {
    if (ai.hitStun > 0 || ai.isDead || ai.isDizzy || ai.actionDuration > 0) return;

    aiDecisionCooldown -= dt;
    const dist = Math.abs(ai.x - target.x);
    const isBoss = ai.dino && ai.dino.isBoss;
    const aggr = isBoss ? 0.02 : (aiDifficulty === 'brutal' ? 0.08 : (aiDifficulty === 'normal' ? 0.045 : 0.02));

    if (dist > 3.1) {
        ai.isBlocking = false;
        const speedScale = isBoss ? 0.6 : (aiDifficulty === 'easy' ? 0.7 : 0.95);
        ai.x += ai.facing * ai.dino.walkSpeed * dt * speedScale;
        ai.action = 'walk';

        const rangedChance = isBoss ? 0.015 : aggr * 0.45;
        if (dist > 5.0 && Math.random() < rangedChance && aiDecisionCooldown <= 0) {
            const availRanged = ['special2', 'special'].filter(m => !ai.cooldowns || ai.cooldowns[m] <= 0);
            if (availRanged.length > 0) {
                const pick = availRanged[Math.floor(Math.random() * availRanged.length)];
                ai.startAttack(pick);
                aiDecisionCooldown = isBoss ? 1.3 : 0.7;
            }
        }
    } else {
        const blockChance = isBoss ? 0.05 : (aiDifficulty === 'brutal' ? 0.55 : 0.25);
        if (target.actionDuration > 0 && Math.random() < blockChance) {
            ai.isBlocking = true;
            // Choix dynamique entre garde haute et basse
            ai.blockType = target.action === 'low_light' ? 'low' : (target.action.includes('air') ? 'high' : (Math.random() < 0.65 ? 'high' : 'low'));
            ai.action = ai.blockType === 'low' ? 'crouch' : 'walk';
            return;
        }
        ai.isBlocking = false;
        ai.blockType = 'none';

        if (aiDecisionCooldown <= 0) {
            // Le boss ne déclenche pas de cinématique X-Ray pour ne pas frustrer le joueur
            if (!isBoss && ai.rage >= 100 && (!ai.cooldowns || ai.cooldowns['xray'] <= 0) && Math.random() < 0.6) {
                executeXRayMove(ai, target);
                if (ai.cooldowns && ai.maxCooldowns) ai.cooldowns['xray'] = ai.maxCooldowns['xray'];
            } else if (target.isBlocking && Math.random() < 0.45 && dist < 2.8) {
                // Si le joueur bloque en permanence (tortue), l'IA tente une chope inbloquable ou un coup bas !
                if (Math.random() < 0.5) {
                    triggerPlayerAction(ai, target, 'throw');
                } else {
                    ai.startAttack('low_light');
                }
            } else if (target.y > 0.6 && Math.random() < 0.65) {
                // Puni de l'adversaire en l'air par un Anti-Air
                ai.startAttack('anti_air');
            } else {
                const moves = ['light', 'fwd_light', 'low_light', 'heavy', 'fwd_heavy', 'special', 'special2'];
                const readyMoves = moves.filter(m => !ai.cooldowns || ai.cooldowns[m] === undefined || ai.cooldowns[m] <= 0);
                if (readyMoves.length > 0) {
                    const r = Math.random();
                    let chosen = 'light';
                    if (r < 0.35) chosen = 'light';
                    else if (r < 0.55) chosen = 'fwd_light';
                    else if (r < 0.70) chosen = 'heavy';
                    else if (r < 0.85) chosen = 'low_light';
                    else if (readyMoves.includes('special')) chosen = 'special';
                    else if (readyMoves.includes('special2')) chosen = 'special2';
                    else chosen = readyMoves[Math.floor(Math.random() * readyMoves.length)];
                    ai.startAttack(chosen);
                }
            }
            aiDecisionCooldown = isBoss ? 1.15 : (aiDifficulty === 'brutal' ? 0.28 : (aiDifficulty === 'normal' ? 0.50 : 0.82));
        }
    }
}
