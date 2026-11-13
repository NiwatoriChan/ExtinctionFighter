// 13. BOUCLE D'ANIMATION PRINCIPALE
let lastFrameTime = performance.now();
function mainGameLoop(now) {
    const dt = Math.min(0.05, (now - lastFrameTime) / 1000);
    lastFrameTime = now;

    // Sondage manette pour TOUTES les interfaces (Menus, Modales, Roster, Combat, etc.)
    if (typeof pollGamepadInputs === 'function') {
        pollGamepadInputs(dt, now);
    }

    // Mise à jour réactive et layout Flexbox 3D @pmndrs/uikit
    if (typeof UIKit !== 'undefined' && typeof UIKit.updateAllRoots === 'function') {
        UIKit.updateAllRoots(dt, now);
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
    const modeParam = urlParams.get('mode');
    if (modeParam && ['campaign', 'cpu', 'pvp', 'practice'].includes(modeParam)) {
        gameMode = modeParam;
    }
    const unlockParam = urlParams.get('unlock');
    if (unlockParam) {
        if (unlockParam === '1' || unlockParam === 'all') {
            if (typeof DINO_ROSTER !== 'undefined') {
                DINO_ROSTER.forEach(d => unlockFighter(d.id));
            }
        } else {
            unlockFighter(unlockParam);
        }
    }
    const p1Param = urlParams.get('p1');
    if (p1Param && typeof DINO_ROSTER !== 'undefined') {
        const targetIdx = DINO_ROSTER.findIndex(d => d.id === p1Param);
        if (targetIdx >= 0) p1ChoiceIndex = targetIdx;
    }

    if (urlParams.get('mode') === 'campaign' || urlParams.get('screen') === 'campaign') {
        openCampaignMap();
    } else if (urlParams.get('mode') === 'smash_level') {
        const eraIdx = parseInt(urlParams.get('era') || '0', 10);
        const era = (typeof CAMPAIGN_ERAS !== 'undefined' && CAMPAIGN_ERAS[eraIdx]) ? CAMPAIGN_ERAS[eraIdx] : null;
        if (era) {
            startCampaignEraLevel(era);
            const waveParam = urlParams.get('wave');
            if (waveParam) {
                const targetWave = parseInt(waveParam, 10) - 1;
                if (targetWave >= 0 && targetWave <= 2 && typeof startCampaignWave === 'function') {
                    startCampaignWave(targetWave);
                }
            }
            if (urlParams.get('victory') === '1' && typeof showEraVictoryRewardsModal === 'function') {
                showEraVictoryRewardsModal(era);
            }
        } else {
            openCampaignMap();
        }
    } else if (urlParams.get('screen') === 'select') {
        goToSelectScreen();
        updatePreviewModels(16);
    } else if (urlParams.get('screen') === 'settings' || urlParams.get('screen') === 'options') {
        const reqTab = urlParams.get('tab');
        if (reqTab && ['audio', 'video', 'gameplay', 'controls'].includes(reqTab) && typeof settingsActiveTabSignal !== 'undefined') {
            settingsActiveTabSignal.value = reqTab;
        }
        goToMainMenu();
        openSettingsModal();
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
