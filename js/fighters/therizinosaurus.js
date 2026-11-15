/* ============================================================================
 * COMBATTANT : THÉRIZINOSAURE (Therizinosaurus Cheloniformis)
 * Modèle 3D paléontologique stylisé "Cartoon Mature / Primal" validé sous Blender 5.2.3:
 *   - Textures PBR procédurales (plumage dense noir obsidienne & émeraudes éclatantes,
 *     rémiges étagées, collerette crème duveteuse, kératine métallique des faux)
 *   - Posture bipède dressée de bretteur préhistorique à abdomen rebondi
 *   - Long cou en S emplumé à crinière nucale & tête profilée à bec kératineux
 *   - 3 gigantesques griffes-faux d'un mètre recourbées par main à lueur spectrale
 * ============================================================================ */

registerFighter({
    id: 'therizino',
    name: 'THÉRIZINOSAURE',
    fullName: 'Therizinosaurus Cheloniformis',
    role: 'Faucheuse Préhistorique',
    title: '« Les Lames Vivantes de Mongolie »',
    primaryColor: 0x4d4238,
    secondaryColor: 0x1f1a16,
    accentColor: 0xb8aa8c,
    cssPrimary: '#5c4e41',
    scale: 1.05,
    previewScale: 0.92,
    stats: { pow: 97, spd: 75, def: 82 },
    maxHp: 1040,
    walkSpeed: 7.9,
    special1Name: 'Croix de Faucheuse (H)',
    special2Name: 'Tourbillon de Lames (T)',
    fatalityName: 'Découpe Chirurgicale (R)',
    moveStyle: 'Posture droite de bretteur, moulinets de faux d’un mètre, entailles fulgurantes en X.',
    fatalityDesc: 'Croise ses griffes géantes d’un mètre et exécute trois entailles fulgurantes en X qui découpent la cible et font voler sa tête.',
    skins: [
        { name: 'Nemegt Plumed Reaper', primary: 0x4d4238, secondary: 0x1f1a16, accent: 0xb8aa8c, claw: 0xc8bfa6, isDefaultPBR: true }
    ]
}, {
    animBaseHipsY: 2.15,

    onSpecial2(attacker, defender, dist, basePow) {
        spawn3DProjectile(attacker, 'boulder');
    }
});
