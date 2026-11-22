/* ============================================================================
 * MINION DE CAMPAGNE : THÉROPODE CHASSEUR (raptor)
 * Ères 7, 8, 9 & 13 : Trias, Jurassique, Crétacé & Extinction
 * Variantes : Coelophysis, Dilophosaurus, Allosaurus, Dakotaraptor, Tyrannosaure des Cendres
 * Modèle 3D : assets/models/minions/raptor.glb
 * ============================================================================ */

registerCampaignMinion({
    id: 'raptor',
    glbId: 'raptor',
    enemyDisplayName: 'Dakotaraptor Steini',
    species: 'Coelophysis / Dilophosaurus / Allosaurus / Dakotaraptor',
    eraSlug: 'cretaceous',
    archetype: 'swarmer',
    hp: 235,
    speed: 8.0,
    scale: 0.62,
    radius: 0.75,
    color: 0xd97706,
    baseDino: 'trex',
    variants: {
        'Coelophysis Agile': {
            archetype: 'swarmer',
            hp: 210,
            speed: 7.5,
            scale: 0.62,
            color: 0xb45309,
            baseDino: 'postosuchus'
        },
        'Dilophosaurus Venimeux': {
            archetype: 'zoning',
            hp: 235,
            speed: 7.0,
            scale: 0.66,
            color: 0x16a34a,
            baseDino: 'trex'
        },
        'Allosaurus Fragilis': {
            archetype: 'swarmer',
            hp: 460,
            speed: 7.6,
            scale: 0.85,
            color: 0x15803d,
            baseDino: 'trex'
        },
        'Dakotaraptor Steini': {
            archetype: 'swarmer',
            hp: 235,
            speed: 8.0,
            scale: 0.62,
            color: 0xd97706,
            baseDino: 'trex'
        },
        'Tyrannosaure des Cendres': {
            archetype: 'brawler',
            hp: 600,
            speed: 7.7,
            scale: 0.92,
            color: 0x6b21a8,
            baseDino: 'trex'
        }
    },
    description: 'Théropode bipède prédateur doté de griffes en faucille, de mâchoires crénelées et d\'une queue balancier.'
});
