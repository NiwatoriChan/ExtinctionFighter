/* ============================================================================
 * SYSTÈME DE CONTRÔLE MANETTE & CLAVIER UNIFIÉ
 * Prise en charge intégrale de TOUTES les interfaces (Menus, Roster, Arènes,
 * Paramètres, Grimoire, Combat, Écran de Fin) avec manettes standard USB/Bluetooth.
 * ============================================================================ */

// 1. ÉCOUTEURS CLAVIER (Conservés & enrichis)
function handleEscapeOrStartAction() {
    const movesModal = document.getElementById('movesModal');
    const isMovesModalOpen = movesModal && !movesModal.classList.contains('hidden');

    const settingsModal = document.getElementById('settingsModal');
    const isSettingsModalOpen = settingsModal && !settingsModal.classList.contains('hidden');

    const pauseModal = document.getElementById('pauseModal');
    const isPauseOpen = pauseModal && !pauseModal.classList.contains('hidden');

    // 1. Fermer le grimoire des coups
    if (isMovesModalOpen) {
        movesModal.classList.add('hidden');
        if (isMatchPaused && pauseModal) pauseModal.classList.remove('hidden');
        sfx.playHit(false);
        return;
    }

    // 2. Fermer les paramètres
    if (isSettingsModalOpen) {
        if (typeof closeSettingsModal === 'function') closeSettingsModal();
        else settingsModal.classList.add('hidden');
        if (isMatchPaused && pauseModal) pauseModal.classList.remove('hidden');
        sfx.playHit(false);
        return;
    }

    // 3. Si le menu pause est ouvert, reprendre le combat
    if (isPauseOpen) {
        if (typeof closePauseMenu === 'function') closePauseMenu();
        else pauseModal.classList.add('hidden');
        return;
    }

    // 4. En combat ou cinématique : ouvrir le menu pause
    if (matchState === 'fight' || matchState === 'finish_him' || matchState === 'round_over' || matchState === 'intro' || matchState === 'campaign_level') {
        if (typeof openPauseMenu === 'function') openPauseMenu();
        return;
    }

    // 5. Sur l'écran de choix d'arène : retour à la sélection
    if (matchState === 'arena_select') {
        if (typeof returnToSelect === 'function') returnToSelect();
        return;
    }

    // 6. Sur l'écran de sélection : retour au menu principal
    if (matchState === 'select') {
        if (typeof goToMainMenu === 'function') goToMainMenu();
        return;
    }

    // 7. Sur le menu principal : ouvrir les paramètres
    if (matchState === 'main_menu') {
        if (typeof openSettingsModal === 'function') openSettingsModal();
        return;
    }
}

// 1. ÉCOUTEURS CLAVIER (Conservés & enrichis)
window.addEventListener('keydown', (e) => {
    // Empêcher le défilement de la page avec Espace ou les Flèches pendant un combat
    if (matchState !== 'select' && ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
    }
    if (e.repeat) return;

    // Touche Échap (Escape) : Gestionnaire universel de Pause et d'Options
    if (e.code === 'Escape') {
        e.preventDefault();
        handleEscapeOrStartAction();
        return;
    }

    // Navigation au clavier dans le Menu Pause
    const pauseModal = document.getElementById('pauseModal');
    if (pauseModal && !pauseModal.classList.contains('hidden')) {
        const buttons = typeof getPauseNavButtons === 'function' ? getPauseNavButtons() : [];
        if (buttons.length > 0) {
            if (e.code === 'ArrowUp' || e.code === 'KeyW') {
                e.preventDefault();
                pauseFocusIdx = (pauseFocusIdx - 1 + buttons.length) % buttons.length;
                if (typeof updatePauseFocus === 'function') updatePauseFocus();
                sfx.playHit(false);
                return;
            }
            if (e.code === 'ArrowDown' || e.code === 'KeyS') {
                e.preventDefault();
                pauseFocusIdx = (pauseFocusIdx + 1) % buttons.length;
                if (typeof updatePauseFocus === 'function') updatePauseFocus();
                sfx.playHit(false);
                return;
            }
            if (e.code === 'Enter' || e.code === 'Space') {
                e.preventDefault();
                if (buttons[pauseFocusIdx]) buttons[pauseFocusIdx].click();
                return;
            }
        }
        return;
    }

    // Si le match est en pause, bloquer les attaques et mouvements
    if (isMatchPaused) return;

    const now = performance.now();
    keys[e.code] = true;

    // Retour visuel sur les boutons Arcade
    if (e.code === 'KeyA' || e.code === 'KeyQ' || (gameMode !== 'pvp' && e.code === 'ArrowLeft')) flashArcadeButton('uiBtnLeft', true);
    if (e.code === 'KeyD' || (gameMode !== 'pvp' && e.code === 'ArrowRight')) flashArcadeButton('uiBtnRight', true);
    if (e.code === 'KeyW' || e.code === 'KeyZ' || (gameMode !== 'pvp' && e.code === 'ArrowUp')) flashArcadeButton('uiBtnUp', true);
    if (e.code === 'KeyS' || (gameMode !== 'pvp' && e.code === 'ArrowDown')) flashArcadeButton('uiBtnDown', true);

    // Navigation au clavier sur le Menu Principal
    if (matchState === 'main_menu') {
        const movesModal = document.getElementById('movesModal');
        const isMovesOpen = movesModal && !movesModal.classList.contains('hidden');
        const settingsModal = document.getElementById('settingsModal');
        const isSettingsOpen = settingsModal && !settingsModal.classList.contains('hidden');

        if (!isMovesOpen && !isSettingsOpen) {
            const menuButtons = typeof getMainMenuNavElements === 'function' ? getMainMenuNavElements() : [];
            if (menuButtons.length > 0) {
                if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'KeyZ') {
                    e.preventDefault();
                    mainMenuFocusIdx = (mainMenuFocusIdx - 1 + menuButtons.length) % menuButtons.length;
                    sfx.playHit(false);
                    const target = menuButtons[mainMenuFocusIdx];
                    if (target) {
                        setGamepadFocus(target);
                        if (typeof selectMainMenuSlab === 'function') selectMainMenuSlab(target);
                    }
                    return;
                }
                if (e.code === 'ArrowDown' || e.code === 'KeyS') {
                    e.preventDefault();
                    mainMenuFocusIdx = (mainMenuFocusIdx + 1) % menuButtons.length;
                    sfx.playHit(false);
                    const target = menuButtons[mainMenuFocusIdx];
                    if (target) {
                        setGamepadFocus(target);
                        if (typeof selectMainMenuSlab === 'function') selectMainMenuSlab(target);
                    }
                    return;
                }
                if (e.code === 'Enter' || e.code === 'Space') {
                    e.preventDefault();
                    const target = menuButtons[mainMenuFocusIdx];
                    if (target) target.click();
                    return;
                }
            }
        }
    }

    // Validation au clavier (Entrée / Espace) sur l'écran de sélection
    if (matchState === 'select' && (e.code === 'Enter' || e.code === 'Space')) {
        e.preventDefault();
        sfx.playHit(false);
        if (gameMode === 'campaign') {
            startMatch();
        } else {
            openArenaChooser();
        }
        return;
    }

    // Validation & navigation au clavier sur l'écran de choix d'arène
    if (matchState === 'arena_select') {
        if (e.code === 'ArrowLeft' || e.code === 'KeyA' || e.code === 'KeyQ') {
            e.preventDefault();
            if (typeof navigateArenaCarousel === 'function') navigateArenaCarousel(-1);
            return;
        }
        if (e.code === 'ArrowRight' || e.code === 'KeyD') {
            e.preventDefault();
            if (typeof navigateArenaCarousel === 'function') navigateArenaCarousel(1);
            return;
        }
        if (e.code === 'KeyR' || e.code === 'KeyX') {
            e.preventDefault();
            const btnRandom = document.getElementById('btnArenaRandom');
            if (btnRandom) btnRandom.click();
            return;
        }
        if (e.code === 'Enter' || e.code === 'Space') {
            e.preventDefault();
            sfx.playHit(false);
            startMatch();
            return;
        }
    }

    // Navigation sur la carte temporelle de Campagne (Road Through Time / Smash Melee)
    if (matchState === 'campaign_map') {
        const erasCount = typeof CAMPAIGN_ERAS !== 'undefined' ? CAMPAIGN_ERAS.length : (typeof GEOLOGICAL_PERIODS !== 'undefined' ? GEOLOGICAL_PERIODS.length : 6);
        const sig = typeof selectedEraIndexSignal !== 'undefined' ? selectedEraIndexSignal : (typeof selectedPeriodIndexSignal !== 'undefined' ? selectedPeriodIndexSignal : null);

        if (e.code === 'ArrowLeft' || e.code === 'KeyA' || e.code === 'KeyQ') {
            e.preventDefault();
            if (sig) {
                sig.value = Math.max(0, sig.value - 1);
                if (typeof sfx !== 'undefined' && sfx.playHit) sfx.playHit(false);
            }
            return;
        }
        if (e.code === 'ArrowRight' || e.code === 'KeyD') {
            e.preventDefault();
            if (sig) {
                sig.value = Math.min(erasCount - 1, sig.value + 1);
                if (typeof sfx !== 'undefined' && sfx.playHit) sfx.playHit(false);
            }
            return;
        }
        if (e.code === 'KeyH') {
            e.preventDefault();
            if (typeof cyclePlayerHero === 'function') cyclePlayerHero();
            return;
        }
        if (e.code === 'Enter' || e.code === 'Space') {
            e.preventDefault();
            const btnEnter = document.getElementById('btnEnterPeriod');
            if (btnEnter) btnEnter.click();
            return;
        }
        if (e.code === 'Escape' || e.code === 'Backspace') {
            e.preventDefault();
            if (typeof closeCampaignMap === 'function') closeCampaignMap();
            if (typeof goToMainMenu === 'function') goToMainMenu();
            return;
        }
    }

    // Bloquer tous les contrôles si une cinématique X-Ray est en cours
    if (xrayCinematicTimer > 0) return;

    if (matchState === 'fight' || matchState === 'finish_him' || matchState === 'campaign_level') {
        // Double-tap Gauche/Droite pour Dash rapide
        if (e.code === 'KeyA' || e.code === 'KeyQ' || (gameMode !== 'pvp' && e.code === 'ArrowLeft')) {
            if (now - lastTapTime.left < 280 && fighter1) fighter1.startDash(-1);
            lastTapTime.left = now;
        }
        if (e.code === 'KeyD' || (gameMode !== 'pvp' && e.code === 'ArrowRight')) {
            if (now - lastTapTime.right < 280 && fighter1) fighter1.startDash(1);
            lastTapTime.right = now;
        }

        // 1. SAUTER : Touche Espace dédiée (séparée de Haut pour pouvoir frapper en haut sans sauter)
        if (e.code === 'Space') {
            flashArcadeButton('uiBtnJump', true);
            triggerPlayerAction(fighter1, fighter2, 'jump');
        }

        // 2. DASHER : Touche E
        if (e.code === 'KeyE') {
            flashArcadeButton('uiBtnDash', true);
            triggerPlayerAction(fighter1, fighter2, 'dash');
        }

        // 3. FRAPPER (Haut / Milieu / Bas selon direction) : Touche F ou J
        if (e.code === 'KeyF' || e.code === 'KeyJ') {
            flashArcadeButton('uiBtnStrike', true);
            triggerPlayerAction(fighter1, fighter2, 'strike');
        }

        // 4. ACTION SPÉCIALE UNIQUE PAR ANIMAL : Touche H ou L
        if (e.code === 'KeyH' || e.code === 'KeyL') {
            flashArcadeButton('uiBtnSpecial', true);
            triggerPlayerAction(fighter1, fighter2, 'special');
        }

        // 5. PROTÉGER (Armure 3D Haute, Médiane ou Basse à l'endroit défendu) : Touche Shift ou S
        if (e.code === 'ShiftLeft' || e.code === 'KeyS') {
            flashArcadeButton('uiBtnGuard', true);
            triggerPlayerAction(fighter1, fighter2, 'guard');
        }

        // 6. SUPER ATTAQUE (Rage / Frenzy / X-Ray à 100% de Rage) : Touche R
        if (e.code === 'KeyR') {
            flashArcadeButton('btnRageFatality', true);
            triggerPlayerAction(fighter1, fighter2, 'xray');
        }

        if (gameMode === 'pvp') {
            if (e.code === 'ArrowLeft') {
                if (now - lastTapTime.p2Left < 280 && fighter2) fighter2.startDash(-1);
                lastTapTime.p2Left = now;
            }
            if (e.code === 'ArrowRight') {
                if (now - lastTapTime.p2Right < 280 && fighter2) fighter2.startDash(1);
                lastTapTime.p2Right = now;
            }
            if (e.code === 'Numpad8') triggerPlayerAction(fighter2, fighter1, 'jump');
            if (e.code === 'Numpad6') triggerPlayerAction(fighter2, fighter1, 'dash');
            if (e.code === 'Numpad1' || e.code === 'KeyI') triggerPlayerAction(fighter2, fighter1, 'strike');
            if (e.code === 'Numpad2' || e.code === 'KeyO') triggerPlayerAction(fighter2, fighter1, 'special');
            if (e.code === 'Numpad5' || e.code === 'KeyK') triggerPlayerAction(fighter2, fighter1, 'guard');
            if (e.code === 'Numpad0' || e.code === 'KeyM') triggerPlayerAction(fighter2, fighter1, 'xray');
        }
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
    if (e.code === 'KeyA' || e.code === 'KeyQ' || e.code === 'ArrowLeft') flashArcadeButton('uiBtnLeft', false);
    if (e.code === 'KeyD' || e.code === 'ArrowRight') flashArcadeButton('uiBtnRight', false);
    if (e.code === 'KeyW' || e.code === 'KeyZ' || e.code === 'ArrowUp') flashArcadeButton('uiBtnUp', false);
    if (e.code === 'KeyS' || e.code === 'ArrowDown') flashArcadeButton('uiBtnDown', false);
    if (e.code === 'Space') flashArcadeButton('uiBtnJump', false);
    if (e.code === 'KeyE') flashArcadeButton('uiBtnDash', false);
    if (e.code === 'KeyF' || e.code === 'KeyJ') flashArcadeButton('uiBtnStrike', false);
    if (e.code === 'KeyH' || e.code === 'KeyL') flashArcadeButton('uiBtnSpecial', false);
    if (e.code === 'ShiftLeft' || e.code === 'KeyS') flashArcadeButton('uiBtnGuard', false);
    if (e.code === 'KeyR') flashArcadeButton('btnRageFatality', false);
});


// 2. ÉTAT ET GESTIONNAIRE UNIFIÉ DE MANETTES
let gamepadActive = false;
let lastGamepadPollFrame = -1;
let currentFocusedElement = null;

const gpState = {
    p1: { buttons: [], prevButtons: [], axes: [], prevAxes: [], navLastDir: null, navRepeatTimer: 0 },
    p2: { buttons: [], prevButtons: [], axes: [], prevAxes: [], navLastDir: null, navRepeatTimer: 0 }
};

// Variables d'état de navigation pour chaque écran
let mainMenuFocusIdx = 0;
let headerFocusIdx = 0;

let selectFocusZone = 'grid'; // 'grid' | 'bottom' | 'header'
let selectBottomIdx = 3;       // Focus par défaut sur "Choisir l'arène"
let selectHeaderIdx = 0;

let arenaFocusZone = 'cards'; // 'cards' | 'topButtons'
let arenaTopIdx = 2;          // Focus par défaut sur "Lancer le Kombat"

let settingsRow = 0;          // 0: Graphismes, 1: Plein écran, 2: Difficulté, 3: Son, 4: Fermer
let postMatchIdx = 0;

// Fonctions d'indication visuelle (focus halo doré)
function setGamepadFocus(el) {
    if (currentFocusedElement === el) return;
    if (currentFocusedElement) {
        currentFocusedElement.classList.remove('gamepad-focused');
    }
    currentFocusedElement = el;
    if (el) {
        el.classList.add('gamepad-focused');
        try {
            el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        } catch (_) {}
    }
}

function clearGamepadFocus() {
    if (currentFocusedElement) {
        currentFocusedElement.classList.remove('gamepad-focused');
        currentFocusedElement = null;
    }
}

// Réinitialiser le focus manette lors de l'utilisation de la souris
window.addEventListener('mousemove', (e) => {
    // Si la souris se déplace de façon significative, désactiver le focus manette
    if (e.movementX !== 0 || e.movementY !== 0) {
        clearGamepadFocus();
    }
});

// Notifications toast pour la connexion/déconnexion de manettes
window.addEventListener('gamepadconnected', (e) => {
    gamepadActive = true;
    const name = (e.gamepad.id || 'Manette').split('(')[0].trim();
    showGamepadToast(`🎮 MANETTE DÉTECTÉE : ${name}`);
    updateGamepadHelperHUD();
});

window.addEventListener('gamepaddisconnected', () => {
    showGamepadToast('🎮 MANETTE DÉCONNECTÉE');
    updateGamepadHelperHUD();
});

function showGamepadToast(msg) {
    let toast = document.getElementById('gamepadToast');
    if (!toast) {
        const toastUI = new UIKit.Badge({
            id: 'gamepadToast',
            text: msg,
            className: 'fixed top-14 left-1/2 -translate-x-1/2 z-50 pointer-events-none px-4 py-2 rounded-xl bg-zinc-950/95 border-2 border-amber-400 text-amber-300 font-black text-xs sm:text-sm tracking-wider uppercase shadow-[0_0_25px_rgba(245,158,11,0.6)] transition-all duration-300 opacity-0 transform -translate-y-2'
        });
        toast = toastUI.mount(document.body);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';
    toast.style.transform = 'translate(-50%, 0)';
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translate(-50%, -8px)';
    }, 2500);
}


// 3. BARRE D'AIDE MANETTE CONTEXTUELLE EN BAS D'ÉCRAN (SUPPRIMÉE)
function createGamepadHelperHUD() {
    const bar = document.getElementById('gamepadHelperBar');
    if (bar) bar.remove();
}

let _lastGamepadHelperKey = '';

function updateGamepadHelperHUD() {
    const bar = document.getElementById('gamepadHelperBar');
    if (bar) bar.remove();
}


// 4. ANALYSEURS D'ENTRÉES MANETTE (Répétition & Déclenchement sur front)
function getEffectiveStickDeadzone() {
    const raw = (typeof window !== 'undefined' && typeof window.stickDeadzone === 'number') ? window.stickDeadzone : 0.15;
    return Math.max(0.05, Math.min(0.45, raw));
}

function getEffectiveStickSensitivity() {
    const raw = (typeof window !== 'undefined' && typeof window.stickSensitivity === 'number') ? window.stickSensitivity : 0.75;
    return Math.max(0.25, Math.min(1.8, 0.4 + raw * 1.1));
}

function applyStickResponse(rawVal) {
    const dz = getEffectiveStickDeadzone();
    if (Math.abs(rawVal) <= dz) return 0;
    const sign = Math.sign(rawVal);
    const normalized = (Math.abs(rawVal) - dz) / Math.max(0.01, 1 - dz);
    return sign * Math.min(1, normalized * getEffectiveStickSensitivity());
}

function triggerGamepadRumble(playerIdx = 0, weak = 0.4, strong = 0.7, durationMs = 150) {
    if (typeof window !== 'undefined' && window.controllerRumbleEnabled === false) return;
    if (typeof navigator === 'undefined' || typeof navigator.getGamepads !== 'function') return;
    try {
        const pads = navigator.getGamepads();
        const pad = pads && pads[playerIdx];
        if (pad && pad.vibrationActuator && typeof pad.vibrationActuator.playEffect === 'function') {
            pad.vibrationActuator.playEffect('dual-rumble', {
                startDelay: 0,
                duration: Math.max(40, Math.min(600, durationMs)),
                weakMagnitude: Math.max(0, Math.min(1, weak)),
                strongMagnitude: Math.max(0, Math.min(1, strong))
            }).catch(() => {});
        }
    } catch (_) {}
}
if (typeof window !== 'undefined') {
    window.triggerGamepadRumble = triggerGamepadRumble;
}

function getNavDirection(pad) {
    if (!pad) return null;
    const axX = applyStickResponse(pad.axes[0] || 0);
    const axY = applyStickResponse(pad.axes[1] || 0);
    const dpadUp = pad.buttons[12]?.pressed;
    const dpadDown = pad.buttons[13]?.pressed;
    const dpadLeft = pad.buttons[14]?.pressed;
    const dpadRight = pad.buttons[15]?.pressed;

    if (dpadUp || axY < -0.45) return 'up';
    if (dpadDown || axY > 0.45) return 'down';
    if (dpadLeft || axX < -0.45) return 'left';
    if (dpadRight || axX > 0.45) return 'right';

    return null;
}

function checkNavInput(pad, padIndex, dt) {
    const p = padIndex === 0 ? gpState.p1 : gpState.p2;
    const currentDir = getNavDirection(pad);

    if (!currentDir) {
        p.navLastDir = null;
        p.navRepeatTimer = 0;
        return null;
    }

    if (p.navLastDir !== currentDir) {
        p.navLastDir = currentDir;
        p.navRepeatTimer = 0.28; // Délai initial avant répétition (280ms)
        return currentDir;
    }

    p.navRepeatTimer -= dt;
    if (p.navRepeatTimer <= 0) {
        p.navRepeatTimer = 0.13; // Cadence de répétition (130ms)
        return currentDir;
    }

    return null;
}

function isGpBtnJustPressed(padIndex, btnIndex) {
    const p = padIndex === 0 ? gpState.p1 : gpState.p2;
    return !!(p.buttons[btnIndex] && !p.prevButtons[btnIndex]);
}

function isGpBtnDown(pad, btnIndex) {
    return !!(pad && pad.buttons && pad.buttons[btnIndex] && pad.buttons[btnIndex].pressed);
}


// 5. NAVIGATION DANS LES DIFFÉRENTS ÉCRANS DE JEU

// A. GRIMOIRE DES COUPS (MODAL)
function handleGamepadMovesModal(pad, dt) {
    const movesModal = document.getElementById('movesModal');
    if (!movesModal) return;

    const scrollContainer = movesModal.querySelector('.overflow-y-auto');
    if (scrollContainer) {
        const rStickY = (pad.axes && Math.abs(pad.axes[3]) > 0.15) ? pad.axes[3] : 0;
        const lStickY = (pad.axes && Math.abs(pad.axes[1]) > 0.15) ? pad.axes[1] : 0;

        if (Math.abs(rStickY) > 0.15) {
            scrollContainer.scrollTop += rStickY * 750 * dt;
        } else if (Math.abs(lStickY) > 0.15) {
            scrollContainer.scrollTop += lStickY * 750 * dt;
        }

        const nav = checkNavInput(pad, 0, dt);
        if (nav === 'down') scrollContainer.scrollBy({ top: 140, behavior: 'smooth' });
        if (nav === 'up') scrollContainer.scrollBy({ top: -140, behavior: 'smooth' });
    }

    // Boutons de fermeture : B (1), Start (9), Select (8)
    if (isGpBtnJustPressed(0, 1) || isGpBtnJustPressed(0, 8) || isGpBtnJustPressed(0, 9)) {
        sfx.playHit(false);
        if (typeof closeMovesModal === 'function') {
            closeMovesModal();
        } else {
            movesModal.classList.add('hidden');
            if (isMatchPaused) {
                const pauseModal = document.getElementById('pauseModal');
                if (pauseModal) {
                    pauseModal.classList.remove('hidden');
                    if (typeof updatePauseFocus === 'function') updatePauseFocus();
                }
            }
        }
    }
}

// B. PARAMÈTRES DU JEU (MODAL — PREHISTORIC OVERHAUL)
function handleGamepadSettingsModal(pad, dt) {
    const nav = checkNavInput(pad, 0, dt);
    const btnA = isGpBtnJustPressed(0, 0); // [A] Select / Toggle
    const btnB = isGpBtnJustPressed(0, 1) || isGpBtnJustPressed(0, 9); // [B] Back / Start
    const btnX = isGpBtnJustPressed(0, 2); // [X] Reset Defaults
    const btnLB = isGpBtnJustPressed(0, 4); // LB Prev Tab
    const btnRB = isGpBtnJustPressed(0, 5); // RB Next Tab

    // 1. Bouton B ou Start : Fermer la modale
    if (btnB) {
        if (typeof closeSettingsModal === 'function') closeSettingsModal();
        return;
    }

    // 2. Bouton X : Réinitialiser aux valeurs par défaut
    if (btnX) {
        if (typeof resetSettingsToDefaults === 'function') resetSettingsToDefaults();
        return;
    }

    // 3. LB / RB : Changer d'onglet (AUDIO, VIDEO, GAMEPLAY, CONTROLS)
    const tabs = ['audio', 'video', 'gameplay', 'controls'];
    if (btnLB || btnRB) {
        const curTab = typeof settingsActiveTabSignal !== 'undefined' ? settingsActiveTabSignal.value : 'gameplay';
        let tabIdx = tabs.indexOf(curTab);
        if (tabIdx === -1) tabIdx = 2;
        const nextIdx = btnLB ? (tabIdx - 1 + tabs.length) % tabs.length : (tabIdx + 1) % tabs.length;
        if (typeof settingsActiveTabSignal !== 'undefined') {
            settingsActiveTabSignal.value = tabs[nextIdx];
            if (typeof updateSettingsUI === 'function') updateSettingsUI();
            if (typeof sfx !== 'undefined' && typeof sfx.playTabSwitch === 'function') {
                sfx.playTabSwitch();
            } else if (typeof sfx !== 'undefined') {
                sfx.playHit(false);
            }
        }
        return;
    }

    // 4. Navigation Haut / Bas parmi les lignes actives
    const rowEls = Array.from(document.querySelectorAll('.settings-row'));
    if (!rowEls.length) return;

    if (nav === 'up') {
        settingsRow = Math.max(0, settingsRow - 1);
        if (typeof sfx !== 'undefined') sfx.playHit(false);
    } else if (nav === 'down') {
        settingsRow = Math.min(rowEls.length - 1, settingsRow + 1);
        if (typeof sfx !== 'undefined') sfx.playHit(false);
    }

    // Highlight visuel de la ligne active
    rowEls.forEach((r, idx) => {
        const label = r.querySelector('.settings-label-slab');
        if (label) {
            if (idx === settingsRow) label.classList.add('active-focus');
            else label.classList.remove('active-focus');
        }
    });

    const activeRow = rowEls[settingsRow];
    if (!activeRow) return;

    // 5. Interaction selon le type de contrôle sur la ligne active
    const slider = activeRow.querySelector('.bone-slider-wrapper');
    const toggleCapsule = activeRow.querySelector('.toggle-onoff-capsule');
    const toggleDisplay = activeRow.querySelector('.toggle-mode-bar');
    const gfxPicker = activeRow.querySelector('#gfxPicker');
    const aiPicker = activeRow.querySelector('#aiPicker');

    // A. Slider en os (Volume, Shake, etc.)
    if (slider) {
        const sliderId = slider.dataset.sliderId;
        let curVal = 50;
        if (typeof SETTINGS_SLIDERS !== 'undefined' && SETTINGS_SLIDERS[sliderId]) {
            curVal = SETTINGS_SLIDERS[sliderId].signal.value;
        } else if (sliderId === 'masterVol') curVal = settingsMasterVolSignal.value;
        else if (sliderId === 'sfxVol') curVal = settingsSfxVolSignal.value;
        else if (sliderId === 'screenShake') curVal = settingsScreenShakeSignal.value;
        else if (sliderId === 'musicVol') curVal = settingsMusicVolSignal.value;

        if (nav === 'left') {
            const nextVal = Math.max(0, curVal - 5);
            applySliderValue(sliderId, nextVal);
        } else if (nav === 'right') {
            const nextVal = Math.min(100, curVal + 5);
            applySliderValue(sliderId, nextVal);
        }
    }

    // B. Toggle ON / OFF (Gore & Blood, Subtitles, Sound)
    if (toggleCapsule && (btnA || nav === 'left' || nav === 'right')) {
        toggleCapsule.click();
    }

    // C. Toggle Display Mode (Fullscreen / Windowed)
    if (toggleDisplay && (btnA || nav === 'left' || nav === 'right')) {
        toggleDisplay.click();
    }

    // D. GFX Picker (Video tab)
    if (gfxPicker) {
        const qOpts = ['low', 'medium', 'high', 'ultra'];
        let curQIdx = qOpts.indexOf(settingsGraphicsSignal.value);
        if (curQIdx === -1) curQIdx = 2;
        if (nav === 'left') {
            const nextQ = qOpts[Math.max(0, curQIdx - 1)];
            const btn = gfxPicker.querySelector(`[data-gfx="${nextQ}"]`);
            if (btn) btn.click();
        } else if (nav === 'right' || btnA) {
            const nextQ = qOpts[(curQIdx + 1) % qOpts.length];
            const btn = gfxPicker.querySelector(`[data-gfx="${nextQ}"]`);
            if (btn) btn.click();
        }
    }

    // E. AI Picker (Controls tab)
    if (aiPicker) {
        const aiOpts = ['easy', 'normal', 'hard', 'very_hard'];
        const curVal = settingsAiDiffSignal.value === 'brutal' ? 'very_hard' : settingsAiDiffSignal.value;
        let curAiIdx = aiOpts.indexOf(curVal);
        if (curAiIdx === -1) curAiIdx = 1;
        if (nav === 'left') {
            const nextAi = aiOpts[Math.max(0, curAiIdx - 1)];
            const btn = aiPicker.querySelector(`[data-ai="${nextAi}"]`);
            if (btn) btn.click();
        } else if (nav === 'right' || btnA) {
            const nextAi = aiOpts[(curAiIdx + 1) % aiOpts.length];
            const btn = aiPicker.querySelector(`[data-ai="${nextAi}"]`);
            if (btn) btn.click();
        }
    }
}

function applySliderValue(sliderId, val) {
    if (typeof applySettingValue === 'function') {
        applySettingValue(sliderId, val, true);
    } else if (sliderId === 'masterVol') {
        settingsMasterVolSignal.value = val;
        if (typeof sfx !== 'undefined' && typeof sfx.setMasterVolume === 'function') sfx.setMasterVolume(val / 100);
    } else if (sliderId === 'sfxVol') {
        settingsSfxVolSignal.value = val;
        if (typeof sfx !== 'undefined' && typeof sfx.setSfxVolume === 'function') sfx.setSfxVolume(val / 100);
    } else if (sliderId === 'screenShake') {
        settingsScreenShakeSignal.value = val;
        window.screenShakeMultiplier = val / 100;
    } else if (sliderId === 'musicVol') {
        settingsMusicVolSignal.value = val;
        if (typeof sfx !== 'undefined' && typeof sfx.setMusicVolume === 'function') sfx.setMusicVolume(val / 100);
    }
    if (typeof sfx !== 'undefined' && typeof sfx.playSliderTick === 'function') {
        sfx.playSliderTick();
    }
    if (typeof updateSettingsUI === 'function') updateSettingsUI();
}

// C. MENU DE PAUSE & OPTIONS RAPIDES (MODAL)
function handleGamepadPauseModal(pad, dt) {
    const pauseModal = document.getElementById('pauseModal');
    if (!pauseModal || pauseModal.classList.contains('hidden')) return;

    const buttons = typeof getPauseNavButtons === 'function' ? getPauseNavButtons() : [];
    if (buttons.length === 0) return;

    const nav = checkNavInput(pad, 0, dt);
    if (nav === 'up') {
        pauseFocusIdx = (pauseFocusIdx - 1 + buttons.length) % buttons.length;
        sfx.playHit(false);
        if (typeof updatePauseFocus === 'function') updatePauseFocus();
    } else if (nav === 'down') {
        pauseFocusIdx = (pauseFocusIdx + 1) % buttons.length;
        sfx.playHit(false);
        if (typeof updatePauseFocus === 'function') updatePauseFocus();
    }

    // [A] = Valider l'option sélectionnée
    if (isGpBtnJustPressed(0, 0)) {
        if (buttons[pauseFocusIdx]) {
            buttons[pauseFocusIdx].click();
        }
    }

    // [B] ou [START] = Reprendre le combat
    if (isGpBtnJustPressed(0, 1) || isGpBtnJustPressed(0, 9)) {
        sfx.playHit(false);
        if (typeof closePauseMenu === 'function') closePauseMenu();
    }
}

// C. ÉCRAN DE FIN DE MATCH (POST-MATCH)
function handleGamepadPostMatch(pad, dt) {
    const postMatchMenu = document.getElementById('postMatchMenu');
    if (!postMatchMenu) return;

    const visibleButtons = Array.from(postMatchMenu.querySelectorAll('button')).filter(b => !b.classList.contains('hidden'));
    if (visibleButtons.length === 0) return;

    const nav = checkNavInput(pad, 0, dt);
    if (nav === 'left' || nav === 'up') {
        postMatchIdx = (postMatchIdx - 1 + visibleButtons.length) % visibleButtons.length;
        sfx.playHit(false);
    } else if (nav === 'right' || nav === 'down') {
        postMatchIdx = (postMatchIdx + 1) % visibleButtons.length;
        sfx.playHit(false);
    }

    postMatchIdx = Math.max(0, Math.min(visibleButtons.length - 1, postMatchIdx));
    setGamepadFocus(visibleButtons[postMatchIdx]);

    // Validation (Touche A)
    if (isGpBtnJustPressed(0, 0)) {
        visibleButtons[postMatchIdx].click();
    }

    // Raccourcis rapides
    if (isGpBtnJustPressed(0, 9)) { // Start = Revanche ou Étape suivante
        const btnNext = document.getElementById('btnNextOpponent');
        const btnRematch = document.getElementById('btnRematch');
        if (btnNext && !btnNext.classList.contains('hidden')) btnNext.click();
        else if (btnRematch) btnRematch.click();
    }
    if (isGpBtnJustPressed(0, 1)) { // B = Changer de combattant
        const btnRoster = document.getElementById('btnReturnRoster');
        if (btnRoster) btnRoster.click();
    }
    if (isGpBtnJustPressed(0, 3)) { // Y = Menu principal
        const btnMain = document.getElementById('btnPostMatchMainMenu');
        if (btnMain) btnMain.click();
    }
}

// D. MENU PRINCIPAL
function getMainMenuNavElements() {
    return Array.from(document.querySelectorAll('#mainMenu .stone-slab-btn')).filter(b => !b.classList.contains('hidden'));
}

function handleGamepadMainMenu(pad, dt) {
    const nav = checkNavInput(pad, 0, dt);
    const menuButtons = getMainMenuNavElements();
    if (menuButtons.length === 0) return;

    if (nav === 'up') {
        mainMenuFocusIdx = (mainMenuFocusIdx - 1 + menuButtons.length) % menuButtons.length;
        sfx.playHit(false);
    } else if (nav === 'down') {
        mainMenuFocusIdx = (mainMenuFocusIdx + 1) % menuButtons.length;
        sfx.playHit(false);
    }

    mainMenuFocusIdx = Math.max(0, Math.min(menuButtons.length - 1, mainMenuFocusIdx));
    const target = menuButtons[mainMenuFocusIdx];
    if (target) {
        setGamepadFocus(target);
        if (typeof selectMainMenuSlab === 'function') {
            selectMainMenuSlab(target);
        } else {
            menuButtons.forEach(b => b.classList.remove('active', 'selected'));
            target.classList.add('active', 'selected');
        }
    }

    if (isGpBtnJustPressed(0, 0)) {
        if (target) target.click();
    }

    // Raccourcis globaux du menu
    if (isGpBtnJustPressed(0, 9)) { // Start = Paramètres
        sfx.playHit(false);
        openSettingsModal();
    }
    if (isGpBtnJustPressed(0, 8)) { // Select = Grimoire
        sfx.playHit(false);
        if (typeof renderMovesModalList === 'function') renderMovesModalList();
        document.getElementById('movesModal').classList.remove('hidden');
    }
}

// E. ÉCRAN DE SÉLECTION DES COMBATTANTS
function getRosterGridColumns() {
    const grid = document.getElementById('rosterGrid');
    if (!grid) return 4;
    const cards = grid.querySelectorAll('.stone-card');
    if (cards.length < 2) return 4;
    const firstTop = cards[0].offsetTop;
    for (let i = 1; i < cards.length; i++) {
        if (cards[i].offsetTop > firstTop + 8) return i;
    }
    return 4;
}

function handleGamepadSelectScreen(pad, pad2, dt) {
    const nav1 = checkNavInput(pad, 0, dt);
    const cols = getRosterGridColumns();

    const bottomButtons = [
        document.getElementById('btnSelectSlotP1'),
        document.getElementById('btnSelectSlotP2'),
        document.getElementById('btnToggleVsMode'),
        document.getElementById('btnRandomFighters'),
        document.getElementById('btnGoToArena')
    ].filter(b => b && !b.classList.contains('hidden'));

    if (selectFocusZone === 'grid') {
        let changed = false;
        if (nav1 === 'left') {
            p1ChoiceIndex = (p1ChoiceIndex - 1 + DINO_ROSTER.length) % DINO_ROSTER.length;
            changed = true;
        } else if (nav1 === 'right') {
            p1ChoiceIndex = (p1ChoiceIndex + 1) % DINO_ROSTER.length;
            changed = true;
        } else if (nav1 === 'up') {
            if (p1ChoiceIndex - cols >= 0) {
                p1ChoiceIndex -= cols;
                changed = true;
            } else {
                selectFocusZone = 'header';
                selectHeaderIdx = 0;
                sfx.playHit(false);
            }
        } else if (nav1 === 'down') {
            if (p1ChoiceIndex + cols < DINO_ROSTER.length) {
                p1ChoiceIndex += cols;
                changed = true;
            } else {
                selectFocusZone = 'bottom';
                selectBottomIdx = bottomButtons.length - 1; // "Choisir l'arène"
                sfx.playHit(false);
            }
        }

        if (changed) {
            const targetDino = DINO_ROSTER[p1ChoiceIndex];
            if (targetDino && targetDino.isUnlockable && typeof isFighterUnlocked === 'function' && !isFighterUnlocked(targetDino.id)) {
                if (nav1 === 'left') p1ChoiceIndex = (p1ChoiceIndex - 1 + DINO_ROSTER.length) % DINO_ROSTER.length;
                else p1ChoiceIndex = (p1ChoiceIndex + 1) % DINO_ROSTER.length;
            }
            sfx.playHit(false);
            updateSelectScreenUI();
        }

        // Halo sur la carte de combattant choisie
        const activeCard = document.querySelector(`#rosterGrid .stone-card[data-index="${p1ChoiceIndex}"]`);
        if (activeCard) setGamepadFocus(activeCard);

        // Validation (Bouton A) : Confirmer le choix
        if (isGpBtnJustPressed(0, 0)) {
            sfx.playHit(false);
            if (gameMode === 'pvp') {
                if (activeSelectSlot === 1) {
                    activeSelectSlot = 2;
                    updateSelectScreenUI();
                } else {
                    openArenaChooser();
                }
            } else if (gameMode === 'campaign') {
                startMatch();
            } else {
                openArenaChooser();
            }
        }
    } else if (selectFocusZone === 'bottom') {
        if (nav1 === 'left') {
            selectBottomIdx = Math.max(0, selectBottomIdx - 1);
            sfx.playHit(false);
        } else if (nav1 === 'right') {
            selectBottomIdx = Math.min(bottomButtons.length - 1, selectBottomIdx + 1);
            sfx.playHit(false);
        } else if (nav1 === 'up') {
            selectFocusZone = 'grid';
            sfx.playHit(false);
        }

        const target = bottomButtons[selectBottomIdx];
        if (target) setGamepadFocus(target);

        if (isGpBtnJustPressed(0, 0)) {
            if (target) target.click();
        }
    } else if (selectFocusZone === 'header') {
        const btnBack = document.getElementById('btnSelectBackToMain');
        if (btnBack) setGamepadFocus(btnBack);

        if (nav1 === 'down') {
            selectFocusZone = 'grid';
            sfx.playHit(false);
        }
        if (isGpBtnJustPressed(0, 0)) {
            if (btnBack) btnBack.click();
        }
    }

    // Gestion de la Manette 2 pour le Joueur 2 en mode 1vs1 Local (PvP)
    if (pad2 && gameMode === 'pvp') {
        const nav2 = checkNavInput(pad2, 1, dt);
        let p2Changed = false;
        if (nav2 === 'left') { p2ChoiceIndex = (p2ChoiceIndex - 1 + DINO_ROSTER.length) % DINO_ROSTER.length; p2Changed = true; }
        else if (nav2 === 'right') { p2ChoiceIndex = (p2ChoiceIndex + 1) % DINO_ROSTER.length; p2Changed = true; }
        else if (nav2 === 'up' && p2ChoiceIndex - cols >= 0) { p2ChoiceIndex -= cols; p2Changed = true; }
        else if (nav2 === 'down' && p2ChoiceIndex + cols < DINO_ROSTER.length) { p2ChoiceIndex += cols; p2Changed = true; }

        if (p2Changed) {
            const targetDino = DINO_ROSTER[p2ChoiceIndex];
            if (targetDino && targetDino.isUnlockable && typeof isFighterUnlocked === 'function' && !isFighterUnlocked(targetDino.id)) {
                if (nav2 === 'left') p2ChoiceIndex = (p2ChoiceIndex - 1 + DINO_ROSTER.length) % DINO_ROSTER.length;
                else p2ChoiceIndex = (p2ChoiceIndex + 1) % DINO_ROSTER.length;
            }
            sfx.playHit(false);
            updateSelectScreenUI();
        }

        // Raccourcis Manette 2 : Aléatoire
        if (isGpBtnJustPressed(1, 2)) { // X = Aléatoire J2
            const unlocked = DINO_ROSTER.map((d, i) => (!d.isUnlockable || isFighterUnlocked(d.id)) ? i : -1).filter(i => i !== -1);
            do {
                p2ChoiceIndex = unlocked[Math.floor(Math.random() * unlocked.length)];
            } while (p2ChoiceIndex === p1ChoiceIndex && unlocked.length > 1);
            updateSelectScreenUI();
            sfx.playHit(false);
        }
    }

    if (isGpBtnJustPressed(0, 2)) { // X = Aléatoire
        const rndBtn = document.getElementById('btnRandomFighters');
        if (rndBtn) rndBtn.click();
    }
    if (isGpBtnJustPressed(0, 3) && gameMode === 'pvp') { // Y = Changer de slot actif (J1 / J2)
        activeSelectSlot = activeSelectSlot === 1 ? 2 : 1;
        updateSelectScreenUI();
        sfx.playHit(false);
    }
    if (isGpBtnJustPressed(0, 9)) { // Start = Valider & Passer à l'arène
        const btnGo = document.getElementById('btnGoToArena');
        if (btnGo) btnGo.click();
    }
    if (isGpBtnJustPressed(0, 1)) { // B = Retour au menu principal
        const btnBack = document.getElementById('btnSelectBackToMain');
        if (btnBack) btnBack.click();
    }
}

// F. ÉCRAN DU CHOIX DE L'ARÈNE (ARENA CHOOSER)
function handleGamepadArenaScreen(pad, dt) {
    const nav = checkNavInput(pad, 0, dt);
    const arenaCards = Array.from(document.querySelectorAll('#arenaCardsGrid > div'));
    const topButtons = [
        document.getElementById('btnArenaBackToCreatures'),
        document.getElementById('btnArenaRandom'),
        document.getElementById('btnArenaFight')
    ].filter(b => b && !b.classList.contains('hidden'));

    let curArenaIdx = ARENA_LIST.findIndex(a => a.id === currentArena);
    if (curArenaIdx === -1) curArenaIdx = 0;

    if (arenaFocusZone === 'cards') {
        if (nav === 'left' || nav === 'up') {
            if (typeof navigateArenaCarousel === 'function') navigateArenaCarousel(-1);
            else {
                const nextIdx = (curArenaIdx - 1 + ARENA_LIST.length) % ARENA_LIST.length;
                selectArena(ARENA_LIST[nextIdx].id);
                sfx.playHit(false);
            }
        } else if (nav === 'right') {
            if (typeof navigateArenaCarousel === 'function') navigateArenaCarousel(1);
            else {
                const nextIdx = (curArenaIdx + 1) % ARENA_LIST.length;
                selectArena(ARENA_LIST[nextIdx].id);
                sfx.playHit(false);
            }
        } else if (nav === 'down') {
            arenaFocusZone = 'topButtons';
            arenaTopIdx = topButtons.length - 1; // "Lancer le Kombat"
            sfx.playHit(false);
        }

        const activeCard = arenaCards[1] || arenaCards[0];
        if (activeCard) setGamepadFocus(activeCard);

        if (isGpBtnJustPressed(0, 0)) { // A sur la carte d'arène -> lancer le combat
            const fightBtn = document.getElementById('btnArenaFight');
            if (fightBtn) fightBtn.click();
        }
    } else if (arenaFocusZone === 'topButtons') {
        if (nav === 'left') {
            arenaTopIdx = Math.max(0, arenaTopIdx - 1);
            sfx.playHit(false);
        } else if (nav === 'right') {
            arenaTopIdx = Math.min(topButtons.length - 1, arenaTopIdx + 1);
            sfx.playHit(false);
        } else if (nav === 'up') {
            arenaFocusZone = 'cards';
            sfx.playHit(false);
        }

        const target = topButtons[arenaTopIdx];
        if (target) setGamepadFocus(target);

        if (isGpBtnJustPressed(0, 0)) {
            if (target) target.click();
        }
    }

    // LB / RB = Changer d'arène directement (comme dans le concept art)
    if (isGpBtnJustPressed(0, 4)) { // LB
        if (typeof navigateArenaCarousel === 'function') navigateArenaCarousel(-1);
    }
    if (isGpBtnJustPressed(0, 5)) { // RB
        if (typeof navigateArenaCarousel === 'function') navigateArenaCarousel(1);
    }

    // Raccourcis universels sur l'arène
    if (isGpBtnJustPressed(0, 9)) { // Start = Lancer le Kombat !
        const fightBtn = document.getElementById('btnArenaFight');
        if (fightBtn) fightBtn.click();
    }
    if (isGpBtnJustPressed(0, 2)) { // X = Arène aléatoire
        const rndBtn = document.getElementById('btnArenaRandom');
        if (rndBtn) rndBtn.click();
    }
    if (isGpBtnJustPressed(0, 1)) { // B = Retour à la sélection des créatures
        const backBtn = document.getElementById('btnArenaBackToCreatures');
        if (backBtn) backBtn.click();
    }
}

// G. COMBAT EN ARÈNE 3D & FINISH HIM
function handleGamepadBattle(pad, pad2, dt) {
    if (xrayCinematicTimer > 0 || isMatchPaused) return;

    // Raccourcis universels pendant le combat
    if (isGpBtnJustPressed(0, 9)) { // Start = Pause & Menu Options
        sfx.playHit(false);
        handleEscapeOrStartAction();
        return;
    }
    if (isGpBtnJustPressed(0, 8)) { // Select = Grimoire des coups & Fatalités
        sfx.playHit(false);
        const mm = document.getElementById('movesModal');
        if (mm) {
            if (typeof renderMovesModalList === 'function') renderMovesModalList();
            mm.classList.remove('hidden');
        }
        return;
    }

    // ÉTAT FINISH HIM : Déclenchement rapide de la Fatalité
    if (matchState === 'finish_him') {
        if (isGpBtnJustPressed(0, 0) || isGpBtnJustPressed(0, 2) || isGpBtnJustPressed(0, 7) || isGpBtnJustPressed(0, 9)) {
            const fatalityBtn = document.getElementById('btnTriggerFatalityNow');
            if (fatalityBtn && !fatalityBtn.classList.contains('hidden')) {
                fatalityBtn.click();
                return;
            }
        }
    }

    // Rotation de la caméra 3D avec le stick droit (R-Stick)
    if (pad && pad.axes) {
        const rX = applyStickResponse(pad.axes[2] || 0);
        const rY = applyStickResponse(pad.axes[3] || 0);
        if (rX !== 0) {
            camOrbit.yaw = Math.max(-0.85, Math.min(0.85, camOrbit.yaw - rX * 1.5 * dt));
        }
        if (rY !== 0) {
            camOrbit.pitch = Math.max(0.02, Math.min(0.55, camOrbit.pitch - rY * 1.2 * dt));
        }
        // Clic stick droit (R3) = Réinitialiser l'angle caméra
        if (isGpBtnJustPressed(0, 11)) {
            camOrbit = { yaw: 0, pitch: 0.12 };
        }
    }

    // CONTRÔLES JOUEUR 1 (Manette 1)
    if (pad && fighter1 && fighter2) {
        const axX = applyStickResponse(pad.axes[0] || 0);
        const axY = applyStickResponse(pad.axes[1] || 0);
        touchState.left = axX < -0.28 || !!(pad.buttons[14]?.pressed);
        touchState.right = axX > 0.28 || !!(pad.buttons[15]?.pressed);
        touchState.up = axY < -0.28 || !!(pad.buttons[12]?.pressed);
        touchState.down = axY > 0.28 || !!(pad.buttons[13]?.pressed);

        // Retour visuel sur les touches tactiles
        flashArcadeButton('uiBtnLeft', touchState.left);
        flashArcadeButton('uiBtnRight', touchState.right);
        flashArcadeButton('uiBtnUp', touchState.up);
        flashArcadeButton('uiBtnDown', touchState.down);

        // Double-tap D-pad ou Stick gauche / droite pour Dash rapide (J1)
        const dpadLeftJust1 = isGpBtnJustPressed(0, 14);
        const dpadRightJust1 = isGpBtnJustPressed(0, 15);
        const prevAxX1 = gpState.p1.prevAxes ? (gpState.p1.prevAxes[0] || 0) : 0;
        const stickLeftFlick1 = axX < -0.55 && prevAxX1 >= -0.55;
        const stickRightFlick1 = axX > 0.55 && prevAxX1 <= 0.55;
        const nowMs = performance.now();

        if (dpadLeftJust1 || stickLeftFlick1) {
            if (nowMs - lastTapTime.gp1Left < 280 && fighter1) fighter1.startDash(-1);
            lastTapTime.gp1Left = nowMs;
        }
        if (dpadRightJust1 || stickRightFlick1) {
            if (nowMs - lastTapTime.gp1Right < 280 && fighter1) fighter1.startDash(1);
            lastTapTime.gp1Right = nowMs;
        }

        // 1. SAUTER : Bouton A (0)
        if (isGpBtnJustPressed(0, 0)) {
            flashArcadeButton('uiBtnJump', true);
            triggerPlayerAction(fighter1, fighter2, 'jump');
        }

        // 2. FRAPPER : Bouton X (2) - directionnel Haut / Mid / Bas selon le stick
        if (isGpBtnJustPressed(0, 2)) {
            flashArcadeButton('uiBtnStrike', true);
            triggerPlayerAction(fighter1, fighter2, 'strike');
        }

        // 3. SPÉCIAL UNIQUE : Bouton Y (3)
        if (isGpBtnJustPressed(0, 3)) {
            flashArcadeButton('uiBtnSpecial', true);
            triggerPlayerAction(fighter1, fighter2, 'special');
        }

        // 4. PROTÉGER : Bouton B (1) ou LB (4)
        const gpGuard = isGpBtnDown(pad, 1) || isGpBtnDown(pad, 4);
        touchState.guard = gpGuard;
        flashArcadeButton('uiBtnGuard', gpGuard);
        if (isGpBtnJustPressed(0, 1) || isGpBtnJustPressed(0, 4)) {
            triggerPlayerAction(fighter1, fighter2, 'guard');
        }

        // 5. DASHER : Bouton RB (5)
        if (isGpBtnJustPressed(0, 5)) {
            flashArcadeButton('uiBtnDash', true);
            triggerPlayerAction(fighter1, fighter2, 'dash');
        }

        // 6. SUPER ATTAQUE (RAGE) : Gâchette RT (7) ou LT (6)
        if (isGpBtnJustPressed(0, 7) || isGpBtnJustPressed(0, 6)) {
            flashArcadeButton('btnRageFatality', true);
            triggerPlayerAction(fighter1, fighter2, 'xray');
        }
    }

    // CONTRÔLES JOUEUR 2 (Manette 2 en mode PvP)
    if (pad2 && gameMode === 'pvp' && fighter2 && fighter1) {
        const axX2 = applyStickResponse(pad2.axes[0] || 0);
        const axY2 = applyStickResponse(pad2.axes[1] || 0);
        p2TouchState.left = axX2 < -0.28 || !!(pad2.buttons[14]?.pressed);
        p2TouchState.right = axX2 > 0.28 || !!(pad2.buttons[15]?.pressed);
        p2TouchState.up = axY2 < -0.28 || !!(pad2.buttons[12]?.pressed);
        p2TouchState.down = axY2 > 0.28 || !!(pad2.buttons[13]?.pressed);

        // Double-tap D-pad ou Stick gauche / droite pour Dash rapide (J2)
        const dpadLeftJust2 = isGpBtnJustPressed(1, 14);
        const dpadRightJust2 = isGpBtnJustPressed(1, 15);
        const prevAxX2 = gpState.p2.prevAxes ? (gpState.p2.prevAxes[0] || 0) : 0;
        const stickLeftFlick2 = axX2 < -0.55 && prevAxX2 >= -0.55;
        const stickRightFlick2 = axX2 > 0.55 && prevAxX2 <= 0.55;
        const nowMs2 = performance.now();

        if (dpadLeftJust2 || stickLeftFlick2) {
            if (nowMs2 - lastTapTime.gp2Left < 280 && fighter2) fighter2.startDash(-1);
            lastTapTime.gp2Left = nowMs2;
        }
        if (dpadRightJust2 || stickRightFlick2) {
            if (nowMs2 - lastTapTime.gp2Right < 280 && fighter2) fighter2.startDash(1);
            lastTapTime.gp2Right = nowMs2;
        }

        if (isGpBtnJustPressed(1, 0)) triggerPlayerAction(fighter2, fighter1, 'jump');
        if (isGpBtnJustPressed(1, 2)) triggerPlayerAction(fighter2, fighter1, 'strike');
        if (isGpBtnJustPressed(1, 3)) triggerPlayerAction(fighter2, fighter1, 'special');
        p2TouchState.guard = isGpBtnDown(pad2, 1) || isGpBtnDown(pad2, 4);
        if (isGpBtnJustPressed(1, 1) || isGpBtnJustPressed(1, 4)) triggerPlayerAction(fighter2, fighter1, 'guard');
        if (isGpBtnJustPressed(1, 5)) triggerPlayerAction(fighter2, fighter1, 'dash');
        if (isGpBtnJustPressed(1, 7) || isGpBtnJustPressed(1, 6)) triggerPlayerAction(fighter2, fighter1, 'xray');
    }
}


// 6. BOUCLE PRINCIPALE DE SONDAGE MANETTE (Appelée à chaque frame)
function pollGamepadInputs(dt = 0.016, now = performance.now()) {
    if (!navigator.getGamepads) return;

    // Protection contre les doubles appels dans la même frame
    if (lastGamepadPollFrame === now && now !== undefined) return;
    lastGamepadPollFrame = now;

    const pads = navigator.getGamepads();
    const pad1 = pads && pads[0];
    const pad2 = pads && pads[1];

    if (!pad1 && !pad2) {
        // Aucune manette connectée
        return;
    }

    gamepadActive = true;

    // Mise à jour de l'historique des boutons pour J1
    if (pad1) {
        gpState.p1.prevButtons = gpState.p1.buttons.slice();
        gpState.p1.prevAxes = gpState.p1.axes ? gpState.p1.axes.slice() : [];
        gpState.p1.buttons = pad1.buttons.map(b => b.pressed);
        gpState.p1.axes = pad1.axes.slice();
    }

    // Mise à jour de l'historique des boutons pour J2
    if (pad2) {
        gpState.p2.prevButtons = gpState.p2.buttons.slice();
        gpState.p2.prevAxes = gpState.p2.axes ? gpState.p2.axes.slice() : [];
        gpState.p2.buttons = pad2.buttons.map(b => b.pressed);
        gpState.p2.axes = pad2.axes.slice();
    }

    // Gestion contextuelle des interfaces selon l'ordre de priorité des calques :
    const movesModal = document.getElementById('movesModal');
    const isMovesModalOpen = movesModal && !movesModal.classList.contains('hidden');

    const settingsModal = document.getElementById('settingsModal');
    const isSettingsModalOpen = settingsModal && !settingsModal.classList.contains('hidden');

    const pauseModal = document.getElementById('pauseModal');
    const isPauseOpen = pauseModal && !pauseModal.classList.contains('hidden');

    const postMatchMenu = document.getElementById('postMatchMenu');
    const isPostMatchOpen = postMatchMenu && !postMatchMenu.classList.contains('hidden');

    if (isMovesModalOpen) {
        clearGamepadFocus();
        handleGamepadMovesModal(pad1, dt);
    } else if (isSettingsModalOpen) {
        handleGamepadSettingsModal(pad1, dt);
    } else if (isPauseOpen) {
        clearGamepadFocus();
        handleGamepadPauseModal(pad1, dt);
    } else if (matchState === 'match_over' || (isPostMatchOpen && matchState !== 'select' && matchState !== 'arena_select' && matchState !== 'main_menu' && matchState !== 'fight')) {
        handleGamepadPostMatch(pad1, dt);
    } else if (matchState === 'main_menu') {
        handleGamepadMainMenu(pad1, dt);
    } else if (matchState === 'select') {
        handleGamepadSelectScreen(pad1, pad2, dt);
    } else if (matchState === 'arena_select') {
        handleGamepadArenaScreen(pad1, dt);
    } else {
        // En combat ou cinématique
        clearGamepadFocus();
        handleGamepadBattle(pad1, pad2, dt);
    }

    // Mettre à jour la barre d'aide visuelle de la manette
    updateGamepadHelperHUD();
}


// 7. FONCTIONS DE DÉPLACEMENT EN COMBAT (J1 & J2)
function handlePlayer1Inputs(dt) {
    if (xrayCinematicTimer > 0 || fighter1.hitStun > 0 || fighter1.isDead || fighter1.isDizzy) return;
    if (fighter1.combatController && (fighter1.combatController.isInKnockdownSequence() || fighter1.combatController.state === CombatState.BLOCK_DEFLECTED)) {
        fighter1.vx = 0;
        return;
    }

    const moveLeft = keys['KeyA'] || keys['KeyQ'] || (gameMode !== 'pvp' && keys['ArrowLeft']) || touchState.left;
    const moveRight = keys['KeyD'] || (gameMode !== 'pvp' && keys['ArrowRight']) || touchState.right;
    const isUp = keys['KeyW'] || keys['KeyZ'] || (gameMode !== 'pvp' && keys['ArrowUp']) || touchState.up;
    const isDown = keys['KeyS'] || (gameMode !== 'pvp' && keys['ArrowDown']) || touchState.down;
    const jump = keys['Space'] || touchState.jump || !!(gpState.p1.buttons && gpState.p1.buttons[0]);
    const guardKey = keys['ShiftLeft'] || touchState.guard;

    // Détection directionnelle absolue relative à l'adversaire
    const isBack = (fighter1.facing === 1 && moveLeft) || (fighter1.facing === -1 && moveRight);
    const isForward = (fighter1.facing === 1 && moveRight) || (fighter1.facing === -1 && moveLeft);

    // Vitesse de base modifiée par le poison éventuel
    let curWalkSpd = fighter1.dino.walkSpeed;
    if (fighter1.poisonStacks >= 2) curWalkSpd *= 0.65;

    // Quetzalcoatlus : Mécanique de Vol avec Endurance Circulaire de 2 secondes
    // RÈGLES :
    // 1. Appuyer sur "A" quand l'animal est dans les airs (y > 0.05) et maintenir "A" -> il vole
    // 2. Quand on lâche "A" -> le Quetzalcoatlus descend (isFlying = false, gravité normale)
    // 3. Si on réappuie sur "A" et qu'il n'est pas encore au sol -> il repart à voler
    // 4. S'il est au sol (y <= 0.05) -> l'action se cancele, l'endurance se recharge
    if (fighter1.dino.id === 'quetzal' || fighter1.dino.id === 'quetzalcoatlus') {
        if (fighter1.flightEndurance === undefined) fighter1.flightEndurance = 2.0;

        const isHoldA = !!(
            (gpState.p1.buttons && gpState.p1.buttons[0]) || // Bouton A manette (0)
            keys['KeyA'] ||                                  // Touche Clavier 'A'
            keys['Space'] ||                                 // Touche Espace (Saut)
            touchState.jump                                  // Bouton Saut tactile
        );

        const airHeight1 = fighter1.y - (fighter1.groundY || 0);
        const isInAir = airHeight1 > 0.06;

        if (isInAir && isHoldA && fighter1.flightEndurance > 0 && fighter1.hitStun <= 0 && !fighter1.isDead) {
            // En l'air + maintien de A : sustentation et vol actif
            fighter1.isFlying = true;
            fighter1.onPlatform = null;
            fighter1.flightEndurance = Math.max(0, fighter1.flightEndurance - dt);

            // Contrôle vertical du vol : réascension immédiate si en descente
            if (isUp) {
                fighter1.vy = Math.min(5.5, (fighter1.vy || 0) + 26 * dt);
            } else if (isDown) {
                fighter1.vy = Math.max(-4.2, (fighter1.vy || 0) - 22 * dt);
            } else {
                if (fighter1.vy < 0) {
                    fighter1.vy = Math.min(3.0, fighter1.vy + 36 * dt);
                } else {
                    const timeSec = typeof nowSec !== 'undefined' ? nowSec : Date.now() * 0.001;
                    fighter1.vy = Math.min(2.5, (fighter1.vy || 0) * 0.90 + Math.sin(timeSec * 7) * 0.35 + 0.6);
                }
            }

            // Contrôle horizontal en vol
            if (moveLeft) {
                fighter1.vx = -curWalkSpd * 1.45;
            } else if (moveRight) {
                fighter1.vx = curWalkSpd * 1.45;
            } else {
                fighter1.vx *= 0.88;
            }

            if (fighter1.flightEndurance <= 0) {
                fighter1.isFlying = false;
                spawnFloatingPopup(fighter1.x, '⚡ ENDURANCE ÉPUISÉE !', '#f87171');
            }
        } else {
            // Quand on lâche "A", ou au sol/plateforme, ou endurance à 0 : le Quetzalcoatlus descend ou reste posé
            fighter1.isFlying = false;

            if (airHeight1 <= 0.06) {
                // Posé au sol ou sur une branche/plateforme : l'endurance se recharge
                fighter1.flightEndurance = Math.min(2.0, fighter1.flightEndurance + dt * 1.25);
            }
        }
    }

    const p1AirH = fighter1.y - (fighter1.groundY || 0);

    // Contrôle aérien pendant les sauts
    if (p1AirH > 0.06 && fighter1.dashTimer <= 0) {
        if (moveLeft) fighter1.x -= curWalkSpd * 0.85 * dt;
        if (moveRight) fighter1.x += curWalkSpd * 0.85 * dt;
    }

    // Verrouillage complet de l'input pendant les phases d'attaque (Windup, Active, Recovery)
    if (fighter1.actionDuration > 0 || fighter1.dashTimer > 0) return;

    // --- MATRICE DE GARDE DIRECTIONNELLE 3-VOIES (HIGH / MID / LOW) ---
    // Représentée par une armure ostéodermique 3D à l'endroit défendu (Haute, Médiane ou Basse)
    const wantsGuard = isBack || guardKey || (isDown && !moveLeft && !moveRight);
    if (wantsGuard && p1AirH <= 0.08) {
        fighter1.isBlocking = true;
        if (isUp) {
            fighter1.blockType = 'high'; // Protège le crâne / cornes
            fighter1.action = isBack ? 'walk' : 'idle';
        } else if (isDown) {
            fighter1.blockType = 'low';  // Protège les pattes / queue
            fighter1.action = 'crouch';
        } else {
            fighter1.blockType = 'mid';  // Protège le torse / flanc
            fighter1.action = isBack ? 'walk' : 'idle';
        }
        fighter1.sprintDuration = 0;
        fighter1.isSprinting = false;
        fighter1.vx = isBack ? -fighter1.facing * curWalkSpd * 0.45 : 0;
        fighter1.x += fighter1.vx * dt;
        return;
    }

    // Pas de garde active
    fighter1.isBlocking = false;
    fighter1.blockType = 'none';

    // SAUTER : Action de saut dédiée (Espace), complètement découplée de Haut pour frapper en haut sans sauter
    if (jump && p1AirH <= 0.08) {
        // Descente à travers les plateformes semi-solides (Bas + Saut)
        const gFloor = (typeof getArenaGroundHeight === 'function') ? getArenaGroundHeight(currentArena, fighter1.x, 0) : 0;
        if (isDown && fighter1.y > gFloor + 0.35) {
            fighter1._dropThroughTimer = 0.35;
            fighter1.vy = -4.0;
            fighter1.y -= 0.16;
            return;
        }
        fighter1.vy = fighter1.jumpVy || 11.8;
        if (moveLeft) fighter1.vx = -curWalkSpd * 0.65;
        if (moveRight) fighter1.vx = curWalkSpd * 0.65;
        fighter1.action = 'jump';
        return;
    }

    // Accélération progressive : Walk -> Run -> Sprint (Momentum Velocity ||v||)
    if (moveLeft || moveRight) {
        const moveDir = moveLeft ? -1 : 1;
        if (isForward) {
            fighter1.sprintDuration = (fighter1.sprintDuration || 0) + dt;
        } else {
            fighter1.sprintDuration = 0;
        }
        const accelMult = fighter1.sprintDuration > 0.45 ? 1.55 : (fighter1.sprintDuration > 0.18 ? 1.25 : 1.0);
        fighter1.isSprinting = fighter1.sprintDuration > 0.45;
        fighter1.vx = moveDir * curWalkSpd * accelMult;
        fighter1.x += fighter1.vx * dt;
        fighter1.action = 'walk';
    } else {
        fighter1.sprintDuration = 0;
        fighter1.isSprinting = false;
        fighter1.action = 'idle';
    }
}

function handlePlayer2Inputs(dt) {
    if (xrayCinematicTimer > 0 || fighter2.hitStun > 0 || fighter2.isDead || fighter2.isDizzy) return;
    if (fighter2.combatController && (fighter2.combatController.isInKnockdownSequence() || fighter2.combatController.state === CombatState.BLOCK_DEFLECTED)) {
        fighter2.vx = 0;
        return;
    }

    const moveLeft = keys['ArrowLeft'] || p2TouchState.left;
    const moveRight = keys['ArrowRight'] || p2TouchState.right;
    const isUp = keys['ArrowUp'] || p2TouchState.up;
    const isDown = keys['ArrowDown'] || p2TouchState.down;
    const jump = keys['Numpad8'] || keys['KeyU'] || p2TouchState.jump || !!(gpState.p2.buttons && gpState.p2.buttons[0]);
    const guardKey = keys['Numpad5'] || keys['KeyK'] || p2TouchState.guard;

    const isBack = (fighter2.facing === 1 && moveLeft) || (fighter2.facing === -1 && moveRight);
    const isForward = (fighter2.facing === 1 && moveRight) || (fighter2.facing === -1 && moveLeft);

    let curWalkSpd = fighter2.dino.walkSpeed;
    if (fighter2.poisonStacks >= 2) curWalkSpd *= 0.65;

    // Quetzalcoatlus Vol J2 avec Endurance Circulaire de 2 secondes
    if (fighter2.dino.id === 'quetzal' || fighter2.dino.id === 'quetzalcoatlus') {
        if (fighter2.flightEndurance === undefined) fighter2.flightEndurance = 2.0;

        const isHoldA2 = !!(
            (gpState.p2.buttons && gpState.p2.buttons[0]) || // Bouton A manette J2
            keys['Numpad8'] ||                               // Touche Saut J2 pavé num
            keys['KeyU'] ||
            keys['KeyA'] ||
            p2TouchState.jump
        );

        const airHeight2 = fighter2.y - (fighter2.groundY || 0);
        const isInAir2 = airHeight2 > 0.06;

        if (isInAir2 && isHoldA2 && fighter2.flightEndurance > 0 && fighter2.hitStun <= 0 && !fighter2.isDead) {
            fighter2.isFlying = true;
            fighter2.flightEndurance = Math.max(0, fighter2.flightEndurance - dt);

            if (isUp) {
                fighter2.vy = Math.min(5.5, (fighter2.vy || 0) + 26 * dt);
            } else if (isDown) {
                fighter2.vy = Math.max(-4.2, (fighter2.vy || 0) - 22 * dt);
            } else {
                if (fighter2.vy < 0) {
                    fighter2.vy = Math.min(3.0, fighter2.vy + 36 * dt);
                } else {
                    const timeSec = typeof nowSec !== 'undefined' ? nowSec : Date.now() * 0.001;
                    fighter2.vy = Math.min(2.5, (fighter2.vy || 0) * 0.90 + Math.sin(timeSec * 7) * 0.35 + 0.6);
                }
            }

            if (moveLeft) {
                fighter2.vx = -curWalkSpd * 1.45;
            } else if (moveRight) {
                fighter2.vx = curWalkSpd * 1.45;
            } else {
                fighter2.vx *= 0.88;
            }

            if (fighter2.flightEndurance <= 0) {
                fighter2.isFlying = false;
                spawnFloatingPopup(fighter2.x, '⚡ ENDURANCE ÉPUISÉE !', '#f87171');
            }
        } else {
            fighter2.isFlying = false;
            if (airHeight2 <= 0.06) {
                fighter2.flightEndurance = Math.min(2.0, fighter2.flightEndurance + dt * 1.25);
            }
        }
    }

    const p2AirH = fighter2.y - (fighter2.groundY || 0);

    if (p2AirH > 0.06 && fighter2.dashTimer <= 0) {
        if (moveLeft) fighter2.x -= curWalkSpd * 0.85 * dt;
        if (moveRight) fighter2.x += curWalkSpd * 0.85 * dt;
    }

    if (fighter2.actionDuration > 0 || fighter2.dashTimer > 0) return;

    // Garde directionnelle 3-voies J2
    const wantsGuard2 = isBack || guardKey || (isDown && !moveLeft && !moveRight);
    if (wantsGuard2 && p2AirH <= 0.08) {
        fighter2.isBlocking = true;
        if (isUp) {
            fighter2.blockType = 'high';
            fighter2.action = isBack ? 'walk' : 'idle';
        } else if (isDown) {
            fighter2.blockType = 'low';
            fighter2.action = 'crouch';
        } else {
            fighter2.blockType = 'mid';
            fighter2.action = isBack ? 'walk' : 'idle';
        }
        fighter2.sprintDuration = 0;
        fighter2.isSprinting = false;
        fighter2.vx = isBack ? -fighter2.facing * curWalkSpd * 0.45 : 0;
        fighter2.x += fighter2.vx * dt;
        return;
    }

    fighter2.isBlocking = false;
    fighter2.blockType = 'none';

    if (jump && p2AirH <= 0.08) {
        const gFloor2 = (typeof getArenaGroundHeight === 'function') ? getArenaGroundHeight(currentArena, fighter2.x, 0) : 0;
        if (isDown && fighter2.y > gFloor2 + 0.35) {
            fighter2._dropThroughTimer = 0.35;
            fighter2.vy = -4.0;
            fighter2.y -= 0.16;
            return;
        }
        fighter2.vy = fighter2.jumpVy || 11.8;
        if (moveLeft) fighter2.vx = -curWalkSpd * 0.65;
        if (moveRight) fighter2.vx = curWalkSpd * 0.65;
        fighter2.action = 'jump';
        return;
    }

    if (moveLeft || moveRight) {
        const moveDir = moveLeft ? -1 : 1;
        if (isForward) {
            fighter2.sprintDuration = (fighter2.sprintDuration || 0) + dt;
        } else {
            fighter2.sprintDuration = 0;
        }
        const accelMult = fighter2.sprintDuration > 0.45 ? 1.55 : (fighter2.sprintDuration > 0.18 ? 1.25 : 1.0);
        fighter2.isSprinting = fighter2.sprintDuration > 0.45;
        fighter2.vx = moveDir * curWalkSpd * accelMult;
        fighter2.x += fighter2.vx * dt;
        fighter2.action = 'walk';
    } else {
        fighter2.sprintDuration = 0;
        fighter2.isSprinting = false;
        fighter2.action = 'idle';
    }
}

// 8. INITIALISATION DU SYSTÈME MANETTE
function initGamepadSystem() {
    createGamepadHelperHUD();
    updateGamepadHelperHUD();
}
