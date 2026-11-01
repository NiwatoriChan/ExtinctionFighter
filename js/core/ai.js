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
            ai.startAttack(Math.random() > 0.5 ? 'special2' : 'special');
            aiDecisionCooldown = 0.7;
        }
    } else {
        if (target.actionDuration > 0 && Math.random() < (aiDifficulty === 'brutal' ? 0.55 : 0.25)) {
            ai.isBlocking = true;
            ai.action = 'crouch';
            return;
        }
        ai.isBlocking = false;

        if (aiDecisionCooldown <= 0) {
            if (ai.rage >= 100 && Math.random() < 0.5) {
                executeXRayMove(ai, target);
            } else {
                const r = Math.random();
                if (r < 0.45) ai.startAttack('light');
                else if (r < 0.78) ai.startAttack('heavy');
                else ai.startAttack('special');
            }
            aiDecisionCooldown = aiDifficulty === 'brutal' ? 0.28 : (aiDifficulty === 'normal' ? 0.52 : 0.85);
        }
    }
}
