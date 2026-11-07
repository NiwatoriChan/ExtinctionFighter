/* ============================================================================
 * js/core/ai-steering.js — Yuka Steering, Perception, Goal Arbitration & Flocking
 * Pairs YUKA.EntityManager, YUKA.Vehicle, YUKA.Vision, YUKA.MemorySystem,
 * YUKA.Think (Goal Evaluators), and YUKA.SyncManager with Three.js meshes.
 * ============================================================================ */

class SweetSpotGoalEvaluator extends YUKA.GoalEvaluator {
    calculateDesirability(aiAgent) {
        if (!aiAgent || !aiAgent.blackboard) return 0.4;
        const bb = aiAgent.blackboard;
        if (bb.unblockableThreat || bb.projectileThreat) return 0.1;
        if (bb.guardStamina < 28 || bb.hpRatio < 0.22) return 0.25;
        return 0.72;
    }
    setGoal(aiAgent) {
        aiAgent.activeSteeringMode = 'ARRIVE_SWEET_SPOT';
    }
}

class MomentumPursueGoalEvaluator extends YUKA.GoalEvaluator {
    calculateDesirability(aiAgent) {
        if (!aiAgent || !aiAgent.blackboard) return 0.25;
        const bb = aiAgent.blackboard;
        const diff = bb.difficulty || 'normal';
        if (bb.targetIsDizzy) return 0.96;
        if (bb.targetInRecovery || bb.targetDeflected) {
            return diff === 'brutal' ? 0.90 : (diff === 'normal' ? 0.62 : 0.35);
        }
        if (bb.dist > bb.myReach * 1.35 && bb.hpRatio >= 0.30) {
            if (diff === 'brutal') return bb.archetype === 'speed' ? 0.85 : 0.75;
            if (diff === 'normal') return 0.50;
            return 0.28;
        }
        return 0.25;
    }
    setGoal(aiAgent) {
        aiAgent.activeSteeringMode = 'PURSUE_MOMENTUM';
    }
}

class TacticalEvadeGoalEvaluator extends YUKA.GoalEvaluator {
    calculateDesirability(aiAgent) {
        if (!aiAgent || !aiAgent.blackboard) return 0.1;
        const bb = aiAgent.blackboard;
        if (bb.guardStamina < 25) return 0.92;
        if (bb.targetHasHyperArmor && bb.dist < 3.6 && bb.archetype !== 'heavy') return 0.88;
        if (bb.isCornered && bb.dist < 2.8) return 0.84;
        return 0.15;
    }
    setGoal(aiAgent) {
        aiAgent.activeSteeringMode = 'EVADE_TACTICAL';
    }
}

const AIVehicleSystem = {
    entityManager: null,
    aiVehicle: null,
    targetVehicle: null,
    vision: null,
    memorySystem: null,
    brain: null,
    behaviors: {},
    blackboard: {},

    init() {
        if (typeof YUKA === 'undefined') return;
        if (!this.entityManager) {
            this.entityManager = new YUKA.EntityManager();
        }
        if (!this.aiVehicle) {
            this.aiVehicle = new YUKA.Vehicle();
            this.aiVehicle.name = 'AI_Fighter_Vehicle';
            this.aiVehicle.maxSpeed = 8.5;
            this.aiVehicle.maxForce = 32.0;
            this.aiVehicle.boundingRadius = 1.32;
            this.aiVehicle.updateOrientation = false;

            this.targetVehicle = new YUKA.Vehicle();
            this.targetVehicle.name = 'Target_Fighter_Vehicle';
            this.targetVehicle.updateOrientation = false;

            // Steering behaviors
            const seek = new YUKA.SeekBehavior();
            const arrive = new YUKA.ArriveBehavior(new YUKA.Vector3(), 1.6, 0.22);
            const pursue = new YUKA.PursueBehavior(this.targetVehicle, 0.45);
            const evade = new YUKA.EvadeBehavior(this.targetVehicle, 6.5, 0.45);
            const flee = new YUKA.FleeBehavior(new YUKA.Vector3(), 5.5);
            const followPath = new YUKA.FollowPathBehavior(new YUKA.Path(), 0.75);

            seek.active = false;
            arrive.active = true;
            pursue.active = false;
            evade.active = false;
            flee.active = false;
            followPath.active = false;

            this.aiVehicle.steering.add(seek);
            this.aiVehicle.steering.add(arrive);
            this.aiVehicle.steering.add(pursue);
            this.aiVehicle.steering.add(evade);
            this.aiVehicle.steering.add(flee);
            this.aiVehicle.steering.add(followPath);

            this.behaviors = { seek, arrive, pursue, evade, flee, followPath };

            // Vision & Memory System
            this.vision = new YUKA.Vision(this.aiVehicle);
            this.vision.fieldOfView = Math.PI * 1.25;
            this.vision.range = 28.0;

            this.memorySystem = new YUKA.MemorySystem(this.aiVehicle);
            this.memorySystem.memorySpan = 4.0;
            this.memorySystem.createRecord(this.targetVehicle);

            // Goal-driven Think Brain
            this.brain = new YUKA.Think(this.aiVehicle);
            this.brain.addEvaluator(new SweetSpotGoalEvaluator(1.0));
            this.brain.addEvaluator(new MomentumPursueGoalEvaluator(1.1));
            this.brain.addEvaluator(new TacticalEvadeGoalEvaluator(1.05));

            this.entityManager.add(this.aiVehicle);
            this.entityManager.add(this.targetVehicle);
        }
    },

    /**
     * Step 2 of the AI Loop: Updates Yuka Perception, Goal Evaluators, and Steering
     * Forces to compute desired velocity and momentum acceleration.
     */
    computeSteeringStep(aiFighter, targetFighter, navData, dt, nowSec = 0) {
        this.init();
        if (!this.aiVehicle || !aiFighter || !targetFighter) {
            return { vx: 0, steeringMode: 'IDLE', speedRatio: 0, targetVisible: true };
        }

        // Sync current fighter positions & velocities into YUKA vehicles
        this.aiVehicle.position.set(aiFighter.x, aiFighter.y || 0, 0);
        this.aiVehicle.velocity.set(aiFighter.vx || 0, aiFighter.vy || 0, 0);
        this.aiVehicle.forward.set(aiFighter.facing || -1, 0, 0);

        this.targetVehicle.position.set(targetFighter.x, targetFighter.y || 0, 0);
        this.targetVehicle.velocity.set(targetFighter.vx || 0, targetFighter.vy || 0, 0);
        this.targetVehicle.forward.set(targetFighter.facing || 1, 0, 0);

        const isBoss = Boolean(aiFighter.dino && aiFighter.dino.isBoss);
        const diff = typeof aiDifficulty !== 'undefined' ? aiDifficulty : 'normal';
        const speedScale = isBoss ? 0.65 : (diff === 'brutal' ? 1.0 : (diff === 'normal' ? 0.82 : 0.68));
        const baseWalk = (aiFighter.dino && aiFighter.dino.walkSpeed) || 7.5;
        this.aiVehicle.maxSpeed = baseWalk * speedScale;

        // Update Yuka Vision & Memory Record
        const record = this.memorySystem.getRecord(this.targetVehicle);
        const isVisible = this.vision.visible(this.targetVehicle.position);
        if (record) {
            record.visible = isVisible;
            if (isVisible) {
                record.timeLastSensed = nowSec;
                record.lastSensedPosition.copy(this.targetVehicle.position);
            }
        }

        const dist = Math.abs(aiFighter.x - targetFighter.x);
        const sweetSpot = (navData && navData.sweetSpot) || { x: targetFighter.x, y: 0, myReach: 3.45, isCornered: false };
        const tState = targetFighter.combatController ? targetFighter.combatController.state : 'IDLE';

        this.aiVehicle.blackboard = {
            dist,
            difficulty: diff,
            myReach: sweetSpot.myReach || 3.45,
            isCornered: Boolean(sweetSpot.isCornered),
            guardStamina: aiFighter.guardStamina !== undefined ? aiFighter.guardStamina : 100,
            hpRatio: aiFighter.hp / Math.max(1, aiFighter.maxHp),
            archetype: aiFighter.weightClass || 'brawler',
            targetInRecovery: tState === 'ATTACK_RECOVERY',
            targetDeflected: tState === 'BLOCK_DEFLECTED',
            targetIsDizzy: Boolean(targetFighter.isDizzy),
            targetHasHyperArmor: Boolean(targetFighter.hasHyperArmor),
            projectileThreat: navData ? navData.projectileThreat : null,
            unblockableThreat: navData ? navData.unblockableThreat : null
        };

        // Arbitrate Yuka Goal Evaluators
        this.brain.arbitrate();
        const mode = this.aiVehicle.activeSteeringMode || 'ARRIVE_SWEET_SPOT';

        // Configure active steering behavior weights
        const { seek, arrive, pursue, evade, flee, followPath } = this.behaviors;
        seek.active = false;
        arrive.active = false;
        pursue.active = false;
        evade.active = false;
        flee.active = false;
        followPath.active = false;

        if (mode === 'PURSUE_MOMENTUM') {
            pursue.active = true;
            pursue.weight = 1.0;
            seek.active = true;
            seek.weight = 0.35;
            seek.target.set(targetFighter.x, targetFighter.y || 0, 0);
        } else if (mode === 'EVADE_TACTICAL') {
            if (sweetSpot.isCornered) {
                // Escape toward stage center
                seek.active = true;
                seek.weight = 1.0;
                seek.target.set(0, aiFighter.groundY || 0, 0);
            } else {
                evade.active = true;
                evade.weight = 0.85;
                arrive.active = true;
                arrive.weight = 0.45;
                arrive.target.set(sweetSpot.x, sweetSpot.y || 0, 0);
            }
        } else {
            // ARRIVE_SWEET_SPOT + NavMesh Waypoint Following
            arrive.active = true;
            arrive.weight = 1.0;
            const wp = (navData && navData.nextWaypoint) ? navData.nextWaypoint : sweetSpot;
            arrive.target.set(wp.x, wp.y || 0, 0);
        }

        this.entityManager.update(dt);

        return {
            vx: this.aiVehicle.velocity.x,
            steeringMode: mode,
            speedRatio: Math.abs(this.aiVehicle.velocity.x) / Math.max(1, baseWalk),
            targetVisible: isVisible,
            desiredTargetX: sweetSpot.x
        };
    }
};

/**
 * Autonomous Yuka Flocking & Steering Manager for 3D Arena Fauna
 * (Pterosaurs, Meganeura Dragonflies, Sauropods, Astral Wisps)
 * Synced directly to Three.js Object3D transforms via YUKA.SyncManager.
 */
const ArenaFaunaFlockSystem = {
    createFlockForDecor(decor) {
        if (typeof YUKA === 'undefined' || !decor || !Array.isArray(decor.dragonflies)) return null;
        const manager = new YUKA.EntityManager();
        const dragonflyVehicles = [];

        const alignment = new YUKA.AlignmentBehavior();
        const cohesion = new YUKA.CohesionBehavior();
        const separation = new YUKA.SeparationBehavior();
        alignment.weight = 0.65;
        cohesion.weight = 0.55;
        separation.weight = 1.15;

        for (let i = 0; i < decor.dragonflies.length; i++) {
            const df = decor.dragonflies[i];
            const vehicle = new YUKA.Vehicle();
            vehicle.maxSpeed = 2.8;
            vehicle.maxForce = 6.5;
            vehicle.boundingRadius = 0.65;
            vehicle.updateNeighborhood = true;
            vehicle.neighborhoodRadius = 6.5;
            vehicle.position.set(df.baseX, df.baseY, df.baseZ);

            const wander = new YUKA.WanderBehavior(0.9, 1.8, 2.2);
            wander.weight = 0.9;
            const homeArrive = new YUKA.ArriveBehavior(new YUKA.Vector3(df.baseX, df.baseY, df.baseZ), 2.0, 0.3);
            homeArrive.weight = 0.75;

            vehicle.steering.add(wander);
            vehicle.steering.add(homeArrive);
            vehicle.steering.add(separation);
            vehicle.steering.add(alignment);
            vehicle.steering.add(cohesion);

            // Official YUKA.SyncManager transform binding to Three.js Group
            vehicle.setRenderComponent(df.group, (entity, renderComponent) => {
                renderComponent.position.set(entity.position.x, entity.position.y, entity.position.z);
                if (entity.velocity.squaredLength() > 0.02) {
                    const targetYaw = Math.atan2(entity.velocity.x, entity.velocity.z);
                    renderComponent.rotation.y = targetYaw;
                }
            });

            manager.add(vehicle);
            dragonflyVehicles.push({ vehicle, df });
        }

        return { manager, dragonflyVehicles };
    },

    update(decor, time, dt) {
        if (!decor || !decor.dragonflies) return;
        if (!decor._yukaFlock) {
            decor._yukaFlock = this.createFlockForDecor(decor);
        }
        const flock = decor._yukaFlock;
        if (flock && flock.manager) {
            flock.manager.update(dt);
            for (let i = 0; i < flock.dragonflyVehicles.length; i++) {
                const { vehicle, df } = flock.dragonflyVehicles[i];
                vehicle.position.y = Math.max(0.45, Math.min(2.6, df.baseY + Math.sin(time * 2.2 + df.phase) * 0.35));
                const buzz = Math.sin(time * 36 + df.phase) * 0.35;
                if (df.w1) df.w1.rotation.z = buzz;
                if (df.w2) df.w2.rotation.z = -buzz;
            }
        }
    }
};
