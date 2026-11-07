/* ============================================================================
 * MENU : ÉCRAN DE SÉLECTION DES COMBATTANTS — PORTED TO @pmndrs/uikit
 * Design actuel avec piédestaux 3D, grille de 20 emplacements (14 bêtes + Boss
 * Drak'Zul + 5 secrets), jauges de statistiques en basalte et plinthe fossile.
 * ============================================================================ */

// Portraits haute définition créés avec Nano Banana (Google DeepMind)
const FIGHTER_PORTRAIT_IMAGES = {
    trex: 'assets/portraits/trex.png',
    pachyrhino: 'assets/portraits/pachyrhino.png',
    ankylo: 'assets/portraits/ankylo.png',
    apato: 'assets/portraits/apato.png',
    maiasaura: 'assets/portraits/maiasaura.png',
    terabird: 'assets/portraits/terabird.png',
    postosuchus: 'assets/portraits/postosuchus.png',
    spinosaurus: 'assets/portraits/spinosaurus.png',
    therizino: 'assets/portraits/therizino.png',
    pulmonoscorpius: 'assets/portraits/pulmonoscorpius.png',
    stegosaurus: 'assets/portraits/stegosaurus.png',
    quetzal: 'assets/portraits/quetzal.png',
    giantsloth: 'assets/portraits/giantsloth.png',
    smilodon: 'assets/portraits/smilodon.png',
    dragon: 'assets/portraits/dragon.png'
};

function getFighterPortraitUrl(fighterId) {
    return FIGHTER_PORTRAIT_IMAGES[fighterId] || `assets/portraits/${fighterId}.png`;
}

// Aperçus vectoriels stylisés pour chacun des combattants (fallback)
const FIGHTER_PORTRAITS = {
    trex: `
        <svg viewBox="0 0 64 64" class="w-full h-full drop-shadow-md">
            <defs>
                <radialGradient id="bg_trex" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stop-color="#ef4444" stop-opacity="0.5"/>
                    <stop offset="100%" stop-color="#450a0a" stop-opacity="0.9"/>
                </radialGradient>
            </defs>
            <circle cx="32" cy="32" r="30" fill="url(#bg_trex)" stroke="#f87171" stroke-width="1.5"/>
            <path d="M12 40 Q16 48 30 46 Q38 46 48 38 Q52 30 46 22 Q40 16 28 16 Q20 18 16 26 Z" fill="#b91c1c" stroke="#fca5a5" stroke-width="1"/>
            <path d="M26 32 L46 32 L40 38 L26 36 Z" fill="#18181b"/>
            <polygon points="30,32 32,35 34,32" fill="#fef08a"/>
            <polygon points="35,32 37,35 39,32" fill="#fef08a"/>
            <polygon points="40,32 42,35 44,32" fill="#fef08a"/>
            <polygon points="32,36 34,33 36,36" fill="#fef08a"/>
            <polygon points="37,36 39,33 41,36" fill="#fef08a"/>
            <circle cx="26" cy="22" r="2.5" fill="#facc15"/>
            <path d="M22 18 L26 15 L30 18 L34 16 L38 18" stroke="#f59e0b" stroke-width="1.5" fill="none"/>
        </svg>
    `,
    pachyrhino: `
        <svg viewBox="0 0 64 64" class="w-full h-full drop-shadow-md">
            <defs>
                <radialGradient id="bg_pachy" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.4"/>
                    <stop offset="100%" stop-color="#0c4a6e" stop-opacity="0.9"/>
                </radialGradient>
            </defs>
            <circle cx="32" cy="32" r="30" fill="url(#bg_pachy)" stroke="#38bdf8" stroke-width="1.5"/>
            <path d="M16 16 Q32 8 48 16 Q52 28 46 36 L32 48 L18 36 Q12 28 16 16 Z" fill="#0284c7" stroke="#bae6fd" stroke-width="1"/>
            <polygon points="20,14 24,8 26,14" fill="#e0f2fe"/>
            <polygon points="30,11 32,5 34,11" fill="#e0f2fe"/>
            <polygon points="38,14 40,8 44,14" fill="#e0f2fe"/>
            <ellipse cx="32" cy="34" rx="8" ry="6" fill="#0369a1" stroke="#38bdf8" stroke-width="1.5"/>
            <circle cx="24" cy="26" r="2" fill="#fef08a"/>
            <circle cx="40" cy="26" r="2" fill="#fef08a"/>
        </svg>
    `,
    ankylo: `
        <svg viewBox="0 0 64 64" class="w-full h-full drop-shadow-md">
            <defs>
                <radialGradient id="bg_anky" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stop-color="#34d399" stop-opacity="0.4"/>
                    <stop offset="100%" stop-color="#064e3b" stop-opacity="0.9"/>
                </radialGradient>
            </defs>
            <circle cx="32" cy="32" r="30" fill="url(#bg_anky)" stroke="#34d399" stroke-width="1.5"/>
            <polygon points="32,16 50,40 14,40" fill="#047857" stroke="#a7f3d0" stroke-width="1.2"/>
            <polygon points="14,38 6,34 16,32" fill="#d1fae5"/>
            <polygon points="50,38 58,34 48,32" fill="#d1fae5"/>
            <circle cx="32" cy="26" r="3.5" fill="#065f46" stroke="#6ee7b7" stroke-width="1"/>
            <circle cx="24" cy="34" r="3" fill="#065f46" stroke="#6ee7b7" stroke-width="1"/>
            <circle cx="40" cy="34" r="3" fill="#065f46" stroke="#6ee7b7" stroke-width="1"/>
        </svg>
    `,
    apato: `
        <svg viewBox="0 0 64 64" class="w-full h-full drop-shadow-md">
            <defs>
                <radialGradient id="bg_apato" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stop-color="#c084fc" stop-opacity="0.4"/>
                    <stop offset="100%" stop-color="#4c1d95" stop-opacity="0.9"/>
                </radialGradient>
            </defs>
            <circle cx="32" cy="32" r="30" fill="url(#bg_apato)" stroke="#c084fc" stroke-width="1.5"/>
            <path d="M14 54 C18 36 28 22 42 16 L48 18 L50 24 L40 28 C30 36 26 46 24 54 Z" fill="#7c3aed" stroke="#ddd6fe" stroke-width="1.2"/>
            <ellipse cx="45" cy="18" rx="6" ry="4" fill="#6d28d9"/>
            <circle cx="46" cy="17" r="1.5" fill="#fef08a"/>
        </svg>
    `,
    maiasaura: `
        <svg viewBox="0 0 64 64" class="w-full h-full drop-shadow-md">
            <defs>
                <radialGradient id="bg_maia" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stop-color="#2dd4bf" stop-opacity="0.4"/>
                    <stop offset="100%" stop-color="#134e4a" stop-opacity="0.9"/>
                </radialGradient>
            </defs>
            <circle cx="32" cy="32" r="30" fill="url(#bg_maia)" stroke="#2dd4bf" stroke-width="1.5"/>
            <path d="M16 38 Q22 20 38 18 Q50 18 52 26 Q50 32 40 34 L26 38 Z" fill="#0f766e" stroke="#99f6e4" stroke-width="1.2"/>
            <path d="M40 34 Q52 32 54 26 L46 22 Z" fill="#14b8a6"/>
            <circle cx="32" cy="23" r="2" fill="#fef08a"/>
        </svg>
    `,
    terabird: `
        <svg viewBox="0 0 64 64" class="w-full h-full drop-shadow-md">
            <defs>
                <radialGradient id="bg_bird" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stop-color="#fb923c" stop-opacity="0.5"/>
                    <stop offset="100%" stop-color="#7c2d12" stop-opacity="0.9"/>
                </radialGradient>
            </defs>
            <circle cx="32" cy="32" r="30" fill="url(#bg_bird)" stroke="#fb923c" stroke-width="1.5"/>
            <path d="M18 42 L24 22 Q32 16 40 20 L48 24 Q54 34 46 44 L38 38 L28 42 Z" fill="#c2410c"/>
            <path d="M38 22 C48 24 56 32 46 46 C42 42 42 36 36 34 Z" fill="#ea580c" stroke="#ffedd5" stroke-width="1"/>
            <path d="M22 22 L14 14 L24 18 L16 10 L28 16" stroke="#f59e0b" stroke-width="2" fill="none"/>
            <circle cx="32" cy="24" r="2" fill="#fef08a"/>
        </svg>
    `,
    postosuchus: `
        <svg viewBox="0 0 64 64" class="w-full h-full drop-shadow-md">
            <defs>
                <radialGradient id="bg_posto" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stop-color="#f87171" stop-opacity="0.4"/>
                    <stop offset="100%" stop-color="#7f1d1d" stop-opacity="0.9"/>
                </radialGradient>
            </defs>
            <circle cx="32" cy="32" r="30" fill="url(#bg_posto)" stroke="#f87171" stroke-width="1.5"/>
            <path d="M12 36 L24 24 L48 26 L52 34 L36 38 L14 42 Z" fill="#991b1b" stroke="#fca5a5" stroke-width="1"/>
            <polygon points="32,32 34,36 36,32" fill="#fff"/>
            <polygon points="40,32 42,36 44,32" fill="#fff"/>
            <circle cx="28" cy="27" r="2" fill="#fbbf24"/>
        </svg>
    `,
    spinosaurus: `
        <svg viewBox="0 0 64 64" class="w-full h-full drop-shadow-md">
            <defs>
                <radialGradient id="bg_spino" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stop-color="#60a5fa" stop-opacity="0.4"/>
                    <stop offset="100%" stop-color="#1e3a8a" stop-opacity="0.9"/>
                </radialGradient>
            </defs>
            <circle cx="32" cy="32" r="30" fill="url(#bg_spino)" stroke="#60a5fa" stroke-width="1.5"/>
            <path d="M14 44 C16 22 24 10 38 10 C46 12 50 20 48 44 Z" fill="#1d4ed8" stroke="#93c5fd" stroke-width="1"/>
            <path d="M22 44 L24 16 M30 44 L32 11 M38 44 L40 12 M44 44 L44 18" stroke="#60a5fa" stroke-width="1.2"/>
            <path d="M24 38 L48 36 L54 40 L38 44 Z" fill="#2563eb" stroke="#dbeafe" stroke-width="1"/>
            <circle cx="32" cy="36" r="1.8" fill="#fef08a"/>
        </svg>
    `,
    therizino: `
        <svg viewBox="0 0 64 64" class="w-full h-full drop-shadow-md">
            <defs>
                <radialGradient id="bg_theri" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stop-color="#34d399" stop-opacity="0.4"/>
                    <stop offset="100%" stop-color="#064e3b" stop-opacity="0.9"/>
                </radialGradient>
            </defs>
            <circle cx="32" cy="32" r="30" fill="url(#bg_theri)" stroke="#34d399" stroke-width="1.5"/>
            <path d="M16 42 Q24 22 36 24 Q42 26 40 34 L28 42 Z" fill="#047857"/>
            <circle cx="32" cy="27" r="1.8" fill="#fef08a"/>
            <path d="M24 46 C32 40 44 32 50 16 C46 26 38 36 28 44" fill="#a7f3d0" stroke="#059669" stroke-width="1"/>
            <path d="M28 48 C36 44 48 36 54 22 C50 32 42 40 32 46" fill="#a7f3d0" stroke="#059669" stroke-width="1"/>
            <path d="M20 46 C28 42 38 36 44 24 C40 34 32 40 24 44" fill="#a7f3d0" stroke="#059669" stroke-width="1"/>
        </svg>
    `,
    pulmonoscorpius: `
        <svg viewBox="0 0 64 64" class="w-full h-full drop-shadow-md">
            <defs>
                <radialGradient id="bg_pulmo" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stop-color="#e879f9" stop-opacity="0.4"/>
                    <stop offset="100%" stop-color="#581c87" stop-opacity="0.9"/>
                </radialGradient>
            </defs>
            <circle cx="32" cy="32" r="30" fill="url(#bg_pulmo)" stroke="#e879f9" stroke-width="1.5"/>
            <path d="M14 36 C10 26 18 18 24 22 C20 28 18 34 14 36 Z" fill="#a855f7" stroke="#f0abfc" stroke-width="1"/>
            <path d="M50 36 C54 26 46 18 40 22 C44 28 46 34 50 36 Z" fill="#a855f7" stroke="#f0abfc" stroke-width="1"/>
            <ellipse cx="32" cy="38" rx="8" ry="10" fill="#7e22ce"/>
            <path d="M32 28 C30 18 38 12 40 14 C36 18 34 22 32 28 Z" fill="#f43f5e" stroke="#fbcfe8" stroke-width="1"/>
            <polygon points="40,14 44,11 41,17" fill="#f43f5e"/>
        </svg>
    `,
    stegosaurus: `
        <svg viewBox="0 0 64 64" class="w-full h-full drop-shadow-md">
            <defs>
                <radialGradient id="bg_stego" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stop-color="#fb923c" stop-opacity="0.4"/>
                    <stop offset="100%" stop-color="#7c2d12" stop-opacity="0.9"/>
                </radialGradient>
            </defs>
            <circle cx="32" cy="32" r="30" fill="url(#bg_stego)" stroke="#fb923c" stroke-width="1.5"/>
            <polygon points="20,34 16,18 24,14 28,26" fill="#ea580c" stroke="#fed7aa" stroke-width="1"/>
            <polygon points="32,32 28,12 38,8 42,22" fill="#c2410c" stroke="#fed7aa" stroke-width="1"/>
            <polygon points="44,36 40,20 48,16 52,28" fill="#ea580c" stroke="#fed7aa" stroke-width="1"/>
            <ellipse cx="18" cy="38" rx="7" ry="4" fill="#9a3412"/>
            <circle cx="16" cy="37" r="1.5" fill="#fef08a"/>
        </svg>
    `,
    quetzal: `
        <svg viewBox="0 0 64 64" class="w-full h-full drop-shadow-md">
            <defs>
                <radialGradient id="bg_quetzal" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.4"/>
                    <stop offset="100%" stop-color="#075985" stop-opacity="0.9"/>
                </radialGradient>
            </defs>
            <circle cx="32" cy="32" r="30" fill="url(#bg_quetzal)" stroke="#38bdf8" stroke-width="1.5"/>
            <path d="M16 26 L26 14 L30 22 L52 28 L30 34 L22 42 Z" fill="#0284c7" stroke="#bae6fd" stroke-width="1"/>
            <polygon points="26,14 24,8 30,16" fill="#38bdf8"/>
            <circle cx="28" cy="24" r="1.8" fill="#fef08a"/>
        </svg>
    `,
    giantsloth: `
        <svg viewBox="0 0 64 64" class="w-full h-full drop-shadow-md">
            <defs>
                <radialGradient id="bg_mega" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stop-color="#fbbf24" stop-opacity="0.4"/>
                    <stop offset="100%" stop-color="#78350f" stop-opacity="0.9"/>
                </radialGradient>
            </defs>
            <circle cx="32" cy="32" r="30" fill="url(#bg_mega)" stroke="#fbbf24" stroke-width="1.5"/>
            <circle cx="30" cy="30" r="14" fill="#92400e" stroke="#fde68a" stroke-width="1"/>
            <ellipse cx="36" cy="32" rx="7" ry="6" fill="#78350f"/>
            <circle cx="28" cy="26" r="2" fill="#fef08a"/>
            <path d="M42 46 C48 38 48 26 44 18 C48 26 46 36 40 44 Z" fill="#fef08a" stroke="#d97706" stroke-width="1"/>
        </svg>
    `,
    smilodon: `
        <svg viewBox="0 0 64 64" class="w-full h-full drop-shadow-md">
            <defs>
                <radialGradient id="bg_smilo" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.5"/>
                    <stop offset="100%" stop-color="#451a03" stop-opacity="0.95"/>
                </radialGradient>
            </defs>
            <circle cx="32" cy="32" r="30" fill="url(#bg_smilo)" stroke="#fbbf24" stroke-width="1.5"/>
            <path d="M14 42 Q16 24 28 20 Q40 18 46 26 Q52 36 42 46 Q32 48 20 46 Z" fill="#b45309" stroke="#fde68a" stroke-width="1"/>
            <polygon points="26,20 28,10 34,18" fill="#78350f" stroke="#fde68a" stroke-width="0.8"/>
            <path d="M36 26 Q46 28 48 36 L38 40 Z" fill="#78350f"/>
            <circle cx="34" cy="25" r="2.2" fill="#fef08a"/>
            <path d="M40 36 C42 46 38 53 35 57 C37 50 39 44 38 36 Z" fill="#fef08a" stroke="#d97706" stroke-width="0.8"/>
            <path d="M44 36 C46 47 42 54 39 58 C41 51 43 45 42 36 Z" fill="#ffffff" stroke="#d97706" stroke-width="0.8"/>
            <path d="M30 40 L38 42 L34 47 L28 43 Z" fill="#92400e"/>
        </svg>
    `
};

// Reactive @pmndrs/uikit Signals for Character Select UI
const p1PowSignal = UIKit.signal(95);
const p1SpdSignal = UIKit.signal(70);
const p1DefSignal = UIKit.signal(85);
const p1RageStatSignal = UIKit.signal(80);
const p1ClassSignal = UIKit.signal('APEX PREDATOR');
const p1SpecialSignal = UIKit.signal('CRUSHING BITE');

const p2PowSignal = UIKit.signal(90);
const p2SpdSignal = UIKit.signal(55);
const p2DefSignal = UIKit.signal(100);
const p2RageStatSignal = UIKit.signal(75);
const p2ClassSignal = UIKit.signal('TANK');
const p2SpecialSignal = UIKit.signal('HORN CHARGE');
const p2HeaderLabelSignal = UIKit.signal('PLAYER 2');

const FOSSIL_RIB_VINES_LEFT_SVG = `
    <svg viewBox="0 0 140 40" class="w-full h-full">
        <path d="M8 32 C15 15 28 8 40 12" stroke="#d6d3d1" stroke-width="4" stroke-linecap="round" fill="none"/>
        <path d="M22 34 C30 18 42 12 55 16" stroke="#d6d3d1" stroke-width="3.5" stroke-linecap="round" fill="none"/>
        <path d="M38 36 C45 22 56 18 68 22" stroke="#d6d3d1" stroke-width="3" stroke-linecap="round" fill="none"/>
        <path d="M2 38 Q30 24 60 32 T110 36" stroke="#16a34a" stroke-width="2.5" fill="none"/>
        <polygon points="45,20 40,28 50,26" fill="#4ade80"/>
        <polygon points="85,30 92,36 82,38" fill="#4ade80"/>
    </svg>
`;

const CREEPING_ROOTS_RIGHT_SVG = `
    <svg viewBox="0 0 120 40" class="w-full h-full">
        <path d="M120 38 Q80 28 50 34 T0 36" stroke="#78350f" stroke-width="3" fill="none"/>
        <path d="M115 36 Q85 30 65 35" stroke="#16a34a" stroke-width="2" fill="none"/>
        <circle cx="85" cy="20" r="2" fill="#f59e0b" opacity="0.8"/>
        <circle cx="60" cy="15" r="1.5" fill="#ef4444" opacity="0.9"/>
    </svg>
`;

function createBeastStatPlaque(prefix, isP1) {
    const powSig = isP1 ? p1PowSignal : p2PowSignal;
    const spdSig = isP1 ? p1SpdSignal : p2SpdSignal;
    const defSig = isP1 ? p1DefSignal : p2DefSignal;
    const rageSig = isP1 ? p1RageStatSignal : p2RageStatSignal;
    const classSig = isP1 ? p1ClassSignal : p2ClassSignal;
    const specSig = isP1 ? p1SpecialSignal : p2SpecialSignal;

    const barClsMain = isP1 ? 'stat-bar-cyan' : 'stat-bar-fire';
    const barClsSpd = isP1 ? 'stat-bar-cyan' : 'stat-bar-red';
    const barClsDef = isP1 ? 'stat-bar-cyan' : 'stat-bar-fire';
    const barClsRage = isP1 ? 'stat-bar-red' : 'stat-bar-fire';

    const rows = [
        { label: 'ATTACK', id: `${prefix}BarPow`, cls: barClsMain, sig: powSig },
        { label: 'SPEED', id: `${prefix}BarSpd`, cls: barClsSpd, sig: spdSig },
        { label: 'DEFENSE', id: `${prefix}BarDef`, cls: barClsDef, sig: defSig },
        { label: 'RAGE', id: `${prefix}BarRage`, cls: barClsRage, sig: rageSig }
    ];

    return new UIKit.Container({
        className: 'flex flex-col gap-2 shrink-0 z-20',
        children: [
            // The Carved Stone Stat Plaque Tablet
            new UIKit.Card({
                className: 'beast-stat-plaque p-3 sm:p-3.5 flex flex-col gap-2 shrink-0 shadow-2xl',
                create3DMesh: false,
                children: [
                    new UIKit.Container({
                        className: 'space-y-1.5',
                        children: rows.map(r => new UIKit.Container({
                            className: 'flex items-center gap-2',
                            children: [
                                new UIKit.Text({
                                    tag: 'span',
                                    className: 'font-chakra font-black text-[11px] sm:text-xs text-stone-300 w-16 uppercase tracking-wider',
                                    text: r.label
                                }),
                                new UIKit.Progress({
                                    className: 'flex-1 stat-slot-trough',
                                    barId: r.id,
                                    barClassName: r.cls,
                                    value: r.sig
                                })
                            ]
                        }))
                    })
                ]
            }),
            // Prominent Glowing Amber Carved Text for CLASS & SPECIAL
            new UIKit.Container({
                className: 'px-1 font-cinzel text-xs sm:text-sm font-black leading-snug drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]',
                children: [
                    new UIKit.Container({
                        className: 'text-amber-500 uppercase tracking-wider',
                        children: [
                            new UIKit.Text({ text: 'CLASS: ' }),
                            new UIKit.Text({ id: `${prefix}ClassText`, tag: 'span', className: 'text-amber-200 font-extrabold', text: classSig })
                        ]
                    }),
                    new UIKit.Container({
                        className: 'text-amber-500 uppercase tracking-wider mt-0.5',
                        children: [
                            new UIKit.Text({ text: 'SPECIAL: ' }),
                            new UIKit.Text({ id: `${prefix}SpecialText`, tag: 'span', className: 'text-amber-300 font-extrabold', text: specSig })
                        ]
                    })
                ]
            })
        ]
    });
}

const selectScreenRoot = new UIKit.Fullscreen({
    id: 'selectScreen',
    tag: 'section',
    className: 'hidden w-full h-full flex-1 flex flex-col justify-between character-select-stage-bg select-none relative z-10 overflow-hidden p-2 sm:p-4',
    flexDirection: 'column',
    justifyContent: 'space-between',
    children: [
        // Torchlight Ember Particle Canvas Container
        new UIKit.Container({
            id: 'selectScreenCanvasContainer',
            className: 'absolute inset-0 pointer-events-none z-10 overflow-hidden'
        }),

        // TOP HEADER: PLAYER 1 | SELECT YOUR BEAST | PLAYER 2
        new UIKit.Container({
            tag: 'header',
            className: 'w-full flex items-center justify-between px-3 sm:px-8 pt-1 shrink-0 z-20',
            children: [
                new UIKit.Container({
                    className: 'flex flex-col items-start min-w-[130px] sm:min-w-[190px]',
                    children: [
                        new UIKit.Text({
                            tag: 'span',
                            className: 'font-cinzel text-sky-400 font-black text-lg sm:text-2xl md:text-3xl tracking-widest drop-shadow-[0_0_12px_rgba(56,189,248,0.85)]',
                            text: 'PLAYER 1'
                        }),
                        new UIKit.Container({
                            className: 'w-full h-1 bg-stone-800 rounded mt-1 border-b border-sky-500/70 shadow-[0_0_8px_rgba(56,189,248,0.6)]'
                        })
                    ]
                }),
                new UIKit.Container({
                    className: 'flex flex-col items-center shrink-0 relative z-20',
                    children: [
                        new UIKit.Image({
                            src: 'assets/ui/select_your_beast_title.png',
                            className: 'select-your-beast-header-img'
                        })
                    ]
                }),
                new UIKit.Container({
                    className: 'flex flex-col items-end min-w-[130px] sm:min-w-[190px]',
                    children: [
                        new UIKit.Text({
                            id: 'p2HeaderLabel',
                            tag: 'span',
                            className: 'font-cinzel text-red-500 font-black text-lg sm:text-2xl md:text-3xl tracking-widest drop-shadow-[0_0_12px_rgba(239,68,68,0.85)]',
                            text: p2HeaderLabelSignal
                        }),
                        new UIKit.Container({
                            className: 'w-full h-1 bg-stone-800 rounded mt-1 border-b border-red-500/70 shadow-[0_0_8px_rgba(239,68,68,0.6)]'
                        })
                    ]
                })
            ]
        }),

        // THREE COLUMN STAGE: P1 3D - CENTER BEAST GRID - P2 3D
        new UIKit.Container({
            tag: 'main',
            className: 'w-full flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-stretch min-h-0 relative z-10 px-1 sm:px-4 my-auto',
            children: [
                // LEFT COLUMN: P1 SHOWCASE
                new UIKit.Container({
                    className: 'lg:col-span-3 flex flex-col justify-between items-center gap-2 overflow-hidden pl-1 h-full py-1',
                    children: [
                        new UIKit.CustomContainer({
                            className: 'w-full flex-1 relative flex items-center justify-center overflow-hidden min-h-[260px]',
                            canvasId: 'p1PreviewCanvas',
                            canvasClassName: 'w-full h-full block relative z-10'
                        }),
                        createBeastStatPlaque('p1', true)
                    ]
                }),

                // CENTER COLUMN: THE BEAST GRID (ROSTER)
                new UIKit.Container({
                    className: 'lg:col-span-6 flex flex-col justify-between items-center gap-2 overflow-visible relative z-20 my-auto h-full py-1',
                    children: [
                        // The ancient stone & vine framed 5x4 grid
                        new UIKit.Card({
                            className: 'beast-grid-frame w-full max-w-[620px] p-3 sm:p-4 relative shadow-2xl rounded-2xl flex flex-col justify-center',
                            create3DMesh: false,
                            children: [
                                new UIKit.Container({
                                    className: 'beast-grid-vine-overlay'
                                }),
                                new UIKit.Container({
                                    id: 'rosterGrid',
                                    className: 'grid grid-cols-5 gap-1.5 sm:gap-2 relative z-20 w-full'
                                })
                            ]
                        }),
                        // Action buttons beneath the grid
                        new UIKit.Container({
                            className: 'w-full max-w-[620px] flex flex-col gap-2 shrink-0 z-20',
                            children: [
                                new UIKit.Container({
                                    className: 'flex items-center justify-center gap-2.5',
                                    children: [
                                        new UIKit.Button({
                                            id: 'btnSelectSlotP1',
                                            className: 'stone-btn px-4 py-1.5 rounded-lg text-xs font-black text-sky-300 uppercase tracking-wider shadow cursor-pointer',
                                            text: 'Choisir J1'
                                        }),
                                        new UIKit.Button({
                                            id: 'btnSelectSlotP2',
                                            className: 'stone-btn px-4 py-1.5 rounded-lg text-xs font-black text-red-300 uppercase tracking-wider shadow cursor-pointer',
                                            text: 'Choisir J2'
                                        }),
                                        new UIKit.Button({
                                            id: 'btnRandomFighters',
                                            className: 'stone-btn px-4 py-1.5 rounded-lg text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5 shadow cursor-pointer',
                                            children: [
                                                new UIKit.Text({ tag: 'span', text: '🎲' }),
                                                new UIKit.Text({ tag: 'span', text: 'Aléatoire' })
                                            ]
                                        })
                                    ]
                                }),
                                new UIKit.Button({
                                    id: 'btnGoToArena',
                                    className: 'w-full py-2.5 px-6 rounded-xl bg-gradient-to-r from-red-800 via-red-600 to-amber-600 hover:from-red-700 hover:to-amber-500 text-white font-cinzel font-black text-xs sm:text-sm uppercase tracking-widest shadow-2xl border-2 border-amber-300 finish-pulse flex items-center justify-center gap-2 cursor-pointer',
                                    children: [
                                        new UIKit.Text({ tag: 'span', text: "CHOISIR L'ARÈNE DE KOMBAT" }),
                                        new UIKit.Text({ tag: 'span', className: 'text-base', text: '➔' })
                                    ]
                                })
                            ]
                        })
                    ]
                }),

                // RIGHT COLUMN: P2 SHOWCASE
                new UIKit.Container({
                    className: 'lg:col-span-3 flex flex-col justify-between items-center gap-2 overflow-hidden pr-1 h-full py-1',
                    children: [
                        new UIKit.CustomContainer({
                            className: 'w-full flex-1 relative flex items-center justify-center overflow-hidden min-h-[260px]',
                            canvasId: 'p2PreviewCanvas',
                            canvasClassName: 'w-full h-full block relative z-10'
                        }),
                        createBeastStatPlaque('p2', false)
                    ]
                })
            ]
        }),

        // BOTTOM STONE PLINTH: CONTROLS & NAVIGATION
        new UIKit.Container({
            tag: 'footer',
            className: 'arena-bottom-slab w-full py-2.5 px-4 sm:px-8 flex items-center justify-between shrink-0 relative z-30',
            children: [
                new UIKit.Svg({
                    className: 'absolute -top-5 left-1 w-28 sm:w-36 h-10 pointer-events-none z-20 overflow-visible opacity-90 hidden sm:block',
                    svg: FOSSIL_RIB_VINES_LEFT_SVG
                }),
                new UIKit.Button({
                    id: 'btnSelectBackToMain',
                    className: 'stone-btn px-4 py-1.5 rounded-lg text-xs font-black text-amber-200 flex items-center gap-1.5 font-chakra shadow cursor-pointer relative z-30',
                    children: [
                        new UIKit.Text({ tag: 'span', text: '←' }),
                        new UIKit.Text({ tag: 'span', text: 'MENU PRINCIPAL' })
                    ]
                }),
                new UIKit.Container({
                    className: 'flex items-center gap-4 sm:gap-8 font-chakra text-[11px] sm:text-xs font-black tracking-wider relative z-30 mx-auto',
                    children: [
                        new UIKit.Container({
                            className: 'flex items-center gap-1.5',
                            children: [
                                new UIKit.Text({ tag: 'span', className: 'text-sky-400 font-bold', text: 'P1' }),
                                new UIKit.Badge({ className: 'px-1.5 py-0.5 rounded bg-emerald-600 text-white font-black text-xs shadow-[0_0_8px_#22c55e]', text: '[A]' }),
                                new UIKit.Text({ tag: 'span', className: 'text-stone-300 font-bold', text: 'CONFIRM' }),
                                new UIKit.Text({ tag: 'span', className: 'text-stone-500 font-normal', text: '|' }),
                                new UIKit.Badge({ className: 'px-1.5 py-0.5 rounded bg-red-600 text-white font-black text-xs shadow-[0_0_8px_#ef4444]', text: '[B]' }),
                                new UIKit.Text({ tag: 'span', className: 'text-stone-300 font-bold', text: 'BACK' })
                            ]
                        }),
                        new UIKit.Container({
                            className: 'flex items-center gap-1.5',
                            children: [
                                new UIKit.Text({ tag: 'span', className: 'text-red-400 font-bold', text: 'P2' }),
                                new UIKit.Badge({ className: 'px-1.5 py-0.5 rounded bg-blue-600 text-white font-black text-xs shadow-[0_0_8px_#3b82f6]', text: '[X]' }),
                                new UIKit.Text({ tag: 'span', className: 'text-stone-300 font-bold', text: 'RANDOM' }),
                                new UIKit.Text({ tag: 'span', className: 'text-stone-500 font-normal', text: '|' }),
                                new UIKit.Badge({ className: 'px-1.5 py-0.5 rounded bg-amber-600 text-white font-black text-xs shadow-[0_0_8px_#f59e0b]', text: '[Y]' }),
                                new UIKit.Text({ tag: 'span', className: 'text-stone-300 font-bold', text: 'SKINS' })
                            ]
                        })
                    ]
                }),
                new UIKit.Container({
                    className: 'flex items-center gap-3 relative z-30',
                    children: [
                        new UIKit.Container({
                            id: 'selectScreenModeBadge',
                            className: 'text-[10px] sm:text-xs font-extrabold text-amber-400 tracking-wider uppercase',
                            innerHTML: 'JOUEUR VS IA'
                        }),
                        new UIKit.Badge({
                            className: 'px-2 py-0.5 rounded bg-stone-900 border border-amber-600/60 text-amber-300 font-black text-[10px] tracking-wider',
                            text: 'v0.2'
                        })
                    ]
                }),
                new UIKit.Svg({
                    className: 'absolute -top-5 right-2 w-24 sm:w-32 h-10 pointer-events-none z-20 overflow-visible opacity-90 hidden sm:block',
                    svg: CREEPING_ROOTS_RIGHT_SVG
                })
            ]
        })
    ]
});

selectScreenRoot.mount(document.getElementById('appMain'));

// Générateur d'aperçus 3D réels pour chaque combattant du roster (modèle entier)
const DINO_3D_THUMBNAILS = {};
let offscreen3DRenderer = null;
let offscreen3DScene = null;
let offscreen3DCamera = null;

function getDino3DThumbnail(dino, skinIndex = 0) {
    const key = `${dino.id}_${skinIndex}`;
    if (DINO_3D_THUMBNAILS[key]) return DINO_3D_THUMBNAILS[key];

    try {
        if (!offscreen3DRenderer) {
            const canvas = document.createElement('canvas');
            canvas.width = 180;
            canvas.height = 180;
            offscreen3DRenderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
            offscreen3DRenderer.setPixelRatio(1);
            offscreen3DRenderer.setSize(180, 180, false);

            offscreen3DScene = new THREE.Scene();
            offscreen3DCamera = new THREE.PerspectiveCamera(35, 1, 0.1, 50);

            offscreen3DScene.add(new THREE.AmbientLight(0xffffff, 1.15));
            const sun = new THREE.DirectionalLight(0xffedd5, 1.6);
            sun.position.set(5, 7, 5);
            offscreen3DScene.add(sun);

            const fill = new THREE.DirectionalLight(0x93c5fd, 0.85);
            fill.position.set(-4, -1, 3);
            offscreen3DScene.add(fill);

            const rim = new THREE.DirectionalLight(0xffffff, 1.3);
            rim.position.set(-4, 6, -4);
            offscreen3DScene.add(rim);
        }

        const rig = createDino3DRig(dino, skinIndex);
        const prevScale = getDinoPreviewScale(dino, rig);
        rig.root.scale.setScalar(prevScale);
        offscreen3DScene.add(rig.root);
        rig.root.rotation.y = -0.44;
        rig.root.updateMatrixWorld(true);

        animateDino3DRig({
            dino,
            scale: prevScale,
            rig,
            action: 'idle',
            actionDuration: 0,
            hitStun: 0,
            isBlocking: false
        }, 0.5, 0.016);
        rig.root.scale.setScalar(prevScale);
        rig.root.updateMatrixWorld(true);

        const headBox = new THREE.Box3().setFromObject(rig.headGroup || rig.root);
        const headCenter = new THREE.Vector3();
        headBox.getCenter(headCenter);
        const headSize = new THREE.Vector3();
        headBox.getSize(headSize);

        const headDim = Math.max(headSize.x, headSize.y, headSize.z, 0.95);
        let dist = Math.max(2.35, Math.min(headDim * 2.15, 4.5));

        const target = headCenter.clone();
        target.y -= headSize.y * 0.08;

        offscreen3DCamera.position.set(
            target.x + dist * 0.60,
            target.y + dist * 0.28,
            target.z + dist * 0.68
        );
        offscreen3DCamera.lookAt(target.x, target.y, target.z);

        offscreen3DRenderer.render(offscreen3DScene, offscreen3DCamera);
        const dataUrl = offscreen3DRenderer.domElement.toDataURL('image/png');
        offscreen3DScene.remove(rig.root);

        DINO_3D_THUMBNAILS[key] = dataUrl;
        return dataUrl;
    } catch (e) {
        console.log('DINO_THUMB_ERROR:', dino.name, e.message, e.stack);
        return '';
    }
}

function getDinoPreviewScale(dino, rig) {
    if (dino && dino.previewScale) return dino.previewScale;
    const TUNED_PREVIEW_SCALES = {
        apato: 0.72,
        dragon: 0.75,
        spinosaurus: 0.88,
        stegosaurus: 0.88,
        trex: 0.92,
        therizino: 0.92,
        ankylo: 0.95
    };
    if (dino && TUNED_PREVIEW_SCALES[dino.id]) {
        return TUNED_PREVIEW_SCALES[dino.id];
    }
    if (rig && rig.root) {
        rig.root.updateMatrixWorld(true);
        const bbox = new THREE.Box3().setFromObject(rig.root);
        const size = new THREE.Vector3();
        bbox.getSize(size);
        const maxSpan = Math.max(size.x, size.z);
        if (maxSpan > 7.2 || size.y > 5.2) {
            return Math.min(dino.scale, dino.scale * (7.2 / maxSpan), dino.scale * (5.2 / size.y));
        }
    }
    return dino ? dino.scale : 1.0;
}

let preview1 = { renderer: null, scene: null, camera: null, rig: null, dinoId: null, rimLight: null, uikitRoot: null, targetDist: 6.8, targetY: 1.3 };
let preview2 = { renderer: null, scene: null, camera: null, rig: null, dinoId: null, rimLight: null, uikitRoot: null, targetDist: 6.8, targetY: 1.3 };

function setupPreviewScene(previewObj, canvasId, isP1 = true) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1.4, 0.1, 100);
    camera.position.set(0, 2.1, 13.0);
    camera.lookAt(0, 1.70, 0);

    scene.add(new THREE.AmbientLight(0xffffff, 0.78));
    const dirLight = new THREE.DirectionalLight(0xffeedd, 1.25);
    dirLight.position.set(4, 7, 5);
    scene.add(dirLight);

    const torch = new THREE.PointLight(0xf59e0b, 1.3, 14);
    torch.position.set(isP1 ? 2.5 : -2.5, 2.4, 2.5);
    scene.add(torch);

    const rimLight = new THREE.DirectionalLight(isP1 ? 0x38bdf8 : 0xef4444, 1.35);
    rimLight.position.set(isP1 ? -4 : 4, 5, -4);
    scene.add(rimLight);

    const pedestalGroup = new THREE.Group();
    const baseGeo = new THREE.CylinderGeometry(2.7, 3.1, 0.4, 28);
    const baseMat = new THREE.MeshStandardMaterial({
        color: 0x24201c,
        roughness: 0.95,
        metalness: 0.08
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = -0.42;
    pedestalGroup.add(baseMesh);

    const cylGeo = new THREE.CylinderGeometry(2.45, 2.7, 0.45, 28);
    const cylMat = new THREE.MeshStandardMaterial({
        color: 0x322b25,
        roughness: 0.9,
        metalness: 0.1
    });
    const pedestalMesh = new THREE.Mesh(cylGeo, cylMat);
    pedestalMesh.position.y = -0.18;
    pedestalGroup.add(pedestalMesh);

    const rimGeo = new THREE.TorusGeometry(2.46, 0.09, 14, 32);
    const rimMat = new THREE.MeshStandardMaterial({ color: 0x483e35, roughness: 0.75 });
    const rimMesh = new THREE.Mesh(rimGeo, rimMat);
    rimMesh.rotation.x = Math.PI / 2;
    rimMesh.position.y = 0.02;
    pedestalGroup.add(rimMesh);

    const mossGeo = new THREE.TorusGeometry(2.48, 0.04, 8, 24);
    const mossMat = new THREE.MeshStandardMaterial({ color: 0x224820, roughness: 0.85 });
    const mossMesh = new THREE.Mesh(mossGeo, mossMat);
    mossMesh.rotation.x = Math.PI / 2;
    mossMesh.position.y = -0.06;
    pedestalGroup.add(mossMesh);

    const shadowGeo = new THREE.CircleGeometry(2.25, 32);
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x050508, transparent: true, opacity: 0.7 });
    const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.y = 0.03;
    pedestalGroup.add(contactShadow);

    scene.add(pedestalGroup);

    // Attach a 3D @pmndrs/uikit Root to the pedestal scene
    const uikitRoot = new UIKit.Root(camera, renderer, { pixelSize: 0.01, width: 320, height: 280 });
    scene.add(uikitRoot);

    previewObj.renderer = renderer;
    previewObj.scene = scene;
    previewObj.camera = camera;
    previewObj.rimLight = rimLight;
    previewObj.uikitRoot = uikitRoot;
}

function getP2EffectiveDino() {
    if (gameMode === 'campaign') {
        if (campaignStage === 6 && typeof DRAGON_BOSS !== 'undefined' && DRAGON_BOSS) {
            return DRAGON_BOSS;
        }
        if (campaignOpponents && campaignOpponents[campaignStage - 1] !== undefined) {
            return DINO_ROSTER[campaignOpponents[campaignStage - 1]];
        }
    }
    return DINO_ROSTER[p2ChoiceIndex] || DINO_ROSTER[1];
}

function updatePreviewModels(time) {
    const selectSec = document.getElementById('selectScreen');
    if (!selectSec || selectSec.classList.contains('hidden')) return;

    if (!preview1.renderer) setupPreviewScene(preview1, 'p1PreviewCanvas', true);
    if (!preview2.renderer) setupPreviewScene(preview2, 'p2PreviewCanvas', false);

    const p1Dino = DINO_ROSTER[p1ChoiceIndex] || DINO_ROSTER[0];
    const p2Dino = getP2EffectiveDino();
    const p2Skin = (gameMode === 'campaign' && campaignStage === 6) ? 0 : p2SkinIndex;

    [
        { p: preview1, dino: p1Dino, skinIndex: p1SkinIndex, canvasId: 'p1PreviewCanvas', dir: 1 },
        { p: preview2, dino: p2Dino, skinIndex: p2Skin, canvasId: 'p2PreviewCanvas', dir: -1 }
    ].forEach(item => {
        if (!item.p.renderer) return;
        const canvas = document.getElementById(item.canvasId);
        if (!canvas || !canvas.parentElement) return;

        const rect = canvas.parentElement.getBoundingClientRect();
        const w = rect.width > 0 ? rect.width : (canvas.clientWidth || 320);
        const h = rect.height > 0 ? rect.height : (canvas.clientHeight || 280);
        if (item.p.lastW !== Math.floor(w) || item.p.lastH !== Math.floor(h)) {
            item.p.lastW = Math.floor(w);
            item.p.lastH = Math.floor(h);
            item.p.renderer.setSize(w, h, false);
            item.p.camera.aspect = w / h;
            item.p.camera.updateProjectionMatrix();
        }

        if (item.p.dinoId !== item.dino.id || item.p.skinIndex !== item.skinIndex) {
            if (item.p.rig) item.p.scene.remove(item.p.rig.root);
            item.p.rig = createDino3DRig(item.dino, item.skinIndex);
            const prevScale = getDinoPreviewScale(item.dino, item.p.rig);
            item.p.rig.root.scale.setScalar(prevScale);
            item.p.scene.add(item.p.rig.root);
            item.p.dinoId = item.dino.id;
            item.p.skinIndex = item.skinIndex;
            item.p.previewScale = prevScale;
            item.p.rig.root.updateMatrixWorld(true);
        }

        if (item.p.rig) {
            const prevScale = item.p.previewScale || getDinoPreviewScale(item.dino, item.p.rig);
            const baseRot = item.dir === 1 ? -0.42 : (Math.PI + 0.42);
            const sway = Math.sin(time * 0.0012) * 0.05;
            item.p.rig.root.rotation.y = baseRot + sway * item.dir;

            animateDino3DRig({
                dino: item.dino,
                scale: prevScale,
                rig: item.p.rig,
                action: 'idle',
                actionDuration: 0,
                hitStun: 0,
                isBlocking: false
            }, time * 0.001, 0.016);
            item.p.rig.root.scale.setScalar(prevScale);
            item.p.rig.root.updateMatrixWorld(true);

            const target = new THREE.Vector3(0, 1.70, 0);
            const aspect = item.p.camera.aspect || 1.0;
            const dist = Math.max(12.8, 12.0 / Math.min(aspect, 1.0));
            item.p.camera.position.set(item.dir * 0.45, 2.10, dist);
            item.p.camera.lookAt(target.x, target.y, target.z);
        }

        if (item.p.rimLight) {
            item.p.rimLight.color.setHex(item.dino.accentColor || (item.dir === 1 ? 0xef4444 : 0x38bdf8));
        }

        if (item.p.uikitRoot) {
            item.p.uikitRoot.update(0.016);
        }

        item.p.renderer.render(item.p.scene, item.p.camera);
    });
}

function initRosterUI() {
    const gridNode = UIKit.getElementById('rosterGrid');
    if (!gridNode) return;
    gridNode.clearChildren();

    DINO_ROSTER.forEach((dino, idx) => {
        const isLocked = dino.isUnlockable && !isFighterUnlocked(dino.id);

        if (isLocked) {
            const portraitUrl = getFighterPortraitUrl(dino.id);
            const lockedCard = new UIKit.Card({
                dataset: { index: idx },
                className: `beast-card stone-card ${idx === p1ChoiceIndex ? 'selected-p1' : ''} ${idx === p2ChoiceIndex ? 'selected-p2' : ''} opacity-70 border-dashed border-amber-500/40`,
                onClick: () => {
                    sfx.playCooldownWarning();
                    const eraReq = (typeof UNLOCKABLE_FIGHTER_ERAS !== 'undefined' && UNLOCKABLE_FIGHTER_ERAS[dino.id]) ? UNLOCKABLE_FIGHTER_ERAS[dino.id] : null;
                    const msg = eraReq 
                        ? `🔒 COMBATTANT VERROUILLÉ ! Conquérez l'Ère ${eraReq} en Campagne pour le débloquer !`
                        : `🔒 COMBATTANT VERROUILLÉ ! Terminez la Campagne pour le débloquer !`;
                    spawnFloatingPopup(0, msg, '#ef4444');
                },
                children: [
                    new UIKit.Container({
                        className: 'w-full flex-1 relative overflow-hidden bg-black/60 flex items-center justify-center',
                        children: [
                            new UIKit.Image({
                                src: portraitUrl,
                                alt: 'Locked',
                                className: 'w-full h-full object-cover filter brightness-[0.25] grayscale contrast-125',
                                onError: (e, img) => { img.style.display = 'none'; }
                            }),
                            new UIKit.Text({
                                tag: 'span',
                                className: 'absolute text-2xl filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)] z-10',
                                text: '🔒'
                            })
                        ]
                    }),
                    new UIKit.Text({
                        tag: 'div',
                        className: 'beast-name-plaque text-stone-400',
                        text: '???'
                    })
                ]
            });
            gridNode.add(lockedCard);
        } else {
            const portraitUrl = getFighterPortraitUrl(dino.id);
            const fallbackSrc = '';

            const unlockedCard = new UIKit.Card({
                dataset: { index: idx },
                className: `beast-card stone-card ${idx === p1ChoiceIndex ? 'selected-p1' : ''} ${idx === p2ChoiceIndex ? 'selected-p2' : ''}`,
                onClick: () => {
                    sfx.playHit(false);
                    if (gameMode === 'campaign') {
                        if (p1ChoiceIndex === idx) {
                            startMatch();
                            return;
                        }
                        p1ChoiceIndex = idx;
                        if (campaignStage < 6 && campaignOpponents && campaignOpponents[campaignStage - 1] === idx) {
                            for (let k = 0; k < DINO_ROSTER.length; k++) {
                                if (k !== idx && !DINO_ROSTER[k].isBoss && (!DINO_ROSTER[k].isUnlockable || isFighterUnlocked(DINO_ROSTER[k].id))) {
                                    campaignOpponents[campaignStage - 1] = k;
                                    break;
                                }
                            }
                        }
                    } else {
                        if (activeSelectSlot === 1) {
                            p1ChoiceIndex = idx;
                            if (gameMode === 'pvp') activeSelectSlot = 2;
                        } else {
                            p2ChoiceIndex = idx;
                            activeSelectSlot = 1;
                        }
                    }
                    updateSelectScreenUI();
                },
                onDblClick: () => {
                    if (gameMode === 'campaign') {
                        p1ChoiceIndex = idx;
                        startMatch();
                    } else {
                        if (activeSelectSlot === 1) {
                            p1ChoiceIndex = idx;
                        } else {
                            p2ChoiceIndex = idx;
                        }
                        openArenaChooser();
                    }
                },
                children: [
                    new UIKit.Badge({
                        tag: 'div',
                        className: `p1-flag-badge ${idx === p1ChoiceIndex ? '' : 'hidden'}`,
                        text: 'P1'
                    }),
                    new UIKit.Badge({
                        tag: 'div',
                        className: `p2-flag-badge ${idx === p2ChoiceIndex ? '' : 'hidden'}`,
                        text: 'P2'
                    }),
                    new UIKit.Container({
                        className: 'w-full flex-1 relative overflow-hidden bg-stone-900/60 flex items-center justify-center',
                        children: [
                            new UIKit.Image({
                                src: portraitUrl,
                                alt: dino.name,
                                className: 'w-full h-full object-cover object-center filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.85)] transition-transform duration-300',
                                onError: (e, img) => {
                                    if (fallbackSrc) {
                                        img.src = fallbackSrc;
                                        img.className = 'w-full h-full object-contain filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)] transform scale-110';
                                    }
                                }
                            })
                        ]
                    }),
                    new UIKit.Text({
                        tag: 'div',
                        className: 'beast-name-plaque',
                        text: dino.name
                    })
                ]
            });
            gridNode.add(unlockedCard);
        }
    });

    // Slot 15: Boss Drak'Zul (Complète la rangée 3 de 5 cartes)
    const bossCard = new UIKit.Card({
        className: 'beast-card opacity-90 border border-red-500/60 shadow-[0_0_14px_rgba(220,38,38,0.4)] cursor-pointer',
        onClick: () => {
            sfx.playCooldownWarning();
            spawnFloatingPopup(0, "🔥 BOSS ANCESTRAL ! Terrassez les 5 étapes de la Campagne pour affronter Drak'Zul !", '#ef4444');
        },
        children: [
            new UIKit.Container({
                className: 'w-full flex-1 relative overflow-hidden bg-red-950/40 flex items-center justify-center',
                children: [
                    new UIKit.Image({
                        src: getFighterPortraitUrl('dragon'),
                        alt: "Drak'Zul",
                        className: 'w-full h-full object-cover object-center filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]'
                    }),
                    new UIKit.Badge({
                        className: 'absolute top-0 right-0 bg-red-600 text-white font-chakra font-black text-[9px] px-1.5 py-0.5 rounded-bl shadow',
                        text: 'BOSS'
                    })
                ]
            }),
            new UIKit.Text({
                tag: 'div',
                className: 'beast-name-plaque text-red-400 font-black',
                text: "DRAK'ZUL"
            })
        ]
    });
    gridNode.add(bossCard);

    // Rangée 4 (Slots 16 à 20): 5 emplacements verrouillés secrets avec cadenas
    const secretTitles = ['ANCESTRAL', 'TITAN', 'COLOSSE', 'LÉGENDE', 'PRIMAL'];
    secretTitles.forEach((secName) => {
        const secretCard = new UIKit.Card({
            className: 'beast-card opacity-65 border-stone-800 bg-stone-950/80 cursor-pointer',
            onClick: () => {
                sfx.playCooldownWarning();
                spawnFloatingPopup(0, `🔒 COMBATTANT ${secName} VERROUILLÉ ! Complétez les défis secrets de l'Extinction !`, '#f59e0b');
            },
            children: [
                new UIKit.Container({
                    className: 'w-full flex-1 flex flex-col items-center justify-center relative p-1 bg-black/40',
                    children: [
                        new UIKit.Text({
                            tag: 'span',
                            className: 'text-xl sm:text-2xl opacity-75 filter drop-shadow',
                            text: '🔒'
                        })
                    ]
                }),
                new UIKit.Text({
                    tag: 'div',
                    className: 'beast-name-plaque text-stone-500',
                    text: secName
                })
            ]
        });
        gridNode.add(secretCard);
    });

    updateSelectScreenUI();
}

function updateSelectScreenUI() {
    if (DINO_ROSTER[p1ChoiceIndex] && DINO_ROSTER[p1ChoiceIndex].isUnlockable && !isFighterUnlocked(DINO_ROSTER[p1ChoiceIndex].id)) {
        p1ChoiceIndex = 0;
    }
    if (DINO_ROSTER[p2ChoiceIndex] && DINO_ROSTER[p2ChoiceIndex].isUnlockable && !isFighterUnlocked(DINO_ROSTER[p2ChoiceIndex].id)) {
        p2ChoiceIndex = 1;
    }

    const p1 = DINO_ROSTER[p1ChoiceIndex] || DINO_ROSTER[0];
    const p2 = getP2EffectiveDino();

    const modeBadge = document.getElementById('selectScreenModeBadge');
    const slot1Btn = document.getElementById('btnSelectSlotP1');
    const slot2Btn = document.getElementById('btnSelectSlotP2');

    if (gameMode === 'campaign') {
        if (modeBadge) {
            modeBadge.innerHTML = `<span class="text-amber-400">🏆 CAMPAGNE : ÉTAPE ${campaignStage} / ${CAMPAIGN_TOTAL_STAGES}</span>`;
        }
        if (slot1Btn) slot1Btn.classList.add('hidden');
        if (slot2Btn) slot2Btn.classList.add('hidden');
        p2HeaderLabelSignal.value = campaignStage === 6 ? "DRAK'ZUL" : `ÉTAPE ${campaignStage}`;
    } else {
        if (slot1Btn) slot1Btn.classList.remove('hidden');
        if (slot2Btn) slot2Btn.classList.remove('hidden');
        if (modeBadge) {
            modeBadge.innerHTML = gameMode === 'pvp'
                ? `<span>👥 2 JOUEURS (1 VS 1)</span>`
                : (gameMode === 'practice' ? `<span>🥋 ENTRAÎNEMENT</span>` : `<span>👤 JOUEUR VS IA</span>`);
        }
        p2HeaderLabelSignal.value = gameMode === 'pvp' ? 'PLAYER 2' : (gameMode === 'practice' ? 'MANNEQUIN' : 'PLAYER 2 (IA)');
    }

    p1SkinIndex = 0;
    p2SkinIndex = 0;

    // Update P1 @pmndrs/uikit Signals
    UIKit.batch(() => {
        p1PowSignal.value = p1.stats ? p1.stats.pow : 95;
        p1SpdSignal.value = p1.stats ? p1.stats.spd : 70;
        p1DefSignal.value = p1.stats ? p1.stats.def : 85;
        p1RageStatSignal.value = Math.min(100, Math.round(((p1.stats ? p1.stats.pow : 90) * 0.75) + ((100 - (p1.stats ? p1.stats.def : 80)) * 0.45)));
        p1ClassSignal.value = (p1.role || 'APEX PREDATOR').toUpperCase();
        p1SpecialSignal.value = (p1.special1Name || 'MORSURE PRIMALE').split('(')[0].trim().toUpperCase();

        p2PowSignal.value = p2.stats ? p2.stats.pow : 90;
        p2SpdSignal.value = p2.stats ? p2.stats.spd : 55;
        p2DefSignal.value = p2.stats ? p2.stats.def : 100;
        p2RageStatSignal.value = Math.min(100, Math.round(((p2.stats ? p2.stats.pow : 85) * 0.75) + ((100 - (p2.stats ? p2.stats.def : 90)) * 0.45)));
        p2ClassSignal.value = (p2.role || 'TANK').toUpperCase();
        p2SpecialSignal.value = (p2.special1Name || 'CHARGE SISMIQUE').split('(')[0].trim().toUpperCase();
    });

    const btnGoToArena = document.getElementById('btnGoToArena');
    if (btnGoToArena) {
        if (gameMode === 'campaign') {
            const themedArenaId = typeof getThemedArenaForFighter === 'function' ? getThemedArenaForFighter(p2.id) : 'volcano';
            const arenaObj = typeof ARENAS !== 'undefined' && ARENAS[themedArenaId];
            const arenaLabel = arenaObj ? arenaObj.label.split('(')[0].trim() : themedArenaId;
            btnGoToArena.innerHTML = campaignStage === 6
                ? `🔥 DÉFIER LE BOSS DRAK'ZUL ➔`
                : `⚔️ DÉFIER L'ÉTAPE ${campaignStage} • ${p2.name} (${arenaLabel}) ➔`;
            btnGoToArena.className = 'w-full py-2 sm:py-2.5 px-4 rounded-xl bg-gradient-to-r from-red-700 via-amber-600 to-red-700 hover:from-red-600 hover:to-amber-500 text-white font-black text-xs sm:text-sm uppercase tracking-widest shadow-lg border border-amber-300 finish-pulse transition';
        } else {
            btnGoToArena.innerHTML = `CHOISIR L'ARÈNE DE KOMBAT ➔`;
            btnGoToArena.className = 'w-full py-2 sm:py-2.5 px-4 rounded-xl bg-gradient-to-r from-red-700 via-amber-600 to-red-700 hover:from-red-600 hover:to-amber-500 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg border border-white/10 transition';
        }
    }

    document.querySelectorAll('#rosterGrid .beast-card').forEach((card, i) => {
        const isP1 = i === p1ChoiceIndex;
        const isP2 = (gameMode === 'campaign' && campaignStage < 6)
            ? (campaignOpponents && i === campaignOpponents[campaignStage - 1])
            : (gameMode !== 'campaign' && i === p2ChoiceIndex);

        card.classList.toggle('selected-p1', isP1);
        card.classList.toggle('selected-p2', isP2);
        const p1Badge = card.querySelector('.p1-flag-badge');
        const p2Badge = card.querySelector('.p2-flag-badge');
        if (p1Badge) p1Badge.classList.toggle('hidden', !isP1);
        if (p2Badge) p2Badge.classList.toggle('hidden', !isP2);
    });
}

function goToSelectScreen() {
    matchState = 'select';
    if (typeof mainMenuVisibleSignal !== 'undefined') mainMenuVisibleSignal.value = false;
    if (typeof campaignMapVisibleSignal !== 'undefined') campaignMapVisibleSignal.value = false;
    const mainMenu = document.getElementById('mainMenu');
    if (mainMenu) mainMenu.classList.add('hidden');
    const campaignScreen = document.getElementById('campaignScreen');
    if (campaignScreen) campaignScreen.classList.add('hidden');
    const battleScreen = document.getElementById('battleScreen');
    if (battleScreen) {
        battleScreen.classList.add('hidden');
        battleScreen.classList.remove('flex');
    }
    const arenaScreen = document.getElementById('arenaScreen');
    if (arenaScreen) arenaScreen.classList.add('hidden');
    const selectScreen = document.getElementById('selectScreen');
    if (selectScreen) selectScreen.classList.remove('hidden');

    const btnBack = document.getElementById('btnBackToSelect');
    if (btnBack) btnBack.classList.add('hidden');
    const btnCam = document.getElementById('btnResetCam');
    if (btnCam) btnCam.classList.add('hidden');
    const pmm = document.getElementById('postMatchMenu');
    if (pmm) pmm.classList.add('hidden');

    initRosterUI();
    updateSelectScreenUI();
    if (typeof updateGamepadHelperHUD === 'function') {
        updateGamepadHelperHUD();
    }
}

function returnToSelect() {
    goToSelectScreen();
}

function startSelectScreenEmberCanvas() {
    const container = document.getElementById('selectScreenCanvasContainer');
    if (!container || document.getElementById('selectScreenCanvas')) return;

    const canvas = document.createElement('canvas');
    canvas.id = 'selectScreenCanvas';
    canvas.className = 'absolute inset-0 pointer-events-none z-10 w-full h-full';
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });

    const PARTICLE_COUNT = 35;
    const particles = [];
    const colors = [
        'rgba(255, 120, 0, ',
        'rgba(255, 170, 0, ',
        'rgba(255, 200, 20, ',
        'rgba(255, 80, 0, '
    ];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            radius: Math.random() * 2.5 + 1.0,
            baseSpeedY: Math.random() * 0.8 + 0.3,
            speedX: (Math.random() - 0.48) * 0.7,
            colorPrefix: colors[Math.floor(Math.random() * colors.length)],
            alpha: Math.random() * 0.7 + 0.2,
            fadeSpeed: Math.random() * 0.012 + 0.005,
            fadingIn: Math.random() > 0.5,
            seed: Math.random() * 100
        });
    }

    function renderTorchEmbers(time) {
        const sec = document.getElementById('selectScreen');
        if (!sec || sec.classList.contains('hidden')) {
            requestAnimationFrame(renderTorchEmbers);
            return;
        }

        ctx.clearRect(0, 0, width, height);

        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            p.y -= p.baseSpeedY;
            p.x += Math.sin(time * 0.001 + p.seed) * 0.5 + p.speedX;

            if (p.fadingIn) {
                p.alpha += p.fadeSpeed;
                if (p.alpha >= 0.85) p.fadingIn = false;
            } else {
                p.alpha -= p.fadeSpeed;
                if (p.alpha <= 0.12) p.fadingIn = true;
            }

            if (p.y < -10 || p.x < -10 || p.x > width + 10) {
                p.y = height + Math.random() * 20;
                p.x = Math.random() * width;
                p.alpha = 0.1;
                p.fadingIn = true;
            }

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = p.colorPrefix + p.alpha.toFixed(2) + ')';
            ctx.shadowBlur = p.radius * 3.5;
            ctx.shadowColor = 'rgba(255, 120, 0, 0.75)';
            ctx.fill();
        }

        requestAnimationFrame(renderTorchEmbers);
    }

    requestAnimationFrame(renderTorchEmbers);
}

function initSelectScreenMenu() {
    startSelectScreenEmberCanvas();
    const btnBackMain = document.getElementById('btnSelectBackToMain');
    if (btnBackMain) {
        btnBackMain.addEventListener('click', () => {
            sfx.playHit(false);
            goToMainMenu();
        });
    }

    document.getElementById('btnSelectSlotP1').addEventListener('click', () => {
        activeSelectSlot = 1;
        updateSelectScreenUI();
    });
    document.getElementById('btnSelectSlotP2').addEventListener('click', () => {
        if (gameMode !== 'campaign') {
            activeSelectSlot = 2;
            updateSelectScreenUI();
        }
    });

    document.getElementById('btnRandomFighters').addEventListener('click', () => {
        sfx.playHit(false);
        const unlockedIndices = DINO_ROSTER.map((d, i) => (!d.isUnlockable || isFighterUnlocked(d.id)) ? i : -1).filter(i => i !== -1);
        p1ChoiceIndex = unlockedIndices[Math.floor(Math.random() * unlockedIndices.length)];
        if (gameMode !== 'campaign') {
            do {
                p2ChoiceIndex = unlockedIndices[Math.floor(Math.random() * unlockedIndices.length)];
            } while (p2ChoiceIndex === p1ChoiceIndex && unlockedIndices.length > 1);
        }
        updateSelectScreenUI();
    });

    const btnGoToArena = document.getElementById('btnGoToArena');
    if (btnGoToArena) {
        btnGoToArena.addEventListener('click', () => {
            sfx.playHit(false);
            if (gameMode === 'campaign') {
                startMatch();
            } else {
                openArenaChooser();
            }
        });
    }
}

function showFighterUnlockedModal(fighterId = 'smilodon') {
    const existing = document.getElementById('unlockedFighterModal');
    if (existing) existing.remove();

    sfx.playGong();
    sfx.playRoar(70, 0.7);

    const dino = DINO_ROSTER.find(d => d.id === fighterId) || DINO_ROSTER[DINO_ROSTER.length - 1];
    const portraitUrl = getFighterPortraitUrl(dino.id);

    const smiloIdx = DINO_ROSTER.findIndex(d => d.id === fighterId);

    const unlockedModalNode = new UIKit.Dialog({
        id: 'unlockedFighterModal',
        open: true,
        className: 'fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none',
        children: [
            new UIKit.Card({
                className: 'stone-panel rounded-3xl max-w-lg w-full p-6 text-center border-2 border-amber-400 shadow-[0_0_60px_rgba(245,158,11,0.6)] flex flex-col items-center',
                create3DMesh: true,
                children: [
                    new UIKit.Container({
                        className: 'w-16 h-16 rounded-full bg-gradient-to-tr from-amber-600 to-yellow-300 p-0.5 flex items-center justify-center shadow-xl mb-3 animate-pulse',
                        children: [new UIKit.Text({ tag: 'span', className: 'text-3xl', text: '🏆' })]
                    }),
                    new UIKit.Text({ className: 'text-xs font-black uppercase tracking-[0.25em] text-amber-400 mb-1', text: 'VICTOIRE DE LA CAMPAGNE !' }),
                    new UIKit.Text({ tag: 'h2', className: 'mk-title text-2xl sm:text-3xl font-black text-white tracking-wider mb-0.5', text: 'NOUVEAU COMBATTANT DÉBLOQUÉ !' }),
                    new UIKit.Text({ className: 'text-amber-300 text-sm font-extrabold uppercase tracking-widest mb-3', text: `${dino.name} • ${dino.fullName.toUpperCase()}` }),
                    new UIKit.Container({
                        className: 'w-32 h-32 rounded-2xl bg-gradient-to-b from-amber-500/20 to-black/80 border-2 border-amber-400/80 p-1 my-2 shadow-inner flex items-center justify-center relative overflow-hidden',
                        children: [
                            new UIKit.Image({
                                src: portraitUrl,
                                alt: dino.name,
                                className: 'w-full h-full object-cover rounded-xl filter drop-shadow-[0_4px_12px_rgba(245,158,11,0.6)]'
                            })
                        ]
                    }),
                    new UIKit.Text({ tag: 'p', className: 'text-xs sm:text-sm text-amber-200 italic mb-2', text: dino.title }),
                    new UIKit.Container({
                        tag: 'p',
                        className: 'text-xs text-zinc-300 max-w-md mb-4 leading-relaxed',
                        innerHTML: `Vous avez terrassé le Dragon Primordial à l'Étape 6 de la Campagne d'Extinction ! Le redoutable <strong>${dino.fullName} aux canines sabres</strong> rejoint définitivement votre Roster !`
                    }),
                    new UIKit.Container({
                        className: 'grid grid-cols-3 gap-2 w-full max-w-xs mb-5 text-center',
                        children: [
                            new UIKit.Card({
                                className: 'bg-black/60 p-2 rounded-xl border border-white/10',
                                children: [
                                    new UIKit.Text({ className: 'text-[10px] text-zinc-400 uppercase font-bold block', text: 'Puissance' }),
                                    new UIKit.Text({ className: 'text-sm font-black text-red-400 block', text: `${dino.stats.pow}%` })
                                ]
                            }),
                            new UIKit.Card({
                                className: 'bg-black/60 p-2 rounded-xl border border-white/10',
                                children: [
                                    new UIKit.Text({ className: 'text-[10px] text-zinc-400 uppercase font-bold block', text: 'Vitesse' }),
                                    new UIKit.Text({ className: 'text-sm font-black text-amber-400 block', text: `${dino.stats.spd}%` })
                                ]
                            }),
                            new UIKit.Card({
                                className: 'bg-black/60 p-2 rounded-xl border border-white/10',
                                children: [
                                    new UIKit.Text({ className: 'text-[10px] text-zinc-400 uppercase font-bold block', text: 'Armure' }),
                                    new UIKit.Text({ className: 'text-sm font-black text-emerald-400 block', text: `${dino.stats.def}%` })
                                ]
                            })
                        ]
                    }),
                    new UIKit.Container({
                        className: 'flex flex-col sm:flex-row gap-3 w-full',
                        children: [
                            new UIKit.Button({
                                id: 'btnPlayWithUnlocked',
                                className: 'flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-400 hover:from-amber-500 hover:to-yellow-300 text-zinc-950 font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg transition',
                                text: '🐯 Choisir Smilodon !',
                                onClick: () => {
                                    unlockedModalNode.dispose();
                                    const m = document.getElementById('unlockedFighterModal');
                                    if (m) m.remove();
                                    sfx.playHit(false);
                                    if (smiloIdx >= 0) {
                                        p1ChoiceIndex = smiloIdx;
                                        activeSelectSlot = 1;
                                    }
                                    returnToSelect();
                                }
                            }),
                            new UIKit.Button({
                                id: 'btnCloseUnlockedModal',
                                className: 'py-3 px-5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs sm:text-sm uppercase tracking-wider transition',
                                text: 'Continuer',
                                onClick: () => {
                                    unlockedModalNode.dispose();
                                    const m = document.getElementById('unlockedFighterModal');
                                    if (m) m.remove();
                                    sfx.playHit(false);
                                    initRosterUI();
                                }
                            })
                        ]
                    })
                ]
            })
        ]
    });

    unlockedModalNode.mount(document.body);
}
