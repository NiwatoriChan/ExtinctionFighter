/* ============================================================================
 * MENU : ÉCRAN PRINCIPAL (MAIN MENU)
 * 1 Joueur (Campagne & Joueur vs IA), 2 Joueurs (1vs1), Paramètres & Grimoire.
 * ============================================================================ */

const MAIN_MENU_HTML = `
    <!-- ==================== SCREEN 0: MAIN MENU (IMAGE 1 PRIMAL CLASH HOMAGE) ==================== -->
    <section id="mainMenu" class="w-full h-full flex-1 flex flex-col justify-between p-2 sm:p-4 pb-6 max-w-7xl mx-auto select-none relative z-10 overflow-hidden">
        
        <!-- Creeping Jungle Vines & Bone Frame Overlay -->
        <div class="absolute inset-0 pointer-events-none z-30 overflow-hidden">
            <!-- Top Vine Garland -->
            <svg viewBox="0 0 1200 36" preserveAspectRatio="none" class="w-full h-7 sm:h-9 absolute top-0 left-0">
                <path d="M0 6 Q150 20 300 8 Q450 24 600 10 Q750 22 900 8 Q1050 20 1200 6" fill="none" stroke="#166534" stroke-width="4"/>
                <path d="M0 4 Q150 18 300 6 Q450 22 600 8 Q750 20 900 6 Q1050 18 1200 4" fill="none" stroke="#22c55e" stroke-width="1.8"/>
                <polygon points="120,14 126,26 114,28" fill="#15803d"/>
                <polygon points="280,8 290,22 278,24" fill="#22c55e"/>
                <polygon points="420,18 430,30 416,32" fill="#16a34a"/>
                <polygon points="680,14 692,26 678,28" fill="#22c55e"/>
                <polygon points="850,10 860,24 848,26" fill="#15803d"/>
                <polygon points="1020,16 1032,28 1018,30" fill="#16a34a"/>
            </svg>

            <!-- Bottom-Left Prehistoric Raptor Bones / Rib Cage & Vines -->
            <div class="absolute bottom-12 left-2 w-16 h-16 sm:w-22 sm:h-22 opacity-80 pointer-events-none">
                <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-[0_4px_8px_rgba(0,0,0,0.95)]">
                    <path d="M10 90 Q30 70 20 40" fill="none" stroke="#fef3c7" stroke-width="5" stroke-linecap="round"/>
                    <path d="M22 92 Q42 68 34 35" fill="none" stroke="#fef3c7" stroke-width="4.5" stroke-linecap="round"/>
                    <path d="M36 94 Q56 70 48 42" fill="none" stroke="#fde68a" stroke-width="4" stroke-linecap="round"/>
                    <path d="M5 95 Q35 75 25 35" fill="none" stroke="#16a34a" stroke-width="2.5"/>
                </svg>
            </div>

            <!-- Floating Volcanic Embers Container -->
            <div id="mainMenuEmbers" class="absolute inset-0 pointer-events-none z-10 overflow-hidden"></div>
        </div>

        <!-- MAIN MENU CONTENT (2 COLUMNS: LEFT SLAB BUTTONS, RIGHT PRIMAL LOGO & TABLET) -->
        <div class="w-full flex-1 flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-8 my-auto relative z-20 px-2 sm:px-6">
            
            <!-- LEFT COLUMN: VERTICAL STACK OF CHISELED STONE SLAB BUTTONS -->
            <div class="w-full md:w-76 lg:w-88 flex flex-col gap-2 sm:gap-2.5 z-20">
                <!-- 1. CAMPAIGN (Active with glowing magma) -->
                <button id="btnMenuCampaign" class="stone-slab-btn active w-full py-2.5 sm:py-3 px-5 flex items-center justify-between text-left text-xs sm:text-sm">
                    <span class="flex items-center gap-2.5">
                        <span class="text-base sm:text-lg">🏆</span>
                        <span>CAMPAGNE</span>
                    </span>
                    <span class="text-xs text-amber-200">▶</span>
                </button>

                <!-- 2. VERSUS (1 VS 1 LOCAL) -->
                <button id="btnMenuVersus" class="stone-slab-btn w-full py-2.5 sm:py-3 px-5 flex items-center justify-between text-left text-xs sm:text-sm">
                    <span class="flex items-center gap-2.5">
                        <span class="text-base sm:text-lg">⚔️</span>
                        <span>VERSUS (1 VS 1)</span>
                    </span>
                    <span class="text-xs text-stone-400">▶</span>
                </button>

                <!-- 3. JOUEUR VS IA -->
                <button id="btnMenuVsAI" class="stone-slab-btn w-full py-2.5 sm:py-3 px-5 flex items-center justify-between text-left text-xs sm:text-sm">
                    <span class="flex items-center gap-2.5">
                        <span class="text-base sm:text-lg">🤖</span>
                        <span>JOUEUR VS IA</span>
                    </span>
                    <span class="text-xs text-stone-400">▶</span>
                </button>

                <!-- 4. ENTRAÎNEMENT (TRAINING) -->
                <button id="btnMenuTraining" class="stone-slab-btn w-full py-2.5 sm:py-3 px-5 flex items-center justify-between text-left text-xs sm:text-sm">
                    <span class="flex items-center gap-2.5">
                        <span class="text-base sm:text-lg">🥋</span>
                        <span>ENTRAÎNEMENT</span>
                    </span>
                    <span class="text-xs text-stone-400">▶</span>
                </button>

                <!-- 5. COMBATTANTS & SKINS (ROSTER) -->
                <button id="btnMenuRoster" class="stone-slab-btn w-full py-2.5 sm:py-3 px-5 flex items-center justify-between text-left text-xs sm:text-sm">
                    <span class="flex items-center gap-2.5">
                        <span class="text-base sm:text-lg">🦖</span>
                        <span>COMBATTANTS</span>
                    </span>
                    <span class="text-xs text-stone-400">▶</span>
                </button>

                <!-- 6. PARAMÈTRES (OPTIONS) -->
                <button id="btnMenuSettings" class="stone-slab-btn w-full py-2.5 sm:py-3 px-5 flex items-center justify-between text-left text-xs sm:text-sm">
                    <span class="flex items-center gap-2.5">
                        <span class="text-base sm:text-lg">⚙️</span>
                        <span>PARAMÈTRES</span>
                    </span>
                    <span class="text-xs text-stone-400">▶</span>
                </button>

                <!-- 7. GRIMOIRE DES COUPS -->
                <button id="btnMenuMoves" class="stone-slab-btn w-full py-2 sm:py-2.5 px-5 flex items-center justify-between text-left text-xs text-stone-400 hover:text-amber-300">
                    <span class="flex items-center gap-2.5">
                        <span class="text-base">📜</span>
                        <span>GRIMOIRE DES COUPS</span>
                    </span>
                    <span class="text-xs text-stone-400">▶</span>
                </button>
            </div>

            <!-- RIGHT AREA: COLOSSAL STONE LOGO TABLET WITH FLANKING FEMUR BONES & ARTWORK -->
            <div class="flex-1 flex flex-col items-center justify-center text-center relative max-w-xl mx-auto">
                <div class="relative w-full py-2 sm:py-4 px-2 sm:px-4">
                    <!-- Colossal Tablet Frame -->
                    <div class="primal-logo-tablet p-5 sm:p-7 flex flex-col items-center justify-center relative overflow-hidden">
                        <!-- Flanking Left Femur Bone -->
                        <div class="absolute -left-2 top-2 bottom-2 w-7 pointer-events-none hidden sm:block">
                            <svg viewBox="0 0 32 180" class="w-full h-full drop-shadow-[0_4px_8px_rgba(0,0,0,0.95)]">
                                <ellipse cx="10" cy="14" rx="8" ry="12" fill="#fef3c7" stroke="#78350f" stroke-width="1.5"/>
                                <ellipse cx="22" cy="14" rx="8" ry="12" fill="#fef3c7" stroke="#78350f" stroke-width="1.5"/>
                                <rect x="10" y="14" width="12" height="152" fill="#fde68a" stroke="#78350f" stroke-width="1.2"/>
                                <ellipse cx="10" cy="166" rx="8" ry="12" fill="#fef3c7" stroke="#78350f" stroke-width="1.5"/>
                                <ellipse cx="22" cy="166" rx="8" ry="12" fill="#fef3c7" stroke="#78350f" stroke-width="1.5"/>
                                <rect x="8" y="55" width="16" height="5" fill="#78350f" rx="2"/>
                                <rect x="8" y="115" width="16" height="5" fill="#78350f" rx="2"/>
                            </svg>
                        </div>

                        <!-- Flanking Right Femur Bone -->
                        <div class="absolute -right-2 top-2 bottom-2 w-7 pointer-events-none hidden sm:block">
                            <svg viewBox="0 0 32 180" class="w-full h-full drop-shadow-[0_4px_8px_rgba(0,0,0,0.95)]">
                                <ellipse cx="10" cy="14" rx="8" ry="12" fill="#fef3c7" stroke="#78350f" stroke-width="1.5"/>
                                <ellipse cx="22" cy="14" rx="8" ry="12" fill="#fef3c7" stroke="#78350f" stroke-width="1.5"/>
                                <rect x="10" y="14" width="12" height="152" fill="#fde68a" stroke="#78350f" stroke-width="1.2"/>
                                <ellipse cx="10" cy="166" rx="8" ry="12" fill="#fef3c7" stroke="#78350f" stroke-width="1.5"/>
                                <ellipse cx="22" cy="166" rx="8" ry="12" fill="#fef3c7" stroke="#78350f" stroke-width="1.5"/>
                                <rect x="8" y="55" width="16" height="5" fill="#78350f" rx="2"/>
                                <rect x="8" y="115" width="16" height="5" fill="#78350f" rx="2"/>
                            </svg>
                        </div>

                        <!-- Ancient Golden & Volcanic Seal -->
                        <div class="w-14 h-14 sm:w-18 sm:h-18 rounded-full bg-gradient-to-br from-amber-400 via-red-600 to-black p-1 flex items-center justify-center shadow-[0_0_35px_rgba(245,158,11,0.85)] border-2 border-amber-300 mb-2 animate-pulse">
                            <span class="font-cinzel text-2xl sm:text-3xl font-black text-amber-100">EK</span>
                        </div>

                        <!-- "EXTINCTION" Limestone Carved Title -->
                        <h2 class="logo-extinction-text text-2xl sm:text-4xl md:text-5xl font-black leading-none uppercase">
                            EXTINCTION
                        </h2>

                        <!-- "KOMBAT" Colossal Molten Magma Title -->
                        <h1 class="logo-kombat-text text-3xl sm:text-5xl md:text-6xl font-black leading-none uppercase -mt-1 sm:-mt-1.5">
                            KOMBAT
                        </h1>

                        <!-- Carved Stone Subtitle Plaque -->
                        <div class="stone-plaque-title px-4 sm:px-6 py-1 mt-3 flex items-center gap-2">
                            <span class="text-amber-400 text-xs sm:text-sm font-black">🔥</span>
                            <span class="font-chakra text-[11px] sm:text-xs md:text-sm font-extrabold text-amber-200 uppercase tracking-[0.2em]">
                                L'Ère des Prédateurs • Beasts of Prey
                            </span>
                            <span class="text-amber-400 text-xs sm:text-sm font-black">🔥</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- BOTTOM CONTROLS BASE BAR -->
        <div class="w-full px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs z-30 shrink-0">
            <!-- Left: Button Map & Controls Badge -->
            <div class="flex items-center gap-2 text-stone-400 font-chakra text-[11px] sm:text-xs font-bold">
                <span class="text-amber-400 text-base">🎮</span>
                <span>MANETTE / CLAVIER</span>
            </div>

            <!-- Center: Prompts matching Image 1: "PRESS [A] TO SELECT | [B] TO GO BACK" -->
            <div class="flex items-center justify-center gap-2 font-chakra text-xs sm:text-sm font-black tracking-wider mx-auto">
                <span class="text-stone-300">APPUYEZ SUR</span>
                <span class="px-1.5 py-0.5 rounded bg-emerald-600 text-white font-black text-xs shadow-[0_0_8px_#22c55e]">[A]</span>
                <span class="text-amber-400">CHOISIR</span>
                <span class="text-stone-500 font-normal">|</span>
                <span class="px-1.5 py-0.5 rounded bg-red-600 text-white font-black text-xs shadow-[0_0_8px_#ef4444]">[B]</span>
                <span class="text-stone-300">RETOUR</span>
            </div>

            <!-- Right: Version & Credits -->
            <div class="flex items-center gap-3 text-stone-400 font-chakra text-[11px] sm:text-xs">
                <span class="text-stone-500">v1.04</span>
                <span class="text-amber-400 font-black">THREE.JS 3D</span>
            </div>
        </div>
    </section>
`;

document.getElementById('appMain').insertAdjacentHTML('beforeend', MAIN_MENU_HTML);

function selectMainMenuSlab(btn) {
    if (!btn) return;
    const slabButtons = document.querySelectorAll('#mainMenu .stone-slab-btn');
    slabButtons.forEach((b, idx) => {
        const isMatch = (b === btn);
        b.classList.toggle('active', isMatch);
        b.classList.toggle('selected', isMatch);
        if (isMatch && typeof mainMenuFocusIdx !== 'undefined') {
            mainMenuFocusIdx = idx;
        }
    });
}

function initMainMenu() {
    // Spawn floating embers in background
    const embersCont = document.getElementById('mainMenuEmbers');
    if (embersCont && embersCont.children.length === 0) {
        for (let i = 0; i < 14; i++) {
            const p = document.createElement('div');
            p.className = 'ember-particle';
            const size = Math.random() * 4 + 2.5;
            p.style.width = size + 'px';
            p.style.height = size + 'px';
            p.style.left = (Math.random() * 96 + 2) + '%';
            p.style.animationDuration = (Math.random() * 4.5 + 4) + 's';
            p.style.animationDelay = (Math.random() * 5) + 's';
            p.style.opacity = (Math.random() * 0.7 + 0.3).toString();
            embersCont.appendChild(p);
        }
    }

    const slabButtons = document.querySelectorAll('#mainMenu .stone-slab-btn');
    slabButtons.forEach((btn, idx) => {
        btn.addEventListener('mouseenter', () => {
            selectMainMenuSlab(btn);
            if (typeof setGamepadFocus === 'function') {
                setGamepadFocus(btn);
            }
        });
    });

    // 1. Campagne d'Extinction
    const btnCamp = document.getElementById('btnMenuCampaign');
    if (btnCamp) {
        btnCamp.addEventListener('click', () => {
            selectMainMenuSlab(btnCamp);
            sfx.playGong();
            gameMode = 'campaign';
            startCampaignMode();
        });
    }

    // 2. 1vs1 Local
    const btnVersus = document.getElementById('btnMenuVersus');
    if (btnVersus) {
        btnVersus.addEventListener('click', () => {
            selectMainMenuSlab(btnVersus);
            sfx.playHit(false);
            gameMode = 'pvp';
            goToSelectScreen();
        });
    }

    // 3. Joueur vs IA
    const btnVsAI = document.getElementById('btnMenuVsAI');
    if (btnVsAI) {
        btnVsAI.addEventListener('click', () => {
            selectMainMenuSlab(btnVsAI);
            sfx.playHit(false);
            gameMode = 'cpu';
            goToSelectScreen();
        });
    }

    // 4. Entraînement
    const btnTrain = document.getElementById('btnMenuTraining');
    if (btnTrain) {
        btnTrain.addEventListener('click', () => {
            selectMainMenuSlab(btnTrain);
            sfx.playHit(false);
            gameMode = 'practice';
            goToSelectScreen();
        });
    }

    // 5. Roster / Combattants
    const btnRoster = document.getElementById('btnMenuRoster');
    if (btnRoster) {
        btnRoster.addEventListener('click', () => {
            selectMainMenuSlab(btnRoster);
            sfx.playHit(false);
            gameMode = 'cpu';
            goToSelectScreen();
        });
    }

    // 6. Settings
    const btnSettings = document.getElementById('btnMenuSettings');
    if (btnSettings) {
        btnSettings.addEventListener('click', () => {
            selectMainMenuSlab(btnSettings);
            sfx.playHit(false);
            openSettingsModal();
        });
    }

    // 7. Moves Modal
    const btnMoves = document.getElementById('btnMenuMoves');
    if (btnMoves) {
        btnMoves.addEventListener('click', () => {
            selectMainMenuSlab(btnMoves);
            sfx.playHit(false);
            if (typeof renderMovesModalList === 'function') renderMovesModalList();
            document.getElementById('movesModal').classList.remove('hidden');
        });
    }
}

function startCampaignMode() {
    gameMode = 'campaign';
    campaignStage = 1;

    // Sélectionner 5 adversaires aléatoires uniques parmi les créatures débloquées (hors boss)
    const available = [];
    for (let i = 0; i < DINO_ROSTER.length; i++) {
        const d = DINO_ROSTER[i];
        if (!d.isBoss && (!d.isUnlockable || isFighterUnlocked(d.id))) {
            available.push(i);
        }
    }
    // Shuffle
    for (let i = available.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [available[i], available[j]] = [available[j], available[i]];
    }
    campaignOpponents = available.slice(0, 5);

    // S'assurer que le premier adversaire n'est pas le même que le personnage actuel de J1
    if (campaignOpponents[0] === p1ChoiceIndex) {
        for (let k = 0; k < available.length; k++) {
            if (available[k] !== p1ChoiceIndex) {
                campaignOpponents[0] = available[k];
                break;
            }
        }
    }

    goToSelectScreen();
}

function goToMainMenu() {
    matchState = 'main_menu';
    const headerEl = document.getElementById('gameHeader');
    if (headerEl) headerEl.classList.add('hidden');
    const gpBar = document.getElementById('gamepadHelperBar');
    if (gpBar) gpBar.style.display = 'none';

    document.getElementById('mainMenu').classList.remove('hidden');
    document.getElementById('selectScreen').classList.add('hidden');
    document.getElementById('arenaScreen').classList.add('hidden');
    document.getElementById('battleScreen').classList.add('hidden');
    document.getElementById('battleScreen').classList.remove('flex');
    const btnBack = document.getElementById('btnBackToSelect');
    if (btnBack) btnBack.classList.add('hidden');
    const btnCam = document.getElementById('btnResetCam');
    if (btnCam) btnCam.classList.add('hidden');
    document.getElementById('postMatchMenu').classList.add('hidden');

    const menuButtons = typeof getMainMenuNavElements === 'function' ? getMainMenuNavElements() : Array.from(document.querySelectorAll('#mainMenu .stone-slab-btn'));
    if (typeof mainMenuFocusIdx === 'number' && menuButtons[mainMenuFocusIdx]) {
        selectMainMenuSlab(menuButtons[mainMenuFocusIdx]);
        if (typeof setGamepadFocus === 'function') setGamepadFocus(menuButtons[mainMenuFocusIdx]);
    } else if (menuButtons.length > 0) {
        selectMainMenuSlab(menuButtons[0]);
        if (typeof setGamepadFocus === 'function') setGamepadFocus(menuButtons[0]);
    }
}

function goToSelectScreen() {
    matchState = 'select';
    const headerEl = document.getElementById('gameHeader');
    if (headerEl) headerEl.classList.add('hidden');
    const gpBar = document.getElementById('gamepadHelperBar');
    if (gpBar) gpBar.style.display = 'none';

    document.getElementById('mainMenu').classList.add('hidden');
    document.getElementById('arenaScreen').classList.add('hidden');
    document.getElementById('battleScreen').classList.add('hidden');
    document.getElementById('battleScreen').classList.remove('flex');
    document.getElementById('selectScreen').classList.remove('hidden');
    const btnBack2 = document.getElementById('btnBackToSelect');
    if (btnBack2) btnBack2.classList.add('hidden');
    const btnCam2 = document.getElementById('btnResetCam');
    if (btnCam2) btnCam2.classList.add('hidden');

    if (typeof initRosterUI === 'function') {
        initRosterUI();
    }
    if (typeof updateSelectScreenUI === 'function') {
        updateSelectScreenUI();
    }
}
