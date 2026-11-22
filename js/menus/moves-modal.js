/* ============================================================================
 * MENU : GRIMOIRE DES COMBATTANTS & SUPERS (fenêtre modale) — @pmndrs/uikit
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
                            text: 'GRIMOIRE DES COMBATTANTS & SUPERS'
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
                                    className: 'font-black text-amber-400 uppercase mb-1.5 block',
                                    text: 'Système de Combat Primal : Palette Complète, Parades & Supers'
                                }),
                                new UIKit.Container({
                                    className: 'space-y-1.5 text-zinc-300 text-xs leading-relaxed',
                                    innerHTML: `
                                        <ul class="space-y-1.5">
                                            <li>💥 <strong>Frappe Légère [F / X] :</strong> Rapide et directionnelle — <em>Haut</em>, <em>Avant</em>, <em>Neutre</em> (enchaînement <code>F → F</code>), <em>Arrière</em>, <em>Bas</em> et <em>Aérien</em>.</li>
                                            <li>🔨 <strong>Frappe Lourde [G / Y] :</strong> Coups lourds dévastateurs — <em>Neutre</em>, <em>Avant Bélier</em>, <em>Anti-Air Haut</em>, <em>Balayage Bas</em> (mise au sol) et <em>Piqué Aérien</em>.</li>
                                            <li>⭐ <strong>Spécial 1 [H / B] &amp; Spécial 2 [T ou Bas+H / Bas+B] :</strong> Les deux attaques signatures uniques propres à chaque espèce.</li>
                                            <li>🤼 <strong>Chope Inbloquable [V ou Garde+F / LB+X] :</strong> Saisie au corps-à-corps qui brise toute garde et projette l'adversaire.</li>
                                            <li>🛡️ <strong>Garde 3-Voies &amp; Parade Parfaite [Shift / LB] :</strong> Déploie une <em>Armure Ostéodermique 3D</em> (Haute / Milieu / Basse). <strong>Parade Parfaite</strong> : bloquer au dernier instant = <strong>0 dégât</strong>, <strong>0 usure</strong>, <strong>+15% Rage</strong> et <strong>déviation</strong> !</li>
                                            <li>🔥 <strong>Counter-Hit &amp; Combos :</strong> Interrompre un coup adverse pendant son amorce inflige <strong>+20% dégâts</strong> et un <strong>combo étendu</strong> ! Enchaînez <code>Légère → Lourde → Spécial → Super</code> sur coup confirmé.</li>
                                            <li>⚡ <strong>PRIMAL SUPER [R / RT] (100% de Rage) :</strong> Déclenche un <strong>Super Flash</strong> cinématique, <strong>combo-cancelable</strong> sur coup confirmé, et provoque un <strong>☢ EXTINCTION FINISH !</strong> sur K.O. final !</li>
                                            <li>🦘 <strong>Saut [ESPACE / A] &amp; Dash [E / Double-tap ◀ ▶ / RB] :</strong> Saut dédié et ruée / esquive directionnelle.</li>
                                        </ul>
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
        const superSpec = (typeof getSuperSpec === 'function') ? getSuperSpec(d.id) : null;
        const sp1Label = (d.special1Name || 'Technique Spéciale 1').replace(/\s*\(H\)\s*$/i, '');
        const sp2Label = (d.special2Name || 'Technique Spéciale 2').replace(/\s*\(T\)\s*$/i, '');
        const superName = (superSpec && superSpec.name)
            ? superSpec.name
            : (d.fatalityName || 'Primal Super').replace(/\s*\(R\)\s*$/i, '');
        const superDesc = (superSpec && superSpec.subtitle)
            ? superSpec.subtitle
            : (d.fatalityDesc || 'Super attaque signature déclenchant un Extinction Finish sur K.O. final.');

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
                className: 'mt-2 space-y-1 text-xs',
                innerHTML: `
                    <li>⭐ <strong>Spécial 1 [H] :</strong> <span class="text-amber-300 font-bold">${sp1Label}</span></li>
                    <li>🔥 <strong>Spécial 2 [T / Bas+H] :</strong> <span class="text-orange-300 font-bold">${sp2Label}</span></li>
                    <li>⚡ <strong>PRIMAL SUPER [R] :</strong> <span class="text-red-400 font-black">${superName}</span> — <span class="text-zinc-300">${superDesc}</span></li>
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
