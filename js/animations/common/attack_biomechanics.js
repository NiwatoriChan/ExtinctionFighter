// ============================================================================
// js/animations/common/attack_biomechanics.js — Universal Attack Base & Post-Attack Biomechanics
// ============================================================================

function computeAttackBiomechanics(prog) {
    let strike = 0;
    let anticipate = 0;
    if (prog < 0.25) {
        // Phase 1 : Armement prononcé (Coil / Windup)
        anticipate = Math.sin((prog / 0.25) * (Math.PI * 0.5));
        strike = -anticipate * 0.42;
    } else if (prog < 0.50) {
        // Phase 2 : Détente explosive non-linéaire à l'impact (Snap actif)
        const p = (prog - 0.25) / 0.25;
        strike = -0.42 + 1.54 * Math.pow(Math.sin(p * (Math.PI * 0.5)), 0.72);
    } else {
        // Phase 3 : Récupération (Follow-through & retour au neutre)
        const p = (prog - 0.50) / 0.50;
        strike = 1.12 * Math.cos(p * (Math.PI * 0.5));
    }
    const swing = Math.max(0, strike);
    return { strike, swing, anticipate };
}

function applyUniversalAttackBase(rig, act, prog, strike, swing, anticipate, baseHipsY) {
    if (act === 'light') {
        // Coup Léger 1 : Frappe vive diagonale du côté avant gauche
        rig.hips.position.x = strike * 0.55;
        rig.hips.position.y = baseHipsY - anticipate * 0.12;
        rig.torso.rotation.z = -strike * 0.36;
        rig.torso.rotation.y = strike * 0.32;
        rig.neck.rotation.z = -strike * 0.34;
        rig.headGroup.rotation.z = -strike * 0.36;
        rig.headGroup.rotation.y = strike * 0.28;
        rig.jaw.rotation.z = -swing * 0.85;
        if (rig.arms && rig.arms[0]) rig.arms[0].rotation.z = strike * 1.35;
    } else if (act === 'light2') {
        // Coup Léger 2 (Combo 1-2) : Frappe croisée opposée du côté droit avec torsion du buste
        rig.hips.position.x = strike * 0.72;
        rig.torso.rotation.z = -strike * 0.45;
        rig.torso.rotation.y = -strike * 0.42;
        rig.neck.rotation.z = -strike * 0.42;
        rig.headGroup.rotation.z = -strike * 0.48;
        rig.headGroup.rotation.y = -strike * 0.38;
        rig.jaw.rotation.z = -swing * 1.10;
        if (rig.arms && rig.arms[1]) rig.arms[1].rotation.z = strike * 1.45;
        rig.tailSegments.forEach(s => { s.rotation.y = strike * 0.52; });
    } else if (act === 'up_light') {
        // Direction HAUT ⬆️ (Uppercut / Morsure haute ascendante - Zone HIGH)
        rig.hips.position.y = baseHipsY - anticipate * 0.28 + swing * 0.78;
        rig.hips.position.x = strike * 0.32;
        rig.hips.rotation.z = strike * 0.25;
        rig.torso.rotation.z = strike * 0.64;
        rig.neck.rotation.z = strike * 0.70;
        rig.headGroup.rotation.z = strike * 0.88;
        rig.jaw.rotation.z = -swing * 1.30;
        if (rig.arms) {
            if (rig.arms[0]) rig.arms[0].rotation.z = strike * 1.90;
            if (rig.arms[1]) rig.arms[1].rotation.z = strike * 1.90;
        }
    } else if (act === 'anti_air') {
        // Direction HAUT / ARRIÈRE ⬆️ (Anti-Air Launcher céleste - Zone HIGH)
        rig.hips.position.y = baseHipsY - anticipate * 0.38 + swing * 1.05;
        rig.hips.position.x = strike * 0.42;
        rig.hips.rotation.z = strike * 0.38;
        rig.torso.rotation.z = strike * 0.72;
        rig.neck.rotation.z = strike * 0.75;
        rig.headGroup.rotation.z = strike * 0.95;
        rig.jaw.rotation.z = -swing * 1.40;
        if (rig.arms) {
            if (rig.arms[0]) rig.arms[0].rotation.z = strike * 2.05;
            if (rig.arms[1]) rig.arms[1].rotation.z = strike * 2.05;
        }
        rig.tailSegments.forEach(s => { s.rotation.z = -strike * 0.62; });
    } else if (act === 'fwd_light') {
        // Direction AVANT ➡️ (Poke / Percée horizontale longue portée - Zone MID)
        rig.hips.position.x = strike * 1.18;
        rig.hips.position.y = baseHipsY * 0.86;
        rig.torso.rotation.z = -strike * 0.44;
        rig.neck.rotation.z = -strike * 0.48;
        rig.headGroup.rotation.z = -strike * 0.32;
        rig.jaw.rotation.z = -swing * 0.95;
        if (rig.arms) {
            if (rig.arms[0]) rig.arms[0].rotation.z = strike * 1.32;
            if (rig.arms[1]) rig.arms[1].rotation.z = strike * 1.32;
        }
    } else if (act === 'fwd_heavy') {
        // Direction AVANT LOURD ➡️ (Charge bélier massive vers l'avant - Zone MID)
        rig.hips.position.x = strike * 1.52;
        rig.hips.position.y = baseHipsY * 0.84;
        rig.torso.rotation.z = -strike * 0.54;
        rig.neck.rotation.z = -strike * 0.56;
        rig.headGroup.rotation.z = -strike * 0.42;
        rig.jaw.rotation.z = -swing * 1.15;
    } else if (act === 'low_light') {
        // Direction BAS ⬇️ (Balayage ras du sol, fauchage des chevilles - Zone LOW)
        rig.hips.position.y = baseHipsY * (0.48 - swing * 0.08);
        rig.hips.position.x = strike * 0.45;
        rig.torso.rotation.z = -0.48;
        rig.torso.rotation.y = Math.cos(prog * Math.PI) * 0.88;
        rig.headGroup.rotation.z = -0.58;
        rig.headGroup.position.y = rig.restPose ? rig.restPose.headPos.y - 0.25 : -0.25;
        rig.jaw.rotation.z = -swing * 0.88;
        rig.tailSegments.forEach((s, i) => {
            s.rotation.y = Math.sin(prog * Math.PI) * (1.05 + i * 0.1);
            s.rotation.z = -0.35;
        });
        if (rig.legs && rig.legs[0]) rig.legs[0].rotation.y = strike * 1.25;
    } else if (act === 'low_heavy') {
        // Direction BAS LOURD ⬇️ (Écrasement pilonnage lourd au ras du sol - Zone LOW)
        const slamDrop = prog < 0.28 ? (prog / 0.28) * 0.45 : -swing * 0.52;
        rig.hips.position.y = baseHipsY * (0.65 + slamDrop);
        rig.hips.position.x = strike * 0.55;
        rig.torso.rotation.z = prog < 0.28 ? 0.32 : -0.62;
        rig.headGroup.rotation.z = prog < 0.28 ? 0.25 : -0.78;
        rig.headGroup.position.y = rig.restPose ? rig.restPose.headPos.y - 0.32 : -0.32;
        rig.jaw.rotation.z = -swing * 1.20;
        if (rig.arms) {
            if (rig.arms[0]) rig.arms[0].rotation.z = -strike * 1.55;
            if (rig.arms[1]) rig.arms[1].rotation.z = -strike * 1.55;
        }
        rig.tailSegments.forEach(s => { s.rotation.z = -0.45; s.rotation.y = -strike * 1.05; });
    } else if (act === 'back_light') {
        // Direction ARRIÈRE ⬅️ (Coup défensif en recul d'esquive - Zone MID)
        rig.hips.position.x = -strike * 0.82;
        rig.hips.position.y = baseHipsY * 0.92;
        rig.torso.rotation.z = strike * 0.36;
        rig.headGroup.rotation.z = strike * 0.26;
        rig.jaw.rotation.z = -swing * 0.78;
        if (rig.arms && rig.arms[0]) rig.arms[0].rotation.z = strike * 1.25;
    } else if (act === 'air_light' || act === 'air_heavy') {
        // Attaque aérienne (Piqué Plongeant vers le sol - Zone HIGH / OVERHEAD)
        const isHeavyAir = act === 'air_heavy';
        rig.torso.rotation.z = isHeavyAir ? -0.78 : -0.62;
        rig.neck.rotation.z = -0.35;
        rig.headGroup.rotation.z = -0.45;
        rig.jaw.rotation.z = -swing * 1.05;
        if (rig.arms) {
            if (rig.arms[0]) rig.arms[0].rotation.z = strike * 1.45;
            if (rig.arms[1]) rig.arms[1].rotation.z = strike * 1.45;
        }
        if (rig.legs) {
            if (rig.legs[0]) rig.legs[0].rotation.z = strike * 1.15;
            if (rig.legs[1]) rig.legs[1].rotation.z = strike * 0.95;
        }
    } else if (act === 'throw') {
        // Chope (Grapple au corps à corps : morsure/saisie -> secousse violente -> projection)
        if (prog < 0.30) {
            rig.hips.position.x = strike * 1.05;
            rig.torso.rotation.z = -0.38;
            rig.jaw.rotation.z = -1.35;
        } else if (prog < 0.72) {
            const shake = Math.sin(prog * 36);
            rig.hips.position.x = 0.95;
            rig.torso.rotation.y = shake * 0.58;
            rig.torso.rotation.z = 0.38;
            rig.headGroup.rotation.y = shake * 0.65;
            rig.headGroup.rotation.z = Math.cos(prog * 36) * 0.35;
            rig.jaw.rotation.z = -0.22;
        } else {
            rig.hips.position.x = 0.65;
            rig.torso.rotation.z = 0.52;
            rig.headGroup.rotation.z = 0.65;
            rig.jaw.rotation.z = -0.95;
        }
    } else if (act === 'throw_whiff') {
        // Chope ratée dans le vide (Whiff déséquilibré vers l'avant)
        const whiffArc = Math.sin(prog * Math.PI);
        rig.hips.position.x = whiffArc * 0.75;
        rig.hips.position.y = baseHipsY - whiffArc * 0.28;
        rig.torso.rotation.z = -whiffArc * 0.48;
        rig.headGroup.rotation.z = -whiffArc * 0.35;
        rig.headGroup.rotation.y = Math.sin(prog * Math.PI * 2) * 0.32;
        rig.jaw.rotation.z = -whiffArc * 0.75;
    }
}

function applyPostAttackBiomechanics(fighter, rig, id, act, prog, strike, swing, time) {
    // 1. Travail des jambes et ancrage dynamique (évite les jambes figées pendant les frappes)
    if (rig.legs && rig.legs.length >= 2) {
        const legsUnanimated = Math.abs(rig.legs[0].rotation.z) < 0.01 && Math.abs(rig.legs[1].rotation.z) < 0.01;
        if (legsUnanimated) {
            if (act === 'up_light' || act === 'anti_air') {
                // Détente verticale des jarrets vers le ciel
                rig.legs[0].rotation.z = -strike * 0.65;
                rig.legs[1].rotation.z = -strike * 0.55;
            } else if (act === 'low_light' || act === 'low_heavy') {
                // Grand écart / flexion basse d'écrasement
                rig.legs[0].rotation.z = 0.68 + swing * 0.25;
                rig.legs[1].rotation.z = -0.68 - swing * 0.25;
            } else if (act === 'back_light') {
                // Pas de retrait défensif
                rig.legs[0].rotation.z = -strike * 0.55;
                rig.legs[1].rotation.z = strike * 0.65;
            } else {
                // Fente avant offensive (jambe avant fléchie en appui, jambe arrière en poussée)
                const lungeStep = (act === 'fwd_light' || act === 'fwd_heavy' || act === 'heavy') ? 0.72 : 0.48;
                rig.legs[0].rotation.z = strike * lungeStep;
                rig.legs[1].rotation.z = -strike * lungeStep;
                if (rig.legs.length >= 4) {
                    rig.legs[2].rotation.z = -strike * lungeStep * 0.85;
                    rig.legs[3].rotation.z = strike * lungeStep * 0.85;
                }
            }
        }
    }

    // 2. Squash & Stretch anatomique sur l'organe de frappe actif pendant l'impact (rend la hitbox évidente)
    if (swing > 0.25) {
        const impactPop = 1 + (swing - 0.25) * 0.20;
        if (act === 'up_light' || act === 'anti_air' || act === 'fwd_light' || act === 'throw' || id === 'trex' || id === 'pachy' || id === 'pachyrhino' || id === 'terabird' || id === 'quetzal' || id === 'postosuchus' || id === 'smilodon') {
            if (!fighter.isXrayTarget && matchState !== 'fatality_anim') {
                rig.headGroup.scale.setScalar(impactPop);
            }
        }
        if (rig.arms && rig.arms.length > 0 && (id === 'therizinosaurus' || id === 'therizino' || id === 'spinosaurus' || id === 'giantsloth' || id === 'pulmonoscorpius')) {
            rig.arms.forEach(a => { if (a) a.scale.setScalar(impactPop); });
        }
        if (rig.tailSegments && rig.tailSegments.length > 0 && (act === 'low_light' || act === 'low_heavy' || id === 'ankylosaurus' || id === 'ankylo' || id === 'stegosaurus' || id === 'apato')) {
            const lastTail = rig.tailSegments[rig.tailSegments.length - 1];
            if (lastTail) lastTail.scale.setScalar(1 + (swing - 0.25) * 0.26);
        }
    }

    // 3. Amplification cinématique du Momentum (Attaque lancée à pleine vitesse)
    if (fighter.combatController && fighter.combatController.lastAttackSpeed > 4.2 && act !== 'back_light') {
        const momFactor = Math.min(1.0, (fighter.combatController.lastAttackSpeed - 4.2) / 6.0);
        rig.hips.position.x += swing * 0.42 * momFactor;
        rig.torso.rotation.z -= swing * 0.16 * momFactor;
    }

    // 4. Limiteur d'avancée visuelle du bassin (Visual Body Blocker) :
    // Empêche le maillage 3D de pénétrer dans le corps adverse lors d'une fente au corps-à-corps
    const opponent = (typeof fighter1 !== 'undefined' && typeof fighter2 !== 'undefined')
        ? (fighter === fighter1 ? fighter2 : fighter1)
        : null;
    if (opponent && rig.hips.position.x > 0.25 && Math.abs(fighter.y - opponent.y) < 2.2) {
        const centerDist = Math.abs(fighter.x - opponent.x);
        const bodyClearance = ((fighter.bodyRadius || 1.32) + (opponent.bodyRadius || 1.32)) * 0.82;
        const maxLocalForwardX = Math.max(0.28, (centerDist - bodyClearance) / (fighter.dino.scale || 1.0));
        if (rig.hips.position.x > maxLocalForwardX) {
            rig.hips.position.x = maxLocalForwardX;
        }
    }

    // 5. Expression corporelle de Fatigue (Stale-Move Negation : coup répété / usé)
    if (fighter.staleMultiplier !== undefined && fighter.staleMultiplier < 1.0 && prog > 0.48) {
        const fatigue = (1.0 - fighter.staleMultiplier) * ((prog - 0.48) / 0.52);
        rig.hips.position.y -= fatigue * 0.28;
        rig.torso.rotation.z -= fatigue * 0.25;
        rig.headGroup.rotation.z -= fatigue * 0.35;
        rig.jaw.rotation.z = Math.min(rig.jaw.rotation.z, -0.45 * fatigue - Math.abs(Math.sin(time * 18)) * 0.22 * fatigue);
    }
}
