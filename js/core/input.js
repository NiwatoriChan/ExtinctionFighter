/* ============================================================================
 * SYSTÈME DE CONTRÔLE MANETTE & CLAVIER UNIFIÉ
 * Prise en charge intégrale de TOUTES les interfaces (Menus, Roster, Arènes,
 * Paramètres, Grimoire, Combat, Écran de Fin) avec manettes standard USB/Bluetooth.
 * ============================================================================ */

// 1. ÉCOUTEURS CLAVIER (Conservés & enrichis)
window.addEventListener('keydown', (e) => {
    // Empêcher le défilement de la page avec Espace ou les Flèches pendant un combat
    if (matchState !== 'select' && ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
    }
    if (e.repeat) return;

    const now = performance.now();
    keys[e.code] = true;

    // Retour visuel sur les boutons Arcade
    if (e.code === 'KeyA' || e.code === 'KeyQ' || (gameMode !== 'pvp' && e.code === 'ArrowLeft')) flashArcadeButton('uiBtnLeft', true);
    if (e.code === 'KeyD' || (gameMode !== 'pvp' && e.code === 'ArrowRight')) flashArcadeButton('uiBtnRight', true);
    if (e.code === 'KeyW' || e.code === 'KeyZ' || (gameMode !== 'pvp' && e.code === 'ArrowUp')) flashArcadeButton('uiBtnUp', true);
    if (e.code === 'KeyS' || (gameMode !== 'pvp' && e.code === 'ArrowDown')) flashArcadeButton('uiBtnDown', true);

    // Bloquer tous les contrôles si une cinématique X-Ray est en cours
    if (xrayCinematicTimer > 0) return;

    if (matchState === 'fight' || matchState === 'finish_him') {
        // Double-tap Gauche/Droite ou touche E pour Dash J1
        if (e.code === 'KeyA' || e.code === 'KeyQ' || (gameMode !== 'pvp' && e.code === 'ArrowLeft')) {
            if (now - lastTapTime.left < 240 && fighter1) fighter1.startDash(-1);
            lastTapTime.left = now;
        }
        if (e.code === 'KeyD' || (gameMode !== 'pvp' && e.code === 'ArrowRight')) {
            if (now - lastTapTime.right < 240 && fighter1) fighter1.startDash(1);
            lastTapTime.right = now;
        }
        if (e.code === 'KeyE') {
            flashArcadeButton('uiBtnDash', true);
            triggerPlayerAction(fighter1, fighter2, 'dash');
        }

        if (e.code === 'KeyF' || e.code === 'KeyJ') { flashArcadeButton('uiBtnLight', true); triggerPlayerAction(fighter1, fighter2, 'light'); }
        if (e.code === 'KeyG' || e.code === 'KeyK') { flashArcadeButton('uiBtnHeavy', true); triggerPlayerAction(fighter1, fighter2, 'heavy'); }
        if (e.code === 'KeyH' || e.code === 'KeyL') { flashArcadeButton('uiBtnSpecial', true); triggerPlayerAction(fighter1, fighter2, 'special'); }
        if (e.code === 'KeyT' || e.code === 'KeyU') { flashArcadeButton('uiBtnSpecial2', true); triggerPlayerAction(fighter1, fighter2, 'special2'); }
        if (e.code === 'KeyR' || e.code === 'Space') { flashArcadeButton('btnRageFatality', true); triggerPlayerAction(fighter1, fighter2, 'xray'); }

        if (gameMode === 'pvp') {
            if (e.code === 'ArrowLeft') {
                if (now - lastTapTime.p2Left < 240 && fighter2) fighter2.startDash(-1);
                lastTapTime.p2Left = now;
            }
            if (e.code === 'ArrowRight') {
                if (now - lastTapTime.p2Right < 240 && fighter2) fighter2.startDash(1);
                lastTapTime.p2Right = now;
            }
            if (e.code === 'Numpad5') triggerPlayerAction(fighter2, fighter1, 'dash');
            if (e.code === 'Numpad1' || e.code === 'KeyI') triggerPlayerAction(fighter2, fighter1, 'light');
            if (e.code === 'Numpad2' || e.code === 'KeyO') triggerPlayerAction(fighter2, fighter1, 'heavy');
            if (e.code === 'Numpad3' || e.code === 'KeyP') triggerPlayerAction(fighter2, fighter1, 'special');
            if (e.code === 'Numpad4') triggerPlayerAction(fighter2, fighter1, 'special2');
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
    if (e.code === 'KeyE') flashArcadeButton('uiBtnDash', false);
    if (e.code === 'KeyF' || e.code === 'KeyJ') flashArcadeButton('uiBtnLight', false);
    if (e.code === 'KeyG' || e.code === 'KeyK') flashArcadeButton('uiBtnHeavy', false);
    if (e.code === 'KeyH' || e.code === 'KeyL') flashArcadeButton('uiBtnSpecial', false);
    if (e.code === 'KeyT' || e.code === 'KeyU') flashArcadeButton('uiBtnSpecial2', false);
    if (e.code === 'KeyR' || e.code === 'Space') flashArcadeButton('btnRageFatality', false);
});


// 2. ÉTAT ET GESTIONNAIRE UNIFIÉ DE MANETTES
let gamepadActive = false;
let lastGamepadPollFrame = -1;
let currentFocusedElement = null;

const gpState = {
    p1: { buttons: [], prevButtons: [], axes: [], navLastDir: null, navRepeatTimer: 0 },
    p2: { buttons: [], prevButtons: [], axes: [], navLastDir: null, navRepeatTimer: 0 }
};

// Variables d'état de navigation pour chaque écran
let mainMenuFocusIdx = 0;
let mainMenuInHeader = false;
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
    if (currentFocusedElement && currentFocusedElement !== el) {
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
        toast = document.createElement('div');
        toast.id = 'gamepadToast';
        toast.className = 'fixed top-14 left-1/2 -translate-x-1/2 z-50 pointer-events-none px-4 py-2 rounded-xl bg-zinc-950/95 border-2 border-amber-400 text-amber-300 font-black text-xs sm:text-sm tracking-wider uppercase shadow-[0_0_25px_rgba(245,158,11,0.6)] transition-all duration-300 opacity-0 transform -translate-y-2';
        document.body.appendChild(toast);
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


// 3. BARRE D'AIDE MANETTE CONTEXTUELLE EN BAS D'ÉCRAN
function createGamepadHelperHUD() {
    if (document.getElementById('gamepadHelperBar')) return;
    const bar = document.createElement('div');
    bar.id = 'gamepadHelperBar';
    bar.className = 'fixed bottom-1 left-1/2 -translate-x-1/2 z-40 pointer-events-none px-3.5 py-1 rounded-full bg-zinc-950/90 backdrop-blur-md border border-amber-500/40 shadow-2xl flex items-center justify-center gap-2 text-[10px] sm:text-xs text-zinc-300 font-bold transition-all duration-200 select-none opacity-95 max-w-[95vw] overflow-x-auto';
    document.body.appendChild(bar);
}

function updateGamepadHelperHUD() {
    const bar = document.getElementById('gamepadHelperBar');
    if (!bar) return;

    const movesModal = document.getElementById('movesModal');
    const isMovesModalOpen = movesModal && !movesModal.classList.contains('hidden');

    const settingsModal = document.getElementById('settingsModal');
    const isSettingsModalOpen = settingsModal && !settingsModal.classList.contains('hidden');

    const postMatchMenu = document.getElementById('postMatchMenu');
    const isPostMatchOpen = postMatchMenu && !postMatchMenu.classList.contains('hidden');

    if (isMovesModalOpen) {
        bar.innerHTML = `
            <span class="text-amber-400 font-extrabold">📜 GRIMOIRE</span>
            <span class="gp-key">Stick / D-Pad</span> Défiler
            <span class="gp-key gp-key-gold">B / START</span> Fermer
        `;
    } else if (isSettingsModalOpen) {
        bar.innerHTML = `
            <span class="text-amber-400 font-extrabold">⚙️ PARAMÈTRES</span>
            <span class="gp-key">D-Pad Haut/Bas</span> Naviguer
            <span class="gp-key gp-key-gold">◀ ▶ / A</span> Modifier
            <span class="gp-key">B / START</span> Fermer
        `;
    } else if (matchState === 'match_over' || (isPostMatchOpen && matchState !== 'select' && matchState !== 'arena_select' && matchState !== 'main_menu' && matchState !== 'fight')) {
        bar.innerHTML = `
            <span class="text-amber-400 font-extrabold">🏆 FIN DU MATCH</span>
            <span class="gp-key">D-Pad Gauche/Droite</span> Choisir
            <span class="gp-key gp-key-gold">A</span> Valider
            <span class="gp-key">START</span> Revanche
            <span class="gp-key">B</span> Combattants
        `;
    } else if (matchState === 'main_menu') {
        bar.innerHTML = `
            <span class="text-amber-400 font-extrabold">🎮 MENU</span>
            <span class="gp-key">D-Pad</span> Naviguer
            <span class="gp-key gp-key-gold">A</span> Valider
            <span class="gp-key">B</span> Retour
            <span class="gp-key">START</span> Paramètres
            <span class="gp-key">SELECT</span> Grimoire
        `;
    } else if (matchState === 'select') {
        bar.innerHTML = `
            <span class="text-amber-400 font-extrabold">🦖 COMBATTANTS</span>
            <span class="gp-key">D-Pad</span> Choisir
            <span class="gp-key gp-key-gold">A</span> Valider / Suivant
            <span class="gp-key">LB / RB</span> Skins J1
            <span class="gp-key">X</span> Aléatoire
            <span class="gp-key gp-key-action">START</span> Arène
            <span class="gp-key">B</span> Menu
        `;
    } else if (matchState === 'arena_select') {
        bar.innerHTML = `
            <span class="text-amber-400 font-extrabold">🌋 ARÈNES</span>
            <span class="gp-key">D-Pad</span> Choisir Arène
            <span class="gp-key gp-key-action">START / A</span> Lancer le Kombat !
            <span class="gp-key">X</span> Aléatoire
            <span class="gp-key">B</span> Retour
        `;
    } else if (matchState === 'fight' || matchState === 'finish_him' || matchState === 'round_over' || matchState === 'intro') {
        if (matchState === 'finish_him') {
            bar.innerHTML = `
                <span class="text-red-400 animate-pulse font-black">💀 FINISH HIM !</span>
                <span class="gp-key gp-key-action">A / RT / START</span> EXÉCUTER LA FATALITÉ !
            `;
        } else {
            bar.innerHTML = `
                <span class="text-amber-400 font-extrabold">⚔️ COMBAT</span>
                <span class="gp-key">A</span> Léger
                <span class="gp-key">X</span> Lourd
                <span class="gp-key">Y</span> Spécial
                <span class="gp-key">B</span> Ultra
                <span class="gp-key">RB</span> Dash
                <span class="gp-key gp-key-action">RT</span> X-Ray / Fatal
                <span class="gp-key">R-Stick</span> Caméra
                <span class="gp-key">START</span> Options
            `;
        }
    }
}


// 4. ANALYSEURS D'ENTRÉES MANETTE (Répétition & Déclenchement sur front)
function getNavDirection(pad) {
    if (!pad) return null;
    const axX = pad.axes[0] || 0;
    const axY = pad.axes[1] || 0;
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

    // Boutons de fermeture : B (1), Start (9), Select (8) ou A (0)
    if (isGpBtnJustPressed(0, 1) || isGpBtnJustPressed(0, 8) || isGpBtnJustPressed(0, 9) || isGpBtnJustPressed(0, 0)) {
        sfx.playHit(false);
        movesModal.classList.add('hidden');
    }
}

// B. PARAMÈTRES DU JEU (MODAL)
function handleGamepadSettingsModal(pad, dt) {
    const nav = checkNavInput(pad, 0, dt);
    const rowElements = [
        document.querySelector('.btn-gfx-opt[data-gfx="' + graphicsQuality + '"]') || document.querySelector('.btn-gfx-opt'),
        document.getElementById('btnToggleFullscreen'),
        document.getElementById('settingsAiDiff'),
        document.getElementById('btnSettingsSoundToggle'),
        document.getElementById('btnSaveSettingsClose')
    ];

    if (nav === 'up') {
        settingsRow = Math.max(0, settingsRow - 1);
        sfx.playHit(false);
    } else if (nav === 'down') {
        settingsRow = Math.min(rowElements.length - 1, settingsRow + 1);
        sfx.playHit(false);
    }

    const targetEl = rowElements[settingsRow];
    if (targetEl) setGamepadFocus(targetEl);

    // Modification selon la ligne active
    const btnA = isGpBtnJustPressed(0, 0);

    if (settingsRow === 0) { // 1. Qualité Graphique
        const gfxOpts = ['low', 'medium', 'high', 'ultra'];
        let curIdx = gfxOpts.indexOf(graphicsQuality);
        if (curIdx === -1) curIdx = 2;

        if (nav === 'left') {
            const nextQ = gfxOpts[Math.max(0, curIdx - 1)];
            applyGraphicsSettings(nextQ);
            updateSettingsUI();
            sfx.playHit(false);
        } else if (nav === 'right' || btnA) {
            const nextQ = gfxOpts[(curIdx + 1) % gfxOpts.length];
            applyGraphicsSettings(nextQ);
            updateSettingsUI();
            sfx.playHit(false);
        }
    } else if (settingsRow === 1) { // 2. Plein écran
        if (btnA) {
            const btnFs = document.getElementById('btnToggleFullscreen');
            if (btnFs) btnFs.click();
        }
    } else if (settingsRow === 2) { // 3. Difficulté de l'IA
        const diffOpts = ['easy', 'normal', 'brutal'];
        let curIdx = diffOpts.indexOf(aiDifficulty);
        if (curIdx === -1) curIdx = 1;

        if (nav === 'left') {
            aiDifficulty = diffOpts[(curIdx - 1 + diffOpts.length) % diffOpts.length];
            const sel = document.getElementById('settingsAiDiff');
            if (sel) sel.value = aiDifficulty;
            sfx.playHit(false);
        } else if (nav === 'right' || btnA) {
            aiDifficulty = diffOpts[(curIdx + 1) % diffOpts.length];
            const sel = document.getElementById('settingsAiDiff');
            if (sel) sel.value = aiDifficulty;
            sfx.playHit(false);
        }
    } else if (settingsRow === 3) { // 4. Audio
        if (btnA) {
            const sndBtn = document.getElementById('btnSettingsSoundToggle');
            if (sndBtn) sndBtn.click();
        }
    } else if (settingsRow === 4) { // 5. Valider & Fermer
        if (btnA) {
            closeSettingsModal();
        }
    }

    // Fermer les paramètres avec B (1) ou Start (9)
    if (isGpBtnJustPressed(0, 1) || isGpBtnJustPressed(0, 9)) {
        closeSettingsModal();
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
    const list = [];
    const btn1P = document.getElementById('btnMenu1P');
    if (btn1P) list.push(btn1P);

    const sub1P = document.getElementById('submenu1P');
    if (sub1P && !sub1P.classList.contains('hidden')) {
        ['btnSubCampaign', 'btnSubVsAI', 'btnSubPractice'].forEach(id => {
            const el = document.getElementById(id);
            if (el) list.push(el);
        });
    }

    const btn2P = document.getElementById('btnMenu2P');
    if (btn2P) list.push(btn2P);

    const sub2P = document.getElementById('submenu2P');
    if (sub2P && !sub2P.classList.contains('hidden')) {
        const el = document.getElementById('btnSubPvP');
        if (el) list.push(el);
    }

    const btnSet = document.getElementById('btnMenuSettings');
    if (btnSet) list.push(btnSet);

    const btnMov = document.getElementById('btnMenuMoves');
    if (btnMov) list.push(btnMov);

    return list;
}

function getHeaderNavElements() {
    const list = [];
    ['btnHome', 'btnHeaderSettings', 'btnToggleSound', 'btnShowMoves', 'btnBackToSelect'].forEach(id => {
        const el = document.getElementById(id);
        if (el && !el.classList.contains('hidden')) list.push(el);
    });
    return list;
}

function handleGamepadMainMenu(pad, dt) {
    const nav = checkNavInput(pad, 0, dt);
    const menuButtons = getMainMenuNavElements();
    const headerButtons = getHeaderNavElements();

    if (mainMenuInHeader) {
        if (nav === 'left') {
            headerFocusIdx = (headerFocusIdx - 1 + headerButtons.length) % headerButtons.length;
            sfx.playHit(false);
        } else if (nav === 'right') {
            headerFocusIdx = (headerFocusIdx + 1) % headerButtons.length;
            sfx.playHit(false);
        } else if (nav === 'down') {
            mainMenuInHeader = false;
            sfx.playHit(false);
        }

        const target = headerButtons[headerFocusIdx];
        if (target) setGamepadFocus(target);

        if (isGpBtnJustPressed(0, 0)) {
            if (target) target.click();
        }
        if (isGpBtnJustPressed(0, 1)) {
            mainMenuInHeader = false;
        }
    } else {
        if (nav === 'up') {
            if (mainMenuFocusIdx > 0) {
                mainMenuFocusIdx--;
                sfx.playHit(false);
            } else {
                mainMenuInHeader = true;
                headerFocusIdx = 0;
                sfx.playHit(false);
            }
        } else if (nav === 'down') {
            if (mainMenuFocusIdx < menuButtons.length - 1) {
                mainMenuFocusIdx++;
                sfx.playHit(false);
            }
        }

        mainMenuFocusIdx = Math.max(0, Math.min(menuButtons.length - 1, mainMenuFocusIdx));
        const target = menuButtons[mainMenuFocusIdx];
        if (target) setGamepadFocus(target);

        if (isGpBtnJustPressed(0, 0)) {
            if (target) target.click();
        }

        // Touche B : refermer le sous-menu si actif
        if (isGpBtnJustPressed(0, 1)) {
            const sub1P = document.getElementById('submenu1P');
            const sub2P = document.getElementById('submenu2P');
            if (sub1P && !sub1P.classList.contains('hidden')) {
                sub1P.classList.add('hidden');
                sub1P.classList.remove('flex');
                mainMenuFocusIdx = 0;
                sfx.playHit(false);
            } else if (sub2P && !sub2P.classList.contains('hidden')) {
                sub2P.classList.add('hidden');
                sub2P.classList.remove('flex');
                mainMenuFocusIdx = 1;
                sfx.playHit(false);
            }
        }
    }

    // Raccourcis globaux du menu
    if (isGpBtnJustPressed(0, 9)) { // Start = Paramètres
        sfx.playHit(false);
        openSettingsModal();
    }
    if (isGpBtnJustPressed(0, 8)) { // Select = Grimoire
        sfx.playHit(false);
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
            } else {
                // En solo (Campagne, Vs IA, Entraînement) -> direct vers Arène
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
            sfx.playHit(false);
            updateSelectScreenUI();
        }

        // Raccourcis Manette 2 : Skins & Aléatoire
        if (isGpBtnJustPressed(1, 4)) { const b = document.getElementById('btnP2PrevSkin'); if (b) b.click(); }
        if (isGpBtnJustPressed(1, 5)) { const b = document.getElementById('btnP2NextSkin'); if (b) b.click(); }
        if (isGpBtnJustPressed(1, 2)) { // X = Aléatoire J2
            do { p2ChoiceIndex = Math.floor(Math.random() * DINO_ROSTER.length); } while (p2ChoiceIndex === p1ChoiceIndex);
            updateSelectScreenUI();
            sfx.playHit(false);
        }
    }

    // Raccourcis manette J1 (sur le Roster)
    if (isGpBtnJustPressed(0, 4)) { const b = document.getElementById('btnP1PrevSkin'); if (b) b.click(); } // LB = Skin précédent J1
    if (isGpBtnJustPressed(0, 5)) { const b = document.getElementById('btnP1NextSkin'); if (b) b.click(); } // RB = Skin suivant J1
    if (isGpBtnJustPressed(0, 6)) { const b = document.getElementById('btnP2PrevSkin'); if (b) b.click(); } // LT = Skin précédent J2
    if (isGpBtnJustPressed(0, 7)) { const b = document.getElementById('btnP2NextSkin'); if (b) b.click(); } // RT = Skin suivant J2

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
        if (nav === 'up') {
            const nextIdx = (curArenaIdx - 1 + ARENA_LIST.length) % ARENA_LIST.length;
            selectArena(ARENA_LIST[nextIdx].id);
            sfx.playHit(false);
        } else if (nav === 'down') {
            const nextIdx = (curArenaIdx + 1) % ARENA_LIST.length;
            selectArena(ARENA_LIST[nextIdx].id);
            sfx.playHit(false);
        } else if (nav === 'right' || nav === 'left') {
            arenaFocusZone = 'topButtons';
            arenaTopIdx = topButtons.length - 1; // "Lancer le Kombat"
            sfx.playHit(false);
        }

        const activeCard = arenaCards[curArenaIdx];
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
        } else if (nav === 'down') {
            arenaFocusZone = 'cards';
            sfx.playHit(false);
        }

        const target = topButtons[arenaTopIdx];
        if (target) setGamepadFocus(target);

        if (isGpBtnJustPressed(0, 0)) {
            if (target) target.click();
        }
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
    if (xrayCinematicTimer > 0) return;

    // Raccourcis universels pendant le combat
    if (isGpBtnJustPressed(0, 9)) { // Start = Pause & Paramètres
        sfx.playHit(false);
        openSettingsModal();
        return;
    }
    if (isGpBtnJustPressed(0, 8)) { // Select = Grimoire des coups & Fatalités
        sfx.playHit(false);
        document.getElementById('movesModal').classList.remove('hidden');
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
        const rX = Math.abs(pad.axes[2]) > 0.15 ? pad.axes[2] : 0;
        const rY = Math.abs(pad.axes[3]) > 0.15 ? pad.axes[3] : 0;
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
        const axX = pad.axes[0] || 0;
        const axY = pad.axes[1] || 0;
        touchState.left = axX < -0.35 || !!(pad.buttons[14]?.pressed);
        touchState.right = axX > 0.35 || !!(pad.buttons[15]?.pressed);
        touchState.up = axY < -0.45 || !!(pad.buttons[12]?.pressed);
        touchState.down = axY > 0.45 || !!(pad.buttons[13]?.pressed);

        // Retour visuel sur les touches tactiles
        flashArcadeButton('uiBtnLeft', touchState.left);
        flashArcadeButton('uiBtnRight', touchState.right);
        flashArcadeButton('uiBtnUp', touchState.up);
        flashArcadeButton('uiBtnDown', touchState.down);

        // Actions J1 (Attaques & Dash)
        if (isGpBtnJustPressed(0, 0)) { flashArcadeButton('uiBtnLight', true); triggerPlayerAction(fighter1, fighter2, 'light'); }
        if (isGpBtnJustPressed(0, 2)) { flashArcadeButton('uiBtnHeavy', true); triggerPlayerAction(fighter1, fighter2, 'heavy'); }
        if (isGpBtnJustPressed(0, 3)) { flashArcadeButton('uiBtnSpecial', true); triggerPlayerAction(fighter1, fighter2, 'special'); }
        if (isGpBtnJustPressed(0, 1)) { flashArcadeButton('uiBtnSpecial2', true); triggerPlayerAction(fighter1, fighter2, 'special2'); }
        if (isGpBtnJustPressed(0, 5) || isGpBtnJustPressed(0, 4)) { flashArcadeButton('uiBtnDash', true); triggerPlayerAction(fighter1, fighter2, 'dash'); }
        if (isGpBtnJustPressed(0, 7) || isGpBtnJustPressed(0, 6)) { flashArcadeButton('btnRageFatality', true); triggerPlayerAction(fighter1, fighter2, 'xray'); }
    }

    // CONTRÔLES JOUEUR 2 (Manette 2 en mode PvP)
    if (pad2 && gameMode === 'pvp' && fighter2 && fighter1) {
        const axX2 = pad2.axes[0] || 0;
        const axY2 = pad2.axes[1] || 0;
        p2TouchState.left = axX2 < -0.35 || !!(pad2.buttons[14]?.pressed);
        p2TouchState.right = axX2 > 0.35 || !!(pad2.buttons[15]?.pressed);
        p2TouchState.up = axY2 < -0.45 || !!(pad2.buttons[12]?.pressed);
        p2TouchState.down = axY2 > 0.45 || !!(pad2.buttons[13]?.pressed);

        if (isGpBtnJustPressed(1, 0)) triggerPlayerAction(fighter2, fighter1, 'light');
        if (isGpBtnJustPressed(1, 2)) triggerPlayerAction(fighter2, fighter1, 'heavy');
        if (isGpBtnJustPressed(1, 3)) triggerPlayerAction(fighter2, fighter1, 'special');
        if (isGpBtnJustPressed(1, 1)) triggerPlayerAction(fighter2, fighter1, 'special2');
        if (isGpBtnJustPressed(1, 5) || isGpBtnJustPressed(1, 4)) triggerPlayerAction(fighter2, fighter1, 'dash');
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
        gpState.p1.buttons = pad1.buttons.map(b => b.pressed);
        gpState.p1.axes = pad1.axes.slice();
    }

    // Mise à jour de l'historique des boutons pour J2
    if (pad2) {
        gpState.p2.prevButtons = gpState.p2.buttons.slice();
        gpState.p2.buttons = pad2.buttons.map(b => b.pressed);
        gpState.p2.axes = pad2.axes.slice();
    }

    // Gestion contextuelle des interfaces selon l'ordre de priorité des calques :
    const movesModal = document.getElementById('movesModal');
    const isMovesModalOpen = movesModal && !movesModal.classList.contains('hidden');

    const settingsModal = document.getElementById('settingsModal');
    const isSettingsModalOpen = settingsModal && !settingsModal.classList.contains('hidden');

    const postMatchMenu = document.getElementById('postMatchMenu');
    const isPostMatchOpen = postMatchMenu && !postMatchMenu.classList.contains('hidden');

    if (isMovesModalOpen) {
        clearGamepadFocus();
        handleGamepadMovesModal(pad1, dt);
    } else if (isSettingsModalOpen) {
        handleGamepadSettingsModal(pad1, dt);
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

    const moveLeft = keys['KeyA'] || keys['KeyQ'] || (gameMode !== 'pvp' && keys['ArrowLeft']) || touchState.left;
    const moveRight = keys['KeyD'] || (gameMode !== 'pvp' && keys['ArrowRight']) || touchState.right;
    const jump = keys['KeyW'] || keys['KeyZ'] || (gameMode !== 'pvp' && keys['ArrowUp']) || touchState.up;
    const block = keys['KeyS'] || keys['ShiftLeft'] || (gameMode !== 'pvp' && keys['ArrowDown']) || touchState.down;

    // Permettre le contrôle aérien même pendant une attaque sautée
    if (fighter1.y > 0.05 && fighter1.dashTimer <= 0) {
        if (moveLeft) fighter1.x -= fighter1.dino.walkSpeed * 0.85 * dt;
        if (moveRight) fighter1.x += fighter1.dino.walkSpeed * 0.85 * dt;
    }

    if (fighter1.actionDuration > 0 || fighter1.dashTimer > 0) return;

    fighter1.isBlocking = block && fighter1.y <= 0.01;
    if (fighter1.isBlocking) {
        fighter1.action = 'crouch';
        return;
    }
    if (jump && fighter1.y <= 0.01) {
        fighter1.vy = 11.8;
        if (moveLeft) fighter1.vx = -fighter1.dino.walkSpeed * 0.65;
        if (moveRight) fighter1.vx = fighter1.dino.walkSpeed * 0.65;
    }
    if (moveLeft) {
        fighter1.x -= fighter1.dino.walkSpeed * dt;
        fighter1.action = 'walk';
    } else if (moveRight) {
        fighter1.x += fighter1.dino.walkSpeed * dt;
        fighter1.action = 'walk';
    } else {
        fighter1.action = 'idle';
    }
}

function handlePlayer2Inputs(dt) {
    if (xrayCinematicTimer > 0 || fighter2.hitStun > 0 || fighter2.isDead || fighter2.isDizzy) return;

    const moveLeft = keys['ArrowLeft'] || p2TouchState.left;
    const moveRight = keys['ArrowRight'] || p2TouchState.right;
    const jump = keys['ArrowUp'] || p2TouchState.up;
    const block = keys['ArrowDown'] || p2TouchState.down;

    if (fighter2.y > 0.05 && fighter2.dashTimer <= 0) {
        if (moveLeft) fighter2.x -= fighter2.dino.walkSpeed * 0.85 * dt;
        if (moveRight) fighter2.x += fighter2.dino.walkSpeed * 0.85 * dt;
    }

    if (fighter2.actionDuration > 0 || fighter2.dashTimer > 0) return;

    fighter2.isBlocking = block && fighter2.y <= 0.01;
    if (fighter2.isBlocking) {
        fighter2.action = 'crouch';
        return;
    }
    if (jump && fighter2.y <= 0.01) {
        fighter2.vy = 11.8;
        if (moveLeft) fighter2.vx = -fighter2.dino.walkSpeed * 0.65;
        if (moveRight) fighter2.vx = fighter2.dino.walkSpeed * 0.65;
    }
    if (moveLeft) {
        fighter2.x -= fighter2.dino.walkSpeed * dt;
        fighter2.action = 'walk';
    } else if (moveRight) {
        fighter2.x += fighter2.dino.walkSpeed * dt;
        fighter2.action = 'walk';
    } else {
        fighter2.action = 'idle';
    }
}

// 8. INITIALISATION DU SYSTÈME MANETTE
function initGamepadSystem() {
    createGamepadHelperHUD();
    updateGamepadHelperHUD();
}
