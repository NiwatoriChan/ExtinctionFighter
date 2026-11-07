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

global.window = global;
global.unlockFighter = (id) => { localStorage.setItem('ek3d_unlocked_' + id, 'true'); };
global.unlockArena = (id) => { localStorage.setItem('ek3d_unlocked_arena_' + id, 'true'); };

// Load campaign-level.js
const campaignLevelCode = fs.readFileSync(path.join(__dirname, '../js/core/campaign-level.js'), 'utf8');
eval(campaignLevelCode);

// 3. Verify CAMPAIGN_ERAS
if (!CAMPAIGN_ERAS || CAMPAIGN_ERAS.length !== 6) {
    throw new Error(`Expected 6 CAMPAIGN_ERAS, found ${CAMPAIGN_ERAS ? CAMPAIGN_ERAS.length : 0}`);
}
console.log(`[PASS] Verified 6 Campaign Eras in CAMPAIGN_ERAS array.`);

CAMPAIGN_ERAS.forEach(era => {
    if (!era.id || !era.name || !era.logo || !era.reward || !era.waves) {
        throw new Error(`Incomplete era data for era ${era.id}`);
    }
    if (era.waves.length !== 3) {
        throw new Error(`Expected 3 waves for era ${era.id}, got ${era.waves.length}`);
    }
    const bossWave = era.waves[2];
    if (!bossWave.isBoss || !bossWave.bossName || !bossWave.bossTitle) {
        throw new Error(`Invalid boss wave definition in era ${era.id}`);
    }
    console.log(`[PASS] Era ${era.id} (${era.name}): Wave 1 (${era.waves[0].name}), Wave 2 (${era.waves[1].name}), Boss (${bossWave.bossName} - ${bossWave.bossTitle})`);
    console.log(`       Reward: Fighter [${era.reward.fighterName}], Arena [${era.reward.arenaName}]`);
});

// 4. Test Progression Logic
console.log("\n--- Testing Progression & Unlocks ---");
// Initially, only Era 1 should be unlocked
if (!isEraUnlocked(1)) throw new Error("Era 1 should be unlocked by default");
if (isEraUnlocked(2)) throw new Error("Era 2 should be locked initially");
if (isEraCleared(1)) throw new Error("Era 1 should not be cleared initially");
console.log("[PASS] Initial state: Era 1 unlocked, Era 2 locked.");

// Clear Era 1
clearEraProgress(1);
if (!isEraCleared(1)) throw new Error("Era 1 should be marked cleared");
if (!isEraUnlocked(2)) throw new Error("Era 2 should be unlocked after clearing Era 1");
if (localStorage.getItem('ek3d_unlocked_anomalocaris') !== 'true') {
    throw new Error("Anomalocaris should be unlocked after Era 1");
}
if (localStorage.getItem('ek3d_unlocked_arena_cambrian') !== 'true') {
    throw new Error("Cambrian arena should be unlocked after Era 1");
}
console.log("[PASS] Era 1 cleared: Unlocked Era 2 + Anomalocaris Boss Character + Cambrian Abyss Arena!");

// Clear Era 2
clearEraProgress(2);
if (!isEraUnlocked(3)) throw new Error("Era 3 should be unlocked after clearing Era 2");
if (localStorage.getItem('ek3d_unlocked_postosuchus') !== 'true') {
    throw new Error("Postosuchus should be unlocked after Era 2");
}
console.log("[PASS] Era 2 cleared: Unlocked Era 3 + Postosuchus + Storm Arena!");

// Clear remaining eras
clearEraProgress(3);
clearEraProgress(4);
clearEraProgress(5);
clearEraProgress(6);
if (!isEraCleared(6)) throw new Error("Era 6 should be marked cleared");
if (localStorage.getItem('ek3d_unlocked_dragon') !== 'true') {
    throw new Error("Dragon should be unlocked after Era 6");
}
console.log("[PASS] All 6 Eras cleared successfully! Drak'Zul playable dragon unlocked!");

console.log("\n=== ALL TEST CHECKS PASSED PERFECTLY! ===");
