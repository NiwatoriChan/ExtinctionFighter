/* ============================================================================
 * COMBATTANT : DIMETRODON (Dimetrodon Grandis Impérial)
 * Demi-Boss déblocable de l'Ère 6 (Permien, 299 - 252 Ma) & Combattant Jouable
 * Propulsé par son modèle 3D .glb dédié (boss_dimetrodon) :
 * - Haute voile neurale thermorégulatrice vascularisée à épines allongées
 * - Crâne haut de synapside pélycosaure à dentition hétérodonte sécodonte
 * - Posture quadrupède robuste des badlands rouges de la Pangée
 * ============================================================================ */

registerFighter({
    id: 'dimetrodon',
    bossGlbId: 'boss_dimetrodon',
    animBaseId: 'postosuchus',
    name: 'DIMETRODON',
    fullName: 'Dimetrodon Grandis Impérial',
    role: 'Synapside Pélycosaure à Voile',
    title: '« Le Monarque Solaire du Permien »',
    primaryColor: 0xb45309,
    secondaryColor: 0x451a03,
    accentColor: 0xf97316,
    cssPrimary: '#b45309',
    scale: 1.04,
    previewScale: 0.94,
    stats: { pow: 95, spd: 82, def: 88 },
    maxHp: 1140,
    walkSpeed: 7.6,
    jumpVy: 12.3,
    special1Name: 'Éruption Solaire Thermique (H)',
    special2Name: 'Crocs Sécodontes (T)',
    fatalityName: 'Fournaise de la Pangée (R)',
    moveStyle: 'Voile neurale thermorégulatrice haute tension, démarche chaloupée puissante et dentition hétérodonte tranchante.',
    fatalityDesc: 'Accumule la chaleur solaire dans sa voile dorsale avant d\'enchaîner crocs perçants et déflagration ignée.',
    skins: [
        { name: 'Pangaea Solar Ochre', primary: 0xb45309, secondary: 0x451a03, accent: 0xf97316 },
        { name: 'Permian Basalt', primary: 0x7c2d12, secondary: 0x292524, accent: 0xfb923c }
    ]
}, {
    animBaseHipsY: 1.48,
    attackReach: 3.65,

    onSpecial(attacker, defender, dist, basePow) {
        if (typeof sfx !== 'undefined' && sfx.playRoar) sfx.playRoar(95, 0.4);
        if (typeof spawn3DProjectile === 'function') {
            spawn3DProjectile(attacker, 'dragon_fire');
        }
    },

    onSpecial2(attacker, defender, dist, basePow) {
        if (typeof spawn3DProjectile === 'function') {
            spawn3DProjectile(attacker, 'boulder');
        }
    },

    onFatality(attacker, defender, dist) {
        if (typeof sfx !== 'undefined' && sfx.playGong) sfx.playGong();
        if (typeof spawnFloatingPopup === 'function' && defender) {
            spawnFloatingPopup(defender.x, '☀️ FOURNAISE DE LA PANGÉE !', '#f97316');
        }
        if (defender && typeof spawn3DBloodAndBones === 'function') {
            spawn3DBloodAndBones(defender.x, (defender.y || 0) + 1.1, 10, true);
        }
    }
});
