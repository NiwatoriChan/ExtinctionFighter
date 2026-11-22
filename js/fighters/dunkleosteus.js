/* ============================================================================
 * COMBATTANT : DUNKLEOSTEUS (Dunkleosteus Terrelli Alpha)
 * Boss Apex déblocable de l'Ère 4 (Dévonien, 419 - 359 Ma) & Combattant Jouable
 * Propulsé par son modèle 3D .glb dédié (boss_dunkleosteus) :
 * - Bouclier céphalothoracique massif en plaques osseuses dermiques articulées
 * - Lames gnathales auto-affûtées en guillotine (morsure à 8 000 PSI)
 * - Tronc fuselé pélagique, nageoires pectorales blindées et queue hétérocerque
 * ============================================================================ */

registerFighter({
    id: 'dunkleosteus',
    bossGlbId: 'boss_dunkleosteus',
    animBaseId: 'postosuchus',
    name: 'DUNKLEOSTEUS',
    fullName: 'Dunkleosteus Terrelli Alpha',
    role: 'Placoderme Cuirassé Super-Prédateur',
    title: '« La Guillotine Blindée du Dévonien »',
    primaryColor: 0x1d4ed8,
    secondaryColor: 0x0f172a,
    accentColor: 0x60a5fa,
    cssPrimary: '#1d4ed8',
    scale: 1.08,
    previewScale: 0.92,
    stats: { pow: 98, spd: 76, def: 98 },
    maxHp: 1240,
    walkSpeed: 7.2,
    jumpVy: 12.0,
    special1Name: 'Vortex d\'Aspiration (H)',
    special2Name: 'Mâchoire-Guillotine (T)',
    fatalityName: 'Cisaillement Cranio-Thoracique (R)',
    moveStyle: 'Bouclier céphalothoracique en plaques osseuses imbriquées et lames gnathales auto-affûtées à 8 000 PSI.',
    fatalityDesc: 'Broie le squelette du rival en une fraction de seconde entre ses plaques tranchantes puis expulse une onde abyssale.',
    skins: [
        { name: 'Cleveland Shale Steel', primary: 0x1d4ed8, secondary: 0x0f172a, accent: 0x60a5fa },
        { name: 'Devonian Benthic', primary: 0x1e40af, secondary: 0x172554, accent: 0x93c5fd }
    ]
}, {
    animBaseHipsY: 1.48,
    attackReach: 3.7,

    onSpecial(attacker, defender, dist, basePow) {
        if (typeof sfx !== 'undefined' && sfx.playWhoosh) sfx.playWhoosh();
        if (typeof spawn3DProjectile === 'function') {
            spawn3DProjectile(attacker, 'hydro');
        }
    },

    onSpecial2(attacker, defender, dist, basePow) {
        if (typeof spawn3DProjectile === 'function') {
            spawn3DProjectile(attacker, 'boulder');
        }
    },

    onFatality(attacker, defender, dist) {
        if (typeof sfx !== 'undefined' && sfx.playBoneCrack) sfx.playBoneCrack();
        if (typeof spawnFloatingPopup === 'function' && defender) {
            spawnFloatingPopup(defender.x, '🦈 MÂCHOIRE-GUILLOTINE !', '#60a5fa');
        }
        if (defender && typeof spawn3DBloodAndBones === 'function') {
            spawn3DBloodAndBones(defender.x, (defender.y || 0) + 1.1, 10, true);
        }
    }
});
