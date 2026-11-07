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
        slug: 'cambrian',
        name: 'I. ÈRE DU CAMBRIEN',
        subtitle: 'L\'EXPLOSION DU VIVANT & L\'ABYSSE PRIMORDIAL',
        periodYears: '541 - 485 Ma',
        logo: 'assets/ui/era_logos/era_1_paleozoic.png',
        arenaId: 'cambrian',
        themeColor: '#0e7490', // ocean cyan / teal
        mapX: 20,
        mapY: 66,
        description: 'Plongez dans les abysses grandioses de l\'océan Cambrien, vaste carte sous-marine aux récifs étagés et geysers hydrothermaux. Terrassez le tout premier super-prédateur de l\'histoire terrestre : Anomalocaris Titan, et débloquez-le comme combattant jouable !',
        reward: {
            fighterId: 'anomalocaris',
            fighterName: 'Anomalocaris Titan',
            fighterRole: 'Super-Prédateur Radiodonte',
            fighterPortrait: 'assets/portraits/anomalocaris.png',
            arenaId: 'cambrian',
            arenaName: 'Récif Abyssal du Cambrien',
            arenaDesc: 'Vaste océan primordial avec plateaux coralliens étagés et geysers hydrothermaux'
        },
        waves: [
            {
                waveNum: 1,
                name: 'ESSAIM DE TRILOBITES ÉPINEUX',
                count: 3,
                enemyType: 'cambrian_trilobite',
                enemyDisplayName: 'Trilobite Primordial',
                hp: 210,
                speed: 5.8,
                scale: 0.58,
                color: 0x14b8a6,
                baseDino: 'anomalocaris'
            },
            {
                waveNum: 2,
                name: 'GARDE D\'OPABINIA & RADIODONTES',
                count: 2,
                enemyType: 'opabinia_radiodont_elite',
                enemyDisplayName: 'Garde Radiodonte',
                hp: 390,
                speed: 7.2,
                scale: 0.84,
                color: 0x0891b2,
                baseDino: 'anomalocaris'
            },
            {
                waveNum: 3,
                isBoss: true,
                name: 'LE TITAN RADIODONTE',
                bossId: 'boss_anomalocaris',
                bossName: 'ANOMALOCARIS TITAN',
                bossTitle: 'SUPER-PRÉDATEUR DE L\'EXPLOSION CAMBRIENNE',
                hp: 2400,
                speed: 7.4,
                scale: 1.6,
                color: 0x0e7490,
                accentColor: 0x22d3ee,
                baseDino: 'anomalocaris',
                signatureMove: 'Broyeur Raptorial & Vortex Hydro-Sismique',
                specialMoves: ['raptorial_slam', 'peytoia_vortex', 'abyssal_surge']
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
        const glowEyeMat = new THREE.MeshBasicMaterial({ color: 0x67e8f9 });
        const amberMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3 });

        if (this.def.enemyType === 'cambrian_trilobite') {
            // === VAGUE 1 : TRILOBITE PRIMORDIAL (OLENOIDES / BURGESS SHALE) ===
            // Céphalon semi-circulaire large avec épines génales
            const cephGeo = new THREE.CylinderGeometry(0.75, 0.95, 0.28, 8, 1, false, 0, Math.PI);
            cephGeo.rotateZ(-Math.PI / 2);
            cephGeo.rotateY(Math.PI / 2);
            this.bodyMesh = new THREE.Mesh(cephGeo, mat);
            this.bodyMesh.position.set(0.25, 0.35, 0);
            this.bodyMesh.castShadow = true;
            this.root.add(this.bodyMesh);

            // Épines génales latérales (Genal Spines)
            [-0.85, 0.85].forEach(z => {
                const spineGeo = new THREE.ConeGeometry(0.08, 0.75, 4);
                spineGeo.rotateZ(Math.PI / 2);
                const spine = new THREE.Mesh(spineGeo, darkMat);
                spine.position.set(-0.25, 0, z);
                this.bodyMesh.add(spine);
            });

            // Yeux à facettes en croissant
            [-0.38, 0.38].forEach(z => {
                const eye = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), glowEyeMat);
                eye.position.set(0.18, 0.16, z);
                this.bodyMesh.add(eye);
            });

            // Thorax métamérisé à 5 segments (lobes axiaux et pleuraux)
            for (let i = 0; i < 5; i++) {
                const segW = 1.35 - i * 0.16;
                const segGeo = new THREE.BoxGeometry(0.24, 0.18, segW);
                const seg = new THREE.Mesh(segGeo, i % 2 === 0 ? mat : darkMat);
                seg.position.set(-0.24 - i * 0.22, 0, 0);
                this.bodyMesh.add(seg);
            }

            // Pattes de trilobite (6 paires d'appendices biramés)
            this.legs = [];
            for (let i = 0; i < 6; i++) {
                const legGeo = new THREE.CylinderGeometry(0.04, 0.03, 0.5, 4);
                const leg = new THREE.Mesh(legGeo, darkMat);
                leg.position.set(0.2 - i * 0.18, -0.22, (i % 2 === 0 ? 0.45 : -0.45));
                leg.rotation.z = (i % 2 === 0 ? -0.4 : 0.4);
                this.bodyMesh.add(leg);
                this.legs.push(leg);
            }
        } else if (this.def.enemyType === 'opabinia_radiodont_elite') {
            // === VAGUE 2 : GARDE D'OPABINIA & RADIODONTES (5 YEUX & TROMPE RAPACE) ===
            // Corps hydrodynamique allongé
            const bodyGeo = new THREE.CylinderGeometry(0.35, 0.22, 1.6, 8);
            bodyGeo.rotateZ(Math.PI / 2);
            this.bodyMesh = new THREE.Mesh(bodyGeo, mat);
            this.bodyMesh.position.set(0, 0.55, 0);
            this.bodyMesh.castShadow = true;
            this.root.add(this.bodyMesh);

            // 5 yeux pédonculés légendaires d'Opabinia !
            const eyePositions = [
                { x: 0.65, y: 0.32, z: 0 },
                { x: 0.52, y: 0.42, z: 0.24 },
                { x: 0.52, y: 0.42, z: -0.24 },
                { x: 0.35, y: 0.38, z: 0.34 },
                { x: 0.35, y: 0.38, z: -0.34 }
            ];
            eyePositions.forEach(pos => {
                const eyeStalk = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.25, 4), darkMat);
                eyeStalk.position.set(pos.x, pos.y, pos.z);
                const eyeBulb = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 6), glowEyeMat);
                eyeBulb.position.y = 0.14;
                eyeStalk.add(eyeBulb);
                this.bodyMesh.add(eyeStalk);
            });

            // Trompe frontale rapace flexible (Nozzle) avec pince terminale
            const nozzleGroup = new THREE.Group();
            nozzleGroup.position.set(0.85, 0.05, 0);
            const probGeo = new THREE.CylinderGeometry(0.08, 0.12, 0.75, 6);
            probGeo.rotateZ(Math.PI / 2);
            const prob = new THREE.Mesh(probGeo, mat);
            prob.position.x = 0.38;
            nozzleGroup.add(prob);

            const clawL = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.25, 4), amberMat);
            clawL.position.set(0.8, 0.1, 0.08);
            clawL.rotation.z = -Math.PI / 3;
            nozzleGroup.add(clawL);
            const clawR = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.25, 4), amberMat);
            clawR.position.set(0.8, -0.1, -0.08);
            clawR.rotation.z = Math.PI / 3;
            nozzleGroup.add(clawR);
            this.bodyMesh.add(nozzleGroup);

            // Lobes natatoires latéraux
            for (let i = 0; i < 5; i++) {
                [-0.38, 0.38].forEach(z => {
                    const flap = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.04, 0.42), glowEyeMat);
                    flap.position.set(0.4 - i * 0.28, -0.05, z + (z > 0 ? 0.2 : -0.2));
                    this.bodyMesh.add(flap);
                });
            }

            // Éventail caudal (Tail fan)
            for (let f = 0; f < 3; f++) {
                const fin = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, 0.2), darkMat);
                fin.position.set(-0.95, 0.12 + (f * 0.08), (f - 1) * 0.25);
                fin.rotation.y = (f - 1) * 0.35;
                this.bodyMesh.add(fin);
            }
            this.legs = [];
        } else {
            // Modèle standard pour autres espèces / minions
            const bodyGeo = new THREE.SphereGeometry(1.0, 8, 8);
            bodyGeo.scale(1.2, 0.7, 0.8);
            this.bodyMesh = new THREE.Mesh(bodyGeo, mat);
            this.bodyMesh.position.y = 1.0;
            this.bodyMesh.castShadow = true;
            this.root.add(this.bodyMesh);

            const headGeo = new THREE.ConeGeometry(0.55, 1.1, 7);
            headGeo.rotateZ(-Math.PI / 2);
            this.headMesh = new THREE.Mesh(headGeo, mat);
            this.headMesh.position.set(0.9, 1.1, 0);
            this.bodyMesh.add(this.headMesh);

            const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), glowEyeMat);
            eyeL.position.set(0.2, 0.25, 0.35);
            this.headMesh.add(eyeL);
            const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), glowEyeMat);
            eyeR.position.set(0.2, 0.25, -0.35);
            this.headMesh.add(eyeR);

            this.legs = [];
            for (let i = 0; i < 4; i++) {
                const legGeo = new THREE.CylinderGeometry(0.08, 0.05, 0.9, 5);
                const leg = new THREE.Mesh(legGeo, darkMat);
                leg.position.set((i < 2 ? 0.4 : -0.4), -0.3, (i % 2 === 0 ? 0.6 : -0.6));
                leg.rotation.z = (i < 2 ? -0.3 : 0.3);
                this.bodyMesh.add(leg);
                this.legs.push(leg);
            }

            const tailGeo = new THREE.ConeGeometry(0.2, 1.2, 5);
            tailGeo.rotateZ(Math.PI / 2);
            this.tailMesh = new THREE.Mesh(tailGeo, darkMat);
            this.tailMesh.position.set(-1.1, 0.3, 0);
            this.bodyMesh.add(this.tailMesh);
        }
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

        const groundFloor = typeof getArenaGroundHeight === 'function' ? getArenaGroundHeight(currentArena, this.x, 0) : 0;
        let support = groundFloor;
        const plats = typeof getArenaPlatforms === 'function' ? getArenaPlatforms(currentArena) : [];

        for (const p of plats) {
            if (p.isJumpPad) continue;
            if (this.x >= p.xMin && this.x <= p.xMax && this.y >= p.y - 0.28) {
                if (p.y > support) support = p.y;
            }
        }

        // Activation des geysers de projection pour les minions
        if (this._geyserCd > 0) {
            this._geyserCd -= dt;
        } else {
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
        if (typeof sfx !== 'undefined' && sfx.playWhoosh) {
            sfx.playWhoosh();
        }
        // Vérifier si le coup touche le joueur
        setTimeout(() => {
            if (this.isDead || !player || player.isDead) return;
            const dist = Math.abs(player.x - this.x);
            if (dist < 1.6 && Math.abs(player.y - this.y) < 1.8) {
                const dmg = 45 + Math.random() * 25;
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
            if (!p.isJumpPad && this.x >= p.xMin && this.x <= p.xMax && this.y >= p.y - 0.25) {
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
    fighter1.x = (currentArena === 'cambrian' || (era && era.slug === 'cambrian')) ? -16.0 : -6.0;
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
        const isCambrianStage = (currentArena === 'cambrian' || (activeCampaignEra && activeCampaignEra.slug === 'cambrian'));
        for (let i = 0; i < count; i++) {
            let spawnX = 2.5 + i * 2.8;
            if (isCambrianStage) {
                if (wave.waveNum === 1) {
                    const cW1 = [-16.0, 3.5, 17.0];
                    spawnX = cW1[i % cW1.length];
                } else {
                    const cW2 = [-13.5, 13.5];
                    spawnX = cW2[i % cW2.length];
                }
            }
            const minionGroundY = typeof getArenaGroundHeight === 'function' ? getArenaGroundHeight(currentArena, spawnX, 0) : groundY;
            const minion = new EraMinion3D(wave, spawnX, minionGroundY);
            campaignActiveMinions.push(minion);
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

    // 1. CARAPACE CÉPHALIQUE HYDRODYNAMIQUE (CEPHALON)
    const headCarapaceGeo = new THREE.ConeGeometry(0.9, 1.8, 8);
    headCarapaceGeo.rotateZ(-Math.PI / 2);
    headCarapaceGeo.scale(1.25, 0.55, 1.05);
    const headCarapace = new THREE.Mesh(headCarapaceGeo, dorsalCarapaceMat);
    headCarapace.position.set(1.15, 0.5, 0);
    headCarapace.castShadow = true;
    anomRoot.add(headCarapace);

    // Yeux composés sur pédoncules articulés (Stalked Compound Eyes)
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

    // 2. APPENDICES RAPACES SEGMENTÉS (FRONTAL RAPTORIAL APPENDAGES)
    const raptorialClaws = [];
    [-0.26, 0.26].forEach((zSign) => {
        const clawRoot = new THREE.Group();
        clawRoot.position.set(1.95, 0.3, zSign);

        let parentNode = clawRoot;
        const segmentMeshes = [];
        for (let s = 0; s < 4; s++) {
            const seg = new THREE.Group();
            seg.position.set(s === 0 ? 0 : 0.34, s === 0 ? 0 : -0.16, 0);
            seg.rotation.z = -0.32;

            const segGeo = new THREE.BoxGeometry(0.38, 0.22, 0.16);
            const segMesh = new THREE.Mesh(segGeo, chitinMat);
            segMesh.position.x = 0.18;
            segMesh.castShadow = true;
            seg.add(segMesh);

            // Épines ventrales acérées (Endites)
            const spineGeo = new THREE.ConeGeometry(0.06, 0.35 + (s * 0.08), 5);
            spineGeo.rotateZ(Math.PI);
            const spine = new THREE.Mesh(spineGeo, amberSpineMat);
            spine.position.set(0.18, -0.24, 0);
            seg.add(spine);

            parentNode.add(seg);
            parentNode = seg;
            segmentMeshes.push(seg);
        }

        anomRoot.add(clawRoot);
        raptorialClaws.push({ root: clawRoot, segments: segmentMeshes });
    });

    // 3. CÔNE ORAL CIRCULAIRE DE PEYTOIA (PEYTOIA ORAL CONE)
    const mouthGroup = new THREE.Group();
    mouthGroup.position.set(1.2, 0.08, 0);
    mouthGroup.rotation.x = Math.PI / 2;

    const oralConeOuter = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.12, 8, 24), ventralMat);
    mouthGroup.add(oralConeOuter);

    const oralCavity = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.18, 16), darkMouthMat);
    mouthGroup.add(oralCavity);

    for (let t = 0; t < 16; t++) {
        const angle = (t / 16) * Math.PI * 2;
        const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.18, 4), amberSpineMat);
        tooth.position.set(Math.cos(angle) * 0.26, 0.05, Math.sin(angle) * 0.26);
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

    // 5. 11 PAIRES DE LOBES NATATOIRES LATÉRAUX (UNDULATING SWIMMING FLAPS)
    const swimmingFlaps = [];
    const flapCount = 9;
    for (let i = 0; i < flapCount; i++) {
        const factor = (i < 3) ? (0.65 + i * 0.22) : (1.3 - (i - 3) * 0.15);
        const flapX = 0.8 - i * 0.55;

        // Lobe gauche
        const flapLGroup = new THREE.Group();
        flapLGroup.position.set(flapX, 0.38, 0.55 * factor);
        const flapLGeo = new THREE.BoxGeometry(0.52, 0.06, 0.78 * factor);
        const flapL = new THREE.Mesh(flapLGeo, glowCyanMat);
        flapL.position.z = 0.4 * factor;
        flapLGroup.add(flapL);
        anomRoot.add(flapLGroup);

        // Lobe droit
        const flapRGroup = new THREE.Group();
        flapRGroup.position.set(flapX, 0.38, -0.55 * factor);
        const flapRGeo = new THREE.BoxGeometry(0.52, 0.06, 0.78 * factor);
        const flapR = new THREE.Mesh(flapRGeo, glowCyanMat);
        flapR.position.z = -0.4 * factor;
        flapRGroup.add(flapR);
        anomRoot.add(flapRGroup);

        swimmingFlaps.push({ left: flapLGroup, right: flapRGroup, factor, index: i });
    }

    // 6. ÉVENTAIL CAUDAL TRI-LOBÉ (FURCA CAUDALE)
    const tailFanGroup = new THREE.Group();
    tailFanGroup.position.set(-4.2, 0.58, 0);
    for (let f = 0; f < 3; f++) {
        const angle = (f - 1) * 0.45;
        const bladeGeo = new THREE.BoxGeometry(1.2, 0.06, 0.35);
        bladeGeo.rotateY(angle);
        const blade = new THREE.Mesh(bladeGeo, glowCyanMat);
        blade.position.set(-0.55, 0.2 + Math.abs(f - 1) * 0.15, (f - 1) * 0.55);
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
        anom.tailFanGroup.rotation.z = Math.cos(time * 3.2) * 0.08;
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
        if (typeof sfx !== 'undefined' && sfx.playGong) sfx.playGong();
        startCampaignWave(currentCampaignWaveIdx + 1);
        return;
    }

    // Vague 3 (Boss) : Surveillance du Boss & Animation Anomalocaris Titan
    if (currentCampaignWaveIdx === 2 && campaignBossFighter) {
        if (campaignBossFighter._isAnomalocaris) {
            updateAnomalocarisBossAnimations(campaignBossFighter, dt, nowSec);
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
