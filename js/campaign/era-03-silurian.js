/* ============================================================================
 * NIVEAU CAMPAGNE 3 : III. ÈRE DU SILURIEN (444 - 419 Ma)
 * ============================================================================ */
registerCampaignEra({
    id: 3,
    slug: 'silurian',
    name: 'III. ÈRE DU SILURIEN',
    shortLabel: 'III. Silurien',
    subtitle: 'L\'ESSOR DES SCORPIONS DES MERS & MARÉES',
    periodYears: '444 - 419 Ma',
    logo: 'assets/ui/era_logos/era_1_paleozoic.png',
    arenaId: 'swamp',
    themeColor: '#0d9488',
    mapX: 23,
    mapY: 25,
    hazard: {
        id: 'tidal_surge',
        name: 'Marée Montante',
        desc: 'La marée monte et descend toutes les 16s, modifiant la gravité.'
    },
    description: 'À la frontière entre l\'océan et la terre ferme, survivez aux bancs de poissons cuirassés et affrontez le titan des euryptérides : Jaekelopterus.',
    reward: {
        fighterId: 'ankylo',
        fighterName: 'Ankylosaure (Égide Côtière)',
        fighterRole: 'Forteresse Cuirassée',
        fighterPortrait: 'assets/portraits/ankylo.png',
        arenaId: 'swamp',
        arenaName: 'Lagune Côtière du Silurien',
        arenaDesc: 'Estuaire à marées changeantes et bancs de vase'
    },
    waves: [
        {
            waveNum: 1,
            name: 'SURVIE : BANC D\'OSTRACODERMES (20s)',
            objective: 'survive',
            duration: 20,
            archetype: 'swarmer',
            count: 3,
            enemyType: 'jawless_fish',
            enemyDisplayName: 'Ostracoderme Cuirassé',
            hp: 165,
            speed: 6.8,
            scale: 0.62,
            color: 0x14b8a6,
            baseDino: 'anomalocaris'
        },
        {
            waveNum: 2,
            name: 'GARDE DE PTERYGOTUS',
            objective: 'clear',
            archetype: 'brawler',
            count: 2,
            enemyType: 'eurypterid',
            enemyDisplayName: 'Pterygotus Raptorial',
            hp: 410,
            speed: 7.0,
            scale: 0.88,
            color: 0x0f766e,
            baseDino: 'pulmonoscorpius'
        },
        {
            waveNum: 3,
            isBoss: true,
            name: 'LE GÉANT EURYPTÉRIDE',
            bossId: 'boss_jaekelopterus',
            bossName: 'JAEKELOPTERUS REX',
            bossTitle: 'SCORPION MARIN DE 2,5 MÈTRES',
            hp: 2250,
            speed: 7.3,
            scale: 1.45,
            color: 0x115e59,
            accentColor: 0x2dd4bf,
            baseDino: 'pulmonoscorpius',
            signatureMove: 'Pinces Broyeuses & Raz-de-Marée',
            phase2Desc: 'À 50% PV : frénésie amphibie et bonds agressifs !',
            specialMoves: ['pincer_crush', 'tidal_slam', 'scorpion_dash']
        }
    ]
});
