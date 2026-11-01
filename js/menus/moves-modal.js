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
                    <h4 class="font-black text-amber-400 uppercase mb-1">Commandes Pro, Temps de Recharge (Cooldown) & Jauge de Rage</h4>
                    <p class="text-zinc-300">
                        • <strong>Joueur 1 :</strong> <code class="text-amber-300">A/D</code> ou <code class="text-amber-300">Q/D</code> (Déplacement), <code class="text-amber-300">E</code> ou <strong>Double-Direction</strong> (Dash rapide avant/arrière), <code class="text-amber-300">W/Z</code> (Saut + Attaques sautées), <code class="text-amber-300">S</code> (Garde), <code class="text-amber-300">F</code> (Léger), <code class="text-amber-300">G</code> (Lourd), <code class="text-amber-300">H</code> (Spécial 1), <code class="text-amber-300">T</code> (Ultra), <code class="text-amber-300">R</code> / <code class="text-amber-300">Espace</code> (X-Ray ou <strong>FATALITÉ</strong>).<br>
                        • <strong>Système de Cooldown :</strong> Plus l'attaque est puissante, plus son temps de recharge est long : <span class="text-amber-300">Léger (0.45s)</span> &lt; <span class="text-orange-400">Lourd (1.10s)</span> &lt; <span class="text-purple-400">Spécial (2.80s)</span> &lt; <span class="text-emerald-400">Ultra (4.50s)</span>.<br>
                        • <strong>X-Ray & Fatalité Ultime :</strong> Le coup destructeur X-Ray nécessite <span class="text-red-400 font-extrabold uppercase">100% de jauge de rage</span> pendant le combat. En revanche, la <span class="text-amber-400 font-extrabold uppercase">FATALITÉ</span> peut TOUJOURS être exécutée pendant la phase finale « ACHEVEZ-LE ! », même sans jauge de rage (via <code class="text-amber-300">R</code>, <code class="text-amber-300">Espace</code> ou boutons d'attaque) !<br>
                        • <strong>Joueur 2 (Mode 2J Local) :</strong> Flèches directionnelles + Pavé Numérique <code class="text-blue-300">1/I</code> (Léger), <code class="text-blue-300">2/O</code> (Lourd), <code class="text-blue-300">3/P</code> (Spécial 1), <code class="text-blue-300">4</code> (Ultra), <code class="text-blue-300">5</code> (Dash), <code class="text-blue-300">0/M</code> (X-Ray / Fatalité). Compatible manettes USB/Bluetooth !
                    </p>
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

function initMovesModal() {
    renderMovesModalList();

    const btnShow = document.getElementById('btnShowMoves');
    if (btnShow) {
        btnShow.addEventListener('click', () => {
            renderMovesModalList();
            document.getElementById('movesModal').classList.remove('hidden');
        });
    }
    document.getElementById('btnCloseMoves').addEventListener('click', () => {
        document.getElementById('movesModal').classList.add('hidden');
    });
}
