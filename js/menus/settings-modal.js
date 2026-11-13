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
const settingsRoarVolSignal = UIKit.signal(85);
const settingsDisplayModeSignal = UIKit.signal('fullscreen');
const settingsGoreBloodSignal = UIKit.signal(true);
const settingsSubtitlesSignal = UIKit.signal(true);
const settingsScreenShakeSignal = UIKit.signal(50);
const settingsBoneCrunchSignal = UIKit.signal(true);
const settingsShadowMapsSignal = UIKit.signal(true);
const settingsBloomSignal = UIKit.signal(true);
const settingsEmbersFxSignal = UIKit.signal(true);
const settingsRenderScaleSignal = UIKit.signal(100);
const settingsRumbleSignal = UIKit.signal(true);
const settingsAutoBlockSignal = UIKit.signal(false);
const settingsStickDeadzoneSignal = UIKit.signal(15);
const settingsStickSensSignal = UIKit.signal(75);
const settingsAiDiffSignal = UIKit.signal(typeof aiDifficulty !== 'undefined' ? aiDifficulty : 'normal');

let settingsFocusedRow = 0;
let settingsEmbersRunning = false;
let settingsEmbersAnimId = null;

const SETTINGS_SLIDERS = {
    masterVol: { signal: settingsMasterVolSignal, key: 'ek3d_master_volume', defaultVal: 80 },
    sfxVol: { signal: settingsSfxVolSignal, key: 'ek3d_sfx_volume', defaultVal: 70 },
    musicVol: { signal: settingsMusicVolSignal, key: 'ek3d_music_volume', defaultVal: 60 },
    roarVol: { signal: settingsRoarVolSignal, key: 'ek3d_roar_volume', defaultVal: 85 },
    screenShake: { signal: settingsScreenShakeSignal, key: 'ek3d_screen_shake', defaultVal: 50 },
    renderScale: { signal: settingsRenderScaleSignal, key: 'ek3d_render_scale', defaultVal: 100 },
    stickDeadzone: { signal: settingsStickDeadzoneSignal, key: 'ek3d_stick_deadzone', defaultVal: 15 },
    stickSens: { signal: settingsStickSensSignal, key: 'ek3d_stick_sens', defaultVal: 75 }
};

const SETTINGS_TOGGLES = {
    goreBlood: { signal: settingsGoreBloodSignal, key: 'ek3d_gore_blood', defaultVal: true },
    subtitles: { signal: settingsSubtitlesSignal, key: 'ek3d_subtitles', defaultVal: true },
    soundEnabled: { signal: settingsSoundSignal, key: 'ek3d_sound_enabled', defaultVal: true },
    boneCrunch: { signal: settingsBoneCrunchSignal, key: 'ek3d_bone_crunch', defaultVal: true },
    shadowMaps: { signal: settingsShadowMapsSignal, key: 'ek3d_shadow_maps', defaultVal: true },
    bloom: { signal: settingsBloomSignal, key: 'ek3d_bloom_glow', defaultVal: true },
    embersFx: { signal: settingsEmbersFxSignal, key: 'ek3d_volcanic_embers', defaultVal: true },
    rumble: { signal: settingsRumbleSignal, key: 'ek3d_controller_rumble', defaultVal: true },
    autoBlock: { signal: settingsAutoBlockSignal, key: 'ek3d_auto_block', defaultVal: false }
};

function applySettingValue(id, val, persist = true) {
    if (SETTINGS_SLIDERS[id]) {
        const clamped = Math.max(0, Math.min(100, Math.round(val)));
        const meta = SETTINGS_SLIDERS[id];
        meta.signal.value = clamped;
        if (persist) {
            try { localStorage.setItem(meta.key, String(clamped)); } catch (_) {}
        }
        if (id === 'masterVol' && typeof sfx !== 'undefined' && typeof sfx.setMasterVolume === 'function') {
            sfx.setMasterVolume(clamped / 100);
        } else if (id === 'sfxVol' && typeof sfx !== 'undefined' && typeof sfx.setSfxVolume === 'function') {
            sfx.setSfxVolume(clamped / 100);
        } else if (id === 'musicVol') {
            window.musicVolume = clamped / 100;
            if (typeof sfx !== 'undefined' && typeof sfx.setMusicVolume === 'function') {
                sfx.setMusicVolume(clamped / 100);
            }
        } else if (id === 'roarVol') {
            window.roarIntensity = clamped / 100;
            if (typeof sfx !== 'undefined' && typeof sfx.setRoarIntensity === 'function') {
                sfx.setRoarIntensity(clamped / 100);
            }
        } else if (id === 'screenShake') {
            window.screenShakeMultiplier = clamped / 100;
        } else if (id === 'renderScale') {
            window.renderScaleMultiplier = Math.max(0.5, clamped / 100);
            if (typeof applyGraphicsSettings === 'function' && typeof graphicsQuality !== 'undefined') {
                applyGraphicsSettings(graphicsQuality);
            }
        } else if (id === 'stickDeadzone') {
            window.stickDeadzone = clamped / 100;
        } else if (id === 'stickSens') {
            window.stickSensitivity = clamped / 100;
        }
        return clamped;
    }

    if (SETTINGS_TOGGLES[id]) {
        const boolVal = Boolean(val);
        const meta = SETTINGS_TOGGLES[id];
        meta.signal.value = boolVal;
        if (persist) {
            try { localStorage.setItem(meta.key, String(boolVal)); } catch (_) {}
        }
        if (id === 'goreBlood') {
            window.goreAndBloodEnabled = boolVal;
        } else if (id === 'subtitles') {
            window.subtitlesEnabled = boolVal;
        } else if (id === 'soundEnabled' && typeof sfx !== 'undefined') {
            if (typeof sfx.setEnabled === 'function') {
                sfx.setEnabled(boolVal);
            } else {
                sfx.enabled = boolVal;
            }
        } else if (id === 'boneCrunch') {
            window.boneCrunchEnabled = boolVal;
            if (typeof sfx !== 'undefined' && typeof sfx.setBoneCrunchEnabled === 'function') {
                sfx.setBoneCrunchEnabled(boolVal);
            }
        } else if (id === 'shadowMaps') {
            window.shadowMapsEnabled = boolVal;
            if (typeof applyGraphicsSettings === 'function' && typeof graphicsQuality !== 'undefined') {
                applyGraphicsSettings(graphicsQuality);
            }
        } else if (id === 'bloom') {
            window.bloomGlowEnabled = boolVal;
            if (typeof applyGraphicsSettings === 'function' && typeof graphicsQuality !== 'undefined') {
                applyGraphicsSettings(graphicsQuality);
            }
        } else if (id === 'embersFx') {
            window.volcanicEmbersEnabled = boolVal;
            if (settingsOpenSignal.value) {
                if (boolVal) startSettingsEmbers();
                else clearAndStopSettingsEmbers();
            }
            if (!boolVal && typeof stopMainMenuEmberCanvas === 'function') stopMainMenuEmberCanvas();
            if (!boolVal && typeof stopSelectScreenEmberCanvas === 'function') stopSelectScreenEmberCanvas();
        } else if (id === 'rumble') {
            window.controllerRumbleEnabled = boolVal;
        } else if (id === 'autoBlock') {
            window.autoBlockEnabled = boolVal;
        }
        return boolVal;
    }
    return val;
}

// Initialisation depuis localStorage si disponible
try {
    Object.keys(SETTINGS_SLIDERS).forEach(id => {
        const saved = localStorage.getItem(SETTINGS_SLIDERS[id].key);
        if (saved !== null && !Number.isNaN(parseInt(saved, 10))) {
            applySettingValue(id, parseInt(saved, 10), false);
        } else {
            applySettingValue(id, SETTINGS_SLIDERS[id].signal.value, false);
        }
    });
    Object.keys(SETTINGS_TOGGLES).forEach(id => {
        const saved = localStorage.getItem(SETTINGS_TOGGLES[id].key);
        if (saved !== null) {
            applySettingValue(id, saved === 'true', false);
        } else {
            applySettingValue(id, SETTINGS_TOGGLES[id].signal.value, false);
        }
    });
    const savedGfx = localStorage.getItem('ek3d_graphics_quality');
    if (savedGfx) settingsGraphicsSignal.value = savedGfx;
    const savedAi = localStorage.getItem('ek3d_ai_difficulty');
    if (savedAi) {
        settingsAiDiffSignal.value = savedAi;
        if (typeof aiDifficulty !== 'undefined') aiDifficulty = savedAi;
    }
    const savedMode = localStorage.getItem('ek3d_display_mode');
    if (savedMode === 'fullscreen' || savedMode === 'windowed') {
        settingsDisplayModeSignal.value = savedMode;
    }
} catch (_) {}

// Tabs definitions
const SETTINGS_TABS = [
    { key: 'audio', label: 'AUDIO' },
    { key: 'video', label: 'VIDÉO' },
    { key: 'gameplay', label: 'GAMEPLAY' },
    { key: 'controls', label: 'CONTRÔLES' }
];

// Helper: Création du slider en os
function createBoneSliderHTML(id, signalValue, thumbType = 'claw') {
    const pct = Math.max(0, Math.min(100, Number(signalValue) || 0));
    const thumbClass = thumbType === 'claw' ? 'bone-slider-thumb-claw' : 'bone-slider-thumb-bone';
    return `
        <div class="settings-control-area">
            <div class="bone-slider-wrapper" id="sliderWrapper_${id}" data-slider-id="${id}">
                <div class="bone-slider-track">
                    <div class="bone-slider-fill" id="sliderFill_${id}" style="clip-path: inset(0 ${100 - pct}% 0 0);"></div>
                    <div class="${thumbClass}" id="sliderThumb_${id}" style="left: ${pct}%"></div>
                </div>
            </div>
            <span class="bone-slider-pct" id="sliderPct_${id}">${pct}%</span>
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
    const glowLeft = isFs ? '2px' : '42px';
    const knobLeft = isFs ? '6px' : '46px';
    return `
        <div class="settings-control-area">
            <div class="toggle-mode-bar" id="toggleDisplayModeBar" role="button" tabindex="0">
                <span class="toggle-mode-label ${fsActive}" id="lblFs">PLEIN ÉCRAN</span>
                <div class="toggle-mode-indicator">
                    <div class="toggle-mode-indicator-glow" id="indicatorGlow" style="left: ${glowLeft}"></div>
                    <div class="toggle-mode-knob" id="indicatorKnob" style="left: ${knobLeft}"></div>
                </div>
                <span class="toggle-mode-label ${winActive}" id="lblWin">FENÊTRÉ</span>
            </div>
        </div>
    `;
}

// Helper: Création d'une ligne avec mise en surbrillance de focus
function createSettingsRowHTML(idx, label, controlHTML) {
    const focusClass = idx === settingsFocusedRow ? ' active-focus' : '';
    return `
        <div class="settings-row" data-row-idx="${idx}">
            <div class="settings-label-slab${focusClass}">${label}</div>
            ${controlHTML}
        </div>
    `;
}

// Rendu des lignes de paramètres selon l'onglet actif
function renderSettingsRowsHTML(tab) {
    if (tab === 'gameplay') {
        return [
            createSettingsRowHTML(0, 'VOLUME PRINCIPAL', createBoneSliderHTML('masterVol', settingsMasterVolSignal.value, 'claw')),
            createSettingsRowHTML(1, 'VOLUME EFFETS SFX', createBoneSliderHTML('sfxVol', settingsSfxVolSignal.value, 'claw')),
            createSettingsRowHTML(2, 'MODE AFFICHAGE', createDisplayModeToggleHTML(settingsDisplayModeSignal.value)),
            createSettingsRowHTML(3, 'GORE & SANG', createOnOffToggleHTML('goreBlood', settingsGoreBloodSignal.value)),
            createSettingsRowHTML(4, 'SOUS-TITRES', createOnOffToggleHTML('subtitles', settingsSubtitlesSignal.value)),
            createSettingsRowHTML(5, 'SECOUSSES ÉCRAN', createBoneSliderHTML('screenShake', settingsScreenShakeSignal.value, 'bone'))
        ].join('');
    }

    if (tab === 'audio') {
        return [
            createSettingsRowHTML(0, 'VOLUME PRINCIPAL', createBoneSliderHTML('masterVol', settingsMasterVolSignal.value, 'claw')),
            createSettingsRowHTML(1, 'VOLUME EFFETS SFX', createBoneSliderHTML('sfxVol', settingsSfxVolSignal.value, 'claw')),
            createSettingsRowHTML(2, 'VOLUME MUSIQUE', createBoneSliderHTML('musicVol', settingsMusicVolSignal.value, 'claw')),
            createSettingsRowHTML(3, 'EFFETS SONORES', createOnOffToggleHTML('soundEnabled', settingsSoundSignal.value)),
            createSettingsRowHTML(4, 'CRAQUEMENTS D\'OS', createOnOffToggleHTML('boneCrunch', settingsBoneCrunchSignal.value)),
            createSettingsRowHTML(5, 'INTENSITÉ RUGIS', createBoneSliderHTML('roarVol', settingsRoarVolSignal.value, 'bone'))
        ].join('');
    }

    if (tab === 'video') {
        const q = settingsGraphicsSignal.value;
        const gfxControl = `
            <div class="settings-control-area">
                <div class="gfx-segmented-picker" id="gfxPicker">
                    <button type="button" class="gfx-segment-btn ${q === 'low' ? 'active' : ''}" data-gfx="low">FAIBLE</button>
                    <button type="button" class="gfx-segment-btn ${q === 'medium' ? 'active' : ''}" data-gfx="medium">MOYEN</button>
                    <button type="button" class="gfx-segment-btn ${q === 'high' ? 'active' : ''}" data-gfx="high">ÉLEVÉ</button>
                    <button type="button" class="gfx-segment-btn ${q === 'ultra' ? 'active' : ''}" data-gfx="ultra">ULTRA</button>
                </div>
            </div>
        `;
        return [
            createSettingsRowHTML(0, 'MODE AFFICHAGE', createDisplayModeToggleHTML(settingsDisplayModeSignal.value)),
            createSettingsRowHTML(1, 'QUALITÉ GRAPHIQUE', gfxControl),
            createSettingsRowHTML(2, 'OMBRES 3D', createOnOffToggleHTML('shadowMaps', settingsShadowMapsSignal.value)),
            createSettingsRowHTML(3, 'LUEUR & ÉCLAT', createOnOffToggleHTML('bloom', settingsBloomSignal.value)),
            createSettingsRowHTML(4, 'BRAISES VOLCANIQUES', createOnOffToggleHTML('embersFx', settingsEmbersFxSignal.value)),
            createSettingsRowHTML(5, 'ÉCHELLE DE RENDU', createBoneSliderHTML('renderScale', settingsRenderScaleSignal.value, 'bone'))
        ].join('');
    }

    if (tab === 'controls') {
        const ai = settingsAiDiffSignal.value;
        const aiControl = `
            <div class="settings-control-area">
                <div class="gfx-segmented-picker" id="aiPicker">
                    <button type="button" class="gfx-segment-btn ${ai === 'easy' ? 'active' : ''}" data-ai="easy">NOVICE</button>
                    <button type="button" class="gfx-segment-btn ${ai === 'normal' ? 'active' : ''}" data-ai="normal">NORMAL</button>
                    <button type="button" class="gfx-segment-btn ${ai === 'brutal' ? 'active' : ''}" data-ai="brutal">BRUTAL</button>
                </div>
            </div>
        `;
        return [
            createSettingsRowHTML(0, 'DIFFICULTÉ IA', aiControl),
            createSettingsRowHTML(1, 'VIBRATIONS MANETTE', createOnOffToggleHTML('rumble', settingsRumbleSignal.value)),
            createSettingsRowHTML(2, 'SOUS-TITRES', createOnOffToggleHTML('subtitles', settingsSubtitlesSignal.value)),
            createSettingsRowHTML(3, 'GARDE AUTO (P1)', createOnOffToggleHTML('autoBlock', settingsAutoBlockSignal.value)),
            createSettingsRowHTML(4, 'ZONE MORTE STICK', createBoneSliderHTML('stickDeadzone', settingsStickDeadzoneSignal.value, 'bone')),
            createSettingsRowHTML(5, 'SENSIBILITÉ STICK', createBoneSliderHTML('stickSens', settingsStickSensSignal.value, 'claw'))
        ].join('');
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
                            APPUYEZ <span class="glyph-badge glyph-badge-a">[A]</span> VALIDER
                        </span>
                        <span>|</span>
                        <span class="settings-btn-prompt" id="btnPromptBack">
                            <span class="glyph-badge glyph-badge-b">[B]</span> RETOUR
                        </span>
                        <span>|</span>
                        <span class="settings-btn-prompt" id="btnPromptReset">
                            <span class="glyph-badge glyph-badge-x">[X]</span> RÉINITIALISER
                        </span>
                    </div>
                </footer>

                <span class="settings-version-tag">${typeof GAME_VERSION !== 'undefined' ? GAME_VERSION : 'v0.2.1'}</span>
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
function openSettingsModal() {
    if (typeof sfx !== 'undefined') {
        settingsSoundSignal.value = Boolean(sfx.enabled);
    }
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

    if (settingsEmbersFxSignal.value) {
        startSettingsEmbers();
    } else {
        clearAndStopSettingsEmbers();
    }
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

function updateSettingsRowFocus() {
    const rows = document.querySelectorAll('#settingsRowsContainer .settings-row');
    if (!rows.length) return;
    settingsFocusedRow = ((settingsFocusedRow % rows.length) + rows.length) % rows.length;
    rows.forEach((row, idx) => {
        const slab = row.querySelector('.settings-label-slab');
        if (slab) slab.classList.toggle('active-focus', idx === settingsFocusedRow);
    });
}

function updateSettingsUI() {
    const rowsCont = document.getElementById('settingsRowsContainer');
    if (rowsCont) {
        rowsCont.innerHTML = renderSettingsRowsHTML(settingsActiveTabSignal.value);
        bindSettingsControls();
        updateSettingsRowFocus();
    }

    // Mettre à jour l'état visuel des onglets
    document.querySelectorAll('.settings-tab-btn').forEach(btn => {
        const tab = btn.dataset.tab;
        btn.classList.toggle('active', tab === settingsActiveTabSignal.value);
    });

    const aiSel = document.getElementById('settingsAiDiff');
    if (aiSel && typeof aiDifficulty !== 'undefined') aiSel.value = aiDifficulty;

    const curGfxLabel = document.getElementById('currentGraphicsLabel');
    if (curGfxLabel) curGfxLabel.textContent = settingsGraphicsSignal.value.toUpperCase();
}

// 4. RÉINITIALISATION AUX VALEURS PAR DÉFAUT
function resetSettingsToDefaults() {
    if (typeof sfx !== 'undefined' && typeof sfx.playResetSound === 'function') {
        sfx.playResetSound();
    } else if (typeof sfx !== 'undefined') {
        sfx.playHit(true);
    }

    Object.keys(SETTINGS_SLIDERS).forEach(id => {
        applySettingValue(id, SETTINGS_SLIDERS[id].defaultVal, true);
    });
    Object.keys(SETTINGS_TOGGLES).forEach(id => {
        applySettingValue(id, SETTINGS_TOGGLES[id].defaultVal, true);
    });

    settingsDisplayModeSignal.value = 'fullscreen';
    settingsGraphicsSignal.value = 'high';
    settingsAiDiffSignal.value = 'normal';

    if (typeof applyGraphicsSettings === 'function') applyGraphicsSettings('high');
    if (typeof graphicsQuality !== 'undefined') graphicsQuality = 'high';
    if (typeof aiDifficulty !== 'undefined') aiDifficulty = 'normal';

    try {
        localStorage.setItem('ek3d_display_mode', 'fullscreen');
        localStorage.setItem('ek3d_graphics_quality', 'high');
        localStorage.setItem('ek3d_ai_difficulty', 'normal');
    } catch (_) {}

    updateSettingsUI();
}

function setSliderUI(id, pct) {
    const thumb = document.getElementById(`sliderThumb_${id}`);
    const fill = document.getElementById(`sliderFill_${id}`);
    const pctText = document.getElementById(`sliderPct_${id}`);
    if (thumb) thumb.style.left = `${pct}%`;
    if (fill) fill.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
    if (pctText) pctText.textContent = `${pct}%`;
}

function toggleDisplayMode() {
    if (typeof sfx !== 'undefined') sfx.playHit(false);
    const wantFs = settingsDisplayModeSignal.value !== 'fullscreen';
    if (wantFs) {
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(() => {});
        }
        settingsDisplayModeSignal.value = 'fullscreen';
    } else {
        if (document.fullscreenElement && document.exitFullscreen) {
            document.exitFullscreen().catch(() => {});
        }
        settingsDisplayModeSignal.value = 'windowed';
    }
    try { localStorage.setItem('ek3d_display_mode', settingsDisplayModeSignal.value); } catch (_) {}
    updateSettingsUI();
}

function activateFocusedSettingRow(delta = 0) {
    const row = document.querySelector(`#settingsRowsContainer .settings-row[data-row-idx="${settingsFocusedRow}"]`);
    if (!row) return;

    const slider = row.querySelector('.bone-slider-wrapper');
    if (slider) {
        const id = slider.dataset.sliderId;
        const step = delta !== 0 ? delta * 5 : 5;
        const cur = SETTINGS_SLIDERS[id] ? SETTINGS_SLIDERS[id].signal.value : 50;
        const next = applySettingValue(id, cur + step, true);
        setSliderUI(id, next);
        if (typeof sfx !== 'undefined' && typeof sfx.playSliderTick === 'function') sfx.playSliderTick();
        return;
    }

    const capsule = row.querySelector('.toggle-onoff-capsule');
    if (capsule) {
        capsule.click();
        return;
    }

    const modeBar = row.querySelector('#toggleDisplayModeBar');
    if (modeBar) {
        toggleDisplayMode();
        return;
    }

    const pickerBtns = Array.from(row.querySelectorAll('.gfx-segment-btn'));
    if (pickerBtns.length > 0) {
        const curIdx = Math.max(0, pickerBtns.findIndex(b => b.classList.contains('active')));
        const nextIdx = (curIdx + (delta < 0 ? -1 + pickerBtns.length : 1)) % pickerBtns.length;
        pickerBtns[nextIdx].click();
    }
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
                settingsFocusedRow = 0;
                updateSettingsUI();
            }
        };
    });

    // Focus tracking on row hover/click
    document.querySelectorAll('#settingsRowsContainer .settings-row').forEach((row, idx) => {
        row.onmouseenter = () => {
            if (settingsFocusedRow !== idx) {
                settingsFocusedRow = idx;
                updateSettingsRowFocus();
            }
        };
    });

    // 5b. Bone Sliders (Master, SFX, Shake, Music, Roar, Scale, Deadzone, Sens)
    document.querySelectorAll('.bone-slider-wrapper').forEach(slider => {
        const id = slider.dataset.sliderId;

        const updateSliderFromClientX = (clientX) => {
            const rect = slider.getBoundingClientRect();
            if (!rect.width) return;
            const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
            const rawPct = Math.round((x / rect.width) * 100);
            const pct = applySettingValue(id, rawPct, true);
            setSliderUI(id, pct);
        };

        let isDragging = false;
        slider.onpointerdown = (e) => {
            const row = slider.closest('.settings-row');
            if (row && row.dataset.rowIdx !== undefined) {
                settingsFocusedRow = parseInt(row.dataset.rowIdx, 10);
                updateSettingsRowFocus();
            }
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

        slider.onpointercancel = () => {
            isDragging = false;
        };
    });

    // 5c. Display Mode Toggle (Fullscreen / Windowed)
    const toggleFs = document.getElementById('toggleDisplayModeBar');
    if (toggleFs) {
        toggleFs.onclick = () => {
            const row = toggleFs.closest('.settings-row');
            if (row && row.dataset.rowIdx !== undefined) {
                settingsFocusedRow = parseInt(row.dataset.rowIdx, 10);
            }
            toggleDisplayMode();
        };
    }

    // 5d. ON / OFF Capsules
    document.querySelectorAll('.toggle-onoff-capsule').forEach(capsule => {
        const id = capsule.dataset.toggleId;
        capsule.onclick = (e) => {
            const row = capsule.closest('.settings-row');
            if (row && row.dataset.rowIdx !== undefined) {
                settingsFocusedRow = parseInt(row.dataset.rowIdx, 10);
            }
            if (typeof sfx !== 'undefined' && typeof sfx.playMenuClick === 'function') {
                sfx.playMenuClick();
            } else if (typeof sfx !== 'undefined') {
                sfx.playHit(false);
            }

            const targetBtn = e.target.closest('.toggle-onoff-btn');
            const meta = SETTINGS_TOGGLES[id];
            if (meta) {
                const nextVal = targetBtn && targetBtn.dataset.val !== undefined
                    ? targetBtn.dataset.val === 'true'
                    : !meta.signal.value;
                applySettingValue(id, nextVal, true);
            }
            updateSettingsUI();
        };
    });

    // 5e. GFX Pickers (Video tab)
    document.querySelectorAll('.gfx-segment-btn[data-gfx]').forEach(btn => {
        btn.onclick = () => {
            const row = btn.closest('.settings-row');
            if (row && row.dataset.rowIdx !== undefined) {
                settingsFocusedRow = parseInt(row.dataset.rowIdx, 10);
            }
            const q = btn.dataset.gfx;
            if (typeof sfx !== 'undefined') sfx.playHit(false);
            if (typeof applyGraphicsSettings === 'function') applyGraphicsSettings(q);
            if (typeof graphicsQuality !== 'undefined') graphicsQuality = q;
            settingsGraphicsSignal.value = q;
            try { localStorage.setItem('ek3d_graphics_quality', q); } catch (_) {}
            updateSettingsUI();
        };
    });

    // 5f. AI Pickers (Controls tab)
    document.querySelectorAll('.gfx-segment-btn[data-ai]').forEach(btn => {
        btn.onclick = () => {
            const row = btn.closest('.settings-row');
            if (row && row.dataset.rowIdx !== undefined) {
                settingsFocusedRow = parseInt(row.dataset.rowIdx, 10);
            }
            const ai = btn.dataset.ai;
            if (typeof sfx !== 'undefined') sfx.playHit(false);
            if (typeof aiDifficulty !== 'undefined') aiDifficulty = ai;
            settingsAiDiffSignal.value = ai;
            try { localStorage.setItem('ek3d_ai_difficulty', ai); } catch (_) {}
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
            activateFocusedSettingRow(1);
        };
    }
}

// 6. VOLCANIC FLOATING EMBERS CANVAS ANIMATION
function startSettingsEmbers() {
    if (!settingsEmbersFxSignal.value || settingsEmbersRunning) return;
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

function clearAndStopSettingsEmbers() {
    stopSettingsEmbers();
    const canvas = document.getElementById('settingsCanvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
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
            toggleDisplayMode();
        };
    }

    const btnSound = document.getElementById('btnSettingsSoundToggle');
    if (btnSound) {
        btnSound.onclick = () => {
            applySettingValue('soundEnabled', !settingsSoundSignal.value, true);
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

        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
            e.preventDefault();
            settingsFocusedRow -= 1;
            updateSettingsRowFocus();
            if (typeof sfx !== 'undefined') sfx.playHit(false);
            return;
        }

        if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
            e.preventDefault();
            settingsFocusedRow += 1;
            updateSettingsRowFocus();
            if (typeof sfx !== 'undefined') sfx.playHit(false);
            return;
        }

        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
            e.preventDefault();
            activateFocusedSettingRow(-1);
            return;
        }

        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
            e.preventDefault();
            activateFocusedSettingRow(1);
            return;
        }

        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            activateFocusedSettingRow(1);
            return;
        }

        if (e.key === 'Tab') {
            e.preventDefault();
            // Basculer d'onglet
            const curIdx = SETTINGS_TABS.findIndex(t => t.key === settingsActiveTabSignal.value);
            const nextIdx = (curIdx + (e.shiftKey ? -1 + SETTINGS_TABS.length : 1)) % SETTINGS_TABS.length;
            settingsActiveTabSignal.value = SETTINGS_TABS[nextIdx].key;
            settingsFocusedRow = 0;
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
