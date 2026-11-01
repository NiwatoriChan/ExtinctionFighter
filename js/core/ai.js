let aiDecisionCooldown = 0;
function updateAI(ai, target, dt) {
    if (ai.hitStun > 0 || ai.isDead || ai.isDizzy || ai.actionDuration > 0) return;

    aiDecisionCooldown -= dt;
    const dist = Math.abs(ai.x - target.x);
    const aggr = aiDifficulty === 'brutal' ? 0.08 : (aiDifficulty === 'normal' ? 0.045 : 0.02);

    if (dist > 3.1) {
        ai.isBlocking = false;
        ai.x += ai.facing * ai.dino.walkSpeed * dt * (aiDifficulty === 'easy' ? 0.7 : 0.95);
        ai.action = 'walk';

        if (dist > 5.0 && Math.random() < aggr * 0.45 && aiDecisionCooldown <= 0) {
            const availRanged = ['special2', 'special'].filter(m => !ai.cooldowns || ai.cooldowns[m] <= 0);
            if (availRanged.length > 0) {
                const pick = availRanged[Math.floor(Math.random() * availRanged.length)];
                ai.startAttack(pick);
                aiDecisionCooldown = 0.7;
            }
        }
    } else {
        if (target.actionDuration > 0 && Math.random() < (aiDifficulty === 'brutal' ? 0.55 : 0.25)) {
            ai.isBlocking = true;
            ai.action = 'crouch';
            return;
        }
        ai.isBlocking = false;

        if (aiDecisionCooldown <= 0) {
            // Le X-Ray Fatal requiert strictement une rage à 100%
            if (ai.rage >= 100 && (!ai.cooldowns || ai.cooldowns['xray'] <= 0) && Math.random() < 0.6) {
                executeXRayMove(ai, target);
                if (ai.cooldowns && ai.maxCooldowns) ai.cooldowns['xray'] = ai.maxCooldowns['xray'];
            } else {
                const moves = ['light', 'heavy', 'special', 'special2'];
                const readyMoves = moves.filter(m => !ai.cooldowns || ai.cooldowns[m] <= 0);
                if (readyMoves.length > 0) {
                    // Choisir un coup disponible en favorisant les coups rapides au corps à corps
                    const r = Math.random();
                    let chosen = readyMoves[0];
                    if (r < 0.45 && readyMoves.includes('light')) chosen = 'light';
                    else if (r < 0.75 && readyMoves.includes('heavy')) chosen = 'heavy';
                    else if (readyMoves.includes('special')) chosen = 'special';
                    else chosen = readyMoves[Math.floor(Math.random() * readyMoves.length)];
                    ai.startAttack(chosen);
                }
            }
            aiDecisionCooldown = aiDifficulty === 'brutal' ? 0.28 : (aiDifficulty === 'normal' ? 0.52 : 0.85);
        }
    }
}
