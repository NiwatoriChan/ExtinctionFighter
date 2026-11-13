/* ============================================================================
 * MENU : GRIMOIRE DES COMBATTANTS & FATALITÉS (fenêtre modale) — @pmndrs/uikit
 * ============================================================================ */

const movesModalOpenSignal = UIKit.signal(false);

const movesModalRoot = new UIKit.Dialog({
    id: 'movesModal',
    open: movesModalOpenSignal,
    className: 'hidden fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-3',
    children: [
        new UIKit.Card({
            className: 'stone-panel rounded-2xl max-w-3xl w-full max-h-[88vh] flex flex-col overflow-hidden border-2 border-amber-500/60',
            create3DMesh: true,
            backgroundColor: '#15161e',
            borderColor: '#f59e0b',
            borderWidth: 2,
            borderRadius: 16,
            children: [
                new UIKit.Container({
                    className: 'p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950',
                    children: [
                        new UIKit.Text({
                            tag: 'h3',
                            className: 'mk-title text-lg sm:text-xl font-black text-amber-400',
                            text: 'GRIMOIRE DES COMBATTANTS & FATALITÉS'
                        }),
                        new UIKit.Button({
                            id: 'btnCloseMoves',
                            className: 'px-3 py-1 rounded-lg bg-red-900/70 hover:bg-red-700 text-white text-xs font-bold',
                            text: '✕ Fermer'
                        })
                    ]
                }),
                new UIKit.Container({
                    className: 'p-4 overflow-y-auto space-y-3 text-xs sm:text-sm',
                    children: [
                        new UIKit.Card({
                            className: 'p-3 rounded-xl bg-zinc-900/90 border border-zinc-700',
                            children: [
                                new UIKit.Text({
                                    tag: 'h4',
                                    className: 'font-black text-amber-400 uppercase mb-1 block',
                                    text: 'Moteur de Combat Épuré : Commandes Directionnelles & Armures 3D'
                                }),
                                new UIKit.Container({
                                    className: 'space-y-1.5 text-zinc-300 text-xs',
                                    innerHTML: `
                                        <p>
                                            • 💥 <strong>FRAPPER [F / Manette X] (Action Unique Directionnelle) :</strong><br>
                                            &nbsp;&nbsp;⬆️ <strong>Haut + Frappe (Zone HAUTE) :</strong> Coup de tête / morsure ascendante (perce les gardes Médiane et Basse).<br>
                                            &nbsp;&nbsp;⏺️ <strong>Neutre ou Avant + Frappe (Zone MILIEU) :</strong> Morsure au torse / coup de mâchoire direct.<br>
                                            &nbsp;&nbsp;⬇️ <strong>Bas + Frappe (Zone BASSE) :</strong> Balayage des chevilles / frappe au ras du sol.<br>
                                            • ⭐ <strong>COUP SPÉCIAL UNIQUE [H / Manette Y] :</strong> La signature mortelle propre à chaque espèce.<br>
                                            • 🛡️ <strong>PROTÉGER & ARMURE DIRECTIONNELLE [SHIFT / S / Manette B ou Arrière] :</strong><br>
                                            &nbsp;&nbsp;Fait apparaître une <strong>Armure Ostéodermique 3D</strong> à l'endroit protégé (Crâne en Haut, Torse au Milieu, Pattes en Bas). Une garde ajustée dévie l'attaque !<br>
                                            • 💀 <strong>SUPER ATTAQUE RAGE [R / Manette RT] :</strong> Déclenche le X-Ray anatomique en 3 phases à 100% de Rage.<br>
                                            • 🦘 <strong>SAUTER [ESPACE / Manette A] :</strong> Action de saut dédiée, découplée de la direction Haut pour frapper en l'air ou en l'air sans sauter au sol.<br>
                                            • 💨 <strong>DASH DROITE & GAUCHE [E / Double-tap ◀ ▶ / Manette RB] :</strong> Ruée offensive vers l'avant ou esquive de repli vers l'arrière (Droite et Gauche).<br>
                                            • <strong>Inertie & Anti-Spam :</strong> La vitesse de course multiplie vos dégâts (1 + k · ||v||). Répéter le même coup réduit ses dégâts et sa vitesse (0.85×).
                                        </p>
                                    `
                                })
                            ]
                        }),
                        new UIKit.Container({
                            id: 'modalRosterMoves',
                            className: 'grid grid-cols-1 md:grid-cols-2 gap-3'
                        })
                    ]
                })
            ]
        })
    ]
});

movesModalRoot.mount(document.getElementById('appMain'), 'afterend');

function renderMovesModalList() {
    const modalListNode = UIKit.getElementById('modalRosterMoves');
    if (!modalListNode) return;
    modalListNode.clearChildren();

    DINO_ROSTER.forEach(d => {
        if (d.isUnlockable && !isFighterUnlocked(d.id)) {
            const reqEraId = (typeof UNLOCKABLE_FIGHTER_ERAS !== 'undefined' && UNLOCKABLE_FIGHTER_ERAS[d.id]) || null;
            const reqEra = (reqEraId && typeof CAMPAIGN_ERAS !== 'undefined')
                ? CAMPAIGN_ERAS.find(e => e.id === reqEraId)
                : null;
            const unlockHint = reqEra
                ? `Conquérez l'Ère ${reqEra.id} (${reqEra.name}) en Campagne pour déverrouiller ce combattant et son grimoire.`
                : "Triomphez de la Campagne d'Extinction pour déverrouiller ce combattant et son grimoire.";
            modalListNode.add(new UIKit.Card({
                className: 'p-3 rounded-xl bg-zinc-950/80 border border-amber-500/30 border-dashed text-center flex flex-col items-center justify-center py-5',
                children: [
                    new UIKit.Text({ tag: 'span', className: 'text-2xl mb-1 text-amber-400', text: '🔒' }),
                    new UIKit.Text({ tag: 'span', className: 'mk-title font-black text-amber-400 text-sm', text: '??? (COMBATTANT DÉBLOQUABLE)' }),
                    new UIKit.Text({
                        tag: 'span',
                        className: 'text-[10px] text-zinc-400 mt-1 max-w-xs',
                        text: unlockHint
                    })
                ]
            }));
            return;
        }

        const cardChildren = [];
        if (d.isUnlockable) {
            cardChildren.push(new UIKit.Badge({
                className: 'absolute top-2 right-2 px-1.5 py-0.5 rounded bg-amber-500 text-black text-[9px] font-black uppercase',
                text: 'Débloqué'
            }));
        }
        cardChildren.push(
            new UIKit.Container({
                className: 'flex items-center justify-between',
                children: [
                    new UIKit.Text({ tag: 'span', className: 'mk-title font-black text-amber-400 text-sm', text: d.name }),
                    new UIKit.Badge({ className: 'text-[11px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300', text: d.role })
                ]
            }),
            new UIKit.Container({
                tag: 'p',
                className: 'text-xs text-zinc-300 mt-1',
                innerHTML: `<strong>Animation 3D :</strong> ${d.moveStyle}`
            }),
            new UIKit.Container({
                tag: 'ul',
                className: 'mt-2 space-y-0.5 text-xs',
                innerHTML: `
                    <li>⭐ <strong>Coup Spécial Unique [H] :</strong> <span class="text-amber-300 font-bold">${d.special1Name}</span></li>
                    <li>💀 <strong>Fatalité 3D (${d.fatalityName}) :</strong> <span class="text-red-400">${d.fatalityDesc}</span></li>
                `
            })
        );

        modalListNode.add(new UIKit.Card({
            className: 'p-3 rounded-xl bg-zinc-900/70 border border-zinc-700 relative overflow-hidden',
            children: cardChildren
        }));
    });
}

function openMovesModal() {
    renderMovesModalList();
    movesModalOpenSignal.value = true;
    const modal = document.getElementById('movesModal');
    if (modal) modal.classList.remove('hidden');
}

function closeMovesModal() {
    movesModalOpenSignal.value = false;
    const modal = document.getElementById('movesModal');
    if (modal) modal.classList.add('hidden');
    if (typeof isMatchPaused !== 'undefined' && isMatchPaused) {
        const pauseModal = document.getElementById('pauseModal');
        if (pauseModal) {
            pauseModal.classList.remove('hidden');
            if (typeof updatePauseFocus === 'function') updatePauseFocus();
        }
    }
}

function initMovesModal() {
    renderMovesModalList();

    const btnShow = document.getElementById('btnShowMoves');
    if (btnShow) {
        btnShow.addEventListener('click', openMovesModal);
    }
    const btnClose = document.getElementById('btnCloseMoves');
    if (btnClose) {
        btnClose.addEventListener('click', closeMovesModal);
    }
}
