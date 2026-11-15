// Test script for Extinction Kombat 3D Campaign System
const fs = require('fs');
const path = require('path');

console.log("=== RUNNING EXTINCTION KOMBAT 3D CAMPAIGN TEST SUITE ===");

// 1. Verify all 6 Era Logos exist and have valid file sizes
const logos = [
    'assets/ui/era_logos/era_1_paleozoic.png',
    'assets/ui/era_logos/era_2_triassic.png',
    'assets/ui/era_logos/era_3_jurassic.png',
    'assets/ui/era_logos/era_4_cretaceous.png',
    'assets/ui/era_logos/era_5_cenozoic.png',
    'assets/ui/era_logos/era_6_extinction.png'
];

logos.forEach(logoPath => {
    const full = path.join(__dirname, '..', logoPath);
    if (!fs.existsSync(full)) {
        throw new Error(`Missing logo file: ${logoPath}`);
    }
    const stat = fs.statSync(full);
    if (stat.size < 1000) {
        throw new Error(`Logo file too small: ${logoPath} (${stat.size} bytes)`);
    }
    console.log(`[PASS] Logo verified: ${logoPath} (${Math.round(stat.size / 1024)} KB)`);
});

// 2. Mock browser environment
const localStorageData = {};
global.localStorage = {
    getItem: (k) => localStorageData[k] || null,
    setItem: (k, v) => { localStorageData[k] = String(v); },
    removeItem: (k) => { delete localStorageData[k]; }
};

// Mock THREE
global.THREE = {
    Group: class {
        constructor() { this.children = []; this.position = { set: () => {} }; this.rotation = {}; this.scale = { set: () => {} }; }
        add(c) { this.children.push(c); }
        remove(c) { const i = this.children.indexOf(c); if (i >= 0) this.children.splice(i, 1); }
    },
    Mesh: class { constructor(geo, mat) { this.geo = geo; this.mat = mat; this.position = { set: () => {} }; this.rotation = {}; } },
    SphereGeometry: class { constructor() {} scale() {} },
    CylinderGeometry: class { constructor() {} },
    ConeGeometry: class { constructor() {} rotateZ() {} },
    OctahedronGeometry: class { constructor() {} },
    MeshStandardMaterial: class { constructor(opt) { Object.assign(this, opt); this.emissive = { setHex: () => {} }; } },
    MeshBasicMaterial: class { constructor(opt) { Object.assign(this, opt); } }
};

global.sfx = {
    init: () => {},
    playGong: () => {},
    playHit: () => {},
    playWhoosh: () => {},
    playCooldownWarning: () => {}
};

const vm = require('vm');
global.window = global;

// Load registry.js, all js/campaign/*.js level files, and campaign-level.js
vm.runInThisContext(fs.readFileSync(path.join(__dirname, '../js/core/registry.js'), 'utf8'));
const campaignDir = path.join(__dirname, '../js/campaign');
fs.readdirSync(campaignDir).filter(f => f.endsWith('.js')).sort().forEach(file => {
    vm.runInThisContext(fs.readFileSync(path.join(campaignDir, file), 'utf8'));
});
vm.runInThisContext(fs.readFileSync(path.join(__dirname, '../js/core/campaign-level.js'), 'utf8'));

// 3. Verify CAMPAIGN_ERAS
if (!CAMPAIGN_ERAS || CAMPAIGN_ERAS.length !== 13) {
    throw new Error(`Expected 13 CAMPAIGN_ERAS, found ${CAMPAIGN_ERAS ? CAMPAIGN_ERAS.length : 0}`);
}
console.log(`[PASS] Verified 13 Campaign Eras & Sub-Eras in CAMPAIGN_ERAS array.`);

CAMPAIGN_ERAS.forEach(era => {
    if (!era.id || !era.name || !era.logo || !era.reward || !era.waves || !era.hazard) {
        throw new Error(`Incomplete era data for era ${era.id}`);
    }
    if (era.waves.length !== 3) {
        throw new Error(`Expected 3 waves for era ${era.id}, got ${era.waves.length}`);
    }
    const bossWave = era.waves[2];
    if (!bossWave.isBoss || !bossWave.bossName || !bossWave.bossTitle) {
        throw new Error(`Invalid boss wave definition in era ${era.id}`);
    }
    if (UNLOCKABLE_FIGHTER_ERAS[era.reward.fighterId] !== era.id) {
        throw new Error(`Expected UNLOCKABLE_FIGHTER_ERAS[${era.reward.fighterId}] === ${era.id}, got ${UNLOCKABLE_FIGHTER_ERAS[era.reward.fighterId]}`);
    }
    const portraitAbs = path.join(__dirname, '..', era.reward.fighterPortrait);
    if (!fs.existsSync(portraitAbs)) {
        throw new Error(`Missing portrait asset for era ${era.id}: ${era.reward.fighterPortrait}`);
    }
    console.log(`[PASS] Era ${era.id} (${era.name}): Wave 1 (${era.waves[0].name}), Wave 2 (${era.waves[1].name}), Boss (${bossWave.bossName}) | Hazard: ${era.hazard.id}`);
    console.log(`       Reward: Fighter [${era.reward.fighterName}], Arena [${era.reward.arenaName}]`);
});

const rewardFighterIds = new Set(CAMPAIGN_ERAS.map(e => e.reward.fighterId));
if (rewardFighterIds.size !== 13) {
    throw new Error(`Expected 13 unique reward fighterIds across campaign, found ${rewardFighterIds.size}`);
}
console.log(`[PASS] Verified 13 distinct unlockable fighter champions across all 13 eras.`);

// 4. Test Progression Logic
console.log("\n--- Testing Progression & Unlocks ---");
// Initially, only Era 1 should be unlocked
if (!isEraUnlocked(1)) throw new Error("Era 1 should be unlocked by default");
if (isEraUnlocked(2)) throw new Error("Era 2 should be locked initially");
if (isEraCleared(1)) throw new Error("Era 1 should not be cleared initially");
if (getEraStars(1) !== 0 || getEraHighScore(1) !== 0) throw new Error("Era 1 should start with 0 stars & 0 high score");
console.log("[PASS] Initial state: Era 1 unlocked, Era 2 locked, 0 stars.");

// Clear Eras 1 to 13 & test star/highscore persistence
for (let id = 1; id <= 13; id++) {
    clearEraProgress(id);
    saveEraPerformance(id, id % 3 === 0 ? 2 : 3, 2500 + id * 100);
    if (!isEraCleared(id)) throw new Error(`Era ${id} should be marked cleared`);
    if (id < 13 && !isEraUnlocked(id + 1)) throw new Error(`Era ${id + 1} should be unlocked after clearing Era ${id}`);
    if (getEraStars(id) < 2) throw new Error(`Era ${id} star rating not saved`);
    if (getEraHighScore(id) !== 2500 + id * 100) throw new Error(`Era ${id} high score mismatch`);
}
['anomalocaris', 'cameroceras', 'jaekelopterus', 'dunkleosteus', 'pulmonoscorpius', 'dimetrodon', 'postosuchus', 'apato', 'therizino', 'terabird', 'giantsloth', 'smilodon', 'dragon'].forEach(fid => {
    if (localStorage.getItem('ek3d_unlocked_' + fid) !== 'true') {
        throw new Error(`Expected fighter '${fid}' to be unlocked after full campaign clear`);
    }
});
['cambrian', 'swamp', 'storm', 'jungle', 'iceage', 'dragonlair'].forEach(aid => {
    if (localStorage.getItem('ek3d_unlocked_arena_' + aid) !== 'true') {
        throw new Error(`Expected arena '${aid}' to be unlocked after full campaign clear`);
    }
});
if (typeof showCampaignGameOverModal !== 'function' || typeof showEraVictoryRewardsModal !== 'function') {
    throw new Error("Expected campaign modal helpers to be defined");
}
console.log("[PASS] All 13 Eras & Sub-Eras cleared successfully! All 13 champions, 6 arenas & stars/scores verified!");

console.log("\n=== ALL TEST CHECKS PASSED PERFECTLY! ===");
