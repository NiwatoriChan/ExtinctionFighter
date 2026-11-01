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
            ai.action = 'crouch';
            return;
        }
        ai.isBlocking = false;

        if (aiDecisionCooldown <= 0) {
            // Le boss ne déclenche pas de cinématique X-Ray pour ne pas frustrer le joueur
            if (!isBoss && ai.rage >= 100 && (!ai.cooldowns || ai.cooldowns['xray'] <= 0) && Math.random() < 0.6) {
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
            aiDecisionCooldown = isBoss ? 1.15 : (aiDifficulty === 'brutal' ? 0.28 : (aiDifficulty === 'normal' ? 0.52 : 0.85));
        }
    }
}
