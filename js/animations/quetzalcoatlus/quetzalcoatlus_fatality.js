// ============================================================================
// js/animations/quetzalcoatlus/quetzalcoatlus_fatality.js — Quetzalcoatlus Fatality Animations
// ============================================================================

registerFighterAnimation('quetzal', {
    // Chorégraphie 3D de la fatalité
    animateFatality(ctx) {
        const { fighter, rig, prog, baseHipsY, time } = ctx;
        const sp = rig.specialParts;
        const qRig = sp && sp.qRig;

        rig.hips.position.y = baseHipsY + Math.sin(prog * Math.PI) * 4.5;

        if (sp && qRig) {
            sp.applyPoseMode('soar', time || (prog * 6.0), {
                flapFreq: 8.5,
                flapAmp: 1.35,
                rootY: 2.05
            });
            qRig.rootJoint.rotation.x = 0.22;
            qRig.neckSegments.forEach((seg, i) => {
                seg.rotation.set(i === 0 ? 0.24 : 0.04, 0, 0);
            });
            qRig.setHeadRot(-0.28, 0, 0);
            qRig.setJawRot(0.35);
            sp.updateAnatomicalSkin(time || (prog * 6.0), fighter, 'soar');
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
