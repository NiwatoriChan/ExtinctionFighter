/* ============================================================================
 * BOSS FINAL NON JOUABLE : DRAK'ZUL LE DRAGON PRIMORDIAL
 * Boss suprême de la Campagne (affronté après 5 prédateurs aléatoires).
 * Stylisation cartoon mature / Primal graphic comic :
 * - Cartographie PBR procédurale 1024x1024 (écailles d'obsidienne craquelées de magma,
 *   voilure alaire en cuir incandescent nervuré, plastron ventral embrasé)
 * - Anatomie reptilienne d'archosaure volcanique au garrot puissant et crête d'ostéodermes
 * - Crâne cornu cuirassé aux yeux ardents et gosier de feu
 * - Grandes ailes membraneuses à 4 doigts osseux et griffe d'alula articulée
 * - Queue serpentine crantée à dard hallebarde
 * ============================================================================ */

registerBoss({
    id: 'dragon',
    name: "DRAK'ZUL",
    fullName: "Drak'Zul le Dragon Primordial",
    role: "Boss Suprême (Non Jouable)",
    title: "« Le Fléau Incandescent de l'Extinction »",
    primaryColor: 0x111113,
    secondaryColor: 0x1c1917,
    accentColor: 0xff3b00,
    cssPrimary: '#ef4444',
    scale: 1.35,
    previewScale: 0.75,
    stats: { pow: 48, spd: 55, def: 40 },
    maxHp: 680,
    walkSpeed: 5.2,
    special1Name: 'Souffle Infernale (H)',
    special2Name: 'Cataclysme Éruptif (T)',
    fatalityName: 'Incinération Suprême (R)',
    moveStyle: 'Posture serpentine colossale, battements d’ailes destructeurs et souffle de magma.',
    fatalityDesc: 'Broie la victime sous son talon draconique et la réduit en cendres par un torrent de feu infernal.',
    isBoss: true,
    skins: [
        { name: 'Hellfire Obsidian', primary: 0x111113, secondary: 0x1c1917, accent: 0xff3b00, membrane: 0x991b1b },
        { name: 'Abyssal Frost', primary: 0x0f172a, secondary: 0x0284c7, accent: 0x38bdf8, membrane: 0x0369a1 }
    ]
}, {
    animBaseHipsY: 2.1,
    attackReach: 3.15,

    onSpecial(attacker, defender, dist, basePow) {
        sfx.playRoar(75, 0.5);
        spawn3DProjectile(attacker, 'dragon_fire');
    },

    onSpecial2(attacker, defender, dist, basePow) {
        screenShake = 0.35;
        if (typeof spawn3DGroundShockwave === 'function') {
            spawn3DGroundShockwave(attacker.x + attacker.facing * 1.8, 0xf97316, 4.2, true);
        }
        if (defender && dist < 4.2 && (typeof isWithinVerticalHitBand !== 'function' || isWithinVerticalHitBand(attacker, defender, 2.4, 2.0))) {
            spawn3DBloodAndBones(defender.x, defender.y + 0.3, 10, true);
            applyDamage(attacker, defender, Math.round(basePow * 0.8), true, 'CATACLYSME DRACONIQUE !');
        }
    }
});
