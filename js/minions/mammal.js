/* ============================================================================
 * MINION DE CAMPAGNE : CARNIVORE MAMMALIEN DU CÉNOZOÏQUE (mammal)
 * Ères 10, 11 & 12 : Paléogène, Néogène & Quaternaire
 * Variantes : Hyaenodon Horridus, Amphicyon Ingens, Aenocyon Dirus (Loup Sinistre)
 * Modèle 3D : assets/models/minions/mammal.glb
 * ============================================================================ */

registerCampaignMinion({
    id: 'mammal',
    glbId: 'mammal',
    enemyDisplayName: 'Hyaenodon Horridus',
    species: 'Hyaenodon / Amphicyon / Aenocyon Dirus',
    eraSlug: 'paleogene',
    archetype: 'swarmer',
    hp: 245,
    speed: 7.8,
    scale: 0.68,
    radius: 0.75,
    color: 0x059669,
    baseDino: 'smilodon',
    variants: {
        'Hyaenodon Horridus': {
            archetype: 'swarmer',
            hp: 245,
            speed: 7.8,
            scale: 0.68,
            color: 0x059669,
            baseDino: 'smilodon'
        },
        'Amphicyon Ingens (Chien-Ours Géant)': {
            archetype: 'armored',
            hp: 580,
            speed: 6.4,
            scale: 0.94,
            color: 0xa16207,
            baseDino: 'apato'
        },
        'Aenocyon Dirus (Loup Sinistre)': {
            archetype: 'swarmer',
            hp: 260,
            speed: 8.0,
            scale: 0.65,
            color: 0x0284c7,
            baseDino: 'smilodon'
        }
    },
    description: 'Mammifère carnassier du Cénozoïque chassant en meute avec des mâchoires broyeuses d\'os.'
});
