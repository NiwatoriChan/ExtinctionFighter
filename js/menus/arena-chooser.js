/* ============================================================================
 * MENU : SÉLECTION DE L'ARÈNE (ARENA CHOOSER) — @pmndrs/uikit Edition
 * Design 100% fidèle à l'interface préhistorique actuelle :
 *   - Environnement préhistorique immersif continu
 *   - En-tête : PLAYER 1 (bleu) | SELECT ARENA (pierre volcanique) | PLAYER 2 (rouge)
 *   - Colonne Gauche : Titre en pierre, description narrative et 2 boutons de hazards carrés
 *   - Colonne Centre : Carrousel Cover-Flow de cartes d'arènes avec bordure or & badge "SUITABLE FOR ALL CLASSES"
 *   - Colonne Droite : Portail mégalithique sculpté avec crâne à cornes, lianes tropicales et vue 3D Three.js
 *   - Barre inférieure : Plinthe en pierre avec ossements fossiles, lianes et légende P1 [A] CONFIRM | [B] BACK ...
 * ============================================================================ */

const arenaP1NameSignal = UIKit.signal('T-REX');
const arenaP2NameSignal = UIKit.signal('PACHYRHINOSAURE');
const arenaHeroTitleSignal = UIKit.signal('VOLCANIC CRATER');
const arenaHeroSubTitleSignal = UIKit.signal('Cratère du Chicxulub');
const arenaSuitabilitySignal = UIKit.signal('SUITABLE FOR ALL CLASSES');

const ARENA_PORTAL_SKULL_SVG = `
    <svg viewBox="0 0 160 50" class="w-full h-full overflow-visible drop-shadow-[0_4px_10px_rgba(0,0,0,0.95)]">
        <defs>
            <linearGradient id="skullBoneGradClean" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#fffbeb"/>
                <stop offset="50%" stop-color="#fef3c7"/>
                <stop offset="85%" stop-color="#d6d3d1"/>
                <stop offset="100%" stop-color="#78716c"/>
            </linearGradient>
        </defs>
        <path d="M12 28 C34 14 54 10 70 12 L70 28 C50 26 30 30 12 28 Z" fill="url(#skullBoneGradClean)" stroke="#292524" stroke-width="1.5"/>
        <path d="M148 28 C126 14 106 10 90 12 L90 28 C110 26 130 30 148 28 Z" fill="url(#skullBoneGradClean)" stroke="#292524" stroke-width="1.5"/>
        <path d="M80 6 C70 6 62 14 62 26 C62 38 70 46 80 46 C90 46 98 38 98 26 C98 14 90 6 80 6 Z" fill="url(#skullBoneGradClean)" stroke="#1c1917" stroke-width="2"/>
        <ellipse cx="73" cy="22" rx="4.5" ry="6" fill="#0c0a09"/>
        <ellipse cx="87" cy="22" rx="4.5" ry="6" fill="#0c0a09"/>
        <polygon points="80,26 77,32 83,32" fill="#0c0a09"/>
        <polygon points="69,38 72,44 75,38" fill="#fff"/>
        <polygon points="78,38 80,44 82,38" fill="#fff"/>
        <polygon points="85,38 88,44 91,38" fill="#fff"/>
    </svg>
`;

const ARENA_LEFT_VINE_SVG = `
    <svg viewBox="0 0 35 320" preserveAspectRatio="none" class="w-full h-full">
        <path d="M18 0 Q32 60 12 110 Q-4 160 18 210 Q34 260 16 320" fill="none" stroke="#14532d" stroke-width="6" stroke-linecap="round"/>
        <path d="M18 0 Q32 60 12 110 Q-4 160 18 210 Q34 260 16 320" fill="none" stroke="#22c55e" stroke-width="3" stroke-linecap="round"/>
        <polygon points="12,45 2,38 18,34" fill="#4ade80"/>
        <polygon points="20,130 32,124 20,142" fill="#4ade80"/>
        <polygon points="10,225 0,234 16,238" fill="#4ade80"/>
        <polygon points="18,290 30,296 20,308" fill="#4ade80"/>
    </svg>
`;

const ARENA_RIGHT_VINE_SVG = `
    <svg viewBox="0 0 35 320" preserveAspectRatio="none" class="w-full h-full">
        <path d="M16 0 Q2 60 22 110 Q38 160 16 210 Q0 260 18 320" fill="none" stroke="#14532d" stroke-width="6" stroke-linecap="round"/>
        <path d="M16 0 Q2 60 22 110 Q38 160 16 210 Q0 260 18 320" fill="none" stroke="#22c55e" stroke-width="3" stroke-linecap="round"/>
        <polygon points="22,45 32,38 16,34" fill="#4ade80"/>
        <polygon points="14,130 2,124 14,142" fill="#4ade80"/>
        <polygon points="24,225 34,234 18,238" fill="#4ade80"/>
        <polygon points="16,290 4,296 14,308" fill="#4ade80"/>
    </svg>
`;

const ARENA_FOOTER_BONES_LEFT_SVG = `
    <svg viewBox="0 0 140 40" class="w-full h-full">
        <path d="M8 32 C15 15 28 8 40 12" stroke="#d6d3d1" stroke-width="4" stroke-linecap="round" fill="none"/>
        <path d="M22 34 C30 18 42 12 55 16" stroke="#d6d3d1" stroke-width="3.5" stroke-linecap="round" fill="none"/>
        <path d="M38 36 C45 22 56 18 68 22" stroke="#d6d3d1" stroke-width="3" stroke-linecap="round" fill="none"/>
        <path d="M2 38 Q30 24 60 32 T110 36" stroke="#16a34a" stroke-width="2.5" fill="none"/>
        <polygon points="45,20 40,28 50,26" fill="#4ade80"/>
        <polygon points="85,30 92,36 82,38" fill="#4ade80"/>
    </svg>
`;

const ARENA_FOOTER_ROOTS_RIGHT_SVG = `
    <svg viewBox="0 0 120 40" class="w-full h-full">
        <path d="M120 38 Q80 28 50 34 T0 36" stroke="#78350f" stroke-width="3" fill="none"/>
        <path d="M115 36 Q85 30 65 35" stroke="#16a34a" stroke-width="2" fill="none"/>
        <circle cx="85" cy="20" r="2" fill="#f59e0b" opacity="0.8"/>
        <circle cx="60" cy="15" r="1.5" fill="#ef4444" opacity="0.9"/>
    </svg>
`;

let arenaScreenRoot = null;
let arenaCardsGridContainer = null;
let arenaHazardBadgesContainer = null;

function buildArenaChooserUIKit() {
    const header = new UIKit.Container({
        tag: 'header',
        className: 'w-full flex items-center justify-between px-3 sm:px-8 pt-1 shrink-0 z-20',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        children: [
            // Left: PLAYER 1
            new UIKit.Container({
                className: 'flex flex-col items-start min-w-[130px] sm:min-w-[190px]',
                flexDirection: 'column',
                alignItems: 'flex-start',
                children: [
                    new UIKit.Container({
                        className: 'flex items-center gap-2',
                        flexDirection: 'row',
                        alignItems: 'center',
                        children: [
                            new UIKit.Text({
                                tag: 'span',
                                text: 'PLAYER 1',
                                className: 'font-cinzel text-sky-400 font-black text-lg sm:text-2xl md:text-3xl tracking-widest drop-shadow-[0_2px_8px_rgba(56,189,248,0.7)]'
                            }),
                            new UIKit.Text({
                                id: 'arenaP1NameBadge',
                                tag: 'span',
                                text: arenaP1NameSignal,
                                className: 'hidden md:inline-block text-[11px] font-chakra font-black text-sky-300/80'
                            })
                        ]
                    }),
                    new UIKit.Container({
                        className: 'w-full h-1 bg-stone-800 rounded mt-1 border-b border-sky-500/70 shadow-[0_0_8px_rgba(56,189,248,0.5)]'
                    })
                ]
            }),

            // Center: SELECT ARENA
            new UIKit.Container({
                className: 'flex flex-col items-center shrink-0',
                flexDirection: 'column',
                alignItems: 'center',
                children: [
                    new UIKit.Text({
                        tag: 'h1',
                        text: 'SELECT ARENA',
                        className: 'arena-header-title text-2xl sm:text-4xl md:text-5xl uppercase tracking-widest drop-shadow-[0_4px_10px_rgba(0,0,0,0.95)]'
                    }),
                    new UIKit.Container({
                        className: 'w-48 sm:w-72 h-1.5 bg-gradient-to-r from-transparent via-amber-600 to-transparent mt-1 rounded-full shadow-[0_0_12px_rgba(245,158,11,0.6)]'
                    })
                ]
            }),

            // Right: PLAYER 2
            new UIKit.Container({
                className: 'flex flex-col items-end min-w-[130px] sm:min-w-[190px]',
                flexDirection: 'column',
                alignItems: 'flex-end',
                children: [
                    new UIKit.Container({
                        className: 'flex items-center gap-2 justify-end',
                        flexDirection: 'row',
                        alignItems: 'center',
                        children: [
                            new UIKit.Text({
                                id: 'arenaP2NameBadge',
                                tag: 'span',
                                text: arenaP2NameSignal,
                                className: 'hidden md:inline-block text-[11px] font-chakra font-black text-red-400/80'
                            }),
                            new UIKit.Text({
                                tag: 'span',
                                text: 'PLAYER 2',
                                className: 'font-cinzel text-red-500 font-black text-lg sm:text-2xl md:text-3xl tracking-widest drop-shadow-[0_2px_8px_rgba(239,68,68,0.7)]'
                            })
                        ]
                    }),
                    new UIKit.Container({
                        className: 'w-full h-1 bg-stone-800 rounded mt-1 border-b border-red-500/70 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                    })
                ]
            })
        ]
    });

    arenaHazardBadgesContainer = new UIKit.Container({
        id: 'arenaHazardBadges',
        className: 'flex items-center gap-3',
        flexDirection: 'row',
        alignItems: 'center'
    });

    const leftColumn = new UIKit.Container({
        className: 'lg:col-span-3 flex flex-col justify-center gap-2.5 sm:gap-3 text-left pl-1 sm:pl-2',
        flexDirection: 'column',
        justifyContent: 'center',
        children: [
            new UIKit.Container({
                children: [
                    new UIKit.Text({
                        id: 'arenaHeroTitle',
                        tag: 'h2',
                        text: arenaHeroTitleSignal,
                        className: 'font-cinzel font-black text-2xl sm:text-3xl text-amber-200 uppercase tracking-wider drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)] leading-tight'
                    }),
                    new UIKit.Text({
                        id: 'arenaHeroSubTitle',
                        tag: 'div',
                        text: arenaHeroSubTitleSignal,
                        className: 'font-chakra text-[10px] sm:text-xs font-black text-amber-400/80 uppercase tracking-widest mt-0.5'
                    })
                ]
            }),
            new UIKit.Container({
                id: 'arenaHeroDesc',
                tag: 'p',
                className: 'font-chakra text-xs sm:text-[13px] text-stone-300 leading-relaxed drop-shadow max-w-sm',
                html: 'Fight on the edge of extinction. Molten lava hazards will damage any beast pushed into the vents. High intensity.<br><br><span class="text-stone-400">Arena hazards will damage any beast pushed into the vents. High intensity.</span>'
            }),
            new UIKit.Container({
                className: 'mt-1',
                children: [arenaHazardBadgesContainer]
            })
        ]
    });

    arenaCardsGridContainer = new UIKit.Container({
        id: 'arenaCardsGrid',
        className: 'w-full flex items-center justify-center gap-1.5 sm:gap-2.5 overflow-visible py-2 relative',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center'
    });

    const centerColumn = new UIKit.Container({
        className: 'lg:col-span-5 flex flex-col items-center justify-center relative px-1',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        children: [
            arenaCardsGridContainer,
            new UIKit.Container({
                className: 'mt-2 text-center',
                children: [
                    new UIKit.Badge({
                        id: 'arenaCenterSuitabilityTag',
                        text: arenaSuitabilitySignal,
                        className: 'arena-plinth-tag inline-block px-4 py-1 rounded font-chakra text-[10px] sm:text-[11px] font-black text-stone-300 uppercase tracking-widest shadow-lg border border-stone-600/80'
                    })
                ]
            })
        ]
    });

    const rightColumn = new UIKit.Container({
        className: 'lg:col-span-4 flex items-center justify-center h-full max-h-[460px] relative pr-1 sm:pr-2',
        children: [
            new UIKit.Card({
                className: 'arena-portal-frame relative rounded-2xl w-full h-full flex flex-col items-center justify-center overflow-visible p-2 sm:p-2.5',
                children: [
                    new UIKit.Svg({
                        className: 'absolute -top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none w-28 sm:w-32 h-10',
                        svg: ARENA_PORTAL_SKULL_SVG
                    }),
                    new UIKit.Svg({
                        className: 'absolute -top-1 -left-2 bottom-0 w-8 pointer-events-none z-20 overflow-visible',
                        svg: ARENA_LEFT_VINE_SVG
                    }),
                    new UIKit.Svg({
                        className: 'absolute -top-1 -right-2 bottom-0 w-8 pointer-events-none z-20 overflow-visible',
                        svg: ARENA_RIGHT_VINE_SVG
                    }),
                    new UIKit.Container({
                        className: 'w-full h-full flex-1 rounded-xl bg-black relative overflow-hidden shadow-inner',
                        children: [
                            new UIKit.CustomContainer({
                                id: 'arenaPreviewCanvas',
                                tag: 'canvas',
                                className: 'w-full h-full block cursor-grab active:cursor-grabbing'
                            }),
                            new UIKit.Text({
                                tag: 'div',
                                text: '🖱️ Vue 3D temps réel • Glisser pour tourner',
                                className: 'absolute bottom-2 left-2 right-2 bg-black/75 backdrop-blur-sm py-0.5 px-2 rounded text-[9px] font-chakra text-stone-400 text-center pointer-events-none'
                            })
                        ]
                    })
                ]
            })
        ]
    });

    const mainStage = new UIKit.Container({
        tag: 'main',
        className: 'w-full flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-center min-h-0 relative z-10 px-2 sm:px-6 my-auto',
        children: [leftColumn, centerColumn, rightColumn]
    });

    const footer = new UIKit.Container({
        tag: 'footer',
        className: 'arena-bottom-slab w-full py-2.5 px-3 sm:px-8 flex flex-wrap items-center justify-between shrink-0 relative z-20',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        children: [
            new UIKit.Svg({
                className: 'absolute -top-6 left-1 w-28 sm:w-36 h-10 pointer-events-none z-20 overflow-visible opacity-90 hidden sm:block',
                svg: ARENA_FOOTER_BONES_LEFT_SVG
            }),
            new UIKit.Button({
                id: 'btnArenaBackToCreatures',
                className: 'stone-btn px-4 py-1.5 rounded-lg text-xs font-black text-amber-200 flex items-center gap-1.5 font-chakra shadow cursor-pointer relative z-30',
                children: [
                    new UIKit.Text({ tag: 'span', text: '⬅' }),
                    new UIKit.Text({ tag: 'span', text: 'CHANGER DE CRÉATURE' })
                ]
            }),
            new UIKit.Container({
                className: 'flex items-center gap-3 font-chakra text-xs text-stone-300 font-bold tracking-wider relative z-30',
                flexDirection: 'row',
                alignItems: 'center',
                children: [
                    new UIKit.Text({ tag: 'span', text: 'P1 [A] CONFIRM', className: 'text-sky-400 font-black' }),
                    new UIKit.Text({ tag: 'span', text: '|', className: 'text-stone-500' }),
                    new UIKit.Text({ tag: 'span', text: '[B] BACK', className: 'text-red-400 font-black' }),
                    new UIKit.Text({ tag: 'span', text: '•', className: 'text-stone-600 hidden sm:inline' }),
                    new UIKit.Text({ tag: 'span', text: 'LB / RB CHANGE ARENA', className: 'text-amber-300 font-black hidden sm:inline' })
                ]
            }),
            new UIKit.Container({
                className: 'flex items-center gap-2 relative z-30',
                flexDirection: 'row',
                alignItems: 'center',
                children: [
                    new UIKit.Button({
                        id: 'btnArenaRandom',
                        className: 'stone-btn px-3.5 py-1.5 rounded-lg text-xs font-black text-amber-200 flex items-center gap-1 font-chakra shadow cursor-pointer',
                        children: [
                            new UIKit.Text({ tag: 'span', text: '🎲' }),
                            new UIKit.Text({ tag: 'span', text: 'ALÉATOIRE' })
                        ]
                    }),
                    new UIKit.Button({
                        id: 'btnArenaFight',
                        className: 'px-6 py-2 rounded-xl bg-gradient-to-r from-red-800 via-red-600 to-amber-600 hover:from-red-700 hover:to-amber-500 text-white font-cinzel font-black text-xs sm:text-sm uppercase tracking-widest shadow-2xl border-2 border-amber-300 finish-pulse cursor-pointer',
                        text: '🔥 LANCER LE KOMBAT !'
                    })
                ]
            }),
            new UIKit.Svg({
                className: 'absolute -top-5 right-2 w-24 sm:w-32 h-10 pointer-events-none z-20 overflow-visible opacity-90 hidden sm:block',
                svg: ARENA_FOOTER_ROOTS_RIGHT_SVG
            })
        ]
    });

    arenaScreenRoot = new UIKit.Fullscreen({
        id: 'arenaScreen',
        tag: 'section',
        className: 'hidden w-full h-full flex-1 flex flex-col justify-between arena-screen-bg select-none relative overflow-hidden p-2 sm:p-4',
        flexDirection: 'column',
        justifyContent: 'space-between',
        children: [header, mainStage, footer]
    });

    arenaScreenRoot.mount(document.getElementById('appMain'));
}

buildArenaChooserUIKit();


/* ============================================================================
 * ENRICHED ARENA METADATA (WITH NARRATIVE LORE & HAZARDS)
 * ============================================================================ */
const ARENA_DESCRIPTIONS = {
    volcano: {
        title: "CRATÈRE DU CHICXULUB",
        enTitle: "VOLCANIC CRATER",
        sub: "Dôme de Magma • Failles Escarpées",
        desc: "Fight across a buckled volcanic crater floor with a raised central magma dome, rolling troughs, and treacherous brimstone edges.",
        suitability: "SUITABLE FOR ALL CLASSES",
        hazards: [
            { icon: "🌋", name: "Magma Dome" },
            { icon: "☄️", name: "Lava Troughs" }
        ]
    },
    boneyard: {
        title: "CITADELLE CÉLESTE D'OS",
        enTitle: "SKELETON CANYON",
        sub: "Tertres Fossiles • Dunes d'Os",
        desc: "Sacred burial mounds of prehistoric titans. Undulating fossil dunes and ribbed bone ridges shape an uneven, atmospheric battlefield.",
        suitability: "SUITABLE FOR ALL CLASSES",
        hazards: [
            { icon: "🦴", name: "Bone Ridges" },
            { icon: "🌌", name: "Sacred Mounds" }
        ]
    },
    swamp: {
        title: "ABYSSE FONGIQUE TOXIQUE",
        enTitle: "PRIMEVAL SWAMP",
        sub: "Bassin Palustre • Buttes Racines",
        desc: "Wade through sunken mire hollows and rise onto gnarled cypress root mounds under suffocating mists and bubbling acid pools.",
        suitability: "SUITABLE FOR ALL CLASSES",
        hazards: [
            { icon: "🍄", name: "Root Hummocks" },
            { icon: "🧪", name: "Sunken Mire" }
        ]
    },
    storm: {
        title: "CANYON DE L'ORAGE PRIMORDIAL",
        enTitle: "TEMPEST CANYON",
        sub: "Gradins Tectoniques • Basalte Incliné",
        desc: "Tilted tectonic basalt steps rise from west to east under diluvian lightning, creating stepped inclines and slope advantages.",
        suitability: "SUITABLE FOR ALL CLASSES",
        hazards: [
            { icon: "⚡", name: "Lightning Strike" },
            { icon: "⛰️", name: "Tectonic Slopes" }
        ]
    },
    iceage: {
        title: "GLACIER DE L'ÈRE GLACIAIRE",
        enTitle: "GLACIAL HIGHLANDS",
        sub: "Crevasse Centrale • Congères Sculptées",
        desc: "Blizzard-carved snowdrifts flank a sunken central frozen crevasse, challenging footwork across rolling permafrost banks.",
        suitability: "SUITABLE FOR ALL CLASSES",
        hazards: [
            { icon: "❄️", name: "Snowdrifts" },
            { icon: "🏔️", name: "Glacial Crevasse" }
        ]
    },
    dragonlair: {
        title: "L'ANTRE DE DRAK'ZUL",
        enTitle: "DRAGON'S LAIR",
        sub: "Fosse de Caldera • Marches d'Obsidienne",
        desc: "A sunken volcanic caldera pit flanked by elevated obsidian slopes, bathed in the magma glow of Drak'zul's lair.",
        suitability: "CHAMPIONS ONLY",
        hazards: [
            { icon: "🐲", name: "Caldera Pit" },
            { icon: "🔥", name: "Obsidian Slopes" }
        ]
    },
    jungle: {
        title: "VALLÉE D'ÉMERAUDE",
        enTitle: "EMERALD JUNGLE",
        sub: "Vallon Fluvial • Berges Ondulées",
        desc: "Mossy root mounds and ancient Jurassic riverbanks slope down into a shallow winding riverbed under towering Araucarias.",
        suitability: "SUITABLE FOR ALL CLASSES",
        hazards: [
            { icon: "🌿", name: "Riverbed Slopes" },
            { icon: "🦕", name: "Mossy Banks" }
        ]
    }
};


/* ============================================================================
 * SVG ARTWORK GENERATORS FOR COVER-FLOW ARENA CARDS
 * ============================================================================ */
function getArenaCardArtwork(arenaId) {
    if (arenaId === 'volcano') {
        return `
            <svg viewBox="0 0 240 320" preserveAspectRatio="xMidYMid slice" class="w-full h-full">
                <defs>
                    <linearGradient id="volcSky" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#1c0505"/>
                        <stop offset="50%" stop-color="#450a0a"/>
                        <stop offset="100%" stop-color="#7c2d12"/>
                    </linearGradient>
                    <radialGradient id="lavaGlow" cx="50%" cy="85%" r="65%">
                        <stop offset="0%" stop-color="#fbbf24" stop-opacity="1"/>
                        <stop offset="35%" stop-color="#ea580c" stop-opacity="0.8"/>
                        <stop offset="70%" stop-color="#b91c1c" stop-opacity="0.4"/>
                        <stop offset="100%" stop-color="#000" stop-opacity="0"/>
                    </radialGradient>
                </defs>
                <rect width="240" height="320" fill="url(#volcSky)"/>
                <polygon points="10,220 70,110 130,220" fill="#1c1917"/>
                <polygon points="65,110 75,110 72,125 68,125" fill="#f97316"/>
                <polygon points="110,240 180,90 250,240" fill="#0c0a09"/>
                <polygon points="175,90 185,90 182,105 178,105" fill="#ef4444"/>
                <ellipse cx="70" cy="80" rx="35" ry="18" fill="#292524" opacity="0.7"/>
                <ellipse cx="180" cy="60" rx="45" ry="22" fill="#1c1917" opacity="0.8"/>
                <path d="M-10 210 Q60 180 120 220 Q180 190 250 210 L250 320 L-10 320 Z" fill="#1c1917"/>
                <rect y="160" width="240" height="160" fill="url(#lavaGlow)"/>
                <path d="M20 280 Q70 260 110 275 T210 265" fill="none" stroke="#f59e0b" stroke-width="4.5" stroke-linecap="round"/>
                <path d="M30 282 Q75 262 110 276 T205 267" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>
                <circle cx="65" cy="140" r="2.5" fill="#fef08a"/>
                <circle cx="160" cy="130" r="3" fill="#fef08a"/>
            </svg>
        `;
    } else if (arenaId === 'boneyard') {
        return `
            <svg viewBox="0 0 240 320" preserveAspectRatio="xMidYMid slice" class="w-full h-full">
                <defs>
                    <linearGradient id="boneSky" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#09090b"/>
                        <stop offset="50%" stop-color="#1e1b4b"/>
                        <stop offset="100%" stop-color="#312e81"/>
                    </linearGradient>
                </defs>
                <rect width="240" height="320" fill="url(#boneSky)"/>
                <path d="M0 80 Q60 40 120 70 T240 50" fill="none" stroke="#38bdf8" stroke-width="16" opacity="0.35" filter="blur(6px)"/>
                <path d="M30 260 C25 150 65 90 120 85 C175 90 215 150 210 260" fill="none" stroke="#fef3c7" stroke-width="9" stroke-linecap="round"/>
                <path d="M50 265 C45 170 80 120 120 115 C160 120 195 170 190 265" fill="none" stroke="#e2e8f0" stroke-width="7" stroke-linecap="round"/>
                <path d="M-10 260 Q120 240 250 260 L250 320 L-10 320 Z" fill="#0f172a"/>
            </svg>
        `;
    } else if (arenaId === 'swamp') {
        return `
            <svg viewBox="0 0 240 320" preserveAspectRatio="xMidYMid slice" class="w-full h-full">
                <defs>
                    <linearGradient id="swampSky" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#022c22"/>
                        <stop offset="55%" stop-color="#064e3b"/>
                        <stop offset="100%" stop-color="#14532d"/>
                    </linearGradient>
                </defs>
                <rect width="240" height="320" fill="url(#swampSky)"/>
                <path d="M30 260 Q35 150 20 80 Q50 120 40 260" fill="#052e16"/>
                <path d="M210 260 Q205 140 220 70 Q190 110 200 260" fill="#052e16"/>
                <path d="M80 230 C80 190 140 190 140 230 Z" fill="#10b981" filter="drop-shadow(0 0 14px rgba(16,185,129,0.9))"/>
                <path d="M100 230 L102 275 L118 275 L120 230 Z" fill="#064e3b"/>
                <rect y="255" width="240" height="65" fill="#022c22"/>
                <ellipse cx="60" cy="280" rx="35" ry="6" fill="#10b981" opacity="0.7" filter="blur(3px)"/>
            </svg>
        `;
    } else if (arenaId === 'storm') {
        return `
            <svg viewBox="0 0 240 320" preserveAspectRatio="xMidYMid slice" class="w-full h-full">
                <defs>
                    <linearGradient id="stormSky" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#030712"/>
                        <stop offset="45%" stop-color="#0f172a"/>
                        <stop offset="100%" stop-color="#1e293b"/>
                    </linearGradient>
                </defs>
                <rect width="240" height="320" fill="url(#stormSky)"/>
                <ellipse cx="60" cy="60" rx="70" ry="30" fill="#0f172a" opacity="0.9"/>
                <polyline points="120,40 105,95 125,100 95,170 110,172 80,240" fill="none" stroke="#38bdf8" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" filter="drop-shadow(0 0 14px #38bdf8)"/>
                <polygon points="10,320 20,200 60,195 65,320" fill="#09090b"/>
                <polygon points="180,320 185,180 230,175 235,320" fill="#09090b"/>
            </svg>
        `;
    } else if (arenaId === 'iceage') {
        return `
            <svg viewBox="0 0 240 320" preserveAspectRatio="xMidYMid slice" class="w-full h-full">
                <defs>
                    <linearGradient id="iceSky" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#082f49"/>
                        <stop offset="50%" stop-color="#0c4a6e"/>
                        <stop offset="100%" stop-color="#155e75"/>
                    </linearGradient>
                </defs>
                <rect width="240" height="320" fill="url(#iceSky)"/>
                <path d="M-20 60 Q60 20 140 50 T300 30" fill="none" stroke="#2dd4bf" stroke-width="18" opacity="0.5" filter="blur(8px)"/>
                <polygon points="20,260 80,120 140,260" fill="#e0f2fe" opacity="0.9"/>
                <polygon points="110,260 170,140 230,260" fill="#f0f9ff" opacity="0.95"/>
                <rect y="250" width="240" height="70" fill="#075985"/>
            </svg>
        `;
    } else if (arenaId === 'jungle') {
        return `
            <svg viewBox="0 0 240 320" preserveAspectRatio="xMidYMid slice" class="w-full h-full">
                <defs>
                    <linearGradient id="jungleSky" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#051c14"/>
                        <stop offset="40%" stop-color="#0a3324"/>
                        <stop offset="75%" stop-color="#14532d"/>
                        <stop offset="100%" stop-color="#166534"/>
                    </linearGradient>
                    <radialGradient id="jungleMist" cx="50%" cy="60%" r="60%">
                        <stop offset="0%" stop-color="#4ade80" stop-opacity="0.35"/>
                        <stop offset="50%" stop-color="#10b981" stop-opacity="0.15"/>
                        <stop offset="100%" stop-color="#022c22" stop-opacity="0"/>
                    </radialGradient>
                </defs>
                <rect width="240" height="320" fill="url(#jungleSky)"/>
                <polygon points="-20,240 40,110 110,240" fill="#072017" opacity="0.85"/>
                <polygon points="80,240 160,85 240,240" fill="#051912" opacity="0.9"/>
                <rect y="90" width="240" height="230" fill="url(#jungleMist)"/>
                <path d="M-10 240 Q60 215 120 238 Q180 260 250 245 L250 320 L-10 320 Z" fill="#052e16"/>
                <path d="M-10 260 Q70 235 130 258 Q190 280 250 265" fill="none" stroke="#10b981" stroke-width="12" opacity="0.75" filter="blur(3px)"/>
                <path d="M-10 260 Q70 235 130 258 Q190 280 250 265" fill="none" stroke="#6ee7b7" stroke-width="4" opacity="0.9"/>
                <path d="M25 280 L28 120 L31 280 Z" fill="#03180f"/>
                <ellipse cx="28" cy="120" rx="16" ry="6" fill="#03180f"/>
                <ellipse cx="28" cy="138" rx="22" ry="7" fill="#03180f"/>
                <ellipse cx="28" cy="158" rx="28" ry="8" fill="#03180f"/>
                <path d="M210 290 L213 140 L216 290 Z" fill="#041f14"/>
                <ellipse cx="213" cy="140" rx="14" ry="5" fill="#041f14"/>
                <ellipse cx="213" cy="156" rx="20" ry="6" fill="#041f14"/>
                <ellipse cx="213" cy="174" rx="24" ry="7" fill="#041f14"/>
                <g transform="translate(105, 175) scale(0.68)">
                    <rect x="18" y="55" width="7" height="30" rx="3" fill="#02140c"/>
                    <rect x="32" y="55" width="7" height="30" rx="3" fill="#02140c"/>
                    <rect x="52" y="58" width="6" height="27" rx="3" fill="#02140c"/>
                    <rect x="64" y="58" width="6" height="27" rx="3" fill="#02140c"/>
                    <ellipse cx="44" cy="54" rx="24" ry="16" fill="#02140c"/>
                    <path d="M60 52 Q82 62 98 75 Q80 66 62 58 Z" fill="#02140c"/>
                    <path d="M26 50 C22 25 10 5 12 -12 C14 -16 20 -15 20 -11 C18 5 32 25 36 50 Z" fill="#02140c"/>
                    <ellipse cx="12" cy="-14" rx="5" ry="3.5" fill="#02140c"/>
                    <circle cx="13" cy="-16" r="2.5" fill="#02140c"/>
                </g>
                <path d="M70 50 Q85 45 95 40 Q85 52 70 50 Z" fill="#031a10"/>
                <path d="M95 40 Q105 45 120 50 Q105 52 95 40 Z" fill="#031a10"/>
                <path d="M140 75 Q152 70 160 66 Q152 76 140 75 Z" fill="#031a10"/>
                <path d="M160 66 Q168 70 180 75 Q168 76 160 66 Z" fill="#031a10"/>
                <circle cx="45" cy="190" r="2" fill="#86efac" filter="drop-shadow(0 0 6px #4ade80)"/>
                <circle cx="95" cy="225" r="2.5" fill="#fef08a" filter="drop-shadow(0 0 6px #facc15)"/>
                <circle cx="165" cy="210" r="2" fill="#86efac" filter="drop-shadow(0 0 6px #4ade80)"/>
                <circle cx="195" cy="245" r="1.5" fill="#6ee7b7" filter="drop-shadow(0 0 4px #34d399)"/>
            </svg>
        `;
    } else {
        // dragonlair
        return `
            <svg viewBox="0 0 240 320" preserveAspectRatio="xMidYMid slice" class="w-full h-full">
                <defs>
                    <linearGradient id="dragSky" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#180505"/>
                        <stop offset="45%" stop-color="#450a0a"/>
                        <stop offset="100%" stop-color="#78350f"/>
                    </linearGradient>
                </defs>
                <rect width="240" height="320" fill="url(#dragSky)"/>
                <polygon points="0,0 35,0 45,180 0,220" fill="#0a0505"/>
                <polygon points="205,0 240,0 240,220 195,180" fill="#0a0505"/>
                <g transform="translate(120, 140) scale(1.1)">
                    <path d="M-40 -40 L0 -70 L40 -40 L45 10 L0 45 L-45 10 Z" fill="#1c0707" stroke="#dc2626" stroke-width="3"/>
                    <ellipse cx="-16" cy="-10" rx="8" ry="12" fill="#ef4444" filter="drop-shadow(0 0 8px #f59e0b)"/>
                    <ellipse cx="16" cy="-10" rx="8" ry="12" fill="#ef4444" filter="drop-shadow(0 0 8px #f59e0b)"/>
                </g>
                <path d="M-10 270 Q60 250 120 280 T250 265 L250 320 L-10 320 Z" fill="#b45309"/>
            </svg>
        `;
    }
}


/* ============================================================================
 * NAVIGATION, RENDERING & INTERACTION CONTROLLER
 * ============================================================================ */
function initArenaChooser() {
    renderArenaCards();

    const btnBack = document.getElementById('btnArenaBackToCreatures');
    if (btnBack) {
        btnBack.addEventListener('click', () => {
            if (typeof sfx !== 'undefined' && sfx.playHit) sfx.playHit(false);
            goToSelectScreen();
        });
    }

    const btnRandom = document.getElementById('btnArenaRandom');
    if (btnRandom) {
        btnRandom.addEventListener('click', () => {
            if (typeof sfx !== 'undefined' && sfx.playHit) sfx.playHit(false);
            const idx = Math.floor(Math.random() * ARENA_LIST.length);
            selectArena(ARENA_LIST[idx].id);
        });
    }

    const btnFight = document.getElementById('btnArenaFight');
    if (btnFight) {
        btnFight.addEventListener('click', () => {
            if (typeof isArenaUnlocked === 'function' && !isArenaUnlocked(currentArena)) {
                if (typeof sfx !== 'undefined' && sfx.playCooldownWarning) sfx.playCooldownWarning();
                const eraReq = (typeof UNLOCKABLE_ARENA_ERAS !== 'undefined' && UNLOCKABLE_ARENA_ERAS[currentArena]) ? UNLOCKABLE_ARENA_ERAS[currentArena] : null;
                const msg = eraReq 
                    ? `🔒 ARÈNE VERROUILLÉE ! Conquérez l'Ère ${eraReq} en Campagne pour la débloquer !` 
                    : `🔒 ARÈNE VERROUILLÉE ! Conquérez la Campagne pour la débloquer !`;
                if (typeof spawnFloatingPopup === 'function') spawnFloatingPopup(0, msg, '#ef4444');
                return;
            }
            startMatch();
        });
    }
}

function navigateArenaCarousel(dir) {
    if (!ARENA_LIST || ARENA_LIST.length === 0) return;
    let curIdx = ARENA_LIST.findIndex(a => a.id === currentArena);
    if (curIdx === -1) curIdx = 0;
    const nextIdx = (curIdx + dir + ARENA_LIST.length) % ARENA_LIST.length;
    selectArena(ARENA_LIST[nextIdx].id);
    if (typeof sfx !== 'undefined' && sfx.playHit) sfx.playHit(false);
}

function updatePlayerNameBadges() {
    const p1 = (typeof DINO_ROSTER !== 'undefined' && DINO_ROSTER[p1ChoiceIndex]) ? DINO_ROSTER[p1ChoiceIndex].name : 'T-REX';
    let p2 = 'PACHYRHINOSAURE';
    if (gameMode === 'pvp') {
        p2 = (typeof DINO_ROSTER !== 'undefined' && DINO_ROSTER[p2ChoiceIndex]) ? DINO_ROSTER[p2ChoiceIndex].name : 'JOUEUR 2';
    } else {
        p2 = (typeof DINO_ROSTER !== 'undefined' && DINO_ROSTER[p2ChoiceIndex]) ? `IA : ${DINO_ROSTER[p2ChoiceIndex].name}` : 'IA : RIVAL';
    }

    arenaP1NameSignal.value = p1;
    arenaP2NameSignal.value = p2;
}

function renderArenaCards() {
    const grid = document.getElementById('arenaCardsGrid');
    if (!grid) return;
    if (arenaCardsGridContainer) {
        arenaCardsGridContainer.clearChildren();
    } else {
        grid.innerHTML = '';
    }

    const total = ARENA_LIST.length;
    let curIdx = ARENA_LIST.findIndex(a => a.id === currentArena);
    if (curIdx === -1) curIdx = 0;

    // Cover-Flow 5 Cartes : [-2, -1, 0, +1, +2]
    const offsets = [-2, -1, 0, 1, 2];

    offsets.forEach(offset => {
        const arenaIdx = (curIdx + offset + total * 10) % total;
        const arena = ARENA_LIST[arenaIdx];
        const isCenter = (offset === 0);
        const info = ARENA_DESCRIPTIONS[arena.id] || {
            title: arena.label,
            enTitle: arena.id.toUpperCase(),
            sub: "Champ de bataille préhistorique",
            hazards: []
        };

        let cardUI;
        if (isCenter) {
            cardUI = new UIKit.Card({
                className: 'arena-carousel-card active relative w-44 sm:w-52 md:w-56 h-[260px] sm:h-[320px] md:h-[350px] rounded-xl overflow-hidden cursor-pointer shrink-0 flex flex-col justify-between',
                dataset: { arenaId: arena.id, index: String(arenaIdx) },
                children: [
                    new UIKit.Svg({
                        className: 'absolute inset-0 z-0 pointer-events-none',
                        svg: getArenaCardArtwork(arena.id)
                    }),
                    new UIKit.Container({
                        className: 'absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent z-10 pointer-events-none'
                    }),
                    new UIKit.Container({}),
                    new UIKit.Container({
                        className: 'relative z-20 p-2 sm:p-3 text-center',
                        children: [
                            new UIKit.Text({
                                tag: 'h3',
                                text: info.enTitle,
                                className: 'font-cinzel text-sm sm:text-lg md:text-xl font-black text-amber-100 uppercase tracking-wider drop-shadow-[0_2px_6px_rgba(0,0,0,1)]'
                            })
                        ]
                    })
                ]
            });
        } else {
            const isFar = Math.abs(offset) === 2;
            const isBoss = arena.id === 'dragonlair';
            const cardChildren = [
                new UIKit.Svg({
                    className: 'absolute inset-0 z-0 pointer-events-none',
                    svg: getArenaCardArtwork(arena.id)
                }),
                new UIKit.Container({
                    className: 'absolute inset-0 bg-black/55 z-10 pointer-events-none'
                })
            ];

            if (offset === -2) {
                cardChildren.push(
                    new UIKit.Container({
                        className: 'absolute inset-0 flex items-center justify-start pl-2 z-20 pointer-events-none text-stone-200 text-2xl font-black drop-shadow-[0_2px_8px_#000]',
                        children: [new UIKit.Text({ tag: 'span', text: '<' })]
                    })
                );
            } else if (offset === 2) {
                cardChildren.push(
                    new UIKit.Container({
                        className: 'absolute inset-0 flex items-center justify-end pr-2 z-20 pointer-events-none text-stone-200 text-2xl font-black drop-shadow-[0_2px_8px_#000]',
                        children: [new UIKit.Text({ tag: 'span', text: '>' })]
                    })
                );
            }

            cardChildren.push(
                new UIKit.Container({
                    className: 'relative z-20 p-2 flex items-center justify-center',
                    children: (isFar || isBoss) ? [new UIKit.Text({ tag: 'span', text: '🔒', className: 'text-xs' })] : []
                }),
                new UIKit.Container({
                    className: 'relative z-20 p-1.5 text-center bg-black/75',
                    children: [
                        new UIKit.Text({
                            tag: 'h4',
                            text: info.enTitle,
                            className: 'font-cinzel text-[10px] sm:text-xs font-black text-stone-300 uppercase tracking-wider line-clamp-1'
                        })
                    ]
                })
            );

            cardUI = new UIKit.Card({
                className: `arena-carousel-card inactive relative ${isFar ? 'w-24 sm:w-32 md:w-36 h-[200px] sm:h-[250px] md:h-[280px]' : 'w-32 sm:w-40 md:w-44 h-[230px] sm:h-[280px] md:h-[310px]'} rounded-xl overflow-hidden cursor-pointer shrink-0 flex flex-col justify-between`,
                dataset: { arenaId: arena.id, index: String(arenaIdx) },
                onClick: () => {
                    if (typeof sfx !== 'undefined' && sfx.playHit) sfx.playHit(false);
                    selectArena(arena.id);
                },
                children: cardChildren
            });
        }

        if (arenaCardsGridContainer) {
            arenaCardsGridContainer.add(cardUI);
        } else {
            cardUI.mount(grid);
        }
    });

    updateArenaHeroDetails();
}

function selectArena(arenaId) {
    currentArena = arenaId;

    const sel = document.getElementById('arenaSelect');
    if (sel) sel.value = arenaId;

    renderArenaCards();

    if (arenaPreview.group && arenaPreview.scene) {
        buildArena3D(currentArena, arenaPreview.group, arenaPreview.scene);
        arenaPreview.arenaId = currentArena;
    }
}

function updateArenaHeroDetails() {
    const info = ARENA_DESCRIPTIONS[currentArena] || {
        title: currentArena.toUpperCase(),
        enTitle: currentArena.toUpperCase(),
        sub: "Cratère Volcanique",
        desc: "Fight on the edge of extinction. Molten lava hazards will damage any beast pushed into the vents. High intensity.",
        suitability: "SUITABLE FOR ALL CLASSES",
        hazards: []
    };

    const isUnlocked = typeof isArenaUnlocked === 'function' ? isArenaUnlocked(currentArena) : true;
    const eraReq = (typeof UNLOCKABLE_ARENA_ERAS !== 'undefined' && UNLOCKABLE_ARENA_ERAS[currentArena]) ? UNLOCKABLE_ARENA_ERAS[currentArena] : null;

    arenaHeroTitleSignal.value = isUnlocked ? info.enTitle : `🔒 ${info.enTitle}`;
    arenaHeroSubTitleSignal.value = isUnlocked ? info.title : `VERROUILLÉE (Ère ${eraReq})`;
    arenaSuitabilitySignal.value = isUnlocked ? info.suitability : `CONQUÉREZ L'ÈRE ${eraReq} EN CAMPAGNE POUR DÉBLOQUER`;

    const descEl = document.getElementById('arenaHeroDesc');
    if (descEl) {
        descEl.innerHTML = `${info.desc}<br><br><span class="text-stone-400">Arena hazards will damage any beast pushed into the vents. High intensity.</span>`;
    }

    if (arenaHazardBadgesContainer) {
        arenaHazardBadgesContainer.clearChildren();
        (info.hazards || []).forEach(h => {
            const isLava = h.name.toLowerCase().includes('lave') || h.name.toLowerCase().includes('lava');
            const badgeCard = new UIKit.Card({
                className: `arena-hazard-badge ${isLava ? 'hazard-badge-lava' : 'hazard-badge-debris'} w-16 h-16 sm:w-20 sm:h-20 rounded-xl p-1 flex flex-col items-center justify-center text-center cursor-pointer shadow-lg`,
                children: [
                    new UIKit.Text({ tag: 'div', text: h.icon, className: 'text-xl sm:text-2xl filter drop-shadow mb-0.5' }),
                    new UIKit.Text({ tag: 'div', text: h.name, className: 'font-chakra text-[9px] sm:text-[10px] font-bold text-stone-200 tracking-wider' })
                ]
            });
            arenaHazardBadgesContainer.add(badgeCard);
        });
    }
}

function openArenaChooser(force = false) {
    if (!force && gameMode === 'campaign') {
        startMatch();
        return;
    }
    matchState = 'arena_select';
    if (typeof mainMenuVisibleSignal !== 'undefined') mainMenuVisibleSignal.value = false;
    if (typeof campaignMapVisibleSignal !== 'undefined') campaignMapVisibleSignal.value = false;
    const campEl = document.getElementById('campaignScreen');
    if (campEl) campEl.classList.add('hidden');
    document.getElementById('mainMenu').classList.add('hidden');
    document.getElementById('selectScreen').classList.add('hidden');
    document.getElementById('battleScreen').classList.add('hidden');
    document.getElementById('battleScreen').classList.remove('flex');
    document.getElementById('arenaScreen').classList.remove('hidden');

    updatePlayerNameBadges();
    renderArenaCards();

    if (!arenaPreview.renderer) {
        setupArenaPreview('arenaPreviewCanvas');
    }
    if (arenaPreview.group && arenaPreview.scene) {
        buildArena3D(currentArena, arenaPreview.group, arenaPreview.scene);
        arenaPreview.arenaId = currentArena;
    }
    _arenaPreviewNeedsResize = true;

    if (typeof updateGamepadHelperHUD === 'function') {
        updateGamepadHelperHUD();
    }
}
