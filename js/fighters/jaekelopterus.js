/* ============================================================================
 * COMBATTANT : JAEKELOPTERUS (Jaekelopterus Rhenaniae Rex)
 * Boss Apex déblocable de l'Ère 3 (Silurien, 444 - 419 Ma) & Combattant Jouable
 * Propulsé par son modèle 3D .glb dédié (boss_jaekelopterus) :
 * - Carapace prosomale trapézoïdale et yeux composés marginaux du Silurien
 * - Deux chélicères raptoriales géantes à denticules cisaillants
 * - Pattes marcheuses épineuses, palettes natatoires (6e paire) et telson en glaive
 * ============================================================================ */

registerFighter({
    id: 'jaekelopterus',
    bossGlbId: 'boss_jaekelopterus',
    animBaseId: 'pulmonoscorpius',
    name: 'JAEKELOPTERUS',
    fullName: 'Jaekelopterus Rhenaniae Rex',
    role: 'Euryptéride Géant des Estuaires',
    title: '« Le Scorpion des Mers du Silurien »',
    primaryColor: 0x0d9488,
    secondaryColor: 0x134e4a,
    accentColor: 0x2dd4bf,
    cssPrimary: '#0d9488',
    scale: 1.02,
    previewScale: 0.95,
    stats: { pow: 92, spd: 88, def: 86 },
    maxHp: 1080,
    walkSpeed: 8.3,
    jumpVy: 12.6,
    special1Name: 'Vague Saumâtre (H)',
    special2Name: 'Cisaille Chélicérale (T)',
    fatalityName: 'Démembrement d\'Estuaire (R)',
    moveStyle: 'Foulée amphibie à 8 appendices, rames natatoires siluriennes et double cisaille chélicérale crénelée.',
    fatalityDesc: 'Sectionne l\'armure de son adversaire d\'un double coup de chélicères géantes avant de le projeter au fond de l\'estuaire.',
    skins: [
        { name: 'Rhenish Estuary', primary: 0x0d9488, secondary: 0x134e4a, accent: 0x2dd4bf },
        { name: 'Silurian Slate', primary: 0x115e59, secondary: 0x042f2e, accent: 0x5eead4 }
    ]
}, {
    animBaseHipsY: 0.95,
    attackReach: 3.4,

    onSpecial(attacker, defender, dist, basePow) {
        if (typeof sfx !== 'undefined' && sfx.playWhoosh) sfx.playWhoosh();
        if (typeof spawn3DProjectile === 'function') {
            spawn3DProjectile(attacker, 'hydro');
        }
    },

    onSpecial2(attacker, defender, dist, basePow) {
        if (typeof sfx !== 'undefined' && sfx.playStinger) sfx.playStinger();
        if (typeof spawn3DProjectile === 'function') {
            spawn3DProjectile(attacker, 'venom');
        }
    },

    onFatality(attacker, defender, dist) {
        if (typeof sfx !== 'undefined' && sfx.playGong) sfx.playGong();
        if (typeof spawnFloatingPopup === 'function' && defender) {
            spawnFloatingPopup(defender.x, '🦂 CISAILLE CHÉLICÉRALE !', '#2dd4bf');
        }
        if (defender && typeof spawn3DBloodAndBones === 'function') {
            spawn3DBloodAndBones(defender.x, (defender.y || 0) + 1.0, 9, true);
        }
    }
});
