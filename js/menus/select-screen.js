/* ============================================================================
 * MENU : ÉCRAN DE SÉLECTION DES COMBATTANTS
 * Design épuré, moderne et sans bordures massives.
 * Aperçus graphiques détaillés pour chaque combattant (au lieu des simples lettres).
 * Les options redondantes ont été retirées (accessibles via Paramètres et Menu Principal).
 * ============================================================================ */

// Aperçus vectoriels stylisés pour chacun des 13 combattants
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
            <!-- T-Rex Head Profile -->
            <path d="M12 40 Q16 48 30 46 Q38 46 48 38 Q52 30 46 22 Q40 16 28 16 Q20 18 16 26 Z" fill="#b91c1c" stroke="#fca5a5" stroke-width="1"/>
            <!-- Mâchoire ouverte puissante -->
            <path d="M26 32 L46 32 L40 38 L26 36 Z" fill="#18181b"/>
            <!-- Dents tranchantes -->
            <polygon points="30,32 32,35 34,32" fill="#fef08a"/>
            <polygon points="35,32 37,35 39,32" fill="#fef08a"/>
            <polygon points="40,32 42,35 44,32" fill="#fef08a"/>
            <polygon points="32,36 34,33 36,36" fill="#fef08a"/>
            <polygon points="37,36 39,33 41,36" fill="#fef08a"/>
            <!-- Crêtes & Oeil rougeoyant -->
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
            <!-- Collerette crânienne à cornes -->
            <path d="M16 16 Q32 8 48 16 Q52 28 46 36 L32 48 L18 36 Q12 28 16 16 Z" fill="#0284c7" stroke="#bae6fd" stroke-width="1"/>
            <polygon points="20,14 24,8 26,14" fill="#e0f2fe"/>
            <polygon points="30,11 32,5 34,11" fill="#e0f2fe"/>
            <polygon points="38,14 40,8 44,14" fill="#e0f2fe"/>
            <!-- Bosse nasale renforcée -->
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
            <!-- Tête triangulaire blindée -->
            <polygon points="32,16 50,40 14,40" fill="#047857" stroke="#a7f3d0" stroke-width="1.2"/>
            <!-- Cornes jugales et occipitales -->
            <polygon points="14,38 6,34 16,32" fill="#d1fae5"/>
            <polygon points="50,38 58,34 48,32" fill="#d1fae5"/>
            <!-- Ostéodermes blindés -->
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
            <!-- Cou de titan sauropode ascendant -->
            <path d="M14 54 C18 36 28 22 42 16 L48 18 L50 24 L40 28 C30 36 26 46 24 54 Z" fill="#7c3aed" stroke="#ddd6fe" stroke-width="1.2"/>
            <!-- Tête fière -->
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
            <!-- Crâne hadrosaure bec de canard -->
            <path d="M16 38 Q22 20 38 18 Q50 18 52 26 Q50 32 40 34 L26 38 Z" fill="#0f766e" stroke="#99f6e4" stroke-width="1.2"/>
            <!-- Bec caractéristique -->
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
            <!-- Bec raptorial colossal crochu -->
            <path d="M18 42 L24 22 Q32 16 40 20 L48 24 Q54 34 46 44 L38 38 L28 42 Z" fill="#c2410c"/>
            <path d="M38 22 C48 24 56 32 46 46 C42 42 42 36 36 34 Z" fill="#ea580c" stroke="#ffedd5" stroke-width="1"/>
            <!-- Crête de plumes & oeil vif -->
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
            <!-- Mâchoire basse de crocodilien préhistorique -->
            <path d="M12 36 L24 24 L48 26 L52 34 L36 38 L14 42 Z" fill="#991b1b" stroke="#fca5a5" stroke-width="1"/>
            <!-- Crocs acérés visibles -->
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
            <!-- Voile dorsale majestueuse en éventail -->
            <path d="M14 44 C16 22 24 10 38 10 C46 12 50 20 48 44 Z" fill="#1d4ed8" stroke="#93c5fd" stroke-width="1"/>
            <path d="M22 44 L24 16 M30 44 L32 11 M38 44 L40 12 M44 44 L44 18" stroke="#60a5fa" stroke-width="1.2"/>
            <!-- Museau piscivore allongé -->
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
            <!-- Tête fine emplumée -->
            <path d="M16 42 Q24 22 36 24 Q42 26 40 34 L28 42 Z" fill="#047857"/>
            <circle cx="32" cy="27" r="1.8" fill="#fef08a"/>
            <!-- Les 3 griffes faucilles géantes légendaires -->
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
            <!-- Pince gauche et pince droite -->
            <path d="M14 36 C10 26 18 18 24 22 C20 28 18 34 14 36 Z" fill="#a855f7" stroke="#f0abfc" stroke-width="1"/>
            <path d="M50 36 C54 26 46 18 40 22 C44 28 46 34 50 36 Z" fill="#a855f7" stroke="#f0abfc" stroke-width="1"/>
            <!-- Corps articulé et dard venimeux recourbé -->
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
            <!-- Plaques dorsales pentagonales étagées -->
            <polygon points="20,34 16,18 24,14 28,26" fill="#ea580c" stroke="#fed7aa" stroke-width="1"/>
            <polygon points="32,32 28,12 38,8 42,22" fill="#c2410c" stroke="#fed7aa" stroke-width="1"/>
            <polygon points="44,36 40,20 48,16 52,28" fill="#ea580c" stroke="#fed7aa" stroke-width="1"/>
            <!-- Petite tête basse -->
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
            <!-- Crête aérodynamique & bec harpon immense -->
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
            <!-- Tête massive de paresseux géant & griffes courbées -->
            <circle cx="30" cy="30" r="14" fill="#92400e" stroke="#fde68a" stroke-width="1"/>
            <!-- Museau robuste -->
            <ellipse cx="36" cy="32" rx="7" ry="6" fill="#78350f"/>
            <circle cx="28" cy="26" r="2" fill="#fef08a"/>
            <!-- Griffe imposante recourbée vers l'avant -->
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
            <!-- Tête féline puissante de Smilodon -->
            <path d="M14 42 Q16 24 28 20 Q40 18 46 26 Q52 36 42 46 Q32 48 20 46 Z" fill="#b45309" stroke="#fde68a" stroke-width="1"/>
            <!-- Oreille féline pointue -->
            <polygon points="26,20 28,10 34,18" fill="#78350f" stroke="#fde68a" stroke-width="0.8"/>
            <!-- Museau fauve musclé -->
            <path d="M36 26 Q46 28 48 36 L38 40 Z" fill="#78350f"/>
            <!-- Oeil perçant ambre -->
            <circle cx="34" cy="25" r="2.2" fill="#fef08a"/>
            <!-- Les 2 grandes canines sabres emblématiques courbées vers le bas -->
            <path d="M40 36 C42 46 38 53 35 57 C37 50 39 44 38 36 Z" fill="#fef08a" stroke="#d97706" stroke-width="0.8"/>
            <path d="M44 36 C46 47 42 54 39 58 C41 51 43 45 42 36 Z" fill="#ffffff" stroke="#d97706" stroke-width="0.8"/>
            <!-- Mâchoire inférieure avec bride mentonnière -->
            <path d="M30 40 L38 42 L34 47 L28 43 Z" fill="#92400e"/>
        </svg>
    `
};

const SELECT_SCREEN_HTML = `
        <!-- ==================== SCREEN 1: CHARACTER SELECT (IMAGE 2 HOMAGE) ==================== -->
        <section id="selectScreen" class="w-full h-full flex-1 flex flex-col justify-between p-2 sm:p-3 max-w-7xl mx-auto select-none relative z-10 overflow-hidden">
            
            <!-- Hanging Vines at top left and right (Image 2 ancient ruins ambiance) -->
            <div class="absolute -top-2 left-4 w-28 h-36 pointer-events-none opacity-40 z-0">
                <svg viewBox="0 0 100 130" class="w-full h-full drop-shadow">
                    <path d="M12 0 Q30 45 18 85 Q12 110 24 130" stroke="#15803d" stroke-width="3" fill="none"/>
                    <path d="M35 0 Q22 35 38 65 Q48 95 42 125" stroke="#16a34a" stroke-width="2" fill="none"/>
                    <circle cx="18" cy="55" r="4.5" fill="#15803d"/>
                    <circle cx="38" cy="85" r="5" fill="#22c55e"/>
                    <polygon points="18,52 28,48 24,58" fill="#15803d"/>
                    <polygon points="38,82 48,78 44,88" fill="#22c55e"/>
                </svg>
            </div>
            <div class="absolute -top-2 right-4 w-28 h-36 pointer-events-none opacity-40 z-0">
                <svg viewBox="0 0 100 130" class="w-full h-full drop-shadow">
                    <path d="M88 0 Q70 45 82 85 Q88 110 76 130" stroke="#15803d" stroke-width="3" fill="none"/>
                    <path d="M65 0 Q78 35 62 65 Q52 95 58 125" stroke="#16a34a" stroke-width="2" fill="none"/>
                    <circle cx="82" cy="55" r="4.5" fill="#15803d"/>
                    <circle cx="62" cy="85" r="5" fill="#22c55e"/>
                    <polygon points="82,52 72,48 76,58" fill="#15803d"/>
                    <polygon points="62,82 52,78 56,88" fill="#22c55e"/>
                </svg>
            </div>

            <!-- TOP HEADER (MATCHING IMAGE 2: PLAYER 1 | SELECT YOUR BEAST | PLAYER 2) -->
            <div class="w-full flex items-center justify-between px-2 sm:px-6 py-1 relative shrink-0">
                <!-- Left: PLAYER 1 -->
                <div class="flex flex-col items-start min-w-[120px]">
                    <span class="font-chakra font-black text-lg sm:text-2xl text-sky-400 uppercase tracking-widest drop-shadow-[0_0_12px_#38bdf8]">
                        PLAYER 1
                    </span>
                    <div class="w-28 sm:w-40 h-1 bg-gradient-to-r from-sky-400 to-transparent mt-0.5 shadow-[0_0_8px_#38bdf8]"></div>
                </div>

                <!-- Center: SELECT YOUR BEAST with dual glowing underlines -->
                <div class="flex flex-col items-center justify-center text-center">
                    <h1 class="beast-header-title text-xl sm:text-3xl md:text-4xl uppercase tracking-[0.2em]">
                        SELECT YOUR BEAST
                    </h1>
                    <div class="w-48 sm:w-72 beast-underline-bar mt-1"></div>
                    <div class="w-32 sm:w-48 beast-underline-bar mt-0.5 opacity-60"></div>
                </div>

                <!-- Right: PLAYER 2 / IA -->
                <div class="flex flex-col items-end min-w-[120px]">
                    <span id="p2HeaderLabel" class="font-chakra font-black text-lg sm:text-2xl text-red-500 uppercase tracking-widest drop-shadow-[0_0_12px_#ef4444]">
                        PLAYER 2
                    </span>
                    <div class="w-28 sm:w-40 h-1 bg-gradient-to-l from-red-500 to-transparent mt-0.5 shadow-[0_0_8px_#ef4444]"></div>
                </div>
            </div>

            <!-- THREE COLUMN ARENA SHOWCASE (P1 3D - CENTER 5-COL GRID - P2 3D) -->
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-2 sm:gap-3 items-stretch flex-1 min-h-0 my-auto">
                
                <!-- ================= LEFT COLUMN: P1 SHOWCASE ================= -->
                <div class="lg:col-span-3 flex flex-col justify-between gap-1 overflow-hidden">
                    <!-- 3D Pedestal Canvas Box -->
                    <div class="w-full flex-1 relative flex items-center justify-center overflow-hidden min-h-[220px]">
                        <canvas id="p1PreviewCanvas" class="w-full h-full block relative z-10"></canvas>
                        <img id="p1PreviewImg" alt="P1 3D Preview" class="w-full h-full object-contain pointer-events-none absolute inset-0 z-10" />
                        <!-- Skin Selector Pill -->
                        <div class="absolute bottom-1 left-1/2 -translate-x-1/2 flex items-center justify-center gap-1.5 bg-black/80 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-sky-400/40 text-[10px] text-sky-200 shadow-lg z-20">
                            <button id="btnP1PrevSkin" class="px-1 text-sky-400 hover:text-white font-black">&lt;</button>
                            <span id="p1SkinName" class="font-bold tracking-wide truncate max-w-[110px]">Skin: Primal</span>
                            <button id="btnP1NextSkin" class="px-1 text-sky-400 hover:text-white font-black">&gt;</button>
                        </div>
                    </div>

                    <!-- P1 Recessed Stone Stat Box (Image 2) -->
                    <div class="stone-panel rounded-xl p-2 sm:p-2.5 flex flex-col gap-1.5 shrink-0 border-sky-500/30">
                        <!-- Stat Rows -->
                        <div class="space-y-1">
                            <div class="flex items-center gap-2">
                                <span class="font-chakra font-black text-[10px] sm:text-[11px] text-stone-300 w-16 uppercase">ATTACK</span>
                                <div class="flex-1 stat-slot-trough"><div id="p1BarPow" class="stat-bar-cyan" style="width:95%"></div></div>
                            </div>
                            <div class="flex items-center gap-2">
                                <span class="font-chakra font-black text-[10px] sm:text-[11px] text-stone-300 w-16 uppercase">SPEED</span>
                                <div class="flex-1 stat-slot-trough"><div id="p1BarSpd" class="stat-bar-cyan" style="width:70%"></div></div>
                            </div>
                            <div class="flex items-center gap-2">
                                <span class="font-chakra font-black text-[10px] sm:text-[11px] text-stone-300 w-16 uppercase">DEFENSE</span>
                                <div class="flex-1 stat-slot-trough"><div id="p1BarDef" class="stat-bar-cyan" style="width:85%"></div></div>
                            </div>
                            <div class="flex items-center gap-2">
                                <span class="font-chakra font-black text-[10px] sm:text-[11px] text-stone-300 w-16 uppercase">RAGE</span>
                                <div class="flex-1 stat-slot-trough"><div id="p1BarRage" class="stat-bar-red" style="width:80%"></div></div>
                            </div>
                        </div>

                        <!-- Class & Special (Image 2) -->
                        <div class="pt-1 border-t border-stone-700/60 font-chakra text-[10px] sm:text-[11px] leading-tight">
                            <div class="text-amber-300/90 font-black tracking-wider uppercase">
                                CLASS: <span id="p1ClassText" class="text-amber-100 font-extrabold">APEX PREDATOR</span>
                            </div>
                            <div class="text-amber-300/90 font-black tracking-wider uppercase mt-0.5">
                                SPECIAL: <span id="p1SpecialText" class="text-amber-200 font-extrabold">CRUSHING BITE</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- ================= CENTER COLUMN: THE BEAST GRID (ROSTER) ================= -->
                <div class="lg:col-span-6 beast-grid-frame rounded-2xl p-2 sm:p-3 flex flex-col justify-between overflow-hidden relative">
                    <!-- Vine accents on corners -->
                    <div class="absolute -top-1 -left-1 w-8 h-8 pointer-events-none text-emerald-500">
                        <svg viewBox="0 0 32 32" class="w-full h-full"><path d="M0 0 Q16 4 28 20" fill="none" stroke="#22c55e" stroke-width="2.5"/><polygon points="12,2 18,8 10,10" fill="#16a34a"/></svg>
                    </div>
                    <div class="absolute -top-1 -right-1 w-8 h-8 pointer-events-none text-emerald-500">
                        <svg viewBox="0 0 32 32" class="w-full h-full"><path d="M32 0 Q16 4 4 20" fill="none" stroke="#22c55e" stroke-width="2.5"/><polygon points="20,2 14,8 22,10" fill="#16a34a"/></svg>
                    </div>

                    <!-- 5-Columns Grid of Dinosaur Cards (Image 2) -->
                    <div id="rosterGrid" class="grid grid-cols-4 sm:grid-cols-5 gap-1.5 sm:gap-2 my-auto flex-1 overflow-y-auto pr-0.5">
                        <!-- Populated by initRosterUI with beast-card elements -->
                    </div>

                    <!-- CTA Combat Button -->
                    <div class="mt-2 flex flex-col gap-1.5 shrink-0">
                        <div class="flex items-center justify-center gap-2">
                            <button id="btnSelectSlotP1" class="px-2.5 py-1 rounded bg-red-950/90 border border-sky-400 text-[10px] font-black text-sky-200 uppercase tracking-wider">
                                Choisir J1
                            </button>
                            <button id="btnSelectSlotP2" class="px-2.5 py-1 rounded bg-stone-900 border border-red-500 text-[10px] font-black text-red-300 uppercase tracking-wider">
                                Choisir J2
                            </button>
                            <button id="btnRandomFighters" class="px-2.5 py-1 rounded bg-stone-900 hover:bg-stone-800 border border-amber-500/50 text-[10px] font-black text-amber-300 uppercase tracking-wider flex items-center gap-1">
                                <span>🎲</span> <span>Aléatoire</span>
                            </button>
                        </div>

                        <button id="btnGoToArena" class="w-full py-2 sm:py-2.5 px-4 rounded-xl bg-gradient-to-r from-red-700 via-amber-600 to-red-700 hover:from-red-600 hover:to-amber-500 text-white font-black text-xs sm:text-sm uppercase tracking-widest shadow-xl border border-amber-400/60 finish-pulse flex items-center justify-center gap-2">
                            <span>CHOISIR L'ARÈNE DE KOMBAT</span>
                            <span class="text-base">➔</span>
                        </button>
                    </div>
                </div>

                <!-- ================= RIGHT COLUMN: P2 SHOWCASE ================= -->
                <div class="lg:col-span-3 flex flex-col justify-between gap-1 overflow-hidden">
                    <!-- 3D Pedestal Canvas Box -->
                    <div class="w-full flex-1 relative flex items-center justify-center overflow-hidden min-h-[220px]">
                        <canvas id="p2PreviewCanvas" class="w-full h-full block relative z-10"></canvas>
                        <img id="p2PreviewImg" alt="P2 3D Preview" class="w-full h-full object-contain pointer-events-none absolute inset-0 z-10" />
                        <!-- Skin Selector Pill -->
                        <div id="p2SkinSelector" class="absolute bottom-1 left-1/2 -translate-x-1/2 flex items-center justify-center gap-1.5 bg-black/80 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-red-500/40 text-[10px] text-red-200 shadow-lg z-20">
                            <button id="btnP2PrevSkin" class="px-1 text-red-400 hover:text-white font-black">&lt;</button>
                            <span id="p2SkinName" class="font-bold tracking-wide truncate max-w-[110px]">Skin: Primal</span>
                            <button id="btnP2NextSkin" class="px-1 text-red-400 hover:text-white font-black">&gt;</button>
                        </div>
                    </div>

                    <!-- P2 Recessed Stone Stat Box (Image 2) -->
                    <div class="stone-panel rounded-xl p-2 sm:p-2.5 flex flex-col gap-1.5 shrink-0 border-red-500/30">
                        <!-- Stat Rows -->
                        <div class="space-y-1">
                            <div class="flex items-center gap-2">
                                <span class="font-chakra font-black text-[10px] sm:text-[11px] text-stone-300 w-16 uppercase">ATTACK</span>
                                <div class="flex-1 stat-slot-trough"><div id="p2BarPow" class="stat-bar-fire" style="width:90%"></div></div>
                            </div>
                            <div class="flex items-center gap-2">
                                <span class="font-chakra font-black text-[10px] sm:text-[11px] text-stone-300 w-16 uppercase">SPEED</span>
                                <div class="flex-1 stat-slot-trough"><div id="p2BarSpd" class="stat-bar-red" style="width:55%"></div></div>
                            </div>
                            <div class="flex items-center gap-2">
                                <span class="font-chakra font-black text-[10px] sm:text-[11px] text-stone-300 w-16 uppercase">DEFENSE</span>
                                <div class="flex-1 stat-slot-trough"><div id="p2BarDef" class="stat-bar-fire" style="width:100%"></div></div>
                            </div>
                            <div class="flex items-center gap-2">
                                <span class="font-chakra font-black text-[10px] sm:text-[11px] text-stone-300 w-16 uppercase">RAGE</span>
                                <div class="flex-1 stat-slot-trough"><div id="p2BarRage" class="stat-bar-fire" style="width:75%"></div></div>
                            </div>
                        </div>

                        <!-- Class & Special (Image 2) -->
                        <div class="pt-1 border-t border-stone-700/60 font-chakra text-[10px] sm:text-[11px] leading-tight">
                            <div class="text-amber-300/90 font-black tracking-wider uppercase">
                                CLASS: <span id="p2ClassText" class="text-amber-100 font-extrabold">TANK</span>
                            </div>
                            <div class="text-amber-300/90 font-black tracking-wider uppercase mt-0.5">
                                SPECIAL: <span id="p2SpecialText" class="text-amber-200 font-extrabold">HORN CHARGE</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            <!-- BOTTOM CONTROLLER BAR (MATCHING IMAGE 2) -->
            <div class="w-full stone-panel rounded-xl px-4 py-1.5 flex flex-wrap items-center justify-between gap-2 text-xs z-30 shrink-0">
                <button id="btnSelectBackToMain" class="px-2.5 py-1 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 font-chakra text-xs font-bold flex items-center gap-1">
                    <span>←</span> <span>MENU</span>
                </button>

                <!-- Hints matching Image 2: P1 [A] CONFIRM | [B] BACK   P2 [X] RANDOM | [Y] SKINS -->
                <div class="flex items-center gap-4 sm:gap-6 font-chakra text-[11px] sm:text-xs font-black tracking-wider mx-auto">
                    <div class="flex items-center gap-1.5">
                        <span class="text-sky-400">P1</span>
                        <span class="px-1.5 py-0.2 rounded bg-emerald-600 text-white">[A]</span>
                        <span class="text-stone-300">CONFIRMER</span>
                        <span class="text-stone-600">|</span>
                        <span class="px-1.5 py-0.2 rounded bg-red-600 text-white">[B]</span>
                        <span class="text-stone-300">RETOUR</span>
                    </div>
                    <div class="flex items-center gap-1.5">
                        <span class="text-red-400">P2</span>
                        <span class="px-1.5 py-0.2 rounded bg-sky-600 text-white">[X]</span>
                        <span class="text-stone-300">ALÉATOIRE</span>
                        <span class="text-stone-600">|</span>
                        <span class="px-1.5 py-0.2 rounded bg-amber-600 text-white">[Y]</span>
                        <span class="text-stone-300">SKINS</span>
                    </div>
                </div>

                <div id="selectScreenModeBadge" class="text-[10px] sm:text-xs font-extrabold text-amber-400 tracking-wider uppercase">
                    JOUEUR VS IA
                </div>
            </div>
        </section>
`;

document.getElementById('appMain').insertAdjacentHTML('beforeend', SELECT_SCREEN_HTML);

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
        offscreen3DScene.add(rig.root);
        rig.root.rotation.y = -0.44; // Vue 3/4 profil héroïque montrant tête, corps, pattes et queue
        rig.root.updateMatrixWorld(true);

        animateDino3DRig({
            dino,
            rig,
            action: 'idle',
            actionDuration: 0,
            hitStun: 0,
            isBlocking: false
        }, 0.5, 0.016);
        rig.root.updateMatrixWorld(true);

        // Focalisation sur le visage : le modèle prend une place majeure, le surplus dépasse
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

// Aperçus 3D pour P1 et P2 dans le menu de sélection (idling libre sans boîte artificielle)
let preview1 = { renderer: null, scene: null, camera: null, rig: null, dinoId: null, rimLight: null, targetDist: 6.8, targetY: 1.3 };
let preview2 = { renderer: null, scene: null, camera: null, rig: null, dinoId: null, rimLight: null, targetDist: 6.8, targetY: 1.3 };

function setupPreviewScene(previewObj, canvasId, isP1 = true) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1.4, 0.1, 100);
    camera.position.set(0, 1.9, 6.7);
    camera.lookAt(0, 1.25, 0);

    scene.add(new THREE.AmbientLight(0xffffff, 0.78));
    const dirLight = new THREE.DirectionalLight(0xffeedd, 1.25);
    dirLight.position.set(4, 7, 5);
    scene.add(dirLight);

    // Warm torch light
    const torch = new THREE.PointLight(0xf59e0b, 1.3, 14);
    torch.position.set(isP1 ? 2.5 : -2.5, 2.4, 2.5);
    scene.add(torch);

    // Rim light: Sky Blue for P1, Crimson Red for P2
    const rimLight = new THREE.DirectionalLight(isP1 ? 0x38bdf8 : 0xef4444, 1.35);
    rimLight.position.set(isP1 ? -4 : 4, 5, -4);
    scene.add(rimLight);

    // 3D Carved Prehistoric Pedestal Altar (Matching Image 2)
    const pedestalGroup = new THREE.Group();
    // Lower wider stone base
    const baseGeo = new THREE.CylinderGeometry(2.7, 3.1, 0.4, 28);
    const baseMat = new THREE.MeshStandardMaterial({
        color: 0x24201c,
        roughness: 0.95,
        metalness: 0.08
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = -0.42;
    pedestalGroup.add(baseMesh);

    // Upper altar stone slab
    const cylGeo = new THREE.CylinderGeometry(2.45, 2.7, 0.45, 28);
    const cylMat = new THREE.MeshStandardMaterial({
        color: 0x322b25,
        roughness: 0.9,
        metalness: 0.1
    });
    const pedestalMesh = new THREE.Mesh(cylGeo, cylMat);
    pedestalMesh.position.y = -0.18;
    pedestalGroup.add(pedestalMesh);

    // Carved upper stone rim
    const rimGeo = new THREE.TorusGeometry(2.46, 0.09, 14, 32);
    const rimMat = new THREE.MeshStandardMaterial({ color: 0x483e35, roughness: 0.75 });
    const rimMesh = new THREE.Mesh(rimGeo, rimMat);
    rimMesh.rotation.x = Math.PI / 2;
    rimMesh.position.y = 0.02;
    pedestalGroup.add(rimMesh);

    // Moss / ancient creeping vine around stone rim
    const mossGeo = new THREE.TorusGeometry(2.48, 0.04, 8, 24);
    const mossMat = new THREE.MeshStandardMaterial({ color: 0x224820, roughness: 0.85 });
    const mossMesh = new THREE.Mesh(mossGeo, mossMat);
    mossMesh.rotation.x = Math.PI / 2;
    mossMesh.position.y = -0.06;
    pedestalGroup.add(mossMesh);

    // Contact shadow atop the altar
    const shadowGeo = new THREE.CircleGeometry(2.25, 32);
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x050508, transparent: true, opacity: 0.7 });
    const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.y = 0.03;
    pedestalGroup.add(contactShadow);

    scene.add(pedestalGroup);

    previewObj.renderer = renderer;
    previewObj.scene = scene;
    previewObj.camera = camera;
    previewObj.rimLight = rimLight;
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
        { p: preview1, dino: p1Dino, skinIndex: p1SkinIndex, canvasId: 'p1PreviewCanvas', imgId: 'p1PreviewImg', dir: 1 },
        { p: preview2, dino: p2Dino, skinIndex: p2Skin, canvasId: 'p2PreviewCanvas', imgId: 'p2PreviewImg', dir: -1 }
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
            item.p.scene.add(item.p.rig.root);
            item.p.dinoId = item.dino.id;
            item.p.skinIndex = item.skinIndex;
            item.p.syncCount = 0;
            item.p.rig.root.updateMatrixWorld(true);
        }

        if (item.p.rig) {
            // Orientation vivante : P1 regarde vers la droite/centre, P2 regarde vers la gauche/centre
            const baseRot = item.dir === 1 ? -0.42 : (Math.PI + 0.42);
            const sway = Math.sin(time * 0.0012) * 0.05;
            item.p.rig.root.rotation.y = baseRot + sway * item.dir;

            animateDino3DRig({
                dino: item.dino,
                rig: item.p.rig,
                action: 'idle',
                actionDuration: 0,
                hitStun: 0,
                isBlocking: false
            }, time * 0.001, 0.016);
            item.p.rig.root.updateMatrixWorld(true);

            // Cadrage héroïque montrant le combattant entier sur son autel de pierre (Image 2)
            const target = new THREE.Vector3(0, 0.90, 0);
            const dist = 12.5;
            item.p.camera.position.set(item.dir * 0.45, 1.70, dist);
            item.p.camera.lookAt(target.x, target.y, target.z);
        }

        if (item.p.rimLight) {
            item.p.rimLight.color.setHex(item.dino.accentColor || (item.dir === 1 ? 0xef4444 : 0x38bdf8));
        }

        item.p.renderer.render(item.p.scene, item.p.camera);

        // Synchroniser l'image de prévisualisation (pour affichage instantané et capture sans perte)
        item.p.syncCount = (item.p.syncCount || 0) + 1;
        if (item.p.syncCount <= 8 || item.p.lastDinoForImg !== item.dino.id || item.p.lastSkinForImg !== item.skinIndex) {
            item.p.lastDinoForImg = item.dino.id;
            item.p.lastSkinForImg = item.skinIndex;
            const img = document.getElementById(item.imgId);
            if (img) {
                try {
                    img.src = item.p.renderer.domElement.toDataURL('image/png');
                } catch (err) {}
            }
        }
    });
}

function initRosterUI() {
    const grid = document.getElementById('rosterGrid');
    if (!grid) return;
    grid.innerHTML = '';

    DINO_ROSTER.forEach((dino, idx) => {
        const isLocked = dino.isUnlockable && !isFighterUnlocked(dino.id);

        const card = document.createElement('div');
        card.className = `beast-card ${idx === p1ChoiceIndex ? 'selected-p1' : ''} ${idx === p2ChoiceIndex ? 'selected-p2' : ''} ${isLocked ? 'opacity-70 border-dashed border-amber-500/40' : ''}`;
        card.dataset.index = idx;

        if (isLocked) {
            card.innerHTML = `
                <div class="w-full flex-1 flex flex-col items-center justify-center relative p-1 bg-black/50">
                    <span class="text-2xl filter drop-shadow">🔒</span>
                </div>
                <div class="beast-name-plaque text-stone-400">???</div>
            `;

            card.addEventListener('click', () => {
                sfx.playCooldownWarning();
                spawnFloatingPopup(0, "🔒 COMBATTANT VERROUILLÉ ! Battez la Campagne pour débloquer Smilodon !", '#ef4444');
            });
        } else {
            const thumb3D = getDino3DThumbnail(dino, 0);
            const portraitVisual = thumb3D ? `
                <img src="${thumb3D}" alt="${dino.name}" class="w-full h-full object-contain filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)] transform scale-110" />
            ` : (FIGHTER_PORTRAITS[dino.id] || `
                <div class="w-10 h-10 rounded-full flex items-center justify-center border border-white/10" style="background:${dino.cssPrimary}44">
                    <span class="font-cinzel text-xs font-black text-white">${dino.name.substring(0, 2)}</span>
                </div>
            `);

            card.innerHTML = `
                <div class="p1-flag-badge ${idx === p1ChoiceIndex ? '' : 'hidden'}">P1</div>
                <div class="p2-flag-badge ${idx === p2ChoiceIndex ? '' : 'hidden'}">P2</div>
                <div class="w-full flex-1 flex items-center justify-center relative overflow-hidden p-0.5">
                    ${portraitVisual}
                </div>
                <div class="beast-name-plaque">${dino.name}</div>
            `;

            card.addEventListener('click', () => {
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
            });

            card.addEventListener('dblclick', () => {
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
            });
        }
        grid.appendChild(card);
    });

    // Slot 15: Boss Drak'Zul (Complète la rangée 3 de 5 cartes)
    const bossCard = document.createElement('div');
    bossCard.className = 'beast-card opacity-80 border-dashed border-red-500/50 cursor-pointer';
    bossCard.innerHTML = `
        <div class="w-full flex-1 flex flex-col items-center justify-center relative p-1 bg-gradient-to-b from-red-950/40 to-black/60">
            <span class="text-xl sm:text-2xl filter drop-shadow">🐉</span>
            <span class="text-[9px] font-black text-red-400 uppercase tracking-widest mt-0.5">BOSS</span>
        </div>
        <div class="beast-name-plaque text-red-300">DRAK'ZUL</div>
    `;
    bossCard.addEventListener('click', () => {
        sfx.playCooldownWarning();
        spawnFloatingPopup(0, "🔥 BOSS ANCESTRAL ! Terrassez les 5 étapes de la Campagne pour affronter Drak'Zul !", '#ef4444');
    });
    grid.appendChild(bossCard);

    // Rangée 4 (Slots 16 à 20): 5 emplacements verrouillés secrets avec cadenas (Hommage fidèle Image 2)
    const secretTitles = ['ANCESTRAL', 'TITAN', 'COLOSSE', 'LÉGENDE', 'PRIMAL'];
    secretTitles.forEach((secName) => {
        const secretCard = document.createElement('div');
        secretCard.className = 'beast-card opacity-65 border-stone-800 bg-stone-950/80 cursor-pointer';
        secretCard.innerHTML = `
            <div class="w-full flex-1 flex flex-col items-center justify-center relative p-1 bg-black/40">
                <span class="text-xl sm:text-2xl opacity-75 filter drop-shadow">🔒</span>
            </div>
            <div class="beast-name-plaque text-stone-500">${secName}</div>
        `;
        secretCard.addEventListener('click', () => {
            sfx.playCooldownWarning();
            spawnFloatingPopup(0, `🔒 COMBATTANT ${secName} VERROUILLÉ ! Complétez les défis secrets de l'Extinction !`, '#f59e0b');
        });
        grid.appendChild(secretCard);
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

    // Mode Badge & instructions
    const modeBadge = document.getElementById('selectScreenModeBadge');
    const slot1Btn = document.getElementById('btnSelectSlotP1');
    const slot2Btn = document.getElementById('btnSelectSlotP2');
    const p2SkinSelector = document.getElementById('p2SkinSelector');
    const p2HeaderLabel = document.getElementById('p2HeaderLabel');

    if (gameMode === 'campaign') {
        if (modeBadge) {
            modeBadge.innerHTML = `<span class="text-amber-400">🏆 CAMPAGNE : ÉTAPE ${campaignStage} / ${CAMPAIGN_TOTAL_STAGES}</span>`;
        }
        if (slot1Btn) slot1Btn.classList.add('hidden');
        if (slot2Btn) slot2Btn.classList.add('hidden');
        if (p2SkinSelector) p2SkinSelector.classList.add('hidden');
        if (p2HeaderLabel) {
            p2HeaderLabel.textContent = campaignStage === 6 ? "DRAK'ZUL" : `ÉTAPE ${campaignStage}`;
        }
    } else {
        if (slot1Btn) slot1Btn.classList.remove('hidden');
        if (slot2Btn) slot2Btn.classList.remove('hidden');
        if (p2SkinSelector) p2SkinSelector.classList.remove('hidden');
        if (modeBadge) {
            modeBadge.innerHTML = gameMode === 'pvp'
                ? `<span>👥 2 JOUEURS (1 VS 1)</span>`
                : (gameMode === 'practice' ? `<span>🥋 ENTRAÎNEMENT</span>` : `<span>👤 JOUEUR VS IA</span>`);
        }
        if (p2HeaderLabel) {
            p2HeaderLabel.textContent = gameMode === 'pvp' ? 'PLAYER 2' : (gameMode === 'practice' ? 'MANNEQUIN' : 'PLAYER 2 (IA)');
        }
    }

    // P1 Skins
    if (p1.skins && p1.skins.length > 0) {
        p1SkinIndex = ((p1SkinIndex % p1.skins.length) + p1.skins.length) % p1.skins.length;
        const skinP1El = document.getElementById('p1SkinName');
        if (skinP1El) skinP1El.textContent = `Skin: ${p1.skins[p1SkinIndex].name}`;
    }

    // P2 Skins
    if (p2.skins && p2.skins.length > 0) {
        p2SkinIndex = ((p2SkinIndex % p2.skins.length) + p2.skins.length) % p2.skins.length;
        const skinP2El = document.getElementById('p2SkinName');
        if (skinP2El) skinP2El.textContent = `Skin: ${p2.skins[p2SkinIndex].name}`;
    }

    // P1 Stats & Details (Matching Image 2)
    const p1BarPow = document.getElementById('p1BarPow');
    if (p1BarPow) p1BarPow.style.width = (p1.stats ? p1.stats.pow : 95) + '%';
    const p1BarSpd = document.getElementById('p1BarSpd');
    if (p1BarSpd) p1BarSpd.style.width = (p1.stats ? p1.stats.spd : 70) + '%';
    const p1BarDef = document.getElementById('p1BarDef');
    if (p1BarDef) p1BarDef.style.width = (p1.stats ? p1.stats.def : 85) + '%';
    const p1BarRage = document.getElementById('p1BarRage');
    if (p1BarRage) {
        const rVal = Math.min(100, Math.round(((p1.stats ? p1.stats.pow : 90) * 0.75) + ((100 - (p1.stats ? p1.stats.def : 80)) * 0.45)));
        p1BarRage.style.width = rVal + '%';
    }

    const p1ClassText = document.getElementById('p1ClassText');
    if (p1ClassText) p1ClassText.textContent = (p1.role || 'APEX PREDATOR').toUpperCase();
    const p1SpecialText = document.getElementById('p1SpecialText');
    if (p1SpecialText) p1SpecialText.textContent = (p1.special1Name || 'MORSURE PRIMALE').split('(')[0].trim().toUpperCase();

    // P2 Stats & Details (Matching Image 2)
    const p2BarPow = document.getElementById('p2BarPow');
    if (p2BarPow) p2BarPow.style.width = (p2.stats ? p2.stats.pow : 90) + '%';
    const p2BarSpd = document.getElementById('p2BarSpd');
    if (p2BarSpd) p2BarSpd.style.width = (p2.stats ? p2.stats.spd : 55) + '%';
    const p2BarDef = document.getElementById('p2BarDef');
    if (p2BarDef) p2BarDef.style.width = (p2.stats ? p2.stats.def : 100) + '%';
    const p2BarRage = document.getElementById('p2BarRage');
    if (p2BarRage) {
        const rVal2 = Math.min(100, Math.round(((p2.stats ? p2.stats.pow : 85) * 0.75) + ((100 - (p2.stats ? p2.stats.def : 90)) * 0.45)));
        p2BarRage.style.width = rVal2 + '%';
    }

    const p2ClassText = document.getElementById('p2ClassText');
    if (p2ClassText) p2ClassText.textContent = (p2.role || 'TANK').toUpperCase();
    const p2SpecialText = document.getElementById('p2SpecialText');
    if (p2SpecialText) p2SpecialText.textContent = (p2.special1Name || 'CHARGE SISMIQUE').split('(')[0].trim().toUpperCase();

    // Bouton d'action principal au bas de l'écran
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

    // Roster grid badges & highlight
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
    const mainMenu = document.getElementById('mainMenu');
    if (mainMenu) mainMenu.classList.add('hidden');
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

function initSelectScreenMenu() {
    // Return to main menu button
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

    // P1 & P2 skin navigation
    const btnP1Prev = document.getElementById('btnP1PrevSkin');
    const btnP1Next = document.getElementById('btnP1NextSkin');
    const btnP2Prev = document.getElementById('btnP2PrevSkin');
    const btnP2Next = document.getElementById('btnP2NextSkin');

    if (btnP1Prev) btnP1Prev.addEventListener('click', (e) => {
        e.stopPropagation();
        sfx.playHit(false);
        const skins = (DINO_ROSTER[p1ChoiceIndex] || {}).skins || [];
        if (skins.length > 0) {
            p1SkinIndex = (p1SkinIndex - 1 + skins.length) % skins.length;
            updateSelectScreenUI();
        }
    });
    if (btnP1Next) btnP1Next.addEventListener('click', (e) => {
        e.stopPropagation();
        sfx.playHit(false);
        const skins = (DINO_ROSTER[p1ChoiceIndex] || {}).skins || [];
        if (skins.length > 0) {
            p1SkinIndex = (p1SkinIndex + 1) % skins.length;
            updateSelectScreenUI();
        }
    });
    if (btnP2Prev) btnP2Prev.addEventListener('click', (e) => {
        e.stopPropagation();
        sfx.playHit(false);
        const p2 = getP2EffectiveDino();
        const skins = (p2 && p2.skins) || [];
        if (skins.length > 0) {
            p2SkinIndex = (p2SkinIndex - 1 + skins.length) % skins.length;
            updateSelectScreenUI();
        }
    });
    if (btnP2Next) btnP2Next.addEventListener('click', (e) => {
        e.stopPropagation();
        sfx.playHit(false);
        const p2 = getP2EffectiveDino();
        const skins = (p2 && p2.skins) || [];
        if (skins.length > 0) {
            p2SkinIndex = (p2SkinIndex + 1) % skins.length;
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

    // "When Selected ->" transition button (En campagne : direct vers le combat, sinon sélecteur d'arène)
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

// Fenêtre de célébration lors du déblocage d'un nouveau combattant
function showFighterUnlockedModal(fighterId = 'smilodon') {
    const existing = document.getElementById('unlockedFighterModal');
    if (existing) existing.remove();

    sfx.playGong();
    sfx.playRoar(70, 0.7);

    const dino = DINO_ROSTER.find(d => d.id === fighterId) || DINO_ROSTER[DINO_ROSTER.length - 1];
    const portraitSvg = FIGHTER_PORTRAITS[dino.id] || `
        <div class="w-16 h-16 rounded-full flex items-center justify-center border border-white/20" style="background:${dino.cssPrimary}44">
            <span class="mk-title text-xl font-black text-white">${dino.name.substring(0, 2)}</span>
        </div>
    `;

    const modalHtml = `
        <div id="unlockedFighterModal" class="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none">
            <div class="stone-panel rounded-3xl max-w-lg w-full p-6 text-center border-2 border-amber-400 shadow-[0_0_60px_rgba(245,158,11,0.6)] flex flex-col items-center">
                <div class="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-600 to-yellow-300 p-0.5 flex items-center justify-center shadow-xl mb-3 animate-pulse">
                    <span class="text-3xl">🏆</span>
                </div>
                <div class="text-xs font-black uppercase tracking-[0.25em] text-amber-400 mb-1">VICTOIRE DE LA CAMPAGNE !</div>
                <h2 class="mk-title text-2xl sm:text-3xl font-black text-white tracking-wider mb-0.5">NOUVEAU COMBATTANT DÉBLOQUÉ !</h2>
                <div class="text-amber-300 text-sm font-extrabold uppercase tracking-widest mb-3">${dino.name} • ${dino.fullName.toUpperCase()}</div>

                <!-- Visuel du combattant débloqué -->
                <div class="w-32 h-32 rounded-2xl bg-gradient-to-b from-amber-500/20 to-black/80 border-2 border-amber-400/80 p-2 my-2 shadow-inner flex items-center justify-center relative overflow-hidden">
                    ${portraitSvg}
                </div>

                <p class="text-xs sm:text-sm text-amber-200 italic mb-2">${dino.title}</p>
                <p class="text-xs text-zinc-300 max-w-md mb-4 leading-relaxed">
                    Vous avez terrassé le Dragon Primordial à l'Étape 6 de la Campagne d'Extinction ! Le redoutable <strong>${dino.fullName} aux canines sabres</strong> rejoint définitivement votre Roster !
                </p>

                <!-- Stats -->
                <div class="grid grid-cols-3 gap-2 w-full max-w-xs mb-5 text-center">
                    <div class="bg-black/60 p-2 rounded-xl border border-white/10">
                        <div class="text-[10px] text-zinc-400 uppercase font-bold">Puissance</div>
                        <div class="text-sm font-black text-red-400">${dino.stats.pow}%</div>
                    </div>
                    <div class="bg-black/60 p-2 rounded-xl border border-white/10">
                        <div class="text-[10px] text-zinc-400 uppercase font-bold">Vitesse</div>
                        <div class="text-sm font-black text-amber-400">${dino.stats.spd}%</div>
                    </div>
                    <div class="bg-black/60 p-2 rounded-xl border border-white/10">
                        <div class="text-[10px] text-zinc-400 uppercase font-bold">Armure</div>
                        <div class="text-sm font-black text-emerald-400">${dino.stats.def}%</div>
                    </div>
                </div>

                <div class="flex flex-col sm:flex-row gap-3 w-full">
                    <button id="btnPlayWithUnlocked" class="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-400 hover:from-amber-500 hover:to-yellow-300 text-zinc-950 font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg transition">
                        🐯 Choisir Smilodon !
                    </button>
                    <button id="btnCloseUnlockedModal" class="py-3 px-5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs sm:text-sm uppercase tracking-wider transition">
                        Continuer
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const smiloIdx = DINO_ROSTER.findIndex(d => d.id === fighterId);

    document.getElementById('btnPlayWithUnlocked').addEventListener('click', () => {
        document.getElementById('unlockedFighterModal').remove();
        sfx.playHit(false);
        if (smiloIdx >= 0) {
            p1ChoiceIndex = smiloIdx;
            activeSelectSlot = 1;
        }
        returnToSelect();
    });

    document.getElementById('btnCloseUnlockedModal').addEventListener('click', () => {
        document.getElementById('unlockedFighterModal').remove();
        sfx.playHit(false);
        initRosterUI();
    });
}
