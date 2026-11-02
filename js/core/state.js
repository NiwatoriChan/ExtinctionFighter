// 3. ÉTAT GLOBAL DE L'APPLICATION
let gameMode = 'cpu'; // 'campaign', 'cpu', 'pvp', 'practice'
let aiDifficulty = 'normal';
let currentArena = 'volcano';
let activeSelectSlot = 1;
let p1ChoiceIndex = 0; // T-Rex
let p2ChoiceIndex = 1; // Pachyrhinosaure
let p1SkinIndex = 0;
let p2SkinIndex = 0;

// Mode Campagne (5 adversaires aléatoires + Boss Dragon final)
let campaignStage = 1;
let campaignOpponents = [];
const CAMPAIGN_TOTAL_STAGES = 6;

// Paramètres graphiques & affichage
let graphicsQuality = localStorage.getItem('ek3d_graphics_quality') || 'high'; // 'low', 'medium', 'high', 'ultra'
let isMatchPaused = false;

// Contrôles et états d'entrées
let matchState = 'main_menu';
const keys = {};
const touchState = { left: false, right: false, up: false, down: false, jump: false, guard: false };
const p2TouchState = { left: false, right: false, up: false, down: false, jump: false, guard: false };
const lastTapTime = { left: 0, right: 0, p2Left: 0, p2Right: 0 };

// Combattants actifs & Session de combat 3D
let fighter1 = null;
let fighter2 = null;
let roundNumber = 1;
let roundTimer = 99;
let roundTimerAccum = 0;
let projectiles3D = [];
let particles3D = [];
let xrayCinematicTimer = 0;
let xrayStage = 0;
let xrayLockPositions = null;
let fatalityFocusFighter = null;
let stateTimer = 0;
let hitstopTimer = 0;
let screenShake = 0;
