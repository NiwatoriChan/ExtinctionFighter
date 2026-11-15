// ============================================================================
// js/animations/quetzalcoatlus/quetzalcoatlus_fatality.js — Quetzalcoatlus Fatality Animations
// ============================================================================

registerFighterAnimation('quetzal', {
    // Chorégraphie 3D de la fatalité
    animateFatality(ctx) {
        const { fighter, rig, prog, baseHipsY, time } = ctx;
        const sp = rig.specialParts;

        rig.hips.position.y = baseHipsY + Math.sin(prog * Math.PI) * 4.5;

        const flap = Math.sin((time || prog * 6.0) * 10.5) * 0.68;
        rig.torso.rotation.z = -0.18;
        rig.neck.rotation.z = -0.14;
        rig.headGroup.rotation.z = 0.22;
        rig.jaw.rotation.z = -0.35;
        if (sp.leftWing && sp.rightWing) {
            sp.leftWing.rotation.set(flap, 0.20, 0);
            sp.rightWing.rotation.set(-flap, -0.20, 0);
        }
        if (rig.arms.length >= 2) {
            rig.arms[0].rotation.set(0, 0, 0);
            rig.arms[1].rotation.set(0, 0, 0);
        }
        if (rig.legs.length >= 2) {
            rig.legs[0].rotation.z = -0.52;
            rig.legs[1].rotation.z = -0.48;
        }
    },

    // Script de la fatalité (sons, sang, effets, annonce)
    executeFatality(winner, loser) {
        // 12) QUETZALCOATLUS : Enlèvement aérien et écrasement terminal
        setTimeout(() => {
            if (matchState !== 'fatality_anim') return;
            sfx.playRoar(160, 0.5);
            loser.y = 8;
            spawnFloatingPopup(loser.x, 'CHUTE VERTIGINEUSE !', '#38bdf8');
        }, 1000);
        setTimeout(() => {
            if (matchState !== 'fatality_anim') return;
            loser.y = 0;
            sfx.playBoneCrack();
            sfx.playHit(true);
            loser.flattened = true;
            loser.isDead = true;
            loser.hp = 0;
            spawn3DBloodAndBones(loser.x, 0.5, 80, true);
            screenShake = 1.0;
            showAnnouncer('FATALITY !', 'CHUTE STRATOSPHÉRIQUE DU QUETZALCOATLUS');
        }, 2250);
    }
});
