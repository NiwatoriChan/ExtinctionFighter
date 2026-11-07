// 3. ÉTAT GLOBAL DE L'APPLICATION
var gameMode = 'cpu'; // 'campaign', 'cpu', 'pvp', 'practice'
var aiDifficulty = 'normal';
var currentArena = 'volcano';
var activeSelectSlot = 1;
var p1ChoiceIndex = 0; // T-Rex
var p2ChoiceIndex = 1; // Pachyrhinosaure
var p1SkinIndex = 0;
var p2SkinIndex = 0;

// Mode Campagne (5 adversaires aléatoires + Boss Dragon final)
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
var projectiles3D = [];
var particles3D = [];
var xrayCinematicTimer = 0;
var xrayStage = 0;
var xrayLockPositions = null;
var fatalityFocusFighter = null;
var stateTimer = 0;
var hitstopTimer = 0;
var screenShake = 0;
