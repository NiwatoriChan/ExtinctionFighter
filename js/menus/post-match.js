/* ============================================================================
 * MENU : FIN DE MATCH (revanche, adversaire suivant / étape suivante, retour au roster, menu principal)
 * ============================================================================ */

const POST_MATCH_MENU_HTML = `
                <!-- POST-MATCH OVERLAY BUTTONS -->
                <div id="postMatchMenu" class="hidden absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex flex-wrap items-center justify-center gap-2.5 pointer-events-auto">
                    <button id="btnRematch" class="px-5 py-2 rounded-xl bg-gradient-to-r from-red-700 to-amber-600 hover:from-red-600 hover:to-amber-500 text-white font-black text-xs sm:text-sm uppercase tracking-wider border border-amber-300 shadow-xl">
                        🔄 Revanche Immédiate
                    </button>
                    <button id="btnNextOpponent" class="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs sm:text-sm uppercase tracking-wider border border-emerald-400 shadow-xl">
                        🏆 Adversaire Suivant
                    </button>
                    <button id="btnReturnRoster" class="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 font-bold text-xs sm:text-sm uppercase border border-zinc-600 shadow-xl">
                        🦖 Changer de Combattant
                    </button>
                    <button id="btnPostMatchMainMenu" class="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-amber-300 font-bold text-xs sm:text-sm uppercase border border-zinc-600 shadow-xl">
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
