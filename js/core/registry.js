/* ============================================================================
 * EXTINCTION KOMBAT 3D - MOTEUR THREE.JS COMPLET (13 COMBATTANTS, BOSS DRAGON & ARÈNES)
 * ============================================================================ */

// 1. BASE DE DONNÉES DES COMBATTANTS AVEC ANIMATIONS & FATALITÉS 3D DISTINCTES
const DINO_ROSTER = [];
const FIGHTER_IMPLS = {};
const FIGHTER_ANIMATIONS = {};
let DRAGON_BOSS = null;

function registerFighterAnimation(id, animObj) {
    if (!FIGHTER_ANIMATIONS[id]) {
        FIGHTER_ANIMATIONS[id] = {};
    }
    Object.assign(FIGHTER_ANIMATIONS[id], animObj || {});
    if (FIGHTER_IMPLS[id]) {
        Object.assign(FIGHTER_IMPLS[id], animObj || {});
    }
}
window.registerFighterAnimation = registerFighterAnimation;

// Association de chaque combattant déblocable à son Ère de Campagne
const UNLOCKABLE_FIGHTER_ERAS = {
    'anomalocaris': 1,    // Débloqué à l'Ère 1 (Cambrien - Boss jouable !)
    'postosuchus': 2,      // Débloqué à l'Ère 2 (Trias)
    'apato': 3,            // Débloqué à l'Ère 3 (Jurassique)
    'therizino': 4,        // Débloqué à l'Ère 4 (Crétacé)
    'smilodon': 5,         // Débloqué à l'Ère 5 (Cénozoïque)
    'dragon': 6            // Débloqué à l'Ère 6 (Extinction Apex - Boss jouable !)
};

// Association de chaque arène déblocable à son Ère de Campagne
const UNLOCKABLE_ARENA_ERAS = {
    'cambrian': 1,    // Récif Abyssal du Cambrien (Ère 1)
    'storm': 2,       // Canyon de l'Orage Primordial (Ère 2)
    'jungle': 3,      // Vallée d'Émeraude (Ère 3)
    'volcano': 4,     // Cratère du Chicxulub (Ère 4)
    'iceage': 5,      // Glacier de l'Ère Glaciaire (Ère 5)
    'dragonlair': 6   // L'Antre Infernale de Drak'Zul (Ère 6)
};

// Système de déblocage de combattants (persistance localStorage)
function isFighterUnlocked(fighterId) {
    if (!UNLOCKABLE_FIGHTER_ERAS[fighterId]) return true;
    try {
        const eraReq = UNLOCKABLE_FIGHTER_ERAS[fighterId];
        return localStorage.getItem('ek3d_unlocked_' + fighterId) === 'true' ||
               localStorage.getItem('ek3d_cleared_era_' + eraReq) === 'true';
    } catch (e) {
        return false;
    }
}

function unlockFighter(fighterId) {
    try {
        localStorage.setItem('ek3d_unlocked_' + fighterId, 'true');
        // Si le dragon est débloqué, l'ajouter dynamiquement au roster sélectionnable
        if (fighterId === 'dragon' && typeof DRAGON_BOSS !== 'undefined' && DRAGON_BOSS) {
            if (!DINO_ROSTER.some(d => d.id === 'dragon')) {
                DINO_ROSTER.push(DRAGON_BOSS);
            }
        }
    } catch (e) {}
}

function isArenaUnlocked(arenaId) {
    // Les arènes de départ (volcano & boneyard) sont toujours débloquées
    if (arenaId === 'volcano' || arenaId === 'boneyard') return true;
    if (!UNLOCKABLE_ARENA_ERAS[arenaId]) return true;
    try {
        const eraReq = UNLOCKABLE_ARENA_ERAS[arenaId];
        return localStorage.getItem('ek3d_unlocked_arena_' + arenaId) === 'true' ||
               localStorage.getItem('ek3d_cleared_era_' + eraReq) === 'true';
    } catch (e) {
        return true;
    }
}

function unlockArena(arenaId) {
    try {
        localStorage.setItem('ek3d_unlocked_arena_' + arenaId, 'true');
    } catch (e) {}
}

function registerFighter(data, impl) {
    if (data.isBoss) {
        DRAGON_BOSS = data;
        // Si le dragon est déjà débloqué par le joueur, le rendre sélectionnable
        if (isFighterUnlocked('dragon') && !DINO_ROSTER.some(d => d.id === 'dragon')) {
            DINO_ROSTER.push(data);
        }
    } else {
        if (UNLOCKABLE_FIGHTER_ERAS[data.id]) {
            data.isUnlockable = true;
        }
        DINO_ROSTER.push(data);
    }
    const existingAnims = FIGHTER_ANIMATIONS[data.id] || {};
    FIGHTER_IMPLS[data.id] = Object.assign({}, existingAnims, impl || {});
}

function registerBoss(data, impl) {
    data.isBoss = true;
    data.isUnlockable = true;
    DRAGON_BOSS = data;
    if (isFighterUnlocked('dragon') && !DINO_ROSTER.some(d => d.id === 'dragon')) {
        DINO_ROSTER.push(data);
    }
    const existingAnims = FIGHTER_ANIMATIONS[data.id] || {};
    FIGHTER_IMPLS[data.id] = Object.assign({}, existingAnims, impl || {});
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
    therizino: 'boneyard',
    anomalocaris: 'cambrian'
};

function getThemedArenaForFighter(fighterId) {
    return FIGHTER_THEMED_ARENAS[fighterId] || 'volcano';
}
