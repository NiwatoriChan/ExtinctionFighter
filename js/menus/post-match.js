/* ============================================================================
 * MENU : FIN DE MATCH (revanche, adversaire suivant / étape suivante, retour au roster, menu principal)
 * Ported to @pmndrs/uikit
 * ============================================================================ */

const postMatchRematchLabelSignal = UIKit.signal('🔄 Revanche Immédiate');
const postMatchNextLabelSignal = UIKit.signal('🏆 Adversaire Suivant');
const postMatchNextHiddenSignal = UIKit.signal(false);

const postMatchMenuNode = new UIKit.Container({
    id: 'postMatchMenu',
    className: 'hidden absolute bottom-5 left-1/2 -translate-x-1/2 z-40 flex flex-wrap items-center justify-center gap-3 pointer-events-auto',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    children: [
        new UIKit.Button({
            id: 'btnRematch',
            className: 'px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-800 via-red-600 to-amber-600 hover:from-red-700 hover:to-amber-500 text-white font-cinzel font-black text-xs sm:text-sm uppercase tracking-wider border-2 border-amber-300 shadow-2xl finish-pulse',
            text: postMatchRematchLabelSignal
        }),
        new UIKit.Button({
            id: 'btnNextOpponent',
            hidden: postMatchNextHiddenSignal,
            className: 'px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-800 to-teal-700 hover:from-emerald-700 hover:to-teal-600 text-white font-cinzel font-black text-xs sm:text-sm uppercase tracking-wider border-2 border-emerald-400 shadow-2xl',
            text: postMatchNextLabelSignal
        }),
        new UIKit.Button({
            id: 'btnReturnRoster',
            className: 'stone-btn px-5 py-2.5 rounded-xl text-stone-200 font-chakra font-black text-xs sm:text-sm uppercase shadow-xl',
            text: '🦖 Changer de Combattant'
        }),
        new UIKit.Button({
            id: 'btnPostMatchMainMenu',
            className: 'stone-btn px-5 py-2.5 rounded-xl text-amber-300 font-chakra font-black text-xs sm:text-sm uppercase shadow-xl',
            text: '🏠 Menu Principal'
        })
    ]
});

function mountPostMatchMenu() {
    if (document.getElementById('postMatchMenu')) return;
    const superOverlay = document.getElementById('superFlashOverlay');
    if (superOverlay && superOverlay.parentNode) {
        postMatchMenuNode.mount(superOverlay, 'afterend');
        return;
    }
    const canvasWrapper = document.querySelector('#battleScreen > div') || document.getElementById('battleScreen');
    if (canvasWrapper) {
        postMatchMenuNode.mount(canvasWrapper, 'beforeend');
    }
}

mountPostMatchMenu();

function updatePostMatchMenuUI(winner) {
    if (gameMode === 'campaign') {
        if (winner && winner.isP1) {
            postMatchNextHiddenSignal.value = false;
            if (campaignStage < 6) {
                postMatchNextLabelSignal.value = `🏆 Étape Suivante (${campaignStage + 1} / 6) ➔`;
                postMatchRematchLabelSignal.value = `🔄 Rejouer l'Étape ${campaignStage}`;
            } else {
                postMatchNextLabelSignal.value = `🗺️ Ouvrir la Campagne des Ères ➔`;
                postMatchRematchLabelSignal.value = `🔄 Rejouer contre Drak'Zul`;
            }
        } else {
            postMatchNextHiddenSignal.value = true;
            postMatchRematchLabelSignal.value = `🔄 Réessayer l'Étape ${campaignStage}`;
        }
    } else {
        postMatchNextHiddenSignal.value = false;
        postMatchNextLabelSignal.value = `🏆 Adversaire Suivant`;
        postMatchRematchLabelSignal.value = `🔄 Revanche Immédiate`;
    }
}

function showPostMatchMenu(winner) {
    mountPostMatchMenu();
    updatePostMatchMenuUI(winner);
    const pmm = document.getElementById('postMatchMenu');
    if (pmm) pmm.classList.remove('hidden');
}

function hidePostMatchMenu() {
    const pmm = document.getElementById('postMatchMenu');
    if (pmm) pmm.classList.add('hidden');
}

window.showPostMatchMenu = showPostMatchMenu;
window.hidePostMatchMenu = hidePostMatchMenu;
window.updatePostMatchMenuUI = updatePostMatchMenuUI;

function initPostMatchMenu() {
    mountPostMatchMenu();

    const btnReturnRoster = document.getElementById('btnReturnRoster');
    if (btnReturnRoster) {
        btnReturnRoster.addEventListener('click', returnToSelect);
    }

    const btnMainMenu = document.getElementById('btnPostMatchMainMenu');
    if (btnMainMenu) {
        btnMainMenu.addEventListener('click', goToMainMenu);
    }

    const btnRematch = document.getElementById('btnRematch');
    if (btnRematch) {
        btnRematch.addEventListener('click', startMatch);
    }

    const btnNextOpponent = document.getElementById('btnNextOpponent');
    if (btnNextOpponent) {
        btnNextOpponent.addEventListener('click', () => {
            if (gameMode === 'campaign') {
                if (campaignStage < 6) {
                    campaignStage++;
                    startMatch();
                } else if (typeof openCampaignMap === 'function') {
                    if (typeof teardownActiveBattle === 'function') teardownActiveBattle();
                    openCampaignMap();
                } else {
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
}
