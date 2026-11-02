/* ============================================================================
 * MENU : FIN DE MATCH (revanche, adversaire suivant / étape suivante, retour au roster, menu principal)
 * ============================================================================ */

const POST_MATCH_MENU_HTML = `
                <!-- POST-MATCH OVERLAY BUTTONS -->
                <div id="postMatchMenu" class="hidden absolute bottom-5 left-1/2 -translate-x-1/2 z-30 flex flex-wrap items-center justify-center gap-3 pointer-events-auto">
                    <button id="btnRematch" class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-800 via-red-600 to-amber-600 hover:from-red-700 hover:to-amber-500 text-white font-cinzel font-black text-xs sm:text-sm uppercase tracking-wider border-2 border-amber-300 shadow-2xl finish-pulse">
                        🔄 Revanche Immédiate
                    </button>
                    <button id="btnNextOpponent" class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-800 to-teal-700 hover:from-emerald-700 hover:to-teal-600 text-white font-cinzel font-black text-xs sm:text-sm uppercase tracking-wider border-2 border-emerald-400 shadow-2xl">
                        🏆 Adversaire Suivant
                    </button>
                    <button id="btnReturnRoster" class="stone-btn px-5 py-2.5 rounded-xl text-stone-200 font-chakra font-black text-xs sm:text-sm uppercase shadow-xl">
                        🦖 Changer de Combattant
                    </button>
                    <button id="btnPostMatchMainMenu" class="stone-btn px-5 py-2.5 rounded-xl text-amber-300 font-chakra font-black text-xs sm:text-sm uppercase shadow-xl">
                        🏠 Menu Principal
                    </button>
                </div>
`;
document.getElementById('fatalityPromptBox').insertAdjacentHTML('afterend', POST_MATCH_MENU_HTML);

function updatePostMatchMenuUI(winner) {
    const btnNext = document.getElementById('btnNextOpponent');
    const btnRematch = document.getElementById('btnRematch');

    if (gameMode === 'campaign') {
        if (winner && winner.isP1) {
            if (campaignStage < 6) {
                btnNext.classList.remove('hidden');
                btnNext.innerHTML = `🏆 Étape Suivante (${campaignStage + 1} / 6) ➔`;
                btnRematch.innerHTML = `🔄 Rejouer l'Étape ${campaignStage}`;
            } else {
                // Victoire finale contre le Dragon Boss !
                btnNext.classList.remove('hidden');
                btnNext.innerHTML = `🐯 Jouer avec Smilodon ➔`;
                btnRematch.innerHTML = `🔄 Rejouer contre Drak'Zul`;
            }
        } else {
            // Défaite en campagne
            btnNext.classList.add('hidden');
            btnRematch.innerHTML = `🔄 Réessayer l'Étape ${campaignStage}`;
        }
    } else {
        btnNext.classList.remove('hidden');
        btnNext.innerHTML = `🏆 Adversaire Suivant`;
        btnRematch.innerHTML = `🔄 Revanche Immédiate`;
    }
}

function initPostMatchMenu() {
    document.getElementById('btnReturnRoster').addEventListener('click', returnToSelect);

    const btnMainMenu = document.getElementById('btnPostMatchMainMenu');
    if (btnMainMenu) {
        btnMainMenu.addEventListener('click', goToMainMenu);
    }

    document.getElementById('btnRematch').addEventListener('click', startMatch);

    document.getElementById('btnNextOpponent').addEventListener('click', () => {
        if (gameMode === 'campaign') {
            if (campaignStage < 6) {
                campaignStage++;
                // En mode campagne, tout est géré automatiquement par le jeu (adversaire et arène thématique)
                startMatch();
            } else {
                // Victoire de la campagne -> Aller au roster avec Smilodon
                const smiloIdx = DINO_ROSTER.findIndex(d => d.id === 'smilodon');
                if (smiloIdx >= 0) {
                    p1ChoiceIndex = smiloIdx;
                    activeSelectSlot = 1;
                }
                returnToSelect();
            }
        } else {
            const unlocked = DINO_ROSTER.map((d, i) => (!d.isUnlockable || isFighterUnlocked(d.id)) ? i : -1).filter(i => i !== -1);
            let nextIdx = (p2ChoiceIndex + 1) % DINO_ROSTER.length;
            while (!unlocked.includes(nextIdx) || nextIdx === p1ChoiceIndex) {
                nextIdx = (nextIdx + 1) % DINO_ROSTER.length;
            }
            p2ChoiceIndex = nextIdx;
            startMatch();
        }
    });
}
