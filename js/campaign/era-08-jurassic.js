/* ============================================================================
 * NIVEAU CAMPAGNE 8 : VIII. ÈRE JURASSIQUE (201 - 145 Ma)
 * ============================================================================ */
registerCampaignEra({
    id: 8,
    slug: 'jurassic',
    name: 'VIII. ÈRE JURASSIQUE',
    shortLabel: 'VIII. Jurassique',
    subtitle: 'LE RÈGNE DES GÉANTS & DUOS TACTIQUES',
    periodYears: '201 - 145 Ma',
    logo: 'assets/ui/era_logos/era_3_jurassic.png',
    arenaId: 'jungle',
    themeColor: '#22c55e',
    mapX: 58,
    mapY: 54,
    hazard: {
        id: 'falling_boulders',
        name: 'Chutes de Rochers',
        desc: 'Les secousses sismiques font tomber des rochers depuis la canopée.'
    },
    description: 'La canopée luxuriante abrite cracheurs de venin, duos coordonnés d\'Allosaures et Stégosaures, et le colossal titan tellurique.',
    reward: {
        fighterId: 'apato',
        fighterName: 'Apatosaure',
        fighterRole: 'Titan Sauropode Sismique',
        fighterPortrait: 'assets/portraits/apato.png',
        arenaId: 'jungle',
        arenaName: 'Vallée d\'Émeraude',
        arenaDesc: 'Jungle tropicale luxuriante et cascades primordiales'
    },
    waves: [
        {
            waveNum: 1,
            name: 'CRACHEURS DILOPHOSAURUS',
            objective: 'clear',
            archetype: 'zoning',
            count: 3,
            enemyType: 'raptor',
            enemyDisplayName: 'Dilophosaurus Venimeux',
            hp: 235,
            speed: 7.0,
            scale: 0.66,
            color: 0x16a34a,
            baseDino: 'trex'
        },
        {
            waveNum: 2,
            name: 'DUO TAG-TEAM : ALLOSAURE & STÉGOSAURE',
            objective: 'clear',
            members: [
                {
                    enemyType: 'raptor',
                    enemyDisplayName: 'Allosaurus Chasseur',
                    archetype: 'swarmer',
                    hp: 460,
                    speed: 7.6,
                    scale: 0.85,
                    color: 0x15803d
                },
                {
                    enemyType: 'dino_tank',
                    enemyDisplayName: 'Sentinelle Thagomizer',
                    archetype: 'armored',
                    hp: 520,
                    speed: 6.0,
                    scale: 0.88,
                    color: 0x166534
                }
            ],
            baseDino: 'stegosaurus'
        },
        {
            waveNum: 3,
            isBoss: true,
            name: 'L\'ÉCRASEUR TELLURIQUE',
            bossId: 'boss_brontotitan',
            bossName: 'TITANO-COLOSSUS BRONTOR',
            bossTitle: 'L\'ÉCRASEUR TELLURIQUE DU JURASSIQUE',
            hp: 2700,
            speed: 6.6,
            scale: 1.55,
            color: 0x064e3b,
            accentColor: 0x4ade80,
            baseDino: 'apato',
            signatureMove: 'Onde Sismique Tellurique & Fouet Caudal',
            phase2Desc: 'À 50% PV : secousses faisant pleuvoir des rochers !',
            specialMoves: ['earthquake_stomp', 'tail_tornado', 'boulder_throw']
        }
    ]
});
