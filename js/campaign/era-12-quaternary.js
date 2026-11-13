/* ============================================================================
 * NIVEAU CAMPAGNE 12 : XII. CÉNOZOÏQUE : QUATERNAIRE (2.6 Ma - Aujourd'hui)
 * ============================================================================ */
registerCampaignEra({
    id: 12,
    slug: 'quaternary',
    name: 'XII. CÉNOZOÏQUE : QUATERNAIRE',
    shortLabel: 'XII. Quaternaire',
    subtitle: 'SOUS-ÈRE • L\'ÂGE DE GLACE & LES DENTS DE SABRE',
    periodYears: '2.6 Ma - Aujourd\'hui',
    logo: 'assets/ui/era_logos/era_5_cenozoic.png',
    arenaId: 'iceage',
    themeColor: '#38bdf8',
    mapX: 87,
    mapY: 68,
    hazard: {
        id: 'blizzard',
        name: 'Blizzard & Glace Vive',
        desc: 'Sol glissant, rafales polaires et chutes de stalactites glacées.'
    },
    description: 'La planète se fige dans un hiver éternel. Survivez aux meutes de Loups Sinistres, domptez les Smilodons et terrassez le Colosse des Neiges.',
    reward: {
        fighterId: 'smilodon',
        fighterName: 'Smilodon',
        fighterRole: 'Tigre à Dents de Sabre',
        fighterPortrait: 'assets/portraits/smilodon.png',
        arenaId: 'iceage',
        arenaName: 'Glacier de l\'Ère Glaciaire',
        arenaDesc: 'Blizzard en 3D, pics de glace et aurore boréale'
    },
    waves: [
        {
            waveNum: 1,
            name: 'MEUTE DE LOUPS SINISTRES',
            objective: 'clear',
            archetype: 'swarmer',
            count: 4,
            enemyType: 'mammal',
            enemyDisplayName: 'Loup Sinistre (Dire Wolf)',
            hp: 260,
            speed: 8.0,
            scale: 0.65,
            color: 0x0284c7,
            baseDino: 'smilodon'
        },
        {
            waveNum: 2,
            name: 'PRÉDATEURS SMILODON',
            objective: 'clear',
            archetype: 'brawler',
            count: 2,
            enemyType: 'glacier_panther',
            enemyDisplayName: 'Smilodon des Neiges',
            hp: 540,
            speed: 7.8,
            scale: 0.88,
            color: 0x0369a1,
            baseDino: 'smilodon'
        },
        {
            waveNum: 3,
            isBoss: true,
            name: 'LE COLOSSE DES NEIGES',
            bossId: 'boss_wendigo',
            bossName: 'FROST-GOLIATH BOREALIS',
            bossTitle: 'TITAN MAMMOUTH DU BLIZZARD ÉTERNEL',
            hp: 3200,
            speed: 7.4,
            scale: 1.58,
            color: 0x0c4a6e,
            accentColor: 0x38bdf8,
            baseDino: 'giantsloth',
            signatureMove: 'Avalanche Cryogénique & Stalagmites',
            phase2Desc: 'À 50% PV : tempête de stalactites de glace !',
            specialMoves: ['ice_spikes', 'blizzard_roar', 'frost_stomp']
        }
    ]
});
