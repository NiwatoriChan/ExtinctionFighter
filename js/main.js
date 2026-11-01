// 13. BOUCLE D'ANIMATION PRINCIPALE
let lastFrameTime = performance.now();
function mainGameLoop(now) {
    const dt = Math.min(0.05, (now - lastFrameTime) / 1000);
    lastFrameTime = now;

    if (matchState === 'select') {
        updatePreviewModels(now);
    } else {
        updateBattle3D(dt, now * 0.001);
        renderBattle3D(now);
    }

    requestAnimationFrame(mainGameLoop);
}

// 14. INITIALISATION & ÉVÉNEMENTS UI
window.onload = function () {
    initRosterUI();
    initSelectScreenMenu();
    initHeaderMenu();
    initPostMatchMenu();
    initBattleScreenMenu();
    initMovesModal();

    requestAnimationFrame(mainGameLoop);
};
