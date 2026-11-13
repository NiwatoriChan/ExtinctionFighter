/* ============================================================================
 * NIVEAU CAMPAGNE 11 : XI. CÉNOZOÏQUE : NÉOGÈNE (23 - 2.6 Ma)
 * ============================================================================ */
registerCampaignEra({
    id: 11,
    slug: 'neogene',
    name: 'XI. CÉNOZOÏQUE : NÉOGÈNE',
    shortLabel: 'XI. Néogène',
    subtitle: 'SOUS-ÈRE • MÉGAFAUNE TITANESQUE & RAPACES',
    periodYears: '23 - 2.6 Ma',
    logo: 'assets/ui/era_logos/era_5_cenozoic.png',
    arenaId: 'boneyard',
    themeColor: '#eab308',
    mapX: 80,
    mapY: 42,
    hazard: {
        id: 'flash_flood',
        name: 'Crue Subite',
        desc: 'Des vagues de crue balaient le sol bas toutes les 18 secondes.'
    },
    description: 'Les plaines du Néogène voient régner les condors géants Argentavis et les colosses herbivores. Repoussez les assauts aériens et abattez le Mégathérium Primordial.',
    reward: {
        fighterId: 'giantsloth',
        fighterName: 'Mégathérium',
        fighterRole: 'Colosse Paresseux Géant',
        fighterPortrait: 'assets/portraits/giantsloth.png',
        arenaId: 'boneyard',
        arenaName: 'Ravin du Néogène',
        arenaDesc: 'Canyon fossilisé sujet à des crues soudaines'
    },
    waves: [
        {
            waveNum: 1,
            name: 'RAID AÉRIEN D\'ARGENTAVIS',
            objective: 'clear',
            archetype: 'aerial',
            count: 3,
            enemyType: 'bird_pterosaur',
            enemyDisplayName: 'Condor Argentavis',
            hp: 265,
            speed: 7.5,
            scale: 0.72,
            color: 0xca8a04,
            baseDino: 'quetzal'
        },
        {
            waveNum: 2,
            name: 'COLOSSES PARACERATHERIUM',
            objective: 'clear',
            archetype: 'armored',
            count: 2,
            enemyType: 'mammal',
            enemyDisplayName: 'Paraceratherium Blindé',
            hp: 580,
            speed: 6.0,
            scale: 0.96,
            color: 0xa16207,
            baseDino: 'apato'
        },
        {
            waveNum: 3,
            isBoss: true,
            name: 'LE TITAN DU NÉOGÈNE',
            bossId: 'boss_megatherium',
            bossName: 'MEGATHERIUM COLOSSUS',
            bossTitle: 'GÉANT AUX GRIFFES SISMIQUES',
            hp: 3050,
            speed: 7.1,
            scale: 1.56,
            color: 0x713f12,
            accentColor: 0xfacc15,
            baseDino: 'giantsloth',
            signatureMove: 'Écrasement Tellurique & Griffes Broyeuses',
            phase2Desc: 'À 50% PV : ondes de choc répétées et peau durcie !',
            specialMoves: ['earth_shatter', 'claw_frenzy', 'boulder_slam']
        }
    ]
});
