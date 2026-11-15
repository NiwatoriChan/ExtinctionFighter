/* ============================================================================
 * EXTINCTION KOMBAT 3D — MOTEUR DE NIVEAU CAMPAGNE (SMASH MELEE ADVENTURE MODE)
 * Chaque Ère est un niveau complet de style Super Smash Bros. Melee :
 *   - Vagues d'ennemis / minions de chaque ère à vaincre (Multi-Man Melee / Adventure)
 *   - Knockback Smash avec projections à haute vélocité et effets K.O.
 *   - Système d'objets ramassables 3D (Viande préhistorique +250 PV, Ambre de Rage MAX)
 *   - Boss Unique par Ère avec barre de vie de titan, attaques de zone et enrage
 *   - Système de Vies / Stocks (3 vies par niveau)
 *   - Déblocage automatique d'un combattant et d'une arène à chaque ère conquise
 * ============================================================================ */

// 1. LES 13 NIVEAUX DE CAMPAGNE SONT DÉCLARÉS SÉPARÉMENT DANS js/campaign/era-*.js VIA registerCampaignEra()

// 2. GESTION DE LA PROGRESSION DE CAMPAGNE (LOCALSTORAGE)
function isEraUnlocked(eraId) {
    if (eraId === 1) return true; // La 1ère ère est toujours disponible
    try {
        return localStorage.getItem('ek3d_cleared_era_' + (eraId - 1)) === 'true' ||
               localStorage.getItem('ek3d_unlocked_era_' + eraId) === 'true';
    } catch (e) {
        return eraId === 1;
    }
}

function isEraCleared(eraId) {
    try {
        return localStorage.getItem('ek3d_cleared_era_' + eraId) === 'true';
    } catch (e) {
        return false;
    }
}

function getEraStars(eraId) {
    try {
        const stored = parseInt(localStorage.getItem('ek3d_stars_era_' + eraId) || '0', 10);
        if (stored > 0) return Math.min(3, stored);
        return isEraCleared(eraId) ? 3 : 0;
    } catch (e) {
        return 0;
    }
}

function getEraHighScore(eraId) {
    try {
        return parseInt(localStorage.getItem('ek3d_highscore_era_' + eraId) || '0', 10) || 0;
    } catch (e) {
        return 0;
    }
}

function saveEraPerformance(eraId, stars, score) {
    try {
        const clampedStars = Math.max(1, Math.min(3, Math.round(stars || 1)));
        const prevStars = parseInt(localStorage.getItem('ek3d_stars_era_' + eraId) || '0', 10) || 0;
        if (clampedStars > prevStars) {
            localStorage.setItem('ek3d_stars_era_' + eraId, String(clampedStars));
        }
        const cleanScore = Math.max(0, Math.round(score || 0));
        const prevScore = parseInt(localStorage.getItem('ek3d_highscore_era_' + eraId) || '0', 10) || 0;
        if (cleanScore > prevScore) {
            localStorage.setItem('ek3d_highscore_era_' + eraId, String(cleanScore));
        }
    } catch (e) {
        console.warn("Could not save era performance:", e);
    }
}

function clearEraProgress(eraId) {
    try {
        localStorage.setItem('ek3d_cleared_era_' + eraId, 'true');
        const nextId = eraId + 1;
        if (typeof CAMPAIGN_ERAS !== 'undefined' && nextId <= CAMPAIGN_ERAS.length) {
            localStorage.setItem('ek3d_unlocked_era_' + nextId, 'true');
        }
        // Débloquer la récompense de combattant et d'arène
        const era = typeof CAMPAIGN_ERAS !== 'undefined' ? CAMPAIGN_ERAS.find(e => e.id === eraId) : null;
        if (era && era.reward) {
            if (typeof unlockFighter === 'function') unlockFighter(era.reward.fighterId);
            if (typeof unlockArena === 'function') unlockArena(era.reward.arenaId);
        }
    } catch (e) {
        console.warn("Could not save era progress:", e);
    }
}

if (typeof window !== 'undefined' && typeof window.unlockArena !== 'function') {
    window.unlockArena = function unlockArena(arenaId) {
        try {
            localStorage.setItem('ek3d_unlocked_arena_' + arenaId, 'true');
        } catch (e) {}
    };
}

if (typeof window !== 'undefined' && typeof window.isArenaUnlocked !== 'function') {
    window.isArenaUnlocked = function isArenaUnlocked(arenaId) {
        if (arenaId === 'volcano' || arenaId === 'boneyard') return true;
        try {
            return localStorage.getItem('ek3d_unlocked_arena_' + arenaId) === 'true';
        } catch (e) {
            return true;
        }
    };
}

// 3. ÉTAT DYNAMIQUE DU NIVEAU SMASH EN COURS
var activeCampaignEra = null;
var currentCampaignWaveIdx = 0;
var campaignPlayerStocks = 3; // 3 Vies / Stocks
var campaignLevelScore = 0;
var campaignComboCount = 0;
var campaignComboTimer = 0;
var campaignActiveMinions = [];
var campaignActivePickups = [];
var campaignActiveProjectiles = [];
var campaignActiveHazards = [];
var campaignBossFighter = null;
var campaignBossPhase = 1;
var campaignBossHealthBarEl = null;
var campaignSmashHudRoot = null;
var campaignWaveBannerTimer = 0;
var campaignWaveAnnounceTitle = '';
var campaignWaveAnnounceSub = '';
var campaignWaveObjective = 'clear';
var campaignWaveTimer = 0;
var campaignWaveDuration = 0;
var campaignSurviveRespawnTimer = 0;
var campaignTimeAttackBonusAwarded = false;
var campaignHazardTimer = 0;
var campaignHazardActiveDir = 0;
var campaignHazardActiveTimer = 0;
var campaignHazardTickTimer = 0;
var campaignSunbeamX = 0;
var campaignSunbeamMesh = null;
var campaignCurrentTideHigh = false;

function applyDamageToPlayer(player, damage, knockbackX = 0, knockbackY = 0) {
    if (!player || player.isDead) return;

    if (player.isBlocking) {
        damage = Math.max(5, Math.round(damage * 0.25));
        if (typeof spawnFloatingPopup === 'function') {
            spawnFloatingPopup(player.x, '🛡️ BLOCAGE !', '#38bdf8');
        }
    }

    player.hp = Math.max(0, player.hp - damage);
    player.hitStun = 0.28;
    player.vx = knockbackX;
    if (knockbackY > 0 && (player.y - (player.groundY || 0)) <= 0.12) {
        player.vy = knockbackY;
    }
    player.action = 'hit';
    player.actionTimer = 0;
    player.actionDuration = 0.32;

    if (typeof spawn3DBloodAndBones === 'function') {
        spawn3DBloodAndBones(player.x, player.y + 1.2, 5, false);
    }
    if (typeof updateBattleHUD === 'function') {
        updateBattleHUD();
    }
    updateCampaignSmashHUD();

    if (player.hp <= 0 && !player.isDead) {
        handlePlayerStockLoss();
    }
}
window.applyDamageToPlayer = applyDamageToPlayer;

// 4. CLASSE MINION 3D : ADVERSAIRE DE STYLE SMASH MELEE & ARCHÉTYPES
class EraMinion3D {
    constructor(def, spawnX, arenaGroundY = 0) {
        this.def = def;
        this.archetype = def.archetype || 'brawler';
        this.x = spawnX;
        this.groundY = arenaGroundY;
        this.floatHeight = this.archetype === 'aerial' ? (2.1 + Math.random() * 0.7) : 0;
        this.y = arenaGroundY + this.floatHeight;
        this.vx = 0;
        this.vy = 0;
        this.facing = -1;
        this.hp = def.hp;
        this.maxHp = def.hp;
        this.scale = def.scale || 0.6;
        this.speed = def.speed || 6.0;
        this.action = 'idle';
        this.actionTimer = 0;
        this.hitStun = 0;
        this.isDead = false;
        this.attackCooldown = 0.6 + Math.random() * 1.2;
        this.rangedCooldown = 1.6 + Math.random() * 1.4;
        this.swoopTimer = 0;
        this.isAirborne = this.archetype === 'aerial';
        this.wings = [];
        this.segments = [];

        // Modèle 3D procédural Three.js
        this.root = new THREE.Group();
        this.root.scale.set(this.scale, this.scale, this.scale);
        this.buildMesh();

        if (battleScene) {
            battleScene.add(this.root);
        }
        this.syncPosition();
    }

    buildMesh() {
        this.bodyMesh = this.root;
        this.legs = [];
        this.arms = [];
        const t = this.def.enemyType;
        if (typeof THREE !== 'undefined' && typeof THREE.GLTFLoader !== 'undefined' &&
            typeof MINION_GLB_CACHE !== 'undefined' && typeof hydrateMinionFromGLB === 'function') {
            if (MINION_GLB_CACHE[t] && hydrateMinionFromGLB(this, MINION_GLB_CACHE[t])) {
                return;
            }
            if (typeof loadMinionGLB === 'function') {
                loadMinionGLB(t).then((gltf) => {
                    if (this.root && !this.isDead && !this._isGlbHydrated) {
                        hydrateMinionFromGLB(this, gltf);
                    }
                }).catch(() => {});
            }
        }
    }

    syncPosition() {
        if (!this.root) return;
        this.root.position.set(this.x, this.y, 0);
        this.root.rotation.y = this.facing > 0 ? 0 : Math.PI;
        this.updateHpBarScreenPos();
    }

    takeDamage(damage, knockbackX = 0, knockbackY = 0, attackAction = '') {
        if (this.isDead) return;

        let finalDmg = damage;
        if (this.archetype === 'armored' && typeof fighter1 !== 'undefined' && fighter1) {
            const hitFromFront = ((fighter1.x - this.x) * this.facing) > 0;
            const isSpecialOrAir = (attackAction && (attackAction.includes('special') || attackAction === 'anti_air')) || (fighter1.y - this.y > 0.8);
            if (hitFromFront && !isSpecialOrAir) {
                finalDmg = Math.max(15, Math.round(damage * 0.55));
                knockbackX *= 0.45;
                if (typeof spawnFloatingPopup === 'function') {
                    spawnFloatingPopup(this.x, '🛡️ BLINDAGE FRONTAL !', '#60a5fa');
                }
            } else if (!hitFromFront) {
                finalDmg = Math.round(damage * 1.25);
                if (typeof spawnFloatingPopup === 'function') {
                    spawnFloatingPopup(this.x, '💥 FLANC PERCÉ !', '#facc15');
                }
            }
        }

        this.hp = Math.max(0, this.hp - finalDmg);
        this.hitStun = 0.35;
        this.vx = knockbackX;
        this.vy = knockbackY;
        this.action = 'hit';
        this.actionTimer = 0.35;

        // Flash blanc sur l'ensemble du maillage du minion (même si bodyMesh est un THREE.Group)
        if (this.root) {
            const flashed = [];
            this.root.traverse(child => {
                if (child.isMesh && child.material && child.material.emissive) {
                    flashed.push({ mat: child.material, prev: child.material.emissive.getHex() });
                    child.material.emissive.setHex(0xffffff);
                }
            });
            if (flashed.length > 0) {
                setTimeout(() => {
                    flashed.forEach(entry => {
                        if (entry.mat && entry.mat.emissive) entry.mat.emissive.setHex(entry.prev);
                    });
                }, 90);
            }
        }

        if (typeof spawnFloatingPopup === 'function') {
            spawnFloatingPopup(this.x, `-${Math.round(finalDmg)}`, '#ef4444');
        }
        if (typeof spawn3DBloodAndBones === 'function') {
            spawn3DBloodAndBones(this.x, this.y + 1.0, 5, false);
        }
        this.updateHpBarScreenPos();

        if (this.hp <= 0) {
            this.die();
        }
    }

    ensureHpBarEl() {
        if (this.hpBarEl && this.hpBarEl.isConnected) return this.hpBarEl;
        const layer = document.getElementById('campaignMinionHpLayer');
        if (!layer) return null;

        const wrapper = document.createElement('div');
        wrapper.className = 'campaign-minion-hp-bar absolute -translate-x-1/2 -translate-y-full pointer-events-none flex flex-col items-center gap-0.5';
        wrapper.style.left = '-999px';
        wrapper.style.top = '-999px';
        wrapper.innerHTML = `
            <span class="minion-hp-name text-[9px] font-chakra font-black text-amber-200 uppercase tracking-wider bg-black/75 px-1.5 py-0.2 rounded border border-amber-500/40 whitespace-nowrap shadow"></span>
            <div class="w-16 h-2 bg-stone-950/90 border border-stone-600 rounded-full overflow-hidden shadow">
                <div class="minion-hp-fill h-full bg-gradient-to-r from-red-600 via-amber-500 to-emerald-400 transition-all duration-100" style="width:100%"></div>
            </div>
            <span class="minion-hp-val text-[8px] font-chakra font-bold text-stone-200 drop-shadow"></span>
        `;
        const nameEl = wrapper.querySelector('.minion-hp-name');
        if (nameEl) nameEl.textContent = (this.def && (this.def.enemyDisplayName || this.def.name)) ? (this.def.enemyDisplayName || this.def.name) : 'ENNEMI';
        layer.appendChild(wrapper);
        this.hpBarEl = wrapper;
        return wrapper;
    }

    updateHpBarScreenPos() {
        if (this.isDead || !this.root) {
            if (this.hpBarEl) {
                this.hpBarEl.remove();
                this.hpBarEl = null;
            }
            return;
        }
        const el = this.ensureHpBarEl();
        if (!el || typeof battleCamera === 'undefined' || !battleCamera) return;
        const container = document.getElementById('battleScreen');
        const w = container ? container.clientWidth : window.innerWidth;
        const h = container ? container.clientHeight : window.innerHeight;
        if (!w || !h) return;

        const headHeight = ((this.def && this.def.scale) || 0.75) * 1.9 + (this.archetype === 'aerial' ? 0.5 : 0.6);
        const worldPos = new THREE.Vector3(this.x, (this.y || 0) + headHeight, 0);
        worldPos.project(battleCamera);

        if (worldPos.z > 1) {
            el.style.display = 'none';
            return;
        }
        el.style.display = 'flex';
        const sx = (worldPos.x * 0.5 + 0.5) * w;
        const sy = (-worldPos.y * 0.5 + 0.5) * h;
        el.style.left = `${sx.toFixed(1)}px`;
        el.style.top = `${sy.toFixed(1)}px`;

        const pct = Math.max(0, Math.min(100, (this.hp / Math.max(1, this.maxHp)) * 100));
        const fill = el.querySelector('.minion-hp-fill');
        const val = el.querySelector('.minion-hp-val');
        if (fill) fill.style.width = `${pct.toFixed(1)}%`;
        if (val) val.textContent = `${Math.ceil(this.hp)} / ${this.maxHp}`;
    }

    die() {
        if (this.isDead) return;
        this.isDead = true;
        this.hp = 0;
        if (this.hpBarEl) {
            this.hpBarEl.remove();
            this.hpBarEl = null;
        }

        sfx.playHit(true);
        if (typeof spawnHitSparks3D === 'function') {
            spawnHitSparks3D(this.x, this.y + 1.0, true);
        }
        if (typeof spawnFloatingPopup === 'function') {
            spawnFloatingPopup(this.x, '💥 K.O. !', '#f59e0b');
        }

        const dropRoll = Math.random();
        if (dropRoll < 0.45) {
            spawnPrehistoricPickup(this.x, this.y + 0.8, 'meat');
        } else if (dropRoll < 0.65) {
            spawnPrehistoricPickup(this.x, this.y + 0.8, 'amber');
        }

        setTimeout(() => {
            this.destroy();
        }, 120);
    }

    destroy() {
        if (this.hpBarEl) {
            this.hpBarEl.remove();
            this.hpBarEl = null;
        }
        if (this.root && battleScene) {
            battleScene.remove(this.root);
        }
    }

    update(dt, player) {
        if (this.isDead) return;

        this.x += this.vx * dt;
        this.y += this.vy * dt;

        const bounds = typeof getStageBounds3D === 'function' ? getStageBounds3D() : { left: -18, right: 18 };
        this.x = Math.max(bounds.left, Math.min(bounds.right, this.x));

        const groundFloor = typeof getArenaGroundHeight === 'function' ? getArenaGroundHeight(currentArena, this.x, 0) : 0;
        let support = groundFloor;
        const plats = typeof getArenaPlatforms === 'function' ? getArenaPlatforms(currentArena) : [];

        for (const p of plats) {
            if (p.isJumpPad) continue;
            const platY = p.y;
            const fallTolerance = Math.max(0.48, Math.abs(this.vy || 0) * dt * 2.0);
            if (this.x >= p.xMin && this.x <= p.xMax && this.y >= platY - fallTolerance) {
                if (platY > support) support = platY;
            }
        }

        if (this._geyserCd > 0) {
            this._geyserCd -= dt;
        } else if (this.archetype !== 'aerial') {
            for (const p of plats) {
                if (p.isJumpPad && Math.abs(this.x - p.x) < 1.35 && Math.abs(this.y - (p.y || groundFloor)) < 1.4) {
                    this.vy = p.jumpForce || 16.5;
                    this._geyserCd = 0.8;
                    if (typeof spawnBubbleGeyserFx === 'function') spawnBubbleGeyserFx(p.x, p.y || groundFloor);
                    if (typeof sfx !== 'undefined' && sfx.playWhoosh) sfx.playWhoosh();
                    break;
                }
            }
        }

        this.groundY = support;

        if (this.archetype === 'aerial' && this.hitStun <= 0) {
            // Vol stationnaire & piqués aériens
            const hoverTarget = this.groundY + (this.swoopTimer > 0 ? 0.65 : this.floatHeight);
            this.y += (hoverTarget - this.y) * Math.min(1, dt * 4.5);
            this.vy = 0;
            this.isAirborne = true;
            if (this.swoopTimer > 0) this.swoopTimer -= dt;
        } else if (this.y > this.groundY) {
            this.vy -= 28.0 * dt;
            this.isAirborne = true;
        } else {
            this.y = this.groundY;
            this.vy = 0;
            this.isAirborne = false;
        }

        this.vx *= (1.0 - dt * 6.0);

        if (this.hitStun > 0) {
            this.hitStun = Math.max(0, this.hitStun - dt);
            this.syncPosition();
            return;
        }

        if (this.attackCooldown > 0) this.attackCooldown -= dt;
        if (this.rangedCooldown > 0) this.rangedCooldown -= dt;

        // IA spécialisée par archétype (avec poursuite sur plateformes)
        if (player && !player.isDead) {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const dist = Math.abs(dx);
            this.facing = dx >= 0 ? 1 : -1;

            // Poursuite verticale : sauter ou chercher le geyser / plateforme la plus proche si le joueur est en hauteur
            if (dy > 1.75 && !this.isAirborne && this.archetype !== 'aerial') {
                let targetJumpX = player.x;
                let bestScore = Infinity;
                for (const p of plats) {
                    if (p.isJumpPad) {
                        const s = Math.abs(p.x - this.x);
                        if (s < bestScore) {
                            bestScore = s;
                            targetJumpX = p.x;
                        }
                    } else if (p.y > this.y + 0.4 && p.y <= this.y + 5.8) {
                        const cx = (p.xMin + p.xMax) * 0.5;
                        const s = Math.abs(cx - this.x) + 1.5;
                        if (s < bestScore) {
                            bestScore = s;
                            targetJumpX = cx;
                        }
                    }
                }
                const jdx = targetJumpX - this.x;
                if (Math.abs(jdx) > 0.7) {
                    this.x += Math.sign(jdx) * this.speed * 1.1 * dt;
                    this.action = 'walk';
                } else {
                    this.vy = 14.5;
                    this.vx = Math.sign(dx || this.facing) * this.speed * 0.9;
                }
            } else if (this.archetype === 'zoning') {
                // Garde ses distances et tire un projectile
                if (dist > 6.8) {
                    this.x += Math.sign(dx) * this.speed * dt;
                    this.action = 'walk';
                } else if (dist < 3.0) {
                    this.x -= Math.sign(dx) * (this.speed * 0.75) * dt;
                    this.action = 'walk';
                } else {
                    this.action = 'attack';
                    if (this.rangedCooldown <= 0) {
                        this.rangedCooldown = 2.2 + Math.random() * 1.1;
                        this.fireProjectile(player);
                    }
                }
            } else if (this.archetype === 'aerial') {
                if (dist > 1.7) {
                    this.x += Math.sign(dx) * this.speed * dt;
                    this.action = 'walk';
                } else {
                    this.action = 'attack';
                    if (this.attackCooldown <= 0) {
                        this.attackCooldown = 1.4 + Math.random() * 0.7;
                        this.swoopTimer = 0.55;
                        this.performAttack(player);
                    }
                }
            } else {
                // Swarmer / Armored / Brawler
                if (dist > 1.45) {
                    this.x += Math.sign(dx) * this.speed * dt;
                    this.action = 'walk';
                } else {
                    this.action = 'attack';
                    if (this.attackCooldown <= 0) {
                        this.attackCooldown = (this.archetype === 'swarmer' ? 0.85 : 1.15) + Math.random() * 0.6;
                        this.performAttack(player);
                    }
                }
            }
        }

        const now = performance.now();
        if (this.legs && this.legs.length > 0 && this._isGlbHydrated) {
            this.legs.forEach((l, idx) => {
                l.rotation.z = (this.action === 'walk')
                    ? Math.sin(now * 0.016 + idx * 0.8) * 0.42
                    : l.rotation.z * 0.82;
            });
        }
        if (this._isGlbHydrated) {
            if (this.arms && this.arms.length > 0) {
                this.arms.forEach((a, idx) => {
                    a.rotation.z = (this.action === 'attack')
                        ? Math.sin(now * 0.025 + idx) * 0.55
                        : a.rotation.z * 0.82;
                });
            }
            if (this.headMesh) {
                this.headMesh.rotation.z = (this.action === 'attack')
                    ? -Math.abs(Math.sin(now * 0.022)) * 0.35
                    : Math.sin(now * 0.004) * 0.05;
            }
        }
        if (this.wings && this.wings.length > 0) {
            this.wings.forEach(w => {
                w.pivot.rotation.x = Math.sin(now * 0.022 + w.idx) * 0.55 * w.side;
            });
        }
        if (this.segments && this.segments.length > 0) {
            this.segments.forEach((seg, idx) => {
                seg.position.z = Math.sin(now * 0.01 + idx * 0.6) * 0.16;
            });
        }
        if (this.antennules && this.antennules.length > 0) {
            const twitch = Math.sin(now * 0.007) * 0.16;
            this.antennules.forEach((a, i) => {
                a.rotation.y = (i === 0 ? 0.2 : -0.2) + (i === 0 ? twitch : -twitch);
            });
        }
        if (this.swimmingFlaps && this.swimmingFlaps.length > 0 && this._isGlbHydrated) {
            this.swimmingFlaps.forEach(fl => {
                const wave = Math.sin(now * 0.008 + fl.idx * 0.42) * 0.35;
                fl.mesh.rotation.x = fl.side * (0.15 + wave);
            });
        }
        if (this.proboscis) {
            const isAttacking = (this.action === 'attack');
            const probWave = Math.sin(now * 0.005) * 0.18;
            this.proboscis.rotation.z = isAttacking ? -0.42 : probWave;
            if (this.probClaws) {
                const p = isAttacking ? 0.45 : Math.sin(now * 0.01) * 0.12;
                this.probClaws[0].rotation.z = -Math.PI / 3 + p;
                this.probClaws[1].rotation.z = Math.PI / 3 - p;
            }
        }
        if (this.tailFan) {
            this.tailFan.rotation.y = Math.sin(now * 0.004) * 0.14;
        }

        this.syncPosition();
    }

    fireProjectile(player) {
        if (!player || player.isDead) return;
        const dir = player.x >= this.x ? 1 : -1;
        this.facing = dir;
        if (typeof sfx !== 'undefined' && sfx.playWhoosh) sfx.playWhoosh();
        const proj = new CampaignProjectile3D(
            this.x + dir * 0.9,
            this.y + 0.85,
            dir * 10.5,
            0,
            this.def.color || 0x22d3ee,
            38
        );
        campaignActiveProjectiles.push(proj);
    }

    performAttack(player) {
        this.vx = this.facing * 4.5;
        if (typeof sfx !== 'undefined' && sfx.playWhoosh) {
            sfx.playWhoosh();
        }
        setTimeout(() => {
            if (this.isDead || !player || player.isDead) return;
            const dist = Math.abs(player.x - this.x);
            const floorDiff = Math.abs((player.groundY || 0) - (this.groundY || 0));
            const sameHeightBand = Math.abs(player.y - this.y) < 1.65 && (this.archetype === 'aerial' || floorDiff < 2.1);
            if (dist < 1.85 && sameHeightBand) {
                const dmg = (this.archetype === 'armored' ? 58 : 42) + Math.random() * 20;
                applyDamageToPlayer(player, dmg, this.facing * 3.5, 3.0);
                if (typeof sfx !== 'undefined' && sfx.playHit) {
                    sfx.playHit(false);
                }
                if (typeof spawnFloatingPopup === 'function') {
                    spawnFloatingPopup(player.x, `-${Math.round(dmg)}`, '#ef4444');
                }
            }
        }, 140);
    }
}

// 4B. PROJECTILES & DANGERS D'ARÈNE 3D (DIVERSITÉ DE GAMEPLAY)
class CampaignProjectile3D {
    constructor(x, y, vx, vy, color = 0x22d3ee, damage = 35, radius = 0.35) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.damage = damage;
        this.radius = radius;
        this.life = 2.8;
        this.isExpired = false;

        this.root = new THREE.Group();
        const orb = new THREE.Mesh(
            new THREE.SphereGeometry(radius, 8, 8),
            new THREE.MeshStandardMaterial({
                color: color,
                emissive: color,
                emissiveIntensity: 0.7,
                roughness: 0.2
            })
        );
        this.root.add(orb);
        this.root.position.set(x, y, 0);
        if (battleScene) battleScene.add(this.root);
    }

    update(dt, player) {
        if (this.isExpired) return;
        this.life -= dt;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.root.position.set(this.x, this.y, 0);

        if (player && !player.isDead) {
            if (Math.abs(player.x - this.x) < (0.85 + this.radius) && Math.abs((player.y + 0.9) - this.y) < 1.4) {
                applyDamageToPlayer(player, this.damage, Math.sign(this.vx || 1) * 4.0, 2.5);
                if (typeof spawnFloatingPopup === 'function') {
                    spawnFloatingPopup(player.x, `💥 -${Math.round(this.damage)}`, '#f59e0b');
                }
                this.destroy();
                return;
            }
        }

        const bounds = typeof getStageBounds3D === 'function' ? getStageBounds3D() : { left: -20, right: 20 };
        if (this.life <= 0 || this.x < bounds.left - 2 || this.x > bounds.right + 2 || this.y < -1) {
            this.destroy();
        }
    }

    destroy() {
        this.isExpired = true;
        if (this.root && battleScene) battleScene.remove(this.root);
    }
}

class CampaignHazardObject3D {
    constructor(x, kind = 'meteor') {
        this.x = x;
        this.kind = kind; // 'meteor', 'boulder', 'lightning', 'icicle', 'acid'
        this.telegraphTimer = 0.85;
        this.y = kind === 'lightning' ? 0 : 12.0;
        this.vy = kind === 'lightning' ? 0 : -16.5;
        this.isExpired = false;
        this.hasStruck = false;

        this.root = new THREE.Group();
        const colorMap = {
            meteor: 0xf97316,
            boulder: 0x78716c,
            lightning: 0xfacc15,
            icicle: 0x38bdf8,
            acid: 0x22c55e
        };
        const c = colorMap[kind] || 0xef4444;

        // Anneau télégraphe au sol
        const groundY = typeof getArenaGroundHeight === 'function' ? getArenaGroundHeight(currentArena, x, 0) : 0;
        this.groundTargetY = groundY;
        this.marker = new THREE.Mesh(
            new THREE.TorusGeometry(0.95, 0.08, 6, 16),
            new THREE.MeshBasicMaterial({ color: c })
        );
        this.marker.rotation.x = Math.PI / 2;
        this.marker.position.set(x, groundY + 0.1, 0);
        this.root.add(this.marker);

        if (kind === 'lightning') {
            this.bolt = new THREE.Mesh(
                new THREE.CylinderGeometry(0.28, 0.28, 14, 6),
                new THREE.MeshBasicMaterial({ color: 0xfef08a })
            );
            this.bolt.position.set(x, groundY + 7, 0);
            this.bolt.visible = false;
            this.root.add(this.bolt);
        } else {
            this.projectile = new THREE.Group();
            const propIdMap = {
                meteor: 'hazard_meteor',
                boulder: 'hazard_boulder',
                icicle: 'hazard_icicle'
            };
            const propGlbId = propIdMap[kind];
            const propScale = kind === 'icicle' ? 1.0 : 0.92;

            if (kind === 'acid') {
                const orb = new THREE.Mesh(
                    new THREE.SphereGeometry(0.45, 12, 10),
                    new THREE.MeshBasicMaterial({ color: 0x4ade80 })
                );
                this.projectile.add(orb);
            } else if (propGlbId && typeof THREE.GLTFLoader !== 'undefined' && typeof hydrateCampaignPropFromGLB === 'function') {
                if (typeof CAMPAIGN_GLB_CACHE !== 'undefined' && CAMPAIGN_GLB_CACHE[propGlbId]) {
                    hydrateCampaignPropFromGLB(this.projectile, CAMPAIGN_GLB_CACHE[propGlbId], propScale);
                } else if (typeof loadCampaignGLB === 'function') {
                    loadCampaignGLB(propGlbId).then((gltf) => {
                        if (!this.isExpired && this.projectile && !this.projectile._isGlbHydrated) {
                            hydrateCampaignPropFromGLB(this.projectile, gltf, propScale);
                        }
                    }).catch(() => {});
                }
            }
            this.projectile.position.set(x, this.y, 0);
            this.root.add(this.projectile);
        }

        if (battleScene) battleScene.add(this.root);
    }

    update(dt, player) {
        if (this.isExpired) return;
        if (this.telegraphTimer > 0) {
            this.telegraphTimer -= dt;
            if (this.marker) {
                const pulse = 1.0 + Math.sin(performance.now() * 0.025) * 0.2;
                this.marker.scale.set(pulse, pulse, pulse);
            }
            return;
        }

        if (this.kind === 'lightning') {
            if (!this.hasStruck) {
                this.hasStruck = true;
                if (this.bolt) this.bolt.visible = true;
                if (player && !player.isDead && Math.abs(player.x - this.x) < 1.55) {
                    applyDamageToPlayer(player, 55, (player.x >= this.x ? 1 : -1) * 5.0, 5.5);
                    if (typeof spawnFloatingPopup === 'function') spawnFloatingPopup(player.x, '⚡ FOUDRE ! -55', '#facc15');
                }
                setTimeout(() => this.destroy(), 220);
            }
            return;
        }

        this.y += this.vy * dt;
        if (this.projectile) {
            this.projectile.position.set(this.x, this.y, 0);
        }
        if (player && !player.isDead && Math.abs(player.x - this.x) < 1.25 && Math.abs((player.y + 1.0) - this.y) < 1.4) {
            applyDamageToPlayer(player, 50, (player.x >= this.x ? 1 : -1) * 4.5, 4.0);
            if (typeof spawnFloatingPopup === 'function') spawnFloatingPopup(player.x, '☄️ IMPACT ! -50', '#f97316');
            this.destroy();
            return;
        }
        if (this.y <= this.groundTargetY + 0.3) {
            if (typeof spawnHitSparks3D === 'function') spawnHitSparks3D(this.x, this.groundTargetY + 0.3, false);
            this.destroy();
        }
    }

    destroy() {
        this.isExpired = true;
        if (this.root && battleScene) battleScene.remove(this.root);
    }
}

// 5. OBJETS RAMASSABLES 3D (MEAT & AMBER)
class PrehistoricPickup3D {
    constructor(x, y, type = 'meat') {
        this.x = x;
        this.y = y;
        this.type = type; // 'meat' (+250 HP) ou 'amber' (Rage MAX)
        this.vy = 4.0;
        this.groundY = 0;
        this.isCollected = false;
        this.rotationSpeed = 2.5;

        this.root = new THREE.Group();
        this.root.position.set(x, y, 0);

        const pickupGlbId = (type === 'meat') ? 'pickup_meat' : 'pickup_amber';
        const pickupScale = (type === 'meat') ? 0.78 : 0.62;
        if (typeof THREE.GLTFLoader !== 'undefined' && typeof hydrateCampaignPropFromGLB === 'function') {
            if (typeof CAMPAIGN_GLB_CACHE !== 'undefined' && CAMPAIGN_GLB_CACHE[pickupGlbId]) {
                hydrateCampaignPropFromGLB(this.root, CAMPAIGN_GLB_CACHE[pickupGlbId], pickupScale);
            } else if (typeof loadCampaignGLB === 'function') {
                loadCampaignGLB(pickupGlbId).then((gltf) => {
                    if (!this.isCollected && this.root && !this.root._isGlbHydrated) {
                        hydrateCampaignPropFromGLB(this.root, gltf, pickupScale);
                    }
                }).catch(() => {});
            }
        }

        if (battleScene) {
            battleScene.add(this.root);
        }
    }

    update(dt, player) {
        if (this.isCollected) return;

        const groundFloor = typeof getArenaGroundHeight === 'function' ? getArenaGroundHeight(currentArena, this.x, 0) : 0;
        let support = groundFloor;
        const plats = typeof getArenaPlatforms === 'function' ? getArenaPlatforms(currentArena) : [];
        for (const p of plats) {
            if (!p.isJumpPad && this.x >= p.xMin && this.x <= p.xMax && this.y >= p.y - 0.45) {
                if (p.y > support) support = p.y;
            }
        }
        this.groundY = support;

        // Gravité et rebond au sol / sur plateforme
        if (this.y > this.groundY + 0.3) {
            this.vy -= 18.0 * dt;
            this.y += this.vy * dt;
        } else {
            this.y = this.groundY + 0.3;
            this.vy = 0;
        }

        // Rotation continue
        this.root.rotation.y += this.rotationSpeed * dt;
        this.root.position.set(this.x, this.y + Math.sin(performance.now() * 0.005) * 0.12, 0);

        // Ramassage par le joueur
        if (player && !player.isDead) {
            const dist = Math.abs(player.x - this.x);
            if (dist < 1.2 && Math.abs(player.y - this.y) < 1.6) {
                this.collect(player);
            }
        }
    }

    collect(player) {
        if (this.isCollected) return;
        this.isCollected = true;
        sfx.playGong();

        if (this.type === 'meat') {
            const heal = 250;
            player.hp = Math.min(player.maxHp, player.hp + heal);
            if (typeof updateBattleHUD === 'function') updateBattleHUD();
            if (typeof spawnFloatingPopup === 'function') {
                spawnFloatingPopup(player.x, `🥩 +${heal} PV RESTAURÉS !`, '#22c55e');
            }
        } else {
            player.rage = 100;
            if (typeof updateBattleHUD === 'function') updateBattleHUD();
            if (typeof spawnFloatingPopup === 'function') {
                spawnFloatingPopup(player.x, '⭐ RAGE MAX ATTEINTE !', '#f59e0b');
            }
        }

        if (typeof spawnHitSparks3D === 'function') {
            spawnHitSparks3D(this.x, this.y, true);
        }

        this.destroy();
    }

    destroy() {
        if (this.root && battleScene) {
            battleScene.remove(this.root);
        }
    }
}

function spawnPrehistoricPickup(x, y, type) {
    const p = new PrehistoricPickup3D(x, y, type);
    campaignActivePickups.push(p);
}

function cleanupCampaignTransientEntities() {
    campaignActiveMinions.forEach(m => m.destroy());
    campaignActiveMinions = [];
    campaignActivePickups.forEach(p => p.destroy());
    campaignActivePickups = [];
    campaignActiveProjectiles.forEach(pr => pr.destroy());
    campaignActiveProjectiles = [];
    campaignActiveHazards.forEach(hz => hz.destroy());
    campaignActiveHazards = [];
    if (campaignSunbeamMesh && battleScene) {
        battleScene.remove(campaignSunbeamMesh);
    }
    campaignSunbeamMesh = null;
    const hpLayer = document.getElementById('campaignMinionHpLayer');
    if (hpLayer) hpLayer.innerHTML = '';
}

// 6. INITIALISATION ET DÉROULEMENT D'UN NIVEAU D'ÈRE SMASH MELEE
function startCampaignEraLevel(era, customP1Dino = null) {
    activeCampaignEra = era;
    currentCampaignWaveIdx = 0;
    campaignPlayerStocks = 3;
    campaignLevelScore = 0;
    campaignComboCount = 0;
    campaignBossPhase = 1;
    campaignHazardTimer = 4.0;
    campaignHazardActiveDir = 0;
    campaignHazardActiveTimer = 0;
    campaignHazardTickTimer = 0;
    campaignCurrentTideHigh = false;
    cleanupCampaignTransientEntities();

    // Définir le mode campagne et l'arène thématique
    gameMode = 'campaign';
    currentArena = era.arenaId || 'swamp';
    aiDifficulty = 'easy';

    // Démarrer la scène 3D Three.js
    sfx.init();
    sfx.playGong();
    initBattle3DScene();
    buildArena3D(currentArena);

    // Initialiser le combattant du joueur (P1)
    const p1Dino = customP1Dino || DINO_ROSTER[p1ChoiceIndex] || DINO_ROSTER[0];
    if (fighter1) fighter1.destroy();
    if (fighter2) fighter2.destroy();

    fighter1 = new Fighter3D(p1Dino, true, p1SkinIndex);
    fighter1.x = (currentArena === 'cambrian' || (era && era.slug === 'cambrian')) ? -16.0 : -6.0;
    fighter1.y = 0;
    fighter1.groundY = 0;
    fighter1.facing = 1;
    fighter1.gravityScale = (era.hazard && era.hazard.id === 'low_gravity') ? 0.78 : 1.0;

    // Zone visuelle de rayon solaire pour le Permien
    if (era.hazard && era.hazard.id === 'sunbeams' && battleScene) {
        const beamGeo = new THREE.CylinderGeometry(1.8, 2.2, 12, 12);
        const beamMat = new THREE.MeshBasicMaterial({ color: 0xfef08a, transparent: true, opacity: 0.22 });
        campaignSunbeamMesh = new THREE.Mesh(beamGeo, beamMat);
        campaignSunbeamMesh.position.set(0, 6, 0);
        battleScene.add(campaignSunbeamMesh);
    }

    // Pas de fighter2 classique durant les vagues de minions
    fighter2 = null;
    campaignBossFighter = null;

    // Masquer les autres menus et basculer sur l'écran de combat
    matchState = 'campaign_level';
    isMatchPaused = false;

    if (typeof closeCampaignMap === 'function') closeCampaignMap();
    const mmScreen = document.getElementById('mainMenu');
    if (mmScreen) mmScreen.classList.add('hidden');
    const csScreen = document.getElementById('campaignScreen');
    if (csScreen) csScreen.classList.add('hidden');
    const slScreen = document.getElementById('selectScreen');
    if (slScreen) slScreen.classList.add('hidden');
    const arScreen = document.getElementById('arenaScreen');
    if (arScreen) arScreen.classList.add('hidden');
    const pmmMenu = document.getElementById('postMatchMenu');
    if (pmmMenu) pmmMenu.classList.add('hidden');

    const btScreen = document.getElementById('battleScreen');
    if (btScreen) {
        btScreen.classList.remove('hidden');
        btScreen.classList.add('flex');
    }

    // Masquer le HUD 1v1 classique pendant les niveaux Smash Melee
    const duelHud = document.getElementById('duelTopHudOverlay');
    if (duelHud) {
        if (duelHud.classList) duelHud.classList.add('hidden');
        if (duelHud.style) duelHud.style.display = 'none';
    }
    if (typeof clearAnnouncer === 'function') clearAnnouncer();

    // Afficher le HUD Smash Melee complet
    mountCampaignSmashHUD(era);

    // Lancer la vague 1
    startCampaignWave(0);
}

function spawnMinionFromWaveDef(def, spawnX, groundY) {
    const minionGroundY = typeof getArenaGroundHeight === 'function' ? getArenaGroundHeight(currentArena, spawnX, 0) : groundY;
    const minion = new EraMinion3D(def, spawnX, minionGroundY);
    campaignActiveMinions.push(minion);
    return minion;
}

function startCampaignWave(waveIdx) {
    if (!activeCampaignEra) return;
    currentCampaignWaveIdx = waveIdx;
    const wave = activeCampaignEra.waves[waveIdx];
    if (!wave) return;

    // Nettoyer les précédents minions & projectiles résiduels
    campaignActiveMinions.forEach(m => m.destroy());
    campaignActiveMinions = [];
    campaignActiveProjectiles.forEach(pr => pr.destroy());
    campaignActiveProjectiles = [];

    campaignWaveObjective = wave.objective || 'clear';
    campaignWaveDuration = wave.duration || 0;
    campaignWaveTimer = wave.duration || 0;
    campaignSurviveRespawnTimer = 0;
    campaignTimeAttackBonusAwarded = false;

    // Annonce Smash Melee de début de vague
    campaignWaveBannerTimer = 3.2;
    campaignWaveAnnounceTitle = `VAGUE ${wave.waveNum} / 3 : ${wave.name}`;
    if (wave.isBoss) {
        campaignWaveAnnounceSub = `ALERTE : BOSS APEX ${wave.bossName}`;
    } else if (campaignWaveObjective === 'survive') {
        campaignWaveAnnounceSub = `OBJECTIF : SURVIVEZ PENDANT ${campaignWaveDuration} SECONDES !`;
    } else if (campaignWaveObjective === 'time_attack') {
        campaignWaveAnnounceSub = `OBJECTIF CHRONO : ÉLIMINEZ AVANT ${campaignWaveDuration}s POUR BONUS !`;
    } else if (wave.members) {
        campaignWaveAnnounceSub = `ALERTE : DUO TAG-TEAM COORDONNÉ !`;
    } else {
        campaignWaveAnnounceSub = `ÉLIMINEZ LES ADVERSAIRES DE L'ÈRE !`;
    }
    sfx.playGong();

    if (wave.isBoss) {
        // VAGUE 3 : APEX BOSS MONSTER !
        campaignBossPhase = 1;
        spawnEraBossMonster(wave);
    } else if (Array.isArray(wave.members) && wave.members.length > 0) {
        // VAGUE DUO / MIXTE (Tag-Team)
        const groundY = typeof getArenaGroundHeight === 'function' ? getArenaGroundHeight(currentArena, 0, 0) : 0;
        wave.members.forEach((memberDef, i) => {
            const spawnX = i % 2 === 0 ? (3.5 + i * 2.0) : -(3.5 + i * 2.0);
            spawnMinionFromWaveDef(memberDef, spawnX, groundY);
        });
    } else {
        // VAGUES 1 & 2 : ESSAIMS DE MINIONS
        const count = wave.count || 3;
        const groundY = typeof getArenaGroundHeight === 'function' ? getArenaGroundHeight(currentArena, 0, 0) : 0;
        const isCambrianStage = (currentArena === 'cambrian' || (activeCampaignEra && activeCampaignEra.slug === 'cambrian'));
        for (let i = 0; i < count; i++) {
            let spawnX = 2.5 + i * 2.8;
            if (isCambrianStage) {
                if (wave.waveNum === 1) {
                    const cW1 = [-16.0, 3.5, 17.0, 9.5];
                    spawnX = cW1[i % cW1.length];
                } else {
                    const cW2 = [-13.5, 13.5];
                    spawnX = cW2[i % cW2.length];
                }
            }
            spawnMinionFromWaveDef(wave, spawnX, groundY);
        }
    }

    updateCampaignSmashHUD();
}

function buildAnomalocarisBossModel(fighter) {
    if (!fighter || !fighter.rig || !fighter.rig.root) return;
    if (fighter.rig.hips) fighter.rig.hips.visible = true;
    fighter._isAnomalocaris = true;
    fighter.bodyRadius = 1.95;
    fighter._anomModel = {
        root: fighter.rig.root
    };
}

function updateAnomalocarisBossAnimations(boss, dt, nowSec) {
    if (!boss || !boss._isAnomalocaris) return;
    const time = nowSec;

    // Flottaison marine primordiale au-dessus du sol
    const targetGroundY = boss.groundY || 0;
    const floatY = targetGroundY + 0.45 + Math.sin(time * 2.8) * 0.22;
    if (boss.y < floatY) {
        boss.y += (floatY - boss.y) * 0.12;
        boss.vy = 0;
    }
}

function spawnEraBossMonster(bossWave) {
    // Trouver le combattant de base ou boss dragon
    let baseDino = DINO_ROSTER.find(d => d.id === bossWave.baseDino) || DINO_ROSTER[0];
    if (bossWave.baseDino === 'dragon' && typeof DRAGON_BOSS !== 'undefined' && DRAGON_BOSS) {
        baseDino = DRAGON_BOSS;
    }

    // Créer une copie personnalisée du boss avec des PV équilibrés et épiques
    const scaledMaxHp = Math.max(1250, Math.round((bossWave.hp || 2400) * 0.65));
    const hasCustomBossGlb = (typeof CAMPAIGN_BOSS_GLB_IDS !== 'undefined')
        ? CAMPAIGN_BOSS_GLB_IDS.has(bossWave.bossId)
        : ['boss_cameroceras', 'boss_jaekelopterus', 'boss_dunkleosteus', 'boss_dimetrodon', 'boss_pyroclast', 'boss_wendigo'].includes(bossWave.bossId);

    const customBossDino = Object.assign({}, baseDino, {
        name: bossWave.bossName,
        fullName: bossWave.bossTitle,
        maxHp: scaledMaxHp,
        isBoss: true,
        bossGlbId: hasCustomBossGlb ? bossWave.bossId : null,
        primaryColor: bossWave.color,
        accentColor: bossWave.accentColor || 0xf59e0b
    });

    fighter2 = new Fighter3D(customBossDino, false, 0);
    fighter2.x = (currentArena === 'cambrian' || (activeCampaignEra && activeCampaignEra.slug === 'cambrian')) ? 12.0 : 6.2;
    fighter2.groundY = 0;
    fighter2.y = 0;
    fighter2.facing = -1;
    fighter2.scale = bossWave.scale || 1.5;
    if (fighter2.rig && fighter2.rig.root) {
        fighter2.rig.root.scale.set(fighter2.scale, fighter2.scale, fighter2.scale);
    }

    if (bossWave.bossId === 'boss_anomalocaris') {
        buildAnomalocarisBossModel(fighter2, bossWave);
    }

    campaignBossFighter = fighter2;

    // Afficher la Colossale barre de vie du Boss
    showBossHealthBarUI(bossWave);
    updateCampaignSmashHUD();
}

// 7. GESTION DU HUD SMASH MELEE (STOCKS, VAGUES, PV JOUEUR, MINIONS, BARRE DE BOSS)
function mountCampaignSmashHUD(era) {
    let existing = document.getElementById('campaignSmashHUD');
    if (existing) existing.remove();

    const hazardName = era.hazard ? era.hazard.name : 'Combat Standard';
    const p1Name = (fighter1 && fighter1.dino) ? fighter1.dino.name : 'COMBATTANT';
    const p1MaxHp = (fighter1 && fighter1.maxHp) ? fighter1.maxHp : 1050;

    const hudHtml = `
        <div id="campaignSmashHUD" class="absolute inset-0 pointer-events-none z-30 flex flex-col justify-between p-3 select-none">
            <!-- Couche des barres de PV flottantes des ennemis / minions -->
            <div id="campaignMinionHpLayer" class="absolute inset-0 pointer-events-none overflow-hidden z-20"></div>

            <!-- Top Container (Player HP + Era info + Banner + Stocks + Boss Bar) -->
            <div class="w-full flex flex-col items-center gap-2 relative z-30">
                <!-- Top Smash Era Bar -->
                <div class="w-full flex items-start justify-between gap-2">
                    <!-- Left: Player HP Bar & Era Info -->
                    <div class="flex flex-col gap-1.5">
                        <!-- P1 Player Health & Rage Card -->
                        <div class="flex flex-col gap-1 bg-stone-950/90 border-2 border-sky-500/75 rounded-2xl p-2 px-3.5 shadow-2xl backdrop-blur-sm min-w-[230px] sm:min-w-[290px]">
                            <div class="flex items-center justify-between gap-2">
                                <span id="smashP1Name" class="font-cinzel font-black text-sky-300 text-xs sm:text-sm uppercase tracking-wider">${p1Name}</span>
                                <span id="smashP1HpText" class="font-chakra font-black text-xs text-emerald-300">${p1MaxHp} / ${p1MaxHp} PV</span>
                            </div>
                            <div class="w-full h-3.5 bg-stone-900 rounded-full border border-stone-700 overflow-hidden relative">
                                <div id="smashP1HpBar" class="h-full bg-gradient-to-r from-emerald-600 via-emerald-400 to-lime-300 rounded-full transition-all duration-150" style="width: 100%;"></div>
                            </div>
                            <div class="flex items-center gap-2">
                                <div class="flex-1 h-1.5 bg-stone-900 rounded-full overflow-hidden border border-stone-800">
                                    <div id="smashP1RageBar" class="h-full bg-gradient-to-r from-cyan-500 via-amber-400 to-red-500 transition-all duration-150" style="width: 0%;"></div>
                                </div>
                                <span id="smashP1RageBadge" class="font-chakra font-black text-[9px] text-cyan-300 uppercase">RAGE 0%</span>
                            </div>
                        </div>

                        <!-- Era Badge -->
                        <div class="flex items-center gap-2.5 bg-stone-950/85 border border-amber-500/60 rounded-2xl p-1.5 px-3 shadow-xl backdrop-blur-sm">
                            <img src="${era.logo}" alt="${era.name}" class="w-9 h-9 object-contain filter drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]">
                            <div class="flex flex-col">
                                <span class="font-cinzel font-black text-amber-200 text-xs tracking-wider leading-tight">${era.name}</span>
                                <div class="flex items-center gap-2">
                                    <span id="smashHudWaveIndicator" class="font-chakra font-bold text-[11px] text-amber-400/90 tracking-widest uppercase">VAGUE 1 / 3</span>
                                    <span id="smashHudObjectiveTimer" class="hidden font-chakra font-black text-[11px] text-cyan-300 bg-cyan-950/80 border border-cyan-500/60 px-1.5 py-0.2 rounded uppercase"></span>
                                </div>
                                <span id="smashHudHazardBadge" class="font-chakra font-bold text-[10px] text-stone-300 tracking-wide">⚡ ${hazardName}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Center: Wave Announcement Banner -->
                    <div id="smashWaveBanner" class="hidden flex flex-col items-center justify-center bg-gradient-to-r from-red-950/90 via-black/95 to-red-950/90 border-y-2 border-amber-400 py-1.5 px-8 rounded-lg shadow-2xl">
                        <span id="smashWaveBannerTitle" class="font-cinzel font-black text-lg sm:text-2xl text-amber-200 uppercase tracking-widest drop-shadow"></span>
                        <span id="smashWaveBannerSub" class="font-chakra font-bold text-xs text-stone-300 uppercase tracking-wider"></span>
                    </div>

                    <!-- Right: Stocks (Lives) & Score -->
                    <div class="flex items-center gap-4 bg-stone-950/85 border border-amber-500/60 rounded-2xl p-2 px-4 shadow-2xl backdrop-blur-sm">
                        <div class="flex flex-col items-end">
                            <span class="font-chakra text-[10px] text-stone-400 font-bold uppercase tracking-wider">VIES RESTANTES</span>
                            <div id="smashHudStockIcons" class="flex items-center gap-1.5 mt-0.5">
                                <span class="text-xl filter drop-shadow">🦖</span>
                                <span class="text-xl filter drop-shadow">🦖</span>
                                <span class="text-xl filter drop-shadow">🦖</span>
                            </div>
                        </div>
                        <div class="w-px h-8 bg-stone-700"></div>
                        <div class="flex flex-col items-end">
                            <span class="font-chakra text-[10px] text-stone-400 font-bold uppercase tracking-wider">SCORE</span>
                            <span id="smashHudScoreVal" class="font-cinzel font-black text-base text-amber-300 tracking-wider">0</span>
                        </div>
                    </div>
                </div>

                <!-- Colossal Boss Health Bar (Center-Top, directly under top bar) -->
                <div id="colossalBossBarContainer" class="hidden w-full max-w-2xl mx-auto flex flex-col items-center mt-1 pointer-events-none">
                    <div class="w-full flex items-center justify-between px-3 mb-1">
                        <span id="bossBarName" class="font-cinzel font-black text-sm text-red-300 tracking-wider drop-shadow flex items-center gap-1.5">
                            💀 BOSS APEX
                        </span>
                        <span id="bossBarHpText" class="font-chakra font-black text-xs text-amber-200">2500 / 2500 HP</span>
                    </div>
                    <div class="w-full h-5 bg-stone-950/90 rounded-full border-2 border-red-600/80 overflow-hidden relative shadow-[0_0_25px_rgba(239,68,68,0.7)]">
                        <div id="bossBarFill" class="h-full bg-gradient-to-r from-red-700 via-red-500 to-amber-500 rounded-full transition-all duration-150" style="width: 100%;"></div>
                    </div>
                </div>
            </div>

            <!-- Bottom Spacer / Subtle Footer Controls -->
            <div class="w-full flex justify-between items-end"></div>
        </div>
    `;

    const btScreen = document.getElementById('battleScreen');
    if (btScreen) {
        btScreen.insertAdjacentHTML('beforeend', hudHtml);
    }
    updateCampaignSmashHUD();
}

function showBossHealthBarUI(bossWave) {
    const container = document.getElementById('colossalBossBarContainer');
    if (container) {
        if (container.classList) container.classList.remove('hidden');
        if (container.style) container.style.display = 'flex';
    }
    const nameEl = document.getElementById('bossBarName');
    if (nameEl) nameEl.textContent = `👑 BOSS : ${bossWave.bossName}`;
}

function updateCampaignSmashHUD() {
    // PV et Rage du joueur (visibles dès la Vague 1)
    if (typeof fighter1 !== 'undefined' && fighter1) {
        const hpEl = document.getElementById('smashP1HpBar');
        const hpTxt = document.getElementById('smashP1HpText');
        const rageBar = document.getElementById('smashP1RageBar');
        const rageBadge = document.getElementById('smashP1RageBadge');
        const p1Pct = Math.max(0, Math.min(100, (fighter1.hp / Math.max(1, fighter1.maxHp)) * 100));
        if (hpEl) {
            hpEl.style.width = `${p1Pct.toFixed(1)}%`;
            hpEl.className = p1Pct > 45
                ? 'h-full bg-gradient-to-r from-emerald-600 via-emerald-400 to-lime-300 rounded-full transition-all duration-150'
                : (p1Pct > 22
                    ? 'h-full bg-gradient-to-r from-amber-600 via-amber-400 to-yellow-300 rounded-full transition-all duration-150'
                    : 'h-full bg-gradient-to-r from-red-700 via-red-500 to-orange-400 rounded-full transition-all duration-150 animate-pulse');
        }
        if (hpTxt) hpTxt.textContent = `${Math.max(0, Math.round(fighter1.hp))} / ${fighter1.maxHp} PV`;
        const rageVal = Math.max(0, Math.min(100, fighter1.rage || 0));
        if (rageBar) rageBar.style.width = `${rageVal.toFixed(1)}%`;
        if (rageBadge) {
            rageBadge.textContent = rageVal >= 100 ? '💀 X-RAY PRÊT !' : `RAGE ${Math.floor(rageVal)}%`;
            rageBadge.className = rageVal >= 100
                ? 'font-chakra font-black text-[9px] text-amber-300 uppercase animate-pulse'
                : 'font-chakra font-black text-[9px] text-cyan-300 uppercase';
        }
    }

    // Vague
    const waveInd = document.getElementById('smashHudWaveIndicator');
    if (waveInd && activeCampaignEra) {
        waveInd.textContent = `VAGUE ${currentCampaignWaveIdx + 1} / 3`;
    }

    // Chronomètre d'objectif (Survie / Time Attack)
    const objTimerEl = document.getElementById('smashHudObjectiveTimer');
    if (objTimerEl) {
        if ((campaignWaveObjective === 'survive' || campaignWaveObjective === 'time_attack') && currentCampaignWaveIdx < 2) {
            if (objTimerEl.classList) objTimerEl.classList.remove('hidden');
            const sec = Math.max(0, Math.ceil(campaignWaveTimer));
            objTimerEl.textContent = campaignWaveObjective === 'survive' ? `⏱️ SURVIE : ${sec}s` : `⚡ CHRONO : ${sec}s`;
        } else {
            if (objTimerEl.classList) objTimerEl.classList.add('hidden');
        }
    }

    // Stocks
    const stockContainer = document.getElementById('smashHudStockIcons');
    if (stockContainer) {
        let iconsHtml = '';
        for (let i = 0; i < campaignPlayerStocks; i++) {
            iconsHtml += '<span class="text-xl filter drop-shadow">🦖</span>';
        }
        stockContainer.innerHTML = iconsHtml || '<span class="text-xs text-red-500 font-bold uppercase">DERNIÈRE VIE !</span>';
    }

    // Score
    const scoreEl = document.getElementById('smashHudScoreVal');
    if (scoreEl) {
        scoreEl.textContent = campaignLevelScore.toLocaleString();
    }

    // Barre de boss
    if (campaignBossFighter && !campaignBossFighter.isDead) {
        const fill = document.getElementById('bossBarFill');
        const text = document.getElementById('bossBarHpText');
        const pct = Math.max(0, Math.min(100, (campaignBossFighter.hp / Math.max(1, campaignBossFighter.maxHp)) * 100));
        if (fill) fill.style.width = `${pct}%`;
        if (text) text.textContent = `${Math.max(0, Math.round(campaignBossFighter.hp))} / ${campaignBossFighter.maxHp} HP`;
    }
}

function updateCampaignHazard(dt, nowSec) {
    if (!activeCampaignEra || !activeCampaignEra.hazard || !fighter1 || fighter1.isDead) return;
    let hazardId = activeCampaignEra.hazard.id;

    // Faille Temporelle (Ère 13) : change dynamiquement selon la phase de Drak'Zul
    if (hazardId === 'reality_rift') {
        if (campaignBossPhase === 2) hazardId = 'blizzard';
        else if (campaignBossPhase >= 3) hazardId = 'meteor_rain';
        else hazardId = 'meteor_rain';
    }

    // Gravité adaptative (Cambrien / Marée Silurienne)
    if (hazardId === 'low_gravity') {
        fighter1.gravityScale = 0.78;
    } else if (hazardId === 'tidal_surge') {
        campaignHazardTimer -= dt;
        if (campaignHazardTimer <= 0) {
            campaignHazardTimer = 16.0;
            campaignCurrentTideHigh = !campaignCurrentTideHigh;
            fighter1.gravityScale = campaignCurrentTideHigh ? 0.72 : 1.0;
            if (typeof spawnFloatingPopup === 'function') {
                spawnFloatingPopup(fighter1.x, campaignCurrentTideHigh ? '🌊 MARÉE HAUTE !' : '🏖️ MARÉE BASSE !', '#2dd4bf');
            }
        }
    } else if (hazardId === 'deep_pressure') {
        fighter1.gravityScale = fighter1.y < 1.0 ? 1.15 : 0.92;
    } else {
        fighter1.gravityScale = 1.0;
    }

    // Courants Abyssaux / Rafales / Crue / Blizzard (poussées horizontales périodiques)
    if (hazardId === 'abyssal_currents' || hazardId === 'wind_gusts' || hazardId === 'flash_flood') {
        if (campaignHazardActiveTimer > 0) {
            campaignHazardActiveTimer -= dt;
            const force = hazardId === 'flash_flood' && fighter1.y > 1.2 ? 0 : 6.8;
            fighter1.x += campaignHazardActiveDir * force * dt;
        } else {
            campaignHazardTimer -= dt;
            if (campaignHazardTimer <= 0) {
                campaignHazardTimer = 10.5;
                campaignHazardActiveTimer = 2.4;
                campaignHazardActiveDir = Math.random() < 0.5 ? -1 : 1;
                const label = hazardId === 'abyssal_currents' ? '🌊 COURANT ABYSSAL !' : (hazardId === 'flash_flood' ? '🌊 CRUE SUBITE !' : '💨 RAFALE TROPICALE !');
                if (typeof spawnFloatingPopup === 'function') spawnFloatingPopup(fighter1.x, label, '#38bdf8');
            }
        }
    }

    // Brume Toxique & Hyper-Oxygène (Carbonifère)
    if (hazardId === 'toxic_mist') {
        fighter1.rage = Math.min(100, (fighter1.rage || 0) + 4.5 * dt);
        if (fighter1.y < 0.35) {
            campaignHazardTickTimer += dt;
            if (campaignHazardTickTimer >= 2.8) {
                campaignHazardTickTimer = 0;
                applyDamageToPlayer(fighter1, 16, 0, 0);
                if (typeof spawnFloatingPopup === 'function') spawnFloatingPopup(fighter1.x, '☠️ BRUME TOXIQUE -16', '#a855f7');
            }
        }
    }

    // Rayons Solaires (Permien)
    if (hazardId === 'sunbeams') {
        campaignSunbeamX = Math.sin(nowSec * 0.45) * 7.5;
        if (campaignSunbeamMesh) campaignSunbeamMesh.position.x = campaignSunbeamX;
        if (Math.abs(fighter1.x - campaignSunbeamX) < 2.2) {
            fighter1.rage = Math.min(100, (fighter1.rage || 0) + 6.0 * dt);
        }
    }

    // Dangers tombants / Foudre télégraphiés (Trias, Jurassique, Crétacé, Quaternaire, Extinction)
    if (hazardId === 'lightning' || hazardId === 'falling_boulders' || hazardId === 'meteor_rain' || hazardId === 'blizzard') {
        campaignHazardTimer -= dt;
        if (campaignHazardTimer <= 0) {
            const baseInterval = (campaignBossPhase >= 2) ? 4.2 : 6.5;
            campaignHazardTimer = baseInterval;
            const kindMap = {
                lightning: 'lightning',
                falling_boulders: 'boulder',
                meteor_rain: 'meteor',
                blizzard: 'icicle'
            };
            const targetX = fighter1.x + (Math.random() - 0.5) * 3.5;
            campaignActiveHazards.push(new CampaignHazardObject3D(targetX, kindMap[hazardId]));
        }
        if (hazardId === 'blizzard') {
            fighter1.vx *= 1.015; // Glisse légère sur glace
        }
    }
}

function updateCampaignBossPhases(boss, era) {
    if (!boss || boss.isDead || !era) return;
    const hpRatio = boss.hp / Math.max(1, boss.maxHp);

    if (era.slug === 'extinction') {
        if (campaignBossPhase === 1 && hpRatio <= 0.66) {
            campaignBossPhase = 2;
            boss.speed = (boss.speed || 8.0) * 1.12;
            campaignWaveBannerTimer = 2.6;
            campaignWaveAnnounceTitle = '❄️ PHASE 2 : FAILLE GLACIAIRE !';
            campaignWaveAnnounceSub = 'Drak\'Zul déchaîne les stalactites du Blizzard !';
            if (typeof sfx !== 'undefined' && sfx.playRoar) sfx.playRoar();
            if (typeof spawnFloatingPopup === 'function') spawnFloatingPopup(boss.x, '❄️ PHASE 2 : GLACE !', '#38bdf8');
        } else if (campaignBossPhase === 2 && hpRatio <= 0.33) {
            campaignBossPhase = 3;
            boss.speed = (boss.speed || 8.0) * 1.15;
            campaignWaveBannerTimer = 2.8;
            campaignWaveAnnounceTitle = '🌌 PHASE 3 : CATACLYSME DU NÉANT !';
            campaignWaveAnnounceSub = 'Drak\'Zul entre en surrégime cosmique !';
            if (typeof sfx !== 'undefined' && sfx.playGong) sfx.playGong();
            if (typeof spawnFloatingPopup === 'function') spawnFloatingPopup(boss.x, '🌌 PHASE 3 : NÉANT !', '#e879f9');
        }
    } else if (campaignBossPhase === 1 && hpRatio <= 0.50) {
        campaignBossPhase = 2;
        boss.speed = (boss.speed || 7.0) * 1.18;
        boss._phase2Cooldown = 1.6;
        const bossWave = era.waves[2];
        campaignWaveBannerTimer = 2.5;
        campaignWaveAnnounceTitle = `🔥 PHASE 2 : ${bossWave.bossName} ENRAGÉ !`;
        campaignWaveAnnounceSub = bossWave.phase2Desc || 'Le Boss déchaîne sa pleine puissance !';
        if (typeof sfx !== 'undefined' && sfx.playRoar) sfx.playRoar();
        if (typeof spawnFloatingPopup === 'function') spawnFloatingPopup(boss.x, '🔥 ENRAGE PHASE 2 !', '#f97316');

        const groundY = typeof getArenaGroundHeight === 'function' ? getArenaGroundHeight(currentArena, 0, 0) : 0;
        const dir = fighter1 && fighter1.x >= boss.x ? 1 : -1;

        // Caisse de survie : dépose une viande préhistorique lors de l'enrage Phase 2
        if (typeof spawnPrehistoricPickup === 'function') {
            const pickupX = fighter1 ? (boss.x + fighter1.x) * 0.5 : boss.x;
            spawnPrehistoricPickup(pickupX, groundY + 1.0, 'meat');
        }

        // Mécanique dédiée à chaque Boss d'Ère lors de l'entrée en Phase 2
        if (bossWave.bossId === 'boss_anomalocaris') {
            spawnMinionFromWaveDef(era.waves[0], boss.x - 4.0, groundY);
            spawnMinionFromWaveDef(era.waves[0], boss.x + 4.0, groundY);
        } else if (
            (bossWave.bossId === 'boss_cameroceras' || bossWave.bossId === 'boss_jaekelopterus' || bossWave.bossId === 'boss_kelenken') &&
            campaignActiveMinions.length < 2 &&
            era.waves[0] &&
            !era.waves[0].members
        ) {
            const supportDef = Object.assign({}, era.waves[0], {
                hp: Math.round((era.waves[0].hp || 200) * 0.75)
            });
            spawnMinionFromWaveDef(supportDef, boss.x - dir * 3.8, groundY);
            campaignActiveProjectiles.push(new CampaignProjectile3D(boss.x + dir * 1.5, boss.y + 1.2, dir * 11.5, 0, bossWave.accentColor || 0x38bdf8, 45, 0.55));
        } else {
            // Double salve d'énergie ou danger environnemental immédiat
            campaignActiveProjectiles.push(new CampaignProjectile3D(boss.x + dir * 1.5, boss.y + 1.2, dir * 11.5, 0, bossWave.accentColor || 0xf59e0b, 48, 0.55));
            const targetX = fighter1 ? fighter1.x : 0;
            const hazardMap = {
                boss_pulmonoscorpius: 'acid',
                boss_dimetrodon: 'meteor',
                boss_fasolasuchus: 'lightning',
                boss_brontotitan: 'boulder',
                boss_pyroclast: 'meteor',
                boss_megatherium: 'boulder',
                boss_wendigo: 'icicle'
            };
            const hzKind = hazardMap[bossWave.bossId];
            if (hzKind && typeof CampaignHazardObject3D === 'function') {
                campaignActiveHazards.push(new CampaignHazardObject3D(targetX, hzKind));
            }
        }
    }
}

function updateCampaignBossPhase2Behavior(boss, era, dt) {
    if (!boss || boss.isDead || !era || !era.waves || !era.waves[2]) return;
    if (campaignBossPhase < 2 || !fighter1 || fighter1.isDead) return;

    const bossWave = era.waves[2];
    boss._phase2Cooldown = (boss._phase2Cooldown || 2.2) - dt;
    if (boss._phase2Cooldown > 0) return;

    boss._phase2Cooldown = Math.max(1.9, 3.1 - (era.id || 1) * 0.08);
    const dir = fighter1.x >= boss.x ? 1 : -1;
    const dist = Math.abs(fighter1.x - boss.x);
    const color = bossWave.accentColor || 0xf59e0b;

    if (bossWave.bossId === 'boss_pyroclast' || bossWave.bossId === 'boss_dimetrodon' || bossWave.bossId === 'boss_drakzul') {
        if (typeof CampaignHazardObject3D === 'function' && campaignActiveHazards.length < 3) {
            campaignActiveHazards.push(new CampaignHazardObject3D(fighter1.x, 'meteor'));
        }
        campaignActiveProjectiles.push(new CampaignProjectile3D(boss.x + dir * 1.4, boss.y + 1.3, dir * 10.5, 0.8, color, 42, 0.5));
    } else if (bossWave.bossId === 'boss_wendigo') {
        if (typeof CampaignHazardObject3D === 'function' && campaignActiveHazards.length < 3) {
            campaignActiveHazards.push(new CampaignHazardObject3D(fighter1.x, 'icicle'));
        }
        campaignActiveProjectiles.push(new CampaignProjectile3D(boss.x + dir * 1.4, boss.y + 1.2, dir * 10.0, 0, color, 42, 0.5));
    } else if (bossWave.bossId === 'boss_fasolasuchus' || bossWave.bossId === 'boss_kelenken') {
        if (typeof CampaignHazardObject3D === 'function' && campaignActiveHazards.length < 2) {
            campaignActiveHazards.push(new CampaignHazardObject3D(fighter1.x, 'lightning'));
        }
        campaignActiveProjectiles.push(new CampaignProjectile3D(boss.x + dir * 1.4, boss.y + 1.2, dir * 12.0, 0, color, 40, 0.48));
    } else if (bossWave.bossId === 'boss_brontotitan' || bossWave.bossId === 'boss_megatherium') {
        if (typeof CampaignHazardObject3D === 'function' && campaignActiveHazards.length < 2) {
            campaignActiveHazards.push(new CampaignHazardObject3D(fighter1.x, 'boulder'));
        }
        if (dist > 2.5) {
            campaignActiveProjectiles.push(new CampaignProjectile3D(boss.x + dir * 1.5, boss.y + 1.1, dir * 9.5, 2.2, color, 42, 0.55));
        }
    } else if (bossWave.bossId === 'boss_pulmonoscorpius' || bossWave.bossId === 'boss_cameroceras') {
        if (typeof CampaignHazardObject3D === 'function' && campaignActiveHazards.length < 2) {
            campaignActiveHazards.push(new CampaignHazardObject3D(fighter1.x, 'acid'));
        }
        campaignActiveProjectiles.push(new CampaignProjectile3D(boss.x + dir * 1.4, boss.y + 1.2, dir * 10.5, 0.4, color, 38, 0.5));
    } else {
        // Jaekelopterus, Dunkleosteus, Anomalocaris : barrage aquatique / vortex
        campaignActiveProjectiles.push(new CampaignProjectile3D(boss.x + dir * 1.4, boss.y + 1.2, dir * 11.2, 0, color, 38, 0.5));
    }
}

// 8. BOUCLE DE MISE À JOUR DU NIVEAU CAMPAGNE (APPELÉE DANS MATCH.JS)
function updateCampaignLevelEngine(dt, nowSec) {
    if (matchState !== 'campaign_level') return;

    // Décompte de la bannière d'annonce de vague
    if (campaignWaveBannerTimer > 0) {
        campaignWaveBannerTimer -= dt;
        const banner = document.getElementById('smashWaveBanner');
        if (banner) {
            banner.classList.remove('hidden');
            const titleEl = document.getElementById('smashWaveBannerTitle');
            if (titleEl) titleEl.textContent = campaignWaveAnnounceTitle;
            const subEl = document.getElementById('smashWaveBannerSub');
            if (subEl) subEl.textContent = campaignWaveAnnounceSub;
        }
    } else {
        const banner = document.getElementById('smashWaveBanner');
        if (banner) banner.classList.add('hidden');
    }

    // Dangers d'arène thématiques
    updateCampaignHazard(dt, nowSec || (performance.now() * 0.001));

    // Mise à jour des minions actifs
    for (let i = campaignActiveMinions.length - 1; i >= 0; i--) {
        const minion = campaignActiveMinions[i];
        if (minion.isDead) {
            campaignActiveMinions.splice(i, 1);
            campaignLevelScore += 350;
            updateCampaignSmashHUD();
        } else {
            minion.update(dt, fighter1);
        }
    }

    // Mise à jour des projectiles & dangers 3D
    for (let i = campaignActiveProjectiles.length - 1; i >= 0; i--) {
        const proj = campaignActiveProjectiles[i];
        if (proj.isExpired) {
            campaignActiveProjectiles.splice(i, 1);
        } else {
            proj.update(dt, fighter1);
        }
    }
    for (let i = campaignActiveHazards.length - 1; i >= 0; i--) {
        const hz = campaignActiveHazards[i];
        if (hz.isExpired) {
            campaignActiveHazards.splice(i, 1);
        } else {
            hz.update(dt, fighter1);
        }
    }

    // Mise à jour des objets ramassables 3D
    for (let i = campaignActivePickups.length - 1; i >= 0; i--) {
        const pickup = campaignActivePickups[i];
        if (pickup.isCollected) {
            campaignActivePickups.splice(i, 1);
        } else {
            pickup.update(dt, fighter1);
        }
    }

    // Vérification des collisions d'attaques du joueur contre les minions
    checkPlayerAttacksAgainstMinions();

    // Gestion des vagues 1 & 2 (Clear, Survive, Time Attack)
    if (currentCampaignWaveIdx < 2) {
        const wave = activeCampaignEra ? activeCampaignEra.waves[currentCampaignWaveIdx] : null;
        if (campaignWaveObjective === 'survive') {
            if (campaignWaveTimer > 0) {
                campaignWaveTimer -= dt;
                // Maintenir des swarmers jusqu'à la fin du chrono
                if (wave && campaignActiveMinions.length < (wave.count || 3)) {
                    campaignSurviveRespawnTimer += dt;
                    if (campaignSurviveRespawnTimer >= 1.2) {
                        campaignSurviveRespawnTimer = 0;
                        const spawnX = (Math.random() < 0.5 ? -1 : 1) * (8 + Math.random() * 6);
                        const groundY = typeof getArenaGroundHeight === 'function' ? getArenaGroundHeight(currentArena, spawnX, 0) : 0;
                        spawnMinionFromWaveDef(wave, spawnX, groundY);
                    }
                }
                updateCampaignSmashHUD();
            } else {
                // Survie réussie !
                campaignActiveMinions.forEach(m => m.destroy());
                campaignActiveMinions = [];
                campaignLevelScore += 1000;
                if (typeof spawnFloatingPopup === 'function' && fighter1) {
                    spawnFloatingPopup(fighter1.x, '🛡️ SURVIE RÉUSSIE ! +1000', '#22c55e');
                }
                if (typeof sfx !== 'undefined' && sfx.playGong) sfx.playGong();
                startCampaignWave(currentCampaignWaveIdx + 1);
                return;
            }
        } else {
            if (campaignWaveObjective === 'time_attack' && campaignWaveTimer > 0) {
                campaignWaveTimer = Math.max(0, campaignWaveTimer - dt);
                updateCampaignSmashHUD();
            }
            if (campaignActiveMinions.length === 0 && campaignWaveBannerTimer <= 0) {
                if (campaignWaveObjective === 'time_attack' && campaignWaveTimer > 0 && !campaignTimeAttackBonusAwarded && fighter1) {
                    campaignTimeAttackBonusAwarded = true;
                    campaignLevelScore += 1000;
                    fighter1.hp = Math.min(fighter1.maxHp, fighter1.hp + 250);
                    fighter1.rage = 100;
                    if (typeof spawnFloatingPopup === 'function') {
                        spawnFloatingPopup(fighter1.x, '⚡ BONUS CHRONO ! +250 PV & RAGE MAX', '#facc15');
                    }
                }
                if (typeof sfx !== 'undefined' && sfx.playGong) sfx.playGong();
                startCampaignWave(currentCampaignWaveIdx + 1);
                return;
            }
        }
    }

    // Vague 3 (Boss) : Surveillance du Boss, Phases & Animation Anomalocaris Titan
    if (currentCampaignWaveIdx === 2 && campaignBossFighter) {
        if (campaignBossFighter._isAnomalocaris) {
            updateAnomalocarisBossAnimations(campaignBossFighter, dt, nowSec);
        }
        updateCampaignBossPhases(campaignBossFighter, activeCampaignEra);
        updateCampaignBossPhase2Behavior(campaignBossFighter, activeCampaignEra, dt);
        updateCampaignSmashHUD();

        // Mort du Boss = VICTOIRE DE L'ÈRE !
        if (campaignBossFighter.hp <= 0 || campaignBossFighter.isDead) {
            finishCampaignEraVictory();
            return;
        }
    }

    // Mort du joueur : perte d'un stock ou GameOver
    if (fighter1 && fighter1.hp <= 0 && !fighter1.isDead) {
        handlePlayerStockLoss();
    }
}

function checkPlayerAttacksAgainstMinions() {
    if (!fighter1 || fighter1.isDead || fighter1.actionDuration <= 0) return;
    const a = fighter1.action;
    const isAttacking = a.includes('light') || a.includes('heavy') || a.includes('special') || a === 'anti_air' || a === 'dash_attack' || a.startsWith('attack_') || a === 'strike';
    if (!isAttacking || fighter1.hasHitCurrentAttack) return;

    const progress = fighter1.actionTimer / Math.max(0.01, fighter1.actionDuration);
    if (progress < 0.12) return;

    // Déclencher aussi les effets spéciaux propres au combattant (projectiles, dash, séisme) contre les vagues de minions
    const impl = typeof FIGHTER_IMPLS !== 'undefined' ? FIGHTER_IMPLS[fighter1.dino.id] : null;
    if ((a === 'special' || a === 'special2') && !fighter1._minionSpecialTriggered) {
        fighter1._minionSpecialTriggered = true;
        if (a === 'special2') {
            if (impl && impl.onSpecial2) {
                impl.onSpecial2(fighter1, null, 0, fighter1.dino.stats.pow);
            } else if (typeof spawn3DProjectile === 'function') {
                spawn3DProjectile(fighter1, 'boulder');
            }
        } else if (a === 'special') {
            if (impl && impl.onSpecial && ['dragon', 'anomalocaris', 'cameroceras', 'jaekelopterus', 'dunkleosteus', 'dimetrodon'].includes(fighter1.dino.id)) {
                impl.onSpecial(fighter1, null, 0, fighter1.dino.stats.pow);
            } else {
                fighter1.vx = fighter1.facing * 20;
            }
        }
    }

    const basePow = (fighter1.dino && fighter1.dino.stats && fighter1.dino.stats.pow) || 140;
    let dmg = Math.max(95, Math.round(basePow * 0.78));
    let knockX = fighter1.facing * 6.5;
    let knockY = 4.5;
    let range = ((impl && impl.attackReach) || 3.2);

    if (a.includes('heavy') || a === 'anti_air') {
        dmg = Math.max(165, Math.round(basePow * 1.25));
        knockX = fighter1.facing * 10.5;
        knockY = 6.5;
        range += 0.55;
    } else if (a.includes('special')) {
        dmg = Math.max(220, Math.round(basePow * 1.60));
        knockX = fighter1.facing * 13.5;
        knockY = 8.5;
        range += 0.95;
    }

    // Bonus Rayon Solaire du Permien
    if (activeCampaignEra && activeCampaignEra.hazard && activeCampaignEra.hazard.id === 'sunbeams' && Math.abs(fighter1.x - campaignSunbeamX) < 2.2) {
        dmg = Math.round(dmg * 1.35);
    }

    let hitAny = false;
    campaignActiveMinions.forEach(minion => {
        if (!minion || minion.isDead) return;
        const dx = minion.x - fighter1.x;
        const dist = Math.abs(dx);
        const effRange = range + (minion.radius || 0.75);
        const inFront = (dx * fighter1.facing) >= -0.9;
        const verticalReach = (minion.archetype === 'aerial' || a === 'up_light' || a === 'anti_air' || a.includes('air')) ? 3.8 : 2.3;
        const floorDiff = Math.abs((fighter1.groundY || 0) - (minion.groundY || 0));
        const sameBand = Math.abs(minion.y - fighter1.y) <= verticalReach && (floorDiff < 2.2 || minion.archetype === 'aerial' || Math.abs(fighter1.y - minion.y) <= 2.4);
        if (dist <= effRange && inFront && sameBand) {
            minion.takeDamage(dmg, knockX, knockY, a);
            hitAny = true;
        }
    });

    if (hitAny) {
        fighter1.hasHitCurrentAttack = true;
        fighter1.hasHitConfirmed = true;
        fighter1.rage = Math.min(100, (fighter1.rage || 0) + (a.includes('heavy') ? 9 : 6));
        sfx.playHit(a.includes('heavy') || a.includes('special'));
        campaignComboCount++;
        campaignLevelScore += dmg * 2;
        updateCampaignSmashHUD();
    }
}

function handlePlayerStockLoss() {
    campaignPlayerStocks--;
    updateCampaignSmashHUD();

    if (campaignPlayerStocks > 0) {
        // Respawn Smash Melee du joueur
        sfx.playHit(true);
        if (typeof spawnFloatingPopup === 'function') {
            spawnFloatingPopup(fighter1.x, `💀 VIE PERDUE ! RESTANTES: ${campaignPlayerStocks}`, '#ef4444');
        }
        fighter1.resetForRound();
        fighter1.hp = fighter1.maxHp;
        fighter1.x = -5.0;
        fighter1.y = 3.0; // descendra en douceur
        fighter1.facing = 1;
    } else {
        // Game Over de la campagne
        fighter1.isDead = true;
        sfx.playGong();
        showAnnouncer('DÉFAITE DU NIVEAU', 'Toutes vos vies ont été épuisées...');
        const failedEra = activeCampaignEra;
        setTimeout(() => {
            if (typeof showCampaignGameOverModal === 'function') {
                showCampaignGameOverModal(failedEra);
            } else {
                openCampaignMap();
            }
        }, 2200);
    }
}

// 9. VICTOIRE DE L'ÈRE : DÉBLOCAGE COMBATTANT & ARÈNE ET MODALE DE CÉLÉBRATION
function finishCampaignEraVictory() {
    matchState = 'campaign_victory';
    cleanupCampaignTransientEntities();
    sfx.playGong();
    showAnnouncer('👑 ÈRE CONQUISE !', `${activeCampaignEra.name} A ÉTÉ TERRASSÉE !`);

    // Calcul des étoiles (basé sur les vies restantes) & bonus de score
    const remainingStocks = Math.max(0, typeof campaignPlayerStocks === 'number' ? campaignPlayerStocks : 3);
    const earnedStars = remainingStocks >= 3 ? 3 : (remainingStocks === 2 ? 2 : 1);
    campaignLevelScore += remainingStocks * 500;
    updateCampaignSmashHUD();

    // Sauvegarder la complétion, les étoiles, le record de score et débloquer combattant + arène
    clearEraProgress(activeCampaignEra.id);
    saveEraPerformance(activeCampaignEra.id, earnedStars, campaignLevelScore);

    const conqueredEra = activeCampaignEra;
    setTimeout(() => {
        showEraVictoryRewardsModal(conqueredEra, {
            stars: earnedStars,
            score: campaignLevelScore,
            stocks: remainingStocks
        });
    }, 2400);
}

function showCampaignGameOverModal(era) {
    const targetEra = era || activeCampaignEra;
    const existing = document.getElementById('campaignGameOverModal');
    if (existing) existing.remove();
    const eraTitle = targetEra ? `${targetEra.name} • ${targetEra.subtitle || ''}` : 'NIVEAU CAMPAGNE';
    const reachedWave = Math.min(3, (typeof currentCampaignWaveIdx === 'number' ? currentCampaignWaveIdx : 0) + 1);
    const scoreReached = typeof campaignLevelScore === 'number' ? campaignLevelScore : 0;

    const modalHtml = `
        <div id="campaignGameOverModal" class="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none animate-fade-in">
            <div class="w-full max-w-lg bg-gradient-to-b from-stone-900 to-stone-950 border-2 border-red-600/80 rounded-3xl p-6 sm:p-8 shadow-[0_0_60px_rgba(220,38,38,0.45)] flex flex-col items-center text-center relative overflow-hidden">
                <span class="text-4xl filter drop-shadow">💀</span>
                <h2 class="font-cinzel font-black text-2xl sm:text-3xl text-red-400 uppercase tracking-widest mt-1 drop-shadow">
                    EXTINCTION !
                </h2>
                <div class="font-chakra font-bold text-xs sm:text-sm text-stone-300 tracking-wider uppercase mt-1">
                    ${eraTitle}
                </div>
                <div class="w-full grid grid-cols-2 gap-3 mt-5 bg-stone-950/80 border border-stone-800 rounded-2xl p-3">
                    <div class="flex flex-col">
                        <span class="font-chakra text-[10px] text-stone-400 uppercase font-bold">Vague Atteinte</span>
                        <span class="font-cinzel text-lg font-black text-amber-300">${reachedWave} / 3</span>
                    </div>
                    <div class="flex flex-col">
                        <span class="font-chakra text-[10px] text-stone-400 uppercase font-bold">Score Obtenu</span>
                        <span class="font-cinzel text-lg font-black text-stone-100">${scoreReached.toLocaleString()}</span>
                    </div>
                </div>
                <div class="w-full flex flex-col sm:flex-row gap-3 mt-6">
                    <button id="btnCampaignGameOverRetry" class="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-cinzel font-black text-xs sm:text-sm uppercase tracking-wider border border-amber-200 cursor-pointer">
                        🔄 RÉESSAYER L'ÈRE
                    </button>
                    <button id="btnCampaignGameOverChangeFighter" class="flex-1 py-3 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-200 font-cinzel font-black text-xs sm:text-sm uppercase tracking-wider border border-amber-500/40 cursor-pointer">
                        🦖 COMBATTANT
                    </button>
                </div>
                <button id="btnCampaignGameOverMap" class="mt-3 w-full py-2.5 px-4 rounded-xl bg-stone-950 hover:bg-stone-900 text-stone-300 font-chakra font-bold text-xs uppercase tracking-widest border border-stone-700 cursor-pointer">
                    🗺️ RETOUR À LA CARTE DE CAMPAGNE
                </button>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const closeAll = () => {
        const m = document.getElementById('campaignGameOverModal');
        if (m) m.remove();
        const hud = document.getElementById('campaignSmashHUD');
        if (hud) hud.remove();
    };

    const retryBtn = document.getElementById('btnCampaignGameOverRetry');
    if (retryBtn) {
        retryBtn.addEventListener('click', () => {
            closeAll();
            if (targetEra && typeof startCampaignEraLevel === 'function') {
                const currentDino = (typeof fighter1 !== 'undefined' && fighter1 && fighter1.dino) ? fighter1.dino : null;
                startCampaignEraLevel(targetEra, currentDino);
            } else if (typeof openCampaignMap === 'function') {
                openCampaignMap();
            }
        });
    }

    const changeBtn = document.getElementById('btnCampaignGameOverChangeFighter');
    if (changeBtn) {
        changeBtn.addEventListener('click', () => {
            closeAll();
            if (targetEra && typeof enterSelectedEra === 'function') {
                enterSelectedEra(targetEra);
            } else if (typeof openCampaignMap === 'function') {
                openCampaignMap();
            }
        });
    }

    const mapBtn = document.getElementById('btnCampaignGameOverMap');
    if (mapBtn) {
        mapBtn.addEventListener('click', () => {
            closeAll();
            if (typeof openCampaignMap === 'function') openCampaignMap();
        });
    }
}

function showEraVictoryRewardsModal(era, summary = null) {
    const existing = document.getElementById('eraVictoryModal');
    if (existing) existing.remove();

    const r = era.reward;
    const isNewFighterUnlock = typeof UNLOCKABLE_FIGHTER_ERAS !== 'undefined' && UNLOCKABLE_FIGHTER_ERAS[r.fighterId] === era.id;
    const isNewArenaUnlock = typeof UNLOCKABLE_ARENA_ERAS !== 'undefined' && UNLOCKABLE_ARENA_ERAS[r.arenaId] === era.id;
    const fighterBadge = isNewFighterUnlock ? '🦖 NOUVEAU COMBATTANT DÉBLOQUÉ' : '🏆 MAÎTRE DE L\'ÈRE';
    const arenaBadge = isNewArenaUnlock ? '🌋 NOUVELLE ARÈNE DÉBLOQUÉE' : '🗺️ THÉÂTRE DE VICTOIRE';
    const earnedStars = summary && typeof summary.stars === 'number'
        ? summary.stars
        : (typeof getEraStars === 'function' ? Math.max(1, getEraStars(era.id)) : 3);
    const finalScore = summary && typeof summary.score === 'number'
        ? summary.score
        : (typeof campaignLevelScore === 'number' ? campaignLevelScore : 0);
    const stocksLeft = summary && typeof summary.stocks === 'number'
        ? summary.stocks
        : (typeof campaignPlayerStocks === 'number' ? campaignPlayerStocks : 3);
    const starsDisplay = '⭐'.repeat(earnedStars) + '☆'.repeat(Math.max(0, 3 - earnedStars));
    const nextEra = (typeof CAMPAIGN_ERAS !== 'undefined' && Array.isArray(CAMPAIGN_ERAS))
        ? CAMPAIGN_ERAS.find(e => e.id === era.id + 1)
        : null;
    const canLaunchNext = !!(nextEra && (typeof isEraUnlocked !== 'function' || isEraUnlocked(nextEra.id)));

    const modalHtml = `
        <div id="eraVictoryModal" class="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none animate-fade-in">
            <div class="w-full max-w-2xl bg-gradient-to-b from-stone-900 to-stone-950 border-2 border-amber-500 rounded-3xl p-6 sm:p-8 shadow-[0_0_60px_rgba(245,158,11,0.5)] flex flex-col items-center text-center relative overflow-hidden">
                <!-- Golden Sunburst rays -->
                <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.18)_0%,transparent_70%)] pointer-events-none"></div>

                <span class="text-3xl sm:text-4xl filter drop-shadow">👑</span>
                <h2 class="font-cinzel font-black text-2xl sm:text-4xl text-amber-200 uppercase tracking-widest mt-1 drop-shadow">
                    ÈRE CONQUISE !
                </h2>
                <div class="font-chakra font-bold text-xs sm:text-sm text-amber-400 tracking-wider uppercase mt-1">
                    ${era.name} • ${era.subtitle}
                </div>

                <!-- Performance Bar (Stars / Score / Stocks) -->
                <div class="w-full grid grid-cols-3 gap-2 mt-4 bg-stone-950/85 border border-amber-500/40 rounded-2xl p-3">
                    <div class="flex flex-col items-center">
                        <span class="font-chakra text-[10px] text-stone-400 uppercase font-bold">Évaluation</span>
                        <span class="text-lg sm:text-xl tracking-widest mt-0.5">${starsDisplay}</span>
                    </div>
                    <div class="flex flex-col items-center border-x border-stone-800">
                        <span class="font-chakra text-[10px] text-stone-400 uppercase font-bold">Score Final</span>
                        <span class="font-cinzel text-base sm:text-lg font-black text-amber-300 mt-0.5">${finalScore.toLocaleString()}</span>
                    </div>
                    <div class="flex flex-col items-center">
                        <span class="font-chakra text-[10px] text-stone-400 uppercase font-bold">Vies Restantes</span>
                        <span class="font-cinzel text-base sm:text-lg font-black text-emerald-300 mt-0.5">${stocksLeft} / 3 🦖</span>
                    </div>
                </div>

                <!-- Rewards Grid (Character & Arena) -->
                <div class="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
                    <!-- Reward 1: Unlocked Fighter -->
                    <div class="flex flex-col items-center bg-stone-900/90 border border-amber-500/60 rounded-2xl p-4 shadow-lg">
                        <span class="font-chakra font-black text-[11px] text-amber-400 uppercase tracking-widest mb-2">${fighterBadge}</span>
                        <div class="w-24 h-24 rounded-2xl overflow-hidden border-2 border-amber-400 shadow-md bg-stone-950 mb-2">
                            <img src="${r.fighterPortrait}" alt="${r.fighterName}" class="w-full h-full object-cover">
                        </div>
                        <span class="font-cinzel font-black text-base text-amber-100 uppercase">${r.fighterName}</span>
                        <span class="font-chakra text-xs text-stone-300 font-bold mt-0.5">${r.fighterRole}</span>
                    </div>

                    <!-- Reward 2: Unlocked Arena -->
                    <div class="flex flex-col items-center bg-stone-900/90 border border-amber-500/60 rounded-2xl p-4 shadow-lg">
                        <span class="font-chakra font-black text-[11px] text-amber-400 uppercase tracking-widest mb-2">${arenaBadge}</span>
                        <div class="w-24 h-24 rounded-2xl overflow-hidden border-2 border-amber-400 shadow-md bg-stone-950 mb-2 flex items-center justify-center">
                            <img src="${era.logo}" alt="${r.arenaName}" class="w-16 h-16 object-contain filter contrast-125">
                        </div>
                        <span class="font-cinzel font-black text-base text-amber-100 uppercase">${r.arenaName}</span>
                        <span class="font-chakra text-xs text-stone-300 font-bold mt-0.5 leading-snug">${r.arenaDesc}</span>
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="mt-6 flex flex-col sm:flex-row gap-3 w-full justify-center">
                    ${canLaunchNext ? `
                    <button id="btnEraVictoryNext" class="py-3 px-6 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 hover:from-emerald-500 hover:to-emerald-400 text-stone-950 font-cinzel font-black text-sm uppercase tracking-wider border border-emerald-200 shadow-2xl cursor-pointer">
                        ⚔️ ÈRE SUIVANTE (${nextEra.shortLabel || nextEra.name}) ➔
                    </button>` : ''}
                    <button id="btnEraVictoryContinue" class="py-3 px-8 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-cinzel font-black text-sm uppercase tracking-widest border border-amber-200 shadow-2xl cursor-pointer">
                        CONTINUER SUR LA CARTE DE CAMPAGNE ➔
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const nextBtn = document.getElementById('btnEraVictoryNext');
    if (nextBtn && nextEra) {
        nextBtn.addEventListener('click', () => {
            const m = document.getElementById('eraVictoryModal');
            if (m) m.remove();
            const hud = document.getElementById('campaignSmashHUD');
            if (hud) hud.remove();
            if (typeof startCampaignEraLevel === 'function') {
                const currentDino = (typeof fighter1 !== 'undefined' && fighter1 && fighter1.dino) ? fighter1.dino : null;
                startCampaignEraLevel(nextEra, currentDino);
            } else if (typeof openCampaignMap === 'function') {
                openCampaignMap();
            }
        });
    }

    const btn = document.getElementById('btnEraVictoryContinue');
    if (btn) {
        btn.addEventListener('click', () => {
            const m = document.getElementById('eraVictoryModal');
            if (m) m.remove();
            const hud = document.getElementById('campaignSmashHUD');
            if (hud) hud.remove();
            openCampaignMap();
        });
    }
}

// 10. EXPOSITION GLOBALE
if (typeof window !== 'undefined') {
    window.CAMPAIGN_ERAS = CAMPAIGN_ERAS;
    window.isEraUnlocked = isEraUnlocked;
    window.isEraCleared = isEraCleared;
    window.getEraStars = getEraStars;
    window.getEraHighScore = getEraHighScore;
    window.saveEraPerformance = saveEraPerformance;
    window.clearEraProgress = clearEraProgress;
    window.startCampaignEraLevel = startCampaignEraLevel;
    window.updateCampaignLevelEngine = updateCampaignLevelEngine;
    window.updateCampaignBossPhases = updateCampaignBossPhases;
    window.updateCampaignBossPhase2Behavior = updateCampaignBossPhase2Behavior;
    window.showCampaignGameOverModal = showCampaignGameOverModal;
    window.showEraVictoryRewardsModal = showEraVictoryRewardsModal;
}
