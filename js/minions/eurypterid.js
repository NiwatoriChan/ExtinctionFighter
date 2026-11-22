/* ============================================================================
 * MINION DE CAMPAGNE : EURYPTÉRIDE (eurypterid)
 * Ères 2 & 3 : Ordovicien & Silurien — Scorpions marins Megalograptus & Pterygotus
 * Modèle 3D : assets/models/minions/eurypterid.glb
 * ============================================================================ */

registerCampaignMinion({
    id: 'eurypterid',
    glbId: 'eurypterid',
    enemyDisplayName: 'Megalograptus Ohioensis',
    species: 'Megalograptus / Pterygotus',
    eraSlug: 'ordovician',
    archetype: 'armored',
    hp: 360,
    speed: 6.5,
    scale: 0.85,
    radius: 0.80,
    color: 0x0369a1,
    baseDino: 'pulmonoscorpius',
    variants: {
        'Megalograptus Ohioensis': {
            archetype: 'armored',
            hp: 360,
            speed: 6.5,
            scale: 0.85,
            color: 0x0369a1
        },
        'Pterygotus Anglicus': {
            archetype: 'brawler',
            hp: 410,
            speed: 7.0,
            scale: 0.88,
            color: 0x0f766e
        }
    },
    description: 'Euryptéride prédateur muni d\'appendices prosomaux épineux, de palettes natatoires et d\'un telson articulé.'
});
