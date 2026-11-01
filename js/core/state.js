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
