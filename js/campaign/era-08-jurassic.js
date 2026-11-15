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
    arenaId: 'storm',
    themeColor: '#22c55e',
    mapX: 58,
    mapY: 54,
    hazard: {
        id: 'falling_boulders',
        name: 'Chutes de Rochers',
        desc: 'Les secousses sismiques font tomber des rochers depuis la canopée.'
    },
    description: 'Sous les cieux orageux du Jurassique, affrontez les Dilophosaures, le duo Allosaurus + Stegosaurus, et terrassez le colossal Apatosaure.',
    reward: {
        fighterId: 'apato',
        fighterName: 'Apatosaure',
        fighterRole: 'Titan Sauropode Sismique',
        fighterPortrait: 'assets/portraits/apato.png',
        arenaId: 'storm',
        arenaName: 'Plaines Orageuses de Morrison',
        arenaDesc: 'Plaines jurassiques battues par des orages sismiques'
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
            name: 'DUO TAG-TEAM : ALLOSAURUS & STEGOSAURUS',
            objective: 'clear',
            members: [
                {
                    enemyType: 'raptor',
                    enemyDisplayName: 'Allosaurus Fragilis',
                    archetype: 'swarmer',
                    hp: 460,
                    speed: 7.6,
                    scale: 0.85,
                    color: 0x15803d
                },
                {
                    enemyType: 'dino_tank',
                    enemyDisplayName: 'Stegosaurus Stenops',
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
            bossName: 'APATOSAURUS AJAX TITAN',
            bossTitle: 'COLOSSE SAUROPODE DE LA FORMATION DE MORRISON',
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
