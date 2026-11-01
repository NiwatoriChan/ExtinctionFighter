/* ============================================================================
 * EXTINCTION KOMBAT 3D - MOTEUR THREE.JS COMPLET (13 COMBATTANTS, SKINS & ARÈNES ÉPIQUES)
 * ============================================================================ */

// 1. BASE DE DONNÉES DES 13 COMBATTANTS AVEC ANIMATIONS, SKINS & FATALITÉS 3D DISTINCTES
// Chaque combattant est déclaré dans son propre fichier (js/fighters/*.js) via registerFighter().
// L'ordre de chargement des <script> détermine l'ordre du roster.
const DINO_ROSTER = [];
const FIGHTER_IMPLS = {};

function registerFighter(data, impl) {
    DINO_ROSTER.push(data);
    FIGHTER_IMPLS[data.id] = impl || {};
}

// Chaque arène est déclarée dans son propre fichier (js/arenas/*.js) via registerArena().
const ARENA_LIST = [];
const ARENAS = {};

function registerArena(def) {
    ARENA_LIST.push(def);
    ARENAS[def.id] = def;
}
