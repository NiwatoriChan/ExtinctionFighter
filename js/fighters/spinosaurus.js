/* ============================================================================
 * COMBATTANT : SPINOSAURE (Spinosaurus Aegyptiacus)
 * Modèle 3D paléontologique stylisé "Cartoon Mature / Primal" validé sous Blender 5.2.3:
 *   - Textures PBR procédurales 1024x1024 (écailles polygonales crocodiliennes cobalt,
 *     bandes fluviales sombres, contre-ombrage cyan électrique, voilure M vascularisée)
 *   - Crâne baryonychiné élancé à encoche sub-narinaire & rosette prémaxillaire à crocs coniques
 *   - Crête nasale rugueuse médiane & yeux de piscivore
 *   - Membres antérieurs musclés armés de griffes falciformes géantes
 *   - Grande voile dorsale en M à épines neurales en relief & queue natatoire en rame
 * ============================================================================ */

registerFighter({
    id: 'spinosaurus',
    name: 'SPINOSAURE',
    fullName: 'Spinosaurus Aegyptiacus',
    role: 'Léviathan du Crétacé',
    title: '« Le Carnivore Démesuré »',
    primaryColor: 0x4f5d5e,
    secondaryColor: 0x232a2c,
    accentColor: 0x8c563a,
    cssPrimary: '#4f5d5e',
    scale: 1.16,
    previewScale: 0.88,
    stats: { pow: 95, spd: 74, def: 88 },
    maxHp: 1120,
    walkSpeed: 7.6,
    special1Name: 'Tranchage Fluvial (H)',
    special2Name: 'Vague Sanglante (T)',
    fatalityName: 'Éventration du Nil (R)',
    moveStyle: 'Posture massive semi-aquatique, mâchoire de gavial à rosette, revers de grandes griffes et coups de voile.',
    fatalityDesc: 'Empale la victime de ses griffes crocodiliennes, la soulève au-dessus de sa voile dorsale et la déchiquette en deux parties.',
    skins: [
        { name: 'Nile Silt Leviathan', primary: 0x4f5d5e, secondary: 0x232a2c, accent: 0x8c563a, belly: 0x9c9b8d, isDefaultPBR: true }
    ]
}, {
    animBaseHipsY: 1.85,

    onSpecial2(attacker, defender, dist, basePow) {
        spawn3DProjectile(attacker, 'boulder');
    }
});
