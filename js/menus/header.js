/* ============================================================================
 * MENU : MENU PAUSE & OPTIONS EN COMBAT (REDESIGNED PREHISTORIC OVERHAUL)
 * Graphic elements unified from Main Menu (Bone-jointed stone slabs, floating
 * volcanic embers, creeping vines, Primal Clash crest) and Settings (Carved
 * title plaque with glowing runes, monolith slab, bone audio capsule switch).
 * ============================================================================ */

const pauseOpenSignal = UIKit.signal(false);
const pauseAudioEnabledSignal = UIKit.signal(true);
const pauseFocusIndexSignal = UIKit.signal(0);

let pauseFocusIdx = 0;
let pauseEmbersRunning = false;
let pauseEmbersAnimId = null;

const TOP_PAUSE_VINES_SVG = `
    <svg viewBox="0 0 1200 36" preserveAspectRatio="none" class="w-full h-6 absolute top-0 left-0 pointer-events-none opacity-85 z-10">
        <path d="M0 6 Q150 20 300 8 Q450 24 600 10 Q750 22 900 8 Q1050 20 1200 6" fill="none" stroke="#166534" stroke-width="4"/>
        <path d="M0 4 Q150 18 300 6 Q450 22 600 8 Q750 20 900 6 Q1050 18 1200 4" fill="none" stroke="#22c55e" stroke-width="1.8"/>
        <polygon points="120,14 126,26 114,28" fill="#15803d"/>
        <polygon points="280,8 290,22 278,24" fill="#22c55e"/>
        <polygon points="420,18 430,30 416,32" fill="#16a34a"/>
        <polygon points="680,14 692,26 678,28" fill="#22c55e"/>
        <polygon points="850,10 860,24 848,26" fill="#15803d"/>
        <polygon points="1020,16 1032,28 1018,30" fill="#16a34a"/>
    </svg>
`;

const pauseModalRoot = new UIKit.Dialog({
    id: 'pauseModal',
    open: pauseOpenSignal,
    className: 'hidden pause-stage-overlay fixed inset-0 select-none overflow-hidden',
    innerHTML: `
        <!-- Floating Volcanic Embers Canvas matching Main Menu & Settings -->
        <canvas id="pauseCanvas"></canvas>

        <!-- Top Prehistoric Creeping Vine Garland -->
        ${TOP_PAUSE_VINES_SVG}

        <!-- Center Monolith Stone Slab Container matching Settings -->
        <div class="pause-monolith-card" id="pauseMonolithCard">
            <!-- Subtle Watermark Primal Clash Logo matching Main Menu -->
            <img src="assets/ui/primal_clash_logo.png" alt="" class="pause-logo-watermark">

            <!-- Carved Title Plaque Header matching Settings -->
            <div class="pause-header-box">
                <div class="pause-title-plaque-wrapper">
                    <img src="assets/ui/pause_title_plaque_base.png" alt="PAUSE" class="pause-title-plaque-bg">
                    <div class="pause-title-content">
                        <h2 class="pause-title-text">PAUSE</h2>
                        <span class="pause-subtitle-text">KOMBAT SUSPENDU</span>
                    </div>
                </div>
                <button type="button" id="btnPauseClose" class="pause-close-btn" title="Fermer (Échap)">✕</button>
            </div>

            <!-- List of Prehistoric Bone-Jointed Stone Slabs matching Main Menu -->
            <div class="pause-options-list" id="pauseOptionsList">
                <!-- 1. Reprendre -->
                <button type="button" id="btnPauseResume" class="stone-slab-btn pause-bone-btn active" data-pause-idx="0">
                    <div class="pause-bone-btn-left">
                        <span class="pause-bone-btn-icon text-amber-400">▶</span>
                        <span class="pause-bone-btn-label">REPRENDRE LE KOMBAT</span>
                    </div>
                    <span class="pause-bone-btn-right text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]">[START / ÉCHAP]</span>
                </button>

                <!-- 2. Grimoire -->
                <button type="button" id="btnPauseMoves" class="stone-slab-btn pause-bone-btn" data-pause-idx="1">
                    <div class="pause-bone-btn-left">
                        <span class="pause-bone-btn-icon text-amber-300">📜</span>
                        <span class="pause-bone-btn-label">GRIMOIRE DES COUPS & COMBOS</span>
                    </div>
                    <span class="pause-bone-btn-right text-stone-400">▶</span>
                </button>

                <!-- 3. Paramètres -->
                <button type="button" id="btnPauseSettings" class="stone-slab-btn pause-bone-btn" data-pause-idx="2">
                    <div class="pause-bone-btn-left">
                        <span class="pause-bone-btn-icon text-amber-300">⚙️</span>
                        <span class="pause-bone-btn-label">PARAMÈTRES (OPTIONS)</span>
                    </div>
                    <span class="pause-bone-btn-right text-amber-400">▶</span>
                </button>

                <!-- 4. Audio avec Toggle Capsule de la fenêtre Paramètres -->
                <button type="button" id="btnPauseAudio" class="stone-slab-btn pause-bone-btn" data-pause-idx="3">
                    <div class="pause-bone-btn-left">
                        <span class="pause-bone-btn-icon" id="pauseSoundIcon">🔊</span>
                        <span class="pause-bone-btn-label">SON & EFFETS RAPIDES</span>
                    </div>
                    <div class="pause-audio-capsule" id="pauseAudioCapsule">
                        <span class="pause-capsule-btn active" id="pauseAudioBtnOn">ON</span>
                        <span class="pause-capsule-btn inactive" id="pauseAudioBtnOff">OFF</span>
                    </div>
                </button>

                <!-- 5. Caméra 3D -->
                <button type="button" id="btnPauseResetCam" class="stone-slab-btn pause-bone-btn" data-pause-idx="4">
                    <div class="pause-bone-btn-left">
                        <span class="pause-bone-btn-icon text-cyan-300">🎥</span>
                        <span class="pause-bone-btn-label">RÉINITIALISER CAMÉRA 3D</span>
                    </div>
                    <span class="pause-bone-btn-right text-cyan-400">3/4 PROFIL</span>
                </button>

                <!-- 6. Recommencer -->
                <button type="button" id="btnPauseRestart" class="stone-slab-btn pause-bone-btn" data-pause-idx="5">
                    <div class="pause-bone-btn-left">
                        <span class="pause-bone-btn-icon text-amber-400">🔄</span>
                        <span class="pause-bone-btn-label">RECOMMENCER LE COMBAT</span>
                    </div>
                    <span class="pause-bone-btn-right text-amber-400">ROUND 1</span>
                </button>

                <!-- 7. Sélection Combattants -->
                <button type="button" id="btnPauseSelect" class="stone-slab-btn pause-bone-btn" data-pause-idx="6">
                    <div class="pause-bone-btn-left">
                        <span class="pause-bone-btn-icon text-emerald-400">🦖</span>
                        <span class="pause-bone-btn-label">SÉLECTION COMBATTANTS</span>
                    </div>
                    <span class="pause-bone-btn-right text-stone-400">▶</span>
                </button>

                <!-- 8. Menu Principal -->
                <button type="button" id="btnPauseMainMenu" class="stone-slab-btn pause-bone-btn" data-pause-idx="7">
                    <div class="pause-bone-btn-left">
                        <span class="pause-bone-btn-icon text-red-400">🏠</span>
                        <span class="pause-bone-btn-label text-red-200">QUITTER VERS LE MENU</span>
                    </div>
                    <span class="pause-bone-btn-right text-red-400 font-black">▶</span>
                </button>
            </div>

            <!-- Footer Bar with Controller Glyphs matching Settings & Main Menu -->
            <div class="pause-footer-bar">
                <div class="pause-footer-prompts">
                    <div class="pause-footer-prompt-item">
                        <span class="glyph-badge glyph-badge-a">[A]</span>
                        <span>VALIDER</span>
                    </div>
                    <span class="text-stone-600">|</span>
                    <div class="pause-footer-prompt-item">
                        <span class="glyph-badge glyph-badge-b">[B]</span>
                        <span>REPRENDRE</span>
                    </div>
                    <span class="text-stone-600">|</span>
                    <div class="pause-footer-prompt-item">
                        <span class="glyph-badge glyph-badge-x">[↑↓]</span>
                        <span>NAVIGUER</span>
                    </div>
                </div>
                <span class="pause-footer-version">v1.04</span>
            </div>
        </div>
    `
});

// Monter la modale dans le DOM
pauseModalRoot.mount(document.getElementById('appMain'), 'afterend');

// ============================================================================
// EMBERS ANIMATION FOR PAUSE SCREEN
// ============================================================================
function startPauseEmbers() {
    if (pauseEmbersRunning) return;
    const canvas = document.getElementById('pauseCanvas');
    if (!canvas) return;

    pauseEmbersRunning = true;
    const ctx = canvas.getContext('2d');
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const onResize = () => {
        if (!pauseEmbersRunning) return;
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);

    const PARTICLE_COUNT = 32;
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
            radius: Math.random() * 2.4 + 0.9,
            baseSpeedY: Math.random() * 0.75 + 0.3,
            speedX: (Math.random() - 0.45) * 0.6,
            colorPrefix: colors[Math.floor(Math.random() * colors.length)],
            alpha: Math.random() * 0.75 + 0.2,
            fadeSpeed: Math.random() * 0.015 + 0.005,
            fadingIn: Math.random() > 0.5,
            wiggleAmp: Math.random() * 1.5 + 0.5,
            wiggleSpeed: Math.random() * 0.03 + 0.01,
            seed: Math.random() * 100
        });
    }

    function renderEmbers(time) {
        if (!pauseEmbersRunning) return;
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

        pauseEmbersAnimId = requestAnimationFrame(renderEmbers);
    }

    pauseEmbersAnimId = requestAnimationFrame(renderEmbers);
}

function stopPauseEmbers() {
    pauseEmbersRunning = false;
    if (pauseEmbersAnimId) {
        cancelAnimationFrame(pauseEmbersAnimId);
        pauseEmbersAnimId = null;
    }
    const canvas = document.getElementById('pauseCanvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
}

// ============================================================================
// AUDIO UI SYNCHRONIZATION
// ============================================================================
function updatePauseAudioUI() {
    const isEnabled = typeof sfx !== 'undefined' ? Boolean(sfx.enabled) : true;
    pauseAudioEnabledSignal.value = isEnabled;

    const icon = document.getElementById('pauseSoundIcon');
    if (icon) icon.textContent = isEnabled ? '🔊' : '🔇';

    const btnOn = document.getElementById('pauseAudioBtnOn');
    const btnOff = document.getElementById('pauseAudioBtnOff');
    if (btnOn && btnOff) {
        btnOn.className = `pause-capsule-btn ${isEnabled ? 'active' : 'inactive'}`;
        btnOff.className = `pause-capsule-btn ${!isEnabled ? 'active' : 'inactive'}`;
    }
}

// ============================================================================
// OPEN / CLOSE / TOGGLE
// ============================================================================
function openPauseMenu() {
    isMatchPaused = true;
    pauseOpenSignal.value = true;
    const modal = document.getElementById('pauseModal');
    if (modal) {
        modal.classList.remove('hidden');
    }
    updatePauseAudioUI();
    pauseFocusIdx = 0;
    pauseFocusIndexSignal.value = 0;
    updatePauseFocus();
    startPauseEmbers();

    if (typeof sfx !== 'undefined' && typeof sfx.playHit === 'function') {
        sfx.playHit(false);
    }
}

function closePauseMenu() {
    isMatchPaused = false;
    pauseOpenSignal.value = false;
    const modal = document.getElementById('pauseModal');
    if (modal) {
        modal.classList.add('hidden');
    }
    stopPauseEmbers();
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
    pauseFocusIndexSignal.value = pauseFocusIdx;
    const buttons = getPauseNavButtons();
    buttons.forEach((btn, idx) => {
        const isActive = idx === pauseFocusIdx;
        btn.classList.toggle('active', isActive);
    });
}

// ============================================================================
// INITIALIZATION OF EVENT LISTENERS
// ============================================================================
function initHeaderMenu() {
    const btnResume = document.getElementById('btnPauseResume');
    if (btnResume) btnResume.addEventListener('click', closePauseMenu);

    const btnClose = document.getElementById('btnPauseClose');
    if (btnClose) btnClose.addEventListener('click', closePauseMenu);

    const btnMoves = document.getElementById('btnPauseMoves');
    if (btnMoves) {
        btnMoves.addEventListener('click', () => {
            if (typeof sfx !== 'undefined' && typeof sfx.playHit === 'function') sfx.playHit(false);
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
            if (typeof sfx !== 'undefined' && typeof sfx.playHit === 'function') sfx.playHit(false);
            if (typeof openSettingsModal === 'function') openSettingsModal();
        });
    }

    const btnAudio = document.getElementById('btnPauseAudio');
    if (btnAudio) {
        btnAudio.addEventListener('click', () => {
            if (typeof sfx !== 'undefined') {
                sfx.enabled = !sfx.enabled;
                if (typeof sfx.setMasterVolume === 'function') {
                    sfx.setMasterVolume(sfx.enabled ? 0.8 : 0);
                }
                updatePauseAudioUI();
                if (sfx.enabled && typeof sfx.playHit === 'function') {
                    sfx.playHit(false);
                }
            }
        });
    }

    const btnResetCam = document.getElementById('btnPauseResetCam');
    if (btnResetCam) {
        btnResetCam.addEventListener('click', () => {
            if (typeof camOrbit !== 'undefined') {
                camOrbit = { yaw: 0, pitch: 0.12 };
            }
            if (typeof sfx !== 'undefined' && typeof sfx.playHit === 'function') sfx.playHit(false);
            if (typeof spawnFloatingPopup === 'function') {
                spawnFloatingPopup(0, "🎥 Caméra réinitialisée", '#38bdf8');
            }
            closePauseMenu();
        });
    }

    const btnRestart = document.getElementById('btnPauseRestart');
    if (btnRestart) {
        btnRestart.addEventListener('click', () => {
            closePauseMenu();
            if (typeof startMatch === 'function') startMatch();
        });
    }

    const btnSelect = document.getElementById('btnPauseSelect');
    if (btnSelect) {
        btnSelect.addEventListener('click', () => {
            closePauseMenu();
            if (typeof returnToSelect === 'function') returnToSelect();
        });
    }

    const btnMainMenu = document.getElementById('btnPauseMainMenu');
    if (btnMainMenu) {
        btnMainMenu.addEventListener('click', () => {
            closePauseMenu();
            if (typeof goToMainMenu === 'function') goToMainMenu();
        });
    }

    // Hover listener on buttons to synchronize focus with mouse
    const buttons = getPauseNavButtons();
    buttons.forEach((btn, idx) => {
        btn.addEventListener('mouseenter', () => {
            pauseFocusIdx = idx;
            updatePauseFocus();
        });
    });
}
