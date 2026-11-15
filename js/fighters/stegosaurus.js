/* ============================================================================
 * COMBATTANT : STÉGOSAURE (Stegosaurus Stenops)
 * Modèle 3D paléontologique stylisé "Cartoon Mature / Primal" validé sous Blender 5.2.3:
 *   - Textures PBR procédurales 1024x1024 (peau reptilienne vert mousse & émeraude,
 *     plaques pentagonales vascularisées orange solaire & cramoisi à nervures osseuses)
 *   - Dos voûté en dôme avec bassin élevé et épaules basses
 *   - Deux rangées alternées de plaques pentagonales avec liserés biseautés
 *   - Tête allongée à bec corné & thagomiseur terminal à 4 pointes d'ivoire
 * ============================================================================ */

registerFighter({
    id: 'stegosaurus',
    name: 'STÉGOSAURE',
    fullName: 'Stegosaurus Stenops',
    role: 'Sentinelle à Plaques',
    title: '« Le Mur d’Épines et de Plaques »',
    primaryColor: 0x6b6a46,
    secondaryColor: 0x4b4a31,
    accentColor: 0x8c4a2e,
    cssPrimary: '#6b6a46',
    scale: 1.08,
    previewScale: 0.88,
    stats: { pow: 92, spd: 68, def: 95 },
    maxHp: 1160,
    walkSpeed: 7.2,
    special1Name: 'Thagomiseur Caudal (H)',
    special2Name: 'Écran Thermique (T)',
    fatalityName: 'Transfixion Quadruple (R)',
    moveStyle: 'Marche quadrupède rythmée par ses doubles rangées de plaques dorsales et ses 4 pointes caudales.',
    fatalityDesc: 'Pivote à 180° et empale le torse adverse de ses 4 pointes osseuses d’un mètre avant de projeter la dépouille.',
    skins: [
        { name: 'Olive Terracotta', primary: 0x6b6a46, secondary: 0x4b4a31, accent: 0x8c4a2e, belly: 0xa9a286, isDefaultPBR: true }
    ]
}, {
    animBaseHipsY: 1.65,

    onSpecial2(attacker, defender, dist, basePow) {
        special2SeismicQuake(attacker, defender, dist, basePow);
    }
});
