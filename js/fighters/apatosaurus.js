/* ============================================================================
 * COMBATTANT : APATOSAURE (Apatosaurus Ajax)
 * Modèle 3D paléontologique stylisé "Cartoon Mature / Primal" validé sous Blender 5.2.3:
 *   - Textures PBR procédurales 1024x1024 (peau cuirassée améthyste & ardoise, plis
 *     cutanés d'éléphant, fanon ventral lilas, crête d'épines dorsales en coin)
 *   - Silhouette de titan diplodocidé : cou colossal à 3 segments & fanons ventraux
 *   - Petite tête allongée aux narines hautes & 4 piliers éléphantins à griffes
 *   - Longue queue effilée à 5 segments articulés produisant le claquement supersonique
 * ============================================================================ */

registerFighter({
    id: 'apato',
    name: 'APATOSAURE',
    fullName: 'Apatosaurus Ajax',
    role: 'Titan Sismique',
    title: '« Le Fléau des Tempêtes »',
    primaryColor: 0x615f5c,
    secondaryColor: 0x2c2b29,
    accentColor: 0x756f64,
    cssPrimary: '#615f5c',
    scale: 1.25,
    previewScale: 0.72,
    stats: { pow: 98, spd: 58, def: 94 },
    maxHp: 1250,
    walkSpeed: 6.2,
    special1Name: 'Fouet Caudal Supersonique (H)',
    special2Name: 'Piétinement Sismique (T)',
    fatalityName: 'Écrasement Titanesque (R)',
    moveStyle: 'Pas titanesque faisant trembler le sol, claquement de queue supersonique.',
    fatalityDesc: 'Dresse ses pattes antérieures dans le ciel orageux et s’abat de tout son poids de 30 tonnes, réduisant la victime en purée sous ses sabots.',
    skins: [
        { name: 'Morrison Stone Grey', primary: 0x615f5c, secondary: 0x2c2b29, accent: 0x756f64, belly: 0x9e998e, isDefaultPBR: true }
    ]
}, {
    animBaseHipsY: 2.1,
    attackReach: 4.3,

    onSpecial(attacker, defender, dist, basePow) {
        if (defender && dist < 6.4 && (typeof isWithinVerticalHitBand !== 'function' || isWithinVerticalHitBand(attacker, defender, 2.4, 1.8))) {
            applyDamage(attacker, defender, Math.round(basePow * 1.15), true, 'FOUET SUPERSONIQUE !');
        }
    },

    onSpecial2(attacker, defender, dist, basePow) {
        special2SeismicQuake(attacker, defender, dist, basePow);
    }
});
