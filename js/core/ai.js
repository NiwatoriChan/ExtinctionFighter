/* ============================================================================
 * js/core/ai.js — 4-Stage Modular Game AI Pipeline for Three.js
 *   Stage 1: 3D NavMesh & Kompute Tactical Spatial Analysis (ArenaNavSystem)
 *   Stage 2: Yuka Steering, Vision/Memory & Goal Arbitration (AIVehicleSystem)
 *   Stage 3: XState Macro-Statechart & BehaviorTree.js Tactical Execution
 *   Stage 4: Three.js Object3D Transform Sync & Live AI Telemetry
 * ============================================================================ */

let aiDecisionCooldown = 0;

window.aiTelemetryState = {
    enabled: false,
    macroState: 'PATROL_STALK',
    btNode: 'Idle',
    steeringMode: 'ARRIVE_SWEET_SPOT',
    intent: 'INITIALIZING',
    sweetSpotX: 0,
    staleRepeats: 0,
    momentumBonusPct: 0
};

function updateAI(ai, target, dt) {
    if (!ai || !target || ai.isDead || ai.isDizzy || ai.hitStun > 0) return;

    if (ai.combatController && (
        ai.combatController.isInKnockdownSequence() ||
        ai.combatController.state === CombatState.BLOCK_DEFLECTED
    )) {
        ai.vx = 0;
        window.aiTelemetryState.macroState = ai.combatController.state;
        window.aiTelemetryState.intent = 'LOCKED IN RECOVERY';
        return;
    }

    aiDecisionCooldown = Math.max(0, aiDecisionCooldown - dt);

    const nowSec = performance.now() * 0.001;
    const dist = Math.abs(ai.x - target.x);
    const targetAirHeight = (target.y || 0) - (target.groundY || 0);
    const isBoss = Boolean(ai.dino && ai.dino.isBoss);
    const diff = typeof aiDifficulty !== 'undefined' ? aiDifficulty : 'normal';

    // ========================================================================
    // STAGE 1: 3D NAVMESH & KOMPUTE TACTICAL SPATIAL QUERY
    // ========================================================================
    const activeProjectiles = typeof projectiles3D !== 'undefined' ? projectiles3D : [];
    const navData = (typeof ArenaNavSystem !== 'undefined')
        ? ArenaNavSystem.computeTacticalNavigation(ai, target, activeProjectiles)
        : null;

    const sweetSpot = (navData && navData.sweetSpot) || {
        x: target.x + (ai.x >= target.x ? 3.1 : -3.1),
        y: ai.groundY || 0,
        myReach: 3.45,
        enemyReach: 3.45,
        isCornered: false
    };

    // ========================================================================
    // STAGE 2: YUKA PERCEPTION, GOAL ARBITRATION & STEERING VELOCITIES
    // ========================================================================
    const steering = (typeof AIVehicleSystem !== 'undefined')
        ? AIVehicleSystem.computeSteeringStep(ai, target, navData, dt, nowSec)
        : {
            vx: ai.facing * ((ai.dino && ai.dino.walkSpeed) || 7.5),
            steeringMode: 'SEEK',
            speedRatio: 1.0,
            targetVisible: true,
            desiredTargetX: sweetSpot.x
        };

    // ========================================================================
    // STAGE 3: XSTATE MACRO-STATECHART & BEHAVIORTREE.JS TACTICAL LOGIC
    // ========================================================================
    const tCombatState = target.combatController ? target.combatController.state : 'IDLE';

    // Difficulté et calibrage des profils tactiques IA :
    // 'easy'      : débutant / campagne fluide (larges ouvertures, pas de punitions réflexes, zéro combo)
    // 'normal'    : intermédiaire accessible (entre facile et difficile, footsies lisibles)
    // 'hard'      : ancien normal, réactif et punisseur (~850ms base, mixups & garde adaptative)
    // 'very_hard' : ancien brutal (tournoi / défi expert, combos complets et pression soutenue)
    const diffParams = {
        easy: {
            baseCooldown: 1.35,
            comboExtendProb: 0.0,
            whiffPunishProb: 0.12,
            reactionProb: 0.15,
            blockChance: 0.10,
            guardMatchProb: 0.25,
            mixupProb: 0.12,
            antiAirProb: 0.15,
            rangedProb: 0.012,
            hyperArmorCounterProb: 0.0,
            guardReadProb: 0.15
        },
        normal: {
            baseCooldown: 1.10,
            comboExtendProb: 0.10,
            whiffPunishProb: 0.24,
            reactionProb: 0.26,
            blockChance: 0.16,
            guardMatchProb: 0.33,
            mixupProb: 0.20,
            antiAirProb: 0.25,
            rangedProb: 0.017,
            hyperArmorCounterProb: 0.06,
            guardReadProb: 0.25
        },
        hard: {
            baseCooldown: 0.85,
            comboExtendProb: 0.20,
            whiffPunishProb: 0.35,
            reactionProb: 0.38,
            blockChance: 0.22,
            guardMatchProb: 0.40,
            mixupProb: 0.28,
            antiAirProb: 0.35,
            rangedProb: 0.022,
            hyperArmorCounterProb: 0.12,
            guardReadProb: 0.35
        },
        very_hard: {
            baseCooldown: 0.38,
            comboExtendProb: 0.70,
            whiffPunishProb: 0.75,
            reactionProb: 0.75,
            blockChance: 0.48,
            guardMatchProb: 0.72,
            mixupProb: 0.65,
            antiAirProb: 0.70,
            rangedProb: 0.045,
            hyperArmorCounterProb: 0.30,
            guardReadProb: 0.70
        }
    };

    const resolvedDiff = diff === 'brutal' ? 'very_hard' : diff;
    const cfg = Object.assign({}, diffParams[resolvedDiff] || diffParams.normal);
    if (typeof gameMode !== 'undefined' && gameMode === 'cpu') {
        cfg.baseCooldown *= 0.65;
        cfg.comboExtendProb = Math.min(0.95, cfg.comboExtendProb + 0.25);
        cfg.whiffPunishProb = Math.min(0.95, cfg.whiffPunishProb + 0.25);
        cfg.reactionProb = Math.min(0.95, cfg.reactionProb + 0.20);
        cfg.blockChance = Math.min(0.75, cfg.blockChance + 0.15);
    }
    const baseCooldown = isBoss ? 1.15 : cfg.baseCooldown;

    const blackboard = {
        ai,
        target,
        dt,
        nowSec,
        dist,
        targetAirHeight,
        isBoss,
        difficulty: resolvedDiff,
        archetype: ai.weightClass || 'brawler',
        myReach: sweetSpot.myReach || 3.45,
        enemyReach: sweetSpot.enemyReach || 3.45,
        isCornered: Boolean(sweetSpot.isCornered),
        guardStamina: ai.guardStamina !== undefined ? ai.guardStamina : 100,
        hpRatio: ai.hp / Math.max(1, ai.maxHp),
        aiActionIdle: ai.actionDuration <= 0,
        canDecideOffense: aiDecisionCooldown <= 0,
        canComboExtend: !isBoss && (Math.random() < cfg.comboExtendProb),
        whiffPunishProb: cfg.whiffPunishProb,
        guardReadProb: cfg.guardReadProb,
        hyperArmorCounterProb: isBoss ? 0.0 : cfg.hyperArmorCounterProb,
        targetIsAttacking: target.actionDuration > 0 && target.action !== 'idle' && target.action !== 'walk' && target.action !== 'crouch',
        targetInRecovery: tCombatState === CombatState.ATTACK_RECOVERY,
        targetDeflected: tCombatState === CombatState.BLOCK_DEFLECTED,
        targetIsDizzy: Boolean(target.isDizzy),
        targetHasHyperArmor: Boolean(target.hasHyperArmor),
        projectileThreat: navData ? navData.projectileThreat : null,
        unblockableThreat: navData ? navData.unblockableThreat : null,
        steering,
        reactionProb: isBoss ? 0.25 : cfg.reactionProb,
        blockChance: isBoss ? 0.06 : cfg.blockChance,
        guardMatchProb: cfg.guardMatchProb,
        mixupProb: cfg.mixupProb,
        antiAirProb: cfg.antiAirProb,
        rangedProb: isBoss ? 0.020 : cfg.rangedProb,
        activeBTNode: null,
        decisionIntent: 'ANALYZING',
        resetDecisionCooldown(mult = 1.0) {
            aiDecisionCooldown = baseCooldown * mult;
        }
    };

    const macroState = (typeof AIMacroStatechart !== 'undefined')
        ? AIMacroStatechart.evaluate(blackboard)
        : 'ALERT_FOOTSIES';
    blackboard.macroState = macroState;

    if (typeof AICombatBehaviorTree !== 'undefined') {
        AICombatBehaviorTree.evaluate(blackboard);
    }

    // ========================================================================
    // STAGE 4: SYNC STEP & TELEMETRY EXPORT
    // ========================================================================
    if (typeof YUKA !== 'undefined' && AIVehicleSystem.aiVehicle) {
        AIVehicleSystem.aiVehicle.position.set(ai.x, ai.y || 0, 0);
        AIVehicleSystem.aiVehicle.velocity.set(ai.vx || 0, ai.vy || 0, 0);
    }

    const kCoeff = (ai.config && ai.config.momentumCoefficient) || 0.052;
    const momPct = Math.round(kCoeff * Math.abs(ai.vx || 0) * 100);

    window.aiTelemetryState.macroState = macroState;
    window.aiTelemetryState.btNode = blackboard.activeBTNode || 'RootSelector';
    window.aiTelemetryState.steeringMode = steering.steeringMode || 'ARRIVE';
    window.aiTelemetryState.intent = blackboard.decisionIntent || ai.action.toUpperCase();
    window.aiTelemetryState.sweetSpotX = Number(sweetSpot.x || 0).toFixed(1);
    window.aiTelemetryState.staleRepeats = ai.lastStaleCount || 0;
    window.aiTelemetryState.momentumBonusPct = momPct;
}
