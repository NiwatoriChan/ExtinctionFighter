/* ============================================================================
 * EXTINCTION KOMBAT 3D - MOTEUR THREE.JS COMPLET (13 COMBATTANTS, BOSS DRAGON & ARÈNES)
 * ============================================================================ */

// 1. BASE DE DONNÉES DES COMBATTANTS AVEC ANIMATIONS, SKINS & FATALITÉS 3D DISTINCTES
const DINO_ROSTER = [];
const FIGHTER_IMPLS = {};
let DRAGON_BOSS = null;

function registerFighter(data, impl) {
    if (data.isBoss) {
        DRAGON_BOSS = data;
    } else {
        DINO_ROSTER.push(data);
    }
    FIGHTER_IMPLS[data.id] = impl || {};
}

function registerBoss(data, impl) {
    data.isBoss = true;
    DRAGON_BOSS = data;
    FIGHTER_IMPLS[data.id] = impl || {};
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
