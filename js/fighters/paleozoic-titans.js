/* ============================================================================
 * COMBATTANTS PALÉOZOÏQUES DÉBLOCABLES (ÈRES 2, 3, 4 & 6)
 * Champions préhistoriques authentiques de l'Ordovicien, Silurien, Dévonien
 * et Permien, propulsés par leurs modèles 3D .glb riggés dédiés.
 * ============================================================================ */

// 1. CAMEROCERAS (Ère 2 : Ordovicien, 485 - 444 Ma)
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

// 2. JAEKELOPTERUS (Ère 3 : Silurien, 444 - 419 Ma)
registerFighter({
    id: 'jaekelopterus',
    bossGlbId: 'boss_jaekelopterus',
    animBaseId: 'pulmonoscorpius',
    name: 'JAEKELOPTERUS',
    fullName: 'Jaekelopterus Rhenaniae Rex',
    role: 'Euryptéride Géant des Estuaires',
    title: '« Le Scorpion des Mers du Silurien »',
    primaryColor: 0x0d9488,
    secondaryColor: 0x134e4a,
    accentColor: 0x2dd4bf,
    cssPrimary: '#0d9488',
    scale: 1.02,
    previewScale: 0.95,
    stats: { pow: 92, spd: 88, def: 86 },
    maxHp: 1080,
    walkSpeed: 8.3,
    jumpVy: 12.6,
    special1Name: 'Vague Saumâtre (H)',
    special2Name: 'Cisaille Chélicérale (T)',
    fatalityName: 'Démembrement d\'Estuaire (R)',
    moveStyle: 'Foulée amphibie à 8 appendices, rames natatoires siluriennes et double cisaille chélicérale crénelée.',
    fatalityDesc: 'Sectionne l\'armure de son adversaire d\'un double coup de chélicères géantes avant de le projeter au fond de l\'estuaire.',
    skins: [
        { name: 'Rhenish Estuary', primary: 0x0d9488, secondary: 0x134e4a, accent: 0x2dd4bf },
        { name: 'Silurian Slate', primary: 0x115e59, secondary: 0x042f2e, accent: 0x5eead4 }
    ]
}, {
    animBaseHipsY: 0.95,
    attackReach: 3.4,

    onSpecial(attacker, defender, dist, basePow) {
        if (typeof sfx !== 'undefined' && sfx.playWhoosh) sfx.playWhoosh();
        if (typeof spawn3DProjectile === 'function') {
            spawn3DProjectile(attacker, 'hydro');
        }
    },

    onSpecial2(attacker, defender, dist, basePow) {
        if (typeof sfx !== 'undefined' && sfx.playStinger) sfx.playStinger();
        if (typeof spawn3DProjectile === 'function') {
            spawn3DProjectile(attacker, 'venom');
        }
    },

    onFatality(attacker, defender, dist) {
        if (typeof sfx !== 'undefined' && sfx.playGong) sfx.playGong();
        if (typeof spawnFloatingPopup === 'function' && defender) {
            spawnFloatingPopup(defender.x, '🦂 CISAILLE CHÉLICÉRALE !', '#2dd4bf');
        }
        if (defender && typeof spawn3DBloodAndBones === 'function') {
            spawn3DBloodAndBones(defender.x, (defender.y || 0) + 1.0, 9, true);
        }
    }
});

// 3. DUNKLEOSTEUS (Ère 4 : Dévonien, 419 - 359 Ma)
registerFighter({
    id: 'dunkleosteus',
    bossGlbId: 'boss_dunkleosteus',
    animBaseId: 'postosuchus',
    name: 'DUNKLEOSTEUS',
    fullName: 'Dunkleosteus Terrelli Alpha',
    role: 'Placoderme Cuirassé Super-Prédateur',
    title: '« La Guillotine Blindée du Dévonien »',
    primaryColor: 0x1d4ed8,
    secondaryColor: 0x0f172a,
    accentColor: 0x60a5fa,
    cssPrimary: '#1d4ed8',
    scale: 1.08,
    previewScale: 0.92,
    stats: { pow: 98, spd: 76, def: 98 },
    maxHp: 1240,
    walkSpeed: 7.2,
    jumpVy: 12.0,
    special1Name: 'Vortex d\'Aspiration (H)',
    special2Name: 'Mâchoire-Guillotine (T)',
    fatalityName: 'Cisaillement Cranio-Thoracique (R)',
    moveStyle: 'Bouclier céphalothoracique en plaques osseuses imbriquées et lames gnathales auto-affûtées à 8 000 PSI.',
    fatalityDesc: 'Broie le squelette du rival en une fraction de seconde entre ses plaques tranchantes puis expulse une onde abyssale.',
    skins: [
        { name: 'Cleveland Shale Steel', primary: 0x1d4ed8, secondary: 0x0f172a, accent: 0x60a5fa },
        { name: 'Devonian Benthic', primary: 0x1e40af, secondary: 0x172554, accent: 0x93c5fd }
    ]
}, {
    animBaseHipsY: 1.48,
    attackReach: 3.7,

    onSpecial(attacker, defender, dist, basePow) {
        if (typeof sfx !== 'undefined' && sfx.playWhoosh) sfx.playWhoosh();
        if (typeof spawn3DProjectile === 'function') {
            spawn3DProjectile(attacker, 'hydro');
        }
    },

    onSpecial2(attacker, defender, dist, basePow) {
        if (typeof spawn3DProjectile === 'function') {
            spawn3DProjectile(attacker, 'boulder');
        }
    },

    onFatality(attacker, defender, dist) {
        if (typeof sfx !== 'undefined' && sfx.playBoneCrack) sfx.playBoneCrack();
        if (typeof spawnFloatingPopup === 'function' && defender) {
            spawnFloatingPopup(defender.x, '🦈 MÂCHOIRE-GUILLOTINE !', '#60a5fa');
        }
        if (defender && typeof spawn3DBloodAndBones === 'function') {
            spawn3DBloodAndBones(defender.x, (defender.y || 0) + 1.1, 10, true);
        }
    }
});

// 4. DIMETRODON (Ère 6 : Permien, 299 - 252 Ma)
registerFighter({
    id: 'dimetrodon',
    bossGlbId: 'boss_dimetrodon',
    animBaseId: 'postosuchus',
    name: 'DIMETRODON',
    fullName: 'Dimetrodon Grandis Impérial',
    role: 'Synapside Pélycosaure à Voile',
    title: '« Le Monarque Solaire du Permien »',
    primaryColor: 0xb45309,
    secondaryColor: 0x451a03,
    accentColor: 0xf97316,
    cssPrimary: '#b45309',
    scale: 1.04,
    previewScale: 0.94,
    stats: { pow: 95, spd: 82, def: 88 },
    maxHp: 1140,
    walkSpeed: 7.6,
    jumpVy: 12.3,
    special1Name: 'Éruption Solaire Thermique (H)',
    special2Name: 'Crocs Sécodontes (T)',
    fatalityName: 'Fournaise de la Pangée (R)',
    moveStyle: 'Voile neurale thermorégulatrice haute tension, démarche chaloupée puissante et dentition hétérodonte tranchante.',
    fatalityDesc: 'Accumule la chaleur solaire dans sa voile dorsale avant d\'enchaîner crocs perçants et déflagration ignée.',
    skins: [
        { name: 'Pangaea Solar Ochre', primary: 0xb45309, secondary: 0x451a03, accent: 0xf97316 },
        { name: 'Permian Basalt', primary: 0x7c2d12, secondary: 0x292524, accent: 0xfb923c }
    ]
}, {
    animBaseHipsY: 1.48,
    attackReach: 3.65,

    onSpecial(attacker, defender, dist, basePow) {
        if (typeof sfx !== 'undefined' && sfx.playRoar) sfx.playRoar(95, 0.4);
        if (typeof spawn3DProjectile === 'function') {
            spawn3DProjectile(attacker, 'dragon_fire');
        }
    },

    onSpecial2(attacker, defender, dist, basePow) {
        if (typeof spawn3DProjectile === 'function') {
            spawn3DProjectile(attacker, 'boulder');
        }
    },

    onFatality(attacker, defender, dist) {
        if (typeof sfx !== 'undefined' && sfx.playGong) sfx.playGong();
        if (typeof spawnFloatingPopup === 'function' && defender) {
            spawnFloatingPopup(defender.x, '☀️ FOURNAISE DE LA PANGÉE !', '#f97316');
        }
        if (defender && typeof spawn3DBloodAndBones === 'function') {
            spawn3DBloodAndBones(defender.x, (defender.y || 0) + 1.1, 10, true);
        }
    }
});

