/* ============================================================================
 * MINION DE CAMPAGNE : ORTHOCERAS / ENDOCERAS (orthoceras)
 * Ère 2 : Ordovicien (485 - 444 Ma) — Céphalopode nautiloïde à coquille conique
 * Modèle 3D : assets/models/minions/orthoceras.glb
 * ============================================================================ */

registerCampaignMinion({
    id: 'orthoceras',
    glbId: 'orthoceras',
    enemyDisplayName: 'Endoceras Cuirassé',
    species: 'Orthoceras / Endoceras Proteiforme',
    eraSlug: 'ordovician',
    archetype: 'zoning',
    hp: 190,
    speed: 6.4,
    scale: 0.62,
    radius: 0.75,
    color: 0x0ea5e9,
    baseDino: 'postosuchus',
    projectileDamage: 38,
    description: 'Nautiloïde orthocône propulsé par siphon hyponomique, tirant des jets pressurisés à distance.'
});
