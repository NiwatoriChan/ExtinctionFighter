# 🦖 EXTINCTION KOMBAT 3D — *Jurassic Blood*

> **Jeu de combat 3D d'arcade préhistorique propulsé par Three.js et WebGL.**  
> Affrontez les prédateurs les plus redoutables de l'histoire de la Terre dans 8 arènes 3D dynamiques avec cinématiques X-Ray, fatalités viscérales et un mode Campagne immersif à travers les ères géologiques.

---

## 📸 Aperçu du Menu de Sélection des Combattants

![Menu de Sélection des Combattants](screenshots/character-select.png)

---

## 🌟 Points Forts du Jeu

* **🦖 16 Combattants Préhistoriques (13 Légendes + 3 Déblocables)** :
  * 13 colosses de base méticuleusement reconstitués selon les archives fossiles.
  * **3 Combattants Déblocables d'exception** : le redoutable **Smilodon** (Tigre à dents de sabre), le super-prédateur radiodonte **Anomalocaris** (Boss marin du Cambrien modélisé en haute fidélité), et le dragon titanesque **Drak'Zul** (Boss suprême Apex de l'Extinction, jouable une fois terrassé).
  * Rigs 3D articulés haute fidélité (nouveau modèle biomécanique pour le T-Rex, envergure aérienne pour le Quetzalcoatlus, appendices raptoriaux articulés pour l'Anomalocaris).
* **🗺️ Nouveau Mode Campagne — *L'Odyssée des Ères*** :
  * **Carte du Monde Pangaea Interactive** : Une carte géologique avec route temporelle reliant 6 Grandes Ères, chacune dotée de son propre blason sculpté et de sa propre identité visuelle.
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
  * **1 Joueur** : Campagne d'Extinction (L'Odyssée des Ères), Joueur vs IA (Novice, Normal, Brutal), et Mode Entraînement.
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

## 🕹️ Commandes & Contrôles

Le jeu supporte le **clavier**, les **boutons tactiles arcade à l'écran**, et les **manettes de jeu (Gamepads)** USB / Bluetooth.

### Joueur 1 (Clavier)

| Action | Touche(s) Clavier |
| :--- | :--- |
| **Déplacement Gauche / Droite** | <kbd>Q</kbd> / <kbd>D</kbd> ou <kbd>A</kbd> / <kbd>D</kbd> |
| **Saut** | <kbd>Z</kbd> ou <kbd>W</kbd> |
| **Garde / Accroupi** | <kbd>S</kbd> (réduit les dégâts reçus de 78%) |
| **Dash Rapide (Gauche / Droite)** | <kbd>E</kbd> (avec Gauche/Droite) ou Double-pression directionnelle (<kbd>A</kbd><kbd>A</kbd> / <kbd>D</kbd><kbd>D</kbd>) |
| **Attaque Légère** | <kbd>F</kbd> ou <kbd>J</kbd> |
| **Attaque Lourde** | <kbd>G</kbd> ou <kbd>K</kbd> |
| **Attaque Spéciale 1** | <kbd>H</kbd> ou <kbd>L</kbd> |
| **Attaque Spéciale 2 (Ultra)** | <kbd>T</kbd> ou <kbd>U</kbd> |
| **X-Ray / Fatalité** | <kbd>R</kbd> ou <kbd>Espace</kbd> (X-Ray à 100% de Rage / Fatalité immédiate lors de *"Achevez-le !"*) |
| **Pause / Menu Options en Match** | <kbd>Échap</kbd> (Escape) ou <kbd>P</kbd> |

### Joueur 2 (1 vs 1 Local)

| Action | Touche(s) Clavier |
| :--- | :--- |
| **Déplacement / Saut / Garde** | Flèches directionnelles <kbd>⬅</kbd> <kbd>⬆</kbd> <kbd>⬇</kbd> <kbd>➡</kbd> |
| **Dash Rapide (Gauche / Droite)** | Pavé numérique <kbd>6</kbd> (avec Flèches) ou Double-pression <kbd>⬅</kbd><kbd>⬅</kbd> / <kbd>➡</kbd><kbd>➡</kbd> |
| **Attaques (Léger / Lourd / Spéciaux)** | Pavé numérique <kbd>1</kbd>, <kbd>2</kbd>, <kbd>3</kbd>, <kbd>4</kbd> ou <kbd>I</kbd>, <kbd>O</kbd>, <kbd>P</kbd>, <kbd>[</kbd> |
| **X-Ray / Fatalité** | Pavé numérique <kbd>5</kbd> ou <kbd>Entrée</kbd> |

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
| 2 | **Pachyrhinosaure** | De base | Bélier Blindé | Charge Boréale • Cornes Sismiques | *Impact Crânien Polaire* |
| 3 | **Ankylosaure** | De base | Forteresse Vivante | Marteau d'Os • Bouclier d'Écailles | *Brise-Fossile* |
| 4 | **Apatosaure** | Ère 3 | Titan Sismique | Écrasement Colossal • Coup de Fouet Caudal | *Onde d'Extinction* |
| 5 | **Maiasaura** | De base | Protectrice Féroce | Ruade Maternelle • Balayage Protecteur | *Furie du Nid* |
| 6 | **Oiseau de Terreur** | De base | Faucheur Véloce | Piqué Mortel • Griffes Tranchantes | *Assaut Aviaire* |
| 7 | **Postosuchus** | Ère 2 | Archosaurien Carnassier | Morsure Basse • Charge Reptilienne | *Déchirement des Marais* |
| 8 | **Spinosaure** | De base | Léviathan du Crétacé | Lame Dorsale • Geyser Aquatique | *Tranchant Abyssal* |
| 9 | **Thérizinosaure** | Ère 4 | Faucheuse Préhistorique | Faucilles Acérées • Valse Sanglante | *Moisson Funeste* |
| 10 | **Pulmonoscorpius** | De base | Scorpion Primordial | Dard Empoisonné • Étreinte Venimeuse | *Piqûre Neurotoxique* |
| 11 | **Stégosaure** | De base | Sentinelle à Plaques | Thagomizer • Balayage d'Épines | *Empalement Dorsal* |
| 12 | **Quetzalcoatlus** | De base | Monarque Céleste | Piqué Supersonique • Rafale de Tempête | *Chute Céleste* |
| 13 | **Mégathérium** | De base | Colosse Paresseux | Coup de Griffe Brutal • Écrasement Tellurique | *Pilonnage Géant* |
| 14 | **Anomalocaris** | Ère 1 | Super-Prédateur Radiodonte | Vortex Hydro-Sismique • Broyeur Raptorial | *Broyage Abyssal de Peytoia* |
| 15 | **Smilodon** | Ère 5 | Tigre à Dents de Sabre | Bond Prédateur • Morsure Mortelle | *Égorgement Fatal* |
| 16 | **Drak'Zul** | Ère 6 | Boss Suprême / Dragon Titan | Souffle Infernal • Cataclysme Éruptif | *Incinération Suprême* |

---

## 🏟️ Arènes 3D Disponibles (8 Décors)

1. **🌊 Récif Abyssal du Cambrien** *(Ère 1 — Cambrien)* : Fonds marins primordiaux aux coraux bioluminescents, plateformes rocheuses surélevées et geysers hydrothermaux propulsant les combattants dans les airs.
2. **⚡ Canyon de l'Orage Primordial** *(Ère 2 — Trias)* : Colonnes basaltiques monumentales, pluie torrentielle et tempêtes d'éclairs foudroyants.
3. **🌿 Vallée d'Émeraude** *(Ère 3 — Jurassique)* : Jungle luxuriante dense avec fougères colossales, cascades et canopée préhistorique.
4. **🌋 Cratère du Chicxulub** *(Ère 4 — Crétacé)* : Lave en fusion, météores incandescents et sol sismique instable prêt à s'effondrer.
5. **❄️ Glacier de l'Ère Glaciaire** *(Ère 5 — Cénozoïque)* : Blizzard de flocons en 3D, pics de glace cristallins, ossements de mammouths et aurore boréale polaire.
6. **🐲 L'Antre Infernale de Drak'Zul** *(Ère 6 — Extinction Apex)* : Caldera volcanique apocalyptique sous un ciel incandescent, arène ultime de l'épreuve de survie.
7. **🏛️ Citadelle Céleste d'Os** : Arches thoraciques gigantesques de titanaures et aurores astrales mystiques.
8. **🍄 Abysse Fongique Toxique** : Champignons géants bioluminescents et vapeurs suffocantes d'acide primordial.

---

## 📁 Architecture Modulaire du Code

Le jeu est découpé de manière modulaire (animations par combattant, modules d'arène indépendants, gestionnaires de menus et moteur de combat) :

```text
ExtinctionFighter/
├── index.html                 # Point d'entrée HTML5
├── README.md                  # Documentation complète du jeu
├── css/
│   └── style.css              # Styles arcade, animations CSS & thèmes de pierre
├── assets/                    # Ressources graphiques & 3D
│   ├── mockups/               # Décors de fond HD (carte de campagne, settings)
│   ├── models/                # Modèles 3D GLTF / GLB (créatures cambriennes Blender)
│   ├── portraits/             # Portraits haute résolution de chaque créature
│   └── ui/                    # Éléments d'interface sculptés (plaques, dalles de pierre, stèles)
├── screenshots/               # Captures d'écran et galerie visuelle
└── js/
    ├── libs/                  # Bibliothèques 3D, UI & IA embarquées (zéro bundler)
    │   ├── three.min.js               # Moteur WebGL 3D Three.js
    │   ├── pmndrs-uikit.min.js        # Système UI 3D/Spatial & Flexbox réactif (@pmndrs/uikit + @preact/signals-core)
    │   ├── yuka.min.js                # Moteur IA Yuka (Steering, Vision, Memory, Flocking, SyncManager)
    │   ├── kompute-tactical.js        # Analyse spatiale tactique Kompute (Sweet-spot, esquive projectiles)
    │   ├── three-pathfinding.min.js   # Navigation Mesh 3D A* & simulateur de foule RVO
    │   ├── behaviortree.min.js        # Arbres de comportement BehaviorTree.js (Selector, Sequence, Action)
    │   └── xstate.umd.js              # Machines à états finis déterministes XState
    ├── core/                  # Moteur principal du jeu
    │   ├── registry.js        # Registre global des combattants, boss, arènes et déblocages
    │   ├── state.js           # Variables d'état, flags de progression et configuration
    │   ├── rig.js             # Moteur de génération des squelettes 3D articulés
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
    │   ├── campaign-map.js    # Carte de Campagne interactive Pangaea à travers les 6 ères
    │   ├── select-screen.js   # Écran de sélection des combattants avec aperçus 3D tournants
    │   ├── arena-chooser.js   # Écran de choix d'arène avec vue 3D dynamique
    │   ├── settings-modal.js  # Stèle néolithique des réglages (Vidéo, Audio, Gameplay, Contrôles)
    │   ├── battle-screen.js   # HUD de match, jauges de vie sculptées et barres de Rage
    │   ├── post-match.js      # Écran de fin de match et attribution des récompenses
    │   └── moves-modal.js     # Grimoire interactif des coups spéciaux et fatalités
    ├── tools/                 # Scripts Python / Blender pour génération de modèles 3D & tests
    └── main.js                # Boucle principale (requestAnimationFrame) et cycle de vie
```

---

## 🚀 Comment Lancer le Jeu

1. **Directement dans le navigateur** :
   Ouvrez simplement le fichier `index.html` dans n'importe quel navigateur moderne (Firefox, Chrome, Edge, Safari).

2. **Via un serveur local HTTP** (recommandé pour le chargement des textures et modèles 3D GLTF) :
   ```bash
   # Avec Python 3
   python3 -m http.server 8080

   # Avec Node.js (npx)
   npx serve .
   ```
   Rendez-vous ensuite sur `http://localhost:8080`.

---

## 📜 Technologies Utilisées

* **Moteur 3D WebGL** : [Three.js](https://threejs.org/)
* **Modélisation & Pipeline 3D** : Blender + Python pour la modélisation squelettique et export GLTF / GLB (`assets/models/cambrian_creatures_blender.glb`)
* **Système UI & Composants Spatiaux** : [`@pmndrs/uikit`](https://pmndrs.github.io/uikit/) avec signaux réactifs `@preact/signals-core` et layout Flexbox Yoga-compatible
* **Pipeline d'Intelligence Artificielle en 4 Étapes** :
  * Étape 1 : **Three-Pathfinding** (`three-pathfinding`) et **Kompute Tactical** (analyse spatiale, sweet-spotting et esquive de projectiles)
  * Étape 2 : **Yuka** (`yuka`) (véhicules autonomes, goal evaluators et flocking)
  * Étape 3 : **XState** (`xstate`) (Statecharts macro-stratégiques déterministes) & **BehaviorTree.js** (arbres tactiques de combos et punitions)
  * Étape 4 : Télémétrie adaptative et exécution physique temps réel
* **Audio Dynamique** : Web Audio API (synthétiseur rétro-arcade natif sans fichiers externes lourds)
* **Code JavaScript Pur (ES6+)** : Architecture modulaire découplée sans bundler ni étape de compilation obligatoire.
