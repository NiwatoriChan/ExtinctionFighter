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

function clearEraProgress(eraId) {
    try {
        localStorage.setItem('ek3d_cleared_era_' + eraId, 'true');
        const nextId = eraId + 1;
        if (nextId <= CAMPAIGN_ERAS.length) {
            localStorage.setItem('ek3d_unlocked_era_' + nextId, 'true');
        }
        // Débloquer la récompense de combattant et d'arène
        const era = CAMPAIGN_ERAS.find(e => e.id === eraId);
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
        const mat = new THREE.MeshStandardMaterial({
            color: this.def.color,
            roughness: 0.55,
            metalness: 0.2
        });
        const darkMat = new THREE.MeshStandardMaterial({
            color: 0x18181b,
            roughness: 0.7
        });
        const glowEyeMat = new THREE.MeshBasicMaterial({ color: 0x67e8f9 });
        const amberMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3 });
        const wingMat = new THREE.MeshStandardMaterial({
            color: 0xa7f3d0,
            roughness: 0.25,
            transparent: true,
            opacity: 0.65
        });

        const t = this.def.enemyType;

        if (t === 'cambrian_trilobite') {
            // === TRILOBITE PRIMORDIAL ===
            const cephGeo = new THREE.CylinderGeometry(0.72, 0.96, 0.28, 10, 1, false, 0, Math.PI);
            cephGeo.rotateZ(-Math.PI / 2);
            cephGeo.rotateY(Math.PI / 2);
            this.bodyMesh = new THREE.Mesh(cephGeo, mat);
            this.bodyMesh.position.set(0.25, 0.35, 0);
            this.bodyMesh.castShadow = true;
            this.root.add(this.bodyMesh);

            const glabellaGeo = new THREE.CylinderGeometry(0.24, 0.28, 0.65, 8);
            glabellaGeo.rotateZ(Math.PI / 2);
            const glabella = new THREE.Mesh(glabellaGeo, darkMat);
            glabella.position.set(0.12, 0.12, 0);
            this.bodyMesh.add(glabella);

            for (let f = 0; f < 3; f++) {
                const furrow = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.44), mat);
                furrow.position.set(0.25 - f * 0.15, 0.22, 0);
                this.bodyMesh.add(furrow);
            }

            [-0.88, 0.88].forEach(z => {
                const spineGeo = new THREE.ConeGeometry(0.07, 1.25, 5);
                spineGeo.rotateZ(Math.PI / 2);
                spineGeo.rotateY(z > 0 ? -0.15 : 0.15);
                const spine = new THREE.Mesh(spineGeo, darkMat);
                spine.position.set(-0.45, -0.02, z);
                this.bodyMesh.add(spine);
            });

            [-0.36, 0.36].forEach(z => {
                const eyeGeo = new THREE.SphereGeometry(0.13, 8, 8);
                eyeGeo.scale(1.2, 0.8, 1.0);
                const eye = new THREE.Mesh(eyeGeo, glowEyeMat);
                eye.position.set(0.20, 0.18, z);
                this.bodyMesh.add(eye);
            });

            this.antennules = [];
            [-0.18, 0.18].forEach((z, i) => {
                const antGroup = new THREE.Group();
                antGroup.position.set(0.68, 0.05, z);
                const antGeo = new THREE.CylinderGeometry(0.02, 0.035, 0.85, 4);
                antGeo.rotateZ(-Math.PI / 3);
                const antMesh = new THREE.Mesh(antGeo, amberMat);
                antMesh.position.set(0.35, 0.12, (i === 0 ? 0.18 : -0.18));
                antGroup.add(antMesh);
                this.bodyMesh.add(antGroup);
                this.antennules.push(antGroup);
            });

            for (let i = 0; i < 7; i++) {
                const segGroup = new THREE.Group();
                segGroup.position.set(-0.16 - i * 0.20, 0, 0);
                const axialGeo = new THREE.CylinderGeometry(0.22 - i * 0.015, 0.22 - i * 0.015, 0.18, 6);
                axialGeo.rotateZ(Math.PI / 2);
                segGroup.add(new THREE.Mesh(axialGeo, darkMat));

                [-1, 1].forEach(side => {
                    const pleuraW = 0.52 - i * 0.04;
                    const pleura = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, pleuraW), i % 2 === 0 ? mat : darkMat);
                    pleura.position.set(0, -0.02, side * (0.22 + pleuraW * 0.5));
                    segGroup.add(pleura);

                    const plSpineGeo = new THREE.ConeGeometry(0.04, 0.32, 4);
                    plSpineGeo.rotateZ(Math.PI / 2);
                    plSpineGeo.rotateY(side * 0.4);
                    const plSpine = new THREE.Mesh(plSpineGeo, darkMat);
                    plSpine.position.set(-0.12, -0.04, side * (0.24 + pleuraW));
                    segGroup.add(plSpine);
                });
                this.bodyMesh.add(segGroup);
            }

            const pygidiumGeo = new THREE.CylinderGeometry(0.48, 0.18, 0.22, 8, 1, false, 0, Math.PI);
            pygidiumGeo.rotateZ(Math.PI / 2);
            pygidiumGeo.rotateY(-Math.PI / 2);
            const pygidium = new THREE.Mesh(pygidiumGeo, darkMat);
            pygidium.position.set(-1.62, -0.02, 0);
            this.bodyMesh.add(pygidium);

            this.legs = [];
            for (let i = 0; i < 7; i++) {
                [-1, 1].forEach(side => {
                    const legRoot = new THREE.Group();
                    legRoot.position.set(0.18 - i * 0.22, -0.16, side * 0.35);
                    const endoGeo = new THREE.CylinderGeometry(0.04, 0.025, 0.46, 5);
                    endoGeo.rotateZ(side * -0.35);
                    const endo = new THREE.Mesh(endoGeo, darkMat);
                    endo.position.set(0, -0.18, side * 0.16);
                    legRoot.add(endo);
                    this.bodyMesh.add(legRoot);
                    this.legs.push(legRoot);
                });
            }
        } else if (t === 'opabinia_radiodont_elite') {
            // === OPABINIA REGALIS (5 YEUX PÉDONCULÉS, TROMPE & LOBES) ===
            const bodyGeo = new THREE.CylinderGeometry(0.32, 0.16, 2.1, 10);
            bodyGeo.rotateZ(Math.PI / 2);
            this.bodyMesh = new THREE.Mesh(bodyGeo, mat);
            this.bodyMesh.position.set(0, 0.55, 0);
            this.bodyMesh.castShadow = true;
            this.root.add(this.bodyMesh);

            const headGeo = new THREE.ConeGeometry(0.34, 0.65, 8);
            headGeo.rotateZ(-Math.PI / 2);
            const head = new THREE.Mesh(headGeo, mat);
            head.position.set(1.15, 0, 0);
            this.bodyMesh.add(head);

            const opabiniaEyes = [
                { x: 1.12, y: 0.32, z: 0, stalkLen: 0.18, bulbR: 0.09 },
                { x: 1.05, y: 0.28, z: 0.24, stalkLen: 0.26, bulbR: 0.11 },
                { x: 1.05, y: 0.28, z: -0.24, stalkLen: 0.26, bulbR: 0.11 },
                { x: 0.88, y: 0.32, z: 0.32, stalkLen: 0.32, bulbR: 0.12 },
                { x: 0.88, y: 0.32, z: -0.32, stalkLen: 0.32, bulbR: 0.12 }
            ];
            opabiniaEyes.forEach(eyeSpec => {
                const stalk = new THREE.Group();
                stalk.position.set(eyeSpec.x, eyeSpec.y, eyeSpec.z);
                const stalkGeo = new THREE.CylinderGeometry(0.03, 0.035, eyeSpec.stalkLen, 5);
                stalkGeo.rotateX(eyeSpec.z > 0 ? -0.35 : (eyeSpec.z < 0 ? 0.35 : 0));
                stalk.add(new THREE.Mesh(stalkGeo, darkMat));
                const eyeBulb = new THREE.Mesh(new THREE.SphereGeometry(eyeSpec.bulbR, 8, 8), glowEyeMat);
                eyeBulb.position.set(0, eyeSpec.stalkLen * 0.9, 0);
                stalk.add(eyeBulb);
                this.bodyMesh.add(stalk);
            });

            const probRoot = new THREE.Group();
            probRoot.position.set(1.35, -0.05, 0);
            let currProb = probRoot;
            for (let s = 0; s < 5; s++) {
                const segNode = new THREE.Group();
                segNode.position.set(s === 0 ? 0 : 0.22, s === 0 ? 0 : (s < 3 ? -0.06 : 0.08), 0);
                segNode.rotation.z = (s < 3 ? -0.15 : 0.25);
                const ringGeo = new THREE.CylinderGeometry(0.09 - s * 0.012, 0.10 - s * 0.012, 0.24, 7);
                ringGeo.rotateZ(Math.PI / 2);
                segNode.add(new THREE.Mesh(ringGeo, s % 2 === 0 ? mat : darkMat));
                currProb.add(segNode);
                currProb = segNode;
            }
            const clawL = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.28, 4), amberMat);
            clawL.position.set(0.24, 0.10, 0.07);
            clawL.rotation.z = -Math.PI / 3;
            currProb.add(clawL);
            const clawR = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.28, 4), amberMat);
            clawR.position.set(0.24, -0.10, -0.07);
            clawR.rotation.z = Math.PI / 3;
            currProb.add(clawR);
            this.proboscis = probRoot;
            this.probClaws = [clawL, clawR];
            this.bodyMesh.add(probRoot);

            this.swimmingFlaps = [];
            for (let i = 0; i < 15; i++) {
                const factor = (i < 5) ? (0.65 + i * 0.12) : (1.25 - (i - 5) * 0.08);
                const flapX = 0.85 - i * 0.18;
                [-1, 1].forEach(side => {
                    const flapGroup = new THREE.Group();
                    flapGroup.position.set(flapX, -0.06, side * (0.28 * factor));
                    const flapMesh = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.035, 0.40 * factor), glowEyeMat);
                    flapMesh.position.z = side * (0.20 * factor);
                    flapGroup.add(flapMesh);
                    this.bodyMesh.add(flapGroup);
                    this.swimmingFlaps.push({ mesh: flapGroup, side, idx: i });
                });
            }

            const tailFanGroup = new THREE.Group();
            tailFanGroup.position.set(-1.15, 0.08, 0);
            tailFanGroup.rotation.z = 0.40;
            for (let f = 0; f < 3; f++) {
                const finGeo = new THREE.BoxGeometry(0.55, 0.035, 0.22);
                finGeo.rotateY((f - 1) * 0.42);
                const fin = new THREE.Mesh(finGeo, darkMat);
                fin.position.set(-0.25, 0.08 + Math.abs(f - 1) * 0.08, (f - 1) * 0.24);
                tailFanGroup.add(fin);
            }
            this.bodyMesh.add(tailFanGroup);
            this.tailFan = tailFanGroup;
            this.legs = [];
        } else if (t === 'orthoceras') {
            // === ORTHOCERAS (COQUILLE CONIQUE + TENTACULES) ===
            const shellGeo = new THREE.ConeGeometry(0.55, 2.6, 10);
            shellGeo.rotateZ(Math.PI / 2);
            this.bodyMesh = new THREE.Mesh(shellGeo, mat);
            this.bodyMesh.position.set(-0.3, 0.85, 0);
            this.bodyMesh.castShadow = true;
            this.root.add(this.bodyMesh);

            for (let r = 0; r < 5; r++) {
                const ring = new THREE.Mesh(new THREE.TorusGeometry(0.45 - r * 0.07, 0.04, 6, 12), darkMat);
                ring.rotation.y = Math.PI / 2;
                ring.position.set(0.65 - r * 0.38, 0, 0);
                this.bodyMesh.add(ring);
            }
            const head = new THREE.Mesh(new THREE.SphereGeometry(0.46, 8, 8), darkMat);
            head.position.set(1.25, 0, 0);
            this.bodyMesh.add(head);

            this.antennules = [];
            for (let tIdx = 0; tIdx < 6; tIdx++) {
                const tent = new THREE.Group();
                tent.position.set(1.55, (tIdx - 2.5) * 0.12, (tIdx % 2 === 0 ? 0.18 : -0.18));
                const tentMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.02, 0.8, 5), amberMat);
                tentMesh.rotation.z = -Math.PI / 2;
                tentMesh.position.x = 0.4;
                tent.add(tentMesh);
                this.bodyMesh.add(tent);
                this.antennules.push(tent);
            }
            this.legs = [];
        } else if (t === 'eurypterid') {
            // === EURYPTÉRIDE / PTERYGOTUS / MEGALOGRAPTUS ===
            const torsoGeo = new THREE.BoxGeometry(1.6, 0.35, 1.0);
            this.bodyMesh = new THREE.Mesh(torsoGeo, mat);
            this.bodyMesh.position.set(0, 0.5, 0);
            this.bodyMesh.castShadow = true;
            this.root.add(this.bodyMesh);

            const shield = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.38, 1.1), darkMat);
            shield.position.set(0.9, 0.05, 0);
            this.bodyMesh.add(shield);

            [-0.45, 0.45].forEach(z => {
                const arm = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.18, 0.2), amberMat);
                arm.position.set(1.45, 0, z);
                this.bodyMesh.add(arm);
                const eye = new THREE.Mesh(new THREE.SphereGeometry(0.11, 6, 6), glowEyeMat);
                eye.position.set(1.1, 0.22, z * 0.7);
                this.bodyMesh.add(eye);
            });

            const tail = new THREE.Mesh(new THREE.ConeGeometry(0.22, 1.4, 5), darkMat);
            tail.rotation.z = Math.PI / 2;
            tail.position.set(-1.45, 0.15, 0);
            this.bodyMesh.add(tail);

            this.legs = [];
            for (let i = 0; i < 6; i++) {
                const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.04, 0.75, 5), darkMat);
                leg.position.set(0.4 - (i % 3) * 0.45, -0.25, i < 3 ? 0.65 : -0.65);
                this.bodyMesh.add(leg);
                this.legs.push(leg);
            }
        } else if (t === 'meganeura' || t === 'bird_pterosaur') {
            // === CRÉATURE AÉRIENNE (MEGANEURA / ARGENTAVIS / VOID QUETZAL) ===
            const bodyLen = t === 'meganeura' ? 2.1 : 1.4;
            const bodyGeo = new THREE.CylinderGeometry(0.22, 0.15, bodyLen, 8);
            bodyGeo.rotateZ(Math.PI / 2);
            this.bodyMesh = new THREE.Mesh(bodyGeo, mat);
            this.bodyMesh.position.set(0, 0.9, 0);
            this.bodyMesh.castShadow = true;
            this.root.add(this.bodyMesh);

            const head = new THREE.Mesh(new THREE.SphereGeometry(0.36, 8, 8), darkMat);
            head.position.set(bodyLen * 0.55, 0.08, 0);
            this.bodyMesh.add(head);

            if (t !== 'meganeura') {
                const beak = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.9, 5), amberMat);
                beak.rotation.z = -Math.PI / 2;
                beak.position.set(0.55, -0.02, 0);
                head.add(beak);
            }

            const wingCount = t === 'meganeura' ? 2 : 1;
            this.wings = [];
            for (let w = 0; w < wingCount; w++) {
                [-1, 1].forEach(side => {
                    const wingPivot = new THREE.Group();
                    wingPivot.position.set(0.3 - w * 0.45, 0.15, side * 0.2);
                    const wingGeo = new THREE.BoxGeometry(0.55, 0.04, 1.85);
                    const wing = new THREE.Mesh(wingGeo, t === 'meganeura' ? wingMat : mat);
                    wing.position.z = side * 0.95;
                    wingPivot.add(wing);
                    this.bodyMesh.add(wingPivot);
                    this.wings.push({ pivot: wingPivot, side, idx: w });
                });
            }
            this.legs = [];
        } else if (t === 'arthropleura' || t === 'serpent') {
            // === CRÉATURE MULTI-SEGMENTÉE (ARTHROPLEURA / TITANOBOA) ===
            const segCount = t === 'serpent' ? 9 : 8;
            this.bodyMesh = new THREE.Mesh(new THREE.SphereGeometry(0.45, 8, 8), mat);
            this.bodyMesh.position.set(0.8, 0.55, 0);
            this.bodyMesh.castShadow = true;
            this.root.add(this.bodyMesh);

            const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.11, 6, 6), glowEyeMat);
            eyeL.position.set(0.32, 0.15, 0.25);
            this.bodyMesh.add(eyeL);
            const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.11, 6, 6), glowEyeMat);
            eyeR.position.set(0.32, 0.15, -0.25);
            this.bodyMesh.add(eyeR);

            this.segments = [];
            this.legs = [];
            for (let s = 0; s < segCount; s++) {
                const radius = t === 'serpent' ? (0.42 - s * 0.03) : 0.48;
                const seg = new THREE.Mesh(new THREE.SphereGeometry(radius, 8, 8), s % 2 === 0 ? mat : darkMat);
                seg.scale.set(1.1, t === 'arthropleura' ? 0.65 : 0.95, 1.15);
                seg.position.set(-0.45 - s * 0.48, 0, 0);
                this.bodyMesh.add(seg);
                this.segments.push(seg);

                if (t === 'arthropleura') {
                    [-1, 1].forEach(side => {
                        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.03, 0.5, 4), amberMat);
                        leg.position.set(0, -0.25, side * 0.45);
                        seg.add(leg);
                        this.legs.push(leg);
                    });
                }
            }
        } else if (t === 'bothriolepis' || t === 'scutosaurus' || t === 'dino_tank') {
            // === CRÉATURE CUIRASSÉE / TANK ===
            const bodyGeo = new THREE.BoxGeometry(1.9, 0.95, 1.35);
            this.bodyMesh = new THREE.Mesh(bodyGeo, mat);
            this.bodyMesh.position.set(0, 0.95, 0);
            this.bodyMesh.castShadow = true;
            this.root.add(this.bodyMesh);

            const shieldPlate = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.05, 1.45), amberMat);
            shieldPlate.position.set(0.95, 0.05, 0);
            this.bodyMesh.add(shieldPlate);

            for (let sp = 0; sp < 4; sp++) {
                const plate = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.55, 4), darkMat);
                plate.position.set(0.5 - sp * 0.45, 0.65, 0);
                this.bodyMesh.add(plate);
            }

            const clubTail = new THREE.Mesh(new THREE.SphereGeometry(0.34, 8, 8), darkMat);
            clubTail.position.set(-1.5, 0, 0);
            this.bodyMesh.add(clubTail);

            this.legs = [];
            for (let i = 0; i < 4; i++) {
                const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.12, 0.8, 6), darkMat);
                leg.position.set(i < 2 ? 0.55 : -0.55, -0.55, i % 2 === 0 ? 0.55 : -0.55);
                this.bodyMesh.add(leg);
                this.legs.push(leg);
            }
        } else if (t === 'jawless_fish' || t === 'shark_placoderm') {
            // === POISSON / REQUIN PRIMORDIAL ===
            const bodyGeo = new THREE.ConeGeometry(0.52, 2.3, 8);
            bodyGeo.rotateZ(-Math.PI / 2);
            this.bodyMesh = new THREE.Mesh(bodyGeo, mat);
            this.bodyMesh.position.set(0, 0.85, 0);
            this.bodyMesh.castShadow = true;
            this.root.add(this.bodyMesh);

            const dorsalFin = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.85, 4), darkMat);
            dorsalFin.position.set(-0.1, 0.55, 0);
            this.bodyMesh.add(dorsalFin);

            const tailFin = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.85, 0.08), darkMat);
            tailFin.position.set(-1.25, 0.1, 0);
            this.bodyMesh.add(tailFin);
            this.tailFan = tailFin;
            this.legs = [];
        } else {
            // === RAPTORS, SYNAPSIDES & MAMMIFÈRES PRÉHISTORIQUES ===
            const bodyGeo = new THREE.SphereGeometry(0.95, 8, 8);
            bodyGeo.scale(1.3, 0.72, 0.78);
            this.bodyMesh = new THREE.Mesh(bodyGeo, mat);
            this.bodyMesh.position.y = 1.0;
            this.bodyMesh.castShadow = true;
            this.root.add(this.bodyMesh);

            const headGeo = new THREE.ConeGeometry(0.5, 1.15, 7);
            headGeo.rotateZ(-Math.PI / 2);
            this.headMesh = new THREE.Mesh(headGeo, mat);
            this.headMesh.position.set(1.05, 0.55, 0);
            this.bodyMesh.add(this.headMesh);

            if (t === 'synapsid' || t === 'mammal' || t === 'glacier_panther') {
                // Crocs proéminents (Gorgonopsides / Loups / Smilodons)
                [-0.14, 0.14].forEach(z => {
                    const fang = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.35, 4), amberMat);
                    fang.rotation.z = Math.PI;
                    fang.position.set(0.18, -0.24, z);
                    this.headMesh.add(fang);
                });
            } else {
                // Crête de raptor
                const crest = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.25, 0.08), amberMat);
                crest.position.set(-0.1, 0.38, 0);
                this.headMesh.add(crest);
            }

            const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), glowEyeMat);
            eyeL.position.set(0.15, 0.2, 0.3);
            this.headMesh.add(eyeL);
            const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), glowEyeMat);
            eyeR.position.set(0.15, 0.2, -0.3);
            this.headMesh.add(eyeR);

            this.legs = [];
            for (let i = 0; i < 4; i++) {
                const legGeo = new THREE.CylinderGeometry(0.09, 0.06, 0.9, 5);
                const leg = new THREE.Mesh(legGeo, darkMat);
                leg.position.set((i < 2 ? 0.45 : -0.45), -0.45, (i % 2 === 0 ? 0.55 : -0.55));
                leg.rotation.z = (i < 2 ? -0.25 : 0.25);
                this.bodyMesh.add(leg);
                this.legs.push(leg);
            }

            const tailGeo = new THREE.ConeGeometry(0.22, 1.35, 5);
            tailGeo.rotateZ(Math.PI / 2);
            this.tailMesh = new THREE.Mesh(tailGeo, darkMat);
            this.tailMesh.position.set(-1.3, 0.15, 0);
            this.bodyMesh.add(this.tailMesh);
        }
    }

    syncPosition() {
        if (!this.root) return;
        this.root.position.set(this.x, this.y, 0);
        this.root.rotation.y = this.facing > 0 ? Math.PI / 2 : -Math.PI / 2;
    }

    takeDamage(damage, knockbackX = 0, knockbackY = 0, attackAction = '') {
        if (this.isDead) return;

        let finalDmg = damage;
        if (this.archetype === 'armored' && typeof fighter1 !== 'undefined' && fighter1) {
            const hitFromFront = ((fighter1.x - this.x) * this.facing) > 0;
            const isSpecialOrAir = (attackAction && (attackAction.includes('special') || attackAction === 'anti_air')) || (fighter1.y - this.y > 0.8);
            if (hitFromFront && !isSpecialOrAir) {
                finalDmg = Math.max(15, Math.round(damage * 0.45));
                knockbackX *= 0.4;
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

        if (this.bodyMesh && this.bodyMesh.material) {
            this.bodyMesh.material.emissive.setHex(0xffffff);
            setTimeout(() => {
                if (this.bodyMesh && this.bodyMesh.material) {
                    this.bodyMesh.material.emissive.setHex(0x000000);
                }
            }, 80);
        }

        if (typeof spawnFloatingPopup === 'function') {
            spawnFloatingPopup(this.x, `-${Math.round(finalDmg)}`, '#ef4444');
        }
        if (typeof spawn3DBloodAndBones === 'function') {
            spawn3DBloodAndBones(this.x, this.y + 1.0, 5, false);
        }

        if (this.hp <= 0) {
            this.die();
        }
    }

    die() {
        if (this.isDead) return;
        this.isDead = true;
        this.hp = 0;

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

        // IA spécialisée par archétype
        if (player && !player.isDead) {
            const dx = player.x - this.x;
            const dist = Math.abs(dx);
            this.facing = dx >= 0 ? 1 : -1;

            if (this.archetype === 'zoning') {
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
        if (this.legs && this.legs.length > 0 && this.action === 'walk') {
            this.legs.forEach((l, idx) => {
                l.rotation.x = Math.sin(now * 0.016 + idx * 0.5) * 0.45;
            });
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
        if (this.swimmingFlaps && this.swimmingFlaps.length > 0) {
            this.swimmingFlaps.forEach(fl => {
                const wave = Math.sin(now * 0.008 + fl.idx * 0.42) * 0.35;
                fl.mesh.rotation.z = fl.side * (0.15 + wave);
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
            if (dist < 1.8 && Math.abs(player.y - this.y) < 2.2) {
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
            this.projectile = new THREE.Mesh(
                kind === 'icicle' ? new THREE.ConeGeometry(0.45, 1.5, 6) : new THREE.SphereGeometry(0.55, 8, 8),
                new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.45, roughness: 0.4 })
            );
            if (kind === 'icicle') this.projectile.rotation.z = Math.PI;
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

        if (type === 'meat') {
            // Côtelette d'os avec viande rouge succulente
            const boneGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.9, 6);
            const boneMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.3 });
            const bone = new THREE.Mesh(boneGeo, boneMat);
            bone.rotation.z = Math.PI / 4;
            this.root.add(bone);

            const meatGeo = new THREE.SphereGeometry(0.3, 8, 8);
            meatGeo.scale(1.2, 0.8, 0.8);
            const meatMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 });
            const meat = new THREE.Mesh(meatGeo, meatMat);
            this.root.add(meat);
        } else {
            // Coeur d'ambre préhistorique doré
            const amberGeo = new THREE.OctahedronGeometry(0.32, 0);
            const amberMat = new THREE.MeshStandardMaterial({
                color: 0xfbbf24,
                emissive: 0xf59e0b,
                emissiveIntensity: 0.5,
                roughness: 0.15,
                metalness: 0.8
            });
            const amber = new THREE.Mesh(amberGeo, amberMat);
            this.root.add(amber);
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
}

// 6. INITIALISATION ET DÉROULEMENT D'UN NIVEAU D'ÈRE SMASH MELEE
function startCampaignEraLevel(era) {
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
    const p1Dino = DINO_ROSTER[p1ChoiceIndex] || DINO_ROSTER[0];
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

function buildAnomalocarisBossModel(fighter, bossWave) {
    if (!fighter || !fighter.rig || !fighter.rig.root) return;

    // Masquer tous les composants du squelette/rig dinosaure de base
    if (fighter.rig.hips) {
        fighter.rig.hips.visible = false;
    }
    if (fighter.rig.skeletonGroup) {
        fighter.rig.skeletonGroup.visible = false;
    }
    if (fighter.rig.skinMeshes) {
        fighter.rig.skinMeshes.forEach(m => { m.visible = false; });
    }

    // Supprimer l'ancien modèle s'il existe
    const old = (typeof fighter.rig.root.getObjectByName === 'function') ? fighter.rig.root.getObjectByName('AnomalocarisBossHierarchy') : null;
    if (old) fighter.rig.root.remove(old);

    const anomRoot = new THREE.Group();
    anomRoot.name = 'AnomalocarisBossHierarchy';
    fighter.rig.root.add(anomRoot);

    const primaryColor = bossWave.color || 0x0e7490;
    const accentColor = bossWave.accentColor || 0x22d3ee;

    const chitinMat = new THREE.MeshStandardMaterial({
        color: primaryColor,
        roughness: 0.35,
        metalness: 0.4
    });
    const dorsalCarapaceMat = new THREE.MeshStandardMaterial({
        color: 0x083344,
        roughness: 0.3,
        metalness: 0.5
    });
    const ventralMat = new THREE.MeshStandardMaterial({
        color: 0x155e75,
        roughness: 0.5,
        metalness: 0.2
    });
    const glowCyanMat = new THREE.MeshStandardMaterial({
        color: accentColor,
        emissive: accentColor,
        emissiveIntensity: 0.85,
        roughness: 0.2
    });
    const amberSpineMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        emissive: 0xd97706,
        emissiveIntensity: 0.35,
        roughness: 0.2
    });
    const darkMouthMat = new THREE.MeshStandardMaterial({
        color: 0x030712,
        roughness: 0.85
    });
    const compoundEyeMat = new THREE.MeshBasicMaterial({
        color: 0xa5f3fc
    });

    // 1. CARAPACE CÉPHALIQUE HYDRODYNAMIQUE (Sclérite dorsal H + sclérites latéraux P)
    const headCarapaceGeo = new THREE.ConeGeometry(0.92, 1.85, 8);
    headCarapaceGeo.rotateZ(-Math.PI / 2);
    headCarapaceGeo.scale(1.26, 0.56, 1.08);
    const headCarapace = new THREE.Mesh(headCarapaceGeo, dorsalCarapaceMat);
    headCarapace.position.set(1.15, 0.5, 0);
    headCarapace.castShadow = true;
    anomRoot.add(headCarapace);

    // Sclérites latéraux céphaliques P (P-elements)
    [-0.55, 0.55].forEach(z => {
        const pElemGeo = new THREE.BoxGeometry(0.75, 0.20, 0.30);
        pElemGeo.rotateZ(-0.25);
        const pElem = new THREE.Mesh(pElemGeo, chitinMat);
        pElem.position.set(1.10, 0.32, z);
        anomRoot.add(pElem);
    });

    // Yeux composés géants sur pédoncules articulés (Stalked Compound Eyes)
    const eyeStalks = [];
    [-0.55, 0.55].forEach((zSign) => {
        const stalk = new THREE.Group();
        stalk.position.set(1.4, 0.7, zSign);

        const stalkGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.5, 6);
        stalkGeo.rotateX(zSign > 0 ? -0.4 : 0.4);
        const stalkMesh = new THREE.Mesh(stalkGeo, chitinMat);
        stalk.add(stalkMesh);

        const eyeBulbGeo = new THREE.SphereGeometry(0.26, 12, 12);
        eyeBulbGeo.scale(1.2, 1.0, 1.0);
        const eyeBulb = new THREE.Mesh(eyeBulbGeo, compoundEyeMat);
        eyeBulb.position.set(0.12, 0.28, zSign * 0.18);
        stalk.add(eyeBulb);

        const ringGeo = new THREE.TorusGeometry(0.25, 0.04, 6, 12);
        const ring = new THREE.Mesh(ringGeo, glowCyanMat);
        ring.position.copy(eyeBulb.position);
        ring.rotation.y = Math.PI / 2;
        stalk.add(ring);

        anomRoot.add(stalk);
        eyeStalks.push(stalk);
    });

    // 2. APPENDICES RAPACES FRONTALES (PODOMÈRES ET ÉPINES ENDITIQUES AVEC SPINULES AUXILIAIRES)
    const raptorialClaws = [];
    [-0.26, 0.26].forEach((zSign) => {
        const clawRoot = new THREE.Group();
        clawRoot.position.set(1.95, 0.3, zSign);

        let parentNode = clawRoot;
        const segmentMeshes = [];
        for (let s = 0; s < 5; s++) {
            const seg = new THREE.Group();
            seg.position.set(s === 0 ? 0 : 0.32, s === 0 ? 0 : -0.15, 0);
            seg.rotation.z = -0.30;

            const segGeo = new THREE.BoxGeometry(0.35, 0.20, 0.15);
            const segMesh = new THREE.Mesh(segGeo, chitinMat);
            segMesh.position.x = 0.16;
            segMesh.castShadow = true;
            seg.add(segMesh);

            // Épine enditique ventrale principale
            const spineHeight = 0.32 + (s * 0.08);
            const spineGeo = new THREE.ConeGeometry(0.055, spineHeight, 4);
            spineGeo.rotateZ(Math.PI);
            const spine = new THREE.Mesh(spineGeo, amberSpineMat);
            spine.position.set(0.16, -0.20 - spineHeight * 0.4, 0);
            seg.add(spine);

            // Épines auxiliaires de capture
            [-0.04, 0.04].forEach(offsetY => {
                const auxSpineGeo = new THREE.ConeGeometry(0.025, 0.15, 3);
                auxSpineGeo.rotateZ(Math.PI * 0.85);
                const auxSpine = new THREE.Mesh(auxSpineGeo, amberSpineMat);
                auxSpine.position.set(0.04, offsetY, 0);
                spine.add(auxSpine);
            });

            parentNode.add(seg);
            parentNode = seg;
            segmentMeshes.push(seg);
        }

        anomRoot.add(clawRoot);
        raptorialClaws.push({ root: clawRoot, segments: segmentMeshes });
    });

    // 3. CÔNE ORAL TRIRADIAL DE PEYTOIA (3 GRANDES PLAQUES + DENTS CHITINEUSES)
    const mouthGroup = new THREE.Group();
    mouthGroup.position.set(1.2, 0.08, 0);
    mouthGroup.rotation.x = Math.PI / 2;

    const oralConeOuter = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.12, 8, 24), ventralMat);
    mouthGroup.add(oralConeOuter);

    const oralCavity = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.18, 16), darkMouthMat);
    mouthGroup.add(oralCavity);

    // 3 grandes plaques dominantes triradiales
    for (let p = 0; p < 3; p++) {
        const radAngle = (p * Math.PI * 2) / 3;
        const mainPlateGeo = new THREE.BoxGeometry(0.14, 0.06, 0.18);
        const mainPlate = new THREE.Mesh(mainPlateGeo, chitinMat);
        mainPlate.position.set(Math.cos(radAngle) * 0.30, 0.08, Math.sin(radAngle) * 0.30);
        mainPlate.rotation.y = -radAngle;
        mouthGroup.add(mainPlate);
    }

    for (let t = 0; t < 24; t++) {
        const angle = (t / 24) * Math.PI * 2;
        const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.16, 4), amberSpineMat);
        tooth.position.set(Math.cos(angle) * 0.25, 0.05, Math.sin(angle) * 0.25);
        tooth.rotation.z = Math.PI;
        tooth.rotation.y = angle;
        mouthGroup.add(tooth);
    }
    anomRoot.add(mouthGroup);

    // 4. TRONC MÉTAMÉRISÉ HYDRODYNAMIQUE (SEGMENTED BODY)
    const bodySegments = [];
    const trunkCount = 8;
    for (let i = 0; i < trunkCount; i++) {
        const segGroup = new THREE.Group();
        const factor = 1.0 - (i / trunkCount) * 0.55;
        const segX = 0.5 - i * 0.58;

        const segGeo = new THREE.BoxGeometry(0.62, 0.48 * factor, 1.15 * factor);
        const segMesh = new THREE.Mesh(segGeo, i % 2 === 0 ? chitinMat : dorsalCarapaceMat);
        segMesh.castShadow = true;
        segGroup.position.set(segX, 0.48, 0);
        segGroup.add(segMesh);

        // Crête dorsale carénée luminescente
        const crestGeo = new THREE.ConeGeometry(0.08 * factor, 0.35 * factor, 4);
        crestGeo.rotateZ(Math.PI / 2);
        const crest = new THREE.Mesh(crestGeo, glowCyanMat);
        crest.position.set(0, 0.3 * factor, 0);
        segGroup.add(crest);

        anomRoot.add(segGroup);
        bodySegments.push(segGroup);
    }

    // 5. 11 PAIRES DE LOBES NATATOIRES LATÉRAUX (22 FLAPS) & BANDES BRANCHIALES SÉTIFÈRES
    const swimmingFlaps = [];
    const flapCount = 11;
    const gillMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        roughness: 0.45,
        transparent: true,
        opacity: 0.85
    });

    for (let i = 0; i < flapCount; i++) {
        const factor = (i < 4) ? (0.62 + i * 0.20) : (1.35 - (i - 4) * 0.14);
        const flapX = 0.95 - i * 0.48;

        // Lobe gauche
        const flapLGroup = new THREE.Group();
        flapLGroup.position.set(flapX, 0.38, 0.54 * factor);
        const flapLGeo = new THREE.BoxGeometry(0.46, 0.05, 0.74 * factor);
        const flapL = new THREE.Mesh(flapLGeo, glowCyanMat);
        flapL.position.z = 0.38 * factor;
        flapLGroup.add(flapL);

        // Bande branchiale sétifère dorsale gauche
        const gillL = new THREE.Mesh(new THREE.BoxGeometry(0.40, 0.03, 0.60 * factor), gillMat);
        gillL.position.set(0, 0.04, 0.32 * factor);
        flapLGroup.add(gillL);
        anomRoot.add(flapLGroup);

        // Lobe droit
        const flapRGroup = new THREE.Group();
        flapRGroup.position.set(flapX, 0.38, -0.54 * factor);
        const flapRGeo = new THREE.BoxGeometry(0.46, 0.05, 0.74 * factor);
        const flapR = new THREE.Mesh(flapRGeo, glowCyanMat);
        flapR.position.z = -0.38 * factor;
        flapRGroup.add(flapR);

        // Bande branchiale sétifère dorsale droite
        const gillR = new THREE.Mesh(new THREE.BoxGeometry(0.40, 0.03, 0.60 * factor), gillMat);
        gillR.position.set(0, 0.04, -0.32 * factor);
        flapRGroup.add(gillR);
        anomRoot.add(flapRGroup);

        swimmingFlaps.push({ left: flapLGroup, right: flapRGroup, factor, index: i });
    }

    // 6. FURCA CAUDALE TRI-LOBÉE RELEVÉE À ~35° (TAIL FAN STABILIZER)
    const tailFanGroup = new THREE.Group();
    tailFanGroup.position.set(-4.2, 0.58, 0);
    tailFanGroup.rotation.z = 0.35; // Hydrofoil tilt
    for (let f = 0; f < 3; f++) {
        const angle = (f - 1) * 0.45;
        const bladeGeo = new THREE.BoxGeometry(1.25, 0.055, 0.36);
        bladeGeo.rotateY(angle);
        const blade = new THREE.Mesh(bladeGeo, glowCyanMat);
        blade.position.set(-0.55, 0.18 + Math.abs(f - 1) * 0.14, (f - 1) * 0.55);
        tailFanGroup.add(blade);
    }
    anomRoot.add(tailFanGroup);

    fighter._isAnomalocaris = true;
    fighter.bodyRadius = 1.95;
    fighter._anomModel = {
        root: anomRoot,
        eyeStalks,
        raptorialClaws,
        mouthGroup,
        bodySegments,
        swimmingFlaps,
        tailFanGroup
    };
}

function updateAnomalocarisBossAnimations(boss, dt, nowSec) {
    if (!boss || !boss._isAnomalocaris || !boss._anomModel) return;
    const anom = boss._anomModel;
    const time = nowSec;

    // 1. Ondulation fluide des lobes natatoires (Swimming Flaps Wave)
    if (anom.swimmingFlaps) {
        anom.swimmingFlaps.forEach(fl => {
            const wave = Math.sin(time * 7.5 + fl.index * 0.45) * 0.32;
            fl.left.rotation.x = wave * 0.35;
            fl.left.rotation.z = 0.15 + wave;
            fl.right.rotation.x = -wave * 0.35;
            fl.right.rotation.z = -0.15 - wave;
        });
    }

    // 2. Mouvement d'attaque des appendices rapaces (Claw strike)
    if (anom.raptorialClaws) {
        const isAttacking = boss.actionDuration > 0 && boss.action !== 'idle' && boss.action !== 'walk';
        const strikeProg = isAttacking ? Math.sin((boss.actionTimer / Math.max(0.01, boss.actionDuration)) * Math.PI) : 0;
        anom.raptorialClaws.forEach((claw, cIdx) => {
            const idleSway = Math.sin(time * 3.2 + cIdx) * 0.12;
            claw.root.rotation.z = (strikeProg > 0.05) ? (0.45 - strikeProg * 1.35) : idleSway;
            claw.root.rotation.y = (strikeProg > 0.05) ? (cIdx === 0 ? 0.35 : -0.35) : 0;
        });
    }

    // 3. Battement fluide de l'éventail caudal
    if (anom.tailFanGroup) {
        anom.tailFanGroup.rotation.y = Math.sin(time * 4.2) * 0.18;
        anom.tailFanGroup.rotation.z = 0.35 + Math.cos(time * 3.2) * 0.08;
    }

    // 4. Flottaison marine primordiale au-dessus du sol
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

    // Créer une copie personnalisée du boss avec les stats épiques
    const customBossDino = Object.assign({}, baseDino, {
        name: bossWave.bossName,
        fullName: bossWave.bossTitle,
        maxHp: bossWave.hp || 2500,
        isBoss: true,
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

    // Construction du modèle 3D sur-mesure pour Anomalocaris Titan
    if (bossWave.bossId === 'boss_anomalocaris') {
        buildAnomalocarisBossModel(fighter2, bossWave);
    }

    campaignBossFighter = fighter2;

    // Afficher la Colossale barre de vie du Boss
    showBossHealthBarUI(bossWave);
}

// 7. GESTION DU HUD SMASH MELEE (STOCKS, VAGUES, MÉCANIQUE, BARRE DE BOSS)
function mountCampaignSmashHUD(era) {
    let existing = document.getElementById('campaignSmashHUD');
    if (existing) existing.remove();

    const hazardName = era.hazard ? era.hazard.name : 'Combat Standard';
    const hudHtml = `
        <div id="campaignSmashHUD" class="absolute inset-0 pointer-events-none z-30 flex flex-col justify-between p-3 select-none">
            <!-- Top Container (Era info + Banner + Stocks + Boss Bar) -->
            <div class="w-full flex flex-col items-center gap-2">
                <!-- Top Smash Era Bar -->
                <div class="w-full flex items-center justify-between">
                    <!-- Left: Era Logo & Title -->
                    <div class="flex items-center gap-3 bg-stone-950/85 border border-amber-500/60 rounded-2xl p-2 px-4 shadow-2xl backdrop-blur-sm">
                        <img src="${era.logo}" alt="${era.name}" class="w-12 h-12 object-contain filter drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]">
                        <div class="flex flex-col">
                            <span class="font-cinzel font-black text-amber-200 text-sm tracking-wider leading-tight">${era.name}</span>
                            <div class="flex items-center gap-2">
                                <span id="smashHudWaveIndicator" class="font-chakra font-bold text-xs text-amber-400/90 tracking-widest uppercase">VAGUE 1 / 3</span>
                                <span id="smashHudObjectiveTimer" class="hidden font-chakra font-black text-xs text-cyan-300 bg-cyan-950/80 border border-cyan-500/60 px-2 py-0.5 rounded uppercase"></span>
                            </div>
                            <span id="smashHudHazardBadge" class="font-chakra font-bold text-[10px] text-stone-300 tracking-wide">⚡ ${hazardName}</span>
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
        const pct = Math.max(0, Math.min(100, (campaignBossFighter.hp / campaignBossFighter.maxHp) * 100));
        if (fill) fill.style.width = `${pct}%`;
        if (text) text.textContent = `${Math.round(campaignBossFighter.hp)} / ${campaignBossFighter.maxHp} HP`;
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
        const bossWave = era.waves[2];
        campaignWaveBannerTimer = 2.5;
        campaignWaveAnnounceTitle = `🔥 PHASE 2 : ${bossWave.bossName} ENRAGÉ !`;
        campaignWaveAnnounceSub = bossWave.phase2Desc || 'Le Boss déchaîne sa pleine puissance !';
        if (typeof sfx !== 'undefined' && sfx.playRoar) sfx.playRoar();
        if (typeof spawnFloatingPopup === 'function') spawnFloatingPopup(boss.x, '🔥 ENRAGE PHASE 2 !', '#f97316');

        // Anomalocaris appelle 2 Trilobites en renfort
        if (bossWave.bossId === 'boss_anomalocaris') {
            const groundY = typeof getArenaGroundHeight === 'function' ? getArenaGroundHeight(currentArena, 0, 0) : 0;
            spawnMinionFromWaveDef(era.waves[0], boss.x - 4.0, groundY);
            spawnMinionFromWaveDef(era.waves[0], boss.x + 4.0, groundY);
        } else {
            // Onde d'énergie à distance en entrant en Phase 2
            const dir = fighter1 && fighter1.x >= boss.x ? 1 : -1;
            campaignActiveProjectiles.push(new CampaignProjectile3D(boss.x + dir * 1.5, boss.y + 1.2, dir * 11.5, 0, bossWave.accentColor || 0xf59e0b, 55, 0.55));
        }
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
    if (!fighter1 || fighter1.isDead) return;
    const a = fighter1.action;
    const isAttacking = a.includes('light') || a.includes('heavy') || a.includes('special') || a === 'anti_air' || a === 'dash_attack' || a.startsWith('attack_') || a === 'strike';
    if (!isAttacking || fighter1.hasHitCurrentAttack) return;

    // Définir la portée et dégâts de l'attaque en cours
    let dmg = 85;
    let knockX = fighter1.facing * 6.5;
    let knockY = 4.5;
    let range = 2.8;

    if (a.includes('heavy') || a === 'anti_air') {
        dmg = 160;
        knockX = fighter1.facing * 10.0;
        knockY = 6.5;
        range = 3.2;
    } else if (a.includes('special')) {
        dmg = 240;
        knockX = fighter1.facing * 13.5;
        knockY = 8.5;
        range = 3.8;
    }

    // Bonus Rayon Solaire du Permien
    if (activeCampaignEra && activeCampaignEra.hazard && activeCampaignEra.hazard.id === 'sunbeams' && Math.abs(fighter1.x - campaignSunbeamX) < 2.2) {
        dmg = Math.round(dmg * 1.35);
    }

    let hitAny = false;
    campaignActiveMinions.forEach(minion => {
        if (minion.isDead) return;
        const dx = minion.x - fighter1.x;
        const dist = Math.abs(dx);
        const inFront = (dx * fighter1.facing) >= -0.6;
        const verticalReach = minion.archetype === 'aerial' ? 3.8 : 2.5;
        if (dist <= range && inFront && Math.abs(minion.y - fighter1.y) < verticalReach) {
            minion.takeDamage(dmg, knockX, knockY, a);
            hitAny = true;
        }
    });

    if (hitAny) {
        fighter1.hasHitCurrentAttack = true;
        fighter1.hasHitConfirmed = true;
        sfx.playHit(false);
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
        setTimeout(() => {
            if (typeof showCampaignGameOverModal === 'function') {
                showCampaignGameOverModal();
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

    // Sauvegarder la complétion et débloquer combattant + arène
    clearEraProgress(activeCampaignEra.id);

    // Ouvrir la modale festive des récompenses débloquées
    setTimeout(() => {
        showEraVictoryRewardsModal(activeCampaignEra);
    }, 2400);
}

function showEraVictoryRewardsModal(era) {
    const existing = document.getElementById('eraVictoryModal');
    if (existing) existing.remove();

    const r = era.reward;
    const isNewFighterUnlock = typeof UNLOCKABLE_FIGHTER_ERAS !== 'undefined' && UNLOCKABLE_FIGHTER_ERAS[r.fighterId] === era.id;
    const isNewArenaUnlock = typeof UNLOCKABLE_ARENA_ERAS !== 'undefined' && UNLOCKABLE_ARENA_ERAS[r.arenaId] === era.id;
    const fighterBadge = isNewFighterUnlock ? '🦖 NOUVEAU COMBATTANT DÉBLOQUÉ' : '🏆 MAÎTRE DE L\'ÈRE';
    const arenaBadge = isNewArenaUnlock ? '🌋 NOUVELLE ARÈNE DÉBLOQUÉE' : '🗺️ THÉÂTRE DE VICTOIRE';
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

                <!-- Rewards Grid (Character & Arena) -->
                <div class="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
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

                <!-- Continue Button -->
                <button id="btnEraVictoryContinue" class="mt-8 py-3 px-8 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-cinzel font-black text-sm uppercase tracking-widest border border-amber-200 shadow-2xl cursor-pointer">
                    CONTINUER SUR LA CARTE DE CAMPAGNE ➔
                </button>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

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
    window.clearEraProgress = clearEraProgress;
    window.startCampaignEraLevel = startCampaignEraLevel;
    window.updateCampaignLevelEngine = updateCampaignLevelEngine;
}
