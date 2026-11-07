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

// 1. CONFIGURATION OFFICIELLE DES 6 GRANDES ÈRES DE CAMPAGNE
const CAMPAIGN_ERAS = [
    {
        id: 1,
        slug: 'paleozoic',
        name: 'I. ÈRE PALÉOZOÏQUE',
        subtitle: 'ABYSSE PRIMORDIAL & NÉCROPOLE MYSTIQUE',
        periodYears: '541 - 252 Ma',
        logo: 'assets/ui/era_logos/era_1_paleozoic.png',
        arenaId: 'swamp',
        themeColor: '#14b8a6', // turquoise / cyan
        mapX: 20,
        mapY: 66,
        description: 'Plongez dans les profondeurs ténébreuses des océans du Cambrien et des forêts marécageuses du Carbonifère. Survivez aux essaims d\'arthropodes primordiaux et terrassiez le titan abyssal.',
        reward: {
            fighterId: 'pulmonoscorpius',
            fighterName: 'Pulmonoscorpius',
            fighterRole: 'Scorpion Primordial Venimeux',
            fighterPortrait: 'assets/portraits/pulmonoscorpius.png',
            arenaId: 'swamp',
            arenaName: 'Abysse Fongique Toxique',
            arenaDesc: 'Marais bioluminescent avec champignons géants et spores toxiques'
        },
        waves: [
            {
                waveNum: 1,
                name: 'ESSAIM DE CHITINE PRIMORDIALE',
                count: 3,
                enemyType: 'trilobite_crawler',
                enemyDisplayName: 'Trilobite Épineux',
                hp: 200,
                speed: 5.5,
                scale: 0.55,
                color: 0x14b8a6,
                baseDino: 'pulmonoscorpius'
            },
            {
                waveNum: 2,
                name: 'GARDE VENIMEUSE DU CARBONIFÈRE',
                count: 2,
                enemyType: 'abyss_scorpion_elite',
                enemyDisplayName: 'Élite Pulmonoscorpion',
                hp: 360,
                speed: 6.8,
                scale: 0.78,
                color: 0x0d9488,
                baseDino: 'pulmonoscorpius'
            },
            {
                waveNum: 3,
                isBoss: true,
                name: 'LÉVIATHAN DES ABYSSES',
                bossId: 'boss_gorgonops_prime',
                bossName: 'GORGONOPS PRIME',
                bossTitle: 'LÉVIATHAN DE L\'ABYSSE PRIMORDIAL',
                hp: 2100,
                speed: 6.8,
                scale: 1.45,
                color: 0x065f46,
                accentColor: 0x2dd4bf,
                baseDino: 'pulmonoscorpius',
                signatureMove: 'Jet de Venin Corrosif & Pilonnage Sismique',
                specialMoves: ['acid_spit', 'claw_crush', 'tail_quake']
            }
        ]
    },
    {
        id: 2,
        slug: 'triassic',
        name: 'II. ÈRE DU TRIAS',
        subtitle: 'L\'AUBE DES ARCHOSAURES PRÉDATEURS',
        periodYears: '252 - 201 Ma',
        logo: 'assets/ui/era_logos/era_2_triassic.png',
        arenaId: 'storm',
        themeColor: '#f59e0b', // amber
        mapX: 36,
        mapY: 42,
        description: 'Les rudes terres rouges du Trias résonnent du tonnerre des premiers grands carnassiers. Échappez aux meutes d\'archosaures et domptez le colosse briseur de roche.',
        reward: {
            fighterId: 'postosuchus',
            fighterName: 'Postosuchus',
            fighterRole: 'Archosaurien Carnassier',
            fighterPortrait: 'assets/portraits/postosuchus.png',
            arenaId: 'storm',
            arenaName: 'Canyon de l\'Orage Primordial',
            arenaDesc: 'Colonnes de basalte balayées par des tempêtes d\'éclairs'
        },
        waves: [
            {
                waveNum: 1,
                name: 'MEUTE DE PROTO-CARNASSIERS',
                count: 3,
                enemyType: 'triassic_hound',
                enemyDisplayName: 'Chien de Terreur du Trias',
                hp: 220,
                speed: 6.5,
                scale: 0.6,
                color: 0xb45309,
                baseDino: 'postosuchus'
            },
            {
                waveNum: 2,
                name: 'AVANT-GARDE CYNODONTE',
                count: 2,
                enemyType: 'cynodont_elite',
                enemyDisplayName: 'Guerrier Postosuchien',
                hp: 400,
                speed: 7.2,
                scale: 0.8,
                color: 0x92400e,
                baseDino: 'postosuchus'
            },
            {
                waveNum: 3,
                isBoss: true,
                name: 'LE COLOSSE BRIS' + 'EUR DE ROCHE',
                bossId: 'boss_fasolasuchus',
                bossName: 'FASOLASUCHUS GIGANTEUS',
                bossTitle: 'TITAN DES CERCLES DU TONNERRE',
                hp: 2350,
                speed: 7.0,
                scale: 1.5,
                color: 0x78350f,
                accentColor: 0xfbbf24,
                baseDino: 'postosuchus',
                signatureMove: 'Charge Sismique & Morsure Foudroyante',
                specialMoves: ['thunder_stomp', 'savage_lunge', 'lightning_roar']
            }
        ]
    },
    {
        id: 3,
        slug: 'jurassic',
        name: 'III. ÈRE JURASSIQUE',
        subtitle: 'LE RÈGNE DES GÉANTS & TITANS FÉROCES',
        periodYears: '201 - 145 Ma',
        logo: 'assets/ui/era_logos/era_3_jurassic.png',
        arenaId: 'jungle',
        themeColor: '#22c55e', // emerald green
        mapX: 52,
        mapY: 60,
        description: 'La canopée luxuriante abrite les plus gigantesques sauropodes et stégosaures de l\'histoire. Survivez aux assauts de la forêt et abattez le colossal titan tellurique.',
        reward: {
            fighterId: 'apatosaurus',
            fighterName: 'Apatosaure',
            fighterRole: 'Titan Sauropode Sismique',
            fighterPortrait: 'assets/portraits/apato.png',
            arenaId: 'jungle',
            arenaName: 'Vallée d\'Émeraude',
            arenaDesc: 'Jungle tropicale luxuriante et cascades primordiales'
        },
        waves: [
            {
                waveNum: 1,
                name: 'TRAQUEURS DES FOUGÈRES',
                count: 3,
                enemyType: 'jurassic_raptor',
                enemyDisplayName: 'Pousseur Jurassique',
                hp: 240,
                speed: 6.8,
                scale: 0.6,
                color: 0x16a34a,
                baseDino: 'stegosaurus'
            },
            {
                waveNum: 2,
                name: 'SENTINELLES À ÉPINES',
                count: 2,
                enemyType: 'stego_sentinel',
                enemyDisplayName: 'Sentinelle Thagomizer',
                hp: 440,
                speed: 6.4,
                scale: 0.82,
                color: 0x15803d,
                baseDino: 'stegosaurus'
            },
            {
                waveNum: 3,
                isBoss: true,
                name: 'L\'ÉCRASEUR TELLURIQUE',
                bossId: 'boss_brontotitan',
                bossName: 'TITANO-COLOSSUS BRONTOR',
                bossTitle: 'L\'ÉCRASEUR TELLURIQUE DU JURASSIQUE',
                hp: 2600,
                speed: 6.4,
                scale: 1.55,
                color: 0x064e3b,
                accentColor: 0x4ade80,
                baseDino: 'apatosaurus',
                signatureMove: 'Onde Sismique Tellurique & Fouet Caudal Sonique',
                specialMoves: ['earthquake_stomp', 'tail_tornado', 'boulder_throw']
            }
        ]
    },
    {
        id: 4,
        slug: 'cretaceous',
        name: 'IV. ÈRE CRÉTACÉE',
        subtitle: 'L\'IMPACT DU CHICXULUB & LE ROYAUME DE MAGMA',
        periodYears: '145 - 66 Ma',
        logo: 'assets/ui/era_logos/era_4_cretaceous.png',
        arenaId: 'volcano',
        themeColor: '#ef4444', // red
        mapX: 66,
        mapY: 34,
        description: 'La Terre brûle sous une pluie de météores incandescents. Les prédateurs suprêmes se battent pour la survie avant l\'extinction totale. Affrontez le mastodonte volcanique.',
        reward: {
            fighterId: 'therizino',
            fighterName: 'Thérizinosaure',
            fighterRole: 'Faucheuse Préhistorique',
            fighterPortrait: 'assets/portraits/therizino.png',
            arenaId: 'volcano',
            arenaName: 'Cratère du Chicxulub',
            arenaDesc: 'Lave en fusion et météores enflammés'
        },
        waves: [
            {
                waveNum: 1,
                name: 'RAVAGEURS DE CENDRES',
                count: 3,
                enemyType: 'ash_raptor',
                enemyDisplayName: 'Raptor Igné',
                hp: 260,
                speed: 7.2,
                scale: 0.62,
                color: 0xd97706,
                baseDino: 'trex'
            },
            {
                waveNum: 2,
                name: 'BERSERKERS À CORNES',
                count: 2,
                enemyType: 'magma_ceratopsian',
                enemyDisplayName: 'Guerrier Volcanique',
                hp: 480,
                speed: 7.0,
                scale: 0.85,
                color: 0xb91c1c,
                baseDino: 'pachyrhino'
            },
            {
                waveNum: 3,
                isBoss: true,
                name: 'LE TYRAN DE MAGMA',
                bossId: 'boss_pyroclast',
                bossName: 'PYROCLAST CERATOKING',
                bossTitle: 'JUGGERNAUT DU FEU & DU CHICXULUB',
                hp: 2800,
                speed: 7.2,
                scale: 1.55,
                color: 0x7f1d1d,
                accentColor: 0xf97316,
                baseDino: 'pachyrhino',
                signatureMove: 'Éruption Tellurique de Flammes & Corne Météorite',
                specialMoves: ['magma_breath', 'meteor_slam', 'flame_charge']
            }
        ]
    },
    {
        id: 5,
        slug: 'cenozoic',
        name: 'V. ÈRE CÉNOZOÏQUE',
        subtitle: 'LE GRAND GLACIER & LA FAUNE GÉANTE',
        periodYears: '66 Ma - Aujourd\'hui',
        logo: 'assets/ui/era_logos/era_5_cenozoic.png',
        arenaId: 'iceage',
        themeColor: '#38bdf8', // sky blue
        mapX: 78,
        mapY: 58,
        description: 'La planète s\'est figée dans un hiver glaciaire sans fin. Traquez les meutes de la toundra polaire et terrassez le colosse givré des monts de glace.',
        reward: {
            fighterId: 'smilodon',
            fighterName: 'Smilodon',
            fighterRole: 'Tigre à Dents de Sabre',
            fighterPortrait: 'assets/portraits/smilodon.png',
            arenaId: 'iceage',
            arenaName: 'Glacier de l\'Ère Glaciaire',
            arenaDesc: 'Blizzard en 3D, pics de glace et aurore boréale'
        },
        waves: [
            {
                waveNum: 1,
                name: 'TRAQUEURS DU BLIZZARD',
                count: 3,
                enemyType: 'frost_hound',
                enemyDisplayName: 'Loup Glaciaire',
                hp: 280,
                speed: 7.5,
                scale: 0.62,
                color: 0x0284c7,
                baseDino: 'smilodon'
            },
            {
                waveNum: 2,
                name: 'AVASSAL DU GIVRE',
                count: 2,
                enemyType: 'glacier_panther',
                enemyDisplayName: 'Félin de Glace',
                hp: 510,
                speed: 7.4,
                scale: 0.85,
                color: 0x0369a1,
                baseDino: 'smilodon'
            },
            {
                waveNum: 3,
                isBoss: true,
                name: 'LE COLOSSE DES NEIGES',
                bossId: 'boss_wendigo',
                bossName: 'FROST-GOLIATH BOREALIS',
                bossTitle: 'WENDIGO PRIMORDIAL DU BLIZZARD ÉTERNEL',
                hp: 3000,
                speed: 7.4,
                scale: 1.58,
                color: 0x0c4a6e,
                accentColor: 0x38bdf8,
                baseDino: 'giantsloth',
                signatureMove: 'Avalanche Cryogénique & Pilonnage de Stalagmites',
                specialMoves: ['ice_spikes', 'blizzard_roar', 'frost_stomp']
            }
        ]
    },
    {
        id: 6,
        slug: 'extinction',
        name: 'VI. L\'APOGÉE DE L\'EXTINCTION',
        subtitle: 'L\'AFFRONTEMENT COSMIQUE CONTRE LE DRAGON',
        periodYears: 'Temps Infini',
        logo: 'assets/ui/era_logos/era_6_extinction.png',
        arenaId: 'dragonlair',
        themeColor: '#c084fc', // purple
        mapX: 88,
        mapY: 30,
        description: 'La faille temporelle ultime. Au sommet de la caldera calcinée sommeille Drak\'Zul, le titan né des cataclysmes de toutes les extinctions terrestres.',
        reward: {
            fighterId: 'dragon',
            fighterName: 'Drak\'Zul le Dragon',
            fighterRole: 'Titan Suprême de l\'Extinction (Jouable !)',
            fighterPortrait: 'assets/portraits/dragon.png',
            arenaId: 'dragonlair',
            arenaName: 'L\'Antre Infernale de Drak\'Zul',
            arenaDesc: 'Caldera volcanique cosmique sous tempête d\'étoiles'
        },
        waves: [
            {
                waveNum: 1,
                name: 'SPECTRES DES OS CÉLESTES',
                count: 3,
                enemyType: 'void_wraith',
                enemyDisplayName: 'Ombre d\'Extinction',
                hp: 320,
                speed: 7.6,
                scale: 0.65,
                color: 0x7e22ce,
                baseDino: 'quetzal'
            },
            {
                waveNum: 2,
                name: 'CHAMPIONS DU NÉANT',
                count: 2,
                enemyType: 'void_champion',
                enemyDisplayName: 'Démon Tellurique',
                hp: 580,
                speed: 7.6,
                scale: 0.9,
                color: 0x6b21a8,
                baseDino: 'spinosaurus'
            },
            {
                waveNum: 3,
                isBoss: true,
                name: 'LE DRAGON DE L\'EXTINCTION',
                bossId: 'boss_drakzul',
                bossName: 'DRAK\'ZUL LE DRAGON SUPRÊME',
                bossTitle: 'L\'INCARNATION DU CHÂTIMENT DES ÈRES',
                hp: 3500,
                speed: 8.0,
                scale: 1.65,
                color: 0x581c87,
                accentColor: 0xe879f9,
                baseDino: 'dragon',
                signatureMove: 'Cataclysme Cosmique & Souffle du Néant Pourpre',
                specialMoves: ['void_fire', 'meteor_cataclysm', 'cosmic_dive']
            }
        ]
    }
];

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
            unlockFighter(era.reward.fighterId);
            unlockArena(era.reward.arenaId);
        }
    } catch (e) {
        console.warn("Could not save era progress:", e);
    }
}

function unlockArena(arenaId) {
    try {
        localStorage.setItem('ek3d_unlocked_arena_' + arenaId, 'true');
    } catch (e) {}
}

function isArenaUnlocked(arenaId) {
    // Les 2 arènes de départ sont débloquées par défaut
    if (arenaId === 'volcano' || arenaId === 'jungle') return true;
    try {
        return localStorage.getItem('ek3d_unlocked_arena_' + arenaId) === 'true';
    } catch (e) {
        return true;
    }
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
var campaignBossFighter = null;
var campaignBossHealthBarEl = null;
var campaignSmashHudRoot = null;
var campaignWaveBannerTimer = 0;
var campaignWaveAnnounceTitle = '';
var campaignWaveAnnounceSub = '';

// 4. CLASSE MINION 3D : ADVERSAIRE DE STYLE SMASH MELEE
class EraMinion3D {
    constructor(def, spawnX, arenaGroundY = 0) {
        this.def = def;
        this.x = spawnX;
        this.y = arenaGroundY;
        this.groundY = arenaGroundY;
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
        this.attackCooldown = 0.5 + Math.random() * 1.5;
        this.isAirborne = false;

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
        const glowEyeMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });

        // Corps
        const bodyGeo = new THREE.SphereGeometry(1.0, 8, 8);
        bodyGeo.scale(1.2, 0.7, 0.8);
        this.bodyMesh = new THREE.Mesh(bodyGeo, mat);
        this.bodyMesh.position.y = 1.0;
        this.bodyMesh.castShadow = true;
        this.root.add(this.bodyMesh);

        // Tête & Mâchoire / Pinces
        const headGeo = new THREE.ConeGeometry(0.55, 1.1, 7);
        headGeo.rotateZ(-Math.PI / 2);
        this.headMesh = new THREE.Mesh(headGeo, mat);
        this.headMesh.position.set(0.9, 1.1, 0);
        this.bodyMesh.add(this.headMesh);

        // Yeux
        const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), glowEyeMat);
        eyeL.position.set(0.2, 0.25, 0.35);
        this.headMesh.add(eyeL);
        const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), glowEyeMat);
        eyeR.position.set(0.2, 0.25, -0.35);
        this.headMesh.add(eyeR);

        // Pattes articulées (4 pattes simples)
        this.legs = [];
        for (let i = 0; i < 4; i++) {
            const legGeo = new THREE.CylinderGeometry(0.08, 0.05, 0.9, 5);
            const leg = new THREE.Mesh(legGeo, darkMat);
            leg.position.set((i < 2 ? 0.4 : -0.4), -0.3, (i % 2 === 0 ? 0.6 : -0.6));
            leg.rotation.z = (i < 2 ? -0.3 : 0.3);
            this.bodyMesh.add(leg);
            this.legs.push(leg);
        }

        // Queue / Dard
        const tailGeo = new THREE.ConeGeometry(0.2, 1.2, 5);
        tailGeo.rotateZ(Math.PI / 2);
        this.tailMesh = new THREE.Mesh(tailGeo, darkMat);
        this.tailMesh.position.set(-1.1, 0.3, 0);
        this.bodyMesh.add(this.tailMesh);
    }

    syncPosition() {
        if (!this.root) return;
        this.root.position.set(this.x, this.y, 0);
        this.root.rotation.y = this.facing > 0 ? Math.PI / 2 : -Math.PI / 2;
    }

    takeDamage(damage, knockbackX = 0, knockbackY = 0) {
        if (this.isDead) return;
        this.hp = Math.max(0, this.hp - damage);
        this.hitStun = 0.35;
        this.vx = knockbackX;
        this.vy = knockbackY;
        this.action = 'hit';
        this.actionTimer = 0.35;

        // Flash rouge vif
        if (this.bodyMesh && this.bodyMesh.material) {
            this.bodyMesh.material.emissive.setHex(0xffffff);
            setTimeout(() => {
                if (this.bodyMesh && this.bodyMesh.material) {
                    this.bodyMesh.material.emissive.setHex(0x000000);
                }
            }, 80);
        }

        // Pop-up dégâts flottant & particules de sang
        if (typeof spawnFloatingPopup === 'function') {
            spawnFloatingPopup(this.x, `-${Math.round(damage)}`, '#ef4444');
        }
        if (typeof spawn3DBloodAndBones === 'function') {
            spawn3DBloodAndBones(this.x, this.y + 1.0, 5, false);
        }

        // Mort du minion
        if (this.hp <= 0) {
            this.die();
        }
    }

    die() {
        if (this.isDead) return;
        this.isDead = true;
        this.hp = 0;

        // Effet K.O. Smash Melee (explosion d'étincelles & son gong)
        sfx.playHit(true);
        if (typeof spawnHitSparks3D === 'function') {
            spawnHitSparks3D(this.x, this.y + 1.0, true);
        }
        if (typeof spawnFloatingPopup === 'function') {
            spawnFloatingPopup(this.x, '💥 K.O. !', '#f59e0b');
        }

        // Chance de faire tomber un objet ramassable (45% viande, 20% ambre)
        const dropRoll = Math.random();
        if (dropRoll < 0.45) {
            spawnPrehistoricPickup(this.x, this.y + 0.8, 'meat');
        } else if (dropRoll < 0.65) {
            spawnPrehistoricPickup(this.x, this.y + 0.8, 'amber');
        }

        // Retrait immédiat du minion après explosion
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

        // Physique & gravité
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        if (this.y > this.groundY) {
            this.vy -= 28.0 * dt; // gravité
            this.isAirborne = true;
        } else {
            this.y = this.groundY;
            this.vy = 0;
            this.isAirborne = false;
        }

        // Décélération du knockback
        this.vx *= (1.0 - dt * 6.0);

        // Décrémenter stun & cooldown
        if (this.hitStun > 0) {
            this.hitStun = Math.max(0, this.hitStun - dt);
            this.syncPosition();
            return;
        }

        if (this.attackCooldown > 0) {
            this.attackCooldown -= dt;
        }

        // IA du minion
        if (player && !player.isDead) {
            const dx = player.x - this.x;
            const dist = Math.abs(dx);
            this.facing = dx >= 0 ? 1 : -1;

            if (dist > 1.4) {
                // Avancer vers le joueur
                this.x += Math.sign(dx) * this.speed * dt;
                this.action = 'walk';
                // Animation de trottinement des pattes
                if (this.legs) {
                    const step = Math.sin(performance.now() * 0.015);
                    this.legs.forEach((l, idx) => {
                        l.rotation.x = (idx % 2 === 0 ? step : -step) * 0.45;
                    });
                }
            } else {
                // Attaque Smash au corps à corps
                this.action = 'attack';
                if (this.attackCooldown <= 0) {
                    this.attackCooldown = 1.1 + Math.random() * 0.8;
                    this.performAttack(player);
                }
            }
        }

        this.syncPosition();
    }

    performAttack(player) {
        // Lunge rapide
        this.vx = this.facing * 4.5;
        sfx.playWhoosh();
        // Vérifier si le coup touche le joueur
        setTimeout(() => {
            if (this.isDead || !player || player.isDead) return;
            const dist = Math.abs(player.x - this.x);
            if (dist < 1.6 && Math.abs(player.y - this.y) < 1.8) {
                const dmg = 45 + Math.random() * 25;
                if (typeof applyDamageToPlayer === 'function') {
                    applyDamageToPlayer(player, dmg, this.facing * 3.5, 3.0);
                } else {
                    player.takeDamage(dmg, false, false);
                }
                sfx.playHit(false);
                if (typeof spawnFloatingPopup === 'function') {
                    spawnFloatingPopup(player.x, `-${Math.round(dmg)}`, '#ef4444');
                }
            }
        }, 140);
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

        // Gravité et rebond au sol
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

// 6. INITIALISATION ET DÉROULEMENT D'UN NIVEAU D'ÈRE SMASH MELEE
function startCampaignEraLevel(era) {
    activeCampaignEra = era;
    currentCampaignWaveIdx = 0;
    campaignPlayerStocks = 3;
    campaignLevelScore = 0;
    campaignComboCount = 0;
    campaignActiveMinions.forEach(m => m.destroy());
    campaignActiveMinions = [];
    campaignActivePickups.forEach(p => p.destroy());
    campaignActivePickups = [];

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
    fighter1.x = -6.0;
    fighter1.y = 0;
    fighter1.groundY = 0;
    fighter1.facing = 1;

    // Pas de fighter2 classique durant les vagues de minions
    fighter2 = null;

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

function startCampaignWave(waveIdx) {
    if (!activeCampaignEra) return;
    currentCampaignWaveIdx = waveIdx;
    const wave = activeCampaignEra.waves[waveIdx];
    if (!wave) return;

    // Nettoyer les précédents minions résiduels
    campaignActiveMinions.forEach(m => m.destroy());
    campaignActiveMinions = [];

    // Annonce Smash Melee de début de vague
    campaignWaveBannerTimer = 3.2;
    campaignWaveAnnounceTitle = `VAGUE ${wave.waveNum} / 3 : ${wave.name}`;
    campaignWaveAnnounceSub = wave.isBoss ? `ALERTE : BOSS APEX ${wave.bossName}` : `ÉLIMINEZ LES MINIONS DE L'ÈRE !`;
    sfx.playGong();

    if (wave.isBoss) {
        // VAGUE 3 : APEX BOSS MONSTER !
        spawnEraBossMonster(wave);
    } else {
        // VAGUES 1 & 2 : ESSAIMS DE MINIONS
        const count = wave.count || 3;
        const groundY = typeof getArenaGroundHeight === 'function' ? getArenaGroundHeight(currentArena, 0, 0) : 0;
        for (let i = 0; i < count; i++) {
            const spawnX = 2.5 + i * 2.8;
            const minion = new EraMinion3D(wave, spawnX, groundY);
            campaignActiveMinions.push(minion);
        }
    }

    updateCampaignSmashHUD();
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
    fighter2.x = 6.2;
    fighter2.groundY = 0;
    fighter2.y = 0;
    fighter2.facing = -1;
    fighter2.scale = bossWave.scale || 1.5;
    if (fighter2.rig && fighter2.rig.root) {
        fighter2.rig.root.scale.set(fighter2.scale, fighter2.scale, fighter2.scale);
    }

    campaignBossFighter = fighter2;

    // Afficher la Colossale barre de vie du Boss
    showBossHealthBarUI(bossWave);
}

// 7. GESTION DU HUD SMASH MELEE (STOCKS, VAGUES, BARRE DE BOSS)
function mountCampaignSmashHUD(era) {
    let existing = document.getElementById('campaignSmashHUD');
    if (existing) existing.remove();

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
                            <span id="smashHudWaveIndicator" class="font-chakra font-bold text-xs text-amber-400/90 tracking-widest uppercase">VAGUE 1 / 3</span>
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
                            <span class="font-chakra text-[10px] text-stone-400 font-bold uppercase tracking-wider">SCORE SMASH</span>
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

    // Contrôles et inputs du joueur 1
    if (fighter1 && !fighter1.isDead) {
        handlePlayer1Inputs(dt);
    }

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

    // Vague terminée si tous les minions sont morts (Vagues 1 & 2)
    if (currentCampaignWaveIdx < 2 && campaignActiveMinions.length === 0 && campaignWaveBannerTimer <= 0) {
        sfx.playGong();
        startCampaignWave(currentCampaignWaveIdx + 1);
        return;
    }

    // Vague 3 (Boss) : IA du Boss
    if (currentCampaignWaveIdx === 2 && campaignBossFighter) {
        if (!campaignBossFighter.isDead) {
            updateAI(campaignBossFighter, fighter1, dt);
        }
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

    let hitAny = false;
    campaignActiveMinions.forEach(minion => {
        if (minion.isDead) return;
        const dx = minion.x - fighter1.x;
        const dist = Math.abs(dx);
        const inFront = (dx * fighter1.facing) >= -0.6;
        if (dist <= range && inFront && Math.abs(minion.y - fighter1.y) < 2.5) {
            minion.takeDamage(dmg, knockX, knockY);
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
                        <span class="font-chakra font-black text-[11px] text-amber-400 uppercase tracking-widest mb-2">🦖 NOUVEAU COMBATTANT DÉBLOQUÉ</span>
                        <div class="w-24 h-24 rounded-2xl overflow-hidden border-2 border-amber-400 shadow-md bg-stone-950 mb-2">
                            <img src="${r.fighterPortrait}" alt="${r.fighterName}" class="w-full h-full object-cover">
                        </div>
                        <span class="font-cinzel font-black text-base text-amber-100 uppercase">${r.fighterName}</span>
                        <span class="font-chakra text-xs text-stone-300 font-bold mt-0.5">${r.fighterRole}</span>
                    </div>

                    <!-- Reward 2: Unlocked Arena -->
                    <div class="flex flex-col items-center bg-stone-900/90 border border-amber-500/60 rounded-2xl p-4 shadow-lg">
                        <span class="font-chakra font-black text-[11px] text-amber-400 uppercase tracking-widest mb-2">🌋 NOUVELLE ARÈNE DÉBLOQUÉE</span>
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
