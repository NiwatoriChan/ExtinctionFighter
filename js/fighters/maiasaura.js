/* ============================================================================
 * COMBATTANT : MAIASAURA (Maiasaura Peeblesorum)
 * Modèle 3D paléontologique stylisé "Cartoon Mature / Primal" validé sous Blender 5.2.3:
 *   - Textures PBR procédurales 1024x1024 (peau tigrée émeraude & ocre flamboyant,
 *     bandes zébrées cel-shadées, crête d'écailles rectangulaires, ventre jaune d'or)
 *   - Large bec de canard aplati et spatulé à rhamphothèque sombre
 *   - Courte crête osseuse interorbitale pointue (amplificateur d'ondes soniques)
 *   - Bras agiles en moufles sabotées & queue haute comprimée latéralement
 * ============================================================================ */

registerFighter({
    id: 'maiasaura',
    name: 'MAIASAURA',
    fullName: 'Maiasaura Peeblesorum',
    role: 'Protectrice Féroce',
    title: '« La Bonne Mère Indomptable »',
    primaryColor: 0x6a7355,
    secondaryColor: 0x4c533c,
    accentColor: 0x9e7348,
    cssPrimary: '#6a7355',
    scale: 0.98,
    previewScale: 0.92,
    stats: { pow: 82, spd: 86, def: 78 },
    maxHp: 980,
    walkSpeed: 9.2,
    special1Name: 'Ruade Maternelle (H)',
    special2Name: 'Cri d’Alerte Sonique (T)',
    fatalityName: 'Frénésie du Nid (R)',
    moveStyle: 'Galop agile à deux et quatre pattes, ruades foudroyantes et ondes sonores stridentes.',
    fatalityDesc: 'Pousse un hurlement qui paralyse le système nerveux adverse, puis piétine frénétiquement le torse de la victime jusqu’à dislocation complète.',
    skins: [
        { name: 'Sagewood Matriarch', primary: 0x6a7355, secondary: 0x4c533c, accent: 0x9e7348, belly: 0xb5ad93, isDefaultPBR: true }
    ]
}, {
    animBaseHipsY: 1.95,

    onSpecial2(attacker, defender, dist, basePow) {
        spawn3DProjectile(attacker, 'sonic');
    }
});
