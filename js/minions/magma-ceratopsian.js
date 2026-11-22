/* ============================================================================
 * MINION DE CAMPAGNE : CÉRATOPSIEN DE MAGMA (magma_ceratopsian)
 * Ères 9 & 13 : Crétacé & Extinction — Triceratops Horridus & Tricératops Pyroclastique
 * Modèle 3D : assets/models/minions/magma_ceratopsian.glb
 * ============================================================================ */

registerCampaignMinion({
    id: 'magma_ceratopsian',
    glbId: 'magma_ceratopsian',
    enemyDisplayName: 'Triceratops Horridus',
    species: 'Triceratops Horridus',
    eraSlug: 'cretaceous',
    archetype: 'brawler',
    hp: 500,
    speed: 7.2,
    scale: 0.88,
    radius: 0.86,
    color: 0xb91c1c,
    baseDino: 'pachyrhino',
    variants: {
        'Triceratops Horridus': {
            archetype: 'brawler',
            hp: 500,
            speed: 7.2,
            scale: 0.88,
            color: 0xb91c1c,
            baseDino: 'pachyrhino'
        },
        'Tricératops Pyroclastique': {
            archetype: 'armored',
            hp: 620,
            speed: 7.4,
            scale: 0.94,
            color: 0x4c1d95,
            baseDino: 'pachyrhino'
        }
    },
    description: 'Cératopsien massif armé d\'une collerette osseuse et de trois cornes frontales dévastatrices.'
});
