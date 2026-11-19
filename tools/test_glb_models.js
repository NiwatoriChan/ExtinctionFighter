/**
 * Node verification test for exported GLB fighter models in assets/models/fighters/.
 * Checks:
 *  1. Every fighter in GLB_FIGHTER_IDS has an exported valid binary glTF (.glb) file.
 *  2. Each .glb parses cleanly and contains required Bone_Hips, Bone_Torso, Bone_Neck,
 *     Bone_Head, Bone_Jaw (where applicable) and rig arrays matching JS animations.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MODEL_DIR = path.join(ROOT, 'assets', 'models', 'fighters');

const EXPECTED_BONES = {
    ankylo: ['Bone_Hips', 'Bone_Torso', 'Bone_Neck', 'Bone_Head', 'Bone_Jaw', 'Bone_Leg0', 'Bone_Leg1', 'Bone_Leg2', 'Bone_Leg3', 'Bone_Tail0', 'Bone_Tail2', 'Special_TailClub'],
    anomalocaris: ['Bone_Hips', 'Bone_Torso', 'Bone_Neck', 'Bone_Head', 'Bone_Arm0', 'Bone_Arm1', 'Bone_Tail0'],
    apato: ['Bone_Hips', 'Bone_Torso', 'Bone_Neck', 'Bone_Head', 'Bone_Jaw', 'Bone_Leg0', 'Bone_Leg3', 'Bone_Tail0', 'Bone_Tail4'],
    dragon: ['Bone_Hips', 'Bone_Torso', 'Bone_Neck', 'Bone_Head', 'Bone_Jaw', 'Bone_Arm0', 'Bone_Arm1', 'Bone_Leg0', 'Bone_Leg1', 'Bone_Tail0', 'Bone_Tail3', 'Special_LeftWing', 'Special_RightWing'],
    maiasaura: ['Bone_Hips', 'Bone_Torso', 'Bone_Neck', 'Bone_Head', 'Bone_Jaw', 'Bone_Arm0', 'Bone_Arm1', 'Bone_Leg0', 'Bone_Leg1', 'Bone_Tail0', 'Bone_Tail3'],
    giantsloth: ['Bone_Hips', 'Bone_Torso', 'Bone_Neck', 'Bone_Head', 'Bone_Jaw', 'Bone_Arm0', 'Bone_Arm1', 'Bone_Leg0', 'Bone_Leg1', 'Bone_Tail0', 'Bone_Tail2'],
    gorgonopsia: ['Bone_Hips', 'Bone_Torso', 'Bone_Neck', 'Bone_Head', 'Bone_Jaw', 'Bone_Leg0', 'Bone_Leg1', 'Bone_Leg2', 'Bone_Leg3', 'Bone_Tail0', 'Bone_Tail2', 'Bone_Tail3'],
    postosuchus: ['Bone_Hips', 'Bone_Torso', 'Bone_Neck', 'Bone_Head', 'Bone_Jaw', 'Bone_Leg0', 'Bone_Leg3', 'Bone_Tail0', 'Bone_Tail3'],
    pulmonoscorpius: ['Bone_Hips', 'Bone_Torso', 'Bone_Head', 'Bone_Arm0', 'Bone_Arm1', 'Bone_Leg0', 'Bone_Leg7', 'Bone_Tail0', 'Bone_Tail4'],
    smilodon: ['Bone_Hips', 'Bone_Torso', 'Bone_Neck', 'Bone_Head', 'Bone_Jaw', 'Bone_Leg0', 'Bone_Leg3', 'Bone_Tail0', 'Bone_Tail2'],
    spinosaurus: ['Bone_Hips', 'Bone_Torso', 'Bone_Neck', 'Bone_Head', 'Bone_Jaw', 'Bone_Arm0', 'Bone_Arm1', 'Bone_Leg0', 'Bone_Leg1', 'Bone_Tail0', 'Bone_Tail3'],
    stegosaurus: ['Bone_Hips', 'Bone_Torso', 'Bone_Neck', 'Bone_Head', 'Bone_Jaw', 'Bone_Arm0', 'Bone_Arm1', 'Bone_Leg0', 'Bone_Leg1', 'Bone_Tail0', 'Bone_Tail3'],
    terabird: ['Bone_Hips', 'Bone_Torso', 'Bone_Neck', 'Bone_Head', 'Bone_Jaw', 'Bone_Arm0', 'Bone_Arm1', 'Bone_Leg0', 'Bone_Leg1', 'Bone_Tail0'],
    therizino: ['Bone_Hips', 'Bone_Torso', 'Bone_Neck', 'Bone_Head', 'Bone_Jaw', 'Bone_Arm0', 'Bone_Arm1', 'Bone_Leg0', 'Bone_Leg1', 'Bone_Tail0', 'Bone_Tail2'],
    trex: ['Bone_Hips', 'Bone_Torso', 'Bone_Neck', 'Bone_Head', 'Bone_Jaw', 'Bone_Arm0', 'Bone_Arm1', 'Bone_Leg0', 'Bone_Leg1', 'Bone_Tail0', 'Bone_Tail3'],
    pachyrhino: ['Bone_Hips', 'Bone_Torso', 'Bone_Neck', 'Bone_Head', 'Bone_Jaw', 'Bone_Leg0', 'Bone_Leg1', 'Bone_Leg2', 'Bone_Leg3', 'Bone_Tail0', 'Bone_Tail2'],
    quetzal: ['Bone_Hips', 'Bone_Torso', 'Bone_Neck', 'Bone_Head', 'Bone_Jaw', 'Bone_Leg0', 'Bone_Leg1', 'Bone_Tail0', 'Bone_Arm0', 'Bone_Arm1', 'Special_LeftWing', 'Special_RightWing'],
};

const MINION_MODEL_DIR = path.join(ROOT, 'assets', 'models', 'minions');
const CAMPAIGN_MODEL_DIR = path.join(ROOT, 'assets', 'models', 'campaign');

const EXPECTED_MINION_NODES = {
    cambrian_trilobite: ['Minion_Root', 'Body_Main', 'Head_Pivot', 'Leg0', 'Antennule0', 'TailFan'],
    opabinia_radiodont_elite: ['Minion_Root', 'Body_Main', 'Head_Pivot', 'FlapL0', 'FlapR0', 'Proboscis', 'ProbClaw0', 'ProbClaw1', 'TailFan'],
    orthoceras: ['Minion_Root', 'Body_Main', 'Head_Pivot', 'Arm0', 'Proboscis', 'TailFan'],
    eurypterid: ['Minion_Root', 'Body_Main', 'Head_Pivot', 'Arm0', 'Leg0', 'FlapL0', 'TailFan'],
    jawless_fish: ['Minion_Root', 'Body_Main', 'Head_Pivot', 'FlapL0', 'TailFan'],
    shark_placoderm: ['Minion_Root', 'Body_Main', 'Head_Pivot', 'FlapL0', 'TailFan'],
    bothriolepis: ['Minion_Root', 'Body_Main', 'Head_Pivot', 'Arm0', 'TailFan'],
    meganeura: ['Minion_Root', 'Body_Main', 'Head_Pivot', 'WingPivot0', 'WingPivot3', 'Leg0', 'TailFan'],
    arthropleura: ['Minion_Root', 'Body_Main', 'Head_Pivot', 'Seg0', 'Seg5', 'Leg0', 'Antennule0', 'TailFan'],
    synapsid: ['Minion_Root', 'Body_Main', 'Head_Pivot', 'Leg0', 'Leg3', 'TailFan'],
    scutosaurus: ['Minion_Root', 'Body_Main', 'Head_Pivot', 'Leg0', 'Leg3', 'TailFan'],
    raptor: ['Minion_Root', 'Body_Main', 'Head_Pivot', 'Arm0', 'Leg0', 'Leg1', 'TailFan'],
    triassic_hound: ['Minion_Root', 'Body_Main', 'Head_Pivot', 'Leg0', 'Leg3', 'TailFan'],
    dino_tank: ['Minion_Root', 'Body_Main', 'Head_Pivot', 'Leg0', 'Leg3', 'TailFan'],
    magma_ceratopsian: ['Minion_Root', 'Body_Main', 'Head_Pivot', 'Leg0', 'Leg3', 'TailFan'],
    mammal: ['Minion_Root', 'Body_Main', 'Head_Pivot', 'Leg0', 'Leg3', 'TailFan'],
    serpent: ['Minion_Root', 'Body_Main', 'Head_Pivot', 'Seg0', 'Seg5', 'TailFan'],
    bird_pterosaur: ['Minion_Root', 'Body_Main', 'Head_Pivot', 'WingPivot0', 'WingPivot1', 'Leg0', 'TailFan'],
    glacier_panther: ['Minion_Root', 'Body_Main', 'Head_Pivot', 'Leg0', 'Leg3', 'TailFan'],
};

const EXPECTED_CAMPAIGN_NODES = {
    boss_cameroceras: EXPECTED_BONES.spinosaurus.concat(['Special_Sail']),
    boss_jaekelopterus: EXPECTED_BONES.pulmonoscorpius.concat(['Special_Stinger']),
    boss_dunkleosteus: EXPECTED_BONES.postosuchus,
    boss_dimetrodon: EXPECTED_BONES.postosuchus.concat(['Special_Sail']),
    boss_pyroclast: EXPECTED_BONES.trex,
    boss_wendigo: EXPECTED_BONES.giantsloth,
    pickup_meat: ['Prop_Root'],
    pickup_amber: ['Prop_Root'],
    hazard_meteor: ['Prop_Root'],
    hazard_boulder: ['Prop_Root'],
    hazard_icicle: ['Prop_Root'],
};

function parseGlbJson(filePath) {
    const buf = fs.readFileSync(filePath);
    if (buf.length < 20) throw new Error(`File too small: ${buf.length} bytes`);
    const magic = buf.toString('ascii', 0, 4);
    if (magic !== 'glTF') throw new Error(`Invalid GLB magic "${magic}"`);
    const version = buf.readUInt32LE(4);
    if (version !== 2) throw new Error(`Unexpected glTF version ${version}`);
    const chunk0Len = buf.readUInt32LE(12);
    const chunk0Type = buf.toString('ascii', 16, 20);
    if (chunk0Type !== 'JSON') throw new Error(`First chunk not JSON: ${chunk0Type}`);
    const jsonStr = buf.toString('utf8', 20, 20 + chunk0Len);
    return { size: buf.length, json: JSON.parse(jsonStr) };
}

function verifyGlbBatch(label, dir, expectedMap) {
    let batchFailures = 0;
    console.log(`\n=== Verifying ${Object.keys(expectedMap).length} ${label} GLB models ===`);
    for (const [id, reqNodes] of Object.entries(expectedMap)) {
        const glbPath = path.join(dir, `${id}.glb`);
        if (!fs.existsSync(glbPath)) {
            console.error(`FAIL [${id}]: missing ${glbPath}`);
            batchFailures++;
            continue;
        }
        try {
            const { size, json } = parseGlbJson(glbPath);
            const names = new Set((json.nodes || []).map((n) => n.name).filter(Boolean));
            const missing = reqNodes.filter((b) => !names.has(b));
            const meshes = (json.meshes || []).length;
            if (missing.length > 0 || meshes === 0) {
                console.error(`FAIL [${id}]: missing nodes [${missing.join(', ')}], meshes=${meshes}`);
                batchFailures++;
            } else {
                console.log(`PASS [${id}]: ${(size / 1024).toFixed(1)} KB, nodes=${names.size}, meshes=${meshes}`);
            }
        } catch (err) {
            console.error(`FAIL [${id}]: ${err.message}`);
            batchFailures++;
        }
    }
    return batchFailures;
}

const failures =
    verifyGlbBatch('FIGHTER', MODEL_DIR, EXPECTED_BONES) +
    verifyGlbBatch('MINION', MINION_MODEL_DIR, EXPECTED_MINION_NODES) +
    verifyGlbBatch('CAMPAIGN', CAMPAIGN_MODEL_DIR, EXPECTED_CAMPAIGN_NODES);

if (failures > 0) {
    console.error(`\n${failures} GLB check(s) failed.`);
    process.exit(1);
}
const totalVerified =
    Object.keys(EXPECTED_BONES).length +
    Object.keys(EXPECTED_MINION_NODES).length +
    Object.keys(EXPECTED_CAMPAIGN_NODES).length;
console.log(`\nALL ${totalVerified} GLB MODELS (FIGHTERS + MINIONS + CAMPAIGN) VERIFIED!`);
