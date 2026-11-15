/* ============================================================================
 * ANIMATIONS PACHYRHINOSAURE : SAUT (JUMPING & AIRBORNE)
 * Détente explosive des membres postérieurs à la montée (cabré quadrupède)
 * et préparation des sabots antérieurs massifs à la réception.
 * ============================================================================ */

registerFighterAnimation('pachyrhino', {
    animateJump(ctx) {
        const { fighter, rig, baseHipsY, time } = ctx;
        const sp = rig.specialParts;

        const isRising = Boolean(fighter && fighter.vy > 0);
        rig.hips.position.y = baseHipsY + 0.14;
        rig.torso.rotation.z = isRising ? 0.24 : -0.20;
        rig.headGroup.rotation.z = isRising ? 0.22 : -0.24;
        rig.jaw.rotation.z = isRising ? -0.28 : -0.12;
        if (rig.legs.length >= 4) {
            rig.legs[0].rotation.z = isRising ? 0.42 : -0.32;
            rig.legs[1].rotation.z = isRising ? 0.34 : -0.26;
            rig.legs[2].rotation.z = isRising ? -0.40 : 0.25;
            rig.legs[3].rotation.z = isRising ? -0.34 : 0.20;
        }
    }
});
