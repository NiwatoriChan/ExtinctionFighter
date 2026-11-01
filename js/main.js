// 13. BOUCLE D'ANIMATION PRINCIPALE
let lastFrameTime = performance.now();
function mainGameLoop(now) {
    const dt = Math.min(0.05, (now - lastFrameTime) / 1000);
    lastFrameTime = now;

    if (matchState === 'select') {
        updatePreviewModels(now);
    } else if (matchState === 'arena_select') {
        updateArenaPreview(now);
    } else if (matchState === 'main_menu') {
        // Menu principal actif
    } else {
        updateBattle3D(dt, now * 0.001);
        renderBattle3D(now);
    }

    requestAnimationFrame(mainGameLoop);
}

// 14. INITIALISATION DU JEU & ÉVÉNEMENTS UI
window.onload = function () {
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

    // Appliquer les paramètres graphiques initiaux (par défaut "high")
    if (typeof applyGraphicsSettings === 'function') {
        applyGraphicsSettings(graphicsQuality || 'high');
    }

    // Le jeu démarre sur le Menu Principal
    goToMainMenu();

    requestAnimationFrame(mainGameLoop);
};
