/* ============================================================================
 * NIVEAU CAMPAGNE 6 : VI. ÈRE DU PERMIEN (299 - 252 Ma)
 * ============================================================================ */
registerCampaignEra({
    id: 6,
    slug: 'permian',
    name: 'VI. ÈRE DU PERMIEN',
    shortLabel: 'VI. Permien',
    subtitle: 'L\'AUBE DES SYNAPSIDES & LA GRANDE EXTINCTION',
    periodYears: '299 - 252 Ma',
    logo: 'assets/ui/era_logos/era_2_triassic.png',
    arenaId: 'boneyard',
    themeColor: '#ea580c',
    mapX: 44,
    mapY: 44,
    hazard: {
        id: 'sunbeams',
        name: 'Rayons Solaires Arides',
        desc: 'Une zone de soleil mobile booste la Rage et régénère légèrement.'
    },
    description: 'Sous le soleil implacable de la Pangée, les gorgonopsiens et les scutosaures cuirassés préparent le terrain pour le seigneur à voile dorsale : Dimetrodon Rex.',
    reward: {
        fighterId: 'pachyrhino',
        fighterName: 'Pachyrhinosaure (Garde Permienne)',
        fighterRole: 'Bélier Blindé de la Pangée',
        fighterPortrait: 'assets/portraits/pachyrhino.png',
        arenaId: 'boneyard',
        arenaName: 'Cimetière Aride du Permien',
        arenaDesc: 'Désert d\'ossements sous un soleil ardent'
    },
    waves: [
        {
            waveNum: 1,
            name: 'CHASSEURS GORGONOPSIDES',
            objective: 'clear',
            archetype: 'swarmer',
            count: 3,
            enemyType: 'synapsid',
            enemyDisplayName: 'Gorgonopside Inostrancevia',
            hp: 225,
            speed: 7.3,
            scale: 0.68,
            color: 0xd97706,
            baseDino: 'smilodon'
        },
        {
            waveNum: 2,
            name: 'BASTION SCUTOSAURUS',
            objective: 'clear',
            archetype: 'armored',
            count: 2,
            enemyType: 'scutosaurus',
            enemyDisplayName: 'Scutosaurus Blindé',
            hp: 480,
            speed: 5.9,
            scale: 0.88,
            color: 0x9a3412,
            baseDino: 'ankylo'
        },
        {
            waveNum: 3,
            isBoss: true,
            name: 'LE ROI À VOILE DORSALE',
            bossId: 'boss_dimetrodon',
            bossName: 'DIMETRODON REX',
            bossTitle: 'SOUVERAIN SYNAPSIDE DU PERMIEN',
            hp: 2500,
            speed: 7.3,
            scale: 1.50,
            color: 0x7c2d12,
            accentColor: 0xfb923c,
            baseDino: 'postosuchus',
            signatureMove: 'Surcharge Solaire & Morsure Sanguinaire',
            phase2Desc: 'À 50% PV : Surcharge Solaire (+vitesse et onde thermique) !',
            specialMoves: ['solar_overdrive', 'savage_bite', 'heat_wave']
        }
    ]
});
