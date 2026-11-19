/* ============================================================================
 * NIVEAU CAMPAGNE 7 : VII. ÈRE DU TRIAS (252 - 201 Ma)
 * ============================================================================ */
registerCampaignEra({
    id: 7,
    slug: 'triassic',
    name: 'VII. ÈRE DU TRIAS',
    shortLabel: 'VII. Trias',
    subtitle: 'L\'AUBE DES ARCHOSAURES PRÉDATEURS',
    periodYears: '252 - 201 Ma',
    logo: 'assets/ui/era_logos/era_2_triassic.png',
    arenaId: 'desert',
    themeColor: '#f59e0b',
    mapX: 51,
    mapY: 22,
    hazard: {
        id: 'lightning',
        name: 'Tempête d\'Éclairs',
        desc: 'Des éclairs télégraphiés frappent périodiquement les dunes du désert.'
    },
    description: 'Les badlands arides du Trias résonnent du tonnerre des premiers grands carnassiers. Déjouez la meute de Coelophysis et domptez Fasolasuchus.',
    reward: {
        fighterId: 'postosuchus',
        fighterName: 'Postosuchus',
        fighterRole: 'Archosaurien Carnassier',
        fighterPortrait: 'assets/portraits/postosuchus.png',
        arenaId: 'desert',
        arenaName: 'Badlands Arides du Trias',
        arenaDesc: 'Dunes rouges et mesas de grès balayées par des orages secs'
    },
    waves: [
        {
            waveNum: 1,
            name: 'MEUTE DE COELOPHYSIS',
            objective: 'clear',
            archetype: 'swarmer',
            count: 4,
            enemyType: 'raptor',
            enemyDisplayName: 'Coelophysis Agile',
            hp: 210,
            speed: 7.5,
            scale: 0.62,
            color: 0xb45309,
            baseDino: 'postosuchus'
        },
        {
            waveNum: 2,
            name: 'GARDE ARCHOSAURIENNE : SAUROSUCHUS',
            objective: 'clear',
            archetype: 'brawler',
            count: 2,
            enemyType: 'triassic_hound',
            enemyDisplayName: 'Saurosuchus Galilei',
            hp: 450,
            speed: 7.3,
            scale: 0.84,
            color: 0x92400e,
            baseDino: 'postosuchus'
        },
        {
            waveNum: 3,
            isBoss: true,
            name: 'LE COLOSSE BRISEUR DE ROCHE',
            bossId: 'boss_fasolasuchus',
            bossName: 'FASOLASUCHUS TENAX TITAN',
            bossTitle: 'COLOSSE RAÏSUCHIEN DU TRIAS',
            hp: 2550,
            speed: 7.2,
            scale: 1.52,
            color: 0x78350f,
            accentColor: 0xfbbf24,
            baseDino: 'postosuchus',
            signatureMove: 'Charge Sismique & Morsure Foudroyante',
            phase2Desc: 'À 50% PV : rugissement orageux déclenchant la foudre !',
            specialMoves: ['thunder_stomp', 'savage_lunge', 'lightning_roar']
        }
    ]
});
