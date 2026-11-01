/* ============================================================================
 * MENU : FIN DE MATCH (revanche, adversaire suivant, retour au roster)
 * ============================================================================ */

const POST_MATCH_MENU_HTML = `
                <!-- POST-MATCH OVERLAY BUTTONS -->
                <div id="postMatchMenu" class="hidden absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex flex-wrap items-center justify-center gap-3 pointer-events-auto">
                    <button id="btnRematch" class="px-5 py-2 rounded-xl bg-gradient-to-r from-red-700 to-amber-600 hover:from-red-600 hover:to-amber-500 text-white font-black text-xs sm:text-sm uppercase tracking-wider border border-amber-300 shadow-xl">
                        🔄 Revanche Immédiate
                    </button>
                    <button id="btnNextOpponent" class="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs sm:text-sm uppercase tracking-wider border border-emerald-400 shadow-xl">
                        🏆 Adversaire Suivant
                    </button>
                    <button id="btnReturnRoster" class="px-5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 font-bold text-xs sm:text-sm uppercase border border-zinc-600 shadow-xl">
                        🦖 Menu des Dinosaures
                    </button>
                </div>
`;
document.getElementById('fatalityPromptBox').insertAdjacentHTML('afterend', POST_MATCH_MENU_HTML);

function initPostMatchMenu() {
    document.getElementById('btnReturnRoster').addEventListener('click', returnToSelect);

    document.getElementById('btnRematch').addEventListener('click', startMatch);
    document.getElementById('btnNextOpponent').addEventListener('click', () => {
        p2ChoiceIndex = (p2ChoiceIndex + 1) % DINO_ROSTER.length;
        if (p2ChoiceIndex === p1ChoiceIndex) p2ChoiceIndex = (p2ChoiceIndex + 1) % DINO_ROSTER.length;
        startMatch();
    });
}
