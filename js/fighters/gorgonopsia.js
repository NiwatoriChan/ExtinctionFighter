/* ============================================================================
 * COMBATTANT : GORGONOPSIA (Inostrancevia Latifrons - Super-Prédateur du Permien)
 * Boss Apex de l'Ère 6 (Permien) — Déblocable en conquérant l'Ère du Permien !
 * Squelette & animations basés sur le Smilodon (animBaseId: 'smilodon'),
 * propulsé par son modèle 3D Blender haute définition assets/models/fighters/gorgonopsia.glb :
 * - Tête mammalienne de thérapside (museau rond-massif, truffe & narines profondes,
 *   arcades charnues, petites oreilles mammaliennes discrètes)
 * - Deux canines sabres crénelées colossales + crocs inférieurs verrouillables
 * - Peau épaisse de cuir lisse façon hippopotame parsemée de petits poils drus
 * - Torse massif en tonneau, épaules herculéennes et pattes robustes à 5 griffes
 * - Queue lourde recourbée vers le bas à 4 segments articulés
 * ============================================================================ */

registerFighter({
    id: 'gorgonopsia',
    animBaseId: 'smilodon',
    name: 'GORGONOPSIA',
    fullName: 'Inostrancevia Alexandri',
    role: 'Super-Prédateur Gorgonopsien',
    title: '« Le Sabre-Dents Primordial du Permien »',
    primaryColor: 0x8c2d19,
    secondaryColor: 0x26211e,
    accentColor: 0xeab308,
    cssPrimary: '#b91c1c',
    scale: 0.90,
    previewScale: 0.95,
    stats: { pow: 96, spd: 91, def: 84 },
    maxHp: 1080,
    walkSpeed: 8.6,
    special1Name: 'Ruée Sabre-Dents (H)',
    special2Name: 'Crocs du Permien (T)',
    fatalityName: 'Éviscération Gorgonopsienne (R)',
    moveStyle: 'Foulée féline-thérapside explosive, bonds lacérants, mâchoire ouverte à 90° et crocs sabres crénelés du Permien.',
    fatalityDesc: 'Bondit sur la nuque de sa proie, plante ses deux canines sabres colossales dans le thorax et la déchiquette dans un rugissement ancestral.',
    isUnlockable: true,
    skins: [
        { name: 'Permian Crimson Alpha', primary: 0x8c2d19, secondary: 0x26211e, accent: 0xeab308 },
        { name: 'Siberian Basalt Stalker', primary: 0x475569, secondary: 0x1e293b, accent: 0xf97316 }
    ]
}, {
    animBaseHipsY: 1.55,
    attackReach: 3.65,

    onSpecial(attacker, defender, dist, basePow) {
        if (typeof sfx !== 'undefined' && sfx.playRoar) sfx.playRoar(82, 0.45);
        attacker.vx = attacker.facing * 23;
        if (defender && dist < 4.9 && (typeof isWithinVerticalHitBand !== 'function' || isWithinVerticalHitBand(attacker, defender, 2.2, 1.8))) {
            applyDamage(attacker, defender, Math.round(basePow * 1.12), true, 'RUÉE SABRE-DENTS !');
            if (typeof spawn3DBloodAndBones === 'function') {
                spawn3DBloodAndBones(defender.x, defender.y + 1.8, 22, false);
            }
            screenShake = 0.46;
        }
    },

    onSpecial2(attacker, defender, dist, basePow) {
        if (typeof sfx !== 'undefined' && sfx.playRoar) sfx.playRoar(70, 0.55);
        if (defender && dist < 4.1 && (typeof isWithinVerticalHitBand !== 'function' || isWithinVerticalHitBand(attacker, defender, 2.2, 1.8))) {
            if (typeof sfx !== 'undefined' && sfx.playBoneCrack) sfx.playBoneCrack();
            applyDamage(attacker, defender, Math.round(basePow * 1.30), true, 'CROCS DU PERMIEN !');
            if (typeof spawn3DBloodAndBones === 'function') {
                spawn3DBloodAndBones(defender.x, defender.y + 2.0, 36, true);
            }
            screenShake = 0.72;
        } else {
            attacker.vx = attacker.facing * 19;
        }
    },

    executeFatality(winner, loser) {
        setTimeout(() => {
            if (matchState !== 'fatality_anim') return;
            if (typeof sfx !== 'undefined') {
                if (sfx.playRoar) sfx.playRoar(68, 0.9);
                if (sfx.playHit) sfx.playHit(true);
            }
            if (typeof spawnFloatingPopup === 'function') {
                spawnFloatingPopup(loser.x, '🩸 ASSAUT GORGONOPSIEN !', '#dc2626');
            }
            if (typeof spawn3DBloodAndBones === 'function') {
                spawn3DBloodAndBones(loser.x, 1.6, 28, true);
            }
        }, 800);

        setTimeout(() => {
            if (matchState !== 'fatality_anim') return;
            if (typeof sfx !== 'undefined') {
                if (sfx.playBoneCrack) sfx.playBoneCrack();
                if (sfx.playHit) sfx.playHit(true);
            }
            if (typeof spawnFloatingPopup === 'function') {
                spawnFloatingPopup(loser.x, '🦴 SABRES DU PERMIEN ENFONCÉS !', '#f97316');
            }
            if (typeof spawn3DBloodAndBones === 'function') {
                spawn3DBloodAndBones(loser.x, 1.2, 60, true);
            }
            screenShake = 0.9;
        }, 1600);

        setTimeout(() => {
            if (matchState !== 'fatality_anim') return;
            if (typeof sfx !== 'undefined') {
                if (sfx.playBoneCrack) sfx.playBoneCrack();
                if (sfx.playRoar) sfx.playRoar(54, 1.0);
            }
            loser.decapitated = true;
            loser.isDead = true;
            loser.hp = 0;
            if (typeof spawn3DBloodAndBones === 'function') {
                spawn3DBloodAndBones(loser.x, 1.0, 95, true);
            }
            screenShake = 1.25;
            if (typeof showAnnouncer === 'function') {
                showAnnouncer('FATALITY !', 'ÉVISCÉRATION GORGONOPSIENNE D\'INOSTRANCEVIA');
            }
        }, 2400);
    }
});
