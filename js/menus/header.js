/* ============================================================================
 * MENU : BARRE D'EN-TÊTE (titre, caméra, audio, grimoire, accueil, paramètres)
 * ============================================================================ */

const HEADER_MENU_HTML = `
    <!-- HEADER BAR -->
    <header class="w-full px-4 py-2 flex flex-wrap items-center justify-between border-b border-white/5 bg-zinc-950/80 backdrop-blur-md z-20 shrink-0">
        <div class="flex items-center gap-3 cursor-pointer" id="btnLogoHome">
            <div class="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 via-red-600 to-zinc-950 p-0.5 flex items-center justify-center shadow-lg border border-amber-400/40">
                <span class="text-base font-black tracking-tighter text-amber-200">EK</span>
            </div>
            <div>
                <h1 class="mk-title text-base sm:text-xl font-black tracking-wider text-amber-400 leading-none">
                    EXTINCTION KOMBAT 3D
                </h1>
                <p class="text-[10px] text-zinc-400 uppercase tracking-widest font-medium mt-0.5">13 Combattants 3D • Arènes Épiques • Fatalités Viscérales</p>
            </div>
        </div>

        <div class="flex items-center gap-1.5 mt-1 sm:mt-0">
            <button id="btnHome" class="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-amber-300 transition flex items-center gap-1">
                <span>🏠</span> <span class="hidden md:inline">Accueil</span>
            </button>
            <button id="btnHeaderSettings" class="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-zinc-300 transition flex items-center gap-1">
                <span>⚙️</span> <span class="hidden md:inline">Paramètres</span>
            </button>
            <button id="btnResetCam" class="hidden px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-cyan-400 transition" title="Glissez la souris sur l'arène 3D pour tourner la caméra">
                🎥 Caméra
            </button>
            <button id="btnToggleSound" class="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold flex items-center gap-1 text-amber-400 transition">
                <span id="soundIcon">🔊</span> <span class="hidden sm:inline">Audio</span>
            </button>
            <button id="btnShowMoves" class="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-zinc-200 transition">
                📜 Coups
            </button>
            <button id="btnBackToSelect" class="hidden px-3 py-1.5 rounded-lg bg-red-950/70 hover:bg-red-900 border border-red-500/40 text-xs font-bold text-amber-200 transition">
                ⚔️ Combattants
            </button>
        </div>
    </header>
`;
document.getElementById('appMain').insertAdjacentHTML('beforebegin', HEADER_MENU_HTML);

function initHeaderMenu() {
    document.getElementById('btnResetCam').addEventListener('click', () => {
        camOrbit = { yaw: 0, pitch: 0.12 };
    });
    document.getElementById('btnBackToSelect').addEventListener('click', returnToSelect);

    const btnHome = document.getElementById('btnHome');
    if (btnHome) btnHome.addEventListener('click', goToMainMenu);

    const btnLogoHome = document.getElementById('btnLogoHome');
    if (btnLogoHome) btnLogoHome.addEventListener('click', goToMainMenu);

    const btnSettings = document.getElementById('btnHeaderSettings');
    if (btnSettings) {
        btnSettings.addEventListener('click', () => {
            if (typeof openSettingsModal === 'function') openSettingsModal();
        });
    }

    document.getElementById('btnToggleSound').addEventListener('click', () => {
        sfx.enabled = !sfx.enabled;
        document.getElementById('soundIcon').textContent = sfx.enabled ? '🔊' : '🔇';
    });
}
