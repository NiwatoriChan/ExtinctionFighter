/* ============================================================================
 * MENU : ÉCRAN DE COMBAT (HUD JURASSIQUE SUPRÊME : Cadres en pierre & os,
 *        cornes acérées, lianes tropicales, médaillon crâne T-Rex, barre de vie
 *        magmatique, jauge Frenzy circulaire et médaillons d'action arcade)
 * ============================================================================ */

function formatHudTimer(seconds) {
    const s = Math.max(0, Math.floor(seconds));
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

const BATTLE_SCREEN_HTML = `
        <!-- ==================== SCREEN 2: ARENA BATTLE ==================== -->
        <section id="battleScreen" class="hidden w-full h-full flex-1 relative min-h-0 select-none">
            <!-- Canvas Wrapper -->
            <div class="w-full h-full flex-1 relative rounded-2xl overflow-hidden border-2 border-[#4f5263] shadow-2xl bg-black min-h-[360px]">

                <!-- Quick Pause Button (Touch & Mouse) -->
                <button id="btnHudPause" class="pointer-events-auto absolute top-2 right-2 px-2.5 py-1.5 rounded-lg bg-stone-900/85 hover:bg-stone-800 border border-stone-600/80 hover:border-amber-400 text-stone-200 hover:text-amber-300 font-chakra text-xs font-black shadow-lg flex items-center gap-1.5 z-30 transition cursor-pointer backdrop-blur-sm active:scale-95" title="Pause & Options (Échap / Start)">
                    <span class="text-sm">⏸</span>
                    <span class="hidden sm:inline text-[11px] font-bold tracking-wider">PAUSE</span>
                </button>

                <!-- CAMERA & PAUSE HINT -->
                <div class="absolute top-11 right-2 z-20 pointer-events-none hidden sm:block text-[10px] text-stone-300/80 font-bold bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded border border-stone-800 shadow">
                    🖱️ Glisser : Caméra 3D • ÉCHAP / START : Pause
                </div>

                <!-- ================= TOP HUD OVERLAY ================= -->
                <div class="absolute top-0 left-0 right-0 p-1.5 sm:p-2 md:p-3 z-10 pointer-events-none">
                    <div class="flex items-center justify-between gap-1 sm:gap-2 max-w-7xl mx-auto w-full">

                        <!-- ================= PLAYER 1 HUD (LEFT) ================= -->
                        <div class="flex-1 flex items-center justify-end gap-1 sm:gap-2.5">
                            <!-- P1 Portrait in Stone & Bone Frame -->
                            <div class="relative w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24 shrink-0">
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

                                    <!-- Bone Horns -->
                                    <path d="M16 28 C10 14 4 4 1 0 C9 4 22 10 28 18 Z" fill="url(#p1BoneGrad)" stroke="#52525b" stroke-width="1"/>
                                    <path d="M94 28 C100 14 106 4 109 0 C101 4 88 10 82 18 Z" fill="url(#p1BoneGrad)" stroke="#52525b" stroke-width="1"/>
                                    <path d="M6 72 C0 62 2 48 0 42 C6 50 12 58 14 64 Z" fill="url(#p1BoneGrad)" stroke="#52525b" stroke-width="1"/>

                                    <!-- Stone Arch Frame -->
                                    <path d="M12 22 Q55 6 98 22 L98 90 Q55 102 12 90 Z" fill="none" stroke="url(#p1StoneGrad)" stroke-width="11"/>
                                    <path d="M12 22 Q55 6 98 22 L98 90 Q55 102 12 90 Z" fill="none" stroke="#71717a" stroke-width="2"/>
                                    <path d="M16 25 Q55 11 94 25 L94 87 Q55 97 16 87 Z" fill="none" stroke="#09090b" stroke-width="2"/>

                                    <!-- Lush Jungle Vines Twisting & Wrapping -->
                                    <path d="M5 16 Q18 28 8 46 Q-2 64 10 78 Q20 88 8 98" fill="none" stroke="#14532d" stroke-width="4.5" stroke-linecap="round"/>
                                    <path d="M6 17 Q17 27 9 45 Q-1 63 11 77 Q19 87 9 97" fill="none" stroke="#16a34a" stroke-width="2.5" stroke-linecap="round"/>
                                    <path d="M7 18 Q16 26 10 44 Q1 62 12 76 Q18 86 10 96" fill="none" stroke="#86efac" stroke-width="1" stroke-linecap="round"/>
                                    <!-- Broad Leaves -->
                                    <polygon points="3,26 -4,22 8,20" fill="#22c55e" stroke="#14532d" stroke-width="0.8"/>
                                    <polygon points="14,44 22,40 14,54" fill="#22c55e" stroke="#14532d" stroke-width="0.8"/>
                                    <polygon points="2,66 -6,70 6,74" fill="#22c55e" stroke="#14532d" stroke-width="0.8"/>
                                    <polygon points="10,88 16,92 12,102" fill="#22c55e" stroke="#14532d" stroke-width="0.8"/>

                                    <!-- Red P1 Circular Medallion at Bottom Left -->
                                    <circle cx="18" cy="90" r="14" fill="#09090b" stroke="#3f3f46" stroke-width="2.5"/>
                                    <circle cx="18" cy="90" r="11.5" fill="#991b1b" stroke="#f59e0b" stroke-width="2"/>
                                    <circle cx="18" cy="90" r="9.5" fill="none" stroke="#ef4444" stroke-width="1"/>
                                    <text x="18" y="95" text-anchor="middle" font-family="'Cinzel Decorative', serif" font-weight="900" font-size="13" fill="#fef08a" stroke="#000" stroke-width="0.5">1</text>
                                </svg>

                                <!-- Portrait Container -->
                                <div class="w-full h-full rounded-2xl overflow-hidden bg-gradient-to-b from-stone-900 via-stone-950 to-black p-1.5 flex items-center justify-center">
                                    <div id="hudP1PortraitImg" class="w-full h-full flex items-center justify-center overflow-hidden">
                                        <!-- Dynamic Avatar / Headshot -->
                                    </div>
                                </div>
                            </div>

                            <!-- P1 Bars & Name Column -->
                            <div class="flex-1 flex flex-col justify-center gap-1 min-w-0">
                                <!-- Top Row: Name Plaque & HP % -->
                                <div class="flex items-center justify-between px-1">
                                    <!-- Carved Stone Name Plaque -->
                                    <div class="stone-plaque-title px-3 py-0.5 flex items-center gap-2">
                                        <span id="hudP1Name" class="font-cinzel text-xs sm:text-sm md:text-base font-black text-amber-200 tracking-wider">T-REX</span>
                                        <div id="hudP1Rounds" class="flex gap-1 text-[11px] text-red-500"></div>
                                        <div id="hudP1StatusBadges" class="flex items-center gap-1"></div>
                                    </div>
                                    <span id="hudP1HpText" class="font-chakra text-xs sm:text-sm font-extrabold text-amber-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">100%</span>
                                </div>

                                <!-- Health Bar Container with Top Bone Beam & Jungle Vines -->
                                <div class="relative w-full pt-1.5">
                                    <!-- Sculpted Fossil Bone Rod with Wrapping Vines -->
                                    <div class="absolute top-[-4px] left-[-4px] right-[-4px] h-4 z-10 pointer-events-none">
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
                                    </div>

                                    <!-- Stone Carved Health Bar Trough -->
                                    <div class="w-full h-5 sm:h-6 md:h-7 stone-frame-heavy rounded-lg overflow-hidden relative p-0.5 bg-stone-950">
                                        <div id="hudP1DamageBar" class="absolute top-0.5 left-0.5 bottom-0.5 damage-trail rounded transition-all duration-500" style="width: 100%;"></div>
                                        <div id="hudP1HealthBar" class="absolute top-0.5 left-0.5 bottom-0.5 health-bar-molten rounded transition-all duration-100" style="width: 100%;">
                                            <div class="w-full h-[35%] bg-gradient-to-b from-white/60 to-transparent"></div>
                                        </div>
                                    </div>
                                </div>

                                <!-- P1 Cyan Fury / Rage Bar Inset Directly Underneath -->
                                <div class="w-full flex items-center gap-2">
                                    <div class="flex-1 h-2 sm:h-2.5 stone-frame-heavy rounded-full overflow-hidden p-0.2 bg-stone-950 relative">
                                        <div id="hudP1RageBar" class="h-full fury-bar-cyan rounded-full transition-all duration-100" style="width: 0%;"></div>
                                    </div>
                                    <span id="hudP1RageBadge" class="text-[9px] font-black uppercase px-2 py-0.2 rounded bg-stone-900 text-cyan-300 border border-cyan-700 shrink-0 shadow">RAGE 0%</span>
                                </div>
                            </div>
                        </div>


                        <!-- ================= CENTER MEDALLION (ROUND & TIMER) ================= -->
                        <div class="relative flex flex-col items-center justify-center shrink-0 w-24 sm:w-28 md:w-34 z-20">
                            <!-- Prehistoric Medallion SVG with Bone Horns & Raptor Skull -->
                            <div class="relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 flex items-center justify-center">
                                <svg viewBox="0 0 140 140" class="w-full h-full absolute inset-0 overflow-visible pointer-events-none">
                                    <defs>
                                        <linearGradient id="medStoneGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                            <stop offset="0%" stop-color="#4a4d5b"/>
                                            <stop offset="50%" stop-color="#22232c"/>
                                            <stop offset="100%" stop-color="#0f1015"/>
                                        </linearGradient>
                                    </defs>

                                    <!-- Bone Horns around upper rim -->
                                    <g fill="url(#p1BoneGrad)" stroke="#52525b" stroke-width="0.8">
                                        <polygon points="70,0 63,16 77,16"/>
                                        <polygon points="40,8 37,24 49,18"/>
                                        <polygon points="100,8 91,18 103,24"/>
                                        <polygon points="16,30 22,42 32,34"/>
                                        <polygon points="124,30 108,34 118,42"/>
                                    </g>

                                    <!-- Heavy Weathered Stone Ring -->
                                    <circle cx="70" cy="65" r="48" fill="url(#medStoneGrad)" stroke="#5a5d6e" stroke-width="8"/>
                                    <circle cx="70" cy="65" r="48" fill="none" stroke="#8b8e9e" stroke-width="2"/>
                                    <circle cx="70" cy="65" r="40" fill="#0d0e12" stroke="#2a2c36" stroke-width="3"/>

                                    <!-- Jungle Vines twining around medallion rim -->
                                    <path d="M26 52 C22 32 42 18 70 18 C98 18 118 32 114 52" fill="none" stroke="#14532d" stroke-width="3.5" stroke-linecap="round"/>
                                    <path d="M27 53 C23 33 43 19 70 19 C97 19 117 33 113 53" fill="none" stroke="#22c55e" stroke-width="1.8" stroke-linecap="round"/>
                                    <polygon points="42,21 48,16 46,25" fill="#4ade80"/>
                                    <polygon points="94,21 100,25 98,16" fill="#4ade80"/>

                                    <!-- Raptor Skull Sculpted at Bottom Center -->
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

                                <!-- Round Info & Digital Timer -->
                                <div class="relative z-10 flex flex-col items-center justify-center -mt-3.5">
                                    <span id="hudRoundText" class="font-cinzel text-[10px] sm:text-[11px] font-black text-amber-300 tracking-wider uppercase drop-shadow">ROUND 1</span>
                                    <div id="hudTimer" class="font-chakra text-lg sm:text-2xl md:text-3xl font-black text-amber-100 tracking-widest leading-none mt-0.5 drop-shadow-[0_0_12px_rgba(245,158,11,0.9)]">01:39</div>
                                </div>
                            </div>
                        </div>


                        <!-- ================= PLAYER 2 HUD (RIGHT) ================= -->
                        <div class="flex-1 flex items-center justify-start gap-1 sm:gap-2.5">
                            <!-- P2 Bars & Name Column -->
                            <div class="flex-1 flex flex-col justify-center gap-1 min-w-0">
                                <!-- Top Row: HP % & Name Plaque -->
                                <div class="flex items-center justify-between px-1">
                                    <span id="hudP2HpText" class="font-chakra text-xs sm:text-sm font-extrabold text-amber-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">100%</span>
                                    <!-- Carved Stone Name Plaque -->
                                    <div class="stone-plaque-title px-3 py-0.5 flex items-center gap-2">
                                        <div id="hudP2StatusBadges" class="flex items-center gap-1"></div>
                                        <div id="hudP2Rounds" class="flex gap-1 text-[11px] text-blue-400"></div>
                                        <span id="hudP2Name" class="font-cinzel text-xs sm:text-sm md:text-base font-black text-amber-200 tracking-wider">PACHYRHINOSAURE</span>
                                    </div>
                                </div>

                                <!-- Health Bar Container with Top Bone Beam & Jungle Vines -->
                                <div class="relative w-full pt-1.5">
                                    <!-- Sculpted Fossil Bone Rod with Wrapping Vines -->
                                    <div class="absolute top-[-4px] left-[-4px] right-[-4px] h-4 z-10 pointer-events-none">
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
                                    </div>

                                    <!-- Stone Carved Health Bar Trough (Depletes to Center/Right) -->
                                    <div class="w-full h-5 sm:h-6 md:h-7 stone-frame-heavy rounded-lg overflow-hidden relative p-0.5 bg-stone-950">
                                        <div id="hudP2DamageBar" class="absolute top-0.5 right-0.5 bottom-0.5 damage-trail rounded transition-all duration-500" style="width: 100%;"></div>
                                        <div id="hudP2HealthBar" class="absolute top-0.5 right-0.5 bottom-0.5 health-bar-molten rounded transition-all duration-100" style="width: 100%;">
                                            <div class="w-full h-[35%] bg-gradient-to-b from-white/60 to-transparent"></div>
                                        </div>
                                    </div>
                                </div>

                                <!-- P2 Cyan Fury / Rage Bar Inset Directly Underneath -->
                                <div class="w-full flex items-center gap-2 flex-row-reverse">
                                    <div class="flex-1 h-2 sm:h-2.5 stone-frame-heavy rounded-full overflow-hidden p-0.2 bg-stone-950 relative">
                                        <div id="hudP2RageBar" class="h-full fury-bar-cyan ml-auto rounded-full transition-all duration-100" style="width: 0%;"></div>
                                    </div>
                                    <span id="hudP2RageBadge" class="text-[9px] font-black uppercase px-2 py-0.2 rounded bg-stone-900 text-cyan-300 border border-cyan-700 shrink-0 shadow">RAGE 0%</span>
                                </div>
                            </div>

                            <!-- P2 Portrait in Stone & Bone Frame -->
                            <div class="relative w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24 shrink-0">
                                <svg viewBox="0 0 110 110" class="w-full h-full absolute inset-0 z-10 pointer-events-none overflow-visible">
                                    <!-- Bone Horns -->
                                    <path d="M16 28 C10 14 4 4 1 0 C9 4 22 10 28 18 Z" fill="url(#p1BoneGrad)" stroke="#52525b" stroke-width="1"/>
                                    <path d="M94 28 C100 14 106 4 109 0 C101 4 88 10 82 18 Z" fill="url(#p1BoneGrad)" stroke="#52525b" stroke-width="1"/>
                                    <path d="M104 72 C110 62 108 48 110 42 C104 50 98 58 96 64 Z" fill="url(#p1BoneGrad)" stroke="#52525b" stroke-width="1"/>

                                    <!-- Stone Arch Frame -->
                                    <path d="M12 22 Q55 6 98 22 L98 90 Q55 102 12 90 Z" fill="none" stroke="url(#p1StoneGrad)" stroke-width="11"/>
                                    <path d="M12 22 Q55 6 98 22 L98 90 Q55 102 12 90 Z" fill="none" stroke="#71717a" stroke-width="2"/>
                                    <path d="M16 25 Q55 11 94 25 L94 87 Q55 97 16 87 Z" fill="none" stroke="#09090b" stroke-width="2"/>

                                    <!-- Lush Jungle Vines on Right -->
                                    <path d="M105 16 Q92 28 102 46 Q112 64 100 78 Q90 88 102 98" fill="none" stroke="#14532d" stroke-width="4.5" stroke-linecap="round"/>
                                    <path d="M104 17 Q93 27 101 45 Q111 63 99 77 Q89 87 101 97" fill="none" stroke="#16a34a" stroke-width="2.5" stroke-linecap="round"/>
                                    <path d="M103 18 Q94 26 100 44 Q109 62 98 76 Q92 86 100 96" fill="none" stroke="#86efac" stroke-width="1" stroke-linecap="round"/>
                                    <polygon points="107,26 114,22 102,20" fill="#22c55e" stroke="#14532d" stroke-width="0.8"/>
                                    <polygon points="96,44 88,40 96,54" fill="#22c55e" stroke="#14532d" stroke-width="0.8"/>
                                    <polygon points="108,66 116,70 104,74" fill="#22c55e" stroke="#14532d" stroke-width="0.8"/>
                                    <polygon points="100,88 94,92 98,102" fill="#22c55e" stroke="#14532d" stroke-width="0.8"/>

                                    <!-- Blue P2 Circular Medallion at Bottom Right -->
                                    <circle cx="92" cy="90" r="14" fill="#09090b" stroke="#3f3f46" stroke-width="2.5"/>
                                    <circle cx="92" cy="90" r="11.5" fill="#1e3a8a" stroke="#38bdf8" stroke-width="2"/>
                                    <circle cx="92" cy="90" r="9.5" fill="none" stroke="#60a5fa" stroke-width="1"/>
                                    <text x="92" y="95" text-anchor="middle" font-family="'Cinzel Decorative', serif" font-weight="900" font-size="13" fill="#bae6fd" stroke="#000" stroke-width="0.5">2</text>
                                </svg>

                                <!-- Portrait Container -->
                                <div class="w-full h-full rounded-2xl overflow-hidden bg-gradient-to-b from-stone-900 via-stone-950 to-black p-1.5 flex items-center justify-center">
                                    <div id="hudP2PortraitImg" class="w-full h-full flex items-center justify-center overflow-hidden">
                                        <!-- Dynamic Avatar / Headshot -->
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                <!-- ================= MID-SCREEN COMBAT OVERLAYS ================= -->
                <!-- Dynamic COMBO xN Splatter Display (Mid-Left) -->
                <div id="hudComboContainer" class="hidden absolute top-28 sm:top-36 left-4 sm:left-8 z-20 pointer-events-none transform -rotate-6 transition-all duration-150">
                    <div class="relative">
                        <svg viewBox="0 0 240 100" class="w-48 sm:w-60 md:w-72 h-auto overflow-visible filter drop-shadow-[0_6px_16px_rgba(0,0,0,0.98)]">
                            <!-- Blood Splatter Silhouettes -->
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
                    </div>
                </div>

                <!-- CENTER ANNOUNCER BANNER -->
                <div id="announcerOverlay" class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20 px-4 text-center">
                    <h2 id="announcerMain" class="mk-banner text-3xl sm:text-6xl font-black uppercase tracking-widest text-amber-300 transition-transform duration-200">
                        ROUND 1
                    </h2>
                    <p id="announcerSub" class="font-chakra text-sm sm:text-xl font-extrabold uppercase tracking-widest text-red-400 mt-1 drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
                        PRÉPAREZ-VOUS AU COMBAT
                    </p>
                </div>

                <!-- X-RAY MEDICAL SCANNER OVERLAY -->
                <div id="xrayOverlayHud" class="hidden absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-4" style="background: radial-gradient(circle at center, rgba(6, 182, 212, 0.12) 0%, rgba(2, 6, 23, 0.88) 85%); box-shadow: inset 0 0 70px rgba(34, 211, 238, 0.55);">
                    <div class="mt-16 flex items-center justify-between border-b border-cyan-400/50 pb-1">
                        <div class="flex items-center gap-2">
                            <span class="px-2 py-0.5 rounded bg-cyan-500 text-slate-950 font-black text-xs uppercase tracking-widest animate-pulse">☢ SCANNER X-RAY ACTIF</span>
                            <span id="xrayTargetLabel" class="text-cyan-300 font-bold text-xs uppercase tracking-wider font-chakra">ANALYSE SQUELETTIQUE</span>
                        </div>
                        <span id="xrayPhaseCounter" class="text-amber-300 font-black text-xs uppercase tracking-widest font-chakra">PHASE 1 / 3</span>
                    </div>

                    <div class="my-auto flex flex-col items-center">
                        <div id="xrayAnatomyBanner" class="px-5 py-2 rounded-xl bg-slate-950/90 border-2 border-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.7)] text-center transform transition-all duration-150">
                            <div id="xrayBoneTitle" class="mk-title text-lg sm:text-2xl font-black text-cyan-300 tracking-wider">FRACTURE CRÂNIENNE</div>
                            <div id="xrayPsiDetail" class="text-xs font-extrabold text-red-400 uppercase tracking-widest font-chakra">TRAUMA INTERNE : 4 800 PSI • OS BROYÉ</div>
                        </div>
                    </div>
                </div>

                <!-- FINISH HIM / FATALITY INTERACTIVE PROMPT -->
                <div id="fatalityPromptBox" class="hidden absolute bottom-16 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
                    <button id="btnTriggerFatalityNow" class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-800 via-red-600 to-amber-500 text-white font-black text-sm sm:text-lg uppercase tracking-wider border-2 border-amber-300 shadow-2xl finish-pulse">
                        💀 EXÉCUTER LA FATALITÉ ! (Touche R)
                    </button>
                </div>

                <!-- 2D FLOATING DAMAGE / COMBO OVERLAY -->
                <div id="damagePopupLayer" class="absolute inset-0 pointer-events-none z-10 overflow-hidden"></div>

                <!-- MAIN 3D GAME CANVAS -->
                <canvas id="battleCanvas" class="w-full h-full cursor-grab active:cursor-grabbing"></canvas>

                <!-- ================= BOTTOM ARCADE & CONTROLS HUD (DIRECTLY OVER GAME) ================= -->
                <div class="absolute bottom-2 sm:bottom-3 left-0 right-0 px-2 sm:px-4 z-20 pointer-events-none flex items-end justify-between gap-2">

                    <!-- ================= BOTTOM-LEFT: FRENZY READY CIRCULAR WHEEL ================= -->
                    <div class="flex items-center gap-2 sm:gap-3 pointer-events-auto filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] shrink-0">
                        <div id="hudFrenzyGauge" class="relative w-14 h-14 sm:w-18 sm:h-18 flex items-center justify-center cursor-pointer transform hover:scale-105 active:scale-95 transition-all" title="Cliquer pour déclencher l'Attaque X-Ray / Fatalité">
                            <!-- Outer Flame Corona -->
                            <div id="hudFrenzyCorona" class="absolute inset-0 rounded-full frenzy-active-surge pointer-events-none">
                                <svg viewBox="0 0 120 120" class="w-full h-full flame-spinner overflow-visible">
                                    <circle cx="60" cy="60" r="54" fill="none" stroke="#f59e0b" stroke-width="5" stroke-dasharray="18 10 26 8" stroke-linecap="round" opacity="0.95"/>
                                    <circle cx="60" cy="60" r="57" fill="none" stroke="#ef4444" stroke-width="3" stroke-dasharray="28 14 20 12" stroke-linecap="round" opacity="0.8"/>
                                    <circle cx="60" cy="60" r="50" fill="none" stroke="#fef08a" stroke-width="2.5" stroke-dasharray="14 8 20 10" opacity="0.9"/>
                                </svg>
                            </div>

                            <!-- Heavy Stone Bezel -->
                            <div class="w-12 h-12 sm:w-15 sm:h-15 rounded-full stone-frame-heavy flex items-center justify-center relative p-1 bg-gradient-to-br from-stone-800 via-stone-900 to-black">
                                <div class="w-full h-full rounded-full bg-gradient-to-br from-red-600 via-red-900 to-black flex items-center justify-center relative overflow-hidden shadow-inner border border-red-500/70">
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
                                </div>
                            </div>
                        </div>

                        <!-- FRENZY READY Text -->
                        <div class="flex flex-col">
                            <div id="hudFrenzyText" class="frenzy-text-blood text-base sm:text-xl md:text-2xl font-black leading-tight uppercase">
                                FRENZY<br>READY
                            </div>
                            <span class="text-[9px] text-amber-300 font-extrabold uppercase tracking-wider bg-black/75 backdrop-blur-sm px-1.5 py-0.2 rounded border border-amber-500/40">
                                [R / ESPACE]
                            </span>
                        </div>
                    </div>

                    <!-- ================= CENTER D-PAD, JUMP & DASH CONTROLS ================= -->
                    <div class="flex items-center gap-1 sm:gap-1.5 pointer-events-auto filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] shrink-0">
                        <button id="uiBtnLeft" data-ctrl="left" class="ctrl-btn stone-btn w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex flex-col items-center justify-center text-white font-black shadow backdrop-blur-sm" title="Aller à Gauche">
                            <span class="text-base leading-none">◀</span>
                            <span class="text-[9px] text-stone-400">A / Q</span>
                        </button>
                        <div class="flex flex-col gap-1">
                            <button id="uiBtnUp" data-ctrl="up" class="ctrl-btn stone-btn w-14 sm:w-16 h-8 sm:h-9 px-1 rounded-lg flex items-center justify-center gap-1 text-sky-300 font-black text-[9px] sm:text-[10px] shadow backdrop-blur-sm" title="Viser Haut (Frappe Haute / Garde Haute)">
                                <span>▲</span>
                                <span>HAUT [W]</span>
                            </button>
                            <button id="uiBtnDown" data-ctrl="down" class="ctrl-btn stone-btn w-14 sm:w-16 h-8 sm:h-9 px-1 rounded-lg flex items-center justify-center gap-1 text-amber-300 font-black text-[9px] sm:text-[10px] shadow backdrop-blur-sm" title="Viser Bas (Frappe Basse / Garde Basse)">
                                <span>▼</span>
                                <span>BAS [S]</span>
                            </button>
                        </div>
                        <button id="uiBtnRight" data-ctrl="right" class="ctrl-btn stone-btn w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex flex-col items-center justify-center text-white font-black shadow backdrop-blur-sm" title="Aller à Droite">
                            <span class="text-base leading-none">▶</span>
                            <span class="text-[9px] text-stone-400">D / ➡</span>
                        </button>
                        <div class="flex flex-col gap-1">
                            <button id="uiBtnJump" data-action="jump" class="act-btn stone-btn px-2 h-8 sm:h-9 rounded-lg flex items-center justify-center gap-1 text-emerald-300 font-black text-[8.5px] sm:text-[9.5px] shadow border-emerald-500/60 backdrop-blur-sm" title="Sauter (Espace)">
                                <span>🦘</span>
                                <span>SAUT</span>
                            </button>
                            <button id="uiBtnDash" data-action="dash" class="act-btn stone-btn px-2 h-8 sm:h-9 rounded-lg flex items-center justify-center gap-1 text-cyan-300 font-black text-[8.5px] sm:text-[9.5px] shadow border-cyan-500/60 backdrop-blur-sm" title="Dasher / Esquive (E)">
                                <span>💨</span>
                                <span>DASH</span>
                            </button>
                        </div>
                    </div>

                    <!-- ================= BOTTOM-RIGHT: ACTIONS (FRAPPER, SPÉCIAL, PROTÉGER, RAGE) ================= -->
                    <div class="flex flex-col items-end gap-1.5 pointer-events-auto filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] shrink-0">
                        <!-- Status Buffs Row -->
                        <div class="flex items-center gap-1.5">
                            <div class="status-badge w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center p-1 bg-emerald-950/80 border-emerald-500/70 shadow-md backdrop-blur-sm" title="Bonus d'Attaque Primal">
                                <svg viewBox="0 0 24 24" class="w-full h-full fill-emerald-400">
                                    <path d="M17 3 C10 3 4 8 4 15 C4 18 6 20 9 20 C16 20 21 14 21 7 L21 3 Z M17 5 C19 8 18 13 13 16 C10 18 7 18 6 16 C6 11 11 6 17 5 Z"/>
                                </svg>
                            </div>
                            <div class="status-badge w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center p-1 bg-red-950/80 border-red-500/70 shadow-md backdrop-blur-sm" title="Saignement Viscéral">
                                <svg viewBox="0 0 24 24" class="w-full h-full fill-red-500">
                                    <path d="M12 2 C12 2 6 10 6 14 C6 17.3 8.7 20 12 20 C15.3 20 18 17.3 18 14 C18 10 12 2 12 2 Z"/>
                                </svg>
                            </div>
                            <div class="status-badge w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center p-1 bg-amber-950/80 border-amber-500/70 shadow-md backdrop-blur-sm" title="Blindage Ostéodermique">
                                <svg viewBox="0 0 24 24" class="w-full h-full fill-amber-400">
                                    <path d="M12 2 L4 5 V11 C4 16.5 7.4 21.7 12 23 C16.6 21.7 20 16.5 20 11 V5 L12 2 Z"/>
                                </svg>
                            </div>
                        </div>

                        <!-- Circular Action Medallions (4 Controls) -->
                        <div class="flex items-center gap-1.5 sm:gap-2">
                            <!-- 1. FRAPPER (Strike: Haut, Milieu, Bas selon direction) -->
                            <button id="uiBtnStrike" data-action="strike" class="act-btn action-medallion w-12 h-12 sm:w-14 sm:h-14 rounded-full flex flex-col items-center justify-center relative border-amber-400 group p-1.5 shadow-xl backdrop-blur-sm" title="Frapper (Haut, Milieu, Bas selon orientation)">
                                <svg viewBox="0 0 24 24" class="w-5 h-5 sm:w-6 sm:h-6 fill-amber-300">
                                    <path d="M4 18 C6 20 10 20 14 18 C18 16 20 12 20 8 C18 6 14 6 10 8 C6 10 4 14 4 18 Z M8 12 L11 11 L10 14 Z M13 11 L16 10 L15 13 Z"/>
                                </svg>
                                <span class="text-[7.5px] sm:text-[8px] font-black text-amber-200">FRAPPE [F]</span>
                                <div class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-stone-900 border border-amber-400 text-[9px] font-black text-amber-200 flex items-center justify-center shadow">
                                    X
                                </div>
                            </button>

                            <!-- 2. SPÉCIAL UNIQUE DE L'ANIMAL -->
                            <button id="uiBtnSpecial" data-action="special" class="act-btn action-medallion w-12 h-12 sm:w-14 sm:h-14 rounded-full flex flex-col items-center justify-center relative group p-1.5 border-purple-400 shadow-xl backdrop-blur-sm" title="Coup Spécial Unique de l'animal">
                                <svg viewBox="0 0 24 24" class="w-5 h-5 sm:w-6 sm:h-6 fill-purple-400">
                                    <path d="M12 2 C8 7 6 10 6 14 C6 18.4 9.6 22 14 22 C18.4 22 22 18.4 22 14 C22 10 18 5 15 3 C15 6 13 8 11 8 C11 5 12 3 12 2 Z"/>
                                </svg>
                                <span class="text-[7.5px] sm:text-[8px] font-black text-purple-200">SPÉCIAL [H]</span>
                                <div class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-stone-900 border border-purple-400 text-[9px] font-black text-purple-300 flex items-center justify-center shadow">
                                    Y
                                </div>
                            </button>

                            <!-- 3. PROTÉGER (ARMURE DIRECTIONNELLE HAUT, MILIEU, BAS) -->
                            <button id="uiBtnGuard" data-action="guard" class="act-btn action-medallion w-12 h-12 sm:w-14 sm:h-14 rounded-full flex flex-col items-center justify-center relative group p-1.5 border-sky-400 shadow-xl backdrop-blur-sm" title="Protéger (Armure 3D à l'endroit protégé)">
                                <span class="text-base sm:text-lg leading-none">🛡️</span>
                                <span class="text-[7.5px] sm:text-[8px] font-black text-sky-200">GARDE [S]</span>
                                <div class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-stone-900 border border-sky-400 text-[9px] font-black text-sky-300 flex items-center justify-center shadow">
                                    B
                                </div>
                            </button>

                            <!-- 4. SUPER ATTAQUE (RAGE 100%) -->
                            <button id="btnRageFatality" data-action="xray" class="act-btn action-medallion w-12 h-12 sm:w-14 sm:h-14 rounded-full flex flex-col items-center justify-center relative group p-1.5 border-red-500 shadow-2xl backdrop-blur-sm" title="Super Attaque X-Ray (Rage 100%)">
                                <span class="text-base leading-none">💀</span>
                                <span class="text-[7.5px] font-black text-amber-200">RAGE [R]</span>
                                <div class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-stone-900 border border-red-400 text-[9px] font-black text-red-300 flex items-center justify-center shadow">
                                    RT
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
`;
document.getElementById('appMain').insertAdjacentHTML('beforeend', BATTLE_SCREEN_HTML);

const _arcadeBtnCache = {};
const _arcadeBtnState = {};

function flashArcadeButton(btnId, active) {
    const isPressed = !!active;
    if (_arcadeBtnState[btnId] === isPressed) return;
    _arcadeBtnState[btnId] = isPressed;
    const el = _arcadeBtnCache[btnId] || (_arcadeBtnCache[btnId] = document.getElementById(btnId));
    if (!el) return;
    el.classList.toggle('active-press', isPressed);
}

function spawnFloatingPopup(worldX, text, colorHex = '#fde047') {
    const layer = document.getElementById('damagePopupLayer');
    if (!layer) return;
    const el = document.createElement('div');
    const pctLeft = Math.max(12, Math.min(88, 50 + (worldX / 12) * 42));
    el.style.left = pctLeft + '%';
    el.style.top = '32%';
    el.style.color = colorHex;
    el.className = 'mk-title absolute -translate-x-1/2 font-black text-base sm:text-2xl drop-shadow-[0_3px_3px_rgba(0,0,0,0.95)] transition-all duration-700';
    el.textContent = text;
    layer.appendChild(el);
    requestAnimationFrame(() => {
        el.style.top = '18%';
        el.style.opacity = '0';
    });
    setTimeout(() => el.remove(), 700);
}

let comboHideTimer = null;
function showComboHUD(count) {
    const comboCont = document.getElementById('hudComboContainer');
    const comboText = document.getElementById('hudComboText');
    if (!comboCont || !comboText) return;

    comboText.textContent = `COMBO x${count}`;
    comboCont.classList.remove('hidden');
    comboCont.classList.remove('combo-pop-animate');
    void comboCont.offsetWidth; // Trigger reflow
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
}

function showAnnouncer(mainText, subText = '') {
    const mainEl = document.getElementById('announcerMain');
    const subEl = document.getElementById('announcerSub');
    if (mainEl) {
        mainEl.textContent = mainText;
        mainEl.style.transform = 'scale(1.25)';
        setTimeout(() => {
            if (mainEl) mainEl.style.transform = 'scale(1)';
        }, 180);
    }
    if (subEl) subEl.textContent = subText;
}

function clearAnnouncer() {
    const mainEl = document.getElementById('announcerMain');
    const subEl = document.getElementById('announcerSub');
    if (mainEl) mainEl.textContent = '';
    if (subEl) subEl.textContent = '';
}

// Récupérateur d'avatar ou portrait détaillé pour le cadre en pierre du HUD
function getHudPortrait(dino, skinIndex = 0) {
    if (!dino) return '';
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
    if (!fighter1 || !fighter2) return;
    const p1El = document.getElementById('hudP1PortraitImg');
    const p2El = document.getElementById('hudP2PortraitImg');

    if (p1El) {
        const p1Art = getHudPortrait(fighter1.dino, fighter1.skinIndex);
        if (p1Art.startsWith('<svg') || p1Art.startsWith('<div')) {
            p1El.innerHTML = p1Art;
        } else {
            p1El.innerHTML = `<img src="${p1Art}" alt="${fighter1.dino.name}" class="w-full h-full object-contain filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)] transform scale-110" />`;
        }
    }

    if (p2El) {
        const p2Art = getHudPortrait(fighter2.dino, fighter2.skinIndex);
        if (p2Art.startsWith('<svg') || p2Art.startsWith('<div')) {
            p2El.innerHTML = p2Art;
        } else {
            p2El.innerHTML = `<img src="${p2Art}" alt="${fighter2.dino.name}" class="w-full h-full object-contain filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)] transform scale-110 -scale-x-100" />`;
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
    return html;
}

// MISE À JOUR DU HUD HTML & RENDU CAMÉRA 3D DYNAMIQUE
function updateBattleHUD() {
    if (!fighter1 || !fighter2) return;
    const p1Pct = Math.max(0, Math.round((fighter1.hp / fighter1.maxHp) * 100));
    const p2Pct = Math.max(0, Math.round((fighter2.hp / fighter2.maxHp) * 100));

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

    const p1RageEl = document.getElementById('hudP1RageBar');
    if (p1RageEl) p1RageEl.style.width = fighter1.rage + '%';
    const r1Badge = document.getElementById('hudP1RageBadge');
    if (r1Badge) {
        r1Badge.textContent = fighter1.rage >= 100 ? '💀 FRENZY 100%' : `RAGE ${Math.floor(fighter1.rage)}%`;
        r1Badge.className = fighter1.rage >= 100
            ? 'text-[9px] font-black uppercase px-2 py-0.2 rounded bg-red-600 text-white border border-amber-300 animate-pulse shadow'
            : 'text-[9px] font-black uppercase px-2 py-0.2 rounded bg-stone-900 text-cyan-300 border border-cyan-700 shadow';
    }

    const p2RageEl = document.getElementById('hudP2RageBar');
    if (p2RageEl) p2RageEl.style.width = fighter2.rage + '%';
    const r2Badge = document.getElementById('hudP2RageBadge');
    if (r2Badge) {
        r2Badge.textContent = fighter2.rage >= 100 ? '💀 X-RAY PRÊT' : `RAGE ${Math.floor(fighter2.rage)}%`;
    }

    const p1RoundsEl = document.getElementById('hudP1Rounds');
    if (p1RoundsEl) p1RoundsEl.innerHTML = '💀'.repeat(fighter1.roundsWon);
    const p2RoundsEl = document.getElementById('hudP2Rounds');
    if (p2RoundsEl) p2RoundsEl.innerHTML = '💀'.repeat(fighter2.roundsWon);

    // Update Bottom-Left Frenzy Wheel State
    const frenzyCorona = document.getElementById('hudFrenzyCorona');
    const frenzyText = document.getElementById('hudFrenzyText');
    if (frenzyCorona && frenzyText) {
        if (fighter1.rage >= 100) {
            frenzyCorona.classList.add('frenzy-active-surge');
            frenzyCorona.style.opacity = '1';
            frenzyText.innerHTML = `FRENZY<br>READY`;
            frenzyText.className = 'frenzy-text-blood text-lg sm:text-2xl font-black leading-tight uppercase animate-pulse';
        } else {
            frenzyCorona.classList.remove('frenzy-active-surge');
            frenzyCorona.style.opacity = Math.max(0.25, (fighter1.rage / 100)).toString();
            frenzyText.innerHTML = `FRENZY<br>${Math.floor(fighter1.rage)}%`;
            frenzyText.className = 'frenzy-text-blood text-lg sm:text-2xl font-black leading-tight uppercase opacity-80';
        }
    }

    updateBattleHUDCooldowns();
}

function updateBattleHUDCooldowns() {
    if (!fighter1 || !fighter1.cooldowns) return;

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

    // Seules les attaques Spéciale 1 et Ultra 2 disposent d'un temps de recharge
    const cdSpecial = fighter1.cooldowns['special'] || 0;
    const btnSpecial = document.getElementById('uiBtnSpecial');
    if (btnSpecial) {
        if (cdSpecial > 0.05) {
            btnSpecial.classList.add('btn-on-cooldown');
            const cdSpan = btnSpecial.querySelector('span');
            if (cdSpan) cdSpan.textContent = `${cdSpecial.toFixed(1)}s`;
        } else {
            if (btnSpecial.classList.contains('btn-on-cooldown')) {
                btnSpecial.classList.remove('btn-on-cooldown');
                btnSpecial.classList.add('cooldown-ready-flash');
                setTimeout(() => btnSpecial.classList.remove('cooldown-ready-flash'), 350);
            }
            const cdSpan = btnSpecial.querySelector('span');
            if (cdSpan) cdSpan.textContent = 'SPÉCIAL [H]';
        }
    }

    // Bouton X-Ray / Fatalité
    const xrayBtn = document.getElementById('btnRageFatality');
    if (xrayBtn) {
        const xrayCd = (fighter1.cooldowns && fighter1.cooldowns['xray']) || 0;
        const rage = fighter1.rage || 0;

        if (rage < 100) {
            xrayBtn.classList.add('btn-rage-locked');
            xrayBtn.classList.remove('finish-pulse', 'border-amber-300');
        } else if (xrayCd > 0.05) {
            xrayBtn.classList.remove('btn-rage-locked', 'finish-pulse');
        } else {
            xrayBtn.classList.remove('btn-rage-locked');
            xrayBtn.classList.add('finish-pulse', 'border-amber-300');
        }
    }
}

function initBattleScreenMenu() {
    document.getElementById('btnTriggerFatalityNow').addEventListener('click', () => {
        if (matchState === 'finish_him' && fighter1 && fighter2) {
            const winner = fighter1.roundsWon >= 2 ? fighter1 : fighter2;
            const loser = winner === fighter1 ? fighter2 : fighter1;
            executeUnique3DFatality(winner, loser);
        }
    });

    // Clic direct sur la jauge FRENZY READY en bas à gauche
    const frenzyGauge = document.getElementById('hudFrenzyGauge');
    if (frenzyGauge) {
        frenzyGauge.addEventListener('click', () => {
            if (fighter1 && fighter2 && matchState === 'fight') {
                triggerPlayerAction(fighter1, fighter2, 'xray');
            }
        });
    }

    document.querySelectorAll('.ctrl-btn').forEach(btn => {
        const dir = btn.dataset.ctrl;
        const startDir = (e) => { e.preventDefault(); touchState[dir] = true; btn.classList.add('active-press'); };
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
            if (fighter1 && fighter2) {
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
}
