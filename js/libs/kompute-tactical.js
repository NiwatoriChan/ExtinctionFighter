/* ============================================================================
 * KOMPUTE — Modular 3D Tactical Steering, Line-of-Sight & Cover Engine
 * (js/libs/kompute-tactical.js)
 * Spatial movement patterns, cover/sweet-spot evaluation, projectile & seismic
 * hazard line-of-sight checks, and corner-pressure escape vectors.
 * ============================================================================ */
(function (global) {
    'use strict';

    class TacticalAnalyzer {
        constructor(options = {}) {
            this.stageLeft = options.stageLeft ?? -11.0;
            this.stageRight = options.stageRight ?? 11.0;
            this.cornerThreshold = options.cornerThreshold ?? 2.4;
        }

        /**
         * Evaluates tactical line-of-sight and incoming projectile threats
         * along the 3D combat corridor.
         */
        evaluateProjectileThreat(agentX, agentY, projectiles = [], agentFighter = null) {
            let nearestThreat = null;
            let minTimeToImpact = Infinity;

            for (let i = 0; i < projectiles.length; i++) {
                const p = projectiles[i];
                if (!p || !p.mesh || (agentFighter && p.owner === agentFighter)) continue;

                const px = p.mesh.position.x;
                const py = p.mesh.position.y;
                const vx = p.vx || 0;
                const dx = agentX - px;

                // Check if projectile is moving toward the agent
                if ((dx > 0 && vx > 0) || (dx < 0 && vx < 0)) {
                    const timeToImpact = Math.abs(dx) / Math.max(1.0, Math.abs(vx));
                    const verticalDelta = Math.abs(py - (agentY + 1.8));
                    if (timeToImpact < 1.15 && verticalDelta < 2.6 && timeToImpact < minTimeToImpact) {
                        minTimeToImpact = timeToImpact;
                        nearestThreat = {
                            projectile: p,
                            distance: Math.abs(dx),
                            timeToImpact,
                            canDeflect: Boolean(agentFighter && agentFighter.dino && agentFighter.dino.id === 'ankylosaurus'),
                            recommendedAction: (agentFighter && agentFighter.dino && agentFighter.dino.id === 'ankylosaurus')
                                ? 'deflect_special'
                                : (timeToImpact < 0.48 ? 'jump_evade' : 'guard_mid')
                        };
                    }
                }
            }
            return nearestThreat;
        }

        /**
         * Detects unblockable ground seismic attacks or aerial dive threats
         * via tactical line-of-sight inspection of opponent's active state.
         */
        evaluateSeismicOrUnblockableThreat(agent, target) {
            if (!agent || !target) return null;
            const dist = Math.abs(agent.x - target.x);
            const targetId = target.dino && target.dino.id;
            const isSeismicSpecies = (
                targetId === 'apatosaurus' ||
                targetId === 'pachyrhinosaurus' ||
                targetId === 'megatherium' ||
                targetId === 'giantsloth' ||
                targetId === 'stegosaurus'
            );

            if (target.action === 'special2' && isSeismicSpecies && dist < 8.8) {
                const progress = target.actionDuration > 0 ? (target.actionTimer / target.actionDuration) : 0;
                if (progress < 0.65) {
                    return {
                        type: 'seismic_quake',
                        urgency: 1.0,
                        recommendedAction: 'jump'
                    };
                }
            }

            if (target.action === 'throw' && dist < 3.4) {
                return {
                    type: 'throw_grab',
                    urgency: 0.95,
                    recommendedAction: 'back_light_or_jump'
                };
            }

            return null;
        }

        /**
         * Computes the optimal tactical spacing ("footsies sweet-spot" or cover spot)
         * relative to the target's reach, stage boundaries, and elevation.
         */
        computeSweetSpotPosition(agent, target, navMeshQueryFn = null) {
            if (!agent || !target) return { x: 0, y: 0, z: 0, score: 0, isCornered: false };

            const agentImpl = (typeof FIGHTER_IMPLS !== 'undefined' && agent.dino && FIGHTER_IMPLS[agent.dino.id]) || {};
            const targetImpl = (typeof FIGHTER_IMPLS !== 'undefined' && target.dino && FIGHTER_IMPLS[target.dino.id]) || {};
            const myReach = agentImpl.attackReach || 3.45;
            const enemyReach = targetImpl.attackReach || 3.45;

            const dirFromTarget = agent.x >= target.x ? 1 : -1;
            const distToLeftWall = Math.abs(agent.x - this.stageLeft);
            const distToRightWall = Math.abs(this.stageRight - agent.x);
            const isCornered = (agent.x <= this.stageLeft + this.cornerThreshold && target.x > agent.x) ||
                               (agent.x >= this.stageRight - this.cornerThreshold && target.x < agent.x);

            // Optimal combat distance: slightly inside our effective reach or just outside enemy reach when recovering
            const wantsDefensiveCover = (agent.guardStamina !== undefined && agent.guardStamina < 30) ||
                                        (agent.hp / Math.max(1, agent.maxHp) < 0.25 && target.hasHyperArmor);

            let desiredSpacing = myReach * 0.84;
            if (wantsDefensiveCover) {
                desiredSpacing = Math.max(enemyReach + 1.35, 4.8);
            } else if (agent.weightClass === 'speed') {
                desiredSpacing = myReach * 0.78;
            } else if (agent.weightClass === 'heavy') {
                desiredSpacing = myReach * 0.88;
            }

            let candidateX = target.x + dirFromTarget * desiredSpacing;

            // If cornered near stage boundaries, pick the open side toward stage center
            if (isCornered || candidateX < this.stageLeft + 1.2 || candidateX > this.stageRight - 1.2) {
                const centerBiasDir = target.x > 0 ? -1 : 1;
                candidateX = Math.max(
                    this.stageLeft + 1.6,
                    Math.min(this.stageRight - 1.6, target.x + centerBiasDir * desiredSpacing)
                );
            }

            candidateX = Math.max(this.stageLeft + 0.8, Math.min(this.stageRight - 0.8, candidateX));
            const candidateY = typeof navMeshQueryFn === 'function'
                ? navMeshQueryFn(candidateX, 0)
                : (agent.groundY || 0);

            return {
                x: candidateX,
                y: candidateY,
                z: 0,
                desiredSpacing,
                myReach,
                enemyReach,
                isCornered,
                distToNearestWall: Math.min(distToLeftWall, distToRightWall),
                wantsDefensiveCover
            };
        }

        /**
         * Line-of-Sight check between two 3D points against stage obstacles/elevation.
         */
        hasLineOfSight(fromPos, toPos, getGroundHeightFn) {
            if (typeof getGroundHeightFn !== 'function') return true;
            const steps = 6;
            for (let i = 1; i < steps; i++) {
                const t = i / steps;
                const sx = fromPos.x + (toPos.x - fromPos.x) * t;
                const sy = (fromPos.y + 1.2) + ((toPos.y + 1.2) - (fromPos.y + 1.2)) * t;
                const terrainH = getGroundHeightFn(sx, 0);
                if (terrainH > sy + 0.35) {
                    return false;
                }
            }
            return true;
        }
    }

    global.Kompute = {
        TacticalAnalyzer
    };
})(window);
