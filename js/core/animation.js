// 5. SYSTÈME D'ANIMATION 3D DISTINCT PAR ESPÈCE (MOUVEMENTS, ATTAQUES, X-RAY & FATALITÉS)
function animateDino3DRig(fighter, time, dt) {
    const rig = fighter.rig;
    if (!rig) return;
    const id = fighter.dino.id;
    const act = fighter.action;
    const prog = fighter.actionDuration > 0 ? Math.min(1, fighter.actionTimer / fighter.actionDuration) : 0;

    // Réinitialisation douce de TOUS les membres à chaque frame pour éviter les torsions résiduelles
    rig.hips.rotation.set(0, 0, 0);
    rig.torso.rotation.set(0, 0, 0);
    rig.neck.rotation.set(0, 0, 0);
    rig.headGroup.rotation.set(0, 0, 0);
    rig.jaw.rotation.set(0, 0, 0);
    if (rig.arms) {
        rig.arms.forEach(a => { if (a) a.rotation.set(0, 0, 0); });
    }
    if (rig.legs) {
        rig.legs.forEach(l => { if (l) l.rotation.set(0, 0, 0); });
    }
    rig.shieldMesh.visible = fighter.isBlocking;

    const fighterImpl = FIGHTER_IMPLS[id] || {};
    const baseHipsY = fighterImpl.animBaseHipsY !== undefined ? fighterImpl.animBaseHipsY : 2.1;
    rig.hips.position.set(0, baseHipsY, 0);

    // Flash blanc d'impact si touché
    rig.bodyMat.emissive.setHex(fighter.hitStun > 0.08 ? 0xffffff : 0x000000);
    rig.bodyMat.emissiveIntensity = fighter.hitStun > 0.08 ? 0.75 : 0;

    // --- ANIMATION DE L'ATTAQUANT PENDANT LE X-RAY (VERROUILLÉ EN 3 PHASES) ---
    if (fighter.isXrayAttacker && xrayCinematicTimer > 0) {
        const phasePulse = Math.sin(time * 24);
        if (xrayStage === 1) {
            rig.hips.position.x = 0.55;
            rig.torso.rotation.z = -0.32 + phasePulse * 0.12;
            rig.headGroup.rotation.z = -0.35;
            rig.jaw.rotation.z = -0.75;
        } else if (xrayStage === 2) {
            rig.hips.position.x = 0.78;
            rig.torso.rotation.y = phasePulse * 0.45;
            rig.torso.rotation.z = 0.22;
        } else {
            rig.hips.position.x = 0.92;
            rig.hips.position.y = baseHipsY + 0.35;
            rig.torso.rotation.z = 0.45;
            rig.headGroup.rotation.z = 0.55;
            rig.jaw.rotation.z = -0.85;
        }
        return;
    }

    // --- ANIMATION ANATOMIQUE DU SQUELETTE X-RAY 2.0 EN 3 PHASES (CIBLE VERROUILLÉE) ---
    if (fighter.isXrayTarget) {
        rig.skeletonGroup.visible = true;
        rig.skinMeshes.forEach(m => {
            m.material.transparent = true;
            m.material.opacity = 0.14;
        });

        const xp = rig.xrayParts;
        if (xp) {
            xp.heart.scale.setScalar(1 + Math.sin(time * 28) * 0.28);
            xp.skullMat.color.setHex(xrayStage === 1 ? 0xef4444 : 0xf0f9ff);
            xp.ribMat.color.setHex(xrayStage === 2 ? 0xef4444 : 0xe0f2fe);
            xp.spineMat.color.setHex(xrayStage === 3 ? 0xef4444 : 0xe0f2fe);

            if (xrayStage === 1) {
                xp.skullGroup.rotation.z = Math.sin(time * 55) * 0.28;
                xp.jawBone.rotation.z = -0.45 + Math.sin(time * 40) * 0.2;
                rig.headGroup.rotation.z = 0.45;
            } else if (xrayStage === 2) {
                xp.ribCageGroup.scale.set(0.82 + Math.sin(time * 50) * 0.15, 0.85, 1.2);
                rig.torso.rotation.z = -0.25;
            } else if (xrayStage === 3) {
                xp.spineGroup.rotation.z = Math.sin(time * 60) * 0.35;
                rig.hips.position.y = baseHipsY + 0.55;
                rig.hips.rotation.z = 0.38;
            }
        }
        return;
    } else {
        rig.skeletonGroup.visible = false;
        if (rig.xrayParts) {
            rig.xrayParts.ribCageGroup.scale.set(1, 1, 1);
            rig.xrayParts.skullGroup.rotation.set(0, 0, 0);
            rig.xrayParts.spineGroup.rotation.set(0, 0, 0);
        }
        rig.skinMeshes.forEach(m => {
            m.material.transparent = false;
            m.material.opacity = 1.0;
        });
    }

    // État mort / aplati / décapité
    rig.headGroup.visible = !fighter.decapitated;
    if (fighter.flattened) {
        rig.root.scale.set(fighter.dino.scale * 1.65, 0.12, fighter.dino.scale * 1.65);
        return;
    } else {
        rig.root.scale.setScalar(fighter.dino.scale);
    }

    if (fighter.isDead) {
        rig.hips.position.y = 0.65;
        rig.hips.rotation.z = Math.PI / 2.1;
        return;
    }

    // État étourdi ("ACHEVEZ-LE !")
    if (fighter.isDizzy) {
        rig.hips.rotation.z = Math.sin(time * 7) * 0.18;
        rig.hips.rotation.x = Math.cos(time * 5) * 0.12;
        rig.headGroup.rotation.z = -0.3 + Math.sin(time * 9) * 0.2;
        rig.jaw.rotation.z = -0.35;
        if (fighter.kneeling) rig.hips.position.y = baseHipsY * 0.55;
        return;
    }

    // --- RECUL VISCÉRAL ET RÉACTION AUX COUPS (HITSTUN LISIBLE) ---
    if (fighter.hitStun > 0) {
        const stunStrength = Math.min(1.0, fighter.hitStun * 3.5);
        const staggerVib = Math.sin(time * 48) * 0.08 * stunStrength;

        rig.hips.position.x = -stunStrength * 0.45;
        rig.hips.position.y = baseHipsY - stunStrength * 0.12;
        rig.hips.rotation.z = stunStrength * 0.15;
        rig.torso.rotation.z = stunStrength * 0.38 + staggerVib;
        rig.neck.rotation.z = stunStrength * 0.28;
        rig.headGroup.rotation.z = stunStrength * 0.48;
        rig.jaw.rotation.z = -0.65 * stunStrength;

        if (rig.arms) {
            if (rig.arms[0]) rig.arms[0].rotation.z = -stunStrength * 0.65;
            if (rig.arms[1]) rig.arms[1].rotation.z = stunStrength * 0.65;
        }
        if (rig.legs) {
            if (rig.legs[0]) rig.legs[0].rotation.z = stunStrength * 0.35;
            if (rig.legs[1]) rig.legs[1].rotation.z = -stunStrength * 0.35;
        }
        return;
    }

    // --- POSTURES DE GARDE CLAIRES & ACTIVES (HAUTE & BASSE) ---
    if (fighter.isBlocking) {
        rig.shieldMesh.visible = true;
        const isLow = fighter.blockType === 'low' || act === 'crouch';

        if (isLow) {
            // Garde Basse : Accroupi très bas, corps compact, pattes et ventre protégés
            rig.hips.position.y = baseHipsY * 0.58;
            rig.torso.rotation.z = -0.32;
            rig.headGroup.rotation.z = -0.28;
            rig.jaw.rotation.z = -0.05;
            if (rig.legs) {
                if (rig.legs[0]) rig.legs[0].rotation.z = 0.45;
                if (rig.legs[1]) rig.legs[1].rotation.z = -0.45;
            }
        } else {
            // Garde Haute : Posture d'ancrage défensive, buste gainé et tête rentrée
            rig.hips.position.x = -0.25;
            rig.hips.position.y = baseHipsY * 0.94;
            rig.torso.rotation.z = -0.22;
            rig.neck.rotation.z = -0.25;
            rig.headGroup.rotation.z = -0.20;
            rig.jaw.rotation.z = -0.04;
            if (rig.arms) {
                if (rig.arms[0]) rig.arms[0].rotation.z = 0.65;
                if (rig.arms[1]) rig.arms[1].rotation.z = -0.65;
            }
        }
        return;
    }

    // --- RUÉE / DASH AÉRODYNAMIQUE ---
    if (fighter.dashTimer > 0) {
        const dashProg = Math.min(1.0, fighter.dashTimer / 0.18);
        const lunge = Math.sin(dashProg * Math.PI);
        rig.hips.position.y = baseHipsY * 0.78;
        rig.torso.rotation.z = -0.44;
        rig.headGroup.rotation.z = -0.22;
        rig.jaw.rotation.z = -0.35;
        if (rig.legs) {
            if (rig.legs[0]) rig.legs[0].rotation.z = 0.9 * Math.sin(time * 25);
            if (rig.legs[1]) rig.legs[1].rotation.z = -0.9 * Math.sin(time * 25);
        }
        return;
    }

    // --- GESTION DU SAUT LIBRE (HORS ATTAQUE) ---
    const isAttackAction = act === 'light' || act === 'light2' || act === 'heavy' || act === 'special' || act === 'special2' || act === 'xray' ||
        act === 'fwd_light' || act === 'low_light' || act === 'air_light' ||
        act === 'fwd_heavy' || act === 'anti_air' || act === 'air_heavy' ||
        act === 'up_light' || act === 'low_heavy' || act === 'back_light' ||
        act === 'throw' || act === 'throw_whiff';

    if (fighter.y > 0.05 && !isAttackAction) {
        const isRising = fighter.vy > 0;
        rig.hips.position.y = baseHipsY + 0.15;
        rig.torso.rotation.z = isRising ? 0.18 : -0.22;
        rig.headGroup.rotation.z = isRising ? 0.22 : -0.15;
        if (rig.legs) {
            if (rig.legs[0]) rig.legs[0].rotation.z = isRising ? 0.35 : 0.15;
            if (rig.legs[1]) rig.legs[1].rotation.z = isRising ? -0.25 : -0.15;
        }
    }

    // --- COURBES D'ANIMATIONS D'ATTAQUE (ANTICIPATION, FRAPPE, RÉCUPÉRATION) ---
    let strike = 0;
    let anticipate = 0;
    if (prog < 0.28) {
        // Anticipation (armement / recul)
        anticipate = Math.sin((prog / 0.28) * (Math.PI * 0.5));
        strike = -anticipate * 0.35;
    } else if (prog < 0.48) {
        // Frappe vive (snap explosif à l'impact)
        const p = (prog - 0.28) / 0.20;
        strike = -0.35 + 1.35 * Math.sin(p * (Math.PI * 0.5));
    } else {
        // Récupération (retour fluide au neutre)
        const p = (prog - 0.48) / 0.52;
        strike = Math.cos(p * (Math.PI * 0.5));
    }
    const swing = Math.max(0, strike);

    // Contexte enrichi transmis aux combattants
    const animCtx = { fighter, rig, id, act, prog, strike, swing, anticipate, baseHipsY, time, dt };

    // --- 1. ANIMATIONS D'ATTENTE (IDLE) & DE MARCHE ---
    if (act === 'idle' || act === 'walk' || act === 'crouch') {
        const isWalk = act === 'walk';
        animCtx.isWalk = isWalk;
        if (fighterImpl.animateIdle) fighterImpl.animateIdle(animCtx);

        if (act === 'crouch') {
            rig.hips.position.y = baseHipsY * 0.65;
            rig.torso.rotation.z = -0.22;
        }
        return;
    }

    // --- 2. CHORÉGRAPHIES D'ATTAQUES ULTRA-LISIBLES (FRAME DATA VISIBLE) ---
    if (isAttackAction) {
        // A. COUPS NORMAUX DIRECTIONNELS (COMMAND NORMALS & ENCHAÎNEMENTS)
        if (act === 'light') {
            // Coup Léger 1 : Attaque vive du côté avant gauche
            rig.hips.position.x = strike * 0.45;
            rig.torso.rotation.z = -strike * 0.32;
            rig.torso.rotation.y = strike * 0.25;
            rig.neck.rotation.z = -strike * 0.30;
            rig.headGroup.rotation.z = -strike * 0.32;
            rig.headGroup.rotation.y = strike * 0.25;
            rig.jaw.rotation.z = -strike * 0.75;
            if (rig.arms && rig.arms[0]) rig.arms[0].rotation.z = strike * 1.25;
        } else if (act === 'light2') {
            // Coup Léger 2 (Combo 1-2) : Frappe croisée opposée du côté droit
            rig.hips.position.x = strike * 0.60;
            rig.torso.rotation.z = -strike * 0.42;
            rig.torso.rotation.y = -strike * 0.35;
            rig.neck.rotation.z = -strike * 0.38;
            rig.headGroup.rotation.z = -strike * 0.45;
            rig.headGroup.rotation.y = -strike * 0.35;
            rig.jaw.rotation.z = -strike * 1.05;
            if (rig.arms && rig.arms[1]) rig.arms[1].rotation.z = strike * 1.35;
            rig.tailSegments.forEach(s => { s.rotation.y = strike * 0.45; });
        } else if (act === 'up_light') {
            // Direction HAUT ⬆️ (Coup vers le haut / Uppercut / Morsure haute ascendante) :
            // Tout le corps s'incline vers le haut, cou et mâchoire jaillissent vers le ciel
            rig.hips.position.y = baseHipsY + strike * 0.65;
            rig.hips.position.x = strike * 0.25;
            rig.torso.rotation.z = strike * 0.58;
            rig.neck.rotation.z = strike * 0.65;
            rig.headGroup.rotation.z = strike * 0.85;
            rig.jaw.rotation.z = -strike * 1.25;
            if (rig.arms) {
                if (rig.arms[0]) rig.arms[0].rotation.z = strike * 1.85;
                if (rig.arms[1]) rig.arms[1].rotation.z = strike * 1.85;
            }
        } else if (act === 'anti_air') {
            // Direction HAUT / ARRIÈRE ⬆️ (Anti-Air Launcher céleste vers le ciel)
            rig.hips.position.y = baseHipsY + strike * 0.85;
            rig.hips.position.x = strike * 0.35;
            rig.torso.rotation.z = strike * 0.65;
            rig.neck.rotation.z = strike * 0.65;
            rig.headGroup.rotation.z = strike * 0.90;
            rig.jaw.rotation.z = -strike * 1.35;
            if (rig.arms) {
                if (rig.arms[0]) rig.arms[0].rotation.z = strike * 1.95;
                if (rig.arms[1]) rig.arms[1].rotation.z = strike * 1.95;
            }
            rig.tailSegments.forEach(s => { s.rotation.z = -strike * 0.55; });
        } else if (act === 'fwd_light') {
            // Direction AVANT ➡️ (Poke / Percée horizontale droit devant)
            rig.hips.position.x = strike * 1.05;
            rig.hips.position.y = baseHipsY * 0.90;
            rig.torso.rotation.z = -strike * 0.38;
            rig.neck.rotation.z = -strike * 0.40;
            rig.headGroup.rotation.z = -strike * 0.30;
            rig.jaw.rotation.z = -strike * 0.85;
            if (rig.arms) {
                if (rig.arms[0]) rig.arms[0].rotation.z = strike * 1.2;
                if (rig.arms[1]) rig.arms[1].rotation.z = strike * 1.2;
            }
        } else if (act === 'fwd_heavy') {
            // Direction AVANT LOURD ➡️ (Charge bélier massive vers l'avant)
            rig.hips.position.x = strike * 1.35;
            rig.torso.rotation.z = -strike * 0.48;
            rig.neck.rotation.z = -strike * 0.50;
            rig.headGroup.rotation.z = -strike * 0.42;
            rig.jaw.rotation.z = -strike * 1.05;
        } else if (act === 'low_light') {
            // Direction BAS ⬇️ (Balayage ras du sol, fauchage des chevilles)
            rig.hips.position.y = baseHipsY * 0.50;
            rig.torso.rotation.z = -0.45;
            rig.torso.rotation.y = Math.cos(prog * Math.PI) * 0.75;
            rig.headGroup.rotation.z = -0.55;
            rig.headGroup.position.y = -0.25;
            rig.jaw.rotation.z = -strike * 0.85;
            rig.tailSegments.forEach((s, i) => {
                s.rotation.y = Math.sin(prog * Math.PI) * 0.95;
                s.rotation.z = -0.35;
            });
            if (rig.legs && rig.legs[0]) rig.legs[0].rotation.y = strike * 1.1;
        } else if (act === 'low_heavy') {
            // Direction BAS LOURD ⬇️ (Écrasement pilonnage lourd au ras du sol)
            rig.hips.position.y = baseHipsY * 0.45;
            rig.torso.rotation.z = -0.55;
            rig.headGroup.rotation.z = -0.72;
            rig.headGroup.position.y = -0.35;
            rig.jaw.rotation.z = -strike * 1.15;
            if (rig.arms) {
                if (rig.arms[0]) rig.arms[0].rotation.z = -strike * 1.45;
                if (rig.arms[1]) rig.arms[1].rotation.z = -strike * 1.45;
            }
            rig.tailSegments.forEach(s => { s.rotation.z = -0.45; s.rotation.y = -strike * 0.95; });
        } else if (act === 'back_light') {
            // Direction ARRIÈRE ⬅️ (Coup défensif en recul)
            rig.hips.position.x = -strike * 0.70;
            rig.torso.rotation.z = strike * 0.32;
            rig.headGroup.rotation.z = strike * 0.22;
            rig.jaw.rotation.z = -strike * 0.68;
            if (rig.arms && rig.arms[0]) rig.arms[0].rotation.z = strike * 1.1;
        } else if (act === 'air_light' || act === 'air_heavy') {
            // Attaque aérienne (Piqué Plongeant vers le sol)
            rig.torso.rotation.z = -0.65;
            rig.headGroup.rotation.z = -0.42;
            rig.jaw.rotation.z = -strike * 0.95;
            if (rig.arms) {
                if (rig.arms[0]) rig.arms[0].rotation.z = strike * 1.35;
                if (rig.arms[1]) rig.arms[1].rotation.z = strike * 1.35;
            }
        } else if (act === 'throw') {
            // Chope (Grapple au corps à corps)
            if (prog < 0.35) {
                rig.hips.position.x = strike * 0.85;
                rig.jaw.rotation.z = -1.25;
            } else if (prog < 0.70) {
                rig.hips.position.x = 0.85;
                rig.torso.rotation.y = Math.sin(prog * 25) * 0.45;
                rig.torso.rotation.z = 0.35;
                rig.jaw.rotation.z = -0.25;
            } else {
                rig.hips.position.x = 0.5;
                rig.torso.rotation.z = -0.45;
                rig.jaw.rotation.z = -0.15;
            }
        } else if (act === 'throw_whiff') {
            // Chope ratée dans le vide (Whiff stumble)
            const whiffDecay = 1 - prog;
            rig.hips.position.x = whiffDecay * 0.55;
            rig.torso.rotation.z = -whiffDecay * 0.35;
            rig.jaw.rotation.z = -whiffDecay * 0.65;
        }

        // B. DÉLÉGATION AUX ATTAQUES SPÉCIALES OU SPÉCIFIQUES À L'ESPÈCE
        const isCustomNormal = fighterImpl.hasCustomDirectionals;
        const supportedByFighter = act === 'light' || act === 'light2' || act === 'heavy' || act === 'fwd_heavy' || act === 'fwd_light' || act === 'low_light' || act === 'low_heavy' || act === 'anti_air' || act === 'up_light' || act === 'back_light' || act === 'throw' || act === 'air_light' || act === 'air_heavy' || act === 'special' || act === 'special2';
        if (fighterImpl.animateAttack && act !== 'throw_whiff' && (isCustomNormal ? supportedByFighter : (act === 'light' || act === 'heavy' || act === 'special' || act === 'special2'))) {
            fighterImpl.animateAttack(animCtx);
        }
        return;
    }

    // --- 3. CHORÉGRAPHIES DE FATALITÉS 3D UNIQUES PAR ESPÈCE ---
    if (act === 'fatality') {
        if (fighterImpl.animateFatality) fighterImpl.animateFatality(animCtx);
    }
}
