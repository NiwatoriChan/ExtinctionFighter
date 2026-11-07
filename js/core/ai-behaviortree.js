/* ============================================================================
 * js/core/ai-behaviortree.js — BehaviorTree.js Tactical Combat Decision Engine
 * Implements Selector/Sequence/Condition/Action trees for Hit-Confirm Combos,
 * Stale-Move Rotation, Whiff Punish, 3-Way Directional Guard & Mix-Ups,
 * Hazard Evasion, and Species Archetype Personalities.
 * ============================================================================ */

const AICombatBehaviorTree = {
    tree: null,

    /**
     * Picks the best non-stale move from a list of candidates by inspecting
     * DinosaurCombatController's Stale-Move Negation queue.
     */
    selectFreshMove(ai, candidates) {
        if (!candidates || candidates.length === 0) return 'light';
        const valid = candidates.filter(m => {
            if (ai.cooldowns && ai.cooldowns[m] !== undefined && ai.cooldowns[m] > 0) {
                return false;
            }
            return true;
        });
        if (valid.length === 0) return 'light';

        if (!ai.combatController || typeof ai.combatController.getStaleRepeatCount !== 'function') {
            return valid[Math.floor(Math.random() * valid.length)];
        }

        // Sort candidates by lowest stale repeat count, with slight random tie-breaker
        const scored = valid.map(m => ({
            move: m,
            repeats: ai.combatController.getStaleRepeatCount(m),
            jitter: Math.random() * 0.35
        }));
        scored.sort((a, b) => (a.repeats + a.jitter) - (b.repeats + b.jitter));
        return scored[0].move;
    },

    buildTree() {
        if (typeof BehaviorTree === 'undefined') return null;
        const { Selector, Sequence, Condition, Action, Status } = BehaviorTree;

        this.tree = new BehaviorTree.Tree({
            name: 'ExtinctionKombatTacticalTree',
            root: new Selector({
                name: 'RootCombatSelector',
                nodes: [
                    // =========================================================
                    // 1. HIT-CONFIRM COMBO CHAINING (DURING ACTIVE ATTACK)
                    // =========================================================
                    new Sequence({
                        name: 'HitConfirmComboSequence',
                        nodes: [
                            new Condition({
                                name: 'HasHitConfirmedInCancelWindow',
                                check: (bb) => {
                                    const ai = bb.ai;
                                    if (!ai || ai.actionDuration <= 0 || !ai.hasHitConfirmed) return false;
                                    const progress = ai.actionTimer / ai.actionDuration;
                                    return progress >= 0.52 && progress <= 0.88 && bb.canComboExtend;
                                }
                            }),
                            new Action({
                                name: 'ExecuteHitConfirmCancel',
                                run: (bb) => {
                                    const ai = bb.ai;
                                    let nextMove = null;
                                    if (ai.action === 'light') {
                                        nextMove = 'light2';
                                    } else if ((ai.action === 'light2' || ai.action.endsWith('_light')) && bb.difficulty === 'brutal') {
                                        nextMove = this.selectFreshMove(ai, ['heavy', 'fwd_heavy', 'low_heavy']);
                                    } else if (ai.action.includes('heavy') && bb.difficulty === 'brutal') {
                                        if (!ai.cooldowns || ai.cooldowns['special'] <= 0) {
                                            nextMove = 'special';
                                        }
                                    }
                                    if (nextMove && ai.canCancelInto(nextMove)) {
                                        ai.startAttack(nextMove);
                                        bb.decisionIntent = `COMBO CANCEL -> ${nextMove.toUpperCase()}`;
                                        return Status.SUCCESS;
                                    }
                                    return Status.FAILURE;
                                }
                            })
                        ]
                    }),

                    // =========================================================
                    // 2. EMERGENCY UNBLOCKABLE / PROJECTILE HAZARD EVASION
                    // =========================================================
                    new Sequence({
                        name: 'HazardEvasionSequence',
                        nodes: [
                            new Condition({
                                name: 'HasImmediateHazardThreat',
                                check: (bb) => Boolean(bb.unblockableThreat || bb.projectileThreat) && bb.aiActionIdle
                            }),
                            new Action({
                                name: 'EvadeOrDeflectHazard',
                                run: (bb) => {
                                    const ai = bb.ai;
                                    // Unblockable ground seismic wave -> Jump!
                                    if (bb.unblockableThreat && bb.unblockableThreat.recommendedAction === 'jump') {
                                        if (!ai.isAirborne() && Math.random() < bb.reactionProb) {
                                            ai.vy = ai.jumpVy || 11.8;
                                            bb.decisionIntent = 'JUMP EVADE SEISMIC';
                                            return Status.SUCCESS;
                                        }
                                    }
                                    // Incoming projectile -> Ankylosaurus Reflect or Jump/Guard
                                    if (bb.projectileThreat && Math.random() < bb.reactionProb) {
                                        if (bb.projectileThreat.canDeflect && (!ai.cooldowns || ai.cooldowns['special'] <= 0)) {
                                            ai.startAttack('special');
                                            bb.decisionIntent = 'REFLECT PROJECTILE';
                                            return Status.SUCCESS;
                                        }
                                        if (bb.projectileThreat.recommendedAction === 'jump_evade' && !ai.isAirborne()) {
                                            ai.vy = ai.jumpVy || 11.8;
                                            ai.vx = ai.facing * (ai.dino.walkSpeed || 7.5) * 0.75;
                                            bb.decisionIntent = 'JUMP OVER PROJECTILE';
                                            return Status.SUCCESS;
                                        }
                                        ai.isBlocking = true;
                                        ai.blockType = 'mid';
                                        ai.action = 'idle';
                                        ai.vx = 0;
                                        bb.decisionIntent = 'GUARD PROJECTILE';
                                        return Status.SUCCESS;
                                    }
                                    return Status.FAILURE;
                                }
                            })
                        ]
                    }),

                    // =========================================================
                    // 3. 3-WAY DIRECTIONAL GUARD & PARRY DEFLECTION
                    // =========================================================
                    new Sequence({
                        name: 'DirectionalGuardSequence',
                        nodes: [
                            new Condition({
                                name: 'TargetIsAttackingWithinReach',
                                check: (bb) => (
                                    bb.aiActionIdle &&
                                    bb.targetIsAttacking &&
                                    bb.dist <= bb.enemyReach + 0.75 &&
                                    bb.guardStamina >= 18 &&
                                    Math.random() < bb.blockChance
                                )
                            }),
                            new Action({
                                name: 'ActivateMatchedDirectionalGuard',
                                run: (bb) => {
                                    const ai = bb.ai;
                                    const target = bb.target;
                                    // Ankylosaurus hyper-armor counter scaled by difficulty
                                    const armorProb = bb.hyperArmorCounterProb || 0;
                                    if (ai.dino && ai.dino.id === 'ankylosaurus' && armorProb > 0 && Math.random() < armorProb && bb.dist <= bb.myReach) {
                                        ai.startAttack('heavy');
                                        bb.decisionIntent = 'HYPER-ARMOR COUNTER';
                                        return Status.SUCCESS;
                                    }

                                    ai.isBlocking = true;
                                    const incomingZone = typeof DinosaurCombatController !== 'undefined'
                                        ? DinosaurCombatController.resolveAttackZoneFromAction(target.action)
                                        : 'mid';

                                    if (Math.random() < bb.guardMatchProb) {
                                        ai.blockType = incomingZone;
                                    } else {
                                        const zones = ['high', 'mid', 'low'];
                                        ai.blockType = zones[Math.floor(Math.random() * zones.length)];
                                    }
                                    ai.action = ai.blockType === 'low' ? 'crouch' : 'idle';
                                    ai.vx = 0;
                                    bb.decisionIntent = `GUARD [${ai.blockType.toUpperCase()}]`;
                                    return Status.SUCCESS;
                                }
                            })
                        ]
                    }),

                    // =========================================================
                    // 4. WHIFF PUNISH & BLOCK-DEFLECT COUNTER-ATTACK
                    // =========================================================
                    new Sequence({
                        name: 'WhiffOrDeflectPunishSequence',
                        nodes: [
                            new Condition({
                                name: 'TargetVulnerableInRecoveryOrDeflected',
                                check: (bb) => (
                                    bb.aiActionIdle &&
                                    bb.canDecideOffense &&
                                    (bb.targetInRecovery || bb.targetDeflected) &&
                                    bb.dist <= bb.myReach + 0.95 &&
                                    Math.random() < (bb.whiffPunishProb !== undefined ? bb.whiffPunishProb : 0.35)
                                )
                            }),
                            new Action({
                                name: 'ExecuteOptimalPunish',
                                run: (bb) => {
                                    const ai = bb.ai;
                                    ai.isBlocking = false;
                                    ai.blockType = 'none';
                                    const punishMoves = bb.dist > bb.myReach * 0.85
                                        ? ['fwd_heavy', 'fwd_light', 'special']
                                        : ['heavy', 'low_heavy', 'light', 'special'];
                                    const chosen = this.selectFreshMove(ai, punishMoves);
                                    ai.startAttack(chosen);
                                    bb.resetDecisionCooldown(1.15);
                                    bb.decisionIntent = `WHIFF PUNISH [${chosen.toUpperCase()}]`;
                                    return Status.SUCCESS;
                                }
                            })
                        ]
                    }),

                    // =========================================================
                    // 5. ANTI-AIR CELESTIAL INTERCEPTION
                    // =========================================================
                    new Sequence({
                        name: 'AntiAirInterceptionSequence',
                        nodes: [
                            new Condition({
                                name: 'TargetIsAirborneInRange',
                                check: (bb) => (
                                    bb.aiActionIdle &&
                                    bb.canDecideOffense &&
                                    bb.targetAirHeight > 0.55 &&
                                    bb.dist <= bb.myReach + 0.55 &&
                                    Math.random() < bb.antiAirProb
                                )
                            }),
                            new Action({
                                name: 'LaunchAntiAirStrike',
                                run: (bb) => {
                                    const ai = bb.ai;
                                    ai.isBlocking = false;
                                    ai.blockType = 'none';
                                    const aaMove = this.selectFreshMove(ai, ['anti_air', 'up_light']);
                                    ai.startAttack(aaMove);
                                    bb.resetDecisionCooldown(1.15);
                                    bb.decisionIntent = `ANTI-AIR [${aaMove.toUpperCase()}]`;
                                    return Status.SUCCESS;
                                }
                            })
                        ]
                    }),

                    // =========================================================
                    // 6. CORNER ESCAPE / TACTICAL DASH REPOSITIONING
                    // =========================================================
                    new Sequence({
                        name: 'CornerEscapeOrDashSequence',
                        nodes: [
                            new Condition({
                                name: 'NeedsTacticalDash',
                                check: (bb) => (
                                    bb.aiActionIdle &&
                                    bb.ai.dashCooldown <= 0 &&
                                    ((bb.isCornered && bb.dist < 2.9) ||
                                     (bb.macroState === 'EVADE_RECOVER' && bb.dist < 3.4) ||
                                     (bb.archetype === 'speed' && bb.dist > 4.6 && bb.dist < 7.8 && Math.random() < 0.25))
                                )
                            }),
                            new Action({
                                name: 'ExecuteTacticalDash',
                                run: (bb) => {
                                    const ai = bb.ai;
                                    if (bb.isCornered) {
                                        // Jump or dash toward center of arena
                                        const toCenterDir = ai.x < 0 ? 1 : -1;
                                        if (Math.random() < 0.45 && !ai.isAirborne()) {
                                            ai.vy = ai.jumpVy || 11.8;
                                            ai.vx = toCenterDir * (ai.dino.walkSpeed || 7.5) * 0.95;
                                            bb.decisionIntent = 'CORNER JUMP ESCAPE';
                                        } else {
                                            ai.startDash(toCenterDir);
                                            bb.decisionIntent = 'CORNER DASH ESCAPE';
                                        }
                                        return Status.SUCCESS;
                                    }
                                    if (bb.macroState === 'EVADE_RECOVER') {
                                        ai.startDash(-ai.facing);
                                        bb.decisionIntent = 'BACKDASH RECOVER';
                                        return Status.SUCCESS;
                                    }
                                    ai.startDash(ai.facing);
                                    bb.decisionIntent = 'MOMENTUM RUSH DASH';
                                    return Status.SUCCESS;
                                }
                            })
                        ]
                    }),

                    // =========================================================
                    // 7. CLOSE-RANGE OFFENSE: X-RAY, GUARD-BREAK MIX-UPS & ARCHETYPES
                    // =========================================================
                    new Sequence({
                        name: 'CloseRangeOffenseSequence',
                        nodes: [
                            new Condition({
                                name: 'InStrikeRangeAndReady',
                                check: (bb) => bb.aiActionIdle && bb.canDecideOffense && bb.dist <= bb.myReach + 0.45
                            }),
                            new Action({
                                name: 'ExecuteTacticalStrikeOrMixup',
                                run: (bb) => {
                                    const ai = bb.ai;
                                    const target = bb.target;
                                    ai.isBlocking = false;
                                    ai.blockType = 'none';

                                    // A. Ultimate X-Ray Execution (Non-Boss at 100% Rage)
                                    if (!bb.isBoss && ai.rage >= 100 && (!ai.cooldowns || ai.cooldowns['xray'] <= 0) && Math.random() < 0.62) {
                                        executeXRayMove(ai, target);
                                        if (ai.cooldowns && ai.maxCooldowns) ai.cooldowns['xray'] = ai.maxCooldowns['xray'];
                                        bb.resetDecisionCooldown(1.2);
                                        bb.decisionIntent = 'EXECUTE X-RAY ULTIMATE';
                                        return Status.SUCCESS;
                                    }

                                    // B. Directional Guard-Break Mix-up if Player is Blocking
                                    if (target.isBlocking && Math.random() < bb.mixupProb) {
                                        const readsGuard = Math.random() < (bb.guardReadProb !== undefined ? bb.guardReadProb : 0.38);
                                        let mixMove;
                                        if (readsGuard) {
                                            if (target.blockType === 'high') {
                                                mixMove = this.selectFreshMove(ai, ['low_light', 'low_heavy']);
                                            } else if (target.blockType === 'low') {
                                                mixMove = this.selectFreshMove(ai, ['up_light', 'anti_air']);
                                            } else {
                                                mixMove = this.selectFreshMove(ai, ['up_light', 'low_light', 'low_heavy']);
                                            }
                                        } else {
                                            const guesses = ['light', 'up_light', 'low_light'];
                                            mixMove = this.selectFreshMove(ai, guesses);
                                        }
                                        ai.startAttack(mixMove);
                                        bb.resetDecisionCooldown(1.20);
                                        bb.decisionIntent = `GUARD MIX-UP [${mixMove.toUpperCase()}]`;
                                        return Status.SUCCESS;
                                    }

                                    // C. Archetype-Specific & Stale-Aware Strike Selection
                                    let pool = ['light', 'up_light', 'low_light', 'heavy', 'fwd_light', 'special'];
                                    if (bb.archetype === 'heavy') {
                                        pool = ['heavy', 'fwd_heavy', 'low_heavy', 'light', 'special', 'special2'];
                                    } else if (bb.archetype === 'speed') {
                                        pool = ['light', 'fwd_light', 'low_light', 'up_light', 'special'];
                                    }

                                    const chosen = this.selectFreshMove(ai, pool);
                                    ai.startAttack(chosen);
                                    bb.resetDecisionCooldown(1.20);
                                    bb.decisionIntent = `STRIKE [${chosen.toUpperCase()}]`;
                                    return Status.SUCCESS;
                                }
                            })
                        ]
                    }),

                    // =========================================================
                    // 8. MID/LONG-RANGE ZONING & YUKA STEERING LOCOMOTION
                    // =========================================================
                    new Action({
                        name: 'YukaSteeringLocomotionAndZoning',
                        run: (bb) => {
                            const ai = bb.ai;
                            const target = bb.target;
                            if (!bb.aiActionIdle) return Status.RUNNING;

                            ai.isBlocking = false;
                            ai.blockType = 'none';

                            // Long-range Special / Seismic Zoning check
                            if (bb.dist > 4.6 && bb.canDecideOffense && Math.random() < bb.rangedProb) {
                                const id = ai.dino && ai.dino.id;
                                const targetGrounded = !target.isAirborne(0.2);
                                if (targetGrounded && (id === 'apatosaurus' || id === 'pachyrhinosaurus' || id === 'megatherium' || id === 'stegosaurus') &&
                                    (!ai.cooldowns || ai.cooldowns['special2'] <= 0) && bb.dist < 8.2) {
                                    ai.startAttack('special2');
                                    bb.resetDecisionCooldown(1.45);
                                    bb.decisionIntent = 'SEISMIC QUAKE ZONING';
                                    return Status.SUCCESS;
                                }
                                if (!ai.cooldowns || ai.cooldowns['special'] <= 0) {
                                    ai.startAttack('special');
                                    bb.resetDecisionCooldown(1.35);
                                    bb.decisionIntent = 'RANGED SPECIAL ENGAGE';
                                    return Status.SUCCESS;
                                }
                            }

                            // Apply Yuka Steering Velocity to Fighter3D locomotion
                            const steerVx = bb.steering ? bb.steering.vx : (ai.facing * (ai.dino.walkSpeed || 7.5));
                            if (Math.abs(steerVx) > 0.35) {
                                ai.sprintDuration = (ai.sprintDuration || 0) + bb.dt;
                                const isSprint = ai.sprintDuration > 0.42 && Math.abs(steerVx) > (ai.dino.walkSpeed || 7.5) * 0.85;
                                ai.isSprinting = isSprint;
                                const accelMult = isSprint ? 1.28 : 1.0;
                                ai.vx = steerVx * accelMult;
                                ai.x += ai.vx * bb.dt;
                                ai.action = 'walk';
                                bb.decisionIntent = `STEER: ${bb.steering ? bb.steering.steeringMode : 'SEEK'}`;
                            } else {
                                ai.sprintDuration = 0;
                                ai.isSprinting = false;
                                ai.action = 'idle';
                                bb.decisionIntent = 'FOOTSIES HOLD';
                            }
                            return Status.RUNNING;
                        }
                    })
                ]
            })
        });

        return this.tree;
    },

    evaluate(blackboard) {
        if (!this.tree) this.buildTree();
        if (!this.tree) return;
        return this.tree.step(blackboard);
    }
};
