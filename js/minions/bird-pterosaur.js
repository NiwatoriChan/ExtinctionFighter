/* ============================================================================
 * MINION DE CAMPAGNE : PRÉDATEUR AÉRIEN (bird_pterosaur)
 * Ères 11 & 13 : Néogène & Extinction — Argentavis Magnificens & Quetzalcoatlus des Cendres
 * Modèle 3D : assets/models/minions/bird_pterosaur.glb
 * ============================================================================ */

registerCampaignMinion({
    id: 'bird_pterosaur',
    glbId: 'bird_pterosaur',
    enemyDisplayName: 'Argentavis Magnificens',
    species: 'Argentavis Magnificens / Quetzalcoatlus',
    eraSlug: 'neogene',
    archetype: 'aerial',
    hp: 265,
    speed: 7.5,
    scale: 0.72,
    radius: 0.76,
    color: 0xca8a04,
    baseDino: 'quetzal',
    variants: {
        'Argentavis Magnificens': {
            archetype: 'aerial',
            hp: 265,
            speed: 7.5,
            scale: 0.72,
            color: 0xca8a04,
            baseDino: 'quetzal'
        },
        'Quetzalcoatlus des Cendres': {
            archetype: 'aerial',
            hp: 300,
            speed: 7.8,
            scale: 0.72,
            color: 0x7e22ce,
            baseDino: 'quetzal'
        }
    },
    description: 'Titan ailé dominant les courants thermiques et fondant en piqué sur sa cible.'
});
