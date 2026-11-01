// 8. MOTEUR DE COMBAT 3D (POSITIONS X EN UNITÉS 3D : -11 À +11)
const STAGE_LEFT_3D = -11.0;
const STAGE_RIGHT_3D = 11.0;

class Fighter3D {
    constructor(dino, isP1, skinIndex = 0) {
        this.dino = dino;
        this.isP1 = isP1;
        this.skinIndex = skinIndex;
        this.roundsWon = 0;
        this.rig = createDino3DRig(dino, skinIndex);
        battleScene.add(this.rig.root);
        this.resetForRound();
    }

    destroy() {
        if (this.rig && this.rig.root && battleScene) {
            battleScene.remove(this.rig.root);
        }
    }

    resetForRound() {
        this.x = this.isP1 ? -4.8 : 4.8;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.facing = this.isP1 ? 1 : -1;
        this.hp = this.dino.maxHp;
        this.maxHp = this.dino.maxHp;
        this.rage = 0;
        this.action = 'idle';
        this.actionTimer = 0;
        this.actionDuration = 0;
        this.hasHitCurrentAttack = false;
        this.hitStun = 0;
        this.isBlocking = false;
        this.isDizzy = false;
        this.isDead = false;
        this.decapitated = false;
        this.flattened = false;
        this.kneeling = false;
        this.isXrayTarget = false;
        this.isXrayAttacker = false;
        this.comboCount = 0;
        this.dashTimer = 0;
        this.dashCooldown = 0;
        this.bufferedAction = null;
        this.bufferTimer = 0;
        this.rig.headGroup.scale.setScalar(1);

        // Cooldowns d'attaque : plus l'attaque est puissante, plus le cooldown est long
        this.cooldowns = {
            light: 0,
            heavy: 0,
            special: 0,
            special2: 0,
            xray: 0
        };
        const spdMod = Math.max(0.85, Math.min(1.15, 1.25 - (this.dino.stats.spd / 100) * 0.35));
        this.maxCooldowns = {
            light: 0.45 * spdMod,    // Coup léger : 0.45s (rapide)
            heavy: 1.10 * spdMod,    // Coup lourd : 1.10s (moyen)
            special: 2.80 * spdMod,  // Coup spécial 1 : 2.80s (long)
            special2: 4.50 * spdMod, // Coup spécial 2 / Ultra : 4.50s (très long)
            xray: 8.00 * spdMod      // X-Ray / Fatal : 8.00s + 100% Rage
        };
    }

    canCancelInto(nextType) {
        if (this.actionDuration <= 0) return true;
        const progress = this.actionTimer / this.actionDuration;
        // Fenêtre de Combo Cancel dès 42% de l'animation en cours
        if (progress < 0.42) return false;
        if (this.action === 'light' && (nextType === 'heavy' || nextType === 'special' || nextType === 'special2' || nextType === 'xray')) {
            return true;
        }
        if (this.action === 'heavy' && (nextType === 'special' || nextType === 'special2' || nextType === 'xray')) {
            return true;
        }
        return false;
    }

    startDash(dir) {
        if (xrayCinematicTimer > 0 || this.hitStun > 0 || this.isDizzy || this.isDead || this.dashCooldown > 0) return;
        if (this.action === 'xray' || this.action === 'fatality') return;

        this.isBlocking = false;
        this.dashTimer = 0.18;
        this.dashCooldown = 0.42;
        const dashDir = dir !== 0 ? dir : this.facing;
        this.vx = dashDir * (this.dino.walkSpeed * 2.45);
        this.action = 'walk';
        this.actionDuration = 0;
        this.actionTimer = 0;
        sfx.playHit(false);
        spawnFloatingPopup(this.x, dashDir === this.facing ? '💨 DASH !' : '💨 ESQUIVE !', '#38bdf8');
    }

    startAttack(type) {
        if (xrayCinematicTimer > 0 || this.hitStun > 0 || this.isDizzy || this.isDead) return;
        if (this.action === 'xray' || this.action === 'fatality') return;

        // Vérification stricte du cooldown d'attaque
        if (this.cooldowns && this.cooldowns[type] > 0) {
            if (this.isP1 || gameMode === 'pvp') {
                sfx.playCooldownWarning();
                const labels = {
                    light: 'LÉGER',
                    heavy: 'LOURD',
                    special: this.dino.special1Name ? this.dino.special1Name.replace(/ \(.*?\)/, '').toUpperCase() : 'SPÉCIAL',
                    special2: this.dino.special2Name ? this.dino.special2Name.replace(/ \(.*?\)/, '').toUpperCase() : 'ULTRA',
                    xray: 'X-RAY'
                };
                spawnFloatingPopup(this.x, `⏳ ${labels[type] || type.toUpperCase()} EN RECHARGE (${this.cooldowns[type].toFixed(1)}s)`, '#94a3b8');
            }
            return;
        }

        // Gestion du Combo Cancel ou mise en mémoire tampon (Input Buffer)
        if (this.action === 'light' || this.action === 'heavy' || this.action === 'special' || this.action === 'special2') {
            if (!this.canCancelInto(type)) {
                this.bufferedAction = type;
                this.bufferTimer = 0.24;
                return;
            }
        }

        this.isBlocking = false;
        this.action = type;
        this.hasHitCurrentAttack = false;
        this.actionTimer = 0;
        this.bufferedAction = null;

        // Déclencher le cooldown dès le lancement de l'attaque
        if (this.cooldowns && this.maxCooldowns && this.maxCooldowns[type]) {
            this.cooldowns[type] = this.maxCooldowns[type];
        }

        // Léger pas d'engagement en avant pour dynamiser les coups au corps à corps
        if (type === 'light') {
            this.actionDuration = 0.26;
            this.vx = this.facing * 4.2;
            sfx.playRoar(150, 0.14);
        } else if (type === 'heavy') {
            this.actionDuration = 0.44;
            this.vx = this.facing * 6.5;
            sfx.playRoar(95, 0.25);
        } else if (type === 'special') {
            this.actionDuration = 0.54;
            this.vx = this.facing * 5.2;
            sfx.playRoar(80, 0.38);
        } else if (type === 'special2') {
            this.actionDuration = 0.60;
            this.vx = this.facing * 3.5;
            sfx.playRoar(115, 0.42);
        }
    }
}

let fighter1 = null;
let fighter2 = null;
let projectiles3D = [];
let particles3D = [];
let roundNumber = 1;
let roundTimer = 99;
let roundTimerAccum = 0;
let matchState = 'select';
let stateTimer = 0;
let screenShake = 0;
let xrayCinematicTimer = 0;
let xrayStage = 0;
let xrayLockPositions = null;
let fatalityFocusFighter = null;

const keys = {};
const touchState = { left: false, right: false, up: false, down: false };
const p2TouchState = { left: false, right: false, up: false, down: false };
const lastTapTime = { left: 0, right: 0, p2Left: 0, p2Right: 0 };
