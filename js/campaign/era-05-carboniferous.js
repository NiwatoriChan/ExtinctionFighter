/* ============================================================================
 * NIVEAU CAMPAGNE 5 : V. ÈRE DU CARBONIFÈRE (359 - 299 Ma)
 * ============================================================================ */
registerCampaignEra({
    id: 5,
    slug: 'carboniferous',
    name: 'V. ÈRE DU CARBONIFÈRE',
    shortLabel: 'V. Carbonifère',
    subtitle: 'FORÊTS GÉANTES & ARTHROPODES MONSTRUEUX',
    periodYears: '359 - 299 Ma',
    logo: 'assets/ui/era_logos/era_1_paleozoic.png',
    arenaId: 'swamp',
    themeColor: '#7c3aed',
    mapX: 37,
    mapY: 74,
    hazard: {
        id: 'toxic_mist',
        name: 'Brume Toxique & Hyper-Oxygène',
        desc: 'Le sol bas empoisonne lentement ; l\'oxygène pur recharge la Rage.'
    },
    description: 'Un taux d\'oxygène record donne naissance à des insectes et arachnides géants. Abattez les Meganeura volantes et terrassez Pulmonoscorpius.',
    reward: {
        fighterId: 'pulmonoscorpius',
        fighterName: 'Pulmonoscorpius',
        fighterRole: 'Scorpion Géant Venimeux',
        fighterPortrait: 'assets/portraits/pulmonoscorpius.png',
        arenaId: 'swamp',
        arenaName: 'Marécage du Carbonifère',
        arenaDesc: 'Jungle houillère saturée d\'oxygène et de brumes toxiques'
    },
    waves: [
        {
            waveNum: 1,
            name: 'ESSAIM AÉRIEN DE MEGANEURA',
            objective: 'clear',
            archetype: 'aerial',
            count: 4,
            enemyType: 'meganeura',
            enemyDisplayName: 'Libellule Meganeura',
            hp: 185,
            speed: 7.0,
            scale: 0.65,
            color: 0x10b981,
            baseDino: 'quetzal'
        },
        {
            waveNum: 2,
            name: 'BLINDÉS ARTHROPLEURA',
            objective: 'clear',
            archetype: 'armored',
            count: 2,
            enemyType: 'arthropleura',
            enemyDisplayName: 'Arthropleura Géant',
            hp: 460,
            speed: 6.2,
            scale: 0.92,
            color: 0x6d28d9,
            baseDino: 'pulmonoscorpius'
        },
        {
            waveNum: 3,
            isBoss: true,
            name: 'L\'EMPEREUR VENIMEUX',
            bossId: 'boss_pulmonoscorpius',
            bossName: 'PULMONOSCORPIUS GIGAS',
            bossTitle: 'TERREUR CHITINEUSE DU CARBONIFÈRE',
            hp: 2400,
            speed: 7.4,
            scale: 1.50,
            color: 0x581c87,
            accentColor: 0xc084fc,
            baseDino: 'pulmonoscorpius',
            signatureMove: 'Dard Neurotoxique & Pluie d\'Acide',
            phase2Desc: 'À 50% PV : projection de globes venimeux !',
            specialMoves: ['venom_sting', 'acid_orb', 'pincer_slam']
        }
    ]
});
