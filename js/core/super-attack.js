/* ============================================================================
 * js/core/super-attack.js — Real Fighting-Game Super Attack System (Primal Super)
 * 100% dt-driven, pause-safe FSM (ZERO setTimeout / setInterval) covering all
 * 21 playable prehistoric fighters across 4 archetypes:
 *   - cinematic_rush (15 fighters): Super Flash -> Real Startup Hitbox -> 3-Beat 3D Choreography
 *   - beam           (3 fighters) : Super Flash -> Multi-Hit Energy/Sonic/Hydro Beam
 *   - seismic_aoe    (2 fighters) : Super Flash -> Full-Stage Seismic/Thermal Shockwaves
 *   - dive_aoe       (1 fighter)  : Super Flash -> Stratospheric Ascent & Crater Slam
 * Includes Block/Chip, Perfect Parry, Whiff Punishment, Campaign Minion Sweeps,
 * 55% Combo Proration Floor, Signature Status Effects, and Automatic Extinction Finish!
 * ============================================================================ */

var DEFAULT_SUPER_BEATS = Object.freeze([
    { at: 0.35, label: '💥 IMPACT PRIMAL !', shake: 0.58, dmgRatio: 0.30, camAngle: 'clash' },
    { at: 0.95, label: '🔥 DÉCHAÎNEMENT !', shake: 0.78, dmgRatio: 0.30, camAngle: 'oblique' },
    { at: 1.55, label: '☢ COUP DE GRÂCE !', shake: 1.08, dmgRatio: 0.40, camAngle: 'launch' }
]);

var SUPER_SPECS = {
    // ========================================================================
    // CINEMATIC RUSH SUPERS (15 Fighters)
    // ========================================================================
    trex: {
        name: 'Dévoration Royale',
        subtitle: 'Mâchoire Apex • 60 000 Newtons',
        archetype: 'cinematic_rush',
        colorHex: 0xdc2626,
        cssColor: '#dc2626',
        startupDuration: 0.42,
        rushSpeed: 17.5,
        reach: 4.4,
        baseDmgMult: 2.55,
        statusEffect: 'intimidate',
        beats: [
            { at: 0.35, label: '🦖 SAISIE MAXILLAIRE !', shake: 0.62, dmgRatio: 0.30, camAngle: 'clash' },
            { at: 0.95, label: '💀 SECOUSSE CERVICALE !', shake: 0.82, dmgRatio: 0.30, camAngle: 'oblique' },
            { at: 1.55, label: '👑 DÉVORATION ROYALE !', shake: 1.12, dmgRatio: 0.40, camAngle: 'launch' }
        ]
    },
    pachyrhino: {
        name: 'Impact Crânien Polaire',
        subtitle: 'Charge Supersonique du Bouclier Nasal',
        archetype: 'cinematic_rush',
        colorHex: 0x38bdf8,
        cssColor: '#38bdf8',
        startupDuration: 0.44,
        rushSpeed: 19.5,
        reach: 4.5,
        baseDmgMult: 2.50,
        statusEffect: null,
        beats: [
            { at: 0.35, label: '❄️ PERCÉE GLACIAIRE !', shake: 0.60, dmgRatio: 0.30, camAngle: 'clash' },
            { at: 0.95, label: '🛡️ BROYAGE DU BOUCLIER !', shake: 0.80, dmgRatio: 0.30, camAngle: 'oblique' },
            { at: 1.55, label: '💥 IMPACT CRÂNIEN POLAIRE !', shake: 1.10, dmgRatio: 0.40, camAngle: 'launch' }
        ]
    },
    ankylo: {
        name: 'Pulvérisation Caudale',
        subtitle: 'Massue Osseuse Centrifuge de 50 kg',
        archetype: 'cinematic_rush',
        colorHex: 0xf59e0b,
        cssColor: '#f59e0b',
        startupDuration: 0.46,
        rushSpeed: 15.5,
        reach: 4.3,
        baseDmgMult: 2.60,
        statusEffect: null,
        beats: [
            { at: 0.35, label: '🔨 FRACTURE DES ROTULES !', shake: 0.65, dmgRatio: 0.30, camAngle: 'clash' },
            { at: 0.95, label: '⚡ TOURBILLON BLINDÉ !', shake: 0.85, dmgRatio: 0.30, camAngle: 'oblique' },
            { at: 1.55, label: '💥 PULVÉRISATION CAUDALE !', shake: 1.15, dmgRatio: 0.40, camAngle: 'launch' }
        ]
    },
    therizino: {
        name: 'Découpe Chirurgicale',
        subtitle: 'Triple Entaille en X aux Griffes Géantes',
        archetype: 'cinematic_rush',
        colorHex: 0xef4444,
        cssColor: '#ef4444',
        startupDuration: 0.38,
        rushSpeed: 18.5,
        reach: 4.6,
        baseDmgMult: 2.50,
        statusEffect: 'bleed',
        beats: [
            { at: 0.35, label: '⚔️ ENTAILLE DIAGONALE !', shake: 0.56, dmgRatio: 0.30, camAngle: 'clash' },
            { at: 0.95, label: '⚔️ CROIX LACÉRANTE !', shake: 0.76, dmgRatio: 0.30, camAngle: 'oblique' },
            { at: 1.55, label: '🩸 DÉCOUPE CHIRURGICALE !', shake: 1.05, dmgRatio: 0.40, camAngle: 'launch' }
        ]
    },
    stegosaurus: {
        name: 'Transfixion Quadruple',
        subtitle: 'Thagomizer à 4 Pointes d\'un Mètre',
        archetype: 'cinematic_rush',
        colorHex: 0xea580c,
        cssColor: '#ea580c',
        startupDuration: 0.44,
        rushSpeed: 16.0,
        reach: 4.4,
        baseDmgMult: 2.55,
        statusEffect: 'bleed',
        beats: [
            { at: 0.35, label: '🦴 PIVOT DE PLAQUES !', shake: 0.60, dmgRatio: 0.30, camAngle: 'clash' },
            { at: 0.95, label: '🗡️ EMPALEMENT THAGOMIZER !', shake: 0.80, dmgRatio: 0.30, camAngle: 'oblique' },
            { at: 1.55, label: '💥 TRANSFIXION QUADRUPLE !', shake: 1.10, dmgRatio: 0.40, camAngle: 'launch' }
        ]
    },
    smilodon: {
        name: 'Assaut Sabre-Dents',
        subtitle: 'Égorgement Fatal aux Canines Colossales',
        archetype: 'cinematic_rush',
        colorHex: 0xfbbf24,
        cssColor: '#fbbf24',
        startupDuration: 0.36,
        rushSpeed: 21.0,
        reach: 4.2,
        baseDmgMult: 2.45,
        statusEffect: 'bleed',
        beats: [
            { at: 0.35, label: '🐾 PLAQUAGE FÉLIN !', shake: 0.54, dmgRatio: 0.30, camAngle: 'clash' },
            { at: 0.95, label: '🩸 LACÉRATION SABRE !', shake: 0.74, dmgRatio: 0.30, camAngle: 'oblique' },
            { at: 1.55, label: '⚔️ ASSAUT SABRE-DENTS !', shake: 1.02, dmgRatio: 0.40, camAngle: 'launch' }
        ]
    },
    gorgonopsia: {
        name: 'Éviscération Permienne',
        subtitle: 'Bond Prédateur & Déchirure Ancestrale',
        archetype: 'cinematic_rush',
        colorHex: 0xeab308,
        cssColor: '#eab308',
        startupDuration: 0.38,
        rushSpeed: 20.0,
        reach: 4.3,
        baseDmgMult: 2.48,
        statusEffect: 'bleed',
        beats: [
            { at: 0.35, label: '🔥 BOND SUR LA NUQUE !', shake: 0.56, dmgRatio: 0.30, camAngle: 'clash' },
            { at: 0.95, label: '🩸 CROCS PERMIENS !', shake: 0.76, dmgRatio: 0.30, camAngle: 'oblique' },
            { at: 1.55, label: '💀 ÉVISCÉRATION PERMIENNE !', shake: 1.06, dmgRatio: 0.40, camAngle: 'launch' }
        ]
    },
    postosuchus: {
        name: 'Roulade du Trias',
        subtitle: 'Morsure en Étau & Roulade de la Mort',
        archetype: 'cinematic_rush',
        colorHex: 0xd97706,
        cssColor: '#d97706',
        startupDuration: 0.40,
        rushSpeed: 18.0,
        reach: 4.2,
        baseDmgMult: 2.48,
        statusEffect: null,
        beats: [
            { at: 0.35, label: '🐊 MORSURE EN ÉTAU !', shake: 0.58, dmgRatio: 0.30, camAngle: 'clash' },
            { at: 0.95, label: '🌀 TORSION VERTÉBRALE !', shake: 0.78, dmgRatio: 0.30, camAngle: 'oblique' },
            { at: 1.55, label: '💥 ROULADE DU TRIAS !', shake: 1.06, dmgRatio: 0.40, camAngle: 'launch' }
        ]
    },
    spinosaurus: {
        name: 'Éventration du Nil',
        subtitle: 'Empalement Crocodilien & Déchiquetage',
        archetype: 'cinematic_rush',
        colorHex: 0x0ea5e9,
        cssColor: '#0ea5e9',
        startupDuration: 0.42,
        rushSpeed: 17.5,
        reach: 4.6,
        baseDmgMult: 2.55,
        statusEffect: 'bleed',
        beats: [
            { at: 0.35, label: '🌊 GRIFFES DU NIL !', shake: 0.60, dmgRatio: 0.30, camAngle: 'clash' },
            { at: 0.95, label: '🩸 SURÉLÉVATION DORSALE !', shake: 0.80, dmgRatio: 0.30, camAngle: 'oblique' },
            { at: 1.55, label: '💥 ÉVENTRATION DU NIL !', shake: 1.10, dmgRatio: 0.40, camAngle: 'launch' }
        ]
    },
    terabird: {
        name: 'Trépanation Sauvage',
        subtitle: 'Piqué Fulminant au Bec Crochu',
        archetype: 'cinematic_rush',
        colorHex: 0xf59e0b,
        cssColor: '#f59e0b',
        startupDuration: 0.36,
        rushSpeed: 21.5,
        reach: 4.2,
        baseDmgMult: 2.42,
        statusEffect: null,
        beats: [
            { at: 0.35, label: '🦅 RUSH SUPERSONIQUE !', shake: 0.54, dmgRatio: 0.30, camAngle: 'clash' },
            { at: 0.95, label: '⚡ FRAPPE DU BEC HACHE !', shake: 0.74, dmgRatio: 0.30, camAngle: 'oblique' },
            { at: 1.55, label: '💀 TRÉPANATION SAUVAGE !', shake: 1.02, dmgRatio: 0.40, camAngle: 'launch' }
        ]
    },
    giantsloth: {
        name: 'Étreinte Annihilatrice',
        subtitle: 'Compression Colossale & Écrasement',
        archetype: 'cinematic_rush',
        colorHex: 0xa8a29e,
        cssColor: '#a8a29e',
        startupDuration: 0.48,
        rushSpeed: 15.0,
        reach: 4.4,
        baseDmgMult: 2.62,
        statusEffect: null,
        beats: [
            { at: 0.35, label: '💪 SAISIE DU COLOSSE !', shake: 0.65, dmgRatio: 0.30, camAngle: 'clash' },
            { at: 0.95, label: '🦴 COMPRESSION THORACIQUE !', shake: 0.85, dmgRatio: 0.30, camAngle: 'oblique' },
            { at: 1.55, label: '💥 ÉTREINTE ANNIHILATRICE !', shake: 1.15, dmgRatio: 0.40, camAngle: 'launch' }
        ]
    },
    pulmonoscorpius: {
        name: 'Injection Neurotoxique',
        subtitle: 'Verrouillage des Pinces & Dard Mortel',
        archetype: 'cinematic_rush',
        colorHex: 0x22c55e,
        cssColor: '#22c55e',
        startupDuration: 0.38,
        rushSpeed: 19.0,
        reach: 4.3,
        baseDmgMult: 2.45,
        statusEffect: 'venom',
        beats: [
            { at: 0.35, label: '🦂 ÉTAU DES PINCES !', shake: 0.55, dmgRatio: 0.30, camAngle: 'clash' },
            { at: 0.95, label: '🧪 PERFORATION DU DARD !', shake: 0.75, dmgRatio: 0.30, camAngle: 'oblique' },
            { at: 1.55, label: '☠️ INJECTION NEUROTOXIQUE !', shake: 1.05, dmgRatio: 0.40, camAngle: 'launch' }
        ]
    },
    anomalocaris: {
        name: 'Broyage de Peytoia',
        subtitle: 'Cône Buccal Triradial aux 32 Plaques',
        archetype: 'cinematic_rush',
        colorHex: 0xf97316,
        cssColor: '#f97316',
        startupDuration: 0.40,
        rushSpeed: 18.5,
        reach: 4.4,
        baseDmgMult: 2.50,
        statusEffect: null,
        beats: [
            { at: 0.35, label: '🌊 APPENDICES ÉPINEUX !', shake: 0.58, dmgRatio: 0.30, camAngle: 'clash' },
            { at: 0.95, label: '🌀 CONSTRICTION CAMBRIENNE !', shake: 0.78, dmgRatio: 0.30, camAngle: 'oblique' },
            { at: 1.55, label: '💥 BROYAGE DE PEYTOIA !', shake: 1.08, dmgRatio: 0.40, camAngle: 'launch' }
        ]
    },
    jaekelopterus: {
        name: 'Cisaille d\'Estuaire',
        subtitle: 'Double Section Chélicérale Crénelée',
        archetype: 'cinematic_rush',
        colorHex: 0x2dd4bf,
        cssColor: '#2dd4bf',
        startupDuration: 0.38,
        rushSpeed: 19.5,
        reach: 4.3,
        baseDmgMult: 2.48,
        statusEffect: 'venom',
        beats: [
            { at: 0.35, label: '🦂 HARPONNAGE SILURIEN !', shake: 0.56, dmgRatio: 0.30, camAngle: 'clash' },
            { at: 0.95, label: '⚔️ DOUBLE SECTION CHÉLICÉRALE !', shake: 0.76, dmgRatio: 0.30, camAngle: 'oblique' },
            { at: 1.55, label: '💥 CISAILLE D\'ESTUAIRE !', shake: 1.06, dmgRatio: 0.40, camAngle: 'launch' }
        ]
    },
    dunkleosteus: {
        name: 'Guillotine Dévonienne',
        subtitle: 'Plaques Gnathales à 8 000 PSI',
        archetype: 'cinematic_rush',
        colorHex: 0x60a5fa,
        cssColor: '#60a5fa',
        startupDuration: 0.44,
        rushSpeed: 16.8,
        reach: 4.5,
        baseDmgMult: 2.60,
        statusEffect: 'intimidate',
        beats: [
            { at: 0.35, label: '🦈 VORTEX D\'ASPIRATION !', shake: 0.62, dmgRatio: 0.30, camAngle: 'clash' },
            { at: 0.95, label: '⚔️ LAMES GNATHALES 8000 PSI !', shake: 0.84, dmgRatio: 0.30, camAngle: 'oblique' },
            { at: 1.55, label: '💥 GUILLOTINE DÉVONIENNE !', shake: 1.14, dmgRatio: 0.40, camAngle: 'launch' }
        ]
    },

    // ========================================================================
    // BEAM / SEISMIC AOE / DIVE AOE SUPERS (6 Fighters)
    // ========================================================================
    dragon: {
        name: 'Incinération Suprême',
        subtitle: 'Torrent de Feu Infernal Draconique',
        archetype: 'beam',
        colorHex: 0xff3b00,
        cssColor: '#ff3b00',
        startupDuration: 0.42,
        rushSpeed: 0,
        reach: 12.0,
        baseDmgMult: 2.60,
        statusEffect: null,
        beats: [
            { at: 0.35, label: '🔥 SOUFFLE DRACONIQUE !', shake: 0.64, dmgRatio: 0.30, camAngle: 'clash' },
            { at: 0.95, label: '🌋 TORRENT MAGMATIQUE !', shake: 0.84, dmgRatio: 0.30, camAngle: 'oblique' },
            { at: 1.55, label: '☢ INCINÉRATION SUPRÊME !', shake: 1.15, dmgRatio: 0.40, camAngle: 'launch' }
        ]
    },
    apato: {
        name: 'Cataclysme Titanesque',
        subtitle: 'Piétinement de 30 Tonnes & Séisme Total',
        archetype: 'seismic_aoe',
        colorHex: 0x2dd4bf,
        cssColor: '#2dd4bf',
        startupDuration: 0.48,
        rushSpeed: 0,
        reach: 11.5,
        baseDmgMult: 2.65,
        statusEffect: null,
        beats: [
            { at: 0.35, label: '🌍 FRACTURE TECTONIQUE !', shake: 0.72, dmgRatio: 0.30, camAngle: 'clash' },
            { at: 0.95, label: '🪨 PLUIE DE ROCHERS !', shake: 0.90, dmgRatio: 0.30, camAngle: 'oblique' },
            { at: 1.55, label: '💥 CATACLYSME TITANESQUE !', shake: 1.20, dmgRatio: 0.40, camAngle: 'launch' }
        ]
    },
    quetzal: {
        name: 'Chute Stratosphérique',
        subtitle: 'Ascension Céleste & Piqué Cratère Terminal',
        archetype: 'dive_aoe',
        colorHex: 0x38bdf8,
        cssColor: '#38bdf8',
        startupDuration: 0.40,
        rushSpeed: 16.0,
        reach: 7.5,
        baseDmgMult: 2.50,
        statusEffect: null,
        beats: [
            { at: 0.35, label: '🦅 ASCENSION STRATOSPHÉRIQUE !', shake: 0.55, dmgRatio: 0.30, camAngle: 'clash' },
            { at: 0.95, label: '⚡ VITESSE TERMINALE !', shake: 0.80, dmgRatio: 0.30, camAngle: 'oblique' },
            { at: 1.55, label: '☄️ CHUTE STRATOSPHÉRIQUE !', shake: 1.12, dmgRatio: 0.40, camAngle: 'launch' }
        ]
    },
    maiasaura: {
        name: 'Résonance du Nid',
        subtitle: 'Triple Onde Sonique Paralysante',
        archetype: 'beam',
        colorHex: 0xf472b6,
        cssColor: '#f472b6',
        startupDuration: 0.40,
        rushSpeed: 0,
        reach: 11.0,
        baseDmgMult: 2.45,
        statusEffect: null,
        beats: [
            { at: 0.35, label: '🔊 HARMONIQUE MATERNELLE !', shake: 0.56, dmgRatio: 0.30, camAngle: 'clash' },
            { at: 0.95, label: '💥 ONDE DE CHOC SONIQUE !', shake: 0.76, dmgRatio: 0.30, camAngle: 'oblique' },
            { at: 1.55, label: '⚡ RÉSONANCE DU NID !', shake: 1.06, dmgRatio: 0.40, camAngle: 'launch' }
        ]
    },
    cameroceras: {
        name: 'Implosion Abyssale',
        subtitle: 'Vortex Hyponomique & Pression Ordovicienne',
        archetype: 'beam',
        colorHex: 0x0284c7,
        cssColor: '#0284c7',
        startupDuration: 0.44,
        rushSpeed: 0,
        reach: 11.5,
        baseDmgMult: 2.55,
        statusEffect: null,
        beats: [
            { at: 0.35, label: '🌊 SIPHON ABYSSAL !', shake: 0.60, dmgRatio: 0.30, camAngle: 'clash' },
            { at: 0.95, label: '🌀 PRESSION ORDOVICIENNE !', shake: 0.82, dmgRatio: 0.30, camAngle: 'oblique' },
            { at: 1.55, label: '💥 IMPLOSION ABYSSALE !', shake: 1.12, dmgRatio: 0.40, camAngle: 'launch' }
        ]
    },
    dimetrodon: {
        name: 'Fournaise de la Pangée',
        subtitle: 'Déflagration Solaire de la Voile Dorsale',
        archetype: 'seismic_aoe',
        colorHex: 0xf97316,
        cssColor: '#f97316',
        startupDuration: 0.44,
        rushSpeed: 0,
        reach: 10.5,
        baseDmgMult: 2.52,
        statusEffect: null,
        beats: [
            { at: 0.35, label: '☀️ SURCHARGE SOLAIRE !', shake: 0.62, dmgRatio: 0.30, camAngle: 'clash' },
            { at: 0.95, label: '🔥 ÉRUPTION THERMIQUE !', shake: 0.82, dmgRatio: 0.30, camAngle: 'oblique' },
            { at: 1.55, label: '🌋 FOURNAISE DE LA PANGÉE !', shake: 1.10, dmgRatio: 0.40, camAngle: 'launch' }
        ]
    }
};

var SUPER_SPEC_ALIASES = {
    apatosaurus: 'apato',
    ankylosaurus: 'ankylo',
    pachyrhinosaurus: 'pachyrhino',
    'terror-bird': 'terabird',
    terror_bird: 'terabird',
    quetzalcoatlus: 'quetzal',
    therizinosaurus: 'therizino',
    megatherium: 'giantsloth'
};

var FALLBACK_SUPER_SPEC = {
    name: 'Primal Super',
    subtitle: 'Déchaînement Préhistorique Ultime',
    archetype: 'cinematic_rush',
    colorHex: 0xf59e0b,
    cssColor: '#f59e0b',
    startupDuration: 0.42,
    rushSpeed: 18.0,
    reach: 4.4,
    baseDmgMult: 2.50,
    statusEffect: null,
    beats: DEFAULT_SUPER_BEATS
};

function getSuperSpec(dinoId) {
    if (!dinoId) return FALLBACK_SUPER_SPEC;
    const rawKey = typeof dinoId === 'object' ? (dinoId.id || '') : String(dinoId);
    const normalized = rawKey.trim().toLowerCase();
    const canonical = SUPER_SPEC_ALIASES[normalized] || normalized;
    return SUPER_SPECS[canonical] || FALLBACK_SUPER_SPEC;
}

function _computeProratedSuperDamage(attacker, spec) {
    const pow = (attacker && attacker.dino && attacker.dino.stats && attacker.dino.stats.pow) || 120;
    const rawTotal = Math.round(pow * ((spec && spec.baseDmgMult) || 2.50));
    const combo = (attacker && attacker.comboCount) || 0;
    let factor = 1.0;
    if (combo === 1) factor = 0.85;
    else if (combo === 2) factor = 0.72;
    else if (combo === 3) factor = 0.62;
    else if (combo >= 4) factor = 0.55;
    // Guaranteed 55% combo proration floor so combo-cancelled Supers stay devastating
    const floor = Math.round(rawTotal * 0.55);
    const total = Math.max(floor, Math.round(rawTotal * factor));
    return { rawTotal, total, floor };
}

function _applySuperStatusEffect(defender, statusEffect) {
    if (!defender || defender.isDead || !statusEffect) return;
    if (statusEffect === 'bleed') {
        defender.bleedStacks = 3;
        defender.bleedTimer = 5.0;
        if (typeof spawnFloatingPopup === 'function') {
            spawnFloatingPopup(defender.x, '🩸 HÉMORRAGIE ×3 !', '#dc2626');
        }
    } else if (statusEffect === 'venom') {
        defender.poisonStacks = 3;
        defender.poisonTimer = 6.0;
        if (typeof spawnFloatingPopup === 'function') {
            spawnFloatingPopup(defender.x, '🧪 NEUROTOXINE ×3 !', '#22c55e');
        }
    } else if (statusEffect === 'intimidate') {
        defender.atkPowerMod = 0.72;
        defender.atkPowerModTimer = 6.0;
        if (typeof spawnFloatingPopup === 'function') {
            spawnFloatingPopup(defender.x, '🦖 INTIMIDATION (-28% ATQ) !', '#eab308');
        }
    }
}

function _triggerExtinctionFinish(st, attacker, defender, spec, roundsBefore, wasKoActive) {
    if (st) {
        st.isExtinctionFinish = true;
        st.timer = Math.max(st.timer || 0, 1.25);
    }
    if (typeof superState !== 'undefined' && superState) {
        superState.isExtinctionFinish = true;
    }

    if (defender) {
        if (typeof spawn3DBloodAndBones === 'function') {
            spawn3DBloodAndBones(defender.x, (defender.y || 0) + 1.8, 36, true);
        }
        if (typeof spawn3DGroundShockwave === 'function') {
            spawn3DGroundShockwave(defender.x, 0xfef08a, 5.5, true, defender.groundY !== undefined ? defender.groundY : defender.y);
        }
    }
    screenShake = Math.max(typeof screenShake !== 'undefined' ? screenShake : 0, 1.25);
    camFovKick = Math.max(typeof camFovKick !== 'undefined' ? camFovKick : 0, 5.5);

    const alreadyTriggeredKo = !wasKoActive && (
        (typeof koSlowMoTimer !== 'undefined' && koSlowMoTimer > 0) ||
        (typeof koPendingData !== 'undefined' && Boolean(koPendingData)) ||
        ((attacker.roundsWon || 0) > roundsBefore)
    );

    if (alreadyTriggeredKo) {
        const alreadyExtinction = Boolean(typeof koPendingData !== 'undefined' && koPendingData && koPendingData.isExtinctionFinish);
        if (typeof koPendingData !== 'undefined' && koPendingData) {
            koPendingData.isExtinctionFinish = true;
        }
        if (typeof koSlowMoTimer !== 'undefined') {
            koSlowMoTimer = Math.max(koSlowMoTimer, 1.15);
        }
        battleTimeScale = 0.18;
        if (!alreadyExtinction) {
            if (typeof sfx !== 'undefined' && typeof sfx.playKoFinish === 'function') {
                sfx.playKoFinish(true);
            }
            if (typeof showSuperFlashOverlay === 'function') {
                showSuperFlashOverlay(attacker, spec, true);
            }
            if (typeof showAnnouncer === 'function') {
                const fighterName = (attacker && attacker.dino && attacker.dino.name) ? attacker.dino.name : 'APEX';
                showAnnouncer('EXTINCTION FINISH !', `${spec.name.toUpperCase()} — ${fighterName}`);
            }
        }
    } else {
        if (typeof handleKnockout === 'function') {
            handleKnockout(attacker, defender, true);
        }
        // Only emit overlay/announcer fallback if handleKnockout didn't already run match.js's Extinction Finish presentation
        const handledByMatch = Boolean(typeof koPendingData !== 'undefined' && koPendingData && koPendingData.isExtinctionFinish);
        if (!handledByMatch) {
            if (typeof showSuperFlashOverlay === 'function') {
                showSuperFlashOverlay(attacker, spec, true);
            }
            if (typeof showAnnouncer === 'function') {
                const fighterName = (attacker && attacker.dino && attacker.dino.name) ? attacker.dino.name : 'APEX';
                showAnnouncer('EXTINCTION FINISH !', `${spec.name.toUpperCase()} — ${fighterName}`);
            }
        }
    }
}

function _finishSuperCleanup(st) {
    const targetState = st || (typeof superState !== 'undefined' ? superState : null);
    if (targetState) {
        const att = targetState.attacker;
        const def = targetState.defender;
        if (att) {
            att.isSuperAttacker = false;
            att.superBeatStage = 0;
            if (att.action && att.action.startsWith('super_')) {
                att.action = 'idle';
                att.actionTimer = 0;
                att.actionDuration = 0;
            }
            if (att.combatController && typeof CombatState !== 'undefined' && (
                att.combatController.state === CombatState.ATTACK_WINDUP ||
                att.combatController.state === CombatState.ATTACK_ACTIVE ||
                att.combatController.state === CombatState.ATTACK_RECOVERY
            )) {
                att.combatController.state = CombatState.IDLE;
            }
        }
        if (def) {
            def.isSuperTarget = false;
            def.superBeatStage = 0;
        }
    }
    superState = null;
    if (typeof hideSuperFlashOverlay === 'function') {
        hideSuperFlashOverlay();
    } else if (typeof document !== 'undefined' && document.getElementById) {
        const el = document.getElementById('superFlashOverlay');
        if (el && el.classList) {
            el.classList.add('hidden');
            el.classList.remove('super-flash-active', 'extinction-finish-active');
        }
    }
}

function teardownSuperState() {
    const active = typeof superState !== 'undefined' ? superState : null;
    _finishSuperCleanup(active);

    const fighters = [];
    if (typeof fighter1 !== 'undefined' && fighter1) fighters.push(fighter1);
    if (typeof fighter2 !== 'undefined' && fighter2) fighters.push(fighter2);
    for (let i = 0; i < fighters.length; i++) {
        const f = fighters[i];
        f.isSuperAttacker = false;
        f.isSuperTarget = false;
        f.superInvulnTimer = 0;
        f.superBeatStage = 0;
        if (f.action && f.action.startsWith('super_')) {
            f.action = 'idle';
            f.actionTimer = 0;
            f.actionDuration = 0;
        }
    }
}

function executeSuperAttack(attacker, defender) {
    if (!attacker || attacker.isDead || attacker.isDizzy) return false;
    if (typeof superState !== 'undefined' && superState) return false;
    if (typeof koSlowMoTimer !== 'undefined' && koSlowMoTimer > 0) return false;

    if ((attacker.rage || 0) < 100) {
        const shouldNotify = attacker.isP1 !== false || (typeof gameMode !== 'undefined' && gameMode === 'pvp');
        if (shouldNotify) {
            if (typeof sfx !== 'undefined' && typeof sfx.playCooldownWarning === 'function') {
                sfx.playCooldownWarning();
            }
            if (typeof spawnFloatingPopup === 'function') {
                spawnFloatingPopup(attacker.x || 0, '⚡ RAGE INSUFFISANTE (100% REQUIS) !', '#ef4444');
            }
        }
        return false;
    }

    const spec = getSuperSpec(attacker.dino && attacker.dino.id);
    const dmgProfile = _computeProratedSuperDamage(attacker, spec);

    if (defender && defender.x !== undefined && attacker.x !== undefined && Math.abs(defender.x - attacker.x) > 0.05) {
        attacker.facing = attacker.x <= defender.x ? 1 : -1;
    }

    attacker.rage = 0;
    attacker.superInvulnTimer = 0.28;
    attacker.isSuperAttacker = true;
    attacker.isBlocking = false;
    attacker.blockType = 'none';
    attacker.dashTimer = 0;
    attacker.bufferedAction = null;
    attacker.bufferedInput = null;
    attacker.action = 'super_startup';
    attacker.actionTimer = 0;
    attacker.actionDuration = spec.startupDuration || 0.42;
    attacker.hasHitCurrentAttack = false;
    attacker.hasHitConfirmed = false;
    attacker.hasSpawnedAttackFx = false;
    attacker.superBeatStage = 0;
    attacker.vx = 0;

    superState = {
        phase: 'flash',
        timer: 0.45,
        elapsed: 0,
        beatApplied: 0,
        beat: 0,
        attacker,
        defender: defender || null,
        spec,
        lockPositions: null,
        hasConnected: false,
        aoeTicks: 0,
        aoeBlocked: false,
        aoeParried: false,
        rawTotalDmg: dmgProfile.rawTotal,
        totalSuperDmg: dmgProfile.total,
        divePeakY: null,
        diveTargetX: null,
        diveSlammed: false,
        _hitMinions: new Set(),
        _beat1Dmg: 0,
        _beat2Dmg: 0,
        isExtinctionFinish: false
    };

    if (typeof sfx !== 'undefined') {
        if (typeof sfx.playSuperFlash === 'function') {
            sfx.playSuperFlash();
        } else if (typeof sfx.playGong === 'function') {
            sfx.playGong();
        }
        if (typeof sfx.playRoar === 'function') {
            sfx.playRoar(68, 0.55);
        }
    }
    if (typeof spawn3DSuperAura === 'function') {
        spawn3DSuperAura(attacker, spec.colorHex);
    }
    if (typeof showSuperFlashOverlay === 'function') {
        showSuperFlashOverlay(attacker, spec, false);
    }
    if (typeof updateBattleHUD === 'function') {
        updateBattleHUD();
    }
    if (typeof matchState !== 'undefined' && matchState === 'campaign_level' && typeof updateCampaignSmashHUD === 'function') {
        updateCampaignSmashHUD();
    }
    return true;
}

function _transitionToWhiffRecovery(st, duration = 0.45) {
    const attacker = st.attacker;
    st.phase = 'whiff_recovery';
    st.timer = duration;
    st.elapsed = 0;
    if (attacker) {
        attacker.action = 'super_whiff';
        attacker.actionTimer = 0;
        attacker.actionDuration = duration;
        if (attacker.combatController && typeof CombatState !== 'undefined') {
            attacker.combatController.state = CombatState.ATTACK_RECOVERY;
        }
    }
}

function _sweepCampaignMinionsInSuper(st, dmg, knockX, knockY, isRadial, range) {
    if (typeof campaignActiveMinions === 'undefined' || !Array.isArray(campaignActiveMinions) || campaignActiveMinions.length === 0) {
        return 0;
    }
    const attacker = st.attacker;
    const facing = attacker.facing || 1;
    let hits = 0;
    for (let i = 0; i < campaignActiveMinions.length; i++) {
        const minion = campaignActiveMinions[i];
        if (!minion || minion.isDead) continue;
        if (st.phase === 'startup' && st._hitMinions && st._hitMinions.has(minion)) continue;

        const dx = minion.x - attacker.x;
        const dist = Math.abs(dx);
        const effRange = range + (minion.radius || 0.75);
        const inDir = isRadial || (dx * facing >= -1.2);
        const vertOk = Math.abs((minion.y || 0) - (attacker.y || 0)) <= 4.2;

        if (dist <= effRange && inDir && vertOk) {
            if (st.phase === 'startup' && st._hitMinions) {
                st._hitMinions.add(minion);
            }
            const dir = isRadial ? (dx >= 0 ? 1 : -1) : facing;
            if (typeof minion.takeDamage === 'function') {
                minion.takeDamage(dmg, dir * Math.abs(knockX), knockY, 'super_startup');
            }
            hits++;
        }
    }

    if (hits > 0) {
        attacker.hasHitConfirmed = true;
        attacker.hasHitCurrentAttack = true;
        if (typeof campaignComboCount !== 'undefined') campaignComboCount += hits;
        if (typeof campaignLevelScore !== 'undefined') campaignLevelScore += dmg * 3 * hits;
        hitstopTimer = Math.max(typeof hitstopTimer !== 'undefined' ? hitstopTimer : 0, 0.085);
        screenShake = Math.max(typeof screenShake !== 'undefined' ? screenShake : 0, 0.55);
        if (typeof sfx !== 'undefined' && typeof sfx.playHit === 'function') {
            sfx.playHit(true, { comboCount: typeof campaignComboCount !== 'undefined' ? campaignComboCount : hits });
        }
        if (typeof updateCampaignSmashHUD === 'function') {
            updateCampaignSmashHUD();
        }
    }
    return hits;
}

function onSuperStartupContact(attacker, defender) {
    if (!attacker || !defender || defender.isDead) return false;
    if (typeof superState === 'undefined' || !superState) return false;
    if (superState.attacker !== attacker || superState.phase !== 'startup') return false;

    // Respect wakeup & reversal super invulnerability
    if ((defender.superInvulnTimer || 0) > 0) return false;
    if (defender.combatController && typeof CombatState !== 'undefined' && defender.combatController.state === CombatState.WAKE_UP_STAND) {
        return false;
    }

    const st = superState;
    const spec = st.spec || getSuperSpec(attacker.dino && attacker.dino.id);
    const facing = attacker.facing || (attacker.x <= defender.x ? 1 : -1);
    const reach = spec.reach || 4.4;
    const dx = (defender.x || 0) - (attacker.x || 0);
    const dist = Math.abs(dx);
    const inFront = (dx * facing) >= -1.25;
    const vertOk = typeof isWithinVerticalHitBand === 'function'
        ? isWithinVerticalHitBand(attacker, defender, 2.3, 1.8)
        : Math.abs((defender.y || 0) - (attacker.y || 0)) <= 2.3;

    if (dist > reach || !inFront || !vertOk) {
        return false;
    }

    attacker.hasHitCurrentAttack = true;

    // Check Defender Block / Perfect Parry (Mid/High matched guard blocks Super Rush)
    const isBlockingMatched = Boolean(
        defender.isBlocking &&
        !defender.isDizzy &&
        (defender.blockType === 'mid' || defender.blockType === 'high' || !defender.blockType || defender.blockType === 'none')
    );

    if (isBlockingMatched) {
        const nowSec = (typeof performance !== 'undefined' && performance.now) ? performance.now() * 0.001 : 0;
        const guardAge = nowSec - (defender.guardStartTime !== undefined ? defender.guardStartTime : -999);
        const isPerfectParry = guardAge >= 0 && guardAge <= 0.13;

        if (isPerfectParry) {
            defender.rage = Math.min(100, (defender.rage || 0) + 15);
            defender.hitFlashTimer = 0.16;
            defender.hitFlashColor = 0xfef08a;
            hitstopTimer = 0.13;
            hitstopTarget = attacker;
            screenShake = Math.max(typeof screenShake !== 'undefined' ? screenShake : 0, 0.35);
            if (typeof sfx !== 'undefined') {
                if (typeof sfx.playParry === 'function') sfx.playParry();
                else if (typeof sfx.playBoneCrack === 'function') sfx.playBoneCrack();
            }
            if (typeof spawn3DParryBurst === 'function') {
                spawn3DParryBurst(defender.x, (defender.y || 0) + 1.8);
            }
            if (typeof spawnFloatingPopup === 'function') {
                spawnFloatingPopup(defender.x, '⚡ PARADE PARFAITE SUPER !', '#fef08a');
            }
            attacker.vx = -facing * 9.5;
            if (attacker.combatController && typeof attacker.combatController.triggerAttackerBlockDeflect === 'function') {
                attacker.combatController.triggerAttackerBlockDeflect('mid');
                if (attacker.combatController.deflectTimer !== undefined) {
                    attacker.combatController.deflectTimer = 0.48;
                }
            }
            _transitionToWhiffRecovery(st, 0.52);
            if (typeof updateBattleHUD === 'function') updateBattleHUD();
            return true;
        }

        // Normal Block vs Super: 18% chip damage & 55 guardStamina drain, bounce attacker to whiff_recovery
        const rawBase = st.rawTotalDmg || Math.round(((attacker.dino && attacker.dino.stats && attacker.dino.stats.pow) || 120) * (spec.baseDmgMult || 2.5));
        const chipDmg = Math.max(10, Math.round(rawBase * 0.18));
        const prevStamina = defender.guardStamina !== undefined ? defender.guardStamina : 100;
        defender.guardStamina = Math.max(0, prevStamina - 55);
        const guardBroken = defender.guardStamina <= 0;

        const minHp = (typeof gameMode !== 'undefined' && gameMode === 'practice' && !defender.isP1) ? 150 : 0;
        defender.hp = Math.max(minHp, (defender.hp || 0) - chipDmg);
        defender.hitStun = guardBroken ? 0.45 : 0.26;
        defender.vx = facing * 6.5;
        defender.rage = Math.min(100, (defender.rage || 0) + 8);
        if (guardBroken) {
            defender.isBlocking = false;
            defender.blockType = 'none';
        }

        hitstopTimer = guardBroken ? 0.15 : 0.095;
        hitstopTarget = defender;
        screenShake = Math.max(typeof screenShake !== 'undefined' ? screenShake : 0, guardBroken ? 0.48 : 0.34);

        if (typeof sfx !== 'undefined') {
            if (guardBroken && typeof sfx.playGuardBreak === 'function') sfx.playGuardBreak();
            else if (typeof sfx.playBlock === 'function') sfx.playBlock(true);
            else if (typeof sfx.playHit === 'function') sfx.playHit(false);
        }
        if (typeof spawn3DGuardDeflectEffect === 'function') {
            spawn3DGuardDeflectEffect(defender, defender.blockType || 'mid');
        }
        if (typeof spawnFloatingPopup === 'function') {
            spawnFloatingPopup(
                defender.x,
                guardBroken ? `💥 GARDE BRISÉE (-${chipDmg}) !` : `🛡️ SUPER BLOQUÉ (-${chipDmg})`,
                guardBroken ? '#ef4444' : '#38bdf8'
            );
        }

        attacker.vx = -facing * 7.5;
        _transitionToWhiffRecovery(st, 0.45);
        if (typeof updateBattleHUD === 'function') updateBattleHUD();

        if (defender.hp <= 0) {
            teardownSuperState();
            if (typeof matchState !== 'undefined' && matchState === 'fight' && typeof handleKnockout === 'function') {
                handleKnockout(attacker, defender, false);
            } else if (typeof matchState !== 'undefined' && matchState === 'campaign_level') {
                if (defender === (typeof fighter1 !== 'undefined' ? fighter1 : null) && typeof handlePlayerStockLoss === 'function') {
                    handlePlayerStockLoss();
                } else if (typeof handleCampaignBossDefeated === 'function') {
                    handleCampaignBossDefeated();
                }
            }
        }
        return true;
    }

    // Clean Hit -> Transition into 3-Beat Cinematic Choreography!
    const bounds = typeof getStageBounds3D === 'function'
        ? getStageBounds3D()
        : {
            left: typeof STAGE_LEFT_3D !== 'undefined' ? STAGE_LEFT_3D : -11.0,
            right: typeof STAGE_RIGHT_3D !== 'undefined' ? STAGE_RIGHT_3D : 11.0
        };
    const spacing = 2.45;
    const margin = 3.0;
    let lockDefX = Math.max(bounds.left + margin, Math.min(bounds.right - margin, defender.x || 0));
    let lockAttX = lockDefX - facing * spacing;
    if (lockAttX < bounds.left + 1.0) {
        lockAttX = bounds.left + 1.0;
        lockDefX = lockAttX + facing * spacing;
    } else if (lockAttX > bounds.right - 1.0) {
        lockAttX = bounds.right - 1.0;
        lockDefX = lockAttX + facing * spacing;
    }

    const attGroundY = typeof getArenaGroundHeight === 'function'
        ? getArenaGroundHeight(typeof currentArena !== 'undefined' ? currentArena : 'volcano', lockAttX, 0)
        : (attacker.groundY || 0);
    const defGroundY = typeof getArenaGroundHeight === 'function'
        ? getArenaGroundHeight(typeof currentArena !== 'undefined' ? currentArena : 'volcano', lockDefX, 0)
        : (defender.groundY || 0);

    attacker.x = lockAttX;
    attacker.y = attGroundY;
    attacker.groundY = attGroundY;
    attacker.onPlatform = null;
    attacker.vx = 0;
    attacker.vy = 0;
    attacker.facing = facing;
    attacker.isBlocking = false;
    attacker.blockType = 'none';
    attacker.hasHitConfirmed = true;
    attacker.action = 'super_cinematic';
    attacker.actionTimer = 0;
    attacker.actionDuration = 1.95;
    attacker.isSuperAttacker = true;
    attacker.superBeatStage = 0;

    defender.x = lockDefX;
    defender.y = defGroundY;
    defender.groundY = defGroundY;
    defender.onPlatform = null;
    defender.vx = 0;
    defender.vy = 0;
    defender.facing = -facing;
    defender.isBlocking = false;
    defender.blockType = 'none';
    defender.bufferedAction = null;
    defender.bufferedInput = null;
    defender.action = 'hit';
    defender.actionTimer = 0;
    defender.actionDuration = 0;
    defender.hitStun = 2.05;
    defender.isSuperTarget = true;
    defender.superBeatStage = 0;

    st.phase = 'cinematic';
    st.timer = 1.95;
    st.elapsed = 0;
    st.beatApplied = 0;
    st.beat = 0;
    st.hasConnected = true;
    st.lockPositions = {
        attacker,
        defender,
        attX: lockAttX,
        defX: lockDefX,
        attY: attGroundY,
        defY: defGroundY,
        attFacing: facing,
        defFacing: -facing
    };

    screenShake = Math.max(typeof screenShake !== 'undefined' ? screenShake : 0, 0.45);
    camFovKick = Math.max(typeof camFovKick !== 'undefined' ? camFovKick : 0, 3.0);
    if (typeof sfx !== 'undefined' && typeof sfx.playHit === 'function') {
        sfx.playHit(true, { comboCount: (attacker.comboCount || 0) + 1 });
    }
    if (typeof spawn3DHitImpactBurst === 'function') {
        spawn3DHitImpactBurst(defender, 'mid', true);
    }

    return true;
}

function _applyCinematicBeat(st, beatDef, beatNum) {
    const attacker = st.attacker;
    const defender = st.defender;
    const spec = st.spec || FALLBACK_SUPER_SPEC;
    const facing = attacker.facing || 1;
    const isFinalBeat = beatNum >= 3;

    screenShake = Math.max(typeof screenShake !== 'undefined' ? screenShake : 0, beatDef.shake || (isFinalBeat ? 1.08 : 0.65));
    camFovKick = Math.max(typeof camFovKick !== 'undefined' ? camFovKick : 0, isFinalBeat ? 4.8 : 2.8);
    hitstopTimer = isFinalBeat ? 0.15 : 0.08;
    hitstopTarget = defender || null;

    if (typeof sfx !== 'undefined') {
        if (typeof sfx.playBoneCrack === 'function') sfx.playBoneCrack();
        if (typeof sfx.playHit === 'function') sfx.playHit(true, { comboCount: (attacker.comboCount || 0) + 1 });
        if (isFinalBeat && typeof sfx.playRoar === 'function') sfx.playRoar(58, 0.72);
    }
    if (typeof triggerGamepadRumble === 'function') {
        triggerGamepadRumble(0, isFinalBeat ? 0.85 : 0.55, isFinalBeat ? 1.0 : 0.8, isFinalBeat ? 300 : 180);
    }

    if (!defender) return;

    defender.hitFlashTimer = isFinalBeat ? 0.16 : 0.10;
    defender.hitFlashColor = isFinalBeat ? 0xf97316 : 0xffffff;

    if (typeof spawn3DBloodAndBones === 'function') {
        spawn3DBloodAndBones(defender.x, (defender.y || 0) + 2.0, isFinalBeat ? 34 : 20, true);
    }
    if (typeof spawn3DHitImpactBurst === 'function') {
        spawn3DHitImpactBurst(defender, beatNum === 1 ? 'high' : 'mid', true);
    }
    if (isFinalBeat && typeof spawn3DGroundShockwave === 'function') {
        spawn3DGroundShockwave(defender.x, spec.colorHex || 0xef4444, 4.5, true, defender.groundY !== undefined ? defender.groundY : defender.y);
    }

    const totalSuper = st.totalSuperDmg || st.rawTotalDmg || 250;
    let beatDmg;
    if (beatNum === 1) {
        beatDmg = Math.max(10, Math.round(totalSuper * (beatDef.dmgRatio || 0.30)));
        st._beat1Dmg = beatDmg;
    } else if (beatNum === 2) {
        beatDmg = Math.max(10, Math.round(totalSuper * (beatDef.dmgRatio || 0.30)));
        st._beat2Dmg = beatDmg;
    } else {
        beatDmg = Math.max(10, totalSuper - (st._beat1Dmg || 0) - (st._beat2Dmg || 0));
    }

    if (isFinalBeat) {
        st.lockPositions = null;
        _applySuperStatusEffect(defender, spec.statusEffect);
    }

    const roundsBefore = attacker.roundsWon || 0;
    const wasKoActive = (typeof koSlowMoTimer !== 'undefined' && koSlowMoTimer > 0) ||
        (typeof koPendingData !== 'undefined' && Boolean(koPendingData));
    const isFinalRound = (typeof matchState !== 'undefined' && matchState === 'fight' && roundsBefore >= 1);
    const hpBefore = defender.hp || 0;

    if (typeof applyDamage === 'function') {
        applyDamage(attacker, defender, beatDmg, true, beatDef.label || spec.name, beatNum < 3, 'super', {
            skipComboScaling: true,
            isSuperBeat: true,
            beatNum,
            deferKnockout: isFinalBeat
        });
    } else {
        const minHp = beatNum < 3 ? 1 : 0;
        defender.hp = Math.max(minHp, (defender.hp || 0) - beatDmg);
    }

    if (isFinalBeat) {
        const hpAfterApply = defender.hp || 0;
        const diedInApply = hpAfterApply <= 0;
        const minHp = (typeof gameMode !== 'undefined' && gameMode === 'practice' && !defender.isP1) ? 150 : 0;
        // Enforce 55% combo proration floor even if applyDamage applied extra combo scaling on Beat 3
        if (!diedInApply && minHp === 0) {
            const atkMod = attacker.atkPowerMod !== undefined ? attacker.atkPowerMod : 1.0;
            const expectedBeat3 = Math.max(1, Math.round(beatDmg * atkMod));
            const actualDealt = Math.max(0, hpBefore - hpAfterApply);
            const shortfall = Math.max(0, expectedBeat3 - actualDealt);
            if (shortfall > 0) {
                defender.hp = Math.max(0, defender.hp - shortfall);
                if (typeof attacker.comboDamage === 'number') {
                    attacker.comboDamage += shortfall;
                }
                if (typeof updateBattleHUD === 'function') updateBattleHUD();
            }
        }

        // Launch defender violently across the arena
        defender.isSuperTarget = false;
        defender.vx = facing * 14;
        defender.vy = 7.5;
        defender.onPlatform = null;

        if (defender.hp <= 0) {
            const koNotYetTriggered = !(typeof koSlowMoTimer !== 'undefined' && koSlowMoTimer > 0) &&
                !(typeof koPendingData !== 'undefined' && Boolean(koPendingData));
            if (isFinalRound) {
                _triggerExtinctionFinish(st, attacker, defender, spec, roundsBefore, wasKoActive);
            } else if (koNotYetTriggered) {
                if (typeof matchState !== 'undefined' && matchState === 'fight' && typeof handleKnockout === 'function') {
                    handleKnockout(attacker, defender, false);
                } else if (typeof matchState !== 'undefined' && matchState === 'campaign_level') {
                    if (defender === (typeof fighter1 !== 'undefined' ? fighter1 : null) && typeof handlePlayerStockLoss === 'function') {
                        handlePlayerStockLoss();
                    } else if (typeof handleCampaignBossDefeated === 'function') {
                        handleCampaignBossDefeated();
                    }
                }
            }
        }
    }
}

function _isDefenderInAoeRange(attacker, defender, spec) {
    if (!attacker || !defender || defender.isDead) return false;
    const facing = attacker.facing || 1;
    const dx = (defender.x || 0) - (attacker.x || 0);
    const dist = Math.abs(dx);
    const reach = (spec && spec.reach) || 10.5;
    const dy = Math.abs((defender.y || 0) - (attacker.y || 0));

    if (spec.archetype === 'beam') {
        return (dx * facing >= -0.9) && dist <= reach && dy <= 3.4;
    }
    if (spec.archetype === 'seismic_aoe') {
        return dist <= reach && dy <= 3.2;
    }
    // dive_aoe
    return dist <= reach && dy <= 4.5;
}

function _applyAoePulse(st, tickNum) {
    const attacker = st.attacker;
    const defender = st.defender;
    const spec = st.spec || FALLBACK_SUPER_SPEC;
    const facing = attacker.facing || 1;
    const isFinalTick = tickNum >= 5;

    const totalSuper = st.totalSuperDmg || st.rawTotalDmg || 250;
    const baseTick = Math.max(8, Math.round(totalSuper * 0.18));
    const tickDmg = isFinalTick ? Math.max(12, totalSuper - baseTick * 4) : baseTick;

    st.beat = Math.min(3, Math.ceil((tickNum / 5) * 3));
    attacker.superBeatStage = st.beat;

    // Archetype visual & audio pulse
    screenShake = Math.max(typeof screenShake !== 'undefined' ? screenShake : 0, isFinalTick ? 1.0 : 0.45);
    camFovKick = Math.max(typeof camFovKick !== 'undefined' ? camFovKick : 0, isFinalTick ? 4.2 : 1.6);

    if (spec.archetype === 'beam') {
        if ((tickNum === 1 || tickNum === 3 || isFinalTick) && typeof spawn3DSuperBeam === 'function') {
            spawn3DSuperBeam(attacker, spec.colorHex, spec.reach || 11.5);
        }
    } else if (spec.archetype === 'seismic_aoe') {
        if (typeof spawn3DGroundShockwave === 'function') {
            const gY = attacker.groundY !== undefined ? attacker.groundY : (attacker.y || 0);
            spawn3DGroundShockwave(attacker.x + facing * tickNum * 1.8, spec.colorHex, 3.6 + tickNum * 0.55, true, gY);
            spawn3DGroundShockwave(attacker.x - facing * tickNum * 1.4, spec.colorHex, 3.0 + tickNum * 0.45, false, gY);
        }
    } else if (spec.archetype === 'dive_aoe') {
        if (typeof spawn3DGroundShockwave === 'function') {
            const gY = attacker.groundY !== undefined ? attacker.groundY : (attacker.y || 0);
            spawn3DGroundShockwave(attacker.x, spec.colorHex, 3.4 + tickNum * 0.65, true, gY);
        }
    }

    if (typeof sfx !== 'undefined') {
        if (isFinalTick && typeof sfx.playBoneCrack === 'function') sfx.playBoneCrack();
        if (typeof sfx.playHit === 'function') sfx.playHit(isFinalTick || tickNum >= 3, { comboCount: tickNum });
    }

    // 1. Hit Duel / Boss Defender if in AoE range
    if (defender && !defender.isDead && _isDefenderInAoeRange(attacker, defender, spec)) {
        const invuln = (defender.superInvulnTimer || 0) > 0 ||
            (defender.combatController && typeof CombatState !== 'undefined' && defender.combatController.state === CombatState.WAKE_UP_STAND);

        if (!invuln && !st.aoeParried) {
            if (defender.isBlocking && !defender.isDizzy) {
                const nowSec = (typeof performance !== 'undefined' && performance.now) ? performance.now() * 0.001 : 0;
                const guardAge = nowSec - (defender.guardStartTime !== undefined ? defender.guardStartTime : -999);
                const isPerfectParry = !st.aoeBlocked && guardAge >= 0 && guardAge <= 0.13;

                if (isPerfectParry) {
                    st.aoeParried = true;
                    defender.rage = Math.min(100, (defender.rage || 0) + 15);
                    defender.hitFlashTimer = 0.16;
                    defender.hitFlashColor = 0xfef08a;
                    hitstopTimer = 0.11;
                    hitstopTarget = attacker;
                    if (typeof sfx !== 'undefined' && typeof sfx.playParry === 'function') sfx.playParry();
                    if (typeof spawn3DParryBurst === 'function') spawn3DParryBurst(defender.x, (defender.y || 0) + 1.8);
                    if (typeof spawnFloatingPopup === 'function') spawnFloatingPopup(defender.x, '⚡ PARADE PARFAITE !', '#fef08a');
                    if (typeof updateBattleHUD === 'function') updateBattleHUD();
                } else {
                    st.aoeBlocked = true;
                    const chipDmg = Math.max(4, Math.round(tickDmg * 0.22));
                    const prevStam = defender.guardStamina !== undefined ? defender.guardStamina : 100;
                    defender.guardStamina = Math.max(0, prevStam - 12);
                    const minHp = (typeof gameMode !== 'undefined' && gameMode === 'practice' && !defender.isP1) ? 150 : 0;
                    defender.hp = Math.max(minHp, (defender.hp || 0) - chipDmg);
                    defender.hitStun = 0.22;
                    defender.vx = facing * 3.5;
                    defender.rage = Math.min(100, (defender.rage || 0) + 2.5);
                    if (defender.guardStamina <= 0) {
                        defender.isBlocking = false;
                        defender.blockType = 'none';
                        if (typeof sfx !== 'undefined' && typeof sfx.playGuardBreak === 'function') sfx.playGuardBreak();
                        if (typeof spawnFloatingPopup === 'function') spawnFloatingPopup(defender.x, '💥 GARDE BRISÉE !', '#ef4444');
                    } else {
                        if (typeof sfx !== 'undefined' && typeof sfx.playBlock === 'function') sfx.playBlock(isFinalTick);
                        if (typeof spawn3DGuardDeflectEffect === 'function') spawn3DGuardDeflectEffect(defender, defender.blockType || 'mid');
                    }
                    if (typeof updateBattleHUD === 'function') updateBattleHUD();
                    if (defender.hp <= 0) {
                        if (typeof matchState !== 'undefined' && matchState === 'fight' && typeof handleKnockout === 'function') {
                            handleKnockout(attacker, defender, false);
                        } else if (typeof matchState !== 'undefined' && matchState === 'campaign_level' && typeof handleCampaignBossDefeated === 'function') {
                            handleCampaignBossDefeated();
                        }
                    }
                }
            } else {
                // Unblocked AoE Hit!
                st.hasConnected = true;
                attacker.hasHitConfirmed = true;
                defender.hitFlashTimer = isFinalTick ? 0.14 : 0.08;
                defender.hitFlashColor = isFinalTick ? 0xf97316 : 0xffffff;
                hitstopTimer = isFinalTick ? 0.14 : 0.05;
                hitstopTarget = defender;

                if (typeof spawn3DBloodAndBones === 'function') {
                    spawn3DBloodAndBones(defender.x, (defender.y || 0) + 1.8, isFinalTick ? 28 : 10, isFinalTick);
                }
                if (typeof spawn3DHitImpactBurst === 'function') {
                    spawn3DHitImpactBurst(defender, 'mid', isFinalTick || tickNum >= 3);
                }

                const roundsBefore = attacker.roundsWon || 0;
                const wasKoActive = (typeof koSlowMoTimer !== 'undefined' && koSlowMoTimer > 0) ||
                    (typeof koPendingData !== 'undefined' && Boolean(koPendingData));
                const isFinalRound = (typeof matchState !== 'undefined' && matchState === 'fight' && roundsBefore >= 1);
                const hpBefore = defender.hp || 0;

                if (isFinalTick) {
                    _applySuperStatusEffect(defender, spec.statusEffect);
                }

                const hitLabel = isFinalTick
                    ? `☢ ${spec.name.toUpperCase()} !`
                    : (tickNum === 1 ? `${spec.beats[0].label}` : '');

                if (typeof applyDamage === 'function') {
                    applyDamage(attacker, defender, tickDmg, isFinalTick || tickNum >= 3, hitLabel, !isFinalTick, 'super', {
                        skipComboScaling: true,
                        isSuperBeat: true,
                        beatNum: tickNum,
                        deferKnockout: isFinalTick
                    });
                } else {
                    const minHp = !isFinalTick ? 1 : 0;
                    defender.hp = Math.max(minHp, (defender.hp || 0) - tickDmg);
                }

                if (!isFinalTick) {
                    defender.vx = facing * 3.2;
                    defender.vy = Math.max(defender.vy || 0, 3.0);
                    defender.hitStun = 0.35;
                } else {
                    const hpAfterApply = defender.hp || 0;
                    const diedInApply = hpAfterApply <= 0;
                    const minHp = (typeof gameMode !== 'undefined' && gameMode === 'practice' && !defender.isP1) ? 150 : 0;
                    if (!diedInApply && minHp === 0) {
                        const atkMod = attacker.atkPowerMod !== undefined ? attacker.atkPowerMod : 1.0;
                        const expected = Math.max(1, Math.round(tickDmg * atkMod));
                        const actualDealt = Math.max(0, hpBefore - hpAfterApply);
                        const shortfall = Math.max(0, expected - actualDealt);
                        if (shortfall > 0) {
                            defender.hp = Math.max(0, defender.hp - shortfall);
                            if (typeof attacker.comboDamage === 'number') attacker.comboDamage += shortfall;
                            if (typeof updateBattleHUD === 'function') updateBattleHUD();
                        }
                    }

                    defender.vx = facing * 14.5;
                    defender.vy = 8.0;
                    defender.onPlatform = null;

                    if (defender.hp <= 0) {
                        const koNotYetTriggered = !(typeof koSlowMoTimer !== 'undefined' && koSlowMoTimer > 0) &&
                            !(typeof koPendingData !== 'undefined' && Boolean(koPendingData));
                        if (isFinalRound) {
                            _triggerExtinctionFinish(st, attacker, defender, spec, roundsBefore, wasKoActive);
                        } else if (koNotYetTriggered) {
                            if (typeof matchState !== 'undefined' && matchState === 'fight' && typeof handleKnockout === 'function') {
                                handleKnockout(attacker, defender, false);
                            } else if (typeof matchState !== 'undefined' && matchState === 'campaign_level') {
                                if (defender === (typeof fighter1 !== 'undefined' ? fighter1 : null) && typeof handlePlayerStockLoss === 'function') {
                                    handlePlayerStockLoss();
                                } else if (typeof handleCampaignBossDefeated === 'function') {
                                    handleCampaignBossDefeated();
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // 2. Hit ALL Campaign Minions in range
    const isRadial = spec.archetype === 'seismic_aoe' || spec.archetype === 'dive_aoe';
    const minionHitDmg = Math.max(55, Math.round(tickDmg * 1.2));
    _sweepCampaignMinionsInSuper(
        st,
        minionHitDmg,
        isFinalTick ? 16.0 : 6.5,
        isFinalTick ? 10.0 : 4.5,
        isRadial,
        (spec.reach || 10.5) + 1.2
    );
}

function updateSuperAttack(dt, nowSec) {
    if (typeof isMatchPaused !== 'undefined' && isMatchPaused) return;
    if (typeof superState === 'undefined' || !superState) return;

    const st = superState;
    const attacker = st.attacker;
    const defender = st.defender;
    const spec = st.spec || FALLBACK_SUPER_SPEC;

    if (!attacker || attacker.isDead) {
        teardownSuperState();
        return;
    }

    const safeDt = Math.max(0, Number(dt) || 0);

    // ========================================================================
    // PHASE 1: SUPER FLASH (0.45s Dramatic Freeze + Aura + Overlay)
    // ========================================================================
    if (st.phase === 'flash') {
        st.timer -= safeDt;
        st.elapsed += safeDt;
        attacker.vx = 0;
        attacker.action = 'super_startup';
        attacker.actionTimer = 0;

        if (st.timer <= 0) {
            if (typeof hideSuperFlashOverlay === 'function') {
                hideSuperFlashOverlay();
            }
            st.elapsed = 0;

            if (spec.archetype === 'cinematic_rush') {
                const dur = spec.startupDuration || 0.42;
                st.phase = 'startup';
                st.timer = dur;
                attacker.action = 'super_startup';
                attacker.actionTimer = 0;
                attacker.actionDuration = dur;
                attacker.hasHitCurrentAttack = false;
                attacker.hasHitConfirmed = false;
                attacker.vx = (attacker.facing || 1) * (spec.rushSpeed || 18.0);

                if (typeof sfx !== 'undefined') {
                    if (typeof sfx.playDash === 'function') sfx.playDash();
                    else if (typeof sfx.playWhoosh === 'function') sfx.playWhoosh();
                }
                if (typeof spawn3DMomentumTrail === 'function') spawn3DMomentumTrail(attacker);
                if (typeof spawn3DDustPuff === 'function') spawn3DDustPuff(attacker.x || 0, attacker.y || 0, 1.15, 6);
            } else {
                // Beam / Seismic AoE / Dive AoE -> Active AoE Phase
                st.phase = 'active_aoe';
                st.timer = 1.15;
                st.aoeTicks = 0;
                attacker.action = 'super_aoe';
                attacker.actionTimer = 0;
                attacker.actionDuration = 1.15;

                if (spec.archetype === 'beam') {
                    attacker.vx = 0;
                    if (typeof spawn3DSuperBeam === 'function') {
                        spawn3DSuperBeam(attacker, spec.colorHex, spec.reach || 11.5);
                    }
                    if (typeof spawn3DGroundShockwave === 'function') {
                        spawn3DGroundShockwave((attacker.x || 0) + (attacker.facing || 1) * 1.5, spec.colorHex, 3.8, true, attacker.groundY !== undefined ? attacker.groundY : attacker.y);
                    }
                    if (typeof sfx !== 'undefined' && typeof sfx.playRoar === 'function') sfx.playRoar(58, 0.7);
                    screenShake = Math.max(typeof screenShake !== 'undefined' ? screenShake : 0, 0.55);
                } else if (spec.archetype === 'seismic_aoe') {
                    attacker.vx = 0;
                    if (typeof spawn3DGroundShockwave === 'function') {
                        spawn3DGroundShockwave(attacker.x || 0, spec.colorHex, 6.2, true, attacker.groundY !== undefined ? attacker.groundY : attacker.y);
                    }
                    if (typeof sfx !== 'undefined' && typeof sfx.playBoneCrack === 'function') sfx.playBoneCrack();
                    screenShake = Math.max(typeof screenShake !== 'undefined' ? screenShake : 0, 0.72);
                } else if (spec.archetype === 'dive_aoe') {
                    const baseGround = attacker.groundY !== undefined ? attacker.groundY : (attacker.y || 0);
                    st.divePeakY = baseGround + 5.8;
                    st.diveTargetX = defender ? defender.x : ((attacker.x || 0) + (attacker.facing || 1) * 5.0);
                    st.diveSlammed = false;
                    attacker.vy = 14.5;
                    attacker.vx = (attacker.facing || 1) * (spec.rushSpeed || 16.0) * 0.65;
                    if (typeof sfx !== 'undefined' && typeof sfx.playJump === 'function') sfx.playJump();
                    if (typeof spawn3DDustPuff === 'function') spawn3DDustPuff(attacker.x || 0, baseGround, 1.3, 8);
                }
            }
        }
        return;
    }

    // ========================================================================
    // PHASE 2: SUPER STARTUP (Cinematic Rush Real Hitbox & Lunge)
    // ========================================================================
    if (st.phase === 'startup') {
        st.timer -= safeDt;
        st.elapsed += safeDt;
        const dur = spec.startupDuration || 0.42;
        const progress = st.elapsed / Math.max(0.01, dur);

        attacker.action = 'super_startup';
        if (progress < 0.78) {
            attacker.vx = (attacker.facing || 1) * (spec.rushSpeed || 18.0);
        }

        // Campaign minion waves with no Duel/Boss defender: sweep minions in front
        if (!defender && typeof matchState !== 'undefined' && matchState === 'campaign_level') {
            const sweepDmg = Math.max(320, Math.round((st.rawTotalDmg || 300) * 0.95));
            _sweepCampaignMinionsInSuper(st, sweepDmg, 16.0, 10.0, false, (spec.reach || 4.4) + 1.6);
        }

        // Fallback active hitbox contact check if within active window (supports direct updateSuperAttack calls)
        if (defender && !defender.isDead && !st.hasConnected && progress >= 0.16 && progress <= 0.85) {
            if (onSuperStartupContact(attacker, defender)) {
                return;
            }
        }

        if (st.timer <= 0) {
            attacker.vx *= 0.25;
            _transitionToWhiffRecovery(st, 0.45);
        }
        return;
    }

    // ========================================================================
    // PHASE 3A: SUPER CINEMATIC (1.95s, 3 Timed Impact Beats)
    // ========================================================================
    if (st.phase === 'cinematic') {
        st.elapsed += safeDt;
        st.timer = Math.max(0, st.timer - safeDt);

        attacker.action = 'super_cinematic';
        attacker.actionDuration = 1.95;
        attacker.actionTimer = Math.min(1.95, st.elapsed);

        if (st.lockPositions) {
            const lp = st.lockPositions;
            attacker.x = lp.attX;
            attacker.y = lp.attY;
            attacker.groundY = lp.attY;
            attacker.vx = 0;
            attacker.vy = 0;
            attacker.facing = lp.attFacing;

            if (defender) {
                defender.x = lp.defX;
                defender.y = lp.defY;
                defender.groundY = lp.defY;
                defender.vx = 0;
                defender.vy = 0;
                defender.facing = lp.defFacing;
                defender.isSuperTarget = true;
                defender.hitStun = Math.max(defender.hitStun || 0, 0.5);
            }
        }

        const beats = (spec && Array.isArray(spec.beats) && spec.beats.length >= 3)
            ? spec.beats
            : DEFAULT_SUPER_BEATS;

        while (superState === st && st.phase === 'cinematic' && st.beatApplied < beats.length) {
            const nextIdx = st.beatApplied;
            const beatDef = beats[nextIdx];
            if (st.elapsed < beatDef.at) break;
            const beatNum = nextIdx + 1;
            st.beatApplied = beatNum;
            st.beat = beatNum;
            attacker.superBeatStage = beatNum;
            if (defender) defender.superBeatStage = beatNum;
            _applyCinematicBeat(st, beatDef, beatNum);
        }

        if (superState === st && st.timer <= 0) {
            _finishSuperCleanup(st);
        }
        return;
    }

    // ========================================================================
    // PHASE 3B: SUPER ACTIVE AOE (1.15s, 5 Multi-Hit Pulses every 0.20s)
    // ========================================================================
    if (st.phase === 'active_aoe') {
        st.elapsed += safeDt;
        st.timer = Math.max(0, st.timer - safeDt);

        attacker.action = 'super_aoe';
        attacker.actionDuration = 1.15;
        attacker.actionTimer = Math.min(1.15, st.elapsed);

        if (spec.archetype === 'dive_aoe') {
            const baseGround = attacker.groundY !== undefined ? attacker.groundY : 0;
            if (st.elapsed < 0.38) {
                const targetX = defender ? defender.x : (st.diveTargetX || attacker.x);
                const dirToTarget = Math.sign(targetX - (attacker.x || 0)) || (attacker.facing || 1);
                attacker.vx = dirToTarget * Math.min(14.0, Math.abs(targetX - (attacker.x || 0)) * 2.5);
                attacker.y = Math.min(st.divePeakY || (baseGround + 5.8), (attacker.y || baseGround) + 15.0 * safeDt);
                attacker.vy = 0;
            } else if (!st.diveSlammed) {
                attacker.vy = -24.0;
                attacker.y = Math.max(baseGround, (attacker.y || baseGround) - 26.0 * safeDt);
                if (st.elapsed >= 0.52 || attacker.y <= baseGround + 0.15) {
                    st.diveSlammed = true;
                    attacker.y = baseGround;
                    attacker.vy = 0;
                    attacker.vx = 0;
                    if (typeof spawn3DGroundShockwave === 'function') {
                        spawn3DGroundShockwave(attacker.x || 0, spec.colorHex || 0x38bdf8, 6.0, true, baseGround);
                    }
                    if (typeof spawn3DDustPuff === 'function') {
                        spawn3DDustPuff(attacker.x || 0, baseGround, 1.8, 12);
                    }
                    if (typeof sfx !== 'undefined' && typeof sfx.playBoneCrack === 'function') {
                        sfx.playBoneCrack();
                    }
                    screenShake = Math.max(typeof screenShake !== 'undefined' ? screenShake : 0, 0.85);
                }
            } else {
                attacker.vx = 0;
                attacker.vy = 0;
            }
        } else {
            attacker.vx = 0;
        }

        // 5 pulses at 0.05s, 0.25s, 0.45s, 0.65s, 0.85s (every 0.20s)
        while (superState === st && st.phase === 'active_aoe' && st.aoeTicks < 5) {
            const nextPulseAt = 0.05 + st.aoeTicks * 0.20;
            if (st.elapsed < nextPulseAt) break;
            st.aoeTicks++;
            _applyAoePulse(st, st.aoeTicks);
        }

        if (superState === st && st.timer <= 0) {
            _finishSuperCleanup(st);
        }
        return;
    }

    // ========================================================================
    // PHASE 4: WHIFF / BLOCKED RECOVERY (Punishable Recovery Window)
    // ========================================================================
    if (st.phase === 'whiff_recovery') {
        st.elapsed += safeDt;
        st.timer = Math.max(0, st.timer - safeDt);
        attacker.action = 'super_whiff';

        if (st.timer <= 0) {
            _finishSuperCleanup(st);
        }
    }
}

if (typeof window !== 'undefined') {
    window.SUPER_SPECS = SUPER_SPECS;
    window.SUPER_SPEC_ALIASES = SUPER_SPEC_ALIASES;
    window.getSuperSpec = getSuperSpec;
    window.executeSuperAttack = executeSuperAttack;
    window.updateSuperAttack = updateSuperAttack;
    window.onSuperStartupContact = onSuperStartupContact;
    window.teardownSuperState = teardownSuperState;
}
