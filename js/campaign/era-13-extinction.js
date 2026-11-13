/* ============================================================================
 * NIVEAU CAMPAGNE 13 : XIII. L'APOGÉE DE L'EXTINCTION (Temps Infini)
 * ============================================================================ */
registerCampaignEra({
    id: 13,
    slug: 'extinction',
    name: 'XIII. L\'APOGÉE DE L\'EXTINCTION',
    shortLabel: 'XIII. Extinction',
    subtitle: 'L\'AFFRONTEMENT COSMIQUE À 3 PHASES',
    periodYears: 'Temps Infini',
    logo: 'assets/ui/era_logos/era_6_extinction.png',
    arenaId: 'dragonlair',
    themeColor: '#c084fc',
    mapX: 93,
    mapY: 26,
    hazard: {
        id: 'reality_rift',
        name: 'Faille Temporelle (Feu → Glace → Néant)',
        desc: 'Les dangers changent à chaque phase de Drak\'Zul (66% et 33% PV).'
    },
    description: 'La faille temporelle ultime. Survivez aux ombres ailées du Néant, au duo corrompu Spinosaure + T-Rex, puis affrontez Drak\'Zul à travers 3 phases cataclysmiques !',
    reward: {
        fighterId: 'dragon',
        fighterName: 'Drak\'Zul le Dragon',
        fighterRole: 'Titan Suprême de l\'Extinction (Jouable !)',
        fighterPortrait: 'assets/portraits/dragon.png',
        arenaId: 'dragonlair',
        arenaName: 'L\'Antre Infernale de Drak\'Zul',
        arenaDesc: 'Caldera volcanique cosmique sous tempête d\'étoiles'
    },
    waves: [
        {
            waveNum: 1,
            name: 'RAIDS AÉRIENS DU NÉANT',
            objective: 'clear',
            archetype: 'aerial',
            count: 3,
            enemyType: 'bird_pterosaur',
            enemyDisplayName: 'Quetzal du Néant',
            hp: 300,
            speed: 7.8,
            scale: 0.72,
            color: 0x7e22ce,
            baseDino: 'quetzal'
        },
        {
            waveNum: 2,
            name: 'DUO CORROMPU : SPINO & T-REX',
            objective: 'clear',
            members: [
                {
                    enemyType: 'raptor',
                    enemyDisplayName: 'T-Rex du Néant',
                    archetype: 'brawler',
                    hp: 600,
                    speed: 7.7,
                    scale: 0.92,
                    color: 0x6b21a8
                },
                {
                    enemyType: 'shark_placoderm',
                    enemyDisplayName: 'Spinosaure Abyssal',
                    archetype: 'armored',
                    hp: 620,
                    speed: 7.4,
                    scale: 0.94,
                    color: 0x4c1d95
                }
            ],
            baseDino: 'spinosaurus'
        },
        {
            waveNum: 3,
            isBoss: true,
            name: 'LE DRAGON DE L\'EXTINCTION',
            bossId: 'boss_drakzul',
            bossName: 'DRAK\'ZUL LE DRAGON SUPRÊME',
            bossTitle: 'L\'INCARNATION DU CHÂTIMENT DES ÈRES',
            hp: 3600,
            speed: 8.1,
            scale: 1.65,
            color: 0x581c87,
            accentColor: 0xe879f9,
            baseDino: 'dragon',
            signatureMove: 'Cataclysme Cosmique & Souffle Tri-Élémentaire',
            phase2Desc: '3 Phases (66% Glace / 33% Néant) : change l\'arène en temps réel !',
            specialMoves: ['void_fire', 'meteor_cataclysm', 'cosmic_dive']
        }
    ]
});
