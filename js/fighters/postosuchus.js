/* ============================================================================
 * COMBATTANT : POSTOSUCHUS (Postosuchus Kirkpatricki)
 * Modèle 3D paléontologique stylisé "Cartoon Mature / Primal" validé sous Blender 5.2.3:
 *   - Textures PBR procédurales 1024x1024 (écailles rugueuses carmin volcanique & charbon,
 *     double rangée d'ostéodermes carénés dorsaux, balafres du Trias, ventre rose-saumon)
 *   - Silhouette de rauisuchien carnassier : crâne haut et étroit, mâchoires en tenaille
 *   - Double crête sourcilière proéminente, dents ziphodontes crénelées
 *   - Posture semi-bipède / quadrupède athlétique et queue annelée
 * ============================================================================ */

registerFighter({
    id: 'postosuchus',
    name: 'POSTOSUCHUS',
    fullName: 'Postosuchus Kirkpatricki',
    role: 'Archosaurien Carnassier',
    title: '« L’Ombre du Trias Supérieur »',
    primaryColor: 0x6e3c2a,
    secondaryColor: 0x2d1812,
    accentColor: 0x8f623d,
    cssPrimary: '#6e3c2a',
    scale: 0.92,
    previewScale: 0.92,
    stats: { pow: 91, spd: 80, def: 84 },
    maxHp: 1020,
    walkSpeed: 8.4,
    special1Name: 'Croc Mortel (H)',
    special2Name: 'Roulade Triasique (T)',
    fatalityName: 'Déchirement Préhistorique (R)',
    moveStyle: 'Démarche menaçante, bonds violents, mâchoires en étau et roulement déchiqueteur.',
    fatalityDesc: 'Broyage du cou par morsure en étau, roule sur lui-même comme un crocodile primitif pour arracher la colonne vertébrale.',
    skins: [
        { name: 'Triassic Umber Stalker', primary: 0x6e3c2a, secondary: 0x2d1812, accent: 0x8f623d, belly: 0xa68c76, isDefaultPBR: true }
    ]
}, {
    animBaseHipsY: 1.48,

    onSpecial2(attacker, defender, dist, basePow) {
        spawn3DProjectile(attacker, 'boulder');
    }
});
