/* ============================================================================
 * NIVEAU CAMPAGNE 2 : II. ÈRE DE L'ORDOVICIEN (485 - 444 Ma)
 * ============================================================================ */
registerCampaignEra({
    id: 2,
    slug: 'ordovician',
    name: 'II. ÈRE DE L\'ORDOVICIEN',
    shortLabel: 'II. Ordovicien',
    subtitle: 'LE RÈGNE DES CÉPHALOPODES GÉANTS',
    periodYears: '485 - 444 Ma',
    logo: 'assets/ui/era_logos/era_1_paleozoic.png',
    arenaId: 'cambrian',
    themeColor: '#0284c7',
    mapX: 16,
    mapY: 46,
    hazard: {
        id: 'abyssal_currents',
        name: 'Courants Abyssaux',
        desc: 'Des courants marins horizontaux balaient périodiquement l\'arène.'
    },
    description: 'Les récifs profonds de l\'Ordovicien sont dominés par les nautiloïdes géants et les premiers scorpions marins. Résistez aux courants et débloquez le colosse Cameroceras.',
    reward: {
        fighterId: 'cameroceras',
        fighterName: 'Cameroceras Trentonense',
        fighterRole: 'Titan Céphalopode Abyssal',
        fighterPortrait: 'assets/portraits/cameroceras.png',
        arenaId: 'cambrian',
        arenaName: 'Récifs Profonds de l\'Ordovicien',
        arenaDesc: 'Eaux abyssales parcourues par les premiers céphalopodes géants'
    },
    waves: [
        {
            waveNum: 1,
            name: 'SALVE D\'ENDOCERAS & ORTHOCERAS',
            objective: 'clear',
            archetype: 'zoning',
            count: 4,
            enemyType: 'orthoceras',
            enemyDisplayName: 'Endoceras Cuirassé',
            hp: 190,
            speed: 6.4,
            scale: 0.62,
            color: 0x0ea5e9,
            baseDino: 'postosuchus'
        },
        {
            waveNum: 2,
            name: 'MEUTE D\'EURYPTÉRIDES : MEGALOGRAPTUS',
            objective: 'clear',
            archetype: 'armored',
            count: 2,
            enemyType: 'eurypterid',
            enemyDisplayName: 'Megalograptus Ohioensis',
            hp: 360,
            speed: 6.5,
            scale: 0.85,
            color: 0x0369a1,
            baseDino: 'pulmonoscorpius'
        },
        {
            waveNum: 3,
            isBoss: true,
            name: 'LE NAUTILOÏDE COLOSSAL',
            bossId: 'boss_cameroceras',
            bossName: 'CAMEROCERAS TRENTONENSE TITAN',
            bossTitle: 'EMPEREUR DES TÉNÈBRES ORDOVICIENNES',
            hp: 2200,
            speed: 7.0,
            scale: 1.48,
            color: 0x1e3a8a,
            accentColor: 0x38bdf8,
            baseDino: 'spinosaurus',
            signatureMove: 'Propulsion d\'Encre & Étreinte Tentaculaire',
            phase2Desc: 'À 50% PV : salves d\'encre noire et courants accélérés !',
            specialMoves: ['ink_barrage', 'tentacle_sweep', 'jet_ram']
        }
    ]
});
