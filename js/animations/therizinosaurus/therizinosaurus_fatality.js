// ============================================================================
// js/animations/therizinosaurus/therizinosaurus_fatality.js — Therizinosaurus Fatality Animations
// ============================================================================

registerFighterAnimation('therizino', {
    animateFatality(ctx) {
        const { rig, prog } = ctx;
        const slashWave = Math.sin(prog * Math.PI * 6);
        rig.torso.rotation.y = slashWave * 0.55;
        rig.arms[0].rotation.z = slashWave * 1.3;
        rig.arms[1].rotation.z = -slashWave * 1.3;
        rig.arms[0].rotation.y = Math.cos(prog * Math.PI * 6) * 0.85;
        rig.arms[1].rotation.y = -Math.cos(prog * Math.PI * 6) * 0.85;
    },

    executeFatality(winner, loser) {
        [750, 1250, 1750].forEach((delay, idx) => {
            setTimeout(() => {
                if (matchState !== 'fatality_anim') return;
                sfx.playBoneCrack();
                const slashGeo = new THREE.BoxGeometry(3.8, 0.14, 0.14);
                const slashMat = new THREE.MeshBasicMaterial({ color: 0xa7f3d0 });
                const slashMesh = new THREE.Mesh(slashGeo, slashMat);
                slashMesh.position.set(loser.x, 2.2, 0.8);
                slashMesh.rotation.z = (idx - 1) * 0.65;
                fxGroup.add(slashMesh);
                particles3D.push({ mesh: slashMesh, vx: 0, vy: 0.5, vz: 0, life: 0.45 });
                spawn3DBloodAndBones(loser.x, 2.3, 25, true);
            }, delay);
        });
        setTimeout(() => {
            if (matchState !== 'fatality_anim') return;
            sfx.playRoar(95, 0.8);
            loser.decapitated = true;
            loser.isDead = true;
            loser.hp = 0;
            spawn3DBloodAndBones(loser.x, 2.6, 75, true);
            screenShake = 0.95;
            showAnnouncer('FATALITY !', 'DÉCOUPE CHIRURGICALE DU THÉRIZINOSAURE');
        }, 2200);
    }
});
