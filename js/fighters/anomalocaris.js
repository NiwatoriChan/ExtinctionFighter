/* ============================================================================
 * COMBATTANT : ANOMALOCARIS (Anomalocaris Canadensis Titan)
 * Boss déblocable de l'Ère du Cambrien & Personnage Jouable Complet
 * Reconstitution anatomique haute fidélité (Schiste de Burgess / Daley & Budd) :
 * - Carapace céphalique tri-sclérite (Sclérite dorsal H + sclérites latéraux P)
 * - 2 Yeux composés sphéroïdaux géants (~16 000 facettes) sur pédoncules articulés
 * - 2 Appendices frontaux raptoriaux segmentés à 14 podomères et endites épineux
 *   armés d'épines auxiliaires incurvées pour capturer les trilobites
 * - Cône oral triradial de Peytoia aux 3 grandes plaques dominantes et 32 plaques
 *   denticulées avec rangées internes de dents broyeuses chitineuses
 * - Tronc métamérisé hydrodynamique à crête dorsale et carénage segmentaire
 * - 11 PAIRES DE LOBES NATATOIRES LATÉRAUX (22 flaps articulés) à battement métachronique
 *   surmontés de bandes branchiales sétifères dorsales (peignes de lamelles)
 * - Furca caudale tri-lobée relevée à 35° formant stabilisateur hydrodynamique
 * ============================================================================ */

registerFighter({
    id: 'anomalocaris',
    name: 'ANOMALOCARIS',
    fullName: 'Anomalocaris Canadensis Titan',
    role: 'Super-Prédateur Radiodonte',
    title: '« Le Titan Abyssal de l\'Explosion Cambrienne »',
    primaryColor: 0x3e5c63,
    secondaryColor: 0x18272c,
    accentColor: 0x9e733b,
    cssPrimary: '#3e5c63',
    scale: 0.95,
    previewScale: 1.05,
    stats: { pow: 96, spd: 92, def: 88 },
    maxHp: 1100,
    walkSpeed: 8.8,
    jumpVy: 12.8,
    special1Name: 'Vortex Hydro-Sismique (H)',
    special2Name: 'Broyeur Raptorial (T)',
    fatalityName: 'Broyage Abyssal de Peytoia (R)',
    moveStyle: 'Nage hydrodynamique à 11 paires de lobes natatoires, carénage dorsal cyan bioluminescent et griffes raptoriales à 14 podomères.',
    fatalityDesc: 'Enserre le rival de ses appendices épineux, le broie dans son cône buccal triradial de Peytoia aux 32 plaques denticulées, et le dissout dans un vortex abyssal.',
    skins: [
        { name: 'Burgess Shale Slate', primary: 0x3e5c63, secondary: 0x18272c, accent: 0x9e733b },
        { name: 'Cambrian Ochre', primary: 0xb59b78, secondary: 0x5c4328, accent: 0xa67438 },
        { name: 'Pelagic Moss', primary: 0x8ea392, secondary: 0x37473a, accent: 0x8c7b56 }
    ]
}, {
    animBaseHipsY: 1.25,

    onSpecial(attacker, defender, dist, basePow) {
        if (typeof sfx !== 'undefined' && sfx.playWhoosh) sfx.playWhoosh();
        if (typeof spawn3DProjectile === 'function') {
            spawn3DProjectile(attacker, 'hydro');
        }
    },

    onSpecial2(attacker, defender, dist, basePow) {
        if (defender && dist < 2.8 && (typeof isWithinVerticalHitBand !== 'function' || isWithinVerticalHitBand(attacker, defender, 2.2, 1.8))) {
            if (typeof sfx !== 'undefined' && sfx.playHit) sfx.playHit(true);
            if (typeof spawnHitSparks3D === 'function') {
                spawnHitSparks3D(defender.x, (defender.y || 0) + 1.2, true);
            }
            applyDamage(attacker, defender, Math.round(basePow * 1.25), true, '🦞 ÉTREINTE RAPTORIALE !');
        } else {
            attacker.vx = (attacker.facing || 1) * 16;
        }
    },

    onFatality(attacker, defender, dist) {
        if (typeof sfx !== 'undefined' && sfx.playGong) sfx.playGong();
        if (typeof spawnFloatingPopup === 'function') {
            spawnFloatingPopup(defender.x, '🌊 DÉVOREMENT DE PEYTOIA !', '#06b6d4');
        }
        for (let i = 0; i < 6; i++) {
            setTimeout(() => {
                if (typeof spawnHitSparks3D === 'function') {
                    spawnHitSparks3D(defender.x, (defender.y || 0) + 0.8 + i * 0.25, true);
                }
                if (typeof spawn3DBloodAndBones === 'function') {
                    spawn3DBloodAndBones(defender.x, (defender.y || 0) + 1.0, 4, false);
                }
            }, i * 90);
        }
    },


    animateIdle(ctx) {
        const { rig, baseHipsY, time } = ctx;
        if (!rig || !rig.specialParts) return;
        const flaps = rig.specialParts.swimmingFlaps;
        if (flaps) {
            flaps.forEach(fl => {
                const wave = Math.sin(time * 6.5 + fl.index * 0.40) * 0.28;
                fl.left.rotation.x = wave * 0.3;
                fl.left.rotation.z = 0.12 + wave;
                fl.right.rotation.x = -wave * 0.3;
                fl.right.rotation.z = -0.12 - wave;
            });
        }
        if (rig.specialParts.tailFan) {
            rig.specialParts.tailFan.rotation.y = Math.sin(time * 3.8) * 0.16;
            rig.specialParts.tailFan.rotation.z = 0.35 + Math.cos(time * 2.8) * 0.07;
        }
        if (rig.specialParts.raptorialClaws) {
            rig.specialParts.raptorialClaws.forEach((c, idx) => {
                c.root.rotation.z = -0.15 + Math.sin(time * 3.2 + idx) * 0.10;
            });
        }
        if (rig.hips) {
            rig.hips.position.y = baseHipsY + Math.sin(time * 2.8) * 0.15;
        }
    },

    animateWalk(ctx) {
        const { rig, baseHipsY, time } = ctx;
        if (!rig || !rig.specialParts) return;
        const flaps = rig.specialParts.swimmingFlaps;
        if (flaps) {
            flaps.forEach(fl => {
                const wave = Math.sin(time * 12.0 + fl.index * 0.55) * 0.45;
                fl.left.rotation.x = wave * 0.4;
                fl.left.rotation.z = 0.2 + wave;
                fl.right.rotation.x = -wave * 0.4;
                fl.right.rotation.z = -0.2 - wave;
            });
        }
        if (rig.specialParts.tailFan) {
            rig.specialParts.tailFan.rotation.y = Math.sin(time * 8.0) * 0.32;
        }
        if (rig.specialParts.raptorialClaws) {
            rig.specialParts.raptorialClaws.forEach((c, idx) => {
                c.root.rotation.z = 0.25 + Math.sin(time * 6.0 + idx) * 0.18;
            });
        }
        if (rig.hips) {
            rig.hips.position.y = baseHipsY + Math.sin(time * 5.0) * 0.12;
        }
        if (rig.torso) {
            rig.torso.rotation.z = -0.12;
        }
    },

    animateJump(ctx) {
        const { fighter, rig, baseHipsY } = ctx;
        if (!rig || !rig.specialParts) return;
        const isRising = fighter.vy > 0;
        if (rig.hips) {
            rig.hips.position.y = baseHipsY + 0.3;
        }
        if (rig.torso) {
            rig.torso.rotation.z = isRising ? 0.35 : -0.25;
        }
        const flaps = rig.specialParts.swimmingFlaps;
        if (flaps) {
            flaps.forEach(fl => {
                fl.left.rotation.z = isRising ? 0.65 : -0.35;
                fl.right.rotation.z = isRising ? -0.65 : 0.35;
            });
        }
        if (rig.specialParts.raptorialClaws) {
            rig.specialParts.raptorialClaws.forEach(c => {
                c.root.rotation.z = isRising ? -0.45 : 0.35;
            });
        }
    },

    animateAttack(ctx) {
        const { rig, act, strike } = ctx;
        if (!rig || !rig.specialParts) return;
        if (rig.specialParts.raptorialClaws) {
            rig.specialParts.raptorialClaws.forEach((claw, cIdx) => {
                if (act === 'heavy' || act === 'fwd_heavy') {
                    claw.root.rotation.z = -0.3 + strike * 1.6;
                    claw.root.rotation.y = (cIdx === 0 ? 1 : -1) * (0.45 - strike * 0.7);
                } else if (act === 'special' || act === 'special2') {
                    claw.root.rotation.z = 0.45 - strike * 1.5;
                    claw.root.rotation.y = (cIdx === 0 ? 0.4 : -0.4);
                } else {
                    claw.root.rotation.z = (cIdx === 0 ? strike : 0) * 1.2 - 0.2;
                }
            });
        }
        if (rig.jaw) {
            rig.jaw.rotation.z = strike * 0.4;
        }
    },

    animateFatality(ctx) {
        const { rig, prog } = ctx;
        if (!rig || !rig.specialParts) return;
        if (rig.specialParts.raptorialClaws) {
            const clamp = Math.sin(prog * Math.PI * 4) * 0.5;
            rig.specialParts.raptorialClaws.forEach((claw, cIdx) => {
                claw.root.rotation.z = 0.5 + clamp;
                claw.root.rotation.y = (cIdx === 0 ? 0.5 : -0.5);
            });
        }
        if (rig.jaw) {
            rig.jaw.rotation.z = Math.sin(prog * Math.PI * 8) * 0.5;
        }
    }
});
