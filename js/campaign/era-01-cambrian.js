/* ============================================================================
 * NIVEAU CAMPAGNE 1 : I. ÈRE DU CAMBRIEN (541 - 485 Ma)
 * ============================================================================ */
registerCampaignEra({
    id: 1,
    slug: 'cambrian',
    name: 'I. ÈRE DU CAMBRIEN',
    shortLabel: 'I. Cambrien',
    subtitle: 'L\'EXPLOSION DU VIVANT & L\'ABYSSE PRIMORDIAL',
    periodYears: '541 - 485 Ma',
    logo: 'assets/ui/era_logos/era_1_paleozoic.png',
    arenaId: 'cambrian',
    themeColor: '#0e7490',
    mapX: 9,
    mapY: 72,
    hazard: {
        id: 'low_gravity',
        name: 'Abysse & Geysers',
        desc: 'Gravité sous-marine légère et geysers hydrothermaux propulseurs.'
    },
    description: 'Plongez dans les abysses grandioses de l\'océan Cambrien. Esquivez les tirs d\'Opabinia, utilisez les geysers et terrassez Anomalocaris Titan.',
    reward: {
        fighterId: 'anomalocaris',
        fighterName: 'Anomalocaris Titan',
        fighterRole: 'Super-Prédateur Radiodonte',
        fighterPortrait: 'assets/portraits/anomalocaris.png',
        arenaId: 'cambrian',
        arenaName: 'Récif Abyssal du Cambrien',
        arenaDesc: 'Vaste océan primordial avec plateaux coralliens étagés et geysers'
    },
    waves: [
        {
            waveNum: 1,
            name: 'ESSAIM DE TRILOBITES ÉPINEUX',
            objective: 'clear',
            archetype: 'swarmer',
            count: 4,
            enemyType: 'cambrian_trilobite',
            enemyDisplayName: 'Trilobite Primordial',
            hp: 175,
            speed: 6.2,
            scale: 0.56,
            color: 0x14b8a6,
            baseDino: 'anomalocaris'
        },
        {
            waveNum: 2,
            name: 'GARDE D\'OPABINIA (TIR À DISTANCE)',
            objective: 'clear',
            archetype: 'zoning',
            count: 2,
            enemyType: 'opabinia_radiodont_elite',
            enemyDisplayName: 'Opabinia Regalis',
            hp: 360,
            speed: 6.8,
            scale: 0.84,
            color: 0x0891b2,
            baseDino: 'anomalocaris'
        },
        {
            waveNum: 3,
            isBoss: true,
            name: 'LE TITAN RADIODONTE',
            bossId: 'boss_anomalocaris',
            bossName: 'ANOMALOCARIS TITAN',
            bossTitle: 'SUPER-PRÉDATEUR DE L\'EXPLOSION CAMBRIENNE',
            hp: 2100,
            speed: 7.2,
            scale: 1.55,
            color: 0x0e7490,
            accentColor: 0x22d3ee,
            baseDino: 'anomalocaris',
            signatureMove: 'Broyeur Raptorial & Vortex Hydro-Sismique',
            phase2Desc: 'À 50% PV : appelle 2 Trilobites en renfort !',
            specialMoves: ['raptorial_slam', 'peytoia_vortex', 'abyssal_surge']
        }
    ]
});
