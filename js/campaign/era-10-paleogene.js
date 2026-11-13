/* ============================================================================
 * NIVEAU CAMPAGNE 10 : X. CÉNOZOÏQUE : PALÉOGÈNE (66 - 23 Ma)
 * ============================================================================ */
registerCampaignEra({
    id: 10,
    slug: 'paleogene',
    name: 'X. CÉNOZOÏQUE : PALÉOGÈNE',
    shortLabel: 'X. Paléogène',
    subtitle: 'SOUS-ÈRE • OISEAUX DE TERREUR & SERPENTS GÉANTS',
    periodYears: '66 - 23 Ma',
    logo: 'assets/ui/era_logos/era_5_cenozoic.png',
    arenaId: 'jungle',
    themeColor: '#10b981',
    mapX: 73,
    mapY: 66,
    hazard: {
        id: 'wind_gusts',
        name: 'Rafales Tropicales',
        desc: 'Des bourrasques de vent poussent les combattants en plein saut.'
    },
    description: 'Après la chute des dinosaures, les oiseaux géants et les serpents colossaux prennent le pouvoir. Battez le chrono face aux Hyaenodon et terrassez Kelenken !',
    reward: {
        fighterId: 'terabird',
        fighterName: 'Oiseau de Terreur (Kelenken)',
        fighterRole: 'Prédateur Aviaire Foudroyant',
        fighterPortrait: 'assets/portraits/terabird.png',
        arenaId: 'jungle',
        arenaName: 'Forêt Chaude du Paléogène',
        arenaDesc: 'Canopée dense balayée par des vents violents'
    },
    waves: [
        {
            waveNum: 1,
            name: 'CONTRE-LA-MONTRE : HYAENODON (30s)',
            objective: 'time_attack',
            duration: 30,
            archetype: 'swarmer',
            count: 3,
            enemyType: 'mammal',
            enemyDisplayName: 'Hyaenodon Féroce',
            hp: 245,
            speed: 7.8,
            scale: 0.68,
            color: 0x059669,
            baseDino: 'smilodon'
        },
        {
            waveNum: 2,
            name: 'CONSTRICTION DE TITANOBOA',
            objective: 'clear',
            archetype: 'zoning',
            count: 2,
            enemyType: 'serpent',
            enemyDisplayName: 'Titanoboa Géant',
            hp: 520,
            speed: 6.5,
            scale: 0.92,
            color: 0x047857,
            baseDino: 'postosuchus'
        },
        {
            waveNum: 3,
            isBoss: true,
            name: 'LE SEIGNEUR DE TERREUR',
            bossId: 'boss_kelenken',
            bossName: 'KELENKEN REX',
            bossTitle: 'OISEAU DE TERREUR DU PALÉOGÈNE',
            hp: 2900,
            speed: 8.0,
            scale: 1.52,
            color: 0x065f46,
            accentColor: 0x34d399,
            baseDino: 'terabird',
            signatureMove: 'Bec Couperet & Bourrasque d\'Ailes',
            phase2Desc: 'À 50% PV : vitesse d\'assaut extrême et rafales continues !',
            specialMoves: ['beak_cleaver', 'gale_wing', 'talon_dive']
        }
    ]
});
