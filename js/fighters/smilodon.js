/* ============================================================================
 * COMBATTANT : SMILODON (Smilodon Fatalis - Tigre à Dents de Sabre)
 * Personnage Secret Déblocable en remportant le Mode Campagne d'Extinction !
 * Stylisation cartoon mature / Primal graphic comic :
 * - Cartographie PBR procédurale 1024x1024 (pelage fauve ocre à rosettes sombres,
 *   ventre crème soyeux, canines en ivoire strié à tranchant biseauté)
 * - Garrot herculéen sculpté, cou trapu hyper-musclé pour la prise au cou
 * - Crâne félin massif avec brides mentonnières (mandibular flanges)
 * - Canines sabres colossales incurvées avec cannelures et fil tranchant
 * - Pattes antérieures surdimensionnées aux griffes rétractiles acérées
 * - Queue bobtail musclée crantée
 * ============================================================================ */

registerFighter({
    id: 'smilodon',
    name: 'SMILODON',
    fullName: 'Smilodon Fatalis',
    role: 'Félin Machairodonte Apex',
    title: '« La Terreur Glaciaire du Pléistocène »',
    primaryColor: 0xb88448,
    secondaryColor: 0x422b18,
    accentColor: 0xd8cbb4,
    cssPrimary: '#b88448',
    scale: 0.86,
    previewScale: 0.95,
    stats: { pow: 94, spd: 94, def: 80 },
    maxHp: 1020,
    walkSpeed: 8.8,
    special1Name: 'Bond Prédateur (H)',
    special2Name: 'Morsure Mortelle (T)',
    fatalityName: 'Égorgement Fatal (R)',
    moveStyle: 'Démarche féline musclée, bonds fulgurants, griffes rétractiles et crocs sabres dévastateurs.',
    fatalityDesc: 'Plaque sauvagement la victime au sol, rugit à pleins poumons et transperce la gorge avec ses canines sabres colossales.',
    isUnlockable: true,
    skins: [
        { name: 'La Brea Tawny', primary: 0xb88448, secondary: 0x422b18, accent: 0xd8cbb4 },
        { name: 'Glacial Ghost', primary: 0xcbd5e1, secondary: 0x475569, accent: 0xe2e8f0 }
    ]
}, {
    animBaseHipsY: 1.55,
    attackReach: 3.55,

    onSpecial(attacker, defender, dist, basePow) {
        sfx.playRoar(110, 0.4);
        attacker.vx = attacker.facing * 22;
        if (defender && dist < 4.8 && (typeof isWithinVerticalHitBand !== 'function' || isWithinVerticalHitBand(attacker, defender, 2.2, 1.8))) {
            applyDamage(attacker, defender, Math.round(basePow * 1.05), true, 'BOND PRÉDATEUR !');
            spawn3DBloodAndBones(defender.x, defender.y + 1.8, 18, false);
            screenShake = 0.4;
        }
    },

    onSpecial2(attacker, defender, dist, basePow) {
        sfx.playRoar(90, 0.5);
        if (defender && dist < 3.9 && (typeof isWithinVerticalHitBand !== 'function' || isWithinVerticalHitBand(attacker, defender, 2.2, 1.8))) {
            sfx.playBoneCrack();
            applyDamage(attacker, defender, Math.round(basePow * 1.25), true, 'CROCS SABRES !');
            spawn3DBloodAndBones(defender.x, defender.y + 2.0, 32, true);
            screenShake = 0.65;
        } else {
            attacker.vx = attacker.facing * 18;
        }
    }
});
