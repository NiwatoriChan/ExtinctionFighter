/* ============================================================================
 * XSTATE — Deterministic Finite-State Machines & Statecharts (js/libs/xstate.umd.js)
 * Implements createMachine, interpret, assign, guards (cond), entry/exit actions,
 * and reactive state transition subscriptions.
 * ============================================================================ */
(function (global) {
    'use strict';

    function assign(assignment) {
        return {
            type: 'xstate.assign',
            assignment
        };
    }

    class StateMachineInstance {
        constructor(config, options = {}) {
            this.id = config.id || 'machine';
            this.initial = config.initial;
            this.context = Object.assign({}, config.context || {});
            this.states = config.states || {};
            this.on = config.on || {};
            this.options = Object.assign({ actions: {}, guards: {} }, options);
        }

        get initialState() {
            return {
                value: this.initial,
                context: Object.assign({}, this.context),
                changed: false,
                matches(val) {
                    return this.value === val;
                }
            };
        }

        transition(currentState, eventObj) {
            const stateValue = typeof currentState === 'string' ? currentState : currentState.value;
            const currentContext = (currentState && currentState.context)
                ? Object.assign({}, currentState.context)
                : Object.assign({}, this.context);

            const event = typeof eventObj === 'string' ? { type: eventObj } : (eventObj || { type: '' });
            const stateConfig = this.states[stateValue] || {};

            // Look up transition in current state first, then global machine 'on'
            const candidates = (stateConfig.on && stateConfig.on[event.type]) || this.on[event.type];
            if (!candidates) {
                return {
                    value: stateValue,
                    context: currentContext,
                    changed: false,
                    matches(val) { return this.value === val; }
                };
            }

            const transitionList = Array.isArray(candidates) ? candidates : [candidates];
            for (let i = 0; i < transitionList.length; i++) {
                const t = typeof transitionList[i] === 'string' ? { target: transitionList[i] } : transitionList[i];
                const cond = t.cond || t.guard;
                let guardPassed = true;

                if (cond) {
                    const guardFn = typeof cond === 'function' ? cond : this.options.guards[cond];
                    if (typeof guardFn === 'function') {
                        guardPassed = Boolean(guardFn(currentContext, event));
                    }
                }

                if (guardPassed) {
                    const nextValue = t.target || stateValue;
                    const changed = nextValue !== stateValue;
                    const nextStateConfig = this.states[nextValue] || {};

                    // Execute exit, transition, and entry actions
                    const actionsToRun = [];
                    if (changed && stateConfig.exit) {
                        actionsToRun.push(...(Array.isArray(stateConfig.exit) ? stateConfig.exit : [stateConfig.exit]));
                    }
                    if (t.actions) {
                        actionsToRun.push(...(Array.isArray(t.actions) ? t.actions : [t.actions]));
                    }
                    if (changed && nextStateConfig.entry) {
                        actionsToRun.push(...(Array.isArray(nextStateConfig.entry) ? nextStateConfig.entry : [nextStateConfig.entry]));
                    }

                    for (let a = 0; a < actionsToRun.length; a++) {
                        const act = actionsToRun[a];
                        if (!act) continue;
                        if (act.type === 'xstate.assign') {
                            if (typeof act.assignment === 'function') {
                                Object.assign(currentContext, act.assignment(currentContext, event));
                            } else if (typeof act.assignment === 'object') {
                                for (const k of Object.keys(act.assignment)) {
                                    const fnOrVal = act.assignment[k];
                                    currentContext[k] = typeof fnOrVal === 'function'
                                        ? fnOrVal(currentContext, event)
                                        : fnOrVal;
                                }
                            }
                        } else if (typeof act === 'function') {
                            act(currentContext, event);
                        } else if (typeof act === 'string' && typeof this.options.actions[act] === 'function') {
                            this.options.actions[act](currentContext, event);
                        }
                    }

                    return {
                        value: nextValue,
                        context: currentContext,
                        changed,
                        matches(val) { return this.value === val; }
                    };
                }
            }

            return {
                value: stateValue,
                context: currentContext,
                changed: false,
                matches(val) { return this.value === val; }
            };
        }
    }

    class InterpreterService {
        constructor(machine) {
            this.machine = machine;
            this.state = machine.initialState;
            this._listeners = new Set();
            this.status = 'unstarted';
        }
        start(initialState) {
            this.status = 'running';
            if (initialState) {
                this.state = typeof initialState === 'string'
                    ? { value: initialState, context: Object.assign({}, this.machine.context), changed: true, matches(v) { return this.value === v; } }
                    : initialState;
            }
            return this;
        }
        stop() {
            this.status = 'stopped';
            this._listeners.clear();
            return this;
        }
        send(event) {
            if (this.status !== 'running') return this.state;
            this.state = this.machine.transition(this.state, event);
            for (const listener of this._listeners) {
                listener(this.state, event);
            }
            return this.state;
        }
        onTransition(listener) {
            this._listeners.add(listener);
            listener(this.state, { type: 'xstate.init' });
            return this;
        }
        subscribe(listener) {
            const fn = typeof listener === 'function' ? listener : (listener && listener.next);
            if (fn) this._listeners.add(fn);
            return {
                unsubscribe: () => {
                    if (fn) this._listeners.delete(fn);
                }
            };
        }
    }

    function createMachine(config, options) {
        return new StateMachineInstance(config, options);
    }

    function interpret(machine) {
        return new InterpreterService(machine);
    }

    global.XState = {
        createMachine,
        Machine: createMachine,
        interpret,
        assign
    };
})(window);
