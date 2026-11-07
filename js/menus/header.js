/* ============================================================================
 * MENU : MENU PAUSE & OPTIONS EN COMBAT (TRIGGERED BY ESCAPE / START)
 * Ported to @pmndrs/uikit (UIKit.Dialog, UIKit.Card, UIKit.Button, UIKit.Signal).
 * ============================================================================ */

const pauseOpenSignal = UIKit.signal(false);
const pauseAudioEnabledSignal = UIKit.signal(true);
const pauseFocusIndexSignal = UIKit.signal(0);

const PAUSE_OPTIONS_CONFIG = [
    {
        id: 'btnPauseResume',
        className: 'stone-slab-btn w-full py-2.5 px-4 flex items-center justify-between text-left text-xs sm:text-sm active',
        icon: '▶',
        label: 'REPRENDRE LE KOMBAT',
        labelClass: 'font-black tracking-wide text-amber-100',
        rightText: '[START / ÉCHAP]',
        rightClass: 'text-[10px] text-amber-400 font-bold'
    },
    {
        id: 'btnPauseMoves',
        className: 'stone-slab-btn w-full py-2.5 px-4 flex items-center justify-between text-left text-xs sm:text-sm',
        icon: '📜',
        label: 'GRIMOIRE DES COUPS & COMBOS',
        labelClass: 'font-bold tracking-wide text-stone-200',
        rightText: '▶',
        rightClass: 'text-xs text-stone-400'
    },
    {
        id: 'btnPauseSettings',
        className: 'stone-slab-btn w-full py-2.5 px-4 flex items-center justify-between text-left text-xs sm:text-sm',
        icon: '⚙️',
        label: 'PARAMÈTRES (GRAPHISMES, IA)',
        labelClass: 'font-bold tracking-wide text-stone-200',
        rightText: '▶',
        rightClass: 'text-xs text-stone-400'
    },
    {
        id: 'btnPauseAudio',
        className: 'stone-slab-btn w-full py-2.5 px-4 flex items-center justify-between text-left text-xs sm:text-sm',
        iconId: 'pauseSoundIcon',
        icon: UIKit.computed(() => pauseAudioEnabledSignal.value ? '🔊' : '🔇'),
        label: 'SON & EFFETS SPÉCIAUX',
        labelClass: 'font-bold tracking-wide text-stone-200',
        rightId: 'pauseSoundLabel',
        rightText: UIKit.computed(() => pauseAudioEnabledSignal.value ? 'ACTIVÉ' : 'COUPÉ'),
        rightClass: UIKit.computed(() => `text-xs font-black ${pauseAudioEnabledSignal.value ? 'text-amber-400' : 'text-stone-500'}`)
    },
    {
        id: 'btnPauseResetCam',
        className: 'stone-slab-btn w-full py-2 px-4 flex items-center justify-between text-left text-xs text-stone-300',
        icon: '🎥',
        label: 'RÉINITIALISER LA CAMÉRA 3D',
        labelClass: 'font-bold tracking-wide',
        rightText: '3/4 PROFIL',
        rightClass: 'text-xs text-cyan-400'
    },
    {
        id: 'btnPauseRestart',
        className: 'stone-slab-btn w-full py-2 px-4 flex items-center justify-between text-left text-xs text-stone-300',
        icon: '🔄',
        label: 'RECOMMENCER LE KOMBAT',
        labelClass: 'font-bold tracking-wide',
        rightText: 'ROUND 1',
        rightClass: 'text-xs text-amber-400'
    },
    {
        id: 'btnPauseSelect',
        className: 'stone-slab-btn w-full py-2.5 px-4 flex items-center justify-between text-left text-xs sm:text-sm',
        icon: '🦖',
        label: 'SÉLECTION DES COMBATTANTS',
        labelClass: 'font-bold tracking-wide text-stone-200',
        rightText: '▶',
        rightClass: 'text-xs text-stone-400'
    },
    {
        id: 'btnPauseMainMenu',
        className: 'stone-slab-btn w-full py-2.5 px-4 flex items-center justify-between text-left text-xs sm:text-sm text-red-300 hover:text-white',
        icon: '🏠',
        label: 'QUITTER VERS LE MENU PRINCIPAL',
        labelClass: 'font-bold tracking-wide',
        rightText: '▶',
        rightClass: 'text-xs text-red-400'
    }
];

const pauseModalRoot = new UIKit.Dialog({
    id: 'pauseModal',
    open: pauseOpenSignal,
    className: 'hidden fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 select-none',
    children: [
        new UIKit.Card({
            className: 'stone-panel rounded-2xl max-w-md w-full flex flex-col overflow-hidden border-2 border-amber-500/80 shadow-[0_0_60px_rgba(0,0,0,0.95)]',
            create3DMesh: true,
            backgroundColor: '#15161e',
            borderColor: '#f59e0b',
            borderWidth: 2,
            borderRadius: 16,
            children: [
                // En-tête de stèle sculptée
                new UIKit.Container({
                    className: 'p-4 border-b border-stone-800 bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950 flex items-center justify-between',
                    children: [
                        new UIKit.Container({
                            className: 'flex items-center gap-3',
                            children: [
                                new UIKit.Container({
                                    className: 'w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 via-red-600 to-black p-0.5 flex items-center justify-center border border-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.6)]',
                                    children: [
                                        new UIKit.Text({ tag: 'span', className: 'font-cinzel text-xs font-black text-amber-100', text: 'EK' })
                                    ]
                                }),
                                new UIKit.Container({
                                    children: [
                                        new UIKit.Text({
                                            tag: 'h3',
                                            className: 'font-cinzel text-lg sm:text-xl font-black text-amber-300 tracking-wider',
                                            text: 'KOMBAT EN PAUSE'
                                        }),
                                        new UIKit.Text({
                                            tag: 'p',
                                            className: 'font-chakra text-[10px] text-amber-400/80 uppercase tracking-widest font-bold',
                                            text: 'Options & Commandes de Jeu'
                                        })
                                    ]
                                })
                            ]
                        }),
                        new UIKit.Button({
                            id: 'btnPauseClose',
                            className: 'w-8 h-8 rounded-lg bg-stone-900 hover:bg-red-950 border border-stone-700 hover:border-red-500 text-stone-300 hover:text-red-300 font-bold text-sm flex items-center justify-center transition',
                            text: '✕'
                        })
                    ]
                }),

                // Liste des dalles d'options
                new UIKit.Container({
                    id: 'pauseOptionsList',
                    className: 'p-4 space-y-2 font-chakra',
                    flexDirection: 'column',
                    gap: 8,
                    children: PAUSE_OPTIONS_CONFIG.map((opt) => new UIKit.Button({
                        id: opt.id,
                        className: opt.className,
                        children: [
                            new UIKit.Container({
                                tag: 'span',
                                className: 'flex items-center gap-2.5',
                                children: [
                                    new UIKit.Text({
                                        id: opt.iconId,
                                        tag: 'span',
                                        className: 'text-sm',
                                        text: opt.icon
                                    }),
                                    new UIKit.Text({
                                        tag: 'span',
                                        className: opt.labelClass,
                                        text: opt.label
                                    })
                                ]
                            }),
                            new UIKit.Text({
                                id: opt.rightId,
                                tag: 'span',
                                className: opt.rightClass,
                                text: opt.rightText
                            })
                        ]
                    }))
                }),

                // Barre de commandes manette / clavier inférieure
                new UIKit.Container({
                    className: 'p-3 border-t border-stone-800 bg-stone-950 flex flex-wrap items-center justify-between gap-2 text-[11px] text-stone-400 font-chakra',
                    children: [
                        new UIKit.Container({
                            tag: 'span',
                            className: 'flex items-center gap-1.5',
                            children: [
                                new UIKit.Badge({ className: 'px-1.5 py-0.2 rounded bg-stone-800 text-amber-400 font-black', text: '↑↓ / D-PAD' }),
                                new UIKit.Text({ text: 'Naviguer' })
                            ]
                        }),
                        new UIKit.Container({
                            tag: 'span',
                            className: 'flex items-center gap-1.5',
                            children: [
                                new UIKit.Badge({ className: 'px-1.5 py-0.2 rounded bg-emerald-700 text-white font-black', text: '[A] / ENTRÉE' }),
                                new UIKit.Text({ text: 'Valider' })
                            ]
                        }),
                        new UIKit.Container({
                            tag: 'span',
                            className: 'flex items-center gap-1.5',
                            children: [
                                new UIKit.Badge({ className: 'px-1.5 py-0.2 rounded bg-red-700 text-white font-black', text: '[B] / ÉCHAP' }),
                                new UIKit.Text({ text: 'Reprendre' })
                            ]
                        })
                    ]
                })
            ]
        })
    ]
});

pauseModalRoot.mount(document.getElementById('appMain'), 'afterend');

let pauseFocusIdx = 0;

function updatePauseAudioUI() {
    pauseAudioEnabledSignal.value = Boolean(sfx.enabled);
}

function openPauseMenu() {
    isMatchPaused = true;
    pauseOpenSignal.value = true;
    const modal = document.getElementById('pauseModal');
    if (modal) modal.classList.remove('hidden');
    updatePauseAudioUI();
    pauseFocusIdx = 0;
    pauseFocusIndexSignal.value = 0;
    updatePauseFocus();
    sfx.playHit(false);
}

function closePauseMenu() {
    isMatchPaused = false;
    pauseOpenSignal.value = false;
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
    pauseFocusIndexSignal.value = pauseFocusIdx;
    const buttons = getPauseNavButtons();
    buttons.forEach((btn, idx) => {
        btn.classList.toggle('active', idx === pauseFocusIdx);
    });
}

function initHeaderMenu() {
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
