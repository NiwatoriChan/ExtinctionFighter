/* ============================================================================
 * NIVEAU CAMPAGNE 9 : IX. ÈRE CRÉTACÉE (145 - 66 Ma)
 * ============================================================================ */
registerCampaignEra({
    id: 9,
    slug: 'cretaceous',
    name: 'IX. ÈRE CRÉTACÉE',
    shortLabel: 'IX. Crétacé',
    subtitle: 'L\'IMPACT DU CHICXULUB & LA FORTERESSE',
    periodYears: '145 - 66 Ma',
    logo: 'assets/ui/era_logos/era_4_cretaceous.png',
    arenaId: 'volcano',
    themeColor: '#ef4444',
    mapX: 66,
    mapY: 28,
    hazard: {
        id: 'meteor_rain',
        name: 'Pluie de Météores Chicxulub',
        desc: 'Des météores enflammés télégraphiés s\'abattent sur le cratère.'
    },
    description: 'La Terre brûle sous l\'impact du Chicxulub. Affrontez les Vélociraptors, percez le duo blindé Ankylosaure + Tricératops, puis défiez le Tyran de Magma.',
    reward: {
        fighterId: 'therizino',
        fighterName: 'Thérizinosaure',
        fighterRole: 'Faucheuse Préhistorique',
        fighterPortrait: 'assets/portraits/therizino.png',
        arenaId: 'volcano',
        arenaName: 'Cratère du Chicxulub',
        arenaDesc: 'Lave en fusion et météores enflammés'
    },
    waves: [
        {
            waveNum: 1,
            name: 'BLITZ DE VÉLOCIRAPTORS',
            objective: 'clear',
            archetype: 'swarmer',
            count: 4,
            enemyType: 'raptor',
            enemyDisplayName: 'Vélociraptor Igné',
            hp: 235,
            speed: 8.0,
            scale: 0.62,
            color: 0xd97706,
            baseDino: 'trex'
        },
        {
            waveNum: 2,
            name: 'DUO FORTERESSE : ANKYLO & TRICÉRATOPS',
            objective: 'clear',
            members: [
                {
                    enemyType: 'dino_tank',
                    enemyDisplayName: 'Ankylosaure Cuirassé',
                    archetype: 'armored',
                    hp: 540,
                    speed: 5.8,
                    scale: 0.88,
                    color: 0x991b1b
                },
                {
                    enemyType: 'magma_ceratopsian',
                    enemyDisplayName: 'Tricératops Volcanique',
                    archetype: 'brawler',
                    hp: 500,
                    speed: 7.2,
                    scale: 0.88,
                    color: 0xb91c1c
                }
            ],
            baseDino: 'pachyrhino'
        },
        {
            waveNum: 3,
            isBoss: true,
            name: 'LE TYRAN DE MAGMA',
            bossId: 'boss_pyroclast',
            bossName: 'PYROCLAST REX-CERATOPS',
            bossTitle: 'JUGGERNAUT DU FEU & DU CHICXULUB',
            hp: 2850,
            speed: 7.3,
            scale: 1.55,
            color: 0x7f1d1d,
            accentColor: 0xf97316,
            baseDino: 'trex',
            signatureMove: 'Éruption Tellurique & Météore Chicxulub',
            phase2Desc: 'À 50% PV : orage de météores accéléré !',
            specialMoves: ['magma_breath', 'meteor_slam', 'flame_charge']
        }
    ]
});
