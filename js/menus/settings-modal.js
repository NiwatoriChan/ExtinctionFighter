/* ============================================================================
 * MENU : FENÊTRE MODALE DES PARAMÈTRES (SETTINGS)
 * Qualité graphique (Faible, Moyenne, Élevée, Ultra), Plein écran, Audio, IA.
 * ============================================================================ */

const SETTINGS_MODAL_HTML = `
    <!-- MODAL: SETTINGS -->
    <div id="settingsModal" class="hidden fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 select-none">
        <div class="stone-panel rounded-2xl max-w-xl w-full flex flex-col overflow-hidden border-2 border-amber-500/80 shadow-2xl">
            <!-- Header -->
            <div class="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
                <div class="flex items-center gap-2">
                    <span class="text-xl">⚙️</span>
                    <h3 class="mk-title text-lg sm:text-xl font-black text-amber-400">PARAMÈTRES DU JEU</h3>
                </div>
                <button id="btnCloseSettings" class="px-3 py-1 rounded-lg bg-red-900/70 hover:bg-red-700 text-white text-xs font-bold transition">✕ Fermer</button>
            </div>

            <!-- Settings Content -->
            <div class="p-4 space-y-4 text-xs sm:text-sm overflow-y-auto max-h-[75vh]">
                <!-- 1. GRAPHICS QUALITY -->
                <div class="p-3 rounded-xl bg-zinc-900/80 border border-zinc-700 space-y-2">
                    <div class="flex items-center justify-between">
                        <span class="font-black text-amber-400 uppercase tracking-wider">🎮 DÉTAILS GRAPHIQUES 3D</span>
                        <span id="currentGraphicsLabel" class="text-xs px-2 py-0.5 rounded bg-zinc-800 text-cyan-300 font-bold uppercase">ÉLEVÉE</span>
                    </div>
                    <p class="text-[11px] text-zinc-400">
                        Ajuste la résolution de rendu 3D, le filtrage des ombres, la netteté et la densité des effets de particules de sang.
                    </p>
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                        <button data-gfx="low" class="btn-gfx-opt py-2 px-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-300 border border-zinc-700 transition">
                            ⚡ Faible
                        </button>
                        <button data-gfx="medium" class="btn-gfx-opt py-2 px-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-300 border border-zinc-700 transition">
                            ⚖️ Moyenne
                        </button>
                        <button data-gfx="high" class="btn-gfx-opt py-2 px-2 rounded-lg bg-amber-700 text-xs font-bold text-white border border-amber-400 shadow transition">
                            🔥 Élevée
                        </button>
                        <button data-gfx="ultra" class="btn-gfx-opt py-2 px-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-300 border border-zinc-700 transition">
                            👑 Ultra
                        </button>
                    </div>
                </div>

                <!-- 2. FULLSCREEN & DISPLAY -->
                <div class="p-3 rounded-xl bg-zinc-900/80 border border-zinc-700 space-y-2">
                    <div class="flex items-center justify-between">
                        <span class="font-black text-amber-400 uppercase tracking-wider">🖥️ MODE D'AFFICHAGE</span>
                    </div>
                    <div class="flex items-center justify-between">
                        <span class="text-zinc-300 text-xs">Basculer en Plein Écran (Immersion Totale)</span>
                        <button id="btnToggleFullscreen" class="px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-cyan-950 border border-cyan-500/80 text-cyan-300 text-xs font-bold transition flex items-center gap-1.5">
                            <span>⛶</span> <span>Plein Écran</span>
                        </button>
                    </div>
                </div>

                <!-- 3. AI DIFFICULTY -->
                <div class="p-3 rounded-xl bg-zinc-900/80 border border-zinc-700 space-y-2">
                    <div class="flex items-center justify-between">
                        <span class="font-black text-amber-400 uppercase tracking-wider">🤖 DIFFICULTÉ DE L'IA</span>
                        <select id="settingsAiDiff" class="bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs font-bold text-amber-400 focus:outline-none">
                            <option value="easy">Novice (Facile)</option>
                            <option value="normal" selected>Prédateur (Normal)</option>
                            <option value="brutal">Extinction (Brutal)</option>
                        </select>
                    </div>
                </div>

                <!-- 4. AUDIO -->
                <div class="p-3 rounded-xl bg-zinc-900/80 border border-zinc-700 flex items-center justify-between">
                    <div>
                        <div class="font-black text-amber-400 uppercase tracking-wider">🔊 EFFETS SONORES (SYNTHÉSEUR WEB)</div>
                        <div class="text-[10px] text-zinc-400">Gong, rugissements, impacts & craquements d'os</div>
                    </div>
                    <button id="btnSettingsSoundToggle" class="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-xs font-bold text-amber-400 transition">
                        Activé 🔊
                    </button>
                </div>
            </div>

            <!-- Footer -->
            <div class="p-3 border-t border-zinc-800 bg-zinc-950 flex justify-end">
                <button id="btnSaveSettingsClose" class="px-5 py-2 rounded-xl bg-gradient-to-r from-red-700 to-amber-600 text-white font-black text-xs uppercase tracking-wider shadow border border-amber-300">
                    Valider & Fermer
                </button>
            </div>
        </div>
    </div>
`;

document.getElementById('appMain').insertAdjacentHTML('afterend', SETTINGS_MODAL_HTML);

function openSettingsModal() {
    updateSettingsUI();
    document.getElementById('settingsModal').classList.remove('hidden');
}

function closeSettingsModal() {
    document.getElementById('settingsModal').classList.add('hidden');
}

function updateSettingsUI() {
    const q = graphicsQuality;
    document.getElementById('currentGraphicsLabel').textContent = q.toUpperCase();

    document.querySelectorAll('.btn-gfx-opt').forEach(btn => {
        const isMatch = btn.dataset.gfx === q;
        if (isMatch) {
            btn.className = 'btn-gfx-opt py-2 px-2 rounded-lg bg-red-700 text-xs font-black text-white border border-amber-400 shadow transition';
        } else {
            btn.className = 'btn-gfx-opt py-2 px-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-300 border border-zinc-700 transition';
        }
    });

    const aiSel = document.getElementById('settingsAiDiff');
    if (aiSel) aiSel.value = aiDifficulty;

    const sndBtn = document.getElementById('btnSettingsSoundToggle');
    if (sndBtn) {
        sndBtn.textContent = sfx.enabled ? 'Activé 🔊' : 'Coupé 🔇';
        sndBtn.className = sfx.enabled
            ? 'px-3 py-1.5 rounded-lg bg-red-950/80 border border-red-500 text-xs font-bold text-amber-400 transition'
            : 'px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-xs font-bold text-zinc-400 transition';
    }
}

function initSettingsModal() {
    document.getElementById('btnCloseSettings').addEventListener('click', closeSettingsModal);
    document.getElementById('btnSaveSettingsClose').addEventListener('click', closeSettingsModal);

    // Graphics options buttons
    document.querySelectorAll('.btn-gfx-opt').forEach(btn => {
        btn.addEventListener('click', () => {
            sfx.playHit(false);
            const q = btn.dataset.gfx;
            applyGraphicsSettings(q);
            updateSettingsUI();
        });
    });

    // Fullscreen toggle
    document.getElementById('btnToggleFullscreen').addEventListener('click', () => {
        sfx.playHit(false);
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
        } else {
            document.exitFullscreen().catch(() => {});
        }
    });

    // AI Difficulty
    document.getElementById('settingsAiDiff').addEventListener('change', (e) => {
        aiDifficulty = e.target.value;
        const mainAiSel = document.getElementById('aiDifficulty');
        if (mainAiSel) mainAiSel.value = aiDifficulty;
    });

    // Sound toggle
    document.getElementById('btnSettingsSoundToggle').addEventListener('click', () => {
        sfx.enabled = !sfx.enabled;
        const soundIcon = document.getElementById('soundIcon');
        if (soundIcon) soundIcon.textContent = sfx.enabled ? '🔊' : '🔇';
        updateSettingsUI();
    });
}
