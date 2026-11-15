# 🦖 EXTINCTION KOMBAT 3D — *Jurassic Blood*

> **Jeu de combat 3D d'arcade préhistorique propulsé par Three.js et WebGL.**  
> Affrontez les prédateurs les plus redoutables de l'histoire de la Terre dans 8 arènes 3D dynamiques avec cinématiques X-Ray, fatalités viscérales et un mode Campagne immersif à travers les ères géologiques.

---

## 📸 Aperçu du Menu de Sélection des Combattants

![Menu de Sélection des Combattants](screenshots/character-select.png)

---

## 🌟 Points Forts du Jeu

* **🦖 16 Combattants Préhistoriques (3 de base + 13 Déblocables — v0.3.1)** :
  * **3 colosses disponibles dès le départ** (*T-Rex*, *Stégosaure*, *Quetzalcoatlus*).
  * **13 Combattants Déblocables en Campagne** à travers les ères géologiques : **Anomalocaris** (Ère 1), **Maiasaura** (Ère 2), **Ankylosaure** (Ère 3), **Spinosaure** (Ère 4), **Pulmonoscorpius** (Ère 5), **Pachyrhinosaure** (Ère 6), **Postosuchus** (Ère 7), **Apatosaure** (Ère 8), **Thérizinosaure** (Ère 9), **Oiseau de Terreur** (Ère 10), **Mégathérium** (Ère 11), **Smilodon** (Ère 12) et le dragon titanesque **Drak'Zul** (Ère 13, jouable une fois terrassé).
  * **Pipeline 3D Blender & PBR exclusif `.glb` (v0.3.1)** : Les 16 combattants (`assets/models/fighters/`), les 19 sbires de campagne (`assets/models/minions/`) et les 11 boss et objets de campagne (`assets/models/campaign/`) utilisent exclusivement des modèles 3D `.glb` sculptés sous Blender sans fallback procédural, avec textures PBR albedo/bump (`assets/textures/fighters/`), plans vectoriels SVG (`assets/svg/`) et signalement d'erreur bloquant en cas d'échec de chargement GLB.
* **🗺️ Nouveau Mode Campagne — *L'Odyssée des Ères*** :
  * **Carte du Monde Pangaea Interactive** : Une frise géologique complète reliant **13 Ères** (du Cambrien à l'Apogée de l'Extinction), chacune dotée de son propre blason et de dangers environnementaux dédiés.
  * **Niveaux d'Ère par Vagues (Style Beat'em up / Melee)** : Chaque ère est un niveau complet avec essaims d'ennemis de l'époque (Trilobites, Archosaures, Raptors de cendre, Loups du blizzard), plateformes aériennes 3D et geysers hydrothermaux servant de tremplins verticaux de projection.
  * **Boss Titans Colossaux** : À l'apogée de chaque ère, affrontez un titan colossal sur mesure doté d'une gigantesque barre de vie, d'attaques de zone dévastatrices (jets d'acide, foudre sismique, météores, stalagmites) et d'un mode *Enrage* déclenché sous la barre des 40% de PV !
  * **Système de Récompenses & Déblocages Permanents** : Chaque victoire d'ère débloque de nouveaux combattants et de nouvelles arènes thématiques (sauvegarde persistante en `localStorage`).
* **🌋 8 Arènes 3D Interactives** :
  * Décors immersifs Three.js avec météo dynamique, météores incandescents, foudre sismique, éruptions volcaniques, blizzards polaires et faune cambrienne sous-marine.
* **💀 Mécaniques Avancées de Kombat** :
  * Système de combos fluides (Léger ➔ Lourd ➔ Spécial), cancels de dash et recovery frames.
  * Jauge de Rage à accumulation progressive avec cinématique de scanner médical **X-Ray** brisant le squelette anatomique de l'adversaire (à 100% de rage).
  * Séquence *"Achevez-le !"* : exécution de Fatalités 3D viscérales et sanglantes propres à chaque combattant.
* **⚙️ Refonte Complète des Interfaces (UI Overhaul 2.0)** :
  * **Nouveau Menu des Paramètres (Settings)** : Stèle monolithique en pierre sculptée sur fond préhistorique thématique avec 4 onglets dédiés (*Vidéo*, *Audio*, *Gameplay*, *Contrôles*), curseurs en os sculpté avec crânes de raptors lumineux, sélecteur Plein Écran / Fenêtré, ajustement précis du mixage sonore (Master, SFX, Musique) et interrupteurs bascule pour le Gore/Sang, les secousses d'écran et les vibrations.
  * **Nouveau Menu Pause Cinématographique** : Plaque de titre sculptée en pierre néolithique, fond assombri avec particules de braises incandescentes flottantes, commandes rapides en match et prise en charge intégrale du clavier (<kbd>Échap</kbd> / <kbd>P</kbd>) et des manettes.
* **🎮 Modes de Jeu Polyvalents** :
  * **1 Joueur** : Campagne d'Extinction (L'Odyssée des Ères), Joueur vs IA (Facile, Normal, Difficile, Très Dur), et Mode Entraînement.
  * **2 Joueurs** : 1 vs 1 Local sur le même clavier ou à la manette USB/Bluetooth.

---

## 📸 Galerie d'Écrans

| Carte de Campagne (Road Through Time) | Niveau d'Ère : Vague 1 Minions |
| :---: | :---: |
| ![Carte de Campagne](screenshots/campaign_map_screenshot.png) | ![Niveau de Campagne Minions](screenshots/smash_wave1_minions.png) |

| Niveau d'Ère : Vague 3 Boss Colossal | Récompenses & Déblocages d'Ère |
| :---: | :---: |
| ![Niveau de Campagne Boss](screenshots/smash_wave3_boss.png) | ![Récompenses d'Ère](screenshots/smash_victory_rewards.png) |

| Nouveau Menu des Paramètres (Settings Overhaul) | Nouveau Menu Pause & Options Rapides |
| :---: | :---: |
| ![Paramètres](screenshots/settings_overhaul_screenshot.png) | ![Menu Pause](screenshots/pause_menu_screenshot.png) |

| Anomalocaris (Écran de Sélection) | Anomalocaris (Combat 3D) |
| :---: | :---: |
| ![Anomalocaris Sélection](screenshots/anomalocaris_select_screen.png) | ![Anomalocaris Combat](screenshots/anomalocaris_in_match.png) |

---

## 🆕 Notes de Patch — v0.3.1

* **Finalisation des 16 Combattants `.glb`** : Ajout des modèles sculptés sous Blender (`assets/models/fighters/`), cartes PBR 1024×1024 et plans SVG pour **T-Rex**, **Pachyrhinosaure** et **Quetzalcoatlus** (`build_batch5_apex.py`, `trex_sculptor.py`, `generate_trex_pbr_textures.py`) et ajustement des animations associées.
* **19 Sbires de Campagne `.glb`** : Sculpture et rigging de l'ensemble des 19 ennemis de vagues (`assets/models/minions/*.glb` via `tools/blender/build_minions_glb.py`) avec animations de pattes, bras, tête, ailes et lobes natatoires pilotées par `EraMinion3D`.
* **11 Boss & Objets de Campagne `.glb`** : Ajout de 6 boss uniques d'ères (`boss_cameroceras`, `boss_jaekelopterus`, `boss_dunkleosteus`, `boss_dimetrodon`, `boss_pyroclast`, `boss_wendigo`) et 5 pickups/dangers (`pickup_meat`, `pickup_amber`, `hazard_meteor`, `hazard_boulder`, `hazard_icicle`) dans `assets/models/campaign/*.glb` (`tools/blender/build_campaign_bosses_glb.py`), préchargés via `preloadAllCampaignGLBs()`.
* **Suppression des Anciens Modèles Procéduraux** : Retrait complet de l'ancien code de géométrie procédurale héritée pour les 16 combattants (`js/fighters/*.js`, `js/core/rig.js`, `js/core/animation.js`), ainsi que pour les sbires, pickups, dangers et le boss *Anomalocaris* (`js/core/campaign-level.js`), remplacés exclusivement par les 46 modèles Blender `.glb`.
* **Outillage & Lancement** : Extension de `tools/test_glb_models.js` à l'ensemble des 46 modèles `.glb` (combattants, sbires et campagne) et ajout du lanceur Windows `start.bat`.

---

## 🕹️ Commandes & Contrôles

Le jeu supporte le **clavier**, les **boutons tactiles arcade à l'écran**, et les **manettes de jeu (Gamepads)** USB / Bluetooth.

### Joueur 1 (Clavier)

| Action | Touche(s) Clavier |
| :--- | :--- |
| **Déplacement Gauche / Droite** | <kbd>Q</kbd> / <kbd>D</kbd> ou <kbd>A</kbd> / <kbd>D</kbd> (et <kbd>⬅</kbd> / <kbd>➡</kbd> en mode 1P) |
| **Visée Haute / Basse (Modificateur)** | Maintenir <kbd>Z</kbd> / <kbd>W</kbd> (Haut) ou <kbd>S</kbd> (Bas), ou <kbd>⬆</kbd> / <kbd>⬇</kbd> en 1P |
| **Saut** | <kbd>Espace</kbd> |
| **Garde / Parade** | <kbd>Shift Gauche</kbd> ou <kbd>S</kbd> |
| **Dash Rapide (Gauche / Droite)** | <kbd>E</kbd> (dans la direction) ou Double-pression (<kbd>A</kbd><kbd>A</kbd> / <kbd>Q</kbd><kbd>Q</kbd> / <kbd>D</kbd><kbd>D</kbd>) |
| **Attaque Directionnelle (Normale / Haute / Basse)** | <kbd>F</kbd> ou <kbd>J</kbd> (+ Haut/Bas pour varier la frappe) |
| **Attaque Spéciale** | <kbd>H</kbd> ou <kbd>L</kbd> |
| **X-Ray / Fatalité** | <kbd>R</kbd> (X-Ray à 100% de Rage / Fatalité lors de *"Achevez-le !"*) |
| **Pause / Menu Options en Match** | <kbd>Échap</kbd> (Escape) |

### Joueur 2 (1 vs 1 Local)

| Action | Touche(s) Clavier |
| :--- | :--- |
| **Déplacement Gauche / Droite** | <kbd>⬅</kbd> / <kbd>➡</kbd> |
| **Saut** | Pavé numérique <kbd>8</kbd> |
| **Garde** | Pavé numérique <kbd>5</kbd> ou <kbd>K</kbd> |
| **Dash Rapide** | Pavé numérique <kbd>6</kbd> ou Double-pression <kbd>⬅</kbd><kbd>⬅</kbd> / <kbd>➡</kbd><kbd>➡</kbd> |
| **Attaque** | Pavé numérique <kbd>1</kbd> ou <kbd>I</kbd> |
| **Attaque Spéciale** | Pavé numérique <kbd>2</kbd> ou <kbd>O</kbd> |
| **X-Ray / Fatalité** | Pavé numérique <kbd>0</kbd> ou <kbd>M</kbd> |

### Navigation dans le Menu Pause

| Action | Clavier | Manette (Gamepad) |
| :--- | :--- | :--- |
| **Naviguer entre les options** | Flèches <kbd>⬆</kbd> / <kbd>⬇</kbd> | Stick Gauche / Croix directionnelle <kbd>⬆</kbd> / <kbd>⬇</kbd> |
| **Sélectionner / Valider** | <kbd>Entrée</kbd> ou <kbd>Espace</kbd> | Bouton <kbd>A</kbd> (Xbox) / <kbd>✕</kbd> (PlayStation) |
| **Reprendre le combat** | <kbd>Échap</kbd> ou <kbd>P</kbd> | Bouton <kbd>Start</kbd> ou <kbd>B</kbd> / <kbd>◯</kbd> |

---

## 🦖 Roster des Combattants (16 Créatures)

| # | Combattant | Déblocage | Rôle | Attaques Spéciales | Fatalité 3D |
| :-: | :--- | :---: | :--- | :--- | :--- |
| 1 | **T-Rex** | De base | Apex Carnivore | Morsure Sismique • Rugissement Magma | *Dévoration Royale* |
| 2 | **Pachyrhinosaure** | Ère 6 | Bélier Blindé | Charge Boréale • Cornes Sismiques | *Impact Crânien Polaire* |
| 3 | **Ankylosaure** | Ère 3 | Forteresse Vivante | Marteau d'Os • Bouclier d'Écailles | *Brise-Fossile* |
| 4 | **Apatosaure** | Ère 8 | Titan Sismique | Écrasement Colossal • Coup de Fouet Caudal | *Onde d'Extinction* |
| 5 | **Maiasaura** | Ère 2 | Protectrice Féroce | Ruade Maternelle • Balayage Protecteur | *Furie du Nid* |
| 6 | **Oiseau de Terreur** | Ère 10 | Faucheur Véloce | Piqué Mortel • Griffes Tranchantes | *Assaut Aviaire* |
| 7 | **Postosuchus** | Ère 7 | Archosaurien Carnassier | Morsure Basse • Charge Reptilienne | *Déchirement des Marais* |
| 8 | **Spinosaure** | Ère 4 | Léviathan du Crétacé | Lame Dorsale • Geyser Aquatique | *Tranchant Abyssal* |
| 9 | **Thérizinosaure** | Ère 9 | Faucheuse Préhistorique | Faucilles Acérées • Valse Sanglante | *Moisson Funeste* |
| 10 | **Pulmonoscorpius** | Ère 5 | Scorpion Primordial | Dard Empoisonné • Étreinte Venimeuse | *Piqûre Neurotoxique* |
| 11 | **Stégosaure** | De base | Sentinelle à Plaques | Thagomizer • Balayage d'Épines | *Empalement Dorsal* |
| 12 | **Quetzalcoatlus** | De base | Monarque Céleste | Piqué Supersonique • Rafale de Tempête | *Chute Céleste* |
| 13 | **Mégathérium** | Ère 11 | Colosse Paresseux | Coup de Griffe Brutal • Écrasement Tellurique | *Pilonnage Géant* |
| 14 | **Anomalocaris** | Ère 1 | Super-Prédateur Radiodonte | Vortex Hydro-Sismique • Broyeur Raptorial | *Broyage Abyssal de Peytoia* |
| 15 | **Smilodon** | Ère 12 | Tigre à Dents de Sabre | Bond Prédateur • Morsure Mortelle | *Égorgement Fatal* |
| 16 | **Drak'Zul** | Ère 13 | Boss Suprême / Dragon Titan | Souffle Infernal • Cataclysme Éruptif | *Incinération Suprême* |

---

## 🏟️ Arènes 3D Disponibles (8 Décors)

1. **🌋 Cratère du Chicxulub** *(De base)* : Lave en fusion, météores incandescents et sol sismique instable.
2. **🏛️ Citadelle Céleste d'Os** *(De base)* : Arches thoraciques gigantesques de titanosaures et aurores astrales mystiques.
3. **🌊 Récif Abyssal du Cambrien** *(Déblocable — Ère 1)* : Fonds marins primordiaux aux coraux bioluminescents, plateformes rocheuses surélevées et geysers hydrothermaux.
4. **🍄 Abysse Fongique Toxique** *(Déblocable — Ère 2)* : Champignons géants bioluminescents et vapeurs d'acide primordial.
5. **⚡ Canyon de l'Orage Primordial** *(Déblocable — Ère 3)* : Colonnes basaltiques monumentales, pluie torrentielle et tempêtes d'éclairs foudroyants.
6. **🌿 Vallée d'Émeraude** *(Déblocable — Ère 5)* : Jungle luxuriante dense avec fougères colossales, cascades et canopée jurassique.
7. **❄️ Glacier de l'Ère Glaciaire** *(Déblocable — Ère 12)* : Blizzard de flocons en 3D, pics de glace cristallins, ossements et aurore boréale polaire.
8. **🐲 L'Antre de Drak'Zul** *(Déblocable — Ère 13)* : Caldera volcanique apocalyptique sous un ciel incandescent, arène ultime de l'Extinction.

---

## 📁 Architecture Modulaire du Code

Le jeu est découpé de manière modulaire (animations par combattant, modules d'arène indépendants, gestionnaires de menus et moteur de combat) :

```text
ExtinctionFighter/
├── index.html                 # Point d'entrée HTML5
├── start.sh                   # Lanceur serveur HTTP local sans cache Linux/macOS (WebGL & GLB)
├── start.bat                  # Lanceur serveur HTTP local sans cache Windows (WebGL & GLB)
├── README.md                  # Documentation complète du jeu
├── css/
│   └── style.css              # Styles arcade, animations CSS & thèmes de pierre
├── assets/                    # Ressources graphiques & 3D
│   ├── mockups/               # Décors de fond HD (menus, carte de campagne, settings)
│   ├── models/                # 46 modèles 3D GLB exportés depuis Blender
│   │   ├── fighters/          # 16 combattants (.glb)
│   │   ├── minions/           # 19 types d'ennemis de campagne (.glb)
│   │   └── campaign/          # 6 boss uniques d'ères & 5 pickups/dangers (.glb)
│   ├── portraits/             # Portraits haute résolution de chaque créature
│   ├── svg/                   # Plans anatomiques, emblèmes et textures vectorielles SVG
│   ├── textures/fighters/     # Cartes PBR albedo & bump 1024x1024 par espèce
│   └── ui/                    # Éléments d'interface sculptés (plaques, dalles de pierre, stèles)
├── screenshots/               # Captures d'écran et galerie visuelle
├── tools/                     # Pipeline Blender/SVG & suites de tests automatisés
│   ├── blender/               # Générateurs de modèles 3D .glb par batch sous Blender
│   ├── generate_species_svgs.py # Générateur SVG & textures PBR
│   ├── test_glb_models.js     # Vérification des modèles .glb et de leurs os
│   ├── test_coherence_overhaul.js # Tests unitaires moteur/UI/IA
│   ├── test_campaign_system.js # Validation des 13 ères de campagne
│   ├── play_campaign_levels.js # Simulation complète des niveaux de campagne
│   ├── test_pause_functionality.js # Tests du menu Pause
│   └── test_visual_overhaul.py # Tests visuels WebGL headless Firefox
└── js/
    ├── libs/                  # Bibliothèques 3D, UI & IA embarquées (zéro bundler)
    │   ├── three.min.js               # Moteur WebGL 3D Three.js
    │   ├── GLTFLoader.js              # Chargeur de modèles 3D .glb/.gltf
    │   ├── pmndrs-uikit.min.js        # Système UI 3D/Spatial & Flexbox réactif (@pmndrs/uikit + @preact/signals-core)
    │   ├── yuka.min.js                # Moteur IA Yuka (Steering, Vision, Memory, Flocking, SyncManager)
    │   ├── kompute-tactical.js        # Analyse spatiale tactique Kompute (Sweet-spot, esquive projectiles)
    │   ├── three-pathfinding.min.js   # Navigation Mesh 3D A* & simulateur de foule RVO
    │   ├── behaviortree.min.js        # Arbres de comportement BehaviorTree.js (Selector, Sequence, Action)
    │   └── xstate.umd.js              # Machines à états finis déterministes XState
    ├── core/                  # Moteur principal du jeu
    │   ├── registry.js        # Registre global des combattants, boss, arènes et déblocages
    │   ├── state.js           # Variables d'état, flags de progression et configuration
    │   ├── model-loader.js    # Préchargeur GLB, cache et hydratation des rigs Blender
    │   ├── rig.js             # Moteur de génération et hydratation des squelettes 3D articulés
    │   ├── animation.js       # Système cinématique et chargement des animations modulaires
    │   ├── scene.js           # Gestionnaire de scène 3D, caméra dynamique et rendu graphique
    │   ├── arena.js           # Constructeur d'arènes, décors 3D et extraction NavMesh
    │   ├── fighter.js         # Classe Fighter3D (physique, vélocité, PV, barres de rage)
    │   ├── combat.js          # Hitboxes, détection de collisions, guard break et combos
    │   ├── prototype-combat-system.js # Système de combat avancé et timing d'attaques
    │   ├── campaign-level.js  # Moteur du mode Campagne par vagues (minions, geysers, boss titans, drops)
    │   ├── effects.js         # Particules de sang, os, projectiles et scanner médical X-Ray
    │   ├── input.js           # Gestionnaire d'entrées clavier, boutons tactiles et manettes de jeu
    │   ├── sound.js           # Synthétiseur audio Web Audio API indépendant
    │   ├── match.js           # Gestion des rounds, arbitre, cinématiques d'introduction et de victoire
    │   ├── ai-navmesh.js      # Étape 1 IA : Génération NavMesh 3D & requêtes spatiales Kompute
    │   ├── ai-steering.js     # Étape 2 IA : Véhicules Yuka, Goal Evaluators & Flocking faune 3D
    │   ├── ai-statechart.js   # Étape 3a IA : Statecharts macro-stratégiques XState
    │   ├── ai-behaviortree.js # Étape 3b IA : Arbre tactique BehaviorTree.js (combos, mix-ups, punitions)
    │   └── ai.js              # Pipeline IA 4-Étapes & télémétrie en temps réel
    ├── animations/            # Modules d'animation indépendants par créature
    │   ├── common/            # Biophénomènes communs (attack_biomechanics, combat_reactions, rig_reset)
    │   ├── trex/              # Animations dédiées T-Rex (idle, walking, jumping, attacking, fatality)
    │   ├── quetzalcoatlus/    # Animations dédiées Quetzalcoatlus (vol, battements d'ailes, piqué)
    │   ├── smilodon/          # Animations dédiées Smilodon
    │   └── ...                # Dossier dédié pour chacun des 16 combattants
    ├── fighters/              # Implémentation modulaire et rigs anatomiques par créature
    │   ├── trex.js
    │   ├── pachyrhinosaurus.js
    │   ├── ankylosaurus.js
    │   ├── apatosaurus.js
    │   ├── maiasaura.js
    │   ├── terror-bird.js
    │   ├── postosuchus.js
    │   ├── spinosaurus.js
    │   ├── therizinosaurus.js
    │   ├── pulmonoscorpius.js
    │   ├── stegosaurus.js
    │   ├── quetzalcoatlus.js
    │   ├── megatherium.js
    │   ├── anomalocaris.js    # Super-prédateur cambrien déblocable
    │   ├── smilodon.js        # Tigre à dents de sabre déblocable
    │   └── dragon.js          # Boss Drak'Zul déblocable et jouable
    ├── arenas/                # Un fichier modulaire par arène 3D
    │   ├── cambrian.js        # Récif marin avec geysers hydrothermaux & plateformes
    │   ├── jungle.js          # Vallée d'Émeraude (jungle jurassique luxuriante)
    │   ├── volcano.js         # Cratère du Chicxulub
    │   ├── boneyard.js        # Citadelle Céleste d'Os
    │   ├── swamp.js           # Abysse Fongique Toxique
    │   ├── storm.js           # Canyon de l'Orage Primordial
    │   ├── ice-age.js         # Glacier de l'Ère Glaciaire
    │   └── dragon-lair.js     # L'Antre Infernale de Drak'Zul
    ├── menus/                 # Composants d'interface utilisateur (UI)
    │   ├── header.js          # Barre d'en-tête & Menu Pause complet en bas-relief sculpté
    │   ├── main-menu.js       # Écran d'accueil principal (1P Campagne / IA, 2P 1v1)
    │   ├── campaign-map.js    # Carte de Campagne interactive Pangaea à travers les 13 ères
    │   ├── select-screen.js   # Écran de sélection des combattants avec aperçus 3D tournants
    │   ├── arena-chooser.js   # Écran de choix d'arène avec vue 3D dynamique
    │   ├── settings-modal.js  # Stèle néolithique des réglages (Vidéo, Audio, Gameplay, Contrôles)
    │   ├── battle-screen.js   # HUD de match, jauges de vie sculptées et barres de Rage
    │   ├── post-match.js      # Écran de fin de match et attribution des récompenses
    │   └── moves-modal.js     # Grimoire interactif des coups spéciaux et fatalités
    └── main.js                # Boucle principale (requestAnimationFrame) et cycle de vie
```

---

## 🚀 Comment Lancer le Jeu

1. **Via le script lanceur inclus** *(recommandé pour le chargement des modèles 3D `.glb` sans cache)* :
   ```bash
   # Linux / macOS
   ./start.sh

   # Windows (ou double-clic sur start.bat)
   start.bat
   ```
   *(Options utiles : `--unlock-all` sur `start.sh` ou `start.bat` pour débloquer immédiatement les 16 combattants sur l'écran de sélection.)*

2. **Via un serveur local HTTP** :
   ```bash
   # Avec Python 3
   python3 -m http.server 8080

   # Avec Node.js (npx)
   npx serve .
   ```
   Rendez-vous ensuite sur `http://localhost:8080`.

3. **Directement en HTTP local uniquement pour les `.glb`** :
   Ouvrez le jeu via un serveur HTTP local (`./start.sh`, `start.bat`, `python3 -m http.server` ou `npx serve .`) afin que Three.js puisse charger l'ensemble des 46 modèles 3D `.glb` (CORS bloque le chargement de fichiers `.glb` en `file://`).

---

## 📜 Technologies Utilisées

* **Moteur 3D WebGL** : [Three.js](https://threejs.org/) (`three.min.js` + `GLTFLoader.js`)
* **Modélisation & Pipeline 3D** : Blender + Python (`tools/blender/` & `tools/generate_species_svgs.py`) pour la génération de textures PBR, plans SVG, rigging squelettique et export exclusif des 46 modèles `.glb` (`assets/models/fighters/`, `assets/models/minions/`, `assets/models/campaign/`)
* **Système UI & Composants Spatiaux** : [`@pmndrs/uikit`](https://pmndrs.github.io/uikit/) avec signaux réactifs `@preact/signals-core` et layout Flexbox Yoga-compatible
* **Pipeline d'Intelligence Artificielle en 4 Étapes** :
  * Étape 1 : **Three-Pathfinding** (`three-pathfinding`) et **Kompute Tactical** (analyse spatiale, sweet-spotting et esquive de projectiles)
  * Étape 2 : **Yuka** (`yuka`) (véhicules autonomes, goal evaluators et flocking)
  * Étape 3 : **XState** (`xstate`) (Statecharts macro-stratégiques déterministes) & **BehaviorTree.js** (arbres tactiques de combos et punitions)
  * Étape 4 : Télémétrie adaptative et exécution physique temps réel
* **Audio Dynamique** : Web Audio API (synthétiseur rétro-arcade natif sans fichiers externes lourds)
* **Code JavaScript Pur (ES6+)** : Architecture modulaire découplée sans bundler ni étape de compilation obligatoire.
