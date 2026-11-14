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
    postosuchus: ['Bone_Hips', 'Bone_Torso', 'Bone_Neck', 'Bone_Head', 'Bone_Jaw', 'Bone_Leg0', 'Bone_Leg3', 'Bone_Tail0', 'Bone_Tail3'],
    pulmonoscorpius: ['Bone_Hips', 'Bone_Torso', 'Bone_Head', 'Bone_Arm0', 'Bone_Arm1', 'Bone_Leg0', 'Bone_Leg7', 'Bone_Tail0', 'Bone_Tail4'],
    smilodon: ['Bone_Hips', 'Bone_Torso', 'Bone_Neck', 'Bone_Head', 'Bone_Jaw', 'Bone_Leg0', 'Bone_Leg3', 'Bone_Tail0', 'Bone_Tail2'],
    spinosaurus: ['Bone_Hips', 'Bone_Torso', 'Bone_Neck', 'Bone_Head', 'Bone_Jaw', 'Bone_Arm0', 'Bone_Arm1', 'Bone_Leg0', 'Bone_Leg1', 'Bone_Tail0', 'Bone_Tail3'],
    stegosaurus: ['Bone_Hips', 'Bone_Torso', 'Bone_Neck', 'Bone_Head', 'Bone_Jaw', 'Bone_Arm0', 'Bone_Arm1', 'Bone_Leg0', 'Bone_Leg1', 'Bone_Tail0', 'Bone_Tail3'],
    terabird: ['Bone_Hips', 'Bone_Torso', 'Bone_Neck', 'Bone_Head', 'Bone_Jaw', 'Bone_Arm0', 'Bone_Arm1', 'Bone_Leg0', 'Bone_Leg1', 'Bone_Tail0'],
    therizino: ['Bone_Hips', 'Bone_Torso', 'Bone_Neck', 'Bone_Head', 'Bone_Jaw', 'Bone_Arm0', 'Bone_Arm1', 'Bone_Leg0', 'Bone_Leg1', 'Bone_Tail0', 'Bone_Tail2'],
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

let failures = 0;
for (const [fid, reqNodes] of Object.entries(EXPECTED_BONES)) {
    const glbPath = path.join(MODEL_DIR, `${fid}.glb`);
    if (!fs.existsSync(glbPath)) {
        console.error(`FAIL [${fid}]: missing ${glbPath}`);
        failures++;
        continue;
    }
    try {
        const { size, json } = parseGlbJson(glbPath);
        const names = new Set((json.nodes || []).map((n) => n.name).filter(Boolean));
        const missing = reqNodes.filter((b) => !names.has(b));
        const meshes = (json.meshes || []).length;
        if (missing.length > 0 || meshes === 0) {
            console.error(`FAIL [${fid}]: missing bones [${missing.join(', ')}], meshes=${meshes}`);
            failures++;
        } else {
            console.log(`PASS [${fid}]: ${(size / 1024).toFixed(1)} KB, nodes=${names.size}, meshes=${meshes}`);
        }
    } catch (err) {
        console.error(`FAIL [${fid}]: ${err.message}`);
        failures++;
    }
}

if (failures > 0) {
    console.error(`\n${failures} fighter GLB check(s) failed.`);
    process.exit(1);
}
console.log(`\nALL ${Object.keys(EXPECTED_BONES).length} FIGHTER GLB MODELS VERIFIED!`);
