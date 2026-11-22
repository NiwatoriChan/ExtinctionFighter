// 3. ÉTAT GLOBAL DE L'APPLICATION
var GAME_VERSION = 'v0.4.0.1';
var gameMode = 'cpu'; // 'campaign', 'cpu', 'pvp', 'practice'
var aiDifficulty = 'normal';
var currentArena = 'volcano';
var activeSelectSlot = 1;
var p1ChoiceIndex = 0; // T-Rex
var p2ChoiceIndex = 1; // Pachyrhinosaure
var p1SkinIndex = 0;
var p2SkinIndex = 0;

// Mode Campagne (13 Ères + transition par l'écran de sélection)
var pendingCampaignEra = null;
var campaignStage = 1;
var campaignOpponents = [];
var CAMPAIGN_TOTAL_STAGES = 6;

// Paramètres graphiques & affichage
var graphicsQuality = localStorage.getItem('ek3d_graphics_quality') || 'high'; // 'low', 'medium', 'high', 'ultra'
var isMatchPaused = false;

// Contrôles et états d'entrées
var matchState = 'main_menu';
var keys = {};
var touchState = { left: false, right: false, up: false, down: false, jump: false, guard: false };
var p2TouchState = { left: false, right: false, up: false, down: false, jump: false, guard: false };
var lastTapTime = { left: 0, right: 0, p2Left: 0, p2Right: 0, gp1Left: 0, gp1Right: 0, gp2Left: 0, gp2Right: 0 };

// Combattants actifs & Session de combat 3D
var fighter1 = null;
var fighter2 = null;
var roundNumber = 1;
var roundTimer = 99;
var roundTimerAccum = 0;
var roundIntroAnnounced = false;
var projectiles3D = [];
var particles3D = [];
// Real Super Attack & Dramatic Finish state
var superState = null; // null | { phase, timer, elapsed, beatApplied, beat, attacker, defender, spec, lockPositions, hasConnected, aoeTicks, isExtinctionFinish }
var battleTimeScale = 1.0;
var koSlowMoTimer = 0;
var koPendingData = null; // { winner, loser, isExtinctionFinish }
var stateTimer = 0;
var hitstopTimer = 0;
var hitstopTarget = null;
var screenShake = 0;
var camRecoilX = 0;
var camRecoilY = 0;
var camFovKick = 0;
