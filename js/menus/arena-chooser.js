/* ============================================================================
 * MENU : SÉLECTION DE L'ARÈNE (ARENA CHOOSER)
 * Conçu selon le schéma utilisateur : Grande fenêtre "Arena selected" + Grille "preview"
 * ============================================================================ */

const ARENA_CHOOSER_HTML = `
    <!-- ==================== SCREEN 1.5: ARENA CHOOSER ==================== -->
    <section id="arenaScreen" class="hidden w-full h-full flex-1 flex flex-col justify-between gap-2 py-1 max-w-7xl mx-auto select-none">
        <!-- Top bar: Header & Stage Title -->
        <div class="stone-panel rounded-xl p-2.5 flex items-center justify-between gap-3 shrink-0">
            <div class="flex items-center gap-2.5">
                <button id="btnArenaBackToCreatures" class="px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-black text-amber-300 transition flex items-center gap-1.5">
                    <span>⬅</span> <span>Changer de Créature</span>
                </button>
                <div class="h-5 w-px bg-zinc-700 hidden sm:block"></div>
                <div id="arenaModeLabel" class="text-xs sm:text-sm font-black text-amber-400 uppercase tracking-wider">
                    CHOIX DU CHAMP DE BATAILLE
                </div>
            </div>

            <div class="flex items-center gap-2">
                <button id="btnArenaRandom" class="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-bold text-amber-400 transition flex items-center gap-1">
                    <span>🎲</span> <span>Arène Aléatoire</span>
                </button>
                <button id="btnArenaFight" class="px-6 py-2 rounded-xl bg-gradient-to-r from-red-700 via-red-600 to-amber-600 hover:from-red-600 hover:to-amber-500 text-white font-black text-xs sm:text-sm uppercase tracking-widest shadow-lg shadow-red-900/60 border border-amber-300 finish-pulse">
                    🔥 LANCER LE KOMBAT !
                </button>
            </div>
        </div>

        <!-- Main Arena Layout (as in sketch): Big 'Arena selected' on left + Grid 'preview' on right -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch flex-1 min-h-0">
            <!-- Left Large Viewport: Arena Selected (3D live rotating view + details) -->
            <div class="lg:col-span-8 stone-panel rounded-2xl p-3 flex flex-col justify-between border-2 border-red-600/80 shadow-2xl relative overflow-hidden">
                <!-- 3D Canvas Viewport -->
                <div class="w-full h-full flex-1 rounded-xl bg-black relative overflow-hidden border border-zinc-800 min-h-[300px]">
                    <canvas id="arenaPreviewCanvas" class="w-full h-full block"></canvas>

                    <!-- Top-Left Arena Badge -->
                    <div class="absolute top-3 left-3 bg-black/75 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-amber-500/60 shadow-lg pointer-events-none">
                        <span class="text-[10px] text-amber-400 font-extrabold uppercase tracking-widest block">ARÈNE SÉLECTIONNÉE</span>
                        <h2 id="arenaHeroTitle" class="mk-title text-lg sm:text-2xl font-black text-white">🌋 CRATÈRE DU CHICXULUB</h2>
                    </div>

                    <!-- Bottom Overlay: Atmosphere & Hazard description -->
                    <div class="absolute bottom-3 left-3 right-3 bg-black/80 backdrop-blur-md p-2.5 sm:p-3 rounded-xl border border-zinc-700/80 pointer-events-none flex flex-wrap items-center justify-between gap-2">
                        <div>
                            <div id="arenaHeroSub" class="text-xs sm:text-sm font-bold text-zinc-200">
                                Lave en fusion, météores incandescents et ciel de cendres apocalyptique
                            </div>
                            <div class="text-[10px] text-zinc-400 mt-0.5">
                                Propriétés : <span id="arenaHeroHazard" class="text-amber-400 font-bold">Magma tellurique • Impacts d'astéroïdes • Sol sismique</span>
                            </div>
                        </div>
                        <span class="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-red-900/80 text-red-200 border border-red-500/60">
                            Arène 3D Interactive
                        </span>
                    </div>
                </div>
            </div>

            <!-- Right: Arena menu preview (Thumbnails / Cards Grid as in sketch) -->
            <div class="lg:col-span-4 stone-panel rounded-2xl p-3 flex flex-col justify-between border-2 border-zinc-700 overflow-hidden">
                <div class="mb-2 shrink-0">
                    <h3 class="mk-title text-sm sm:text-base font-black text-amber-400 uppercase tracking-wider flex items-center justify-between">
                        <span>LISTE DES ARÈNES</span>
                        <span class="text-xs text-zinc-400 font-normal">Cliquez pour prévisualiser</span>
                    </h3>
                </div>

                <!-- Scrollable Cards Grid -->
                <div id="arenaCardsGrid" class="flex flex-col gap-2 flex-1 overflow-y-auto pr-1">
                    <!-- Populated dynamically by JS -->
                </div>

                <div class="mt-2.5 pt-2 border-t border-zinc-800 text-[11px] text-zinc-400 text-center shrink-0">
                    Chaque arène possède son ambiance sonore, son ciel dynamique et ses décors Three.js
                </div>
            </div>
        </div>
    </section>
`;

document.getElementById('appMain').insertAdjacentHTML('beforeend', ARENA_CHOOSER_HTML);

const ARENA_DESCRIPTIONS = {
    volcano: {
        title: "🌋 CRATÈRE DU CHICXULUB",
        sub: "Lave en fusion, météores incandescents et ciel de cendres apocalyptique.",
        hazards: "Magma tellurique • Impacts d'astéroïdes • Fumerolles de soufre"
    },
    boneyard: {
        title: "🏛️ CITADELLE CÉLESTE D'OS",
        sub: "Arches thoraciques colossales de titanaures et aurores astrales mystiques.",
        hazards: "Runes d'énergie cosmique • Obélisques d'os géants • Vents stellaires"
    },
    swamp: {
        title: "🍄 ABYSSE FONGIQUE TOXIQUE",
        sub: "Champignons bioluminescents gigantesques et brumes acides suffocantes.",
        hazards: "Spores paralysantes • Bulles d'acide en suspension • Brume toxique"
    },
    storm: {
        title: "⚡ CANYON DE L'ORAGE PRIMORDIAL",
        sub: "Tempêtes d'éclairs foudroyants, colonnes de basalte et pluie torrentielle.",
        hazards: "Impacts de foudre • Ruissellement diluvien • Bourrasques électriques"
    },
    dragonlair: {
        title: "🐲 L'ANTRE DE DRAK'ZUL",
        sub: "La caldera infernale où réside le Dragon Primordial de l'Extinction.",
        hazards: "Magma incandescent • Spires volcaniques • Présence du Dragon Suprême"
    }
};

function initArenaChooser() {
    renderArenaCards();

    document.getElementById('btnArenaBackToCreatures').addEventListener('click', () => {
        sfx.playHit(false);
        goToSelectScreen();
    });

    document.getElementById('btnArenaRandom').addEventListener('click', () => {
        sfx.playHit(false);
        const idx = Math.floor(Math.random() * ARENA_LIST.length);
        selectArena(ARENA_LIST[idx].id);
    });

    document.getElementById('btnArenaFight').addEventListener('click', () => {
        startMatch();
    });
}

function renderArenaCards() {
    const grid = document.getElementById('arenaCardsGrid');
    if (!grid) return;
    grid.innerHTML = '';

    ARENA_LIST.forEach((arena) => {
        const isSelected = arena.id === currentArena;
        const info = ARENA_DESCRIPTIONS[arena.id] || {
            title: arena.label,
            sub: "Champ de bataille préhistorique",
            hazards: "Atmosphère tellurique"
        };

        const card = document.createElement('div');
        card.className = `p-2.5 rounded-xl cursor-pointer border transition-all flex items-center justify-between ${
            isSelected
                ? 'bg-red-950/80 border-amber-400 shadow-lg shadow-red-900/50'
                : 'bg-zinc-900/80 hover:bg-zinc-800 border-zinc-700'
        }`;
        card.dataset.arenaId = arena.id;

        card.innerHTML = `
            <div class="flex items-center gap-2.5">
                <div class="w-10 h-10 rounded-lg flex items-center justify-center font-black text-lg border border-zinc-600" style="background: radial-gradient(circle, ${arena.accentColor ? '#' + arena.accentColor.toString(16).padStart(6, '0') + '44' : '#ef444444'}, #09090b)">
                    ${arena.id === 'volcano' ? '🌋' : (arena.id === 'boneyard' ? '🏛️' : (arena.id === 'swamp' ? '🍄' : (arena.id === 'storm' ? '⚡' : '🐲')))}
                </div>
                <div>
                    <div class="mk-title text-xs sm:text-sm font-black ${isSelected ? 'text-amber-300' : 'text-zinc-200'}">${arena.label}</div>
                    <div class="text-[10px] text-zinc-400 line-clamp-1">${info.sub}</div>
                </div>
            </div>
            <div class="text-xs font-black ${isSelected ? 'text-amber-400' : 'text-zinc-500'}">
                ${isSelected ? '✓ ACTIF' : 'CHOISIR'}
            </div>
        `;

        card.addEventListener('click', () => {
            sfx.playHit(false);
            selectArena(arena.id);
        });

        grid.appendChild(card);
    });

    updateArenaHeroDetails();
}

function selectArena(arenaId) {
    currentArena = arenaId;

    // Sync select dropdown if existing
    const sel = document.getElementById('arenaSelect');
    if (sel) sel.value = arenaId;

    renderArenaCards();

    // Update 3D preview
    if (arenaPreview.group && arenaPreview.scene) {
        buildArena3D(currentArena, arenaPreview.group, arenaPreview.scene);
        arenaPreview.arenaId = currentArena;
    }
}

function updateArenaHeroDetails() {
    const info = ARENA_DESCRIPTIONS[currentArena] || {
        title: currentArena.toUpperCase(),
        sub: "Champ de bataille préhistorique",
        hazards: "Atmosphère tellurique"
    };

    const titleEl = document.getElementById('arenaHeroTitle');
    const subEl = document.getElementById('arenaHeroSub');
    const hazardEl = document.getElementById('arenaHeroHazard');

    if (titleEl) titleEl.textContent = info.title;
    if (subEl) subEl.textContent = info.sub;
    if (hazardEl) hazardEl.textContent = info.hazards;

    // Mode title in arena screen
    const modeEl = document.getElementById('arenaModeLabel');
    if (modeEl) {
        if (gameMode === 'campaign') {
            modeEl.textContent = `CAMPAGNE : ÉTAPE ${campaignStage} / ${CAMPAIGN_TOTAL_STAGES} • CHOIX DE L'ARÈNE`;
        } else if (gameMode === 'pvp') {
            modeEl.textContent = `2 JOUEURS (1 VS 1) • CHOIX DE L'ARÈNE`;
        } else {
            modeEl.textContent = `JOUEUR VS IA • CHOIX DE L'ARÈNE`;
        }
    }
}

function openArenaChooser() {
    matchState = 'arena_select';
    document.getElementById('mainMenu').classList.add('hidden');
    document.getElementById('selectScreen').classList.add('hidden');
    document.getElementById('battleScreen').classList.add('hidden');
    document.getElementById('battleScreen').classList.remove('flex');
    document.getElementById('arenaScreen').classList.remove('hidden');
    document.getElementById('btnBackToSelect').classList.add('hidden');
    document.getElementById('btnResetCam').classList.add('hidden');

    renderArenaCards();

    if (!arenaPreview.renderer) {
        setupArenaPreview('arenaPreviewCanvas');
    }
    if (arenaPreview.group && arenaPreview.scene) {
        buildArena3D(currentArena, arenaPreview.group, arenaPreview.scene);
        arenaPreview.arenaId = currentArena;
    }
}
