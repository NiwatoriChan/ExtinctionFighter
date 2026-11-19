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
    arenaId: 'desert',
    themeColor: '#ea580c',
    mapX: 44,
    mapY: 44,
    hazard: {
        id: 'sunbeams',
        name: 'Rayons Solaires Arides',
        desc: 'Une zone de soleil mobile booste la Rage et régénère légèrement.'
    },
    description: 'Sous le soleil implacable de la Pangée, triomphez des meutes synapsides et des scutosaures cuirassés, terrassez le Demi-Boss Dimetrodon Grandis puis affrontez le super-prédateur ultime du Permien : Gorgonopsia (Inostrancevia Rex).',
    reward: {
        fighterId: 'gorgonopsia',
        fighterName: 'Gorgonopsia (Inostrancevia)',
        fighterRole: 'Super-Prédateur Gorgonopsien',
        fighterPortrait: 'assets/portraits/gorgonopsia.png',
        extraFighterIds: ['dimetrodon'],
        extraFighterName: 'Dimetrodon Grandis',
        arenaId: 'desert',
        arenaName: 'Désert Rouge de la Pangée',
        arenaDesc: 'Dunes rouges et mesas arides du Permien balayées par les tempêtes de sable'
    },
    waves: [
        {
            waveNum: 1,
            name: 'MEUTE SYNAPSIDE : LYCAENOPS',
            objective: 'clear',
            archetype: 'swarmer',
            count: 3,
            enemyType: 'synapsid',
            enemyDisplayName: 'Lycaenops Ornatus',
            hp: 215,
            speed: 7.3,
            scale: 0.66,
            color: 0xd97706,
            baseDino: 'gorgonopsia'
        },
        {
            waveNum: 2,
            name: 'BASTION DE SCUTOSAURUS KARPINSKII',
            objective: 'clear',
            archetype: 'armored',
            count: 2,
            enemyType: 'scutosaurus',
            enemyDisplayName: 'Scutosaurus Karpinskii',
            hp: 460,
            speed: 5.9,
            scale: 0.88,
            color: 0x9a3412,
            baseDino: 'ankylo'
        },
        {
            waveNum: 3,
            isDemiBoss: true,
            isBoss: true,
            name: 'DEMI-BOSS : LE ROI À VOILE DORSALE',
            bossId: 'boss_dimetrodon',
            bossName: 'DIMETRODON GRANDIS IMPÉRIAL',
            bossTitle: 'DEMI-BOSS • SOUVERAIN À VOILE DU PERMIEN',
            hp: 1700,
            speed: 7.2,
            scale: 1.38,
            color: 0x7c2d12,
            accentColor: 0xfb923c,
            baseDino: 'dimetrodon',
            unlockFighterId: 'dimetrodon',
            signatureMove: 'Surcharge Solaire & Morsure Sanguinaire',
            phase2Desc: 'À 50% PV : Surcharge Solaire (+vitesse et météores thermiques) !',
            specialMoves: ['solar_overdrive', 'savage_bite', 'heat_wave']
        },
        {
            waveNum: 4,
            isBoss: true,
            name: 'LE SABRE-DENTS DU PERMIEN',
            bossId: 'boss_gorgonopsia',
            bossName: 'GORGONOPSIA : INOSTRANCEVIA REX',
            bossTitle: 'BOSS APEX • TERREUR SABRE-DENTS DE LA GRANDE EXTINCTION',
            hp: 2650,
            speed: 8.0,
            scale: 1.46,
            color: 0xdc2626,
            accentColor: 0xf59e0b,
            baseDino: 'gorgonopsia',
            signatureMove: 'Ruée Sabre-Dents & Crocs du Permien',
            phase2Desc: 'À 50% PV : Frénésie Sanglante (+vitesse, bond prédateur & onde solaire) !',
            specialMoves: ['saber_pounce', 'crimson_fangs', 'permian_frenzy']
        }
    ]
});
