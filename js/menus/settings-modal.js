/* ============================================================================
 * MENU : FENÊTRE DES PARAMÈTRES (OPTIONS) — PREHISTORIC OVERHAUL
 * Exact visual match with reference mockup:
 * - OPTIONS carved plaque header with glowing ember runes and hanging vines
 * - 4 Stone Tabs (AUDIO, VIDEO, GAMEPLAY, CONTROLS) with fiery active tab
 * - Stone Monolith Slab with beveled edges and creeping vines
 * - Prehistoric bone sliders with glowing raptor skull and bone knuckle thumbs
 * - Wooden / stone Fullscreen-Windowed toggle switch with glowing indicator
 * - Prehistoric bone capsule ON / OFF switches with fiery embossed state
 * - Volcanic floating embers canvas, controller prompts, and version tag
 * ============================================================================ */

// 1. ÉTATS RÉACTIFS (SIGNALS)
const settingsOpenSignal = UIKit.signal(false);
const settingsActiveTabSignal = UIKit.signal('gameplay');
const settingsGraphicsSignal = UIKit.signal(typeof graphicsQuality !== 'undefined' ? graphicsQuality : 'high');
const settingsSoundSignal = UIKit.signal(true);

const settingsMasterVolSignal = UIKit.signal(80);
const settingsSfxVolSignal = UIKit.signal(70);
const settingsMusicVolSignal = UIKit.signal(60);
const settingsDisplayModeSignal = UIKit.signal('fullscreen');
const settingsGoreBloodSignal = UIKit.signal(true);
const settingsSubtitlesSignal = UIKit.signal(true);
const settingsScreenShakeSignal = UIKit.signal(50);
const settingsRumbleSignal = UIKit.signal(true);
const settingsAiDiffSignal = UIKit.signal(typeof aiDifficulty !== 'undefined' ? aiDifficulty : 'normal');

// Variables globales de jeu synchronisées
window.goreAndBloodEnabled = true;
window.subtitlesEnabled = true;
window.screenShakeMultiplier = 0.5;

// Initialisation depuis localStorage si disponible
try {
    const savedMaster = localStorage.getItem('ek3d_master_volume');
    if (savedMaster !== null) settingsMasterVolSignal.value = parseInt(savedMaster, 10);

    const savedSfx = localStorage.getItem('ek3d_sfx_volume');
    if (savedSfx !== null) settingsSfxVolSignal.value = parseInt(savedSfx, 10);

    const savedGore = localStorage.getItem('ek3d_gore_blood');
    if (savedGore !== null) settingsGoreBloodSignal.value = savedGore === 'true';

    const savedSubs = localStorage.getItem('ek3d_subtitles');
    if (savedSubs !== null) settingsSubtitlesSignal.value = savedSubs === 'true';

    const savedShake = localStorage.getItem('ek3d_screen_shake');
    if (savedShake !== null) settingsScreenShakeSignal.value = parseInt(savedShake, 10);
} catch (_) {}

// Appliquer les volumes initiaux
if (typeof sfx !== 'undefined') {
    if (typeof sfx.setMasterVolume === 'function') sfx.setMasterVolume(settingsMasterVolSignal.value / 100);
    if (typeof sfx.setSfxVolume === 'function') sfx.setSfxVolume(settingsSfxVolSignal.value / 100);
}
window.goreAndBloodEnabled = settingsGoreBloodSignal.value;
window.subtitlesEnabled = settingsSubtitlesSignal.value;
window.screenShakeMultiplier = settingsScreenShakeSignal.value / 100;

// Tabs definitions
const SETTINGS_TABS = [
    { key: 'audio', label: 'AUDIO' },
    { key: 'video', label: 'VIDEO' },
    { key: 'gameplay', label: 'GAMEPLAY' },
    { key: 'controls', label: 'CONTROLS' }
];

// Helper: Création du slider en os
function createBoneSliderHTML(id, signalValue, thumbType = 'claw') {
    const thumbClass = thumbType === 'claw' ? 'bone-slider-thumb-claw' : 'bone-slider-thumb-bone';
    return `
        <div class="settings-control-area">
            <div class="bone-slider-wrapper" id="sliderWrapper_${id}" data-slider-id="${id}">
                <div class="bone-slider-track">
                    <div class="${thumbClass}" id="sliderThumb_${id}" style="left: ${signalValue}%"></div>
                </div>
            </div>
            <span class="bone-slider-pct" id="sliderPct_${id}">${signalValue}%</span>
        </div>
    `;
}

// Helper: Création du toggle ON / OFF
function createOnOffToggleHTML(id, isChecked) {
    const onActive = isChecked ? 'active' : 'inactive';
    const offActive = !isChecked ? 'active' : 'inactive';
    return `
        <div class="settings-control-area">
            <div class="toggle-onoff-capsule" id="toggleCapsule_${id}" data-toggle-id="${id}" role="button" tabindex="0">
                <button type="button" class="toggle-onoff-btn ${onActive}" id="toggleBtnOn_${id}" data-val="true">ON</button>
                <button type="button" class="toggle-onoff-btn ${offActive}" id="toggleBtnOff_${id}" data-val="false">OFF</button>
            </div>
        </div>
    `;
}

// Helper: Création du toggle Mode d'affichage
function createDisplayModeToggleHTML(mode) {
    const isFs = mode === 'fullscreen';
    const fsActive = isFs ? 'active' : '';
    const winActive = !isFs ? 'active' : '';
    const glowLeft = isFs ? '2px' : '22px';
    return `
        <div class="settings-control-area">
            <div class="toggle-mode-bar" id="toggleDisplayModeBar" role="button" tabindex="0">
                <span class="toggle-mode-label ${fsActive}" id="lblFs">FULLSCREEN</span>
                <div class="toggle-mode-indicator">
                    <div class="toggle-mode-indicator-glow" id="indicatorGlow" style="left: ${glowLeft}"></div>
                </div>
                <span class="toggle-mode-label ${winActive}" id="lblWin">WINDOWED</span>
            </div>
        </div>
    `;
}

// Rendu des lignes de paramètres selon l'onglet actif
function renderSettingsRowsHTML(tab) {
    if (tab === 'gameplay') {
        // EXACT REFERENCE MOCKUP: 6 ROWS
        return `
            <!-- Row 1: MASTER VOLUME -->
            <div class="settings-row" data-row-idx="0">
                <div class="settings-label-slab">MASTER VOLUME</div>
                ${createBoneSliderHTML('masterVol', settingsMasterVolSignal.value, 'claw')}
            </div>

            <!-- Row 2: SFX VOLUME -->
            <div class="settings-row" data-row-idx="1">
                <div class="settings-label-slab">SFX VOLUME</div>
                ${createBoneSliderHTML('sfxVol', settingsSfxVolSignal.value, 'claw')}
            </div>

            <!-- Row 3: DISPLAY MODE -->
            <div class="settings-row" data-row-idx="2">
                <div class="settings-label-slab">DISPLAY MODE</div>
                ${createDisplayModeToggleHTML(settingsDisplayModeSignal.value)}
            </div>

            <!-- Row 4: GORE & BLOOD -->
            <div class="settings-row" data-row-idx="3">
                <div class="settings-label-slab">GORE & BLOOD</div>
                ${createOnOffToggleHTML('goreBlood', settingsGoreBloodSignal.value)}
            </div>

            <!-- Row 5: SUBTITLES -->
            <div class="settings-row" data-row-idx="4">
                <div class="settings-label-slab">SUBTITLES</div>
                ${createOnOffToggleHTML('subtitles', settingsSubtitlesSignal.value)}
            </div>

            <!-- Row 6: SCREEN SHAKE -->
            <div class="settings-row" data-row-idx="5">
                <div class="settings-label-slab">SCREEN SHAKE</div>
                ${createBoneSliderHTML('screenShake', settingsScreenShakeSignal.value, 'bone')}
            </div>
        `;
    }

    if (tab === 'audio') {
        return `
            <div class="settings-row" data-row-idx="0">
                <div class="settings-label-slab">MASTER VOLUME</div>
                ${createBoneSliderHTML('masterVol', settingsMasterVolSignal.value, 'claw')}
            </div>
            <div class="settings-row" data-row-idx="1">
                <div class="settings-label-slab">SFX VOLUME</div>
                ${createBoneSliderHTML('sfxVol', settingsSfxVolSignal.value, 'claw')}
            </div>
            <div class="settings-row" data-row-idx="2">
                <div class="settings-label-slab">MUSIC VOLUME</div>
                ${createBoneSliderHTML('musicVol', settingsMusicVolSignal.value, 'claw')}
            </div>
            <div class="settings-row" data-row-idx="3">
                <div class="settings-label-slab">SOUND EFFECTS</div>
                ${createOnOffToggleHTML('soundEnabled', settingsSoundSignal.value)}
            </div>
            <div class="settings-row" data-row-idx="4">
                <div class="settings-label-slab">BONE CRUNCH</div>
                ${createOnOffToggleHTML('boneCrunch', true)}
            </div>
            <div class="settings-row" data-row-idx="5">
                <div class="settings-label-slab">ROAR INTENSITY</div>
                ${createBoneSliderHTML('roarVol', 85, 'bone')}
            </div>
        `;
    }

    if (tab === 'video') {
        const q = settingsGraphicsSignal.value;
        return `
            <div class="settings-row" data-row-idx="0">
                <div class="settings-label-slab">DISPLAY MODE</div>
                ${createDisplayModeToggleHTML(settingsDisplayModeSignal.value)}
            </div>
            <div class="settings-row" data-row-idx="1">
                <div class="settings-label-slab">GRAPHICS DETAIL</div>
                <div class="settings-control-area">
                    <div class="gfx-segmented-picker" id="gfxPicker">
                        <button type="button" class="gfx-segment-btn ${q === 'low' ? 'active' : ''}" data-gfx="low">Faible</button>
                        <button type="button" class="gfx-segment-btn ${q === 'medium' ? 'active' : ''}" data-gfx="medium">Moyenne</button>
                        <button type="button" class="gfx-segment-btn ${q === 'high' ? 'active' : ''}" data-gfx="high">Élevée</button>
                        <button type="button" class="gfx-segment-btn ${q === 'ultra' ? 'active' : ''}" data-gfx="ultra">Ultra</button>
                    </div>
                </div>
            </div>
            <div class="settings-row" data-row-idx="2">
                <div class="settings-label-slab">SHADOW MAPS</div>
                ${createOnOffToggleHTML('shadowMaps', q !== 'low')}
            </div>
            <div class="settings-row" data-row-idx="3">
                <div class="settings-label-slab">BLOOM & GLOW</div>
                ${createOnOffToggleHTML('bloom', true)}
            </div>
            <div class="settings-row" data-row-idx="4">
                <div class="settings-label-slab">VOLCANIC EMBERS</div>
                ${createOnOffToggleHTML('embersFx', true)}
            </div>
            <div class="settings-row" data-row-idx="5">
                <div class="settings-label-slab">RENDER SCALE</div>
                ${createBoneSliderHTML('renderScale', 100, 'bone')}
            </div>
        `;
    }

    if (tab === 'controls') {
        return `
            <div class="settings-row" data-row-idx="0">
                <div class="settings-label-slab">AI DIFFICULTY</div>
                <div class="settings-control-area">
                    <div class="gfx-segmented-picker" id="aiPicker">
                        <button type="button" class="gfx-segment-btn ${settingsAiDiffSignal.value === 'easy' ? 'active' : ''}" data-ai="easy">Facile</button>
                        <button type="button" class="gfx-segment-btn ${settingsAiDiffSignal.value === 'normal' ? 'active' : ''}" data-ai="normal">Normal</button>
                        <button type="button" class="gfx-segment-btn ${settingsAiDiffSignal.value === 'brutal' ? 'active' : ''}" data-ai="brutal">Brutal</button>
                    </div>
                </div>
            </div>
            <div class="settings-row" data-row-idx="1">
                <div class="settings-label-slab">VIBRATION</div>
                ${createOnOffToggleHTML('rumble', settingsRumbleSignal.value)}
            </div>
            <div class="settings-row" data-row-idx="2">
                <div class="settings-label-slab">SUBTITLES</div>
                ${createOnOffToggleHTML('subtitles', settingsSubtitlesSignal.value)}
            </div>
            <div class="settings-row" data-row-idx="3">
                <div class="settings-label-slab">AUTO-BLOCK</div>
                ${createOnOffToggleHTML('autoBlock', false)}
            </div>
            <div class="settings-row" data-row-idx="4">
                <div class="settings-label-slab">STICK DEADZONE</div>
                ${createBoneSliderHTML('stickDeadzone', 15, 'bone')}
            </div>
            <div class="settings-row" data-row-idx="5">
                <div class="settings-label-slab">SENSITIVITY</div>
                ${createBoneSliderHTML('stickSens', 75, 'claw')}
            </div>
        `;
    }

    return '';
}

// 2. ROOT MODAL UIKIT COMPONENT
const settingsModalRoot = new UIKit.Dialog({
    id: 'settingsModal',
    open: settingsOpenSignal,
    className: 'hidden fixed inset-0 z-50 select-none overflow-hidden',
    innerHTML: `
        <div class="settings-stage-overlay">
            <!-- Dynamic Interactive Canvas for Floating Volcanic Embers -->
            <div id="settingsCanvasContainer" class="absolute inset-0 pointer-events-none z-10 overflow-hidden">
                <canvas id="settingsCanvas" class="w-full h-full"></canvas>
            </div>

            <!-- 16:9 Stage Canvas Wrapper Matching Mockup -->
            <div class="settings-stage-wrapper">
                <!-- TOP HEADER: THE MAJESTIC CARVED 'OPTIONS' PLAQUE -->
                <header class="settings-header-box">
                    <img src="assets/ui/options_title_plaque.png" alt="OPTIONS" class="options-title-img">
                </header>

                <!-- TABS BAR (DIRECTLY ON TOP OF STONE SLAB) -->
                <nav class="settings-tabs-row" id="settingsTabsBar">
                    ${SETTINGS_TABS.map(t => `
                        <button type="button" 
                                class="settings-tab-btn ${t.key === settingsActiveTabSignal.value ? 'active' : ''}" 
                                data-tab="${t.key}">
                            ${t.label}
                        </button>
                    `).join('')}
                </nav>

                <!-- MONOLITH STONE SLAB CONTAINER -->
                <section class="settings-stone-slab-panel" id="settingsStoneSlab">
                    <div class="settings-rows-container" id="settingsRowsContainer">
                        ${renderSettingsRowsHTML(settingsActiveTabSignal.value)}
                    </div>
                </section>

                <!-- FOOTER NAVIGATION BAR WITH GLYPHS -->
                <footer class="settings-footer-row">
                    <div class="settings-prompt-text">
                        <span class="settings-btn-prompt" id="btnPromptSelect">
                            PRESS <span class="glyph-badge glyph-badge-a">[A]</span> SELECT
                        </span>
                        <span>|</span>
                        <span class="settings-btn-prompt" id="btnPromptBack">
                            <span class="glyph-badge glyph-badge-b">[B]</span> BACK
                        </span>
                        <span>|</span>
                        <span class="settings-btn-prompt" id="btnPromptReset">
                            <span class="glyph-badge glyph-badge-x">[X]</span> RESET DEFAULTS
                        </span>
                    </div>
                </footer>

                <span class="settings-version-tag">v1.04</span>
            </div>

            <!-- Compatibility elements for old callers/scripts -->
            <button id="btnCloseSettings" class="hidden" aria-hidden="true"></button>
            <button id="btnSaveSettingsClose" class="hidden" aria-hidden="true"></button>
            <button id="btnToggleFullscreen" class="hidden" aria-hidden="true"></button>
            <button id="btnSettingsSoundToggle" class="hidden" aria-hidden="true"></button>
            <select id="settingsAiDiff" class="hidden" aria-hidden="true">
                <option value="easy">easy</option>
                <option value="normal" selected>normal</option>
                <option value="brutal">brutal</option>
            </select>
            <span id="currentGraphicsLabel" class="hidden" aria-hidden="true">HIGH</span>
        </div>
    `
});

// Monter la modale dans le DOM
settingsModalRoot.mount(document.getElementById('appMain'), 'afterend');

// 3. FONCTIONS PRINCIPALES D'OUVERTURE / FERMETURE / MISES À JOUR
let settingsFocusedRow = 0;
let settingsEmbersRunning = false;
let settingsEmbersAnimId = null;

function openSettingsModal() {
    updateSettingsUI();
    settingsOpenSignal.value = true;
    const modal = document.getElementById('settingsModal');
    if (modal) modal.classList.remove('hidden');

    // Masquer le menu principal si ouvert pour éviter tout saignement
    const mm = document.getElementById('mainMenu');
    if (mm) mm.style.display = 'none';
    if (typeof mainMenuVisibleSignal !== 'undefined') {
        window._wasMainMenuVisible = mainMenuVisibleSignal.value;
        mainMenuVisibleSignal.value = false;
    }

    startSettingsEmbers();
    bindSettingsControls();
}

function closeSettingsModal() {
    settingsOpenSignal.value = false;
    const modal = document.getElementById('settingsModal');
    if (modal) modal.classList.add('hidden');

    stopSettingsEmbers();

    const mm = document.getElementById('mainMenu');
    if (mm && typeof matchState !== 'undefined' && matchState === 'main_menu') {
        mm.style.display = '';
    }

    // Si le combat est en pause, rouvrir le menu pause
    if (typeof isMatchPaused !== 'undefined' && isMatchPaused) {
        const pauseModal = document.getElementById('pauseModal');
        if (pauseModal) {
            pauseModal.classList.remove('hidden');
            if (typeof updatePauseAudioUI === 'function') updatePauseAudioUI();
            if (typeof updatePauseFocus === 'function') updatePauseFocus();
        }
    } else if (typeof matchState !== 'undefined' && matchState === 'main_menu') {
        if (typeof mainMenuVisibleSignal !== 'undefined') {
            mainMenuVisibleSignal.value = true;
        }
    }
}

function updateSettingsUI() {
    settingsGraphicsSignal.value = typeof graphicsQuality !== 'undefined' ? graphicsQuality : 'high';
    settingsSoundSignal.value = typeof sfx !== 'undefined' ? Boolean(sfx.enabled) : true;
    if (typeof aiDifficulty !== 'undefined') settingsAiDiffSignal.value = aiDifficulty;

    const rowsCont = document.getElementById('settingsRowsContainer');
    if (rowsCont) {
        rowsCont.innerHTML = renderSettingsRowsHTML(settingsActiveTabSignal.value);
        bindSettingsControls();
    }

    // Mettre à jour l'état visuel des onglets
    document.querySelectorAll('.settings-tab-btn').forEach(btn => {
        const tab = btn.dataset.tab;
        if (tab === settingsActiveTabSignal.value) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    const aiSel = document.getElementById('settingsAiDiff');
    if (aiSel && typeof aiDifficulty !== 'undefined') aiSel.value = aiDifficulty;

    const curGfxLabel = document.getElementById('currentGraphicsLabel');
    if (curGfxLabel) curGfxLabel.textContent = settingsGraphicsSignal.value.toUpperCase();
}

// 4. RÉINITIALISATION AUX VALEURS PAR DÉFAUT (MOCKUP EXACT)
function resetSettingsToDefaults() {
    if (typeof sfx !== 'undefined' && typeof sfx.playResetSound === 'function') {
        sfx.playResetSound();
    } else if (typeof sfx !== 'undefined') {
        sfx.playHit(true);
    }

    // Réinitialisation aux valeurs du mockup (80%, 70%, Fullscreen, ON, ON, 50%)
    settingsMasterVolSignal.value = 80;
    settingsSfxVolSignal.value = 70;
    settingsMusicVolSignal.value = 60;
    settingsDisplayModeSignal.value = 'fullscreen';
    settingsGoreBloodSignal.value = true;
    settingsSubtitlesSignal.value = true;
    settingsScreenShakeSignal.value = 50;
    settingsGraphicsSignal.value = 'high';
    settingsSoundSignal.value = true;
    settingsAiDiffSignal.value = 'normal';

    // Appliquer
    if (typeof sfx !== 'undefined') {
        if (typeof sfx.setMasterVolume === 'function') sfx.setMasterVolume(0.8);
        if (typeof sfx.setSfxVolume === 'function') sfx.setSfxVolume(0.7);
        sfx.enabled = true;
    }
    if (typeof applyGraphicsSettings === 'function') applyGraphicsSettings('high');
    if (typeof aiDifficulty !== 'undefined') aiDifficulty = 'normal';
    window.goreAndBloodEnabled = true;
    window.subtitlesEnabled = true;
    window.screenShakeMultiplier = 0.5;

    try {
        localStorage.setItem('ek3d_master_volume', '80');
        localStorage.setItem('ek3d_sfx_volume', '70');
        localStorage.setItem('ek3d_gore_blood', 'true');
        localStorage.setItem('ek3d_subtitles', 'true');
        localStorage.setItem('ek3d_screen_shake', '50');
    } catch (_) {}

    updateSettingsUI();
}

// 5. ATTACHEMENT DES CONTRÔLES INTERACTIFS
function bindSettingsControls() {
    // 5a. Tabs clicks
    document.querySelectorAll('.settings-tab-btn').forEach(btn => {
        btn.onclick = () => {
            const tab = btn.dataset.tab;
            if (settingsActiveTabSignal.value !== tab) {
                if (typeof sfx !== 'undefined' && typeof sfx.playTabSwitch === 'function') {
                    sfx.playTabSwitch();
                } else if (typeof sfx !== 'undefined') {
                    sfx.playHit(false);
                }
                settingsActiveTabSignal.value = tab;
                updateSettingsUI();
            }
        };
    });

    // 5b. Bone Sliders (Master, SFX, Shake, Music, Roar, Scale, Deadzone, Sens)
    document.querySelectorAll('.bone-slider-wrapper').forEach(slider => {
        const id = slider.dataset.sliderId;
        const thumb = document.getElementById(`sliderThumb_${id}`);
        const pctText = document.getElementById(`sliderPct_${id}`);

        const updateSliderFromClientX = (clientX) => {
            const rect = slider.getBoundingClientRect();
            const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
            const pct = Math.round((x / rect.width) * 100);

            if (thumb) thumb.style.left = `${pct}%`;
            if (pctText) pctText.textContent = `${pct}%`;

            // Appliquer selon le slider
            if (id === 'masterVol') {
                settingsMasterVolSignal.value = pct;
                if (typeof sfx !== 'undefined' && typeof sfx.setMasterVolume === 'function') {
                    sfx.setMasterVolume(pct / 100);
                }
                try { localStorage.setItem('ek3d_master_volume', String(pct)); } catch (_) {}
            } else if (id === 'sfxVol') {
                settingsSfxVolSignal.value = pct;
                if (typeof sfx !== 'undefined' && typeof sfx.setSfxVolume === 'function') {
                    sfx.setSfxVolume(pct / 100);
                }
                try { localStorage.setItem('ek3d_sfx_volume', String(pct)); } catch (_) {}
            } else if (id === 'screenShake') {
                settingsScreenShakeSignal.value = pct;
                window.screenShakeMultiplier = pct / 100;
                try { localStorage.setItem('ek3d_screen_shake', String(pct)); } catch (_) {}
            } else if (id === 'musicVol') {
                settingsMusicVolSignal.value = pct;
            }
        };

        let isDragging = false;
        slider.onpointerdown = (e) => {
            isDragging = true;
            slider.setPointerCapture(e.pointerId);
            updateSliderFromClientX(e.clientX);
            if (typeof sfx !== 'undefined' && typeof sfx.playSliderTick === 'function') {
                sfx.playSliderTick();
            }
        };

        slider.onpointermove = (e) => {
            if (isDragging) updateSliderFromClientX(e.clientX);
        };

        slider.onpointerup = (e) => {
            if (isDragging) {
                isDragging = false;
                slider.releasePointerCapture(e.pointerId);
            }
        };

        slider.onpointercancel = (e) => {
            isDragging = false;
        };
    });

    // 5c. Display Mode Toggle (Fullscreen / Windowed)
    const toggleFs = document.getElementById('toggleDisplayModeBar');
    if (toggleFs) {
        toggleFs.onclick = () => {
            if (typeof sfx !== 'undefined') sfx.playHit(false);
            const isCurrentlyFs = Boolean(document.fullscreenElement);
            if (!isCurrentlyFs) {
                document.documentElement.requestFullscreen().catch(() => {});
                settingsDisplayModeSignal.value = 'fullscreen';
            } else {
                document.exitFullscreen().catch(() => {});
                settingsDisplayModeSignal.value = 'windowed';
            }
            updateSettingsUI();
        };
    }

    // 5d. ON / OFF Capsules
    document.querySelectorAll('.toggle-onoff-capsule').forEach(capsule => {
        const id = capsule.dataset.toggleId;
        capsule.onclick = (e) => {
            if (typeof sfx !== 'undefined' && typeof sfx.playMenuClick === 'function') {
                sfx.playMenuClick();
            } else if (typeof sfx !== 'undefined') {
                sfx.playHit(false);
            }

            if (id === 'goreBlood') {
                settingsGoreBloodSignal.value = !settingsGoreBloodSignal.value;
                window.goreAndBloodEnabled = settingsGoreBloodSignal.value;
                try { localStorage.setItem('ek3d_gore_blood', String(settingsGoreBloodSignal.value)); } catch (_) {}
            } else if (id === 'subtitles') {
                settingsSubtitlesSignal.value = !settingsSubtitlesSignal.value;
                window.subtitlesEnabled = settingsSubtitlesSignal.value;
                try { localStorage.setItem('ek3d_subtitles', String(settingsSubtitlesSignal.value)); } catch (_) {}
            } else if (id === 'soundEnabled') {
                settingsSoundSignal.value = !settingsSoundSignal.value;
                if (typeof sfx !== 'undefined') sfx.enabled = settingsSoundSignal.value;
            } else if (id === 'rumble') {
                settingsRumbleSignal.value = !settingsRumbleSignal.value;
            }
            updateSettingsUI();
        };
    });

    // 5e. GFX Pickers (Video tab)
    document.querySelectorAll('.gfx-segment-btn[data-gfx]').forEach(btn => {
        btn.onclick = () => {
            const q = btn.dataset.gfx;
            if (typeof sfx !== 'undefined') sfx.playHit(false);
            if (typeof applyGraphicsSettings === 'function') applyGraphicsSettings(q);
            settingsGraphicsSignal.value = q;
            updateSettingsUI();
        };
    });

    // 5f. AI Pickers (Controls tab)
    document.querySelectorAll('.gfx-segment-btn[data-ai]').forEach(btn => {
        btn.onclick = () => {
            const ai = btn.dataset.ai;
            if (typeof sfx !== 'undefined') sfx.playHit(false);
            if (typeof aiDifficulty !== 'undefined') aiDifficulty = ai;
            settingsAiDiffSignal.value = ai;
            updateSettingsUI();
        };
    });

    // 5g. Prompt buttons in Footer
    const promptBack = document.getElementById('btnPromptBack');
    if (promptBack) {
        promptBack.onclick = () => {
            if (typeof sfx !== 'undefined') sfx.playHit(false);
            closeSettingsModal();
        };
    }

    const promptReset = document.getElementById('btnPromptReset');
    if (promptReset) {
        promptReset.onclick = () => {
            resetSettingsToDefaults();
        };
    }

    const promptSelect = document.getElementById('btnPromptSelect');
    if (promptSelect) {
        promptSelect.onclick = () => {
            if (typeof sfx !== 'undefined') sfx.playHit(false);
        };
    }
}

// 6. VOLCANIC FLOATING EMBERS CANVAS ANIMATION
function startSettingsEmbers() {
    if (settingsEmbersRunning) return;
    const canvas = document.getElementById('settingsCanvas');
    if (!canvas) return;

    settingsEmbersRunning = true;
    const ctx = canvas.getContext('2d');
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const onResize = () => {
        if (!settingsEmbersRunning) return;
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);

    const PARTICLE_COUNT = 36;
    const particles = [];
    const colors = [
        'rgba(255, 69, 0, ',    // Red-orange
        'rgba(255, 140, 0, ',   // Dark orange
        'rgba(255, 185, 15, ',  // Golden amber
        'rgba(255, 215, 0, ',   // Gold
        'rgba(255, 248, 220, '  // Hot ember white-gold
    ];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            radius: Math.random() * 2.5 + 1.0,
            baseSpeedY: Math.random() * 0.8 + 0.35,
            speedX: (Math.random() - 0.45) * 0.7,
            colorPrefix: colors[Math.floor(Math.random() * colors.length)],
            alpha: Math.random() * 0.8 + 0.2,
            fadeSpeed: Math.random() * 0.015 + 0.005,
            fadingIn: Math.random() > 0.5,
            wiggleAmp: Math.random() * 1.5 + 0.5,
            wiggleSpeed: Math.random() * 0.03 + 0.01,
            seed: Math.random() * 100
        });
    }

    function renderEmbers(time) {
        if (!settingsEmbersRunning) return;
        ctx.clearRect(0, 0, width, height);

        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            p.y -= p.baseSpeedY;
            p.x += p.speedX + Math.sin(time * p.wiggleSpeed + p.seed) * (p.wiggleAmp * 0.25);

            if (p.fadingIn) {
                p.alpha += p.fadeSpeed;
                if (p.alpha >= 0.95) p.fadingIn = false;
            } else {
                p.alpha -= p.fadeSpeed;
                if (p.alpha <= 0.1) p.fadingIn = true;
            }

            if (p.y < -10) {
                p.y = height + 10;
                p.x = Math.random() * width;
                p.alpha = Math.random() * 0.5 + 0.2;
            }
            if (p.x < -10) p.x = width + 10;
            if (p.x > width + 10) p.x = -10;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = p.colorPrefix + Math.max(0, Math.min(1, p.alpha)) + ')';
            ctx.shadowColor = 'rgba(255, 100, 0, 0.8)';
            ctx.shadowBlur = p.radius * 3;
            ctx.fill();
        }

        settingsEmbersAnimId = requestAnimationFrame(renderEmbers);
    }

    settingsEmbersAnimId = requestAnimationFrame(renderEmbers);
}

function stopSettingsEmbers() {
    settingsEmbersRunning = false;
    if (settingsEmbersAnimId) {
        cancelAnimationFrame(settingsEmbersAnimId);
        settingsEmbersAnimId = null;
    }
}

// 7. INITIALISATION GLOBALE DU MODULE DE PARAMÈTRES
function initSettingsModal() {
    // Boutons de compatibilité
    const btnClose = document.getElementById('btnCloseSettings');
    if (btnClose) btnClose.onclick = closeSettingsModal;

    const btnSave = document.getElementById('btnSaveSettingsClose');
    if (btnSave) btnSave.onclick = closeSettingsModal;

    const btnFs = document.getElementById('btnToggleFullscreen');
    if (btnFs) {
        btnFs.onclick = () => {
            const toggleBar = document.getElementById('toggleDisplayModeBar');
            if (toggleBar) toggleBar.click();
        };
    }

    const btnSound = document.getElementById('btnSettingsSoundToggle');
    if (btnSound) {
        btnSound.onclick = () => {
            if (typeof sfx !== 'undefined') sfx.enabled = !sfx.enabled;
            settingsSoundSignal.value = typeof sfx !== 'undefined' ? sfx.enabled : true;
            updateSettingsUI();
        };
    }

    // Synchronisation sur changement du plein écran natif
    document.addEventListener('fullscreenchange', () => {
        settingsDisplayModeSignal.value = document.fullscreenElement ? 'fullscreen' : 'windowed';
        updateSettingsUI();
    });

    // Écouteur clavier universel pour la navigation dans la fenêtre des options
    window.addEventListener('keydown', (e) => {
        if (!settingsOpenSignal.value) return;

        if (e.key === 'Escape' || e.key === 'Backspace') {
            e.preventDefault();
            if (typeof sfx !== 'undefined') sfx.playHit(false);
            closeSettingsModal();
            return;
        }

        if (e.key.toLowerCase() === 'x') {
            e.preventDefault();
            resetSettingsToDefaults();
            return;
        }

        if (e.key === 'Tab') {
            e.preventDefault();
            // Basculer d'onglet
            const curIdx = SETTINGS_TABS.findIndex(t => t.key === settingsActiveTabSignal.value);
            const nextIdx = (curIdx + (e.shiftKey ? -1 + SETTINGS_TABS.length : 1)) % SETTINGS_TABS.length;
            settingsActiveTabSignal.value = SETTINGS_TABS[nextIdx].key;
            if (typeof sfx !== 'undefined' && typeof sfx.playTabSwitch === 'function') {
                sfx.playTabSwitch();
            } else if (typeof sfx !== 'undefined') {
                sfx.playHit(false);
            }
            updateSettingsUI();
            return;
        }
    });

    bindSettingsControls();
}
