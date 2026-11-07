/* ============================================================================
 * MENU : ÉCRAN PRINCIPAL (MAIN MENU) — PORTED TO @pmndrs/uikit
 * 1 Joueur (Campagne & Joueur vs IA), 2 Joueurs (1vs1), Paramètres & Grimoire.
 * ============================================================================ */

const mainMenuActiveSlabSignal = UIKit.signal(0);
const mainMenuVisibleSignal = UIKit.signal(true);

const TOP_VINE_GARLAND_SVG = `
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
`;

const BOTTOM_LEFT_BONES_SVG = `
    <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-[0_4px_8px_rgba(0,0,0,0.95)]">
        <path d="M10 90 Q30 70 20 40" fill="none" stroke="#fef3c7" stroke-width="5" stroke-linecap="round"/>
        <path d="M22 92 Q42 68 34 35" fill="none" stroke="#fef3c7" stroke-width="4.5" stroke-linecap="round"/>
        <path d="M36 94 Q56 70 48 42" fill="none" stroke="#fde68a" stroke-width="4" stroke-linecap="round"/>
        <path d="M5 95 Q35 75 25 35" fill="none" stroke="#16a34a" stroke-width="2.5"/>
    </svg>
`;

const FEMUR_BONE_SVG = `
    <svg viewBox="0 0 32 180" class="w-full h-full drop-shadow-[0_4px_8px_rgba(0,0,0,0.95)]">
        <ellipse cx="10" cy="14" rx="8" ry="12" fill="#fef3c7" stroke="#78350f" stroke-width="1.5"/>
        <ellipse cx="22" cy="14" rx="8" ry="12" fill="#fef3c7" stroke="#78350f" stroke-width="1.5"/>
        <rect x="10" y="14" width="12" height="152" fill="#fde68a" stroke="#78350f" stroke-width="1.2"/>
        <ellipse cx="10" cy="166" rx="8" ry="12" fill="#fef3c7" stroke="#78350f" stroke-width="1.5"/>
        <ellipse cx="22" cy="166" rx="8" ry="12" fill="#fef3c7" stroke="#78350f" stroke-width="1.5"/>
        <rect x="8" y="55" width="16" height="5" fill="#78350f" rx="2"/>
        <rect x="8" y="115" width="16" height="5" fill="#78350f" rx="2"/>
    </svg>
`;

const MAIN_MENU_SLAB_DEFS = [
    { id: 'btnMenuCampaign', label: 'CAMPAIGN', isDefaultActive: true },
    { id: 'btnMenuVersus', label: 'VERSUS' },
    { id: 'btnMenuTraining', label: 'TRAINING' },
    { id: 'btnMenuRoster', label: 'ROSTER & CUSTOMIZATION' },
    { id: 'btnMenuSettings', label: 'OPTIONS' },
    { id: 'btnMenuExit', label: 'EXIT' }
];

function createMainMenuSlabButton(def, idx) {
    const baseClasses = `stone-slab-btn bone-joint-slab ${def.isDefaultActive ? 'active ' : ''}w-full py-2.5 sm:py-3.5 px-6 flex items-center justify-center text-center text-xs sm:text-sm font-black tracking-widest relative`;

    return new UIKit.Button({
        id: def.id,
        className: baseClasses,
        children: [
            new UIKit.Text({
                tag: 'span',
                className: 'font-black tracking-widest uppercase select-none pointer-events-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]',
                text: def.label
            })
        ]
    });
}

const mainMenuRoot = new UIKit.Fullscreen({
    id: 'mainMenu',
    tag: 'section',
    hidden: UIKit.computed(() => !mainMenuVisibleSignal.value),
    className: 'main-menu-stage-bg w-full h-full flex flex-col justify-between p-3 sm:p-6 pb-2 select-none relative z-10 overflow-hidden',
    flexDirection: 'column',
    justifyContent: 'space-between',
    children: [
// Prehistoric creeping vines & bones frame border overlay - omitted as the background already includes the frame

        // Dynamic Interactive Canvas for Floating Volcanic Embers & Sparks
        new UIKit.Container({
            id: 'mainMenuCanvasContainer',
            className: 'absolute inset-0 pointer-events-none z-10 overflow-hidden'
        }),

        // MAIN MENU CONTENT: TWO COLUMNS (LEFT: BUTTONS, RIGHT: PRIMAL CLASH LOGO)
        new UIKit.Container({
            className: 'w-full flex-1 flex flex-col md:flex-row items-center justify-between gap-6 my-auto relative z-20 px-4 sm:px-10 lg:px-14',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            children: [
                // LEFT COLUMN: VERTICAL STACK OF 6 CHISELED STONE SLAB BUTTONS
                new UIKit.Container({
                    className: 'w-full md:w-80 lg:w-96 flex flex-col gap-3 sm:gap-4 z-20 py-2 my-auto',
                    flexDirection: 'column',
                    gap: 14,
                    children: MAIN_MENU_SLAB_DEFS.map((def, idx) => createMainMenuSlabButton(def, idx))
                }),

                // RIGHT COLUMN: THE MAJESTIC PRIMAL CLASH LOGO OVER DINOSAURS
                new UIKit.Container({
                    className: 'w-full md:w-[460px] lg:w-[540px] flex items-center justify-center relative z-20 my-auto pointer-events-none',
                    children: [
                        new UIKit.Container({
                            className: 'primal-clash-logo-container w-full max-w-[500px]',
                            children: [
                                new UIKit.Image({
                                    src: 'assets/ui/primal_clash_logo.png',
                                    className: 'primal-clash-logo-img drop-shadow-[0_15px_35px_rgba(0,0,0,0.95)]'
                                })
                            ]
                        })
                    ]
                })
            ]
        }),

        // BOTTOM CONTROLS & VERSION BAR
        new UIKit.Container({
            className: 'w-full px-4 sm:px-8 py-2 flex flex-wrap items-center justify-between gap-3 text-xs z-30 shrink-0 select-none pointer-events-none',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            children: [
                new UIKit.Container({
                    className: 'flex-1',
                }),
                new UIKit.Container({
                    className: 'flex items-center justify-center gap-2 font-chakra text-xs sm:text-sm font-black tracking-wider mx-auto drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]',
                    children: [
                        new UIKit.Text({ tag: 'span', className: 'text-stone-300 font-bold', text: 'PRESS' }),
                        new UIKit.Badge({ className: 'px-2 py-0.5 rounded bg-emerald-600 text-white font-black text-xs shadow-[0_0_10px_#22c55e]', text: '[A]' }),
                        new UIKit.Text({ tag: 'span', className: 'text-amber-400 font-bold', text: 'TO SELECT' }),
                        new UIKit.Text({ tag: 'span', className: 'text-stone-500 font-normal', text: '|' }),
                        new UIKit.Badge({ className: 'px-2 py-0.5 rounded bg-red-600 text-white font-black text-xs shadow-[0_0_10px_#ef4444]', text: '[B]' }),
                        new UIKit.Text({ tag: 'span', className: 'text-stone-300 font-bold', text: 'TO GO BACK' })
                    ]
                }),
                new UIKit.Container({
                    className: 'flex-1 flex justify-end items-center',
                    children: [
                        new UIKit.Text({
                            tag: 'span',
                            className: 'text-stone-400 font-chakra text-xs font-bold tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]',
                            text: 'v0.2'
                        })
                    ]
                })
            ]
        })
    ]
});

mainMenuRoot.mount(document.getElementById('appMain'));

function selectMainMenuSlab(btn) {
    if (!btn) return;
    const slabButtons = document.querySelectorAll('#mainMenu .stone-slab-btn');
    slabButtons.forEach((b, idx) => {
        const isMatch = (b === btn);
        b.classList.toggle('active', isMatch);
        b.classList.toggle('selected', isMatch);
        if (isMatch) {
            mainMenuActiveSlabSignal.value = idx;
            if (typeof mainMenuFocusIdx !== 'undefined') {
                mainMenuFocusIdx = idx;
            }
        }
    });
}

function startMainMenuEmberCanvas() {
    const container = document.getElementById('mainMenuCanvasContainer');
    if (!container) return;
    if (document.getElementById('mainMenuCanvas')) return;

    const canvas = document.createElement('canvas');
    canvas.id = 'mainMenuCanvas';
    canvas.className = 'absolute inset-0 pointer-events-none z-10 w-full h-full';
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });

    const PARTICLE_COUNT = 45;
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
            radius: Math.random() * 2.8 + 1.2,
            baseSpeedY: Math.random() * 0.9 + 0.4,
            speedX: (Math.random() - 0.45) * 0.8,
            colorPrefix: colors[Math.floor(Math.random() * colors.length)],
            alpha: Math.random() * 0.8 + 0.2,
            fadeSpeed: (Math.random() * 0.015 + 0.005),
            fadingIn: Math.random() > 0.5,
            wiggleAmp: Math.random() * 1.5 + 0.5,
            wiggleSpeed: Math.random() * 0.03 + 0.01,
            seed: Math.random() * 100
        });
    }

    function renderEmbers(time) {
        if (!mainMenuVisibleSignal.value) {
            requestAnimationFrame(renderEmbers);
            return;
        }

        ctx.clearRect(0, 0, width, height);

        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            p.y -= p.baseSpeedY;
            p.x += Math.sin(time * 0.001 * p.wiggleSpeed + p.seed) * p.wiggleAmp * 0.4 + p.speedX;

            if (p.fadingIn) {
                p.alpha += p.fadeSpeed;
                if (p.alpha >= 0.9) p.fadingIn = false;
            } else {
                p.alpha -= p.fadeSpeed;
                if (p.alpha <= 0.15) p.fadingIn = true;
            }

            if (p.y < -10 || p.x < -10 || p.x > width + 10) {
                p.y = height + Math.random() * 20;
                p.x = Math.random() * width;
                p.alpha = 0.1;
                p.fadingIn = true;
            }

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = p.colorPrefix + p.alpha.toFixed(2) + ')';
            ctx.shadowBlur = p.radius * 3.5;
            ctx.shadowColor = 'rgba(255, 100, 0, 0.8)';
            ctx.fill();
        }

        requestAnimationFrame(renderEmbers);
    }

    requestAnimationFrame(renderEmbers);
}

function initMainMenu() {
    startMainMenuEmberCanvas();

    const slabButtons = document.querySelectorAll('#mainMenu .stone-slab-btn');
    slabButtons.forEach((btn, idx) => {
        btn.addEventListener('mouseenter', () => {
            if (mainMenuActiveSlabSignal.value !== idx) {
                if (typeof sfx !== 'undefined' && sfx.playHit) sfx.playHit(false);
            }
            selectMainMenuSlab(btn);
            if (typeof setGamepadFocus === 'function') {
                setGamepadFocus(btn);
            }
        });
    });

    // 1. Campagne d'Extinction (Road Through Time)
    const btnCamp = document.getElementById('btnMenuCampaign');
    if (btnCamp) {
        btnCamp.addEventListener('click', () => {
            selectMainMenuSlab(btnCamp);
            sfx.playGong();
            gameMode = 'campaign';
            if (typeof openCampaignMap === 'function') {
                openCampaignMap();
            } else {
                startCampaignMode();
            }
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

    // 3. Joueur vs IA / Entraînement
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

    // 8. Exit
    const btnExit = document.getElementById('btnMenuExit');
    if (btnExit) {
        btnExit.addEventListener('click', () => {
            selectMainMenuSlab(btnExit);
            sfx.playHit(false);
            if (typeof showGamepadToast === 'function') {
                showGamepadToast("Extinction Kombat : À bientôt !");
            }
        });
    }
}

function startCampaignMode() {
    gameMode = 'campaign';
    campaignStage = 1;

    const available = [];
    for (let i = 0; i < DINO_ROSTER.length; i++) {
        const d = DINO_ROSTER[i];
        if (!d.isBoss && (!d.isUnlockable || isFighterUnlocked(d.id))) {
            available.push(i);
        }
    }
    for (let i = available.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [available[i], available[j]] = [available[j], available[i]];
    }
    campaignOpponents = available.slice(0, 5);

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
    mainMenuVisibleSignal.value = true;
    const headerEl = document.getElementById('gameHeader');
    if (headerEl) headerEl.classList.add('hidden');
    const gpBar = document.getElementById('gamepadHelperBar');
    if (gpBar) gpBar.style.display = 'none';

    document.getElementById('mainMenu').classList.remove('hidden');
    const campEl = document.getElementById('campaignScreen');
    if (campEl) campEl.classList.add('hidden');
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
    mainMenuVisibleSignal.value = false;
    const headerEl = document.getElementById('gameHeader');
    if (headerEl) headerEl.classList.add('hidden');
    if (typeof updateGamepadHelperHUD === 'function') {
        updateGamepadHelperHUD();
    }

    document.getElementById('mainMenu').classList.add('hidden');
    const campEl2 = document.getElementById('campaignScreen');
    if (campEl2) campEl2.classList.add('hidden');
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
