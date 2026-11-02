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
                    <h4 class="font-black text-amber-400 uppercase mb-1">Moteur de Combat Épuré : Commandes Directionnelles & Armures 3D</h4>
                    <div class="space-y-1.5 text-zinc-300 text-xs">
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
                            • 💨 <strong>DASH [E / Manette RB] :</strong> Ruée rapide et esquive d'urgence.<br>
                            • <strong>Inertie & Anti-Spam :</strong> La vitesse de course multiplie vos dégâts ($1 + k \cdot \Vert\vec{v}\Vert$). Répéter le même coup réduit ses dégâts et sa vitesse ($0.85\times$).
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
                    <li>⭐ <strong>Coup Spécial Unique [H] :</strong> <span class="text-amber-300 font-bold">${d.special1Name}</span></li>
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
