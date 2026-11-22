/* ============================================================================
 * COMBATTANT : CAMEROCERAS (Cameroceras Trentonense Titan)
 * Boss Apex déblocable de l'Ère 2 (Ordovicien, 485 - 444 Ma) & Combattant Jouable
 * Propulsé par son modèle 3D .glb dédié (boss_cameroceras) :
 * - Coquille conique d'orthocône blindée à septes calcaires et apex annelé
 * - Capuchon céphalique musculeux, grands yeux latéraux abyssaux et hyponome
 * - Couronne de bras tentaculaires raptoriaux chitineux et bec de perroquet
 * ============================================================================ */

registerFighter({
    id: 'cameroceras',
    bossGlbId: 'boss_cameroceras',
    animBaseId: 'spinosaurus',
    name: 'CAMEROCERAS',
    fullName: 'Cameroceras Trentonense Titan',
    role: 'Céphalopode Orthocône Abyssal',
    title: '« Le Léviathan Cuirassé de l\'Ordovicien »',
    primaryColor: 0x0284c7,
    secondaryColor: 0x0f172a,
    accentColor: 0x38bdf8,
    cssPrimary: '#0284c7',
    scale: 1.05,
    previewScale: 0.92,
    stats: { pow: 94, spd: 78, def: 95 },
    maxHp: 1180,
    walkSpeed: 7.4,
    jumpVy: 12.2,
    special1Name: 'Jet Siphonique Abyssal (H)',
    special2Name: 'Étreinte Tentaculaire (T)',
    fatalityName: 'Implosion de la Fosse Ordovicienne (R)',
    moveStyle: 'Coquille conique d\'orthocône blindée, propulsion hyponomique torrentielle et fouets tentaculaires constricteurs.',
    fatalityDesc: 'Enserre la proie dans ses bras tentaculaires chitineux et la projette contre le récif sous la pression d\'un jet siphonique dévastateur.',
    skins: [
        { name: 'Trenton Abyssal', primary: 0x0284c7, secondary: 0x0f172a, accent: 0x38bdf8 },
        { name: 'Baltic Nautiloid', primary: 0x1e3a8a, secondary: 0x172554, accent: 0x22d3ee }
    ]
}, {
    animBaseHipsY: 1.85,
    attackReach: 3.6,

    onSpecial(attacker, defender, dist, basePow) {
        if (typeof sfx !== 'undefined' && sfx.playWhoosh) sfx.playWhoosh();
        if (typeof spawn3DProjectile === 'function') {
            spawn3DProjectile(attacker, 'hydro');
        }
    },

    onSpecial2(attacker, defender, dist, basePow) {
        if (defender && dist < 3.2 && (typeof isWithinVerticalHitBand !== 'function' || isWithinVerticalHitBand(attacker, defender, 2.2, 1.8))) {
            if (typeof sfx !== 'undefined' && sfx.playHit) sfx.playHit(true);
            if (typeof spawnHitSparks3D === 'function') {
                spawnHitSparks3D(defender.x, (defender.y || 0) + 1.2, true);
            }
            applyDamage(attacker, defender, Math.round((basePow || 94) * 1.25), true, '🐙 ÉTREINTE TENTACULAIRE !');
        } else {
            attacker.vx = (attacker.facing || 1) * 15;
        }
    },

    onFatality(attacker, defender, dist) {
        if (typeof sfx !== 'undefined' && sfx.playGong) sfx.playGong();
        if (typeof spawnFloatingPopup === 'function' && defender) {
            spawnFloatingPopup(defender.x, '🌊 IMPLOSION DE LA FOSSE !', '#38bdf8');
        }
        if (defender && typeof spawn3DBloodAndBones === 'function') {
            spawn3DBloodAndBones(defender.x, (defender.y || 0) + 1.1, 8, true);
        }
    }
});
