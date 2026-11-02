// 13. BOUCLE D'ANIMATION PRINCIPALE
let lastFrameTime = performance.now();
function mainGameLoop(now) {
    const dt = Math.min(0.05, (now - lastFrameTime) / 1000);
    lastFrameTime = now;

    // Sondage manette pour TOUTES les interfaces (Menus, Modales, Roster, Combat, etc.)
    if (typeof pollGamepadInputs === 'function') {
        pollGamepadInputs(dt, now);
    }

    if (matchState === 'select') {
        updatePreviewModels(now);
    } else if (matchState === 'arena_select') {
        updateArenaPreview(now);
    } else if (matchState === 'main_menu') {
        // Menu principal actif
    } else {
        if (!isMatchPaused) {
            updateBattle3D(dt, now * 0.001);
        }
        renderBattle3D(now);
    }

    requestAnimationFrame(mainGameLoop);
}

// 14. INITIALISATION DU JEU & ÉVÉNEMENTS UI
function bootGame() {
    if (window._gameBooted) return;
    window._gameBooted = true;

    // Initialisation des modules de menus
    initMainMenu();
    initArenaChooser();
    initSettingsModal();
    initRosterUI();
    initSelectScreenMenu();
    initHeaderMenu();
    initPostMatchMenu();
    initBattleScreenMenu();
    initMovesModal();
    if (typeof initGamepadSystem === 'function') {
        initGamepadSystem();
    }

    // Appliquer les paramètres graphiques initiaux (par défaut "high")
    if (typeof applyGraphicsSettings === 'function') {
        applyGraphicsSettings(graphicsQuality || 'high');
    }

    // Le jeu démarre sur le Menu Principal (ou directement sur l'écran spécifié via ?screen=...)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('unlock') === '1' || urlParams.get('unlock') === 'smilodon') {
        unlockFighter('smilodon');
    }
    if (urlParams.get('p1') === 'smilodon') {
        const smiloIdx = DINO_ROSTER.findIndex(d => d.id === 'smilodon');
        if (smiloIdx >= 0) p1ChoiceIndex = smiloIdx;
    }

    if (urlParams.get('mode') === 'campaign') {
        startCampaignMode();
        updatePreviewModels(16);
    } else if (urlParams.get('screen') === 'select') {
        goToSelectScreen();
        updatePreviewModels(16);
    } else if (urlParams.get('screen') === 'arena') {
        openArenaChooser();
        updateArenaPreview(16);
    } else if (urlParams.get('screen') === 'battle') {
        startMatch();
        if (urlParams.get('pause') === '1' && typeof openPauseMenu === 'function') {
            openPauseMenu();
        }
    } else {
        goToMainMenu();
    }

    requestAnimationFrame(mainGameLoop);
}

// Exécuter l'initialisation immédiatement (le DOM est déjà parsé au niveau de ce script)
console.log("JS/MAIN.JS EXECUTED - CALLING bootGame()");
bootGame();
