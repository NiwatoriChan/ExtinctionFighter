/* ============================================================================
 * COMBATTANT : PULMONOSCORPIUS (Pulmonoscorpius Kirktonensis - Scorpion Primordial)
 * Stylisation cartoon mature / Primal graphic comic :
 * - Cartographie PBR procédurale 1024x1024 (chitine ultraviolette irisée, tergites
 *   granulés aux carènes keeled, ampoule du telson venimeux incandescente)
 * - Mésosoma à 7 tergites imbriqués avec sternites ventraux
 * - Prosoma trapézoïdal pourvu d'ocelles médians et latéraux, et chélicères
 * - Pédipalpes massifs aux pinces renflées et doigts dentelés
 * - 8 pattes ambulatoires articulées aux griffes tarsales
 * - Métasoma en 5 segments carénés et dard caudal mortel
 * ============================================================================ */

registerFighter({
    id: 'pulmonoscorpius',
    name: 'PULMONOSCORPIUS',
    fullName: 'Pulmonoscorpius Kirktonensis',
    role: 'Scorpion Primordial Apex',
    title: '« L’Arachnide Venimeux du Carbonifère »',
    primaryColor: 0x453a47,
    secondaryColor: 0x1b161d,
    accentColor: 0x7d4332,
    cssPrimary: '#5c4d5e',
    scale: 0.82,
    previewScale: 0.95,
    stats: { pow: 94, spd: 88, def: 90 },
    maxHp: 1020,
    walkSpeed: 8.8,
    special1Name: 'Dard Neurotoxique (H)',
    special2Name: 'Pince Broyeuse (T)',
    fatalityName: 'Injection Mortelle (R)',
    moveStyle: 'Galop à 8 pattes chitineuses, garde de pinces dentelées et dard caudal prêt à fondre.',
    fatalityDesc: 'Verrouille la tête de la victime dans ses pinces et lui transperce le crâne de son dard caudal venimeux jusqu’à liquéfaction.',
    skins: [
        { name: 'Obsidian Chitin', primary: 0x453a47, secondary: 0x1b161d, accent: 0x7d4332, legs: 0x5c4d5e },
        { name: 'Peatland Mahogany', primary: 0xa88f7a, secondary: 0x4f3a2e, accent: 0x8c523e, legs: 0x755e4c }
    ]
}, {
    animBaseHipsY: 0.95,

    onSpecial2(attacker, defender, dist, basePow) {
        sfx.playStinger();
        spawn3DProjectile(attacker, 'venom');
    }
});
