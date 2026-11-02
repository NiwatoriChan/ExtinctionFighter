/* ============================================================================
 * MENU : MENU PAUSE & OPTIONS EN COMBAT (TRIGGERED BY ESCAPE / START)
 * Remplace la barre d'en-tête web par un véritable menu pause console plein écran.
 * Accessible à tout moment en combat via la touche Échap ou le bouton Start.
 * ============================================================================ */

const PAUSE_MODAL_HTML = `
    <!-- MODAL DE PAUSE & OPTIONS DU JEU (HOMMAGE JEU DE COMBAT CONSOLE) -->
    <div id="pauseModal" class="hidden fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 select-none">
        <div class="stone-panel rounded-2xl max-w-md w-full flex flex-col overflow-hidden border-2 border-amber-500/80 shadow-[0_0_60px_rgba(0,0,0,0.95)]">
            
            <!-- En-tête de stèle sculptée -->
            <div class="p-4 border-b border-stone-800 bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950 flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <!-- Sceau Royal EK -->
                    <div class="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 via-red-600 to-black p-0.5 flex items-center justify-center border border-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.6)]">
                        <span class="font-cinzel text-xs font-black text-amber-100">EK</span>
                    </div>
                    <div>
                        <h3 class="font-cinzel text-lg sm:text-xl font-black text-amber-300 tracking-wider">
                            KOMBAT EN PAUSE
                        </h3>
                        <p class="font-chakra text-[10px] text-amber-400/80 uppercase tracking-widest font-bold">
                            Options & Commandes de Jeu
                        </p>
                    </div>
                </div>
                <button id="btnPauseClose" class="w-8 h-8 rounded-lg bg-stone-900 hover:bg-red-950 border border-stone-700 hover:border-red-500 text-stone-300 hover:text-red-300 font-bold text-sm flex items-center justify-center transition">✕</button>
            </div>

            <!-- Liste des dalles d'options -->
            <div id="pauseOptionsList" class="p-4 space-y-2 font-chakra">
                <!-- 1. Reprendre -->
                <button id="btnPauseResume" class="stone-slab-btn w-full py-2.5 px-4 flex items-center justify-between text-left text-xs sm:text-sm active">
                    <span class="flex items-center gap-2.5">
                        <span class="text-sm">▶</span>
                        <span class="font-black tracking-wide text-amber-100">REPRENDRE LE KOMBAT</span>
                    </span>
                    <span class="text-[10px] text-amber-400 font-bold">[START / ÉCHAP]</span>
                </button>

                <!-- 2. Grimoire des coups -->
                <button id="btnPauseMoves" class="stone-slab-btn w-full py-2.5 px-4 flex items-center justify-between text-left text-xs sm:text-sm">
                    <span class="flex items-center gap-2.5">
                        <span class="text-sm">📜</span>
                        <span class="font-bold tracking-wide text-stone-200">GRIMOIRE DES COUPS & COMBOS</span>
                    </span>
                    <span class="text-xs text-stone-400">▶</span>
                </button>

                <!-- 3. Paramètres du Jeu -->
                <button id="btnPauseSettings" class="stone-slab-btn w-full py-2.5 px-4 flex items-center justify-between text-left text-xs sm:text-sm">
                    <span class="flex items-center gap-2.5">
                        <span class="text-sm">⚙️</span>
                        <span class="font-bold tracking-wide text-stone-200">PARAMÈTRES (GRAPHISMES, IA)</span>
                    </span>
                    <span class="text-xs text-stone-400">▶</span>
                </button>

                <!-- 4. Activer / Couper le son -->
                <button id="btnPauseAudio" class="stone-slab-btn w-full py-2.5 px-4 flex items-center justify-between text-left text-xs sm:text-sm">
                    <span class="flex items-center gap-2.5">
                        <span id="pauseSoundIcon" class="text-sm">🔊</span>
                        <span class="font-bold tracking-wide text-stone-200">SON & EFFETS SPÉCIAUX</span>
                    </span>
                    <span id="pauseSoundLabel" class="text-xs font-black text-amber-400">ACTIVÉ</span>
                </button>

                <!-- 5. Réinitialiser la Caméra 3D -->
                <button id="btnPauseResetCam" class="stone-slab-btn w-full py-2 px-4 flex items-center justify-between text-left text-xs text-stone-300">
                    <span class="flex items-center gap-2.5">
                        <span class="text-sm">🎥</span>
                        <span class="font-bold tracking-wide">RÉINITIALISER LA CAMÉRA 3D</span>
                    </span>
                    <span class="text-xs text-cyan-400">3/4 PROFIL</span>
                </button>

                <!-- 6. Recommencer le match -->
                <button id="btnPauseRestart" class="stone-slab-btn w-full py-2 px-4 flex items-center justify-between text-left text-xs text-stone-300">
                    <span class="flex items-center gap-2.5">
                        <span class="text-sm">🔄</span>
                        <span class="font-bold tracking-wide">RECOMMENCER LE KOMBAT</span>
                    </span>
                    <span class="text-xs text-amber-400">ROUND 1</span>
                </button>

                <!-- 7. Retour Sélection des Combattants -->
                <button id="btnPauseSelect" class="stone-slab-btn w-full py-2.5 px-4 flex items-center justify-between text-left text-xs sm:text-sm">
                    <span class="flex items-center gap-2.5">
                        <span class="text-sm">🦖</span>
                        <span class="font-bold tracking-wide text-stone-200">SÉLECTION DES COMBATTANTS</span>
                    </span>
                    <span class="text-xs text-stone-400">▶</span>
                </button>

                <!-- 8. Quitter vers le Menu Principal -->
                <button id="btnPauseMainMenu" class="stone-slab-btn w-full py-2.5 px-4 flex items-center justify-between text-left text-xs sm:text-sm text-red-300 hover:text-white">
                    <span class="flex items-center gap-2.5">
                        <span class="text-sm">🏠</span>
                        <span class="font-bold tracking-wide">QUITTER VERS LE MENU PRINCIPAL</span>
                    </span>
                    <span class="text-xs text-red-400">▶</span>
                </button>
            </div>

            <!-- Barre de commandes manette / clavier inférieure -->
            <div class="p-3 border-t border-stone-800 bg-stone-950 flex flex-wrap items-center justify-between gap-2 text-[11px] text-stone-400 font-chakra">
                <span class="flex items-center gap-1.5">
                    <span class="px-1.5 py-0.2 rounded bg-stone-800 text-amber-400 font-black">↑↓ / D-PAD</span> Naviguer
                </span>
                <span class="flex items-center gap-1.5">
                    <span class="px-1.5 py-0.2 rounded bg-emerald-700 text-white font-black">[A] / ENTRÉE</span> Valider
                </span>
                <span class="flex items-center gap-1.5">
                    <span class="px-1.5 py-0.2 rounded bg-red-700 text-white font-black">[B] / ÉCHAP</span> Reprendre
                </span>
            </div>
        </div>
    </div>
`;

document.getElementById('appMain').insertAdjacentHTML('afterend', PAUSE_MODAL_HTML);

let pauseFocusIdx = 0;

function updatePauseAudioUI() {
    const icon = document.getElementById('pauseSoundIcon');
    const label = document.getElementById('pauseSoundLabel');
    if (icon) icon.textContent = sfx.enabled ? '🔊' : '🔇';
    if (label) {
        label.textContent = sfx.enabled ? 'ACTIVÉ' : 'COUPÉ';
        label.className = `text-xs font-black ${sfx.enabled ? 'text-amber-400' : 'text-stone-500'}`;
    }
}

function openPauseMenu() {
    isMatchPaused = true;
    const modal = document.getElementById('pauseModal');
    if (!modal) return;
    modal.classList.remove('hidden');
    updatePauseAudioUI();
    pauseFocusIdx = 0;
    updatePauseFocus();
    sfx.playHit(false);
}

function closePauseMenu() {
    isMatchPaused = false;
    const modal = document.getElementById('pauseModal');
    if (modal) modal.classList.add('hidden');
}

function togglePauseMenu() {
    const modal = document.getElementById('pauseModal');
    if (!modal) return;
    if (modal.classList.contains('hidden')) {
        openPauseMenu();
    } else {
        closePauseMenu();
    }
}

function getPauseNavButtons() {
    return Array.from(document.querySelectorAll('#pauseOptionsList .stone-slab-btn'));
}

function updatePauseFocus() {
    const buttons = getPauseNavButtons();
    buttons.forEach((btn, idx) => {
        btn.classList.toggle('active', idx === pauseFocusIdx);
    });
}

function initHeaderMenu() {
    // Boutons de la modale Pause
    const btnResume = document.getElementById('btnPauseResume');
    if (btnResume) btnResume.addEventListener('click', closePauseMenu);

    const btnClose = document.getElementById('btnPauseClose');
    if (btnClose) btnClose.addEventListener('click', closePauseMenu);

    const btnMoves = document.getElementById('btnPauseMoves');
    if (btnMoves) {
        btnMoves.addEventListener('click', () => {
            sfx.playHit(false);
            const mm = document.getElementById('movesModal');
            if (mm) {
                if (typeof renderMovesModalList === 'function') renderMovesModalList();
                mm.classList.remove('hidden');
            }
        });
    }

    const btnSettings = document.getElementById('btnPauseSettings');
    if (btnSettings) {
        btnSettings.addEventListener('click', () => {
            sfx.playHit(false);
            if (typeof openSettingsModal === 'function') openSettingsModal();
        });
    }

    const btnAudio = document.getElementById('btnPauseAudio');
    if (btnAudio) {
        btnAudio.addEventListener('click', () => {
            sfx.enabled = !sfx.enabled;
            updatePauseAudioUI();
            sfx.playHit(false);
        });
    }

    const btnResetCam = document.getElementById('btnPauseResetCam');
    if (btnResetCam) {
        btnResetCam.addEventListener('click', () => {
            camOrbit = { yaw: 0, pitch: 0.12 };
            sfx.playHit(false);
            spawnFloatingPopup(0, "🎥 Caméra réinitialisée", '#38bdf8');
            closePauseMenu();
        });
    }

    const btnRestart = document.getElementById('btnPauseRestart');
    if (btnRestart) {
        btnRestart.addEventListener('click', () => {
            closePauseMenu();
            startMatch();
        });
    }

    const btnSelect = document.getElementById('btnPauseSelect');
    if (btnSelect) {
        btnSelect.addEventListener('click', () => {
            closePauseMenu();
            returnToSelect();
        });
    }

    const btnMainMenu = document.getElementById('btnPauseMainMenu');
    if (btnMainMenu) {
        btnMainMenu.addEventListener('click', () => {
            closePauseMenu();
            goToMainMenu();
        });
    }
}
