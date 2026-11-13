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

// Association de chaque combattant déblocable à son Ère de Campagne (13 Ères)
const UNLOCKABLE_FIGHTER_ERAS = {
    'anomalocaris': 1,    // Débloqué à l'Ère 1 (Cambrien - Boss jouable !)
    'pulmonoscorpius': 5, // Débloqué à l'Ère 5 (Carbonifère)
    'postosuchus': 7,     // Débloqué à l'Ère 7 (Trias)
    'apato': 8,           // Débloqué à l'Ère 8 (Jurassique)
    'therizino': 9,       // Débloqué à l'Ère 9 (Crétacé)
    'terabird': 10,       // Débloqué à l'Ère 10 (Cénozoïque : Paléogène)
    'giantsloth': 11,     // Débloqué à l'Ère 11 (Cénozoïque : Néogène)
    'smilodon': 12,       // Débloqué à l'Ère 12 (Cénozoïque : Quaternaire)
    'dragon': 13          // Débloqué à l'Ère 13 (Apogée de l'Extinction - Boss jouable !)
};

// Association de chaque arène déblocable à son Ère de Campagne
const UNLOCKABLE_ARENA_ERAS = {
    'cambrian': 1,    // Récif Abyssal du Cambrien (Ère 1)
    'swamp': 5,       // Marais du Carbonifère (Ère 5)
    'storm': 7,       // Canyon de l'Orage Primordial (Ère 7)
    'jungle': 8,      // Vallée d'Émeraude (Ère 8)
    'iceage': 12,     // Glacier de l'Ère Glaciaire (Ère 12)
    'dragonlair': 13  // L'Antre Infernale de Drak'Zul (Ère 13)
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

// Chaque niveau de campagne (Ère / Sous-Ère) est déclaré dans js/campaign/*.js via registerCampaignEra().
const CAMPAIGN_ERAS = [];

function registerCampaignEra(eraDef) {
    if (!eraDef || !eraDef.id) return;
    const existingIdx = CAMPAIGN_ERAS.findIndex(e => e.id === eraDef.id || e.slug === eraDef.slug);
    if (existingIdx >= 0) {
        CAMPAIGN_ERAS[existingIdx] = eraDef;
    } else {
        CAMPAIGN_ERAS.push(eraDef);
    }
    CAMPAIGN_ERAS.sort((a, b) => a.id - b.id);
}
if (typeof window !== 'undefined') {
    window.CAMPAIGN_ERAS = CAMPAIGN_ERAS;
    window.registerCampaignEra = registerCampaignEra;
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
