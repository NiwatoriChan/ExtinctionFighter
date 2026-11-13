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
    console.log(`[PASS] Era ${era.id} (${era.name}): Wave 1 (${era.waves[0].name}), Wave 2 (${era.waves[1].name}), Boss (${bossWave.bossName}) | Hazard: ${era.hazard.id}`);
    console.log(`       Reward: Fighter [${era.reward.fighterName}], Arena [${era.reward.arenaName}]`);
});

// 4. Test Progression Logic
console.log("\n--- Testing Progression & Unlocks ---");
// Initially, only Era 1 should be unlocked
if (!isEraUnlocked(1)) throw new Error("Era 1 should be unlocked by default");
if (isEraUnlocked(2)) throw new Error("Era 2 should be locked initially");
if (isEraCleared(1)) throw new Error("Era 1 should not be cleared initially");
console.log("[PASS] Initial state: Era 1 unlocked, Era 2 locked.");

// Clear Eras 1 to 13
for (let id = 1; id <= 13; id++) {
    clearEraProgress(id);
    if (!isEraCleared(id)) throw new Error(`Era ${id} should be marked cleared`);
    if (id < 13 && !isEraUnlocked(id + 1)) throw new Error(`Era ${id + 1} should be unlocked after clearing Era ${id}`);
}
if (localStorage.getItem('ek3d_unlocked_anomalocaris') !== 'true') {
    throw new Error("Anomalocaris should be unlocked after Era 1");
}
if (localStorage.getItem('ek3d_unlocked_pulmonoscorpius') !== 'true') {
    throw new Error("Pulmonoscorpius should be unlocked after Era 5 (Carboniferous)");
}
if (localStorage.getItem('ek3d_unlocked_terabird') !== 'true') {
    throw new Error("Terror Bird should be unlocked after Era 10 (Paleogene)");
}
if (localStorage.getItem('ek3d_unlocked_giantsloth') !== 'true') {
    throw new Error("Megatherium should be unlocked after Era 11 (Neogene)");
}
if (localStorage.getItem('ek3d_unlocked_smilodon') !== 'true') {
    throw new Error("Smilodon should be unlocked after Era 12 (Quaternary)");
}
if (localStorage.getItem('ek3d_unlocked_dragon') !== 'true') {
    throw new Error("Dragon should be unlocked after Era 13");
}
console.log("[PASS] All 13 Eras & Sub-Eras cleared successfully! All champions & arenas unlocked!");

console.log("\n=== ALL TEST CHECKS PASSED PERFECTLY! ===");
