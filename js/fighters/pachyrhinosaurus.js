// Pachyrhinosaurus Canadensis — Modèle Anatomique Quadrupède & Rig Musculo-Squelettique
// Refonte anatomique et texturale complète validée dans Blender 5.2 (modèle de référence ocellé terre cuite)

registerFighter({
    id: 'pachyrhino',
    name: 'PACHYRHINOSAURE',
    fullName: 'Pachyrhinosaurus Canadensis',
    role: 'Bélier Blindé',
    title: '« Le Colosse à Bosse d’Acier »',
    primaryColor: 0x734a36,
    secondaryColor: 0x42281c,
    accentColor: 0xa89278,
    cssPrimary: '#734a36',
    scale: 1.0,
    previewScale: 0.90,
    stats: { pow: 88, spd: 76, def: 92 },
    maxHp: 1100,
    walkSpeed: 8.2,
    special1Name: 'Charge Boréale (H)',
    special2Name: 'Cornes Sismiques (T)',
    fatalityName: 'Impact Crânien Polaire (R)',
    moveStyle: 'Trot quadrupède puissant, coup de bosse nasale pachyostotique et soulèvement de collerette ocellée.',
    fatalityDesc: 'Gratte le sol, charge à vitesse supersonique avec sa bosse nasale blindée, pulvérise le torse ennemi et empale son crâne.',
    skins: [
        { name: 'Ocellus Terre Cuite', primary: 0x734a36, secondary: 0x42281c, accent: 0xa89278, belly: 0xa38e73, isDefaultPBR: true },
        { name: 'Boreal Slate', primary: 0x56626b, secondary: 0x2c343b, accent: 0x9ca6ad, belly: 0xcbd2d6 },
        { name: 'Tundra Frost', primary: 0x7b7870, secondary: 0x3e3c38, accent: 0xb8b2a6, belly: 0xd8d4cc }
    ]
}, {
    animBaseHipsY: 1.65,
    attackReach: 3.75,

    onSpecial2(attacker, defender, dist, basePow) {
        special2SeismicQuake(attacker, defender, dist, basePow);
    }
});
