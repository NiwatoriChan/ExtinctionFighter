/* ============================================================================
 * COMBATTANT : OISEAU DE TERREUR (Phorusrhacos Longissimus)
 * Stylisation cartoon mature / Primal graphic comic :
 * - Cartographie PBR procédurale 1024x1024 (plumage étagé ocre-braise et charbon,
 *   bec en hache d'ambre corné lustré à pointe d'onyx crochue, tarses écaillés)
 * - Tête de rapace colossal au bec en coin démesuré et regard féroce
 * - Huppe occipitale de plumes effilées en éventail
 * - Long cou musclé en S avec crinière nucale sombre
 * - Ailes vestigiales repliées aux pennes détaillées
 * - Pattes de sprinteur hyper-développées avec griffe interne tueuse
 * ============================================================================ */

registerFighter({
    id: 'terabird',
    name: 'OISEAU DE TERREUR',
    fullName: 'Phorusrhacos Longissimus',
    role: 'Faucheur Véloce Miocène',
    title: '« La Hache Plumée du Miocène »',
    primaryColor: 0x5c4636,
    secondaryColor: 0x241b15,
    accentColor: 0xa88446,
    cssPrimary: '#6e523d',
    scale: 0.88,
    previewScale: 0.92,
    stats: { pow: 93, spd: 98, def: 70 },
    maxHp: 940,
    walkSpeed: 10.4,
    special1Name: 'Pique de Hache (H)',
    special2Name: 'Foulée Furieuse (T)',
    fatalityName: 'Trépanation Sauvage (R)',
    moveStyle: 'Sprinteur hyperkinétique bipède, frappes verticales de son bec tranchant en coin.',
    fatalityDesc: 'Assène une frappe verticale d’une violence inouïe avec son bec crochu, ouvrant le crâne adverse en deux avant de déchirer les viscères.',
    skins: [
        { name: 'Pampas Umber Hawk', primary: 0x5c4636, secondary: 0x241b15, accent: 0xa88446, neck: 0xa49480, beak: 0xa88446 },
        { name: 'Ashland Harpy', primary: 0x57534e, secondary: 0x1c1917, accent: 0x8f887d, neck: 0xbcb8b0, beak: 0x9ca3af }
    ]
}, {
    animBaseHipsY: 2.25,

    onSpecial2(attacker, defender, dist, basePow) {
        spawn3DProjectile(attacker, 'boulder');
    }
});
