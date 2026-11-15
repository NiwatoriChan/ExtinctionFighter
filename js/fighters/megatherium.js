/* ============================================================================
 * COMBATTANT : MÉGATHÉRIUM (Megatherium Americanum - Paresseux Géant)
 * Stylisation cartoon mature / Primal graphic comic :
 * - Cartographie PBR procédurale 1024x1024 (fourrure hirsute grossière du
 *   Pléistocène en mèches étagées, museau en cuir craquelé, griffes en kératine striée)
 * - Silhouette colossale en poire avec bassin monumental et garrot puissant
 * - Crâne massif arrondi à museau tronqué et orbites expressives
 * - Avant-bras herculéens pourvus de franges de longs poils et de 3 faux en ivoire
 * - Queue trépied massive stabilisant la posture bipède
 * - Pattes arrière columnaires pédolatérales
 * ============================================================================ */

registerFighter({
    id: 'giantsloth',
    name: 'MÉGATHÉRIUM',
    fullName: 'Megatherium Americanum',
    role: 'Paresseux Géant Béhémoth',
    title: '« La Force Brute du Pléistocène »',
    primaryColor: 0x735036,
    secondaryColor: 0x332216,
    accentColor: 0x8f7d60,
    cssPrimary: '#735036',
    scale: 1.08,
    previewScale: 0.90,
    stats: { pow: 96, spd: 70, def: 93 },
    maxHp: 1180,
    walkSpeed: 7.4,
    special1Name: 'Griffes Béhémoth (H)',
    special2Name: 'Écrasement Pectoral (T)',
    fatalityName: 'Étreinte Annihilatrice (R)',
    moveStyle: 'Posture bipède colossale et voûtée, revers de pattes herculéennes armées de griffes recourbées.',
    fatalityDesc: 'Enserre le torse de la victime dans ses avant-bras colossaux, brise la cage thoracique en deux dans une étreinte fatale avant de l’écraser au sol.',
    skins: [
        { name: 'Pampas Ground Sloth', primary: 0x735036, secondary: 0x332216, accent: 0x8f7d60, claw: 0xc8bfa6 },
        { name: 'Tundra Behemoth', primary: 0x78716c, secondary: 0x292524, accent: 0xa8a29e, claw: 0xd6d3cb }
    ]
}, {
    animBaseHipsY: 1.85,

    onSpecial2(attacker, defender, dist, basePow) {
        special2SeismicQuake(attacker, defender, dist, basePow);
    }
});
