/* ============================================================================
 * js/core/ai-statechart.js — XState Deterministic AI Statecharts
 * Formalizes NPC Macro-Combat States (PATROL_STALK -> ALERT_FOOTSIES ->
 * ENGAGE_PRESSURE -> DEFENSIVE_TURTLE -> EVADE_RECOVER -> FINISH_HIM_EXEC)
 * and synchronizes with DinosaurCombatController states.
 * ============================================================================ */

const AIMacroStatechart = {
    service: null,
    machine: null,
    currentState: 'PATROL_STALK',

    init() {
        if (typeof XState === 'undefined' || this.service) return;

        this.machine = XState.createMachine({
            id: 'ExtinctionFighterAIStatechart',
            initial: 'PATROL_STALK',
            context: {
                dist: 9.6,
                myReach: 3.45,
                guardStamina: 100,
                hpRatio: 1.0,
                rage: 0,
                isCornered: false
            },
            on: {
                OPPONENT_DIZZY: 'FINISH_HIM_EXEC',
                EMERGENCY_EVADE: 'EVADE_RECOVER',
                INCOMING_THREAT: 'DEFENSIVE_TURTLE'
            },
            states: {
                PATROL_STALK: {
                    on: {
                        ENTER_FOOTSIES: 'ALERT_FOOTSIES',
                        ENTER_CLOSE_RANGE: 'ENGAGE_PRESSURE'
                    }
                },
                ALERT_FOOTSIES: {
                    on: {
                        ENTER_CLOSE_RANGE: 'ENGAGE_PRESSURE',
                        TARGET_FAR: 'PATROL_STALK',
                        WHIFF_DETECTED: 'ENGAGE_PRESSURE'
                    }
                },
                ENGAGE_PRESSURE: {
                    on: {
                        TARGET_FAR: 'PATROL_STALK',
                        ENTER_FOOTSIES: 'ALERT_FOOTSIES',
                        LOW_STAMINA: 'EVADE_RECOVER'
                    }
                },
                DEFENSIVE_TURTLE: {
                    on: {
                        THREAT_CLEARED: 'ALERT_FOOTSIES',
                        COUNTER_WINDOW: 'ENGAGE_PRESSURE',
                        LOW_STAMINA: 'EVADE_RECOVER'
                    }
                },
                EVADE_RECOVER: {
                    on: {
                        RECOVERED_SAFE: 'ALERT_FOOTSIES',
                        TARGET_FAR: 'PATROL_STALK'
                    }
                },
                FINISH_HIM_EXEC: {
                    on: {
                        ROUND_RESET: 'PATROL_STALK',
                        ENTER_FOOTSIES: 'ALERT_FOOTSIES'
                    }
                }
            }
        });

        this.service = XState.interpret(this.machine).start();
        this.service.onTransition((state) => {
            this.currentState = state.value;
        });
    },

    /**
     * Evaluates deterministic XState transitions based on live combat telemetry.
     */
    evaluate(bb) {
        this.init();
        if (!this.service || !bb) return this.currentState;

        if (bb.targetIsDizzy || (typeof matchState !== 'undefined' && matchState === 'finish_him')) {
            this.service.send({ type: 'OPPONENT_DIZZY' });
            return this.currentState;
        }

        if (bb.unblockableThreat || bb.projectileThreat || (bb.targetIsAttacking && bb.dist <= bb.enemyReach + 0.85)) {
            if (bb.guardStamina < 22) {
                this.service.send({ type: 'EMERGENCY_EVADE' });
            } else {
                this.service.send({ type: 'INCOMING_THREAT' });
            }
            return this.currentState;
        }

        if (bb.guardStamina < 25 || (bb.isCornered && bb.hpRatio < 0.35 && bb.dist < 2.6)) {
            this.service.send({ type: 'EMERGENCY_EVADE' });
            return this.currentState;
        }

        if (bb.targetInRecovery || bb.targetDeflected) {
            this.service.send({ type: 'WHIFF_DETECTED' });
            this.service.send({ type: 'COUNTER_WINDOW' });
            return this.currentState;
        }

        if (bb.dist <= bb.myReach * 1.04) {
            this.service.send({ type: 'ENTER_CLOSE_RANGE' });
        } else if (bb.dist <= bb.myReach * 1.48) {
            if (this.currentState === 'DEFENSIVE_TURTLE') {
                this.service.send({ type: 'THREAT_CLEARED' });
            } else if (this.currentState === 'EVADE_RECOVER' && bb.guardStamina >= 45) {
                this.service.send({ type: 'RECOVERED_SAFE' });
            } else {
                this.service.send({ type: 'ENTER_FOOTSIES' });
            }
        } else {
            this.service.send({ type: 'TARGET_FAR' });
        }

        return this.currentState;
    }
};
