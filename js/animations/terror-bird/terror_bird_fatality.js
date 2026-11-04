/* ============================================================================
 * ANIMATIONS OISEAU DE TERREUR : FATALITÉ 3D (TRÉPANATION SAUVAGE)
 * ============================================================================ */

registerFighterAnimation('terabird', {
    animateFatality(ctx) {
        const { rig, prog, baseHipsY } = ctx;
        if (prog < 0.3) {
            rig.hips.position.y = baseHipsY + Math.sin((prog / 0.3) * Math.PI) * 2.5;
            rig.arms[0].rotation.x = -1.2;
            rig.arms[1].rotation.x = 1.2;
        } else if (prog < 0.78) {
            rig.neck.rotation.z = -Math.abs(Math.sin(prog * 38)) * 1.05;
        } else {
            rig.torso.rotation.z = 0.35;
            rig.neck.rotation.z = 0.45;
            rig.arms[0].rotation.x = -1.1;
            rig.arms[1].rotation.x = 1.1;
        }
    },

    executeFatality(winner, loser) {
        [900, 1250, 1600].forEach(delay => {
            setTimeout(() => {
                if (matchState !== 'fatality_anim') return;
                sfx.playHit(true);
                spawn3DBloodAndBones(loser.x, 2.1, 18, false);
            }, delay);
        });
        setTimeout(() => {
            if (matchState !== 'fatality_anim') return;
            sfx.playBoneCrack();
            sfx.playRoar(130, 0.7);
            loser.isDead = true;
            loser.hp = 0;
            const heart = new THREE.Mesh(
                new THREE.SphereGeometry(0.38, 10, 10),
                new THREE.MeshStandardMaterial({ color: 0xdc2626, emissive: 0x991b1b })
            );
            heart.position.set(winner.x + winner.facing * 1.3, 3.8, 0);
            fxGroup.add(heart);
            particles3D.push({ mesh: heart, vx: 0, vy: 1.2, vz: 0, life: 1.5 });

            spawn3DBloodAndBones(loser.x, 2.3, 65, true);
            screenShake = 0.85;
            showAnnouncer('FATALITY !', 'CŒUR ARRACHÉ PAR LE TERABIRD');
        }, 2100);
    }
});
