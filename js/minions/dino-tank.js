/* ============================================================================
 * MINION DE CAMPAGNE : THYRÉOPHORE BLINDÉ (dino_tank)
 * Ères 8 & 9 : Jurassique & Crétacé — Stegosaurus Stenops & Ankylosaurus Magniventris
 * Modèle 3D : assets/models/minions/dino_tank.glb
 * ============================================================================ */

registerCampaignMinion({
    id: 'dino_tank',
    glbId: 'dino_tank',
    enemyDisplayName: 'Ankylosaurus Magniventris',
    species: 'Stegosaurus / Ankylosaurus',
    eraSlug: 'cretaceous',
    archetype: 'armored',
    hp: 540,
    speed: 5.8,
    scale: 0.88,
    radius: 0.86,
    color: 0x991b1b,
    baseDino: 'ankylo',
    variants: {
        'Stegosaurus Stenops': {
            archetype: 'armored',
            hp: 520,
            speed: 6.0,
            scale: 0.88,
            color: 0x166534,
            baseDino: 'stegosaurus'
        },
        'Ankylosaurus Magniventris': {
            archetype: 'armored',
            hp: 540,
            speed: 5.8,
            scale: 0.88,
            color: 0x991b1b,
            baseDino: 'ankylo'
        }
    },
    description: 'Herbivore thyréophore lourdement caparaçonné réduisant les dégâts frontaux directs.'
});
