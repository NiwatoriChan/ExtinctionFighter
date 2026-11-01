/* ============================================================================
 * MENU : ÉCRAN DE SÉLECTION DES COMBATTANTS
 * Schéma fidèle : Modèle 3D Joueur 1 (gauche), Roster (centre), Modèle 3D Joueur 2 / Boss (droite)
 * Bouton de transition : "Choisir l'arène ➔"
 * ============================================================================ */

const SELECT_SCREEN_HTML = `
        <!-- ==================== SCREEN 1: CHARACTER SELECT ==================== -->
        <section id="selectScreen" class="w-full h-full flex-1 flex flex-col justify-between gap-2 py-1 max-w-7xl mx-auto select-none">
            <!-- Mode & Navigation Bar -->
            <div class="stone-panel rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-2 shrink-0">
                <div class="flex items-center gap-2.5">
                    <button id="btnSelectBackToMain" class="px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-black text-amber-300 transition flex items-center gap-1.5">
                        <span>⬅</span> <span>Menu Principal</span>
                    </button>
                    <div class="h-5 w-px bg-zinc-700 hidden sm:block"></div>
                    <div id="selectScreenModeBadge" class="text-xs sm:text-sm font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
                        <span>👤</span> <span>JOUEUR VS IA</span>
                    </div>
                </div>

                <div class="flex flex-wrap items-center gap-2">
                    <div id="aiDifficultyWrapper" class="flex items-center gap-1.5">
                        <span class="text-xs uppercase tracking-wider text-zinc-400 font-bold">IA :</span>
                        <select id="aiDifficulty" class="bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs font-bold text-amber-400 focus:outline-none">
                            <option value="easy">Novice (Facile)</option>
                            <option value="normal" selected>Prédateur (Normal)</option>
                            <option value="brutal">Extinction (Brutal)</option>
                        </select>
                    </div>

                    <div id="quickModeSelector" class="hidden sm:flex items-center gap-1">
                        <button data-mode="campaign" class="mode-btn px-2.5 py-1 rounded-lg text-[11px] font-extrabold uppercase bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700">
                            Campagne
                        </button>
                        <button data-mode="cpu" class="mode-btn px-2.5 py-1 rounded-lg text-[11px] font-extrabold uppercase bg-red-700 text-white border border-amber-400">
                            VS IA
                        </button>
                        <button data-mode="pvp" class="mode-btn px-2.5 py-1 rounded-lg text-[11px] font-extrabold uppercase bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700">
                            2J Local
                        </button>
                    </div>
                </div>
            </div>

            <!-- Fighter Preview & Roster Grid (Sketch layout: P1 3D - Center Roster - P2 3D) -->
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-2.5 items-stretch flex-1 min-h-0">
                <!-- P1 Preview Card (Left Column) -->
                <div class="lg:col-span-3 stone-panel rounded-xl p-3 flex flex-col justify-between border-t-4 border-t-red-600 overflow-y-auto">
                    <div>
                        <div class="flex items-center justify-between">
                            <span class="px-2 py-0.5 rounded bg-red-600 text-white text-xs font-black uppercase">Joueur 1</span>
                            <span id="p1RoleBadge" class="text-xs text-amber-400 font-bold uppercase">Apex Carnivore</span>
                        </div>
                        <h2 id="p1NameDisplay" class="mk-title text-2xl font-black text-white mt-1">T-REX</h2>
                        <p id="p1TitleDisplay" class="text-xs text-red-400 font-semibold italic">« Le Roi Sanglant du Crétacé »</p>

                        <div class="w-full h-44 my-2 rounded-lg bg-gradient-to-b from-red-950/40 to-black border border-zinc-800 relative overflow-hidden">
                            <canvas id="p1PreviewCanvas"></canvas>
                            <div class="absolute top-1.5 left-1.5 right-1.5 flex items-center justify-between bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded border border-red-500/40 text-xs">
                                <button id="btnP1PrevSkin" class="px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-amber-300 font-bold">&lt;</button>
                                <span id="p1SkinName" class="font-bold text-amber-300 tracking-wide text-[11px] truncate">Skin: Primal</span>
                                <button id="btnP1NextSkin" class="px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-amber-300 font-bold">&gt;</button>
                            </div>
                        </div>

                        <!-- Stats -->
                        <div class="space-y-1.5 text-xs mt-2">
                            <div>
                                <div class="flex justify-between font-bold"><span>PUISSANCE</span><span id="p1StatPow" class="text-red-400">95%</span></div>
                                <div class="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden"><div id="p1BarPow" class="h-full bg-gradient-to-r from-amber-500 to-red-600" style="width:95%"></div></div>
                            </div>
                            <div>
                                <div class="flex justify-between font-bold"><span>VITESSE</span><span id="p1StatSpd" class="text-amber-400">70%</span></div>
                                <div class="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden"><div id="p1BarSpd" class="h-full bg-gradient-to-r from-amber-400 to-orange-500" style="width:70%"></div></div>
                            </div>
                            <div>
                                <div class="flex justify-between font-bold"><span>ARMURE / PV</span><span id="p1StatDef" class="text-emerald-400">85%</span></div>
                                <div class="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden"><div id="p1BarDef" class="h-full bg-gradient-to-r from-emerald-500 to-teal-400" style="width:85%"></div></div>
                            </div>
                        </div>
                    </div>

                    <div class="mt-3 pt-2 border-t border-zinc-800 text-[11px] space-y-1">
                        <div class="text-amber-400 font-bold">⚡ Spécial : <span id="p1SpecName" class="text-zinc-200">Morsure Sismique & Rugissement</span></div>
                        <div class="text-red-500 font-bold">💀 Fatalité : <span id="p1FatalityName" class="text-zinc-200">Dévoration Royale</span></div>
                    </div>
                </div>

                <!-- Center: 13-Dino Grid & Selection Actions -->
                <div class="lg:col-span-6 stone-panel rounded-xl p-3 flex flex-col justify-between overflow-hidden">
                    <div class="text-center mb-1.5 shrink-0">
                        <h3 class="mk-title text-base sm:text-xl text-amber-400 font-black tracking-wider uppercase">CHOISISSEZ VOTRE COMBATTANT (13 LÉGENDES)</h3>
                        <p id="selectPromptText" class="text-xs text-zinc-400">Cliquez pour assigner le Joueur 1, puis l'Adversaire</p>
                    </div>

                    <div id="rosterGrid" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 my-auto flex-1 overflow-y-auto pr-1 min-h-[220px]">
                        <!-- Populated dynamically by JS -->
                    </div>

                    <div class="mt-3 flex flex-col gap-2">
                        <div class="flex flex-wrap items-center justify-center gap-2">
                            <button id="btnSelectSlotP1" class="px-3 py-1.5 rounded-lg bg-red-900/60 border border-red-500 text-xs font-extrabold text-white uppercase">
                                Sélection : Joueur 1
                            </button>
                            <button id="btnSelectSlotP2" class="px-3 py-1.5 rounded-lg bg-zinc-800 border border-blue-500/60 text-xs font-extrabold text-blue-300 uppercase">
                                Sélection : Adversaire
                            </button>
                            <button id="btnRandomFighters" class="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-xs font-bold text-amber-300 uppercase">
                                🎲 Aléatoire
                            </button>
                        </div>

                        <!-- Transition Button matching user's sketch: "When Selected ->" -->
                        <button id="btnGoToArena" class="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-red-700 via-red-600 to-amber-600 hover:from-red-600 hover:to-amber-500 text-white font-black text-sm uppercase tracking-widest shadow-lg shadow-red-900/60 border border-amber-300 finish-pulse flex items-center justify-center gap-2">
                            <span>CHOISIR L'ARÈNE DE KOMBAT</span>
                            <span class="text-lg">➔</span>
                        </button>
                    </div>
                </div>

                <!-- P2 / CPU / Boss Preview Card (Right Column) -->
                <div class="lg:col-span-3 stone-panel rounded-xl p-3 flex flex-col justify-between border-t-4 border-t-blue-500 overflow-y-auto">
                    <div>
                        <div class="flex items-center justify-between">
                            <span id="p2TagLabel" class="px-2 py-0.5 rounded bg-blue-600 text-white text-xs font-black uppercase">IA / J2</span>
                            <span id="p2RoleBadge" class="text-xs text-amber-400 font-bold uppercase">Forteresse Vivante</span>
                        </div>
                        <h2 id="p2NameDisplay" class="mk-title text-2xl font-black text-white mt-1">ANKYLOSAURE</h2>
                        <p id="p2TitleDisplay" class="text-xs text-blue-400 font-semibold italic">« Le Briseur d'Os Blindé »</p>

                        <div class="w-full h-44 my-2 rounded-lg bg-gradient-to-b from-blue-950/40 to-black border border-zinc-800 relative overflow-hidden">
                            <canvas id="p2PreviewCanvas"></canvas>
                            <div id="p2SkinSelector" class="absolute top-1.5 left-1.5 right-1.5 flex items-center justify-between bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded border border-blue-500/40 text-xs">
                                <button id="btnP2PrevSkin" class="px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-blue-300 font-bold">&lt;</button>
                                <span id="p2SkinName" class="font-bold text-blue-300 tracking-wide text-[11px] truncate">Skin: Primal</span>
                                <button id="btnP2NextSkin" class="px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-blue-300 font-bold">&gt;</button>
                            </div>
                        </div>

                        <!-- Stats -->
                        <div class="space-y-1.5 text-xs mt-2">
                            <div>
                                <div class="flex justify-between font-bold"><span>PUISSANCE</span><span id="p2StatPow" class="text-red-400">90%</span></div>
                                <div class="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden"><div id="p2BarPow" class="h-full bg-gradient-to-r from-amber-500 to-red-600" style="width:90%"></div></div>
                            </div>
                            <div>
                                <div class="flex justify-between font-bold"><span>VITESSE</span><span id="p2StatSpd" class="text-amber-400">55%</span></div>
                                <div class="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden"><div id="p2BarSpd" class="h-full bg-gradient-to-r from-amber-400 to-orange-500" style="width:55%"></div></div>
                            </div>
                            <div>
                                <div class="flex justify-between font-bold"><span>ARMURE / PV</span><span id="p2StatDef" class="text-emerald-400">100%</span></div>
                                <div class="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden"><div id="p2BarDef" class="h-full bg-gradient-to-r from-emerald-500 to-teal-400" style="width:100%"></div></div>
                            </div>
                        </div>
                    </div>

                    <div class="mt-3 pt-2 border-t border-zinc-800 text-[11px] space-y-1">
                        <div class="text-amber-400 font-bold">⚡ Spécial : <span id="p2SpecName" class="text-zinc-200">Marteau d'Os & Bouclier</span></div>
                        <div class="text-red-500 font-bold">💀 Fatalité : <span id="p2FatalityName" class="text-zinc-200">Brise-Fossile</span></div>
                    </div>
                </div>
            </div>
        </section>
`;

document.getElementById('appMain').insertAdjacentHTML('beforeend', SELECT_SCREEN_HTML);

// Aperçus 3D pour P1 et P2 dans le menu de sélection
let preview1 = { renderer: null, scene: null, camera: null, rig: null, dinoId: null };
let preview2 = { renderer: null, scene: null, camera: null, rig: null, dinoId: null };

function setupPreviewScene(previewObj, canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1.6, 0.1, 100);
    camera.position.set(0, 2.3, 6.2);
    camera.lookAt(0, 1.6, 0);

    scene.add(new THREE.AmbientLight(0xffffff, 0.75));
    const dirLight = new THREE.DirectionalLight(0xffedd5, 1.3);
    dirLight.position.set(4, 7, 5);
    scene.add(dirLight);

    // Socle rocheux 3D
    const pedestal = new THREE.Mesh(
        new THREE.CylinderGeometry(1.85, 2.1, 0.35, 20),
        new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.7 })
    );
    pedestal.position.y = -0.18;
    scene.add(pedestal);

    previewObj.renderer = renderer;
    previewObj.scene = scene;
    previewObj.camera = camera;
}

function getP2EffectiveDino() {
    if (gameMode === 'campaign') {
        if (campaignStage === 6 && typeof DRAGON_BOSS !== 'undefined' && DRAGON_BOSS) {
            return DRAGON_BOSS;
        }
        if (campaignOpponents && campaignOpponents[campaignStage - 1] !== undefined) {
            return DINO_ROSTER[campaignOpponents[campaignStage - 1]];
        }
    }
    return DINO_ROSTER[p2ChoiceIndex] || DINO_ROSTER[1];
}

function updatePreviewModels(time) {
    const selectSec = document.getElementById('selectScreen');
    if (!selectSec || selectSec.classList.contains('hidden')) return;

    if (!preview1.renderer) setupPreviewScene(preview1, 'p1PreviewCanvas');
    if (!preview2.renderer) setupPreviewScene(preview2, 'p2PreviewCanvas');

    const p1Dino = DINO_ROSTER[p1ChoiceIndex] || DINO_ROSTER[0];
    const p2Dino = getP2EffectiveDino();
    const p2Skin = (gameMode === 'campaign' && campaignStage === 6) ? 0 : p2SkinIndex;

    [
        { p: preview1, dino: p1Dino, skinIndex: p1SkinIndex, canvasId: 'p1PreviewCanvas', dir: 1 },
        { p: preview2, dino: p2Dino, skinIndex: p2Skin, canvasId: 'p2PreviewCanvas', dir: -1 }
    ].forEach(item => {
        if (!item.p.renderer) return;
        const canvas = document.getElementById(item.canvasId);
        if (!canvas || !canvas.parentElement) return;

        const rect = canvas.parentElement.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
            if (canvas.width !== Math.floor(rect.width) || canvas.height !== Math.floor(rect.height)) {
                item.p.renderer.setSize(rect.width, rect.height, false);
                item.p.camera.aspect = rect.width / rect.height;
                item.p.camera.updateProjectionMatrix();
            }
        }

        if (item.p.dinoId !== item.dino.id || item.p.skinIndex !== item.skinIndex) {
            if (item.p.rig) item.p.scene.remove(item.p.rig.root);
            item.p.rig = createDino3DRig(item.dino, item.skinIndex);
            item.p.scene.add(item.p.rig.root);
            item.p.dinoId = item.dino.id;
            item.p.skinIndex = item.skinIndex;
        }

        if (item.p.rig) {
            item.p.rig.root.rotation.y = time * 0.0008 * item.dir + (item.dir === 1 ? -0.35 : 0.35);
            animateDino3DRig({
                dino: item.dino,
                rig: item.p.rig,
                action: 'idle',
                actionDuration: 0,
                hitStun: 0,
                isBlocking: false
            }, time * 0.001, 0.016);
        }

        item.p.renderer.render(item.p.scene, item.p.camera);
    });
}

function initRosterUI() {
    const grid = document.getElementById('rosterGrid');
    if (!grid) return;
    grid.innerHTML = '';

    DINO_ROSTER.forEach((dino, idx) => {
        const card = document.createElement('div');
        card.className = `stone-card rounded-xl p-2.5 cursor-pointer flex flex-col items-center text-center relative ${
            idx === p1ChoiceIndex ? 'selected-p1' : ''
        } ${idx === p2ChoiceIndex ? 'selected-p2' : ''}`;
        card.dataset.index = idx;

        card.innerHTML = `
            <div class="w-full flex justify-between items-center text-[10px] font-black mb-1">
                <span class="px-1.5 py-0.5 rounded bg-zinc-900 text-amber-400 border border-zinc-700">${dino.role}</span>
                <span class="badge-slot text-xs font-black"></span>
            </div>
            <div class="w-16 h-16 rounded-full flex items-center justify-center my-1 border-2" style="background: radial-gradient(circle, ${dino.cssPrimary}55, #09090b); border-color:${dino.cssPrimary}">
                <span class="mk-title text-lg font-black text-white">${dino.name.substring(0, 2)}</span>
            </div>
            <div class="mk-title text-xs sm:text-sm font-black text-white tracking-wide">${dino.name}</div>
            <div class="text-[10px] text-zinc-400 line-clamp-1">${dino.fullName}</div>
        `;

        card.addEventListener('click', () => {
            sfx.playHit(false);
            if (gameMode === 'campaign') {
                p1ChoiceIndex = idx;
            } else {
                if (activeSelectSlot === 1) {
                    p1ChoiceIndex = idx;
                    if (gameMode === 'pvp') activeSelectSlot = 2;
                } else {
                    p2ChoiceIndex = idx;
                    activeSelectSlot = 1;
                }
            }
            updateSelectScreenUI();
        });

        grid.appendChild(card);
    });

    updateSelectScreenUI();
}

function updateSelectScreenUI() {
    const p1 = DINO_ROSTER[p1ChoiceIndex] || DINO_ROSTER[0];
    const p2 = getP2EffectiveDino();

    // Mode Badge & instructions
    const modeBadge = document.getElementById('selectScreenModeBadge');
    const promptText = document.getElementById('selectPromptText');
    const slot1Btn = document.getElementById('btnSelectSlotP1');
    const slot2Btn = document.getElementById('btnSelectSlotP2');
    const p2TagLabel = document.getElementById('p2TagLabel');
    const p2SkinSelector = document.getElementById('p2SkinSelector');

    if (gameMode === 'campaign') {
        if (modeBadge) {
            modeBadge.innerHTML = `<span class="text-amber-400">🏆 CAMPAGNE : ÉTAPE ${campaignStage} / ${CAMPAIGN_TOTAL_STAGES}</span>`;
        }
        if (promptText) {
            promptText.textContent = campaignStage === 6
                ? "Ultime épreuve ! Choisissez votre combattant pour affronter Drak'Zul"
                : `Choisissez votre champion pour l'étape ${campaignStage} (Adversaire fixé)`;
        }
        if (slot2Btn) slot2Btn.classList.add('hidden');
        if (p2SkinSelector && campaignStage === 6) p2SkinSelector.classList.add('hidden');
        else if (p2SkinSelector) p2SkinSelector.classList.remove('hidden');

        if (p2TagLabel) {
            if (campaignStage === 6) {
                p2TagLabel.textContent = "BOSS DE FIN";
                p2TagLabel.className = "px-2 py-0.5 rounded bg-gradient-to-r from-red-600 to-amber-500 text-white text-xs font-black uppercase animate-pulse";
            } else {
                p2TagLabel.textContent = `Étape ${campaignStage} / 6`;
                p2TagLabel.className = "px-2 py-0.5 rounded bg-amber-600 text-white text-xs font-black uppercase";
            }
        }
    } else {
        if (modeBadge) {
            modeBadge.innerHTML = gameMode === 'pvp'
                ? `<span>👥 2 JOUEURS (1 VS 1)</span>`
                : (gameMode === 'practice' ? `<span>🥋 ENTRAÎNEMENT</span>` : `<span>👤 JOUEUR VS IA</span>`);
        }
        if (promptText) {
            promptText.textContent = gameMode === 'pvp'
                ? "Cliquez pour assigner le Joueur 1, puis le Joueur 2"
                : "Cliquez pour assigner votre combattant (ou changez l'Adversaire)";
        }
        if (slot2Btn) slot2Btn.classList.remove('hidden');
        if (p2SkinSelector) p2SkinSelector.classList.remove('hidden');
        if (p2TagLabel) {
            p2TagLabel.textContent = gameMode === 'pvp' ? 'Joueur 2' : (gameMode === 'practice' ? 'Mannequin' : 'IA');
            p2TagLabel.className = "px-2 py-0.5 rounded bg-blue-600 text-white text-xs font-black uppercase";
        }
    }

    // P1 Skins
    if (p1.skins && p1.skins.length > 0) {
        p1SkinIndex = ((p1SkinIndex % p1.skins.length) + p1.skins.length) % p1.skins.length;
        const skinP1El = document.getElementById('p1SkinName');
        if (skinP1El) skinP1El.textContent = `Skin: ${p1.skins[p1SkinIndex].name}`;
    }

    // P2 Skins
    if (p2.skins && p2.skins.length > 0) {
        p2SkinIndex = ((p2SkinIndex % p2.skins.length) + p2.skins.length) % p2.skins.length;
        const skinP2El = document.getElementById('p2SkinName');
        if (skinP2El) skinP2El.textContent = `Skin: ${p2.skins[p2SkinIndex].name}`;
    }

    // P1 Details
    document.getElementById('p1NameDisplay').textContent = p1.name;
    document.getElementById('p1RoleBadge').textContent = p1.role;
    document.getElementById('p1TitleDisplay').textContent = p1.title;
    document.getElementById('p1StatPow').textContent = p1.stats.pow + '%';
    document.getElementById('p1BarPow').style.width = p1.stats.pow + '%';
    document.getElementById('p1StatSpd').textContent = p1.stats.spd + '%';
    document.getElementById('p1BarSpd').style.width = p1.stats.spd + '%';
    document.getElementById('p1StatDef').textContent = p1.stats.def + '%';
    document.getElementById('p1BarDef').style.width = p1.stats.def + '%';
    document.getElementById('p1SpecName').textContent = `${p1.special1Name} • ${p1.special2Name}`;
    document.getElementById('p1FatalityName').textContent = p1.fatalityName;

    // P2 Details
    document.getElementById('p2NameDisplay').textContent = p2.name;
    document.getElementById('p2RoleBadge').textContent = p2.role;
    document.getElementById('p2TitleDisplay').textContent = p2.title;
    document.getElementById('p2StatPow').textContent = p2.stats.pow + '%';
    document.getElementById('p2BarPow').style.width = p2.stats.pow + '%';
    document.getElementById('p2StatSpd').textContent = p2.stats.spd + '%';
    document.getElementById('p2BarSpd').style.width = p2.stats.spd + '%';
    document.getElementById('p2StatDef').textContent = p2.stats.def + '%';
    document.getElementById('p2BarDef').style.width = p2.stats.def + '%';
    document.getElementById('p2SpecName').textContent = `${p2.special1Name} • ${p2.special2Name}`;
    document.getElementById('p2FatalityName').textContent = p2.fatalityName;

    // Roster grid badges & highlight
    document.querySelectorAll('#rosterGrid .stone-card').forEach((card, i) => {
        const isP1 = i === p1ChoiceIndex;
        const isP2 = (gameMode === 'campaign' && campaignStage < 6)
            ? (campaignOpponents && i === campaignOpponents[campaignStage - 1])
            : (gameMode !== 'campaign' && i === p2ChoiceIndex);

        card.classList.toggle('selected-p1', isP1);
        card.classList.toggle('selected-p2', isP2);
        const badge = card.querySelector('.badge-slot');
        if (badge) {
            if (isP1 && isP2) {
                badge.textContent = 'J1 & J2';
                badge.className = 'badge-slot text-amber-400 font-black';
            } else if (isP1) {
                badge.textContent = 'J1';
                badge.className = 'badge-slot text-red-500 font-black';
            } else if (isP2) {
                badge.textContent = gameMode === 'campaign' ? `Étape ${campaignStage}` : (gameMode === 'pvp' ? 'J2' : 'IA');
                badge.className = 'badge-slot text-blue-400 font-black';
            } else {
                badge.textContent = '';
            }
        }
    });

    if (slot1Btn && slot2Btn) {
        if (activeSelectSlot === 1 || gameMode === 'campaign') {
            slot1Btn.className = 'px-3 py-1.5 rounded-lg bg-red-700 border-2 border-amber-300 text-xs font-extrabold text-white uppercase shadow';
            slot2Btn.className = 'px-3 py-1.5 rounded-lg bg-zinc-800 border border-blue-500/60 text-xs font-extrabold text-blue-300 uppercase';
        } else {
            slot1Btn.className = 'px-3 py-1.5 rounded-lg bg-zinc-800 border border-red-500/60 text-xs font-extrabold text-red-300 uppercase';
            slot2Btn.className = 'px-3 py-1.5 rounded-lg bg-blue-700 border-2 border-amber-300 text-xs font-extrabold text-white uppercase shadow';
        }
    }
}

function returnToSelect() {
    matchState = 'select';
    document.getElementById('battleScreen').classList.add('hidden');
    document.getElementById('battleScreen').classList.remove('flex');
    document.getElementById('arenaScreen').classList.add('hidden');
    document.getElementById('selectScreen').classList.remove('hidden');
    document.getElementById('btnBackToSelect').classList.add('hidden');
    document.getElementById('btnResetCam').classList.add('hidden');
    updateSelectScreenUI();
}

function initSelectScreenMenu() {
    // Return to main menu button
    const btnBackMain = document.getElementById('btnSelectBackToMain');
    if (btnBackMain) {
        btnBackMain.addEventListener('click', () => {
            sfx.playHit(false);
            goToMainMenu();
        });
    }

    // Quick mode switches
    document.querySelectorAll('#quickModeSelector .mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            sfx.playHit(false);
            const targetMode = btn.dataset.mode;
            if (targetMode === 'campaign') {
                startCampaignMode();
            } else {
                gameMode = targetMode;
                document.querySelectorAll('#quickModeSelector .mode-btn').forEach(b => {
                    b.className = 'mode-btn px-2.5 py-1 rounded-lg text-[11px] font-extrabold uppercase bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700';
                });
                btn.className = 'mode-btn px-2.5 py-1 rounded-lg text-[11px] font-extrabold uppercase bg-red-700 text-white border border-amber-400';
                updateSelectScreenUI();
            }
        });
    });

    document.getElementById('btnSelectSlotP1').addEventListener('click', () => {
        activeSelectSlot = 1;
        updateSelectScreenUI();
    });
    document.getElementById('btnSelectSlotP2').addEventListener('click', () => {
        if (gameMode !== 'campaign') {
            activeSelectSlot = 2;
            updateSelectScreenUI();
        }
    });

    // P1 & P2 skin navigation
    const btnP1Prev = document.getElementById('btnP1PrevSkin');
    const btnP1Next = document.getElementById('btnP1NextSkin');
    const btnP2Prev = document.getElementById('btnP2PrevSkin');
    const btnP2Next = document.getElementById('btnP2NextSkin');

    if (btnP1Prev) btnP1Prev.addEventListener('click', (e) => {
        e.stopPropagation();
        sfx.playHit(false);
        const skins = (DINO_ROSTER[p1ChoiceIndex] || {}).skins || [];
        if (skins.length > 0) {
            p1SkinIndex = (p1SkinIndex - 1 + skins.length) % skins.length;
            updateSelectScreenUI();
        }
    });
    if (btnP1Next) btnP1Next.addEventListener('click', (e) => {
        e.stopPropagation();
        sfx.playHit(false);
        const skins = (DINO_ROSTER[p1ChoiceIndex] || {}).skins || [];
        if (skins.length > 0) {
            p1SkinIndex = (p1SkinIndex + 1) % skins.length;
            updateSelectScreenUI();
        }
    });
    if (btnP2Prev) btnP2Prev.addEventListener('click', (e) => {
        e.stopPropagation();
        sfx.playHit(false);
        const p2 = getP2EffectiveDino();
        const skins = (p2 && p2.skins) || [];
        if (skins.length > 0) {
            p2SkinIndex = (p2SkinIndex - 1 + skins.length) % skins.length;
            updateSelectScreenUI();
        }
    });
    if (btnP2Next) btnP2Next.addEventListener('click', (e) => {
        e.stopPropagation();
        sfx.playHit(false);
        const p2 = getP2EffectiveDino();
        const skins = (p2 && p2.skins) || [];
        if (skins.length > 0) {
            p2SkinIndex = (p2SkinIndex + 1) % skins.length;
            updateSelectScreenUI();
        }
    });

    document.getElementById('btnRandomFighters').addEventListener('click', () => {
        sfx.playHit(false);
        p1ChoiceIndex = Math.floor(Math.random() * DINO_ROSTER.length);
        if (gameMode !== 'campaign') {
            do {
                p2ChoiceIndex = Math.floor(Math.random() * DINO_ROSTER.length);
            } while (p2ChoiceIndex === p1ChoiceIndex);
        }
        updateSelectScreenUI();
    });

    // "When Selected ->" transition button to Arena Chooser (sketch design)
    const btnGoToArena = document.getElementById('btnGoToArena');
    if (btnGoToArena) {
        btnGoToArena.addEventListener('click', () => {
            sfx.playHit(false);
            openArenaChooser();
        });
    }
}
