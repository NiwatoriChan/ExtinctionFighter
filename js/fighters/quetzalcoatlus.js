/* ============================================================================
 * COMBATTANT : QUETZALCOATLUS (Quetzalcoatlus Northropi)
 * Données (stats, skins, textes), modèle 3D, animations, coups spéciaux & fatalité.
 * Silhouette d'azhdarchidé : posture quadrupède (mains au sol), doigt alaire replié
 * pointant vers le ciel avec membrane triangulaire, très long cou dressé à crinière
 * sombre, petite tête à crête bleue et immense bec en dague jaune.
 * ============================================================================ */

registerFighter({
    id: 'quetzal',
    name: 'QUETZALCOATLUS',
    fullName: 'Quetzalcoatlus Northropi',
    role: 'Monarque Céleste',
    title: '« L’Envergure Démesurée des Cieux »',
    primaryColor: 0x8b9099,
    secondaryColor: 0x3a3532,
    accentColor: 0x60a5fa,
    cssPrimary: '#38bdf8',
    scale: 1.06,
    previewScale: 0.8,
    stats: { pow: 94, spd: 96, def: 74 },
    maxHp: 940,
    walkSpeed: 9.6,
    special1Name: 'Piqué Sonique (H)',
    special2Name: 'Bourrasque d’Ailes (T)',
    fatalityName: 'Chute Stratosphérique (R)',
    moveStyle: 'Démarche quadrupède ailée sur de longues échasses, vol libre stratosphérique de 2 secondes avec jauge circulaire d’endurance, estocs foudroyants et piqués dévastateurs.',
    fatalityDesc: 'Saisit l’ennemi de son long bec en dague, s’élève dans la haute atmosphère et le laisse s’écraser à vitesse terminale.',
    skins: [
        { name: 'Paleo Sovereign', primary: 0x8b9099, secondary: 0x3a3532, accent: 0x60a5fa, membrane: 0x9a7556, beak: 0xe0a526 },
        { name: 'Sky Sovereign', primary: 0x0284c7, secondary: 0x0c4a6e, accent: 0x38bdf8, membrane: 0x0369a1, beak: 0xfacc15 },
        { name: 'Blood Harpy', primary: 0x991b1b, secondary: 0x450a0a, accent: 0xef4444, membrane: 0x7f1d1d, beak: 0xd6d3d1 },
        { name: 'Aurora Spirit', primary: 0x6366f1, secondary: 0x312e81, accent: 0x818cf8, membrane: 0x4c1d95, beak: 0xf0abfc },
        { name: 'Nocturnal Glider', primary: 0x27272a, secondary: 0x09090b, accent: 0x0ea5e9, membrane: 0x18181b, beak: 0x94a3b8 }
    ]
}, {
    // Hauteur de base du bassin utilisée par le système d'animation
    animBaseHipsY: 1.95,

    // Spécial 2 (T)
    onSpecial2(attacker, defender, dist, basePow) {
        spawn3DProjectile(attacker, 'feather');
    },

    // Construction du modèle 3D articulé
    // Repère : +X = avant (direction du regard), +Y = haut, Z = côtés. Sol à y = -1.95 dans le repère du bassin.
    buildRig(ctx) {
        const { hips, rig, addMesh, bodyMat, darkMat, accentMat, boneMat, eyeMat, skin } = ctx;

        // --- Matériaux spécifiques ---
        const beakMat = new THREE.MeshStandardMaterial({ color: skin.beak || 0xe0a526, roughness: 0.4, metalness: 0.05 });
        const beakTipMat = new THREE.MeshStandardMaterial({ color: 0x57381c, roughness: 0.5 });
        const membraneMat = new THREE.MeshStandardMaterial({
            color: skin.membrane || skin.secondary,
            roughness: 0.85,
            metalness: 0.0,
            side: THREE.DoubleSide
        });
        const clawMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.5 });
        const pupilMat = new THREE.MeshBasicMaterial({ color: 0x0a0a0a });
        const irisMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });

        // --- Helpers géométriques ---
        const UP = new THREE.Vector3(0, 1, 0);
        // Os cylindrique reliant précisément le point a au point b (rayon r1 en a, r2 en b)
        const bone = (parent, a, b, r1, r2, mat, seg = 7) => {
            const A = new THREE.Vector3(a[0], a[1], a[2]);
            const B = new THREE.Vector3(b[0], b[1], b[2]);
            const dir = B.clone().sub(A);
            const len = dir.length();
            const m = addMesh(new THREE.CylinderGeometry(r2, r1, len, seg), mat, parent,
                (A.x + B.x) / 2, (A.y + B.y) / 2, (A.z + B.z) / 2);
            m.quaternion.setFromUnitVectors(UP, dir.normalize());
            return m;
        };
        // Articulation sphérique
        const joint = (parent, p, r, mat) => addMesh(new THREE.SphereGeometry(r, 8, 6), mat, parent, p[0], p[1], p[2]);
        // Ellipsoïde (sphère étirée)
        const blob = (parent, p, s, mat, rz = 0) => {
            const m = addMesh(new THREE.SphereGeometry(1, 12, 10), mat, parent, p[0], p[1], p[2], 0, 0, rz);
            m.scale.set(s[0], s[1], s[2]);
            return m;
        };
        // Membrane polygonale (éventail de triangles) à partir d'une liste de points
        const membrane = (parent, pts, mat) => {
            const g = new THREE.BufferGeometry();
            g.setAttribute('position', new THREE.Float32BufferAttribute(pts.flat(), 3));
            const idx = [];
            for (let i = 1; i < pts.length - 1; i++) idx.push(0, i, i + 1);
            g.setIndex(idx);
            g.computeVertexNormals();
            return addMesh(g, mat, parent);
        };
        // Griffe conique pointant vers l'avant (+X) et légèrement vers le bas
        const claw = (parent, p, len, r) => addMesh(new THREE.ConeGeometry(r, len, 5), clawMat, parent, p[0], p[1], p[2], 0, 0, -Math.PI / 2 - 0.35);

        hips.position.y = 1.95;

        // =====================================================================
        // 1. CORPS : petit tronc compact, incliné (épaules plus hautes que le bassin)
        // =====================================================================
        blob(rig.torso, [-0.05, 0.05, 0], [0.9, 0.5, 0.42], bodyMat, 0.4);       // tronc (couvre aussi le bassin)
        blob(rig.torso, [0.35, 0.32, 0], [0.45, 0.44, 0.46], bodyMat, 0.3);      // poitrine / épaules
        blob(rig.torso, [0.22, -0.08, 0], [0.42, 0.3, 0.34], darkMat, 0.45);     // ventre (fourrure pycnofibres plus sombre)

        // Queue minuscule
        const qTail = new THREE.Group();
        qTail.position.set(-0.82, -0.3, 0);
        bone(qTail, [0, 0, 0], [-0.32, -0.06, 0], 0.08, 0.02, darkMat, 5);
        rig.torso.add(qTail);
        rig.tailSegments.push(qTail);

        // =====================================================================
        // 2. COU : très long, presque vertical, légère courbe en S, crinière sombre
        // =====================================================================
        rig.neck.position.set(0.55, 0.5, 0);
        rig.torso.add(rig.neck);
        const N0 = [0, 0, 0], N1 = [0.08, 0.7, 0], N2 = [0.12, 1.4, 0], N3 = [0.28, 2.0, 0];
        bone(rig.neck, N0, N1, 0.27, 0.2, bodyMat);
        joint(rig.neck, N1, 0.2, bodyMat);
        bone(rig.neck, N1, N2, 0.2, 0.16, bodyMat);
        joint(rig.neck, N2, 0.16, bodyMat);
        bone(rig.neck, N2, N3, 0.16, 0.14, bodyMat);
        // Crinière dorsale sombre continue le long de l'arrière du cou (plus épaisse près de la tête)
        const M0 = [-0.04, 0.85, 0], M1 = [-0.03, 1.42, 0], M2 = [0.1, 2.05, 0];
        bone(rig.neck, M0, M1, 0.1, 0.13, darkMat, 8).position.x -= 0.04;
        joint(rig.neck, [M1[0] - 0.04, M1[1], 0], 0.13, darkMat);
        bone(rig.neck, M1, M2, 0.13, 0.15, darkMat, 8).position.x -= 0.04;

        // =====================================================================
        // 3. TÊTE : crâne compact, crête bleue, bec en dague jaune légèrement incliné vers le bas
        // =====================================================================
        rig.headGroup.position.set(0.32, 2.12, 0);
        rig.neck.add(rig.headGroup);

        // Le contenu de la tête est légèrement incliné vers le bas (pose naturelle)
        const skull = new THREE.Group();
        skull.rotation.z = -0.22;
        rig.headGroup.add(skull);

        blob(skull, [0.04, 0.03, 0], [0.38, 0.24, 0.2], bodyMat);           // boîte crânienne
        blob(skull, [-0.14, 0.14, 0], [0.22, 0.16, 0.17], darkMat);           // touffe sombre à l'arrière du crâne
        // Crête céphalique bleue (pointe vers le haut et l'arrière)
        membrane(skull, [[0.25, 0.14, 0.03], [-0.15, 0.62, 0], [-0.22, 0.14, 0.03]], accentMat);
        membrane(skull, [[0.25, 0.14, -0.03], [-0.22, 0.14, -0.03], [-0.15, 0.62, 0]], accentMat);
        addMesh(new THREE.BoxGeometry(0.42, 0.06, 0.05), accentMat, skull, 0.02, 0.17, 0);

        // Yeux (iris orangé, pupille noire, bourrelet sombre)
        [-1, 1].forEach(side => {
            addMesh(new THREE.SphereGeometry(0.06, 10, 8), irisMat, skull, 0.14, 0.07, side * 0.165);
            addMesh(new THREE.SphereGeometry(0.03, 8, 6), pupilMat, skull, 0.16, 0.07, side * 0.21);
            addMesh(new THREE.BoxGeometry(0.16, 0.035, 0.05), darkMat, skull, 0.13, 0.14, side * 0.165);
        });

        // Bec supérieur : base épaisse -> longue dague effilée
        bone(skull, [0.2, 0.02, 0], [1.0, -0.04, 0], 0.13, 0.08, beakMat, 6);
        bone(skull, [1.0, -0.04, 0], [1.75, -0.1, 0], 0.08, 0.025, beakMat, 6);
        bone(skull, [1.75, -0.1, 0], [1.92, -0.12, 0], 0.025, 0.004, beakTipMat, 5);
        // Liseré de la commissure du bec
        bone(skull, [0.2, -0.07, 0.1], [0.75, -0.1, 0.05], 0.015, 0.012, beakTipMat, 4);
        bone(skull, [0.2, -0.07, -0.1], [0.75, -0.1, -0.05], 0.015, 0.012, beakTipMat, 4);

        // Mâchoire inférieure articulée (pivot sous le crâne)
        rig.jaw.position.set(0.15, -0.12, 0);
        rig.jaw.rotation.z = 0;
        skull.add(rig.jaw);
        bone(rig.jaw, [0.0, 0, 0], [0.9, -0.02, 0], 0.08, 0.055, beakMat, 6);
        bone(rig.jaw, [0.9, -0.02, 0], [1.6, 0.0, 0], 0.055, 0.015, beakMat, 6);

        // Petit globe de vision (non rendu) pour garder eyeMat cohérent avec les autres modèles
        void eyeMat;

        // =====================================================================
        // 4. AILES / MEMBRES ANTÉRIEURS (posture quadrupède)
        //    épaule -> humérus vers l'arrière/bas -> avant-bras vers l'avant/bas
        //    -> long métacarpe vertical jusqu'au sol -> doigts griffus au sol
        //    -> 4e doigt alaire replié qui remonte vers le ciel derrière le corps
        // =====================================================================
        [-1, 1].forEach(side => {
            const wing = new THREE.Group();
            wing.position.set(0.42, 0.38, side * 0.36); // épaule
            rig.torso.add(wing);
            rig.arms.push(wing);

            // Points relatifs à l'épaule (sol à y ≈ -2.33)
            const S = [0, 0, 0];
            const E = [-0.3, -0.75, side * 0.14];        // coude
            const W = [0.22, -1.32, side * 0.2];         // poignet
            const K = [0.3, -2.2, side * 0.22];          // articulation métacarpo-phalangienne (au sol)
            const F1 = [-0.12, -0.55, side * 0.3];       // doigt alaire : phalanges
            const F2 = [-0.58, 0.95, side * 0.26];
            const T = [-0.95, 2.05, side * 0.2];         // pointe de l'aile, haut au-dessus du dos

            // Bras musclé
            joint(wing, S, 0.2, bodyMat);
            bone(wing, S, E, 0.18, 0.12, bodyMat);
            joint(wing, E, 0.12, darkMat);
            bone(wing, E, W, 0.11, 0.08, darkMat);
            joint(wing, W, 0.1, darkMat);
            bone(wing, W, K, 0.08, 0.065, darkMat);
            joint(wing, K, 0.08, darkMat);

            // Main au sol : 3 doigts griffus vers l'avant
            [-0.06, 0, 0.06].forEach((dz, i) => {
                const tip = [K[0] + 0.22, -2.3, K[2] + dz * side + side * 0.02];
                bone(wing, [K[0] + 0.02, -2.24, K[2] + dz * side], tip, 0.025, 0.018, darkMat, 4);
                claw(wing, [tip[0] + 0.04, tip[1] - 0.01, tip[2]], 0.09, 0.018);
                void i;
            });

            // Doigt alaire replié (remonte depuis la main jusqu'au-dessus du dos)
            bone(wing, K, F1, 0.065, 0.055, darkMat);
            joint(wing, F1, 0.055, darkMat);
            bone(wing, F1, F2, 0.055, 0.04, darkMat);
            joint(wing, F2, 0.04, darkMat);
            bone(wing, F2, T, 0.04, 0.012, darkMat);

            // Membrane principale (brachiopatagium) repliée : grand triangle brun clair
            // entre le doigt alaire, le bras et le flanc du corps
            const bodyAnchor = [-1.05, -0.65, -side * 0.12];  // flanc / haut de la cuisse
            membrane(wing, [K, F1, F2, T, bodyAnchor, E], membraneMat);
            // Bordure de fuite plus sombre le long de la membrane
            bone(wing, T, bodyAnchor, 0.02, 0.02, darkMat, 4);
            // Propatagium (petite membrane avant entre épaule et poignet)
            membrane(wing, [S, W, E], membraneMat);
        });

        // =====================================================================
        // 5. PATTES ARRIÈRE : longues et fines, pieds plantigrades
        // =====================================================================
        [-1, 1].forEach(side => {
            const leg = new THREE.Group();
            leg.position.set(-0.5, -0.2, side * 0.28); // hanche (sol à y ≈ -1.75)
            hips.add(leg);
            rig.legs.push(leg);

            const H = [0, 0, 0], Kn = [0.28, -0.72, side * 0.05], A = [-0.05, -1.55, side * 0.06];
            blob(leg, [0.1, -0.28, 0], [0.16, 0.32, 0.15], bodyMat, -0.35);    // cuisse fourrée
            bone(leg, H, Kn, 0.14, 0.09, bodyMat);
            joint(leg, Kn, 0.09, darkMat);
            bone(leg, Kn, A, 0.08, 0.055, darkMat);
            joint(leg, A, 0.06, darkMat);
            // Pied plantigrade et 4 orteils griffus
            bone(leg, A, [0.18, -1.72, side * 0.06], 0.06, 0.05, darkMat, 5);
            [-0.07, -0.025, 0.025, 0.07].forEach(dz => {
                const tip = [0.38, -1.74, side * 0.06 + dz];
                bone(leg, [0.16, -1.72, side * 0.06 + dz * 0.5], tip, 0.022, 0.016, darkMat, 4);
                claw(leg, [tip[0] + 0.035, tip[1], tip[2]], 0.07, 0.016);
            });
        });

        // =====================================================================
        // 6. INDICATEUR D'ENDURANCE DE VOL CIRCULAIRE (Roue d'endurance de 2 secondes)
        // =====================================================================
        const gaugeCanvas = document.createElement('canvas');
        gaugeCanvas.width = 256;
        gaugeCanvas.height = 256;
        const gCtx = gaugeCanvas.getContext('2d');
        const gaugeTexture = new THREE.CanvasTexture(gaugeCanvas);
        gaugeTexture.minFilter = THREE.LinearFilter;
        gaugeTexture.magFilter = THREE.LinearFilter;

        const gaugeMat = new THREE.SpriteMaterial({
            map: gaugeTexture,
            transparent: true,
            opacity: 0.0,
            depthTest: false
        });
        const enduranceSprite = new THREE.Sprite(gaugeMat);
        enduranceSprite.scale.set(1.5, 1.5, 1.5);
        enduranceSprite.position.set(0, 4.3, 0); // Flotte au-dessus du Quetzalcoatlus
        rig.root.add(enduranceSprite);

        let lastDrawnPct = -1;
        let currentOpacity = 0.0;

        rig.specialParts.flightEnduranceGauge = enduranceSprite;
        rig.specialParts.updateEnduranceCircle = (endurance, isFlying, delta) => {
            const maxEnd = 2.0;
            const pct = Math.max(0, Math.min(1.0, endurance / maxEnd));

            // Visible en vol ou pendant la recharge au sol (< 100%)
            const targetOpacity = (isFlying || pct < 0.98) ? 1.0 : 0.0;
            currentOpacity += (targetOpacity - currentOpacity) * Math.min(1.0, delta * 8);
            gaugeMat.opacity = currentOpacity;
            if (currentOpacity < 0.02) {
                enduranceSprite.visible = false;
                return;
            }
            enduranceSprite.visible = true;

            // Re-dessiner le cadran circulaire uniquement quand l'endurance change ou en vol
            if (Math.abs(pct - lastDrawnPct) > 0.005 || isFlying) {
                lastDrawnPct = pct;
                const size = 256;
                const cx = size / 2;
                const cy = size / 2;
                const radius = 86;
                const strokeW = 18;

                gCtx.clearRect(0, 0, size, size);

                // 1. Fond sombre translucide du médaillon
                gCtx.beginPath();
                gCtx.arc(cx, cy, radius + strokeW * 0.75, 0, Math.PI * 2);
                gCtx.fillStyle = 'rgba(10, 15, 26, 0.82)';
                gCtx.fill();

                // 2. Anneau arrière-plan (rail guide 360°)
                gCtx.beginPath();
                gCtx.arc(cx, cy, radius, 0, Math.PI * 2);
                gCtx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
                gCtx.lineWidth = strokeW;
                gCtx.lineCap = 'round';
                gCtx.stroke();

                // 3. Arc d'endurance circulaire (de 12h dans le sens horaire)
                if (pct > 0.001) {
                    const startAngle = -Math.PI / 2;
                    const endAngle = startAngle + (Math.PI * 2 * pct);

                    gCtx.beginPath();
                    gCtx.arc(cx, cy, radius, startAngle, endAngle, false);

                    let color = '#38bdf8';
                    let glowColor = 'rgba(56, 189, 248, 0.9)';
                    if (pct > 0.55) {
                        color = '#38bdf8';
                        glowColor = 'rgba(56, 189, 248, 0.9)';
                    } else if (pct > 0.25) {
                        color = '#fbbf24';
                        glowColor = 'rgba(251, 191, 36, 0.9)';
                    } else {
                        color = '#f87171';
                        glowColor = 'rgba(248, 113, 113, 1.0)';
                    }

                    gCtx.shadowColor = glowColor;
                    gCtx.shadowBlur = 16;
                    gCtx.strokeStyle = color;
                    gCtx.lineWidth = strokeW;
                    gCtx.lineCap = 'round';
                    gCtx.stroke();
                    gCtx.shadowBlur = 0;
                }

                // 4. Cadran numérique : secondes d'endurance restantes
                gCtx.fillStyle = pct <= 0.25 ? '#f87171' : '#ffffff';
                gCtx.font = 'bold 38px sans-serif';
                gCtx.textAlign = 'center';
                gCtx.textBaseline = 'middle';
                const secText = `${(endurance).toFixed(1)}s`;
                gCtx.fillText(secText, cx, cy - 6);

                // Label "VOL"
                gCtx.font = 'bold 20px sans-serif';
                gCtx.fillStyle = '#38bdf8';
                gCtx.fillText('VOL', cx, cy + 32);

                // 4 Encoches repères
                for (let i = 0; i < 4; i++) {
                    const angle = -Math.PI / 2 + (i * Math.PI / 2);
                    const tx1 = cx + Math.cos(angle) * (radius - strokeW * 0.7);
                    const ty1 = cy + Math.sin(angle) * (radius - strokeW * 0.7);
                    const tx2 = cx + Math.cos(angle) * (radius + strokeW * 0.7);
                    const ty2 = cy + Math.sin(angle) * (radius + strokeW * 0.7);
                    gCtx.beginPath();
                    gCtx.moveTo(tx1, ty1);
                    gCtx.lineTo(tx2, ty2);
                    gCtx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
                    gCtx.lineWidth = 3;
                    gCtx.stroke();
                }

                gaugeTexture.needsUpdate = true;
            }
        };
    },

    // Animation d'attente (idle) / marche quadrupède / vol stratosphérique
    animateIdle(ctx) {
        const { fighter, rig, baseHipsY, time, isWalk, dt } = ctx;

        // Mise à jour de la jauge d'endurance circulaire 3D
        if (rig.specialParts && rig.specialParts.updateEnduranceCircle) {
            const endurance = fighter ? (fighter.flightEndurance !== undefined ? fighter.flightEndurance : 2.0) : 2.0;
            const isFlying = fighter ? !!fighter.isFlying : false;
            rig.specialParts.updateEnduranceCircle(endurance, isFlying, dt || 0.016);
        }

        // --- MODE VOL ACTIF (Ailes déployées, battements puissants, corps profilé) ---
        if (fighter && fighter.isFlying) {
            const flapFreq = 11.0;
            const flap = Math.sin(time * flapFreq);

            // Corps et cou profilés vers l'avant dans le flux d'air
            rig.torso.rotation.z = -0.35 + Math.sin(time * 4) * 0.06;
            rig.neck.rotation.z = -0.55 + flap * 0.08;
            rig.headGroup.rotation.z = 0.25 - flap * 0.05;
            if (rig.jaw) rig.jaw.rotation.z = -0.06 - Math.max(0, flap) * 0.08;

            // Déploiement et battement des ailes immenses
            if (rig.arms && rig.arms.length >= 2) {
                const spreadBase = 1.35;
                rig.arms[0].rotation.x = -(spreadBase + flap * 0.45);
                rig.arms[1].rotation.x = (spreadBase + flap * 0.45);
                rig.arms[0].rotation.z = -0.28 + flap * 0.15;
                rig.arms[1].rotation.z = -0.28 + flap * 0.15;
                rig.arms[0].rotation.y = flap * 0.10;
                rig.arms[1].rotation.y = -flap * 0.10;
            }

            // Pattes repliées vers l'arrière en fuseau aérodynamique
            if (rig.legs && rig.legs.length >= 2) {
                rig.legs[0].rotation.z = -0.85;
                rig.legs[1].rotation.z = -0.85;
            }
            return;
        }

        // --- MODE AU SOL (Posture d'échassier quadrupède) ---
        const freq = isWalk ? 8.5 : 2.2;
        const w = Math.sin(time * freq);

        rig.hips.position.y = baseHipsY + (isWalk ? Math.abs(w) * 0.12 : Math.sin(time * freq) * 0.03);
        rig.neck.rotation.z = isWalk ? -0.08 + Math.sin(time * freq * 2) * 0.05 : Math.sin(time * 1.6) * 0.04;
        rig.headGroup.rotation.z = isWalk ? 0.06 - Math.sin(time * freq * 2) * 0.05 : Math.sin(time * 2.3 + 1) * 0.05;
        rig.headGroup.rotation.y = isWalk ? 0 : Math.sin(time * 0.9) * 0.12;
        if (rig.jaw) rig.jaw.rotation.z = 0.02 + Math.max(0, Math.sin(time * 1.3)) * 0.04;

        // Marche quadrupède en diagonale : aile gauche avec patte droite
        const a = isWalk ? w * 0.3 : 0;
        if (rig.arms && rig.arms.length >= 2) {
            rig.arms[0].rotation.z = a;
            rig.arms[1].rotation.z = -a;
            const breathe = isWalk ? 0 : Math.sin(time * freq) * 0.03;
            rig.arms[0].rotation.x = -breathe;
            rig.arms[1].rotation.x = breathe;
        }
        if (rig.legs && rig.legs.length >= 2) {
            rig.legs[0].rotation.z = -a * 1.2;
            rig.legs[1].rotation.z = a * 1.2;
        }
    },

    // Ruée / Dash : Bras et ailes déployés en pleine envergure aérodynamique
    animateDash(ctx) {
        const { rig, lunge, dashProg, isBackDash, baseHipsY, time } = ctx;
        // Bras / Ailes étendus en envergure maximale profilée
        const spread = 1.48;
        if (rig.arms && rig.arms.length >= 2) {
            rig.arms[0].rotation.x = -spread;
            rig.arms[1].rotation.x = spread;
            rig.arms[0].rotation.z = isBackDash ? 0.22 : -0.36;
            rig.arms[1].rotation.z = isBackDash ? 0.22 : -0.36;
            rig.arms[0].rotation.y = 0;
            rig.arms[1].rotation.y = 0;
        }

        if (isBackDash) {
            // Esquive en retrait ailes déployées
            rig.hips.position.y = baseHipsY * (0.86 + lunge * 0.22);
            rig.hips.position.x = -lunge * 0.40;
            rig.torso.rotation.z = 0.26;
            rig.neck.rotation.z = 0.16;
            rig.headGroup.rotation.z = -0.10;
            if (rig.legs && rig.legs.length >= 2) {
                rig.legs[0].rotation.z = -0.45 + lunge * 0.6;
                rig.legs[1].rotation.z = 0.35 - lunge * 0.5;
            }
        } else {
            // Ruée offensive vers l'avant bec affûté et ailes fendant l'air
            rig.hips.position.y = baseHipsY * 0.72;
            rig.hips.position.x = lunge * 0.52;
            rig.torso.rotation.z = -0.52;
            rig.neck.rotation.z = -0.28;
            rig.headGroup.rotation.z = -0.15;
            if (rig.legs && rig.legs.length >= 2) {
                rig.legs[0].rotation.z = 0.95 * Math.sin(time * 26);
                rig.legs[1].rotation.z = -0.95 * Math.sin(time * 26);
            }
        }
        if (rig.jaw) rig.jaw.rotation.z = -0.15;
    },

    hasCustomDirectionals: true,

    // Animations d'attaques claires et distinctes pour chaque coup
    // Ailes : rotation.x * side (arms[0] côté -Z => side -1, arms[1] côté +Z => side +1) écarte l'aile vers l'extérieur
    animateAttack(ctx) {
        const { rig, act, prog, swing, strike, baseHipsY } = ctx;
        const s = strike !== undefined ? strike : swing;
        const spread = (amt) => {
            rig.arms[0].rotation.x = -amt;
            rig.arms[1].rotation.x = amt;
        };

        if (act === 'light') {
            // Coup Léger 1 : Estoc rapide du long bec en dague
            rig.neck.rotation.z = -s * 0.85;
            rig.headGroup.rotation.z = -s * 0.35;
            rig.jaw.rotation.z = -s * 0.25;
        } else if (act === 'light2') {
            // Coup Léger 2 (Combo 1-2) : Estoc croisé avec impulsion de l'aile
            rig.neck.rotation.z = -s * 0.95;
            rig.neck.rotation.y = -s * 0.3;
            rig.headGroup.rotation.z = -s * 0.45;
            spread(s * 0.6);
        } else if (act === 'fwd_light') {
            // Avant + Léger : Harponnage maximal à longue portée
            rig.hips.position.x = s * 1.15;
            rig.neck.rotation.z = -s * 1.1;
            rig.headGroup.rotation.z = -s * 0.35;
            rig.arms[0].rotation.z = -s * 0.3;
            rig.arms[1].rotation.z = -s * 0.3;
        } else if (act === 'low_light' || act === 'low_heavy') {
            // Direction BAS ⬇️ : Bec au ras du sol et fauchage de l'aile
            rig.hips.position.y = baseHipsY - s * 0.45;
            rig.torso.rotation.z = -s * 0.25;
            rig.neck.rotation.z = -s * 1.35;
            rig.headGroup.rotation.z = s * 0.3;
            rig.jaw.rotation.z = -s * 0.35;
        } else if (act === 'anti_air' || act === 'up_light') {
            // Direction HAUT ⬆️ : Bec pointé vers le zénith, ailes ouvertes
            rig.hips.position.y = baseHipsY + s * 0.9;
            rig.neck.rotation.z = s * 0.35;
            rig.headGroup.rotation.z = s * 1.1;
            rig.jaw.rotation.z = -s * 0.4;
            spread(s * 1.1);
        } else if (act === 'back_light') {
            // Direction ARRIÈRE ⬅️ : Battement de recul et estoc défensif
            rig.hips.position.x = -s * 0.8;
            rig.neck.rotation.z = -s * 0.65;
            spread(s * 0.8);
        } else if (act === 'air_light' || act === 'air_heavy') {
            // Piqué plongeant aérien, ailes déployées et bec en avant
            rig.torso.rotation.z = -0.6;
            rig.neck.rotation.z = -0.4 - s * 0.7;
            spread(1.2);
            rig.legs[0].rotation.z = -0.9;
            rig.legs[1].rotation.z = -0.9;
        } else if (act === 'throw') {
            // Saisie au bec et projection
            rig.hips.position.x = s * 0.95;
            rig.neck.rotation.z = -s * 0.9;
            rig.jaw.rotation.z = -(1 - s) * 0.5;
            spread(s * 0.9);
        } else if (act === 'heavy' || act === 'fwd_heavy') {
            // Bourrasque d'ailes dévastatrice : ailes ouvertes puis rabattues vers l'avant
            spread(0.6 + s * 0.9);
            rig.arms[0].rotation.z = -s * 0.7;
            rig.arms[1].rotation.z = -s * 0.7;
            rig.neck.rotation.z = s * 0.25;
            rig.headGroup.rotation.z = -s * 0.3;
            if (act === 'fwd_heavy') rig.hips.position.x = s * 0.8;
        } else if (act === 'special') {
            // Piqué Sonique : envol puis plongée bec en avant
            rig.hips.position.y = baseHipsY + s * 1.5;
            rig.torso.rotation.z = -s * 0.5;
            rig.neck.rotation.z = -s * 0.9;
            spread(1.3);
        } else if (act === 'special2') {
            // Bourrasque tourbillonnaire : battements frénétiques
            const flap = Math.sin(prog * Math.PI * 8);
            spread(0.9 + flap * 0.6);
            rig.arms[0].rotation.z = flap * 0.4;
            rig.arms[1].rotation.z = flap * 0.4;
            rig.hips.position.y = baseHipsY + Math.sin(prog * Math.PI) * 0.8;
        }
    },

    // Chorégraphie 3D de la fatalité
    animateFatality(ctx) {
        const { rig, prog, baseHipsY } = ctx;
        rig.hips.position.y = baseHipsY + Math.sin(prog * Math.PI) * 4.5;
        const flap = Math.sin(prog * Math.PI * 10);
        rig.arms[0].rotation.x = -(1.0 + flap * 0.5);
        rig.arms[1].rotation.x = 1.0 + flap * 0.5;
        rig.neck.rotation.z = -0.6;
        rig.jaw.rotation.z = -0.15;
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
    },
});
