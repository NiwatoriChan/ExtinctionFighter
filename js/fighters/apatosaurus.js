/* ============================================================================
 * COMBATTANT : APATOSAURE (Apatosaurus Ajax)
 * Données (stats, skins, textes), modèle 3D, animations, coups spéciaux & fatalité.
 * ============================================================================ */

registerFighter({
    id: 'apato',
    name: 'APATOSAURE',
    fullName: 'Apatosaurus Ajax',
    role: 'Titan Sismique',
    title: '« Le Fléau des Tempêtes »',
    primaryColor: 0x7c3aed,
    secondaryColor: 0x4c1d95,
    accentColor: 0x38bdf8,
    cssPrimary: '#7c3aed',
    scale: 1.25,
    stats: { pow: 98, spd: 58, def: 94 },
    maxHp: 1250,
    walkSpeed: 6.2,
    special1Name: 'Fouet Caudal Supersonique (H)',
    special2Name: 'Piétinement Sismique (T)',
    fatalityName: 'Écrasement Titanesque (R)',
    moveStyle: 'Pas titanesque faisant trembler le sol, claquement de queue supersonique.',
    fatalityDesc: 'Dresse ses pattes antérieures dans le ciel orageux et s’abat de tout son poids de 30 tonnes, réduisant la victime en purée sous ses sabots.',
    skins: [
        { name: 'Royal Titan', primary: 0x7c3aed, secondary: 0x4c1d95, accent: 0x38bdf8 },
        { name: 'Mossy Mountain', primary: 0x15803d, secondary: 0x14532d, accent: 0x86efac },
        { name: 'Sand Behemoth', primary: 0x92400e, secondary: 0x78350f, accent: 0xfde68a },
        { name: 'Cosmic Nebula', primary: 0x1e1b4b, secondary: 0x0f172a, accent: 0xc4b5fd }
    ]
}, {
    // Hauteur de base du bassin utilisée par le système d'animation
    animBaseHipsY: 2.1,

    // Portée allongée des attaques légères/lourdes (long cou)
    attackReach: 4.3,
    // Spécial 1 (H) : fouet caudal à distance au lieu de la charge par défaut
    onSpecial(attacker, defender, dist, basePow) {
        if (dist < 6.4) {
            applyDamage(attacker, defender, Math.round(basePow * 1.15), true, 'FOUET SUPERSONIQUE !');
        }
    },
    // Spécial 2 (T)
    onSpecial2(attacker, defender, dist, basePow) {
        special2SeismicQuake(attacker, defender, dist, basePow);
    },

    // Construction du modèle 3D articulé
    buildRig(ctx) {
        const { hips, rig, addMesh, bodyMat, darkMat, accentMat, eyeMat } = ctx;
        hips.position.y = 2.05;
        // Corps monumental de Sauropode
        addMesh(new THREE.BoxGeometry(2.6, 1.65, 1.55), bodyMat, rig.torso, 0, 0.25, 0);
        addMesh(new THREE.BoxGeometry(2.2, 0.4, 1.35), darkMat, rig.torso, 0.1, 1.0, 0);

        // Long cou articulé en 3 segments
        let pNeck = rig.torso;
        const neckSegments = [];
        for (let n = 0; n < 3; n++) {
            const nSeg = new THREE.Group();
            if (n === 0) nSeg.position.set(1.15, 0.75, 0);
            else nSeg.position.set(0.65, 0.65, 0);
            const thick = 0.68 - n * 0.12;
            addMesh(new THREE.BoxGeometry(0.95, thick, thick), n % 2 === 0 ? bodyMat : darkMat, nSeg, 0.35, 0.35, 0, 0, 0, 0.65);
            pNeck.add(nSeg);
            neckSegments.push(nSeg);
            pNeck = nSeg;
        }
        rig.neck = neckSegments[0];
        rig.specialParts.neckSegments = neckSegments;

        // Tête tout en haut du cou
        rig.headGroup.position.set(0.65, 0.65, 0);
        pNeck.add(rig.headGroup);
        addMesh(new THREE.BoxGeometry(0.85, 0.48, 0.55), darkMat, rig.headGroup, 0.3, 0, 0);
        addMesh(new THREE.SphereGeometry(0.08, 8, 8), eyeMat, rig.headGroup, 0.35, 0.1, 0.28);
        addMesh(new THREE.SphereGeometry(0.08, 8, 8), eyeMat, rig.headGroup, 0.35, 0.1, -0.28);

        // Longue queue fouet (5 segments)
        let pTail = rig.torso;
        for (let s = 0; s < 5; s++) {
            const seg = new THREE.Group();
            seg.position.set(s === 0 ? -1.25 : -0.85, s === 0 ? 0.2 : 0, 0);
            const thick = 0.72 * Math.pow(0.7, s);
            addMesh(new THREE.BoxGeometry(0.92, thick, thick), s % 2 === 0 ? bodyMat : accentMat, seg, -0.42, 0, 0);
            pTail.add(seg);
            rig.tailSegments.push(seg);
            pTail = seg;
        }

        // 4 Piliers massifs
        [
            { x: 0.92, z: -0.62 }, { x: 0.92, z: 0.62 },
            { x: -0.92, z: -0.62 }, { x: -0.92, z: 0.62 }
        ].forEach((pos, idx) => {
            const leg = new THREE.Group();
            leg.position.set(pos.x, 0, pos.z);
            addMesh(new THREE.CylinderGeometry(0.32, 0.36, 1.95, 8), idx < 2 ? bodyMat : darkMat, leg, 0, -0.95, 0);
            hips.add(leg);
            rig.legs.push(leg);
        });
    },

    // Animation d'attente (idle) / de marche
    animateIdle(ctx) {
        const { rig, baseHipsY, time, isWalk } = ctx;
        // Apatosaure : Marche colossale + ondulation en S du long cou et de la queue fouet
        const freq = isWalk ? 7.5 : 2.5;
        rig.hips.position.y = baseHipsY + Math.abs(Math.sin(time * freq)) * (isWalk ? 0.18 : 0.04);
        rig.specialParts.neckSegments.forEach((nSeg, i) => {
            nSeg.rotation.z = Math.sin(time * 3 - i * 0.6) * 0.1;
            nSeg.rotation.y = Math.cos(time * 2.5 - i * 0.5) * 0.08;
        });
        rig.tailSegments.forEach((seg, i) => {
            seg.rotation.y = Math.sin(time * 6 - i * 0.6) * 0.22;
        });
        const s = isWalk ? Math.sin(time * freq) * 0.35 : 0;
        rig.legs[0].rotation.z = s;
        rig.legs[3].rotation.z = s;
        rig.legs[1].rotation.z = -s;
        rig.legs[2].rotation.z = -s;
    },

    hasCustomDirectionals: true,

    // Animations d'attaques (light / heavy / special / special2 / xray)
    animateAttack(ctx) {
        const { rig, act, prog, swing, baseHipsY } = ctx;
        if (act === 'light') {
            // Grand balayage du long cou vers la gauche
            rig.specialParts.neckSegments.forEach((nSeg, i) => {
                nSeg.rotation.z = -swing * (0.42 - i * 0.08);
                nSeg.rotation.y = swing * 0.45;
            });
            rig.headGroup.rotation.y = swing * 0.55;
        } else if (act === 'light2') {
            // Coup de cou en retour vers la droite
            rig.specialParts.neckSegments.forEach((nSeg, i) => {
                nSeg.rotation.z = -swing * (0.35 - i * 0.06);
                nSeg.rotation.y = -swing * 0.45;
            });
            rig.headGroup.rotation.y = -swing * 0.55;
        } else if (act === 'fwd_light') {
            // Harponnage perforant du cou en avant
            rig.hips.position.x = swing * 0.8;
            rig.specialParts.neckSegments.forEach((nSeg, i) => {
                nSeg.rotation.z = -swing * 0.38;
            });
            rig.headGroup.position.x = swing * 0.6;
        } else if (act === 'low_light' || act === 'low_heavy') {
            // Direction BAS ⬇️ (Balayage bas) : Fouet caudal au ras du sol fauchant l'ennemi
            rig.hips.rotation.y = Math.PI * swing * 0.75;
            rig.hips.position.y = baseHipsY - swing * 0.2;
            rig.tailSegments.forEach((s, i) => {
                s.rotation.y = Math.sin(prog * Math.PI * 2 - i * 0.3) * 0.6;
                s.position.y = -swing * 0.25;
            });
        } else if (act === 'anti_air' || act === 'up_light') {
            // Direction HAUT ⬆️ (Anti-Air Launcher / Ciel) : Cabré sauropode avec cou et tête projetés vers le ciel
            rig.hips.rotation.z = swing * 0.7;
            rig.specialParts.neckSegments.forEach(n => { n.rotation.z = swing * 0.45; });
            rig.headGroup.rotation.z = swing * 0.6;
        } else if (act === 'back_light') {
            // Direction ARRIÈRE ⬅️ : Retrait du cou et coup de fouet protecteur
            rig.hips.position.x = -swing * 0.65;
            rig.specialParts.neckSegments.forEach(n => { n.rotation.z = swing * 0.35; });
        } else if (act === 'air_light' || act === 'air_heavy') {
            rig.hips.rotation.z = -swing * 0.4;
            rig.legs.forEach(l => { l.rotation.z = swing * 0.6; });
        } else if (act === 'fwd_heavy') {
            // Épaulement colossale en charge
            rig.hips.position.x = swing * 1.2;
            rig.torso.rotation.z = -swing * 0.45;
            rig.specialParts.neckSegments.forEach(n => { n.rotation.z = -swing * 0.5; });
        } else if (act === 'throw') {
            // Écope au cou et projection par-dessus bord
            rig.specialParts.neckSegments.forEach(n => { n.rotation.z = -swing * 0.6; });
            rig.headGroup.rotation.z = swing * 0.9;
        } else if (act === 'throw_whiff') {
            rig.hips.position.x = swing * 0.35;
            rig.specialParts.neckSegments.forEach(n => { n.rotation.z = -swing * 0.3; });
        } else if (act === 'heavy' || act === 'special2') {
            // Cabré titanesque et piétinement sismique
            rig.hips.rotation.z = Math.sin(prog * Math.PI) * 0.58;
            rig.legs[0].rotation.z = swing * 0.7;
            rig.legs[1].rotation.z = swing * 0.7;
        } else if (act === 'special') {
            // Claquement de queue Fouet Supersonique
            rig.hips.rotation.y = Math.PI * swing;
            rig.tailSegments.forEach((s, i) => {
                s.rotation.y = Math.sin(prog * Math.PI * 2 - i * 0.3) * 0.55;
            });
        }
    },

    // Chorégraphie 3D de la fatalité
    animateFatality(ctx) {
        const { rig, prog, baseHipsY } = ctx;
        // APATOSAURE : Se cabre très haut sur ses pattes arrière puis écrase l'adversaire au sol
        if (prog < 0.58) {
            const p = prog / 0.58;
            rig.hips.rotation.z = p * 0.95;
            rig.hips.position.y = baseHipsY + p * 1.4;
            rig.legs[0].rotation.z = 0.8;
            rig.legs[1].rotation.z = 0.8;
        } else {
            rig.hips.rotation.z = -0.18;
            rig.hips.position.y = baseHipsY * 0.85;
        }
    },

    // Script de la fatalité (sons, sang, effets, annonce)
    executeFatality(winner, loser) {
        // 4) APATOSAURE : Se cabre très haut puis écrase l'adversaire comme une crêpe
        setTimeout(() => {
            if (matchState !== 'fatality_anim') return;
            sfx.playRoar(50, 0.9);
            spawnFloatingPopup(winner.x, 'TITAN EN HAUTEUR !', '#2dd4bf');
        }, 900);
        setTimeout(() => {
            if (matchState !== 'fatality_anim') return;
            sfx.playBoneCrack();
            loser.flattened = true;
            loser.isDead = true;
            loser.hp = 0;
            spawn3DBloodAndBones(loser.x, 0.6, 80, true);
            screenShake = 1.2;
            showAnnouncer('FATALITY !', 'ÉCRASEMENT TITANESQUE');
        }, 2050);
    },
});
