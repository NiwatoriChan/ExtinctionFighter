/* ============================================================================
 * MENU : BARRE D'EN-TÊTE (titre, caméra, audio, grimoire, retour au roster)
 * ============================================================================ */

const HEADER_MENU_HTML = `
    <!-- HEADER BAR -->
    <header class="w-full max-w-6xl px-3 py-2 flex flex-wrap items-center justify-between border-b border-red-900/50 bg-black/80 backdrop-blur-md z-20">
        <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 via-red-600 to-red-950 p-0.5 flex items-center justify-center shadow-lg shadow-red-900/50 border border-amber-400">
                <span class="text-lg font-black tracking-tighter text-amber-200">EK</span>
            </div>
            <div>
                <h1 class="mk-title text-lg sm:text-2xl font-black tracking-wider text-amber-400 leading-none">
                    EXTINCTION KOMBAT 3D
                </h1>
                <p class="text-[11px] text-red-400 uppercase tracking-widest font-bold">13 Combattants 3D • Skins • Arènes Épiques • X-Ray & Fatalités</p>
            </div>
        </div>

        <div class="flex items-center gap-2 mt-1 sm:mt-0">
            <button id="btnResetCam" class="hidden px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-bold text-cyan-400 transition" title="Glissez la souris sur l'arène 3D pour tourner la caméra">
                🎥 Réinitialiser Caméra 3D
            </button>
            <button id="btnToggleSound" class="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-bold flex items-center gap-1.5 text-amber-400 transition">
                <span id="soundIcon">🔊</span> <span class="hidden sm:inline">Audio Synthé</span>
            </button>
            <button id="btnShowMoves" class="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-bold text-zinc-200 transition">
                📜 Coups & Fatalités 3D
            </button>
            <button id="btnBackToSelect" class="hidden px-3 py-1.5 rounded-lg bg-red-950/90 hover:bg-red-900 border border-red-600 text-xs font-bold text-amber-200 transition">
                ⚔️ Changer de Dino
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

    document.getElementById('btnToggleSound').addEventListener('click', () => {
        sfx.enabled = !sfx.enabled;
        document.getElementById('soundIcon').textContent = sfx.enabled ? '🔊' : '🔇';
    });
}
