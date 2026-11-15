/* ============================================================================
 * COMBATTANT : T-REX (Tyrannosaurus Rex)
 * Données (stats, skins, textes), modèle 3D paléontologique procédural haute
 * fidélité conçu et validé avec Blender 5.2 d'après le portrait de référence
 * (textures PBR 1024x1024 de peau volcanique vert-olive sombre et charbon,
 * écailles polygonales en pavés, cicatrices de combat cramoisies, crêtes
 * sourcilières/lacrymales et nasales blindées d'ostéodermes surplombant
 * l'orbite, renflement maxillaire balafré, fosses narinaires obliques,
 * gencives festonnées humides, crocs courbés à racines tachées, langue charnue
 * sillonnée, membranes d'adducteurs mandibulaires, filets de bave dynamiques,
 * triple rangée d'ostéodermes dorsaux/nucaux et plis gulaires sur maillage
 * continu Catmull-Rom en temps réel, bras didactyles et membres postérieurs
 * digitigrades à 4 segments articulés), animations biomécaniques & fatalité.
 * ============================================================================ */

registerFighter({
    id: 'trex',
    name: 'T-REX',
    fullName: 'Tyrannosaurus Rex',
    role: 'Apex Carnivore',
    title: '« Le Roi Sanglant du Crétacé »',
    primaryColor: 0x48523d,
    secondaryColor: 0x242920,
    accentColor: 0x9e8c68,
    cssPrimary: '#48523d',
    scale: 1.10,
    previewScale: 0.92,
    stats: { pow: 96, spd: 72, def: 85 },
    maxHp: 1050,
    walkSpeed: 7.8,
    special1Name: 'Morsure Sismique (H)',
    special2Name: 'Rugissement de Magma (T)',
    fatalityName: 'Dévoration Royale (R)',
    moveStyle: 'Foulée bipède lourde sur membres digitigrades, morsure broyeuse d’os à 12 800 PSI, piétinement sismique et balayage caudal rotatif.',
    fatalityDesc: 'Saisit la victime dans ses mâchoires géantes, la secoue violemment, arrache la tête et l’avale dans une gerbe de sang.',
    skins: [
        { name: 'Moros Olive Tyrant', primary: 0x48523d, secondary: 0x242920, accent: 0x9e8c68, belly: 0x9e9780, isDefaultPBR: true },
        { name: 'Badlands Umber', primary: 0x6b4c38, secondary: 0x2e2119, accent: 0x8f7a60, belly: 0xb29f85 }
    ]
}, {
    animBaseHipsY: 2.1,
    attackReach: 3.95,

    onSpecial2(attacker, defender, dist, basePow) {
        spawn3DProjectile(attacker, 'boulder');
    }
});
