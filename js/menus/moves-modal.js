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
                    <h4 class="font-black text-amber-400 uppercase mb-1">Commandes Pro, Enchaînements & Esquives</h4>
                    <p class="text-zinc-300">
                        • <strong>Joueur 1 :</strong> <code class="text-amber-300">A/D</code> ou <code class="text-amber-300">Q/D</code> (Déplacement), <code class="text-amber-300">E</code> ou <strong>Double-Direction</strong> (Dash rapide avant/arrière), <code class="text-amber-300">W/Z</code> (Saut + Attaques sautées), <code class="text-amber-300">S</code> (Garde), <code class="text-amber-300">F</code> (Léger), <code class="text-amber-300">G</code> (Lourd), <code class="text-amber-300">H</code> (Spécial 1), <code class="text-amber-300">T</code> (Ultra), <code class="text-amber-300">R</code> / <code class="text-amber-300">Espace</code> (X-Ray ou <strong>FATALITÉ</strong>).<br>
                        • <strong>Chaînes de Combos (Cancel) :</strong> Vous pouvez enchaîner sans délai <span class="text-amber-300 font-bold">Léger (F) ➔ Lourd (G) ➔ Spécial (H ou T) ➔ X-Ray (R)</span> !<br>
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
    modalList.innerHTML = DINO_ROSTER.map(d => `
        <div class="p-3 rounded-xl bg-zinc-900/70 border border-zinc-700">
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
    `).join('');
}

function initMovesModal() {
    renderMovesModalList();

    document.getElementById('btnShowMoves').addEventListener('click', () => {
        document.getElementById('movesModal').classList.remove('hidden');
    });
    document.getElementById('btnCloseMoves').addEventListener('click', () => {
        document.getElementById('movesModal').classList.add('hidden');
    });
}
