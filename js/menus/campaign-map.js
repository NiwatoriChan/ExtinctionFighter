/* ============================================================================
 * MENU : CARTE DU MONDE DE CAMPAGNE (SMASH MELEE ADVENTURE MODE)
 * Overhaul complet :
 *   - Carte du monde Pangaea interactive avec route temporelle des 6 grandes Ères
 *   - Logos uniques pour chaque ère (assets/ui/era_logos/era_X_*.png)
 *   - Dossier d'ère détaillé : lore, vagues Smash Melee, boss monstre unique, récompenses
 *   - Aperçu des déblocages : Combattant + Arène par ère
 *   - Sélecteur rapide de héros préhistorique
 *   - Navigation souris, clavier (Flèches / Entrée / Échap) et manette
 * ============================================================================ */

var selectedEraIndexSignal = UIKit.signal(0);
var campaignMapVisibleSignal = UIKit.signal(false);
window.selectedEraIndexSignal = selectedEraIndexSignal;
window.campaignMapVisibleSignal = campaignMapVisibleSignal;

let campaignMapRoot = null;

function buildCampaignMapUIKit() {
    // 1. EN-TÊTE DE LA CARTE DE CAMPAGNE
    const header = new UIKit.Container({
        tag: 'header',
        className: 'w-full flex flex-col items-center justify-center pt-2 sm:pt-4 pb-2 z-20 shrink-0 text-center',
        children: [
            new UIKit.Text({
                tag: 'h1',
                className: 'font-cinzel text-2xl sm:text-4xl md:text-5xl font-black text-amber-200 uppercase tracking-widest drop-shadow-[0_4px_14px_rgba(0,0,0,0.95)] primal-clash-title-text',
                text: 'CAMPAGNE D\'EXTINCTION : LA ROUTE DU TEMPS'
            }),
            new UIKit.Container({
                className: 'flex items-center justify-center gap-3 mt-1',
                children: [
                    new UIKit.Container({ className: 'w-16 sm:w-32 h-0.5 bg-gradient-to-r from-transparent to-amber-500' }),
                    new UIKit.Text({
                        tag: 'span',
                        className: 'font-chakra font-black text-xs sm:text-sm text-amber-300 tracking-[0.2em] uppercase',
                        text: UIKit.computed(() => {
                            let cleared = 0;
                            if (typeof CAMPAIGN_ERAS !== 'undefined') {
                                CAMPAIGN_ERAS.forEach(e => { if (isEraCleared(e.id)) cleared++; });
                            }
                            return `SÉLECTIONNEZ UNE ÈRE • ${cleared} / 6 ÈRES CONQUISES`;
                        })
                    }),
                    new UIKit.Container({ className: 'w-16 sm:w-32 h-0.5 bg-gradient-to-l from-transparent to-amber-500' })
                ]
            })
        ]
    });

    // 2. PANNEAU DE GAUCHE : DOSSIER DE L'ÈRE & OBJECTIFS DU NIVEAU SMASH
    const dossierTablet = new UIKit.Card({
        id: 'campaignDossierTablet',
        className: 'w-full lg:w-96 flex flex-col justify-between p-4 sm:p-5 rounded-2xl stone-panel border-2 border-stone-600/80 shadow-2xl relative z-20 overflow-y-auto max-h-[85vh]',
        children: [
            new UIKit.Container({
                children: [
                    // En-tête de l'ère
                    new UIKit.Container({
                        className: 'flex items-center justify-between',
                        children: [
                            new UIKit.Text({
                                tag: 'span',
                                className: 'font-chakra text-[10px] sm:text-xs font-black text-amber-400 uppercase tracking-widest',
                                text: 'DOSSIER GÉOLOGIQUE :'
                            }),
                            new UIKit.Badge({
                                id: 'dossierStatusBadge',
                                className: UIKit.computed(() => {
                                    const era = CAMPAIGN_ERAS[selectedEraIndexSignal.value];
                                    if (isEraCleared(era.id)) return 'px-2 py-0.5 rounded bg-emerald-950/90 border border-emerald-500 text-emerald-300 font-chakra font-black text-[10px] uppercase shadow';
                                    if (isEraUnlocked(era.id)) return 'px-2 py-0.5 rounded bg-amber-950/90 border border-amber-500 text-amber-300 font-chakra font-black text-[10px] uppercase shadow';
                                    return 'px-2 py-0.5 rounded bg-stone-900 border border-stone-600 text-stone-400 font-chakra font-black text-[10px] uppercase shadow';
                                }),
                                text: UIKit.computed(() => {
                                    const era = CAMPAIGN_ERAS[selectedEraIndexSignal.value];
                                    if (isEraCleared(era.id)) return '👑 CONQUIS (3/3 ⭐)';
                                    if (isEraUnlocked(era.id)) return '⚔️ DISPONIBLE';
                                    return '🔒 VERROUILLÉ';
                                })
                            })
                        ]
                    }),
                    new UIKit.Text({
                        id: 'dossierPeriodName',
                        tag: 'h2',
                        className: 'font-cinzel font-black text-xl sm:text-2xl text-amber-100 uppercase tracking-wider drop-shadow mt-1',
                        text: UIKit.computed(() => CAMPAIGN_ERAS[selectedEraIndexSignal.value].name)
                    }),
                    new UIKit.Text({
                        id: 'dossierPeriodSub',
                        tag: 'div',
                        className: 'font-chakra font-bold text-[11px] sm:text-xs text-amber-400/90 uppercase tracking-wider mb-2',
                        text: UIKit.computed(() => `${CAMPAIGN_ERAS[selectedEraIndexSignal.value].subtitle} (${CAMPAIGN_ERAS[selectedEraIndexSignal.value].periodYears})`)
                    }),

                    // Showcase Logo de l'Ère
                    new UIKit.Container({
                        className: 'w-full h-36 sm:h-40 rounded-xl border-2 border-amber-500/70 overflow-hidden relative shadow-lg bg-stone-950/95 flex items-center justify-center p-2 mb-3',
                        children: [
                            new UIKit.Image({
                                id: 'dossierEraLogoImg',
                                className: 'w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(245,158,11,0.7)]',
                                src: UIKit.computed(() => CAMPAIGN_ERAS[selectedEraIndexSignal.value].logo),
                                alt: 'Logo de l\'Ère'
                            }),
                            new UIKit.Container({
                                className: 'absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none'
                            }),
                            new UIKit.Container({
                                className: 'absolute bottom-2 left-2 right-2 flex items-center justify-between',
                                children: [
                                    new UIKit.Badge({
                                        className: 'px-2 py-0.5 rounded bg-stone-950/90 border border-amber-500/80 text-amber-300 font-cinzel font-black text-[10px] uppercase shadow',
                                        text: UIKit.computed(() => `ARÈNE : ${CAMPAIGN_ERAS[selectedEraIndexSignal.value].arenaId.toUpperCase()}`)
                                    })
                                ]
                            })
                        ]
                    }),

                    // Description Lore
                    new UIKit.Text({
                        id: 'dossierDesc',
                        tag: 'p',
                        className: 'font-chakra text-xs text-stone-300/90 leading-relaxed italic border-b border-stone-700/60 pb-2 mb-3',
                        text: UIKit.computed(() => CAMPAIGN_ERAS[selectedEraIndexSignal.value].description)
                    }),

                    // Section Smash Melee Level Breakdown
                    new UIKit.Container({
                        className: 'space-y-1.5 mb-3 bg-stone-950/60 p-2.5 rounded-xl border border-stone-700/60',
                        children: [
                            new UIKit.Text({
                                tag: 'div',
                                className: 'font-chakra text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1',
                                text: 'PROGRAMME DU NIVEAU SMASH MELEE :'
                            }),
                            new UIKit.Text({
                                tag: 'div',
                                className: 'font-chakra text-xs text-stone-200 font-bold flex items-center gap-1.5',
                                text: UIKit.computed(() => `⚔️ Vague 1 : ${CAMPAIGN_ERAS[selectedEraIndexSignal.value].waves[0].name}`)
                            }),
                            new UIKit.Text({
                                tag: 'div',
                                className: 'font-chakra text-xs text-amber-300 font-bold flex items-center gap-1.5',
                                text: UIKit.computed(() => `💀 Vague 2 : ${CAMPAIGN_ERAS[selectedEraIndexSignal.value].waves[1].name}`)
                            }),
                            new UIKit.Text({
                                tag: 'div',
                                className: 'font-chakra text-xs text-red-400 font-black flex items-center gap-1.5',
                                text: UIKit.computed(() => `👑 BOSS APEX : ${CAMPAIGN_ERAS[selectedEraIndexSignal.value].waves[2].bossName}`)
                            })
                        ]
                    }),

                    // Section Récompenses Déblocables (Combattant + Arène)
                    new UIKit.Container({
                        className: 'bg-stone-950/60 p-2.5 rounded-xl border border-amber-500/40 space-y-2 mb-3',
                        children: [
                            new UIKit.Text({
                                tag: 'div',
                                className: 'font-chakra text-[10px] font-black text-amber-300 uppercase tracking-widest flex items-center justify-between',
                                children: [
                                    new UIKit.Text({ tag: 'span', text: '🎁 RÉCOMPENSES DU NIVEAU :' }),
                                    new UIKit.Text({
                                        tag: 'span',
                                        className: UIKit.computed(() => {
                                            const era = CAMPAIGN_ERAS[selectedEraIndexSignal.value];
                                            return isEraCleared(era.id) ? 'text-emerald-400 font-black' : 'text-stone-400';
                                        }),
                                        text: UIKit.computed(() => {
                                            const era = CAMPAIGN_ERAS[selectedEraIndexSignal.value];
                                            return isEraCleared(era.id) ? 'DÉBLOQUÉES ✔' : 'À CONQUÉRIR 🔒';
                                        })
                                    })
                                ]
                            }),
                            new UIKit.Container({
                                className: 'flex items-center gap-3',
                                children: [
                                    new UIKit.Container({
                                        className: 'w-10 h-10 rounded-lg overflow-hidden border border-amber-500/80 bg-stone-900 shrink-0 shadow',
                                        children: [
                                            new UIKit.Image({
                                                className: 'w-full h-full object-cover',
                                                src: UIKit.computed(() => CAMPAIGN_ERAS[selectedEraIndexSignal.value].reward.fighterPortrait),
                                                alt: 'Reward Fighter'
                                            })
                                        ]
                                    }),
                                    new UIKit.Container({
                                        className: 'flex flex-col text-left',
                                        children: [
                                            new UIKit.Text({
                                                tag: 'span',
                                                className: 'font-cinzel font-black text-xs text-amber-200 uppercase',
                                                text: UIKit.computed(() => `🦖 Combattant : ${CAMPAIGN_ERAS[selectedEraIndexSignal.value].reward.fighterName}`)
                                            }),
                                            new UIKit.Text({
                                                tag: 'span',
                                                className: 'font-chakra text-[10px] text-stone-300 font-bold',
                                                text: UIKit.computed(() => `🌋 Arène : ${CAMPAIGN_ERAS[selectedEraIndexSignal.value].reward.arenaName}`)
                                            })
                                        ]
                                    })
                                ]
                            })
                        ]
                    }),

                    // Sélecteur rapide de Héros
                    new UIKit.Container({
                        className: 'flex items-center justify-between bg-stone-950/80 p-2 rounded-xl border border-stone-700/80 mb-1',
                        children: [
                            new UIKit.Container({
                                className: 'flex items-center gap-2',
                                children: [
                                    new UIKit.Text({ tag: 'span', className: 'text-sm', text: '🦖' }),
                                    new UIKit.Container({
                                        className: 'flex flex-col text-left',
                                        children: [
                                            new UIKit.Text({ tag: 'span', className: 'text-[9px] font-chakra text-stone-400 font-bold uppercase', text: 'VOTRE COMBATTANT :' }),
                                            new UIKit.Text({
                                                tag: 'span',
                                                className: 'font-cinzel font-black text-xs text-amber-300 uppercase',
                                                text: UIKit.computed(() => {
                                                    const d = DINO_ROSTER[p1ChoiceIndex] || DINO_ROSTER[0];
                                                    return d ? d.name : 'T-REX';
                                                })
                                            })
                                        ]
                                    })
                                ]
                            }),
                            new UIKit.Button({
                                className: 'px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 border border-stone-500 text-[10px] font-chakra font-black text-amber-200 uppercase cursor-pointer',
                                text: 'CHANGER 🔁',
                                onClick: () => {
                                    cyclePlayerHero();
                                }
                            })
                        ]
                    })
                ]
            }),

            // Bouton Principal d'Action : Lancer le Niveau Smash
            new UIKit.Button({
                id: 'btnEnterPeriod',
                className: UIKit.computed(() => {
                    const era = CAMPAIGN_ERAS[selectedEraIndexSignal.value];
                    const unlocked = isEraUnlocked(era.id);
                    if (!unlocked) {
                        return 'w-full mt-3 py-2.5 px-4 rounded-xl bg-stone-800 text-stone-500 font-cinzel font-black text-xs sm:text-sm uppercase tracking-wider border-2 border-stone-700 cursor-not-allowed text-center opacity-60';
                    }
                    const cleared = isEraCleared(era.id);
                    return cleared
                        ? 'w-full mt-3 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-800 via-emerald-600 to-amber-600 hover:from-emerald-700 hover:to-amber-500 text-white font-cinzel font-black text-xs sm:text-sm uppercase tracking-wider border-2 border-amber-300 shadow-xl cursor-pointer text-center'
                        : 'w-full mt-3 py-2.5 px-4 rounded-xl bg-gradient-to-r from-red-800 via-red-600 to-amber-600 hover:from-red-700 hover:to-amber-500 text-white font-cinzel font-black text-xs sm:text-sm uppercase tracking-wider border-2 border-amber-300 shadow-xl cursor-pointer text-center animate-pulse';
                }),
                text: UIKit.computed(() => {
                    const era = CAMPAIGN_ERAS[selectedEraIndexSignal.value];
                    if (!isEraUnlocked(era.id)) return '🔒 TERMINER L\'ÈRE PRÉCÉDENTE';
                    if (isEraCleared(era.id)) return '⭐ REJOUER LE NIVEAU SMASH ➔';
                    return '⚔️ COMMENCER LE NIVEAU SMASH ➔';
                }),
                onClick: () => {
                    const era = CAMPAIGN_ERAS[selectedEraIndexSignal.value];
                    if (!isEraUnlocked(era.id)) {
                        sfx.playCooldownWarning();
                        if (typeof spawnFloatingPopup === 'function') {
                            spawnFloatingPopup(0, "🔒 Cette ère est verrouillée ! Triomphez d'abord de l'ère précédente.", '#ef4444');
                        }
                        return;
                    }
                    enterSelectedEra(era);
                }
            })
        ]
    });

    // 3. CARTE INTERACTIVE CENTRALE : PARCHEMIN DE PANGAEA & TIMELINE CONDUITS
    const mapContainer = new UIKit.Container({
        id: 'campaignParchmentMap',
        className: 'flex-1 h-full min-h-[420px] sm:min-h-[500px] parchment-map-bg p-3 relative rounded-2xl flex flex-col justify-between overflow-hidden shadow-2xl border-4 border-[#785838]',
        children: [
            // Arrière-plan cartographique Pangaea propre (sans texte d'ère pré-imprimé)
            new UIKit.Image({
                src: 'assets/mockups/campaign_parchment_clean.jpg',
                alt: 'World Map Background',
                className: 'absolute inset-0 w-full h-full object-cover filter contrast-105 brightness-95 pointer-events-none'
            }),
            new UIKit.Container({ className: 'parchment-texture-overlay' }),

            // Lignes SVG reliant les 6 Nœuds d'Ères
            new UIKit.Svg({
                className: 'absolute inset-0 w-full h-full pointer-events-none z-10',
                svg: `
                    <svg viewBox="0 0 1000 600" preserveAspectRatio="none" class="w-full h-full">
                        <!-- Ligne d'énergie de la Timeline reliant les 6 Ères -->
                        <path d="M200 400 L360 250 L520 370 L660 210 L780 350 L880 180" 
                              fill="none" stroke="#f59e0b" stroke-width="4" stroke-dasharray="10,8" opacity="0.85" filter="drop-shadow(0 0 8px #f59e0b)"/>
                        <circle cx="200" cy="400" r="8" fill="#14b8a6"/>
                        <circle cx="360" cy="250" r="8" fill="#f59e0b"/>
                        <circle cx="520" cy="370" r="8" fill="#22c55e"/>
                        <circle cx="660" cy="210" r="8" fill="#ef4444"/>
                        <circle cx="780" cy="350" r="8" fill="#38bdf8"/>
                        <circle cx="880" cy="180" r="8" fill="#c084fc"/>
                    </svg>
                `
            }),

            // Nœuds Interactifs des 6 Ères avec Logos Dédiés
            new UIKit.Container({
                id: 'periodNodesLayer',
                className: 'absolute inset-0 w-full h-full pointer-events-auto z-20',
                children: CAMPAIGN_ERAS.map((era, idx) => {
                    return new UIKit.Container({
                        id: `periodNode_${era.slug}`,
                        className: UIKit.computed(() => {
                            const isSelected = selectedEraIndexSignal.value === idx;
                            const unlocked = isEraUnlocked(era.id);
                            const cleared = isEraCleared(era.id);
                            let cls = 'period-timeline-node absolute p-2 rounded-2xl flex items-center gap-2.5 cursor-pointer shadow-2xl transition-all ';
                            if (isSelected) cls += 'active ring-4 ring-amber-400 scale-110 ';
                            if (!unlocked) cls += 'locked opacity-60 grayscale ';
                            if (cleared) cls += 'border-emerald-500 ';
                            return cls;
                        }),
                        style: {
                            left: `${era.mapX}%`,
                            top: `${era.mapY}%`,
                            transform: 'translate(-50%, -50%)'
                        },
                        onClick: () => {
                            selectedEraIndexSignal.value = idx;
                            sfx.playHit(false);
                        },
                        children: [
                            // Médaillon Logo de l'Ère
                            new UIKit.Container({
                                className: 'w-12 h-12 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2 border-amber-400/90 bg-stone-950 flex items-center justify-center shrink-0 shadow-lg relative',
                                children: [
                                    new UIKit.Image({
                                        src: era.logo,
                                        alt: era.name,
                                        className: 'w-full h-full object-contain filter contrast-125'
                                    }),
                                    // Badge Clé / Couronne
                                    new UIKit.Container({
                                        className: 'absolute top-0.5 right-0.5',
                                        children: [
                                            new UIKit.Text({
                                                tag: 'span',
                                                className: 'text-xs filter drop-shadow',
                                                text: UIKit.computed(() => {
                                                    if (isEraCleared(era.id)) return '👑';
                                                    if (!isEraUnlocked(era.id)) return '🔒';
                                                    return '⚔️';
                                                })
                                            })
                                        ]
                                    })
                                ]
                            }),
                            // Plaque d'information
                            new UIKit.Container({
                                className: 'hidden sm:flex flex-col text-left pr-2 bg-stone-950/80 px-2 py-1 rounded-lg border border-stone-700/80',
                                children: [
                                    new UIKit.Text({
                                        tag: 'span',
                                        className: 'font-cinzel font-black text-xs text-amber-200 uppercase leading-none whitespace-nowrap',
                                        text: era.name
                                    }),
                                    new UIKit.Text({
                                        tag: 'span',
                                        className: 'font-chakra text-[9px] font-bold text-amber-400/90 uppercase leading-none mt-1 whitespace-nowrap',
                                        text: era.periodYears
                                    }),
                                    new UIKit.Text({
                                        tag: 'span',
                                        className: 'font-chakra text-[8px] font-black text-stone-300 uppercase leading-none mt-1 whitespace-nowrap',
                                        text: `BOSS: ${era.waves[2].bossName}`
                                    })
                                ]
                            })
                        ]
                    });
                })
            })
        ]
    });

    // 4. CORPS PRINCIPAL DU LAYOUT (MAIN STAGE)
    const mainStage = new UIKit.Container({
        tag: 'main',
        className: 'w-full flex-1 flex flex-col lg:flex-row gap-4 items-stretch px-3 sm:px-6 my-auto relative z-10 min-h-0',
        children: [dossierTablet, mapContainer]
    });

    // 5. BARRE INFÉRIEURE : LÉGENDE DES CONTRÔLES & RETOUR
    const footer = new UIKit.Container({
        tag: 'footer',
        className: 'arena-bottom-slab w-full py-2.5 px-4 sm:px-8 flex flex-wrap items-center justify-between shrink-0 relative z-20',
        children: [
            new UIKit.Button({
                id: 'btnCampaignBackToMain',
                className: 'stone-btn px-4 py-1.5 rounded-lg text-xs font-black text-amber-200 flex items-center gap-1.5 font-chakra shadow cursor-pointer',
                text: '⬅ MENU PRINCIPAL',
                onClick: () => {
                    closeCampaignMap();
                    goToMainMenu();
                }
            }),
            new UIKit.Container({
                className: 'flex items-center gap-3 font-chakra text-xs text-stone-300 font-bold tracking-wider',
                children: [
                    new UIKit.Text({ tag: 'span', text: 'P1 [A/Entrée] COMMENCER NIVEAU', className: 'text-sky-400 font-black' }),
                    new UIKit.Text({ tag: 'span', text: '|', className: 'text-stone-500' }),
                    new UIKit.Text({ tag: 'span', text: '[B/Échap] RETOUR', className: 'text-red-400 font-black' }),
                    new UIKit.Text({ tag: 'span', text: '•', className: 'text-stone-600 hidden sm:inline' }),
                    new UIKit.Text({ tag: 'span', text: '(LS/Flèches) CHOISIR L\'ÈRE', className: 'text-amber-300 font-black hidden sm:inline' }),
                    new UIKit.Text({ tag: 'span', text: '•', className: 'text-stone-600 hidden sm:inline' }),
                    new UIKit.Text({ tag: 'span', text: '[H] CHANGER DE COMBATTANT', className: 'text-emerald-400 font-black hidden sm:inline' })
                ]
            }),
            new UIKit.Text({
                tag: 'div',
                className: 'text-[11px] font-chakra font-black text-amber-400 uppercase tracking-widest',
                text: 'MODE CAMPAGNE SMASH MELEE'
            })
        ]
    });

    campaignMapRoot = new UIKit.Fullscreen({
        id: 'campaignScreen',
        tag: 'section',
        className: 'hidden w-full h-full flex-1 flex flex-col justify-between arena-screen-bg select-none relative z-10 overflow-hidden',
        children: [
            new UIKit.Image({
                src: 'assets/mockups/main_menu_clean_bg.jpg',
                alt: 'Campaign Jungle Backdrop',
                className: 'absolute inset-0 w-full h-full object-cover filter brightness-[0.38] contrast-125 pointer-events-none z-0'
            }),
            header,
            mainStage,
            footer
        ]
    });

    campaignMapRoot.mount(document.getElementById('appMain'));
}

// 6. LOGIQUE DE NAVIGATION ET LANCEMENT DU NIVEAU
function openCampaignMap() {
    matchState = 'campaign_map';
    campaignMapVisibleSignal.value = true;
    document.getElementById('mainMenu').classList.add('hidden');
    document.getElementById('selectScreen').classList.add('hidden');
    document.getElementById('arenaScreen').classList.add('hidden');
    document.getElementById('battleScreen').classList.add('hidden');
    document.getElementById('battleScreen').classList.remove('flex');
    const pmm = document.getElementById('postMatchMenu');
    if (pmm) pmm.classList.add('hidden');
    const cs = document.getElementById('campaignScreen');
    if (cs) cs.classList.remove('hidden');

    // Mettre à jour l'index sélectionné sur la 1ère ère non terminée disponible
    for (let i = 0; i < CAMPAIGN_ERAS.length; i++) {
        if (!isEraCleared(CAMPAIGN_ERAS[i].id) && isEraUnlocked(CAMPAIGN_ERAS[i].id)) {
            selectedEraIndexSignal.value = i;
            break;
        }
    }
}

function closeCampaignMap() {
    campaignMapVisibleSignal.value = false;
    const cs = document.getElementById('campaignScreen');
    if (cs) cs.classList.add('hidden');
}

function enterSelectedEra(era) {
    sfx.playGong();
    closeCampaignMap();
    if (typeof startCampaignEraLevel === 'function') {
        startCampaignEraLevel(era);
    } else {
        // Secours
        gameMode = 'campaign';
        currentArena = era.arenaId;
        startMatch();
    }
}

function cyclePlayerHero() {
    // Naviguer uniquement parmi les combattants débloqués
    const unlocked = [];
    for (let i = 0; i < DINO_ROSTER.length; i++) {
        if (isFighterUnlocked(DINO_ROSTER[i].id)) {
            unlocked.push(i);
        }
    }
    if (unlocked.length === 0) return;
    const curIdx = unlocked.indexOf(p1ChoiceIndex);
    const nextIdx = (curIdx + 1) % unlocked.length;
    p1ChoiceIndex = unlocked[nextIdx];
    sfx.playHit(false);
    selectedEraIndexSignal.value = selectedEraIndexSignal.value; // Déclencher un rafraîchissement réactif
}

window.openCampaignMap = openCampaignMap;
window.closeCampaignMap = closeCampaignMap;
window.enterSelectedEra = enterSelectedEra;
window.cyclePlayerHero = cyclePlayerHero;

buildCampaignMapUIKit();
