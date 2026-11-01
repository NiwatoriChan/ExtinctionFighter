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

// 11. BOUCLE DE MISE À JOUR PHYSIQUE 3D, CONTRÔLES & IA
function pollGamepadInputs() {
    if (!navigator.getGamepads || xrayCinematicTimer > 0) return;
    const pads = navigator.getGamepads();
    const pad = pads && pads[0];
    if (!pad || !fighter1 || !fighter2) return;

    const axX = pad.axes[0] || 0;
    touchState.left = axX < -0.35 || (pad.buttons[14] && pad.buttons[14].pressed);
    touchState.right = axX > 0.35 || (pad.buttons[15] && pad.buttons[15].pressed);
    touchState.up = (pad.axes[1] || 0) < -0.45 || (pad.buttons[12] && pad.buttons[12].pressed);
    touchState.down = (pad.axes[1] || 0) > 0.45 || (pad.buttons[13] && pad.buttons[13].pressed);

    if (pad.buttons[0] && pad.buttons[0].pressed && !pad._b0) triggerPlayerAction(fighter1, fighter2, 'light');
    if (pad.buttons[2] && pad.buttons[2].pressed && !pad._b2) triggerPlayerAction(fighter1, fighter2, 'heavy');
    if (pad.buttons[3] && pad.buttons[3].pressed && !pad._b3) triggerPlayerAction(fighter1, fighter2, 'special');
    if (pad.buttons[1] && pad.buttons[1].pressed && !pad._b1) triggerPlayerAction(fighter1, fighter2, 'special2');
    if (pad.buttons[5] && pad.buttons[5].pressed && !pad._b5) triggerPlayerAction(fighter1, fighter2, 'dash');
    if (pad.buttons[7] && pad.buttons[7].pressed && !pad._b7) triggerPlayerAction(fighter1, fighter2, 'xray');

    pad._b0 = pad.buttons[0]?.pressed;
    pad._b1 = pad.buttons[1]?.pressed;
    pad._b2 = pad.buttons[2]?.pressed;
    pad._b3 = pad.buttons[3]?.pressed;
    pad._b5 = pad.buttons[5]?.pressed;
    pad._b7 = pad.buttons[7]?.pressed;
}

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

    const moveLeft = keys['ArrowLeft'];
    const moveRight = keys['ArrowRight'];
    const jump = keys['ArrowUp'];
    const block = keys['ArrowDown'];

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
