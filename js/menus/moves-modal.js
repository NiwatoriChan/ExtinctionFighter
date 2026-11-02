/* ============================================================================
 * MENU : GRIMOIRE DES COMBATTANTS & FATALITÉS (fenêtre modale)
 * ============================================================================ */

const MOVES_MODAL_HTML = `
    <!-- MODAL: MOVELIST & LORE -->
    <div id="movesModal" class="hidden fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-3">
        <div class="stone-panel rounded-2xl max-w-3xl w-full max-h-[88vh] flex flex-col overflow-hidden border-2 border-amber-500/60">
            <div class="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
                <h3 class="mk-title text-lg sm:text-xl font-black text-amber-400">GRIMOIRE DES COMBATTANTS & FATALITÉS</h3>
                <button id="btnCloseMoves" class="px-3 py-1 rounded-lg bg-red-900/70 hover:bg-red-700 text-white text-xs font-bold">✕ Fermer</button>
            </div>
            <div class="p-4 overflow-y-auto space-y-3 text-xs sm:text-sm">
                <div class="p-3 rounded-xl bg-zinc-900/90 border border-zinc-700">
                    <h4 class="font-black text-amber-400 uppercase mb-1">Moteur de Combat Pro, Triangle Attaque/Garde/Chope & Passifs</h4>
                    <div class="space-y-1.5 text-zinc-300 text-xs">
                        <p>
                            • <strong>Système de Défense Moderne :</strong> Maintenez <code class="text-amber-300">Arrière</code> pour la <strong>Garde Haute</strong> (bloque les coups hauts et aériens) ou <code class="text-amber-300">Bas</code> / <code class="text-amber-300">Bas+Arrière</code> pour la <strong>Garde Basse</strong> (accroupi).<br>
                            • <strong>Attaques Directionnelles au Stick / Croix (4 Directions) :</strong><br>
                            &nbsp;&nbsp;⬆️ <strong>Haut + Attaque :</strong> Frappe vers le HAUT (Uppercut / Mâchoire au zénith, brise la garde basse accroupie).<br>
                            &nbsp;&nbsp;⬇️ <strong>Bas + Attaque :</strong> Frappe vers le BAS (Balayage et pilonnage au sol, brise la garde haute debout).<br>
                            &nbsp;&nbsp;➡️ <strong>Avant + Attaque :</strong> Percée vers l'AVANT (Allongement horizontal à longue portée / Charge).<br>
                            &nbsp;&nbsp;⬅️ <strong>Arrière + Attaque :</strong> Contre défensif en repli / Anti-Air d'interception.<br>
                            &nbsp;&nbsp;⏺️ <strong>Neutre (sans direction) :</strong> Enchaînement 1-2 fluide au centre.<br>
                            • <strong>Impact & Rebond Mural (Wall Splat) :</strong> Percutez violemment l'adversaire contre les parois de l'arène pour provoquer un rebond mural et prolonger votre combo en jonglage aérien.<br>
                            • <strong>Passifs d'Espèces :</strong> 
                            <span class="text-red-400 font-bold">Smilodon :</span> Saignement viscéral cumulable (×3). 
                            <span class="text-emerald-400 font-bold">Pulmonoscorpius :</span> Neurotoxine empoisonnante et ralentissement. 
                            <span class="text-sky-400 font-bold">Ankylosaure :</span> Hyper-Armure sur coups lourds & renvoi de projectiles. 
                            <span class="text-amber-400 font-bold">Quetzalcoatlus :</span> Plané stratosphérique aérien en maintenant Saut. 
                            <span class="text-orange-400 font-bold">Thérizinosaure :</span> 40% de dégâts de gratte à travers la garde. 
                            <span class="text-yellow-400 font-bold">Apatosaure :</span> Séisme au sol inbloquable (saut obligatoire !). 
                            <span class="text-red-300 font-bold">T-Rex :</span> Rugissement d'intimidation réduisant de 25% la force adverse.
                        </p>
                    </div>
                </div>
                <div id="modalRosterMoves" class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <!-- Populated by JS -->
                </div>
            </div>
        </div>
    </div>
`;
document.getElementById('appMain').insertAdjacentHTML('afterend', MOVES_MODAL_HTML);

function renderMovesModalList() {
    const modalList = document.getElementById('modalRosterMoves');
    if (!modalList) return;
    modalList.innerHTML = DINO_ROSTER.map(d => {
        if (d.isUnlockable && !isFighterUnlocked(d.id)) {
            return `
                <div class="p-3 rounded-xl bg-zinc-950/80 border border-amber-500/30 border-dashed text-center flex flex-col items-center justify-center py-5">
                    <span class="text-2xl mb-1 text-amber-400">🔒</span>
                    <span class="mk-title font-black text-amber-400 text-sm">??? (COMBATTANT DÉBLOCABLE)</span>
                    <span class="text-[10px] text-zinc-400 mt-1 max-w-xs">Triomphez de la Campagne d'Extinction et éliminez le Dragon Suprême pour déverrouiller ce félin préhistorique et son grimoire.</span>
                </div>
            `;
        }
        return `
            <div class="p-3 rounded-xl bg-zinc-900/70 border border-zinc-700 relative overflow-hidden">
                ${d.isUnlockable ? '<span class="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-amber-500 text-black text-[9px] font-black uppercase">Débloqué</span>' : ''}
                <div class="flex items-center justify-between">
                    <span class="mk-title font-black text-amber-400 text-sm">${d.name}</span>
                    <span class="text-[11px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">${d.role}</span>
                </div>
                <p class="text-xs text-zinc-300 mt-1"><strong>Animation 3D :</strong> ${d.moveStyle}</p>
                <ul class="mt-2 space-y-0.5 text-xs">
                    <li>⚡ <strong>Spécial 1 :</strong> <span class="text-amber-300">${d.special1Name}</span></li>
                    <li>🌪️ <strong>Spécial 2 :</strong> <span class="text-emerald-300">${d.special2Name}</span></li>
                    <li>💀 <strong>Fatalité 3D (${d.fatalityName}) :</strong> <span class="text-red-400">${d.fatalityDesc}</span></li>
                </ul>
            </div>
        `;
    }).join('');
}

function closeMovesModal() {
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
        btnShow.addEventListener('click', () => {
            renderMovesModalList();
            document.getElementById('movesModal').classList.remove('hidden');
        });
    }
    const btnClose = document.getElementById('btnCloseMoves');
    if (btnClose) {
        btnClose.addEventListener('click', closeMovesModal);
    }
}
