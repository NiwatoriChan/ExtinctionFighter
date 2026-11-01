/* ============================================================================
 * MENU : ÉCRAN PRINCIPAL (MAIN MENU)
 * 1 Joueur (Campagne & Joueur vs IA), 2 Joueurs (1vs1), Paramètres & Grimoire.
 * ============================================================================ */

const MAIN_MENU_HTML = `
    <!-- ==================== SCREEN 0: MAIN MENU ==================== -->
    <section id="mainMenu" class="w-full h-full flex-1 flex flex-col items-center justify-between p-4 max-w-5xl mx-auto select-none relative z-10 overflow-y-auto">
        <!-- Title & Subtitle Banner -->
        <div class="flex flex-col items-center text-center mt-4 sm:mt-8">
            <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-amber-500 via-red-600 to-zinc-950 p-0.5 flex items-center justify-center shadow-2xl border border-amber-400/50 mb-3 animate-pulse">
                <span class="text-3xl sm:text-4xl font-black tracking-tighter text-amber-200">EK</span>
            </div>
            <h1 class="mk-title text-3xl sm:text-6xl font-black tracking-widest text-amber-400 uppercase drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]">
                EXTINCTION KOMBAT 3D
            </h1>
            <p class="text-xs sm:text-base text-red-400 uppercase tracking-[0.25em] font-extrabold mt-1">
                L'Ère des Prédateurs • Fatalités 3D • L'Épreuve de l'Extinction
            </p>
        </div>

        <!-- Central Menu Navigation -->
        <div class="w-full max-w-md flex flex-col gap-3 my-auto py-4">
            <!-- 1 Player Primary Button -->
            <div class="flex flex-col gap-1.5">
                <button id="btnMenu1P" class="w-full py-3 sm:py-3.5 px-6 rounded-xl bg-gradient-to-r from-red-800 via-red-600 to-amber-600 hover:from-red-700 hover:to-amber-500 text-white font-black text-sm sm:text-base uppercase tracking-widest shadow-xl border border-white/10 transition-all transform hover:scale-[1.01] flex items-center justify-between">
                    <span class="flex items-center gap-2"><span>👤</span> 1 JOUEUR</span>
                    <span class="text-xs text-amber-300">▼</span>
                </button>
                <!-- 1 Player Submenu Options -->
                <div id="submenu1P" class="flex flex-col gap-1.5 pl-3 border-l border-red-500/40 my-1">
                    <button id="btnSubCampaign" class="w-full py-2.5 px-4 rounded-lg bg-zinc-900/90 hover:bg-red-950/80 border border-white/10 hover:border-amber-400/60 text-left text-xs sm:text-sm font-bold text-amber-300 transition-all flex items-center justify-between">
                        <div>
                            <div class="font-black text-amber-300 tracking-wider">🏆 CAMPAGNE D'EXTINCTION</div>
                            <div class="text-[10px] text-zinc-400">5 Combats d'élimination ➔ L'Épreuve Finale Secrète</div>
                        </div>
                        <span class="text-base">⚡</span>
                    </button>
                    <button id="btnSubVsAI" class="w-full py-2.5 px-4 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 border border-white/10 hover:border-red-500/50 text-left text-xs sm:text-sm font-bold text-zinc-200 transition-all flex items-center justify-between">
                        <div>
                            <div class="font-black tracking-wider">⚔️ JOUEUR VS IA</div>
                            <div class="text-[10px] text-zinc-400">Combat libre (difficulté configurable dans Paramètres)</div>
                        </div>
                        <span class="text-base">🤖</span>
                    </button>
                    <button id="btnSubPractice" class="w-full py-2 px-4 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 border border-white/10 text-left text-xs font-bold text-zinc-400 hover:text-zinc-200 transition-all flex items-center justify-between">
                        <span>🥋 ENTRAÎNEMENT (PRACTICE)</span>
                        <span class="text-xs">🎯</span>
                    </button>
                </div>
            </div>

            <!-- 2 Player Primary Button -->
            <div class="flex flex-col gap-1.5">
                <button id="btnMenu2P" class="w-full py-3 sm:py-3.5 px-6 rounded-xl bg-gradient-to-r from-blue-900 via-indigo-700 to-cyan-600 hover:from-blue-800 hover:to-cyan-500 text-white font-black text-sm sm:text-base uppercase tracking-widest shadow-xl border border-white/10 transition-all transform hover:scale-[1.01] flex items-center justify-between">
                    <span class="flex items-center gap-2"><span>👥</span> 2 JOUEURS</span>
                    <span class="text-xs text-cyan-300">▼</span>
                </button>
                <!-- 2 Player Submenu Options -->
                <div id="submenu2P" class="hidden flex-col gap-1.5 pl-3 border-l border-cyan-500/40 my-1">
                    <button id="btnSubPvP" class="w-full py-2.5 px-4 rounded-lg bg-zinc-900/90 hover:bg-blue-950/80 border border-white/10 hover:border-cyan-400/60 text-left text-xs sm:text-sm font-bold text-cyan-300 transition-all flex items-center justify-between">
                        <div>
                            <div class="font-black tracking-wider">⚔️ 1 VS 1 (LOCAL)</div>
                            <div class="text-[10px] text-zinc-400">Même clavier ou manettes USB/Bluetooth</div>
                        </div>
                        <span class="text-base">🎮</span>
                    </button>
                </div>
            </div>

            <!-- Settings Button -->
            <button id="btnMenuSettings" class="w-full py-2.5 px-6 rounded-xl bg-zinc-900/80 hover:bg-zinc-800/90 border border-white/10 hover:border-amber-400/60 text-zinc-200 font-bold text-xs sm:text-sm uppercase tracking-wider transition-all flex items-center justify-between shadow">
                <span class="flex items-center gap-2"><span>⚙️</span> PARAMÈTRES (GRAPHISMES, PLEIN ÉCRAN & AUDIO)</span>
                <span class="text-amber-400 font-bold">Options</span>
            </button>

            <!-- Movelist Button -->
            <button id="btnMenuMoves" class="w-full py-2 px-6 rounded-xl bg-zinc-950/60 hover:bg-zinc-900/80 border border-white/5 hover:border-white/10 text-zinc-400 hover:text-amber-300 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-between">
                <span class="flex items-center gap-2"><span>📜</span> GRIMOIRE DES COUPS & FATALITÉS</span>
                <span>📖</span>
            </button>
        </div>

        <!-- Footer Credits / Version -->
        <div class="text-center text-[11px] text-zinc-500 pb-2">
            EXTINCTION KOMBAT 3D • 13 Légendes Préhistoriques • Moteur Three.js
        </div>
    </section>
`;

document.getElementById('appMain').insertAdjacentHTML('beforeend', MAIN_MENU_HTML);

function initMainMenu() {
    const sub1P = document.getElementById('submenu1P');
    const sub2P = document.getElementById('submenu2P');

    // Toggle 1P submenu
    document.getElementById('btnMenu1P').addEventListener('click', () => {
        sfx.playHit(false);
        sub1P.classList.toggle('hidden');
        if (!sub1P.classList.contains('hidden')) sub1P.classList.add('flex');
    });

    // Toggle 2P submenu
    document.getElementById('btnMenu2P').addEventListener('click', () => {
        sfx.playHit(false);
        sub2P.classList.toggle('hidden');
        if (!sub2P.classList.contains('hidden')) sub2P.classList.add('flex');
    });

    // 1P: Campagne (5 random enemies + Dragon boss)
    document.getElementById('btnSubCampaign').addEventListener('click', () => {
        sfx.playGong();
        gameMode = 'campaign';
        startCampaignMode();
    });

    // 1P: Joueur vs IA
    document.getElementById('btnSubVsAI').addEventListener('click', () => {
        sfx.playHit(false);
        gameMode = 'cpu';
        goToSelectScreen();
    });

    // 1P: Entraînement
    document.getElementById('btnSubPractice').addEventListener('click', () => {
        sfx.playHit(false);
        gameMode = 'practice';
        goToSelectScreen();
    });

    // 2P: 1vs1 Local
    document.getElementById('btnSubPvP').addEventListener('click', () => {
        sfx.playHit(false);
        gameMode = 'pvp';
        goToSelectScreen();
    });

    // Settings
    document.getElementById('btnMenuSettings').addEventListener('click', () => {
        sfx.playHit(false);
        openSettingsModal();
    });

    // Moves Modal
    document.getElementById('btnMenuMoves').addEventListener('click', () => {
        sfx.playHit(false);
        document.getElementById('movesModal').classList.remove('hidden');
    });
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

    goToSelectScreen();
}

function goToMainMenu() {
    matchState = 'main_menu';
    document.getElementById('mainMenu').classList.remove('hidden');
    document.getElementById('selectScreen').classList.add('hidden');
    document.getElementById('arenaScreen').classList.add('hidden');
    document.getElementById('battleScreen').classList.add('hidden');
    document.getElementById('battleScreen').classList.remove('flex');
    document.getElementById('btnBackToSelect').classList.add('hidden');
    document.getElementById('btnResetCam').classList.add('hidden');
    document.getElementById('postMatchMenu').classList.add('hidden');
}

function goToSelectScreen() {
    matchState = 'select';
    document.getElementById('mainMenu').classList.add('hidden');
    document.getElementById('arenaScreen').classList.add('hidden');
    document.getElementById('battleScreen').classList.add('hidden');
    document.getElementById('battleScreen').classList.remove('flex');
    document.getElementById('selectScreen').classList.remove('hidden');
    document.getElementById('btnBackToSelect').classList.add('hidden');
    document.getElementById('btnResetCam').classList.add('hidden');

    if (typeof initRosterUI === 'function') {
        initRosterUI();
    }
    if (typeof updateSelectScreenUI === 'function') {
        updateSelectScreenUI();
    }
}
