/* ============================================================================
 * MINION DE CAMPAGNE : TRILOBITE PRIMORDIAL (cambrian_trilobite)
 * Ère 1 : Cambrien (541 - 485 Ma) — Essaim d'arthropodes benthiques cuirassés
 * Modèle 3D : assets/models/minions/cambrian_trilobite.glb
 * ============================================================================ */

registerCampaignMinion({
    id: 'cambrian_trilobite',
    glbId: 'cambrian_trilobite',
    enemyDisplayName: 'Trilobite Primordial',
    species: 'Olenoides Serratus',
    eraSlug: 'cambrian',
    archetype: 'swarmer',
    hp: 175,
    speed: 6.2,
    scale: 0.56,
    radius: 0.68,
    color: 0x14b8a6,
    baseDino: 'anomalocaris',
    attackDamage: 40,
    description: 'Trilobite épineux du Schiste de Burgess à céphalon en croissant, épines génales et pygidium denticulé.'
});
