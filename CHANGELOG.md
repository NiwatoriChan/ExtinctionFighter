# Changelog

All notable changes to **Extinction Kombat 3D** (*ExtinctionFighter*) are documented in this file.

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

