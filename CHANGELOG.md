# Changelog

All notable changes to **Extinction Kombat 3D** (*ExtinctionFighter*) are documented in this file.

## [v0.4.0] - 2026-11-22

### Added
- **Real Super Attack System (`js/core/super-attack.js`)**: Full 21-fighter Super Attack engine featuring 0.36s Super Flash, startup rush/sweep, whiff/block/perfect-parry resolution, 15 species-authentic 3-beat cinematic rushes and 6 multi-pulse AoE/Beam/Dive supers, campaign minion wave sweeping, Extinction Finish on lethal final-round supers, and Slow-Mo KO presentation (`koSlowMoTimer`, `battleTimeScale`).
- **Complete Combat & Game Feel Overhaul**: Added directional attacks (`up_light`, `low_light`, `fwd_heavy`, `low_heavy`, `anti_air`, `air_light`, `air_heavy`, `dash_attack`), throw (`G` / `U` with tech window and whiff recovery), Perfect Parry (`isParrying` with freeze, spark burst, and +18 Rage), juggle gravity scaling, wall-bounce, hitstop (`hitstopTimer`), camera recoil/FOV kick (`camRecoilX`, `camRecoilY`, `camFovKick`), procedural hit/super audio (`js/core/sound.js`), and callout banners (`js/menus/battle-screen.js`, `css/style.css`).
- **Apatosaurus Sculpt & PBR Overhaul**: Rebuilt `assets/models/fighters/apato.glb` with a dedicated Blender sculptor (`tools/blender/apato_sculptor.py`) and PBR texture generator (`tools/blender/generate_apato_pbr_textures.py`) producing dedicated albedo, normal, and bump maps (`apato_*.png`) for body, cranium, cervical spines, teeth, claws, and iris.
- **Megatherium (Giant Sloth) Sculpt & PBR Overhaul**: Rebuilt `assets/models/fighters/giantsloth.glb` with a dedicated Blender sculptor (`tools/blender/giantsloth_sculptor.py`) and PBR texture generator (`tools/blender/generate_giantsloth_pbr_textures.py`) producing dedicated albedo, normal, and bump maps (`giantsloth_*.png`) for shaggy fur, cranium, nose, mucosa, teeth, sickle claws, and iris.
- **Modular Campaign Minion Files (`js/minions/*.js`)**: Separated all 19 campaign minion definitions into individual species files under `js/minions/` (`cambrian-trilobite.js`, `opabinia-radiodont-elite.js`, `orthoceras.js`, `eurypterid.js`, `jawless-fish.js`, `shark-placoderm.js`, `bothriolepis.js`, `meganeura.js`, `arthropleura.js`, `synapsid.js`, `scutosaurus.js`, `raptor.js`, `triassic-hound.js`, `dino-tank.js`, `magma-ceratopsian.js`, `mammal.js`, `serpent.js`, `bird-pterosaur.js`, `glacier-panther.js`), registered via `registerCampaignMinion()` in `js/core/registry.js` and hydrated by `EraMinion3D` (`js/core/campaign-level.js`).

### Changed
- **Separated Paleozoic Fighter Files (`js/fighters/*.js`)**: Split `js/fighters/paleozoic-titans.js` into 4 individual fighter files (`js/fighters/cameroceras.js`, `js/fighters/jaekelopterus.js`, `js/fighters/dunkleosteus.js`, and `js/fighters/dimetrodon.js`) and updated `index.html` so all 21 fighters follow a strict one-file-per-fighter structure.
- **Ankylosaurus V2 Sculpt & PBR Refinement**: Upgraded `tools/blender/ankylo_sculptor.py` and `tools/blender/generate_ankylo_pbr_textures.py` (`assets/models/fighters/ankylo.glb`, `ankylo_club_albedo.png`, `ankylo_club_normal.png`, and refined osteoderm/tail-club geometry).
- **Tests & Versioning**: Added `tools/test_game_feel_and_super.js`, updated `tools/test_coherence_overhaul.js`, `tools/test_campaign_system.js`, `tools/play_campaign_levels.js`, and bumped `GAME_VERSION` to `v0.4.0`.

### Removed
- Removed legacy `js/fighters/paleozoic-titans.js` combined file (replaced by individual Paleozoic fighter modules).
- Removed legacy X-Ray (`xrayCinematicTimer`, `triggerXRayMove`) and `finish_him` state machine paths in favor of the unified Super Attack & Extinction Finish lifecycle.

## [v0.3.5] - 2026-11-18

### Added
- **Playable Gorgonopsia (*Inostrancevia latifrons*)**: Added `js/fighters/gorgonopsia.js` (loaded in `index.html`), sculpted in Blender (`tools/blender/gorgonopsia_sculptor.py`, `tools/blender/generate_gorgonopsia_pbr_textures.py` → `assets/models/fighters/gorgonopsia.glb` + PBR maps `gorgonopsia_*.png`), with portrait (`assets/portraits/gorgonopsia.png`) and SVG icons (`assets/svg/emblems/gorgonopsia.svg`, `assets/svg/species/gorgonopsia.svg`), registered in `js/core/registry.js`, `js/core/model-loader.js`, and `js/menus/select-screen.js` (21-fighter 7×3 roster grid).
- **Pangaea Red Desert Arena (`desert`)**: Added `js/arenas/desert.js` and integrated it into `js/menus/arena-chooser.js`, `js/campaign/era-06-permian.js`, `js/campaign/era-07-triassic.js`, and `FIGHTER_THEMED_ARENAS` (`js/core/registry.js`).
- **Campaign Demi-Boss Progression**: Added multi-wave Demi-Boss support (amber Demi-Boss vs. crimson Boss health bar, mid-stage Demi-Boss healing/unlock, and dual champion rewards) across `js/core/campaign-level.js`, `js/core/match.js`, `js/menus/campaign-map.js`, and `js/campaign/era-06-permian.js` (4-wave Permian campaign with Dimetrodon Demi-Boss and Gorgonopsia Boss).

### Changed
- **Stegosaurus Sculpt & PBR Overhaul**: Rebuilt `assets/models/fighters/stegosaurus.glb` using a dedicated Blender sculptor (`tools/blender/stegosaurus_sculptor.py`) and PBR texture generator (`tools/blender/generate_stegosaurus_pbr_textures.py`) with dedicated albedo, normal, and bump maps (`stegosaurus_*.png`) for body, beak, cranium, iris, plates, and thagomizer spikes. Removed the legacy `stegosaurus` builder from `tools/blender/build_batch1_herbivores.py`.
- **Smilodon Sculpt & PBR Overhaul**: Rebuilt `assets/models/fighters/smilodon.glb` using a dedicated Blender sculptor (`tools/blender/smilodon_sculptor.py`) and PBR texture generator (`tools/blender/generate_smilodon_pbr_textures.py`) with dedicated albedo, normal, and bump maps (`smilodon_*.png`), and updated `tools/blender/build_batch4_beasts.py` for both `smilodon` and `gorgonopsia`.
- **Paleozoic Titan Portraits**: Updated portraits for `cameroceras.png`, `dimetrodon.png`, `dunkleosteus.png`, and `jaekelopterus.png` in `assets/portraits/`.
- **Tests & Versioning**: Updated `tools/test_glb_models.js` (47 GLB models), `tools/test_campaign_system.js`, `tools/play_campaign_levels.js`, `tools/test_coherence_overhaul.js`, `README.md`, and bumped `GAME_VERSION` to `v0.3.5` across `js/core/state.js` and menus.

## [v0.3.4] - 2026-11-15

### Added
- **Playable Paleozoic Titans (Eras 2, 3, 4 & 6)**: Added `js/fighters/paleozoic-titans.js` (loaded in `index.html`) introducing **Cameroceras**, **Jaekelopterus**, **Dunkleosteus**, and **Dimetrodon** as full playable roster fighters backed by preloaded boss `.glb` rigs (`js/core/model-loader.js`), shared `animBaseId` rig animations (`js/core/animation.js`, `js/core/registry.js`), portraits (`assets/portraits/`), and SVG emblems/species icons (`assets/svg/emblems/`, `assets/svg/species/`).
- **Ankylosaurus Sculpt & PBR Overhaul**: Rebuilt `assets/models/fighters/ankylo.glb` using a dedicated Blender sculptor (`tools/blender/ankylo_sculptor.py`) and PBR texture generator (`tools/blender/generate_ankylo_pbr_textures.py`) with dedicated albedo, normal, and bump maps (`ankylo_*.png`) for body, beak, cranium, horn, iris, and scutes. Removed the legacy `ankylo` builder from `tools/blender/build_batch1_herbivores.py`.
- **Campaign Progression, Stars & Modals**: Added star ratings (`getEraStars`), high scores (`getEraHighScore`, `saveEraPerformance`), Phase 2 boss behavior (`updateCampaignBossPhase2Behavior`), and victory/game-over modals (`showEraVictoryRewardsModal`, `showCampaignGameOverModal`) in `js/core/campaign-level.js`.

### Changed
- **Campaign Era Balancing & Rewards**: Updated campaign eras (`js/campaign/era-02-ordovician.js` – `era-13-extinction.js`), unlock mappings (`UNLOCKABLE_FIGHTER_ERAS`, `UNLOCKABLE_ARENA_ERAS` in `js/core/registry.js`), and `js/menus/campaign-map.js` to display star counts, high scores, and wave species composition.
- **Character Select Roster**: Updated `js/menus/select-screen.js` with Paleozoic titan SVG emblems and the 20-slot roster layout (removing placeholder secret slots and placing Drak'Zul at slot 20).
- **Tests & Versioning**: Updated `tools/test_campaign_system.js`, `tools/play_campaign_levels.js`, `tools/test_coherence_overhaul.js`, `README.md`, and bumped `GAME_VERSION` to `v0.3.4` across `js/core/state.js` and menus.

## [v0.3.3] - 2026-11-15

### Changed
- **Quetzalcoatlus Sculpt, Rig & PBR Overhaul**: Rebuilt `assets/models/fighters/quetzal.glb` using a dedicated Blender sculptor (`tools/blender/quetzal_sculptor.py`) and PBR texture generator (`tools/blender/generate_quetzal_pbr_textures.py`) with a quadrupedal terrestrial azhdarchid stance, toothless spear beak, recessed nasoantorbital fenestra, cerulean sagittal crest, and dedicated albedo/normal/bump maps (`quetzal_*.png`). Removed the legacy `quetzal` builder from `tools/blender/build_batch5_apex.py`.
- **Quetzalcoatlus Animations**: Updated `js/animations/quetzalcoatlus/` (`quetzalcoatlus_idle.js`, `quetzalcoatlus_walking.js`, `quetzalcoatlus_jumping.js`, `quetzalcoatlus_attacking.js`) for quadrupedal ground movement and full wing-unfolding during aerial and dash moves.
- **Portraits & UI**: Regenerated all 16 fighter portraits in `assets/portraits/`, updated `screenshots/character-select.png`, and bumped `GAME_VERSION` to `v0.3.3` across `js/core/state.js`, menus, `README.md`, and `tools/test_coherence_overhaul.js`.

## [v0.3.2] - 2026-11-15

### Changed
- **Pachyrhinosaurus Sculpt & PBR Overhaul**: Rebuilt `assets/models/fighters/pachyrhino.glb` using a dedicated Blender sculptor (`tools/blender/pachyrhino_sculptor.py`) and high-resolution PBR texture generator (`tools/blender/generate_pachyrhino_pbr_textures.py`) with dedicated albedo, bump, and normal maps for body, cranium, horn, ocellus, iris, and boss meshes.
- **Apex Batch Cleanup**: Removed the legacy `pachyrhino` builder from `tools/blender/build_batch5_apex.py`.
- **UI & Branding**: Updated `assets/ui/primal_clash_logo.png` and bumped `GAME_VERSION` to `v0.3.2` across `js/core/state.js`, menus, and `tools/test_coherence_overhaul.js`.
- **Documentation & Screenshots**: Replaced all screenshots in `screenshots/` with fresh `v0.3.2` captures, added `CHANGELOG.md`, and streamlined `README.md` to essential information.

## [v0.3.1] - 2026-11-15

### Added
- **Complete 46-Model Blender `.glb` Pipeline**:
  - Finalized the 16 fighter `.glb` models (`trex.glb`, `pachyrhino.glb`, `quetzal.glb` via `build_batch5_apex.py`, `trex_sculptor.py`, and `generate_trex_pbr_textures.py`).
  - Added 19 rigged campaign minion `.glb` models in `assets/models/minions/` (`tools/blender/build_minions_glb.py`).
  - Added 6 unique era boss `.glb` models and 5 pickup/hazard `.glb` props in `assets/models/campaign/` (`tools/blender/build_campaign_bosses_glb.py`).
- **Tooling & Launchers**: Extended `tools/test_glb_models.js` to verify all 46 `.glb` models and added the Windows `start.bat` no-cache HTTP launcher.

### Removed
- Removed all legacy procedural 3D geometry fallbacks from `js/fighters/*.js`, `js/core/rig.js`, `js/core/animation.js`, and `js/core/campaign-level.js`.

## [v0.3.0] - 2026-11-13

### Changed
- Migrated fighter models to Blender `.glb` assets with PBR textures and SVG blueprints (`assets/svg/`).
- Rebalanced AI into 4 difficulty tiers (`easy`, `normal`, `hard`, `very_hard`) across `js/core/ai.js`, `js/core/ai-steering.js`, `js/core/ai-behaviortree.js`, and `js/menus/settings-modal.js`.
- Polished campaign progression and removed legacy assets.

## [v0.2.1] - 2026-11-12

### Changed
- Wired audio, gore, screen-shake, and display settings end-to-end across `SoundEngine`, `Effects`, and `SettingsModal`.
- Cleaned up battle lifecycle (`teardownActiveBattle`) and pause-safe X-Ray timing.
- Split campaign era definitions into modular files (`js/campaign/era-01-cambrian.js` – `era-13-extinction.js`) and added `tools/test_coherence_overhaul.js`.

## [v0.2.0] - 2026-11-07

### Changed
- **UI Overhaul 2.0**: Redesigned Settings modal (4-tab stone monolith), cinematic Pause menu, Character Select, and Campaign Map.
- Improved fighter models (including T-Rex and Terror Bird leg fixes) and AI behavior.

## [v0.1.0] - 2026-11-01

### Added
- Modularized Three.js / WebGL 3D fighting game architecture (`js/core/`, `js/fighters/`, `js/arenas/`, `js/menus/`, `js/animations/`).
- 16 prehistoric fighters (3 unlocked by default + 13 campaign unlockables including Dragon Boss Drak'Zul).
- 8 dynamic 3D arenas, X-Ray finishers, 3D Fatalities, local 1P/2P support, and 13-era Campaign Mode.

