/* ============================================================================
 * EXTINCTION KOMBAT 3D - MOTEUR THREE.JS COMPLET (13 COMBATTANTS, BOSS DRAGON & ARÈNES)
 * ============================================================================ */

// 1. BASE DE DONNÉES DES COMBATTANTS AVEC ANIMATIONS, SKINS & FATALITÉS 3D DISTINCTES
const DINO_ROSTER = [];
const FIGHTER_IMPLS = {};
const FIGHTER_ANIMATIONS = {};
let DRAGON_BOSS = null;

function registerFighter(data, impl) {
    if (data.isBoss) {
        DRAGON_BOSS = data;
    } else {
        DINO_ROSTER.push(data);
    }
    const existingAnims = FIGHTER_ANIMATIONS[data.id] || {};
    FIGHTER_IMPLS[data.id] = Object.assign({}, existingAnims, impl || {});
}

function registerBoss(data, impl) {
    data.isBoss = true;
    DRAGON_BOSS = data;
    const existingAnims = FIGHTER_ANIMATIONS[data.id] || {};
    FIGHTER_IMPLS[data.id] = Object.assign({}, existingAnims, impl || {});
}

function registerFighterAnimation(fighterId, animDef) {
    if (!FIGHTER_ANIMATIONS[fighterId]) {
        FIGHTER_ANIMATIONS[fighterId] = {};
    }
    Object.assign(FIGHTER_ANIMATIONS[fighterId], animDef);
    if (!FIGHTER_IMPLS[fighterId]) {
        FIGHTER_IMPLS[fighterId] = {};
    }
    Object.assign(FIGHTER_IMPLS[fighterId], animDef);
}

// Système de déblocage de combattants (persistance localStorage)
function isFighterUnlocked(fighterId) {
    if (fighterId === 'smilodon') {
        try {
            return localStorage.getItem('ek3d_unlocked_smilodon') === 'true';
        } catch (e) {
            return false;
        }
    }
    return true;
}

function unlockFighter(fighterId) {
    try {
        localStorage.setItem('ek3d_unlocked_' + fighterId, 'true');
    } catch (e) {}
}

// Chaque arène est déclarée dans son propre fichier (js/arenas/*.js) via registerArena().
const ARENA_LIST = [];
const ARENAS = {};

function registerArena(def) {
    ARENA_LIST.push(def);
    ARENAS[def.id] = def;
}

// Association thématique de chaque combattant à son arène naturelle pour le mode campagne
const FIGHTER_THEMED_ARENAS = {
    dragon: 'dragonlair',
    trex: 'volcano',
    stegosaurus: 'volcano',
    pachyrhino: 'iceage',
    smilodon: 'iceage',
    giantsloth: 'iceage',
    spinosaurus: 'swamp',
    postosuchus: 'swamp',
    pulmonoscorpius: 'swamp',
    maiasaura: 'jungle',
    terabird: 'storm',
    quetzal: 'storm',
    ankylo: 'boneyard',
    apato: 'jungle',
    therizino: 'boneyard'
};

function getThemedArenaForFighter(fighterId) {
    return FIGHTER_THEMED_ARENAS[fighterId] || 'volcano';
}
