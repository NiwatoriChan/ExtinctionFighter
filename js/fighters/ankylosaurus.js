/* ============================================================================
 * COMBATTANT : ANKYLOSAURE (Ankylosaurus Magniventris)
 * Modèle 3D paléontologique stylisé "Cartoon Mature / Primal" validé sous Blender 5.2.3:
 *   - Textures PBR procédurales 1024x1024 (cuirasse d'ostéodermes vert jade & ambre,
 *     bandes transversales carénées, caputegulae crâniennes, ventre souple turquoise)
 *   - Silhouette de forteresse vivante surbaissée & frange d'épines marginales
 *   - Crâne triangulaire blindé à 4 cornes pyramidales (squamosales & jugales)
 *   - Queue raidie terminée par une lourde massue osseuse bilobée (Tail Club)
 * ============================================================================ */

registerFighter({
    id: 'ankylo',
    name: 'ANKYLOSAURE',
    fullName: 'Ankylosaurus Magniventris',
    role: 'Forteresse Vivante',
    title: '« Le Cuirassé Caudal »',
    primaryColor: 0x5a6352,
    secondaryColor: 0x3f463a,
    accentColor: 0x7a6f59,
    cssPrimary: '#5a6352',
    scale: 1.02,
    previewScale: 0.95,
    stats: { pow: 90, spd: 64, def: 99 },
    maxHp: 1200,
    walkSpeed: 6.8,
    special1Name: 'Balayage Massue (H)',
    special2Name: 'Cuirasse d’Ostéodermes (T)',
    fatalityName: 'Pulvérisation Caudale (R)',
    moveStyle: 'Démarche basse et blindée, frappe circulaire de massue osseuse caudale.',
    fatalityDesc: 'Effectue un demi-tour centrifuge avec sa massue osseuse de 50 kg, fracasse les rotules de l’opposant avant de lui aplatir la cage thoracique.',
    skins: [
        { name: 'Slate Moss Fortress', primary: 0x5a6352, secondary: 0x3f463a, accent: 0x7a6f59, belly: 0x9a9685, isDefaultPBR: true }
    ]
}, {
    animBaseHipsY: 1.35,

    onSpecial2(attacker, defender, dist, basePow) {
        spawn3DProjectile(attacker, 'boulder');
    }
});
