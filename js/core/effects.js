// ============================================================================
// SYSTÈME D'EFFETS VISUELS 3D OPTIMISÉ (CACHE DE GÉOMÉTRIES & MATÉRIAUX PARTAGÉS)
// Évite les allocations WebGL/BufferGeometry à chaque frame et plafonne le nombre
// de particules actives simultanées pour garantir 60 FPS constants.
// ============================================================================

const MAX_PARTICLES_3D = 85;
let _fxCache = null;

function getFxCache() {
    if (_fxCache) return _fxCache;
    _fxCache = {
        geo: {
            blood: new THREE.BoxGeometry(0.22, 0.22, 0.22),
            bone: new THREE.BoxGeometry(0.18, 0.42, 0.18),
            spark: new THREE.BoxGeometry(0.14, 0.14, 0.14),
            streak: new THREE.BoxGeometry(2.1, 0.07, 0.07),
            fatigueDrop: new THREE.SphereGeometry(0.11, 6, 6),
            rock: new THREE.DodecahedronGeometry(0.20, 0),
            shockwaveRing: new THREE.TorusGeometry(0.85, 0.11, 8, 24),
            arcLight: new THREE.TorusGeometry(1.35, 0.08, 8, 18, Math.PI * 0.78),
            arcHeavy: new THREE.TorusGeometry(1.95, 0.13, 8, 18, Math.PI * 1.25),
            arcHigh: new THREE.TorusGeometry(1.45, 0.10, 8, 18, Math.PI * 0.85),
            arcLauncher: new THREE.TorusGeometry(1.85, 0.14, 8, 18, Math.PI * 0.85),
            sweepLow: new THREE.TorusGeometry(1.65, 0.09, 8, 18, Math.PI * 0.95),
            sweepHeavyLow: new THREE.TorusGeometry(2.15, 0.14, 8, 18, Math.PI * 0.95),
            thrustLight: new THREE.ConeGeometry(0.58, 2.1, 8, 1, true),
            thrustHeavy: new THREE.ConeGeometry(0.95, 2.8, 8, 1, true),
            diveCone: new THREE.ConeGeometry(0.68, 2.3, 8),
            throwJaw: new THREE.TorusGeometry(1.15, 0.09, 6, 12, Math.PI * 0.65),
            shieldHex: new THREE.RingGeometry(0.35, 1.35, 6),
            hitBurstLight: new THREE.RingGeometry(0.25, 0.95, 8),
            hitBurstHeavy: new THREE.RingGeometry(0.25, 1.45, 8),
            projSonic: new THREE.TorusGeometry(0.65, 0.12, 8, 18),
            projVenom: new THREE.SphereGeometry(0.48, 8, 8),
            projFeather: new THREE.ConeGeometry(0.25, 1.2, 4),
            projFire: new THREE.SphereGeometry(0.68, 10, 10),
            projBoulder: new THREE.DodecahedronGeometry(0.55, 1)
        },
        mat: {
            bloodBright: new THREE.MeshLambertMaterial({ color: 0xdc2626 }),
            bloodDark: new THREE.MeshLambertMaterial({ color: 0x7f1d1d }),
            bone: new THREE.MeshLambertMaterial({ color: 0xfef3c7 }),
            rockGrey: new THREE.MeshLambertMaterial({ color: 0x78716c }),
            rockAmber: new THREE.MeshLambertMaterial({ color: 0xf59e0b }),
            fatigue: new THREE.MeshBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.72 }),
            sparkCyan: new THREE.MeshBasicMaterial({ color: 0x38bdf8 }),
            sparkGold: new THREE.MeshBasicMaterial({ color: 0xfbbf24 }),
            sparkEmerald: new THREE.MeshBasicMaterial({ color: 0x10b981 }),
            projSonic: new THREE.MeshBasicMaterial({ color: 0xf472b6 }),
            projVenom: new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x16a34a, emissiveIntensity: 0.8 }),
            projFeather: new THREE.MeshBasicMaterial({ color: 0x38bdf8 }),
            projFire: new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xf97316, emissiveIntensity: 1.2 })
        }
    };
    return _fxCache;
}

function pushParticle3D(pt) {
    if (particles3D.length >= MAX_PARTICLES_3D) {
        const oldest = particles3D.shift();
        if (oldest && oldest.mesh) {
            if (typeof fxGroup !== 'undefined' && fxGroup) fxGroup.remove(oldest.mesh);
            if (oldest.ownsMaterial && oldest.mesh.material) oldest.mesh.material.dispose();
        }
    }
    particles3D.push(pt);
}

function spawn3DBloodAndBones(x, y, count = 16, includeBones = false) {
    if (typeof fxGroup === 'undefined' || !fxGroup) return;
    const goreEnabled = (typeof window === 'undefined' || window.goreAndBloodEnabled !== false);
    const cache = getFxCache();
    // Adapter automatiquement le nombre de particules selon la qualité graphique
    const qualityMult = (typeof graphicsQuality !== 'undefined' && graphicsQuality === 'low')
        ? 0.45
        : ((typeof graphicsQuality !== 'undefined' && graphicsQuality === 'medium') ? 0.7 : 1.0);
    const cappedCount = Math.min(36, Math.max(3, Math.round(count * qualityMult)));

    for (let i = 0; i < cappedCount; i++) {
        let geo, mat;
        if (goreEnabled) {
            const isBone = includeBones && i % 4 === 0;
            geo = isBone ? cache.geo.bone : cache.geo.blood;
            mat = isBone ? cache.mat.bone : (i % 3 === 0 ? cache.mat.bloodDark : cache.mat.bloodBright);
        } else {
            // Mode sans gore : étincelles d'impact et éclats minéraux
            geo = i % 2 === 0 ? cache.geo.spark : cache.geo.rock;
            mat = i % 2 === 0 ? cache.mat.sparkGold : cache.mat.rockGrey;
        }
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, (Math.random() - 0.5) * 1.2);
        fxGroup.add(mesh);

        const angle = Math.random() * Math.PI * 2;
        const spd = 2.5 + Math.random() * 8.5;
        pushParticle3D({
            mesh,
            vx: Math.cos(angle) * spd,
            vy: Math.abs(Math.sin(angle)) * spd + 3.5,
            vz: (Math.random() - 0.5) * 4,
            life: 0.75 + Math.random() * 0.4
        });
    }
}

// --- ONDE DE CHOC 3D AU SOL (BALAYAGES LOURDS, SÉISMES, CHUTES KNOCKDOWN) ---
function spawn3DGroundShockwave(x, colorHex = 0xf59e0b, maxScale = 3.2, includeDebris = true, surfaceY = null) {
    if (typeof fxGroup === 'undefined' || !fxGroup) return;
    const cache = getFxCache();
    const baseGroundY = (surfaceY !== null && surfaceY !== undefined)
        ? surfaceY
        : (typeof getArenaGroundHeight === 'function' ? getArenaGroundHeight(currentArena, x, 0) : 0);

    const ringMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: 0.88
    });
    const ringMesh = new THREE.Mesh(cache.geo.shockwaveRing, ringMat);
    ringMesh.position.set(x, baseGroundY + 0.14, 0);
    ringMesh.rotation.x = Math.PI / 2;
    fxGroup.add(ringMesh);

    const totalLife = 0.36;
    pushParticle3D({
        mesh: ringMesh,
        ownsMaterial: true,
        vx: 0,
        vy: 0,
        vz: 0,
        life: totalLife,
        initialLife: totalLife,
        noGravity: true,
        onUpdate(pt) {
            const p = 1 - (pt.life / pt.initialLife);
            const s = 0.4 + p * maxScale;
            pt.mesh.scale.set(s, s, 1 + p * 0.5);
            pt.mesh.material.opacity = Math.max(0, (1 - p) * 0.88);
        }
    });

    if (includeDebris) {
        const debrisCount = (typeof graphicsQuality !== 'undefined' && graphicsQuality === 'low') ? 4 : 7;
        for (let i = 0; i < debrisCount; i++) {
            const rock = new THREE.Mesh(cache.geo.rock, i % 2 === 0 ? cache.mat.rockGrey : cache.mat.rockAmber);
            const ang = (i / debrisCount) * Math.PI * 2;
            rock.position.set(x + Math.cos(ang) * 0.8, baseGroundY + 0.2, Math.sin(ang) * 0.8);
            fxGroup.add(rock);
            pushParticle3D({
                mesh: rock,
                vx: Math.cos(ang) * (3.5 + Math.random() * 4.0),
                vy: 4.0 + Math.random() * 4.0,
                vz: Math.sin(ang) * (2.5 + Math.random() * 2.5),
                life: 0.42 + Math.random() * 0.2
            });
        }
    }
}

// --- LIGNES DE VITESSE AÉRODYNAMIQUES 3D (ATTAQUES EN SPRINT / MOMENTUM BOOST) ---
function spawn3DMomentumTrail(fighter) {
    if (typeof fxGroup === 'undefined' || !fxGroup || !fighter) return;
    const cache = getFxCache();
    const moveDir = fighter.dashDir !== undefined && fighter.dashDir !== 0
        ? fighter.dashDir
        : (Math.sign(fighter.vx) !== 0 ? Math.sign(fighter.vx) : (fighter.facing || 1));
    const color = (fighter.dino && fighter.dino.accentColor) ? fighter.dino.accentColor : 0x38bdf8;
    const count = (typeof graphicsQuality !== 'undefined' && graphicsQuality === 'low') ? 3 : 5;

    for (let i = 0; i < count; i++) {
        const streakMat = new THREE.MeshBasicMaterial({
            color: i % 2 === 0 ? 0x38bdf8 : color,
            transparent: true,
            opacity: 0.82
        });
        const streak = new THREE.Mesh(cache.geo.streak, streakMat);
        streak.position.set(
            fighter.x - moveDir * (0.4 + Math.random() * 1.1),
            fighter.y + 0.85 + i * 0.42,
            (i % 2 === 0 ? 1 : -1) * (0.55 + Math.random() * 0.35)
        );
        fxGroup.add(streak);

        const totalLife = 0.22;
        pushParticle3D({
            mesh: streak,
            ownsMaterial: true,
            vx: -moveDir * (8.5 + Math.random() * 4.0),
            vy: 0,
            vz: 0,
            life: totalLife,
            initialLife: totalLife,
            noGravity: true,
            onUpdate(pt) {
                const ratio = Math.max(0, pt.life / pt.initialLife);
                pt.mesh.material.opacity = ratio * 0.82;
                pt.mesh.scale.x = 0.4 + ratio * 1.0;
            }
        });
    }
}

// --- EFFET DE FATIGUE VISUELLE (STALE-MOVE NEGATION : COUP USÉ / RÉPÉTÉ) ---
function spawn3DFatiguePuff(fighter) {
    if (typeof fxGroup === 'undefined' || !fxGroup || !fighter) return;
    const cache = getFxCache();
    const dir = fighter.facing || 1;
    for (let i = 0; i < 3; i++) {
        const drop = new THREE.Mesh(cache.geo.fatigueDrop, cache.mat.fatigue);
        drop.position.set(
            fighter.x + dir * 0.7 + (Math.random() - 0.5) * 0.5,
            fighter.y + 2.3 + Math.random() * 0.4,
            (Math.random() - 0.5) * 0.8
        );
        fxGroup.add(drop);
        pushParticle3D({
            mesh: drop,
            vx: (Math.random() - 0.5) * 2.0,
            vy: 1.8 + Math.random() * 1.4,
            vz: (Math.random() - 0.5) * 2.0,
            life: 0.30
        });
    }
}

// --- ARCS D'ATTAQUE 3D, ONDES DE COUPE & TRAJECTOIRES VISUELLES PAR COUP ---
function spawn3DAttackEffect(attacker, moveType) {
    if (typeof fxGroup === 'undefined' || !fxGroup || !attacker) return;
    const cache = getFxCache();
    const dir = attacker.facing || 1;
    const accent = (attacker.dino && attacker.dino.accentColor) ? attacker.dino.accentColor : 0xfbbf24;
    const primary = (attacker.dino && attacker.dino.primaryColor) ? attacker.dino.primaryColor : 0xef4444;

    if (attacker.combatController && attacker.combatController.lastAttackSpeed > 4.5) {
        spawn3DMomentumTrail(attacker);
    }
    if (attacker.staleMultiplier !== undefined && attacker.staleMultiplier < 1.0) {
        spawn3DFatiguePuff(attacker);
    }

    // 1. FRAPPES HAUTES (UP_LIGHT / ANTI_AIR)
    if (moveType === 'up_light' || moveType === 'anti_air') {
        const isLauncher = moveType === 'anti_air';
        const arcMat = new THREE.MeshBasicMaterial({
            color: 0x38bdf8,
            transparent: true,
            opacity: 0.9
        });
        const arcMesh = new THREE.Mesh(isLauncher ? cache.geo.arcLauncher : cache.geo.arcHigh, arcMat);
        arcMesh.position.set(attacker.x + dir * 1.35, attacker.y + 1.8, 0);
        arcMesh.rotation.z = dir === 1 ? -Math.PI * 0.25 : Math.PI * 0.55;
        fxGroup.add(arcMesh);

        const totalLife = isLauncher ? 0.32 : 0.24;
        pushParticle3D({
            mesh: arcMesh,
            ownsMaterial: true,
            vx: dir * 2.2,
            vy: isLauncher ? 7.5 : 5.0,
            vz: 0,
            life: totalLife,
            initialLife: totalLife,
            noGravity: true,
            onUpdate(pt, dt) {
                const p = 1 - (pt.life / pt.initialLife);
                pt.mesh.rotation.z += dir * 9.5 * dt;
                pt.mesh.scale.setScalar(0.85 + p * 0.55);
                pt.mesh.material.opacity = Math.max(0, (1 - p) * 0.9);
            }
        });

        if (isLauncher) {
            spawn3DGroundShockwave(attacker.x + dir * 0.9, 0x38bdf8, 2.2, false, attacker.groundY ?? attacker.y);
        }
        return;
    }

    // 2. FRAPPES BASSES (LOW_LIGHT / LOW_HEAVY)
    if (moveType === 'low_light' || moveType === 'low_heavy') {
        const isHeavyLow = moveType === 'low_heavy';
        const sweepMat = new THREE.MeshBasicMaterial({
            color: isHeavyLow ? 0xf59e0b : 0x10b981,
            transparent: true,
            opacity: 0.88
        });
        const sweepMesh = new THREE.Mesh(isHeavyLow ? cache.geo.sweepHeavyLow : cache.geo.sweepLow, sweepMat);
        sweepMesh.position.set(attacker.x + dir * 1.25, (attacker.y || 0) + 0.38, 0);
        sweepMesh.rotation.x = Math.PI / 2;
        sweepMesh.rotation.z = dir === 1 ? -Math.PI * 0.45 : Math.PI * 0.55;
        fxGroup.add(sweepMesh);

        const totalLife = isHeavyLow ? 0.32 : 0.22;
        pushParticle3D({
            mesh: sweepMesh,
            ownsMaterial: true,
            vx: dir * 3.2,
            vy: 0,
            vz: 0,
            life: totalLife,
            initialLife: totalLife,
            noGravity: true,
            onUpdate(pt, dt) {
                const p = 1 - (pt.life / pt.initialLife);
                pt.mesh.rotation.z += dir * 11 * dt;
                pt.mesh.scale.setScalar(0.8 + p * 0.5);
                pt.mesh.material.opacity = Math.max(0, (1 - p) * 0.88);
            }
        });

        spawn3DGroundShockwave(attacker.x + dir * 1.5, isHeavyLow ? 0xf59e0b : 0x10b981, isHeavyLow ? 2.8 : 1.6, isHeavyLow, attacker.groundY ?? attacker.y);
        return;
    }

    // 3. PERCÉES & CHARGES VERS L'AVANT (FWD_LIGHT / FWD_HEAVY)
    if (moveType === 'fwd_light' || moveType === 'fwd_heavy') {
        const isHeavyThrust = moveType === 'fwd_heavy';
        const coneMat = new THREE.MeshBasicMaterial({
            color: isHeavyThrust ? 0xef4444 : accent,
            wireframe: true,
            transparent: true,
            opacity: 0.85
        });
        const coneMesh = new THREE.Mesh(isHeavyThrust ? cache.geo.thrustHeavy : cache.geo.thrustLight, coneMat);
        coneMesh.position.set(attacker.x + dir * 1.9, attacker.y + 1.85, 0);
        coneMesh.rotation.z = dir === 1 ? -Math.PI / 2 : Math.PI / 2;
        fxGroup.add(coneMesh);

        const totalLife = isHeavyThrust ? 0.30 : 0.22;
        pushParticle3D({
            mesh: coneMesh,
            ownsMaterial: true,
            vx: dir * (isHeavyThrust ? 9.5 : 7.5),
            vy: 0,
            vz: 0,
            life: totalLife,
            initialLife: totalLife,
            noGravity: true,
            onUpdate(pt, dt) {
                const p = 1 - (pt.life / pt.initialLife);
                pt.mesh.rotation.x += 14 * dt;
                pt.mesh.scale.set(1 + p * 0.45, 1 + p * 0.65, 1 + p * 0.45);
                pt.mesh.material.opacity = Math.max(0, (1 - p) * 0.85);
            }
        });
        if (isHeavyThrust) {
            spawn3DMomentumTrail(attacker);
        }
        return;
    }

    // 4. ATTAQUES AÉRIENNES PLONGEANTES (AIR_LIGHT / AIR_HEAVY)
    if (moveType === 'air_light' || moveType === 'air_heavy') {
        const isHeavyDive = moveType === 'air_heavy';
        const diveMat = new THREE.MeshBasicMaterial({
            color: isHeavyDive ? 0xf97316 : 0x38bdf8,
            wireframe: true,
            transparent: true,
            opacity: 0.85
        });
        const diveMesh = new THREE.Mesh(cache.geo.diveCone, diveMat);
        diveMesh.position.set(attacker.x + dir * 1.2, attacker.y + 1.4, 0);
        diveMesh.rotation.z = dir === 1 ? -Math.PI * 0.72 : Math.PI * 0.72;
        fxGroup.add(diveMesh);

        const totalLife = 0.26;
        pushParticle3D({
            mesh: diveMesh,
            ownsMaterial: true,
            vx: dir * 6.5,
            vy: -9.5,
            vz: 0,
            life: totalLife,
            initialLife: totalLife,
            noGravity: true,
            onUpdate(pt) {
                const p = 1 - (pt.life / pt.initialLife);
                pt.mesh.material.opacity = Math.max(0, (1 - p) * 0.85);
            }
        });
        return;
    }

    // 5. CHOPE / PROJECTION (THROW)
    if (moveType === 'throw') {
        [-1, 1].forEach(jawSide => {
            const jawMat = new THREE.MeshBasicMaterial({
                color: 0xef4444,
                transparent: true,
                opacity: 0.9
            });
            const jawMesh = new THREE.Mesh(cache.geo.throwJaw, jawMat);
            jawMesh.position.set(attacker.x + dir * 1.65, attacker.y + 1.9 + jawSide * 0.55, 0);
            jawMesh.rotation.z = jawSide > 0 ? -0.35 : Math.PI - 0.35;
            fxGroup.add(jawMesh);

            const totalLife = 0.26;
            pushParticle3D({
                mesh: jawMesh,
                ownsMaterial: true,
                vx: dir * 1.5,
                vy: -jawSide * 3.8,
                vz: 0,
                life: totalLife,
                initialLife: totalLife,
                noGravity: true,
                onUpdate(pt) {
                    const p = 1 - (pt.life / pt.initialLife);
                    pt.mesh.material.opacity = Math.max(0, (1 - p) * 0.9);
                }
            });
        });
        return;
    }

    // 6. COUPS LOURDS, SPÉCIAUX & COMBOS 1-2 MÉDIANS
    const isHeavy = moveType === 'heavy' || moveType === 'special' || moveType === 'special2';
    const isSecondHit = moveType === 'light2';
    const isBack = moveType === 'back_light';

    const slashMat = new THREE.MeshBasicMaterial({
        color: isHeavy ? accent : (isSecondHit ? 0xfbbf24 : primary),
        transparent: true,
        opacity: 0.86
    });
    const slashMesh = new THREE.Mesh(isHeavy ? cache.geo.arcHeavy : cache.geo.arcLight, slashMat);
    slashMesh.position.set(
        attacker.x + dir * (isBack ? 0.85 : 1.55),
        attacker.y + 1.85,
        isSecondHit ? -0.25 : 0.25
    );
    slashMesh.rotation.x = isSecondHit ? -0.58 : (isHeavy ? 1.15 : 0.58);
    slashMesh.rotation.y = dir === 1 ? 0.35 : -0.35;
    fxGroup.add(slashMesh);

    const totalLife = isHeavy ? 0.30 : 0.20;
    pushParticle3D({
        mesh: slashMesh,
        ownsMaterial: true,
        vx: dir * (isBack ? -2.0 : 4.2),
        vy: 0,
        vz: 0,
        life: totalLife,
        initialLife: totalLife,
        noGravity: true,
        onUpdate(pt, dt) {
            const p = 1 - (pt.life / pt.initialLife);
            pt.mesh.rotation.z += dir * (isHeavy ? 14 : 9) * dt;
            pt.mesh.scale.setScalar(0.85 + p * 0.48);
            pt.mesh.material.opacity = Math.max(0, (1 - p) * 0.86);
        }
    });
}

// --- ONDE D'IMPACT SUR LA CIBLE ET DÉVIATION DE GARDE 3-VOIES ---
function spawn3DGuardDeflectEffect(defender, zone = 'mid') {
    if (typeof fxGroup === 'undefined' || !fxGroup || !defender) return;
    const cache = getFxCache();
    const dir = defender.facing || 1;
    const zoneY = zone === 'high' ? 2.75 : (zone === 'low' ? 1.05 : 1.95);
    const zoneColor = zone === 'high' ? 0x38bdf8 : (zone === 'low' ? 0x10b981 : 0xfbbf24);

    // Flash éclatant sur l'armure 3D de la créature à l'endroit défendu
    if (defender.rig && defender.rig.armorRig && defender.rig.armorRig.mat) {
        defender.rig.armorRig.mat.emissiveIntensity = 2.4;
    }

    const shieldFlashMat = new THREE.MeshBasicMaterial({
        color: zoneColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.92
    });
    const flashMesh = new THREE.Mesh(cache.geo.shieldHex, shieldFlashMat);
    flashMesh.position.set(defender.x + dir * 0.95, defender.y + zoneY, 0);
    flashMesh.rotation.y = Math.PI / 2;
    fxGroup.add(flashMesh);

    const totalLife = 0.26;
    pushParticle3D({
        mesh: flashMesh,
        ownsMaterial: true,
        vx: 0,
        vy: 0,
        vz: 0,
        life: totalLife,
        initialLife: totalLife,
        noGravity: true,
        onUpdate(pt, dt) {
            const p = 1 - (pt.life / pt.initialLife);
            pt.mesh.scale.setScalar(0.75 + p * 1.15);
            pt.mesh.rotation.z += 6 * dt;
            pt.mesh.material.opacity = Math.max(0, (1 - p) * 0.92);
        }
    });

    const sparkMat = zone === 'high' ? cache.mat.sparkCyan : (zone === 'low' ? cache.mat.sparkEmerald : cache.mat.sparkGold);
    for (let i = 0; i < 6; i++) {
        const spark = new THREE.Mesh(cache.geo.spark, sparkMat);
        spark.position.set(defender.x + dir * 0.95, defender.y + zoneY, (Math.random() - 0.5) * 0.6);
        fxGroup.add(spark);
        const ang = (i / 6) * Math.PI * 2;
        pushParticle3D({
            mesh: spark,
            vx: dir * (2.5 + Math.random() * 4.5),
            vy: Math.sin(ang) * 4.5 + 1.5,
            vz: Math.cos(ang) * 4.5,
            life: 0.24
        });
    }
}

function spawn3DHitImpactBurst(defender, zone = 'mid', isHeavy = false) {
    if (typeof fxGroup === 'undefined' || !fxGroup || !defender) return;
    const cache = getFxCache();
    const hitY = zone === 'high' ? 2.65 : (zone === 'low' ? 0.95 : 1.85);
    const burstColor = isHeavy ? 0xef4444 : 0xfde047;

    const ringMat = new THREE.MeshBasicMaterial({
        color: burstColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.92
    });
    const ringMesh = new THREE.Mesh(isHeavy ? cache.geo.hitBurstHeavy : cache.geo.hitBurstLight, ringMat);
    ringMesh.position.set(defender.x, defender.y + hitY, 0.45);
    fxGroup.add(ringMesh);

    const totalLife = isHeavy ? 0.24 : 0.16;
    pushParticle3D({
        mesh: ringMesh,
        ownsMaterial: true,
        vx: 0,
        vy: 0,
        vz: 0,
        life: totalLife,
        initialLife: totalLife,
        noGravity: true,
        onUpdate(pt, dt) {
            const p = 1 - (pt.life / pt.initialLife);
            pt.mesh.scale.setScalar(0.6 + p * (isHeavy ? 1.4 : 1.0));
            pt.mesh.rotation.z += 8 * dt;
            pt.mesh.material.opacity = Math.max(0, (1 - p) * 0.92);
        }
    });
}

function spawn3DProjectile(owner, kind) {
    const cache = getFxCache();
    const dir = owner.facing;
    let geo, mat;
    if (kind === 'sonic') {
        geo = cache.geo.projSonic;
        mat = cache.mat.projSonic;
    } else if (kind === 'venom') {
        geo = cache.geo.projVenom;
        mat = cache.mat.projVenom;
    } else if (kind === 'feather') {
        geo = cache.geo.projFeather;
        mat = cache.mat.projFeather;
    } else if (kind === 'dragon_fire') {
        geo = cache.geo.projFire;
        mat = cache.mat.projFire;
    } else if (kind === 'hydro') {
        geo = new THREE.TorusGeometry(0.38, 0.14, 8, 16);
        mat = new THREE.MeshStandardMaterial({
            color: 0x22d3ee,
            emissive: 0x06b6d4,
            emissiveIntensity: 0.95,
            roughness: 0.2
        });
    } else {
        geo = cache.geo.projBoulder;
        mat = new THREE.MeshLambertMaterial({
            color: owner.dino.accentColor,
            emissive: owner.dino.accentColor,
            emissiveIntensity: 0.5
        });
    }
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(owner.x + dir * 2.1, (owner.y || 0) + 2.0, 0);
    if (kind === 'sonic' || kind === 'hydro') mesh.rotation.y = Math.PI / 2;
    fxGroup.add(mesh);

    projectiles3D.push({
        owner,
        mesh,
        kind,
        vx: dir * (kind === 'sonic' ? 19.5 : (kind === 'dragon_fire' ? 11.5 : (kind === 'hydro' ? 18.0 : 15.5))),
        damage: kind === 'xray_wave' ? 165 : (kind === 'dragon_fire' ? 42 : (kind === 'hydro' ? 95 : 85)),
        life: 1.5
    });
}

function spawnBubbleGeyserFx(x, y) {
    if (!battleScene) return;
    const count = 18;
    for (let i = 0; i < count; i++) {
        const bubble = new THREE.Mesh(
            new THREE.SphereGeometry(0.12 + Math.random() * 0.16, 6, 6),
            new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.85 })
        );
        bubble.position.set(x + (Math.random() - 0.5) * 1.2, y + 0.3 + Math.random() * 0.8, (Math.random() - 0.5) * 0.8);
        battleScene.add(bubble);
        const vy = 9 + Math.random() * 11;
        const vx = (Math.random() - 0.5) * 2.5;
        const startTime = performance.now();
        const anim = () => {
            const elapsed = (performance.now() - startTime) / 1000;
            bubble.position.y += vy * 0.016;
            bubble.position.x += vx * 0.016;
            bubble.material.opacity = Math.max(0, 0.85 - elapsed * 1.4);
            if (elapsed < 0.6) {
                requestAnimationFrame(anim);
            } else {
                battleScene.remove(bubble);
                bubble.geometry.dispose();
                bubble.material.dispose();
            }
        };
        requestAnimationFrame(anim);
    }
}
window.spawnBubbleGeyserFx = spawnBubbleGeyserFx;
