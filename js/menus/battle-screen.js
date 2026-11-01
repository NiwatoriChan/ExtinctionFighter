/* ============================================================================
 * MENU : ÉCRAN DE COMBAT (HUD vie/rage/chrono, annonceur, scanner X-Ray,
 *        bouton de fatalité, contrôles arcade tactiles)
 * ============================================================================ */

const BATTLE_SCREEN_HTML = `
        <!-- ==================== SCREEN 2: ARENA BATTLE ==================== -->
        <section id="battleScreen" class="hidden w-full flex-col items-center gap-2">
            <!-- Canvas Wrapper -->
            <div class="w-full relative rounded-2xl overflow-hidden border-2 border-zinc-700 shadow-2xl bg-black" style="height: min(62vh, 520px); min-height: 330px;">

                <!-- TOP HUD OVERLAY -->
                <div class="absolute top-0 left-0 right-0 p-2 sm:p-3 z-10 pointer-events-none">
                    <div class="grid grid-cols-11 items-start gap-1 sm:gap-2">
                        <!-- P1 Health & Rage -->
                        <div class="col-span-5 flex flex-col gap-1">
                            <div class="flex items-center justify-between px-1">
                                <div class="flex items-center gap-1.5">
                                    <span id="hudP1Name" class="mk-title text-xs sm:text-base font-black text-amber-400 tracking-wide">T-REX</span>
                                    <div id="hudP1Rounds" class="flex gap-1 text-xs"></div>
                                </div>
                                <span id="hudP1HpText" class="text-xs font-extrabold text-red-400">100%</span>
                            </div>
                            <!-- Health Bar -->
                            <div class="w-full h-4 sm:h-5 bg-zinc-950/90 border-2 border-amber-500/80 rounded-md overflow-hidden relative shadow-inner">
                                <div id="hudP1DamageBar" class="absolute top-0 left-0 h-full bg-amber-300 transition-all duration-500" style="width:100%"></div>
                                <div id="hudP1HealthBar" class="absolute top-0 left-0 h-full bg-gradient-to-r from-red-800 via-red-600 to-amber-500 transition-all duration-100" style="width:100%"></div>
                            </div>
                            <!-- Rage / X-Ray Meter -->
                            <div class="flex items-center gap-1.5">
                                <div class="flex-1 h-2 bg-zinc-950 border border-zinc-700 rounded-full overflow-hidden">
                                    <div id="hudP1RageBar" class="h-full bg-gradient-to-r from-cyan-500 via-purple-500 to-amber-400 transition-all duration-100" style="width:0%"></div>
                                </div>
                                <span id="hudP1RageBadge" class="text-[10px] font-black uppercase px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-400 border border-zinc-700">RAGE 0%</span>
                            </div>
                        </div>

                        <!-- Center Timer & Round -->
                        <div class="col-span-1 flex flex-col items-center justify-center">
                            <div class="px-2 py-1 rounded-lg bg-zinc-950/90 border-2 border-amber-500 text-center shadow-lg">
                                <div id="hudTimer" class="mk-title text-lg sm:text-2xl font-black text-amber-400 leading-none">99</div>
                            </div>
                            <span id="hudRoundText" class="text-[10px] font-extrabold uppercase text-red-400 mt-0.5 tracking-wider">ROUND 1</span>
                        </div>

                        <!-- P2 Health & Rage -->
                        <div class="col-span-5 flex flex-col gap-1">
                            <div class="flex items-center justify-between px-1">
                                <span id="hudP2HpText" class="text-xs font-extrabold text-red-400">100%</span>
                                <div class="flex items-center gap-1.5">
                                    <div id="hudP2Rounds" class="flex gap-1 text-xs"></div>
                                    <span id="hudP2Name" class="mk-title text-xs sm:text-base font-black text-amber-400 tracking-wide">ANKYLOSAURE</span>
                                </div>
                            </div>
                            <!-- Health Bar (Right-to-Left feel) -->
                            <div class="w-full h-4 sm:h-5 bg-zinc-950/90 border-2 border-amber-500/80 rounded-md overflow-hidden relative shadow-inner">
                                <div id="hudP2DamageBar" class="absolute top-0 right-0 h-full bg-amber-300 transition-all duration-500" style="width:100%"></div>
                                <div id="hudP2HealthBar" class="absolute top-0 right-0 h-full bg-gradient-to-l from-red-800 via-red-600 to-amber-500 transition-all duration-100" style="width:100%"></div>
                            </div>
                            <!-- Rage / X-Ray Meter -->
                            <div class="flex items-center gap-1.5 flex-row-reverse">
                                <div class="flex-1 h-2 bg-zinc-950 border border-zinc-700 rounded-full overflow-hidden">
                                    <div id="hudP2RageBar" class="h-full bg-gradient-to-l from-cyan-500 via-purple-500 to-amber-400 ml-auto transition-all duration-100" style="width:0%"></div>
                                </div>
                                <span id="hudP2RageBadge" class="text-[10px] font-black uppercase px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-400 border border-zinc-700">RAGE 0%</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- CENTER ANNOUNCER BANNER -->
                <div id="announcerOverlay" class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20 px-4 text-center">
                    <h2 id="announcerMain" class="mk-banner text-3xl sm:text-6xl font-black uppercase tracking-widest text-amber-400 transition-transform duration-200">
                        ROUND 1
                    </h2>
                    <p id="announcerSub" class="text-sm sm:text-xl font-extrabold uppercase tracking-widest text-red-400 mt-1 drop-shadow">
                        PRÉPAREZ-VOUS AU COMBAT
                    </p>
                </div>

                <!-- X-RAY MEDICAL SCANNER OVERLAY (MORTAL KOMBAT STYLE) -->
                <div id="xrayOverlayHud" class="hidden absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-4" style="background: radial-gradient(circle at center, rgba(6, 182, 212, 0.12) 0%, rgba(2, 6, 23, 0.88) 85%); box-shadow: inset 0 0 70px rgba(34, 211, 238, 0.55);">
                    <div class="mt-14 flex items-center justify-between border-b border-cyan-400/50 pb-1">
                        <div class="flex items-center gap-2">
                            <span class="px-2 py-0.5 rounded bg-cyan-500 text-slate-950 font-black text-xs uppercase tracking-widest animate-pulse">☢ SCANNER X-RAY ACTIF</span>
                            <span id="xrayTargetLabel" class="text-cyan-300 font-bold text-xs uppercase tracking-wider">ANALYSE SQUELETTIQUE</span>
                        </div>
                        <span id="xrayPhaseCounter" class="text-amber-300 font-black text-xs uppercase tracking-widest">PHASE 1 / 3</span>
                    </div>

                    <div class="my-auto flex flex-col items-center">
                        <div id="xrayAnatomyBanner" class="px-5 py-2 rounded-xl bg-slate-950/90 border-2 border-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.7)] text-center transform transition-all duration-150">
                            <div id="xrayBoneTitle" class="mk-title text-lg sm:text-2xl font-black text-cyan-300 tracking-wider">FRACTURE CRÂNIENNE</div>
                            <div id="xrayPsiDetail" class="text-xs font-extrabold text-red-400 uppercase tracking-widest">TRAUMA INTERNE : 4 800 PSI • OS BROYÉ</div>
                        </div>
                    </div>
                </div>

                <!-- FINISH HIM / FATALITY INTERACTIVE PROMPT -->
                <div id="fatalityPromptBox" class="hidden absolute bottom-14 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
                    <button id="btnTriggerFatalityNow" class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-800 via-red-600 to-amber-500 text-white font-black text-sm sm:text-lg uppercase tracking-wider border-2 border-amber-300 shadow-2xl finish-pulse">
                        💀 EXÉCUTER LA FATALITÉ ! (Touche R)
                    </button>
                </div>


                <!-- 2D FLOATING DAMAGE / COMBO OVERLAY -->
                <div id="damagePopupLayer" class="absolute inset-0 pointer-events-none z-10 overflow-hidden"></div>

                <!-- CAMERA HINT -->
                <div class="absolute bottom-2 right-3 z-10 pointer-events-none text-[10px] text-zinc-400/80 font-bold bg-black/50 px-2 py-0.5 rounded border border-zinc-800">
                    🖱️ Glisser la souris : Orienter la caméra 3D
                </div>

                <!-- MAIN 3D GAME CANVAS -->
                <canvas id="battleCanvas" class="cursor-grab active:cursor-grabbing"></canvas>
            </div>

            <!-- ARCADE TOUCH & CLICK CONTROLS BAR -->
            <div class="w-full stone-panel rounded-xl p-2 sm:p-3 flex flex-wrap items-center justify-between gap-2">
                <!-- Left D-Pad + Dash -->
                <div class="flex items-center gap-1.5">
                    <button id="uiBtnLeft" data-ctrl="left" class="ctrl-btn arcade-btn w-12 h-11 sm:w-14 sm:h-12 rounded-xl bg-zinc-800 hover:bg-zinc-700 border-2 border-zinc-600 flex flex-col items-center justify-center text-white font-black shadow">
                        <span class="text-base leading-none">◀</span>
                        <span class="text-[9px] text-zinc-400">A / Q / ⬅</span>
                    </button>
                    <div class="flex flex-col gap-1">
                        <button id="uiBtnUp" data-ctrl="up" class="ctrl-btn arcade-btn w-12 h-9 sm:w-14 sm:h-10 rounded-xl bg-zinc-800 hover:bg-zinc-700 border-2 border-zinc-600 flex items-center justify-center text-white font-black text-xs shadow">
                            ▲ Saut (W)
                        </button>
                        <button id="uiBtnDown" data-ctrl="down" class="ctrl-btn arcade-btn w-12 h-9 sm:w-14 sm:h-10 rounded-xl bg-zinc-800 hover:bg-zinc-700 border-2 border-zinc-600 flex items-center justify-center text-amber-300 font-black text-xs shadow">
                            🛡️ Garde (S)
                        </button>
                    </div>
                    <button id="uiBtnRight" data-ctrl="right" class="ctrl-btn arcade-btn w-12 h-11 sm:w-14 sm:h-12 rounded-xl bg-zinc-800 hover:bg-zinc-700 border-2 border-zinc-600 flex flex-col items-center justify-center text-white font-black shadow">
                        <span class="text-base leading-none">▶</span>
                        <span class="text-[9px] text-zinc-400">D / ➡</span>
                    </button>
                    <button id="uiBtnDash" data-action="dash" class="act-btn arcade-btn px-2.5 h-11 sm:h-12 rounded-xl bg-zinc-900 hover:bg-zinc-800 border-2 border-cyan-500/80 flex flex-col items-center justify-center text-cyan-300 font-black text-xs shadow">
                        <span>💨 DASH</span>
                        <span class="text-[9px] text-zinc-400">[E / 2×Dir]</span>
                    </button>
                </div>

                <!-- Center Quick Info / Combo Guide -->
                <div class="hidden xl:flex flex-col items-center text-center px-2">
                    <div class="text-xs font-extrabold text-amber-400 uppercase tracking-wider">Combos Fluides & Contrôles Pro</div>
                    <div class="text-[11px] text-zinc-400">
                        <span class="text-cyan-300 font-bold">Combo :</span> Léger (F) ➔ Lourd (G) ➔ Spécial (H/T) • <span class="text-amber-300 font-bold">Dash :</span> E ou Double-Direction
                    </div>
                </div>

                <!-- Right Attack Buttons -->
                <div class="flex flex-wrap items-center gap-1.5">
                    <button id="uiBtnLight" data-action="light" class="act-btn arcade-btn px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-gradient-to-b from-amber-500 to-amber-700 border-2 border-amber-300 text-black font-black text-xs sm:text-sm uppercase shadow-lg">
                        ⚡ Léger <span class="block text-[10px] font-bold opacity-80">[F / J]</span>
                    </button>
                    <button id="uiBtnHeavy" data-action="heavy" class="act-btn arcade-btn px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-gradient-to-b from-orange-600 to-red-800 border-2 border-orange-300 text-white font-black text-xs sm:text-sm uppercase shadow-lg">
                        💥 Lourd <span class="block text-[10px] font-bold opacity-80">[G / K]</span>
                    </button>
                    <button id="uiBtnSpecial" data-action="special" class="act-btn arcade-btn px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-gradient-to-b from-purple-600 to-indigo-900 border-2 border-purple-300 text-white font-black text-xs sm:text-sm uppercase shadow-lg">
                        🔥 Spécial <span class="block text-[10px] font-bold opacity-80">[H / L]</span>
                    </button>
                    <button id="uiBtnSpecial2" data-action="special2" class="act-btn arcade-btn px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-gradient-to-b from-emerald-600 to-teal-900 border-2 border-emerald-300 text-white font-black text-xs sm:text-sm uppercase shadow-lg">
                        🌪️ Ultra <span class="block text-[10px] font-bold opacity-80">[T / U]</span>
                    </button>
                    <button id="btnRageFatality" data-action="xray" class="act-btn arcade-btn px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-gradient-to-b from-red-600 via-red-800 to-black border-2 border-red-400 text-amber-200 font-black text-xs sm:text-sm uppercase shadow-lg">
                        💀 X-Ray / Fatal <span class="block text-[10px] font-bold opacity-90">[R / Espace]</span>
                    </button>
                </div>
            </div>
        </section>
`;
document.getElementById('appMain').insertAdjacentHTML('beforeend', BATTLE_SCREEN_HTML);

function flashArcadeButton(btnId, active) {
    const el = document.getElementById(btnId);
    if (!el) return;
    el.classList.toggle('active-press', active);
}

function spawnFloatingPopup(worldX, text, colorHex = '#fde047') {
    const layer = document.getElementById('damagePopupLayer');
    if (!layer) return;
    const el = document.createElement('div');
    const pctLeft = Math.max(12, Math.min(88, 50 + (worldX / 12) * 42));
    el.style.left = pctLeft + '%';
    el.style.top = '32%';
    el.style.color = colorHex;
    el.className = 'mk-title absolute -translate-x-1/2 font-black text-base sm:text-2xl drop-shadow-[0_3px_3px_rgba(0,0,0,0.95)] transition-all duration-700';
    el.textContent = text;
    layer.appendChild(el);
    requestAnimationFrame(() => {
        el.style.top = '18%';
        el.style.opacity = '0';
    });
    setTimeout(() => el.remove(), 700);
}

function showAnnouncer(mainText, subText = '') {
    const mainEl = document.getElementById('announcerMain');
    const subEl = document.getElementById('announcerSub');
    mainEl.textContent = mainText;
    subEl.textContent = subText;
    mainEl.style.transform = 'scale(1.25)';
    setTimeout(() => {
        mainEl.style.transform = 'scale(1)';
    }, 180);
}

function clearAnnouncer() {
    document.getElementById('announcerMain').textContent = '';
    document.getElementById('announcerSub').textContent = '';
}

// 12. MISE À JOUR DU HUD HTML & RENDU CAMÉRA 3D DYNAMIQUE
function updateBattleHUD() {
    if (!fighter1 || !fighter2) return;
    const p1Pct = Math.max(0, Math.round((fighter1.hp / fighter1.maxHp) * 100));
    const p2Pct = Math.max(0, Math.round((fighter2.hp / fighter2.maxHp) * 100));

    document.getElementById('hudP1HealthBar').style.width = p1Pct + '%';
    document.getElementById('hudP1DamageBar').style.width = p1Pct + '%';
    document.getElementById('hudP1HpText').textContent = p1Pct + '%';

    document.getElementById('hudP2HealthBar').style.width = p2Pct + '%';
    document.getElementById('hudP2DamageBar').style.width = p2Pct + '%';
    document.getElementById('hudP2HpText').textContent = p2Pct + '%';

    document.getElementById('hudP1RageBar').style.width = fighter1.rage + '%';
    const r1Badge = document.getElementById('hudP1RageBadge');
    r1Badge.textContent = fighter1.rage >= 100 ? '💀 X-RAY PRÊT (R)' : `RAGE ${Math.floor(fighter1.rage)}%`;
    r1Badge.className = fighter1.rage >= 100
        ? 'text-[10px] font-black uppercase px-1.5 py-0.2 rounded bg-red-600 text-white border border-amber-300 animate-pulse'
        : 'text-[10px] font-black uppercase px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-400 border border-zinc-700';

    document.getElementById('hudP2RageBar').style.width = fighter2.rage + '%';
    const r2Badge = document.getElementById('hudP2RageBadge');
    r2Badge.textContent = fighter2.rage >= 100 ? '💀 X-RAY PRÊT' : `RAGE ${Math.floor(fighter2.rage)}%`;

    document.getElementById('hudP1Rounds').innerHTML = '💀'.repeat(fighter1.roundsWon);
    document.getElementById('hudP2Rounds').innerHTML = '💀'.repeat(fighter2.roundsWon);
}

function initBattleScreenMenu() {
    document.getElementById('btnTriggerFatalityNow').addEventListener('click', () => {
        if (matchState === 'finish_him' && fighter1 && fighter2) {
            const winner = fighter1.roundsWon >= 2 ? fighter1 : fighter2;
            const loser = winner === fighter1 ? fighter2 : fighter1;
            executeUnique3DFatality(winner, loser);
        }
    });

    document.querySelectorAll('.ctrl-btn').forEach(btn => {
        const dir = btn.dataset.ctrl;
        const startDir = (e) => { e.preventDefault(); touchState[dir] = true; btn.classList.add('active-press'); };
        const endDir = (e) => { e.preventDefault(); touchState[dir] = false; btn.classList.remove('active-press'); };
        btn.addEventListener('mousedown', startDir);
        btn.addEventListener('mouseup', endDir);
        btn.addEventListener('mouseleave', endDir);
        btn.addEventListener('touchstart', startDir, { passive: false });
        btn.addEventListener('touchend', endDir, { passive: false });
    });

    document.querySelectorAll('.act-btn').forEach(btn => {
        const act = btn.dataset.action;
        const trigger = (e) => {
            e.preventDefault();
            if (fighter1 && fighter2) {
                triggerPlayerAction(fighter1, fighter2, act);
            }
        };
        btn.addEventListener('mousedown', trigger);
        btn.addEventListener('touchstart', trigger, { passive: false });
    });

}
