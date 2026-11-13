/* ============================================================================
 * NIVEAU CAMPAGNE 4 : IV. ÈRE DU DÉVONIEN (419 - 359 Ma)
 * ============================================================================ */
registerCampaignEra({
    id: 4,
    slug: 'devonian',
    name: 'IV. ÈRE DU DÉVONIEN',
    shortLabel: 'IV. Dévonien',
    subtitle: 'L\'ÂGE DES POISSONS CUIRASSÉS',
    periodYears: '419 - 359 Ma',
    logo: 'assets/ui/era_logos/era_1_paleozoic.png',
    arenaId: 'cambrian',
    themeColor: '#2563eb',
    mapX: 30,
    mapY: 50,
    hazard: {
        id: 'deep_pressure',
        name: 'Pression Abyssale',
        desc: 'Ennemis blindés : contournez leur garde frontale ou frappez par les airs !'
    },
    description: 'Dans l\'océan du Dévonien, les requins primitifs chassent en meute et les placodermes portent une armure frontale impénétrable. Affrontez le terrifiant Dunkleosteus.',
    reward: {
        fighterId: 'spinosaurus',
        fighterName: 'Spinosaure (Chasseur Marin)',
        fighterRole: 'Prédateur Aquatique',
        fighterPortrait: 'assets/portraits/spinosaurus.png',
        arenaId: 'cambrian',
        arenaName: 'Mer Dévonienne des Placodermes',
        arenaDesc: 'Eaux profondes où rôdent requins anciens et cuirassés'
    },
    waves: [
        {
            waveNum: 1,
            name: 'MEUTE DE CLADOSELACHE',
            objective: 'clear',
            archetype: 'swarmer',
            count: 4,
            enemyType: 'shark_placoderm',
            enemyDisplayName: 'Requin Cladoselache',
            hp: 195,
            speed: 7.4,
            scale: 0.64,
            color: 0x3b82f6,
            baseDino: 'spinosaurus'
        },
        {
            waveNum: 2,
            name: 'MUR DE BOTHRIOLEPIS (BLINDAGE FRONTAL)',
            objective: 'clear',
            archetype: 'armored',
            count: 2,
            enemyType: 'bothriolepis',
            enemyDisplayName: 'Bothriolepis Cuirassé',
            hp: 430,
            speed: 5.8,
            scale: 0.88,
            color: 0x1d4ed8,
            baseDino: 'ankylo'
        },
        {
            waveNum: 3,
            isBoss: true,
            name: 'LA MÂCHOIRE D\'ACIER',
            bossId: 'boss_dunkleosteus',
            bossName: 'DUNKLEOSTEUS TERRELLI',
            bossTitle: 'TITAN PLACODERME À MÂCHOIRE GUILLOTINE',
            hp: 2350,
            speed: 7.1,
            scale: 1.50,
            color: 0x1e3a8a,
            accentColor: 0x60a5fa,
            baseDino: 'postosuchus',
            signatureMove: 'Morsure Guillotine & Charge Cuirassée',
            phase2Desc: 'À 50% PV : Frénésie de mâchoire avec armure renforcée !',
            specialMoves: ['guillotine_bite', 'armored_ram', 'depth_shockwave']
        }
    ]
});
