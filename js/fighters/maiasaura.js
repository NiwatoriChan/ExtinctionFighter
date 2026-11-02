/* ============================================================================
 * COMBATTANT : MAIASAURA (Maiasaura Peeblesorum)
 * Données (stats, skins, textes), modèle 3D, animations, coups spéciaux & fatalité.
 * ============================================================================ */

registerFighter({
    id: 'maiasaura',
    name: 'MAIASAURA',
    fullName: 'Maiasaura Peeblesorum',
    role: 'Protectrice Féroce',
    title: '« La Bonne Mère Indomptable »',
    primaryColor: 0x10b981,
    secondaryColor: 0x065f46,
    accentColor: 0xfbbf24,
    cssPrimary: '#10b981',
    scale: 0.98,
    stats: { pow: 82, spd: 86, def: 78 },
    maxHp: 980,
    walkSpeed: 9.2,
    special1Name: 'Ruade Maternelle (H)',
    special2Name: 'Cri d’Alerte Sonique (T)',
    fatalityName: 'Frénésie du Nid (R)',
    moveStyle: 'Galop agile à deux et quatre pattes, ruades foudroyantes et ondes sonores stridentes.',
    fatalityDesc: 'Pousse un hurlement qui paralyse le système nerveux adverse, puis piétine frénétiquement le torse de la victime jusqu’à dislocation complète.',
    skins: [
        { name: 'Matriarch Flora', primary: 0x10b981, secondary: 0x065f46, accent: 0xfbbf24 },
        { name: 'Autumn Ember', primary: 0xb45309, secondary: 0x9a3412, accent: 0xfed7aa },
        { name: 'Cherry Blossom', primary: 0xbe185d, secondary: 0x9d174d, accent: 0xfce7f3 },
        { name: 'Silver Meadow', primary: 0x475569, secondary: 0x334155, accent: 0x38bdf8 }
    ]
}, {
    // Hauteur de base du bassin utilisée par le système d'animation
    animBaseHipsY: 2.1,

    // Spécial 2 (T)
    onSpecial2(attacker, defender, dist, basePow) {
        spawn3DProjectile(attacker, 'sonic');
    },

    // Construction du modèle 3D articulé
    buildRig(ctx) {
        const { hips, rig, addMesh, bodyMat, darkMat, accentMat, eyeMat } = ctx;
        hips.position.y = 1.95;
        // Corps athlétique d'Hadrosaure
        addMesh(new THREE.BoxGeometry(2.15, 1.2, 1.15), bodyMat, rig.torso, 0, 0.15, 0, 0, 0, 0.12);
        // Bandes bioluminescentes sur les flancs
        addMesh(new THREE.BoxGeometry(1.75, 0.18, 1.22), accentMat, rig.torso, 0, 0.25, 0, 0, 0, 0.12);

        // Cou & Tête à bec de canard + Crête acoustique
        rig.neck.position.set(0.95, 0.55, 0);
        rig.torso.add(rig.neck);
        addMesh(new THREE.BoxGeometry(0.6, 0.85, 0.65), darkMat, rig.neck, 0.15, 0.35, 0, 0, 0, -0.35);

        rig.headGroup.position.set(0.35, 0.78, 0);
        rig.neck.add(rig.headGroup);
        addMesh(new THREE.BoxGeometry(0.85, 0.48, 0.65), bodyMat, rig.headGroup, 0.2, 0.05, 0);
        // Bec de canard plat
        addMesh(new THREE.BoxGeometry(0.65, 0.22, 0.58), accentMat, rig.headGroup, 0.72, -0.05, 0);
        // Crête acoustique lumineuse
        const crest = addMesh(new THREE.ConeGeometry(0.18, 0.55, 5), accentMat, rig.headGroup, 0.15, 0.48, 0, 0, 0, 0.35);
        rig.specialParts.sonicCrest = crest;

        addMesh(new THREE.SphereGeometry(0.08, 8, 8), eyeMat, rig.headGroup, 0.28, 0.14, 0.34);
        addMesh(new THREE.SphereGeometry(0.08, 8, 8), eyeMat, rig.headGroup, 0.28, 0.14, -0.34);

        // Bras agiles
        [-0.52, 0.52].forEach(zOff => {
            const arm = new THREE.Group();
            arm.position.set(0.78, -0.1, zOff);
            addMesh(new THREE.BoxGeometry(0.65, 0.22, 0.22), darkMat, arm, 0.25, -0.2, 0, 0, 0, -0.6);
            rig.torso.add(arm);
            rig.arms.push(arm);
        });

        // Queue équilibrante
        let pTail = rig.torso;
        for (let s = 0; s < 4; s++) {
            const seg = new THREE.Group();
            seg.position.set(s === 0 ? -1.05 : -0.75, 0, 0);
            const w = 0.7 * Math.pow(0.75, s);
            addMesh(new THREE.BoxGeometry(0.8, w, w * 0.75), s % 2 === 0 ? darkMat : bodyMat, seg, -0.35, 0, 0);
            pTail.add(seg);
            rig.tailSegments.push(seg);
            pTail = seg;
        }

        // Jambes de sprinteuse
        [-0.5, 0.5].forEach(zOff => {
            const leg = new THREE.Group();
            leg.position.set(-0.15, 0, zOff);
            addMesh(new THREE.BoxGeometry(0.62, 1.05, 0.44), bodyMat, leg, 0, -0.45, 0);
            addMesh(new THREE.BoxGeometry(0.4, 1.0, 0.36), darkMat, leg, -0.08, -1.35, 0);
            addMesh(new THREE.BoxGeometry(0.75, 0.22, 0.45), accentMat, leg, 0.15, -1.85, 0);
            hips.add(leg);
            rig.legs.push(leg);
        });
    },

    // Animation d'attente (idle) / de marche
    animateIdle(ctx) {
        const { rig, baseHipsY, time, isWalk } = ctx;
        // Maiasaura : Rebond agile de sprinteuse
        const freq = isWalk ? 14 : 5;
        rig.hips.position.y = baseHipsY + Math.abs(Math.sin(time * freq)) * (isWalk ? 0.28 : 0.08);
        rig.neck.rotation.z = Math.sin(time * freq) * 0.1;
        rig.legs[0].rotation.z = isWalk ? Math.sin(time * freq) * 0.62 : 0;
        rig.legs[1].rotation.z = isWalk ? -Math.sin(time * freq) * 0.62 : 0;
    },

    hasCustomDirectionals: true,

    // Animations d'attaques (light / heavy / special / special2 / xray)
    animateAttack(ctx) {
        const { rig, act, prog, swing, baseHipsY } = ctx;
        if (act === 'light') {
            // Frappe de sabot gauche rapide
            rig.arms[0].rotation.z = swing * 1.2;
            rig.headGroup.rotation.z = -swing * 0.35;
        } else if (act === 'light2') {
            // Coup croisé de sabot droit
            rig.arms[1].rotation.z = swing * 1.2;
            rig.headGroup.rotation.z = swing * 0.35;
        } else if (act === 'fwd_light') {
            // Coup de boule de la crête en avant
            rig.hips.position.x = swing * 0.75;
            rig.neck.rotation.z = -swing * 0.6;
            rig.headGroup.rotation.z = -swing * 0.45;
        } else if (act === 'low_light' || act === 'low_heavy') {
            // Direction BAS ⬇️ (Balayage bas) : Balayage caudal bas
            rig.hips.position.y = baseHipsY - swing * 0.3;
            rig.tailSegments.forEach(s => { s.rotation.y = -swing * 0.85; });
        } else if (act === 'anti_air' || act === 'up_light') {
            // Direction HAUT ⬆️ (Anti-Air Launcher / Ciel) : Émission ultrasonique vers le ciel
            rig.neck.rotation.z = swing * 0.75;
            rig.headGroup.rotation.z = swing * 0.55;
            if (rig.specialParts.sonicCrest) rig.specialParts.sonicCrest.scale.setScalar(1 + swing * 0.5);
        } else if (act === 'back_light') {
            // Direction ARRIÈRE ⬅️ : Pas de recul et onde de crête préventive
            rig.hips.position.x = -swing * 0.7;
            rig.headGroup.rotation.z = swing * 0.45;
        } else if (act === 'air_light' || act === 'air_heavy') {
            rig.hips.rotation.z = -swing * 0.4;
            rig.legs[0].rotation.z = swing * 0.9;
        } else if (act === 'fwd_heavy') {
            // Ruée sonique lourde
            rig.hips.position.x = swing * 1.1;
            rig.neck.rotation.z = -swing * 0.55;
            rig.arms[0].rotation.z = swing * 1.2;
            rig.arms[1].rotation.z = swing * 1.2;
        } else if (act === 'throw') {
            // Prise rapprochée et souffle sonique à bout portant
            rig.arms[0].rotation.z = 0.8;
            rig.arms[1].rotation.z = 0.8;
            rig.headGroup.rotation.z = -0.6;
        } else if (act === 'throw_whiff') {
            rig.hips.position.x = swing * 0.35;
            rig.arms[0].rotation.z = 0.5;
        } else if (act === 'heavy' || act === 'special2') {
            // Salto / Ruée de coups de pied sautés
            rig.hips.position.y = baseHipsY + swing * 1.35;
            rig.hips.rotation.z = prog * Math.PI * 2;
            rig.legs[0].rotation.z = 0.85;
            rig.legs[1].rotation.z = -0.85;
        } else if (act === 'special') {
            // Onde Ultrasonique de la crête
            rig.neck.rotation.z = -swing * 0.35;
            rig.headGroup.rotation.z = swing * 0.25;
        }
    },

    // Chorégraphie 3D de la fatalité
    animateFatality(ctx) {
        const { rig, prog } = ctx;
        // MAIASAURA : Concentre un faisceau ultrasonique continu qui fait gonfler et exploser la tête ennemie
        rig.torso.rotation.z = -0.22;
        rig.neck.rotation.z = -0.3 + Math.sin(prog * 60) * 0.08;
        rig.specialParts.sonicCrest.scale.setScalar(1 + Math.sin(prog * 50) * 0.4);
    },

    // Script de la fatalité (sons, sang, effets, annonce)
    executeFatality(winner, loser) {
        // 5) MAIASAURA : Salves d'anneaux ultrasoniques qui font gonfler et exploser le crâne
        const sonicInterval = setInterval(() => {
            if (matchState !== 'fatality_anim') { clearInterval(sonicInterval); return; }
            spawn3DProjectile(winner, 'sonic');
            loser.rig.headGroup.scale.multiplyScalar(1.22);
        }, 320);

        setTimeout(() => {
            clearInterval(sonicInterval);
            if (matchState !== 'fatality_anim') return;
            sfx.playBoneCrack();
            loser.decapitated = true;
            loser.isDead = true;
            loser.hp = 0;
            spawn3DBloodAndBones(loser.x, 2.8, 75, true);
            screenShake = 0.9;
            showAnnouncer('FATALITY !', 'EXPLOSION ULTRASONIQUE');
        }, 2150);
    },
});
