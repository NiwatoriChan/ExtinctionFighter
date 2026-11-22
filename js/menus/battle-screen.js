/* ============================================================================
 * MENU : ÉCRAN DE COMBAT (HUD JURASSIQUE SUPRÊME — @pmndrs/uikit Edition :
 *        Cadres en pierre & os, cornes acérées, lianes tropicales, médaillon
 *        crâne T-Rex, barre de vie magmatique, jauge Frenzy circulaire et
 *        médaillons d'action arcade)
 * ============================================================================ */

function formatHudTimer(seconds) {
    const s = Math.max(0, Math.floor(seconds));
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/* ============================================================================
 * @pmndrs/uikit REACTIVE SIGNALS FOR COMBAT HUD
 * ============================================================================ */
const hudP1HpPctSignal = UIKit.signal(100);
const hudP2HpPctSignal = UIKit.signal(100);
const hudP1GuardSignal = UIKit.signal(100);
const hudP2GuardSignal = UIKit.signal(100);
const hudP1RageSignal = UIKit.signal(0);
const hudP2RageSignal = UIKit.signal(0);
const hudP1NameSignal = UIKit.signal('T-REX');
const hudP2NameSignal = UIKit.signal('PACHYRHINOSAURE');
const hudRoundTextSignal = UIKit.signal('ROUND 1');
const hudTimerTextSignal = UIKit.signal('01:39');
const announcerMainSignal = UIKit.signal('ROUND 1');
const announcerSubSignal = UIKit.signal('PRÉPAREZ-VOUS AU COMBAT');
const aiMacroBadgeSignal = UIKit.signal('FOOTSIES');
const aiSteeringValSignal = UIKit.signal('ARRIVE');
const aiBtNodeValSignal = UIKit.signal('Selector');
const aiSweetSpotValSignal = UIKit.signal('X: 0.0m');
const aiIntentValSignal = UIKit.signal('IDLE');

const P1_PORTRAIT_FRAME_SVG = `
    <svg viewBox="0 0 110 110" class="w-full h-full absolute inset-0 z-10 pointer-events-none overflow-visible">
        <defs>
            <linearGradient id="p1BoneGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#fffbeb"/>
                <stop offset="40%" stop-color="#fef3c7"/>
                <stop offset="80%" stop-color="#d4d4d8"/>
                <stop offset="100%" stop-color="#71717a"/>
            </linearGradient>
            <linearGradient id="p1StoneGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#5a5d6e"/>
                <stop offset="50%" stop-color="#2a2c37"/>
                <stop offset="100%" stop-color="#101117"/>
            </linearGradient>
        </defs>
        <path d="M16 28 C10 14 4 4 1 0 C9 4 22 10 28 18 Z" fill="url(#p1BoneGrad)" stroke="#52525b" stroke-width="1"/>
        <path d="M94 28 C100 14 106 4 109 0 C101 4 88 10 82 18 Z" fill="url(#p1BoneGrad)" stroke="#52525b" stroke-width="1"/>
        <path d="M6 72 C0 62 2 48 0 42 C6 50 12 58 14 64 Z" fill="url(#p1BoneGrad)" stroke="#52525b" stroke-width="1"/>
        <path d="M12 22 Q55 6 98 22 L98 90 Q55 102 12 90 Z" fill="none" stroke="url(#p1StoneGrad)" stroke-width="11"/>
        <path d="M12 22 Q55 6 98 22 L98 90 Q55 102 12 90 Z" fill="none" stroke="#71717a" stroke-width="2"/>
        <path d="M16 25 Q55 11 94 25 L94 87 Q55 97 16 87 Z" fill="none" stroke="#09090b" stroke-width="2"/>
        <path d="M5 16 Q18 28 8 46 Q-2 64 10 78 Q20 88 8 98" fill="none" stroke="#14532d" stroke-width="4.5" stroke-linecap="round"/>
        <path d="M6 17 Q17 27 9 45 Q-1 63 11 77 Q19 87 9 97" fill="none" stroke="#16a34a" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M7 18 Q16 26 10 44 Q1 62 12 76 Q18 86 10 96" fill="none" stroke="#86efac" stroke-width="1" stroke-linecap="round"/>
        <polygon points="3,26 -4,22 8,20" fill="#22c55e" stroke="#14532d" stroke-width="0.8"/>
        <polygon points="14,44 22,40 14,54" fill="#22c55e" stroke="#14532d" stroke-width="0.8"/>
        <polygon points="2,66 -6,70 6,74" fill="#22c55e" stroke="#14532d" stroke-width="0.8"/>
        <polygon points="10,88 16,92 12,102" fill="#22c55e" stroke="#14532d" stroke-width="0.8"/>
        <circle cx="18" cy="90" r="14" fill="#09090b" stroke="#3f3f46" stroke-width="2.5"/>
        <circle cx="18" cy="90" r="11.5" fill="#991b1b" stroke="#f59e0b" stroke-width="2"/>
        <circle cx="18" cy="90" r="9.5" fill="none" stroke="#ef4444" stroke-width="1"/>
        <text x="18" y="95" text-anchor="middle" font-family="'Cinzel Decorative', serif" font-weight="900" font-size="13" fill="#fef08a" stroke="#000" stroke-width="0.5">1</text>
    </svg>
`;

const P2_PORTRAIT_FRAME_SVG = `
    <svg viewBox="0 0 110 110" class="w-full h-full absolute inset-0 z-10 pointer-events-none overflow-visible">
        <path d="M16 28 C10 14 4 4 1 0 C9 4 22 10 28 18 Z" fill="url(#p1BoneGrad)" stroke="#52525b" stroke-width="1"/>
        <path d="M94 28 C100 14 106 4 109 0 C101 4 88 10 82 18 Z" fill="url(#p1BoneGrad)" stroke="#52525b" stroke-width="1"/>
        <path d="M104 72 C110 62 108 48 110 42 C104 50 98 58 96 64 Z" fill="url(#p1BoneGrad)" stroke="#52525b" stroke-width="1"/>
        <path d="M12 22 Q55 6 98 22 L98 90 Q55 102 12 90 Z" fill="none" stroke="url(#p1StoneGrad)" stroke-width="11"/>
        <path d="M12 22 Q55 6 98 22 L98 90 Q55 102 12 90 Z" fill="none" stroke="#71717a" stroke-width="2"/>
        <path d="M16 25 Q55 11 94 25 L94 87 Q55 97 16 87 Z" fill="none" stroke="#09090b" stroke-width="2"/>
        <path d="M105 16 Q92 28 102 46 Q112 64 100 78 Q90 88 102 98" fill="none" stroke="#14532d" stroke-width="4.5" stroke-linecap="round"/>
        <path d="M104 17 Q93 27 101 45 Q111 63 99 77 Q89 87 101 97" fill="none" stroke="#16a34a" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M103 18 Q94 26 100 44 Q109 62 98 76 Q92 86 100 96" fill="none" stroke="#86efac" stroke-width="1" stroke-linecap="round"/>
        <polygon points="107,26 114,22 102,20" fill="#22c55e" stroke="#14532d" stroke-width="0.8"/>
        <polygon points="96,44 88,40 96,54" fill="#22c55e" stroke="#14532d" stroke-width="0.8"/>
        <polygon points="108,66 116,70 104,74" fill="#22c55e" stroke="#14532d" stroke-width="0.8"/>
        <polygon points="100,88 94,92 98,102" fill="#22c55e" stroke="#14532d" stroke-width="0.8"/>
        <circle cx="92" cy="90" r="14" fill="#09090b" stroke="#3f3f46" stroke-width="2.5"/>
        <circle cx="92" cy="90" r="11.5" fill="#1e3a8a" stroke="#38bdf8" stroke-width="2"/>
        <circle cx="92" cy="90" r="9.5" fill="none" stroke="#60a5fa" stroke-width="1"/>
        <text x="92" y="95" text-anchor="middle" font-family="'Cinzel Decorative', serif" font-weight="900" font-size="13" fill="#bae6fd" stroke="#000" stroke-width="0.5">2</text>
    </svg>
`;

const HEALTH_BONE_ROD_SVG = `
    <svg viewBox="0 0 300 16" preserveAspectRatio="none" class="w-full h-full overflow-visible">
        <path d="M6 8 L294 8" stroke="#fef3c7" stroke-width="5" stroke-linecap="round"/>
        <path d="M6 7 L294 7" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
        <path d="M6 9 L294 9" stroke="#71717a" stroke-width="2" stroke-linecap="round"/>
        <circle cx="6" cy="8" r="4" fill="#fef3c7" stroke="#71717a" stroke-width="1"/>
        <circle cx="294" cy="8" r="4" fill="#fef3c7" stroke="#71717a" stroke-width="1"/>
        <path d="M12 4 Q25 14 40 4 Q55 14 70 4 Q90 14 110 4 Q135 14 160 4 Q185 14 210 4 Q235 14 260 4 Q280 14 292 6" fill="none" stroke="#16a34a" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M13 3 Q26 13 41 3 Q56 13 71 3 Q91 13 111 3 Q136 13 161 3 Q186 13 211 3 Q236 13 261 3 Q281 13 293 5" fill="none" stroke="#86efac" stroke-width="1" stroke-linecap="round"/>
        <polygon points="32,4 36,0 38,5" fill="#22c55e"/>
        <polygon points="98,12 102,16 104,11" fill="#22c55e"/>
        <polygon points="172,4 176,0 178,5" fill="#22c55e"/>
        <polygon points="242,12 246,16 248,11" fill="#22c55e"/>
    </svg>
`;

const CENTER_MEDALLION_SVG = `
    <svg viewBox="0 0 140 140" class="w-full h-full absolute inset-0 overflow-visible pointer-events-none">
        <defs>
            <linearGradient id="medStoneGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#4a4d5b"/>
                <stop offset="50%" stop-color="#22232c"/>
                <stop offset="100%" stop-color="#0f1015"/>
            </linearGradient>
        </defs>
        <g fill="url(#p1BoneGrad)" stroke="#52525b" stroke-width="0.8">
            <polygon points="70,0 63,16 77,16"/>
            <polygon points="40,8 37,24 49,18"/>
            <polygon points="100,8 91,18 103,24"/>
            <polygon points="16,30 22,42 32,34"/>
            <polygon points="124,30 108,34 118,42"/>
        </g>
        <circle cx="70" cy="65" r="48" fill="url(#medStoneGrad)" stroke="#5a5d6e" stroke-width="8"/>
        <circle cx="70" cy="65" r="48" fill="none" stroke="#8b8e9e" stroke-width="2"/>
        <circle cx="70" cy="65" r="40" fill="#0d0e12" stroke="#2a2c36" stroke-width="3"/>
        <path d="M26 52 C22 32 42 18 70 18 C98 18 118 32 114 52" fill="none" stroke="#14532d" stroke-width="3.5" stroke-linecap="round"/>
        <path d="M27 53 C23 33 43 19 70 19 C97 19 117 33 113 53" fill="none" stroke="#22c55e" stroke-width="1.8" stroke-linecap="round"/>
        <polygon points="42,21 48,16 46,25" fill="#4ade80"/>
        <polygon points="94,21 100,25 98,16" fill="#4ade80"/>
        <g transform="translate(70, 110)">
            <path d="M-18 -15 C-18 -28 18 -28 18 -15 C23 -6 22 6 15 14 L0 18 L-15 14 C-22 6 -23 -6 -18 -15 Z" fill="url(#p1BoneGrad)" stroke="#3f3f46" stroke-width="1.5"/>
            <ellipse cx="-8" cy="-8" rx="4.5" ry="5.5" fill="#09090b" stroke="#27272a" stroke-width="0.8"/>
            <ellipse cx="8" cy="-8" rx="4.5" ry="5.5" fill="#09090b" stroke="#27272a" stroke-width="0.8"/>
            <polygon points="0,-1 -3,6 3,6" fill="#09090b"/>
            <polygon points="-11,12 -9,18 -7,12" fill="#fff"/>
            <polygon points="-5,13 -3,19 -1,13" fill="#fff"/>
            <polygon points="1,13 3,19 5,13" fill="#fff"/>
            <polygon points="7,12 9,18 11,12" fill="#fff"/>
        </g>
    </svg>
`;

const COMBO_SPLATTER_SVG = `
    <svg viewBox="0 0 240 100" class="w-48 sm:w-60 md:w-72 h-auto overflow-visible filter drop-shadow-[0_6px_16px_rgba(0,0,0,0.98)]">
        <path d="M22 52 C8 38 30 18 56 32 C80 12 118 20 136 38 C166 18 204 28 226 54 C242 70 214 92 184 84 C152 96 104 92 74 76 C42 92 18 80 22 52 Z" fill="#1c0404" opacity="0.95"/>
        <path d="M30 55 C18 42 36 26 58 38 C82 22 112 28 128 44 C156 26 190 36 210 58 C222 70 200 85 174 78 C146 88 100 85 74 70 C46 84 26 75 30 55 Z" fill="#7f1d1d" opacity="0.92"/>
        <circle cx="12" cy="22" r="3.5" fill="#991b1b"/>
        <circle cx="32" cy="12" r="2.5" fill="#dc2626"/>
        <circle cx="8" cy="64" r="3" fill="#7f1d1d"/>
        <circle cx="232" cy="32" r="3.5" fill="#991b1b"/>
        <circle cx="218" cy="16" r="2.5" fill="#dc2626"/>
        <circle cx="236" cy="74" r="3" fill="#7f1d1d"/>
        <text id="hudComboText" x="114" y="64" text-anchor="middle" font-family="'Rubik Wet Paint', 'Permanent Marker', cursive" font-size="42" font-weight="900" fill="url(#comboGradientMain)" stroke="#000" stroke-width="5.5" paint-order="stroke fill" transform="rotate(-6 114 56)">
            COMBO x2
        </text>
        <defs>
            <linearGradient id="comboGradientMain" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#ffffff"/>
                <stop offset="25%" stop-color="#fef08a"/>
                <stop offset="60%" stop-color="#f59e0b"/>
                <stop offset="100%" stop-color="#dc2626"/>
            </linearGradient>
        </defs>
    </svg>
`;

const FRENZY_CORONA_SVG = `
    <svg viewBox="0 0 120 120" class="w-full h-full flame-spinner overflow-visible">
        <circle cx="60" cy="60" r="54" fill="none" stroke="#f59e0b" stroke-width="5" stroke-dasharray="18 10 26 8" stroke-linecap="round" opacity="0.95"/>
        <circle cx="60" cy="60" r="57" fill="none" stroke="#ef4444" stroke-width="3" stroke-dasharray="28 14 20 12" stroke-linecap="round" opacity="0.8"/>
        <circle cx="60" cy="60" r="50" fill="none" stroke="#fef08a" stroke-width="2.5" stroke-dasharray="14 8 20 10" opacity="0.9"/>
    </svg>
`;

const FRENZY_MAW_SVG = `
    <svg viewBox="0 0 64 64" class="w-9 h-9 sm:w-11 sm:h-11 drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]">
        <path d="M10 26 Q32 8 54 26 Q44 20 32 18 Q20 20 10 26 Z" fill="#fef3c7" stroke="#92400e" stroke-width="1.2"/>
        <polygon points="14,25 18,33 21,25" fill="#fff"/>
        <polygon points="22,24 26,34 30,24" fill="#fff"/>
        <polygon points="34,24 38,34 42,24" fill="#fff"/>
        <polygon points="43,25 47,33 50,25" fill="#fff"/>
        <path d="M12 38 Q32 56 52 38 Q44 44 32 46 Q20 44 12 38 Z" fill="#fef3c7" stroke="#92400e" stroke-width="1.2"/>
        <polygon points="16,39 20,31 23,39" fill="#fff"/>
        <polygon points="24,40 28,30 32,40" fill="#fff"/>
        <polygon points="33,40 37,30 41,40" fill="#fff"/>
        <polygon points="42,39 46,31 49,39" fill="#fff"/>
        <path d="M20 14 L38 50" stroke="#dc2626" stroke-width="3" stroke-linecap="round"/>
        <path d="M29 12 L47 48" stroke="#ef4444" stroke-width="3.5" stroke-linecap="round"/>
        <path d="M38 14 L56 50" stroke="#dc2626" stroke-width="3" stroke-linecap="round"/>
    </svg>
`;

let battleScreenRoot = null;

function buildBattleScreenUIKit() {
    // Quick Pause & AI Telemetry Toggle Buttons
    const topQuickBtns = new UIKit.Container({
        className: 'pointer-events-auto absolute top-2 right-2 flex items-center gap-1.5 z-30',
        flexDirection: 'row',
        alignItems: 'center',
        children: [
            new UIKit.Button({
                id: 'btnToggleAiTelemetry',
                className: 'px-2 py-1.5 rounded-lg bg-stone-900/85 hover:bg-stone-800 border border-cyan-600/70 hover:border-cyan-400 text-cyan-300 font-chakra text-xs font-black shadow-lg flex items-center gap-1 transition cursor-pointer backdrop-blur-sm active:scale-95',
                attrs: { title: 'Afficher/Masquer le Scanner Tactique IA (Yuka • XState • BehaviorTree • NavMesh)' },
                children: [
                    new UIKit.Text({ tag: 'span', text: '🧠', className: 'text-xs' }),
                    new UIKit.Text({ tag: 'span', text: 'IA HUD', className: 'hidden md:inline text-[10px] font-bold tracking-wider' })
                ]
            }),
            new UIKit.Button({
                id: 'btnHudPause',
                className: 'px-2.5 py-1.5 rounded-lg bg-stone-900/85 hover:bg-stone-800 border border-stone-600/80 hover:border-amber-400 text-stone-200 hover:text-amber-300 font-chakra text-xs font-black shadow-lg flex items-center gap-1.5 transition cursor-pointer backdrop-blur-sm active:scale-95',
                attrs: { title: 'Pause & Options (Échap / Start)' },
                children: [
                    new UIKit.Text({ tag: 'span', text: '⏸', className: 'text-sm' }),
                    new UIKit.Text({ tag: 'span', text: 'PAUSE', className: 'hidden sm:inline text-[11px] font-bold tracking-wider' })
                ]
            })
        ]
    });

    // Live AI Tactical Telemetry Panel
    const aiTelemetryPanel = new UIKit.Card({
        id: 'hudAiTelemetryPanel',
        className: 'hidden absolute top-12 right-2 z-20 pointer-events-none bg-slate-950/90 border border-cyan-500/60 rounded-xl px-2.5 py-1.5 text-[10px] font-chakra text-slate-200 shadow-2xl backdrop-blur-md min-w-[215px]',
        children: [
            new UIKit.Container({
                className: 'flex items-center justify-between border-b border-cyan-500/30 pb-0.5 mb-1',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                children: [
                    new UIKit.Text({ tag: 'span', text: '🧠 AI ENGINE TELEMETRY', className: 'font-black text-cyan-300 tracking-wider uppercase' }),
                    new UIKit.Badge({ id: 'hudAiMacroBadge', text: aiMacroBadgeSignal, className: 'px-1.5 py-0.2 rounded bg-cyan-900/80 text-amber-300 font-black text-[9px]' })
                ]
            }),
            new UIKit.Container({
                className: 'grid grid-cols-2 gap-x-2 gap-y-0.5 text-[9.5px]',
                children: [
                    new UIKit.Text({ tag: 'span', text: 'Yuka Steering:', className: 'text-stone-400' }),
                    new UIKit.Text({ id: 'hudAiSteeringVal', tag: 'span', text: aiSteeringValSignal, className: 'font-bold text-emerald-300 text-right' }),
                    new UIKit.Text({ tag: 'span', text: 'BehaviorTree:', className: 'text-stone-400' }),
                    new UIKit.Text({ id: 'hudAiBtNodeVal', tag: 'span', text: aiBtNodeValSignal, className: 'font-bold text-amber-200 text-right truncate' }),
                    new UIKit.Text({ tag: 'span', text: 'Nav SweetSpot:', className: 'text-stone-400' }),
                    new UIKit.Text({ id: 'hudAiSweetSpotVal', tag: 'span', text: aiSweetSpotValSignal, className: 'font-bold text-sky-300 text-right' }),
                    new UIKit.Text({ tag: 'span', text: 'Intent / Action:', className: 'text-stone-400' }),
                    new UIKit.Text({ id: 'hudAiIntentVal', tag: 'span', text: aiIntentValSignal, className: 'font-bold text-purple-300 text-right truncate' })
                ]
            })
        ]
    });

    // Camera & Pause Hint
    const cameraHint = new UIKit.Badge({
        text: '🖱️ Glisser : Caméra 3D • ÉCHAP / START : Pause',
        className: 'absolute top-11 right-2 z-10 pointer-events-none hidden sm:block text-[10px] text-stone-300/80 font-bold bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded border border-stone-800 shadow'
    });

    // Player 1 HUD (Left)
    const p1HudLeft = new UIKit.Container({
        className: 'flex-1 flex items-center justify-end gap-1 sm:gap-2.5',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        children: [
            new UIKit.Container({
                className: 'relative w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24 shrink-0',
                children: [
                    new UIKit.Svg({
                        className: 'w-full h-full absolute inset-0 z-10 pointer-events-none overflow-visible',
                        svg: P1_PORTRAIT_FRAME_SVG
                    }),
                    new UIKit.Container({
                        className: 'w-full h-full rounded-2xl overflow-hidden bg-gradient-to-b from-stone-900 via-stone-950 to-black p-1.5 flex items-center justify-center',
                        children: [
                            new UIKit.Container({
                                id: 'hudP1PortraitImg',
                                className: 'w-full h-full flex items-center justify-center overflow-hidden'
                            })
                        ]
                    })
                ]
            }),
            new UIKit.Container({
                className: 'flex-1 flex flex-col justify-center gap-1 min-w-0',
                flexDirection: 'column',
                justifyContent: 'center',
                children: [
                    new UIKit.Container({
                        className: 'flex items-center justify-between px-1',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        children: [
                            new UIKit.Container({
                                className: 'stone-plaque-title px-3 py-0.5 flex items-center gap-2',
                                flexDirection: 'row',
                                alignItems: 'center',
                                children: [
                                    new UIKit.Text({ id: 'hudP1Name', tag: 'span', text: hudP1NameSignal, className: 'font-cinzel text-xs sm:text-sm md:text-base font-black text-amber-200 tracking-wider' }),
                                    new UIKit.Container({ id: 'hudP1Rounds', className: 'flex gap-1 text-[11px] text-red-500' }),
                                    new UIKit.Container({ id: 'hudP1StatusBadges', className: 'flex items-center gap-1' })
                                ]
                            }),
                            new UIKit.Text({ id: 'hudP1HpText', tag: 'span', text: '100%', className: 'font-chakra text-xs sm:text-sm font-extrabold text-amber-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]' })
                        ]
                    }),
                    new UIKit.Container({
                        className: 'relative w-full pt-1.5',
                        children: [
                            new UIKit.Svg({
                                className: 'absolute top-[-4px] left-[-4px] right-[-4px] h-4 z-10 pointer-events-none',
                                svg: HEALTH_BONE_ROD_SVG
                            }),
                            new UIKit.Container({
                                className: 'w-full h-5 sm:h-6 md:h-7 stone-frame-heavy rounded-lg overflow-hidden relative p-0.5 bg-stone-950',
                                children: [
                                    new UIKit.Container({
                                        id: 'hudP1DamageBar',
                                        className: 'absolute top-0.5 left-0.5 bottom-0.5 damage-trail rounded transition-all duration-500',
                                        style: { width: '100%' }
                                    }),
                                    new UIKit.Container({
                                        id: 'hudP1HealthBar',
                                        className: 'absolute top-0.5 left-0.5 bottom-0.5 health-bar-molten rounded transition-all duration-100',
                                        style: { width: '100%' },
                                        children: [
                                            new UIKit.Container({ className: 'w-full h-[35%] bg-gradient-to-b from-white/60 to-transparent' })
                                        ]
                                    })
                                ]
                            })
                        ]
                    }),
                    new UIKit.Container({
                        className: 'w-full flex items-center gap-1.5',
                        flexDirection: 'row',
                        alignItems: 'center',
                        title: 'Endurance de Garde J1',
                        children: [
                            new UIKit.Text({
                                tag: 'span',
                                text: '🛡️',
                                className: 'text-[9px] leading-none opacity-85 shrink-0'
                            }),
                            new UIKit.Container({
                                className: 'flex-1 h-1.5 sm:h-2 rounded-full overflow-hidden bg-stone-950/95 border border-stone-700/80 relative shadow-inner',
                                children: [
                                    new UIKit.Container({
                                        id: 'hudP1GuardBar',
                                        className: 'h-full guard-bar-fill rounded-full transition-all duration-100',
                                        style: { width: '100%' }
                                    })
                                ]
                            })
                        ]
                    }),
                    new UIKit.Container({
                        className: 'w-full flex items-center gap-2',
                        flexDirection: 'row',
                        alignItems: 'center',
                        children: [
                            new UIKit.Container({
                                className: 'flex-1 h-2 sm:h-2.5 stone-frame-heavy rounded-full overflow-hidden p-0.2 bg-stone-950 relative',
                                children: [
                                    new UIKit.Container({
                                        id: 'hudP1RageBar',
                                        className: 'h-full fury-bar-cyan rounded-full transition-all duration-100',
                                        style: { width: '0%' }
                                    })
                                ]
                            }),
                            new UIKit.Badge({
                                id: 'hudP1RageBadge',
                                text: 'RAGE 0%',
                                className: 'text-[9px] font-black uppercase px-2 py-0.2 rounded bg-stone-900 text-cyan-300 border border-cyan-700 shrink-0 shadow'
                            })
                        ]
                    })
                ]
            })
        ]
    });

    // Center Medallion (Round & Timer)
    const centerMedallion = new UIKit.Container({
        className: 'relative flex flex-col items-center justify-center shrink-0 w-24 sm:w-28 md:w-34 z-20',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        children: [
            new UIKit.Container({
                className: 'relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 flex items-center justify-center',
                children: [
                    new UIKit.Svg({
                        className: 'w-full h-full absolute inset-0 overflow-visible pointer-events-none',
                        svg: CENTER_MEDALLION_SVG
                    }),
                    new UIKit.Container({
                        className: 'relative z-10 flex flex-col items-center justify-center -mt-3.5',
                        flexDirection: 'column',
                        alignItems: 'center',
                        children: [
                            new UIKit.Text({
                                id: 'hudRoundText',
                                tag: 'span',
                                text: hudRoundTextSignal,
                                className: 'font-cinzel text-[10px] sm:text-[11px] font-black text-amber-300 tracking-wider uppercase drop-shadow'
                            }),
                            new UIKit.Text({
                                id: 'hudTimer',
                                tag: 'div',
                                text: hudTimerTextSignal,
                                className: 'font-chakra text-lg sm:text-2xl md:text-3xl font-black text-amber-100 tracking-widest leading-none mt-0.5 drop-shadow-[0_0_12px_rgba(245,158,11,0.9)]'
                            })
                        ]
                    })
                ]
            })
        ]
    });

    // Player 2 HUD (Right)
    const p2HudRight = new UIKit.Container({
        className: 'flex-1 flex items-center justify-start gap-1 sm:gap-2.5',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        children: [
            new UIKit.Container({
                className: 'flex-1 flex flex-col justify-center gap-1 min-w-0',
                flexDirection: 'column',
                justifyContent: 'center',
                children: [
                    new UIKit.Container({
                        className: 'flex items-center justify-between px-1',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        children: [
                            new UIKit.Text({ id: 'hudP2HpText', tag: 'span', text: '100%', className: 'font-chakra text-xs sm:text-sm font-extrabold text-amber-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]' }),
                            new UIKit.Container({
                                className: 'stone-plaque-title px-3 py-0.5 flex items-center gap-2',
                                flexDirection: 'row',
                                alignItems: 'center',
                                children: [
                                    new UIKit.Container({ id: 'hudP2StatusBadges', className: 'flex items-center gap-1' }),
                                    new UIKit.Container({ id: 'hudP2Rounds', className: 'flex gap-1 text-[11px] text-blue-400' }),
                                    new UIKit.Text({ id: 'hudP2Name', tag: 'span', text: hudP2NameSignal, className: 'font-cinzel text-xs sm:text-sm md:text-base font-black text-amber-200 tracking-wider' })
                                ]
                            })
                        ]
                    }),
                    new UIKit.Container({
                        className: 'relative w-full pt-1.5',
                        children: [
                            new UIKit.Svg({
                                className: 'absolute top-[-4px] left-[-4px] right-[-4px] h-4 z-10 pointer-events-none',
                                svg: HEALTH_BONE_ROD_SVG
                            }),
                            new UIKit.Container({
                                className: 'w-full h-5 sm:h-6 md:h-7 stone-frame-heavy rounded-lg overflow-hidden relative p-0.5 bg-stone-950',
                                children: [
                                    new UIKit.Container({
                                        id: 'hudP2DamageBar',
                                        className: 'absolute top-0.5 right-0.5 bottom-0.5 damage-trail rounded transition-all duration-500',
                                        style: { width: '100%' }
                                    }),
                                    new UIKit.Container({
                                        id: 'hudP2HealthBar',
                                        className: 'absolute top-0.5 right-0.5 bottom-0.5 health-bar-molten rounded transition-all duration-100',
                                        style: { width: '100%' },
                                        children: [
                                            new UIKit.Container({ className: 'w-full h-[35%] bg-gradient-to-b from-white/60 to-transparent' })
                                        ]
                                    })
                                ]
                            })
                        ]
                    }),
                    new UIKit.Container({
                        className: 'w-full flex items-center gap-1.5 flex-row-reverse',
                        flexDirection: 'row-reverse',
                        alignItems: 'center',
                        title: 'Endurance de Garde J2',
                        children: [
                            new UIKit.Text({
                                tag: 'span',
                                text: '🛡️',
                                className: 'text-[9px] leading-none opacity-85 shrink-0'
                            }),
                            new UIKit.Container({
                                className: 'flex-1 h-1.5 sm:h-2 rounded-full overflow-hidden bg-stone-950/95 border border-stone-700/80 relative shadow-inner',
                                children: [
                                    new UIKit.Container({
                                        id: 'hudP2GuardBar',
                                        className: 'h-full guard-bar-fill ml-auto rounded-full transition-all duration-100',
                                        style: { width: '100%' }
                                    })
                                ]
                            })
                        ]
                    }),
                    new UIKit.Container({
                        className: 'w-full flex items-center gap-2 flex-row-reverse',
                        flexDirection: 'row-reverse',
                        alignItems: 'center',
                        children: [
                            new UIKit.Container({
                                className: 'flex-1 h-2 sm:h-2.5 stone-frame-heavy rounded-full overflow-hidden p-0.2 bg-stone-950 relative',
                                children: [
                                    new UIKit.Container({
                                        id: 'hudP2RageBar',
                                        className: 'h-full fury-bar-cyan ml-auto rounded-full transition-all duration-100',
                                        style: { width: '0%' }
                                    })
                                ]
                            }),
                            new UIKit.Badge({
                                id: 'hudP2RageBadge',
                                text: 'RAGE 0%',
                                className: 'text-[9px] font-black uppercase px-2 py-0.2 rounded bg-stone-900 text-cyan-300 border border-cyan-700 shrink-0 shadow'
                            })
                        ]
                    })
                ]
            }),
            new UIKit.Container({
                className: 'relative w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24 shrink-0',
                children: [
                    new UIKit.Svg({
                        className: 'w-full h-full absolute inset-0 z-10 pointer-events-none overflow-visible',
                        svg: P2_PORTRAIT_FRAME_SVG
                    }),
                    new UIKit.Container({
                        className: 'w-full h-full rounded-2xl overflow-hidden bg-gradient-to-b from-stone-900 via-stone-950 to-black p-1.5 flex items-center justify-center',
                        children: [
                            new UIKit.Container({
                                id: 'hudP2PortraitImg',
                                className: 'w-full h-full flex items-center justify-center overflow-hidden'
                            })
                        ]
                    })
                ]
            })
        ]
    });

    const topHudOverlay = new UIKit.Container({
        id: 'duelTopHudOverlay',
        className: 'absolute top-0 left-0 right-0 p-1.5 sm:p-2 md:p-3 z-10 pointer-events-none',
        children: [
            new UIKit.Container({
                className: 'flex items-center justify-between gap-1 sm:gap-2 max-w-7xl mx-auto w-full',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                children: [p1HudLeft, centerMedallion, p2HudRight]
            })
        ]
    });

    // Mid-Screen Overlays
    const comboContainer = new UIKit.Container({
        id: 'hudComboContainer',
        className: 'hidden absolute top-28 sm:top-36 left-4 sm:left-8 z-20 pointer-events-none transform -rotate-6 transition-all duration-150 flex flex-col items-start',
        children: [
            new UIKit.Svg({
                className: 'relative',
                svg: COMBO_SPLATTER_SVG
            }),
            new UIKit.Text({
                id: 'hudComboDmgText',
                tag: 'div',
                text: '',
                className: 'hidden combo-dmg-badge ml-6 -mt-3'
            })
        ]
    });

    const announcerOverlay = new UIKit.Container({
        id: 'announcerOverlay',
        className: 'absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20 px-4 text-center',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        children: [
            new UIKit.Text({
                id: 'announcerMain',
                tag: 'h2',
                text: announcerMainSignal,
                className: 'mk-banner text-3xl sm:text-6xl font-black uppercase tracking-widest text-amber-300 transition-transform duration-200'
            }),
            new UIKit.Text({
                id: 'announcerSub',
                tag: 'p',
                text: announcerSubSignal,
                className: 'font-chakra text-sm sm:text-xl font-extrabold uppercase tracking-widest text-red-400 mt-1 drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]'
            })
        ]
    });

    const superFlashOverlay = new UIKit.Container({
        id: 'superFlashOverlay',
        className: 'hidden super-flash-overlay absolute inset-0 pointer-events-none z-30 flex items-center justify-center overflow-hidden',
        children: [
            new UIKit.Container({
                className: 'super-flash-backdrop absolute inset-0'
            }),
            new UIKit.Container({
                className: 'super-flash-band relative w-full py-3 sm:py-5 px-4 sm:px-10 flex items-center justify-center overflow-hidden',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                children: [
                    new UIKit.Container({
                        className: 'super-flash-speedlines absolute inset-0 pointer-events-none'
                    }),
                    new UIKit.Container({
                        className: 'relative z-10 flex items-center justify-center gap-4 sm:gap-7 max-w-5xl w-full',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        children: [
                            new UIKit.Container({
                                className: 'super-flash-portrait-frame relative w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 shrink-0 overflow-hidden',
                                children: [
                                    new UIKit.Container({
                                        id: 'superFlashPortrait',
                                        className: 'w-full h-full flex items-center justify-center overflow-hidden bg-stone-950'
                                    })
                                ]
                            }),
                            new UIKit.Container({
                                className: 'flex flex-col items-start justify-center min-w-0',
                                flexDirection: 'column',
                                alignItems: 'flex-start',
                                justifyContent: 'center',
                                children: [
                                    new UIKit.Badge({
                                        id: 'superFlashBadge',
                                        text: '⚡ PRIMAL SUPER',
                                        className: 'super-flash-badge px-3 py-0.5 rounded font-chakra font-black text-[11px] sm:text-xs md:text-sm uppercase tracking-[0.22em] mb-1 shadow-lg'
                                    }),
                                    new UIKit.Text({
                                        id: 'superFlashTitle',
                                        tag: 'h2',
                                        text: 'PRIMAL SUPER',
                                        className: 'super-flash-title font-cinzel font-black text-2xl sm:text-4xl md:text-5xl uppercase tracking-wider leading-tight'
                                    }),
                                    new UIKit.Text({
                                        id: 'superFlashSubtitle',
                                        tag: 'p',
                                        text: '',
                                        className: 'super-flash-subtitle font-chakra font-extrabold text-xs sm:text-sm md:text-base uppercase tracking-[0.16em] text-amber-200/95 mt-0.5'
                                    })
                                ]
                            })
                        ]
                    })
                ]
            })
        ]
    });

    const damagePopupLayer = new UIKit.Container({
        id: 'damagePopupLayer',
        className: 'absolute inset-0 pointer-events-none z-10 overflow-hidden'
    });

    const battleCanvasEl = new UIKit.CustomContainer({
        id: 'battleCanvas',
        tag: 'canvas',
        className: 'w-full h-full cursor-grab active:cursor-grabbing'
    });

    // Bottom Arcade & Controls HUD
    const bottomLeftFrenzy = new UIKit.Container({
        className: 'flex items-center gap-2 sm:gap-3 pointer-events-auto filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] shrink-0',
        flexDirection: 'row',
        alignItems: 'center',
        children: [
            new UIKit.Container({
                id: 'hudFrenzyGauge',
                className: 'relative w-14 h-14 sm:w-18 sm:h-18 flex items-center justify-center cursor-pointer transform hover:scale-105 active:scale-95 transition-all',
                title: 'Cliquer pour déclencher le PRIMAL SUPER [R]',
                children: [
                    new UIKit.Svg({
                        id: 'hudFrenzyCorona',
                        className: 'absolute inset-0 rounded-full frenzy-active-surge pointer-events-none',
                        svg: FRENZY_CORONA_SVG
                    }),
                    new UIKit.Container({
                        className: 'w-12 h-12 sm:w-15 sm:h-15 rounded-full stone-frame-heavy flex items-center justify-center relative p-1 bg-gradient-to-br from-stone-800 via-stone-900 to-black',
                        children: [
                            new UIKit.Svg({
                                className: 'w-full h-full rounded-full bg-gradient-to-br from-red-600 via-red-900 to-black flex items-center justify-center relative overflow-hidden shadow-inner border border-red-500/70',
                                svg: FRENZY_MAW_SVG
                            })
                        ]
                    })
                ]
            }),
            new UIKit.Container({
                className: 'flex flex-col',
                flexDirection: 'column',
                children: [
                    new UIKit.Container({
                        id: 'hudFrenzyText',
                        className: 'frenzy-text-blood text-base sm:text-xl md:text-2xl font-black leading-tight uppercase',
                        innerHTML: 'PRIMAL<br>SUPER'
                    }),
                    new UIKit.Badge({
                        text: '[R / RT]',
                        className: 'text-[9px] text-amber-300 font-extrabold uppercase tracking-wider bg-black/75 backdrop-blur-sm px-1.5 py-0.2 rounded border border-amber-500/40'
                    })
                ]
            })
        ]
    });

    const bottomCenterDpad = new UIKit.Container({
        className: 'flex items-center gap-1 sm:gap-1.5 pointer-events-auto filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] shrink-0',
        flexDirection: 'row',
        alignItems: 'center',
        children: [
            new UIKit.Button({
                id: 'uiBtnLeft',
                dataset: { ctrl: 'left' },
                className: 'ctrl-btn stone-btn w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex flex-col items-center justify-center text-white font-black shadow backdrop-blur-sm',
                attrs: { title: 'Aller à Gauche' },
                children: [
                    new UIKit.Text({ tag: 'span', text: '◀', className: 'text-base leading-none' }),
                    new UIKit.Text({ tag: 'span', text: 'A / Q', className: 'text-[9px] text-stone-400' })
                ]
            }),
            new UIKit.Container({
                className: 'flex flex-col gap-1',
                flexDirection: 'column',
                children: [
                    new UIKit.Button({
                        id: 'uiBtnUp',
                        dataset: { ctrl: 'up' },
                        className: 'ctrl-btn stone-btn w-14 sm:w-16 h-8 sm:h-9 px-1 rounded-lg flex items-center justify-center gap-1 text-sky-300 font-black text-[9px] sm:text-[10px] shadow backdrop-blur-sm',
                        attrs: { title: 'Viser Haut (Frappe Haute / Garde Haute)' },
                        children: [
                            new UIKit.Text({ tag: 'span', text: '▲' }),
                            new UIKit.Text({ tag: 'span', text: 'HAUT [W]' })
                        ]
                    }),
                    new UIKit.Button({
                        id: 'uiBtnDown',
                        dataset: { ctrl: 'down' },
                        className: 'ctrl-btn stone-btn w-14 sm:w-16 h-8 sm:h-9 px-1 rounded-lg flex items-center justify-center gap-1 text-amber-300 font-black text-[9px] sm:text-[10px] shadow backdrop-blur-sm',
                        attrs: { title: 'Viser Bas (Frappe Basse / Garde Basse)' },
                        children: [
                            new UIKit.Text({ tag: 'span', text: '▼' }),
                            new UIKit.Text({ tag: 'span', text: 'BAS [S]' })
                        ]
                    })
                ]
            }),
            new UIKit.Button({
                id: 'uiBtnRight',
                dataset: { ctrl: 'right' },
                className: 'ctrl-btn stone-btn w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex flex-col items-center justify-center text-white font-black shadow backdrop-blur-sm',
                attrs: { title: 'Aller à Droite' },
                children: [
                    new UIKit.Text({ tag: 'span', text: '▶', className: 'text-base leading-none' }),
                    new UIKit.Text({ tag: 'span', text: 'D / ➡', className: 'text-[9px] text-stone-400' })
                ]
            }),
            new UIKit.Container({
                className: 'flex flex-col gap-1',
                flexDirection: 'column',
                children: [
                    new UIKit.Button({
                        id: 'uiBtnJump',
                        dataset: { action: 'jump' },
                        className: 'act-btn stone-btn px-2 h-8 sm:h-9 rounded-lg flex items-center justify-center gap-1 text-emerald-300 font-black text-[8.5px] sm:text-[9.5px] shadow border-emerald-500/60 backdrop-blur-sm',
                        attrs: { title: 'Sauter (Espace)' },
                        children: [
                            new UIKit.Text({ tag: 'span', text: '🦘' }),
                            new UIKit.Text({ tag: 'span', text: 'SAUT' })
                        ]
                    }),
                    new UIKit.Button({
                        id: 'uiBtnDash',
                        dataset: { action: 'dash' },
                        className: 'act-btn stone-btn px-2 h-8 sm:h-9 rounded-lg flex items-center justify-center gap-1 text-cyan-300 font-black text-[8.5px] sm:text-[9.5px] shadow border-cyan-500/60 backdrop-blur-sm',
                        attrs: { title: 'Dasher Droite & Gauche / Esquive (E / Double-tap ◀ ▶)' },
                        children: [
                            new UIKit.Text({ tag: 'span', text: '💨' }),
                            new UIKit.Text({ tag: 'span', text: 'DASH' })
                        ]
                    })
                ]
            })
        ]
    });

    const bottomRightActions = new UIKit.Container({
        className: 'flex flex-col items-end gap-1.5 pointer-events-auto filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] shrink-0',
        flexDirection: 'column',
        alignItems: 'flex-end',
        children: [
            // Status Buffs Row
            new UIKit.Container({
                className: 'flex items-center gap-1.5',
                flexDirection: 'row',
                alignItems: 'center',
                children: [
                    new UIKit.Svg({
                        className: 'status-badge w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center p-1 bg-emerald-950/80 border-emerald-500/70 shadow-md backdrop-blur-sm',
                        attrs: { title: "Bonus d'Attaque Primal" },
                        svg: `<svg viewBox="0 0 24 24" class="w-full h-full fill-emerald-400"><path d="M17 3 C10 3 4 8 4 15 C4 18 6 20 9 20 C16 20 21 14 21 7 L21 3 Z M17 5 C19 8 18 13 13 16 C10 18 7 18 6 16 C6 11 11 6 17 5 Z"/></svg>`
                    }),
                    new UIKit.Svg({
                        className: 'status-badge w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center p-1 bg-red-950/80 border-red-500/70 shadow-md backdrop-blur-sm',
                        attrs: { title: 'Saignement Viscéral' },
                        svg: `<svg viewBox="0 0 24 24" class="w-full h-full fill-red-500"><path d="M12 2 C12 2 6 10 6 14 C6 17.3 8.7 20 12 20 C15.3 20 18 17.3 18 14 C18 10 12 2 12 2 Z"/></svg>`
                    }),
                    new UIKit.Svg({
                        className: 'status-badge w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center p-1 bg-amber-950/80 border-amber-500/70 shadow-md backdrop-blur-sm',
                        attrs: { title: 'Blindage Ostéodermique' },
                        svg: `<svg viewBox="0 0 24 24" class="w-full h-full fill-amber-400"><path d="M12 2 L4 5 V11 C4 16.5 7.4 21.7 12 23 C16.6 21.7 20 16.5 20 11 V5 L12 2 Z"/></svg>`
                    })
                ]
            }),

            // Circular Action Medallions (5 Controls: Light, Heavy, Special, Guard, Primal Super)
            new UIKit.Container({
                className: 'flex items-center gap-1 sm:gap-1.5',
                flexDirection: 'row',
                alignItems: 'center',
                children: [
                    new UIKit.Button({
                        id: 'uiBtnStrike',
                        dataset: { action: 'strike' },
                        className: 'act-btn action-medallion w-11 h-11 sm:w-14 sm:h-14 rounded-full flex flex-col items-center justify-center relative border-amber-400 group p-1 shadow-xl backdrop-blur-sm',
                        title: 'Frappe Légère [F] (Haut, Avant, Neutre, Arrière, Bas, Aérien)',
                        children: [
                            new UIKit.Svg({
                                className: 'w-4 h-4 sm:w-5 sm:h-5',
                                svg: `<svg viewBox="0 0 24 24" class="w-full h-full fill-amber-300"><path d="M4 18 C6 20 10 20 14 18 C18 16 20 12 20 8 C18 6 14 6 10 8 C6 10 4 14 4 18 Z M8 12 L11 11 L10 14 Z M13 11 L16 10 L15 13 Z"/></svg>`
                            }),
                            new UIKit.Text({ tag: 'span', text: 'LÉGÈRE [F]', className: 'text-[6.5px] sm:text-[7.5px] font-black text-amber-200 leading-tight whitespace-nowrap' }),
                            new UIKit.Badge({ text: 'X', className: 'absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-stone-900 border border-amber-400 text-[9px] font-black text-amber-200 flex items-center justify-center shadow' })
                        ]
                    }),
                    new UIKit.Button({
                        id: 'uiBtnHeavy',
                        dataset: { action: 'heavy' },
                        className: 'act-btn action-medallion w-11 h-11 sm:w-14 sm:h-14 rounded-full flex flex-col items-center justify-center relative border-orange-500 group p-1 shadow-xl backdrop-blur-sm',
                        title: 'Frappe Lourde [G] (Neutre, Avant Bélier, Haut Anti-Air, Bas Balayage, Aérien)',
                        children: [
                            new UIKit.Svg({
                                className: 'w-4 h-4 sm:w-5 sm:h-5',
                                svg: `<svg viewBox="0 0 24 24" class="w-full h-full fill-orange-400"><path d="M13 2 L3 14 H11 L9 22 L21 10 H13 L15 2 Z"/></svg>`
                            }),
                            new UIKit.Text({ tag: 'span', text: 'LOURDE [G]', className: 'text-[6.5px] sm:text-[7.5px] font-black text-orange-200 leading-tight whitespace-nowrap' }),
                            new UIKit.Badge({ text: 'Y', className: 'absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-stone-900 border border-orange-400 text-[9px] font-black text-orange-300 flex items-center justify-center shadow' })
                        ]
                    }),
                    new UIKit.Button({
                        id: 'uiBtnSpecial',
                        dataset: { action: 'special' },
                        className: 'act-btn action-medallion w-11 h-11 sm:w-14 sm:h-14 rounded-full flex flex-col items-center justify-center relative group p-1 border-purple-400 shadow-xl backdrop-blur-sm',
                        title: 'Spécial 1 [H] / Spécial 2 [T ou Bas+H]',
                        children: [
                            new UIKit.Svg({
                                className: 'w-4 h-4 sm:w-5 sm:h-5',
                                svg: `<svg viewBox="0 0 24 24" class="w-full h-full fill-purple-400"><path d="M12 2 C8 7 6 10 6 14 C6 18.4 9.6 22 14 22 C18.4 22 22 18.4 22 14 C22 10 18 5 15 3 C15 6 13 8 11 8 C11 5 12 3 12 2 Z"/></svg>`
                            }),
                            new UIKit.Text({ id: 'uiBtnSpecialLabel', tag: 'span', text: 'SPÉCIAL [H]', className: 'text-[6.5px] sm:text-[7.5px] font-black text-purple-200 leading-tight whitespace-nowrap' }),
                            new UIKit.Badge({ text: 'B', className: 'absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-stone-900 border border-purple-400 text-[9px] font-black text-purple-300 flex items-center justify-center shadow' })
                        ]
                    }),
                    new UIKit.Button({
                        id: 'uiBtnGuard',
                        dataset: { action: 'guard' },
                        className: 'act-btn action-medallion w-11 h-11 sm:w-14 sm:h-14 rounded-full flex flex-col items-center justify-center relative group p-1 border-sky-400 shadow-xl backdrop-blur-sm',
                        title: 'Garde 3-Voies & Parade Parfaite [Shift] (Bloquer au dernier instant = 0 dégât, +15% Rage)',
                        children: [
                            new UIKit.Text({ tag: 'span', text: '🛡️', className: 'text-sm sm:text-base leading-none' }),
                            new UIKit.Text({ tag: 'span', text: 'GARDE [SHIFT]', className: 'text-[6px] sm:text-[7px] font-black text-sky-200 leading-tight whitespace-nowrap' }),
                            new UIKit.Badge({ text: 'LB', className: 'absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-stone-900 border border-sky-400 text-[8px] font-black text-sky-300 flex items-center justify-center shadow' })
                        ]
                    }),
                    new UIKit.Button({
                        id: 'btnRageSuper',
                        dataset: { action: 'super' },
                        className: 'act-btn action-medallion w-11 h-11 sm:w-14 sm:h-14 rounded-full flex flex-col items-center justify-center relative group p-1 border-red-500 shadow-2xl backdrop-blur-sm',
                        title: 'PRIMAL SUPER [R] (100% Rage — Combo-cancelable & Extinction Finish)',
                        children: [
                            new UIKit.Text({ tag: 'span', text: '⚡', className: 'text-sm sm:text-base leading-none text-amber-300' }),
                            new UIKit.Text({ tag: 'span', text: 'SUPER [R]', className: 'text-[6.5px] sm:text-[7.5px] font-black text-amber-200 leading-tight whitespace-nowrap' }),
                            new UIKit.Badge({ text: 'RT', className: 'absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-stone-900 border border-red-400 text-[8.5px] font-black text-red-300 flex items-center justify-center shadow' })
                        ]
                    })
                ]
            })
        ]
    });

    const bottomArcadeBar = new UIKit.Container({
        className: 'absolute bottom-2 sm:bottom-3 left-0 right-0 px-2 sm:px-4 z-20 pointer-events-none flex items-end justify-between gap-2',
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        children: [bottomLeftFrenzy, bottomCenterDpad, bottomRightActions]
    });

    const canvasWrapper = new UIKit.Container({
        className: 'w-full h-full flex-1 relative rounded-2xl overflow-hidden border-2 border-[#4f5263] shadow-2xl bg-black min-h-[360px]',
        children: [
            topQuickBtns,
            aiTelemetryPanel,
            cameraHint,
            topHudOverlay,
            comboContainer,
            announcerOverlay,
            superFlashOverlay,
            damagePopupLayer,
            battleCanvasEl,
            bottomArcadeBar
        ]
    });

    battleScreenRoot = new UIKit.Fullscreen({
        id: 'battleScreen',
        tag: 'section',
        className: 'hidden w-full h-full flex-1 relative min-h-0 select-none',
        children: [canvasWrapper]
    });

    battleScreenRoot.mount(document.getElementById('appMain'));

    if (typeof mountPostMatchMenu === 'function') {
        mountPostMatchMenu();
    }
}

buildBattleScreenUIKit();

const _arcadeBtnCache = {};
const _arcadeBtnState = {};

function flashArcadeButton(btnId, active) {
    const resolvedId = btnId === 'btnRageFatality' ? 'btnRageSuper' : btnId;
    const isPressed = !!active;
    if (_arcadeBtnState[resolvedId] === isPressed) return;
    _arcadeBtnState[resolvedId] = isPressed;
    const el = _arcadeBtnCache[resolvedId] || (_arcadeBtnCache[resolvedId] = document.getElementById(resolvedId));
    if (!el) return;
    el.classList.toggle('active-press', isPressed);
}

function showSuperFlashOverlay(attacker, spec, isExtinction = false) {
    const overlay = document.getElementById('superFlashOverlay');
    if (!overlay) return;

    const dino = attacker && attacker.dino ? attacker.dino : null;
    const resolvedSpec = spec || (dino && typeof getSuperSpec === 'function' ? getSuperSpec(dino.id) : null) || {};
    const speciesName = dino && dino.name ? dino.name : '';

    const portraitEl = document.getElementById('superFlashPortrait');
    if (portraitEl && dino) {
        const art = getHudPortrait(dino, attacker ? (attacker.skinIndex || 0) : 0);
        if (art && (art.startsWith('<svg') || art.startsWith('<div'))) {
            portraitEl.innerHTML = art;
        } else if (art) {
            const flipCls = (attacker && attacker.isP1 === false) ? ' -scale-x-100' : '';
            portraitEl.innerHTML = `<img src="${art}" alt="${speciesName}" class="w-full h-full object-cover${flipCls}" />`;
        } else {
            portraitEl.innerHTML = '';
        }
    }

    const badgeEl = document.getElementById('superFlashBadge');
    if (badgeEl) {
        const modeLabel = isExtinction ? '☢ EXTINCTION FINISH !' : '⚡ PRIMAL SUPER';
        badgeEl.textContent = speciesName ? `${modeLabel} • ${speciesName}` : modeLabel;
    }

    const titleEl = document.getElementById('superFlashTitle');
    if (titleEl) {
        const rawTitle = resolvedSpec.name || (dino && dino.fatalityName) || 'PRIMAL SUPER';
        titleEl.textContent = String(rawTitle).replace(/\s*\(R\)\s*$/i, '').toUpperCase();
    }

    const subEl = document.getElementById('superFlashSubtitle');
    if (subEl) {
        const rawSub = resolvedSpec.subtitle || (dino && dino.title) || '';
        subEl.textContent = rawSub;
    }

    if (overlay.style && typeof overlay.style.setProperty === 'function') {
        overlay.style.setProperty('--super-accent', resolvedSpec.cssColor || (isExtinction ? '#f59e0b' : '#ef4444'));
    }

    overlay.classList.remove('hidden', 'super-flash-active', 'extinction-finish-active');
    if (overlay.offsetWidth !== undefined) {
        void overlay.offsetWidth;
    }
    overlay.classList.add(isExtinction ? 'extinction-finish-active' : 'super-flash-active');
}

function hideSuperFlashOverlay() {
    const overlay = document.getElementById('superFlashOverlay');
    if (!overlay) return;
    overlay.classList.add('hidden');
    overlay.classList.remove('super-flash-active', 'extinction-finish-active');
}

if (typeof window !== 'undefined') {
    window.showSuperFlashOverlay = showSuperFlashOverlay;
    window.hideSuperFlashOverlay = hideSuperFlashOverlay;
}

function spawnFloatingPopup(worldX, text, colorHex = '#fde047') {
    const layer = document.getElementById('damagePopupLayer');
    if (!layer) return;

    const jitterX = (Math.random() - 0.5) * 6.5;
    const jitterY = (Math.random() - 0.5) * 7.0;
    const pctLeft = Math.max(10, Math.min(90, 50 + (worldX / 12) * 42 + jitterX));
    const startTop = Math.max(18, Math.min(44, 31 + jitterY));
    const endTop = Math.max(6, startTop - 13);

    const popupEl = new UIKit.Text({
        tag: 'div',
        text: text,
        className: 'mk-title absolute -translate-x-1/2 font-black text-base sm:text-2xl drop-shadow-[0_3px_4px_rgba(0,0,0,0.98)] transition-all duration-500 ease-out pointer-events-none whitespace-nowrap',
        style: {
            left: pctLeft.toFixed(1) + '%',
            top: startTop.toFixed(1) + '%',
            color: colorHex,
            transform: 'translate(-50%, 0) scale(1.12)'
        }
    });
    popupEl.mount(layer);
    const dom = popupEl.domElement;
    if (dom) {
        requestAnimationFrame(() => {
            dom.style.top = endTop.toFixed(1) + '%';
            dom.style.opacity = '0';
            dom.style.transform = 'translate(-50%, 0) scale(0.95)';
        });
        setTimeout(() => {
            popupEl.dispose();
            if (dom.parentNode) dom.parentNode.removeChild(dom);
        }, 560);
    }
}

let comboHideTimer = null;
function showComboHUD(count, totalDmg = 0) {
    const comboCont = document.getElementById('hudComboContainer');
    const comboText = document.getElementById('hudComboText');
    if (!comboCont || !comboText) return;

    comboText.textContent = `COMBO x${count}`;

    const comboDmgEl = document.getElementById('hudComboDmgText');
    if (comboDmgEl) {
        const dmgVal = Math.round(Number(totalDmg) || 0);
        if (dmgVal > 0) {
            comboDmgEl.textContent = `${dmgVal} DMG`;
            comboDmgEl.classList.remove('hidden');
        } else {
            comboDmgEl.textContent = '';
            comboDmgEl.classList.add('hidden');
        }
    }

    comboCont.classList.remove('hidden');
    comboCont.classList.remove('combo-pop-animate');
    void comboCont.offsetWidth;
    comboCont.classList.add('combo-pop-animate');

    if (comboHideTimer) clearTimeout(comboHideTimer);
    comboHideTimer = setTimeout(() => {
        hideComboHUD();
    }, 1600);
}

function hideComboHUD() {
    const comboCont = document.getElementById('hudComboContainer');
    if (comboCont) {
        comboCont.classList.add('hidden');
    }
    const comboDmgEl = document.getElementById('hudComboDmgText');
    if (comboDmgEl) {
        comboDmgEl.classList.add('hidden');
    }
}

function showAnnouncer(mainText, subText = '') {
    const showSubs = (typeof window === 'undefined' || window.subtitlesEnabled !== false);
    const effectiveSub = showSubs ? subText : '';
    announcerMainSignal.value = mainText;
    announcerSubSignal.value = effectiveSub;
    const mainEl = document.getElementById('announcerMain');
    const subEl = document.getElementById('announcerSub');
    if (mainEl) {
        mainEl.textContent = mainText;
        mainEl.style.transform = 'scale(1.25)';
        setTimeout(() => {
            if (mainEl) mainEl.style.transform = 'scale(1)';
        }, 180);
    }
    if (subEl) subEl.textContent = effectiveSub;
}

function clearAnnouncer() {
    announcerMainSignal.value = '';
    announcerSubSignal.value = '';
    const mainEl = document.getElementById('announcerMain');
    const subEl = document.getElementById('announcerSub');
    if (mainEl) mainEl.textContent = '';
    if (subEl) subEl.textContent = '';
}

function getHudPortrait(dino, skinIndex = 0) {
    if (!dino) return '';
    if (typeof getFighterPortraitUrl === 'function') {
        const url = getFighterPortraitUrl(dino.id);
        if (url) return url;
    }
    if (typeof getDino3DThumbnail === 'function') {
        const thumb = getDino3DThumbnail(dino, skinIndex);
        if (thumb) return thumb;
    }
    if (typeof FIGHTER_PORTRAITS !== 'undefined' && FIGHTER_PORTRAITS[dino.id]) {
        return FIGHTER_PORTRAITS[dino.id];
    }
    return `
        <svg viewBox="0 0 64 64" class="w-full h-full">
            <circle cx="32" cy="32" r="30" fill="${dino.cssPrimary || '#b91c1c'}"/>
            <text x="32" y="38" text-anchor="middle" font-family="'Cinzel Decorative', serif" font-weight="900" font-size="20" fill="#fef08a">${dino.name.substring(0, 2)}</text>
        </svg>
    `;
}

function updateHudPortraits() {
    if (!fighter1) return;
    const p1El = document.getElementById('hudP1PortraitImg');
    const p2El = document.getElementById('hudP2PortraitImg');

    if (p1El) {
        const p1Art = getHudPortrait(fighter1.dino, fighter1.skinIndex);
        if (p1Art.startsWith('<svg') || p1Art.startsWith('<div')) {
            p1El.innerHTML = p1Art;
        } else {
            p1El.innerHTML = `<img src="${p1Art}" alt="${fighter1.dino.name}" class="w-full h-full object-cover filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]" />`;
        }
    }

    if (p2El && fighter2) {
        const p2Art = getHudPortrait(fighter2.dino, fighter2.skinIndex);
        if (p2Art.startsWith('<svg') || p2Art.startsWith('<div')) {
            p2El.innerHTML = p2Art;
        } else {
            p2El.innerHTML = `<img src="${p2Art}" alt="${fighter2.dino.name}" class="w-full h-full object-cover filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)] -scale-x-100" />`;
        }
    }
}

function renderFighterStatusBadges(fighter) {
    if (!fighter) return '';
    let html = '';
    if (fighter.isBlocking && fighter.blockType && fighter.blockType !== 'none') {
        const gZoneLabel = fighter.blockType === 'high' ? 'HAUTE' : (fighter.blockType === 'low' ? 'BASSE' : 'MID');
        const gStam = Math.round(fighter.guardStamina !== undefined ? fighter.guardStamina : 100);
        html += `<span class="px-1 py-0.2 rounded bg-sky-950/90 text-sky-300 border border-sky-400/80 text-[8px] font-black" title="Garde directionnelle active">🛡️ ${gZoneLabel} ${gStam}%</span>`;
    }
    if (fighter.combatController) {
        const st = fighter.combatController.state;
        if (st === CombatState.KNOCKDOWN_FALL || st === CombatState.GROUNDED_IDLE) {
            html += `<span class="px-1 py-0.2 rounded bg-red-950/90 text-amber-300 border border-amber-500/80 text-[8px] font-black animate-pulse" title="Au sol (Knockdown)">💥 AU SOL</span>`;
        } else if (st === CombatState.WAKE_UP_STAND) {
            html += `<span class="px-1 py-0.2 rounded bg-cyan-950/90 text-cyan-300 border border-cyan-400 text-[8px] font-black" title="Relevé invulnérable">⬆️ RELEVÉ</span>`;
        } else if (st === CombatState.BLOCK_DEFLECTED) {
            html += `<span class="px-1 py-0.2 rounded bg-orange-950/90 text-orange-300 border border-orange-400 text-[8px] font-black" title="Attaque déviée">⚡ DÉVIÉ</span>`;
        }
    }
    if (fighter.staleMultiplier !== undefined && fighter.staleMultiplier < 1.0) {
        html += `<span class="px-1 py-0.2 rounded bg-zinc-900/90 text-amber-400 border border-amber-500/70 text-[8px] font-black" title="Pénalité Anti-Spam (Stale-Move)">⚠️ USURE ${Math.round(fighter.staleMultiplier * 100)}%</span>`;
    }
    if (fighter.bleedStacks > 0) {
        html += `<span class="px-1 py-0.2 rounded bg-red-950/90 text-red-400 border border-red-500/80 text-[8px] font-black animate-pulse" title="Saignement actif">🩸 ×${fighter.bleedStacks}</span>`;
    }
    if (fighter.poisonStacks > 0) {
        html += `<span class="px-1 py-0.2 rounded bg-emerald-950/90 text-emerald-400 border border-emerald-500/80 text-[8px] font-black animate-pulse" title="Neurotoxine active">🧪 ×${fighter.poisonStacks}</span>`;
    }
    if (fighter.atkPowerModTimer > 0) {
        html += `<span class="px-1 py-0.2 rounded bg-amber-950/90 text-amber-300 border border-amber-500/80 text-[8px] font-black" title="Attaque affaiblie">🦖 -25% ATQ</span>`;
    }
    if (fighter.hasHyperArmor) {
        html += `<span class="px-1 py-0.2 rounded bg-cyan-950/90 text-cyan-300 border border-cyan-400 text-[8px] font-black animate-pulse" title="Armure active">🛡️ ARMURE</span>`;
    }
    if (fighter.dino && (fighter.dino.id === 'quetzal' || fighter.dino.id === 'quetzalcoatlus')) {
        const end = fighter.flightEndurance !== undefined ? fighter.flightEndurance : 2.0;
        if (fighter.isFlying) {
            html += `<span class="px-1 py-0.2 rounded bg-sky-900/90 text-cyan-200 border border-cyan-400 text-[8px] font-black animate-pulse" title="Vol Stratosphérique actif">🪽 VOL ${end.toFixed(1)}s</span>`;
        } else if (end < 1.95) {
            html += `<span class="px-1 py-0.2 rounded bg-stone-900/90 text-amber-300 border border-amber-600/70 text-[8px] font-black" title="Recharge d'endurance de vol">⚡ VOL ${end.toFixed(1)}s</span>`;
        }
    }
    return html;
}

function updateGuardStaminaBar(barId, fighter) {
    const el = document.getElementById(barId);
    if (!el) return;
    const rawStam = (fighter && fighter.guardStamina !== undefined) ? Number(fighter.guardStamina) : 100;
    const stam = Math.max(0, Math.min(100, Number.isFinite(rawStam) ? rawStam : 100));
    el.style.width = stam + '%';
    el.classList.toggle('guard-low-pulse', stam < 30);
}

function updateBattleHUD() {
    if (!fighter1) return;
    const p1Pct = Math.max(0, Math.round((fighter1.hp / fighter1.maxHp) * 100));
    const p2Pct = fighter2 ? Math.max(0, Math.round((fighter2.hp / fighter2.maxHp) * 100)) : 0;
    const p1Guard = fighter1.guardStamina !== undefined ? fighter1.guardStamina : 100;
    const p2Guard = (fighter2 && fighter2.guardStamina !== undefined) ? fighter2.guardStamina : 100;

    UIKit.batch(() => {
        hudP1HpPctSignal.value = p1Pct;
        hudP2HpPctSignal.value = p2Pct;
        hudP1GuardSignal.value = p1Guard;
        hudP2GuardSignal.value = p2Guard;
        hudP1RageSignal.value = fighter1.rage;
        hudP2RageSignal.value = fighter2 ? fighter2.rage : 0;
    });

    const p1HealthEl = document.getElementById('hudP1HealthBar');
    if (p1HealthEl) p1HealthEl.style.width = p1Pct + '%';
    const p1DmgEl = document.getElementById('hudP1DamageBar');
    if (p1DmgEl) p1DmgEl.style.width = p1Pct + '%';
    const p1HpTextEl = document.getElementById('hudP1HpText');
    if (p1HpTextEl) p1HpTextEl.textContent = p1Pct + '%';

    const p2HealthEl = document.getElementById('hudP2HealthBar');
    if (p2HealthEl) p2HealthEl.style.width = p2Pct + '%';
    const p2DmgEl = document.getElementById('hudP2DamageBar');
    if (p2DmgEl) p2DmgEl.style.width = p2Pct + '%';
    const p2HpTextEl = document.getElementById('hudP2HpText');
    if (p2HpTextEl) p2HpTextEl.textContent = p2Pct + '%';

    updateGuardStaminaBar('hudP1GuardBar', fighter1);
    if (fighter2) updateGuardStaminaBar('hudP2GuardBar', fighter2);

    const p1RageEl = document.getElementById('hudP1RageBar');
    if (p1RageEl) p1RageEl.style.width = fighter1.rage + '%';
    const r1Badge = document.getElementById('hudP1RageBadge');
    if (r1Badge) {
        r1Badge.textContent = fighter1.rage >= 100 ? '⚡ SUPER PRÊT' : `RAGE ${Math.floor(fighter1.rage)}%`;
        r1Badge.className = fighter1.rage >= 100
            ? 'text-[9px] font-black uppercase px-2 py-0.2 rounded bg-red-600 text-amber-200 border border-amber-300 animate-pulse shadow'
            : 'text-[9px] font-black uppercase px-2 py-0.2 rounded bg-stone-900 text-cyan-300 border border-cyan-700 shadow';
    }

    const p2RageEl = document.getElementById('hudP2RageBar');
    if (p2RageEl && fighter2) p2RageEl.style.width = fighter2.rage + '%';
    const r2Badge = document.getElementById('hudP2RageBadge');
    if (r2Badge && fighter2) {
        r2Badge.textContent = fighter2.rage >= 100 ? '⚡ SUPER PRÊT' : `RAGE ${Math.floor(fighter2.rage)}%`;
        r2Badge.className = fighter2.rage >= 100
            ? 'text-[9px] font-black uppercase px-2 py-0.2 rounded bg-red-600 text-amber-200 border border-amber-300 animate-pulse shadow shrink-0'
            : 'text-[9px] font-black uppercase px-2 py-0.2 rounded bg-stone-900 text-cyan-300 border border-cyan-700 shrink-0 shadow';
    }

    const p1RoundsEl = document.getElementById('hudP1Rounds');
    if (p1RoundsEl) p1RoundsEl.innerHTML = '💀'.repeat(fighter1.roundsWon);
    const p2RoundsEl = document.getElementById('hudP2Rounds');
    if (p2RoundsEl && fighter2) p2RoundsEl.innerHTML = '💀'.repeat(fighter2.roundsWon);

    const frenzyCorona = document.getElementById('hudFrenzyCorona');
    const frenzyText = document.getElementById('hudFrenzyText');
    if (frenzyCorona && frenzyText) {
        if (fighter1.rage >= 100) {
            frenzyCorona.classList.add('frenzy-active-surge');
            frenzyCorona.style.opacity = '1';
            frenzyText.innerHTML = `SUPER<br>PRÊT !`;
            frenzyText.className = 'frenzy-text-blood text-lg sm:text-2xl font-black leading-tight uppercase animate-pulse';
        } else {
            frenzyCorona.classList.remove('frenzy-active-surge');
            frenzyCorona.style.opacity = Math.max(0.25, (fighter1.rage / 100)).toString();
            frenzyText.innerHTML = `RAGE<br>${Math.floor(fighter1.rage)}%`;
            frenzyText.className = 'frenzy-text-blood text-lg sm:text-2xl font-black leading-tight uppercase opacity-80';
        }
    }

    updateBattleHUDCooldowns();
    if (matchState === 'campaign_level' && typeof updateCampaignSmashHUD === 'function') {
        updateCampaignSmashHUD();
    }
}

function updateBattleHUDCooldowns() {
    if (!fighter1 || !fighter1.cooldowns) return;

    updateGuardStaminaBar('hudP1GuardBar', fighter1);
    if (fighter2) updateGuardStaminaBar('hudP2GuardBar', fighter2);

    const p1Badges = document.getElementById('hudP1StatusBadges');
    if (p1Badges) {
        const b1 = renderFighterStatusBadges(fighter1);
        if (p1Badges.innerHTML !== b1) p1Badges.innerHTML = b1;
    }
    const p2Badges = document.getElementById('hudP2StatusBadges');
    if (p2Badges && fighter2) {
        const b2 = renderFighterStatusBadges(fighter2);
        if (p2Badges.innerHTML !== b2) p2Badges.innerHTML = b2;
    }

    const cdSpecial = fighter1.cooldowns['special'] || 0;
    const btnSpecial = document.getElementById('uiBtnSpecial');
    if (btnSpecial) {
        const cdSpan = document.getElementById('uiBtnSpecialLabel') || btnSpecial.querySelector('span');
        if (cdSpecial > 0.05) {
            btnSpecial.classList.add('btn-on-cooldown');
            if (cdSpan) cdSpan.textContent = `${cdSpecial.toFixed(1)}s`;
        } else {
            if (btnSpecial.classList.contains('btn-on-cooldown')) {
                btnSpecial.classList.remove('btn-on-cooldown');
                btnSpecial.classList.add('cooldown-ready-flash');
                setTimeout(() => btnSpecial.classList.remove('cooldown-ready-flash'), 350);
            }
            if (cdSpan) cdSpan.textContent = 'SPÉCIAL [H]';
        }
    }

    const superBtn = document.getElementById('btnRageSuper');
    if (superBtn) {
        const rage = fighter1.rage || 0;
        if (rage < 100) {
            superBtn.classList.add('btn-rage-locked');
            superBtn.classList.remove('finish-pulse', 'border-amber-300', 'super-ready-medallion');
        } else {
            superBtn.classList.remove('btn-rage-locked');
            superBtn.classList.add('finish-pulse', 'border-amber-300', 'super-ready-medallion');
        }
    }

    if (window.aiTelemetryState && window.aiTelemetryState.enabled) {
        const t = window.aiTelemetryState;
        UIKit.batch(() => {
            aiMacroBadgeSignal.value = t.macroState || 'FOOTSIES';
            aiSteeringValSignal.value = `${t.steeringMode || 'ARRIVE'}${t.momentumBonusPct > 4 ? ` (+${t.momentumBonusPct}%)` : ''}`;
            aiBtNodeValSignal.value = t.btNode || 'Selector';
            aiSweetSpotValSignal.value = `X: ${t.sweetSpotX || '0.0'}m`;
            aiIntentValSignal.value = t.intent || 'IDLE';
        });
    }
}

function initBattleScreenMenu() {
    const frenzyGauge = document.getElementById('hudFrenzyGauge');
    if (frenzyGauge) {
        frenzyGauge.addEventListener('click', () => {
            if (fighter1 && ((fighter2 && matchState === 'fight') || matchState === 'campaign_level')) {
                triggerPlayerAction(fighter1, fighter2, 'super');
            }
        });
    }

    let lastTouchDirTap = { left: 0, right: 0 };
    document.querySelectorAll('.ctrl-btn').forEach(btn => {
        const dir = btn.dataset.ctrl;
        const startDir = (e) => {
            e.preventDefault();
            touchState[dir] = true;
            btn.classList.add('active-press');
            const now = performance.now();
            if (dir === 'left') {
                if (now - lastTouchDirTap.left < 300 && fighter1 && (matchState === 'fight' || matchState === 'campaign_level')) {
                    fighter1.startDash(-1);
                }
                lastTouchDirTap.left = now;
            } else if (dir === 'right') {
                if (now - lastTouchDirTap.right < 300 && fighter1 && (matchState === 'fight' || matchState === 'campaign_level')) {
                    fighter1.startDash(1);
                }
                lastTouchDirTap.right = now;
            }
        };
        const endDir = (e) => { e.preventDefault(); touchState[dir] = false; btn.classList.remove('active-press'); };
        btn.addEventListener('mousedown', startDir);
        btn.addEventListener('mouseup', endDir);
        btn.addEventListener('mouseleave', endDir);
        btn.addEventListener('touchstart', startDir, { passive: false });
        btn.addEventListener('touchend', endDir, { passive: false });
    });

    document.querySelectorAll('.act-btn').forEach(btn => {
        const act = btn.dataset.action;
        const trigger = (e) => {
            e.preventDefault();
            if (fighter1 && (fighter2 || matchState === 'campaign_level')) {
                triggerPlayerAction(fighter1, fighter2, act);
            }
        };
        btn.addEventListener('mousedown', trigger);
        btn.addEventListener('touchstart', trigger, { passive: false });
    });

    const hudPause = document.getElementById('btnHudPause');
    if (hudPause) {
        hudPause.addEventListener('click', (e) => {
            e.preventDefault();
            if (typeof togglePauseMenu === 'function') {
                togglePauseMenu();
            }
        });
    }

    const btnAiTel = document.getElementById('btnToggleAiTelemetry');
    const panelAiTel = document.getElementById('hudAiTelemetryPanel');
    if (btnAiTel && panelAiTel) {
        btnAiTel.addEventListener('click', (e) => {
            e.preventDefault();
            if (!window.aiTelemetryState) window.aiTelemetryState = { enabled: false };
            window.aiTelemetryState.enabled = !window.aiTelemetryState.enabled;
            panelAiTel.classList.toggle('hidden', !window.aiTelemetryState.enabled);
        });
    }
}
