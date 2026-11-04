/* ============================================================================
 * ANIMATIONS ANKYLOSAURE : FATALITÉ 3D (PULVÉRISATION CAUDALE)
 * ============================================================================ */

registerFighterAnimation('ankylo', {
    animateFatality(ctx) {
        const { rig, prog } = ctx;
        if (prog < 0.45) {
            rig.hips.rotation.y = Math.sin(prog * Math.PI * 2) * 1.8;
        } else {
            const p = (prog - 0.45) / 0.55;
            rig.hips.rotation.y = p * Math.PI * 4;
            rig.tailSegments.forEach(s => { s.rotation.y = 0.5; s.rotation.z = 0.25; });
        }
    },

    executeFatality(winner, loser) {
        setTimeout(() => {
            if (matchState !== 'fatality_anim') return;
            sfx.playBoneCrack();
            loser.kneeling = true;
            spawn3DBloodAndBones(loser.x, 1.0, 28, true);
            spawnFloatingPopup(loser.x, 'GENOUX BRISÉS !', '#facc15');
        }, 1050);
        setTimeout(() => {
            if (matchState !== 'fatality_anim') return;
            sfx.playBoneCrack();
            sfx.playRoar(60, 0.8);
            loser.decapitated = true;
            loser.isDead = true;
            loser.hp = 0;
            const flyingHead = new THREE.Mesh(
                new THREE.BoxGeometry(0.95, 0.75, 0.75),
                new THREE.MeshStandardMaterial({ color: loser.dino.primaryColor })
            );
            flyingHead.position.set(loser.x, 2.2, 0);
            fxGroup.add(flyingHead);
            particles3D.push({ mesh: flyingHead, vx: winner.facing * 18, vy: 14, vz: 5, life: 1.5 });

            spawn3DBloodAndBones(loser.x, 2.2, 65, true);
            screenShake = 0.95;
            showAnnouncer('FATALITY !', 'HOME-RUN DE L’ANKYLOSAURE');
        }, 2150);
    }
});
